const COUNTS = (alloc) => String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int m, n;
    scanf("%d %d", &m, &n);
    int *counts = ${alloc};
    if (counts == NULL) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        counts[x]++;
    }
    for (int v = 0; v < m; v++) {
        if (counts[v] > 0) {
            printf("%d: %d\n", v, counts[v]);
        }
    }
    free(counts);
    return 0;
}`;

const COPY = (body) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *copy_word(const char *word) {
    size_t len = strlen(word);
    char *copy = malloc(len + 1);
    if (copy == NULL) {
        return NULL;
    }
${body}
    return copy;
}

int main(void) {
    char buffer[64];
    while (scanf("%63s", buffer) == 1) {
        char *copy = copy_word(buffer);
        if (copy == NULL) {
            return 1;
        }
        printf("%s %zu\n", copy, strlen(copy));
        free(copy);
    }
    return 0;
}`;

const LIST = (cleanup) => String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

int main(void) {
    struct Node *head = NULL;
    int x;
    while (scanf("%d", &x) == 1) {
        struct Node *node = malloc(sizeof *node);
        if (node == NULL) {
            break;
        }
        node->value = x;
        node->next = head;
        head = node;
    }
    long long sum = 0;
    int count = 0;
    for (struct Node *n = head; n != NULL; n = n->next) {
        sum += n->value;
        count++;
    }
    printf("count=%d sum=%lld\n", count, sum);
${cleanup}
    return 0;
}`;

const REVERSE = (size) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *reversed(const char *s) {
    size_t len = strlen(s);
    char *out = malloc(${size});
    if (out == NULL) {
        return NULL;
    }
    for (size_t i = 0; i < len; i++) {
        out[i] = s[len - 1 - i];
    }
    out[len] = '\0';
    return out;
}

int main(void) {
    char buffer[64];
    while (scanf("%63s", buffer) == 1) {
        char *r = reversed(buffer);
        if (r == NULL) {
            return 1;
        }
        printf("%s\n", r);
        free(r);
    }
    return 0;
}`;

export default {
  id: 'memory-valgrind',
  title: 'Valgrind',
  description:
    'Проверка готовой программы без пересборки: запуск Memcheck и его параметры, неинициализированные значения и --track-origins, виды сообщений, категории утечек и сравнение с AddressSanitizer.',
  moduleId: 'memory-pointers',
  order: 27,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['memory-address-sanitizer'],
  objectives: [
    'Запускать Valgrind Memcheck с параметрами для поиска утечек и происхождения значений',
    'Находить использование неинициализированных значений по отчёту Memcheck',
    'Различать категории утечек definitely, indirectly, possibly lost и still reachable',
    'Выбирать между AddressSanitizer и Valgrind для конкретной задачи',
  ],
  tags: ['C17', 'Память', 'Valgrind', 'Memcheck', 'Отладка'],
  standard: 'c17',
  diagnostics: 'valgrind',
  quiz: [
    {
      q: 'Какую ошибку Valgrind находит, а AddressSanitizer — нет?',
      options: [
        'Ветвление по неинициализированному значению из malloc',
        'Выход за границу блока кучи',
        'Двойное освобождение',
        'Use-after-free',
      ],
      correct: 0,
      explain:
        'ASan отслеживает доступность памяти, а Memcheck — ещё и определённость каждого бита.',
    },
    {
      q: 'Что делает параметр --track-origins=yes?',
      options: [
        'Показывает, где возникло неинициализированное значение: выделение или переменная на стеке',
        'Отслеживает происхождение утечек',
        'Включает проверку выхода за границы стека',
        'Ускоряет работу Valgrind',
      ],
      correct: 0,
      explain:
        'Без него Memcheck сообщает только место использования мусора, и его происхождение приходится искать вручную.',
    },
    {
      q: 'Программа потеряла голову связного списка из 10 узлов. Как Memcheck классифицирует эти блоки?',
      options: [
        'Голова — definitely lost, остальные 9 узлов — indirectly lost',
        'Все 10 — definitely lost',
        'Все 10 — still reachable',
        'Все 10 — possibly lost',
      ],
      correct: 0,
      explain:
        'На голову не указывает никто, а на остальные узлы — только потерянные узлы. Исправьте прямую потерю, и косвенные исчезнут.',
    },
    {
      q: 'Почему Memcheck не сообщает об ошибке в строке int x = a[0]; где a[0] не инициализирован, но сообщает позже, в if (x > 0)?',
      options: [
        'Копирование мусора не меняет поведение программы; ошибкой считается зависимость решения от него',
        'Memcheck проверяет только условия if',
        'Первая строка вообще не выполняется',
        'Это ошибка Valgrind',
      ],
      correct: 0,
      explain:
        'Мусор переносится вместе с пометкой «не определён». Отчёт появляется, когда от такого значения зависит переход, адрес или системный вызов.',
    },
    {
      q: 'Во сколько раз примерно Valgrind замедляет программу по сравнению с обычным запуском?',
      options: ['В 10–50 раз', 'В 2 раза', 'Не замедляет', 'В тысячи раз'],
      correct: 0,
      explain:
        'Каждая команда выполняется на виртуальном процессоре с проверками. ASan дешевле — около 2×.',
    },
    {
      q: "Отчёт: Address 0x4a3a054 is 0 bytes after a block of size 20 alloc'd. Какой индекс массива int прочитан, если блок — массив из 5 int?",
      answers: ['5'],
      placeholder: 'Индекс',
      explain: 'Сразу за 20-байтовым блоком начинается шестой элемент — индекс 5.',
    },
    {
      q: 'Какие утверждения верны? Выберите все.',
      options: [
        'Valgrind работает с программой, собранной без специальных флагов',
        'Valgrind продолжает выполнение после первой ошибки',
        'Программу, собранную с -fsanitize=address, удобно проверять ещё и Valgrind',
        'Для точных номеров строк программу собирают с -g',
      ],
      correct: [0, 1, 3],
      explain:
        'ASan и Valgrind одновременно не используют: ASan-программа под Valgrind не работает.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: счётчики из malloc',
      difficulty: 'beginner',
      bug: true,
      description: `
Программа строит гистограмму \`n\` чисел из диапазона \`[0, m)\` и печатает встретившиеся значения с их количеством. На проверочной машине ответ часто правильный, но Valgrind сообщает об использовании неинициализированных значений.

Исправьте выделение массива счётчиков.`,
      constraints: ['1 ≤ m ≤ 1000.', '1 ≤ n ≤ 1000.', '0 ≤ x < m.'],
      hints: [
        'Чему равны элементы блока сразу после malloc?',
        'calloc((size_t)m, sizeof *counts) выделит массив, заполненный нулями.',
      ],
      starter: COUNTS('malloc((size_t)m * sizeof *counts)'),
      solution: COUNTS('calloc((size_t)m, sizeof *counts)'),
      explanation: `
\`counts[x]++\` читает старое значение счётчика, которое после \`malloc\` не определено. Свежие страницы памяти от системы обычно заполнены нулями, поэтому программа «работает» — до первого переиспользованного блока. Valgrind сообщает ошибку в условии \`if (counts[v] > 0)\` и указывает происхождение мусора — вызов \`malloc\`.

\`calloc\` делает нулевое начальное состояние гарантированным.`,
      examples: [
        { in: '5 6\n1 3 1 0 3 3\n', out: '0: 1\n1: 2\n3: 3\n' },
        { in: '1 1\n0\n', out: '0: 1\n' },
      ],
      hidden: [
        { in: '3 3\n2 2 2\n', name: 'Одно значение' },
        { in: '4 4\n0 1 2 3\n', name: 'Все разные' },
        { in: '1000 2\n999 0\n', name: 'Края диапазона' },
        {
          in: `100 1000\n${Array.from({ length: 1000 }, (_, i) => (i * 13) % 100).join(' ')}\n`,
          name: 'Тысяча чисел',
        },
        { in: '10 5\n9 9 9 9 9\n', name: 'Только последнее' },
        { in: '2 4\n0 1 1 0\n', name: 'Пары' },
        { in: '50 3\n25 25 26\n', name: 'Середина' },
        { in: '7 7\n6 5 4 3 2 1 0\n', name: 'Обратный порядок' },
      ],
    },
    {
      title: 'Найди ошибку: строка без нуля',
      bug: true,
      description: `
Функция \`copy_word\` создаёт копию слова в куче. Программа печатает каждую копию и её длину. Иногда в конце слова появляются лишние символы, а Valgrind сообщает о неинициализированных байтах.

Исправьте \`copy_word\`.`,
      constraints: ['Слов — до 50, каждое до 63 символов.'],
      hints: [
        'Сколько байтов копирует memcpy(copy, word, len)? Попадает ли в копию завершающий ноль?',
        "Копируйте len + 1 байт или запишите copy[len] = '\\0' после копирования.",
      ],
      starter: COPY('    memcpy(copy, word, len);'),
      solution: COPY('    memcpy(copy, word, len + 1);'),
      explanation: `
\`strlen\` не учитывает завершающий ноль, поэтому \`memcpy(copy, word, len)\` переносит только символы. Последний байт блока остаётся неинициализированным, и \`printf("%s")\` со \`strlen\` читают его, пытаясь найти конец строки. Если там случайно оказался ноль, программа «работает», иначе печатает мусор или читает за блоком.

Valgrind сообщает о ветвлении по неинициализированному байту внутри \`strlen\` и указывает на \`malloc\` в \`copy_word\` как на источник.`,
      examples: [
        { in: 'hello world\n', out: 'hello 5\nworld 5\n' },
        { in: 'a\n', out: 'a 1\n' },
      ],
      hidden: [
        { in: 'abcdefgh\n', name: 'Восемь символов' },
        { in: 'abcdefghijklmnop\n', name: 'Шестнадцать символов' },
        { in: `${'x'.repeat(63)}\n`, name: 'Максимальная длина' },
        { in: 'one two three four five\n', name: 'Пять слов' },
        { in: 'ab abc abcd abcde\n', name: 'Растущая длина' },
        { in: 'z\ny\n', name: 'По строкам' },
        { in: 'memory\n', name: 'Слово memory' },
        { in: 'a1 b22 c333\n', name: 'Буквы и цифры' },
      ],
    },
    {
      title: 'Найди ошибку: утечка списка',
      bug: true,
      description: `
Программа читает числа в связный список, печатает их количество и сумму, а затем освобождает список. Valgrind сообщает об утечке: из всех узлов освобождается только один.

Исправьте освобождение списка.`,
      constraints: ['Чисел — от 0 до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'Сколько узлов освобождает free(head)? Что происходит с остальными?',
        'Освобождайте в цикле, сохраняя следующий узел до free: while (head) { struct Node *next = head->next; free(head); head = next; }',
      ],
      starter: LIST('    free(head);'),
      solution: LIST(`    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }`),
      explanation: `
\`free(head)\` освобождает только первый узел. Указатель на второй узел хранился в освобождённом блоке, поэтому второй узел становится **definitely lost**, а все следующие — **indirectly lost**: на них указывают только потерянные узлы. Исправив прямую потерю, вы убираете и косвенные.

Цикл освобождения сохраняет \`next\` до \`free\`, иначе он прочитал бы поле освобождённого узла — Valgrind сообщил бы \`Invalid read of size 8\`.`,
      examples: [
        { in: '1 2 3\n', out: 'count=3 sum=6\n' },
        { in: '5\n', out: 'count=1 sum=5\n' },
      ],
      hidden: [
        { in: '1 2\n', name: 'Два узла' },
        { in: '', name: 'Пустой список' },
        { in: '-1000000000 1000000000 0\n', name: 'Крайние значения' },
        { in: `${Array.from({ length: 1000 }, (_, i) => i).join(' ')}\n`, name: 'Тысяча узлов' },
        { in: '7 7 7 7\n', name: 'Одинаковые' },
        { in: '-1 -2 -3\n', name: 'Отрицательные' },
        { in: '1\n2\n3\n4\n5\n', name: 'По строкам' },
        { in: '100 200\n', name: 'Сотни' },
      ],
    },
    {
      title: 'Найди ошибку: перевёрнутая копия',
      difficulty: 'advanced',
      bug: true,
      description: `
Функция \`reversed\` возвращает новую строку — слово задом наперёд. Программа печатает перевёрнутые слова. Вывод правильный, но Valgrind сообщает \`Invalid write of size 1\`.

Найдите и исправьте ошибку.`,
      constraints: ['Слов — до 50, каждое до 63 символов.'],
      hints: [
        'Какой индекс у последней записи в функции и сколько байтов выделено?',
        'Строке длины len нужно len + 1 байт: malloc(len + 1).',
      ],
      starter: REVERSE('len'),
      solution: REVERSE('len + 1'),
      explanation: `
Блок рассчитан на \`len\` байтов — индексы \`0 … len − 1\`, а завершающий ноль пишется в \`out[len]\`, на один байт за блоком. Распределитель памяти выдаёт блоки с округлением размера, поэтому байт часто попадает в «запас» и программа не падает. Memcheck знает точный запрошенный размер и сообщает: \`Invalid write of size 1 … 0 bytes after a block of size N alloc'd\`.

Правило то же, что и в уроке о \`malloc\`: строке нужно \`strlen + 1\` байт.`,
      examples: [
        { in: 'hello\n', out: 'olleh\n' },
        { in: 'ab cd\n', out: 'ba\ndc\n' },
      ],
      hidden: [
        { in: 'a\n', name: 'Один символ' },
        { in: 'abcdefgh\n', name: 'Восемь символов' },
        { in: 'level\n', name: 'Палиндром' },
        { in: `${'xy'.repeat(31)}z\n`, name: 'Максимальная длина' },
        { in: 'one two three\n', name: 'Три слова' },
        { in: 'abcdefghijklmnopqrstuvwx\n', name: '24 символа' },
        { in: '12345\n', name: 'Цифры' },
        { in: 'Aa Bb\n', name: 'Регистр' },
      ],
    },
  ],
};
