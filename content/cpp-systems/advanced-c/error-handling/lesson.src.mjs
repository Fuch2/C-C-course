const GRADES = (fixed) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { SUM_OK, SUM_EMPTY, SUM_RANGE, SUM_MEMORY } SumError;

typedef struct {
    int median;
    int mode;
    double mean;
} Summary;

static int compare_ints(const void *a, const void *b) {
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}

static SumError summarize(const int *values, int n, Summary *out) {
${fixed ? '    SumError status = SUM_MEMORY;\n' : ''}    int *sorted = malloc((size_t)(n > 0 ? n : 1) * sizeof *sorted);
    int *histogram = calloc(101, sizeof *histogram);
    if (sorted == NULL || histogram == NULL) {
${fixed ? '        goto cleanup;' : '        free(sorted);\n        free(histogram);\n        return SUM_MEMORY;'}
    }
    if (n == 0) {
${fixed ? '        status = SUM_EMPTY;\n        goto cleanup;' : '        return SUM_EMPTY;'}
    }
    long long total = 0;
    for (int i = 0; i < n; i++) {
        if (values[i] < 0 || values[i] > 100) {
${fixed ? '            status = SUM_RANGE;\n            goto cleanup;' : '            return SUM_RANGE;'}
        }
        sorted[i] = values[i];
        histogram[values[i]]++;
        total += values[i];
    }
    qsort(sorted, (size_t)n, sizeof *sorted, compare_ints);
    int mode = 0;
    for (int v = 1; v <= 100; v++) {
        if (histogram[v] > histogram[mode]) {
            mode = v;
        }
    }
    out->median = sorted[(n - 1) / 2];
    out->mode = mode;
    out->mean = (double)total / n;
${
  fixed
    ? '    status = SUM_OK;\n\ncleanup:\n    free(histogram);\n    free(sorted);\n    return status;'
    : '    free(histogram);\n    free(sorted);\n    return SUM_OK;'
}
}

int main(void) {
    int n;
    while (scanf("%d", &n) == 1 && n >= 0 && n <= 100) {
        int values[100];
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &values[i]) != 1) {
                return 0;
            }
        }
        Summary s;
        SumError e = summarize(values, n, &s);
        if (e == SUM_OK) {
            printf("медиана %d, мода %d, среднее %.2f\n", s.median, s.mode, s.mean);
        } else if (e == SUM_EMPTY) {
            printf("ошибка: пустая группа\n");
        } else if (e == SUM_RANGE) {
            printf("ошибка: оценка вне диапазона\n");
        } else {
            printf("ошибка: нет памяти\n");
            return 1;
        }
    }
    return 0;
}`;

const MEASUREMENT_LOG = String.raw`
#include <ctype.h>
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    unsigned count, errors;
    double min, max, sum;
} Stats;

// Разбирает одну строку журнала и обновляет статистику.
static void consume(char *line, int too_long, Stats *stats) {
    if (too_long) {
        stats->errors++;
        return;
    }
    char *end;
    errno = 0;
    long timestamp = strtol(line, &end, 10);
    if (end == line || errno == ERANGE || timestamp < 0 || timestamp > 1000000) {
        stats->errors++;
        return;
    }
    while (isspace((unsigned char)*end)) {
        end++;
    }
    if (*end != ',') {
        stats->errors++;
        return;
    }
    char *start = end + 1;
    errno = 0;
    double value = strtod(start, &end);
    if (end == start || errno == ERANGE || !isfinite(value) || value < -1000 || value > 1000) {
        stats->errors++;
        return;
    }
    while (isspace((unsigned char)*end)) {
        end++;
    }
    if (*end != '\0') {
        stats->errors++;
        return;
    }
    if (stats->count == 0 || value < stats->min) {
        stats->min = value;
    }
    if (stats->count == 0 || value > stats->max) {
        stats->max = value;
    }
    stats->sum += value;
    stats->count++;
}

// Читает поток посимвольно; 0 — ошибка ввода-вывода.
static int analyze(FILE *file, Stats *stats) {
    char line[128];
    size_t length = 0;
    int overflow = 0, ch;
    while ((ch = fgetc(file)) != EOF) {
        if (ch == '\n') {
            line[length] = '\0';
            consume(line, overflow, stats);
            length = 0;
            overflow = 0;
        } else if (ch == '\0' || length == sizeof line - 1) {
            overflow = 1;
        } else {
            line[length++] = (char)ch;
        }
    }
    if (ferror(file)) {
        return 0;
    }
    if (length > 0 || overflow) {
        line[length] = '\0';
        consume(line, overflow, stats);
    }
    return 1;
}

static double normalized(double value) {
    return value == 0.0 ? 0.0 : value;       // без «-0.00»
}

int main(void) {
    FILE *file = tmpfile();
    if (file == NULL) {
        return 1;
    }
    int ok = 1, ch;
    while ((ch = getchar()) != EOF) {
        if (fputc(ch, file) == EOF) {
            ok = 0;
            break;
        }
    }
    Stats stats = {0, 0, 0.0, 0.0, 0.0};
    ok = ok && !ferror(stdin) && fseek(file, 0, SEEK_SET) == 0 && analyze(file, &stats);
    if (fclose(file) != 0) {
        ok = 0;
    }
    if (!ok) {
        return 1;
    }
    if (stats.count == 0) {
        printf("НЕТ ДАННЫХ %u\n", stats.errors);
    } else {
        printf("%u %.2f %.2f %.2f %u\n", stats.count, normalized(stats.min),
               normalized(stats.max), normalized(stats.sum / stats.count), stats.errors);
    }
    return 0;
}`;

export default {
  id: 'advanced-error-handling',
  title: 'Обработка ошибок: коды, контекст, освобождение ресурсов',
  description:
    'Ошибки программиста, отказы окружения и неверные данные; код возврата и выходной параметр, особые значения, перечисления кодов и функции-описания; распространение ошибок и warn_unused_result; единая точка выхода goto cleanup; частично созданные объекты; stderr, контекст сообщений и коды завершения.',
  moduleId: 'advanced-c',
  order: 27,
  difficulty: 'advanced',
  estimatedMinutes: 65,
  prerequisites: ['advanced-errno'],
  objectives: [
    'Выбирать способ сообщения об ошибке и описывать его в договоре функции',
    'Распространять ошибки с контекстом и не терять результаты проверок',
    'Освобождать несколько ресурсов на всех путях через единую точку выхода',
    'Строить устойчивые к ошибочным данным программы, не допуская частичных изменений',
  ],
  tags: ['Обработка ошибок', 'goto cleanup', 'Коды ошибок', 'Ресурсы', 'stderr'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какой вид ошибки — вызов функции с NULL там, где договор требует действительный указатель?',
      options: [
        'Ошибка программиста: её ищут и исправляют, а не обрабатывают',
        'Отказ окружения',
        'Неверные данные пользователя',
        'Это не ошибка',
      ],
      correct: 0,
      explain:
        'Нарушенный договор — дефект в коде. Отказы окружения (нет файла, нет памяти) и неверные данные — ожидаемые ситуации, которые программа обязана обработать.',
    },
    {
      q: 'Функция возвращает температуру в градусах типа double. Почему не стоит сообщать об ошибке значением −1000?',
      options: [
        'Особое значение годится, только если оно не может быть законным результатом; надёжнее код возврата и выходной параметр',
        '−1000 нельзя записать в double',
        'Особые значения запрещены стандартом',
        'Так нельзя вернуть значение из функции',
      ],
      correct: 0,
      explain:
        'Если однажды −1000 станет законным значением (или вызывающий забудет проверку), ошибка превратится в данные. int read_temp(double *out) различает исходы явно.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef enum { OK, TOO_SMALL, TOO_BIG } Check;

static Check check(int x, int *doubled) {
    if (x < 0) {
        return TOO_SMALL;
    }
    if (x > 100) {
        return TOO_BIG;
    }
    *doubled = 2 * x;
    return OK;
}

int main(void) {
    int result = -1;
    int inputs[] = {7, 500, -3};
    for (int i = 0; i < 3; i++) {
        Check c = check(inputs[i], &result);
        printf("%d:%d ", c, result);
    }
    printf("\n");
    return 0;
}`,
      answers: ['0:14 2:14 1:14'],
      placeholder: 'Вывод программы',
      explain:
        'При успехе result становится 14, а при ошибках функция его не трогает — значение остаётся прежним. Коды перечисления: OK = 0, TOO_SMALL = 1, TOO_BIG = 2.',
    },
    {
      q: 'Почему перед цепочкой захвата ресурсов указатели инициализируют NULL?',
      options: [
        'Чтобы код после метки cleanup мог освобождать всё, независимо от того, на каком шаге произошла ошибка',
        'Без этого malloc вернёт ошибку',
        'Так требует синтаксис goto',
        'Чтобы ускорить освобождение',
      ],
      correct: 0,
      explain:
        'free(NULL) ничего не делает, а для fclose проверка на NULL пишется явно. Тогда один и тот же блок освобождения корректен на любом пути выхода.',
    },
    {
      q: 'В каком порядке освобождают ресурсы в блоке cleanup, если функция открыла файл, затем выделила буфер, затем открыла второй файл?',
      options: [
        'В обратном: второй файл, буфер, первый файл',
        'В том же: первый файл, буфер, второй файл',
        'Порядок не важен никогда',
        'Сначала память, потом файлы',
      ],
      correct: 0,
      explain:
        'Обратный порядок повторяет зависимость: позже захваченный ресурс может опираться на ранее захваченный. Это правило работает и для деструкторов в C++.',
    },
    {
      q: 'Куда выводить сообщения об ошибках в консольной программе?',
      answers: ['stderr'],
      placeholder: 'Поток',
      explain:
        'stdout оставляют для результатов: его перенаправляют в файл или передают другой программе. Ошибки в stderr остаются видимыми.',
    },
    {
      q: 'Что сообщает атрибут [[nodiscard]] у функции?',
      options: [
        'Компилятор предупредит, если результат вызова проигнорирован',
        'Функция не может вернуть ошибку',
        'Результат функции хранится в регистре',
        'Функцию нельзя вызвать дважды',
      ],
      correct: 0,
      explain:
        'Это способ сделать проверку ошибок обязательной. [[nodiscard]] — стандартный атрибут C23; в старом коде то же записывают нестандартным __attribute__((warn_unused_result)).',
    },
    {
      q: 'Конструктор выделил структуру, но не смог выделить её внутренний буфер. Что он должен сделать?',
      options: [
        'Освободить уже выделенную структуру и вернуть NULL',
        'Вернуть структуру с буфером NULL',
        'Завершить программу через exit',
        'Повторять malloc, пока не получится',
      ],
      correct: 0,
      explain:
        'Пользователь не должен получать наполовину созданный объект: он не знает, какие поля годятся. Конструктор отвечает за всё, что успел выделить.',
    },
  ],
  exercises: [
    {
      title: 'Разбор конфигурации',
      description: `
Разберите файл настроек окна. Каждая строка ввода — \`ключ = значение\` (пробелы вокруг ключа, \`=\` и значения необязательны). Пустые строки и строки, начинающиеся с \`#\`, пропускаются. Допустимые ключи:

| Ключ | Значение |
| --- | --- |
| \`width\`, \`height\` | целое от 1 до 10000 |
| \`title\` | непустая строка до 30 символов |
| \`fullscreen\` | \`yes\` или \`no\` |

Напишите функцию разбора строки, которая возвращает код из перечисления, и функцию, переводящую код в сообщение. Для строки с ошибкой напечатайте \`строка N: СООБЩЕНИЕ\`:
- \`синтаксическая ошибка\` — нет \`=\` или пустой ключ;
- \`неизвестный ключ КЛЮЧ\`;
- \`неверное значение ключа КЛЮЧ\` — значение не подходит;
- \`повтор ключа КЛЮЧ\` — ключ уже встречался в правильной строке (неверное значение важнее повтора).

Если ошибок не было, напечатайте настройки в виде \`width=W height=H title=T fullscreen=yes|no\` (по умолчанию 800, 600, \`untitled\`, \`no\`), иначе — \`ошибок: K\`.`,
      constraints: ['Строки не длиннее 200 символов; строк не больше 50.'],
      hints: [
        'Перечисление: typedef enum { CFG_OK, CFG_SKIP, CFG_SYNTAX, CFG_UNKNOWN, CFG_VALUE, CFG_DUPLICATE } CfgError; — CFG_SKIP для пустых строк и комментариев.',
        'Отделите ключ и значение по первому =, затем обрежьте пробелы с обеих сторон каждой части. Ключ для сообщения функция возвращает через выходной параметр.',
        'Число проверяйте через strtol с указателем end. Чтобы обнаружить повтор, храните флаги «ключ уже задан» в структуре конфигурации.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { CFG_OK, CFG_SKIP, CFG_SYNTAX, CFG_UNKNOWN, CFG_VALUE, CFG_DUPLICATE } CfgError;

typedef struct {
    long width, height;
    char title[31];
    int fullscreen;
    int seen[4];               // width, height, title, fullscreen
} Config;

static char *trim(char *s) {
    while (isspace((unsigned char)*s)) {
        s++;
    }
    char *end = s + strlen(s);
    while (end > s && isspace((unsigned char)end[-1])) {
        *--end = '\0';
    }
    return s;
}

static int parse_size(const char *text, long *out) {
    char *end;
    long v = strtol(text, &end, 10);
    if (end == text || *end != '\0' || v < 1 || v > 10000) {
        return 0;
    }
    *out = v;
    return 1;
}

static CfgError parse_line(char *line, Config *cfg, char *key_out) {
    char *text = trim(line);
    if (*text == '\0' || *text == '#') {
        return CFG_SKIP;
    }
    char *eq = strchr(text, '=');
    if (eq == NULL) {
        return CFG_SYNTAX;
    }
    *eq = '\0';
    char *key = trim(text);
    char *value = trim(eq + 1);
    if (*key == '\0') {
        return CFG_SYNTAX;
    }
    snprintf(key_out, 32, "%.31s", key);
    static const char *const KEYS[] = {"width", "height", "title", "fullscreen"};
    int index = -1;
    for (int i = 0; i < 4; i++) {
        if (strcmp(key, KEYS[i]) == 0) {
            index = i;
        }
    }
    if (index < 0) {
        return CFG_UNKNOWN;
    }
    Config next = *cfg;                       // изменения применяются только при успехе
    if (index == 0 && !parse_size(value, &next.width)) {
        return CFG_VALUE;
    }
    if (index == 1 && !parse_size(value, &next.height)) {
        return CFG_VALUE;
    }
    if (index == 2) {
        if (*value == '\0' || strlen(value) > 30) {
            return CFG_VALUE;
        }
        strcpy(next.title, value);
    }
    if (index == 3) {
        if (strcmp(value, "yes") != 0 && strcmp(value, "no") != 0) {
            return CFG_VALUE;
        }
        next.fullscreen = strcmp(value, "yes") == 0;
    }
    if (cfg->seen[index]) {
        return CFG_DUPLICATE;
    }
    next.seen[index] = 1;
    *cfg = next;
    return CFG_OK;
}

static const char *cfg_message(CfgError e) {
    switch (e) {
    case CFG_SYNTAX:
        return "синтаксическая ошибка";
    case CFG_UNKNOWN:
        return "неизвестный ключ";
    case CFG_VALUE:
        return "неверное значение ключа";
    case CFG_DUPLICATE:
        return "повтор ключа";
    default:
        return "";
    }
}

int main(void) {
    Config cfg = {800, 600, "untitled", 0, {0, 0, 0, 0}};
    char line[256], key[32];
    int number = 0, errors = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        number++;
        line[strcspn(line, "\r\n")] = '\0';
        CfgError e = parse_line(line, &cfg, key);
        if (e == CFG_OK || e == CFG_SKIP) {
            continue;
        }
        errors++;
        if (e == CFG_SYNTAX) {
            printf("строка %d: %s\n", number, cfg_message(e));
        } else {
            printf("строка %d: %s %s\n", number, cfg_message(e), key);
        }
    }
    if (errors == 0) {
        printf("width=%ld height=%ld title=%s fullscreen=%s\n", cfg.width, cfg.height, cfg.title,
               cfg.fullscreen ? "yes" : "no");
    } else {
        printf("ошибок: %d\n", errors);
    }
    return 0;
}`,
      explanation: `
Функция разбора строки сообщает результат перечислением, а ключ для сообщения — через выходной параметр. Тексты сообщений собраны в одной функции \`cfg_message\`: разбор не печатает ничего сам, поэтому его можно использовать и в программе с другим форматом вывода, и в тестах.

Изменения применяются к копии конфигурации и переносятся в настоящую только после всех проверок. Строка с неверным значением не оставляет за собой «наполовину» применённых настроек — это то же правило, что и для выходных параметров: при ошибке состояние не меняется.

Номер строки — контекст, без которого сообщение бесполезно: «неверное значение ключа width» в файле из сотни строк заставило бы искать ошибку вручную.`,
      examples: [
        {
          in: '# окно\nwidth = 1024\ntitle = Редактор\n\nfullscreen=yes\n',
          out: 'width=1024 height=600 title=Редактор fullscreen=yes\n',
        },
        {
          in: 'width = 0\ncolor = red\nheight 500\ntitle = A\ntitle = B\n',
          out: 'строка 1: неверное значение ключа width\nстрока 2: неизвестный ключ color\nстрока 3: синтаксическая ошибка\nстрока 5: повтор ключа title\nошибок: 4\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пустой файл' },
        { in: '   width=10000  \nheight=1\n', name: 'Границы и пробелы' },
        { in: 'width=10001\n', name: 'Больше максимума' },
        { in: 'width=12px\nheight=\n', name: 'Не числа' },
        { in: '= 5\n', name: 'Пустой ключ' },
        { in: 'title = abcdefghijklmnopqrstuvwxyz0123\n', name: 'Длинный заголовок' },
        { in: 'fullscreen = maybe\nfullscreen = no\n', name: 'Ошибка, затем правильное значение' },
        { in: 'width = 5\nwidth = 0\nwidth = 6\n', name: 'Повтор после ошибки' },
        { in: '#width=1\n  # comment\ntitle = a = b\n', name: 'Комментарии и = в значении' },
      ],
    },
    {
      title: 'Найди ошибку: утечка на пути ошибки',
      bug: true,
      description: `
Программа читает группы оценок: число \`n\`, затем \`n\` оценок от 0 до 100. Для каждой группы функция \`summarize\` вычисляет медиану (левую из двух средних при чётном \`n\`), моду (наименьшую из самых частых оценок) и среднее; программа печатает \`медиана M, мода X, среднее A\` или сообщение об ошибке: \`ошибка: пустая группа\` или \`ошибка: оценка вне диапазона\`.

Результаты правильные, но при проверке с AddressSanitizer программа падает с отчётом LeakSanitizer на входах с ошибками. Исправьте функцию так, чтобы память освобождалась на всех путях.`,
      constraints: ['0 ≤ n ≤ 100; групп не больше 20.'],
      hints: [
        'Посмотрите на каждый return в summarize: какие блоки уже выделены к этому моменту и кто их освободит?',
        'Сделайте единую точку выхода: заведите переменную status, вместо return пишите status = …; goto cleanup;, а в конце функции после метки cleanup освободите оба блока и верните status.',
      ],
      starter: GRADES(false),
      solution: GRADES(true),
      explanation: `
Функция выделяет два блока, а потом проверяет данные. Ранние \`return SUM_EMPTY\` и \`return SUM_RANGE\` выходят, не освободив их, — на каждой ошибочной группе теряется память. Программа печатает правильный результат, поэтому утечку видно только инструментами: LeakSanitizer в конце работы сообщает о блоках, на которые не осталось указателей.

Единая точка выхода устраняет целый класс таких ошибок: любой путь — успешный или ошибочный — проходит через \`cleanup\`, где оба блока освобождаются. Добавив в функцию ещё одну проверку, достаточно написать \`goto cleanup\` — освобождение уже есть. Ветка нехватки памяти тоже упростилась: \`free(NULL)\` безопасен, и неудачное выделение не требует особого случая.`,
      examples: [
        { in: '5 90 70 80 70 100\n', out: 'медиана 80, мода 70, среднее 82.00\n' },
        { in: '0\n2 50 101\n', out: 'ошибка: пустая группа\nошибка: оценка вне диапазона\n' },
      ],
      hidden: [
        '1 100\n',
        '4 10 20 30 40\n',
        '3 -1 50 50\n',
        '0\n0\n',
        '3 5 5 5\n2 7 200\n1 0\n',
        '6 100 0 100 0 50 50\n',
        '2 101 101\n',
        '7 60 70 80 90 100 60 70\n',
      ],
    },
    {
      title: 'Всё или ничего',
      description: `
Прочитайте число счетов \`n\` и их начальные балансы (счета нумеруются с 1). Затем обработайте команды:
- \`transfer A B X\` — добавить в текущий пакет перевод суммы \`X > 0\` со счёта \`A\` на счёт \`B\` (сразу ничего не меняется);
- \`commit\` — применить пакет **целиком или не применять вовсе**: переводы выполняются по порядку, и если какой-то из них невозможен (нет счёта, \`A = B\`, недостаточно средств с учётом предыдущих переводов пакета), ни один перевод пакета не применяется. Напечатайте \`применено K\` или \`откат: перевод J\` (номер первого невозможного перевода в пакете, с 1). Пакет после \`commit\` очищается;
- \`show\` — напечатать балансы через пробел.

Пакет без переводов при \`commit\` даёт \`применено 0\`.`,
      constraints: [
        '1 ≤ n ≤ 20; балансы и суммы — целые до 10⁹; в пакете не больше 50 переводов; команд не больше 200.',
      ],
      hints: [
        'Храните пакет в массиве структур { int from, to; long long amount; }.',
        'При commit скопируйте балансы во временный массив и выполняйте переводы на копии. Если все прошли — скопируйте копию обратно (memcpy), иначе просто забудьте её.',
        'Проверка перевода: 1 ≤ from, to ≤ n, from ≠ to, amount > 0 и copy[from] ≥ amount.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    int from, to;
    long long amount;
} Transfer;

int main(void) {
    int n;
    long long balances[21];
    if (scanf("%d", &n) != 1 || n < 1 || n > 20) {
        return 0;
    }
    for (int i = 1; i <= n; i++) {
        if (scanf("%lld", &balances[i]) != 1) {
            return 0;
        }
    }
    Transfer batch[50];
    int pending = 0;
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "transfer") == 0) {
            Transfer t;
            if (scanf("%d %d %lld", &t.from, &t.to, &t.amount) != 3) {
                break;
            }
            if (pending < 50) {
                batch[pending++] = t;
            }
        } else if (strcmp(command, "commit") == 0) {
            long long copy[21];
            memcpy(copy, balances, sizeof copy);
            int failed = 0;
            for (int i = 0; i < pending && !failed; i++) {
                const Transfer *t = &batch[i];
                if (t->from < 1 || t->from > n || t->to < 1 || t->to > n || t->from == t->to ||
                    t->amount <= 0 || copy[t->from] < t->amount) {
                    failed = i + 1;
                } else {
                    copy[t->from] -= t->amount;
                    copy[t->to] += t->amount;
                }
            }
            if (failed) {
                printf("откат: перевод %d\n", failed);
            } else {
                memcpy(balances, copy, sizeof copy);
                printf("применено %d\n", pending);
            }
            pending = 0;
        } else if (strcmp(command, "show") == 0) {
            for (int i = 1; i <= n; i++) {
                printf(i < n ? "%lld " : "%lld\n", balances[i]);
            }
        }
    }
    return 0;
}`,
      explanation: `
Пакет переводов — небольшая **транзакция**: либо все изменения, либо никаких. Если применять переводы прямо к настоящим балансам и остановиться на ошибке, деньги «зависнут» на полпути: часть переводов выполнена, часть нет. Вместо этого изменения делаются на копии, и только полностью успешный пакет становится настоящим состоянием — одной операцией копирования.

Тот же приём используют базы данных (журнал и откат), текстовые редакторы (сохранение во временный файл и переименование) и функция разбора конфигурации из первой задачи. Проверка средств учитывает предыдущие переводы пакета, потому что они выполняются на той же копии.`,
      examples: [
        {
          in: '3 100 50 0\ntransfer 1 3 70\ntransfer 2 3 50\ncommit\nshow\n',
          out: 'применено 2\n30 0 120\n',
        },
        {
          in: '2 10 10\ntransfer 1 2 5\ntransfer 1 2 6\ncommit\nshow\n',
          out: 'откат: перевод 2\n10 10\n',
        },
      ],
      hidden: [
        { in: '1 5\ncommit\nshow\n', name: 'Пустой пакет' },
        {
          in: '2 10 0\ntransfer 2 1 1\ntransfer 1 2 5\ncommit\nshow\n',
          name: 'Ошибка в первом переводе',
        },
        {
          in: '2 10 0\ntransfer 1 2 10\ntransfer 2 1 10\ncommit\nshow\n',
          name: 'Деньги туда и обратно',
        },
        {
          in: '2 10 10\ntransfer 1 3 1\ncommit\ntransfer 1 1 1\ncommit\nshow\n',
          name: 'Нет счёта и сам себе',
        },
        { in: '2 10 10\ntransfer 1 2 0\ncommit\n', name: 'Нулевая сумма' },
        {
          in: '3 5 5 5\ntransfer 1 2 5\ncommit\ntransfer 2 3 10\ntransfer 3 1 20\ncommit\nshow\n',
          name: 'Два пакета',
        },
        {
          in: '2 1000000000 0\ntransfer 1 2 1000000000\ncommit\nshow\n',
          name: 'Большая сумма',
        },
        {
          in: '3 1 1 1\ntransfer 1 2 1\ntransfer 2 3 2\ntransfer 3 1 3\ncommit\nshow\n',
          name: 'Цепочка',
        },
      ],
    },
    {
      id: 'advanced-project-measurement-log',
      title: 'Анализатор журнала измерений',
      difficulty: 'advanced',
      description: `
Прочитайте журнал показаний датчиков и вычислите число измерений, минимум, максимум, среднее и число ошибочных строк. Каждая строка журнала — \`время,значение\`:
- **время** — десятичное целое от 0 до 1 000 000;
- **значение** — конечное число от −1000 до 1000, которое распознаёт \`strtod\` в стандартной локали;
- пробелы вокруг чисел и в конце строки допустимы, других символов после значения быть не должно; повторы времени допустимы.

Каждая из этих строк считается **одной** ошибкой: пустая строка, неверный разделитель, время вне диапазона, NaN или бесконечность, переполнение, строка длиннее 127 байтов (или с нулевым байтом). Последняя строка может не заканчиваться переводом строки.

Если корректные измерения есть, напечатайте \`count min max average errors\` — числа с двумя знаками после точки (ноль без минуса). Без корректных измерений — \`НЕТ ДАННЫХ errors\`. Ошибка создания или чтения файла завершает программу с ненулевым кодом, а не увеличивает \`errors\`.

**Транспорт.** Адаптер копирует стандартный ввод во временный файл \`tmpfile()\` и возвращается к началу; функция \`analyze(FILE *)\` читает именно этот файл. Не храните измерения в массиве: достаточно текущей строки и накопителей.`,
      constraints: [
        'Не больше 200 строк.',
        'Все открытые потоки закрываются, включая пути ошибки; код ошибки ввода-вывода отделён от брака строк.',
      ],
      hints: [
        'analyze читает поток посимвольно в буфер на 128 байтов. Если строка не помещается, установите флаг переполнения и пропускайте символы до \\n — тогда длинная строка даст одну ошибку, а не несколько.',
        'consume разбирает строку: strtol для времени, пропуск пробелов, проверка запятой, strtod для значения, пропуск пробелов, проверка конца строки. errno обнуляйте перед каждым strtol и strtod, конечность проверяйте isfinite.',
        'Минимум и максимум инициализируйте первым корректным измерением. При печати замените −0.0 на 0.0, чтобы не получить «-0.00».',
      ],
      solution: MEASUREMENT_LOG,
      explanation: `
\`analyze\` читает поток по символам, поэтому длинная строка не превращается в несколько независимых ошибок: флаг переполнения остаётся установленным до её конца. \`consume\` разбирает два поля, проверяет диапазоны, конечность числа и остаток строки; каждая проблема — ровно одна ошибка. \`errno\` обнуляется перед каждым \`strtol\` и \`strtod\`, иначе переполнение одной строки «перешло» бы на следующую. Минимум и максимум берутся из первого корректного измерения — так журнал из одних отрицательных чисел обрабатывается правильно, а среднее вычисляется только при ненулевом счётчике.

Память не зависит от длины журнала: буфер строки фиксирован, измерения не хранятся. Отказ ввода-вывода отделён от брака строк: испорченная строка — это данные, а невозможность прочитать файл — отказ окружения, и программа сообщает о нём кодом завершения. Разделение адаптера и \`analyze\` позволяет заменить \`tmpfile\` на \`fopen\` без изменения алгоритма.`,
      examples: [
        { in: '1,10\n2,20\n3,-3\n', out: '3 -3.00 20.00 9.00 0\n' },
        { in: 'bad\n1,5\n2,nan\n', out: '1 5.00 5.00 5.00 2\n' },
      ],
      hidden: [
        { in: '', name: 'Пустой журнал' },
        { in: '\nabc\n', name: 'Только ошибки' },
        { in: '0,-10\n1,-20', name: 'Без перевода строки в конце' },
        { in: '1,inf\n2,1x\n3,1e999\n4,0\n', name: 'Бесконечность, хвост и переполнение' },
        { in: ' 1 , 2.5 \r\n1000001,0\n2;-1\n', name: 'Пробелы, диапазон времени, разделитель' },
        { in: 'x'.repeat(140) + '\n1,3\n', name: 'Длинная строка' },
        { in: '1,-0\n2,0\n', name: 'Отрицательный ноль' },
        { in: '5,1000\n6,-1000\n7,1000.5\n8,-1000.01\n', name: 'Границы значения' },
        { in: '1,1\n1,2\n1,3\n', name: 'Повторы времени' },
        { in: '-1,5\n99999999999999999999,5\n10,5\n', name: 'Отрицательное и огромное время' },
      ],
    },
  ],
};
