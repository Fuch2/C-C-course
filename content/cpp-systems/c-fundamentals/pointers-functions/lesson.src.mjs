export default {
  id: 'c17-pointers-functions',
  title: 'Указатели и функции',
  description:
    'Передача адресов в функции: swap, выходные параметры, признак успеха с результатом через указатель, const-указатели для входных данных и необязательные параметры NULL.',
  moduleId: 'c-fundamentals',
  order: 39,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['c17-null'],
  objectives: [
    'Писать функции, изменяющие переменные вызывающего кода через указатели',
    'Возвращать несколько результатов через выходные параметры',
    'Сообщать об успехе через return, а результат — через указатель',
    'Отличать входные const-параметры от выходных',
  ],
  tags: ['C17', 'Указатели', 'Функции', 'swap'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void f(int *p, int v) {
    *p = *p + v;
    v = 0;
}

int main(void) {
    int a = 1, b = 5;
    f(&a, b);
    f(&a, b);
    printf("%d %d\n", a, b);
    return 0;
}`,
      answers: ['11 5'],
      placeholder: 'Вывод программы',
      explain:
        'a меняется через указатель дважды: 1 + 5 + 5 = 11. v — копия b, и её обнуление на b не влияет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void redirect(int *p) {
    int local = 100;
    p = &local;
    *p = 200;
}

int main(void) {
    int x = 1;
    redirect(&x);
    printf("%d\n", x);
    return 0;
}`,
      answers: ['1'],
      placeholder: 'Вывод программы',
      explain:
        'p = &local меняет копию указателя: дальше запись идёт в local, а не в x. x остаётся 1.',
    },
    {
      q: 'Как правильно вызвать void swap(int *a, int *b) для переменных int x, y?',
      options: ['swap(&x, &y);', 'swap(x, y);', 'swap(*x, *y);', 'swap(&&x, &&y);'],
      correct: 0,
      explain: 'Функции нужны адреса переменных.',
    },
    {
      q: 'Какие параметры в объявлении int parse(const char *text, int *value) входные, а какие выходные?',
      options: [
        'text — входной (только чтение), value — выходной',
        'Оба входные',
        'Оба выходные',
        'text — выходной, value — входной',
      ],
      correct: 0,
      explain:
        'const говорит, что строку функция только читает. Указатель без const на одиночную переменную — место для результата.',
    },
    {
      q: 'Почему scanf возвращает число прочитанных значений, а сами значения записывает по адресам?',
      options: [
        'Значений может быть несколько, и отдельно нужен признак успеха',
        'Так быстрее',
        'return не может вернуть int',
        'Это историческая случайность без смысла',
      ],
      correct: 0,
      explain: 'Это шаблон «признак успеха через return, результаты через указатели».',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void stats(const int *a, int n, int *sum, int *even) {
    *sum = 0;
    *even = 0;
    for (int i = 0; i < n; i++) {
        *sum += a[i];
        if (a[i] % 2 == 0) {
            (*even)++;
        }
    }
}

int main(void) {
    int a[4] = {3, 4, 6, 7};
    int s, e;
    stats(a, 4, &s, &e);
    printf("%d %d\n", s, e);
    return 0;
}`,
      answers: ['20 2'],
      placeholder: 'Вывод программы',
      explain:
        'Функция возвращает два результата через выходные параметры: сумму 20 и количество чётных — 4 и 6.',
    },
    {
      q: 'Функция void inc(int *p) { *p++; } должна увеличить число. Что не так?',
      options: [
        '*p++ сдвигает указатель, а значение не меняет; нужно (*p)++',
        'Ничего: число увеличится на 1',
        'Указатель нельзя передавать в функцию',
        'Нужно писать &p++',
      ],
      correct: 0,
      explain:
        'Постфиксный ++ связывает сильнее *: выражение читается как *(p++). Значение прочитано и выброшено, сдвинулась лишь локальная копия указателя.',
    },
  ],
  exercises: [
    {
      title: 'Упорядочить три числа',
      description: `
Напишите функцию \`void swap(int *a, int *b)\`. \`main\` уже написан: он читает три числа, упорядочивает их тремя вызовами \`swap\` и печатает.`,
      constraints: ['|числа| ≤ 10⁹.'],
      hints: [
        'int tmp = *a; *a = *b; *b = tmp;',
        'Функция получает адреса: в main вызов swap(&x, &y), а внутри функции обмен идёт через *a и *b.',
      ],
      starter: String.raw`
#include <stdio.h>

void swap(int *a, int *b) {
    // Поменяйте местами значения по адресам a и b.
}

int main(void) {
    int x, y, z;
    scanf("%d %d %d", &x, &y, &z);
    if (x > y) {
        swap(&x, &y);
    }
    if (y > z) {
        swap(&y, &z);
    }
    if (x > y) {
        swap(&x, &y);
    }
    printf("%d %d %d\n", x, y, z);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main(void) {
    int x, y, z;
    scanf("%d %d %d", &x, &y, &z);
    if (x > y) {
        swap(&x, &y);
    }
    if (y > z) {
        swap(&y, &z);
    }
    if (x > y) {
        swap(&x, &y);
    }
    printf("%d %d %d\n", x, y, z);
    return 0;
}`,
      explanation: `
Сравните с задачей «Три числа по порядку» из урока \`if\`: там обмен повторялся трижды по три строки. Функция \`swap\` с указателями убирает повторение — и это единственный способ написать такую функцию в C.`,
      examples: [
        { in: '3 1 2', out: '1 2 3\n' },
        { in: '5 5 1', out: '1 5 5\n' },
      ],
      hidden: ['1 2 3', '3 2 1', '2 3 1', '-1000000000 1000000000 0', '7 7 7', '1 3 2'],
    },
    {
      title: 'Деление с остатком',
      description: `
В C при делении отрицательного числа остаток тоже отрицательный: \`-7 % 3 == -1\`. В математике же принято, что остаток всегда в диапазоне от 0 до \`b − 1\`: \`-7 = 3 · (−3) + 2\`.

Напишите функцию \`void div_mod(int a, int b, int *q, int *r)\`, которая записывает в \`*q\` и \`*r\` **математические** частное и остаток для \`b > 0\`: \`a = b · q + r\`, \`0 ≤ r < b\`.

\`main\` уже написан: он читает пары \`a b\` до конца ввода и печатает \`q r\` для каждой.`,
      constraints: ['|a| ≤ 10⁹, 1 ≤ b ≤ 10⁹; пар не больше 1000.'],
      hints: [
        'Начните с обычных a / b и a % b. Если остаток получился отрицательным, прибавьте к нему b, а частное уменьшите на 1.',
        'Проверьте себя: для любой пары должно выполняться a == b * q + r и 0 <= r < b.',
      ],
      starter: String.raw`
#include <stdio.h>

void div_mod(int a, int b, int *q, int *r) {
    // Запишите математические частное и остаток.
}

int main(void) {
    int a, b;
    while (scanf("%d %d", &a, &b) == 2) {
        int q, r;
        div_mod(a, b, &q, &r);
        printf("%d %d\n", q, r);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void div_mod(int a, int b, int *q, int *r) {
    int quotient = a / b;
    int remainder = a % b;
    if (remainder < 0) {
        remainder += b;
        quotient--;
    }
    *q = quotient;
    *r = remainder;
}

int main(void) {
    int a, b;
    while (scanf("%d %d", &a, &b) == 2) {
        int q, r;
        div_mod(a, b, &q, &r);
        printf("%d %d\n", q, r);
    }
    return 0;
}`,
      explanation: `
C делит с отбрасыванием дробной части к нулю, а математическое деление — с округлением вниз. Они расходятся только при отрицательном делимом с ненулевым остатком: тогда остаток C отрицателен, и исправление «+b к остатку, −1 к частному» сохраняет равенство \`a = b · q + r\`.

Два результата возвращаются через выходные параметры. Внутри функции вычисления идут в локальных переменных, а запись по указателям — один раз в конце: так проще читать и проверять код.`,
      examples: [
        { in: '-7 3', out: '-3 2\n' },
        { in: '7 3\n-6 3', out: '2 1\n-2 0\n' },
      ],
      hidden: [
        '0 5',
        '-1 1000000000',
        '1000000000 1',
        '-1000000000 7',
        '5 5\n-5 5\n4 5\n-4 5',
        '-3 3\n3 1000000000\n-1000000000 1000000000',
      ],
    },
    {
      title: 'Минимум и максимум',
      description: `
Напишите функцию \`void min_max(const int *a, int n, int *min, int *max)\`, которая записывает наименьший и наибольший элементы массива по адресам \`min\` и \`max\`. Если какой-то из указателей равен \`NULL\`, соответствующий результат не записывается.

\`main\` уже написан: он вызывает функцию трижды — с обоими указателями и с одним из них равным \`NULL\`.`,
      constraints: ['1 ≤ n ≤ 1000; числа по модулю не больше 10⁹.'],
      hints: [
        'Найдите lo и hi в локальных переменных, затем: if (min != NULL) *min = lo; и то же для max.',
        'Перед записью проверяйте каждый выходной указатель отдельно: if (min != NULL) *min = lo;',
      ],
      starter: String.raw`
#include <stdio.h>

void min_max(const int *a, int n, int *min, int *max) {
    // Найдите минимум и максимум; NULL-указатели пропустите.
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int lo = 0, hi = 0;
    min_max(a, n, &lo, &hi);
    printf("%d %d\n", lo, hi);
    int only_max = 0;
    min_max(a, n, NULL, &only_max);
    int only_min = 0;
    min_max(a, n, &only_min, NULL);
    printf("%d %d\n", only_min, only_max);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void min_max(const int *a, int n, int *min, int *max) {
    int lo = a[0], hi = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] < lo) {
            lo = a[i];
        }
        if (a[i] > hi) {
            hi = a[i];
        }
    }
    if (min != NULL) {
        *min = lo;
    }
    if (max != NULL) {
        *max = hi;
    }
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int lo = 0, hi = 0;
    min_max(a, n, &lo, &hi);
    printf("%d %d\n", lo, hi);
    int only_max = 0;
    min_max(a, n, NULL, &only_max);
    int only_min = 0;
    min_max(a, n, &only_min, NULL);
    printf("%d %d\n", only_min, only_max);
    return 0;
}`,
      explanation: `
Сигнатура функции документирует себя: \`const int *a\` — входные данные только для чтения, \`int *min\` и \`int *max\` — выходные. Проверка на \`NULL\` делает выходные параметры необязательными — вызывающий код передаёт \`NULL\`, если результат ему не нужен.

Если бы функция писала \`*min = lo\` без проверки, вызов с \`NULL\` аварийно завершил бы программу.`,
      examples: [
        { in: '4\n4 -2 9 0', out: '-2 9\n-2 9\n' },
        { in: '1\n7', out: '7 7\n7 7\n' },
      ],
      hidden: [
        '3\n-1 -1 -1',
        '5\n1 2 3 4 5',
        '5\n5 4 3 2 1',
        '2\n-1000000000 1000000000',
        '3\n0 1000000000 -5',
        `1000\n${Array.from({ length: 1000 }, (_, i) => ((i * 7919) % 2001) - 1000).join(' ')}`,
      ],
    },
    {
      title: 'Разбор времени',
      description: `
Напишите функцию \`bool parse_time(const char *s, int *minutes)\`. Строка \`s\` должна иметь вид \`ЧЧ:ММ\` — ровно пять символов: две цифры, двоеточие, две цифры, причём часы от 00 до 23, а минуты от 00 до 59. Если строка корректна, функция записывает в \`*minutes\` количество минут с полуночи и возвращает \`true\`; иначе ничего не записывает и возвращает \`false\`.

\`main\` уже написан: он читает слова до конца ввода и для каждого печатает число минут или \`ошибка\`.`,
      constraints: ['Слова длиной от 1 до 20 символов без пробелов; слов не больше 1000.'],
      hints: [
        "Проверьте длину и позиции: s[2] == ':', остальные четыре символа — цифры (isdigit), s[5] == '\\0'.",
        "Часы: (s[0] - '0') * 10 + (s[1] - '0'); минуты — аналогично. Затем проверьте диапазоны.",
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdbool.h>
#include <ctype.h>

bool parse_time(const char *s, int *minutes) {
    // Проверьте формат ЧЧ:ММ и диапазоны, запишите результат.
    return false;
}

int main(void) {
    char word[21];
    while (scanf("%20s", word) == 1) {
        int m;
        if (parse_time(word, &m)) {
            printf("%d\n", m);
        } else {
            printf("ошибка\n");
        }
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdbool.h>
#include <ctype.h>

bool parse_time(const char *s, int *minutes) {
    for (int i = 0; i < 5; i++) {
        if (s[i] == '\0') {
            return false;
        }
    }
    if (s[5] != '\0' || s[2] != ':') {
        return false;
    }
    if (!isdigit(s[0]) || !isdigit(s[1]) || !isdigit(s[3]) || !isdigit(s[4])) {
        return false;
    }
    int h = (s[0] - '0') * 10 + (s[1] - '0');
    int m = (s[3] - '0') * 10 + (s[4] - '0');
    if (h > 23 || m > 59) {
        return false;
    }
    *minutes = h * 60 + m;
    return true;
}

int main(void) {
    char word[21];
    while (scanf("%20s", word) == 1) {
        int m;
        if (parse_time(word, &m)) {
            printf("%d\n", m);
        } else {
            printf("ошибка\n");
        }
    }
    return 0;
}`,
      explanation: `
Функция проверяет строку слоями сторожевых условий: длина (сначала убеждаемся, что в первых пяти символах нет \`'\\0'\`, — только потом безопасно смотреть на \`s[5]\`), разделитель, цифры, диапазоны. Результат записывается только при полном успехе.

Это шаблон «признак успеха + результат через указатель» — так устроены функции разбора во множестве библиотек. Вызывающий код не может перепутать «ошибку» с настоящим значением: \`0\` минут — законное время \`00:00\`.`,
      examples: [
        { in: '13:45 25:00 7:30', out: '825\nошибка\nошибка\n' },
        { in: '00:00 23:59', out: '0\n1439\n' },
      ],
      hidden: ['12:60', '12-30', '12:3a', '123:45', '12:345', '1', '09:05 19:50 24:00'],
    },
  ],
};
