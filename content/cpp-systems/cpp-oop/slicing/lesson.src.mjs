const VOICE = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Instrument {
public:
    explicit Instrument(std::string owner) : owner_(std::move(owner)) {}
    virtual ~Instrument() = default;

    virtual std::string play() const {
        return "тишина";
    }

    const std::string &owner() const {
        return owner_;
    }

private:
    std::string owner_;
};

class Guitar : public Instrument {
public:
    using Instrument::Instrument;
    std::string play() const override {
        return "дзынь";
    }
};

class Drum : public Instrument {
public:
    using Instrument::Instrument;
    std::string play() const override {
        return "бум";
    }
};

void perform(${fixed ? 'const Instrument &' : 'Instrument '}i, int times) {
    std::string sound;
    for (int k = 0; k < times; k++) {
        sound += (k ? " " : "") + i.play();
    }
    std::println("{}: {}", i.owner(), sound);
}

int main() {
    std::string kind, owner;
    int times;
    while (std::cin >> kind >> owner >> times) {
        if (kind == "guitar") {
            perform(Guitar(owner), times);
        } else if (kind == "drum") {
            perform(Drum(owner), times);
        } else {
            perform(Instrument(owner), times);
        }
    }
    return 0;
}`;

export default {
  id: 'oop-slicing',
  title: 'Срезка объекта',
  description:
    'Что теряется при копировании наследника в объект базового типа; где прячется срезка: параметры и возврат по значению, vector<База>, catch по значению; частичное присваивание через ссылки на базу; защита — ссылки, unique_ptr и удалённое копирование полиморфной базы; виртуальный clone() для полной копии.',
  moduleId: 'cpp-oop',
  order: 23,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['oop-runtime-polymorphism'],
  objectives: [
    'Находить срезку в передаче, хранении и перехвате исключений',
    'Защищать иерархию удалённым копированием базы',
    'Копировать полиморфные объекты через clone()',
  ],
  tags: ['C++23', 'ООП', 'Срезка', 'clone', 'Исключения'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Base {
    virtual ~Base() = default;
    virtual char id() const { return 'B'; }
};

struct Derived : Base {
    char id() const override { return 'D'; }
};

char by_value(Base b) { return b.id(); }
char by_ref(const Base &b) { return b.id(); }

int main() {
    Derived d;
    std::println("{}{}", by_value(d), by_ref(d));
    return 0;
}`,
      lang: 'cpp',
      answers: ['BD'],
      placeholder: 'Вывод программы',
      explain: 'По значению передаётся срезанная копия базовой части, по ссылке — сам объект.',
    },
    {
      q: 'В каких записях происходит срезка объекта Cat c? Выберите все.',
      options: [
        'Animal a = c;',
        'std::vector<Animal> v; v.push_back(c);',
        'const Animal &r = c;',
        'void f(Animal a); f(c);',
      ],
      correct: [0, 1, 3],
      explain: 'Ссылка на базу указывает на сам объект и ничего не копирует.',
    },
    {
      q: 'Как правильно перехватывать исключения стандартной иерархии?',
      answers: [
        'catch (const std::exception &e)',
        'catch(const std::exception& e)',
        'по константной ссылке',
      ],
      placeholder: 'Запись catch',
      explain: 'По значению исключение копируется и обрезается до базы.',
    },
    {
      q: 'Что такое частичное присваивание?',
      options: [
        'Присваивание через ссылки на базу копирует только базовую часть, а производная часть приёмника остаётся старой',
        'Присваивание одного поля',
        'Присваивание в конструкторе',
        'Присваивание константе',
      ],
      correct: 0,
      explain: 'Получается «гибрид» двух объектов, которого никто не создавал.',
    },
    {
      q: 'Что даёт удаление копирующего конструктора и присваивания в полиморфной базе?',
      options: [
        'Срезка становится ошибкой компиляции; передача по ссылке продолжает работать',
        'Объекты нельзя передавать по ссылке',
        'Наследников нельзя создать',
        'Виртуальные функции перестают работать',
      ],
      correct: 0,
      explain: 'Совет C++ Core Guidelines C.67 для базовых классов иерархий.',
    },
    {
      q: 'Как скопировать полиморфный объект целиком, не зная его настоящего типа?',
      options: [
        'Вызвать виртуальную функцию clone(), которая возвращает unique_ptr на копию',
        'Присвоить его переменной базового типа',
        'Использовать static_cast',
        'Это невозможно',
      ],
      correct: 0,
      explain: 'Шаблон «Прототип»: каждый класс сам создаёт свою копию.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <stdexcept>

struct NotFound : std::runtime_error {
    NotFound() : std::runtime_error("не найдено") {}
};

int main() {
    try {
        throw NotFound();
    } catch (const std::exception &e) {
        std::println("{}", e.what());
    }
    return 0;
}`,
      lang: 'cpp',
      answers: ['не найдено'],
      placeholder: 'Вывод программы',
      explain: 'По ссылке what() вызывается у настоящего объекта, и сообщение сохраняется.',
    },
    {
      q: 'Сколько объектов Dog окажется в std::vector<Animal> после push_back(Dog("Рекс"))?',
      answers: ['0', 'ноль'],
      placeholder: 'Число',
      explain: 'Вектор хранит объекты Animal — копию базовой части собаки.',
    },
  ],
  exercises: [
    {
      id: 'oop-slicing-exercise',
      title: 'Клонирование',
      difficulty: 'beginner',
      description: `
Абстрактный класс \`Shape\` с удалёнными копирующими операциями и чисто виртуальными \`area()\`, \`name()\` и \`std::unique_ptr<Shape> clone() const\`. Наследники \`Square\` (\`квадрат\`) и \`Circle\` (\`круг\`).

Команды: \`square s\`, \`circle r\` — добавить фигуру в коллекцию; \`copy\` — дописать в конец коллекции **копии** всех текущих фигур (через \`clone\`); \`list\` — напечатать фигуры \`имя площадь\` с двумя знаками, по одной в строке, затем \`всего N\`.`,
      constraints: ['Команд не больше 30; фигур в коллекции не больше 1000.'],
      hints: [
        'clone у квадрата: return std::make_unique<Square>(side_);.',
        'Копируйте в отдельный вектор, а потом перенесите в основной: добавлять в вектор во время обхода его же элементов нельзя.',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <numbers>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Shape {
public:
    Shape() = default;
    virtual ~Shape() = default;
    Shape(const Shape &) = delete;
    Shape &operator=(const Shape &) = delete;

    virtual double area() const = 0;
    virtual std::string name() const = 0;
    virtual std::unique_ptr<Shape> clone() const = 0;
};

class Square final : public Shape {
public:
    explicit Square(double side) : side_(side) {}

    double area() const override {
        return side_ * side_;
    }

    std::string name() const override {
        return "квадрат";
    }

    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Square>(side_);
    }

private:
    double side_;
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

    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Circle>(r_);
    }

private:
    double r_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    std::string command;
    while (std::cin >> command) {
        if (command == "square" || command == "circle") {
            double x;
            std::cin >> x;
            if (command == "square") {
                shapes.push_back(std::make_unique<Square>(x));
            } else {
                shapes.push_back(std::make_unique<Circle>(x));
            }
        } else if (command == "copy") {
            std::vector<std::unique_ptr<Shape>> copies;
            for (const auto &s : shapes) {
                copies.push_back(s->clone());
            }
            for (auto &c : copies) {
                shapes.push_back(std::move(c));
            }
        } else {
            for (const auto &s : shapes) {
                std::println("{} {:.2f}", s->name(), s->area());
            }
            std::println("всего {}", shapes.size());
        }
    }
    return 0;
}`,
      explanation: `
Копирование базы удалено, поэтому скопировать фигуру «как \`Shape\`» невозможно — ни случайно, ни намеренно. Полная копия создаётся виртуальным \`clone()\`: каждая фигура знает свой тип и свои поля и создаёт такую же. Вызов \`s->clone()\` не знает, кто перед ним, но получает правильную копию.

Копии собираются в отдельный вектор: добавление в \`shapes\` во время обхода по нему же могло бы перевыделить память и испортить цикл. Затем копии переносятся \`std::move\` — владение переходит к основному вектору.`,
      examples: [
        {
          in: 'square 2\ncircle 1\ncopy\nlist\n',
          out: 'квадрат 4.00\nкруг 3.14\nквадрат 4.00\nкруг 3.14\nвсего 4\n',
        },
        { in: 'copy\nlist\n', out: 'всего 0\n' },
      ],
      hidden: [
        { in: 'square 1\ncopy\ncopy\nlist\n', name: 'Два копирования' },
        { in: 'circle 2\nlist\n', name: 'Без копирования' },
        { in: 'square 3\nlist\ncopy\nlist\n', name: 'До и после' },
        { in: 'circle 0.5\nsquare 0.5\ncopy\nlist\n', name: 'Маленькие' },
        { in: 'square 10\ncopy\nsquare 1\nlist\n', name: 'Добавление после копии' },
        { in: 'list\n', name: 'Пусто' },
        { in: 'circle 1\ncopy\ncopy\ncopy\nlist\n', name: 'Восемь кругов' },
        { in: 'square 7\ncircle 7\nlist\n', name: 'Два вида' },
      ],
    },
    {
      title: 'Ошибки по ссылке',
      description: `
Иерархия ошибок: \`AppError\` — наследник \`std::runtime_error\` с виртуальной функцией \`int code() const\` (по умолчанию 500); \`NotFound\` (код 404, сообщение \`нет записи N\`) и \`Denied\` (код 403, сообщение \`нет прав у ИМЯ\`).

Хранилище содержит записи с номерами от 1 до 10. Команды: \`get N\` — печатает \`запись N\` или бросает \`NotFound\`; \`delete N имя\` — удалять может только \`admin\` (иначе \`Denied\`), удаление несуществующей записи — \`NotFound\`, успех печатает \`удалена N\`. Удалённые записи больше не существуют. Каждую команду выполняйте в \`try\` и перехватывайте \`const AppError &\`, печатая \`[код] сообщение\`.`,
      constraints: ['Команд не больше 50.'],
      hints: [
        'class NotFound : public AppError { public: explicit NotFound(int n) : AppError("нет записи " + std::to_string(n)) {} int code() const override { return 404; } };',
        'Перехват по ссылке сохраняет и сообщение, и переопределённый code(). По значению оба превратились бы в базовые.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <set>
#include <stdexcept>
#include <string>

class AppError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;

    virtual int code() const {
        return 500;
    }
};

class NotFound : public AppError {
public:
    explicit NotFound(int n) : AppError("нет записи " + std::to_string(n)) {}

    int code() const override {
        return 404;
    }
};

class Denied : public AppError {
public:
    explicit Denied(const std::string &user) : AppError("нет прав у " + user) {}

    int code() const override {
        return 403;
    }
};

class Storage {
public:
    Storage() {
        for (int i = 1; i <= 10; i++) {
            records_.insert(i);
        }
    }

    void get(int n) const {
        if (!records_.contains(n)) {
            throw NotFound(n);
        }
        std::println("запись {}", n);
    }

    void remove(int n, const std::string &user) {
        if (user != "admin") {
            throw Denied(user);
        }
        if (records_.erase(n) == 0) {
            throw NotFound(n);
        }
        std::println("удалена {}", n);
    }

private:
    std::set<int> records_;
};

int main() {
    Storage storage;
    std::string command;
    while (std::cin >> command) {
        int n;
        std::cin >> n;
        std::string user;
        if (command == "delete") {
            std::cin >> user;
        }
        try {
            if (command == "get") {
                storage.get(n);
            } else {
                storage.remove(n, user);
            }
        } catch (const AppError &e) {
            std::println("[{}] {}", e.code(), e.what());
        }
    }
    return 0;
}`,
      explanation: `
Исключения — тоже полиморфные объекты. Перехват по константной ссылке видит настоящий объект: \`code()\` вызывается у \`NotFound\` или \`Denied\`, а \`what()\` возвращает их сообщения. При \`catch (AppError e)\` исключение копировалось бы в объект \`AppError\`, и код всегда был бы 500.

Проверка прав стоит раньше проверки существования: пользователь без прав не должен узнавать, какие записи есть. \`records_.erase(n)\` возвращает число удалённых элементов, и ноль означает, что записи не было.`,
      examples: [
        {
          in: 'get 3\ndelete 3 bob\ndelete 3 admin\nget 3\n',
          out: 'запись 3\n[403] нет прав у bob\nудалена 3\n[404] нет записи 3\n',
        },
        { in: 'get 11\n', out: '[404] нет записи 11\n' },
      ],
      hidden: [
        { in: 'delete 99 admin\n', name: 'Удалить несуществующую' },
        { in: 'delete 99 bob\n', name: 'Права проверяются первыми' },
        { in: 'get 1\nget 10\n', name: 'Границы' },
        { in: 'get 0\n', name: 'Ноль' },
        { in: 'delete 5 admin\ndelete 5 admin\n', name: 'Двойное удаление' },
        { in: 'delete 1 Admin\n', name: 'Регистр имени' },
        { in: 'delete 2 admin\nget 2\nget 4\n', name: 'После удаления' },
        { in: 'get -1\ndelete 7 guest\n', name: 'Две ошибки' },
      ],
    },
    {
      title: 'Найди ошибку: потерянный голос',
      bug: true,
      description: `
Музыканты играют на гитаре (\`дзынь\`), барабане (\`бум\`) или «просто инструменте» (\`тишина\`). Строки ввода: \`guitar|drum|other владелец раз\`. Функция \`perform\` печатает \`владелец: звук звук …\`:

\`\`\`text
Ада: дзынь дзынь
\`\`\`

Все инструменты звучат как «тишина». Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 20; раз от 1 до 5.'],
      hints: [
        'Как функция perform получает инструмент — и что остаётся от гитары в этой копии?',
        'Параметр по значению базового типа обрезает наследника. Принимайте const Instrument &.',
      ],
      starter: VOICE(false),
      solution: VOICE(true),
      explanation: `
\`perform(Instrument i, …)\` получает **копию базовой части** гитары: владелец сохраняется (он в базе), а гитарная таблица виртуальных функций — нет. Внутри функции \`i\` — просто \`Instrument\`, и \`play()\` возвращает «тишина». Компилятор не предупреждает: копирование наследника в базу законно.

С параметром \`const Instrument &\` функция видит сам объект, и виртуальный вызов выбирает версию гитары или барабана. Чтобы такая ошибка стала ошибкой компиляции, в базе можно удалить копирующий конструктор.`,
      examples: [
        { in: 'guitar Ада 2\n', out: 'Ада: дзынь дзынь\n' },
        { in: 'drum Алан 1\nother Грейс 1\n', out: 'Алан: бум\nГрейс: тишина\n' },
      ],
      hidden: [
        'drum a 3\n',
        'guitar b 1\n',
        'other c 2\n',
        'guitar x 5\ndrum y 5\n',
        'drum Иван 2\n',
        'guitar Ольга 3\nother Пётр 1\n',
        'drum d 1\nguitar g 1\n',
        'guitar solo 4\n',
      ],
    },
    {
      title: 'Шаблоны документов',
      difficulty: 'advanced',
      description: `
Реестр хранит **прототипы** документов по имени: \`std::map<std::string, std::unique_ptr<Document>>\`. Абстрактный \`Document\` — с удалённым копированием, чисто виртуальными \`clone()\` и \`describe()\` и методом \`set_number(int)\`. Наследники: \`Letter\` (адресат) — описание \`письмо №N для X\`; \`Invoice\` (сумма) — \`счёт №N на S руб.\`.

Команды:

- \`letter имя адресат\`, \`invoice имя сумма\` — зарегистрировать прототип под именем;
- \`new имя\` — создать документ из прототипа через \`clone()\`, присвоить ему номер (общая нумерация, с 1) и напечатать описание; если прототипа нет — \`нет шаблона имя\`;
- \`count\` — сколько документов создано.

Изменение номера копии не должно затрагивать прототип.`,
      constraints: ['Команд не больше 50; суммы до 10⁹.'],
      hints: [
        'Document хранит номер в закрытом поле с protected-доступом для описаний; clone у письма: auto copy = std::make_unique<Letter>(to_); copy->set_number(number()); return copy;.',
        'Созданные документы храните в векторе unique_ptr — так «count» сводится к size().',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Document {
public:
    Document() = default;
    virtual ~Document() = default;
    Document(const Document &) = delete;
    Document &operator=(const Document &) = delete;

    virtual std::unique_ptr<Document> clone() const = 0;
    virtual std::string describe() const = 0;

    void set_number(int n) {
        number_ = n;
    }

protected:
    int number() const {
        return number_;
    }

private:
    int number_ = 0;
};

class Letter final : public Document {
public:
    explicit Letter(std::string to) : to_(std::move(to)) {}

    std::unique_ptr<Document> clone() const override {
        auto copy = std::make_unique<Letter>(to_);
        copy->set_number(number());
        return copy;
    }

    std::string describe() const override {
        return "письмо №" + std::to_string(number()) + " для " + to_;
    }

private:
    std::string to_;
};

class Invoice final : public Document {
public:
    explicit Invoice(long long sum) : sum_(sum) {}

    std::unique_ptr<Document> clone() const override {
        auto copy = std::make_unique<Invoice>(sum_);
        copy->set_number(number());
        return copy;
    }

    std::string describe() const override {
        return "счёт №" + std::to_string(number()) + " на " + std::to_string(sum_) + " руб.";
    }

private:
    long long sum_;
};

int main() {
    std::map<std::string, std::unique_ptr<Document>> prototypes;
    std::vector<std::unique_ptr<Document>> created;
    std::string command;
    while (std::cin >> command) {
        if (command == "count") {
            std::println("{}", created.size());
            continue;
        }
        std::string name;
        std::cin >> name;
        if (command == "letter") {
            std::string to;
            std::cin >> to;
            prototypes[name] = std::make_unique<Letter>(to);
        } else if (command == "invoice") {
            long long sum;
            std::cin >> sum;
            prototypes[name] = std::make_unique<Invoice>(sum);
        } else {
            auto it = prototypes.find(name);
            if (it == prototypes.end()) {
                std::println("нет шаблона {}", name);
                continue;
            }
            auto doc = it->second->clone();
            doc->set_number(static_cast<int>(created.size()) + 1);
            std::println("{}", doc->describe());
            created.push_back(std::move(doc));
        }
    }
    return 0;
}`,
      explanation: `
Реестр не знает видов документов: он хранит прототипы через указатель на базу и создаёт новые документы их \`clone()\`. Каждая копия — самостоятельный объект: номер, присвоенный копии, не меняет прототип, поэтому следующий документ из того же шаблона снова получает только свой номер.

Копирование базы удалено, и случайно скопировать документ «срезкой» невозможно. Повторная регистрация шаблона под тем же именем заменяет прототип: старый \`unique_ptr\` в словаре удаляет прежний объект.`,
      examples: [
        {
          in: 'letter приглашение Ада\ninvoice аренда 50000\nnew приглашение\nnew аренда\nnew приглашение\ncount\n',
          out: 'письмо №1 для Ада\nсчёт №2 на 50000 руб.\nписьмо №3 для Ада\n3\n',
        },
        { in: 'new x\ncount\n', out: 'нет шаблона x\n0\n' },
      ],
      hidden: [
        { in: 'invoice a 1\nnew a\nnew a\n', name: 'Два счёта' },
        { in: 'letter a X\nletter a Y\nnew a\n', name: 'Замена шаблона' },
        { in: 'count\n', name: 'Ничего' },
        { in: 'letter l Bob\nnew l\nnew m\nnew l\n', name: 'Пропуск неизвестного' },
        { in: 'invoice big 1000000000\nnew big\n', name: 'Большая сумма' },
        { in: 'letter a A\ninvoice b 5\nnew b\nnew a\ncount\n', name: 'Порядок' },
        { in: 'letter приказ Отдел\nnew приказ\ncount\n', name: 'Кириллица' },
        { in: 'invoice x 0\nnew x\nnew x\nnew x\ncount\n', name: 'Нулевой счёт' },
      ],
    },
  ],
};
