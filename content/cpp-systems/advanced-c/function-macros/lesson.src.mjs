const SHOW_MAIN = String.raw`
int main(void) {
    int a, b;
    while (scanf("%d %d", &a, &b) == 2) {
        SHOW(a + b);
        SHOW(a * b - 1);
        SHOW((a > b) ? a : b);
        SHOW(a % 3);
        SHOW(a   ==   b);
        puts("---");
    }
    return 0;
}`;

const SORT = (fixed) => String.raw`
#include <stdio.h>

${
  fixed
    ? '#define SWAP(a, b)      \\\n    do {                \\\n        int tmp = (a);  \\\n        (a) = (b);      \\\n        (b) = tmp;      \\\n    } while (0)'
    : '#define SWAP(a, b) tmp = (a); (a) = (b); (b) = tmp'
}

int main(void) {
    int n, v[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &v[i]) != 1) {
            return 0;
        }
    }
${fixed ? '' : '    int tmp;\n'}    for (int pass = 0; pass < n - 1; pass++) {
        for (int j = 0; j + 1 < n - pass; j++) {
            if (v[j] > v[j + 1])
                SWAP(v[j], v[j + 1]);
        }
    }
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", v[i]);
    }
    return 0;
}`;

const ERRORS_TOP = String.raw`
#include <stdio.h>
#include <string.h>

#define ERROR_LIST(X)                                \
    X(OK, 0, "успешно")                              \
    X(NOT_FOUND, 2, "файл не найден")                \
    X(ACCESS, 13, "нет доступа")                     \
    X(EXISTS, 17, "файл уже существует")             \
    X(INVALID, 22, "неверный аргумент")              \
    X(NO_SPACE, 28, "нет места на диске")            \
    X(TIMEOUT, 110, "превышено время ожидания")`;

const STACK_MAIN = String.raw`
DEFINE_STACK(int, IntStack)
DEFINE_STACK(double, DoubleStack)

int main(void) {
    IntStack ints = {{0}, 0};
    DoubleStack reals = {{0}, 0};
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "i") == 0) {
            int value;
            if (scanf("%d", &value) == 1 && !IntStack_push(&ints, value)) {
                puts("переполнение");
            }
        } else if (strcmp(command, "d") == 0) {
            double value;
            if (scanf("%lf", &value) == 1 && !DoubleStack_push(&reals, value)) {
                puts("переполнение");
            }
        } else if (strcmp(command, "pi") == 0) {
            int value;
            if (IntStack_pop(&ints, &value)) {
                printf("%d\n", value);
            } else {
                puts("пусто");
            }
        } else if (strcmp(command, "pd") == 0) {
            double value;
            if (DoubleStack_pop(&reals, &value)) {
                printf("%.2f\n", value);
            } else {
                puts("пусто");
            }
        } else if (strcmp(command, "s") == 0) {
            printf("int: %d, double: %d\n", IntStack_size(&ints), DoubleStack_size(&reals));
        }
    }
    return 0;
}`;

export default {
  id: 'advanced-function-macros',
  title: 'Макросы с параметрами',
  description:
    'Макросы с параметрами и правило скобок; разделение аргументов; оператор # и превращение аргумента в строку; оператор ## и создание имён; двухуровневые макросы для раскрытия аргумента; __VA_ARGS__ и трассировка с местом вызова; do { … } while (0); X-макросы; макрос или функция, ARRAY_SIZE.',
  moduleId: 'advanced-c',
  order: 9,
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  prerequisites: ['advanced-define'],
  objectives: [
    'Писать макросы с параметрами, правильно расставляя скобки',
    'Использовать операторы # и ## и понимать, когда аргумент раскрывается',
    'Оформлять макросы из нескольких инструкций через do { … } while (0)',
    'Применять X-макросы, чтобы держать связанные таблицы в одном месте',
  ],
  tags: ['Макросы', '#', '##', '__VA_ARGS__', 'X-макросы'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чем определение #define TWICE (x) ((x) * 2) отличается от #define TWICE(x) ((x) * 2)?',
      options: [
        'Из-за пробела перед скобкой первое — макрос без параметров с заменой «(x) ((x) * 2)»',
        'Ничем, пробел перед скобкой игнорируется',
        'Первое не компилируется',
        'Первое вычисляет аргумент один раз',
      ],
      correct: 0,
      explain:
        'Макрос с параметрами распознаётся, только если ( стоит сразу после имени в определении. При вызове пробел перед скобкой допустим.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define HALF(x) x / 2

int main(void) {
    printf("%d\n", HALF(10 + 6));
    return 0;
}`,
      answers: ['13'],
      placeholder: 'Вывод программы',
      explain: 'Подстановка даёт 10 + 6 / 2 = 10 + 3 = 13. С заменой ((x) / 2) было бы 8.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define TEXT(x) #x

int main(void) {
    puts(TEXT(price   *   count));
    return 0;
}`,
      answers: ['price * count'],
      placeholder: 'Вывод программы',
      explain:
        'Оператор # превращает аргумент в строковый литерал; группы пробелов между токенами сжимаются до одного.',
    },
    {
      q: 'Что делает оператор ## в определении #define FIELD(n) value_##n?',
      options: [
        'Склеивает токены: FIELD(max) даёт один идентификатор value_max',
        'Превращает аргумент в строку',
        'Вычисляет аргумент дважды',
        'Комментирует остаток строки',
      ],
      correct: 0,
      explain:
        '## соединяет два токена в один. Так макрос может создавать имена функций и переменных.',
    },
    {
      q: 'Зачем тело макроса из нескольких инструкций оборачивают в do { … } while (0)?',
      options: [
        'Чтобы вызов вёл себя как одна инструкция и корректно работал в if/else без фигурных скобок',
        'Чтобы инструкции выполнились дважды',
        'Чтобы ускорить выполнение',
        'Это требование стандарта для любых макросов',
      ],
      correct: 0,
      explain:
        'Голый блок { … } с точкой с запятой после вызова ломает if/else, а последовательность инструкций без блока попадает под if лишь частично. do-while(0) — одна инструкция, которой нужна точка с запятой.',
    },
    {
      q: 'Что вернёт ARRAY_SIZE(values) внутри функции void f(int values[10]), если #define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))?',
      options: ['sizeof(int *) / sizeof(int) — обычно 2, а не 10', '10', 'Ошибку компиляции', '0'],
      correct: 0,
      explain:
        'Параметр-массив на деле указатель, и sizeof даёт размер указателя. ARRAY_SIZE работает только для настоящих массивов в области их объявления.',
    },
    {
      q: 'Что из этого может сделать макрос, но не функция? Выберите все.',
      options: [
        'Напечатать текст выражения, переданного аргументом',
        'Подставить номер строки, где его вызвали',
        'Создать имя функции из своего аргумента',
        'Проверить, что аргумент имеет тип int',
      ],
      correct: [0, 1, 2],
      explain:
        '#, ## и __LINE__ в месте подстановки доступны только препроцессору. Проверку типов, наоборот, делает компилятор для функций.',
    },
    {
      q: 'Что напечатает puts(STR(__LINE__)); если #define STR(x) #x?',
      answers: ['__LINE__'],
      placeholder: 'Вывод',
      explain:
        'Аргумент рядом с # не раскрывается заранее, поэтому в строку попадает сам токен __LINE__. Чтобы получить номер, нужен промежуточный макрос XSTR(x) STR(x).',
    },
  ],
  exercises: [
    {
      title: 'Отладочная печать',
      difficulty: 'beginner',
      description: `
В заготовке функция \`main\` читает пары целых \`a b\` до конца ввода и для каждой вызывает макрос \`SHOW\` с разными выражениями. Напишите макрос \`SHOW(expr)\`: он печатает **текст** выражения, затем \` = \` и значение выражения (типа \`int\`) и перевод строки.

Например, для пары \`3 4\` вызов \`SHOW(a + b);\` печатает \`a + b = 7\`. Функцию \`main\` не меняйте.`,
      constraints: ['−1000 ≤ a, b ≤ 1000; пар не больше 10.'],
      hints: [
        'Текст аргумента даёт оператор #: #expr превращается в строковый литерал.',
        'Передайте текст отдельным аргументом: printf("%s = %d\\n", #expr, (expr)). Если приклеить #expr к формату, выражение a % 3 станет частью формата, и printf прочтёт % как спецификатор.',
      ],
      starter: String.raw`
#include <stdio.h>

// Напишите макрос SHOW(expr).
${SHOW_MAIN}`,
      solution: String.raw`
#include <stdio.h>

#define SHOW(expr) printf("%s = %d\n", #expr, (expr))
${SHOW_MAIN}`,
      explanation: `
Оператор \`#\` превращает аргумент в строковый литерал: \`SHOW(a * b - 1)\` даёт \`"a * b - 1"\`. Пробелы внутри аргумента нормализуются: \`a   ==   b\` превращается в \`a == b\` — препроцессор записывает токены через одиночные пробелы.

Текст выражения печатается через \`%s\`, а не приклеивается к строке формата. Вызов \`SHOW(a % 3)\` в заготовке стоит не случайно: при склейке формат стал бы \`"a % 3 = %d\\n"\`, и \`printf\` попытался бы прочесть \`% 3\` как спецификатор. Строка формата должна быть под вашим контролем — всё, что пришло извне, передаётся аргументами.

Второе вхождение \`expr\` взято в скобки. Здесь это не обязательно, но привычка ставить скобки вокруг каждого параметра избавляет от ошибок в других макросах.`,
      examples: [
        {
          in: '3 4\n',
          out: 'a + b = 7\na * b - 1 = 11\n(a > b) ? a : b = 4\na % 3 = 0\na == b = 0\n---\n',
        },
        {
          in: '5 5\n',
          out: 'a + b = 10\na * b - 1 = 24\n(a > b) ? a : b = 5\na % 3 = 2\na == b = 1\n---\n',
        },
      ],
      hidden: [
        '0 0\n',
        '-7 2\n',
        '1000 -1000\n',
        '10 3\n3 10\n',
        '-1 -1\n',
        '999 1\n',
        '2 7\n8 8\n-3 3\n',
        '-1000 -999\n',
      ],
    },
    {
      title: 'Найди ошибку: макрос обмена',
      bug: true,
      description: `
Программа читает \`n\` и \`n\` целых чисел и сортирует их пузырьком по неубыванию, а затем печатает через пробел. Обмен соседних элементов записан макросом \`SWAP\`.

Программа компилируется без ошибок, но печатает неправильный результат. Найдите причину в макросе и исправьте его так, чтобы \`SWAP(a, b);\` вёл себя как одна инструкция.`,
      constraints: ['1 ≤ n ≤ 100; числа — int.'],
      hints: [
        'Подставьте макрос вручную в строку if (v[j] > v[j + 1]) SWAP(v[j], v[j + 1]); — какие инструкции окажутся под условием?',
        'Оберните тело макроса в do { … } while (0) и объявите временную переменную внутри этого блока — тогда внешняя переменная tmp не нужна.',
      ],
      starter: SORT(false),
      solution: SORT(true),
      explanation: `
После подстановки строка превращается в

\`\`\`
if (v[j] > v[j + 1]) tmp = (v[j]); (v[j]) = (v[j + 1]); (v[j + 1]) = tmp;
\`\`\`

Под условие попадает только первая инструкция, а две другие выполняются **всегда**: на каждом шаге \`v[j]\` получает значение соседа, а сосед — старое \`tmp\`. Массив заполняется копиями, и сортировки не происходит.

Обёртка \`do { … } while (0)\` делает тело одной инструкцией, которая целиком попадает под \`if\`, а точка с запятой после вызова завершает её, как у функции. Временную переменную лучше объявить внутри блока макроса: так она не зависит от переменных вызывающего кода. Имя \`tmp\` внутри макроса всё же может столкнуться с аргументом \`tmp\` — эту опасность разберём в следующем уроке.`,
      examples: [
        { in: '5\n5 1 4 2 3\n', out: '1 2 3 4 5\n' },
        { in: '1\n42\n', out: '42\n' },
      ],
      hidden: [
        '2\n2 1\n',
        '3\n1 2 3\n',
        '4\n4 3 2 1\n',
        '6\n3 -1 3 0 -1 2\n',
        '5\n7 7 7 7 7\n',
        '8\n10 -10 20 -20 30 -30 0 5\n',
        '3\n2147483647 -2147483648 0\n',
        '10\n9 8 7 6 5 4 3 2 1 0\n',
      ],
    },
    {
      title: 'Коды ошибок',
      description: `
В заготовке — X-макрос \`ERROR_LIST\` со списком кодов ошибок: имя, номер и описание. Используя **только этот список** (не переписывая данные вручную), создайте:
- перечисление с константами \`ERR_ИМЯ = номер\`;
- функции поиска по имени и по номеру.

Программа обрабатывает команды до конца ввода:
- \`code ИМЯ\` — напечатать номер ошибки;
- \`name N\` — напечатать имя ошибки с номером \`N\`;
- \`text ИМЯ\` — напечатать описание;
- \`list\` — напечатать все ошибки в порядке списка строками \`номер ИМЯ: описание\`;
- \`count\` — напечатать число ошибок в списке.

Для неизвестного имени или номера напечатайте \`неизвестно\`.`,
      constraints: ['Команд не больше 50; имена — до 15 символов.'],
      hints: [
        'Для каждой формы данных напишите свой макрос-«применитель»: #define AS_ENUM(name, num, text) ERR_##name = num, и разверните ERROR_LIST(AS_ENUM) внутри enum.',
        'Таблицу записей удобно получить одной структурой: #define AS_ENTRY(name, num, text) {#name, num, text}, — оператор # превращает имя в строку.',
        'Число ошибок — sizeof table / sizeof table[0]. Тогда при добавлении строки в ERROR_LIST программа подстроится сама.',
      ],
      starter: `${ERRORS_TOP}

// Создайте из ERROR_LIST перечисление и таблицу, затем напишите main.

int main(void) {
    return 0;
}
`,
      solution: String.raw`${ERRORS_TOP}

#define AS_ENUM(name, num, text) ERR_##name = num,
#define AS_ENTRY(name, num, text) {#name, num, text},

enum ErrorCode { ERROR_LIST(AS_ENUM) };

typedef struct {
    const char *name;
    int code;
    const char *text;
} ErrorInfo;

static const ErrorInfo errors[] = { ERROR_LIST(AS_ENTRY) };
static const int error_count = sizeof errors / sizeof errors[0];

static const ErrorInfo *by_name(const char *name) {
    for (int i = 0; i < error_count; i++) {
        if (strcmp(errors[i].name, name) == 0) {
            return &errors[i];
        }
    }
    return NULL;
}

static const ErrorInfo *by_code(int code) {
    for (int i = 0; i < error_count; i++) {
        if (errors[i].code == code) {
            return &errors[i];
        }
    }
    return NULL;
}

int main(void) {
    char command[16], name[32];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "code") == 0 && scanf("%31s", name) == 1) {
            const ErrorInfo *e = by_name(name);
            if (e != NULL) {
                printf("%d\n", e->code);
            } else {
                puts("неизвестно");
            }
        } else if (strcmp(command, "name") == 0) {
            int code;
            if (scanf("%d", &code) != 1) {
                break;
            }
            const ErrorInfo *e = by_code(code);
            puts(e != NULL ? e->name : "неизвестно");
        } else if (strcmp(command, "text") == 0 && scanf("%31s", name) == 1) {
            const ErrorInfo *e = by_name(name);
            puts(e != NULL ? e->text : "неизвестно");
        } else if (strcmp(command, "list") == 0) {
            for (int i = 0; i < error_count; i++) {
                printf("%d %s: %s\n", errors[i].code, errors[i].name, errors[i].text);
            }
        } else if (strcmp(command, "count") == 0) {
            printf("%d\n", error_count);
        }
    }
    return ERR_OK;
}`,
      explanation: `
X-макрос \`ERROR_LIST(X)\` — это таблица, которую можно «прочитать» разными способами, подставляя разные \`X\`. С \`AS_ENUM\` получаются константы \`ERR_OK = 0, ERR_NOT_FOUND = 2, …\`, с \`AS_ENTRY\` — инициализаторы структур, где \`#name\` превращает имя в строку \`"NOT_FOUND"\`. Данные записаны один раз, поэтому перечисление и таблица не могут разойтись.

Число записей вычисляется через \`sizeof\`, а не задаётся вручную: добавьте в \`ERROR_LIST\` строку \`X(BUSY, 16, "устройство занято")\` — и новая ошибка появится и в \`enum\`, и в поиске, и в \`list\`, и в \`count\`. Так устроены таблицы кодов во многих системных программах: от описания ошибок до списков команд и опкодов.`,
      examples: [
        { in: 'code NOT_FOUND\nname 13\ntext EXISTS\n', out: '2\nACCESS\nфайл уже существует\n' },
        { in: 'count\ncode MISSING\nname 5\n', out: '7\nнеизвестно\nнеизвестно\n' },
      ],
      hidden: [
        { in: 'list\n', name: 'Вся таблица' },
        { in: 'code OK\nname 0\ntext OK\n', name: 'Нулевой код' },
        { in: 'name 110\ntext TIMEOUT\n', name: 'Последняя запись' },
        { in: 'code ok\n', name: 'Регистр имени' },
        { in: 'text NO_SPACE\ncode NO_SPACE\nname 28\n', name: 'Имя с подчёркиванием' },
        { in: 'name -1\nname 22\n', name: 'Отрицательный номер' },
        { in: 'count\nlist\ncount\n', name: 'Несколько команд' },
        { in: 'text INVALID\ncode ACCESS\nname 17\nname 2\n', name: 'Смешанные запросы' },
      ],
    },
    {
      title: 'Стек для любого типа',
      difficulty: 'advanced',
      description: `
Напишите макрос \`DEFINE_STACK(T, NAME)\`, который создаёт стек фиксированной вместимости 5 для элементов типа \`T\`:
- тип \`NAME\` — структура с массивом \`items\` из 5 элементов \`T\` и полем \`int size\`;
- \`int NAME_push(NAME *s, T value)\` — кладёт значение и возвращает 1, при заполненном стеке возвращает 0;
- \`int NAME_pop(NAME *s, T *out)\` — снимает верхнее значение и возвращает 1, на пустом стеке возвращает 0;
- \`int NAME_size(const NAME *s)\` — число элементов.

Здесь \`NAME_push\` означает имя, склеенное из \`NAME\` и \`_push\`: для \`DEFINE_STACK(int, IntStack)\` получаются \`IntStack_push\`, \`IntStack_pop\`, \`IntStack_size\`.

Функция \`main\` в заготовке создаёт два стека — \`IntStack\` и \`DoubleStack\` — и обрабатывает команды: \`i x\` и \`d x\` кладут число, \`pi\` и \`pd\` снимают и печатают, \`s\` печатает размеры. Её не меняйте.`,
      constraints: ['Команд не больше 100.'],
      hints: [
        'Определение займёт несколько строк: заканчивайте каждую обратной косой чертой. Первая часть — typedef struct { T items[5]; int size; } NAME;.',
        'Имена функций склеиваются оператором ##: static int NAME##_push(NAME *s, T value) { … }.',
        'Объявите функции static: каждое разворачивание макроса создаёт свой набор функций только для этого файла.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

// Напишите макрос DEFINE_STACK(T, NAME).
${STACK_MAIN}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define DEFINE_STACK(T, NAME)                              \
    typedef struct {                                       \
        T items[5];                                        \
        int size;                                          \
    } NAME;                                                \
                                                           \
    static int NAME##_push(NAME *s, T value) {             \
        if (s->size == 5) {                                \
            return 0;                                      \
        }                                                  \
        s->items[s->size++] = value;                       \
        return 1;                                          \
    }                                                      \
                                                           \
    static int NAME##_pop(NAME *s, T *out) {               \
        if (s->size == 0) {                                \
            return 0;                                      \
        }                                                  \
        *out = s->items[--s->size];                        \
        return 1;                                          \
    }                                                      \
                                                           \
    static int NAME##_size(const NAME *s) {                \
        return s->size;                                    \
    }
${STACK_MAIN}`,
      explanation: `
Один макрос порождает целое семейство: тип и три функции для каждого разворачивания. Оператор \`##\` склеивает имя типа с суффиксом, поэтому функции разных стеков не конфликтуют, а компилятор проверяет типы: в \`IntStack_push\` нельзя положить указатель, а \`DoubleStack_pop\` пишет именно в \`double\`.

Это ручной вариант того, что C++ делает шаблонами. Цена — неудобная отладка: все функции «живут» в одной строке \`DEFINE_STACK(int, IntStack)\`, и сообщение об ошибке внутри макроса указывает на неё. Поэтому тело таких макросов держат простым, а сложную логику выносят в обычные функции.

Функции объявлены \`static\`: если разворачивать макрос в заголовке, каждый файл получит собственные копии без конфликтов при линковке.`,
      examples: [
        { in: 'i 1\ni 2\nd 3.5\npi\npd\ns\n', out: '2\n3.50\nint: 1, double: 0\n' },
        { in: 'pi\npd\ns\n', out: 'пусто\nпусто\nint: 0, double: 0\n' },
      ],
      hidden: [
        { in: 'i 1\ni 2\ni 3\ni 4\ni 5\ni 6\ns\n', name: 'Переполнение' },
        { in: 'd 1.25\nd -2.5\npd\npd\npd\n', name: 'Порядок снятия' },
        { in: 'i 7\nd 7\npi\npd\n', name: 'Стеки независимы' },
        { in: 'd 0.004\nd 0.005\npd\npd\n', name: 'Округление' },
        {
          in: 'i 1\ni 2\ni 3\ni 4\ni 5\npi\ni 6\npi\npi\npi\npi\npi\npi\n',
          name: 'Заполнить, снять и снова положить',
        },
        { in: 'd 1\nd 2\nd 3\nd 4\nd 5\nd 6\ns\npd\n', name: 'Переполнение double' },
        { in: 'i -2147483648\npi\n', name: 'Минимальный int' },
        { in: 's\ni 9\ns\npi\ns\n', name: 'Размер по шагам' },
      ],
    },
  ],
};
