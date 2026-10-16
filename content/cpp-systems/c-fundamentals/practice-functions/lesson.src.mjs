const fn = (name, returnType, parameters) => ({
  type: 'function',
  functionName: name,
  returnType,
  parameters,
});

export default {
  id: 'c17-practice-functions',
  title: 'Практикум: функции',
  description:
    'Шесть задач на функции: проектирование сверху вниз, функции-строительные блоки, переиспользование и проверка функций по отдельности.',
  moduleId: 'c-fundamentals',
  order: 28,
  difficulty: 'intermediate',
  estimatedMinutes: 80,
  prerequisites: ['c17-main'],
  objectives: [
    'Проектировать решение сверху вниз: от общего плана к функциям',
    'Собирать сложные функции из простых',
    'Проверять функции по отдельности на крайних случаях',
    'Отделять вычисление от печати',
  ],
  tags: ['C17', 'Практикум', 'Функции', 'Декомпозиция'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что означает проектирование «сверху вниз»?',
      options: [
        'Сначала записать решение через ещё не написанные функции, затем реализовать их',
        'Писать код от последней строки к первой',
        'Сначала написать все функции, потом подумать, как их использовать',
        'Объявлять функции ниже main',
      ],
      correct: 0,
      explain:
        'Общий план с понятными именами функций определяет, какие маленькие задачи нужно решить дальше.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int reverse(int n) {
    int r = 0;
    while (n > 0) {
        r = r * 10 + n % 10;
        n /= 10;
    }
    return r;
}

int main(void) {
    printf("%d\n", reverse(reverse(1230)));
    return 0;
}`,
      answers: ['123'],
      placeholder: 'Вывод программы',
      explain:
        'reverse(1230) = 321 (ноль в начале пропадает), reverse(321) = 123. Двойной переворот не всегда возвращает исходное число.',
    },
    {
      q: 'Какие признаки говорят о том, что функцию стоит разделить? Выберите все.',
      options: [
        'Её описание требует нескольких «и»: читает, и считает, и печатает',
        'Она не помещается на экран',
        'У неё понятное имя и одна задача',
        'Её результат зависит только от параметров',
      ],
      correct: [0, 1],
      explain:
        'Несколько задач в одной функции и большой размер мешают понимать и тестировать код.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int twice(int x) {
    return 2 * x;
}

int inc(int x) {
    return x + 1;
}

int main(void) {
    printf("%d %d\n", twice(inc(3)), inc(twice(3)));
    return 0;
}`,
      answers: ['8 7'],
      placeholder: 'Вывод программы',
      explain:
        'Сначала вычисляется внутренний вызов: twice(4) = 8, inc(6) = 7. Порядок вложения меняет результат.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int calls = 0;

int square(int x) {
    calls++;
    return x * x;
}

int main(void) {
    int s = 0;
    for (int i = 1; i <= 4; i++) {
        s += square(i);
    }
    printf("%d %d\n", s, calls);
    return 0;
}`,
      answers: ['30 4'],
      placeholder: 'Вывод программы',
      explain:
        '1 + 4 + 9 + 16 = 30. Глобальный счётчик calls увеличивается при каждом из четырёх вызовов.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

char digit_char(int d) {
    return d < 10 ? '0' + d : 'A' + d - 10;
}

int main(void) {
    printf("%c%c%c\n", digit_char(1), digit_char(11), digit_char(15));
    return 0;
}`,
      answers: ['1BF'],
      placeholder: 'Вывод программы',
      explain:
        "Цифры до 9 — символы от '0'; 10 и больше — буквы: 11 → 'A' + 1 = 'B', 15 → 'F'. Так печатают числа в системах с основанием больше 10.",
    },
  ],
  exercises: [
    {
      title: 'Перевёрнутое число',
      description: `
Напишите функцию \`long long reverse_number(long long n)\`, которая возвращает число, записанное цифрами \`n\` в обратном порядке. Ведущие нули результата пропадают: \`reverse_number(1200)\` равно 21.`,
      constraints: ['0 ≤ n ≤ 10¹⁸.'],
      hints: [
        'Цикл: result = result * 10 + n % 10; n /= 10.',
        'Ведущие нули результата пропадают сами: для 1200 цикл получает цифры 0, 0, 2, 1, и результат растёт как 0 → 0 → 2 → 21.',
      ],
      starter:
        'long long reverse_number(long long n) {\n    // Функцию main писать не нужно.\n    return 0;\n}\n',
      solution: String.raw`
long long reverse_number(long long n) {
    long long result = 0;
    while (n > 0) {
        result = result * 10 + n % 10;
        n /= 10;
    }
    return result;
}`,
      explanation: `
Это алгоритм из урока \`while\`, оформленный функцией. Теперь его можно вызывать где угодно — в следующей задаче он понадобится для проверки палиндромов.

Для \`n ≤ 10¹⁸\` перевёрнутое число меньше 10¹⁸ (кроме \`n = 10¹⁸\`, которое даёт 1), переполнения нет.`,
      examples: [
        { args: [12345], out: '54321\n' },
        { args: [1200], out: '21\n' },
      ],
      hidden: [
        { args: [0] },
        { args: [7] },
        { args: ['1000000000000000000'] },
        { args: ['123456789012345678'] },
        { args: [10] },
        { args: [100] },
        { args: ['999999999999999999'] },
      ],
      checking: fn('reverse_number', 'long_long', [{ name: 'n', type: 'long_long' }]),
    },
    {
      title: 'Палиндромы',
      description: `
Напишите функцию \`int count_palindromes(int a, int b)\`, которая возвращает количество чисел-палиндромов на отрезке \`[a, b]\`. Используйте вспомогательные функции: перевёрнутое число и проверку «палиндром ли».`,
      constraints: ['0 ≤ a ≤ b ≤ 2 000 000.'],
      hints: [
        'int is_palindrome(int n) { return reverse(n) == n; }',
        'Перебор от a до b — до двух миллионов итераций, это быстро.',
      ],
      starter: `int reverse(int n) {
    return 0;
}

int is_palindrome(int n) {
    return 0;
}

int count_palindromes(int a, int b) {
    // Функцию main писать не нужно.
    return 0;
}
`,
      solution: String.raw`
int reverse(int n) {
    int result = 0;
    while (n > 0) {
        result = result * 10 + n % 10;
        n /= 10;
    }
    return result;
}

int is_palindrome(int n) {
    return reverse(n) == n;
}

int count_palindromes(int a, int b) {
    int count = 0;
    for (int n = a; n <= b; n++) {
        if (is_palindrome(n)) {
            count++;
        }
    }
    return count;
}`,
      explanation: `
Три уровня функций: \`count_palindromes\` перебирает числа, \`is_palindrome\` отвечает на вопрос для одного числа, \`reverse\` переворачивает. Каждая функция короткая и проверяется отдельно.

Ноль — палиндром: \`reverse(0) == 0\`. Числа с нулём на конце (10, 120) не палиндромы, и \`reverse\` это корректно обрабатывает.`,
      examples: [
        { args: [1, 100], out: '18\n', why: '1–9 (9 чисел) и 11, 22, …, 99 (9 чисел).' },
        { args: [0, 0], out: '1\n' },
      ],
      hidden: [
        { args: [10, 10] },
        { args: [100, 200] },
        { args: [0, 2000000] },
        { args: [12321, 12321] },
        { args: [1000, 9999] },
        { args: [1, 9] },
        { args: [999999, 1000001] },
      ],
      checking: fn('count_palindromes', 'int', [
        { name: 'a', type: 'int' },
        { name: 'b', type: 'int' },
      ]),
    },
    {
      title: 'НОК',
      description: `
Напишите функцию \`long long lcm(long long a, long long b)\` — наименьшее общее кратное двух натуральных чисел. Напишите и используйте вспомогательную функцию \`gcd\`.`,
      constraints: ['1 ≤ a, b ≤ 10⁹.'],
      hints: [
        'lcm = a / gcd(a, b) * b — сначала деление, потом умножение.',
        'НОД — алгоритм Евклида: пока b ≠ 0, (a, b) = (b, a % b). Делите до умножения: так промежуточное значение не превышает ответа.',
      ],
      starter: `long long gcd(long long a, long long b) {
    return 0;
}

long long lcm(long long a, long long b) {
    // Функцию main писать не нужно.
    return 0;
}
`,
      solution: String.raw`
long long gcd(long long a, long long b) {
    while (b != 0) {
        long long r = a % b;
        a = b;
        b = r;
    }
    return a;
}

long long lcm(long long a, long long b) {
    return a / gcd(a, b) * b;
}`,
      explanation: `
Функция \`gcd\` из урока о параметрах переиспользуется без изменений — в этом и смысл функций. НОК выражается через НОД одной строкой.

Деление перед умножением не даёт промежуточному результату вырасти больше самого НОК.`,
      examples: [
        { args: [4, 6], out: '12\n' },
        { args: [7, 13], out: '91\n' },
      ],
      hidden: [
        { args: [1, 1] },
        { args: [1000000000, 999999999] },
        { args: [12, 12] },
        { args: [1, 1000000000] },
        { args: [18, 48] },
        { args: [999999937, 999999929] },
        { args: [1000000000, 1000000000] },
      ],
      checking: fn('lcm', 'long_long', [
        { name: 'a', type: 'long_long' },
        { name: 'b', type: 'long_long' },
      ]),
    },
    {
      title: 'Цифровой корень',
      description: `
Напишите функцию \`int digital_root(long long n)\`: сумма цифр повторяется, пока не останется одна цифра. Для нуля корень равен 0.

Напишите вспомогательную функцию суммы цифр и вызывайте её в цикле.`,
      constraints: ['0 ≤ n ≤ 10¹⁸.'],
      hints: [
        'long long digit_sum(long long n) — из урока о функциях.',
        'while (n >= 10) n = digit_sum(n); return (int)n;',
      ],
      starter: `long long digit_sum(long long n) {
    return 0;
}

int digital_root(long long n) {
    // Функцию main писать не нужно.
    return 0;
}
`,
      solution: String.raw`
long long digit_sum(long long n) {
    long long sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}

int digital_root(long long n) {
    while (n >= 10) {
        n = digit_sum(n);
    }
    return (int)n;
}`,
      explanation: `
В уроке \`do while\` эта задача требовала вложенного цикла. С функцией \`digit_sum\` внутренний цикл спрятан, и \`digital_root\` записывается в три строки, которые читаются как определение: «пока число многозначное, заменить его суммой цифр».`,
      examples: [
        { args: [9875], out: '2\n' },
        { args: [0], out: '0\n' },
      ],
      hidden: [
        { args: [9] },
        { args: [10] },
        { args: ['999999999999999999'] },
        { args: ['1000000000000000000'] },
        { args: [123456789] },
        { args: [18] },
        { args: [38] },
      ],
      checking: fn('digital_root', 'int', [{ name: 'n', type: 'long_long' }]),
    },
    {
      title: 'Числа-близнецы',
      description: `
Простые числа-близнецы — пары простых чисел, отличающихся на 2: (3, 5), (5, 7), (11, 13). Прочитайте \`n\` и напечатайте все такие пары, где большее число не больше \`n\`, — по паре в строке. В последней строке напечатайте количество пар.`,
      constraints: ['1 ≤ n ≤ 1 000 000.'],
      hints: [
        'Решение из разбора урока: функция is_prime и цикл по p.',
        'Для n = 10⁶ проверок около 2 · 10⁶, каждая — до 1000 делений. Это укладывается в лимит времени.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdbool.h>

bool is_prime(int n) {
    if (n < 2) {
        return false;
    }
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            return false;
        }
    }
    return true;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int count = 0;
    for (int p = 2; p + 2 <= n; p++) {
        if (is_prime(p) && is_prime(p + 2)) {
            printf("%d %d\n", p, p + 2);
            count++;
        }
    }
    printf("%d\n", count);
    return 0;
}`,
      explanation: `
Проектирование сверху вниз даёт решение почти без усилий: условие задачи переводится в цикл с вызовом \`is_prime\`, а функция берётся из прошлых уроков.

Короткая схема \`&&\` экономит время: если \`p\` не простое, проверка \`p + 2\` не выполняется.`,
      examples: [
        { in: '20', out: '3 5\n5 7\n11 13\n17 19\n4\n' },
        { in: '4', out: '0\n' },
      ],
      hidden: ['5', '7', '1', '1000', '100000', '13', '300'],
    },
    {
      title: 'Любая система счисления',
      description: `
Прочитайте неотрицательное число \`n\` и основание \`base\` (от 2 до 16) и напечатайте запись \`n\` в этой системе счисления. Цифры больше 9 обозначаются заглавными латинскими буквами: A = 10, B = 11, …, F = 15.

Напишите функцию \`char digit_char(int d)\`, которая превращает цифру от 0 до 15 в символ.

**Примеры:** \`255 16\` → \`FF\`, \`10 2\` → \`1010\`, \`0 7\` → \`0\`.`,
      constraints: ['0 ≤ n ≤ 10¹⁸; 2 ≤ base ≤ 16.'],
      hints: [
        "digit_char: если d < 10 — вернуть '0' + d, иначе 'A' + d - 10.",
        'Как в задаче «Двоичная запись»: найдите наибольшую степень основания p ≤ n (условие p <= n / base защищает от переполнения), затем идите по степеням вниз.',
        'Цифра на каждом шаге — n / p, затем n %= p, p /= base.',
      ],
      solution: String.raw`
#include <stdio.h>

char digit_char(int d) {
    if (d < 10) {
        return (char)('0' + d);
    }
    return (char)('A' + d - 10);
}

int main(void) {
    long long n;
    int base;
    scanf("%lld %d", &n, &base);
    long long p = 1;
    while (p <= n / base) {
        p *= base;
    }
    while (p > 0) {
        printf("%c", digit_char((int)(n / p)));
        n %= p;
        p /= base;
    }
    printf("\n");
    return 0;
}`,
      explanation: `
Символы цифр и букв в таблице кодов идут подряд, поэтому \`'0' + d\` даёт символ цифры \`d\`, а \`'A' + d - 10\` — букву для значений 10–15. Подробно о кодах символов — в уроке «Символы».

Условие \`p <= n / base\` вместо \`p * base <= n\` проверяет то же самое, но без риска переполнения: при \`n\` около 10¹⁸ и основании 16 произведение \`p * base\` могло бы выйти за пределы \`long long\`. Для \`n = 0\` степень остаётся 1, и печатается одна цифра 0.`,
      examples: [
        { in: '255 16', out: 'FF\n' },
        { in: '10 2', out: '1010\n' },
      ],
      hidden: [
        '0 7',
        '1000000000000000000 16',
        '1000000000000000000 2',
        '35 16',
        '7 8',
        '8 8',
        '123456789 10',
        '4095 16',
      ],
    },
  ],
};
