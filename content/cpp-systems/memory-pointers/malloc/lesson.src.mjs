export default {
  id: 'memory-malloc',
  title: 'malloc: договор выделения',
  description:
    'Что обещает malloc и что требует взамен: размер в байтах, неинициализированное содержимое, переполнение при вычислении размера, обработка отказа без утечек, структуры и строки в куче.',
  moduleId: 'memory-pointers',
  order: 11,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-void-pointer'],
  objectives: [
    'Выделять память записью p = malloc(n * sizeof *p) и проверять результат',
    'Объяснять, почему содержимое нового блока нужно записать до чтения',
    'Обнаруживать переполнение при вычислении размера до вызова malloc',
    'Обрабатывать отказ выделения без утечек и создавать структуры и строки в куче',
  ],
  tags: ['C23', 'Память', 'malloc', 'Куча', 'Переполнение'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что гарантирует malloc при успешном выделении? Выберите все.',
      options: [
        'Блок не меньше запрошенного размера',
        'Блок выровнен для хранения любого типа',
        'Блок заполнен нулями',
        'Блок можно освободить ровно одним вызовом free',
        'Размер блока можно узнать через sizeof',
      ],
      correct: [0, 1, 3],
      explain:
        'Содержимое malloc не инициализировано. sizeof от указателя даёт размер указателя, а не блока — длину программа хранит сама.',
    },
    {
      q: 'Сколько байтов нужно выделить под копию строки "data"?',
      answers: ['5'],
      placeholder: 'Байтов',
      explain: 'Четыре символа и завершающий \\0: strlen(s) + 1 = 5.',
    },
    {
      q: 'Что выведет программа на 64-битной системе?',
      code: String.raw`
#include <stdint.h>
#include <stdio.h>

int main(void) {
    size_t count = SIZE_MAX / 8 + 1;
    printf("%zu\n", count * 8);
    return 0;
}`,
      answers: ['0'],
      placeholder: 'Вывод программы',
      explain:
        'count · 8 = 2⁶⁴, а беззнаковое произведение берётся по модулю 2⁶⁴. malloc(0) вместо огромного блока — источник уязвимостей.',
    },
    {
      q: 'Какая проверка верно определяет, что count * size переполнит size_t (size > 0)?',
      options: [
        'count > SIZE_MAX / size',
        'count * size > SIZE_MAX',
        'count * size < 0',
        'count > SIZE_MAX - size',
      ],
      correct: 0,
      explain:
        'Произведение не может быть больше SIZE_MAX — оно уже обрезано. Беззнаковое не бывает отрицательным. Деление выполняет проверку без переполнения.',
    },
    {
      q: 'Функция выделила первый блок, а второй malloc вернул NULL. Что она должна сделать?',
      options: [
        'Освободить первый блок и сообщить об ошибке вызывающему коду',
        'Вернуть ошибку, первый блок освободит операционная система',
        'Повторять malloc, пока не получится',
        'Продолжить работу с одним блоком',
      ],
      correct: 0,
      explain:
        'Иначе первый блок утечёт: его адрес знает только эта функция. Каждая ветка ошибки возвращает всё, что успела получить.',
    },
    {
      q: 'Почему в C не пишут приведение int *p = (int *)malloc(n * sizeof *p); ?',
      options: [
        'void * превращается в int * неявно, а приведение может скрыть забытый #include <stdlib.h>',
        'Приведение запрещено стандартом',
        'Приведение замедляет программу',
        'Без приведения malloc сама узнаёт тип',
      ],
      correct: 0,
      explain:
        'В C++ приведение обязательно, а в C — лишний шум. Заодно размер берут от *p, а не от названия типа.',
    },
    {
      q: 'Что напечатает программа, если в первом блоке случайно оказались нули, а во втором запуске — нет?',
      code: String.raw`
int *a = malloc(3 * sizeof *a);
a[1] = 5;
printf("%d\n", a[0] + a[1]);`,
      lang: 'c',
      options: [
        'Результат не определён: a[0] читается до записи',
        'Всегда 5',
        'Всегда 0',
        'Ошибка компиляции',
      ],
      correct: 0,
      explain: 'Содержимое malloc не инициализировано. «Иногда работает» — признак чтения мусора.',
    },
  ],
  exercises: [
    {
      title: 'Копия строки',
      difficulty: 'beginner',
      description: `
Реализуйте функцию \`char *copy_string(const char *s)\`, которая создаёт в куче копию строки или возвращает \`NULL\` при ошибке. Это аналог \`strdup\`: в C23 она вошла в стандартную библиотеку (раньше была только в POSIX), и в реальном коде вы будете вызывать её. Здесь вы напишете её сами, чтобы увидеть, что внутри.

Функция \`main\` дана: она читает \`n\` слов в **один и тот же** буфер и сохраняет копии в массив указателей, затем печатает слова в обратном порядке и освобождает копии. Без настоящего копирования все элементы указывали бы на один буфер.`,
      constraints: ['1 ≤ n ≤ 50.', 'Слова — до 50 символов без пробелов.'],
      hints: [
        'Размер: strlen(s) + 1 — включая завершающий ноль.',
        'char *copy = malloc(strlen(s) + 1); if (copy == NULL) return NULL; затем memcpy(copy, s, len + 1) или strcpy(copy, s).',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *copy_string(const char *s) {
    return NULL;
}

int main(void) {
    int n;
    scanf("%d", &n);
    char *words[50];
    char buffer[51];
    for (int i = 0; i < n; i++) {
        scanf("%50s", buffer);
        words[i] = copy_string(buffer);
        if (words[i] == NULL) {
            return 1;
        }
    }
    for (int i = n - 1; i >= 0; i--) {
        printf(i > 0 ? "%s " : "%s\n", words[i]);
    }
    for (int i = 0; i < n; i++) {
        free(words[i]);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *copy_string(const char *s) {
    size_t len = strlen(s);
    char *copy = malloc(len + 1);
    if (copy == NULL) {
        return NULL;
    }
    memcpy(copy, s, len + 1);
    return copy;
}

int main(void) {
    int n;
    scanf("%d", &n);
    char *words[50];
    char buffer[51];
    for (int i = 0; i < n; i++) {
        scanf("%50s", buffer);
        words[i] = copy_string(buffer);
        if (words[i] == NULL) {
            return 1;
        }
    }
    for (int i = n - 1; i >= 0; i--) {
        printf(i > 0 ? "%s " : "%s\n", words[i]);
    }
    for (int i = 0; i < n; i++) {
        free(words[i]);
    }
    return 0;
}`,
      explanation: `
Буфер \`buffer\` перезаписывается при каждом чтении, поэтому сохранять его адрес бессмысленно: все элементы показывали бы последнее слово. \`copy_string\` создаёт для каждого слова отдельный блок ровно нужного размера — \`strlen + 1\` байт — и копирует туда символы вместе с \`'\\0'\`.

Функция передаёт владение блоком вызывающему коду, поэтому \`main\` освобождает каждую копию. Если выделить \`strlen(s)\` байтов без единицы, \`'\\0'\` запишется за границу блока, и AddressSanitizer сообщит \`heap-buffer-overflow\`.`,
      examples: [
        { in: '3\nred green blue\n', out: 'blue green red\n' },
        { in: '1\nx\n', out: 'x\n' },
      ],
      hidden: [
        { in: '2\na bb\n', name: 'Разная длина' },
        { in: '4\nsame same same same\n', name: 'Одинаковые' },
        {
          in: '2\nabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx y\n',
          name: 'Максимальная длина',
        },
        { in: '5\n1 22 333 4444 55555\n', name: 'Растущая длина' },
        { in: '3\nlong s longer\n', name: 'Короткое после длинного' },
        { in: '6\nf e d c b a\n', name: 'Буквы' },
        { in: '2\nhello hello!\n', name: 'Префикс' },
        { in: '3\nC++ C# C\n', name: 'Спецсимволы' },
      ],
    },
    {
      title: 'Повтор строки',
      description: `
Реализуйте функцию

\`\`\`c
char *repeat(const char *s, int k, char sep);
\`\`\`

Она возвращает новую строку из \`k\` копий \`s\`, разделённых символом \`sep\` (без разделителя в конце). При \`k = 0\` результат — пустая строка (не \`NULL\`). При ошибке выделения — \`NULL\`.

Функция \`main\` дана: печатает результат в квадратных скобках и освобождает его.`,
      constraints: ['Строка s — от 1 до 50 символов без пробелов.', '0 ≤ k ≤ 100.'],
      hints: [
        "Длина результата: k * len + (k > 0 ? k - 1 : 0), и ещё 1 байт под '\\0'.",
        'Собирайте через указатель-курсор: char *pos = out; memcpy(pos, s, len); pos += len; перед каждой копией, кроме первой, — *pos++ = sep;',
        "В конце *pos = '\\0'; — для k = 0 это единственный байт блока.",
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *repeat(const char *s, int k, char sep) {
    return NULL;
}

int main(void) {
    char s[51];
    int k;
    scanf("%50s %d", s, &k);
    char *r = repeat(s, k, '-');
    if (r == NULL) {
        return 1;
    }
    printf("[%s]\n", r);
    free(r);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *repeat(const char *s, int k, char sep) {
    size_t len = strlen(s);
    size_t total = (size_t)k * len + (k > 0 ? (size_t)k - 1 : 0);
    char *out = malloc(total + 1);
    if (out == NULL) {
        return NULL;
    }
    char *pos = out;
    for (int i = 0; i < k; i++) {
        if (i > 0) {
            *pos++ = sep;
        }
        memcpy(pos, s, len);
        pos += len;
    }
    *pos = '\0';
    return out;
}

int main(void) {
    char s[51];
    int k;
    scanf("%50s %d", s, &k);
    char *r = repeat(s, k, '-');
    if (r == NULL) {
        return 1;
    }
    printf("[%s]\n", r);
    free(r);
    return 0;
}`,
      explanation: `
Длина результата вычисляется заранее и точно: \`k\` копий, \`k − 1\` разделителей и завершающий ноль. Ошибка на единицу в любую сторону даёт либо лишний мусорный символ, либо запись за границу блока — оба случая проверка с AddressSanitizer поймает.

Курсор \`pos\` двигается по блоку и всегда указывает на следующую свободную позицию. Это быстрее, чем \`strcat\` в цикле: \`strcat\` каждый раз заново ищет конец строки.`,
      examples: [
        { in: 'ab 3\n', out: '[ab-ab-ab]\n' },
        { in: 'x 0\n', out: '[]\n', why: 'Ноль копий — пустая строка, а не NULL.' },
      ],
      hidden: [
        { in: 'word 1\n', name: 'Одна копия' },
        { in: 'z 2\n', name: 'Две копии' },
        { in: 'abc 10\n', name: 'Десять копий' },
        {
          in: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx 100\n',
          name: 'Максимальный размер',
        },
        { in: 'a 100\n', name: 'Сто однобуквенных' },
        { in: 'long_text 0\n', name: 'Ноль копий длинной строки' },
        { in: '--- 3\n', name: 'Строка из разделителей' },
        { in: 'hello 5\n', name: 'Пять копий' },
      ],
    },
    {
      title: 'Проверка размера перед malloc',
      description: `
Реализуйте функцию

\`\`\`c
int checked_mul(size_t a, size_t b, size_t *out);
\`\`\`

Если произведение \`a · b\` помещается в \`size_t\`, она записывает его в \`*out\` и возвращает 0; иначе возвращает −1 и \`*out\` не меняет. Само переполняющееся произведение вычислять нельзя.

Функция \`main\` дана: для каждой из \`q\` пар печатает произведение или \`overflow\`.`,
      constraints: [
        '1 ≤ q ≤ 10.',
        '0 ≤ a, b ≤ 18 446 744 073 709 551 615 (SIZE_MAX на 64-битной системе).',
      ],
      hints: [
        'Если b == 0, произведение 0 — переполнения нет (и делить на b нельзя).',
        'Иначе переполнение тогда и только тогда, когда a > SIZE_MAX / b. SIZE_MAX объявлен в <stdint.h>.',
      ],
      starter: String.raw`
#include <stdint.h>
#include <stdio.h>

int checked_mul(size_t a, size_t b, size_t *out) {
    return -1;
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        size_t a, b, product;
        scanf("%zu %zu", &a, &b);
        if (checked_mul(a, b, &product) == 0) {
            printf("%zu\n", product);
        } else {
            printf("overflow\n");
        }
    }
    return 0;
}`,
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>

int checked_mul(size_t a, size_t b, size_t *out) {
    if (b != 0 && a > SIZE_MAX / b) {
        return -1;
    }
    *out = a * b;
    return 0;
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        size_t a, b, product;
        scanf("%zu %zu", &a, &b);
        if (checked_mul(a, b, &product) == 0) {
            printf("%zu\n", product);
        } else {
            printf("overflow\n");
        }
    }
    return 0;
}`,
      explanation: `
\`SIZE_MAX / b\` — наибольшее \`a\`, при котором \`a · b ≤ SIZE_MAX\`. Деление не переполняется никогда, поэтому проверка безопасна. После неё умножение гарантированно точное.

Именно так защищают выделение массива с размером из входных данных: \`if (checked_mul(count, sizeof *p, &bytes) != 0) return ошибка; p = malloc(bytes);\`. GCC и Clang предоставляют для этого и встроенную функцию \`__builtin_mul_overflow\`, а в C23 появился стандартный \`ckd_mul\`.`,
      examples: [
        { in: '2\n1000 8\n18446744073709551615 2\n', out: '8000\noverflow\n' },
        { in: '1\n0 18446744073709551615\n', out: '0\n' },
      ],
      hidden: [
        { in: '1\n18446744073709551615 1\n', name: 'Максимум на 1' },
        { in: '1\n18446744073709551615 0\n', name: 'Умножение на 0' },
        { in: '1\n4294967296 4294967296\n', name: '2³² · 2³²' },
        { in: '1\n4294967296 4294967295\n', name: 'Почти максимум' },
        { in: '1\n2305843009213693952 8\n', name: '2⁶¹ · 8' },
        { in: '1\n2305843009213693951 8\n', name: 'На единицу меньше' },
        { in: '3\n1 1\n0 0\n3 5\n', name: 'Маленькие' },
        { in: '1\n9223372036854775808 2\n', name: '2⁶³ · 2' },
      ],
    },
    {
      title: 'Задачи в куче',
      difficulty: 'advanced',
      description: `
Реализуйте функцию-конструктор

\`\`\`c
struct Task *task_create(const char *title, int priority);
\`\`\`

Она выделяет структуру в куче, заполняет все поля (\`done = 0\`) и возвращает указатель или \`NULL\`.

Программа читает \`n\` задач «приоритет название», затем номера выполненных задач до числа \`-1\`. Напечатайте **невыполненные** задачи по убыванию приоритета (при равенстве — в порядке ввода) в формате \`приоритет название\`, либо \`all done\`, если невыполненных нет. Освободите все структуры.`,
      constraints: [
        '1 ≤ n ≤ 50.',
        'Название — до 30 символов без пробелов.',
        '1 ≤ приоритет ≤ 10.',
        'Номера выполненных — от 0 до n − 1, могут повторяться.',
      ],
      hints: [
        'struct Task *t = malloc(sizeof *t); — размер от *t. Название копируйте с ограничением: snprintf(t->title, sizeof t->title, "%s", title);',
        'Храните указатели в struct Task *tasks[50]; для сортировки переставляйте указатели (вставками — это сохранит порядок ввода при равных приоритетах).',
        'Если какой-то task_create вернул NULL, освободите уже созданные задачи перед выходом.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Task {
    char title[31];
    int priority;
    int done;
};

struct Task *task_create(const char *title, int priority) {
    return NULL;
}

int main(void) {
    // Прочитайте задачи, отметьте выполненные и напечатайте остальные.
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Task {
    char title[31];
    int priority;
    int done;
};

struct Task *task_create(const char *title, int priority) {
    struct Task *t = malloc(sizeof *t);
    if (t == NULL) {
        return NULL;
    }
    snprintf(t->title, sizeof t->title, "%s", title);
    t->priority = priority;
    t->done = 0;
    return t;
}

int main(void) {
    int n;
    scanf("%d", &n);
    struct Task *tasks[50];
    for (int i = 0; i < n; i++) {
        int priority;
        char title[31];
        scanf("%d %30s", &priority, title);
        tasks[i] = task_create(title, priority);
        if (tasks[i] == NULL) {
            for (int k = 0; k < i; k++) {
                free(tasks[k]);
            }
            return 1;
        }
    }
    int id;
    while (scanf("%d", &id) == 1 && id != -1) {
        tasks[id]->done = 1;
    }
    for (int i = 1; i < n; i++) {
        struct Task *current = tasks[i];
        int j = i - 1;
        while (j >= 0 && tasks[j]->priority < current->priority) {
            tasks[j + 1] = tasks[j];
            j--;
        }
        tasks[j + 1] = current;
    }
    int printed = 0;
    for (int i = 0; i < n; i++) {
        if (!tasks[i]->done) {
            printf("%d %s\n", tasks[i]->priority, tasks[i]->title);
            printed++;
        }
    }
    if (printed == 0) {
        printf("all done\n");
    }
    for (int i = 0; i < n; i++) {
        free(tasks[i]);
    }
    return 0;
}`,
      explanation: `
Конструктор инкапсулирует три обязанности: выделить ровно \`sizeof *t\` байтов, проверить результат и задать **каждое** поле — включая \`done\`, которое без явной записи содержало бы мусор.

Сортировка вставками переставляет 8-байтовые указатели, а сами структуры остаются на месте в куче. Она устойчива: элемент сдвигается, только если впереди стоит задача со строго меньшим приоритетом, поэтому равные сохраняют порядок ввода. Каждой успешной \`task_create\` соответствует ровно один \`free\` — и на обычном пути, и при ошибке.`,
      examples: [
        { in: '4\n2 mail\n5 deploy\n2 call\n7 fix\n3 -1\n', out: '5 deploy\n2 mail\n2 call\n' },
        { in: '2\n1 a\n1 b\n0 1 -1\n', out: 'all done\n' },
      ],
      hidden: [
        { in: '1\n10 only\n-1\n', name: 'Одна задача' },
        { in: '3\n1 a\n2 b\n3 c\n-1\n', name: 'Ничего не выполнено' },
        { in: '3\n5 a\n5 b\n5 c\n1 -1\n', name: 'Равные приоритеты' },
        { in: '3\n1 x\n2 y\n3 z\n0 0 0 -1\n', name: 'Повторная отметка' },
        {
          in: '4\n1 abcdefghijklmnopqrstuvwxyz1234\n2 b\n3 c\n4 d\n1 2 3 -1\n',
          name: 'Длинное название',
        },
        { in: '5\n3 a\n1 b\n3 c\n2 d\n3 e\n4 -1\n', name: 'Три равных' },
        { in: '2\n10 hi\n1 lo\n-1\n', name: 'Крайние приоритеты' },
        { in: '6\n1 a\n2 b\n3 c\n4 d\n5 e\n6 f\n0 2 4 -1\n', name: 'Половина выполнена' },
      ],
    },
  ],
};
