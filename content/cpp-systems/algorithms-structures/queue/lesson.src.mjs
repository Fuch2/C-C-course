const TAIL = (fixed) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

int main(void) {
    Node *head = NULL, *tail = NULL;
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "enqueue") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            Node *node = malloc(sizeof *node);
            if (node == NULL) {
                return 1;
            }
            node->value = x;
            node->next = NULL;
            if (tail == NULL) {
                head = node;
            } else {
                tail->next = node;
            }
            tail = node;
        } else if (strcmp(command, "dequeue") == 0) {
            if (head == NULL) {
                printf("пусто\n");
                continue;
            }
            Node *node = head;
            printf("%d\n", node->value);
            head = node->next;${fixed ? '\n            if (head == NULL) {\n                tail = NULL;\n            }' : ''}
            free(node);
        }
    }
    while (head != NULL) {
        Node *next = head->next;
        free(head);
        head = next;
    }
    return 0;
}`;

export default {
  id: 'algo-queue',
  title: 'Очередь',
  description:
    'Принцип FIFO и операции очереди; почему не подходит массив со сдвигом; очередь на списке с головой и хвостом; очередь на двух стеках и амортизация; применение: буферы, планировщики; моделирование round-robin.',
  moduleId: 'algorithms-structures',
  order: 20,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['algo-stack'],
  objectives: [
    'Реализовывать очередь на связном списке за O(1)',
    'Собирать очередь из двух стеков и объяснять её амортизированную стоимость',
    'Не допускать висячего хвоста при опустошении очереди',
    'Моделировать процессы с очередью',
  ],
  tags: ['Структуры данных', 'Очередь', 'FIFO', 'Моделирование'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'В пустую очередь добавили 1, 2, 3, затем выполнили dequeue, добавили 4 и снова dequeue. Какой элемент теперь в начале очереди?',
      answers: ['3'],
      placeholder: 'Число',
      explain: 'Очередь 1 2 3 → после dequeue 2 3 → после добавления 2 3 4 → после dequeue 3 4.',
    },
    {
      q: 'Чем очередь отличается от стека?',
      options: [
        'Очередь выдаёт элементы в порядке добавления, стек — в обратном',
        'Очередь хранит только числа',
        'Очередь работает за O(log n)',
        'Ничем',
      ],
      correct: 0,
      explain: 'FIFO против LIFO: очередь сохраняет порядок поступления, стек его разворачивает.',
    },
    {
      q: 'Почему очередь на массиве с удалением из начала через memmove — плохая идея?',
      options: [
        'Каждое удаление сдвигает все элементы — O(n) на операцию',
        'memmove нельзя применять к массивам int',
        'Элементы перепутаются',
        'Это хорошая идея',
      ],
      correct: 0,
      explain: 'Очередь должна удалять за O(1). На массиве для этого нужен кольцевой буфер.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int queue[16], head = 0, tail = 0;
    for (int i = 1; i <= 5; i++) {
        queue[tail++] = i * i;
    }
    head += 2;
    queue[tail++] = 100;
    while (head < tail) {
        printf("%d ", queue[head++]);
    }
    printf("\n");
    return 0;
}`,
      answers: ['9 16 25 100'],
      placeholder: 'Вывод программы',
      explain: 'В очереди 1 4 9 16 25; два удаления убирают 1 и 4; 100 встаёт в конец.',
    },
    {
      q: 'Что произойдёт, если при удалении последнего элемента очереди на списке не обнулить tail?',
      options: [
        'Следующий enqueue запишет tail->next в освобождённый узел, а новый элемент потеряется',
        'Очередь станет стеком',
        'Ничего: head == NULL достаточно',
        'Утечёт один узел',
      ],
      correct: 0,
      explain:
        'enqueue, проверяющий tail == NULL, увидит висячий непустой tail и выполнит tail->next = node — запись в освобождённый узел, а head останется NULL. AddressSanitizer сообщит heap-use-after-free.',
    },
    {
      q: 'В очереди на двух стеках выполнили enqueue 1, 2, 3, затем три dequeue. Сколько раз элемент перекладывался из стека in в стек out?',
      answers: ['3'],
      placeholder: 'Число',
      explain:
        'Первый dequeue находит out пустым и перекладывает все три элемента; следующие два берут их из out без перекладывания.',
    },
    {
      q: 'Почему удаление из очереди на двух стеках работает за амортизированное O(1)?',
      options: [
        'Каждый элемент перекладывается из in в out ровно один раз за всё время',
        'Перекладывание всегда стоит O(1)',
        'Стек out никогда не бывает пустым',
        'Это O(n) на каждую операцию',
      ],
      correct: 0,
      explain:
        'Отдельное удаление может переложить много элементов, но суммарно перекладываний не больше числа добавлений.',
    },
    {
      q: 'Где естественно применяется очередь?',
      options: [
        'Буфер нажатий клавиш',
        'Обработка запросов к серверу в порядке поступления',
        'Отмена последнего действия',
        'Обход графа в ширину',
      ],
      correct: [0, 1, 3],
      explain:
        'Отмена последнего действия — LIFO, это стек. Остальное обрабатывается в порядке прихода.',
    },
  ],
  exercises: [
    {
      title: 'Операции с очередью',
      difficulty: 'beginner',
      description: `
Реализуйте очередь целых чисел на односвязном списке с указателями на голову и хвост и выполните команды из ввода:

- \`enqueue x\` — добавить в конец;
- \`dequeue\` — удалить из начала и напечатать;
- \`front\` — напечатать первый элемент, не удаляя;
- \`size\` — напечатать число элементов.

Если для \`dequeue\` или \`front\` очередь пуста, напечатайте \`пусто\`. В конце освободите все узлы.`,
      constraints: ['Команд не больше 2000; числа int.'],
      hints: [
        'enqueue: новый узел с next = NULL; если tail == NULL — он же голова, иначе tail->next = node; затем tail = node.',
        'dequeue: запомните голову, сдвиньте head = head->next; если head стал NULL, обнулите и tail; освободите старую голову.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

int main(void) {
    Node *head = NULL, *tail = NULL;
    int size = 0;
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "enqueue") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            Node *node = malloc(sizeof *node);
            if (node == NULL) {
                return 1;
            }
            node->value = x;
            node->next = NULL;
            if (tail == NULL) {
                head = node;
            } else {
                tail->next = node;
            }
            tail = node;
            size++;
        } else if (strcmp(command, "dequeue") == 0 || strcmp(command, "front") == 0) {
            if (head == NULL) {
                printf("пусто\n");
                continue;
            }
            printf("%d\n", head->value);
            if (command[0] == 'd') {
                Node *node = head;
                head = node->next;
                if (head == NULL) {
                    tail = NULL;
                }
                free(node);
                size--;
            }
        } else if (strcmp(command, "size") == 0) {
            printf("%d\n", size);
        }
    }
    while (head != NULL) {
        Node *next = head->next;
        free(head);
        head = next;
    }
    return 0;
}`,
      explanation: `
Голова списка — начало очереди, хвост — конец. Добавление цепляет узел за хвостом, удаление снимает голову: обе операции \`O(1)\`, без обхода.

Пустая очередь — это \`head == NULL\` **и** \`tail == NULL\`. При добавлении в пустую очередь узел становится и головой, и хвостом; при удалении последнего элемента обнуляются оба указателя. Если хвост не обнулить, он останется висячим — следующее добавление запишет в освобождённый узел. Счётчик \`size\` хранится отдельно, чтобы не считать узлы обходом.`,
      examples: [
        {
          in: 'enqueue 1\nenqueue 2\nfront\ndequeue\ndequeue\ndequeue\nsize\n',
          out: '1\n1\n2\nпусто\n0\n',
        },
        { in: 'front\nenqueue 5\nsize\n', out: 'пусто\n1\n' },
      ],
      hidden: [
        { in: 'size\n', name: 'Пустая' },
        {
          in: 'enqueue 1\ndequeue\nenqueue 2\ndequeue\nenqueue 3\nfront\n',
          name: 'Опустошение и пополнение',
        },
        {
          in: 'enqueue -2147483648\nenqueue 2147483647\ndequeue\ndequeue\n',
          name: 'Крайние значения',
        },
        {
          in: 'enqueue 1\nenqueue 2\nenqueue 3\ndequeue\nenqueue 4\ndequeue\ndequeue\ndequeue\ndequeue\n',
          name: 'Порядок FIFO',
        },
        { in: 'dequeue\ndequeue\nenqueue 7\nfront\nfront\nsize\n', name: 'front не удаляет' },
        { in: 'enqueue 5\nenqueue 5\nsize\ndequeue\nsize\n', name: 'Повторы' },
        { in: 'enqueue 10\nenqueue 20\nenqueue 30\n', name: 'Остались элементы' },
        { in: 'enqueue 0\nfront\ndequeue\nfront\n', name: 'Ноль' },
      ],
    },
    {
      title: 'Очередь на двух стеках',
      description: `
Реализуйте очередь на двух стеках-массивах \`in\` и \`out\` и выполните команды \`push x\` (добавить в очередь) и \`pop\` (удалить из начала очереди и напечатать или напечатать \`пусто\`).

Правило: \`push\` кладёт в \`in\`; \`pop\` берёт с вершины \`out\`, а если \`out\` пуст — сначала перекладывает **все** элементы из \`in\` в \`out\` по одному (с вершины \`in\` на вершину \`out\`).

В конце напечатайте \`перекладываний: K\` — сколько раз элемент перекладывался из \`in\` в \`out\`.`,
      constraints: ['Команд не больше 2000; числа int.'],
      hints: [
        'Два массива по 2000 элементов и два счётчика размеров. Перекладывание: while (in_size > 0) out[out_size++] = in[--in_size];.',
        'Если оба стека пусты, pop печатает «пусто» и ничего не перекладывает.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static int in[2000], out[2000];

int main(void) {
    int in_size = 0, out_size = 0;
    long long moves = 0;
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "push") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            in[in_size++] = x;
        } else if (strcmp(command, "pop") == 0) {
            if (out_size == 0) {
                while (in_size > 0) {
                    out[out_size++] = in[--in_size];
                    moves++;
                }
            }
            if (out_size == 0) {
                printf("пусто\n");
            } else {
                printf("%d\n", out[--out_size]);
            }
        }
    }
    printf("перекладываний: %lld\n", moves);
    return 0;
}`,
      explanation: `
Стек \`in\` хранит новые элементы, вершина — самый свежий. При перекладывании порядок разворачивается: в \`out\` на вершине оказывается самый старый элемент — тот, что должен уйти первым. Пока в \`out\` есть элементы, они старше всего, что лежит в \`in\`, поэтому новые элементы туда не подмешиваются.

Каждый элемент перекладывается не больше одного раза, поэтому число перекладываний не превышает числа \`push\`: \`n\` операций стоят \`O(n)\`. Это и есть амортизированное \`O(1)\` на операцию, хотя отдельный \`pop\` может переложить весь стек.`,
      examples: [
        {
          in: 'push 1\npush 2\npush 3\npop\npush 4\npop\npop\npop\n',
          out: '1\n2\n3\n4\nперекладываний: 4\n',
        },
        { in: 'pop\n', out: 'пусто\nперекладываний: 0\n' },
      ],
      hidden: [
        { in: 'push 5\n', name: 'Без удалений' },
        { in: 'push 1\npop\npush 2\npop\npush 3\npop\n', name: 'По одному' },
        { in: 'push 1\npush 2\npush 3\npush 4\npop\npop\npop\npop\npop\n', name: 'Все сразу' },
        { in: 'push 1\npush 2\npop\npush 3\npush 4\npop\npop\npop\n', name: 'Два перекладывания' },
        { in: 'push -1\npush -2\npop\npop\npop\n', name: 'Отрицательные' },
        { in: 'pop\npop\npush 9\npop\n', name: 'Пустая очередь' },
        {
          in: 'push 1\npush 2\npush 3\npop\npush 4\npush 5\npop\npop\npush 6\npop\npop\npop\n',
          name: 'Смешанные',
        },
        { in: 'push 2147483647\npush -2147483648\npop\npop\n', name: 'Крайние значения' },
      ],
    },
    {
      title: 'Найди ошибку: хвост очереди',
      bug: true,
      description: `
Программа выполняет команды \`enqueue x\` и \`dequeue\` над очередью на односвязном списке. \`dequeue\` печатает удалённый элемент или \`пусто\`.

Если очередь опустела, а потом в неё снова добавляют, AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['Команд не больше 2000; числа int.'],
      hints: [
        'Чему равны head и tail после удаления единственного элемента?',
        'Когда head становится NULL, tail всё ещё указывает на только что освобождённый узел. Следующий enqueue выполнит tail->next = node — запись в освобождённую память. Обнуляйте tail, когда очередь опустела.',
      ],
      starter: TAIL(false),
      solution: TAIL(true),
      explanation: `
После удаления последнего элемента \`head\` становится \`NULL\`, а \`tail\` по-прежнему указывает на только что освобождённый узел. Следующий \`enqueue\` проверяет \`tail == NULL\`, видит «непустую» очередь и выполняет \`tail->next = node\` — запись в освобождённую память. AddressSanitizer сообщает \`heap-use-after-free\`. Без санитайзера ошибка проявилась бы иначе: \`head\` остаётся \`NULL\`, и добавленные элементы теряются — следующий \`dequeue\` печатает \`пусто\`.

Инвариант очереди на списке: \`head == NULL\` тогда и только тогда, когда \`tail == NULL\`. Каждая операция, которая меняет один из указателей, должна поддерживать его. Нарушенный инвариант не ломает программу сразу — он оставляет «мину», которая срабатывает через одну или несколько операций, поэтому тесты должны опустошать структуру и снова её заполнять.`,
      examples: [
        { in: 'enqueue 1\nenqueue 2\ndequeue\ndequeue\n', out: '1\n2\n' },
        { in: 'dequeue\nenqueue 3\ndequeue\n', out: 'пусто\n3\n' },
      ],
      hidden: [
        'enqueue 1\ndequeue\nenqueue 2\nenqueue 3\ndequeue\ndequeue\n',
        'enqueue 5\ndequeue\nenqueue 6\nenqueue 7\n',
        'enqueue 1\nenqueue 2\ndequeue\ndequeue\nenqueue 3\nenqueue 4\ndequeue\n',
        'dequeue\n',
        'enqueue 1\nenqueue 2\nenqueue 3\ndequeue\ndequeue\ndequeue\ndequeue\n',
        'enqueue -1\ndequeue\nenqueue -2\nenqueue -3\ndequeue\ndequeue\nenqueue -4\nenqueue -5\ndequeue\n',
        'enqueue 9\nenqueue 8\n',
        'enqueue 0\ndequeue\nenqueue 0\nenqueue 0\ndequeue\ndequeue\n',
      ],
    },
    {
      title: 'Планировщик',
      difficulty: 'advanced',
      description: `
Смоделируйте планировщик процессов с квантом времени (round-robin). Первая строка — число процессов \`n\` и квант \`q\`, вторая — сколько времени нужно каждому процессу (процессы нумеруются с 1, в начале все стоят в очереди по номерам, время — 0).

Процессор берёт первый процесс из очереди и выполняет его \`min(q, осталось)\` единиц времени. Если процесс закончил, напечатайте строку \`процесс i: момент t\`, где \`t\` — текущее время. Иначе процесс встаёт в конец очереди. Моделирование идёт, пока очередь не опустеет.

После всех строк напечатайте \`переключений: K\` — сколько раз процессор брал процесс из очереди.`,
      constraints: ['1 ≤ n ≤ 1000; 1 ≤ q ≤ 1000; время процесса от 1 до 1000.'],
      hints: [
        'Одновременно в очереди не больше n процессов, поэтому подойдёт массив из n элементов с индексами head и tail, которые увеличиваются по модулю n, и счётчик размера. Так устроен кольцевой буфер — тема следующего урока. Подойдёт и очередь на списке.',
        'Храните в очереди номера процессов, а оставшееся время — в отдельном массиве left[i].',
        'Время и число переключений бывают до 10⁶ — это помещается в int, но удобнее long long.',
      ],
      solution: String.raw`
#include <stdio.h>

static int left[1000], queue[1000];

int main(void) {
    int n, q;
    if (scanf("%d %d", &n, &q) != 2 || n < 1 || n > 1000 || q < 1) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &left[i]);
        queue[i] = i;
    }
    int head = 0, size = n;
    long long time = 0, switches = 0;
    while (size > 0) {
        int p = queue[head];
        head = (head + 1) % n;
        size--;
        switches++;
        int run = left[p] < q ? left[p] : q;
        time += run;
        left[p] -= run;
        if (left[p] == 0) {
            printf("процесс %d: момент %lld\n", p + 1, time);
        } else {
            queue[(head + size) % n] = p;
            size++;
        }
    }
    printf("переключений: %lld\n", switches);
    return 0;
}`,
      explanation: `
Очередь хранит порядок ожидания: процесс, не закончивший работу за квант, встаёт в конец и снова получит процессор только после всех, кто ждал раньше. Поэтому ни один процесс не ждёт дольше, чем \`(n − 1) · q\` единиц времени между своими квантами, — в этом смысл round-robin.

Индексы \`head\` и \`(head + size) % n\` «заворачиваются» по модулю \`n\`: освободившееся место в начале массива используется снова, и очередь не уползает за его границу. Так как одновременно ждут не больше \`n\` процессов, массива из \`n\` ячеек достаточно. Маленький квант делает систему отзывчивее, но увеличивает число переключений; большой квант превращает планировщик в простую очередь «до завершения».`,
      examples: [
        {
          in: '3 2\n5 2 4\n',
          out: 'процесс 2: момент 4\nпроцесс 3: момент 10\nпроцесс 1: момент 11\nпереключений: 6\n',
        },
        { in: '2 10\n3 4\n', out: 'процесс 1: момент 3\nпроцесс 2: момент 7\nпереключений: 2\n' },
      ],
      hidden: [
        { in: '1 1\n5\n', name: 'Один процесс' },
        { in: '3 1\n1 1 1\n', name: 'Квант равен времени' },
        { in: '3 1\n3 2 1\n', name: 'Квант 1' },
        { in: '4 3\n3 6 9 12\n', name: 'Кратные кванту' },
        { in: '5 1000\n5 4 3 2 1\n', name: 'Большой квант' },
        { in: '2 1\n1000 1000\n', name: 'Длинные процессы' },
        { in: '6 4\n10 1 7 4 3 12\n', name: 'Смешанные' },
        { in: '4 2\n1 3 5 7\n', name: 'Нечётные времена' },
      ],
    },
  ],
};
