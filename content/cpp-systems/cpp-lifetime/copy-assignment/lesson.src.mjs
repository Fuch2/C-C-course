const TEXT = (fixed) => String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

class Text {
public:
    explicit Text(std::string_view s) : size_(s.size()), data_(new char[s.size()]) {
        std::copy_n(s.data(), size_, data_);
    }
    Text(const Text &other) : size_(other.size_), data_(new char[other.size_]) {
        std::copy_n(other.data_, size_, data_);
    }
${
  fixed
    ? `    Text &operator=(const Text &other) {
        Text copy(other);
        std::swap(size_, copy.size_);
        std::swap(data_, copy.data_);
        return *this;
    }`
    : `    Text &operator=(const Text &other) {
        delete[] data_;
        size_ = other.size_;
        data_ = new char[size_];
        std::copy_n(other.data_, size_, data_);
        return *this;
    }`
}
    ~Text() {
        delete[] data_;
    }

    std::string_view view() const {
        return {data_, size_};
    }

private:
    std::size_t size_;
    char *data_;
};

int main() {
    std::vector<Text> lines;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string word;
            std::cin >> word;
            lines.emplace_back(word);
        } else if (command == "copy") {
            std::size_t to, from;
            std::cin >> to >> from;
            lines[to - 1] = lines[from - 1];
        } else {
            for (std::size_t i = 0; i < lines.size(); ++i) {
                std::println("{}: {}", i + 1, lines[i].view());
            }
        }
    }
    return 0;
}`;

export default {
  id: 'lifetime-copy-assignment',
  title: 'Копирующее присваивание',
  description:
    'Инициализация и присваивание — разные операции; оператор копирующего присваивания T &operator=(const T &) и возврат *this; неявное почленное присваивание; самоприсваивание и исключения как главные ловушки; идиома copy-and-swap для класса, владеющего памятью; строгая гарантия безопасности исключений.',
  moduleId: 'cpp-lifetime',
  order: 7,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-copy-constructor'],
  objectives: [
    'Отличать инициализацию от присваивания',
    'Писать оператор копирующего присваивания по правилам',
    'Применять copy-and-swap для самоприсваивания и исключений',
    'Давать строгую гарантию: при ошибке объект не меняется',
  ],
  tags: ['C++23', 'Время жизни', 'Присваивание', 'copy-and-swap', 'Исключения'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какая строка вызывает оператор копирующего присваивания (a и b — уже существующие объекты типа T)?',
      options: ['b = a;', 'T c = a;', 'T c(a);', 'T c{a};'],
      correct: 0,
      explain: 'Остальные строки создают новый объект — работает конструктор копирования.',
    },
    {
      q: 'Что должен возвращать оператор копирующего присваивания?',
      options: ['*this по ссылке: T &', 'void', 'Копию объекта: T', 'bool — успех операции'],
      correct: 0,
      explain: 'Так работают цепочки a = b = c, как у встроенных типов.',
    },
    {
      q: 'Чем опасна наивная реализация «delete[] data_; затем копирование из other.data_»?',
      options: [
        'При самоприсваивании теряет данные: копирует в себя новый, незаполненный буфер; при исключении в new объект испорчен',
        'Она медленнее copy-and-swap',
        'Она не компилируется',
        'Ничем',
      ],
      correct: 0,
      explain: 'Порядок «сначала копия, потом замена» решает обе проблемы.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>

struct S {
    std::string v;
    S &operator=(const S &o) {
        v += o.v;
        return *this;
    }
};

int main() {
    S a{"x"}, b{"y"}, c{"z"};
    a = b = c;
    std::println("{} {} {}", a.v, b.v, c.v);
    return 0;
}`,
      lang: 'cpp',
      answers: ['xyz yz z'],
      placeholder: 'Вывод программы',
      explain:
        'Присваивание правоассоциативно: сначала b = c (b.v = "yz"), затем a = b (a.v = "xyz"). Такой оператор нарушает смысл присваивания — пример лишь показывает порядок.',
    },
    {
      q: 'В copy-and-swap кто освобождает старый буфер объекта?',
      options: [
        'Деструктор временной копии',
        'Сам оператор через delete[]',
        'Никто — это утечка',
        'Деструктор аргумента other',
      ],
      correct: 0,
      explain: 'После обмена старый буфер принадлежит копии и уходит вместе с ней.',
    },
    {
      q: 'Какую гарантию даёт copy-and-swap?',
      options: [
        'Строгую: если копирование бросит исключение, объект останется прежним',
        'Никакую',
        'Только базовую: объект корректен, но может измениться',
        'Гарантию, что исключений не будет вообще',
      ],
      correct: 0,
      explain:
        'Всё, что может бросить, происходит до изменения *this; обмен указателей и чисел не бросает.',
    },
    {
      q: 'Когда неявного оператора присваивания достаточно?',
      options: [
        'Когда все поля сами правильно присваиваются — строки, контейнеры, числа, умные указатели',
        'Никогда',
        'Только для классов без полей',
        'Когда в классе есть сырой указатель-владелец',
      ],
      correct: 0,
      explain:
        'Сырой указатель-владелец неявный оператор скопирует как адрес — это урок о поверхностном копировании.',
    },
    {
      q: 'Как называется присваивание объекта самому себе, например items[i] = items[j] при i == j?',
      answers: ['самоприсваивание', 'self-assignment'],
      placeholder: 'Одно слово',
      explain: 'Свой оператор присваивания обязан работать и в этом случае.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-copy-assignment-exercise',
      title: 'Места в зале',
      difficulty: 'beginner',
      description: `
Класс \`Ticket\` хранит неизменный номер (1, 2, 3, … в порядке создания), событие и место. Копирующее присваивание переносит **событие и место**, но номер у билета остаётся свой: это «переоформление» билета.

Команды:

- \`new событие место\` — создать билет;
- \`assign i j\` — \`tickets[i] = tickets[j]\` (нумерация с 1);
- \`show i\` — напечатать \`№N событие, место M\`.`,
      constraints: ['Команд не больше 200; индексы существуют; i может совпадать с j.'],
      hints: [
        'Ticket &operator=(const Ticket &other) { event_ = other.event_; seat_ = other.seat_; return *this; } — id_ не трогаем.',
        'Храните билеты в std::deque: при росте std::vector билеты копировались бы конструктором копирования, и номера пришлось бы продумывать и для него.',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Ticket {
public:
    Ticket(std::string event, int seat) : id_(next_id_++), event_(std::move(event)), seat_(seat) {}
    Ticket(const Ticket &) = delete;

    Ticket &operator=(const Ticket &other) {
        event_ = other.event_;
        seat_ = other.seat_;
        return *this;
    }

    void show() const {
        std::println("№{} {}, место {}", id_, event_, seat_);
    }

private:
    static inline int next_id_ = 1;
    int id_;
    std::string event_;
    int seat_;
};

int main() {
    std::deque<Ticket> tickets;
    std::string command;
    while (std::cin >> command) {
        if (command == "new") {
            std::string event;
            int seat;
            std::cin >> event >> seat;
            tickets.emplace_back(event, seat);
        } else if (command == "assign") {
            std::size_t i, j;
            std::cin >> i >> j;
            tickets[i - 1] = tickets[j - 1];
        } else {
            std::size_t i;
            std::cin >> i;
            tickets[i - 1].show();
        }
    }
    return 0;
}`,
      explanation: `
Присваивание меняет **существующий** объект, поэтому у него есть выбор, что сохранить. Номер — идентичность билета, а событие и место — его содержимое; присваивание переносит только содержимое. Самоприсваивание здесь безопасно: присвоить строку и число самим себе можно.

Конструктор копирования запрещён: что должна означать копия билета с тем же номером, решать не пришлось — и \`std::deque\` с \`emplace_back\` прекрасно обходится без него.`,
      examples: [
        {
          in: 'new Концерт 5\nnew Театр 12\nassign 2 1\nshow 1\nshow 2\n',
          out: '№1 Концерт, место 5\n№2 Концерт, место 5\n',
        },
        { in: 'new Матч 1\nassign 1 1\nshow 1\n', out: '№1 Матч, место 1\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        {
          in: 'new a 1\nnew b 2\nnew c 3\nassign 1 3\nassign 3 2\nshow 1\nshow 2\nshow 3\n',
          name: 'Цепочка присваиваний',
        },
        { in: 'new x 10\nshow 1\n', name: 'Без присваиваний' },
        {
          in: 'new a 1\nnew b 2\nassign 1 2\nassign 2 1\nshow 1\nshow 2\n',
          name: 'Присваивание туда и обратно',
        },
        { in: 'new Опера 100\nnew Балет 200\nassign 2 2\nshow 2\n', name: 'Самоприсваивание' },
        {
          in: 'new a 1\nnew b 2\nassign 2 1\nnew c 3\nshow 3\nshow 2\n',
          name: 'Новый после присваивания',
        },
        {
          in: 'new p 7\nnew q 8\nnew r 9\nassign 1 2\nassign 2 3\nassign 3 1\nshow 1\nshow 2\nshow 3\n',
          name: 'Круг',
        },
        { in: 'new e 0\nnew f 999\nassign 1 2\nshow 1\n', name: 'Крайние места' },
      ],
    },
    {
      title: 'Буфер',
      description: `
Класс \`Buffer\` сам владеет массивом \`int\`, выделенным \`new[]\`: конструктор \`Buffer(n, value)\`, конструктор копирования (глубокая копия), деструктор и копирующее присваивание по идиоме copy-and-swap. Есть три буфера \`A\`, \`B\`, \`C\`, вначале пустые (\`Buffer(0, 0)\`).

Команды:

- \`fill X n v\` — \`X = Buffer(n, v)\`;
- \`copy X Y\` — \`X = Y\` (X и Y могут совпадать);
- \`set X i v\` — записать v в элемент i (с нуля, индекс существует);
- \`print X\` — \`X: элементы через пробел\` или \`X: пусто\`.

Программа проверяется с AddressSanitizer и LeakSanitizer: никаких утечек и обращений к освобождённой памяти.`,
      constraints: ['Команд не больше 200; 0 ≤ n ≤ 1000.'],
      hints: [
        'operator=: Buffer copy(other); std::swap(size_, copy.size_); std::swap(data_, copy.data_); return *this;',
        'Буферы удобно держать в std::map<char, Buffer> с try_emplace для начального создания или в трёх переменных и функции, выбирающей ссылку по букве.',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Buffer {
public:
    Buffer(std::size_t size, int fill) : size_(size), data_(new int[size]) {
        std::fill_n(data_, size_, fill);
    }
    Buffer(const Buffer &other) : size_(other.size_), data_(new int[other.size_]) {
        std::copy_n(other.data_, size_, data_);
    }
    Buffer &operator=(const Buffer &other) {
        Buffer copy(other);
        std::swap(size_, copy.size_);
        std::swap(data_, copy.data_);
        return *this;
    }
    ~Buffer() {
        delete[] data_;
    }

    void set(std::size_t i, int value) {
        data_[i] = value;
    }

    std::string text() const {
        if (size_ == 0) {
            return "пусто";
        }
        std::string s;
        for (std::size_t i = 0; i < size_; ++i) {
            s += (i ? " " : "") + std::to_string(data_[i]);
        }
        return s;
    }

private:
    std::size_t size_;
    int *data_;
};

int main() {
    Buffer a(0, 0), b(0, 0), c(0, 0);
    auto pick = [&](char name) -> Buffer & { return name == 'A' ? a : name == 'B' ? b : c; };
    std::string command;
    char x;
    while (std::cin >> command >> x) {
        if (command == "fill") {
            std::size_t n;
            int v;
            std::cin >> n >> v;
            pick(x) = Buffer(n, v);
        } else if (command == "copy") {
            char y;
            std::cin >> y;
            pick(x) = pick(y);
        } else if (command == "set") {
            std::size_t i;
            int v;
            std::cin >> i >> v;
            pick(x).set(i, v);
        } else {
            std::println("{}: {}", x, pick(x).text());
        }
    }
    return 0;
}`,
      explanation: `
Оператор присваивания не содержит ни \`delete[]\`, ни проверки на самоприсваивание. Копия создаётся до изменения \`*this\`, поэтому \`copy A A\` копирует из живого буфера. Обмен двух указателей и двух чисел не может бросить исключение. Старый буфер после обмена принадлежит \`copy\` и освобождается её деструктором при выходе из оператора.

\`fill X n v\` присваивает временный буфер: без перемещающих операций это тоже копирующее присваивание — лишняя копия, которую уберёт семантика перемещения из следующих уроков.`,
      examples: [
        {
          in: 'fill A 3 7\ncopy B A\nset A 0 9\nprint A\nprint B\nprint C\n',
          out: 'A: 9 7 7\nB: 7 7 7\nC: пусто\n',
        },
        { in: 'fill A 2 5\ncopy A A\nprint A\n', out: 'A: 5 5\n' },
      ],
      hidden: [
        { in: 'print A\n', name: 'Пустой буфер' },
        { in: 'fill A 3 1\nfill A 1 2\nprint A\n', name: 'Перезапись меньшим' },
        { in: 'fill A 1 1\nfill A 5 2\nprint A\n', name: 'Перезапись большим' },
        {
          in: 'fill A 2 1\ncopy B A\ncopy C B\nset B 1 8\nprint A\nprint B\nprint C\n',
          name: 'Независимость копий',
        },
        { in: 'fill B 3 3\ncopy B B\ncopy B B\nprint B\n', name: 'Многократное самоприсваивание' },
        { in: 'fill A 4 0\ncopy A C\nprint A\n', name: 'Присваивание пустого' },
        { in: 'fill A 1000 1\nfill A 0 0\nprint A\n', name: 'Большой буфер' },
        { in: 'fill C 2 -5\nset C 1 5\ncopy A C\ncopy C B\nprint A\nprint C\n', name: 'Цепочка' },
      ],
    },
    {
      title: 'Найди ошибку: строка присвоила сама себя',
      bug: true,
      description: `
Редактор хранит строки в классе \`Text\`, который сам владеет буфером символов. Команды: \`add слово\` — добавить строку, \`copy i j\` — заменить строку i копией строки j, \`print\` — напечатать все строки с номерами.

На командах вида \`copy 2 2\` строка превращается в мусор. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 100; индексы существуют.'],
      hints: [
        'Куда указывает other.data_ после строки data_ = new char[size_], если other — это *this?',
        'Перепишите operator= по идиоме copy-and-swap: копия создаётся до того, как старый буфер освобождён.',
      ],
      starter: TEXT(false),
      solution: TEXT(true),
      explanation: `
Наивный оператор сначала удаляет свой буфер, затем выделяет новый и копирует в него из \`other.data_\`. При самоприсваивании \`other\` и \`*this\` — один объект: к моменту копирования \`other.data_\` уже указывает на новый, ничем не заполненный буфер, и строка копирует мусор сама в себя. Старые символы удалены безвозвратно. Та же реализация оставляет объект с висячим указателем, если \`new\` бросит исключение.

Copy-and-swap устраняет обе проблемы: копия создаётся из живого объекта, а старый буфер освобождает деструктор копии после обмена. Отдельная проверка \`if (this == &other)\` спасла бы от самоприсваивания, но не от исключений.`,
      examples: [
        { in: 'add один\nadd два\ncopy 2 2\nprint\n', out: '1: один\n2: два\n' },
        { in: 'add a\nadd b\ncopy 1 2\nprint\n', out: '1: b\n2: b\n' },
      ],
      hidden: [
        'add x\ncopy 1 1\nprint\n',
        'add длинная-строка-больше-шестнадцати-байт\ncopy 1 1\nprint\n',
        'add a\nadd b\nadd c\ncopy 3 1\ncopy 2 2\nprint\n',
        'add p\nadd q\ncopy 1 2\ncopy 2 1\nprint\n',
        'add один\ncopy 1 1\ncopy 1 1\nprint\n',
        'add a\nadd bb\nadd ccc\ncopy 1 3\ncopy 3 3\nprint\n',
        'add only\nprint\n',
        'add m\nadd n\ncopy 2 2\ncopy 1 1\nprint\n',
      ],
    },
    {
      title: 'Склад со строгой гарантией',
      difficulty: 'advanced',
      description: `
Структура \`Item\` хранит название. Её копирование (и конструктор, и присваивание) бросает \`std::runtime_error("испорчен товар название")\`, если название начинается с \`!\` — так моделируется сбой, например нехватка памяти, посреди копирования.

Класс \`Inventory\` хранит метку \`std::string label_\` и товары \`std::vector<Item> items_\` (именно в таком порядке объявления). Напишите \`operator=\` со **строгой гарантией**: если копирование бросило исключение, склад остаётся ровно таким, каким был.

Склады хранятся в \`std::map<std::string, Inventory>\`. Команды:

- \`make X метка n товар₁ … товарₙ\` — создать (пересоздать) склад X: \`erase\`, затем \`try_emplace\`;
- \`assign X Y\` — \`X = Y\`; при исключении напечатать \`ошибка: текст\`;
- \`show X\` — \`X: метка [товары через пробел]\`.`,
      constraints: [
        'Команд не больше 100; склады в assign и show существуют; в make до 20 товаров.',
      ],
      hints: [
        'Неявный оператор присвоит сначала label_, затем items_ — и если items_ бросит, метка уже будет новой. Сделайте сначала полную копию: Inventory copy(other); затем swap полей.',
        'Создавайте склады на месте: try_emplace(name, label, names). В конструкторе Inventory сделайте items_.reserve(names.size()) и emplace_back — так товары не копируются при росте вектора.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

struct Item {
    std::string name;

    explicit Item(std::string n) : name(std::move(n)) {}
    Item(const Item &other) : name(checked(other)) {}
    Item &operator=(const Item &other) {
        name = checked(other);
        return *this;
    }

private:
    static std::string checked(const Item &other) {
        if (other.name.starts_with('!')) {
            throw std::runtime_error("испорчен товар " + other.name);
        }
        return other.name;
    }
};

class Inventory {
public:
    Inventory(std::string label, const std::vector<std::string> &names) : label_(std::move(label)) {
        items_.reserve(names.size());
        for (const std::string &n : names) {
            items_.emplace_back(n);
        }
    }

    Inventory(const Inventory &) = default;

    Inventory &operator=(const Inventory &other) {
        Inventory copy(other);
        std::swap(label_, copy.label_);
        std::swap(items_, copy.items_);
        return *this;
    }

    void show(const std::string &name) const {
        std::string list;
        for (const Item &item : items_) {
            list += (list.empty() ? "" : " ") + item.name;
        }
        std::println("{}: {} [{}]", name, label_, list);
    }

private:
    std::string label_;
    std::vector<Item> items_;
};

int main() {
    std::map<std::string, Inventory> stores;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "make") {
            std::string label;
            std::size_t n;
            std::cin >> label >> n;
            std::vector<std::string> names(n);
            for (std::string &name : names) {
                std::cin >> name;
            }
            stores.erase(x);
            stores.try_emplace(x, label, names);
        } else if (command == "assign") {
            std::string y;
            std::cin >> y;
            try {
                stores.at(x) = stores.at(y);
            } catch (const std::exception &e) {
                std::println("ошибка: {}", e.what());
            }
        } else {
            stores.at(x).show(x);
        }
    }
    return 0;
}`,
      explanation: `
Неявное присваивание идёт по полям: сначала \`label_\`, потом \`items_\`. Если копирование товаров бросит, метка уже заменена, и склад оказывается «наполовину присвоенным» — с чужой меткой и своими товарами. Это лишь базовая гарантия: объект корректен, но изменён.

Copy-and-swap даёт строгую гарантию. Всё, что может бросить, — копирование в \`copy\` — происходит до изменения \`*this\`. \`std::swap\` для строк и векторов обменивает внутренние указатели и не бросает. Если исключение вылетело, \`*this\` не тронут, а частично построенная копия разрушилась сама.`,
      examples: [
        {
          in: 'make A север 2 болты гайки\nmake B юг 2 шайбы !винты\nassign A B\nshow A\nassign B A\nshow B\n',
          out: 'ошибка: испорчен товар !винты\nA: север [болты гайки]\nB: север [болты гайки]\n',
        },
        { in: 'make A a 0\nshow A\n', out: 'A: a []\n' },
      ],
      hidden: [
        {
          in: 'make A x 1 p\nmake B y 1 q\nassign A B\nshow A\nshow B\n',
          name: 'Успешное присваивание',
        },
        { in: 'make A x 1 !p\nshow A\n', name: 'Создание не копирует' },
        { in: 'make A x 2 a b\nassign A A\nshow A\n', name: 'Самоприсваивание' },
        { in: 'make A x 1 !a\nassign A A\nshow A\n', name: 'Самоприсваивание с ошибкой' },
        {
          in: 'make A x 3 a b c\nmake B y 3 d !e f\nassign A B\nshow A\n',
          name: 'Сбой в середине',
        },
        { in: 'make A x 1 a\nmake A z 2 b c\nshow A\n', name: 'Пересоздание' },
        { in: 'make A x 2 a b\nmake B y 0\nassign A B\nshow A\n', name: 'Присваивание пустого' },
        {
          in: 'make A l1 1 a\nmake B l2 1 !b\nmake C l3 1 c\nassign A B\nassign A C\nshow A\nassign C B\nshow C\n',
          name: 'Несколько попыток',
        },
      ],
    },
  ],
};
