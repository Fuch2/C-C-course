const numbers = (count, f) => Array.from({ length: count }, (_, i) => f(i)).join(' ');

const VEC = String.raw`
struct IntVec {
    int *data;
    size_t length;
    size_t capacity;
};

void vec_init(struct IntVec *v) {
    v->data = NULL;
    v->length = 0;
    v->capacity = 0;
}

int vec_reserve(struct IntVec *v, size_t min_capacity) {
    if (min_capacity <= v->capacity) {
        return 0;
    }
    size_t capacity = v->capacity ? v->capacity : 4;
    while (capacity < min_capacity) {
        capacity *= 2;
    }
    int *bigger = realloc(v->data, capacity * sizeof *bigger);
    if (bigger == NULL) {
        return -1;
    }
    v->data = bigger;
    v->capacity = capacity;
    return 0;
}

int vec_push(struct IntVec *v, int value) {
    if (vec_reserve(v, v->length + 1) != 0) {
        return -1;
    }
    v->data[v->length++] = value;
    return 0;
}

void vec_free(struct IntVec *v) {
    free(v->data);
    vec_init(v);
}`;

export default {
  id: 'memory-dynamic-arrays',
  title: 'Динамический массив',
  description:
    'Вектор как структура данных: указатель, длина и ёмкость, инварианты, функции reserve, push, insert, get и shrink, сложность операций и опасность поверхностной копии структуры.',
  moduleId: 'memory-pointers',
  order: 15,
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  prerequisites: ['memory-free'],
  objectives: [
    'Описывать динамический массив структурой с длиной и ёмкостью и формулировать его инварианты',
    'Реализовывать операции reserve, push, insert, удаление и сжатие с сохранением инвариантов',
    'Оценивать сложность операций вектора',
    'Отличать поверхностную копию структуры от глубокого копирования данных',
  ],
  tags: ['C23', 'Память', 'Динамический массив', 'Вектор', 'Инварианты'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Вектор начинается пустым, ёмкость при первом росте — 4, затем удваивается. Какой будет ёмкость после добавления 9 элементов?',
      answers: ['16'],
      placeholder: 'Ёмкость',
      explain: '4 → 8 при пятом элементе → 16 при девятом.',
    },
    {
      q: 'Какие условия — инварианты динамического массива из урока? Выберите все.',
      options: [
        'length ≤ capacity',
        'data == NULL тогда и только тогда, когда capacity == 0',
        'Элементы data[0 … length − 1] инициализированы',
        'capacity всегда степень двойки',
        'length > 0',
      ],
      correct: [0, 1, 2],
      explain:
        'Ёмкость после сжатия может быть любой, а пустой вектор (length = 0) — нормальное состояние.',
    },
    {
      q: 'Почему vec_get проверяет index < length, а не index < capacity?',
      options: [
        'Элементы между length и capacity не инициализированы',
        'capacity может быть равна нулю',
        'Так быстрее',
        'capacity хранится в байтах',
      ],
      correct: 0,
      explain: 'Ёмкость — запас памяти. Корректные данные только в первых length элементах.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct Vec {
    int data[8];
    int length;
};

void remove_at(struct Vec *v, int index) {
    for (int i = index; i + 1 < v->length; i++) {
        v->data[i] = v->data[i + 1];
    }
    v->length--;
}

int main(void) {
    struct Vec v = {{4, 8, 15, 16, 23, 42}, 6};
    remove_at(&v, 1);
    remove_at(&v, 3);
    for (int i = 0; i < v.length; i++) {
        printf("%d ", v.data[i]);
    }
    printf("\n");
    return 0;
}`,
      answers: ['4 15 16 42'],
      placeholder: 'Вывод программы',
      explain:
        'После удаления индекса 1: 4 15 16 23 42. После удаления индекса 3 (значение 23): 4 15 16 42.',
    },
    {
      q: 'Какая сложность у добавления элемента в конец вектора с удвоением ёмкости?',
      options: ['O(1) амортизированно', 'O(n) всегда', 'O(log n)', 'O(n²)'],
      correct: 0,
      explain:
        'Большинство добавлений — запись одного элемента; редкие realloc в сумме копируют не больше 2n элементов.',
    },
    {
      q: 'Что произойдёт при struct IntVec b = a; (оба потом освобождаются через vec_free)?',
      options: [
        'Оба указывают на один блок — второй vec_free освободит его повторно',
        'Данные скопируются в новый блок',
        'Компилятор запретит копирование структуры с указателем',
        'b получит пустой вектор',
      ],
      correct: 0,
      explain:
        'Присваивание копирует поля, включая адрес. Для независимой копии нужна функция глубокого копирования.',
    },
    {
      q: 'Почему vec_shrink освобождает блок через free, когда length == 0, вместо realloc(data, 0)?',
      options: [
        'realloc(p, 0) зависит от реализации, а инвариант требует data == NULL при capacity == 0',
        'realloc не умеет уменьшать блок',
        'free быстрее realloc',
        'Так требует компилятор',
      ],
      correct: 0,
      explain: 'free и обнуление указателя дают однозначное пустое состояние.',
    },
  ],
  exercises: [
    {
      title: 'Стек команд',
      difficulty: 'beginner',
      description: `
Реализуйте стек целых чисел на динамическом массиве и обработайте команды до конца ввода:
- \`push x\` — положить число;
- \`pop\` — снять верхнее число и напечатать его;
- \`top\` — напечатать верхнее число, не снимая;
- \`size\` — напечатать количество элементов.

Для \`pop\` и \`top\` на пустом стеке печатайте \`empty\`.`,
      constraints: ['Команд — до 2000.', '|x| ≤ 10⁹.'],
      hints: [
        'Возьмите из урока struct IntVec, vec_reserve и vec_push. pop — это v.data[--v.length] при v.length > 0.',
        'Команду читайте строкой: char cmd[8]; while (scanf("%7s", cmd) == 1) { … }',
        'В конце — vec_free(&v).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${VEC}

int main(void) {
    struct IntVec v;
    vec_init(&v);
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "push") == 0) {
            int x;
            scanf("%d", &x);
            if (vec_push(&v, x) != 0) {
                vec_free(&v);
                return 1;
            }
        } else if (strcmp(cmd, "pop") == 0 || strcmp(cmd, "top") == 0) {
            if (v.length == 0) {
                printf("empty\n");
            } else if (cmd[0] == 'p') {
                printf("%d\n", v.data[--v.length]);
            } else {
                printf("%d\n", v.data[v.length - 1]);
            }
        } else {
            printf("%zu\n", v.length);
        }
    }
    vec_free(&v);
    return 0;
}`,
      explanation: `
Стек на векторе: вершина — последний занятый элемент \`data[length − 1]\`. \`push\` добавляет в конец (амортизированно O(1)), \`pop\` уменьшает длину — блок при этом не сжимается, место пригодится следующему \`push\`.

Проверка \`length == 0\` перед \`pop\` и \`top\` обязательна: \`data[−1]\` — чтение за началом блока, а при пустом векторе \`data\` вообще равен \`NULL\`.`,
      examples: [
        { in: 'push 1\npush 2\ntop\npop\npop\npop\nsize\n', out: '2\n2\n1\nempty\n0\n' },
        { in: 'size\n', out: '0\n' },
      ],
      hidden: [
        { in: 'top\n', name: 'top на пустом' },
        { in: 'push -1000000000\npush 1000000000\npop\npop\n', name: 'Крайние значения' },
        {
          in: `${Array.from({ length: 100 }, (_, i) => `push ${i}`).join('\n')}\nsize\ntop\n`,
          name: 'Сто элементов',
        },
        { in: 'push 5\npop\npush 6\npop\npush 7\ntop\nsize\n', name: 'Чередование' },
        { in: 'pop\npop\npush 1\nsize\n', name: 'Несколько pop из пустого' },
        { in: 'push 3\npush 3\npush 3\nsize\npop\nsize\n', name: 'Одинаковые' },
        {
          in: `${Array.from({ length: 600 }, (_, i) => `push ${i * 3}`).join('\n')}\n${'pop\n'.repeat(5)}size\n`,
          name: 'Шестьсот элементов',
        },
        { in: 'push 0\ntop\ntop\nsize\n', name: 'Повторный top' },
      ],
    },
    {
      title: 'Фильтр на месте',
      description: `
Прочитайте \`k\`, затем числа до конца ввода в вектор. Удалите все числа, делящиеся на \`k\`, **за один проход** без вспомогательного массива, затем сожмите ёмкость до длины (для пустого вектора — освободите блок).

Напечатайте \`length=L capacity=C\`, а на следующей строке — оставшиеся числа через пробел (если они есть).`,
      constraints: ['1 ≤ k ≤ 1000.', 'Чисел — до 2000.', '|x| ≤ 10⁹.'],
      hints: [
        'Два индекса: read идёт по всем элементам, write — позиция для следующего сохранённого. if (data[read] % k != 0) data[write++] = data[read]; в конце length = write.',
        'Сжатие: при length == 0 — free и data = NULL, capacity = 0; иначе realloc до length элементов через временную переменную.',
        'Ёмкость при росте — 4, 8, 16, … как в уроке; после сжатия она равна длине.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${VEC}

int vec_shrink(struct IntVec *v) {
    if (v->length == 0) {
        free(v->data);
        v->data = NULL;
        v->capacity = 0;
        return 0;
    }
    int *smaller = realloc(v->data, v->length * sizeof *smaller);
    if (smaller == NULL) {
        return -1;
    }
    v->data = smaller;
    v->capacity = v->length;
    return 0;
}

int main(void) {
    int k;
    scanf("%d", &k);
    struct IntVec v;
    vec_init(&v);
    int x;
    while (scanf("%d", &x) == 1) {
        if (vec_push(&v, x) != 0) {
            vec_free(&v);
            return 1;
        }
    }
    size_t write = 0;
    for (size_t read = 0; read < v.length; read++) {
        if (v.data[read] % k != 0) {
            v.data[write++] = v.data[read];
        }
    }
    v.length = write;
    if (vec_shrink(&v) != 0) {
        vec_free(&v);
        return 1;
    }
    printf("length=%zu capacity=%zu\n", v.length, v.capacity);
    for (size_t i = 0; i < v.length; i++) {
        printf(i + 1 < v.length ? "%d " : "%d\n", v.data[i]);
    }
    vec_free(&v);
    return 0;
}`,
      explanation: `
Удаление по одному элементу через \`memmove\` стоило бы O(n) на каждое удаление и O(n²) в худшем случае. Два индекса решают задачу за один проход: \`write\` никогда не обгоняет \`read\`, поэтому сохраняемый элемент копируется только туда, где данные уже прочитаны.

Сжатие соблюдает инвариант: пустой вектор освобождает блок и получает \`data = NULL\`, \`capacity = 0\`, а не вызывает \`realloc(p, 0)\` с поведением, зависящим от реализации.`,
      examples: [
        { in: '3\n1 3 4 6 7 9\n', out: 'length=3 capacity=3\n1 4 7\n' },
        { in: '1\n5 6 7\n', out: 'length=0 capacity=0\n' },
      ],
      hidden: [
        { in: '2\n1 3 5 7\n', name: 'Ничего не удаляется' },
        { in: '5\n', name: 'Пустой ввод чисел' },
        { in: '2\n-4 -3 0 3 4\n', name: 'Отрицательные и ноль' },
        { in: '1000\n1000000000 -1000000000 999\n', name: 'Крайние значения' },
        { in: `7\n${numbers(2000, (i) => i)}\n`, name: 'Две тысячи чисел' },
        { in: '3\n3 6 9 12\n', name: 'Удаляется всё' },
        { in: '4\n4 1 4 2 4 3 4\n', name: 'Чередование' },
        { in: '10\n11 20 31 40 51\n', name: 'Через один' },
      ],
    },
    {
      title: 'Отсортированная вставка',
      description: `
Читайте числа до конца ввода и вставляйте каждое в вектор так, чтобы он всё время оставался отсортированным по неубыванию (новое число ставится **после** равных ему). Используйте вставку со сдвигом хвоста \`memmove\`.

Напечатайте итоговую ёмкость в формате \`capacity=C\` (рост: 4, 8, 16, …), затем элементы через пробел. Если чисел нет — только \`capacity=0\`.`,
      constraints: ['Чисел — до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'Позиция вставки — первый элемент, строго больший x: while (pos < v.length && v.data[pos] <= x) pos++;',
        'Сдвиг: memmove(v.data + pos + 1, v.data + pos, (v.length - pos) * sizeof *v.data); — после vec_reserve(&v, v.length + 1).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${VEC}

int vec_insert(struct IntVec *v, size_t index, int value) {
    if (index > v->length || vec_reserve(v, v->length + 1) != 0) {
        return -1;
    }
    memmove(v->data + index + 1, v->data + index, (v->length - index) * sizeof *v->data);
    v->data[index] = value;
    v->length++;
    return 0;
}

int main(void) {
    struct IntVec v;
    vec_init(&v);
    int x;
    while (scanf("%d", &x) == 1) {
        size_t pos = 0;
        while (pos < v.length && v.data[pos] <= x) {
            pos++;
        }
        if (vec_insert(&v, pos, x) != 0) {
            vec_free(&v);
            return 1;
        }
    }
    printf("capacity=%zu\n", v.capacity);
    for (size_t i = 0; i < v.length; i++) {
        printf(i + 1 < v.length ? "%d " : "%d\n", v.data[i]);
    }
    vec_free(&v);
    return 0;
}`,
      explanation: `
Каждая вставка находит позицию и сдвигает хвост на одну ячейку вправо — это сортировка вставками на векторе, O(n²) в худшем случае. Условие \`<=\` ставит новое число после равных, сохраняя порядок их поступления.

\`vec_reserve\` вызывается **до** \`memmove\`: при сдвиге последний элемент переезжает в позицию \`length\`, которая должна уже существовать в блоке. Если сначала сдвинуть, а потом расширить, запись выйдет за границу.`,
      examples: [
        { in: '5 1 4 1 3\n', out: 'capacity=8\n1 1 3 4 5\n' },
        { in: '', out: 'capacity=0\n' },
      ],
      hidden: [
        { in: '7\n', name: 'Одно число' },
        { in: '1 2 3 4\n', name: 'Уже отсортировано' },
        { in: '4 3 2 1\n', name: 'Обратный порядок' },
        { in: '2 2 2 2 2\n', name: 'Равные' },
        { in: '1000000000 -1000000000 0\n', name: 'Крайние значения' },
        { in: `${numbers(1000, (i) => ((i * 7919) % 1009) - 500)}\n`, name: 'Тысяча чисел' },
        { in: `${numbers(17, (i) => 17 - i)}\n`, name: 'Ёмкость 32' },
        { in: '3 -1 3 -1 3\n', name: 'Повторы' },
      ],
    },
    {
      title: 'Найди ошибку: копия вектора',
      difficulty: 'advanced',
      bug: true,
      description: `
Программа читает числа до конца ввода в вектор \`v\` и сохраняет «снимок» вектора после первых трёх чисел. В конце она печатает снимок и полный вектор. На коротком вводе всё работает, а на длинном печатается мусор и AddressSanitizer сообщает \`heap-use-after-free\`.

Исправьте программу: снимок должен быть независимой копией. Напишите функцию глубокого копирования \`int vec_clone(struct IntVec *dst, const struct IntVec *src)\` и освободите оба вектора.`,
      constraints: ['Чисел — от 3 до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'struct IntVec snapshot = v; копирует указатель data. Что станет со снимком, когда vec_push вызовет realloc?',
        'vec_clone: vec_init(dst); vec_reserve(dst, src->length); memcpy(dst->data, src->data, src->length * sizeof *src->data); dst->length = src->length;',
        'В конце нужно vec_free для обоих векторов — у каждого свой блок.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${VEC}

void print_vec(const struct IntVec *v) {
    for (size_t i = 0; i < v->length; i++) {
        printf(i + 1 < v->length ? "%d " : "%d\n", v->data[i]);
    }
}

int main(void) {
    struct IntVec v, snapshot;
    vec_init(&v);
    vec_init(&snapshot);
    int x;
    while (scanf("%d", &x) == 1) {
        if (vec_push(&v, x) != 0) {
            vec_free(&v);
            return 1;
        }
        if (v.length == 3) {
            snapshot = v;
        }
    }
    print_vec(&snapshot);
    print_vec(&v);
    vec_free(&v);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
${VEC}

int vec_clone(struct IntVec *dst, const struct IntVec *src) {
    vec_init(dst);
    if (vec_reserve(dst, src->length) != 0) {
        return -1;
    }
    if (src->length > 0) {
        memcpy(dst->data, src->data, src->length * sizeof *src->data);
    }
    dst->length = src->length;
    return 0;
}

void print_vec(const struct IntVec *v) {
    for (size_t i = 0; i < v->length; i++) {
        printf(i + 1 < v->length ? "%d " : "%d\n", v->data[i]);
    }
}

int main(void) {
    struct IntVec v, snapshot;
    vec_init(&v);
    vec_init(&snapshot);
    int x;
    while (scanf("%d", &x) == 1) {
        if (vec_push(&v, x) != 0) {
            vec_free(&v);
            vec_free(&snapshot);
            return 1;
        }
        if (v.length == 3 && vec_clone(&snapshot, &v) != 0) {
            vec_free(&v);
            return 1;
        }
    }
    print_vec(&snapshot);
    print_vec(&v);
    vec_free(&v);
    vec_free(&snapshot);
    return 0;
}`,
      explanation: `
\`snapshot = v\` копирует три поля, и оба вектора начинают делить один блок. Пока \`v\` не растёт, снимок даже выглядит правильным. Но пятый \`push\` вызывает \`realloc\`: блок переезжает, старый освобождается — и \`snapshot.data\` становится висячим. Печать снимка читает освобождённую память.

Глубокая копия выделяет **собственный** блок и копирует в него элементы. Теперь у каждого вектора свой владелец и свой \`vec_free\`. Это та же проблема, которую в C++ решают конструктор копирования и «правило трёх».`,
      examples: [
        { in: '1 2 3 4 5\n', out: '1 2 3\n1 2 3 4 5\n' },
        { in: '7 8 9\n', out: '7 8 9\n7 8 9\n' },
      ],
      hidden: [
        { in: '1 2 3 4\n', name: 'Ровно начальная ёмкость' },
        { in: '-1 -2 -3 -4 -5 -6 -7 -8 -9\n', name: 'Отрицательные' },
        { in: `${numbers(1000, (i) => i * 2)}\n`, name: 'Тысяча чисел' },
        { in: '1000000000 -1000000000 0 5\n', name: 'Крайние значения' },
        { in: '5 5 5 5 5 5\n', name: 'Одинаковые' },
        { in: '3 2 1 0 -1 -2 -3 -4 -5 -6 -7 -8 -9 -10 -11 -12 -13\n', name: 'Несколько переездов' },
        { in: '10 20 30\n', name: 'Ровно три' },
        { in: '1 1 2 3 5 8 13 21\n', name: 'Фибоначчи' },
      ],
    },
  ],
};
