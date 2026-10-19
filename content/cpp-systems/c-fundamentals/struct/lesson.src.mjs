const names = ['Anna', 'Boris', 'Vera', 'Gleb', 'Dina', 'Egor', 'Zoya', 'Ivan', 'Kira', 'Lev'];
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');

export default {
  id: 'c17-struct',
  title: 'Структуры',
  description:
    'Собственные типы из нескольких полей: объявление и инициализация struct, копирование, передача в функции по значению и через указатель, оператор ->, массивы и вложенные структуры.',
  moduleId: 'c-fundamentals',
  order: 42,
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  prerequisites: ['c17-pointer-arithmetic'],
  objectives: [
    'Описывать структуры и создавать переменные структурного типа',
    'Инициализировать структуры по порядку и по именам полей',
    'Понимать, что присваивание и передача по значению копируют структуру',
    'Изменять структуру в функции через указатель и оператор ->',
    'Хранить записи в массиве структур, искать и сортировать их',
  ],
  tags: ['C23', 'Структуры', 'Указатели'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void) {
    struct point a = {.y = 5};
    struct point b = a;
    b.x = 2;
    a.y = 9;
    printf("%d %d %d %d\n", a.x, a.y, b.x, b.y);
    return 0;
}`,
      answers: ['0 9 2 5'],
      placeholder: 'Вывод программы',
      explain:
        'Неуказанное поле a.x равно 0. b — копия a на момент присваивания, поэтому последующее a.y = 9 её не затрагивает.',
    },
    {
      q: 'Как обратиться к полю score, если s — указатель на struct student?',
      options: ['s->score', 's.score', '*s.score', '&s->score'],
      correct: 0,
      explain:
        'Стрелка — доступ к полю через указатель, то же что (*s).score. Запись *s.score означает *(s.score) и не компилируется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct counter {
    int value;
};

void inc_copy(struct counter c) {
    c.value++;
}

void inc_ptr(struct counter *c) {
    c->value++;
}

int main(void) {
    struct counter c = {10};
    inc_copy(c);
    inc_ptr(&c);
    inc_ptr(&c);
    printf("%d\n", c.value);
    return 0;
}`,
      answers: ['12'],
      placeholder: 'Вывод программы',
      explain: 'inc_copy меняет копию. Две функции с указателем увеличивают оригинал.',
    },
    {
      q: 'Какие операции со структурами одного типа разрешены в C? Выберите все.',
      options: [
        'Присваивание a = b',
        'Сравнение a == b',
        'Передача в функцию по значению',
        'Возврат из функции через return',
        'Сложение a + b',
      ],
      correct: [0, 2, 3],
      explain:
        'Структуры копируются целиком, но операторов сравнения и арифметики для них нет: такие функции пишут сами.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct point {
    int x;
    int y;
};

struct segment {
    struct point from;
    struct point to;
};

int main(void) {
    struct segment s = {{1, 2}, {7, 5}};
    struct segment *p = &s;
    p->to.x -= p->from.x;
    printf("%d %d\n", s.to.x, p->to.y - s.from.y);
    return 0;
}`,
      answers: ['6 3'],
      placeholder: 'Вывод программы',
      explain: 'p->to.x — поле x вложенной структуры to: 7 − 1 = 6. Вторая разность: 5 − 2 = 3.',
    },
    {
      q: 'Найдите ошибку.',
      code: String.raw`
struct item {
    char name[20];
    int price;
}

int main(void) {
    struct item it = {"pen", 30};
    return 0;
}`,
      options: [
        'После закрывающей скобки описания структуры нет точки с запятой',
        'Массив нельзя делать полем структуры',
        'Структуру нельзя инициализировать строкой',
        'Нужно писать item it, без слова struct',
      ],
      correct: 0,
      explain:
        'Описание структуры заканчивается на «};». Без точки с запятой компилятор сообщит об ошибке в следующей строке.',
    },
    {
      q: 'Студенты хранятся в массиве struct student group[30]. Какие записи передают в scanf адрес поля score третьего студента? Выберите все.',
      options: ['&group[2].score', '&(group + 2)->score', 'group[2].score', '&group.score[2]'],
      correct: [0, 1],
      explain:
        'group + 2 — указатель на третий элемент, поэтому (group + 2)->score — то же, что group[2].score. Без & передаётся значение, а не адрес.',
    },
    {
      q: 'Что напечатает sizeof для struct { char c; int x; } на x86-64?',
      options: ['8', '5', '4', '2'],
      correct: 0,
      explain:
        'После char добавляются три байта выравнивания, чтобы int начинался с адреса, кратного 4: 1 + 3 + 4 = 8.',
    },
    {
      q: 'Функция печатает данные большой структуры и не должна её менять. Какой параметр лучше?',
      options: [
        'const struct report *r',
        'struct report r',
        'struct report *r',
        'struct report r[]',
      ],
      correct: 0,
      explain:
        'Указатель не копирует всю структуру, а const гарантирует, что функция её не изменит. Передача по значению тоже безопасна, но копирует все поля.',
    },
  ],
  exercises: [
    {
      title: 'Перенос точки',
      description: `
Точка задана структурой \`struct point\` с полями \`x\` и \`y\`. Напишите функцию \`void translate(struct point *p, int dx, int dy)\`, которая сдвигает точку на месте.

\`main\` уже написан: он читает начальные координаты, затем число переносов \`k\` и \`k\` пар \`dx dy\`, применяет переносы и печатает итоговые координаты.`,
      constraints: ['|x|, |y| ≤ 10⁶; 0 ≤ k ≤ 1000; |dx|, |dy| ≤ 1000.'],
      hints: [
        'Через указатель поля доступны стрелкой: p->x += dx;',
        'В main функция вызывается с адресом: translate(&pt, dx, dy).',
      ],
      starter: String.raw`
#include <stdio.h>

struct point {
    int x;
    int y;
};

void translate(struct point *p, int dx, int dy) {
    // Сдвиньте точку на месте.
}

int main(void) {
    struct point pt;
    int k;
    scanf("%d %d %d", &pt.x, &pt.y, &k);
    for (int i = 0; i < k; i++) {
        int dx, dy;
        scanf("%d %d", &dx, &dy);
        translate(&pt, dx, dy);
    }
    printf("%d %d\n", pt.x, pt.y);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

struct point {
    int x;
    int y;
};

void translate(struct point *p, int dx, int dy) {
    p->x += dx;
    p->y += dy;
}

int main(void) {
    struct point pt;
    int k;
    scanf("%d %d %d", &pt.x, &pt.y, &k);
    for (int i = 0; i < k; i++) {
        int dx, dy;
        scanf("%d %d", &dx, &dy);
        translate(&pt, dx, dy);
    }
    printf("%d %d\n", pt.x, pt.y);
    return 0;
}`,
      explanation: `
Функция получает адрес структуры \`pt\` из \`main\`, поэтому \`p->x += dx\` меняет оригинал. Если бы параметр был \`struct point p\`, функция сдвигала бы копию, и после цикла координаты остались бы прежними.

\`scanf\` пишет прямо в поля структуры: \`&pt.x\` — адрес поля \`x\` переменной \`pt\` (точка связывает сильнее, чем \`&\`).

Самое большое значение координаты: 10⁶ + 1000 · 1000 = 2 · 10⁶ — помещается в \`int\`.`,
      examples: [
        { in: '2 3\n2\n4 -1\n1 1', out: '7 3\n' },
        { in: '0 0\n0', out: '0 0\n' },
      ],
      hidden: [
        '-5 5\n1\n5 -5',
        '1000000 -1000000\n3\n-1000 1000\n-1000 1000\n0 0',
        `0 0\n1000\n${lines(1000, () => '1000 -1000')}`,
        `10 20\n6\n${lines(6, (i) => `${i - 3} ${3 - i}`)}`,
        '-1000000 1000000\n2\n1000 -1000\n-1000 1000',
        '5 5\n1\n0 0',
      ],
    },
    {
      title: 'Самый горячий датчик',
      description: `
Даны показания \`n\` датчиков: идентификатор и температура. Сохраните их в массив структур \`struct measurement { int id; int temperature; }\`. Выведите идентификатор и температуру самого горячего датчика. Если таких несколько, выберите тот, что встретился первым.

**Ввод:** \`n\`, затем \`n\` строк \`id temperature\`.
**Вывод:** \`id temperature\`.`,
      constraints: ['1 ≤ n ≤ 100; 0 ≤ id ≤ 1000; −100 ≤ temperature ≤ 100.'],
      hints: [
        'Объявите массив struct measurement data[100] и читайте поля: scanf("%d %d", &data[i].id, &data[i].temperature).',
        'Храните указатель или индекс лучшего элемента. Строгое сравнение > сохранит первый из равных.',
      ],
      starter: String.raw`
#include <stdio.h>

struct measurement {
    int id;
    int temperature;
};

int main(void) {
    // Прочитайте показания в массив структур и найдите максимум.
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

struct measurement {
    int id;
    int temperature;
};

int main(void) {
    struct measurement data[100];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d %d", &data[i].id, &data[i].temperature);
    }
    const struct measurement *hottest = &data[0];
    for (int i = 1; i < n; i++) {
        if (data[i].temperature > hottest->temperature) {
            hottest = &data[i];
        }
    }
    printf("%d %d\n", hottest->id, hottest->temperature);
    return 0;
}`,
      explanation: `
Каждое показание — одна запись, поэтому идентификатор и температура не могут «разъехаться», как в двух параллельных массивах.

Указатель \`hottest\` хранит адрес лучшей записи, и ответ печатается через стрелку. Можно было хранить индекс или копию структуры — результат тот же, но указатель не копирует данные и позволяет при необходимости изменить найденную запись.

Начальное значение — первый элемент, а не температура 0: все показания могут быть отрицательными. Строгое \`>\` не заменяет найденный максимум равным, поэтому выбирается первый.`,
      examples: [
        { in: '3\n10 20\n11 30\n12 25', out: '11 30\n' },
        { in: '2\n7 5\n8 5', out: '7 5\n' },
      ],
      hidden: [
        '1\n0 -100',
        '4\n1 -5\n2 -3\n3 -3\n4 -10',
        '5\n100 0\n200 0\n300 1\n400 1\n500 0',
        '3\n1000 100\n999 -100\n0 100',
        `100\n${lines(100, (i) => `${i} ${((i * 37) % 201) - 100}`)}`,
        '2\n5 100\n6 100',
      ],
    },
    {
      title: 'Пересечение прямоугольников',
      description: `
Прямоугольник со сторонами, параллельными осям, задан левым нижним углом \`(x1, y1)\` и правым верхним \`(x2, y2)\`, где \`x1 < x2\` и \`y1 < y2\`. Опишите структуры \`struct point\` и \`struct rect\` (из двух точек) и напишите функцию \`long long intersection_area(struct rect a, struct rect b)\`.

Даны два прямоугольника. Выведите площадь их пересечения; если они не пересекаются или касаются только стороной или углом, выведите \`0\`.

**Ввод:** две строки \`x1 y1 x2 y2\`.`,
      constraints: ['Координаты по модулю не больше 10⁹.'],
      hints: [
        'Пересечение — тоже прямоугольник: его левая граница — максимум левых границ, правая — минимум правых. Аналогично по y.',
        'Если ширина или высота пересечения не положительна, площадь 0.',
        'Ширина и высота доходят до 2 · 10⁹, а площадь — до 4 · 10¹⁸: в int она не поместится. Вычисляйте ширину и высоту в long long.',
      ],
      solution: String.raw`
#include <stdio.h>

struct point {
    int x;
    int y;
};

struct rect {
    struct point min;
    struct point max;
};

int max_int(int a, int b) {
    return a > b ? a : b;
}

int min_int(int a, int b) {
    return a < b ? a : b;
}

long long intersection_area(struct rect a, struct rect b) {
    long long width = (long long)min_int(a.max.x, b.max.x) - max_int(a.min.x, b.min.x);
    long long height = (long long)min_int(a.max.y, b.max.y) - max_int(a.min.y, b.min.y);
    if (width <= 0 || height <= 0) {
        return 0;
    }
    return width * height;
}

int main(void) {
    struct rect a, b;
    scanf("%d %d %d %d", &a.min.x, &a.min.y, &a.max.x, &a.max.y);
    scanf("%d %d %d %d", &b.min.x, &b.min.y, &b.max.x, &b.max.y);
    printf("%lld\n", intersection_area(a, b));
    return 0;
}`,
      explanation: `
Точка лежит в обоих прямоугольниках, когда её \`x\` не меньше обеих левых границ и не больше обеих правых. Значит, пересечение по оси x — отрезок от \`max(левых)\` до \`min(правых)\`; если начало не меньше конца, пересечения нет. По оси y — так же.

Главная ловушка — переполнение. При координатах ±10⁹ ширина достигает 2 · 10⁹ — это почти предел \`int\` (\`INT_MAX\` ≈ 2.1 · 10⁹), а площадь 4 · 10¹⁸ в \`int\` не помещается вовсе. Приведение \`(long long)\` до вычитания заставляет считать ширину и высоту в 64 битах, и их произведение тоже вычисляется в \`long long\`. Если бы ширина и высота были \`int\`, произведение переполнилось бы раньше, чем результат попал в \`long long\`.

Вложенные структуры делают код читаемым: \`a.max.x\` прямо говорит «правая граница прямоугольника a».`,
      examples: [
        {
          in: '0 0 4 4\n2 2 6 5',
          out: '4\n',
          why: 'Пересечение — прямоугольник от (2, 2) до (4, 4).',
        },
        { in: '0 0 2 2\n2 0 4 2', out: '0\n', why: 'Прямоугольники касаются стороной.' },
      ],
      hidden: [
        '0 0 10 10\n2 3 5 7',
        '0 0 1 1\n5 5 6 6',
        '-5 -5 5 5\n-5 -5 5 5',
        '0 0 3 3\n3 3 6 6',
        '-1000000000 -1000000000 1000000000 1000000000\n-1000000000 -1000000000 1000000000 1000000000',
        '-1000000000 0 1000000000 1\n0 -1000000000 1 1000000000',
        '1 1 4 9\n-2 3 2 20',
        '0 0 5 5\n1 -3 2 10',
      ],
    },
    {
      title: 'Рейтинг',
      description: `
Даны \`n\` участников олимпиады: имя и количество баллов. Выведите их в порядке рейтинга: по убыванию баллов, а при равных баллах — по алфавиту имён (как сравнивает \`strcmp\`).

Храните участника в структуре с полями \`char name[21]\` и \`int score\`. Отсортируйте массив структур сортировкой выбором — переставляйте структуры целиком присваиванием.

**Ввод:** \`n\`, затем \`n\` строк \`имя баллы\`.
**Вывод:** \`n\` строк \`имя баллы\`.`,
      constraints: [
        '1 ≤ n ≤ 100; имена из латинских букв, длиной от 1 до 20, все различны; 0 ≤ баллы ≤ 1000.',
      ],
      hints: [
        'Напишите функцию int ranks_before(const struct participant *a, const struct participant *b): 1, если a должен стоять раньше b.',
        'Раньше стоит тот, у кого больше баллов; при равенстве — тот, у кого strcmp(a->name, b->name) < 0.',
        'Обмен структур: struct participant tmp = a[i]; a[i] = a[j]; a[j] = tmp; — массив name копируется вместе со структурой.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

struct participant {
    char name[21];
    int score;
};

int main(void) {
    // Прочитайте участников, отсортируйте и выведите.
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

struct participant {
    char name[21];
    int score;
};

int ranks_before(const struct participant *a, const struct participant *b) {
    if (a->score != b->score) {
        return a->score > b->score;
    }
    return strcmp(a->name, b->name) < 0;
}

int main(void) {
    struct participant list[100];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%20s %d", list[i].name, &list[i].score);
    }
    for (int i = 0; i < n - 1; i++) {
        int best = i;
        for (int j = i + 1; j < n; j++) {
            if (ranks_before(&list[j], &list[best])) {
                best = j;
            }
        }
        struct participant tmp = list[i];
        list[i] = list[best];
        list[best] = tmp;
    }
    for (int i = 0; i < n; i++) {
        printf("%s %d\n", list[i].name, list[i].score);
    }
    return 0;
}`,
      explanation: `
Правило порядка вынесено в функцию \`ranks_before\`: сортировка не знает, по каким полям сравнивать, она только спрашивает «кто должен стоять раньше». Чтобы поменять порядок рейтинга, достаточно изменить одну функцию.

Функция принимает \`const\`-указатели: структуры не копируются при каждом из ~n²/2 сравнений и гарантированно не меняются.

Обмен структур присваиванием копирует и \`score\`, и весь массив \`name\`. С параллельными массивами пришлось бы менять местами строки через \`strcpy\` и отдельно числа — структура избавляет от этого. Ширина \`%20s\` защищает массив из 21 символа от переполнения.`,
      examples: [
        {
          in: '4\nVera 80\nAnna 95\nBoris 80\nGleb 70',
          out: 'Anna 95\nBoris 80\nVera 80\nGleb 70\n',
        },
        { in: '1\nSolo 0', out: 'Solo 0\n' },
      ],
      hidden: [
        '3\nc 5\nb 5\na 5',
        '3\nlow 1\nmid 2\ntop 3',
        '5\nZed 1000\nAmy 0\nBob 1000\nabc 500\nABC 500',
        '2\nAbcdefghijklmnopqrst 7\nAbcdefghijklmnopqrs 7',
        `10\n${lines(10, (i) => `${names[i]} ${(i % 3) * 10}`)}`,
        `100\n${lines(100, (i) => `p${String.fromCharCode(97 + (i % 26))}${Math.floor(i / 26)} ${(i * 7) % 13}`)}`,
      ],
    },
  ],
};
