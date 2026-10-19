const fnStarter = (signature, body) => `${signature} {
    // Напишите тело функции. Функцию main писать не нужно.
${body}
}
`;

export default {
  id: 'c17-functions',
  title: 'Функции',
  description:
    'Зачем нужны функции, определение и вызов, параметры и возврат результата, функции void, порядок в файле и прототипы.',
  moduleId: 'c-fundamentals',
  order: 23,
  difficulty: 'beginner',
  estimatedMinutes: 45,
  prerequisites: ['c17-practice-loops'],
  objectives: [
    'Определять и вызывать функции с параметрами и результатом',
    'Отличать функции, возвращающие значение, от функций void',
    'Объяснять, как выполнение переходит в функцию и возвращается обратно',
    'Объявлять функции до вызова: определением выше или прототипом',
    'Разбивать программу на функции с одной задачей',
  ],
  tags: ['C23', 'Функции', 'return', 'void'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int twice(int x) {
    return x * 2;
}

int main(void) {
    printf("%d\n", twice(twice(3)) + 1);
    return 0;
}`,
      answers: ['13'],
      placeholder: 'Вывод программы',
      explain: 'Внутренний вызов twice(3) = 6, внешний twice(6) = 12, плюс 1 — 13.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void greet(void) {
    printf("привет\n");
}

int main(void) {
    printf("A\n");
    greet();
    greet();
    printf("B\n");
    return 0;
}`,
      answers: ['A\nпривет\nпривет\nB'],
      placeholder: 'Вывод программы',
      explain:
        'Каждый вызов greet() выполняет её тело и возвращается в main к следующей инструкции.',
    },
    {
      q: 'Что означает тип результата void?',
      options: [
        'Функция ничего не возвращает',
        'Функция возвращает ноль',
        'Функция не принимает параметров',
        'Функция может вернуть значение любого типа',
      ],
      correct: 0,
      explain:
        'void в позиции типа результата — «результата нет». В скобках (void) означает «нет параметров» — это другое место.',
    },
    {
      q: 'Чем прототип int cube(int x); отличается от определения функции?',
      options: [
        'У прототипа нет тела — только заголовок и точка с запятой',
        'Прототип выполняется быстрее',
        'Прототип нужен только в C++',
        'Ничем',
      ],
      correct: 0,
      explain:
        'Прототип сообщает компилятору имя, параметры и тип результата, чтобы функцию можно было вызвать до её определения.',
    },
    {
      q: 'Какие вызовы допустимы для функций int square(int x) и void print_line(int n)? Выберите все.',
      options: [
        'int a = square(5);',
        'print_line(3);',
        'int b = print_line(3);',
        'printf("%d\\n", square(2) * 3);',
        'square();',
      ],
      correct: [0, 1, 3],
      explain:
        'void-функция не даёт значения, её нельзя присвоить. square требует ровно один аргумент — вызов без аргументов не скомпилируется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int f(int n) {
    int r = 0;
    for (int i = 1; i <= n; i++) {
        r += i;
    }
    return r;
}

int main(void) {
    printf("%d %d\n", f(4), f(f(2)));
    return 0;
}`,
      answers: ['10 6'],
      placeholder: 'Вывод программы',
      explain: 'f(n) — сумма 1..n. f(4) = 10. f(2) = 3, f(3) = 6.',
    },
    {
      q: 'Функция int sign(int x) { if (x > 0) return 1; if (x < 0) return -1; } — в чём ошибка?',
      options: [
        'При x == 0 функция доходит до конца без return — результат не определён',
        'Нельзя писать два return',
        'Функция не может возвращать отрицательные числа',
        'Ошибки нет',
      ],
      correct: 0,
      explain:
        'На каждом пути выполнения функция с результатом должна вернуть значение. GCC предупреждает: control reaches end of non-void function.',
    },
  ],
  exercises: [
    {
      title: 'Куб числа',
      description: `
Напишите функцию \`int cube(int x)\`, которая возвращает куб числа \`x\`.

Функцию \`main\` писать не нужно: проверяющая система вызовет \`cube\` с аргументом теста и напечатает результат. Для запуска кнопкой «Запустить» впишите аргумент в поле ввода.`,
      constraints: ['−1000 ≤ x ≤ 1000.'],
      hints: [
        'Тело функции — одна строка: return x * x * x;',
        'Куб отрицательного числа отрицателен: (−2)³ = −8. Наибольший куб 1000³ = 10⁹ ещё помещается в int (предел ≈ 2.1 · 10⁹).',
      ],
      starter: fnStarter('int cube(int x)', '    return 0;'),
      solution: String.raw`
int cube(int x) {
    return x * x * x;
}`,
      explanation: `
Функция получает копию аргумента в параметре \`x\` и возвращает \`x³\`. Для \`|x| ≤ 1000\` куб не больше 10⁹ и помещается в \`int\`.

Обратите внимание: функция ничего не печатает. Печатью результата занимается вызывающий код — здесь это \`main\`, который добавляет проверяющая система.`,
      examples: [
        { args: [3], out: '27\n' },
        { args: [-2], out: '-8\n' },
      ],
      hidden: [
        { args: [0] },
        { args: [1] },
        { args: [1000] },
        { args: [-1000] },
        { args: [12] },
        { args: [-1] },
        { args: [999] },
        { args: [-10] },
      ],
      checking: {
        type: 'function',
        functionName: 'cube',
        returnType: 'int',
        parameters: [{ name: 'x', type: 'int' }],
      },
    },
    {
      title: 'Максимум из трёх',
      description: `
Напишите функцию \`int max3(int a, int b, int c)\`, которая возвращает наибольшее из трёх чисел.

Совет: сначала напишите вспомогательную функцию \`int max2(int a, int b)\`, а \`max3\` выразите через неё.`,
      constraints: ['−10⁹ ≤ a, b, c ≤ 10⁹.'],
      hints: ['max2: return a > b ? a : b;', 'max3(a, b, c) = max2(max2(a, b), c).'],
      starter: `int max2(int a, int b) {
    // Вспомогательная функция: большее из двух.
    return 0;
}

int max3(int a, int b, int c) {
    // Напишите тело функции. Функцию main писать не нужно.
    return 0;
}
`,
      solution: String.raw`
int max2(int a, int b) {
    return a > b ? a : b;
}

int max3(int a, int b, int c) {
    return max2(max2(a, b), c);
}`,
      explanation: `
Функции можно вызывать из других функций. \`max2\` решает простую задачу, а \`max3\` собирается из двух её вызовов: результат первого вызова становится аргументом второго.

Такой приём — выразить сложное через простое — главная идея работы с функциями. Таким же образом можно было бы написать \`max4\` из трёх вызовов \`max2\`.`,
      examples: [
        { args: [3, 9, 4], out: '9\n' },
        { args: [-5, -2, -9], out: '-2\n' },
      ],
      hidden: [
        { args: [1, 1, 1] },
        { args: [7, 2, 3] },
        { args: [2, 3, 7] },
        { args: [-1000000000, 1000000000, 0] },
        { args: [5, 5, 4] },
        { args: [4, 5, 5] },
      ],
      checking: {
        type: 'function',
        functionName: 'max3',
        returnType: 'int',
        parameters: [
          { name: 'a', type: 'int' },
          { name: 'b', type: 'int' },
          { name: 'c', type: 'int' },
        ],
      },
    },
    {
      title: 'Лесенка из символов',
      description: `
Функция \`main\` в заготовке уже написана: она читает число \`n\` и символ и рисует лесенку, вызывая функцию \`print_row\`. Напишите функцию \`void print_row(char symbol, int count)\`, которая печатает символ \`count\` раз подряд и переводит строку.

**Пример:** для ввода \`3 #\` программа печатает

\`\`\`text
#
##
###
\`\`\``,
      constraints: ['1 ≤ n ≤ 50; символ — любой непробельный.'],
      hints: [
        'Внутри функции — цикл for от 0 до count и printf("%c", symbol).',
        'После цикла — printf("\\n"). Функция ничего не возвращает: return не нужен.',
      ],
      starter: String.raw`
#include <stdio.h>

void print_row(char symbol, int count) {
    // Напечатайте symbol count раз и переведите строку.
}

int main(void) {
    int n;
    char symbol;
    scanf("%d %c", &n, &symbol);
    for (int i = 1; i <= n; i++) {
        print_row(symbol, i);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void print_row(char symbol, int count) {
    for (int i = 0; i < count; i++) {
        printf("%c", symbol);
    }
    printf("\n");
}

int main(void) {
    int n;
    char symbol;
    scanf("%d %c", &n, &symbol);
    for (int i = 1; i <= n; i++) {
        print_row(symbol, i);
    }
    return 0;
}`,
      explanation: `
Вложенный цикл из прошлого раздела «спрятан» в функцию: \`main\` содержит только внешний цикл, а внутренний живёт в \`print_row\`. Код стал короче и понятнее: «для каждой строки напечатать ряд из i символов».

В \`print_row\` и в \`main\` есть переменные \`i\`, но это разные переменные: каждая существует только в своей функции. Подробнее — в уроке «Область видимости».`,
      examples: [
        { in: '3 #', out: '#\n##\n###\n' },
        { in: '1 *', out: '*\n' },
      ],
      hidden: ['5 @', '2 x', '50 =', '4 1', '3 a', '10 %', '7 Z'],
    },
    {
      title: 'Сумма цифр',
      description: `
Напишите функцию \`int digit_sum(long long n)\`, которая возвращает сумму цифр неотрицательного числа \`n\`.`,
      constraints: ['0 ≤ n ≤ 10¹⁸.'],
      hints: [
        'Цикл while (n > 0): прибавить n % 10, затем n /= 10.',
        'Изменять параметр n внутри функции можно: это копия аргумента.',
      ],
      starter: fnStarter('int digit_sum(long long n)', '    return 0;'),
      solution: String.raw`
int digit_sum(long long n) {
    int sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}`,
      explanation: `
Параметр \`n\` — локальная копия аргумента, поэтому функция может его «разрушать», не затрагивая переменную вызывающего кода. Подробно о копировании аргументов — в следующем уроке.

Для \`n = 0\` цикл не выполняется, и функция возвращает 0 — верный ответ без отдельной проверки.`,
      examples: [
        { args: [2026], out: '10\n' },
        { args: [0], out: '0\n' },
      ],
      hidden: [
        { args: [9] },
        { args: ['1000000000000000000'] },
        { args: ['999999999999999999'] },
        { args: [123456789] },
        { args: [10] },
        { args: [99] },
        { args: ['123456789012345678'] },
      ],
      checking: {
        type: 'function',
        functionName: 'digit_sum',
        returnType: 'int',
        parameters: [{ name: 'n', type: 'long_long' }],
      },
    },
    {
      title: 'Високосный год',
      description: `
Напишите функцию \`bool is_leap(int year)\`, которая возвращает \`true\` для високосного года и \`false\` для обычного. Тип \`bool\` и значения \`true\`/\`false\` встроены в язык (с C23), подключать для них ничего не нужно.

Проверяющая система напечатает результат как 1 или 0.`,
      constraints: ['1 ≤ year ≤ 1 000 000.'],
      hints: [
        'Тело функции — одно выражение: return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;',
        'Проверьте правила по порядку: делится на 400 — високосный; иначе делится на 100 — обычный; иначе делится на 4 — високосный.',
      ],
      starter: `bool is_leap(int year) {
    // Напишите тело функции. Функцию main писать не нужно.
    return false;
}
`,
      solution: String.raw`

bool is_leap(int year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}`,
      explanation: `
Функция, отвечающая «да/нет», обычно возвращает \`bool\`, а её имя начинается с \`is_\` или \`has_\`: \`is_leap\`, \`is_prime\`, \`has_digit\`. Тогда вызов читается как вопрос: \`if (is_leap(year))\`.

Теперь правило високосного года записано один раз. Если оно понадобится в задаче о датах, достаточно вызвать функцию — не нужно копировать формулу.`,
      examples: [
        { args: [2024], out: '1\n' },
        { args: [1900], out: '0\n' },
      ],
      hidden: [
        { args: [2000] },
        { args: [2023] },
        { args: [4] },
        { args: [1] },
        { args: [400] },
        { args: [2100] },
      ],
      checking: {
        type: 'function',
        functionName: 'is_leap',
        returnType: 'bool',
        parameters: [{ name: 'year', type: 'int' }],
      },
    },
  ],
};
