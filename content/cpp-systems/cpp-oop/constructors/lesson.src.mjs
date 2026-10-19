const SUMMARY = (fixed) => String.raw`
#include <iostream>
#include <print>

class Summary {
public:
    Summary(long long sum, int count)
        : sum_(sum), count_(count), average_(static_cast<double>(sum_) / count_) {}

    void print() const {
        std::println("среднее {:.2f} из {} чисел", average_, count_);
    }

private:
${
  fixed
    ? '    long long sum_;\n    int count_;\n    double average_;'
    : '    double average_;\n    int count_;\n    long long sum_;'
}
};

int main() {
    int n;
    std::cin >> n;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        std::cin >> x;
        sum += x;
    }
    Summary s(sum, n);
    s.print();
    return 0;
}`;

export default {
  id: 'oop-constructors',
  title: 'Конструкторы',
  description:
    'Объект, готовый к работе с первой строки: конструктор и инвариант, исключение при недопустимых аргументах; список инициализации и почему он лучше присваивания; порядок инициализации полей и -Wreorder; конструктор по умолчанию и = default; перегрузка и делегирование конструкторов; explicit; статическая фабрика с std::expected.',
  moduleId: 'cpp-oop',
  order: 3,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-class'],
  objectives: [
    'Писать конструкторы, которые устанавливают инвариант или отказываются создавать объект',
    'Инициализировать поля в списке инициализации в правильном порядке',
    'Применять = default, делегирование и explicit',
    'Создавать объекты с проверкой через статическую фабрику',
  ],
  tags: ['C++23', 'ООП', 'Конструктор', 'explicit', 'expected'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Counter {
public:
    explicit Counter(int start) : value_(start * 2) {}
    Counter() : Counter(5) {}
    int value() const { return value_; }

private:
    int value_;
};

int main() {
    Counter a;
    Counter b(3);
    std::println("{} {}", a.value(), b.value());
    return 0;
}`,
      lang: 'cpp',
      answers: ['10 6'],
      placeholder: 'Вывод программы',
      explain:
        'Конструктор по умолчанию делегирует конструктору с параметром 5, который удваивает значение.',
    },
    {
      q: 'Что происходит, если конструктор бросает исключение?',
      options: [
        'Объект не создаётся, и использовать его невозможно',
        'Объект создаётся с нулевыми полями',
        'Исключение игнорируется, поля остаются мусором',
        'Программа всегда завершается',
      ],
      correct: 0,
      explain: 'Это стандартный способ отказаться создавать объект с недопустимыми данными.',
    },
    {
      q: 'Почему поля лучше инициализировать в списке инициализации, а не присваивать в теле конструктора? Выберите все верные причины.',
      options: [
        'Поля-константы и поля-ссылки можно только инициализировать',
        'Поле без конструктора по умолчанию нельзя сначала создать «пустым»',
        'Для строк и контейнеров не будет лишнего создания и замены',
        'В теле конструктора поля недоступны',
      ],
      correct: [0, 1, 2],
      explain:
        'К моменту выполнения тела все поля уже созданы — присваивание лишь заменяет значение.',
    },
    {
      q: 'В каком порядке инициализируются поля?',
      options: [
        'В порядке объявления полей в классе',
        'В порядке записи в списке инициализации',
        'В алфавитном порядке',
        'Порядок не определён',
      ],
      correct: 0,
      explain:
        'Поэтому список пишут в порядке объявления, а компилятор предупреждает о расхождении (-Wreorder).',
    },
    {
      q: 'В классе объявлен только конструктор Fraction(int, int). Что произойдёт при компиляции строки Fraction f;?',
      options: [
        'Ошибка компиляции: конструктора по умолчанию нет',
        'Создастся дробь 0/1',
        'Создастся дробь с мусором в полях',
        'Вызовется Fraction(0, 0)',
      ],
      correct: 0,
      explain:
        'Любой свой конструктор отменяет автоматический конструктор по умолчанию. Вернуть его можно через = default.',
    },
    {
      q: 'Что запрещает слово explicit у конструктора Meters(double value)?',
      options: [
        'Неявное превращение числа в Meters — например, передачу 5.0 туда, где ждут Meters',
        'Создание объекта Meters(5.0)',
        'Копирование объектов Meters',
        'Изменение поля после создания',
      ],
      correct: 0,
      explain: 'С explicit нужно написать Meters(5.0) явно, и единицы измерения видны в коде.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>

class Tag {
public:
    explicit Tag(std::string text) : text_("#" + text), length_(text_.size()) {}
    void print() const { std::println("{} {}", text_, length_); }

private:
    std::string text_;
    std::size_t length_;
};

int main() {
    Tag t("cpp");
    t.print();
    return 0;
}`,
      lang: 'cpp',
      answers: ['#cpp 4'],
      placeholder: 'Вывод программы',
      explain:
        'text_ объявлено раньше length_, поэтому к моменту вычисления длины строка уже готова.',
    },
    {
      q: 'Как вызвать статическую функцию make класса Percent?',
      answers: ['Percent::make(…)', 'Percent::make()', 'Percent::make', 'Percent::make(42)'],
      placeholder: 'Выражение',
      explain:
        'Статическая функция принадлежит классу, а не объекту, и вызывается через имя класса и ::.',
    },
    {
      q: 'Зачем делать конструктор закрытым, если есть статическая фабрика make, возвращающая std::expected?',
      options: [
        'Чтобы объект нельзя было создать в обход проверки в make',
        'Чтобы конструктор работал быстрее',
        'Закрытые конструкторы нельзя вызвать даже внутри класса',
        'Так требует std::expected',
      ],
      correct: 0,
      explain:
        'Фабрика — часть класса и может вызвать закрытый конструктор; код снаружи — только через неё.',
    },
  ],
  exercises: [
    {
      id: 'oop-constructors-exercise',
      title: 'Дроби',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — числитель и знаменатель. Опишите класс \`Fraction\`, конструктор которого приводит дробь к виду с положительным знаменателем и сокращает её, а при нулевом знаменателе бросает \`std::invalid_argument\`. Для каждой строки напечатайте дробь \`a/b\` или \`ошибка: знаменатель равен нулю\`.`,
      constraints: ['Числа по модулю до 10⁹; строк не больше 20.'],
      hints: [
        'В конструкторе: проверка нуля, затем смена знака обоих чисел при отрицательном знаменателе, затем деление на std::gcd из <numeric>.',
        'Создание дроби — внутри try, перехват — catch (const std::invalid_argument &e), текст — e.what().',
      ],
      solution: String.raw`
#include <iostream>
#include <numeric>
#include <print>
#include <stdexcept>

class Fraction {
public:
    Fraction(long long numerator, long long denominator) {
        if (denominator == 0) {
            throw std::invalid_argument("знаменатель равен нулю");
        }
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }
        long long g = std::gcd(numerator, denominator);
        num_ = numerator / g;
        den_ = denominator / g;
    }

    void print() const {
        std::println("{}/{}", num_, den_);
    }

private:
    long long num_;
    long long den_;
};

int main() {
    long long a, b;
    while (std::cin >> a >> b) {
        try {
            Fraction f(a, b);
            f.print();
        } catch (const std::invalid_argument &e) {
            std::println("ошибка: {}", e.what());
        }
    }
    return 0;
}`,
      explanation: `
Конструктор либо создаёт дробь в каноническом виде — положительный знаменатель, несократимая, — либо не создаёт её вовсе. Поэтому \`print\` и любые будущие методы могут полагаться на инвариант без проверок.

Для \`0/5\` \`std::gcd(0, 5) = 5\`, и дробь становится \`0/1\` — каноническим нулём. Тип \`long long\` взят ради смены знака: \`-(-2³¹)\` не помещается в \`int\`.`,
      examples: [
        { in: '6 -8\n1 0\n', out: '-3/4\nошибка: знаменатель равен нулю\n' },
        { in: '10 5\n', out: '2/1\n' },
      ],
      hidden: [
        { in: '0 5\n', name: 'Ноль' },
        { in: '-4 -6\n', name: 'Оба отрицательные' },
        { in: '7 13\n', name: 'Несократимая' },
        { in: '1000000000 -1000000000\n', name: 'Большие' },
        { in: '0 0\n', name: 'Ноль на ноль' },
        { in: '12 18\n-1 1\n', name: 'Две дроби' },
        { in: '999999999 333333333\n', name: 'Целая' },
        { in: '5 0\n3 9\n', name: 'Ошибка и дробь' },
      ],
    },
    {
      title: 'Длительности',
      description: `
Каждая строка ввода — длительность в одной из двух форм: \`m M\` — минуты или \`hm H M\` — часы и минуты. Опишите класс \`Duration\` с двумя конструкторами: \`explicit Duration(int minutes)\` (отрицательное значение превращается в 0) и \`Duration(int hours, int minutes)\`, который **делегирует** первому. Для каждой строки напечатайте \`H ч M мин\`, а в конце — \`всего H ч M мин\`.`,
      constraints: ['Строк не больше 30; числа по модулю до 10⁴.'],
      hints: [
        'Делегирование: Duration(int hours, int minutes) : Duration(hours * 60 + minutes) {}.',
        'Добавьте метод int minutes() const, чтобы сложить длительности, и метод print() const для вывода.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Duration {
public:
    explicit Duration(int minutes) : minutes_(minutes < 0 ? 0 : minutes) {}
    Duration(int hours, int minutes) : Duration(hours * 60 + minutes) {}

    int minutes() const {
        return minutes_;
    }

    void print(const char *prefix) const {
        std::println("{}{} ч {} мин", prefix, minutes_ / 60, minutes_ % 60);
    }

private:
    int minutes_;
};

int main() {
    std::string kind;
    int total = 0;
    while (std::cin >> kind) {
        int a, b = 0;
        std::cin >> a;
        if (kind == "hm") {
            std::cin >> b;
        }
        Duration d = kind == "hm" ? Duration(a, b) : Duration(a);
        d.print("");
        total += d.minutes();
    }
    Duration(total).print("всего ");
    return 0;
}`,
      explanation: `
Правило «отрицательное — это ноль» записано только в конструкторе от минут; конструктор от часов и минут делегирует ему, поэтому \`hm -1 30\` (это −30 минут) тоже превращается в ноль. Две формы ввода не размножают проверки.

\`explicit\` здесь не мешает: везде, где нужна длительность, она создаётся явно — \`Duration(a)\`. Сумма считается в минутах и снова превращается в \`Duration\` только для печати.`,
      examples: [
        { in: 'm 90\nhm 2 15\n', out: '1 ч 30 мин\n2 ч 15 мин\nвсего 3 ч 45 мин\n' },
        { in: 'm -10\n', out: '0 ч 0 мин\nвсего 0 ч 0 мин\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'hm 0 59\nm 1\n', name: 'Ровно час' },
        { in: 'hm -1 30\n', name: 'Отрицательные часы' },
        { in: 'hm 1 -30\n', name: 'Отрицательные минуты' },
        { in: 'm 10000\n', name: 'Много минут' },
        { in: 'hm 10000 0\n', name: 'Много часов' },
        { in: 'm 0\nhm 0 0\n', name: 'Нули' },
        { in: 'm 45\nm 45\nhm 1 0\n', name: 'Три длительности' },
      ],
    },
    {
      title: 'Найди ошибку: порядок инициализации',
      bug: true,
      description: `
Программа читает число \`n\` и \`n\` целых чисел и печатает их среднее:

\`\`\`text
среднее 2.50 из 4 чисел
\`\`\`

Класс \`Summary\` вычисляет среднее в списке инициализации конструктора — и печатает что-то странное. Найдите и исправьте ошибку, не меняя список инициализации.`,
      constraints: ['1 ≤ n ≤ 100; числа по модулю до 10⁹.'],
      hints: [
        'Соберите программу и прочитайте предупреждения компилятора: -Wreorder говорит, в каком порядке на самом деле инициализируются поля.',
        'Поля создаются в порядке объявления. average_ объявлено первым и вычисляется из ещё не инициализированных sum_ и count_. Объявите поля в том порядке, в каком они зависят друг от друга.',
      ],
      starter: SUMMARY(false),
      solution: SUMMARY(true),
      explanation: `
Список инициализации **выглядит** правильным: сначала \`sum_\`, потом \`count_\`, потом \`average_\`. Но порядок задаёт объявление полей в классе, а там \`average_\` стоит первым. Его инициализатор читает \`sum_\` и \`count_\`, которые ещё не созданы, — это мусор, и результат непредсказуем. GCC и Clang предупреждают: \`field 'sum_' will be initialized after field 'average_'\`.

Исправление — объявить поля в порядке зависимостей: \`sum_\`, \`count_\`, \`average_\`. Предупреждение \`-Wreorder\` из этого урока стоит считать ошибкой: оно почти всегда указывает на чтение неинициализированного поля.`,
      examples: [
        { in: '4\n1 2 3 4\n', out: 'среднее 2.50 из 4 чисел\n' },
        { in: '1\n-7\n', out: 'среднее -7.00 из 1 чисел\n' },
      ],
      hidden: [
        '3\n10 20 30\n',
        '2\n1000000000 1000000000\n',
        '5\n1 1 1 1 2\n',
        '3\n-1 -2 -3\n',
        '2\n0 1\n',
        '6\n5 5 5 5 5 5\n',
        '3\n100 -100 1\n',
        '4\n7 0 0 0\n',
      ],
    },
    {
      title: 'Цвет из строки',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — цвет в веб-записи \`#RRGGBB\` (цифры в любом регистре). Опишите класс \`Color\` с **закрытым** конструктором от трёх компонент и статической функцией

\`\`\`cpp
static std::expected<Color, std::string> parse(std::string_view text);
\`\`\`

Для правильной записи напечатайте \`rgb(R, G, B), яркость L\`, где \`L = (299·R + 587·G + 114·B) / 1000\` (целочисленно). Иначе — \`ошибка: текст\`, проверяя по порядку:

1. первый символ не \`#\` → \`нет знака #\`;
2. длина не 7 → \`нужно 6 цифр\`;
3. символ не шестнадцатеричная цифра → \`не шестнадцатеричная цифра 'x'\` (первый такой символ).`,
      constraints: ['Строк не больше 30, без пробелов, длина до 20.'],
      hints: [
        "Значение шестнадцатеричной цифры: '0'–'9' → c − '0', 'a'–'f' → c − 'a' + 10, 'A'–'F' → c − 'A' + 10, иначе −1. Удобно вынести в отдельную функцию.",
        'Компонента — два символа: 16 · первая цифра + вторая. Статическая parse — часть класса, поэтому может вызвать закрытый конструктор: return Color(r, g, b);.',
      ],
      solution: String.raw`
#include <expected>
#include <iostream>
#include <print>
#include <string>
#include <string_view>

int hex_digit(char c) {
    if (c >= '0' && c <= '9') {
        return c - '0';
    }
    if (c >= 'a' && c <= 'f') {
        return c - 'a' + 10;
    }
    if (c >= 'A' && c <= 'F') {
        return c - 'A' + 10;
    }
    return -1;
}

class Color {
public:
    static std::expected<Color, std::string> parse(std::string_view text) {
        if (text.empty() || text[0] != '#') {
            return std::unexpected("нет знака #");
        }
        if (text.size() != 7) {
            return std::unexpected("нужно 6 цифр");
        }
        int parts[3] = {};
        for (std::size_t i = 1; i < 7; i++) {
            int d = hex_digit(text[i]);
            if (d < 0) {
                return std::unexpected(std::string("не шестнадцатеричная цифра '") + text[i] + "'");
            }
            parts[(i - 1) / 2] = parts[(i - 1) / 2] * 16 + d;
        }
        return Color(parts[0], parts[1], parts[2]);
    }

    int brightness() const {
        return (299 * r_ + 587 * g_ + 114 * b_) / 1000;
    }

    void print() const {
        std::println("rgb({}, {}, {}), яркость {}", r_, g_, b_, brightness());
    }

private:
    Color(int r, int g, int b) : r_(r), g_(g), b_(b) {}
    int r_;
    int g_;
    int b_;
};

int main() {
    std::string line;
    while (std::cin >> line) {
        auto color = Color::parse(line);
        if (color) {
            color->print();
        } else {
            std::println("ошибка: {}", color.error());
        }
    }
    return 0;
}`,
      explanation: `
Закрытый конструктор не проверяет ничего — он доверяет единственной функции, которая может его вызвать. Вся проверка сосредоточена в \`parse\`: создать \`Color\` в обход неё невозможно, а значит, каждый существующий цвет корректен.

Неверная строка цвета — обычный ввод, а не сбой программы, поэтому \`parse\` возвращает \`std::expected\`, а не бросает исключение. Каждая проверка возвращает свою причину, и порядок проверок совпадает с условием. Две цифры одной компоненты накапливаются как \`значение · 16 + цифра\` — тот же приём, что при переводе десятичной строки в число.`,
      examples: [
        {
          in: '#FF8800\n#1a2b3c\n',
          out: 'rgb(255, 136, 0), яркость 156\nrgb(26, 43, 60), яркость 39\n',
        },
        {
          in: 'FF8800\n#FFF\n#12G456\n',
          out: "ошибка: нет знака #\nошибка: нужно 6 цифр\nошибка: не шестнадцатеричная цифра 'G'\n",
        },
      ],
      hidden: [
        { in: '#000000\n#ffffff\n', name: 'Чёрный и белый' },
        { in: '#FF0000\n#00FF00\n#0000FF\n', name: 'Основные цвета' },
        { in: '#\n', name: 'Только решётка' },
        { in: '#1234567\n', name: 'Длинная' },
        { in: '##12345\n', name: 'Две решётки' },
        { in: '#abcdeF\n', name: 'Смешанный регистр' },
        { in: '#12 456\n', name: 'Разбито пробелом' },
        { in: 'red\n#808080\n', name: 'Слово и серый' },
      ],
    },
  ],
};
