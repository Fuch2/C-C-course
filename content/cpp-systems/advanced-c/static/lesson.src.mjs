const IDS_TOP = String.raw`
#include <stdio.h>
#include <string.h>

// ---- ids.h ----
void ids_next(const char *prefix, char *out, size_t size);   // записывает "префикс-N"
void ids_reset(const char *prefix);
int ids_total(void);

// ---- main.c ----
int main(void) {
    char command[16], prefix[16], id[32];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "new") == 0 && scanf("%15s", prefix) == 1) {
            ids_next(prefix, id, sizeof id);
            printf("%s\n", id);
        } else if (strcmp(command, "reset") == 0 && scanf("%15s", prefix) == 1) {
            ids_reset(prefix);
        } else if (strcmp(command, "total") == 0) {
            printf("%d\n", ids_total());
        }
    }
    return 0;
}

// ---- ids.c ----`;

const MONEY_FORMAT = String.raw`
    char digits[32];
    int len = 0;
    long long value = cents < 0 ? -cents : cents;
    long long whole = value / 100;
    do {
        if (len % 4 == 3) {
            digits[len++] = ' ';
        }
        digits[len++] = (char)('0' + whole % 10);
        whole /= 10;
    } while (whole > 0);
    int pos = 0;
    if (cents < 0) {
        out[pos++] = '-';
    }
    while (len > 0) {
        out[pos++] = digits[--len];
    }
    int rest = (int)(value % 100);
    out[pos++] = '.';
    out[pos++] = (char)('0' + rest / 10);
    out[pos++] = (char)('0' + rest % 10);
    out[pos] = '\0';`;

const RNG_TOP = String.raw`
#include <stdio.h>
#include <string.h>

// ---- rng.h ----
void rng_seed(unsigned long long seed);
unsigned rng_next(void);                    // число от 0 до 2^31 - 1
int rng_range(int low, int high);           // число от low до high включительно
void rng_shuffle(int *values, int count);

// ---- main.c ----
int main(void) {
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "seed") == 0) {
            unsigned long long seed;
            if (scanf("%llu", &seed) == 1) {
                rng_seed(seed);
            }
        } else if (strcmp(command, "next") == 0) {
            printf("%u\n", rng_next());
        } else if (strcmp(command, "range") == 0) {
            int low, high;
            if (scanf("%d %d", &low, &high) == 2) {
                printf("%d\n", rng_range(low, high));
            }
        } else if (strcmp(command, "shuffle") == 0) {
            int n, values[100];
            if (scanf("%d", &n) != 1 || n < 1 || n > 100) {
                break;
            }
            for (int i = 0; i < n; i++) {
                if (scanf("%d", &values[i]) != 1) {
                    return 0;
                }
            }
            rng_shuffle(values, n);
            for (int i = 0; i < n; i++) {
                printf(i + 1 < n ? "%d " : "%d\n", values[i]);
            }
        }
    }
    return 0;
}

// ---- rng.c ----`;

export default {
  id: 'advanced-static',
  title: 'static: скрытые функции и состояние модуля',
  description:
    'Два смысла static: внутреннее связывание функций и глобальных переменных и статическое время жизни локальных; конфликт имён вспомогательных функций; скрытое состояние модуля; счётчики и кэши в static переменных; константные инициализаторы; указатель на static буфер; static в заголовке и static inline; предупреждение о неиспользуемых функциях.',
  moduleId: 'advanced-c',
  order: 4,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-header-guards'],
  objectives: [
    'Скрывать вспомогательные функции и состояние модуля с помощью static',
    'Использовать static локальные переменные для счётчиков и кэшей',
    'Распознавать ошибку общего static буфера и проектировать интерфейс с буфером вызывающего',
    'Объяснять, почему static переменная в заголовке почти всегда ошибка',
  ],
  tags: ['static', 'Внутреннее связывание', 'Модуль', 'Кэш', 'Время жизни'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что означает static перед определением функции вне других функций?',
      options: [
        'Функция видна только в своём .c файле: у неё внутреннее связывание',
        'Функция сохраняет значения своих переменных между вызовами',
        'Функция выполняется один раз до main',
        'Функция не может вызывать другие функции',
      ],
      correct: 0,
      explain:
        'У функций static влияет только на видимость имени: линковщик не узнает о функции, и в другом файле может быть своя функция с тем же именем.',
    },
    {
      q: 'В файлах a.c и b.c определено по функции static int helper(void) с разными телами. Что будет при сборке gcc a.c b.c main.c?',
      options: [
        'Сборка пройдёт: каждая helper видна только в своём файле',
        'multiple definition of helper',
        'Ошибка компиляции b.c: redefinition of helper',
        'Будет вызываться та helper, чей файл указан первым',
      ],
      correct: 0,
      explain:
        'Внутреннее связывание делает имена независимыми: это две разные функции, и линковщик о них не знает.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int step(void) {
    static int value = 10;
    int local = 0;
    value += 5;
    local += 5;
    return value + local;
}

int main(void) {
    step();
    step();
    printf("%d\n", step());
    return 0;
}`,
      answers: ['30'],
      placeholder: 'Вывод программы',
      explain:
        'static value инициализируется один раз и после трёх вызовов равна 25, а обычная local каждый раз начинается с нуля и становится 5. Третий вызов возвращает 25 + 5 = 30.',
    },
    {
      q: 'В заголовке counter.h написано static int counter = 0;. Его подключают a.c и b.c. Функция из a.c увеличивает counter до 3, затем функция из b.c печатает counter. Что напечатается?',
      options: [
        '0 — у каждого файла своя переменная counter',
        '3 — переменная общая',
        'Ошибка линковки multiple definition',
        'Ошибка компиляции: static нельзя писать в заголовке',
      ],
      correct: 0,
      explain:
        'Заголовок вставляется в каждый файл, и static создаёт в каждой единице трансляции отдельный объект. Сборка проходит молча, а «общий» счётчик на деле не общий.',
    },
    {
      q: 'Какие инициализаторы допустимы для static переменной? Выберите все.',
      options: [
        'static int seconds = 24 * 60 * 60;',
        'static const char *name = "журнал";',
        'static int value = rand();',
        'static double ratio = 1.0 / 3;',
        'static int copy = seconds;  (где seconds — другая static переменная)',
      ],
      correct: [0, 1, 3],
      explain:
        'Значение должно быть известно до запуска программы: арифметика над константами и адрес строкового литерала подходят. Вызов функции и значение другой переменной — нет, даже если та тоже static.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

const char *label(int n) {
    static char buffer[16];
    snprintf(buffer, sizeof buffer, "№%d", n);
    return buffer;
}

int main(void) {
    const char *a = label(1);
    const char *b = label(2);
    printf("%s %s\n", a, b);
    return 0;
}`,
      answers: ['№2 №2'],
      placeholder: 'Вывод программы',
      explain:
        'Оба указателя ссылаются на один static буфер. После второго вызова в нём лежит «№2», поэтому обе строки одинаковы.',
    },
    {
      q: 'Чему равна static локальная переменная int hits; без инициализатора при первом вызове функции?',
      answers: ['0', 'нулю', 'ноль'],
      placeholder: 'Значение',
      explain:
        'Объекты со статическим временем жизни заполняются нулями до начала программы — в отличие от обычных локальных переменных, значение которых не определено.',
    },
    {
      q: 'Почему GCC предупреждает «defined but not used» для неиспользуемой static функции, но молчит о такой же функции без static?',
      options: [
        'static функцию могут вызвать только из того же файла, и компилятор видит, что никто этого не делает',
        'Функции без static компилятор не анализирует',
        'Предупреждение выдаётся только для функций с параметрами',
        'Функция без static автоматически вызывается из main',
      ],
      correct: 0,
      explain:
        'Для функции с внешним связыванием компилятор не знает, не вызовут ли её из другого файла. У static функции все возможные вызовы находятся в текущей единице трансляции.',
    },
  ],
  exercises: [
    {
      title: 'Генератор идентификаторов',
      difficulty: 'beginner',
      description: `
В заготовке — заголовок модуля идентификаторов и функция \`main\`, которая обрабатывает команды до конца ввода:
- \`new P\` — получить и напечатать новый идентификатор с префиксом \`P\`: \`P-1\`, \`P-2\`, … — у каждого префикса свой счётчик;
- \`reset P\` — сбросить счётчик префикса: следующий идентификатор снова будет \`P-1\`;
- \`total\` — напечатать, сколько идентификаторов выдано за всё время (сброс это число не уменьшает).

Напишите раздел \`ids.c\`. Всё состояние модуля и вспомогательные функции должны быть \`static\`: снаружи модуль доступен только через три функции из заголовка. Результат \`ids_next\` записывает в буфер вызывающего кода.`,
      constraints: [
        'Префиксы — от 1 до 15 латинских букв и цифр, различных префиксов не больше 50.',
        'Команд не больше 1000.',
      ],
      hints: [
        'Состояние: static char prefixes[50][16]; static int counters[50]; static int used; static int total;.',
        'Напишите static int find_or_add(const char *prefix): ищет префикс в таблице, а если его нет — добавляет со счётчиком 0 и возвращает индекс.',
        'ids_next увеличивает счётчик и total и пишет результат через snprintf(out, size, "%s-%d", prefix, counter).',
      ],
      starter: `${IDS_TOP}
// Напишите здесь состояние и функции модуля.
`,
      solution: String.raw`${IDS_TOP}
static char prefixes[50][16];
static int counters[50];
static int used = 0;
static int total = 0;

static int find_or_add(const char *prefix) {
    for (int i = 0; i < used; i++) {
        if (strcmp(prefixes[i], prefix) == 0) {
            return i;
        }
    }
    strcpy(prefixes[used], prefix);
    counters[used] = 0;
    return used++;
}

void ids_next(const char *prefix, char *out, size_t size) {
    int i = find_or_add(prefix);
    counters[i]++;
    total++;
    snprintf(out, size, "%s-%d", prefix, counters[i]);
}

void ids_reset(const char *prefix) {
    counters[find_or_add(prefix)] = 0;
}

int ids_total(void) {
    return total;
}`,
      explanation: `
Таблица префиксов и счётчики — внутреннее состояние модуля: \`static\` делает их невидимыми для других файлов, поэтому изменить счётчик можно только через \`ids_next\` и \`ids_reset\`. Вспомогательная \`find_or_add\` тоже \`static\` — её нет в заголовке, и она не должна столкнуться с одноимённой функцией другого модуля.

\`ids_next\` не возвращает указатель на свой буфер, а пишет в буфер вызывающего: так два идентификатора, полученные подряд, не затрут друг друга. \`ids_reset\` для ещё не встречавшегося префикса просто заводит его с нулевым счётчиком — результат тот же, что и без записи.`,
      examples: [
        {
          in: 'new user\nnew user\nnew order\nnew user\ntotal\n',
          out: 'user-1\nuser-2\norder-1\nuser-3\n4\n',
        },
        {
          in: 'new a\nreset a\nnew a\ntotal\n',
          out: 'a-1\na-1\n2\n',
          why: 'Сброс начинает нумерацию заново, но не уменьшает total.',
        },
      ],
      hidden: [
        { in: 'total\n', name: 'Пусто' },
        { in: 'reset ghost\nnew ghost\n', name: 'Сброс неизвестного префикса' },
        { in: 'new A\nnew a\nnew A\n', name: 'Регистр' },
        {
          in: 'new p1\nnew p2\nnew p3\nnew p1\nnew p2\nnew p1\ntotal\n',
          name: 'Несколько префиксов',
        },
        {
          in: 'new x\nnew x\nnew x\nnew x\nnew x\nnew x\nnew x\nnew x\nnew x\nnew x\nnew x\nnew x\n',
          name: 'Двузначные номера',
        },
        { in: 'new abcdefghijklmno\nnew abcdefghijklmno\n', name: 'Префикс из 15 символов' },
        { in: 'new a\nnew b\nreset a\nreset b\nnew b\nnew a\ntotal\n', name: 'Два сброса' },
        { in: 'new id\ntotal\nnew id\ntotal\nreset id\ntotal\n', name: 'total между командами' },
      ],
    },
    {
      title: 'Биномиальные коэффициенты с кэшем',
      description: `
Число сочетаний C(n, k) удовлетворяет правилу треугольника Паскаля:

\`\`\`
C(n, 0) = C(n, n) = 1,    C(n, k) = C(n − 1, k − 1) + C(n − 1, k)
\`\`\`

Прочитайте число запросов \`q\` и \`q\` пар \`n k\`. Для каждой напечатайте C(n, k) по модулю 1 000 000 007. В конце напечатайте \`вычислено: X\`, где X — число различных пар (n, k), значение которых функция **вычисляла**, а не брала из кэша, за всю работу программы.

Напишите рекурсивную функцию \`long long binom(int n, int k)\` с кэшем в \`static\` массивах **внутри функции**: при входе она проверяет, не вычислено ли значение раньше; если нет — вычисляет (базовый случай или сумма двух рекурсивных вызовов), запоминает и увеличивает счётчик. Кэш общий для всех запросов.`,
      constraints: ['1 ≤ q ≤ 20; 0 ≤ k ≤ n ≤ 500.'],
      hints: [
        'Внутри функции: static long long memo[501][501]; static unsigned char known[501][501];. Счётчик удобно сделать static глобальной переменной файла, чтобы main могла его напечатать.',
        'Порядок в binom: if (known[n][k]) return memo[n][k]; затем вычислить value, записать memo[n][k] = value, known[n][k] = 1, увеличить счётчик.',
        'Складывайте по модулю: (binom(n - 1, k - 1) + binom(n - 1, k)) % 1000000007 — оба слагаемых меньше модуля, переполнения нет.',
      ],
      solution: String.raw`
#include <stdio.h>

#define MOD 1000000007LL

static long long computed = 0;

long long binom(int n, int k) {
    static long long memo[501][501];
    static unsigned char known[501][501];
    if (known[n][k]) {
        return memo[n][k];
    }
    long long value;
    if (k == 0 || k == n) {
        value = 1;
    } else {
        value = (binom(n - 1, k - 1) + binom(n - 1, k)) % MOD;
    }
    memo[n][k] = value;
    known[n][k] = 1;
    computed++;
    return value;
}

int main(void) {
    int q;
    if (scanf("%d", &q) != 1) {
        return 0;
    }
    for (int i = 0; i < q; i++) {
        int n, k;
        if (scanf("%d %d", &n, &k) != 2) {
            return 0;
        }
        printf("%lld\n", binom(n, k));
    }
    printf("вычислено: %lld\n", computed);
    return 0;
}`,
      explanation: `
Массивы \`memo\` и \`known\` объявлены внутри \`binom\`, но со \`static\`: они создаются один раз до начала программы, заполнены нулями и сохраняют содержимое между вызовами — и между запросами. Поэтому второй запрос, пересекающийся с первым, вычисляет только недостающие пары.

Без кэша рекурсия для C(500, 250) делала бы порядка 10¹⁴⁹ вызовов. С кэшем каждая пара вычисляется один раз, и всех пар не больше 501 · 502 / 2. Отдельный массив \`known\` нужен потому, что по модулю значение могло бы оказаться и нулём — тогда проверка \`memo[n][k] == 0\` пересчитывала бы его снова.

Счётчик \`computed\` вынесен на уровень файла (тоже \`static\`), потому что его читает \`main\`: локальную \`static\` переменную видно только внутри её функции.`,
      examples: [
        { in: '2\n4 2\n5 2\n', out: '6\n10\nвычислено: 11\n' },
        {
          in: '1\n0 0\n',
          out: '1\nвычислено: 1\n',
          why: 'Базовый случай тоже вычисляется один раз.',
        },
      ],
      hidden: [
        { in: '1\n10 0\n', name: 'k = 0' },
        { in: '1\n10 10\n', name: 'k = n' },
        { in: '2\n6 3\n6 3\n', name: 'Повторный запрос' },
        { in: '3\n5 2\n4 2\n3 1\n', name: 'Всё уже в кэше' },
        { in: '1\n30 15\n', name: 'Средний размер' },
        { in: '1\n100 50\n', name: 'Больше модуля' },
        { in: '1\n500 250\n', name: 'Максимум' },
        { in: '4\n20 1\n20 19\n20 10\n21 10\n', name: 'Смешанные запросы' },
      ],
    },
    {
      title: 'Найди ошибку: общий буфер',
      bug: true,
      description: `
Программа печатает журнал переводов. Каждая строка ввода — две суммы в копейках: сколько было на счёте до перевода и сколько стало после. Для каждой строки нужно напечатать \`было -> стало\` в денежном формате: целая часть с пробелом между группами по три цифры, точка и две цифры копеек, у отрицательных сумм — минус: \`123456\` → \`1 234.56\`, \`-500\` → \`-5.00\`.

Программа печатает одну и ту же сумму дважды. Найдите причину и исправьте программу.`,
      constraints: ['Суммы по модулю не больше 10¹⁵ копеек; строк не больше 20.'],
      hints: [
        'Посмотрите, куда format_money записывает результат и сколько таких мест в памяти.',
        'Оба вызова возвращают указатель на один и тот же static массив. Передайте буфер параметром — void format_money(long long cents, char *out) — и заведите в main два массива.',
      ],
      starter: String.raw`
#include <stdio.h>

const char *format_money(long long cents) {
    static char out[32];
${MONEY_FORMAT}
    return out;
}

int main(void) {
    long long before, after;
    while (scanf("%lld %lld", &before, &after) == 2) {
        printf("%s -> %s\n", format_money(before), format_money(after));
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void format_money(long long cents, char *out) {
${MONEY_FORMAT}
}

int main(void) {
    long long before, after;
    while (scanf("%lld %lld", &before, &after) == 2) {
        char from[32], to[32];
        format_money(before, from);
        format_money(after, to);
        printf("%s -> %s\n", from, to);
    }
    return 0;
}`,
      explanation: `
\`format_money\` возвращает указатель на свой \`static\` массив — он переживает вызов, но существует в единственном экземпляре. Оба аргумента \`printf\` вычисляются до печати, поэтому к моменту вывода в массиве лежит результат того вызова, который выполнился последним, и оба \`%s\` печатают одну строку. Какой из вызовов последний, стандарт не определяет: GCC и Clang ошибаются по-разному.

Исправленная функция получает буфер от вызывающего кода. У каждого вызова теперь своя память, и функция к тому же не хранит скрытого состояния — её можно безопасно вызывать сколько угодно раз в одном выражении.`,
      examples: [
        { in: '123456 100000\n', out: '1 234.56 -> 1 000.00\n' },
        { in: '-500 0\n', out: '-5.00 -> 0.00\n' },
      ],
      hidden: [
        '5 7\n',
        '99 100\n',
        '100000000 99999999\n',
        '-123456789 123456789\n',
        '1000000000000000 -1000000000000000\n',
        '0 1\n1 0\n',
        '12345 54321\n67890 9876\n',
        '-1 -99999\n',
      ],
    },
    {
      title: 'Модуль случайных чисел',
      difficulty: 'advanced',
      description: `
В заготовке — заголовок модуля псевдослучайных чисел и функция \`main\`, которая обрабатывает команды:
- \`seed S\` — \`rng_seed(S)\` устанавливает состояние генератора равным \`S\`;
- \`next\` — печатает \`rng_next()\`;
- \`range L H\` — печатает \`rng_range(L, H)\`;
- \`shuffle n a₁ … aₙ\` — перемешивает массив \`rng_shuffle\` и печатает его.

Напишите раздел \`rng.c\`. Состояние генератора — одна \`static\` переменная типа \`unsigned long long\`; до первого \`seed\` она равна 1. Функции:
- \`rng_next\`: \`state = state · 6364136223846793005 + 1442695040888963407\` (вычисления в \`unsigned long long\`, переполнение — по модулю 2⁶⁴), результат — старшие 31 бит: \`state >> 33\`;
- \`rng_range(L, H)\`: \`L + rng_next() % (H − L + 1)\`;
- \`rng_shuffle\`: алгоритм Фишера — Йетса: для \`i\` от \`count − 1\` до 1 выбрать \`j = rng_next() % (i + 1)\` и поменять местами элементы \`i\` и \`j\`.`,
      constraints: [
        '0 ≤ S < 2⁶⁴; −10⁹ ≤ L ≤ H ≤ 10⁹, H − L < 10⁶; 1 ≤ n ≤ 100.',
        'Команд не больше 200.',
      ],
      hints: [
        'static unsigned long long state = 1; — инициализатор константный, так что это разрешено и выполнится один раз до main.',
        'Беззнаковая арифметика в C не переполняется, а заворачивается по модулю 2⁶⁴ — ровно то, что нужно генератору. Суффикс ULL у констант обязателен.',
        'В rng_range приведите разность к unsigned: (unsigned)(high - low + 1). В shuffle индекс j получайте как (int)(rng_next() % (unsigned)(i + 1)).',
      ],
      starter: `${RNG_TOP}
// Напишите здесь состояние и функции модуля.
`,
      solution: String.raw`${RNG_TOP}
static unsigned long long state = 1;

void rng_seed(unsigned long long seed) {
    state = seed;
}

unsigned rng_next(void) {
    state = state * 6364136223846793005ULL + 1442695040888963407ULL;
    return (unsigned)(state >> 33);
}

int rng_range(int low, int high) {
    return low + (int)(rng_next() % (unsigned)(high - low + 1));
}

void rng_shuffle(int *values, int count) {
    for (int i = count - 1; i > 0; i--) {
        int j = (int)(rng_next() % (unsigned)(i + 1));
        int tmp = values[i];
        values[i] = values[j];
        values[j] = tmp;
    }
}`,
      explanation: `
Генератор — классический линейный конгруэнтный: следующее состояние получается из предыдущего умножением и сложением по модулю 2⁶⁴. Младшие биты такого генератора плохо перемешаны, поэтому наружу отдаются старшие 31 бит.

Состояние — \`static\` переменная модуля: оно сохраняется между вызовами и недоступно другим файлам, так что \`main\` не может случайно испортить последовательность. Одна и та же затравка всегда даёт одну и ту же последовательность — поэтому генератор удобен в тестах и играх с повтором.

Цена такого устройства — генератор один на всю программу. Если две части программы будут брать из него числа, они повлияют друг на друга. Когда нужны независимые генераторы, состояние выносят в структуру и передают её в каждую функцию: \`rng_next(&gen)\`.`,
      examples: [
        { in: 'seed 42\nnext\nnext\nrange 1 6\n', out: '1220265334\n484179026\n5\n' },
        { in: 'next\nshuffle 5 1 2 3 4 5\n', out: '908834774\n2 3 5 1 4\n' },
      ],
      hidden: [
        { in: 'seed 0\nnext\nnext\nnext\n', name: 'Затравка 0' },
        { in: 'seed 18446744073709551615\nnext\nnext\n', name: 'Максимальная затравка' },
        { in: 'seed 7\nrange -10 10\nrange -10 10\nrange 5 5\n', name: 'Отрицательный диапазон' },
        { in: 'seed 1\nnext\nseed 1\nnext\n', name: 'Повтор затравки' },
        {
          in: 'seed 2024\nshuffle 10 1 2 3 4 5 6 7 8 9 10\n',
          name: 'Перемешивание десяти',
        },
        { in: 'shuffle 1 99\nnext\n', name: 'Один элемент' },
        {
          in: 'seed 123456789\nrange -1000000000 -999000001\nrange 0 999999\n',
          name: 'Большие границы',
        },
        {
          in: 'seed 5\nnext\nshuffle 3 7 8 9\nnext\nrange 1 100\n',
          name: 'Смешанные команды',
        },
      ],
    },
  ],
};
