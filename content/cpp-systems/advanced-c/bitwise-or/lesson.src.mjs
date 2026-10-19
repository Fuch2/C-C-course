const MAIL = (fixed) => {
  const low = (value) => (fixed ? `UINT64_C(${value})` : `${value}u`);
  return String.raw`
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define SEEN ${low('0x1')}
#define ANSWERED ${low('0x2')}
#define FLAGGED ${low('0x4')}
#define DRAFT ${low('0x8')}
#define ARCHIVED (UINT64_C(1) << 40)
#define SPAM (UINT64_C(1) << 41)

static const struct {
    const char *name;
    uint64_t mask;
} NAMES[] = {
    {"seen", SEEN}, {"answered", ANSWERED}, {"flagged", FLAGGED},
    {"draft", DRAFT}, {"archived", ARCHIVED}, {"spam", SPAM},
};

static void clear_flag(uint64_t *flags, const char *name) {
    if (strcmp(name, "seen") == 0) {
        *flags &= ~SEEN;
    } else if (strcmp(name, "answered") == 0) {
        *flags &= ~ANSWERED;
    } else if (strcmp(name, "flagged") == 0) {
        *flags &= ~FLAGGED;
    } else if (strcmp(name, "draft") == 0) {
        *flags &= ~DRAFT;
    } else if (strcmp(name, "archived") == 0) {
        *flags &= ~ARCHIVED;
    } else if (strcmp(name, "spam") == 0) {
        *flags &= ~SPAM;
    }
}

static void set_flag(uint64_t *flags, const char *name) {
    for (size_t i = 0; i < sizeof NAMES / sizeof NAMES[0]; i++) {
        if (strcmp(NAMES[i].name, name) == 0) {
            *flags |= NAMES[i].mask;
        }
    }
}

int main(void) {
    uint64_t flags = 0;
    char command[16], name[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "set") == 0 && scanf("%15s", name) == 1) {
            set_flag(&flags, name);
        } else if (strcmp(command, "clear") == 0 && scanf("%15s", name) == 1) {
            clear_flag(&flags, name);
        } else if (strcmp(command, "show") == 0) {
            printf("0x%" PRIX64 ":", flags);
            for (size_t i = 0; i < sizeof NAMES / sizeof NAMES[0]; i++) {
                if (flags & NAMES[i].mask) {
                    printf(" %s", NAMES[i].name);
                }
            }
            printf("\n");
        }
    }
    return 0;
}`;
};

export default {
  id: 'advanced-bitwise-or',
  title: 'Побитовое ИЛИ, НЕ и флаги',
  description:
    'Операция | и установка битов; флаги как степени двойки и их наборы; операция ~ и целочисленное продвижение маленьких типов; сброс битов через & ~; проверки «хотя бы один» и «все»; ширина маски для 64-битных чисел; права доступа Unix и восьмеричные литералы; различие | и ||.',
  moduleId: 'advanced-c',
  order: 17,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['advanced-bitwise-and'],
  objectives: [
    'Устанавливать, сбрасывать и проверять биты операциями |, & ~ и &',
    'Описывать наборы флагов степенями двойки',
    'Учитывать продвижение маленьких типов и ширину маски при использовании ~',
    'Работать с правами доступа Unix в восьмеричной записи',
  ],
  tags: ['Биты', '|', '~', 'Флаги', 'Права доступа'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чему равно 0x05 | 0x0A? Запишите в шестнадцатеричном виде.',
      answers: ['0x0F', '0xF', '0x0f', '0xf', '15'],
      placeholder: 'Например, 0x1F',
      explain: '0101 | 1010 = 1111: в каждой позиции единица есть хотя бы в одном операнде.',
    },
    {
      q: 'Почему значения флагов задают степенями двойки: 1, 2, 4, 8…?',
      options: [
        'У каждого флага ровно один свой бит, и любую комбинацию можно однозначно разобрать',
        'Так флаги быстрее сравниваются',
        'Компилятор требует, чтобы значения enum были степенями двойки',
        'Степени двойки занимают меньше памяти',
      ],
      correct: 0,
      explain:
        'Если бы флаги имели значения 1, 2, 3, то комбинация 1 | 2 совпала бы с флагом 3, и разобрать набор было бы невозможно.',
    },
    {
      q: 'Какое выражение сбрасывает бит 3 беззнакового x, не меняя остальные?',
      options: ['x & ~(1u << 3)', 'x | ~(1u << 3)', 'x & (1u << 3)', 'x | (1u << 3)'],
      correct: 0,
      explain:
        '~(1u << 3) — все единицы, кроме бита 3; & с такой маской обнуляет только его. x | (1u << 3) бит устанавливает, x & (1u << 3) оставляет только его.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

enum { A = 1u << 0, B = 1u << 1, C = 1u << 2, D = 1u << 3 };

int main(void) {
    unsigned f = A | C;
    f |= D;
    f &= ~A;
    printf("%u %d %d\n", f, (f & (C | D)) == (C | D), (f & B) != 0);
    return 0;
}`,
      answers: ['12 1 0'],
      placeholder: 'Вывод программы',
      explain:
        'A | C = 5, после |= D — 13, после сброса A — 12 (C | D). Оба флага C и D установлены, B — нет.',
    },
    {
      q: 'Чему равно выражение ~x, если uint8_t x = 0x0F; и результат печатается как int?',
      options: ['-16', '240', '0xF0', '0'],
      correct: 0,
      explain:
        'Перед операцией uint8_t продвигается до int, и ~ переворачивает все 32 бита: 0xFFFFFFF0 — это −16. Чтобы получить 240, нужно привести результат к uint8_t.',
    },
    {
      q: 'Переменная uint64_t x = UINT64_MAX; выполнили x &= ~0x1u;. Что произошло?',
      options: [
        'Сбросился бит 0 и все старшие 32 бита',
        'Сбросился только бит 0',
        'Ничего не изменилось',
        'Ошибка компиляции',
      ],
      correct: 0,
      explain:
        '~0x1u — 32-битное 0xFFFFFFFE. При переводе в uint64_t старшие биты дополняются нулями, и & их стирает. Нужна 64-битная маска: ~UINT64_C(1).',
    },
    {
      q: 'Какие права даёт восьмеричное значение 0750? Запишите строкой из девяти символов.',
      answers: ['rwxr-x---'],
      placeholder: 'rwx…',
      explain: '7 = 111 — rwx владельцу, 5 = 101 — r-x группе, 0 = 000 — ничего остальным.',
    },
    {
      q: 'Что выведет printf("%d %d\\n", 6 | 3, 6 || 3);?',
      answers: ['7 1'],
      placeholder: 'Вывод',
      explain: '110 | 011 = 111 = 7, а логическое ИЛИ даёт просто 1 — «истина».',
    },
  ],
  exercises: [
    {
      title: 'Права доступа',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — права доступа Unix в одной из двух записей: тремя восьмеричными цифрами (\`755\`) или строкой из девяти символов (\`rwxr-x---\`). Переведите каждую запись в другую.

В строке позиции 1–3 относятся к владельцу, 4–6 — к группе, 7–9 — к остальным; в каждой тройке буквы \`r\`, \`w\`, \`x\` означают чтение, запись и выполнение, а \`-\` — отсутствие права. Восьмеричные числа печатайте ровно тремя цифрами.`,
      constraints: ['Записи корректны; строк не больше 20.'],
      hints: [
        'Отличить запись просто: если первый символ — цифра, это восьмеричное число. Прочитать его можно форматом %o.',
        "Бит позиции i строки (i от 0 до 8) — 1u << (8 - i). Для строки → числа: если символ не '-', сделайте mode |= бит.",
        'Число → строка: putchar(mode & бит ? "rwxrwxrwx"[i] : \'-\'). Печать числа тремя восьмеричными цифрами — printf("%03o\\n", mode).',
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>

int main(void) {
    char word[16];
    const char *letters = "rwxrwxrwx";
    while (scanf("%15s", word) == 1) {
        if (isdigit((unsigned char)word[0])) {
            unsigned mode;
            if (sscanf(word, "%o", &mode) != 1) {
                continue;
            }
            for (int i = 0; i < 9; i++) {
                putchar(mode & (1u << (8 - i)) ? letters[i] : '-');
            }
            putchar('\n');
        } else {
            unsigned mode = 0;
            for (int i = 0; i < 9 && word[i] != '\0'; i++) {
                if (word[i] != '-') {
                    mode |= 1u << (8 - i);
                }
            }
            printf("%03o\n", mode);
        }
    }
    return 0;
}`,
      explanation: `
Девять прав — девять битов, и запись \`rwxr-x---\` — это просто двоичное число \`111 101 000\`, где единица изображена буквой. Восьмеричная система удобна потому, что каждая её цифра — ровно три бита, то есть одна тройка прав.

Позиция в строке и номер бита связаны формулой \`8 − i\`: первая буква — старший бит. Сборка числа — последовательные \`|=\` для каждой буквы, разбор — проверка каждого бита через \`&\`. Форматы \`%o\` для \`scanf\` и \`%03o\` для \`printf\` читают и печатают восьмеричные числа без ручного перевода.`,
      examples: [
        { in: '755\nrw-r--r--\n', out: 'rwxr-xr-x\n644\n' },
        { in: '000\n---------\n', out: '---------\n000\n' },
      ],
      hidden: [
        { in: '777\n', name: 'Все права' },
        { in: 'rwxrwxrwx\n', name: 'Все права строкой' },
        { in: '600\n640\n', name: 'Только владелец и группа' },
        { in: 'r--------\n--x--x--x\n', name: 'Отдельные права' },
        { in: '111\n222\n444\n', name: 'Одинаковые тройки' },
        { in: '-w--w--w-\n', name: 'Только запись' },
        { in: '754\nrwxr-xr--\n', name: 'Туда и обратно' },
        { in: '001\n--------x\n', name: 'Младший бит' },
      ],
    },
    {
      title: 'Набор флагов',
      description: `
Храните набор из шести флагов в одной переменной: \`bold\` (бит 0), \`italic\` (бит 1), \`underline\` (бит 2), \`strike\` (бит 3), \`code\` (бит 4), \`link\` (бит 5). Вначале все флаги сброшены. Команды до конца ввода:
- \`set ИМЯ\` — установить флаг;
- \`clear ИМЯ\` — сбросить флаг;
- \`has ИМЯ\` — напечатать \`да\` или \`нет\`;
- \`all ИМЯ1 ИМЯ2\` — напечатать \`да\`, если установлены **оба** флага, иначе \`нет\`;
- \`any ИМЯ1 ИМЯ2\` — напечатать \`да\`, если установлен **хотя бы один**;
- \`show\` — напечатать значение набора в виде \`0xHH\` (две шестнадцатеричные цифры) и имена установленных флагов в порядке битов через \`|\` или \`нет\`;
- \`reset\` — сбросить все флаги.

Для неизвестного имени напечатайте \`неизвестный флаг ИМЯ\` (и ничего не меняйте; в командах \`all\` и \`any\` — только это сообщение, для первого неизвестного имени).`,
      constraints: ['Команд не больше 100; имена — до 15 символов.'],
      hints: [
        'Таблица имён: static const char *const NAMES[] = {"bold", "italic", …}; функция поиска возвращает номер бита или −1.',
        'Маска флага — 1u << номер. set: flags |= mask; clear: flags &= ~mask; has: (flags & mask) != 0.',
        'Для all и any сложите маски двух флагов через |: all — (flags & m) == m, any — (flags & m) != 0.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

static const char *const NAMES[] = {"bold", "italic", "underline", "strike", "code", "link"};
enum { FLAG_COUNT = sizeof NAMES / sizeof NAMES[0] };

static int find_flag(const char *name) {
    for (int i = 0; i < FLAG_COUNT; i++) {
        if (strcmp(NAMES[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

int main(void) {
    unsigned flags = 0;
    char command[16], first[16], second[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "show") == 0) {
            printf("0x%02X ", flags);
            if (flags == 0) {
                printf("нет");
            }
            int printed = 0;
            for (int i = 0; i < FLAG_COUNT; i++) {
                if (flags & (1u << i)) {
                    printf(printed++ ? "|%s" : "%s", NAMES[i]);
                }
            }
            printf("\n");
            continue;
        }
        if (strcmp(command, "reset") == 0) {
            flags = 0;
            continue;
        }
        int pair = strcmp(command, "all") == 0 || strcmp(command, "any") == 0;
        if (scanf("%15s", first) != 1 || (pair && scanf("%15s", second) != 1)) {
            break;
        }
        int a = find_flag(first);
        int b = pair ? find_flag(second) : 0;
        if (a < 0 || b < 0) {
            printf("неизвестный флаг %s\n", a < 0 ? first : second);
            continue;
        }
        unsigned mask = 1u << a;
        if (strcmp(command, "set") == 0) {
            flags |= mask;
        } else if (strcmp(command, "clear") == 0) {
            flags &= ~mask;
        } else if (strcmp(command, "has") == 0) {
            printf("%s\n", (flags & mask) != 0 ? "да" : "нет");
        } else if (pair) {
            mask |= 1u << b;
            int ok = strcmp(command, "all") == 0 ? (flags & mask) == mask : (flags & mask) != 0;
            printf("%s\n", ok ? "да" : "нет");
        }
    }
    return 0;
}`,
      explanation: `
Все команды сводятся к трём операциям: \`|=\` устанавливает, \`&= ~\` сбрасывает, \`&\` проверяет. Проверки «все» и «хотя бы один» отличаются только сравнением: \`(flags & mask) == mask\` требует, чтобы под маской были все единицы, \`!= 0\` — хотя бы одна.

Имена хранятся в таблице, и номер бита — это просто индекс имени. Число флагов вычисляется из таблицы через \`sizeof\` и кладётся в \`enum\`: добавьте имя в таблицу — и все команды, включая \`show\`, поддержат новый флаг.

Неизвестное имя проверяется до любых изменений, поэтому ошибочная команда не портит набор.`,
      examples: [
        {
          in: 'set bold\nset link\nshow\nhas italic\nclear bold\nshow\n',
          out: '0x21 bold|link\nнет\n0x20 link\n',
        },
        {
          in: 'show\nset code\nall code bold\nany code bold\nset blink\n',
          out: '0x00 нет\nнет\nда\nнеизвестный флаг blink\n',
        },
      ],
      hidden: [
        {
          in: 'set bold\nset italic\nset underline\nset strike\nset code\nset link\nshow\n',
          name: 'Все флаги',
        },
        { in: 'set bold\nset bold\nshow\nclear italic\nshow\n', name: 'Повторы' },
        { in: 'set strike\nreset\nshow\nhas strike\n', name: 'reset' },
        {
          in: 'set italic\nset underline\nall italic underline\nall italic bold\n',
          name: 'Проверка all',
        },
        { in: 'any bold link\nset link\nany bold link\n', name: 'Проверка any' },
        { in: 'all bold nope\nany zzz bold\nclear what\n', name: 'Неизвестные имена' },
        { in: 'set code\nclear code\nhas code\nshow\n', name: 'Установить и сбросить' },
        {
          in: 'set underline\nset strike\nshow\nclear underline\nshow\n',
          name: 'Шестнадцатеричное значение',
        },
      ],
    },
    {
      title: 'Найди ошибку: флаги письма',
      bug: true,
      description: `
Почтовый клиент хранит флаги письма в 64-битном числе: \`seen\`, \`answered\`, \`flagged\`, \`draft\` — младшие биты, \`archived\` и \`spam\` — биты 40 и 41. Команды: \`set ИМЯ\`, \`clear ИМЯ\` и \`show\` — печать значения в шестнадцатеричном виде и имён установленных флагов.

После сброса одного из младших флагов письмо «теряет» флаги \`archived\` и \`spam\`, хотя их никто не сбрасывал. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 50.'],
      hints: [
        'Выпишите тип и значение выражения ~SEEN. Сколько в нём битов?',
        'SEEN определён как 0x1u — 32-битное число, и ~SEEN тоже 32-битное: при расширении до uint64_t старшие биты становятся нулями. Определите младшие маски 64-битными: UINT64_C(0x1).',
      ],
      starter: MAIL(false),
      solution: MAIL(true),
      explanation: `
\`SEEN\` равен \`0x1u\` — это \`unsigned int\`, 32 бита. \`~SEEN\` переворачивает биты **в этом типе** и даёт \`0xFFFFFFFE\`. Только потом, при операции с \`uint64_t\`, значение расширяется до 64 бит — и старшие 32 бита оказываются нулями. \`flags &= ~SEEN\` стирает всё выше бита 31, включая \`archived\` и \`spam\`.

С масками \`UINT64_C(0x1)\` выражение \`~SEEN\` сразу 64-битное: \`0xFFFFFFFFFFFFFFFE\`, и сбрасывается ровно один бит. Установка через \`|=\` работала и раньше — при расширении нули в старших битах для \`|\` безвредны. Поэтому ошибка проявлялась только при сбросе, и только для младших флагов: \`ARCHIVED\` и \`SPAM\` были 64-битными с самого начала.`,
      examples: [
        { in: 'set seen\nset archived\nclear seen\nshow\n', out: '0x10000000000: archived\n' },
        { in: 'set spam\nset draft\nshow\n', out: '0x20000000008: draft spam\n' },
      ],
      hidden: [
        'set archived\nset spam\nclear answered\nshow\n',
        'set seen\nset answered\nset flagged\nset draft\nclear flagged\nshow\n',
        'set spam\nclear spam\nshow\n',
        'show\n',
        'set archived\nclear draft\nclear seen\nset seen\nshow\n',
        'set seen\nset spam\nclear seen\nclear seen\nshow\n',
        'set flagged\nset archived\nset spam\nclear archived\nshow\n',
        'set draft\nset archived\nclear draft\nshow\nset answered\nshow\n',
      ],
    },
    {
      title: 'Широковещательный адрес',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — подсеть в записи \`a.b.c.d/p\`. Для каждой напечатайте четыре строки:

\`\`\`
сеть: N
широковещательный: B
узлы: FIRST - LAST
количество: K
\`\`\`

- \`N\` — адрес сети: биты вне маски обнулены (\`адрес & маска\`);
- \`B\` — широковещательный адрес: биты вне маски установлены (\`сеть | ~маска\`);
- для \`p ≤ 30\` узлы — от \`N + 1\` до \`B − 1\`, количество — \`2^(32 − p) − 2\`;
- для \`/31\` (соединение двух устройств) узлы — от \`N\` до \`B\`, количество — 2;
- для \`/32\` — единственный узел: сам адрес, количество — 1.`,
      constraints: [
        '0 ≤ p ≤ 32, числа в адресах от 0 до 255; строк не больше 20.',
        'Количество для /0 не помещается в 32 бита — используйте 64-битный тип.',
      ],
      hints: [
        'Маска: p == 0 ? 0 : 0xFFFFFFFFu << (32 - p). Широковещательный адрес — network | ~mask; обе величины храните в uint32_t.',
        'Количество адресов в сети — (uint64_t)1 << (32 - p): для /0 это 2³², и в uint32_t оно не поместится.',
        'Напишите функцию печати адреса из uint32_t: (ip >> 24) & 0xFF, (ip >> 16) & 0xFF и так далее.',
      ],
      solution: String.raw`
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>

static void print_ip(uint32_t ip) {
    printf("%u.%u.%u.%u", (unsigned)(ip >> 24), (unsigned)(ip >> 16) & 0xFFu,
           (unsigned)(ip >> 8) & 0xFFu, (unsigned)ip & 0xFFu);
}

int main(void) {
    unsigned a, b, c, d, p;
    while (scanf("%u.%u.%u.%u/%u", &a, &b, &c, &d, &p) == 5 && p <= 32) {
        uint32_t addr = (uint32_t)a << 24 | (uint32_t)b << 16 | (uint32_t)c << 8 | (uint32_t)d;
        uint32_t mask = p == 0 ? 0 : 0xFFFFFFFFu << (32 - p);
        uint32_t network = addr & mask;
        uint32_t broadcast = network | ~mask;
        uint32_t first = network, last = broadcast;
        uint64_t count = (uint64_t)1 << (32 - p);
        if (p <= 30) {
            first = network + 1;
            last = broadcast - 1;
            count -= 2;
        } else if (p == 32) {
            first = last = addr;
        }
        printf("сеть: ");
        print_ip(network);
        printf("\nшироковещательный: ");
        print_ip(broadcast);
        printf("\nузлы: ");
        print_ip(first);
        printf(" - ");
        print_ip(last);
        printf("\nколичество: %" PRIu64 "\n", count);
    }
    return 0;
}`,
      explanation: `
Адрес сети и широковещательный адрес — две противоположные операции с маской: \`&\` обнуляет биты узла, а \`| ~mask\` заполняет их единицами. Всё, что между ними, — адреса узлов; сами крайние адреса в обычной сети узлам не выдают. Сети \`/31\` и \`/32\` — особые случаи, закреплённые в стандартах интернета: в \`/31\` оба адреса принадлежат двум концам соединения, в \`/32\` есть ровно один адрес.

Две ловушки ширины типов. Маска для \`/0\` требует сдвига на 32 позиции — это неопределённое поведение, поэтому ноль обрабатывается отдельно. А количество адресов для \`/0\` равно 2³² и не помещается в \`uint32_t\`: его считают в \`uint64_t\`.`,
      examples: [
        {
          in: '192.168.1.77/24\n',
          out: 'сеть: 192.168.1.0\nшироковещательный: 192.168.1.255\nузлы: 192.168.1.1 - 192.168.1.254\nколичество: 254\n',
        },
        {
          in: '10.0.0.5/31\n',
          out: 'сеть: 10.0.0.4\nшироковещательный: 10.0.0.5\nузлы: 10.0.0.4 - 10.0.0.5\nколичество: 2\n',
        },
      ],
      hidden: [
        { in: '8.8.8.8/32\n', name: 'Префикс 32' },
        { in: '0.0.0.0/0\n', name: 'Префикс 0' },
        { in: '172.16.200.1/12\n', name: 'Префикс 12' },
        { in: '192.168.100.99/26\n', name: 'Префикс 26' },
        { in: '10.1.2.3/30\n', name: 'Префикс 30' },
        { in: '255.255.255.255/1\n', name: 'Префикс 1' },
        { in: '1.2.3.4/8\n5.6.7.8/16\n', name: 'Две сети' },
        { in: '203.0.113.200/29\n', name: 'Префикс 29' },
      ],
    },
  ],
};
