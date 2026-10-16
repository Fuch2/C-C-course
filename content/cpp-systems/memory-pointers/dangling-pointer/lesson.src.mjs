const PRICE_MAIN = String.raw`
int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int cents;
        scanf("%d", &cents);
        const char *text = format_price(cents);
        printf("%s\n", text);
    }
    return 0;
}`;

export default {
  id: 'memory-dangling-pointer',
  title: 'Висячие указатели',
  description:
    'Все источники висячих указателей: выход из блока, free, realloc, изменение контейнера и общий буфер. Указатели на живую, но чужую память, индексы и копии вместо ссылок, дескрипторы с поколением.',
  moduleId: 'memory-pointers',
  order: 17,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-memory-leak'],
  objectives: [
    'Перечислять источники висячих указателей и находить их в коде',
    'Объяснять, почему санитайзеры не замечают указатель на живую память с другим содержимым',
    'Заменять долгоживущие указатели индексами и копиями',
    'Реализовывать дескрипторы с поколением для ссылок на удаляемые объекты',
  ],
  tags: ['C17', 'Память', 'Висячий указатель', 'Время жизни', 'Найди ошибку'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'В каких случаях p становится висячим? Выберите все.',
      options: [
        'int *p = malloc(4); free(p);',
        'int *p; { int x = 1; p = &x; } — после закрывающей скобки',
        'int a[4]; int *p = &a[2]; a[2] = 7;',
        'int *p = &v.data[0]; vec_push(&v, 1); — push вызвал realloc',
        'static int s; int *p = &s; — после выхода из функции',
      ],
      correct: [0, 1, 3],
      explain:
        'Запись в a[2] не уничтожает элемент. Static-объект живёт всю программу. Остальные случаи завершают жизнь объекта или переносят его.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    const char *saved[3];
    char buffer[8];
    const char *words[] = {"one", "two", "six"};
    for (int i = 0; i < 3; i++) {
        snprintf(buffer, sizeof buffer, "%s", words[i]);
        saved[i] = buffer;
    }
    printf("%s %s %s\n", saved[0], saved[1], saved[2]);
    return 0;
}`,
      answers: ['six six six'],
      placeholder: 'Вывод программы',
      explain: 'Все элементы saved хранят адрес одного буфера, в котором осталось последнее слово.',
    },
    {
      q: 'Почему AddressSanitizer не обнаружит ошибку в этом коде?',
      code: String.raw`
int a[5] = {1, 2, 3, 4, 5};
int *last = &a[4];
memmove(&a[0], &a[1], 4 * sizeof a[0]);   // удалили a[0], длина стала 4
printf("%d\n", *last);`,
      lang: 'c',
      options: [
        'a[4] — законная живая память массива, хотя логически элемента там больше нет',
        'memmove отключает проверки',
        'Санитайзер проверяет только кучу',
        'Ошибки здесь нет',
      ],
      correct: 0,
      explain:
        'Санитайзер знает границы объектов, но не логическую длину контейнера. Указатель на «бывший» элемент — ошибка смысла, а не доступа к памяти.',
    },
    {
      q: 'Чем дескриптор «индекс + поколение» лучше простого указателя на ячейку хранилища?',
      options: [
        'Он позволяет обнаружить, что объект удалён, даже если ячейку занял новый объект',
        'Он занимает меньше памяти',
        'Он автоматически освобождает память',
        'Он быстрее разыменовывается',
      ],
      correct: 0,
      explain:
        'При удалении поколение ячейки растёт, и сравнение поколений показывает, что ссылка устарела.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct Slot {
    int value;
    unsigned gen;
};

int main(void) {
    struct Slot s = {10, 0};
    unsigned my_gen = s.gen;
    s.gen++;
    s.value = 20;
    printf("%s %d\n", s.gen == my_gen ? "valid" : "stale", s.value);
    return 0;
}`,
      answers: ['stale 20'],
      placeholder: 'Вывод программы',
      explain:
        'Поколение ячейки изменилось после удаления, поэтому сохранённая ссылка распознаётся как устаревшая.',
    },
    {
      q: 'Какой способ хранить «ссылку» на элемент растущего динамического массива надёжнее всего?',
      options: [
        'Индекс элемента',
        'Указатель на элемент',
        'Указатель на указатель data',
        'Копия поля capacity',
      ],
      correct: 0,
      explain:
        'Индекс остаётся верным после realloc: адрес всегда вычисляется от актуального data.',
    },
    {
      q: 'Функция возвращает адрес локального массива. Что из перечисленного верно? Выберите все.',
      code: String.raw`
const char *greet(void) {
    char text[] = "hello";
    return text;
}`,
      lang: 'c',
      options: [
        'Массив text перестаёт существовать при возврате из функции',
        'GCC предупреждает: function returns address of local variable',
        'Вызывающий код получит копию строки',
        'Исправление — return "hello"; (литерал статический)',
      ],
      correct: [0, 1, 3],
      explain:
        'Массивы не копируются при возврате — возвращается адрес. Литерал живёт всю программу, поэтому его адрес возвращать можно.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: общий буфер',
      difficulty: 'beginner',
      bug: true,
      description: `
Программа читает \`n\` студентов (имя и оценку) и печатает список тех, чья оценка не ниже средней. Вместо разных имён печатается одно и то же.

Найдите ошибку и исправьте программу так, чтобы каждая запись хранила своё имя.`,
      constraints: ['1 ≤ n ≤ 50.', 'Имена — до 31 латинской буквы.', '1 ≤ оценка ≤ 5.'],
      hints: [
        'Куда указывает поле name у каждой записи после цикла чтения?',
        'Храните строку внутри структуры: char name[32]; и копируйте strcpy(group[i].name, buffer); — либо делайте копию в куче и освобождайте её в конце.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

struct Student {
    const char *name;
    int grade;
};

int main(void) {
    int n;
    scanf("%d", &n);
    struct Student group[50];
    char buffer[32];
    int total = 0;
    for (int i = 0; i < n; i++) {
        scanf("%31s %d", buffer, &group[i].grade);
        group[i].name = buffer;
        total += group[i].grade;
    }
    for (int i = 0; i < n; i++) {
        if (group[i].grade * n >= total) {
            printf("%s %d\n", group[i].name, group[i].grade);
        }
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

struct Student {
    char name[32];
    int grade;
};

int main(void) {
    int n;
    scanf("%d", &n);
    struct Student group[50];
    char buffer[32];
    int total = 0;
    for (int i = 0; i < n; i++) {
        scanf("%31s %d", buffer, &group[i].grade);
        strcpy(group[i].name, buffer);
        total += group[i].grade;
    }
    for (int i = 0; i < n; i++) {
        if (group[i].grade * n >= total) {
            printf("%s %d\n", group[i].name, group[i].grade);
        }
    }
    return 0;
}`,
      explanation: `
Поле \`const char *name\` хранит **адрес**, и все записи получили один и тот же адрес — массива \`buffer\`. Буфер переписывается при каждом чтении, поэтому после цикла все имена «равны» последнему. Санитайзеры молчат: \`buffer\` жив, границы не нарушены.

Массив \`char name[32]\` внутри структуры делает каждую запись владельцем своей копии строки. Сравнение с средним выполнено в целых числах: \`grade * n >= total\` — то же, что \`grade >= total / n\`, но без деления и погрешностей.`,
      examples: [
        { in: '3\nann 5\nbob 3\ncid 4\n', out: 'ann 5\ncid 4\n' },
        { in: '1\nsolo 2\n', out: 'solo 2\n' },
      ],
      hidden: [
        { in: '2\nx 3\ny 3\n', name: 'Равные оценки' },
        { in: '4\na 1\nb 2\nc 3\nd 4\n', name: 'Возрастание' },
        { in: '4\nd 4\nc 3\nb 2\na 1\n', name: 'Убывание' },
        { in: '3\nverylongname 5\nshort 1\nmid 4\n', name: 'Разная длина имён' },
        { in: '5\na 5\nb 5\nc 5\nd 5\ne 1\n', name: 'Почти все выше среднего' },
        { in: '2\nabcdefghijklmnopqrstuvwxyzabcde 5\nz 1\n', name: 'Максимальная длина' },
        { in: '3\nsame 4\nsame 2\nsame 4\n', name: 'Одинаковые имена' },
        { in: '6\np 2\nq 3\nr 2\ns 3\nt 2\nu 3\n', name: 'Чередование' },
      ],
    },
    {
      title: 'Найди ошибку: выбранный элемент после удаления',
      bug: true,
      description: `
В массиве \`n\` товаров (название и цена). Программа выбирает **самый дорогой** товар (первый из самых дорогих), запоминает указатель на него, затем выполняет \`d\` удалений по индексам (удаление со сдвигом хвоста) и печатает выбранный товар и итоговое количество. Гарантируется, что выбранный товар не удаляется.

Иногда печатается не тот товар. Исправьте программу.`,
      constraints: [
        '1 ≤ n ≤ 50.',
        '0 ≤ d < n.',
        'Индексы удалений относятся к текущему (уже сдвинутому) массиву.',
      ],
      hints: [
        'Что происходит с элементом, на который указывает chosen, если удаляется товар левее него?',
        'Храните индекс выбранного товара; при удалении индекса меньше него уменьшайте его на 1.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

struct Product {
    char name[24];
    int price;
};

int main(void) {
    int n;
    scanf("%d", &n);
    struct Product items[50];
    for (int i = 0; i < n; i++) {
        scanf("%23s %d", items[i].name, &items[i].price);
    }
    struct Product *chosen = &items[0];
    for (int i = 1; i < n; i++) {
        if (items[i].price > chosen->price) {
            chosen = &items[i];
        }
    }
    int d;
    scanf("%d", &d);
    for (int k = 0; k < d; k++) {
        int index;
        scanf("%d", &index);
        memmove(&items[index], &items[index + 1], (size_t)(n - index - 1) * sizeof items[0]);
        n--;
    }
    printf("%s %d %d\n", chosen->name, chosen->price, n);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

struct Product {
    char name[24];
    int price;
};

int main(void) {
    int n;
    scanf("%d", &n);
    struct Product items[50];
    for (int i = 0; i < n; i++) {
        scanf("%23s %d", items[i].name, &items[i].price);
    }
    int chosen = 0;
    for (int i = 1; i < n; i++) {
        if (items[i].price > items[chosen].price) {
            chosen = i;
        }
    }
    int d;
    scanf("%d", &d);
    for (int k = 0; k < d; k++) {
        int index;
        scanf("%d", &index);
        memmove(&items[index], &items[index + 1], (size_t)(n - index - 1) * sizeof items[0]);
        n--;
        if (index < chosen) {
            chosen--;
        }
    }
    printf("%s %d %d\n", items[chosen].name, items[chosen].price, n);
    return 0;
}`,
      explanation: `
Указатель привязан к **ячейке** массива, а не к товару. Когда удаляется элемент левее выбранного, товар переезжает на одну ячейку влево, а указатель остаётся на месте и теперь показывает соседа (или устаревшую копию за концом массива). Память при этом законная, поэтому AddressSanitizer ошибки не видит — её выдают только неправильные ответы.

Индекс легко поддерживать: удаление левее уменьшает его на единицу, удаление правее его не меняет. Так поступают все контейнеры, которые перемещают элементы.`,
      examples: [
        { in: '3\ntea 100\ncake 300\njam 50\n1\n0\n', out: 'cake 300 2\n' },
        { in: '2\nx 5\ny 1\n1\n1\n', out: 'x 5 1\n' },
      ],
      hidden: [
        { in: '1\nonly 7\n0\n', name: 'Без удалений' },
        { in: '4\na 1\nb 2\nc 3\nd 9\n3\n0\n0\n0\n', name: 'Выбранный последний, удаления слева' },
        { in: '4\nd 9\nc 3\nb 2\na 1\n2\n1\n1\n', name: 'Выбранный первый' },
        { in: '5\na 1\nb 8\nc 8\nd 2\ne 3\n2\n0\n2\n', name: 'Два одинаково дорогих' },
        { in: '5\na 4\nb 4\nc 9\nd 4\ne 4\n4\n4\n0\n0\n1\n', name: 'Удаления с обеих сторон' },
        { in: '3\nx 1\ny 2\nz 3\n1\n1\n', name: 'Удаление соседа слева' },
        { in: '6\nk 5\nl 6\nm 7\nn 8\no 9\np 10\n5\n0\n0\n0\n0\n0\n', name: 'Остался один' },
        { in: '3\nlong_product_name 1000\ns 1\nt 2\n2\n2\n1\n', name: 'Удаления справа' },
      ],
    },
    {
      title: 'Найди ошибку: адрес из функции',
      bug: true,
      description: `
Функция \`format_price\` превращает цену в копейках в строку вида \`12.05 руб.\`. Программа печатает \`q\` цен, но выводит мусор или аварийно завершается.

Исправьте ошибку. Сигнатура функции может измениться: например, функция может принимать буфер вызывающего кода.`,
      constraints: ['1 ≤ q ≤ 20.', '0 ≤ cents ≤ 10⁹.'],
      hints: [
        'Сколько живёт массив text и когда main читает его содержимое?',
        'Надёжный вариант: void format_price(int cents, char *out, size_t size) и буфер char text[32] в main.',
      ],
      starter: String.raw`
#include <stdio.h>

const char *format_price(int cents) {
    char text[32];
    snprintf(text, sizeof text, "%d.%02d руб.", cents / 100, cents % 100);
    return text;
}
${PRICE_MAIN}`,
      solution: String.raw`
#include <stdio.h>

void format_price(int cents, char *out, size_t size) {
    snprintf(out, size, "%d.%02d руб.", cents / 100, cents % 100);
}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int cents;
        scanf("%d", &cents);
        char text[32];
        format_price(cents, text, sizeof text);
        printf("%s\n", text);
    }
    return 0;
}`,
      explanation: `
Массив \`text\` живёт в кадре \`format_price\` и исчезает при возврате; \`main\` получает адрес мёртвого объекта. GCC даже предупреждает об этом и подменяет возвращаемое значение на \`NULL\` — программа падает сразу. С другими компиляторами кадр функции перезаписывает следующий вызов \`printf\`, и печатается мусор.

Исправленная версия получает буфер от вызывающего кода: память принадлежит \`main\` и живёт столько, сколько нужно. Размер передаётся параметром, а \`snprintf\` гарантирует, что запись не выйдет за границу.`,
      examples: [
        { in: '2\n1205\n7\n', out: '12.05 руб.\n0.07 руб.\n' },
        { in: '1\n100\n', out: '1.00 руб.\n' },
      ],
      hidden: [
        { in: '1\n0\n', name: 'Ноль' },
        { in: '1\n99\n', name: 'Меньше рубля' },
        { in: '1\n1000000000\n', name: 'Максимум' },
        { in: '3\n1\n10\n101\n', name: 'Разные копейки' },
        { in: '2\n123456789\n50\n', name: 'Большая и маленькая' },
        { in: '1\n999999999\n', name: 'Почти максимум' },
        { in: '4\n100\n200\n300\n400\n', name: 'Круглые суммы' },
        { in: '1\n4321\n', name: 'Обычная цена' },
      ],
    },
    {
      title: 'Дескрипторы с поколением',
      difficulty: 'advanced',
      description: `
Реализуйте хранилище до 100 чисел, к которым обращаются через дескрипторы «индекс:поколение». У каждой ячейки есть поколение, вначале 0.

Команды до конца ввода:
- \`add x\` — положить число в **свободную ячейку с наименьшим индексом** и напечатать дескриптор \`i:g\`, где \`g\` — текущее поколение ячейки; если свободных нет — \`full\`;
- \`get i g\` — напечатать число, если ячейка \`i\` занята и её поколение равно \`g\`, иначе \`invalid\`;
- \`del i g\` — если дескриптор действителен, освободить ячейку, **увеличить её поколение** и напечатать \`ok\`, иначе \`invalid\`.`,
      constraints: ['Команд — до 300.', '0 ≤ i < 100 в командах get/del, g ≥ 0.', '|x| ≤ 10⁹.'],
      hints: [
        'struct Slot { int value; unsigned generation; int used; }; static struct Slot slots[100]; — все поля нулевые.',
        'Проверка дескриптора: i в пределах [0, 100), slots[i].used и slots[i].generation == g.',
        'При удалении: used = 0; generation++. Тогда старый дескриптор перестанет совпадать, даже если ячейку займёт новое число.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define CAPACITY 100

struct Slot {
    int value;
    unsigned generation;
    int used;
};

static struct Slot slots[CAPACITY];

int valid(int i, unsigned g) {
    return i >= 0 && i < CAPACITY && slots[i].used && slots[i].generation == g;
}

int main(void) {
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "add") == 0) {
            int x;
            scanf("%d", &x);
            int i = 0;
            while (i < CAPACITY && slots[i].used) {
                i++;
            }
            if (i == CAPACITY) {
                printf("full\n");
            } else {
                slots[i].value = x;
                slots[i].used = 1;
                printf("%d:%u\n", i, slots[i].generation);
            }
        } else {
            int i;
            unsigned g;
            scanf("%d %u", &i, &g);
            if (!valid(i, g)) {
                printf("invalid\n");
            } else if (strcmp(cmd, "get") == 0) {
                printf("%d\n", slots[i].value);
            } else {
                slots[i].used = 0;
                slots[i].generation++;
                printf("ok\n");
            }
        }
    }
    return 0;
}`,
      explanation: `
Дескриптор — пара «где лежит» и «какой это по счёту жилец ячейки». Указатель на ячейку знал бы только первое и после повторного использования ячейки молча показывал бы чужое число. Поколение растёт при каждом удалении, поэтому старый дескриптор отличается от нового, даже если индексы совпали.

Проверка индекса \`0 ≤ i < 100\` в \`valid\` обязательна: дескриптор приходит извне, и без неё \`slots[i]\` вышел бы за границы массива.`,
      examples: [
        {
          in: 'add 10\nadd 20\ndel 0 0\nadd 30\nget 0 0\nget 0 1\n',
          out: '0:0\n1:0\nok\n0:1\ninvalid\n30\n',
        },
        { in: 'get 5 0\ndel 0 0\n', out: 'invalid\ninvalid\n' },
      ],
      hidden: [
        { in: 'add 1\nget 0 0\n', name: 'Добавить и прочитать' },
        { in: 'add 1\ndel 0 0\ndel 0 0\n', name: 'Повторное удаление' },
        { in: 'add 1\ndel 0 0\nadd 2\ndel 0 1\nadd 3\nget 0 2\nget 0 1\n', name: 'Три поколения' },
        { in: 'add 5\nget 0 7\nget 99 0\nget 1 0\n', name: 'Чужие дескрипторы' },
        { in: `${'add 1\n'.repeat(101)}`, name: 'Переполнение хранилища' },
        { in: 'add 1\nadd 2\nadd 3\ndel 1 0\nadd 4\nget 1 1\nget 2 0\n', name: 'Заполнение дыры' },
        { in: 'add -1000000000\nadd 1000000000\nget 0 0\nget 1 0\n', name: 'Крайние значения' },
        { in: 'del 99 0\nget 0 0\nadd 7\nget 0 0\n', name: 'Команды до добавления' },
      ],
    },
  ],
};
