const fnStarter = (signature, body) => `${signature} {
    // Напишите тело функции. Функцию main писать не нужно.
${body}
}
`;

export default {
  id: 'c17-return-values',
  title: 'Возвращаемые значения',
  description:
    'Несколько return и ранний выход, сторожевые проверки, функции-вопросы, преобразование результата, специальные значения «не найдено» и проверка результатов.',
  moduleId: 'c-fundamentals',
  order: 25,
  difficulty: 'beginner',
  estimatedMinutes: 40,
  prerequisites: ['c17-parameters'],
  objectives: [
    'Использовать несколько return и ранний выход из функции',
    'Писать сторожевые проверки для особых случаев',
    'Возвращать логические значения напрямую из выражений',
    'Сообщать об отсутствии результата специальным значением',
  ],
  tags: ['C23', 'Функции', 'return', 'bool'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int f(int x) {
    if (x > 10) {
        return 1;
    }
    if (x > 5) {
        return 2;
    }
    return 3;
}

int main(void) {
    printf("%d %d %d\n", f(20), f(7), f(5));
    return 0;
}`,
      answers: ['1 2 3'],
      placeholder: 'Вывод программы',
      explain:
        '20 > 10 — сразу 1. 7 не больше 10, но больше 5 — 2. 5 не подходит ни под одно условие — 3.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int g(void) {
    printf("A\n");
    return 5;
    printf("B\n");
}

int main(void) {
    printf("%d\n", g());
    return 0;
}`,
      answers: ['A\n5'],
      placeholder: 'Вывод программы',
      explain:
        'return завершает функцию, строка с B недостижима. Затем main печатает возвращённое 5.',
    },
    {
      q: 'Функция объявлена как int half(int x) { return x / 2.0; }. Что вернёт half(7)?',
      options: ['3', '3.5', '4', 'Ошибка компиляции'],
      correct: 0,
      explain:
        '7 / 2.0 = 3.5, но тип результата int: значение преобразуется с отбрасыванием дробной части.',
    },
    {
      q: 'Какая запись эквивалентна функции, которая возвращает 1 для чётного n и 0 для нечётного? Выберите все.',
      options: [
        'return n % 2 == 0;',
        'if (n % 2 == 0) return 1; else return 0;',
        'return n % 2;',
        'return !(n % 2);',
      ],
      correct: [0, 1, 3],
      explain:
        'n % 2 возвращает 1 (или −1) для нечётных — это противоположный ответ. !(n % 2) даёт 1, когда остаток 0.',
    },
    {
      q: 'Функция ищет индекс элемента и возвращает −1, если элемент не найден. Что обязательно делать вызывающему коду?',
      options: [
        'Проверять результат на −1 перед использованием как индекса',
        'Ничего, −1 — допустимый индекс',
        'Всегда прибавлять 1 к результату',
        'Вызывать функцию дважды',
      ],
      correct: 0,
      explain:
        'Специальное значение — договорённость. Если её не проверить, −1 будет использовано как настоящий результат.',
    },
    {
      q: 'Что предупреждение control reaches end of non-void function говорит о функции?',
      options: [
        'Есть путь выполнения, на котором функция с результатом заканчивается без return',
        'Функция слишком длинная',
        'Функция void возвращает значение',
        'Функция никогда не вызывается',
      ],
      correct: 0,
      explain:
        'На таком пути результат не определён. Нужно добавить return для недостающего случая.',
    },
  ],
  exercises: [
    {
      title: 'Знак числа',
      description: `
Напишите функцию \`int sign(long long x)\`: она возвращает 1 для положительного \`x\`, −1 для отрицательного и 0 для нуля.`,
      constraints: ['|x| ≤ 10¹⁸.'],
      hints: [
        'Два if с ранним return и завершающий return 0.',
        'Сравнивайте x с нулём, а не делите x на |x|: при x = 0 деление невозможно.',
      ],
      starter: fnStarter('int sign(long long x)', '    return 0;'),
      solution: String.raw`
int sign(long long x) {
    if (x > 0) {
        return 1;
    }
    if (x < 0) {
        return -1;
    }
    return 0;
}`,
      explanation: `
Три пути — три \`return\`. Завершающий \`return 0;\` покрывает оставшийся случай и не даёт функции «упасть» с конца.

Компактная альтернатива без ветвлений: \`return (x > 0) - (x < 0);\` — разность двух сравнений даёт 1, −1 или 0. Она красива, но для начинающих ветки понятнее.`,
      examples: [
        { args: [42], out: '1\n' },
        { args: [-7], out: '-1\n' },
      ],
      hidden: [
        { args: [0] },
        { args: ['1000000000000000000'] },
        { args: ['-1000000000000000000'] },
        { args: [1] },
        { args: [-1] },
        { args: ['999999999999'] },
        { args: [-2] },
      ],
      checking: {
        type: 'function',
        functionName: 'sign',
        returnType: 'int',
        parameters: [{ name: 'x', type: 'long_long' }],
      },
    },
    {
      title: 'Дней в месяце',
      description: `
Напишите функцию \`int days_in_month(int month, int year)\`, возвращающую количество дней в месяце с учётом високосных лет. Для неверного номера месяца функция возвращает 0.

Рекомендуется написать вспомогательную функцию \`int is_leap(int year)\` и вызвать её из \`days_in_month\`.`,
      constraints: ['−5 ≤ month ≤ 20, 1 ≤ year ≤ 1 000 000.'],
      hints: [
        'Сторожевая проверка: if (month < 1 || month > 12) return 0;',
        'Февраль: return is_leap(year) ? 29 : 28; четыре месяца по 30; остальные — 31.',
      ],
      starter: `int is_leap(int year) {
    // Вспомогательная функция: 1 для високосного года, 0 для обычного.
    return 0;
}

int days_in_month(int month, int year) {
    // Напишите тело функции. Функцию main писать не нужно.
    return 0;
}
`,
      solution: String.raw`
int is_leap(int year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

int days_in_month(int month, int year) {
    if (month < 1 || month > 12) {
        return 0;
    }
    if (month == 2) {
        return is_leap(year) ? 29 : 28;
    }
    if (month == 4 || month == 6 || month == 9 || month == 11) {
        return 30;
    }
    return 31;
}`,
      explanation: `
Порядок проверок: сначала неверные данные, затем самый особенный месяц — февраль, затем «короткие» месяцы, всё остальное — 31 день. Каждая ветка сразу возвращает ответ, вложенности нет.

Функция \`is_leap\` — пример повторного использования: правило високосного года записано один раз, и \`days_in_month\` просто спрашивает его.`,
      examples: [
        { args: [2, 2024], out: '29\n' },
        { args: [13, 2024], out: '0\n' },
      ],
      hidden: [
        { args: [2, 2023] },
        { args: [2, 1900] },
        { args: [2, 2000] },
        { args: [1, 1] },
        { args: [4, 2026] },
        { args: [12, 1000000] },
        { args: [0, 2026] },
        { args: [-5, 2026] },
      ],
      checking: {
        type: 'function',
        functionName: 'days_in_month',
        returnType: 'int',
        parameters: [
          { name: 'month', type: 'int' },
          { name: 'year', type: 'int' },
        ],
      },
    },
    {
      title: 'Первая цифра',
      description: `
Напишите функцию \`int first_digit(long long n)\`, возвращающую первую (старшую) цифру записи числа \`n\` без учёта знака. У нуля первая цифра — 0.`,
      constraints: ['|n| ≤ 10¹⁸.'],
      hints: [
        'Сначала уберите знак: if (n < 0) n = -n;',
        'Делите на 10, пока число не станет однозначным: while (n >= 10) n /= 10;',
      ],
      starter: fnStarter('int first_digit(long long n)', '    return 0;'),
      solution: String.raw`
int first_digit(long long n) {
    if (n < 0) {
        n = -n;
    }
    while (n >= 10) {
        n /= 10;
    }
    return (int)n;
}`,
      explanation: `
Отбрасывая последние цифры, пока число не станет однозначным, получаем старшую цифру. Изменять параметр безопасно — это копия.

Знак убирается заранее: для отрицательных чисел остаток и деление дали бы отрицательную цифру. Ограничение \`|n| ≤ 10¹⁸\` гарантирует, что \`-n\` не переполнится. Явное приведение \`(int)n\` показывает, что сужение \`long long\` до \`int\` задумано: значение от 0 до 9.`,
      examples: [
        { args: [2026], out: '2\n' },
        { args: [-905], out: '9\n' },
      ],
      hidden: [
        { args: [0] },
        { args: [7] },
        { args: [-1] },
        { args: ['1000000000000000000'] },
        { args: ['-999999999999999999'] },
        { args: [10] },
      ],
      checking: {
        type: 'function',
        functionName: 'first_digit',
        returnType: 'int',
        parameters: [{ name: 'n', type: 'long_long' }],
      },
    },
    {
      title: 'Где цифра',
      description: `
Напишите функцию \`int digit_position(long long n, int digit)\`. Она возвращает позицию **первого справа** вхождения цифры \`digit\` в записи неотрицательного числа \`n\`; позиции считаются справа налево, начиная с 1. Если цифры в числе нет, функция возвращает −1.

**Примеры:** \`digit_position(90210, 2)\` → 3; \`digit_position(90210, 0)\` → 1; \`digit_position(90210, 7)\` → −1.`,
      constraints: ['0 ≤ n ≤ 10¹⁸, 0 ≤ digit ≤ 9.'],
      hints: [
        'Перебирайте цифры от младшей: n % 10, затем n /= 10, считая позицию.',
        'Используйте do while, чтобы у числа 0 была одна цифра 0.',
        'При совпадении — сразу return позиция; после цикла — return -1.',
      ],
      starter: fnStarter('int digit_position(long long n, int digit)', '    return -1;'),
      solution: String.raw`
int digit_position(long long n, int digit) {
    int position = 1;
    do {
        if (n % 10 == digit) {
            return position;
        }
        n /= 10;
        position++;
    } while (n > 0);
    return -1;
}`,
      explanation: `
\`return\` внутри цикла завершает поиск на первом найденном совпадении — флаги и \`break\` не нужны. Если цикл закончился, значит, цифры нет, и функция возвращает специальное значение −1, которое не может быть настоящей позицией.

\`do while\` обрабатывает \`n = 0\`: у нуля одна цифра, и \`digit_position(0, 0)\` возвращает 1.`,
      examples: [
        { args: [90210, 2], out: '3\n' },
        { args: [90210, 7], out: '-1\n' },
      ],
      hidden: [
        { args: [90210, 0] },
        { args: [0, 0] },
        { args: [0, 5] },
        { args: ['1000000000000000000', 1] },
        { args: [123456789, 9] },
        { args: [123456789, 1] },
        { args: [555, 5] },
      ],
      checking: {
        type: 'function',
        functionName: 'digit_position',
        returnType: 'int',
        parameters: [
          { name: 'n', type: 'long_long' },
          { name: 'digit', type: 'int' },
        ],
      },
    },
    {
      title: 'Код треугольника',
      description: `
Напишите функцию \`int triangle_code(long long a, long long b, long long c)\`, которая по длинам сторон возвращает код:

| Код | Значение                      |
| --- | ----------------------------- |
| 0   | треугольник не существует     |
| 1   | равносторонний                |
| 2   | равнобедренный (не равносторонний) |
| 3   | разносторонний                |

Коды вместо строк — обычный приём, когда функцию вызывает другой код, а не человек.`,
      constraints: ['1 ≤ a, b, c ≤ 10¹⁸.'],
      hints: [
        'Первой — сторожевая проверка существования: если любая сторона не меньше суммы двух других, return 0.',
        'Суммы двух сторон до 2 · 10¹⁸ помещаются в long long (максимум ≈ 9,2 · 10¹⁸).',
      ],
      starter: fnStarter(
        'int triangle_code(long long a, long long b, long long c)',
        '    return 0;',
      ),
      solution: String.raw`
int triangle_code(long long a, long long b, long long c) {
    if (a >= b + c || b >= a + c || c >= a + b) {
        return 0;
    }
    if (a == b && b == c) {
        return 1;
    }
    if (a == b || b == c || a == c) {
        return 2;
    }
    return 3;
}`,
      explanation: `
Это задача «Тип треугольника» из практикума, переписанная как функция. Сравните: вместо цепочки \`if-else\` с печатью — последовательность сторожевых проверок с \`return\`. Каждая ветка короче и независима.

Функция не печатает, а возвращает код. Поэтому её можно использовать в разных программах: одна напечатает слово по-русски, другая — по-английски, третья посчитает статистику по тысяче треугольников.`,
      examples: [
        { args: [3, 4, 5], out: '3\n' },
        { args: [1, 2, 3], out: '0\n' },
      ],
      hidden: [
        { args: [5, 5, 5] },
        { args: [5, 5, 8] },
        { args: [8, 5, 5] },
        { args: [5, 8, 5] },
        { args: ['1000000000000000000', '1000000000000000000', '1000000000000000000'] },
        { args: [1, 1, 2] },
        { args: [2, 3, 4] },
      ],
      checking: {
        type: 'function',
        functionName: 'triangle_code',
        returnType: 'int',
        parameters: [
          { name: 'a', type: 'long_long' },
          { name: 'b', type: 'long_long' },
          { name: 'c', type: 'long_long' },
        ],
      },
    },
  ],
};
