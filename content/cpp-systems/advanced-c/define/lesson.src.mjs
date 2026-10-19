const BUFFER = (fixed) => {
  const cap = fixed ? 'BUFFER_CAPACITY' : 'size';
  return String.raw`
#include <stdio.h>
#include <string.h>

#define ${cap} 32

struct Buffer {
    char data[${cap}];
    int size;                   // сколько символов занято
};

int buffer_append(struct Buffer *b, const char *word) {
    int len = (int)strlen(word);
    int extra = b->size > 0 ? 1 : 0;        // пробел перед словом
    if (b->size + extra + len >= ${cap}) {
        return 0;
    }
    if (extra) {
        b->data[b->size++] = ' ';
    }
    memcpy(b->data + b->size, word, (size_t)len + 1);
    b->size += len;
    return 1;
}

int main(void) {
    struct Buffer b = {"", 0};
    char word[64];
    int skipped = 0;
    while (scanf("%63s", word) == 1) {
        if (!buffer_append(&b, word)) {
            skipped++;
        }
    }
    printf("буфер: \"%s\"\n", b.data);
    printf("длина: %d\n", b.size);
    printf("не поместилось: %d\n", skipped);
    return 0;
}`;
};

export default {
  id: 'advanced-define',
  title: '#define: как раскрываются макросы',
  description:
    'Макрос как последовательность токенов; повторный просмотр подстановки и порядок определений; защита от самоподстановки; время жизни макроса и #undef; переопределение; макросы игнорируют области видимости; пустые макросы-флаги и пометки; -D и значения по умолчанию; склейка строковых макросов; когда #define нужен.',
  moduleId: 'advanced-c',
  order: 8,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['advanced-preprocessor'],
  objectives: [
    'Предсказывать результат раскрытия макросов с учётом повторного просмотра и самоподстановки',
    'Управлять временем жизни макроса с помощью #undef и избегать переопределений',
    'Объяснять, почему имена макросов пишут заглавными буквами',
    'Выбирать между #define, enum и const',
  ],
  tags: ['#define', '#undef', 'Макрос', 'Препроцессор', '-D'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define TOTAL (PRICE * COUNT)
#define PRICE 25
#define COUNT 4

int main(void) {
    printf("%d\n", TOTAL);
    return 0;
}`,
      answers: ['100'],
      placeholder: 'Вывод программы',
      explain:
        'TOTAL раскрывается в момент использования, когда PRICE и COUNT уже определены. При определении TOTAL препроцессор лишь запомнил токены.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int n = 3;
#define n (n + 1)

int main(void) {
    printf("%d\n", n * 2);
    return 0;
}`,
      answers: ['8'],
      placeholder: 'Вывод программы',
      explain:
        'n раскрывается в (n + 1), а внутри собственной подстановки макрос не раскрывается — там остаётся переменная со значением 3. Получается (3 + 1) * 2 = 8.',
    },
    {
      q: 'Какое значение получит LIMIT в строках после этих директив?',
      code: String.raw`
#define LIMIT 10
#define LIMIT 20`,
      lang: 'c',
      options: [
        '20, а GCC выдаст предупреждение "LIMIT" redefined',
        '10: первое определение побеждает',
        'Ошибка компиляции, сборка остановится',
        '30: определения складываются',
      ],
      correct: 0,
      explain:
        'Переопределение с другой заменой — нарушение правил, о котором компилятор обязан сообщить. GCC сообщает предупреждением и дальше использует последнее определение.',
    },
    {
      q: 'Что делает директива #undef DEBUG?',
      options: [
        'Удаляет макрос DEBUG: ниже он не определён',
        'Определяет DEBUG со значением 0',
        'Запрещает определять DEBUG до конца файла',
        'Удаляет все строки, где встречается DEBUG',
      ],
      correct: 0,
      explain:
        'После #undef имя перестаёт быть макросом; его можно определить заново. Удаление неопределённого макроса — не ошибка.',
    },
    {
      q: 'Какой директиве равносилен флаг компилятора -DSIZE=64?',
      answers: ['#define SIZE 64'],
      placeholder: 'Директива',
      explain:
        '-D определяет макрос так, будто директива стоит в самом начале файла. -DNAME без значения равносилен #define NAME 1.',
    },
    {
      q: 'В файле определён макрос #define count 0, а ниже объявлена структура с полем int count;. Что произойдёт?',
      options: [
        'Ошибка компиляции: поле превратится в int 0;',
        'Ничего: макросы не действуют внутри структур',
        'Поле получит начальное значение 0',
        'Предупреждение о затенении имени',
      ],
      correct: 0,
      explain:
        'Препроцессор не знает о структурах и заменяет идентификатор count везде. Поэтому имена макросов пишут заглавными буквами.',
    },
    {
      q: 'В каких случаях нельзя заменить #define на enum или const? Выберите все.',
      options: [
        'Значение проверяется в директиве #if',
        'Значение задаётся при сборке флагом -D',
        'Строку нужно склеить с другими литералами: "v" VERSION',
        'Нужна проверка типа значения компилятором',
      ],
      correct: [0, 1, 2],
      explain:
        'Препроцессор не знает enum и const, а склеиваются только литералы. Проверку типа, наоборот, дают enum и const, а не макрос.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define EMPTY

int main(void) {
    EMPTY int x = EMPTY 5 EMPTY;
    printf("%d\n", x EMPTY);
    return 0;
}`,
      answers: ['5'],
      placeholder: 'Вывод программы',
      explain:
        'Пустой макрос раскрывается в ничто: после препроцессора остаются int x = 5; и printf("%d\\n", x);.',
    },
  ],
  exercises: [
    {
      title: 'Таблица макросов',
      difficulty: 'beginner',
      description: `
Смоделируйте таблицу макросов препроцессора. Каждая строка ввода — одна из команд:
- \`#define ИМЯ замена\` — определить макрос; замена может быть пустой. Если макрос уже определён с **другой** заменой, напечатайте \`предупреждение: ИМЯ переопределён\` и замените значение; если с такой же — ничего не делайте;
- \`#undef ИМЯ\` — удалить макрос (удаление неопределённого — не ошибка);
- \`? ИМЯ\` — напечатать \`ИМЯ = замена\`, \`ИМЯ = (пусто)\` для пустой замены или \`ИМЯ не определён\`;
- \`list\` — напечатать имена всех определённых макросов через пробел в порядке \`strcmp\` или \`(нет макросов)\`.

Замены сравниваются и печатаются нормализованными: без пробелов в начале и в конце, каждая группа пробелов внутри — один пробел.`,
      constraints: [
        'Строк не больше 100; имена — до 31 символа; замены — до 100 символов.',
        'Одновременно определено не больше 50 макросов.',
      ],
      hints: [
        'Храните макросы в массиве структур { char name[32]; char value[128]; int used; } и ищите по имени линейно.',
        'Нормализацию сделайте отдельной функцией squeeze(src, dst): копирует символы, сжимая группы пробелов и отбрасывая их по краям.',
        'Для list скопируйте указатели на имена в массив, отсортируйте qsort со strcmp и напечатайте.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[32];
    char value[128];
    int used;
} Macro;

static Macro macros[50];

static void squeeze(const char *src, char *dst) {
    int n = 0, gap = 0;
    for (; *src != '\0' && *src != '\n'; src++) {
        if (*src == ' ' || *src == '\t') {
            gap = n > 0;
            continue;
        }
        if (gap) {
            dst[n++] = ' ';
            gap = 0;
        }
        dst[n++] = *src;
    }
    dst[n] = '\0';
}

static Macro *find(const char *name) {
    for (int i = 0; i < 50; i++) {
        if (macros[i].used && strcmp(macros[i].name, name) == 0) {
            return &macros[i];
        }
    }
    return NULL;
}

static int by_name(const void *a, const void *b) {
    return strcmp(*(const char *const *)a, *(const char *const *)b);
}

int main(void) {
    char line[256];
    while (fgets(line, sizeof line, stdin) != NULL) {
        char command[16], name[32];
        int offset = 0;
        if (sscanf(line, "%15s %31s%n", command, name, &offset) < 1) {
            continue;
        }
        if (strcmp(command, "#define") == 0) {
            char value[128];
            squeeze(line + offset, value);
            Macro *m = find(name);
            if (m != NULL) {
                if (strcmp(m->value, value) != 0) {
                    printf("предупреждение: %s переопределён\n", name);
                    strcpy(m->value, value);
                }
                continue;
            }
            for (int i = 0; i < 50; i++) {
                if (!macros[i].used) {
                    macros[i].used = 1;
                    strcpy(macros[i].name, name);
                    strcpy(macros[i].value, value);
                    break;
                }
            }
        } else if (strcmp(command, "#undef") == 0) {
            Macro *m = find(name);
            if (m != NULL) {
                m->used = 0;
            }
        } else if (strcmp(command, "?") == 0) {
            Macro *m = find(name);
            if (m == NULL) {
                printf("%s не определён\n", name);
            } else {
                printf("%s = %s\n", name, m->value[0] ? m->value : "(пусто)");
            }
        } else if (strcmp(command, "list") == 0) {
            const char *names[50];
            int count = 0;
            for (int i = 0; i < 50; i++) {
                if (macros[i].used) {
                    names[count++] = macros[i].name;
                }
            }
            if (count == 0) {
                printf("(нет макросов)\n");
                continue;
            }
            qsort(names, (size_t)count, sizeof names[0], by_name);
            for (int i = 0; i < count; i++) {
                printf(i + 1 < count ? "%s " : "%s\n", names[i]);
            }
        }
    }
    return 0;
}`,
      explanation: `
Таблица моделирует то, что препроцессор хранит во время обработки файла: имя и последовательность токенов замены. Сравнение после нормализации пробелов повторяет правило стандарта: определения считаются одинаковыми, если совпадают токены и наличие пробелов между ними, а количество пробелов значения не имеет. Поэтому \`#define N  10\` после \`#define N 10\` — не переопределение.

Формат \`%n\` в \`sscanf\` записывает, сколько символов уже прочитано: всё после имени — это замена, её не нужно разбирать на слова. После \`#undef\` ячейка освобождается и может быть занята следующим макросом — порядок в таблице не важен, потому что \`list\` сортирует имена.`,
      examples: [
        {
          in: '#define N 10\n? N\n#define N  10\n#define N 20\n? N\n',
          out: 'N = 10\nпредупреждение: N переопределён\nN = 20\n',
          why: 'Второе определение совпадает с первым после нормализации пробелов.',
        },
        {
          in: '#define DEBUG\n? DEBUG\n#undef DEBUG\n? DEBUG\nlist\n',
          out: 'DEBUG = (пусто)\nDEBUG не определён\n(нет макросов)\n',
        },
      ],
      hidden: [
        { in: '#define B 2\n#define A 1\n#define C 3\nlist\n', name: 'Сортировка' },
        { in: '#undef GHOST\n? GHOST\n', name: 'Удаление неопределённого' },
        { in: '#define X (1 + 2)\n#define X (1+2)\n? X\n', name: 'Пробелы между токенами важны' },
        { in: '#define AREA   (W  *   H)   \n? AREA\n', name: 'Нормализация' },
        { in: '#define V 1\n#undef V\n#define V 2\n? V\n', name: 'Переопределение после undef' },
        { in: '#define F\n#define F 1\n? F\n', name: 'Пустое и непустое' },
        {
          in: '#define a 1\n#define B 2\n#define _c 3\nlist\n#undef B\nlist\n',
          name: 'Регистр и подчёркивание',
        },
        {
          in: '#define MSG "hello   world"\n? MSG\n',
          name: 'Пробелы в строке',
        },
      ],
    },
    {
      title: 'Найди ошибку: макрос и поле структуры',
      bug: true,
      description: `
Программа читает слова до конца ввода и собирает их в буфер на 32 байта через одиночные пробелы. Слово, которое не помещается (вместе с пробелом и завершающим нулём), пропускается. В конце программа печатает содержимое буфера в кавычках, длину и число пропущенных слов.

Программа не компилируется, а сообщения компилятора указывают на поле структуры и на обращения к нему. Найдите настоящую причину и исправьте её так, как требует соглашение об именах.`,
      constraints: ['Слова — до 63 символов без пробелов, слов не больше 30.'],
      hints: [
        'Посмотрите, во что препроцессор превращает строку int size; внутри структуры.',
        'Макрос с именем обычного идентификатора заменяет и поле size, и все обращения b->size. Переименуйте макрос заглавными буквами, например BUFFER_CAPACITY.',
      ],
      starter: BUFFER(false),
      solution: BUFFER(true),
      explanation: `
Макрос \`size\` заменяет **каждый** идентификатор \`size\` в файле: поле структуры превращается в \`int 32;\`, а обращения \`b->size\` — в \`b->32\`. Компилятор видит уже результат подстановки и сообщает об ошибках там, где стоят эти строки, хотя причина — в директиве \`#define\` выше.

Исправление по соглашению — дать макросу заглавное имя \`BUFFER_CAPACITY\`. Переименовать поле тоже можно, но тогда ловушка останется для следующего, кто назовёт что-нибудь \`size\`. Заглавные имена только для макросов исключают такие столкновения целиком.`,
      examples: [
        {
          in: 'мама мыла раму\n',
          out: 'буфер: "мама мыла раму"\nдлина: 26\nне поместилось: 0\n',
          why: 'Русская буква в UTF-8 занимает два байта.',
        },
        {
          in: 'alpha beta gamma delta epsilon zeta\n',
          out: 'буфер: "alpha beta gamma delta epsilon"\nдлина: 30\nне поместилось: 1\n',
        },
      ],
      hidden: [
        'one\n',
        'abcdefghijklmnopqrstuvwxyz01234\n',
        'abcdefghijklmnopqrstuvwxyz012345\nok\n',
        'a b c d e f g h i j k l m n o p q\n',
        'longwordlongwordlongwordlongword x\n',
        'hello world\n',
        'aaaaaaaaaa bbbbbbbbbb cccccccccc d\n',
        'x\n',
      ],
    },
    {
      title: 'Подстановка и приоритет',
      difficulty: 'advanced',
      description: `
Покажите, чем опасен макрос без скобок. В первой строке — число макросов \`m\`, далее \`m\` строк \`ИМЯ выражение\`. Затем число запросов \`q\` и \`q\` строк-выражений.

Выражения состоят из неотрицательных целых чисел, имён макросов, знаков \`+ - * /\` и круглых скобок; пробелы между токенами могут быть или отсутствовать. Каждое имя в выражениях — один из макросов; макросы не ссылаются сами на себя ни прямо, ни через другие.

Для каждого запроса вычислите значение двумя способами и напечатайте \`без скобок: A, со скобками: B\`:
- **A** — как препроцессор и компилятор: каждое имя заменяется токенами его выражения (с повторной подстановкой), затем результат вычисляется по обычным приоритетам;
- **B** — как если бы замена каждого макроса была взята в скобки.

Деление целочисленное, с отбрасыванием дробной части, как в C. Если при вычислении встретилось деление на ноль, вместо числа напечатайте \`деление на ноль\`.`,
      constraints: [
        '1 ≤ m ≤ 20, 1 ≤ q ≤ 20; выражения — до 100 символов.',
        'После полной подстановки не больше 5000 токенов; все промежуточные значения по модулю не больше 10¹⁵.',
      ],
      hints: [
        'Разбейте каждое выражение на токены (число, имя, знак, скобка) и храните токены макросов. Подстановку сделайте рекурсивной функцией expand(токены, со_скобками, результат).',
        'Для способа B перед подстановкой токенов макроса добавьте "(", а после — ")". После подстановки в результате остаются только числа, знаки и скобки.',
        'Вычисляйте результат рекурсивным спуском, как в калькуляторе из первого урока раздела, но по массиву токенов. Деление на ноль отметьте флагом.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

#define MAX_TOKENS 6000

typedef struct {
    char kind;            // 'n' — число, 'i' — имя, иначе символ знака или скобки
    long long value;
    char name[32];
} Token;

typedef struct {
    char name[32];
    Token tokens[100];
    int count;
} Macro;

static Macro macros[20];
static int macro_count;
static Token expanded[MAX_TOKENS];
static int expanded_count;
static int pos;
static int division_by_zero;

static int tokenize(const char *s, Token *out) {
    int n = 0;
    while (*s != '\0') {
        if (isspace((unsigned char)*s)) {
            s++;
        } else if (isdigit((unsigned char)*s)) {
            out[n].kind = 'n';
            out[n].value = 0;
            while (isdigit((unsigned char)*s)) {
                out[n].value = out[n].value * 10 + (*s++ - '0');
            }
            n++;
        } else if (isalpha((unsigned char)*s) || *s == '_') {
            int len = 0;
            out[n].kind = 'i';
            while ((isalnum((unsigned char)*s) || *s == '_') && len < 31) {
                out[n].name[len++] = *s++;
            }
            out[n].name[len] = '\0';
            n++;
        } else {
            out[n++].kind = *s++;
        }
    }
    return n;
}

static void push(Token t) {
    if (expanded_count < MAX_TOKENS) {
        expanded[expanded_count++] = t;
    }
}

static void expand(const Token *tokens, int count, int parens) {
    for (int i = 0; i < count; i++) {
        if (tokens[i].kind != 'i') {
            push(tokens[i]);
            continue;
        }
        for (int m = 0; m < macro_count; m++) {
            if (strcmp(macros[m].name, tokens[i].name) == 0) {
                Token bracket = {'(', 0, ""};
                if (parens) {
                    push(bracket);
                }
                expand(macros[m].tokens, macros[m].count, parens);
                bracket.kind = ')';
                if (parens) {
                    push(bracket);
                }
                break;
            }
        }
    }
}

static long long parse_expr(void);

static long long parse_factor(void) {
    if (pos < expanded_count && expanded[pos].kind == '(') {
        pos++;
        long long value = parse_expr();
        pos++;                                    // ')'
        return value;
    }
    return pos < expanded_count ? expanded[pos++].value : 0;
}

static long long parse_term(void) {
    long long value = parse_factor();
    while (pos < expanded_count && (expanded[pos].kind == '*' || expanded[pos].kind == '/')) {
        char op = expanded[pos++].kind;
        long long right = parse_factor();
        if (op == '*') {
            value *= right;
        } else if (right == 0) {
            division_by_zero = 1;
        } else {
            value /= right;
        }
    }
    return value;
}

static long long parse_expr(void) {
    long long value = parse_term();
    while (pos < expanded_count && (expanded[pos].kind == '+' || expanded[pos].kind == '-')) {
        char op = expanded[pos++].kind;
        long long right = parse_term();
        value = op == '+' ? value + right : value - right;
    }
    return value;
}

static void evaluate(const Token *tokens, int count, int parens) {
    expanded_count = 0;
    pos = 0;
    division_by_zero = 0;
    expand(tokens, count, parens);
    long long value = parse_expr();
    if (division_by_zero) {
        printf("деление на ноль");
    } else {
        printf("%lld", value);
    }
}

int main(void) {
    char line[256];
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &macro_count) != 1) {
        return 0;
    }
    for (int m = 0; m < macro_count; m++) {
        int offset = 0;
        if (fgets(line, sizeof line, stdin) == NULL ||
            sscanf(line, "%31s%n", macros[m].name, &offset) != 1) {
            return 0;
        }
        macros[m].count = tokenize(line + offset, macros[m].tokens);
    }
    int q;
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &q) != 1) {
        return 0;
    }
    for (int i = 0; i < q && fgets(line, sizeof line, stdin) != NULL; i++) {
        Token tokens[100];
        int count = tokenize(line, tokens);
        printf("без скобок: ");
        evaluate(tokens, count, 0);
        printf(", со скобками: ");
        evaluate(tokens, count, 1);
        printf("\n");
    }
    return 0;
}`,
      explanation: `
Способ A повторяет работу препроцессора: имя заменяется токенами замены, и они смешиваются с окружающими операциями. \`WIDTH * WIDTH\` при \`WIDTH = 10 + 2\` превращается в \`10 + 2 * 10 + 2\`, и умножение «захватывает» соседние числа. Способ B — то, что программист имел в виду: \`(10 + 2) * (10 + 2)\`. Разница между двумя ответами и есть ошибка, которую предотвращают скобки вокруг замены.

Подстановка рекурсивна: замена \`AREA\` содержит \`WIDTH\`, которая тоже раскрывается. Повторный просмотр в препроцессоре устроен так же, а защита от самоподстановки здесь не нужна — условие гарантирует отсутствие циклов.

Вычисление — рекурсивный спуск по массиву токенов. Деление на ноль может появиться только в одном из способов: в примере \`10 / ZERO\` при \`ZERO = 1 - 1\` без скобок получается \`10 / 1 - 1 = 9\`, а со скобками — \`10 / (1 - 1)\`.`,
      examples: [
        {
          in: '2\nWIDTH 10 + 2\nAREA WIDTH * WIDTH\n2\nAREA\nAREA / 2\n',
          out: 'без скобок: 32, со скобками: 144\nбез скобок: 31, со скобками: 72\n',
        },
        {
          in: '1\nZERO 1 - 1\n1\n10 / ZERO\n',
          out: 'без скобок: 9, со скобками: деление на ноль\n',
        },
      ],
      hidden: [
        { in: '1\nN 5\n1\nN * N\n', name: 'Одно число' },
        { in: '1\nK (2 + 3)\n1\nK * 4\n', name: 'Скобки уже есть' },
        { in: '2\nA 1 + 1\nB A * A\n1\nB * B\n', name: 'Двойная подстановка' },
        { in: '1\nH 100 / 4\n1\n200 / H\n', name: 'Деление' },
        { in: '1\nD 8 - 3\n1\n20 - D\n', name: 'Вычитание' },
        { in: '1\nX 2\n2\n(X+3)*X\n1+2*3\n', name: 'Без пробелов и без макросов' },
        {
          in: '3\nA 1+2\nB A*3\nC B-A\n1\nC*2\n',
          name: 'Цепочка макросов',
        },
        { in: '1\nZ 0\n1\n5 / Z\n', name: 'Деление на ноль в обоих' },
        { in: '1\nBIG 1000000 * 1000\n1\nBIG / 1000 + 1\n', name: 'Большие числа' },
      ],
    },
  ],
};
