const STORE = (fixed) => String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Buffer {
public:
    Buffer(std::size_t size, int fill) : size_(size), data_(new int[size]) {
        std::fill_n(data_, size_, fill);
    }
    Buffer(const Buffer &other) : size_(other.size_), data_(new int[other.size_]) {
        std::copy_n(other.data_, size_, data_);
    }
    Buffer(Buffer &&other) noexcept
        : ${fixed ? 'size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr))' : 'size_(other.size_), data_(other.data_)'} {}
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
    std::size_t size_;
    int *data_;
};

int main() {
    std::vector<Buffer> buffers;
    std::string command;
    while (std::cin >> command) {
        if (command == "make") {
            std::size_t n;
            int v;
            std::cin >> n >> v;
            buffers.push_back(Buffer(n, v));
        } else {
            std::size_t i;
            std::cin >> i;
            std::println("сумма {}", buffers[i - 1].sum());
        }
    }
    return 0;
}`;

export default {
  id: 'lifetime-move-constructor',
  title: 'Перемещающий конструктор',
  description:
    'Перемещающий конструктор T(T &&) noexcept: забрать ресурс и оставить источник пустым и разрушаемым; std::exchange для обнуления указателей; почему noexcept определяет, копирует или перемещает std::vector при росте (move_if_noexcept); когда компилятор создаёт перемещение сам и как его теряют, объявив деструктор; = default.',
  moduleId: 'cpp-lifetime',
  order: 14,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-std-move'],
  objectives: [
    'Писать перемещающий конструктор для класса, владеющего ресурсом',
    'Оставлять источник в пустом корректном состоянии',
    'Объяснять роль noexcept при росте вектора',
    'Знать, когда перемещающий конструктор создаётся неявно',
  ],
  tags: ['C++23', 'Время жизни', 'Перемещение', 'noexcept', 'std::exchange'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что должен сделать перемещающий конструктор класса с полем-указателем int *data_?',
      options: [
        'Забрать указатель и обнулить его у источника',
        'Скопировать данные в новый блок',
        'Освободить блок источника',
        'Только скопировать указатель',
      ],
      correct: 0,
      explain: 'Иначе два деструктора освободят один блок.',
    },
    {
      q: 'Что возвращает std::exchange(x, v)?',
      options: [
        'Старое значение x, присвоив x значение v',
        'Новое значение x',
        'void',
        'Ссылку на x',
      ],
      correct: 0,
      explain: 'Удобно для перемещения: data_(std::exchange(other.data_, nullptr)).',
    },
    {
      q: 'Почему std::vector при росте копирует элементы, у которых перемещающий конструктор не noexcept?',
      options: [
        'Чтобы сохранить строгую гарантию: при исключении на середине оригиналы должны остаться целыми',
        'Копирование быстрее',
        'Перемещение без noexcept запрещено',
        'Это ошибка стандартной библиотеки',
      ],
      correct: 0,
      explain: 'Решение принимает std::move_if_noexcept.',
    },
    {
      q: 'Когда компилятор НЕ создаст неявный перемещающий конструктор? Выберите все.',
      options: [
        'Объявлен пользовательский деструктор',
        'Объявлен конструктор копирования',
        'Объявлено копирующее присваивание',
        'В классе есть поле std::string',
      ],
      correct: [0, 1, 2],
      explain: 'Поле-строка, наоборот, само прекрасно перемещается.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <utility>

struct S {
    int *p;
    explicit S(int v) : p(new int(v)) {}
    S(S &&o) noexcept : p(std::exchange(o.p, nullptr)) {}
    ~S() { delete p; }
};

int main() {
    S a(5);
    S b = std::move(a);
    std::println("{} {}", a.p == nullptr, *b.p);
    return 0;
}`,
      lang: 'cpp',
      answers: ['true 5'],
      placeholder: 'Вывод программы',
      explain: 'b забрал указатель, у a остался nullptr; delete nullptr безопасен.',
    },
    {
      q: 'В каком состоянии должен остаться источник после перемещения?',
      options: [
        'Корректном: его можно разрушить и присвоить ему новое значение',
        'Любом — его всё равно уничтожат',
        'Таком же, как до перемещения',
        'Разрушенном',
      ],
      correct: 0,
      explain: 'Деструктор источника всё равно будет вызван.',
    },
    {
      q: 'Как вернуть неявное перемещение классу, в котором объявлен деструктор?',
      options: [
        'T(T &&) noexcept = default;',
        'T(T &&) = delete;',
        'Сделать деструктор виртуальным',
        'Никак',
      ],
      correct: 0,
      explain: 'Явное = default создаёт почленное перемещение.',
    },
    {
      q: 'Какое ключевое слово обещает, что функция не бросает исключений?',
      answers: ['noexcept'],
      placeholder: 'Ключевое слово',
      explain:
        'Для перемещающих операций это не украшение, а условие их использования контейнерами.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-move-constructor-exercise',
      title: 'Перемещаемый буфер',
      difficulty: 'intermediate',
      description: `
Класс \`Buffer\` владеет массивом \`int\` из кучи и считает статически: выделения массивов, копии и перемещения. Напишите конструктор \`Buffer(n, v)\`, глубокий конструктор копирования, перемещающий конструктор \`noexcept\` через \`std::exchange\` и деструктор; присваивание запретите.

Буферы хранятся в векторе с местом, зарезервированным на 1000 элементов. Команды:

- \`make n v\` — \`push_back(Buffer(n, v))\`;
- \`clone i\` — \`push_back(buffers[i - 1])\`;
- \`sum i\` — \`сумма S\` (у пустого буфера — 0);
- \`stats\` — \`выделений A, копий C, перемещений M\`.`,
      constraints: ['Команд не больше 500; 0 ≤ n ≤ 1000; индексы существуют.'],
      hints: [
        'Выделение — в конструкторе и в конструкторе копирования; перемещение массив не выделяет.',
        'Buffer(Buffer &&other) noexcept : size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)) { ++moves; }',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Buffer {
public:
    static inline int allocations = 0;
    static inline int copies = 0;
    static inline int moves = 0;

    Buffer(std::size_t size, int fill) : size_(size), data_(new int[size]) {
        ++allocations;
        std::fill_n(data_, size_, fill);
    }
    Buffer(const Buffer &other) : size_(other.size_), data_(new int[other.size_]) {
        ++allocations;
        ++copies;
        std::copy_n(other.data_, size_, data_);
    }
    Buffer(Buffer &&other) noexcept
        : size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)) {
        ++moves;
    }
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
    std::size_t size_;
    int *data_;
};

int main() {
    std::vector<Buffer> buffers;
    buffers.reserve(1000);
    std::string command;
    while (std::cin >> command) {
        if (command == "make") {
            std::size_t n;
            int v;
            std::cin >> n >> v;
            buffers.push_back(Buffer(n, v));
        } else if (command == "clone") {
            std::size_t i;
            std::cin >> i;
            buffers.push_back(buffers[i - 1]);
        } else if (command == "sum") {
            std::size_t i;
            std::cin >> i;
            std::println("сумма {}", buffers[i - 1].sum());
        } else {
            std::println("выделений {}, копий {}, перемещений {}", Buffer::allocations, Buffer::copies,
                         Buffer::moves);
        }
    }
    return 0;
}`,
      explanation: `
Временный \`Buffer(n, v)\` выделяет массив один раз, а в вектор попадает перемещением — указатель переходит к элементу, и временный объект умирает пустым. Без перемещающего конструктора \`push_back\` копировал бы: два выделения и копирование всех чисел на каждую команду \`make\`. Копия нужна только в \`clone\`, где оригинал остаётся в векторе.`,
      examples: [
        {
          in: 'make 3 5\nclone 1\nsum 2\nstats\n',
          out: 'сумма 15\nвыделений 2, копий 1, перемещений 1\n',
        },
        { in: 'make 0 9\nsum 1\nstats\n', out: 'сумма 0\nвыделений 1, копий 0, перемещений 1\n' },
      ],
      hidden: [
        { in: 'stats\n', name: 'Ничего не создано' },
        { in: 'make 1 1\nmake 2 2\nmake 3 3\nstats\n', name: 'Три буфера' },
        { in: 'make 1000 1000\nsum 1\n', name: 'Большой буфер' },
        { in: 'make 2 1\nclone 1\nclone 2\nclone 3\nstats\nsum 4\n', name: 'Цепочка копий' },
        { in: 'make 5 -3\nsum 1\n', name: 'Отрицательные значения' },
        { in: 'make 1 7\nclone 1\nmake 1 8\nsum 3\nstats\n', name: 'Чередование' },
        { in: 'make 3 0\nclone 1\nsum 1\nsum 2\n', name: 'Нули' },
        { in: 'make 10 10\nmake 10 10\nclone 2\nstats\n', name: 'Клон второго' },
      ],
    },
    {
      title: 'noexcept и рост вектора',
      description: `
Два типа считают свои копии и перемещения: \`Fast\` с перемещающим конструктором \`noexcept\` и \`Slow\` — с таким же, но без \`noexcept\`.

Каждая строка ввода — число n. Для неё обнулите счётчики, создайте два **пустых** вектора (без \`reserve\`) и добавьте в каждый n элементов вызовом \`push_back(T())\`. Напечатайте \`n=N: Fast копий C, перемещений M; Slow копий C, перемещений M\`.`,
      constraints: [
        'До 20 строк; 0 ≤ n ≤ 1000. Проверка использует libstdc++, где ёмкость вектора растёт вдвое: 1, 2, 4, 8, …',
      ],
      hints: [
        'push_back(T()) перемещает временный объект в вектор у обоих типов — noexcept для этого не нужен.',
        'Разница — в переносе старых элементов при росте: Fast переносится перемещением, Slow — копированием.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <vector>

struct Fast {
    static inline int copies = 0;
    static inline int moves = 0;
    Fast() = default;
    Fast(const Fast &) {
        ++copies;
    }
    Fast(Fast &&) noexcept {
        ++moves;
    }
};

struct Slow {
    static inline int copies = 0;
    static inline int moves = 0;
    Slow() = default;
    Slow(const Slow &) {
        ++copies;
    }
    Slow(Slow &&) {
        ++moves;
    }
};

int main() {
    int n;
    while (std::cin >> n) {
        Fast::copies = Fast::moves = 0;
        Slow::copies = Slow::moves = 0;
        std::vector<Fast> fast;
        std::vector<Slow> slow;
        for (int i = 0; i < n; ++i) {
            fast.push_back(Fast());
            slow.push_back(Slow());
        }
        std::println("n={}: Fast копий {}, перемещений {}; Slow копий {}, перемещений {}", n, Fast::copies,
                     Fast::moves, Slow::copies, Slow::moves);
    }
    return 0;
}`,
      explanation: `
Каждый \`push_back\` перемещает временный объект — это n перемещений у обоих типов. При росте вектор переносит уже лежащие элементы в новый буфер через \`std::move_if_noexcept\`: \`Fast\` переносится перемещением, а \`Slow\` — копированием, потому что перемещение без \`noexcept\` могло бы бросить исключение посреди переноса и оставить вектор испорченным.

Для n = 5 ёмкость растёт 1 → 2 → 4 → 8, переносится 1 + 2 + 4 = 7 элементов. У настоящих классов с буферами каждая такая «копия» — выделение памяти и копирование данных.`,
      examples: [
        { in: '5\n', out: 'n=5: Fast копий 0, перемещений 12; Slow копий 7, перемещений 5\n' },
        {
          in: '0\n1\n',
          out: 'n=0: Fast копий 0, перемещений 0; Slow копий 0, перемещений 0\nn=1: Fast копий 0, перемещений 1; Slow копий 0, перемещений 1\n',
        },
      ],
      hidden: [
        { in: '2\n', name: 'Два элемента' },
        { in: '4\n', name: 'Ровно степень двойки' },
        { in: '9\n', name: 'Сразу после степени двойки' },
        { in: '100\n', name: 'Сто' },
        { in: '1000\n', name: 'Тысяча' },
        { in: '3\n3\n', name: 'Счётчики обнуляются' },
        { in: '16\n17\n', name: 'Граница роста' },
        { in: '', name: 'Пусто' },
      ],
    },
    {
      title: 'Найди ошибку: два владельца после перемещения',
      bug: true,
      description: `
Программа создаёт буферы командой \`make n v\` (n чисел, равных v) и печатает сумму буфера командой \`sum i\`. Буферы попадают в вектор перемещением. С первого же \`make\` AddressSanitizer сообщает об ошибке. Найдите и исправьте её в классе \`Buffer\`.`,
      constraints: ['Команд не больше 200; 0 ≤ n ≤ 1000.'],
      hints: [
        'Сколько объектов владеют массивом после перемещающего конструктора? Что сделает деструктор временного Buffer(n, v)?',
        'Обнулите источник: size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)).',
      ],
      starter: STORE(false),
      solution: STORE(true),
      explanation: `
Перемещающий конструктор скопировал указатель, но не обнулил его у источника. Временный \`Buffer(n, v)\` умирает сразу после \`push_back\` и освобождает массив, которым теперь пользуется элемент вектора: \`sum\` читает освобождённую память, а в конце программы элемент освобождает её ещё раз. При росте вектора то же происходит с каждым перенесённым элементом.

Перемещение без обнуления источника — это поверхностная копия с другим названием. \`std::exchange\` забирает значение и одновременно ставит на его место пустое.`,
      examples: [
        { in: 'make 3 2\nsum 1\n', out: 'сумма 6\n' },
        { in: 'make 1 5\nmake 2 5\nsum 2\n', out: 'сумма 10\n' },
      ],
      hidden: [
        'make 0 1\nsum 1\n',
        'make 10 10\nsum 1\n',
        'make 1 1\nmake 1 2\nmake 1 3\nsum 3\n',
        'make 1000 1\nsum 1\n',
        'make 2 -4\nsum 1\n',
        'make 3 3\nmake 3 3\nmake 3 3\nmake 3 3\nmake 3 3\nsum 5\n',
        'make 1 0\n',
        'make 7 7\nsum 1\nsum 1\n',
      ],
    },
    {
      title: 'Связный список',
      difficulty: 'advanced',
      description: `
Односвязный список \`List\` владеет узлами \`Node { int value; Node *next; }\`, выделенными \`new\`. Статический счётчик считает выделенные узлы. Реализуйте: \`push_back\` за O(1) (храните и хвост), глубокий конструктор копирования, перемещающий конструктор \`noexcept\` за O(1), деструктор; присваивание запретите.

Списки хранятся в \`std::map<std::string, List>\`; создавайте их через \`erase\` и \`try_emplace\`. Команды:

- \`make L n v₁ … vₙ\` — новый список;
- \`copy M L\` — M становится копией L (M ≠ L);
- \`move M L\` — M забирает узлы L перемещением, L остаётся пустым (M ≠ L);
- \`push L x\`;
- \`print L\` — \`L (размер): значения\` или \`L (0): пусто\`;
- \`stats\` — \`узлов выделено N\`.`,
      constraints: ['Команд не больше 300; списки в copy, move, push и print существуют.'],
      hints: [
        'Перемещение: head_(std::exchange(o.head_, nullptr)), tail_(std::exchange(o.tail_, nullptr)), size_(std::exchange(o.size_, 0)) — ни одного нового узла.',
        'move M L: сначала List tmp(std::move(lists.at(L))); затем lists.erase(M); lists.try_emplace(M, std::move(tmp)); — так M ≠ L и порядок операций безопасен.',
      ],
      solution: String.raw`
#include <cstddef>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

struct Node {
    int value;
    Node *next = nullptr;
};

class List {
public:
    static inline int allocated = 0;

    List() = default;
    List(const List &other) {
        for (const Node *n = other.head_; n; n = n->next) {
            push_back(n->value);
        }
    }
    List(List &&other) noexcept
        : head_(std::exchange(other.head_, nullptr)), tail_(std::exchange(other.tail_, nullptr)),
          size_(std::exchange(other.size_, 0)) {}
    List &operator=(const List &) = delete;
    ~List() {
        while (head_) {
            delete std::exchange(head_, head_->next);
        }
    }

    void push_back(int v) {
        Node *node = new Node{v};
        ++allocated;
        if (tail_) {
            tail_->next = node;
        } else {
            head_ = node;
        }
        tail_ = node;
        ++size_;
    }

    void print(const std::string &name) const {
        std::string s;
        for (const Node *n = head_; n; n = n->next) {
            s += (s.empty() ? "" : " ") + std::to_string(n->value);
        }
        std::println("{} ({}): {}", name, size_, s.empty() ? "пусто" : s);
    }

private:
    Node *head_ = nullptr;
    Node *tail_ = nullptr;
    std::size_t size_ = 0;
};

int main() {
    std::map<std::string, List> lists;
    std::string command, a;
    while (std::cin >> command) {
        if (command == "stats") {
            std::println("узлов выделено {}", List::allocated);
            continue;
        }
        std::cin >> a;
        if (command == "make") {
            std::size_t n;
            std::cin >> n;
            lists.erase(a);
            List &list = lists.try_emplace(a).first->second;
            for (std::size_t i = 0; i < n; ++i) {
                int v;
                std::cin >> v;
                list.push_back(v);
            }
        } else if (command == "copy" || command == "move") {
            std::string from;
            std::cin >> from;
            List tmp = command == "copy" ? List(lists.at(from)) : List(std::move(lists.at(from)));
            lists.erase(a);
            lists.try_emplace(a, std::move(tmp));
        } else if (command == "push") {
            int x;
            std::cin >> x;
            lists.at(a).push_back(x);
        } else {
            lists.at(a).print(a);
        }
    }
    return 0;
}`,
      explanation: `
Копия списка обходит все узлы и создаёт новые — O(n) выделений. Перемещение передаёт три поля: голову, хвост и размер, — O(1) и ни одного выделения, сколько бы узлов ни было. Источник становится пустым списком, и его деструктор ничего не удаляет.

Деструктор удаляет узлы циклом, а не рекурсией: рекурсивное удаление длинного списка могло бы переполнить стек. \`std::exchange(head_, head_->next)\` сдвигает голову и возвращает старый узел для удаления.`,
      examples: [
        {
          in: 'make A 3 1 2 3\ncopy B A\nmove C A\npush B 4\nprint A\nprint B\nprint C\nstats\n',
          out: 'A (0): пусто\nB (4): 1 2 3 4\nC (3): 1 2 3\nузлов выделено 7\n',
        },
        { in: 'make X 0\nprint X\nstats\n', out: 'X (0): пусто\nузлов выделено 0\n' },
      ],
      hidden: [
        { in: 'stats\n', name: 'Ничего' },
        { in: 'make A 2 5 6\nmove B A\nmove C B\nprint C\nstats\n', name: 'Цепочка перемещений' },
        { in: 'make A 2 5 6\ncopy B A\ncopy C B\nprint C\nstats\n', name: 'Цепочка копий' },
        {
          in: 'make A 1 1\nmove B A\npush A 9\nprint A\nprint B\n',
          name: 'Использование после перемещения',
        },
        { in: 'make A 1 1\nmake A 2 2 2\nprint A\nstats\n', name: 'Пересоздание' },
        {
          in: 'make A 3 1 2 3\nmake B 1 9\nmove B A\nprint B\nprint A\n',
          name: 'Перемещение поверх существующего',
        },
        { in: 'make A 0\npush A -1\npush A -2\ncopy B A\nprint B\n', name: 'Push в пустой' },
        {
          in: 'make A 5 1 2 3 4 5\nmove B A\ncopy C B\nprint A\nprint B\nprint C\nstats\n',
          name: 'Копия перемещённого',
        },
      ],
    },
  ],
};
