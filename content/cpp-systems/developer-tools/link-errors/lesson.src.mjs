export default {
  id: 'link-errors',
  title: 'Линковка и ошибки линковки',
  description:
    'Что делает линковщик: разрешение символов, перемещение и стартовый код; undefined reference и multiple definition, отсутствие проверки типов, статические и динамические библиотеки, -L и -l, порядок библиотек, ldd и ошибки загрузки.',
  moduleId: 'developer-tools',
  order: 5,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['gcc-and-clang'],
  objectives: [
    'Объяснять, как линковщик сопоставляет неопределённые символы с определениями',
    'Находить причину undefined reference и multiple definition',
    'Создавать и подключать статические и динамические библиотеки',
    'Располагать библиотеки в команде сборки в правильном порядке',
  ],
  tags: ['Линковка', 'Библиотеки', 'undefined reference', 'multiple definition', 'ld'],
  standard: 'c17',
  quiz: [
    {
      q: 'Сборка gcc main.c -o app завершилась ошибкой undefined reference to `parse_config`. Функция определена в config.c. Что вероятнее всего не так?',
      options: [
        'Файл config.c не передан в команду сборки',
        'В main.c не подключён заголовок config.h',
        'В вызове parse_config неверное число аргументов',
        'Не хватает флага -Wall',
      ],
      correct: 0,
      explain:
        'Ошибка линковки означает, что определения нет среди переданных файлов. Проблемы с заголовком или аргументами обнаружил бы компилятор.',
    },
    {
      q: 'В log.h написано тело функции log_line. Заголовок подключают main.c и util.c, оба защищены include guard. Что произойдёт при линковке?',
      options: [
        'multiple definition of `log_line`',
        'Всё соберётся: include guard не даст определить функцию дважды',
        'undefined reference to `log_line`',
        'Ошибка компиляции в util.c',
      ],
      correct: 0,
      explain:
        'Include guard действует внутри одной единицы трансляции. main.c и util.c компилируются отдельно, и определение попадает в оба объектных файла.',
    },
    {
      q: 'Почему gcc -L. -lgeometry main.o -o app не находит функцию из библиотеки, а gcc main.o -L. -lgeometry -o app находит?',
      options: [
        'Из статической библиотеки берутся только файлы для уже известных неопределённых символов, а аргументы читаются слева направо',
        '-l работает только в конце команды по синтаксису gcc',
        'Флаг -L действует только на следующий аргумент',
        'В первой команде библиотека подключается как динамическая',
      ],
      correct: 0,
      explain:
        'Когда линковщик читает библиотеку первой, ни один символ ещё не нужен — библиотека пропускается, и к ней он не возвращается.',
    },
    {
      q: 'Какой файл ищет линковщик для флага -lcalc?',
      options: ['libcalc.so или libcalc.a', 'calc.o', 'calc.h', 'lcalc.a'],
      correct: 0,
      explain:
        'К имени добавляются префикс lib и расширение. Если есть обе версии, по умолчанию выбирается динамическая.',
    },
    {
      q: 'Глобальная переменная int counter; записана в заголовке, который подключают два файла, и линковка падает с multiple definition. Как исправить, сохранив одну общую переменную? Выберите все верные шаги.',
      options: [
        'В заголовке написать extern int counter;',
        'В одном .c файле написать int counter;',
        'В заголовке написать static int counter;',
        'Добавить include guard в заголовок',
      ],
      correct: [0, 1],
      explain:
        'extern — объявление без определения, а определение должно быть ровно одно. static дал бы каждому файлу свою отдельную переменную — сборка пройдёт, но общей переменной не будет.',
    },
    {
      q: 'Программа собралась, но при запуске пишет error while loading shared libraries: libgeometry.so: cannot open shared object file. Когда возникла ошибка?',
      options: [
        'При запуске: загрузчик не нашёл динамическую библиотеку',
        'При компиляции main.c',
        'При линковке',
        'Внутри функции main',
      ],
      correct: 0,
      explain:
        'Динамическая библиотека загружается при каждом запуске. ldd покажет, какие библиотеки не найдены; для проверки помогает LD_LIBRARY_PATH.',
    },
    {
      q: 'nm main.o показывает строку U sqrt. Какой флаг нужно добавить в конец команды сборки на Linux?',
      answers: ['-lm'],
      placeholder: 'Флаг',
      explain:
        'Математические функции живут в библиотеке libm. Флаг -lm ставят после файлов, которые её используют.',
    },
    {
      q: 'В a.c определена функция double scale(double x), а в b.c перед вызовом объявлено int scale(int x). Что будет?',
      options: [
        'Программа соберётся, но поведение не определено',
        'Линковщик сообщит о несовпадении типов',
        'Компилятор найдёт ошибку при сборке b.c',
        'Линковщик выберет подходящую версию автоматически',
      ],
      correct: 0,
      explain:
        'Линковщик C сравнивает только имена. Защита — общий заголовок с объявлением, подключённый и в a.c, и в b.c: тогда противоречие увидит компилятор.',
    },
    {
      q: 'Команда gcc util.c -o util выдала undefined reference to `main`. В чём ошибка?',
      options: [
        'util.c — модуль без main; его нужно компилировать с -c',
        'Функция main объявлена static',
        'Не подключён stdio.h',
        'Нужно добавить -lmain',
      ],
      correct: 0,
      explain:
        'Без -c gcc собирает исполняемый файл, а стартовому коду нужна функция main. Модуль компилируют в объектный файл: gcc -c util.c.',
    },
  ],
  exercises: [
    {
      title: 'Разрешение символов',
      description: `
Смоделируйте проверку, которую выполняет линковщик. В первой строке — число \`m\` и \`m\` символов, которые предоставляет библиотека C. Во второй — число объектных файлов \`n\`. Далее \`n\` строк:

\`\`\`
имя d опр₁ … опрₐ u исп₁ … исп_u
\`\`\`

— имя файла, \`d\` определённых им символов и \`u\` символов, которые он использует (буква \`U\` в \`nm\`).

Напечатайте ошибки в таком порядке:
1. для каждого символа, определённого в двух и более объектных файлах (в порядке первого определения): \`multiple definition of 'X': файл₁ файл₂ …\`;
2. для каждого объектного файла по порядку и каждого используемого им символа, который не определён ни в одном объектном файле и не предоставлен библиотекой: \`undefined reference to 'Y' in файл\`;
3. если ни один объектный файл не определяет \`main\`: \`undefined reference to 'main'\`.

Если ошибок нет, напечатайте \`сборка успешна\`.`,
      constraints: [
        '0 ≤ m ≤ 30; 1 ≤ n ≤ 20; 0 ≤ d, u ≤ 10.',
        'Имена не длиннее 30 символов; файл не использует символы, которые сам определяет.',
      ],
      hints: [
        'Храните файлы в массивах: char defs[20][10][32], int def_count[20] и так же для используемых символов.',
        'Напишите функцию defines(file, symbol). Повтор: для каждого определения проверьте, не определён ли символ в более раннем файле — так каждый символ рассматривается один раз.',
        'Используемый символ разрешён, если его определяет любой файл (defines) или он есть в списке библиотеки.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define FILES 20
#define SYMBOLS 10
#define NAME 32

static char library[30][NAME];
static int library_count;
static char names[FILES][NAME];
static char defs[FILES][SYMBOLS][NAME];
static char uses[FILES][SYMBOLS][NAME];
static int def_count[FILES];
static int use_count[FILES];
static int file_count;

static int defines(int file, const char *symbol) {
    for (int i = 0; i < def_count[file]; i++) {
        if (strcmp(defs[file][i], symbol) == 0) {
            return 1;
        }
    }
    return 0;
}

static int defined_anywhere(const char *symbol) {
    for (int f = 0; f < file_count; f++) {
        if (defines(f, symbol)) {
            return 1;
        }
    }
    return 0;
}

static int in_library(const char *symbol) {
    for (int i = 0; i < library_count; i++) {
        if (strcmp(library[i], symbol) == 0) {
            return 1;
        }
    }
    return 0;
}

static int read_list(char list[][NAME], int *count) {
    if (scanf("%d", count) != 1) {
        return 0;
    }
    for (int i = 0; i < *count; i++) {
        if (scanf("%31s", list[i]) != 1) {
            return 0;
        }
    }
    return 1;
}

int main(void) {
    if (!read_list(library, &library_count) || scanf("%d", &file_count) != 1) {
        return 0;
    }
    for (int f = 0; f < file_count; f++) {
        if (scanf("%31s", names[f]) != 1 || !read_list(defs[f], &def_count[f]) ||
            !read_list(uses[f], &use_count[f])) {
            return 0;
        }
    }
    int errors = 0;
    for (int f = 0; f < file_count; f++) {
        for (int i = 0; i < def_count[f]; i++) {
            const char *symbol = defs[f][i];
            int earlier = 0;
            for (int g = 0; g < f && !earlier; g++) {
                earlier = defines(g, symbol);
            }
            int count = 0;
            for (int g = f; g < file_count; g++) {
                count += defines(g, symbol);
            }
            if (earlier || count < 2) {
                continue;
            }
            printf("multiple definition of '%s':", symbol);
            for (int g = f; g < file_count; g++) {
                if (defines(g, symbol)) {
                    printf(" %s", names[g]);
                }
            }
            putchar('\n');
            errors++;
        }
    }
    for (int f = 0; f < file_count; f++) {
        for (int i = 0; i < use_count[f]; i++) {
            if (!defined_anywhere(uses[f][i]) && !in_library(uses[f][i])) {
                printf("undefined reference to '%s' in %s\n", uses[f][i], names[f]);
                errors++;
            }
        }
    }
    if (!defined_anywhere("main")) {
        printf("undefined reference to 'main'\n");
        errors++;
    }
    if (errors == 0) {
        printf("сборка успешна\n");
    }
    return 0;
}`,
      explanation: `
Линковщик собирает все определения в общую таблицу и проверяет два условия: каждое имя определено **не больше одного раза**, и каждое используемое имя определено **хотя бы один раз** — в объектных файлах или в библиотеках. \`main\` — тоже обычный используемый символ: его использует стартовый код.

Определение в объектном файле имеет приоритет над библиотекой: если ваш файл определяет \`log\`, конфликта с \`log\` из \`libm\` не будет — из библиотеки берётся только то, чего не хватает. Поэтому повтор считается только между объектными файлами.`,
      examples: [
        {
          in: '2 printf puts\n2\nmain.o 1 main 2 area printf\ngeometry.o 1 area 0\n',
          out: 'сборка успешна\n',
        },
        {
          in: '1 printf\n2\nmain.o 2 main log_line 1 log_line_count\nutil.o 1 log_line 1 printf\n',
          out: "multiple definition of 'log_line': main.o util.o\nundefined reference to 'log_line_count' in main.o\n",
        },
      ],
      hidden: [
        { in: '0\n1\nutil.o 1 helper 0\n', name: 'Нет main' },
        { in: '1 printf\n1\nmain.o 1 main 1 sqrt\n', name: 'Нет библиотеки' },
        {
          in: '0\n3\na.o 2 main x 0\nb.o 1 x 0\nc.o 1 x 0\n',
          name: 'Три определения',
        },
        {
          in: '0\n2\nmain.o 1 main 2 area perimeter\nshapes.o 1 aera 0\n',
          name: 'Опечатка в определении',
        },
        {
          in: '1 log\n2\nmain.o 1 main 1 log\nmylog.o 1 log 0\n',
          name: 'Своё определение важнее библиотеки',
        },
        {
          in: '2 malloc free\n3\nmain.o 1 main 2 list_push list_free\nlist.o 2 list_push list_free 2 malloc free\ntest.o 1 main 1 list_push\n',
          name: 'Два main',
        },
        {
          in: '0\n2\na.o 2 f g 1 h\nb.o 2 g f 1 h\n',
          name: 'Все ошибки сразу',
        },
        {
          in: '3 printf strlen fopen\n4\nmain.o 1 main 2 parse report\nparse.o 1 parse 2 strlen tokenize\nreport.o 1 report 2 printf fopen\nlexer.o 1 tokens 0\n',
          name: 'Большой проект',
        },
        { in: '0\n1\nmain.o 1 main 0\n', name: 'Только main' },
      ],
    },
    {
      title: 'Порядок библиотек',
      difficulty: 'advanced',
      description: `
Смоделируйте, как линковщик GNU подключает статические библиотеки. Дано \`n\` элементов команды сборки в порядке слева направо. Элемент — объектный файл или библиотека:

\`\`\`
obj имя d опр₁ … опрₐ u исп₁ … исп_u
lib имя m
\`\`\`

После строки \`lib\` идут \`m\` строк с объектными файлами внутри архива в формате \`имя d … u …\`.

Линковщик хранит множество определённых символов и список неопределённых (в порядке появления):
- объектный файл из команды загружается всегда: его определения закрывают неопределённые символы, а используемые символы, которые ещё не определены, добавляются в список неопределённых;
- в библиотеке загружаются только файлы, которые определяют **хотя бы один сейчас неопределённый** символ. Архив просматривается по порядку, и просмотр повторяется, пока загружаются новые файлы. Для каждого загруженного файла напечатайте \`загружен ФАЙЛ из БИБЛИОТЕКИ\`;
- к уже прочитанной библиотеке линковщик не возвращается.

В конце напечатайте \`undefined reference to 'X'\` для каждого неопределённого символа в порядке появления или \`сборка успешна\`.`,
      constraints: [
        '1 ≤ n ≤ 10; в библиотеке не больше 10 файлов; 0 ≤ d, u ≤ 10.',
        'Имена не длиннее 30 символов.',
      ],
      hints: [
        'Напишите функцию load(defs, d, uses, u), общую для объектных файлов команды и файлов из архива: она отмечает определения и дополняет список неопределённых.',
        'Символ закрыт, если он есть в множестве определённых. Список неопределённых при выводе фильтруйте: печатайте только символы, которые так и не стали определёнными.',
        'Для библиотеки: do { changed = 0; for (каждый незагруженный файл) if (определяет неопределённый) { загрузить; changed = 1; } } while (changed);',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define NAME 32
#define MAX_SYMBOLS 200

typedef struct {
    char name[NAME];
    char defs[10][NAME];
    char uses[10][NAME];
    int def_count;
    int use_count;
} Object;

static char defined[MAX_SYMBOLS][NAME];
static int defined_count;
static char pending[MAX_SYMBOLS][NAME];
static int pending_count;

static int contains(char list[][NAME], int count, const char *symbol) {
    for (int i = 0; i < count; i++) {
        if (strcmp(list[i], symbol) == 0) {
            return 1;
        }
    }
    return 0;
}

static int is_undefined(const char *symbol) {
    return contains(pending, pending_count, symbol) &&
           !contains(defined, defined_count, symbol);
}

static void load(const Object *object) {
    for (int i = 0; i < object->def_count; i++) {
        if (!contains(defined, defined_count, object->defs[i]) && defined_count < MAX_SYMBOLS) {
            strcpy(defined[defined_count++], object->defs[i]);
        }
    }
    for (int i = 0; i < object->use_count; i++) {
        const char *symbol = object->uses[i];
        if (!contains(defined, defined_count, symbol) && !contains(pending, pending_count, symbol) &&
            pending_count < MAX_SYMBOLS) {
            strcpy(pending[pending_count++], symbol);
        }
    }
}

static int read_object(Object *object) {
    if (scanf("%31s %d", object->name, &object->def_count) != 2) {
        return 0;
    }
    for (int i = 0; i < object->def_count; i++) {
        if (scanf("%31s", object->defs[i]) != 1) {
            return 0;
        }
    }
    if (scanf("%d", &object->use_count) != 1) {
        return 0;
    }
    for (int i = 0; i < object->use_count; i++) {
        if (scanf("%31s", object->uses[i]) != 1) {
            return 0;
        }
    }
    return 1;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    for (int item = 0; item < n; item++) {
        char kind[8];
        if (scanf("%7s", kind) != 1) {
            return 0;
        }
        if (strcmp(kind, "obj") == 0) {
            Object object;
            if (!read_object(&object)) {
                return 0;
            }
            load(&object);
            continue;
        }
        char library[NAME];
        int member_count;
        if (scanf("%31s %d", library, &member_count) != 2) {
            return 0;
        }
        Object members[10];
        int loaded[10] = {0};
        for (int i = 0; i < member_count; i++) {
            if (!read_object(&members[i])) {
                return 0;
            }
        }
        int changed;
        do {
            changed = 0;
            for (int i = 0; i < member_count; i++) {
                if (loaded[i]) {
                    continue;
                }
                int needed = 0;
                for (int j = 0; j < members[i].def_count && !needed; j++) {
                    needed = is_undefined(members[i].defs[j]);
                }
                if (needed) {
                    loaded[i] = 1;
                    changed = 1;
                    printf("загружен %s из %s\n", members[i].name, library);
                    load(&members[i]);
                }
            }
        } while (changed);
    }
    int errors = 0;
    for (int i = 0; i < pending_count; i++) {
        if (!contains(defined, defined_count, pending[i])) {
            printf("undefined reference to '%s'\n", pending[i]);
            errors++;
        }
    }
    if (errors == 0) {
        printf("сборка успешна\n");
    }
    return 0;
}`,
      explanation: `
Статическая библиотека — не «набор функций», а архив отдельных объектных файлов. Линковщик берёт из него файл целиком и только если тот нужен **прямо сейчас**. Отсюда оба правила порядка: библиотеку ставят после файлов, которым она нужна, а зависящую библиотеку — перед той, от которой она зависит.

Внутри одного архива зависимости разрешаются: если \`area.o\` использует \`square\` из того же архива, повторный просмотр загрузит и \`square.o\`. А зависимость назад — от более ранней библиотеки — уже не разрешится. На практике её устраняют порядком или группой \`-Wl,--start-group … -Wl,--end-group\`, где архивы просматриваются по кругу.

Динамические библиотеки устроены иначе: \`.so\` подключается целиком, поэтому для них порядок менее критичен — но правило «библиотеки в конце» безопасно в обоих случаях.`,
      examples: [
        {
          in: '2\nobj main.o 1 main 2 area printf\nlib libgeometry.a 2\narea.o 1 area 1 square\nsquare.o 1 square 0\n',
          out: "загружен area.o из libgeometry.a\nзагружен square.o из libgeometry.a\nundefined reference to 'printf'\n",
        },
        {
          in: '2\nlib libgeometry.a 1\narea.o 1 area 0\nobj main.o 1 main 1 area\n',
          out: "undefined reference to 'area'\n",
        },
      ],
      hidden: [
        {
          in: '3\nobj main.o 1 main 1 area\nlib libgeometry.a 1\narea.o 1 area 1 printf\nlib libc.a 1\nprintf.o 1 printf 0\n',
          name: 'Правильный порядок',
        },
        {
          in: '3\nobj main.o 1 main 1 area\nlib libc.a 1\nprintf.o 1 printf 0\nlib libgeometry.a 1\narea.o 1 area 1 printf\n',
          name: 'Зависимость назад',
        },
        {
          in: '2\nobj main.o 1 main 1 square\nlib libgeometry.a 3\narea.o 1 area 1 square\nsquare.o 1 square 0\nunused.o 1 unused 0\n',
          name: 'Лишние файлы не загружаются',
        },
        {
          in: '2\nobj main.o 1 main 1 a\nlib libchain.a 3\nc.o 1 c 0\nb.o 1 b 1 c\na.o 1 a 1 b\n',
          name: 'Цепочка внутри архива',
        },
        { in: '1\nobj main.o 1 main 0\n', name: 'Без библиотек' },
        {
          in: '3\nobj main.o 1 main 1 net_send\nlib libnet.a 1\nsend.o 1 net_send 1 encrypt\nlib libcrypto.a 2\naes.o 1 encrypt 0\nrsa.o 1 sign 0\n',
          name: 'Две библиотеки',
        },
        {
          in: '2\nobj main.o 2 main helper 1 helper\nlib libx.a 1\nhelper.o 1 helper 0\n',
          name: 'Уже определено',
        },
        {
          in: '3\nobj main.o 1 main 1 f\nlib liba.a 1\nf.o 1 f 1 g\nobj extra.o 1 g 1 h\n',
          name: 'Объектный файл после библиотеки',
        },
        {
          in: '2\nobj main.o 1 main 2 x y\nlib libxy.a 1\nxy.o 2 x y 1 z\n',
          name: 'Один файл — два символа',
        },
      ],
    },
    {
      title: 'Найди ошибку: имя определения',
      difficulty: 'beginner',
      bug: true,
      description: `
Программа читает \`n\` целых чисел и печатает их среднее арифметическое с двумя знаками после запятой.

Программа не собирается: линковщик сообщает \`undefined reference to 'average'\`. Найдите причину и исправьте её. Когда программа соберётся, проверьте результат на примерах — в функции есть ещё одна ошибка.`,
      constraints: ['1 ≤ n ≤ 100; числа от −10⁶ до 10⁶.'],
      hints: [
        'Сравните имя в объявлении и вызове с именем в определении функции — буква за буквой.',
        'Для 1 и 2 среднее — 1.50. Посмотрите на тип выражения sum / count: оба операнда целые.',
      ],
      starter: String.raw`
#include <stdio.h>

double average(const int *values, int count);

int main(void) {
    int n;
    scanf("%d", &n);
    int values[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }
    printf("%.2f\n", average(values, n));
    return 0;
}

double avarage(const int *values, int count) {
    long long sum = 0;
    for (int i = 0; i < count; i++) {
        sum += values[i];
    }
    return sum / count;
}`,
      solution: String.raw`
#include <stdio.h>

double average(const int *values, int count);

int main(void) {
    int n;
    scanf("%d", &n);
    int values[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }
    printf("%.2f\n", average(values, n));
    return 0;
}

double average(const int *values, int count) {
    long long sum = 0;
    for (int i = 0; i < count; i++) {
        sum += values[i];
    }
    return (double)sum / count;
}`,
      explanation: `
Объявление \`average\` позволило компилятору проверить вызов, а определение с опечаткой \`avarage\` создало **другой** символ. Каждая стадия по отдельности довольна, и только линковщик видит, что для \`U average\` нет определения. Команда \`nm\` показала бы это сразу: \`T avarage\` и \`U average\`.

Вторая ошибка проявляется после сборки: \`sum / count\` — деление целых, дробная часть отбрасывается до преобразования в \`double\`. Приведение \`(double)sum\` делает деление вещественным.

Ошибки линковки часто прячут логические: пока программа не собирается, тесты не запускаются. Поэтому, исправив сборку, всегда проверяйте результат.`,
      examples: [
        { in: '2\n1 2\n', out: '1.50\n' },
        { in: '3\n4 4 4\n', out: '4.00\n' },
      ],
      hidden: [
        { in: '1\n7\n', name: 'Одно число' },
        { in: '2\n-1 -2\n', name: 'Отрицательные' },
        { in: '3\n1 1 2\n', name: 'Треть' },
        { in: '4\n0 0 0 1\n', name: 'Четверть' },
        { in: '2\n1000000 999999\n', name: 'Большие' },
        { in: '5\n-3 0 3 1 0\n', name: 'Смешанные' },
        { in: '3\n-1000000 -1000000 -999999\n', name: 'Большие отрицательные' },
        { in: '6\n10 20 30 40 50 61\n', name: 'Шесть чисел' },
        { in: '2\n-5 4\n', name: 'Среднее около нуля' },
      ],
    },
  ],
};
