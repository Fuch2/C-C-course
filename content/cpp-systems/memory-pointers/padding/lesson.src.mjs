const LAYOUT_TYPES = String.raw`
#include <stdio.h>
#include <string.h>

struct Type {
    const char *name;
    size_t size;
    size_t align;
};

static const struct Type TYPES[] = {
    {"char", 1, 1}, {"short", 2, 2}, {"int", 4, 4}, {"float", 4, 4},
    {"long", 8, 8}, {"double", 8, 8}, {"ptr", 8, 8},
};

const struct Type *find_type(const char *name) {
    for (size_t i = 0; i < sizeof TYPES / sizeof TYPES[0]; i++) {
        if (strcmp(TYPES[i].name, name) == 0) {
            return &TYPES[i];
        }
    }
    return NULL;
}

size_t align_up(size_t x, size_t a) {
    return (x + a - 1) / a * a;
}`;

const DUMP_HEAD = String.raw`
#include <stdio.h>
#include <string.h>

struct Reading {
    char sensor;
    int value;
    short flags;
};

void dump(const void *data, size_t size) {
    const unsigned char *bytes = data;
    for (size_t i = 0; i < size; i++) {
        printf(i + 1 < size ? "%02x " : "%02x\n", bytes[i]);
    }
}

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        char sensor;
        int value, flags;
        scanf(" %c %d %d", &sensor, &value, &flags);
        struct Reading r;`;

const DUMP_TAIL = String.raw`
        r.sensor = sensor;
        r.value = value;
        r.flags = (short)flags;
        dump(&r, sizeof r);
    }
    return 0;
}`;

const SAME_MAIN = String.raw`
int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        struct Point a, b;
        scanf(" %c %lf %hd", &a.tag, &a.x, &a.id);
        scanf(" %c %lf %hd", &b.tag, &b.x, &b.id);
        printf("%s\n", same_point(&a, &b) ? "equal" : "different");
    }
    return 0;
}`;

export default {
  id: 'memory-padding',
  title: 'Заполнители в структурах',
  description:
    'Как компилятор раскладывает поля структуры: заполнители между полями и хвостовой padding, offsetof, выбор порядка полей, мусор в заполнителях, memcmp и запись структур в файл, упакованные структуры.',
  moduleId: 'memory-pointers',
  order: 24,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-alignment'],
  objectives: [
    'Вычислять смещения полей и размер структуры по правилам выравнивания',
    'Уменьшать размер структуры перестановкой полей',
    'Объяснять, почему заполнители содержат мусор и чем это опасно',
    'Сравнивать структуры по полям и обнулять их перед выводом байтами',
  ],
  tags: ['C23', 'Память', 'Padding', 'Структуры', 'offsetof'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чему равен sizeof(struct { char a; int b; char c; }) на x86-64?',
      answers: ['12'],
      placeholder: 'Байтов',
      explain: 'a — 0, заполнитель 1–3, b — 4–7, c — 8, хвост до кратного 4 — 9–11. Итого 12.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stddef.h>
#include <stdio.h>

struct Row {
    short id;
    double score;
    char grade;
};

int main(void) {
    printf("%zu %zu %zu\n", offsetof(struct Row, score), offsetof(struct Row, grade), sizeof(struct Row));
    return 0;
}`,
      answers: ['8 16 24'],
      placeholder: 'Вывод программы',
      explain:
        'score выравнивается до 8, grade — сразу за ним на 16, размер округляется до кратного 8 — 24.',
    },
    {
      q: 'Зачем нужен хвостовой заполнитель в конце структуры?',
      options: [
        'Чтобы в массиве структур каждый элемент и его поля оставались выровненными',
        'Чтобы хранить длину структуры',
        'Чтобы защититься от переполнения буфера',
        'Он не нужен, его добавляют по историческим причинам',
      ],
      correct: 0,
      explain:
        'Элемент arr[1] начинается через sizeof(struct) байтов от arr[0]; размер, кратный выравниванию, сохраняет выравнивание полей.',
    },
    {
      q: 'Какой порядок полей char, double, int, short даёт минимальный размер структуры?',
      options: [
        'double, int, short, char',
        'char, short, int, double',
        'char, double, short, int',
        'Порядок не влияет на размер',
      ],
      correct: 0,
      explain:
        'По убыванию выравнивания: 8 + 4 + 2 + 1 = 15, хвост до 16. В порядке char, double, short, int получилось бы 24.',
    },
    {
      q: 'Почему memcmp(&a, &b, sizeof a) — ненадёжный способ сравнить две структуры? Выберите все.',
      options: [
        'Заполнители могут содержать разный мусор',
        'Для double одинаковые значения 0.0 и -0.0 имеют разные байты',
        'memcmp не умеет сравнивать больше 8 байтов',
        'Поля-указатели на одинаковые строки имеют разные адреса',
      ],
      correct: [0, 1, 3],
      explain:
        'memcmp сравнивает представление, а не значение. Для указателей на строки важно содержимое строк, а не совпадение адресов.',
    },
    {
      q: 'Какой инструмент обнаружит печать байтов неинициализированного заполнителя?',
      options: ['Valgrind (Memcheck)', 'AddressSanitizer', 'Компилятор при -O0', 'Никакой'],
      correct: 0,
      explain:
        'Memcheck отслеживает инициализированность каждого байта. ASan следит только за границами и временем жизни.',
    },
    {
      q: 'Сколько байтов сэкономит перестановка полей для массива из 1000 структур struct { char c; double d; char e; }?',
      answers: ['8000'],
      placeholder: 'Байтов',
      explain:
        'В исходном порядке размер 24 (c, 7 заполнителей, d, e, 7 хвоста), после перестановки d, c, e — 16. Экономия 8 · 1000.',
    },
  ],
  exercises: [
    {
      title: 'Раскладка структуры',
      difficulty: 'beginner',
      description: `
Структура описана списком полей. Каждое поле — тип и количество элементов (массив из одного элемента — просто поле). Типы и их размеры/выравнивания на 64-битном Linux:

| Тип | char | short | int | float | long | double | ptr |
| --- | ---- | ----- | --- | ----- | ---- | ------ | --- |
| Размер и выравнивание | 1 | 2 | 4 | 4 | 8 | 8 | 8 |

Массив \`T[k]\` занимает \`k · size\` байтов и имеет выравнивание \`T\`. Напечатайте смещение каждого поля (через пробел), а на второй строке — размер структуры.`,
      constraints: ['1 ≤ n ≤ 20.', '1 ≤ k ≤ 100.'],
      hints: [
        'Позиция pos начинается с 0. Для каждого поля: pos = align_up(pos, align); печать pos; pos += k * size; максимум выравнивания запоминается.',
        'Размер структуры: align_up(pos, max_align) — хвостовой заполнитель.',
      ],
      starter: String.raw`${LAYOUT_TYPES}

int main(void) {
    // Прочитайте поля и вычислите раскладку.
    return 0;
}`,
      solution: String.raw`${LAYOUT_TYPES}

int main(void) {
    int n;
    scanf("%d", &n);
    size_t pos = 0, max_align = 1;
    for (int i = 0; i < n; i++) {
        char name[8];
        size_t count;
        scanf("%7s %zu", name, &count);
        const struct Type *t = find_type(name);
        if (t == NULL) {
            return 1;
        }
        pos = align_up(pos, t->align);
        printf(i + 1 < n ? "%zu " : "%zu\n", pos);
        pos += count * t->size;
        if (t->align > max_align) {
            max_align = t->align;
        }
    }
    printf("%zu\n", align_up(pos, max_align));
    return 0;
}`,
      explanation: `
Программа воспроизводит работу компилятора: перед каждым полем позиция округляется до его выравнивания (заполнитель между полями), а в конце размер округляется до самого строгого выравнивания (хвост). Массив внутри структуры не меняет правил: его выравнивание — выравнивание элемента, а размер — сумма элементов.

Проверить себя можно на настоящей структуре: \`offsetof\` и \`sizeof\` дадут те же числа.`,
      examples: [
        { in: '3\nchar 1\ndouble 1\nshort 1\n', out: '0 8 16\n24\n' },
        { in: '2\nchar 3\nint 1\n', out: '0 4\n8\n' },
      ],
      hidden: [
        { in: '1\nchar 1\n', name: 'Один char' },
        { in: '1\ndouble 3\n', name: 'Массив double' },
        { in: '3\nint 1\nchar 1\nint 1\n', name: 'int char int' },
        { in: '4\ndouble 1\nint 1\nshort 1\nchar 1\n', name: 'Убывающий порядок' },
        { in: '4\nchar 1\nshort 1\nint 1\ndouble 1\n', name: 'Возрастающий порядок' },
        { in: '3\nchar 17\nptr 1\nchar 1\n', name: 'Строка и указатель' },
        { in: '2\nshort 3\nchar 1\n', name: 'Только короткие' },
        { in: '5\nfloat 1\nlong 1\nchar 2\nshort 1\nint 2\n', name: 'Пять полей' },
      ],
    },
    {
      title: 'Лучший порядок полей',
      description: `
Для того же описания полей, что в предыдущей задаче, напечатайте два числа: размер структуры в исходном порядке и наименьший размер, которого можно добиться **перестановкой** полей (поля-массивы переставляются целиком).`,
      constraints: ['1 ≤ n ≤ 20.', '1 ≤ k ≤ 100.'],
      hints: [
        'Наименьший размер получается, если упорядочить поля по убыванию выравнивания: тогда между полями нет заполнителей.',
        'Напишите функцию layout_size(поля, n), считающую размер для заданного порядка, и вызовите её для исходного и отсортированного массива.',
        'Сортировку по выравниванию удобно сделать qsort с функцией сравнения по полю align.',
      ],
      starter: String.raw`${LAYOUT_TYPES}

int main(void) {
    // Посчитайте исходный и наименьший размеры.
    return 0;
}`,
      solution: String.raw`${LAYOUT_TYPES}

#include <stdlib.h>

struct Field {
    size_t size;
    size_t align;
};

size_t layout_size(const struct Field *fields, int n) {
    size_t pos = 0, max_align = 1;
    for (int i = 0; i < n; i++) {
        pos = align_up(pos, fields[i].align) + fields[i].size;
        if (fields[i].align > max_align) {
            max_align = fields[i].align;
        }
    }
    return align_up(pos, max_align);
}

int by_align_desc(const void *pa, const void *pb) {
    const struct Field *a = pa, *b = pb;
    return (b->align > a->align) - (b->align < a->align);
}

int main(void) {
    int n;
    scanf("%d", &n);
    struct Field fields[20];
    for (int i = 0; i < n; i++) {
        char name[8];
        size_t count;
        scanf("%7s %zu", name, &count);
        const struct Type *t = find_type(name);
        if (t == NULL) {
            return 1;
        }
        fields[i].size = count * t->size;
        fields[i].align = t->align;
    }
    size_t original = layout_size(fields, n);
    qsort(fields, (size_t)n, sizeof fields[0], by_align_desc);
    printf("%zu %zu\n", original, layout_size(fields, n));
    return 0;
}`,
      explanation: `
Если поля идут по убыванию выравнивания, каждое следующее поле начинается с позиции, уже кратной его выравниванию: размер каждого предыдущего поля кратен выравниванию его типа, а оно не меньше текущего. Заполнители между полями исчезают, остаётся только хвост — его не убрать никакой перестановкой.

Функция \`layout_size\` используется дважды: для исходного порядка и для отсортированного. Это и есть способ, которым программисты проверяют «плотность» своих структур.`,
      examples: [
        { in: '3\nchar 1\ndouble 1\nshort 1\n', out: '24 16\n' },
        { in: '2\ndouble 1\nchar 1\n', out: '16 16\n' },
      ],
      hidden: [
        { in: '1\nint 1\n', name: 'Одно поле' },
        { in: '4\nchar 1\ndouble 1\nchar 1\ndouble 1\n', name: 'Чередование' },
        { in: '3\nchar 1\nint 1\nchar 1\n', name: 'char int char' },
        { in: '5\nchar 1\nshort 1\nchar 1\nint 1\nchar 1\n', name: 'Мелкие поля' },
        { in: '3\nchar 5\nlong 1\nchar 3\n', name: 'Массивы char' },
        { in: '4\nshort 1\nptr 1\nshort 1\nptr 1\n', name: 'Указатели' },
        { in: '6\nchar 1\ndouble 1\nchar 1\nint 1\nchar 1\nshort 1\n', name: 'Шесть полей' },
        { in: '2\nfloat 3\ndouble 1\n', name: 'Массив float' },
      ],
    },
    {
      title: 'Найди ошибку: мусор в заполнителях',
      bug: true,
      diagnostics: 'valgrind',
      description: `
Программа заполняет структуры \`struct Reading\` (\`char sensor\`, \`int value\`, \`short flags\`) и печатает их байтовое представление — так данные готовятся к записи в файл. Заполнители в выводе должны быть нулями.

Эта задача проверяется **Valgrind**: он сообщает о печати неинициализированных байтов. Исправьте программу.`,
      constraints: ['1 ≤ n ≤ 10.', '|value| ≤ 10⁹, 0 ≤ flags ≤ 32767.'],
      hints: [
        'Какие байты структуры не задаются присваиваниями полям?',
        'Обнулите структуру целиком перед заполнением: memset(&r, 0, sizeof r);',
      ],
      starter: `${DUMP_HEAD}${DUMP_TAIL}`,
      solution: `${DUMP_HEAD}
        memset(&r, 0, sizeof r);${DUMP_TAIL}`,
      explanation: `
Раскладка \`struct Reading\`: \`sensor\` — байт 0, заполнитель 1–3, \`value\` — 4–7, \`flags\` — 8–9, хвост 10–11. Присваивания полям не трогают шесть байтов заполнителей, и в них остаётся содержимое стека. Valgrind видит, что \`printf\` получает неинициализированные значения, и тест не проходит; без инструментов в «файл» утекли бы случайные данные программы.

\`memset\` перед заполнением делает все 12 байтов определёнными, и представление становится воспроизводимым.`,
      examples: [
        { in: '1\nT 21 1\n', out: '54 00 00 00 15 00 00 00 01 00 00 00\n' },
        { in: '1\nA -1 0\n', out: '41 00 00 00 ff ff ff ff 00 00 00 00\n' },
      ],
      hidden: [
        { in: '2\nx 0 0\ny 1 1\n', name: 'Две записи' },
        { in: '1\nZ 1000000000 32767\n', name: 'Большие значения' },
        { in: '1\na -1000000000 255\n', name: 'Отрицательное значение' },
        { in: '3\n1 1 1\n2 2 2\n3 3 3\n', name: 'Цифры как метки' },
        { in: '1\n# 256 256\n', name: 'Перенос в старший байт' },
        { in: '1\nq 65536 16\n', name: 'Третий байт' },
        { in: '2\nm 7 7\nm 7 7\n', name: 'Одинаковые записи' },
        { in: '1\n~ 305419896 4660\n', name: 'Шестнадцатеричные узоры' },
      ],
    },
    {
      title: 'Сравнение записей',
      difficulty: 'advanced',
      description: `
Реализуйте функцию сравнения

\`\`\`c
struct Point {
    char tag;
    double x;
    short id;
};

int same_point(const struct Point *a, const struct Point *b);
\`\`\`

Записи равны, если у них совпадают \`tag\` и \`id\`, а значения \`x\` равны **как числа** (\`0\` и \`-0\` равны). Не используйте \`memcmp\`. Функция \`main\` дана: для каждой пары печатает \`equal\` или \`different\`.`,
      constraints: ['1 ≤ q ≤ 20.', '|x| ≤ 10⁹ (не NaN).', '|id| ≤ 32767.'],
      hints: [
        'Сравнивайте поле за полем: a->tag == b->tag && a->x == b->x && a->id == b->id.',
        'Почему не memcmp: у структуры 13 заполняющих байтов с мусором, а 0.0 и -0.0 различаются битом знака.',
      ],
      starter: String.raw`
#include <stdio.h>

struct Point {
    char tag;
    double x;
    short id;
};

int same_point(const struct Point *a, const struct Point *b) {
    return 0;
}
${SAME_MAIN}`,
      solution: String.raw`
#include <stdio.h>

struct Point {
    char tag;
    double x;
    short id;
};

int same_point(const struct Point *a, const struct Point *b) {
    return a->tag == b->tag && a->x == b->x && a->id == b->id;
}
${SAME_MAIN}`,
      explanation: `
Сравнение по полям использует семантику каждого типа: символы и целые сравниваются как числа, \`double\` — по правилам IEEE 754, где \`0.0 == -0.0\`. Заполнители (7 байтов после \`tag\` и 6 в хвосте) в сравнении не участвуют вовсе.

\`memcmp\` дал бы ответ, зависящий от мусора в заполнителях, и ошибался бы на нулях разного знака. Для структур с указателями на строки побайтовое сравнение тоже неверно: равные строки могут лежать по разным адресам.`,
      examples: [
        { in: '2\nA 1.5 3\nA 1.5 3\nA 0 1\nA -0 1\n', out: 'equal\nequal\n' },
        { in: '1\nA 1 1\nB 1 1\n', out: 'different\n' },
      ],
      hidden: [
        { in: '1\nx 2.5 7\nx 2.5 8\n', name: 'Разные id' },
        { in: '1\nx 2.5 7\nx 2.50000001 7\n', name: 'Почти равные x' },
        { in: '1\nq -1000000000 -32768\nq -1000000000 -32768\n', name: 'Крайние значения' },
        { in: '1\nz 0 0\nz -0 0\n', name: 'Нули разного знака' },
        { in: '3\na 1 1\na 1 1\nb 2 2\nb 2 3\nc 3 3\nd 3 3\n', name: 'Три пары' },
        { in: '1\nm 0.1 5\nm 0.1 5\n', name: 'Дробное' },
        { in: '1\nk 1e9 32767\nk 1000000000 32767\n', name: 'Разная запись числа' },
        { in: '1\nr 3 -1\nr 3 1\n', name: 'Знак id' },
      ],
    },
  ],
};
