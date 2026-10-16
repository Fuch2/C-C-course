export default {
  id: 'terminal-basics',
  title: 'Терминал и основные команды',
  description:
    'Оболочка и приглашение, абсолютные и относительные пути, команды для работы с файлами, запуск своей программы, код завершения, цепочки && и ||, потоки stdin/stdout/stderr и перенаправления.',
  moduleId: 'developer-tools',
  order: 1,
  difficulty: 'beginner',
  estimatedMinutes: 50,
  prerequisites: [],
  objectives: [
    'Перемещаться по файловой системе и работать с файлами из терминала',
    'Отличать абсолютные пути от относительных и вычислять, куда ведёт путь',
    'Запускать свою программу и читать её код завершения',
    'Перенаправлять stdin, stdout и stderr и строить конвейеры',
  ],
  tags: ['Терминал', 'Shell', 'Пути', 'Перенаправления', 'Код завершения'],
  standard: 'c17',
  quiz: [
    {
      q: 'Какой каталог напечатает последняя команда?',
      code: String.raw`
$ pwd
/home/student
$ cd projects
$ cd ../music
$ cd ./rock
$ pwd`,
      lang: 'text',
      answers: ['/home/student/music/rock'],
      placeholder: 'Абсолютный путь',
      explain:
        '/home/student → /home/student/projects → .. возвращает в /home/student, затем music → /home/student/music, ./rock → /home/student/music/rock.',
    },
    {
      q: 'Текущий каталог — /home/student/projects/calc. Каким абсолютным путём является ../notes.txt?',
      answers: ['/home/student/projects/notes.txt'],
      placeholder: 'Абсолютный путь',
      explain:
        '.. — родитель текущего каталога, то есть /home/student/projects; к нему добавляется notes.txt.',
    },
    {
      q: 'Что сделает команда ./calc > input.txt, если в input.txt лежат тестовые данные?',
      options: [
        'Перезапишет input.txt тем, что программа выведет в stdout',
        'Передаст содержимое input.txt программе на вход',
        'Допишет вывод программы в конец input.txt',
        'Выведет ошибку: файл уже существует',
      ],
      correct: 0,
      explain:
        'Знак > направляет stdout в файл и сначала очищает его. Данные теста потеряны. Чтобы передать файл на вход, нужен знак <.',
    },
    {
      q: 'Программу запустили командой ./prog > out.txt. Что окажется в файле out.txt?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    printf("A ");
    fprintf(stderr, "B ");
    printf("C\n");
    return 0;
}`,
      answers: ['A C'],
      placeholder: 'Содержимое файла',
      explain:
        'В файл перенаправлен только stdout. Строка B напечатана в stderr — она появится на экране, а не в файле.',
    },
    {
      q: 'Какое число напечатает echo?',
      code: String.raw`
$ cat code.c
int main(void) {
    return 3;
}
$ gcc code.c -o code
$ ./code ; echo $?`,
      lang: 'text',
      noRun: true,
      answers: ['3'],
      placeholder: 'Число',
      explain:
        'Переменная $? хранит код завершения последней команды — значение, которое вернул main.',
    },
    {
      q: 'Компиляция в команде gcc main.c -o app && ./app завершилась с ошибкой. Что произойдёт дальше?',
      options: [
        './app не запустится',
        'Запустится старая версия app, если она есть',
        './app запустится, но сразу завершится',
        'Оболочка повторит компиляцию',
      ],
      correct: 0,
      explain:
        'Оператор && выполняет вторую команду только при коде завершения 0. Поэтому устаревший файл app не запустится по ошибке.',
    },
    {
      q: 'Почему программу из текущего каталога запускают как ./calc, а не calc?',
      options: [
        'Оболочка ищет команды только в каталогах из PATH, а текущий каталог туда не входит',
        'Без ./ программа запустится с правами администратора',
        'Запись ./ заставляет оболочку перекомпилировать программу',
        'calc — зарезервированное слово оболочки',
      ],
      correct: 0,
      explain:
        'Текущий каталог исключён из PATH ради безопасности: иначе чужой файл с именем ls в скачанной папке мог бы запуститься вместо системного.',
    },
    {
      q: 'После каких команд сообщения об ошибках (stderr) попадут в файл? Выберите все.',
      options: [
        './app 2> err.txt',
        './app &> all.txt',
        './app > out.txt 2>&1',
        './app 2>&1 > out.txt',
        './app > out.txt',
      ],
      correct: [0, 1, 2],
      explain:
        'Перенаправления выполняются слева направо. В 2>&1 > out.txt поток stderr копирует направление stdout в момент записи — тогда это ещё терминал, а уже потом stdout уходит в файл.',
    },
    {
      q: 'Чем опасна команда rm?',
      options: [
        'Файлы удаляются без корзины и без подтверждения',
        'Она удаляет файлы только после перезагрузки',
        'Она перемещает файлы в каталог /tmp',
        'Ничем: удалённый файл всегда можно восстановить командой undo',
      ],
      correct: 0,
      explain:
        'rm сразу освобождает файл. Перед rm -r проверьте pwd и ls, особенно если в команде есть шаблон *.',
    },
  ],
  exercises: [
    {
      title: 'Как wc',
      difficulty: 'beginner',
      description: `
Команда \`wc\` считает строки, слова и байты. Напишите её упрощённую версию: прочитайте весь stdin до конца и напечатайте три числа через пробел — количество строк, слов и байтов.

- **Строка** — это символ перевода строки \`\\n\`. Последняя строка без \`\\n\` в конце не считается (так делает и настоящий \`wc\`).
- **Слово** — непрерывная последовательность символов, не являющихся пробельными (\`isspace\`).
- **Байт** — любой прочитанный символ, включая пробелы и переводы строк.`,
      constraints: ['Размер ввода — не больше 10 000 байтов.', 'Ввод может быть пустым.'],
      hints: [
        'Читайте посимвольно: int c; while ((c = getchar()) != EOF) { ... }. Переменная c должна быть int, чтобы отличить EOF от байта.',
        'Для слов храните флаг «сейчас внутри слова». Слово начинается, когда после пробельного символа встретился непробельный.',
        'Русская буква в UTF-8 занимает два байта, поэтому «мир» — это 6 байтов.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>

int main(void) {
    long lines = 0;
    long words = 0;
    long bytes = 0;
    int in_word = 0;
    int c;
    while ((c = getchar()) != EOF) {
        bytes++;
        if (c == '\n') {
            lines++;
        }
        if (isspace(c)) {
            in_word = 0;
        } else if (!in_word) {
            in_word = 1;
            words++;
        }
    }
    printf("%ld %ld %ld\n", lines, words, bytes);
    return 0;
}`,
      explanation: `
Программа делает один проход по вводу: каждый символ — плюс один байт, каждый \`\\n\` — плюс одна строка. Слово считается в момент его **начала** — при переходе из пробельного символа в непробельный, поэтому несколько пробелов подряд не создают пустых слов.

\`getchar\` возвращает байт как \`unsigned char\`, приведённый к \`int\`, — такое значение безопасно передавать в \`isspace\`. Байты русских букв больше 127 и не считаются пробельными, поэтому «привет мир» — два слова и 19 байтов.`,
      examples: [
        { in: 'hello world\n', out: '1 2 12\n' },
        { in: 'one\ntwo three\n', out: '2 3 14\n' },
      ],
      hidden: [
        { in: '', name: 'Пустой ввод' },
        { in: 'abc', name: 'Без перевода строки' },
        { in: '  spaced   out  \n', name: 'Лишние пробелы' },
        { in: '\n\n\n', name: 'Только переводы строк' },
        { in: 'tab\tseparated\twords\n', name: 'Табуляции' },
        { in: 'привет мир\n', name: 'Кириллица' },
        { in: 'a\n\nb\n', name: 'Пустая строка в середине' },
        { in: '   \n', name: 'Только пробелы' },
        {
          in: 'gcc -std=c17 -Wall -Wextra main.c -o app\n./app < in.txt > out.txt\n',
          name: 'Команды',
        },
      ],
    },
    {
      title: 'Переход по каталогам',
      description: `
Смоделируйте команду \`cd\` и напечатайте, что показал бы \`pwd\` после каждой команды.

В первой строке — домашний каталог (абсолютный путь), во второй — число команд \`n\`. Далее \`n\` строк вида \`cd путь\` или просто \`cd\`. В начале текущий каталог — домашний.

Правила:
- \`cd\` без аргумента и \`cd ~\` переходят в домашний каталог, \`~/a/b\` — путь от домашнего;
- \`cd -\` возвращает в каталог, где вы были перед последним \`cd\`;
- путь, начинающийся с \`/\`, — абсолютный, остальные отсчитываются от текущего каталога;
- \`.\` — текущий каталог, \`..\` — родительский (у корня \`/\` родитель — он сам), лишние \`/\` игнорируются.

Каталоги считаются существующими. После каждой команды напечатайте текущий каталог: без \`/\` в конце, корень — как \`/\`.`,
      constraints: [
        '1 ≤ n ≤ 20.',
        'Имена каталогов не содержат пробелов; длина любого пути — не больше 200 символов.',
        'cd - не встречается раньше первого другого cd.',
      ],
      hints: [
        'Читайте строки через fgets и отрезайте перевод строки: line[strcspn(line, "\\n")] = \'\\0\';. Аргумент начинается после "cd" и пробелов.',
        'Сведите все случаи к одному: превратите ~, ~/… и - в обычный путь, а затем примените его к текущему каталогу.',
        'Разбивайте путь на части через strtok(parts, "/"): часть "." пропускайте, ".." отрезает всё после последнего / (strrchr), остальное дописывается через "/".',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX_PATH 512

static void strip(char *line) {
    line[strcspn(line, "\r\n")] = '\0';
}

/* Применяет путь path (абсолютный или относительный) к абсолютному каталогу dir. */
static void change_dir(char *dir, const char *path) {
    char result[MAX_PATH] = "";
    char parts[2 * MAX_PATH];
    if (path[0] != '/' && strcmp(dir, "/") != 0) {
        strcpy(result, dir);
    }
    strcpy(parts, path);
    for (char *part = strtok(parts, "/"); part != NULL; part = strtok(NULL, "/")) {
        if (strcmp(part, ".") == 0) {
            continue;
        }
        if (strcmp(part, "..") == 0) {
            char *slash = strrchr(result, '/');
            if (slash != NULL) {
                *slash = '\0';
            }
            continue;
        }
        strcat(result, "/");
        strcat(result, part);
    }
    strcpy(dir, result[0] != '\0' ? result : "/");
}

int main(void) {
    char home[MAX_PATH];
    char line[MAX_PATH];
    char dir[MAX_PATH];
    char previous[MAX_PATH];
    int n = 0;
    if (fgets(home, sizeof home, stdin) == NULL || fgets(line, sizeof line, stdin) == NULL) {
        return 0;
    }
    strip(home);
    sscanf(line, "%d", &n);
    strcpy(dir, home);
    strcpy(previous, home);
    for (int i = 0; i < n && fgets(line, sizeof line, stdin) != NULL; i++) {
        strip(line);
        const char *arg = line + 2;
        while (*arg == ' ') {
            arg++;
        }
        char target[2 * MAX_PATH];
        if (*arg == '\0' || strcmp(arg, "~") == 0) {
            strcpy(target, home);
        } else if (strncmp(arg, "~/", 2) == 0) {
            snprintf(target, sizeof target, "%s%s", home, arg + 1);
        } else if (strcmp(arg, "-") == 0) {
            strcpy(target, previous);
        } else {
            strcpy(target, arg);
        }
        strcpy(previous, dir);
        change_dir(dir, target);
        puts(dir);
    }
    return 0;
}`,
      explanation: `
Все виды аргументов сводятся к одному действию «применить путь к каталогу». \`~\` и \`-\` заменяются абсолютными путями, а дальше работает общая функция \`change_dir\`.

Внутри неё каталог хранится без завершающего \`/\`, а корень — пустой строкой: так \`..\` всегда означает «отрезать последний компонент», а у корня отрезать нечего — он остаётся корнем. \`strtok\` пропускает пустые части между соседними \`/\`, поэтому \`//usr///lib/\` превращается в \`/usr/lib\` без особого кода.

Ровно так оболочка и вычисляет новый каталог; для реальных путей она ещё проверяет, что каталог существует, и разрешает символические ссылки.`,
      examples: [
        {
          in: '/home/student\n3\ncd projects\ncd ..\ncd /tmp\n',
          out: '/home/student/projects\n/home/student\n/tmp\n',
        },
        {
          in: '/home/ann\n4\ncd ~/code/calc\ncd ../../music\ncd -\ncd\n',
          out: '/home/ann/code/calc\n/home/ann/music\n/home/ann/code/calc\n/home/ann\n',
        },
      ],
      hidden: [
        { in: '/home/u\n3\ncd /\ncd ..\ncd ../..\n', name: 'Выше корня' },
        { in: '/home/u\n2\ncd ./a/./b/\ncd .\n', name: 'Точки' },
        { in: '/home/u\n2\ncd //usr///lib/\ncd ../share//doc\n', name: 'Лишние слэши' },
        { in: '/home/u\n4\ncd /etc\ncd -\ncd -\ncd -\n', name: 'cd - туда и обратно' },
        { in: '/home/u\n1\ncd /usr/local/../bin\n', name: 'Абсолютный путь с ..' },
        { in: '/\n3\ncd ~/tmp\ncd ..\ncd ~\n', name: 'Домашний каталог — корень' },
        { in: '/home/u\n3\ncd /\ncd etc\ncd nginx/sites\n', name: 'Относительно корня' },
        {
          in: '/home/u/work\n2\ncd ../../../../../x\ncd ~/../u/./work/src\n',
          name: 'Много уровней вверх',
        },
        {
          in: '/home/dev\n6\ncd project\ncd build\ncd ../src/core\ncd ~\ncd -\ncd ../../tests\n',
          name: 'Сессия работы',
        },
      ],
    },
    {
      title: 'Перенаправления',
      description: `
Дана одна команда оболочки — слова через пробел. Определите, куда после всех перенаправлений направлены три стандартных потока, и напечатайте:

\`\`\`
stdin: …
stdout: …
stderr: …
\`\`\`

По умолчанию все потоки — \`терминал\`. Перенаправления обрабатываются **слева направо**:

| Слово | Действие |
| --- | --- |
| \`< файл\` | stdin читается из файла |
| \`> файл\`, \`1> файл\` | stdout пишется в файл |
| \`>> файл\` | stdout дописывается в файл |
| \`2> файл\` | stderr пишется в файл |
| \`2>> файл\` | stderr дописывается в файл |
| \`&> файл\` | stdout и stderr пишутся в файл |
| \`2>&1\` | stderr направляется туда, куда **сейчас** направлен stdout |
| \`>&2\` | stdout направляется туда, куда сейчас направлен stderr |

Оператор и имя файла разделены пробелом. Для дописывания печатайте имя файла с пометкой \` (дописать)\`. Остальные слова — имя программы и её аргументы — на ответ не влияют.`,
      constraints: [
        'Команда содержит от 1 до 30 слов, каждое — не длиннее 100 символов.',
        'После операторов с файлом всегда идёт имя файла.',
      ],
      hints: [
        'Читайте слова по одному: while (scanf("%255s", word) == 1). После оператора с файлом прочитайте ещё одно слово — имя.',
        'Храните три строки-направления. 2>&1 — это просто копия: strcpy(err, out). Поэтому важен момент, когда она выполняется.',
        'Пометку дописывания удобно сразу записать в направление: snprintf(out, sizeof out, "%s (дописать)", name).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define WORD 256
#define TARGET (WORD + 32)

int main(void) {
    char in[TARGET] = "терминал";
    char out[TARGET] = "терминал";
    char err[TARGET] = "терминал";
    char word[WORD];
    char name[WORD];
    while (scanf("%255s", word) == 1) {
        if (strcmp(word, "2>&1") == 0) {
            strcpy(err, out);
        } else if (strcmp(word, ">&2") == 0) {
            strcpy(out, err);
        } else if (strcmp(word, "<") == 0 && scanf("%255s", name) == 1) {
            strcpy(in, name);
        } else if ((strcmp(word, ">") == 0 || strcmp(word, "1>") == 0) &&
                   scanf("%255s", name) == 1) {
            strcpy(out, name);
        } else if (strcmp(word, ">>") == 0 && scanf("%255s", name) == 1) {
            snprintf(out, sizeof out, "%s (дописать)", name);
        } else if (strcmp(word, "2>") == 0 && scanf("%255s", name) == 1) {
            strcpy(err, name);
        } else if (strcmp(word, "2>>") == 0 && scanf("%255s", name) == 1) {
            snprintf(err, sizeof err, "%s (дописать)", name);
        } else if (strcmp(word, "&>") == 0 && scanf("%255s", name) == 1) {
            strcpy(out, name);
            strcpy(err, name);
        }
    }
    printf("stdin: %s\nstdout: %s\nstderr: %s\n", in, out, err);
    return 0;
}`,
      explanation: `
Перенаправление — это присваивание: «теперь поток 1 ведёт в такой-то файл». Поэтому последнее перенаправление одного потока побеждает, а \`2>&1\` копирует **текущее** значение stdout, а не связывает потоки навсегда.

Отсюда классическая ловушка: в \`./app 2>&1 > log.txt\` stderr копирует направление stdout, когда тот ещё ведёт в терминал. Ошибки остаются на экране, и только stdout уходит в файл. Правильный порядок — \`./app > log.txt 2>&1\` или короткая запись \`&> log.txt\`.`,
      examples: [
        { in: './calc\n', out: 'stdin: терминал\nstdout: терминал\nstderr: терминал\n' },
        {
          in: './calc < in.txt > out.txt\n',
          out: 'stdin: in.txt\nstdout: out.txt\nstderr: терминал\n',
        },
      ],
      hidden: [
        { in: './app > log.txt 2>&1\n', name: 'Оба потока в лог' },
        { in: './app 2>&1 > log.txt\n', name: 'Ловушка порядка' },
        { in: './tests >> results.txt\n', name: 'Дописывание' },
        { in: 'make 2> errors.txt\n', name: 'Только ошибки' },
        { in: './app -v &> all.txt\n', name: 'Короткая запись &>' },
        { in: 'echo ошибка >&2\n', name: 'stdout в stderr' },
        { in: './a > x.txt > y.txt\n', name: 'Последнее побеждает' },
        { in: './server 2>> server.log < config.txt 1> out.txt\n', name: 'Три потока' },
        { in: './a 2> err.txt >&2\n', name: 'stdout за stderr' },
      ],
    },
    {
      title: 'Цепочки && и ||',
      difficulty: 'intermediate',
      description: `
Дана цепочка команд, соединённых операторами \`&&\`, \`||\` и \`;\`. Каждая команда записана как \`имя:код\`, где \`код\` — код завершения, который она вернула бы при запуске.

Смоделируйте оболочку. Для каждой команды по порядку напечатайте \`имя -> код\`, если она выполнилась, или \`имя -> пропущена\`. В конце напечатайте \`итог: S\`, где \`S\` — значение \`$?\` после всей цепочки.

Правила оболочки:
- первая команда и команда после \`;\` выполняются всегда;
- команда после \`&&\` выполняется, только если **последняя выполненная** команда вернула 0;
- команда после \`||\` выполняется, только если последняя выполненная команда вернула не 0;
- пропущенная команда не меняет \`$?\`.`,
      constraints: [
        'В цепочке от 1 до 20 команд; слова разделены пробелами.',
        'Коды завершения — от 0 до 255; имена не содержат двоеточий.',
      ],
      hints: [
        'Читайте слова через scanf("%127s", word). Слово — либо оператор (&&, ||, ;), либо команда. Запомните последний оператор.',
        "Отделите код от имени: char *colon = strrchr(word, ':'); *colon = '\\0'; int code = atoi(colon + 1);",
        "Решение «выполнять ли» зависит только от оператора перед командой и текущего $?: run = op == ';' || (op == '&' && status == 0) || (op == '|' && status != 0).",
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char word[128];
    char op = ';';
    int status = 0;
    while (scanf("%127s", word) == 1) {
        if (strcmp(word, "&&") == 0 || strcmp(word, "||") == 0 || strcmp(word, ";") == 0) {
            op = word[0];
            continue;
        }
        char *colon = strrchr(word, ':');
        int code = 0;
        if (colon != NULL) {
            *colon = '\0';
            code = atoi(colon + 1);
        }
        int run = op == ';' || (op == '&' && status == 0) || (op == '|' && status != 0);
        if (run) {
            status = code;
            printf("%s -> %d\n", word, code);
        } else {
            printf("%s -> пропущена\n", word);
        }
    }
    printf("итог: %d\n", status);
    return 0;
}`,
      explanation: `
У \`&&\` и \`||\` в оболочке одинаковый приоритет, и цепочка разбирается слева направо. Каждая команда смотрит только на оператор перед собой и на \`$?\` — код последней **выполненной** команды.

Поэтому \`gcc:1 && ./app:0 || echo:0\` работает как «если не собралось — сообщи»: \`./app\` пропущена, \`$?\` остался равен 1, и \`echo\` выполняется. Но запись \`a && b || c\` — не полноценный if/else: если \`a\` успешна, а \`b\` упала, \`c\` тоже выполнится.`,
      examples: [
        { in: 'gcc:0 && ./app:0\n', out: 'gcc -> 0\n./app -> 0\nитог: 0\n' },
        {
          in: 'gcc:1 && ./app:0 || echo:0\n',
          out: 'gcc -> 1\n./app -> пропущена\necho -> 0\nитог: 0\n',
        },
      ],
      hidden: [
        { in: 'make:2\n', name: 'Одна неудачная команда' },
        { in: 'a:1 ; b:0\n', name: 'Точка с запятой' },
        { in: 'a:0 || b:0 && c:1\n', name: 'Пропуск и продолжение' },
        { in: 'a:0 && b:3 && c:0\n', name: 'Обрыв цепочки' },
        { in: 'a:1 || b:1 || c:0 || d:0\n', name: 'Первый успех' },
        { in: 'build:0 && test:1 || notify:0 ; clean:0\n', name: 'Не совсем if/else' },
        { in: 'x:4 && y:0 && z:0\n', name: 'Всё пропущено' },
        { in: 'a:0 ; b:1 ; c:2\n', name: 'Последний код' },
        {
          in: 'mkdir:0 && cd:0 && cmake:0 && make:1 || echo:0 ; ls:0 && pwd:0\n',
          name: 'Длинная цепочка',
        },
      ],
    },
  ],
};
