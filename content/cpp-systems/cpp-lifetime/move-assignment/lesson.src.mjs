const SLOTS = (fixed) => String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Buffer {
public:
    Buffer() = default;
    Buffer(std::size_t size, int fill) : size_(size), data_(new int[size]) {
        std::fill_n(data_, size_, fill);
    }
    Buffer(Buffer &&other) noexcept
        : size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)) {}
    Buffer &operator=(Buffer &&other) noexcept {
        if (this != &other) {
${fixed ? '            delete[] data_;\n' : ''}            size_ = std::exchange(other.size_, 0);
            data_ = std::exchange(other.data_, nullptr);
        }
        return *this;
    }
    Buffer(const Buffer &) = delete;
    Buffer &operator=(const Buffer &) = delete;
    ~Buffer() {
        delete[] data_;
    }

    long long sum() const {
        long long s = 0;
        for (std::size_t i = 0; i < size_; ++i) {
            s += data_[i];
        }
        return s;
    }

private:
    std::size_t size_ = 0;
    int *data_ = nullptr;
};

int main() {
    Buffer slots[3];
    std::string command;
    std::size_t x;
    while (std::cin >> command >> x) {
        if (command == "set") {
            std::size_t n;
            int v;
            std::cin >> n >> v;
            slots[x] = Buffer(n, v);
        } else if (command == "take") {
            std::size_t y;
            std::cin >> y;
            slots[x] = std::move(slots[y]);
        } else {
            std::println("слот {}: сумма {}", x, slots[x].sum());
        }
    }
    return 0;
}`;

const TRACKED = String.raw`struct Tracked {
    static inline int move_assigns = 0;
    std::string v;

    explicit Tracked(std::string s) : v(std::move(s)) {}
    Tracked(Tracked &&) noexcept = default;
    Tracked &operator=(Tracked &&other) noexcept {
        v = std::move(other.v);
        ++move_assigns;
        return *this;
    }
};`;

export default {
  id: 'lifetime-move-assignment',
  title: 'Перемещающее присваивание',
  description:
    'Оператор T &operator=(T &&) noexcept: освободить свой ресурс, забрать чужой, обнулить источник, вернуть *this; самоперемещение; где стандартная библиотека использует перемещающее присваивание — erase, erase_if, сортировка, swap; единый оператор присваивания по значению с обменом; перемещаемые некопируемые владельцы.',
  moduleId: 'cpp-lifetime',
  order: 15,
  difficulty: 'advanced',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-move-constructor'],
  objectives: [
    'Писать перемещающее присваивание для класса-владельца',
    'Обеспечивать корректность при самоперемещении',
    'Понимать, где контейнеры и алгоритмы используют перемещающее присваивание',
    'Применять присваивание по значению с обменом',
  ],
  tags: ['C++23', 'Время жизни', 'Перемещение', 'Присваивание', 'noexcept'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чем перемещающее присваивание отличается от перемещающего конструктора?',
      options: [
        'Объект уже существует: сначала нужно освободить его собственный ресурс',
        'Ничем',
        'Оно не может быть noexcept',
        'Оно копирует данные',
      ],
      correct: 0,
      explain: 'Конструктору освобождать нечего — объекта ещё не было.',
    },
    {
      q: 'Какое выражение вызывает перемещающее присваивание (a и b существуют)?',
      options: ['a = std::move(b);', 'T a = std::move(b);', 'a = b;', 'T a(b);'],
      correct: 0,
      explain:
        'Создание нового объекта — конструктор; присваивание lvalue — копирующее присваивание.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <utility>

int main() {
    std::string a = "первая-длинная-строка";
    std::string b = "вторая";
    b = std::move(a);
    a = "новая";
    std::println("{} {}", a, b);
    return 0;
}`,
      lang: 'cpp',
      answers: ['новая первая-длинная-строка'],
      placeholder: 'Вывод программы',
      explain: 'b забрал содержимое a; a затем получил новое значение.',
    },
    {
      q: 'Сколько перемещающих присваиваний сделает v.erase(v.begin()) для вектора из 6 элементов?',
      options: ['5', '6', '1', '0'],
      correct: 0,
      explain: 'Каждый из пяти оставшихся элементов сдвигается на место левее.',
    },
    {
      q: 'Чем опасна реализация «delete[] data_; data_ = std::exchange(other.data_, nullptr);» без проверки адреса?',
      options: [
        'При самоперемещении удаляет буфер и забирает уже удалённый указатель',
        'Она бросает исключения',
        'Она медленная',
        'Ничем',
      ],
      correct: 0,
      explain: 'Нужна проверка this != &other или реализация через обмен.',
    },
    {
      q: 'Что даёт оператор T &operator=(T other) noexcept со swap внутри?',
      options: [
        'Одну функцию для копирующего и перемещающего присваивания, безопасную при самоприсваивании',
        'Только перемещение',
        'Только копирование',
        'Ошибку неоднозначности с конструктором',
      ],
      correct: 0,
      explain: 'Параметр создаётся копированием или перемещением в зависимости от аргумента.',
    },
    {
      q: 'Что произойдёт, если перемещающее присваивание не освободит свой старый ресурс?',
      options: ['Утечка памяти', 'Двойное освобождение', 'Ошибка компиляции', 'Ничего'],
      correct: 0,
      explain: 'Старый указатель перезаписан, и освободить блок больше некому.',
    },
    {
      q: 'Какую стандартную функцию удобно использовать, чтобы забрать указатель у источника и одновременно записать туда nullptr?',
      answers: ['std::exchange', 'exchange'],
      placeholder: 'Имя функции',
      explain: 'data_ = std::exchange(other.data_, nullptr);',
    },
  ],
  exercises: [
    {
      id: 'lifetime-move-assignment-exercise',
      title: 'Слоты',
      difficulty: 'intermediate',
      description: `
Класс \`Buffer\` владеет массивом \`int\` и считает статически: выделения, освобождения (\`delete[]\` непустого массива), копирования и перемещения. Реализуйте пустой конструктор по умолчанию, \`Buffer(n, v)\`, глубокий конструктор копирования, перемещающий конструктор, копирующее присваивание (copy-and-swap), перемещающее присваивание (освободить своё, забрать чужое, проверка самоперемещения) и деструктор.

Три слота \`Buffer slots[3]\` (номера 0–2). Команды:

- \`set X n v\` — \`slots[X] = Buffer(n, v)\`;
- \`copy X Y\` — \`slots[X] = slots[Y]\`;
- \`take X Y\` — \`slots[X] = std::move(slots[Y])\`;
- \`sum X\` — \`слот X: сумма S\`;
- \`stats\` — \`выделений A, освобождений F, копий C, перемещений M\` (перемещения — и конструктором, и присваиванием).`,
      constraints: ['Команд не больше 300; 1 ≤ n ≤ 1000.'],
      hints: [
        'Освобождение считайте в одной функции release(): if (data_) { delete[] data_; ++frees; } — её вызывают деструктор и перемещающее присваивание.',
        'Копирующее присваивание через copy-and-swap само создаст копию (выделение и копирование), а старый буфер освободит деструктор временной копии.',
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
    static inline int allocations = 0;
    static inline int frees = 0;
    static inline int copies = 0;
    static inline int moves = 0;

    Buffer() = default;
    Buffer(std::size_t size, int fill) : size_(size), data_(new int[size]) {
        ++allocations;
        std::fill_n(data_, size_, fill);
    }
    Buffer(const Buffer &other) : size_(other.size_), data_(other.data_ ? new int[other.size_] : nullptr) {
        if (data_) {
            ++allocations;
            std::copy_n(other.data_, size_, data_);
        }
        ++copies;
    }
    Buffer(Buffer &&other) noexcept
        : size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)) {
        ++moves;
    }
    Buffer &operator=(const Buffer &other) {
        Buffer copy(other);
        std::swap(size_, copy.size_);
        std::swap(data_, copy.data_);
        return *this;
    }
    Buffer &operator=(Buffer &&other) noexcept {
        if (this != &other) {
            release();
            size_ = std::exchange(other.size_, 0);
            data_ = std::exchange(other.data_, nullptr);
            ++moves;
        }
        return *this;
    }
    ~Buffer() {
        release();
    }

    long long sum() const {
        long long s = 0;
        for (std::size_t i = 0; i < size_; ++i) {
            s += data_[i];
        }
        return s;
    }

private:
    void release() {
        if (data_) {
            delete[] data_;
            ++frees;
        }
    }

    std::size_t size_ = 0;
    int *data_ = nullptr;
};

int main() {
    Buffer slots[3];
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            std::println("выделений {}, освобождений {}, копий {}, перемещений {}", Buffer::allocations, Buffer::frees,
                         Buffer::copies, Buffer::moves);
            continue;
        }
        std::size_t x;
        std::cin >> x;
        if (command == "set") {
            std::size_t n;
            int v;
            std::cin >> n >> v;
            slots[x] = Buffer(n, v);
        } else if (command == "copy") {
            std::size_t y;
            std::cin >> y;
            slots[x] = slots[y];
        } else if (command == "take") {
            std::size_t y;
            std::cin >> y;
            slots[x] = std::move(slots[y]);
        } else {
            std::println("слот {}: сумма {}", x, slots[x].sum());
        }
    }
    return 0;
}`,
      explanation: `
\`set\` присваивает временный объект — работает перемещающее присваивание: старый массив слота освобождается, новый переходит без копирования. \`take\` делает то же с именованным слотом, разрешение даёт \`std::move\`. \`copy\` — единственная команда, которая выделяет память под копию.

Счётчики показывают баланс: в конце программы каждый выделенный массив освобождён ровно один раз — деструкторами слотов или при замене.`,
      examples: [
        {
          in: 'set 0 3 1\nset 1 2 5\ncopy 2 0\ntake 0 1\nsum 0\nsum 1\nsum 2\nstats\n',
          out: 'слот 0: сумма 10\nслот 1: сумма 0\nслот 2: сумма 3\nвыделений 3, освобождений 1, копий 1, перемещений 3\n',
        },
        { in: 'stats\n', out: 'выделений 0, освобождений 0, копий 0, перемещений 0\n' },
      ],
      hidden: [
        { in: 'set 0 1 1\ntake 0 0\nsum 0\nstats\n', name: 'Самоперемещение' },
        { in: 'set 0 2 2\ncopy 0 0\nsum 0\nstats\n', name: 'Самоприсваивание копией' },
        { in: 'set 0 5 1\nset 0 5 2\nset 0 5 3\nsum 0\nstats\n', name: 'Многократная замена' },
        { in: 'copy 0 1\nstats\n', name: 'Копия пустого' },
        { in: 'set 1 4 4\ntake 0 1\ntake 2 0\nsum 2\nsum 0\nsum 1\nstats\n', name: 'Цепочка take' },
        { in: 'set 0 1000 1000\ncopy 1 0\ncopy 2 1\nsum 2\nstats\n', name: 'Большие буферы' },
        { in: 'set 2 3 -1\ntake 2 1\nsum 2\nstats\n', name: 'take пустого' },
        {
          in: 'set 0 1 9\nset 1 1 8\ncopy 0 1\ntake 1 0\nsum 0\nsum 1\nstats\n',
          name: 'Смешанные',
        },
      ],
    },
    {
      title: 'Удаление со сдвигом',
      description: `
Структура \`Tracked\` хранит строку и считает перемещающие присваивания. Первая строка ввода — элементы вектора (через \`emplace_back\`). Затем команды:

- \`erase i\` — \`items.erase(items.begin() + i)\` (с нуля);
- \`erase-if s\` — \`std::erase_if(items, …)\`: удалить все элементы, равные s;
- \`show\` — \`элементы (присваиваний N)\`, где N — перемещающие присваивания **с начала программы**; пустой вектор — \`— (присваиваний N)\`.`,
      constraints: [
        'До 100 элементов, до 100 команд; индексы существуют. Проверка использует libstdc++.',
      ],
      hints: [
        'Перемещающее присваивание считайте в самом операторе; перемещающий конструктор можно объявить = default — при росте вектора он не нужен в подсчёте.',
        'erase сдвигает влево все элементы правее удалённого; std::erase_if сдвигает только оставшиеся элементы, стоящие после первого удалённого.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

${TRACKED}

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream in(line);
    std::vector<Tracked> items;
    std::string w;
    while (in >> w) {
        items.emplace_back(w);
    }
    std::string command;
    while (std::cin >> command) {
        if (command == "erase") {
            std::ptrdiff_t i;
            std::cin >> i;
            items.erase(items.begin() + i);
        } else if (command == "erase-if") {
            std::string s;
            std::cin >> s;
            std::erase_if(items, [&](const Tracked &t) { return t.v == s; });
        } else {
            std::string text;
            for (const Tracked &t : items) {
                text += (text.empty() ? "" : " ") + t.v;
            }
            std::println("{} (присваиваний {})", text.empty() ? "—" : text, Tracked::move_assigns);
        }
    }
    return 0;
}`,
      explanation: `
Вектор хранит элементы подряд, поэтому удаление из середины сдвигает хвост: каждый сдвиг — перемещающее присваивание. Удаление первого элемента стоит n − 1 присваиваний, последнего — ни одного. \`std::erase_if\` проходит вектор один раз и перемещает каждый оставшийся элемент сразу на его итоговое место — это выгоднее, чем удалять совпадения по одному через \`erase\`.

Если бы у \`Tracked\` не было перемещающего присваивания, каждый сдвиг копировал бы строку.`,
      examples: [
        {
          in: 'a b c d e\nerase 1\nshow\nerase-if d\nshow\n',
          out: 'a c d e (присваиваний 3)\na c e (присваиваний 4)\n',
        },
        { in: 'x\nerase 0\nshow\n', out: '— (присваиваний 0)\n' },
      ],
      hidden: [
        { in: 'a b c d\nerase 3\nshow\n', name: 'Удаление последнего' },
        { in: 'a b c d\nerase 0\nshow\n', name: 'Удаление первого' },
        { in: 'a a a\nerase-if a\nshow\n', name: 'Удалить всё' },
        { in: 'a b a b a\nerase-if a\nshow\n', name: 'Чередование' },
        { in: 'a b c\nerase-if z\nshow\n', name: 'Нет совпадений' },
        { in: '\nshow\n', name: 'Пустой вектор' },
        { in: 'x y z x y z\nerase-if x\nerase 0\nshow\n', name: 'Комбинация' },
        {
          in: '1 2 3 4 5 6 7 8 9 10\nerase 4\nerase 4\nerase 4\nshow\n',
          name: 'Повторное удаление из середины',
        },
      ],
    },
    {
      title: 'Найди ошибку: потерянный буфер',
      bug: true,
      description: `
Три слота хранят буферы чисел. Команды: \`set X n v\` — записать в слот X новый буфер из n чисел v, \`take X Y\` — переместить буфер из слота Y в слот X, \`sum X\` — напечатать сумму. Вывод правильный, но при завершении LeakSanitizer сообщает об утечке. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 200; 1 ≤ n ≤ 1000.'],
      hints: [
        'Что происходит с массивом, которым слот владел до присваивания?',
        'Перемещающее присваивание должно сначала освободить собственный буфер: delete[] data_; затем забрать чужой.',
      ],
      starter: SLOTS(false),
      solution: SLOTS(true),
      explanation: `
Перемещающее присваивание забирает указатель источника, но перезаписывает собственный \`data_\`, не освободив его. Каждая замена непустого слота теряет старый массив — освободить его больше некому. Вывод при этом правильный: утечка не меняет результаты, она лишь накапливается.

Присваивание отличается от конструктора именно этим: у объекта уже есть ресурс, и он должен быть освобождён до или после замены (в варианте с обменом — деструктором источника).`,
      examples: [
        { in: 'set 0 3 1\nset 0 2 5\nsum 0\n', out: 'слот 0: сумма 10\n' },
        { in: 'set 0 2 2\nset 1 1 1\ntake 1 0\nsum 1\n', out: 'слот 1: сумма 4\n' },
      ],
      hidden: [
        'set 0 1 1\nset 0 1 2\n',
        'set 1 5 5\ntake 0 1\ntake 2 0\nsum 2\n',
        'set 0 3 3\nset 1 3 3\ntake 0 1\nsum 0\n',
        'set 2 10 1\nset 2 10 2\nset 2 10 3\nsum 2\n',
        'set 0 1 7\ntake 0 0\nset 0 1 8\nsum 0\n',
        'set 1 4 1\nset 2 4 2\ntake 1 2\nsum 1\nsum 2\n',
        'set 0 1000 1\nset 0 1000 2\nsum 0\n',
        'set 0 2 3\nset 1 2 4\nset 2 2 5\ntake 0 2\ntake 1 0\nsum 1\n',
      ],
    },
    {
      title: 'Дескрипторы',
      difficulty: 'advanced',
      description: `
Пул выдаёт дескрипторы — числа 1, 2, 3, … по порядку и считает открытые. Класс \`UniqueHandle\` — единственный владелец дескриптора: копирование запрещено, перемещение разрешено. Пустой дескриптор хранит 0. При уничтожении или замене непустой дескриптор **закрывается**: печатается \`закрыт N\`, счётчик открытых уменьшается.

Дескрипторы лежат в \`std::map<std::string, UniqueHandle>\` (\`operator[]\` создаёт пустой). Команды:

- \`open X\` — \`handles[X] = UniqueHandle(pool.acquire())\`, при открытии печатается \`открыт N\`;
- \`move X Y\` — \`handles[X] = std::move(handles[Y])\` (X может совпадать с Y);
- \`close X\` — \`handles[X] = UniqueHandle()\`;
- \`show X\` — \`X: N\` или \`X: пусто\`;
- \`open-count\` — \`открыто K\`.

В конце программы оставшиеся дескрипторы закрываются деструкторами (в порядке уничтожения \`std::map\` — не полагайтесь на него, лучше закройте их сами, удаляя элементы от последнего имени к первому).`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Перемещающее присваивание: if (this != &other) { reset(); id_ = std::exchange(other.id_, 0); } — reset() закрывает текущий дескриптор, если он не пуст.',
        'Перемещающий конструктор только забирает id через std::exchange — закрывать ему нечего.',
      ],
      solution: String.raw`
#include <iostream>
#include <iterator>
#include <map>
#include <print>
#include <string>
#include <utility>

struct Pool {
    int next = 1;
    int open = 0;

    int acquire() {
        ++open;
        std::println("открыт {}", next);
        return next++;
    }

    void release(int id) {
        --open;
        std::println("закрыт {}", id);
    }
};

Pool pool;

class UniqueHandle {
public:
    UniqueHandle() = default;
    explicit UniqueHandle(int id) : id_(id) {}
    UniqueHandle(const UniqueHandle &) = delete;
    UniqueHandle &operator=(const UniqueHandle &) = delete;
    UniqueHandle(UniqueHandle &&other) noexcept : id_(std::exchange(other.id_, 0)) {}
    UniqueHandle &operator=(UniqueHandle &&other) noexcept {
        if (this != &other) {
            reset();
            id_ = std::exchange(other.id_, 0);
        }
        return *this;
    }
    ~UniqueHandle() {
        reset();
    }

    int id() const {
        return id_;
    }

private:
    void reset() {
        if (id_ != 0) {
            pool.release(std::exchange(id_, 0));
        }
    }

    int id_ = 0;
};

int main() {
    std::map<std::string, UniqueHandle> handles;
    std::string command;
    while (std::cin >> command) {
        if (command == "open-count") {
            std::println("открыто {}", pool.open);
            continue;
        }
        std::string x;
        std::cin >> x;
        if (command == "open") {
            handles[x] = UniqueHandle(pool.acquire());
        } else if (command == "move") {
            std::string y;
            std::cin >> y;
            handles[x] = std::move(handles[y]);
        } else if (command == "close") {
            handles[x] = UniqueHandle();
        } else {
            const int id = handles[x].id();
            if (id == 0) {
                std::println("{}: пусто", x);
            } else {
                std::println("{}: {}", x, id);
            }
        }
    }
    while (!handles.empty()) {
        handles.erase(std::prev(handles.end()));
    }
    return 0;
}`,
      explanation: `
\`UniqueHandle\` ведёт себя как \`std::unique_ptr\`, но для числового ресурса: один владелец, передача только перемещением, закрытие при уничтожении или замене. Перемещающее присваивание сначала закрывает свой дескриптор — иначе он утёк бы, — затем забирает чужой и оставляет источник пустым. Проверка адреса защищает от \`move X X\`: без неё дескриптор закрылся бы, а затем «забрался» уже пустым.

Так же устроены обёртки над файлами, сокетами и дескрипторами ОС — перемещаемые и некопируемые RAII-владельцы. В урок о \`unique_ptr\` с собственным удалителем мы вернёмся к этой идее.`,
      examples: [
        {
          in: 'open a\nopen b\nmove a b\nshow a\nshow b\nopen-count\nclose a\nopen-count\n',
          out: 'открыт 1\nоткрыт 2\nзакрыт 1\na: 2\nb: пусто\nоткрыто 1\nзакрыт 2\nоткрыто 0\n',
        },
        { in: 'open x\n', out: 'открыт 1\nзакрыт 1\n' },
      ],
      hidden: [
        { in: 'open a\nmove a a\nshow a\n', name: 'Самоперемещение' },
        { in: 'open a\nopen a\nopen a\nopen-count\n', name: 'Повторное открытие' },
        { in: 'close a\nshow a\nopen-count\n', name: 'Закрытие пустого' },
        { in: 'open a\nmove b a\nmove c b\nshow a\nshow c\n', name: 'Цепочка перемещений' },
        { in: 'open a\nopen b\nopen c\n', name: 'Закрытие в конце' },
        { in: 'move a b\nshow a\n', name: 'Перемещение пустого' },
        { in: 'open z\nopen a\nmove z a\nopen-count\n', name: 'Замена с закрытием' },
        { in: 'open p\nclose p\nopen p\nshow p\nopen-count\n', name: 'Новый номер после закрытия' },
      ],
    },
  ],
};
