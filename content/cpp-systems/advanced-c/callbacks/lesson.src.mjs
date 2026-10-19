export default {
  id: 'advanced-callbacks',
  title: 'Функции обратного вызова',
  description:
    'Callback и функции высшего порядка; передача данных через контекст void *ctx вместо глобальных переменных; изменяемый контекст как замыкание; досрочная остановка обхода; регистрация обработчиков и время жизни контекста; atexit; почему у qsort нет контекста; договор обратного вызова.',
  moduleId: 'advanced-c',
  order: 14,
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  prerequisites: ['advanced-function-pointers'],
  objectives: [
    'Писать функции высшего порядка, принимающие callback',
    'Передавать в callback данные через контекст void * вместо глобальных переменных',
    'Использовать соглашение о досрочной остановке обхода',
    'Регистрировать обработчики и следить за временем жизни их контекста',
  ],
  tags: ['Callback', 'Контекст', 'void *', 'atexit', 'Функции высшего порядка'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что такое функция обратного вызова?',
      options: [
        'Функция, которую передают другой функции, чтобы та вызвала её в нужный момент',
        'Функция, которая вызывает сама себя',
        'Функция, которая возвращает управление в main',
        'Функция, объявленная после места вызова',
      ],
      correct: 0,
      explain:
        'Callback — это «что сделать», а функция высшего порядка — «как и когда». qsort вызывает функцию сравнения, atexit — функции завершения.',
    },
    {
      q: 'Зачем функции высшего порядка параметр void *ctx, который она сама не использует?',
      options: [
        "Чтобы передать в каждый вызов callback'а данные вызывающего кода без глобальных переменных",
        'Чтобы вернуть результат через указатель',
        "Чтобы ускорить вызов callback'а",
        'Это требование стандарта для всех функций с указателями на функции',
      ],
      correct: 0,
      explain:
        "Функция высшего порядка не знает, что нужно callback'у, поэтому передаёт непрозрачный указатель. Тип данных по этому адресу — договор между вызывающим и callback'ом.",
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef int Predicate(int value, void *ctx);

static int count_if(const int *a, int n, Predicate *p, void *ctx) {
    int found = 0;
    for (int i = 0; i < n; i++) {
        found += p(a[i], ctx) != 0;
    }
    return found;
}

static int divisible(int value, void *ctx) {
    return value % *(int *)ctx == 0;
}

int main(void) {
    int data[] = {6, 9, 10, 12, 15, 20};
    int k = 3;
    int by3 = count_if(data, 6, divisible, &k);
    k = 5;
    printf("%d %d\n", by3, count_if(data, 6, divisible, &k));
    return 0;
}`,
      answers: ['4 3'],
      placeholder: 'Вывод программы',
      explain:
        'На 3 делятся 6, 9, 12, 15 — четыре числа; на 5 — 10, 15, 20 — три. Контекст меняется между вызовами, а функции остаются теми же.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

static void a(void) { puts("A"); }
static void b(void) { puts("B"); }
static void c(void) { puts("C"); }

int main(void) {
    atexit(a);
    atexit(b);
    puts("main");
    atexit(c);
    return 0;
}`,
      answers: ['main\nC\nB\nA', 'main C B A'],
      placeholder: 'Строки через пробел',
      explain:
        'Обработчики atexit вызываются после выхода из main в порядке, обратном регистрации: c, затем b, затем a.',
    },
    {
      q: "Какие ошибки опасны при работе с контекстом callback'а? Выберите все.",
      options: [
        'Зарегистрировать адрес локальной переменной, а вызвать обработчик после возврата из функции',
        "Передать long *, а в callback'е привести ctx к int *",
        "Хранить данные callback'а в глобальной переменной — функцию нельзя будет вызвать вложенно или из двух потоков",
        "Передать NULL, если callback'у контекст не нужен",
      ],
      correct: [0, 1, 2],
      explain:
        'Висячий контекст и неверный тип — неопределённое поведение без предупреждений, а глобальные данные лишают функцию реентерабельности. NULL для ненужного контекста — нормальная практика.',
    },
    {
      q: 'Как отсортировать массив по ключу, выбранному во время работы, если нужен переносимый и реентерабельный код?',
      options: [
        'Написать свою сортировку, функция сравнения которой получает void *ctx',
        'Передать ключ в qsort дополнительным аргументом',
        'Сохранить ключ в глобальной переменной и вызвать qsort',
        'Использовать qsort_r — она одинакова во всех системах',
      ],
      correct: 0,
      explain:
        'У qsort нет контекста. Глобальная переменная работает, но нереентерабельна; qsort_r в glibc и BSD имеет разный порядок параметров.',
    },
    {
      q: 'Функция walk вызывает visit для элементов {4, 7, 2, 9} по порядку и останавливается, как только visit вернёт не ноль. visit возвращает 1 для чисел больше 5 и печатает каждое полученное число. Что будет напечатано?',
      answers: ['4 7', '4\n7'],
      placeholder: 'Числа через пробел',
      explain:
        'visit(4) печатает 4 и возвращает 0 — обход продолжается. visit(7) печатает 7 и возвращает 1 — обход прекращается, до 2 и 9 дело не доходит.',
    },
    {
      q: 'Когда обработчики, зарегистрированные через atexit, НЕ вызываются?',
      options: [
        'При аварийном завершении через abort()',
        'При возврате из main',
        'При вызове exit(1)',
        'При вызове exit(0) из другой функции',
      ],
      correct: 0,
      explain:
        'atexit работает только при нормальном завершении: return из main или exit с любым кодом. abort, необработанный сигнал и _Exit обработчики не вызывают.',
    },
  ],
  exercises: [
    {
      title: 'Фильтр с контекстом',
      difficulty: 'beginner',
      description: `
Прочитайте \`n\` и \`n\` целых чисел, затем до конца ввода — запросы фильтрации:
- \`gt X\` — числа больше \`X\`;
- \`lt X\` — числа меньше \`X\`;
- \`range A B\` — числа от \`A\` до \`B\` включительно;
- \`div K\` — числа, делящиеся на \`K\` (\`K ≠ 0\`);
- \`odd\` — нечётные числа.

Для каждого запроса напечатайте подходящие числа в исходном порядке через пробел или \`нет\`.

Напишите одну функцию

\`\`\`c
size_t filter(const int *in, size_t n, int *out, Predicate *keep, void *ctx);
\`\`\`

где \`typedef int Predicate(int value, void *ctx);\`, и по предикату на каждый вид запроса. Данные запроса (порог, границы, делитель) передавайте через \`ctx\`.`,
      constraints: [
        '1 ≤ n ≤ 100; числа и параметры по модулю не больше 10⁹; запросов не больше 20.',
      ],
      hints: [
        'Для gt, lt и div контекст — указатель на int; для range — на структуру { int low, high; }; для odd контекст не нужен, передайте NULL.',
        'filter копирует в out элементы, для которых keep(in[i], ctx) не равен нулю, и возвращает их количество.',
        'Проверка нечётности для отрицательных чисел: value % 2 != 0 (остаток может быть равен −1).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef int Predicate(int value, void *ctx);

struct Range {
    int low, high;
};

static size_t filter(const int *in, size_t n, int *out, Predicate *keep, void *ctx) {
    size_t kept = 0;
    for (size_t i = 0; i < n; i++) {
        if (keep(in[i], ctx)) {
            out[kept++] = in[i];
        }
    }
    return kept;
}

static int greater(int value, void *ctx) { return value > *(const int *)ctx; }
static int less(int value, void *ctx) { return value < *(const int *)ctx; }
static int divisible(int value, void *ctx) { return value % *(const int *)ctx == 0; }

static int in_range(int value, void *ctx) {
    const struct Range *r = ctx;
    return value >= r->low && value <= r->high;
}

static int odd(int value, void *ctx) {
    (void)ctx;
    return value % 2 != 0;
}

int main(void) {
    int n, data[100], result[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &data[i]) != 1) {
            return 0;
        }
    }
    char command[16];
    while (scanf("%15s", command) == 1) {
        int x;
        struct Range range;
        size_t kept;
        if (strcmp(command, "gt") == 0 && scanf("%d", &x) == 1) {
            kept = filter(data, (size_t)n, result, greater, &x);
        } else if (strcmp(command, "lt") == 0 && scanf("%d", &x) == 1) {
            kept = filter(data, (size_t)n, result, less, &x);
        } else if (strcmp(command, "div") == 0 && scanf("%d", &x) == 1) {
            kept = filter(data, (size_t)n, result, divisible, &x);
        } else if (strcmp(command, "range") == 0 && scanf("%d %d", &range.low, &range.high) == 2) {
            kept = filter(data, (size_t)n, result, in_range, &range);
        } else if (strcmp(command, "odd") == 0) {
            kept = filter(data, (size_t)n, result, odd, NULL);
        } else {
            break;
        }
        if (kept == 0) {
            printf("нет\n");
            continue;
        }
        for (size_t i = 0; i < kept; i++) {
            printf(i + 1 < kept ? "%d " : "%d\n", result[i]);
        }
    }
    return 0;
}`,
      explanation: `
Функция \`filter\` одна для всех запросов: она обходит массив и спрашивает у предиката, оставить ли элемент. Что именно проверяется — решает предикат, а данные для проверки приходят через \`ctx\`. Для порога это \`int *\`, для диапазона — указатель на структуру из двух чисел, а предикату \`odd\` данные не нужны, и он получает \`NULL\` (строка \`(void)ctx;\` убирает предупреждение о неиспользуемом параметре).

Без контекста пришлось бы держать порог и границы в глобальных переменных. Тогда \`filter\` нельзя было бы вызвать вложенно — например, отфильтровать результат другого фильтра внутри предиката, — а в многопоточной программе два потока портили бы друг другу параметры.`,
      examples: [
        {
          in: '7\n12 5 40 7 25 3 18\ngt 10\nrange 5 12\nodd\n',
          out: '12 40 25 18\n12 5 7\n5 7 25 3\n',
        },
        { in: '3\n2 4 6\nodd\nlt 2\ndiv 2\n', out: 'нет\nнет\n2 4 6\n' },
      ],
      hidden: [
        { in: '5\n-3 -2 -1 0 1\nodd\n', name: 'Отрицательные нечётные' },
        { in: '4\n10 20 30 40\nrange 40 10\n', name: 'Пустой диапазон' },
        { in: '6\n-9 -6 -3 3 6 9\ndiv -3\n', name: 'Отрицательный делитель' },
        { in: '1\n1000000000\ngt 999999999\nlt 1000000000\n', name: 'Большие числа' },
        { in: '5\n5 5 5 5 5\nrange 5 5\ngt 5\n', name: 'Равные числа' },
        { in: '8\n1 2 3 4 5 6 7 8\ngt 2\nlt 7\ndiv 4\nodd\n', name: 'Несколько запросов' },
        {
          in: '3\n-1000000000 0 1000000000\nrange -1000000000 1000000000\n',
          name: 'Широкий диапазон',
        },
        { in: '2\n7 14\ndiv 7\ndiv 14\ndiv 28\n', name: 'Делимость' },
      ],
    },
    {
      title: 'Свёртка',
      description: `
Прочитайте \`n\` и \`n\` целых чисел, затем до конца ввода — команды. Каждая команда вычисляет одну величину по всему массиву:
- \`sum\` — сумма;
- \`minmax\` — минимум и максимум через пробел;
- \`mean\` — среднее арифметическое с двумя знаками после точки;
- \`prod M\` — произведение по модулю \`M\` (результат от 0 до M − 1);
- \`streak\` — длина самой длинной серии подряд идущих строго возрастающих чисел.

Напишите функцию свёртки

\`\`\`c
void fold(const int *values, size_t n, Step *step, void *acc);
\`\`\`

где \`typedef void Step(int value, void *acc);\`. Она вызывает \`step\` для каждого элемента по порядку, а \`step\` обновляет **аккумулятор** — структуру, на которую указывает \`acc\`. Для каждой команды заведите свою структуру и свою функцию шага.`,
      constraints: [
        '1 ≤ n ≤ 1000; числа по модулю не больше 10⁶; 2 ≤ M ≤ 10⁹.',
        'Команд не больше 20.',
      ],
      hints: [
        'Аккумулятор для minmax — { int min, max; int started; }, для mean — { long long sum; int count; }, для prod — { long long result; long long mod; }.',
        'В prod приводите каждое число к остатку от 0 до M − 1: ((value % mod) + mod) % mod — у отрицательных чисел остаток в C отрицательный.',
        'Для streak храните предыдущее значение, длину текущей серии и лучшую длину; на первом элементе текущая серия равна 1.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef void Step(int value, void *acc);

static void fold(const int *values, size_t n, Step *step, void *acc) {
    for (size_t i = 0; i < n; i++) {
        step(values[i], acc);
    }
}

static void step_sum(int value, void *acc) {
    *(long long *)acc += value;
}

struct MinMax {
    int min, max;
    int started;
};

static void step_minmax(int value, void *acc) {
    struct MinMax *m = acc;
    if (!m->started || value < m->min) {
        m->min = value;
    }
    if (!m->started || value > m->max) {
        m->max = value;
    }
    m->started = 1;
}

struct Mean {
    long long sum;
    int count;
};

static void step_mean(int value, void *acc) {
    struct Mean *m = acc;
    m->sum += value;
    m->count++;
}

struct Product {
    long long result;
    long long mod;
};

static void step_prod(int value, void *acc) {
    struct Product *p = acc;
    long long v = ((value % p->mod) + p->mod) % p->mod;
    p->result = p->result * v % p->mod;
}

struct Streak {
    int prev;
    int current;
    int best;
};

static void step_streak(int value, void *acc) {
    struct Streak *s = acc;
    s->current = (s->current > 0 && value > s->prev) ? s->current + 1 : 1;
    if (s->current > s->best) {
        s->best = s->current;
    }
    s->prev = value;
}

int main(void) {
    int n;
    static int data[1000];
    if (scanf("%d", &n) != 1 || n < 1 || n > 1000) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &data[i]) != 1) {
            return 0;
        }
    }
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "sum") == 0) {
            long long sum = 0;
            fold(data, (size_t)n, step_sum, &sum);
            printf("%lld\n", sum);
        } else if (strcmp(command, "minmax") == 0) {
            struct MinMax m = {0, 0, 0};
            fold(data, (size_t)n, step_minmax, &m);
            printf("%d %d\n", m.min, m.max);
        } else if (strcmp(command, "mean") == 0) {
            struct Mean m = {0, 0};
            fold(data, (size_t)n, step_mean, &m);
            printf("%.2f\n", (double)m.sum / m.count);
        } else if (strcmp(command, "prod") == 0) {
            struct Product p = {1, 2};
            if (scanf("%lld", &p.mod) != 1) {
                break;
            }
            p.result = 1 % p.mod;
            fold(data, (size_t)n, step_prod, &p);
            printf("%lld\n", p.result);
        } else if (strcmp(command, "streak") == 0) {
            struct Streak s = {0, 0, 0};
            fold(data, (size_t)n, step_streak, &s);
            printf("%d\n", s.best);
        }
    }
    return 0;
}`,
      explanation: `
Свёртка — общая схема «пройти по данным и накопить результат». Функция \`fold\` не знает, что именно копится: это решают функция шага и структура-аккумулятор, переданная через \`void *acc\`. Каждой задаче — свой аккумулятор: для суммы хватает одного \`long long\`, для среднего нужны сумма и количество, для серии — предыдущее значение и две длины.

Изменяемый контекст делает функцию шага похожей на замыкание: она «помнит» состояние между вызовами, но это состояние лежит не в глобальной переменной, а в структуре вызывающего кода. Поэтому две свёртки можно выполнять одновременно с разными аккумуляторами.

В \`prod\` остаток приводится к неотрицательному: в C \`-7 % 5\` равно \`-2\`. Произведение двух чисел меньше 10⁹ помещается в \`long long\`, поэтому \`result * v % mod\` не переполняется.`,
      examples: [
        { in: '5\n3 1 4 1 5\nsum\nminmax\nmean\n', out: '14\n1 5\n2.80\n' },
        { in: '6\n1 2 3 1 2 0\nstreak\nprod 7\n', out: '3\n0\n' },
      ],
      hidden: [
        { in: '1\n-5\nsum\nminmax\nmean\nstreak\nprod 3\n', name: 'Одно число' },
        { in: '4\n-7 2 -3 5\nprod 5\n', name: 'Отрицательные в произведении' },
        { in: '5\n5 4 3 2 1\nstreak\n', name: 'Убывание' },
        { in: '6\n1 1 2 2 3 3\nstreak\n', name: 'Нестрогий рост' },
        { in: '3\n1 2 2\nmean\n', name: 'Среднее с дробью' },
        { in: '4\n1000000 1000000 1000000 1000000\nsum\nprod 1000000000\n', name: 'Большие числа' },
        { in: '7\n-1 0 1 -1 0 1 2\nstreak\nminmax\nsum\n', name: 'Смешанные' },
        { in: '3\n2 3 4\nprod 2\nprod 1000000000\n', name: 'Разные модули' },
      ],
    },
    {
      title: 'Сортировка с контекстом',
      description: `
Прочитайте \`n\` записей \`имя возраст очки\`. Затем до конца ввода — команды \`sort ключ направление\`, где ключ — \`name\`, \`age\` или \`score\`, направление — \`asc\` (по возрастанию) или \`desc\` (по убыванию). Каждая команда сортирует **текущий** порядок записей, после чего печатаются имена через пробел.

Сортировка должна быть **устойчивой**: записи с равными ключами сохраняют порядок, полученный после предыдущих команд. Поэтому, например, \`sort age asc\`, а затем \`sort score desc\` упорядочивают по очкам, а при равных очках — по возрасту.

Стандартная \`qsort\` не подходит: она не устойчива, а её функция сравнения не получает контекста. Напишите сортировку вставками

\`\`\`c
void sort_records(Record *a, size_t n, Compare *cmp, void *ctx);
\`\`\`

где \`typedef int Compare(const Record *x, const Record *y, void *ctx);\`, и одну функцию сравнения, которая берёт ключ и направление из контекста.`,
      constraints: [
        '1 ≤ n ≤ 100; имена — до 15 латинских букв; возраст и очки — целые от 0 до 10⁶.',
        'Команд не больше 10; имена сравниваются через strcmp.',
      ],
      hints: [
        'Контекст — структура { int key; int descending; }. Функция сравнения вычисляет результат по ключу, а при descending меняет знак.',
        'Сортировка вставками устойчива, если сдвигать элемент влево, только пока cmp(&a[j], &key, ctx) > 0 — строго больше, а не больше или равно.',
        'Сравнение чисел без переполнения: (x > y) - (x < y).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[16];
    int age;
    int score;
} Record;

typedef int Compare(const Record *x, const Record *y, void *ctx);

enum Key { BY_NAME, BY_AGE, BY_SCORE };

struct Order {
    enum Key key;
    int descending;
};

static void sort_records(Record *a, size_t n, Compare *cmp, void *ctx) {
    for (size_t i = 1; i < n; i++) {
        Record current = a[i];
        size_t j = i;
        while (j > 0 && cmp(&a[j - 1], &current, ctx) > 0) {
            a[j] = a[j - 1];
            j--;
        }
        a[j] = current;
    }
}

static int compare_by_order(const Record *x, const Record *y, void *ctx) {
    const struct Order *order = ctx;
    int result;
    if (order->key == BY_NAME) {
        result = strcmp(x->name, y->name);
    } else if (order->key == BY_AGE) {
        result = (x->age > y->age) - (x->age < y->age);
    } else {
        result = (x->score > y->score) - (x->score < y->score);
    }
    return order->descending ? -result : result;
}

int main(void) {
    int n;
    Record records[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%15s %d %d", records[i].name, &records[i].age, &records[i].score) != 3) {
            return 0;
        }
    }
    char word[16], key[16], direction[16];
    while (scanf("%15s %15s %15s", word, key, direction) == 3) {
        struct Order order;
        order.key = strcmp(key, "name") == 0 ? BY_NAME : strcmp(key, "age") == 0 ? BY_AGE : BY_SCORE;
        order.descending = strcmp(direction, "desc") == 0;
        sort_records(records, (size_t)n, compare_by_order, &order);
        for (int i = 0; i < n; i++) {
            printf(i + 1 < n ? "%s " : "%s\n", records[i].name);
        }
    }
    return 0;
}`,
      explanation: `
Контекст превращает одну функцию сравнения в целое семейство: ключ и направление приходят через \`ctx\` и выбираются во время работы. С \`qsort\` пришлось бы писать шесть функций сравнения или хранить выбор в глобальной переменной.

Устойчивость обеспечивает строгое сравнение в цикле вставки: элемент сдвигается влево только мимо **больших** элементов, а равные остаются перед ним в прежнем порядке. Именно поэтому последовательные сортировки складываются: сортировка по возрасту, а затем по очкам даёт порядок «по очкам, при равенстве — по возрасту». Так сортируют таблицы в интерфейсах при щелчках по заголовкам столбцов.

Направление \`desc\` реализовано сменой знака результата. Для устойчивости это корректно: равные элементы дают 0 и при смене знака, так что их порядок не меняется.`,
      examples: [
        {
          in: '4\nann 30 90\nbob 25 80\ncid 30 80\ndan 25 90\nsort age asc\nsort score desc\n',
          out: 'bob dan ann cid\ndan ann bob cid\n',
        },
        { in: '3\nzoe 1 1\namy 2 2\nmax 3 3\nsort name asc\n', out: 'amy max zoe\n' },
      ],
      hidden: [
        { in: '3\nc 1 5\nb 1 5\na 1 5\nsort age desc\nsort score asc\n', name: 'Все ключи равны' },
        { in: '1\nsolo 10 10\nsort name desc\n', name: 'Одна запись' },
        {
          in: '4\nd 4 1\nc 3 2\nb 2 3\na 1 4\nsort score asc\nsort score desc\n',
          name: 'Разворот',
        },
        {
          in: '5\nann 20 100\nbob 20 90\ncid 21 100\ndan 19 90\neve 21 80\nsort name desc\nsort age asc\n',
          name: 'Имя, затем возраст',
        },
        { in: '3\nAnn 1 1\nann 1 1\nBob 1 1\nsort name asc\n', name: 'Регистр в strcmp' },
        {
          in: '4\nw 0 1000000\nx 1000000 0\ny 500000 500000\nz 0 0\nsort age desc\nsort score asc\n',
          name: 'Крайние значения',
        },
        {
          in: '6\na 3 1\nb 1 2\nc 2 1\nd 1 1\ne 3 2\nf 2 2\nsort age asc\nsort score asc\nsort name desc\n',
          name: 'Три сортировки',
        },
        { in: '2\nx 5 5\ny 5 5\nsort score desc\n', name: 'Равные записи' },
      ],
    },
    {
      title: 'Шина событий',
      difficulty: 'advanced',
      description: `
Реализуйте шину событий с подписками. Команды до конца ввода:
- \`sub ИМЯ СОБЫТИЕ РЕЖИМ\` — подписчик \`ИМЯ\` подписывается на \`СОБЫТИЕ\`; режим \`log\` или \`quiet\`. Повторная подписка того же подписчика на то же событие ничего не меняет;
- \`unsub ИМЯ СОБЫТИЕ\` — отменить эту подписку (если её нет — ничего не делать);
- \`emit СОБЫТИЕ ЧИСЛО\` — разослать событие с числом всем подписанным на него, в порядке подписки. Если подписчиков нет, напечатайте \`СОБЫТИЕ: нет подписчиков\`;
- \`stats ИМЯ\` — напечатать \`ИМЯ: событий K, сумма S\` — сколько событий получил подписчик и сумму их чисел за всё время (по всем его подпискам).

Обработчик режима \`log\` печатает \`ИМЯ получил СОБЫТИЕ ЧИСЛО\` и обновляет статистику, обработчик \`quiet\` только обновляет статистику.

Каждая подписка хранит указатель на функцию-обработчик и **контекст** — указатель на статистику своего подписчика. Рассылка вызывает обработчик подписки с событием, числом и этим контекстом.`,
      constraints: [
        'Имена и события — до 15 символов; подписчиков не больше 20, подписок одновременно не больше 50.',
        'Команд не больше 200; числа по модулю не больше 10⁶.',
      ],
      hints: [
        'Типы: struct Stats { char name[16]; int events; long long sum; }; typedef void Handler(const char *event, int value, void *ctx); и подписка { char event[16]; Handler *handler; struct Stats *ctx; int active; }.',
        'Статистика подписчика ищется по имени (или создаётся). Подписка хранит указатель на неё — поэтому массив статистик не должен перемещаться в памяти: обычный массив фиксированного размера подходит.',
        'Отписку удобно делать сдвигом оставшихся подписок, чтобы порядок рассылки сохранялся.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

struct Stats {
    char name[16];
    int events;
    long long sum;
};

typedef void Handler(const char *event, int value, void *ctx);

struct Subscription {
    char event[16];
    Handler *handler;
    struct Stats *ctx;
};

static struct Stats stats[20];
static int stats_count;
static struct Subscription subs[50];
static int sub_count;

static struct Stats *find_stats(const char *name, int create) {
    for (int i = 0; i < stats_count; i++) {
        if (strcmp(stats[i].name, name) == 0) {
            return &stats[i];
        }
    }
    if (!create || stats_count == 20) {
        return NULL;
    }
    struct Stats *s = &stats[stats_count++];
    strcpy(s->name, name);
    s->events = 0;
    s->sum = 0;
    return s;
}

static void handle_quiet(const char *event, int value, void *ctx) {
    (void)event;
    struct Stats *s = ctx;
    s->events++;
    s->sum += value;
}

static void handle_log(const char *event, int value, void *ctx) {
    struct Stats *s = ctx;
    printf("%s получил %s %d\n", s->name, event, value);
    handle_quiet(event, value, ctx);
}

static int find_sub(const struct Stats *s, const char *event) {
    for (int i = 0; i < sub_count; i++) {
        if (subs[i].ctx == s && strcmp(subs[i].event, event) == 0) {
            return i;
        }
    }
    return -1;
}

int main(void) {
    char command[16], name[16], event[16], mode[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "sub") == 0 && scanf("%15s %15s %15s", name, event, mode) == 3) {
            struct Stats *s = find_stats(name, 1);
            if (s == NULL || find_sub(s, event) >= 0 || sub_count == 50) {
                continue;
            }
            strcpy(subs[sub_count].event, event);
            subs[sub_count].handler = strcmp(mode, "log") == 0 ? handle_log : handle_quiet;
            subs[sub_count].ctx = s;
            sub_count++;
        } else if (strcmp(command, "unsub") == 0 && scanf("%15s %15s", name, event) == 2) {
            struct Stats *s = find_stats(name, 0);
            int index = s != NULL ? find_sub(s, event) : -1;
            if (index >= 0) {
                for (int i = index; i + 1 < sub_count; i++) {
                    subs[i] = subs[i + 1];
                }
                sub_count--;
            }
        } else if (strcmp(command, "emit") == 0) {
            int value;
            if (scanf("%15s %d", event, &value) != 2) {
                break;
            }
            int delivered = 0;
            for (int i = 0; i < sub_count; i++) {
                if (strcmp(subs[i].event, event) == 0) {
                    subs[i].handler(event, value, subs[i].ctx);
                    delivered++;
                }
            }
            if (delivered == 0) {
                printf("%s: нет подписчиков\n", event);
            }
        } else if (strcmp(command, "stats") == 0 && scanf("%15s", name) == 1) {
            const struct Stats *s = find_stats(name, 0);
            printf("%s: событий %d, сумма %lld\n", name, s ? s->events : 0, s ? s->sum : 0LL);
        }
    }
    return 0;
}`,
      explanation: `
Шина хранит пары «обработчик + контекст» и вызывает их, когда приходит событие. Функция рассылки не знает, что делают обработчики и что лежит в контексте: она передаёт в каждый вызов указатель, сохранённый при подписке. Поэтому один и тот же обработчик \`handle_quiet\` обслуживает всех подписчиков — каждый со своей статистикой.

Контекст здесь живёт дольше, чем вызов, в котором создан: подписка сохраняет указатель на статистику и пользуется им при каждой рассылке. Поэтому статистики лежат в массиве фиксированного размера на всё время работы программы. Если бы их хранили в массиве, который растёт через \`realloc\`, сохранённые указатели после роста стали бы висячими — частая ошибка в системах с обратными вызовами.

Отписка сдвигает оставшиеся подписки, а не переставляет последнюю на место удалённой: порядок вызова обработчиков — часть договора шины, и он не должен меняться от отписок.`,
      examples: [
        {
          in: 'sub ann click log\nsub bob click quiet\nemit click 5\nemit key 1\nstats ann\nstats bob\n',
          out: 'ann получил click 5\nkey: нет подписчиков\nann: событий 1, сумма 5\nbob: событий 1, сумма 5\n',
        },
        {
          in: 'sub ann click log\nsub ann key log\nemit key 2\nunsub ann key\nemit key 3\nstats ann\n',
          out: 'ann получил key 2\nkey: нет подписчиков\nann: событий 1, сумма 2\n',
        },
      ],
      hidden: [
        { in: 'stats ghost\nemit any 1\n', name: 'Нет подписчиков и статистики' },
        { in: 'sub a e log\nsub a e log\nemit e 1\n', name: 'Повторная подписка' },
        {
          in: 'sub a e log\nsub b e log\nsub c e log\nunsub b e\nemit e 7\n',
          name: 'Порядок после отписки',
        },
        {
          in: 'unsub a e\nsub a e quiet\nemit e -4\nemit e 10\nstats a\n',
          name: 'Отписка до подписки',
        },
        {
          in: 'sub a x quiet\nsub a y quiet\nemit x 1\nemit y 2\nemit z 3\nstats a\n',
          name: 'Статистика по нескольким подпискам',
        },
        {
          in: 'sub a e log\nunsub a e\nsub a e log\nemit e 9\nstats a\n',
          name: 'Переподписка',
        },
        {
          in: 'sub p1 tick quiet\nsub p2 tick log\nsub p3 tock log\nemit tick 1000000\nemit tock -1000000\nstats p1\nstats p2\nstats p3\n',
          name: 'Несколько событий',
        },
        {
          in: 'sub a e quiet\nemit e 1\nemit e 1\nemit e 1\nstats a\nstats b\n',
          name: 'Тихий режим',
        },
      ],
    },
  ],
};
