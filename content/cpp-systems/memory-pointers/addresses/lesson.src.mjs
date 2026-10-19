export default {
  id: 'memory-addresses',
  title: 'Байты объекта и sizeof',
  description:
    'Объект как последовательность байтов: sizeof для типов и выражений, расстояние между элементами массива, чтение байтов через unsigned char *, представление целых и double.',
  moduleId: 'memory-pointers',
  order: 2,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-process-memory'],
  objectives: [
    'Вычислять размеры типов, массивов и выражений оператором sizeof',
    'Измерять расстояние между объектами в байтах и в элементах',
    'Читать байтовое представление любого объекта через const unsigned char *',
    'Объяснять, почему размер структуры и равенство байтов не следуют из значений полей',
  ],
  tags: ['C23', 'Память', 'sizeof', 'Байты', 'Представление'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    double data[10];
    printf("%td\n", (char *)&data[4] - (char *)&data[1]);
    return 0;
}`,
      answers: ['24'],
      placeholder: 'Вывод программы',
      explain:
        'Между data[1] и data[4] три элемента по 8 байтов. Разность указателей на char считается в байтах: 3 · 8 = 24.',
    },
    {
      q: 'Что выведет программа на little-endian процессоре (x86, ARM)?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    unsigned int x = 0x0A0B0C0D;
    const unsigned char *p = (const unsigned char *)&x;
    printf("%02x\n", p[0]);
    return 0;
}`,
      answers: ['0d'],
      placeholder: 'Вывод программы',
      explain: 'В little-endian первым в памяти лежит младший байт — 0x0D.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void show(int a[]) {
    printf("%zu ", sizeof a);
}

int main(void) {
    int a[10];
    show(a);
    printf("%zu\n", sizeof a);
    return 0;
}`,
      noRun: true,
      answers: ['8 40'],
      placeholder: 'Вывод программы',
      explain:
        'В функции параметр a — указатель (8 байтов на 64-битной системе), а в main a — массив из 10 int по 4 байта. Компилятор даже предупреждает об этом: sizeof on array function parameter.',
    },
    {
      q: 'Какие утверждения верны? Выберите все.',
      options: [
        'sizeof(char) всегда равен 1',
        'sizeof возвращает значение типа size_t',
        'int всегда занимает 4 байта',
        'На одной платформе указатели на int и на double обычно имеют одинаковый размер',
      ],
      correct: [0, 1, 3],
      explain:
        'Размер int зависит от платформы: стандарт требует только не меньше 16 бит. sizeof(char) == 1 по определению.',
    },
    {
      q: 'Почему для просмотра байтов объекта используют unsigned char *, а не char * ?',
      options: [
        'char может быть знаковым: байт 0xff прочитается как -1',
        'char * нельзя приводить к указателю на другой тип',
        'unsigned char занимает меньше памяти',
        'char * читает по два байта',
      ],
      correct: 0,
      explain: 'Оба типа занимают один байт, но unsigned char гарантированно даёт значения 0…255.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int n = 5;
    size_t s = sizeof(n += 10);
    printf("%zu %d\n", s, n);
    return 0;
}`,
      answers: ['4 5'],
      placeholder: 'Вывод программы',
      explain:
        'Операнд sizeof не вычисляется (кроме массивов переменной длины), поэтому n += 10 не выполнится. Размер берётся по типу выражения — int.',
    },
    {
      q: 'Чему обычно равен sizeof(struct { char c; int i; }) на x86-64 и почему?',
      options: [
        '8: после c вставлены 3 байта выравнивания',
        '5: сумма размеров полей',
        '4: поля перекрываются',
        '16: каждое поле занимает 8 байтов',
      ],
      correct: 0,
      explain:
        'Поле int должно начинаться с адреса, кратного 4, поэтому компилятор добавляет промежуток. Подробно — в уроках об alignment и padding.',
    },
  ],
  exercises: [
    {
      title: 'Сколько байтов',
      difficulty: 'beginner',
      description: `
Программа получает \`q\` запросов. Каждый запрос — буква типа и количество элементов \`n\`. Для каждого запроса напечатайте, сколько байтов займёт массив из \`n\` элементов этого типа **на машине, где выполняется программа**.

Буквы: \`c\` — \`char\`, \`s\` — \`short\`, \`i\` — \`int\`, \`l\` — \`long long\`, \`f\` — \`float\`, \`d\` — \`double\`, \`p\` — указатель \`void *\`.

Используйте \`sizeof\`, а не числа: решение должно оставаться верным на любой платформе.`,
      constraints: ['1 ≤ q ≤ 20.', '0 ≤ n ≤ 10⁹.'],
      hints: [
        'Прочитать букву и число: scanf(" %c %zu", &type, &n); — пробел перед %c пропускает перевод строки.',
        "switch по букве выбирает размер: case 'i': size = sizeof(int); break;",
        'Произведение до 8 · 10⁹ не помещается в int, но помещается в size_t на 64-битной системе. Печать — %zu.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int q;
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        char type;
        size_t n;
        scanf(" %c %zu", &type, &n);
        size_t size = 0;
        switch (type) {
        case 'c': size = sizeof(char); break;
        case 's': size = sizeof(short); break;
        case 'i': size = sizeof(int); break;
        case 'l': size = sizeof(long long); break;
        case 'f': size = sizeof(float); break;
        case 'd': size = sizeof(double); break;
        case 'p': size = sizeof(void *); break;
        }
        printf("%zu\n", n * size);
    }
    return 0;
}`,
      explanation: `
Каждая ветка \`switch\` берёт размер у самого типа, поэтому программа сама узнаёт, сколько байтов занимает \`int\` или указатель на текущей платформе. Число \`n\` читается сразу в \`size_t\` — тот же тип, что у \`sizeof\`, — и произведение не переполняется для допустимых данных.

Именно так считают размер перед \`malloc\`: «количество × \`sizeof\` элемента».`,
      examples: [
        { in: '3\ni 10\nd 3\nc 7\n', out: '40\n24\n7\n' },
        { in: '1\np 100\n', out: '800\n' },
      ],
      hidden: [
        { in: '1\ns 5\n', name: 'short' },
        { in: '1\nl 0\n', name: 'Пустой массив' },
        { in: '1\nf 1000\n', name: 'float' },
        { in: '2\nd 1000000000\nl 1000000000\n', name: 'Произведение больше int' },
        { in: '7\nc 1\ns 1\ni 1\nl 1\nf 1\nd 1\np 1\n', name: 'Все типы по одному' },
        { in: '1\nc 1000000000\n', name: 'Миллиард байтов' },
        { in: '3\ni 0\np 0\nc 0\n', name: 'Нулевые количества' },
        { in: '2\ns 123456789\np 3\n', name: 'Разные типы' },
      ],
    },
    {
      title: 'Байты числа',
      description: `
Прочитайте число \`x\` типа \`unsigned int\` и напечатайте его байты **в том порядке, в котором они лежат в памяти**: каждый байт — две шестнадцатеричные цифры в нижнем регистре, байты через пробел.

Получите байты через указатель \`const unsigned char *\` на \`x\`, а их количество — через \`sizeof x\`.`,
      constraints: ['0 ≤ x ≤ 4 294 967 295.', 'Проверка выполняется на little-endian машине.'],
      hints: [
        'const unsigned char *bytes = (const unsigned char *)&x;',
        'Печать байта: printf("%02x", bytes[i]); Пробел ставьте перед каждым байтом, кроме первого, чтобы в конце строки не было лишнего пробела.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    unsigned int x;
    scanf("%u", &x);
    const unsigned char *bytes = (const unsigned char *)&x;
    for (size_t i = 0; i < sizeof x; i++) {
        if (i > 0) {
            printf(" ");
        }
        printf("%02x", bytes[i]);
    }
    printf("\n");
    return 0;
}`,
      explanation: `
Указатель \`bytes\` смотрит на те же четыре байта, что и \`x\`, но видит их как массив чисел 0…255. Цикл до \`sizeof x\` не зависит от того, сколько байтов занимает \`unsigned int\` на конкретной машине.

На little-endian процессоре первым идёт младший байт: число 1 даёт \`01 00 00 00\`, а 256 — \`00 01 00 00\`.`,
      examples: [
        { in: '305419896\n', out: '78 56 34 12\n', why: '305419896 = 0x12345678.' },
        { in: '1\n', out: '01 00 00 00\n' },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '4294967295\n', name: 'Максимум' },
        { in: '256\n', name: 'Перенос во второй байт' },
        { in: '255\n', name: 'Один полный байт' },
        { in: '65536\n', name: 'Третий байт' },
        { in: '16777216\n', name: 'Старший байт' },
        { in: '3735928559\n', name: '0xDEADBEEF' },
        { in: '2864434397\n', name: '0xAABBCCDD' },
      ],
    },
    {
      title: 'Единичные биты в представлении',
      description: `
Прочитайте число \`x\` типа \`long long\` и подсчитайте, сколько битов равны 1 во **всех байтах** его представления в памяти.

Обойдите байты через \`const unsigned char *\` и в каждом байте проверьте 8 битов. Отрицательные числа хранятся в дополнительном коде: например, у \`-1\` все биты единичные.`,
      constraints: ['−9 223 372 036 854 775 808 ≤ x ≤ 9 223 372 036 854 775 807.'],
      hints: [
        'Внешний цикл по байтам: for (size_t i = 0; i < sizeof x; i++), внутренний — по битам: for (int b = 0; b < 8; b++).',
        'Бит b байта v: (v >> b) & 1. Сдвигайте копию байта, а не исходный long long — сдвиг отрицательного знакового числа даёт не то, что ожидается.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    long long x;
    scanf("%lld", &x);
    const unsigned char *bytes = (const unsigned char *)&x;
    int count = 0;
    for (size_t i = 0; i < sizeof x; i++) {
        unsigned char v = bytes[i];
        for (int b = 0; b < 8; b++) {
            count += (v >> b) & 1;
        }
    }
    printf("%d\n", count);
    return 0;
}`,
      explanation: `
Работа с байтами через \`unsigned char\` избавляет от проблем со знаком: каждый байт — неотрицательное число 0…255, и сдвиг вправо добавляет слева нули. Для \`-1\` все 8 байтов равны \`0xff\`, по 8 единиц — всего 64.

Порядок байтов здесь не важен: количество единиц не зависит от того, в каком порядке обходить байты.`,
      examples: [
        { in: '7\n', out: '3\n' },
        { in: '-1\n', out: '64\n', why: 'В дополнительном коде у −1 все 64 бита — единицы.' },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '1\n', name: 'Единица' },
        { in: '255\n', name: 'Полный байт' },
        { in: '256\n', name: 'Бит во втором байте' },
        { in: '-2\n', name: 'Минус два' },
        { in: '9223372036854775807\n', name: 'Максимум' },
        { in: '-9223372036854775808\n', name: 'Минимум' },
        { in: '1311768467463790320\n', name: '0x123456789ABCDEF0' },
      ],
    },
    {
      title: 'Равные значения, разные байты',
      difficulty: 'advanced',
      description: `
Прочитайте два числа \`a\` и \`b\` типа \`double\` (\`scanf\` с \`%lf\` понимает и записи \`nan\`, \`inf\`). Напечатайте две строки:

\`\`\`
values: equal
bytes: different
\`\`\`

Первая строка — результат сравнения \`a == b\` (\`equal\` или \`different\`). Вторая — совпадают ли все \`sizeof(double)\` байтов представлений, сравненные в цикле через \`const unsigned char *\`.`,
      constraints: ['Числа записаны так, как их принимает scanf("%lf").'],
      hints: [
        'Два указателя: const unsigned char *pa = (const unsigned char *)&a; и такой же pb. Сравнивайте pa[i] и pb[i] в цикле до sizeof a.',
        'Подумайте о 0 и -0: значения равны, но бит знака отличается. А NaN (nan) не равен даже самому себе, хотя байты двух одинаковых NaN совпадают.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    double a, b;
    scanf("%lf %lf", &a, &b);
    const unsigned char *pa = (const unsigned char *)&a;
    const unsigned char *pb = (const unsigned char *)&b;
    int same_bytes = 1;
    for (size_t i = 0; i < sizeof a; i++) {
        if (pa[i] != pb[i]) {
            same_bytes = 0;
        }
    }
    printf("values: %s\n", a == b ? "equal" : "different");
    printf("bytes: %s\n", same_bytes ? "equal" : "different");
    return 0;
}`,
      explanation: `
Сравнение значений и сравнение байтов — разные операции:

- \`0.0\` и \`-0.0\` равны как числа, но отличаются битом знака;
- \`NaN\` по правилам IEEE 754 не равен ничему, даже себе, хотя байты двух одинаковых NaN совпадают.

Отсюда практический вывод: объекты сравнивают по значению, а побайтовое сравнение применяют только там, где важно именно представление — например, при проверке, что файл записан без изменений.`,
      examples: [
        { in: '0 -0\n', out: 'values: equal\nbytes: different\n' },
        { in: 'nan nan\n', out: 'values: different\nbytes: equal\n' },
      ],
      hidden: [
        { in: '1.5 1.5\n', name: 'Одинаковые числа' },
        { in: '0.1 0.2\n', name: 'Разные числа' },
        { in: '-0 -0\n', name: 'Два отрицательных нуля' },
        { in: 'inf inf\n', name: 'Бесконечности' },
        { in: 'inf -inf\n', name: 'Бесконечности разных знаков' },
        { in: 'nan 1\n', name: 'NaN и число' },
        { in: '1e308 1e308\n', name: 'Очень большие числа' },
        { in: '0.3 0.30000000000000004\n', name: 'Соседние double' },
      ],
    },
  ],
};
