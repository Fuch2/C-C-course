const UNLINK = (fixed) => String.raw`
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *prev;
    struct Node *next;
} Node;

static void insert_before(Node *where, int value) {
    Node *node = malloc(sizeof *node);
    if (node == NULL) {
        exit(1);
    }
    node->value = value;
    node->next = where;
    node->prev = where->prev;
    where->prev->next = node;
    where->prev = node;
}

static void unlink_node(Node *node) {
    node->prev->next = node->next;${fixed ? '\n    node->next->prev = node->prev;' : ''}
    free(node);
}

int main(void) {
    int n, x;
    if (scanf("%d %d", &n, &x) != 2 || n < 1) {
        return 0;
    }
    Node list = {0, &list, &list};
    for (int i = 0; i < n; i++) {
        int v;
        if (scanf("%d", &v) != 1) {
            break;
        }
        insert_before(&list, v);
    }
    for (Node *p = list.next; p != &list;) {
        Node *next = p->next;
        if (p->value == x) {
            unlink_node(p);
        }
        p = next;
    }
    for (Node *p = list.next; p != &list; p = p->next) {
        printf("%d ", p->value);
    }
    printf("|");
    for (Node *p = list.prev; p != &list; p = p->prev) {
        printf(" %d", p->value);
    }
    printf("\n");
    while (list.next != &list) {
        Node *node = list.next;
        list.next = node->next;
        free(node);
    }
    return 0;
}`;

export default {
  id: 'algo-doubly',
  title: 'Двусвязный список',
  description:
    'Узлы со ссылками в обе стороны; фиктивный узел, замкнутый в кольцо, без особых случаев; вставка и удаление известного узла за O(1); порядок присваиваний; применение: LRU-кэш, редактор, история; std::list.',
  moduleId: 'algorithms-structures',
  order: 18,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['algo-list'],
  objectives: [
    'Реализовывать двусвязный список с фиктивным узлом',
    'Вставлять и удалять узлы за O(1) в правильном порядке присваиваний',
    'Выполнять операции дека на обоих концах',
    'Строить LRU-кэш из таблицы и двусвязного списка',
  ],
  tags: ['Структуры данных', 'Двусвязный список', 'Фиктивный узел', 'LRU'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Сколько указателей нужно изменить, чтобы удалить узел из середины двусвязного списка?',
      answers: ['2'],
      placeholder: 'Число',
      explain:
        'prev->next соседа слева и next->prev соседа справа. Поля самого удаляемого узла можно не трогать — он освобождается.',
    },
    {
      q: 'Как выглядит пустой двусвязный список с фиктивным узлом?',
      options: [
        'sentinel.next == &sentinel и sentinel.prev == &sentinel',
        'sentinel.next == NULL',
        'sentinel.value == 0',
        'Фиктивного узла в пустом списке нет',
      ],
      correct: 0,
      explain:
        'Страж замкнут в кольцо сам с собой. Благодаря этому у каждого настоящего узла всегда есть оба соседа, и проверки на NULL не нужны.',
    },
    {
      q: 'Чем удаление известного узла из двусвязного списка лучше, чем из односвязного?',
      options: [
        'Предыдущий узел доступен через prev, искать его не нужно — O(1)',
        'Не нужно вызывать free',
        'Удаление из односвязного списка невозможно',
        'Ничем',
      ],
      correct: 0,
      explain:
        'В односвязном списке, чтобы переставить next у предыдущего узла, его нужно найти обходом от головы — O(n).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef struct Node {
    int value;
    struct Node *prev;
    struct Node *next;
} Node;

int main(void) {
    Node s, a = {1, 0, 0}, b = {2, 0, 0}, c = {3, 0, 0};
    s.next = &a; a.next = &b; b.next = &c; c.next = &s;
    s.prev = &c; c.prev = &b; b.prev = &a; a.prev = &s;
    b.prev->next = b.next;
    b.next->prev = b.prev;
    for (Node *p = s.prev; p != &s; p = p->prev) {
        printf("%d ", p->value);
    }
    printf("\n");
    return 0;
}`,
      answers: ['3 1'],
      placeholder: 'Вывод программы',
      explain: 'Узел 2 исключён из кольца обеими ссылками; обход назад от стража: 3, затем 1.',
    },
    {
      q: 'Как в списке со стражем sentinel добавить элемент в конец с помощью insert_after(where, value)?',
      options: [
        'insert_after(sentinel.prev, value)',
        'insert_after(&sentinel, value)',
        'insert_after(sentinel.next, value)',
        'insert_after(NULL, value)',
      ],
      correct: 0,
      explain:
        'sentinel.prev — последний узел (или сам страж в пустом списке). Вставка после него — это вставка в конец. insert_after(&sentinel, x) добавляет в начало.',
    },
    {
      q: 'Почему в LRU-кэше используют именно двусвязный список?',
      options: [
        'Найденный по таблице узел можно за O(1) вырезать и перенести в начало, а последний — удалить',
        'Двусвязный список быстрее ищет ключи',
        'В нём меньше памяти на элемент',
        'Он автоматически сортирует элементы',
      ],
      correct: 0,
      explain:
        'Поиск ключа делает таблица, а список хранит порядок обращений. Вырезать узел из середины за O(1) можно, только зная его предыдущего соседа.',
    },
    {
      q: 'Что не так с обходом списка со стражем: for (p = sentinel.next; p != NULL; p = p->next)?',
      options: [
        'В кольце нет NULL: цикл никогда не закончится и будет печатать страж',
        'Он пропустит первый узел',
        'Он пропустит последний узел',
        'Всё верно',
      ],
      correct: 0,
      explain: 'Обход заканчивается, когда p вернулся к стражу: p != &sentinel.',
    },
    {
      q: 'Какие операции двусвязного списка со стражем выполняются за O(1)?',
      options: [
        'Удаление последнего узла',
        'Добавление в начало',
        'Удаление узла по известному указателю на него',
        'Поиск узла с заданным значением',
      ],
      correct: [0, 1, 2],
      explain: 'Поиск значения по-прежнему требует обхода — O(n).',
    },
  ],
  exercises: [
    {
      title: 'Вперёд и назад',
      difficulty: 'beginner',
      description: `
Прочитайте \`n\` и \`n\` целых чисел и сложите их в двусвязный список в порядке ввода. Напечатайте список дважды: на первой строке — от начала к концу, на второй — от конца к началу. Освободите все узлы.`,
      constraints: ['1 ≤ n ≤ 1000; числа int.'],
      hints: [
        'Удобнее всего фиктивный узел: Node list = {0, &list, &list}; добавление в конец — вставка перед стражем.',
        'Обход вперёд — по next от list.next до &list, назад — по prev от list.prev до &list.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *prev;
    struct Node *next;
} Node;

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) {
        return 0;
    }
    Node list = {0, &list, &list};
    for (int i = 0; i < n; i++) {
        int v;
        if (scanf("%d", &v) != 1) {
            break;
        }
        Node *node = malloc(sizeof *node);
        if (node == NULL) {
            return 1;
        }
        node->value = v;
        node->next = &list;
        node->prev = list.prev;
        list.prev->next = node;
        list.prev = node;
    }
    for (Node *p = list.next; p != &list; p = p->next) {
        printf(p->next != &list ? "%d " : "%d\n", p->value);
    }
    for (Node *p = list.prev; p != &list; p = p->prev) {
        printf(p->prev != &list ? "%d " : "%d\n", p->value);
    }
    while (list.next != &list) {
        Node *node = list.next;
        list.next = node->next;
        free(node);
    }
    return 0;
}`,
      explanation: `
Вставка в конец — это вставка перед стражем: новый узел смотрит вперёд на страж и назад на бывший последний узел, затем оба соседа переключаются на него. Пустой список не требует особой обработки: в нём «бывший последний» — сам страж.

Обратный обход возможен только благодаря \`prev\`: в односвязном списке для этого понадобился бы массив или рекурсия. Освобождение идёт вперёд; ссылки \`prev\` при этом не обновляются, потому что после цикла список больше не используется.`,
      examples: [
        { in: '4\n10 20 30 40\n', out: '10 20 30 40\n40 30 20 10\n' },
        { in: '1\n7\n', out: '7\n7\n' },
      ],
      hidden: [
        '2\n1 2\n',
        '3\n5 5 5\n',
        '5\n-1 -2 -3 -4 -5\n',
        '3\n2147483647 0 -2147483648\n',
        '6\n1 2 3 3 2 1\n',
        '7\n9 8 7 6 5 4 3\n',
        '8\n0 1 0 1 0 1 0 1\n',
        '5\n100 -100 200 -200 300\n',
      ],
    },
    {
      title: 'Дек',
      description: `
**Дек** (deque, двусторонняя очередь) — последовательность, в которую можно добавлять и из которой можно удалять с обоих концов. Реализуйте его на двусвязном списке со стражем и выполните команды из ввода:

- \`push_front x\`, \`push_back x\` — добавить в начало или конец;
- \`pop_front\`, \`pop_back\` — удалить из начала или конца и напечатать удалённое значение, а если дек пуст — \`пусто\`;
- \`print\` — напечатать элементы от начала к концу через пробел или \`пусто\`.

В конце освободите все узлы.`,
      constraints: ['Команд не больше 1000; числа int.'],
      hints: [
        'Одна функция insert_after(where, value) обслуживает оба конца: push_front — insert_after(&list, x), push_back — insert_after(list.prev, x).',
        'pop_front удаляет list.next, pop_back — list.prev, но только если список не пуст: list.next != &list.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    int value;
    struct Node *prev;
    struct Node *next;
} Node;

static void insert_after(Node *where, int value) {
    Node *node = malloc(sizeof *node);
    if (node == NULL) {
        exit(1);
    }
    node->value = value;
    node->prev = where;
    node->next = where->next;
    where->next->prev = node;
    where->next = node;
}

static int unlink_node(Node *node) {
    int value = node->value;
    node->prev->next = node->next;
    node->next->prev = node->prev;
    free(node);
    return value;
}

int main(void) {
    Node list = {0, &list, &list};
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "push_front") == 0 || strcmp(command, "push_back") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            insert_after(command[5] == 'f' ? &list : list.prev, x);
        } else if (strcmp(command, "pop_front") == 0 || strcmp(command, "pop_back") == 0) {
            if (list.next == &list) {
                printf("пусто\n");
            } else {
                printf("%d\n", unlink_node(command[4] == 'f' ? list.next : list.prev));
            }
        } else if (strcmp(command, "print") == 0) {
            if (list.next == &list) {
                printf("пусто\n");
            }
            for (Node *p = list.next; p != &list; p = p->next) {
                printf(p->next != &list ? "%d " : "%d\n", p->value);
            }
        }
    }
    while (list.next != &list) {
        unlink_node(list.next);
    }
    return 0;
}`,
      explanation: `
Все четыре операции — \`O(1)\`, и все сводятся к двум функциям: вставке после узла и удалению узла. Фиктивный узел делает концы симметричными: «после стража» — начало, «после последнего» (\`list.prev\`) — конец.

Единственная проверка — пустота перед удалением: иначе \`unlink_node(list.next)\` удалил бы сам страж, а он лежит на стеке, и \`free\` для него — неопределённое поведение. Дек обобщает стек и очередь: стек — добавление и удаление с одного конца, очередь — добавление в конец и удаление из начала. Об этих структурах — следующие уроки.`,
      examples: [
        {
          in: 'push_back 1\npush_back 2\npush_front 0\nprint\npop_back\npop_front\nprint\n',
          out: '0 1 2\n2\n0\n1\n',
        },
        { in: 'pop_front\nprint\n', out: 'пусто\nпусто\n' },
      ],
      hidden: [
        { in: 'push_front 1\npush_front 2\npush_front 3\nprint\n', name: 'Только в начало' },
        { in: 'push_back 1\npush_back 2\npop_front\npop_front\npop_front\n', name: 'Как очередь' },
        { in: 'push_back 1\npush_back 2\npop_back\npop_back\npop_back\n', name: 'Как стек' },
        { in: 'push_back 5\npop_back\nprint\npush_front 6\nprint\n', name: 'Снова пустой' },
        { in: 'push_back -2147483648\npush_front 2147483647\nprint\n', name: 'Крайние значения' },
        { in: 'pop_back\npush_back 1\npop_front\npop_back\n', name: 'Удаление из пустого' },
        {
          in: 'push_back 1\npush_back 2\npush_back 3\npush_back 4\npop_front\npop_back\npush_front 9\npush_back 8\nprint\n',
          name: 'Смешанные',
        },
        {
          in: 'push_front 1\npush_back 2\npush_front 3\npush_back 4\nprint\n',
          name: 'Чередование концов',
        },
      ],
    },
    {
      title: 'Найди ошибку: удаление узла',
      bug: true,
      description: `
Программа читает \`n\`, \`x\` и \`n\` целых чисел, складывает их в двусвязный список со стражем, удаляет все узлы со значением \`x\` и печатает список вперёд, а после черты — назад.

Когда что-то удаляется, AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['1 ≤ n ≤ 1000; числа int.'],
      hints: [
        'Какие указатели ведут к удаляемому узлу? Сколько из них переставляет unlink_node?',
        'К узлу ведут две ссылки: prev->next и next->prev. Функция исправляет только первую, поэтому обход назад заходит в освобождённый узел. Добавьте node->next->prev = node->prev;.',
      ],
      starter: UNLINK(false),
      solution: UNLINK(true),
      explanation: `
На узел двусвязного списка указывают **два** соседа: левый — через \`next\`, правый — через \`prev\`. Заготовка исключает узел только из прямого направления. Обход вперёд его не видит и работает правильно, а обход назад приходит в узел по устаревшей ссылке \`prev\` — в уже освобождённую память. AddressSanitizer сообщает \`heap-use-after-free\`.

Если ничего не удалено, ошибка не проявляется, — поэтому полезно проверять структуру в **обоих** направлениях. Удаление в двусвязном списке всегда симметрично: две строки, по одной на каждого соседа.`,
      examples: [
        { in: '5 3\n1 3 2 3 4\n', out: '1 2 4 | 4 2 1\n' },
        { in: '3 9\n1 2 3\n', out: '1 2 3 | 3 2 1\n' },
      ],
      hidden: [
        '1 5\n5\n',
        '3 1\n1 2 3\n',
        '3 3\n1 2 3\n',
        '4 7\n7 7 7 7\n',
        '5 0\n0 1 0 1 0\n',
        '6 -1\n-1 2 -1 -1 3 -1\n',
        '2 2147483647\n2147483647 -2147483648\n',
        '7 4\n1 2 3 4 5 6 7\n',
      ],
    },
    {
      title: 'LRU-кэш',
      difficulty: 'advanced',
      description: `
Кэш вмещает \`C\` ключей. При обращении к ключу:

- если ключ есть в кэше — это **попадание**, ключ становится самым свежим;
- если нет — **промах**: ключ добавляется как самый свежий, а если кэш был полон, сначала вытесняется ключ, к которому дольше всего не обращались.

Первая строка — \`C\` и \`m\`, вторая — \`m\` ключей обращений. Напечатайте строку \`попаданий H, промахов M\`, а на следующей — ключи кэша от самого свежего к самому старому через пробел.

Каждое обращение должно выполняться за \`O(1)\`: храните порядок в двусвязном списке, а для каждого ключа — указатель на его узел (или \`NULL\`) в массиве.`,
      constraints: ['1 ≤ C ≤ 1000; 1 ≤ m ≤ 10⁴; 0 ≤ ключи ≤ 10⁵.'],
      hints: [
        'Список со стражем: начало — самый свежий ключ, конец (sentinel.prev) — самый старый. Массив static Node *where[100001] хранит узел каждого ключа.',
        'Попадание: вырежьте узел из списка (две ссылки) и вставьте после стража (четыре ссылки) — без malloc и free.',
        'Промах при полном кэше: удалите sentinel.prev, обнулите where[его ключа], освободите узел. Затем создайте новый узел в начале.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int key;
    struct Node *prev;
    struct Node *next;
} Node;

static Node *where[100001];

static void detach(Node *node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;
}

static void attach_front(Node *list, Node *node) {
    node->prev = list;
    node->next = list->next;
    list->next->prev = node;
    list->next = node;
}

int main(void) {
    int capacity, m;
    if (scanf("%d %d", &capacity, &m) != 2 || capacity < 1) {
        return 0;
    }
    Node list = {0, &list, &list};
    int size = 0, hits = 0, misses = 0;
    for (int i = 0; i < m; i++) {
        int key;
        if (scanf("%d", &key) != 1 || key < 0 || key > 100000) {
            break;
        }
        if (where[key] != NULL) {
            hits++;
            detach(where[key]);
            attach_front(&list, where[key]);
            continue;
        }
        misses++;
        if (size == capacity) {
            Node *oldest = list.prev;
            detach(oldest);
            where[oldest->key] = NULL;
            free(oldest);
            size--;
        }
        Node *node = malloc(sizeof *node);
        if (node == NULL) {
            return 1;
        }
        node->key = key;
        attach_front(&list, node);
        where[key] = node;
        size++;
    }
    printf("попаданий %d, промахов %d\n", hits, misses);
    for (Node *p = list.next; p != &list; p = p->next) {
        printf(p->next != &list ? "%d " : "%d\n", p->key);
    }
    while (list.next != &list) {
        Node *node = list.next;
        detach(node);
        free(node);
    }
    return 0;
}`,
      explanation: `
Две структуры делят работу. Массив \`where\` отвечает на вопрос «есть ли ключ в кэше и где его узел» за \`O(1)\` — это прямая адресация по ключу (для больших ключей здесь была бы хеш-таблица). Двусвязный список хранит порядок обращений: при попадании узел вырезается из середины и вставляется в начало, при вытеснении удаляется последний — всё за \`O(1)\`, потому что у каждого узла есть ссылка на предыдущего соседа.

Попадание не выделяет и не освобождает память — узел просто переставляется. Важная деталь вытеснения: перед \`free\` нужно обнулить \`where[oldest->key]\`, иначе следующее обращение к этому ключу нашло бы висячий указатель. Такой кэш стоит перед диском и базами данных, в процессорах (в упрощённом виде) и в браузерах.`,
      examples: [
        { in: '2 5\n1 2 1 3 2\n', out: 'попаданий 1, промахов 4\n2 3\n' },
        { in: '3 4\n7 7 7 7\n', out: 'попаданий 3, промахов 1\n7\n' },
      ],
      hidden: [
        { in: '1 4\n1 2 1 2\n', name: 'Ёмкость 1' },
        { in: '3 6\n1 2 3 1 2 3\n', name: 'Всё помещается' },
        { in: '2 6\n1 2 3 1 2 3\n', name: 'Цикл длиннее кэша' },
        { in: '3 7\n1 2 3 1 4 1 5\n', name: 'Обращение спасает от вытеснения' },
        { in: '4 1\n100000\n', name: 'Наибольший ключ' },
        { in: '2 6\n0 1 0 2 0 3\n', name: 'Частый ключ остаётся' },
        { in: '5 10\n1 2 3 4 5 5 4 3 2 1\n', name: 'Обратный порядок' },
        { in: '3 9\n9 8 7 9 6 8 9 5 9\n', name: 'Смешанные' },
      ],
    },
  ],
};
