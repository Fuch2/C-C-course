const PRIVATE_BASE = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Member {
public:
    Member(std::string name, int points) : name_(std::move(name)), points_(points) {}

    const std::string &name() const {
        return name_;
    }

    int points() const {
        return points_;
    }

private:
    std::string name_;
    int points_;
};

class VipMember : ${fixed ? 'public ' : ''}Member {
public:
    VipMember(std::string name, int points) : Member(std::move(name), points) {}

    int bonus() const {
        return points() / 10;
    }
};

void print_card(const Member &m) {
    std::println("{}: {} баллов", m.name(), m.points());
}

int main() {
    std::string kind, name;
    int points;
    while (std::cin >> kind >> name >> points) {
        if (kind == "vip") {
            VipMember v(name, points);
            print_card(v);
            std::println("  бонус {}", v.bonus());
        } else {
            print_card(Member(name, points));
        }
    }
    return 0;
}`;

export default {
  id: 'oop-public-inheritance',
  title: 'Публичное наследование и подстановка',
  description:
    'Объект наследника там, где ждут базу: неявное преобразование ссылок и указателей вверх по иерархии; что видно через ссылку на базу; виды наследования public, protected, private и закрытое наследование по умолчанию у class; принцип подстановки Лисков и пример с квадратом и прямоугольником; как проверить отношение «является» по договору.',
  moduleId: 'cpp-oop',
  order: 14,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-inheritance'],
  objectives: [
    'Передавать объекты наследников в функции, принимающие базовый класс',
    'Выбирать вид наследования и не забывать public',
    'Проверять иерархию на принцип подстановки Лисков',
  ],
  tags: ['C++23', 'ООП', 'Наследование', 'LSP', 'SOLID'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Animal {
    int legs = 4;
};

struct Bird : Animal {
    Bird() { legs = 2; }
    int wings = 2;
};

int count_legs(const Animal &a) { return a.legs; }

int main() {
    Bird b;
    Animal a;
    std::println("{} {}", count_legs(b), count_legs(a));
    return 0;
}`,
      lang: 'cpp',
      answers: ['2 4'],
      placeholder: 'Вывод программы',
      explain: 'Ссылка на Animal указывает на базовую часть птицы, где legs = 2.',
    },
    {
      q: 'Какое преобразование происходит неявно при открытом наследовании?',
      options: [
        'Manager & → Employee & (от наследника к базе)',
        'Employee & → Manager & (от базы к наследнику)',
        'Manager → int',
        'Никакое',
      ],
      correct: 0,
      explain:
        'Внутри наследника есть базовая часть, и ссылка на базу указывает на неё. Обратное неверно: не каждый сотрудник — руководитель.',
    },
    {
      q: 'Что видно через ссылку const Employee &e, указывающую на объект Manager?',
      options: [
        'Только интерфейс Employee',
        'Всё, что есть у Manager',
        'Только поля Manager',
        'Ничего',
      ],
      correct: 0,
      explain: 'Тип ссылки определяет доступный интерфейс; e.team() не скомпилируется.',
    },
    {
      q: 'Какое наследование получается в записи class Manager : Employee { … }; без слова public?',
      options: [
        'Закрытое (private)',
        'Открытое (public)',
        'Защищённое (protected)',
        'Ошибка компиляции',
      ],
      correct: 0,
      explain: 'У class по умолчанию private, у struct — public. Пишите public явно.',
    },
    {
      q: 'Что утверждает принцип подстановки Лисков?',
      options: [
        'Объект наследника должен годиться везде, где годится объект базы, выполняя её договор',
        'Наследник должен переопределять все методы базы',
        'База не может иметь больше трёх наследников',
        'Наследник должен иметь больше полей, чем база',
      ],
      correct: 0,
      explain:
        'Наследник не требует больше (предусловия не строже) и не обещает меньше (постусловия не слабее).',
    },
    {
      q: 'Почему изменяемый Square — плохой наследник изменяемого Rectangle?',
      options: [
        'Договор прямоугольника — независимые ширина и высота — квадрат выполнить не может',
        'Квадрат не является прямоугольником в геометрии',
        'У квадрата меньше полей',
        'C++ запрещает такое наследование',
      ],
      correct: 0,
      explain:
        'Клиенты Rectangle сломаются на квадрате. Решения — отдельный класс или неизменяемые фигуры.',
    },
    {
      q: 'Какие признаки говорят о нарушении принципа подстановки? Выберите все.',
      options: [
        'Метод наследника бросает исключение там, где база работает',
        'Наследник требует от аргументов больше, чем база',
        'Наследник «отключает» метод базы пустой реализацией',
        'Наследник добавляет новый метод',
      ],
      correct: [0, 1, 2],
      explain: 'Новые методы договор базы не нарушают.',
    },
    {
      q: 'Какое сообщение выдаст GCC при передаче объекта закрыто унаследованного класса в функцию, принимающую ссылку на базу? Ключевые слова:',
      options: [
        'inaccessible base',
        'undefined reference',
        'ambiguous overload',
        'no matching constructor',
      ],
      correct: 0,
      explain: "Полностью: 'Employee' is an inaccessible base of 'Manager'.",
    },
  ],
  exercises: [
    {
      id: 'oop-public-inheritance-exercise',
      title: 'Бейджи',
      difficulty: 'beginner',
      description: `
Опишите класс \`Employee\` (имя, должность) и двух открытых наследников: \`Manager\` (добавляет размер команды) и \`Intern\` (добавляет имя наставника). Напишите **одну** функцию \`void print_badge(const Employee &e)\`, которая печатает \`[имя | должность]\`.

Строки ввода: \`emp имя должность\`, \`mgr имя должность команда\`, \`int имя должность наставник\`. Для каждой напечатайте бейдж через \`print_badge\`; для руководителя ниже — \`  команда: N\`, для стажёра — \`  наставник: имя\`.`,
      constraints: ['Строк не больше 30; все слова без пробелов.'],
      hints: [
        'print_badge принимает const Employee & — в неё можно передать и Manager, и Intern.',
        'Дополнительные строки печатайте в main: через ссылку на Employee методы team() и mentor() не видны.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Employee {
public:
    Employee(std::string name, std::string title) : name_(std::move(name)), title_(std::move(title)) {}

    const std::string &name() const {
        return name_;
    }

    const std::string &title() const {
        return title_;
    }

private:
    std::string name_;
    std::string title_;
};

class Manager : public Employee {
public:
    Manager(std::string name, std::string title, int team) : Employee(std::move(name), std::move(title)), team_(team) {}

    int team() const {
        return team_;
    }

private:
    int team_;
};

class Intern : public Employee {
public:
    Intern(std::string name, std::string title, std::string mentor)
        : Employee(std::move(name), std::move(title)), mentor_(std::move(mentor)) {}

    const std::string &mentor() const {
        return mentor_;
    }

private:
    std::string mentor_;
};

void print_badge(const Employee &e) {
    std::println("[{} | {}]", e.name(), e.title());
}

int main() {
    std::string kind, name, title;
    while (std::cin >> kind >> name >> title) {
        if (kind == "mgr") {
            int team;
            std::cin >> team;
            Manager m(name, title, team);
            print_badge(m);
            std::println("  команда: {}", m.team());
        } else if (kind == "int") {
            std::string mentor;
            std::cin >> mentor;
            Intern i(name, title, mentor);
            print_badge(i);
            std::println("  наставник: {}", i.mentor());
        } else {
            print_badge(Employee(name, title));
        }
    }
    return 0;
}`,
      explanation: `
\`print_badge\` написана один раз для базы и работает с любым наследником: ей нужен только интерфейс \`Employee\`. Появится завтра \`Contractor\` — функция подойдёт и для него без изменений.

Особенности наследников — команда и наставник — через ссылку на базу не видны, поэтому их печатает \`main\`, который знает конкретный тип.`,
      examples: [
        {
          in: 'emp Ада аналитик\nmgr Алан руководитель 4\n',
          out: '[Ада | аналитик]\n[Алан | руководитель]\n  команда: 4\n',
        },
        { in: 'int Грейс разработчик Ада\n', out: '[Грейс | разработчик]\n  наставник: Ада\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'emp a b\n', name: 'Один сотрудник' },
        { in: 'mgr x y 0\n', name: 'Пустая команда' },
        { in: 'int a b c\nint d e f\n', name: 'Два стажёра' },
        { in: 'mgr Иван директор 100\nemp Пётр инженер\nint Олег инженер Пётр\n', name: 'Отдел' },
        { in: 'emp Ada dev\nmgr Linus lead 12\n', name: 'Латиница' },
        { in: 'int a b a\n', name: 'Наставник с тем же именем' },
        { in: 'mgr m t 7\nmgr n u 8\n', name: 'Два руководителя' },
      ],
    },
    {
      title: 'Документы в архиве',
      description: `
Базовый класс \`Document\` (название, число страниц) и наследники \`Invoice\` (сумма счёта) и \`Contract\` (число сторон). Класс \`Archive\` принимает **любой** документ методом \`void add(const Document &d)\`, запоминая только название и страницы, и умеет печатать опись: названия по алфавиту с числом страниц \`название (N стр.)\` и строку \`страниц всего S\`.

Строки ввода: \`doc название страницы\`, \`inv название страницы сумма\`, \`con название страницы стороны\`. После описи напечатайте \`сумма счетов X\` — её считает \`main\`, а не архив.`,
      constraints: ['Документов не больше 30; названия — одно слово, без повторов.'],
      hints: [
        'Archive хранит std::map<std::string, int> — название → страницы; map сам упорядочит по алфавиту.',
        'archive.add(invoice) работает, потому что Invoice — открытый наследник Document: ссылка на базу указывает на его базовую часть.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

class Document {
public:
    Document(std::string title, int pages) : title_(std::move(title)), pages_(pages) {}

    const std::string &title() const {
        return title_;
    }

    int pages() const {
        return pages_;
    }

private:
    std::string title_;
    int pages_;
};

class Invoice : public Document {
public:
    Invoice(std::string title, int pages, long long amount) : Document(std::move(title), pages), amount_(amount) {}

    long long amount() const {
        return amount_;
    }

private:
    long long amount_;
};

class Contract : public Document {
public:
    Contract(std::string title, int pages, int parties) : Document(std::move(title), pages), parties_(parties) {}

    int parties() const {
        return parties_;
    }

private:
    int parties_;
};

class Archive {
public:
    void add(const Document &d) {
        pages_[d.title()] = d.pages();
    }

    void print() const {
        int total = 0;
        for (const auto &[title, pages] : pages_) {
            std::println("{} ({} стр.)", title, pages);
            total += pages;
        }
        std::println("страниц всего {}", total);
    }

private:
    std::map<std::string, int> pages_;
};

int main() {
    Archive archive;
    long long invoices = 0;
    std::string kind, title;
    int pages;
    while (std::cin >> kind >> title >> pages) {
        if (kind == "inv") {
            long long amount;
            std::cin >> amount;
            Invoice inv(title, pages, amount);
            archive.add(inv);
            invoices += inv.amount();
        } else if (kind == "con") {
            int parties;
            std::cin >> parties;
            archive.add(Contract(title, pages, parties));
        } else {
            archive.add(Document(title, pages));
        }
    }
    archive.print();
    std::println("сумма счетов {}", invoices);
    return 0;
}`,
      explanation: `
Архив зависит только от базового класса: ему нужны название и страницы, и он принимает любой документ. Новые виды документов не потребуют изменений в \`Archive\` — это и есть польза подстановки.

Сумма счетов — знание о конкретном наследнике, поэтому её считает код, который работает с \`Invoice\` напрямую. Архив копирует нужные данные, а не хранит ссылки на документы: временные объекты в \`main\` исчезают сразу после вызова \`add\`.`,
      examples: [
        {
          in: 'inv счёт1 2 15000\ncon договор 12 2\ndoc акт 1\n',
          out: 'акт (1 стр.)\nдоговор (12 стр.)\nсчёт1 (2 стр.)\nстраниц всего 15\nсумма счетов 15000\n',
        },
        { in: '', out: 'страниц всего 0\nсумма счетов 0\n' },
      ],
      hidden: [
        { in: 'doc a 1\n', name: 'Один документ' },
        { in: 'inv a 1 100\ninv b 1 200\n', name: 'Два счёта' },
        { in: 'con b 5 3\ncon a 7 2\n', name: 'Порядок' },
        { in: 'inv x 3 1000000000\ninv y 4 1000000000\n', name: 'Большие суммы' },
        { in: 'doc Z 1\ndoc a 1\n', name: 'Регистр' },
        { in: 'doc письмо 1\ninv счёт 2 500\ncon аренда 20 2\ndoc приказ 3\n', name: 'Офис' },
        { in: 'con c 0 2\n', name: 'Пустой договор' },
        { in: 'inv a 10 0\ndoc b 10\n', name: 'Нулевой счёт' },
      ],
    },
    {
      title: 'Найди ошибку: закрытый наследник',
      bug: true,
      description: `
Программа печатает карточки участников программы лояльности функцией \`print_card(const Member &)\`, а для VIP-участников — ещё и бонус. Строки ввода: \`std имя баллы\` или \`vip имя баллы\`:

\`\`\`text
Ада: 500 баллов
  бонус 50
\`\`\`

Программа не компилируется: компилятор говорит о недоступной базе. Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 20; баллы до 10⁶.'],
      hints: [
        "Сообщение: 'Member' is an inaccessible base of 'VipMember'. Какой вид наследования у class по умолчанию?",
        'Без слова public наследование закрытое, и снаружи VipMember не считается Member. Напишите class VipMember : public Member.',
      ],
      starter: PRIVATE_BASE(false),
      solution: PRIVATE_BASE(true),
      explanation: `
У \`class\` наследование по умолчанию **закрытое**. \`VipMember\` внутри себя пользуется \`Member\`, но снаружи никто не знает, что VIP-участник — это участник: преобразовать \`VipMember &\` в \`const Member &\` нельзя, и вызов \`print_card(v)\` не компилируется.

Отношение «VIP-участник является участником» выражает только открытое наследование: \`class VipMember : public Member\`. Писать \`public\` стоит явно и у \`struct\`, где оно подразумевается, — так намерение видно сразу.`,
      examples: [
        { in: 'vip Ада 500\nstd Алан 30\n', out: 'Ада: 500 баллов\n  бонус 50\nАлан: 30 баллов\n' },
        { in: 'std x 0\n', out: 'x: 0 баллов\n' },
      ],
      hidden: [
        'vip a 9\n',
        'vip b 1000000\n',
        'std a 1\nstd b 2\n',
        'vip Грейс 1234\n',
        'std Иван 77\nvip Ольга 770\n',
        'vip z 10\n',
        'std q 5\nvip w 15\nstd e 25\n',
        'vip m 99\n',
      ],
    },
    {
      title: 'Неизменяемые фигуры',
      difficulty: 'advanced',
      description: `
Решите проблему «квадрат — прямоугольник» без нарушения подстановки. Опишите **неизменяемые** классы \`Rectangle\` (ширина, высота) и \`Square\` (сторона) — без наследования между ними. Вместо сеттеров — методы, возвращающие **новую** фигуру:

- \`Rectangle::with_width(int w) const\` → \`Rectangle\`;
- \`Square::to_rectangle() const\` → \`Rectangle\` с равными сторонами.

Строки ввода: \`rect w h\` или \`square s\`, затем операция: \`widen k\` (ширина умножается на \`k\`) или \`keep\`. Для квадрата \`widen\` выполняется через \`to_rectangle().with_width(…)\`. Напечатайте результат: \`прямоугольник W x H, площадь A\` или \`квадрат S, площадь A\` — фигура, у которой стороны равны, печатается как квадрат.`,
      constraints: ['Строк не больше 30; стороны и k от 1 до 10⁴.'],
      hints: [
        'with_width возвращает Rectangle(w, height_): исходный объект не меняется, поэтому никакой договор нарушить нельзя.',
        'Печать: если у прямоугольника ширина равна высоте, печатайте его как квадрат. Площадь — в long long.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Rectangle {
public:
    Rectangle(int width, int height) : width_(width), height_(height) {}

    Rectangle with_width(int width) const {
        return Rectangle(width, height_);
    }

    int width() const {
        return width_;
    }

    int height() const {
        return height_;
    }

    long long area() const {
        return 1LL * width_ * height_;
    }

private:
    int width_;
    int height_;
};

class Square {
public:
    explicit Square(int side) : side_(side) {}

    Rectangle to_rectangle() const {
        return Rectangle(side_, side_);
    }

private:
    int side_;
};

void print_shape(const Rectangle &r) {
    if (r.width() == r.height()) {
        std::println("квадрат {}, площадь {}", r.width(), r.area());
    } else {
        std::println("прямоугольник {} x {}, площадь {}", r.width(), r.height(), r.area());
    }
}

int main() {
    std::string kind, op;
    while (std::cin >> kind) {
        int a, b = 0;
        std::cin >> a;
        if (kind == "rect") {
            std::cin >> b;
        }
        Rectangle shape = kind == "rect" ? Rectangle(a, b) : Square(a).to_rectangle();
        std::cin >> op;
        if (op == "widen") {
            int k;
            std::cin >> k;
            shape = shape.with_width(shape.width() * k);
        }
        print_shape(shape);
    }
    return 0;
}`,
      explanation: `
Конфликт квадрата и прямоугольника возникает из-за **изменения**: прямоугольник обещает, что ширину можно поменять отдельно, а квадрат не может это обещание выполнить. Неизменяемые объекты ничего не обещают о будущих изменениях — «изменение» создаёт новую фигуру, — и противоречие исчезает.

Связь между фигурами выражена преобразованием \`to_rectangle()\`, а не наследованием: квадрат умеет стать прямоугольником, но не притворяется им. «Растянутый» квадрат честно становится прямоугольником, а прямоугольник с равными сторонами печатается как квадрат.`,
      examples: [
        {
          in: 'square 3 widen 2\nrect 2 5 keep\n',
          out: 'прямоугольник 6 x 3, площадь 18\nпрямоугольник 2 x 5, площадь 10\n',
        },
        {
          in: 'square 4 keep\nrect 3 6 widen 2\n',
          out: 'квадрат 4, площадь 16\nквадрат 6, площадь 36\n',
        },
      ],
      hidden: [
        { in: 'square 1 widen 1\n', name: 'Растяжение в 1 раз' },
        { in: 'rect 10000 10000 keep\n', name: 'Большой квадрат' },
        { in: 'square 10000 widen 10000\n', name: 'Огромная площадь' },
        { in: 'rect 5 1 widen 3\n', name: 'Длинный' },
        { in: 'rect 1 5 widen 5\n', name: 'Стал квадратом' },
        { in: '', name: 'Пусто' },
        { in: 'square 7 keep\nsquare 7 widen 2\n', name: 'Два квадрата' },
        { in: 'rect 2 3 keep\nrect 4 4 keep\n', name: 'Без изменений' },
      ],
    },
  ],
};
