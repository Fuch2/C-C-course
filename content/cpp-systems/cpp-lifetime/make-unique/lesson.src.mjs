const WINDOW = (fixed) => String.raw`
#include <iostream>
#include <memory>
#include <print>

int main() {
    int n, k;
    std::cin >> n >> k;
    ${fixed ? 'auto buffer = std::make_unique<int[]>(n);' : 'auto buffer = std::make_unique<int>(n);'}
    int *data = buffer.get();
    for (int i = 0; i < n; ++i) {
        std::cin >> data[i];
    }
    long long sum = 0;
    for (int i = 0; i < n; ++i) {
        sum += data[i];
        if (i >= k) {
            sum -= data[i - k];
        }
        if (i >= k - 1) {
            std::print("{}{}", i >= k ? " " : "", sum);
        }
    }
    std::println();
    return 0;
}`;

export default {
  id: 'lifetime-make-unique',
  title: 'std::make_unique: создание владельца',
  description:
    'std::make_unique как способ создать объект и его владельца без голого new: агрегаты и круглые скобки C++20, массивы make_unique<T[]> и make_unique_for_overwrite, фабрики, возвращающие unique_ptr<Base>, превращение unique_ptr в shared_ptr, закрытые конструкторы и идиома ключа доступа.',
  moduleId: 'cpp-lifetime',
  order: 19,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['lifetime-unique-ptr'],
  objectives: [
    'Создавать объекты и массивы через std::make_unique',
    'Отличать make_unique<T[]>(n), make_unique_for_overwrite и make_unique<T>(n)',
    'Писать фабрики, возвращающие unique_ptr базового класса',
    'Ограничивать создание объектов ключом доступа',
  ],
  tags: ['C++23', 'Время жизни', 'make_unique', 'Умные указатели', 'Фабрика'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что создаёт std::make_unique<int>(10)?',
      options: [
        'Один int со значением 10',
        'Массив из 10 int',
        'Массив из 10 нулей',
        'Пустой указатель',
      ],
      correct: 0,
      explain: 'Массив — std::make_unique<int[]>(10).',
    },
    {
      q: 'Чем заполнен массив из std::make_unique<int[]>(5)?',
      options: ['Нулями', 'Мусором', 'Единицами', 'Числами 0, 1, 2, 3, 4'],
      correct: 0,
      explain:
        'Элементы инициализируются значением; без инициализации — make_unique_for_overwrite.',
    },
    {
      q: 'Что содержит вектор из std::make_unique<std::vector<int>>(3, 7)?',
      options: [
        'Три семёрки',
        'Два элемента: 3 и 7',
        'Семь троек',
        'Ничего, это ошибка компиляции',
      ],
      correct: 0,
      explain: 'make_unique вызывает конструктор с круглыми скобками: vector(3, 7).',
    },
    {
      q: 'Почему фабрики обычно возвращают std::unique_ptr, а не std::shared_ptr?',
      options: [
        'unique_ptr дешевле и его можно превратить в shared_ptr, если вызывающему нужно совместное владение',
        'shared_ptr нельзя вернуть из функции',
        'unique_ptr можно копировать',
        'shared_ptr не поддерживает наследование',
      ],
      correct: 0,
      explain: 'Обратное превращение — shared_ptr в unique_ptr — невозможно.',
    },
    {
      q: 'Конструктор класса закрыт, хозяин объявлен другом. Почему std::make_unique внутри хозяина не компилируется?',
      options: [
        'Конструктор вызывает код стандартной библиотеки, а он не друг класса',
        'make_unique не работает с классами',
        'Друзья не могут создавать объекты в куче',
        'make_unique требует конструктор по умолчанию',
      ],
      correct: 0,
      explain:
        'Решение — открытый конструктор, требующий ключ доступа, который создаёт только хозяин.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>

struct Pair {
    int a;
    int b;
};

int main() {
    auto p = std::make_unique<Pair>(4, 5);
    auto arr = std::make_unique<int[]>(3);
    arr[1] = p->a * p->b;
    std::print("{} {} {}", arr[0], arr[1], arr[2]);
    return 0;
}`,
      lang: 'cpp',
      answers: ['0 20 0'],
      placeholder: 'Вывод программы',
      explain: 'Агрегат Pair инициализирован круглыми скобками (C++20), массив создан нулевым.',
    },
    {
      q: 'Когда уместен std::make_unique_for_overwrite<char[]>(n)?',
      options: [
        'Когда буфер сразу целиком перезапишут, например прочитают в него данные',
        'Когда нужен массив нулей',
        'Когда нужна своя функция удаления',
        'Когда объект будет общим',
      ],
      correct: 0,
      explain: 'Он пропускает инициализацию; читать элементы до записи нельзя.',
    },
    {
      q: 'Каким вызовом создать unique_ptr на массив из n элементов double, инициализированных нулями?',
      answers: [
        'std::make_unique<double[]>(n)',
        'make_unique<double[]>(n)',
        'std::make_unique<double[]>(n);',
      ],
      placeholder: 'Выражение',
      explain: 'Квадратные скобки в аргументе шаблона выбирают перегрузку для массивов.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-make-unique-exercise',
      title: 'Фабрика фигур',
      difficulty: 'beginner',
      description: `
Каждая строка ввода описывает фигуру: \`circle r\`, \`rect w h\` или \`square a\`. Напишите иерархию \`Shape\` (виртуальные \`name()\` и \`area()\`, виртуальный деструктор) с классами \`Circle\`, \`Rect\`, \`Square\` и фабрику

\`\`\`cpp
std::unique_ptr<Shape> make_shape(const std::string &line);
\`\`\`

которая возвращает \`nullptr\` для неизвестного вида фигуры. Фигуры храните в \`std::vector<std::unique_ptr<Shape>>\`. Для неизвестной строки сразу печатайте \`строка K: неизвестная фигура\` (K — номер строки с единицы).

После ввода напечатайте фигуры по порядку: \`N. имя площадь\` (имена: \`круг\`, \`прямоугольник\`, \`квадрат\`; площадь с двумя знаками после точки, π — \`std::numbers::pi\`) и последней строкой \`итого: S\` с суммой площадей в том же формате.`,
      constraints: ['Строк не больше 100; размеры — положительные числа не больше 1000.'],
      hints: [
        'Разберите строку через std::istringstream: сначала вид, потом размеры.',
        'В фабрике: if (kind == "circle") return std::make_unique<Circle>(r); и так далее; в конце return nullptr;',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <numbers>
#include <print>
#include <sstream>
#include <string>
#include <vector>

struct Shape {
    virtual ~Shape() = default;
    virtual std::string name() const = 0;
    virtual double area() const = 0;
};

struct Circle final : Shape {
    double r;
    explicit Circle(double r) : r(r) {}
    std::string name() const override {
        return "круг";
    }
    double area() const override {
        return std::numbers::pi * r * r;
    }
};

struct Rect final : Shape {
    double w;
    double h;
    Rect(double w, double h) : w(w), h(h) {}
    std::string name() const override {
        return "прямоугольник";
    }
    double area() const override {
        return w * h;
    }
};

struct Square final : Shape {
    double a;
    explicit Square(double a) : a(a) {}
    std::string name() const override {
        return "квадрат";
    }
    double area() const override {
        return a * a;
    }
};

std::unique_ptr<Shape> make_shape(const std::string &line) {
    std::istringstream in(line);
    std::string kind;
    in >> kind;
    if (kind == "circle") {
        double r;
        in >> r;
        return std::make_unique<Circle>(r);
    }
    if (kind == "rect") {
        double w, h;
        in >> w >> h;
        return std::make_unique<Rect>(w, h);
    }
    if (kind == "square") {
        double a;
        in >> a;
        return std::make_unique<Square>(a);
    }
    return nullptr;
}

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    std::string line;
    int number = 0;
    while (std::getline(std::cin, line)) {
        ++number;
        if (auto shape = make_shape(line)) {
            shapes.push_back(std::move(shape));
        } else {
            std::println("строка {}: неизвестная фигура", number);
        }
    }
    double total = 0;
    for (std::size_t i = 0; i < shapes.size(); ++i) {
        std::println("{}. {} {:.2f}", i + 1, shapes[i]->name(), shapes[i]->area());
        total += shapes[i]->area();
    }
    std::println("итого: {:.2f}", total);
    return 0;
}`,
      explanation: `
Фабрика прячет от вызывающего, какие классы существуют: она получает описание и возвращает владельца базового типа. \`unique_ptr<Circle>\` неявно превращается в \`unique_ptr<Shape>\`, а виртуальный деструктор гарантирует, что вектор удалит каждую фигуру целиком. Пустой указатель — ответ «такой фигуры нет», и \`if (auto shape = …)\` проверяет его прямо в условии.`,
      examples: [
        {
          in: 'circle 1\nrect 2 3\nsquare 4\n',
          out: '1. круг 3.14\n2. прямоугольник 6.00\n3. квадрат 16.00\nитого: 25.14\n',
        },
        {
          in: 'star 5\nsquare 2\n',
          out: 'строка 1: неизвестная фигура\n1. квадрат 4.00\nитого: 4.00\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пустой ввод' },
        { in: 'triangle 1 2 3\n', name: 'Только неизвестные' },
        { in: 'circle 10\n', name: 'Один круг' },
        { in: 'rect 0.5 0.5\nrect 1.5 2\n', name: 'Дробные размеры' },
        { in: 'square 1\nhex 2\nsquare 2\nblob\nsquare 3\n', name: 'Неизвестные в середине' },
        { in: 'circle 1000\nsquare 1000\n', name: 'Большие размеры' },
        { in: 'rect 7 3\ncircle 2.5\nsquare 0.1\n', name: 'Все виды' },
        { in: 'circle 1\ncircle 1\ncircle 1\ncircle 1\n', name: 'Повторы' },
      ],
    },
    {
      title: 'Гистограмма',
      description: `
В первой строке — число корзин \`n\`, дальше — целые числа до конца ввода. Корзина \`i\` (от 0 до n − 1) считает, сколько раз встретилось число \`i\`; остальные числа попадают в счётчик «вне диапазона».

Счётчики храните в массиве \`std::make_unique<int[]>(n)\` — он уже заполнен нулями. Напечатайте для каждой корзины строку \`i: c\`, а если \`c > 0\`, то после числа через пробел — \`c\` символов \`#\`. Последняя строка — \`вне диапазона: K\`.`,
      constraints: ['1 ≤ n ≤ 1000; чисел не больше 10 000, каждое по модулю не больше 10⁹.'],
      hints: [
        'auto counts = std::make_unique<int[]>(n); — обнулять вручную не нужно.',
        "Число x попадает в корзину, если 0 <= x && x < n; строку решёток даёт std::string(c, '#').",
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>

int main() {
    int n;
    std::cin >> n;
    auto counts = std::make_unique<int[]>(n);
    int outside = 0;
    long long x;
    while (std::cin >> x) {
        if (0 <= x && x < n) {
            ++counts[x];
        } else {
            ++outside;
        }
    }
    for (int i = 0; i < n; ++i) {
        if (counts[i] > 0) {
            std::println("{}: {} {}", i, counts[i], std::string(counts[i], '#'));
        } else {
            std::println("{}: 0", i);
        }
    }
    std::println("вне диапазона: {}", outside);
    return 0;
}`,
      explanation: `
Размер массива известен только во время выполнения, а меняться не будет — подходящий случай для \`unique_ptr<int[]>\`. \`make_unique<int[]>(n)\` инициализирует элементы значением, то есть нулями: отдельный цикл обнуления не нужен. С \`make_unique_for_overwrite\` счётчики начинались бы с мусора. Память освобождается сама при выходе из \`main\`, причём через \`delete[]\` — \`unique_ptr<T[]>\` знает, что владеет массивом.`,
      examples: [
        { in: '3\n0 1 1 2 2 2 5\n', out: '0: 1 #\n1: 2 ##\n2: 3 ###\nвне диапазона: 1\n' },
        { in: '2\n', out: '0: 0\n1: 0\nвне диапазона: 0\n' },
      ],
      hidden: [
        { in: '1\n0 0 0 0\n', name: 'Одна корзина' },
        { in: '4\n-1 -2 4 100\n', name: 'Все вне диапазона' },
        { in: '5\n4 3 2 1 0\n', name: 'По одному' },
        { in: '3\n1000000000 -1000000000 1\n', name: 'Большие числа' },
        { in: '6\n5 5 5 5 5 5 5 5 5 5 0\n', name: 'Длинная полоса' },
        { in: '10\n9\n', name: 'Последняя корзина' },
        { in: '1000\n999 0 500\n', name: 'Много корзин' },
        { in: '2\n1 1 0 1 -1 2\n', name: 'Смешанный ввод' },
      ],
    },
    {
      title: 'Найди ошибку: один int вместо массива',
      bug: true,
      description: `
Программа читает \`n\`, \`k\` и \`n\` целых чисел и печатает в одну строку суммы всех окон длины \`k\`, начиная с окна из первых \`k\` чисел. Для одного числа всё работает, а с двумя и больше AddressSanitizer сообщает о записи за границей выделенной памяти. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ k ≤ n ≤ 1000; числа по модулю не больше 10⁶.'],
      hints: [
        'Сколько int создаёт std::make_unique<int>(n)? Чему равно значение этого int?',
        'Массив создают так: std::make_unique<int[]>(n).',
      ],
      starter: WINDOW(false),
      solution: WINDOW(true),
      explanation: `
\`std::make_unique<int>(n)\` создаёт **один** \`int\` со значением \`n\` — аргумент ушёл в «конструктор» числа, а не в размер. Через \`buffer.get()\` программа получает указатель на этот единственный \`int\` и пишет в \`data[1]\`, \`data[2]\`… — за границу четырёх выделенных байт. AddressSanitizer сообщает о heap-buffer-overflow.

\`std::make_unique<int[]>(n)\` выбирает перегрузку для массивов и создаёт \`n\` элементов. Заодно сырой указатель становится не нужен: у \`unique_ptr<int[]>\` есть \`operator[]\`.`,
      examples: [
        { in: '5 2\n1 2 3 4 5\n', out: '3 5 7 9\n' },
        { in: '3 3\n10 20 30\n', out: '60\n' },
      ],
      hidden: [
        '4 1\n7 -1 0 5\n',
        '6 3\n1 1 1 1 1 1\n',
        '2 2\n1000000 1000000\n',
        '8 4\n-1 -2 -3 -4 -5 -6 -7 -8\n',
        '10 5\n1 2 3 4 5 6 7 8 9 10\n',
        '7 2\n0 0 0 1 0 0 0\n',
        '3 1\n5 5 5\n',
        '9 9\n1 2 3 4 5 6 7 8 9\n',
      ],
    },
    {
      title: 'Пул с ключом доступа',
      difficulty: 'advanced',
      description: `
Соединения \`Connection\` может создавать только пул \`Pool\`. Используйте ключ доступа: вложенный класс \`Connection::Key\` с закрытым конструктором по умолчанию и другом \`Pool\`; открытый конструктор \`Connection(Key, std::string host)\`. Пул хранит соединения в \`std::vector<std::unique_ptr<Connection>>\` в порядке открытия и создаёт их через \`std::make_unique\`. Деструктор \`Connection\` печатает \`закрыто host\`.

Первая строка — лимит соединений \`L\`. Команды:

- \`open host\` — если открыто \`L\` соединений, напечатать \`лимит\`; если соединение с этим host уже есть — \`уже открыто host\`; иначе открыть и напечатать \`открыто host (N/L)\`;
- \`close host\` — удалить соединение из вектора (деструктор напечатает сообщение) или напечатать \`нет host\`;
- \`list\` — все host через пробел в порядке открытия или \`пусто\`.

В конце напечатайте \`конец\`. Деструктор пула закрывает оставшиеся соединения в порядке открытия: порядок уничтожения элементов вектора стандарт не задаёт, поэтому сделайте его явным — \`for (auto &c : connections_) c.reset();\`.`,
      constraints: ['1 ≤ L ≤ 50; команд не больше 300.'],
      hints: [
        'class Key { friend class Pool; Key() = default; }; — создать Key{} может только Pool, а копировать его может кто угодно, в том числе make_unique.',
        'Удаление: std::erase_if(connections_, [&](const auto &c) { return c->host() == host; }) возвращает число удалённых.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Pool;

class Connection {
public:
    class Key {
        friend class Pool;
        Key() = default;
    };

    Connection(Key, std::string host) : host_(std::move(host)) {}
    Connection(const Connection &) = delete;
    Connection &operator=(const Connection &) = delete;
    ~Connection() {
        std::println("закрыто {}", host_);
    }

    const std::string &host() const {
        return host_;
    }

private:
    std::string host_;
};

class Pool {
public:
    explicit Pool(std::size_t limit) : limit_(limit) {}
    ~Pool() {
        for (auto &c : connections_) {
            c.reset();
        }
    }

    void open(const std::string &host) {
        if (connections_.size() == limit_) {
            std::println("лимит");
        } else if (std::ranges::any_of(connections_, [&](const auto &c) { return c->host() == host; })) {
            std::println("уже открыто {}", host);
        } else {
            connections_.push_back(std::make_unique<Connection>(Connection::Key{}, host));
            std::println("открыто {} ({}/{})", host, connections_.size(), limit_);
        }
    }

    void close(const std::string &host) {
        if (std::erase_if(connections_, [&](const auto &c) { return c->host() == host; }) == 0) {
            std::println("нет {}", host);
        }
    }

    void list() const {
        if (connections_.empty()) {
            std::println("пусто");
            return;
        }
        std::string line;
        for (const auto &c : connections_) {
            line += (line.empty() ? "" : " ") + c->host();
        }
        std::println("{}", line);
    }

private:
    std::size_t limit_;
    std::vector<std::unique_ptr<Connection>> connections_;
};

int main() {
    std::size_t limit;
    std::cin >> limit;
    Pool pool(limit);
    std::string command;
    while (std::cin >> command) {
        if (command == "list") {
            pool.list();
            continue;
        }
        std::string host;
        std::cin >> host;
        if (command == "open") {
            pool.open(host);
        } else {
            pool.close(host);
        }
    }
    std::println("конец");
    return 0;
}`,
      explanation: `
Закрытый конструктор с другом-пулом не работает с \`make_unique\`: конструктор вызывает функция стандартной библиотеки, а она другом не является. Ключ доступа переносит проверку с конструктора на его аргумент: конструктор \`Connection\` открыт, но вызвать его можно, только имея \`Key\`, а создать \`Key\` может лишь \`Pool\`. Передавать готовый ключ дальше разрешено всем — поэтому \`make_unique\` спокойно пересылает его в конструктор.

Пул владеет соединениями через \`unique_ptr\`: \`erase_if\` удаляет соединение вместе с объектом, а в конце \`main\` деструктор пула явно закрывает оставшиеся по порядку.`,
      examples: [
        {
          in: '2\nopen db\nopen cache\nopen web\nlist\nclose db\nopen web\nlist\n',
          out: 'открыто db (1/2)\nоткрыто cache (2/2)\nлимит\ndb cache\nзакрыто db\nоткрыто web (2/2)\ncache web\nконец\nзакрыто cache\nзакрыто web\n',
        },
        { in: '3\nlist\nclose x\n', out: 'пусто\nнет x\nконец\n' },
      ],
      hidden: [
        { in: '1\nopen a\nopen a\n', name: 'Повторное открытие' },
        { in: '1\nopen a\nopen b\nclose a\nopen b\n', name: 'Освобождение лимита' },
        { in: '3\nopen a\nopen b\nopen c\nclose b\nlist\n', name: 'Удаление из середины' },
        { in: '2\nopen a\nclose a\nclose a\nlist\n', name: 'Двойное закрытие' },
        { in: '5\nopen e\nopen d\nopen c\nopen b\nopen a\n', name: 'Закрытие в конце' },
        { in: '2\nopen x\nopen x\nopen y\nopen z\nlist\n', name: 'Повтор и лимит' },
        { in: '4\nopen база\nopen кэш\nlist\n', name: 'Кириллица' },
        { in: '1\nlist\nopen a\nlist\nclose a\nlist\n', name: 'Список по шагам' },
      ],
    },
  ],
};
