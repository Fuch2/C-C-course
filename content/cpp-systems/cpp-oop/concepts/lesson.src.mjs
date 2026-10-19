const DEVICES = (fixed) => String.raw`
#include <concepts>
#include <format>
#include <iostream>
#include <print>
#include <string>

struct Device {
    std::string name;
    bool enabled;
    double temperature;
    int count;
};

template <typename T>
std::string show(const T &value) {
${
  fixed
    ? `    if constexpr (std::same_as<T, bool>) {
        return value ? "да" : "нет";
    } else if constexpr (std::integral<T>) {
        return std::to_string(value);
    }`
    : `    if constexpr (std::integral<T>) {
        return std::to_string(value);
    } else if constexpr (std::same_as<T, bool>) {
        return value ? "да" : "нет";
    }`
} else if constexpr (std::floating_point<T>) {
        return std::format("{:.1f}", value);
    } else {
        return value;
    }
}

int main() {
    Device d;
    int total = 0, active = 0;
    while (std::cin >> d.name >> d.enabled >> d.temperature >> d.count) {
        std::println("{}: включён {}, температура {}, измерений {}", show(d.name), show(d.enabled),
                     show(d.temperature), show(d.count));
        total++;
        if (d.enabled) {
            active++;
        }
    }
    std::println("активных {} из {}", active, total);
    return 0;
}`;

export default {
  id: 'oop-concepts',
  title: 'Шаблоны и концепты',
  description:
    'Статический полиморфизм: шаблон работает с любым типом, у которого есть нужные операции, без общей базы. Концепты C++20 и выражение requires, три способа записать ограничение, стандартные концепты из <concepts>, перегрузка по концептам, if constexpr. Сравнение статического и динамического полиморфизма и стирание типа на примере std::function.',
  moduleId: 'cpp-oop',
  order: 26,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['oop-variant'],
  objectives: [
    'Писать шаблоны функций, ограниченные концептами',
    'Определять собственные концепты выражением requires',
    'Выбирать между статическим и динамическим полиморфизмом',
    'Понимать устройство стирания типа',
  ],
  tags: ['C++23', 'ООП', 'Шаблоны', 'Концепты', 'Стирание типа'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Когда выбирается реализация при статическом полиморфизме на шаблонах?',
      options: [
        'При компиляции',
        'Во время работы через таблицу виртуальных функций',
        'При компоновке',
        'При первом вызове',
      ],
      correct: 0,
      explain: 'Компилятор создаёт версию шаблона для каждого типа и вызывает её напрямую.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <concepts>
#include <print>

void kind(std::integral auto) {
    std::println("целое");
}

void kind(std::floating_point auto) {
    std::println("дробное");
}

int main() {
    kind('x');
    return 0;
}`,
      lang: 'cpp',
      answers: ['целое'],
      placeholder: 'Вывод программы',
      explain: 'char — целый тип, std::integral<char> истинно.',
    },
    {
      q: 'Что даёт концепт по сравнению с неограниченным шаблоном? Выберите все.',
      options: [
        'Ошибка неподходящего типа сообщается в месте вызова',
        'Требования к типу видны в сигнатуре',
        'Можно перегружать функции по требованиям',
        'Функция начинает работать во время выполнения через таблицу',
      ],
      correct: [0, 1, 2],
      explain: 'Концепты проверяются только при компиляции и никак не влияют на скорость.',
    },
    {
      q: 'Какие записи ограничивают шаблон концептом Printable? Выберите все.',
      options: [
        'template <Printable T> void f(const T &x)',
        'template <typename T> requires Printable<T> void f(const T &x)',
        'void f(const Printable auto &x)',
        'void f(Printable x)',
      ],
      correct: [0, 1, 2],
      explain:
        'Концепт — не тип, поэтому void f(Printable x) не компилируется; после концепта нужно auto.',
    },
    {
      q: 'Почему нельзя объявить std::vector<Printable> для разных печатаемых типов?',
      options: [
        'Концепт — требование к типу, а не тип',
        'Вектор не может хранить классы',
        'Нужно написать std::vector<Printable auto>',
        'Можно, если все типы маленькие',
      ],
      correct: 0,
      explain: 'Для разнотипной коллекции нужен variant, общий интерфейс или стирание типа.',
    },
    {
      q: 'Что верно про if constexpr внутри шаблона?',
      options: [
        'Условие вычисляется при компиляции, отброшенная ветка не компилируется для этого типа',
        'Обе ветки всегда компилируются',
        'Условие вычисляется во время работы',
        'В ветках нельзя вызывать функции',
      ],
      correct: 0,
      explain: 'Поэтому в отброшенной ветке можно вызывать метод, которого у типа нет.',
    },
    {
      q: 'Чем статический полиморфизм уступает динамическому?',
      options: [
        'Нельзя напрямую собрать в один контейнер объекты разных типов, выбранных во время работы',
        'Он медленнее',
        'Он не проверяется компилятором',
        'Он требует общей базы',
      ],
      correct: 0,
      explain:
        'Тип должен быть известен при компиляции. Зато вызов прямой и может быть подставлен.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <functional>
#include <print>
#include <vector>

int main() {
    std::vector<std::function<int(int)>> fs{[](int x) { return x + 1; }, [](int x) { return x * 10; }};
    int v = 1;
    for (const auto &f : fs) {
        v = f(v);
    }
    std::println("{}", v);
    return 0;
}`,
      lang: 'cpp',
      answers: ['20'],
      placeholder: 'Вывод программы',
      explain:
        '1 + 1 = 2, затем 2 · 10 = 20. std::function хранит разные лямбды за одним типом — это стирание типа.',
    },
    {
      q: 'Каким ключевым словом начинается определение концепта: ___ Printable = requires(const T &x) { x.text(); };',
      answers: ['concept', 'template <typename T> concept'],
      placeholder: 'Ключевое слово',
      explain: 'template <typename T> concept Имя = требования;',
    },
  ],
  exercises: [
    {
      id: 'oop-concepts-exercise',
      title: 'Фигуры по концепту',
      difficulty: 'intermediate',
      description: `
Определите концепт \`Shape\`: у константного объекта есть \`area()\`, результат которого приводится к \`double\`, и \`name()\`, результат которого приводится к \`std::string\`. Три структуры **без общей базы**:

- \`Rect { double w, h; }\` — «прямоугольник», площадь \`w · h\`;
- \`Circle { double r; }\` — «круг», площадь \`π · r²\` (\`std::numbers::pi\` из \`<numbers>\`);
- \`Square { double a; }\` — «квадрат», площадь \`a²\`.

Функция \`template <Shape S> double report(const S &s)\` печатает \`имя: площадь\` с двумя знаками после точки и возвращает площадь. Ввод — строки \`rect w h\`, \`circle r\`, \`square a\`. Для каждой фигуры вызовите \`report\`. В конце напечатайте \`всего N, наибольшая площадь X\` (два знака) или \`фигур нет\`.`,
      constraints: ['Фигур не больше 50; размеры от 0 до 1000.'],
      hints: [
        'template <typename T> concept Shape = requires(const T &s) { { s.area() } -> std::convertible_to<double>; { s.name() } -> std::convertible_to<std::string>; };',
        'Хранить фигуры не нужно: создайте объект прямо в ветке if и сразу передайте в report. Проверьте себя: static_assert(Shape<Rect>);',
      ],
      solution: String.raw`
#include <algorithm>
#include <concepts>
#include <iostream>
#include <numbers>
#include <print>
#include <string>

template <typename T>
concept Shape = requires(const T &s) {
    { s.area() } -> std::convertible_to<double>;
    { s.name() } -> std::convertible_to<std::string>;
};

struct Rect {
    double w, h;
    double area() const {
        return w * h;
    }
    std::string name() const {
        return "прямоугольник";
    }
};

struct Circle {
    double r;
    double area() const {
        return std::numbers::pi * r * r;
    }
    std::string name() const {
        return "круг";
    }
};

struct Square {
    double a;
    double area() const {
        return a * a;
    }
    std::string name() const {
        return "квадрат";
    }
};

static_assert(Shape<Rect> && Shape<Circle> && Shape<Square>);
static_assert(!Shape<int>);

template <Shape S>
double report(const S &s) {
    const double a = s.area();
    std::println("{}: {:.2f}", s.name(), a);
    return a;
}

int main() {
    std::string kind;
    int count = 0;
    double best = 0;
    while (std::cin >> kind) {
        double a = 0;
        if (kind == "rect") {
            double w, h;
            std::cin >> w >> h;
            a = report(Rect{w, h});
        } else if (kind == "circle") {
            double r;
            std::cin >> r;
            a = report(Circle{r});
        } else {
            double side;
            std::cin >> side;
            a = report(Square{side});
        }
        best = count == 0 ? a : std::max(best, a);
        count++;
    }
    if (count == 0) {
        std::println("фигур нет");
    } else {
        std::println("всего {}, наибольшая площадь {:.2f}", count, best);
    }
    return 0;
}`,
      explanation: `
Фигуры не связаны наследованием, но все удовлетворяют \`Shape\`, и \`report\` работает с каждой. Компилятор создаёт три версии \`report\` — для \`Rect\`, \`Circle\` и \`Square\` — и вызывает их напрямую.

\`static_assert(Shape<Rect>)\` проверяет соответствие концепту сразу при объявлении типа, а не в месте первого использования: если опечататься в имени метода, ошибка появится рядом со структурой.`,
      examples: [
        {
          in: 'rect 2 3\ncircle 1\nsquare 2\n',
          out: 'прямоугольник: 6.00\nкруг: 3.14\nквадрат: 4.00\nвсего 3, наибольшая площадь 6.00\n',
        },
        { in: '', out: 'фигур нет\n' },
      ],
      hidden: [
        { in: 'circle 10\n', name: 'Большой круг' },
        { in: 'square 0\n', name: 'Нулевая площадь' },
        { in: 'rect 1.5 4\nsquare 2.5\n', name: 'Дробные размеры' },
        { in: 'circle 2\nrect 3 4\n', name: 'Круг больше прямоугольника' },
        { in: 'square 1000\n', name: 'Предельный размер' },
        { in: 'rect 0 7\nrect 7 0\n', name: 'Вырожденные прямоугольники' },
        { in: 'circle 0.5\nsquare 1\nrect 1 2\n', name: 'Маленькие фигуры' },
        { in: 'square 3\nsquare 3\n', name: 'Одинаковые фигуры' },
      ],
    },
    {
      title: 'Одна функция для чисел и слов',
      description: `
Определите концепт \`Addable\`: для двух константных значений типа \`T\` выражение \`a + b\` приводится к \`T\`. Напишите шаблоны:

- \`template <std::totally_ordered T> std::pair<T, T> min_max(const std::vector<T> &items)\` — наименьший и наибольший элемент непустого вектора;
- \`template <Addable T> T total(const std::vector<T> &items, T start)\` — \`start + items[0] + items[1] + …\` по порядку.

Ввод: число \`n\` и \`n\` целых, затем число \`m\` и \`m\` слов. Напечатайте \`числа: min A, max B, сумма S\` и \`слова: min A, max B, сумма S\` (сумма слов — их склейка в порядке ввода, начальное значение — пустая строка). Для пустого набора печатайте \`числа: пусто\` или \`слова: пусто\`. Используйте одни и те же шаблоны для обоих наборов.`,
      constraints: [
        '0 ≤ n, m ≤ 100; числа по модулю до 10⁹; слова — без пробелов, сравниваются как std::string.',
      ],
      hints: [
        'template <typename T> concept Addable = requires(const T &a, const T &b) { { a + b } -> std::convertible_to<T>; };',
        'Общая функция печати: template <typename T> requires std::totally_ordered<T> && Addable<T> void report(const std::string &title, const std::vector<T> &items, T start).',
      ],
      solution: String.raw`
#include <concepts>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

template <typename T>
concept Addable = requires(const T &a, const T &b) {
    { a + b } -> std::convertible_to<T>;
};

template <std::totally_ordered T>
std::pair<T, T> min_max(const std::vector<T> &items) {
    T low = items.front();
    T high = items.front();
    for (const T &item : items) {
        if (item < low) {
            low = item;
        }
        if (high < item) {
            high = item;
        }
    }
    return {low, high};
}

template <Addable T>
T total(const std::vector<T> &items, T start) {
    for (const T &item : items) {
        start = start + item;
    }
    return start;
}

template <typename T>
    requires std::totally_ordered<T> && Addable<T>
void report(const std::string &title, const std::vector<T> &items, T start) {
    if (items.empty()) {
        std::println("{}: пусто", title);
        return;
    }
    const auto [low, high] = min_max(items);
    std::println("{}: min {}, max {}, сумма {}", title, low, high, total(items, std::move(start)));
}

template <typename T>
std::vector<T> read_items() {
    std::size_t count = 0;
    std::cin >> count;
    std::vector<T> items(count);
    for (T &item : items) {
        std::cin >> item;
    }
    return items;
}

int main() {
    const auto numbers = read_items<long long>();
    const auto words = read_items<std::string>();
    report("числа", numbers, 0LL);
    report("слова", words, std::string());
    return 0;
}`,
      explanation: `
\`min_max\` требует только сравнения, \`total\` — только сложения, и каждый шаблон говорит об этом в сигнатуре. Целые числа и строки удовлетворяют обоим концептам, хотя «сложение» для них означает разное: сумму и склейку.

Даже чтение написано одним шаблоном \`read_items<T>\`: оператор \`>>\` есть и для чисел, и для строк. Попробуйте вызвать \`report\` для \`std::vector<std::pair<int, int>>\` — сравнение у пар есть, а сложения нет, и компилятор укажет на невыполненное требование \`Addable\`.`,
      examples: [
        {
          in: '3\n5 1 9\n2\npear apple\n',
          out: 'числа: min 1, max 9, сумма 15\nслова: min apple, max pear, сумма pearapple\n',
        },
        { in: '0\n0\n', out: 'числа: пусто\nслова: пусто\n' },
      ],
      hidden: [
        { in: '1\n-7\n1\nодин\n', name: 'По одному элементу' },
        { in: '3\n1000000000 1000000000 1000000000\n0\n', name: 'Большая сумма' },
        { in: '0\n3\nb a c\n', name: 'Только слова' },
        { in: '4\n3 -2 3 -2\n2\nZ a\n', name: 'Повторы и регистр' },
        { in: '2\n0 0\n2\nab abc\n', name: 'Префикс' },
        { in: '5\n-1 -2 -3 -4 -5\n3\nкот кит код\n', name: 'Отрицательные и кириллица' },
        { in: '1\n42\n0\n', name: 'Только число' },
        { in: '6\n9 8 7 1 2 3\n4\nd c b a\n', name: 'Обратный порядок' },
      ],
    },
    {
      title: 'Найди ошибку: bool тоже целый',
      bug: true,
      description: `
Программа печатает отчёт об устройствах. Каждая строка ввода — \`имя включён температура измерений\` (включён — 0 или 1). Шаблон \`show\` превращает любое поле в текст: логическое — в \`да\`/\`нет\`, целое — в число, дробное — с одним знаком после точки, строку — как есть. Для каждого устройства печатается \`имя: включён да, температура 21.5, измерений 3\`, в конце — \`активных K из N\`.

Вместо «да» и «нет» отчёт печатает 1 и 0. Исправьте шаблон \`show\`.`,
      constraints: [
        'Устройств не больше 30; температура задана не более чем с одним знаком после точки.',
      ],
      hints: [
        'Какие типы удовлетворяют std::integral?',
        'Ветки if constexpr проверяются по порядку: частный случай bool должен стоять раньше общего std::integral.',
      ],
      starter: DEVICES(false),
      solution: DEVICES(true),
      explanation: `
\`bool\` — целый тип, и \`std::integral<bool>\` истинно. Первая ветка \`if constexpr\` перехватывает логические значения и печатает их через \`std::to_string\` как 1 и 0, а ветка для \`bool\` недостижима — компилятор о ней даже не предупреждает.

Частные случаи проверяют раньше общих. То же относится к \`char\`: если символы нужно печатать как символы, их проверяют отдельно до \`std::integral\`.`,
      examples: [
        {
          in: 'датчик-1 1 21.5 3\nдатчик-2 0 -4 0\n',
          out: 'датчик-1: включён да, температура 21.5, измерений 3\nдатчик-2: включён нет, температура -4.0, измерений 0\nактивных 1 из 2\n',
        },
        {
          in: 'a 1 0 10\n',
          out: 'a: включён да, температура 0.0, измерений 10\nактивных 1 из 1\n',
        },
      ],
      hidden: [
        'x 0 1.5 2\n',
        'p 1 100 1000\nq 1 -40.5 7\n',
        'z 0 0 0\n',
        'one 1 36.6 1\ntwo 0 36.6 1\nthree 1 36.6 1\n',
        'cold 0 -273.1 5\n',
        'hot 1 999.9 999\n',
        'a 0 1 1\nb 0 2 2\n',
        'solo 1 22 4\n',
      ],
    },
    {
      title: 'Стирание типа',
      difficulty: 'advanced',
      description: `
Напишите класс \`AnyPrintable\`, в котором можно хранить объект **любого** типа с методом \`std::string text() const\`, — без общей базы у самих типов.

- Концепт \`Printable\` — у константного объекта есть \`text()\`, приводимый к \`std::string\`.
- Внутри \`AnyPrintable\`: закрытый интерфейс \`Holder\` с виртуальными \`text()\` и деструктором; шаблон \`Model<T> final : Holder\`, хранящий значение \`T\`; поле \`std::unique_ptr<Holder>\`.
- Шаблонный конструктор принимает любой \`Printable\` тип по значению (кроме самого \`AnyPrintable\`), метод \`text()\` перенаправляет вызов.

Типы: \`Number { long long value; }\` → \`число N\`, \`Word { std::string value; }\` → \`слово S\`, \`Point { int x, y; }\` → \`точка (x, y)\`. Ввод — строки \`num N\`, \`word S\`, \`point x y\`. Сохраните всё в \`std::vector<AnyPrintable>\`, затем напечатайте элементы с номерами \`1. …\` и в конце \`всего N\`.`,
      constraints: ['Строк не больше 100; числа по модулю до 10¹².'],
      hints: [
        'template <Printable T> requires(!std::same_as<T, AnyPrintable>) AnyPrintable(T value) : self_(std::make_unique<Model<T>>(std::move(value))) {}',
        'Без исключения самого AnyPrintable шаблонный конструктор тоже подходит для копирования обёртки (у неё ведь есть text()) — и перемещение по вектору может пойти не тем путём.',
      ],
      solution: String.raw`
#include <concepts>
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

template <typename T>
concept Printable = requires(const T &x) {
    { x.text() } -> std::convertible_to<std::string>;
};

class AnyPrintable {
public:
    template <Printable T>
        requires(!std::same_as<T, AnyPrintable>)
    AnyPrintable(T value) : self_(std::make_unique<Model<T>>(std::move(value))) {}

    std::string text() const {
        return self_->text();
    }

private:
    struct Holder {
        virtual ~Holder() = default;
        virtual std::string text() const = 0;
    };

    template <Printable T>
    struct Model final : Holder {
        explicit Model(T v) : value(std::move(v)) {}
        std::string text() const override {
            return value.text();
        }
        T value;
    };

    std::unique_ptr<Holder> self_;
};

struct Number {
    long long value;
    std::string text() const {
        return "число " + std::to_string(value);
    }
};

struct Word {
    std::string value;
    std::string text() const {
        return "слово " + value;
    }
};

struct Point {
    int x, y;
    std::string text() const {
        return "точка (" + std::to_string(x) + ", " + std::to_string(y) + ")";
    }
};

static_assert(Printable<AnyPrintable>);

int main() {
    std::vector<AnyPrintable> items;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "num") {
            long long n;
            std::cin >> n;
            items.push_back(Number{n});
        } else if (kind == "word") {
            std::string w;
            std::cin >> w;
            items.push_back(Word{w});
        } else {
            int x, y;
            std::cin >> x >> y;
            items.push_back(Point{x, y});
        }
    }
    for (std::size_t i = 0; i < items.size(); ++i) {
        std::println("{}. {}", i + 1, items[i].text());
    }
    std::println("всего {}", items.size());
    return 0;
}`,
      explanation: `
Снаружи \`AnyPrintable\` — обычное значение, которое лежит в векторе. Внутри — знакомая иерархия: интерфейс \`Holder\` и наследник \`Model<T>\`, только наследников пишет компилятор, создавая \`Model<Number>\`, \`Model<Word>\` и \`Model<Point>\` по шаблону. Концепт проверяет тип на входе, виртуальная функция выбирает реализацию во время работы.

Так устроены \`std::function\`, \`std::any\` и \`std::move_only_function\`. Самим типам \`Number\`, \`Word\` и \`Point\` не нужно знать об интерфейсе: подойдёт и тип из чужой библиотеки, если у него есть \`text()\`.

Обёртка только перемещается: копирование \`unique_ptr\` запрещено. Чтобы копировать, в \`Holder\` добавляют виртуальную \`clone()\` — как в уроке о срезке.`,
      examples: [
        {
          in: 'num 5\nword кот\npoint 1 -2\n',
          out: '1. число 5\n2. слово кот\n3. точка (1, -2)\nвсего 3\n',
        },
        { in: '', out: 'всего 0\n' },
      ],
      hidden: [
        { in: 'num -1000000000000\n', name: 'Большое отрицательное' },
        { in: 'word a\nword b\nword c\n', name: 'Только слова' },
        { in: 'point 0 0\n', name: 'Начало координат' },
        {
          in: 'num 1\nnum 2\nnum 3\nnum 4\nnum 5\nnum 6\nnum 7\nnum 8\nnum 9\nnum 10\nnum 11\n',
          name: 'Номера больше 9',
        },
        { in: 'point -5 5\nword тест\nnum 0\n', name: 'Обратный порядок типов' },
        { in: 'word привет\npoint 100 200\n', name: 'Слово и точка' },
        { in: 'num 42\n', name: 'Одно число' },
        { in: 'point 1 1\npoint 2 2\nword x\npoint 3 3\n', name: 'Несколько точек' },
      ],
    },
  ],
};
