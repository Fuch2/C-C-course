const BST_BASE = String.raw`
typedef struct Node {
    int key;
    struct Node *left;
    struct Node *right;
} Node;

static Node *insert(Node *t, int key) {
    if (t == NULL) {
        Node *node = malloc(sizeof *node);
        if (node == NULL) {
            exit(1);
        }
        node->key = key;
        node->left = node->right = NULL;
        return node;
    }
    if (key < t->key) {
        t->left = insert(t->left, key);
    } else if (key > t->key) {
        t->right = insert(t->right, key);
    }
    return t;
}

static void destroy(Node *t) {
    if (t == NULL) {
        return;
    }
    destroy(t->left);
    destroy(t->right);
    free(t);
}`;

const ERASE = (fixed) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${BST_BASE}

static Node *erase(Node *t, int key) {
    if (t == NULL) {
        return NULL;
    }
    if (key < t->key) {
        t->left = erase(t->left, key);
    } else if (key > t->key) {
        t->right = erase(t->right, key);
    } else if (t->left == NULL || t->right == NULL) {
        Node *child = t->left != NULL ? t->left : t->right;
        free(t);
        return child;
    } else {
        Node *succ = t->right;
        while (succ->left != NULL) {
            succ = succ->left;
        }
        t->key = succ->key;
        ${fixed ? 't->right = erase(t->right, succ->key);' : 't->left = erase(t->left, succ->key);'}
    }
    return t;
}

static int printed;

static void inorder(const Node *t) {
    if (t == NULL) {
        return;
    }
    inorder(t->left);
    printf(printed++ ? " %d" : "%d", t->key);
    inorder(t->right);
}

int main(void) {
    Node *root = NULL;
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "print") == 0) {
            printed = 0;
            inorder(root);
            printf(printed ? "\n" : "пусто\n");
            continue;
        }
        int x;
        if (scanf("%d", &x) != 1) {
            break;
        }
        if (strcmp(command, "insert") == 0) {
            root = insert(root, x);
        } else if (strcmp(command, "erase") == 0) {
            root = erase(root, x);
        }
    }
    destroy(root);
    return 0;
}`;

export default {
  id: 'algo-bst',
  title: 'Дерево двоичного поиска',
  description:
    'Свойство упорядоченности и центральный обход; поиск и вставка за O(h); минимум, максимум, пол и потолок; удаление в трёх случаях и преемник; зависимость высоты от порядка вставки; балансирующие деревья и std::map.',
  moduleId: 'algorithms-structures',
  order: 24,
  difficulty: 'advanced',
  estimatedMinutes: 60,
  prerequisites: ['algo-tree'],
  objectives: [
    'Объяснять свойство дерева поиска и его связь с центральным обходом',
    'Реализовывать поиск, вставку и удаление',
    'Находить пол, потолок, минимум и максимум одним спуском',
    'Оценивать операции через высоту и объяснять роль балансировки',
  ],
  tags: ['Структуры данных', 'Дерево поиска', 'BST', 'Балансировка'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Ключи 5, 3, 8, 1, 4 вставлены в пустое дерево поиска в этом порядке. Какой ключ будет правым ребёнком узла 3?',
      answers: ['4'],
      placeholder: 'Ключ',
      explain:
        '5 — корень; 3 и 8 — его дети; 1 < 3 — левый ребёнок 3; 4 < 5, но > 3 — правый ребёнок 3.',
    },
    {
      q: 'Что выдаёт центральный обход дерева поиска?',
      options: [
        'Ключи по возрастанию',
        'Ключи в порядке вставки',
        'Ключи по уровням',
        'Ключи по убыванию',
      ],
      correct: 0,
      explain:
        'Сначала все меньшие ключи (левое поддерево), затем ключ узла, затем все большие — это и есть сортировка.',
    },
    {
      q: 'Является ли деревом поиска дерево: корень 8, его левый ребёнок 3, у узла 3 правый ребёнок 9?',
      options: [
        'Нет: 9 лежит в левом поддереве 8, но больше 8',
        'Да: каждый узел правильно расположен относительно своего родителя',
        'Да, если нет повторов',
        'Нельзя определить',
      ],
      correct: 0,
      explain:
        'Свойство дерева поиска относится ко всему поддереву, а не только к непосредственным детям.',
    },
    {
      q: 'Ключи 1, 2, 3, …, 100 вставлены в пустое дерево поиска по возрастанию. Какой будет высота дерева (у одного узла — 0)?',
      answers: ['99'],
      placeholder: 'Число',
      explain:
        'Каждый ключ больше всех предыдущих и уходит вправо: дерево вырождается в цепочку из 100 узлов.',
    },
    {
      q: 'Чем заменяют ключ удаляемого узла с двумя детьми?',
      options: [
        'Наименьшим ключом правого поддерева (преемником)',
        'Ключом корня',
        'Ключом левого ребёнка',
        'Нулём',
      ],
      correct: 0,
      explain:
        'Преемник больше всех ключей слева и меньше остальных ключей справа, поэтому свойство дерева сохраняется. Подойдёт и наибольший ключ левого поддерева — предшественник.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef struct Node {
    int key;
    struct Node *left, *right;
} Node;

int main(void) {
    Node a = {2, NULL, NULL}, b = {9, NULL, NULL}, c = {6, &a, &b};
    Node d = {15, NULL, NULL}, root = {12, &c, &d};
    int x = 10, best = -1;
    for (const Node *t = &root; t != NULL;) {
        if (t->key >= x) {
            best = t->key;
            t = t->left;
        } else {
            t = t->right;
        }
    }
    printf("%d\n", best);
    return 0;
}`,
      answers: ['12'],
      placeholder: 'Вывод программы',
      explain:
        'Это потолок: наименьший ключ не меньше 10. 12 ≥ 10 — кандидат, идём влево; 6 < 10 — вправо; 9 < 10 — вправо, NULL. Ответ 12.',
    },
    {
      q: 'Какие операции дерево поиска поддерживает, а хеш-таблица — нет?',
      options: [
        'Найти наибольший ключ, не превышающий x',
        'Обойти ключи по возрастанию',
        'Найти минимум за O(h)',
        'Проверить, есть ли ключ',
      ],
      correct: [0, 1, 2],
      explain: 'Хеш-таблица не хранит порядок ключей. Проверять наличие ключа умеют обе структуры.',
    },
    {
      q: 'Почему std::map гарантирует O(log n) на операцию при любом порядке вставки?',
      options: [
        'Это самобалансирующееся дерево: после изменений оно перестраивается поворотами и держит высоту O(log n)',
        'std::map — это хеш-таблица',
        'std::map сортирует ключи перед вставкой',
        'Не гарантирует',
      ],
      correct: 0,
      explain:
        'Обычно std::map — красно-чёрное дерево. Стандарт требует логарифмическую сложность, поэтому простое несбалансированное дерево не подошло бы.',
    },
  ],
  exercises: [
    {
      title: 'Вставка и поиск',
      difficulty: 'beginner',
      description: `
Реализуйте множество целых чисел на дереве двоичного поиска и выполните команды: \`insert x\` (повторная вставка ничего не меняет) и \`find x\` (напечатать \`да\` или \`нет\`). В конце напечатайте все ключи по возрастанию через пробел или \`пусто\` и освободите дерево.`,
      constraints: ['Команд не больше 2000; числа int; ключи вставляются в случайном порядке.'],
      hints: [
        'insert возвращает корень поддерева: если t == NULL — новый узел, иначе спуск влево или вправо с присваиванием t->left = insert(t->left, key).',
        'find — цикл: пока t не NULL, сравнивайте ключ и переходите в нужное поддерево. Ключи по возрастанию — центральный обход.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${BST_BASE}

static bool contains(const Node *t, int key) {
    while (t != NULL) {
        if (key == t->key) {
            return true;
        }
        t = key < t->key ? t->left : t->right;
    }
    return false;
}

static int printed;

static void inorder(const Node *t) {
    if (t == NULL) {
        return;
    }
    inorder(t->left);
    printf(printed++ ? " %d" : "%d", t->key);
    inorder(t->right);
}

int main(void) {
    Node *root = NULL;
    char command[8];
    int x;
    while (scanf("%7s %d", command, &x) == 2) {
        if (strcmp(command, "insert") == 0) {
            root = insert(root, x);
        } else if (strcmp(command, "find") == 0) {
            printf("%s\n", contains(root, x) ? "да" : "нет");
        }
    }
    inorder(root);
    printf(printed ? "\n" : "пусто\n");
    destroy(root);
    return 0;
}`,
      explanation: `
Поиск идёт от корня вниз: на каждом узле сравнение отбрасывает одно из поддеревьев. Вставка проходит тот же путь и подвешивает новый лист туда, где поиск упёрся в \`NULL\`. Обе операции — \`O(h)\`; при случайном порядке ключей \`h\` около \`2,5 · log₂ n\`.

Возврат корня из \`insert\` убирает особый случай пустого дерева: \`root = insert(NULL, x)\` создаёт корень, а на каждом уровне рекурсии присваивание \`t->left = …\` либо ничего не меняет, либо подвешивает новый лист. Центральный обход печатает ключи по возрастанию — это следствие свойства дерева поиска.`,
      examples: [
        {
          in: 'insert 8\ninsert 3\ninsert 10\nfind 3\nfind 5\ninsert 3\n',
          out: 'да\nнет\n3 8 10\n',
        },
        { in: 'find 1\n', out: 'нет\nпусто\n' },
      ],
      hidden: [
        { in: '', name: 'Нет команд' },
        { in: 'insert 5\nfind 5\nfind 4\nfind 6\n', name: 'Один ключ' },
        {
          in: 'insert 3\ninsert 1\ninsert 2\ninsert 5\ninsert 4\nfind 2\nfind 4\nfind 6\n',
          name: 'Зигзаг',
        },
        {
          in: 'insert -1\ninsert -2147483648\ninsert 2147483647\nfind -2147483648\nfind 2147483647\nfind 0\n',
          name: 'Крайние значения',
        },
        { in: 'insert 7\ninsert 7\ninsert 7\nfind 7\n', name: 'Повторы' },
        {
          in: 'insert 1\ninsert 2\ninsert 3\ninsert 4\ninsert 5\nfind 5\nfind 0\n',
          name: 'По возрастанию',
        },
        {
          in: 'insert 50\ninsert 30\ninsert 70\ninsert 20\ninsert 40\ninsert 60\ninsert 80\nfind 60\nfind 65\n',
          name: 'Сбалансированное',
        },
        { in: 'insert 9\ninsert 8\ninsert 7\ninsert 6\nfind 6\nfind 10\n', name: 'По убыванию' },
      ],
    },
    {
      title: 'Пол и потолок',
      description: `
Первая строка — \`n\`, вторая — \`n\` различных целых чисел; вставьте их в дерево поиска в этом порядке. Дальше до конца ввода идут запросы \`x\`. Для каждого напечатайте через пробел **пол** — наибольший ключ, не больший \`x\`, — и **потолок** — наименьший ключ, не меньший \`x\`. Если такого ключа нет, вместо него печатается \`-\`.

Каждый запрос — один спуск от корня, \`O(h)\`. Освободите дерево.`,
      constraints: ['1 ≤ n ≤ 1000; числа int; запросов не больше 1000.'],
      hints: [
        'Пол: если t->key <= x, это кандидат — запомните его и идите вправо (может найтись больший подходящий); иначе идите влево.',
        'Потолок — зеркально: если t->key >= x, запомните и идите влево, иначе вправо. Если x есть в дереве, пол и потолок равны x.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
${BST_BASE}

static bool floor_key(const Node *t, int x, int *out) {
    bool found = false;
    while (t != NULL) {
        if (t->key <= x) {
            *out = t->key;
            found = true;
            t = t->right;
        } else {
            t = t->left;
        }
    }
    return found;
}

static bool ceil_key(const Node *t, int x, int *out) {
    bool found = false;
    while (t != NULL) {
        if (t->key >= x) {
            *out = t->key;
            found = true;
            t = t->left;
        } else {
            t = t->right;
        }
    }
    return found;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) {
        return 0;
    }
    Node *root = NULL;
    for (int i = 0; i < n; i++) {
        int key;
        if (scanf("%d", &key) != 1) {
            break;
        }
        root = insert(root, key);
    }
    int x;
    while (scanf("%d", &x) == 1) {
        int f, c;
        if (floor_key(root, x, &f)) {
            printf("%d ", f);
        } else {
            printf("- ");
        }
        if (ceil_key(root, x, &c)) {
            printf("%d\n", c);
        } else {
            printf("-\n");
        }
    }
    destroy(root);
    return 0;
}`,
      explanation: `
Спуск за полом поддерживает инвариант: лучший найденный кандидат — наибольший ключ \`≤ x\` среди уже отброшенных частей дерева, а все ключи, которые могут оказаться лучше, лежат в текущем поддереве. Если ключ узла подходит, левее него лучше не найти — все ключи там меньше, — поэтому идём вправо. Если не подходит, не подходит и всё правое поддерево.

Потолок — зеркальная задача. Обе функции — один путь от корня до листа, \`O(h)\`. Отсортированный массив отвечает на те же вопросы нижней и верхней границей, а хеш-таблица — никак: она не хранит порядок.`,
      examples: [
        { in: '9\n8 3 10 1 6 14 4 7 13\n5\n8\n12\n0\n20\n', out: '4 6\n8 8\n10 13\n- 1\n14 -\n' },
        { in: '1\n5\n5\n4\n6\n', out: '5 5\n- 5\n5 -\n' },
      ],
      hidden: [
        { in: '3\n1 2 3\n0\n4\n2\n', name: 'Цепочка' },
        { in: '3\n3 2 1\n2\n-5\n100\n', name: 'Левая цепочка' },
        { in: '5\n-10 -20 0 -15 5\n-12\n-16\n1\n', name: 'Отрицательные' },
        { in: '2\n-2147483648 2147483647\n0\n-2147483648\n2147483647\n', name: 'Крайние значения' },
        { in: '7\n50 30 70 20 40 60 80\n45\n55\n65\n75\n', name: 'Между ключами' },
        { in: '7\n50 30 70 20 40 60 80\n20\n80\n19\n81\n', name: 'Края' },
        { in: '4\n10 5 15 12\n11\n13\n', name: 'Глубокий кандидат' },
        { in: '6\n4 2 6 1 3 5\n1\n2\n3\n4\n5\n6\n7\n0\n', name: 'Все ключи' },
      ],
    },
    {
      title: 'Найди ошибку: удаление',
      bug: true,
      description: `
Программа выполняет команды над деревом поиска: \`insert x\`, \`erase x\` (удалить, если есть) и \`print\` (ключи по возрастанию или \`пусто\`).

После удаления некоторых ключей в выводе появляются повторы. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 2000; числа int.'],
      hints: [
        'Какой случай удаления ломается: лист, один ребёнок или два? Попробуйте удалить корень дерева 5 3 8.',
        'Преемник — наименьший ключ правого поддерева, и удалять его нужно оттуда же: t->right = erase(t->right, succ->key). Удаление из левого поддерева ничего не находит, и ключ преемника остаётся в дереве дважды.',
      ],
      starter: ERASE(false),
      solution: ERASE(true),
      explanation: `
Когда у удаляемого узла два ребёнка, его ключ заменяется ключом преемника, а сам преемник удаляется из **правого** поддерева, где он лежит. Заготовка вызывает удаление в левом поддереве: там все ключи меньше преемника, поиск ничего не находит, и узел-преемник остаётся на месте. Ключ оказывается в дереве дважды — в узле, который мы «удалили», и в самом преемнике.

Ошибка проявляется только в случае двух детей, поэтому удаление листьев и узлов с одним ребёнком работает. Тесты для удаления должны покрывать все три случая — и удаление корня.`,
      examples: [
        { in: 'insert 5\ninsert 3\ninsert 8\nerase 3\nprint\n', out: '5 8\n' },
        { in: 'insert 5\ninsert 3\ninsert 8\nerase 5\nprint\n', out: '3 8\n' },
      ],
      hidden: [
        'insert 1\nerase 1\nprint\n',
        'insert 5\ninsert 3\ninsert 8\ninsert 7\ninsert 9\nerase 8\nprint\n',
        'insert 50\ninsert 30\ninsert 70\ninsert 60\ninsert 80\ninsert 65\nerase 50\nprint\nerase 60\nprint\n',
        'insert 2\ninsert 1\ninsert 3\nerase 2\nerase 1\nerase 3\nprint\n',
        'insert 5\nerase 7\nprint\n',
        'insert 10\ninsert 5\ninsert 15\ninsert 12\ninsert 20\ninsert 11\nerase 10\nprint\n',
        'insert 4\ninsert 2\ninsert 6\ninsert 1\ninsert 3\ninsert 5\ninsert 7\nerase 4\nerase 2\nerase 6\nprint\n',
        'insert 8\ninsert 4\ninsert 12\nerase 8\ninsert 8\nprint\n',
      ],
    },
    {
      title: 'Проверка дерева поиска',
      difficulty: 'advanced',
      description: `
Дерево задаётся, как в уроке о бинарных деревьях: первая строка — \`n\`, дальше \`n\` строк \`ключ левый правый\` (номера детей с нуля или \`-1\`), корень — узел 0. Постройте дерево из настоящих узлов и напечатайте \`да\`, если оно — дерево двоичного поиска (ключи в левом поддереве каждого узла **строго** меньше его ключа, в правом — строго больше), и \`нет\` иначе. Освободите все узлы.`,
      constraints: ['1 ≤ n ≤ 1000; ключи int; ввод описывает корректное бинарное дерево.'],
      hints: [
        'Проверять только детей недостаточно: ключ может нарушать свойство относительно далёкого предка.',
        'Передавайте в рекурсию допустимый интервал (low, high): в левое поддерево узла с ключом k — (low, k), в правое — (k, high). Узел допустим, если low < key < high.',
        'Крайние ключи — INT_MIN и INT_MAX, поэтому границы храните в long long: начальный интервал (LLONG_MIN, LLONG_MAX) или (INT_MIN − 1, INT_MAX + 1).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int key;
    struct Node *left;
    struct Node *right;
} Node;

static bool valid(const Node *t, long long low, long long high) {
    if (t == NULL) {
        return true;
    }
    if (t->key <= low || t->key >= high) {
        return false;
    }
    return valid(t->left, low, t->key) && valid(t->right, t->key, high);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 1000) {
        return 0;
    }
    static Node *nodes[1000];
    static int left[1000], right[1000];
    for (int i = 0; i < n; i++) {
        nodes[i] = malloc(sizeof *nodes[i]);
        if (nodes[i] == NULL) {
            return 1;
        }
        scanf("%d %d %d", &nodes[i]->key, &left[i], &right[i]);
    }
    for (int i = 0; i < n; i++) {
        nodes[i]->left = left[i] >= 0 ? nodes[left[i]] : NULL;
        nodes[i]->right = right[i] >= 0 ? nodes[right[i]] : NULL;
    }
    printf("%s\n", valid(nodes[0], -2147483649LL, 2147483648LL) ? "да" : "нет");
    for (int i = 0; i < n; i++) {
        free(nodes[i]);
    }
    return 0;
}`,
      explanation: `
Свойство дерева поиска — утверждение о **всех** предках узла: каждый предок, у которого узел лежит в левом поддереве, задаёт верхнюю границу, а каждый, у которого в правом, — нижнюю. Рекурсия передаёт вниз самые сильные из этих границ — интервал \`(low, high)\`, в котором обязан лежать ключ. Это \`O(n)\`: каждый узел проверяется один раз.

Частая ошибка — сравнивать узел только с детьми: дерево \`8 → левый 3 → правый 9\` проходит такую проверку, хотя 9 больше корня. Другая — начальные границы \`INT_MIN\` и \`INT_MAX\` с нестрогой проверкой: тогда дерево из одного узла с ключом \`INT_MAX\` было бы признано неверным. Границы в \`long long\`, на единицу шире диапазона \`int\`, решают обе проблемы.

Другой способ — центральный обход: дерево поиска тогда и только тогда, когда обход выдаёт строго возрастающую последовательность.`,
      examples: [
        { in: '3\n8 1 2\n3 -1 -1\n10 -1 -1\n', out: 'да\n' },
        { in: '3\n8 1 -1\n3 -1 2\n9 -1 -1\n', out: 'нет\n' },
      ],
      hidden: [
        { in: '1\n2147483647 -1 -1\n', name: 'Один узел INT_MAX' },
        { in: '1\n-2147483648 -1 -1\n', name: 'Один узел INT_MIN' },
        { in: '2\n5 1 -1\n5 -1 -1\n', name: 'Равный ключ слева' },
        { in: '2\n5 -1 1\n5 -1 -1\n', name: 'Равный ключ справа' },
        {
          in: '7\n50 1 2\n30 3 4\n70 5 6\n20 -1 -1\n40 -1 -1\n60 -1 -1\n80 -1 -1\n',
          name: 'Правильное полное',
        },
        {
          in: '7\n50 1 2\n30 3 4\n70 5 6\n20 -1 -1\n55 -1 -1\n60 -1 -1\n80 -1 -1\n',
          name: 'Нарушение глубоко слева',
        },
        { in: '4\n1 -1 1\n2 -1 2\n3 -1 3\n4 -1 -1\n', name: 'Правая цепочка' },
        { in: '5\n10 1 2\n5 -1 -1\n15 3 4\n6 -1 -1\n20 -1 -1\n', name: 'Нарушение глубоко справа' },
      ],
    },
  ],
};
