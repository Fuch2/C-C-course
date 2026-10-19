const LABELS = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Label {
public:
    Label(const std::string &text, int x) : text_(text), x_(x) {}

    void print() const {
        std::println("{} @ {}", text_, x_);
    }

private:
    ${fixed ? 'std::string text_;' : 'const std::string &text_;'}
    int x_;
};

int main() {
    std::vector<Label> labels;
    while (true) {
        std::string text;
        int x;
        if (!(std::cin >> text >> x)) {
            break;
        }
        labels.emplace_back(text, x);
    }
    for (const Label &label : labels) {
        label.print();
    }
    return 0;
}`;

export default {
  id: 'lifetime-rule-of-zero',
  title: 'Правило нуля',
  description:
    'Предметные классы не объявляют ни одной специальной функции: поля-владельцы — строки, контейнеры, умные указатели — сами копируются, перемещаются и освобождаются; управление ресурсом выносится в отдельный маленький класс по правилу пяти; поле unique_ptr делает класс только перемещаемым; поля-ссылки ломают правило нуля; исключение для полиморфной базы; std::indirect и std::polymorphic из C++26.',
  moduleId: 'cpp-lifetime',
  order: 17,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-rule-of-five'],
  objectives: [
    'Строить классы из полей-владельцев без специальных функций',
    'Отделять управление ресурсом от предметной логики',
    'Понимать, как ограничения полей переходят на класс',
    'Узнавать поля, которые не владеют и ломают правило нуля',
  ],
  tags: ['C++23', 'Время жизни', 'Правило нуля', 'RAII', 'unique_ptr'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что говорит правило нуля?',
      options: [
        'Предметные классы не объявляют специальных функций — поля сами управляют ресурсами',
        'Классы не должны иметь полей',
        'Все специальные функции нужно объявлять = delete',
        'Указатели должны быть нулевыми',
      ],
      correct: 0,
      explain: 'Неявные функции класса вызывают функции полей.',
    },
    {
      q: 'Класс содержит поля std::string и std::vector<int>. Что делает его неявное копирование?',
      options: [
        'Глубокие копии строки и вектора',
        'Копирует адреса буферов',
        'Ничего',
        'Ошибку компиляции',
      ],
      correct: 0,
      explain: 'Каждое поле копируется своим конструктором копирования.',
    },
    {
      q: 'Класс содержит поле std::unique_ptr<int>. Что можно с ним делать без собственных специальных функций?',
      options: [
        'Перемещать, но не копировать',
        'Копировать и перемещать',
        'Только копировать',
        'Ни то ни другое',
      ],
      correct: 0,
      explain: 'Ограничение поля переходит на класс автоматически.',
    },
    {
      q: 'Какие поля ломают правило нуля? Выберите все.',
      options: [
        'Сырой указатель-владелец',
        'Ссылка на строку',
        'std::string_view на чужие данные',
        'std::vector<std::string>',
      ],
      correct: [0, 1, 2],
      explain: 'Вектор строк — владелец, с ним всё работает.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Bag {
    std::vector<std::string> items;
};

int main() {
    Bag a{{"x", "y"}};
    Bag b = a;
    b.items.push_back("z");
    Bag c = std::move(b);
    std::println("{} {}", a.items.size(), c.items.size());
    return 0;
}`,
      lang: 'cpp',
      answers: ['2 3'],
      placeholder: 'Вывод программы',
      explain: 'Копия независима, перемещение забирает вектор b целиком.',
    },
    {
      q: 'Предметному классу понадобился деструктор. О чём это сигнализирует?',
      options: [
        'Внутри прячется ресурс, который стоит вынести в отдельный класс-владелец',
        'Всё в порядке',
        'Нужно сделать деструктор виртуальным',
        'Нужно удалить все поля',
      ],
      correct: 0,
      explain: 'Владелец по правилу пяти, предметный класс по правилу нуля.',
    },
    {
      q: 'Какое исключение из правила нуля оправдано?',
      options: [
        'Полиморфная база с виртуальным деструктором',
        'Класс с полем std::string',
        'Класс с полем int',
        'Структура данных без методов',
      ],
      correct: 0,
      explain: 'Ей нужен виртуальный деструктор; копирование базы при этом обычно запрещают.',
    },
    {
      q: 'Как называется шаблон C++26 — владелец объекта в куче с семантикой значения (глубоко копируется)? std::…',
      answers: ['indirect', 'std::indirect', 'polymorphic', 'std::polymorphic'],
      placeholder: 'Имя',
      explain: 'std::indirect<T> для конкретного типа, std::polymorphic<T> — для иерархий.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-rule-of-zero-exercise',
      title: 'Журнал',
      difficulty: 'beginner',
      description: `
Структура \`Log\` хранит название (\`std::string\`), записи (\`std::vector<std::string>\`) и теги (\`std::set<std::string>\`). Никаких специальных функций — только поля.

Журналы хранятся в \`std::map<std::string, Log>\`. Команды:

- \`new L название\` — создать (пересоздать) журнал;
- \`write L текст\` — добавить запись;
- \`tag L тег\` — добавить тег;
- \`copy M L\` — журнал M становится копией L;
- \`move M L\` — M забирает содержимое L, а L удаляется из словаря;
- \`show L\` — \`L «название»: N записей, теги: a, b\` (теги по алфавиту, нет тегов — \`—\`) или \`L: нет\`.`,
      constraints: [
        'Команд не больше 300; write, tag, copy и move ссылаются на существующие журналы.',
      ],
      hints: [
        'Копия: logs.insert_or_assign(M, logs.at(L)); перемещение: Log tmp = std::move(logs.at(L)); logs.erase(L); logs.insert_or_assign(M, std::move(tmp));',
        'Если хочется написать деструктор или конструктор копирования — остановитесь: поля уже умеют всё сами.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <set>
#include <string>
#include <utility>
#include <vector>

struct Log {
    std::string title;
    std::vector<std::string> entries;
    std::set<std::string> tags;
};

int main() {
    std::map<std::string, Log> logs;
    std::string command, l;
    while (std::cin >> command >> l) {
        if (command == "new") {
            std::string title;
            std::cin >> title;
            logs.insert_or_assign(l, Log{title, {}, {}});
        } else if (command == "write") {
            std::string text;
            std::cin >> text;
            logs.at(l).entries.push_back(text);
        } else if (command == "tag") {
            std::string tag;
            std::cin >> tag;
            logs.at(l).tags.insert(tag);
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            logs.insert_or_assign(l, logs.at(from));
        } else if (command == "move") {
            std::string from;
            std::cin >> from;
            Log tmp = std::move(logs.at(from));
            logs.erase(from);
            logs.insert_or_assign(l, std::move(tmp));
        } else if (auto it = logs.find(l); it == logs.end()) {
            std::println("{}: нет", l);
        } else {
            std::string tags;
            for (const std::string &t : it->second.tags) {
                tags += (tags.empty() ? "" : ", ") + t;
            }
            std::println("{} «{}»: {} записей, теги: {}", l, it->second.title, it->second.entries.size(),
                         tags.empty() ? "—" : tags);
        }
    }
    return 0;
}`,
      explanation: `
\`Log\` — агрегат из трёх владельцев, и всё, что с ним делает программа, — копирование, перемещение, присваивание, уничтожение — выполняют неявные функции, вызывающие функции полей. Копия журнала независима от оригинала, перемещение передаёт буферы без копирования, а LeakSanitizer молчит без единой строки кода очистки.

\`move M M\` тоже безопасен: временный объект забирает содержимое, элемент удаляется и вставляется заново.`,
      examples: [
        {
          in: 'new a Работа\nwrite a задача\ntag a срочно\ncopy b a\nwrite b ещё\nmove c a\nshow a\nshow b\nshow c\n',
          out: 'a: нет\nb «Работа»: 2 записей, теги: срочно\nc «Работа»: 1 записей, теги: срочно\n',
        },
        { in: 'new x Пусто\nshow x\n', out: 'x «Пусто»: 0 записей, теги: —\n' },
      ],
      hidden: [
        { in: 'show z\n', name: 'Несуществующий' },
        { in: 'new a A\ntag a b\ntag a a\ntag a b\nshow a\n', name: 'Теги по алфавиту' },
        { in: 'new a A\nwrite a 1\ncopy a a\nshow a\n', name: 'Копия в себя' },
        { in: 'new a A\nwrite a 1\nmove a a\nshow a\n', name: 'Перемещение в себя' },
        { in: 'new a A\nnew b B\nwrite b x\ncopy b a\nshow b\n', name: 'Копия поверх' },
        { in: 'new a A\nwrite a 1\nnew a B\nshow a\n', name: 'Пересоздание' },
        { in: 'new a A\nmove b a\nmove c b\nshow b\nshow c\n', name: 'Цепочка перемещений' },
        {
          in: 'new a A\ncopy b a\ntag b t\nwrite a w\nshow a\nshow b\n',
          name: 'Независимость копий',
        },
      ],
    },
    {
      title: 'Сцена',
      description: `
Иерархия фигур: интерфейс \`Shape\` с \`double area() const\`, \`std::unique_ptr<Shape> clone() const\` и виртуальным деструктором; \`Circle(r)\` и \`Rect(w, h)\`. Класс \`Scene\` хранит \`std::vector<std::unique_ptr<Shape>>\` и **не объявляет** специальных функций — поэтому он только перемещаемый. Для копирования напишите метод \`Scene clone() const\`.

Сцены хранятся в \`std::map<std::string, Scene>\` (\`operator[]\` создаёт пустую). Команды:

- \`circle S r\`, \`rect S w h\` — добавить фигуру;
- \`move T S\` — \`scenes[T] = std::move(scenes[S])\`;
- \`clone T S\` — \`scenes[T] = scenes[S].clone()\`;
- \`area S\` — \`S: N фигур, площадь A\` (два знака после точки, π — \`std::numbers::pi\`).`,
      constraints: ['Команд не больше 300; размеры от 0 до 1000.'],
      hints: [
        'Scene clone() const { Scene copy; for (const auto &s : shapes_) copy.shapes_.push_back(s->clone()); return copy; }',
        'Попробуйте написать scenes[T] = scenes[S]; — компилятор откажется: копирующее присваивание Scene удалено из-за поля unique_ptr.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <numbers>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::unique_ptr<Shape> clone() const = 0;
};

class Circle final : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override {
        return std::numbers::pi * r_ * r_;
    }
    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Circle>(r_);
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
    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Rect>(w_, h_);
    }

private:
    double w_, h_;
};

class Scene {
public:
    void add(std::unique_ptr<Shape> shape) {
        shapes_.push_back(std::move(shape));
    }

    Scene clone() const {
        Scene copy;
        for (const auto &s : shapes_) {
            copy.shapes_.push_back(s->clone());
        }
        return copy;
    }

    std::size_t size() const {
        return shapes_.size();
    }

    double area() const {
        double sum = 0;
        for (const auto &s : shapes_) {
            sum += s->area();
        }
        return sum;
    }

private:
    std::vector<std::unique_ptr<Shape>> shapes_;
};

int main() {
    std::map<std::string, Scene> scenes;
    std::string command, s;
    while (std::cin >> command >> s) {
        if (command == "circle") {
            double r;
            std::cin >> r;
            scenes[s].add(std::make_unique<Circle>(r));
        } else if (command == "rect") {
            double w, h;
            std::cin >> w >> h;
            scenes[s].add(std::make_unique<Rect>(w, h));
        } else if (command == "move" || command == "clone") {
            std::string from;
            std::cin >> from;
            if (command == "move") {
                scenes[s] = std::move(scenes[from]);
            } else {
                scenes[s] = scenes[from].clone();
            }
        } else {
            const Scene &scene = scenes[s];
            std::println("{}: {} фигур, площадь {:.2f}", s, scene.size(), scene.area());
        }
    }
    return 0;
}`,
      explanation: `
Поле \`std::vector<std::unique_ptr<Shape>>\` определяет поведение всего класса: перемещение сцены передаёт вектор указателей, копирование запрещено, уничтожение удаляет все фигуры через виртуальный деструктор. Ни одной специальной функции \`Scene\` не объявляет.

Копию, которая нужна предметной логике, даёт отдельный метод \`clone\`: он явно говорит читателю, что копирование дорогое и глубокое. В C++26 вектор \`std::polymorphic<Shape>\` позволил бы копировать сцену обычным присваиванием.`,
      examples: [
        {
          in: 'circle A 1\nrect A 2 3\nclone B A\nrect B 1 1\nmove C A\narea A\narea B\narea C\n',
          out: 'A: 0 фигур, площадь 0.00\nB: 3 фигур, площадь 10.14\nC: 2 фигур, площадь 9.14\n',
        },
        { in: 'area X\n', out: 'X: 0 фигур, площадь 0.00\n' },
      ],
      hidden: [
        { in: 'rect A 10 10\nclone A A\narea A\n', name: 'Клон в себя' },
        { in: 'rect A 3 4\ncircle B 2\nclone A B\narea A\n', name: 'Клон поверх' },
        { in: 'circle A 10\nclone B A\ncircle A 1\narea A\narea B\n', name: 'Независимость клона' },
        { in: 'rect A 1000 1000\nmove B A\nmove C B\narea C\n', name: 'Цепочка перемещений' },
        { in: 'rect A 0 5\ncircle A 0\narea A\n', name: 'Нулевые размеры' },
        { in: 'circle A 2\nrect B 1 1\nmove B A\narea B\n', name: 'Перемещение поверх' },
        { in: 'circle A 1\nclone B A\nclone C B\nclone D C\narea D\n', name: 'Клон клона' },
        { in: 'rect A 2 2\nrect A 3 3\nrect A 4 4\narea A\n', name: 'Три прямоугольника' },
      ],
    },
    {
      title: 'Найди ошибку: ярлыки без владельца',
      bug: true,
      description: `
Каждая пара ввода — текст ярлыка и координата x. Программа создаёт ярлыки в векторе и печатает их в формате \`текст @ x\`. Класс \`Label\` следует правилу нуля — у него нет специальных функций, — но AddressSanitizer сообщает об ошибке при печати. Найдите и исправьте её.`,
      constraints: ['Пар не больше 100.'],
      hints: [
        'Чем владеет Label? Куда указывает поле text_ после окончания итерации цикла?',
        'Правило нуля работает только с полями-владельцами: храните std::string, а не ссылку.',
      ],
      starter: LABELS(false),
      solution: LABELS(true),
      explanation: `
Поле \`const std::string &text_\` — ссылка на строку \`text\`, которая живёт одну итерацию цикла. Ярлык переживает её и при печати обращается к уничтоженному объекту: \`stack-use-after-scope\`. Неявное копирование при росте вектора честно копирует ссылку — и копия повисает так же.

Правило нуля предполагает, что поля **владеют** своими данными. Ссылки, \`string_view\` и сырые указатели в полях не владеют, и неявные функции класса не могут сделать их безопасными. Поле \`std::string text_\` исправляет класс без единой специальной функции.`,
      examples: [
        { in: 'Вход 10\nВыход 200\n', out: 'Вход @ 10\nВыход @ 200\n' },
        { in: 'один 1\n', out: 'один @ 1\n' },
      ],
      hidden: [
        'a 0\n',
        'длинный-текст-ярлыка-который-точно-в-куче 5\n',
        'x 1\ny 2\nz 3\n',
        'Кнопка -10\n',
        'p 1\np 2\n',
        'Меню 0\nФайл 10\nПравка 20\nВид 30\n',
        'q 100\n',
        'abc 7\ndef 8\n',
      ],
    },
    {
      title: 'Сессия',
      difficulty: 'advanced',
      description: `
Имитация C-API: \`int open_resource(вид)\` выдаёт номера 1, 2, 3, … и печатает \`открыт вид #N\`; \`void close_resource(int id)\` печатает \`закрыт #N\`.

1. Напишите маленький владелец \`Handle\` по правилу пяти: хранит номер (0 — пусто), закрывает его в деструкторе и при замене перемещающим присваиванием, копирование запрещено.
2. Напишите \`Session\` по правилу **нуля**: поля \`std::string user_\`, \`Handle connection_\` («соединение»), \`Handle log_\` («журнал»), открываемые в конструкторе \`Session(user)\` в этом порядке. Никаких специальных функций.

Сессии хранятся в \`std::map<std::string, Session>\`. Команды:

- \`start S пользователь\` — \`insert_or_assign(S, Session(пользователь))\`;
- \`move S T\` — перенести сессию S под имя T: \`Session tmp = std::move(sessions.at(S)); sessions.erase(S); sessions.insert_or_assign(T, std::move(tmp));\`;
- \`end S\` — \`erase(S)\`;
- \`who S\` — \`S: пользователь\` или \`S: нет сессии\`.

В конце удаляйте оставшиеся сессии от последнего имени к первому.`,
      constraints: ['Команд не больше 200; move и end ссылаются на существующие сессии; T ≠ S.'],
      hints: [
        'Порядок закрытия при уничтожении Session — обратный порядку объявления полей: сначала журнал, потом соединение.',
        'Замена существующей сессии перемещающим присваиванием Session (неявным!) по очереди присваивает поля: connection_ закрывает старое соединение, затем log_ — старый журнал.',
      ],
      solution: String.raw`
#include <iostream>
#include <iterator>
#include <map>
#include <print>
#include <string>
#include <utility>

int open_resource(const std::string &kind) {
    static int next = 1;
    std::println("открыт {} #{}", kind, next);
    return next++;
}

void close_resource(int id) {
    std::println("закрыт #{}", id);
}

class Handle {
public:
    Handle() = default;
    explicit Handle(int id) : id_(id) {}
    ~Handle() {
        reset();
    }
    Handle(const Handle &) = delete;
    Handle &operator=(const Handle &) = delete;
    Handle(Handle &&other) noexcept : id_(std::exchange(other.id_, 0)) {}
    Handle &operator=(Handle &&other) noexcept {
        if (this != &other) {
            reset();
            id_ = std::exchange(other.id_, 0);
        }
        return *this;
    }

private:
    void reset() {
        if (id_ != 0) {
            close_resource(std::exchange(id_, 0));
        }
    }

    int id_ = 0;
};

class Session {
public:
    explicit Session(std::string user)
        : user_(std::move(user)), connection_(open_resource("соединение")), log_(open_resource("журнал")) {}

    const std::string &user() const {
        return user_;
    }

private:
    std::string user_;
    Handle connection_;
    Handle log_;
};

int main() {
    std::map<std::string, Session> sessions;
    std::string command, s;
    while (std::cin >> command >> s) {
        if (command == "start") {
            std::string user;
            std::cin >> user;
            sessions.insert_or_assign(s, Session(user));
        } else if (command == "move") {
            std::string to;
            std::cin >> to;
            Session tmp = std::move(sessions.at(s));
            sessions.erase(s);
            sessions.insert_or_assign(to, std::move(tmp));
        } else if (command == "end") {
            sessions.erase(s);
        } else if (auto it = sessions.find(s); it != sessions.end()) {
            std::println("{}: {}", s, it->second.user());
        } else {
            std::println("{}: нет сессии", s);
        }
    }
    while (!sessions.empty()) {
        sessions.erase(std::prev(sessions.end()));
    }
    return 0;
}`,
      explanation: `
Вся работа с ресурсом сосредоточена в \`Handle\` — пятнадцать строк по правилу пяти. \`Session\` о ресурсах не знает ничего: её неявные перемещающие операции перемещают поля, неявное копирование удалено (поле \`Handle\` некопируемо), а неявный деструктор закрывает журнал и соединение в обратном порядке. Добавьте в сессию третий ресурс — и ни одна строка, кроме конструктора, не изменится.

Переносимая сессия не закрывает ресурсов — они переходят к новому владельцу; закрываются только ресурсы сессии, которую заменили.`,
      examples: [
        {
          in: 'start a Ада\nstart b Алан\nwho a\nend a\nwho a\n',
          out: 'открыт соединение #1\nоткрыт журнал #2\nоткрыт соединение #3\nоткрыт журнал #4\na: Ада\nзакрыт #2\nзакрыт #1\na: нет сессии\nзакрыт #4\nзакрыт #3\n',
        },
        {
          in: 'start a X\nmove a b\nwho a\nwho b\n',
          out: 'открыт соединение #1\nоткрыт журнал #2\na: нет сессии\nb: X\nзакрыт #2\nзакрыт #1\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'start a X\nstart a Y\nwho a\n', name: 'Замена сессии' },
        { in: 'start a X\nstart b Y\nmove a b\nwho b\n', name: 'Перенос поверх существующей' },
        { in: 'start a X\nend a\nstart a Y\n', name: 'Повторный старт' },
        { in: 'start z 1\nstart a 2\nstart m 3\n', name: 'Закрытие в конце по именам' },
        { in: 'start a X\nmove a b\nmove b c\nmove c d\nwho d\n', name: 'Цепочка переносов' },
        { in: 'who x\n', name: 'Нет сессий' },
        { in: 'start a P\nstart b Q\nend b\nend a\n', name: 'Ручное завершение' },
      ],
    },
  ],
};
