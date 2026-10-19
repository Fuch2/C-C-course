const READ_MAX = (fixed) => String.raw`
#include <stdio.h>

${
  fixed
    ? 'static inline int max_int(int a, int b) {\n    return a > b ? a : b;\n}'
    : '#define MAX(a, b) ((a) > (b) ? (a) : (b))'
}

static int read_count = 0;

// Читает следующее число; если чисел больше нет, возвращает -1000000.
int next_value(void) {
    int value;
    if (scanf("%d", &value) != 1) {
        return -1000000;
    }
    read_count++;
    return value;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    int best = -1000000;
    for (int i = 0; i < n; i++) {
        best = ${fixed ? 'max_int' : 'MAX'}(next_value(), best);
    }
    printf("максимум: %d\n", best);
    printf("прочитано чисел: %d\n", read_count);
    return 0;
}`;

const MATRIX = (fixed) => {
  const i = fixed ? 'i_' : 'i';
  return String.raw`
#include <stdio.h>

#define SUM_ARRAY(arr, n, result)              \
    do {                                       \
        long long acc_ = 0;                    \
        for (int ${i} = 0; ${i} < (n); ${i}++) {${fixed ? '' : '   '}     \
            acc_ += (arr)[${i}];${fixed ? '' : ' '}               \
        }                                      \
        (result) = acc_;                       \
    } while (0)

int main(void) {
    int rows, cols;
    int m[10][10] = {{0}};
    long long sums[10];
    if (scanf("%d %d", &rows, &cols) != 2 || rows < 1 || rows > 10 || cols < 1 || cols > 10) {
        return 0;
    }
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (scanf("%d", &m[i][j]) != 1) {
                return 0;
            }
        }
    }
    long long total = 0;
    for (int i = 0; i < rows; i++) {
        SUM_ARRAY(m[i], cols, sums[i]);
        total += sums[i];
    }
    for (int i = 0; i < rows; i++) {
        printf("строка %d: %lld\n", i + 1, sums[i]);
    }
    printf("всего: %lld\n", total);
    return 0;
}`;
};

const GENERIC_MAIN = String.raw`
int main(void) {
    char type[8];
    while (scanf("%7s", type) == 1) {
        if (strcmp(type, "int") == 0) {
            int a, b;
            if (scanf("%d %d", &a, &b) != 2) {
                break;
            }
            PRINT(MAX2(a, b));
        } else if (strcmp(type, "long") == 0) {
            long long a, b;
            if (scanf("%lld %lld", &a, &b) != 2) {
                break;
            }
            PRINT(MAX2(a, b));
        } else if (strcmp(type, "double") == 0) {
            double a, b;
            if (scanf("%lf %lf", &a, &b) != 2) {
                break;
            }
            PRINT(MAX2(a, b));
        } else if (strcmp(type, "word") == 0) {
            char a[32], b[32];
            if (scanf("%31s %31s", a, b) != 2) {
                break;
            }
            PRINT(MAX2(a, b));
        }
    }
    return 0;
}`;

export default {
  id: 'advanced-macro-hazards',
  title: 'Опасности макросов и безопасные замены',
  description:
    'Чем макрос отличается от функции: повторное вычисление аргументов с побочными эффектами, захват имён, отсутствие проверки типов, запятые в аргументах, ошибки и отладка; безопасные замены — static inline, enum и _Generic; правила для макросов, без которых не обойтись.',
  moduleId: 'advanced-c',
  order: 10,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-function-macros'],
  objectives: [
    'Распознавать повторное вычисление аргументов и захват имён в макросах',
    'Объяснять, почему макрос не проверяет типы и как это проявляется',
    'Заменять макросы функциями static inline и выражениями _Generic',
    'Писать необходимые макросы по правилам, снижающим риск ошибок',
  ],
  tags: ['Макросы', 'Побочные эффекты', 'static inline', '_Generic', 'Захват имён'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define ABS(x) ((x) < 0 ? -(x) : (x))

static int counter = 0;

int next(void) {
    return --counter;
}

int main(void) {
    int v = ABS(next());
    printf("%d %d\n", v, counter);
    return 0;
}`,
      answers: ['2 -2'],
      placeholder: 'Вывод программы',
      explain:
        'ABS(next()) раскрывается в ((next()) < 0 ? -(next()) : (next())). Первый вызов вернул -1 — условие истинно, и next() вызывается снова, возвращая -2. Итог: v = 2, counter = -2, хотя ожидалось 1 и -1.',
    },
    {
      q: 'Сколько раз вызовется функция read_value() в строке int m = MAX(read_value(), 0); при #define MAX(a, b) ((a) > (b) ? (a) : (b)), если она вернула 7?',
      answers: ['2', 'два', 'дважды'],
      placeholder: 'Число',
      explain:
        'Один раз в условии и ещё раз в выбранной ветке, потому что 7 > 0. Если бы первый вызов вернул отрицательное число, второй раз вызвался бы 0, а не функция.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define TWICE_SUM(x) do { int sum = 0; sum += (x); sum += (x); printf("%d\n", sum); } while (0)

int main(void) {
    int sum = 10;
    TWICE_SUM(sum);
    return 0;
}`,
      answers: ['0'],
      placeholder: 'Вывод программы',
      explain:
        'Внутри макроса sum — новая переменная, равная нулю. Аргумент sum подставился в блок макроса и означает уже её: 0 + 0 + 0 = 0. Это захват имени.',
    },
    {
      q: 'Почему MAX(-1, 1u) при #define MAX(a, b) ((a) > (b) ? (a) : (b)) возвращает 4294967295?',
      options: [
        'При сравнении int с unsigned int число -1 превращается в беззнаковое 4294967295',
        'Макрос переполняет стек',
        'Препроцессор неправильно разбирает знак минус',
        'Это ошибка компилятора',
      ],
      correct: 0,
      explain:
        'Обычные арифметические преобразования приводят оба операнда к unsigned int. Функция с параметрами int не допустила бы такого.',
    },
    {
      q: 'Сколько аргументов получит макрос в вызове INIT(table, {1, 2, 3})?',
      answers: ['4', 'четыре'],
      placeholder: 'Число',
      explain:
        'Препроцессор учитывает только круглые скобки. Запятые внутри фигурных скобок делят аргументы: table, {1, 2 и 3}.',
    },
    {
      q: 'Что из этого — преимущества static inline функции перед макросом? Выберите все.',
      options: [
        'Каждый аргумент вычисляется ровно один раз',
        'Типы аргументов проверяются',
        'Локальные переменные не конфликтуют с именами вызывающего кода',
        'Можно получить текст аргумента как строку',
      ],
      correct: [0, 1, 2],
      explain:
        'Получить текст аргумента может только препроцессор (оператор #). Остальное — свойства функций.',
    },
    {
      q: 'Что делает выражение _Generic((x), int: f_int, double: f_double)(x)?',
      options: [
        'Во время компиляции выбирает функцию по типу x и вызывает её с аргументом x',
        'Во время работы программы проверяет тип x',
        'Преобразует x к int или double',
        'Вызывает обе функции и сравнивает результаты',
      ],
      correct: 0,
      explain:
        'Управляющее выражение _Generic не вычисляется: от него берётся только тип. Результат выбора — имя функции, а за ним следует обычный вызов.',
    },
    {
      q: 'Какие правила снижают риск ошибок в макросе, без которого не обойтись? Выберите все.',
      options: [
        'Имя заглавными буквами',
        'Каждый параметр и всю замену — в скобки',
        'Несколько инструкций — в do { … } while (0)',
        'Точка с запятой в конце определения',
        'Локальные переменные с короткими именами вроде i и t',
      ],
      correct: [0, 1, 2],
      explain:
        'Точку с запятой ставит вызывающий код, а локальным переменным макроса нужны необычные имена, иначе возможен захват.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: двойное чтение',
      bug: true,
      description: `
Программа читает \`n\`, затем \`n\` целых чисел и печатает их максимум и сколько чисел прочитано. Для максимума используется макрос \`MAX\`, в который передаётся вызов функции чтения.

На некоторых входах программа печатает неверный максимум и неверное количество прочитанных чисел. Исправьте ошибку так, чтобы каждое число читалось ровно один раз.`,
      constraints: ['1 ≤ n ≤ 50; числа от −10⁵ до 10⁵.'],
      hints: [
        'Подставьте макрос вручную: сколько раз next_value() окажется в выражении и когда вызовется второй раз?',
        'Замените макрос функцией static inline int max_int(int a, int b) — её аргументы вычисляются один раз. Другой вариант — сначала сохранить значение в переменную.',
      ],
      starter: READ_MAX(false),
      solution: READ_MAX(true),
      explanation: `
\`MAX(next_value(), best)\` раскрывается в \`((next_value()) > (best) ? (next_value()) : (best))\`. Когда прочитанное число больше текущего максимума, выбирается первая ветка — и \`next_value()\` вызывается ещё раз, «съедая» следующее число. В итоге максимум может стать числом, которое вообще не участвовало в сравнении, а часть чисел пропускается.

Функция вычисляет аргументы до вызова — ровно по одному разу. \`static inline\` позволяет компилятору встроить её так же, как подставился бы макрос, поэтому исправление ничего не стоит. Важнее другое: побочный эффект в аргументе макроса — классическая ошибка, которую не видно в месте вызова.`,
      examples: [
        { in: '3\n1 5 2\n', out: 'максимум: 5\nпрочитано чисел: 3\n' },
        { in: '2\n-4 -9\n', out: 'максимум: -4\nпрочитано чисел: 2\n' },
      ],
      hidden: [
        '1\n42\n',
        '4\n1 2 3 4\n',
        '4\n4 3 2 1\n',
        '5\n0 0 0 0 0\n',
        '6\n10 -1 20 -2 30 -3\n',
        '3\n-100000 100000 0\n',
        '7\n5 1 6 2 7 3 8\n',
        '2\n7 7\n',
      ],
    },
    {
      title: 'Найди ошибку: захват имени',
      bug: true,
      description: `
Программа читает размеры таблицы \`rows cols\` и саму таблицу целых чисел, затем печатает сумму каждой строки (\`строка K: S\`) и общую сумму (\`всего: T\`). Сумму строки считает макрос \`SUM_ARRAY\`.

Суммы получаются неверными, хотя сам макрос аккуратно оформлен: скобки, \`do { … } while (0)\`, своё имя для накопителя. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ rows, cols ≤ 10; числа от −10⁶ до 10⁶.'],
      hints: [
        'Подставьте макрос в строку SUM_ARRAY(m[i], cols, sums[i]); внутри цикла main. Что означает i в выражении (m[i])[i] внутри макроса?',
        'Счётчик цикла макроса называется так же, как переменная цикла в main, и скрывает её. Дайте ему необычное имя (например, i_) — или замените макрос функцией.',
      ],
      starter: MATRIX(false),
      solution: MATRIX(true),
      explanation: `
Аргумент \`m[i]\` подставляется внутрь цикла макроса, где уже объявлена своя переменная \`i\`. Выражение \`(m[i])[i]\` получает **внутреннюю** \`i\`, и вместо суммы строки макрос складывает элементы \`m[0][0]\`, \`m[1][1]\`, … — диагональ таблицы. А вот \`(result) = acc_\` стоит после цикла, где снова видна \`i\` из \`main\`, поэтому результат записывается в правильную ячейку \`sums[i]\` — ошибку трудно заметить.

Компилятор молчит: затенение имени законно. Переименование счётчика в \`i_\` устраняет совпадение в этой программе, но надёжнее функция: \`long long sum_array(const int *a, int n)\` вообще не видит переменных вызывающего кода.`,
      examples: [
        {
          in: '2 3\n1 2 3\n4 5 6\n',
          out: 'строка 1: 6\nстрока 2: 15\nвсего: 21\n',
        },
        { in: '1 1\n7\n', out: 'строка 1: 7\nвсего: 7\n' },
      ],
      hidden: [
        '1 3\n1 2 3\n',
        '3 1\n1\n2\n3\n',
        '2 2\n1 0\n0 1\n',
        '3 3\n1 2 3\n4 5 6\n7 8 9\n',
        '2 4\n-1 -2 -3 -4\n10 20 30 40\n',
        '4 2\n1000000 1000000\n-1000000 5\n0 0\n3 3\n',
        '1 10\n1 2 3 4 5 6 7 8 9 10\n',
        '3 2\n5 5\n6 6\n7 7\n',
      ],
    },
    {
      title: 'Обобщённые функции',
      difficulty: 'advanced',
      description: `
Функция \`main\` в заготовке читает команды до конца ввода: тип (\`int\`, \`long\`, \`double\` или \`word\`) и два значения этого типа, а затем вызывает \`PRINT(MAX2(a, b))\`.

Напишите функции и макросы на основе \`_Generic\` так, чтобы \`main\` компилировалась без изменений и предупреждений:
- \`MAX2(a, b)\` выбирает функцию по типу \`a\` и возвращает большее из двух значений; для слов — то, что больше по \`strcmp\` (при равенстве — любое);
- \`PRINT(x)\` печатает значение в зависимости от типа: \`int: 5\`, \`long: 5\`, \`double: 2.500\` (три знака после точки), \`строка: слово\`.

Учтите, что массив \`char a[32]\` в \`_Generic\` превращается в \`char *\`, а функция максимума для строк может возвращать \`const char *\`.`,
      constraints: ['Команд не больше 30; слова — до 31 символа; long — значения long long.'],
      hints: [
        'Напишите четыре функции максимума: для int, long long, double и строк (параметры и результат — const char *). Ветки в _Generic: int, long long, double и char *.',
        'MAX2: #define MAX2(a, b) _Generic((a), int: max_int, long long: max_ll, double: max_double, char *: max_str)((a), (b)).',
        'PRINT должен принимать и char *, и const char *: результат max_str — const char *. Добавьте в _Generic обе ветки с одной функцией печати.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

// Напишите функции и макросы MAX2 и PRINT.
${GENERIC_MAIN}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static inline int max_int(int a, int b) {
    return a > b ? a : b;
}

static inline long long max_ll(long long a, long long b) {
    return a > b ? a : b;
}

static inline double max_double(double a, double b) {
    return a > b ? a : b;
}

static inline const char *max_str(const char *a, const char *b) {
    return strcmp(a, b) >= 0 ? a : b;
}

static void print_int(int x) {
    printf("int: %d\n", x);
}

static void print_ll(long long x) {
    printf("long: %lld\n", x);
}

static void print_double(double x) {
    printf("double: %.3f\n", x);
}

static void print_str(const char *s) {
    printf("строка: %s\n", s);
}

#define MAX2(a, b) \
    _Generic((a), int: max_int, long long: max_ll, double: max_double, char *: max_str)((a), (b))

#define PRINT(x)                                                                   \
    _Generic((x), int: print_int, long long: print_ll, double: print_double,      \
             char *: print_str, const char *: print_str)(x)
${GENERIC_MAIN}`,
      explanation: `
\`_Generic\` выбирает выражение по типу управляющего выражения во время компиляции, не вычисляя его. Здесь результат выбора — имя функции, за которым идёт обычный вызов, поэтому каждый аргумент вычисляется один раз, а типы проверяются, как у любой функции. Получилась «перегрузка» в стиле C++, но без копий логики.

Две тонкости. Массив \`char a[32]\` в управляющем выражении превращается в указатель \`char *\` — поэтому ветка \`char *\` подходит для массивов. А \`max_str\` возвращает \`const char *\`, и \`PRINT\` получает уже другой тип: без ветки \`const char *\` компилятор сообщил бы, что подходящей ветки нет. Типы \`char *\` и \`const char *\` в \`_Generic\` различаются.

Если тип не совпал ни с одной веткой (например, \`float\`), будет ошибка компиляции — в отличие от макроса \`MAX\`, который молча сравнил бы что угодно. При желании можно добавить ветку \`default:\`.`,
      examples: [
        { in: 'int 3 9\ndouble 2.5 -1\n', out: 'int: 9\ndouble: 2.500\n' },
        { in: 'word pear apple\nlong 5000000000 4\n', out: 'строка: pear\nlong: 5000000000\n' },
      ],
      hidden: [
        { in: 'int -5 -3\n', name: 'Отрицательные int' },
        { in: 'long -9000000000000000000 9000000000000000000\n', name: 'Большие long' },
        { in: 'double 0.0004 0.0001\n', name: 'Маленькие double' },
        { in: 'word apple apple\n', name: 'Равные слова' },
        { in: 'word Zebra apple\n', name: 'Регистр в strcmp' },
        { in: 'int 7 7\nlong 7 7\ndouble 7 7\nword seven seven\n', name: 'Все типы' },
        { in: 'double -1e9 -2e9\n', name: 'Отрицательные double' },
        {
          in: 'word abcdefghijklmnopqrstuvwxyz01234 abcdefghijklmnopqrstuvwxyz01235\n',
          name: 'Длинные слова',
        },
      ],
    },
  ],
};
