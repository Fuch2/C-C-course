export default {
  id: 'advanced-lldb',
  title: 'Отладчик LLDB',
  description:
    'LLDB на macOS и Linux, структура команд «объект действие», соответствие команд GDB и LLDB, условные точки останова, frame variable и expression, форматы вывода и точки наблюдения.',
  moduleId: 'developer-tools',
  order: 10,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['advanced-gdb'],
  objectives: [
    'Запускать и отлаживать программу в LLDB',
    'Переводить привычные команды GDB на язык LLDB',
    'Различать frame variable и expression',
    'Находить ошибку условной точкой останова',
  ],
  tags: ['LLDB', 'Отладка', 'macOS', 'Clang', 'Точки останова'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какой отладчик вызывают Xcode и CLion на macOS по умолчанию?',
      options: ['LLDB', 'GDB', 'Valgrind', 'AddressSanitizer'],
      correct: 0,
      explain:
        'LLDB поставляется с Xcode Command Line Tools. GDB на macOS требует отдельной установки и подписи.',
    },
    {
      q: 'Какой командой LLDB напечатать стек вызовов?',
      answers: ['bt', 'thread backtrace'],
      placeholder: 'Команда',
      explain: 'Полная форма — thread backtrace, псевдоним bt совпадает с GDB.',
    },
    {
      q: 'Чем frame variable отличается от expression?',
      options: [
        'frame variable читает значения из памяти, expression выполняет код C внутри программы',
        'frame variable работает только с глобальными переменными',
        'expression показывает только типы',
        'Ничем, это синонимы',
      ],
      correct: 0,
      explain:
        'expression может вызвать функцию и изменить состояние программы. Для простого просмотра безопаснее frame variable (v).',
    },
    {
      q: 'Как в LLDB поставить точку останова на строку 12 файла main.c? Напишите одну команду.',
      answers: [
        'b main.c:12',
        'breakpoint set --file main.c --line 12',
        'br s -f main.c -l 12',
        'breakpoint set -f main.c -l 12',
      ],
      placeholder: 'Команда',
      explain:
        'Псевдоним b понимает запись файл:строка, как в GDB; полная форма — breakpoint set --file main.c --line 12.',
    },
    {
      q: 'Какая команда LLDB запускает программу с вводом из файла in.txt?',
      options: [
        'process launch -i in.txt',
        'run in.txt',
        'process launch in.txt',
        'target create in.txt',
      ],
      correct: 0,
      explain:
        'Флаг -i (--stdin) подключает файл ко входу программы. Аргументы командной строки передаются после --.',
    },
    {
      q: 'Как в LLDB остановиться в момент изменения переменной total?',
      options: [
        'watchpoint set variable total',
        'breakpoint set --name total',
        'frame variable total',
        'expression -- total',
      ],
      correct: 0,
      explain: 'Сокращённо — w s v total. Это аналог watch total в GDB.',
    },
    {
      q: 'Как устроены полные команды LLDB?',
      options: [
        'Объект, затем действие и параметры: breakpoint set --name main',
        'Действие, затем объект: set breakpoint main',
        'Одно слово на команду, как в GDB',
        'Только однобуквенные команды',
      ],
      correct: 0,
      explain:
        'Единая схема делает команды предсказуемыми: breakpoint list, breakpoint delete, watchpoint list.',
    },
    {
      q: 'Какие команды LLDB выполняют шаг без захода в вызываемую функцию, как next в GDB? Выберите все.',
      options: ['thread step-over', 'n', 'next', 'thread step-in', 'thread step-out'],
      correct: [0, 1, 2],
      explain:
        'n и next — псевдонимы thread step-over. step-in заходит внутрь функции, step-out выходит из неё.',
    },
    {
      q: 'Что выведет LLDB на команду v count, если int count = 4?',
      options: ['(int) count = 4', 'count = 4', '$1 = 4', '4'],
      correct: 0,
      explain:
        'LLDB показывает тип в скобках, затем имя и значение. Формат $1 = 4 — у print в GDB.',
    },
  ],
  exercises: [
    {
      title: 'Команды GDB → LLDB',
      difficulty: 'beginner',
      description: `
Переведите сеанс GDB в полные команды LLDB. На вход до конца ввода подаются команды GDB по одной в строке. Для каждой напечатайте перевод:

| GDB | LLDB |
| --- | --- |
| \`break ФУНКЦИЯ\` | \`breakpoint set --name ФУНКЦИЯ\` |
| \`break ФАЙЛ:СТРОКА\` | \`breakpoint set --file ФАЙЛ --line СТРОКА\` |
| \`break СТРОКА\` (только цифры) | \`breakpoint set --line СТРОКА\` |
| \`run\` | \`process launch\` |
| \`run < ФАЙЛ\` | \`process launch -i ФАЙЛ\` |
| \`next\`, \`step\`, \`finish\` | \`thread step-over\`, \`thread step-in\`, \`thread step-out\` |
| \`continue\` | \`process continue\` |
| \`bt\` | \`thread backtrace\` |
| \`frame N\` | \`frame select N\` |
| \`info locals\` | \`frame variable\` |
| \`info breakpoints\` | \`breakpoint list\` |
| \`delete N\` | \`breakpoint delete N\` |
| \`print ВЫРАЖЕНИЕ\` | \`expression -- ВЫРАЖЕНИЕ\` (выражение — весь остаток строки) |
| \`watch ИМЯ\` | \`watchpoint set variable ИМЯ\` |

Сокращения \`b\`, \`r\`, \`n\`, \`s\`, \`c\`, \`p\` означают \`break\`, \`run\`, \`next\`, \`step\`, \`continue\`, \`print\`. Для любой другой строки напечатайте \`неизвестная команда: СТРОКА\`. Пустые строки пропускайте.`,
      constraints: [
        'Не больше 50 строк, каждая — не длиннее 200 символов; слова разделены одним пробелом.',
      ],
      hints: [
        'Отделите первое слово: всё до первого пробела — команда, остальное — аргумент (может быть пустым).',
        'Сначала превратите сокращение в полное имя, затем сравнивайте с таблицей.',
        'Для break различайте три случая: в аргументе есть двоеточие (strchr), аргумент состоит только из цифр (strspn с "0123456789"), иначе — имя функции.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static const char *expand_alias(const char *command) {
    static const char *aliases[][2] = {
        {"b", "break"}, {"r", "run"}, {"n", "next"}, {"s", "step"}, {"c", "continue"}, {"p", "print"},
    };
    for (size_t i = 0; i < sizeof aliases / sizeof aliases[0]; i++) {
        if (strcmp(command, aliases[i][0]) == 0) {
            return aliases[i][1];
        }
    }
    return command;
}

int main(void) {
    static const char *simple[][2] = {
        {"next", "thread step-over"},        {"step", "thread step-in"},
        {"finish", "thread step-out"},       {"continue", "process continue"},
        {"bt", "thread backtrace"},          {"info locals", "frame variable"},
        {"info breakpoints", "breakpoint list"}, {"run", "process launch"},
    };
    char line[256];
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '\0') {
            continue;
        }
        char original[256];
        strcpy(original, line);
        char *space = strchr(line, ' ');
        const char *arg = "";
        if (space != NULL) {
            *space = '\0';
            arg = space + 1;
        }
        const char *command = expand_alias(line);
        char full[256];
        snprintf(full, sizeof full, "%s%s%s", command, arg[0] != '\0' ? " " : "", arg);
        int done = 0;
        for (size_t i = 0; i < sizeof simple / sizeof simple[0] && !done; i++) {
            if (strcmp(full, simple[i][0]) == 0) {
                puts(simple[i][1]);
                done = 1;
            }
        }
        if (done) {
            continue;
        }
        if (strcmp(command, "run") == 0 && strncmp(arg, "< ", 2) == 0) {
            printf("process launch -i %s\n", arg + 2);
        } else if (strcmp(command, "break") == 0 && arg[0] != '\0') {
            const char *colon = strchr(arg, ':');
            if (colon != NULL) {
                printf("breakpoint set --file %.*s --line %s\n", (int)(colon - arg), arg, colon + 1);
            } else if (strspn(arg, "0123456789") == strlen(arg)) {
                printf("breakpoint set --line %s\n", arg);
            } else {
                printf("breakpoint set --name %s\n", arg);
            }
        } else if (strcmp(command, "frame") == 0 && arg[0] != '\0') {
            printf("frame select %s\n", arg);
        } else if (strcmp(command, "delete") == 0 && arg[0] != '\0') {
            printf("breakpoint delete %s\n", arg);
        } else if (strcmp(command, "print") == 0 && arg[0] != '\0') {
            printf("expression -- %s\n", arg);
        } else if (strcmp(command, "watch") == 0 && arg[0] != '\0') {
            printf("watchpoint set variable %s\n", arg);
        } else {
            printf("неизвестная команда: %s\n", original);
        }
    }
    return 0;
}`,
      explanation: `
Перевод держится на двух шагах: раскрыть сокращение и сопоставить полную команду с таблицей. Команды без аргументов сравниваются целиком, команды с аргументом — по первому слову, после чего аргумент переносится в нужное место LLDB-команды.

У \`break\` три формы, и LLDB различает их явно параметрами \`--name\`, \`--file\`, \`--line\`. В GDB одна команда угадывает смысл аргумента — это короче, но в LLDB сразу видно, что именно задано. На практике в LLDB тоже пишут \`b main.c:12\`: псевдоним \`b\` в LLDB умеет разбирать запись в стиле GDB.`,
      examples: [
        {
          in: 'break main\nrun < in.txt\nnext\nprint total * 2\nbt\n',
          out: 'breakpoint set --name main\nprocess launch -i in.txt\nthread step-over\nexpression -- total * 2\nthread backtrace\n',
        },
        {
          in: 'b search.c:7\nr\ninfo locals\nc\n',
          out: 'breakpoint set --file search.c --line 7\nprocess launch\nframe variable\nprocess continue\n',
        },
      ],
      hidden: [
        { in: 'break 42\n', name: 'Номер строки' },
        { in: 's\nfinish\nn\n', name: 'Шаги' },
        { in: 'frame 2\ndelete 1\ninfo breakpoints\n', name: 'Кадры и точки' },
        { in: 'watch total\np arr[0]@4\n', name: 'Наблюдение и печать' },
        { in: 'list\ninfo registers\nquit\n', name: 'Неизвестные команды' },
        { in: 'break\nprint\n', name: 'Команды без аргумента' },
        { in: '\nrun\n\ncontinue\n', name: 'Пустые строки' },
        { in: 'b parse_number\nb 0\nb lib/v2/io.c:120\n', name: 'Три формы break' },
        { in: 'p -x\np node->next->value\n', name: 'Выражения' },
        { in: 'run in.txt\nnext 3\n', name: 'Неподдерживаемые аргументы' },
      ],
    },
    {
      title: 'Разбор frame variable',
      description: `
На вход до конца ввода подаётся вывод команды \`frame variable\` — строки вида \`(тип) имя = значение\`. Строки другого вида пропускайте.

Для каждой переменной напечатайте:
- \`имя: NULL\`, если тип оканчивается на \`*\`, а значение состоит из \`0x\` и одних нулей;
- \`имя: массив из N\`, если тип оканчивается на \`[N]\`;
- иначе \`имя: значение\`.

В конце напечатайте \`нулевых указателей: K\`.`,
      constraints: [
        'Не больше 50 строк, каждая — не длиннее 300 символов.',
        'Тип не содержит скобок ( ) и знака =.',
      ],
      hints: [
        'Тип — между ( и первой ). Имя — после ") " до " = ". Значение — остаток строки после " = ".',
        'Последний непробельный символ типа подскажет вид: * — указатель, ] — массив. Число элементов — между последней [ и ].',
        'Нулевой указатель: значение начинается с "0x", а strspn(value + 2, "0") == strlen(value + 2).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[320];
    int nulls = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        char *close = strchr(line, ')');
        char *equals = strstr(line, " = ");
        if (line[0] != '(' || close == NULL || equals == NULL || equals < close) {
            continue;
        }
        *close = '\0';
        *equals = '\0';
        char *type = line + 1;
        char *name = close + 1;
        while (*name == ' ') {
            name++;
        }
        const char *value = equals + 3;
        size_t type_length = strlen(type);
        while (type_length > 0 && type[type_length - 1] == ' ') {
            type[--type_length] = '\0';
        }
        char last = type_length > 0 ? type[type_length - 1] : '\0';
        if (last == '*' && strncmp(value, "0x", 2) == 0 && value[2] != '\0' &&
            strspn(value + 2, "0") == strlen(value + 2)) {
            printf("%s: NULL\n", name);
            nulls++;
        } else if (last == ']') {
            char *open = strrchr(type, '[');
            type[type_length - 1] = '\0';
            printf("%s: массив из %s\n", name, open != NULL ? open + 1 : "?");
        } else {
            printf("%s: %s\n", name, value);
        }
    }
    printf("нулевых указателей: %d\n", nulls);
    return 0;
}`,
      explanation: `
\`frame variable\` выводит каждую переменную с типом, и это не формальность: тип часто и есть подсказка. \`(char *) name = 0x0000000000000000\` — нулевой указатель, разыменование которого даст падение. \`(unsigned int) n = 4294967295\` — почти наверняка \`-1\`, превратившийся в беззнаковое.

Разбор опирается на структуру строки, а не на позиции символов: тип — в первых скобках, значение — после \` = \`. Значение массива LLDB печатает в скобках, поэтому знак \`=\` ищется **после** закрывающей скобки типа.`,
      examples: [
        {
          in: '(const int *) a = 0x000000016fdff2a0\n(int) n = 6\n(char *) name = 0x0000000000000000\n(int [3]) data = ([0] = 3, [1] = 1, [2] = 4)\n',
          out: 'a: 0x000000016fdff2a0\nn: 6\nname: NULL\ndata: массив из 3\nнулевых указателей: 1\n',
        },
        { in: '(double) ratio = 0.5\n', out: 'ratio: 0.5\nнулевых указателей: 0\n' },
      ],
      hidden: [
        { in: '', name: 'Пустой вывод' },
        { in: '(Node *) head = 0x0\n(Node *) tail = 0x00000000\n', name: 'Короткие нули' },
        { in: '(int *) p = 0x0000000000000010\n', name: 'Почти ноль' },
        { in: "(unsigned int) n = 4294967295\n(char) c = 'A'\n", name: 'Беззнаковое и символ' },
        {
          in: '(char [6]) word = "hello"\n(char *) s = 0x0000000100003f9e "hello"\n',
          name: 'Строки',
        },
        { in: 'Process 5120 stopped\n(lldb) v\n(int) x = -1\n', name: 'Посторонние строки' },
        {
          in: '(int **) grid = 0x0000000000000000\n(int *[4]) rows = ([0] = 0x0, [1] = 0x0)\n',
          name: 'Указатель на указатель и массив указателей',
        },
        { in: '(struct point) pt = (x = 1, y = 2)\n', name: 'Структура' },
        {
          in: '(FILE *) file = 0x0000000000000000\n(const char *) path = 0x0000000000000000\n(size_t) size = 0\n',
          name: 'Два нулевых',
        },
      ],
    },
    {
      title: 'Найди ошибку: двоичный поиск',
      difficulty: 'intermediate',
      bug: true,
      description: `
Программа читает отсортированный по возрастанию массив из \`n\` различных чисел и \`q\` запросов. Для каждого запроса она печатает индекс числа в массиве или \`-1\`, если числа нет.

Иногда программа не находит числа, которые в массиве есть. Остановите отладчик условной точкой в цикле поиска для такого запроса, посмотрите на \`low\` и \`high\` и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 1000; 1 ≤ q ≤ 100; числа от −10⁹ до 10⁹.'],
      hints: [
        'Поищите в массиве {2, 3, 5} число 5 вручную или в отладчике: какими будут low и high, когда цикл закончится?',
        'Граница high включительная: high = n - 1, и кандидат с индексом low == high ещё не проверен. Какое условие цикла это учитывает?',
      ],
      starter: String.raw`
#include <stdio.h>

static int search(const int *a, int n, int key) {
    int low = 0;
    int high = n - 1;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (a[mid] == key) {
            return mid;
        }
        if (a[mid] < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int a[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int key;
        scanf("%d", &key);
        printf("%d\n", search(a, n, key));
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

static int search(const int *a, int n, int key) {
    int low = 0;
    int high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (a[mid] == key) {
            return mid;
        }
        if (a[mid] < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int a[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int key;
        scanf("%d", &key);
        printf("%d\n", search(a, n, key));
    }
    return 0;
}`,
      explanation: `
Отрезок поиска \`[low, high]\` включает обе границы. Когда \`low == high\`, в нём остаётся ровно один кандидат, но условие \`low < high\` завершает цикл, не проверив его. Поэтому теряются элементы, к которым поиск приходит последним шагом: крайние значения и массив из одного элемента.

В отладчике это видно сразу: условная точка \`br s -l 7 -c 'key == 5'\`, затем \`v low high\` на каждой остановке. Последняя остановка показывает \`low = high = 2\`, а после неё функция возвращает \`-1\`. Условие \`low <= high\` соответствует включительной границе.`,
      examples: [
        { in: '3\n2 3 5\n3\n5 2 4\n', out: '2\n0\n-1\n' },
        { in: '1\n7\n1\n7\n', out: '0\n' },
      ],
      hidden: [
        { in: '6\n2 3 5 7 11 13\n6\n2 3 5 7 11 13\n', name: 'Все элементы' },
        { in: '6\n2 3 5 7 11 13\n4\n1 4 12 14\n', name: 'Отсутствующие' },
        { in: '2\n-5 5\n3\n-5 5 0\n', name: 'Два элемента' },
        { in: '1\n7\n2\n6 8\n', name: 'Один элемент, промахи' },
        {
          in: '5\n-1000000000 -1 0 1 1000000000\n5\n1000000000 -1000000000 0 2 -2\n',
          name: 'Крайние значения',
        },
        { in: '10\n1 2 3 4 5 6 7 8 9 10\n10\n1 2 3 4 5 6 7 8 9 10\n', name: 'Десять подряд' },
        { in: '7\n10 20 30 40 50 60 70\n3\n70 10 40\n', name: 'Края и середина' },
        { in: '4\n1 3 5 7\n4\n0 2 6 8\n', name: 'Между элементами' },
        { in: '3\n-3 -2 -1\n3\n-1 -3 -2\n', name: 'Отрицательные' },
      ],
    },
  ],
};
