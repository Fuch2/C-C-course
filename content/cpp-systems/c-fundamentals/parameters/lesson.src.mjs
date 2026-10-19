const fnStarter = (signature, body) => `${signature} {
    // Напишите тело функции. Функцию main писать не нужно.
${body}
}
`;

export default {
  id: 'c17-parameters',
  title: 'Параметры функций',
  description:
    'Передача аргументов по значению, почему функция не меняет переменную вызывающего кода, порядок аргументов, преобразование типов, const и вызовы функций из функций.',
  moduleId: 'c-fundamentals',
  order: 24,
  difficulty: 'beginner',
  estimatedMinutes: 40,
  prerequisites: ['c17-functions'],
  objectives: [
    'Объяснять передачу аргументов по значению',
    'Возвращать новое значение вместо попытки изменить аргумент',
    'Следить за порядком и типами аргументов',
    'Строить функции из вызовов других функций',
  ],
  tags: ['C23', 'Функции', 'Параметры', 'Передача по значению'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void inc(int x) {
    x++;
}

int main(void) {
    int a = 5;
    inc(a);
    inc(a);
    printf("%d\n", a);
    return 0;
}`,
      answers: ['5'],
      placeholder: 'Вывод программы',
      explain: 'Функция увеличивает свою копию. Переменная a в main не меняется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int inc(int x) {
    return x + 1;
}

int main(void) {
    int a = 5;
    a = inc(a);
    a = inc(a);
    printf("%d\n", a);
    return 0;
}`,
      answers: ['7'],
      placeholder: 'Вывод программы',
      explain: 'Новое значение возвращается и присваивается a — дважды.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int sub(int a, int b) {
    return a - b;
}

int main(void) {
    int a = 10, b = 3;
    printf("%d\n", sub(b, a));
    return 0;
}`,
      answers: ['-7'],
      placeholder: 'Вывод программы',
      explain: 'Аргументы сопоставляются по позиции: параметр a получает 3, b — 10. 3 − 10 = −7.',
    },
    {
      q: 'Функция объявлена как int square(int x). Что вернёт square(2.9)?',
      options: ['4', '8', '8.41', 'Ошибка компиляции'],
      correct: 0,
      explain: 'Аргумент 2.9 преобразуется в int 2 (дробная часть отбрасывается), 2 · 2 = 4.',
    },
    {
      q: 'Почему вызов f(i++, i++) — плохая идея?',
      options: [
        'Порядок вычисления аргументов не определён — результат зависит от компилятора',
        'Аргументы нельзя увеличивать',
        'Функция получит одинаковые значения',
        'Это ошибка компиляции',
      ],
      correct: 0,
      explain:
        'Стандарт C не задаёт, какой аргумент вычисляется первым. Изменение одной переменной в двух аргументах делает поведение неопределённым.',
    },
    {
      q: 'Какие утверждения о параметрах верны? Выберите все.',
      options: [
        'Параметр — локальная переменная функции',
        'Изменение параметра меняет аргумент вызывающего кода',
        'Параметр получает начальное значение из аргумента',
        'Имена параметров должны совпадать с именами аргументов',
      ],
      correct: [0, 2],
      explain:
        'Параметр — копия аргумента, живущая внутри функции. Имена параметров и аргументов никак не связаны.',
    },
  ],
  exercises: [
    {
      title: 'Степень',
      description: `
Напишите функцию \`long long power(long long base, int exponent)\`, возвращающую \`base\` в степени \`exponent\`. По определению любое число в нулевой степени равно 1.`,
      constraints: [
        '−100 ≤ base ≤ 100, 0 ≤ exponent ≤ 60; гарантируется, что результат по модулю не больше 10¹⁸.',
      ],
      hints: [
        'Аккумулятор result = 1 и цикл на exponent итераций с result *= base.',
        'При exponent = 0 цикл не выполнится — ответ 1 получится сам.',
      ],
      starter: fnStarter('long long power(long long base, int exponent)', '    return 0;'),
      solution: String.raw`
long long power(long long base, int exponent) {
    long long result = 1;
    for (int i = 0; i < exponent; i++) {
        result *= base;
    }
    return result;
}`,
      explanation: `
Возведение в степень — накопление произведения, начинающегося с 1. Нулевая степень обрабатывается автоматически.

Почему не \`pow\` из \`<math.h>\`? \`pow\` работает с \`double\`, и для больших целых степеней результат может оказаться приближённым: \`double\` хранит только около 15–16 значащих цифр, а \`3³⁷\` содержит 18.`,
      examples: [
        { args: [2, 10], out: '1024\n' },
        { args: [-3, 3], out: '-27\n' },
      ],
      hidden: [
        { args: [5, 0] },
        { args: [0, 0] },
        { args: [0, 5] },
        { args: [3, 37] },
        { args: [-2, 59] },
        { args: [100, 9] },
        { args: [1, 60] },
      ],
      checking: {
        type: 'function',
        functionName: 'power',
        returnType: 'long_long',
        parameters: [
          { name: 'base', type: 'long_long' },
          { name: 'exponent', type: 'int' },
        ],
      },
    },
    {
      title: 'НОД как функция',
      description: `
Напишите функцию \`long long gcd(long long a, long long b)\`, возвращающую наибольший общий делитель двух неотрицательных чисел (не обоих нулевых). Используйте алгоритм Евклида. НОД(a, 0) = a.`,
      constraints: ['0 ≤ a, b ≤ 10¹⁸, a + b > 0.'],
      hints: [
        'while (b != 0) { long long r = a % b; a = b; b = r; } return a;',
        'Изменять a и b внутри функции безопасно — это копии.',
      ],
      starter: fnStarter('long long gcd(long long a, long long b)', '    return 0;'),
      solution: String.raw`
long long gcd(long long a, long long b) {
    while (b != 0) {
        long long r = a % b;
        a = b;
        b = r;
    }
    return a;
}`,
      explanation: `
В практикуме по циклам алгоритм Евклида портил исходные \`a\` и \`b\`, и для НОК приходилось делать копии. В функции копии создаются автоматически: параметры — это копии аргументов, и вызывающий код получает только результат.

Если \`a < b\`, первая итерация просто меняет их местами: \`a % b == a\`.`,
      examples: [
        { args: [48, 18], out: '6\n' },
        { args: [7, 0], out: '7\n' },
      ],
      hidden: [
        { args: [0, 9] },
        { args: [1, 1] },
        { args: ['1000000000000000000', '999999999999999999'] },
        { args: ['1000000000000000000', 500000000] },
        { args: [17, 51] },
        { args: [1071, 462] },
      ],
      checking: {
        type: 'function',
        functionName: 'gcd',
        returnType: 'long_long',
        parameters: [
          { name: 'a', type: 'long_long' },
          { name: 'b', type: 'long_long' },
        ],
      },
    },
    {
      title: 'Ограничение диапазоном',
      description: `
Напишите функцию \`int clamp(int value, int low, int high)\`: если \`value\` меньше \`low\`, она возвращает \`low\`; если больше \`high\` — \`high\`; иначе само \`value\`. Так, например, ограничивают громкость или яркость допустимыми пределами.`,
      constraints: ['−10⁹ ≤ value ≤ 10⁹; −10⁹ ≤ low ≤ high ≤ 10⁹.'],
      hints: [
        'Две проверки с ранним return: if (value < low) return low; if (value > high) return high;',
        'Если ни одна не сработала — return value;',
      ],
      starter: fnStarter('int clamp(int value, int low, int high)', '    return 0;'),
      solution: String.raw`
int clamp(int value, int low, int high) {
    if (value < low) {
        return low;
    }
    if (value > high) {
        return high;
    }
    return value;
}`,
      explanation: `
Ранний \`return\` избавляет от \`else\`: если первая проверка сработала, функция уже вернула ответ. Порядок параметров «значение, нижняя граница, верхняя граница» — общепринятый; в C++ есть стандартная функция \`std::clamp\` с тем же порядком.

Тесты проверяют значения ниже, выше, внутри и ровно на границах, а также вырожденный диапазон \`low == high\`.`,
      examples: [
        { args: [15, 0, 10], out: '10\n' },
        { args: [-3, 0, 10], out: '0\n' },
      ],
      hidden: [
        { args: [4, 0, 10] },
        { args: [0, 0, 10] },
        { args: [10, 0, 10] },
        { args: [5, 7, 7] },
        { args: [-1000000000, -5, 5] },
        { args: [1000000000, -1000000000, 999999999] },
      ],
      checking: {
        type: 'function',
        functionName: 'clamp',
        returnType: 'int',
        parameters: [
          { name: 'value', type: 'int' },
          { name: 'low', type: 'int' },
          { name: 'high', type: 'int' },
        ],
      },
    },
    {
      title: 'Кратные на отрезке',
      description: `
Напишите функцию \`long long count_multiples(long long a, long long b, long long k)\`, которая возвращает количество чисел на отрезке \`[a, b]\`, делящихся на \`k\`.

Числа могут быть до 10¹⁸, поэтому перебор не успеет — нужна формула.`,
      constraints: ['1 ≤ a ≤ b ≤ 10¹⁸, 1 ≤ k ≤ 10¹⁸.'],
      hints: [
        'Сколько чисел от 1 до b делится на k? Ровно b / k (целочисленное деление).',
        'Ответ для [a, b] — разность: «от 1 до b» минус «от 1 до a − 1».',
      ],
      starter: fnStarter(
        'long long count_multiples(long long a, long long b, long long k)',
        '    return 0;',
      ),
      solution: String.raw`
long long count_multiples(long long a, long long b, long long k) {
    return b / k - (a - 1) / k;
}`,
      explanation: `
Кратные \`k\` среди чисел \`1..b\` — это \`k, 2k, 3k, …\`, и их ровно \`b / k\`. Числа отрезка \`[a, b]\` — это \`1..b\` без \`1..a−1\`, поэтому ответ — разность двух таких количеств.

Цикл от \`a\` до \`b\` для отрезка длиной 10¹⁸ работал бы тысячи лет. Умение заменить перебор формулой — важный навык; в модуле об алгоритмах он называется оптимизацией по сложности.`,
      examples: [
        { args: [1, 10, 3], out: '3\n' },
        { args: [10, 20, 5], out: '3\n' },
      ],
      hidden: [
        { args: [1, 1, 1] },
        { args: [7, 7, 7] },
        { args: [8, 13, 7] },
        { args: [1, '1000000000000000000', 1] },
        { args: [1, '1000000000000000000', '1000000000000000000'] },
        { args: [999, 1001, 1000] },
        { args: [2, 3, 5] },
      ],
      checking: {
        type: 'function',
        functionName: 'count_multiples',
        returnType: 'long_long',
        parameters: [
          { name: 'a', type: 'long_long' },
          { name: 'b', type: 'long_long' },
          { name: 'k', type: 'long_long' },
        ],
      },
    },
    {
      title: 'Бонус к счёту',
      description: `
Программа должна прочитать счёт игрока и количество пройденных уровней, начислить бонус \`100 × уровни\` и напечатать новый счёт. Но функция \`add_bonus\` в заготовке «ничего не меняет»: счёт печатается прежним.

Перепишите функцию так, чтобы она **возвращала** новый счёт, и измените вызов в \`main\`, чтобы результат присваивался переменной \`score\`.`,
      constraints: ['0 ≤ счёт ≤ 10⁹, 0 ≤ уровни ≤ 10⁶.'],
      hints: [
        'Тип результата функции — long long, в теле — return score + 100LL * levels;',
        'В main: score = add_bonus(score, levels);',
      ],
      starter: String.raw`
#include <stdio.h>

void add_bonus(long long score, int levels) {
    score = score + 100LL * levels;
}

int main(void) {
    long long score;
    int levels;
    scanf("%lld %d", &score, &levels);
    add_bonus(score, levels);
    printf("%lld\n", score);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

long long add_bonus(long long score, int levels) {
    return score + 100LL * levels;
}

int main(void) {
    long long score;
    int levels;
    scanf("%lld %d", &score, &levels);
    score = add_bonus(score, levels);
    printf("%lld\n", score);
    return 0;
}`,
      explanation: `
В заготовке функция изменяла свой параметр — копию. После возврата копия исчезала вместе с бонусом. Исправление — передать результат наружу через \`return\` и сохранить его.

Суффикс \`LL\` у константы делает умножение \`100LL * levels\` 64-битным: при 10⁶ уровней бонус равен 10⁸, а вместе со счётом — до 1,1 · 10⁹, что уже близко к пределу \`int\`.`,
      examples: [
        { in: '500 3', out: '800\n' },
        { in: '0 0', out: '0\n' },
      ],
      hidden: [
        '1000000000 1000000',
        '1 1',
        '123456 7',
        '0 1000000',
        '999 0',
        '1000000000 0',
        '5 999999',
      ],
    },
  ],
};
