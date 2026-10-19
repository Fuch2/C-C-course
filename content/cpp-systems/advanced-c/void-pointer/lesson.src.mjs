const WORDS = (fixed) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    void *data;
    size_t size, capacity, elem_size;
} Vector;

static void *vector_at(const Vector *v, size_t i) {
    return (char *)v->data + i * v->elem_size;
}

static int vector_push(Vector *v, const void *elem) {
    if (v->size == v->capacity) {
        size_t bigger = v->capacity ? v->capacity * 2 : 4;
        void *grown = realloc(v->data, bigger * v->elem_size);
        if (grown == NULL) {
            return 0;
        }
        v->data = grown;
        v->capacity = bigger;
    }
    memcpy(vector_at(v, v->size), elem, v->elem_size);
    v->size++;
    return 1;
}

typedef struct {
    char word[16];
    int count;
} Entry;

static Entry *find(const Vector *v, const char *word) {
    for (size_t i = 0; i < v->size; i++) {
        Entry *e = vector_at(v, i);
        if (strcmp(e->word, word) == 0) {
            return e;
        }
    }
    return NULL;
}

int main(void) {
    Vector entries = {NULL, 0, 0, sizeof(Entry)};
${fixed ? '    Entry *best = NULL;\n    size_t best_index = 0;' : '    Entry *best = NULL;'}
    char word[16];
    while (scanf("%15s", word) == 1) {
        Entry *e = find(&entries, word);
        if (e == NULL) {
            Entry fresh;
            strcpy(fresh.word, word);
            fresh.count = 0;
            if (!vector_push(&entries, &fresh)) {
                free(entries.data);
                return 1;
            }
            e = vector_at(&entries, entries.size - 1);
        }
        e->count++;
${
  fixed
    ? '        best = vector_at(&entries, best_index);\n        if (entries.size == 1 || e->count > best->count) {\n            best_index = (size_t)(e - (Entry *)entries.data);\n        }'
    : '        if (best == NULL || e->count > best->count) {\n            best = e;\n        }'
}
    }
    if (entries.size == 0) {
        printf("слов нет\n");
        return 0;
    }
    for (size_t i = 0; i < entries.size; i++) {
        const Entry *e = vector_at(&entries, i);
        printf("%s %d\n", e->word, e->count);
    }
${fixed ? '    best = vector_at(&entries, best_index);\n' : ''}    printf("чаще всего: %s (%d)\n", best->word, best->count);
    free(entries.data);
    return 0;
}`;

const PROJECT = String.raw`
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    void *data;
    size_t size, capacity, elem_size;
} Vector;

typedef struct {
    int x, y;
} Point;

static void vector_init(Vector *v, size_t elem_size) {
    v->data = NULL;
    v->size = 0;
    v->capacity = 0;
    v->elem_size = elem_size;
}

static void *slot(const Vector *v, size_t i) {
    return (char *)v->data + i * v->elem_size;
}

static int vector_reserve(Vector *v, size_t n) {
    if (n <= v->capacity) {
        return 1;
    }
    if (n > SIZE_MAX / v->elem_size) {
        return 0;
    }
    void *grown = realloc(v->data, n * v->elem_size);
    if (grown == NULL) {
        return 0;
    }
    v->data = grown;
    v->capacity = n;
    return 1;
}

static int grow_if_full(Vector *v) {
    if (v->size < v->capacity) {
        return 1;
    }
    if (v->capacity > SIZE_MAX / 2) {
        return 0;
    }
    return vector_reserve(v, v->capacity ? v->capacity * 2 : 4);
}

static int vector_push(Vector *v, const void *elem) {
    if (!grow_if_full(v)) {
        return 0;
    }
    memcpy(slot(v, v->size), elem, v->elem_size);
    v->size++;
    return 1;
}

static int vector_pop(Vector *v, void *out) {
    if (v->size == 0) {
        return 0;
    }
    v->size--;
    memcpy(out, slot(v, v->size), v->elem_size);
    return 1;
}

static void *vector_get(const Vector *v, size_t i) {
    return i < v->size ? slot(v, i) : NULL;
}

static int vector_insert(Vector *v, size_t i, const void *elem) {
    if (!grow_if_full(v)) {
        return 0;
    }
    memmove(slot(v, i + 1), slot(v, i), (v->size - i) * v->elem_size);
    memcpy(slot(v, i), elem, v->elem_size);
    v->size++;
    return 1;
}

static int vector_remove(Vector *v, size_t i, void *out) {
    if (i >= v->size) {
        return 0;
    }
    memcpy(out, slot(v, i), v->elem_size);
    memmove(slot(v, i), slot(v, i + 1), (v->size - i - 1) * v->elem_size);
    v->size--;
    return 1;
}

static void vector_free(Vector *v) {
    free(v->data);
    vector_init(v, v->elem_size);
}

// ---- Операции над элементами конкретных типов ----
typedef int ReadElem(void *out);
typedef void PrintElem(const void *elem);
typedef int CompareElem(const void *a, const void *b);

static int read_int(void *out) {
    return scanf("%d", (int *)out) == 1;
}

static void print_int(const void *elem) {
    printf("%d", *(const int *)elem);
}

static int compare_int(const void *a, const void *b) {
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}

static int read_point(void *out) {
    Point *p = out;
    return scanf("%d %d", &p->x, &p->y) == 2;
}

static void print_point(const void *elem) {
    const Point *p = elem;
    printf("(%d, %d)", p->x, p->y);
}

static int compare_point(const void *a, const void *b) {
    const Point *p = a, *q = b;
    if (p->x != q->x) {
        return (p->x > q->x) - (p->x < q->x);
    }
    return (p->y > q->y) - (p->y < q->y);
}

static void print_line(const void *elem, PrintElem *print) {
    print(elem);
    putchar('\n');
}

// Возвращает 0 при нехватке памяти.
static int run(Vector *v, const char *cmd, ReadElem *read, PrintElem *print, CompareElem *cmp) {
    union {
        int i;
        Point p;
    } elem;                                        // места хватает для любого элемента
    size_t k;
    if (strcmp(cmd, "push") == 0) {
        return !read(&elem) || vector_push(v, &elem);
    }
    if (strcmp(cmd, "pop") == 0) {
        if (vector_pop(v, &elem)) {
            print_line(&elem, print);
        } else {
            puts("пусто");
        }
    } else if (strcmp(cmd, "get") == 0 && scanf("%zu", &k) == 1) {
        void *found = vector_get(v, k);
        if (found != NULL) {
            print_line(found, print);
        } else {
            puts("ошибка индекса");
        }
    } else if (strcmp(cmd, "set") == 0 && scanf("%zu", &k) == 1 && read(&elem)) {
        void *found = vector_get(v, k);
        if (found != NULL) {
            memcpy(found, &elem, v->elem_size);
        } else {
            puts("ошибка индекса");
        }
    } else if (strcmp(cmd, "insert") == 0 && scanf("%zu", &k) == 1 && read(&elem)) {
        if (k > v->size) {
            puts("ошибка индекса");
        } else if (!vector_insert(v, k, &elem)) {
            return 0;
        }
    } else if (strcmp(cmd, "remove") == 0 && scanf("%zu", &k) == 1) {
        if (vector_remove(v, k, &elem)) {
            print_line(&elem, print);
        } else {
            puts("ошибка индекса");
        }
    } else if (strcmp(cmd, "sort") == 0) {
        if (v->size > 1) {
            qsort(v->data, v->size, v->elem_size, cmp);
        }
    } else if (strcmp(cmd, "print") == 0) {
        if (v->size == 0) {
            puts("пусто");
        }
        for (size_t i = 0; i < v->size; i++) {
            print(slot(v, i));
            putchar(i + 1 < v->size ? ' ' : '\n');
        }
    } else if (strcmp(cmd, "info") == 0) {
        printf("size=%zu capacity=%zu\n", v->size, v->capacity);
    } else if (strcmp(cmd, "reserve") == 0 && scanf("%zu", &k) == 1) {
        return vector_reserve(v, k);
    }
    return 1;
}

int main(void) {
    Vector ints, points;
    vector_init(&ints, sizeof(int));
    vector_init(&points, sizeof(Point));
    char which[4], cmd[16];
    int ok = 1;
    while (ok && scanf("%3s %15s", which, cmd) == 2) {
        if (strcmp(which, "i") == 0) {
            ok = run(&ints, cmd, read_int, print_int, compare_int);
        } else if (strcmp(which, "p") == 0) {
            ok = run(&points, cmd, read_point, print_point, compare_point);
        }
    }
    vector_free(&ints);
    vector_free(&points);
    return ok ? 0 : 1;
}`;

export default {
  id: 'advanced-void-pointer',
  title: 'Обобщённые контейнеры: void * и размер элемента',
  description:
    'Обобщённый динамический массив на void *: данные, количество, вместимость и размер элемента; адрес элемента через char *; копирование по адресу; значения и указатели, владение и функция уничтожения элемента; недолговечность указателя на элемент; qsort над контейнером; типизированные обёртки; void * и неполные типы.',
  moduleId: 'advanced-c',
  order: 15,
  difficulty: 'advanced',
  estimatedMinutes: 70,
  prerequisites: ['advanced-callbacks'],
  objectives: [
    'Проектировать контейнер, который хранит элементы любого типа по их размеру',
    'Вычислять адреса элементов и копировать значения через void * и memcpy',
    'Решать вопрос владения элементами-указателями с помощью функции уничтожения',
    'Не хранить указатели на элементы контейнера между его изменениями',
  ],
  tags: ['void *', 'Обобщённый контейнер', 'Динамический массив', 'memcpy', 'Владение'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Как вычислить адрес элемента номер i в обобщённом векторе с полями void *data и size_t elem_size?',
      options: [
        '(char *)data + i * elem_size',
        'data + i',
        'data + i * elem_size',
        '(int *)data + i',
      ],
      correct: 0,
      explain:
        'Смещение считается в байтах, поэтому data приводят к char *. Арифметика с void * в стандартном C запрещена, а приведение к int * верно только для вектора int.',
    },
    {
      q: 'Вектор хранит int. Как правильно добавить в него число 42 функцией int vector_push(Vector *v, const void *elem)?',
      options: [
        'int x = 42; vector_push(&v, &x);',
        'vector_push(&v, 42);',
        'vector_push(&v, (void *)42);',
        'vector_push(&v, "42");',
      ],
      correct: 0,
      explain:
        'push копирует elem_size байтов по переданному адресу. Значение нужно положить в переменную и передать её адрес; (void *)42 — адрес 42, по которому ничего нет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    double storage[4];
    void *data = storage;
    size_t elem_size = sizeof(double);
    for (int i = 0; i < 4; i++) {
        double value = i * 1.5;
        memcpy((char *)data + i * elem_size, &value, elem_size);
    }
    double third;
    memcpy(&third, (char *)data + 2 * elem_size, elem_size);
    printf("%.1f\n", third);
    return 0;
}`,
      answers: ['3.0'],
      placeholder: 'Вывод программы',
      explain:
        'Элемент с индексом 2 лежит со смещением 2 · 8 байтов, и в нём записано 2 · 1.5 = 3.0.',
    },
    {
      q: 'Вектор хранит строки как char *, и ему передана функция уничтожения элемента. Что эта функция получает аргументом?',
      options: [
        'Адрес элемента — значение типа char **, которое нужно разыменовать перед free',
        'Саму строку типа char *',
        'Указатель на весь вектор',
        'Номер элемента',
      ],
      correct: 0,
      explain:
        'Обобщённый вектор знает только адреса элементов. Элемент здесь — указатель, значит, его адрес — указатель на указатель: free(*(char **)elem).',
    },
    {
      q: 'Почему указатель int *first = vector_get(&v, 0); нельзя использовать после vector_push(&v, &x);?',
      options: [
        'push может вызвать realloc, который переместит данные, и first будет указывать в освобождённую память',
        'push обнуляет первый элемент',
        'vector_get возвращает копию, а не адрес',
        'Можно: адрес первого элемента никогда не меняется',
      ],
      correct: 0,
      explain:
        'Любое изменение размера может переместить блок. Указатель на элемент действителен до следующего изменения контейнера, а надолго запоминают индекс.',
    },
    {
      q: 'Какие сведения о векторе нужны, чтобы отсортировать его элементы функцией qsort? Выберите все.',
      options: [
        'Адрес данных',
        'Количество элементов',
        'Размер элемента',
        'Функция сравнения для типа элементов',
        'Вместимость',
      ],
      correct: [0, 1, 2, 3],
      explain:
        'qsort(data, size, elem_size, cmp) — ровно те же сведения, что хранит обобщённый вектор. Вместимость для сортировки не нужна: сортируются только существующие элементы.',
    },
    {
      q: 'Какой размер элемента нужно указать для вектора, хранящего указатели на строки?',
      answers: ['sizeof(char *)', 'sizeof (char *)'],
      placeholder: 'Выражение',
      explain:
        'Элемент вектора — указатель, а не символ и не строка. sizeof(char) скопировал бы один байт указателя.',
    },
    {
      q: 'Почему для непрозрачных дескрипторов лучше typedef struct Stack Stack;, чем typedef void *Stack;?',
      options: [
        'С неполным типом компилятор не даст передать Queue * туда, где ждут Stack *; с void * все дескрипторы взаимозаменяемы',
        'void * занимает больше памяти',
        'Неполный тип быстрее разыменовывается',
        'void * нельзя вернуть из функции',
      ],
      correct: 0,
      explain:
        'void * стирает тип, и путаница дескрипторов не будет замечена. Неполные структуры — разные типы, поэтому ошибка видна при компиляции.',
    },
  ],
  exercises: [
    {
      title: 'Обобщённый максимум',
      difficulty: 'beginner',
      description: `
Напишите обобщённую функцию поиска максимума

\`\`\`c
typedef int Compare(const void *a, const void *b);
const void *max_element(const void *base, size_t count, size_t size, Compare *cmp);
\`\`\`

Она возвращает адрес **первого** наибольшего элемента массива или \`NULL\`, если \`count == 0\`. Функция сравнения возвращает отрицательное число, ноль или положительное — как у \`qsort\`.

Ввод состоит из блоков до конца ввода. Блок начинается с типа и количества элементов \`n\`:
- \`int n\` и \`n\` целых чисел — напечатайте наибольшее;
- \`double n\` и \`n\` чисел — напечатайте наибольшее с двумя знаками после точки;
- \`student n\` и \`n\` пар \`имя баллы\` — напечатайте \`имя баллы\` студента с наибольшими баллами (первого из равных).

Если \`n = 0\`, напечатайте \`пусто\`. Для всех трёх типов используйте одну функцию \`max_element\` и три функции сравнения.`,
      constraints: [
        '0 ≤ n ≤ 100; имена — до 15 символов; баллы — целые от 0 до 100; блоков не больше 10.',
      ],
      hints: [
        'Внутри max_element храните указатель best на текущий максимум и сравнивайте с ним каждый элемент: const char *p = (const char *)base + i * size.',
        'Строгое сравнение cmp(p, best) > 0 оставляет первым из равных тот элемент, что встретился раньше.',
        'Для студентов заведите структуру { char name[16]; int score; } и функцию сравнения только по score.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef int Compare(const void *a, const void *b);

static const void *max_element(const void *base, size_t count, size_t size, Compare *cmp) {
    if (count == 0) {
        return NULL;
    }
    const char *best = base;
    for (size_t i = 1; i < count; i++) {
        const char *p = (const char *)base + i * size;
        if (cmp(p, best) > 0) {
            best = p;
        }
    }
    return best;
}

typedef struct {
    char name[16];
    int score;
} Student;

static int compare_int(const void *a, const void *b) {
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}

static int compare_double(const void *a, const void *b) {
    double x = *(const double *)a, y = *(const double *)b;
    return (x > y) - (x < y);
}

static int compare_student(const void *a, const void *b) {
    const Student *s = a, *t = b;
    return (s->score > t->score) - (s->score < t->score);
}

int main(void) {
    char type[16];
    int n;
    while (scanf("%15s %d", type, &n) == 2 && n >= 0 && n <= 100) {
        if (strcmp(type, "int") == 0) {
            int values[100];
            for (int i = 0; i < n; i++) {
                if (scanf("%d", &values[i]) != 1) {
                    return 0;
                }
            }
            const int *best = max_element(values, (size_t)n, sizeof values[0], compare_int);
            if (best == NULL) {
                puts("пусто");
            } else {
                printf("%d\n", *best);
            }
        } else if (strcmp(type, "double") == 0) {
            double values[100];
            for (int i = 0; i < n; i++) {
                if (scanf("%lf", &values[i]) != 1) {
                    return 0;
                }
            }
            const double *best = max_element(values, (size_t)n, sizeof values[0], compare_double);
            if (best == NULL) {
                puts("пусто");
            } else {
                printf("%.2f\n", *best);
            }
        } else {
            Student group[100];
            for (int i = 0; i < n; i++) {
                if (scanf("%15s %d", group[i].name, &group[i].score) != 2) {
                    return 0;
                }
            }
            const Student *best = max_element(group, (size_t)n, sizeof group[0], compare_student);
            if (best == NULL) {
                puts("пусто");
            } else {
                printf("%s %d\n", best->name, best->score);
            }
        }
    }
    return 0;
}`,
      explanation: `
\`max_element\` не знает, что сравнивает: она двигается по массиву шагами по \`size\` байтов (через \`const char *\`) и спрашивает у функции сравнения, больше ли текущий элемент. Возвращается адрес, а не значение — функция не может вернуть «значение любого типа», а адрес подходит для всех.

Результат приводится обратно к нужному типу при присваивании: \`const int *best = max_element(...)\` — \`const void *\` неявно превращается в \`const int *\`. Это и есть место, где ответственность за тип лежит на программисте: компилятор не проверит, что массив действительно состоит из \`int\`.

Строгое \`> 0\` в сравнении делает результат устойчивым: из равных выбирается первый. Так же ведёт себя \`std::max_element\` в C++.`,
      examples: [
        { in: 'int 5 3 9 2 9 1\ndouble 3 1.5 -2 0.25\n', out: '9\n1.50\n' },
        { in: 'student 3 ann 90 bob 95 cid 95\nint 0\n', out: 'bob 95\nпусто\n' },
      ],
      hidden: [
        { in: 'int 1 -7\n', name: 'Один элемент' },
        { in: 'int 4 -5 -2 -9 -2\n', name: 'Отрицательные' },
        { in: 'double 2 0.004 0.003\n', name: 'Маленькие дробные' },
        { in: 'student 1 solo 0\n', name: 'Один студент' },
        { in: 'student 4 a 10 b 20 c 20 d 5\n', name: 'Первый из равных' },
        { in: 'double 0\nstudent 0\n', name: 'Пустые блоки' },
        { in: 'int 3 2147483647 -2147483648 0\n', name: 'Крайние int' },
        { in: 'int 2 1 2\ndouble 2 2 1\nstudent 2 x 1 y 2\n', name: 'Все типы' },
      ],
    },
    {
      title: 'Найди ошибку: указатель после роста',
      bug: true,
      description: `
Программа считает, сколько раз встречается каждое слово ввода, и хранит пары «слово — количество» в обобщённом векторе. Она печатает слова в порядке первого появления с их количеством, а затем \`чаще всего: СЛОВО (K)\` — слово, которое **первым** достигло наибольшего количества. Если слов нет, печатается \`слов нет\`.

На коротких входах всё работает, а на длинных AddressSanitizer сообщает \`heap-use-after-free\`. Найдите и исправьте ошибку.`,
      constraints: ['Слов не больше 200, каждое до 15 символов.'],
      hints: [
        'Указатель best ссылается на элемент внутри блока entries.data. Что происходит с этим блоком, когда вектор растёт?',
        'vector_push может вызвать realloc, и best становится висячим. Храните индекс лучшего элемента, а указатель получайте заново через vector_at, когда он нужен.',
      ],
      starter: WORDS(false),
      solution: WORDS(true),
      explanation: `
\`best\` хранит адрес элемента внутри блока \`entries.data\`. Когда в вектор добавляется пятое различное слово, \`vector_push\` вызывает \`realloc\`: блок переезжает, старый освобождается, а \`best\` продолжает указывать в него. Следующее сравнение \`e->count > best->count\` читает освобождённую память — это и находит AddressSanitizer.

Индекс не зависит от расположения блока: элемент номер 3 остаётся элементом номер 3 после любого роста. Поэтому долгоживущие ссылки на элементы контейнера хранят индексами, а указатель получают через \`vector_at\` непосредственно перед использованием. Так же устроены итераторы \`std::vector\` в C++: они становятся недействительными после роста.`,
      examples: [
        { in: 'кот пёс кот\n', out: 'кот 2\nпёс 1\nчаще всего: кот (2)\n' },
        {
          in: 'a b c d e f a b a\n',
          out: 'a 3\nb 2\nc 1\nd 1\ne 1\nf 1\nчаще всего: a (3)\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'one\n', name: 'Одно слово' },
        { in: 'x y z w v u x\n', name: 'Повтор после роста' },
        { in: 'a b c d e f g h i j k l m n o p q\n', name: 'Много разных слов' },
        { in: 'b a b a\n', name: 'Ничья' },
        { in: 'w1 w2 w3 w4 w5 w5 w4 w5\n', name: 'Лидер меняется' },
        { in: 'z z z z z z\n', name: 'Одно слово много раз' },
        {
          in: 'alpha beta gamma delta epsilon zeta eta theta iota kappa alpha beta alpha\n',
          name: 'Длинный текст',
        },
      ],
    },
    {
      id: 'advanced-project-vector',
      title: 'Обобщённый динамический массив',
      difficulty: 'advanced',
      description: `
Реализуйте обобщённый динамический массив \`Vector\` на \`void *\` и с его помощью обработайте команды для **двух** векторов: целых чисел (\`i\`) и точек (\`p\`, структура \`{ int x, y; }\`). Код контейнера должен быть один для обоих типов: он знает только размер элемента.

Интерфейс контейнера:
- \`vector_init(v, elem_size)\` — пустой вектор, вместимость 0;
- \`vector_reserve(v, n)\` — если \`n\` больше вместимости, вместимость становится ровно \`n\`, данные сохраняются;
- \`vector_push(v, elem)\` — добавить в конец; при заполненном векторе вместимость удваивается (с 0 — до 4);
- \`vector_pop(v, out)\` — снять последний элемент, скопировав его в \`out\`;
- \`vector_get(v, i)\` — адрес элемента или \`NULL\` при \`i ≥ size\`;
- \`vector_insert(v, i, elem)\` — вставить перед позицией \`i\` (\`0 ≤ i ≤ size\`), сдвинув хвост; рост — как у \`push\`;
- \`vector_remove(v, i, out)\` — удалить элемент \`i\`, скопировав его в \`out\`;
- \`vector_free(v)\`.

Команды до конца ввода — \`ВЕКТОР КОМАНДА [аргументы]\`, где \`ВЕКТОР\` — \`i\` или \`p\`, а элемент записывается одним числом \`X\` или парой \`X Y\`:
- \`push элемент\`; \`pop\` — напечатать снятый элемент или \`пусто\`;
- \`get K\` — напечатать элемент или \`ошибка индекса\`; \`set K элемент\` — заменить или напечатать \`ошибка индекса\`;
- \`insert K элемент\` — вставить (при \`K > size\` — \`ошибка индекса\`); \`remove K\` — удалить и напечатать элемент или \`ошибка индекса\`;
- \`sort\` — по возрастанию (точки — по \`x\`, затем по \`y\`) с помощью \`qsort\`;
- \`print\` — элементы через пробел или \`пусто\`; \`info\` — \`size=S capacity=C\`; \`reserve N\`.

Точка печатается как \`(X, Y)\`. После последней команды освободите оба вектора; при нехватке памяти завершите программу с ненулевым кодом. Тесты проверяют вывод и диагностику памяти.`,
      constraints: [
        'Команд не больше 300; числа — int; индексы K и N — от 0 до 10⁶.',
        'Сдвиг хвоста при вставке и удалении — memmove: области пересекаются.',
      ],
      hints: [
        'Сначала напишите и проверьте контейнер: функцию slot(v, i) для адреса элемента, затем reserve, push, pop, get, insert и remove. В каждой функции работайте только с байтами и elem_size.',
        'Чтобы не писать обработку команд дважды, передайте в общую функцию run указатели на функции чтения, печати и сравнения элемента: read_int/read_point, print_int/print_point, compare_int/compare_point.',
        'Временный элемент любого из двух типов можно хранить в объединении union { int i; Point p; } — его размера хватит для обоих.',
      ],
      solution: PROJECT,
      explanation: `
Контейнер не знает о \`int\` и \`Point\`: все его функции работают с адресами, количеством байтов и \`memcpy\`/\`memmove\`. Тип элементов появляется только в функциях чтения, печати и сравнения, которые передаются в \`run\` как указатели на функции. Так одна логика обработки команд обслуживает оба вектора — без копирования кода и без \`switch\` по типу.

Инварианты: \`size ≤ capacity\`, инициализированы только элементы \`[0, size)\`. \`reserve\` при отказе \`realloc\` возвращает 0 и не трогает старый блок — состояние вектора сохраняется. Произведение \`n * elem_size\` проверяется на переполнение до вызова \`realloc\`.

Вставка и удаление сдвигают хвост через \`memmove\`: источник и приёмник — части одного блока, и \`memcpy\` здесь была бы неопределённым поведением. Сортировка — обычная \`qsort\`: обобщённый вектор хранит ровно те сведения, которые ей нужны. \`vector_get\` возвращает адрес, действительный до следующего изменения вектора, поэтому \`run\` пользуется им сразу.`,
      examples: [
        {
          in: 'i push 5\ni push 7\ni push 9\ni get 1\ni insert 0 1\ni print\ni remove 2\ni print\ni info\n',
          out: '7\n1 5 7 9\n7\n1 5 9\nsize=3 capacity=4\n',
        },
        {
          in: 'p push 3 1\np push 1 2\np push 3 0\np sort\np print\np pop\np get 5\np info\n',
          out: '(1, 2) (3, 0) (3, 1)\n(3, 1)\nошибка индекса\nsize=2 capacity=4\n',
        },
      ],
      hidden: [
        {
          in: 'i push 1\ni push 2\ni push 3\ni push 4\ni push 5\ni push 6\ni push 7\ni push 8\ni push 9\ni info\n',
          name: 'Рост 4 → 8 → 16',
        },
        {
          in: 'i reserve 10\ni info\ni push 1\ni reserve 5\ni info\ni push 2\ni push 3\ni push 4\ni push 5\ni push 6\ni push 7\ni push 8\ni push 9\ni push 10\ni push 11\ni info\n',
          name: 'reserve и удвоение после него',
        },
        {
          in: 'i insert 1 5\ni insert 0 5\ni insert 1 6\ni insert 1 7\ni print\n',
          name: 'Вставка',
        },
        {
          in: 'p push 1 1\np set 0 9 9\np set 1 0 0\np print\np pop\np pop\np push 5 5\np print\np info\n',
          name: 'Замена, снять всё и добавить снова',
        },
        {
          in: 'i push 3\ni push -1\ni push 3\ni push 0\ni push -1\ni sort\ni print\n',
          name: 'Сортировка int',
        },
        {
          in: 'i pop\ni remove 0\ni get 0\np print\ni push 1\np push 1 1\ni push 2\np push 2 2\ni print\np print\ni info\np info\n',
          name: 'Пустые и независимые векторы',
        },
        {
          in: 'i push 1\ni push 2\ni push 3\ni push 4\ni push 5\ni remove 0\ni remove 3\ni remove 1\ni print\ni info\n',
          name: 'Удаление с краёв и из середины',
        },
        {
          in: 'p push 2 3\np push 1 9\np push 2 1\np push 1 -9\np insert 2 0 0\np sort\np print\np remove 4\n',
          name: 'Сортировка точек',
        },
      ],
    },
  ],
};
