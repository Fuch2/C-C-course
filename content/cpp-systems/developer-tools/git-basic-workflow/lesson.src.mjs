export default {
  id: 'git-basic-workflow',
  title: 'Git: базовый рабочий процесс',
  description:
    'Рабочий каталог, индекс и история, git add и git commit, git status --short, git diff и унифицированный формат, .gitignore для проекта на C, отмена изменений, ветки и конфликты, удалённые репозитории и хорошие коммиты.',
  moduleId: 'developer-tools',
  order: 12,
  difficulty: 'beginner',
  estimatedMinutes: 55,
  prerequisites: ['advanced-sanitizers'],
  objectives: [
    'Сохранять изменения в истории через индекс и коммиты',
    'Читать git status --short и вывод git diff',
    'Составлять .gitignore для проекта на C',
    'Отменять изменения, работать с ветками и решать конфликты',
  ],
  tags: ['Git', 'Контроль версий', 'diff', '.gitignore', 'Ветки'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что делает git add main.c?',
      options: [
        'Добавляет текущее состояние main.c в индекс — черновик следующего коммита',
        'Сразу сохраняет main.c в истории',
        'Отправляет main.c на сервер',
        'Начинает отслеживать main.c, но изменения в коммит не попадут',
      ],
      correct: 0,
      explain:
        'Коммит создаёт git commit из того, что лежит в индексе. Правки, сделанные после git add, в индекс не попадут, пока не выполнить git add снова.',
    },
    {
      q: 'Какой командой посмотреть изменения, которые ещё не добавлены в индекс?',
      answers: ['git diff'],
      placeholder: 'Команда',
      explain:
        'git diff сравнивает рабочий каталог с индексом, git diff --staged — индекс с последним коммитом.',
    },
    {
      q: 'git status -s показывает " M parser.c" (пробел, затем M). Что это значит?',
      options: [
        'Файл изменён, но изменения не добавлены в индекс',
        'Изменения добавлены в индекс и войдут в коммит',
        'Файл новый и не отслеживается',
        'Файл удалён',
      ],
      correct: 0,
      explain:
        'Первая буква — индекс относительно коммита, вторая — рабочий каталог относительно индекса. "M " означало бы, что изменение уже в индексе.',
    },
    {
      q: 'Что нужно добавить в .gitignore проекта на C? Выберите все.',
      options: ['build/', '*.o', '.env с паролями', 'main.c', 'Makefile'],
      correct: [0, 1, 2],
      explain:
        'Результаты сборки создаются заново, а секреты не должны попадать в историю. Исходники и файлы сборки — основа репозитория.',
    },
    {
      q: 'Что сделает git restore main.c?',
      options: [
        'Выбросит несохранённые в коммитах правки main.c — их нельзя будет вернуть',
        'Восстановит удалённый коммит',
        'Уберёт main.c из индекса, сохранив правки',
        'Отменит последний коммит',
      ],
      correct: 0,
      explain:
        'Убрать из индекса, сохранив правки, — git restore --staged main.c. Отменить коммит — git revert.',
    },
    {
      q: 'В репозиторий попал файл с ключом API. Следующим коммитом его удалили. Достаточно ли этого?',
      options: [
        'Нет: ключ остаётся в истории, его нужно отозвать и заменить',
        'Да: после удаления файла ключ недоступен',
        'Да, если сделать git push',
        'Нет, нужно ещё добавить файл в .gitignore — и тогда достаточно',
      ],
      correct: 0,
      explain:
        'Любой, у кого есть копия репозитория, может открыть старый коммит. Скомпрометированный секрет всегда заменяют.',
    },
    {
      q: 'Что означает строка, начинающаяся с +, в выводе git diff?',
      options: ['Строка добавлена', 'Строка удалена', 'Строка не изменилась', 'Строка конфликтует'],
      correct: 0,
      explain:
        '- — удалённая строка, пробел — контекст без изменений. Изменённая строка показывается парой - и +.',
    },
    {
      q: 'Зачем делать новую функцию в отдельной ветке?',
      options: [
        'Чтобы незаконченная работа не ломала рабочую версию в main',
        'Так коммиты занимают меньше места',
        'Без ветки нельзя сделать коммит',
        'Чтобы Git проверил код компилятором',
      ],
      correct: 0,
      explain:
        'Ветка — параллельная линия истории. Когда функция готова и проверена, её вливают в main через git merge или запрос на слияние.',
    },
    {
      q: 'После git merge в файле появились строки <<<<<<< HEAD, ======= и >>>>>>> feature. Что делать?',
      options: [
        'Оставить правильный вариант кода, удалить маркеры, затем git add и git commit',
        'Удалить файл и повторить слияние',
        'Сделать git commit как есть — Git сам уберёт маркеры',
        'Выполнить git restore для всего проекта',
      ],
      correct: 0,
      explain:
        'Конфликт значит, что обе ветки изменили одни и те же строки. Решение принимает человек: иногда нужен один из вариантов, иногда их сочетание.',
    },
  ],
  exercises: [
    {
      title: 'git status --short',
      difficulty: 'beginner',
      description: `
Вычислите вывод \`git status --short\`. В первой строке — число файлов \`n\`. Далее \`n\` строк \`имя коммит индекс рабочий\`: версия файла в последнем коммите, в индексе и в рабочем каталоге. Версия — слово (например, \`v1\`) или \`-\`, если файла там нет.

Первая буква статуса **X** сравнивает индекс с коммитом: \`A\` — в коммите нет, в индексе есть; \`D\` — в коммите есть, в индексе нет; \`M\` — версии различаются; пробел — совпадают. Вторая буква **Y** сравнивает рабочий каталог с индексом: \`D\` — в индексе есть, в рабочем нет; \`M\` — версии различаются; пробел — совпадают.

Если файла нет в индексе, но он есть в рабочем каталоге, Y не вычисляется, а файл считается неотслеживаемым: сначала печатается строка \`X  имя\` (если X не пробел), затем \`?? имя\`. Строки со статусом из двух пробелов не печатаются.

Выводите строки \`XY имя\` в порядке ввода. Если печатать нечего — \`nothing to commit, working tree clean\`.`,
      constraints: ['1 ≤ n ≤ 50; имена и версии не длиннее 40 символов.'],
      hints: [
        'Сравнивайте версии строками через strcmp; отсутствие — строка "-".',
        'Вычислите X отдельной функцией status_letter(old, new), которая возвращает A, D, M или пробел. Y — та же функция для пары индекс → рабочий, но без варианта A.',
        'Случай «нет в индексе, есть в рабочем каталоге» разберите первым — он даёт строку ??.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static char status_letter(const char *old, const char *new_version) {
    int had = strcmp(old, "-") != 0;
    int has = strcmp(new_version, "-") != 0;
    if (!had && has) {
        return 'A';
    }
    if (had && !has) {
        return 'D';
    }
    if (had && has && strcmp(old, new_version) != 0) {
        return 'M';
    }
    return ' ';
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    int printed = 0;
    for (int i = 0; i < n; i++) {
        char name[64];
        char head[64];
        char index[64];
        char work[64];
        if (scanf("%63s %63s %63s %63s", name, head, index, work) != 4) {
            break;
        }
        char x = status_letter(head, index);
        if (strcmp(index, "-") == 0 && strcmp(work, "-") != 0) {
            if (x != ' ') {
                printf("%c  %s\n", x, name);
            }
            printf("?? %s\n", name);
            printed++;
            continue;
        }
        char y = status_letter(index, work);
        if (x == ' ' && y == ' ') {
            continue;
        }
        printf("%c%c %s\n", x, y, name);
        printed++;
    }
    if (printed == 0) {
        printf("nothing to commit, working tree clean\n");
    }
    return 0;
}`,
      explanation: `
Две буквы статуса — два независимых сравнения: «что войдёт в коммит» (индекс против последнего коммита) и «что я ещё не добавил» (рабочий каталог против индекса). Поэтому файл может иметь статус \`MM\`: часть правок уже в индексе, а после \`git add\` файл правили снова — и следующий коммит получит версию из индекса, а не последнюю.

Особый случай — файл, удалённый из индекса командой \`git rm --cached\`, но оставшийся на диске. Для Git это сразу два события: удаление в следующем коммите (\`D \`) и новый неотслеживаемый файл (\`??\`). Так обычно убирают из репозитория случайно закоммиченный \`build/\` перед добавлением его в \`.gitignore\`.`,
      examples: [
        {
          in: '5\nlexer.c v1 v2 v2\nparser.c v1 v1 v2\nmain.c v1 v2 v3\neval.c - v1 v1\nnotes.txt v1 v1 -\n',
          out: 'M  lexer.c\n M parser.c\nMM main.c\nA  eval.c\n D notes.txt\n',
        },
        {
          in: '2\nmain.c v1 v1 v1\nMakefile v2 v2 v2\n',
          out: 'nothing to commit, working tree clean\n',
        },
      ],
      hidden: [
        { in: '1\nbuild.o - - v1\n', name: 'Неотслеживаемый' },
        { in: '1\nsecret.env v1 - v1\n', name: 'git rm --cached' },
        { in: '1\nold.c v1 - -\n', name: 'Удалён через git rm' },
        { in: '1\nnew.c - v1 v2\n', name: 'Добавлен и снова изменён' },
        { in: '1\nnew.c - v1 -\n', name: 'Добавлен и удалён с диска' },
        { in: '1\nghost.c - - -\n', name: 'Нигде нет' },
        { in: '1\nmain.c v1 v2 v1\n', name: 'Вернули как было' },
        {
          in: '6\na.c v1 v1 v1\nb.c v1 v1 v9\nc.c - - v1\nd.c v3 v4 v4\ne.c v2 - v2\nf.c v1 v1 v1\n',
          name: 'Вперемешку',
        },
        { in: '2\nREADME.md v1 v2 -\nLICENSE v1 - -\n', name: 'Удаления' },
      ],
    },
    {
      title: 'Шаблоны .gitignore',
      description: `
Определите, какие файлы Git проигнорирует. В первой строке — число строк \`.gitignore\` \`p\`, далее \`p\` строк. Пустые строки и строки, начинающиеся с \`#\`, пропускаются. Затем число путей \`q\` и \`q\` путей файлов от корня проекта (например, \`src/main.c\`).

Правила шаблонов:
- \`!\` в начале — исключение: подходящий путь снова отслеживается;
- \`/\` в конце — шаблон подходит только к **каталогам**;
- если в шаблоне (без завершающего \`/\`) есть \`/\` — он сравнивается с путём от корня (ведущий \`/\` отбрасывается); иначе — с **одним** компонентом пути на любой глубине;
- \`*\` — любая последовательность символов без \`/\`, \`?\` — один любой символ, кроме \`/\`.

Решение для файла:
1. Проверьте каждый каталог на пути к файлу сверху вниз (\`src\`, затем \`src/gen\`, …). Каталог проигнорирован, если последний подходящий к нему шаблон — не исключение. Если проигнорирован хоть один каталог, файл игнорируется — исключения внутри не работают.
2. Иначе файл проигнорирован, если последний подходящий к нему шаблон — не исключение.

Для каждого пути напечатайте \`путь: игнорируется\` или \`путь: отслеживается\`.`,
      constraints: [
        '0 ≤ p ≤ 30; 1 ≤ q ≤ 30; строки не длиннее 100 символов; пути не содержат пробелов.',
      ],
      hints: [
        "Сопоставление с * удобно написать рекурсивно: match(p, s) — если *p == '*', попробуйте отдать звёздочке 0, 1, 2… символов s, пока не встретится '/'.",
        'Шаблон проверяется против «объекта» — пути от корня до какого-то каталога или до файла. Для неякорного шаблона нужен только последний компонент этого объекта.',
        'Для каждого объекта пройдите все шаблоны по порядку и запомните результат последнего подходящего: 1 — игнорировать, 0 — исключение, −1 — ни один не подошёл.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 128

typedef struct {
    char text[LINE];
    int negate;
    int dir_only;
    int anchored;
} Pattern;

static Pattern patterns[30];
static int pattern_count;

static int match(const char *p, const char *s) {
    if (*p == '\0') {
        return *s == '\0';
    }
    if (*p == '*') {
        for (const char *t = s;; t++) {
            if (match(p + 1, t)) {
                return 1;
            }
            if (*t == '\0' || *t == '/') {
                return 0;
            }
        }
    }
    if (*s == '\0') {
        return 0;
    }
    if (*p == '?' ? *s == '/' : *p != *s) {
        return 0;
    }
    return match(p + 1, s + 1);
}

/* Результат для пути object: 1 — игнорировать, 0 — исключение, -1 — нет подходящих. */
static int decide(const char *object, int is_dir) {
    const char *slash = strrchr(object, '/');
    const char *base = slash != NULL ? slash + 1 : object;
    int result = -1;
    for (int i = 0; i < pattern_count; i++) {
        const Pattern *pattern = &patterns[i];
        if (pattern->dir_only && !is_dir) {
            continue;
        }
        if (match(pattern->text, pattern->anchored ? object : base)) {
            result = pattern->negate ? 0 : 1;
        }
    }
    return result;
}

int main(void) {
    char line[LINE];
    int p = 0;
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &p) != 1) {
        return 0;
    }
    for (int i = 0; i < p && fgets(line, sizeof line, stdin) != NULL; i++) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '\0' || line[0] == '#') {
            continue;
        }
        Pattern *pattern = &patterns[pattern_count++];
        const char *text = line;
        pattern->negate = *text == '!';
        if (pattern->negate) {
            text++;
        }
        strcpy(pattern->text, text);
        size_t length = strlen(pattern->text);
        pattern->dir_only = length > 0 && pattern->text[length - 1] == '/';
        if (pattern->dir_only) {
            pattern->text[length - 1] = '\0';
        }
        pattern->anchored = strchr(pattern->text, '/') != NULL;
        if (pattern->text[0] == '/') {
            memmove(pattern->text, pattern->text + 1, strlen(pattern->text));
        }
    }
    int q;
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &q) != 1) {
        return 0;
    }
    for (int i = 0; i < q && fgets(line, sizeof line, stdin) != NULL; i++) {
        line[strcspn(line, "\r\n")] = '\0';
        char object[LINE];
        int ignored = 0;
        for (const char *s = strchr(line, '/'); s != NULL && !ignored; s = strchr(s + 1, '/')) {
            size_t length = (size_t)(s - line);
            memcpy(object, line, length);
            object[length] = '\0';
            ignored = decide(object, 1) == 1;
        }
        if (!ignored) {
            ignored = decide(line, 0) == 1;
        }
        printf("%s: %s\n", line, ignored ? "игнорируется" : "отслеживается");
    }
    return 0;
}`,
      explanation: `
Git проверяет путь **сверху вниз**: сначала каталоги, потом файл. Проигнорированный каталог Git даже не открывает — поэтому \`!build/keep.txt\` при правиле \`build/\` не сработает, и в документации Git это записано явно. Если нужно сохранить файл внутри, игнорируют содержимое, а не каталог: \`build/*\` и \`!build/keep.txt\`.

«Последний подходящий побеждает» позволяет строить правила как «всё, кроме»: \`*.h\` в сгенерированном каталоге, а затем \`!config.h\`. Неякорный шаблон (\`*.o\`, \`build/\`) действует на любой глубине, якорный (\`/calc\`, \`src/gen.c\`) — только по пути от корня: так исполняемый файл \`/calc\` в корне игнорируется, а каталог \`src/calc/\` с исходниками — нет.`,
      examples: [
        {
          in: '4\n# сборка\nbuild/\n*.o\n/calc\n5\nmain.c\nsrc/lexer.o\nbuild/calc\ncalc\nsrc/calc/main.c\n',
          out: 'main.c: отслеживается\nsrc/lexer.o: игнорируется\nbuild/calc: игнорируется\ncalc: игнорируется\nsrc/calc/main.c: отслеживается\n',
        },
        {
          in: '2\n*.h\n!config.h\n2\ngen/table.h\ngen/config.h\n',
          out: 'gen/table.h: игнорируется\ngen/config.h: отслеживается\n',
        },
      ],
      hidden: [
        {
          in: '2\nbuild/\n!build/keep.txt\n1\nbuild/keep.txt\n',
          name: 'Исключение в игнорируемом каталоге',
        },
        {
          in: '2\nbuild/*\n!build/keep.txt\n2\nbuild/keep.txt\nbuild/app\n',
          name: 'Игнорировать содержимое',
        },
        { in: '1\nbuild/\n2\nbuild\nsrc/build/x.o\n', name: 'Файл с именем каталога' },
        { in: '1\nsrc/gen.c\n2\nsrc/gen.c\nlib/src/gen.c\n', name: 'Якорный путь' },
        { in: '1\n?.o\n3\na.o\nab.o\nx/b.o\n', name: 'Знак вопроса' },
        { in: '0\n2\na.c\nb/c.d\n', name: 'Пустой .gitignore' },
        {
          in: '3\n\n# комментарий\n.env\n2\n.env\nconfig/.env\n',
          name: 'Комментарии и пустые строки',
        },
        {
          in: '2\n*.log\n!important.log\n3\nlogs/a.log\nimportant.log\nlogs/important.log\n',
          name: 'Исключение по имени',
        },
        {
          in: '2\n/docs/*.md\n*.tmp\n3\ndocs/a.md\ndocs/sub/b.md\nnotes/c.md\n',
          name: 'Звёздочка не пересекает /',
        },
        {
          in: '3\n.vscode/\n.DS_Store\n*.so\n3\n.vscode/settings.json\nsrc/.DS_Store\nlib/libcalc.so\n',
          name: 'Файлы редакторов',
        },
      ],
    },
    {
      title: 'Построчный diff',
      difficulty: 'advanced',
      description: `
Постройте минимальную построчную разницу между старой и новой версией файла, как \`git diff\`. Ввод: число строк \`n\` и \`n\` строк старой версии, затем число \`m\` и \`m\` строк новой. Строки могут содержать пробелы.

Найдите наибольшую общую подпоследовательность строк (LCS) и напечатайте все строки обеих версий с префиксом: \`' '\` — строка есть в обеих версиях, \`-\` — удалена, \`+\` — добавлена. Чтобы ответ был однозначным, стройте его так. Пусть \`L(i, j)\` — длина LCS суффиксов старой версии с позиции \`i\` и новой с позиции \`j\`. Начиная с \`i = j = 0\`:
- если строки \`old[i]\` и \`new[j]\` равны — печатайте \`' '\` и сдвигайте оба индекса;
- иначе, если \`L(i + 1, j) ≥ L(i, j + 1)\`, — печатайте \`-old[i]\` и сдвигайте \`i\`;
- иначе печатайте \`+new[j]\` и сдвигайте \`j\`.

Когда одна версия закончилась, допечатайте остаток другой. В конце напечатайте \`+A -D\` — число добавленных и удалённых строк.`,
      constraints: ['0 ≤ n, m ≤ 200; строки не длиннее 100 символов.'],
      hints: [
        'Таблицу L заполняйте с конца: L[i][j] = old[i] == new[j] ? L[i+1][j+1] + 1 : max(L[i+1][j], L[i][j+1]); строка и столбец за концом — нули.',
        'Строки читайте через fgets и отрезайте перевод строки; число строк — отдельной строкой через sscanf.',
        'Таблица 201 × 201 из int занимает около 160 КБ — объявите её static, а не локальной переменной.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX 201
#define LINE 128

static char old_lines[MAX][LINE];
static char new_lines[MAX][LINE];
static int lcs[MAX][MAX];

static int read_block(char lines[][LINE]) {
    char line[LINE];
    int count = 0;
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &count) != 1) {
        return 0;
    }
    for (int i = 0; i < count; i++) {
        if (fgets(lines[i], LINE, stdin) == NULL) {
            lines[i][0] = '\0';
        }
        lines[i][strcspn(lines[i], "\r\n")] = '\0';
    }
    return count;
}

int main(void) {
    int n = read_block(old_lines);
    int m = read_block(new_lines);
    for (int i = n; i >= 0; i--) {
        for (int j = m; j >= 0; j--) {
            if (i == n || j == m) {
                lcs[i][j] = 0;
            } else if (strcmp(old_lines[i], new_lines[j]) == 0) {
                lcs[i][j] = lcs[i + 1][j + 1] + 1;
            } else {
                lcs[i][j] = lcs[i + 1][j] >= lcs[i][j + 1] ? lcs[i + 1][j] : lcs[i][j + 1];
            }
        }
    }
    int i = 0;
    int j = 0;
    int added = 0;
    int deleted = 0;
    while (i < n || j < m) {
        if (i < n && j < m && strcmp(old_lines[i], new_lines[j]) == 0) {
            printf(" %s\n", old_lines[i]);
            i++;
            j++;
        } else if (j == m || (i < n && lcs[i + 1][j] >= lcs[i][j + 1])) {
            printf("-%s\n", old_lines[i]);
            i++;
            deleted++;
        } else {
            printf("+%s\n", new_lines[j]);
            j++;
            added++;
        }
    }
    printf("+%d -%d\n", added, deleted);
    return 0;
}`,
      explanation: `
Минимальный diff — это задача о наибольшей общей подпоследовательности: строки, которые входят в LCS, остаются на месте, всё остальное старой версии удаляется, а новой — добавляется. Меньше изменений быть не может, иначе нашлась бы более длинная общая подпоследовательность.

Таблица суффиксов позволяет на каждом шаге знать, какой выбор сохраняет оптимальность: если пропуск строки старой версии не уменьшает LCS, её можно удалить. Правило «при равенстве — сначала удаление» делает ответ однозначным и даёт привычный вид: старая строка с \`-\`, сразу под ней новая с \`+\`.

Настоящий Git использует более быстрый алгоритм Майерса, сравнивает хеши строк вместо самих строк и группирует изменения во фрагменты \`@@\` с тремя строками контекста — но в основе та же идея минимального редактирования.`,
      examples: [
        {
          in: '4\nint main(void) {\n    printf("%g\\n", a / b);\n    return 0;\n}\n5\nint main(void) {\n    if (b == 0) return 1;\n    printf("%g\\n", a / b);\n    return 0;\n}\n',
          out: ' int main(void) {\n+    if (b == 0) return 1;\n     printf("%g\\n", a / b);\n     return 0;\n }\n+1 -0\n',
        },
        { in: '3\na\nb\nc\n3\na\nx\nc\n', out: ' a\n-b\n+x\n c\n+1 -1\n' },
      ],
      hidden: [
        { in: '0\n0\n', name: 'Оба пустые' },
        { in: '0\n2\nnew\nfile\n', name: 'Новый файл' },
        { in: '2\nold\nfile\n0\n', name: 'Файл удалён' },
        { in: '3\nsame\nlines\nhere\n3\nsame\nlines\nhere\n', name: 'Без изменений' },
        { in: '3\na\nb\nc\n3\nc\nb\na\n', name: 'Обратный порядок' },
        { in: '4\nx\na\nb\nc\n3\na\nb\nc\n', name: 'Удаление первой строки' },
        { in: '2\n  indented\nplain\n2\nindented\nplain\n', name: 'Пробелы важны' },
        { in: '5\na\nb\na\nb\na\n4\nb\na\nb\nb\n', name: 'Повторяющиеся строки' },
        { in: '3\n\nmiddle\n\n2\nmiddle\n\n', name: 'Пустые строки' },
        {
          in: '6\n#include <stdio.h>\n\nint main(void) {\n    puts("hi");\n    return 0;\n}\n7\n#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    puts("hello");\n    return EXIT_SUCCESS;\n}\n',
          name: 'Правка программы',
        },
      ],
    },
  ],
};
