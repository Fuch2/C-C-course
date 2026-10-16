export default {
  id: 'toolchain-pipeline',
  title: 'Препроцессор и объектные файлы',
  description:
    'Поиск заголовков и флаг -I, дерево включений -H, макросы из командной строки -D, предопределённые макросы, зависимости -MM, секции объектного файла, таблица символов nm и записи о перемещении.',
  moduleId: 'developer-tools',
  order: 3,
  difficulty: 'beginner',
  estimatedMinutes: 55,
  prerequisites: ['compilation-stages'],
  objectives: [
    'Объяснять, где препроцессор ищет заголовки, и управлять поиском флагом -I',
    'Задавать макросы при сборке и пользоваться предопределёнными макросами',
    'Читать таблицу символов объектного файла с помощью nm',
    'Объяснять, что линковщик делает с неопределёнными символами',
  ],
  tags: ['Препроцессор', 'Объектный файл', 'nm', 'Символы', 'Зависимости'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int a = 1;

    printf("%d\n", __LINE__ + a);
    return 0;
}`,
      answers: ['7'],
      placeholder: 'Вывод программы',
      explain: '__LINE__ заменяется номером строки, на которой стоит: это строка 6. 6 + 1 = 7.',
    },
    {
      q: 'Чем #include "util.h" отличается от #include <util.h>?',
      options: [
        'Кавычки сначала ищут файл в каталоге текущего исходника, угловые скобки — нет',
        'Угловые скобки подключают заголовок только один раз',
        'Кавычки подключают файл без препроцессора',
        'Ничем: это две записи одного и того же',
      ],
      correct: 0,
      explain:
        'После каталога исходника обе формы ищут в каталогах -I и системных. Поэтому свои заголовки пишут в кавычках.',
    },
    {
      q: 'Заголовки проекта лежат в каталоге include. Какой флаг нужно передать компилятору?',
      options: ['-Iinclude', '-Linclude', '-linclude', '-Dinclude'],
      correct: 0,
      explain:
        '-I добавляет каталог поиска заголовков. -L и -l относятся к библиотекам для линковщика, -D определяет макрос.',
    },
    {
      q: 'Программа собрана командой gcc -DLIMIT=10 main.c -o app. Что выведет ./app?',
      code: String.raw`
#include <stdio.h>

#ifndef LIMIT
#define LIMIT 3
#endif

int main(void) {
    printf("%d\n", LIMIT * 2);
    return 0;
}`,
      noRun: true,
      answers: ['20'],
      placeholder: 'Вывод программы',
      explain:
        'Макрос LIMIT уже определён флагом -D, поэтому #ifndef пропускает запасное значение 3.',
    },
    {
      q: 'Что означает строка "                 U strlen" в выводе nm main.o?',
      options: [
        'main.o использует strlen, но не определяет её',
        'strlen определена в main.o как глобальная функция',
        'strlen объявлена static',
        'strlen не используется и будет удалена',
      ],
      correct: 0,
      explain:
        'U — undefined: символ нужно найти в другом объектном файле или библиотеке. Адреса нет, поэтому слева пусто.',
    },
    {
      q: 'Какие символы этого файла nm покажет строчными буквами? Выберите все.',
      code: String.raw`
static int hits;
int misses;
static void reset(void) { hits = 0; }
int ratio(void) { reset(); return misses; }`,
      lang: 'c',
      options: ['hits', 'reset', 'misses', 'ratio'],
      correct: [0, 1],
      explain:
        'Строчная буква — локальный символ. Это всё, что объявлено static на уровне файла: hits (b) и reset (t).',
    },
    {
      q: 'Почему в объектном файле вызов printf выглядит как e8 00 00 00 00?',
      options: [
        'Адрес printf ещё неизвестен: нули — место, которое заполнит линковщик',
        'Компилятор удалил вызов как бесполезный',
        'Нули означают вызов функции по адресу 0',
        'Так кодируется любой вызов функции в x86-64',
      ],
      correct: 0,
      explain:
        'Рядом стоит запись о перемещении: какой символ вписать и по какому смещению. Так связываются раздельно скомпилированные файлы.',
    },
    {
      q: 'Какой буквой nm обозначит глобальную переменную int total; без инициализатора?',
      answers: ['B'],
      placeholder: 'Буква',
      explain:
        'Переменные, равные нулю, попадают в секцию .bss, а глобальный символ обозначается заглавной буквой.',
    },
    {
      q: 'Для чего нужен вывод gcc -MM src/main.c?',
      options: [
        'Чтобы система сборки знала, при изменении каких файлов пересобирать main.o',
        'Чтобы посмотреть машинный код main.o',
        'Чтобы проверить код без компиляции',
        'Чтобы получить список системных библиотек',
      ],
      correct: 0,
      explain:
        'Строка main.o: src/main.c include/calc.h … — готовое правило зависимостей для Make.',
    },
  ],
  exercises: [
    {
      title: 'Подстановка #define',
      difficulty: 'beginner',
      description: `
Смоделируйте препроцессор для макросов-констант. В первой строке — число макросов \`n\`, далее \`n\` строк вида \`ИМЯ значение\` (значение — остаток строки, может быть пустым). Остальные строки до конца ввода — текст программы.

Напечатайте текст, заменив каждый **идентификатор**, совпадающий с именем макроса, его значением. Правила, как у настоящего препроцессора:
- идентификатор — последовательность букв, цифр и \`_\`, начинающаяся не с цифры; \`WIDTH2\` и \`MY_WIDTH\` — не \`WIDTH\`;
- внутри строковых \`"…"\` и символьных \`'…'\` литералов замены нет (внутри литерала возможны экранирования \`\\"\`);
- числа вроде \`0x1F\` или \`2u\` целиком считаются числами;
- значение макроса тоже просматривается на макросы, но макрос не раскрывается внутри собственной подстановки — это защищает от бесконечной рекурсии.`,
      constraints: [
        '0 ≤ n ≤ 20; имена макросов различны.',
        'Строки не длиннее 200 символов; в тексте нет комментариев.',
      ],
      hints: [
        'Напишите функцию void expand(const char *text, unsigned active), которая печатает text с подстановками. active — битовая маска макросов, которые сейчас раскрываются.',
        "Идентификатор: if (isalpha(c) || c == '_') — собирайте его, пока isalnum или _. Число: если цифра, пропускайте всё, что isalnum, _ или точка.",
        'Найденный макрос i раскрывайте рекурсивно: expand(values[i], active | 1u << i). Если бит i уже установлен — печатайте имя как есть.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

#define MAX_MACROS 20
#define LINE 256

static char names[MAX_MACROS][LINE];
static char values[MAX_MACROS][LINE];
static int macro_count;

static int find(const char *name, size_t length) {
    for (int i = 0; i < macro_count; i++) {
        if (strlen(names[i]) == length && strncmp(names[i], name, length) == 0) {
            return i;
        }
    }
    return -1;
}

static int is_ident(char c) {
    return isalnum((unsigned char)c) || c == '_';
}

static void expand(const char *text, unsigned active) {
    const char *p = text;
    while (*p != '\0') {
        if (*p == '"' || *p == '\'') {
            char quote = *p;
            putchar(*p++);
            while (*p != '\0' && *p != quote) {
                if (*p == '\\' && p[1] != '\0') {
                    putchar(*p++);
                }
                putchar(*p++);
            }
            if (*p != '\0') {
                putchar(*p++);
            }
        } else if (isdigit((unsigned char)*p)) {
            while (is_ident(*p) || *p == '.') {
                putchar(*p++);
            }
        } else if (is_ident(*p)) {
            const char *start = p;
            while (is_ident(*p)) {
                p++;
            }
            size_t length = (size_t)(p - start);
            int macro = find(start, length);
            if (macro >= 0 && !(active & (1u << macro))) {
                expand(values[macro], active | (1u << macro));
            } else {
                printf("%.*s", (int)length, start);
            }
        } else {
            putchar(*p++);
        }
    }
}

int main(void) {
    char line[LINE];
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &macro_count) != 1) {
        return 0;
    }
    for (int i = 0; i < macro_count && fgets(line, sizeof line, stdin) != NULL; i++) {
        line[strcspn(line, "\r\n")] = '\0';
        size_t name_length = strcspn(line, " ");
        memcpy(names[i], line, name_length);
        names[i][name_length] = '\0';
        const char *value = line + name_length;
        while (*value == ' ') {
            value++;
        }
        strcpy(values[i], value);
    }
    while (fgets(line, sizeof line, stdin) != NULL) {
        expand(line, 0);
    }
    return 0;
}`,
      explanation: `
Препроцессор работает не с символами, а с **токенами**: идентификаторами, числами, литералами, знаками. Поэтому \`WIDTH2\` не содержит \`WIDTH\` — это другой идентификатор, а \`"WIDTH"\` — строковый литерал, который препроцессор не трогает.

Рекурсивная функция \`expand\` повторяет правило повторного просмотра: подстановка снова ищется на макросы, но с маской «уже раскрываемых». Поэтому \`#define N N + 1\` даёт \`N + 1\`, а пара \`A → B\`, \`B → A\` останавливается на исходном имени — так же поступает и \`gcc -E\`.`,
      examples: [
        {
          in: '2\nWIDTH 80\nHALF (WIDTH / 2)\nint w = HALF;\nprintf("WIDTH\\n");\n',
          out: 'int w = (80 / 2);\nprintf("WIDTH\\n");\n',
        },
        { in: '1\nN N + 1\nint a = N;\n', out: 'int a = N + 1;\n' },
      ],
      hidden: [
        { in: '0\nint x = 5;\n', name: 'Без макросов' },
        { in: '1\nMAX 10\nint MAX2 = MAX + MY_MAX + _MAX;\n', name: 'Похожие идентификаторы' },
        { in: '2\nA B\nB A\nA B\n', name: 'Взаимная рекурсия' },
        { in: "1\nC 'x'\nchar c = C, d = 'C';\n", name: 'Символьный литерал' },
        { in: '1\nx 0\nint v = 0x1F + 2x;\n', name: 'Числа не трогаются' },
        { in: '1\nEMPTY\nint EMPTY a;\n', name: 'Пустое значение' },
        {
          in: '3\nROWS 4\nCOLS 5\nSIZE (ROWS * COLS)\nint grid[SIZE];\nfor (int i = 0; i < ROWS; i++) {}\n',
          name: 'Вложенные макросы',
        },
        { in: '1\nMSG "hi"\nputs("say \\"MSG\\"");\nputs(MSG);\n', name: 'Экранированная кавычка' },
        { in: '2\nPI 3.14\nTAU (2 * PI)\ndouble t = TAU * PI;\n', name: 'Дробные значения' },
      ],
    },
    {
      title: 'Таблица символов',
      description: `
На вход подаётся вывод \`nm\` для одного объектного файла — строки до конца ввода. Строка — это \`адрес буква имя\` или, для неопределённых символов, \`U имя\` с пробелами вместо адреса.

Распределите символы по четырём группам и напечатайте их в таком порядке:

\`\`\`
функции: …
данные: …
нужны извне: …
локальные: …
\`\`\`

- \`функции\` — буква \`T\`; \`данные\` — \`D\`, \`B\` или \`R\`; \`нужны извне\` — \`U\`;
- \`локальные\` — любая строчная буква (\`t\`, \`d\`, \`b\`, \`r\`).

Имена в группе идут в порядке ввода через пробел. Если группа пуста, после двоеточия напечатайте \`-\`.`,
      constraints: ['Не больше 50 строк; имена не длиннее 60 символов и не содержат пробелов.'],
      hints: [
        'Разбейте строку на слова: int words = sscanf(line, "%63s %63s %63s", a, b, c). Три слова — адрес, буква, имя; два — буква и имя.',
        'Храните каждую группу как строку и дописывайте к ней " имя" через strcat; при печати пустую группу заменяйте на "-".',
        'Строчную букву проверяет islower((unsigned char)letter).',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

#define GROUP 4096

static char groups[4][GROUP];

static void add(int group, const char *name) {
    strcat(groups[group], " ");
    strcat(groups[group], name);
}

int main(void) {
    static const char *titles[] = {"функции", "данные", "нужны извне", "локальные"};
    char line[256];
    char a[64];
    char b[64];
    char c[64];
    while (fgets(line, sizeof line, stdin) != NULL) {
        int words = sscanf(line, "%63s %63s %63s", a, b, c);
        const char *letter;
        const char *name;
        if (words == 3) {
            letter = b;
            name = c;
        } else if (words == 2) {
            letter = a;
            name = b;
        } else {
            continue;
        }
        char kind = letter[0];
        if (islower((unsigned char)kind)) {
            add(3, name);
        } else if (kind == 'T') {
            add(0, name);
        } else if (kind == 'D' || kind == 'B' || kind == 'R') {
            add(1, name);
        } else if (kind == 'U') {
            add(2, name);
        }
    }
    for (int i = 0; i < 4; i++) {
        printf("%s:%s\n", titles[i], groups[i][0] != '\0' ? groups[i] : " -");
    }
    return 0;
}`,
      explanation: `
Число слов в строке различает два формата: у определённого символа есть адрес, у неопределённого — нет. \`sscanf\` с \`%s\` пропускает ведущие пробелы, поэтому строки \`U printf\` с длинным отступом разбираются без особого кода.

Группы повторяют вопросы, которые задают объектному файлу при ошибке линковки: что он **предлагает** другим файлам (функции и данные), что ему **нужно** (\`U\`) и что он **скрывает** (локальные символы, которые никогда не будут связаны с чужими \`U\`).`,
      examples: [
        {
          in: '0000000000000020 b cache\n0000000000000000 D counter\n0000000000000000 R limits\n0000000000000014 T main\n                 U printf\n0000000000000000 B total\n0000000000000000 t twice\n',
          out: 'функции: main\nданные: counter limits total\nнужны извне: printf\nлокальные: cache twice\n',
        },
        {
          in: '0000000000000000 T add\n0000000000000010 T sub\n',
          out: 'функции: add sub\nданные: -\nнужны извне: -\nлокальные: -\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пустая таблица' },
        {
          in: '                 U puts\n                 U malloc\n                 U free\n',
          name: 'Только внешние',
        },
        {
          in: '0000000000000000 t helper\n0000000000000000 d state\n0000000000000000 r names\n0000000000000000 b buf\n',
          name: 'Только локальные',
        },
        {
          in: '0000000000000000 T parse_line\n                 U strtol\n0000000000000040 T parse_file\n                 U fopen\n0000000000000000 B line_count\n',
          name: 'Вперемешку',
        },
        {
          in: '0000000000000000 R version\n0000000000000008 R build_date\n',
          name: 'Только константы',
        },
        {
          in: '0000000000000000 T _main\n                 U _printf\n0000000000000000 D _counter\n',
          name: 'Имена macOS',
        },
        {
          in: '0000000000000000 T main\n0000000000000000 T main_loop\n0000000000000030 t main_helper\n',
          name: 'Похожие имена',
        },
        {
          in: '                 U __stack_chk_fail\n0000000000000000 T checksum\n0000000000000000 r table.0\n',
          name: 'Служебные имена',
        },
        {
          in: '0000000000000000 B errors\n0000000000000004 B warnings\n0000000000000000 D level\n                 U exit\n0000000000000000 T report\n0000000000000020 t format\n',
          name: 'Все группы',
        },
      ],
    },
    {
      title: 'Дерево включений',
      description: `
Смоделируйте вывод \`gcc -H\`. В первой строке — число файлов \`n\`. Далее \`n\` строк: \`имя k вкл₁ … вклₖ\` — файл и \`k\` файлов, которые он подключает, в порядке \`#include\`. Первый файл — компилируемый \`.c\`.

Препроцессор обходит включения в глубину. Все заголовки защищены include guard, поэтому каждый заголовок обрабатывается **только при первом** включении — повторные пропускаются целиком.

Для каждого обработанного заголовка напечатайте строку: точки по глубине вложенности (заголовок, подключённый из \`.c\`, — одна точка), пробел и имя. В конце напечатайте \`заголовков: X\`.`,
      constraints: [
        '1 ≤ n ≤ 30; 0 ≤ k ≤ 10; имена не длиннее 40 символов.',
        'Каждый подключаемый файл описан в одной из n строк.',
      ],
      hints: [
        'Сохраните файлы в массивы: char names[30][64], char includes[30][10][64], int counts[30]. Поиск файла по имени — простой перебор со strcmp.',
        'Рекурсивная функция visit(file, depth) перебирает включения файла; для каждого ещё не обработанного печатает depth точек, имя и вызывает visit(child, depth + 1).',
        'Отметку «обработан» ставьте до рекурсивного вызова: так циклические включения a.h ↔ b.h не зациклят программу — как и настоящие include guard.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX_FILES 30
#define MAX_INCLUDES 10
#define NAME 64

static char names[MAX_FILES][NAME];
static char includes[MAX_FILES][MAX_INCLUDES][NAME];
static int counts[MAX_FILES];
static int seen[MAX_FILES];
static int file_count;
static int headers;

static int find(const char *name) {
    for (int i = 0; i < file_count; i++) {
        if (strcmp(names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static void visit(int file, int depth) {
    for (int i = 0; i < counts[file]; i++) {
        int child = find(includes[file][i]);
        if (child < 0 || seen[child]) {
            continue;
        }
        seen[child] = 1;
        headers++;
        for (int d = 0; d < depth; d++) {
            putchar('.');
        }
        printf(" %s\n", names[child]);
        visit(child, depth + 1);
    }
}

int main(void) {
    if (scanf("%d", &file_count) != 1) {
        return 0;
    }
    for (int i = 0; i < file_count; i++) {
        if (scanf("%63s %d", names[i], &counts[i]) != 2) {
            return 0;
        }
        for (int j = 0; j < counts[i]; j++) {
            if (scanf("%63s", includes[i][j]) != 1) {
                return 0;
            }
        }
    }
    seen[0] = 1;
    visit(0, 1);
    printf("заголовков: %d\n", headers);
    return 0;
}`,
      explanation: `
Препроцессор встречает \`#include\` и сразу, не дочитав текущий файл, начинает читать подключаемый — это обход в глубину, и рекурсия выражает его напрямую. Глубина рекурсии и есть число точек в выводе \`gcc -H\`.

Include guard (\`#ifndef UTIL_H\` / \`#define UTIL_H\`) превращает повторное включение в пустое место: макрос уже определён, и всё содержимое пропускается. В модели это массив \`seen\`. Отметка ставится **до** обхода вложенных файлов — иначе пара заголовков, включающих друг друга, давала бы бесконечную рекурсию.

На реальном проекте \`gcc -H\` помогает найти, откуда пришёл конфликтующий тип и почему компиляция одного файла читает сотни заголовков.`,
      examples: [
        {
          in: '4\nmain.c 2 calc.h stdio.h\ncalc.h 1 types.h\ntypes.h 0\nstdio.h 0\n',
          out: '. calc.h\n.. types.h\n. stdio.h\nзаголовков: 3\n',
        },
        {
          in: '3\nmain.c 2 a.h b.h\na.h 1 b.h\nb.h 0\n',
          out: '. a.h\n.. b.h\nзаголовков: 2\n',
        },
      ],
      hidden: [
        { in: '1\nmain.c 0\n', name: 'Без заголовков' },
        { in: '3\nmain.c 1 a.h\na.h 1 b.h\nb.h 1 a.h\n', name: 'Циклическое включение' },
        { in: '3\nmain.c 3 a.h a.h a.h\na.h 1 b.h\nb.h 0\n', name: 'Повторные включения' },
        {
          in: '5\nmain.c 1 h1.h\nh1.h 1 h2.h\nh2.h 1 h3.h\nh3.h 1 h4.h\nh4.h 0\n',
          name: 'Глубокая цепочка',
        },
        {
          in: '6\nmain.c 3 net.h log.h util.h\nnet.h 2 util.h types.h\nlog.h 2 types.h stdio.h\nutil.h 1 types.h\ntypes.h 0\nstdio.h 0\n',
          name: 'Общие заголовки',
        },
        {
          in: '4\napp.c 1 config.h\nlib.h 1 config.h\nconfig.h 0\nunused.h 0\n',
          name: 'Неподключённые файлы',
        },
        {
          in: '4\nmain.c 2 b.h a.h\na.h 1 c.h\nb.h 1 c.h\nc.h 0\n',
          name: 'Порядок включения',
        },
        {
          in: '7\nserver.c 2 server.h stdio.h\nserver.h 2 socket.h list.h\nsocket.h 1 types.h\nlist.h 2 types.h stdlib.h\ntypes.h 1 stdint.h\nstdint.h 0\nstdlib.h 0\n',
          name: 'Сервер',
        },
        {
          in: '2\nmain.c 1 self.h\nself.h 1 self.h\n',
          name: 'Заголовок включает сам себя',
        },
      ],
    },
    {
      title: 'Зависимости для make',
      difficulty: 'intermediate',
      description: `
Смоделируйте \`gcc -MM\` для всех исходников проекта. Формат ввода — как в задаче «Дерево включений»: число файлов \`n\` и строки \`имя k вкл₁ … вклₖ\`. Системные заголовки записаны в угловых скобках, например \`<stdio.h>\`.

Для каждого файла с расширением \`.c\` в порядке ввода напечатайте правило:

\`\`\`
имя.o: имя.c заголовок₁ заголовок₂ …
\`\`\`

- имя объектного файла — имя исходника без каталогов с расширением \`.o\` (как у \`gcc -c\`);
- заголовки перечисляются в порядке **первого** включения при обходе в глубину, каждый один раз;
- системные заголовки пропускаются вместе со всем, что подключается только через них.`,
      constraints: [
        '1 ≤ n ≤ 30; 0 ≤ k ≤ 10; имена не длиннее 40 символов.',
        'Каждый подключаемый заголовок проекта описан в одной из n строк; системные могут быть не описаны.',
      ],
      hints: [
        'Используйте тот же обход в глубину, что и в «Дереве включений», но перед каждым .c сбрасывайте массив seen — у каждого исходника свой список зависимостей.',
        "Системный заголовок узнаётся по первому символу: name[0] == '<'. Его не печатайте и не обходите.",
        'Имя .o: возьмите часть после последнего / и замените всё после последней точки на "o".',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX_FILES 30
#define MAX_INCLUDES 10
#define NAME 64

static char names[MAX_FILES][NAME];
static char includes[MAX_FILES][MAX_INCLUDES][NAME];
static int counts[MAX_FILES];
static int seen[MAX_FILES];
static int file_count;

static int find(const char *name) {
    for (int i = 0; i < file_count; i++) {
        if (strcmp(names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static void visit(int file) {
    for (int i = 0; i < counts[file]; i++) {
        const char *name = includes[file][i];
        int child = find(name);
        if (name[0] == '<' || child < 0 || seen[child]) {
            continue;
        }
        seen[child] = 1;
        printf(" %s", name);
        visit(child);
    }
}

static int is_source(const char *name) {
    size_t length = strlen(name);
    return length > 2 && strcmp(name + length - 2, ".c") == 0;
}

int main(void) {
    if (scanf("%d", &file_count) != 1) {
        return 0;
    }
    for (int i = 0; i < file_count; i++) {
        if (scanf("%63s %d", names[i], &counts[i]) != 2) {
            return 0;
        }
        for (int j = 0; j < counts[i]; j++) {
            if (scanf("%63s", includes[i][j]) != 1) {
                return 0;
            }
        }
    }
    for (int i = 0; i < file_count; i++) {
        if (!is_source(names[i])) {
            continue;
        }
        memset(seen, 0, sizeof seen);
        seen[i] = 1;
        const char *slash = strrchr(names[i], '/');
        const char *base = slash != NULL ? slash + 1 : names[i];
        printf("%.*so: %s", (int)strlen(base) - 1, base, names[i]);
        visit(i);
        putchar('\n');
    }
    return 0;
}`,
      explanation: `
Правило \`main.o: main.c calc.h types.h\` говорит Make: «если любой файл справа новее \`main.o\` — пересобери». Поэтому в списке должны быть **все** заголовки, прочитанные при компиляции, включая подключённые через цепочку: правка \`types.h\` меняет смысл кода в \`main.c\`, даже если он подключает \`types.h\` не напрямую.

Системные заголовки \`-MM\` пропускает: они меняются только при обновлении компилятора, а их проверка замедлила бы каждую сборку (флаг \`-M\` включает и их). Массив \`seen\` сбрасывается для каждого исходника, потому что каждый \`.c\` — отдельная единица трансляции со своим набором заголовков.`,
      examples: [
        {
          in: '4\nsrc/main.c 2 calc.h <stdio.h>\nsrc/calc.c 1 calc.h\ncalc.h 1 types.h\ntypes.h 0\n',
          out: 'main.o: src/main.c calc.h types.h\ncalc.o: src/calc.c calc.h types.h\n',
        },
        { in: '1\nhello.c 1 <stdio.h>\n', out: 'hello.o: hello.c\n' },
      ],
      hidden: [
        { in: '2\nutil.h 0\nmain.c 1 util.h\n', name: 'Заголовок описан раньше' },
        { in: '3\na.c 1 x.h\nx.h 1 y.h\ny.h 1 x.h\n', name: 'Цикл' },
        {
          in: '4\nmain.c 1 <stdlib.h>\n<stdlib.h> 1 internal.h\ninternal.h 0\nother.c 1 internal.h\n',
          name: 'Через системный не идём',
        },
        {
          in: '5\na.c 2 b.h c.h\nb.c 1 b.h\nc.c 0\nb.h 1 c.h\nc.h 0\n',
          name: 'Три исходника',
        },
        { in: '3\nmain.c 2 b.h a.h\na.h 0\nb.h 1 a.h\n', name: 'Порядок первого включения' },
        { in: '2\nlib/v1.2/io.c 1 io.h\nio.h 0\n', name: 'Точка в каталоге' },
        {
          in: '6\nserver/net.c 3 net.h <sys/socket.h> log.h\nserver/log.c 2 log.h <stdio.h>\nnet.h 1 types.h\nlog.h 1 types.h\ntypes.h 1 <stdint.h>\ntests/net_test.c 2 net.h <assert.h>\n',
          name: 'Проект с тестами',
        },
        { in: '2\nonly.h 0\nnot_c.cpp 1 only.h\n', name: 'Нет файлов .c' },
        { in: '3\nm.c 3 a.h a.h a.h\na.h 1 b.h\nb.h 0\n', name: 'Повторные включения' },
      ],
    },
  ],
};
