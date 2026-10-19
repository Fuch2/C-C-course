const STACK = (fixed) => String.raw`
#define NDEBUG                      // так программу собирают для пользователей
#include <assert.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    int items[8];
    int size;
} Stack;

static int stack_push(Stack *s, int value) {
    if (s->size == 8) {
        return 0;
    }
    s->items[s->size++] = value;
    return 1;
}

static int stack_pop(Stack *s, int *out) {
    if (s->size == 0) {
        return 0;
    }
    *out = s->items[--s->size];
    return 1;
}

int main(void) {
    Stack s = {{0}, 0};
    char command[16];
    while (scanf("%15s", command) == 1) {
        int value;
        if (strcmp(command, "push") == 0 && scanf("%d", &value) == 1) {
${
  fixed
    ? '            if (!stack_push(&s, value)) {\n                printf("стек полон\\n");\n            }'
    : '            assert(stack_push(&s, value));      // «не может не получиться»'
}
        } else if (strcmp(command, "pop") == 0) {
            if (stack_pop(&s, &value)) {
                printf("%d\n", value);
            } else {
                printf("пусто\n");
            }
        } else if (strcmp(command, "size") == 0) {
            printf("%d\n", s.size);
        }
    }
    return 0;
}`;

const SPEED = (fixed) => String.raw`
#include <assert.h>
#include <stdio.h>

int main(void) {
    double distance, hours;
    int trip = 0;
    while (scanf("%lf %lf", &distance, &hours) == 2) {
        trip++;
${
  fixed
    ? '        if (hours <= 0 || distance < 0) {\n            printf("поездка %d: ошибка данных\\n", trip);\n            continue;\n        }'
    : '        assert(hours > 0 && distance >= 0);'
}
        printf("поездка %d: %.1f км/ч\n", trip, distance / hours);
    }
    return 0;
}`;

const WEEKDAYS = (fixed) => String.raw`
#include <assert.h>
#include <stdio.h>

enum Weekday { MON, TUE, WED, THU, FRI, SAT, SUN, DAY_COUNT };

static const char *const DAY_NAMES[] = {
    "понедельник", "вторник", "среда", "четверг", "пятница",${fixed ? ' "суббота",' : ''} "воскресенье",
};

static_assert(sizeof DAY_NAMES / sizeof DAY_NAMES[0] == DAY_COUNT,
              "таблица названий не совпадает с перечислением дней");

int main(void) {
    int day;
    while (scanf("%d", &day) == 1) {
        if (day < 0 || day >= DAY_COUNT) {
            printf("%d: нет такого дня\n", day);
            continue;
        }
        printf("%d: %s, %s\n", day, DAY_NAMES[day], day >= SAT ? "выходной" : "рабочий");
    }
    return 0;
}`;

export default {
  id: 'advanced-assertions',
  title: 'assert и static_assert: проверки предположений',
  description:
    'Ошибки программиста и макрос assert; предусловия, постусловия и инварианты; что проверять assert, а что обрабатывать; NDEBUG и запрет действий внутри assert; abort и потерянный вывод; static_assert для размеров, расположения полей и соответствия таблиц; функции проверки инвариантов.',
  moduleId: 'advanced-c',
  order: 28,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-error-handling'],
  objectives: [
    'Проверять предусловия, постусловия и инварианты с помощью assert',
    'Отличать ошибки программиста от ошибок данных и окружения',
    'Избегать действий внутри assert и учитывать NDEBUG',
    'Проверять константные предположения при компиляции через static_assert',
  ],
  tags: ['assert', 'static_assert', 'NDEBUG', 'Инварианты', 'Отладка'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что делает assert(x > 0), если x равно нулю и NDEBUG не определён?',
      options: [
        'Печатает в stderr выражение, файл, строку и функцию и вызывает abort',
        'Возвращает 0 из текущей функции',
        'Печатает предупреждение и продолжает работу',
        'Устанавливает errno',
      ],
      correct: 0,
      explain:
        'assert аварийно завершает программу: нарушено предположение о коде, и продолжать работу бессмысленно.',
    },
    {
      q: 'Для каких ситуаций уместен assert? Выберите все.',
      options: [
        'Своя внутренняя функция получила NULL вопреки договору',
        'Инвариант структуры данных нарушен после изменения',
        'Пользователь ввёл отрицательный возраст',
        'malloc вернул NULL',
        'Файл настроек не найден',
      ],
      correct: [0, 1],
      explain:
        'assert — для ошибок в коде. Неверный ввод, нехватка памяти и отсутствие файла возможны при правильной программе — их обрабатывают явно.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#define NDEBUG
#include <assert.h>
#include <stdio.h>

int main(void) {
    int count = 5;
    assert(--count > 0);
    assert(count++ < 100);
    printf("%d\n", count);
    return 0;
}`,
      answers: ['5'],
      placeholder: 'Вывод программы',
      explain:
        'С NDEBUG assert превращается в ((void)0), и выражения внутри не вычисляются: count остаётся 5. Без NDEBUG программа напечатала бы тоже 5, но по другой причине: 5 → 4 → 5.',
    },
    {
      q: 'Почему вывод printf, сделанный перед сработавшим assert, может не появиться?',
      options: [
        'abort завершает процесс, не сбрасывая буферы stdout',
        'assert очищает экран',
        'printf не работает в функциях с assert',
        'stdout закрывается перед проверкой',
      ],
      correct: 0,
      explain:
        'Когда вывод идёт в файл или канал, stdout буферизуется блоками. abort не вызывает обработчиков завершения и не сбрасывает буферы. stderr не буферизуется, поэтому сообщение assert видно.',
    },
    {
      q: 'Какое выражение можно проверить через static_assert? Выберите все.',
      options: [
        'sizeof(struct Header) == 16',
        'offsetof(struct Header, crc) == 12',
        'CHAR_BIT == 8',
        'count > 0, где count — переменная',
      ],
      correct: [0, 1, 2],
      explain:
        'static_assert проверяет константные выражения при компиляции. Значение переменной известно только во время работы — для него нужен обычный assert.',
    },
    {
      q: 'Что произойдёт при компиляции строки static_assert(sizeof(int) == 2, "нужен 16-битный int"); на x86-64?',
      options: [
        'Ошибка компиляции с сообщением «нужен 16-битный int»',
        'Программа соберётся, а при запуске вызовется abort',
        'Предупреждение, программа соберётся',
        'Ничего: static_assert проверяется только с флагом -DDEBUG',
      ],
      correct: 0,
      explain:
        'Ложное условие static_assert останавливает компиляцию. NDEBUG на static_assert не влияет.',
    },
    {
      q: 'Как переписать assert(list_append(&list, item)); чтобы финальная сборка с NDEBUG продолжала добавлять элементы и сообщала о неудаче?',
      options: [
        'if (!list_append(&list, item)) { сообщить об ошибке }',
        'assert(list_append(&list, item) == 1);',
        '#undef NDEBUG перед строкой',
        'static_assert(list_append(&list, item), "");',
      ],
      correct: 0,
      explain:
        'Действие выносится из assert. А раз неудача добавления возможна при правильной программе (кончилось место), её обрабатывают явно.',
    },
    {
      q: 'Какой код завершения получит программа в Linux, если сработал assert (сигнал SIGABRT)?',
      answers: ['134'],
      placeholder: 'Код',
      explain:
        'Оболочка сообщает о завершении сигналом как 128 + номер сигнала; SIGABRT — 6, итого 134.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: действие внутри assert',
      bug: true,
      description: `
Программа управляет стеком на 8 чисел. Команды: \`push x\` — положить число (если стек полон, напечатать \`стек полон\`), \`pop\` — снять и напечатать верхнее число или \`пусто\`, \`size\` — напечатать размер.

Программа собирается как финальная — с \`NDEBUG\`, и в этой сборке числа в стек не попадают. Исправьте ошибку, не убирая \`#define NDEBUG\`.`,
      constraints: ['Команд не больше 50.'],
      hints: [
        'Во что превращается assert(…) при определённом NDEBUG? Вычисляется ли выражение внутри?',
        'Вынесите вызов stack_push из assert. Переполнение стека — обычная ситуация, а не ошибка в коде: обработайте результат через if и напечатайте «стек полон».',
      ],
      starter: STACK(false),
      solution: STACK(true),
      explanation: `
С \`NDEBUG\` макрос \`assert(выражение)\` заменяется на \`((void)0)\` — выражение не вычисляется вовсе. Вместе с проверкой исчез и вызов \`stack_push\`, поэтому в финальной сборке стек всегда пуст. В отладочной сборке ошибка не видна: там \`assert\` вычисляет выражение, и элемент добавляется.

Есть и вторая ошибка — смысловая. Неудачный \`push\` в заполненный стек — нормальная ситуация, которая случается при правильной программе. Для неё \`assert\` не подходит даже в отладочной сборке: программа упала бы на допустимых данных. Правильное исправление — обычная проверка результата и сообщение пользователю.`,
      examples: [
        { in: 'push 1\npush 2\npop\nsize\n', out: '2\n1\n' },
        { in: 'pop\nsize\n', out: 'пусто\n0\n' },
      ],
      hidden: [
        'push 5\npop\npop\n',
        'push 1\npush 2\npush 3\npush 4\npush 5\npush 6\npush 7\npush 8\npush 9\nsize\npop\n',
        'push -1\npush 0\nsize\npop\npop\n',
        'push 7\npush 7\npush 7\nsize\n',
        'size\npush 100\nsize\n',
        'push 1\npop\npush 2\npop\npush 3\npop\n',
        'push 1\npush 2\npush 3\npush 4\npush 5\npush 6\npush 7\npush 8\npush 9\npush 10\npop\npop\nsize\n',
        'push 2147483647\npop\n',
      ],
    },
    {
      title: 'Найди ошибку: assert вместо проверки ввода',
      bug: true,
      description: `
Программа читает поездки — пары «расстояние в километрах, время в часах» — и для каждой печатает \`поездка N: S км/ч\` со средней скоростью с одним знаком после точки. Если время не положительно или расстояние отрицательно, нужно напечатать \`поездка N: ошибка данных\` и перейти к следующей поездке.

На неверных данных программа аварийно завершается. Исправьте её.`,
      constraints: ['Поездок не больше 30; числа — действительные, по модулю до 10⁶.'],
      hints: [
        'Что делает assert, когда условие ложно? Подходит ли это для данных, которые ввёл пользователь?',
        'Неверный ввод возможен при правильной программе. Замените assert обычной проверкой: напечатайте сообщение об ошибке и continue.',
      ],
      starter: SPEED(false),
      solution: SPEED(true),
      explanation: `
\`assert\` проверяет предположения о **коде** и при нарушении аварийно завершает программу. Но время поездки ввёл пользователь, и ноль или отрицательное число — ожидаемая ситуация, а не ошибка программиста. Программа, которая падает от неверной строки во входных данных, теряет и все результаты после неё.

Есть и обратная опасность: в финальной сборке с \`NDEBUG\` такая проверка исчезнет, и программа поделит на ноль или напечатает бессмысленную отрицательную скорость. Ввод проверяют всегда, явно, с сообщением о проблеме — а \`assert\` оставляют для условий, которые при правильном коде не нарушаются никогда.`,
      examples: [
        { in: '120 2\n90 1.5\n', out: 'поездка 1: 60.0 км/ч\nпоездка 2: 60.0 км/ч\n' },
        { in: '100 0\n50 2\n', out: 'поездка 1: ошибка данных\nпоездка 2: 25.0 км/ч\n' },
      ],
      hidden: [
        '10 -1\n',
        '-5 1\n',
        '0 1\n',
        '1000000 0.5\n',
        '30 0.25\n0 0\n15 1\n',
        '100 3\n',
        '42 0.0001\n',
        '1 1\n2 -2\n3 3\n',
      ],
    },
    {
      title: 'Найди ошибку: таблица и перечисление',
      bug: true,
      description: `
Программа читает номера дней недели (0 — понедельник, …, 6 — воскресенье) и для каждого печатает \`номер: название, выходной|рабочий\`, а для номера вне диапазона — \`номер: нет такого дня\`.

Сборка останавливается: срабатывает \`static_assert\`. Найдите причину и исправьте программу, не удаляя проверку.`,
      constraints: ['Номеров не больше 30.'],
      hints: [
        'static_assert сравнивает число элементов таблицы DAY_NAMES с числом дней в перечислении. Пересчитайте названия.',
        'В таблице нет субботы. Вставьте "суббота" между пятницей и воскресеньем — порядок названий должен совпадать с порядком перечисления.',
      ],
      starter: WEEKDAYS(false),
      solution: WEEKDAYS(true),
      explanation: `
Таблица названий и перечисление должны описывать одни и те же дни в одном порядке. В таблице пропущена суббота — без \`static_assert\` программа собралась бы и печатала для субботы «воскресенье», а для воскресенья читала бы за границей массива. Проверка при компиляции превращает эту тихую ошибку в понятное сообщение ещё до запуска.

Исправлять нужно таблицу, а не проверку: удалив \`static_assert\`, вы вернули бы скрытую ошибку. Название вставляется на своё место — индекс в таблице должен совпадать со значением константы перечисления. Назначенные инициализаторы (\`[SAT] = "суббота"\`) сделали бы это соответствие явным.`,
      examples: [
        {
          in: '0\n5\n6\n',
          out: '0: понедельник, рабочий\n5: суббота, выходной\n6: воскресенье, выходной\n',
        },
        { in: '7\n-1\n', out: '7: нет такого дня\n-1: нет такого дня\n' },
      ],
      hidden: ['1\n', '2\n3\n4\n', '5\n', '6\n', '0 1 2 3 4 5 6\n', '10\n', '4 5\n', '-100\n3\n'],
    },
    {
      title: 'Двоичная куча с проверкой инварианта',
      difficulty: 'advanced',
      description: `
Двоичная **max-куча** — массив, в котором каждый элемент не больше своего родителя: для всех \`i > 0\` выполняется \`a[(i − 1) / 2] ≥ a[i]\`. Наибольший элемент — всегда \`a[0]\`.

Команды до конца ввода:
- \`check n a₀ … aₙ₋₁\` — проверить массив и напечатать \`куча\` или \`нарушение: позиция i, родитель p\` для первого (наименьшего) \`i\`, где элемент больше родителя;
- \`push x\` — вставить число в свою кучу: поставить в конец и «поднимать» обменом с родителем, пока он меньше; напечатать кучу через пробел;
- \`pop\` — извлечь наибольший: напечатать его (или \`пусто\`), поставить последний элемент в корень и «опускать» обменом с большим из детей, пока ребёнок больше.

Напишите функцию \`int heap_check(const int *a, int n, int *bad)\` и используйте её **дважды**: для команды \`check\` и в \`assert(heap_check(...))\` в конце \`push\` и \`pop\` — как проверку инварианта собственной кучи.`,
      constraints: ['В куче не больше 100 элементов; в check n от 0 до 100; числа — int.'],
      hints: [
        'heap_check перебирает i от 1 до n − 1 и при a[(i − 1) / 2] < a[i] записывает i в *bad и возвращает 0.',
        'Подъём: while (i > 0 && a[(i − 1) / 2] < a[i]) { обмен; i = (i − 1) / 2; }. Спуск: выберите большего из детей 2i + 1 и 2i + 2 (если они есть) и меняйте, пока он больше текущего.',
        'В assert передавайте вызов функции проверки без побочных эффектов: int bad; assert(heap_check(h, n, &bad)); — запись в bad не влияет на программу, даже если assert исчезнет.',
      ],
      solution: String.raw`
#include <assert.h>
#include <stdio.h>
#include <string.h>

static int heap[100];
static int heap_size;

static int heap_check(const int *a, int n, int *bad) {
    for (int i = 1; i < n; i++) {
        if (a[(i - 1) / 2] < a[i]) {
            *bad = i;
            return 0;
        }
    }
    return 1;
}

static void swap(int *x, int *y) {
    int t = *x;
    *x = *y;
    *y = t;
}

static void print_heap(void) {
    for (int i = 0; i < heap_size; i++) {
        printf(i + 1 < heap_size ? "%d " : "%d", heap[i]);
    }
    printf("\n");
}

static void push(int value) {
    int i = heap_size++;
    heap[i] = value;
    while (i > 0 && heap[(i - 1) / 2] < heap[i]) {
        swap(&heap[(i - 1) / 2], &heap[i]);
        i = (i - 1) / 2;
    }
    int bad;
    assert(heap_check(heap, heap_size, &bad));
    (void)bad;
}

static int pop(int *out) {
    if (heap_size == 0) {
        return 0;
    }
    *out = heap[0];
    heap[0] = heap[--heap_size];
    int i = 0;
    for (;;) {
        int largest = i;
        int left = 2 * i + 1, right = 2 * i + 2;
        if (left < heap_size && heap[left] > heap[largest]) {
            largest = left;
        }
        if (right < heap_size && heap[right] > heap[largest]) {
            largest = right;
        }
        if (largest == i) {
            break;
        }
        swap(&heap[i], &heap[largest]);
        i = largest;
    }
    int bad;
    assert(heap_check(heap, heap_size, &bad));
    (void)bad;
    return 1;
}

int main(void) {
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "check") == 0) {
            int n, a[100];
            if (scanf("%d", &n) != 1 || n < 0 || n > 100) {
                break;
            }
            for (int i = 0; i < n; i++) {
                if (scanf("%d", &a[i]) != 1) {
                    return 0;
                }
            }
            int bad = 0;
            if (heap_check(a, n, &bad)) {
                printf("куча\n");
            } else {
                printf("нарушение: позиция %d, родитель %d\n", bad, (bad - 1) / 2);
            }
        } else if (strcmp(command, "push") == 0) {
            int value;
            if (scanf("%d", &value) != 1 || heap_size == 100) {
                break;
            }
            push(value);
            print_heap();
        } else if (strcmp(command, "pop") == 0) {
            int value;
            if (pop(&value)) {
                printf("%d\n", value);
            } else {
                printf("пусто\n");
            }
        }
    }
    return 0;
}`,
      explanation: `
Функция проверки инварианта работает в двух ролях. Для команды \`check\` она — обычная функция, результат которой печатается: чужой массив может и не быть кучей, это данные. А в конце \`push\` и \`pop\` её вызов стоит в \`assert\`: собственная куча программы **обязана** оставаться кучей, и если подъём или спуск написан с ошибкой, отладочная сборка остановится сразу после неправильной операции — с указанием строки.

Внутри \`assert\` — только проверка: \`heap_check\` ничего не меняет, кроме локальной переменной \`bad\`. С \`NDEBUG\` вызов исчезнет вместе с проверкой, а поведение программы не изменится — поэтому \`(void)bad;\` нужен лишь для того, чтобы компилятор не предупреждал о переменной, которая в финальной сборке не используется.

Проверка стоит O(n) на каждую операцию — дороже самой вставки за O(log n). В отладочной сборке это приемлемая цена за уверенность; в финальной с \`NDEBUG\` она исчезает.`,
      examples: [
        {
          in: 'push 5\npush 9\npush 3\npush 7\npop\n',
          out: '5\n9 5\n9 5 3\n9 7 3 5\n9\n',
        },
        { in: 'check 4 9 7 3 8\ncheck 3 5 5 5\n', out: 'нарушение: позиция 3, родитель 1\nкуча\n' },
      ],
      hidden: [
        { in: 'pop\ncheck 0\n', name: 'Пусто' },
        { in: 'check 1 42\ncheck 2 1 2\n', name: 'Короткие массивы' },
        {
          in: 'push 1\npush 2\npush 3\npush 4\npush 5\npop\npop\npop\npop\npop\npop\n',
          name: 'Возрастающие вставки',
        },
        { in: 'push 5\npush 5\npush 5\npop\n', name: 'Равные элементы' },
        { in: 'push -3\npush -1\npush -2\npop\npop\n', name: 'Отрицательные' },
        { in: 'check 7 10 9 8 7 6 5 11\n', name: 'Нарушение в последнем элементе' },
        {
          in: 'push 10\npush 20\npush 15\npush 30\npush 40\npop\npush 25\npop\npop\n',
          name: 'Смешанные операции',
        },
        { in: 'check 6 50 30 40 10 20 35\ncheck 6 50 30 40 31 20 35\n', name: 'Куча и нарушение' },
      ],
    },
  ],
};
