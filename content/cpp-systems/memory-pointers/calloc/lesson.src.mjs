const numbers = (count, f) => Array.from({ length: count }, (_, i) => f(i)).join(' ');

export default {
  id: 'memory-calloc',
  title: 'calloc: обнулённая память',
  description:
    'calloc выделяет массив и заполняет его нулями: порядок аргументов, встроенная проверка переполнения, смысл нулевых байтов для чисел и указателей, счётчики, флаги, решето и матрица смежности.',
  moduleId: 'memory-pointers',
  order: 12,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['memory-malloc'],
  objectives: [
    'Выделять обнулённые массивы вызовом calloc(count, size)',
    'Сравнивать calloc с malloc и memset по безопасности и смыслу',
    'Использовать нулевое начальное состояние для счётчиков, флагов и указателей',
    'Размещать обнулённые таблицы в одном блоке',
  ],
  tags: ['C17', 'Память', 'calloc', 'Куча', 'Инициализация'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *c = calloc(4, sizeof *c);
    if (c == NULL) {
        return 1;
    }
    c[1] += 5;
    c[3]--;
    printf("%d %d %d %d\n", c[0], c[1], c[2], c[3]);
    free(c);
    return 0;
}`,
      answers: ['0 5 0 -1'],
      placeholder: 'Вывод программы',
      explain: 'calloc заполнила все четыре элемента нулями, затем изменены только c[1] и c[3].',
    },
    {
      q: 'Какие преимущества у calloc(n, sizeof *p) перед malloc(n * sizeof *p)? Выберите все.',
      options: [
        'Блок заполнен нулями',
        'calloc проверяет переполнение произведения n · size',
        'Блок не нужно освобождать',
        'calloc запоминает количество элементов для sizeof',
      ],
      correct: [0, 1],
      explain:
        'Блок calloc освобождается так же, через free. Количество элементов программа по-прежнему хранит сама.',
    },
    {
      q: 'Сколько байтов выделит calloc(10, sizeof(double))?',
      answers: ['80'],
      placeholder: 'Байтов',
      explain: '10 элементов по 8 байтов.',
    },
    {
      q: 'Массив структур с полем char *note выделен через calloc. Почему код очистки может вызывать free(items[i].note) для всех элементов без проверки?',
      options: [
        'Неиспользованные note равны NULL, а free(NULL) ничего не делает',
        'calloc запоминает, какие указатели были выделены',
        'free игнорирует указатели, не полученные от malloc',
        'Так делать нельзя',
      ],
      correct: 0,
      explain:
        'Нулевые байты в указателе — NULL на всех распространённых платформах, а free(NULL) явно разрешён стандартом.',
    },
    {
      q: 'Когда calloc не избавит от цикла заполнения?',
      options: [
        'Когда начальное значение элементов должно быть, например, −1 для int или 1.0 для double',
        'Когда элементы — числа int',
        'Когда массив больше мегабайта',
        'Когда массив двумерный',
      ],
      correct: 0,
      explain:
        'calloc заполняет только нулевыми байтами. Любое другое значение требует явного цикла.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int v = 3;
    unsigned char *m = calloc((size_t)v * v, 1);
    if (m == NULL) {
        return 1;
    }
    m[0 * v + 2] = 1;
    m[2 * v + 0] = 1;
    m[1 * v + 1] = 1;
    int sum = 0;
    for (int i = 0; i < v * v; i++) {
        sum = sum * 2 + m[i];
    }
    printf("%d\n", sum);
    free(m);
    return 0;
}`,
      answers: ['84'],
      placeholder: 'Вывод программы',
      explain: 'Байты блока: 0 0 1 0 1 0 1 0 0 — двоичное число 001010100 = 84.',
    },
    {
      q: 'Какой вызов выделяет массив из n элементов int?',
      options: [
        'calloc(n, sizeof(int))',
        'calloc(n * sizeof(int), sizeof(int))',
        'calloc(sizeof(int))',
        'calloc(n)',
      ],
      correct: 0,
      explain: 'Первый аргумент — количество элементов, второй — размер одного элемента.',
    },
  ],
  exercises: [
    {
      title: 'Гистограмма',
      difficulty: 'beginner',
      description: `
Прочитайте \`m\` и \`n\`, затем \`n\` целых чисел из диапазона \`[0, m)\`. Для каждого значения, которое встретилось хотя бы раз, напечатайте строку \`значение: количество\` — по возрастанию значения.

Массив счётчиков выделите через \`calloc\` на \`m\` элементов.`,
      constraints: ['1 ≤ m ≤ 100 000.', '1 ≤ n ≤ 1000.', '0 ≤ x < m.'],
      hints: [
        'int *count = calloc((size_t)m, sizeof *count); — все счётчики сразу равны 0.',
        'Подсчёт: count[x]++. Вывод: цикл по всем значениям 0…m−1 с пропуском нулевых счётчиков.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int m, n;
    scanf("%d %d", &m, &n);
    int *count = calloc((size_t)m, sizeof *count);
    if (count == NULL) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        count[x]++;
    }
    for (int v = 0; v < m; v++) {
        if (count[v] > 0) {
            printf("%d: %d\n", v, count[v]);
        }
    }
    free(count);
    return 0;
}`,
      explanation: `
Значение служит индексом счётчика, поэтому подсчёт идёт за одно обращение к памяти. Размер диапазона \`m\` известен только во время работы и может быть до 100 000 — массив выделяется в куче. \`calloc\` гарантирует, что каждый счётчик начинается с нуля; с \`malloc\` без цикла обнуления результат зависел бы от мусора в памяти.`,
      examples: [
        { in: '10 6\n3 7 3 0 7 3\n', out: '0: 1\n3: 3\n7: 2\n' },
        { in: '1 1\n0\n', out: '0: 1\n' },
      ],
      hidden: [
        { in: '5 5\n4 4 4 4 4\n', name: 'Одно значение' },
        { in: '5 5\n0 1 2 3 4\n', name: 'Все разные' },
        { in: '100000 3\n99999 0 99999\n', name: 'Крайние значения большого диапазона' },
        { in: '3 4\n2 1 2 1\n', name: 'Пары' },
        { in: `1000 1000\n${numbers(1000, (i) => (i * 7) % 1000)}\n`, name: 'Тысяча разных' },
        { in: `50 1000\n${numbers(1000, (i) => (i * i) % 50)}\n`, name: 'Квадраты по модулю' },
        { in: '2 3\n1 1 1\n', name: 'Ноль не встретился' },
        { in: '7 7\n6 5 4 3 2 1 0\n', name: 'Убывание' },
      ],
    },
    {
      title: 'Решето Эратосфена',
      description: `
Прочитайте \`n\` и найдите все простые числа от 2 до \`n\` решетом Эратосфена. Напечатайте их количество и наибольшее из них через пробел.

Массив флагов размера \`n + 1\` выделите через \`calloc\`.`,
      constraints: ['2 ≤ n ≤ 1 000 000.'],
      hints: [
        'unsigned char *composite = calloc((size_t)n + 1, 1); — 0 означает «пока не вычеркнуто».',
        'Внешний цикл: for (long long p = 2; p * p <= n; p++); вычёркивание начинайте с p * p.',
        'p * p для p около 1000 помещается в int, но long long избавляет от сомнений при изменении ограничений.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);
    unsigned char *composite = calloc((size_t)n + 1, 1);
    if (composite == NULL) {
        return 1;
    }
    for (long long p = 2; p * p <= n; p++) {
        if (!composite[p]) {
            for (long long k = p * p; k <= n; k += p) {
                composite[k] = 1;
            }
        }
    }
    int count = 0, largest = 0;
    for (int i = 2; i <= n; i++) {
        if (!composite[i]) {
            count++;
            largest = i;
        }
    }
    printf("%d %d\n", count, largest);
    free(composite);
    return 0;
}`,
      explanation: `
Флаг на каждое число — один байт; для \`n = 10⁶\` это мегабайт, поэтому массив в куче. Нулевое начальное состояние от \`calloc\` означает «ещё не вычеркнуто», и цикл инициализации не нужен.

Вычёркивание начинается с \`p²\`: все меньшие кратные \`p\` уже вычеркнуты меньшими простыми. Индексы доходят ровно до \`n\`, поэтому массив нужен на \`n + 1\` элемент — ошибка на единицу здесь дала бы \`heap-buffer-overflow\`.`,
      examples: [
        { in: '10\n', out: '4 7\n' },
        { in: '2\n', out: '1 2\n' },
      ],
      hidden: [
        { in: '3\n', name: 'n = 3' },
        { in: '4\n', name: 'n = 4' },
        { in: '30\n', name: 'n = 30' },
        { in: '97\n', name: 'n — простое' },
        { in: '100\n', name: 'Сто' },
        { in: '1000\n', name: 'Тысяча' },
        { in: '999983\n', name: 'Простое около миллиона' },
        { in: '1000000\n', name: 'Миллион' },
      ],
    },
    {
      title: 'Степени вершин',
      description: `
Граф имеет \`v\` вершин и \`e\` рёбер; рёбра неориентированные и могут повторяться, петель нет. Постройте матрицу смежности в одном блоке \`calloc((size_t)v * v, 1)\` и напечатайте:
- в первой строке — число **различных** рёбер;
- во второй — степени вершин 0…v−1 через пробел (число различных соседей).`,
      constraints: ['1 ≤ v ≤ 100.', '0 ≤ e ≤ 500.', '0 ≤ a, b < v, a ≠ b.'],
      hints: [
        'Флаг ребра a–b: m[a * v + b]. Ставьте оба флага: m[a * v + b] = m[b * v + a] = 1.',
        'Повторное ребро уже отмечено: увеличивайте счётчик рёбер, только если флаг был 0.',
        'Степень вершины r — сумма строки r матрицы.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int v, e;
    scanf("%d %d", &v, &e);
    unsigned char *m = calloc((size_t)v * v, 1);
    if (m == NULL) {
        return 1;
    }
    int distinct = 0;
    for (int i = 0; i < e; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        if (!m[a * v + b]) {
            m[a * v + b] = 1;
            m[b * v + a] = 1;
            distinct++;
        }
    }
    printf("%d\n", distinct);
    for (int r = 0; r < v; r++) {
        int degree = 0;
        for (int c = 0; c < v; c++) {
            degree += m[r * v + c];
        }
        printf(r + 1 < v ? "%d " : "%d\n", degree);
    }
    free(m);
    return 0;
}`,
      explanation: `
Матрица \`v × v\` хранится в одном обнулённом блоке: изначально рёбер нет. Флаг делает повторные рёбра безвредными — второе такое же ребро находит флаг уже установленным и не увеличивает счётчик.

Для 100 вершин матрица занимает 10 000 байтов — проще и надёжнее списков соседей, если граф маленький. Для больших разреженных графов используют другие структуры; они будут в модуле об алгоритмах.`,
      examples: [
        { in: '4 5\n0 1\n1 2\n2 0\n1 3\n1 0\n', out: '4\n2 3 2 1\n' },
        { in: '1 0\n', out: '0\n0\n' },
      ],
      hidden: [
        { in: '2 1\n0 1\n', name: 'Одно ребро' },
        { in: '2 3\n0 1\n1 0\n0 1\n', name: 'Повторы одного ребра' },
        { in: '5 0\n', name: 'Нет рёбер' },
        { in: '4 6\n0 1\n0 2\n0 3\n1 2\n1 3\n2 3\n', name: 'Полный граф K4' },
        { in: '5 4\n0 1\n0 2\n0 3\n0 4\n', name: 'Звезда' },
        { in: '6 5\n0 1\n1 2\n2 3\n3 4\n4 5\n', name: 'Путь' },
        {
          in: `100 99\n${Array.from({ length: 99 }, (_, i) => `${i} ${i + 1}`).join('\n')}\n`,
          name: 'Длинный путь из 100 вершин',
        },
        { in: '3 4\n0 1\n1 2\n2 1\n0 2\n', name: 'Треугольник с повтором' },
      ],
    },
    {
      title: 'Ячейки со строками',
      difficulty: 'advanced',
      description: `
Есть \`k\` ячеек, каждая может хранить слово или быть пустой. Массив указателей \`char **slots\` выделите через \`calloc\` — тогда все ячейки изначально пусты (\`NULL\`).

Обработайте \`q\` команд:
- \`set i word\` — записать в ячейку \`i\` копию слова (старое слово, если было, освободить);
- \`clear i\` — очистить ячейку;
- \`print\` — напечатать содержимое всех ячеек через пробел, пустые — как \`.\`.

В конце освободите все слова и сам массив.`,
      constraints: ['1 ≤ k ≤ 20.', '1 ≤ q ≤ 50.', 'Слова — до 20 символов без пробелов.'],
      hints: [
        'char **slots = calloc((size_t)k, sizeof *slots);',
        'set: free(slots[i]); slots[i] = копия слова (malloc(strlen + 1) и memcpy). free(NULL) безопасен, поэтому проверять старое значение не нужно.',
        'clear: free(slots[i]); slots[i] = NULL; — иначе в ячейке останется висячий указатель.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int k, q;
    scanf("%d %d", &k, &q);
    char **slots = calloc((size_t)k, sizeof *slots);
    if (slots == NULL) {
        return 1;
    }
    for (int t = 0; t < q; t++) {
        char command[8];
        scanf("%7s", command);
        if (strcmp(command, "set") == 0) {
            int i;
            char word[21];
            scanf("%d %20s", &i, word);
            size_t len = strlen(word);
            char *copy = malloc(len + 1);
            if (copy == NULL) {
                break;
            }
            memcpy(copy, word, len + 1);
            free(slots[i]);
            slots[i] = copy;
        } else if (strcmp(command, "clear") == 0) {
            int i;
            scanf("%d", &i);
            free(slots[i]);
            slots[i] = NULL;
        } else {
            for (int i = 0; i < k; i++) {
                printf(i + 1 < k ? "%s " : "%s\n", slots[i] ? slots[i] : ".");
            }
        }
    }
    for (int i = 0; i < k; i++) {
        free(slots[i]);
    }
    free(slots);
    return 0;
}`,
      explanation: `
Благодаря \`calloc\` пустая ячейка — это \`NULL\` с самого начала, и программе не нужен отдельный признак «занято». Освобождение тоже упрощается: \`free(slots[i])\` корректен и для занятой, и для пустой ячейки.

Важная деталь \`clear\`: после \`free\` указатель обнуляется. Иначе в ячейке остался бы висячий указатель, и следующий \`print\` прочитал бы освобождённую память, а следующий \`set\` или финальная очистка освободили бы её повторно.`,
      examples: [
        {
          in: '3 4\nset 0 alpha\nset 2 gamma\nprint\nprint\n',
          out: 'alpha . gamma\nalpha . gamma\n',
        },
        { in: '2 4\nset 1 x\nclear 1\nset 0 y\nprint\n', out: 'y .\n' },
      ],
      hidden: [
        { in: '1 1\nprint\n', name: 'Пустая ячейка' },
        { in: '2 3\nset 0 a\nset 0 bb\nprint\n', name: 'Перезапись' },
        { in: '2 3\nclear 0\nclear 0\nprint\n', name: 'Очистка пустой' },
        { in: '3 5\nset 0 a\nset 1 b\nset 2 c\nclear 1\nprint\n', name: 'Дыра в середине' },
        { in: '2 4\nset 0 one\nset 1 two\nclear 0\nclear 1\n', name: 'Без печати' },
        {
          in: '2 5\nset 1 abcdefghijklmnopqrst\nprint\nclear 1\nset 1 z\nprint\n',
          name: 'Длинное слово',
        },
        { in: '4 6\nset 3 d\nprint\nset 0 a\nprint\nclear 3\nprint\n', name: 'Несколько печатей' },
        { in: '20 3\nset 19 last\nset 0 first\nprint\n', name: 'Двадцать ячеек' },
      ],
    },
  ],
};
