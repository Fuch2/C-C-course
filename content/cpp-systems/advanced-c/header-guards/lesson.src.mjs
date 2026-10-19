const COLOR_PROGRAM = (guard) => String.raw`
#include <stdio.h>

// ---- color.h ----
${guard ? '#ifndef COLOR_H\n#define COLOR_H\n' : ''}struct Color {
    unsigned r, g, b;
};

static inline unsigned color_sum(struct Color c) {
    return c.r + c.g + c.b;
}
${guard ? '#endif\n' : ''}
// ---- palette.h подключает color.h: текст вставлен ещё раз ----
${guard ? '#ifndef COLOR_H\n#define COLOR_H\n' : ''}struct Color {
    unsigned r, g, b;
};

static inline unsigned color_sum(struct Color c) {
    return c.r + c.g + c.b;
}
${guard ? '#endif\n' : ''}
// ---- palette.h ----
${guard ? '#ifndef PALETTE_H\n#define PALETTE_H\n' : ''}struct Color palette_average(const struct Color *colors, int n);
unsigned long palette_brightness(struct Color c);
${guard ? '#endif\n' : ''}
// ---- main.c ----
int main(void) {
    struct Color colors[20];
    int n = 0;
    while (n < 20 && scanf(" #%2x%2x%2x", &colors[n].r, &colors[n].g, &colors[n].b) == 3) {
        n++;
    }
    if (n == 0 || color_sum(colors[0]) > 3 * 255) {
        return 0;
    }
    struct Color avg = palette_average(colors, n);
    int best = 0;
    for (int i = 1; i < n; i++) {
        if (palette_brightness(colors[i]) > palette_brightness(colors[best])) {
            best = i;
        }
    }
    printf("среднее #%02X%02X%02X\n", avg.r, avg.g, avg.b);
    printf("ярче всех #%02X%02X%02X\n", colors[best].r, colors[best].g, colors[best].b);
    return 0;
}

// ---- palette.c ----
struct Color palette_average(const struct Color *colors, int n) {
    struct Color sum = {0, 0, 0};
    for (int i = 0; i < n; i++) {
        sum.r += colors[i].r;
        sum.g += colors[i].g;
        sum.b += colors[i].b;
    }
    struct Color avg = {sum.r / n, sum.g / n, sum.b / n};
    return avg;
}

unsigned long palette_brightness(struct Color c) {
    return 299UL * c.r + 587UL * c.g + 114UL * c.b;
}`;

export default {
  id: 'advanced-header-guards',
  title: 'Защита от повторного включения',
  description:
    'Почему заголовок попадает в файл дважды; какие объявления можно повторять; защита #ifndef/#define/#endif и выбор имени макроса; зарезервированные идентификаторы; #pragma once; границы защиты; циклические включения и предварительное объявление структуры.',
  moduleId: 'advanced-c',
  order: 3,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['advanced-headers'],
  objectives: [
    'Объяснять, как заголовок попадает в единицу трансляции дважды и почему это ломает сборку',
    'Писать защиту от повторного включения с уникальным именем макроса',
    'Отличать то, что защита решает, от ошибок линковки, которые она не решает',
    'Разрывать циклические включения предварительным объявлением структуры',
  ],
  tags: ['Include guard', '#ifndef', '#pragma once', 'Предварительное объявление', 'Заголовок'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'main.c подключает point.h и shapes.h, а shapes.h сам подключает point.h. В point.h определены struct Point и static inline функция manhattan, защиты нет. Что произойдёт?',
      options: [
        'Ошибка компиляции main.c: redefinition of manhattan',
        'Ошибка линковки multiple definition',
        'Всё соберётся: препроцессор сам пропустит второе включение',
        'Предупреждение, программа соберётся',
      ],
      correct: 0,
      explain:
        'Текст point.h попадает в единицу трансляции main.c дважды, и компилятор видит два определения одной функции. Повтор одинаковой структуры C23 разрешил, но функции и переменные повторять нельзя.',
    },
    {
      q: 'Что можно повторить в одной единице трансляции без ошибки? Выберите все.',
      options: [
        'Прототип int area(int w, int h);',
        'Одинаковый typedef unsigned int uint;',
        'Определение переменной int counter = 0;',
        'Одинаковое определение #define LIMIT 100',
        'Определение функции int twice(int x) { return 2 * x; }',
      ],
      correct: [0, 1, 3],
      explain:
        'Объявления повторять можно, в том числе одинаковые typedef (с C11) и одинаковые макросы. Определения переменных и функций в одной единице трансляции — только по одному разу.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

#ifndef LIMIT_H
#define LIMIT_H
int limit = 10;
#endif

#ifndef LIMIT_H
#define LIMIT_H
int limit = 20;
#endif

int main(void) {
    printf("%d\n", limit);
    return 0;
}`,
      answers: ['10'],
      placeholder: 'Вывод программы',
      explain:
        'Первый блок определяет LIMIT_H и переменную со значением 10. Второй блок целиком выброшен препроцессором, потому что LIMIT_H уже определён.',
    },
    {
      q: 'Какое имя защитного макроса допустимо и удачно для файла include/geo/point.h проекта geo?',
      options: ['GEO_POINT_H', '_POINT_H', '__POINT_H__', 'H'],
      correct: 0,
      explain:
        'Имена, начинающиеся с подчёркивания и заглавной буквы или с двух подчёркиваний, зарезервированы для реализации. Слишком короткое имя легко совпадёт с чужим макросом.',
    },
    {
      q: 'В проекте два разных файла net/util.h и storage/util.h, и оба защищены макросом UTIL_H. Файл подключает оба. Что произойдёт?',
      options: [
        'Второй заголовок будет молча пропущен целиком, и его объявления окажутся неизвестны',
        'Препроцессор сообщит о конфликте имён',
        'Оба заголовка подключатся, защита сработает для каждого отдельно',
        'Ошибка линковки multiple definition',
      ],
      correct: 0,
      explain:
        'Препроцессор знает только имя макроса. Раз UTIL_H уже определён первым файлом, текст второго выбрасывается, а ошибка проявится позже как unknown type name или implicit declaration.',
    },
    {
      q: 'В заголовке log.h с защитой #ifndef LOG_H определена функция void log_line(const char *s) { ... }. Его подключают main.c и net.c. Что будет при сборке?',
      options: [
        'multiple definition of log_line при линковке',
        'Всё соберётся: защита не даст определить функцию дважды',
        'Ошибка компиляции net.c',
        'undefined reference to log_line',
      ],
      correct: 0,
      explain:
        'Защита действует внутри одной единицы трансляции. main.c и net.c обрабатываются отдельно, и каждый получает своё определение функции.',
    },
    {
      q: 'Заголовку list.h нужна только строка struct Node *head; внутри своей структуры. Что лучше написать в list.h вместо #include "node.h"?',
      answers: ['struct Node;'],
      placeholder: 'Объявление',
      explain:
        'Предварительное объявление сообщает, что структура существует. Для указателя этого достаточно, а лишнего включения и возможного цикла не возникает.',
    },
    {
      q: 'Что делает директива #pragma once?',
      options: [
        'Просит препроцессор подключать файл не больше одного раза за единицу трансляции; не входит в стандарт C',
        'Запрещает включать заголовок в несколько .c файлов',
        'Делает функции заголовка видимыми только один раз',
        'Это стандартная замена директивы #include',
      ],
      correct: 0,
      explain:
        '#pragma once поддерживают GCC, Clang и MSVC. Она заменяет тройку #ifndef/#define/#endif, но формально это расширение компиляторов.',
    },
  ],
  exercises: [
    {
      title: 'Имя защитного макроса',
      difficulty: 'beginner',
      description: `
Постройте имена защитных макросов по правилам проекта. В первой строке — название проекта, в остальных строках до конца ввода — пути к заголовкам относительно корня проекта.

Для каждого пути:
1. если путь начинается с \`include/\` или \`src/\`, отбросьте эту часть (только одну и только в начале);
2. если путь после этого не начинается с \`название_проекта/\`, допишите название проекта и \`/\` в начало;
3. замените латинские буквы заглавными, цифры оставьте, а все остальные символы (\`/\`, \`.\`, \`-\` и любые другие) — на \`_\`.

Напечатайте получившиеся имена по одному в строке.`,
      constraints: [
        'Название проекта и пути состоят из латинских букв, цифр и символов . - _ /; длина не больше 100.',
        'Путей не больше 20.',
      ],
      hints: [
        'Читайте название через scanf("%99s"), а пути — тоже по одному слову: в путях нет пробелов.',
        'Отбрасывание префикса удобно сделать сдвигом указателя: if (strncmp(path, "src/", 4) == 0) path += 4;',
        "Проверка шага 2: strncmp(path, project, len) == 0 && path[len] == '/'. Без проверки символа после названия путь geometry/x.h ошибочно совпадёт с проектом geo.",
      ],
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

void print_macro_part(const char *text) {
    for (const char *p = text; *p != '\0'; p++) {
        unsigned char c = (unsigned char)*p;
        putchar(isalnum(c) ? toupper(c) : '_');
    }
}

int main(void) {
    char project[128];
    char buffer[128];
    if (scanf("%99s", project) != 1) {
        return 0;
    }
    size_t len = strlen(project);
    while (scanf("%99s", buffer) == 1) {
        const char *path = buffer;
        if (strncmp(path, "include/", 8) == 0) {
            path += 8;
        } else if (strncmp(path, "src/", 4) == 0) {
            path += 4;
        }
        if (!(strncmp(path, project, len) == 0 && path[len] == '/')) {
            print_macro_part(project);
            putchar('_');
        }
        print_macro_part(path);
        putchar('\n');
    }
    return 0;
}`,
      explanation: `
Имя строится в два шага: сначала путь приводится к виду \`проект/подкаталог/файл.h\`, затем каждый символ превращается в допустимый символ идентификатора. Вместо того чтобы собирать новую строку, программа печатает название проекта с подчёркиванием, а затем преобразованный путь — результат тот же.

Проверка \`path[len] == '/'\` важна: префикс \`geo\` совпадает и с началом \`geometry/\`, но это другой каталог. Отбрасывается только один префикс \`include/\` или \`src/\` — путь \`src/include/a.h\` превращается в \`include/a.h\`, а не в \`a.h\`.

Получившиеся имена не начинаются с подчёркивания и не содержат двойного подчёркивания в начале, поэтому не попадают в зарезервированные идентификаторы.`,
      examples: [
        {
          in: 'geo\ninclude/geo/point.h\nsrc/util/str-buf.h\nconfig.h\n',
          out: 'GEO_POINT_H\nGEO_UTIL_STR_BUF_H\nGEO_CONFIG_H\n',
        },
        { in: 'my-lib\ninclude/my-lib/a.h\n', out: 'MY_LIB_A_H\n' },
      ],
      hidden: [
        { in: 'geo\ninclude/geometry/x.h\n', name: 'Похожий каталог' },
        { in: 'geo\nsrc/geo/io.h\n', name: 'Проект после src' },
        { in: 'geo\ninclude/geo/v2/vec3.h\n', name: 'Цифры' },
        { in: 'app\ntests/test-main.h\n', name: 'Другой каталог' },
        { in: 'app\nsrc/include/a.h\n', name: 'Только один префикс' },
        { in: 'app\nsource/a.h\nsrcfile.h\n', name: 'Не префиксы' },
        { in: 'Net2\nnet2/Socket.H\ninclude/Net2/x.h\n', name: 'Регистр' },
        { in: 'kv\napp\nkv.h\nkv/kv.h\nsrc/kv/store/disk.v1.h\n', name: 'Несколько путей' },
      ],
    },
    {
      title: 'Найди ошибку: двойное включение',
      bug: true,
      description: `
Программа читает до 20 цветов в формате \`#RRGGBB\` (шестнадцатеричные компоненты) и печатает их среднее (каждая компонента — целая часть среднего) и самый яркий цвет — с наибольшей величиной \`299·R + 587·G + 114·B\`, первый из равных.

Файл собран из нескольких «файлов» проекта: заголовок \`color.h\` попал в него дважды — напрямую и через \`palette.h\`. Сборка падает с ошибкой \`redefinition\` — повторно определена функция \`color_sum\` (а для Clang и компиляторов до C23 — ещё и \`struct Color\`). Исправьте программу так, как исправляют настоящий проект: **защитите заголовки**, не удаляя повторное включение.`,
      constraints: [
        'От 1 до 20 цветов, буквы в шестнадцатеричной записи могут быть любого регистра.',
      ],
      hints: [
        'Оба блока с текстом color.h — это один и тот же файл, поэтому защита должна быть одинаковой в обоих.',
        'Оберните каждый блок color.h в #ifndef COLOR_H / #define COLOR_H / #endif. Заголовок palette.h тоже стоит защитить своим макросом.',
      ],
      starter: COLOR_PROGRAM(false),
      solution: COLOR_PROGRAM(true),
      explanation: `
Второй блок с \`struct Color\` и \`color_sum\` — точная копия первого, потому что это один и тот же заголовок, вставленный препроцессором ещё раз через \`palette.h\`. Удалить копию в настоящем проекте нельзя: \`palette.h\` нужен \`struct Color\`, и он обязан подключать \`color.h\` сам, чтобы быть самодостаточным.

Защита решает проблему без изменения порядка включений: при первом проходе определяется \`COLOR_H\`, и второй блок препроцессор выбрасывает целиком. Защищать стоит все заголовки, даже те, которые пока подключаются один раз.`,
      examples: [
        {
          in: '#FF0000 #00FF00 #0000FF\n',
          out: 'среднее #555555\nярче всех #00FF00\n',
        },
        { in: '#ffffff\n', out: 'среднее #FFFFFF\nярче всех #FFFFFF\n' },
      ],
      hidden: [
        '#000000 #FFFFFF\n',
        '#102030 #405060\n',
        '#808080 #808080\n',
        '#FF0000\n#0000FF\n',
        '#123456 #abcdef #7f7f7f #010203\n',
        '#ff00ff #00ffff #ffff00\n',
        '#0a0b0c #0c0b0a\n',
        '#FFFFFF #FFFFFE #FEFFFF #FFFEFF\n',
      ],
    },
    {
      title: 'Проверка включений',
      difficulty: 'advanced',
      description: `
Смоделируйте, как препроцессор обрабатывает включения, и найдите ошибки, которые увидит компилятор.

В первой строке — число файлов \`n\`. Далее \`n\` описаний: строка \`имя защита k\` и \`k\` строк содержимого. \`защита\` — \`guard\` (файл защищён от повторного включения) или \`noguard\`. Строка содержимого — одна из:
- \`include F\` — подключить файл \`F\`;
- \`define S\` — определение структуры \`S\`;
- \`use S\` — место, где нужен полный тип \`S\` (поле по значению, \`sizeof\`).

Первый файл — компилируемый \`.c\`. Обработайте его содержимое по порядку; при \`include\` обработайте подключённый файл полностью и вернитесь. Защищённый файл при первом включении запоминается **сразу**, до обработки содержимого, а при повторных пропускается.

Печатайте ошибки по мере обнаружения:
- \`повторное определение S в F (первое в G)\` — структура \`S\` уже определена (в файле \`G\`);
- \`S не определена в F\` — \`use S\` до определения \`S\`;
- \`бесконечное включение F\` — включение файла \`F\` превысило бы глубину вложенности 20 (у \`.c\` файла глубина 0, у подключённого им — 1). После этой ошибки обработка прекращается.

Если ошибок нет, напечатайте \`ошибок нет\`.`,
      constraints: [
        '1 ≤ n ≤ 20; 0 ≤ k ≤ 20; имена не длиннее 31 символа.',
        'Все подключаемые файлы описаны во вводе.',
      ],
      hints: [
        'Храните файлы в массиве структур { имя; guarded; число строк; строки (вид и имя) } и напишите рекурсивную функцию process(file, depth).',
        'Для определений заведите таблицу «структура → файл, где она определена». Флаг processed для защищённых файлов ставьте в начале process, до цикла по строкам.',
        'Остановку после бесконечного включения удобно сделать глобальным флагом fatal: process сразу возвращается, если он установлен.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX_FILES 20
#define MAX_ITEMS 20
#define NAME 32

typedef struct {
    char name[NAME];
    int guarded;
    int processed;
    int count;
    char kind[MAX_ITEMS][8];
    char arg[MAX_ITEMS][NAME];
} File;

File files[MAX_FILES];
int file_count;
char struct_names[MAX_FILES * MAX_ITEMS][NAME];
int struct_owner[MAX_FILES * MAX_ITEMS];
int struct_count;
int errors;
int fatal;

int find_file(const char *name) {
    for (int i = 0; i < file_count; i++) {
        if (strcmp(files[i].name, name) == 0) {
            return i;
        }
    }
    return -1;
}

int find_struct(const char *name) {
    for (int i = 0; i < struct_count; i++) {
        if (strcmp(struct_names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

void process(int f, int depth) {
    File *file = &files[f];
    if (file->guarded) {
        if (file->processed) {
            return;
        }
        file->processed = 1;
    }
    for (int i = 0; i < file->count && !fatal; i++) {
        const char *arg = file->arg[i];
        if (strcmp(file->kind[i], "include") == 0) {
            int target = find_file(arg);
            if (depth + 1 > 20) {
                printf("бесконечное включение %s\n", arg);
                errors++;
                fatal = 1;
            } else if (target >= 0) {
                process(target, depth + 1);
            }
        } else if (strcmp(file->kind[i], "define") == 0) {
            int s = find_struct(arg);
            if (s >= 0) {
                printf("повторное определение %s в %s (первое в %s)\n", arg, file->name,
                       files[struct_owner[s]].name);
                errors++;
            } else {
                strcpy(struct_names[struct_count], arg);
                struct_owner[struct_count++] = f;
            }
        } else if (find_struct(arg) < 0) {
            printf("%s не определена в %s\n", arg, file->name);
            errors++;
        }
    }
}

int main(void) {
    if (scanf("%d", &file_count) != 1) {
        return 0;
    }
    for (int f = 0; f < file_count; f++) {
        char guard[16];
        File *file = &files[f];
        if (scanf("%31s %15s %d", file->name, guard, &file->count) != 3) {
            return 0;
        }
        file->guarded = strcmp(guard, "guard") == 0;
        for (int i = 0; i < file->count; i++) {
            if (scanf("%7s %31s", file->kind[i], file->arg[i]) != 2) {
                return 0;
            }
        }
    }
    process(0, 0);
    if (errors == 0) {
        printf("ошибок нет\n");
    }
    return 0;
}`,
      explanation: `
Модель повторяет поведение настоящего препроцессора. Ключевая деталь — **когда** защищённый файл считается подключённым: \`#define ИМЯ\` стоит в начале заголовка, поэтому макрос определяется до того, как обрабатываются вложенные \`#include\`. Отсюда и классическая проблема циклов: если \`a.h\` подключает \`b.h\`, а \`b.h\` — \`a.h\`, то внутри \`b.h\` повторное включение \`a.h\` пропускается, и всё, что \`a.h\` определяет после строки \`include b.h\`, для \`b.h\` ещё не существует.

Без защиты тот же цикл не останавливается вовсе: файлы подключают друг друга, пока не кончится допустимая глубина. GCC прерывает сборку на глубине 200; здесь предел 20, а после этой ошибки обработка прекращается, как и в компиляторе.

Повторное определение запоминает файл первого определения — сообщения компилятора тоже указывают на место \`previous definition\`.`,
      examples: [
        {
          in: '3\nmain.c guard 2\ninclude point.h\ninclude shapes.h\npoint.h noguard 1\ndefine Point\nshapes.h guard 3\ninclude point.h\nuse Point\ndefine Circle\n',
          out: 'повторное определение Point в point.h (первое в point.h)\n',
        },
        {
          in: '3\nmain.c guard 2\ninclude point.h\ninclude shapes.h\npoint.h guard 1\ndefine Point\nshapes.h guard 3\ninclude point.h\nuse Point\ndefine Circle\n',
          out: 'ошибок нет\n',
          why: 'С защитой второе включение point.h пропущено.',
        },
      ],
      hidden: [
        {
          in: '3\nmain.c guard 1\ninclude a.h\na.h guard 2\ninclude b.h\ndefine A\nb.h guard 2\ninclude a.h\nuse A\n',
          name: 'Цикл с защитой',
        },
        {
          in: '3\nmain.c guard 1\ninclude a.h\na.h noguard 1\ninclude b.h\nb.h noguard 1\ninclude a.h\n',
          name: 'Цикл без защиты',
        },
        {
          in: '1\nmain.c guard 2\nuse Point\ndefine Point\n',
          name: 'Использование до определения',
        },
        { in: '1\nmain.c guard 0\n', name: 'Пустой файл' },
        {
          in: '2\nmain.c guard 3\ninclude t.h\ninclude t.h\ninclude t.h\nt.h noguard 1\ndefine T\n',
          name: 'Три включения без защиты',
        },
        {
          in: '4\nmain.c guard 3\ninclude list.h\ninclude node.h\nuse List\nlist.h guard 2\ninclude node.h\ndefine List\nnode.h guard 1\ndefine Node\nunused.h noguard 1\ndefine Node\n',
          name: 'Неподключённый файл',
        },
        {
          in: '2\nmain.c guard 2\ninclude self.h\nuse S\nself.h guard 2\ninclude self.h\ndefine S\n',
          name: 'Файл подключает сам себя',
        },
        {
          in: '2\nmain.c guard 2\ndefine Local\ninclude h.h\nh.h guard 2\ndefine Local\nuse Missing\n',
          name: 'Две ошибки',
        },
        {
          in: '3\nmain.c noguard 2\ninclude a.h\ninclude b.h\na.h guard 2\ndefine A\ninclude b.h\nb.h guard 2\nuse A\ndefine B\n',
          name: 'Порядок включений',
        },
      ],
    },
  ],
};
