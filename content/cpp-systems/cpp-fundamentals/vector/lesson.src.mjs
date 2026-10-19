const DIFFS = (fixed) => String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<long long> v;
    long long x;
    while (std::cin >> x) {
        v.push_back(x);
    }
    if (v.size() < 2) {
        std::cout << "нет\n";
        return 0;
    }
    for (std::size_t i = 0; ${fixed ? 'i + 1 < v.size()' : 'i < v.size()'}; i++) {
        std::cout << v[i + 1] - v[i] << (i + 2 < v.size() ? ' ' : '\n');
    }
    return 0;
}`;

export default {
  id: 'cpp20-vector',
  title: 'Динамический массив std::vector',
  description:
    'std::vector как готовый динамический массив; способы создания и разница круглых и фигурных скобок; push_back, pop_back, front, back, at; размер и ёмкость, reserve и resize; insert и erase по итератору; вектор векторов; передача в функции и возврат по значению.',
  moduleId: 'cpp-fundamentals',
  order: 15,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['cpp20-enum-class'],
  objectives: [
    'Создавать векторы и выбирать подходящий конструктор',
    'Добавлять, читать и удалять элементы, понимая стоимость операций',
    'Различать размер и ёмкость, reserve и resize',
    'Работать с двумерными векторами и возвращать векторы из функций',
  ],
  tags: ['C++', 'vector', 'Контейнеры'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Сколько элементов в std::vector<int> a(4) и в std::vector<int> b{4}?',
      options: ['4 и 1', '1 и 4', '4 и 4', '0 и 4'],
      correct: 0,
      explain:
        'Круглые скобки — размер (четыре нуля), фигурные — список элементов (один элемент 4).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {1, 2, 3};
    v.push_back(4);
    v.pop_back();
    v.pop_back();
    v.push_back(9);
    std::cout << v.size() << ' ' << v.back() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 9'],
      placeholder: 'Вывод программы',
      explain: '1 2 3 → 1 2 3 4 → 1 2 3 → 1 2 → 1 2 9: три элемента, последний 9.',
    },
    {
      q: 'Чем v.reserve(10) отличается от v.resize(10) для пустого вектора?',
      options: [
        'reserve выделяет память, но размер остаётся 0; resize создаёт 10 элементов',
        'Ничем',
        'reserve создаёт 10 нулей, resize — только выделяет память',
        'reserve работает только для строк',
      ],
      correct: 0,
      explain: 'После reserve обращение v[0] — выход за границу: элементов ещё нет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {5, 6, 7, 8};
    v.erase(v.begin() + 1);
    v.insert(v.begin(), 0);
    for (int x : v) {
        std::cout << x;
    }
    std::cout << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['0578'],
      placeholder: 'Вывод программы',
      explain:
        'erase удаляет элемент с индексом 1 (6): 5 7 8. insert в начало добавляет 0: 0 5 7 8.',
    },
    {
      q: 'Какова стоимость v.insert(v.begin(), x) для вектора из n элементов?',
      options: ['O(n)', 'O(1)', 'O(log n)', 'Амортизированное O(1)'],
      correct: 0,
      explain: 'Все n элементов сдвигаются на одну позицию вправо.',
    },
    {
      q: 'Чем опасен цикл for (std::size_t i = 0; i < v.size() - 1; i++) для пустого вектора?',
      options: [
        'v.size() − 1 — огромное беззнаковое число, и цикл выйдет за границу',
        'Цикл не выполнится ни разу — это безопасно',
        'Ошибка компиляции',
        'Цикл выполнится один раз',
      ],
      correct: 0,
      explain:
        'size() возвращает беззнаковое значение: 0 − 1 переполняется до SIZE_MAX. Пишите i + 1 < v.size().',
    },
    {
      q: 'Как лучше вернуть из функции вектор с результатами?',
      options: [
        'По значению: std::vector<int> f()',
        'Указателем на локальный вектор',
        'Ссылкой на локальный вектор',
        'Через глобальную переменную',
      ],
      correct: 0,
      explain:
        'Компилятор передаёт возвращаемый вектор вызывающему без копирования. Указатель или ссылка на локальный вектор повиснут.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> t(2, std::vector<int>(3, 1));
    t[1][2] = 5;
    int sum = 0;
    for (const auto &row : t) {
        for (int x : row) {
            sum += x;
        }
    }
    std::cout << t.size() << ' ' << t[0].size() << ' ' << sum << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['2 3 10'],
      placeholder: 'Вывод программы',
      explain: 'Две строки по три единицы, одна единица заменена на 5: 5 + 5 = 10.',
    },
  ],
  exercises: [
    {
      title: 'Чётные и нечётные',
      difficulty: 'beginner',
      description: `
До конца ввода идут целые числа. Разложите их в два вектора — чётные и нечётные, сохраняя порядок, — и напечатайте две строки: \`чётные: …\` и \`нечётные: …\`. Если в группе нет чисел, вместо списка напечатайте \`нет\`.`,
      constraints: ['Чисел не больше 1000; |числа| ≤ 10⁹.'],
      hints: [
        'Два вектора и push_back в нужный. Чётность — x % 2 == 0 (для отрицательных нечётных остаток равен −1, поэтому проверяйте именно равенство нулю).',
        'Печать удобно вынести в функцию void print(const std::string &title, const std::vector<long long> &v).',
      ],
      solution: String.raw`
#include <iostream>
#include <string>
#include <vector>

void print(const std::string &title, const std::vector<long long> &v) {
    std::cout << title << ':';
    if (v.empty()) {
        std::cout << " нет";
    }
    for (long long x : v) {
        std::cout << ' ' << x;
    }
    std::cout << '\n';
}

int main() {
    std::vector<long long> even, odd;
    long long x;
    while (std::cin >> x) {
        (x % 2 == 0 ? even : odd).push_back(x);
    }
    print("чётные", even);
    print("нечётные", odd);
    return 0;
}`,
      explanation: `
Векторы растут сами, поэтому заранее знать, сколько будет чётных чисел, не нужно — в C пришлось бы выделять массивы с запасом или считать дважды. Выражение \`(x % 2 == 0 ? even : odd)\` выбирает **ссылку** на один из векторов, и \`push_back\` добавляет в него.

Проверка чётности — именно \`x % 2 == 0\`: для отрицательного нечётного числа остаток в C++ равен −1, и условие \`x % 2 == 1\` ошибочно отнесло бы его к чётным.`,
      examples: [
        { in: '3 8 -2 7 0\n', out: 'чётные: 8 -2 0\nнечётные: 3 7\n' },
        { in: '', out: 'чётные: нет\nнечётные: нет\n' },
      ],
      hidden: [
        '1 3 5\n',
        '2 4 6\n',
        '-1 -2 -3\n',
        '0\n',
        '1000000000 -999999999\n',
        '7\n',
        '10 11 12 13 14 15\n',
        '-4 4 -5 5\n',
      ],
    },
    {
      title: 'Транспонирование',
      description: `
Первая строка — \`R\` и \`C\`, дальше \`R\` строк по \`C\` целых чисел. Напечатайте транспонированную матрицу: \`C\` строк по \`R\` чисел через пробел (строка \`j\` результата — столбец \`j\` исходной матрицы).

Храните матрицу в \`std::vector<std::vector<int>>\`.`,
      constraints: ['1 ≤ R, C ≤ 100; числа int.'],
      hints: [
        'Создайте матрицу нужного размера: std::vector<std::vector<int>> m(R, std::vector<int>(C)); и прочитайте m[r][c].',
        'При печати внешний цикл идёт по столбцам c, внутренний — по строкам r: печатается m[r][c].',
      ],
      solution: String.raw`
#include <iostream>
#include <vector>

int main() {
    int rows, cols;
    if (!(std::cin >> rows >> cols) || rows < 1 || cols < 1) {
        return 0;
    }
    std::vector<std::vector<int>> m(static_cast<std::size_t>(rows), std::vector<int>(static_cast<std::size_t>(cols)));
    for (auto &row : m) {
        for (int &x : row) {
            std::cin >> x;
        }
    }
    for (int c = 0; c < cols; c++) {
        for (int r = 0; r < rows; r++) {
            std::cout << m[static_cast<std::size_t>(r)][static_cast<std::size_t>(c)] << (r + 1 < rows ? ' ' : '\n');
        }
    }
    return 0;
}`,
      explanation: `
Вектор векторов создаётся сразу нужного размера: \`R\` копий строки из \`C\` нулей. Чтение идёт вложенными циклами по ссылкам — \`auto &row\` и \`int &x\`, — поэтому числа попадают прямо в матрицу.

Транспонирование меняет роли индексов: элемент \`(r, c)\` становится элементом \`(c, r)\`. Строить новую матрицу не нужно — достаточно печатать в другом порядке. Размеры задаются во время выполнения, что с двумерным массивом C потребовало бы ручного \`malloc\` и аккуратной арифметики индексов.`,
      examples: [
        { in: '2 3\n1 2 3\n4 5 6\n', out: '1 4\n2 5\n3 6\n' },
        { in: '1 1\n7\n', out: '7\n' },
      ],
      hidden: [
        '1 4\n1 2 3 4\n',
        '4 1\n1\n2\n3\n4\n',
        '2 2\n1 2\n3 4\n',
        '3 3\n1 2 3\n4 5 6\n7 8 9\n',
        '2 2\n-1 -2\n-3 -4\n',
        '3 2\n2147483647 0\n0 -2147483648\n5 5\n',
        '2 5\n1 1 1 1 1\n2 2 2 2 2\n',
        '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n',
      ],
    },
    {
      title: 'Найди ошибку: разности соседей',
      bug: true,
      description: `
Программа читает целые числа до конца ввода и печатает разности соседних элементов: \`v[1] − v[0]\`, \`v[2] − v[1]\`, … Если чисел меньше двух, печатается \`нет\`.

AddressSanitizer сообщает о чтении за границей вектора. Найдите и исправьте ошибку.`,
      constraints: ['Чисел не больше 1000; |числа| ≤ 10⁹.'],
      hints: [
        'Какой наибольший индекс читает тело цикла при последней итерации?',
        'Тело читает v[i + 1], поэтому i должно оставаться меньше v.size() − 1. Запишите условие как i + 1 < v.size() — оно не ломается и для беззнаковых чисел.',
      ],
      starter: DIFFS(false),
      solution: DIFFS(true),
      explanation: `
Разностей на одну меньше, чем элементов. Цикл с условием \`i < v.size()\` делает лишнюю итерацию с \`i = size − 1\` и читает \`v[size]\` — элемент за концом. \`operator[]\` вектора индекс не проверяет, как и массив C, поэтому это неопределённое поведение; AddressSanitizer сообщает \`heap-buffer-overflow\`, ведь элементы вектора лежат в куче.

Условие \`i + 1 < v.size()\` точно описывает «существует следующий элемент» и безопасно для беззнаковых чисел, в отличие от \`i < v.size() − 1\`. Для отладки можно временно заменить \`v[i + 1]\` на \`v.at(i + 1)\` — ошибка проявится понятным исключением \`std::out_of_range\`.`,
      examples: [
        { in: '1 4 9 16\n', out: '3 5 7\n' },
        { in: '5\n', out: 'нет\n' },
      ],
      hidden: [
        '1 2\n',
        '10 5\n',
        '0 0 0\n',
        '-1000000000 1000000000\n',
        '1 3 6 10 15\n',
        '7 7 7 7 7 7\n',
        '100 50 25 12\n',
        '-5 5 -5 5\n',
      ],
    },
    {
      title: 'Недавние файлы',
      difficulty: 'advanced',
      description: `
Редактор хранит список недавно открытых файлов: самый свежий — первым, не больше \`k\` записей. Первая строка — \`k\`, дальше команды:

- \`open имя\` — открыть файл: если он уже есть в списке, перенести его в начало, иначе добавить в начало; если записей стало больше \`k\`, удалить последнюю;
- \`list\` — напечатать список через пробел или \`пусто\`.

Храните список в \`std::vector<std::string>\`; используйте \`std::find\`, \`erase\` и \`insert\`.`,
      constraints: ['1 ≤ k ≤ 20; команд не больше 1000; имена без пробелов до 30 символов.'],
      hints: [
        'auto it = std::find(files.begin(), files.end(), name); если it != files.end() — files.erase(it).',
        'Затем files.insert(files.begin(), name); и, если files.size() > k, files.pop_back().',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::size_t k;
    if (!(std::cin >> k)) {
        return 0;
    }
    std::vector<std::string> files;
    std::string command;
    while (std::cin >> command) {
        if (command == "open") {
            std::string name;
            std::cin >> name;
            auto it = std::find(files.begin(), files.end(), name);
            if (it != files.end()) {
                files.erase(it);
            }
            files.insert(files.begin(), name);
            if (files.size() > k) {
                files.pop_back();
            }
        } else if (command == "list") {
            if (files.empty()) {
                std::cout << "пусто";
            }
            for (std::size_t i = 0; i < files.size(); i++) {
                std::cout << (i ? " " : "") << files[i];
            }
            std::cout << '\n';
        }
    }
    return 0;
}`,
      explanation: `
Каждое открытие — поиск, возможное удаление и вставка в начало. \`std::find\` возвращает итератор на найденное имя или \`end()\`; \`erase\` и \`insert\` принимают итераторы позиций. Порядок важен: сначала удалить старую запись, потом вставить новую — после \`insert\` итератор \`it\` был бы уже недействителен.

Все три операции — \`O(k)\`, но \`k\` не больше 20, и вектор здесь — лучший выбор: элементы лежат подряд и сдвигаются очень быстро. Для тысяч записей с частыми перемещениями в начало подошёл бы список с таблицей «имя → узел», как LRU-кэш из модуля «Алгоритмы».`,
      examples: [
        {
          in: '3\nopen a\nopen b\nopen c\nlist\nopen a\nlist\nopen d\nlist\n',
          out: 'c b a\na c b\nd a c\n',
        },
        { in: '2\nlist\n', out: 'пусто\n' },
      ],
      hidden: [
        { in: '1\nopen x\nopen y\nlist\n', name: 'k = 1' },
        { in: '3\nopen a\nopen a\nopen a\nlist\n', name: 'Повторное открытие' },
        { in: '2\nopen a\nopen b\nopen a\nlist\n', name: 'Перенос в начало' },
        { in: '3\nopen a\nlist\nopen b\nlist\nopen c\nlist\nopen d\nlist\n', name: 'Вытеснение' },
        {
          in: '4\nopen main.cpp\nopen util.h\nopen main.cpp\nopen README.md\nlist\n',
          name: 'Имена с точками',
        },
        { in: '2\nopen a\nopen b\nopen c\nopen b\nlist\n', name: 'Вытесненный не возвращается' },
        {
          in: '5\nopen e\nopen d\nopen c\nopen b\nopen a\nopen e\nlist\n',
          name: 'Последний в начало',
        },
        { in: '3\n', name: 'Без команд' },
      ],
    },
  ],
};
