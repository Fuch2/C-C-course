export default {
  id: 'advanced-makefile',
  title: 'Make и Makefile',
  description:
    'Правила Makefile, граф зависимостей и решение о пересборке по времени файлов, переменные CC и CFLAGS, автоматические переменные $@, $< и $^, шаблонные правила, зависимости от заголовков через -MMD, фиктивные цели и ключи make.',
  moduleId: 'developer-tools',
  order: 7,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['project-structure'],
  objectives: [
    'Писать правила Makefile с целями, зависимостями и рецептами',
    'Предсказывать, какие файлы пересоберёт make после изменений',
    'Сокращать Makefile переменными, автоматическими переменными и шаблонными правилами',
    'Поддерживать зависимости от заголовков автоматически',
  ],
  tags: ['Make', 'Makefile', 'Сборка', 'Зависимости', 'Автоматизация'],
  standard: 'c17',
  quiz: [
    {
      q: 'make сообщает Makefile:5: *** missing separator.  Stop. Что, скорее всего, не так в строке 5?',
      options: [
        'Строка рецепта начинается с пробелов вместо табуляции',
        'В правиле нет зависимостей',
        'Файл в зависимостях не существует',
        'Не объявлена цель .PHONY',
      ],
      correct: 0,
      explain: 'Make различает рецепт и остальное только по символу табуляции в начале строки.',
    },
    {
      q: 'Правило — main.o: main.c calc.h. Файл calc.h изменён позже, чем создан main.o. Пересоберёт ли make файл main.o? Ответьте «да» или «нет».',
      answers: ['да'],
      placeholder: 'да или нет',
      explain: 'Зависимость новее цели — значит, цель устарела, и рецепт выполняется.',
    },
    {
      q: 'Что подставит $@ в рецепте правила build/main.o: src/main.c include/calc.h?',
      options: ['build/main.o', 'src/main.c', 'src/main.c include/calc.h', 'main'],
      correct: 0,
      explain: '$@ — цель правила, $< — первая зависимость, $^ — все зависимости.',
    },
    {
      q: 'Чем $< отличается от $^?',
      options: [
        '$< — первая зависимость, $^ — все зависимости без повторов',
        '$< — все зависимости, $^ — последняя',
        '$< — цель, $^ — зависимости',
        'Ничем',
      ],
      correct: 0,
      explain: 'Компиляции нужен один исходник ($<), а линковке — все объектные файлы ($^).',
    },
    {
      q: 'Зачем писать .PHONY: clean?',
      options: [
        'Чтобы рецепт clean выполнялся, даже если в каталоге окажется файл с именем clean',
        'Чтобы clean выполнялся первым',
        'Чтобы make не печатал команды clean',
        'Без этого цель clean нельзя вызвать',
      ],
      correct: 0,
      explain:
        'Фиктивная цель не соответствует файлу. Иначе существующий файл clean сделал бы цель «актуальной».',
    },
    {
      q: 'Какую цель собирает команда make без аргументов?',
      options: [
        'Первую цель в Makefile',
        'Цель all, где бы она ни стояла',
        'Последнюю цель',
        'Все цели по очереди',
      ],
      correct: 0,
      explain:
        'Поэтому первой обычно пишут цель программы или all, которая зависит от всего, что нужно собрать.',
    },
    {
      q: 'В каких случаях make выполнит рецепт цели? Выберите все.',
      options: [
        'Файла цели не существует',
        'Одна из зависимостей новее цели',
        'Зависимость только что была пересобрана',
        'В рецепте поменяли флаги компиляции',
        'Цель и все зависимости имеют одинаковое время изменения',
      ],
      correct: [0, 1, 2],
      explain:
        'Make сравнивает только время файлов. Изменение рецепта или флагов он не замечает — после такой правки нужен make clean или make -B.',
    },
    {
      q: 'Что дают флаги -MMD -MP в рецепте компиляции?',
      options: [
        'Компилятор записывает файл .d с зависимостями объектного файла от заголовков',
        'Компиляция идёт в несколько потоков',
        'Включаются дополнительные предупреждения',
        'Make перестаёт печатать команды',
      ],
      correct: 0,
      explain:
        'Файлы .d подключаются через -include, и правка любого заголовка пересобирает именно те файлы, которые его читают.',
    },
    {
      q: 'Что делает make -n?',
      options: [
        'Печатает команды, которые были бы выполнены, но не выполняет их',
        'Собирает без предупреждений',
        'Пересобирает всё заново',
        'Собирает n целей параллельно',
      ],
      correct: 0,
      explain:
        'Сухой прогон удобен, чтобы проверить новый Makefile или понять, что make собирается пересобрать.',
    },
  ],
  exercises: [
    {
      title: 'Что пересоберёт make',
      description: `
Смоделируйте решение Make. Ввод:
- число \`n\` и \`n\` строк \`файл время\` — существующие файлы и время их изменения (целые числа ≥ 1); файлов, которых нет в списке, не существует;
- число \`r\` и \`r\` правил \`цель k зав₁ … завₖ\`;
- имя цели, которую нужно собрать.

Обработка цели:
1. Сначала обработайте каждую зависимость по порядку. Зависимость без правила должна существовать; иначе напечатайте \`make: *** No rule to make target 'X', needed by 'Y'.  Stop.\` (перед \`Stop\` два пробела) и завершите работу. Если такой файл — сама цель из командной строки, напечатайте \`make: *** No rule to make target 'X'.  Stop.\`
2. Затем выполните рецепт, если файла цели нет или хотя бы одна зависимость **строго новее** цели. Выполнение рецепта — строка \`собрать ЦЕЛЬ\`; после него файл существует, а его время — текущие часы.

Часы начинаются со значения «наибольшее время из списка + 1» и увеличиваются на 1 после каждого рецепта. Каждая цель обрабатывается один раз. Если ни один рецепт не выполнен, напечатайте \`make: 'ЦЕЛЬ' is up to date.\``,
      constraints: [
        '0 ≤ n ≤ 50; 1 ≤ r ≤ 30; 0 ≤ k ≤ 10; имена не длиннее 40 символов; граф без циклов.',
      ],
      hints: [
        'Храните для каждого имени время (0 — файла нет) и признак «уже обработан». Поиск по имени — перебор массива.',
        'Рекурсивная функция update(name, parent): обработать зависимости, затем сравнить времена. Время зависимости смотрите после её обработки — она могла пересобраться.',
        'Для остановки при ошибке удобно вызвать exit(0) из stdlib.h сразу после печати сообщения.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX 100
#define NAME 48

static char files[MAX][NAME];
static long times[MAX];
static int done[MAX];
static int file_count;
static char targets[30][NAME];
static char prereqs[30][10][NAME];
static int prereq_count[30];
static int rule_count;
static long clock_now;
static int built;

static int file_index(const char *name) {
    for (int i = 0; i < file_count; i++) {
        if (strcmp(files[i], name) == 0) {
            return i;
        }
    }
    strcpy(files[file_count], name);
    times[file_count] = 0;
    return file_count++;
}

static int rule_index(const char *name) {
    for (int i = 0; i < rule_count; i++) {
        if (strcmp(targets[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static void update(const char *name, const char *parent) {
    int file = file_index(name);
    if (done[file]) {
        return;
    }
    int rule = rule_index(name);
    if (rule < 0) {
        if (times[file] == 0) {
            if (parent != NULL) {
                printf("make: *** No rule to make target '%s', needed by '%s'.  Stop.\n", name,
                       parent);
            } else {
                printf("make: *** No rule to make target '%s'.  Stop.\n", name);
            }
            exit(0);
        }
        done[file] = 1;
        return;
    }
    int need = times[file] == 0;
    for (int i = 0; i < prereq_count[rule]; i++) {
        update(prereqs[rule][i], name);
        if (times[file_index(prereqs[rule][i])] > times[file]) {
            need = 1;
        }
    }
    if (need) {
        printf("собрать %s\n", name);
        times[file] = clock_now++;
        built++;
    }
    done[file] = 1;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        char name[NAME];
        long time;
        if (scanf("%47s %ld", name, &time) != 2) {
            return 0;
        }
        times[file_index(name)] = time;
        if (time >= clock_now) {
            clock_now = time + 1;
        }
    }
    if (clock_now == 0) {
        clock_now = 1;
    }
    if (scanf("%d", &rule_count) != 1) {
        return 0;
    }
    for (int i = 0; i < rule_count; i++) {
        if (scanf("%47s %d", targets[i], &prereq_count[i]) != 2) {
            return 0;
        }
        for (int j = 0; j < prereq_count[i]; j++) {
            if (scanf("%47s", prereqs[i][j]) != 1) {
                return 0;
            }
        }
    }
    char goal[NAME];
    if (scanf("%47s", goal) != 1) {
        return 0;
    }
    update(goal, NULL);
    if (built == 0) {
        printf("make: '%s' is up to date.\n", goal);
    }
    return 0;
}`,
      explanation: `
Решение Make — обход графа в глубину с одним сравнением в каждой вершине: «есть ли зависимость новее меня». Сначала обновляются зависимости, и только потом проверяется цель: пересобранный \`parser.o\` получает свежее время и тем самым делает устаревшей программу \`calc\`.

Равные времена не вызывают пересборку — нужна строго более новая зависимость. Отметка «обработан» гарантирует, что общий заголовок или объектный файл не будет собран дважды, даже если от него зависят несколько целей.

Обратите внимание, чего Make **не** проверяет: содержимое файлов и текст рецептов. Он доверяет времени изменения — поэтому \`touch\` вызывает пересборку, а смена флагов в Makefile — нет.`,
      examples: [
        {
          in: '7\nmain.c 1\nlexer.c 1\nlexer.h 1\nmain.o 2\nlexer.o 2\ncalc 3\nparser.c 5\n4\ncalc 3 main.o lexer.o parser.o\nmain.o 2 main.c lexer.h\nlexer.o 2 lexer.c lexer.h\nparser.o 2 parser.c lexer.h\ncalc\n',
          out: 'собрать parser.o\nсобрать calc\n',
        },
        {
          in: '3\na.c 1\na.o 2\napp 3\n2\napp 1 a.o\na.o 1 a.c\napp\n',
          out: "make: 'app' is up to date.\n",
        },
      ],
      hidden: [
        {
          in: '2\nmain.c 1\nlexer.c 1\n3\ncalc 2 main.o lexer.o\nmain.o 1 main.c\nlexer.o 1 lexer.c\ncalc\n',
          name: 'Чистая сборка',
        },
        {
          in: '6\nmain.c 1\nutil.c 1\ncalc.h 9\nmain.o 5\nutil.o 5\ncalc 6\n3\ncalc 2 main.o util.o\nmain.o 2 main.c calc.h\nutil.o 1 util.c\ncalc\n',
          name: 'Изменён заголовок',
        },
        {
          in: '4\nmain.c 1\ncalc.h 9\nmain.o 5\ncalc 6\n3\ncalc 2 main.o util.o\nmain.o 2 main.c calc.h\nutil.o 1 util.c\ncalc\n',
          name: 'Остановка на середине',
        },
        {
          in: '2\na.c 4\na.o 4\n1\na.o 1 a.c\na.o\n',
          name: 'Равные времена',
        },
        {
          in: '1\nmain.c 1\n1\nmain.o 2 main.c config.h\nmain.o\n',
          name: 'Нет заголовка',
        },
        {
          in: '3\nclean_marker 1\nx.c 2\nx.o 3\n2\nall 1 x.o\nx.o 1 x.c\nall\n',
          name: 'Цель без файла',
        },
        {
          in: '4\ncommon.h 10\na.c 1\nb.c 1\napp 5\n4\napp 2 a.o b.o\na.o 2 a.c common.h\nb.o 2 b.c common.h\nunused 1 a.c\napp\n',
          name: 'Общий заголовок',
        },
        {
          in: '4\ngen.py 1\ntable.c 2\ntable.o 3\nprog 4\n3\nprog 1 table.o\ntable.o 1 table.c\ntable.c 1 gen.py\nprog\n',
          name: 'Сгенерированный файл актуален',
        },
        {
          in: '4\ngen.py 7\ntable.c 2\ntable.o 3\nprog 4\n3\nprog 1 table.o\ntable.o 1 table.c\ntable.c 1 gen.py\nprog\n',
          name: 'Цепочка пересборки',
        },
      ],
    },
    {
      title: 'Раскрытие переменных',
      description: `
Смоделируйте, как Make раскрывает рецепт. Ввод:
- число \`m\` и \`m\` строк \`ИМЯ = значение\` (значение может быть пустым и может ссылаться на другие переменные);
- строка правила \`цель: зав₁ зав₂ …\`;
- число \`c\` и \`c\` строк рецепта (в начале строки может стоять табуляция — она не печатается).

В каждой строке рецепта замените:
- \`$(ИМЯ)\` и \`\${ИМЯ}\` — значением переменной, **раскрытым** по тем же правилам (неизвестная переменная — пустая строка);
- \`$@\` — целью, \`$<\` — первой зависимостью, \`$^\` — всеми зависимостями через пробел без повторов;
- \`$$\` — одним символом \`$\`.

Напечатайте раскрытые строки так, как их показал бы Make: строки, начинающиеся с \`@\`, выполняются молча и **не печатаются**.`,
      constraints: [
        '0 ≤ m ≤ 20; 1 ≤ c ≤ 10; строки не длиннее 200 символов, раскрытые — не длиннее 1000.',
        'Переменные не ссылаются сами на себя ни прямо, ни через другие.',
      ],
      hints: [
        'Напишите рекурсивную функцию expand(const char *text, char *out), которая дописывает результат в out. Для $(ИМЯ) она находит значение и вызывает себя для него.',
        'Строку переменной разделите по первому =: имя — часть до него без пробелов по краям, значение — часть после без ведущих пробелов.',
        'Для $^ перед добавлением зависимости проверяйте, не встречалась ли она раньше в списке.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 256
#define OUT 2048

static char var_names[20][LINE];
static char var_values[20][LINE];
static int var_count;
static char target[LINE];
static char prereqs[20][LINE];
static int prereq_count;

static void trim_right(char *text) {
    size_t length = strlen(text);
    while (length > 0 && (text[length - 1] == ' ' || text[length - 1] == '\n' ||
                          text[length - 1] == '\r' || text[length - 1] == '\t')) {
        text[--length] = '\0';
    }
}

static const char *lookup(const char *name) {
    for (int i = 0; i < var_count; i++) {
        if (strcmp(var_names[i], name) == 0) {
            return var_values[i];
        }
    }
    return "";
}

static void expand(const char *text, char *out) {
    for (const char *p = text; *p != '\0'; p++) {
        if (*p != '$' || p[1] == '\0') {
            strncat(out, p, 1);
            continue;
        }
        p++;
        if (*p == '$') {
            strcat(out, "$");
        } else if (*p == '@') {
            strcat(out, target);
        } else if (*p == '<') {
            if (prereq_count > 0) {
                strcat(out, prereqs[0]);
            }
        } else if (*p == '^') {
            for (int i = 0; i < prereq_count; i++) {
                int repeated = 0;
                for (int j = 0; j < i && !repeated; j++) {
                    repeated = strcmp(prereqs[i], prereqs[j]) == 0;
                }
                if (!repeated) {
                    if (i > 0) {
                        strcat(out, " ");
                    }
                    strcat(out, prereqs[i]);
                }
            }
        } else if (*p == '(' || *p == '{') {
            char close = *p == '(' ? ')' : '}';
            const char *end = strchr(p + 1, close);
            if (end == NULL) {
                return;
            }
            char name[LINE];
            size_t length = (size_t)(end - p - 1);
            memcpy(name, p + 1, length);
            name[length] = '\0';
            expand(lookup(name), out);
            p = end;
        } else {
            char name[2] = {*p, '\0'};
            expand(lookup(name), out);
        }
    }
}

int main(void) {
    char line[LINE];
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &var_count) != 1) {
        return 0;
    }
    for (int i = 0; i < var_count && fgets(line, sizeof line, stdin) != NULL; i++) {
        trim_right(line);
        char *equals = strchr(line, '=');
        if (equals == NULL) {
            continue;
        }
        *equals = '\0';
        trim_right(line);
        const char *name = line;
        while (*name == ' ') {
            name++;
        }
        const char *value = equals + 1;
        while (*value == ' ') {
            value++;
        }
        strcpy(var_names[i], name);
        strcpy(var_values[i], value);
    }
    if (fgets(line, sizeof line, stdin) == NULL) {
        return 0;
    }
    trim_right(line);
    char *colon = strchr(line, ':');
    if (colon == NULL) {
        return 0;
    }
    *colon = '\0';
    strcpy(target, line);
    for (char *word = strtok(colon + 1, " "); word != NULL; word = strtok(NULL, " ")) {
        strcpy(prereqs[prereq_count++], word);
    }
    int count = 0;
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &count) != 1) {
        return 0;
    }
    for (int i = 0; i < count && fgets(line, sizeof line, stdin) != NULL; i++) {
        trim_right(line);
        const char *command = line;
        while (*command == '\t' || *command == ' ') {
            command++;
        }
        if (*command == '@') {
            continue;
        }
        char out[OUT] = "";
        expand(command, out);
        puts(out);
    }
    return 0;
}`,
      explanation: `
Переменные, заданные через \`=\`, в Make **рекурсивные**: значение хранится как текст и раскрывается в момент использования. Поэтому \`CFLAGS = $(WARN) -g\` работает, даже если \`WARN\` определена ниже, — к моменту выполнения рецепта известны все переменные. Рекурсивный вызов \`expand\` для значения повторяет это правило.

Автоматические переменные вычисляются для конкретного правила: в шаблонном \`build/%.o: src/%.c\` одна строка рецепта \`$(CC) -c $< -o $@\` превращается в разные команды для каждого файла. \`$$\` нужен, когда в команде оболочки нужен настоящий \`$\`, например \`echo $$HOME\`.`,
      examples: [
        {
          in: '3\nCC = gcc\nWARN = -Wall -Wextra\nCFLAGS = -std=c17 $(WARN) -g\nbuild/lexer.o: src/lexer.c include/lexer.h\n1\n\t$(CC) $(CFLAGS) -c $< -o $@\n',
          out: 'gcc -std=c17 -Wall -Wextra -g -c src/lexer.c -o build/lexer.o\n',
        },
        {
          in: '1\nCC = clang\ncalc: main.o lexer.o main.o\n2\n\t@mkdir -p build\n\t$(CC) $^ -o $@ $(LDLIBS)\n',
          out: 'clang main.o lexer.o -o calc \n',
        },
      ],
      hidden: [
        { in: '0\nall: a b\n1\n\techo $@ $< $^\n', name: 'Только автоматические' },
        { in: '1\nX = 1\nt: p\n1\n\techo $$X $(X) ${X}\n', name: 'Доллар и скобки' },
        { in: '2\nA = $(B) $(B)\nB = hi\nt:\n1\n\techo $(A) [$<]\n', name: 'Ссылка вперёд' },
        { in: '1\nEMPTY =\nx.o: x.c\n1\n\tgcc $(EMPTY)-c $(MISSING)$<\n', name: 'Пустые значения' },
        { in: '0\nt: p\n3\n\t@echo скрыто\n\techo видно\n\t@true\n', name: 'Скрытые команды' },
        {
          in: '4\nCC = gcc\nCPPFLAGS = -Iinclude\nOPT = -O2\nCFLAGS = $(OPT) -DNDEBUG\nbuild/net.o: src/net.c include/net.h include/util.h\n1\n\t$(CC) $(CPPFLAGS) $(CFLAGS) -MMD -MP -c $< -o $@\n',
          name: 'Шаблонное правило',
        },
        {
          in: '1\nRM = rm -rf\nclean:\n1\n\t$(RM) build $@.log\n',
          name: 'Правило без зависимостей',
        },
        { in: '1\nO = obj\nt: a\n1\n\techo $O-$@\n', name: 'Однобуквенная переменная' },
        {
          in: '2\nSHELL_HOME = $$HOME\nDIR = ${SHELL_HOME}/bin\ninstall: app\n1\n\tcp $< $(DIR)/$<\n',
          name: 'Доллар внутри значения',
        },
      ],
    },
    {
      title: 'Шаблонные правила',
      difficulty: 'advanced',
      description: `
Смоделируйте выбор шаблонного правила. В первой строке — число правил \`p\`, далее \`p\` строк \`шаблон_цели шаблон_зависимости\`, в каждом шаблоне ровно один символ \`%\`. Затем число целей \`q\` и \`q\` имён.

Шаблон цели совпадает с именем, если имя начинается с части шаблона до \`%\`, заканчивается частью после \`%\`, а между ними остаётся хотя бы один символ — **основа** (stem). Например, \`build/%.o\` совпадает с \`build/main.o\` с основой \`main\`.

Если подходит несколько правил, выбирается правило с **самой короткой** основой, при равенстве — объявленное раньше (так поступает GNU Make). Для каждой цели напечатайте \`цель <- зависимость\`, где в шаблоне зависимости \`%\` заменён основой, или \`цель: нет правила\`.`,
      constraints: ['1 ≤ p ≤ 10; 1 ≤ q ≤ 20; строки не длиннее 100 символов.'],
      hints: [
        "Разделите шаблон на префикс и суффикс: char *percent = strchr(pattern, '%'). Длины частей — percent - pattern и strlen(percent + 1).",
        'Имя подходит, если strlen(name) > len(prefix) + len(suffix), strncmp с префиксом в начале и strcmp с суффиксом в конце равны нулю. Длина основы — разность длин.',
        'Перебирайте правила и запоминайте лучшее: меньшая длина основы побеждает, равная — нет (так сохраняется более раннее правило).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 128

static char target_patterns[10][LINE];
static char prereq_patterns[10][LINE];

/* Возвращает длину основы или -1, если шаблон не совпадает с именем. */
static int match(const char *pattern, const char *name) {
    const char *percent = strchr(pattern, '%');
    size_t prefix = (size_t)(percent - pattern);
    size_t suffix = strlen(percent + 1);
    size_t length = strlen(name);
    if (length <= prefix + suffix) {
        return -1;
    }
    if (strncmp(name, pattern, prefix) != 0 || strcmp(name + length - suffix, percent + 1) != 0) {
        return -1;
    }
    return (int)(length - prefix - suffix);
}

int main(void) {
    int p;
    if (scanf("%d", &p) != 1) {
        return 0;
    }
    for (int i = 0; i < p; i++) {
        if (scanf("%127s %127s", target_patterns[i], prereq_patterns[i]) != 2) {
            return 0;
        }
    }
    int q;
    if (scanf("%d", &q) != 1) {
        return 0;
    }
    for (int i = 0; i < q; i++) {
        char name[LINE];
        if (scanf("%127s", name) != 1) {
            break;
        }
        int best = -1;
        int best_stem = 0;
        for (int r = 0; r < p; r++) {
            int stem = match(target_patterns[r], name);
            if (stem > 0 && (best < 0 || stem < best_stem)) {
                best = r;
                best_stem = stem;
            }
        }
        if (best < 0) {
            printf("%s: нет правила\n", name);
            continue;
        }
        const char *percent = strchr(target_patterns[best], '%');
        const char *stem = name + (percent - target_patterns[best]);
        const char *prereq = prereq_patterns[best];
        const char *slot = strchr(prereq, '%');
        printf("%s <- %.*s%.*s%s\n", name, (int)(slot - prereq), prereq, best_stem, stem, slot + 1);
    }
    return 0;
}`,
      explanation: `
Шаблонное правило — это функция «имя цели → имя исходника». Основа переносит изменяемую часть имени из цели в зависимость: \`build/net.o\` с основой \`net\` превращается в \`src/net.c\`.

Правило самой короткой основы выбирает **самый конкретный** шаблон. Для \`build/main.o\` подходят и \`%.o\` (основа \`build/main\`), и \`build/%.o\` (основа \`main\`) — побеждает второй, потому что он точнее описывает файл. Так в одном Makefile уживаются общее правило и частные исключения, и порядок их записи почти не важен.

Основа не может быть пустой: шаблон \`%.o\` не совпадает с именем \`.o\`.`,
      examples: [
        {
          in: '2\n%.o %.c\nbuild/%.o src/%.c\n3\nlexer.o\nbuild/main.o\nREADME.md\n',
          out: 'lexer.o <- lexer.c\nbuild/main.o <- src/main.c\nREADME.md: нет правила\n',
        },
        { in: '1\nlib%.a %.list\n1\nlibmath.a\n', out: 'libmath.a <- math.list\n' },
      ],
      hidden: [
        { in: '1\n%.o %.c\n1\n.o\n', name: 'Пустая основа' },
        { in: '2\nbuild/%.o src/%.c\n%.o %.c\n1\nbuild/x.o\n', name: 'Порядок не важен' },
        { in: '2\n%.o %.c\n%.o %.cpp\n1\nmain.o\n', name: 'Равные основы — первое правило' },
        {
          in: '3\n%.o %.c\nbuild/%.o src/%.c\nbuild/test_%.o tests/%.c\n3\nbuild/test_list.o\nbuild/list.o\nother/list.o\n',
          name: 'Самое конкретное правило',
        },
        { in: '1\n%_test %_test.c\n2\nlist_test\ntest\n', name: 'Суффикс цели' },
        {
          in: '1\ndocs/%.html docs/%.md\n2\ndocs/a/b.html\ndocs.html\n',
          name: 'Основа с каталогом',
        },
        { in: '1\n% %.c\n2\napp\nx\n', name: 'Шаблон из одного %' },
        { in: '1\n%.o %.c\n3\na.o.o\na.c\nab.o\n', name: 'Повтор суффикса' },
        {
          in: '2\nout/%.txt in/%.txt\nout/%.txt.gz out/%.txt\n2\nout/r.txt.gz\nout/r.txt\n',
          name: 'Похожие суффиксы',
        },
      ],
    },
  ],
};
