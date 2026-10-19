const SHOP = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Item {
public:
    virtual ~Item() = default;

    long long final_price() const {
        return price_ - price_ * discount_percent() / 100;
    }

    const std::string &name() const {
        return name_;
    }

protected:
    Item(std::string name, long long price) : name_(std::move(name)), price_(price) {}

private:
    virtual long long discount_percent() const = 0;

    std::string name_;
    long long price_;
};

class Regular : public Item {
public:
    Regular(std::string name, long long price) : Item(std::move(name), price) {}

private:
    long long discount_percent() const override {
        return 0;
    }
};

class Sale : public Item {
public:
    Sale(std::string name, long long price) : Item(std::move(name), price) {}

private:
    long long discount_percent() ${fixed ? 'const override ' : ''}{
        return 30;
    }
};

void show(const Item &item) {
    std::println("{}: {}", item.name(), item.final_price());
}

int main() {
    std::string kind, name;
    long long price;
    while (std::cin >> kind >> name >> price) {
        if (kind == "sale") {
            show(Sale(name, price));
        } else {
            show(Regular(name, price));
        }
    }
    return 0;
}`;

export default {
  id: 'oop-abstract-classes',
  title: 'Абстрактный класс: общий договор и общее состояние',
  description:
    'Абстрактный класс с общими полями, реализованными методами и чисто виртуальными шагами; защищённый конструктор; что выносить в базу, что делать чисто виртуальным, когда уместна реализация по умолчанию; абстрактный класс и интерфейс — сочетание договора для клиентов и общей реализации для наследников.',
  moduleId: 'cpp-oop',
  order: 20,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-pure-virtual'],
  objectives: [
    'Выносить общее состояние и поведение в абстрактный класс',
    'Решать, что сделать чисто виртуальным, а что реализовать в базе',
    'Сочетать интерфейс и абстрактный класс',
  ],
  tags: ['C++23', 'ООП', 'Абстрактный класс', 'NVI'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Counter {
public:
    virtual ~Counter() = default;
    void add(int n) { total_ += n * weight(); }
    int total() const { return total_; }

private:
    virtual int weight() const = 0;
    int total_ = 0;
};

class Double : public Counter {
    int weight() const override { return 2; }
};

int main() {
    Double d;
    d.add(3);
    d.add(4);
    std::println("{}", d.total());
    return 0;
}`,
      lang: 'cpp',
      answers: ['14'],
      placeholder: 'Вывод программы',
      explain:
        'Общий метод add в базе вызывает закрытый чисто виртуальный шаг weight: (3 + 4) · 2.',
    },
    {
      q: 'Что может содержать абстрактный класс? Выберите все.',
      options: [
        'Закрытые поля',
        'Реализованные методы',
        'Чисто виртуальные функции',
        'Объекты самого себя по значению',
      ],
      correct: [0, 1, 2],
      explain: 'Абстрактность означает лишь наличие хотя бы одной чисто виртуальной функции.',
    },
    {
      q: 'Зачем делать конструктор абстрактного класса защищённым?',
      options: [
        'Он нужен только наследникам, и protected сообщает этот замысел',
        'Иначе абстрактный класс можно будет создать',
        'Без этого наследник не сможет его вызвать',
        'Так быстрее',
      ],
      correct: 0,
      explain: 'Объект абстрактного класса и так создать нельзя; protected делает намерение явным.',
    },
    {
      q: 'У всех наследников есть операция, но устроена по-разному. Как её объявить в базе?',
      options: [
        'Чисто виртуальной функцией',
        'Обычным методом базы',
        'Полем',
        'Только в наследниках',
      ],
      correct: 0,
      explain: 'Общее и одинаковое — метод базы; общее, но разное — чисто виртуальная функция.',
    },
    {
      q: 'Когда уместна виртуальная функция с реализацией по умолчанию, а не = 0?',
      options: [
        'Когда реализация по умолчанию верна почти для всех наследников',
        'Всегда: это удобнее',
        'Никогда',
        'Когда у класса нет полей',
      ],
      correct: 0,
      explain:
        'Иначе наследник, забывший переопределение, будет вести себя неверно без единого предупреждения.',
    },
    {
      q: 'Наследник объявил int defense() без const, а в базе private: virtual int defense() const = 0. Что произойдёт при создании объекта наследника?',
      options: [
        'Ошибка компиляции: наследник остался абстрактным',
        'Будет вызвана функция наследника',
        'Будет вызвана функция базы',
        'Неопределённое поведение',
      ],
      correct: 0,
      explain:
        'Функция без const — другая функция; чисто виртуальная осталась без реализации. override указал бы на ошибку сразу.',
    },
    {
      q: 'Чем чистый интерфейс отличается от абстрактного класса с полями?',
      options: [
        'Интерфейс ничего не навязывает наследникам — ни полей, ни конструктора, и класс может реализовать несколько интерфейсов',
        'Интерфейс можно создать как объект',
        'В интерфейсе нельзя объявлять функции',
        'Ничем',
      ],
      correct: 0,
      explain: 'Абстрактный класс экономит код, но связывает наследников общим состоянием.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Payable {
    virtual ~Payable() = default;
    virtual long long amount() const = 0;
};

struct Bill : Payable {
    long long amount() const final { return base * 12 / 10; }
    long long base = 100;
};

struct Fine : Payable {
    long long amount() const override { return 50; }
};

int main() {
    Bill b;
    Fine f;
    const Payable &x = b, &y = f;
    std::println("{}", x.amount() + y.amount());
    return 0;
}`,
      lang: 'cpp',
      answers: ['170'],
      placeholder: 'Вывод программы',
      explain: 'Счёт с надбавкой 20 % даёт 120, штраф — 50.',
    },
  ],
  exercises: [
    {
      id: 'oop-abstract-classes-exercise',
      title: 'Транспорт',
      difficulty: 'beginner',
      description: `
Опишите абстрактный класс \`Vehicle\` с закрытыми полями «название» и «скорость» (км/ч), защищённым конструктором, реализованным методом \`double hours(double km) const\` (\`км / скорость\`) и чисто виртуальным \`long long cost(double km) const\`. Наследники:

| Вид     | Название    | Скорость | Стоимость                  |
| ------- | ----------- | -------- | -------------------------- |
| \`Car\`   | \`машина\`    | 90       | 8 руб. за км (с округлением вниз) |
| \`Train\` | \`поезд\`     | 120      | 300 руб. + 2 руб. за км (вниз) |
| \`Bike\`  | \`велосипед\` | 15       | 0                          |

Для каждого расстояния из ввода напечатайте строку \`D км\`, а под ней для каждого вида \`  название: T ч, C руб.\` (часы — с двумя знаками).`,
      constraints: ['Расстояний не больше 20, от 0 до 10 000 км (целые).'],
      hints: [
        'Базовый класс хранит name_ и speed_; метод hours одинаков для всех и реализован в базе.',
        'Стоимость: static_cast<long long>(8 * km) — отбрасывание дробной части. Все три объекта можно создать один раз и обходить через const Vehicle *.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Vehicle {
public:
    virtual ~Vehicle() = default;

    const std::string &name() const {
        return name_;
    }

    double hours(double km) const {
        return km / speed_;
    }

    virtual long long cost(double km) const = 0;

protected:
    Vehicle(std::string name, double speed) : name_(std::move(name)), speed_(speed) {}

private:
    std::string name_;
    double speed_;
};

class Car : public Vehicle {
public:
    Car() : Vehicle("машина", 90) {}

    long long cost(double km) const override {
        return static_cast<long long>(8 * km);
    }
};

class Train : public Vehicle {
public:
    Train() : Vehicle("поезд", 120) {}

    long long cost(double km) const override {
        return 300 + static_cast<long long>(2 * km);
    }
};

class Bike : public Vehicle {
public:
    Bike() : Vehicle("велосипед", 15) {}

    long long cost(double) const override {
        return 0;
    }
};

int main() {
    Car car;
    Train train;
    Bike bike;
    const Vehicle *all[] = {&car, &train, &bike};
    double km;
    while (std::cin >> km) {
        std::println("{} км", km);
        for (const Vehicle *v : all) {
            std::println("  {}: {:.2f} ч, {} руб.", v->name(), v->hours(km), v->cost(km));
        }
    }
    return 0;
}`,
      explanation: `
Название, скорость и расчёт времени общие для всех видов транспорта и одинаково устроены — они в базе. Стоимость устроена по-разному — она чисто виртуальная. Конструктор базы защищённый: наследник обязан передать название и скорость, иначе не скомпилируется.

У \`Bike::cost\` параметр без имени: велосипеду расстояние для стоимости не нужно, а безымянный параметр не вызывает предупреждения о неиспользуемой переменной.`,
      examples: [
        {
          in: '180\n',
          out: '180 км\n  машина: 2.00 ч, 1440 руб.\n  поезд: 1.50 ч, 660 руб.\n  велосипед: 12.00 ч, 0 руб.\n',
        },
        {
          in: '0\n',
          out: '0 км\n  машина: 0.00 ч, 0 руб.\n  поезд: 0.00 ч, 300 руб.\n  велосипед: 0.00 ч, 0 руб.\n',
        },
      ],
      hidden: [
        { in: '1\n', name: 'Один километр' },
        { in: '10000\n', name: 'Десять тысяч' },
        { in: '45\n90\n', name: 'Два расстояния' },
        { in: '15\n', name: 'Час на велосипеде' },
        { in: '7\n', name: 'Дробные часы' },
        { in: '120\n', name: 'Час на поезде' },
        { in: '', name: 'Пусто' },
        { in: '333\n', name: 'Произвольное' },
      ],
    },
    {
      title: 'Персонажи',
      description: `
Абстрактный класс \`Character\` хранит имя и здоровье и реализует общий метод \`take_hit(damage)\`: реальный урон — \`damage − defense()\`, но не меньше 0; здоровье не опускается ниже 0. Защита — закрытая чисто виртуальная функция. Наследники: \`Warrior\` (120 hp, защита 8) и \`Mage\` (70 hp, защита 2).

Команды: \`warrior имя\`, \`mage имя\` — создать персонажа; \`hit имя урон\` — нанести удар (персонажам с 0 hp удары не наносятся); \`status\` — для всех персонажей в порядке создания \`имя: N hp\` и, если 0, \` (выбыл)\`.`,
      constraints: [
        'Персонажей не больше 20, имена уникальны; команд не больше 100; урон от 0 до 1000.',
      ],
      hints: [
        'Объекты храните в векторах Warrior и Mage с reserve(20), указатели в порядке создания — в std::vector<Character *>; поиск по имени — циклом.',
        'take_hit: int real = std::max(0, damage - defense()); hp_ = std::max(0, hp_ - real);',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Character {
public:
    virtual ~Character() = default;

    void take_hit(int damage) {
        int real = std::max(0, damage - defense());
        hp_ = std::max(0, hp_ - real);
    }

    bool alive() const {
        return hp_ > 0;
    }

    const std::string &name() const {
        return name_;
    }

    void status() const {
        std::println("{}: {} hp{}", name_, hp_, alive() ? "" : " (выбыл)");
    }

protected:
    Character(std::string name, int hp) : name_(std::move(name)), hp_(hp) {}

private:
    virtual int defense() const = 0;

    std::string name_;
    int hp_;
};

class Warrior : public Character {
public:
    explicit Warrior(std::string name) : Character(std::move(name), 120) {}

private:
    int defense() const override {
        return 8;
    }
};

class Mage : public Character {
public:
    explicit Mage(std::string name) : Character(std::move(name), 70) {}

private:
    int defense() const override {
        return 2;
    }
};

int main() {
    std::vector<Warrior> warriors;
    std::vector<Mage> mages;
    warriors.reserve(20);
    mages.reserve(20);
    std::vector<Character *> party;
    std::string command;
    while (std::cin >> command) {
        if (command == "status") {
            for (const Character *c : party) {
                c->status();
            }
            continue;
        }
        std::string name;
        std::cin >> name;
        if (command == "warrior") {
            warriors.emplace_back(name);
            party.push_back(&warriors.back());
        } else if (command == "mage") {
            mages.emplace_back(name);
            party.push_back(&mages.back());
        } else {
            int damage;
            std::cin >> damage;
            for (Character *c : party) {
                if (c->name() == name && c->alive()) {
                    c->take_hit(damage);
                }
            }
        }
    }
    return 0;
}`,
      explanation: `
Механика урона — общая и одинаковая, поэтому живёт в базе и не дублируется. Наследник определяет лишь защиту — закрытым переопределением, которое вызывает только база. Добавить разбойника или лучника — значит написать класс из пары строк, а правило урона останется единым.

Конструктор базы защищённый: создать «просто персонажа» нельзя, а наследник обязан передать имя и здоровье.`,
      examples: [
        {
          in: 'warrior Боромир\nmage Гэндальф\nhit Боромир 30\nhit Гэндальф 80\nstatus\n',
          out: 'Боромир: 98 hp\nГэндальф: 0 hp (выбыл)\n',
        },
        { in: 'mage M\nhit M 1\nstatus\n', out: 'M: 70 hp\n' },
      ],
      hidden: [
        { in: 'warrior W\nhit W 8\nstatus\n', name: 'Урон равен защите' },
        { in: 'warrior W\nhit W 1000\nhit W 1000\nstatus\n', name: 'Удар по выбывшему' },
        { in: 'mage A\nmage B\nhit B 20\nstatus\n', name: 'Два мага' },
        { in: 'status\n', name: 'Пустой отряд' },
        { in: 'warrior X\nhit Y 50\nstatus\n', name: 'Нет такого имени' },
        { in: 'mage M\nhit M 72\nstatus\n', name: 'Ровно до нуля' },
        {
          in: 'warrior A\nmage B\nhit A 50\nhit A 50\nhit B 30\nstatus\nhit A 50\nstatus\n',
          name: 'Бой',
        },
        { in: 'warrior W\nhit W 0\nstatus\n', name: 'Нулевой урон' },
      ],
    },
    {
      title: 'Найди ошибку: класс остался абстрактным',
      bug: true,
      description: `
Абстрактный класс \`Item\` вычисляет итоговую цену товара со скидкой, а процент скидки — закрытый чисто виртуальный шаг наследника. Обычный товар (\`Regular\`) идёт без скидки, товар распродажи (\`Sale\`) — со скидкой 30 %. Строки ввода: \`regular имя цена\` или \`sale имя цена\`; программа печатает \`имя: итоговая цена\`.

Программа не компилируется: компилятор жалуется на абстрактный тип. Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 20; цены от 0 до 10⁹.'],
      hints: [
        'Сравните сигнатуру discount_percent в базе и в Sale символ за символом.',
        'В Sale метод объявлен без const, поэтому не реализует чисто виртуальную функцию базы. Добавьте const и override — override сразу укажет на подобную ошибку в будущем.',
      ],
      starter: SHOP(false),
      solution: SHOP(true),
      explanation: `
\`long long discount_percent()\` без \`const\` — **другая** функция: она не переопределяет \`discount_percent() const\` базы, и чисто виртуальная функция в \`Sale\` остаётся без реализации. Значит, \`Sale\` абстрактный, и создать его объект нельзя. Ошибка видна только в месте создания объекта, далеко от причины.

С \`override\` компилятор указал бы прямо на метод: «помечен override, но ничего не переопределяет». Поэтому \`override\` пишут у каждого переопределения — включая закрытые.`,
      examples: [
        { in: 'sale куртка 10000\nregular шапка 1500\n', out: 'куртка: 7000\nшапка: 1500\n' },
        { in: 'sale x 1\n', out: 'x: 1\n' },
      ],
      hidden: [
        'sale a 0\n',
        'sale b 1000000000\n',
        'regular c 99\n',
        'sale d 99\n',
        'sale e 333\nregular f 333\n',
        'sale g 100\n',
        'regular h 0\n',
        'sale i 7\n',
      ],
    },
    {
      title: 'Банковские продукты',
      difficulty: 'advanced',
      description: `
Абстрактный класс \`Product\` хранит название и баланс (в копейках) и реализует общий месячный цикл \`void month_end()\`: прибавляет \`interest()\` и вычитает \`fee()\` — закрытые чисто виртуальные шаги. Наследники:

- \`Deposit\` (\`deposit\`): начисление \`баланс · 8 / 1200\`, комиссия 0;
- \`Credit\` (\`credit\`): баланс отрицательный (долг); начисление \`баланс · 20 / 1200\` (то есть долг растёт), комиссия 10000;
- \`Savings\` (\`savings\`): начисление \`баланс · 5 / 1200\`, комиссия 5000, если баланс меньше 1 000 000, иначе 0.

Все деления — целочисленные, к нулю. Команды: \`new вид название сумма\` (для кредита сумма — размер долга, баланс становится отрицательным), \`month\` — месячный цикл для всех продуктов, \`show\` — \`название: баланс\` в порядке создания.`,
      constraints: ['Продуктов не больше 10; суммы до 10⁹; команд не больше 30.'],
      hints: [
        'month_end(): balance_ += interest(); balance_ -= fee(); — оба шага получают текущий баланс через защищённый метод balance() const.',
        'Комиссия Savings проверяет баланс после начисления процентов — так и получается при порядке «сначала interest, потом fee».',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Product {
public:
    virtual ~Product() = default;

    void month_end() {
        balance_ += interest();
        balance_ -= fee();
    }

    void show() const {
        std::println("{}: {}", name_, balance_);
    }

protected:
    Product(std::string name, long long balance) : name_(std::move(name)), balance_(balance) {}

    long long balance() const {
        return balance_;
    }

private:
    virtual long long interest() const = 0;
    virtual long long fee() const = 0;

    std::string name_;
    long long balance_;
};

class Deposit : public Product {
public:
    Deposit(std::string name, long long balance) : Product(std::move(name), balance) {}

private:
    long long interest() const override {
        return balance() * 8 / 1200;
    }

    long long fee() const override {
        return 0;
    }
};

class Credit : public Product {
public:
    Credit(std::string name, long long debt) : Product(std::move(name), -debt) {}

private:
    long long interest() const override {
        return balance() * 20 / 1200;
    }

    long long fee() const override {
        return 10000;
    }
};

class Savings : public Product {
public:
    Savings(std::string name, long long balance) : Product(std::move(name), balance) {}

private:
    long long interest() const override {
        return balance() * 5 / 1200;
    }

    long long fee() const override {
        return balance() < 1000000 ? 5000 : 0;
    }
};

int main() {
    std::vector<Deposit> deposits;
    std::vector<Credit> credits;
    std::vector<Savings> savings;
    deposits.reserve(10);
    credits.reserve(10);
    savings.reserve(10);
    std::vector<Product *> all;
    std::string command;
    while (std::cin >> command) {
        if (command == "new") {
            std::string kind, name;
            long long amount;
            std::cin >> kind >> name >> amount;
            if (kind == "deposit") {
                deposits.emplace_back(name, amount);
                all.push_back(&deposits.back());
            } else if (kind == "credit") {
                credits.emplace_back(name, amount);
                all.push_back(&credits.back());
            } else {
                savings.emplace_back(name, amount);
                all.push_back(&savings.back());
            }
        } else if (command == "month") {
            for (Product *p : all) {
                p->month_end();
            }
        } else {
            for (const Product *p : all) {
                p->show();
            }
        }
    }
    return 0;
}`,
      explanation: `
Месячный цикл — «начислить, затем списать» — общий для всех продуктов, и порядок шагов задаёт база: наследник не может, например, списать комиссию раньше процентов. Наследники определяют только формулы. Баланс закрыт, а для формул открыт защищённым методом \`balance()\` только для чтения: изменить его наследник может лишь через общий цикл.

Кредит сохраняет общее представление (баланс со знаком), поэтому его конструктор превращает размер долга в отрицательный баланс, а формула начисления та же, что у вклада, — отрицательный баланс просто растёт по модулю.`,
      examples: [
        {
          in: 'new deposit Вклад 1200000\nnew credit Кредит 600000\nmonth\nshow\n',
          out: 'Вклад: 1208000\nКредит: -620000\n',
        },
        { in: 'new savings Копилка 120000\nmonth\nshow\n', out: 'Копилка: 115500\n' },
      ],
      hidden: [
        { in: 'show\n', name: 'Пусто' },
        { in: 'new savings S 1000000\nmonth\nshow\n', name: 'Без комиссии' },
        { in: 'new savings S 995000\nmonth\nshow\n', name: 'Порог после процентов' },
        { in: 'new deposit D 100\nmonth\nshow\n', name: 'Маленький вклад' },
        { in: 'new credit C 0\nmonth\nmonth\nshow\n', name: 'Нулевой долг' },
        { in: 'new deposit D 1000000000\nmonth\nmonth\nmonth\nshow\n', name: 'Три месяца' },
        {
          in: 'new deposit A 1200\nnew savings B 1200\nnew credit C 1200\nmonth\nshow\n',
          name: 'Все виды',
        },
        { in: 'new credit C 1000000\nshow\nmonth\nshow\n', name: 'До и после' },
      ],
    },
  ],
};
