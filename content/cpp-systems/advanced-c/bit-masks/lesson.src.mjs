const CONFIG = (fixed) => String.raw`
#include <stdio.h>
#include <string.h>

// 16-битное слово настройки: режим — биты 0–1, скорость — 2–5, уровень — 6–9, канал — 10–15.
static const struct {
    const char *name;
    unsigned pos, width;
} FIELDS[] = {{"mode", 0, 2}, {"speed", 2, 4}, {"level", 6, 4}, {"channel", 10, 6}};

static unsigned set_field(unsigned word, unsigned pos, unsigned width, unsigned value) {
${
  fixed
    ? '    unsigned mask = ((1u << width) - 1u) << pos;\n    return (word & ~mask) | ((value << pos) & mask);'
    : '    return word | (value << pos);'
}
}

static unsigned get_field(unsigned word, unsigned pos, unsigned width) {
    return (word >> pos) & ((1u << width) - 1u);
}

int main(void) {
    unsigned word = 0;
    char command[16], name[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "show") == 0) {
            printf("0x%04X\n", word);
            continue;
        }
        if (scanf("%15s", name) != 1) {
            break;
        }
        int index = -1;
        for (int i = 0; i < 4; i++) {
            if (strcmp(FIELDS[i].name, name) == 0) {
                index = i;
            }
        }
        if (index < 0) {
            continue;
        }
        if (strcmp(command, "set") == 0) {
            unsigned value;
            if (scanf("%u", &value) != 1) {
                break;
            }
            word = set_field(word, FIELDS[index].pos, FIELDS[index].width, value);
        } else if (strcmp(command, "get") == 0) {
            printf("%s = %u\n", name, get_field(word, FIELDS[index].pos, FIELDS[index].width));
        }
    }
    return 0;
}`;

export default {
  id: 'advanced-bit-masks',
  title: 'Битовые поля и маски',
  description:
    'Поле как позиция и ширина; чтение и запись поля, очистка места и обрезка значения; дата и время в формате FAT; множества чисел на битах и операции над ними; битовые массивы и решето Эратосфена; битовые поля структур и почему их расположение непереносимо.',
  moduleId: 'advanced-c',
  order: 20,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-bit-shifts'],
  objectives: [
    'Читать и записывать поля произвольной ширины в числе',
    'Упаковывать данные в компактные форматы и распаковывать их',
    'Представлять множества и большие наборы флагов битами',
    'Понимать ограничения битовых полей структур',
  ],
  tags: ['Биты', 'Маски', 'Битовые поля', 'Множества', 'Битовый массив'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Запишите маску поля шириной 4 бита на позиции 8 в шестнадцатеричном виде.',
      answers: ['0xF00', '0x0F00', '0xf00', '0x0f00'],
      placeholder: '0x…',
      explain: '((1u << 4) − 1) << 8 = 0xF << 8 = 0xF00: четыре единицы в битах 8–11.',
    },
    {
      q: 'Какое выражение читает поле шириной 3 бита на позиции 5 из беззнакового x?',
      options: ['(x >> 5) & 7u', '(x & 7u) >> 5', 'x & (7u << 5)', '(x >> 3) & 31u'],
      correct: 0,
      explain:
        'Сначала поле сдвигается в младшие биты, затем маска ширины 0b111 = 7 отрезает остальное. x & (7u << 5) выделяет поле, но оставляет его на месте — значение в 32 раза больше.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    unsigned date = 0x5A4Fu;          // формат FAT: год−1980 | месяц | день
    printf("%u-%02u-%02u\n", (date >> 9) + 1980, (date >> 5) & 0xFu, date & 0x1Fu);
    return 0;
}`,
      answers: ['2025-02-15'],
      placeholder: 'Вывод программы',
      explain: '0x5A4F = 0101101 0010 01111: год 45 + 1980 = 2025, месяц 2, день 15.',
    },
    {
      q: 'Почему битовые поля структур не используют для описания формата файла или сетевого пакета?',
      options: [
        'Порядок полей в слове, выравнивание и размер структуры определяет компилятор',
        'Битовые поля нельзя записывать в файл',
        'Битовые поля медленнее обычных полей',
        'Битовые поля не могут быть шире 8 бит',
      ],
      correct: 0,
      explain:
        'Расположение битовых полей — свойство реализации. Формат, заданный извне, кодируют явными сдвигами и масками.',
    },
    {
      q: 'Множества A = {1, 3, 5} и B = {3, 4} хранятся битами. Какие элементы в A & ~B? Перечислите через пробел.',
      answers: ['1 5'],
      placeholder: 'Элементы',
      explain: 'A & ~B — разность: элементы A, которых нет в B. Удаляется только 3.',
    },
    {
      q: 'В битовом массиве из uint32_t элемент i хранится в слове i >> 5 на позиции i & 31. В каком слове и на какой позиции лежит элемент 100? Напишите два числа через пробел.',
      answers: ['3 4'],
      placeholder: 'Слово и позиция',
      explain: '100 / 32 = 3 (остаток 4): слово 3, бит 4.',
    },
    {
      q: 'Поле на позиции 4 шириной 3 бита содержит 6 (110). Выполнили x |= 1u << 4, чтобы записать в поле 1. Что теперь в поле?',
      options: ['7', '1', '6', '0'],
      correct: 0,
      explain:
        'ИЛИ добавляет биты к старым: 110 | 001 = 111 = 7. Чтобы записать новое значение, место нужно сначала очистить: x &= ~(7u << 4).',
    },
    {
      q: 'Какой диапазон значений у знакового битового поля int level : 3;?',
      options: ['от −4 до 3', 'от 0 до 7', 'от −3 до 3', 'от −8 до 7'],
      correct: 0,
      explain:
        'Три бита в дополнительном коде дают восемь значений: от −4 до 3. Беззнаковое поле той же ширины хранит 0…7.',
    },
  ],
  exercises: [
    {
      title: 'Дата и время FAT',
      difficulty: 'beginner',
      description: `
Файловая система FAT хранит дату в 16 битах — год − 1980 (биты 9–15), месяц (5–8), день (0–4), — а время в других 16 — часы (11–15), минуты (5–10), секунды, делённые на 2 (0–4).

Команды до конца ввода:
- \`pack ГГГГ-ММ-ДД ЧЧ:ММ:СС\` — напечатать \`дата 0xHHHH время 0xHHHH\` (по четыре заглавные шестнадцатеричные цифры);
- \`unpack 0xHHHH 0xHHHH\` — дату и время напечатать в виде \`ГГГГ-ММ-ДД ЧЧ:ММ:СС\`.

Секунды при упаковке делятся на 2 с отбрасыванием остатка.`,
      constraints: ['Годы от 1980 до 2107; значения корректны; команд не больше 20.'],
      hints: [
        'Упаковка: (year - 1980) << 9 | month << 5 | day и hours << 11 | minutes << 5 | seconds / 2.',
        'Разбор строки даты и времени — scanf("%u-%u-%u %u:%u:%u", …); шестнадцатеричных чисел — scanf("%x %x", …).',
        'Распаковка: год — (date >> 9) + 1980, месяц — (date >> 5) & 0xF, день — date & 0x1F; секунды — (time & 0x1F) * 2.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "pack") == 0) {
            unsigned year, month, day, hours, minutes, seconds;
            if (scanf("%u-%u-%u %u:%u:%u", &year, &month, &day, &hours, &minutes, &seconds) != 6) {
                break;
            }
            unsigned date = (year - 1980) << 9 | month << 5 | day;
            unsigned time = hours << 11 | minutes << 5 | seconds / 2;
            printf("дата 0x%04X время 0x%04X\n", date, time);
        } else if (strcmp(command, "unpack") == 0) {
            unsigned date, time;
            if (scanf("%x %x", &date, &time) != 2) {
                break;
            }
            printf("%u-%02u-%02u %02u:%02u:%02u\n", (date >> 9) + 1980, (date >> 5) & 0xFu,
                   date & 0x1Fu, time >> 11, (time >> 5) & 0x3Fu, (time & 0x1Fu) * 2);
        }
    }
    return 0;
}`,
      explanation: `
Каждая величина — поле фиксированной ширины в известной позиции. Упаковка сдвигает поля на их места и объединяет через \`|\`; поля не пересекаются, поэтому ИЛИ здесь работает как сложение. Распаковка — сдвиг вниз и маска ширины поля: \`0xF\` для 4-битного месяца, \`0x1F\` для 5-битного дня, \`0x3F\` для 6-битных минут.

Для старшего поля маска не нужна: выше него в 16-битном значении ничего нет. Секунды хранятся с шагом 2 — пять битов вмещают только 0…31, поэтому нечётные секунды теряют единицу.`,
      examples: [
        {
          in: 'pack 2024-03-15 14:30:45\nunpack 0x586F 0x73D6\n',
          out: 'дата 0x586F время 0x73D6\n2024-03-15 14:30:44\n',
        },
        { in: 'pack 1980-01-01 00:00:00\n', out: 'дата 0x0021 время 0x0000\n' },
      ],
      hidden: [
        { in: 'pack 2107-12-31 23:59:59\n', name: 'Максимальные значения' },
        { in: 'unpack 0xFF9F 0xBF7D\n', name: 'Распаковка максимума' },
        { in: 'pack 2000-02-29 12:00:01\n', name: 'Високосный день' },
        { in: 'unpack 0x0021 0x0000\n', name: 'Начало эпохи' },
        { in: 'pack 1999-09-09 09:09:09\nunpack 0x2729 0x4924\n', name: 'Девятки' },
        { in: 'unpack 0x5a4f 0x8000\n', name: 'Строчные цифры' },
        { in: 'pack 2025-07-04 06:07:08\n', name: 'Обычная дата' },
        {
          in: 'pack 1980-01-01 00:00:59\npack 1980-01-01 00:59:00\npack 1980-01-01 23:00:00\n',
          name: 'Поля времени по отдельности',
        },
      ],
    },
    {
      title: 'Множества на битах',
      description: `
Храните два множества \`A\` и \`B\` чисел от 0 до 63, каждое — в одном \`uint64_t\`. Вначале оба пусты. Команды до конца ввода:
- \`add S x\`, \`del S x\` — добавить или удалить число \`x\` из множества \`S\` (\`A\` или \`B\`);
- \`has S x\` — напечатать \`да\` или \`нет\`;
- \`size S\` — число элементов;
- \`print S\` — элементы по возрастанию через пробел или \`пусто\`;
- \`union\`, \`inter\`, \`diff\`, \`xor\` — напечатать (как \`print\`) A ∪ B, A ∩ B, A \\ B и симметрическую разность.`,
      constraints: ['0 ≤ x ≤ 63; команд не больше 100.'],
      hints: [
        'Маска числа x — UINT64_C(1) << x: литерал 1u здесь не подходит, сдвиг на 32 и больше для него не определён.',
        "Храните множества в массиве uint64_t sets[2] и выбирайте индекс по букве: S == 'A' ? 0 : 1.",
        'Операции над множествами — одна побитовая операция: a | b, a & b, a & ~b, a ^ b. Печать — проверка 64 битов по очереди.',
      ],
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static void print_set(uint64_t set) {
    if (set == 0) {
        printf("пусто\n");
        return;
    }
    int first = 1;
    for (int k = 0; k < 64; k++) {
        if ((set >> k) & 1u) {
            printf(first ? "%d" : " %d", k);
            first = 0;
        }
    }
    printf("\n");
}

static int count(uint64_t set) {
    int n = 0;
    for (; set != 0; set &= set - 1) {
        n++;
    }
    return n;
}

int main(void) {
    uint64_t sets[2] = {0, 0};
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "union") == 0) {
            print_set(sets[0] | sets[1]);
        } else if (strcmp(command, "inter") == 0) {
            print_set(sets[0] & sets[1]);
        } else if (strcmp(command, "diff") == 0) {
            print_set(sets[0] & ~sets[1]);
        } else if (strcmp(command, "xor") == 0) {
            print_set(sets[0] ^ sets[1]);
        } else {
            char which;
            if (scanf(" %c", &which) != 1) {
                break;
            }
            uint64_t *s = &sets[which == 'A' ? 0 : 1];
            if (strcmp(command, "size") == 0) {
                printf("%d\n", count(*s));
                continue;
            }
            if (strcmp(command, "print") == 0) {
                print_set(*s);
                continue;
            }
            int x;
            if (scanf("%d", &x) != 1 || x < 0 || x > 63) {
                break;
            }
            uint64_t bit = UINT64_C(1) << x;
            if (strcmp(command, "add") == 0) {
                *s |= bit;
            } else if (strcmp(command, "del") == 0) {
                *s &= ~bit;
            } else if (strcmp(command, "has") == 0) {
                printf("%s\n", (*s & bit) != 0 ? "да" : "нет");
            }
        }
    }
    return 0;
}`,
      explanation: `
Множество из чисел от 0 до 63 — это 64 флага «входит / не входит», и они помещаются в одно 64-битное число. Тогда операции теории множеств становятся побитовыми: объединение — \`|\`, пересечение — \`&\`, разность — \`& ~\`, симметрическая разность — \`^\`. Каждая выполняется одной командой процессора для всех 64 элементов сразу.

Главная тонкость — ширина маски. \`1u << x\` при \`x ≥ 32\` — неопределённое поведение, поэтому единица должна быть 64-битной: \`UINT64_C(1) << x\`. Размер множества — число единичных битов; цикл \`set &= set - 1\` убирает по одной единице.`,
      examples: [
        {
          in: 'add A 1\nadd A 3\nadd A 5\nadd B 3\nadd B 4\nunion\ninter\ndiff\nxor\n',
          out: '1 3 4 5\n3\n1 5\n1 4 5\n',
        },
        { in: 'print A\nadd B 63\nhas B 63\nsize B\nhas A 63\n', out: 'пусто\nда\n1\nнет\n' },
      ],
      hidden: [
        {
          in: 'add A 0\nadd A 63\nadd A 31\nadd A 32\nprint A\nsize A\n',
          name: 'Границы и середина',
        },
        { in: 'add A 5\ndel A 5\ndel A 6\nprint A\nsize A\n', name: 'Удаление' },
        { in: 'add A 1\nadd A 1\nsize A\n', name: 'Повторное добавление' },
        { in: 'add A 10\nadd B 20\ninter\ndiff\nunion\n', name: 'Непересекающиеся' },
        { in: 'add A 7\nadd B 7\nxor\ninter\n', name: 'Одинаковые множества' },
        { in: 'add B 40\nadd B 50\ndiff\nprint B\n', name: 'Пустое A' },
        {
          in: 'add A 33\nadd A 34\nadd A 35\nadd B 34\nadd B 60\nunion\ninter\ndiff\nxor\nsize A\nsize B\n',
          name: 'Старшая половина',
        },
        { in: 'has A 0\nhas B 63\nprint B\n', name: 'Проверки в пустых' },
      ],
    },
    {
      title: 'Найди ошибку: запись поля',
      bug: true,
      description: `
16-битное слово настройки устройства состоит из полей: \`mode\` — биты 0–1, \`speed\` — 2–5, \`level\` — 6–9, \`channel\` — 10–15. Команды: \`set ПОЛЕ ЗНАЧЕНИЕ\` (значение обрезается до ширины поля), \`get ПОЛЕ\` и \`show\` — печать слова в виде \`0xHHHH\`. Вначале слово равно нулю.

Первая запись в поле работает, а повторные дают неверные значения, иногда портя соседние поля. Исправьте функцию записи поля.`,
      constraints: ['Значения от 0 до 1000; команд не больше 50.'],
      hints: [
        'Что происходит со старым значением поля, когда новое накладывается через |?',
        'Перед записью очистите место: word & ~mask, где mask = ((1u << width) - 1u) << pos. Значение тоже обрежьте маской: (value << pos) & mask.',
      ],
      starter: CONFIG(false),
      solution: CONFIG(true),
      explanation: `
\`word | (value << pos)\` складывает биты нового значения со старыми: записать 2 (\`10\`) в поле со значением 1 (\`01\`) — получится 3 (\`11\`), а записать меньшее число вообще невозможно. Кроме того, значение не обрезается: если оно шире поля, его старшие биты попадают в соседнее поле.

Правильная запись состоит из двух шагов: \`word & ~mask\` обнуляет биты поля, не трогая остальные, а \`(value << pos) & mask\` кладёт новое значение, отрезав всё, что выходит за поле. Это универсальный шаблон для любых упакованных форматов и регистров устройств.`,
      examples: [
        { in: 'set speed 5\nset speed 2\nget speed\nshow\n', out: 'speed = 2\n0x0008\n' },
        { in: 'set mode 3\nset level 9\nshow\n', out: '0x0243\n' },
      ],
      hidden: [
        'set channel 63\nset channel 1\nshow\nget channel\n',
        'set mode 7\nshow\nget speed\n',
        'set speed 15\nset level 15\nset speed 0\nshow\n',
        'set level 100\nget level\nget channel\nshow\n',
        'set mode 1\nset mode 2\nset mode 0\nget mode\n',
        'show\nget mode\n',
        'set channel 1000\nshow\n',
        'set mode 3\nset speed 15\nset level 15\nset channel 63\nset level 0\nshow\n',
      ],
    },
    {
      title: 'Решето на битовом массиве',
      difficulty: 'advanced',
      description: `
Прочитайте числа \`n\` до конца ввода. Для каждого напечатайте \`n: простых K, наибольшее P\` — сколько простых чисел не больше \`n\` и наибольшее из них; если простых нет, вместо \`наибольшее P\` напечатайте \`наибольшего нет\`.

Постройте решето Эратосфена **один раз** — до наибольшего из запрошенных \`n\`, — и храните его в битовом массиве: бит \`i\` слова \`i >> 5\` (\`uint32_t\`) отмечает, что число \`i\` составное. Массив \`bool\` или \`char\` на два миллиона элементов занял бы в 8 раз больше памяти.`,
      constraints: [
        '0 ≤ n ≤ 2 000 000; чисел не больше 20.',
        'Ограничение по времени — несколько секунд с санитайзерами: решето должно строиться один раз.',
      ],
      hints: [
        'Сначала прочитайте все n в массив и найдите максимум — до него и стройте решето.',
        'Отметка составного: words[m >> 5] |= 1u << (m & 31). Вычёркивайте кратные p, начиная с p · p, пока p · p ≤ max.',
        'Чтобы ответить быстро, после решета посчитайте для каждого запроса количество простых проходом до n — или заранее заведите накопленные суммы. Двадцати проходов по 2 000 000 достаточно.',
      ],
      solution: String.raw`
#include <stdint.h>
#include <stdio.h>

enum { MAX_N = 2000000 };
static uint32_t composite[MAX_N / 32 + 1];

static void mark(unsigned i) {
    composite[i >> 5] |= 1u << (i & 31);
}

static int is_composite(unsigned i) {
    return (composite[i >> 5] >> (i & 31)) & 1u;
}

int main(void) {
    unsigned queries[20];
    int q = 0;
    unsigned max = 0;
    while (q < 20 && scanf("%u", &queries[q]) == 1) {
        if (queries[q] > MAX_N) {
            queries[q] = MAX_N;
        }
        if (queries[q] > max) {
            max = queries[q];
        }
        q++;
    }
    mark(0);
    mark(1);
    for (unsigned p = 2; (unsigned long)p * p <= max; p++) {
        if (!is_composite(p)) {
            for (unsigned m = p * p; m <= max; m += p) {
                mark(m);
            }
        }
    }
    for (int i = 0; i < q; i++) {
        unsigned n = queries[i];
        unsigned count = 0, largest = 0;
        for (unsigned k = 2; k <= n; k++) {
            if (!is_composite(k)) {
                count++;
                largest = k;
            }
        }
        printf("%u: простых %u, ", n, count);
        if (count == 0) {
            printf("наибольшего нет\n");
        } else {
            printf("наибольшее %u\n", largest);
        }
    }
    return 0;
}`,
      explanation: `
Решето Эратосфена вычёркивает кратные каждого простого числа; то, что осталось невычеркнутым, — простые. Каждому числу нужен один флаг «составное», и битовый массив хранит его в одном бите: два миллиона флагов занимают около 250 КБ вместо 2 МБ для массива \`char\`. Меньше памяти — меньше промахов кэша, и на больших пределах битовая версия часто оказывается и быстрее.

Номер слова и позиция бита вычисляются сдвигом и маской: \`i >> 5\` — деление на 32, \`i & 31\` — остаток. Вычёркивание начинается с \`p · p\`: меньшие кратные уже вычеркнуты меньшими простыми. Условие цикла \`p * p <= max\` вычисляется в \`unsigned long\`, чтобы произведение не переполнилось.

Решето строится один раз до наибольшего запроса — повторное построение для каждого числа было бы в двадцать раз медленнее.`,
      examples: [
        {
          in: '10\n100\n1\n',
          out: '10: простых 4, наибольшее 7\n100: простых 25, наибольшее 97\n1: простых 0, наибольшего нет\n',
        },
        { in: '2\n', out: '2: простых 1, наибольшее 2\n' },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '3\n4\n5\n', name: 'Маленькие числа' },
        { in: '1000\n', name: 'Тысяча' },
        { in: '1000000\n', name: 'Миллион' },
        { in: '2000000\n', name: 'Два миллиона' },
        { in: '97\n98\n', name: 'Простое и следующее' },
        { in: '31\n32\n33\n64\n65\n', name: 'Границы слов' },
        { in: '1999993\n1999992\n', name: 'Большое простое' },
      ],
    },
  ],
};
