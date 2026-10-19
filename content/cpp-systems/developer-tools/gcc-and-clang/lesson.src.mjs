export default {
  id: 'gcc-and-clang',
  title: 'GCC, Clang и флаги компилятора',
  description:
    'GCC и Clang, группы флагов сборки, выбор стандарта -std и -Wpedantic, предупреждения -Wall, -Wextra, -Werror и -Wno-…, уровни оптимизации -O, отладочная информация -g и различия сообщений двух компиляторов.',
  moduleId: 'developer-tools',
  order: 4,
  difficulty: 'beginner',
  estimatedMinutes: 50,
  prerequisites: ['toolchain-pipeline'],
  objectives: [
    'Читать команду сборки и относить каждый флаг к своей стадии',
    'Выбирать стандарт языка и набор предупреждений для проекта',
    'Исправлять ошибки, найденные предупреждениями -Wall и -Wextra',
    'Выбирать флаги для отладочной сборки и для выпуска',
  ],
  tags: ['GCC', 'Clang', 'Флаги', 'Предупреждения', 'Оптимизация'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что делает флаг -Wall?',
      options: [
        'Включает основной набор предупреждений — но не все существующие',
        'Включает абсолютно все предупреждения компилятора',
        'Превращает предупреждения в ошибки',
        'Отключает все предупреждения',
      ],
      correct: 0,
      explain:
        'Название историческое. Многие полезные проверки включаются отдельно: -Wextra, -Wconversion, -Wshadow. В ошибки предупреждения превращает -Werror.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int i = -1;
    unsigned int n = 3;
    printf(i < n ? "да\n" : "нет\n");
    return 0;
}`,
      answers: ['нет'],
      placeholder: 'Вывод программы',
      explain:
        'При сравнении int с unsigned int значение -1 преобразуется в беззнаковое 4294967295, и оно не меньше 3. -Wextra предупреждает именно об этом.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int count = 5;
    if (count = 0) {
        printf("A\n");
    } else {
        printf("B %d\n", count);
    }
    return 0;
}`,
      answers: ['B 0'],
      placeholder: 'Вывод программы',
      explain:
        'count = 0 — присваивание: count становится 0, а значение выражения 0 означает ложь. -Wall предупреждает о таком условии.',
    },
    {
      q: 'Какие флаги относятся к стадии линковки? Выберите все.',
      options: ['-lm', '-L/usr/local/lib', '-Iinclude', '-DNDEBUG', '-O2'],
      correct: [0, 1],
      explain:
        '-l подключает библиотеку, -L добавляет каталог поиска библиотек. -I и -D настраивают препроцессор, -O2 — компиляцию.',
    },
    {
      q: 'Какой уровень оптимизации действует в команде gcc -O1 -O3 -O2 main.c?',
      answers: ['-O2', 'O2'],
      placeholder: 'Флаг',
      explain: 'Если флаг повторяется с разными значениями, действует последний.',
    },
    {
      q: 'Зачем в командных проектах добавляют -Werror?',
      options: [
        'Чтобы код с предупреждениями нельзя было собрать и предупреждения не копились',
        'Чтобы компилятор находил больше видов ошибок',
        'Чтобы ускорить сборку',
        'Чтобы ошибки печатались подробнее',
      ],
      correct: 0,
      explain:
        '-Werror не добавляет новых проверок — он делает уже включённые обязательными. Десятки «привычных» предупреждений прячут то единственное, которое важно.',
    },
    {
      q: 'Какая пара флагов подходит для отладки в GDB?',
      options: ['-g -O0', '-O3', '-O2 -DNDEBUG', '-Os -s'],
      correct: 0,
      explain:
        '-g добавляет связь машинного кода со строками и переменными, а -O0 сохраняет код близким к исходнику. -DNDEBUG отключает assert, -s удаляет символы.',
    },
    {
      q: 'Почему стандарт в командах сборки задают явно (-std=c23), а не полагаются на режим по умолчанию?',
      options: [
        'Режим по умолчанию — gnu17 или gnu23 в зависимости от версии GCC, с расширениями GNU; явный -std с -Wpedantic делает сборку одинаковой и переносимой',
        'Без -std компилятор собирает по C89',
        'Без -std не работают предупреждения',
        '-std=c23 включает все предупреждения',
      ],
      correct: 0,
      explain:
        'GCC 14 по умолчанию использует gnu17, GCC 15 — gnu23. Обновление компилятора меняет язык, на котором собирается проект, если стандарт не указан. -std=c23 вместе с -Wpedantic фиксирует стандарт и сообщает о расширениях.',
    },
    {
      q: 'Вы набрали gcc --version на Mac и увидели Apple clang version 15. Почему?',
      options: [
        'На macOS команда gcc по умолчанию вызывает Clang',
        'Clang — новая версия GCC',
        'GCC установлен неправильно',
        'Так выглядит любой GCC на процессорах Apple',
      ],
      correct: 0,
      explain:
        'Apple поставляет Clang и оставила имя gcc для совместимости. Настоящий GCC устанавливают отдельно.',
    },
  ],
  exercises: [
    {
      title: 'Разбор флагов',
      difficulty: 'beginner',
      description: `
Дана команда сборки: имя компилятора и аргументы через пробел. Разложите её по группам и напечатайте ровно 10 строк:

\`\`\`
компилятор: …
стандарт: …
оптимизация: …
отладка: …
предупреждения: …
макросы: …
заголовки: …
библиотеки: …
файлы: …
результат: …
\`\`\`

- \`-std=X\` — стандарт \`X\` (по умолчанию \`gnu17\`);
- \`-O0\`, \`-O1\`, \`-O2\`, \`-O3\`, \`-Os\`, \`-Og\` — оптимизация (по умолчанию \`-O0\`); одиночный \`-O\` означает \`-O1\`;
- любой флаг, начинающийся с \`-g\`, — отладка \`да\` (иначе \`нет\`);
- флаги, начинающиеся с \`-W\`, — предупреждения в порядке ввода;
- \`-DИМЯ\` или \`-DИМЯ=значение\` — макрос (печатается без \`-D\`), \`-Iкаталог\` — каталог заголовков, \`-lимя\` — библиотека;
- \`-o имя\` — результат (по умолчанию \`a.out\`); прочие флаги игнорируются, остальные слова — файлы.

При повторе \`-std\` и \`-O\` действует последний. Пустой список печатайте как \`-\`. Элементы списков разделяйте пробелом.`,
      constraints: ['В команде от 2 до 30 слов, каждое — не длиннее 60 символов.'],
      hints: [
        'Сравнение начала слова: strncmp(word, "-std=", 5) == 0. Значение — word + 5.',
        'Списки удобно копить в строках: напишите функцию append(char *list, const char *item), которая дописывает пробел и элемент через strcat.',
        'Проверку -O ставьте после проверки -o: это разные флаги, и регистр важен.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LIST 2048

static void append(char *list, const char *item) {
    if (list[0] != '\0') {
        strcat(list, " ");
    }
    strcat(list, item);
}

static void print_list(const char *title, const char *list) {
    printf("%s: %s\n", title, list[0] != '\0' ? list : "-");
}

int main(void) {
    char word[64];
    char compiler[64] = "";
    char standard[64] = "gnu17";
    char optimization[64] = "-O0";
    char output[64] = "a.out";
    int debug = 0;
    static char warnings[LIST];
    static char macros[LIST];
    static char includes[LIST];
    static char libraries[LIST];
    static char files[LIST];
    if (scanf("%63s", compiler) != 1) {
        return 0;
    }
    while (scanf("%63s", word) == 1) {
        if (strncmp(word, "-std=", 5) == 0) {
            strcpy(standard, word + 5);
        } else if (strcmp(word, "-o") == 0) {
            if (scanf("%63s", output) != 1) {
                strcpy(output, "a.out");
            }
        } else if (strcmp(word, "-O") == 0) {
            strcpy(optimization, "-O1");
        } else if (strncmp(word, "-O", 2) == 0) {
            strcpy(optimization, word);
        } else if (strncmp(word, "-g", 2) == 0) {
            debug = 1;
        } else if (strncmp(word, "-W", 2) == 0) {
            append(warnings, word);
        } else if (strncmp(word, "-D", 2) == 0) {
            append(macros, word + 2);
        } else if (strncmp(word, "-I", 2) == 0) {
            append(includes, word + 2);
        } else if (strncmp(word, "-l", 2) == 0) {
            append(libraries, word + 2);
        } else if (word[0] != '-') {
            append(files, word);
        }
    }
    printf("компилятор: %s\n", compiler);
    printf("стандарт: %s\n", standard);
    printf("оптимизация: %s\n", optimization);
    printf("отладка: %s\n", debug ? "да" : "нет");
    print_list("предупреждения", warnings);
    print_list("макросы", macros);
    print_list("заголовки", includes);
    print_list("библиотеки", libraries);
    print_list("файлы", files);
    printf("результат: %s\n", output);
    return 0;
}`,
      explanation: `
Такой разбор — первое, что нужно сделать с чужой командой сборки из \`Makefile\` или журнала CI: понять, каким стандартом, с какими проверками и оптимизациями собирается код и что передаётся линковщику.

Порядок проверок важен: \`-o\` и \`-O\` различаются только регистром, а \`-O\` без цифры — отдельный случай. Флаги со значением в том же слове (\`-Iinclude\`, \`-DDEBUG\`, \`-lm\`) отличаются от \`-o\`, у которого значение — следующее слово.`,
      examples: [
        {
          in: 'gcc -std=c23 -Wall -Wextra -g -O0 -Iinclude -DDEBUG main.c util.c -o app -lm\n',
          out: 'компилятор: gcc\nстандарт: c23\nоптимизация: -O0\nотладка: да\nпредупреждения: -Wall -Wextra\nмакросы: DEBUG\nзаголовки: include\nбиблиотеки: m\nфайлы: main.c util.c\nрезультат: app\n',
        },
        {
          in: 'clang main.c\n',
          out: 'компилятор: clang\nстандарт: gnu17\nоптимизация: -O0\nотладка: нет\nпредупреждения: -\nмакросы: -\nзаголовки: -\nбиблиотеки: -\nфайлы: main.c\nрезультат: a.out\n',
        },
      ],
      hidden: [
        { in: 'gcc -O1 -O3 -O2 main.c\n', name: 'Последний -O' },
        { in: 'gcc -O main.c -o fast\n', name: 'Одиночный -O' },
        { in: 'gcc -std=c99 -std=c11 -Os prog.c\n', name: 'Последний -std' },
        { in: 'gcc -ggdb -Og -Wshadow -Wno-unused-parameter debug.c\n', name: 'Отладочные флаги' },
        { in: 'gcc -DLIMIT=5 -DNDEBUG -DNAME=calc main.c\n', name: 'Макросы со значениями' },
        {
          in: 'gcc main.o net.o -L/opt/lib -lssl -lcrypto -lpthread -o server\n',
          name: 'Линковка',
        },
        { in: 'gcc -Iinclude -Ithird_party/json -c src/main.c\n', name: 'Каталоги заголовков' },
        {
          in: 'gcc-14 -Werror -Wall -Wextra -Wpedantic -Wconversion -fPIC lib.c\n',
          name: 'Строгие предупреждения',
        },
        { in: 'gcc -o\n', name: '-o без имени' },
        {
          in: 'clang -std=c23 -O3 -g3 -march=native -DUSE_SIMD a.c b.c c.c -o bench -lm\n',
          name: 'Всё вместе',
        },
      ],
    },
    {
      title: 'Какие предупреждения включены',
      description: `
Смоделируйте, как GCC решает, включено ли предупреждение. В первой строке — флаги через пробел, во второй — число запросов \`q\`, далее \`q\` имён предупреждений (без \`-W\`). Для каждого напечатайте \`имя: выкл\`, \`имя: вкл\` или \`имя: ошибка\`.

Группы:

| Флаг | Включает |
| --- | --- |
| \`-Wall\` | \`parentheses\`, \`format\`, \`unused-variable\`, \`return-type\`, \`misleading-indentation\` |
| \`-Wextra\` | \`sign-compare\`, \`unused-parameter\`, \`missing-field-initializers\` |

Правила:
1. \`-w\` отключает все предупреждения — ответ \`выкл\`.
2. Явный флаг \`-Wимя\` или \`-Wno-имя\` важнее групп **независимо от порядка**; из явных флагов для одного имени действует последний.
3. Без явного флага предупреждение включено, если указана его группа.
4. Включённое предупреждение становится ошибкой, если есть \`-Werror\` или \`-Werror=имя\`. Флаг \`-Werror=имя\` ещё и работает как явный \`-Wимя\`.

Остальные флаги на ответ не влияют.`,
      constraints: ['Не больше 30 флагов и 20 запросов; имена не длиннее 40 символов.'],
      hints: [
        'Явные флаги храните в таблице «имя → 1 или 0»: при повторе перезаписывайте значение. Для -Werror=имя запишите 1 и отметьте имя как ошибку.',
        'Принадлежность группе удобно проверять функцией in_list(name, list, count) над массивами строк.',
        'Сначала прочитайте строку флагов через fgets, а слова из неё выделите через strtok(line, " \\n").',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX 40
#define NAME 64

static const char *all_group[] = {"parentheses", "format", "unused-variable", "return-type",
                                  "misleading-indentation"};
static const char *extra_group[] = {"sign-compare", "unused-parameter",
                                    "missing-field-initializers"};

static char explicit_names[MAX][NAME];
static int explicit_values[MAX];
static int explicit_count;
static char error_names[MAX][NAME];
static int error_count;

static int in_list(const char *name, const char *const *list, int count) {
    for (int i = 0; i < count; i++) {
        if (strcmp(list[i], name) == 0) {
            return 1;
        }
    }
    return 0;
}

static int find_explicit(const char *name) {
    for (int i = 0; i < explicit_count; i++) {
        if (strcmp(explicit_names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static void set_explicit(const char *name, int value) {
    int index = find_explicit(name);
    if (index < 0 && explicit_count < MAX) {
        index = explicit_count++;
        strcpy(explicit_names[index], name);
    }
    if (index >= 0) {
        explicit_values[index] = value;
    }
}

int main(void) {
    char line[2048];
    int wall = 0;
    int wextra = 0;
    int silent = 0;
    int werror = 0;
    if (fgets(line, sizeof line, stdin) == NULL) {
        return 0;
    }
    for (char *flag = strtok(line, " \r\n"); flag != NULL; flag = strtok(NULL, " \r\n")) {
        if (strlen(flag) >= NAME) {
            continue;
        }
        if (strcmp(flag, "-w") == 0) {
            silent = 1;
        } else if (strcmp(flag, "-Wall") == 0) {
            wall = 1;
        } else if (strcmp(flag, "-Wextra") == 0) {
            wextra = 1;
        } else if (strcmp(flag, "-Werror") == 0) {
            werror = 1;
        } else if (strncmp(flag, "-Werror=", 8) == 0) {
            set_explicit(flag + 8, 1);
            if (error_count < MAX) {
                strcpy(error_names[error_count++], flag + 8);
            }
        } else if (strncmp(flag, "-Wno-", 5) == 0) {
            set_explicit(flag + 5, 0);
        } else if (strncmp(flag, "-W", 2) == 0) {
            set_explicit(flag + 2, 1);
        }
    }
    int q;
    if (scanf("%d", &q) != 1) {
        return 0;
    }
    for (int i = 0; i < q; i++) {
        char name[NAME];
        if (scanf("%63s", name) != 1) {
            break;
        }
        int index = find_explicit(name);
        int on;
        if (index >= 0) {
            on = explicit_values[index];
        } else {
            on = (wall && in_list(name, all_group, 5)) || (wextra && in_list(name, extra_group, 3));
        }
        if (silent || !on) {
            printf("%s: выкл\n", name);
            continue;
        }
        int is_error = werror;
        for (int j = 0; j < error_count && !is_error; j++) {
            is_error = strcmp(error_names[j], name) == 0;
        }
        printf("%s: %s\n", name, is_error ? "ошибка" : "вкл");
    }
    return 0;
}`,
      explanation: `
В GCC группа (\`-Wall\`, \`-Wextra\`) задаёт только **значение по умолчанию** для своих предупреждений. Явный флаг для конкретного имени перекрывает его, где бы ни стоял: \`-Wno-unused-parameter -Wextra\` оставляет \`unused-parameter\` выключенным. Поэтому решение хранит явные флаги отдельно от групп и обращается к группам, только если явного флага нет.

Практический вывод: включайте широкие группы и точечно отключайте конкретные ложные срабатывания — \`-Wall -Wextra -Wno-unused-parameter\`. А \`-Werror=return-type\` делает обязательным одно важное предупреждение, не превращая в ошибки все остальные.`,
      examples: [
        {
          in: '-Wall -Wno-format\n3\nparentheses\nformat\nsign-compare\n',
          out: 'parentheses: вкл\nformat: выкл\nsign-compare: выкл\n',
        },
        {
          in: '-Wall -Wextra -Werror\n2\nsign-compare\nshadow\n',
          out: 'sign-compare: ошибка\nshadow: выкл\n',
        },
      ],
      hidden: [
        {
          in: '-Wno-unused-parameter -Wextra\n2\nunused-parameter\nsign-compare\n',
          name: 'Явный флаг до группы',
        },
        { in: '-Wshadow -Wno-shadow -Wshadow\n1\nshadow\n', name: 'Последний явный' },
        { in: '-Wall -w\n2\nformat\nparentheses\n', name: '-w отключает всё' },
        { in: '-Werror=return-type\n2\nreturn-type\nformat\n', name: '-Werror= включает' },
        { in: '-Wall -Werror=format -Wno-format\n1\nformat\n', name: 'Отключено после -Werror=' },
        { in: '-O2 -g\n2\nformat\nconversion\n', name: 'Без предупреждений' },
        {
          in: '-Wconversion -Wall\n3\nconversion\nunused-variable\nmissing-field-initializers\n',
          name: 'Отдельный флаг',
        },
        {
          in: '-Wall -Wextra -Wno-sign-compare -Werror=parentheses\n4\nparentheses\nsign-compare\nformat\nunused-parameter\n',
          name: 'Смешанные правила',
        },
        { in: '-Werror\n1\nformat\n', name: '-Werror без групп' },
        {
          in: '-Wextra -Wmisleading-indentation -Werror\n2\nmisleading-indentation\nreturn-type\n',
          name: 'Явное из чужой группы',
        },
      ],
    },
    {
      title: 'Найди ошибку: сравнение со знаком',
      difficulty: 'intermediate',
      bug: true,
      description: `
Датчик передаёт \`n\` показаний — целые числа, в том числе отрицательные. Показания строго меньше порога \`min\` отбраковываются. Программа читает \`min\` и \`n\`, затем показания, и печатает \`отбраковано: K\`.

На положительных числах всё работает, но отрицательные показания почему-то не отбраковываются. Соберите программу с \`-Wall -Wextra\` — компилятор укажет на проблемную строку. Исправьте ошибку, не меняя формат ввода и вывода.`,
      constraints: ['0 ≤ min ≤ 10⁹.', '1 ≤ n ≤ 1000; показания от −10⁹ до 10⁹.'],
      hints: [
        "Предупреждение -Wextra: comparison of integer expressions of different signedness: 'int' and 'unsigned int'. Во что превращается -5 при сравнении с unsigned int?",
        'Отрицательное показание всегда меньше неотрицательного порога: проверьте value < 0 отдельно, а затем сравнивайте (unsigned int)value < min_level.',
      ],
      starter: String.raw`
#include <stdio.h>

int main(void) {
    unsigned int min_level;
    int n;
    scanf("%u %d", &min_level, &n);
    int rejected = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (value < min_level) {
            rejected++;
        }
    }
    printf("отбраковано: %d\n", rejected);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int main(void) {
    unsigned int min_level;
    int n;
    scanf("%u %d", &min_level, &n);
    int rejected = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (value < 0 || (unsigned int)value < min_level) {
            rejected++;
        }
    }
    printf("отбраковано: %d\n", rejected);
    return 0;
}`,
      explanation: `
В выражении \`value < min_level\` у операндов разные типы: \`int\` и \`unsigned int\`. По правилам C знаковый операнд преобразуется в беззнаковый, и \`-5\` становится \`4 294 967 291\` — огромным числом, которое не меньше порога.

Исправление делает сравнение корректным для всех значений: отрицательное показание заведомо меньше неотрицательного порога, а неотрицательное можно безопасно привести к \`unsigned int\`. Другой вариант — хранить порог в \`long long\` и сравнивать в этом типе.

Без \`-Wextra\` компилятор промолчит: \`-Wsign-compare\` в C входит именно в этот набор.`,
      examples: [
        { in: '10 4\n5 12 10 3\n', out: 'отбраковано: 2\n' },
        { in: '0 3\n-1 0 1\n', out: 'отбраковано: 1\n' },
      ],
      hidden: [
        { in: '5 1\n-5\n', name: 'Одно отрицательное' },
        { in: '0 4\n0 0 0 0\n', name: 'Нулевой порог' },
        { in: '100 5\n-100 -1 99 100 101\n', name: 'Вокруг порога' },
        { in: '1000000000 3\n-1000000000 999999999 1000000000\n', name: 'Крайние значения' },
        { in: '7 6\n1 2 3 4 5 6\n', name: 'Все меньше' },
        { in: '3 4\n3 4 5 6\n', name: 'Ни одного' },
        { in: '50 8\n-3 60 -70 40 0 51 -1 49\n', name: 'Вперемешку' },
        { in: '1 1\n0\n', name: 'Ноль меньше единицы' },
        { in: '20 5\n-2147483 -20 20 -19 19\n', name: 'Отрицательные разной величины' },
      ],
    },
    {
      title: 'Найди ошибку: = вместо ==',
      difficulty: 'intermediate',
      bug: true,
      description: `
Журнал содержит \`n\` измерений. Значение \`0\` означает пропуск: прибор ничего не измерил. Программа должна напечатать \`пропусков: Z, сумма: S\`, где \`S\` — сумма всех измерений.

Программа всегда печатает нули. Соберите её с \`-Wall\`, прочитайте предупреждение и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 1000; измерения от −10⁶ до 10⁶.'],
      hints: [
        'Предупреждение -Wall: suggest parentheses around assignment used as truth value. Что делает value = 0 внутри if?',
        'Присваивание не только даёт ложное условие, но и затирает прочитанное значение — поэтому и сумма всегда 0.',
      ],
      starter: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int missing = 0;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (value = 0) {
            missing++;
        }
        sum += value;
    }
    printf("пропусков: %d, сумма: %lld\n", missing, sum);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int missing = 0;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (value == 0) {
            missing++;
        }
        sum += value;
    }
    printf("пропусков: %d, сумма: %lld\n", missing, sum);
    return 0;
}`,
      explanation: `
\`value = 0\` — присваивание. Оно записывает в \`value\` ноль, а значением всего выражения становится \`0\`, то есть «ложь». Ошибка двойная: условие никогда не выполняется, а прочитанное значение потеряно, поэтому и сумма всегда равна нулю.

Язык это разрешает — присваивание в условии бывает нужно, например \`while ((c = getchar()) != EOF)\`. Поэтому компилятор не выдаёт ошибку, а только предупреждает и предлагает взять намеренное присваивание в дополнительные скобки. Это одна из причин всегда собирать с \`-Wall\`.`,
      examples: [
        { in: '5\n3 0 4 0 5\n', out: 'пропусков: 2, сумма: 12\n' },
        { in: '1\n7\n', out: 'пропусков: 0, сумма: 7\n' },
      ],
      hidden: [
        { in: '1\n0\n', name: 'Один пропуск' },
        { in: '4\n0 0 0 0\n', name: 'Все пропуски' },
        { in: '3\n-5 0 5\n', name: 'Сумма ноль' },
        { in: '3\n1000000 1000000 1000000\n', name: 'Большие значения' },
        { in: '6\n-1 -2 -3 0 -4 0\n', name: 'Отрицательные' },
        { in: '2\n0 9\n', name: 'Пропуск первым' },
        { in: '2\n9 0\n', name: 'Пропуск последним' },
        { in: '8\n1 2 3 4 5 6 7 8\n', name: 'Без пропусков' },
        { in: '5\n-1000000 0 1000000 0 -1000000\n', name: 'Крайние значения' },
      ],
    },
  ],
};
