const HOLIDAYS = (fixed) => String.raw`
#include <stdio.h>

// ---- holidays.h ----
extern const int holidays[];            // номера нерабочих дней года
${fixed ? 'extern const int holidays_count;\n' : ''}
// ---- main.c ----
int is_holiday(int day) {
${
  fixed
    ? '    for (int i = 0; i < holidays_count; i++) {'
    : '    int count = (int)(sizeof holidays / sizeof holidays[0]);\n    for (int i = 0; i < count; i++) {'
}
        if (holidays[i] == day) {
            return 1;
        }
    }
    return 0;
}

int main(void) {
    int day, closed = 0;
    while (scanf("%d", &day) == 1) {
        if (is_holiday(day)) {
            printf("день %d: выходной\n", day);
            closed++;
        } else {
            printf("день %d: рабочий\n", day);
        }
    }
    printf("выходных: %d\n", closed);
    return 0;
}

// ---- holidays.c ----
const int holidays[] = {1, 2, 3, 4, 5, 6, 7, 8, 54, 67, 121, 129, 163, 308};
${fixed ? 'const int holidays_count = sizeof holidays / sizeof holidays[0];\n' : ''}`;

export default {
  id: 'advanced-extern',
  title: 'extern: общие переменные',
  description:
    'Общая переменная для нескольких файлов: объявление extern в заголовке и одно определение в .c; предварительные определения и отказ от их склеивания в GCC 10; extern с инициализатором; массивы неполного типа и экспорт размера; extern у функций и внутри блока; константные инициализаторы; цена глобальных переменных.',
  moduleId: 'advanced-c',
  order: 5,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-static'],
  objectives: [
    'Объявлять общую переменную через extern и определять её ровно в одном файле',
    'Отличать объявление, определение и предварительное определение переменной',
    'Экспортировать массив вместе с его размером',
    'Оценивать, когда глобальная переменная оправдана, а когда её лучше заменить',
  ],
  tags: [
    'extern',
    'Глобальные переменные',
    'Объявление',
    'Предварительное определение',
    'Связывание',
  ],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чем строка extern int verbose; отличается от int verbose = 0; вне функций?',
      options: [
        'Первая только объявляет переменную, вторая создаёт её (определение)',
        'Первая делает переменную видимой только в своём файле',
        'Ничем: extern пишут по традиции',
        'Первая создаёт переменную с нулевым значением, вторая — с явным',
      ],
      correct: 0,
      explain:
        'extern без инициализатора сообщает тип и имя, но память не выделяет. Определение должно быть ровно в одном файле программы.',
    },
    {
      q: 'Как правильно сделать переменную int error_count общей для всех файлов? Выберите все нужные шаги.',
      options: [
        'В заголовке написать extern int error_count;',
        'В одном .c файле написать int error_count = 0;',
        'Этот .c файл должен подключать заголовок с объявлением',
        'В заголовке написать static int error_count;',
        'В каждом .c файле написать int error_count;',
      ],
      correct: [0, 1, 2],
      explain:
        'Объявление — в заголовке, единственное определение — в .c, который подключает заголовок, чтобы компилятор сверил типы. static дал бы каждому файлу свою копию, а int error_count; в нескольких файлах — multiple definition.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int score;
int score;
int score = 3;

int main(void) {
    score *= 4;
    printf("%d\n", score);
    return 0;
}`,
      answers: ['12'],
      placeholder: 'Вывод программы',
      explain:
        'Все три строки описывают одну переменную: два предварительных определения сливаются с определением, у которого есть инициализатор 3. 3 * 4 = 12.',
    },
    {
      q: 'В файлах a.c и b.c есть строка int count; вне функций, других объявлений count нет. Что произойдёт при сборке современным GCC (10 и новее)?',
      options: [
        'multiple definition of count',
        'Будет одна общая переменная count, равная нулю',
        'У каждого файла будет своя переменная',
        'undefined reference to count',
      ],
      correct: 0,
      explain:
        'Каждая строка — предварительное определение, которое в своём файле становится определением. Старые компиляторы склеивали такие определения, но с GCC 10 и Clang 11 это ошибка линковки.',
    },
    {
      q: 'Объявлено extern const int table[]; без размера. Что из этого скомпилируется в файле, который видит только это объявление? Выберите все.',
      options: [
        'int first = table[0];  (внутри функции)',
        'const int *p = table;',
        'size_t n = sizeof table / sizeof table[0];',
        'size_t bytes = sizeof table;',
      ],
      correct: [0, 1],
      explain:
        'У массива без размера неполный тип: обращаться к элементам и брать адрес можно, а sizeof всего массива неизвестен. Размер экспортируют отдельной константой.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int depth = 1;

int main(void) {
    int depth = 5;
    {
        extern int depth;
        depth += 10;
    }
    printf("%d\n", depth);
    return 0;
}`,
      answers: ['5'],
      placeholder: 'Вывод программы',
      explain:
        'Внутри блока extern int depth ссылается на глобальную переменную, и 10 прибавляется к ней (она становится 11). printf стоит вне блока и печатает локальную depth, равную 5.',
    },
    {
      q: 'Почему строка int half = width / 2; вне функций не компилируется, если выше есть int width = 80;?',
      options: [
        'Инициализатор глобальной переменной должен быть константным выражением, а значение другой переменной им не является',
        'Глобальные переменные нельзя делить',
        'width объявлена ниже main',
        'Нужно написать extern перед half',
      ],
      correct: 0,
      explain:
        'Глобальные переменные получают значения до запуска программы, поэтому их инициализаторы вычисляются при компиляции. Адрес &width — константа, а значение width — нет.',
    },
    {
      q: 'Какое предупреждение выдаст GCC на строку extern int limit = 100; вне функций, и что она означает?',
      options: [
        'initialized and declared extern — это определение, слово extern ничего не меняет',
        'Никакого: это обычное объявление',
        'Ошибка: extern нельзя инициализировать',
        'unused variable — переменная не будет создана',
      ],
      correct: 0,
      explain:
        'Объявление с инициализатором всегда определение. В заголовке такая строка даст multiple definition.',
    },
  ],
  exercises: [
    {
      title: 'Объявление или определение',
      difficulty: 'beginner',
      description: `
Каждая непустая строка ввода — объявление переменной вне функций в упрощённом C: возможно, \`extern\` или \`static\` в начале, затем тип из одного или нескольких слов (со звёздочками указателей), имя, возможно, размер массива в квадратных скобках, возможно, инициализатор после \`=\`, и точка с запятой.

Для каждой строки напечатайте \`имя: вид, связывание\`, где:
- **вид** — \`объявление\` (\`extern\` без инициализатора), \`определение с предупреждением\` (\`extern\` с инициализатором), \`определение\` (без \`extern\`, с инициализатором) или \`предварительное определение\` (без \`extern\` и без инициализатора);
- **связывание** — \`внутреннее\` для строк со \`static\`, иначе \`внешнее\`.

Имя — последний идентификатор (латинские буквы, цифры, \`_\`) перед первым из символов \`[\`, \`=\` или \`;\`.`,
      constraints: [
        'Строки не длиннее 200 символов, их не больше 30.',
        'Квадратные скобки не встречаются после =, а = — внутри размера массива.',
      ],
      hints: [
        "Читайте строки fgets и пропускайте строки без точки с запятой. Наличие инициализатора — strchr(line, '=') != NULL.",
        'Первое слово получите через sscanf(line, "%15s", word) и сравните с "extern" и "static".',
        'Чтобы найти имя, найдите конец «шапки» — первый из символов [ = ; — и идите от него влево: пропустите пробелы, затем соберите буквы, цифры и подчёркивания.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

static int is_name_char(char c) {
    return isalnum((unsigned char)c) || c == '_';
}

int main(void) {
    char line[256];
    while (fgets(line, sizeof line, stdin) != NULL) {
        if (strchr(line, ';') == NULL) {
            continue;
        }
        char word[16] = "";
        sscanf(line, "%15s", word);
        int is_extern = strcmp(word, "extern") == 0;
        int is_static = strcmp(word, "static") == 0;
        int has_init = strchr(line, '=') != NULL;

        size_t end = strcspn(line, "[=;");
        while (end > 0 && !is_name_char(line[end - 1])) {
            end--;
        }
        size_t start = end;
        while (start > 0 && is_name_char(line[start - 1])) {
            start--;
        }

        const char *kind;
        if (is_extern) {
            kind = has_init ? "определение с предупреждением" : "объявление";
        } else {
            kind = has_init ? "определение" : "предварительное определение";
        }
        printf("%.*s: %s, %s\n", (int)(end - start), line + start, kind,
               is_static ? "внутреннее" : "внешнее");
    }
    return 0;
}`,
      explanation: `
Вид объявления определяют два признака: есть ли \`extern\` и есть ли инициализатор. Инициализатор превращает в определение даже строку с \`extern\` — компилятор при этом предупреждает. Строка без обоих признаков — предварительное определение: в своём файле она станет определением с нулём, если не найдётся другого.

\`static\` меняет только связывание: \`static int x;\` — тоже предварительное определение, но видимое лишь в своём файле.

Имя ищется справа налево от конца «шапки»: функция \`strcspn\` находит первый из символов \`[\`, \`=\` или \`;\`, а всё левее — тип и имя. Звёздочки и пробелы между ними пропускаются, поэтому \`const char *const title\` даёт \`title\`. Формат \`%.*s\` печатает ровно нужное число символов строки, не копируя имя в отдельный массив.`,
      examples: [
        {
          in: 'extern int verbose;\nint count = 0;\nstatic double ratio;\n',
          out: 'verbose: объявление, внешнее\ncount: определение, внешнее\nratio: предварительное определение, внутреннее\n',
        },
        {
          in: 'extern const char *names[];\nextern int limit = 100;\n',
          out: 'names: объявление, внешнее\nlimit: определение с предупреждением, внешнее\n',
        },
      ],
      hidden: [
        { in: 'int table[] = {1, 2, 3};\n', name: 'Массив с инициализатором' },
        { in: 'unsigned long long big;\n', name: 'Тип из трёх слов' },
        {
          in: 'static const char *const title = "журнал";\n',
          name: 'Строка с двумя const',
        },
        { in: '\nint a;\n\n', name: 'Пустые строки' },
        { in: 'char buffer[256];\nextern char buffer[];\n', name: 'Размер массива' },
        { in: 'static int *cursor = 0;\n', name: 'Указатель со static' },
        { in: 'double  x2_value   =  1.5 ;\n', name: 'Лишние пробелы' },
        {
          in: 'extern struct Config settings;\nstruct Config settings = {0};\nint matrix[3][3];\n',
          name: 'Структуры и матрица',
        },
      ],
    },
    {
      title: 'Найди ошибку: размер внешнего массива',
      bug: true,
      description: `
Программа читает номера дней года до конца ввода и для каждого печатает \`день N: выходной\` или \`день N: рабочий\`, а в конце — \`выходных: K\`. Нерабочие дни хранятся в таблице \`holidays\`, которую модуль \`holidays\` экспортирует через заголовок.

Программа не компилируется: \`invalid application of 'sizeof' to incomplete type\`. Исправьте её так, чтобы модуль сообщал размер таблицы сам и при добавлении дня в таблицу не приходилось править другой код.`,
      constraints: ['1 ≤ N ≤ 365, чисел не больше 30.'],
      hints: [
        'В разделе main.c массив объявлен без размера: его тип неполный, и sizeof недоступен. Полный тип есть только в разделе holidays.c.',
        'Объявите в заголовке extern const int holidays_count; и определите его в holidays.c как sizeof holidays / sizeof holidays[0]. В is_holiday используйте holidays_count.',
      ],
      starter: HOLIDAYS(false),
      solution: HOLIDAYS(true),
      explanation: `
Объявление \`extern const int holidays[];\` не содержит размера: в \`main.c\` у массива неполный тип, и компилятор не может вычислить \`sizeof\`. В настоящем проекте определение лежало бы в другом файле, и узнать размер было бы негде.

Размер знает только модуль, где массив определён, поэтому модуль и экспортирует его — константой \`holidays_count\`, вычисленной через \`sizeof\` прямо рядом с таблицей. Выражение \`sizeof holidays / sizeof holidays[0]\` — константное, так что подходит для инициализатора глобальной переменной. Добавили день в таблицу — счётчик изменился сам.

Записать размер числом \`14\` в \`main.c\` — плохое исправление: при следующей правке таблицы число разойдётся с ней, и программа начнёт читать за границей массива.`,
      examples: [
        {
          in: '1 9 54\n',
          out: 'день 1: выходной\nдень 9: рабочий\nдень 54: выходной\nвыходных: 2\n',
        },
        { in: '308\n', out: 'день 308: выходной\nвыходных: 1\n' },
      ],
      hidden: [
        '100\n',
        '8 9\n',
        '121 129 163\n',
        '365\n',
        '1 2 3 4 5 6 7 8\n',
        '55 66 67 68\n',
        '200 307 308 309\n',
        '10 20 30 40 50 60\n',
      ],
    },
    {
      title: 'Переменные программы',
      difficulty: 'advanced',
      description: `
Смоделируйте, как компилятор и линковщик разбирают глобальные переменные программы из нескольких файлов.

В первой строке — число файлов \`n\`. Далее \`n\` описаний: строка \`имя k\` и \`k\` строк. Строка — одна из:
- \`extern X\` — объявление \`extern int X;\`;
- \`tentative X\` — предварительное определение \`int X;\`;
- \`define X\` — определение \`int X = …;\`;
- \`static X\` — \`static int X;\` (с инициализатором или без);
- \`use X\` — обращение к \`X\` в функции этого файла.

**Компиляция.** Каждый файл проверяется отдельно, строки по порядку. Ошибки:
- \`F: static после нестатического объявления X\` — \`static X\` после \`extern\`, \`tentative\` или \`define\` того же имени в этом файле;
- \`F: нестатическое определение после static X\` — \`tentative X\` или \`define X\` после \`static X\` (а \`extern X\` после \`static X\` допустим и ссылается на ту же внутреннюю переменную);
- \`F: повторное определение X\` — второй \`define X\` в файле;
- \`F: X не объявлена\` — \`use X\` раньше любого объявления \`X\` в файле.

Если есть ошибки компиляции, напечатайте их в порядке появления и закончите работу.

**Линковка.** Имя \`X\` в файле *внешнее*, если в этом файле нет \`static X\`. Файл *определяет* внешнее \`X\`, если в нём есть \`tentative X\` или \`define X\`. Для каждого имени в порядке первого появления во вводе:
- \`multiple definition of X\` — внешнее \`X\` определяют два файла или больше (как в GCC 10 и новее);
- \`undefined reference to X\` — внешнее \`X\` где-то используется, но его не определяет ни один файл.

Если ошибки линковки есть, напечатайте их и закончите работу. Иначе для каждого \`use\` в порядке ввода напечатайте \`F: X → G\` — в каком файле находится переменная: для внутренней это сам файл \`F\`, для внешней — файл, который её определяет.`,
      constraints: [
        '1 ≤ n ≤ 10; 0 ≤ k ≤ 20; имена не длиннее 31 символа.',
        'Строк во всех файлах вместе не больше 100.',
      ],
      hints: [
        'Сохраните все строки в массивы: файл, вид и имя для каждой. Тогда компиляцию можно проверить проходом по строкам одного файла, а линковку — проходом по всем.',
        'Для компиляции заведите функцию seen(file, upto, name, kinds), которая проверяет, встречалось ли имя с одним из видов в строках файла до позиции upto.',
        'Для линковки напишите функции is_static_in(file, name) и defining_files(name). Порядок первого появления: перебирайте строки по порядку и пропускайте имя, если оно встречалось в более ранней строке.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX_LINES 100
#define NAME 32

static char files[10][NAME];
static int file_of[MAX_LINES];
static char kind[MAX_LINES][16];
static char name[MAX_LINES][NAME];
static int lines;

// Встречалось ли имя с видом из списка kinds в строках файла f до строки upto.
static int seen(int f, int upto, const char *id, const char *kinds) {
    for (int i = 0; i < upto; i++) {
        if (file_of[i] == f && strcmp(name[i], id) == 0 && strstr(kinds, kind[i]) != NULL) {
            return 1;
        }
    }
    return 0;
}

static int is_static_in(int f, const char *id) {
    return seen(f, lines, id, "static");
}

static int defines(int f, const char *id) {
    return !is_static_in(f, id) && seen(f, lines, id, "tentative define");
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    for (int f = 0; f < n; f++) {
        int k;
        if (scanf("%31s %d", files[f], &k) != 2) {
            return 0;
        }
        for (int i = 0; i < k; i++, lines++) {
            if (scanf("%15s %31s", kind[lines], name[lines]) != 2) {
                return 0;
            }
            file_of[lines] = f;
        }
    }

    int errors = 0;
    for (int i = 0; i < lines; i++) {
        int f = file_of[i];
        const char *id = name[i];
        const char *problem = NULL;
        if (strcmp(kind[i], "static") == 0 && seen(f, i, id, "extern tentative define")) {
            problem = "static после нестатического объявления";
        } else if ((strcmp(kind[i], "tentative") == 0 || strcmp(kind[i], "define") == 0) &&
                   seen(f, i, id, "static")) {
            problem = "нестатическое определение после static";
        } else if (strcmp(kind[i], "define") == 0 && seen(f, i, id, "define")) {
            problem = "повторное определение";
        } else if (strcmp(kind[i], "use") == 0 &&
                   !seen(f, i, id, "extern tentative define static")) {
            printf("%s: %s не объявлена\n", files[f], id);
            errors++;
        }
        if (problem != NULL) {
            printf("%s: %s %s\n", files[f], problem, id);
            errors++;
        }
    }
    if (errors > 0) {
        return 0;
    }

    for (int i = 0; i < lines; i++) {
        const char *id = name[i];
        int earlier = 0;
        for (int j = 0; j < i && !earlier; j++) {
            earlier = strcmp(name[j], id) == 0;
        }
        if (earlier) {
            continue;
        }
        int definitions = 0, used = 0;
        for (int f = 0; f < n; f++) {
            definitions += defines(f, id);
            used += !is_static_in(f, id) && seen(f, lines, id, "use");
        }
        if (definitions > 1) {
            printf("multiple definition of %s\n", id);
            errors++;
        } else if (definitions == 0 && used > 0) {
            printf("undefined reference to %s\n", id);
            errors++;
        }
    }
    if (errors > 0) {
        return 0;
    }

    for (int i = 0; i < lines; i++) {
        if (strcmp(kind[i], "use") != 0) {
            continue;
        }
        int f = file_of[i];
        int owner = f;
        if (!is_static_in(f, name[i])) {
            for (int g = 0; g < n; g++) {
                if (defines(g, name[i])) {
                    owner = g;
                }
            }
        }
        printf("%s: %s → %s\n", files[f], name[i], files[owner]);
    }
    return 0;
}`,
      explanation: `
Модель повторяет два этапа сборки. Компилятор видит один файл и проверяет только согласованность объявлений внутри него: нельзя сначала объявить имя внешним, а потом внутренним, и наоборот; нельзя дважды определить с инициализатором; нельзя использовать необъявленное имя. Сочетание \`static X\`, затем \`extern X\` разрешено стандартом: \`extern\` в этом случае ссылается на уже видимую внутреннюю переменную.

Линковщик видит только внешние имена. Внутренние (\`static\`) переменные разных файлов для него не существуют, поэтому одинаковые \`static\` имена в двух файлах никогда не конфликтуют. Предварительное определение \`int X;\` считается определением — так ведут себя GCC 10+ и Clang 11+, — и два таких определения в разных файлах дают \`multiple definition\`.

Объявление \`extern X\` без использования не требует определения: линковщику нужно разрешить только реальные обращения.`,
      examples: [
        {
          in: '3\nconfig.c 1\ndefine verbose\nmain.c 3\nextern verbose\nuse verbose\ntentative counter\nlog.c 3\nextern verbose\nstatic counter\nuse counter\n',
          out: 'main.c: verbose → config.c\nlog.c: counter → log.c\n',
        },
        {
          in: '2\na.c 1\ntentative count\nb.c 2\ntentative count\nuse count\n',
          out: 'multiple definition of count\n',
        },
      ],
      hidden: [
        { in: '1\nmain.c 2\nextern total\nuse total\n', name: 'Нет определения' },
        { in: '1\nmain.c 1\nextern unused\n', name: 'extern без использования' },
        { in: '1\nmain.c 2\ntentative x\nstatic x\n', name: 'static после нестатического' },
        { in: '1\nmain.c 2\nstatic x\ndefine x\n', name: 'Определение после static' },
        {
          in: '1\nmain.c 3\nstatic x\nextern x\nuse x\n',
          name: 'extern после static',
        },
        { in: '1\nmain.c 2\nuse y\ndefine y\n', name: 'Использование до объявления' },
        {
          in: '2\na.c 3\ndefine v\ntentative v\nuse v\nb.c 2\nstatic v\nuse v\n',
          name: 'Слияние и static в другом файле',
        },
        {
          in: '2\na.c 2\ndefine z\ndefine z\nb.c 1\nuse w\n',
          name: 'Две ошибки компиляции',
        },
        {
          in: '3\na.c 2\ndefine p\nuse q\nb.c 2\nextern q\nuse q\nc.c 1\ndefine p\n',
          name: 'Ошибка компиляции важнее линковки',
        },
        {
          in: '3\nmain.c 4\nextern a\nextern b\nuse b\nuse a\nx.c 1\ntentative a\ny.c 1\ndefine b\n',
          name: 'Порядок использований',
        },
      ],
    },
  ],
};
