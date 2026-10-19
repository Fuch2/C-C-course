const RATIONAL_HEADER = String.raw`
#include <stdio.h>

// ---- rational.h ----
typedef struct {
    long long num;      // числитель
    long long den;      // знаменатель: всегда > 0, дробь несократима
} Rational;

Rational rational_make(long long num, long long den);
Rational rational_add(Rational a, Rational b);
Rational rational_sub(Rational a, Rational b);
Rational rational_mul(Rational a, Rational b);
Rational rational_div(Rational a, Rational b);
void rational_print(Rational r);

// ---- main.c ----
int main(void) {
    long long a, b, c, d;
    char op;
    while (scanf("%lld/%lld %c %lld/%lld", &a, &b, &op, &c, &d) == 5) {
        Rational x = rational_make(a, b);
        Rational y = rational_make(c, d);
        if (op == '/' && y.num == 0) {
            printf("деление на ноль\n");
            continue;
        }
        Rational r = op == '+'   ? rational_add(x, y)
                     : op == '-' ? rational_sub(x, y)
                     : op == '*' ? rational_mul(x, y)
                                 : rational_div(x, y);
        rational_print(r);
        putchar('\n');
    }
    return 0;
}

// ---- rational.c ----`;

const QUEUE_HEADER = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ---- queue.h ----
typedef struct Queue Queue;

Queue *queue_create(void);
void queue_destroy(Queue *q);
int queue_push(Queue *q, int value);         // 1 — успех, 0 — не хватило памяти
int queue_pop(Queue *q, int *out);           // 1 — успех, 0 — очередь пуста
int queue_front(const Queue *q, int *out);   // 1 — успех, 0 — очередь пуста
size_t queue_size(const Queue *q);
size_t queue_capacity(const Queue *q);

// ---- main.c ----
int main(void) {
    Queue *q = queue_create();
    if (q == NULL) {
        return 1;
    }
    char command[16];
    while (scanf("%15s", command) == 1) {
        int value;
        if (strcmp(command, "push") == 0 && scanf("%d", &value) == 1) {
            if (!queue_push(q, value)) {
                break;
            }
        } else if (strcmp(command, "pop") == 0) {
            if (queue_pop(q, &value)) {
                printf("%d\n", value);
            } else {
                printf("пусто\n");
            }
        } else if (strcmp(command, "front") == 0) {
            if (queue_front(q, &value)) {
                printf("%d\n", value);
            } else {
                printf("пусто\n");
            }
        } else if (strcmp(command, "size") == 0) {
            printf("%zu\n", queue_size(q));
        } else if (strcmp(command, "cap") == 0) {
            printf("%zu\n", queue_capacity(q));
        }
    }
    queue_destroy(q);
    return 0;
}

// ---- queue.c ----`;

const BOARD_MAIN = String.raw`
// ---- main.c ----
int main(void) {
    Leaderboard *board = board_create();
    if (board == NULL) {
        return 1;
    }
    char command[16], name[32];
    int points, k;
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "add") == 0 && scanf("%31s %d", name, &points) == 2) {
            if (!board_add(board, name, points)) {
                break;
            }
        } else if (strcmp(command, "score") == 0 && scanf("%31s", name) == 1) {
            printf("%s: %d\n", name, board_score(board, name));
        } else if (strcmp(command, "top") == 0 && scanf("%d", &k) == 1) {
            board_print_top(board, k);
        } else if (strcmp(command, "count") == 0) {
            printf("%zu\n", board_count(board));
        }
    }
    board_destroy(board);
    return 0;
}`;

export default {
  id: 'advanced-headers',
  title: 'Заголовочные файлы: интерфейс модуля',
  description:
    'Заголовок как интерфейс модуля и #include как вставка текста; кавычки и угловые скобки; что кладут в заголовок и почему туда не кладут определения; реализация подключает свой заголовок; самодостаточные заголовки; неполные и непрозрачные типы; префиксы имён.',
  moduleId: 'advanced-c',
  order: 2,
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  prerequisites: ['advanced-translation-units'],
  objectives: [
    'Разделять модуль на заголовок и реализацию',
    'Решать, что можно положить в заголовок, а что нельзя',
    'Писать самодостаточные заголовки и подключать свой заголовок в реализации',
    'Скрывать устройство структуры за непрозрачным типом',
  ],
  tags: ['Заголовок', '#include', 'Интерфейс', 'Неполный тип', 'Непрозрачный тип'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что делает директива #include "stats.h"?',
      options: [
        'Вставляет текст файла stats.h на место директивы',
        'Подключает к программе скомпилированный код модуля stats',
        'Сообщает линковщику, где искать функции модуля',
        'Компилирует stats.c вместе с текущим файлом',
      ],
      correct: 0,
      explain:
        'Препроцессор буквально подставляет содержимое файла. Код функций в заголовке нет — его приносит stats.c, переданный в команду сборки.',
    },
    {
      q: 'Что можно поместить в заголовок, который подключают несколько .c файлов? Выберите все.',
      options: [
        'Прототип int stats_max(const int *values, int count);',
        'Определение struct Point { int x, y; };',
        'Определение переменной int counter = 0;',
        'typedef unsigned long long u64;',
        'Функцию с телом int twice(int x) { return 2 * x; }',
      ],
      correct: [0, 1, 3],
      explain:
        'Объявления и описания типов не создают ни кода, ни памяти, их можно повторять в каждом файле. Определения переменной и функции попадут в каждый объектный файл — линковщик сообщит multiple definition.',
    },
    {
      q: 'Зачем stats.c подключает собственный заголовок stats.h?',
      options: [
        'Чтобы компилятор сверил каждое определение с объявлением из заголовка',
        'Без этого линковщик не найдёт функции модуля',
        'Это требование синтаксиса: .c файл без своего заголовка не компилируется',
        'Чтобы функции модуля стали видны только внутри stats.c',
      ],
      correct: 0,
      explain:
        'Если определение разойдётся с прототипом, при сборке stats.c появится ошибка conflicting types. Без этого include несовпадение обнаружится только как странное поведение программы.',
    },
    {
      q: 'Какие операции допустимы в файле, который видит только typedef struct Stack Stack; без определения структуры? Выберите все.',
      options: [
        'Объявить указатель Stack *s;',
        'Передать указатель в функцию stack_push(s, 5)',
        'Создать переменную Stack local;',
        'Вычислить sizeof(Stack)',
        'Прочитать поле s->size',
      ],
      correct: [0, 1],
      explain:
        'struct Stack — неполный тип: размер и поля неизвестны. Указатель на неполный тип можно хранить и передавать, а создавать объекты и обращаться к полям нельзя.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

// ---- score.h ----
void score_add(int points);
int score_get(void);

// ---- main.c ----
int main(void) {
    score_add(10);
    score_add(score_get() * 2);
    printf("%d\n", score_get());
    return 0;
}

// ---- score.c ----
int score = 0;

void score_add(int points) {
    score += points;
}

int score_get(void) {
    return score;
}`,
      answers: ['30'],
      placeholder: 'Вывод программы',
      explain:
        'После первого вызова счёт 10, затем добавляется 10 * 2 = 20, итого 30. main знает функции модуля только по прототипам из раздела score.h.',
    },
    {
      q: 'Заголовок buffer.h объявляет size_t buffer_used(void); и ничего не подключает. Файл a.c подключает сначала <stdio.h>, потом buffer.h, и компилируется. Файл b.c подключает только buffer.h и не компилируется. В чём ошибка?',
      options: [
        'buffer.h не самодостаточен: в нём нужен #include <stddef.h>',
        'b.c должен подключать buffer.h в угловых скобках',
        'В b.c нужно добавить определение size_t',
        'Тип size_t доступен только в файлах, где есть main',
      ],
      correct: 0,
      explain:
        'a.c работает случайно: size_t пришёл из stdio.h. Заголовок должен сам подключать всё, что использует. Проверка — подключать свой заголовок первым в его .c файле.',
    },
    {
      q: 'Как подключить свой заголовок config.h, лежащий рядом с main.c?',
      answers: ['#include "config.h"'],
      placeholder: 'Директива',
      explain:
        'Кавычки: поиск начинается с каталога текущего файла. Угловые скобки предназначены для стандартных и сторонних библиотек.',
    },
    {
      q: 'Почему в C к внешним именам модуля добавляют префикс, например stack_push вместо push?',
      options: [
        'Все внешние имена программы и библиотек находятся в одном общем пространстве; одинаковые имена дадут multiple definition',
        'Компилятор требует, чтобы имя функции начиналось с имени файла',
        'Префикс ускоряет вызов функции',
        'Без префикса функция не видна из других файлов',
      ],
      correct: 0,
      explain:
        'В C нет пространств имён. Функция init в двух модулях — конфликт при линковке, поэтому имена делают уникальными префиксом модуля.',
    },
  ],
  exercises: [
    {
      title: 'Модуль рациональных чисел',
      difficulty: 'beginner',
      description: `
В заготовке есть заголовок модуля рациональных чисел и функция \`main\`, которая им пользуется. Напишите реализацию модуля — раздел \`rational.c\`.

Структура \`Rational\` открыта, но у неё есть инвариант: **знаменатель положителен, а дробь несократима**. Его поддерживают все функции модуля:
- \`rational_make(num, den)\` создаёт дробь \`num/den\` (\`den ≠ 0\`): переносит знак в числитель и сокращает на наибольший общий делитель; нулевая дробь — \`0/1\`;
- \`rational_add\`, \`rational_sub\`, \`rational_mul\`, \`rational_div\` возвращают результат в той же форме (делитель в \`rational_div\` не равен нулю — это проверяет \`main\`);
- \`rational_print\` печатает дробь как \`num/den\`, а при знаменателе 1 — только числитель, без перевода строки.

Каждая строка ввода — выражение \`a/b op c/d\`; программа печатает результат.`,
      constraints: [
        'Числители и знаменатели по модулю не больше 10⁶, знаменатели не равны нулю.',
        'Операции: + - * /.',
      ],
      hints: [
        'Напишите вспомогательную функцию gcd по алгоритму Евклида для неотрицательных чисел и вызывайте её из rational_make.',
        'Все арифметические функции сводятся к rational_make: a/b + c/d = rational_make(a*d + c*b, b*d), a/b ÷ c/d = rational_make(a*d, b*c).',
        'В rational_make: если den < 0, смените знаки обоих чисел; затем разделите оба на gcd(|num|, den). Для num = 0 получится 0/1.',
      ],
      starter: `${RATIONAL_HEADER}
// Напишите здесь функции модуля.
`,
      solution: String.raw`${RATIONAL_HEADER}
long long gcd(long long a, long long b) {
    while (b != 0) {
        long long r = a % b;
        a = b;
        b = r;
    }
    return a;
}

Rational rational_make(long long num, long long den) {
    if (den < 0) {
        num = -num;
        den = -den;
    }
    long long g = gcd(num < 0 ? -num : num, den);
    Rational r = {num / g, den / g};
    return r;
}

Rational rational_add(Rational a, Rational b) {
    return rational_make(a.num * b.den + b.num * a.den, a.den * b.den);
}

Rational rational_sub(Rational a, Rational b) {
    return rational_make(a.num * b.den - b.num * a.den, a.den * b.den);
}

Rational rational_mul(Rational a, Rational b) {
    return rational_make(a.num * b.num, a.den * b.den);
}

Rational rational_div(Rational a, Rational b) {
    return rational_make(a.num * b.den, a.den * b.num);
}

void rational_print(Rational r) {
    if (r.den == 1) {
        printf("%lld", r.num);
    } else {
        printf("%lld/%lld", r.num, r.den);
    }
}`,
      explanation: `
Инвариант сосредоточен в одной функции: \`rational_make\` переносит знак в числитель и сокращает дробь. Остальные функции вычисляют «сырые» числитель и знаменатель по школьным формулам и отдают их в \`rational_make\`, поэтому результат всегда в канонической форме. Благодаря этому \`main\` может проверять делитель простым \`y.num == 0\`, а \`rational_print\` — сравнивать знаменатель с единицей.

\`gcd(0, den)\` возвращает \`den\`, так что ноль превращается в \`0/1\` без отдельной ветки. Вспомогательная функция \`gcd\` не объявлена в заголовке: это внутреннее дело модуля, пользователям она не нужна. В уроке о \`static\` вы узнаете, как скрыть её и от линковщика.`,
      examples: [
        { in: '1/2 + 1/3\n3/4 * 4/3\n', out: '5/6\n1\n' },
        { in: '1/-2 - 1/2\n2/4 / -1/2\n1/3 / 0/5\n', out: '-1\n-1\nделение на ноль\n' },
      ],
      hidden: [
        { in: '0/5 + 0/3\n', name: 'Ноль' },
        { in: '6/8 + 0/1\n', name: 'Сокращение одной дроби' },
        { in: '-3/-9 * 1/1\n', name: 'Два минуса' },
        { in: '1/6 - 1/2\n', name: 'Отрицательный результат' },
        { in: '1000000/999999 * 999999/1000000\n', name: 'Большие числа' },
        { in: '7/1 / 2/1\n-7/1 / 2/1\n', name: 'Целые числа' },
        { in: '1/2 + 1/2\n1/2 - 1/2\n1/2 * 1/2\n1/2 / 1/2\n', name: 'Все операции' },
        { in: '-5/12 + 7/-18\n', name: 'Общий знаменатель' },
      ],
    },
    {
      title: 'Непрозрачная очередь',
      description: `
В заготовке — заголовок модуля очереди целых чисел (FIFO: первым пришёл — первым ушёл) и функция \`main\`, которая обрабатывает команды до конца ввода:
- \`push x\` — добавить число в конец очереди;
- \`pop\` — извлечь и напечатать число из начала очереди;
- \`front\` — напечатать число в начале очереди, не извлекая его;
- \`size\` — напечатать количество элементов, \`cap\` — вместимость.

Для \`pop\` и \`front\` на пустой очереди \`main\` печатает \`пусто\`.

Напишите раздел \`queue.c\`: определение \`struct Queue\` и функции модуля. Тип \`Queue\` непрозрачен — \`main\` стоит выше определения структуры и видит только указатель.

Очередь устроена как **кольцевой буфер** в куче: элементы лежат в массиве, начиная с индекса \`head\`, и за концом массива продолжаются с его начала. Начальная вместимость — 4; когда буфер заполнен, вместимость удваивается, а элементы переписываются в новый массив по порядку. Вместимость никогда не уменьшается.`,
      constraints: ['Команд не больше 2000, числа — int.'],
      hints: [
        'Поля структуры: int *data; size_t head; size_t count; size_t capacity;. Элемент номер i (от начала очереди) лежит в data[(head + i) % capacity].',
        'push: если count == capacity, выделите новый массив вдвое больше, перепишите в него элементы по порядку от 0 до count − 1 и поставьте head = 0. Затем запишите значение в data[(head + count) % capacity].',
        'pop: значение берётся из data[head], затем head = (head + 1) % capacity и count уменьшается. queue_destroy освобождает и массив, и саму структуру.',
      ],
      starter: `${QUEUE_HEADER}
// Напишите здесь определение struct Queue и функции модуля.
`,
      solution: String.raw`${QUEUE_HEADER}
struct Queue {
    int *data;
    size_t head;
    size_t count;
    size_t capacity;
};

Queue *queue_create(void) {
    Queue *q = malloc(sizeof *q);
    if (q == NULL) {
        return NULL;
    }
    q->data = malloc(4 * sizeof *q->data);
    if (q->data == NULL) {
        free(q);
        return NULL;
    }
    q->head = 0;
    q->count = 0;
    q->capacity = 4;
    return q;
}

void queue_destroy(Queue *q) {
    if (q != NULL) {
        free(q->data);
        free(q);
    }
}

int queue_push(Queue *q, int value) {
    if (q->count == q->capacity) {
        size_t bigger = q->capacity * 2;
        int *data = malloc(bigger * sizeof *data);
        if (data == NULL) {
            return 0;
        }
        for (size_t i = 0; i < q->count; i++) {
            data[i] = q->data[(q->head + i) % q->capacity];
        }
        free(q->data);
        q->data = data;
        q->head = 0;
        q->capacity = bigger;
    }
    q->data[(q->head + q->count) % q->capacity] = value;
    q->count++;
    return 1;
}

int queue_pop(Queue *q, int *out) {
    if (q->count == 0) {
        return 0;
    }
    *out = q->data[q->head];
    q->head = (q->head + 1) % q->capacity;
    q->count--;
    return 1;
}

int queue_front(const Queue *q, int *out) {
    if (q->count == 0) {
        return 0;
    }
    *out = q->data[q->head];
    return 1;
}

size_t queue_size(const Queue *q) {
    return q->count;
}

size_t queue_capacity(const Queue *q) {
    return q->capacity;
}`,
      explanation: `
Кольцевой буфер позволяет извлекать из начала за O(1) без сдвига элементов: извлечение лишь передвигает \`head\`, а добавление пишет за последним элементом, «заворачивая» индекс через остаток от деления.

При росте нельзя просто вызвать \`realloc\`: если очередь «перелилась» через конец массива, её хвост лежит в начале блока, и после увеличения порядок сломается. Поэтому элементы переписываются в новый массив в логическом порядке, начиная с нулевого индекса.

Инвариант модуля — \`count <= capacity\` и \`head < capacity\`. Поскольку \`struct Queue\` определена только в разделе реализации, \`main\` не может его нарушить: она видит неполный тип и пользуется только функциями из заголовка.`,
      examples: [
        { in: 'push 1\npush 2\npush 3\npop\nfront\nsize\n', out: '1\n2\n2\n' },
        { in: 'pop\nfront\nsize\ncap\n', out: 'пусто\nпусто\n0\n4\n', why: 'Пустая очередь.' },
      ],
      hidden: [
        {
          in: 'push 1\npush 2\npush 3\npush 4\ncap\npush 5\ncap\nsize\n',
          name: 'Рост до 8',
        },
        {
          in: 'push 1\npush 2\npush 3\npop\npop\npush 4\npush 5\npush 6\npush 7\ncap\npop\npop\npop\npop\npop\npop\n',
          name: 'Рост после заворота',
        },
        {
          in: 'push 10\npop\npush 20\npop\npush 30\npop\npush 40\npop\npush 50\npop\ncap\nsize\n',
          name: 'Чередование',
        },
        { in: 'push -5\nfront\nfront\nsize\npop\npop\n', name: 'front не извлекает' },
        {
          in: 'push 1\npush 2\npush 3\npush 4\npush 5\npush 6\npush 7\npush 8\npush 9\ncap\npop\npop\npop\npop\npop\npop\npop\npop\npop\npop\n',
          name: 'Рост до 16',
        },
        {
          in: 'push 1\npush 2\npush 3\npush 4\npop\npop\npop\npush 5\npush 6\npush 7\npush 8\npush 9\nsize\ncap\nfront\n',
          name: 'Полный буфер с заворотом',
        },
        { in: 'cap\nsize\n', name: 'Начальная вместимость' },
        {
          in: 'push 2147483647\npush -2147483648\npop\npop\n',
          name: 'Крайние значения int',
        },
      ],
    },
    {
      title: 'Таблица рекордов',
      difficulty: 'advanced',
      description: `
В заготовке есть только функция \`main\`. Напишите для неё модуль \`Leaderboard\` — **и заголовок, и реализацию**, так, чтобы \`main\` скомпилировалась без изменений и без предупреждений.

\`main\` обрабатывает команды до конца ввода:
- \`add имя очки\` — \`board_add\` прибавляет очки игроку (новый игрок появляется с нулём очков); возвращает 1 при успехе и 0, если не хватило памяти;
- \`score имя\` — \`board_score\` возвращает очки игрока или 0 для неизвестного имени;
- \`top k\` — \`board_print_top\` печатает \`k\` лучших игроков (или всех, если их меньше) строками \`место. имя очки\`: по убыванию очков, при равенстве — по алфавиту (\`strcmp\`);
- \`count\` — \`board_count\` возвращает число игроков (\`size_t\`).

Тип \`Leaderboard\` должен быть непрозрачным: в разделе заголовка — только неполный тип и прототипы, определение структуры — в разделе реализации.`,
      constraints: [
        'Имена — не длиннее 31 символа без пробелов; очки — int, суммы помещаются в int.',
        'Игроков не больше 500, команд не больше 1000.',
      ],
      hints: [
        'Типы параметров и результатов выводите из вызовов в main: например, board_score(board, name) используется в printf с %d, значит, возвращает int и принимает (const Leaderboard *, const char *).',
        'Храните игроков в динамическом массиве структур { char name[32]; int points; } с полями count и capacity и расширяйте его через realloc.',
        'Для top скопируйте массив во временный, отсортируйте qsort с функцией сравнения «очки по убыванию, затем strcmp» и напечатайте первые k. Так порядок в самой таблице не меняется.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ---- leaderboard.h ----
// Напишите здесь интерфейс модуля: неполный тип Leaderboard и прототипы
// всех функций, которые вызывает main.
${BOARD_MAIN}

// ---- leaderboard.c ----
// Напишите здесь определение структуры и функции модуля.
`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ---- leaderboard.h ----
typedef struct Leaderboard Leaderboard;

Leaderboard *board_create(void);
void board_destroy(Leaderboard *board);
int board_add(Leaderboard *board, const char *name, int points);
int board_score(const Leaderboard *board, const char *name);
void board_print_top(const Leaderboard *board, int k);
size_t board_count(const Leaderboard *board);
${BOARD_MAIN}

// ---- leaderboard.c ----
typedef struct {
    char name[32];
    int points;
} Entry;

struct Leaderboard {
    Entry *entries;
    size_t count;
    size_t capacity;
};

Leaderboard *board_create(void) {
    Leaderboard *board = malloc(sizeof *board);
    if (board != NULL) {
        board->entries = NULL;
        board->count = 0;
        board->capacity = 0;
    }
    return board;
}

void board_destroy(Leaderboard *board) {
    if (board != NULL) {
        free(board->entries);
        free(board);
    }
}

Entry *find_entry(const Leaderboard *board, const char *name) {
    for (size_t i = 0; i < board->count; i++) {
        if (strcmp(board->entries[i].name, name) == 0) {
            return &board->entries[i];
        }
    }
    return NULL;
}

int board_add(Leaderboard *board, const char *name, int points) {
    Entry *entry = find_entry(board, name);
    if (entry == NULL) {
        if (board->count == board->capacity) {
            size_t bigger = board->capacity == 0 ? 8 : board->capacity * 2;
            Entry *grown = realloc(board->entries, bigger * sizeof *grown);
            if (grown == NULL) {
                return 0;
            }
            board->entries = grown;
            board->capacity = bigger;
        }
        entry = &board->entries[board->count++];
        strcpy(entry->name, name);
        entry->points = 0;
    }
    entry->points += points;
    return 1;
}

int board_score(const Leaderboard *board, const char *name) {
    const Entry *entry = find_entry(board, name);
    return entry != NULL ? entry->points : 0;
}

int compare_entries(const void *pa, const void *pb) {
    const Entry *a = pa;
    const Entry *b = pb;
    if (a->points != b->points) {
        return (b->points > a->points) - (b->points < a->points);
    }
    return strcmp(a->name, b->name);
}

void board_print_top(const Leaderboard *board, int k) {
    if (board->count == 0 || k <= 0) {
        return;
    }
    Entry *sorted = malloc(board->count * sizeof *sorted);
    if (sorted == NULL) {
        return;
    }
    memcpy(sorted, board->entries, board->count * sizeof *sorted);
    qsort(sorted, board->count, sizeof *sorted, compare_entries);
    for (size_t i = 0; i < board->count && i < (size_t)k; i++) {
        printf("%zu. %s %d\n", i + 1, sorted[i].name, sorted[i].points);
    }
    free(sorted);
}

size_t board_count(const Leaderboard *board) {
    return board->count;
}`,
      explanation: `
Заголовок восстанавливается по местам использования: \`board_create()\` возвращает указатель, который сравнивается с \`NULL\`; \`board_add\` возвращает значение, проверяемое \`!\`; \`board_score\` печатается через \`%d\`; \`board_count\` — через \`%zu\`, значит, возвращает \`size_t\`. Функции, которые только читают таблицу, принимают \`const Leaderboard *\` — это часть договора.

Тип \`Entry\` и функции \`find_entry\` и \`compare_entries\` в заголовок не попали: пользователю модуля они не нужны. Определение \`struct Leaderboard\` стоит ниже \`main\`, поэтому \`main\` физически не может обратиться к полям — непрозрачность проверяет компилятор.

\`board_print_top\` сортирует копию: функция, принимающая \`const\`-указатель, не должна менять порядок самой таблицы, а следующие команды \`add\` продолжают работать с исходным массивом.`,
      examples: [
        {
          in: 'add ann 10\nadd bob 15\nadd ann 7\ntop 2\nscore ann\ncount\n',
          out: '1. ann 17\n2. bob 15\nann: 17\n2\n',
        },
        {
          in: 'top 3\nscore zoe\ncount\n',
          out: 'zoe: 0\n0\n',
          why: 'Пустая таблица: top ничего не печатает.',
        },
      ],
      hidden: [
        {
          in: 'add bob 5\nadd amy 5\nadd cid 5\ntop 3\n',
          name: 'Равные очки по алфавиту',
        },
        { in: 'add a 1\nadd b 2\ntop 10\n', name: 'k больше числа игроков' },
        { in: 'add max 10\nadd max -15\nscore max\ntop 1\n', name: 'Отрицательные очки' },
        {
          in: 'add p1 1\nadd p2 2\nadd p3 3\nadd p4 4\nadd p5 5\nadd p6 6\nadd p7 7\nadd p8 8\nadd p9 9\nadd p10 10\ncount\ntop 3\n',
          name: 'Рост массива',
        },
        { in: 'add x 3\ntop 0\ncount\n', name: 'top 0' },
        {
          in: 'add zed 4\nadd al 9\ntop 2\nadd zed 10\ntop 2\n',
          name: 'Порядок меняется со временем',
        },
        { in: 'add Ann 1\nadd ann 1\ncount\ntop 2\n', name: 'Регистр в именах' },
        {
          in: 'add verylongname_abcdefghijklmnopq 100\nscore verylongname_abcdefghijklmnopq\ntop 1\n',
          name: 'Имя из 31 символа',
        },
      ],
    },
  ],
};
