const REFPTR = (fixed) => String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

struct Note {
    std::string text;
    explicit Note(std::string t) : text(std::move(t)) {}
    ~Note() {
        std::println("удалена {}", text);
    }
};

class NotePtr {
public:
    NotePtr() = default;
    explicit NotePtr(Note *p) : block_(new Block{p, 1}) {}
    NotePtr(const NotePtr &other) : block_(other.block_) {
        if (block_) {
            ++block_->count;
        }
    }
    NotePtr &operator=(const NotePtr &other) {
${
  fixed
    ? `        Block *incoming = other.block_; // запомнить до release(): other может быть *this
        if (incoming) {
            ++incoming->count;
        }
        release();
        block_ = incoming;`
    : `        release();
        block_ = other.block_;
        if (block_) {
            ++block_->count;
        }`
}
        return *this;
    }
    ~NotePtr() {
        release();
    }

    const Note *get() const {
        return block_ ? block_->object : nullptr;
    }
    long use_count() const {
        return block_ ? block_->count : 0;
    }

private:
    struct Block {
        Note *object;
        long count;
    };

    void release() {
        if (block_ && --block_->count == 0) {
            delete block_->object;
            delete block_;
        }
        block_ = nullptr;
    }

    Block *block_ = nullptr;
};

int main() {
    std::map<std::string, NotePtr> notes;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "new") {
            std::string text;
            std::cin >> text;
            notes[x] = NotePtr(new Note(text));
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            notes[x] = notes[from];
        } else if (const Note *n = notes[x].get()) {
            std::println("{}: {} (владельцев {})", x, n->text, notes[x].use_count());
        } else {
            std::println("{}: пусто", x);
        }
    }
    return 0;
}`;

const TRACKED = String.raw`struct Item {
    static inline int alive = 0;
    std::string name;
    explicit Item(std::string n) : name(std::move(n)) {
        ++alive;
        std::println("создан {}", name);
    }
    ~Item() {
        --alive;
        std::println("удалён {}", name);
    }
};`;

export default {
  id: 'lifetime-reference-counting',
  title: 'Подсчёт ссылок',
  description:
    'Как устроен shared_ptr изнутри: блок управления со счётчиком, собственный умный указатель с подсчётом ссылок; отличия настоящего shared_ptr — атомарный счётчик, счётчики владельцев и наблюдателей, удалитель, make_shared и задержка освобождения памяти; конструктор-псевдоним для указателей на поля; встроенный счётчик; порядок операций при присваивании.',
  moduleId: 'cpp-lifetime',
  order: 21,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-shared-ptr'],
  objectives: [
    'Реализовывать подсчёт ссылок по правилу пяти',
    'Объяснять роли счётчиков владельцев и наблюдателей',
    'Пользоваться конструктором-псевдонимом shared_ptr',
    'Писать присваивание счётчика, корректное при самоприсваивании',
  ],
  tags: ['C++23', 'Время жизни', 'shared_ptr', 'Подсчёт ссылок', 'Блок управления'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Где shared_ptr хранит счётчик владельцев?',
      options: [
        'В блоке управления, общем для всех копий',
        'В самом объекте',
        'В каждой копии shared_ptr отдельно',
        'В глобальной таблице',
      ],
      correct: 0,
      explain: 'Встроенный счётчик в самом объекте — другая схема (intrusive).',
    },
    {
      q: 'Когда удаляется блок управления shared_ptr?',
      options: [
        'Когда нет ни владельцев, ни наблюдателей (weak_ptr)',
        'Когда нет владельцев',
        'Вместе с первым shared_ptr',
        'Никогда',
      ],
      correct: 0,
      explain: 'weak_ptr должен уметь узнать, жив ли объект, даже после его удаления.',
    },
    {
      q: 'Объект создан через make_shared, остались только weak_ptr. Что с его памятью?',
      options: [
        'Деструктор вызван, но память объекта освободится вместе с блоком',
        'Память уже освобождена',
        'Деструктор не вызван',
        'Объект продолжает жить',
      ],
      correct: 0,
      explain: 'Объект и блок — одно выделение памяти.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>

struct S {
    int a = 1;
    int b = 2;
};

int main() {
    auto s = std::make_shared<S>();
    std::shared_ptr<int> p(s, &s->b);
    std::println("{}", s.use_count());
    s.reset();
    std::println("{} {}", *p, p.use_count());
    return 0;
}`,
      lang: 'cpp',
      answers: ['2\n2 1'],
      placeholder: 'Вывод программы',
      explain: 'Псевдоним p — второй владелец всего объекта S, хотя указывает на поле b.',
    },
    {
      q: 'Почему копирование std::shared_ptr дороже копирования сырого указателя?',
      options: [
        'Нужно атомарно увеличить счётчик в блоке управления',
        'Копируется объект',
        'Выделяется новый блок управления',
        'Оно не дороже',
      ],
      correct: 0,
      explain: 'Атомарная операция синхронизирует кэши ядер процессора.',
    },
    {
      q: 'В каком порядке безопасно выполнять присваивание p = q в своём счётчике ссылок?',
      options: [
        'Сначала увеличить счётчик q, потом уменьшить счётчик старого p',
        'Сначала уменьшить старый, потом увеличить новый',
        'Порядок не важен',
        'Только уменьшить старый',
      ],
      correct: 0,
      explain: 'Иначе при p = p объект удалится раньше, чем счётчик увеличится.',
    },
    {
      q: 'Чем встроенный (intrusive) счётчик отличается от shared_ptr?',
      options: [
        'Счётчик хранится в самом объекте, блок управления не нужен',
        'Он всегда атомарный',
        'Он не удаляет объект',
        'Ничем',
      ],
      correct: 0,
      explain: 'Так устроены COM-объекты и boost::intrusive_ptr.',
    },
    {
      q: 'Как называется конструктор shared_ptr, который указывает на одно, а владеет другим? Конструктор-…',
      answers: ['псевдоним', 'aliasing', 'алиас'],
      placeholder: 'Одно слово',
      explain: 'std::shared_ptr<U>(owner, ptr).',
    },
  ],
  exercises: [
    {
      id: 'lifetime-reference-counting-exercise',
      title: 'Свой счётчик',
      difficulty: 'intermediate',
      description: `
Напишите шаблон \`RefPtr<T>\` с подсчётом ссылок: блок \`{ T *object; long count; }\`, пустое состояние (\`nullptr\`), конструктор из \`T *\`, все пять специальных функций, \`get()\`, \`use_count()\` (0 у пустого), \`reset()\`. Перемещение передаёт блок, не трогая счётчик.

Структура \`Item\` печатает \`создан имя\` и \`удалён имя\`. Указатели \`RefPtr<Item>\` хранятся в \`std::map<std::string, RefPtr<Item>>\` (\`operator[]\` создаёт пустой). Команды:

- \`new X имя\` — \`ptrs[X] = RefPtr<Item>(new Item(имя))\`;
- \`copy Y X\` — \`ptrs[Y] = ptrs[X]\`;
- \`move Y X\` — \`ptrs[Y] = std::move(ptrs[X])\`;
- \`reset X\`;
- \`count X\` — \`X: имя (владельцев K)\` или \`X: пусто\`.

В конце сбросьте указатели от последнего имени к первому.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Оба присваивания удобно сделать одним: RefPtr &operator=(RefPtr other) noexcept { std::swap(block_, other.block_); return *this; } — параметр копируется или перемещается.',
        'Перемещающий конструктор: block_(std::exchange(other.block_, nullptr)) — счётчик не меняется.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

${TRACKED}

template <class T>
class RefPtr {
public:
    RefPtr() = default;
    explicit RefPtr(T *p) : block_(new Block{p, 1}) {}
    RefPtr(const RefPtr &other) : block_(other.block_) {
        if (block_) {
            ++block_->count;
        }
    }
    RefPtr(RefPtr &&other) noexcept : block_(std::exchange(other.block_, nullptr)) {}
    RefPtr &operator=(RefPtr other) noexcept {
        std::swap(block_, other.block_);
        return *this;
    }
    ~RefPtr() {
        reset();
    }

    void reset() {
        if (block_ && --block_->count == 0) {
            delete block_->object;
            delete block_;
        }
        block_ = nullptr;
    }

    T *get() const {
        return block_ ? block_->object : nullptr;
    }
    long use_count() const {
        return block_ ? block_->count : 0;
    }

private:
    struct Block {
        T *object;
        long count;
    };
    Block *block_ = nullptr;
};

int main() {
    std::map<std::string, RefPtr<Item>> ptrs;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "new") {
            std::string name;
            std::cin >> name;
            ptrs[x] = RefPtr<Item>(new Item(name));
        } else if (command == "copy" || command == "move") {
            std::string from;
            std::cin >> from;
            if (command == "copy") {
                ptrs[x] = ptrs[from];
            } else {
                ptrs[x] = std::move(ptrs[from]);
            }
        } else if (command == "reset") {
            ptrs[x].reset();
        } else if (const Item *item = ptrs[x].get()) {
            std::println("{}: {} (владельцев {})", x, item->name, ptrs[x].use_count());
        } else {
            std::println("{}: пусто", x);
        }
    }
    for (auto it = ptrs.rbegin(); it != ptrs.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
Вся логика владения — в трёх местах: конструктор копирования увеличивает счётчик, \`reset\` (и деструктор через него) уменьшает и удаляет объект с блоком на нуле, перемещение передаёт блок без изменения счётчика. Единый оператор присваивания по значению работает и для копирования, и для перемещения и безопасен при \`copy X X\`: параметр становится лишним владельцем до того, как старый указатель отпустит объект.`,
      examples: [
        {
          in: 'new a кот\ncopy b a\ncount a\nmove c b\ncount b\nreset a\ncount c\nreset c\n',
          out: 'создан кот\na: кот (владельцев 2)\nb: пусто\nc: кот (владельцев 1)\nудалён кот\n',
        },
        { in: 'new a x\nnew a y\n', out: 'создан x\nсоздан y\nудалён x\nудалён y\n' },
      ],
      hidden: [
        { in: 'count z\n', name: 'Пустой' },
        { in: 'new a x\ncopy a a\ncount a\n', name: 'Самокопирование' },
        { in: 'new a x\nmove a a\ncount a\n', name: 'Самоперемещение' },
        {
          in: 'new a x\ncopy b a\ncopy c b\nreset a\nreset b\ncount c\n',
          name: 'Последний владелец',
        },
        { in: 'new a x\nnew b y\ncopy a b\ncount a\n', name: 'Копия поверх' },
        { in: 'copy a b\ncount a\n', name: 'Копия пустого' },
        { in: 'new z 1\nnew a 2\ncopy m z\n', name: 'Удаление в конце' },
        {
          in: 'new a x\nmove b a\nmove c b\ncount c\nreset c\ncount c\n',
          name: 'Цепочка перемещений',
        },
      ],
    },
    {
      title: 'Указатели на поля',
      description: `
Конфигурация \`Config\` (поля \`std::string name\`, \`int volume\`, \`std::string theme\`) печатает \`загружена имя\` и \`выгружена имя\`. Текущая конфигурация хранится в \`std::shared_ptr<Config> current\`. Ручки на поля — псевдонимы: \`std::shared_ptr<const int>\` для громкости и \`std::shared_ptr<const std::string>\` для темы.

Команды:

- \`load имя громкость тема\` — \`current = std::make_shared<Config>(…)\`;
- \`volume H\` — ручка H на громкость текущей конфигурации; \`theme H\` — на тему (\`std::map\` для каждого вида ручек);
- \`drop\` — \`current.reset()\`;
- \`get H\` — \`H = значение\` (ручки громкости и темы имеют разные имена);
- \`release H\` — сбросить ручку.

В конце сбросьте \`current\`, затем ручки громкости и ручки темы — каждые от последнего имени к первому.`,
      constraints: [
        'Команд не больше 200; volume и theme выполняются только при загруженной конфигурации; имена ручек уникальны.',
      ],
      hints: [
        'std::shared_ptr<const int> h(current, &current->volume); — указывает на поле, владеет всей конфигурацией.',
        'Конфигурация выгружается, когда отпущены и current, и все ручки на её поля.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Config {
    std::string name;
    int volume;
    std::string theme;
    Config(std::string n, int v, std::string t) : name(std::move(n)), volume(v), theme(std::move(t)) {
        std::println("загружена {}", name);
    }
    ~Config() {
        std::println("выгружена {}", name);
    }
};

template <class Map>
void release_all(Map &handles) {
    for (auto it = handles.rbegin(); it != handles.rend(); ++it) {
        it->second.reset();
    }
}

int main() {
    std::shared_ptr<Config> current;
    std::map<std::string, std::shared_ptr<const int>> volumes;
    std::map<std::string, std::shared_ptr<const std::string>> themes;
    std::string command;
    while (std::cin >> command) {
        if (command == "load") {
            std::string name, theme;
            int volume;
            std::cin >> name >> volume >> theme;
            current = std::make_shared<Config>(name, volume, theme);
        } else if (command == "drop") {
            current.reset();
        } else {
            std::string h;
            std::cin >> h;
            if (command == "volume") {
                volumes[h] = std::shared_ptr<const int>(current, &current->volume);
            } else if (command == "theme") {
                themes[h] = std::shared_ptr<const std::string>(current, &current->theme);
            } else if (command == "release") {
                if (volumes.contains(h)) {
                    volumes[h].reset();
                } else if (themes.contains(h)) {
                    themes[h].reset();
                }
            } else if (auto v = volumes.find(h); v != volumes.end() && v->second) {
                std::println("{} = {}", h, *v->second);
            } else if (auto t = themes.find(h); t != themes.end() && t->second) {
                std::println("{} = {}", h, *t->second);
            } else {
                std::println("{} = пусто", h);
            }
        }
    }
    current.reset();
    release_all(volumes);
    release_all(themes);
    return 0;
}`,
      explanation: `
Ручка на поле указывает на \`int\` или строку, но владеет всей конфигурацией: она хранит указатель на поле и блок управления конфигурации. Поэтому \`drop\` или загрузка новой конфигурации не выгружают старую, пока на её поля есть ручки, — и обращение к полю никогда не повиснет.

Без конструктора-псевдонима пришлось бы либо раздавать \`shared_ptr<Config>\` (и открывать всю конфигурацию), либо сырые указатели на поля (и рисковать висячими указателями).`,
      examples: [
        {
          in: 'load прод 7 тёмная\nvolume v\ntheme t\nload тест 3 светлая\nget v\nrelease v\nget t\nrelease t\n',
          out: 'загружена прод\nзагружена тест\nv = 7\nt = тёмная\nвыгружена прод\nвыгружена тест\n',
        },
        { in: 'load a 1 x\ndrop\n', out: 'загружена a\nвыгружена a\n' },
      ],
      hidden: [
        { in: 'load a 5 x\nvolume v\ndrop\nget v\n', name: 'Ручка держит конфигурацию' },
        { in: 'load a 5 x\ntheme t\nrelease t\nget t\n', name: 'Отпущенная ручка' },
        {
          in: 'load a 1 x\nvolume v1\nvolume v2\ndrop\nrelease v1\nrelease v2\n',
          name: 'Две ручки',
        },
        { in: 'load a 1 x\nload b 2 y\nload c 3 z\n', name: 'Замена без ручек' },
        {
          in: 'load a 1 x\ntheme t\nload b 2 y\ntheme u\nget t\nget u\n',
          name: 'Ручки разных конфигураций',
        },
        { in: 'get nothing\n', name: 'Несуществующая ручка' },
        {
          in: 'load a 9 ночь\nvolume v\ntheme t\ndrop\nget v\nget t\n',
          name: 'Обе ручки после drop',
        },
        { in: 'load a 1 x\nvolume v\nload a 2 y\nget v\n', name: 'Одинаковые имена конфигураций' },
      ],
    },
    {
      title: 'Найди ошибку: самоприсваивание',
      bug: true,
      description: `
Самодельный умный указатель \`NotePtr\` с подсчётом ссылок хранит заметки. Команды: \`new X текст\`, \`copy Y X\` (\`notes[Y] = notes[X]\`), \`show X\` — \`X: текст (владельцев K)\` или \`X: пусто\`. Заметка печатает \`удалена текст\` при удалении.

Пока имена в \`copy\` разные, всё работает. После команды вида \`copy a a\` заметка пропадает. Исправьте копирующее присваивание.`,
      constraints: ['Команд не больше 100.'],
      hints: [
        'Что делает release(), если other — это *this и владелец единственный?',
        'Запомните блок other в локальной переменной и увеличьте его счётчик до того, как отпустить старый: release() обнуляет block_, а при самоприсваивании это и other.block_.',
      ],
      starter: REFPTR(false),
      solution: REFPTR(true),
      explanation: `
Присваивание сначала отпускает свой блок, а потом берёт блок \`other\`. Если \`other\` — это \`*this\` и владелец единственный, \`release()\` удаляет заметку и блок и обнуляет указатель, а затем \`block_ = other.block_\` копирует уже обнулённое значение — заметка потеряна. Без обнуления в \`release\` было бы ещё хуже: увеличение счётчика записало бы в освобождённый блок.

Правильный порядок — запомнить блок \`other\` в локальной переменной и увеличить его счётчик, потом отпустить старый и взять запомненный: при самоприсваивании счётчик на время станет 2, затем снова 1, и ничего не удалится. Запоминать обязательно: \`release()\` обнуляет \`block_\`, а когда \`other\` — это \`*this\`, вместе с ним обнуляется и \`other.block_\`; строка \`block_ = other.block_\` после \`release()\` потеряла бы блок с завышенным счётчиком — утечку. Вариант «по значению и обмен» получает правильный порядок автоматически.`,
      examples: [
        {
          in: 'new a заметка\ncopy a a\nshow a\n',
          out: 'a: заметка (владельцев 1)\nудалена заметка\n',
        },
        { in: 'new a x\ncopy b a\nshow b\n', out: 'b: x (владельцев 2)\nудалена x\n' },
      ],
      hidden: [
        'new a x\ncopy a a\ncopy a a\nshow a\n',
        'new a x\ncopy b a\ncopy b b\nshow b\n',
        'new a длинная-заметка\ncopy a a\nshow a\n',
        'new a 1\nnew b 2\ncopy a b\ncopy a a\nshow a\n',
        'new p q\ncopy p p\n',
        'new a x\ncopy b a\ncopy c b\ncopy c c\nshow c\n',
        'new x y\ncopy x x\nshow x\nnew x z\n',
        'new m n\ncopy m m\ncopy k m\nshow k\n',
      ],
    },
    {
      title: 'Слабые ссылки своими руками',
      difficulty: 'advanced',
      description: `
Расширьте подсчёт ссылок слабыми ссылками. Блок управления: \`{ Item *object; long strong; long weak; }\`. Статические счётчики: живых объектов и живых блоков.

- \`Strong\` — владелец: увеличивает \`strong\`; когда \`strong\` стал 0 — удаляет объект (\`object = nullptr\`), а если и \`weak\` = 0 — удаляет блок.
- \`Weak\` — наблюдатель: увеличивает \`weak\`; когда \`weak\` стал 0 и \`strong\` = 0 — удаляет блок. \`lock()\` возвращает \`Strong\` на объект, если \`strong > 0\`, иначе пустой \`Strong\`. \`expired()\` — \`strong == 0\`.

Обе обёртки копируемые и перемещаемые (присваивание по значению с обменом). \`Item\` печатает \`создан имя\`/\`удалён имя\`.

Команды (\`std::map\` для сильных и для слабых, \`operator[]\` создаёт пустые): \`new S имя\`, \`watch W S\` (\`weak[W] = Weak(strong[S])\`), \`lock S W\` (\`strong[S] = weak[W].lock()\`), \`reset S\`, \`forget W\`, \`check W\` — \`W: жив имя\` или \`W: истёк\`, \`stats\` — \`объектов A, блоков B\`. В конце сбросьте все сильные, затем все слабые (от последнего имени к первому) и напечатайте \`stats\`.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Сильная сторона: void reset() { if (b_) { if (--b_->strong == 0) { delete b_->object; b_->object = nullptr; if (b_->weak == 0) { delete b_; --blocks; } } b_ = nullptr; } }',
        'lock(): если блок есть и strong > 0 — создать Strong, разделяющий тот же блок (конструктор из блока, увеличивающий strong).',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

${TRACKED}

struct Block {
    static inline int alive = 0;
    Item *object;
    long strong;
    long weak;
};

class Strong {
public:
    Strong() = default;
    explicit Strong(Item *p) : b_(new Block{p, 1, 0}) {
        ++Block::alive;
    }
    explicit Strong(Block *b) : b_(b) {
        ++b_->strong;
    }
    Strong(const Strong &o) : b_(o.b_) {
        if (b_) {
            ++b_->strong;
        }
    }
    Strong(Strong &&o) noexcept : b_(std::exchange(o.b_, nullptr)) {}
    Strong &operator=(Strong o) noexcept {
        std::swap(b_, o.b_);
        return *this;
    }
    ~Strong() {
        reset();
    }

    void reset() {
        if (b_) {
            if (--b_->strong == 0) {
                delete b_->object;
                b_->object = nullptr;
                if (b_->weak == 0) {
                    delete b_;
                    --Block::alive;
                }
            }
            b_ = nullptr;
        }
    }

    Block *block() const {
        return b_;
    }

private:
    Block *b_ = nullptr;
};

class Weak {
public:
    Weak() = default;
    explicit Weak(const Strong &s) : b_(s.block()) {
        if (b_) {
            ++b_->weak;
        }
    }
    Weak(const Weak &o) : b_(o.b_) {
        if (b_) {
            ++b_->weak;
        }
    }
    Weak(Weak &&o) noexcept : b_(std::exchange(o.b_, nullptr)) {}
    Weak &operator=(Weak o) noexcept {
        std::swap(b_, o.b_);
        return *this;
    }
    ~Weak() {
        reset();
    }

    void reset() {
        if (b_) {
            if (--b_->weak == 0 && b_->strong == 0) {
                delete b_;
                --Block::alive;
            }
            b_ = nullptr;
        }
    }

    bool expired() const {
        return !b_ || b_->strong == 0;
    }

    Strong lock() const {
        return expired() ? Strong() : Strong(b_);
    }

    const Item *peek() const {
        return expired() ? nullptr : b_->object;
    }

private:
    Block *b_ = nullptr;
};

template <class Map>
void reset_all(Map &m) {
    for (auto it = m.rbegin(); it != m.rend(); ++it) {
        it->second.reset();
    }
}

void stats() {
    std::println("объектов {}, блоков {}", Item::alive, Block::alive);
}

int main() {
    std::map<std::string, Strong> strong;
    std::map<std::string, Weak> weak;
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            stats();
            continue;
        }
        std::string a;
        std::cin >> a;
        if (command == "new") {
            std::string name;
            std::cin >> name;
            strong[a] = Strong(new Item(name));
        } else if (command == "watch") {
            std::string s;
            std::cin >> s;
            weak[a] = Weak(strong[s]);
        } else if (command == "lock") {
            std::string w;
            std::cin >> w;
            strong[a] = weak[w].lock();
        } else if (command == "reset") {
            strong[a].reset();
        } else if (command == "forget") {
            weak[a].reset();
        } else if (const Item *item = weak[a].peek()) {
            std::println("{}: жив {}", a, item->name);
        } else {
            std::println("{}: истёк", a);
        }
    }
    reset_all(strong);
    reset_all(weak);
    stats();
    return 0;
}`,
      explanation: `
Два счётчика разделяют две жизни: объекта и блока. Объект живёт, пока есть сильные ссылки; блок — пока есть хоть какие-то, потому что слабые ссылки должны иметь возможность спросить «жив ли объект?» и после его удаления. Последний из всех ссылок удаляет блок. Именно так устроены \`std::shared_ptr\` и \`std::weak_ptr\`, только счётчики там атомарные, а \`lock()\` атомарно проверяет и увеличивает \`strong\`.

Итоговая статистика — проверка баланса: после сброса всех ссылок не должно остаться ни объектов, ни блоков.`,
      examples: [
        {
          in: 'new a кот\nwatch w a\ncheck w\nstats\nreset a\ncheck w\nstats\nforget w\nstats\n',
          out: 'создан кот\nw: жив кот\nобъектов 1, блоков 1\nудалён кот\nw: истёк\nобъектов 0, блоков 1\nобъектов 0, блоков 0\nобъектов 0, блоков 0\n',
        },
        {
          in: 'new a x\nwatch w a\nlock b w\nreset a\ncheck w\n',
          out: 'создан x\nw: жив x\nудалён x\nобъектов 0, блоков 0\n',
        },
      ],
      hidden: [
        { in: 'check w\nstats\n', name: 'Пустая слабая ссылка' },
        {
          in: 'new a x\nwatch w a\nreset a\nlock b w\ncheck w\nstats\n',
          name: 'lock после удаления',
        },
        { in: 'new a x\nwatch w1 a\nwatch w2 w1\nstats\n', name: 'Слабая из пустой сильной' },
        {
          in: 'new a x\nwatch w a\nwatch v a\nreset a\nforget w\nstats\nforget v\nstats\n',
          name: 'Две слабые ссылки',
        },
        { in: 'new a x\nnew a y\nwatch w a\ncheck w\n', name: 'Замена объекта' },
        { in: 'new a x\nlock b nothing\nstats\n', name: 'lock пустой' },
        {
          in: 'new a x\nwatch w a\nforget w\nreset a\nstats\n',
          name: 'Сначала забыть, потом сбросить',
        },
        {
          in: 'new a 1\nnew b 2\nwatch w a\nwatch v b\nreset b\ncheck w\ncheck v\n',
          name: 'Два объекта',
        },
      ],
    },
  ],
};
