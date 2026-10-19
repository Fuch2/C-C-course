const NOTIFY = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Channel {
public:
    ${fixed ? 'virtual ' : ''}std::string format(const std::string &text) const {
        return text;
    }
};

class Sms : public Channel {
public:
    std::string format(const std::string &text) const${fixed ? ' override' : ''} {
        return "SMS: " + text.substr(0, 20);
    }
};

class Email : public Channel {
public:
    std::string format(const std::string &text) const${fixed ? ' override' : ''} {
        return "Тема: уведомление | " + text;
    }
};

void send(const Channel &channel, const std::string &text) {
    std::println("{}", channel.format(text));
}

int main() {
    Sms sms;
    Email email;
    Channel plain;
    std::string kind, text;
    while (std::cin >> kind >> text) {
        if (kind == "sms") {
            send(sms, text);
        } else if (kind == "email") {
            send(email, text);
        } else {
            send(plain, text);
        }
    }
    return 0;
}`;

export default {
  id: 'oop-virtual',
  title: 'virtual: поведение настоящего объекта',
  description:
    'Статический и динамический тип; virtual и выбор метода по настоящему объекту; переопределение и полиморфизм; почему выбор работает только через ссылку или указатель; набор разных объектов в одном векторе указателей; таблица виртуальных функций и цена вызова; виртуальные вызовы в конструкторе и деструкторе базы.',
  moduleId: 'cpp-oop',
  order: 16,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-protected'],
  objectives: [
    'Объявлять виртуальные функции и переопределять их в наследниках',
    'Отличать статический тип от динамического',
    'Обрабатывать разные объекты одним кодом через ссылку или указатель на базу',
    'Объяснять устройство и цену виртуального вызова',
  ],
  tags: ['C++23', 'ООП', 'virtual', 'Полиморфизм'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct A {
    virtual int f() const { return 1; }
    int g() const { return 10; }
};

struct B : A {
    int f() const override { return 2; }
    int g() const { return 20; }
};

int main() {
    B b;
    const A &a = b;
    std::println("{} {}", a.f(), a.g());
    return 0;
}`,
      lang: 'cpp',
      answers: ['2 10'],
      placeholder: 'Вывод программы',
      explain: 'f виртуальная — выбирается по объекту (B). g не виртуальная — по типу ссылки (A).',
    },
    {
      q: 'Что такое динамический тип?',
      options: [
        'Тип настоящего объекта, на который указывает ссылка или указатель во время работы',
        'Тип, записанный в объявлении переменной',
        'Тип, выведенный через auto',
        'Тип объекта в куче',
      ],
      correct: 0,
      explain:
        'Статический тип — в коде, динамический — у объекта. virtual выбирает по динамическому.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Animal {
    virtual const char *sound() const { return "?"; }
};

struct Dog : Animal {
    const char *sound() const override { return "гав"; }
};

void by_value(Animal a) { std::print("{} ", a.sound()); }
void by_ref(const Animal &a) { std::print("{} ", a.sound()); }

int main() {
    Dog d;
    by_value(d);
    by_ref(d);
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['? гав'],
      placeholder: 'Вывод программы',
      explain: 'По значению передаётся копия базовой части (срезка), по ссылке — сам объект.',
    },
    {
      q: 'Почему функция с параметром const Shape & работает с фигурами, которых не существовало, когда её писали?',
      options: [
        'Новые наследники переопределяют виртуальные методы, и вызов через ссылку выберет их версии',
        'Компилятор перекомпилирует функцию для каждого нового класса',
        'Функция проверяет тип через if',
        'Не работает: нужно дописывать функцию',
      ],
      correct: 0,
      explain:
        'В этом смысл полиморфизма: код, написанный для интерфейса, принимает любые реализации.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Base {
    Base() { std::print("{} ", name()); }
    virtual const char *name() const { return "Base"; }
};

struct Derived : Base {
    const char *name() const override { return "Derived"; }
};

int main() {
    Derived d;
    std::println("{}", d.name());
    return 0;
}`,
      lang: 'cpp',
      answers: ['Base Derived'],
      placeholder: 'Вывод программы',
      explain: 'В конструкторе базы наследник ещё не создан, поэтому вызывается версия базы.',
    },
    {
      q: 'Как обычно реализуют виртуальные функции компиляторы?',
      options: [
        'Таблица адресов функций у класса и скрытый указатель на неё в каждом объекте',
        'Цепочка if по имени класса',
        'Поиск функции по имени во время выполнения',
        'Копирование функции в каждый объект',
      ],
      correct: 0,
      explain:
        'Поэтому объект с виртуальными методами больше на размер указателя, а вызов — косвенный.',
    },
    {
      q: 'Наследник объявил double area() (без const), а в базе virtual double area() const. Что произойдёт?',
      options: [
        'Это другая функция: она не переопределяет базовую, и через ссылку на базу вызовется базовая версия',
        'Функция переопределит базовую',
        'Ошибка компиляции без override',
        'Обе функции объединятся',
      ],
      correct: 0,
      explain:
        'Сигнатура, включая const, должна совпадать. С override такая ошибка становится ошибкой компиляции.',
    },
    {
      q: 'Сколько байт добавляет к объекту появление в классе первой виртуальной функции на 64-битной системе?',
      answers: ['8'],
      placeholder: 'Число',
      explain: 'Скрытый указатель на таблицу виртуальных функций.',
    },
    {
      q: 'Через какие выражения работает выбор виртуального метода по объекту? Выберите все.',
      options: [
        'ссылка на базу: ref.f()',
        'указатель на базу: ptr->f()',
        'объект базового типа: copy.f()',
        'объект наследника: derived.f()',
      ],
      correct: [0, 1, 3],
      explain:
        'У объекта базового типа динамический тип совпадает со статическим — это всегда база. У объекта наследника — наследник.',
    },
  ],
  exercises: [
    {
      id: 'oop-virtual-exercise',
      title: 'Фигуры',
      difficulty: 'beginner',
      description: `
Опишите базовый класс \`Shape\` с виртуальными методами \`area()\` и \`name()\` и наследников \`Rect\` (\`rect w h\`), \`Circle\` (\`circle r\`) и \`Triangle\` (\`tri a b c\`, площадь по формуле Герона). Напишите **одну** функцию \`double report(const Shape &s)\`, которая печатает \`имя: площадь\` с двумя знаками и возвращает площадь. Для каждой строки ввода вызовите \`report\`, а в конце напечатайте \`всего: S\` с двумя знаками.

Имена: \`прямоугольник\`, \`круг\`, \`треугольник\`.`,
      constraints: ['Строк не больше 30; размеры от 0.1 до 1000; треугольники существуют.'],
      hints: [
        'Формула Герона: p = (a + b + c) / 2, S = √(p(p − a)(p − b)(p − c)). π — std::numbers::pi из <numbers>.',
        'Внутри report оба вызова — s.name() и s.area() — виртуальные: функция знает только интерфейс Shape.',
      ],
      solution: String.raw`
#include <cmath>
#include <iostream>
#include <numbers>
#include <print>
#include <string>

class Shape {
public:
    virtual double area() const {
        return 0;
    }

    virtual const char *name() const {
        return "фигура";
    }
};

class Rect : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}

    double area() const override {
        return w_ * h_;
    }

    const char *name() const override {
        return "прямоугольник";
    }

private:
    double w_;
    double h_;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}

    double area() const override {
        return std::numbers::pi * r_ * r_;
    }

    const char *name() const override {
        return "круг";
    }

private:
    double r_;
};

class Triangle : public Shape {
public:
    Triangle(double a, double b, double c) : a_(a), b_(b), c_(c) {}

    double area() const override {
        double p = (a_ + b_ + c_) / 2;
        return std::sqrt(p * (p - a_) * (p - b_) * (p - c_));
    }

    const char *name() const override {
        return "треугольник";
    }

private:
    double a_;
    double b_;
    double c_;
};

double report(const Shape &s) {
    std::println("{}: {:.2f}", s.name(), s.area());
    return s.area();
}

int main() {
    std::string kind;
    double total = 0;
    while (std::cin >> kind) {
        if (kind == "rect") {
            double w, h;
            std::cin >> w >> h;
            total += report(Rect(w, h));
        } else if (kind == "circle") {
            double r;
            std::cin >> r;
            total += report(Circle(r));
        } else {
            double a, b, c;
            std::cin >> a >> b >> c;
            total += report(Triangle(a, b, c));
        }
    }
    std::println("всего: {:.2f}", total);
    return 0;
}`,
      explanation: `
\`report\` знает только интерфейс \`Shape\`, но печатает правильные имена и площади: виртуальные вызовы выбирают версии настоящих объектов. Добавить шестиугольник — значит написать один новый класс; \`report\` не изменится.

Временный объект \`Rect(w, h)\` живёт до конца строки, поэтому передавать его по константной ссылке безопасно.`,
      examples: [
        {
          in: 'rect 3 4\ncircle 1\ntri 3 4 5\n',
          out: 'прямоугольник: 12.00\nкруг: 3.14\nтреугольник: 6.00\nвсего: 21.14\n',
        },
        { in: '', out: 'всего: 0.00\n' },
      ],
      hidden: [
        { in: 'circle 1000\n', name: 'Большой круг' },
        { in: 'rect 0.1 0.1\n', name: 'Маленький прямоугольник' },
        { in: 'tri 1 1 1\n', name: 'Равносторонний' },
        { in: 'tri 5 5 8\n', name: 'Равнобедренный' },
        { in: 'circle 2\ncircle 3\n', name: 'Два круга' },
        { in: 'rect 10 20\ntri 6 8 10\ncircle 0.5\n', name: 'Смесь' },
        { in: 'rect 1000 1000\n', name: 'Большой квадрат' },
        { in: 'tri 7 8 9\n', name: 'Произвольный треугольник' },
      ],
    },
    {
      title: 'Оплата труда',
      description: `
Опишите базовый класс \`Employee\` (имя) с виртуальным методом \`long long pay() const\` и наследников:

- \`Hourly\` — ставка за час и часы; часы сверх 160 оплачиваются в полуторном размере (\`ставка · 3 / 2\` за час, целочисленно);
- \`Salaried\` — фиксированный оклад;
- \`Commission\` — оклад плюс процент от продаж (\`продажи · процент / 100\`, целочисленно).

Строки ввода: \`hourly имя ставка часы\`, \`salary имя оклад\`, \`comm имя оклад продажи процент\`. Соберите **всех** сотрудников в один \`std::vector<const Employee *>\` и одним циклом напечатайте \`имя: выплата\` в порядке ввода, затем \`фонд S\`.`,
      constraints: ['Сотрудников не больше 30; числа до 10⁷, часы до 300, процент до 50.'],
      hints: [
        'Объекты разных типов храните в трёх векторах с заранее зарезервированной ёмкостью (reserve) — тогда указатели на элементы не испортятся при добавлении.',
        'Порядок ввода сохраняет вектор указателей: после создания объекта кладите в него &vector.back().',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Employee {
public:
    explicit Employee(std::string name) : name_(std::move(name)) {}

    virtual ~Employee() = default;

    const std::string &name() const {
        return name_;
    }

    virtual long long pay() const {
        return 0;
    }

private:
    std::string name_;
};

class Hourly : public Employee {
public:
    Hourly(std::string name, long long rate, int hours) : Employee(std::move(name)), rate_(rate), hours_(hours) {}

    long long pay() const override {
        int regular = hours_ < 160 ? hours_ : 160;
        int extra = hours_ - regular;
        return rate_ * regular + rate_ * 3 / 2 * extra;
    }

private:
    long long rate_;
    int hours_;
};

class Salaried : public Employee {
public:
    Salaried(std::string name, long long salary) : Employee(std::move(name)), salary_(salary) {}

    long long pay() const override {
        return salary_;
    }

private:
    long long salary_;
};

class Commission : public Employee {
public:
    Commission(std::string name, long long base, long long sales, int percent)
        : Employee(std::move(name)), base_(base), sales_(sales), percent_(percent) {}

    long long pay() const override {
        return base_ + sales_ * percent_ / 100;
    }

private:
    long long base_;
    long long sales_;
    int percent_;
};

int main() {
    std::vector<Hourly> hourly;
    std::vector<Salaried> salaried;
    std::vector<Commission> commission;
    hourly.reserve(30);
    salaried.reserve(30);
    commission.reserve(30);
    std::vector<const Employee *> staff;
    std::string kind, name;
    while (std::cin >> kind >> name) {
        if (kind == "hourly") {
            long long rate;
            int hours;
            std::cin >> rate >> hours;
            hourly.emplace_back(name, rate, hours);
            staff.push_back(&hourly.back());
        } else if (kind == "salary") {
            long long salary;
            std::cin >> salary;
            salaried.emplace_back(name, salary);
            staff.push_back(&salaried.back());
        } else {
            long long base, sales;
            int percent;
            std::cin >> base >> sales >> percent;
            commission.emplace_back(name, base, sales, percent);
            staff.push_back(&commission.back());
        }
    }
    long long fund = 0;
    for (const Employee *e : staff) {
        std::println("{}: {}", e->name(), e->pay());
        fund += e->pay();
    }
    std::println("фонд {}", fund);
    return 0;
}`,
      explanation: `
Цикл по \`staff\` не знает, кто перед ним: каждый сотрудник сам считает свою выплату. Правила оплаты живут в своих классах, и новая схема оплаты — это новый класс, а не новая ветка в цикле.

Объекты лежат в трёх векторах, которыми владеет \`main\`, а \`staff\` лишь указывает на них. \`reserve(30)\` гарантирует, что векторы не будут перевыделять память при добавлении — иначе указатели в \`staff\` повисли бы. В уроке о виртуальном деструкторе вы научитесь хранить полиморфные объекты в одном владеющем контейнере, без этой хитрости.

Строка \`virtual ~Employee() = default;\` делает деструктор виртуальным. Здесь объекты удаляются по своему настоящему типу, но у класса с виртуальными методами деструктор принято делать виртуальным всегда — Clang иначе предупреждает (\`-Wdelete-non-abstract-non-virtual-dtor\`). Зачем это нужно, разобрано в уроке о виртуальном деструкторе.`,
      examples: [
        {
          in: 'hourly Ада 500 170\nsalary Алан 90000\ncomm Грейс 30000 200000 10\n',
          out: 'Ада: 87500\nАлан: 90000\nГрейс: 50000\nфонд 227500\n',
        },
        { in: '', out: 'фонд 0\n' },
      ],
      hidden: [
        { in: 'hourly a 100 160\n', name: 'Ровно 160 часов' },
        { in: 'hourly a 101 161\n', name: 'Нечётная ставка сверхурочно' },
        { in: 'hourly a 1000 0\n', name: 'Ноль часов' },
        { in: 'comm b 0 10000000 50\n', name: 'Только процент' },
        { in: 'salary c 10000000\nsalary d 1\n', name: 'Оклады' },
        { in: 'hourly a 10 300\ncomm b 1 99 1\n', name: 'Округление процента' },
        { in: 'comm x 5 5 0\nhourly y 3 200\nsalary z 7\n', name: 'Все виды' },
        { in: 'salary Иван 75000\nhourly Пётр 450 168\n', name: 'Кириллица' },
      ],
    },
    {
      title: 'Найди ошибку: всегда базовая версия',
      bug: true,
      description: `
Программа отправляет уведомления через разные каналы. Базовый класс \`Channel\` оставляет текст как есть, \`Sms\` обрезает его до 20 символов и добавляет \`SMS: \`, \`Email\` добавляет тему. Функция \`send(const Channel &, text)\` печатает отформатированное сообщение. Строки ввода: канал (\`sms\`, \`email\` или \`plain\`) и текст (одно слово).

Все сообщения печатаются без оформления. Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 20; слова латиницей до 50 символов.'],
      hints: [
        'Какой метод format выбирает вызов channel.format(text) внутри send, если channel — ссылка на Channel?',
        'В базе не хватает virtual. Добавьте его и пометьте методы наследников override — тогда компилятор проверит, что они действительно переопределяют базовый.',
      ],
      starter: NOTIFY(false),
      solution: NOTIFY(true),
      explanation: `
Без \`virtual\` метод выбирается по статическому типу: внутри \`send\` это \`const Channel &\`, поэтому всегда вызывается \`Channel::format\` — какой бы канал ни передали. Наследники объявили свои версии, но они лишь **скрывают** базовую при вызове через объект наследника и не участвуют в вызове через базу.

\`virtual\` в базе включает выбор по настоящему объекту. \`override\` в наследниках — страховка: если бы сигнатура не совпала (например, без \`const\`), компилятор сообщил бы об ошибке, а не тихо оставил бы базовую версию.`,
      examples: [
        {
          in: 'sms Привет\nemail Отчёт\nplain текст\n',
          out: 'SMS: Привет\nТема: уведомление | Отчёт\nтекст\n',
        },
        { in: 'sms abcdefghijklmnopqrstuvwxyz\n', out: 'SMS: abcdefghijklmnopqrst\n' },
      ],
      hidden: [
        'sms a\n',
        'email b\n',
        'plain c\n',
        'sms 12345678901234567890X\n',
        'email x\nsms y\n',
        'sms hello\nplain hello\nemail hello\n',
        'email Release\n',
        'sms short\n',
      ],
    },
    {
      title: 'Скидки',
      difficulty: 'advanced',
      description: `
Базовый класс \`Discount\` с виртуальным методом \`long long apply(long long price) const\` и три правила:

- \`percent p\` — скидка \`p\` процентов: \`price − price · p / 100\` (целочисленно);
- \`fixed a\` — минус \`a\`, но цена не ниже нуля;
- \`threshold t a\` — минус \`a\`, если цена не меньше \`t\` (иначе без изменений).

Первая строка — число правил \`k\`, затем \`k\` строк с правилами. Затем цены (в копейках). Каждая цена проходит через **все** правила по порядку — одним циклом по \`std::vector<const Discount *>\`. Напечатайте \`цена -> итог\`.`,
      constraints: ['k до 10; цен до 30; числа до 10⁹, проценты до 100.'],
      hints: [
        'Правила разных видов — в трёх векторах с reserve(k), указатели — в одном векторе в порядке ввода.',
        'Цикл: long long result = price; for (const Discount *d : rules) result = d->apply(result);',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Discount {
public:
    virtual ~Discount() = default;

    virtual long long apply(long long price) const {
        return price;
    }
};

class Percent : public Discount {
public:
    explicit Percent(long long p) : p_(p) {}

    long long apply(long long price) const override {
        return price - price * p_ / 100;
    }

private:
    long long p_;
};

class Fixed : public Discount {
public:
    explicit Fixed(long long amount) : amount_(amount) {}

    long long apply(long long price) const override {
        return price > amount_ ? price - amount_ : 0;
    }

private:
    long long amount_;
};

class Threshold : public Discount {
public:
    Threshold(long long limit, long long amount) : limit_(limit), amount_(amount) {}

    long long apply(long long price) const override {
        return price >= limit_ ? price - amount_ : price;
    }

private:
    long long limit_;
    long long amount_;
};

int main() {
    int k;
    std::cin >> k;
    std::vector<Percent> percents;
    std::vector<Fixed> fixeds;
    std::vector<Threshold> thresholds;
    percents.reserve(static_cast<std::size_t>(k));
    fixeds.reserve(static_cast<std::size_t>(k));
    thresholds.reserve(static_cast<std::size_t>(k));
    std::vector<const Discount *> rules;
    for (int i = 0; i < k; i++) {
        std::string kind;
        std::cin >> kind;
        if (kind == "percent") {
            long long p;
            std::cin >> p;
            percents.emplace_back(p);
            rules.push_back(&percents.back());
        } else if (kind == "fixed") {
            long long a;
            std::cin >> a;
            fixeds.emplace_back(a);
            rules.push_back(&fixeds.back());
        } else {
            long long t, a;
            std::cin >> t >> a;
            thresholds.emplace_back(t, a);
            rules.push_back(&thresholds.back());
        }
    }
    long long price;
    while (std::cin >> price) {
        long long result = price;
        for (const Discount *d : rules) {
            result = d->apply(result);
        }
        std::println("{} -> {}", price, result);
    }
    return 0;
}`,
      explanation: `
Правила — объекты разных классов, а цикл применения один: \`d->apply(result)\` выбирает версию каждого правила по настоящему объекту. Новое правило («каждая третья покупка бесплатно», «скидка по карте») добавляется новым классом без правок цикла.

Порядок правил важен: скидка в процентах до фиксированной и после неё даёт разные цены, поэтому вектор указателей хранит порядок ввода. Объекты живут в векторах с зарезервированной ёмкостью — указатели на их элементы остаются действительными. Деструктор \`Discount\` виртуальный по тому же правилу, что и в задаче об оплате труда.`,
      examples: [
        { in: '2\npercent 10\nfixed 500\n10000\n300\n', out: '10000 -> 8500\n300 -> 0\n' },
        { in: '1\nthreshold 5000 1000\n4999\n5000\n', out: '4999 -> 4999\n5000 -> 4000\n' },
      ],
      hidden: [
        { in: '0\n100\n', name: 'Без правил' },
        { in: '1\npercent 100\n12345\n', name: 'Сто процентов' },
        { in: '2\nfixed 500\npercent 10\n10000\n', name: 'Другой порядок' },
        { in: '3\npercent 50\npercent 50\nfixed 1\n1000\n', name: 'Два процента' },
        { in: '1\nfixed 1000000000\n999999999\n', name: 'Обнуление' },
        { in: '2\nthreshold 100 50\nthreshold 100 50\n149\n150\n', name: 'Два порога' },
        { in: '1\npercent 33\n100\n1\n', name: 'Округление' },
        {
          in: '3\nthreshold 1000 100\npercent 20\nfixed 30\n1000000000\n999\n',
          name: 'Все правила',
        },
      ],
    },
  ],
};
