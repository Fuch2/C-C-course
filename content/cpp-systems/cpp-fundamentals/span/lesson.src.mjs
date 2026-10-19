const GROWING = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <span>
#include <vector>

long long sum(std::span<const int> values) {
    long long total = 0;
    for (int x : values) {
        total += x;
    }
    return total;
}

int main() {
    std::vector<int> values;
    int n, m, x;
    std::cin >> n;
    for (int i = 0; i < n; i++) {
        std::cin >> x;
        values.push_back(x);
    }
${fixed ? '' : '    std::span<const int> base = values;   // основные числа\n'}    std::cin >> m;
    for (int i = 0; i < m; i++) {
        std::cin >> x;
        values.push_back(x);
    }
${fixed ? '    std::span<const int> base = std::span<const int>(values).first(static_cast<std::size_t>(n));\n' : ''}    std::println("основные: {}", sum(base));
    std::println("все: {}", sum(values));
    return 0;
}`;

export default {
  id: 'cpp23-span',
  title: 'Представление массива std::span',
  description:
    'Пара «указатель и длина» из C и её ошибки; std::span — одна функция для массивов, std::array и std::vector; span<const T> и span<T>; срезы first, last, subspan; фиксированный размер и size_bytes; непроверяемые границы и усиленный режим библиотеки; висячие представления после роста вектора.',
  moduleId: 'cpp-fundamentals',
  order: 17,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-array'],
  objectives: [
    'Писать функции, принимающие любые непрерывные последовательности через std::span',
    'Выбирать между span<const T>, span<T> и ссылкой на вектор',
    'Выделять части последовательности first, last и subspan',
    'Распознавать висячие представления после перевыделения памяти',
  ],
  tags: ['C++20', 'span', 'Контейнеры'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <span>

int main() {
    int a[] = {4, 8, 15, 16, 23, 42};
    std::span<int> s = a;
    std::println("{} {} {}", s.size(), s.first(2)[1], s.subspan(2, 3).back());
    return 0;
}`,
      lang: 'cpp',
      answers: ['6 8 23'],
      placeholder: 'Вывод программы',
      explain:
        'Шесть элементов; второй из первых двух — 8; subspan(2, 3) — это 15, 16, 23, последний — 23.',
    },
    {
      q: 'Из чего можно создать std::span<const int> без копирования элементов? Выберите все.',
      options: ['int a[10]', 'std::array<int, 5>', 'std::vector<int>', 'std::list<int>'],
      correct: [0, 1, 2],
      explain:
        'span — представление непрерывной памяти. Элементы std::list разбросаны по куче, поэтому из списка span не создать.',
    },
    {
      q: 'Чем std::span<const int> отличается от std::span<int>?',
      options: [
        'Через span<const int> элементы нельзя изменить',
        'span<const int> нельзя создать из вектора',
        'span<const int> копирует элементы',
        'Ничем',
      ],
      correct: 0,
      explain:
        'Это как const int * и int * в C. Для функций, которые только читают, — span<const T>.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <span>
#include <vector>

void fill(std::span<int> s, int value) {
    for (int &x : s) {
        x = value;
    }
}

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5};
    fill(std::span<int>(v).last(2), 0);
    std::println("{} {} {}", v[2], v[3], v[4]);
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 0 0'],
      placeholder: 'Вывод программы',
      explain:
        'Представление смотрит на элементы вектора, поэтому запись через него меняет сам вектор.',
    },
    {
      q: 'Сколько байтов занимает объект std::span<int> на 64-битной системе (размер представления, не элементов)?',
      answers: ['16'],
      placeholder: 'Число',
      explain:
        'Указатель (8 байт) и количество элементов (8 байт). Поэтому span передают по значению.',
    },
    {
      q: 'Что произойдёт, если создать std::span на вектор, а затем вызвать у вектора push_back много раз?',
      options: [
        'Вектор может переехать в новую память, и представление будет указывать на освобождённую',
        'Представление автоматически увеличится',
        'push_back не скомпилируется, пока существует span',
        'Ничего: span хранит копию элементов',
      ],
      correct: 0,
      explain:
        'span не знает о векторе — только адрес и длину. При перевыделении памяти он становится висячим.',
    },
    {
      q: 'Проверяет ли s[i] у std::span выход за границы?',
      options: [
        'Нет; выход за границы — неопределённое поведение, его ловят санитайзеры или усиленный режим библиотеки',
        'Да, бросает std::out_of_range',
        'Да, возвращает 0',
        'Только для span фиксированного размера',
      ],
      correct: 0,
      explain:
        'operator[] не проверяет индекс. -D_GLIBCXX_ASSERTIONS превращает ошибку в остановку программы; метод at() добавлен в C++26.',
    },
    {
      q: 'Функция должна добавлять элементы в контейнер. Какой параметр выбрать?',
      options: ['std::vector<int> &', 'std::span<int>', 'std::span<const int>', 'std::string_view'],
      correct: 0,
      explain:
        'span не умеет менять размер последовательности. Для добавления нужен сам вектор по ссылке.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <array>
#include <print>
#include <span>

int main() {
    std::array<double, 4> a{};
    std::span<double, 4> s = a;
    std::println("{} {}", s.size(), s.size_bytes());
    return 0;
}`,
      lang: 'cpp',
      answers: ['4 32'],
      placeholder: 'Вывод программы',
      explain: 'Четыре элемента по 8 байт — 32 байта.',
    },
  ],
  exercises: [
    {
      title: 'Сравнение половин',
      difficulty: 'beginner',
      description: `
Ввод: число \`n\`, затем \`n\` целых чисел. Разделите последовательность на две половины длиной \`n / 2\` (при нечётном \`n\` средний элемент не входит ни в одну) и напечатайте:

\`\`\`text
левая 10, правая 15
правая больше
\`\`\`

Во второй строке — \`левая больше\`, \`правая больше\` или \`поровну\`.

Напишите функцию \`long long sum(std::span<const int> values)\` и получите половины через \`first\` и \`last\`.`,
      constraints: ['1 ≤ n ≤ 100; числа по модулю до 10⁹.'],
      hints: [
        'std::span<const int> all = values; половины — all.first(n / 2) и all.last(n / 2).',
        'Сумма до 50 чисел по 10⁹ не помещается в int — копите её в long long.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <span>
#include <vector>

long long sum(std::span<const int> values) {
    long long total = 0;
    for (int x : values) {
        total += x;
    }
    return total;
}

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int &x : values) {
        std::cin >> x;
    }
    std::span<const int> all = values;
    long long left = sum(all.first(n / 2));
    long long right = sum(all.last(n / 2));
    std::println("левая {}, правая {}", left, right);
    if (left > right) {
        std::println("левая больше");
    } else if (right > left) {
        std::println("правая больше");
    } else {
        std::println("поровну");
    }
    return 0;
}`,
      explanation: `
\`first(n / 2)\` и \`last(n / 2)\` — два представления внутри одного вектора, без копирования элементов. При нечётном \`n\` они не пересекаются: средний элемент не попадает ни в одно. Функция \`sum\` принимает \`std::span<const int>\` и потому годится и для целого вектора, и для любой его части.`,
      examples: [
        { in: '4\n1 9 7 8\n', out: 'левая 10, правая 15\nправая больше\n' },
        { in: '5\n3 3 100 2 4\n', out: 'левая 6, правая 6\nпоровну\n' },
      ],
      hidden: [
        { in: '1\n42\n', name: 'Один элемент' },
        { in: '2\n5 -5\n', name: 'Два элемента' },
        { in: '6\n1000000000 1000000000 1000000000 -1 -1 -1\n', name: 'Большие числа' },
        { in: '3\n-1 0 -2\n', name: 'Отрицательные' },
        { in: '8\n1 2 3 4 4 3 2 1\n', name: 'Симметрия' },
        { in: '7\n0 0 0 9 0 0 1\n', name: 'Середина не считается' },
        { in: '10\n5 5 5 5 5 1 1 1 1 1\n', name: 'Левая больше' },
        { in: '4\n0 0 0 0\n', name: 'Нули' },
      ],
    },
    {
      title: 'Скользящее среднее',
      description: `
Ввод: числа \`n\` и \`k\`, затем \`n\` целых чисел. Для каждого «окна» из \`k\` подряд идущих чисел — начиная с позиций 0, 1, …, n − k — напечатайте среднее окна с двумя знаками после точки, каждое на своей строке.

Если \`k\` больше \`n\`, напечатайте \`окно больше данных\`.`,
      constraints: ['1 ≤ n ≤ 200; 1 ≤ k ≤ 200; числа по модулю до 10⁶.'],
      hints: [
        'Окно, начинающееся с позиции i, — std::span<const int>(values).subspan(i, k).',
        'Среднее печатайте через std::println("{:.2f}", static_cast<double>(s) / k).',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <span>
#include <vector>

long long sum(std::span<const int> values) {
    long long total = 0;
    for (int x : values) {
        total += x;
    }
    return total;
}

int main() {
    std::size_t n, k;
    std::cin >> n >> k;
    std::vector<int> values(n);
    for (int &x : values) {
        std::cin >> x;
    }
    if (k > n) {
        std::println("окно больше данных");
        return 0;
    }
    std::span<const int> all = values;
    for (std::size_t i = 0; i + k <= n; i++) {
        std::println("{:.2f}", static_cast<double>(sum(all.subspan(i, k))) / static_cast<double>(k));
    }
    return 0;
}`,
      explanation: `
Каждое окно — \`subspan(i, k)\`, представление из \`k\` элементов, начиная с \`i\`. Условие цикла \`i + k <= n\` гарантирует, что окно не выходит за конец: последнее начинается с \`n − k\`. Проверка \`k > n\` стоит до цикла — иначе выражение \`n − k\` для беззнаковых чисел дало бы огромное значение.

Решение считает сумму каждого окна заново — это O(n·k). Быстрее — сдвигать сумму: прибавлять новый элемент и вычитать ушедший; при таких ограничениях хватает и простого способа.`,
      examples: [
        { in: '5 3\n1 2 3 4 5\n', out: '2.00\n3.00\n4.00\n' },
        { in: '2 3\n7 8\n', out: 'окно больше данных\n' },
      ],
      hidden: [
        { in: '1 1\n-5\n', name: 'Одно число' },
        { in: '4 4\n1 2 3 5\n', name: 'Окно на всё' },
        { in: '6 2\n10 -10 10 -10 10 -10\n', name: 'Чередование' },
        { in: '5 1\n3 1 4 1 5\n', name: 'Окно 1' },
        { in: '7 3\n1000000 1000000 1000000 -1000000 0 0 1\n', name: 'Большие числа' },
        { in: '6 4\n1 2 2 1 3 3\n', name: 'Дробные средние' },
        { in: '3 200\n1 2 3\n', name: 'Огромное окно' },
        { in: '8 5\n9 8 7 6 5 4 3 2\n', name: 'Убывание' },
      ],
    },
    {
      title: 'Найди ошибку: представление на растущий вектор',
      bug: true,
      description: `
Ввод: число \`n\` и \`n\` «основных» чисел, затем число \`m\` и \`m\` «добавочных». Программа складывает все числа в один вектор и печатает сумму основных и сумму всех:

\`\`\`text
основные: 6
все: 15
\`\`\`

Иногда сумма основных получается странной, а под AddressSanitizer программа аварийно завершается. Найдите и исправьте ошибку.`,
      constraints: ['0 ≤ n, m ≤ 100; числа по модулю до 10⁶.'],
      hints: [
        'Посмотрите, когда создаётся представление base и что делает с памятью вектора каждый следующий push_back.',
        'Создайте представление после того, как вектор перестал расти: std::span<const int>(values).first(n).',
      ],
      starter: GROWING(false),
      solution: GROWING(true),
      explanation: `
\`base\` создаётся, пока в векторе только основные числа, и запоминает адрес его блока памяти. Добавочные \`push_back\` переполняют ёмкость, вектор выделяет новый блок, переносит элементы и освобождает старый. \`base\` по-прежнему указывает на старый блок — чтение из него AddressSanitizer называет \`heap-use-after-free\`. Без санитайзера программа иногда печатает правильную сумму, иногда мусор.

Исправление — создать представление после всех изменений размера: \`first(n)\` от уже заполненного вектора. Альтернатива — заранее вызвать \`values.reserve(n + m)\`, но тогда пришлось бы знать \`m\` до чтения основных чисел.`,
      examples: [
        { in: '3\n1 2 3\n4\n1 2 3 3\n', out: 'основные: 6\nвсе: 15\n' },
        { in: '1\n5\n2\n1 1\n', out: 'основные: 5\nвсе: 7\n' },
      ],
      hidden: [
        '2\n10 20\n3\n1 1 1\n',
        '4\n1 1 1 1\n5\n2 2 2 2 2\n',
        '5\n-1 -2 -3 -4 -5\n9\n1 2 3 4 5 6 7 8 9\n',
        '3\n1000000 1000000 1000000\n4\n-1000000 0 0 0\n',
        '1\n0\n2\n0 0\n',
        '6\n1 2 3 4 5 6\n7\n1 1 1 1 1 1 1\n',
        '2\n7 -7\n5\n3 3 3 3 3\n',
        '8\n1 1 1 1 1 1 1 1\n9\n2 2 2 2 2 2 2 2 2\n',
      ],
    },
    {
      title: 'Строки матрицы',
      difficulty: 'advanced',
      description: `
Ввод: числа \`r\` и \`c\`, затем матрица \`r × c\` по строкам. Храните её в одном векторе из \`r · c\` элементов. Напишите функцию

\`\`\`cpp
std::span<const int> row(std::span<const int> matrix, std::size_t cols, std::size_t i);
\`\`\`

которая возвращает \`i\`-ю строку как представление, и с её помощью напечатайте для каждой строки \`строка i: сумма S, максимум M\` (нумерация с 1), а затем \`лучшая строка: j\` — номер строки с наибольшей суммой (при равенстве — меньший номер).`,
      constraints: ['1 ≤ r, c ≤ 20; элементы по модулю до 10⁶.'],
      hints: [
        'i-я строка начинается с позиции i · cols: matrix.subspan(i * cols, cols).',
        'Максимум строки — std::ranges::max(view) из <algorithm> или обычный цикл, начиная с первого элемента.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <span>
#include <vector>

std::span<const int> row(std::span<const int> matrix, std::size_t cols, std::size_t i) {
    return matrix.subspan(i * cols, cols);
}

int main() {
    std::size_t r, c;
    std::cin >> r >> c;
    std::vector<int> data(r * c);
    for (int &x : data) {
        std::cin >> x;
    }
    std::size_t best = 0;
    long long best_sum = 0;
    for (std::size_t i = 0; i < r; i++) {
        std::span<const int> line = row(data, c, i);
        long long s = 0;
        int largest = line[0];
        for (int x : line) {
            s += x;
            largest = std::max(largest, x);
        }
        std::println("строка {}: сумма {}, максимум {}", i + 1, s, largest);
        if (i == 0 || s > best_sum) {
            best = i;
            best_sum = s;
        }
    }
    std::println("лучшая строка: {}", best + 1);
    return 0;
}`,
      explanation: `
Матрица в одном векторе — обычное представление двумерных данных: так её хранят библиотеки линейной алгебры и графики, потому что вся она лежит одним блоком памяти. Строка \`i\` занимает элементы с \`i · cols\` по \`i · cols + cols − 1\`, и \`subspan(i * cols, cols)\` выделяет их без копирования.

Функция \`row\` возвращает представление — и это безопасно: оно указывает внутрь аргумента, а аргумент смотрит на вектор \`data\`, который живёт всю программу и не меняет размер. Лучшая строка обновляется только при строго большей сумме, поэтому при равенстве остаётся меньший номер.`,
      examples: [
        {
          in: '2 3\n1 2 3\n4 5 -6\n',
          out: 'строка 1: сумма 6, максимум 3\nстрока 2: сумма 3, максимум 5\nлучшая строка: 1\n',
        },
        { in: '1 1\n-7\n', out: 'строка 1: сумма -7, максимум -7\nлучшая строка: 1\n' },
      ],
      hidden: [
        { in: '3 1\n1\n5\n2\n', name: 'Один столбец' },
        { in: '1 4\n-1 -2 -3 -4\n', name: 'Одна строка' },
        { in: '3 3\n1 1 1\n2 2 2\n3 3 3\n', name: 'Возрастание' },
        { in: '2 2\n5 5\n5 5\n', name: 'Равные суммы' },
        { in: '3 2\n-5 -5\n-1 -1\n-3 -3\n', name: 'Отрицательные' },
        { in: '2 3\n1000000 1000000 1000000\n-1000000 0 1000000\n', name: 'Большие' },
        { in: '4 2\n0 0\n0 1\n1 0\n1 1\n', name: 'Последняя лучшая' },
        { in: '2 5\n3 1 4 1 5\n9 2 6 5 3\n', name: 'Пять столбцов' },
      ],
    },
  ],
};
