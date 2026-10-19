const TWO_NAMES = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Pet {
public:
    Pet() : name_("без имени") {}
    explicit Pet(std::string name) : name_(std::move(name)) {}

    void greet() const {
        std::println("Привет, {}!", name_);
    }

private:
    std::string name_;
};

class Dog : public Pet {
public:
${
  fixed
    ? '    Dog(std::string name, std::string breed) : Pet(std::move(name)), breed_(std::move(breed)) {}'
    : '    Dog(std::string name, std::string breed) : name_(std::move(name)), breed_(std::move(breed)) {}'
}

    void describe() const {
        greet();
        std::println("Порода: {}", breed_);
    }

private:
${fixed ? '' : '    std::string name_;\n'}    std::string breed_;
};

int main() {
    std::string name, breed;
    while (std::cin >> name >> breed) {
        Dog dog(name, breed);
        dog.describe();
    }
    return 0;
}`;

export default {
  id: 'oop-inheritance',
  title: 'Наследование: базовая часть объекта',
  description:
    'Общее — в базовом классе, добавленное — в производном: class D : public B; базовый подобъект и доступ к закрытым членам базы; порядок конструирования и уничтожения; вызов конструктора базы и наследование конструкторов using B::B; метод с тем же именем скрывает базовый, вызов B::метод(); отношение «является».',
  moduleId: 'cpp-oop',
  order: 13,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-aggregation'],
  objectives: [
    'Выносить общее в базовый класс',
    'Передавать данные конструктору базы и наследовать конструкторы',
    'Предсказывать порядок конструирования и уничтожения',
    'Дополнять поведение базы, вызывая её методы',
  ],
  tags: ['C++23', 'ООП', 'Наследование'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа? Запишите вывод в одну строку через пробел.',
      code: String.raw`
#include <print>

struct A {
    A() { std::print("A "); }
    ~A() { std::print("~A "); }
};

struct B : A {
    B() { std::print("B "); }
    ~B() { std::print("~B "); }
};

int main() {
    {
        B b;
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['A B ~B ~A'],
      placeholder: 'Вывод программы',
      explain: 'Базовая часть создаётся первой и уничтожается последней.',
    },
    {
      q: 'Может ли метод наследника обратиться к закрытому (private) полю базового класса?',
      options: [
        'Нет: закрытые члены базы недоступны и наследнику — он пользуется открытыми методами',
        'Да, наследник видит всё',
        'Только в конструкторе',
        'Только через this',
      ],
      correct: 0,
      explain:
        'Так база охраняет свой инвариант. Для узкого доступа наследникам есть protected — следующие уроки.',
    },
    {
      q: 'Как передать аргументы конструктору базового класса Employee из конструктора Manager?',
      options: [
        'В списке инициализации: Manager(…) : Employee(name, salary), team_(team) {}',
        'Присвоить поля базы в теле конструктора',
        'Вызвать Employee(name, salary); первой строкой тела',
        'Никак: база создаётся без аргументов',
      ],
      correct: 0,
      explain:
        'Базовая часть создаётся раньше тела, поэтому её конструктор вызывают в списке инициализации.',
    },
    {
      q: 'Что делает строка using Message::Message; внутри class Warning : public Message?',
      options: [
        'Наследует конструкторы базы: Warning можно создать с теми же аргументами',
        'Делает Message закрытым',
        'Скрывает конструктор Message',
        'Создаёт поле типа Message',
      ],
      correct: 0,
      explain: 'Удобно, когда наследник не добавляет полей, требующих инициализации.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Base {
    int f() const { return 1; }
};

struct Derived : Base {
    int f() const { return 2 + Base::f(); }
};

int main() {
    Derived d;
    const Base &b = d;
    std::println("{} {}", d.f(), b.f());
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 1'],
      placeholder: 'Вывод программы',
      explain:
        'd.f() вызывает метод наследника, который добавляет к базовому результату 2. Через ссылку на Base вызывается базовая версия: без virtual решает тип в коде.',
    },
    {
      q: 'Какие пары подходят для наследования («является»)? Выберите все.',
      options: ['Manager и Employee', 'Warning и Message', 'Car и Engine', 'Stack и std::vector'],
      correct: [0, 1],
      explain:
        'Машина содержит двигатель (композиция), а стек не является вектором — у него другой интерфейс.',
    },
    {
      q: 'Что произойдёт, если в конструкторе наследника не вызвать конструктор базы, а у базы нет конструктора без параметров?',
      options: [
        'Ошибка компиляции',
        'Поля базы получат нули',
        'Поля базы останутся мусором',
        'Вызовется конструктор копирования',
      ],
      correct: 0,
      explain: 'Компилятор пытается вызвать конструктор базы без аргументов и не находит его.',
    },
    {
      q: 'Наследник объявил своё поле name_, хотя такое же закрытое поле есть в базе, и заполнил его. Что увидит метод базы greet(), печатающий name_?',
      options: [
        'Поле базы — не то, что заполнил наследник',
        'Поле наследника',
        'Ошибку компиляции',
        'Оба значения через пробел',
      ],
      correct: 0,
      explain: 'В объекте два разных поля. Данные для базы передают в её конструктор.',
    },
  ],
  exercises: [
    {
      id: 'oop-inheritance-exercise',
      title: 'Сотрудники',
      difficulty: 'beginner',
      description: `
Опишите класс \`Employee\` (имя, оклад) с методами \`name()\` и \`salary()\` и наследника \`Manager\`, который добавляет размер команды и метод \`total_pay()\` — оклад плюс 5000 за каждого подчинённого. Каждая строка ввода — \`e имя оклад\` (сотрудник) или \`m имя оклад команда\` (руководитель). Напечатайте \`имя: выплата\` (у сотрудника выплата равна окладу), а в конце — \`фонд S\`.`,
      constraints: ['Строк не больше 30; оклады до 10⁷, команда до 100.'],
      hints: [
        'Конструктор Manager: Manager(std::string name, long long salary, int team) : Employee(std::move(name), salary), team_(team) {}.',
        'total_pay использует открытый метод базы salary() — к полю salary_ наследник доступа не имеет.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Employee {
public:
    Employee(std::string name, long long salary) : name_(std::move(name)), salary_(salary) {}

    const std::string &name() const {
        return name_;
    }

    long long salary() const {
        return salary_;
    }

private:
    std::string name_;
    long long salary_;
};

class Manager : public Employee {
public:
    Manager(std::string name, long long salary, int team)
        : Employee(std::move(name), salary), team_(team) {}

    long long total_pay() const {
        return salary() + 5000LL * team_;
    }

private:
    int team_;
};

int main() {
    std::string kind, name;
    long long salary;
    long long fund = 0;
    while (std::cin >> kind >> name >> salary) {
        if (kind == "m") {
            int team;
            std::cin >> team;
            Manager m(name, salary, team);
            std::println("{}: {}", m.name(), m.total_pay());
            fund += m.total_pay();
        } else {
            Employee e(name, salary);
            std::println("{}: {}", e.name(), e.salary());
            fund += e.salary();
        }
    }
    std::println("фонд {}", fund);
    return 0;
}`,
      explanation: `
Имя и оклад описаны один раз — в \`Employee\`. \`Manager\` добавляет только своё: размер команды и формулу выплаты. Методы \`name()\` и \`salary()\` наследник получает готовыми, а закрытые поля базы остаются под её охраной.

Базовая часть инициализируется в списке инициализации конструктора \`Manager\`: она создаётся раньше поля \`team_\`.`,
      examples: [
        { in: 'e Ада 120000\nm Алан 150000 4\n', out: 'Ада: 120000\nАлан: 170000\nфонд 290000\n' },
        { in: '', out: 'фонд 0\n' },
      ],
      hidden: [
        { in: 'm A 0 0\n', name: 'Пустая команда' },
        { in: 'm A 10000000 100\n', name: 'Максимум' },
        { in: 'e a 1\ne b 2\ne c 3\n', name: 'Только сотрудники' },
        { in: 'm a 100 1\nm b 100 2\n', name: 'Только руководители' },
        { in: 'e Иван 50000\nm Ольга 90000 10\ne Пётр 55000\n', name: 'Отдел' },
        { in: 'e x 0\n', name: 'Нулевой оклад' },
        { in: 'm boss 1 99\n', name: 'Большая команда' },
        { in: 'e a 7\nm b 8 1\ne c 9\nm d 10 2\n', name: 'Вперемешку' },
      ],
    },
    {
      title: 'Устройства',
      description: `
Опишите базовый класс \`Device\` (название, мощность в ваттах) с методом \`double energy(double hours) const\` — потребление в кВт·ч (\`мощность · часы / 1000\`) и двух наследников:

- \`Lamp\` — с яркостью в процентах: потребление умножается на \`яркость / 100\`;
- \`Heater\` — с долей времени работы термостата в процентах: так же умножается на \`доля / 100\`.

Наследники вычисляют потребление через базовый метод (\`Device::energy\`). Каждая строка ввода — \`lamp имя ватты яркость часы\` или \`heater имя ватты доля часы\`. Напечатайте \`имя: X кВт·ч\` с двумя знаками и в конце \`всего Y кВт·ч\`.`,
      constraints: ['Строк не больше 30; мощность до 5000, проценты от 0 до 100, часы до 744.'],
      hints: [
        'double Lamp::energy(double hours) const { return Device::energy(hours) * brightness_ / 100.0; }',
        'Используйте using Device::Device не получится — у наследников есть своё поле. Пишите конструктор: Lamp(std::string name, int watts, int brightness) : Device(std::move(name), watts), brightness_(brightness) {}.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Device {
public:
    Device(std::string name, int watts) : name_(std::move(name)), watts_(watts) {}

    const std::string &name() const {
        return name_;
    }

    double energy(double hours) const {
        return watts_ * hours / 1000;
    }

private:
    std::string name_;
    int watts_;
};

class Lamp : public Device {
public:
    Lamp(std::string name, int watts, int brightness) : Device(std::move(name), watts), brightness_(brightness) {}

    double energy(double hours) const {
        return Device::energy(hours) * brightness_ / 100.0;
    }

private:
    int brightness_;
};

class Heater : public Device {
public:
    Heater(std::string name, int watts, int duty) : Device(std::move(name), watts), duty_(duty) {}

    double energy(double hours) const {
        return Device::energy(hours) * duty_ / 100.0;
    }

private:
    int duty_;
};

int main() {
    std::string kind, name;
    int watts, percent;
    double hours;
    double total = 0;
    while (std::cin >> kind >> name >> watts >> percent >> hours) {
        double e = kind == "lamp" ? Lamp(name, watts, percent).energy(hours)
                                  : Heater(name, watts, percent).energy(hours);
        std::println("{}: {:.2f} кВт·ч", name, e);
        total += e;
    }
    std::println("всего {:.2f} кВт·ч", total);
    return 0;
}`,
      explanation: `
Формула «мощность × часы» записана один раз — в \`Device::energy\`. Наследники не повторяют её, а уточняют: вызывают базовую версию явно, через имя класса, и умножают на свой коэффициент. Если когда-нибудь появятся потери в проводке, их добавят в одном месте.

Метод \`energy\` наследника скрывает базовый. Здесь это нормально: объекты используются как \`Lamp\` и \`Heater\`, и версия выбирается по типу в коде. В уроке о \`virtual\` вы увидите, как сложить лампы и обогреватели в один список и считать их потребление одним циклом.`,
      examples: [
        {
          in: 'lamp люстра 100 50 10\nheater печь 2000 25 8\n',
          out: 'люстра: 0.50 кВт·ч\nпечь: 4.00 кВт·ч\nвсего 4.50 кВт·ч\n',
        },
        { in: '', out: 'всего 0.00 кВт·ч\n' },
      ],
      hidden: [
        { in: 'lamp a 60 0 24\n', name: 'Выключенная лампа' },
        { in: 'heater b 5000 100 744\n', name: 'Максимум' },
        { in: 'lamp c 9 100 1\n', name: 'Маленькая лампа' },
        { in: 'heater d 1500 33 2.5\n', name: 'Дробные часы' },
        { in: 'lamp a 40 80 5\nlamp b 40 80 5\n', name: 'Две лампы' },
        { in: 'heater x 1000 50 0\n', name: 'Ноль часов' },
        {
          in: 'lamp ночник 5 10 720\nheater конвектор 1200 40 300\nlamp торшер 60 70 90\n',
          name: 'Квартира',
        },
        { in: 'heater h 1 1 1\n', name: 'Минимум' },
      ],
    },
    {
      title: 'Найди ошибку: два имени',
      bug: true,
      description: `
Класс \`Pet\` хранит имя и умеет поздороваться: \`Привет, имя!\`. Наследник \`Dog\` добавляет породу. Каждая строка ввода — кличка и порода собаки; программа печатает:

\`\`\`text
Привет, Шарик!
Порода: дворняга
\`\`\`

Вместо клички программа здоровается с «без имени». Найдите и исправьте ошибку в классе \`Dog\`.`,
      constraints: ['Строк не больше 20.'],
      hints: [
        'Сколько полей name_ в объекте Dog и какое из них читает метод greet базового класса?',
        'Уберите лишнее поле из Dog и передайте кличку конструктору базы: Dog(…) : Pet(std::move(name)), breed_(…) {}.',
      ],
      starter: TWO_NAMES(false),
      solution: TWO_NAMES(true),
      explanation: `
\`Dog\` объявил своё поле \`name_\` и записал кличку в него. Но \`greet\` — метод базы, и он читает поле \`name_\` **базы**, а оно было инициализировано конструктором \`Pet()\` без аргументов: «без имени». В объекте оказалось два имени, и каждое видит свою половину кода.

Данные базы передаются её конструктору: \`: Pet(std::move(name))\`. Дублирующее поле нужно убрать совсем — тогда ошибиться будет негде. Если бы у \`Pet\` не было конструктора по умолчанию, компилятор сразу указал бы на проблему; «удобный» конструктор без аргументов здесь её спрятал.`,
      examples: [
        { in: 'Шарик дворняга\n', out: 'Привет, Шарик!\nПорода: дворняга\n' },
        { in: 'Rex shepherd\n', out: 'Привет, Rex!\nПорода: shepherd\n' },
      ],
      hidden: [
        'Бобик такса\n',
        'Жучка лайка\nТузик пудель\n',
        'Max beagle\n',
        'Белка хаски\n',
        'a b\n',
        'Лорд доберман\n',
        'Найда овчарка\nРекс колли\n',
        'Dog dog\n',
      ],
    },
    {
      title: 'Сберегательный счёт',
      difficulty: 'advanced',
      description: `
Опишите класс \`Account\` с методами \`deposit(n)\`, \`bool withdraw(n)\` (отказ при нехватке средств) и \`balance()\`, и наследника \`SavingsAccount\` со ставкой в процентах в месяц. Наследник:

- **ограничивает** снятия: не больше трёх успешных за месяц — его \`withdraw\` проверяет счётчик и вызывает базовый \`Account::withdraw\`;
- добавляет метод \`end_month()\`: начисляет проценты (\`баланс · ставка / 100\`, целочисленно) вкладом и обнуляет счётчик снятий.

Первая строка — ставка. Команды: \`dep n\`, \`wd n\` (\`ок\` или \`отказ\`), \`month\`, \`show\` (баланс).`,
      constraints: ['Ставка от 0 до 10; команд не больше 50; суммы от 1 до 10⁹.'],
      hints: [
        'bool SavingsAccount::withdraw(long long n) { if (withdrawals_ == 3 || !Account::withdraw(n)) return false; withdrawals_++; return true; }',
        'end_month: deposit(balance() * rate_ / 100); withdrawals_ = 0;. Метод deposit унаследован от базы.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Account {
public:
    void deposit(long long n) {
        balance_ += n;
    }

    bool withdraw(long long n) {
        if (n > balance_) {
            return false;
        }
        balance_ -= n;
        return true;
    }

    long long balance() const {
        return balance_;
    }

private:
    long long balance_ = 0;
};

class SavingsAccount : public Account {
public:
    explicit SavingsAccount(int rate) : rate_(rate) {}

    bool withdraw(long long n) {
        if (withdrawals_ == 3 || !Account::withdraw(n)) {
            return false;
        }
        withdrawals_++;
        return true;
    }

    void end_month() {
        deposit(balance() * rate_ / 100);
        withdrawals_ = 0;
    }

private:
    int rate_;
    int withdrawals_ = 0;
};

int main() {
    int rate;
    std::cin >> rate;
    SavingsAccount account(rate);
    std::string command;
    while (std::cin >> command) {
        if (command == "dep") {
            long long n;
            std::cin >> n;
            account.deposit(n);
        } else if (command == "wd") {
            long long n;
            std::cin >> n;
            std::println("{}", account.withdraw(n) ? "ок" : "отказ");
        } else if (command == "month") {
            account.end_month();
        } else {
            std::println("{}", account.balance());
        }
    }
    return 0;
}`,
      explanation: `
\`SavingsAccount\` не переписывает правила обычного счёта, а дополняет их: его \`withdraw\` проверяет своё ограничение и делегирует остальное базовому \`Account::withdraw\`, который охраняет «не уходить в минус». Счётчик увеличивается, только если снятие действительно прошло, — неудачная попытка не съедает лимит.

Баланс закрыт в базовом классе, поэтому наследник начисляет проценты через открытый \`deposit\` — и не может обойти проверки базы. \`balance() * rate_ / 100\` считается целочисленно, дробная часть копейки отбрасывается.`,
      examples: [
        {
          in: '2\ndep 1000\nwd 100\nwd 100\nwd 100\nwd 100\nmonth\nshow\n',
          out: 'ок\nок\nок\nотказ\n714\n',
        },
        { in: '5\nwd 1\nshow\n', out: 'отказ\n0\n' },
      ],
      hidden: [
        { in: '10\ndep 100\nmonth\nmonth\nshow\n', name: 'Сложные проценты' },
        {
          in: '0\ndep 50\nwd 60\nwd 10\nwd 10\nwd 10\nwd 10\nshow\n',
          name: 'Неудача не считается',
        },
        { in: '1\ndep 1000000000\nmonth\nshow\n', name: 'Большой вклад' },
        { in: '3\ndep 300\nwd 1\nwd 1\nwd 1\nmonth\nwd 1\nshow\n', name: 'Новый месяц' },
        { in: '2\ndep 49\nmonth\nshow\n', name: 'Меньше копейки' },
        { in: '5\nshow\n', name: 'Пустой счёт' },
        { in: '7\ndep 1000\nwd 1000\nwd 1\nmonth\nshow\n', name: 'До нуля' },
        {
          in: '4\ndep 500\nwd 100\nmonth\nwd 100\nwd 100\nwd 100\nwd 100\nshow\n',
          name: 'Лимит после месяца',
        },
      ],
    },
  ],
};
