const COMMANDS_BUGGY = String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[1024];
    if (!fgets(line, sizeof line, stdin)) {
        return 0;
    }
    line[strcspn(line, "\n")] = '\0';

    char flags[32] = "";
    for (char *dir = strtok(line, " "); dir; dir = strtok(nullptr, " ")) {
        strcat(flags, "-I");
        strcat(flags, dir);
        strcat(flags, " ");
    }

    char source[256];
    while (scanf("%255s", source) == 1) {
        printf("{\"file\": \"%s\", \"command\": \"cc -std=c23 %s-c %s\"}\n", source, flags, source);
    }
    return 0;
}`;

const COMMANDS_FIXED = String.raw`
#include <stdio.h>
#include <string.h>

constexpr int MAX_DIRS = 20;

int main(void) {
    char line[1024];
    if (!fgets(line, sizeof line, stdin)) {
        return 0;
    }
    line[strcspn(line, "\n")] = '\0';

    const char *dirs[MAX_DIRS];
    int count = 0;
    for (char *dir = strtok(line, " "); dir && count < MAX_DIRS; dir = strtok(nullptr, " ")) {
        dirs[count++] = dir;
    }

    char source[256];
    while (scanf("%255s", source) == 1) {
        printf("{\"file\": \"%s\", \"command\": \"cc -std=c23 ", source);
        for (int i = 0; i < count; ++i) {
            printf("-I%s ", dirs[i]);
        }
        printf("-c %s\"}\n", source);
    }
    return 0;
}`;

export default {
  id: 'tooling-ecosystem',
  title: 'Современная экосистема C и C++',
  description:
    'Инструменты вокруг компилятора: база команд compile_commands.json, clang-format и проверка стиля в CI, статический анализ clang-tidy и GCC -fanalyzer, языковой сервер clangd, менеджеры зависимостей vcpkg и Conan, CMake FetchContent и фиксация версий, CMake Presets, непрерывная интеграция с матрицей компиляторов и режимов.',
  moduleId: 'developer-tools',
  order: 13,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['git-basic-workflow'],
  objectives: [
    'Объяснять назначение compile_commands.json и создавать его через CMake',
    'Настраивать clang-format и clang-tidy для проекта и CI',
    'Подключать зависимости через vcpkg или Conan с фиксированными версиями',
    'Описывать сборку пресетами CMake и матрицей CI',
  ],
  tags: ['clang-format', 'clang-tidy', 'clangd', 'vcpkg', 'Conan', 'CI'],
  standard: 'c23',
  quiz: [
    {
      q: 'Зачем clangd и clang-tidy нужен compile_commands.json?',
      options: [
        'Чтобы знать флаги компиляции каждого файла: стандарт, каталоги заголовков, макросы',
        'Чтобы скомпилировать проект вместо CMake',
        'Чтобы хранить зависимости',
        'Он им не нужен',
      ],
      correct: 0,
      explain: 'Без базы команд инструменты угадывают флаги и выдают ложные ошибки.',
    },
    {
      q: 'Какая переменная CMake включает создание compile_commands.json?',
      answers: [
        'CMAKE_EXPORT_COMPILE_COMMANDS',
        '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
        'CMAKE_EXPORT_COMPILE_COMMANDS=ON',
      ],
      placeholder: 'Имя переменной',
      explain: 'cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
    },
    {
      q: 'Что делает clang-format --dry-run --Werror в CI?',
      options: [
        'Проверяет стиль, ничего не меняя, и завершается ошибкой при нарушениях',
        'Переформатирует все файлы',
        'Компилирует с предупреждениями как ошибками',
        'Ищет ошибки памяти',
      ],
      correct: 0,
      explain: 'Без --dry-run с ключом -i файлы были бы переписаны.',
    },
    {
      q: 'Чем статический анализ дополняет санитайзеры?',
      options: [
        'Рассуждает обо всех путях выполнения, а не только о выполненных тестами',
        'Он всегда точнее',
        'Он находит ошибки только во время выполнения',
        'Ничем',
      ],
      correct: 0,
      explain: 'Зато анализатор может ошибаться: пропускать ошибки и сообщать о несуществующих.',
    },
    {
      q: 'Какие инструменты управляют зависимостями C и C++? Выберите все.',
      options: ['vcpkg', 'Conan', 'CMake FetchContent', 'clang-format'],
      correct: [0, 1, 2],
      explain: 'clang-format отвечает за стиль кода.',
    },
    {
      q: 'Матрица CI: compiler [gcc, clang, msvc] × build [Debug, Release], исключено msvc + Debug. Сколько заданий?',
      options: ['5', '6', '4', '3'],
      correct: 0,
      explain: '3 · 2 = 6 сочетаний минус одно исключённое.',
    },
    {
      q: 'Что даёт CMakePresets.json?',
      options: [
        'Именованные наборы настроек сборки, общие для команды, редактора и CI',
        'Список зависимостей',
        'Правила форматирования',
        'Готовые двоичные библиотеки',
      ],
      correct: 0,
      explain: 'cmake --preset debug заменяет длинную команду с множеством -D.',
    },
    {
      q: 'Как называется протокол, через который редактор получает от clangd подсказки и переходы к объявлениям? (аббревиатура)',
      answers: ['LSP', 'lsp', 'Language Server Protocol'],
      placeholder: 'Аббревиатура',
      explain: 'Один языковой сервер работает в любом редакторе с поддержкой LSP.',
    },
  ],
  exercises: [
    {
      title: 'Проверка форматирования',
      difficulty: 'beginner',
      description: `
Напишите упрощённую проверку стиля в духе \`clang-format --dry-run --Werror\`. Первая строка ввода — два числа: ширина отступа N и предел длины строки M. Дальше — строки кода. Для каждой строки (нумерация с 1) проверьте по порядку и выведите нарушения:

1. есть символ табуляции — \`строка K: табуляция\`;
2. иначе, если строка не пустая и не из одних пробелов, а число ведущих пробелов S не кратно N — \`строка K: отступ S не кратен N\`;
3. строка оканчивается пробелом — \`строка K: пробелы в конце\`;
4. длина L (в байтах, без перевода строки) больше M — \`строка K: длина L > M\`.

В конце выведите \`нарушений T\`.`,
      constraints: [
        '1 ≤ N ≤ 8; 10 ≤ M ≤ 200; строк не больше 500, каждая короче 1000 байт; символы — ASCII.',
      ],
      hints: [
        'Строку читайте fgets, перевод строки отрежьте через line[strcspn(line, "\\n")] = \'\\0\'.',
        'strspn(line, " ") — число ведущих пробелов; если оно равно длине, строка состоит из одних пробелов.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int indent = 0;
    int limit = 0;
    if (scanf("%d %d", &indent, &limit) != 2) {
        return 0;
    }
    int ch;
    while ((ch = getchar()) != '\n' && ch != EOF) {
    }
    char line[1024];
    int number = 0;
    int total = 0;
    while (fgets(line, sizeof line, stdin)) {
        ++number;
        const size_t len = strcspn(line, "\n");
        line[len] = '\0';
        if (strchr(line, '\t')) {
            printf("строка %d: табуляция\n", number);
            ++total;
        } else {
            const size_t spaces = strspn(line, " ");
            if (spaces < len && spaces % (size_t)indent != 0) {
                printf("строка %d: отступ %zu не кратен %d\n", number, spaces, indent);
                ++total;
            }
        }
        if (len > 0 && line[len - 1] == ' ') {
            printf("строка %d: пробелы в конце\n", number);
            ++total;
        }
        if (len > (size_t)limit) {
            printf("строка %d: длина %zu > %d\n", number, len, limit);
            ++total;
        }
    }
    printf("нарушений %d\n", total);
    return 0;
}`,
      explanation: `
Настоящий clang-format не проверяет правила по отдельности, а заново раскладывает код по правилам стиля и сравнивает результат с исходным файлом. Но смысл режима \`--dry-run --Werror\` тот же: найти расхождения со стилем, ничего не меняя, и вернуть ошибку, если они есть, чтобы CI отклонил изменение.`,
      examples: [
        {
          in: '4 20\nint main(void) {\n   return 0;\n}\n',
          out: 'строка 2: отступ 3 не кратен 4\nнарушений 1\n',
        },
        {
          in: '2 10\nint x = 12345; \n\tint y;\n',
          out: 'строка 1: пробелы в конце\nстрока 1: длина 15 > 10\nстрока 2: табуляция\nнарушений 3\n',
        },
      ],
      hidden: [
        { in: '4 80\nint main(void) {\n    return 0;\n}\n', name: 'Без нарушений' },
        { in: '4 80\n', name: 'Пустой файл' },
        { in: '2 80\n\n   \n', name: 'Пустая строка и пробелы' },
        { in: '8 10\n        x;\n', name: 'Отступ 8' },
        { in: '4 10\n0123456789\n01234567890\n', name: 'Граница длины' },
        { in: '3 100\n   a\n      b\n    c\n', name: 'Отступ 3' },
        { in: '4 12\n\t   long line with tab \n', name: 'Все нарушения кроме отступа' },
        { in: '1 50\n a\n  b\n', name: 'Отступ 1 всегда кратен' },
      ],
    },
    {
      title: 'Подбор версии зависимости',
      description: `
Менеджеры пакетов выбирают версию зависимости по ограничениям. Первая строка — ограничения через пробел, вторая — доступные версии вида \`MAJOR.MINOR.PATCH\`. Ограничения:

- \`>=V\`, \`>V\`, \`<=V\`, \`<V\`, \`==V\` — сравнение версий покомпонентно;
- \`^V\` — совместимые версии: не меньше V и меньше следующей «ломающей» версии — \`(MAJOR+1).0.0\`, а если MAJOR = 0, то \`0.(MINOR+1).0\`.

Выведите \`выбрана X.Y.Z\` — наибольшую версию, удовлетворяющую всем ограничениям, или \`нет подходящей версии\`.`,
      constraints: ['Ограничений до 10, версий до 100; компоненты от 0 до 1000.'],
      hints: [
        'Храните версию как три числа и сравнивайте функцией, возвращающей −1, 0 или 1 (сначала MAJOR, затем MINOR, затем PATCH).',
        'Ограничение удобно разобрать в структуру {оператор, версия}; ^V превращается в два: >=V и <V′.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    int part[3];
} Version;

typedef struct {
    char op[3];
    Version v;
} Rule;

static int compare(Version a, Version b) {
    for (int i = 0; i < 3; ++i) {
        if (a.part[i] != b.part[i]) {
            return a.part[i] < b.part[i] ? -1 : 1;
        }
    }
    return 0;
}

static bool parse_version(const char *s, Version *v) {
    return sscanf(s, "%d.%d.%d", &v->part[0], &v->part[1], &v->part[2]) == 3;
}

static bool satisfies(Version v, const Rule *r) {
    const int c = compare(v, r->v);
    if (strcmp(r->op, ">=") == 0) return c >= 0;
    if (strcmp(r->op, ">") == 0) return c > 0;
    if (strcmp(r->op, "<=") == 0) return c <= 0;
    if (strcmp(r->op, "<") == 0) return c < 0;
    return c == 0;
}

int main(void) {
    char line[1024];
    if (!fgets(line, sizeof line, stdin)) {
        return 0;
    }
    Rule rules[32];
    int count = 0;
    for (char *tok = strtok(line, " \n"); tok; tok = strtok(nullptr, " \n")) {
        size_t skip = 1;
        if (tok[0] == '^') {
            Version v;
            parse_version(tok + 1, &v);
            Version upper = {{v.part[0] + 1, 0, 0}};
            if (v.part[0] == 0) {
                upper = (Version){{0, v.part[1] + 1, 0}};
            }
            rules[count++] = (Rule){">=", v};
            rules[count++] = (Rule){"<", upper};
            continue;
        }
        if (tok[1] == '=') {
            skip = 2;
        }
        Rule r = {0};
        memcpy(r.op, tok, skip);
        parse_version(tok + skip, &r.v);
        rules[count++] = r;
    }
    bool found = false;
    Version best = {{0, 0, 0}};
    char word[64];
    while (scanf("%63s", word) == 1) {
        Version v;
        if (!parse_version(word, &v)) {
            continue;
        }
        bool ok = true;
        for (int i = 0; i < count && ok; ++i) {
            ok = satisfies(v, &rules[i]);
        }
        if (ok && (!found || compare(v, best) > 0)) {
            best = v;
            found = true;
        }
    }
    if (found) {
        printf("выбрана %d.%d.%d\n", best.part[0], best.part[1], best.part[2]);
    } else {
        printf("нет подходящей версии\n");
    }
    return 0;
}`,
      explanation: `
Ограничения версий — договор между проектом и библиотекой. Правило \`^\` («совместимые версии») опирается на семантическое версионирование: изменение MAJOR означает несовместимые изменения API, поэтому \`^1.4.0\` разрешает \`1.9.3\`, но не \`2.0.0\`. Для версий \`0.x\` API считается нестабильным, и граница проходит по MINOR.

Выбор наибольшей подходящей версии — то же, что делают vcpkg, Conan, Cargo и npm. Чтобы сборка не менялась со временем, выбранные версии дополнительно записывают в файл блокировки.`,
      examples: [
        { in: '>=1.2.0 <2.0.0\n1.0.0 1.2.0 1.9.5 2.0.0 1.10.1\n', out: 'выбрана 1.10.1\n' },
        { in: '^0.3.1\n0.3.0 0.3.9 0.4.0\n', out: 'выбрана 0.3.9\n' },
      ],
      hidden: [
        { in: '==1.0.0\n1.0.0 1.0.1\n', name: 'Точная версия' },
        { in: '>2.0.0\n1.0.0 2.0.0\n', name: 'Нет подходящей' },
        { in: '^1.4.0\n1.3.9 1.4.0 1.9.3 2.0.0\n', name: 'Каретка для 1.x' },
        { in: '<=1.5.0 >=1.5.0\n1.4.9 1.5.0 1.5.1\n', name: 'Отрезок из одной точки' },
        { in: '>=0.0.0\n3.2.1 10.0.0 9.9.9\n', name: 'Сравнение чисел, а не строк' },
        { in: '^0.0.5\n0.0.4 0.0.9 0.1.0\n', name: 'Каретка для 0.0.x' },
        { in: '>=1.0.0 <1.0.0\n1.0.0\n', name: 'Противоречивые ограничения' },
        { in: '<1000.0.0 ^999.1.0\n999.0.9 999.1.0 999.999.999\n', name: 'Большие номера' },
      ],
    },
    {
      title: 'Найди ошибку: база команд',
      bug: true,
      description: `
Программа формирует записи базы команд компиляции. Первая строка — каталоги заголовков через пробел (может быть пустой), дальше — исходные файлы. Для каждого файла выводится строка:

\`\`\`text
{"file": "src/a.c", "command": "cc -std=c23 -Iinclude -Ilib -c src/a.c"}
\`\`\`

На проектах с длинными путями AddressSanitizer сообщает об ошибке. Исправьте программу так, чтобы она работала с любым числом каталогов (до 20) любой длины (до 200 символов).`,
      constraints: ['До 20 каталогов, каждый до 200 символов; до 100 файлов до 255 символов.'],
      hints: [
        'Сколько байт нужно буферу flags для двух каталогов по 20 символов?',
        'Не копируйте флаги в буфер фиксированного размера: запомните указатели на каталоги (strtok уже разрезал строку) и печатайте -I для каждого при выводе команды.',
      ],
      starter: COMMANDS_BUGGY,
      solution: COMMANDS_FIXED,
      explanation: `
Флаги склеиваются в буфер \`char flags[32]\` через \`strcat\`, который не знает размера буфера. Два каталога с длинными путями не помещаются, и запись выходит за границу массива на стеке: \`stack-buffer-overflow\`. Без санитайзера программа могла бы «работать» и портить соседние переменные.

Буфер вообще не нужен: строка с каталогами уже лежит в \`line\`, и \`strtok\` разрезал её на отдельные строки. Достаточно запомнить указатели и печатать флаги при выводе каждой команды. Если склейка всё же нужна, используйте \`snprintf\` с размером буфера и проверяйте результат.`,
      examples: [
        {
          in: 'include lib\nsrc/a.c\nsrc/b.c\n',
          out: '{"file": "src/a.c", "command": "cc -std=c23 -Iinclude -Ilib -c src/a.c"}\n{"file": "src/b.c", "command": "cc -std=c23 -Iinclude -Ilib -c src/b.c"}\n',
        },
        {
          in: 'third_party/library/include project/include\nmain.c\n',
          out: '{"file": "main.c", "command": "cc -std=c23 -Ithird_party/library/include -Iproject/include -c main.c"}\n',
        },
      ],
      hidden: [
        '\nmain.c\n',
        'inc\n',
        'a b c d e f g h\nx.c\n',
        'very/long/path/to/some/include/directory\nsrc/main.c\nsrc/util.c\n',
        'include\nsrc/a.c\n',
        'one/two/three four/five/six seven/eight/nine\nf.c\n',
        'x\na.c b.c c.c\n',
        'external/googletest/googletest/include external/benchmark/include\ntest.c\n',
      ],
    },
    {
      title: 'Матрица CI',
      difficulty: 'advanced',
      description: `
Раскройте матрицу заданий CI. Ввод — строки трёх видов:

- \`axis имя значение₁ значение₂ …\` — ось матрицы (оси идут в порядке появления);
- \`exclude ключ=значение …\` — исключить сочетания, совпадающие по всем указанным ключам;
- \`include ключ=значение …\` — дополнительное задание, добавляемое после матрицы как есть.

Выведите задания матрицы в порядке перебора (первая ось меняется медленнее всех, последняя — быстрее), пропуская исключённые, в виде \`ось=значение ось=значение …\` в порядке осей. Затем выведите дополнительные задания в порядке появления (пары — как во вводе). В конце — \`заданий N\`.`,
      constraints: [
        'До 5 осей по 5 значений; до 10 строк exclude и до 10 include, в каждой до 5 пар; имена и значения до 31 символа без пробелов и знака «=».',
      ],
      hints: [
        'Перебор сочетаний: массив индексов idx[axes]; после каждого задания увеличьте последний индекс и переносите «единицу» влево, как при счёте.',
        'Сочетание исключено, если для какой-нибудь строки exclude каждая её пара ключ=значение совпадает со значением соответствующей оси.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

constexpr int MAX_AXES = 5;
constexpr int MAX_VALUES = 5;
constexpr int MAX_RULES = 10;
constexpr int MAX_PAIRS = 5;

typedef struct {
    char name[32];
    char values[MAX_VALUES][32];
    int count;
} Axis;

typedef struct {
    char key[MAX_PAIRS][32];
    char value[MAX_PAIRS][32];
    int count;
} Rule;

static Axis axes[MAX_AXES];
static int axis_count = 0;
static Rule excludes[MAX_RULES];
static int exclude_count = 0;
static Rule includes[MAX_RULES];
static int include_count = 0;

static void parse_rule(char *rest, Rule *rule) {
    rule->count = 0;
    for (char *tok = strtok(rest, " \n"); tok && rule->count < MAX_PAIRS; tok = strtok(nullptr, " \n")) {
        char *eq = strchr(tok, '=');
        if (!eq) {
            continue;
        }
        *eq = '\0';
        snprintf(rule->key[rule->count], sizeof rule->key[0], "%s", tok);
        snprintf(rule->value[rule->count], sizeof rule->value[0], "%s", eq + 1);
        ++rule->count;
    }
}

static bool excluded(const int idx[]) {
    for (int r = 0; r < exclude_count; ++r) {
        bool all = true;
        for (int p = 0; p < excludes[r].count && all; ++p) {
            bool matched = false;
            for (int a = 0; a < axis_count; ++a) {
                if (strcmp(axes[a].name, excludes[r].key[p]) == 0) {
                    matched = strcmp(axes[a].values[idx[a]], excludes[r].value[p]) == 0;
                }
            }
            all = matched;
        }
        if (all) {
            return true;
        }
    }
    return false;
}

int main(void) {
    char line[1024];
    while (fgets(line, sizeof line, stdin)) {
        char *kind = strtok(line, " \n");
        if (!kind) {
            continue;
        }
        char *rest = kind + strlen(kind) + 1;
        if (strcmp(kind, "axis") == 0 && axis_count < MAX_AXES) {
            Axis *axis = &axes[axis_count++];
            char *name = strtok(nullptr, " \n");
            snprintf(axis->name, sizeof axis->name, "%s", name ? name : "");
            axis->count = 0;
            for (char *v = strtok(nullptr, " \n"); v && axis->count < MAX_VALUES; v = strtok(nullptr, " \n")) {
                snprintf(axis->values[axis->count++], sizeof axis->values[0], "%s", v);
            }
        } else if (strcmp(kind, "exclude") == 0 && exclude_count < MAX_RULES) {
            parse_rule(rest, &excludes[exclude_count++]);
        } else if (strcmp(kind, "include") == 0 && include_count < MAX_RULES) {
            parse_rule(rest, &includes[include_count++]);
        }
    }

    int jobs = 0;
    int idx[MAX_AXES] = {0};
    bool empty = axis_count == 0;
    for (int a = 0; a < axis_count; ++a) {
        if (axes[a].count == 0) {
            empty = true;
        }
    }
    while (!empty) {
        if (!excluded(idx)) {
            for (int a = 0; a < axis_count; ++a) {
                printf("%s%s=%s", a ? " " : "", axes[a].name, axes[a].values[idx[a]]);
            }
            printf("\n");
            ++jobs;
        }
        int a = axis_count - 1;
        while (a >= 0 && ++idx[a] == axes[a].count) {
            idx[a] = 0;
            --a;
        }
        if (a < 0) {
            break;
        }
    }
    for (int r = 0; r < include_count; ++r) {
        for (int p = 0; p < includes[r].count; ++p) {
            printf("%s%s=%s", p ? " " : "", includes[r].key[p], includes[r].value[p]);
        }
        printf("\n");
        ++jobs;
    }
    printf("заданий %d\n", jobs);
    return 0;
}`,
      explanation: `
Матрица — декартово произведение осей: при двух компиляторах, двух режимах и двух санитайзерах получается восемь заданий, и каждое новое измерение умножает их число. \`exclude\` убирает бессмысленные или слишком дорогие сочетания, \`include\` добавляет отдельные — например, проверку Valgrind только для одного компилятора. Именно так раскрывают матрицу GitHub Actions и GitLab CI.

Перебор индексов «как счётчик» обходит все сочетания без рекурсии и для любого числа осей. Строка \`exclude\` с ключом, которого нет среди осей, не совпадает ни с одним сочетанием.`,
      examples: [
        {
          in: 'axis compiler gcc clang\naxis build Debug Release\nexclude compiler=clang build=Release\ninclude compiler=gcc build=Debug sanitizer=valgrind\n',
          out: 'compiler=gcc build=Debug\ncompiler=gcc build=Release\ncompiler=clang build=Debug\ncompiler=gcc build=Debug sanitizer=valgrind\nзаданий 4\n',
        },
        { in: 'axis os linux\n', out: 'os=linux\nзаданий 1\n' },
      ],
      hidden: [
        { in: '', name: 'Пустой ввод' },
        { in: 'include only=one\n', name: 'Только include' },
        { in: 'axis a 1 2 3\naxis b x y\n', name: 'Шесть сочетаний' },
        { in: 'axis a 1 2\naxis b x y\nexclude a=1\n', name: 'Исключение по одной оси' },
        { in: 'axis a 1 2\nexclude a=1\nexclude a=2\n', name: 'Всё исключено' },
        { in: 'axis a 1 2\nexclude c=3\n', name: 'Исключение по несуществующей оси' },
        {
          in: 'axis c gcc clang\naxis s none asan\naxis b Debug Release\nexclude c=clang s=none\n',
          name: 'Три оси',
        },
        {
          in: 'axis os linux macos\ninclude os=windows\ninclude os=freebsd arch=arm\n',
          name: 'Два include',
        },
      ],
    },
  ],
};
