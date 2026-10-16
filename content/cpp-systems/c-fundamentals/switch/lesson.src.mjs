export default {
  id: 'c17-switch',
  title: 'Выбор по значению: switch',
  description:
    'Оператор switch, метки case и default, break и проваливание, группировка меток, выбор по символу и ограничения switch.',
  moduleId: 'c-fundamentals',
  order: 15,
  difficulty: 'beginner',
  estimatedMinutes: 35,
  prerequisites: ['c17-if-else'],
  objectives: [
    'Выбирать ветку программы по значению с помощью switch',
    'Объяснять роль break и последствия его отсутствия',
    'Группировать несколько значений в одну ветку',
    'Использовать switch для символов и знать его ограничения',
  ],
  tags: ['C17', 'switch', 'case', 'Ветвления'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int n = 1;
    switch (n) {
    case 1:
        printf("A\n");
    case 2:
        printf("B\n");
        break;
    case 3:
        printf("C\n");
        break;
    }
    return 0;
}`,
      answers: ['A\nB'],
      placeholder: 'Вывод программы',
      explain:
        'После case 1 нет break, поэтому выполнение проваливается в case 2 и останавливается на его break.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    char c = 'e';
    switch (c) {
    case 'a':
    case 'e':
    case 'o':
        printf("гласная\n");
        break;
    default:
        printf("другая\n");
        break;
    }
    return 0;
}`,
      answers: ['гласная'],
      placeholder: 'Вывод программы',
      explain:
        "Метки 'a', 'e', 'o' сгруппированы: при c == 'e' выполнение входит в общий код ветки.",
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int x = 9;
    switch (x) {
    case 1:
        printf("один\n");
        break;
    case 2:
        printf("два\n");
        break;
    }
    printf("конец\n");
    return 0;
}`,
      answers: ['конец'],
      placeholder: 'Вывод программы',
      explain: 'Ни одна метка не совпала, а default нет — switch ничего не делает.',
    },
    {
      q: 'Какие метки case допустимы в C? Выберите все.',
      options: [
        "case 'q':",
        'case 2 * 5:',
        'case 1.5:',
        'case "yes":',
        'case limit: (limit — обычная переменная)',
      ],
      correct: [0, 1],
      explain:
        'Метки должны быть целочисленными константами. Символ и константное выражение подходят; дробное число, строка и переменная — нет.',
    },
    {
      q: 'В каком случае лучше подходит цепочка if, а не switch?',
      options: [
        'Проверка, в каком диапазоне лежит температура',
        'Выбор действия по символу команды',
        'Название месяца по его номеру',
        'Обработка кода ошибки из небольшого набора значений',
      ],
      correct: 0,
      explain:
        'switch сравнивает с конкретными значениями. Диапазоны и сложные условия удобнее записывать через if.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int score = 0;
    int code = 2;
    switch (code) {
    case 1:
        score += 1;
    case 2:
        score += 10;
    case 3:
        score += 100;
        break;
    default:
        score += 1000;
        break;
    }
    printf("%d\n", score);
    return 0;
}`,
      answers: ['110'],
      placeholder: 'Вывод программы',
      explain: 'Вход на case 2: +10, затем провал в case 3: +100, затем break. Итого 110.',
    },
  ],
  exercises: [
    {
      title: 'День недели',
      description: `
Прочитайте номер дня недели и напечатайте его название строчными буквами: 1 — \`понедельник\`, 2 — \`вторник\`, 3 — \`среда\`, 4 — \`четверг\`, 5 — \`пятница\`, 6 — \`суббота\`, 7 — \`воскресенье\`. Для любого другого числа напечатайте \`ошибка\`.`,
      constraints: ['−1000 ≤ n ≤ 1000.'],
      hints: [
        'Семь меток case и default для остальных значений.',
        'Не забудьте break в каждой ветке.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    switch (n) {
    case 1:
        printf("понедельник\n");
        break;
    case 2:
        printf("вторник\n");
        break;
    case 3:
        printf("среда\n");
        break;
    case 4:
        printf("четверг\n");
        break;
    case 5:
        printf("пятница\n");
        break;
    case 6:
        printf("суббота\n");
        break;
    case 7:
        printf("воскресенье\n");
        break;
    default:
        printf("ошибка\n");
        break;
    }
    return 0;
}`,
      explanation: `
Каждому значению соответствует своя метка, а \`default\` обрабатывает все неверные номера: 0, 8, отрицательные. Без \`default\` программа на таких данных не напечатала бы ничего.

В разделе о массивах и строках вы увидите более короткое решение: названия хранятся в массиве, а номер дня служит индексом.`,
      examples: [
        { in: '3', out: 'среда\n' },
        { in: '8', out: 'ошибка\n' },
      ],
      hidden: ['1', '2', '4', '5', '6', '7', '0', '-1'],
    },
    {
      title: 'Калькулятор',
      description: `
Во вводе — выражение вида \`a op b\`, где \`a\` и \`b\` — целые числа, \`op\` — один из символов \`+\`, \`-\`, \`*\`, \`/\`, \`%\`. Вычислите и напечатайте результат по правилам целочисленной арифметики C.

- Если операция \`/\` или \`%\` и \`b\` равно нулю — напечатайте \`ошибка\`.
- Если символ операции другой — напечатайте \`неизвестная операция\`.`,
      constraints: ['−10⁹ ≤ a, b ≤ 10⁹; результат умножения может не поместиться в int.'],
      hints: [
        'Чтение: scanf("%d %c %d", &a, &op, &b) — пробел перед %c пропускает пробелы.',
        'Произведение до 10¹⁸ — считайте в long long: (long long)a * b.',
        'Внутри веток / и % добавьте if (b == 0).',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    long long a, b;
    char op;
    scanf("%lld %c %lld", &a, &op, &b);
    switch (op) {
    case '+':
        printf("%lld\n", a + b);
        break;
    case '-':
        printf("%lld\n", a - b);
        break;
    case '*':
        printf("%lld\n", a * b);
        break;
    case '/':
        if (b == 0) {
            printf("ошибка\n");
        } else {
            printf("%lld\n", a / b);
        }
        break;
    case '%':
        if (b == 0) {
            printf("ошибка\n");
        } else {
            printf("%lld\n", a % b);
        }
        break;
    default:
        printf("неизвестная операция\n");
        break;
    }
    return 0;
}`,
      explanation: `
\`switch\` выбирает операцию по символу, а внутри веток деления стоит обычный \`if\` для проверки нуля. Комбинировать эти конструкции — нормальная практика.

Чтение сразу в \`long long\` снимает вопрос о переполнении при умножении. Деление и остаток работают по правилам C: \`-7 / 2 == -3\`, \`-7 % 2 == -1\`.`,
      examples: [
        { in: '6 * 7', out: '42\n' },
        { in: '5 / 0', out: 'ошибка\n' },
        { in: '2 ^ 3', out: 'неизвестная операция\n' },
      ],
      hidden: [
        '1000000000 * 1000000000',
        '-7 / 2',
        '-7 % 2',
        '0 % 0',
        '10 - 20',
        '-1000000000 + -1000000000',
        '9 % 4',
        '8 / -3',
      ],
    },
    {
      title: 'Дни в месяце',
      description: `
Прочитайте номер месяца и год. Напечатайте количество дней в этом месяце с учётом високосных лет (правило — как в уроке «Логические операторы»).`,
      constraints: ['1 ≤ месяц ≤ 12, 1 ≤ год ≤ 1 000 000.'],
      hints: [
        'Сгруппируйте месяцы по 31 дню (1, 3, 5, 7, 8, 10, 12) и по 30 дней (4, 6, 9, 11).',
        'Для февраля внутри ветки проверьте високосность: (y % 4 == 0 && y % 100 != 0) || y % 400 == 0.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int month, year;
    scanf("%d %d", &month, &year);
    int days = 0;
    switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
        days = 31;
        break;
    case 4:
    case 6:
    case 9:
    case 11:
        days = 30;
        break;
    case 2:
        if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
            days = 29;
        } else {
            days = 28;
        }
        break;
    }
    printf("%d\n", days);
    return 0;
}`,
      explanation: `
Группировка меток превращает двенадцать вариантов в три ветки. Ветки не печатают сразу, а записывают результат в переменную \`days\` — печать одна, в конце. Так проще проверить, что вывод одинаков во всех случаях.`,
      examples: [
        { in: '2 2024', out: '29\n' },
        { in: '4 2026', out: '30\n' },
      ],
      hidden: ['1 2026', '2 2023', '2 1900', '2 2000', '12 1', '9 1000000', '7 7', '11 2011'],
    },
    {
      title: 'Робот',
      description: `
Робот стоит в точке \`(x, y)\`. Он получает команду — букву направления и число шагов: \`N\` — север (y увеличивается), \`S\` — юг (y уменьшается), \`E\` — восток (x увеличивается), \`W\` — запад (x уменьшается). Буква может быть заглавной или строчной.

**Ввод:** \`x y команда шаги\`, например \`0 0 N 5\`.

**Вывод:** новые координаты через пробел. Если буква не обозначает направление, робот остаётся на месте.`,
      constraints: ['|x|, |y| ≤ 10⁹, 0 ≤ шаги ≤ 10⁹.'],
      hints: [
        "Группируйте заглавную и строчную букву: case 'N': case 'n':.",
        'Координата может выйти за пределы int: 10⁹ + 10⁹. Используйте long long.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    long long x, y, steps;
    char cmd;
    scanf("%lld %lld %c %lld", &x, &y, &cmd, &steps);
    switch (cmd) {
    case 'N':
    case 'n':
        y += steps;
        break;
    case 'S':
    case 's':
        y -= steps;
        break;
    case 'E':
    case 'e':
        x += steps;
        break;
    case 'W':
    case 'w':
        x -= steps;
        break;
    default:
        break;
    }
    printf("%lld %lld\n", x, y);
    return 0;
}`,
      explanation: `
Каждая пара меток обрабатывает оба регистра буквы. \`default\` с пустой веткой явно показывает, что неизвестная команда игнорируется сознательно, а не забыта.

Пробел перед \`%c\` в формате пропускает пробел после \`y\`, иначе в \`cmd\` попал бы сам пробел.`,
      examples: [
        { in: '0 0 N 5', out: '0 5\n' },
        { in: '3 -2 w 10', out: '-7 -2\n' },
      ],
      hidden: [
        '0 0 S 1',
        '0 0 e 1000000000',
        '1000000000 1000000000 E 1000000000',
        '-1000000000 -1000000000 s 1000000000',
        '5 5 Q 100',
        '1 2 n 0',
        '7 7 W 7',
      ],
    },
  ],
};
