export default {
  id: 'advanced-cmake',
  title: 'CMake',
  description:
    'CMakeLists.txt и цели, настройка и сборка вне исходников, add_executable и add_library, target_include_directories и target_link_libraries, видимость PUBLIC, PRIVATE и INTERFACE, типы сборки, стандарт языка и тесты через ctest.',
  moduleId: 'developer-tools',
  order: 8,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-makefile'],
  objectives: [
    'Описывать программу и библиотеку в CMakeLists.txt',
    'Настраивать и собирать проект вне каталога исходников',
    'Выбирать видимость PUBLIC, PRIVATE и INTERFACE для требований цели',
    'Выбирать тип сборки и подключать тесты через ctest',
  ],
  tags: ['CMake', 'Сборка', 'Цели', 'Библиотеки', 'ctest'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что делает CMake?',
      options: [
        'По описанию целей генерирует сборочную систему: Makefile, проект Ninja, Visual Studio',
        'Компилирует исходники вместо gcc',
        'Заменяет линковщик',
        'Устанавливает компилятор',
      ],
      correct: 0,
      explain:
        'Компилирует по-прежнему gcc или clang, а запускает их make или Ninja. CMake пишет для них инструкции.',
    },
    {
      q: 'Какая команда настраивает проект из текущего каталога со сборкой в каталоге build?',
      options: ['cmake -S . -B build', 'cmake --build build', 'make -C build', 'cmake build'],
      correct: 0,
      explain:
        '-S — каталог исходников, -B — каталог сборки. cmake --build build — уже следующий шаг.',
    },
    {
      q: 'Проект настроен в каталоге build. Какой командой CMake его собрать?',
      answers: ['cmake --build build', 'cmake --build build/', 'cmake --build ./build'],
      placeholder: 'Команда',
      explain:
        'cmake --build запускает сгенерированную систему сборки, не важно, Make это или Ninja.',
    },
    {
      q: 'Библиотека core объявила target_include_directories(core PRIVATE include). Программа app подключает core и в своём коде пишет #include "core.h" из include/. Что будет?',
      options: [
        'app не скомпилируется: каталог include не передаётся пользователям core',
        'Всё соберётся: каталоги библиотеки всегда видны программе',
        'Ошибка линковки',
        'CMake выдаст ошибку при настройке',
      ],
      correct: 0,
      explain:
        'PRIVATE — только для сборки самой core. Чтобы каталог получили пользователи, нужен PUBLIC (или INTERFACE).',
    },
    {
      q: 'Какие флаги добавляет CMAKE_BUILD_TYPE=Release для GCC?',
      options: ['-O3 -DNDEBUG', '-g', '-O0 -g', '-O2 -g -DNDEBUG'],
      correct: 0,
      explain: '-O2 -g -DNDEBUG — это RelWithDebInfo, -g — Debug.',
    },
    {
      q: 'Почему в современном CMake используют target_include_directories, а не глобальный include_directories?',
      options: [
        'Требования привязаны к цели и автоматически передаются тем, кто её подключает',
        'Глобальная команда не работает в CMake 3',
        'target_* быстрее собирается',
        'include_directories не поддерживает относительные пути',
      ],
      correct: 0,
      explain:
        'Глобальные настройки действуют на всё подряд и не переносятся вместе с библиотекой в другой проект.',
    },
    {
      q: 'В CMakeLists.txt написано только set(CMAKE_C_STANDARD 23). Какой флаг стандарта получит gcc?',
      answers: ['-std=gnu23'],
      placeholder: 'Флаг',
      explain:
        'По умолчанию CMAKE_C_EXTENSIONS включён. Для -std=c23 нужен set(CMAKE_C_EXTENSIONS OFF).',
    },
    {
      q: 'Что из этого нужно хранить в Git? Выберите все.',
      options: [
        'CMakeLists.txt',
        'Исходники src/ и include/',
        'Каталог build/',
        'build/CMakeCache.txt',
      ],
      correct: [0, 1],
      explain:
        'Всё в build/ генерируется заново командой cmake -S . -B build. CMakeCache.txt хранит пути конкретного компьютера.',
    },
    {
      q: 'Когда ctest считает тест, зарегистрированный add_test, пройденным?',
      options: [
        'Когда программа теста завершилась с кодом 0',
        'Когда программа ничего не вывела в stderr',
        'Когда программа вывела слово OK',
        'Когда программа собралась без предупреждений',
      ],
      correct: 0,
      explain:
        'Код завершения — договор между программой и инструментами. Тестовая программа возвращает ненулевой код при любом провале.',
    },
  ],
  exercises: [
    {
      title: 'Команда компиляции',
      difficulty: 'beginner',
      description: `
Смоделируйте, какую команду компиляции CMake сгенерирует для единственной программы. На вход до конца ввода подаются команды CMake по одной в строке (пустые строки возможны):

- \`set(CMAKE_BUILD_TYPE тип)\`, \`set(CMAKE_C_STANDARD N)\`, \`set(CMAKE_C_EXTENSIONS ON|OFF)\`;
- \`add_executable(имя файл₁ …)\`;
- \`target_compile_definitions\`, \`target_include_directories\`, \`target_compile_options\` — имя цели, затем значения, перед которыми стоят ключевые слова \`PRIVATE\`, \`PUBLIC\` или \`INTERFACE\`;
- остальные команды игнорируются.

Для каждого исходника из \`add_executable\` по порядку напечатайте:

\`\`\`
gcc <макросы> <каталоги> <флаги типа> <стандарт> <опции> -c <файл>
\`\`\`

- макросы — \`-DЗНАЧЕНИЕ\`, каталоги — \`-IКАТАЛОГ\`, опции — как есть, в порядке появления; значения с видимостью \`INTERFACE\` к самой цели не применяются;
- флаги типа: \`Debug\` — \`-g\`, \`Release\` — \`-O3 -DNDEBUG\`, \`RelWithDebInfo\` — \`-O2 -g -DNDEBUG\`, \`MinSizeRel\` — \`-Os -DNDEBUG\`, иначе ничего;
- стандарт печатается, только если задан \`CMAKE_C_STANDARD\`: \`-std=cN\` при \`CMAKE_C_EXTENSIONS OFF\`, иначе \`-std=gnuN\`.

Пустые части пропускаются; между частями — ровно один пробел.`,
      constraints: [
        'Не больше 30 строк, каждая — не длиннее 200 символов; значения не содержат пробелов и скобок.',
      ],
      hints: [
        'Разбор строки: найдите ( и последнюю ), имя команды — текст до (, аргументы — слова между скобками (strtok по пробелам).',
        'Копите части команды в строках defines, includes, options. Ключевые слова видимости меняют текущий режим и сами в команду не попадают.',
        'Напишите функцию add(char *out, const char *text), которая дописывает пробел и text, только если text не пустой.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 256
#define LIST 2048

static void add(char *out, const char *text) {
    if (text[0] == '\0') {
        return;
    }
    if (out[0] != '\0') {
        strcat(out, " ");
    }
    strcat(out, text);
}

static int parse(char *line, char **command, char *args[]) {
    char *open = strchr(line, '(');
    char *close = strrchr(line, ')');
    if (open == NULL || close == NULL || close < open) {
        return -1;
    }
    *open = '\0';
    *close = '\0';
    *command = line;
    while (**command == ' ') {
        (*command)++;
    }
    int count = 0;
    for (char *word = strtok(open + 1, " \t"); word != NULL; word = strtok(NULL, " \t")) {
        args[count++] = word;
    }
    return count;
}

static int is_visibility(const char *word) {
    return strcmp(word, "PRIVATE") == 0 || strcmp(word, "PUBLIC") == 0 ||
           strcmp(word, "INTERFACE") == 0;
}

int main(void) {
    static char defines[LIST];
    static char includes[LIST];
    static char options[LIST];
    static char sources[64][LINE];
    int source_count = 0;
    char build_type[LINE] = "";
    char standard[LINE] = "";
    int extensions = 1;
    char line[LINE];
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        char *command;
        char *args[64];
        int count = parse(line, &command, args);
        if (count < 1) {
            continue;
        }
        if (strcmp(command, "set") == 0 && count >= 2) {
            if (strcmp(args[0], "CMAKE_BUILD_TYPE") == 0) {
                strcpy(build_type, args[1]);
            } else if (strcmp(args[0], "CMAKE_C_STANDARD") == 0) {
                strcpy(standard, args[1]);
            } else if (strcmp(args[0], "CMAKE_C_EXTENSIONS") == 0) {
                extensions = strcmp(args[1], "OFF") != 0;
            }
        } else if (strcmp(command, "add_executable") == 0) {
            for (int i = 1; i < count && source_count < 64; i++) {
                strcpy(sources[source_count++], args[i]);
            }
        } else if (strcmp(command, "target_compile_definitions") == 0 ||
                   strcmp(command, "target_include_directories") == 0 ||
                   strcmp(command, "target_compile_options") == 0) {
            int is_define = strcmp(command, "target_compile_definitions") == 0;
            int is_include = strcmp(command, "target_include_directories") == 0;
            int applies = 1;
            for (int i = 1; i < count; i++) {
                if (is_visibility(args[i])) {
                    applies = strcmp(args[i], "INTERFACE") != 0;
                    continue;
                }
                if (!applies) {
                    continue;
                }
                char item[LINE + 2];
                if (is_define) {
                    snprintf(item, sizeof item, "-D%s", args[i]);
                    add(defines, item);
                } else if (is_include) {
                    snprintf(item, sizeof item, "-I%s", args[i]);
                    add(includes, item);
                } else {
                    add(options, args[i]);
                }
            }
        }
    }
    const char *type_flags = "";
    if (strcmp(build_type, "Debug") == 0) {
        type_flags = "-g";
    } else if (strcmp(build_type, "Release") == 0) {
        type_flags = "-O3 -DNDEBUG";
    } else if (strcmp(build_type, "RelWithDebInfo") == 0) {
        type_flags = "-O2 -g -DNDEBUG";
    } else if (strcmp(build_type, "MinSizeRel") == 0) {
        type_flags = "-Os -DNDEBUG";
    }
    char std_flag[LINE + 16] = "";
    if (standard[0] != '\0') {
        snprintf(std_flag, sizeof std_flag, "-std=%s%s", extensions ? "gnu" : "c", standard);
    }
    for (int i = 0; i < source_count; i++) {
        static char out[4 * LIST];
        strcpy(out, "gcc");
        add(out, defines);
        add(out, includes);
        add(out, type_flags);
        add(out, std_flag);
        add(out, options);
        add(out, "-c");
        add(out, sources[i]);
        puts(out);
    }
    return 0;
}`,
      explanation: `
CMake не придумывает флаги — он собирает их из свойств цели: макросов, каталогов, опций, стандарта и типа сборки. Если сборка ведёт себя странно, первым делом посмотрите на итоговую команду: \`cmake --build build --verbose\`.

Видимость работает уже на уровне одной цели: \`INTERFACE\`-требование описывает, что нужно **пользователям** цели, и к её собственной компиляции не применяется. А тип сборки — единственный параметр, который выбирается при настройке, а не в \`CMakeLists.txt\`: один и тот же файл даёт и отладочную, и выпускную сборку.`,
      examples: [
        {
          in: 'cmake_minimum_required(VERSION 3.25)\nproject(app LANGUAGES C)\nset(CMAKE_C_STANDARD 23)\nset(CMAKE_C_EXTENSIONS OFF)\nset(CMAKE_BUILD_TYPE Release)\nadd_executable(app src/main.c src/util.c)\ntarget_include_directories(app PRIVATE include)\ntarget_compile_options(app PRIVATE -Wall -Wextra)\n',
          out: 'gcc -Iinclude -O3 -DNDEBUG -std=c23 -Wall -Wextra -c src/main.c\ngcc -Iinclude -O3 -DNDEBUG -std=c23 -Wall -Wextra -c src/util.c\n',
        },
        { in: 'add_executable(hello hello.c)\n', out: 'gcc -c hello.c\n' },
      ],
      hidden: [
        {
          in: 'set(CMAKE_C_STANDARD 11)\nadd_executable(a a.c)\n',
          name: 'Расширения по умолчанию',
        },
        { in: 'set(CMAKE_BUILD_TYPE Debug)\nadd_executable(a a.c)\n', name: 'Debug' },
        {
          in: 'set(CMAKE_BUILD_TYPE RelWithDebInfo)\nadd_executable(a a.c)\n',
          name: 'RelWithDebInfo',
        },
        { in: 'set(CMAKE_BUILD_TYPE MinSizeRel)\nadd_executable(a a.c)\n', name: 'MinSizeRel' },
        { in: 'set(CMAKE_BUILD_TYPE Fast)\nadd_executable(a a.c)\n', name: 'Неизвестный тип' },
        {
          in: 'add_executable(app main.c)\ntarget_compile_definitions(app PRIVATE USE_COLOR LIMIT=5 INTERFACE APP_API)\n',
          name: 'Макросы и INTERFACE',
        },
        {
          in: 'add_executable(app main.c)\ntarget_include_directories(app PUBLIC include PRIVATE src INTERFACE api)\n\nset(CMAKE_C_EXTENSIONS OFF)\n',
          name: 'Порядок команд и пустая строка',
        },
        {
          in: 'set(CMAKE_C_STANDARD 23)\nset(CMAKE_C_EXTENSIONS OFF)\nset(CMAKE_BUILD_TYPE Debug)\nadd_executable(calc src/main.c src/lexer.c src/parser.c)\ntarget_compile_options(calc PRIVATE -Wall -Wextra -Wpedantic)\ntarget_compile_definitions(calc PRIVATE CALC_DEBUG)\ntarget_include_directories(calc PRIVATE include third_party)\n',
          name: 'Полный проект',
        },
        {
          in: 'set(CMAKE_C_STANDARD 99)\nset(CMAKE_C_EXTENSIONS ON)\nadd_executable(old legacy.c)\ntarget_compile_options(old PRIVATE -w)\n',
          name: 'Явно включённые расширения',
        },
      ],
    },
    {
      title: 'PUBLIC и PRIVATE',
      description: `
Вычислите, с какими каталогами заголовков компилируется каждая цель. На вход до конца ввода подаются команды CMake:

- \`add_library(имя STATIC|SHARED файлы…)\` и \`add_executable(имя файлы…)\` объявляют цели;
- \`target_include_directories(цель ВИДИМОСТЬ каталоги… ВИДИМОСТЬ каталоги…)\`;
- \`target_link_libraries(цель ВИДИМОСТЬ имена…)\` — имена, не являющиеся целями (например, \`m\`), на каталоги не влияют.

Видимость — \`PRIVATE\`, \`PUBLIC\` или \`INTERFACE\`; она всегда стоит перед значениями.

**Интерфейс** цели — её каталоги \`PUBLIC\` и \`INTERFACE\` плюс интерфейсы целей, связанных с ней как \`PUBLIC\` или \`INTERFACE\`. **Каталоги компиляции** цели — её каталоги \`PRIVATE\` и \`PUBLIC\` плюс интерфейсы целей, связанных с ней как \`PRIVATE\` или \`PUBLIC\`.

Для каждой цели в порядке объявления напечатайте \`имя: каталоги\` — свои каталоги в порядке появления, затем каталоги связей в порядке связей, каждый каталог один раз. Если каталогов нет — \`имя: -\`.`,
      constraints: [
        'Не больше 20 целей и 50 строк; строки не длиннее 200 символов.',
        'Связи не образуют циклов.',
      ],
      hints: [
        'Сохраните для каждой цели списки «каталог + видимость» и «связь + видимость» в порядке появления команд.',
        'Напишите рекурсивную функцию interface(target, out): свои PUBLIC и INTERFACE каталоги, затем interface() целей из PUBLIC- и INTERFACE-связей. Функция add_unique добавляет каталог, если его ещё нет в out.',
        'Каталоги компиляции: свои PRIVATE и PUBLIC каталоги, затем interface() целей из PRIVATE- и PUBLIC-связей.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 256
#define TARGETS 20
#define ITEMS 20
#define NAME 64

enum { PRIVATE_VIS, PUBLIC_VIS, INTERFACE_VIS };

typedef struct {
    char name[NAME];
    char dirs[ITEMS][NAME];
    int dir_vis[ITEMS];
    int dir_count;
    char links[ITEMS][NAME];
    int link_vis[ITEMS];
    int link_count;
} Target;

static Target targets[TARGETS];
static int target_count;

static int find(const char *name) {
    for (int i = 0; i < target_count; i++) {
        if (strcmp(targets[i].name, name) == 0) {
            return i;
        }
    }
    return -1;
}

static int visibility(const char *word) {
    if (strcmp(word, "PRIVATE") == 0) {
        return PRIVATE_VIS;
    }
    if (strcmp(word, "PUBLIC") == 0) {
        return PUBLIC_VIS;
    }
    if (strcmp(word, "INTERFACE") == 0) {
        return INTERFACE_VIS;
    }
    return -1;
}

static void add_unique(char list[][NAME], int *count, const char *dir) {
    for (int i = 0; i < *count; i++) {
        if (strcmp(list[i], dir) == 0) {
            return;
        }
    }
    strcpy(list[(*count)++], dir);
}

static void interface(int t, char out[][NAME], int *count) {
    const Target *target = &targets[t];
    for (int i = 0; i < target->dir_count; i++) {
        if (target->dir_vis[i] != PRIVATE_VIS) {
            add_unique(out, count, target->dirs[i]);
        }
    }
    for (int i = 0; i < target->link_count; i++) {
        int other = find(target->links[i]);
        if (other >= 0 && target->link_vis[i] != PRIVATE_VIS) {
            interface(other, out, count);
        }
    }
}

int main(void) {
    char line[LINE];
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        char *open = strchr(line, '(');
        char *close = strrchr(line, ')');
        if (open == NULL || close == NULL || close < open) {
            continue;
        }
        *open = '\0';
        *close = '\0';
        char *args[64];
        int count = 0;
        for (char *word = strtok(open + 1, " \t"); word != NULL; word = strtok(NULL, " \t")) {
            args[count++] = word;
        }
        if (count == 0) {
            continue;
        }
        if (strcmp(line, "add_library") == 0 || strcmp(line, "add_executable") == 0) {
            if (target_count < TARGETS && find(args[0]) < 0) {
                strcpy(targets[target_count++].name, args[0]);
            }
            continue;
        }
        int is_dirs = strcmp(line, "target_include_directories") == 0;
        int is_links = strcmp(line, "target_link_libraries") == 0;
        int t = find(args[0]);
        if ((!is_dirs && !is_links) || t < 0) {
            continue;
        }
        Target *target = &targets[t];
        int mode = PRIVATE_VIS;
        for (int i = 1; i < count; i++) {
            int vis = visibility(args[i]);
            if (vis >= 0) {
                mode = vis;
            } else if (is_dirs && target->dir_count < ITEMS) {
                strcpy(target->dirs[target->dir_count], args[i]);
                target->dir_vis[target->dir_count++] = mode;
            } else if (is_links && target->link_count < ITEMS) {
                strcpy(target->links[target->link_count], args[i]);
                target->link_vis[target->link_count++] = mode;
            }
        }
    }
    for (int t = 0; t < target_count; t++) {
        static char out[TARGETS * ITEMS][NAME];
        int out_count = 0;
        const Target *target = &targets[t];
        for (int i = 0; i < target->dir_count; i++) {
            if (target->dir_vis[i] != INTERFACE_VIS) {
                add_unique(out, &out_count, target->dirs[i]);
            }
        }
        for (int i = 0; i < target->link_count; i++) {
            int other = find(target->links[i]);
            if (other >= 0 && target->link_vis[i] != INTERFACE_VIS) {
                interface(other, out, &out_count);
            }
        }
        printf("%s:", target->name);
        if (out_count == 0) {
            printf(" -");
        }
        for (int i = 0; i < out_count; i++) {
            printf(" %s", out[i]);
        }
        putchar('\n');
    }
    return 0;
}`,
      explanation: `
Две рекурсивные половины решения соответствуют двум вопросам о цели: «с чем компилируюсь **я**» и «что я **обещаю** тем, кто меня подключит». \`PRIVATE\` отвечает только на первый, \`INTERFACE\` — только на второй, \`PUBLIC\` — на оба.

Цепочка распространяется, пока связи \`PUBLIC\`: если \`app\` подключает \`net\`, а \`net\` публично подключает \`core\`, то \`app\` получит каталоги \`core\`. Если же \`net\` подключает \`core\` как \`PRIVATE\`, каталоги \`core\` остаются внутренним делом \`net\`. Правильная видимость сокращает команды компиляции и не даёт коду случайно зависеть от того, что ему не обещали.`,
      examples: [
        {
          in: 'add_library(core STATIC src/core.c)\ntarget_include_directories(core PUBLIC include PRIVATE src)\nadd_executable(app src/main.c)\ntarget_link_libraries(app PRIVATE core m)\n',
          out: 'core: include src\napp: include\n',
        },
        {
          in: 'add_library(core STATIC c.c)\ntarget_include_directories(core PUBLIC core_inc)\nadd_library(net STATIC n.c)\ntarget_include_directories(net PUBLIC net_inc)\ntarget_link_libraries(net PRIVATE core)\nadd_executable(app main.c)\ntarget_link_libraries(app PRIVATE net)\n',
          out: 'core: core_inc\nnet: net_inc core_inc\napp: net_inc\n',
        },
      ],
      hidden: [
        { in: 'add_executable(solo main.c)\n', name: 'Без каталогов' },
        {
          in: 'add_library(core STATIC c.c)\ntarget_include_directories(core PUBLIC core_inc)\nadd_library(net STATIC n.c)\ntarget_link_libraries(net PUBLIC core)\nadd_executable(app main.c)\ntarget_link_libraries(app PRIVATE net)\n',
          name: 'PUBLIC-цепочка',
        },
        {
          in: 'add_library(api STATIC a.c)\ntarget_include_directories(api INTERFACE api_inc PRIVATE impl)\nadd_executable(app main.c)\ntarget_link_libraries(app PUBLIC api)\n',
          name: 'INTERFACE-каталог',
        },
        {
          in: 'add_library(base STATIC b.c)\ntarget_include_directories(base PUBLIC base_inc)\nadd_library(wrap STATIC w.c)\ntarget_link_libraries(wrap INTERFACE base)\nadd_executable(app main.c)\ntarget_link_libraries(app PRIVATE wrap)\n',
          name: 'INTERFACE-связь',
        },
        {
          in: 'add_library(a STATIC a.c)\ntarget_include_directories(a PUBLIC shared a_inc)\nadd_library(b STATIC b.c)\ntarget_include_directories(b PUBLIC shared b_inc)\nadd_executable(app main.c)\ntarget_include_directories(app PRIVATE shared)\ntarget_link_libraries(app PRIVATE a b)\n',
          name: 'Повторы каталогов',
        },
        {
          in: 'add_executable(app main.c)\ntarget_link_libraries(app PRIVATE core)\nadd_library(core STATIC c.c)\ntarget_include_directories(core PUBLIC inc)\n',
          name: 'Цель объявлена позже',
        },
        {
          in: 'add_library(x SHARED x.c)\ntarget_include_directories(x PRIVATE p1 PUBLIC q1 PRIVATE p2 PUBLIC q2)\nadd_executable(app main.c)\ntarget_link_libraries(app PRIVATE x pthread m)\n',
          name: 'Чередование видимости',
        },
        {
          in: 'add_library(l1 STATIC a.c)\ntarget_include_directories(l1 PUBLIC i1)\nadd_library(l2 STATIC b.c)\ntarget_include_directories(l2 PUBLIC i2)\ntarget_link_libraries(l2 PUBLIC l1)\nadd_library(l3 STATIC c.c)\ntarget_include_directories(l3 PUBLIC i3)\ntarget_link_libraries(l3 PUBLIC l2)\nadd_executable(app main.c)\ntarget_link_libraries(app PRIVATE l3)\n',
          name: 'Длинная цепочка',
        },
        {
          in: 'add_library(core STATIC c.c)\ntarget_include_directories(core PUBLIC include)\nadd_executable(calc main.c)\ntarget_link_libraries(calc PRIVATE core)\nadd_executable(calc_tests t.c)\ntarget_include_directories(calc_tests PRIVATE tests)\ntarget_link_libraries(calc_tests PRIVATE core)\n',
          name: 'Программа и тесты',
        },
      ],
    },
    {
      title: 'Шаги параллельной сборки',
      difficulty: 'advanced',
      description: `
При \`cmake --build build -j\` независимые цели собираются одновременно, но библиотека должна быть готова раньше целей, которые с ней связаны. Разбейте цели на шаги.

На вход до конца ввода подаются команды \`add_library(имя …)\`, \`add_executable(имя …)\` и \`target_link_libraries(цель ВИДИМОСТЬ имена…)\`. Связь с именем, которое не является целью, не учитывается; видимость на порядок не влияет.

Шаг цели — 1, если она не связана с другими целями, иначе 1 + наибольший шаг среди целей, с которыми она связана. Напечатайте \`шаг K: цели\` для K = 1, 2, … — цели шага в порядке объявления через пробел. Если связи образуют цикл, напечатайте только \`ошибка: циклическая зависимость\`.`,
      constraints: ['Не больше 20 целей и 50 строк; строки не длиннее 200 символов.'],
      hints: [
        'Сначала прочитайте все команды, затем считайте шаги: связь может ссылаться на цель, объявленную ниже.',
        'Шаг считайте рекурсивно с запоминанием: level(t) = 1 + max(level(d)). Состояние «вычисляется сейчас» позволяет заметить цикл.',
        'Для вывода переберите K от 1 до максимального шага и для каждого — цели в порядке объявления.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 256
#define TARGETS 20
#define NAME 64

static char names[TARGETS][NAME];
static char links[TARGETS][40][NAME];
static int link_count[TARGETS];
static int levels[TARGETS];
static int state[TARGETS];
static int target_count;
static int has_cycle;

static int find(const char *name) {
    for (int i = 0; i < target_count; i++) {
        if (strcmp(names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static int level(int t) {
    if (state[t] == 2) {
        return levels[t];
    }
    if (state[t] == 1) {
        has_cycle = 1;
        return 0;
    }
    state[t] = 1;
    int best = 0;
    for (int i = 0; i < link_count[t]; i++) {
        int other = find(links[t][i]);
        if (other >= 0) {
            int value = level(other);
            if (value > best) {
                best = value;
            }
        }
    }
    state[t] = 2;
    levels[t] = best + 1;
    return levels[t];
}

int main(void) {
    char line[LINE];
    static char pending_owner[50][NAME];
    static char pending_line[50][LINE];
    int pending = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        char *open = strchr(line, '(');
        char *close = strrchr(line, ')');
        if (open == NULL || close == NULL || close < open) {
            continue;
        }
        *open = '\0';
        *close = '\0';
        char *first = strtok(open + 1, " \t");
        if (first == NULL) {
            continue;
        }
        if (strcmp(line, "add_library") == 0 || strcmp(line, "add_executable") == 0) {
            if (target_count < TARGETS && find(first) < 0) {
                strcpy(names[target_count++], first);
            }
        } else if (strcmp(line, "target_link_libraries") == 0 && pending < 50) {
            strcpy(pending_owner[pending], first);
            char *rest = strtok(NULL, "");
            strcpy(pending_line[pending], rest != NULL ? rest : "");
            pending++;
        }
    }
    for (int p = 0; p < pending; p++) {
        int t = find(pending_owner[p]);
        if (t < 0) {
            continue;
        }
        for (char *word = strtok(pending_line[p], " \t"); word != NULL;
             word = strtok(NULL, " \t")) {
            if (strcmp(word, "PRIVATE") != 0 && strcmp(word, "PUBLIC") != 0 &&
                strcmp(word, "INTERFACE") != 0 && link_count[t] < 40) {
                strcpy(links[t][link_count[t]++], word);
            }
        }
    }
    int max_level = 0;
    for (int t = 0; t < target_count; t++) {
        int value = level(t);
        if (value > max_level) {
            max_level = value;
        }
    }
    if (has_cycle) {
        printf("ошибка: циклическая зависимость\n");
        return 0;
    }
    for (int k = 1; k <= max_level; k++) {
        printf("шаг %d:", k);
        for (int t = 0; t < target_count; t++) {
            if (levels[t] == k) {
                printf(" %s", names[t]);
            }
        }
        putchar('\n');
    }
    return 0;
}`,
      explanation: `
Шаг цели — длина самой длинной цепочки зависимостей под ней. Все цели одного шага не зависят друг от друга, поэтому их можно собирать одновременно, а следующий шаг начинается, когда готовы все нужные ему библиотеки. Число шагов — нижняя граница времени сборки при любом числе ядер: длинную цепочку библиотек не ускорит даже \`-j64\`.

Связи сохраняются до конца чтения, потому что в CMake \`target_link_libraries\` может ссылаться на цель, объявленную ниже, — граф известен только целиком. Запоминание шагов (\`state\` и \`levels\`) делает подсчёт линейным: каждая цель вычисляется один раз.`,
      examples: [
        {
          in: 'add_library(lexer STATIC lexer.c)\nadd_library(parser STATIC parser.c)\ntarget_link_libraries(parser PUBLIC lexer)\nadd_executable(calc main.c)\ntarget_link_libraries(calc PRIVATE parser m)\nadd_executable(lexer_tests t.c)\ntarget_link_libraries(lexer_tests PRIVATE lexer)\n',
          out: 'шаг 1: lexer\nшаг 2: parser lexer_tests\nшаг 3: calc\n',
        },
        {
          in: 'add_library(a STATIC a.c)\nadd_library(b STATIC b.c)\ntarget_link_libraries(a PRIVATE b)\ntarget_link_libraries(b PRIVATE a)\n',
          out: 'ошибка: циклическая зависимость\n',
        },
      ],
      hidden: [
        { in: 'add_executable(app main.c)\n', name: 'Одна цель' },
        {
          in: 'add_library(a STATIC a.c)\nadd_library(b STATIC b.c)\nadd_executable(c c.c)\n',
          name: 'Всё независимо',
        },
        {
          in: 'add_executable(app main.c)\ntarget_link_libraries(app PRIVATE core)\nadd_library(core STATIC c.c)\n',
          name: 'Цель объявлена позже',
        },
        {
          in: 'add_library(a STATIC a.c)\nadd_library(b STATIC b.c)\nadd_library(c STATIC c.c)\nadd_library(d STATIC d.c)\ntarget_link_libraries(b PUBLIC a)\ntarget_link_libraries(c PUBLIC b)\ntarget_link_libraries(d PUBLIC c)\n',
          name: 'Цепочка',
        },
        {
          in: 'add_library(util STATIC u.c)\nadd_library(net STATIC n.c)\nadd_library(ui STATIC i.c)\ntarget_link_libraries(net PRIVATE util)\ntarget_link_libraries(ui PRIVATE util)\nadd_executable(app main.c)\ntarget_link_libraries(app PRIVATE net ui util)\n',
          name: 'Ромб',
        },
        {
          in: 'add_library(self STATIC s.c)\ntarget_link_libraries(self PRIVATE self)\n',
          name: 'Связь с собой',
        },
        {
          in: 'add_executable(app main.c)\ntarget_link_libraries(app PRIVATE m pthread dl)\n',
          name: 'Только системные библиотеки',
        },
        {
          in: 'add_library(a STATIC a.c)\nadd_library(b STATIC b.c)\nadd_library(c STATIC c.c)\ntarget_link_libraries(a PRIVATE b)\ntarget_link_libraries(b PRIVATE c)\ntarget_link_libraries(c PRIVATE a)\nadd_executable(app main.c)\n',
          name: 'Длинный цикл',
        },
        {
          in: 'add_library(core STATIC c.c)\nadd_executable(t1 t1.c)\nadd_executable(t2 t2.c)\nadd_executable(t3 t3.c)\ntarget_link_libraries(t1 PRIVATE core)\ntarget_link_libraries(t2 PRIVATE core)\ntarget_link_libraries(t3 PRIVATE t1 core)\n',
          name: 'Тесты на одной библиотеке',
        },
      ],
    },
  ],
};
