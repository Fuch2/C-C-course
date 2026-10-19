const SIFT = (fixed) => String.raw`
#include <stdio.h>

static int data[1000];
static int size = 0;

static void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

static void push(int x) {
    int i = size++;
    data[i] = x;
    while (i > 0 && data[(i - 1) / 2] > data[i]) {
        swap(&data[(i - 1) / 2], &data[i]);
        i = (i - 1) / 2;
    }
}

static int pop(void) {
    int top = data[0];
    data[0] = data[--size];
    int i = 0;
    for (;;) {
${
  fixed
    ? `        int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < size && data[l] < data[smallest]) {
            smallest = l;
        }
        if (r < size && data[r] < data[smallest]) {
            smallest = r;
        }
        if (smallest == i) {
            break;
        }
        swap(&data[i], &data[smallest]);
        i = smallest;`
    : `        int child = 2 * i + 1;
        if (child >= size || data[child] >= data[i]) {
            break;
        }
        swap(&data[i], &data[child]);
        i = child;`
}
    }
    return top;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 1000) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        push(x);
    }
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", pop());
    }
    return 0;
}`;

export default {
  id: 'algo-heap',
  title: 'Куча и очередь с приоритетом',
  description:
    'Очередь с приоритетом и её операции; двоичная куча в массиве и свойство кучи; просеивание вверх и вниз за O(log n); построение кучи за O(n); сортировка кучей; применение: k лучших, слияние списков, медиана; std::priority_queue.',
  moduleId: 'algorithms-structures',
  order: 25,
  difficulty: 'advanced',
  estimatedMinutes: 60,
  prerequisites: ['algo-bst'],
  objectives: [
    'Объяснять свойство кучи и её хранение в массиве',
    'Реализовывать вставку и извлечение минимума за O(log n)',
    'Строить кучу за O(n) и сортировать кучей',
    'Применять кучи к задачам о k лучших элементах и медиане',
  ],
  tags: ['Структуры данных', 'Куча', 'Очередь с приоритетом', 'Сортировка'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Min-куча хранится в массиве [2, 5, 3, 9, 6]. Где находится наименьший элемент?',
      options: [
        'В ячейке 0 — корне',
        'В последней ячейке',
        'В любой ячейке',
        'Его нужно искать линейным поиском',
      ],
      correct: 0,
      explain:
        'Свойство кучи гарантирует, что корень не больше всех потомков, то есть всех элементов.',
    },
    {
      q: 'Является ли массив [1, 4, 2, 3, 5] min-кучей?',
      options: [
        'Нет: у узла 4 (индекс 1) ребёнок 3 (индекс 3) меньше родителя',
        'Да',
        'Нет: массив не отсортирован',
        'Нет: 2 меньше 4',
      ],
      correct: 0,
      explain:
        'Дети индекса 1 — индексы 3 и 4: значения 3 и 5. 3 < 4 — свойство кучи нарушено. Порядок между братьями (4 и 2) не важен.',
    },
    {
      q: 'В min-кучу [1, 3, 2, 7, 4] добавили 0. Каким станет массив после просеивания вверх?',
      answers: ['0 3 1 7 4 2'],
      placeholder: 'Элементы через пробел',
      explain:
        '0 встаёт в ячейку 5, его родитель — ячейка 2 (значение 2): обмен. Родитель ячейки 2 — корень 1: обмен. Получается 0 3 1 7 4 2.',
    },
    {
      q: 'Из min-кучи [1, 3, 2, 7, 4] извлекли минимум. Каким станет массив?',
      answers: ['2 3 4 7'],
      placeholder: 'Элементы через пробел',
      explain:
        'Последний элемент 4 встаёт в корень: [4, 3, 2, 7]. Меньший ребёнок — 2 (ячейка 2): обмен — [2, 3, 4, 7]. У ячейки 2 детей нет.',
    },
    {
      q: 'Почему при просеивании вниз узел меняют с меньшим из детей?',
      options: [
        'Меньший ребёнок станет родителем другого ребёнка и будет не больше его — свойство кучи сохранится',
        'Так меньше обменов',
        'Больший ребёнок может не существовать',
        'Это не важно',
      ],
      correct: 0,
      explain:
        'Если поднять больший ребёнок, он окажется родителем меньшего — и свойство кучи нарушится.',
    },
    {
      q: 'Какова сложность построения кучи из n готовых элементов просеиванием вниз от узла n/2 − 1 к корню?',
      options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'],
      correct: 0,
      explain:
        'Большинство узлов находятся у листьев и просеиваются на малую высоту. Сумма высот всех узлов полного дерева — O(n).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::priority_queue<int> q;
    for (int x : {4, 8, 1, 6}) {
        q.push(x);
    }
    q.pop();
    std::cout << q.top() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['6'],
      placeholder: 'Вывод программы',
      explain:
        'std::priority_queue по умолчанию — max-куча: pop убирает 8, на вершине оказывается 6.',
    },
    {
      q: 'Какие утверждения о сортировке кучей верны?',
      options: [
        'Она гарантирует O(n log n) на любом входе',
        'Она сортирует на месте',
        'Она устойчива',
        'На практике она обычно медленнее быстрой сортировки из-за плохой работы с кэшем',
      ],
      correct: [0, 1, 3],
      explain:
        'Обмен корня с последним элементом переносит элементы далеко — сортировка кучей неустойчива.',
    },
  ],
  exercises: [
    {
      title: 'Очередь с приоритетом',
      difficulty: 'beginner',
      description: `
Реализуйте очередь с приоритетом на min-куче в массиве и выполните команды:

- \`push x\` — добавить элемент;
- \`pop\` — извлечь и напечатать наименьший элемент;
- \`top\` — напечатать наименьший элемент, не извлекая;
- \`size\` — напечатать число элементов.

Если для \`pop\` или \`top\` очередь пуста, напечатайте \`пусто\`.`,
      constraints: ['Команд не больше 2000; числа int.'],
      hints: [
        'push: элемент в конец массива, затем пока родитель (i − 1) / 2 больше — обмен и подъём.',
        'pop: запомните data[0], поставьте на его место data[size − 1], уменьшите size и просейте корень вниз, каждый раз выбирая меньшего из существующих детей.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static int data[2000];
static int size = 0;

static void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

static void push(int x) {
    int i = size++;
    data[i] = x;
    while (i > 0 && data[(i - 1) / 2] > data[i]) {
        swap(&data[(i - 1) / 2], &data[i]);
        i = (i - 1) / 2;
    }
}

static int pop(void) {
    int top = data[0];
    data[0] = data[--size];
    int i = 0;
    for (;;) {
        int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < size && data[l] < data[smallest]) {
            smallest = l;
        }
        if (r < size && data[r] < data[smallest]) {
            smallest = r;
        }
        if (smallest == i) {
            break;
        }
        swap(&data[i], &data[smallest]);
        i = smallest;
    }
    return top;
}

int main(void) {
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "push") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            push(x);
        } else if (strcmp(command, "pop") == 0 || strcmp(command, "top") == 0) {
            if (size == 0) {
                printf("пусто\n");
            } else {
                printf("%d\n", command[0] == 'p' ? pop() : data[0]);
            }
        } else if (strcmp(command, "size") == 0) {
            printf("%d\n", size);
        }
    }
    return 0;
}`,
      explanation: `
Куча поддерживает один инвариант: каждый родитель не больше детей. Вставка может нарушить его только на пути от нового листа к корню — просеивание вверх чинит этот путь. Извлечение ставит в корень последний элемент — нарушение возможно только на пути от корня вниз, его чинит просеивание через меньшего ребёнка.

Обе операции проходят не больше высоты полного дерева — \`⌊log₂ n⌋\` шагов, а \`top\` — просто \`data[0]\`. Пустая очередь проверяется до обращения к корню: в пустой куче \`data[0]\` — устаревшее значение.`,
      examples: [
        { in: 'push 5\npush 2\npush 8\ntop\npop\npop\nsize\n', out: '2\n2\n5\n1\n' },
        { in: 'pop\npush 3\ntop\n', out: 'пусто\n3\n' },
      ],
      hidden: [
        { in: 'size\ntop\n', name: 'Пустая' },
        { in: 'push 3\npush 1\npush 2\npop\npop\npop\npop\n', name: 'Все по порядку' },
        { in: 'push 5\npush 5\npush 5\npop\nsize\n', name: 'Равные' },
        {
          in: 'push -1\npush -2147483648\npush 2147483647\npop\npop\npop\n',
          name: 'Крайние значения',
        },
        {
          in: 'push 9\npush 8\npush 7\npush 6\npush 5\npush 4\npush 3\npush 2\npush 1\npop\npop\npop\npop\n',
          name: 'Убывающие вставки',
        },
        {
          in: 'push 1\npush 2\npush 3\npush 4\npush 5\npush 6\npush 7\npop\npop\npop\npop\npop\npop\npop\n',
          name: 'Возрастающие вставки',
        },
        {
          in: 'push 4\npop\npush 2\npush 6\npop\npush 1\ntop\npop\npop\npop\n',
          name: 'Чередование',
        },
        {
          in: 'push 10\npush 3\npush 7\npush 1\npush 8\npush 2\npop\npush 0\npop\npop\npop\n',
          name: 'Смешанные',
        },
      ],
    },
    {
      title: 'Сортировка кучей',
      description: `
Прочитайте \`n\` и \`n\` целых чисел и отсортируйте их по неубыванию сортировкой кучей **на месте**: постройте max-кучу просеиванием вниз от узла \`n / 2 − 1\` к корню, затем \`n − 1\` раз обменивайте корень с последним элементом кучи и просеивайте новый корень. Напечатайте результат.`,
      constraints: ['1 ≤ n ≤ 10⁵; числа int.'],
      hints: [
        'Функция sift_down(a, n, i) для max-кучи: среди i и его детей (если они < n) выберите наибольший; если это не i — обмен и продолжение с позиции ребёнка.',
        'Сортировка: for (end = n − 1; end > 0; end--) { обмен a[0] и a[end]; sift_down(a, end, 0); } — куча занимает a[0…end − 1].',
      ],
      solution: String.raw`
#include <stdio.h>

static int a[100000];

static void sift_down(int n, int i) {
    for (;;) {
        int largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && a[l] > a[largest]) {
            largest = l;
        }
        if (r < n && a[r] > a[largest]) {
            largest = r;
        }
        if (largest == i) {
            return;
        }
        int t = a[i];
        a[i] = a[largest];
        a[largest] = t;
        i = largest;
    }
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    for (int i = n / 2 - 1; i >= 0; i--) {
        sift_down(n, i);
    }
    for (int end = n - 1; end > 0; end--) {
        int t = a[0];
        a[0] = a[end];
        a[end] = t;
        sift_down(end, 0);
    }
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", a[i]);
    }
    return 0;
}`,
      explanation: `
Массив делится на две части: в начале — max-куча, в конце — уже отсортированные наибольшие элементы. Инвариант: \`a[end + 1…n − 1]\` — наибольшие элементы по порядку, а \`a[0…end]\` — куча из остальных. Корень кучи — наибольший из оставшихся, поэтому обмен ставит его в позицию \`end\`, на своё окончательное место.

Построение кучи — \`O(n)\`, затем \`n − 1\` просеиваний по \`O(log n)\` — всего \`O(n log n)\` на любом входе, без дополнительной памяти и без рекурсии. Это худший случай лучше, чем у быстрой сортировки, но константа больше: просеивание прыгает по массиву, и кэш процессора помогает хуже.`,
      examples: [
        { in: '7\n4 10 3 5 1 8 2\n', out: '1 2 3 4 5 8 10\n' },
        { in: '1\n-9\n', out: '-9\n' },
      ],
      hidden: [
        '2\n2 1\n',
        '5\n1 2 3 4 5\n',
        '5\n5 4 3 2 1\n',
        '6\n7 7 7 7 7 7\n',
        '9\n3 1 4 1 5 9 2 6 5\n',
        '5\n2147483647 -2147483648 0 -1 1\n',
        '10\n10 1 9 2 8 3 7 4 6 5\n',
        '12\n0 0 1 1 0 0 1 1 0 0 1 1\n',
      ],
    },
    {
      title: 'Найди ошибку: просеивание вниз',
      bug: true,
      description: `
Программа читает \`n\` и \`n\` целых чисел, складывает их в min-кучу и извлекает все по одному — должна получиться сортировка по неубыванию.

На некоторых входах порядок неверный. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 1000; числа int.'],
      hints: [
        'Какого ребёнка рассматривает просеивание вниз? Что будет, если меньший элемент — правый ребёнок?',
        'Нужно выбрать наименьшего из существующих детей (левого 2i + 1 и правого 2i + 2) и меняться с ним, если он меньше узла.',
      ],
      starter: SIFT(false),
      solution: SIFT(true),
      explanation: `
Заготовка просеивает вниз только через **левого** ребёнка. Если левый ребёнок не меньше узла, просеивание останавливается — даже когда правый ребёнок меньше. Тогда в корне остаётся не минимум, и следующее извлечение вернёт неверный элемент. А если левый ребёнок меньше, но больше правого, левый станет родителем меньшего — свойство кучи снова нарушено.

Чтобы после обмена каждый родитель был не больше детей, наверх нужно поднимать **наименьшего** из детей. Ошибка проявляется не на каждом входе — только когда наименьший элемент оказывается правым ребёнком, — поэтому кучу стоит проверять на многих перестановках.`,
      examples: [
        { in: '5\n5 2 8 1 9\n', out: '1 2 5 8 9\n' },
        { in: '3\n1 2 3\n', out: '1 2 3\n' },
      ],
      hidden: [
        '4\n1 3 2 4\n',
        '6\n6 5 4 3 2 1\n',
        '7\n1 5 2 6 7 3 4\n',
        '8\n3 1 4 1 5 9 2 6\n',
        '5\n2 2 1 1 3\n',
        '9\n9 1 8 2 7 3 6 4 5\n',
        '10\n1 10 2 9 3 8 4 7 5 6\n',
        '6\n-1 -3 -2 0 -5 -4\n',
      ],
    },
    {
      title: 'Медиана потока на двух кучах',
      difficulty: 'advanced',
      description: `
Как в уроке о сортировке вставками: первая строка — \`n\`, дальше \`n\` чисел, и после каждого числа нужно напечатать медиану прочитанных — элемент с номером \`(k − 1) / 2\` среди \`k\` отсортированных (для чётного \`k\` — меньший из двух средних).

Теперь \`n\` до 10⁵, и вставка в отсортированный массив (\`O(n²)\`) не успеет. Используйте две кучи: max-кучу для меньшей половины и min-кучу для большей — \`O(log n)\` на число.`,
      constraints: ['1 ≤ n ≤ 10⁵; числа int.'],
      hints: [
        'Инвариант: все элементы low (max-куча) не больше всех элементов high (min-куча), и размер low равен размеру high или больше на 1. Тогда медиана — корень low.',
        'Новое x: если low пуста или x ≤ корня low — в low, иначе в high. Затем выровняйте размеры: если low больше high на 2, перенесите корень low в high; если high больше low, перенесите корень high в low.',
        'Max-кучу удобно получить из min-кучи, храня числа со знаком минус: но −INT_MIN не помещается в int. Храните в long long или напишите кучу с функцией сравнения.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef struct {
    long long data[100000];
    int size;
} MinHeap;

static void swap(long long *a, long long *b) {
    long long t = *a;
    *a = *b;
    *b = t;
}

static void heap_push(MinHeap *h, long long x) {
    int i = h->size++;
    h->data[i] = x;
    while (i > 0 && h->data[(i - 1) / 2] > h->data[i]) {
        swap(&h->data[(i - 1) / 2], &h->data[i]);
        i = (i - 1) / 2;
    }
}

static long long heap_pop(MinHeap *h) {
    long long top = h->data[0];
    h->data[0] = h->data[--h->size];
    int i = 0;
    for (;;) {
        int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < h->size && h->data[l] < h->data[smallest]) {
            smallest = l;
        }
        if (r < h->size && h->data[r] < h->data[smallest]) {
            smallest = r;
        }
        if (smallest == i) {
            break;
        }
        swap(&h->data[i], &h->data[smallest]);
        i = smallest;
    }
    return top;
}

static MinHeap low, high;   // low хранит числа со знаком минус: это max-куча меньшей половины

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) {
        return 0;
    }
    for (int k = 0; k < n; k++) {
        long long x;
        if (scanf("%lld", &x) != 1) {
            break;
        }
        if (low.size == 0 || x <= -low.data[0]) {
            heap_push(&low, -x);
        } else {
            heap_push(&high, x);
        }
        if (low.size > high.size + 1) {
            heap_push(&high, -heap_pop(&low));
        } else if (high.size > low.size) {
            heap_push(&low, -heap_pop(&high));
        }
        printf("%lld\n", -low.data[0]);
    }
    return 0;
}`,
      explanation: `
Две кучи делят прочитанные числа пополам: в \`low\` — меньшая половина, в \`high\` — большая. Корень \`low\` — наибольший из меньших, корень \`high\` — наименьший из больших; это два средних элемента. Поддерживая размер \`low\` равным \`high\` или на единицу больше, получаем медиану в корне \`low\` — ровно элемент \`(k − 1) / 2\`.

Каждое число — одна вставка и, возможно, один перенос между кучами: \`O(log n)\`. Для \`10⁵\` чисел это около \`3·10⁶\` операций против \`5·10⁹\` у вставок в отсортированный массив. Max-куча получена из min-кучи заменой знака; числа хранятся в \`long long\`, потому что \`−INT_MIN\` в \`int\` не помещается — это было бы переполнение.`,
      examples: [
        { in: '5\n5 15 1 3 8\n', out: '5\n5\n5\n3\n5\n' },
        { in: '1\n-2147483648\n', out: '-2147483648\n' },
      ],
      hidden: [
        { in: '2\n2 1\n', name: 'Два числа' },
        { in: '6\n1 2 3 4 5 6\n', name: 'Возрастание' },
        { in: '6\n6 5 4 3 2 1\n', name: 'Убывание' },
        { in: '5\n7 7 7 7 7\n', name: 'Равные' },
        { in: '6\n2147483647 -2147483648 0 2147483647 -2147483648 0\n', name: 'Крайние значения' },
        { in: '7\n10 1 9 2 8 3 7\n', name: 'Скачки' },
        { in: '8\n5 5 1 1 9 9 5 5\n', name: 'Повторы' },
        { in: '10\n-5 3 -1 0 4 -2 2 1 -3 -4\n', name: 'Отрицательные и положительные' },
      ],
    },
  ],
};
