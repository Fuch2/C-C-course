export default {
  id: 'memory-pointer-to-pointer',
  title: 'Указатель на указатель',
  description:
    'Функция, изменяющая указатель вызывающего кода: выходной параметр int **, курсор для разбора строки, массив строк как char **, сортировка указателей и динамический массив строк.',
  moduleId: 'memory-pointers',
  order: 8,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['memory-pointer-arithmetic'],
  objectives: [
    'Объяснять, почему изменение параметра-указателя не меняет указатель вызывающего кода',
    'Возвращать выделенную память через выходной параметр int ** вместе с кодом ошибки',
    'Писать функции-курсоры, сдвигающие указатель вызывающего кода',
    'Работать с массивами строк char ** и освобождать их в правильном порядке',
  ],
  tags: ['C23', 'Память', 'Указатели', 'Указатель на указатель', 'Массив строк'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void redirect(int **pp, int *target) {
    *pp = target;
    **pp += 1;
}

int main(void) {
    int a = 10, b = 20;
    int *p = &a;
    redirect(&p, &b);
    printf("%d %d %d\n", a, b, *p);
    return 0;
}`,
      answers: ['10 21 21'],
      placeholder: 'Вывод программы',
      explain:
        '*pp = target перенаправляет p из main на b. **pp += 1 увеличивает b. a не меняется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

void skip(const char *s) {
    s += 2;
}

void skip_really(const char **s) {
    *s += 2;
}

int main(void) {
    const char *text = "abcdef";
    skip(text);
    printf("%c", *text);
    skip_really(&text);
    printf("%c\n", *text);
    return 0;
}`,
      answers: ['ac'],
      placeholder: 'Вывод программы',
      explain:
        'skip сдвигает копию указателя — text не меняется. skip_really получает адрес text и сдвигает сам указатель.',
    },
    {
      q: 'Переменная объявлена как int x = 5; int *p = &x; int **pp = &p; Какие выражения равны 5? Выберите все.',
      options: ['x', '*p', '**pp', '*pp', 'pp[0][0]'],
      correct: [0, 1, 2, 4],
      explain: '*pp — это указатель p, а не число. pp[0][0] — то же, что **pp.',
    },
    {
      q: 'Функция void f(const char **cursor) должна сдвинуть указатель вызывающего кода на один символ. Какая запись верна?',
      options: ['(*cursor)++', '*cursor++', 'cursor++', '**cursor++'],
      correct: 0,
      explain:
        'Постфиксный ++ сильнее разыменования, поэтому *cursor++ сдвигает локальный cursor. Скобки (*cursor)++ сдвигают указатель вызывающего кода.',
    },
    {
      q: 'Какой тип имеет параметр words, если в функцию передают массив char *list[10]?',
      options: ['char **', 'char (*)[10]', 'char *', 'char'],
      correct: 0,
      explain: 'Массив указателей сводится к указателю на первый элемент — указатель на char *.',
    },
    {
      q: 'Динамический массив char **lines содержит n строк, каждая выделена своим malloc. Сколько вызовов free нужно и в каком порядке?',
      options: [
        'n + 1: сначала каждую lines[i], затем lines',
        'n + 1: сначала lines, затем каждую lines[i]',
        '1: free(lines) освобождает всё',
        'n: только строки',
      ],
      correct: 0,
      explain:
        'После free(lines) читать lines[i] уже нельзя — адреса строк были бы потеряны. Поэтому сначала строки.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    const char *names[] = {"Kim", "Lee", "Park"};
    const char **p = names;
    p++;
    printf("%s %c\n", *p, **p);
    return 0;
}`,
      answers: ['Lee L'],
      placeholder: 'Вывод программы',
      explain: 'p указывает на элемент names[1]. *p — строка "Lee", **p — её первый символ.',
    },
  ],
  exercises: [
    {
      title: 'Найти и изменить',
      difficulty: 'beginner',
      description: `
Реализуйте функцию

\`\`\`c
int find_negative(int *a, int n, int **found);
\`\`\`

Она ищет первый отрицательный элемент массива. Если он есть, функция записывает его **адрес** в \`*found\` и возвращает 1, иначе возвращает 0 и \`*found\` не трогает.

Функция \`main\` дана: по найденному адресу она печатает индекс элемента, заменяет его нулём и печатает массив. Если отрицательных нет, печатается \`none\`.`,
      constraints: ['1 ≤ n ≤ 100.', '|x| ≤ 10⁹.'],
      hints: [
        'Цикл по i; при a[i] < 0 — *found = &a[i]; return 1;',
        'found — адрес указателя из main, поэтому записывать нужно в *found, а не в found.',
      ],
      starter: String.raw`
#include <stdio.h>

int find_negative(int *a, int n, int **found) {
    // Найдите первый отрицательный элемент.
    return 0;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int a[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int *where = NULL;
    if (!find_negative(a, n, &where)) {
        printf("none\n");
        return 0;
    }
    printf("%td\n", where - a);
    *where = 0;
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", a[i]);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int find_negative(int *a, int n, int **found) {
    for (int i = 0; i < n; i++) {
        if (a[i] < 0) {
            *found = &a[i];
            return 1;
        }
    }
    return 0;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int a[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int *where = NULL;
    if (!find_negative(a, n, &where)) {
        printf("none\n");
        return 0;
    }
    printf("%td\n", where - a);
    *where = 0;
    for (int i = 0; i < n; i++) {
        printf(i + 1 < n ? "%d " : "%d\n", a[i]);
    }
    return 0;
}`,
      explanation: `
Функция возвращает два результата: признак «нашли» — значением, а сам элемент — адресом через выходной параметр \`int **found\`. Через полученный указатель \`main\` может и узнать индекс (\`where − a\`), и изменить элемент на месте.

Указатель \`where\` указывает на элемент массива \`a\` из кадра \`main\` — объект живёт дольше указателя, так что это безопасно.`,
      examples: [
        { in: '5\n3 -1 4 -1 5\n', out: '1\n3 0 4 -1 5\n' },
        { in: '3\n1 2 3\n', out: 'none\n' },
      ],
      hidden: [
        { in: '1\n-5\n', name: 'Единственный отрицательный' },
        { in: '1\n0\n', name: 'Ноль не отрицательный' },
        { in: '4\n-1 -2 -3 -4\n', name: 'Все отрицательные' },
        { in: '4\n1 2 3 -4\n', name: 'Последний' },
        { in: '3\n1000000000 -1000000000 5\n', name: 'Крайние значения' },
        { in: '6\n0 0 0 0 0 -1\n', name: 'После нулей' },
        { in: '5\n7 7 7 7 7\n', name: 'Нет отрицательных' },
        { in: '2\n-7 3\n', name: 'Первый' },
      ],
    },
    {
      title: 'Разбор чисел курсором',
      description: `
Строка текста содержит целые числа, перемешанные с другими символами, например \`t=12; dt=-7, k=300.\`. Минус, стоящий **непосредственно перед цифрой**, — знак числа.

Реализуйте функцию

\`\`\`c
int next_number(const char **cursor, long long *value);
\`\`\`

Она пропускает символы до начала следующего числа, читает его в \`*value\`, сдвигает \`*cursor\` за последнюю цифру и возвращает 1. Если чисел больше нет, возвращает 0. Функция \`main\` дана: она печатает количество чисел и их сумму.`,
      constraints: ['Строка — до 200 символов.', 'Модуль каждого числа ≤ 10⁹.'],
      hints: [
        "Пропуск: while (**cursor && !isdigit((unsigned char)**cursor)) — но остановитесь на минусе, за которым идёт цифра: (*cursor)[0] == '-' && isdigit((unsigned char)(*cursor)[1]).",
        "Если дошли до '\\0' — вернуть 0. Иначе запомните знак, сдвиньте курсор за минус и накапливайте цифры: v = v * 10 + (**cursor - '0'); (*cursor)++;",
        'isdigit объявлена в <ctype.h>; аргумент приводят к unsigned char.',
      ],
      starter: String.raw`
#include <ctype.h>
#include <stdio.h>

int next_number(const char **cursor, long long *value) {
    // Найдите и прочитайте следующее число, сдвигая *cursor.
    return 0;
}

int main(void) {
    char line[256];
    if (fgets(line, sizeof line, stdin) == NULL) {
        line[0] = '\0';
    }
    const char *pos = line;
    long long value = 0, sum = 0;
    int count = 0;
    while (next_number(&pos, &value)) {
        count++;
        sum += value;
    }
    printf("count=%d sum=%lld\n", count, sum);
    return 0;
}`,
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>

int next_number(const char **cursor, long long *value) {
    const char *p = *cursor;
    while (*p != '\0' && !isdigit((unsigned char)*p) &&
           !(*p == '-' && isdigit((unsigned char)p[1]))) {
        p++;
    }
    if (*p == '\0') {
        *cursor = p;
        return 0;
    }
    int negative = 0;
    if (*p == '-') {
        negative = 1;
        p++;
    }
    long long v = 0;
    while (isdigit((unsigned char)*p)) {
        v = v * 10 + (*p - '0');
        p++;
    }
    *value = negative ? -v : v;
    *cursor = p;
    return 1;
}

int main(void) {
    char line[256];
    if (fgets(line, sizeof line, stdin) == NULL) {
        line[0] = '\0';
    }
    const char *pos = line;
    long long value = 0, sum = 0;
    int count = 0;
    while (next_number(&pos, &value)) {
        count++;
        sum += value;
    }
    printf("count=%d sum=%lld\n", count, sum);
    return 0;
}`,
      explanation: `
Функция работает с локальной копией \`p = *cursor\` и в конце записывает новое положение обратно: \`*cursor = p\`. Так меньше звёздочек и меньше шансов перепутать \`*cursor++\` с \`(*cursor)++\`. Указатель вызывающего кода меняется ровно один раз — в конце.

Следующий вызов начинает с того места, где закончился предыдущий, поэтому \`main\` разбирает строку простым циклом и не знает ничего о её формате. Так же работает стандартная \`strtol\` с параметром \`char **endptr\`.`,
      examples: [
        { in: 't=12; dt=-7, k=300.\n', out: 'count=3 sum=305\n' },
        { in: 'no numbers here\n', out: 'count=0 sum=0\n' },
      ],
      hidden: [
        { in: '42\n', name: 'Одно число' },
        { in: '-5\n', name: 'Одно отрицательное' },
        { in: '5-3\n', name: 'Минус как знак второго числа' },
        { in: '--8 - 2\n', name: 'Минусы без цифр' },
        { in: '1000000000,1000000000,1000000000\n', name: 'Большая сумма' },
        { in: 'a1b2c3d4e5\n', name: 'Буквы между цифрами' },
        { in: '007 and 0\n', name: 'Ведущие нули' },
        { in: 'x=-1000000000;y=-1000000000\n', name: 'Отрицательные пределы' },
        { in: '\n', name: 'Пустая строка' },
      ],
    },
    {
      title: 'Сортировка указателей',
      description: `
Прочитайте \`n\` слов. Напечатайте их, отсортированные по **длине**, а при равной длине — по алфавиту (\`strcmp\`), каждое слово на отдельной строке.

Слова храните в массиве \`char words[50][21]\` и не перемещайте их: сортируйте массив указателей \`const char *order[50]\`, где \`order[i]\` вначале указывает на \`words[i]\`.`,
      constraints: ['1 ≤ n ≤ 50.', 'Слова — из строчных латинских букв, длиной от 1 до 20.'],
      hints: [
        'Заполнение: for (int i = 0; i < n; i++) { scanf("%20s", words[i]); order[i] = words[i]; }',
        'Функция сравнения двух указателей: сначала strlen, при равенстве — strcmp.',
        'Сортировка вставками по order: сдвигаются только указатели, words остаётся нетронутым.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int before(const char *a, const char *b) {
    size_t la = strlen(a), lb = strlen(b);
    if (la != lb) {
        return la < lb;
    }
    return strcmp(a, b) < 0;
}

int main(void) {
    int n;
    scanf("%d", &n);
    char words[50][21];
    const char *order[50];
    for (int i = 0; i < n; i++) {
        scanf("%20s", words[i]);
        order[i] = words[i];
    }
    for (int i = 1; i < n; i++) {
        const char *current = order[i];
        int j = i - 1;
        while (j >= 0 && before(current, order[j])) {
            order[j + 1] = order[j];
            j--;
        }
        order[j + 1] = current;
    }
    for (int i = 0; i < n; i++) {
        printf("%s\n", order[i]);
    }
    return 0;
}`,
      explanation: `
Перестановка двух указателей — копирование 8 байтов, а перестановка самих слов потребовала бы копирования до 21 байта и вспомогательного буфера. Для больших записей разница огромна: так сортируют, например, массивы структур по разным ключам, не трогая сами данные.

Исходный массив \`words\` остаётся в порядке ввода. Можно держать несколько массивов указателей — по алфавиту, по длине — на одни и те же данные.`,
      examples: [
        { in: '4\npear apple fig plum\n', out: 'fig\npear\nplum\napple\n' },
        { in: '1\nsolo\n', out: 'solo\n' },
      ],
      hidden: [
        { in: '3\nccc bb a\n', name: 'Обратный порядок длин' },
        { in: '3\nab aa ac\n', name: 'Одинаковая длина' },
        { in: '4\nx x y x\n', name: 'Повторы' },
        { in: '2\nabcdefghijklmnopqrst a\n', name: 'Максимальная длина' },
        { in: '5\nkiwi date lime fig plum\n', name: 'Смешанные' },
        { in: '6\nb a d c f e\n', name: 'Однобуквенные' },
        { in: '3\nzz zzz z\n', name: 'Префиксы' },
        { in: '4\napple apply ample maple\n', name: 'Похожие слова' },
      ],
    },
    {
      title: 'Массив через выходной параметр',
      difficulty: 'advanced',
      description: `
Реализуйте функцию

\`\`\`c
int read_array(int **out, int *length);
\`\`\`

Она читает число \`n\`, затем \`n\` целых чисел, выделяет под них блок и записывает его адрес в \`*out\`, а \`n\` — в \`*length\`. Возвращает 0 при успехе и −1 при ошибке ввода: \`n\` не прочиталось, \`n < 0\`, \`n > 100000\` или чисел меньше \`n\`.

Требования:
- при ошибке \`*out\` остаётся \`NULL\`, и вся выделенная память освобождена;
- при \`n = 0\` память не выделяется: \`*out = NULL\`, \`*length = 0\`, результат 0.

Функция \`main\` дана: печатает \`error\`, \`empty\` или \`sum=S max=M\` и освобождает массив.`,
      constraints: ['Числа по модулю ≤ 10⁹.'],
      hints: [
        'Проверка n: if (scanf("%d", &n) != 1 || n < 0 || n > 100000) return -1;',
        'Ошибка в середине чтения: блок уже выделен — free(block); return -1; иначе LeakSanitizer найдёт утечку.',
        'В *out записывайте только в самом конце, когда всё прочитано успешно.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

int read_array(int **out, int *length) {
    // Прочитайте n и n чисел в новый блок.
    return -1;
}

int main(void) {
    int *a = NULL;
    int n = 0;
    if (read_array(&a, &n) != 0) {
        printf("error\n");
        return 0;
    }
    if (n == 0) {
        printf("empty\n");
    } else {
        long long sum = 0;
        int max = a[0];
        for (int i = 0; i < n; i++) {
            sum += a[i];
            if (a[i] > max) {
                max = a[i];
            }
        }
        printf("sum=%lld max=%d\n", sum, max);
    }
    free(a);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int read_array(int **out, int *length) {
    int n;
    if (scanf("%d", &n) != 1 || n < 0 || n > 100000) {
        return -1;
    }
    if (n == 0) {
        *out = NULL;
        *length = 0;
        return 0;
    }
    int *block = malloc((size_t)n * sizeof *block);
    if (block == NULL) {
        return -1;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &block[i]) != 1) {
            free(block);
            return -1;
        }
    }
    *out = block;
    *length = n;
    return 0;
}

int main(void) {
    int *a = NULL;
    int n = 0;
    if (read_array(&a, &n) != 0) {
        printf("error\n");
        return 0;
    }
    if (n == 0) {
        printf("empty\n");
    } else {
        long long sum = 0;
        int max = a[0];
        for (int i = 0; i < n; i++) {
            sum += a[i];
            if (a[i] > max) {
                max = a[i];
            }
        }
        printf("sum=%lld max=%d\n", sum, max);
    }
    free(a);
    return 0;
}`,
      explanation: `
Функция пишет в выходные параметры только при полном успехе. Пока чтение не закончено, блок принадлежит ей самой — и на каждой ветке ошибки она обязана его освободить. Вызывающий код получает простой договор: вернулся 0 — я владею \`*out\` и освобожу его; вернулось −1 — освобождать нечего.

Для \`n = 0\` решение не вызывает \`malloc(0)\`: результат такого вызова зависит от реализации (\`NULL\` или особый указатель). Пустой массив проще описать парой \`NULL\` и длина 0 — и \`free(NULL)\` в \`main\` корректно ничего не делает.`,
      examples: [
        { in: '3\n4 -2 7\n', out: 'sum=9 max=7\n' },
        {
          in: '3\n1 2\n',
          out: 'error\n',
          why: 'Чисел меньше, чем обещано: блок нужно освободить.',
        },
      ],
      hidden: [
        { in: '0\n', name: 'Пустой массив' },
        { in: '-1\n', name: 'Отрицательное n' },
        { in: '\n', name: 'Нет n' },
        { in: '100001\n', name: 'Слишком большое n' },
        { in: '1\n-1000000000\n', name: 'Одно число' },
        { in: '4\n1 x 3 4\n', name: 'Мусор в середине' },
        {
          in: '5\n1000000000 1000000000 1000000000 1000000000 1000000000\n',
          name: 'Большая сумма',
        },
        { in: '2\n5\n', name: 'Не хватает одного числа' },
      ],
    },
  ],
};
