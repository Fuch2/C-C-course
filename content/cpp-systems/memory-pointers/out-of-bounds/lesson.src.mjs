const numbers = (count, f) => Array.from({ length: count }, (_, i) => f(i)).join(' ');

const READ_ARRAY = String.raw`
int *read_array(int n) {
    int *a = malloc((size_t)n * sizeof *a);
    if (a == NULL) {
        return NULL;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    return a;
}`;

export default {
  id: 'memory-out-of-bounds',
  title: 'Выход за границы массива',
  description:
    'Чтение и запись за пределами массива: ошибка на единицу, обращение к соседнему элементу, индексы из входных данных, формулы двумерных индексов, как ASan и UBSan видят границы и чего они не видят.',
  moduleId: 'memory-pointers',
  order: 21,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['memory-buffer-overflow'],
  objectives: [
    'Находить ошибки на единицу в условиях циклов и при обращении к соседним элементам',
    'Проверять индексы из внешних данных с обеих сторон',
    'Читать отчёты heap-buffer-overflow, global-buffer-overflow и index out of bounds',
    'Отличать выход за границу объекта от выхода за логическую длину контейнера',
  ],
  tags: ['C23', 'Память', 'Выход за границы', 'Массивы', 'Найди ошибку'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Сколько итераций выполняет цикл for (int i = 0; i <= n; i++) при n = 10 и какой индекс лишний для массива из n элементов?',
      options: [
        '11 итераций, лишний индекс 10',
        '10 итераций, лишних нет',
        '11 итераций, лишний индекс 0',
        '9 итераций, не хватает индекса 9',
      ],
      correct: 0,
      explain: 'Индексы 0…10 — это 11 значений, а массив из 10 элементов допускает только 0…9.',
    },
    {
      q: 'Какое условие цикла правильно для кода, обращающегося к a[i] и a[i + 1] в массиве из n элементов?',
      options: ['i + 1 < n', 'i < n', 'i <= n - 1', 'i < n + 1'],
      correct: 0,
      explain:
        'Наибольший допустимый i + 1 — это n − 1. Условие i + 1 < n безопасно и для беззнакового n = 0.',
    },
    {
      q: 'Какие проверки индекса int i для массива из count элементов корректны? Выберите все.',
      options: [
        'i >= 0 && i < count',
        'i < count',
        '(size_t)i < (size_t)count при count ≥ 0',
        'i <= count',
      ],
      correct: [0, 2],
      explain:
        'Отрицательный i, приведённый к size_t, становится огромным и не проходит проверку. Одна проверка i < count пропускает отрицательные индексы.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int a[6] = {5, 1, 4, 4, 2, 8};
    int count = 0;
    for (int i = 0; i + 1 < 6; i++) {
        if (a[i + 1] < a[i]) {
            count++;
        }
    }
    printf("%d\n", count);
    return 0;
}`,
      answers: ['2'],
      placeholder: 'Вывод программы',
      explain: 'Падения: 5 → 1 и 4 → 2. Пара 4 → 4 не считается.',
    },
    {
      q: 'Таблица 3 × 5 (rows = 3, cols = 5) хранится в одном блоке из 15 элементов. Какой индекс получится по ошибочной формуле r * rows + c для r = 2, c = 4?',
      answers: ['10'],
      placeholder: 'Индекс',
      explain:
        '2 · 3 + 4 = 10 — внутри блока, но это не тот элемент: правильный индекс 2 · 5 + 4 = 14. Ошибка в формуле не всегда выходит за границы — иногда она тихо читает чужую ячейку.',
    },
    {
      q: 'Почему без санитайзера цикл с i <= 12 по массиву int days[12] может напечатать правильную сумму?',
      options: [
        'За массивом случайно лежат нулевые байты, и лишнее слагаемое равно 0',
        'Компилятор автоматически исправляет условие',
        'C проверяет индексы и пропускает неверные',
        'Массивы в C имеют лишний элемент в конце',
      ],
      correct: 0,
      explain: 'Поведение не определено. Сегодня там ноль, завтра — другая переменная.',
    },
    {
      q: 'Вектор: ёмкость 8, длина 5. Обнаружит ли AddressSanitizer чтение data[6]?',
      options: [
        'Нет: data[6] внутри выделенного блока, нарушена только логическая граница',
        'Да, всегда',
        'Да, если data выделен через calloc',
        'Нет, ASan не проверяет кучу',
      ],
      correct: 0,
      explain:
        'Санитайзер знает границы блока, но не длину вашего контейнера. Нужна проверка index < length в коде.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: подъёмы температуры',
      difficulty: 'beginner',
      bug: true,
      description: `
Программа читает \`n\` дневных температур и печатает, сколько раз температура выросла по сравнению с предыдущим днём, и наибольший рост за день (0, если роста не было). AddressSanitizer сообщает \`heap-buffer-overflow\`.

Исправьте цикл.`,
      constraints: ['1 ≤ n ≤ 1000.', '|t| ≤ 100.'],
      hints: [
        'Какой индекс читает t[i + 1] на последней итерации цикла i < n?',
        'Условие i + 1 < n — последняя пара (n − 2, n − 1).',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
${READ_ARRAY}

int main(void) {
    int n;
    scanf("%d", &n);
    int *t = read_array(n);
    if (t == NULL) {
        return 1;
    }
    int rises = 0, best = 0;
    for (int i = 0; i < n; i++) {
        int delta = t[i + 1] - t[i];
        if (delta > 0) {
            rises++;
            if (delta > best) {
                best = delta;
            }
        }
    }
    printf("rises=%d max=%d\n", rises, best);
    free(t);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
${READ_ARRAY}

int main(void) {
    int n;
    scanf("%d", &n);
    int *t = read_array(n);
    if (t == NULL) {
        return 1;
    }
    int rises = 0, best = 0;
    for (int i = 0; i + 1 < n; i++) {
        int delta = t[i + 1] - t[i];
        if (delta > 0) {
            rises++;
            if (delta > best) {
                best = delta;
            }
        }
    }
    printf("rises=%d max=%d\n", rises, best);
    free(t);
    return 0;
}`,
      explanation: `
Пар соседних дней на одну меньше, чем дней. Цикл \`i < n\` на последней итерации берёт \`t[n]\` — элемент за концом блока. Без санитайзера там мусор, и ответ может оказаться и верным, и неверным в зависимости от случайного значения.

Условие \`i + 1 < n\` прямо выражает требование «индекс \`i + 1\` допустим». При \`n = 1\` цикл не выполняется ни разу — роста нет.`,
      examples: [
        { in: '5\n10 12 11 15 15\n', out: 'rises=2 max=4\n' },
        { in: '1\n7\n', out: 'rises=0 max=0\n' },
      ],
      hidden: [
        { in: '2\n1 2\n', name: 'Два дня с ростом' },
        { in: '2\n2 1\n', name: 'Два дня без роста' },
        { in: '4\n5 5 5 5\n', name: 'Без изменений' },
        { in: '3\n-100 100 -100\n', name: 'Крайние значения' },
        { in: `1000\n${numbers(1000, (i) => ((i * 37) % 201) - 100)}\n`, name: 'Тысяча дней' },
        { in: '5\n1 2 3 4 5\n', name: 'Постоянный рост' },
        { in: '5\n5 4 3 2 1\n', name: 'Постоянное падение' },
        { in: '6\n0 10 0 10 0 10\n', name: 'Пила' },
      ],
    },
    {
      title: 'Найди ошибку: запросы к массиву',
      bug: true,
      description: `
Программа хранит \`n\` чисел и отвечает на \`q\` запросов: для индекса \`i\` печатает элемент или \`out of range\`, если такого элемента нет. Индексы в запросах бывают любыми, в том числе отрицательными. На некоторых запросах AddressSanitizer сообщает о чтении за границей блока.

Исправьте проверку индекса.`,
      constraints: ['1 ≤ n ≤ 100.', '1 ≤ q ≤ 20.', '−10⁹ ≤ i ≤ 10⁹.'],
      hints: [
        'Какие индексы пропускает проверка index < n?',
        'Проверяйте обе границы: index >= 0 && index < n.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
${READ_ARRAY}

int main(void) {
    int n, q;
    scanf("%d", &n);
    int *a = read_array(n);
    if (a == NULL) {
        return 1;
    }
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        int index;
        scanf("%d", &index);
        if (index < n) {
            printf("%d\n", a[index]);
        } else {
            printf("out of range\n");
        }
    }
    free(a);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
${READ_ARRAY}

int main(void) {
    int n, q;
    scanf("%d", &n);
    int *a = read_array(n);
    if (a == NULL) {
        return 1;
    }
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        int index;
        scanf("%d", &index);
        if (index >= 0 && index < n) {
            printf("%d\n", a[index]);
        } else {
            printf("out of range\n");
        }
    }
    free(a);
    return 0;
}`,
      explanation: `
Проверка \`index < n\` защищает только правую границу. Отрицательный индекс проходит её и читает память **перед** блоком — ASan сообщает \`heap-buffer-overflow\` с пометкой «to the left of region». Огромный отрицательный индекс без санитайзера привёл бы к аварии, небольшой — к чтению чужих данных.

Любое значение, пришедшее извне, нужно считать враждебным, пока не доказано обратное.`,
      examples: [
        { in: '3\n10 20 30\n3\n0\n2\n3\n', out: '10\n30\nout of range\n' },
        { in: '2\n5 6\n1\n-1\n', out: 'out of range\n' },
      ],
      hidden: [
        { in: '1\n42\n2\n0\n1\n', name: 'Один элемент' },
        { in: '3\n1 2 3\n2\n-3\n-1000000000\n', name: 'Отрицательные индексы' },
        { in: '3\n1 2 3\n1\n1000000000\n', name: 'Огромный индекс' },
        { in: '4\n7 8 9 10\n4\n3\n0\n1\n2\n', name: 'Все допустимые' },
        {
          in: `100\n${numbers(100, (i) => i * i)}\n5\n99\n100\n50\n-50\n0\n`,
          name: 'Сто элементов',
        },
        { in: '2\n-5 -6\n2\n1\n-2\n', name: 'Отрицательные значения' },
        { in: '5\n1 1 1 1 1\n3\n5\n4\n-5\n', name: 'Граница справа' },
        { in: '1\n0\n1\n-1\n', name: 'Минус один' },
      ],
    },
    {
      title: 'Найди ошибку: префиксные суммы',
      bug: true,
      description: `
Программа строит префиксные суммы \`prefix[i] = a[0] + … + a[i]\` и отвечает на запросы «сумма на отрезке \`[l, r]\`» по формуле \`prefix[r] − prefix[l − 1]\`. На запросах, начинающихся с нулевого индекса, и уже при построении сумм возникает выход за границу.

Исправьте программу. Удобный приём — массив на один элемент больше: \`prefix[0] = 0\`, \`prefix[i + 1] = prefix[i] + a[i]\`, сумма \`[l, r]\` = \`prefix[r + 1] − prefix[l]\`.`,
      constraints: ['1 ≤ n ≤ 1000.', '|a[i]| ≤ 10⁶.', '1 ≤ q ≤ 20, 0 ≤ l ≤ r < n.'],
      hints: [
        'Какой индекс читается в prefix[i - 1] при i = 0? А в prefix[l - 1] при l = 0?',
        'Выделите n + 1 элемент типа long long и сдвиньте все индексы на единицу — тогда «сумма пустого префикса» prefix[0] = 0 убирает особый случай.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
${READ_ARRAY}

int main(void) {
    int n;
    scanf("%d", &n);
    int *a = read_array(n);
    long long *prefix = malloc((size_t)n * sizeof *prefix);
    if (a == NULL || prefix == NULL) {
        free(a);
        free(prefix);
        return 1;
    }
    for (int i = 0; i < n; i++) {
        prefix[i] = prefix[i - 1] + a[i];
    }
    int q;
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        int l, r;
        scanf("%d %d", &l, &r);
        printf("%lld\n", prefix[r] - prefix[l - 1]);
    }
    free(a);
    free(prefix);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
${READ_ARRAY}

int main(void) {
    int n;
    scanf("%d", &n);
    int *a = read_array(n);
    long long *prefix = malloc(((size_t)n + 1) * sizeof *prefix);
    if (a == NULL || prefix == NULL) {
        free(a);
        free(prefix);
        return 1;
    }
    prefix[0] = 0;
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + a[i];
    }
    int q;
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        int l, r;
        scanf("%d %d", &l, &r);
        printf("%lld\n", prefix[r + 1] - prefix[l]);
    }
    free(a);
    free(prefix);
    return 0;
}`,
      explanation: `
В исходной версии две ошибки одного рода: \`prefix[i − 1]\` при \`i = 0\` и \`prefix[l − 1]\` при \`l = 0\` читают элемент \`prefix[−1]\` — память перед блоком. Первое чтение к тому же берёт мусор, и все суммы оказываются испорчены.

Массив на один элемент длиннее с \`prefix[0] = 0\` — стандартный приём: «сумма первых \`k\` элементов» определена для всех \`k\` от 0 до \`n\`, и граничный случай исчезает из формулы.`,
      examples: [
        { in: '5\n1 2 3 4 5\n2\n0 4\n1 3\n', out: '15\n9\n' },
        { in: '1\n-7\n1\n0 0\n', out: '-7\n' },
      ],
      hidden: [
        { in: '3\n1 1 1\n3\n0 0\n1 1\n2 2\n', name: 'Отдельные элементы' },
        { in: '4\n-1 -2 -3 -4\n1\n0 3\n', name: 'Отрицательные' },
        { in: '3\n1000000 1000000 1000000\n1\n0 2\n', name: 'Большие суммы' },
        {
          in: `1000\n${numbers(1000, (i) => (i % 2 ? i : -i))}\n3\n0 999\n500 999\n0 0\n`,
          name: 'Тысяча элементов',
        },
        { in: '5\n5 -5 5 -5 5\n2\n0 1\n1 4\n', name: 'Чередование' },
        { in: '2\n3 4\n1\n1 1\n', name: 'Последний элемент' },
        { in: '6\n0 0 0 0 0 0\n1\n2 5\n', name: 'Нули' },
        { in: '4\n10 20 30 40\n2\n0 1\n2 3\n', name: 'Половины' },
      ],
    },
    {
      title: 'Безопасная таблица',
      difficulty: 'advanced',
      description: `
Таблица \`rows × cols\` целых чисел (изначально нули) хранится в одном блоке. Обработайте команды до конца ввода:
- \`set r c v\` — записать \`v\` в клетку;
- \`get r c\` — напечатать значение клетки;
- \`row r\` — напечатать сумму строки;
- \`col c\` — напечатать сумму столбца.

Если координата вне таблицы, печатайте \`error\` и ничего не меняйте. Таблица прямоугольная — будьте внимательны к формуле индекса.`,
      constraints: [
        '1 ≤ rows, cols ≤ 100.',
        'Команд — до 300.',
        'Координаты — любые целые числа.',
        '|v| ≤ 10⁶.',
      ],
      hints: [
        'int *t = calloc((size_t)rows * cols, sizeof *t); — нули с самого начала.',
        'Функция проверки: int inside(int r, int c) { return r >= 0 && r < rows && c >= 0 && c < cols; } — для row проверяется только r, для col — только c.',
        'Индекс клетки — r * cols + c. Сумма столбца c — по r от 0 до rows − 1.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int rows, cols;
    scanf("%d %d", &rows, &cols);
    int *t = calloc((size_t)rows * cols, sizeof *t);
    if (t == NULL) {
        return 1;
    }
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "set") == 0 || strcmp(cmd, "get") == 0) {
            int r, c, v = 0;
            scanf("%d %d", &r, &c);
            if (cmd[0] == 's') {
                scanf("%d", &v);
            }
            if (r < 0 || r >= rows || c < 0 || c >= cols) {
                printf("error\n");
            } else if (cmd[0] == 's') {
                t[r * cols + c] = v;
            } else {
                printf("%d\n", t[r * cols + c]);
            }
        } else {
            int k;
            scanf("%d", &k);
            int is_row = strcmp(cmd, "row") == 0;
            int limit = is_row ? rows : cols;
            if (k < 0 || k >= limit) {
                printf("error\n");
                continue;
            }
            long long sum = 0;
            if (is_row) {
                for (int c = 0; c < cols; c++) {
                    sum += t[k * cols + c];
                }
            } else {
                for (int r = 0; r < rows; r++) {
                    sum += t[r * cols + k];
                }
            }
            printf("%lld\n", sum);
        }
    }
    free(t);
    return 0;
}`,
      explanation: `
Каждое обращение защищено проверкой координат с обеих сторон. Для строки допустимы номера \`0 … rows − 1\`, для столбца — \`0 … cols − 1\`: это разные границы, и в прямоугольной таблице их легко перепутать.

Тесты специально используют таблицы, где \`rows ≠ cols\`: формула \`r * rows + c\` на квадратной таблице совпала бы с правильной, а на прямоугольной — читала бы не те клетки или выходила за блок.`,
      examples: [
        { in: '2 3\nset 1 2 5\nget 1 2\nrow 1\ncol 2\nget 2 0\n', out: '5\n5\n5\nerror\n' },
        { in: '1 1\nset 0 0 -4\nget 0 0\nset 0 1 9\nrow 0\n', out: '-4\nerror\n-4\n' },
      ],
      hidden: [
        { in: '3 2\nset 2 1 7\nget 2 1\ncol 1\nrow 2\ncol 2\n', name: 'Высокая таблица' },
        { in: '2 5\nset 1 4 3\nset 0 4 2\ncol 4\nrow 1\nrow 2\n', name: 'Широкая таблица' },
        { in: '2 2\nget -1 0\nget 0 -1\nrow -1\ncol -1\n', name: 'Отрицательные координаты' },
        {
          in: '2 2\nget 1000000000 0\nset 0 1000000000 1\ncol 1000000000\n',
          name: 'Огромные координаты',
        },
        {
          in: '3 4\nset 0 0 1000000\nset 2 3 -1000000\nrow 0\nrow 2\ncol 0\ncol 3\n',
          name: 'Крайние значения',
        },
        { in: '1 100\nset 0 99 5\nrow 0\ncol 99\nget 1 99\n', name: 'Одна строка' },
        { in: '100 1\nset 99 0 5\ncol 0\nrow 99\nget 99 1\n', name: 'Один столбец' },
        { in: '2 3\nset 0 0 1\nset 0 0 2\nget 0 0\nrow 0\n', name: 'Перезапись клетки' },
      ],
    },
  ],
};
