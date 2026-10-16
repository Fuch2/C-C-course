export default {
  id: 'project-structure',
  title: 'Структура проекта',
  description:
    'Раскладка каталогов include, src, tests и build, модуль как пара заголовка и реализации, правила заголовков, static и префиксы имён, слои зависимостей без циклов и сборка вне исходников.',
  moduleId: 'developer-tools',
  order: 6,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['link-errors'],
  objectives: [
    'Раскладывать файлы проекта по каталогам include, src, tests и build',
    'Разделять модуль на заголовок-интерфейс и файл реализации',
    'Скрывать внутренние функции через static и именовать публичные с префиксом',
    'Замечать циклические зависимости между модулями',
  ],
  tags: ['Структура проекта', 'Модули', 'Заголовки', 'Зависимости', 'Сборка'],
  standard: 'c17',
  quiz: [
    {
      q: 'Где в типичном проекте лежат заголовки, которыми пользуются другие части программы и внешние пользователи?',
      options: ['include/', 'src/', 'build/', 'tests/'],
      correct: 0,
      explain:
        'include/ — публичный интерфейс. Внутренние заголовки, нужные только реализации, оставляют в src/.',
    },
    {
      q: 'Зачем складывать объектные и исполняемые файлы в отдельный каталог build/?',
      options: [
        'Результаты сборки не смешиваются с исходниками, их легко удалить и исключить из Git',
        'Компилятор работает быстрее, если файлы в build/',
        'Без каталога build/ линковщик не найдёт объектные файлы',
        'Так требует стандарт C17',
      ],
      correct: 0,
      explain: 'Чистая сборка — rm -r build, а в .gitignore достаточно одной строки build/.',
    },
    {
      q: 'Что должно находиться в заголовке модуля? Выберите все.',
      options: [
        'Прототипы публичных функций',
        'Объявления глобальных переменных с extern',
        'Определения типов, которые используют эти функции',
        'Тело публичной функции',
        'static-функции, нужные только реализации',
      ],
      correct: [0, 1, 2],
      explain:
        'Тело функции в заголовке даст multiple definition, если заголовок подключат два файла. Внутренние static-функции — дело файла .c.',
    },
    {
      q: 'Почему в stack.c первым подключают собственный заголовок stack.h?',
      options: [
        'Если stack.h забыл нужный #include, ошибка сразу проявится при компиляции stack.c',
        'Иначе линковщик не найдёт функции модуля',
        'Так быстрее работает препроцессор',
        'Иначе не сработает include guard',
      ],
      correct: 0,
      explain: 'Заголовок должен быть самодостаточным. Первая строка .c — его бесплатная проверка.',
    },
    {
      q: 'Публичные заголовки лежат в include/net/socket.h. Какой флаг нужно передать компилятору, чтобы писать #include "net/socket.h"?',
      answers: ['-Iinclude', '-I include', '-I./include', '-I include/'],
      placeholder: 'Флаг',
      explain:
        'Путь в #include отсчитывается от каталога поиска; каталогом поиска становится include.',
    },
    {
      q: 'Зачем публичным функциям модуля стека давать имена вида calc_stack_push, а не просто push?',
      options: [
        'Все глобальные имена программы на C находятся в одном пространстве, и префикс предотвращает конфликты',
        'Так требует линковщик',
        'Без префикса функцию нельзя объявить в заголовке',
        'Префикс ускоряет вызов функции',
      ],
      correct: 0,
      explain:
        'Функция push в модуле стека и push в модуле очереди дали бы multiple definition. Префикс заменяет пространства имён.',
    },
    {
      q: 'Функция is_full используется только внутри stack.c. Как её правильно объявить?',
      options: [
        'static int is_full(...) в stack.c, без упоминания в заголовке',
        'int is_full(...) в stack.h',
        'extern int is_full(...) в stack.c',
        'inline int is_full(...) в stack.h без static',
      ],
      correct: 0,
      explain:
        'static делает символ локальным: он не виден линковщику и не столкнётся с is_full другого модуля.',
    },
    {
      q: 'lexer.h подключает parser.h, а parser.h — lexer.h. Чем это плохо?',
      options: [
        'Модули нельзя понять и протестировать по отдельности, а порядок включений становится хрупким',
        'Препроцессор зациклится навсегда даже с include guard',
        'Это ошибка компиляции в любом случае',
        'Ничем, так принято в больших проектах',
      ],
      correct: 0,
      explain:
        'Include guard спасает от бесконечного включения, но не от запутанной архитектуры. Общие типы выносят в отдельный нижний модуль.',
    },
  ],
  exercises: [
    {
      title: 'Ревизия модуля',
      difficulty: 'beginner',
      description: `
Проверьте, согласованы ли заголовок модуля и его реализация. Ввод:
- первая строка — префикс модуля, например \`stack\`;
- вторая — число \`k\` и \`k\` имён функций, объявленных в заголовке;
- третья — число \`m\` и \`m\` определений из файла \`.c\`: имя, перед которым может стоять слово \`static\`.

Напечатайте замечания в таком порядке:
1. для каждого имени из заголовка по порядку: \`не определена: X\`, если в \`.c\` нет его определения, или \`static, но объявлена в заголовке: X\`, если определение есть, но со \`static\`;
2. для каждого определения без \`static\`, которого нет в заголовке: \`должна быть static: X\`;
3. для каждого имени из заголовка, которое не начинается с \`префикс_\`: \`нет префикса: X\`.

Если замечаний нет, напечатайте \`модуль в порядке\`.`,
      constraints: ['0 ≤ k, m ≤ 20; имена не длиннее 40 символов.'],
      hints: [
        'Определения читайте по словам: если прочитано static, следующее слово — имя, и у него отметка is_static = 1.',
        'Проверка префикса: сравните первые strlen(prefix) символов через strncmp и убедитесь, что следующий символ — _.',
        'Каждое правило — отдельный цикл по своему списку. Считайте замечания, чтобы в конце решить, печатать ли «модуль в порядке».',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define NAME 64

static char declared[20][NAME];
static char defined[20][NAME];
static int is_static[20];
static int declared_count;
static int defined_count;

static int find_defined(const char *name) {
    for (int i = 0; i < defined_count; i++) {
        if (strcmp(defined[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static int is_declared(const char *name) {
    for (int i = 0; i < declared_count; i++) {
        if (strcmp(declared[i], name) == 0) {
            return 1;
        }
    }
    return 0;
}

int main(void) {
    char prefix[NAME];
    if (scanf("%63s %d", prefix, &declared_count) != 2) {
        return 0;
    }
    for (int i = 0; i < declared_count; i++) {
        if (scanf("%63s", declared[i]) != 1) {
            return 0;
        }
    }
    if (scanf("%d", &defined_count) != 1) {
        return 0;
    }
    for (int i = 0; i < defined_count; i++) {
        char word[NAME];
        if (scanf("%63s", word) != 1) {
            return 0;
        }
        is_static[i] = strcmp(word, "static") == 0;
        if (is_static[i] && scanf("%63s", word) != 1) {
            return 0;
        }
        strcpy(defined[i], word);
    }
    int notes = 0;
    for (int i = 0; i < declared_count; i++) {
        int index = find_defined(declared[i]);
        if (index < 0) {
            printf("не определена: %s\n", declared[i]);
            notes++;
        } else if (is_static[index]) {
            printf("static, но объявлена в заголовке: %s\n", declared[i]);
            notes++;
        }
    }
    for (int i = 0; i < defined_count; i++) {
        if (!is_static[i] && !is_declared(defined[i])) {
            printf("должна быть static: %s\n", defined[i]);
            notes++;
        }
    }
    size_t length = strlen(prefix);
    for (int i = 0; i < declared_count; i++) {
        if (strncmp(declared[i], prefix, length) != 0 || declared[i][length] != '_') {
            printf("нет префикса: %s\n", declared[i]);
            notes++;
        }
    }
    if (notes == 0) {
        printf("модуль в порядке\n");
    }
    return 0;
}`,
      explanation: `
Каждое замечание — будущая ошибка сборки или архитектуры. Объявленная, но не определённая функция даст \`undefined reference\` у первого же пользователя. \`static\`-определение для объявленной в заголовке функции — тоже: символ локальный, и линковщик его не увидит. Публичная функция без объявления в заголовке — лишний глобальный символ, который рано или поздно столкнётся с одноимённым.

Проверка префикса требует символа \`_\` после префикса: \`stackpush\` и \`stacks_count\` не принадлежат модулю \`stack\`, хотя начинаются с тех же букв. Похожие проверки выполняют линтеры и скрипты в CI больших проектов.`,
      examples: [
        {
          in: 'stack\n3 stack_init stack_push stack_pop\n4 stack_init stack_push stack_pop static is_full\n',
          out: 'модуль в порядке\n',
        },
        {
          in: 'stack\n2 stack_push peek\n3 static stack_push grow peek\n',
          out: 'static, но объявлена в заголовке: stack_push\nдолжна быть static: grow\nнет префикса: peek\n',
        },
      ],
      hidden: [
        { in: 'list\n1 list_free\n0\n', name: 'Не определена' },
        { in: 'list\n0\n2 helper static other\n', name: 'Без заголовка' },
        {
          in: 'queue\n2 queue_push queuepop\n2 queue_push queuepop\n',
          name: 'Префикс без подчёркивания',
        },
        { in: 'io\n2 io_read io_write\n2 io_write io_read\n', name: 'Другой порядок' },
        { in: 'net\n0\n0\n', name: 'Пустой модуль' },
        {
          in: 'calc\n3 calc_eval calc_parse eval\n5 calc_eval static calc_parse static tokenize eval dump\n',
          name: 'Все виды замечаний',
        },
        { in: 'str\n1 strings_join\n1 strings_join\n', name: 'Похожий префикс' },
        { in: 'map\n2 map_get map_set\n3 static hash map_get map_set\n', name: 'Хороший модуль' },
        { in: 'log\n1 log_line\n2 log_line log_line_internal\n', name: 'Лишняя глобальная' },
      ],
    },
    {
      title: 'Относительный путь',
      description: `
Вычислите относительный путь от каталога до файла — так записывают пути в \`#include\` и в файлах сборки. В первой строке — число запросов \`q\`. Каждый запрос — две строки: абсолютный путь каталога и абсолютный путь файла.

Пути нормализованы: начинаются с \`/\`, не содержат \`.\`, \`..\`, повторных и завершающих \`/\`; корень записан как \`/\`. Напечатайте для каждого запроса путь, который ведёт из каталога к файлу: сначала нужное число \`..\`, затем каталоги вниз и имя файла, всё через \`/\`.`,
      constraints: ['1 ≤ q ≤ 10; пути не длиннее 200 символов.'],
      hints: [
        'Разбейте оба пути на компоненты через strtok(copy, "/") и сохраните указатели в массивы.',
        'Общая часть — сколько первых компонентов каталога совпадает с компонентами каталога файла (всех, кроме последнего). Сравнивайте компоненты целиком через strcmp, а не строки посимвольно.',
        'Ответ: (число компонентов каталога − общая часть) раз "../", затем оставшиеся компоненты файла через "/".',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 256

static int split(char *path, char *parts[]) {
    int count = 0;
    for (char *part = strtok(path, "/"); part != NULL; part = strtok(NULL, "/")) {
        parts[count++] = part;
    }
    return count;
}

int main(void) {
    int q;
    char line[LINE];
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &q) != 1) {
        return 0;
    }
    for (int query = 0; query < q; query++) {
        char from[LINE];
        char to[LINE];
        if (fgets(from, sizeof from, stdin) == NULL || fgets(to, sizeof to, stdin) == NULL) {
            break;
        }
        from[strcspn(from, "\r\n")] = '\0';
        to[strcspn(to, "\r\n")] = '\0';
        char *from_parts[LINE];
        char *to_parts[LINE];
        int from_count = split(from, from_parts);
        int to_count = split(to, to_parts);
        int common = 0;
        while (common < from_count && common < to_count - 1 &&
               strcmp(from_parts[common], to_parts[common]) == 0) {
            common++;
        }
        for (int i = common; i < from_count; i++) {
            printf("../");
        }
        for (int i = common; i < to_count; i++) {
            printf("%s%s", to_parts[i], i + 1 < to_count ? "/" : "\n");
        }
    }
    return 0;
}`,
      explanation: `
Относительный путь — это «подняться до общего предка, затем спуститься». Общий предок — самый длинный общий **набор компонентов**, а не общий префикс строк: у \`/home/ann\` и \`/home/anna/x.c\` общий только \`/home\`, хотя строки совпадают на девять символов. Поэтому пути сначала разбиваются на компоненты.

Последний компонент файла — его имя, а не каталог, поэтому он не участвует в поиске общего предка: файл \`/a/b\` из каталога \`/a/b\` невозможен, а из каталога \`/a\` это просто \`b\`.`,
      examples: [
        { in: '1\n/home/u/calc/src\n/home/u/calc/include/calc.h\n', out: '../include/calc.h\n' },
        {
          in: '2\n/home/u/calc\n/home/u/calc/main.c\n/a/b/c\n/a/x.h\n',
          out: 'main.c\n../../x.h\n',
        },
      ],
      hidden: [
        { in: '1\n/\n/x.h\n', name: 'Из корня' },
        { in: '1\n/home/ann\n/home/anna/x.c\n', name: 'Похожие имена' },
        { in: '1\n/a/b\n/a/b/c/d/e.h\n', name: 'Только вниз' },
        { in: '1\n/a/b/c/d\n/e.h\n', name: 'Только вверх до корня' },
        { in: '1\n/p/src/net\n/p/include/net/socket.h\n', name: 'Параллельные деревья' },
        { in: '1\n/x/y\n/z/w.c\n', name: 'Нет общего предка кроме корня' },
        { in: '1\n/p/tests\n/p/tests/unit/main_test.c\n', name: 'Вложенный тест' },
        {
          in: '3\n/w/build\n/w/src/main.c\n/w/src\n/w/build/main.o\n/w\n/w/CMakeLists.txt\n',
          name: 'Несколько запросов',
        },
        { in: '1\n/a/a/a\n/a/a/a/a.h\n', name: 'Повторяющиеся имена' },
      ],
    },
    {
      title: 'Циклические зависимости',
      difficulty: 'advanced',
      description: `
Проверьте граф зависимостей модулей. В первой строке — число модулей \`n\`. Далее \`n\` строк \`имя k зав₁ … завₖ\`: модуль и модули, заголовки которых он подключает.

Обойдите граф в глубину: модули — в порядке ввода, зависимости — в порядке строки. Если найден цикл, напечатайте первый найденный в виде \`цикл: a -> b -> c -> a\` (от модуля, с которого цикл начинается, до него же) и больше ничего.

Если циклов нет, напечатайте \`порядок сборки:\` и модули через пробел в таком порядке, чтобы каждый модуль шёл **после** всех своих зависимостей: модуль добавляется в список, когда обход всех его зависимостей завершён.`,
      constraints: [
        '1 ≤ n ≤ 30; 0 ≤ k ≤ 10; имена не длиннее 30 символов.',
        'Каждая зависимость описана в одной из n строк.',
      ],
      hints: [
        'Используйте три состояния модуля: 0 — не посещён, 1 — в текущем пути обхода, 2 — полностью обработан. Встреча модуля в состоянии 1 означает цикл.',
        'Храните текущий путь обхода в массиве-стеке path. Цикл — часть пути от найденного модуля до конца плюс он сам ещё раз.',
        'Модуль добавляйте в порядок сборки в момент, когда переводите его в состояние 2.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MODULES 30
#define NAME 32

static char names[MODULES][NAME];
static char deps[MODULES][10][NAME];
static int dep_count[MODULES];
static int state[MODULES];
static int module_count;
static int path[MODULES];
static int path_length;
static int order[MODULES];
static int order_length;

static int find(const char *name) {
    for (int i = 0; i < module_count; i++) {
        if (strcmp(names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

/* Возвращает 1, если найден и напечатан цикл. */
static int visit(int module) {
    state[module] = 1;
    path[path_length++] = module;
    for (int i = 0; i < dep_count[module]; i++) {
        int next = find(deps[module][i]);
        if (next < 0 || state[next] == 2) {
            continue;
        }
        if (state[next] == 1) {
            int start = 0;
            while (path[start] != next) {
                start++;
            }
            printf("цикл:");
            for (int j = start; j < path_length; j++) {
                printf(" %s ->", names[path[j]]);
            }
            printf(" %s\n", names[next]);
            return 1;
        }
        if (visit(next)) {
            return 1;
        }
    }
    path_length--;
    state[module] = 2;
    order[order_length++] = module;
    return 0;
}

int main(void) {
    if (scanf("%d", &module_count) != 1) {
        return 0;
    }
    for (int i = 0; i < module_count; i++) {
        if (scanf("%31s %d", names[i], &dep_count[i]) != 2) {
            return 0;
        }
        for (int j = 0; j < dep_count[i]; j++) {
            if (scanf("%31s", deps[i][j]) != 1) {
                return 0;
            }
        }
    }
    for (int i = 0; i < module_count; i++) {
        if (state[i] == 0 && visit(i)) {
            return 0;
        }
    }
    printf("порядок сборки:");
    for (int i = 0; i < order_length; i++) {
        printf(" %s", names[order[i]]);
    }
    putchar('\n');
    return 0;
}`,
      explanation: `
Три состояния отличают «уже видели в **другой** ветке» (2 — безопасно, просто пропустить) от «видим в **текущем** пути» (1 — вернулись туда, откуда пришли, это цикл). Двух состояний не хватило бы: ромб \`a → b → d\`, \`a → c → d\` выглядел бы как цикл.

Порядок, в котором модули завершают обход, — топологическая сортировка: модуль заканчивает обработку только после всех своих зависимостей, значит, они в списке раньше него. В таком порядке модули можно собирать и тестировать снизу вверх. Тот же алгоритм используют Make и CMake, когда решают, какую цель собирать первой.`,
      examples: [
        {
          in: '3\nmain 1 parser\nparser 1 lexer\nlexer 0\n',
          out: 'порядок сборки: lexer parser main\n',
        },
        {
          in: '3\nlexer 1 parser\nparser 1 eval\neval 1 lexer\n',
          out: 'цикл: lexer -> parser -> eval -> lexer\n',
        },
      ],
      hidden: [
        { in: '1\nsolo 0\n', name: 'Один модуль' },
        { in: '1\nself 1 self\n', name: 'Зависит сам от себя' },
        { in: '4\na 2 b c\nb 1 d\nc 1 d\nd 0\n', name: 'Ромб — не цикл' },
        { in: '4\nmain 1 a\na 1 b\nb 1 c\nc 1 a\n', name: 'Цикл не с первого модуля' },
        { in: '3\nx 0\ny 0\nz 0\n', name: 'Независимые модули' },
        {
          in: '6\napp 2 net ui\nnet 2 proto util\nui 1 util\nproto 1 util\nutil 0\ntests 2 net ui\n',
          name: 'Слои',
        },
        {
          in: '4\nutil 0\nlog 1 util\nconfig 2 log util\nmain 2 config log\n',
          name: 'Нижние модули первыми',
        },
        { in: '5\na 1 b\nb 0\nc 1 d\nd 1 e\ne 1 c\n', name: 'Цикл во второй компоненте' },
        { in: '3\na 2 b c\nb 0\nc 1 a\n', name: 'Цикл через вторую зависимость' },
      ],
    },
  ],
};
