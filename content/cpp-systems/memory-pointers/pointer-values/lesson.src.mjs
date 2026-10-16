/** Таблица rows × cols с детерминированными значениями для больших тестов. */
const table = (rows, cols, f) =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => f(r, c)).join(' '),
  ).join('\n');

export default {
  id: 'memory-pointer-values',
  title: 'Указатели на массивы и таблицы',
  description:
    'Тип указателя на массив int (*)[N], двумерный массив как массив массивов, параметры int m[rows][cols], таблица в куче с доступом grid[r][c], массив указателей для строк разной длины.',
  moduleId: 'memory-pointers',
  order: 6,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['memory-lifetime'],
  objectives: [
    'Определять тип выражений a, &a, m, m[i] и шаг указателя для каждого из них',
    'Передавать в функцию таблицу любого размера параметром int m[rows][cols]',
    'Выделять таблицу в одном блоке через указатель на строку переменной длины',
    'Строить таблицы со строками разной длины из массива указателей и освобождать их',
  ],
  tags: ['C17', 'Память', 'Указатели', 'Двумерные массивы', 'VLA'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int a[5];
    printf("%td %td\n", (char *)(a + 1) - (char *)a, (char *)(&a + 1) - (char *)&a);
    return 0;
}`,
      answers: ['4 20'],
      placeholder: 'Вывод программы',
      explain:
        'a сводится к int * — шаг 4 байта. &a имеет тип int (*)[5] — шаг равен размеру всего массива, 20 байтов.',
    },
    {
      q: 'Что объявляет запись int (*p)[8]; ?',
      options: [
        'Один указатель на массив из 8 int',
        'Массив из 8 указателей на int',
        'Указатель на int, равный 8',
        'Функцию, возвращающую 8 int',
      ],
      correct: 0,
      explain:
        'Скобки связывают * с именем p. Без скобок, int *p[8], получился бы массив указателей.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int m[3][2] = {{1, 2}, {3, 4}, {5, 6}};
    int (*row)[2] = m + 1;
    int *cell = m[2];
    printf("%d %d %d\n", (*row)[1], row[1][0], cell[1]);
    return 0;
}`,
      answers: ['4 5 6'],
      placeholder: 'Вывод программы',
      explain:
        'row указывает на строку 1 ({3, 4}): (*row)[1] = 4, row[1] — строка 2, её элемент 0 равен 5. cell указывает на начало строки 2, cell[1] = 6.',
    },
    {
      q: 'Чему равен sizeof m[1] для int m[4][6]?',
      answers: ['24'],
      placeholder: 'Байтов',
      explain: 'm[1] — строка, массив из 6 int: 6 · 4 = 24 байта.',
    },
    {
      q: 'Какие объявления параметра принимают двумерный массив int grid[5][7]? Выберите все.',
      options: [
        'int m[5][7]',
        'int (*m)[7]',
        'int rows, int cols, int m[rows][cols] (при вызове cols = 7)',
        'int **m',
        'int m[][]',
      ],
      correct: [0, 1, 2],
      explain:
        'grid сводится к int (*)[7]. Тип int ** означает массив указателей, которых в grid нет. Запись int m[][] недопустима — неизвестен размер строки.',
    },
    {
      q: 'Сколько вызовов free нужно, чтобы освободить таблицу из n строк разной длины, если строки выделены отдельно, а массив указателей объявлен локально как int *rows[100]?',
      options: ['n', '1', 'n + 1', '0 — локальный массив освободится сам'],
      correct: 0,
      explain:
        'Каждая строка — отдельный блок из кучи. Сам массив указателей живёт на стеке и освобождается автоматически.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int cols = 5;
    int (*g)[cols] = malloc(3 * sizeof *g);
    if (g == NULL) {
        return 1;
    }
    g[2][4] = 7;
    printf("%zu %td\n", sizeof *g, &g[2][4] - &g[0][0]);
    free(g);
    return 0;
}`,
      answers: ['20 14'],
      placeholder: 'Вывод программы',
      explain:
        '*g — строка из 5 int, 20 байтов. Элемент g[2][4] стоит на позиции 2 · 5 + 4 = 14 от начала блока.',
    },
  ],
  exercises: [
    {
      title: 'Строка с наибольшей суммой',
      difficulty: 'beginner',
      description: `
Реализуйте функцию

\`\`\`c
int *max_row(int rows, int cols, int m[rows][cols]);
\`\`\`

Она возвращает указатель на первый элемент строки с наибольшей суммой элементов (если таких несколько — на первую из них).

Функция \`main\` дана: по указателю она вычисляет номер строки и печатает его, а затем элементы этой строки.`,
      constraints: ['1 ≤ rows, cols ≤ 20.', '|x| ≤ 10⁶.'],
      hints: [
        'Сумма строки r: цикл по c с накоплением m[r][c] в long long.',
        'Запомните номер лучшей строки best и верните m[best] — строка сведётся к int * на её первый элемент.',
      ],
      starter: String.raw`
#include <stdio.h>

int *max_row(int rows, int cols, int m[rows][cols]) {
    // Найдите строку с наибольшей суммой.
    return m[0];
}

int main(void) {
    int rows, cols;
    scanf("%d %d", &rows, &cols);
    int m[rows][cols];
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            scanf("%d", &m[r][c]);
        }
    }
    int *best = max_row(rows, cols, m);
    printf("%td\n", (best - &m[0][0]) / cols);
    for (int c = 0; c < cols; c++) {
        printf(c + 1 < cols ? "%d " : "%d\n", best[c]);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int *max_row(int rows, int cols, int m[rows][cols]) {
    int best = 0;
    long long best_sum = 0;
    for (int r = 0; r < rows; r++) {
        long long sum = 0;
        for (int c = 0; c < cols; c++) {
            sum += m[r][c];
        }
        if (r == 0 || sum > best_sum) {
            best = r;
            best_sum = sum;
        }
    }
    return m[best];
}

int main(void) {
    int rows, cols;
    scanf("%d %d", &rows, &cols);
    int m[rows][cols];
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            scanf("%d", &m[r][c]);
        }
    }
    int *best = max_row(rows, cols, m);
    printf("%td\n", (best - &m[0][0]) / cols);
    for (int c = 0; c < cols; c++) {
        printf(c + 1 < cols ? "%d " : "%d\n", best[c]);
    }
    return 0;
}`,
      explanation: `
Параметр \`int m[rows][cols]\` — это указатель на строку из \`cols\` элементов, поэтому \`m[r][c]\` работает для таблицы любого размера. Выражение \`m[best]\` — строка-массив; при возврате она сводится к \`int *\` на свой первый элемент.

\`main\` восстанавливает номер строки по адресу: строки лежат подряд, и от начала таблицы до начала строки \`r\` ровно \`r · cols\` элементов. Указатель годится и как «результат поиска», и как ручка для дальнейшей работы со строкой.`,
      examples: [
        { in: '3 3\n1 2 3\n9 0 0\n-1 5 6\n', out: '2\n-1 5 6\n' },
        { in: '1 1\n-4\n', out: '0\n-4\n' },
      ],
      hidden: [
        { in: '2 2\n1 1\n1 1\n', name: 'Равные суммы' },
        { in: '3 2\n-5 -5\n-1 -1\n-3 -3\n', name: 'Отрицательные' },
        { in: '4 1\n1\n2\n3\n4\n', name: 'Один столбец' },
        { in: '1 5\n1 2 3 4 5\n', name: 'Одна строка' },
        { in: '2 3\n1000000 1000000 1000000\n-1000000 0 1000000\n', name: 'Большие суммы' },
        { in: '3 3\n0 0 0\n0 0 1\n0 1 0\n', name: 'Первая из равных' },
        {
          in: `20 20\n${table(20, 20, (r, c) => ((r * 37 + c * 11) % 21) - 10)}\n`,
          name: 'Таблица 20×20',
        },
        { in: '3 4\n5 -5 5 -5\n1 1 1 -2\n0 0 0 0\n', name: 'Смешанные' },
      ],
    },
    {
      title: 'Треугольник Паскаля',
      description: `
Напечатайте первые \`n\` строк треугольника Паскаля. Строка \`i\` (с нуля) содержит \`i + 1\` чисел: крайние равны 1, а каждое внутреннее — сумме двух чисел над ним: \`t[i][j] = t[i−1][j−1] + t[i−1][j]\`.

Храните треугольник как массив указателей \`int *rows[20]\`, где каждая строка — отдельный блок из кучи длиной ровно \`i + 1\`. Освободите все строки перед завершением.`,
      constraints: ['1 ≤ n ≤ 20.'],
      hints: [
        'rows[i] = malloc((i + 1) * sizeof *rows[i]); — длина строки i равна i + 1.',
        'rows[i][0] = rows[i][i] = 1; внутренние: for (int j = 1; j < i; j++) rows[i][j] = rows[i - 1][j - 1] + rows[i - 1][j];',
        'Каждой строке — свой free: for (int i = 0; i < n; i++) free(rows[i]);',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int *rows[20];
    for (int i = 0; i < n; i++) {
        rows[i] = malloc((i + 1) * sizeof *rows[i]);
        if (rows[i] == NULL) {
            for (int k = 0; k < i; k++) {
                free(rows[k]);
            }
            return 1;
        }
        rows[i][0] = 1;
        rows[i][i] = 1;
        for (int j = 1; j < i; j++) {
            rows[i][j] = rows[i - 1][j - 1] + rows[i - 1][j];
        }
    }
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            printf(j < i ? "%d " : "%d\n", rows[i][j]);
        }
    }
    for (int i = 0; i < n; i++) {
        free(rows[i]);
    }
    return 0;
}`,
      explanation: `
Массив указателей позволяет каждой строке иметь свою длину: строка \`i\` занимает ровно \`i + 1\` элемент, а не 20, как в прямоугольной таблице. Запись \`rows[i][j]\` сначала читает указатель \`rows[i]\`, затем обращается к \`j\`-му элементу его блока.

Если очередное выделение не удалось, решение освобождает уже выделенные строки — иначе они утекли бы. На каждой ветке программы количество \`free\` совпадает с количеством успешных \`malloc\`.`,
      examples: [
        { in: '4\n', out: '1\n1 1\n1 2 1\n1 3 3 1\n' },
        { in: '1\n', out: '1\n' },
      ],
      hidden: [
        { in: '2\n', name: 'Две строки' },
        { in: '3\n', name: 'Три строки' },
        { in: '5\n', name: 'Пять строк' },
        { in: '8\n', name: 'Восемь строк' },
        { in: '12\n', name: 'Двенадцать строк' },
        { in: '16\n', name: 'Шестнадцать строк' },
        { in: '19\n', name: 'Девятнадцать строк' },
        { in: '20\n', name: 'Максимум' },
      ],
    },
    {
      title: 'Суммы прямоугольников',
      difficulty: 'advanced',
      description: `
Дана таблица \`r × c\` целых чисел и \`q\` запросов. Каждый запрос — \`r1 c1 r2 c2\` (с нуля, \`r1 ≤ r2\`, \`c1 ≤ c2\`) — спрашивает сумму элементов прямоугольника с углами \`(r1, c1)\` и \`(r2, c2)\` включительно.

Выделите в куче две таблицы через указатели на строку переменной длины:
- \`int (*a)[c]\` — исходные данные;
- \`long long (*pre)[c + 1]\` размера \`(r + 1) × (c + 1)\` — префиксные суммы: \`pre[i][j]\` — сумма прямоугольника из первых \`i\` строк и \`j\` столбцов.

Тогда ответ на запрос: \`pre[r2+1][c2+1] − pre[r1][c2+1] − pre[r2+1][c1] + pre[r1][c1]\`.`,
      constraints: ['1 ≤ r, c ≤ 30.', '|x| ≤ 1000.', '1 ≤ q ≤ 20.'],
      hints: [
        'Выделение: int (*a)[c] = malloc(r * sizeof *a); long long (*pre)[c + 1] = malloc((r + 1) * sizeof *pre);',
        'Нулевая строка и нулевой столбец pre равны 0. Остальное: pre[i][j] = a[i-1][j-1] + pre[i-1][j] + pre[i][j-1] − pre[i-1][j-1].',
        'Не забудьте два free — по одному на каждый блок, в том числе если второй malloc не удался.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int r, c;
    scanf("%d %d", &r, &c);
    int (*a)[c] = malloc(r * sizeof *a);
    long long (*pre)[c + 1] = malloc((r + 1) * sizeof *pre);
    if (a == NULL || pre == NULL) {
        free(a);
        free(pre);
        return 1;
    }
    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            scanf("%d", &a[i][j]);
        }
    }
    for (int i = 0; i <= r; i++) {
        for (int j = 0; j <= c; j++) {
            if (i == 0 || j == 0) {
                pre[i][j] = 0;
            } else {
                pre[i][j] = a[i - 1][j - 1] + pre[i - 1][j] + pre[i][j - 1] - pre[i - 1][j - 1];
            }
        }
    }
    int q;
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        int r1, c1, r2, c2;
        scanf("%d %d %d %d", &r1, &c1, &r2, &c2);
        long long sum = pre[r2 + 1][c2 + 1] - pre[r1][c2 + 1] - pre[r2 + 1][c1] + pre[r1][c1];
        printf("%lld\n", sum);
    }
    free(a);
    free(pre);
    return 0;
}`,
      explanation: `
Обе таблицы — по одному непрерывному блоку, но благодаря типу \`int (*)[c]\` к ним можно обращаться как к обычным двумерным массивам: компилятор сам умножает номер строки на её размер, вычисленный во время работы.

Таблица \`pre\` на одну строку и один столбец больше исходной: нулевая строка и столбец избавляют от проверок «а есть ли строка выше». Формула включений-исключений даёт сумму любого прямоугольника за четыре обращения к памяти вместо двойного цикла.`,
      examples: [
        { in: '2 3\n1 2 3\n4 5 6\n2\n0 0 1 2\n1 1 1 2\n', out: '21\n11\n' },
        { in: '1 1\n-7\n1\n0 0 0 0\n', out: '-7\n' },
      ],
      hidden: [
        {
          in: '3 3\n1 2 3\n4 5 6\n7 8 9\n3\n0 0 0 0\n2 2 2 2\n1 1 2 2\n',
          name: 'Отдельные клетки',
        },
        { in: '2 2\n-1 -1\n-1 -1\n1\n0 0 1 1\n', name: 'Вся таблица' },
        { in: '1 5\n1 2 3 4 5\n2\n0 1 0 3\n0 0 0 4\n', name: 'Одна строка' },
        { in: '4 1\n10\n20\n30\n40\n2\n1 0 2 0\n0 0 3 0\n', name: 'Один столбец' },
        {
          in: `30 30\n${table(30, 30, (i, j) => ((i * 7 + j * 13) % 9) - 4)}\n3\n0 0 29 29\n5 5 20 25\n29 0 29 29\n`,
          name: 'Таблица 30×30',
        },
        {
          in: `20 20\n${table(20, 20, () => 1000)}\n2\n0 0 19 19\n10 10 19 19\n`,
          name: 'Максимальные значения',
        },
        {
          in: `20 20\n${table(20, 20, () => -1000)}\n1\n0 0 19 19\n`,
          name: 'Минимальные значения',
        },
        { in: '3 4\n1 0 -1 2\n3 3 3 3\n-2 5 0 1\n2\n0 1 2 2\n1 0 1 3\n', name: 'Смешанные' },
      ],
    },
  ],
};
