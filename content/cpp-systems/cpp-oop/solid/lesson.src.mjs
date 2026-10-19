const SHAPES = (fixed) => String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <vector>

class Rect {
public:
    Rect(int w, int h) : w_(w), h_(h) {}
    virtual ~Rect() = default;
    virtual void set_width(int w) {
        w_ = w;
    }
    virtual void set_height(int h) {
        h_ = h;
    }
    int width() const {
        return w_;
    }
    int height() const {
        return h_;
    }
    int area() const {
        return w_ * h_;
    }

protected:
    int w_, h_;
};
${
  fixed
    ? ''
    : `
class Square final : public Rect {
public:
    explicit Square(int a) : Rect(a, a) {}
    void set_width(int w) override {
        w_ = h_ = w;
    }
    void set_height(int h) override {
        w_ = h_ = h;
    }
};
`
}
void stretch(Rect &r, int k) {
    r.set_width(r.width() * k);
}

int main() {
    std::vector<std::unique_ptr<Rect>> shapes;
    std::string command;
    while (std::cin >> command) {
        if (command == "rect") {
            int w, h;
            std::cin >> w >> h;
            shapes.push_back(std::make_unique<Rect>(w, h));
        } else if (command == "square") {
            int a;
            std::cin >> a;
            shapes.push_back(std::make_unique<${fixed ? 'Rect>(a, a)' : 'Square>(a)'});
        } else {
            int k;
            std::cin >> k;
            for (const auto &s : shapes) {
                stretch(*s, k);
            }
        }
    }
    for (const auto &s : shapes) {
        const char *name = s->width() == s->height() ? "квадрат" : "прямоугольник";
        std::println("{} {}x{} = {}", name, s->width(), s->height(), s->area());
    }
    return 0;
}`;

export default {
  id: 'oop-solid',
  title: 'SOLID',
  description:
    'Пять принципов объектного проектирования как вопросы к коду: единственная ответственность и разделение ввода, вычислений и оформления; открытость/закрытость и замена повторяющихся switch классами или таблицей; подстановка Лисков и классическая ошибка «квадрат — это прямоугольник»; разделение интерфейсов и инверсия зависимостей; когда абстракции не нужны.',
  moduleId: 'cpp-oop',
  order: 27,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['oop-concepts'],
  objectives: [
    'Разделять ответственность между функциями и классами',
    'Добавлять новые виды поведения без правки работающего кода',
    'Распознавать наследование, нарушающее подстановку Лисков',
    'Оценивать, когда абстракция оправдана',
  ],
  tags: ['C++23', 'ООП', 'SOLID', 'Проектирование'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Функция читает заказы из файла, считает статистику и печатает отчёт в HTML. Какой принцип она нарушает в первую очередь?',
      options: [
        'Единственной ответственности',
        'Подстановки Лисков',
        'Разделения интерфейсов',
        'Никакой',
      ],
      correct: 0,
      explain: 'Её придётся менять по трём разным причинам: формат ввода, метрики, оформление.',
    },
    {
      q: 'Что означает принцип открытости/закрытости?',
      options: [
        'Новое поведение добавляется новым кодом, без правки проверенного',
        'Все поля класса должны быть открытыми',
        'Класс нельзя наследовать',
        'Код нельзя менять после выпуска',
      ],
      correct: 0,
      explain: 'Например, новая скидка — новый класс, а код применения скидок не меняется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Rect {
public:
    virtual ~Rect() = default;
    virtual void set(int w, int h) {
        w_ = w;
        h_ = h;
    }
    int area() const {
        return w_ * h_;
    }

protected:
    int w_ = 0, h_ = 0;
};

class Square final : public Rect {
public:
    void set(int w, int) override {
        w_ = h_ = w;
    }
};

int main() {
    Square s;
    Rect &r = s;
    r.set(5, 2);
    std::println("{}", r.area());
    return 0;
}`,
      lang: 'cpp',
      answers: ['25'],
      placeholder: 'Вывод программы',
      explain:
        'Квадрат игнорирует высоту: 5 · 5 = 25, а код, написанный для Rect, ждёт 10. Это нарушение подстановки Лисков.',
    },
    {
      q: 'Наследник нарушает подстановку Лисков, если он… Выберите все.',
      options: [
        'Бросает исключение там, где база обещала не бросать',
        'Требует от аргументов больше, чем база',
        'Гарантирует меньше, чем обещала база',
        'Добавляет новый метод, которого нет в базе',
      ],
      correct: [0, 1, 2],
      explain: 'Новые методы не мешают коду, работающему через базу. Мешают нарушенные обещания.',
    },
    {
      q: 'Почему компилятор не обнаруживает нарушение подстановки Лисков?',
      options: [
        'Типы и сигнатуры совпадают; нарушен смысл поведения, а не правила языка',
        'Нужно включить -Wall',
        'Обнаруживает, если метод помечен override',
        'Нарушение возможно только в шаблонах',
      ],
      correct: 0,
      explain: 'Поведение проверяют тесты и ревью, а не компилятор.',
    },
    {
      q: 'Какой признак чаще всего указывает на нарушение открытости/закрытости?',
      options: [
        'Одинаковый switch по виду объекта в нескольких функциях',
        'Класс с виртуальным деструктором',
        'Функция длиной больше 10 строк',
        'Использование std::vector',
      ],
      correct: 0,
      explain:
        'Каждый новый вид требует правки всех таких switch. Полноту хотя бы проверит std::visit, если это variant.',
    },
    {
      q: 'Когда вводить интерфейс оправдано? Выберите все.',
      options: [
        'Есть вторая реализация',
        'Логику нужно проверять с подставной реализацией',
        'Реализацию выбирают во время работы',
        'На всякий случай, для каждого класса',
      ],
      correct: [0, 1, 2],
      explain: 'Абстракция «на вырост» усложняет код, не давая гибкости.',
    },
    {
      q: 'Принцип, по которому логика зависит от абстракций, а конкретные реализации передаются снаружи, называется принципом инверсии…',
      answers: ['зависимостей', 'инверсии зависимостей', 'dependency inversion'],
      placeholder: 'Одно слово',
      explain: 'Буква D в SOLID.',
    },
  ],
  exercises: [
    {
      id: 'oop-solid-exercise',
      title: 'Отчёт по заказам',
      difficulty: 'intermediate',
      description: `
Первое слово ввода — формат \`text\` или \`csv\`, затем строки \`имя сумма\`. Разделите программу на три части:

- чтение: \`std::vector<Order> read_orders(std::istream &)\`, где \`Order { std::string customer; long long amount; }\`;
- вычисления: \`Stats compute(const std::vector<Order> &)\` — число заказов, сумма и крупнейший заказ (при равенстве — первый);
- оформление: интерфейс \`ReportPrinter\` с методом \`void print(const Stats &) const\` и реализации \`TextPrinter\`, \`CsvPrinter\`.

Формат \`text\`: \`заказов N, сумма S, крупнейший имя (сумма)\` или \`заказов нет\`. Формат \`csv\`: строка заголовка \`count,total,top,top_amount\` и строка значений; для пустого набора — \`0,0,-,0\`.`,
      constraints: ['Заказов не больше 100; суммы от 1 до 10⁹.'],
      hints: [
        'Stats хранит count, total, top (имя) и top_amount; для пустого набора count == 0.',
        'Выбор принтера — единственное место, где упоминаются конкретные классы: std::unique_ptr<ReportPrinter> printer = format == "csv" ? … : …;',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <vector>

struct Order {
    std::string customer;
    long long amount;
};

struct Stats {
    int count = 0;
    long long total = 0;
    std::string top;
    long long top_amount = 0;
};

std::vector<Order> read_orders(std::istream &in) {
    std::vector<Order> orders;
    Order o;
    while (in >> o.customer >> o.amount) {
        orders.push_back(o);
    }
    return orders;
}

Stats compute(const std::vector<Order> &orders) {
    Stats s;
    for (const Order &o : orders) {
        if (s.count == 0 || o.amount > s.top_amount) {
            s.top = o.customer;
            s.top_amount = o.amount;
        }
        s.count++;
        s.total += o.amount;
    }
    return s;
}

class ReportPrinter {
public:
    virtual ~ReportPrinter() = default;
    virtual void print(const Stats &s) const = 0;
};

class TextPrinter final : public ReportPrinter {
public:
    void print(const Stats &s) const override {
        if (s.count == 0) {
            std::println("заказов нет");
            return;
        }
        std::println("заказов {}, сумма {}, крупнейший {} ({})", s.count, s.total, s.top, s.top_amount);
    }
};

class CsvPrinter final : public ReportPrinter {
public:
    void print(const Stats &s) const override {
        std::println("count,total,top,top_amount");
        std::println("{},{},{},{}", s.count, s.total, s.count == 0 ? "-" : s.top, s.top_amount);
    }
};

int main() {
    std::string format;
    std::cin >> format;
    const std::unique_ptr<ReportPrinter> printer =
        format == "csv" ? std::unique_ptr<ReportPrinter>(std::make_unique<CsvPrinter>())
                        : std::unique_ptr<ReportPrinter>(std::make_unique<TextPrinter>());
    printer->print(compute(read_orders(std::cin)));
    return 0;
}`,
      explanation: `
Каждая часть меняется по своей причине. Новый формат ввода затронет только \`read_orders\`, новая метрика — \`Stats\` и \`compute\`, новый формат отчёта — ещё один наследник \`ReportPrinter\`. \`compute\` не знает ни о потоках, ни о печати, поэтому её легко проверить на готовом векторе.

\`read_orders\` принимает \`std::istream &\`, а не читает из \`std::cin\` сама: в тесте ей можно передать \`std::istringstream\` со строкой.`,
      examples: [
        {
          in: 'text\nАда 300\nАлан 120\nГрейс 300\n',
          out: 'заказов 3, сумма 720, крупнейший Ада (300)\n',
        },
        { in: 'csv\nАда 300\n', out: 'count,total,top,top_amount\n1,300,Ада,300\n' },
      ],
      hidden: [
        { in: 'text\n', name: 'Пустой текстовый отчёт' },
        { in: 'csv\n', name: 'Пустой CSV' },
        { in: 'csv\na 1\nb 2\nc 3\n', name: 'Крупнейший последний' },
        { in: 'text\nx 1000000000\ny 1000000000\nz 1000000000\n', name: 'Большие суммы' },
        { in: 'text\nодин 5\n', name: 'Один заказ' },
        { in: 'csv\nq 7\nw 7\n', name: 'Равные суммы' },
        { in: 'text\nb 2\na 9\nc 1\n', name: 'Крупнейший в середине' },
        { in: 'csv\nm 10\nn 20\nm 30\n', name: 'Повтор имени' },
      ],
    },
    {
      title: 'Скидки из таблицы',
      description: `
Первая строка — цена. Затем строки \`вид значение\`, скидки применяются по порядку:

- \`percent P\` — цена · (100 − P) / 100 (целочисленно);
- \`minus X\` — цена − X, но не меньше 0;
- \`cap C\` — не больше C.

Каждый вид — наследник интерфейса \`Discount\` (\`long long apply(long long) const\`). Создание — через таблицу \`std::map<std::string, std::function<std::unique_ptr<Discount>(long long)>>\`: имя вида → функция, создающая скидку. После каждой скидки напечатайте \`вид значение → цена\`. Для вида, которого нет в таблице, напечатайте \`неизвестная скидка вид\` и продолжайте. В конце — \`итог N\`.`,
      constraints: ['Цена до 10⁹; 0 ≤ P ≤ 100; X, C от 0 до 10⁹; строк не больше 50.'],
      hints: [
        'Запись таблицы: {"percent", [](long long v) { return std::make_unique<Percent>(v); }}. Тип результата лямбды приводится к std::unique_ptr<Discount> внутри std::function.',
        'Поиск: if (auto it = table.find(kind); it != table.end()) { auto d = it->second(value); … }',
      ],
      solution: String.raw`
#include <algorithm>
#include <functional>
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>

class Discount {
public:
    virtual ~Discount() = default;
    virtual long long apply(long long price) const = 0;
};

class Percent final : public Discount {
public:
    explicit Percent(long long p) : p_(p) {}
    long long apply(long long price) const override {
        return price * (100 - p_) / 100;
    }

private:
    long long p_;
};

class Minus final : public Discount {
public:
    explicit Minus(long long x) : x_(x) {}
    long long apply(long long price) const override {
        return std::max(0LL, price - x_);
    }

private:
    long long x_;
};

class Cap final : public Discount {
public:
    explicit Cap(long long c) : c_(c) {}
    long long apply(long long price) const override {
        return std::min(price, c_);
    }

private:
    long long c_;
};

using Factory = std::function<std::unique_ptr<Discount>(long long)>;

const std::map<std::string, Factory> &discount_table() {
    static const std::map<std::string, Factory> table{
        {"percent", [](long long v) { return std::make_unique<Percent>(v); }},
        {"minus", [](long long v) { return std::make_unique<Minus>(v); }},
        {"cap", [](long long v) { return std::make_unique<Cap>(v); }},
    };
    return table;
}

int main() {
    long long price;
    std::cin >> price;
    std::string kind;
    long long value;
    while (std::cin >> kind >> value) {
        const auto &table = discount_table();
        if (const auto it = table.find(kind); it != table.end()) {
            price = it->second(value)->apply(price);
            std::println("{} {} → {}", kind, value, price);
        } else {
            std::println("неизвестная скидка {}", kind);
        }
    }
    std::println("итог {}", price);
    return 0;
}`,
      explanation: `
Цикл применения скидок не знает ни одного конкретного класса. Чтобы добавить новый вид, достаточно написать класс и одну строку в таблице — ни \`main\`, ни остальные скидки не меняются. Таблица заменяет \`switch\` по строке и заодно даёт естественную обработку неизвестных видов.

\`std::function\` здесь хранит лямбды разных типов — то самое стирание типа из прошлого урока.`,
      examples: [
        {
          in: '1000\npercent 10\nminus 50\ncap 800\n',
          out: 'percent 10 → 900\nminus 50 → 850\ncap 800 → 800\nитог 800\n',
        },
        { in: '500\nbonus 5\n', out: 'неизвестная скидка bonus\nитог 500\n' },
      ],
      hidden: [
        { in: '100\n', name: 'Без скидок' },
        { in: '100\nminus 1000\n', name: 'Не ниже нуля' },
        { in: '999\npercent 100\n', name: 'Скидка 100%' },
        { in: '999\npercent 0\n', name: 'Скидка 0%' },
        { in: '1000000000\npercent 50\ncap 1\n', name: 'Большая цена' },
        { in: '77\npercent 33\n', name: 'Округление вниз' },
        { in: '300\ncap 500\nfoo 1\nminus 100\n', name: 'Неизвестная в середине' },
        { in: '1000\nminus 100\npercent 10\n', name: 'Порядок важен' },
      ],
    },
    {
      title: 'Найди ошибку: растянутый квадрат',
      bug: true,
      description: `
Программа хранит прямоугольники. Команды: \`rect w h\` — добавить прямоугольник, \`square a\` — добавить прямоугольник со сторонами a × a, \`stretch k\` — растянуть **по ширине** в k раз все уже добавленные фигуры. В конце для каждой фигуры печатается \`квадрат WxH = S\`, если стороны равны, иначе \`прямоугольник WxH = S\`.

После растяжения квадрат должен стать прямоугольником, но программа растягивает его во все стороны. Исправьте устройство классов.`,
      constraints: ['Команд не больше 50; размеры и k от 1 до 100; площади помещаются в int.'],
      hints: [
        'Какое обещание Rect нарушает Square::set_width?',
        'Квадрат здесь — не отдельное поведение, а прямоугольник с равными сторонами. Уберите наследника и создавайте Rect(a, a).',
      ],
      starter: SHAPES(false),
      solution: SHAPES(true),
      explanation: `
\`Rect\` обещает, что \`set_width\` меняет только ширину, и \`stretch\` честно на это опирается. \`Square\` переопределяет сеттеры так, чтобы остаться квадратом, — и нарушает обещание базы. Код, написанный для \`Rect\`, получает неожиданный результат, а компилятор молчит: сигнатуры совпадают.

Изменяемый квадрат не может быть подтипом изменяемого прямоугольника. Квадрат — это состояние прямоугольника (стороны равны), а не особый вид поведения, поэтому отдельный класс не нужен: название определяется по сторонам при печати.`,
      examples: [
        {
          in: 'square 3\nrect 2 5\nstretch 2\n',
          out: 'прямоугольник 6x3 = 18\nпрямоугольник 4x5 = 20\n',
        },
        { in: 'square 2\n', out: 'квадрат 2x2 = 4\n' },
      ],
      hidden: [
        'square 1\nstretch 3\n',
        'square 4\nstretch 1\n',
        'rect 2 4\nstretch 2\n',
        'square 2\nstretch 2\nsquare 5\n',
        'square 1\nsquare 2\nstretch 2\nstretch 2\n',
        'rect 1 1\nstretch 5\n',
        'square 10\nrect 3 3\nstretch 10\n',
        'stretch 2\nsquare 7\n',
      ],
    },
    {
      title: 'Оплата',
      difficulty: 'advanced',
      description: `
Интерфейс \`PaymentMethod\` с методом \`std::expected<long long, std::string> charge(long long amount)\`: при успехе возвращает комиссию, при отказе — причину. Реализации:

- \`Card\` — всегда успешно, комиссия \`amount / 50\` (2 %, целочисленно);
- \`Wallet(balance)\` — без комиссии; если сумма больше остатка — отказ \`недостаточно средств\`, иначе остаток уменьшается;
- \`GiftCard(balance)\` — без комиссии, одноразовая: после первой успешной оплаты — отказ \`карта использована\`; сумма больше номинала — отказ \`недостаточно средств\` (карта при этом не тратится).

Класс \`Checkout\` владеет способами оплаты в \`std::map<std::string, std::unique_ptr<PaymentMethod>>\` и ничего не знает о конкретных классах. Ввод: \`card id\`, \`wallet id balance\`, \`gift id balance\`, \`pay id amount\`. На каждый \`pay\` напечатайте \`оплата id: сумма, комиссия F\` или \`отказ id: причина\` (для неизвестного id причина — \`нет такого способа\`). В конце — \`принято S, комиссий F\`.`,
      constraints: ['Строк не больше 100; id уникальны; суммы и остатки от 1 до 10⁹.'],
      hints: [
        'Ни одна реализация не бросает исключений: все отказы — через std::unexpected. Это часть договора интерфейса, и каждый наследник обязан его соблюдать.',
        'Checkout::pay: найти id в map; auto result = it->second->charge(amount); if (result) { … *result … } else { … result.error() … }.',
      ],
      solution: String.raw`
#include <expected>
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

class PaymentMethod {
public:
    virtual ~PaymentMethod() = default;
    virtual std::expected<long long, std::string> charge(long long amount) = 0;
};

class Card final : public PaymentMethod {
public:
    std::expected<long long, std::string> charge(long long amount) override {
        return amount / 50;
    }
};

class Wallet final : public PaymentMethod {
public:
    explicit Wallet(long long balance) : balance_(balance) {}
    std::expected<long long, std::string> charge(long long amount) override {
        if (amount > balance_) {
            return std::unexpected("недостаточно средств");
        }
        balance_ -= amount;
        return 0;
    }

private:
    long long balance_;
};

class GiftCard final : public PaymentMethod {
public:
    explicit GiftCard(long long balance) : balance_(balance) {}
    std::expected<long long, std::string> charge(long long amount) override {
        if (used_) {
            return std::unexpected("карта использована");
        }
        if (amount > balance_) {
            return std::unexpected("недостаточно средств");
        }
        used_ = true;
        return 0;
    }

private:
    long long balance_;
    bool used_ = false;
};

class Checkout {
public:
    void add(const std::string &id, std::unique_ptr<PaymentMethod> method) {
        methods_.emplace(id, std::move(method));
    }

    void pay(const std::string &id, long long amount) {
        const auto it = methods_.find(id);
        if (it == methods_.end()) {
            std::println("отказ {}: нет такого способа", id);
            return;
        }
        const auto result = it->second->charge(amount);
        if (result) {
            accepted_ += amount;
            fees_ += *result;
            std::println("оплата {}: {}, комиссия {}", id, amount, *result);
        } else {
            std::println("отказ {}: {}", id, result.error());
        }
    }

    void summary() const {
        std::println("принято {}, комиссий {}", accepted_, fees_);
    }

private:
    std::map<std::string, std::unique_ptr<PaymentMethod>> methods_;
    long long accepted_ = 0;
    long long fees_ = 0;
};

int main() {
    Checkout checkout;
    std::string command, id;
    while (std::cin >> command >> id) {
        if (command == "card") {
            checkout.add(id, std::make_unique<Card>());
        } else if (command == "wallet" || command == "gift") {
            long long balance;
            std::cin >> balance;
            if (command == "wallet") {
                checkout.add(id, std::make_unique<Wallet>(balance));
            } else {
                checkout.add(id, std::make_unique<GiftCard>(balance));
            }
        } else {
            long long amount;
            std::cin >> amount;
            checkout.pay(id, amount);
        }
    }
    checkout.summary();
    return 0;
}`,
      explanation: `
В решении работают все пять принципов. \`Checkout\` отвечает только за проведение оплат и учёт (S). Новый способ оплаты — новый наследник без правки \`Checkout\` (O). Каждый наследник соблюдает договор: не бросает исключений и сообщает отказ через \`std::expected\`, поэтому \`Checkout\` одинаково обрабатывает любой способ (L). Интерфейс состоит из одного метода (I), а \`Checkout\` зависит от него, а не от \`Card\` или \`Wallet\` (D).

Конкретные классы упоминаются только в \`main\` — в месте сборки программы. Если бы \`GiftCard\` бросала исключение вместо \`std::unexpected\`, она нарушила бы договор интерфейса, и \`Checkout\` пришлось бы знать о её особенностях.`,
      examples: [
        {
          in: 'card c1\nwallet w1 500\ngift g1 300\npay c1 1000\npay w1 600\npay w1 400\npay g1 100\npay g1 100\npay x 5\n',
          out: 'оплата c1: 1000, комиссия 20\nотказ w1: недостаточно средств\nоплата w1: 400, комиссия 0\nоплата g1: 100, комиссия 0\nотказ g1: карта использована\nотказ x: нет такого способа\nпринято 1500, комиссий 20\n',
        },
        { in: '', out: 'принято 0, комиссий 0\n' },
      ],
      hidden: [
        { in: 'card a\npay a 49\n', name: 'Комиссия округляется вниз' },
        { in: 'wallet w 100\npay w 100\npay w 1\n', name: 'Кошелёк до нуля' },
        { in: 'gift g 50\npay g 60\npay g 50\npay g 1\n', name: 'Подарочная карта после отказа' },
        { in: 'pay none 10\n', name: 'Нет способов' },
        { in: 'card c\npay c 1000000000\npay c 1000000000\n', name: 'Большие суммы' },
        {
          in: 'wallet w 10\npay w 3\npay w 3\npay w 3\npay w 3\n',
          name: 'Несколько оплат кошельком',
        },
        { in: 'card b\nwallet a 5\npay a 5\npay b 50\n', name: 'Два способа' },
        { in: 'gift g 1\npay g 1\n', name: 'Минимальная подарочная' },
      ],
    },
  ],
};
