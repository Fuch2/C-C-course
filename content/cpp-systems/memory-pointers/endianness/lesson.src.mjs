const hexBytes = (bytes) => bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
const le32 = (x) => [x & 255, (x >>> 8) & 255, (x >>> 16) & 255, (x >>> 24) & 255];
/** Первые 26 байтов заголовка BMP с заданными шириной и высотой. */
const bmp = (width, height) =>
  hexBytes([
    0x42,
    0x4d,
    ...le32(54 + 3 * Math.abs(width * height)),
    0,
    0,
    0,
    0,
    ...le32(54),
    ...le32(40),
    ...le32(width >>> 0),
    ...le32(height >>> 0),
  ]);

const READ_MAIN = String.raw`
int main(void) {
    int n;
    scanf("%d", &n);
    unsigned char buf[16];
    for (int i = 0; i < n; i++) {
        unsigned value;
        scanf("%x", &value);
        buf[i] = (unsigned char)value;
    }
    for (int i = 0; i + 4 <= n; i += 4) {
        printf("%u\n", (unsigned)read_u32_be(buf + i));
    }
    return 0;
}`;

export default {
  id: 'memory-endianness',
  title: 'Порядок байтов',
  description:
    'Little-endian и big-endian, как узнать порядок байтов машины, почему он важен для файлов и сети, переносимая запись и чтение чисел сдвигами, приведение перед сдвигом и перестановка байтов.',
  moduleId: 'memory-pointers',
  order: 25,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['memory-padding'],
  objectives: [
    'Объяснять различие little-endian и big-endian и определять порядок байтов машины',
    'Понимать, где порядок байтов важен: файлы, сеть, двоичные форматы',
    'Записывать и читать числа с явным порядком байтов через сдвиги',
    'Избегать переполнения при сдвиге байтов и переставлять байты числа',
  ],
  tags: ['C23', 'Память', 'Порядок байтов', 'Endianness', 'Сериализация'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'В каком порядке лежат байты числа 0x0A0B0C0D в памяти big-endian машины (от меньшего адреса к большему)?',
      options: ['0a 0b 0c 0d', '0d 0c 0b 0a', '0b 0a 0d 0c', 'Зависит от компилятора'],
      correct: 0,
      explain: 'Big-endian кладёт старший байт первым — так же, как число записано.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdint.h>
#include <stdio.h>

int main(void) {
    unsigned char b[2] = {0x34, 0x12};
    uint16_t le = (uint16_t)(b[0] | b[1] << 8);
    uint16_t be = (uint16_t)(b[0] << 8 | b[1]);
    printf("%04x %04x\n", (unsigned)le, (unsigned)be);
    return 0;
}`,
      answers: ['1234 3412'],
      placeholder: 'Вывод программы',
      explain: 'Чтение как little-endian ставит b[1] старшим байтом, как big-endian — b[0].',
    },
    {
      q: 'Какие операции зависят от порядка байтов машины? Выберите все.',
      options: [
        'Чтение первого байта числа через (unsigned char *)&x',
        'fwrite(&x, sizeof x, 1, file)',
        'x >> 8',
        'x == 0x1234',
        'memcpy(buf, &x, 4) и отправка buf по сети',
      ],
      correct: [0, 1, 4],
      explain:
        'Сдвиги и сравнения работают со значениями. От порядка зависят только операции с представлением.',
    },
    {
      q: 'Почему в выражении (uint32_t)b[0] << 24 нужно приведение?',
      options: [
        'Без него b[0] превращается в int, и 0x80 << 24 переполняет int — неопределённое поведение',
        'Без него сдвиг выполняется в char и теряет биты',
        'Приведение меняет порядок байтов',
        'Оно не нужно — это стиль',
      ],
      correct: 0,
      explain:
        'Целочисленные продвижения превращают unsigned char в int. Сдвиг в знаковый бит int — UB.',
    },
    {
      q: 'Какой порядок байтов называют сетевым?',
      options: [
        'Big-endian',
        'Little-endian',
        'Порядок байтов отправителя',
        'Тот, что у получателя',
      ],
      correct: 0,
      explain:
        'Заголовки TCP/IP используют big-endian. Функции htonl/ntohl переводят числа в него и обратно.',
    },
    {
      q: 'Чему равен результат swap32(0x00000001)?',
      answers: ['16777216', '0x01000000'],
      placeholder: 'Значение',
      explain:
        'Единственный ненулевой байт переезжает из младшей позиции в старшую: 0x01000000 = 2²⁴.',
    },
    {
      q: 'Программа на x86 записала uint16_t port = 8080 (0x1F90) в файл через fwrite. Какое значение прочитает программа, разбирающая файл как big-endian?',
      answers: ['36895'],
      placeholder: 'Значение',
      explain: 'В файле лежат байты 90 1F; как big-endian это 0x901F = 36895.',
    },
  ],
  exercises: [
    {
      title: 'Байты в сетевом порядке',
      difficulty: 'beginner',
      description: `
Для каждого числа \`x\` типа \`uint32_t\` напечатайте его 4 байта в порядке **big-endian** (две шестнадцатеричные цифры, через пробел). Используйте сдвиги, а не \`memcpy\` — решение должно работать на машине с любым порядком байтов.`,
      constraints: ['1 ≤ q ≤ 20.', '0 ≤ x ≤ 4 294 967 295.'],
      hints: [
        'Байт с номером i (от старшего): (x >> (24 - 8 * i)) & 0xFF.',
        'Читайте через scanf("%u", &x) в unsigned int или через SCNu32 из <inttypes.h> в uint32_t.',
      ],
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>

void put_u32_be(unsigned char *out, uint32_t x) {
    out[0] = (unsigned char)(x >> 24);
    out[1] = (unsigned char)(x >> 16);
    out[2] = (unsigned char)(x >> 8);
    out[3] = (unsigned char)x;
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        unsigned value;
        scanf("%u", &value);
        unsigned char bytes[4];
        put_u32_be(bytes, (uint32_t)value);
        printf("%02x %02x %02x %02x\n", bytes[0], bytes[1], bytes[2], bytes[3]);
    }
    return 0;
}`,
      explanation: `
Сдвиг вправо на 24, 16, 8 и 0 битов выдвигает в младшую позицию каждый байт по очереди, начиная со старшего; приведение к \`unsigned char\` отбрасывает остальные биты. Это операции над значением, поэтому результат одинаков на x86 и на big-endian процессоре.

Сравните с уроком о байтах объекта: там через \`unsigned char *\` вы видели машинный порядок (\`78 56 34 12\`), здесь получаете зафиксированный формат (\`12 34 56 78\`).`,
      examples: [
        { in: '2\n305419896\n1\n', out: '12 34 56 78\n00 00 00 01\n' },
        { in: '1\n4294967295\n', out: 'ff ff ff ff\n' },
      ],
      hidden: [
        { in: '1\n0\n', name: 'Ноль' },
        { in: '1\n256\n', name: '256' },
        { in: '1\n8080\n', name: 'Порт 8080' },
        { in: '1\n3232235777\n', name: 'IP 192.168.1.1' },
        { in: '1\n2147483648\n', name: 'Старший бит' },
        { in: '2\n16777216\n65536\n', name: 'Отдельные байты' },
        { in: '1\n3735928559\n', name: '0xDEADBEEF' },
        { in: '3\n255\n65535\n16777215\n', name: 'Растущие маски' },
      ],
    },
    {
      title: 'Разбор little-endian',
      description: `
Каждый запрос — тип (\`u16\`, \`u32\` или \`u64\`) и соответствующее число байтов (2, 4 или 8) в шестнадцатеричной записи. Байты заданы в порядке **little-endian**. Напечатайте значение беззнакового числа в десятичной записи.

Собирайте число сдвигами, а не \`memcpy\`.`,
      constraints: ['1 ≤ q ≤ 20.'],
      hints: [
        'Для little-endian байт i вносит (uint64_t)b[i] << (8 * i).',
        'Накопление: uint64_t v = 0; for (i = 0; i < size; i++) v |= (uint64_t)b[i] << (8 * i); печать — %llu с приведением к unsigned long long.',
      ],
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>

uint64_t get_le(const unsigned char *b, int size) {
    uint64_t v = 0;
    for (int i = 0; i < size; i++) {
        v |= (uint64_t)b[i] << (8 * i);
    }
    return v;
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        char type[4];
        scanf("%3s", type);
        int size = type[1] == '1' ? 2 : type[1] == '3' ? 4 : 8;
        unsigned char b[8];
        for (int i = 0; i < size; i++) {
            unsigned value;
            scanf("%x", &value);
            b[i] = (unsigned char)value;
        }
        printf("%llu\n", (unsigned long long)get_le(b, size));
    }
    return 0;
}`,
      explanation: `
В little-endian первый байт — младший, поэтому байт с номером \`i\` сдвигается на \`8i\` битов влево. Приведение к \`uint64_t\` до сдвига обязательно: сдвиг \`int\` на 32 и больше битов — неопределённое поведение, а 64-битное число нужно собирать в 64-битном типе.

Одна функция обслуживает все три ширины — меняется только количество байтов. Так читают поля форматов ZIP, BMP, WAV и ELF.`,
      examples: [
        { in: '2\nu16 34 12\nu32 78 56 34 12\n', out: '4660\n305419896\n' },
        { in: '1\nu64 ff ff ff ff ff ff ff ff\n', out: '18446744073709551615\n' },
      ],
      hidden: [
        { in: '1\nu16 00 00\n', name: 'Ноль' },
        { in: '1\nu16 ff ff\n', name: 'Максимум u16' },
        { in: '1\nu32 00 00 00 80\n', name: 'Старший бит u32' },
        { in: '1\nu32 01 00 00 00\n', name: 'Единица' },
        { in: '1\nu64 00 00 00 00 00 00 00 80\n', name: 'Старший бит u64' },
        { in: '1\nu64 ef cd ab 89 67 45 23 01\n', name: '0x0123456789ABCDEF' },
        { in: '3\nu16 90 1f\nu32 36 00 00 00\nu64 01 02 00 00 00 00 00 00\n', name: 'Смешанные' },
        { in: '1\nu32 ff ff ff ff\n', name: 'Максимум u32' },
      ],
    },
    {
      title: 'Найди ошибку: сдвиг в знаковый бит',
      bug: true,
      description: `
Функция \`read_u32_be\` собирает 32-битное число из четырёх байтов в порядке big-endian. Программа читает \`n\` байтов и печатает все полные четвёрки как числа. Для байтов меньше \`0x80\` всё верно, но для больших UBSan сообщает о недопустимом сдвиге.

Исправьте функцию.`,
      constraints: ['4 ≤ n ≤ 16.'],
      hints: [
        'Какой тип имеет выражение in[0] << 24, если in[0] — unsigned char?',
        'Приведите каждый байт до сдвига: (uint32_t)in[0] << 24.',
      ],
      starter: String.raw`
#include <stdint.h>
#include <stdio.h>

uint32_t read_u32_be(const unsigned char *in) {
    return in[0] << 24 | in[1] << 16 | in[2] << 8 | in[3];
}
${READ_MAIN}`,
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>

uint32_t read_u32_be(const unsigned char *in) {
    return (uint32_t)in[0] << 24 | (uint32_t)in[1] << 16 | (uint32_t)in[2] << 8 | (uint32_t)in[3];
}
${READ_MAIN}`,
      explanation: `
Перед сдвигом \`unsigned char\` превращается в \`int\` (целочисленное продвижение). Для \`in[0] = 0x80\` и больше результат \`in[0] << 24\` не помещается в \`int\` — это неопределённое поведение. На практике получается отрицательное число, которое при объединении с другими байтами и преобразовании в \`uint32_t\` может дать верный ответ, — но стандарт этого не обещает, и UBSan останавливает программу.

С приведением \`(uint32_t)\` весь расчёт идёт в беззнаковом 32-битном типе, где сдвиг до 31 бита определён.`,
      examples: [
        { in: '4\n12 34 56 78\n', out: '305419896\n' },
        { in: '4\nff ff ff ff\n', out: '4294967295\n' },
      ],
      hidden: [
        { in: '4\n80 00 00 00\n', name: 'Ровно старший бит' },
        { in: '4\n7f ff ff ff\n', name: 'Максимум без старшего бита' },
        { in: '8\n00 00 00 01 de ad be ef\n', name: 'Два числа' },
        { in: '5\nc0 a8 01 01 99\n', name: 'Неполная четвёрка' },
        { in: '4\n00 00 00 00\n', name: 'Нули' },
        { in: '12\n01 02 03 04 a1 b2 c3 d4 ff 00 ff 00\n', name: 'Три числа' },
        { in: '16\n80 80 80 80 7f 7f 7f 7f 00 ff 00 ff ff 00 ff 00\n', name: 'Четыре числа' },
        { in: '4\n90 1f 00 00\n', name: 'Перевёрнутый порт' },
      ],
    },
    {
      title: 'Размер картинки BMP',
      difficulty: 'advanced',
      description: `
Заголовок файла BMP хранит числа в порядке **little-endian**. Даны первые 26 байтов файла в шестнадцатеричной записи. Проверьте сигнатуру — первые два байта должны быть \`42 4d\` (буквы \`BM\`). Напечатайте:

\`\`\`
size=S offset=O width=W height=H
\`\`\`

где \`S\` — беззнаковое 32-битное число по смещению 2 (размер файла), \`O\` — по смещению 10 (начало пикселей), \`W\` и \`H\` — **знаковые** 32-битные числа по смещениям 18 и 22. Отрицательная высота в BMP означает, что строки хранятся сверху вниз. Если сигнатура неверна, напечатайте \`not a bmp\`.`,
      constraints: ['Ровно 26 байтов.'],
      hints: [
        'Напишите uint32_t get_u32_le(const unsigned char *b) со сдвигами (uint32_t)b[i] << (8 * i).',
        'Знаковое значение: int32_t v = (int32_t)get_u32_le(...); — на всех распространённых платформах преобразование даёт дополнительный код. Печать — через приведение к long.',
      ],
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>

uint32_t get_u32_le(const unsigned char *b) {
    return (uint32_t)b[0] | (uint32_t)b[1] << 8 | (uint32_t)b[2] << 16 | (uint32_t)b[3] << 24;
}

int main(void) {
    unsigned char h[26];
    for (int i = 0; i < 26; i++) {
        unsigned value;
        scanf("%x", &value);
        h[i] = (unsigned char)value;
    }
    if (h[0] != 0x42 || h[1] != 0x4d) {
        printf("not a bmp\n");
        return 0;
    }
    uint32_t size = get_u32_le(h + 2);
    uint32_t offset = get_u32_le(h + 10);
    int32_t width = (int32_t)get_u32_le(h + 18);
    int32_t height = (int32_t)get_u32_le(h + 22);
    printf("size=%lu offset=%lu width=%ld height=%ld\n", (unsigned long)size,
           (unsigned long)offset, (long)width, (long)height);
    return 0;
}`,
      explanation: `
Поля заголовка BMP — 32-битные числа в little-endian по фиксированным смещениям. Функция \`get_u32_le\` собирает их сдвигами, поэтому программа одинаково прочитает файл на любом процессоре. Ширина и высота знаковые: беззнаковое значение \`0xFFFFFF9C\` превращается в \`int32_t\` −100.

Смещения 18 и 22 не кратны 4, так что приведение \`*(int32_t *)(h + 18)\` было бы ещё и невыровненным доступом. Разбор сдвигами решает обе проблемы сразу — порядка байтов и выравнивания.`,
      examples: [
        { in: `${bmp(640, 480)}\n`, out: 'size=921654 offset=54 width=640 height=480\n' },
        { in: `${bmp(2, -3)}\n`.replace(/^42 4d/, '89 50'), out: 'not a bmp\n' },
      ],
      hidden: [
        { in: `${bmp(1, 1)}\n`, name: 'Один пиксель' },
        { in: `${bmp(1920, 1080)}\n`, name: 'Full HD' },
        { in: `${bmp(100, -100)}\n`, name: 'Отрицательная высота' },
        { in: `${bmp(65536, 2)}\n`, name: 'Ширина больше 16 бит' },
        { in: `${bmp(3, 5)}\n`, name: 'Маленькая картинка' },
        { in: `${bmp(4000, -3000)}\n`, name: 'Большая перевёрнутая' },
        { in: `${bmp(256, 256)}\n`.replace(/^42 4d/, '42 4e'), name: 'Почти правильная сигнатура' },
        { in: `${bmp(7, 300)}\n`, name: 'Узкая и высокая' },
      ],
    },
  ],
};
