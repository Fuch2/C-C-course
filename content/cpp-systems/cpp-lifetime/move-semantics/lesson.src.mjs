const ROSTER = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::vector<std::string> roster;
    std::string name;
    while (std::cin >> name) {
${
  fixed
    ? `        std::println("добавлен {}", name);
        roster.push_back(std::move(name));`
    : `        roster.push_back(std::move(name));
        std::println("добавлен {}", name);`
}
    }
    std::string all;
    for (const std::string &n : roster) {
        all += (all.empty() ? "" : ", ") + n;
    }
    std::println("всего {}: {}", roster.size(), all);
    return 0;
}`;

const TRACKED = String.raw`struct Tracked {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string v;

    explicit Tracked(std::string value) : v(std::move(value)) {}
    Tracked(const Tracked &other) : v(other.v) {
        ++copies;
    }
    Tracked(Tracked &&other) noexcept : v(std::move(other.v)) {
        ++moves;
    }
    Tracked &operator=(const Tracked &other) {
        v = other.v;
        ++copies;
        return *this;
    }
    Tracked &operator=(Tracked &&other) noexcept {
        v = std::move(other.v);
        ++moves;
        return *this;
    }
};`;

export default {
  id: 'lifetime-move-semantics',
  title: 'Семантика перемещения',
  description:
    'Зачем перемещать: копия владельца дорога, а источник часто больше не нужен. Перемещение забирает ресурсы за O(1); когда оно происходит само — временные объекты и return, — а когда нужен std::move; перемещаемые, но не копируемые типы unique_ptr, jthread, потоки ввода-вывода; корректное, но неопределённое состояние после перемещения; NRVO и почему не писать return std::move.',
  moduleId: 'cpp-lifetime',
  order: 11,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-rule-of-three'],
  objectives: [
    'Объяснять, чем перемещение отличается от копирования',
    'Определять, где объект перемещается автоматически',
    'Передавать некопируемые ресурсы перемещением',
    'Не пользоваться содержимым объекта после перемещения',
  ],
  tags: ['C++23', 'Время жизни', 'Перемещение', 'std::move', 'unique_ptr'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что происходит с буфером при перемещении std::vector?',
      options: [
        'Новый вектор забирает тот же буфер, элементы не копируются',
        'Элементы копируются в новый буфер, старый освобождается',
        'Оба вектора разделяют буфер',
        'Буфер копируется и сжимается',
      ],
      correct: 0,
      explain: 'Перемещение вектора — O(1): передаются указатель, размер и ёмкость.',
    },
    {
      q: 'Какие выражения могут перемещать без явного std::move? Выберите все.',
      options: [
        'v.push_back(std::string("x"));',
        'return local; где local — локальная переменная',
        'v.push_back(name); где name — переменная',
        'T b = a; где a — переменная',
      ],
      correct: [0, 1],
      explain:
        'Временные объекты и возвращаемые локальные переменные; именованные переменные копируются.',
    },
    {
      q: 'В каком состоянии остаётся std::string после перемещения из неё?',
      options: [
        'Корректном, но неопределённом: можно присвоить новое значение или уничтожить',
        'Разрушенном — использовать нельзя вообще',
        'Гарантированно содержит прежнее значение',
        'Гарантированно пуста по стандарту',
      ],
      correct: 0,
      explain: 'Реализации обычно оставляют пустую строку, но стандарт этого не обещает.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>
#include <utility>

int main() {
    auto a = std::make_unique<int>(5);
    auto b = std::move(a);
    std::println("{} {}", a == nullptr, *b);
    return 0;
}`,
      lang: 'cpp',
      answers: ['true 5'],
      placeholder: 'Вывод программы',
      explain: 'Перемещённый unique_ptr гарантированно пуст.',
    },
    {
      q: 'Почему не стоит писать return std::move(local);?',
      options: [
        'Это мешает NRVO и не даёт выигрыша: return local и так перемещает',
        'Это ошибка компиляции',
        'Это копирует объект дважды',
        'Это оставляет висячую ссылку',
      ],
      correct: 0,
      explain: 'Компиляторы предупреждают: -Wpessimizing-move.',
    },
    {
      q: 'Что выберет компилятор для T b = std::move(a); где a объявлена как const T?',
      options: [
        'Конструктор копирования',
        'Конструктор перемещения',
        'Ошибку компиляции',
        'Ничего',
      ],
      correct: 0,
      explain: 'Из константы ничего нельзя забрать: const T&& подходит только к const T&.',
    },
    {
      q: 'Какие типы можно только перемещать, но не копировать? Выберите все.',
      options: ['std::unique_ptr<int>', 'std::jthread', 'std::ifstream', 'std::string'],
      correct: [0, 1, 2],
      explain: 'Строку можно и копировать, и перемещать.',
    },
    {
      q: 'Как называется оптимизация, при которой локальная переменная функции строится прямо на месте возвращаемого значения? (англ. аббревиатура)',
      answers: ['NRVO', 'nrvo'],
      placeholder: 'Аббревиатура',
      explain:
        'Named Return Value Optimization — необязательная, в отличие от устранения копии временных объектов.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-move-semantics-exercise',
      title: 'Склад коробок',
      difficulty: 'beginner',
      description: `
Структура \`Box\` хранит строку и считает свои копии и перемещения (статические счётчики). Её перемещающий конструктор после переноса строки явно очищает источник: \`other.v.clear()\` — так у нас есть собственная гарантия, что перемещённая коробка пуста.

Коробки лежат в \`std::vector<Box>\` с зарезервированным местом на 1000 штук. Команды:

- \`new v\` — \`boxes.push_back(Box(v))\`;
- \`dup i\` — \`boxes.push_back(boxes[i - 1])\`;
- \`take i\` — \`Box taken = std::move(boxes[i - 1]);\` и напечатать \`взято v\`;
- \`show\` — содержимое коробок через пробел, пустые — как \`_\`;
- \`stats\` — \`копий C, перемещений M\`.`,
      constraints: ['Команд не больше 500; индексы существуют.'],
      hints: [
        'Box(Box &&other) noexcept : v(std::move(other.v)) { other.v.clear(); ++moves; }',
        'Временный Box(v) перемещается в вектор, элемент boxes[i - 1] — копируется: он остаётся нужен.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Box {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string v;

    explicit Box(std::string value) : v(std::move(value)) {}
    Box(const Box &other) : v(other.v) {
        ++copies;
    }
    Box(Box &&other) noexcept : v(std::move(other.v)) {
        other.v.clear();
        ++moves;
    }
};

int main() {
    std::vector<Box> boxes;
    boxes.reserve(1000);
    std::string command;
    while (std::cin >> command) {
        if (command == "new") {
            std::string v;
            std::cin >> v;
            boxes.push_back(Box(v));
        } else if (command == "dup") {
            std::size_t i;
            std::cin >> i;
            boxes.push_back(boxes[i - 1]);
        } else if (command == "take") {
            std::size_t i;
            std::cin >> i;
            const Box taken = std::move(boxes[i - 1]);
            std::println("взято {}", taken.v);
        } else if (command == "show") {
            std::string line;
            for (const Box &b : boxes) {
                line += (line.empty() ? "" : " ") + (b.v.empty() ? std::string("_") : b.v);
            }
            std::println("{}", line);
        } else {
            std::println("копий {}, перемещений {}", Box::copies, Box::moves);
        }
    }
    return 0;
}`,
      explanation: `
Временная \`Box(v)\` умрёт сразу после вставки — её содержимое перемещается. Элемент \`boxes[i - 1]\` остаётся в векторе, поэтому \`dup\` копирует. \`take\` явно разрешает забрать содержимое через \`std::move\`: элемент остаётся в векторе, но пустой.

Пустота перемещённой коробки — наша собственная гарантия, записанная в перемещающем конструкторе. Без \`other.v.clear()\` состояние строки после перемещения было бы корректным, но неопределённым.`,
      examples: [
        {
          in: 'new a\ndup 1\ntake 1\nshow\nstats\n',
          out: 'взято a\n_ a\nкопий 1, перемещений 2\n',
        },
        { in: 'show\nstats\n', out: '\nкопий 0, перемещений 0\n' },
      ],
      hidden: [
        { in: 'new x\nnew y\nstats\n', name: 'Только временные' },
        { in: 'new x\ndup 1\ndup 2\ndup 3\nstats\nshow\n', name: 'Цепочка копий' },
        { in: 'new a\ntake 1\ntake 1\nshow\n', name: 'Повторное взятие пустой' },
        { in: 'new a\ntake 1\ndup 1\nshow\nstats\n', name: 'Копия пустой' },
        { in: 'new p\nnew q\ntake 2\nshow\n', name: 'Взятие второй' },
        { in: 'stats\n', name: 'Без коробок' },
        {
          in: 'new длинное-содержимое-коробки\ndup 1\ntake 2\nshow\nstats\n',
          name: 'Длинная строка',
        },
        { in: 'new a\nnew b\nnew c\ntake 2\ndup 3\nshow\nstats\n', name: 'Смешанные операции' },
      ],
    },
    {
      title: 'Очередь задач',
      description: `
Задача \`Task\` хранит название и шаги (\`std::vector<std::string>\`) и считает свои копии и перемещения (напишите конструкторы копирования и перемещения, которые копируют или перемещают оба поля и увеличивают счётчики). Задачи ждут в \`std::deque<Task>\`. Команды:

- \`task название n шаг₁ … шагₙ\` — собрать задачу в локальной переменной и **переместить** её в конец очереди;
- \`clone\` — поставить в конец очереди **копию** последней задачи (очередь не пуста);
- \`run\` — **переместить** первую задачу из очереди в локальную переменную, удалить её из очереди и напечатать \`выполняется название: шаги через пробел\` или \`очередь пуста\`;
- \`stats\` — \`копий C, перемещений M\`.`,
      constraints: ['Команд не больше 200; шагов в задаче до 20.'],
      hints: [
        'Task(Task &&other) noexcept : title(std::move(other.title)), steps(std::move(other.steps)) { ++moves; }',
        'run: Task current = std::move(queue.front()); queue.pop_front(); — сначала забрать, потом удалить опустевший элемент.',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Task {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string title;
    std::vector<std::string> steps;

    Task() = default;
    Task(const Task &other) : title(other.title), steps(other.steps) {
        ++copies;
    }
    Task(Task &&other) noexcept : title(std::move(other.title)), steps(std::move(other.steps)) {
        ++moves;
    }
};

int main() {
    std::deque<Task> queue;
    std::string command;
    while (std::cin >> command) {
        if (command == "task") {
            Task t;
            std::size_t n;
            std::cin >> t.title >> n;
            for (std::size_t i = 0; i < n; ++i) {
                std::string step;
                std::cin >> step;
                t.steps.push_back(std::move(step));
            }
            queue.push_back(std::move(t));
        } else if (command == "clone") {
            queue.push_back(queue.back());
        } else if (command == "run") {
            if (queue.empty()) {
                std::println("очередь пуста");
                continue;
            }
            const Task current = std::move(queue.front());
            queue.pop_front();
            std::string steps;
            for (const std::string &s : current.steps) {
                steps += (steps.empty() ? "" : " ") + s;
            }
            std::println("выполняется {}: {}", current.title, steps);
        } else {
            std::println("копий {}, перемещений {}", Task::copies, Task::moves);
        }
    }
    return 0;
}`,
      explanation: `
Задача проходит путь «локальная переменная → очередь → локальная переменная», и на каждом шаге её содержимое перемещается: строки названия и шагов не копируются ни разу, меняются только владельцы буферов. Копия появляется только там, где она действительно нужна, — в \`clone\`, когда оригинал остаётся в очереди.

\`std::deque\` не переносит элементы при добавлении в конец и удалении из начала, поэтому счётчик перемещений растёт ровно на единицу за каждую \`task\` и \`run\`.`,
      examples: [
        {
          in: 'task сборка 2 код тест\nclone\nrun\nrun\nrun\nstats\n',
          out: 'выполняется сборка: код тест\nвыполняется сборка: код тест\nочередь пуста\nкопий 1, перемещений 3\n',
        },
        { in: 'stats\n', out: 'копий 0, перемещений 0\n' },
      ],
      hidden: [
        { in: 'run\n', name: 'Пустая очередь' },
        { in: 'task a 0\nrun\n', name: 'Задача без шагов' },
        { in: 'task a 1 x\ntask b 1 y\nrun\nrun\nstats\n', name: 'Две задачи' },
        { in: 'task a 1 x\nclone\nclone\nstats\n', name: 'Две копии' },
        { in: 'task a 3 p q r\nrun\ntask b 1 s\nrun\nstats\n', name: 'Чередование' },
        { in: 'task деплой 2 сборка выкладка\nclone\nrun\nstats\n', name: 'Кириллица' },
        { in: 'task a 1 x\ntask b 1 y\nclone\nrun\nrun\nrun\n', name: 'Копия последней' },
        { in: 'stats\ntask a 1 b\nstats\n', name: 'Статистика до и после' },
      ],
    },
    {
      title: 'Найди ошибку: пропавшее имя',
      bug: true,
      description: `
Программа регистрирует участников: для каждого имени печатает \`добавлен имя\`, а в конце — \`всего N: имена через запятую\`. Вместо имён в строках «добавлен» пусто. Найдите и исправьте ошибку, сохранив перемещение имени в список.`,
      constraints: ['Имён не больше 100.'],
      hints: [
        'Что содержит name после roster.push_back(std::move(name))?',
        'Используйте значение до того, как отдали его: сначала печать, потом перемещение.',
      ],
      starter: ROSTER(false),
      solution: ROSTER(true),
      explanation: `
\`std::move(name)\` разрешил вектору забрать содержимое строки, и \`push_back\` его забрал. После этого \`name\` в корректном, но неопределённом состоянии — в libstdc++ это пустая строка. Печать после перемещения выводит то, что осталось, а не имя.

Порядок важен: всё, что нужно от объекта, делайте до перемещения. Сам \`name\` после перемещения пригоден для повторного использования — следующий \`std::cin >> name\` присвоит ему новое значение.`,
      examples: [
        { in: 'Ада\nАлан\n', out: 'добавлен Ада\nдобавлен Алан\nвсего 2: Ада, Алан\n' },
        { in: 'X\n', out: 'добавлен X\nвсего 1: X\n' },
      ],
      hidden: [
        'a b c\n',
        'Грейс\n',
        'очень-длинное-имя-участника-соревнований\n',
        'p\nq\nr\ns\n',
        'one two\n',
        'Ян\nЛи\n',
        'z\n',
        'Бьёрн Деннис Кен\n',
      ],
    },
    {
      title: 'Обмен без копий',
      difficulty: 'advanced',
      description: `
Структура \`Tracked\` хранит строку и считает копии и перемещения — и в конструкторах, и в операторах присваивания. Прочитайте первую строку ввода — значения через пробел — в \`std::vector<Tracked>\` (через \`emplace_back\` и \`reserve\`, чтобы не было лишних операций), затем обнулите счётчики.

Реализуйте сами, **без копирования**:

- \`void my_swap(Tracked &a, Tracked &b)\` — ровно 3 перемещения;
- \`void rotate3(Tracked &a, Tracked &b, Tracked &c)\` — a ← b, b ← c, c ← a (старое a), ровно 4 перемещения;
- \`reverse\` — разворот всего вектора через \`my_swap\`.

Команды: \`swap i j\`, \`rotate i j k\` (индексы различны), \`reverse\`, \`show\` — значения через пробел, \`stats\` — \`копий C, перемещений M\`.`,
      constraints: ['До 100 значений; команд до 200; индексы с 1.'],
      hints: [
        'my_swap: Tracked tmp = std::move(a); a = std::move(b); b = std::move(tmp); — одно перемещающее создание и два перемещающих присваивания.',
        'swap i i допустим и в этом случае должен ничего не менять; проверьте, что перемещающее присваивание объекта самому себе (a = std::move(a)) не портит строку, или не вызывайте его.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

${TRACKED}

void my_swap(Tracked &a, Tracked &b) {
    if (&a == &b) {
        return;
    }
    Tracked tmp = std::move(a);
    a = std::move(b);
    b = std::move(tmp);
}

void rotate3(Tracked &a, Tracked &b, Tracked &c) {
    Tracked tmp = std::move(a);
    a = std::move(b);
    b = std::move(c);
    c = std::move(tmp);
}

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream in(line);
    std::vector<std::string> words;
    std::string w;
    while (in >> w) {
        words.push_back(w);
    }
    std::vector<Tracked> items;
    items.reserve(words.size());
    for (const std::string &word : words) {
        items.emplace_back(word);
    }
    Tracked::copies = 0;
    Tracked::moves = 0;

    std::string command;
    while (std::cin >> command) {
        if (command == "swap") {
            std::size_t i, j;
            std::cin >> i >> j;
            my_swap(items[i - 1], items[j - 1]);
        } else if (command == "rotate") {
            std::size_t i, j, k;
            std::cin >> i >> j >> k;
            rotate3(items[i - 1], items[j - 1], items[k - 1]);
        } else if (command == "reverse") {
            for (std::size_t l = 0, r = items.size(); l + 1 < r; ++l, --r) {
                my_swap(items[l], items[r - 1]);
            }
        } else if (command == "show") {
            std::string s;
            for (const Tracked &t : items) {
                s += (s.empty() ? "" : " ") + t.v;
            }
            std::println("{}", s);
        } else {
            std::println("копий {}, перемещений {}", Tracked::copies, Tracked::moves);
        }
    }
    return 0;
}`,
      explanation: `
Обмен через временную переменную классически требует трёх копий. С перемещением это три переноса указателей: \`tmp\` забирает содержимое \`a\`, \`a\` — содержимое \`b\`, \`b\` — содержимое \`tmp\`. Ни один символ строк не копируется, сколько бы они ни весили. Так устроен и \`std::swap\`.

Проверка \`&a == &b\` защищает от самоперемещения: \`a = std::move(a)\` для строки оставляет её в неопределённом состоянии, и после такого «обмена» значение могло бы пропасть. Разворот вектора — n/2 обменов, то есть 3·⌊n/2⌋ перемещений и ни одной копии.`,
      examples: [
        {
          in: 'a b c d\nswap 1 4\nshow\nrotate 1 2 3\nshow\nstats\n',
          out: 'd b c a\nb c d a\nкопий 0, перемещений 7\n',
        },
        { in: 'x y z\nreverse\nshow\nstats\n', out: 'z y x\nкопий 0, перемещений 3\n' },
      ],
      hidden: [
        { in: 'a\nreverse\nshow\nstats\n', name: 'Один элемент' },
        { in: 'a b\nswap 1 1\nshow\nstats\n', name: 'Обмен с собой' },
        { in: '1 2 3 4 5 6\nreverse\nshow\nstats\n', name: 'Чётное число' },
        { in: 'p q r\nrotate 3 2 1\nshow\n', name: 'Обратный поворот' },
        {
          in: 'a b c\nrotate 1 2 3\nrotate 1 2 3\nrotate 1 2 3\nshow\nstats\n',
          name: 'Три поворота',
        },
        {
          in: 'длинная-строка-номер-один короткая\nswap 1 2\nshow\nstats\n',
          name: 'Длинные строки',
        },
        { in: '\nstats\nreverse\nshow\n', name: 'Пустой вектор' },
        { in: 'a b c d e\nreverse\nswap 2 4\nrotate 1 3 5\nshow\nstats\n', name: 'Все команды' },
      ],
    },
  ],
};
