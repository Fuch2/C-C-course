export default {
  id: 'memory-pointer-arithmetic',
  title: 'Блоки байтов: memcpy, memmove, memset',
  description:
    'Копирование, сдвиг, заполнение и сравнение памяти функциями memcpy, memmove, memset и memcmp: размер в байтах, перекрытие областей, байтовая реализация и типичные ловушки.',
  moduleId: 'memory-pointers',
  order: 7,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-pointer-values'],
  objectives: [
    'Копировать массивы и их части функцией memcpy с правильным размером в байтах',
    'Выбирать memmove для перекрывающихся областей: вставка и удаление в массиве',
    'Применять memset и memcmp и объяснять их ограничения',
    'Реализовывать байтовое копирование через unsigned char *',
  ],
  tags: ['C23', 'Память', 'memcpy', 'memmove', 'memset', 'memcmp'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int a[5] = {1, 2, 3, 4, 5};
    memmove(a, a + 1, 4 * sizeof a[0]);
    printf("%d %d %d\n", a[0], a[3], a[4]);
    return 0;
}`,
      answers: ['2 5 5'],
      placeholder: 'Вывод программы',
      explain:
        'Элементы 2, 3, 4, 5 сдвинуты на одну позицию влево: a = {2, 3, 4, 5, 5}. Последний элемент не изменился.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    short s[2];
    memset(s, 1, sizeof s);
    printf("%d\n", s[0]);
    return 0;
}`,
      answers: ['257'],
      placeholder: 'Вывод программы',
      explain: 'Оба байта short равны 1: 0x0101 = 256 + 1 = 257.',
    },
    {
      q: 'В каких случаях нужна memmove, а не memcpy? Выберите все.',
      options: [
        'Сдвиг элементов массива вправо для вставки',
        'Удаление элемента из середины массива со сдвигом хвоста',
        'Копирование одного массива в другой, отдельный массив',
        'Копирование структуры в новую локальную переменную',
      ],
      correct: [0, 1],
      explain:
        'При сдвиге внутри одного массива источник и приёмник перекрываются. Разные объекты не перекрываются, там достаточно memcpy.',
    },
    {
      q: 'Сколько байтов скопирует memcpy(dst, src, 10), если dst и src — массивы double из 10 элементов?',
      options: [
        '10 байтов — это лишь часть первых двух элементов',
        '80 байтов — все элементы',
        '10 элементов',
        'Столько, сколько поместится в dst',
      ],
      correct: 0,
      explain: 'Третий аргумент — всегда байты. Для 10 элементов нужно 10 * sizeof(double).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char a[6] = "ab\0cd";
    char b[6] = "ab\0xy";
    printf("%d %d\n", strcmp(a, b) == 0, memcmp(a, b, 6) == 0);
    return 0;
}`,
      answers: ['1 0'],
      placeholder: 'Вывод программы',
      explain:
        'strcmp остановится на нулевом байте и сочтёт строки равными. memcmp сравнит все 6 байтов и найдёт различие в c и x.',
    },
    {
      q: 'Почему memcpy принимает параметры типа void * и const void * ?',
      options: [
        'Чтобы копировать данные любого типа: функция работает с байтами',
        'Чтобы запретить копирование массивов int',
        'Потому что void * быстрее int *',
        'Чтобы функция сама узнала размер элементов',
      ],
      correct: 0,
      explain:
        'Указатель любого объектного типа неявно преобразуется в void *. Размер функция не знает — его передают третьим аргументом.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int a[4] = {5, 6, 7, 8};
    int b[4] = {0};
    memcpy(b + 1, a, 2 * sizeof a[0]);
    printf("%d %d %d %d\n", b[0], b[1], b[2], b[3]);
    return 0;
}`,
      answers: ['0 5 6 0'],
      placeholder: 'Вывод программы',
      explain: 'Два элемента a[0] и a[1] скопированы в b начиная с позиции 1.',
    },
  ],
  exercises: [
    {
      title: 'Вставка в массив',
      difficulty: 'beginner',
      description: `
Прочитайте \`n\` и \`n\` целых чисел, затем позицию \`pos\` и число \`x\`. Вставьте \`x\` так, чтобы оно стало элементом с индексом \`pos\`, сдвинув хвост массива вправо **одним вызовом \`memmove\`**. Напечатайте новый массив через пробел.`,
      constraints: ['0 ≤ n ≤ 100.', '0 ≤ pos ≤ n.', '|числа| ≤ 10⁹.'],
      hints: [
        'Массив на 101 элемент: в нём хватит места для одной вставки.',
        'Сдвигается n − pos элементов: memmove(a + pos + 1, a + pos, (n - pos) * sizeof a[0]);',
        'При pos == n сдвигать нечего — memmove с размером 0 корректна и ничего не делает.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int a[101];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int pos, x;
    scanf("%d %d", &pos, &x);
    memmove(a + pos + 1, a + pos, (size_t)(n - pos) * sizeof a[0]);
    a[pos] = x;
    n++;
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", a[i]);
    }
    return 0;
}`,
      explanation: `
Хвост массива \`a[pos..n−1]\` сдвигается на одну позицию вправо, освобождая место под \`x\`. Источник и приёмник перекрываются на \`n − pos − 1\` элементов, поэтому нужна именно \`memmove\`: она копирует с конца и не теряет данные.

Размер — в байтах: число сдвигаемых элементов, умноженное на \`sizeof a[0]\`. При вставке в конец (\`pos == n\`) размер равен нулю, и вызов ничего не делает.`,
      examples: [
        { in: '5\n1 2 3 4 5\n2 99\n', out: '1 2 99 3 4 5\n' },
        { in: '0\n0 7\n', out: '7\n', why: 'Пустой массив: вставляется единственный элемент.' },
      ],
      hidden: [
        { in: '3\n1 2 3\n0 0\n', name: 'Вставка в начало' },
        { in: '3\n1 2 3\n3 4\n', name: 'Вставка в конец' },
        { in: '1\n5\n0 -5\n', name: 'Перед единственным' },
        { in: '1\n5\n1 6\n', name: 'После единственного' },
        { in: '4\n7 7 7 7\n2 7\n', name: 'Одинаковые значения' },
        { in: '5\n-1000000000 0 0 0 1000000000\n4 1\n', name: 'Крайние значения' },
        { in: '6\n1 3 5 7 9 11\n3 6\n', name: 'Середина' },
        { in: '2\n10 20\n1 15\n', name: 'Между двумя' },
      ],
    },
    {
      title: 'Удаление отрезка',
      description: `
Прочитайте \`n\` и \`n\` целых чисел, затем индексы \`l\` и \`r\`. Удалите элементы с индексами от \`l\` до \`r\` включительно, сдвинув хвост влево одним вызовом \`memmove\`. Напечатайте оставшиеся элементы через пробел, а если не осталось ни одного — слово \`empty\`.`,
      constraints: ['1 ≤ n ≤ 100.', '0 ≤ l ≤ r < n.', '|числа| ≤ 10⁹.'],
      hints: [
        'Удаляется removed = r − l + 1 элементов; хвост начинается с индекса r + 1 и содержит n − r − 1 элементов.',
        'memmove(a + l, a + r + 1, (n - r - 1) * sizeof a[0]); затем n -= removed;',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int a[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int l, r;
    scanf("%d %d", &l, &r);
    memmove(a + l, a + r + 1, (size_t)(n - r - 1) * sizeof a[0]);
    n -= r - l + 1;
    if (n == 0) {
        printf("empty\n");
    }
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", a[i]);
    }
    return 0;
}`,
      explanation: `
Хвост после отрезка \`a[r+1..n−1]\` переезжает на место удалённых элементов, начиная с индекса \`l\`. Области перекрываются, если хвост длиннее удаляемого отрезка, поэтому \`memmove\`.

Граничные случаи решаются той же формулой: если \`r = n − 1\`, хвост пуст и копируется 0 байтов; если \`l = 0\` и \`r = n − 1\`, массив становится пустым.`,
      examples: [
        { in: '6\n1 2 3 4 5 6\n1 3\n', out: '1 5 6\n' },
        { in: '2\n8 9\n0 1\n', out: 'empty\n' },
      ],
      hidden: [
        { in: '1\n5\n0 0\n', name: 'Единственный элемент' },
        { in: '5\n1 2 3 4 5\n0 0\n', name: 'Первый элемент' },
        { in: '5\n1 2 3 4 5\n4 4\n', name: 'Последний элемент' },
        { in: '5\n1 2 3 4 5\n0 3\n', name: 'Всё, кроме последнего' },
        { in: '5\n1 2 3 4 5\n1 4\n', name: 'Всё, кроме первого' },
        { in: '7\n1 2 3 4 5 6 7\n2 2\n', name: 'Один из середины' },
        { in: '4\n-1000000000 1 2 1000000000\n1 2\n', name: 'Крайние значения' },
        { in: '8\n9 8 7 6 5 4 3 2\n2 5\n', name: 'Длинный отрезок' },
      ],
    },
    {
      title: 'Циклический сдвиг',
      description: `
Прочитайте \`n\`, \`k\` и \`n\` целых чисел. Выполните циклический сдвиг массива **влево** на \`k\` позиций: элемент с индексом \`i\` переходит на место \`(i − k) mod n\`. Напечатайте результат через пробел.

Используйте вспомогательный массив и две функции \`memcpy\`.`,
      constraints: ['1 ≤ n ≤ 100.', '0 ≤ k ≤ 10⁹.', '|числа| ≤ 10⁹.'],
      hints: [
        'Сдвиг на n позиций ничего не меняет, поэтому сначала k = k % n.',
        'Результат — это a[k..n−1], за которым идёт a[0..k−1]. Скопируйте каждую часть в tmp своей memcpy.',
        'memcpy(tmp, a + k, (n - k) * sizeof a[0]); memcpy(tmp + (n - k), a, k * sizeof a[0]);',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int n;
    long long k;
    scanf("%d %lld", &n, &k);
    int a[100], tmp[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int s = (int)(k % n);
    memcpy(tmp, a + s, (size_t)(n - s) * sizeof a[0]);
    memcpy(tmp + (n - s), a, (size_t)s * sizeof a[0]);
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", tmp[i]);
    }
    return 0;
}`,
      explanation: `
Сдвиг влево на \`s\` позиций переставляет две части массива: хвост \`a[s..n−1]\` встаёт в начало, голова \`a[0..s−1]\` — в конец. Каждая часть копируется одним вызовом \`memcpy\`; перекрытия нет, потому что \`tmp\` и \`a\` — разные массивы.

\`k\` может быть до миллиарда, поэтому сначала берётся остаток \`k % n\` — полные обороты ничего не меняют. Без этого \`a + k\` указывал бы далеко за пределы массива.`,
      examples: [
        { in: '5 2\n1 2 3 4 5\n', out: '3 4 5 1 2\n' },
        { in: '3 0\n7 8 9\n', out: '7 8 9\n' },
      ],
      hidden: [
        { in: '3 3\n7 8 9\n', name: 'Полный оборот' },
        { in: '1 1000000000\n42\n', name: 'Один элемент' },
        { in: '4 1\n1 2 3 4\n', name: 'На одну позицию' },
        { in: '4 3\n1 2 3 4\n', name: 'На n − 1' },
        { in: '6 1000000000\n1 2 3 4 5 6\n', name: 'Огромный k' },
        { in: '5 7\n10 20 30 40 50\n', name: 'k больше n' },
        { in: '2 1\n-1000000000 1000000000\n', name: 'Крайние значения' },
        { in: '7 4\n1 1 2 2 3 3 4\n', name: 'Повторы' },
      ],
    },
    {
      title: 'Своя memmove',
      difficulty: 'advanced',
      description: `
Реализуйте функцию

\`\`\`c
void *my_memmove(void *dst, const void *src, size_t n);
\`\`\`

которая копирует \`n\` байтов и даёт верный результат **при любом перекрытии** областей. Возвращает \`dst\`. Не используйте \`memmove\` и \`memcpy\`.

Функция \`main\` дана: она читает слово и \`q\` операций \`dst src len\`; каждая операция копирует \`len\` символов слова с позиции \`src\` на позицию \`dst\` вызовом \`my_memmove(s + dst, s + src, len)\` и печатает слово после неё.`,
      constraints: [
        'Длина слова — от 1 до 50 символов.',
        '1 ≤ q ≤ 10.',
        'dst + len и src + len не превышают длины слова.',
      ],
      hints: [
        'Работайте через unsigned char *d = dst; const unsigned char *s = src;',
        'Если d < s, копирование вперёд (от начала) безопасно: каждый байт читается раньше, чем его перезапишут.',
        'Если d > s, копируйте с конца: for (size_t i = n; i > 0; i--) d[i - 1] = s[i - 1];',
      ],
      starter: String.raw`
#include <stdio.h>

void *my_memmove(void *dst, const void *src, size_t n) {
    // Скопируйте n байтов с учётом перекрытия.
    return dst;
}

int main(void) {
    char s[64];
    int q;
    scanf("%63s %d", s, &q);
    for (int i = 0; i < q; i++) {
        int dst, src, len;
        scanf("%d %d %d", &dst, &src, &len);
        my_memmove(s + dst, s + src, (size_t)len);
        printf("%s\n", s);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void *my_memmove(void *dst, const void *src, size_t n) {
    unsigned char *d = dst;
    const unsigned char *s = src;
    if (d < s) {
        for (size_t i = 0; i < n; i++) {
            d[i] = s[i];
        }
    } else if (d > s) {
        for (size_t i = n; i > 0; i--) {
            d[i - 1] = s[i - 1];
        }
    }
    return dst;
}

int main(void) {
    char s[64];
    int q;
    scanf("%63s %d", s, &q);
    for (int i = 0; i < q; i++) {
        int dst, src, len;
        scanf("%d %d %d", &dst, &src, &len);
        my_memmove(s + dst, s + src, (size_t)len);
        printf("%s\n", s);
    }
    return 0;
}`,
      explanation: `
Если приёмник левее источника, при копировании вперёд мы перезаписываем только те байты, которые уже прочитали. Если приёмник правее, копирование вперёд затёрло бы ещё не прочитанные байты источника: \`abcdef\` с операцией \`2 0 4\` превратилось бы в \`ababab\` вместо \`ababcd\`. Поэтому в этом случае копируем с конца.

Цикл с конца записан как \`i = n; i > 0; i--\` с индексом \`i − 1\`: для беззнакового \`size_t\` условие \`i >= 0\` всегда истинно, и цикл никогда бы не закончился.`,
      examples: [
        { in: 'abcdef 1\n2 0 4\n', out: 'ababcd\n' },
        { in: 'abcdef 1\n0 2 4\n', out: 'cdefef\n' },
      ],
      hidden: [
        { in: 'abc 1\n0 0 3\n', name: 'Копия на себя' },
        { in: 'abcdef 1\n1 0 5\n', name: 'Вправо на один' },
        { in: 'abcdef 1\n0 1 5\n', name: 'Влево на один' },
        { in: 'abcdefgh 1\n4 0 4\n', name: 'Без перекрытия' },
        { in: 'xyz 1\n0 1 0\n', name: 'Нулевая длина' },
        { in: 'abcdefghij 3\n3 0 5\n0 5 5\n2 1 7\n', name: 'Несколько операций' },
        { in: 'a 1\n0 0 1\n', name: 'Один символ' },
        { in: 'programming 2\n1 0 10\n0 1 10\n', name: 'Длинное перекрытие' },
      ],
    },
  ],
};
