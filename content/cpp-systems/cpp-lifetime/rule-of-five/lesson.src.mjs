const DOCUMENTS = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Content {
    static inline int copies = 0;
    std::vector<std::string> lines;

    Content() = default;
    Content(const Content &other) : lines(other.lines) {
        ++copies;
    }
    Content &operator=(const Content &) = default;
    Content(Content &&) noexcept = default;
    Content &operator=(Content &&) noexcept = default;
};

class Document {
public:
    explicit Document(std::string title) : title_(std::move(title)) {}
    virtual ~Document() = default;
${
  fixed
    ? `    Document(const Document &) = default;
    Document &operator=(const Document &) = default;
    Document(Document &&) noexcept = default;
    Document &operator=(Document &&) noexcept = default;
`
    : ''
}
    void add(std::string line) {
        content_.lines.push_back(std::move(line));
    }

    void show() const {
        std::println("{}: {} строк", title_, content_.lines.size());
    }

private:
    std::string title_;
    Content content_;
};

int main() {
    std::vector<Document> docs;
    std::string command, text;
    while (std::cin >> command >> text) {
        if (command == "doc") {
            docs.emplace_back(text);
        } else {
            docs.back().add(text);
        }
    }
    for (const Document &d : docs) {
        d.show();
    }
    std::println("копий содержимого {}", Content::copies);
    return 0;
}`;

export default {
  id: 'lifetime-rule-of-five',
  title: 'Правило пяти',
  description:
    'Деструктор, копирующие и перемещающие операции объявляют вместе; какие функции компилятор создаёт сам и как объявленный деструктор или копирование молча отключают перемещение; потеря перемещения у полиморфной базы с виртуальным деструктором; полный класс-владелец с присваиваниями через обмен; некопируемые перемещаемые владельцы.',
  moduleId: 'cpp-lifetime',
  order: 16,
  difficulty: 'advanced',
  estimatedMinutes: 60,
  prerequisites: ['lifetime-move-assignment'],
  objectives: [
    'Знать правила неявного создания специальных функций',
    'Замечать классы, у которых перемещение молча стало копированием',
    'Писать полный набор из пяти функций для владельца ресурса',
    'Проектировать перемещаемые некопируемые типы',
  ],
  tags: ['C++23', 'Время жизни', 'Правило пяти', 'Перемещение', 'Копирование'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие функции входят в правило пяти? Выберите все.',
      options: [
        'Деструктор',
        'Конструктор копирования и копирующее присваивание',
        'Перемещающий конструктор и перемещающее присваивание',
        'Конструктор по умолчанию',
      ],
      correct: [0, 1, 2],
      explain: 'Конструктор по умолчанию к ним не относится.',
    },
    {
      q: 'В классе объявлен только деструктор. Что произойдёт при T b = std::move(a);?',
      options: [
        'Скопируются все поля: неявное перемещение не объявлено, rvalue привязывается к копированию',
        'Поля переместятся',
        'Ошибка компиляции',
        'Ничего не произойдёт',
      ],
      correct: 0,
      explain: 'Никакой диагностики — только потерянная производительность.',
    },
    {
      q: 'В классе объявлен только перемещающий конструктор. Что с копированием?',
      options: [
        'Неявный конструктор копирования удалён',
        'Копирование работает как обычно',
        'Копирование вызывает перемещение',
        'Копирование создаётся, но устарело',
      ],
      correct: 0,
      explain: 'Класс становится только перемещаемым, пока копирование не объявлено явно.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <utility>

struct P {
    P() = default;
    P(const P &) { std::print("C"); }
    P(P &&) noexcept { std::print("M"); }
};

struct A { P p; };
struct B { P p; virtual ~B() = default; };

int main() {
    A a1;
    A a2 = std::move(a1);
    B b1;
    B b2 = std::move(b1);
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['MC'],
      placeholder: 'Вывод программы',
      explain: 'У B объявлен (виртуальный) деструктор — неявного перемещения нет, поле копируется.',
    },
    {
      q: 'Как вернуть перемещение классу с virtual ~Base() = default;?',
      options: [
        'Объявить Base(Base &&) noexcept = default; и остальные специальные функции явно',
        'Убрать virtual',
        'Сделать деструктор чисто виртуальным',
        'Никак',
      ],
      correct: 0,
      explain: 'Объявив перемещение, не забудьте копирование — иначе оно станет удалённым.',
    },
    {
      q: 'Как выглядит набор специальных функций у некопируемого перемещаемого владельца?',
      options: [
        'Деструктор, копирование = delete, перемещение реализовано',
        'Только деструктор',
        'Копирование реализовано, перемещение = delete',
        'Все пять = default',
      ],
      correct: 0,
      explain: 'Так устроены unique_ptr, jthread, файловые потоки.',
    },
    {
      q: 'Почему удобно выражать оба присваивания через конструкторы и обмен?',
      options: [
        'Логика владения пишется один раз, самоприсваивание и исключения обрабатываются автоматически',
        'Это быстрее во всех случаях',
        'Так требует стандарт',
        'Чтобы не писать деструктор',
      ],
      correct: 0,
      explain: 'Цена — иногда лишнее перемещение или невозможность переиспользовать буфер.',
    },
    {
      q: 'Какие три слова завершают объявление специальной функции, чтобы попросить компилятор создать её реализацию по умолчанию? Напишите конструкцию после сигнатуры.',
      answers: ['= default', '=default', 'default'],
      placeholder: 'Конструкция',
      explain: 'А = delete запрещает функцию.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-rule-of-five-exercise',
      title: 'Свой вектор',
      difficulty: 'intermediate',
      description: `
Класс \`IntVector\` хранит размер, ёмкость и массив \`int\` в куче; \`push_back\` при нехватке места выделяет вдвое больший массив (начальная ёмкость 4). Статический счётчик считает выделения. Реализуйте все пять специальных функций: копия выделяет ровно \`size\` элементов (если size > 0), перемещение не выделяет ничего и оставляет источник пустым.

Векторы хранятся в \`std::map<std::string, IntVector>\` (\`operator[]\` создаёт пустой). Команды:

- \`push V x\`;
- \`copy W V\` — \`vectors[W] = vectors[V]\`;
- \`move W V\` — \`vectors[W] = std::move(vectors[V])\`;
- \`print V\` — \`V (N): элементы\` или \`V (0): пусто\`;
- \`stats\` — \`выделений A\`.`,
      constraints: ['Команд не больше 2000.'],
      hints: [
        'Присваивания: IntVector copy(other); swap(copy); и IntVector moved(std::move(other)); swap(moved); — с функцией swap, меняющей три поля.',
        'Пустой вектор: data_ = nullptr, size_ = capacity_ = 0; delete[] nullptr безопасен.',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

class IntVector {
public:
    static inline int allocations = 0;

    IntVector() = default;
    ~IntVector() {
        delete[] data_;
    }
    IntVector(const IntVector &other) : size_(other.size_), capacity_(other.size_) {
        if (size_ > 0) {
            data_ = new int[size_];
            ++allocations;
            std::copy_n(other.data_, size_, data_);
        }
    }
    IntVector &operator=(const IntVector &other) {
        IntVector copy(other);
        swap(copy);
        return *this;
    }
    IntVector(IntVector &&other) noexcept
        : size_(std::exchange(other.size_, 0)), capacity_(std::exchange(other.capacity_, 0)),
          data_(std::exchange(other.data_, nullptr)) {}
    IntVector &operator=(IntVector &&other) noexcept {
        IntVector moved(std::move(other));
        swap(moved);
        return *this;
    }

    void swap(IntVector &other) noexcept {
        std::swap(size_, other.size_);
        std::swap(capacity_, other.capacity_);
        std::swap(data_, other.data_);
    }

    void push_back(int x) {
        if (size_ == capacity_) {
            const std::size_t bigger = capacity_ ? capacity_ * 2 : 4;
            int *fresh = new int[bigger];
            ++allocations;
            std::copy_n(data_, size_, fresh);
            delete[] data_;
            data_ = fresh;
            capacity_ = bigger;
        }
        data_[size_++] = x;
    }

    void print(const std::string &name) const {
        std::string s;
        for (std::size_t i = 0; i < size_; ++i) {
            s += (i ? " " : "") + std::to_string(data_[i]);
        }
        std::println("{} ({}): {}", name, size_, s.empty() ? "пусто" : s);
    }

private:
    std::size_t size_ = 0;
    std::size_t capacity_ = 0;
    int *data_ = nullptr;
};

int main() {
    std::map<std::string, IntVector> vectors;
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            std::println("выделений {}", IntVector::allocations);
            continue;
        }
        std::string a;
        std::cin >> a;
        if (command == "push") {
            int x;
            std::cin >> x;
            vectors[a].push_back(x);
        } else if (command == "copy" || command == "move") {
            std::string from;
            std::cin >> from;
            if (command == "copy") {
                vectors[a] = vectors[from];
            } else {
                vectors[a] = std::move(vectors[from]);
            }
        } else {
            vectors[a].print(a);
        }
    }
    return 0;
}`,
      explanation: `
Логика владения живёт в трёх местах: деструктор освобождает, конструктор копирования создаёт свой массив, перемещающий конструктор забирает чужой. Оба присваивания собраны из них и обмена, поэтому \`copy V V\` и \`move V V\` безопасны без особых проверок: при самоперемещении временный объект забирает массив, а обмен возвращает его обратно.

Счётчик выделений показывает цену: копия — одно выделение на точный размер, перемещение — ни одного.`,
      examples: [
        {
          in: 'push A 1\npush A 2\ncopy B A\nmove C A\nprint A\nprint B\nprint C\nstats\n',
          out: 'A (0): пусто\nB (2): 1 2\nC (2): 1 2\nвыделений 2\n',
        },
        { in: 'print Z\nstats\n', out: 'Z (0): пусто\nвыделений 0\n' },
      ],
      hidden: [
        {
          in: 'push A 1\npush A 2\npush A 3\npush A 4\npush A 5\nstats\nprint A\n',
          name: 'Рост массива',
        },
        { in: 'push A 1\ncopy A A\nprint A\nstats\n', name: 'Самоприсваивание' },
        { in: 'push A 1\nmove A A\nprint A\n', name: 'Самоперемещение' },
        { in: 'copy B A\nprint B\nstats\n', name: 'Копия пустого' },
        {
          in: 'push A 7\nmove B A\npush A 8\nprint A\nprint B\n',
          name: 'Использование после перемещения',
        },
        {
          in: 'push A 1\npush B 2\npush B 3\ncopy B A\nprint B\nstats\n',
          name: 'Копия поверх непустого',
        },
        {
          in: 'push A 1\nmove B A\nmove C B\nmove D C\nprint D\nstats\n',
          name: 'Цепочка перемещений',
        },
        {
          in: 'push A -1\npush A -2\ncopy B A\npush B -3\ncopy C B\nprint A\nprint C\nstats\n',
          name: 'Копии разных размеров',
        },
      ],
    },
    {
      title: 'Что создаст компилятор',
      description: `
Структура \`Probe\` запоминает в глобальной переменной, что с ней сделали последним: \`копирование\` или \`перемещение\`. Объявите классы с полем \`Probe p;\`:

- \`Plain\` — больше ничего;
- \`WithDestructor\` — пустой деструктор \`~WithDestructor() {}\`;
- \`WithCopy\` — \`WithCopy() = default;\` и \`WithCopy(const WithCopy &) = default;\`;
- \`WithDefaults\` — пустой деструктор и все остальные четыре функции \`= default\` (перемещения — \`noexcept\`), плюс конструктор по умолчанию;
- \`VirtualBase\` — \`virtual ~VirtualBase() = default;\`;
- \`MoveOnly\` — конструктор по умолчанию и \`MoveOnly(MoveOnly &&) noexcept = default;\`.

Каждая строка ввода — \`move Имя\` или \`copy Имя\`. Для \`move\` выполните \`T a; T b = std::move(a);\`, для \`copy\` — \`T a; T b = a;\` и напечатайте \`Имя move: что произошло с полем\`. Если тип некопируем (\`std::is_copy_constructible_v\`), для \`copy\` напечатайте \`Имя copy: запрещено\`.`,
      constraints: ['Строк не больше 50; имена — из списка выше.'],
      hints: [
        'Шаблон template <class T> void run(const std::string &name, bool move) с if constexpr (!std::is_copy_constructible_v<T>) для запрещённого копирования.',
        'Выбор класса по имени — цепочка if, вызывающая run<Plain>, run<WithDestructor> и так далее.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <type_traits>
#include <utility>

std::string last;

struct Probe {
    Probe() = default;
    Probe(const Probe &) {
        last = "копирование";
    }
    Probe(Probe &&) noexcept {
        last = "перемещение";
    }
    Probe &operator=(const Probe &) = default;
    Probe &operator=(Probe &&) noexcept = default;
};

struct Plain {
    Probe p;
};

struct WithDestructor {
    Probe p;
    ~WithDestructor() {}
};

struct WithCopy {
    Probe p;
    WithCopy() = default;
    WithCopy(const WithCopy &) = default;
};

struct WithDefaults {
    Probe p;
    WithDefaults() = default;
    ~WithDefaults() {}
    WithDefaults(const WithDefaults &) = default;
    WithDefaults &operator=(const WithDefaults &) = default;
    WithDefaults(WithDefaults &&) noexcept = default;
    WithDefaults &operator=(WithDefaults &&) noexcept = default;
};

struct VirtualBase {
    Probe p;
    virtual ~VirtualBase() = default;
};

struct MoveOnly {
    Probe p;
    MoveOnly() = default;
    MoveOnly(MoveOnly &&) noexcept = default;
};

template <class T>
void run(const std::string &name, bool move) {
    if (move) {
        T a;
        [[maybe_unused]] T b = std::move(a);
        std::println("{} move: {}", name, last);
        return;
    }
    if constexpr (!std::is_copy_constructible_v<T>) {
        std::println("{} copy: запрещено", name);
    } else {
        T a;
        [[maybe_unused]] T b = a;
        std::println("{} copy: {}", name, last);
    }
}

int main() {
    std::string kind, name;
    while (std::cin >> kind >> name) {
        const bool move = kind == "move";
        if (name == "Plain") {
            run<Plain>(name, move);
        } else if (name == "WithDestructor") {
            run<WithDestructor>(name, move);
        } else if (name == "WithCopy") {
            run<WithCopy>(name, move);
        } else if (name == "WithDefaults") {
            run<WithDefaults>(name, move);
        } else if (name == "VirtualBase") {
            run<VirtualBase>(name, move);
        } else {
            run<MoveOnly>(name, move);
        }
    }
    return 0;
}`,
      explanation: `
Эксперимент показывает правила неявного создания. Пустой деструктор, явный конструктор копирования и виртуальный деструктор — все они отключают неявное перемещение, и \`std::move\` приводит к копированию поля без единого предупреждения. Явные \`= default\` возвращают перемещение. Объявленный перемещающий конструктор, наоборот, удаляет неявное копирование — \`MoveOnly\` становится некопируемым.

Вывод для практики: если пришлось объявить одну специальную функцию, объявите явно все пять — тогда поведение класса видно из его текста, а не из таблицы правил.`,
      examples: [
        {
          in: 'move Plain\nmove WithDestructor\nmove WithDefaults\ncopy MoveOnly\n',
          out: 'Plain move: перемещение\nWithDestructor move: копирование\nWithDefaults move: перемещение\nMoveOnly copy: запрещено\n',
        },
        { in: 'move VirtualBase\n', out: 'VirtualBase move: копирование\n' },
      ],
      hidden: [
        { in: 'move WithCopy\n', name: 'Явное копирование' },
        { in: 'copy Plain\n', name: 'Копирование Plain' },
        { in: 'move MoveOnly\n', name: 'MoveOnly перемещается' },
        { in: 'copy WithDestructor\ncopy WithDefaults\n', name: 'Копирование работает' },
        { in: 'copy VirtualBase\nmove VirtualBase\n', name: 'Виртуальный деструктор' },
        { in: 'move Plain\ncopy Plain\nmove Plain\n', name: 'Чередование' },
        { in: 'move WithDefaults\ncopy WithDefaults\n', name: 'Все по умолчанию' },
        {
          in: 'move Plain\nmove WithDestructor\nmove WithCopy\nmove WithDefaults\nmove VirtualBase\nmove MoveOnly\n',
          name: 'Все классы',
        },
      ],
    },
    {
      title: 'Найди ошибку: документы копируются',
      bug: true,
      description: `
Программа создаёт документы (\`doc название\`) и добавляет в последний строки (\`line текст\`), затем печатает \`название: N строк\` для каждого и число копирований содержимого. Документы хранятся в векторе. По замыслу содержимое никогда не копируется — вектор при росте должен **перемещать** документы. Но счётчик показывает копии. Класс \`Document\` недавно сделали базовым для наследования, добавив виртуальный деструктор. Исправьте класс.`,
      constraints: ['Команд не больше 300; первая команда — doc.'],
      hints: [
        'Какие специальные функции компилятор перестаёт создавать, когда объявлен деструктор?',
        'Объявите явно копирующие и перемещающие операции = default, перемещающие — noexcept.',
      ],
      starter: DOCUMENTS(false),
      solution: DOCUMENTS(true),
      explanation: `
\`virtual ~Document() = default;\` — объявленный деструктор, хоть и «по умолчанию». У класса с объявленным деструктором неявные перемещающие операции не объявляются, поэтому при росте вектора документы переносятся копированием, а с ними копируется и всё содержимое — строка за строкой. Программа работает правильно, но каждый рост вектора копирует все документы.

Явные \`= default\` для четырёх операций возвращают почленное перемещение, и \`noexcept\` разрешает вектору им пользоваться. Это типичная плата за добавление виртуального деструктора — правило пяти в действии.`,
      examples: [
        {
          in: 'doc a\nline x\ndoc b\nline y\nline z\ndoc c\n',
          out: 'a: 1 строк\nb: 2 строк\nc: 0 строк\nкопий содержимого 0\n',
        },
        {
          in: 'doc one\nline 1\ndoc two\n',
          out: 'one: 1 строк\ntwo: 0 строк\nкопий содержимого 0\n',
        },
      ],
      hidden: [
        'doc a\ndoc b\ndoc c\ndoc d\ndoc e\n',
        'doc a\nline 1\nline 2\nline 3\ndoc b\n',
        'doc x\ndoc y\nline q\n',
        'doc p\nline 1\ndoc q\nline 2\ndoc r\nline 3\ndoc s\nline 4\n',
        'doc отчёт\nline текст\ndoc письмо\n',
        'doc a\ndoc b\n',
        'doc 1\ndoc 2\ndoc 3\ndoc 4\ndoc 5\ndoc 6\ndoc 7\ndoc 8\ndoc 9\n',
        'doc a\nline x\ndoc b\nline y\n',
      ],
    },
    {
      title: 'Строка с малым буфером',
      difficulty: 'advanced',
      description: `
Реализуйте \`SmallString\` — строку с оптимизацией малых строк, как в стандартных библиотеках. Строки длиной до 15 байт хранятся **внутри** объекта в массиве \`char inline_[15]\`, длиннее — в массиве в куче (\`heap_ != nullptr\`). Статический счётчик считает выделения памяти.

Пять специальных функций должны учитывать оба режима:

- копирование создаёт свой буфер (выделение — только для длинных строк);
- перемещение длинной строки забирает указатель; короткой — копирует байты; источник остаётся пустой короткой строкой;
- присваивания — через конструкторы и обмен (обмен меняет и \`inline_\`).

\`append\` для результата длиннее 15 байт выделяет новый массив ровно нужного размера.

Строки хранятся в \`std::map<std::string, SmallString>\`. Команды: \`set X текст\` (\`strs[X] = SmallString(текст)\`), \`append X текст\`, \`copy Y X\` (\`strs[Y] = strs[X]\`), \`move Y X\` (\`strs[Y] = std::move(strs[X])\`), \`print X\` — \`X: «текст» (внутри)\` или \`(куча)\`, \`stats\` — \`выделений A\`.`,
      constraints: [
        'Команд не больше 300; тексты — слова без пробелов; длина считается в байтах (буква кириллицы — 2 байта).',
      ],
      hints: [
        'Инициализируйте массив: char inline_[15] = {}; — тогда копирование и обмен не читают неинициализированную память.',
        'Перемещающий конструктор: if (other.heap_) { heap_ = std::exchange(other.heap_, nullptr); } else { std::copy_n(other.inline_, other.size_, inline_); } size_ = std::exchange(other.size_, 0);',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <string_view>
#include <utility>

class SmallString {
public:
    static constexpr std::size_t kInline = 15;
    static inline int allocations = 0;

    SmallString() = default;
    explicit SmallString(std::string_view s) {
        assign(s);
    }
    ~SmallString() {
        delete[] heap_;
    }
    SmallString(const SmallString &other) {
        assign(other.view());
    }
    SmallString &operator=(const SmallString &other) {
        SmallString copy(other);
        swap(copy);
        return *this;
    }
    SmallString(SmallString &&other) noexcept {
        if (other.heap_) {
            heap_ = std::exchange(other.heap_, nullptr);
        } else {
            std::copy_n(other.inline_, other.size_, inline_);
        }
        size_ = std::exchange(other.size_, 0);
    }
    SmallString &operator=(SmallString &&other) noexcept {
        SmallString moved(std::move(other));
        swap(moved);
        return *this;
    }

    void swap(SmallString &other) noexcept {
        std::swap(size_, other.size_);
        std::swap(heap_, other.heap_);
        std::swap(inline_, other.inline_);
    }

    void append(std::string_view tail) {
        const std::size_t total = size_ + tail.size();
        if (!heap_ && total <= kInline) {
            std::copy_n(tail.data(), tail.size(), inline_ + size_);
        } else {
            char *fresh = new char[total];
            ++allocations;
            std::copy_n(data(), size_, fresh);
            std::copy_n(tail.data(), tail.size(), fresh + size_);
            delete[] heap_;
            heap_ = fresh;
        }
        size_ = total;
    }

    std::string_view view() const {
        return {data(), size_};
    }

    bool on_heap() const {
        return heap_ != nullptr;
    }

private:
    void assign(std::string_view s) {
        size_ = s.size();
        if (size_ > kInline) {
            heap_ = new char[size_];
            ++allocations;
        }
        std::copy_n(s.data(), size_, data());
    }

    char *data() {
        return heap_ ? heap_ : inline_;
    }
    const char *data() const {
        return heap_ ? heap_ : inline_;
    }

    std::size_t size_ = 0;
    char *heap_ = nullptr;
    char inline_[kInline] = {};
};

int main() {
    std::map<std::string, SmallString> strs;
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            std::println("выделений {}", SmallString::allocations);
            continue;
        }
        std::string x;
        std::cin >> x;
        if (command == "set" || command == "append") {
            std::string text;
            std::cin >> text;
            if (command == "set") {
                strs[x] = SmallString(text);
            } else {
                strs[x].append(text);
            }
        } else if (command == "copy" || command == "move") {
            std::string from;
            std::cin >> from;
            if (command == "copy") {
                strs[x] = strs[from];
            } else {
                strs[x] = std::move(strs[from]);
            }
        } else {
            const SmallString &s = strs[x];
            std::println("{}: «{}» ({})", x, s.view(), s.on_heap() ? "куча" : "внутри");
        }
    }
    return 0;
}`,
      explanation: `
Объект короткой строки содержит данные прямо в себе, поэтому «перемещение» короткой строки — это копирование до 15 байт, а длинной — передача указателя. Каждая из пяти функций обязана различать режимы, и одна ошибка — например, перемещение короткой строки как указателя на \`inline_\` источника — даёт висячий указатель внутрь чужого объекта.

Так устроены \`std::string\` в libstdc++ и libc++ (у них порог — 15 и 22 символа). Поэтому перемещение коротких строк не быстрее их копирования, а копирование длинных — дорогое.`,
      examples: [
        {
          in: 'set a short\nset b это-уже-длинная-строка\ncopy c b\nmove d b\nprint a\nprint b\nprint c\nprint d\nstats\n',
          out: 'a: «short» (внутри)\nb: «» (внутри)\nc: «это-уже-длинная-строка» (куча)\nd: «это-уже-длинная-строка» (куча)\nвыделений 2\n',
        },
        {
          in: 'set x 123456789012345\nappend x 6\nprint x\nstats\n',
          out: 'x: «1234567890123456» (куча)\nвыделений 1\n',
        },
      ],
      hidden: [
        { in: 'set a abc\nmove b a\nprint a\nprint b\nstats\n', name: 'Перемещение короткой' },
        { in: 'set a abc\nappend a def\nappend a ghi\nprint a\n', name: 'Короткий append' },
        {
          in: 'set a 1234567890\nappend a 1234567890\nappend a 1234567890\nprint a\nstats\n',
          name: 'Рост в куче',
        },
        {
          in: 'set a длинная-строка-в-куче\ncopy a a\nmove a a\nprint a\nstats\n',
          name: 'Самоприсваивание',
        },
        {
          in: 'set a короткая\nset b длинная-длинная-строка\nmove a b\nprint a\nprint b\n',
          name: 'Длинная поверх короткой',
        },
        {
          in: 'set a длинная-длинная-строка\nset b x\nmove a b\nprint a\nstats\n',
          name: 'Короткая поверх длинной',
        },
        { in: 'print empty\nappend empty z\nprint empty\n', name: 'Пустая строка' },
        {
          in: 'set a 123456789012345\nprint a\nappend a 1\nprint a\ncopy b a\nprint b\nstats\n',
          name: 'Граница 15 байт',
        },
      ],
    },
  ],
};
