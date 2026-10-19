const numbers = (count, f) => Array.from({ length: count }, (_, i) => f(i)).join(' ');

export default {
  id: 'memory-realloc',
  title: 'realloc: растущие массивы',
  description:
    'Изменение размера блока: договор realloc, шаблон с временной переменной, длина и ёмкость, удвоение и амортизированная сложность, чтение строки любой длины и висячие указатели после переезда блока.',
  moduleId: 'memory-pointers',
  order: 13,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['memory-calloc'],
  objectives: [
    'Вызывать realloc через временную переменную, не теряя блок при отказе',
    'Строить растущий массив с длиной и ёмкостью и удвоением ёмкости',
    'Объяснять, почему удвоение даёт амортизированно O(1) на добавление',
    'Избегать указателей в старый блок после realloc',
  ],
  tags: ['C23', 'Память', 'realloc', 'Динамический массив', 'Амортизация'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что происходит со старым блоком, если realloc вернула NULL?',
      options: [
        'Он остаётся нетронутым и по-прежнему принадлежит программе',
        'Он освобождается',
        'Его содержимое обнуляется',
        'Его размер уменьшается до нуля',
      ],
      correct: 0,
      explain:
        'Поэтому нельзя писать p = realloc(p, n): при отказе адрес старого блока будет потерян.',
    },
    {
      q: 'Сколько раз будет вызван realloc при добавлении 100 элементов в массив с начальной ёмкостью 1 и удвоением ёмкости при заполнении?',
      answers: ['7'],
      placeholder: 'Число вызовов',
      explain: 'Ёмкость растёт 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128: семь увеличений.',
    },
    {
      q: 'Какой фрагмент правильно увеличивает массив int *data до cap элементов?',
      options: [
        'int *t = realloc(data, cap * sizeof *data); if (t == NULL) { /* ошибка */ } else data = t;',
        'data = realloc(data, cap * sizeof *data);',
        'int *t = realloc(data, cap); if (t) data = t;',
        'realloc(data, cap * sizeof *data);',
      ],
      correct: 0,
      explain:
        'Второй вариант теряет блок при отказе, третий передаёт размер в элементах вместо байтов, четвёртый игнорирует возможно новый адрес.',
    },
    {
      q: 'Чему эквивалентен вызов realloc(NULL, 64)?',
      options: ['malloc(64)', 'free(NULL)', 'calloc(64, 1)', 'Это ошибка'],
      correct: 0,
      explain: 'Поэтому растущий массив можно начинать с data = NULL и ёмкости 0.',
    },
    {
      q: 'Какие указатели могут стать висячими после успешного realloc(a, bigger_size)? Выберите все.',
      options: [
        'Старое значение a, сохранённое в другой переменной',
        'int *p = &a[3], полученный до вызова',
        'Указатель, который вернула realloc',
        'Указатель на локальную переменную в main',
      ],
      correct: [0, 1],
      explain:
        'Если блок переехал, старый блок освобождён — все указатели в него висячие. Новый адрес и указатели на другие объекты не затронуты.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *a = NULL;
    size_t cap = 0;
    for (int i = 1; i <= 5; i++) {
        if ((size_t)i > cap) {
            cap = cap ? cap * 2 : 1;
            int *t = realloc(a, cap * sizeof *a);
            if (t == NULL) {
                free(a);
                return 1;
            }
            a = t;
        }
        a[i - 1] = i * i;
    }
    printf("%zu %d\n", cap, a[4]);
    free(a);
    return 0;
}`,
      answers: ['8 25'],
      placeholder: 'Вывод программы',
      explain: 'Ёмкость 1 → 2 → 4 → 8; пятый элемент — 5² = 25.',
    },
    {
      q: 'Почему при росте массива ёмкость удваивают, а не увеличивают на 1?',
      options: [
        'Рост на 1 копирует массив почти при каждом добавлении — O(n²) в сумме; удвоение даёт O(n)',
        'realloc умеет только удваивать',
        'Удвоение экономит память',
        'Рост на 1 запрещён стандартом',
      ],
      correct: 0,
      explain:
        'При удвоении копирований не больше 2n за всё время; платой служит до половины неиспользованной ёмкости.',
    },
  ],
  exercises: [
    {
      title: 'Чтение до конца ввода',
      difficulty: 'beginner',
      description: `
Читайте целые числа, пока они есть (\`scanf\` возвращает не 1). Напечатайте количество прочитанных чисел, а затем, если оно больше нуля, — сами числа в обратном порядке через пробел.

Количество заранее неизвестно: храните числа в массиве, который растёт удвоением ёмкости через \`realloc\`.`,
      constraints: ['Чисел — от 0 до 2000.', '|x| ≤ 10⁹.'],
      hints: [
        'Начните с int *data = NULL; size_t count = 0, capacity = 0; — realloc(NULL, n) работает как malloc.',
        'При count == capacity: новая ёмкость capacity ? capacity * 2 : 4; результат realloc — во временную переменную.',
        'Не забудьте free(data) в конце; для пустого ввода data == NULL, и free(NULL) ничего не делает.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *data = NULL;
    size_t count = 0, capacity = 0;
    int x;
    while (scanf("%d", &x) == 1) {
        if (count == capacity) {
            size_t new_capacity = capacity ? capacity * 2 : 4;
            int *bigger = realloc(data, new_capacity * sizeof *data);
            if (bigger == NULL) {
                free(data);
                return 1;
            }
            data = bigger;
            capacity = new_capacity;
        }
        data[count++] = x;
    }
    printf("%zu\n", count);
    for (size_t i = count; i > 0; i--) {
        printf(i > 1 ? "%d " : "%d\n", data[i - 1]);
    }
    free(data);
    return 0;
}`,
      explanation: `
Массив начинается пустым: \`data = NULL\`, ёмкость 0. Первый же \`realloc(NULL, …)\` работает как \`malloc\`, дальше ёмкость удваивается: 4, 8, 16, … Для 2000 чисел потребуется всего 9 увеличений.

Обратный обход написан как \`i = count; i > 0; i--\` с индексом \`i − 1\`: для беззнакового \`size_t\` условие \`i >= 0\` было бы всегда истинным.`,
      examples: [
        { in: '5 8 13\n', out: '3\n13 8 5\n' },
        { in: '\n', out: '0\n', why: 'Пустой ввод: ни одного числа.' },
      ],
      hidden: [
        { in: '42\n', name: 'Одно число' },
        { in: '1 2 3 4\n', name: 'Ровно начальная ёмкость' },
        { in: '1 2 3 4 5\n', name: 'Первое увеличение' },
        { in: '-1000000000 1000000000\n', name: 'Крайние значения' },
        { in: `${numbers(2000, (i) => i)}\n`, name: 'Две тысячи чисел' },
        { in: `${numbers(1025, (i) => -i)}\n`, name: 'Чуть больше степени двойки' },
        { in: '1\n2\n3\n', name: 'По одному в строке' },
        { in: '7 7 7 7 7 7 7 7 7\n', name: 'Повторы' },
      ],
    },
    {
      title: 'Строка любой длины',
      description: `
Прочитайте первую строку ввода посимвольно (\`getchar\`) до \`'\\n'\` или конца ввода в буфер, который начинается с ёмкости 4 байта и удваивается через \`realloc\`. Напечатайте длину строки, а затем строку задом наперёд.

Не используйте массивы фиксированного размера под строку: строка может быть очень длинной.`,
      constraints: ['Длина строки — от 0 до 10 000 символов (латиница, цифры, знаки препинания).'],
      hints: [
        "Перед записью символа проверяйте length + 1 == capacity: одно место всегда оставляйте под '\\0'.",
        'int c = getchar(); — переменная int, а не char: иначе EOF нельзя отличить от символа.',
        'Разворот: два индекса с краёв, меняющиеся местами, или печать с конца.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t length = 0, capacity = 4;
    char *line = malloc(capacity);
    if (line == NULL) {
        return 1;
    }
    int c;
    while ((c = getchar()) != EOF && c != '\n') {
        if (length + 1 == capacity) {
            capacity *= 2;
            char *bigger = realloc(line, capacity);
            if (bigger == NULL) {
                free(line);
                return 1;
            }
            line = bigger;
        }
        line[length++] = (char)c;
    }
    line[length] = '\0';
    printf("%zu\n", length);
    for (size_t i = length; i > 0; i--) {
        putchar(line[i - 1]);
    }
    putchar('\n');
    free(line);
    return 0;
}`,
      explanation: `
Условие роста \`length + 1 == capacity\` резервирует место под завершающий ноль: после цикла \`line[length] = '\\0'\` гарантированно попадает в блок. Если проверять \`length == capacity\`, строка длиной ровно в ёмкость вызвала бы запись за границу — AddressSanitizer сообщил бы \`heap-buffer-overflow\`.

Начальная ёмкость 4 намеренно маленькая: на тестах буфер растёт много раз, и любая ошибка в шаблоне \`realloc\` проявится.`,
      examples: [
        { in: 'hello world\n', out: '11\ndlrow olleh\n' },
        { in: '\n', out: '0\n\n' },
      ],
      hidden: [
        { in: 'abc\n', name: 'Три символа (ровно ёмкость минус один)' },
        { in: 'abcd\n', name: 'Четыре символа' },
        { in: 'x', name: 'Без перевода строки' },
        { in: 'first line\nsecond line\n', name: 'Только первая строка' },
        { in: `${'ab'.repeat(5000)}\n`, name: 'Десять тысяч символов' },
        { in: `${'z'.repeat(4095)}\n`, name: 'Граница степени двойки' },
        { in: '  spaces  \n', name: 'Пробелы по краям' },
        { in: 'A man, a plan, a canal: Panama\n', name: 'Знаки препинания' },
      ],
    },
    {
      title: 'Уникальные значения',
      description: `
Читайте целые числа до конца ввода и сохраняйте в растущем массиве только те, что ещё не встречались. Напечатайте количество уникальных чисел и сами числа в порядке первого появления через пробел.

Если чисел нет, напечатайте только \`0\`.`,
      constraints: ['Чисел — до 2000.', '|x| ≤ 10⁹.'],
      hints: [
        'Перед добавлением — линейный поиск по уже сохранённым элементам.',
        'Массив растёт только при добавлении нового значения, поэтому его длина — число уникальных.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *uniq = NULL;
    size_t count = 0, capacity = 0;
    int x;
    while (scanf("%d", &x) == 1) {
        int seen = 0;
        for (size_t i = 0; i < count; i++) {
            if (uniq[i] == x) {
                seen = 1;
                break;
            }
        }
        if (seen) {
            continue;
        }
        if (count == capacity) {
            size_t new_capacity = capacity ? capacity * 2 : 4;
            int *bigger = realloc(uniq, new_capacity * sizeof *uniq);
            if (bigger == NULL) {
                free(uniq);
                return 1;
            }
            uniq = bigger;
            capacity = new_capacity;
        }
        uniq[count++] = x;
    }
    printf("%zu\n", count);
    for (size_t i = 0; i < count; i++) {
        printf(i + 1 < count ? "%d " : "%d\n", uniq[i]);
    }
    free(uniq);
    return 0;
}`,
      explanation: `
Массив хранит только новые значения, поэтому растёт не быстрее, чем число уникальных. Поиск дубликата — линейный: для 2000 чисел это до 2 миллионов сравнений, что быстро. Для миллионов чисел понадобится хеш-таблица или сортировка — их вы встретите в модуле об алгоритмах.`,
      examples: [
        { in: '3 1 3 2 1\n', out: '3\n3 1 2\n' },
        { in: '', out: '0\n' },
      ],
      hidden: [
        { in: '5 5 5 5\n', name: 'Все одинаковые' },
        { in: '1 2 3 4 5 6 7 8 9\n', name: 'Все разные' },
        { in: '-1000000000 1000000000 -1000000000\n', name: 'Крайние значения' },
        { in: '0\n', name: 'Ноль' },
        { in: `${numbers(2000, (i) => i % 37)}\n`, name: 'Повторяющийся цикл' },
        { in: `${numbers(2000, (i) => (i * 7919) % 2003)}\n`, name: 'Две тысячи разных' },
        { in: '1 2 1 2 3 1 2 3 4\n', name: 'Нарастающие повторы' },
        { in: '9 8 7 9 8 7\n', name: 'Повтор в том же порядке' },
      ],
    },
    {
      title: 'Найди ошибку: указатель в старый блок',
      difficulty: 'advanced',
      bug: true,
      description: `
Программа читает числа до конца ввода в растущий массив и запоминает **указатель** на наибольший элемент. В конце печатает количество чисел, максимум и его позицию. На коротком вводе всё работает, а на длинном AddressSanitizer сообщает \`heap-use-after-free\`.

Найдите причину и исправьте программу. При нескольких максимумах выводится позиция первого.`,
      constraints: ['Чисел — от 1 до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'Куда указывает max_ptr после того, как realloc переместил массив?',
        'Храните индекс максимума (size_t max_index) вместо указателя и обращайтесь data[max_index].',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *data = NULL;
    size_t count = 0, capacity = 0;
    int *max_ptr = NULL;
    int x;
    while (scanf("%d", &x) == 1) {
        if (count == capacity) {
            size_t new_capacity = capacity ? capacity * 2 : 2;
            int *bigger = realloc(data, new_capacity * sizeof *data);
            if (bigger == NULL) {
                free(data);
                return 1;
            }
            data = bigger;
            capacity = new_capacity;
        }
        data[count] = x;
        if (max_ptr == NULL || x > *max_ptr) {
            max_ptr = &data[count];
        }
        count++;
    }
    if (count > 0) {
        printf("%zu %d %td\n", count, *max_ptr, max_ptr - data);
    }
    free(data);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *data = NULL;
    size_t count = 0, capacity = 0;
    size_t max_index = 0;
    int x;
    while (scanf("%d", &x) == 1) {
        if (count == capacity) {
            size_t new_capacity = capacity ? capacity * 2 : 2;
            int *bigger = realloc(data, new_capacity * sizeof *data);
            if (bigger == NULL) {
                free(data);
                return 1;
            }
            data = bigger;
            capacity = new_capacity;
        }
        data[count] = x;
        if (count == 0 || x > data[max_index]) {
            max_index = count;
        }
        count++;
    }
    if (count > 0) {
        printf("%zu %d %zu\n", count, data[max_index], max_index);
    }
    free(data);
    return 0;
}`,
      explanation: `
\`max_ptr\` указывает на элемент **конкретного блока**. Когда \`realloc\` переносит массив, старый блок освобождается, и \`max_ptr\` становится висячим: следующее сравнение \`x > *max_ptr\` читает освобождённую память. Без санитайзера ошибка часто незаметна — освобождённые байты ещё хранят старое число.

Индекс не зависит от того, где лежит массив: \`data[max_index]\` всегда вычисляется от актуального адреса. Это общее правило для любых растущих контейнеров — и в C, и для итераторов \`std::vector\` в C++.`,
      examples: [
        { in: '4 9 2\n', out: '3 9 1\n' },
        { in: '7\n', out: '1 7 0\n' },
      ],
      hidden: [
        { in: '1 2 3 4 5\n', name: 'Максимум последний' },
        { in: '9 1 2 3 4 5\n', name: 'Максимум первый' },
        { in: '5 5 5\n', name: 'Равные' },
        { in: '-3 -1 -2\n', name: 'Отрицательные' },
        { in: `${numbers(1000, (i) => (i * 37) % 1001)}\n`, name: 'Тысяча чисел' },
        { in: '1000000000 -1000000000 999999999\n', name: 'Крайние значения' },
        { in: '1 3 2 3 1\n', name: 'Повторяющийся максимум' },
        { in: '2 4 6 8 10 12 14 16 18\n', name: 'Возрастание через несколько увеличений' },
      ],
    },
  ],
};
