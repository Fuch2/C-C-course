export default {
  id: 'c17-char',
  title: 'Символы: char и таблица ASCII',
  description:
    'Тип char и коды символов, таблица ASCII, арифметика на символах, функции ctype.h, посимвольный ввод через getchar и ограничения с UTF-8.',
  moduleId: 'c-fundamentals',
  order: 31,
  difficulty: 'beginner',
  estimatedMinutes: 45,
  prerequisites: ['c17-multidimensional'],
  objectives: [
    'Хранить символы в char и печатать их как символы и как коды',
    'Переводить символ цифры в число и обратно, менять регистр арифметикой',
    'Классифицировать и преобразовывать символы функциями ctype.h',
    'Обрабатывать текст посимвольно через getchar до конца ввода',
  ],
  tags: ['C23', 'char', 'ASCII', 'getchar'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    char c = 'D';
    printf("%c%c %d\n", c + 1, c + 2, 'b' - 'a');
    return 0;
}`,
      answers: ['EF 1'],
      placeholder: 'Вывод программы',
      explain: "Буквы идут подряд: 'D' + 1 = 'E', 'D' + 2 = 'F'. 'b' − 'a' = 1.",
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    char d = '8';
    printf("%d %d\n", d - '0', d - '0' + 2);
    return 0;
}`,
      answers: ['8 10'],
      placeholder: 'Вывод программы',
      explain: "d − '0' превращает символ '8' в число 8; прибавление 2 даёт 10.",
    },
    {
      q: 'Почему переменную для результата getchar объявляют как int, а не char?',
      options: [
        'getchar возвращает 257 разных значений: 256 кодов и EOF — в char они не помещаются',
        'char нельзя сравнивать с EOF синтаксически',
        'int быстрее char',
        'Это требование стиля, на работу не влияет',
      ],
      correct: 0,
      explain:
        'Если хранить результат в char, EOF может совпасть с реальным символом или не распознаться — цикл сломается.',
    },
    {
      q: 'Что выведет программа при вводе «a1b2»?',
      code: String.raw`
#include <stdio.h>
#include <ctype.h>

int main(void) {
    int c;
    while ((c = getchar()) != EOF) {
        if (isdigit(c)) {
            putchar('#');
        } else {
            putchar(toupper(c));
        }
    }
    return 0;
}`,
      stdin: 'a1b2',
      answers: ['A#B#'],
      placeholder: 'Вывод программы',
      explain: 'Цифры заменяются на #, буквы переводятся в верхний регистр.',
    },
    {
      q: "Какие выражения истинны для символа c = 'x'? Выберите все.",
      options: ["c >= 'a' && c <= 'z'", 'isalpha(c)', 'isupper(c)', "c - 'a' == 23", 'isdigit(c)'],
      correct: [0, 1, 3],
      explain: "x — строчная латинская буква, 24-я в алфавите, поэтому 'x' − 'a' = 23.",
    },
    {
      q: 'Сколько вызовов getchar понадобится, чтобы прочитать русскую букву «ж» в кодировке UTF-8?',
      answers: ['2'],
      placeholder: 'Число',
      explain:
        'В UTF-8 кириллические буквы занимают по два байта, и каждый байт читается отдельно.',
    },
    {
      q: 'Чем отличаются \'A\' и "A" в C?',
      options: [
        '\'A\' — символ (число 65), "A" — строка из символа A и завершающего нуля',
        'Ничем',
        '\'A\' — строка, "A" — символ',
        'Двойные кавычки запрещены',
      ],
      correct: 0,
      explain: 'Одинарные кавычки — один символ. Двойные — строка; о строках следующий урок.',
    },
  ],
  exercises: [
    {
      title: 'Код символа',
      description: `
Прочитайте один непробельный символ и напечатайте через пробел: его код, символ со следующим кодом и символ с предыдущим кодом.

**Пример:** \`B\` → \`66 C A\`.`,
      constraints: ['Символ — печатный ASCII-символ с кодом от 34 до 125.'],
      hints: ['Чтение: scanf(" %c", &c).', 'printf("%d %c %c\\n", c, c + 1, c - 1);'],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    char c;
    scanf(" %c", &c);
    printf("%d %c %c\n", c, c + 1, c - 1);
    return 0;
}`,
      explanation: `
Символ — это число, поэтому \`c + 1\` — следующий код. Печать через \`%c\` превращает код обратно в символ. При передаче в \`printf\` \`char\` автоматически расширяется до \`int\`, и \`%d\` печатает код.`,
      examples: [
        { in: 'B', out: '66 C A\n' },
        { in: '5', out: '53 6 4\n' },
      ],
      hidden: ['a', 'z', 'A', '0', '9', '"', '}'],
    },
    {
      title: 'Статистика текста',
      description: `
Прочитайте текст до конца ввода и напечатайте четыре числа через пробел: количество латинских букв, цифр, пробельных символов (пробелы, табуляции, переводы строк) и всех остальных символов.`,
      constraints: ['Текст содержит только ASCII-символы, не длиннее 100 000 символов.'],
      hints: [
        'Цикл while ((c = getchar()) != EOF).',
        'Функции isalpha, isdigit, isspace; всё остальное — в четвёртый счётчик.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <ctype.h>

int main(void) {
    int c;
    int letters = 0, digits = 0, spaces = 0, others = 0;
    while ((c = getchar()) != EOF) {
        if (isalpha(c)) {
            letters++;
        } else if (isdigit(c)) {
            digits++;
        } else if (isspace(c)) {
            spaces++;
        } else {
            others++;
        }
    }
    printf("%d %d %d %d\n", letters, digits, spaces, others);
    return 0;
}`,
      explanation: `
Цепочка \`else if\` гарантирует, что каждый символ попадёт ровно в один счётчик. Перевод строки в конце ввода — тоже пробельный символ, и он засчитывается.

Функции \`<ctype.h>\` принимают \`int\` — значение \`c\` из \`getchar\` подходит напрямую.`,
      examples: [
        { in: 'Hi, C23!\n', out: '3 2 2 2\n' },
        { in: '', out: '0 0 0 0\n' },
      ],
      hidden: [
        'abc',
        '123 456\n',
        '\t\t\n\n',
        'Hello, World! 2026\nC is fun.\n',
        '!!!???',
        'a\tb\tc 1 2 3 #$%',
        Array.from({ length: 2000 }, (_, i) => 'a1 .'[i % 4]).join(''),
      ],
    },
    {
      title: 'Заглавными',
      description: `
Прочитайте текст до конца ввода и напечатайте его, заменив все строчные латинские буквы заглавными. Остальные символы, включая переводы строк, остаются без изменений.`,
      constraints: ['Текст содержит только ASCII-символы, не длиннее 100 000 символов.'],
      hints: [
        'while ((c = getchar()) != EOF) putchar(toupper(c));',
        'toupper меняет только строчные латинские буквы, остальные символы возвращает без изменений — проверять их отдельно не нужно.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <ctype.h>

int main(void) {
    int c;
    while ((c = getchar()) != EOF) {
        putchar(toupper(c));
    }
    return 0;
}`,
      explanation: `
\`toupper\` меняет только строчные латинские буквы, а всё остальное возвращает без изменений, поэтому никаких дополнительных проверок не нужно. Программа выводит ровно столько символов, сколько прочитала: переводы строк сохраняются.

Такие программы-«фильтры», читающие stdin и пишущие в stdout, — основа философии Unix: их можно соединять в цепочки командами терминала.`,
      examples: [
        { in: 'Hello, world!\nc23\n', out: 'HELLO, WORLD!\nC23\n' },
        { in: 'ABC', out: 'ABC' },
      ],
      hidden: [
        '',
        'z',
        'mixed CASE text 123\n',
        '\n\n',
        'a-b_c.d',
        '{a}[z]`~',
        Array.from({ length: 3000 }, (_, i) => 'abcXYZ 09\n'[i % 10]).join(''),
      ],
    },
    {
      title: 'Сумма цифр в тексте',
      description: `
Прочитайте текст до конца ввода и напечатайте сумму всех цифр, встречающихся в нём (каждая цифра — отдельное слагаемое).

**Пример:** \`a1b22c\` → 1 + 2 + 2 = \`5\`.`,
      constraints: ['Текст содержит только ASCII-символы, не длиннее 100 000 символов.'],
      hints: [
        "Если isdigit(c), прибавьте c - '0'.",
        "Символ '7' — это код 55, а не число 7. Разность c - '0' превращает код цифры в её значение.",
      ],
      solution: String.raw`
#include <stdio.h>
#include <ctype.h>

int main(void) {
    int c;
    long long sum = 0;
    while ((c = getchar()) != EOF) {
        if (isdigit(c)) {
            sum += c - '0';
        }
    }
    printf("%lld\n", sum);
    return 0;
}`,
      explanation: `
\`c - '0'\` превращает символ цифры в её значение. Числа из нескольких цифр здесь не собираются: «22» — это две цифры 2, а не двадцать два. Как собирать многозначные числа из символов, вы увидите в практикуме по строкам.`,
      examples: [
        { in: 'a1b22c', out: '5\n' },
        { in: 'no digits\n', out: '0\n' },
      ],
      hidden: [
        '',
        '9999999999',
        '2026-10-09\n',
        '0',
        'x9y8z7',
        'd1g1t5 and 0ther 9',
        '9'.repeat(10000),
      ],
    },
    {
      title: 'Шифр Цезаря',
      description: `
Юлий Цезарь шифровал письма, сдвигая каждую букву на 3 позиции по алфавиту: A → D, B → E, …, X → A, Y → B, Z → C.

В первой строке ввода — сдвиг \`k\`, далее — текст до конца ввода. Зашифруйте текст: сдвиньте каждую латинскую букву на \`k\` позиций вперёд по кругу, сохраняя регистр. Остальные символы не меняйте.`,
      constraints: ['0 ≤ k ≤ 1000; текст содержит только ASCII-символы.'],
      hints: [
        'Прочитайте k через scanf("%d", &k), затем один getchar(), чтобы пропустить перевод строки после числа.',
        "Для строчной буквы: (c - 'a' + k) % 26 + 'a'. Для заглавной — то же с 'A'.",
      ],
      solution: String.raw`
#include <stdio.h>
#include <ctype.h>

int main(void) {
    int k;
    scanf("%d", &k);
    getchar();
    k %= 26;
    int c;
    while ((c = getchar()) != EOF) {
        if (islower(c)) {
            c = (c - 'a' + k) % 26 + 'a';
        } else if (isupper(c)) {
            c = (c - 'A' + k) % 26 + 'A';
        }
        putchar(c);
    }
    return 0;
}`,
      explanation: `
Буква переводится в номер от 0 до 25 (\`c - 'a'\`), номер сдвигается по кругу через \`% 26\`, затем возвращается в символ (\`+ 'a'\`). Это та же арифметика «по кругу», что для дней недели и часов.

\`scanf\` оставляет во вводе перевод строки после числа \`k\`. Если его не прочитать, он стал бы первым символом текста и попал бы в вывод. Лишний \`getchar()\` «съедает» его.`,
      examples: [
        { in: '3\nHello, World!\n', out: 'Khoor, Zruog!\n' },
        { in: '1\nxyz XYZ\n', out: 'yza YZA\n' },
      ],
      hidden: [
        '0\nabc\n',
        '26\nabc\n',
        '1000\nThe quick brown fox jumps over the lazy dog.\n',
        '13\nUryyb\n',
        '5\n12345 !?\n',
        '25\nabc XYZ\n',
        '52\nZz\n',
        `7\n${'Attack at dawn! '.repeat(200)}\n`,
      ],
    },
  ],
};
