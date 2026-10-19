const DEBUG_SUM = (fixed) => String.raw`
#include <stdio.h>

#define DEBUG_LEVEL 2          // 0 — без отладки, 1 — число шагов, 2 — каждый шаг

int main(void) {
    int value, steps = 0;
    long long sum = 0;
    while (scanf("%d", &value) == 1) {
        steps++;
        sum += value;
#if ${fixed ? 'DEBUG_LEVEL' : 'DEBUG_LEVL'} >= 2
        printf("шаг %d: %+d, сумма %lld\n", steps, value, sum);
#endif
    }
#if DEBUG_LEVEL >= 1
    printf("шагов: %d\n", steps);
#endif
    printf("сумма: %lld\n", sum);
    return 0;
}`;

export default {
  id: 'advanced-conditional-compilation',
  title: 'Условная компиляция',
  description:
    'Зачем выбирать код при сборке; #if, #elif, #else, #endif и правила вычисления условий; неопределённые имена равны нулю и флаг -Wundef; #ifdef, #ifndef и defined; отладочный код, платформа, компилятор, версия стандарта, #error и #if 0; цена условной компиляции и if с константой.',
  moduleId: 'advanced-c',
  order: 11,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-macro-hazards'],
  objectives: [
    'Писать цепочки #if/#elif/#else и предсказывать, какая ветка останется',
    'Отличать проверку факта определения (#ifdef) от проверки значения (#if)',
    'Определять платформу, компилятор и версию стандарта по предопределённым макросам',
    'Оценивать риски условной компиляции и заменять её обычным if там, где возможно',
  ],
  tags: ['#if', '#ifdef', 'defined', 'Условная компиляция', 'Платформа'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'В файле написано #define DEBUG 0. Попадёт ли в программу код между #ifdef DEBUG и #endif?',
      options: [
        'Да: #ifdef проверяет только то, что макрос определён',
        'Нет: значение 0 означает «выключено»',
        'Это ошибка компиляции',
        'Зависит от компилятора',
      ],
      correct: 0,
      explain:
        '#ifdef DEBUG — это #if defined(DEBUG), а макрос определён, пусть и со значением 0. Значение проверяет #if DEBUG.',
    },
    {
      q: 'Чему равно имя NOT_DEFINED_ANYWHERE в условии #if NOT_DEFINED_ANYWHERE > 1?',
      options: [
        'Нулю — оставшиеся после раскрытия идентификаторы заменяются на 0',
        'Это ошибка: неизвестное имя',
        'Единице',
        'Условие считается истинным',
      ],
      correct: 0,
      explain:
        'Препроцессор молча заменяет нулём любой идентификатор, который не оказался макросом. О таких именах предупреждает флаг -Wundef.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define VERSION 3

int main(void) {
#if VERSION > 4
    puts("новая");
#elif VERSION > 2
    puts("средняя");
#elif VERSION > 1
    puts("старая");
#else
    puts("древняя");
#endif
    return 0;
}`,
      answers: ['средняя'],
      placeholder: 'Вывод программы',
      explain:
        'Препроцессор оставляет первую ветку с истинным условием: 3 > 4 ложно, 3 > 2 истинно. Остальные ветки выброшены, хотя 3 > 1 тоже истинно.',
    },
    {
      q: 'Почему не компилируется #if sizeof(long) == 8?',
      options: [
        'Препроцессор не знает sizeof: имя sizeof для него — неопределённый идентификатор, а за ним стоит непонятная скобка',
        'sizeof нельзя сравнивать с числом',
        'Нужно писать sizeof long без скобок',
        'Условие #if должно быть в скобках',
      ],
      correct: 0,
      explain:
        'Препроцессор работает до компилятора и не знает типов. Размеры проверяют макросами из limits.h или static_assert.',
    },
    {
      q: 'Какой макрос однозначно говорит, что программу компилирует именно Clang, а не GCC?',
      options: ['__clang__', '__GNUC__', '__STDC__', '__linux__'],
      correct: 0,
      explain:
        'Clang определяет и __GNUC__ ради совместимости с кодом для GCC. Поэтому при выборе компилятора __clang__ проверяют первым.',
    },
    {
      q: 'Чем #if 0 … #endif лучше, чем закомментировать блок /* … */?',
      options: [
        'Внутри блока могут быть свои комментарии /* */, а блоки #if 0 вкладываются друг в друга',
        'Код внутри #if 0 всё равно компилируется и проверяется',
        'Код внутри #if 0 выполняется только в отладке',
        'Ничем, это одно и то же',
      ],
      correct: 0,
      explain:
        'Комментарии /* */ не вкладываются: первый же */ внутри блока закроет внешний комментарий. Код внутри #if 0 не компилируется — так же, как закомментированный.',
    },
    {
      q: 'Запишите #ifndef CONFIG_H через #if и defined.',
      answers: ['#if !defined(CONFIG_H)', '#if !defined CONFIG_H'],
      placeholder: 'Директива',
      explain:
        '#ifndef ИМЯ — сокращение для #if !defined(ИМЯ). Форма с defined позволяет комбинировать условия.',
    },
    {
      q: 'Что можно использовать в условии #if? Выберите все.',
      options: [
        'Макросы',
        'Целые числа и символьные константы',
        'defined(ИМЯ)',
        'Константы enum по их значению',
        'sizeof(тип)',
      ],
      correct: [0, 1, 2],
      explain:
        'Препроцессор знает только макросы и литералы. Константа enum в #if превратится в 0, а sizeof — в синтаксическую ошибку.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: молчаливая отладка',
      bug: true,
      description: `
Программа читает целые числа до конца ввода и печатает их сумму. Уровень отладки задаётся макросом \`DEBUG_LEVEL\`: при уровне 1 и выше она печатает число шагов, а при уровне 2 — ещё и каждый шаг строкой \`шаг K: +X, сумма S\` (у числа всегда печатается знак).

В программе \`DEBUG_LEVEL\` равен 2, но строки шагов не печатаются. Компилятор не выдаёт ни ошибок, ни предупреждений. Найдите и исправьте ошибку.`,
      constraints: ['Чисел не больше 30, каждое по модулю не больше 10⁶.'],
      hints: [
        'Сравните имена макросов во всех директивах #if с именем в #define.',
        'Неопределённое имя в #if молчаливо равно нулю, поэтому условие оказалось ложным. Исправьте опечатку — а в своих проектах включайте флаг -Wundef.',
      ],
      starter: DEBUG_SUM(false),
      solution: DEBUG_SUM(true),
      explanation: `
В условии \`#if DEBUG_LEVL >= 2\` пропущена буква. Препроцессор не знает макроса \`DEBUG_LEVL\` и по правилам языка заменяет его нулём: условие \`0 >= 2\` ложно, и вывод шагов выброшен из программы ещё до компиляции. Ни компилятор, ни линковщик об этом не узнают — выброшенного кода для них не существует.

Флаг \`-Wundef\` заставляет GCC и Clang предупреждать о каждом неопределённом имени в \`#if\`: \`"DEBUG_LEVL" is not defined, evaluates to 0\`. В проектах, где много условной компиляции, его включают вместе с \`-Wall -Wextra\`.`,
      examples: [
        {
          in: '5 -2 10\n',
          out: 'шаг 1: +5, сумма 5\nшаг 2: -2, сумма 3\nшаг 3: +10, сумма 13\nшагов: 3\nсумма: 13\n',
        },
        { in: '', out: 'шагов: 0\nсумма: 0\n', why: 'Пустой ввод: шагов нет.' },
      ],
      hidden: [
        '7\n',
        '0 0\n',
        '-1 -1 -1\n',
        '1000000 1000000 1000000\n',
        '1 2 3 4 5 6\n',
        '-1000000 999999\n',
        '42 -42\n',
        '3\n4\n',
      ],
    },
    {
      title: 'Какие строки попадут в программу',
      description: `
Смоделируйте условную компиляцию. На вход подаются строки программы до конца ввода. Строка, первый непробельный символ которой \`#\`, а за ним (возможно, после пробелов) одно из слов \`define\`, \`undef\`, \`ifdef\`, \`ifndef\`, \`else\`, \`endif\`, — директива; остальные строки, включая другие директивы, — обычный текст.

- \`#define ИМЯ …\` и \`#undef ИМЯ\` определяют и удаляют макрос (значение не важно) — но **только в оставленной части** текста;
- \`#ifdef ИМЯ\` / \`#ifndef ИМЯ\` начинают блок, который остаётся, если макрос определён / не определён; \`#else\` переключает ветку; \`#endif\` закрывает блок. Блоки вкладываются; вложенный блок внутри выброшенной части выброшен целиком, включая его \`#else\`.

Напечатайте оставленные обычные строки без изменений или \`(нет строк)\`, если их нет.

Если структура блоков нарушена, напечатайте **только** сообщение о первой ошибке:
- \`ошибка: #else без #if\` и \`ошибка: #endif без #if\` — директива вне блока;
- \`ошибка: повторный #else\` — второй \`#else\` в одном блоке;
- \`ошибка: не хватает #endif\` — в конце ввода остались незакрытые блоки.`,
      constraints: ['Строк не больше 100, каждая не длиннее 200 символов; макросов не больше 50.'],
      hints: [
        'Храните стек блоков: для каждого — было ли активно окружение (outer), выбрана ли сейчас ветка (taking) и встречался ли #else. Строка активна, если стек пуст или у вершины outer && taking.',
        '#ifdef/#ifndef кладут в стек { текущая активность, условие, 0 }; #else меняет taking на противоположное; #endif снимает вершину.',
        'Оставленные строки накапливайте в буфере и печатайте в конце: при ошибке выводится только её сообщение.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    int outer;
    int taking;
    int seen_else;
} Block;

static char macros[50][32];
static int macro_count;
static Block stack[100];
static int depth;
static char kept[100][256];
static int kept_count;

static int defined(const char *name) {
    for (int i = 0; i < macro_count; i++) {
        if (strcmp(macros[i], name) == 0) {
            return 1;
        }
    }
    return 0;
}

static void define(const char *name) {
    if (!defined(name) && macro_count < 50) {
        strcpy(macros[macro_count++], name);
    }
}

static void undef(const char *name) {
    for (int i = 0; i < macro_count; i++) {
        if (strcmp(macros[i], name) == 0) {
            macro_count--;
            if (i != macro_count) {
                strcpy(macros[i], macros[macro_count]);
            }
            return;
        }
    }
}

static int active(void) {
    return depth == 0 || (stack[depth - 1].outer && stack[depth - 1].taking);
}

int main(void) {
    char line[256];
    const char *error = NULL;
    while (error == NULL && fgets(line, sizeof line, stdin) != NULL) {
        char word[16] = "", name[32] = "";
        const char *p = line;
        while (*p == ' ' || *p == '\t') {
            p++;
        }
        int directive = 0;
        if (*p == '#' && sscanf(p + 1, " %15s %31s", word, name) >= 1) {
            directive = strcmp(word, "define") == 0 || strcmp(word, "undef") == 0 ||
                        strcmp(word, "ifdef") == 0 || strcmp(word, "ifndef") == 0 ||
                        strcmp(word, "else") == 0 || strcmp(word, "endif") == 0;
        }
        if (!directive) {
            if (active() && kept_count < 100) {
                strcpy(kept[kept_count++], line);
            }
            continue;
        }
        if (strcmp(word, "define") == 0) {
            if (active()) {
                define(name);
            }
        } else if (strcmp(word, "undef") == 0) {
            if (active()) {
                undef(name);
            }
        } else if (strcmp(word, "ifdef") == 0 || strcmp(word, "ifndef") == 0) {
            int condition = defined(name);
            Block block = {active(), strcmp(word, "ifdef") == 0 ? condition : !condition, 0};
            stack[depth++] = block;
        } else if (strcmp(word, "else") == 0) {
            if (depth == 0) {
                error = "ошибка: #else без #if";
            } else if (stack[depth - 1].seen_else) {
                error = "ошибка: повторный #else";
            } else {
                stack[depth - 1].taking = !stack[depth - 1].taking;
                stack[depth - 1].seen_else = 1;
            }
        } else if (depth == 0) {
            error = "ошибка: #endif без #if";
        } else {
            depth--;
        }
    }
    if (error == NULL && depth > 0) {
        error = "ошибка: не хватает #endif";
    }
    if (error != NULL) {
        printf("%s\n", error);
    } else if (kept_count == 0) {
        printf("(нет строк)\n");
    } else {
        for (int i = 0; i < kept_count; i++) {
            fputs(kept[i], stdout);
            if (strchr(kept[i], '\n') == NULL) {
                putchar('\n');
            }
        }
    }
    return 0;
}`,
      explanation: `
Ключ к задаче — стек блоков с двумя признаками у каждого: было ли активно окружение и выбрана ли текущая ветка. Строка попадает в программу, только если активны все вложенные уровни — достаточно проверить вершину, потому что \`outer\` уже содержит активность всех уровней ниже.

Важная деталь: \`#ifdef\` внутри выброшенной части всё равно кладётся в стек (со значением \`outer = 0\`), иначе её \`#else\` и \`#endif\` закрыли бы чужой блок. По той же причине \`#define\` и \`#undef\` в выброшенной части не выполняются — для препроцессора этих строк нет.

Ошибки структуры настоящий препроцессор тоже обнаруживает: \`#else after #else\`, \`#endif without #if\`, \`unterminated #ifdef\`. Сборка при этом прекращается, поэтому и здесь печатается только сообщение.`,
      examples: [
        {
          in: '#define LINUX\n#ifdef LINUX\nopen_linux();\n#else\nopen_windows();\n#endif\n#ifndef DEBUG\nfast_path();\n#endif\n',
          out: 'open_linux();\nfast_path();\n',
        },
        { in: '#ifdef A\nx\n#else\ny\n#else\nz\n#endif\n', out: 'ошибка: повторный #else\n' },
      ],
      hidden: [
        {
          in: '#ifdef A\n#define B\n#ifdef B\nx\n#endif\n#endif\n#ifdef B\ny\n#endif\n',
          name: 'define в выброшенной части',
        },
        {
          in: '#ifdef A\n#ifdef B\nx\n#else\ny\n#endif\n#else\nz\n#endif\n',
          name: 'Вложенный else в выброшенном блоке',
        },
        { in: '#define X\n#undef X\n#ifdef X\na\n#else\nb\n#endif\n', name: 'undef' },
        { in: 'line1\n#endif\nline2\n', name: 'endif без if' },
        { in: '#else\n', name: 'else без if' },
        { in: '#ifndef GUARD_H\n#define GUARD_H\nint f(void);\n', name: 'Не хватает endif' },
        {
          in: '#ifndef GUARD_H\n#define GUARD_H\nint f(void);\n#endif\n#ifndef GUARD_H\n#define GUARD_H\nint f(void);\n#endif\n',
          name: 'Защита заголовка',
        },
        {
          in: '#include <stdio.h>\n  #  ifdef   NOPE\nhidden\n  # endif\n#pragma once\n',
          name: 'Пробелы и другие директивы',
        },
        { in: '#ifdef NOTHING\nonly\n#endif\n', name: 'Нет строк' },
      ],
    },
    {
      title: 'Вычисление условий #if',
      difficulty: 'advanced',
      description: `
Вычислите условия \`#if\` так, как это делает препроцессор. В первой строке — число макросов \`n\`, далее \`n\` строк \`ИМЯ значение\` (значение — целое число). Затем до конца ввода идут выражения, по одному в строке.

Выражение состоит из целых чисел, имён, оператора \`defined\` (в форме \`defined ИМЯ\` или \`defined(ИМЯ)\`), скобок и операций в порядке убывания приоритета:
- унарные \`!\`, \`-\`, \`+\`;
- \`*\`, \`/\`, \`%\`;
- \`+\`, \`-\`;
- \`<\`, \`>\`, \`<=\`, \`>=\`;
- \`==\`, \`!=\`;
- \`&&\`;
- \`||\`.

Двуместные операции одного уровня выполняются слева направо. Имя макроса заменяется его значением, любое другое имя — нулём; \`defined\` даёт 1 или 0. Сравнения и логические операции дают 1 или 0. \`&&\` и \`||\` не вычисляют правую часть, если результат ясен по левой. Деление целочисленное, как в C.

Для каждого выражения напечатайте \`V: блок остаётся\`, если его значение V не равно нулю, \`0: блок выброшен\` — если равно, или \`ошибка: деление на ноль\`, если при вычислении встретилось деление или остаток от деления на ноль.`,
      constraints: [
        '0 ≤ n ≤ 20; значения и все промежуточные результаты по модулю не больше 10¹²; выражения корректны.',
        'Строки не длиннее 200 символов, выражений не больше 30.',
      ],
      hints: [
        'Рекурсивный спуск: по функции на уровень приоритета — parse_or, parse_and, parse_equality, parse_relational, parse_additive, parse_term, parse_unary, parse_primary.',
        'Короткое вычисление: передавайте во все функции флаг eval. В parse_and при левом значении 0 разбирайте правую часть с eval = 0 — синтаксис нужно пройти, но деление на ноль там не считается ошибкой.',
        'В parse_primary после имени defined пропустите пробелы и необязательную скобку, прочитайте имя и, если была скобка, закрывающую.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char names[20][32];
static long long values[20];
static int macro_count;
static const char *pos;
static int failed;

static void skip(void) {
    while (*pos == ' ' || *pos == '\t') {
        pos++;
    }
}

static int match(const char *op) {
    skip();
    size_t len = strlen(op);
    if (strncmp(pos, op, len) == 0) {
        pos += len;
        return 1;
    }
    return 0;
}

static void read_name(char *out) {
    skip();
    int len = 0;
    while ((isalnum((unsigned char)*pos) || *pos == '_') && len < 31) {
        out[len++] = *pos++;
    }
    out[len] = '\0';
}

static int find(const char *name) {
    for (int i = 0; i < macro_count; i++) {
        if (strcmp(names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static long long parse_or(int eval);

static long long parse_primary(int eval) {
    skip();
    if (match("(")) {
        long long value = parse_or(eval);
        match(")");
        return value;
    }
    if (isdigit((unsigned char)*pos)) {
        char *end;
        long long value = strtoll(pos, &end, 10);
        pos = end;
        return value;
    }
    char name[32];
    read_name(name);
    if (strcmp(name, "defined") == 0) {
        int paren = match("(");
        read_name(name);
        if (paren) {
            match(")");
        }
        return find(name) >= 0;
    }
    int index = find(name);
    return index >= 0 ? values[index] : 0;
}

static long long parse_unary(int eval) {
    if (match("!")) {
        return !parse_unary(eval);
    }
    if (match("-")) {
        return -parse_unary(eval);
    }
    if (match("+")) {
        return parse_unary(eval);
    }
    return parse_primary(eval);
}

static long long parse_term(int eval) {
    long long value = parse_unary(eval);
    for (;;) {
        char op;
        if (match("*")) {
            op = '*';
        } else if (match("/")) {
            op = '/';
        } else if (match("%")) {
            op = '%';
        } else {
            return value;
        }
        long long right = parse_unary(eval);
        if (op == '*') {
            value *= right;
        } else if (right == 0) {
            if (eval) {
                failed = 1;
            }
            value = 0;
        } else {
            value = op == '/' ? value / right : value % right;
        }
    }
}

static long long parse_additive(int eval) {
    long long value = parse_term(eval);
    for (;;) {
        if (match("+")) {
            value += parse_term(eval);
        } else if (match("-")) {
            value -= parse_term(eval);
        } else {
            return value;
        }
    }
}

static long long parse_relational(int eval) {
    long long value = parse_additive(eval);
    for (;;) {
        if (match("<=")) {
            value = value <= parse_additive(eval);
        } else if (match(">=")) {
            value = value >= parse_additive(eval);
        } else if (match("<")) {
            value = value < parse_additive(eval);
        } else if (match(">")) {
            value = value > parse_additive(eval);
        } else {
            return value;
        }
    }
}

static long long parse_equality(int eval) {
    long long value = parse_relational(eval);
    for (;;) {
        if (match("==")) {
            value = value == parse_relational(eval);
        } else if (match("!=")) {
            value = value != parse_relational(eval);
        } else {
            return value;
        }
    }
}

static long long parse_and(int eval) {
    long long value = parse_equality(eval);
    while (match("&&")) {
        long long right = parse_equality(eval && value != 0);
        value = value != 0 && right != 0;
    }
    return value;
}

static long long parse_or(int eval) {
    long long value = parse_and(eval);
    while (match("||")) {
        long long right = parse_and(eval && value == 0);
        value = value != 0 || right != 0;
    }
    return value;
}

int main(void) {
    char line[256];
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &macro_count) != 1) {
        return 0;
    }
    for (int i = 0; i < macro_count; i++) {
        if (fgets(line, sizeof line, stdin) == NULL ||
            sscanf(line, "%31s %lld", names[i], &values[i]) != 2) {
            return 0;
        }
    }
    while (fgets(line, sizeof line, stdin) != NULL) {
        pos = line;
        skip();
        if (*pos == '\n' || *pos == '\0') {
            continue;
        }
        failed = 0;
        long long value = parse_or(1);
        if (failed) {
            printf("ошибка: деление на ноль\n");
        } else if (value != 0) {
            printf("%lld: блок остаётся\n", value);
        } else {
            printf("0: блок выброшен\n");
        }
    }
    return 0;
}`,
      explanation: `
Грамматика повторяет приоритеты C, поэтому решение — рекурсивный спуск с функцией на каждый уровень. Операции из двух символов проверяются раньше односимвольных (\`<=\` раньше \`<\`), иначе \`<=\` разобралось бы как \`<\` и непонятный \`=\`.

Короткое вычисление требует внимания: правую часть \`0 && …\` нужно **разобрать** (чтобы дойти до конца выражения), но не **вычислять** её побочные эффекты — здесь единственный такой эффект — ошибка деления на ноль. Флаг \`eval\` передаётся вниз по рекурсии и выключается для правой части, результат которой не нужен. Настоящий препроцессор GCC поступает так же: \`#if 0 && (1 / 0)\` компилируется без ошибки.

Подстановка нуля вместо неизвестного имени — то самое правило, из-за которого опечатка в \`#if\` проходит незамеченной: \`UNKNOWN + 5 == 5\` истинно.`,
      examples: [
        {
          in: '3\nDEBUG 1\nLEVEL 2\nZERO 0\ndefined(DEBUG) && LEVEL >= 2\n!defined RELEASE || ZERO\nLEVEL / ZERO\n',
          out: '1: блок остаётся\n1: блок остаётся\nошибка: деление на ноль\n',
        },
        {
          in: '1\nLEVEL 2\nLEVEL * 10 - 5\nUNKNOWN + 5 == 5\nLEVEL > 5\n',
          out: '15: блок остаётся\n1: блок остаётся\n0: блок выброшен\n',
        },
      ],
      hidden: [
        { in: '1\nZERO 0\nZERO && 1 / ZERO\n1 || 1 / ZERO\n', name: 'Короткое вычисление' },
        { in: '0\n2 + 3 * 4\n(2 + 3) * 4\n-7 / 2\n-7 % 2\n', name: 'Приоритеты и деление' },
        { in: '0\ndefined X\n!defined(X)\ndefined ( X )\n', name: 'Формы defined' },
        { in: '1\nX 0\ndefined(X)\nX\n', name: 'Определён со значением 0' },
        { in: '0\n1 < 2 == 1\n3 >= 3 != 0\n2 <= 1\n', name: 'Сравнения' },
        { in: '1\nV -5\nV < 0 && -V == 5\n!V\n!!V\n', name: 'Отрицательное значение' },
        { in: '0\n1 || 0 && 0\n(1 || 0) && 0\n', name: 'Приоритет && над ||' },
        { in: '2\nA 10\nB 3\nA % B\nA / B * B + A % B == A\n', name: 'Остаток' },
        { in: '0\n10 % 0\n0 * (1 / 0)\n', name: 'Ошибка при умножении на ноль' },
        {
          in: '2\nMAJOR 2\nMINOR 14\nMAJOR > 2 || MAJOR == 2 && MINOR >= 10\n',
          name: 'Проверка версии',
        },
      ],
    },
  ],
};
