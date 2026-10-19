const PARSE_LIST = (fixed) => String.raw`
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char word[64];
    long long sum = 0;
    int index = 0;
${fixed ? '' : '    errno = 0;\n'}    while (scanf("%63s", word) == 1) {
        index++;
        char *end;
${fixed ? '        errno = 0;\n' : ''}        long value = strtol(word, &end, 10);
        if (end == word || *end != '\0') {
            printf("%d: не число\n", index);
        } else if (errno == ERANGE) {
            printf("%d: переполнение\n", index);
        } else {
            printf("%d: %ld\n", index, value);
            sum += value;
        }
    }
    printf("сумма: %lld\n", sum);
    return 0;
}`;

export default {
  id: 'advanced-errno',
  title: 'errno: как библиотека сообщает об ошибках',
  description:
    'Особое возвращаемое значение и код причины в errno; макросы кодов и их переносимость; perror и strerror; три правила работы с errno: проверять после неудачи, сохранять сразу, обнулять перед strtol и математикой; полный разбор чисел strtol; ошибки области и диапазона в math.h; errno в потоках.',
  moduleId: 'advanced-c',
  order: 26,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-binary-files'],
  objectives: [
    'Определять причину ошибки библиотечной функции по errno',
    'Соблюдать правила: проверять результат, сохранять errno, обнулять перед strtol',
    'Разбирать числа strtol с полной проверкой',
    'Обрабатывать ошибки области и диапазона математических функций',
  ],
  tags: ['errno', 'strerror', 'perror', 'strtol', 'Обработка ошибок'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Как правильно узнать, почему fopen не открыл файл?',
      options: [
        'Проверить, что fopen вернул NULL, сразу сохранить errno и получить описание через strerror',
        'Проверить, что errno не равна нулю, не глядя на результат fopen',
        'Вызвать feof для возвращённого указателя',
        'fopen сам печатает причину ошибки',
      ],
      correct: 0,
      explain:
        'Сначала результат, затем errno. Успешные функции могут менять errno, поэтому её значение без неудачи ничего не значит.',
    },
    {
      q: 'Почему в программе пишут errno == ENOENT, а не errno == 2?',
      options: [
        'Числовые значения кодов в разных системах разные, а имя макроса переносимо',
        'Сравнение с числом не компилируется',
        'ENOENT быстрее',
        'errno — строка, а не число',
      ],
      correct: 0,
      explain:
        'ENOENT определяет POSIX, но число задаёт конкретная система. Макрос подставит правильное значение.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char *end;
    errno = 0;
    long a = strtol("123abc", &end, 10);
    printf("%ld %s %d\n", a, end, errno == ERANGE);
    return 0;
}`,
      answers: ['123 abc 0'],
      placeholder: 'Вывод программы',
      explain:
        'strtol читает цифры, пока может, и оставляет end на первом нецифровом символе. Переполнения нет, поэтому errno не ERANGE.',
    },
    {
      q: 'Зачем записывать errno = 0 перед вызовом strtol?',
      options: [
        'strtol на любой исход может вернуть законное число, и только обнулённая заранее errno покажет, было ли переполнение',
        'Без этого strtol не работает',
        'Чтобы strtol вернула ноль при ошибке',
        'Это нужно только в многопоточных программах',
      ],
      correct: 0,
      explain:
        'LONG_MAX — и законный результат, и признак переполнения. Различить их можно только по ERANGE, а библиотека errno не обнуляет.',
    },
    {
      q: 'Какие функции не сообщают об ошибках разбора числа? Выберите все.',
      options: ['atoi', 'atof', 'strtol', 'strtod'],
      correct: [0, 1],
      explain:
        'atoi и atof возвращают 0 и для «0», и для «abc», а при переполнении поведение не определено. strtol и strtod сообщают через end и errno.',
    },
    {
      q: 'Какую ошибку сообщает sqrt(-4.0) через errno (если math_errhandling включает MATH_ERRNO)?',
      answers: ['EDOM'],
      placeholder: 'Макрос',
      explain:
        'Аргумент вне области определения — EDOM, результат — NaN. Переполнение результата — ERANGE.',
    },
    {
      q: 'Что не так в строке printf("%d: %s\\n", remove(name), strerror(errno));?',
      options: [
        'Порядок вычисления аргументов не определён: strerror(errno) может вызваться раньше remove',
        'remove нельзя вызывать внутри printf',
        'strerror нельзя передавать в printf',
        'Ничего, строка верна',
      ],
      correct: 0,
      explain:
        'GCC вычисляет аргументы справа налево и покажет описание старой ошибки (или Success). Результат и errno сохраняют в переменные сразу после вызова.',
    },
    {
      q: 'Влияет ли ошибка в одном потоке на errno другого потока в C11?',
      options: [
        'Нет: у каждого потока своя errno',
        'Да: errno — общая глобальная переменная',
        'Только если потоки используют одну функцию',
        'errno нельзя использовать в многопоточных программах',
      ],
      correct: 0,
      explain:
        'errno имеет потоковое время хранения: макрос раскрывается в обращение к переменной текущего потока.',
    },
  ],
  exercises: [
    {
      title: 'Разбор целых',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — один токен (без пробелов внутри). Разберите его как десятичное целое типа \`long\` с помощью \`strtol\` и напечатайте одно из:
- \`число N\` — токен целиком является числом (знак допустим);
- \`не число\` — в начале токена нет цифр;
- \`лишние символы: ХВОСТ\` — после числа остались символы (напечатайте их);
- \`переполнение\` — число не помещается в \`long\`.

Если есть и переполнение, и лишние символы, печатайте \`переполнение\`.`,
      constraints: ['Токены — до 60 символов ASCII; строк не больше 30.'],
      hints: [
        'Порядок: char *end; errno = 0; long v = strtol(word, &end, 10);.',
        "end == word — цифр не было; errno == ERANGE — переполнение; *end != '\\0' — хвост, он начинается с end.",
        'Проверяйте переполнение раньше хвоста — так требует условие для смешанного случая.',
      ],
      solution: String.raw`
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char word[64];
    while (scanf("%63s", word) == 1) {
        char *end;
        errno = 0;
        long value = strtol(word, &end, 10);
        if (end == word) {
            printf("не число\n");
        } else if (errno == ERANGE) {
            printf("переполнение\n");
        } else if (*end != '\0') {
            printf("лишние символы: %s\n", end);
        } else {
            printf("число %ld\n", value);
        }
    }
    return 0;
}`,
      explanation: `
\`strtol\` сообщает о трёх разных проблемах тремя способами: «не число» — указатель \`end\` остался в начале строки; «лишние символы» — \`end\` указывает не на конец; переполнение — \`errno == ERANGE\` (результат при этом \`LONG_MAX\` или \`LONG_MIN\`). \`errno\` обнуляется перед **каждым** вызовом: иначе переполнение одного токена «перешло» бы на следующий.

Порядок проверок задаёт, какое сообщение важнее: пустой разбор исключает всё остальное, а переполнение по условию важнее хвоста.`,
      examples: [
        { in: '42\n-17\n12px\nabc\n', out: 'число 42\nчисло -17\nлишние символы: px\nне число\n' },
        { in: '99999999999999999999\n', out: 'переполнение\n' },
      ],
      hidden: [
        { in: '0\n+5\n-0\n', name: 'Ноль и знаки' },
        { in: '9223372036854775807\n9223372036854775808\n', name: 'Граница LONG_MAX' },
        { in: '-9223372036854775808\n-9223372036854775809\n', name: 'Граница LONG_MIN' },
        { in: '+\n-\n', name: 'Только знак' },
        { in: '99999999999999999999xyz\n', name: 'Переполнение и хвост' },
        { in: '3.14\n1e5\n', name: 'Дробная запись' },
        { in: '0x1F\n007\n', name: 'Префиксы' },
        { in: '5\n99999999999999999999\n7\n', name: 'Ошибка между числами' },
      ],
    },
    {
      title: 'Операции с файлами',
      description: `
Выполните команды над файлами в текущем каталоге и сообщите о результате каждой:
- \`create ИМЯ\` — создать новый файл, но **не** перезаписывать существующий: \`fopen(ИМЯ, "wx")\`;
- \`append ИМЯ\` — открыть на дописывание: \`fopen(ИМЯ, "a")\`;
- \`open ИМЯ\` — открыть на чтение: \`fopen(ИМЯ, "r")\`;
- \`remove ИМЯ\` — удалить: \`remove(ИМЯ)\`.

Открытый файл сразу закрывайте. При успехе печатайте \`ИМЯ: успех\`, при неудаче — \`ИМЯ: КОД (описание)\`, где \`КОД\` — имя макроса (\`ENOENT\`, \`EEXIST\`, \`EISDIR\`, \`EACCES\`, \`ENOTDIR\`; для других кодов — \`E?\`), а описание — \`strerror\` сохранённого кода.`,
      constraints: ['Команд не больше 30; имена — до 60 символов без пробелов.'],
      hints: [
        'Сразу после неудачного вызова сохраните код: int code = errno;. Только потом вызывайте printf и strerror.',
        'Имя макроса по коду: таблица static const struct { int code; const char *name; } NAMES[] = {{ENOENT, "ENOENT"}, …};.',
        'Для команд с fopen результат — указатель, для remove — ноль при успехе. Удобно вынести печать результата в функцию report(name, ok, code).',
      ],
      solution: String.raw`
#include <errno.h>
#include <stdio.h>
#include <string.h>

static const struct {
    int code;
    const char *name;
} NAMES[] = {
    {ENOENT, "ENOENT"}, {EEXIST, "EEXIST"}, {EISDIR, "EISDIR"}, {EACCES, "EACCES"}, {ENOTDIR, "ENOTDIR"},
};

static const char *code_name(int code) {
    for (size_t i = 0; i < sizeof NAMES / sizeof NAMES[0]; i++) {
        if (NAMES[i].code == code) {
            return NAMES[i].name;
        }
    }
    return "E?";
}

static void report(const char *name, int ok, int code) {
    if (ok) {
        printf("%s: успех\n", name);
    } else {
        printf("%s: %s (%s)\n", name, code_name(code), strerror(code));
    }
}

static void try_open(const char *name, const char *mode) {
    FILE *f = fopen(name, mode);
    int code = errno;
    if (f != NULL) {
        fclose(f);
    }
    report(name, f != NULL, code);
}

int main(void) {
    char command[16], name[64];
    while (scanf("%15s %63s", command, name) == 2) {
        if (strcmp(command, "create") == 0) {
            try_open(name, "wx");
        } else if (strcmp(command, "append") == 0) {
            try_open(name, "a");
        } else if (strcmp(command, "open") == 0) {
            try_open(name, "r");
        } else if (strcmp(command, "remove") == 0) {
            int result = remove(name);
            int code = errno;
            report(name, result == 0, code);
        }
    }
    return 0;
}`,
      explanation: `
Каждая операция сообщает о неудаче своим способом — \`NULL\` у \`fopen\`, ненулевой результат у \`remove\`, — а причину все они кладут в \`errno\`. Код сохраняется **сразу** после вызова: \`fclose\` и \`printf\` могли бы его изменить. Имя макроса программа находит по таблице, а не печатает число, — числовые значения кодов зависят от системы.

Режим \`"wx"\` (C11) открывает файл, только если его ещё нет, — так программа не уничтожит чужие данные. Открытие каталога на запись даёт \`EISDIR\`, а путь через несуществующий каталог — \`ENOENT\`: система не нашла даже каталог. Описания \`strerror\` на английском — это стандартная локаль «C».`,
      examples: [
        {
          in: 'create a.txt\ncreate a.txt\nopen a.txt\nremove a.txt\nopen a.txt\n',
          out: 'a.txt: успех\na.txt: EEXIST (File exists)\na.txt: успех\na.txt: успех\na.txt: ENOENT (No such file or directory)\n',
        },
        { in: 'append .\n', out: '.: EISDIR (Is a directory)\n' },
      ],
      hidden: [
        { in: 'remove ghost.txt\n', name: 'Удаление несуществующего' },
        {
          in: 'append log.txt\nappend log.txt\ncreate log.txt\n',
          name: 'Дописывание создаёт файл',
        },
        {
          in: 'open missing/inner.txt\ncreate missing/inner.txt\n',
          name: 'Несуществующий каталог',
        },
        { in: 'create data.bin\nopen data.bin/x\n', name: 'Путь через файл' },
        { in: 'open .\n', name: 'Каталог на чтение' },
        { in: 'create x\nremove x\nremove x\ncreate x\n', name: 'Повторные операции' },
        { in: 'create .\n', name: 'Создать существующий каталог' },
        { in: 'append a\nappend b\nremove a\nopen b\nopen a\n', name: 'Два файла' },
      ],
    },
    {
      title: 'Найди ошибку: ложное переполнение',
      bug: true,
      description: `
Программа разбирает токены ввода как целые числа \`long\`: для каждого печатает \`номер: число\`, \`номер: не число\` (в том числе при лишних символах) или \`номер: переполнение\`, а в конце — сумму правильных чисел.

После первого переполнения все следующие числа тоже объявляются переполнением. Найдите и исправьте ошибку.`,
      constraints: ['Токенов не больше 30, каждый до 60 символов.'],
      hints: [
        'Когда errno получает значение ERANGE и кто её потом возвращает к нулю?',
        'Библиотека никогда не обнуляет errno. Записывайте errno = 0 перед каждым вызовом strtol, а не один раз до цикла.',
      ],
      starter: PARSE_LIST(false),
      solution: PARSE_LIST(true),
      explanation: `
\`strtol\` при переполнении записывает \`ERANGE\` в \`errno\`, а при успешном разборе \`errno\` не трогает. Программа обнуляет её один раз до цикла, поэтому после первого переполнения \`ERANGE\` остаётся навсегда — и каждое следующее число выглядит переполненным.

Правило для функций без особого значения ошибки: \`errno = 0\` **непосредственно** перед каждым вызовом, проверка — сразу после. Тогда \`ERANGE\` говорит именно об этом вызове.`,
      examples: [
        { in: '5 99999999999999999999 7\n', out: '1: 5\n2: переполнение\n3: 7\nсумма: 12\n' },
        { in: '1 2 3\n', out: '1: 1\n2: 2\n3: 3\nсумма: 6\n' },
      ],
      hidden: [
        '99999999999999999999 1\n',
        '-99999999999999999999 -1 2\n',
        'abc 99999999999999999999 x 4\n',
        '\n',
        '9223372036854775807 0\n',
        '99999999999999999999 99999999999999999999 10\n',
        '12x 3\n',
        '1 99999999999999999999 2 99999999999999999999 3\n',
      ],
    },
    {
      title: 'Математика без сюрпризов',
      difficulty: 'advanced',
      description: `
Вычисляйте математические функции и сообщайте об ошибках по \`errno\`. Команды до конца ввода:
- \`sqrt X\`, \`log X\`, \`exp X\` — корень, натуральный логарифм, экспонента;
- \`pow X Y\` — X в степени Y.

Перед каждым вызовом обнулите \`errno\`, после вызова проверьте её: \`EDOM\` — напечатайте \`ошибка области: NAME(аргументы)\`, \`ERANGE\` — \`ошибка диапазона: NAME(аргументы)\`, иначе — результат с шестью значащими цифрами (\`%.6g\`). Аргументы печатайте в формате \`%g\` через запятую и пробел.

В начале программы проверьте, что реализация сообщает об ошибках математики через \`errno\` (\`math_errhandling & MATH_ERRNO\`); если нет — напечатайте \`errno не поддерживается\` и завершите работу.`,
      constraints: [
        'Аргументы — числа в записи, которую понимает scanf("%lf"); команд не больше 30.',
      ],
      hints: [
        'Функции можно хранить в таблице: struct { const char *name; double (*f)(double); } FUNCS[] = {{"sqrt", sqrt}, {"log", log}, {"exp", exp}}; — а pow обработать отдельно.',
        'Сохраните errno в переменную сразу после вызова функции, до любого printf.',
        'glibc сообщает ERANGE и при переполнении (exp(1000)), и при исчезновении порядка (exp(-1000) = 0), и в полюсе (log(0), pow(0, -1)).',
      ],
      solution: String.raw`
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

static const struct {
    const char *name;
    double (*f)(double);
} FUNCS[] = {{"sqrt", sqrt}, {"log", log}, {"exp", exp}};

static void report(int code, double result, const char *name, double x, double y, int two) {
    if (code == EDOM || code == ERANGE) {
        printf("%s: %s(", code == EDOM ? "ошибка области" : "ошибка диапазона", name);
        if (two) {
            printf("%g, %g)\n", x, y);
        } else {
            printf("%g)\n", x);
        }
    } else {
        printf("%.6g\n", result);
    }
}

int main(void) {
    if (!(math_errhandling & MATH_ERRNO)) {
        printf("errno не поддерживается\n");
        return 0;
    }
    char name[16];
    while (scanf("%15s", name) == 1) {
        double x, y = 0;
        if (scanf("%lf", &x) != 1) {
            break;
        }
        if (strcmp(name, "pow") == 0) {
            if (scanf("%lf", &y) != 1) {
                break;
            }
            errno = 0;
            double result = pow(x, y);
            int code = errno;
            report(code, result, name, x, y, 1);
            continue;
        }
        for (size_t i = 0; i < sizeof FUNCS / sizeof FUNCS[0]; i++) {
            if (strcmp(FUNCS[i].name, name) == 0) {
                errno = 0;
                double result = FUNCS[i].f(x);
                int code = errno;
                report(code, result, name, x, 0, 0);
            }
        }
    }
    return 0;
}`,
      explanation: `
Математические функции не могут вернуть «особое» значение ошибки: NaN и бесконечность бывают и законными результатами. Поэтому они сообщают об ошибках через \`errno\` — если это поддерживает реализация, что показывает \`math_errhandling\`. Схема та же, что у \`strtol\`: обнулить, вызвать, сразу сохранить, проверить.

Функции хранятся в таблице указателей: \`sqrt\`, \`log\` и \`exp\` имеют одинаковый тип \`double (double)\`, и одна ветка кода обслуживает все три. Аргументы приходят из ввода, поэтому компилятор не может вычислить функции заранее — каждая ошибка действительно запишется в \`errno\`.

Ошибка области означает, что для такого аргумента функция не определена (\`sqrt\` отрицательного числа, \`pow\` отрицательного основания в дробной степени). Ошибка диапазона — что результат не представим: слишком большой, слишком маленький или бесконечность в полюсе.`,
      examples: [
        {
          in: 'sqrt 2\nsqrt -1\nlog 0\n',
          out: '1.41421\nошибка области: sqrt(-1)\nошибка диапазона: log(0)\n',
        },
        {
          in: 'pow 2 10\npow -8 0.5\nexp 1000\n',
          out: '1024\nошибка области: pow(-8, 0.5)\nошибка диапазона: exp(1000)\n',
        },
      ],
      hidden: [
        { in: 'log 1\nlog 2.718281828459045\n', name: 'Логарифм' },
        { in: 'log -5\n', name: 'Логарифм отрицательного' },
        { in: 'exp -1000\nexp 0\n', name: 'Исчезновение порядка' },
        { in: 'pow 0 -1\npow 0 0\n', name: 'Полюс и 0 в степени 0' },
        { in: 'pow 10 400\npow 2 -1\n', name: 'Переполнение степени' },
        { in: 'sqrt 0\nsqrt 1e300\n', name: 'Ноль и большое число' },
        { in: 'pow -2 3\npow -2 0.5\n', name: 'Отрицательное основание' },
        { in: 'exp 709\nexp 710\n', name: 'Граница exp' },
      ],
    },
  ],
};
