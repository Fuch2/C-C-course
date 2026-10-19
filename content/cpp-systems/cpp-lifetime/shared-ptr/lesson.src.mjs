const SESSIONS = (fixed) => String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Session;

struct Registry {
    std::vector<std::shared_ptr<Session>> active;
};

class Session${fixed ? ' : public std::enable_shared_from_this<Session>' : ''} {
public:
    explicit Session(std::string user) : user_(std::move(user)) {}

    void start(Registry &registry) {
        registry.active.push_back(${fixed ? 'shared_from_this()' : 'std::shared_ptr<Session>(this)'});
        std::println("старт {}", user_);
    }

    const std::string &user() const {
        return user_;
    }

private:
    std::string user_;
};

int main() {
    Registry registry;
    std::string user;
    while (std::cin >> user) {
        auto session = std::make_shared<Session>(user);
        session->start(registry);
    }
    std::println("активных {}", registry.active.size());
    for (const auto &s : registry.active) {
        std::println("- {}", s->user());
    }
    return 0;
}`;

export default {
  id: 'lifetime-shared-ptr',
  title: 'std::shared_ptr: совместное владение',
  description:
    'Совместное владение и счётчик владельцев; блок управления, make_shared и одно выделение памяти; цена копирования и атомарный счётчик; когда shared_ptr действительно нужен и почему по умолчанию unique_ptr; общие неизменяемые данные shared_ptr<const T>; ошибка двух блоков управления и enable_shared_from_this; копирование при записи.',
  moduleId: 'cpp-lifetime',
  order: 20,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-make-unique'],
  objectives: [
    'Объяснять, когда объект под shared_ptr удаляется',
    'Понимать устройство и цену блока управления',
    'Выбирать между unique_ptr и shared_ptr',
    'Избегать второго блока управления',
  ],
  tags: ['C++23', 'Время жизни', 'shared_ptr', 'Умные указатели', 'Совместное владение'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Когда удаляется объект, которым владеют несколько shared_ptr?',
      options: [
        'Когда уничтожается или сбрасывается последний владелец',
        'Когда уничтожается первый владелец',
        'В конце программы',
        'При вызове use_count()',
      ],
      correct: 0,
      explain: 'Счётчик владельцев доходит до нуля.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>
#include <utility>

int main() {
    auto a = std::make_shared<int>(1);
    auto b = a;
    auto c = std::move(b);
    std::shared_ptr<int> d;
    d = c;
    std::println("{} {}", a.use_count(), b == nullptr);
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 true'],
      placeholder: 'Вывод программы',
      explain: 'Владельцы — a, c и d; перемещение из b не добавило владельца, а b стал пустым.',
    },
    {
      q: 'Чем std::make_shared<T>(…) лучше std::shared_ptr<T>(new T(…))?',
      options: [
        'Объект и блок управления выделяются одним вызовом',
        'Он не создаёт блок управления',
        'Он делает указатель уникальным',
        'Ничем',
      ],
      correct: 0,
      explain: 'Меньше выделений и лучше локальность в памяти.',
    },
    {
      q: 'Что в shared_ptr потокобезопасно?',
      options: ['Счётчик владельцев', 'Сам объект', 'И то и другое', 'Ничего'],
      correct: 0,
      explain:
        'Изменять объект из разных потоков нужно с синхронизацией; shared_ptr<const T> делает общий объект неизменяемым.',
    },
    {
      q: 'Что произойдёт при std::shared_ptr<int> a(raw); std::shared_ptr<int> b(raw);?',
      options: [
        'Два блока управления и двойное удаление',
        'Счётчик станет равен 2',
        'Ошибка компиляции',
        'Утечка',
      ],
      correct: 0,
      explain: 'Каждый shared_ptr, созданный из сырого указателя, заводит свой блок управления.',
    },
    {
      q: 'Как объекту получить shared_ptr на самого себя?',
      options: [
        'Унаследовать std::enable_shared_from_this<T> и вызвать shared_from_this()',
        'std::shared_ptr<T>(this)',
        'std::make_shared<T>(*this)',
        'Это невозможно',
      ],
      correct: 0,
      explain: 'shared_from_this использует существующий блок управления.',
    },
    {
      q: 'Функции нужен только объект для чтения. Какой параметр выбрать?',
      options: [
        'const T &',
        'std::shared_ptr<T>',
        'const std::shared_ptr<T> &',
        'std::shared_ptr<T> &&',
      ],
      correct: 0,
      explain: 'shared_ptr по значению — для новых совладельцев.',
    },
    {
      q: 'Как называется отдельная структура в куче, где shared_ptr хранит счётчики и удалитель? Блок …',
      answers: ['управления', 'блок управления', 'control block'],
      placeholder: 'Одно слово',
      explain: 'Его создаёт первый shared_ptr для объекта.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-shared-ptr-exercise',
      title: 'Общий документ',
      difficulty: 'beginner',
      description: `
Документ \`Doc\` печатает \`создан название\` и \`удалён название\`. Редакторы хранят документы в \`std::map<std::string, std::shared_ptr<Doc>>\` (\`operator[]\` создаёт пустой указатель). Команды:

- \`new E название\` — \`editors[E] = std::make_shared<Doc>(название)\`;
- \`open E F\` — редактор E открывает тот же документ, что у F: \`editors[E] = editors[F]\`;
- \`close E\` — \`editors[E].reset()\`;
- \`who E\` — \`E: название (владельцев K)\` или \`E: пусто\`.

В конце сбросьте указатели редакторов от последнего имени к первому.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Документ удаляется, только когда его закрыл последний редактор, — печатать «удалён» вручную не нужно.',
        'use_count() показывает число владельцев документа.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Doc {
    std::string name;
    explicit Doc(std::string n) : name(std::move(n)) {
        std::println("создан {}", name);
    }
    ~Doc() {
        std::println("удалён {}", name);
    }
};

int main() {
    std::map<std::string, std::shared_ptr<Doc>> editors;
    std::string command, e;
    while (std::cin >> command >> e) {
        if (command == "new") {
            std::string name;
            std::cin >> name;
            editors[e] = std::make_shared<Doc>(name);
        } else if (command == "open") {
            std::string f;
            std::cin >> f;
            editors[e] = editors[f];
        } else if (command == "close") {
            editors[e].reset();
        } else if (const auto &doc = editors[e]) {
            std::println("{}: {} (владельцев {})", e, doc->name, doc.use_count());
        } else {
            std::println("{}: пусто", e);
        }
    }
    for (auto it = editors.rbegin(); it != editors.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
Каждый редактор — полноправный совладелец документа. Закрытие одним редактором лишь уменьшает счётчик; документ удаляется, когда его отпустит последний — при \`close\`, при замене другим документом или в конце программы. Никто из редакторов не обязан знать о других, и в этом смысл совместного владения.`,
      examples: [
        {
          in: 'new a отчёт\nopen b a\nwho a\nclose a\nwho b\nclose b\nwho b\n',
          out: 'создан отчёт\na: отчёт (владельцев 2)\nb: отчёт (владельцев 1)\nудалён отчёт\nb: пусто\n',
        },
        {
          in: 'new x один\nnew x два\n',
          out: 'создан один\nсоздан два\nудалён один\nудалён два\n',
        },
      ],
      hidden: [
        { in: 'who z\n', name: 'Пустой редактор' },
        { in: 'new a d\nopen b a\nopen c a\nwho c\n', name: 'Три владельца' },
        { in: 'new a d\nopen a a\nwho a\n', name: 'Открыть своё' },
        { in: 'new a d1\nnew b d2\nopen a b\nwho a\nwho b\n', name: 'Переключение на чужой' },
        { in: 'open a b\nwho a\n', name: 'Открыть пустой' },
        { in: 'new a d\nclose a\nclose a\n', name: 'Двойное закрытие' },
        { in: 'new z 1\nnew a 2\nopen m z\n', name: 'Удаление в конце' },
        { in: 'new a d\nopen b a\nnew a e\nwho b\n', name: 'Замена у одного' },
      ],
    },
    {
      title: 'Кэш картинок',
      description: `
Картинка \`Image\` печатает \`загружено имя\` и \`выгружено имя\`. Кэш \`Cache\` хранит \`std::map<std::string, std::shared_ptr<const Image>>\`; \`get(имя)\` возвращает картинку из кэша или загружает и запоминает её. Окна хранят свои \`std::shared_ptr<const Image>\` в \`std::map<std::string, …>\`.

Команды:

- \`show W имя\` — окно W показывает картинку: \`windows[W] = cache.get(имя)\`;
- \`close W\` — \`windows[W].reset()\`;
- \`evict имя\` — убрать картинку из кэша (если есть);
- \`info имя\` — \`имя: в кэше, владельцев K\` или \`имя: не в кэше\`.

В конце сбросьте окна от последнего имени к первому, затем очистите кэш, удаляя записи от последнего имени к первому.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'evict убирает только запись кэша: если картинку показывает окно, она остаётся загруженной, пока окно её держит.',
        'Число владельцев картинки в кэше — use_count() указателя, который хранит кэш.',
      ],
      solution: String.raw`
#include <iostream>
#include <iterator>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Image {
    std::string name;
    explicit Image(std::string n) : name(std::move(n)) {
        std::println("загружено {}", name);
    }
    ~Image() {
        std::println("выгружено {}", name);
    }
};

class Cache {
public:
    std::shared_ptr<const Image> get(const std::string &name) {
        auto &slot = images_[name];
        if (!slot) {
            slot = std::make_shared<Image>(name);
        }
        return slot;
    }

    void evict(const std::string &name) {
        images_.erase(name);
    }

    void info(const std::string &name) const {
        if (auto it = images_.find(name); it != images_.end()) {
            std::println("{}: в кэше, владельцев {}", name, it->second.use_count());
        } else {
            std::println("{}: не в кэше", name);
        }
    }

    void clear() {
        while (!images_.empty()) {
            images_.erase(std::prev(images_.end()));
        }
    }

private:
    std::map<std::string, std::shared_ptr<const Image>> images_;
};

int main() {
    Cache cache;
    std::map<std::string, std::shared_ptr<const Image>> windows;
    std::string command, a;
    while (std::cin >> command >> a) {
        if (command == "show") {
            std::string name;
            std::cin >> name;
            windows[a] = cache.get(name);
        } else if (command == "close") {
            windows[a].reset();
        } else if (command == "evict") {
            cache.evict(a);
        } else {
            cache.info(a);
        }
    }
    for (auto it = windows.rbegin(); it != windows.rend(); ++it) {
        it->second.reset();
    }
    cache.clear();
    return 0;
}`,
      explanation: `
Кэш и окна — равноправные совладельцы картинки. Удаление из кэша не выгружает картинку, если её показывает окно: она живёт, пока нужна хоть кому-то, и исчезает вместе с последним владельцем. \`shared_ptr<const Image>\` гарантирует, что ни окно, ни кэш не изменят общую картинку.

\`std::make_shared<Image>\` возвращает \`shared_ptr<Image>\`, который неявно превращается в \`shared_ptr<const Image>\`: доступ сужается, блок управления остаётся тем же.`,
      examples: [
        {
          in: 'show w1 кот\nshow w2 кот\ninfo кот\nevict кот\ninfo кот\nclose w1\nclose w2\n',
          out: 'загружено кот\nкот: в кэше, владельцев 3\nкот: не в кэше\nвыгружено кот\n',
        },
        { in: 'show w a\nshow w b\n', out: 'загружено a\nзагружено b\nвыгружено b\nвыгружено a\n' },
      ],
      hidden: [
        { in: 'info x\n', name: 'Нет в кэше' },
        { in: 'show w a\nclose w\ninfo a\n', name: 'Остаётся в кэше' },
        { in: 'show w a\nevict a\nshow v a\ninfo a\n', name: 'Повторная загрузка' },
        { in: 'evict a\n', name: 'Удаление отсутствующей' },
        { in: 'show w a\nshow w a\ninfo a\n', name: 'То же окно' },
        { in: 'show x 1\nshow y 2\nshow z 3\nevict 2\n', name: 'Выгрузка в конце' },
        { in: 'show w a\nevict a\nclose w\ninfo a\n', name: 'Последний владелец — окно' },
        { in: 'show a p\nshow b p\nshow c q\ninfo p\ninfo q\n', name: 'Две картинки' },
      ],
    },
    {
      title: 'Найди ошибку: сессия сама себе владелец',
      bug: true,
      description: `
Для каждого пользователя программа создаёт сессию в \`shared_ptr\` и запускает её; при запуске сессия регистрирует себя в реестре, который хранит \`shared_ptr\` на активные сессии. В конце печатается число активных сессий и их пользователи. AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['Пользователей не больше 100.'],
      hints: [
        'Сколько блоков управления у сессии после std::shared_ptr<Session>(this)?',
        'Унаследуйте std::enable_shared_from_this<Session> и регистрируйте shared_from_this().',
      ],
      starter: SESSIONS(false),
      solution: SESSIONS(true),
      explanation: `
\`std::shared_ptr<Session>(this)\` заводит **второй** блок управления для объекта, которым уже владеет \`session\` из \`make_shared\`. В конце итерации \`session\` уничтожается, его счётчик падает до нуля — объект удалён, а реестр держит указатель с собственным счётчиком 1 на уже удалённую сессию. Печать читает освобождённую память, а в конце программы объект удаляется второй раз.

\`std::enable_shared_from_this\` хранит внутри объекта слабую ссылку на его блок управления; \`shared_from_this()\` создаёт ещё одного владельца в **том же** блоке. Вызывать его можно, только если объектом уже владеет \`shared_ptr\` — иначе он бросит \`std::bad_weak_ptr\`.`,
      examples: [
        { in: 'Ада Алан\n', out: 'старт Ада\nстарт Алан\nактивных 2\n- Ада\n- Алан\n' },
        { in: 'Грейс\n', out: 'старт Грейс\nактивных 1\n- Грейс\n' },
      ],
      hidden: [
        'a\n',
        'a b c\n',
        'длинное-имя-пользователя-сессии\n',
        'x y\n',
        'Бьёрн\nДеннис\nКен\n',
        'q\n',
        'p p\n',
        '1 2 3 4 5\n',
      ],
    },
    {
      title: 'Копирование при записи',
      difficulty: 'advanced',
      description: `
Класс \`CowText\` хранит текст в \`std::shared_ptr<std::string>\` и не объявляет специальных функций: копии \`CowText\` **разделяют** одну строку. Перед изменением (\`append\`) текст «отделяется»: если у строки больше одного владельца, создаётся собственная копия (статический счётчик глубоких копий увеличивается), и меняется уже она.

Тексты хранятся в \`std::map<std::string, CowText>\`. Команды:

- \`set A слово\` — \`insert_or_assign(A, CowText(слово))\`;
- \`copy B A\` — \`insert_or_assign(B, texts.at(A))\`;
- \`append A слово\` — дописать слово;
- \`show A\` — \`A: «текст» (владельцев K)\`;
- \`stats\` — \`глубоких копий N\`.`,
      constraints: ['Команд не больше 300; ссылки только на существующие тексты.'],
      hints: [
        'append: if (data_.use_count() > 1) { data_ = std::make_shared<std::string>(*data_); ++deep_copies; } *data_ += tail;',
        'Копирование CowText копирует shared_ptr — это дёшево: строка не копируется, растёт только счётчик.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <string_view>
#include <utility>

class CowText {
public:
    static inline int deep_copies = 0;

    explicit CowText(std::string s) : data_(std::make_shared<std::string>(std::move(s))) {}

    void append(std::string_view tail) {
        if (data_.use_count() > 1) {
            data_ = std::make_shared<std::string>(*data_);
            ++deep_copies;
        }
        *data_ += tail;
    }

    const std::string &str() const {
        return *data_;
    }

    long owners() const {
        return data_.use_count();
    }

private:
    std::shared_ptr<std::string> data_;
};

int main() {
    std::map<std::string, CowText> texts;
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            std::println("глубоких копий {}", CowText::deep_copies);
            continue;
        }
        std::string a, b;
        std::cin >> a;
        if (command == "set") {
            std::cin >> b;
            texts.insert_or_assign(a, CowText(b));
        } else if (command == "copy") {
            std::cin >> b;
            texts.insert_or_assign(a, texts.at(b));
        } else if (command == "append") {
            std::cin >> b;
            texts.at(a).append(b);
        } else {
            const CowText &t = texts.at(a);
            std::println("{}: «{}» (владельцев {})", a, t.str(), t.owners());
        }
    }
    return 0;
}`,
      explanation: `
Копирование при записи откладывает дорогую работу: пока тексты только читают, все копии разделяют одну строку, и копирование \`CowText\` стоит увеличения счётчика. Глубокая копия делается лишь при первом изменении разделяемого текста — и только для того, кто меняет. Если владелец один, \`append\` меняет строку на месте.

Так когда-то был устроен \`std::string\` в libstdc++; от этого отказались в C++11 из-за многопоточности: проверка счётчика и последующая запись не атомарны вместе. Однопоточный COW или COW поверх неизменяемых данных (\`shared_ptr<const T>\`) по-прежнему полезен — например, для снимков документов и настроек.`,
      examples: [
        {
          in: 'set a привет\ncopy b a\nshow a\nappend b !\nshow a\nshow b\nstats\n',
          out: 'a: «привет» (владельцев 2)\na: «привет» (владельцев 1)\nb: «привет!» (владельцев 1)\nглубоких копий 1\n',
        },
        {
          in: 'set x a\nappend x b\nshow x\nstats\n',
          out: 'x: «ab» (владельцев 1)\nглубоких копий 0\n',
        },
      ],
      hidden: [
        {
          in: 'set a x\ncopy b a\ncopy c a\nshow c\nappend a y\nshow b\nstats\n',
          name: 'Три владельца',
        },
        { in: 'set a x\ncopy a a\nshow a\n', name: 'Копия в себя' },
        {
          in: 'set a x\ncopy b a\nappend a 1\nappend a 2\nstats\n',
          name: 'Одна копия на несколько изменений',
        },
        { in: 'set a x\ncopy b a\nset a y\nshow b\n', name: 'Замена разрывает связь' },
        {
          in: 'set a x\ncopy b a\nappend a 1\nappend b 2\nshow a\nshow b\nstats\n',
          name: 'Оба меняются',
        },
        { in: 'stats\n', name: 'Без копий' },
        { in: 'set a 1\ncopy b a\ncopy c b\nappend c 2\nshow a\nshow c\n', name: 'Цепочка копий' },
        { in: 'set a длинный-текст\ncopy b a\nshow b\n', name: 'Кириллица' },
      ],
    },
  ],
};
