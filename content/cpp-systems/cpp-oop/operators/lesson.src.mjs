const FRACTIONS = (fixed) => String.raw`
#include <compare>
#include <iostream>
#include <print>
#include <set>

class Fraction {
public:
    Fraction(int numerator, int denominator) : num_(numerator), den_(denominator) {}

${
  fixed
    ? `    friend bool operator==(Fraction a, Fraction b) {
        return 1LL * a.num_ * b.den_ == 1LL * b.num_ * a.den_;
    }

    friend std::strong_ordering operator<=>(Fraction a, Fraction b) {
        return 1LL * a.num_ * b.den_ <=> 1LL * b.num_ * a.den_;
    }`
    : `    auto operator<=>(const Fraction &) const = default;`
}

    void print() const {
        std::println("{}/{}", num_, den_);
    }

private:
    int num_;
    int den_;   // всегда положителен
};

int main() {
    std::set<Fraction> distinct;
    int a, b;
    while (std::cin >> a >> b) {
        distinct.insert(Fraction(a, b));
    }
    std::println("различных: {}", distinct.size());
    if (!distinct.empty()) {
        distinct.begin()->print();
        distinct.rbegin()->print();
    }
    return 0;
}`;

export default {
  id: 'oop-operators',
  title: 'Перегрузка операторов и сравнение',
  description:
    'Операторы как функции с особыми именами; += как метод и + как свободная функция; сравнение в C++20: operator<=> и operator== по умолчанию, все шесть сравнений из двух; своё сравнение для дробей и std::strong_ordering; скрытые друзья; operator[] с несколькими индексами из C++23; какие операторы не перегружать.',
  moduleId: 'cpp-oop',
  order: 9,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-encapsulation'],
  objectives: [
    'Определять арифметические операторы для своих типов',
    'Получать все сравнения из operator<=> и operator==',
    'Писать собственное сравнение, когда равенство не сводится к полям',
    'Перегружать operator[], в том числе с несколькими индексами',
  ],
  tags: ['C++20', 'C++23', 'ООП', 'Операторы', '<=>'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Point {
    int x, y;
    bool operator==(const Point &) const = default;
};

Point operator+(Point a, Point b) {
    return {a.x + b.x, a.y + b.y};
}

int main() {
    Point p = Point{1, 2} + Point{3, 4};
    std::println("{} {} {}", p.x, p.y, p == Point{4, 6});
    return 0;
}`,
      lang: 'cpp',
      answers: ['4 6 true'],
      placeholder: 'Вывод программы',
      explain: 'operator+ складывает координаты; == по умолчанию сравнивает все поля.',
    },
    {
      q: 'Во что компилятор превращает выражение a + b для объектов своего класса?',
      options: [
        'В вызов operator+(a, b) или a.operator+(b)',
        'В побайтовое сложение объектов',
        'В вызов метода add',
        'Ни во что: для своих типов + запрещён',
      ],
      correct: 0,
      explain: 'Операторы — функции с особыми именами, их можно определить для любого типа.',
    },
    {
      q: 'Почему += обычно делают методом, а + — свободной функцией?',
      options: [
        '+= меняет левый операнд и возвращает *this; + создаёт новый объект и должен работать при любом порядке операндов',
        'Свободные функции работают быстрее',
        'Методы не могут возвращать объекты',
        'Так требует компилятор',
      ],
      correct: 0,
      explain: 'Логика пишется один раз в +=, а + выражается через него.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Date {
    int year, month, day;
    auto operator<=>(const Date &) const = default;
};

int main() {
    Date a{2024, 12, 31}, b{2025, 1, 1};
    std::println("{} {}", a < b, a == Date{2024, 12, 31});
    return 0;
}`,
      lang: 'cpp',
      answers: ['true true'],
      placeholder: 'Вывод программы',
      explain: '<=> по умолчанию сравнивает поля по порядку: год решает сразу. Он же даёт и ==.',
    },
    {
      q: 'Какие операторы компилятор выводит из объявления auto operator<=>(const T &) const = default;? Выберите все.',
      options: ['<', '>=', '==', '+'],
      correct: [0, 1, 2],
      explain:
        'Из <=> выводятся <, <=, >, >=; объявленный по умолчанию <=> добавляет и == (а с ним !=).',
    },
    {
      q: 'Почему для дробей нельзя использовать operator<=> = default?',
      options: [
        'Сравнение по умолчанию сравнивает поля: 1/2 и 2/4 окажутся разными',
        'Дроби нельзя сравнивать',
        'Поля дроби закрыты',
        'Можно, это правильно',
      ],
      correct: 0,
      explain:
        'По умолчанию равенство объектов = равенство всех полей. У несокращённых дробей это не так.',
    },
    {
      q: 'Как записать в C++23 обращение к элементу матрицы m в строке i и столбце j через operator[] с двумя аргументами?',
      answers: ['m[i, j]', 'm[i,j]'],
      placeholder: 'Выражение',
      explain: 'C++23 разрешил operator[] с несколькими параметрами.',
    },
    {
      q: 'Что такое «скрытый друг»?',
      options: [
        'Оператор-функция, объявленная friend прямо в классе: видит закрытые поля и находится компилятором только для этого типа',
        'Закрытый метод класса',
        'Функция, которую нельзя вызвать',
        'Друг, объявленный в другом файле',
      ],
      correct: 0,
      explain: 'Рекомендуемый способ определять симметричные операторы.',
    },
    {
      q: 'Какие операторы не стоит перегружать? Выберите все.',
      options: ['&&', '||', ',', '=='],
      correct: [0, 1, 2],
      explain: 'Перегруженные &&, || и , теряют сокращённое вычисление и порядок операндов.',
    },
  ],
  exercises: [
    {
      id: 'oop-operators-exercise',
      title: 'Векторы на плоскости',
      difficulty: 'beginner',
      description: `
Опишите структуру \`Vec2\` с целыми полями \`x\`, \`y\` и операторами: \`+\`, \`-\`, умножение на целое число справа (\`v * k\`) и \`==\` (по умолчанию). Каждая строка ввода — выражение:

- \`x1 y1 + x2 y2\`, \`x1 y1 - x2 y2\` — напечатайте результат \`(x, y)\`;
- \`x y * k\` — напечатайте \`(x·k, y·k)\`;
- \`x1 y1 == x2 y2\` — напечатайте \`да\` или \`нет\`.`,
      constraints: ['Числа по модулю до 10⁶; строк не больше 30.'],
      hints: [
        'Vec2 operator+(Vec2 a, Vec2 b) { return {a.x + b.x, a.y + b.y}; } — аналогично - и *. Равенство: bool operator==(const Vec2 &) const = default;.',
        'Считайте два числа и операцию; для * — одно число, иначе — ещё два. Координаты храните в long long: 10⁶ · 10⁶ не помещается в int.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

struct Vec2 {
    long long x = 0;
    long long y = 0;

    bool operator==(const Vec2 &) const = default;
};

Vec2 operator+(Vec2 a, Vec2 b) {
    return {a.x + b.x, a.y + b.y};
}

Vec2 operator-(Vec2 a, Vec2 b) {
    return {a.x - b.x, a.y - b.y};
}

Vec2 operator*(Vec2 a, long long k) {
    return {a.x * k, a.y * k};
}

int main() {
    Vec2 a;
    std::string op;
    while (std::cin >> a.x >> a.y >> op) {
        if (op == "*") {
            long long k;
            std::cin >> k;
            Vec2 r = a * k;
            std::println("({}, {})", r.x, r.y);
            continue;
        }
        Vec2 b;
        std::cin >> b.x >> b.y;
        if (op == "==") {
            std::println("{}", a == b ? "да" : "нет");
        } else {
            Vec2 r = op == "+" ? a + b : a - b;
            std::println("({}, {})", r.x, r.y);
        }
    }
    return 0;
}`,
      explanation: `
Операторы сделаны свободными функциями: структура открыта, и доступа к закрытым полям им не нужно. Равенство объявлено по умолчанию — два вектора равны, когда равны их координаты, и именно это даёт \`= default\`.

Умножение определено только как \`v * k\`; если бы понадобилось \`k * v\`, хватило бы ещё одной функции \`operator*(long long, Vec2)\` — свободные операторы позволяют любой порядок операндов.`,
      examples: [
        { in: '1 2 + 3 4\n5 5 * -2\n', out: '(4, 6)\n(-10, -10)\n' },
        { in: '1 2 == 1 2\n1 2 - 3 4\n', out: 'да\n(-2, -2)\n' },
      ],
      hidden: [
        { in: '0 0 + 0 0\n', name: 'Нули' },
        { in: '1000000 1000000 * 1000000\n', name: 'Большое умножение' },
        { in: '1 2 == 2 1\n', name: 'Переставлены' },
        { in: '-5 7 - -5 7\n', name: 'Вычитание себя' },
        { in: '3 4 * 0\n', name: 'Умножение на ноль' },
        { in: '1 1 + 1 1\n2 2 == 2 2\n', name: 'Две строки' },
        { in: '-1000000 0 + 0 -1000000\n', name: 'Отрицательные' },
        { in: '7 -3 * 1\n7 -3 == 7 3\n', name: 'Единица и знак' },
      ],
    },
    {
      title: 'Время дня',
      description: `
Первая строка — текущее время \`ЧЧ:ММ\`. Следующие строки — события: время \`ЧЧ:ММ\` и название. Опишите структуру \`Time\` с полями \`hours\`, \`minutes\` и сравнением \`auto operator<=>(const Time &) const = default;\`. Напечатайте события по возрастанию времени (при равном времени — в порядке ввода) в виде \`ЧЧ:ММ название\`, а затем \`впереди: N\` — сколько событий позже текущего времени (строго).`,
      constraints: ['Событий не больше 50; время корректно.'],
      hints: [
        'Событие — структура { Time time; std::string name; }. Сортировка с сохранением порядка равных: std::ranges::stable_sort(events, {}, &Event::time).',
        'Подсчёт: std::ranges::count_if(events, [&](const Event &e) { return e.time > now; }) — оператор > выведен из <=>.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <vector>

struct Time {
    int hours = 0;
    int minutes = 0;

    auto operator<=>(const Time &) const = default;
};

struct Event {
    Time time;
    std::string name;
};

Time read_time() {
    Time t;
    char colon;
    std::cin >> t.hours >> colon >> t.minutes;
    return t;
}

int main() {
    Time now = read_time();
    std::vector<Event> events;
    while (true) {
        Time t = read_time();
        std::string name;
        if (!(std::cin >> name)) {
            break;
        }
        events.push_back({t, name});
    }
    std::ranges::stable_sort(events, {}, &Event::time);
    for (const Event &e : events) {
        std::println("{:02}:{:02} {}", e.time.hours, e.time.minutes, e.name);
    }
    auto ahead = std::ranges::count_if(events, [&now](const Event &e) { return e.time > now; });
    std::println("впереди: {}", ahead);
    return 0;
}`,
      explanation: `
Одна строка \`= default\` дала \`Time\` все сравнения: сортировка использует \`<\`, подсчёт — \`>\`. Поля сравниваются по порядку объявления — сначала часы, потом минуты, — и это ровно сравнение времени суток. Если бы поля были объявлены в обратном порядке, \`10:05\` оказалось бы «меньше» \`09:30\`.

Проекция \`&Event::time\` сортирует события по времени, а \`stable_sort\` сохраняет порядок ввода для одновременных событий.`,
      examples: [
        {
          in: '12:00\n13:30 обед\n09:15 планёрка\n12:00 звонок\n',
          out: '09:15 планёрка\n12:00 звонок\n13:30 обед\nвпереди: 1\n',
        },
        { in: '00:00\n', out: 'впереди: 0\n' },
      ],
      hidden: [
        { in: '23:59\n23:59 a\n00:00 b\n', name: 'Ничего впереди' },
        { in: '00:00\n00:01 a\n23:59 b\n', name: 'Всё впереди' },
        { in: '10:00\n10:00 x\n10:00 y\n10:00 z\n', name: 'Одновременные' },
        { in: '09:30\n10:05 a\n09:45 b\n09:05 c\n', name: 'Часы важнее минут' },
        { in: '12:00\n11:59 a\n12:01 b\n', name: 'Рядом с текущим' },
        { in: '06:00\n18:00 ужин\n07:00 завтрак\n13:00 обед\n07:00 кофе\n', name: 'День' },
        { in: '15:15\n15:15 сейчас\n', name: 'Ровно сейчас' },
        { in: '00:30\n01:00 a\n00:15 b\n02:45 c\n00:45 d\n', name: 'Ночь' },
      ],
    },
    {
      title: 'Найди ошибку: равные дроби',
      bug: true,
      description: `
Каждая строка ввода — дробь: числитель и **положительный** знаменатель. Программа складывает дроби в \`std::set\` и печатает число **различных по величине** дробей, а затем самую маленькую и самую большую (в той записи, в какой они встретились первыми):

\`\`\`text
различных: 2
1/3
1/2
\`\`\`

Дроби \`1/2\` и \`2/4\` программа считает разными. Найдите и исправьте ошибку в сравнении.`,
      constraints: ['Дробей не больше 50; числитель по модулю до 10⁹, знаменатель от 1 до 10⁹.'],
      hints: [
        'Что сравнивает operator<=> = default? Равны ли поля у 1/2 и 2/4?',
        'Сравнивайте дроби по величине: a/b <=> c/d — то же, что a·d <=> c·b при положительных знаменателях. Перемножайте в long long и объявите == так же.',
      ],
      starter: FRACTIONS(false),
      solution: FRACTIONS(true),
      explanation: `
\`= default\` сравнивает поля: сначала числители, потом знаменатели. Для дробей это неверно: \`1/2\` и \`2/4\` — одно число, но разные поля, и \`std::set\` хранит обе. Порядок тоже ломается: по полям \`1/3\` «меньше» \`2/4\`, но и \`1/100\` «меньше» \`2/4\` раньше, чем учитываются знаменатели.

Сравнение по величине — перекрёстное умножение \`a·d <=> c·b\`. При знаменателях до 10⁹ произведения достигают 10¹⁸, поэтому множители приводятся к \`long long\`. Равенство и порядок должны быть согласованы: если \`<=>\` говорит «равно», то и \`==\` обязан сказать «равно» — иначе контейнеры ведут себя непредсказуемо.`,
      examples: [
        { in: '1 2\n2 4\n1 3\n', out: 'различных: 2\n1/3\n1/2\n' },
        { in: '', out: 'различных: 0\n' },
      ],
      hidden: [
        '3 6\n1 2\n',
        '1 100\n2 4\n',
        '-1 2\n-2 4\n',
        '0 5\n0 1\n',
        '1000000000 1000000000\n1 1\n2 2\n',
        '2 3\n4 6\n6 9\n1 3\n',
        '-3 4\n3 4\n-6 8\n',
        '999999999 1000000000\n1 1\n',
      ],
    },
    {
      title: 'Матрицы',
      difficulty: 'advanced',
      description: `
Ввод: размеры и элементы двух целочисленных матриц — сначала \`r₁ c₁\` и \`r₁\` строк, затем \`r₂ c₂\` и \`r₂\` строк. Опишите класс \`Matrix\` с конструктором \`Matrix(int rows, int cols)\`, методами \`rows()\`, \`cols()\`, оператором доступа C++23 \`m[i, j]\` (версии для изменения и для чтения) и свободным оператором \`*\` — произведением матриц.

Если \`c₁ ≠ r₂\`, напечатайте \`размеры не совпадают\`. Иначе напечатайте произведение по строкам, элементы через пробел.`,
      constraints: ['Размеры от 1 до 20; элементы по модулю до 1000.'],
      hints: [
        'long long &operator[](int i, int j) и long long operator[](int i, int j) const — элементы в одном векторе, индекс i * cols_ + j.',
        'Произведение: C[i, j] = Σₖ A[i, k] · B[k, j]. Оператор * — свободная функция, принимающая const Matrix &.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Matrix {
public:
    Matrix(int rows, int cols) : rows_(rows), cols_(cols), cells_(static_cast<std::size_t>(rows * cols)) {}

    int rows() const {
        return rows_;
    }

    int cols() const {
        return cols_;
    }

    long long &operator[](int i, int j) {
        return cells_[static_cast<std::size_t>(i * cols_ + j)];
    }

    long long operator[](int i, int j) const {
        return cells_[static_cast<std::size_t>(i * cols_ + j)];
    }

private:
    int rows_;
    int cols_;
    std::vector<long long> cells_;
};

Matrix operator*(const Matrix &a, const Matrix &b) {
    Matrix c(a.rows(), b.cols());
    for (int i = 0; i < a.rows(); i++) {
        for (int j = 0; j < b.cols(); j++) {
            for (int k = 0; k < a.cols(); k++) {
                c[i, j] += a[i, k] * b[k, j];
            }
        }
    }
    return c;
}

Matrix read_matrix() {
    int r, c;
    std::cin >> r >> c;
    Matrix m(r, c);
    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            std::cin >> m[i, j];
        }
    }
    return m;
}

int main() {
    Matrix a = read_matrix();
    Matrix b = read_matrix();
    if (a.cols() != b.rows()) {
        std::println("размеры не совпадают");
        return 0;
    }
    Matrix c = a * b;
    for (int i = 0; i < c.rows(); i++) {
        std::string line;
        for (int j = 0; j < c.cols(); j++) {
            line += (j ? " " : "") + std::to_string(c[i, j]);
        }
        std::println("{}", line);
    }
    return 0;
}`,
      explanation: `
Две версии \`operator[]\` — для записи (\`std::cin >> m[i, j]\`, накопление суммы) и для чтения через \`const Matrix &\` в операторе умножения. Многомерная индексация C++23 делает формулу произведения в коде похожей на математическую запись: \`c[i, j] += a[i, k] * b[k, j]\`.

Произведение — свободная функция: оно не меняет операнды и создаёт новую матрицу. Матрица \`c\` создаётся нулевой (вектор обнуляет элементы), поэтому сумму можно накапливать сразу. Проверка размеров выполняется до умножения — для несовместимых матриц произведение не определено.`,
      examples: [
        { in: '2 2\n1 2\n3 4\n2 2\n5 6\n7 8\n', out: '19 22\n43 50\n' },
        { in: '1 2\n1 2\n1 2\n1 2\n', out: 'размеры не совпадают\n' },
      ],
      hidden: [
        { in: '1 1\n7\n1 1\n-3\n', name: 'Числа' },
        { in: '1 3\n1 2 3\n3 1\n4\n5\n6\n', name: 'Строка на столбец' },
        { in: '3 1\n1\n2\n3\n1 3\n4 5 6\n', name: 'Столбец на строку' },
        { in: '2 2\n1 0\n0 1\n2 2\n9 8\n7 6\n', name: 'Единичная' },
        { in: '2 3\n1 2 3\n4 5 6\n3 2\n7 8\n9 10\n11 12\n', name: 'Прямоугольные' },
        { in: '2 2\n1000 1000\n1000 1000\n2 2\n1000 1000\n1000 1000\n', name: 'Большие элементы' },
        { in: '2 3\n1 2 3\n4 5 6\n2 3\n1 2 3\n4 5 6\n', name: 'Несовместимые' },
        { in: '2 2\n0 1\n1 0\n2 2\n-1 2\n3 -4\n', name: 'Перестановка' },
      ],
    },
  ],
};
