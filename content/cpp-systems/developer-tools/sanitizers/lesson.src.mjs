export default {
  id: 'advanced-sanitizers',
  title: 'Отладочные сборки и санитайзеры',
  description:
    'Конфигурации сборки Debug, ASan + UBSan, TSan и Release, семейство санитайзеров и их совместимость, настройка через ASAN_OPTIONS и UBSAN_OPTIONS, санитайзеры в Make и CMake, защита выпускной сборки, assert и статический анализ.',
  moduleId: 'developer-tools',
  order: 11,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-lldb'],
  objectives: [
    'Выбирать набор сборок проекта и флаги для каждой',
    'Сочетать санитайзеры и включать их в Make и CMake',
    'Делать ошибки санитайзеров фатальными и читать отчёты UBSan',
    'Защищать выпускную сборку и пользоваться статическим анализом',
  ],
  tags: ['Санитайзеры', 'ASan', 'UBSan', 'Сборка', 'Статический анализ'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие санитайзеры нельзя включить в одной сборке?',
      options: [
        'AddressSanitizer и ThreadSanitizer',
        'AddressSanitizer и UBSan',
        'UBSan и ThreadSanitizer',
        'AddressSanitizer и LeakSanitizer',
      ],
      correct: 0,
      explain:
        'ASan, TSan и MSan каждый по-своему размечают всю память процесса. UBSan сочетается с любым из них, а LSan входит в ASan.',
    },
    {
      q: 'Что делает UBSan после найденной ошибки, если не указан -fno-sanitize-recover?',
      options: [
        'Печатает runtime error и продолжает выполнение',
        'Сразу завершает программу',
        'Исправляет значение и продолжает',
        'Ничего не печатает',
      ],
      correct: 0,
      explain:
        'Поэтому в тестах ошибки делают фатальными: -fno-sanitize-recover=all или UBSAN_OPTIONS=halt_on_error=1.',
    },
    {
      q: 'Зачем в санитайзерной сборке флаг -fno-omit-frame-pointer?',
      options: [
        'Чтобы санитайзер быстро и надёжно строил стек вызовов в отчёте',
        'Чтобы включить проверку границ массивов',
        'Чтобы ускорить программу',
        'Без него санитайзер не компилируется',
      ],
      correct: 0,
      explain:
        'Указатель кадра связывает кадры стека в цепочку. Без него стек приходится восстанавливать медленнее и не всегда точно.',
    },
    {
      q: 'Напишите флаг, который включает AddressSanitizer и UBSan одновременно.',
      answers: ['-fsanitize=address,undefined', '-fsanitize=undefined,address'],
      placeholder: 'Флаг',
      explain:
        'Санитайзеры перечисляются через запятую в одном флаге. Этот же флаг нужен и при линковке.',
    },
    {
      q: 'Какой санитайзер есть только в Clang?',
      options: ['MemorySanitizer', 'AddressSanitizer', 'UBSan', 'ThreadSanitizer'],
      correct: 0,
      explain:
        'MSan находит чтение неинициализированной памяти. В GCC для этого используют Valgrind.',
    },
    {
      q: 'Почему санитайзеры не включают в сборку для пользователей?',
      options: [
        'Они замедляют программу и увеличивают расход памяти, а их среда выполнения не рассчитана на защиту от атак',
        'Санитайзеры работают только в отладчике',
        'Санитайзеры запрещены лицензией',
        'Они меняют вывод программы',
      ],
      correct: 0,
      explain:
        'Для выпуска есть лёгкие защитные флаги: -D_FORTIFY_SOURCE=2 и -fstack-protector-strong.',
    },
    {
      q: 'Какие флаги подходят для защиты выпускной сборки? Выберите все.',
      options: ['-D_FORTIFY_SOURCE=2', '-fstack-protector-strong', '-fsanitize=address', '-O0'],
      correct: [0, 1],
      explain:
        'FORTIFY проверяет размеры буферов в функциях вроде memcpy, stack protector — перезапись стека. -O0 не защищает, а FORTIFY без оптимизаций даже не работает.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#define NDEBUG
#include <assert.h>
#include <stdio.h>

int main(void) {
    int count = 0;
    assert(count > 0);
    printf("count = %d\n", count);
    return 0;
}`,
      answers: ['count = 0'],
      placeholder: 'Вывод программы',
      explain:
        'NDEBUG определён до подключения assert.h, поэтому assert превращается в пустое выражение и ничего не проверяет.',
    },
    {
      q: 'Чем статический анализ (gcc -fanalyzer, clang --analyze) отличается от санитайзеров?',
      options: [
        'Он ищет ошибки в коде без запуска программы, в том числе на путях, которые тесты не выполнили',
        'Он работает быстрее санитайзеров при запуске программы',
        'Он находит только синтаксические ошибки',
        'Он заменяет предупреждения компилятора',
      ],
      correct: 0,
      explain:
        'Анализатор рассматривает возможные пути выполнения, но может давать ложные срабатывания. Санитайзеры точны, но видят только выполненный код.',
    },
  ],
  exercises: [
    {
      title: 'Совместимость санитайзеров',
      difficulty: 'beginner',
      description: `
Проверьте, можно ли собрать программу с указанным набором санитайзеров. В первой строке — число запросов \`q\`, далее \`q\` строк \`компилятор список\`: компилятор — \`gcc\` или \`clang\`, список — имена через запятую без пробелов.

Проверки выполняются по порядку, печатается результат первой сработавшей:
1. имя не из набора \`address\`, \`undefined\`, \`leak\`, \`thread\`, \`memory\` — \`неизвестный санитайзер: ИМЯ\` (первое такое имя);
2. \`memory\` с компилятором \`gcc\` — \`gcc не поддерживает memory\`;
3. несовместимые пары: \`address\` с \`thread\` или \`memory\`, \`thread\` с \`memory\`, \`leak\` с \`thread\` или \`memory\`. Напечатайте \`несовместимы: A и B\` для первой пары, где \`B\` — самое раннее имя списка, которое несовместимо с каким-то именем перед ним, а \`A\` — самое раннее из таких предшествующих;
4. иначе — \`можно: список\`, где повторы удалены, а порядок сохранён.`,
      constraints: ['1 ≤ q ≤ 20; в списке от 1 до 10 имён, каждое — не длиннее 20 символов.'],
      hints: [
        'Разбейте список через strtok(list, ","), сохраните имена в массив и сразу пропускайте повторы.',
        'Несовместимость удобно проверять функцией conflict(a, b), которая сравнивает пару в обоих порядках.',
        'Для правила 3 переберите j от 1 и для каждого j — i от 0 до j − 1; первая найденная пара и есть ответ.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static int known(const char *name) {
    static const char *names[] = {"address", "undefined", "leak", "thread", "memory"};
    for (int i = 0; i < 5; i++) {
        if (strcmp(name, names[i]) == 0) {
            return 1;
        }
    }
    return 0;
}

static int pair(const char *a, const char *b, const char *x, const char *y) {
    return (strcmp(a, x) == 0 && strcmp(b, y) == 0) || (strcmp(a, y) == 0 && strcmp(b, x) == 0);
}

static int conflict(const char *a, const char *b) {
    return pair(a, b, "address", "thread") || pair(a, b, "address", "memory") ||
           pair(a, b, "thread", "memory") || pair(a, b, "leak", "thread") ||
           pair(a, b, "leak", "memory");
}

int main(void) {
    int q;
    if (scanf("%d", &q) != 1) {
        return 0;
    }
    for (int query = 0; query < q; query++) {
        char compiler[16];
        char list[256];
        if (scanf("%15s %255s", compiler, list) != 2) {
            break;
        }
        char names[10][32];
        int count = 0;
        for (char *name = strtok(list, ","); name != NULL && count < 10; name = strtok(NULL, ",")) {
            int repeated = 0;
            for (int i = 0; i < count && !repeated; i++) {
                repeated = strcmp(names[i], name) == 0;
            }
            if (!repeated) {
                snprintf(names[count++], sizeof names[0], "%s", name);
            }
        }
        const char *unknown = NULL;
        int has_memory = 0;
        for (int i = 0; i < count; i++) {
            if (!known(names[i]) && unknown == NULL) {
                unknown = names[i];
            }
            if (strcmp(names[i], "memory") == 0) {
                has_memory = 1;
            }
        }
        if (unknown != NULL) {
            printf("неизвестный санитайзер: %s\n", unknown);
            continue;
        }
        if (has_memory && strcmp(compiler, "gcc") == 0) {
            printf("gcc не поддерживает memory\n");
            continue;
        }
        int found = 0;
        for (int j = 1; j < count && !found; j++) {
            for (int i = 0; i < j && !found; i++) {
                if (conflict(names[i], names[j])) {
                    printf("несовместимы: %s и %s\n", names[i], names[j]);
                    found = 1;
                }
            }
        }
        if (found) {
            continue;
        }
        printf("можно:");
        for (int i = 0; i < count; i++) {
            printf("%s%s", i == 0 ? " " : ",", names[i]);
        }
        putchar('\n');
    }
    return 0;
}`,
      explanation: `
Совместимость определяется тем, как санитайзер следит за памятью. ASan, TSan и MSan заводят каждый свою «теневую память» — разметку всего адресного пространства процесса, — и двух разметок одновременно быть не может. LSan использует механизмы ASan, поэтому вместе с ASan работает, а с TSan и MSan — нет. UBSan лишь вставляет проверки в отдельные операции и сочетается со всем.

Отсюда практическое правило: одна сборка \`-fsanitize=address,undefined\` для основных тестов и отдельная \`-fsanitize=thread\` для многопоточного кода. MSan требует Clang и пересборки **всех** библиотек с ним, поэтому используется реже.`,
      examples: [
        {
          in: '3\nclang address,undefined\ngcc address,thread\ngcc memory\n',
          out: 'можно: address,undefined\nнесовместимы: address и thread\ngcc не поддерживает memory\n',
        },
        { in: '1\ngcc adress\n', out: 'неизвестный санитайзер: adress\n' },
      ],
      hidden: [
        { in: '1\nclang memory,undefined\n', name: 'MSan в Clang' },
        { in: '1\ngcc undefined,undefined,address\n', name: 'Повторы' },
        { in: '1\nclang thread,leak\n', name: 'LSan и TSan' },
        { in: '1\ngcc address,leak,undefined\n', name: 'LSan с ASan' },
        { in: '1\nclang undefined,thread,memory,address\n', name: 'Первая несовместимая пара' },
        { in: '1\ngcc memory,thread\n', name: 'gcc и memory раньше пары' },
        { in: '1\nclang foo,memory,thread\n', name: 'Неизвестное раньше всего' },
        { in: '1\nclang thread\n', name: 'Только TSan' },
        {
          in: '4\ngcc leak\nclang leak,memory\ngcc undefined,thread\nclang address,undefined,leak,address\n',
          name: 'Несколько запросов',
        },
      ],
    },
    {
      title: 'Разбор отчёта UBSan',
      description: `
На вход до конца ввода подаётся вывод программы, собранной с UBSan. Сообщения об ошибках имеют вид

\`\`\`
файл:строка:столбец: runtime error: текст
\`\`\`

Остальные строки пропускайте. UBSan сообщает о каждом **месте** только один раз, поэтому повтор того же \`файл:строка:столбец\` тоже пропускайте.

Для каждого сообщения напечатайте \`файл:строка категория\`. Категория определяется по тексту:
- \`signed integer overflow\` — \`переполнение\`;
- \`shift exponent\` или \`left shift of\` — \`сдвиг\`;
- \`division by zero\` — \`деление на ноль\`;
- \`out of bounds for type\` — \`выход за границы\`;
- \`null pointer\` — \`нулевой указатель\`;
- \`misaligned address\` — \`невыровненный адрес\`;
- иначе — \`другое\`.

В конце напечатайте \`всего: N\` и для каждой встреченной категории в порядке первого появления строку \`категория: K\`.`,
      constraints: ['Не больше 100 строк, каждая — не длиннее 300 символов.'],
      hints: [
        'Найдите подстроку ": runtime error: " через strstr. Всё до неё — место, после — текст сообщения.',
        'Из места «файл:строка:столбец» для вывода отрежьте последнее двоеточие и столбец (strrchr).',
        'Для итогов храните массив названий категорий в порядке появления и счётчики к ним.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 320

static const char *category(const char *text) {
    if (strstr(text, "signed integer overflow") != NULL) {
        return "переполнение";
    }
    if (strstr(text, "shift exponent") != NULL || strstr(text, "left shift of") != NULL) {
        return "сдвиг";
    }
    if (strstr(text, "division by zero") != NULL) {
        return "деление на ноль";
    }
    if (strstr(text, "out of bounds for type") != NULL) {
        return "выход за границы";
    }
    if (strstr(text, "null pointer") != NULL) {
        return "нулевой указатель";
    }
    if (strstr(text, "misaligned address") != NULL) {
        return "невыровненный адрес";
    }
    return "другое";
}

int main(void) {
    static char seen[100][LINE];
    int seen_count = 0;
    const char *names[7];
    int counts[7] = {0};
    int kinds = 0;
    int total = 0;
    char line[LINE];
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        char *marker = strstr(line, ": runtime error: ");
        if (marker == NULL) {
            continue;
        }
        *marker = '\0';
        int repeated = 0;
        for (int i = 0; i < seen_count && !repeated; i++) {
            repeated = strcmp(seen[i], line) == 0;
        }
        if (repeated || seen_count >= 100) {
            continue;
        }
        strcpy(seen[seen_count++], line);
        const char *kind = category(marker + 17);
        char *column = strrchr(line, ':');
        if (column != NULL) {
            *column = '\0';
        }
        printf("%s %s\n", line, kind);
        total++;
        int index = 0;
        while (index < kinds && strcmp(names[index], kind) != 0) {
            index++;
        }
        if (index == kinds) {
            names[kinds++] = kind;
        }
        counts[index]++;
    }
    printf("всего: %d\n", total);
    for (int i = 0; i < kinds; i++) {
        printf("%s: %d\n", names[i], counts[i]);
    }
    return 0;
}`,
      explanation: `
Отчёт UBSan короче отчёта ASan: место и одна фраза о нарушенном правиле языка. По этой фразе сразу понятен класс ошибки, а значит, и способ исправления: переполнение — более широкий тип или проверка до операции, сдвиг — ограничение величины сдвига, выход за границы — проверка индекса.

Повторы одного места UBSan подавляет: ошибка в цикле на миллион итераций даст одно сообщение, а не миллион. Поэтому число сообщений — это число **мест** с ошибками, а не число срабатываний. Если ошибки сделаны фатальными (\`-fno-sanitize-recover=all\`), сообщение будет ровно одно — первое.`,
      examples: [
        {
          in: "main.c:7:17: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'\nmain.c:7:17: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'\nmain.c:12:9: runtime error: index 10 out of bounds for type 'int [10]'\n",
          out: 'main.c:7 переполнение\nmain.c:12 выход за границы\nвсего: 2\nпереполнение: 1\nвыход за границы: 1\n',
        },
        { in: 'всё хорошо\n42\n', out: 'всего: 0\n' },
      ],
      hidden: [
        {
          in: "bits.c:5:20: runtime error: shift exponent 32 is too large for 32-bit type 'unsigned int'\nbits.c:9:14: runtime error: left shift of negative value -1\n",
          name: 'Сдвиги',
        },
        { in: 'calc.c:20:13: runtime error: division by zero\n', name: 'Деление на ноль' },
        {
          in: "list.c:31:18: runtime error: member access within null pointer of type 'struct node'\nlist.c:40:5: runtime error: load of null pointer of type 'int'\n",
          name: 'Нулевые указатели',
        },
        {
          in: "net.c:8:12: runtime error: load of misaligned address 0x602000000011 for type 'int', which requires 4 byte alignment\n",
          name: 'Невыровненный адрес',
        },
        {
          in: 'x.c:3:10: runtime error: execution reached the end of a value-returning function without returning a value\n',
          name: 'Другое',
        },
        {
          in: 'SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior main.c:7:17\na.c:1:1: runtime error: signed integer overflow: 1 + 1\na.c:1:2: runtime error: signed integer overflow: 2 + 2\n',
          name: 'Разные столбцы одной строки',
        },
        {
          in: "src/stats.c:14:22: runtime error: signed integer overflow: 46341 * 46341 cannot be represented in type 'int'\nsrc/stats.c:30:9: runtime error: index -1 out of bounds for type 'int [8]'\nsrc/stats.c:14:22: runtime error: signed integer overflow: 46342 * 46342 cannot be represented in type 'int'\nsrc/io.c:3:1: runtime error: division by zero\n",
          name: 'Повтор между другими',
        },
        { in: '', name: 'Пустой вывод' },
        {
          in: '    #0 0x55d3 in main main.c:7\nmain.c:7:17: runtime error: signed integer overflow: 1 + 2147483647\n    #1 0x7f12 in __libc_start_main\n',
          name: 'Строки стека',
        },
      ],
    },
    {
      title: 'Найди ошибку: гистограмма',
      difficulty: 'intermediate',
      bug: true,
      description: `
Программа читает \`n\` оценок от 0 до 10 и печатает в одну строку, сколько раз встретилась каждая оценка: 11 чисел через пробел — для оценок 0, 1, …, 10.

В обычной сборке программа иногда выводит правильный ответ, а в сборке с AddressSanitizer падает с отчётом \`stack-buffer-overflow\`. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 1000; каждая оценка — целое от 0 до 10.'],
      hints: [
        'Сколько разных оценок бывает от 0 до 10 включительно? Сколько элементов в массиве counts?',
        'ASan указывает на строку с counts[grade]++ или на цикл печати — оба обращаются к элементу с индексом 10.',
      ],
      starter: String.raw`
#include <stdio.h>

int main(void) {
    int counts[10] = {0};
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int grade;
        scanf("%d", &grade);
        counts[grade]++;
    }
    for (int grade = 0; grade <= 10; grade++) {
        printf("%d%c", counts[grade], grade < 10 ? ' ' : '\n');
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int counts[11] = {0};
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int grade;
        scanf("%d", &grade);
        counts[grade]++;
    }
    for (int grade = 0; grade <= 10; grade++) {
        printf("%d%c", counts[grade], grade < 10 ? ' ' : '\n');
    }
    return 0;
}`,
      explanation: `
Оценок от 0 до 10 — одиннадцать, а массив объявлен на десять элементов. Элемент \`counts[10]\` лежит за концом массива — на стеке рядом с другими переменными функции. Запись туда портит соседние данные, а чтение возвращает случайное значение. Без санитайзера результат зависит от раскладки стека, компилятора и уровня оптимизации: программа может даже работать.

ASan размечает границы каждого массива на стеке и останавливает программу на первом же обращении за границу. Именно поэтому тесты прогоняют в санитайзерной сборке: ошибка, которая «иногда проявляется», становится ошибкой, которая проявляется всегда.`,
      examples: [
        { in: '5\n10 9 10 0 5\n', out: '1 0 0 0 0 1 0 0 0 1 2\n' },
        { in: '1\n3\n', out: '0 0 0 1 0 0 0 0 0 0 0\n' },
      ],
      hidden: [
        { in: '1\n10\n', name: 'Одна десятка' },
        { in: '1\n0\n', name: 'Один ноль' },
        { in: '11\n0 1 2 3 4 5 6 7 8 9 10\n', name: 'Все оценки' },
        { in: '6\n7 7 7 7 7 7\n', name: 'Одинаковые' },
        { in: '4\n10 10 10 10\n', name: 'Только десятки' },
        { in: '3\n9 8 9\n', name: 'Без десяток' },
        { in: '8\n5 4 5 6 5 4 10 0\n', name: 'Смешанные' },
        { in: '10\n1 2 1 2 1 2 1 2 1 2\n', name: 'Чередование' },
        { in: '2\n0 10\n', name: 'Крайние' },
      ],
    },
  ],
};
