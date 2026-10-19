const CART = (fixed) => String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <vector>

class Item {
public:
    virtual ~Item() = default;
    virtual int price() const = 0;
};

class Book final : public Item {
public:
    Book(int price, int pages) : price_(price), pages_(pages) {}

    int price() const override {
        return price_;
    }

    int pages() const {
        return pages_;
    }

private:
    int price_;
    int pages_;
};

class Mug final : public Item {
public:
    explicit Mug(int price) : price_(price) {}

    int price() const override {
        return price_;
    }

private:
    int price_;
};

int main() {
    std::vector<std::unique_ptr<Item>> cart;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "book") {
            int price, pages;
            std::cin >> price >> pages;
            cart.push_back(std::make_unique<Book>(price, pages));
        } else {
            int price;
            std::cin >> price;
            cart.push_back(std::make_unique<Mug>(price));
        }
    }
    int total = 0, pages = 0;
    for (const auto &item : cart) {
        total += item->price();
${
  fixed
    ? `        if (const auto *book = dynamic_cast<const Book *>(item.get())) {
            pages += book->pages();
        }`
    : `        pages += static_cast<const Book *>(item.get())->pages();`
}
    }
    std::println("сумма {}, страниц {}", total, pages);
    return 0;
}`;

export default {
  id: 'oop-runtime-polymorphism',
  title: 'Полиморфизм во время выполнения',
  description:
    'Ветвление по коду вида и почему оно размазывает знания о видах по программе; полиморфизм собирает их в классах; принцип открытости/закрытости; фабрика, создающая объекты из данных и возвращающая unique_ptr на базу; dynamic_cast для безопасной проверки типа и опасность static_cast вниз по иерархии.',
  moduleId: 'cpp-oop',
  order: 22,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-virtual-destructor'],
  objectives: [
    'Заменять ветвление по коду вида виртуальными функциями',
    'Собирать создание объектов из данных в одну фабрику',
    'Безопасно проверять тип через dynamic_cast и понимать, когда это признак проблемы',
  ],
  tags: ['C++23', 'ООП', 'Полиморфизм', 'Фабрика', 'dynamic_cast', 'SOLID'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>
#include <vector>

struct Op {
    virtual ~Op() = default;
    virtual int apply(int x) const = 0;
};
struct Add : Op {
    int n;
    explicit Add(int n) : n(n) {}
    int apply(int x) const override { return x + n; }
};
struct Twice : Op {
    int apply(int x) const override { return 2 * x; }
};

int main() {
    std::vector<std::unique_ptr<Op>> ops;
    ops.push_back(std::make_unique<Add>(3));
    ops.push_back(std::make_unique<Twice>());
    ops.push_back(std::make_unique<Add>(-1));
    int x = 1;
    for (const auto &op : ops) x = op->apply(x);
    std::println("{}", x);
    return 0;
}`,
      lang: 'cpp',
      answers: ['7'],
      placeholder: 'Вывод программы',
      explain: '(1 + 3) · 2 − 1 = 7: каждый объект применяет свою операцию.',
    },
    {
      q: 'Чем плох switch по коду вида объекта в нескольких функциях программы?',
      options: [
        'Новый вид требует правки всех таких функций, а пропущенная ветка обнаружится только при работе',
        'switch медленнее виртуальных функций в десятки раз',
        'switch нельзя использовать с enum class',
        'Ничем',
      ],
      correct: 0,
      explain:
        'Знание о каждом виде размазано по программе вместо того, чтобы жить в одном классе.',
    },
    {
      q: 'Что утверждает принцип открытости/закрытости?',
      options: [
        'Код открыт для расширения, но закрыт для изменения: новое поведение добавляют новыми классами',
        'Все поля класса должны быть открытыми',
        'Классы нельзя наследовать',
        'Каждый класс должен иметь закрытый конструктор',
      ],
      correct: 0,
      explain: 'Буква O в SOLID.',
    },
    {
      q: 'Где в полиморфной программе по-прежнему перечисляются все виды объектов?',
      options: [
        'В фабрике, создающей объекты из данных',
        'В каждой функции обработки',
        'В деструкторе базы',
        'Нигде',
      ],
      correct: 0,
      explain: 'Создание из данных собирают в одну функцию, возвращающую unique_ptr на базу.',
    },
    {
      q: 'Что вернёт dynamic_cast<const Book *>(item), если item указывает на кружку?',
      answers: ['nullptr', 'нулевой указатель'],
      placeholder: 'Значение',
      explain: 'dynamic_cast для указателей сообщает о несовпадении типа пустым указателем.',
    },
    {
      q: 'Чем опасен static_cast<Book *>(item) для произвольного товара?',
      options: [
        'Он ничего не проверяет: если это не книга, поведение не определено (UBSan сообщит о неверном приведении)',
        'Он вернёт nullptr',
        'Он бросит исключение',
        'Он не скомпилируется',
      ],
      correct: 0,
      explain: 'static_cast вниз по иерархии допустим, только если тип известен наверняка.',
    },
    {
      q: 'О чём говорят частые проверки dynamic_cast в коде?',
      options: [
        'Скорее всего, в базе не хватает виртуальной функции с нужным поведением',
        'Код очень безопасен',
        'Классы следует сделать final',
        'Нужен виртуальный деструктор',
      ],
      correct: 0,
      explain: 'Это switch по типу в другом обличье.',
    },
    {
      q: 'Для каких классов работает dynamic_cast?',
      options: [
        'Для полиморфных — с хотя бы одной виртуальной функцией',
        'Для любых классов',
        'Только для финальных',
        'Только для абстрактных',
      ],
      correct: 0,
      explain: 'Проверка типа использует информацию, связанную с таблицей виртуальных функций.',
    },
  ],
  exercises: [
    {
      id: 'oop-runtime-polymorphism-exercise',
      title: 'Фабрика фигур',
      difficulty: 'beginner',
      description: `
Напишите фабрику \`std::unique_ptr<Shape> read_shape(std::istream &in)\`, которая читает из потока вид фигуры и её размеры и возвращает созданную фигуру или \`nullptr\`, если ввод закончился. Виды: \`circle r\` (\`круг\`), \`rect w h\` (\`прямоугольник\`), \`square s\` (\`квадрат\`), \`tri a b c\` (\`треугольник\`, формула Герона).

\`main\` вызывает фабрику в цикле, печатает \`имя: площадь\` с двумя знаками для каждой фигуры и в конце \`фигур N\`. Кроме фабрики, виды фигур нигде не упоминаются.`,
      constraints: ['Фигур не больше 50; ввод корректен.'],
      hints: [
        'Сигнатура фабрики принимает поток: read_shape(std::cin). Внутри — if по слову вида и std::make_unique<…>.',
        'Цикл: while (auto shape = read_shape(std::cin)) { … } — пустой указатель останавливает его.',
      ],
      solution: String.raw`
#include <cmath>
#include <iostream>
#include <memory>
#include <numbers>
#include <print>
#include <string>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::string name() const = 0;
};

class Circle final : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override {
        return std::numbers::pi * r_ * r_;
    }
    std::string name() const override {
        return "круг";
    }

private:
    double r_;
};

class Rect final : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    double area() const override {
        return w_ * h_;
    }
    std::string name() const override {
        return "прямоугольник";
    }

private:
    double w_;
    double h_;
};

class Square final : public Shape {
public:
    explicit Square(double s) : s_(s) {}
    double area() const override {
        return s_ * s_;
    }
    std::string name() const override {
        return "квадрат";
    }

private:
    double s_;
};

class Triangle final : public Shape {
public:
    Triangle(double a, double b, double c) : a_(a), b_(b), c_(c) {}
    double area() const override {
        double p = (a_ + b_ + c_) / 2;
        return std::sqrt(p * (p - a_) * (p - b_) * (p - c_));
    }
    std::string name() const override {
        return "треугольник";
    }

private:
    double a_;
    double b_;
    double c_;
};

std::unique_ptr<Shape> read_shape(std::istream &in) {
    std::string kind;
    if (!(in >> kind)) {
        return nullptr;
    }
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
        double s;
        in >> s;
        return std::make_unique<Square>(s);
    }
    double a, b, c;
    in >> a >> b >> c;
    return std::make_unique<Triangle>(a, b, c);
}

int main() {
    int count = 0;
    while (auto shape = read_shape(std::cin)) {
        std::println("{}: {:.2f}", shape->name(), shape->area());
        count++;
    }
    std::println("фигур {}", count);
    return 0;
}`,
      explanation: `
Фабрика — единственное место, где перечислены виды фигур. Она отвечает только за создание объекта из данных; всё остальное — имя, площадь — фигура знает сама. \`main\` работает с \`Shape\` и не изменится, когда появится шестиугольник: добавится класс и ветка в фабрике.

Фабрика принимает поток, а не читает \`std::cin\` напрямую: так её можно вызвать для файла или строки — например, в тестах.`,
      examples: [
        {
          in: 'circle 1\nsquare 2\ntri 3 4 5\n',
          out: 'круг: 3.14\nквадрат: 4.00\nтреугольник: 6.00\nфигур 3\n',
        },
        { in: '', out: 'фигур 0\n' },
      ],
      hidden: [
        { in: 'rect 2 3\n', name: 'Прямоугольник' },
        { in: 'circle 10\n', name: 'Большой круг' },
        { in: 'tri 1 1 1\n', name: 'Равносторонний' },
        { in: 'square 1 square 2 square 3\n', name: 'В одну строку' },
        { in: 'rect 0.5 0.5\ncircle 0.5\n', name: 'Маленькие' },
        { in: 'tri 5 5 6\nrect 1 100\n', name: 'Смесь' },
        { in: 'square 1000\n', name: 'Большой квадрат' },
        { in: 'circle 2\ncircle 2\n', name: 'Одинаковые' },
      ],
    },
    {
      title: 'Стековая машина',
      description: `
Программа для стековой машины — слова через пробел: \`push N\`, \`add\`, \`sub\`, \`mul\`, \`dup\`, \`swap\`, \`print\`. Опишите абстрактный класс \`Command\` с методом \`bool execute(std::vector<long long> &stack) const\` (\`false\` — на стеке не хватает значений) и по классу на каждую команду. Сначала **разберите** всю программу в \`std::vector<std::unique_ptr<Command>>\`, затем **выполните** команды по порядку.

- \`add\`, \`sub\`, \`mul\` снимают два значения \`a\` (ниже) и \`b\` (вершина) и кладут \`a + b\`, \`a − b\`, \`a · b\`;
- \`dup\` дублирует вершину, \`swap\` меняет два верхних значения;
- \`print\` печатает вершину, не снимая её.

Если команде не хватает значений, напечатайте \`ошибка: команда N\` (номер с 1) и остановитесь.`,
      constraints: [
        'Команд не больше 100; числа по модулю до 10⁶; результаты помещаются в long long.',
      ],
      hints: [
        'Фабрика команд: std::unique_ptr<Command> make_command(const std::string &word, std::istream &in) — для push она дочитывает число.',
        'Двухместная команда: if (stack.size() < 2) return false; long long b = stack.back(); stack.pop_back(); long long a = stack.back(); stack.back() = a op b;',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

using Stack = std::vector<long long>;

class Command {
public:
    virtual ~Command() = default;
    virtual bool execute(Stack &stack) const = 0;
};

class Push final : public Command {
public:
    explicit Push(long long value) : value_(value) {}
    bool execute(Stack &stack) const override {
        stack.push_back(value_);
        return true;
    }

private:
    long long value_;
};

class Binary : public Command {
public:
    bool execute(Stack &stack) const final {
        if (stack.size() < 2) {
            return false;
        }
        long long b = stack.back();
        stack.pop_back();
        stack.back() = combine(stack.back(), b);
        return true;
    }

private:
    virtual long long combine(long long a, long long b) const = 0;
};

class Add final : public Binary {
    long long combine(long long a, long long b) const override {
        return a + b;
    }
};

class Sub final : public Binary {
    long long combine(long long a, long long b) const override {
        return a - b;
    }
};

class Mul final : public Binary {
    long long combine(long long a, long long b) const override {
        return a * b;
    }
};

class Dup final : public Command {
public:
    bool execute(Stack &stack) const override {
        if (stack.empty()) {
            return false;
        }
        stack.push_back(stack.back());
        return true;
    }
};

class Swap final : public Command {
public:
    bool execute(Stack &stack) const override {
        if (stack.size() < 2) {
            return false;
        }
        std::swap(stack[stack.size() - 1], stack[stack.size() - 2]);
        return true;
    }
};

class Print final : public Command {
public:
    bool execute(Stack &stack) const override {
        if (stack.empty()) {
            return false;
        }
        std::println("{}", stack.back());
        return true;
    }
};

std::unique_ptr<Command> make_command(const std::string &word, std::istream &in) {
    if (word == "push") {
        long long value;
        in >> value;
        return std::make_unique<Push>(value);
    }
    if (word == "add") {
        return std::make_unique<Add>();
    }
    if (word == "sub") {
        return std::make_unique<Sub>();
    }
    if (word == "mul") {
        return std::make_unique<Mul>();
    }
    if (word == "dup") {
        return std::make_unique<Dup>();
    }
    if (word == "swap") {
        return std::make_unique<Swap>();
    }
    return std::make_unique<Print>();
}

int main() {
    std::vector<std::unique_ptr<Command>> program;
    std::string word;
    while (std::cin >> word) {
        program.push_back(make_command(word, std::cin));
    }
    Stack stack;
    for (std::size_t i = 0; i < program.size(); i++) {
        if (!program[i]->execute(stack)) {
            std::println("ошибка: команда {}", i + 1);
            break;
        }
    }
    return 0;
}`,
      explanation: `
Команды — объекты, а программа — вектор таких объектов. Исполнитель не знает ни одной команды: он вызывает \`execute\` и проверяет результат. Новая команда — новый класс и ветка в фабрике. Разбор и исполнение разделены: сначала вся программа превращается в объекты, потом выполняется.

Три арифметические команды отличаются только операцией, поэтому у них общий абстрактный класс \`Binary\` с финальным \`execute\` (проверка стека, снятие и запись) и закрытым шагом \`combine\` — схема NVI. Это шаблон «Команда»: действие, превращённое в объект, которое можно хранить, передавать и выполнять позже.`,
      examples: [
        { in: 'push 2 push 3 add dup mul print\n', out: '25\n' },
        { in: 'push 1 add print\n', out: 'ошибка: команда 2\n' },
      ],
      hidden: [
        { in: 'push 5 push 2 sub print\n', name: 'Порядок вычитания' },
        { in: 'push 5 push 2 swap sub print\n', name: 'Обмен' },
        { in: 'print\n', name: 'Печать пустого' },
        { in: 'push 1000000 dup mul print\n', name: 'Большое произведение' },
        { in: 'push 1 print push 2 print add print\n', name: 'Несколько печатей' },
        { in: 'dup\n', name: 'Дублирование пустого' },
        { in: 'push 7 swap\n', name: 'Обмен с одним' },
        { in: '', name: 'Пустая программа' },
      ],
    },
    {
      title: 'Найди ошибку: каждая вещь — книга',
      bug: true,
      description: `
Корзина хранит книги (\`book цена страницы\`) и кружки (\`mug цена\`) в \`std::vector<std::unique_ptr<Item>>\`. Программа печатает \`сумма S, страниц P\`, где P — суммарное число страниц **только книг**.

С кружками в корзине программа печатает странное число страниц, а под санитайзерами аварийно завершается. Найдите и исправьте ошибку.`,
      constraints: ['Товаров не больше 30; цены до 10⁴, страницы до 10⁴.'],
      hints: [
        'Прочитайте сообщение UBSan: downcast of address … which does not point to an object of type Book.',
        'static_cast не проверяет тип. Используйте dynamic_cast<const Book *> и прибавляйте страницы, только если результат не nullptr.',
      ],
      starter: CART(false),
      solution: CART(true),
      explanation: `
\`static_cast<const Book *>\` приводит указатель к книге, ничего не проверяя: для кружки результат указывает на объект не того типа, и чтение \`pages_\` — неопределённое поведение. Обычно читается то, что лежит в памяти кружки после её полей, — отсюда странные числа. UBSan замечает неверное приведение во время работы.

\`dynamic_cast\` проверяет настоящий тип объекта и для кружки возвращает \`nullptr\`. А ещё лучше — спросить себя, не стоит ли добавить в \`Item\` виртуальную функцию \`pages()\` с нулём по умолчанию: тогда проверка типа не понадобится вовсе.`,
      examples: [
        { in: 'book 500 320\nmug 300\nbook 400 180\n', out: 'сумма 1200, страниц 500\n' },
        { in: 'book 100 10\n', out: 'сумма 100, страниц 10\n' },
      ],
      hidden: [
        'mug 300\n',
        'mug 1\nmug 2\n',
        'book 1 1\nmug 1\n',
        'mug 5\nbook 5 5\n',
        'book 10000 10000\nbook 10000 10000\nmug 10000\n',
        'mug 0\nbook 0 0\n',
        'book 50 200\nmug 70\nmug 80\nbook 60 100\n',
        'mug 100\nmug 100\nmug 100\n',
      ],
    },
    {
      title: 'Дерево выражения',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — выражение в **префиксной** записи: сначала операция, затем её аргументы. Операции: \`+\`, \`-\`, \`*\` (два аргумента) и \`neg\` (один аргумент, смена знака); аргументы — целые числа или вложенные выражения. Например, \`* + 2 3 neg 4\` — это \`(2 + 3) · (−4)\`.

Постройте дерево: абстрактный узел \`Node\` с методами \`long long eval() const\` и \`std::string str() const\`; наследники \`Number\`, \`Binary\` (операция и два \`std::unique_ptr<Node>\`) и \`Negate\`. Разбор — рекурсивная фабрика. Для каждой строки напечатайте \`запись = значение\`, где запись — полностью расставленные скобки: \`((2 + 3) * -(4))\`.`,
      constraints: ['Строк не больше 20; глубина до 30; числа по модулю до 1000; ввод корректен.'],
      hints: [
        'Фабрика: std::unique_ptr<Node> parse(std::istringstream &in) читает слово; если это операция — рекурсивно вызывает parse для аргументов, иначе создаёт Number.',
        'str(): у Binary — "(" + left->str() + " " + op + " " + right->str() + ")", у Negate — "-(" + arg->str() + ")", у Number — std::to_string.',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <sstream>
#include <string>
#include <utility>

class Node {
public:
    virtual ~Node() = default;
    virtual long long eval() const = 0;
    virtual std::string str() const = 0;
};

class Number final : public Node {
public:
    explicit Number(long long value) : value_(value) {}

    long long eval() const override {
        return value_;
    }

    std::string str() const override {
        return std::to_string(value_);
    }

private:
    long long value_;
};

class Binary final : public Node {
public:
    Binary(char op, std::unique_ptr<Node> left, std::unique_ptr<Node> right)
        : op_(op), left_(std::move(left)), right_(std::move(right)) {}

    long long eval() const override {
        long long a = left_->eval(), b = right_->eval();
        return op_ == '+' ? a + b : op_ == '-' ? a - b : a * b;
    }

    std::string str() const override {
        return "(" + left_->str() + " " + op_ + " " + right_->str() + ")";
    }

private:
    char op_;
    std::unique_ptr<Node> left_;
    std::unique_ptr<Node> right_;
};

class Negate final : public Node {
public:
    explicit Negate(std::unique_ptr<Node> arg) : arg_(std::move(arg)) {}

    long long eval() const override {
        return -arg_->eval();
    }

    std::string str() const override {
        return "-(" + arg_->str() + ")";
    }

private:
    std::unique_ptr<Node> arg_;
};

std::unique_ptr<Node> parse(std::istringstream &in) {
    std::string token;
    in >> token;
    if (token == "+" || token == "-" || token == "*") {
        auto left = parse(in);
        auto right = parse(in);
        return std::make_unique<Binary>(token[0], std::move(left), std::move(right));
    }
    if (token == "neg") {
        return std::make_unique<Negate>(parse(in));
    }
    return std::make_unique<Number>(std::stoll(token));
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) {
            continue;
        }
        std::istringstream in(line);
        auto tree = parse(in);
        std::println("{} = {}", tree->str(), tree->eval());
    }
    return 0;
}`,
      explanation: `
Выражение — дерево объектов, каждый узел которого сам знает, как себя вычислить и записать. Вычисление всего дерева — один виртуальный вызов у корня, который рекурсивно расходится по узлам; никакого \`switch\` по типу узла нет. Это шаблон «Компоновщик» (Composite): составной узел и лист имеют общий интерфейс.

Узлы владеют детьми через \`std::unique_ptr\`, поэтому уничтожение корня освобождает всё дерево. Аргументы разбираются в отдельные переменные \`left\` и \`right\` до создания узла: порядок вычисления аргументов функции не определён, а читать из потока нужно строго слева направо.`,
      examples: [
        { in: '* + 2 3 neg 4\n', out: '((2 + 3) * -(4)) = -20\n' },
        { in: '7\n- 10 + 1 2\n', out: '7 = 7\n(10 - (1 + 2)) = 7\n' },
      ],
      hidden: [
        { in: 'neg neg 5\n', name: 'Двойное отрицание' },
        { in: '+ 1 + 2 + 3 4\n', name: 'Цепочка справа' },
        { in: '+ + + 1 2 3 4\n', name: 'Цепочка слева' },
        { in: '* 1000 * 1000 1000\n', name: 'Большое произведение' },
        { in: '- 0 1000\n', name: 'Отрицательный результат' },
        { in: 'neg -5\n', name: 'Отрицательное число' },
        { in: '* - 9 4 neg + 1 1\n', name: 'Смесь' },
        { in: '0\n\n1\n', name: 'Пустая строка' },
      ],
    },
  ],
};
