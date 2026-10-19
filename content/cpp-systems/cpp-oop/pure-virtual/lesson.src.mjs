const CTOR_CALL = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Document {
public:
${
  fixed
    ? `    explicit Document(std::string kind) {
        std::println("создан документ: {}", kind);
    }`
    : `    Document() {
        std::println("создан документ: {}", kind());
    }`
}

    virtual ~Document() = default;
    virtual std::string kind() const = 0;
    virtual int pages() const = 0;
};

class Invoice : public Document {
public:
    explicit Invoice(int items) : ${fixed ? 'Document("счёт"), ' : ''}items_(items) {}

    std::string kind() const override {
        return "счёт";
    }

    int pages() const override {
        return 1 + items_ / 20;
    }

private:
    int items_;
};

int main() {
    int items;
    while (std::cin >> items) {
        Invoice invoice(items);
        const Document &d = invoice;
        std::println("{}: {} стр.", d.kind(), d.pages());
    }
    return 0;
}`;

export default {
  id: 'oop-pure-virtual',
  title: 'Чисто виртуальные функции',
  description:
    'Заглушка в базе вместо реализации и почему она опасна; чисто виртуальная функция = 0 и абстрактный класс; ошибка компиляции при создании неполного объекта; базовый класс как обязательный договор; чисто виртуальная функция с телом; почему нельзя вызывать её из конструктора базы. Первый этап проекта «Система обработки датчиков».',
  moduleId: 'cpp-oop',
  order: 19,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-final'],
  objectives: [
    'Объявлять чисто виртуальные функции и абстрактные классы',
    'Превращать забытое переопределение в ошибку компиляции',
    'Проектировать базовый класс как договор для наследников',
  ],
  tags: ['C++23', 'ООП', 'Чисто виртуальная функция', 'Абстрактный класс', 'Проект'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что означает запись virtual double area() const = 0;?',
      options: [
        'У базы нет реализации; каждый неабстрактный наследник обязан дать свою',
        'Функция возвращает 0',
        'Функцию нельзя вызывать',
        'Функция статическая',
      ],
      correct: 0,
      explain: 'Это чисто виртуальная функция, а класс с ней — абстрактный.',
    },
    {
      q: 'Что из этого скомпилируется, если Shape — абстрактный класс, а Circle — его неабстрактный наследник? Выберите все.',
      options: ['Shape s;', 'Circle c(1);', 'const Shape &r = c;', 'std::vector<const Shape *> v;'],
      correct: [1, 2, 3],
      explain: 'Объект абстрактного класса создать нельзя; ссылки и указатели на него — можно.',
    },
    {
      q: 'Наследник реализовал только одну из двух чисто виртуальных функций базы. Какой он?',
      options: [
        'Абстрактный',
        'Неабстрактный: одной реализации достаточно',
        'Ошибочный — не скомпилируется даже объявление',
        'Финальный',
      ],
      correct: 0,
      explain: 'Ошибка появится при попытке создать его объект.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Unit {
    virtual ~Unit() = default;
    virtual int power() const = 0;
    int doubled() const { return 2 * power(); }
};

struct Knight : Unit {
    int power() const override { return 7; }
};

int main() {
    Knight k;
    const Unit &u = k;
    std::println("{}", u.doubled());
    return 0;
}`,
      lang: 'cpp',
      answers: ['14'],
      placeholder: 'Вывод программы',
      explain:
        'Обычный метод базы вызывает чисто виртуальную функцию — работает версия настоящего объекта.',
    },
    {
      q: 'Почему чисто виртуальная функция лучше заглушки virtual double area() const { return 0; }?',
      options: [
        'Забытое переопределение становится ошибкой компиляции, а не тихим нулём',
        'Она работает быстрее',
        'Она занимает меньше памяти',
        'Заглушки запрещены стандартом',
      ],
      correct: 0,
      explain:
        'И объект «просто фигуры», который ничего не означает, создать становится невозможно.',
    },
    {
      q: 'Может ли у чисто виртуальной функции быть тело?',
      options: [
        'Да, если определить его вне класса; наследник всё равно обязан переопределить функцию, но может вызвать Base::f()',
        'Нет, никогда',
        'Да, и тогда класс перестаёт быть абстрактным',
        'Только у деструктора',
      ],
      correct: 0,
      explain: 'Редкий приём: общая часть поведения, которую наследники вызывают явно.',
    },
    {
      q: 'Что произойдёт, если конструктор базы вызовет чисто виртуальную функцию без тела?',
      options: [
        'Наследник ещё не создан: GCC выдаст ошибку компоновки, программа Clang аварийно завершится (pure virtual method called)',
        'Вызовется версия наследника',
        'Вызов будет пропущен',
        'Функция вернёт значение по умолчанию',
      ],
      correct: 0,
      explain:
        'Если базе нужны данные наследника при создании, их передают аргументом конструктора.',
    },
    {
      q: 'Как называют класс, состоящий только из чисто виртуальных функций и виртуального деструктора?',
      answers: ['интерфейс', 'Интерфейс'],
      placeholder: 'Слово',
      explain: 'Интерфейс — чистый договор без данных и реализаций.',
    },
  ],
  exercises: [
    {
      id: 'oop-pure-virtual-exercise',
      title: 'Животные',
      difficulty: 'beginner',
      description: `
Опишите абстрактный класс \`Animal\` с чисто виртуальными функциями \`std::string name() const\` и \`std::string sound() const\`, и наследников \`Cat\` (\`кошка\`, \`мяу\`), \`Dog\` (\`собака\`, \`гав\`) и \`Cow\` (\`корова\`, \`муу\`). Функция \`void speak(const Animal &a, int times)\` печатает \`имя: звук звук …\` (звук повторяется \`times\` раз через пробел).

Каждая строка ввода — вид (\`cat\`, \`dog\`, \`cow\`) и число повторов.`,
      constraints: ['Строк не больше 30; повторов от 1 до 10.'],
      hints: [
        'virtual std::string sound() const = 0; — и обязательно virtual ~Animal() = default;.',
        'Звуки собирайте в строку: line += (i ? " " : "") + a.sound();.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Animal {
public:
    virtual ~Animal() = default;
    virtual std::string name() const = 0;
    virtual std::string sound() const = 0;
};

class Cat : public Animal {
public:
    std::string name() const override {
        return "кошка";
    }

    std::string sound() const override {
        return "мяу";
    }
};

class Dog : public Animal {
public:
    std::string name() const override {
        return "собака";
    }

    std::string sound() const override {
        return "гав";
    }
};

class Cow : public Animal {
public:
    std::string name() const override {
        return "корова";
    }

    std::string sound() const override {
        return "муу";
    }
};

void speak(const Animal &a, int times) {
    std::string line;
    for (int i = 0; i < times; i++) {
        line += (i ? " " : "") + a.sound();
    }
    std::println("{}: {}", a.name(), line);
}

int main() {
    Cat cat;
    Dog dog;
    Cow cow;
    std::string kind;
    int times;
    while (std::cin >> kind >> times) {
        if (kind == "cat") {
            speak(cat, times);
        } else if (kind == "dog") {
            speak(dog, times);
        } else {
            speak(cow, times);
        }
    }
    return 0;
}`,
      explanation: `
У «просто животного» нет ни имени, ни звука, поэтому функции в базе чисто виртуальные, а сама база абстрактная: создать \`Animal\` нельзя. Каждый наследник обязан реализовать оба метода — забудь он \`sound\`, объект нельзя было бы создать.

\`speak\` работает с договором \`Animal\` и не знает о конкретных видах.`,
      examples: [
        { in: 'cat 2\ndog 1\n', out: 'кошка: мяу мяу\nсобака: гав\n' },
        { in: 'cow 3\n', out: 'корова: муу муу муу\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'cat 10\n', name: 'Десять раз' },
        { in: 'dog 1\ndog 2\n', name: 'Две собаки' },
        { in: 'cow 1\ncat 1\ndog 1\n', name: 'Все виды' },
        { in: 'cat 1\n', name: 'Один раз' },
        { in: 'dog 5\n', name: 'Пять' },
        { in: 'cow 2\ncow 2\n', name: 'Повтор' },
        { in: 'cat 3\ncow 4\n', name: 'Смесь' },
      ],
    },
    {
      title: 'Налоговые правила',
      description: `
Опишите абстрактный класс \`Tax\` с единственной чисто виртуальной функцией \`long long amount(long long income) const\` и три правила:

- \`flat\` — 13 % дохода;
- \`progressive\` — 13 % с части до 2 400 000 и 15 % с части сверх неё;
- \`exempt L\` — освобождение: доход до \`L\` включительно не облагается, с превышения — 13 %.

Все проценты — целочисленно (\`x · p / 100\`), отдельно для каждой части. Первая строка — правила через пробел (у \`exempt\` следом идёт \`L\`). Затем доходы. Для каждого дохода напечатайте налоги по всем правилам через пробел.`,
      constraints: ['Правил от 1 до 5; доходов до 30; числа до 10¹².'],
      hints: [
        'Первая строка читается через std::getline и разбирается по словам; правила храните в векторах конкретных типов с reserve и указателях на базу.',
        'Если правила одного вида не повторяются в условии, можно обойтись тремя объектами в main и вектором указателей в порядке строки.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <sstream>
#include <string>
#include <vector>

class Tax {
public:
    virtual ~Tax() = default;
    virtual long long amount(long long income) const = 0;
};

class Flat : public Tax {
public:
    long long amount(long long income) const override {
        return income * 13 / 100;
    }
};

class Progressive : public Tax {
public:
    long long amount(long long income) const override {
        const long long border = 2400000;
        if (income <= border) {
            return income * 13 / 100;
        }
        return border * 13 / 100 + (income - border) * 15 / 100;
    }
};

class Exempt : public Tax {
public:
    explicit Exempt(long long limit) : limit_(limit) {}

    long long amount(long long income) const override {
        return income <= limit_ ? 0 : (income - limit_) * 13 / 100;
    }

private:
    long long limit_;
};

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream words(line);
    std::vector<Flat> flats;
    std::vector<Progressive> progressives;
    std::vector<Exempt> exempts;
    flats.reserve(5);
    progressives.reserve(5);
    exempts.reserve(5);
    std::vector<const Tax *> rules;
    std::string kind;
    while (words >> kind) {
        if (kind == "flat") {
            flats.emplace_back();
            rules.push_back(&flats.back());
        } else if (kind == "progressive") {
            progressives.emplace_back();
            rules.push_back(&progressives.back());
        } else {
            long long limit;
            words >> limit;
            exempts.emplace_back(limit);
            rules.push_back(&exempts.back());
        }
    }
    long long income;
    while (std::cin >> income) {
        std::string out;
        for (const Tax *t : rules) {
            out += (out.empty() ? "" : " ") + std::to_string(t->amount(income));
        }
        std::println("{}", out);
    }
    return 0;
}`,
      explanation: `
\`Tax\` — чистый договор: ни полей, ни реализаций. Код подсчёта знает только, что у любого правила есть \`amount\`. Правила хранятся в векторах конкретных типов с зарезервированной ёмкостью, а порядок из условия — в векторе указателей на базу.

\`std::istringstream\` из \`<sstream>\` превращает строку в поток, из которого слова читаются так же, как из \`std::cin\`, — удобно, когда первая строка устроена иначе, чем остальные.`,
      examples: [
        { in: 'flat progressive\n1000000\n5000000\n', out: '130000 130000\n650000 702000\n' },
        { in: 'exempt 100000 flat\n50000\n150000\n', out: '0 6500\n6500 19500\n' },
      ],
      hidden: [
        { in: 'flat\n0\n', name: 'Нулевой доход' },
        { in: 'progressive\n2400000\n2400001\n', name: 'Граница прогрессии' },
        { in: 'exempt 0\n100\n', name: 'Освобождение 0' },
        { in: 'flat progressive exempt 1000000\n1000000000000\n', name: 'Триллион' },
        { in: 'exempt 500 exempt 1000\n700\n', name: 'Два освобождения' },
        { in: 'flat flat\n99\n', name: 'Округление вниз' },
        { in: 'progressive flat\n10000000\n1\n', name: 'Два дохода' },
        { in: 'exempt 2400000 progressive\n3000000\n', name: 'Сравнение правил' },
      ],
    },
    {
      title: 'Найди ошибку: вызов из конструктора',
      bug: true,
      description: `
Абстрактный класс \`Document\` при создании печатает \`создан документ: вид\`. Наследник \`Invoice\` (счёт) занимает 1 страницу плюс ещё одну на каждые 20 позиций. Для каждого числа позиций из ввода программа создаёт счёт и печатает:

\`\`\`text
создан документ: счёт
счёт: 2 стр.
\`\`\`

Программа не собирается в GCC, а собранная Clang аварийно завершается. Найдите и исправьте ошибку, сохранив вывод.`,
      constraints: ['Чисел не больше 20; позиций от 0 до 1000.'],
      hints: [
        'Какую функцию вызывает конструктор Document и существует ли уже в этот момент часть Invoice?',
        'Виртуальный вызов в конструкторе базы не доходит до наследника, а у чисто виртуальной kind() нет реализации в базе. Передайте вид документа аргументом конструктора Document.',
      ],
      starter: CTOR_CALL(false),
      solution: CTOR_CALL(true),
      explanation: `
Пока выполняется конструктор \`Document\`, объект ещё не стал счётом: часть \`Invoice\` не создана, и виртуальный вызов \`kind()\` уходит в версию \`Document\`. А её нет — функция чисто виртуальная. GCC видит это при компиляции (предупреждение и ошибка компоновки \`undefined reference\`), в программе Clang вызов срабатывает во время работы, и она завершается с сообщением \`pure virtual method called\`.

Информацию, нужную базе при создании, наследник передаёт аргументом конструктора: \`Invoice(int items) : Document("счёт"), …\`. Виртуальные функции используют уже после создания объекта.`,
      examples: [
        { in: '25\n', out: 'создан документ: счёт\nсчёт: 2 стр.\n' },
        { in: '0\n', out: 'создан документ: счёт\nсчёт: 1 стр.\n' },
      ],
      hidden: ['19\n', '20\n', '1000\n', '1\n40\n', '39\n', '100\n', '7\n8\n9\n', '60\n'],
    },
    {
      id: 'oop-project-sensors',
      title: 'Проект, этап 1: модели датчиков',
      difficulty: 'advanced',
      description: `
Первый этап проекта «Система обработки датчиков». Опишите:

- \`struct Measurement { int sensorId; int value; };\` — результат измерения;
- абстрактный класс \`Sensor\` с чисто виртуальной функцией \`Measurement read(int raw) const\` и виртуальным деструктором;
- финальные классы \`TemperatureSensor(int id, int offset)\` — возвращает \`{id, raw + offset}\` — и \`PressureSensor(int id, int scale)\` — \`{id, raw · scale}\`. Поля закрыты, методы помечены \`override\`.

Функция \`Measurement measure(const Sensor &s, int raw)\` вызывает \`read\` через ссылку на базу. Каждая строка ввода — \`T id калибровка raw\` или \`P id калибровка raw\`. Для каждой напечатайте \`id value\`, а в конце — \`датчиков N\` и \`сумма кодов S\` (сумма всех value: это контрольный код протокола, а не физическая величина).`,
      constraints: [
        'Строк не больше 100; id от 1 до 1000; калибровка от −10 до 10; raw от −1000 до 1000.',
      ],
      hints: [
        'class Sensor { public: virtual ~Sensor() = default; virtual Measurement read(int raw) const = 0; };',
        'Датчики разных видов можно создавать прямо в ветках if и сразу передавать в measure — хранить их не нужно.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>

struct Measurement {
    int sensorId;
    int value;
};

class Sensor {
public:
    virtual ~Sensor() = default;
    virtual Measurement read(int raw) const = 0;
};

class TemperatureSensor final : public Sensor {
public:
    TemperatureSensor(int id, int offset) : id_(id), offset_(offset) {}

    Measurement read(int raw) const override {
        return {id_, raw + offset_};
    }

private:
    int id_;
    int offset_;
};

class PressureSensor final : public Sensor {
public:
    PressureSensor(int id, int scale) : id_(id), scale_(scale) {}

    Measurement read(int raw) const override {
        return {id_, raw * scale_};
    }

private:
    int id_;
    int scale_;
};

Measurement measure(const Sensor &s, int raw) {
    return s.read(raw);
}

int main() {
    char type;
    int id, calibration, raw;
    int count = 0;
    long long sum = 0;
    while (std::cin >> type >> id >> calibration >> raw) {
        Measurement m = type == 'T' ? measure(TemperatureSensor(id, calibration), raw)
                                    : measure(PressureSensor(id, calibration), raw);
        std::println("{} {}", m.sensorId, m.value);
        count++;
        sum += m.value;
    }
    std::println("датчиков {}", count);
    std::println("сумма кодов {}", sum);
    return 0;
}`,
      explanation: `
\`Sensor\` — договор: «датчик умеет превратить сырое значение в измерение». У «просто датчика» нет формулы, поэтому \`read\` чисто виртуальная, и создать \`Sensor\` нельзя. Каждый вид датчика хранит свою калибровку закрытой и реализует формулу в \`read\`; конкретные классы \`final\` — у них не будет наследников.

\`measure\` знает только договор. На втором этапе к нему добавится фильтр, а на третьем — процессор, который владеет набором датчиков любых видов и обрабатывает их одним циклом, ничего не зная о формулах.`,
      examples: [
        { in: 'T 1 2 8\nP 2 3 7\n', out: '1 10\n2 21\nдатчиков 2\nсумма кодов 31\n' },
        { in: '', out: 'датчиков 0\nсумма кодов 0\n' },
      ],
      hidden: [
        { in: 'T 7 -5 5\n', name: 'Отрицательная поправка' },
        { in: 'P 9 0 1000\n', name: 'Нулевой масштаб' },
        { in: 'P 1 10 1000\nP 2 -10 1000\n', name: 'Границы масштаба' },
        { in: 'T 1000 10 -1000\n', name: 'Границы значений' },
        { in: 'T 3 1 1\nT 3 1 1\n', name: 'Повтор id' },
        { in: 'P 4 -1 2\nT 8 -2 -3\nP 2 2 -10\n', name: 'Отрицательные' },
        { in: 'T 1 0 0\nP 2 0 0\nT 3 0 0\n', name: 'Нули' },
        { in: 'P 5 7 -999\nT 6 -10 999\n', name: 'Почти границы' },
      ],
    },
  ],
};
