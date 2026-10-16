const repeat = (n, f) => Array.from({ length: n }, (_, i) => f(i));

export default {
  id: 'c17-typedef',
  title: 'Синонимы типов typedef',
  description:
    'Короткие и говорящие имена типов: typedef для чисел, структур и перечислений, типы фиксированного размера из stdint.h, самоссылающиеся структуры и границы возможностей синонимов.',
  moduleId: 'c-fundamentals',
  order: 44,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['c17-enum'],
  objectives: [
    'Объявлять синонимы для простых типов, структур и перечислений',
    'Различать тег структуры и синоним, выбирать форму объявления',
    'Использовать int64_t, uint8_t и другие типы фиксированного размера',
    'Объявлять самоссылающуюся структуру и проходить цепочку узлов',
    'Понимать, что синоним не создаёт новый тип',
  ],
  tags: ['C17', 'typedef', 'Структуры'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef struct {
    int a;
    int b;
} Pair;

Pair swapped(Pair p) {
    Pair r = {p.b, p.a};
    return r;
}

int main(void) {
    Pair p = {3, 8};
    Pair q = swapped(p);
    q.a *= 10;
    printf("%d %d %d %d\n", p.a, p.b, q.a, q.b);
    return 0;
}`,
      answers: ['3 8 80 3'],
      placeholder: 'Вывод программы',
      explain:
        'swapped возвращает новую пару {8, 3}; q.a умножается на 10. Исходная p не меняется.',
    },
    {
      q: 'Что делает объявление typedef unsigned char Byte;?',
      options: [
        'Создаёт синоним Byte для типа unsigned char',
        'Создаёт новый тип, несовместимый с unsigned char',
        'Объявляет переменную Byte типа unsigned char',
        'Объявляет константу Byte',
      ],
      correct: 0,
      explain: 'typedef только даёт существующему типу ещё одно имя.',
    },
    {
      q: 'Дано объявление typedef struct point { int x; int y; } Point;. Какие объявления переменных корректны? Выберите все.',
      options: ['Point p;', 'struct point p;', 'struct Point p;', 'point p;'],
      correct: [0, 1],
      explain:
        'У типа два имени: struct point (через тег) и Point (синоним). struct Point и point без struct не объявлены.',
    },
    {
      q: 'Найдите ошибку.',
      code: String.raw`
struct {
    int x;
    int y;
} Vec;

Vec v = {1, 2};`,
      options: [
        'Нет слова typedef: Vec — это переменная, а не тип',
        'Структуре без тега нельзя давать имя',
        'Инициализация {1, 2} недопустима',
        'Ошибки нет',
      ],
      correct: 0,
      explain:
        'Без typedef конструкция объявляет переменную Vec безымянного структурного типа, и Vec v не компилируется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef struct node {
    int value;
    struct node *next;
} Node;

int main(void) {
    Node c = {3, NULL};
    Node b = {2, &c};
    Node a = {1, &b};
    a.next = &c;
    b.value = 20;
    int sum = 0;
    for (const Node *p = &a; p != NULL; p = p->next) {
        sum += p->value;
    }
    printf("%d\n", sum);
    return 0;
}`,
      answers: ['4'],
      placeholder: 'Вывод программы',
      explain: 'После a.next = &c цепочка идёт a → c, узел b пропущен: 1 + 3 = 4.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint8_t level = 250;
    level += 10;
    printf("%d %zu\n", level, sizeof(int64_t) + sizeof(uint8_t) + sizeof(int32_t));
    return 0;
}`,
      answers: ['4 13'],
      placeholder: 'Вывод программы',
      explain:
        'uint8_t хранит 0…255: 260 превращается в 260 − 256 = 4. Размеры 8 + 1 + 4 = 13 байт.',
    },
    {
      q: 'Почему в typedef struct node { int value; struct node *next; } Node; поле объявлено через struct node, а не через Node?',
      options: [
        'Синоним Node появляется только после закрывающей скобки, внутри объявления его ещё нет',
        'Указатели на синонимы запрещены',
        'Так короче',
        'Node внутри структуры означал бы копию узла',
      ],
      correct: 0,
      explain: 'Имя после } вводится последним. Тег struct node известен с начала объявления.',
    },
    {
      q: 'Объявлены typedef double Meters; typedef double Seconds; и функция double speed(Meters d, Seconds t). Что произойдёт при вызове speed(t, d), где аргументы перепутаны?',
      options: [
        'Программа скомпилируется без предупреждений и посчитает неправильный результат',
        'Ошибка компиляции: несовместимые типы',
        'Предупреждение компилятора о перепутанных типах',
        'Компилятор сам переставит аргументы',
      ],
      correct: 0,
      explain:
        'Оба синонима означают double, и для компилятора типы совпадают. Чтобы такие ошибки ловились, значения оборачивают в разные структуры.',
    },
  ],
  exercises: [
    {
      title: 'Продолжительность записи',
      description: `
Время в системе записи хранится в миллисекундах. Объявите \`typedef long long TimestampMs;\` и напишите:

- \`TimestampMs duration(TimestampMs start, TimestampMs end)\` — длительность записи;
- \`void print_duration(TimestampMs ms)\` — печать в формате \`часы:минуты:секунды.миллисекунды\`, где минуты и секунды — две цифры, миллисекунды — три: \`1:02:03.004\`.

Даны \`n\` записей \`start end\`. Для каждой выведите длительность, а последней строкой — суммарную длительность всех записей в том же формате.`,
      constraints: [
        '1 ≤ n ≤ 1000; 0 ≤ start ≤ end ≤ 10¹².',
        'Часы не ограничены сутками: 30 часов печатаются как 30:00:00.000.',
      ],
      hints: [
        'Разложите миллисекунды: ms % 1000 — миллисекунды, ms / 1000 % 60 — секунды, ms / 60000 % 60 — минуты, ms / 3600000 — часы.',
        'Формат: printf("%lld:%02lld:%02lld.%03lld\\n", …). Все части — long long, поэтому спецификатор %lld.',
      ],
      starter: String.raw`
#include <stdio.h>

typedef long long TimestampMs;

int main(void) {
    // Прочитайте записи, выведите длительности и их сумму.
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

typedef long long TimestampMs;

TimestampMs duration(TimestampMs start, TimestampMs end) {
    return end - start;
}

void print_duration(TimestampMs ms) {
    TimestampMs hours = ms / 3600000;
    TimestampMs minutes = ms / 60000 % 60;
    TimestampMs seconds = ms / 1000 % 60;
    TimestampMs millis = ms % 1000;
    printf("%lld:%02lld:%02lld.%03lld\n", hours, minutes, seconds, millis);
}

int main(void) {
    int n;
    scanf("%d", &n);
    TimestampMs total = 0;
    for (int i = 0; i < n; i++) {
        TimestampMs start, end;
        scanf("%lld %lld", &start, &end);
        TimestampMs d = duration(start, end);
        print_duration(d);
        total += d;
    }
    print_duration(total);
    return 0;
}`,
      explanation: `
Синоним \`TimestampMs\` показывает, что число — момент времени в миллисекундах, а не, скажем, счётчик кадров. Для компилятора это по-прежнему \`long long\`, поэтому \`scanf\` и \`printf\` используют \`%lld\`.

Разбор времени — цепочка делений: сначала из миллисекунд выделяются целые секунды, минуты, часы, а остатки от деления дают «хвосты». Часы берутся без остатка, потому что сутками они не ограничены.

Сумма длительностей может дойти до 1000 · 10¹² = 10¹⁵ — для \`int\` это слишком много, а \`long long\` вмещает её с запасом. Ширина \`%02lld\` и \`%03lld\` дополняет числа нулями слева.`,
      examples: [
        { in: '2\n1000 1250\n0 3723004', out: '0:00:00.250\n1:02:03.004\n1:02:03.254\n' },
        { in: '1\n5 5', out: '0:00:00.000\n0:00:00.000\n' },
      ],
      hidden: [
        '1\n0 1000000000000',
        '3\n0 59999\n0 60000\n0 3599999',
        '2\n999999999999 1000000000000\n123 456',
        '1\n0 108000000',
        `500\n${repeat(500, (i) => `${i * 1000} ${i * 1000 + 999000000000 - i}`).join('\n')}`,
        '2\n0 86399999\n0 86400000',
      ],
    },
    {
      title: 'Ближайшая точка',
      description: `
Объявите \`typedef struct { int id; int x; int y; } Point;\`. Даны \`n\` точек. Найдите точку, ближайшую к началу координат, то есть с минимальным \`x² + y²\`. Если таких несколько, выберите точку с меньшим \`id\`.

Выведите \`id\` найденной точки и квадрат её расстояния до начала координат.

**Ввод:** \`n\`, затем \`n\` строк \`id x y\`.`,
      constraints: ['1 ≤ n ≤ 1000; 0 ≤ id ≤ 10⁶, все id различны; |x|, |y| ≤ 10⁹.'],
      hints: [
        'x² при |x| = 10⁹ равно 10¹⁸ — в int не помещается. Считайте (long long)p.x * p.x.',
        'Напишите long long dist2(const Point *p) и функцию сравнения с учётом id при равенстве.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef struct {
    int id;
    int x;
    int y;
} Point;

long long dist2(const Point *p) {
    return (long long)p->x * p->x + (long long)p->y * p->y;
}

int closer(const Point *a, const Point *b) {
    long long da = dist2(a);
    long long db = dist2(b);
    if (da != db) {
        return da < db;
    }
    return a->id < b->id;
}

int main(void) {
    Point points[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d %d %d", &points[i].id, &points[i].x, &points[i].y);
    }
    const Point *best = &points[0];
    for (int i = 1; i < n; i++) {
        if (closer(&points[i], best)) {
            best = &points[i];
        }
    }
    printf("%d %lld\n", best->id, dist2(best));
    return 0;
}`,
      explanation: `
Синоним \`Point\` позволяет писать \`const Point *\` вместо \`const struct … *\` во всех функциях.

Квадрат расстояния сравнивают вместо самого расстояния: корень не нужен для сравнения и вносил бы погрешность дробных чисел. Но квадрат координаты 10⁹ — это 10¹⁸, а сумма двух квадратов — 2 · 10¹⁸. Это больше, чем вмещает \`int\`, но меньше предела \`long long\` (≈ 9.2 · 10¹⁸). Приведение \`(long long)p->x * p->x\` выполняет умножение уже в 64 битах.

Правило выбора при равенстве вынесено в \`closer\`: тот же приём, что в задаче «Рейтинг» прошлого урока.`,
      examples: [
        { in: '3\n10 3 4\n20 1 1\n30 0 5', out: '20 2\n' },
        {
          in: '2\n8 1 0\n3 0 1',
          out: '3 1\n',
          why: 'Обе точки на расстоянии 1, выбирается меньший id.',
        },
      ],
      hidden: [
        '1\n5 -1000000000 1000000000',
        '3\n1 1000000000 0\n2 0 -1000000000\n3 999999999 999999999',
        '4\n100 0 0\n50 0 0\n75 1 1\n25 -1 0',
        '2\n7 -3 -4\n6 5 0',
        `600\n${repeat(600, (i) => `${(i * 7919) % 1000003} ${((i * 37) % 2001) - 1000} ${((i * 91) % 2001) - 1000}`).join('\n')}`,
        '3\n9 0 0\n3 0 0\n6 0 0',
      ],
    },
    {
      title: 'Сумма дробей',
      description: `
Объявите тип \`typedef struct { long long num; long long den; } Fraction;\` — дробь с числителем \`num\` и знаменателем \`den\`. Напишите функции:

- \`Fraction reduce(Fraction f)\` — сокращает дробь и делает знаменатель положительным;
- \`Fraction add(Fraction a, Fraction b)\` — сумма двух дробей в несократимом виде.

Даны \`n\` дробей. Выведите их сумму в виде \`p/q\` — несократимую, с \`q > 0\`. Ноль выводится как \`0/1\`.

**Ввод:** \`n\`, затем \`n\` дробей в формате \`p/q\`.`,
      constraints: ['1 ≤ n ≤ 8; |p| ≤ 1000; 1 ≤ |q| ≤ 50.'],
      hints: [
        'Сумма: a/b + c/d = (a·d + c·b) / (b·d). Сразу после сложения сократите результат.',
        'Наибольший общий делитель — алгоритм Евклида: пока b ≠ 0, (a, b) = (b, a % b). Работайте с модулями чисел.',
        'Чтение дроби: scanf("%lld/%lld", &f.num, &f.den). Если знаменатель отрицателен, умножьте числитель и знаменатель на −1.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef struct {
    long long num;
    long long den;
} Fraction;

long long gcd(long long a, long long b) {
    if (a < 0) a = -a;
    if (b < 0) b = -b;
    while (b != 0) {
        long long r = a % b;
        a = b;
        b = r;
    }
    return a;
}

Fraction reduce(Fraction f) {
    if (f.den < 0) {
        f.num = -f.num;
        f.den = -f.den;
    }
    long long g = gcd(f.num, f.den);
    f.num /= g;
    f.den /= g;
    return f;
}

Fraction add(Fraction a, Fraction b) {
    Fraction sum = {a.num * b.den + b.num * a.den, a.den * b.den};
    return reduce(sum);
}

int main(void) {
    int n;
    scanf("%d", &n);
    Fraction total = {0, 1};
    for (int i = 0; i < n; i++) {
        Fraction f;
        scanf("%lld/%lld", &f.num, &f.den);
        total = add(total, reduce(f));
    }
    printf("%lld/%lld\n", total.num, total.den);
    return 0;
}`,
      explanation: `
Тип \`Fraction\` объединяет два числа, которые по отдельности не имеют смысла. Функции \`reduce\` и \`add\` принимают и возвращают дроби по значению — как будто это встроенный числовой тип. Так в C описывают собственную «арифметику»: комплексные числа, векторы, деньги.

Несократимый вид однозначен, поэтому его удобно сравнивать с ответом: дробь сокращается на НОД числителя и знаменателя, а знак переносится в числитель. Для нуля \`gcd(0, q) = q\`, и дробь превращается в \`0/1\` без отдельной проверки.

Сокращение после каждого сложения держит числа маленькими. Знаменатель суммы не превышает НОК всех знаменателей, а для восьми чисел до 50 это меньше 1.3 · 10¹², поэтому промежуточные произведения помещаются в \`long long\`.`,
      examples: [
        { in: '2\n1/2 1/3', out: '5/6\n' },
        { in: '3\n1/4 1/4 -1/2', out: '0/1\n' },
      ],
      hidden: [
        '1\n6/4',
        '1\n3/-9',
        '2\n-1/3 -1/6',
        '2\n7/1 -2/1',
        '4\n1/2 1/2 1/2 1/2',
        '8\n1000/47 -999/43 1000/41 -1/37 1000/31 999/29 -1000/23 1/19',
        '8\n1/1 1/2 1/3 1/4 1/5 1/6 1/7 1/8',
        '3\n0/5 0/-7 0/1',
      ],
    },
    {
      title: 'Цепочка узлов',
      description: `
Узлы хранятся в массиве \`Node nodes[n]\` типа

\`\`\`c
typedef struct node {
    int value;
    struct node *next;
} Node;
\`\`\`

Для каждого узла дано значение и номер следующего узла в цепочке (\`-1\` — конец). Свяжите узлы указателями \`next\` (\`&nodes[j]\` или \`NULL\`), затем пройдите цепочку от узла \`start\` **только по указателям** и выведите значения через пробел, а на следующей строке — длину цепочки и сумму значений.

**Ввод:** \`n\`; \`n\` значений; \`n\` номеров следующих узлов; номер \`start\`.`,
      constraints: [
        '1 ≤ n ≤ 1000; значения по модулю не больше 10⁶.',
        'Номера следующих узлов от −1 до n − 1; цепочка от start не содержит циклов.',
      ],
      hints: [
        'Сначала прочитайте все значения, затем номера: nodes[i].next = (j == -1) ? NULL : &nodes[j];',
        'Проход: for (const Node *p = &nodes[start]; p != NULL; p = p->next).',
        'Сумма может достигать 10⁹ — используйте long long.',
      ],
      starter: String.raw`
#include <stdio.h>

typedef struct node {
    int value;
    struct node *next;
} Node;

int main(void) {
    Node nodes[1000];
    // Прочитайте узлы, свяжите их и пройдите цепочку от start.
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

typedef struct node {
    int value;
    struct node *next;
} Node;

int main(void) {
    Node nodes[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &nodes[i].value);
    }
    for (int i = 0; i < n; i++) {
        int j;
        scanf("%d", &j);
        nodes[i].next = (j == -1) ? NULL : &nodes[j];
    }
    int start;
    scanf("%d", &start);
    int length = 0;
    long long sum = 0;
    for (const Node *p = &nodes[start]; p != NULL; p = p->next) {
        printf(length > 0 ? " %d" : "%d", p->value);
        length++;
        sum += p->value;
    }
    printf("\n%d %lld\n", length, sum);
    return 0;
}`,
      explanation: `
После связывания номера больше не нужны: каждый узел сам знает, где лежит следующий. Цикл \`p = p->next\` переходит по адресам и останавливается на \`NULL\` — так же устроен проход по связному списку.

Порядок узлов в цепочке не совпадает с порядком в массиве: можно начать с середины, перепрыгнуть назад, пропустить узлы. Именно поэтому связные структуры позволяют вставлять и удалять элементы без сдвига остальных — достаточно поменять пару указателей.

Указатель на узел \`&nodes[j]\` остаётся корректным, пока жив массив \`nodes\`. В модуле «Память и указатели» узлы будут создаваться динамически, и следить за временем жизни станет главной задачей.`,
      examples: [
        { in: '4\n10 20 30 40\n2 -1 3 1\n0', out: '10 30 40 20\n4 100\n' },
        { in: '3\n5 6 7\n-1 0 1\n1', out: '6 5\n2 11\n' },
      ],
      hidden: [
        '1\n-7\n-1\n0',
        '3\n1 2 3\n1 2 -1\n2',
        '5\n1 2 3 4 5\n-1 0 1 2 3\n4',
        '6\n1000000 1000000 1000000 -1000000 1000000 1000000\n1 2 3 4 5 -1\n0',
        `1000\n${repeat(1000, (i) => (i % 2 ? -i : i)).join(' ')}\n${repeat(1000, (i) => (i === 0 ? -1 : i - 1)).join(' ')}\n999`,
        `1000\n${repeat(1000, () => 1000000).join(' ')}\n${repeat(1000, (i) => (i + 2 < 1000 ? i + 2 : -1)).join(' ')}\n1`,
      ],
    },
  ],
};
