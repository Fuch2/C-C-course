const PLAYER_HEAD = String.raw`
#include <stdio.h>
#include <string.h>

struct Player {
    char name[12];
    int score;
};`;

const PLAYER_MAIN = (copy) => String.raw`
int main(void) {
    int n;
    scanf("%d", &n);
    struct Player players[20];
    for (int i = 0; i < n; i++) {
        char buffer[64];
        scanf("%63s %d", buffer, &players[i].score);
        ${copy}
    }
    for (int i = 0; i < n; i++) {
        printf("%s %d\n", players[i].name, players[i].score);
    }
    return 0;
}`;

const APPEND_MAIN = String.raw`
int main(void) {
    char path[32] = "";
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        char part[64];
        scanf("%63s", part);
        if (append(path, sizeof path, part) == 0) {
            printf("ok %s\n", path);
        } else {
            printf("overflow %s\n", path);
        }
    }
    return 0;
}`;

export default {
  id: 'memory-buffer-overflow',
  title: 'Переполнение буфера',
  description:
    'Запись строк за границу массива на стеке и в куче: отчёты stack-buffer-overflow и heap-buffer-overflow, опасные функции и их замены, snprintf с обнаружением обрезки, ширина в scanf, безопасная склейка.',
  moduleId: 'memory-pointers',
  order: 20,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-double-free'],
  objectives: [
    'Объяснять, почему переполнение буфера опасно и как его находит AddressSanitizer',
    'Заменять gets, strcpy, strcat, sprintf и scanf("%s") безопасными вариантами',
    'Использовать возвращаемое значение snprintf для обнаружения обрезки',
    'Писать функции записи строк, получающие размер буфера',
  ],
  tags: ['C17', 'Память', 'Переполнение буфера', 'Строки', 'snprintf'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какая ширина нужна в scanf для массива char name[20]?',
      answers: ['19', '%19s'],
      placeholder: 'Ширина',
      explain: 'Ширина — число символов без завершающего нуля: 20 − 1 = 19.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    char buf[6];
    int n = snprintf(buf, sizeof buf, "%d-%d", 123, 4567);
    printf("%d %s\n", n, buf);
    return 0;
}`,
      answers: ['8 123-4'],
      placeholder: 'Вывод программы',
      explain:
        'Полная строка "123-4567" заняла бы 8 символов — это и возвращает snprintf. В буфер из 6 байтов поместились 5 символов и ноль.',
    },
    {
      q: 'Какие функции не получают размер приёмника и поэтому опасны для произвольных данных? Выберите все.',
      options: ['gets', 'strcpy', 'sprintf', 'fgets', 'snprintf'],
      correct: [0, 1, 2],
      explain: 'fgets и snprintf принимают размер буфера и никогда не выходят за него.',
    },
    {
      q: 'Отчёт: heap-buffer-overflow … located 0 bytes to the right of 10-byte region. Что это скорее всего означает?',
      options: [
        "Запись сразу за концом блока — типичный забытый байт под '\\0'",
        'Запись в середину блока',
        'Блок был освобождён',
        'Утечка 10 байтов',
      ],
      correct: 0,
      explain:
        'Смещение 0 вправо от конца — первый байт за границей; ровно туда пишется ноль строки, если размер посчитан как strlen.',
    },
    {
      q: 'Сколько байтов нужно для строки "data.csv" вместе с завершающим нулём?',
      answers: ['9'],
      placeholder: 'Байтов',
      explain: '8 символов и \\0.',
    },
    {
      q: 'Почему функция gets удалена из стандарта C11?',
      options: [
        'Она не знает размер буфера, и защититься от переполнения при её использовании невозможно',
        'Она слишком медленная',
        'Её заменила scanf',
        'Она не работает со стандартным вводом',
      ],
      correct: 0,
      explain: 'Любая достаточно длинная строка ввода переполнит буфер. Замена — fgets.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char a[4] = "abc";
    char b[16] = "xy";
    if (strlen(b) + strlen(a) + 1 <= sizeof b) {
        strcat(b, a);
    }
    printf("%s %zu\n", b, strlen(b));
    return 0;
}`,
      answers: ['xyabc 5'],
      placeholder: 'Вывод программы',
      explain: 'Места достаточно: 2 + 3 + 1 = 6 ≤ 16, поэтому склейка безопасна.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: копия имени',
      difficulty: 'beginner',
      bug: true,
      description: `
Программа читает \`n\` игроков (имя и счёт) и печатает их. Поле \`name\` вмещает 11 символов; более длинные имена нужно **обрезать** до 11 символов. На коротких именах всё работает, на длинных — \`stack-buffer-overflow\`.

Исправьте копирование имени.`,
      constraints: ['1 ≤ n ≤ 20.', 'Имена — до 63 символов без пробелов.'],
      hints: [
        'Сколько байтов записывает strcpy, если имя длиннее 11 символов?',
        'Ограничьте длину копии: len = strlen(buffer), но не больше sizeof name − 1; затем memcpy(name, buffer, len) и name[len] = \'\\0\'. Вариант с snprintf(name, sizeof name, "%s", buffer) тоже безопасен, но GCC предупредит о возможной обрезке.',
      ],
      starter: `${PLAYER_HEAD}\n${PLAYER_MAIN('strcpy(players[i].name, buffer);')}`,
      solution: `${PLAYER_HEAD}\n${PLAYER_MAIN(`size_t len = strlen(buffer);
        if (len >= sizeof players[i].name) {
            len = sizeof players[i].name - 1;
        }
        memcpy(players[i].name, buffer, len);
        players[i].name[len] = '\\0';`)}`,
      explanation: `
\`strcpy\` копирует строку целиком, не зная, что поле \`name\` вмещает только 12 байтов. Длинное имя затирает поле \`score\` и соседние элементы массива — AddressSanitizer сообщает о записи за пределы \`players\`, если переполнение выходит за конец массива, а внутри массива порча проявляется неверными счётами.

Исправление явно ограничивает длину копии размером поля минус один байт под \`'\\0'\` и сам ставит завершающий ноль. Так обрезка по условию становится видна в коде. \`snprintf(name, sizeof name, "%s", buffer)\` делает то же самое, но GCC с \`-Wall\` предупредит о возможной обрезке — предупреждение честное: обрезка здесь действительно происходит, только намеренно.`,
      examples: [
        { in: '2\nann 10\nbob 7\n', out: 'ann 10\nbob 7\n' },
        { in: '1\nmaximilianus 99\n', out: 'maximilianu 99\n' },
      ],
      hidden: [
        { in: '1\nabcdefghijk 1\n', name: 'Ровно 11 символов' },
        { in: '1\nabcdefghijkl 2\n', name: '12 символов' },
        { in: `1\n${'x'.repeat(63)} 3\n`, name: 'Максимальная длина' },
        {
          in: `20\n${Array.from({ length: 20 }, (_, i) => `${'p'.repeat(i * 3 + 1)} ${i}`).join('\n')}\n`,
          name: 'Двадцать игроков',
        },
        { in: '3\nverylongplayername 1\nshort 2\nanotherlongname 3\n', name: 'Чередование длин' },
        { in: '1\na 0\n', name: 'Однобуквенное' },
        { in: '2\nbartholomew_the_great 100\nzed -5\n', name: 'Отрицательный счёт' },
        { in: '1\n123456789012345 12\n', name: 'Цифры' },
      ],
    },
    {
      title: 'Найди ошибку: ширина scanf',
      bug: true,
      description: `
Программа читает слова до конца ввода и для каждого печатает его первые 7 символов (короткие слова — целиком), а в конце — количество слов. Слова бывают до 100 символов. На длинных словах программа выходит за границу массива.

Исправьте чтение слов.`,
      constraints: ['Слов — до 100.', 'Каждое слово — до 100 символов.'],
      hints: [
        'scanf("%s", word) пишет всё слово целиком, сколько бы места ни было в word.',
        'Читайте в достаточно большой буфер с шириной: char word[128]; scanf("%127s", word); — а печатайте префикс через printf("%.7s\\n", word).',
      ],
      starter: String.raw`
#include <stdio.h>

int main(void) {
    char word[8];
    int count = 0;
    while (scanf("%s", word) == 1) {
        word[7] = '\0';
        printf("%s\n", word);
        count++;
    }
    printf("words=%d\n", count);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int main(void) {
    char word[128];
    int count = 0;
    while (scanf("%127s", word) == 1) {
        printf("%.7s\n", word);
        count++;
    }
    printf("words=%d\n", count);
    return 0;
}`,
      explanation: `
\`scanf("%s")\` не знает размера массива и записывает слово целиком. Обрезка \`word[7] = '\\0'\` после чтения уже ничего не спасает: переполнение произошло внутри \`scanf\`.

Ширина \`%127s\` ограничивает запись размером буфера, а точность \`%.7s\` в \`printf\` печатает не больше 7 символов, не меняя строку. Можно было бы читать сразу \`%7s\`, но тогда длинное слово разбилось бы на несколько «слов» и счётчик стал бы неверным.`,
      examples: [
        { in: 'cat elephant\n', out: 'cat\nelephan\nwords=2\n' },
        { in: 'abcdefg\n', out: 'abcdefg\nwords=1\n' },
      ],
      hidden: [
        { in: 'abcdefgh\n', name: 'Восемь символов' },
        { in: `${'L'.repeat(100)}\n`, name: 'Сто символов' },
        { in: 'a b c d\n', name: 'Короткие слова' },
        { in: '\n', name: 'Нет слов' },
        {
          in: `${Array.from({ length: 100 }, (_, i) => 'w'.repeat((i % 20) + 1)).join(' ')}\n`,
          name: 'Сто слов',
        },
        { in: 'internationalization localization\n', name: 'Длинные слова' },
        { in: 'one\ntwo\nthree\n', name: 'По строкам' },
        { in: 'supercalifragilisticexpialidocious x\n', name: 'Длинное и короткое' },
      ],
    },
    {
      title: 'Безопасная склейка',
      description: `
Реализуйте функцию

\`\`\`c
int append(char *dst, size_t size, const char *src);
\`\`\`

Она дописывает \`src\` в конец строки \`dst\`, если результат вместе с \`'\\0'\` помещается в \`size\` байтов, и возвращает 0. Иначе возвращает −1 и **не меняет** \`dst\`.

Функция \`main\` дана: путь \`path[32]\` собирается из \`q\` частей, после каждой печатается \`ok …\` или \`overflow …\`.`,
      constraints: ['1 ≤ q ≤ 20.', 'Части — до 63 символов без пробелов.'],
      hints: [
        'Проверка: strlen(dst) + strlen(src) + 1 > size — места не хватает.',
        'Запись: memcpy(dst + used, src, extra + 1); — вместе с завершающим нулём.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

int append(char *dst, size_t size, const char *src) {
    return -1;
}
${APPEND_MAIN}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int append(char *dst, size_t size, const char *src) {
    size_t used = strlen(dst);
    size_t extra = strlen(src);
    if (used + extra + 1 > size) {
        return -1;
    }
    memcpy(dst + used, src, extra + 1);
    return 0;
}
${APPEND_MAIN}`,
      explanation: `
Функция получает размер буфера и проверяет место **до** записи. Если места не хватает, строка остаётся прежней — вызывающий код может сообщить об ошибке, не получив наполовину обрезанный путь.

Граничный случай: результат длиной ровно 31 символ помещается (31 + 1 = 32), а 32 символа — уже нет. Условие \`used + extra + 1 > size\` учитывает завершающий ноль, о котором чаще всего забывают.`,
      examples: [
        {
          in: '3\n/home\n/user\n/documents/reports/2026\n',
          out: 'ok /home\nok /home/user\noverflow /home/user\n',
        },
        { in: '1\nabcdefghijklmnopqrstuvwxyz01234\n', out: 'ok abcdefghijklmnopqrstuvwxyz01234\n' },
      ],
      hidden: [
        { in: '1\nabcdefghijklmnopqrstuvwxyz012345\n', name: '32 символа' },
        { in: '2\nabcdefghijklmnop\nqrstuvwxyz012345\n', name: 'Ровно 32 вместе' },
        { in: '2\nabcdefghijklmnop\nqrstuvwxyz01234\n', name: 'Ровно 31 вместе' },
        { in: '3\na\nb\nc\n', name: 'По одному символу' },
        { in: `1\n${'x'.repeat(63)}\n`, name: 'Слишком длинная часть' },
        { in: '4\n/very/long/directory\n/x\n/y\n/zzzzzzzzzz\n', name: 'Отказ после нескольких' },
        { in: '3\nfirst_part_is_long_enough\n_more\n_x\n', name: 'Отказ и продолжение' },
        {
          in: `20\n${Array.from({ length: 20 }, () => 'ab').join('\n')}\n`,
          name: 'Двадцать частей',
        },
      ],
    },
    {
      title: 'Метки с обрезкой',
      difficulty: 'advanced',
      description: `
Сформируйте метки для \`n\` товаров по шаблону \`имя#номер\` в буфере, вмещающем \`w\` символов (то есть размером \`w + 1\` байт). Если метка не помещается, печатается обрезанная версия со звёздочкой в конце строки вывода.

Ввод: \`w\` и \`n\`, затем \`n\` строк «имя номер». Для каждой — строка вывода: метка, а если она обрезана — ещё пробел и \`*\` и в скобках полная длина, например \`humidity#1 * (11)\`.`,
      constraints: ['1 ≤ w ≤ 30.', '1 ≤ n ≤ 20.', 'Имена — до 40 символов, 0 ≤ номер ≤ 10⁹.'],
      hints: [
        'char label[31]; int needed = snprintf(label, (size_t)w + 1, "%s#%d", name, id); — размер передаётся как w + 1.',
        'Обрезано, если needed > w.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int w, n;
    scanf("%d %d", &w, &n);
    for (int i = 0; i < n; i++) {
        char name[41];
        int id;
        scanf("%40s %d", name, &id);
        char label[31];
        int needed = snprintf(label, (size_t)w + 1, "%s#%d", name, id);
        if (needed > w) {
            printf("%s * (%d)\n", label, needed);
        } else {
            printf("%s\n", label);
        }
    }
    return 0;
}`,
      explanation: `
\`snprintf\` пишет не больше \`w + 1\` байтов и всегда ставит завершающий ноль, поэтому даже очень длинное имя не выйдет за массив \`label\`. Возвращаемое значение — длина, которую имела бы полная строка, — позволяет отличить обрезанную метку от уместившейся.

Буфер объявлен с запасом (31 байт), а реальный лимит передаётся параметром. Так обычно и бывает: размер «окна» для записи задаётся логикой программы, а не размером массива.`,
      examples: [
        { in: '10 2\ntemp 3\nhumidity 12\n', out: 'temp#3\nhumidity#1 * (11)\n' },
        { in: '1 1\na 5\n', out: 'a * (3)\n' },
      ],
      hidden: [
        { in: '30 1\nabcdefghijklmnopqrstuvwxyz 1234\n', name: 'Ровно 30' },
        { in: '30 1\nabcdefghijklmnopqrstuvwxyz 12345\n', name: '31 символ' },
        { in: '5 3\nab 1\nabc 1\nabcd 1\n', name: 'Граница ширины' },
        { in: `20 1\n${'n'.repeat(40)} 1000000000\n`, name: 'Очень длинное имя' },
        { in: '12 2\nsensor 0\nsensor 1000000000\n', name: 'Ноль и миллиард' },
        { in: '3 2\nx 9\nx 10\n', name: 'Маленькая ширина' },
        { in: '15 4\nalpha 1\nbeta 22\ngamma 333\ndelta_epsilon 4444\n', name: 'Смешанные' },
        { in: '2 1\nab 1\n', name: 'Обрезка до двух' },
      ],
    },
  ],
};
