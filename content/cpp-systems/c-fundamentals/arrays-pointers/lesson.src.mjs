export default {
  id: 'c17-arrays-pointers',
  title: 'Массивы и указатели',
  description:
    'Сведение массива к указателю, передача массивов в функции, p[i] как *(p + i), ловушка sizeof, различия массива и указателя, строковые литералы и заполнение буфера.',
  moduleId: 'c-fundamentals',
  order: 40,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['c17-pointers-functions'],
  objectives: [
    'Объяснять, почему массив не копируется при передаче в функцию',
    'Использовать эквивалентность p[i] и *(p + i)',
    'Избегать ловушки sizeof для параметра-массива',
    'Работать со строками через const char * и не изменять литералы',
    'Возвращать данные через буфер, предоставленный вызывающим кодом',
  ],
  tags: ['C23', 'Указатели', 'Массивы', 'Строки'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int a[4] = {5, 6, 7, 8};
    int *p = a + 1;
    printf("%d %d %d\n", *p, p[2], *(a + 3) - *a);
    return 0;
}`,
      answers: ['6 8 3'],
      placeholder: 'Вывод программы',
      explain: 'p указывает на a[1] = 6. p[2] — это a[3] = 8. *(a + 3) − *a = 8 − 5 = 3.',
    },
    {
      q: 'Что напечатает sizeof(a) внутри функции void f(int a[100]) на 64-битной системе?',
      options: ['8', '400', '100', '4'],
      correct: 0,
      explain: 'Параметр-массив — это указатель. Число 100 в объявлении игнорируется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void bump(int a[], int n) {
    for (int i = 0; i < n; i++) {
        a[i] += i;
    }
}

int main(void) {
    int data[3] = {10, 10, 10};
    bump(data, 3);
    printf("%d %d %d\n", data[0], data[1], data[2]);
    return 0;
}`,
      answers: ['10 11 12'],
      placeholder: 'Вывод программы',
      explain: 'Функция получила адрес массива и изменила оригинал.',
    },
    {
      q: 'Какие объявления позволяют безопасно изменить первую букву строки? Выберите все.',
      options: [
        'char s[] = "cat";',
        'char *s = "cat";',
        'const char *s = "cat";',
        'char s[10] = "cat";',
      ],
      correct: [0, 3],
      explain:
        'Массивы содержат собственную копию текста. Указатели на литерал указывают в память только для чтения.',
    },
    {
      q: 'Какие утверждения о массиве int a[5] и указателе int *p = a верны? Выберите все.',
      options: [
        'sizeof(a) == 20, sizeof(p) == 8',
        'p[3] и a[3] — один и тот же элемент',
        'a = p; допустимо',
        'p = a + 2; допустимо',
      ],
      correct: [0, 1, 3],
      explain: 'Массиву нельзя присвоить новое значение. Указатель можно перенаправить.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void zero_tail(int *a, int n) {
    for (int i = n / 2; i < n; i++) {
        a[i] = 0;
    }
}

int main(void) {
    int d[5] = {1, 2, 3, 4, 5};
    zero_tail(d + 1, 4);
    printf("%d %d %d %d %d\n", d[0], d[1], d[2], d[3], d[4]);
    return 0;
}`,
      answers: ['1 2 3 0 0'],
      placeholder: 'Вывод программы',
      explain:
        'Функция видит массив из четырёх элементов, начиная с d[1]. Её a[2] и a[3] — это d[3] и d[4].',
    },
    {
      q: 'Что не так с функцией int *make(void) { int a[10] = {0}; return a; }?',
      options: [
        'Массив a исчезает после выхода из функции, и указатель на него становится недействительным',
        'Функция не может возвращать указатель',
        'Массив нужно вернуть через return a[10]',
        'Ошибки нет',
      ],
      correct: 0,
      explain:
        'Локальный массив живёт только во время вызова. Правильный шаблон — вызывающий код передаёт буфер, а функция его заполняет.',
    },
  ],
  exercises: [
    {
      title: 'Длина без sizeof',
      description: `
Функция \`sum\` в заготовке считает количество элементов через \`sizeof\` и поэтому складывает только два первых числа. Исправьте её: добавьте параметр с количеством элементов и передайте его из \`main\`.`,
      constraints: ['1 ≤ n ≤ 1000; числа по модулю не больше 10⁶.'],
      hints: ['Сигнатура: long long sum(const int a[], int n).', 'В main вызов: sum(a, n).'],
      starter: String.raw`
#include <stdio.h>

long long sum(const int a[]) {
    long long total = 0;
    int n = sizeof(a) / sizeof(a[0]);
    for (int i = 0; i < n; i++) {
        total += a[i];
    }
    return total;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    printf("%lld\n", sum(a));
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

long long sum(const int a[], int n) {
    long long total = 0;
    for (int i = 0; i < n; i++) {
        total += a[i];
    }
    return total;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    printf("%lld\n", sum(a, n));
    return 0;
}`,
      explanation: `
Внутри функции \`a\` — указатель, \`sizeof(a)\` равен 8, и формула даёт \`8 / 4 = 2\` при любом массиве. GCC предупреждает об этом при компиляции заготовки.

Даже в \`main\` формула \`sizeof\` дала бы 1000 — размер массива, а не количество прочитанных чисел \`n\`. Длину данных знает только тот, кто их прочитал, поэтому её передают явно.`,
      examples: [
        { in: '5\n1 2 3 4 5', out: '15\n' },
        { in: '1\n-7', out: '-7\n' },
      ],
      hidden: [
        '3\n1000000 1000000 1000000',
        '2\n-1 1',
        '4\n10 20 30 40',
        '3\n-1000000 -1000000 -1000000',
        `1000\n${Array.from({ length: 1000 }, () => 1000000).join(' ')}`,
        `17\n${Array.from({ length: 17 }, (_, i) => i).join(' ')}`,
      ],
    },
    {
      title: 'Заполнить буфер',
      description: `
Напишите функцию \`void fill_sequence(int *out, int n, int start, int step)\`, которая записывает в массив \`out\` арифметическую прогрессию: \`start\`, \`start + step\`, \`start + 2·step\`, …

\`main\` уже написан: он читает \`n start step\`, вызывает функцию и печатает массив.`,
      constraints: ['1 ≤ n ≤ 1000; |start|, |step| ≤ 10⁵.'],
      hints: [
        'out[i] = start + i * step;',
        'Функция не знает размер буфера — она верит, что в нём есть место для n элементов. Поэтому main объявляет массив на 1000 элементов.',
      ],
      starter: String.raw`
#include <stdio.h>

void fill_sequence(int *out, int n, int start, int step) {
    // Заполните out[0..n-1].
}

int main(void) {
    int buffer[1000];
    int n, start, step;
    scanf("%d %d %d", &n, &start, &step);
    fill_sequence(buffer, n, start, step);
    for (int i = 0; i < n; i++) {
        printf(i > 0 ? " %d" : "%d", buffer[i]);
    }
    printf("\n");
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void fill_sequence(int *out, int n, int start, int step) {
    for (int i = 0; i < n; i++) {
        out[i] = start + i * step;
    }
}

int main(void) {
    int buffer[1000];
    int n, start, step;
    scanf("%d %d %d", &n, &start, &step);
    fill_sequence(buffer, n, start, step);
    for (int i = 0; i < n; i++) {
        printf(i > 0 ? " %d" : "%d", buffer[i]);
    }
    printf("\n");
    return 0;
}`,
      explanation: `
Массив \`buffer\` принадлежит \`main\`, а функция получает его адрес и заполняет. Это стандартный способ «вернуть массив» в C. Размер буфера — ответственность вызывающего кода: функция верит, что в нём есть место для \`n\` элементов.

Максимальное значение \`10⁵ + 999 · 10⁵\` ≈ 10⁸ помещается в \`int\`.`,
      examples: [
        { in: '5 1 3', out: '1 4 7 10 13\n' },
        { in: '3 10 -10', out: '10 0 -10\n' },
      ],
      hidden: ['1 7 100', '4 0 0', '1000 -100000 100000', '6 -5 2', '2 100000 -100000', '10 -3 0'],
    },
    {
      title: 'Сумма на отрезке',
      description: `
Напишите функцию \`long long range_sum(const int *a, int count)\`, которая возвращает сумму \`count\` элементов, начиная с адреса \`a\`.

\`main\` уже написан: он читает массив, затем запросы \`l r\` до конца ввода и для каждого печатает сумму элементов с индексами от \`l\` до \`r\` включительно, вызывая \`range_sum(a + l, r - l + 1)\`.`,
      constraints: [
        '1 ≤ n ≤ 1000; 0 ≤ l ≤ r < n; запросов не больше 1000; числа по модулю не больше 10⁶.',
      ],
      hints: [
        'Внутри функции a[0] — это первый элемент отрезка: просто сложите a[0] … a[count − 1].',
        'main передаёт a + l — адрес элемента a[l]. Поэтому a[0] внутри функции и есть a[l] вызывающего кода.',
      ],
      starter: String.raw`
#include <stdio.h>

long long range_sum(const int *a, int count) {
    // Сложите count элементов, начиная с a[0].
    return 0;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int l, r;
    while (scanf("%d %d", &l, &r) == 2) {
        printf("%lld\n", range_sum(a + l, r - l + 1));
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

long long range_sum(const int *a, int count) {
    long long total = 0;
    for (int i = 0; i < count; i++) {
        total += a[i];
    }
    return total;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int l, r;
    while (scanf("%d %d", &l, &r) == 2) {
        printf("%lld\n", range_sum(a + l, r - l + 1));
    }
    return 0;
}`,
      explanation: `
\`a + l\` — адрес элемента с индексом \`l\`. Функция получает его как начало «своего» массива, и её \`a[0]\` — это \`a[l]\` вызывающего кода. Одна и та же функция работает с целым массивом и с любой его частью.

Так в C передают «срез» массива без копирования: адрес начала и длину. Тот же приём — основа сортировки слиянием и двоичного поиска.`,
      examples: [{ in: '5\n1 2 3 4 5\n0 4\n1 3\n2 2', out: '15\n9\n3\n' }],
      hidden: [
        '1\n-5\n0 0',
        '4\n1000000 1000000 1000000 1000000\n0 3\n3 3',
        '6\n1 -1 1 -1 1 -1\n0 5\n1 4\n2 2',
        '3\n5 6 7\n0 0\n1 1\n2 2\n0 2',
        '2\n-1000000 -1000000\n0 1',
        `1000\n${Array.from({ length: 1000 }, (_, i) => i - 500).join(' ')}\n0 999\n500 999\n0 499\n250 750`,
        `1000\n${Array.from({ length: 1000 }, () => 1000000).join(' ')}\n0 999\n999 999`,
      ],
    },
    {
      title: 'Подсчёт гласных',
      description: `
Напишите функцию \`int count_vowels(const char *s)\`, возвращающую количество латинских гласных \`a, e, i, o, u\` (в любом регистре) в строке.

\`main\` уже написан: он читает строки через \`fgets\` до конца ввода и печатает результат для каждой.`,
      constraints: ['Строки не длиннее 200 символов, только ASCII.'],
      hints: [
        "Перебирайте символы до '\\0'; tolower упростит проверку регистра.",
        'Проверку гласной удобно вынести в strchr("aeiou", c) != NULL — но не забудьте, что strchr находит и \'\\0\'.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <ctype.h>

int count_vowels(const char *s) {
    // Посчитайте гласные a, e, i, o, u в любом регистре.
    return 0;
}

int main(void) {
    char line[202];
    while (fgets(line, sizeof(line), stdin) != NULL) {
        printf("%d\n", count_vowels(line));
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <ctype.h>

int count_vowels(const char *s) {
    int count = 0;
    for (int i = 0; s[i] != '\0'; i++) {
        int c = tolower((unsigned char)s[i]);
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            count++;
        }
    }
    return count;
}

int main(void) {
    char line[202];
    while (fgets(line, sizeof(line), stdin) != NULL) {
        printf("%d\n", count_vowels(line));
    }
    return 0;
}`,
      explanation: `
Функция получает \`const char *\` — указатель на первый символ строки — и идёт до нуль-терминатора: длину передавать не нужно. \`const\` обещает, что строка не изменится.

Приведение \`(unsigned char)\` перед \`tolower\` — защитная привычка: функции \`<ctype.h>\` определены для значений \`unsigned char\` и \`EOF\`, а \`char\` на многих системах знаковый, и байты кириллицы в нём отрицательны.`,
      examples: [
        { in: 'Hello World\nAEIOU aeiou\n', out: '3\n10\n' },
        { in: 'rhythm\n', out: '0\n' },
      ],
      hidden: [
        '\n',
        'Programming in C is fun\n',
        'xyz\nbcd\nA\n',
        'The quick brown fox jumps over the lazy dog',
        'aeiouAEIOU',
        'Education is fun '.repeat(10).slice(0, 199) + '\n',
      ],
    },
  ],
};
