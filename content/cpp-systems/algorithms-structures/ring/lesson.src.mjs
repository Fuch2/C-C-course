const WRAP = (fixed) => String.raw`
#include <stdio.h>
#include <string.h>

enum { CAPACITY = 4 };

static int next_index(int i) {
    i++;
    if (i ${fixed ? '==' : '>'} CAPACITY) {
        i = 0;
    }
    return i;
}

int main(void) {
    int data[CAPACITY];
    int head = 0, tail = 0, size = 0;
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "push") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            if (size == CAPACITY) {
                printf("полон\n");
                continue;
            }
            data[tail] = x;
            tail = next_index(tail);
            size++;
        } else if (strcmp(command, "pop") == 0) {
            if (size == 0) {
                printf("пусто\n");
                continue;
            }
            printf("%d\n", data[head]);
            head = next_index(head);
            size--;
        }
    }
    return 0;
}`;

export default {
  id: 'algo-ring',
  title: 'Кольцевой буфер',
  description:
    'Очередь на массиве с заворотом индексов; реализация со счётчиком; полный и пустой буфер: счётчик или пустая ячейка; ёмкость-степень двойки и битовая маска; режим перезаписи и последние N значений.',
  moduleId: 'algorithms-structures',
  order: 21,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['algo-queue'],
  objectives: [
    'Реализовывать кольцевой буфер со счётчиком элементов',
    'Различать полный и пустой буфер',
    'Заменять остаток от деления маской для ёмкости-степени двойки',
    'Хранить последние N значений потока и строить на буфере дек',
  ],
  tags: ['Структуры данных', 'Кольцевой буфер', 'Очередь', 'Embedded'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Кольцевой буфер ёмкости 5, head = 3, size = 4. В какую ячейку запишет следующий push?',
      answers: ['2'],
      placeholder: 'Индекс',
      explain: '(head + size) % capacity = (3 + 4) % 5 = 2. Элементы лежат в ячейках 3, 4, 0, 1.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int data[3];
    int head = 0, size = 0;
    for (int x = 1; x <= 5; x++) {
        if (size == 3) {
            head = (head + 1) % 3;
            size--;
        }
        data[(head + size) % 3] = x;
        size++;
    }
    for (int i = 0; i < size; i++) {
        printf("%d ", data[(head + i) % 3]);
    }
    printf("\n");
    return 0;
}`,
      answers: ['3 4 5'],
      placeholder: 'Вывод программы',
      explain:
        'Когда буфер полон, самое старое значение выбрасывается и записывается новое — остаются три последних числа.',
    },
    {
      q: 'Почему в кольцевом буфере только с индексами head и tail нельзя заполнить все ячейки?',
      options: [
        'И в пустом, и в полном буфере head == tail — их не различить',
        'Последняя ячейка массива недоступна',
        'tail не может быть равен 0',
        'Можно, никаких ограничений нет',
      ],
      correct: 0,
      explain:
        'Если хранить только два индекса, оставляют одну ячейку пустой: буфер полон, когда (tail + 1) % capacity == head. Другой способ — счётчик size.',
    },
    {
      q: 'Чему равно 13 & (8 − 1)?',
      answers: ['5'],
      placeholder: 'Число',
      explain: '13 = 1101₂, маска 0111₂ оставляет 101₂ = 5 — то же, что 13 % 8.',
    },
    {
      q: 'Для каких ёмкостей i % capacity можно заменить на i & (capacity − 1)?',
      options: ['8', '1024', '6', '100'],
      correct: [0, 1],
      explain:
        'Маска работает только для степеней двойки: у них capacity − 1 — это несколько единиц подряд.',
    },
    {
      q: 'Какова сложность операций push и pop кольцевого буфера?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'Амортизированное O(1)'],
      correct: 0,
      explain:
        'Никаких сдвигов и выделений памяти — только запись, чтение и арифметика индексов. Это честное O(1) на каждую операцию, не амортизированное.',
    },
    {
      q: 'Что не так в этом коде, если CAPACITY — размер массива data?',
      code: String.raw`
tail++;
if (tail > CAPACITY) {
    tail = 0;
}
data[tail] = x;`,
      lang: 'c',
      noRun: true,
      options: [
        'При tail == CAPACITY запись идёт за конец массива',
        'tail никогда не станет 0',
        'Буфер переполнится раньше времени',
        'Ошибки нет',
      ],
      correct: 0,
      explain:
        'Допустимые индексы — 0…CAPACITY − 1. Заворачивать нужно при tail == CAPACITY, а проще всего писать tail = (tail + 1) % CAPACITY.',
    },
    {
      q: 'Где кольцевые буферы применяются чаще всего?',
      options: [
        'Буферы приёма данных в драйверах и микроконтроллерах',
        'Хранение последних N строк журнала',
        'Аудиопотоки между программой и звуковой картой',
        'Сортировка больших массивов',
      ],
      correct: [0, 1, 2],
      explain:
        'Везде, где поток данных идёт непрерывно, а память фиксирована. Для сортировки кольцевой буфер не нужен.',
    },
  ],
  exercises: [
    {
      title: 'Кольцевая очередь',
      difficulty: 'beginner',
      description: `
Первая строка — ёмкость \`C\`. Реализуйте очередь на кольцевом буфере ёмкости \`C\` и выполните команды:

- \`push x\` — добавить в конец; если буфер полон, напечатать \`полон\`;
- \`pop\` — удалить из начала и напечатать, а если пусто — \`пусто\`;
- \`print\` — напечатать элементы от начала к концу через пробел или \`пусто\`.`,
      constraints: ['1 ≤ C ≤ 1000; команд не больше 2000; числа int.'],
      hints: [
        'Массив из 1000 ячеек, индекс начала head и счётчик size. Ячейка для записи — (head + size) % C.',
        'pop читает data[head], затем head = (head + 1) % C. print обходит i от 0 до size − 1 и печатает data[(head + i) % C].',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int capacity;
    if (scanf("%d", &capacity) != 1 || capacity < 1 || capacity > 1000) {
        return 0;
    }
    int data[1000];
    int head = 0, size = 0;
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "push") == 0) {
            int x;
            if (scanf("%d", &x) != 1) {
                break;
            }
            if (size == capacity) {
                printf("полон\n");
            } else {
                data[(head + size) % capacity] = x;
                size++;
            }
        } else if (strcmp(command, "pop") == 0) {
            if (size == 0) {
                printf("пусто\n");
            } else {
                printf("%d\n", data[head]);
                head = (head + 1) % capacity;
                size--;
            }
        } else if (strcmp(command, "print") == 0) {
            if (size == 0) {
                printf("пусто\n");
            }
            for (int i = 0; i < size; i++) {
                printf(i + 1 < size ? "%d " : "%d\n", data[(head + i) % capacity]);
            }
        }
    }
    return 0;
}`,
      explanation: `
Буфер хранит начало \`head\` и размер \`size\`; конец вычисляется как \`(head + size) % C\`. Счётчик однозначно отличает пустой буфер (\`size == 0\`) от полного (\`size == C\`), поэтому заполнить можно все ячейки.

Индексы никогда не выходят за \`0…C − 1\`: остаток от деления заворачивает их в начало массива. Печать идёт в порядке очереди, а не массива — через ту же формулу \`(head + i) % C\`. Все операции \`O(1)\`, кроме печати — она \`O(size)\`.`,
      examples: [
        { in: '3\npush 1\npush 2\npush 3\npush 4\npop\npush 5\nprint\n', out: 'полон\n1\n2 3 5\n' },
        { in: '1\npop\npush 7\nprint\n', out: 'пусто\n7\n' },
      ],
      hidden: [
        { in: '2\nprint\n', name: 'Пустой' },
        { in: '1\npush 1\npush 2\npop\npush 3\nprint\n', name: 'Ёмкость 1' },
        { in: '3\npush 1\npush 2\npush 3\npop\npop\npop\npop\n', name: 'Опустошение' },
        {
          in: '3\npush 1\npush 2\npop\npush 3\npush 4\npop\npush 5\nprint\n',
          name: 'Несколько заворотов',
        },
        {
          in: '4\npush 1\npush 2\npush 3\npush 4\npop\npop\npop\npop\npush 5\npush 6\nprint\n',
          name: 'Полный круг',
        },
        { in: '2\npush -2147483648\npush 2147483647\nprint\n', name: 'Крайние значения' },
        {
          in: '5\npush 1\npop\npush 2\npop\npush 3\npop\npush 4\npop\npush 5\npop\npush 6\npush 7\nprint\n',
          name: 'Сдвиг по кругу',
        },
        { in: '3\npop\npush 0\npush 0\nprint\npop\nprint\n', name: 'Нули' },
      ],
    },
    {
      title: 'Последние k значений',
      description: `
Первая строка — \`k\`. Дальше до конца ввода идут целые числа — показания датчика. Храните только последние \`k\` показаний в кольцевом буфере в режиме перезаписи и в конце напечатайте их от старых к новым через пробел, а на следующей строке — их сумму. Если показаний не было, напечатайте \`пусто\`.

Показаний может быть очень много, поэтому сохранять все нельзя: память — \`O(k)\`.`,
      constraints: ['1 ≤ k ≤ 1000; показаний до 10⁶; числа int.'],
      hints: [
        'Пока size < k — обычное добавление в позицию (head + size) % k. Когда буфер полон, запишите новое значение на место data[head] (самое старое) и сдвиньте head.',
        'Сумму последних k удобно поддерживать на ходу: при затирании вычтите старое значение. Сумма до 10¹² — нужен long long.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int k;
    if (scanf("%d", &k) != 1 || k < 1 || k > 1000) {
        return 0;
    }
    int data[1000];
    int head = 0, size = 0;
    long long sum = 0;
    int x;
    while (scanf("%d", &x) == 1) {
        if (size < k) {
            data[(head + size) % k] = x;
            size++;
        } else {
            sum -= data[head];
            data[head] = x;
            head = (head + 1) % k;
        }
        sum += x;
    }
    if (size == 0) {
        printf("пусто\n");
        return 0;
    }
    for (int i = 0; i < size; i++) {
        printf(i + 1 < size ? "%d " : "%d\n", data[(head + i) % k]);
    }
    printf("%lld\n", sum);
    return 0;
}`,
      explanation: `
Когда буфер полон, самое старое значение лежит в \`data[head]\`. Новое значение записывается прямо на его место, а \`head\` сдвигается — теперь самым старым стал следующий элемент. Размер остаётся равным \`k\`.

Сумма поддерживается за \`O(1)\` на показание: вошло новое, вышло старое — тот же приём, что в скользящем окне. Память не зависит от длины потока: миллион показаний обрабатывается с массивом из \`k\` ячеек. Так устроены журналы «последних N событий» и фильтры скользящего среднего в прошивках датчиков.`,
      examples: [
        { in: '3\n1 2 3 4 5 6 7\n', out: '5 6 7\n18\n' },
        { in: '5\n10 20\n', out: '10 20\n30\n' },
      ],
      hidden: [
        { in: '3\n', name: 'Нет показаний' },
        { in: '1\n5 6 7\n', name: 'k = 1' },
        { in: '3\n1 2 3\n', name: 'Ровно k' },
        { in: '3\n1 2 3 4\n', name: 'На одно больше' },
        { in: '4\n-1 -2 -3 -4 -5 -6 -7 -8 -9\n', name: 'Отрицательные' },
        { in: '2\n2147483647 2147483647 2147483647\n', name: 'Большая сумма' },
        { in: '5\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2\n', name: 'Длинный поток' },
        { in: '6\n9 8 7 6 5 4 3 2 1 0\n', name: 'Убывание' },
      ],
    },
    {
      title: 'Найди ошибку: заворот индекса',
      bug: true,
      description: `
Программа реализует кольцевой буфер ёмкости 4 и выполняет команды \`push x\` (или печатает \`полон\`) и \`pop\` (печатает элемент или \`пусто\`).

Когда индексы доходят до конца массива, AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['Команд не больше 2000; числа int.'],
      hints: [
        'Какие значения может вернуть next_index? Какие индексы допустимы для массива data[CAPACITY]?',
        'Индексы массива — от 0 до CAPACITY − 1. Заворачивать нужно, когда индекс стал равен CAPACITY: условие i == CAPACITY (или просто (i + 1) % CAPACITY).',
      ],
      starter: WRAP(false),
      solution: WRAP(true),
      explanation: `
\`next_index\` с условием \`i > CAPACITY\` возвращает значение \`CAPACITY\` — индекс за последней ячейкой массива — и заворачивает только следующий шаг. Когда \`tail\` доходит до 4, \`push\` пишет в \`data[4]\`, за пределы массива из четырёх элементов. AddressSanitizer сообщает \`stack-buffer-overflow\`. Без санитайзера запись испортила бы соседнюю переменную на стеке — например, \`head\` или \`size\`.

Ошибка «на единицу» в заворачивании проявляется только после полного круга по буферу, поэтому короткие тесты её не видят. Выражение \`(i + 1) % CAPACITY\` не оставляет места для такой ошибки.`,
      examples: [
        { in: 'push 1\npush 2\npop\npop\n', out: '1\n2\n' },
        {
          in: 'push 1\npush 2\npush 3\npush 4\npush 5\npop\npush 6\npop\npop\npop\npop\n',
          out: 'полон\n1\n2\n3\n4\n6\n',
        },
      ],
      hidden: [
        'pop\n',
        'push 1\npush 2\npush 3\npush 4\npop\npush 5\npop\n',
        'push 1\npush 2\npush 3\npush 4\npop\npop\npop\npop\npush 5\npop\n',
        'push 9\npop\npush 8\npop\npush 7\npop\npush 6\npop\npush 5\npop\n',
        'push 1\npush 2\npush 3\npop\npop\npush 4\npush 5\npush 6\npop\npop\npop\npop\n',
        'push 1\npush 2\npush 3\npush 4\npush 5\npush 6\n',
        'push -1\npush -2\npush -3\npush -4\npop\npush -5\npop\npop\npop\npop\npop\n',
        'push 0\npush 0\npush 0\npush 0\npop\npop\npush 1\npush 2\npop\npop\npop\npop\n',
      ],
    },
    {
      title: 'Скользящий максимум',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\` и \`k\`, вторая — \`n\` целых чисел. Для каждого окна из \`k\` подряд идущих элементов (их \`n − k + 1\`) напечатайте его максимум. Ответы — через пробел.

Наивное решение — \`O(n · k)\`. Решите задачу за \`O(n)\` с помощью **дека** — двусторонней очереди индексов — на кольцевом буфере ёмкости \`k\`.`,
      constraints: ['1 ≤ k ≤ n ≤ 10⁵; числа int.'],
      hints: [
        'В деке храните индексы элементов текущего окна, значения по которым убывают от начала к концу. Тогда максимум окна — элемент по индексу из начала дека.',
        'Для нового индекса i: сначала снимите с начала дека индекс, вышедший из окна (≤ i − k); затем снимайте с конца индексы с values ≤ values[i] — они уже никогда не станут максимумом; добавьте i в конец.',
        'В деке не больше k индексов, поэтому подойдёт кольцевой буфер ёмкости k с head и size: конец — (head + size − 1) % k, начало — head.',
      ],
      solution: String.raw`
#include <stdio.h>

static int values[100000], deque[100000];

int main(void) {
    int n, k;
    if (scanf("%d %d", &n, &k) != 2 || k < 1 || n < k || n > 100000) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }
    int head = 0, size = 0;
    for (int i = 0; i < n; i++) {
        if (size > 0 && deque[head] <= i - k) {
            head = (head + 1) % k;
            size--;
        }
        while (size > 0 && values[deque[(head + size - 1) % k]] <= values[i]) {
            size--;
        }
        deque[(head + size) % k] = i;
        size++;
        if (i >= k - 1) {
            printf(i + 1 < n ? "%d " : "%d\n", values[deque[head]]);
        }
    }
    return 0;
}`,
      explanation: `
Инвариант: дек содержит индексы окна в порядке возрастания, а значения по ним строго убывают. Элемент, перед которым в окно пришёл не меньший элемент, уже никогда не станет максимумом — поэтому его можно выбросить с конца. Тогда максимум окна — в начале дека, а устаревший индекс, вышедший за левую границу окна, снимается с начала. Снимать его нужно **до** добавления нового индекса: иначе в деке на мгновение окажется \`k + 1\` индекс, и кольцевой буфер ёмкости \`k\` перезапишет своё начало.

Каждый индекс добавляется один раз и снимается не больше одного раза — \`O(n)\` всего, хотя внутренний \`while\` бывает длинным. В деке не больше \`k\` индексов (все — из текущего окна), поэтому кольцевого буфера ёмкости \`k\` хватает: снятие с конца — \`size--\`, снятие с начала — сдвиг \`head\`. Это тот же монотонный стек, что в уроке о стеке, но с выходом элементов с другого конца.`,
      examples: [
        { in: '8 3\n1 3 -1 -3 5 3 6 7\n', out: '3 3 5 5 6 7\n' },
        { in: '3 3\n4 2 9\n', out: '9\n' },
      ],
      hidden: [
        { in: '1 1\n5\n', name: 'Одно окно из одного' },
        { in: '5 1\n3 1 4 1 5\n', name: 'k = 1' },
        { in: '5 2\n5 4 3 2 1\n', name: 'Убывание' },
        { in: '5 2\n1 2 3 4 5\n', name: 'Возрастание' },
        { in: '6 3\n7 7 7 7 7 7\n', name: 'Равные' },
        { in: '7 4\n-1 -5 -2 -8 -3 -9 -4\n', name: 'Отрицательные' },
        {
          in: '6 2\n2147483647 -2147483648 0 2147483647 -1 -2147483648\n',
          name: 'Крайние значения',
        },
        { in: '10 3\n1 3 2 5 4 7 6 9 8 10\n', name: 'Пила' },
      ],
    },
  ],
};
