const MATRIX_MAIN = String.raw`
int main(void) {
    int rows, cols;
    scanf("%d %d", &rows, &cols);
    struct Matrix *m = matrix_create(rows, cols);
    if (m == NULL) {
        return 1;
    }
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            scanf("%d", &m->data[r][c]);
        }
    }
    for (int r = 0; r < rows; r++) {
        long long sum = 0;
        for (int c = 0; c < cols; c++) {
            sum += m->data[r][c];
        }
        printf(r + 1 < rows ? "%lld " : "%lld\n", sum);
    }
    for (int c = 0; c < cols; c++) {
        long long sum = 0;
        for (int r = 0; r < rows; r++) {
            sum += m->data[r][c];
        }
        printf(c + 1 < cols ? "%lld " : "%lld\n", sum);
    }
    matrix_destroy(m);
    matrix_destroy(NULL);
    return 0;
}`;

const LIST_MAIN = String.raw`
int main(void) {
    struct Node *head = NULL;
    int x;
    while (scanf("%d", &x) == 1) {
        struct Node *bigger = push_front(head, x);
        if (bigger == NULL) {
            free_list(head);
            return 1;
        }
        head = bigger;
    }
    int count = 0;
    for (struct Node *n = head; n != NULL; n = n->next) {
        printf("%d ", n->value);
        count++;
    }
    printf("(%d)\n", count);
    free_list(head);
    return 0;
}`;

const STACK_MAIN = String.raw`
int main(void) {
    struct Stack s = {NULL, 0, 0};
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "push") == 0) {
            char word[32];
            scanf("%31s", word);
            if (stack_push(&s, word) != 0) {
                break;
            }
        } else if (strcmp(command, "pop") == 0) {
            char *top = stack_pop(&s);
            if (top == NULL) {
                printf("empty\n");
            } else {
                printf("%s\n", top);
                free(top);
            }
        }
    }
    printf("left %d\n", s.count);
    stack_destroy(&s);
    return 0;
}`;

export default {
  id: 'memory-free',
  title: 'free и владение памятью',
  description:
    'Договор free, висячие копии адреса, владелец и заимствование, парные функции create и destroy, освобождение вложенных блоков изнутри наружу и связанных цепочек.',
  moduleId: 'memory-pointers',
  order: 14,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['memory-realloc'],
  objectives: [
    'Соблюдать договор free: только начало блока или NULL, ровно один раз',
    'Определять владельца каждого блока и различать владение и заимствование',
    'Писать парные функции create и destroy для структур с вложенными блоками',
    'Освобождать связанные цепочки, не обращаясь к уже освобождённым узлам',
  ],
  tags: ['C23', 'Память', 'free', 'Владение', 'Деструктор'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие вызовы free допустимы? Выберите все.',
      options: [
        'free(NULL)',
        'free(p), где p = malloc(10), вызванный один раз',
        'free(p + 1), где p = malloc(10)',
        'free(&x), где x — локальная переменная',
        'free(q), где q = realloc(p, 20) вернул не NULL',
      ],
      correct: [0, 1, 4],
      explain:
        'free принимает только адрес начала блока из malloc/calloc/realloc или NULL. Середина блока и стековые объекты — неопределённое поведение.',
    },
    {
      q: 'Что делает free с переменной-указателем, переданной ей?',
      options: [
        'Ничего: указатель хранит прежний, теперь висячий адрес',
        'Записывает в неё NULL',
        'Записывает в неё случайный адрес',
        'Удаляет переменную',
      ],
      correct: 0,
      explain:
        'free получает копию адреса и не может изменить переменную. Обнулять её нужно самостоятельно.',
    },
    {
      q: 'Структура владеет массивом указателей char **items с count строками, и сама выделена malloc. Сколько вызовов free нужно для полной очистки при count = 3?',
      answers: ['5'],
      placeholder: 'Число вызовов',
      explain: 'Три строки, массив указателей и сама структура: 3 + 1 + 1 = 5.',
    },
    {
      q: 'Чем опасен цикл for (struct Node *n = head; n != NULL; n = n->next) free(n); ?',
      options: [
        'Шаг n = n->next читает поле уже освобождённого узла',
        'Он не освобождает последний узел',
        'Он освобождает каждый узел дважды',
        'Ничем, это стандартный способ',
      ],
      correct: 0,
      explain:
        'Следующий узел нужно запомнить до free текущего: next = n->next; free(n); n = next;',
    },
    {
      q: 'Функция объявлена как size_t word_count(const char *text). Должна ли она освобождать text?',
      options: [
        'Нет: она только заимствует строку на время вызова',
        'Да: она последняя использует строку',
        'Да, если строка выделена в куче',
        'Только если вернула 0',
      ],
      correct: 0,
      explain:
        'Владение не передаётся: вызывающий код освободит строку сам. Освобождение внутри привело бы к двойному free.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

static int frees = 0;

void release(int **p) {
    if (*p != NULL) {
        free(*p);
        frees++;
        *p = NULL;
    }
}

int main(void) {
    int *a = malloc(sizeof *a);
    int *b = NULL;
    release(&a);
    release(&a);
    release(&b);
    printf("%d %d\n", frees, a == NULL);
    return 0;
}`,
      answers: ['1 1'],
      placeholder: 'Вывод программы',
      explain:
        'Первый release освобождает блок и обнуляет a; второй видит NULL и ничего не делает; b был NULL с самого начала.',
    },
    {
      q: 'Почему функцию destroy удобно делать безопасной для NULL и частично заполненных структур?',
      options: [
        'Её можно вызывать на любой ветке ошибки создания, не проверяя, что успели выделить',
        'Так быстрее работает free',
        'Иначе компилятор выдаст предупреждение',
        'Это требование стандарта',
      ],
      correct: 0,
      explain:
        'Если структура выделена calloc, незаполненные указатели — NULL, и destroy освобождает ровно то, что существует.',
    },
  ],
  exercises: [
    {
      title: 'Матрица: создать и уничтожить',
      difficulty: 'beginner',
      description: `
Реализуйте пару функций для матрицы, хранящей строки в отдельных блоках:

\`\`\`c
struct Matrix {
    int rows, cols;
    int **data;      // rows указателей на строки по cols элементов
};

struct Matrix *matrix_create(int rows, int cols);  // нули; NULL при ошибке, без утечек
void matrix_destroy(struct Matrix *m);             // как free: принимает и NULL
\`\`\`

Функция \`main\` дана: читает матрицу, печатает суммы строк, затем суммы столбцов.`,
      constraints: ['1 ≤ rows, cols ≤ 20.', '|x| ≤ 10⁶.'],
      hints: [
        'Выделяйте структуру и массив указателей через calloc — тогда незаполненные строки равны NULL, и matrix_destroy можно вызвать при любой ошибке.',
        'Строки: m->data[r] = calloc((size_t)cols, sizeof *m->data[r]);',
        'matrix_destroy: if (m == NULL) return; затем строки (если data не NULL), массив data, сама структура.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Matrix {
    int rows, cols;
    int **data;
};

struct Matrix *matrix_create(int rows, int cols) {
    return NULL;
}

void matrix_destroy(struct Matrix *m) {
}
${MATRIX_MAIN}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Matrix {
    int rows, cols;
    int **data;
};

void matrix_destroy(struct Matrix *m) {
    if (m == NULL) {
        return;
    }
    if (m->data != NULL) {
        for (int r = 0; r < m->rows; r++) {
            free(m->data[r]);
        }
    }
    free(m->data);
    free(m);
}

struct Matrix *matrix_create(int rows, int cols) {
    struct Matrix *m = calloc(1, sizeof *m);
    if (m == NULL) {
        return NULL;
    }
    m->rows = rows;
    m->cols = cols;
    m->data = calloc((size_t)rows, sizeof *m->data);
    if (m->data == NULL) {
        matrix_destroy(m);
        return NULL;
    }
    for (int r = 0; r < rows; r++) {
        m->data[r] = calloc((size_t)cols, sizeof *m->data[r]);
        if (m->data[r] == NULL) {
            matrix_destroy(m);
            return NULL;
        }
    }
    return m;
}
${MATRIX_MAIN}`,
      explanation: `
Структура и массив указателей выделены через \`calloc\`, поэтому в любой момент создания каждый ещё не выделенный указатель равен \`NULL\`. Это позволяет на каждой ветке ошибки вызывать одну и ту же \`matrix_destroy\`: она освободит ровно то, что успели выделить, — \`free(NULL)\` ничего не делает.

Порядок освобождения — изнутри наружу: строки, массив указателей на них, структура. Если освободить структуру первой, адреса строк станут недоступны.`,
      examples: [
        { in: '2 3\n1 2 3\n4 5 6\n', out: '6 15\n5 7 9\n' },
        { in: '1 1\n-7\n', out: '-7\n-7\n' },
      ],
      hidden: [
        { in: '1 4\n1 2 3 4\n', name: 'Одна строка' },
        { in: '4 1\n1\n2\n3\n4\n', name: 'Один столбец' },
        { in: '2 2\n1000000 1000000\n1000000 1000000\n', name: 'Большие значения' },
        { in: '3 3\n1 0 0\n0 1 0\n0 0 1\n', name: 'Единичная матрица' },
        { in: '2 3\n-1 -2 -3\n-4 -5 -6\n', name: 'Отрицательные' },
        {
          in: `20 20\n${Array.from({ length: 20 }, (_, r) => Array.from({ length: 20 }, (_, c) => r - c).join(' ')).join('\n')}\n`,
          name: 'Матрица 20×20',
        },
        { in: '3 2\n0 0\n0 0\n0 0\n', name: 'Нули' },
        { in: '2 5\n1 2 3 4 5\n5 4 3 2 1\n', name: 'Зеркальные строки' },
      ],
    },
    {
      title: 'Цепочка узлов',
      description: `
Реализуйте две функции для односвязной цепочки:

\`\`\`c
struct Node *push_front(struct Node *head, int value);  // новый узел в начало; NULL при ошибке
void free_list(struct Node *head);                       // освободить все узлы
\`\`\`

Функция \`main\` дана: читает числа до конца ввода, добавляет каждое в начало цепочки, печатает цепочку и количество узлов, затем освобождает её.`,
      constraints: ['Чисел — от 0 до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'push_front: struct Node *node = malloc(sizeof *node); node->value = value; node->next = head; return node;',
        'free_list: while (head != NULL) { struct Node *next = head->next; free(head); head = next; }',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

struct Node *push_front(struct Node *head, int value) {
    return NULL;
}

void free_list(struct Node *head) {
}
${LIST_MAIN}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

struct Node *push_front(struct Node *head, int value) {
    struct Node *node = malloc(sizeof *node);
    if (node == NULL) {
        return NULL;
    }
    node->value = value;
    node->next = head;
    return node;
}

void free_list(struct Node *head) {
    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
}
${LIST_MAIN}`,
      explanation: `
Каждый узел — отдельный блок, и цепочка владеет ими всеми через поле \`next\`. Освобождение идёт от головы: адрес следующего узла сохраняется в локальной переменной **до** \`free\`, потому что после него поле \`head->next\` читать нельзя.

Если \`push_front\` не смогла выделить узел, она возвращает \`NULL\`, а старая цепочка не теряется: \`main\` по-прежнему хранит её в \`head\` и освобождает.`,
      examples: [
        { in: '1 2 3\n', out: '3 2 1 (3)\n' },
        { in: '', out: '(0)\n' },
      ],
      hidden: [
        { in: '42\n', name: 'Один узел' },
        { in: '5 5 5 5\n', name: 'Одинаковые' },
        { in: '-1000000000 1000000000\n', name: 'Крайние значения' },
        {
          in: `${Array.from({ length: 1000 }, (_, i) => i).join(' ')}\n`,
          name: 'Тысяча узлов',
        },
        { in: '0 -1 0 -1\n', name: 'Чередование' },
        { in: '9 8 7 6 5 4 3 2 1\n', name: 'Убывание' },
        { in: '1\n2\n3\n4\n', name: 'По одному в строке' },
        { in: '100 200\n', name: 'Два узла' },
      ],
    },
    {
      title: 'Найди ошибку: free для части блока',
      bug: true,
      description: `
Программа читает строку в блок из кучи, разбивает её на слова **на месте** (заменяя пробелы на \`'\\0'\`) и печатает слова в обратном порядке. Слова печатаются правильно, но затем программа аварийно завершается.

Найдите ошибку в освобождении памяти и исправьте её.`,
      constraints: [
        'Строка — до 200 символов, слова разделены одним пробелом.',
        'Слов — от 1 до 50.',
      ],
      hints: [
        'Сколько блоков выделено через malloc? А сколько раз вызывается free?',
        'words[i] указывают внутрь одного блока line. Освобождать нужно только его начало — один раз: free(line).',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char *line = malloc(256);
    if (line == NULL || fgets(line, 256, stdin) == NULL) {
        free(line);
        return 1;
    }
    line[strcspn(line, "\n")] = '\0';
    char *words[50];
    int count = 0;
    char *p = line;
    while (*p != '\0' && count < 50) {
        words[count++] = p;
        char *space = strchr(p, ' ');
        if (space == NULL) {
            break;
        }
        *space = '\0';
        p = space + 1;
    }
    for (int i = count - 1; i >= 0; i--) {
        printf(i > 0 ? "%s " : "%s\n", words[i]);
    }
    for (int i = 0; i < count; i++) {
        free(words[i]);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char *line = malloc(256);
    if (line == NULL || fgets(line, 256, stdin) == NULL) {
        free(line);
        return 1;
    }
    line[strcspn(line, "\n")] = '\0';
    char *words[50];
    int count = 0;
    char *p = line;
    while (*p != '\0' && count < 50) {
        words[count++] = p;
        char *space = strchr(p, ' ');
        if (space == NULL) {
            break;
        }
        *space = '\0';
        p = space + 1;
    }
    for (int i = count - 1; i >= 0; i--) {
        printf(i > 0 ? "%s " : "%s\n", words[i]);
    }
    free(line);
    return 0;
}`,
      explanation: `
Блок в куче один — \`line\`. Элементы \`words\` — не отдельные блоки, а указатели **внутрь** него: они заимствуют память у \`line\`. \`free(words[0])\` случайно совпадает с \`free(line)\`, а \`free(words[1])\` получает адрес середины блока — неопределённое поведение, AddressSanitizer сообщает \`attempting free on address which was not malloc()-ed\`. Даже с одним словом всё было бы неверно, если бы слово не стояло в начале.

Правило: количество вызовов \`free\` равно количеству успешных выделений, и каждый получает адрес, который вернула функция выделения.`,
      examples: [
        { in: 'one two three\n', out: 'three two one\n' },
        { in: 'alone\n', out: 'alone\n' },
      ],
      hidden: [
        { in: 'a b\n', name: 'Два слова' },
        { in: 'x y z w\n', name: 'Четыре однобуквенных' },
        { in: 'memory is not free\n', name: 'Предложение' },
        { in: 'repeat repeat repeat\n', name: 'Повторы' },
        { in: 'a bb ccc dddd eeeee\n', name: 'Растущая длина' },
        { in: 'last', name: 'Без перевода строки' },
        { in: '1 2 3 4 5 6 7 8 9 10\n', name: 'Десять слов' },
        { in: 'C is fun\n', name: 'Три слова' },
      ],
    },
    {
      title: 'Передача владения',
      difficulty: 'advanced',
      description: `
Реализуйте стек строк, который **владеет** копиями слов:

\`\`\`c
struct Stack {
    char **items;
    int count, capacity;
};

int stack_push(struct Stack *s, const char *word);  // копирует слово; 0 — успех, -1 — ошибка
char *stack_pop(struct Stack *s);                   // отдаёт владение вызывающему; NULL, если пусто
void stack_destroy(struct Stack *s);                // освобождает оставшиеся слова и массив
\`\`\`

Функция \`main\` дана: команды \`push слово\` и \`pop\` до конца ввода; \`pop\` печатает слово (или \`empty\`) и освобождает его. В конце печатается \`left N\` и вызывается \`stack_destroy\`.`,
      constraints: ['Команд — до 100.', 'Слова — до 31 символа.'],
      hints: [
        'stack_push: при count == capacity — realloc массива указателей (ёмкость ×2, начиная с 4); затем копия слова через malloc(strlen + 1).',
        'stack_pop: return s->items[--s->count]; — указатель больше не хранится в стеке, теперь его освобождает получатель.',
        'stack_destroy: free каждой оставшейся строки, затем free(s->items); саму структуру освобождать не нужно — она локальная в main.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Stack {
    char **items;
    int count, capacity;
};

int stack_push(struct Stack *s, const char *word) {
    return -1;
}

char *stack_pop(struct Stack *s) {
    return NULL;
}

void stack_destroy(struct Stack *s) {
}
${STACK_MAIN}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Stack {
    char **items;
    int count, capacity;
};

int stack_push(struct Stack *s, const char *word) {
    if (s->count == s->capacity) {
        int capacity = s->capacity ? s->capacity * 2 : 4;
        char **bigger = realloc(s->items, (size_t)capacity * sizeof *bigger);
        if (bigger == NULL) {
            return -1;
        }
        s->items = bigger;
        s->capacity = capacity;
    }
    size_t len = strlen(word);
    char *copy = malloc(len + 1);
    if (copy == NULL) {
        return -1;
    }
    memcpy(copy, word, len + 1);
    s->items[s->count++] = copy;
    return 0;
}

char *stack_pop(struct Stack *s) {
    if (s->count == 0) {
        return NULL;
    }
    return s->items[--s->count];
}

void stack_destroy(struct Stack *s) {
    for (int i = 0; i < s->count; i++) {
        free(s->items[i]);
    }
    free(s->items);
    s->items = NULL;
    s->count = 0;
    s->capacity = 0;
}
${STACK_MAIN}`,
      explanation: `
Владение каждой строкой переходит по ясным правилам: \`stack_push\` создаёт копию, и с этого момента за неё отвечает стек; \`stack_pop\` убирает указатель из стека и **передаёт** владение вызывающему коду — поэтому \`main\` освобождает полученную строку. Всё, что осталось в стеке к концу, освобождает \`stack_destroy\`.

Если бы \`stack_pop\` освобождала строку сама и возвращала указатель, вызывающий код получил бы висячий адрес. Если бы \`main\` не вызывала \`free\` после \`pop\`, строки утекали бы. Ясный договор владения закрывает обе ошибки.`,
      examples: [
        { in: 'push a\npush b\npop\npush c\n', out: 'b\nleft 2\n' },
        { in: 'pop\n', out: 'empty\nleft 0\n' },
      ],
      hidden: [
        { in: 'push x\npop\npop\n', name: 'Pop из пустого после работы' },
        {
          in: 'push one\npush two\npush three\npush four\npush five\n',
          name: 'Рост ёмкости без pop',
        },
        {
          in: 'push 1\npush 2\npush 3\npush 4\npush 5\npop\npop\npop\npop\npop\npop\n',
          name: 'Опустошение',
        },
        { in: 'push abcdefghijklmnopqrstuvwxyz01234\npop\n', name: 'Длинное слово' },
        { in: 'push a\npop\npush b\npop\npush c\npop\n', name: 'Чередование' },
        {
          in: `${Array.from({ length: 50 }, (_, i) => `push w${i}`).join('\n')}\n${'pop\n'.repeat(10)}`,
          name: 'Пятьдесят слов',
        },
        { in: 'push same\npush same\npop\n', name: 'Одинаковые слова' },
        { in: 'push only\n', name: 'Одно слово остаётся' },
      ],
    },
  ],
};
