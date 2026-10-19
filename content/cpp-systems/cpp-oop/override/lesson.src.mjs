const GREETER = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

class Greeter {
public:
${
  fixed
    ? `    void greet() const {
        greet_as(default_name());
    }

    void greet(const std::string &who) const {
        greet_as(who);
    }

    virtual ~Greeter() = default;

private:
    virtual std::string default_name() const {
        return "мир";
    }

    virtual void greet_as(const std::string &who) const {
        std::println("Привет, {}!", who);
    }
};

class Friendly : public Greeter {
private:
    std::string default_name() const override {
        return "друг";
    }

    void greet_as(const std::string &who) const override {
        std::println("Здравствуй, {}!", who);
    }
};`
    : `    virtual void greet(const std::string &who = "мир") const {
        std::println("Привет, {}!", who);
    }

    virtual ~Greeter() = default;
};

class Friendly : public Greeter {
public:
    void greet(const std::string &who = "друг") const override {
        std::println("Здравствуй, {}!", who);
    }
};`
}

void welcome(const Greeter &g, const std::string &name) {
    if (name == "-") {
        g.greet();
    } else {
        g.greet(name);
    }
}

int main() {
    Greeter plain;
    Friendly friendly;
    std::string kind, name;
    while (std::cin >> kind >> name) {
        welcome(kind == "friendly" ? static_cast<const Greeter &>(friendly) : plain, name);
    }
    return 0;
}`;

export default {
  id: 'oop-override',
  title: 'override: компилятор проверяет намерение',
  description:
    'Почему метод с другой сигнатурой не переопределяет базовый, а компилятор лишь предупреждает; override превращает это в ошибку компиляции; virtual в базе и override в наследниках; ловушка аргументов по умолчанию у виртуальных функций; сокрытие перегрузок и using Base::имя; невиртуальный интерфейс (NVI) с закрытыми виртуальными шагами.',
  moduleId: 'cpp-oop',
  order: 17,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-virtual'],
  objectives: [
    'Помечать переопределения override и читать ошибки несовпадения',
    'Избегать аргументов по умолчанию у виртуальных функций',
    'Возвращать скрытые перегрузки через using',
    'Проектировать иерархии по схеме невиртуального интерфейса',
  ],
  tags: ['C++23', 'ООП', 'override', 'virtual', 'NVI'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Base {
    virtual int value() const { return 1; }
};

struct Derived : Base {
    int value() { return 2; }
};

int main() {
    Derived d;
    const Base &b = d;
    std::println("{} {}", b.value(), d.value());
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 2'],
      placeholder: 'Вывод программы',
      explain:
        'value() без const — другая функция: через базу вызывается базовая версия, через неконстантный d — новая.',
    },
    {
      q: 'Что делает override после списка параметров метода?',
      options: [
        'Требует, чтобы метод переопределял виртуальную функцию базы, иначе — ошибка компиляции',
        'Делает метод виртуальным в базе',
        'Запрещает наследникам переопределять метод',
        'Ускоряет вызов',
      ],
      correct: 0,
      explain: 'Это проверка намерения: несовпадение сигнатуры перестаёт быть тихой ошибкой.',
    },
    {
      q: 'Какие ошибки override превращает в ошибки компиляции? Выберите все.',
      options: [
        'Забытый const в наследнике',
        'В базе функция не объявлена virtual',
        'Опечатка в имени метода',
        'Неправильная формула внутри метода',
      ],
      correct: [0, 1, 2],
      explain: 'override проверяет связь с базой, а не логику тела.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct A {
    virtual void show(int x = 1) const { std::print("A{} ", x); }
};

struct B : A {
    void show(int x = 2) const override { std::print("B{} ", x); }
};

int main() {
    B b;
    const A &a = b;
    a.show();
    b.show();
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['B1 B2'],
      placeholder: 'Вывод программы',
      explain:
        'Тело выбирается по объекту (B), а значение по умолчанию — по типу в коде: через A это 1.',
    },
    {
      q: 'Где писать слово virtual, а где override?',
      options: [
        'virtual — в базе, где функция объявлена впервые; override — во всех переопределениях',
        'virtual — везде, override — нигде',
        'override — в базе, virtual — в наследниках',
        'Оба слова — в каждом классе',
      ],
      correct: 0,
      explain: 'В наследнике virtual ничего не добавляет, а override добавляет проверку.',
    },
    {
      q: 'В базе две перегрузки virtual void f(int) и virtual void f(double). Наследник переопределил только f(int). Что произойдёт при вызове d.f(2.5) через объект наследника?',
      options: [
        'Вызовется f(int) наследника: f(double) базы скрыта, и 2.5 преобразуется в int',
        'Вызовется f(double) базы',
        'Ошибка компиляции всегда',
        'Неопределённое поведение',
      ],
      correct: 0,
      explain:
        'Имя в наследнике скрывает все одноимённые функции базы. Вернуть их — using Base::f;',
    },
    {
      q: 'Как вернуть в наследник все перегрузки print базового класса Printer?',
      answers: ['using Printer::print;', 'using Printer::print'],
      placeholder: 'Объявление',
      explain: 'using-объявление вносит одноимённые функции базы в область видимости наследника.',
    },
    {
      q: 'Что означает схема NVI?',
      options: [
        'Открытый невиртуальный метод базы задаёт порядок действий, а изменяемые шаги — закрытые виртуальные функции',
        'Все методы виртуальные и открытые',
        'Наследникам запрещено переопределять методы',
        'Виртуальные функции вызываются только из конструктора',
      ],
      correct: 0,
      explain: 'База контролирует алгоритм, наследники — только свои шаги.',
    },
    {
      q: 'Может ли наследник переопределить закрытую (private) виртуальную функцию базы?',
      options: [
        'Да: переопределить можно, нельзя только вызвать её снаружи',
        'Нет: закрытые функции не наследуются',
        'Только если наследник — друг базы',
        'Только при protected-наследовании',
      ],
      correct: 0,
      explain: 'Доступ ограничивает вызов, а не переопределение. На этом построен NVI.',
    },
  ],
  exercises: [
    {
      id: 'oop-override-exercise',
      title: 'Конвертеры',
      difficulty: 'beginner',
      description: `
Опишите базовый класс \`Converter\` с виртуальными методами \`double convert(double) const\` и \`std::string name() const\`, и наследников, переопределяющих оба метода с \`override\`:

| Код     | Имя                | Формула          |
| ------- | ------------------ | ---------------- |
| \`c2f\`   | \`°C -> °F\`         | \`x · 9 / 5 + 32\` |
| \`f2c\`   | \`°F -> °C\`         | \`(x − 32) · 5 / 9\` |
| \`km2mi\` | \`км -> мили\`       | \`x · 0.621371\`   |
| \`mi2km\` | \`мили -> км\`       | \`x / 0.621371\`   |

Каждая строка ввода — код и число. Напечатайте \`имя: x = y\` с двумя знаками после точки у обоих чисел, вызывая методы через \`const Converter &\`.`,
      constraints: ['Строк не больше 30; числа по модулю до 10⁶.'],
      hints: [
        'Все четыре конвертера создайте в main заранее и выбирайте нужный по коду, получая const Converter &.',
        'Функция void show(const Converter &c, double x) печатает строку — через ссылку на базу вызываются переопределения.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Converter {
public:
    virtual double convert(double x) const {
        return x;
    }

    virtual std::string name() const {
        return "без преобразования";
    }

    virtual ~Converter() = default;
};

class CToF : public Converter {
public:
    double convert(double x) const override {
        return x * 9 / 5 + 32;
    }

    std::string name() const override {
        return "°C -> °F";
    }
};

class FToC : public Converter {
public:
    double convert(double x) const override {
        return (x - 32) * 5 / 9;
    }

    std::string name() const override {
        return "°F -> °C";
    }
};

class KmToMiles : public Converter {
public:
    double convert(double x) const override {
        return x * 0.621371;
    }

    std::string name() const override {
        return "км -> мили";
    }
};

class MilesToKm : public Converter {
public:
    double convert(double x) const override {
        return x / 0.621371;
    }

    std::string name() const override {
        return "мили -> км";
    }
};

void show(const Converter &c, double x) {
    std::println("{}: {:.2f} = {:.2f}", c.name(), x, c.convert(x));
}

int main() {
    CToF c2f;
    FToC f2c;
    KmToMiles km2mi;
    MilesToKm mi2km;
    std::string code;
    double x;
    while (std::cin >> code >> x) {
        if (code == "c2f") {
            show(c2f, x);
        } else if (code == "f2c") {
            show(f2c, x);
        } else if (code == "km2mi") {
            show(km2mi, x);
        } else {
            show(mi2km, x);
        }
    }
    return 0;
}`,
      explanation: `
Каждый наследник переопределяет оба метода, и \`override\` гарантирует, что это действительно переопределения: опечатка вроде \`double convert(double x)\` без \`const\` не скомпилировалась бы. \`show\` работает через ссылку на базу и ничего не знает о конкретных формулах.

Виртуальный деструктор \`virtual ~Converter() = default;\` здесь не обязателен — объекты не удаляются через указатель на базу, — но его принято объявлять в любом полиморфном базовом классе; подробнее — в уроке о виртуальном деструкторе.`,
      examples: [
        { in: 'c2f 100\nf2c 212\n', out: '°C -> °F: 100.00 = 212.00\n°F -> °C: 212.00 = 100.00\n' },
        {
          in: 'km2mi 42.2\nmi2km 1\n',
          out: 'км -> мили: 42.20 = 26.22\nмили -> км: 1.00 = 1.61\n',
        },
      ],
      hidden: [
        { in: 'c2f -40\nf2c -40\n', name: 'Минус сорок' },
        { in: 'c2f 0\n', name: 'Ноль' },
        { in: 'f2c 98.6\n', name: 'Температура тела' },
        { in: 'km2mi 0\nmi2km 0\n', name: 'Нулевые расстояния' },
        { in: 'km2mi 1000000\n', name: 'Миллион километров' },
        { in: 'mi2km 26.2\n', name: 'Марафон в милях' },
        { in: 'c2f 36.6\nkm2mi 5\n', name: 'Смесь' },
        { in: 'f2c 0\n', name: 'Ноль Фаренгейта' },
      ],
    },
    {
      title: 'Принтер с перегрузками',
      description: `
Базовый класс \`Printer\` имеет две виртуальные перегрузки: \`print(long long)\` печатает \`число X\`, \`print(const std::string &)\` печатает \`строка S\`. Наследник \`Boxed\` переопределяет **только** строковую: печатает \`[S]\`. Числа он должен печатать по-прежнему, базовой версией.

Строки ввода: \`int число\` или \`str слово\`. Обработайте каждую вызовом метода у объекта \`Boxed\` (не через ссылку на базу). Подсказка: без одной строки в \`Boxed\` числовая перегрузка окажется скрытой.`,
      constraints: ['Строк не больше 30.'],
      hints: [
        'Если в Boxed объявлен только print(const std::string &), то вызов boxed.print(5LL) не найдёт числовую перегрузку базы.',
        'Добавьте в Boxed строку using Printer::print; — она вернёт все перегрузки базы, а строковая будет заменена переопределением.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Printer {
public:
    virtual void print(long long x) const {
        std::println("число {}", x);
    }

    virtual void print(const std::string &s) const {
        std::println("строка {}", s);
    }

    virtual ~Printer() = default;
};

class Boxed : public Printer {
public:
    using Printer::print;

    void print(const std::string &s) const override {
        std::println("[{}]", s);
    }
};

int main() {
    Boxed boxed;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "int") {
            long long x;
            std::cin >> x;
            boxed.print(x);
        } else {
            std::string s;
            std::cin >> s;
            boxed.print(s);
        }
    }
    return 0;
}`,
      explanation: `
Объявление \`print\` в наследнике скрывает **все** одноимённые функции базы — и переопределённую, и остальные перегрузки. Без \`using Printer::print;\` вызов \`boxed.print(x)\` с числом не нашёл бы подходящей функции: компилятор видит в \`Boxed\` только строковую версию.

\`using\` вносит перегрузки базы в область видимости наследника, а переопределённая строковая заменяет свою. Через ссылку на базу проблемы бы не было — там видны все функции \`Printer\`, — но клиенты часто работают и с самим наследником.`,
      examples: [
        { in: 'int 42\nstr текст\n', out: 'число 42\n[текст]\n' },
        { in: 'str a\nstr b\n', out: '[a]\n[b]\n' },
      ],
      hidden: [
        { in: 'int -7\n', name: 'Отрицательное' },
        { in: 'int 9223372036854775807\n', name: 'Максимум' },
        { in: '', name: 'Пусто' },
        { in: 'str 123\n', name: 'Цифры как строка' },
        { in: 'int 0\nstr 0\n', name: 'Ноль дважды' },
        { in: 'str привет\nint 1\nstr мир\n', name: 'Чередование' },
        { in: 'int 5\nint 6\n', name: 'Только числа' },
        { in: 'str [x]\n', name: 'Скобки' },
      ],
    },
    {
      title: 'Найди ошибку: чужое приветствие',
      bug: true,
      description: `
Обычный \`Greeter\` здоровается «Привет, имя!», а \`Friendly\` — «Здравствуй, имя!». Если имя не указано (во вводе \`-\`), обычный приветствует «мир», дружелюбный — «друга». Функция \`welcome(const Greeter &, имя)\` работает с любым приветствующим. Строки ввода: \`plain имя\` или \`friendly имя\`.

\`friendly -\` печатает «Здравствуй, мир!» вместо «Здравствуй, друг!». Найдите причину и исправьте устройство классов так, чтобы значение «по умолчанию» выбиралось по настоящему объекту.`,
      constraints: ['Строк не больше 20.'],
      hints: [
        'Значение по умолчанию подставляется при компиляции — по какому типу, если вызов идёт через const Greeter &?',
        'Уберите аргументы по умолчанию у виртуальной функции. Например: открытая невиртуальная greet() вызывает закрытую виртуальную default_name(), которую переопределяет Friendly.',
      ],
      starter: GREETER(false),
      solution: GREETER(true),
      explanation: `
\`g.greet()\` внутри \`welcome\` вызывается через \`const Greeter &\`. Тело выбирается по объекту — \`Friendly::greet\`, — а аргумент по умолчанию компилятор подставил по типу в коде: \`"мир"\` из \`Greeter\`. Получилась смесь двух классов.

Исправление убирает аргументы по умолчанию из виртуальных функций. Невиртуальная \`greet()\` без параметров спрашивает имя по умолчанию у виртуальной \`default_name()\`, и теперь и тело, и значение выбираются по настоящему объекту. Это схема NVI: открытые невиртуальные методы, закрытые виртуальные шаги.`,
      examples: [
        { in: 'friendly -\nplain -\n', out: 'Здравствуй, друг!\nПривет, мир!\n' },
        { in: 'friendly Ада\n', out: 'Здравствуй, Ада!\n' },
      ],
      hidden: [
        'friendly -\n',
        'plain Алан\n',
        'friendly Грейс\nfriendly -\n',
        'plain -\nfriendly -\nplain -\n',
        'friendly x\n',
        'plain y\nfriendly -\n',
        'friendly -\nfriendly -\n',
        'plain -\n',
      ],
    },
    {
      title: 'Экспорт таблиц',
      difficulty: 'advanced',
      description: `
Опишите базовый класс \`Exporter\` по схеме NVI: открытый **невиртуальный** \`void run(const std::vector<std::string> &rows) const\` печатает заголовок, затем каждую строку, затем \`--- строк: N\`; шаги \`header()\` и \`line(row)\` — **закрытые** чисто виртуальные функции. Наследники:

- \`csv\`: заголовок \`name\`, строка — как есть;
- \`md\`: заголовок из двух строк \`| name |\` и \`|---|\`, строка — \`| row |\`;
- \`list\`: заголовок \`Список:\`, строка — \`- row\`.

Первое слово ввода — формат, затем слова-строки до конца ввода.`,
      constraints: ['Строк не больше 50; слова без пробелов.'],
      hints: [
        'В базе: private: virtual void header() const = 0; virtual void line(const std::string &) const = 0;. Наследники переопределяют их с override (тоже в private).',
        'Выбор формата в main: создайте нужный объект и вызовите run через const Exporter & — например, отдельной функцией export_all(const Exporter &e, rows).',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Exporter {
public:
    void run(const std::vector<std::string> &rows) const {
        header();
        for (const std::string &row : rows) {
            line(row);
        }
        std::println("--- строк: {}", rows.size());
    }

    virtual ~Exporter() = default;

private:
    virtual void header() const = 0;
    virtual void line(const std::string &row) const = 0;
};

class Csv : public Exporter {
    void header() const override {
        std::println("name");
    }

    void line(const std::string &row) const override {
        std::println("{}", row);
    }
};

class Markdown : public Exporter {
    void header() const override {
        std::println("| name |");
        std::println("|---|");
    }

    void line(const std::string &row) const override {
        std::println("| {} |", row);
    }
};

class List : public Exporter {
    void header() const override {
        std::println("Список:");
    }

    void line(const std::string &row) const override {
        std::println("- {}", row);
    }
};

void export_all(const Exporter &e, const std::vector<std::string> &rows) {
    e.run(rows);
}

int main() {
    std::string format;
    std::cin >> format;
    std::vector<std::string> rows;
    std::string word;
    while (std::cin >> word) {
        rows.push_back(word);
    }
    if (format == "csv") {
        export_all(Csv(), rows);
    } else if (format == "md") {
        export_all(Markdown(), rows);
    } else {
        export_all(List(), rows);
    }
    return 0;
}`,
      explanation: `
Алгоритм экспорта — заголовок, строки, итог — записан один раз в \`Exporter::run\`, и наследник не может его нарушить: \`run\` невиртуальная. Наследники отвечают только за то, что действительно различается, — оформление заголовка и строки. Подсчёт строк в конце появится в любом новом формате автоматически.

Закрытые виртуальные функции нельзя вызвать снаружи, но можно переопределить. Запись \`= 0\` делает их обязательными: класс-наследник, забывший \`line\`, нельзя будет создать. \`Exporter\` — абстрактный класс, и создать его объект напрямую тоже нельзя — об этом следующие уроки.`,
      examples: [
        { in: 'md Ада Алан\n', out: '| name |\n|---|\n| Ада |\n| Алан |\n--- строк: 2\n' },
        { in: 'csv\n', out: 'name\n--- строк: 0\n' },
      ],
      hidden: [
        { in: 'list a b c\n', name: 'Список' },
        { in: 'csv x\n', name: 'CSV' },
        { in: 'md\n', name: 'Пустой Markdown' },
        { in: 'list\n', name: 'Пустой список' },
        { in: 'csv Ada Alan Grace Linus\n', name: 'Четыре строки' },
        { in: 'md один\n', name: 'Одна строка' },
        { in: 'list молоко хлеб\n', name: 'Покупки' },
        { in: 'csv 1 2 3\n', name: 'Числа' },
      ],
    },
  ],
};
