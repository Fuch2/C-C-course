export default {
  id: 'c17-scope',
  title: 'Область видимости и время жизни',
  description:
    'Локальные переменные и блоки, переменные функций, затенение имён, глобальные переменные, static внутри функции и на уровне файла.',
  moduleId: 'c-fundamentals',
  order: 26,
  difficulty: 'beginner',
  estimatedMinutes: 40,
  prerequisites: ['c17-return-values'],
  objectives: [
    'Определять область видимости и время жизни переменной',
    'Объявлять переменные в самом узком подходящем блоке',
    'Находить ошибки затенения имён',
    'Объяснять недостатки глобальных переменных',
    'Сохранять состояние функции между вызовами с помощью static',
  ],
  tags: ['C23', 'Область видимости', 'static', 'Глобальные переменные'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int x = 1;

void f(void) {
    x = x + 10;
}

int main(void) {
    f();
    f();
    printf("%d\n", x);
    return 0;
}`,
      answers: ['21'],
      placeholder: 'Вывод программы',
      explain: 'x — глобальная переменная, каждый вызов f меняет её: 1 → 11 → 21.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int counter(void) {
    int n = 0;
    n++;
    return n;
}

int main(void) {
    counter();
    counter();
    printf("%d\n", counter());
    return 0;
}`,
      answers: ['1'],
      placeholder: 'Вывод программы',
      explain:
        'Обычная локальная переменная создаётся заново при каждом вызове: n всегда начинается с 0.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int counter(void) {
    static int n = 0;
    n++;
    return n;
}

int main(void) {
    counter();
    counter();
    printf("%d\n", counter());
    return 0;
}`,
      answers: ['3'],
      placeholder: 'Вывод программы',
      explain:
        'static-переменная инициализируется один раз и сохраняет значение между вызовами: 1, 2, 3.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int sum = 0;
    for (int i = 1; i <= 3; i++) {
        int sum = 0;
        sum += i;
    }
    printf("%d\n", sum);
    return 0;
}`,
      answers: ['0'],
      placeholder: 'Вывод программы',
      explain:
        'Внутри цикла объявлена новая переменная sum, затеняющая внешнюю. Внешняя так и осталась нулём.',
    },
    {
      q: 'Чему равна глобальная переменная int total; без инициализатора в начале программы?',
      options: ['0', 'Мусору', '1', 'Программа не скомпилируется'],
      correct: 0,
      explain:
        'Глобальные и static-переменные без инициализатора обнуляются. Мусор бывает только в обычных локальных.',
    },
    {
      q: 'Какие утверждения о static-локальной переменной верны? Выберите все.',
      options: [
        'Она видна только внутри своей функции',
        'Она сохраняет значение между вызовами',
        'Её инициализатор выполняется при каждом вызове',
        'Она уничтожается при выходе из функции',
      ],
      correct: [0, 1],
      explain: 'Область видимости локальная, время жизни — вся программа. Инициализация — однажды.',
    },
  ],
  exercises: [
    {
      title: 'Номерки',
      description: `
В очереди выдают номерки: 1, 2, 3, … Напишите функцию \`int next_ticket(void)\`, которая при каждом вызове возвращает следующий номер. Используйте \`static\`-переменную внутри функции, а не глобальную.

\`main\` уже написан: он читает \`n\` и печатает \`n\` номерков, каждый на своей строке.`,
      constraints: ['1 ≤ n ≤ 1000.'],
      hints: [
        'static int last = 0; в начале функции, затем last++ и return last.',
        'static-переменная инициализируется один раз до первого вызова и сохраняет значение между вызовами, а обычная локальная создаётся заново при каждом вызове.',
      ],
      starter: String.raw`
#include <stdio.h>

int next_ticket(void) {
    // Возвращайте 1, 2, 3, ... при последовательных вызовах.
    return 0;
}

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        printf("%d\n", next_ticket());
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int next_ticket(void) {
    static int last = 0;
    last++;
    return last;
}

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        printf("%d\n", next_ticket());
    }
    return 0;
}`,
      explanation: `
\`static int last = 0;\` инициализируется один раз при запуске программы, а не при каждом вызове. Поэтому каждый следующий вызов видит значение, оставленное предыдущим.

Без \`static\` функция всегда возвращала бы 1. С глобальной переменной она тоже работала бы, но тогда состояние счётчика мог бы изменить любой код программы; \`static\` прячет его внутри функции.`,
      examples: [
        { in: '3', out: '1\n2\n3\n' },
        { in: '1', out: '1\n' },
      ],
      hidden: ['2', '10', '1000', '57', '5', '999'],
    },
    {
      title: 'Нарастающий итог',
      description: `
Напишите функцию \`long long add_to_total(int x)\`, которая прибавляет \`x\` к накопленной сумме всех предыдущих вызовов и возвращает новую сумму.

\`main\` уже написан: он читает \`n\` чисел и после каждого печатает нарастающий итог через пробел.`,
      constraints: ['1 ≤ n ≤ 10 000; числа по модулю не больше 10⁹.'],
      hints: [
        'static long long total = 0; total += x; return total;',
        'Сумма может превысить int: 10 000 · 10⁹ = 10¹³. Поэтому и накопитель, и результат функции — long long.',
      ],
      starter: String.raw`
#include <stdio.h>

long long add_to_total(int x) {
    // Прибавьте x к накопленной сумме и верните её.
    return 0;
}

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        if (i > 0) {
            printf(" ");
        }
        printf("%lld", add_to_total(x));
    }
    printf("\n");
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

long long add_to_total(int x) {
    static long long total = 0;
    total += x;
    return total;
}

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        if (i > 0) {
            printf(" ");
        }
        printf("%lld", add_to_total(x));
    }
    printf("\n");
    return 0;
}`,
      explanation: `
Аккумулятор, который раньше жил в \`main\`, переехал внутрь функции и стал \`static\`. Функция «помнит» сумму между вызовами.

У такого подхода есть цена: функцию нельзя «сбросить» и начать новый подсчёт, а её результат зависит от истории вызовов. Поэтому \`static\`-состояние используют осторожно — для счётчиков, кэшей, генераторов.`,
      examples: [
        { in: '4\n1 2 3 4', out: '1 3 6 10\n' },
        { in: '1\n-5', out: '-5\n' },
      ],
      hidden: [
        '3\n1000000000 1000000000 1000000000',
        '5\n-1 1 -1 1 -1',
        '2\n0 0',
        '6\n10 20 30 -60 5 5',
        '3\n-1000000000 -1000000000 -1000000000',
        '1\n0',
        `1400\n${Array(1400).fill('1000000000').join(' ')}`,
      ],
    },
    {
      title: 'Пропавшая сумма',
      description: `
Программа должна прочитать \`n\` чисел и напечатать сумму положительных. Но она всегда печатает 0. Найдите и исправьте ошибку, связанную с областью видимости.`,
      constraints: ['1 ≤ n ≤ 10 000; числа по модулю не больше 10⁹.'],
      hints: [
        'Посмотрите, сколько раз в программе встречается объявление переменной sum.',
        'Внутри if создаётся новая переменная sum, затеняющая внешнюю. Уберите слово long long перед ней.',
      ],
      starter: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        if (x > 0) {
            long long sum = 0;
            sum += x;
        }
    }
    printf("%lld\n", sum);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        if (x > 0) {
            sum += x;
        }
    }
    printf("%lld\n", sum);
    return 0;
}`,
      explanation: `
Строка \`long long sum = 0;\` внутри \`if\` создаёт **новую** переменную с тем же именем. Все прибавления шли к ней, а она исчезала при выходе из блока. Внешняя \`sum\` оставалась нулём.

Компилятор с флагом \`-Wshadow\` предупредил бы: \`declaration of 'sum' shadows a previous local\`. Включайте этот флаг в собственных проектах.`,
      examples: [
        { in: '5\n3 -1 4 -1 5', out: '12\n' },
        { in: '2\n-1 -2', out: '0\n' },
      ],
      hidden: [
        '1\n7',
        '3\n1000000000 1000000000 1000000000',
        '4\n0 0 0 0',
        '6\n-5 5 -5 5 -5 5',
        '3\n-1000000000 1 -1',
        '5\n1 2 3 4 5',
      ],
    },
    {
      title: 'Генератор случайных чисел',
      description: `
Компьютеры обычно получают «случайные» числа по формуле — это **генератор псевдослучайных чисел**. Классический вариант хранит состояние \`state\` и на каждом шаге обновляет его:

\`state = state · 1103515245 + 12345\` (по модулю 2³², то есть в \`unsigned int\`)

а возвращает \`(state / 65536) % 32768\`.

Напишите две функции, использующие **общее** состояние:

- \`void set_seed(unsigned int seed)\` — устанавливает начальное состояние;
- \`int next_random(void)\` — обновляет состояние и возвращает очередное число.

\`main\` уже написан: он читает \`seed\` и \`k\`, вызывает \`set_seed\` и печатает \`k\` чисел через пробел.`,
      constraints: ['0 ≤ seed ≤ 4 294 967 295; 1 ≤ k ≤ 100.'],
      hints: [
        'Двум функциям нужна общая переменная — объявите её вне функций: static unsigned int state = 1;',
        'Арифметика unsigned int сама берёт результат по модулю 2³².',
      ],
      starter: String.raw`
#include <stdio.h>

// Объявите здесь общее состояние генератора.

void set_seed(unsigned int seed) {
}

int next_random(void) {
    return 0;
}

int main(void) {
    unsigned int seed;
    int k;
    scanf("%u %d", &seed, &k);
    set_seed(seed);
    for (int i = 0; i < k; i++) {
        if (i > 0) {
            printf(" ");
        }
        printf("%d", next_random());
    }
    printf("\n");
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

static unsigned int state = 1;

void set_seed(unsigned int seed) {
    state = seed;
}

int next_random(void) {
    state = state * 1103515245u + 12345u;
    return (int)(state / 65536 % 32768);
}

int main(void) {
    unsigned int seed;
    int k;
    scanf("%u %d", &seed, &k);
    set_seed(seed);
    for (int i = 0; i < k; i++) {
        if (i > 0) {
            printf(" ");
        }
        printf("%d", next_random());
    }
    printf("\n");
    return 0;
}`,
      explanation: `
\`static\`-переменная внутри функции здесь не подойдёт: её не увидит вторая функция. Нужна переменная уровня файла. Слово \`static\` у неё ограничивает видимость этим файлом — генератор хранит состояние «для себя».

Беззнаковое умножение «заворачивается» по модулю 2³² — это определённое поведение, именно на нём построена формула. Для знакового \`int\` такое переполнение было бы неопределённым поведением.

Одинаковое зерно (seed) всегда даёт одинаковую последовательность — поэтому числа и называются псевдослучайными. Это удобно для тестов и воспроизводимых экспериментов.`,
      examples: [
        { in: '1 5', out: '16838 5758 10113 17515 31051\n' },
        { in: '42 3', out: '19081 17033 15269\n' },
      ],
      hidden: ['0 10', '4294967295 5', '2026 20', '123456789 100', '7 1', '65536 4'],
    },
  ],
};
