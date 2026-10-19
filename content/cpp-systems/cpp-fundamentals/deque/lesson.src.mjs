const PLAYLIST = (fixed) => String.raw`
#include <deque>
#include <iostream>
#include <string>

int main() {
    std::string first;
    if (!(std::cin >> first)) {
        return 0;
    }
    std::deque<std::string> playlist = {first};
    std::size_t current = 0;
    std::string command;
    while (std::cin >> command) {
        if (command == "add_back" || command == "add_front") {
            std::string name;
            std::cin >> name;
            if (command == "add_back") {
                playlist.push_back(name);
            } else {
                playlist.push_front(name);${fixed ? '\n                current++;' : ''}
            }
        } else if (command == "next") {
            if (current + 1 < playlist.size()) {
                current++;
            }
        } else if (command == "prev") {
            if (current > 0) {
                current--;
            }
        } else if (command == "now") {
            std::cout << playlist[current] << '\n';
        }
    }
    return 0;
}`;

export default {
  id: 'cpp20-deque',
  title: 'Двусторонняя очередь std::deque',
  description:
    'std::deque: быстрые операции на обоих концах и доступ по индексу; устройство блоками и что из этого следует; сдвиг индексов при push_front; адаптеры std::stack и std::queue; дек в алгоритмах скользящего окна.',
  moduleId: 'cpp-fundamentals',
  order: 19,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp23-ranges'],
  objectives: [
    'Использовать std::deque для операций на обоих концах',
    'Объяснять, чем deque отличается от vector по устройству и стоимости операций',
    'Пользоваться адаптерами std::stack и std::queue',
    'Применять дек в алгоритмах',
  ],
  tags: ['C++', 'deque', 'stack', 'queue'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <deque>
#include <iostream>

int main() {
    std::deque<int> d;
    d.push_back(1);
    d.push_front(2);
    d.push_back(3);
    d.push_front(4);
    std::cout << d[0] << d[1] << d[2] << d[3] << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['4213'],
      placeholder: 'Вывод программы',
      explain: 'Добавления в начало ставят элементы слева: 1 → 2 1 → 2 1 3 → 4 2 1 3.',
    },
    {
      q: 'Какие операции std::deque выполняются за O(1)?',
      options: ['push_front', 'pop_back', 'Доступ d[i]', 'Вставка в середину'],
      correct: [0, 1, 2],
      explain: 'Вставка в середину сдвигает элементы — O(n), как у вектора.',
    },
    {
      q: 'Почему std::deque нельзя передать функции C, ожидающей указатель на массив элементов?',
      options: [
        'Элементы дека хранятся в нескольких блоках, а не одним непрерывным массивом',
        'Дек хранит элементы в обратном порядке',
        'У дека нет метода size',
        'Можно, это безопасно',
      ],
      correct: 0,
      explain:
        'Непрерывное хранение гарантирует std::vector — у него есть data(). У дека такой гарантии нет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <stack>

int main() {
    std::stack<int> s;
    s.push(1);
    s.push(2);
    s.push(3);
    s.pop();
    s.push(4);
    std::cout << s.top() << ' ' << s.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['4 3'],
      placeholder: 'Вывод программы',
      explain: 'После pop стек 1 2, затем push(4): вершина 4, элементов три.',
    },
    {
      q: 'Почему строка int x = q.pop(); не компилируется для std::queue<int> q?',
      options: [
        'pop() возвращает void — он только удаляет элемент',
        'pop() нельзя вызывать у очереди',
        'Нужно писать q.pop_front()',
        'pop() возвращает ссылку, которую нельзя присвоить',
      ],
      correct: 0,
      explain: 'Сначала читают q.front(), затем вызывают q.pop().',
    },
    {
      q: 'Что произойдёт с индексом элемента "x" в деке {"a", "x"} после push_front("b")?',
      options: ['Был 1, станет 2', 'Останется 1', 'Станет 0', 'Станет недействительным навсегда'],
      correct: 0,
      explain: 'Новый элемент получает индекс 0, и все прежние сдвигаются на единицу.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <queue>

int main() {
    std::queue<int> q;
    for (int i = 1; i <= 5; i++) {
        q.push(i);
    }
    q.push(q.front());
    q.pop();
    q.push(q.front());
    q.pop();
    std::cout << q.front() << ' ' << q.back() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 2'],
      placeholder: 'Вывод программы',
      explain: 'Дважды первый элемент уходит в конец: 1 2 3 4 5 → 2 3 4 5 1 → 3 4 5 1 2.',
    },
    {
      q: 'Какой контейнер по умолчанию лежит в основе std::stack и std::queue?',
      answers: ['std::deque', 'deque'],
      placeholder: 'Контейнер',
      explain:
        'По умолчанию адаптеры используют std::deque; другой контейнер можно указать вторым параметром шаблона.',
    },
  ],
  exercises: [
    {
      title: 'Палиндромы',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — фраза. Напечатайте \`да\`, если её латинские буквы без учёта регистра читаются одинаково слева направо и справа налево (остальные символы игнорируются), иначе \`нет\`. Строка без букв считается палиндромом.

Сложите буквы в \`std::deque<char>\` и сравнивайте концы, снимая их.`,
      constraints: ['Строк не больше 30, длиной до 200 символов ASCII.'],
      hints: [
        "Для каждой буквы добавьте в дек её строчную версию: для заглавной c − 'A' + 'a'.",
        'Пока в деке больше одного элемента: если front() != back() — не палиндром; иначе pop_front() и pop_back().',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::deque<char> letters;
        for (char c : line) {
            if (c >= 'a' && c <= 'z') {
                letters.push_back(c);
            } else if (c >= 'A' && c <= 'Z') {
                letters.push_back(static_cast<char>(c - 'A' + 'a'));
            }
        }
        bool palindrome = true;
        while (letters.size() > 1) {
            if (letters.front() != letters.back()) {
                palindrome = false;
                break;
            }
            letters.pop_front();
            letters.pop_back();
        }
        std::cout << (palindrome ? "да" : "нет") << '\n';
    }
    return 0;
}`,
      explanation: `
Палиндром проверяется сравнением крайних букв: если они равны, их можно отбросить и проверять оставшуюся середину. Дек удаляет элементы с обоих концов за \`O(1)\` — у вектора удаление из начала стоило бы \`O(n)\`, а вся проверка — \`O(n²)\`.

Цикл продолжается, пока букв больше одной: средняя буква фразы нечётной длины ни с чем не сравнивается. Строка без букв даёт пустой дек, и цикл не выполняется ни разу — фраза считается палиндромом.`,
      examples: [
        { in: 'A man, a plan, a canal: Panama\n', out: 'да\n' },
        { in: 'C++\nNever odd or even\n', out: 'да\nда\n' },
      ],
      hidden: [
        'abc\n',
        '\n',
        '!!!\n',
        'ab\n',
        'Aa\n',
        'Was it a car or a cat I saw?\n',
        'No lemon, no melon\nHello\n',
        'abca\n',
      ],
    },
    {
      title: 'Считалка',
      description: `
По кругу стоят \`n\` человек с номерами от 1 до \`n\`. Считая с первого, выбывает каждый \`k\`-й; счёт продолжается со следующего. Напечатайте номера в порядке выбывания через пробел.

Моделируйте круг очередью \`std::queue<int>\`: чтобы «пропустить» человека, переставьте его из начала очереди в конец.`,
      constraints: ['1 ≤ n ≤ 1000; 1 ≤ k ≤ 1000.'],
      hints: [
        'Положите в очередь 1, 2, …, n. Пока она не пуста: k − 1 раз переставьте q.front() в конец (push, затем pop), затем выведите q.front() и удалите его.',
        'Сначала прочитайте front(), потом вызовите pop(): pop() значение не возвращает.',
      ],
      solution: String.raw`
#include <iostream>
#include <queue>

int main() {
    int n, k;
    if (!(std::cin >> n >> k) || n < 1 || k < 1) {
        return 0;
    }
    std::queue<int> circle;
    for (int i = 1; i <= n; i++) {
        circle.push(i);
    }
    bool first = true;
    while (!circle.empty()) {
        for (int i = 1; i < k; i++) {
            circle.push(circle.front());
            circle.pop();
        }
        std::cout << (first ? "" : " ") << circle.front();
        first = false;
        circle.pop();
    }
    std::cout << '\n';
    return 0;
}`,
      explanation: `
Очередь моделирует круг: начало очереди — тот, с кого сейчас идёт счёт. Пересчитанный человек уходит в конец и снова окажется впереди через полный круг. После \`k − 1\` перестановок в начале стоит \`k\`-й — он выбывает.

Каждое выбывание стоит \`O(k)\` операций, весь алгоритм — \`O(n · k)\`, для \`n = k = 1000\` — миллион операций. Эта задача — знаменитая задача Иосифа Флавия; номер последнего выбывшего вычисляется и рекуррентной формулой за \`O(n)\`, но моделирование очередью нагляднее.`,
      examples: [
        { in: '7 3\n', out: '3 6 2 7 5 1 4\n' },
        { in: '5 1\n', out: '1 2 3 4 5\n' },
      ],
      hidden: ['1 1\n', '1 5\n', '2 2\n', '5 2\n', '6 6\n', '10 3\n', '4 100\n', '8 5\n'],
    },
    {
      title: 'Найди ошибку: плейлист',
      bug: true,
      description: `
Первая строка ввода — название первого трека; он сейчас играет. Дальше команды:

- \`add_back имя\`, \`add_front имя\` — добавить трек в конец или начало плейлиста;
- \`next\`, \`prev\` — перейти к следующему или предыдущему треку (на краю ничего не происходит);
- \`now\` — напечатать играющий трек.

Плейлист — \`std::deque<std::string>\`, играющий трек — индекс. После добавления в начало программа «перескакивает» на другой трек. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 1000; имена без пробелов.'],
      hints: [
        'Что происходит с индексами всех элементов дека после push_front?',
        'Новый трек получает индекс 0, все остальные сдвигаются на единицу. Чтобы индекс по-прежнему указывал на играющий трек, после push_front увеличьте current.',
      ],
      starter: PLAYLIST(false),
      solution: PLAYLIST(true),
      explanation: `
Играющий трек хранится индексом \`current\`. \`push_front\` ставит новый трек на позицию 0 и сдвигает все прежние элементы на одну позицию вправо — индекс играющего трека увеличивается на единицу, а переменная \`current\` остаётся прежней и теперь указывает на соседний трек.

Добавление в конец индексы не меняет, поэтому ошибка видна только после \`add_front\`. Индекс в контейнере — это не «имя» элемента, а его текущая позиция; любая операция, которая сдвигает элементы, обязана обновлять сохранённые индексы.`,
      examples: [
        { in: 'song1\nadd_back song2\nnext\nnow\n', out: 'song2\n' },
        { in: 'b\nadd_front a\nnow\nprev\nnow\n', out: 'b\na\n' },
      ],
      hidden: [
        'x\nnow\n',
        'b\nadd_front a\nadd_front z\nnow\n',
        'a\nadd_back b\nadd_back c\nnext\nnext\nnext\nnow\nadd_front z\nnow\n',
        'm\nadd_front l\nadd_back n\nnext\nnow\nprev\nprev\nprev\nnow\n',
        'one\nprev\nnow\nnext\nnow\n',
        'c\nadd_front b\nadd_front a\nprev\nprev\nnow\n',
        'q\nadd_back r\nadd_front p\nnext\nnow\n',
        'k\nadd_front j\nadd_front i\nadd_front h\nnow\nnext\nnow\n',
      ],
    },
    {
      title: 'Сломать меньше стен',
      difficulty: 'advanced',
      description: `
Первая строка — \`R\` и \`C\`, дальше \`R\` строк карты: \`.\` — проход, \`#\` — стена. Нужно попасть из левого верхнего угла в правый нижний, двигаясь по сторонам клеток. Пройти через стену можно, сломав её. Напечатайте наименьшее число стен, которые придётся сломать (если стена стоит в стартовой или конечной клетке, её тоже нужно сломать).

Решите задачу **поиском в ширину 0-1** на \`std::deque\`: переход в клетку-проход стоит 0, в клетку-стену — 1.`,
      constraints: ['1 ≤ R, C ≤ 100.'],
      hints: [
        'В обычном BFS все рёбра стоят 1. Если рёбра стоят 0 или 1, клетку, в которую попали по ребру 0, кладут в начало дека (push_front), а по ребру 1 — в конец (push_back). Тогда дек всегда упорядочен по расстоянию.',
        'Храните dist для каждой клетки (начально — очень большое число). Улучшили dist[v] — положите v в дек. Клетка может попасть в дек несколько раз; при извлечении её можно обработать повторно — это не ломает ответ.',
        'Стартовое расстояние — 1, если в старте стена, иначе 0.',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <string>
#include <vector>

int main() {
    int rows, cols;
    if (!(std::cin >> rows >> cols) || rows < 1 || cols < 1) {
        return 0;
    }
    std::vector<std::string> map(static_cast<std::size_t>(rows));
    for (auto &line : map) {
        std::cin >> line;
    }
    auto cost = [&map](int r, int c) {
        return map[static_cast<std::size_t>(r)][static_cast<std::size_t>(c)] == '#' ? 1 : 0;
    };
    const int infinity = 1 << 30;
    std::vector<int> dist(static_cast<std::size_t>(rows * cols), infinity);
    std::deque<int> cells;
    dist[0] = cost(0, 0);
    cells.push_back(0);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!cells.empty()) {
        int u = cells.front();
        cells.pop_front();
        int r = u / cols, c = u % cols;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                continue;
            }
            int v = nr * cols + nc, w = cost(nr, nc);
            if (dist[static_cast<std::size_t>(u)] + w < dist[static_cast<std::size_t>(v)]) {
                dist[static_cast<std::size_t>(v)] = dist[static_cast<std::size_t>(u)] + w;
                if (w == 0) {
                    cells.push_front(v);
                } else {
                    cells.push_back(v);
                }
            }
        }
    }
    std::cout << dist[static_cast<std::size_t>(rows * cols - 1)] << '\n';
    return 0;
}`,
      explanation: `
Обычный поиск в ширину находит кратчайшие пути, когда все рёбра стоят одинаково: очередь всегда содержит вершины с расстоянием \`d\`, за ними — \`d + 1\`. Если рёбра стоят 0 или 1, этот порядок сохраняется, если вершину, достигнутую по ребру веса 0, класть **в начало** — у неё то же расстояние, что у текущей, — а по ребру веса 1 — **в конец**. Для этого нужна структура с быстрыми операциями на обоих концах — дек.

Вершина может попасть в дек несколько раз, если её расстояние улучшилось, но каждое улучшение уменьшает расстояние, а расстояния ограничены, поэтому работа остаётся \`O(R · C)\`. Это частный случай алгоритма Дейкстры, где очередь с приоритетом заменена деком.`,
      examples: [
        { in: '3 3\n.#.\n.#.\n.#.\n', out: '1\n' },
        { in: '2 3\n...\n##.\n', out: '0\n' },
      ],
      hidden: [
        { in: '1 1\n.\n', name: 'Одна клетка' },
        { in: '1 1\n#\n', name: 'Одна стена' },
        { in: '1 5\n.###.\n', name: 'Коридор стен' },
        { in: '3 3\n###\n###\n###\n', name: 'Все стены' },
        { in: '3 4\n.#..\n.#.#\n...#\n', name: 'Обход дешевле' },
        { in: '4 4\n.###\n###.\n.###\n###.\n', name: 'Лабиринт стен' },
        { in: '2 2\n#.\n.#\n', name: 'Стены в углах' },
        { in: '5 5\n.....\n####.\n.....\n.####\n.....\n', name: 'Змейка без стен' },
      ],
    },
  ],
};
