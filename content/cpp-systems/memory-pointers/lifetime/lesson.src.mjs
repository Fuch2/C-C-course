export default {
  id: 'memory-lifetime',
  title: 'Время жизни объектов',
  description:
    'Область видимости и время жизни, висячий указатель на переменную блока, почему нельзя вернуть адрес локальной переменной и четыре правильных способа вернуть данные из функции.',
  moduleId: 'memory-pointers',
  order: 5,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-heap'],
  objectives: [
    'Различать область видимости и время жизни объекта',
    'Находить указатели, которые переживают объект',
    'Возвращать данные из функции значением, через буфер вызывающего, static-буфер или кучу',
    'Объяснять ограничения функций, возвращающих общий статический буфер',
  ],
  tags: ['C23', 'Память', 'Время жизни', 'Висячий указатель', 'Область видимости'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие объекты существуют всё время работы программы, но видны по имени только внутри одной функции?',
      options: [
        'static-переменные, объявленные внутри функции',
        'Глобальные переменные',
        'Параметры функции',
        'Блоки из malloc',
      ],
      correct: 0,
      explain:
        'Их область видимости — тело функции, а время жизни — вся программа. Глобальные видны во всём файле, параметры живут один вызов.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

const char *label(int code) {
    static char buf[8];
    snprintf(buf, sizeof buf, "E%d", code);
    return buf;
}

int main(void) {
    const char *first = label(1);
    const char *second = label(42);
    printf("%s %s\n", first, second);
    return 0;
}`,
      answers: ['E42 E42'],
      placeholder: 'Вывод программы',
      explain:
        'Оба указателя указывают на один и тот же static-буфер, который второй вызов перезаписал строкой E42.',
    },
    {
      q: 'В каких фрагментах указатель переживает объект, на который указывает? Выберите все.',
      options: [
        'int *f(void) { int x = 1; return &x; }',
        'int *p; { int y = 2; p = &y; } *p = 3;',
        'int *g(void) { static int z = 0; return &z; }',
        'int *h(void) { int *q = malloc(sizeof *q); return q; }',
      ],
      correct: [0, 1],
      explain:
        'x и y — автоматические объекты, они исчезают раньше указателя. static z живёт всю программу, блок из malloc — до free.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct Pair {
    int a;
    int b;
};

struct Pair swap_pair(struct Pair p) {
    struct Pair r = {p.b, p.a};
    return r;
}

int main(void) {
    struct Pair p = {1, 2};
    struct Pair q = swap_pair(p);
    printf("%d %d %d %d\n", p.a, p.b, q.a, q.b);
    return 0;
}`,
      answers: ['1 2 2 1'],
      placeholder: 'Вывод программы',
      explain:
        'Структура передаётся и возвращается копией. Исходная p не меняется, q получает копию локальной r.',
    },
    {
      q: 'Почему программа с висячим указателем часто выводит «правильное» значение без санитайзеров?',
      options: [
        'Байты умершего объекта ещё не перезаписаны, но обращение к ним всё равно неопределённое поведение',
        'Компилятор продлевает жизнь переменной, если на неё есть указатель',
        'Висячий указатель автоматически перенаправляется на копию',
        'Это означает, что ошибки на самом деле нет',
      ],
      correct: 0,
      explain:
        'Память на стеке не очищается при выходе из блока. Как только там окажется кадр другого вызова, значение изменится.',
    },
    {
      q: 'Функция должна вернуть строку, длина которой становится известна только внутри неё. Какой способ подходит лучше всего?',
      options: [
        'Выделить блок в куче и вернуть его; освобождает вызывающий код',
        'Вернуть адрес локального массива char[1000]',
        'Вернуть адрес static-буфера фиксированного размера',
        'Вернуть строку значением, как структуру',
      ],
      correct: 0,
      explain:
        'Размер знает только функция, значит, и выделять должна она. Локальный массив умрёт, static-буфер ограничен и общий для всех вызовов, массив нельзя вернуть значением.',
    },
    {
      q: 'Сколько раз создаётся переменная value при выполнении цикла?',
      code: String.raw`
for (int i = 0; i < 5; i++) {
    int value = i * i;
    total += value;
}`,
      lang: 'c',
      answers: ['5'],
      placeholder: 'Число',
      explain:
        'Время жизни value — одна итерация: объект создаётся при входе в тело цикла и исчезает в его конце.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: адрес из завершившегося блока',
      bug: true,
      description: `
Программа читает \`n\` чисел и должна напечатать наибольшее. Автор решил хранить не само значение, а указатель на лучшее число. Программа выдаёт неверные ответы, а AddressSanitizer сообщает \`stack-use-after-scope\`.

Найдите, какой объект умирает раньше указателя, и исправьте программу.`,
      constraints: ['1 ≤ n ≤ 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'Где объявлена value и сколько она живёт? На следующей итерации best указывает на ту же ячейку — уже с новым числом.',
        'Храните значение, а не адрес: int best; и флаг «первое число» или инициализацию первым прочитанным числом.',
      ],
      starter: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int *best = NULL;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (best == NULL || value > *best) {
            best = &value;
        }
    }
    printf("%d\n", *best);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int best = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (i == 0 || value > best) {
            best = value;
        }
    }
    printf("%d\n", best);
    return 0;
}`,
      explanation: `
\`value\` объявлена в теле цикла: её время жизни — одна итерация. Указатель \`best\` объявлен снаружи и живёт дольше. На каждой следующей итерации новая \`value\` занимает ту же ячейку, поэтому \`*best\` показывает не прошлый максимум, а только что прочитанное число, — сравнение \`value > *best\` всегда ложно. После цикла \`value\` не существует вовсе, и чтение \`*best\` — неопределённое поведение.

Исправление — копировать **значение** в переменную, которая живёт столько, сколько нужно. Указатель полезен, когда нужно сослаться на долгоживущий объект (элемент массива), а не на временный.`,
      examples: [
        { in: '4\n3 9 2 5\n', out: '9\n' },
        { in: '1\n-7\n', out: '-7\n' },
      ],
      hidden: [
        { in: '3\n1 2 3\n', name: 'Максимум последний' },
        { in: '3\n3 2 1\n', name: 'Максимум первый' },
        { in: '4\n-5 -2 -9 -3\n', name: 'Все отрицательные' },
        { in: '2\n1000000000 -1000000000\n', name: 'Крайние значения' },
        { in: '5\n4 4 4 4 4\n', name: 'Все равны' },
        { in: '6\n1 8 3 8 2 7\n', name: 'Повторяющийся максимум' },
        { in: '2\n-1000000000 -999999999\n', name: 'Два отрицательных' },
        { in: '5\n0 -1 0 -1 0\n', name: 'Нули' },
      ],
    },
    {
      title: 'Буфер вызывающего',
      difficulty: 'beginner',
      description: `
Реализуйте функцию

\`\`\`c
void format_duration(int seconds, char out[16]);
\`\`\`

Она записывает в буфер \`out\`, созданный вызывающим кодом, длительность в формате \`ЧЧ:ММ:СС\` — каждое поле двумя цифрами с ведущим нулём. Функция \`main\` дана: она читает \`q\` значений и печатает результат для каждого.`,
      constraints: ['1 ≤ q ≤ 20.', '0 ≤ seconds ≤ 359 999 (до 99:59:59).'],
      hints: [
        'Часы — seconds / 3600, минуты — seconds / 60 % 60, секунды — seconds % 60.',
        'snprintf(out, 16, "%02d:%02d:%02d", h, m, s); — snprintf никогда не запишет больше 16 байтов.',
      ],
      starter: String.raw`
#include <stdio.h>

void format_duration(int seconds, char out[16]) {
    // Запишите строку в out.
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int seconds;
        scanf("%d", &seconds);
        char text[16];
        format_duration(seconds, text);
        printf("%s\n", text);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

void format_duration(int seconds, char out[16]) {
    int h = seconds / 3600;
    int m = seconds / 60 % 60;
    int s = seconds % 60;
    snprintf(out, 16, "%02d:%02d:%02d", h, m, s);
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int seconds;
        scanf("%d", &seconds);
        char text[16];
        format_duration(seconds, text);
        printf("%s\n", text);
    }
    return 0;
}`,
      explanation: `
Функция не владеет памятью для результата — она только заполняет буфер, который принадлежит \`main\`. Время жизни буфера полностью под контролем вызывающего кода: \`text\` живёт ровно одну итерацию цикла, и этого достаточно.

\`snprintf\` получает размер буфера и никогда не выйдет за его границу; результат всегда завершается \`'\\0'\`. Это стандартный приём для функций, которые «возвращают строку».`,
      examples: [
        { in: '2\n3725\n59\n', out: '01:02:05\n00:00:59\n' },
        { in: '1\n359999\n', out: '99:59:59\n' },
      ],
      hidden: [
        { in: '1\n0\n', name: 'Ноль' },
        { in: '1\n60\n', name: 'Ровно минута' },
        { in: '1\n3600\n', name: 'Ровно час' },
        { in: '1\n86399\n', name: 'Почти сутки' },
        { in: '1\n86400\n', name: 'Сутки' },
        { in: '3\n1 61 3661\n', name: 'Единицы в каждом поле' },
        { in: '2\n3599 7200\n', name: 'Переходы через час' },
        { in: '1\n45296\n', name: '12:34:56' },
      ],
    },
    {
      title: 'Результат-структура',
      description: `
Реализуйте функцию, которая возвращает сразу три величины — минимум, максимум и среднее — **одной структурой по значению**:

\`\`\`c
struct Stats {
    int min;
    int max;
    double mean;
};

struct Stats analyze(const int *values, int n);
\`\`\`

Ввод: \`n\` и \`n\` целых чисел. Выведите \`min max mean\`, среднее — с двумя знаками после запятой. Функция \`main\` дана.`,
      constraints: ['1 ≤ n ≤ 1000.', '|x| ≤ 10⁶.'],
      hints: [
        'Начните с первого элемента: struct Stats s = {values[0], values[0], 0.0};',
        'Сумму копите в long long, среднее — (double)sum / n.',
        'Возвращайте s значением: return s; — это копия, поэтому локальная переменная может исчезнуть без последствий.',
      ],
      starter: String.raw`
#include <stdio.h>

struct Stats {
    int min;
    int max;
    double mean;
};

struct Stats analyze(const int *values, int n) {
    struct Stats s = {0, 0, 0.0};
    // Заполните s.
    return s;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int values[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }
    struct Stats s = analyze(values, n);
    printf("%d %d %.2f\n", s.min, s.max, s.mean);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

struct Stats {
    int min;
    int max;
    double mean;
};

struct Stats analyze(const int *values, int n) {
    struct Stats s = {values[0], values[0], 0.0};
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        if (values[i] < s.min) {
            s.min = values[i];
        }
        if (values[i] > s.max) {
            s.max = values[i];
        }
        sum += values[i];
    }
    s.mean = (double)sum / n;
    return s;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int values[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }
    struct Stats s = analyze(values, n);
    printf("%d %d %.2f\n", s.min, s.max, s.mean);
    return 0;
}`,
      explanation: `
Возврат структуры значением — самый безопасный способ вернуть несколько величин: вызывающий код получает **копию**, и нет никаких вопросов о времени жизни. Три выходных параметра (\`int *min, int *max, double *mean\`) тоже сработали бы, но структура делает интерфейс короче и не позволяет перепутать порядок аргументов.

Минимум и максимум начинаются с первого элемента, а не с нуля: иначе для чисел \`5 7\` минимум оказался бы равен 0.`,
      examples: [
        { in: '5\n4 -2 9 0 3\n', out: '-2 9 2.80\n' },
        { in: '1\n7\n', out: '7 7 7.00\n' },
      ],
      hidden: [
        { in: '2\n5 7\n', name: 'Положительные' },
        { in: '3\n-3 -1 -2\n', name: 'Отрицательные' },
        { in: '4\n1000000 1000000 1000000 1000000\n', name: 'Большая сумма' },
        { in: '3\n-1000000 0 1000000\n', name: 'Симметрия' },
        { in: '3\n1 2 2\n', name: 'Периодическое среднее' },
        { in: '6\n9 9 9 1 1 1\n', name: 'Две группы' },
        { in: '2\n0 0\n', name: 'Нули' },
        { in: '5\n10 -10 20 -20 1\n', name: 'Смешанные' },
      ],
    },
    {
      title: 'Найди ошибку: общий статический буфер',
      bug: true,
      description: `
Функция \`to_binary\` написана верно: она возвращает двоичную запись числа во внутреннем \`static\`-буфере. Программа читает пары чисел \`a b\` и для каждой пары должна напечатать двоичные записи обоих чисел через пробел. Но печатается одно и то же число дважды.

Исправьте \`main\`, не меняя \`to_binary\`.`,
      constraints: ['1 ≤ q ≤ 10.', '0 ≤ a, b ≤ 10⁶.'],
      hints: [
        'Куда указывают left и right после второго вызова to_binary?',
        'Скопируйте первый результат в собственный массив до второго вызова: char left[32]; strcpy(left, to_binary(a)); — или напечатайте его сразу.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

const char *to_binary(unsigned x) {
    static char buffer[33];
    int pos = 32;
    buffer[pos] = '\0';
    do {
        buffer[--pos] = (char)('0' + x % 2);
        x /= 2;
    } while (x > 0);
    return buffer + pos;
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        unsigned a, b;
        scanf("%u %u", &a, &b);
        const char *left = to_binary(a);
        const char *right = to_binary(b);
        printf("%s %s\n", left, right);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

const char *to_binary(unsigned x) {
    static char buffer[33];
    int pos = 32;
    buffer[pos] = '\0';
    do {
        buffer[--pos] = (char)('0' + x % 2);
        x /= 2;
    } while (x > 0);
    return buffer + pos;
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        unsigned a, b;
        scanf("%u %u", &a, &b);
        char left[33];
        strcpy(left, to_binary(a));
        const char *right = to_binary(b);
        printf("%s %s\n", left, right);
    }
    return 0;
}`,
      explanation: `
\`to_binary\` пишет результат в один и тот же \`static\`-буфер и возвращает указатель внутрь него. После второго вызова буфер содержит запись \`b\`, а \`left\` указывает в тот же буфер — обе строки выглядят как \`b\` (или как хвост от неё, если записи разной длины).

Санитайзеры здесь молчат: буфер жив, границы не нарушены. Это логическая ошибка времени жизни **результата**: он действителен только до следующего вызова функции. Решение — скопировать результат в свою память, пока он ещё верен.`,
      examples: [
        { in: '1\n5 2\n', out: '101 10\n' },
        { in: '2\n0 1\n8 8\n', out: '0 1\n1000 1000\n' },
      ],
      hidden: [
        { in: '1\n1 0\n', name: 'Единица и ноль' },
        { in: '1\n255 256\n', name: 'Разная длина' },
        { in: '1\n1000000 3\n', name: 'Длинная и короткая' },
        { in: '1\n3 1000000\n', name: 'Короткая и длинная' },
        { in: '3\n7 6\n5 4\n3 2\n', name: 'Несколько пар' },
        { in: '1\n1023 512\n', name: 'Десять битов' },
        { in: '1\n0 0\n', name: 'Два нуля' },
        { in: '2\n12 10\n9 6\n', name: 'Одинаковая длина' },
      ],
    },
  ],
};
