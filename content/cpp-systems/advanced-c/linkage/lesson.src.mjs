const STREAKS = (fixed) => String.raw`
#include <stdio.h>

static int max_streak = 0;      // самая длинная серия за все дни

void process_day(int day, const int *values, int n) {
${fixed ? '    int streak = 0, day_best = 0;' : '    int streak = 0, max_streak = 0;'}
    for (int i = 0; i < n; i++) {
        if (values[i] > 0) {
            streak++;
${
  fixed
    ? '            if (streak > day_best) {\n                day_best = streak;\n            }'
    : '            if (streak > max_streak) {\n                max_streak = streak;\n            }'
}
        } else {
            streak = 0;
        }
    }
${
  fixed
    ? '    printf("день %d: лучшая серия %d\\n", day, day_best);\n    if (day_best > max_streak) {\n        max_streak = day_best;\n    }'
    : '    printf("день %d: лучшая серия %d\\n", day, max_streak);'
}
}

int main(void) {
    int days;
    if (scanf("%d", &days) != 1) {
        return 0;
    }
    for (int day = 1; day <= days; day++) {
        int n, values[100];
        if (scanf("%d", &n) != 1 || n < 0 || n > 100) {
            return 0;
        }
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &values[i]) != 1) {
                return 0;
            }
        }
        process_day(day, values, n);
    }
    printf("рекорд: %d\n", max_streak);
    return 0;
}`;

export default {
  id: 'advanced-linkage',
  title: 'Связывание: область видимости, связывание и время хранения',
  description:
    'Три независимых свойства имени: область видимости, связывание (внешнее, внутреннее, нет) и время хранения (автоматическое, статическое, выделенное, потоковое); сводная таблица объявлений; почему у static два смысла; зарезервированные имена; inline и static inline; проектирование связывания модуля.',
  moduleId: 'advanced-c',
  order: 6,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-extern'],
  objectives: [
    'Определять область видимости, связывание и время хранения любого объявления',
    'Объяснять, какое свойство меняет static вне функций и внутри блока',
    'Избегать конфликтов с зарезервированными именами и ловушки inline без static',
    'Выбирать связывание для функций, состояния и констант модуля',
  ],
  tags: ['Связывание', 'Область видимости', 'Время хранения', 'inline', 'Зарезервированные имена'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что описывает связывание имени?',
      options: [
        'Обозначают ли одинаковые имена в разных объявлениях один и тот же объект',
        'В какой части текста программы имя видно',
        'Когда объект создаётся и уничтожается',
        'В каком порядке линковщик соединяет файлы',
      ],
      correct: 0,
      explain:
        'Видимость в тексте — это область видимости, срок жизни — время хранения. Связывание отвечает, сольются ли объявления в один объект: во всей программе (внешнее), в одном файле (внутреннее) или ни с чем (нет связывания).',
    },
    {
      q: 'Какие свойства у переменной static int calls; объявленной внутри функции?',
      options: [
        'Область — блок, связывания нет, время хранения статическое',
        'Область — файл, связывание внутреннее, время хранения статическое',
        'Область — блок, связывание внутреннее, время хранения автоматическое',
        'Область — файл, связывания нет, время хранения статическое',
      ],
      correct: 0,
      explain:
        'В блоке static меняет только время хранения. Имя по-прежнему видно лишь в блоке, и никакое другое объявление на эту переменную сослаться не может.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

static int n = 1;

int bump(void) {
    static int n = 10;
    n += 5;
    return n;
}

int main(void) {
    bump();
    n += bump();
    printf("%d\n", n);
    return 0;
}`,
      answers: ['21'],
      placeholder: 'Вывод программы',
      explain:
        'В программе две переменные n. Локальная static n в bump становится 15, затем 20. В main видна файловая n: 1 + 20 = 21.',
    },
    {
      q: 'У каких объявлений внешнее связывание? Выберите все.',
      options: [
        'int total = 0; вне функций',
        'void report(void); внутри функции',
        'static int cache[16]; вне функций',
        'int i; внутри цикла',
        'extern int level; внутри функции, если выше нет static int level;',
      ],
      correct: [0, 1, 4],
      explain:
        'Функции и переменные вне функций без static имеют внешнее связывание; объявление функции в блоке — тоже. extern без предшествующего static даёт внешнее связывание. static вне функций — внутреннее, локальная переменная связывания не имеет.',
    },
    {
      q: 'В файле сначала написано static int depth = 0;, а ниже — extern int depth;. Какое связывание у depth во втором объявлении?',
      options: [
        'Внутреннее: extern повторяет связывание ранее видимого объявления',
        'Внешнее: extern всегда даёт внешнее связывание',
        'Ошибка компиляции: конфликт static и extern',
        'Связывания нет',
      ],
      correct: 0,
      explain:
        'extern не задаёт связывание заново, если раньше видно объявление того же имени со связыванием: оно наследуется. Обратный порядок — сначала int depth; потом static int depth; — ошибка.',
    },
    {
      q: 'Файл с функцией inline int twice(int x) { return 2 * x; } и её вызовом в main собирают командой gcc -std=c17 -O0 main.c. Что произойдёт?',
      options: [
        'Ошибка линковки undefined reference to twice',
        'Программа соберётся, функция будет встроена',
        'Ошибка компиляции: inline запрещён в C',
        'Предупреждение, программа соберётся',
      ],
      correct: 0,
      explain:
        'Определение inline без static и без отдельного extern-объявления не создаёт внешнего определения. Без оптимизации компилятор не встраивает вызов и ищет функцию, которой нет. static inline решает проблему.',
    },
    {
      q: 'Какие идентификаторы зарезервированы и не должны использоваться как ваши внешние имена? Выберите все.',
      options: ['_Buffer', '__count', 'log (как имя своей функции)', 'app_log', 'buffer_size'],
      correct: [0, 1, 2],
      explain:
        'Подчёркивание с заглавной буквой и двойное подчёркивание зарезервированы для реализации, имена функций стандартной библиотеки — для неё. app_log и buffer_size свободны.',
    },
    {
      q: 'Сколько разных переменных с именем x в этой программе?',
      code: String.raw`
static int x;

void f(void) {
    int x = 1;
    {
        static int x = 2;
    }
}

void g(void) {
    extern int x;
    x = 3;
}`,
      answers: ['3', 'три'],
      placeholder: 'Число',
      explain:
        'Файловая static int x; локальная int x в f; локальная static int x во внутреннем блоке. extern int x в g ссылается на файловую переменную (и наследует её внутреннее связывание), новой переменной не создаёт.',
    },
  ],
  exercises: [
    {
      title: 'Свойства объявления',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — объявление в упрощённой форме: место (\`file\` — вне функций, \`block\` — внутри функции, \`param\` — параметр функции), возможно, \`static\` или \`extern\`, слово \`int\` и имя; у функции после имени стоят скобки \`()\`.

Для каждой строки напечатайте
\`\`\`
имя: область — О; связывание — С; хранение — Х
\`\`\`
- **область**: \`файл\` для \`file\`, \`блок\` для \`block\` и \`param\`;
- **связывание**: \`внутреннее\` для \`file static\`; \`нет\` для переменных в блоке без \`extern\` и для параметров; для \`extern\` и для функций без \`static\` — \`внутреннее\`, если **выше** во вводе была строка \`file static\` с тем же именем, иначе \`внешнее\`; для остальных строк \`file\` — \`внешнее\`;
- **хранение**: у функций \`нет\`; у параметров и переменных в блоке без \`static\` и \`extern\` — \`автоматическое\`; у остальных переменных — \`статическое\`.`,
      constraints: [
        'Строк не больше 30, имена не длиннее 31 символа.',
        'Объявление функции в блоке не бывает static; параметры не бывают static или extern.',
      ],
      hints: [
        'Разбейте строку на слова через sscanf: место, затем либо static/extern, либо сразу int. Функция узнаётся по скобкам в конце имени — strstr(name, "()").',
        'Запоминайте имена всех строк file static в массив: он нужен, чтобы решить, какое связывание унаследуют extern и функции.',
        'Порядок проверок для связывания: file static → внутреннее; функция или extern → по таблице static-имён; param или block → нет; иначе внешнее.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static char static_names[30][32];
static int static_count;

static int declared_static(const char *name) {
    for (int i = 0; i < static_count; i++) {
        if (strcmp(static_names[i], name) == 0) {
            return 1;
        }
    }
    return 0;
}

int main(void) {
    char line[128];
    while (fgets(line, sizeof line, stdin) != NULL) {
        char place[8], words[3][40];
        int count = sscanf(line, "%7s %39s %39s %39s", place, words[0], words[1], words[2]);
        if (count < 3) {
            continue;
        }
        const char *spec = count == 4 ? words[0] : "";
        char name[40];
        strcpy(name, count == 4 ? words[2] : words[1]);
        char *parens = strstr(name, "()");
        int is_function = parens != NULL;
        if (is_function) {
            *parens = '\0';
        }
        int is_file = strcmp(place, "file") == 0;
        int is_static = strcmp(spec, "static") == 0;
        int is_extern = strcmp(spec, "extern") == 0;

        const char *linkage;
        if (is_file && is_static) {
            linkage = "внутреннее";
            if (static_count < 30) {
                strcpy(static_names[static_count++], name);
            }
        } else if (is_function || is_extern) {
            linkage = declared_static(name) ? "внутреннее" : "внешнее";
        } else if (!is_file) {
            linkage = "нет";
        } else {
            linkage = "внешнее";
        }

        const char *storage;
        if (is_function) {
            storage = "нет";
        } else if (!is_file && !is_static && !is_extern) {
            storage = "автоматическое";
        } else {
            storage = "статическое";
        }
        printf("%s: область — %s; связывание — %s; хранение — %s\n", name,
               is_file ? "файл" : "блок", linkage, storage);
    }
    return 0;
}`,
      explanation: `
Три свойства вычисляются независимо — ровно так, как в сводной таблице урока. Область зависит только от места объявления. Время хранения — от места и спецификатора: \`static\` и \`extern\` дают статическое, локальная переменная без них — автоматическое, у функций времени хранения нет вовсе.

Связывание — самое хитрое. \`static\` вне функций даёт внутреннее. \`extern\` и объявление функции без спецификатора **наследуют** связывание ранее видимого объявления: если выше было \`static int x;\`, то \`extern int x;\` и \`int x();\` тоже внутренние. Поэтому программа запоминает имена всех файловых \`static\`. Локальные переменные и параметры связывания не имеют — каждое такое объявление создаёт отдельный объект.`,
      examples: [
        {
          in: 'file int count\nfile static int cache\nblock static int calls\n',
          out: 'count: область — файл; связывание — внешнее; хранение — статическое\ncache: область — файл; связывание — внутреннее; хранение — статическое\ncalls: область — блок; связывание — нет; хранение — статическое\n',
        },
        {
          in: 'block int i\nparam int n\nfile int area()\n',
          out: 'i: область — блок; связывание — нет; хранение — автоматическое\nn: область — блок; связывание — нет; хранение — автоматическое\narea: область — файл; связывание — внешнее; хранение — нет\n',
        },
      ],
      hidden: [
        { in: 'file extern int level\n', name: 'extern вне функций' },
        { in: 'block extern int level\n', name: 'extern в блоке' },
        { in: 'file static int depth\nfile extern int depth\n', name: 'extern после static' },
        { in: 'file static int helper()\nfile int helper()\n', name: 'Функция после static' },
        { in: 'block int report()\n', name: 'Функция в блоке' },
        {
          in: 'file static int a\nblock extern int b\nblock extern int a\n',
          name: 'Наследуется только своё имя',
        },
        {
          in: 'block extern int x\nfile static int x\n',
          name: 'static ниже не влияет',
        },
        {
          in: 'file int main()\nparam int argc\nblock int result\nblock static int runs\nfile static int log_level\n',
          name: 'Все виды',
        },
      ],
    },
    {
      title: 'Найди ошибку: затенение',
      bug: true,
      description: `
Приложение для бега записывает, был ли каждый километр пройден в хорошем темпе (положительное число) или нет (ноль или отрицательное). Программа читает число дней, затем для каждого дня \`n\` и \`n\` чисел. Для каждого дня она печатает \`день D: лучшая серия S\` — длину самой длинной серии подряд идущих положительных чисел за день, а в конце — \`рекорд: R\`, самую длинную серию за все дни.

Дневные серии печатаются верно, а рекорд всегда равен нулю. Найдите и исправьте ошибку.`,
      constraints: [
        'До 20 дней, в каждом от 0 до 100 чисел; серии не переходят из одного дня в другой.',
      ],
      hints: [
        'Рекорд хранится в глобальной переменной max_streak. Где и когда она должна меняться?',
        'Внутри process_day объявлена локальная переменная с тем же именем — она скрывает глобальную. Переименуйте локальную (например, day_best) и после цикла обновите глобальный рекорд.',
      ],
      starter: STREAKS(false),
      solution: STREAKS(true),
      explanation: `
Объявление \`int streak = 0, max_streak = 0;\` создаёт **локальную** переменную, которая до конца функции скрывает глобальную \`max_streak\`. Все присваивания внутри \`process_day\` меняют локальную копию, поэтому дневной результат верный, а глобальный рекорд так и остаётся нулём.

Компилятор не предупреждает: затенение законно. Найти такие места помогает флаг \`-Wshadow\` — в проектах его часто включают вместе с \`-Wall -Wextra\`. Лучшее исправление — не давать локальным переменным имена глобальных: дневной максимум называется \`day_best\`, а после подсчёта он сравнивается с рекордом.`,
      examples: [
        {
          in: '2\n5 1 1 0 1 1\n4 1 1 1 0\n',
          out: 'день 1: лучшая серия 2\nдень 2: лучшая серия 3\nрекорд: 3\n',
        },
        { in: '1\n3 0 -1 0\n', out: 'день 1: лучшая серия 0\nрекорд: 0\n' },
      ],
      hidden: [
        '1\n1 5\n',
        '3\n2 1 1\n0\n3 1 0 1\n',
        '2\n6 1 1 1 1 1 1\n2 1 1\n',
        '2\n4 1 0 0 1\n5 1 1 1 1 1\n',
        '1\n10 1 2 3 0 4 5 6 7 0 1\n',
        '4\n1 0\n1 1\n2 1 1\n3 1 1 1\n',
        '3\n3 -1 -2 -3\n2 0 0\n1 -5\n',
        '2\n5 9 9 9 9 9\n5 9 9 9 9 9\n',
      ],
    },
    {
      title: 'Что покажет nm',
      difficulty: 'advanced',
      description: `
Команда \`nm\` печатает **таблицу символов** объектного файла — имена, которые увидит линковщик. Буква перед именем говорит, что это за символ; **заглавная** буква означает внешнее связывание, **строчная** — внутреннее (символ виден только в своём файле):

| Буква | Символ |
| --- | --- |
| \`T\` / \`t\` | определённая функция |
| \`D\` / \`d\` | переменная со статическим временем хранения и ненулевым инициализатором |
| \`B\` / \`b\` | переменная без инициализатора или с нулевым инициализатором |
| \`U\` | используется, но не определена в этом файле |

Каждая строка ввода описывает одно объявление или действие в файле:
- \`func ИМЯ\` / \`static func ИМЯ\` — определение функции; \`proto ИМЯ\` — прототип;
- \`var ИМЯ = V\` / \`var ИМЯ\` — переменная вне функций с инициализатором (целое V) или без; то же со \`static\` в начале;
- \`extern var ИМЯ\` — объявление переменной;
- \`local ИМЯ\` — обычная локальная переменная; \`local static ИМЯ = V\` / \`local static ИМЯ\` — локальная \`static\`;
- \`call ИМЯ\` — вызов функции; \`use ИМЯ\` — обращение к переменной вне функций.

Постройте таблицу: строки \`БУКВА ИМЯ\`, отсортированные по имени (\`strcmp\`). Правила:
- обычные локальные переменные, прототипы и \`extern\`-объявления символов не создают;
- локальная \`static\` — символ с внутренним связыванием по имени \`ИМЯ.N\`, где N — номер этой переменной среди всех локальных \`static\` файла по порядку, начиная с 0;
- \`U ИМЯ\` — для функции, которая вызывается, но не определена в файле, и для переменной, к которой обращаются, но которая в файле не определена; каждое имя — один раз.

Если символов нет, напечатайте \`нет символов\`.`,
      constraints: [
        'Строк не больше 50, имена не длиннее 31 символа, |V| ≤ 10⁹.',
        'Одно имя не определяется дважды; вызываются только функции, а в use — только переменные.',
      ],
      hints: [
        'Сначала прочитайте все строки в массивы (вид, имя, наличие static, значение), потом стройте символы: для U нужно знать, определено ли имя где-то в файле, в том числе ниже.',
        'Буква определения: базовая T, D или B (B — если инициализатора нет или он равен нулю), затем строчная, если static: tolower из ctype.h.',
        'Соберите символы в массив структур { char letter; char name[40]; }, отсортируйте qsort со strcmp по имени и напечатайте.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char letter;
    char name[40];
} Symbol;

typedef struct {
    char kind[32];
    char name[32];
    int is_static;
    int has_value;
    long long value;
} Line;

static Line lines[50];
static int line_count;
static Symbol symbols[60];
static int symbol_count;

static void add_symbol(char letter, const char *name) {
    for (int i = 0; i < symbol_count; i++) {
        if (strcmp(symbols[i].name, name) == 0) {
            return;
        }
    }
    symbols[symbol_count].letter = letter;
    snprintf(symbols[symbol_count].name, sizeof symbols[symbol_count].name, "%s", name);
    symbol_count++;
}

static int defined(const char *kind, const char *name) {
    for (int i = 0; i < line_count; i++) {
        if (strcmp(lines[i].kind, kind) == 0 && strcmp(lines[i].name, name) == 0) {
            return 1;
        }
    }
    return 0;
}

static int by_name(const void *a, const void *b) {
    return strcmp(((const Symbol *)a)->name, ((const Symbol *)b)->name);
}

int main(void) {
    char text[128];
    while (line_count < 50 && fgets(text, sizeof text, stdin) != NULL) {
        char words[5][32];
        int count = sscanf(text, "%31s %31s %31s %31s %31s", words[0], words[1], words[2],
                           words[3], words[4]);
        if (count < 2) {
            continue;
        }
        Line *line = &lines[line_count];
        int pos = 0;
        line->is_static = strcmp(words[0], "static") == 0;
        if (line->is_static || strcmp(words[0], "extern") == 0) {
            pos = 1;
        }
        if (strcmp(words[0], "local") == 0 && strcmp(words[1], "static") == 0) {
            strcpy(line->kind, "lstatic");
            pos = 2;
        } else {
            snprintf(line->kind, sizeof line->kind, "%s", words[pos]);
            if (strcmp(words[0], "extern") == 0) {
                strcpy(line->kind, "extern");
            }
            pos++;
        }
        strcpy(line->name, words[pos]);
        line->has_value = count > pos + 2 && strcmp(words[pos + 1], "=") == 0;
        line->value = line->has_value ? atoll(words[pos + 2]) : 0;
        line_count++;
    }

    int local_number = 0;
    for (int i = 0; i < line_count; i++) {
        Line *line = &lines[i];
        char letter = 0;
        char name[40];
        snprintf(name, sizeof name, "%s", line->name);
        if (strcmp(line->kind, "func") == 0) {
            letter = 'T';
        } else if (strcmp(line->kind, "var") == 0 || strcmp(line->kind, "lstatic") == 0) {
            letter = line->has_value && line->value != 0 ? 'D' : 'B';
            if (strcmp(line->kind, "lstatic") == 0) {
                snprintf(name, sizeof name, "%s.%d", line->name, local_number++);
            }
        } else if (strcmp(line->kind, "call") == 0 && !defined("func", line->name)) {
            letter = 'U';
        } else if (strcmp(line->kind, "use") == 0 && !defined("var", line->name)) {
            letter = 'U';
        }
        if (letter == 0) {
            continue;
        }
        if (line->is_static || strcmp(line->kind, "lstatic") == 0) {
            letter = (char)tolower((unsigned char)letter);
        }
        add_symbol(letter, name);
    }

    if (symbol_count == 0) {
        printf("нет символов\n");
        return 0;
    }
    qsort(symbols, (size_t)symbol_count, sizeof symbols[0], by_name);
    for (int i = 0; i < symbol_count; i++) {
        printf("%c %s\n", symbols[i].letter, symbols[i].name);
    }
    return 0;
}`,
      explanation: `
Таблица символов — то, что компилятор сообщает линковщику о единице трансляции. В неё попадают только объекты со **статическим временем хранения** и функции: у обычных локальных переменных нет постоянного адреса, они живут в стеке и линковщику не нужны. Прототипы и \`extern\`-объявления сами ничего не создают — они превращаются в символ \`U\`, только если по ним действительно обращаются.

Регистр буквы кодирует **связывание**: \`static\` функции и переменные получают строчные буквы — линковщик не будет сопоставлять их с одноимёнными символами других файлов. Локальные \`static\` переменные тоже попадают в таблицу (им нужен постоянный адрес), но всегда со строчной буквой и с суффиксом, чтобы одноимённые переменные разных функций не путались.

Разделение \`D\`/\`B\` отражает секции файла: переменные с ненулевыми значениями хранятся в файле вместе со значениями (секция \`.data\`), а нулевые занимают место только при запуске (\`.bss\`).`,
      examples: [
        {
          in: 'var verbose = 1\nstatic var calls\nstatic func helper\nfunc main\ncall printf\ncall helper\nlocal static counter\nlocal i\nuse verbose\nextern var errors\nproto unused\n',
          out: 'b calls\nb counter.0\nt helper\nT main\nU printf\nD verbose\n',
        },
        { in: 'proto f\nextern var g\nlocal x\n', out: 'нет символов\n' },
      ],
      hidden: [
        { in: 'var zero = 0\nstatic var neg = -5\n', name: 'Ноль и отрицательное' },
        { in: 'extern var errors\nuse errors\nuse errors\n', name: 'U один раз' },
        { in: 'extern var late\nuse late\nvar late = 3\n', name: 'Определение ниже' },
        { in: 'call compute\nfunc compute\n', name: 'Вызов до определения' },
        {
          in: 'func a\nlocal static count\nfunc b\nlocal static count = 7\nlocal static total\n',
          name: 'Нумерация локальных static',
        },
        { in: 'static func f\ncall f\ncall g\nproto g\n', name: 'Прототип без определения' },
        {
          in: 'var Zeta = 1\nvar alpha = 2\nfunc Beta\nvar _hidden\n',
          name: 'Сортировка по strcmp',
        },
        {
          in: 'func main\ncall malloc\ncall free\ncall malloc\nuse stdout\nlocal static buffer = 1\nstatic var state = 42\n',
          name: 'Библиотечные символы',
        },
      ],
    },
  ],
};
