const STREAM = (fixed) => String.raw`
#include <iostream>
#include <string>
#include <utility>

class Item {
public:
    Item(std::string name, int count) : name_(std::move(name)), count_(count) {}

    friend ${fixed ? 'std::ostream &' : 'void'} operator<<(std::ostream &out, const Item &item) {
        ${fixed ? 'return ' : ''}out << item.name_ << " x" << item.count_;
    }

private:
    std::string name_;
    int count_;
};

int main() {
    std::string name;
    int count;
    bool first = true;
    while (std::cin >> name >> count) {
        if (!first) {
            std::cout << ", ";
        }
        std::cout << Item(name, count) << "";
        first = false;
    }
    std::cout << '\n';
    return 0;
}`;

export default {
  id: 'oop-printing',
  title: 'Печать своих типов: std::formatter и operator<<',
  description:
    'Почему std::print не умеет печатать свой тип; специализация std::formatter с методами parse и format; std::format_to; наследование от std::formatter<std::string> ради ширины и выравнивания; собственная спецификация формата и ошибка при компиляции; operator<< для потоков и возврат потока.',
  moduleId: 'cpp-oop',
  order: 10,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-operators'],
  objectives: [
    'Делать свой тип печатаемым через std::format и std::print',
    'Получать ширину и выравнивание от форматтера строк',
    'Разбирать собственную спецификацию формата',
    'Определять operator<< для потоков',
  ],
  tags: ['C++20', 'C++23', 'ООП', 'format', 'formatter'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <format>
#include <print>

struct Size {
    int w, h;
};

template <>
struct std::formatter<Size> {
    constexpr auto parse(std::format_parse_context &ctx) { return ctx.begin(); }
    auto format(const Size &s, std::format_context &ctx) const {
        return std::format_to(ctx.out(), "{}x{}", s.w, s.h);
    }
};

int main() {
    std::println("[{}] [{}]", Size{1920, 1080}, Size{3, 4});
    return 0;
}`,
      lang: 'cpp',
      answers: ['[1920x1080] [3x4]'],
      placeholder: 'Вывод программы',
      explain: 'После специализации std::formatter тип Size печатается, как встроенный.',
    },
    {
      q: 'Что должен вернуть метод parse форматтера, который не поддерживает настроек?',
      answers: ['ctx.begin()', 'ctx.begin();', 'return ctx.begin();'],
      placeholder: 'Выражение',
      explain:
        'parse возвращает позицию, где закончил разбор; «ничего не прочитал» — это ctx.begin().',
    },
    {
      q: 'Что делает std::format_to(ctx.out(), "…", …)?',
      options: [
        'Форматирует, как std::format, но дописывает результат в вывод и возвращает позицию его конца',
        'Создаёт новую строку',
        'Печатает сразу в stdout',
        'Проверяет спецификацию',
      ],
      correct: 0,
      explain: 'Эту позицию и возвращает метод format.',
    },
    {
      q: 'Что даёт наследование специализации от std::formatter<std::string>?',
      options: [
        'Готовый parse со шириной, выравниванием и заполнителем — достаточно подготовить текст',
        'Возможность печатать через std::cout',
        'Автоматическую печать всех полей',
        'Ускорение вывода',
      ],
      correct: 0,
      explain:
        'format готовит строку и передаёт её базовому format, который применяет спецификацию.',
    },
    {
      q: 'Когда выполняется метод parse при вызове std::println("{:F}", t)?',
      options: [
        'При компиляции: ошибка в спецификации становится ошибкой компиляции',
        'При каждом вызове println во время работы',
        'Один раз при запуске программы',
        'Никогда — его вызывает только std::format',
      ],
      correct: 0,
      explain:
        'Строка формата проверяется при компиляции, и parse — часть этой проверки, поэтому он constexpr.',
    },
    {
      q: 'Почему operator<< для потока возвращает std::ostream &?',
      options: [
        'Чтобы можно было соединять вызовы в цепочку: std::cout << a << b',
        'Так поток быстрее печатает',
        'Чтобы вернуть количество байтов',
        'Это необязательно и ни на что не влияет',
      ],
      correct: 0,
      explain: 'std::cout << a возвращает поток, и к нему применяется следующий <<.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <format>
#include <print>
#include <string>

struct Tag {
    std::string name;
};

template <>
struct std::formatter<Tag> : std::formatter<std::string> {
    auto format(const Tag &t, std::format_context &ctx) const {
        return std::formatter<std::string>::format("#" + t.name, ctx);
    }
};

int main() {
    std::println("[{:>6}][{:-<6}]", Tag{"cpp"}, Tag{"go"});
    return 0;
}`,
      lang: 'cpp',
      answers: ['[  #cpp][#go---]'],
      placeholder: 'Вывод программы',
      explain: 'Текст #cpp и #go выравнивается унаследованным форматтером строк.',
    },
    {
      q: 'Почему метод format в специализации должен быть const?',
      options: [
        'Библиотека вызывает его у константного объекта форматтера',
        'Чтобы он не менял форматируемый объект',
        'const-методы работают быстрее',
        'Это необязательно',
      ],
      correct: 0,
      explain:
        'Без const специализация не удовлетворяет требованиям, и компилятор откажется её использовать.',
    },
    {
      q: 'Чем форматтер лучше метода void print() const?',
      options: [
        'Объект можно вставить в любой текст, записать в строку, файл или stderr, задать ширину',
        'Форматтер не нужно объявлять',
        'print нельзя вызвать у константы',
        'Ничем',
      ],
      correct: 0,
      explain: 'print печатает только целую строку в stdout.',
    },
  ],
  exercises: [
    {
      id: 'oop-printing-exercise',
      title: 'Точки и отрезки',
      difficulty: 'beginner',
      description: `
Опишите структуры \`Point\` (целые \`x\`, \`y\`) и \`Segment\` (две точки \`a\`, \`b\`) и специализации \`std::formatter\` для них: точка печатается как \`(x, y)\`, отрезок — как \`[(x1, y1) - (x2, y2)]\`. Форматтер отрезка должен использовать форматтер точки (просто вставьте точки через \`{}\`).

Каждая строка ввода — четыре числа \`x1 y1 x2 y2\`. Напечатайте \`отрезок, длина L\` с двумя знаками после точки.`,
      constraints: ['Координаты по модулю до 10⁴; строк не больше 20.'],
      hints: [
        'Специализация: template <> struct std::formatter<Point> { parse возвращает ctx.begin(); format пишет std::format_to(ctx.out(), "({}, {})", p.x, p.y); };',
        'В форматтере отрезка: std::format_to(ctx.out(), "[{} - {}]", s.a, s.b) — Point уже печатается. Длина — std::hypot.',
      ],
      solution: String.raw`
#include <cmath>
#include <format>
#include <iostream>
#include <print>

struct Point {
    int x;
    int y;
};

struct Segment {
    Point a;
    Point b;

    double length() const {
        return std::hypot(a.x - b.x, a.y - b.y);
    }
};

template <>
struct std::formatter<Point> {
    constexpr auto parse(std::format_parse_context &ctx) {
        return ctx.begin();
    }

    auto format(const Point &p, std::format_context &ctx) const {
        return std::format_to(ctx.out(), "({}, {})", p.x, p.y);
    }
};

template <>
struct std::formatter<Segment> {
    constexpr auto parse(std::format_parse_context &ctx) {
        return ctx.begin();
    }

    auto format(const Segment &s, std::format_context &ctx) const {
        return std::format_to(ctx.out(), "[{} - {}]", s.a, s.b);
    }
};

int main() {
    Segment s;
    while (std::cin >> s.a.x >> s.a.y >> s.b.x >> s.b.y) {
        std::println("{}, длина {:.2f}", s, s.length());
    }
    return 0;
}`,
      explanation: `
Форматтеры складываются, как кубики: форматтер отрезка не знает, как печатается точка, — он просто вставляет точки через \`{}\`, и \`std::format_to\` находит форматтер \`Point\`. Поменяйте формат точки — изменится и вывод отрезков.

Обе специализации не поддерживают настроек, поэтому их \`parse\` сразу возвращают \`ctx.begin()\`.`,
      examples: [
        { in: '0 0 3 4\n', out: '[(0, 0) - (3, 4)], длина 5.00\n' },
        { in: '-1 2 -1 2\n', out: '[(-1, 2) - (-1, 2)], длина 0.00\n' },
      ],
      hidden: [
        { in: '1 1 2 2\n', name: 'Диагональ' },
        { in: '10000 10000 -10000 -10000\n', name: 'Большой отрезок' },
        { in: '0 0 0 7\n', name: 'Вертикальный' },
        { in: '5 0 -5 0\n', name: 'Горизонтальный' },
        { in: '1 2 4 6\n3 3 0 0\n', name: 'Два отрезка' },
        { in: '', name: 'Пусто' },
        { in: '-3 -4 0 0\n', name: 'К началу координат' },
        { in: '7 1 2 9\n', name: 'Произвольный' },
      ],
    },
    {
      title: 'Чек в рублях',
      description: `
Опишите класс \`Money\` (сумма в копейках) и специализацию \`std::formatter<Money>\`, унаследованную от \`std::formatter<std::string>\`: сумма печатается как \`1234.56 руб.\`, а ширина и выравнивание работают как у строк.

Каждая строка ввода — название товара и цена в копейках. Напечатайте чек: для каждого товара строку \`{:<12}{:>16}\` (название и цена), затем \`{:-<28}\` — разделитель из 28 дефисов (пустая строка, дополненная дефисами), затем \`{:<12}{:>16}\` со словом \`Итого\` и суммой.`,
      constraints: [
        'Товаров не больше 20; цены от 0 до 10⁹ копеек; названия — одно слово до 11 символов.',
      ],
      hints: [
        'Внутри format: std::string text = std::format("{}.{:02} руб.", m.kopecks() / 100, m.kopecks() % 100); return std::formatter<std::string>::format(text, ctx);',
        'Шаблон строки чека: std::println("{:<12}{:>16}", name, Money(price)) — спецификация {:>16} применится к тексту суммы.',
      ],
      solution: String.raw`
#include <format>
#include <iostream>
#include <print>
#include <string>

class Money {
public:
    explicit Money(long long kopecks) : kopecks_(kopecks) {}

    long long kopecks() const {
        return kopecks_;
    }

    Money &operator+=(Money other) {
        kopecks_ += other.kopecks_;
        return *this;
    }

private:
    long long kopecks_;
};

template <>
struct std::formatter<Money> : std::formatter<std::string> {
    auto format(const Money &m, std::format_context &ctx) const {
        std::string text = std::format("{}.{:02} руб.", m.kopecks() / 100, m.kopecks() % 100);
        return std::formatter<std::string>::format(text, ctx);
    }
};

int main() {
    std::string name;
    long long price;
    Money total(0);
    while (std::cin >> name >> price) {
        std::println("{:<12}{:>16}", name, Money(price));
        total += Money(price);
    }
    std::println("{:-<28}", "");
    std::println("{:<12}{:>16}", "Итого", total);
    return 0;
}`,
      explanation: `
Форматтер \`Money\` занят только одним — превратить копейки в текст. Всё остальное — ширину 16, выравнивание вправо — делает унаследованный форматтер строк, разбирая ту же спецификацию, что и для обычной строки. Поэтому \`Money\` встаёт в столбец чека так же, как число.

Ширина считается в символах, так что «руб.» и русские названия не сдвигают столбцы.`,
      examples: [
        {
          in: 'хлеб 5450\nсыр 65000\n',
          out: 'хлеб              54.50 руб.\nсыр              650.00 руб.\n----------------------------\nИтого            704.50 руб.\n',
        },
        { in: '', out: '----------------------------\nИтого              0.00 руб.\n' },
      ],
      hidden: [
        { in: 'спичка 1\n', name: 'Копейка' },
        { in: 'яхта 1000000000\n', name: 'Миллиард копеек' },
        { in: 'a 99\nb 1\n', name: 'Ровно рубль' },
        { in: 'чай 19999\nкофе 49900\nсахар 8900\n', name: 'Три товара' },
        { in: 'x 0\n', name: 'Бесплатно' },
        { in: 'длинноеимя 12345\n', name: 'Длинное название' },
        { in: 'a 5\nb 5\nc 5\nd 5\n', name: 'Мелочь' },
        { in: 'milk 8990\nbread 4550\n', name: 'Латиница' },
      ],
    },
    {
      title: 'Найди ошибку: потерянная цепочка',
      bug: true,
      description: `
Каждая строка ввода — название и количество. Класс \`Item\` печатается в поток оператором \`<<\` как \`название xколичество\`, а программа выводит все товары в одну строку через запятую:

\`\`\`text
яблоко x3, груша x5
\`\`\`

Программа не компилируется: компилятор жалуется на строку с цепочкой \`<<\`. Найдите и исправьте ошибку в операторе.`,
      constraints: ['Строк не больше 20.'],
      hints: [
        'Выражение std::cout << Item(…) << "" — к результату первого << применяется второй. Что возвращает ваш оператор?',
        'Оператор должен возвращать поток: std::ostream &operator<<(std::ostream &out, const Item &item) { return out << …; }.',
      ],
      starter: STREAM(false),
      solution: STREAM(true),
      explanation: `
\`std::cout << Item(name, count) << ""\` вычисляется слева направо: сначала \`std::cout << Item(…)\`, затем к **результату** применяется \`<< ""\`. Оператор возвращал \`void\` — и выражение \`void << ""\` не имеет смысла, отсюда ошибка компиляции \`invalid operands to binary expression\`.

Оператор вывода всегда возвращает поток, который получил: \`return out << …;\`. Так он ведёт себя как встроенные операторы \`<<\`, и объекты можно смешивать с числами и строками в одной цепочке.`,
      examples: [
        { in: 'яблоко 3\nгруша 5\n', out: 'яблоко x3, груша x5\n' },
        { in: '', out: '\n' },
      ],
      hidden: [
        'a 1\n',
        'чай 0\n',
        'x 1\ny 2\nz 3\n',
        'молоко 100\n',
        'p -1\n',
        'кот 9\nпёс 8\n',
        'item 2147483647\n',
        'one 1\ntwo 2\n',
      ],
    },
    {
      title: 'Время со спецификацией',
      difficulty: 'advanced',
      description: `
Опишите структуру \`Clock\` (часы и минуты) и специализацию \`std::formatter<Clock>\` со своей спецификацией:

- \`{}\` или \`{:H}\` — 24-часовой формат \`ЧЧ:ММ\`: \`09:05\`, \`14:30\`;
- \`{:h}\` — 12-часовой формат без ведущего нуля в часах: \`9:05 AM\`, \`2:30 PM\`; полночь — \`12:00 AM\`, полдень — \`12:00 PM\`.

Любая другая спецификация — ошибка формата (\`std::format_error\` в \`parse\`). Каждая строка ввода — время \`ЧЧ:ММ\`; напечатайте \`{} = {:h}\`.`,
      constraints: ['Время корректно; строк не больше 30.'],
      hints: [
        "Поле char style = 'H'; в parse: если текущий символ H или h — запомнить и сдвинуть итератор; если после этого не }, — throw std::format_error.",
        '12-часовой формат: часы h % 12, а если получился 0 — 12; суффикс AM для часов до 12, иначе PM.',
      ],
      solution: String.raw`
#include <format>
#include <iostream>
#include <print>

struct Clock {
    int hours;
    int minutes;
};

template <>
struct std::formatter<Clock> {
    char style = 'H';

    constexpr auto parse(std::format_parse_context &ctx) {
        auto it = ctx.begin();
        if (it != ctx.end() && (*it == 'H' || *it == 'h')) {
            style = *it++;
        }
        if (it != ctx.end() && *it != '}') {
            throw std::format_error("ожидается H или h");
        }
        return it;
    }

    auto format(const Clock &c, std::format_context &ctx) const {
        if (style == 'H') {
            return std::format_to(ctx.out(), "{:02}:{:02}", c.hours, c.minutes);
        }
        int h = c.hours % 12 == 0 ? 12 : c.hours % 12;
        return std::format_to(ctx.out(), "{}:{:02} {}", h, c.minutes, c.hours < 12 ? "AM" : "PM");
    }
};

int main() {
    Clock c;
    char colon;
    while (std::cin >> c.hours >> colon >> c.minutes) {
        std::println("{} = {:h}", c, c);
    }
    return 0;
}`,
      explanation: `
\`parse\` читает спецификацию и сохраняет выбор в поле форматтера; \`format\` затем печатает в выбранном стиле. Разделение работает, потому что для каждого места \`{…}\` в шаблоне создаётся свой форматтер: в \`"{} = {:h}"\` их два, с разными \`style\`.

Неизвестная буква — исключение \`std::format_error\` в \`parse\`. Поскольку строка формата проверяется при компиляции, \`std::println("{:x}", c)\` даже не соберётся — ошибку увидит программист, а не пользователь. Особые случаи 12-часового формата — полночь и полдень — решаются одной формулой: \`h % 12\`, заменённое на 12 при нуле.`,
      examples: [
        { in: '09:05\n14:30\n', out: '09:05 = 9:05 AM\n14:30 = 2:30 PM\n' },
        { in: '00:00\n12:00\n', out: '00:00 = 12:00 AM\n12:00 = 12:00 PM\n' },
      ],
      hidden: [
        { in: '23:59\n', name: 'Конец дня' },
        { in: '00:01\n', name: 'После полуночи' },
        { in: '11:59\n12:01\n', name: 'Около полудня' },
        { in: '01:00\n13:00\n', name: 'Час ночи и дня' },
        { in: '10:10\n', name: 'Утро' },
        { in: '18:45\n06:45\n', name: 'Вечер и утро' },
        { in: '', name: 'Пусто' },
        { in: '20:05\n', name: 'Ведущий ноль в минутах' },
      ],
    },
  ],
};
