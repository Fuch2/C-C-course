const AVERAGE = (fixed) =>
  fixed
    ? String.raw`
#include <array>
#include <iomanip>
#include <iostream>

double average(const std::array<int, 6> &values) {
    long long sum = 0;
    for (int x : values) {
        sum += x;
    }
    return static_cast<double>(sum) / static_cast<double>(values.size());
}

int main() {
    std::array<int, 6> values{};
    for (int &x : values) {
        std::cin >> x;
    }
    std::cout << std::fixed << std::setprecision(2) << average(values) << '\n';
    return 0;
}`
    : String.raw`
#include <iomanip>
#include <iostream>

double average(int values[]) {
    int n = static_cast<int>(sizeof(values) / sizeof(values[0]));
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += values[i];
    }
    return static_cast<double>(sum) / n;
}

int main() {
    int values[6];
    for (int i = 0; i < 6; i++) {
        std::cin >> values[i];
    }
    std::cout << std::fixed << std::setprecision(2) << average(values) << '\n';
    return 0;
}`;

export default {
  id: 'cpp20-array',
  title: 'Массив фиксированного размера std::array',
  description:
    'Недостатки массивов C: превращение в указатель, нет присваивания и сравнения; std::array: размер в типе, копирование, сравнение, fill, at и алгоритмы; таблицы известного размера и двумерные массивы; выбор между array и vector.',
  moduleId: 'cpp-fundamentals',
  order: 16,
  difficulty: 'beginner',
  estimatedMinutes: 35,
  prerequisites: ['cpp20-vector'],
  objectives: [
    'Объявлять и инициализировать std::array',
    'Передавать массивы в функции без потери размера',
    'Применять к std::array алгоритмы и цикл по диапазону',
    'Выбирать между std::array и std::vector',
  ],
  tags: ['C++', 'array', 'Контейнеры'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <array>
#include <iostream>

int main() {
    std::array<int, 3> a = {1, 2, 3};
    std::array<int, 3> b = a;
    b[2] = 30;
    std::cout << a[2] << ' ' << b[2] << ' ' << (a == b) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 30 0'],
      placeholder: 'Вывод программы',
      explain:
        'Присваивание копирует элементы: b — независимая копия. == сравнивает содержимое, массивы различаются.',
    },
    {
      q: 'Почему внутри функции void f(int a[]) выражение sizeof(a) не равно размеру массива?',
      options: [
        'Параметр-массив на самом деле указатель int *, и sizeof возвращает размер указателя',
        'sizeof не работает внутри функций',
        'Массив копируется не полностью',
        'Равно — это корректный способ',
      ],
      correct: 0,
      explain: 'Массивы C при передаче превращаются в указатель на первый элемент и теряют размер.',
    },
    {
      q: 'Какие операции допустимы для std::array<int, 4> a, b;?',
      options: ['a = b;', 'a == b', 'a.push_back(5);', 'a.size()'],
      correct: [0, 1, 3],
      explain: 'Размер std::array фиксирован, поэтому push_back у него нет.',
    },
    {
      q: 'Что содержит std::array<int, 3> a{}; ?',
      options: ['Три нуля', 'Мусор', 'Пустой массив размера 0', 'Ошибка компиляции'],
      correct: 0,
      explain:
        'Пустые фигурные скобки инициализируют все элементы нулями. Без них значения неопределённы.',
    },
    {
      q: 'Можно ли присвоить std::array<int, 3> переменной типа std::array<int, 4>?',
      options: [
        'Нет: размер — часть типа, это разные типы',
        'Да, последний элемент станет нулём',
        'Да, если элементы одного типа',
        'Только через static_cast',
      ],
      correct: 0,
      explain: 'std::array<int, 3> и std::array<int, 4> различаются так же, как int и double.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <algorithm>
#include <array>
#include <iostream>

int main() {
    std::array<int, 5> a = {5, 3, 8, 1, 9};
    std::sort(a.begin(), a.end());
    std::cout << a.front() << a.back() << a[2] << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['195'],
      placeholder: 'Вывод программы',
      explain: 'После сортировки 1 3 5 8 9: первый 1, последний 9, средний 5 — печатаются подряд.',
    },
    {
      q: 'Где хранятся элементы локальной переменной std::array<double, 4>?',
      options: [
        'Внутри самого объекта — на стеке',
        'В куче',
        'В статической памяти',
        'В регистрах процессора',
      ],
      correct: 0,
      explain: 'std::array не выделяет память динамически — это обёртка над обычным массивом.',
    },
    {
      q: 'Когда лучше std::vector, чем std::array?',
      options: [
        'Когда число элементов зависит от входных данных',
        'Когда массив очень большой',
        'Когда размер известен заранее и мал',
        'Когда нужны 7 дней недели',
      ],
      correct: [0, 1],
      explain:
        'Переменный размер и большие объёмы — для vector. Маленькие таблицы известного размера — для array.',
    },
  ],
  exercises: [
    {
      title: 'Дни в месяце',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — номер месяца и год. Напечатайте число дней в этом месяце или \`ошибка\`, если номер месяца не от 1 до 12. Год високосный, если делится на 4, кроме кратных 100, не делящихся на 400.

Храните длины месяцев в \`const std::array<int, 12>\`.`,
      constraints: ['1 ≤ год ≤ 9999; строк не больше 30.'],
      hints: [
        'const std::array<int, 12> days = {31, 28, 31, …}; индекс — month − 1.',
        'Для февраля високосного года прибавьте единицу.',
      ],
      solution: String.raw`
#include <array>
#include <iostream>

bool is_leap(int year) {
    return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
}

int main() {
    const std::array<int, 12> days = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int month, year;
    while (std::cin >> month >> year) {
        if (month < 1 || month > 12) {
            std::cout << "ошибка\n";
            continue;
        }
        int result = days[static_cast<std::size_t>(month - 1)];
        if (month == 2 && is_leap(year)) {
            result++;
        }
        std::cout << result << '\n';
    }
    return 0;
}`,
      explanation: `
Двенадцать месяцев — свойство календаря, а не входных данных, поэтому таблица — \`std::array\` фиксированного размера, объявленный \`const\`. Номера месяцев начинаются с 1, индексы — с 0, отсюда \`month − 1\`. Проверка номера стоит до обращения к таблице: \`days[12]\` был бы чтением за границей.`,
      examples: [
        { in: '2 2024\n4 2025\n', out: '29\n30\n' },
        { in: '13 2000\n', out: 'ошибка\n' },
      ],
      hidden: [
        '1 1\n',
        '12 9999\n',
        '2 1900\n',
        '2 2000\n',
        '2 2023\n',
        '0 2020\n',
        '7 2020\n8 2020\n',
        '9 1\n11 1\n',
      ],
    },
    {
      title: 'Частоты цифр',
      description: `
Прочитайте весь ввод посимвольно и посчитайте, сколько раз встречается каждая цифра. Напечатайте для каждой встретившейся цифры строку \`цифра: количество\` по возрастанию цифр. Если цифр нет, напечатайте \`цифр нет\`.

Счётчики храните в \`std::array<int, 10>\`.`,
      constraints: ['Ввод до 10 000 символов ASCII.'],
      hints: [
        "std::array<int, 10> count{}; — пустые скобки обнуляют счётчики. Для цифры c: count[c − '0']++.",
        'Посимвольное чтение с пробелами и переводами строк: char c; while (std::cin.get(c)).',
      ],
      solution: String.raw`
#include <array>
#include <iostream>

int main() {
    std::array<int, 10> count{};
    char c;
    while (std::cin.get(c)) {
        if (c >= '0' && c <= '9') {
            count[static_cast<std::size_t>(c - '0')]++;
        }
    }
    bool any = false;
    for (std::size_t d = 0; d < count.size(); d++) {
        if (count[d] > 0) {
            std::cout << d << ": " << count[d] << '\n';
            any = true;
        }
    }
    if (!any) {
        std::cout << "цифр нет\n";
    }
    return 0;
}`,
      explanation: `
Цифр ровно десять, поэтому счётчики — \`std::array<int, 10>\`, обнулённый пустыми фигурными скобками. Это прямая адресация из модуля «Алгоритмы»: цифра сама служит индексом, \`c − '0'\` превращает символ в число от 0 до 9.

Без \`{}\` массив содержал бы мусор, и счётчики начинались бы со случайных значений. Цикл печати использует \`count.size()\` вместо числа 10 — если размер массива изменится, цикл не придётся исправлять.`,
      examples: [
        { in: 'Phone: 8-800-555-35-35\n', out: '0: 2\n3: 2\n5: 5\n8: 2\n' },
        { in: 'no digits here\n', out: 'цифр нет\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: '0123456789\n', name: 'Все цифры' },
        { in: '7777777\n', name: 'Одна цифра' },
        { in: 'a1b2c3\n3 2 1\n', name: 'Вперемешку' },
        { in: '2026-10-17 10:30\n', name: 'Дата и время' },
        { in: '9\n9\n9\n', name: 'Несколько строк' },
        { in: 'pi = 3.14159265358979\n', name: 'Число пи' },
        { in: '000\n', name: 'Нули' },
      ],
    },
    {
      title: 'Найди ошибку: среднее значение',
      bug: true,
      description: `
Программа читает ровно 6 целых чисел и печатает их среднее с двумя знаками после точки. Числа хранятся в массиве C, а функция \`average\` вычисляет количество элементов через \`sizeof\`.

Среднее получается неверным. Найдите причину и исправьте программу, перейдя на \`std::array\`.`,
      constraints: ['Ровно 6 чисел int, по модулю до 10⁹.'],
      hints: [
        'Чему равен sizeof(values) внутри функции с параметром int values[]? Компилятор предупреждает об этом.',
        'Параметр int values[] — это указатель int *: sizeof даёт 8, и n получается 2. Используйте std::array<int, 6> и values.size() — размер не теряется при передаче.',
      ],
      starter: AVERAGE(false),
      solution: AVERAGE(true),
      explanation: `
Параметр функции, объявленный как \`int values[]\`, — на самом деле указатель \`int *\`: массив при передаче превращается в адрес первого элемента. Поэтому \`sizeof(values)\` равен размеру указателя (8 байт), а не массива (24 байта), \`n\` получается 2, и функция усредняет только два первых числа. GCC предупреждает: \`sizeof on array function parameter will return size of 'int*'\`.

\`std::array<int, 6>\` хранит размер в своём типе, и \`values.size()\` внутри функции возвращает 6. Передача по константной ссылке не копирует массив. Если бы функция должна была работать с массивами разной длины, её сделали бы шаблоном по \`N\` или передавали бы \`std::vector\`.`,
      examples: [
        { in: '1 2 3 4 5 6\n', out: '3.50\n' },
        { in: '10 10 10 10 10 10\n', out: '10.00\n' },
      ],
      hidden: [
        '0 0 0 0 0 6\n',
        '-6 0 0 0 0 0\n',
        '1000000000 1000000000 1000000000 1000000000 1000000000 1000000000\n',
        '1 1 1 1 1 2\n',
        '5 4 3 2 1 0\n',
        '-1 -2 -3 -4 -5 -6\n',
        '7 0 0 0 0 0\n',
        '2 2 2 3 3 3\n',
      ],
    },
    {
      title: 'Крестики-нолики',
      difficulty: 'advanced',
      description: `
Ввод — три строки по три символа: \`X\`, \`O\` или \`.\` (пустая клетка). Определите состояние игры и напечатайте:

- \`победа X\` или \`победа O\` — если у игрока три знака в ряд по горизонтали, вертикали или диагонали;
- \`ничья\` — если победителя нет и пустых клеток не осталось;
- \`игра продолжается\` — иначе.

Доску храните в \`std::array<std::array<char, 3>, 3>\`. Гарантируется, что победитель не больше одного.`,
      constraints: ['Ввод всегда корректен: три строки по три символа.'],
      hints: [
        'Все восемь линий удобно описать таблицей координат: std::array<std::array<int, 6>, 8> lines — тройки пар (строка, столбец).',
        'Линия выиграна, если все три клетки равны одному символу и он не точка. Пустая клетка проверяется отдельным проходом по доске.',
      ],
      solution: String.raw`
#include <array>
#include <iostream>
#include <string>

int main() {
    std::array<std::array<char, 3>, 3> board{};
    for (auto &row : board) {
        std::string line;
        std::cin >> line;
        for (std::size_t c = 0; c < 3; c++) {
            row[c] = line[c];
        }
    }
    const std::array<std::array<int, 6>, 8> lines = {{
        {0, 0, 0, 1, 0, 2}, {1, 0, 1, 1, 1, 2}, {2, 0, 2, 1, 2, 2},
        {0, 0, 1, 0, 2, 0}, {0, 1, 1, 1, 2, 1}, {0, 2, 1, 2, 2, 2},
        {0, 0, 1, 1, 2, 2}, {0, 2, 1, 1, 2, 0},
    }};
    auto at = [&board](int r, int c) { return board[static_cast<std::size_t>(r)][static_cast<std::size_t>(c)]; };
    for (const auto &l : lines) {
        char a = at(l[0], l[1]);
        if (a != '.' && a == at(l[2], l[3]) && a == at(l[4], l[5])) {
            std::cout << "победа " << a << '\n';
            return 0;
        }
    }
    for (const auto &row : board) {
        for (char cell : row) {
            if (cell == '.') {
                std::cout << "игра продолжается\n";
                return 0;
            }
        }
    }
    std::cout << "ничья\n";
    return 0;
}`,
      explanation: `
Доска 3 × 3 — классический случай для \`std::array\`: размер — правило игры, а не данные. Восемь выигрышных линий записаны таблицей координат, а не восемью почти одинаковыми условиями: проверка одной линии написана один раз, и ошибиться в одной из восьми копий нельзя. Двойные фигурные скобки во внешнем инициализаторе нужны \`std::array\` массивов: внешние — для самого объекта, следующие — для его внутреннего массива.

Лямбда \`at\` захватывает доску по ссылке и прячет преобразования индексов. Порядок проверок важен: сначала победа, потом пустые клетки — заполненная доска с тремя в ряд — это победа, а не ничья.`,
      examples: [
        { in: 'XXX\nOO.\n...\n', out: 'победа X\n' },
        { in: 'XOX\nXOO\nOXX\n', out: 'ничья\n' },
      ],
      hidden: [
        { in: '...\n...\n...\n', name: 'Пустая доска' },
        { in: 'O..\nO.X\nOX.\n', name: 'Вертикаль O' },
        { in: 'X.O\n.XO\n..X\n', name: 'Главная диагональ' },
        { in: 'X.O\nXO.\nO.X\n', name: 'Побочная диагональ' },
        { in: 'XOX\nOXO\nOX.\n', name: 'Продолжается' },
        { in: 'XXO\nOOX\nXOX\n', name: 'Ничья 2' },
        { in: '...\nOOO\nX.X\n', name: 'Средняя строка' },
        { in: 'XOX\nXOX\nOXO\n', name: 'Полная без победы' },
      ],
    },
  ],
};
