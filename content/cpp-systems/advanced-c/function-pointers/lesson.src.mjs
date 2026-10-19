export default {
  id: 'advanced-function-pointers',
  title: 'Указатели на функции',
  description:
    'Имя функции как указатель; синтаксис объявления и правило чтения; равнозначные формы присваивания и вызова; совпадение типов; typedef типа функции и объявление signal; таблицы функций вместо switch; функция как параметр и как результат; структуры с указателями на функции как интерфейс; нулевой указатель на функцию.',
  moduleId: 'advanced-c',
  order: 13,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-const'],
  objectives: [
    'Объявлять, присваивать и вызывать указатели на функции',
    'Читать сложные объявления и упрощать их с помощью typedef',
    'Заменять разветвлённый switch таблицей функций',
    'Описывать поведение объектов структурами с указателями на функции',
  ],
  tags: ['Указатели на функции', 'typedef', 'Таблица функций', 'Диспетчеризация', 'Интерфейс'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Объявите переменную f — указатель на функцию, которая принимает double и возвращает double.',
      answers: ['double (*f)(double);', 'double (*f)(double)'],
      placeholder: 'Объявление',
      explain:
        'Скобки вокруг *f обязательны: без них double *f(double); — прототип функции, возвращающей double *.',
    },
    {
      q: 'Что объявляет строка int *parse(const char *text);?',
      options: [
        'Функцию parse, которая возвращает указатель на int',
        'Указатель parse на функцию, возвращающую int',
        'Указатель на int с именем parse',
        'Массив функций',
      ],
      correct: 0,
      explain:
        'Скобки вызова сильнее звёздочки: parse(...) — функция, а * относится к возвращаемому типу. Указатель на функцию: int (*parse)(const char *).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

static int inc(int x) { return x + 1; }
static int twice(int x) { return 2 * x; }

int main(void) {
    int (*steps[])(int) = {twice, inc, twice};
    int value = 3;
    for (int i = 0; i < 3; i++) {
        value = steps[i](value);
    }
    printf("%d\n", value);
    return 0;
}`,
      answers: ['14'],
      placeholder: 'Вывод программы',
      explain: 'Массив указателей на функции применяется по порядку: 3 → 6 → 7 → 14.',
    },
    {
      q: 'Функция int is_ready(void) объявлена выше. Что не так в условии if (is_ready) { … }?',
      options: [
        'Проверяется адрес функции, а не её результат: условие всегда истинно',
        'Ничего: скобки вызова необязательны',
        'Это ошибка компиляции',
        'Функция вызовется дважды',
      ],
      correct: 0,
      explain:
        'Имя без скобок превращается в указатель на функцию, а он никогда не равен нулю. GCC предупреждает: the address of is_ready will always evaluate as true.',
    },
    {
      q: 'Какие вызовы равнозначны op(2, 3), если int (*op)(int, int) = add;? Выберите все.',
      options: ['(*op)(2, 3)', 'add(2, 3)', '(**op)(2, 3)', '&op(2, 3)'],
      correct: [0, 1, 2],
      explain:
        'Разыменование указателя на функцию даёт функцию, которая снова превращается в указатель, поэтому * можно писать сколько угодно раз. &op(2, 3) — попытка взять адрес результата вызова, это ошибка.',
    },
    {
      q: 'Что такое cmp после typedef int Compare(const void *, const void *); Compare *cmp;?',
      options: [
        'Указатель на функцию, подходящую для qsort',
        'Функция сравнения',
        'Указатель на void',
        'Ошибка: typedef для функции запрещён',
      ],
      correct: 0,
      explain:
        'Compare — тип функции (const void *, const void *) -> int, а Compare * — указатель на такую функцию. Именно такой параметр принимает qsort.',
    },
    {
      q: 'Функция double half(double x) присвоена указателю int (*f)(int) через приведение типа и вызвана как f(10). Что это?',
      options: [
        'Неопределённое поведение: тип указателя не совпадает с типом функции',
        'Корректный вызов: аргумент преобразуется в double',
        'Ошибка компиляции',
        'Вызов вернёт 5',
      ],
      correct: 0,
      explain:
        'Компилятор генерирует вызов по типу указателя: передаёт int и читает int. Функция же ждёт и возвращает double, поэтому результат непредсказуем.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef int Rule(int);

static int keep(int x) { return x; }
static int clamp(int x) { return x > 10 ? 10 : x; }

static Rule *pick(int strict) {
    return strict ? clamp : keep;
}

int main(void) {
    printf("%d %d\n", pick(0)(25), pick(1)(25));
    return 0;
}`,
      answers: ['25 10'],
      placeholder: 'Вывод программы',
      explain:
        'pick возвращает указатель на функцию, и его сразу вызывают: pick(0) — keep, pick(1) — clamp.',
    },
  ],
  exercises: [
    {
      title: 'Калькулятор на таблице',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — выражение \`a op b\`, где \`a\` и \`b\` — целые числа, а \`op\` — один символ. Напечатайте результат или сообщение.

Поддерживаемые операции: \`+\`, \`-\`, \`*\`, \`/\` и \`%\` (целочисленные, как в C), \`^\` — возведение в степень (\`b ≥ 0\`, \`a⁰ = 1\`).

Решите задачу **таблицей**: массив структур \`{ символ, функция }\`, где функции имеют общий тип

\`\`\`c
typedef int Operation(long long a, long long b, long long *result);
\`\`\`

Функция записывает результат и возвращает 1 или возвращает 0, если операция невозможна (деление или остаток от деления на ноль, отрицательная степень). Для невозможной операции напечатайте \`ошибка\`, для символа, которого нет в таблице, — \`неизвестная операция X\`.`,
      constraints: ['|a|, |b| ≤ 10⁹; результаты по модулю не больше 10¹⁸.', 'Строк не больше 30.'],
      hints: [
        "Объявите шесть функций типа Operation и таблицу static const struct { char symbol; Operation *apply; } OPS[] = {{'+', op_add}, …};.",
        'Читайте строки через scanf("%lld %c %lld", &a, &op, &b). Поиск в таблице — цикл по sizeof OPS / sizeof OPS[0].',
        'Степень: result = 1 и b раз умножить на a. При b < 0 верните 0.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef int Operation(long long a, long long b, long long *result);

static int op_add(long long a, long long b, long long *result) {
    *result = a + b;
    return 1;
}

static int op_sub(long long a, long long b, long long *result) {
    *result = a - b;
    return 1;
}

static int op_mul(long long a, long long b, long long *result) {
    *result = a * b;
    return 1;
}

static int op_div(long long a, long long b, long long *result) {
    if (b == 0) {
        return 0;
    }
    *result = a / b;
    return 1;
}

static int op_mod(long long a, long long b, long long *result) {
    if (b == 0) {
        return 0;
    }
    *result = a % b;
    return 1;
}

static int op_pow(long long a, long long b, long long *result) {
    if (b < 0) {
        return 0;
    }
    long long value = 1;
    for (long long i = 0; i < b; i++) {
        value *= a;
    }
    *result = value;
    return 1;
}

static const struct {
    char symbol;
    Operation *apply;
} OPS[] = {
    {'+', op_add}, {'-', op_sub}, {'*', op_mul}, {'/', op_div}, {'%', op_mod}, {'^', op_pow},
};

int main(void) {
    long long a, b;
    char op;
    while (scanf("%lld %c %lld", &a, &op, &b) == 3) {
        Operation *apply = NULL;
        for (size_t i = 0; i < sizeof OPS / sizeof OPS[0]; i++) {
            if (OPS[i].symbol == op) {
                apply = OPS[i].apply;
            }
        }
        long long result;
        if (apply == NULL) {
            printf("неизвестная операция %c\n", op);
        } else if (!apply(a, b, &result)) {
            printf("ошибка\n");
        } else {
            printf("%lld\n", result);
        }
    }
    return 0;
}`,
      explanation: `
Все операции приведены к одному типу \`Operation\`: два операнда и указатель на результат, а возвращаемое значение сообщает об успехе. Единый тип позволяет сложить функции в одну таблицу и вызывать любую из них одной строкой \`apply(a, b, &result)\`. Возврат статуса вместо результата нужен потому, что у деления на ноль нет никакого «правильного» числового ответа.

Таблица объявлена \`static const\`: это неизменяемые данные. Чтобы добавить операцию — например, \`m\` для минимума, — достаточно написать функцию и строку таблицы; цикл поиска и печать не меняются. В \`switch\`-версии пришлось бы править код обработки.`,
      examples: [
        { in: '7 + 5\n7 / 2\n-7 % 3\n2 ^ 10\n', out: '12\n3\n-1\n1024\n' },
        { in: '5 / 0\n3 & 4\n2 ^ -1\n', out: 'ошибка\nнеизвестная операция &\nошибка\n' },
      ],
      hidden: [
        { in: '1000000000 * 1000000000\n', name: 'Большое произведение' },
        { in: '0 ^ 0\n5 ^ 0\n-2 ^ 3\n', name: 'Степени' },
        { in: '-9 - -9\n-1 + 1\n', name: 'Отрицательные числа' },
        { in: '10 % 0\n0 % 5\n', name: 'Остаток' },
        { in: '-7 / 2\n7 / -2\n', name: 'Деление с отбрасыванием' },
        { in: '3 x 4\n3 = 4\n', name: 'Неизвестные операции' },
        { in: '10 ^ 18\n', name: 'Максимальная степень' },
        { in: '1 + 2\n3 * 4\n5 - 6\n7 / 8\n9 % 10\n', name: 'Все операции подряд' },
      ],
    },
    {
      title: 'Конвейер преобразований',
      description: `
В первой строке ввода — названия преобразований через пробел: это конвейер, который применяется слева направо. Далее до конца ввода — целые числа. Для каждого числа напечатайте результат конвейера.

Преобразования:

| Название | Действие |
| --- | --- |
| \`inc\` | x + 1 |
| \`dec\` | x − 1 |
| \`double\` | 2x |
| \`half\` | x / 2 (целочисленное, как в C) |
| \`square\` | x² |
| \`negate\` | −x |
| \`abs\` | \\|x\\| |

Сначала разберите конвейер: найдите каждое название в таблице \`{ название, функция }\` и сохраните указатели на функции в массив. Если какое-то название неизвестно, напечатайте только \`неизвестное преобразование НАЗВАНИЕ\` (первое неизвестное) и завершите программу. Если конвейер пуст, числа печатаются без изменений.`,
      constraints: [
        'В конвейере не больше 10 преобразований; чисел не больше 30.',
        'Все промежуточные результаты по модулю не больше 10¹⁸.',
      ],
      hints: [
        'Первую строку прочитайте через fgets и разбейте на слова, например, циклом с sscanf и форматом "%15s%n".',
        'Тип функции: typedef long long Step(long long x);. Конвейер — массив Step *pipeline[10] и его длина.',
        'Применение к числу: for (int i = 0; i < length; i++) x = pipeline[i](x);.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef long long Step(long long x);

static long long step_inc(long long x) { return x + 1; }
static long long step_dec(long long x) { return x - 1; }
static long long step_double(long long x) { return 2 * x; }
static long long step_half(long long x) { return x / 2; }
static long long step_square(long long x) { return x * x; }
static long long step_negate(long long x) { return -x; }
static long long step_abs(long long x) { return x < 0 ? -x : x; }

static const struct {
    const char *name;
    Step *apply;
} STEPS[] = {
    {"inc", step_inc},       {"dec", step_dec},       {"double", step_double},
    {"half", step_half},     {"square", step_square}, {"negate", step_negate},
    {"abs", step_abs},
};

static Step *find_step(const char *name) {
    for (size_t i = 0; i < sizeof STEPS / sizeof STEPS[0]; i++) {
        if (strcmp(STEPS[i].name, name) == 0) {
            return STEPS[i].apply;
        }
    }
    return NULL;
}

int main(void) {
    char line[256];
    if (fgets(line, sizeof line, stdin) == NULL) {
        return 0;
    }
    Step *pipeline[10];
    int length = 0;
    const char *p = line;
    char name[16];
    int used;
    while (length < 10 && sscanf(p, "%15s%n", name, &used) == 1) {
        p += used;
        Step *step = find_step(name);
        if (step == NULL) {
            printf("неизвестное преобразование %s\n", name);
            return 0;
        }
        pipeline[length++] = step;
    }
    long long x;
    while (scanf("%lld", &x) == 1) {
        for (int i = 0; i < length; i++) {
            x = pipeline[i](x);
        }
        printf("%lld\n", x);
    }
    return 0;
}`,
      explanation: `
Решение разделено на два этапа. Сначала названия превращаются в указатели на функции — один раз, до обработки чисел. Затем каждое число проходит по готовому массиву указателей, и поиск по строкам больше не нужен. Так работают и настоящие конвейеры обработки данных: конфигурация «компилируется» в последовательность функций, а потом быстро применяется к потоку данных.

Ошибку в конфигурации выгоднее обнаружить до обработки: программа не напечатает половину результатов, прежде чем споткнуться. Поэтому неизвестное название проверяется на этапе разбора.

Формат \`%n\` сообщает, сколько символов прочитано, — так \`sscanf\` можно вызывать в цикле по одной строке, сдвигая указатель.`,
      examples: [
        { in: 'double inc square\n1\n-3\n', out: '9\n25\n' },
        { in: 'abs half\n-7\n7\n', out: '3\n3\n' },
      ],
      hidden: [
        { in: '\n5\n-5\n', name: 'Пустой конвейер' },
        { in: 'inc triple\n1\n', name: 'Неизвестное преобразование' },
        { in: 'negate half\n7\n', name: 'Деление отрицательного' },
        { in: 'square square square\n10\n-10\n', name: 'Повторы' },
        { in: 'dec dec dec dec dec\n0\n100\n', name: 'Пять шагов' },
        { in: 'square negate abs\n1000000000\n', name: 'Большие числа' },
        { in: '  inc   double  \n0\n', name: 'Лишние пробелы' },
        {
          in: 'half half half half half half half half half half\n1024\n-1024\n',
          name: 'Десять шагов',
        },
        { in: 'inc\n', name: 'Нет чисел' },
      ],
    },
    {
      title: 'Стековая машина',
      difficulty: 'advanced',
      description: `
Напишите интерпретатор простой стековой машины. Программа машины — строки ввода, по одной команде в строке; команды нумеруются с 0. Машина выполняет команды по порядку, начиная с нулевой, и останавливается, когда номер текущей команды равен числу команд.

| Команда | Действие |
| --- | --- |
| \`push N\` | положить число N |
| \`pop\` | снять верхнее число |
| \`dup\` | положить копию верхнего числа |
| \`swap\` | поменять местами два верхних числа |
| \`add\`, \`sub\`, \`mul\`, \`div\` | снять \`b\`, затем \`a\` и положить \`a + b\`, \`a − b\`, \`a · b\` или \`a / b\` |
| \`print\` | снять верхнее число и напечатать его |
| \`jz L\` | снять верхнее число; если оно равно нулю, перейти к команде L |
| \`jmp L\` | перейти к команде L |

После остановки напечатайте \`стек: a b c\` (снизу вверх) или \`стек: пуст\`.

Ошибки прекращают работу машины — напечатайте сообщение и ничего больше:
- \`ошибка: стек пуст в команде K\` — не хватает чисел;
- \`ошибка: переполнение стека в команде K\` — в стеке уже 100 чисел;
- \`ошибка: деление на ноль в команде K\`;
- \`ошибка: превышен лимит шагов\` — выполнено 10 000 команд, а машина не остановилась.

Каждую команду обрабатывает своя функция; выбор функции по имени — через таблицу \`{ имя, есть ли аргумент, функция }\`.`,
      constraints: [
        'Команд не больше 100; числа и все результаты по модулю не больше 10¹⁵.',
        'Метки переходов L — от 0 до числа команд включительно; имена команд корректны.',
      ],
      hints: [
        'Состояние машины — структура { long long stack[100]; int size; int pc; }. Обработчик: typedef int Handler(struct Machine *m, long long arg); возвращает 0 при успехе или код ошибки.',
        'Сначала разберите программу: для каждой строки найдите обработчик в таблице и сохраните указатель и аргумент. Тогда цикл выполнения — while (pc < count): handler = code[pc]; …',
        'Переходы удобно делать так: перед вызовом обработчика pc увеличивается на 1, а jz и jmp при переходе записывают в m->pc новое значение.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

enum { OK, EMPTY, OVERFLOW, DIV_ZERO };

struct Machine {
    long long stack[100];
    int size;
    int pc;
};

typedef int Handler(struct Machine *m, long long arg);

static int push_value(struct Machine *m, long long value) {
    if (m->size == 100) {
        return OVERFLOW;
    }
    m->stack[m->size++] = value;
    return OK;
}

static int pop_value(struct Machine *m, long long *out) {
    if (m->size == 0) {
        return EMPTY;
    }
    *out = m->stack[--m->size];
    return OK;
}

static int pop_two(struct Machine *m, long long *a, long long *b) {
    if (m->size < 2) {
        return EMPTY;
    }
    *b = m->stack[--m->size];
    *a = m->stack[--m->size];
    return OK;
}

static int do_push(struct Machine *m, long long arg) {
    return push_value(m, arg);
}

static int do_pop(struct Machine *m, long long arg) {
    (void)arg;
    long long ignored;
    return pop_value(m, &ignored);
}

static int do_dup(struct Machine *m, long long arg) {
    (void)arg;
    if (m->size == 0) {
        return EMPTY;
    }
    return push_value(m, m->stack[m->size - 1]);
}

static int do_swap(struct Machine *m, long long arg) {
    (void)arg;
    long long a, b;
    if (pop_two(m, &a, &b) != OK) {
        return EMPTY;
    }
    m->stack[m->size++] = b;
    m->stack[m->size++] = a;
    return OK;
}

static int do_arith(struct Machine *m, char op) {
    long long a, b;
    if (pop_two(m, &a, &b) != OK) {
        return EMPTY;
    }
    if (op == '/' && b == 0) {
        return DIV_ZERO;
    }
    long long r = op == '+' ? a + b : op == '-' ? a - b : op == '*' ? a * b : a / b;
    return push_value(m, r);
}

static int do_add(struct Machine *m, long long arg) { (void)arg; return do_arith(m, '+'); }
static int do_sub(struct Machine *m, long long arg) { (void)arg; return do_arith(m, '-'); }
static int do_mul(struct Machine *m, long long arg) { (void)arg; return do_arith(m, '*'); }
static int do_div(struct Machine *m, long long arg) { (void)arg; return do_arith(m, '/'); }

static int do_print(struct Machine *m, long long arg) {
    (void)arg;
    long long value;
    if (pop_value(m, &value) != OK) {
        return EMPTY;
    }
    printf("%lld\n", value);
    return OK;
}

static int do_jz(struct Machine *m, long long arg) {
    long long value;
    if (pop_value(m, &value) != OK) {
        return EMPTY;
    }
    if (value == 0) {
        m->pc = (int)arg;
    }
    return OK;
}

static int do_jmp(struct Machine *m, long long arg) {
    m->pc = (int)arg;
    return OK;
}

static const struct {
    const char *name;
    int has_arg;
    Handler *run;
} COMMANDS[] = {
    {"push", 1, do_push}, {"pop", 0, do_pop},   {"dup", 0, do_dup},     {"swap", 0, do_swap},
    {"add", 0, do_add},   {"sub", 0, do_sub},   {"mul", 0, do_mul},     {"div", 0, do_div},
    {"print", 0, do_print}, {"jz", 1, do_jz},   {"jmp", 1, do_jmp},
};

int main(void) {
    Handler *code[100];
    long long args[100];
    int count = 0;
    char line[64];
    while (count < 100 && fgets(line, sizeof line, stdin) != NULL) {
        char name[16];
        long long arg = 0;
        if (sscanf(line, "%15s %lld", name, &arg) < 1) {
            continue;
        }
        for (size_t i = 0; i < sizeof COMMANDS / sizeof COMMANDS[0]; i++) {
            if (strcmp(COMMANDS[i].name, name) == 0) {
                code[count] = COMMANDS[i].run;
                args[count] = COMMANDS[i].has_arg ? arg : 0;
                count++;
                break;
            }
        }
    }
    static const char *const MESSAGES[] = {"", "стек пуст", "переполнение стека", "деление на ноль"};
    struct Machine m = {{0}, 0, 0};
    int steps = 0;
    while (m.pc < count) {
        if (steps++ == 10000) {
            printf("ошибка: превышен лимит шагов\n");
            return 0;
        }
        int current = m.pc;
        m.pc++;
        int status = code[current](&m, args[current]);
        if (status != OK) {
            printf("ошибка: %s в команде %d\n", MESSAGES[status], current);
            return 0;
        }
    }
    if (m.size == 0) {
        printf("стек: пуст\n");
    } else {
        printf("стек:");
        for (int i = 0; i < m.size; i++) {
            printf(" %lld", m.stack[i]);
        }
        printf("\n");
    }
    return 0;
}`,
      explanation: `
Интерпретатор — классическое применение таблицы функций. Разбор программы превращает каждую строку в пару «указатель на обработчик + аргумент», и цикл выполнения становится тривиальным: взять текущую команду и вызвать её обработчик. Новую команду — например, \`mod\` или \`over\` — добавляют функцией и строкой таблицы, не трогая цикл.

Общий тип \`Handler\` заставляет все обработчики принимать аргумент, даже если он им не нужен; \`(void)arg;\` сообщает компилятору, что это осознанно, и убирает предупреждение о неиспользуемом параметре. Обработчики сообщают об ошибках кодом возврата, а текст сообщения выбирается по коду из таблицы — тоже данные вместо ветвлений.

Счётчик команд увеличивается **до** вызова обработчика, поэтому переходы просто записывают новое значение в \`m->pc\`. Лимит шагов защищает от бесконечного цикла — без него программа машины \`jmp 0\` никогда бы не завершилась.`,
      examples: [
        {
          in: 'push 3\ndup\nprint\npush 1\nsub\ndup\njz 8\njmp 1\npop\n',
          out: '3\n2\n1\nстек: пуст\n',
          why: 'Обратный отсчёт с циклом.',
        },
        { in: 'push 2\npush 5\nswap\nsub\npush 10\nadd\n', out: 'стек: 13\n' },
      ],
      hidden: [
        { in: 'push 1\nadd\n', name: 'Стек пуст' },
        { in: 'push 7\npush 0\ndiv\n', name: 'Деление на ноль' },
        { in: 'jmp 0\n', name: 'Бесконечный цикл' },
        { in: 'push 1\npush 2\npush 3\n', name: 'Несколько чисел в конце' },
        { in: 'push -7\npush 2\ndiv\nprint\n', name: 'Отрицательное деление' },
        {
          in: 'push 1\ndup\nprint\npush 2\nmul\ndup\npush 64\nsub\njz 10\njmp 1\nprint\n',
          name: 'Удвоение в цикле',
        },
        { in: 'pop\n', name: 'pop на пустом стеке' },
        { in: 'push 0\njz 3\npush 99\npush 1\n', name: 'Переход вперёд' },
        { in: 'push 1\ndup\njmp 1\n', name: 'Переполнение стека' },
        { in: 'push 1000000\ndup\nmul\npush 1000\nmul\nprint\n', name: 'Большое произведение' },
      ],
    },
  ],
};
