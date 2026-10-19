const REVERSE = (fixed) =>
  fixed
    ? String.raw`
#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<int> values(n);
    for (int i = 0; i < n; i++) {
        std::cin >> values[i];
    }
    for (int i = n - 1; i >= 0; i--) {
        std::cout << values[i] << (i > 0 ? ' ' : '\n');
    }
    return 0;
}`
    : String.raw`
#include <cstdlib>
#include <iostream>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    int *values = malloc(n * sizeof *values);
    for (int i = 0; i < n; i++) {
        std::cin >> values[i];
    }
    for (int i = n - 1; i >= 0; i--) {
        std::cout << values[i] << (i > 0 ? ' ' : '\n');
    }
    free(values);
    return 0;
}`;

export default {
  id: 'cpp20-difference',
  title: 'От C к C++',
  description:
    'Откуда взялся C++ и чем он отличается от C; первая программа, файлы .cpp и компилятор g++; сравнение кода на C и C++; void *, bool, nullptr, имена структур и символьные литералы; заголовки библиотеки C в C++.',
  moduleId: 'cpp-fundamentals',
  order: 1,
  difficulty: 'beginner',
  estimatedMinutes: 35,
  prerequisites: [],
  objectives: [
    'Компилировать и запускать программы на C++',
    'Объяснять, что C++ берёт на себя по сравнению с C',
    'Узнавать отличия C++ от C: void *, bool, nullptr, имена структур',
    'Подключать библиотеку C в программе на C++',
  ],
  tags: ['C++', 'Отличия от C', 'Первая программа'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какой командой правильно скомпилировать main.cpp как программу на C++23?',
      options: [
        'g++ -std=c++23 main.cpp -o main',
        'gcc -std=c17 main.cpp -o main',
        'g++ -std=c17 main.cpp -o main',
        'cc main.cpp',
      ],
      correct: 0,
      explain:
        'Компилятор C++ — g++ (или clang++), стандарт — c++23. gcc с -std=c17 собирал бы программу как C.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int main() {
    std::cout << sizeof('x') << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1'],
      placeholder: 'Вывод программы',
      explain:
        'В C++ символьный литерал имеет тип char, и sizeof(char) всегда 1. В C было бы sizeof(int).',
    },
    {
      q: 'Почему строка int *p = malloc(40); не компилируется в C++?',
      options: [
        'В C++ void * не преобразуется в другой тип указателя неявно',
        'В C++ нет функции malloc',
        'malloc нельзя вызывать с числом',
        'В C++ указатели запрещены',
      ],
      correct: 0,
      explain:
        'malloc есть и в C++ (заголовок <cstdlib>), но его результат — void *, и для присваивания int * нужно явное приведение. Обычно же вместо malloc используют std::vector.',
    },
    {
      q: 'Какие утверждения о C++ верны?',
      options: [
        'bool, true и false встроены в язык',
        'После struct Point { … }; можно объявить переменную Point p;',
        'Функции библиотеки C доступны через заголовки вида <cstdio>',
        'Код на C++ нельзя смешивать с вызовами функций библиотеки C',
      ],
      correct: [0, 1, 2],
      explain:
        'Библиотека C доступна в C++ целиком; заголовки <cxxx> объявляют её функции и в пространстве имён std.',
    },
    {
      q: 'Чем nullptr лучше NULL?',
      options: [
        'nullptr — всегда пустой указатель, а NULL может оказаться целым числом 0 и выбрать не ту перегрузку функции',
        'nullptr быстрее',
        'nullptr занимает меньше памяти',
        'NULL в C++ запрещён',
      ],
      correct: 0,
      explain:
        'При перегрузках f(int) и f(int *) вызов f(NULL) обычно выберет f(int). У nullptr собственный тип, который преобразуется только в указатели.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string a = "C", b = "++";
    std::string c = a + b + b;
    std::cout << c << ' ' << c.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['C++++ 5'],
      placeholder: 'Вывод программы',
      explain: 'Оператор + склеивает строки: "C" + "++" + "++" = "C++++", пять символов.',
    },
    {
      q: 'Как в C++ называется заголовок с функцией sqrt?',
      answers: ['<cmath>', 'cmath'],
      placeholder: 'Заголовок',
      explain: 'Заголовки библиотеки C в C++: буква c в начале и без .h — <cmath> вместо <math.h>.',
    },
    {
      q: 'Что берёт на себя std::string по сравнению со строками C?',
      options: [
        'Выделение и освобождение памяти под символы',
        'Хранение длины строки',
        'Проверку орфографии',
        'Перевод строки в верхний регистр при выводе',
      ],
      correct: [0, 1],
      explain:
        'std::string сам выделяет память нужного размера, освобождает её и хранит длину — не нужен ни strlen, ни free.',
    },
  ],
  exercises: [
    {
      title: 'Сумма двух чисел',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — два целых числа. Для каждой строки напечатайте их сумму.

Читайте числа так: \`while (std::cin >> a >> b)\` — цикл закончится, когда ввод кончится. Подробно ввод разобран в уроке о \`std::cin\`.`,
      constraints: ['Числа по модулю не больше 10¹⁸; строк не больше 30.'],
      hints: [
        'Сумма двух чисел до 10¹⁸ — до 2·10¹⁸, это помещается в long long (до 9,2·10¹⁸).',
        "Печать: std::cout << a + b << '\\n';. Выражение a + b вычисляется до вывода.",
      ],
      solution: String.raw`
#include <iostream>

int main() {
    long long a, b;
    while (std::cin >> a >> b) {
        std::cout << a + b << '\n';
    }
    return 0;
}`,
      explanation: `
\`std::cin >> a >> b\` читает два числа и возвращает сам поток; в условии цикла поток «истинен», пока чтение удаётся. Когда ввод кончился, чтение не удаётся и цикл останавливается — это аналог \`while (scanf("%lld %lld", &a, &b) == 2)\`.

Формат вывода не нужен: поток сам знает, как печатать \`long long\`. Тип важен: числа до 10¹⁸ требуют \`long long\`, иначе сумма переполнится.`,
      examples: [
        { in: '2 3\n', out: '5\n' },
        { in: '-7 7\n100 1\n', out: '0\n101\n' },
      ],
      hidden: [
        '1000000000000000000 1000000000000000000\n',
        '-1000000000000000000 -1000000000000000000\n',
        '0 0\n',
        '2147483647 1\n',
        '-5 -6\n',
        '1 2\n3 4\n5 6\n',
        '999999999999999999 1\n',
        '123456789 987654321\n',
      ],
    },
    {
      title: 'Счётчик и максимум',
      description: `
До конца ввода идут целые числа. Напечатайте их количество и наибольшее через пробел. Если чисел нет, напечатайте \`пусто\`.

Используйте переменную \`bool\` для признака «максимум уже есть» — не особое число вроде \`-1\`.`,
      constraints: ['Чисел не больше 1000; числа int.'],
      hints: [
        'Заведите bool found = false; int best; и счётчик. Для каждого x: если !found или x > best — best = x и found = true.',
        'Любое число может быть максимумом — даже INT_MIN, поэтому особое значение-признак не подходит, а bool подходит.',
      ],
      solution: String.raw`
#include <iostream>

int main() {
    bool found = false;
    int best = 0;
    int count = 0;
    int x;
    while (std::cin >> x) {
        count++;
        if (!found || x > best) {
            best = x;
            found = true;
        }
    }
    if (found) {
        std::cout << count << ' ' << best << '\n';
    } else {
        std::cout << "пусто\n";
    }
    return 0;
}`,
      explanation: `
\`bool\` в C++ — встроенный тип со значениями \`true\` и \`false\`, подключать ничего не нужно. Флаг \`found\` честно отвечает на вопрос «видели ли мы хоть одно число» — в отличие от начального \`best = -1\`, которое сломалось бы на входе из одних отрицательных чисел.

Инвариант цикла тот же, что в уроке о поиске максимума: после каждого прочитанного числа \`best\` — наибольшее из прочитанных, если \`found\`.`,
      examples: [
        { in: '3 8 -2 8 5\n', out: '5 8\n' },
        { in: '', out: 'пусто\n' },
      ],
      hidden: [
        '-5 -3 -9\n',
        '7\n',
        '-2147483648\n',
        '2147483647 -2147483648\n',
        '0 0 0 0\n',
        '1\n2\n3\n4\n5\n',
        '5 4 3 2 1\n',
        '-1 -1 -2\n',
      ],
    },
    {
      title: 'Найди ошибку: код из C',
      bug: true,
      description: `
Программа читает \`n\` и \`n\` целых чисел и печатает их в обратном порядке. Её перенесли из C, и в C++ она не компилируется. Исправьте её — лучше всего так, как принято в C++.`,
      constraints: ['1 ≤ n ≤ 1000; числа int.'],
      hints: [
        'Прочитайте сообщение компилятора: invalid conversion from void* to int*. Что возвращает malloc?',
        'В C++ void * не превращается в int * неявно. Можно написать static_cast<int *>(malloc(…)), но лучше заменить массив на std::vector<int> values(n); — тогда не нужен и free.',
      ],
      starter: REVERSE(false),
      solution: REVERSE(true),
      explanation: `
В C результат \`malloc\` — \`void *\` — молча превращается в любой указатель. В C++ это преобразование нужно писать явно, поэтому строка с \`malloc\` даёт ошибку компиляции \`invalid conversion from 'void*' to 'int*'\`.

Явное приведение \`static_cast<int *>\` исправило бы компиляцию, но оставило бы ручное управление памятью: нужно проверять \`NULL\`, не забывать \`free\`, а при раннем выходе из функции — освобождать память на каждом пути. \`std::vector<int> values(n)\` создаёт массив из \`n\` нулей, обращение \`values[i]\` выглядит так же, а память освобождается сама, когда \`values\` выходит из области видимости.`,
      examples: [
        { in: '5\n1 2 3 4 5\n', out: '5 4 3 2 1\n' },
        { in: '1\n-7\n', out: '-7\n' },
      ],
      hidden: [
        '2\n1 2\n',
        '3\n0 0 0\n',
        '4\n-1 -2 -3 -4\n',
        '3\n2147483647 0 -2147483648\n',
        '6\n10 20 30 40 50 60\n',
        '5\n5 4 3 2 1\n',
        '7\n1 3 5 7 9 11 13\n',
        '8\n8 6 7 5 3 0 9 1\n',
      ],
    },
    {
      title: 'Самое длинное слово',
      difficulty: 'advanced',
      description: `
До конца ввода идут слова из латинских букв, разделённые пробелами и переводами строк. Напечатайте число слов, а на следующей строке — самое длинное слово и его длину через пробел; если таких несколько — первое из них. Если слов нет, напечатайте \`0\`.

Слово может быть длиной до 1000 символов — используйте \`std::string\`, а не массив \`char\` фиксированного размера.`,
      constraints: ['Слов не больше 1000; суммарно не больше 15 000 символов.'],
      hints: [
        'std::string word; while (std::cin >> word) — оператор >> читает слово до пробела, сам выделяя нужную память.',
        'Длина — word.size(). Строки присваиваются как числа: longest = word; копирует символы.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string word, longest;
    int count = 0;
    while (std::cin >> word) {
        count++;
        if (word.size() > longest.size()) {
            longest = word;
        }
    }
    std::cout << count << '\n';
    if (count > 0) {
        std::cout << longest << ' ' << longest.size() << '\n';
    }
    return 0;
}`,
      explanation: `
\`std::cin >> word\` читает очередное слово в \`std::string\`, и строка сама увеличивает свой буфер, если слово длинное. В C пришлось бы угадывать размер массива и ограничивать ширину в \`scanf("%999s", …)\`, рискуя обрезать или переполнить.

Присваивание \`longest = word\` копирует символы — это не копирование указателя, как было бы с \`char *\`. Пустая строка \`longest\` имеет длину 0, поэтому первое же слово её заменит; строгое \`>\` сохраняет первое из самых длинных слов.`,
      examples: [
        { in: 'the quick brown fox\n', out: '4\nquick 5\n' },
        { in: '', out: '0\n' },
      ],
      hidden: [
        { in: 'a\n', name: 'Одна буква' },
        { in: 'ab cd ef\n', name: 'Равные длины' },
        { in: 'one\ntwo\nthree\n', name: 'По одному в строке' },
        { in: `${'x'.repeat(1000)} y\n`, name: 'Слово из 1000 букв' },
        { in: 'short longer longest lo\n', name: 'Длинное в середине' },
        { in: '  spaced   words  \n', name: 'Лишние пробелы' },
        { in: 'A Bb Ccc Dddd Eeeee\n', name: 'Растущие длины' },
        { in: 'zzzz yyy xx w\n', name: 'Убывающие длины' },
      ],
    },
  ],
};
