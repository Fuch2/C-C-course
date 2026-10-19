const SETTINGS = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

struct Settings {
    std::string theme;
    int font = 12;
    bool dark = false;

    Settings() = default;
    Settings(const Settings &other) : theme(other.theme), font(other.font)${fixed ? ', dark(other.dark)' : ''} {
        std::println("копия настроек");
    }
};

void show(const Settings &s) {
    std::println("{}, шрифт {}, тёмная: {}", s.theme, s.font, s.dark ? "да" : "нет");
}

int main() {
    Settings base;
    std::cin >> base.theme >> base.font >> base.dark;
    show(base);
    int font;
    while (std::cin >> font) {
        Settings derived = base;
        derived.font = font;
        show(derived);
    }
    return 0;
}`;

export default {
  id: 'lifetime-copy-constructor',
  title: 'Конструктор копирования',
  description:
    'Когда вызывается конструктор копирования: инициализация, передача по значению, вставка в контейнер, захват в лямбду; гарантированное устранение копий C++17; неявный почленный конструктор копирования и типы-значения; свой конструктор копирования T(const T &) и почему параметр — константная ссылка; забытые поля; = default и = delete.',
  moduleId: 'cpp-lifetime',
  order: 6,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['lifetime-ownership'],
  objectives: [
    'Находить места, где объект копируется',
    'Полагаться на неявное почленное копирование для типов-значений',
    'Писать конструктор копирования с особой семантикой',
    'Не терять поля в собственном конструкторе копирования',
  ],
  tags: ['C++23', 'Время жизни', 'Копирование', 'Конструкторы'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие строки вызывают конструктор копирования для объекта a типа T? Выберите все.',
      options: [
        'T b = a;',
        'f(a); где void f(T)',
        'g(a); где void g(const T &)',
        'v.push_back(a);',
      ],
      correct: [0, 1, 3],
      explain: 'Передача по константной ссылке объект не копирует.',
    },
    {
      q: 'Почему параметр конструктора копирования — ссылка?',
      options: [
        'Передача по значению сама требовала бы копирования — бесконечная рекурсия',
        'Так быстрее, но можно и по значению',
        'Чтобы конструктор мог менять оригинал',
        'Ссылка не обязательна',
      ],
      correct: 0,
      explain: 'T(T other) — ошибка компиляции.',
    },
    {
      q: 'Что делает неявный конструктор копирования?',
      options: [
        'Копирует базы и поля по очереди их собственными конструкторами копирования',
        'Копирует байты объекта функцией memcpy',
        'Ничего — его нужно писать всегда',
        'Создаёт объект по умолчанию',
      ],
      correct: 0,
      explain: 'Для std::string и std::vector это создаёт независимые копии данных.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct C {
    static inline int n = 0;
    C() = default;
    C(const C &) { ++n; }
};

C make() {
    return C();
}

void take(C) {}

int main() {
    C a;
    C b = a;
    C c = make();
    take(b);
    std::println("{}", C::n);
    return 0;
}`,
      lang: 'cpp',
      answers: ['2'],
      placeholder: 'Вывод программы',
      explain:
        'Копии: b из a и параметр take. make() возвращает временный объект — с C++17 копии нет.',
    },
    {
      q: 'В своём конструкторе копирования вы скопировали два поля из трёх. Что получит третье поле?',
      options: [
        'Значение по умолчанию (инициализатор поля или конструктор по умолчанию)',
        'Значение из оригинала автоматически',
        'Ошибку компиляции',
        'Предупреждение -Wall',
      ],
      correct: 0,
      explain: 'Компилятор не знает, что вы забыли поле, — и молчит.',
    },
    {
      q: 'Как запретить копирование класса?',
      options: [
        'T(const T &) = delete;',
        'T(const T &) = default;',
        'private: T();',
        'Сделать все поля const',
      ],
      correct: 0,
      explain:
        'Копирующее присваивание обычно запрещают вместе с ним: T &operator=(const T &) = delete;',
    },
    {
      q: 'Объект типа Playlist { std::string title; std::vector<std::string> songs; } скопирован в другой. Изменение songs у копии…',
      options: [
        'не затрагивает оригинал',
        'меняет оригинал',
        'приводит к двойному освобождению',
        'запрещено',
      ],
      correct: 0,
      explain: 'Вектор копирует свои элементы — копии независимы.',
    },
    {
      q: 'Как называется оптимизация, при которой временный объект строится сразу на месте переменной без вызова конструктора копирования? (англ. термин из двух слов)',
      answers: ['copy elision', 'устранение копии', 'устранение копирования'],
      placeholder: 'Термин',
      explain: 'С C++17 для временных значений она гарантирована стандартом.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-copy-constructor-exercise',
      title: 'Счётчик копий',
      difficulty: 'beginner',
      description: `
Структура \`Probe\` считает свои копии: конструктор копирования увеличивает статический счётчик \`copies\`. В начале программы создайте объект \`Probe a\`. Затем выполните команды:

- \`copy\` — \`Probe b = a;\`
- \`value\` — вызвать \`void by_value(Probe)\`;
- \`ref\` — вызвать \`void by_ref(const Probe &)\`;
- \`make\` — \`Probe c = make();\`, где \`make\` возвращает \`Probe()\`;
- \`store\` — добавить \`a\` в вектор, у которого заранее зарезервировано место на 100 элементов.

После каждой команды напечатайте \`команда: копий N\` — общее число копий с начала программы.`,
      constraints: ['Команд не больше 100.'],
      hints: [
        'static inline int copies = 0; внутри структуры — один счётчик на все объекты.',
        'reserve(100) до первого store гарантирует, что вектор не будет переезжать и копировать старые элементы.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

struct Probe {
    static inline int copies = 0;
    Probe() = default;
    Probe(const Probe &) {
        ++copies;
    }
};

void by_value(Probe) {}

void by_ref(const Probe &) {}

Probe make() {
    return Probe();
}

int main() {
    const Probe a;
    std::vector<Probe> stored;
    stored.reserve(100);
    std::string command;
    while (std::cin >> command) {
        if (command == "copy") {
            [[maybe_unused]] const Probe b = a;
        } else if (command == "value") {
            by_value(a);
        } else if (command == "ref") {
            by_ref(a);
        } else if (command == "make") {
            [[maybe_unused]] const Probe c = make();
        } else {
            stored.push_back(a);
        }
        std::println("{}: копий {}", command, Probe::copies);
    }
    return 0;
}`,
      explanation: `
Копируют инициализация другим объектом, передача по значению и вставка в контейнер. Ссылка копий не создаёт, а возврат временного объекта с C++17 строит его прямо на месте \`c\` — конструктор копирования не вызывается вовсе, это гарантия языка, а не оптимизация компилятора.

Без \`reserve\` вектор при росте переезжал бы в новый буфер и копировал старые элементы — счётчик рос бы скачками.`,
      examples: [
        {
          in: 'copy\nref\nvalue\nmake\nstore\n',
          out: 'copy: копий 1\nref: копий 1\nvalue: копий 2\nmake: копий 2\nstore: копий 3\n',
        },
        { in: 'ref\nref\n', out: 'ref: копий 0\nref: копий 0\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'make\nmake\nmake\n', name: 'Только make' },
        { in: 'store\nstore\nstore\nstore\n', name: 'Четыре вставки' },
        { in: 'value\n', name: 'Одна передача по значению' },
        { in: 'copy\ncopy\n', name: 'Две копии' },
        { in: 'ref\nvalue\nref\nvalue\n', name: 'Чередование' },
        { in: 'store\nmake\ncopy\nref\nvalue\n', name: 'Все команды' },
        {
          in: 'copy\nvalue\nstore\ncopy\nvalue\nstore\ncopy\nvalue\nstore\ncopy\nvalue\nstore\n',
          name: 'Двузначный счётчик',
        },
      ],
    },
    {
      title: 'Билеты',
      description: `
Класс \`Ticket\` хранит уникальный номер (1, 2, 3, … по порядку создания), событие и номер билета, с которого он скопирован (0 — оригинал). Конструктор копирования создаёт билет на то же событие с **новым** номером и запоминает номер оригинала.

Билеты хранятся в \`std::deque<Ticket>\`. Команды:

- \`new событие\` — создать билет (через \`emplace_back\`);
- \`copy N\` — добавить копию билета N (\`push_back\` существующего);
- \`show N\` — напечатать \`№N событие\` и, если билет — копия, \` (копия №M)\`.`,
      constraints: ['Команд не больше 200; copy и show ссылаются на существующие билеты.'],
      hints: [
        'static inline int next_id_ = 1; конструкторы берут next_id_++.',
        'std::deque не переносит элементы при push_back в конец — копирования «сами собой» не будет. В std::vector при росте билеты копировались бы и получали новые номера.',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Ticket {
public:
    explicit Ticket(std::string event) : id_(next_id_++), event_(std::move(event)) {}
    Ticket(const Ticket &other) : id_(next_id_++), event_(other.event_), source_(other.id_) {}

    void show() const {
        if (source_ == 0) {
            std::println("№{} {}", id_, event_);
        } else {
            std::println("№{} {} (копия №{})", id_, event_, source_);
        }
    }

private:
    static inline int next_id_ = 1;
    int id_;
    std::string event_;
    int source_ = 0;
};

int main() {
    std::deque<Ticket> tickets;
    std::string command;
    while (std::cin >> command) {
        if (command == "new") {
            std::string event;
            std::cin >> event;
            tickets.emplace_back(event);
        } else {
            std::size_t n;
            std::cin >> n;
            if (command == "copy") {
                tickets.push_back(tickets[n - 1]);
            } else {
                tickets[n - 1].show();
            }
        }
    }
    return 0;
}`,
      explanation: `
Копия здесь — осмысленная операция предметной области: новый билет на то же событие. Конструктор копирования явно перечисляет, что берётся из оригинала (событие), а что задаётся заново (номер и ссылка на источник).

Номера выдаются в порядке создания объектов, поэтому важно, чтобы копий «за кулисами» не было. \`std::deque\` при добавлении в конец не переносит старые элементы. В \`std::vector\` без \`reserve\` при росте билеты копировались бы в новый буфер и получали новые номера.`,
      examples: [
        {
          in: 'new Концерт\ncopy 1\nnew Театр\ncopy 2\nshow 1\nshow 2\nshow 3\nshow 4\n',
          out: '№1 Концерт\n№2 Концерт (копия №1)\n№3 Театр\n№4 Концерт (копия №2)\n',
        },
        { in: 'new Матч\nshow 1\n', out: '№1 Матч\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'new a\ncopy 1\ncopy 1\ncopy 1\nshow 4\n', name: 'Много копий одного' },
        { in: 'new a\ncopy 1\ncopy 2\ncopy 3\nshow 4\n', name: 'Цепочка копий' },
        { in: 'new x\nnew y\nshow 2\nshow 1\n', name: 'Без копий' },
        { in: 'new e\ncopy 1\nshow 2\nnew f\nshow 3\n', name: 'Новый после копии' },
        { in: 'new Выставка\ncopy 1\nshow 1\nshow 2\n', name: 'Оригинал не меняется' },
        {
          in: 'new a\nnew b\nnew c\ncopy 3\ncopy 2\ncopy 1\nshow 4\nshow 5\nshow 6\n',
          name: 'Обратный порядок копий',
        },
        { in: 'new q\ncopy 1\ncopy 2\ncopy 2\nshow 3\nshow 4\n', name: 'Две копии копии' },
      ],
    },
    {
      title: 'Найди ошибку: потерянная тема',
      bug: true,
      description: `
Первая строка ввода — базовые настройки: тема, размер шрифта и признак тёмной темы (0 или 1). Дальше — размеры шрифта. Программа печатает базовые настройки, а для каждого размера создаёт копию базовых настроек, меняет в ней шрифт и печатает её.

Копии иногда «теряют» тёмную тему. Найдите и исправьте ошибку.`,
      constraints: ['Размеров не больше 50.'],
      hints: [
        'Сравните поля Settings с тем, что копирует её конструктор копирования.',
        'Скопируйте все поля. Если журнал «копия настроек» не нужен, лучше удалить свой конструктор и положиться на неявный.',
      ],
      starter: SETTINGS(false),
      solution: SETTINGS(true),
      explanation: `
Свой конструктор копирования копирует только \`theme\` и \`font\`. Поле \`dark\` не упомянуто в списке инициализации и получает значение по умолчанию — \`false\`. Компилятор не предупреждает: для него это обычный конструктор, который инициализирует поле по умолчанию.

Каждый раз, добавляя поле в класс со своим конструктором копирования, нужно обновить и его. Самый надёжный способ избежать ошибки — не писать конструктор копирования без необходимости.`,
      examples: [
        {
          in: 'ночь 14 1\n16\n',
          out: 'ночь, шрифт 14, тёмная: да\nкопия настроек\nночь, шрифт 16, тёмная: да\n',
        },
        {
          in: 'день 12 0\n10\n20\n',
          out: 'день, шрифт 12, тёмная: нет\nкопия настроек\nдень, шрифт 10, тёмная: нет\nкопия настроек\nдень, шрифт 20, тёмная: нет\n',
        },
      ],
      hidden: [
        'dark 12 1\n12\n',
        'a 1 1\n2\n3\n',
        'b 9 0\n',
        'контраст 30 1\n8\n',
        'x 10 1\n10\n11\n12\n',
        'y 5 0\n6\n',
        'z 7 1\n70\n',
        'тема 15 1\n15\n',
      ],
    },
    {
      title: 'Родословная копий',
      difficulty: 'advanced',
      description: `
Класс \`Specimen\` (образец) хранит номер (1, 2, 3, … в порядке создания), название, номер родителя (0 у оригинала) и поколение (0 у оригинала). Конструктор копирования создаёт образец с новым номером, тем же названием, родителем — номером копируемого и поколением на 1 больше. Глобальный счётчик считает вызовы конструктора копирования.

Образцы хранятся в \`std::deque<Specimen>\`. Команды:

- \`new название\` — создать оригинал;
- \`clone N\` — добавить копию образца N;
- \`info N\` — напечатать \`#N название, поколение G, родитель #P\` или \`…, поколение 0, оригинал\`;
- \`root N\` — напечатать номер оригинала, от которого произошёл N, пройдя по родителям: \`#N ← #P ← … ← #R\`;
- \`copies\` — напечатать \`копий N\`.`,
      constraints: ['Команд не больше 300; ссылки только на существующие образцы.'],
      hints: [
        'Номера совпадают с позицией в deque плюс один, поэтому родителя по номеру найти легко: specimens[parent - 1].',
        'root: начните с N и двигайтесь к родителю, пока он не равен 0, собирая строку через " ← ".',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Specimen {
public:
    static inline int copies = 0;

    explicit Specimen(std::string name) : id_(next_id_++), name_(std::move(name)) {}
    Specimen(const Specimen &other)
        : id_(next_id_++), name_(other.name_), parent_(other.id_), generation_(other.generation_ + 1) {
        ++copies;
    }

    int id() const {
        return id_;
    }
    int parent() const {
        return parent_;
    }

    void info() const {
        if (parent_ == 0) {
            std::println("#{} {}, поколение 0, оригинал", id_, name_);
        } else {
            std::println("#{} {}, поколение {}, родитель #{}", id_, name_, generation_, parent_);
        }
    }

private:
    static inline int next_id_ = 1;
    int id_;
    std::string name_;
    int parent_ = 0;
    int generation_ = 0;
};

int main() {
    std::deque<Specimen> specimens;
    std::string command;
    while (std::cin >> command) {
        if (command == "new") {
            std::string name;
            std::cin >> name;
            specimens.emplace_back(name);
        } else if (command == "copies") {
            std::println("копий {}", Specimen::copies);
        } else {
            std::size_t n;
            std::cin >> n;
            if (command == "clone") {
                specimens.push_back(specimens[n - 1]);
            } else if (command == "info") {
                specimens[n - 1].info();
            } else {
                std::string path = "#" + std::to_string(n);
                int current = specimens[n - 1].parent();
                while (current != 0) {
                    path += " ← #" + std::to_string(current);
                    current = specimens[current - 1].parent();
                }
                std::println("{}", path);
            }
        }
    }
    return 0;
}`,
      explanation: `
Конструктор копирования здесь описывает «рождение потомка»: часть полей берётся у оригинала (название), часть вычисляется из него (родитель, поколение), часть задаётся заново (номер). Неявный конструктор скопировал бы всё один в один — получились бы два образца с одинаковым номером.

Счётчик копий подтверждает, что лишних копий нет: каждая команда \`clone\` — ровно один вызов. \`std::deque\` при добавлении в конец не переносит старые элементы, поэтому номера и связи остаются верными.`,
      examples: [
        {
          in: 'new мох\nclone 1\nclone 2\ninfo 1\ninfo 3\nroot 3\ncopies\n',
          out: '#1 мох, поколение 0, оригинал\n#3 мох, поколение 2, родитель #2\n#3 ← #2 ← #1\nкопий 2\n',
        },
        { in: 'new a\nroot 1\ncopies\n', out: '#1\nкопий 0\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'new a\nclone 1\nclone 1\ninfo 3\nroot 3\n', name: 'Братья' },
        { in: 'new a\nnew b\nclone 2\nclone 3\nroot 4\ninfo 4\n', name: 'Второй оригинал' },
        {
          in: 'new x\nclone 1\nclone 2\nclone 3\nclone 4\nclone 5\nroot 6\ninfo 6\n',
          name: 'Длинная цепочка',
        },
        { in: 'copies\n', name: 'Нет копий' },
        {
          in: 'new p\nclone 1\nnew q\nclone 3\nclone 2\ninfo 5\nroot 5\ncopies\n',
          name: 'Смешанные',
        },
        { in: 'new ель\ninfo 1\n', name: 'Только оригинал' },
        { in: 'new a\nclone 1\nclone 2\nclone 1\nroot 3\nroot 4\ncopies\n', name: 'Две ветви' },
      ],
    },
  ],
};
