export default {
  id: 'memory-void-pointer',
  title: 'void * и обобщённые функции',
  description:
    'Указатель без типа: неявные преобразования и ограничения, обобщённые функции через размер элемента, qsort для чисел, структур и строк, безопасная функция сравнения и bsearch.',
  moduleId: 'memory-pointers',
  order: 10,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['memory-const-pointers'],
  objectives: [
    'Объяснять, что можно и чего нельзя делать с void *',
    'Писать обобщённые функции, работающие с элементами любого размера',
    'Сортировать массивы чисел, структур и строк функцией qsort',
    'Писать функции сравнения без переполнения и искать элементы через bsearch',
  ],
  tags: ['C17', 'Память', 'void *', 'qsort', 'bsearch', 'Обобщённое программирование'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие операции допустимы для void *p в стандартном C? Выберите все.',
      options: [
        'int *q = p;',
        'p = &x; где x — double',
        '*p = 0;',
        'p + 1',
        '(unsigned char *)p + 1',
      ],
      correct: [0, 1, 4],
      explain:
        'Преобразования void * в указатель на объект и обратно неявные. Разыменовывать и сдвигать сам void * нельзя — сначала приведите его к конкретному типу.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int cmp(const void *pa, const void *pb) {
    int a = *(const int *)pa, b = *(const int *)pb;
    return (b > a) - (b < a);
}

int main(void) {
    int v[] = {3, 9, 1, 7};
    qsort(v, 4, sizeof v[0], cmp);
    printf("%d %d %d %d\n", v[0], v[1], v[2], v[3]);
    return 0;
}`,
      answers: ['9 7 3 1'],
      placeholder: 'Вывод программы',
      explain: 'Аргументы сравниваются в обратном порядке (b с a) — сортировка по убыванию.',
    },
    {
      q: 'Почему функция сравнения return a - b; опасна для произвольных int?',
      options: [
        'Разность может переполнить int — неопределённое поведение и неверный знак',
        'qsort требует ровно -1, 0 или 1',
        'Вычитание медленнее сравнения',
        'Она сортирует по убыванию',
      ],
      correct: 0,
      explain:
        'qsort достаточно любого знака, но при a = 2·10⁹ и b = −2·10⁹ результат не помещается в int.',
    },
    {
      q: 'Массив объявлен как const char *names[10]. К какому типу нужно привести параметр const void *p в функции сравнения для qsort?',
      options: ['const char *const *', 'const char *', 'char', 'const char (*)[10]'],
      correct: 0,
      explain:
        'qsort передаёт адрес элемента. Элемент — const char *, значит, его адрес — указатель на const char *.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void fill_any(void *base, size_t n, size_t size, const void *value) {
    unsigned char *p = base;
    const unsigned char *v = value;
    for (size_t i = 0; i < n * size; i++) {
        p[i] = v[i % size];
    }
}

int main(void) {
    short s[3];
    short seven = 7;
    fill_any(s, 3, sizeof s[0], &seven);
    printf("%d %d %d\n", s[0], s[1], s[2]);
    return 0;
}`,
      answers: ['7 7 7'],
      placeholder: 'Вывод программы',
      explain:
        'В отличие от memset, функция повторяет образец из size байтов, поэтому каждый short получает значение 7.',
    },
    {
      q: 'Что нужно, чтобы bsearch правильно нашла элемент?',
      options: [
        'Массив отсортирован той же функцией сравнения, которая передаётся в bsearch',
        'Массив отсортирован по убыванию',
        'Искомый элемент стоит в середине массива',
        'Размер элемента равен sizeof(int)',
      ],
      correct: 0,
      explain:
        'Двоичный поиск опирается на порядок. Порядок задаёт функция сравнения — она должна совпадать при сортировке и поиске.',
    },
    {
      q: 'Сколько байтов занимает шаг между соседними элементами, если qsort вызвана с size = sizeof(struct City), а sizeof(struct City) = 20? Сколько байтов скопирует qsort при перестановке одного элемента?',
      answers: ['20'],
      placeholder: 'Байтов',
      explain:
        'qsort знает только размер элемента: адрес i-го элемента — base + i * 20, и при перестановке копируются ровно 20 байтов.',
    },
  ],
  exercises: [
    {
      title: 'Сортировка по убыванию',
      difficulty: 'beginner',
      description: `
Прочитайте \`n\` целых чисел и напечатайте их по убыванию через пробел, используя \`qsort\`.

Числа могут быть любыми значениями \`int\`, в том числе \`−2147483648\` и \`2147483647\`: функция сравнения не должна переполняться.`,
      constraints: ['1 ≤ n ≤ 1000.', '−2 147 483 648 ≤ x ≤ 2 147 483 647.'],
      hints: [
        'Прочитайте значения: int a = *(const int *)pa; int b = *(const int *)pb;',
        'По убыванию без переполнения: return (b > a) - (b < a);',
        'Вызов: qsort(v, n, sizeof v[0], compare_desc);',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int compare_desc(const void *pa, const void *pb) {
    int a = *(const int *)pa;
    int b = *(const int *)pb;
    return (b > a) - (b < a);
}

int main(void) {
    int n;
    scanf("%d", &n);
    int v[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    qsort(v, (size_t)n, sizeof v[0], compare_desc);
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", v[i]);
    }
    return 0;
}`,
      explanation: `
Функция сравнения возвращает знак, а не разность: \`(b > a) - (b < a)\` даёт −1, 0 или 1 для любых значений. Вариант \`b - a\` для пары \`2147483647\` и \`−1\` переполнил бы \`int\` — неопределённое поведение, которое UndefinedBehaviorSanitizer в проверке сразу обнаружит.

Порядок «по убыванию» задаётся только функцией сравнения: \`qsort\` всегда ставит раньше тот элемент, для которого сравнение отрицательно.`,
      examples: [
        { in: '5\n3 -1 4 1 5\n', out: '5 4 3 1 -1\n' },
        { in: '1\n0\n', out: '0\n' },
      ],
      hidden: [
        { in: '2\n2147483647 -2147483648\n', name: 'Пределы int' },
        { in: '3\n-2147483648 2147483647 0\n', name: 'Пределы и ноль' },
        { in: '4\n7 7 7 7\n', name: 'Равные' },
        { in: '5\n1 2 3 4 5\n', name: 'По возрастанию' },
        { in: '5\n5 4 3 2 1\n', name: 'Уже по убыванию' },
        { in: '6\n-1 -2147483648 2147483647 1 -1 0\n', name: 'Смешанные' },
        { in: '3\n-5 -10 -1\n', name: 'Отрицательные' },
        {
          in: '8\n1000000000 -1000000000 2000000000 -2000000000 3 2 1 0\n',
          name: 'Большие по модулю',
        },
      ],
    },
    {
      title: 'Таблица результатов',
      description: `
Прочитайте \`n\` записей «имя баллы» и напечатайте таблицу: по убыванию баллов, при равных баллах — по алфавиту. Каждая строка — место, имя и баллы через пробел. Участники с равными баллами получают **одинаковое** место, следующее место учитывает их количество (1, 2, 2, 4).

Сортируйте массив структур функцией \`qsort\`.`,
      constraints: ['1 ≤ n ≤ 100.', 'Имя — до 20 латинских букв.', '0 ≤ баллы ≤ 10⁶.'],
      hints: [
        'struct Row { char name[21]; int score; }; функция сравнения начинается с const struct Row *a = pa, *b = pb;',
        'Сначала (b->score > a->score) - (b->score < a->score); если 0 — strcmp(a->name, b->name).',
        'Место: если score совпадает с предыдущим — место прежнее, иначе место = i + 1.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Row {
    char name[21];
    int score;
};

int by_score(const void *pa, const void *pb) {
    const struct Row *a = pa;
    const struct Row *b = pb;
    if (a->score != b->score) {
        return (b->score > a->score) - (b->score < a->score);
    }
    return strcmp(a->name, b->name);
}

int main(void) {
    int n;
    scanf("%d", &n);
    struct Row rows[100];
    for (int i = 0; i < n; i++) {
        scanf("%20s %d", rows[i].name, &rows[i].score);
    }
    qsort(rows, (size_t)n, sizeof rows[0], by_score);
    int place = 1;
    for (int i = 0; i < n; i++) {
        if (i > 0 && rows[i].score != rows[i - 1].score) {
            place = i + 1;
        }
        printf("%d %s %d\n", place, rows[i].name, rows[i].score);
    }
    return 0;
}`,
      explanation: `
\`qsort\` переставляет структуры целиком, по \`sizeof rows[0]\` байтов. Функция сравнения превращает \`const void *\` в \`const struct Row *\` — указатель на тип элемента — и сравнивает по двум ключам. Второй ключ (имя) делает порядок однозначным: \`qsort\` неустойчива, и без него равные по баллам участники могли бы стоять в любом порядке.

Место вычисляется уже после сортировки: оно меняется только тогда, когда меняются баллы, и становится равным позиции в списке.`,
      examples: [
        {
          in: '4\nbob 90\nann 95\ncid 90\ndan 80\n',
          out: '1 ann 95\n2 bob 90\n2 cid 90\n4 dan 80\n',
        },
        { in: '1\nsolo 0\n', out: '1 solo 0\n' },
      ],
      hidden: [
        { in: '3\nc 5\nb 5\na 5\n', name: 'Все равны' },
        { in: '3\nx 1\ny 2\nz 3\n', name: 'По возрастанию' },
        { in: '5\na 10\nb 9\nc 9\nd 9\ne 1\n', name: 'Три одинаковых места' },
        { in: '2\nzz 1000000\naa 0\n', name: 'Крайние баллы' },
        { in: '4\nm 7\nl 7\nk 8\nj 8\n', name: 'Две группы' },
        { in: '6\nf 1\ne 2\nd 3\nc 4\nb 5\na 6\n', name: 'Обратный порядок' },
        { in: '3\nabcdefghijklmnopqrst 5\nabc 5\nab 6\n', name: 'Длинные имена' },
        { in: '5\nq 3\nw 3\ne 2\nr 2\nt 1\n', name: 'Пары' },
      ],
    },
    {
      title: 'Обобщённый разворот',
      description: `
Реализуйте функцию

\`\`\`c
void reverse_any(void *base, size_t n, size_t size);
\`\`\`

которая разворачивает массив из \`n\` элементов по \`size\` байтов, не зная их типа.

Функция \`main\` дана: она читает массив \`int\`, массив \`double\` и слово, разворачивает все три одной и той же функцией и печатает результат.`,
      constraints: ['1 ≤ количество чисел каждого вида ≤ 50.', 'Слово — от 1 до 50 символов.'],
      hints: [
        'Адрес i-го элемента: unsigned char *bytes = base; bytes + i * size.',
        'Меняйте местами элементы i и n − 1 − i для i < n / 2 — побайтно, как в swap_any из урока.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

void reverse_any(void *base, size_t n, size_t size) {
    // Разверните массив из n элементов по size байтов.
}

int main(void) {
    int n, m;
    int ints[50];
    double reals[50];
    char word[51];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &ints[i]);
    }
    scanf("%d", &m);
    for (int i = 0; i < m; i++) {
        scanf("%lf", &reals[i]);
    }
    scanf("%50s", word);
    reverse_any(ints, (size_t)n, sizeof ints[0]);
    reverse_any(reals, (size_t)m, sizeof reals[0]);
    reverse_any(word, strlen(word), sizeof word[0]);
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", ints[i]);
    }
    for (int i = 0; i < m; i++) {
        printf(i + 1 < m ? "%.2f " : "%.2f\n", reals[i]);
    }
    printf("%s\n", word);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

void reverse_any(void *base, size_t n, size_t size) {
    unsigned char *bytes = base;
    for (size_t i = 0; i < n / 2; i++) {
        unsigned char *left = bytes + i * size;
        unsigned char *right = bytes + (n - 1 - i) * size;
        for (size_t k = 0; k < size; k++) {
            unsigned char tmp = left[k];
            left[k] = right[k];
            right[k] = tmp;
        }
    }
}

int main(void) {
    int n, m;
    int ints[50];
    double reals[50];
    char word[51];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &ints[i]);
    }
    scanf("%d", &m);
    for (int i = 0; i < m; i++) {
        scanf("%lf", &reals[i]);
    }
    scanf("%50s", word);
    reverse_any(ints, (size_t)n, sizeof ints[0]);
    reverse_any(reals, (size_t)m, sizeof reals[0]);
    reverse_any(word, strlen(word), sizeof word[0]);
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", ints[i]);
    }
    for (int i = 0; i < m; i++) {
        printf(i + 1 < m ? "%.2f " : "%.2f\n", reals[i]);
    }
    printf("%s\n", word);
    return 0;
}`,
      explanation: `
Функция не знает типа элементов, но знает их размер — этого достаточно: \`i\`-й элемент начинается с байта \`i * size\`, а обмен двух элементов — обмен их \`size\` байтов. Одна и та же функция развернула массив \`int\` (по 4 байта), \`double\` (по 8) и символы строки (по 1).

Терминатор \`'\\0'\` не участвует в развороте: передаётся \`strlen(word)\`, а не размер массива.`,
      examples: [
        { in: '3\n1 2 3\n2\n1.5 -2.25\nhello\n', out: '3 2 1\n-2.25 1.50\nolleh\n' },
        { in: '1\n7\n1\n0.5\na\n', out: '7\n0.50\na\n' },
      ],
      hidden: [
        { in: '2\n1 2\n3\n1 2 3\nab\n', name: 'Чётная и нечётная длина' },
        { in: '4\n-1 -2 -3 -4\n4\n0.1 0.2 0.3 0.4\nlevel\n', name: 'Палиндром' },
        { in: '5\n2147483647 0 0 0 -2147483648\n1\n-1e10\nxy\n', name: 'Пределы int' },
        { in: '6\n1 1 2 2 3 3\n2\n100 200\nabcdef\n', name: 'Шесть элементов' },
        { in: '1\n0\n5\n1 2 3 4 5\nabcdefghijklmnopqrstuvwxyz\n', name: 'Алфавит' },
        { in: '3\n5 5 5\n3\n2.5 2.5 2.5\naaa\n', name: 'Одинаковые' },
        { in: '7\n1 2 3 4 5 6 7\n6\n6 5 4 3 2 1\nprogramming\n', name: 'Длинные массивы' },
        { in: '2\n-7 7\n2\n-0.01 0.01\nok\n', name: 'Симметричные' },
      ],
    },
    {
      title: 'Словарь',
      difficulty: 'advanced',
      description: `
Прочитайте \`n\` слов словаря, затем \`q\` запросов. Для каждого запроса напечатайте \`yes\`, если слово есть в словаре, и \`no\` иначе.

Храните слова в массиве \`char dict[100][21]\`, отсортируйте его \`qsort\` и ищите \`bsearch\` с одной и той же функцией сравнения. В конце напечатайте словарь по алфавиту в одну строку через пробел.`,
      constraints: [
        '1 ≤ n ≤ 100.',
        '1 ≤ q ≤ 20.',
        'Слова — из строчных латинских букв, длиной до 20.',
      ],
      hints: [
        'Элемент массива — char[21], и qsort передаёт адрес элемента — это адрес первого символа строки. Функция сравнения: return strcmp(pa, pb); — здесь лишнего уровня косвенности нет!',
        'Для bsearch ключ — тоже строка: char key[21]; bsearch(key, dict, n, sizeof dict[0], compare).',
        'Сравните с массивом const char *words[]: там элемент — указатель, и нужен лишний уровень *(const char *const *)pa.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int compare_words(const void *pa, const void *pb) {
    return strcmp(pa, pb);
}

int main(void) {
    int n;
    scanf("%d", &n);
    char dict[100][21];
    for (int i = 0; i < n; i++) {
        scanf("%20s", dict[i]);
    }
    qsort(dict, (size_t)n, sizeof dict[0], compare_words);
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        char key[21];
        scanf("%20s", key);
        printf("%s\n", bsearch(key, dict, (size_t)n, sizeof dict[0], compare_words) ? "yes" : "no");
    }
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%s " : "%s\n", dict[i]);
    }
    return 0;
}`,
      explanation: `
Здесь элемент массива — сам массив символов \`char[21]\`, поэтому адрес элемента совпадает с адресом строки, и функция сравнения передаёт его прямо в \`strcmp\`. Для массива указателей \`const char *[]\` это было бы ошибкой — там адрес элемента указывает на указатель.

\`qsort\` перемещает слова целиком, по 21 байту. Затем \`bsearch\` находит слово за \`log₂ n\` сравнений — для 100 слов это не больше 7 вызовов \`strcmp\` вместо 100.`,
      examples: [
        {
          in: '4\npear apple fig kiwi\n3\nfig plum apple\n',
          out: 'yes\nno\nyes\napple fig kiwi pear\n',
        },
        { in: '1\nword\n1\nwor\n', out: 'no\nword\n' },
      ],
      hidden: [
        { in: '3\nc b a\n3\na b c\n', name: 'Все найдены' },
        { in: '3\nc b a\n2\nd aa\n', name: 'Ничего не найдено' },
        {
          in: '5\nbanana band ban bandana bandit\n4\nban band bandi bandit\n',
          name: 'Общие префиксы',
        },
        {
          in: '2\nabcdefghijklmnopqrst abc\n2\nabcdefghijklmnopqrst abcd\n',
          name: 'Длинное слово',
        },
        { in: '4\nzeta alpha mu omega\n2\nalpha omega\n', name: 'Греческие буквы' },
        { in: '3\nsame same same\n1\nsame\n', name: 'Дубликаты' },
        { in: '6\nf e d c b a\n6\na b c d e f\n', name: 'Обратный порядок' },
        { in: '2\nx y\n3\nw x z\n', name: 'Крайние запросы' },
      ],
    },
  ],
};
