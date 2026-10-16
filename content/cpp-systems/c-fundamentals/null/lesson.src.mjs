export default {
  id: 'c17-null',
  title: 'Нулевой указатель NULL',
  description:
    'NULL как «ни на что не указывает», инициализация и проверка перед разыменованием, функции, возвращающие NULL, своя функция поиска с указателем и различие NULL, 0 и \\0.',
  moduleId: 'c-fundamentals',
  order: 38,
  difficulty: 'intermediate',
  estimatedMinutes: 35,
  prerequisites: ['c17-dereference'],
  objectives: [
    'Инициализировать указатели значением NULL при отсутствии адреса',
    'Проверять указатель перед разыменованием',
    'Обрабатывать NULL, возвращаемый функциями библиотеки',
    'Писать функции, возвращающие указатель на найденный элемент или NULL',
  ],
  tags: ['C17', 'NULL', 'Указатели', 'Обработка ошибок'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "pointer";
    char *a = strchr(s, 't');
    char *b = strchr(s, 'z');
    printf("%d %d\n", a != NULL, b != NULL);
    return 0;
}`,
      answers: ['1 0'],
      placeholder: 'Вывод программы',
      explain: 'Буква t в строке есть — указатель не NULL. Буквы z нет — strchr вернул NULL.',
    },
    {
      q: 'Что произойдёт при выполнении int *p = NULL; printf("%d", *p);?',
      options: [
        'Неопределённое поведение, обычно аварийное завершение программы',
        'Напечатается 0',
        'Ошибка компиляции',
        'Напечатается адрес',
      ],
      correct: 0,
      explain:
        'NULL не указывает ни на какой объект. В большинстве систем обращение по нему вызывает Segmentation fault.',
    },
    {
      q: 'Какие условия истинны, когда p не равен NULL? Выберите все.',
      options: ['p != NULL', 'p', '!p', 'p == NULL'],
      correct: [0, 1],
      explain:
        'NULL в условии — ложь, любой другой указатель — истина. !p истинно именно для NULL.',
    },
    {
      q: 'Где ошибка в коде int v = *p; if (p == NULL) { return 1; }?',
      options: [
        'Проверка стоит после разыменования — при NULL программа упадёт раньше',
        'Нельзя сравнивать указатель с NULL',
        'return 1 запрещён',
        'Ошибки нет',
      ],
      correct: 0,
      explain: 'Сначала проверка, потом использование.',
    },
    {
      q: 'Что использовать для обозначения конца строки?',
      options: ["'\\0'", 'NULL', '0.0', '"\\0"'],
      correct: 0,
      explain:
        "Конец строки — символ с кодом 0, записывается как '\\0'. NULL — значение указателя.",
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    const char *word = "banana";
    const char *p = strchr(word, 'n');
    const char *q = strchr(word, 'x');
    printf("%td %d\n", p - word, q == NULL);
    return 0;
}`,
      answers: ['2 1'],
      placeholder: 'Вывод программы',
      explain:
        'Первая n стоит на позиции 2. Символа x в слове нет, strchr вернула NULL, и сравнение истинно.',
    },
    {
      q: 'Функция int *find(int a[], int n, int x) вернула NULL. Что это означает и что делать?',
      options: [
        'Элемент не найден; разыменовывать результат нельзя',
        'Найден элемент с индексом 0',
        'Найден элемент, равный нулю',
        'Произошла ошибка памяти, программу нужно завершить',
      ],
      correct: 0,
      explain:
        'NULL — договорённость «результата нет». Вызывающий код проверяет его и обрабатывает этот случай отдельно.',
    },
  ],
  exercises: [
    {
      title: 'Первое отрицательное',
      description: `
Напишите функцию \`int *first_negative(int a[], int n)\`, возвращающую указатель на первый отрицательный элемент массива или \`NULL\`, если отрицательных нет.

\`main\` уже написан: он читает массив, вызывает функцию и, если элемент найден, заменяет его модулем, после чего печатает массив. Если отрицательных нет, печатается \`нет\`.`,
      constraints: ['1 ≤ n ≤ 1000; числа по модулю не больше 10⁹.'],
      hints: ['Цикл по i; при a[i] < 0 — return &a[i];', 'После цикла — return NULL;'],
      starter: String.raw`
#include <stdio.h>

int *first_negative(int a[], int n) {
    // Верните адрес первого отрицательного элемента или NULL.
    return NULL;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int *p = first_negative(a, n);
    if (p == NULL) {
        printf("нет\n");
        return 0;
    }
    *p = -*p;
    for (int i = 0; i < n; i++) {
        printf(i > 0 ? " %d" : "%d", a[i]);
    }
    printf("\n");
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int *first_negative(int a[], int n) {
    for (int i = 0; i < n; i++) {
        if (a[i] < 0) {
            return &a[i];
        }
    }
    return NULL;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int *p = first_negative(a, n);
    if (p == NULL) {
        printf("нет\n");
        return 0;
    }
    *p = -*p;
    for (int i = 0; i < n; i++) {
        printf(i > 0 ? " %d" : "%d", a[i]);
    }
    printf("\n");
    return 0;
}`,
      explanation: `
Функция возвращает адрес элемента массива вызывающего кода — после возврата он остаётся действительным. \`main\` проверяет результат на \`NULL\` до разыменования и только потом меняет элемент через указатель.

Сравните с индексом: функция, возвращающая индекс, отдала бы −1 для «не найдено», а \`main\` пришлось бы писать \`a[i]\`. С указателем найденный элемент меняется напрямую.`,
      examples: [
        { in: '5\n3 -4 5 -6 7', out: '3 4 5 -6 7\n' },
        { in: '3\n1 2 3', out: 'нет\n' },
      ],
      hidden: [
        '1\n-1',
        '1\n0',
        '4\n-1 -2 -3 -4',
        '3\n0 0 -1000000000',
        '2\n5 -5',
        `1000\n${Array.from({ length: 1000 }, (_, i) => (i === 997 ? -3 : i)).join(' ')}`,
      ],
    },
    {
      title: 'Позиция символа',
      description: `
Прочитайте слово и символ. С помощью \`strchr\` найдите первое вхождение символа в слово и напечатайте его позицию (с нуля). Если символа нет, напечатайте −1.`,
      constraints: ['Слово из 1–100 латинских букв и цифр; символ — латинская буква или цифра.'],
      hints: [
        'char *p = strchr(word, c); затем проверка p != NULL.',
        'Позиция — разность p - word, печатается через %td.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[101];
    char c;
    scanf("%100s %c", word, &c);
    char *p = strchr(word, c);
    if (p != NULL) {
        printf("%td\n", p - word);
    } else {
        printf("-1\n");
    }
    return 0;
}`,
      explanation: `
\`strchr\` возвращает указатель на найденный символ или \`NULL\`. Разность указателей на элементы одного массива — расстояние между ними в элементах, то есть индекс найденного символа.

Без проверки на \`NULL\` вычисление \`p - word\` для отсутствующего символа дало бы бессмысленное число.`,
      examples: [
        { in: 'pointer t', out: '4\n' },
        { in: 'abc z', out: '-1\n' },
      ],
      hidden: ['a a', 'abcabc c', 'x1y2 2', 'Hello h', 'zzz z', 'abcdefghij j'],
    },
    {
      title: 'Безопасный доступ',
      description: `
Напишите функцию \`int *at(int a[], int n, int i)\`, которая возвращает адрес элемента \`a[i]\`, если \`0 ≤ i < n\`, и \`NULL\` в противном случае.

\`main\` уже написан: он читает массив, затем индексы до конца ввода, и для каждого печатает значение элемента или \`вне массива\`.`,
      constraints: ['1 ≤ n ≤ 1000; индексы по модулю не больше 10⁹.'],
      hints: [
        'if (i < 0 || i >= n) return NULL; return &a[i];',
        'Проверяйте обе границы: отрицательный индекс так же недопустим, как индекс n и больше.',
      ],
      starter: String.raw`
#include <stdio.h>

int *at(int a[], int n, int i) {
    // Верните &a[i] для допустимого индекса, иначе NULL.
    return NULL;
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int k = 0; k < n; k++) {
        scanf("%d", &a[k]);
    }
    int i;
    while (scanf("%d", &i) == 1) {
        int *p = at(a, n, i);
        if (p != NULL) {
            printf("%d\n", *p);
        } else {
            printf("вне массива\n");
        }
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int *at(int a[], int n, int i) {
    if (i < 0 || i >= n) {
        return NULL;
    }
    return &a[i];
}

int main(void) {
    int a[1000];
    int n;
    scanf("%d", &n);
    for (int k = 0; k < n; k++) {
        scanf("%d", &a[k]);
    }
    int i;
    while (scanf("%d", &i) == 1) {
        int *p = at(a, n, i);
        if (p != NULL) {
            printf("%d\n", *p);
        } else {
            printf("вне массива\n");
        }
    }
    return 0;
}`,
      explanation: `
Функция превращает опасную операцию — обращение по индексу без проверки — в безопасную: вызывающий код получает либо корректный адрес, либо \`NULL\` и обязан его проверить. Так устроены «безопасные» контейнеры во многих библиотеках; в C++ похожую роль играет метод \`at\` у \`std::vector\`, который при ошибке выбрасывает исключение.`,
      examples: [{ in: '3\n10 20 30\n0 2 3 -1', out: '10\n30\nвне массива\nвне массива\n' }],
      hidden: [
        '1\n5\n0 1 -1000000000 1000000000',
        '4\n1 2 3 4\n3 2 1 0',
        '2\n-7 7\n',
        '5\n1 2 3 4 5\n5 4 -1 0',
        '1\n-1000000000\n0 0 0',
        '3\n7 8 9\n1000000000 -1000000000 1',
        `1000\n${Array.from({ length: 1000 }, (_, i) => i * 3).join(' ')}\n0 999 1000 500`,
      ],
    },
  ],
};
