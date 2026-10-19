export default {
  id: 'compilation-stages',
  title: 'Этапы компиляции',
  description:
    'Четыре стадии сборки — препроцессор, компиляция, ассемблирование, линковка; флаги -E, -S, -c и -o, промежуточные файлы, раздельная компиляция и определение стадии по тексту ошибки.',
  moduleId: 'developer-tools',
  order: 2,
  difficulty: 'beginner',
  estimatedMinutes: 50,
  prerequisites: ['terminal-basics'],
  objectives: [
    'Называть четыре стадии сборки, их входы и выходы',
    'Останавливать сборку после нужной стадии флагами -E, -S и -c',
    'Собирать программу из нескольких файлов раздельной компиляцией',
    'Определять по сообщению об ошибке, какая стадия её выдала',
  ],
  tags: ['Сборка', 'GCC', 'Препроцессор', 'Линковка', 'Объектный файл'],
  standard: 'c23',
  quiz: [
    {
      q: 'Какой флаг останавливает сборку сразу после препроцессора?',
      options: ['-E', '-S', '-c', '-o'],
      correct: 0,
      explain:
        '-E — только препроцессор, -S — до ассемблера, -c — до объектного файла, а -o задаёт имя результата.',
    },
    {
      q: 'Какой файл создаст команда gcc -c src/net/socket.c, запущенная в корне проекта?',
      answers: ['socket.o'],
      placeholder: 'Имя файла',
      explain:
        'Имя результата берётся из имени исходника без каталогов, а файл появляется в текущем каталоге.',
    },
    {
      q: 'Какую стадию выдала ошибку?',
      code:
        String.raw`
/usr/bin/ld: /tmp/ccN1c2.o: in function ` +
        '`main' +
        `':
main.c:(.text+0x1a): undefined reference to ` +
        '`load_table' +
        `'
collect2: error: ld returned 1 exit status`,
      lang: 'text',
      options: ['Линковка', 'Препроцессор', 'Компиляция', 'Ассемблирование'],
      correct: 0,
      explain:
        'undefined reference, ld и collect2 — признаки линковщика: каждый файл скомпилировался, но определения load_table нет ни в одном из переданных файлов.',
    },
    {
      q: 'Какую стадию выдала ошибку main.c:3:10: fatal error: config.h: No such file or directory?',
      options: ['Препроцессор', 'Компиляция', 'Линковка', 'Запуск программы'],
      correct: 0,
      explain:
        'Файлы из #include ищет препроцессор. Сборка прекращается сразу: без заголовка дальше идти нельзя.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#define DOUBLE(x) x + x

int main(void) {
    printf("%d\n", DOUBLE(3) * 2);
    return 0;
}`,
      answers: ['9'],
      placeholder: 'Вывод программы',
      explain:
        'Препроцессор подставляет текст, не зная о приоритетах: получается 3 + 3 * 2 = 9. Именно это видно в выводе gcc -E.',
    },
    {
      q: 'Что содержится в объектном файле main.o? Выберите все.',
      options: [
        'Машинный код функций из main.c',
        'Таблица символов: какие имена файл определяет, а какие использует',
        'Уже подставленный адрес функции printf',
        'Комментарии из исходника',
        'Код запуска, который вызывает main',
      ],
      correct: [0, 1],
      explain:
        'Адреса внешних функций и код запуска добавляет линковщик. Комментарии удалил ещё препроцессор.',
    },
    {
      q: 'Программа собрана из main.o и parser.o. Вы изменили только parser.c. Какие команды обновят программу без лишней работы?',
      options: [
        'gcc -c parser.c && gcc main.o parser.o -o calc',
        'gcc main.o parser.o -o calc',
        'gcc -c main.c && gcc main.o parser.o -o calc',
        'gcc -E parser.c && gcc main.o parser.o -o calc',
      ],
      correct: 0,
      explain:
        'Устарел только parser.o — его и нужно пересобрать, а затем перелинковать. Без пересборки линковщик возьмёт старый parser.o.',
    },
    {
      q: 'Зачем в выводе gcc -E строки вида # 6 "main.c"?',
      options: [
        'Чтобы компилятор указывал в ошибках строки исходного файла, а не раскрытого текста',
        'Это закомментированные директивы #include',
        'Они нумеруют функции для линковщика',
        'Это ошибки препроцессора',
      ],
      correct: 0,
      explain:
        'После вставки заголовков нумерация строк сбивается на сотни. Метки восстанавливают связь с исходным файлом и строкой.',
    },
    {
      q: 'Какой файл создаст команда gcc -S -O2 filter.c?',
      answers: ['filter.s'],
      placeholder: 'Имя файла',
      explain:
        '-S останавливает сборку после компиляции в ассемблер; результат — текстовый файл с расширением .s.',
    },
  ],
  exercises: [
    {
      title: 'Имя выходного файла',
      difficulty: 'beginner',
      description: `
Дана команда компилятора в одной строке: имя компилятора (\`gcc\` или \`clang\`) и аргументы через пробел. Определите, на какой стадии остановится сборка и какие файлы появятся.

Правила:
- \`-E\` — стадия \`препроцессор\`, \`-S\` — \`компиляция\`, \`-c\` — \`ассемблирование\`, без них — \`линковка\`. Если указано несколько, работает самая ранняя стадия.
- \`-o имя\` задаёт имя результата. Остальные аргументы, начинающиеся с \`-\`, на ответ не влияют.
- Все прочие аргументы — входные файлы.

Напечатайте \`стадия: …\`, затем по строке \`файл: …\` на каждый результат:
- при линковке результат один — имя из \`-o\` или \`a.out\`;
- для \`-E\` без \`-o\` результат идёт в терминал: \`файл: stdout\`;
- для \`-S\` и \`-c\` без \`-o\` каждый входной файл даёт свой результат: имя без каталогов, расширение заменено на \`.s\` или \`.o\`;
- если при \`-E\`, \`-S\` или \`-c\` указан \`-o\` и входных файлов больше одного, вместо файлов напечатайте \`ошибка: -o с несколькими входными файлами\`.`,
      constraints: [
        'В команде от 2 до 20 слов, каждое — не длиннее 100 символов.',
        'Есть хотя бы один входной файл; у входных файлов есть расширение.',
      ],
      hints: [
        'Читайте слова через scanf("%127s", word). Первое слово — имя компилятора. Входные файлы сохраните в массив: char inputs[20][128].',
        'Стадию храните числом: 1 — препроцессор, 2 — компиляция, 3 — ассемблирование, 4 — линковка. Флаг устанавливает стадию, только если она раньше текущей.',
        "Имя без каталога — всё после последнего /: strrchr(path, '/'). Расширение — после последней точки в этом имени: strrchr(base, '.').",
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define WORD 128

static void print_object(const char *path, const char *extension) {
    const char *slash = strrchr(path, '/');
    const char *base = slash != NULL ? slash + 1 : path;
    const char *dot = strrchr(base, '.');
    int length = dot != NULL ? (int)(dot - base) : (int)strlen(base);
    printf("файл: %.*s%s\n", length, base, extension);
}

int main(void) {
    static const char *names[] = {"", "препроцессор", "компиляция", "ассемблирование", "линковка"};
    char word[WORD];
    char inputs[20][WORD];
    char output[WORD] = "";
    int count = 0;
    int stage = 4;
    if (scanf("%127s", word) != 1) {
        return 0;
    }
    while (scanf("%127s", word) == 1) {
        int flag_stage = 0;
        if (strcmp(word, "-E") == 0) {
            flag_stage = 1;
        } else if (strcmp(word, "-S") == 0) {
            flag_stage = 2;
        } else if (strcmp(word, "-c") == 0) {
            flag_stage = 3;
        }
        if (flag_stage != 0) {
            if (flag_stage < stage) {
                stage = flag_stage;
            }
        } else if (strcmp(word, "-o") == 0) {
            if (scanf("%127s", output) != 1) {
                output[0] = '\0';
            }
        } else if (word[0] != '-' && count < 20) {
            strcpy(inputs[count], word);
            count++;
        }
    }
    printf("стадия: %s\n", names[stage]);
    if (stage == 4) {
        printf("файл: %s\n", output[0] != '\0' ? output : "a.out");
    } else if (output[0] != '\0') {
        if (count > 1) {
            printf("ошибка: -o с несколькими входными файлами\n");
        } else {
            printf("файл: %s\n", output);
        }
    } else if (stage == 1) {
        printf("файл: stdout\n");
    } else {
        for (int i = 0; i < count; i++) {
            print_object(inputs[i], stage == 2 ? ".s" : ".o");
        }
    }
    return 0;
}`,
      explanation: `
Флаги стадии не взаимоисключающие: \`gcc -S -c\` — не ошибка, а «остановиться как можно раньше», то есть после компиляции. Поэтому стадия хранится числом, и флаг может только уменьшить его.

Имя результата строится из **базового имени** исходника: каталоги отбрасываются, поэтому \`gcc -c src/util.c\` пишет \`util.o\` в текущий каталог. Расширение ищется в базовом имени, а не во всём пути — иначе путь \`lib/v1.2/io.c\` превратился бы в \`v1.o\`.

Ограничение с \`-o\` реальное: на \`gcc -c a.c b.c -o x.o\` настоящий gcc отвечает \`cannot specify '-o' with '-c', '-S' or '-E' with multiple files\` — два объектных файла нельзя записать в одно имя.`,
      examples: [
        { in: 'gcc main.c\n', out: 'стадия: линковка\nфайл: a.out\n' },
        { in: 'gcc -c src/util.c\n', out: 'стадия: ассемблирование\nфайл: util.o\n' },
      ],
      hidden: [
        { in: 'gcc -std=c23 -Wall main.c -o app\n', name: 'Обычная сборка' },
        { in: 'clang -S -O2 square.c\n', name: 'Ассемблер' },
        { in: 'gcc -E main.c\n', name: 'Препроцессор в терминал' },
        { in: 'gcc -E main.c -o main.i\n', name: 'Препроцессор в файл' },
        { in: 'gcc -c main.c parser.c lexer.c\n', name: 'Несколько объектных файлов' },
        { in: 'gcc -c main.c parser.c -o all.o\n', name: '-o с несколькими файлами' },
        { in: 'gcc -S -c main.c\n', name: 'Самая ранняя стадия' },
        { in: 'gcc main.o parser.o -lm -o calc\n', name: 'Линковка объектных файлов' },
        { in: 'gcc -c -o build/main.o src/main.c\n', name: '-o перед файлом' },
        { in: 'gcc -c lib/v1.2/io.c\n', name: 'Точка в имени каталога' },
      ],
    },
    {
      title: 'Разбор сообщений компилятора',
      description: `
На вход подаётся вывод компилятора — строки до конца ввода. Диагностика — это строка вида

\`\`\`
файл:строка:столбец: вид: сообщение
\`\`\`

где \`вид\` — \`error\`, \`fatal error\`, \`warning\` или \`note\`. Остальные строки (фрагменты кода, \`In function …\`, итоговые строки) нужно пропустить.

Для каждой диагностики напечатайте \`файл:строка вид: сообщение\`, где вид по-русски: \`ошибка\` (для \`error\` и \`fatal error\`), \`предупреждение\` или \`примечание\`. В конце напечатайте \`ошибок: E, предупреждений: W\`.`,
      constraints: [
        'Не больше 50 строк, каждая — не длиннее 300 символов.',
        'Имя файла не содержит двоеточий; строка и столбец — положительные целые.',
      ],
      hints: [
        "Читайте строки через fgets и отрезайте перевод строки. Имя файла — всё до первого двоеточия: strchr(line, ':').",
        "Числа читайте через strtol(p, &end, 10) и проверяйте, что end сдвинулся и *end == ':'. Строка «main.c: In function» не пройдёт эту проверку.",
        'После столбца ожидайте ": " и сравнивайте начало остатка с "fatal error: ", "error: ", "warning: ", "note: " через strncmp.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Читает число и обязательное двоеточие после него; возвращает позицию за двоеточием. */
static char *read_number(char *p, long *value) {
    char *end;
    *value = strtol(p, &end, 10);
    if (end == p || *end != ':') {
        return NULL;
    }
    return end + 1;
}

int main(void) {
    static const char *kinds[][2] = {
        {"fatal error: ", "ошибка"},
        {"error: ", "ошибка"},
        {"warning: ", "предупреждение"},
        {"note: ", "примечание"},
    };
    char line[512];
    int errors = 0;
    int warnings = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        char *colon = strchr(line, ':');
        if (colon == NULL) {
            continue;
        }
        *colon = '\0';
        long number;
        long column;
        char *p = read_number(colon + 1, &number);
        if (p != NULL) {
            p = read_number(p, &column);
        }
        if (p == NULL || *p != ' ') {
            continue;
        }
        p++;
        for (int i = 0; i < 4; i++) {
            size_t length = strlen(kinds[i][0]);
            if (strncmp(p, kinds[i][0], length) == 0) {
                printf("%s:%ld %s: %s\n", line, number, kinds[i][1], p + length);
                if (i < 2) {
                    errors++;
                } else if (i == 2) {
                    warnings++;
                }
                break;
            }
        }
    }
    printf("ошибок: %d, предупреждений: %d\n", errors, warnings);
    return 0;
}`,
      explanation: `
Формат \`файл:строка:столбец: вид: сообщение\` одинаков у GCC и Clang, и на него опираются редакторы: именно так VS Code превращает вывод компилятора в подчёркивания в коде.

Разбор идёт «по контракту»: каждая часть проверяется, и любое несовпадение означает «это не диагностика». \`strtol\` с проверкой \`end\` отличает число от текста — поэтому строки \`main.c: In function 'main':\`, \`In file included from main.c:1:\` и \`collect2: error: …\` пропускаются без особых случаев.

\`fatal error\` проверяется раньше \`error\`: иначе пришлось бы отдельно разбирать слово \`fatal\`. Примечания (\`note\`) не считаются: они поясняют предыдущую ошибку, а не сообщают новую.`,
      examples: [
        {
          in: "main.c: In function 'main':\nmain.c:5:15: warning: unused variable 'y' [-Wunused-variable]\n    5 |     int x = 1, y;\n      |               ^\nmain.c:7:5: error: expected ';' before 'return'\n",
          out: "main.c:5 предупреждение: unused variable 'y' [-Wunused-variable]\nmain.c:7 ошибка: expected ';' before 'return'\nошибок: 1, предупреждений: 1\n",
        },
        { in: '', out: 'ошибок: 0, предупреждений: 0\n' },
      ],
      hidden: [
        {
          in: 'main.c:2:10: fatal error: config.h: No such file or directory\n    2 | #include "config.h"\n      |          ^~~~~~~~~~\ncompilation terminated.\n',
          name: 'Фатальная ошибка',
        },
        {
          in: "src/io.c:120:3: error: implicit declaration of function 'fopen_s'\nsrc/io.c:98:6: note: declared here\n",
          name: 'Примечание не считается',
        },
        {
          in: "In file included from main.c:1:\nutil.h:4:5: warning: 'helper' declared 'static' but never defined\n",
          name: 'Включение из заголовка',
        },
        {
          in: "/usr/bin/ld: /tmp/cc1.o: in function `main':\nmain.c:(.text+0x1e): undefined reference to `helper'\ncollect2: error: ld returned 1 exit status\n",
          name: 'Сообщения линковщика пропускаются',
        },
        {
          in: 'a.c:1:1: warning: x\na.c:2:1: warning: y\nb.c:10:20: warning: z\n',
          name: 'Только предупреждения',
        },
        {
          in: "calc.c:14:12: error: incompatible types when assigning to type 'int' from type 'char *'\n   14 |     total: x = s;\n2 errors generated.\n",
          name: 'Двоеточие в коде',
        },
        {
          in: "main.c:3:2: error: #error \"нужен C17\"\nmain.c:8:1: error: expected declaration specifiers before '}' token\nmain.c:9:1: error: expected '{' at end of input\n",
          name: 'Несколько ошибок',
        },
        {
          in: 'main.c:abc:1: error: не диагностика\nmain.c:4: error: нет столбца\nmain.c:4:2:error: нет пробела\n',
          name: 'Неполный формат',
        },
        {
          in: "deep/path/to/module.c:1024:80: warning: comparison of integer expressions of different signedness: 'int' and 'size_t' [-Wsign-compare]\n",
          name: 'Длинный путь',
        },
      ],
    },
    {
      title: 'Кто сообщил об ошибке',
      difficulty: 'intermediate',
      description: `
Дан вывод сборки — строки до конца ввода, пронумерованные с 1. Определите стадию для каждой строки по правилам, проверяя их **по порядку**:

1. строка содержит \`undefined reference\`, \`multiple definition\` или \`ld returned\` — \`линковщик\`;
2. содержит \`No such file or directory\` или \`#error\` — \`препроцессор\`;
3. содержит \`error:\` или \`warning:\` — \`компилятор\`;
4. иначе строка не является сообщением, её нужно пропустить.

Для каждого сообщения напечатайте \`строка N: стадия\`. Сообщение считается **ошибкой**, если его стадия — линковщик или препроцессор либо в нём есть \`error:\`. В конце напечатайте \`первая ошибка: строка N\` или \`ошибок нет\`.`,
      constraints: ['Не больше 50 строк, каждая — не длиннее 300 символов.'],
      hints: [
        'Подстроку ищет strstr(line, "undefined reference") — она возвращает NULL, если подстроки нет.',
        'Порядок правил важен: в строке collect2: error: ld returned 1 exit status есть и error:, но это сообщение линковщика.',
        'Номер первой ошибки храните в переменной, равной 0, пока ошибок не было.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static int has(const char *line, const char *text) {
    return strstr(line, text) != NULL;
}

int main(void) {
    char line[512];
    int number = 0;
    int first_error = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        number++;
        const char *stage = NULL;
        int error = 0;
        if (has(line, "undefined reference") || has(line, "multiple definition") ||
            has(line, "ld returned")) {
            stage = "линковщик";
            error = 1;
        } else if (has(line, "No such file or directory") || has(line, "#error")) {
            stage = "препроцессор";
            error = 1;
        } else if (has(line, "error:") || has(line, "warning:")) {
            stage = "компилятор";
            error = has(line, "error:");
        }
        if (stage == NULL) {
            continue;
        }
        printf("строка %d: %s\n", number, stage);
        if (error && first_error == 0) {
            first_error = number;
        }
    }
    if (first_error != 0) {
        printf("первая ошибка: строка %d\n", first_error);
    } else {
        printf("ошибок нет\n");
    }
    return 0;
}`,
      explanation: `
Правила проверяются от самых специфичных к самым общим. Строка \`collect2: error: ld returned 1 exit status\` содержит \`error:\`, но выдана линковщиком — поэтому правило линковщика стоит первым. Так же \`#error\` выдаёт препроцессор, хотя сообщение начинается с \`error:\`.

Номер первой ошибки нужен потому, что исправлять ошибки надо **сверху вниз**: одна пропущенная скобка порождает десяток сообщений ниже, и после её исправления они исчезнут сами.`,
      examples: [
        {
          in: "main.c: In function 'main':\nmain.c:4:9: warning: unused variable 'n'\nmain.c:6:5: error: expected ';' before '}' token\n",
          out: 'строка 2: компилятор\nстрока 3: компилятор\nпервая ошибка: строка 3\n',
        },
        {
          in: "/usr/bin/ld: /tmp/ccA1.o: in function `main':\nmain.c:(.text+0x1e): undefined reference to `helper'\ncollect2: error: ld returned 1 exit status\n",
          out: 'строка 2: линковщик\nстрока 3: линковщик\nпервая ошибка: строка 2\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пустой вывод' },
        {
          in: 'main.c:2:10: fatal error: config.h: No such file or directory\ncompilation terminated.\n',
          name: 'Нет заголовка',
        },
        { in: 'main.c:3:2: error: #error "нужен C17"\n', name: '#error' },
        {
          in: "a.c:1:5: warning: unused parameter 'x'\nb.c:9:1: warning: control reaches end of non-void function\n",
          name: 'Только предупреждения',
        },
        {
          in: "/usr/bin/ld: util.o: in function `log_line':\nutil.c:(.text+0x0): multiple definition of `log_line'; main.o:main.c:(.text+0x0): first defined here\ncollect2: error: ld returned 1 exit status\n",
          name: 'Повторное определение',
        },
        { in: 'Сборка завершена\n0 ошибок\n', name: 'Нет сообщений' },
        {
          in: "parser.c:12:3: warning: implicit fallthrough\nparser.c:40:1: error: expected identifier\nparser.c:41:1: error: expected '}'\n",
          name: 'Ошибки после предупреждения',
        },
        {
          in: 'In file included from main.c:1:\nutil.h:3:10: fatal error: types.h: No such file or directory\n    3 | #include "types.h"\ncompilation terminated.\n',
          name: 'Цепочка включений',
        },
        {
          in: "main.c:5:1: warning: return type defaults to 'int'\nmain.c:(.text+0x5): undefined reference to `run'\n",
          name: 'Предупреждение и линковка',
        },
      ],
    },
  ],
};
