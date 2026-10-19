const BEST = (fixed) => String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t size = 0, capacity = 1;
    int *data = malloc(capacity * sizeof *data);
    if (data == NULL) {
        return 1;
    }
    ${fixed ? 'size_t best = 0;' : 'int *best = NULL;'}
    int x;
    while (scanf("%d", &x) == 1) {
        if (size == capacity) {
            capacity *= 2;
            int *grown = realloc(data, capacity * sizeof *data);
            if (grown == NULL) {
                free(data);
                return 1;
            }
            data = grown;
        }
        data[size] = x;
        ${fixed ? 'if (size == 0 || x > data[best]) {\n            best = size;\n        }' : 'if (best == NULL || x > *best) {\n            best = &data[size];\n        }'}
        size++;
        printf("%d\n", ${fixed ? 'data[best]' : '*best'});
    }
    free(data);
    return 0;
}`;

export default {
  id: 'algo-vector',
  title: 'Динамический массив и амортизация',
  description:
    'Стоимость роста динамического массива; рост на константу и в константу раз; амортизированное O(1) добавления; коэффициент роста; стоимость остальных операций; уменьшение ёмкости без дребезга; висячие указатели после realloc.',
  moduleId: 'algorithms-structures',
  order: 16,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['algo-quick'],
  objectives: [
    'Считать копирования при разных стратегиях роста',
    'Объяснять амортизированную стоимость добавления в конец',
    'Оценивать стоимость вставки и удаления в середине',
    'Избегать висячих указателей на элементы растущего массива',
  ],
  tags: ['Структуры данных', 'Динамический массив', 'Амортизация', 'Benchmark'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Сколько копирований элементов будет при 10 добавлениях в пустой массив, если ёмкость растёт по одному элементу (рост копирует все имеющиеся элементы)?',
      answers: ['45'],
      placeholder: 'Число',
      explain: 'Перед k-м добавлением копируется k − 1 элемент: 0 + 1 + … + 9 = 45.',
    },
    {
      q: 'Ёмкость начинается с 0 и удваивается (0 → 1 → 2 → 4 → …). Какой будет ёмкость после 9 добавлений?',
      answers: ['16'],
      placeholder: 'Число',
      explain: 'Ёмкости 1, 2, 4, 8 заполняются к 8-му добавлению; девятое требует роста до 16.',
    },
    {
      q: 'Что значит «добавление в конец работает за амортизированное O(1)»?',
      options: [
        'Любые n добавлений вместе стоят O(n), хотя отдельное добавление может стоить O(n)',
        'Каждое добавление стоит O(1)',
        'Добавление стоит O(1) в среднем по случайным входам',
        'Добавление никогда не вызывает realloc',
      ],
      correct: 0,
      explain:
        'Амортизация — гарантия для последовательности операций: дорогие росты редки, и их стоимость распределяется по многим дешёвым добавлениям.',
    },
    {
      q: 'Какие стратегии роста дают O(n) копирований на n добавлений?',
      options: [
        'capacity *= 2',
        'capacity = capacity * 3 / 2 + 1',
        'capacity += 1000',
        'capacity += 1',
      ],
      correct: [0, 1],
      explain:
        'Рост в константу раз — геометрическая прогрессия, её сумма O(n). Рост на любую константу — n / k ростов по O(n) копирований, итого O(n²).',
    },
    {
      q: 'Сколько стоит вставка элемента в начало динамического массива из n элементов?',
      options: ['O(n) — все элементы сдвигаются', 'O(1)', 'O(log n)', 'Амортизированное O(1)'],
      correct: 0,
      explain: 'Чтобы освободить позицию 0, нужно сдвинуть все n элементов на одну позицию вправо.',
    },
    {
      q: 'Почему ёмкость уменьшают вдвое при заполнении на четверть, а не наполовину?',
      options: [
        'Иначе чередование добавлений и удалений у границы будет на каждой операции то увеличивать, то уменьшать массив',
        'Так меньше расход памяти',
        'realloc не умеет уменьшать блок наполовину',
        'Так требует стандарт',
      ],
      correct: 0,
      explain:
        'После уменьшения при заполнении наполовину массив сразу полон, и следующее добавление снова растит его. Порог в четверть оставляет запас в обе стороны.',
    },
    {
      q: 'Что не так в этом фрагменте?',
      code: String.raw`
int *last = &v.data[v.size - 1];
vector_push(&v, 42);       // может вызвать realloc
printf("%d\n", *last);`,
      lang: 'c',
      noRun: true,
      options: [
        'После роста last указывает в освобождённый блок — использование после освобождения',
        'last указывает на новый элемент 42',
        'Ошибки нет: realloc сохраняет адреса',
        'vector_push нельзя вызывать после взятия адреса',
      ],
      correct: 0,
      explain:
        'realloc может переместить данные. Указатели на элементы становятся висячими, а AddressSanitizer сообщает heap-use-after-free. Храните индекс.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    long long capacity = 0, size = 0, copies = 0;
    for (int i = 0; i < 20; i++) {
        if (size == capacity) {
            copies += size;
            capacity = capacity == 0 ? 1 : capacity * 2;
        }
        size++;
    }
    printf("%lld %lld\n", capacity, copies);
    return 0;
}`,
      answers: ['32 31'],
      placeholder: 'Вывод программы',
      explain:
        'Росты при size = 0, 1, 2, 4, 8, 16: копирований 1 + 2 + 4 + 8 + 16 = 31, ёмкость 32.',
    },
  ],
  exercises: [
    {
      title: 'Вставки и удаления',
      difficulty: 'beginner',
      description: `
Реализуйте динамический массив целых чисел (ёмкость удваивается при заполнении) и выполните команды из ввода — по одной в строке:

- \`insert i x\` — вставить \`x\` так, чтобы он стал элементом с индексом \`i\` (0 ≤ i ≤ size), сдвинув хвост вправо;
- \`erase i\` — удалить элемент с индексом \`i\` (0 ≤ i < size), сдвинув хвост влево;
- \`print\` — напечатать элементы через пробел или \`пусто\`.

Если индекс в \`insert\` или \`erase\` недопустим, напечатайте \`ошибка\` и ничего не меняйте.`,
      constraints: ['Команд не больше 1000; числа int.'],
      hints: [
        'Перед вставкой проверьте место: если size == capacity, удвойте ёмкость realloc (начните с 4 или с 1).',
        'Сдвиг хвоста — memmove(&data[i + 1], &data[i], (size − i) * sizeof *data) при вставке и memmove(&data[i], &data[i + 1], (size − i − 1) * sizeof *data) при удалении. memmove, а не memcpy: области пересекаются.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    size_t size = 0, capacity = 4;
    int *data = malloc(capacity * sizeof *data);
    if (data == NULL) {
        return 1;
    }
    char command[8];
    while (scanf("%7s", command) == 1) {
        if (strcmp(command, "insert") == 0) {
            long long i;
            int x;
            if (scanf("%lld %d", &i, &x) != 2) {
                break;
            }
            if (i < 0 || (size_t)i > size) {
                printf("ошибка\n");
                continue;
            }
            if (size == capacity) {
                int *grown = realloc(data, 2 * capacity * sizeof *data);
                if (grown == NULL) {
                    free(data);
                    return 1;
                }
                data = grown;
                capacity *= 2;
            }
            memmove(&data[i + 1], &data[i], (size - (size_t)i) * sizeof *data);
            data[i] = x;
            size++;
        } else if (strcmp(command, "erase") == 0) {
            long long i;
            if (scanf("%lld", &i) != 1) {
                break;
            }
            if (i < 0 || (size_t)i >= size) {
                printf("ошибка\n");
                continue;
            }
            memmove(&data[i], &data[i + 1], (size - (size_t)i - 1) * sizeof *data);
            size--;
        } else if (strcmp(command, "print") == 0) {
            if (size == 0) {
                printf("пусто\n");
            }
            for (size_t k = 0; k < size; k++) {
                printf(k + 1 < size ? "%d " : "%d\n", data[k]);
            }
        }
    }
    free(data);
    return 0;
}`,
      explanation: `
Вставка в позицию \`i\` сдвигает \`size − i\` элементов, удаление — \`size − i − 1\`. Поэтому операции в конце массива дешёвые, а в начале — \`O(n)\`. Сдвиг делает \`memmove\`: исходная и целевая области пересекаются, и \`memcpy\` для них — неопределённое поведение.

Индекс читается в \`long long\` и проверяется **до** сравнения с беззнаковым \`size\`: отрицательное число, приведённое к \`size_t\`, стало бы огромным, и проверка \`i > size\` всё равно бы сработала, но явная проверка \`i < 0\` понятнее. Вставка в позицию \`size\` допустима — это добавление в конец.`,
      examples: [
        { in: 'insert 0 5\ninsert 1 7\ninsert 0 3\nprint\nerase 1\nprint\n', out: '3 5 7\n3 7\n' },
        { in: 'print\nerase 0\ninsert 1 4\n', out: 'пусто\nошибка\nошибка\n' },
      ],
      hidden: [
        {
          in: 'insert 0 1\ninsert 1 2\ninsert 2 3\ninsert 3 4\ninsert 4 5\ninsert 5 6\nprint\n',
          name: 'Рост ёмкости',
        },
        {
          in: 'insert 0 1\ninsert 0 2\ninsert 0 3\ninsert 0 4\ninsert 0 5\nprint\n',
          name: 'Вставки в начало',
        },
        {
          in: 'insert 0 1\ninsert 1 2\ninsert 2 3\nerase 0\nerase 0\nerase 0\nprint\n',
          name: 'Удаление всего',
        },
        {
          in: 'insert 0 1\ninsert -1 5\nerase -1\nerase 1\nprint\n',
          name: 'Отрицательные индексы',
        },
        {
          in: 'insert 0 10\ninsert 1 30\ninsert 1 20\nerase 2\nprint\ninsert 2 40\nprint\n',
          name: 'Середина и конец',
        },
        { in: 'insert 0 -2147483648\ninsert 1 2147483647\nprint\n', name: 'Крайние значения' },
        {
          in: 'insert 0 1\ninsert 2 2\ninsert 1 2\nprint\nerase 5\nprint\n',
          name: 'Ошибки не меняют массив',
        },
        { in: 'insert 0 9\nerase 0\nprint\ninsert 0 8\nprint\n', name: 'Снова пустой' },
      ],
    },
    {
      id: 'algo-vector-benchmark',
      title: 'Benchmark: копирования при росте',
      description: `
Сравним стратегии роста по числу копирований. Каждая строка ввода — стратегия и число добавлений \`n\` в изначально пустой массив ёмкости 0. Перед добавлением, если \`size == capacity\`, массив растёт: копируются все \`size\` элементов, а новая ёмкость определяется стратегией:

| Стратегия | Новая ёмкость |
| --------- | ------------- |
| \`add1\`    | \`capacity + 1\` |
| \`add100\`  | \`capacity + 100\` |
| \`double\`  | \`1\`, если ёмкость 0, иначе \`2 · capacity\` |
| \`half\`    | \`capacity + capacity / 2\` (деление нацело), но не меньше \`capacity + 1\` |

Для каждой строки напечатайте число копирований и итоговую ёмкость через пробел.`,
      constraints: ['0 ≤ n ≤ 10⁶; строк не больше 20.'],
      hints: [
        'Моделируйте только счётчики: size, capacity и copies — сам массив не нужен.',
        'Для add1 при n = 10⁶ копирований около 5·10¹¹ — считайте в long long.',
        'Ёмкость для half: next = capacity + capacity / 2; если next < capacity + 1, next = capacity + 1. Так из 0 получается 1, из 1 — 2, из 2 — 3, из 3 — 4, из 4 — 6.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static long long grow(const char *strategy, long long capacity) {
    if (strcmp(strategy, "add1") == 0) {
        return capacity + 1;
    }
    if (strcmp(strategy, "add100") == 0) {
        return capacity + 100;
    }
    if (strcmp(strategy, "double") == 0) {
        return capacity == 0 ? 1 : 2 * capacity;
    }
    long long next = capacity + capacity / 2;
    return next < capacity + 1 ? capacity + 1 : next;
}

int main(void) {
    char strategy[8];
    long long n;
    while (scanf("%7s %lld", strategy, &n) == 2) {
        long long size = 0, capacity = 0, copies = 0;
        for (long long i = 0; i < n; i++) {
            if (size == capacity) {
                copies += size;
                capacity = grow(strategy, capacity);
            }
            size++;
        }
        printf("%lld %lld\n", copies, capacity);
    }
    return 0;
}`,
      explanation: `
Результаты подтверждают анализ: \`add1\` и \`add100\` дают квадратичное число копирований — \`n²/2\` и \`n²/200\`, — а \`double\` и \`half\` линейное: меньше \`n\` и около \`2n\` соответственно. Множитель 1,5 копирует примерно вдвое больше, чем 2, зато запас памяти после роста меньше.

Это модель стоимости: копирование элемента принято за единицу работы, а время \`malloc\`, кэш и расширение блока «на месте» не учитываются. Зато результат точен и одинаков на любом компьютере. Ёмкость в выводе показывает и цену стратегии по памяти: при \`double\` она бывает почти вдвое больше \`n\`.`,
      examples: [
        { in: 'add1 10\ndouble 10\n', out: '45 10\n15 16\n' },
        { in: 'double 0\nhalf 10\n', out: '0 0\n25 13\n' },
      ],
      hidden: [
        { in: 'add1 0\nadd100 0\nhalf 0\n', name: 'Ноль добавлений' },
        { in: 'add1 1\nadd100 1\ndouble 1\nhalf 1\n', name: 'Одно добавление' },
        { in: 'double 1024\ndouble 1025\n', name: 'Степень двойки' },
        { in: 'add100 1000\nadd100 1001\n', name: 'Рост по сто' },
        { in: 'add1 1000000\n', name: 'Миллион по одному' },
        { in: 'double 1000000\nhalf 1000000\n', name: 'Миллион геометрически' },
        { in: 'add100 1000000\n', name: 'Миллион по сто' },
        { in: 'half 2\nhalf 3\nhalf 4\nhalf 5\n', name: 'Маленькие для half' },
      ],
    },
    {
      title: 'Найди ошибку: указатель на максимум',
      bug: true,
      description: `
Программа читает целые числа до конца ввода, складывает их в динамический массив и после каждого числа печатает максимум из прочитанных. Чтобы не искать максимум заново, она хранит указатель на максимальный элемент.

На вводе из нескольких чисел AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['Чисел от 1 до 1000; числа int.'],
      hints: [
        'Что происходит с блоком памяти при realloc и куда после этого указывает best?',
        'После роста элементы могут оказаться по новому адресу, а старый блок освобождён. Храните не указатель, а индекс максимального элемента: size_t best, и обращайтесь data[best].',
      ],
      starter: BEST(false),
      solution: BEST(true),
      explanation: `
Указатель \`best\` указывает на элемент внутри блока \`data\`. Когда массив заполняется, \`realloc\` выделяет новый блок, копирует данные и **освобождает старый**. \`data\` обновляется, а \`best\` — нет: он продолжает указывать в освобождённую память. Следующее чтение \`*best\` — использование после освобождения, AddressSanitizer сообщает \`heap-use-after-free\`.

Без санитайзера ошибка могла бы не проявляться: старое содержимое часто остаётся в памяти, пока её не займут. Индекс не зависит от адреса блока: \`data[best]\` после роста указывает на тот же элемент в новом блоке. Это общее правило для растущих контейнеров — в C++ его называют инвалидацией итераторов.`,
      examples: [
        { in: '3\n', out: '3\n' },
        { in: '3 1 4 1 5\n', out: '3\n3\n4\n4\n5\n' },
      ],
      hidden: [
        '1 2\n',
        '5 4 3 2 1\n',
        '-1 -2 -3\n',
        '7 7 7 7 7 7 7 7 7\n',
        '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17\n',
        '2147483647 -2147483648 0\n',
        '0 -1 1 -2 2 -3 3\n',
        '9 1 8 2 7 3 6 4 5\n',
      ],
    },
    {
      title: 'Дребезг ёмкости',
      difficulty: 'advanced',
      description: `
Смоделируем динамический массив, который не только растёт, но и уменьшается. Первая строка — правило уменьшения: \`half\` или \`quarter\`. Дальше до конца ввода — команды \`push k\` (добавить \`k\` элементов по одному) и \`pop k\` (удалить \`k\` элементов по одному; удаление из пустого массива ничего не делает).

Ёмкость начинается с 0. Перед каждым добавлением, если \`size == capacity\`, массив растёт: копируется \`size\` элементов, ёмкость становится \`1\` (если была 0) или удваивается. После каждого удаления, если \`capacity > 1\` и выполнено условие правила, массив уменьшается вдвое и копирует \`size\` элементов:

- \`half\`: \`size ≤ capacity / 2\`;
- \`quarter\`: \`size ≤ capacity / 4\` (деление нацело).

Напечатайте итоговые \`size\`, \`capacity\` и общее число копирований через пробел.`,
      constraints: [
        'Команд не больше 1000; 1 ≤ k ≤ 10⁶; суммарно не больше 2·10⁶ добавлений и удалений.',
      ],
      hints: [
        'Моделируйте по одной операции: команда push k — это k отдельных добавлений, и после каждого удаления проверяется условие уменьшения.',
        'При half у границы степени двойки чередование push 1 / pop 1 каждый раз копирует весь массив — это и есть дребезг. При quarter после уменьшения массив заполнен наполовину, и копирований мало.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char rule[8];
    if (scanf("%7s", rule) != 1) {
        return 0;
    }
    int divisor = strcmp(rule, "half") == 0 ? 2 : 4;
    long long size = 0, capacity = 0, copies = 0;
    char command[8];
    long long k;
    while (scanf("%7s %lld", command, &k) == 2) {
        for (long long i = 0; i < k; i++) {
            if (strcmp(command, "push") == 0) {
                if (size == capacity) {
                    copies += size;
                    capacity = capacity == 0 ? 1 : capacity * 2;
                }
                size++;
            } else if (size > 0) {
                size--;
                if (capacity > 1 && size <= capacity / divisor) {
                    copies += size;
                    capacity /= 2;
                }
            }
        }
    }
    printf("%lld %lld %lld\n", size, capacity, copies);
    return 0;
}`,
      explanation: `
С правилом \`half\` массив после уменьшения заполнен **полностью**: размер равен новой ёмкости. Следующее же добавление вызывает рост с копированием всех элементов, следующее удаление — снова уменьшение. У границы каждая операция стоит \`O(n)\`, и последовательность из \`m\` таких операций — \`O(m · n)\`.

С правилом \`quarter\` после уменьшения массив заполнен наполовину. До следующего изменения ёмкости нужно не меньше четверти ёмкости операций — их стоимость «оплачивает» следующее копирование, и амортизированная стоимость любой операции остаётся \`O(1)\`. Порог уменьшения должен быть строго ниже порога роста — общий принцип для любых структур, которые подстраивают размер под данные.`,
      examples: [
        { in: 'half\npush 8\npush 1\npop 1\npush 1\npop 1\n', out: '8 8 39\n' },
        { in: 'quarter\npush 8\npush 1\npop 1\npush 1\npop 1\n', out: '8 16 15\n' },
      ],
      hidden: [
        { in: 'half\n', name: 'Нет команд' },
        { in: 'quarter\npop 5\n', name: 'Удаление из пустого' },
        { in: 'half\npush 1\npop 1\n', name: 'Один элемент' },
        { in: 'quarter\npush 100\npop 100\n', name: 'Заполнить и опустошить' },
        {
          in: 'half\npush 1024\npush 1\npop 1\npush 1\npop 1\npush 1\npop 1\npush 1\npop 1\n',
          name: 'Дребезг у 1024',
        },
        {
          in: 'quarter\npush 1024\npush 1\npop 1\npush 1\npop 1\npush 1\npop 1\npush 1\npop 1\n',
          name: 'Без дребезга у 1024',
        },
        { in: 'half\npush 1000000\npop 999999\n', name: 'Большой массив half' },
        { in: 'quarter\npush 1000000\npop 999999\npush 5\n', name: 'Большой массив quarter' },
      ],
    },
  ],
};
