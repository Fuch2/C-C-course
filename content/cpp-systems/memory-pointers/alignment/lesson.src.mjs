const HEADER_HEAD = String.raw`
#include <stdint.h>
#include <stdio.h>
#include <string.h>

struct Header {
    uint32_t id;
    uint16_t length;
    uint16_t flags;
};

int main(void) {
    unsigned char buffer[64];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        unsigned value;
        scanf("%x", &value);
        buffer[i] = (unsigned char)value;
    }
    int offset = 1;
    while (offset + (int)sizeof(struct Header) <= n) {`;

const HEADER_TAIL = String.raw`
        printf("id=%u length=%u flags=%u\n", (unsigned)h.id, (unsigned)h.length, (unsigned)h.flags);
        offset += (int)sizeof(struct Header) + 1;
    }
    return 0;
}`;

export default {
  id: 'memory-alignment',
  title: 'Выравнивание',
  description:
    'Требования выравнивания типов и alignof, гарантия malloc, невыровненный доступ и strict aliasing, чтение чисел из байтового буфера через memcpy, формула выравнивания вверх и alignas.',
  moduleId: 'memory-pointers',
  order: 23,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['memory-undefined-behavior'],
  objectives: [
    'Объяснять, что такое выравнивание и зачем оно процессору',
    'Определять требования выравнивания через alignof',
    'Читать значения из байтовых буферов через memcpy без невыровненного доступа',
    'Округлять размеры и адреса вверх до кратного степени двойки',
  ],
  tags: ['C17', 'Память', 'Выравнивание', 'alignof', 'memcpy'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чему равен align_up(21, 8) по формуле (x + a − 1) & ~(a − 1)?',
      answers: ['24'],
      placeholder: 'Результат',
      explain: '21 + 7 = 28 = 0b11100; обнуление трёх младших битов даёт 0b11000 = 24.',
    },
    {
      q: 'Какие адреса подходят для объекта double с выравниванием 8? Выберите все.',
      options: ['0x1000', '0x1004', '0x1008', '0x1010', '0x100C'],
      correct: [0, 2, 3],
      explain: 'Адрес должен быть кратен 8: последняя шестнадцатеричная цифра 0 или 8.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdalign.h>
#include <stdio.h>

int main(void) {
    printf("%zu %zu %zu\n", alignof(char), alignof(int), alignof(double));
    return 0;
}`,
      answers: ['1 4 8'],
      placeholder: 'Вывод программы',
      explain: 'На 64-битном Linux выравнивание простых типов совпадает с их размером.',
    },
    {
      q: 'Как правильно прочитать uint32_t из байтового буфера buf со смещения 3?',
      options: [
        'uint32_t v; memcpy(&v, buf + 3, sizeof v);',
        'uint32_t v = *(uint32_t *)(buf + 3);',
        'uint32_t v = buf[3];',
        'uint32_t *p = buf + 3; uint32_t v = *p;',
      ],
      correct: 0,
      explain:
        'Приведение указателя даёт невыровненный доступ и нарушает strict aliasing. buf[3] — только один байт. memcpy копирует байты без требований к выравниванию.',
    },
    {
      q: 'Какое выравнивание гарантирует блок, полученный от malloc?',
      options: [
        'Не меньше alignof(max_align_t) — подходит для любого стандартного типа',
        'Только 1 байт',
        'Ровно размер запрошенного блока',
        'Никакого',
      ],
      correct: 0,
      explain:
        'Поэтому результат malloc можно привести к указателю на любой тип без проверки выравнивания.',
    },
    {
      q: 'Почему невыровненное чтение int на x86 опасно, если оно «работает»?',
      options: [
        'Это неопределённое поведение: оптимизатор и другие процессоры не обязаны его поддерживать',
        'На x86 оно всегда возвращает 0',
        'Оно меняет порядок байтов',
        'Оно опасно только в многопоточных программах',
      ],
      correct: 0,
      explain:
        'Векторные команды требуют выравнивания, а процессоры других архитектур могут аварийно завершить программу.',
    },
    {
      q: 'Для каких a формула (x + a − 1) & ~(a − 1) даёт правильное выравнивание вверх? Выберите все.',
      options: ['a = 1', 'a = 4', 'a = 6', 'a = 64', 'a = 12'],
      correct: [0, 1, 3],
      explain:
        'Формула с маской верна только для степеней двойки. Для 6 и 12 нужна формула (x + a − 1) / a * a.',
    },
  ],
  exercises: [
    {
      title: 'Выравнивание вверх',
      difficulty: 'beginner',
      description: `
Для каждой пары \`x a\` напечатайте наименьшее число, не меньшее \`x\` и кратное \`a\`, вычисленное формулой с маской. Если \`a\` — не степень двойки (или 0), напечатайте \`bad alignment\`.`,
      constraints: ['1 ≤ q ≤ 20.', '0 ≤ x ≤ 10¹².', '0 ≤ a ≤ 2²⁰.'],
      hints: [
        'Степень двойки: a != 0 && (a & (a - 1)) == 0 — у степени двойки ровно один единичный бит.',
        'Используйте unsigned long long для x и a; результат: (x + a - 1) & ~(a - 1).',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        unsigned long long x, a;
        scanf("%llu %llu", &x, &a);
        if (a == 0 || (a & (a - 1)) != 0) {
            printf("bad alignment\n");
        } else {
            printf("%llu\n", (x + a - 1) & ~(a - 1));
        }
    }
    return 0;
}`,
      explanation: `
У степени двойки в двоичной записи ровно одна единица; вычитание единицы превращает её в ноль, а все младшие нули — в единицы. Поэтому \`a & (a − 1)\` равно нулю только для степеней двойки.

Маска \`~(a − 1)\` обнуляет младшие биты, отвечающие за остаток от деления на \`a\`. Прибавление \`a − 1\` перед этим гарантирует округление вверх: кратное число не меняется, остальные переходят к следующему кратному.`,
      examples: [
        { in: '3\n13 8\n16 8\n5 6\n', out: '16\n16\nbad alignment\n' },
        { in: '1\n0 4096\n', out: '0\n' },
      ],
      hidden: [
        { in: '1\n7 1\n', name: 'Выравнивание 1' },
        { in: '1\n1 1048576\n', name: 'Максимальное выравнивание' },
        { in: '1\n1000000000000 1024\n', name: 'Большое число' },
        { in: '1\n10 0\n', name: 'Ноль' },
        { in: '2\n17 12\n17 16\n', name: 'Не степень двойки' },
        { in: '3\n63 64\n64 64\n65 64\n', name: 'Кэш-линия' },
        { in: '2\n3 2\n4 2\n', name: 'Чётность' },
        { in: '1\n999999999999 4096\n', name: 'Страница памяти' },
      ],
    },
    {
      title: 'Чтение чисел из пакета',
      description: `
Пакет задан как \`n\` байтов в шестнадцатеричной записи. Обработайте \`q\` запросов \`тип смещение\`, где тип — \`i16\`, \`i32\` или \`i64\` (знаковые целые \`int16_t\`, \`int32_t\`, \`int64_t\`). Прочитайте значение из пакета по этому смещению **в порядке байтов машины** и напечатайте его. Если значение не помещается в пакет, печатайте \`out of range\`.

Читайте только через \`memcpy\` — смещения бывают невыровненными.`,
      constraints: ['1 ≤ n ≤ 64.', '1 ≤ q ≤ 20.', '0 ≤ смещение ≤ 100.'],
      hints: [
        'Байты: unsigned value; scanf("%x", &value); buf[i] = (unsigned char)value;',
        'Для i32: if (offset + 4 > n) — out of range; иначе int32_t v; memcpy(&v, buf + offset, sizeof v); printf("%" PRId32 "\\n", v); (PRId32 из <inttypes.h>) или приведите к long long.',
      ],
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    int n;
    scanf("%d", &n);
    unsigned char buf[64];
    for (int i = 0; i < n; i++) {
        unsigned value;
        scanf("%x", &value);
        buf[i] = (unsigned char)value;
    }
    int q;
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        char type[4];
        int offset;
        scanf("%3s %d", type, &offset);
        int size = type[1] == '1' ? 2 : type[1] == '3' ? 4 : 8;
        if (offset + size > n) {
            printf("out of range\n");
        } else if (size == 2) {
            int16_t v;
            memcpy(&v, buf + offset, sizeof v);
            printf("%d\n", v);
        } else if (size == 4) {
            int32_t v;
            memcpy(&v, buf + offset, sizeof v);
            printf("%ld\n", (long)v);
        } else {
            int64_t v;
            memcpy(&v, buf + offset, sizeof v);
            printf("%lld\n", (long long)v);
        }
    }
    return 0;
}`,
      explanation: `
\`memcpy\` копирует нужное число байтов в правильно выровненную переменную, поэтому смещение может быть любым. Приведение \`*(int32_t *)(buf + offset)\` при нечётном смещении было бы невыровненным доступом — UBSan остановил бы программу.

Проверка \`offset + size > n\` выполняется до копирования: иначе \`memcpy\` прочитал бы байты за концом пакета. Порядок байтов здесь машинный (little-endian), поэтому байты \`2a 00\` дают 42, а \`ff ff\` — −1.`,
      examples: [
        { in: '6\n01 2a 00 00 00 ff\n2\ni32 1\ni16 4\n', out: '42\n-256\n' },
        { in: '2\nff ff\n2\ni16 0\ni32 0\n', out: '-1\nout of range\n' },
      ],
      hidden: [
        { in: '8\n01 00 00 00 00 00 00 00\n1\ni64 0\n', name: 'i64 = 1' },
        { in: '9\n00 ff ff ff ff ff ff ff 7f\n1\ni64 1\n', name: 'Максимум int64' },
        { in: '5\n00 00 00 00 80\n1\ni32 1\n', name: 'Минимум int32' },
        { in: '3\n34 12 00\n3\ni16 0\ni16 1\ni16 2\n', name: 'Сдвигающиеся i16' },
        { in: '4\n01 02 03 04\n1\ni32 100\n', name: 'Огромное смещение' },
        { in: '7\n10 20 30 40 50 60 70\n2\ni32 3\ni32 4\n', name: 'Граница пакета' },
        { in: '2\n00 80\n1\ni16 0\n', name: 'Минимум int16' },
        {
          in: '16\n00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f\n3\ni64 7\ni64 8\ni64 9\n',
          name: 'Невыровненные i64',
        },
      ],
    },
    {
      title: 'Найди ошибку: невыровненный заголовок',
      bug: true,
      description: `
Поток байтов состоит из записей: байт-метка, затем 8-байтовый заголовок \`struct Header\` (\`uint32_t id\`, \`uint16_t length\`, \`uint16_t flags\`). Программа печатает поля всех заголовков. Результат на x86 правильный, но UBSan сообщает о доступе по невыровненному адресу.

Исправьте чтение заголовка.`,
      constraints: ['1 ≤ n ≤ 64 байта.', 'Порядок байтов — машинный.'],
      hints: [
        'Кратен ли 4 адрес buffer + offset при offset = 1?',
        'Скопируйте заголовок в локальную структуру: struct Header h; memcpy(&h, buffer + offset, sizeof h);',
      ],
      starter: `${HEADER_HEAD}
        const struct Header *p = (const struct Header *)(buffer + offset);
        struct Header h = {p->id, p->length, p->flags};${HEADER_TAIL}`,
      solution: `${HEADER_HEAD}
        struct Header h;
        memcpy(&h, buffer + offset, sizeof h);${HEADER_TAIL}`,
      explanation: `
Структура \`Header\` требует выравнивания 4 (по полю \`uint32_t\`), а \`buffer + 1\` — нечётный адрес. Приведение указателя обещает компилятору выровненный объект, которого там нет, — это неопределённое поведение, хотя x86 и прочитает данные.

\`memcpy\` в локальную \`struct Header\` копирует 8 байтов в переменную, которую компилятор разместил правильно. Затем поля читаются обычным образом. Этот приём — стандартный для разбора двоичных форматов и сетевых пакетов.`,
      examples: [
        { in: '9\naa 07 00 00 00 10 00 01 00\n', out: 'id=7 length=16 flags=1\n' },
        {
          in: '18\n01 01 00 00 00 02 00 03 00 02 ff ff ff ff ff ff 00 00\n',
          out: 'id=1 length=2 flags=3\nid=4294967295 length=65535 flags=0\n',
        },
      ],
      hidden: [
        { in: '9\n00 00 00 00 00 00 00 00 00\n', name: 'Нули' },
        { in: '9\nff 78 56 34 12 cd ab 01 00\n', name: 'Разные байты' },
        { in: '8\nff 01 00 00 00 01 00 01\n', name: 'Неполный заголовок' },
        {
          in: '27\n01 01 00 00 00 01 00 01 00 02 02 00 00 00 02 00 02 00 03 03 00 00 00 03 00 03 00\n',
          name: 'Три записи',
        },
        { in: '10\n00 2a 00 00 00 08 00 00 00 99\n', name: 'Хвост после записи' },
        { in: '9\n05 00 00 00 80 00 80 00 80\n', name: 'Старшие биты' },
        { in: '1\n00\n', name: 'Только метка' },
        { in: '9\n7f 10 27 00 00 e8 03 0a 00\n', name: 'Десятичные круглые' },
      ],
    },
    {
      title: 'Простой распределитель',
      difficulty: 'advanced',
      description: `
Распределитель-«арена» выдаёт участки из общего буфера размером \`N\` байтов, начиная с позиции 0. На запрос \`size align\` он выравнивает текущую позицию вверх до кратного \`align\`, выдаёт участок \`[позиция, позиция + size)\` и сдвигает позицию за его конец. Если участок не помещается в буфер, печатается \`fail\`, и позиция не меняется.

Для каждого запроса напечатайте смещение выданного участка или \`fail\`. В конце — \`used=U\`, где U — итоговая позиция.`,
      constraints: [
        '1 ≤ N ≤ 10⁹.',
        '1 ≤ запросов ≤ 50.',
        '1 ≤ size ≤ 10⁹.',
        'align — степень двойки от 1 до 4096.',
      ],
      hints: [
        'start = (pos + align - 1) & ~(align - 1); участок помещается, если start + size <= N.',
        'Используйте unsigned long long: pos + size может превысить 2³¹.',
        'При fail позицию не меняйте — следующий маленький запрос может поместиться.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    unsigned long long capacity;
    int q;
    scanf("%llu %d", &capacity, &q);
    unsigned long long pos = 0;
    for (int i = 0; i < q; i++) {
        unsigned long long size, align;
        scanf("%llu %llu", &size, &align);
        unsigned long long start = (pos + align - 1) & ~(align - 1);
        if (start + size > capacity) {
            printf("fail\n");
        } else {
            printf("%llu\n", start);
            pos = start + size;
        }
    }
    printf("used=%llu\n", pos);
    return 0;
}`,
      explanation: `
Арена — самый простой и быстрый распределитель: выделение — это выравнивание и сдвиг одного указателя, а освобождение — сброс позиции в ноль для всех участков сразу. Так устроены распределители в компиляторах, играх и парсерах, где много мелких объектов живут одинаково долго.

Выравнивание обязательно: участок под \`double\` должен начинаться с позиции, кратной 8, иначе получится тот самый невыровненный доступ. Промежутки, возникающие при выравнивании, — плата за корректность; в следующем уроке вы увидите такие же промежутки внутри структур.`,
      examples: [
        { in: '64 4\n1 1\n4 4\n8 8\n60 1\n', out: '0\n4\n8\nfail\nused=16\n' },
        { in: '16 2\n16 16\n1 1\n', out: '0\nfail\nused=16\n' },
      ],
      hidden: [
        { in: '1 1\n1 1\n', name: 'Ровно весь буфер' },
        { in: '100 3\n3 1\n8 8\n8 16\n', name: 'Разные выравнивания' },
        { in: '10 3\n20 1\n5 1\n5 1\n', name: 'Отказ, затем успех' },
        { in: '1000000000 2\n999999999 1\n1 4096\n', name: 'Огромный буфер' },
        { in: '4096 3\n1 4096\n1 4096\n1 4096\n', name: 'Выравнивание по странице' },
        { in: '32 5\n1 1\n1 2\n1 4\n1 8\n1 16\n', name: 'Растущие выравнивания' },
        { in: '20 3\n7 1\n8 8\n4 4\n', name: 'Промежуток при выравнивании' },
        { in: '8 4\n2 2\n2 2\n2 2\n2 2\n', name: 'Плотная упаковка' },
      ],
    },
  ],
};
