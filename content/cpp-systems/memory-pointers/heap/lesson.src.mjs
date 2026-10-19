export default {
  id: 'memory-heap',
  title: 'Куча: память по запросу',
  description:
    'Зачем нужна динамическая память: размер известен только во время работы и данные переживают функцию. Первое знакомство с malloc и free, владение блоком, стек против кучи, таблица в одном блоке.',
  moduleId: 'memory-pointers',
  order: 4,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-stack'],
  objectives: [
    'Объяснять, какие задачи не решаются массивами на стеке и в статических данных',
    'Выделять массив в куче через malloc(n * sizeof *p) и проверять результат на NULL',
    'Возвращать блок из функции и освобождать его в вызывающем коде',
    'Выбирать между стеком и кучей и размещать таблицу в одном блоке',
  ],
  tags: ['C23', 'Память', 'Куча', 'malloc', 'free'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Сколько байтов выделит malloc(n * sizeof *p), если p имеет тип double *, а n = 6?',
      answers: ['48'],
      placeholder: 'Число байтов',
      explain: 'sizeof *p — размер double, 8 байтов. 6 · 8 = 48.',
    },
    {
      q: 'Что вернёт malloc, если память выделить не удалось?',
      options: ['NULL', 'Адрес блока нулевого размера', 'Программа завершится внутри malloc', '-1'],
      correct: 0,
      explain:
        'Поэтому результат проверяют: if (p == NULL) — и обрабатывают ошибку, не разыменовывая указатель.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int *make(int value) {
    int *p = malloc(sizeof *p);
    if (p != NULL) {
        *p = value * 2;
    }
    return p;
}

int main(void) {
    int *a = make(5);
    int *b = make(*a);
    if (a == NULL || b == NULL) {
        return 1;
    }
    printf("%d %d\n", *a, *b);
    free(a);
    free(b);
    return 0;
}`,
      answers: ['10 20'],
      placeholder: 'Вывод программы',
      explain:
        'Каждый вызов make выделяет отдельный блок. Блоки переживают функцию и освобождаются в main.',
    },
    {
      q: 'Какие объекты исчезают при возврате из функции, выделившей блок? Выберите все.',
      code: String.raw`
int *create(int n) {
    int count = n;
    int *block = malloc(count * sizeof *block);
    return block;
}`,
      lang: 'c',
      options: [
        'Параметр n',
        'Локальная переменная count',
        'Указатель block (переменная)',
        'Блок в куче, на который указывает block',
      ],
      correct: [0, 1, 2],
      explain:
        'Параметр и локальные переменные живут в кадре функции. Блок в куче живёт до free; его адрес возвращён вызывающему коду.',
    },
    {
      q: 'Чем опасен код int n; scanf("%d", &n); int data[n]; при n = 5 000 000?',
      options: [
        'Массив переменной длины размещается на стеке — 20 МБ переполнят стек',
        'Такой код не компилируется в C',
        'Массив будет обнулён, что очень долго',
        'Ничем, массив размещается в куче',
      ],
      correct: 0,
      explain:
        'VLA живёт на стеке, а размер стека — около 8 МБ. Для больших массивов заранее неизвестного размера используют malloc.',
    },
    {
      q: 'Какой вызов free допустим?',
      options: [
        'free(p), где p получен из malloc и ещё не освобождён',
        'free(&x), где x — локальная переменная',
        'free(p + 1), где p получен из malloc',
        'free(s), где s указывает на строковый литерал',
      ],
      correct: 0,
      explain:
        'free принимает только адрес начала блока из malloc/calloc/realloc (или NULL). Всё остальное — неопределённое поведение.',
    },
    {
      q: 'По какому индексу в одном блоке хранится элемент строки r и столбца c таблицы rows × cols?',
      options: ['r * cols + c', 'c * cols + r', 'r * rows + c', 'r + c'],
      correct: 0,
      explain:
        'Перед строкой r лежат r полных строк по cols элементов, затем c элементов текущей строки.',
    },
  ],
  exercises: [
    {
      title: 'Обратный порядок',
      difficulty: 'beginner',
      description: `
Прочитайте количество чисел \`n\` и сами \`n\` целых чисел. Напечатайте их в обратном порядке через пробел.

Массив выделите в куче ровно на \`n\` элементов и освободите перед завершением программы. Если \`malloc\` вернул \`NULL\`, завершите программу с кодом 1.`,
      constraints: ['1 ≤ n ≤ 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'int *a = malloc(n * sizeof *a); if (a == NULL) return 1;',
        'Чтобы не было лишнего пробела в конце, печатайте пробел перед каждым числом, кроме первого: if (i != n - 1) printf(" ");',
        'Не забудьте free(a) после печати — проверка с AddressSanitizer считает забытый free ошибкой.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int *a = malloc(n * sizeof *a);
    if (a == NULL) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    for (int i = n - 1; i >= 0; i--) {
        printf("%d", a[i]);
        printf(i > 0 ? " " : "\n");
    }
    free(a);
    return 0;
}`,
      explanation: `
Размер массива известен только после чтения \`n\`, поэтому блок выделяется во время работы — ровно столько, сколько нужно. Выражение \`n * sizeof *a\` даёт размер в байтах и не зависит от того, сколько байтов занимает \`int\`.

\`free(a)\` стоит после последнего обращения к массиву. Если его убрать, программа выведет тот же ответ, но LeakSanitizer сообщит об утечке 4·n байтов — и тест не будет пройден.`,
      examples: [
        { in: '4\n10 20 30 40\n', out: '40 30 20 10\n' },
        { in: '1\n-5\n', out: '-5\n' },
      ],
      hidden: [
        { in: '2\n1 2\n', name: 'Два числа' },
        { in: '3\n0 0 0\n', name: 'Нули' },
        { in: '5\n1000000000 -1000000000 7 -7 0\n', name: 'Крайние значения' },
        { in: '6\n1 2 3 3 2 1\n', name: 'Палиндром' },
        { in: '10\n1 2 3 4 5 6 7 8 9 10\n', name: 'Десять чисел' },
        { in: '3\n-1 -2 -3\n', name: 'Отрицательные' },
        { in: '4\n5 5 5 6\n', name: 'Повторы' },
        { in: '7\n9 8 7 6 5 4 3\n', name: 'Убывание' },
      ],
    },
    {
      title: 'Функция создаёт диапазон',
      description: `
Реализуйте функцию

\`\`\`c
int *make_range(int from, int to, int *length);
\`\`\`

Она выделяет в куче массив всех целых чисел от \`from\` до \`to\` включительно — по возрастанию, если \`from ≤ to\`, и по убыванию иначе, — записывает количество элементов в \`*length\` и возвращает массив. При ошибке выделения возвращает \`NULL\`.

Функция \`main\` дана: она печатает длину, затем элементы и освобождает массив.`,
      constraints: ['−1000 ≤ from, to ≤ 1000.'],
      hints: [
        'Длина: abs(to - from) + 1 (abs из <stdlib.h>). Шаг: from <= to ? 1 : -1.',
        'Заполнение: for (int i = 0; i < n; i++) a[i] = from + i * step;',
        'Запишите длину через указатель: *length = n; — так функция возвращает два результата: массив и его размер.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

int *make_range(int from, int to, int *length) {
    // Выделите массив, заполните его и запишите длину в *length.
    return NULL;
}

int main(void) {
    int from, to;
    scanf("%d %d", &from, &to);
    int length = 0;
    int *range = make_range(from, to, &length);
    if (range == NULL) {
        return 1;
    }
    printf("%d\n", length);
    for (int i = 0; i < length; i++) {
        printf(i + 1 < length ? "%d " : "%d\n", range[i]);
    }
    free(range);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int *make_range(int from, int to, int *length) {
    int n = abs(to - from) + 1;
    int step = from <= to ? 1 : -1;
    int *a = malloc(n * sizeof *a);
    if (a == NULL) {
        return NULL;
    }
    for (int i = 0; i < n; i++) {
        a[i] = from + i * step;
    }
    *length = n;
    return a;
}

int main(void) {
    int from, to;
    scanf("%d %d", &from, &to);
    int length = 0;
    int *range = make_range(from, to, &length);
    if (range == NULL) {
        return 1;
    }
    printf("%d\n", length);
    for (int i = 0; i < length; i++) {
        printf(i + 1 < length ? "%d " : "%d\n", range[i]);
    }
    free(range);
    return 0;
}`,
      explanation: `
Функция владеет блоком лишь до \`return\`: возвращая указатель, она передаёт владение \`main\`, и освобождает блок уже \`main\`. Локальный массив здесь не подошёл бы — он исчез бы вместе с кадром \`make_range\`.

Второй результат — длина — возвращается через выходной параметр \`int *length\`. Это обычный для C способ вернуть «массив и его размер»: вызывающий код без длины не смог бы безопасно обойти блок.`,
      examples: [
        { in: '3 7\n', out: '5\n3 4 5 6 7\n' },
        { in: '2 -1\n', out: '4\n2 1 0 -1\n' },
      ],
      hidden: [
        { in: '5 5\n', name: 'Один элемент' },
        { in: '0 1\n', name: 'Два элемента' },
        { in: '1 0\n', name: 'Два по убыванию' },
        { in: '-3 3\n', name: 'Через ноль' },
        { in: '-1000 -990\n', name: 'Отрицательные' },
        { in: '1000 990\n', name: 'Убывание у максимума' },
        { in: '-5 -10\n', name: 'Убывание отрицательных' },
        { in: '10 20\n', name: 'Одиннадцать элементов' },
      ],
    },
    {
      title: 'Слияние в новый массив',
      description: `
Даны два массива, каждый отсортирован по неубыванию. Реализуйте функцию

\`\`\`c
int *merge(const int *a, int n, const int *b, int m);
\`\`\`

Она возвращает **новый** блок из \`n + m\` элементов, содержащий все элементы обоих массивов по неубыванию (или \`NULL\` при ошибке выделения). Исходные массивы не меняются.

Ввод: \`n\`, затем \`n\` чисел; \`m\`, затем \`m\` чисел. Функция \`main\` дана: она печатает результат через пробел и освобождает все три блока.`,
      constraints: ['1 ≤ n, m ≤ 500.', '|x| ≤ 10⁹.', 'Оба массива отсортированы по неубыванию.'],
      hints: [
        'Два индекса i и j идут по a и b; на каждом шаге в результат кладётся меньший из a[i] и b[j].',
        'Когда один массив закончился, допишите остаток другого отдельными циклами.',
        'Результат выделяйте внутри merge: int *out = malloc((n + m) * sizeof *out);',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

int *merge(const int *a, int n, const int *b, int m) {
    // Выделите новый блок и слейте a и b.
    return NULL;
}

int *read_array(int *length) {
    scanf("%d", length);
    int *a = malloc(*length * sizeof *a);
    if (a == NULL) {
        return NULL;
    }
    for (int i = 0; i < *length; i++) {
        scanf("%d", &a[i]);
    }
    return a;
}

int main(void) {
    int n, m;
    int *a = read_array(&n);
    int *b = read_array(&m);
    int *c = (a && b) ? merge(a, n, b, m) : NULL;
    if (c != NULL) {
        for (int i = 0; i < n + m; i++) {
            printf(i + 1 < n + m ? "%d " : "%d\n", c[i]);
        }
    }
    free(a);
    free(b);
    free(c);
    return c == NULL;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int *merge(const int *a, int n, const int *b, int m) {
    int *out = malloc((n + m) * sizeof *out);
    if (out == NULL) {
        return NULL;
    }
    int i = 0, j = 0, k = 0;
    while (i < n && j < m) {
        if (a[i] <= b[j]) {
            out[k++] = a[i++];
        } else {
            out[k++] = b[j++];
        }
    }
    while (i < n) {
        out[k++] = a[i++];
    }
    while (j < m) {
        out[k++] = b[j++];
    }
    return out;
}

int *read_array(int *length) {
    scanf("%d", length);
    int *a = malloc(*length * sizeof *a);
    if (a == NULL) {
        return NULL;
    }
    for (int i = 0; i < *length; i++) {
        scanf("%d", &a[i]);
    }
    return a;
}

int main(void) {
    int n, m;
    int *a = read_array(&n);
    int *b = read_array(&m);
    int *c = (a && b) ? merge(a, n, b, m) : NULL;
    if (c != NULL) {
        for (int i = 0; i < n + m; i++) {
            printf(i + 1 < n + m ? "%d " : "%d\n", c[i]);
        }
    }
    free(a);
    free(b);
    free(c);
    return c == NULL;
}`,
      explanation: `
Слияние идёт двумя «пальцами»: каждый шаг берёт меньший из текущих элементов, поэтому результат отсортирован и строится за \`n + m\` шагов. Параметры \`const int *\` обещают, что исходные массивы не изменятся.

Обратите внимание на \`main\`: в программе три блока и три \`free\`. \`free(NULL)\` разрешён и ничего не делает — поэтому освобождать можно без дополнительных проверок, даже если какое-то выделение не удалось.`,
      examples: [
        { in: '3\n1 4 9\n4\n2 3 10 11\n', out: '1 2 3 4 9 10 11\n' },
        { in: '1\n5\n1\n5\n', out: '5 5\n' },
      ],
      hidden: [
        { in: '2\n1 2\n2\n3 4\n', name: 'Первый массив целиком меньше' },
        { in: '2\n7 8\n3\n1 2 3\n', name: 'Второй массив целиком меньше' },
        { in: '3\n1 1 1\n3\n1 1 1\n', name: 'Одинаковые элементы' },
        { in: '1\n-1000000000\n1\n1000000000\n', name: 'Крайние значения' },
        { in: '4\n1 3 5 7\n4\n2 4 6 8\n', name: 'Чередование' },
        { in: '1\n0\n5\n-2 -1 0 1 2\n', name: 'Один против пяти' },
        { in: '5\n-5 -3 0 0 9\n2\n-4 10\n', name: 'Смешанные' },
        { in: '3\n2 2 3\n3\n1 2 2\n', name: 'Повторы в обоих' },
      ],
    },
    {
      title: 'Транспонирование таблицы',
      description: `
Прочитайте размеры таблицы \`rows\` и \`cols\`, затем \`rows\` строк по \`cols\` целых чисел. Напечатайте **транспонированную** таблицу: \`cols\` строк по \`rows\` чисел, где строка \`c\` результата — это столбец \`c\` исходной таблицы. Числа в строке — через пробел.

Храните таблицу в **одном** блоке из \`rows · cols\` элементов; элемент \`(r, c)\` — по индексу \`r · cols + c\`.`,
      constraints: ['1 ≤ rows, cols ≤ 20.', '|x| ≤ 10⁶.'],
      hints: [
        'int *t = malloc(rows * cols * sizeof *t); — один блок на всю таблицу.',
        'Чтение — двойной цикл r, c с записью в t[r * cols + c].',
        'Печать транспонированной: внешний цикл по c, внутренний по r, элемент t[r * cols + c].',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int rows, cols;
    scanf("%d %d", &rows, &cols);
    int *t = malloc(rows * cols * sizeof *t);
    if (t == NULL) {
        return 1;
    }
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            scanf("%d", &t[r * cols + c]);
        }
    }
    for (int c = 0; c < cols; c++) {
        for (int r = 0; r < rows; r++) {
            printf(r + 1 < rows ? "%d " : "%d\n", t[r * cols + c]);
        }
    }
    free(t);
    return 0;
}`,
      explanation: `
Таблица хранится построчно: сначала все \`cols\` элементов строки 0, затем строки 1 и так далее. Формула \`r * cols + c\` пропускает \`r\` полных строк и берёт \`c\`-й элемент текущей.

Транспонирование не требует второго блока: достаточно поменять порядок циклов при печати — внешний цикл идёт по столбцам. Один \`malloc\` на всю таблицу проще и надёжнее, чем отдельный блок на каждую строку: один \`free\`, и данные лежат компактно.`,
      examples: [
        { in: '2 3\n1 2 3\n4 5 6\n', out: '1 4\n2 5\n3 6\n' },
        { in: '1 1\n7\n', out: '7\n' },
      ],
      hidden: [
        { in: '1 4\n1 2 3 4\n', name: 'Одна строка' },
        { in: '4 1\n1\n2\n3\n4\n', name: 'Один столбец' },
        { in: '2 2\n1 2\n3 4\n', name: 'Квадрат 2×2' },
        { in: '3 3\n1 2 3\n4 5 6\n7 8 9\n', name: 'Квадрат 3×3' },
        { in: '3 2\n-1 -2\n-3 -4\n-5 -6\n', name: 'Отрицательные' },
        { in: '2 4\n1000000 0 0 -1000000\n5 6 7 8\n', name: 'Крайние значения' },
        { in: '2 5\n1 2 3 4 5\n6 7 8 9 10\n', name: 'Широкая таблица' },
        { in: '5 2\n1 2\n3 4\n5 6\n7 8\n9 10\n', name: 'Высокая таблица' },
      ],
    },
  ],
};
