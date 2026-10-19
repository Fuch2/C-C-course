const RANGE = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

// Инвариант: low <= high.
class Range {
public:
    Range(int low, int high) {
        set_bounds(low, high);
    }

    int length() const {
        return high_ - low_;
    }

    void print() const {
        std::println("[{}, {}] длина {}", low_, high_, length());
    }

protected:
    void set_bounds(int low, int high) {
        low_ = low;
        high_ = high < low ? low : high;
    }

${fixed ? 'private:\n' : ''}    int low_ = 0;
    int high_ = 0;
${fixed ? '\nprotected:\n    int low() const {\n        return low_;\n    }\n\n    int high() const {\n        return high_;\n    }\n' : ''}};

class Window : public Range {
public:
    using Range::Range;

    void shrink_right(int d) {
        ${fixed ? 'set_bounds(low(), high() - d);' : 'high_ -= d;'}
    }

    void grow_left(int d) {
        ${fixed ? 'set_bounds(low() - d, high());' : 'low_ -= d;'}
    }
};

int main() {
    int a, b;
    std::cin >> a >> b;
    Window w(a, b);
    std::string command;
    int d;
    while (std::cin >> command >> d) {
        if (command == "shrink") {
            w.shrink_right(d);
        } else {
            w.grow_left(d);
        }
        w.print();
    }
    return 0;
}`;

export default {
  id: 'oop-protected',
  title: 'protected: доступ для наследников',
  description:
    'Третий уровень доступа и интерфейс для расширения; защищённые вспомогательные методы базы; защищённый конструктор, который запрещает создавать базу напрямую; почему защищённые данные ломают инвариант и как давать наследникам защищённые операции вместо полей; ограничения доступа к protected через другие объекты.',
  moduleId: 'cpp-oop',
  order: 15,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['oop-public-inheritance'],
  objectives: [
    'Открывать наследникам инструменты расширения через protected',
    'Запрещать прямое создание базового класса защищённым конструктором',
    'Сохранять инвариант базы, не открывая наследникам её данных',
  ],
  tags: ['C++23', 'ООП', 'protected', 'Наследование', 'Инвариант'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Кто может вызвать защищённый метод класса Base?',
      options: [
        'Методы Base и методы классов-наследников',
        'Любой код',
        'Только методы Base',
        'Только функции-друзья',
      ],
      correct: 0,
      explain: 'protected — доступ для наследников, но не для остального кода.',
    },
    {
      q: 'Что произойдёт при компиляции строки Quantity q(5); если конструктор Quantity защищённый?',
      options: [
        'Ошибка компиляции: конструктор недоступен',
        'Создастся объект Quantity',
        'Создастся объект первого наследника',
        'Предупреждение',
      ],
      correct: 0,
      explain: 'Защищённый конструктор вызывают только конструкторы наследников.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Base {
protected:
    int scale(int x) const { return x * factor_; }

private:
    int factor_ = 3;
};

class Derived : public Base {
public:
    int run(int x) const { return scale(x) + 1; }
};

int main() {
    Derived d;
    std::println("{}", d.run(4));
    return 0;
}`,
      lang: 'cpp',
      answers: ['13'],
      placeholder: 'Вывод программы',
      explain:
        'Наследник вызывает защищённый scale, а тот пользуется закрытым полем базы: 4 · 3 + 1.',
    },
    {
      q: 'Почему защищённые поля считаются плохой идеей?',
      options: [
        'Любой наследник может изменить их в обход инварианта базы',
        'Они медленнее закрытых',
        'Их нельзя инициализировать',
        'Они не наследуются',
      ],
      correct: 0,
      explain: 'Инвариант базы начинает зависеть от аккуратности всех будущих наследников.',
    },
    {
      q: 'Что дать наследнику вместо защищённых полей?',
      options: [
        'Защищённые операции, которые меняют поля и сами проверяют инвариант',
        'Открытые поля',
        'Дружбу с наследником',
        'Ничего: наследник не должен менять состояние базы',
      ],
      correct: 0,
      explain: 'Например, protected set_bounds(low, high), который сохраняет low ≤ high.',
    },
    {
      q: 'Внутри метода Window (наследник Range) написано other.low_, где other — Range &. Скомпилируется ли это, если low_ защищённое?',
      options: [
        'Нет: наследник видит защищённые члены своих объектов, но не произвольного объекта базы',
        'Да: наследник видит все защищённые члены',
        'Да, если other — константная ссылка',
        'Нет, потому что low_ закрытое',
      ],
      correct: 0,
      explain:
        'Это правило не даёт одному наследнику менять защищённое состояние объектов другого наследника.',
    },
    {
      q: 'Какой уровень доступа подходит методу, который нужен клиентам класса?',
      answers: ['public'],
      placeholder: 'Уровень',
      explain:
        'protected — только для расширения наследниками; то, чем пользуются клиенты, открывают.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Counter {
public:
    int value() const { return value_; }

protected:
    void bump(int d) { if (d > 0) value_ += d; }

private:
    int value_ = 0;
};

class Clicks : public Counter {
public:
    void click() { bump(1); }
    void hack() { bump(-100); }
};

int main() {
    Clicks c;
    c.click();
    c.click();
    c.hack();
    std::println("{}", c.value());
    return 0;
}`,
      lang: 'cpp',
      answers: ['2'],
      placeholder: 'Вывод программы',
      explain:
        'Защищённая операция bump охраняет правило «счётчик не уменьшается» даже от наследника.',
    },
  ],
  exercises: [
    {
      id: 'oop-protected-exercise',
      title: 'Отчёты',
      difficulty: 'beginner',
      description: `
Опишите базовый класс \`Report\` (заголовок) с **защищёнными** методами \`header()\` — печатает \`=== заголовок ===\` — и \`line(label, value)\` — печатает строку \`{:<12}{:>10}\`. Наследники:

- \`SalesReport\` (заголовок «Продажи»): строки «выручка» и «заказов»;
- \`StockReport\` (заголовок «Склад»): строки «позиций» и «стоимость».

Их открытый метод \`print()\` пользуется защищёнными инструментами базы. Строки ввода: \`sales выручка заказы\` или \`stock позиции стоимость\`; для каждой напечатайте отчёт.`,
      constraints: ['Строк не больше 10; числа до 10⁹.'],
      hints: [
        'header и line — в секции protected базы; title_ — в private.',
        'SalesReport(long long revenue, long long orders) : Report("Продажи"), … — заголовок передаётся конструктору базы.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Report {
public:
    explicit Report(std::string title) : title_(std::move(title)) {}

protected:
    void header() const {
        std::println("=== {} ===", title_);
    }

    void line(const std::string &label, long long value) const {
        std::println("{:<12}{:>10}", label, value);
    }

private:
    std::string title_;
};

class SalesReport : public Report {
public:
    SalesReport(long long revenue, long long orders) : Report("Продажи"), revenue_(revenue), orders_(orders) {}

    void print() const {
        header();
        line("выручка", revenue_);
        line("заказов", orders_);
    }

private:
    long long revenue_;
    long long orders_;
};

class StockReport : public Report {
public:
    StockReport(long long items, long long value) : Report("Склад"), items_(items), value_(value) {}

    void print() const {
        header();
        line("позиций", items_);
        line("стоимость", value_);
    }

private:
    long long items_;
    long long value_;
};

int main() {
    std::string kind;
    long long a, b;
    while (std::cin >> kind >> a >> b) {
        if (kind == "sales") {
            SalesReport(a, b).print();
        } else {
            StockReport(a, b).print();
        }
    }
    return 0;
}`,
      explanation: `
Оформление отчётов — общее знание, и оно живёт в базе. Но клиентам оно не нужно: им достаточно \`print()\`. Поэтому \`header\` и \`line\` защищённые — инструменты для наследников, а не часть публичного интерфейса.

Заголовок закрыт: наследники передают его в конструктор и больше не трогают. Ширина столбцов задана в одном месте, и все отчёты выглядят одинаково.`,
      examples: [
        {
          in: 'sales 1250000 37\n',
          out: '=== Продажи ===\nвыручка        1250000\nзаказов             37\n',
        },
        {
          in: 'stock 12 90000\n',
          out: '=== Склад ===\nпозиций             12\nстоимость        90000\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'sales 0 0\n', name: 'Нули' },
        { in: 'stock 1000000000 1000000000\n', name: 'Большие' },
        { in: 'sales 1 2\nstock 3 4\n', name: 'Два отчёта' },
        { in: 'stock 5 5\nstock 6 6\n', name: 'Два склада' },
        { in: 'sales 999999999 1\n', name: 'Широкое число' },
        { in: 'sales 42 7\n', name: 'Маленький' },
        { in: 'stock 0 123\nsales 456 0\n', name: 'Смесь' },
      ],
    },
    {
      title: 'Величины',
      description: `
Опишите базовый класс \`Quantity\` с **защищённым** конструктором от числа и открытым \`value()\`, и наследников \`Meters\` и \`Kilograms\`. У каждого наследника — метод \`plus\`, складывающий величины **своего** вида (\`Meters plus(Meters) const\`), так что сложить метры с килограммами невозможно.

Каждая строка ввода — \`m число\` или \`kg число\`. Сложите отдельно все метры и все килограммы и напечатайте \`метров: X, килограммов: Y\` с двумя знаками после точки.`,
      constraints: ['Строк не больше 50; числа от 0 до 10⁶.'],
      hints: [
        'Quantity: protected: explicit Quantity(double v) : value_(v) {} — создать «просто величину» нельзя.',
        'Meters plus(Meters other) const { return Meters(value() + other.value()); }. Сумма начинается с Meters(0).',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Quantity {
public:
    double value() const {
        return value_;
    }

protected:
    explicit Quantity(double value) : value_(value) {}

private:
    double value_;
};

class Meters : public Quantity {
public:
    explicit Meters(double v) : Quantity(v) {}

    Meters plus(Meters other) const {
        return Meters(value() + other.value());
    }
};

class Kilograms : public Quantity {
public:
    explicit Kilograms(double v) : Quantity(v) {}

    Kilograms plus(Kilograms other) const {
        return Kilograms(value() + other.value());
    }
};

int main() {
    Meters distance(0);
    Kilograms mass(0);
    std::string unit;
    double v;
    while (std::cin >> unit >> v) {
        if (unit == "m") {
            distance = distance.plus(Meters(v));
        } else {
            mass = mass.plus(Kilograms(v));
        }
    }
    std::println("метров: {:.2f}, килограммов: {:.2f}", distance.value(), mass.value());
    return 0;
}`,
      explanation: `
Защищённый конструктор делает \`Quantity\` «базой только для наследников»: величину без единицы создать нельзя. Метод \`plus\` каждого наследника принимает величину того же вида, поэтому \`distance.plus(Kilograms(5))\` не скомпилируется — ошибку единиц ловит компилятор.

Такие типы-«обёртки» над числом называют сильными типами (strong types): они ничего не стоят во время выполнения, но не дают перепутать метры с килограммами.`,
      examples: [
        { in: 'm 1.5\nkg 2\nm 3\n', out: 'метров: 4.50, килограммов: 2.00\n' },
        { in: '', out: 'метров: 0.00, килограммов: 0.00\n' },
      ],
      hidden: [
        { in: 'kg 0.001\n', name: 'Грамм' },
        { in: 'm 1000000\nm 1000000\n', name: 'Большие расстояния' },
        { in: 'kg 1\nkg 2\nkg 3\n', name: 'Только масса' },
        { in: 'm 0.1\nm 0.2\n', name: 'Дробные' },
        { in: 'm 5\nkg 5\n', name: 'По одному' },
        { in: 'm 0\nkg 0\n', name: 'Нули' },
        { in: 'kg 72.5\nm 1.8\nkg 0.5\n', name: 'Человек' },
        { in: 'm 2.345\n', name: 'Округление' },
      ],
    },
    {
      title: 'Найди ошибку: наследник ломает инвариант',
      bug: true,
      description: `
Класс \`Range\` обещает \`low ≤ high\` и печатает \`[low, high] длина N\`. Наследник \`Window\` умеет сужать окно справа (\`shrink d\`) и расширять слева (\`grow d\`). Первая строка ввода — начальные границы, затем команды; после каждой печатается окно.

После сильного сужения длина становится отрицательной. Найдите ошибку в устройстве классов и исправьте её так, чтобы никакой наследник не мог нарушить инвариант: если окно сужается сильнее своей длины, правая граница останавливается на левой.`,
      constraints: ['Числа по модулю до 10⁶; команд не больше 30; d от 0 до 10⁶.'],
      hints: [
        'Почему Window может написать high_ -= d? Какой уровень доступа у полей?',
        'Сделайте поля private, а наследнику дайте защищённые low(), high() и уже существующий set_bounds, который охраняет правило.',
      ],
      starter: RANGE(false),
      solution: RANGE(true),
      explanation: `
Поля \`low_\` и \`high_\` были защищёнными, и наследник менял их напрямую, минуя \`set_bounds\` — единственное место, где проверяется \`low ≤ high\`. База написала правильную проверку, но не могла заставить наследника ею пользоваться.

После исправления поля закрыты: наследник читает их через защищённые \`low()\` и \`high()\` и меняет только через \`set_bounds\`. Нарушить инвариант теперь не может ни \`Window\`, ни любой будущий наследник — компилятор не даст.`,
      examples: [
        { in: '0 10\nshrink 3\nshrink 15\n', out: '[0, 7] длина 7\n[0, 0] длина 0\n' },
        { in: '5 5\ngrow 2\n', out: '[3, 5] длина 2\n' },
      ],
      hidden: [
        '0 10\nshrink 11\n',
        '-5 5\nshrink 20\ngrow 1\n',
        '0 1000000\nshrink 1000000\nshrink 1\n',
        '1 2\nshrink 2\n',
        '0 0\nshrink 0\n',
        '10 20\nshrink 5\nshrink 6\n',
        '3 9\ngrow 1\nshrink 8\n',
        '-10 -1\nshrink 100\n',
      ],
    },
    {
      title: 'Журнал с уровнями',
      difficulty: 'advanced',
      description: `
Базовый класс \`Logger\` хранит **закрытые** счётчики сообщений трёх уровней и даёт наследникам **защищённый** метод \`write(level, text)\`, который печатает \`[УРОВЕНЬ] текст\` и увеличивает счётчик уровня; открыт только метод \`stats()\`: \`info: a, warn: b, error: c\`. Наследник \`AppLogger\` открывает клиентам методы \`info\`, \`warn\` и \`error\` (уровни печатаются как \`INFO\`, \`WARN\`, \`ERROR\`).

Каждая строка ввода — уровень (\`info\`, \`warn\` или \`error\`) и текст до конца строки. Пустые строки пропускайте. В конце вызовите \`stats()\`.`,
      constraints: ['Строк не больше 50, каждая до 200 символов.'],
      hints: [
        'Чтение: std::getline(std::cin, line); уровень — до первого пробела, текст — после него (line.substr(space + 1)).',
        'Счётчики удобно хранить массивом из трёх чисел, а уровень передавать перечислением enum class Level { info, warn, error };',
      ],
      solution: String.raw`
#include <array>
#include <iostream>
#include <print>
#include <string>
#include <string_view>

class Logger {
public:
    void stats() const {
        std::println("info: {}, warn: {}, error: {}", counts_[0], counts_[1], counts_[2]);
    }

protected:
    enum class Level { info, warn, error };

    void write(Level level, std::string_view text) {
        constexpr std::array<std::string_view, 3> names = {"INFO", "WARN", "ERROR"};
        auto index = static_cast<std::size_t>(level);
        counts_[index]++;
        std::println("[{}] {}", names[index], text);
    }

private:
    std::array<int, 3> counts_{};
};

class AppLogger : public Logger {
public:
    void info(std::string_view text) {
        write(Level::info, text);
    }

    void warn(std::string_view text) {
        write(Level::warn, text);
    }

    void error(std::string_view text) {
        write(Level::error, text);
    }
};

int main() {
    AppLogger log;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) {
            continue;
        }
        std::size_t space = line.find(' ');
        std::string level = line.substr(0, space);
        std::string text = space == std::string::npos ? "" : line.substr(space + 1);
        if (level == "info") {
            log.info(text);
        } else if (level == "warn") {
            log.warn(text);
        } else {
            log.error(text);
        }
    }
    log.stats();
    return 0;
}`,
      explanation: `
База отвечает за формат и учёт: она одна знает, как выглядит строка журнала и как считаются сообщения. Счётчики закрыты — наследник не может их подкрутить, — а запись открыта наследникам через защищённый \`write\`. Наследник решает другое: какие уровни и под какими именами открыть клиентам.

Даже перечисление \`Level\` объявлено в защищённой секции: оно — часть интерфейса расширения, а не клиентского. Клиенты \`AppLogger\` пишут \`log.warn(…)\` и ничего не знают о внутреннем устройстве уровней.`,
      examples: [
        {
          in: 'info запуск\nwarn мало места\nerror диск недоступен\ninfo остановка\n',
          out: '[INFO] запуск\n[WARN] мало места\n[ERROR] диск недоступен\n[INFO] остановка\ninfo: 2, warn: 1, error: 1\n',
        },
        { in: '', out: 'info: 0, warn: 0, error: 0\n' },
      ],
      hidden: [
        { in: 'error x\n', name: 'Одна ошибка' },
        { in: 'info a b c\n', name: 'Текст с пробелами' },
        { in: 'warn\n', name: 'Без текста' },
        { in: '\ninfo a\n\n', name: 'Пустые строки' },
        { in: 'info 1\ninfo 2\ninfo 3\n', name: 'Только info' },
        { in: 'warn диск заполнен на 95%\nerror сбой записи\n', name: 'Проценты' },
        { in: 'error e1\nerror e2\nwarn w\n', name: 'Ошибки' },
        { in: 'info {не формат}\n', name: 'Скобки в тексте' },
      ],
    },
  ],
};
