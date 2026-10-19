const repeat = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const teams = ['Lions', 'Bears', 'Eagles', 'Wolves', 'Sharks', 'Tigers', 'Hawks', 'Foxes'];
const time = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const digits = (n, f) => repeat(n, f).join('');

export default {
  id: 'c17-practice-final',
  title: 'Практикум: указатели и структуры',
  description:
    'Итоговый практикум модуля: шесть задач, где данные описываются структурами и перечислениями, поиск возвращает указатель, а записи сортируются по нескольким правилам.',
  moduleId: 'c-fundamentals',
  order: 45,
  difficulty: 'intermediate',
  estimatedMinutes: 120,
  prerequisites: ['c17-typedef'],
  objectives: [
    'Проектировать типы данных для задачи: структуры, перечисления, синонимы',
    'Писать функции поиска, возвращающие указатель на запись или NULL',
    'Сортировать массив структур по нескольким правилам через функцию порядка',
    'Разделять программу на данные, поиск, операции и ввод-вывод',
  ],
  tags: ['C23', 'Практикум', 'Структуры', 'Указатели'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef struct {
    char name[8];
    int qty;
} Item;

int main(void) {
    Item items[3] = {{"pen", 5}, {"cup", 2}, {"box", 9}};
    Item *p = items + 1;
    p->qty += 10;
    (p + 1)->qty = p->qty - items[0].qty;
    printf("%d %d %d %s\n", items[0].qty, items[1].qty, items[2].qty, (p - 1)->name);
    return 0;
}`,
      answers: ['5 12 7 pen'],
      placeholder: 'Вывод программы',
      explain:
        'p указывает на items[1]: его qty становится 12. (p + 1) — это items[2]: 12 − 5 = 7. (p − 1) — items[0].',
    },
    {
      q: 'Функция Item *find(Item *items, int n, const char *name) возвращает NULL, если товара нет. Как правильно уменьшить его количество?',
      options: [
        'Item *p = find(items, n, name); if (p != NULL) p->qty--;',
        'find(items, n, name)->qty--;',
        'Item *p = find(items, n, name); p->qty--; if (p == NULL) return;',
        'Item p = *find(items, n, name); p.qty--;',
      ],
      correct: 0,
      explain:
        'Указатель проверяют до обращения к полю. Последний вариант к тому же меняет копию записи, а не запись в массиве.',
    },
    {
      q: 'Какие вызовы goes_before(&a, &b) вернут 1? Выберите все.',
      code: String.raw`
typedef struct {
    char name[21];
    int points;
} Team;

int goes_before(const Team *a, const Team *b) {
    if (a->points != b->points) {
        return a->points > b->points;
    }
    return strcmp(a->name, b->name) < 0;
}`,
      options: [
        'a = {"Lions", 7}, b = {"Bears", 5}',
        'a = {"Bears", 7}, b = {"Lions", 7}',
        'a = {"Lions", 7}, b = {"Bears", 7}',
        'a = {"Ants", 3}, b = {"Zebras", 4}',
      ],
      correct: [0, 1],
      explain:
        'Сначала решают очки (больше — раньше), при равенстве — алфавит. У Ants очков меньше, и алфавит уже не важен.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

typedef struct {
    int v;
} Box;

int main(void) {
    Box a[3] = {{1}, {2}, {3}};
    Box *p = &a[0];
    Box tmp = a[0];
    a[0] = a[2];
    a[2] = tmp;
    printf("%d %d %d\n", p->v, a[2].v, tmp.v);
    return 0;
}`,
      answers: ['3 1 1'],
      placeholder: 'Вывод программы',
      explain:
        'Указатель p хранит адрес места a[0], а не значение. После обмена там лежит 3. tmp — отдельная копия со значением 1.',
    },
    {
      q: 'Встречи: A с 9:00 до 10:00, B с 10:00 до 11:00, C с 9:30 до 10:30. Встреча, закончившаяся в 10:00, освобождает переговорную для встречи, начинающейся в 10:00. Какое наименьшее число переговорных нужно?',
      answers: ['2'],
      placeholder: 'Число',
      explain:
        'Одновременно идут не больше двух встреч: A и C до 10:00, затем C и B. Комната A переходит к B.',
    },
    {
      q: 'Длинное число хранится в массиве цифр. Почему удобно класть младшую цифру в элемент с индексом 0?',
      options: [
        'Сложение с переносом идёт от индекса 0 вверх, и разряды чисел разной длины совпадают по индексам',
        'Так число занимает меньше памяти',
        'Иначе его нельзя напечатать',
        'Так требует стандарт C',
      ],
      correct: 0,
      explain:
        'Единицы обоих чисел оказываются в digits[0], десятки — в digits[1] и так далее; перенос в новый старший разряд просто увеличивает длину.',
    },
  ],
  exercises: [
    {
      title: 'Чек',
      difficulty: 'beginner',
      description: `
В чеке \`n\` позиций: название товара, цена за штуку в копейках и количество. Опишите тип \`Item\` и выведите:

- для каждой позиции строку \`название: сумма\`, где сумма — цена × количество в рублях с копейками (\`123.05\`);
- строку \`TOTAL: сумма\` — итог чека;
- строку \`MAX: название\` — позиция с наибольшей суммой (при равенстве — первая).

**Ввод:** \`n\`, затем \`n\` строк \`название цена количество\`.`,
      constraints: [
        '1 ≤ n ≤ 100; названия — латинские буквы, до 20 символов; 1 ≤ цена ≤ 10⁶; 1 ≤ количество ≤ 1000.',
      ],
      hints: [
        'Сумма позиции доходит до 10⁹, итог — до 10¹¹: считайте в long long.',
        'Рубли и копейки: kopecks / 100 и kopecks % 100 с форматом %02lld.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef struct {
    char name[21];
    int price;
    int qty;
} Item;

long long line_total(const Item *item) {
    return (long long)item->price * item->qty;
}

void print_money(long long kopecks) {
    printf("%lld.%02lld\n", kopecks / 100, kopecks % 100);
}

int main(void) {
    Item items[100];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%20s %d %d", items[i].name, &items[i].price, &items[i].qty);
    }
    long long total = 0;
    const Item *max = &items[0];
    for (int i = 0; i < n; i++) {
        printf("%s: ", items[i].name);
        print_money(line_total(&items[i]));
        total += line_total(&items[i]);
        if (line_total(&items[i]) > line_total(max)) {
            max = &items[i];
        }
    }
    printf("TOTAL: ");
    print_money(total);
    printf("MAX: %s\n", max->name);
    return 0;
}`,
      explanation: `
Деньги хранятся в копейках целым числом — дробные типы дали бы ошибки округления. Перевод в рубли нужен только при печати, и он вынесен в \`print_money\`.

Функция \`line_total\` принимает \`const Item *\`: она только читает запись. Умножение выполняется в \`long long\` благодаря приведению цены, иначе 10⁶ · 1000 = 10⁹ ещё поместилось бы в \`int\`, но запас был бы минимальным, а итог в 10¹¹ — уже нет.

Строгое \`>\` оставляет первую из позиций с одинаковой суммой.`,
      examples: [
        {
          in: '3\napple 4550 2\nbread 3999 1\nmilk 8900 1',
          out: 'apple: 91.00\nbread: 39.99\nmilk: 89.00\nTOTAL: 219.99\nMAX: apple\n',
        },
        { in: '1\ngum 5 1', out: 'gum: 0.05\nTOTAL: 0.05\nMAX: gum\n' },
      ],
      hidden: [
        '2\na 100 1\nb 50 2',
        '3\nx 1000000 1000\ny 1000000 1000\nz 1 1',
        '4\ntea 1 1\ncake 99 1\njam 101 1\nnut 100 1',
        `100\n${repeat(100, (i) => `item${i} ${1000000 - i * 9973} ${1000 - i}`).join('\n')}`,
        '2\nb 1 1\na 1 1',
        '3\npen 1999 3\nbook 59700 1\ncup 0001 5',
      ],
    },
    {
      title: 'Турнирная таблица',
      description: `
Даны результаты \`m\` матчей в формате \`команда1 команда2 голы1 голы2\`. За победу команда получает 3 очка, за ничью — 1, за поражение — 0.

Опишите тип \`Team\` (название, сыграно матчей, очки, забитые и пропущенные голы) и выведите таблицу: для каждой команды \`название матчи очки разница\`, где разница — забитые минус пропущенные.

Порядок: по убыванию очков, при равенстве — по убыванию разницы, затем по алфавиту (как \`strcmp\`).`,
      constraints: [
        '1 ≤ m ≤ 200; различных команд не больше 20; названия — латинские буквы, до 20 символов; 0 ≤ голы ≤ 20.',
      ],
      hints: [
        'Team *find_or_add(Team *teams, int *count, const char *name): найдите команду по имени, а если её нет — добавьте в конец массива и увеличьте *count.',
        'void record(Team *t, int scored, int conceded) обновляет одну команду. Для матча вызовите её дважды — для каждой стороны.',
        'Порядок выразите функцией int goes_before(const Team *a, const Team *b) и используйте сортировку выбором.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[21];
    int played;
    int points;
    int goals_for;
    int goals_against;
} Team;

Team *find_or_add(Team *teams, int *count, const char *name) {
    for (int i = 0; i < *count; i++) {
        if (strcmp(teams[i].name, name) == 0) {
            return &teams[i];
        }
    }
    Team *t = &teams[*count];
    (*count)++;
    strcpy(t->name, name);
    t->played = 0;
    t->points = 0;
    t->goals_for = 0;
    t->goals_against = 0;
    return t;
}

void record(Team *t, int scored, int conceded) {
    t->played++;
    t->goals_for += scored;
    t->goals_against += conceded;
    if (scored > conceded) {
        t->points += 3;
    } else if (scored == conceded) {
        t->points += 1;
    }
}

int goal_diff(const Team *t) {
    return t->goals_for - t->goals_against;
}

int goes_before(const Team *a, const Team *b) {
    if (a->points != b->points) {
        return a->points > b->points;
    }
    if (goal_diff(a) != goal_diff(b)) {
        return goal_diff(a) > goal_diff(b);
    }
    return strcmp(a->name, b->name) < 0;
}

int main(void) {
    Team teams[20];
    int count = 0;
    int m;
    scanf("%d", &m);
    for (int i = 0; i < m; i++) {
        char first[21], second[21];
        int g1, g2;
        scanf("%20s %20s %d %d", first, second, &g1, &g2);
        record(find_or_add(teams, &count, first), g1, g2);
        record(find_or_add(teams, &count, second), g2, g1);
    }
    for (int i = 0; i < count - 1; i++) {
        int best = i;
        for (int j = i + 1; j < count; j++) {
            if (goes_before(&teams[j], &teams[best])) {
                best = j;
            }
        }
        Team tmp = teams[i];
        teams[i] = teams[best];
        teams[best] = tmp;
    }
    for (int i = 0; i < count; i++) {
        printf("%s %d %d %d\n", teams[i].name, teams[i].played, teams[i].points, goal_diff(&teams[i]));
    }
    return 0;
}`,
      explanation: `
\`find_or_add\` объединяет поиск и добавление: вызывающему коду не важно, встречалась команда раньше или нет, — он получает указатель на её запись и обновляет её через \`record\`. Счётчик команд передаётся указателем, потому что функция может его увеличить.

Матч обновляет обе команды одной и той же функцией с переставленными голами — правило начисления очков записано один раз.

Три правила порядка собраны в \`goes_before\` в порядке важности: следующее правило проверяется, только если предыдущие не различили команды. Названия различны, поэтому порядок всегда однозначен.`,
      examples: [
        {
          in: '3\nLions Bears 2 1\nBears Eagles 0 0\nEagles Lions 3 1',
          out: 'Eagles 2 4 2\nLions 2 3 -1\nBears 2 1 -1\n',
        },
        { in: '1\nAlpha Beta 0 0', out: 'Alpha 1 1 0\nBeta 1 1 0\n' },
      ],
      hidden: [
        '2\nB A 1 0\nA B 1 0',
        '2\nB A 5 0\nA B 1 0',
        '3\nZeta Alpha 2 2\nAlpha Zeta 1 1\nZeta Alpha 0 0',
        '4\nX Y 20 0\nY Z 1 0\nZ X 1 0\nX Y 0 1',
        `28\n${teams.flatMap((a, i) => teams.slice(i + 1).map((b, j) => `${a} ${b} ${(i * 3 + j) % 4} ${(i + j * 2) % 3}`)).join('\n')}`,
        `200\n${repeat(200, (i) => {
          const a = `T${(i * 7) % 20}`;
          const b = `T${(i * 7 + 1 + (i % 19)) % 20}`;
          return `${a} ${b} ${(i * 13) % 6} ${(i * 5) % 4}`;
        }).join('\n')}`,
      ],
    },
    {
      title: 'Объединение отрезков',
      description: `
Даны \`n\` отрезков \`[l, r]\` на прямой. Объедините пересекающиеся и касающиеся отрезки (\`[1, 3]\` и \`[3, 5]\` дают \`[1, 5]\`) и выведите результат: количество отрезков, затем сами отрезки по возрастанию.

Опишите тип \`Segment\` с полями \`left\` и \`right\`.`,
      constraints: ['1 ≤ n ≤ 1000; −10⁹ ≤ l ≤ r ≤ 10⁹.'],
      hints: [
        'Отсортируйте отрезки по левому концу.',
        'Идите по отсортированным отрезкам, храня текущий объединённый отрезок. Если очередной начинается не правее текущего правого конца — расширьте текущий, иначе сохраните текущий и начните новый.',
        'Правый конец при расширении — максимум из двух: отрезок может целиком лежать внутри текущего.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef struct {
    int left;
    int right;
} Segment;

int goes_before(const Segment *a, const Segment *b) {
    if (a->left != b->left) {
        return a->left < b->left;
    }
    return a->right < b->right;
}

void sort_segments(Segment *s, int n) {
    for (int i = 0; i < n - 1; i++) {
        int best = i;
        for (int j = i + 1; j < n; j++) {
            if (goes_before(&s[j], &s[best])) {
                best = j;
            }
        }
        Segment tmp = s[i];
        s[i] = s[best];
        s[best] = tmp;
    }
}

int merge(const Segment *s, int n, Segment *out) {
    int count = 0;
    Segment current = s[0];
    for (int i = 1; i < n; i++) {
        if (s[i].left <= current.right) {
            if (s[i].right > current.right) {
                current.right = s[i].right;
            }
        } else {
            out[count++] = current;
            current = s[i];
        }
    }
    out[count++] = current;
    return count;
}

int main(void) {
    Segment segments[1000], merged[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d %d", &segments[i].left, &segments[i].right);
    }
    sort_segments(segments, n);
    int k = merge(segments, n, merged);
    printf("%d\n", k);
    for (int i = 0; i < k; i++) {
        printf("%d %d\n", merged[i].left, merged[i].right);
    }
    return 0;
}`,
      explanation: `
После сортировки по левому концу каждый следующий отрезок либо продолжает текущее объединение, либо начинается правее его правого конца — и тогда ни один из следующих отрезков с текущим объединением уже не пересечётся. Поэтому достаточно одного прохода.

\`current\` — копия структуры, которую мы расширяем. Готовые объединения записываются в выходной массив \`out\`, а функция возвращает их количество: так в C «возвращают» массив переменной длины.

Ловушка — вложенные отрезки: \`[1, 10]\` и \`[2, 3]\`. Если просто присвоить \`current.right = s[i].right\`, объединение сожмётся до \`[1, 3]\`. Нужен максимум.`,
      examples: [
        { in: '4\n1 3\n8 10\n2 6\n15 18', out: '3\n1 6\n8 10\n15 18\n' },
        { in: '2\n1 3\n3 5', out: '1\n1 5\n' },
      ],
      hidden: [
        '1\n-5 -5',
        '3\n1 10\n2 3\n4 5',
        '3\n5 6\n1 2\n3 4',
        '4\n0 0\n0 0\n0 1\n1 1',
        '2\n-1000000000 0\n1 1000000000',
        '5\n10 20\n-5 -1\n-1 3\n21 22\n19 21',
        `1000\n${repeat(1000, (i) => {
          const l = ((i * 7919) % 20000) - 10000;
          return `${l} ${l + (i % 13)}`;
        }).join('\n')}`,
      ],
    },
    {
      title: 'Склад',
      difficulty: 'advanced',
      description: `
Программа учёта склада обрабатывает команды до конца ввода:

- \`add название количество\` — поступление товара;
- \`take название количество\` — выдача: если товара нет или его меньше, чем просят, выведите \`ERROR\` и ничего не меняйте, иначе уменьшите остаток и выведите \`OK\`;
- \`count название\` — выведите текущий остаток (\`0\` для неизвестного товара).

После всех команд выведите строку \`---\` и остатки в формате \`название количество\` по алфавиту (как \`strcmp\`), пропуская товары с нулевым остатком.

Опишите тип \`Item\` и функцию \`Item *find_item(Item *items, int n, const char *name)\`, возвращающую указатель на запись или \`NULL\`.`,
      constraints: [
        'Команд от 1 до 1000; различных названий не больше 100; названия — латинские буквы, до 20 символов.',
        '1 ≤ количество ≤ 10⁹.',
      ],
      hints: [
        'Чтение: сначала команда scanf("%5s", cmd), затем, в зависимости от неё, название и число.',
        'Сумма поступлений одного товара может превысить int — храните остаток в long long.',
        'Для add: если find_item вернул NULL, создайте запись в конце массива с нулевым остатком и используйте указатель на неё.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[21];
    long long qty;
} Item;

Item *find_item(Item *items, int n, const char *name) {
    for (Item *p = items; p != items + n; p++) {
        if (strcmp(p->name, name) == 0) {
            return p;
        }
    }
    return NULL;
}

int main(void) {
    Item items[100];
    int n = 0;
    char cmd[6];
    char name[21];
    long long qty;
    while (scanf("%5s %20s", cmd, name) == 2) {
        Item *p = find_item(items, n, name);
        if (strcmp(cmd, "add") == 0) {
            scanf("%lld", &qty);
            if (p == NULL) {
                p = &items[n++];
                strcpy(p->name, name);
                p->qty = 0;
            }
            p->qty += qty;
        } else if (strcmp(cmd, "take") == 0) {
            scanf("%lld", &qty);
            if (p == NULL || p->qty < qty) {
                printf("ERROR\n");
            } else {
                p->qty -= qty;
                printf("OK\n");
            }
        } else {
            printf("%lld\n", p == NULL ? 0 : p->qty);
        }
    }
    for (int i = 0; i < n - 1; i++) {
        int best = i;
        for (int j = i + 1; j < n; j++) {
            if (strcmp(items[j].name, items[best].name) < 0) {
                best = j;
            }
        }
        Item tmp = items[i];
        items[i] = items[best];
        items[best] = tmp;
    }
    printf("---\n");
    for (int i = 0; i < n; i++) {
        if (items[i].qty > 0) {
            printf("%s %lld\n", items[i].name, items[i].qty);
        }
    }
    return 0;
}`,
      explanation: `
Все три команды начинаются с одинакового шага — найти запись по названию. Поэтому поиск выполняется один раз сразу после чтения названия, а дальше каждая ветка работает с указателем \`p\`.

\`NULL\` здесь — обычная ситуация, а не ошибка: для \`add\` он означает «создать запись», для \`take\` — «товара нет», для \`count\` — «остаток 0». Главное — проверить указатель до обращения к \`p->qty\`.

Запись с нулевым остатком не удаляется из массива: удаление потребовало бы сдвигать элементы. Достаточно пропустить её при печати. Сортировка выполняется только в конце, поэтому указатели, полученные во время обработки команд, не «съезжают».`,
      examples: [
        {
          in: 'add nails 100\ntake nails 30\ntake screws 1\ncount nails\nadd bolts 5\ntake nails 70\ncount nails',
          out: 'OK\nERROR\n70\nOK\n0\n---\nbolts 5\n',
        },
        { in: 'count ghost', out: '0\n---\n' },
      ],
      hidden: [
        'add a 1\ntake a 2\ntake a 1\ntake a 1',
        'add x 1000000000\nadd x 1000000000\nadd x 1000000000\ncount x\ntake x 2999999999\ncount x',
        'add zeta 3\nadd alpha 2\nadd Beta 1\nadd beta 4',
        'add a 5\ntake a 5\nadd b 1\ncount a',
        `${repeat(600, (i) => `add item${i % 100} ${((i * 37) % 1000) + 1}`).join('\n')}\n${repeat(300, (i) => `take item${(i * 3) % 100} ${((i * 101) % 3000) + 1}`).join('\n')}\n${repeat(99, (i) => `count item${i}`).join('\n')}`,
        'count a\nadd a 1\ncount a\ntake b 1',
      ],
    },
    {
      title: 'Переговорные',
      difficulty: 'advanced',
      description: `
Даны \`n\` встреч с временем начала и окончания в формате \`ЧЧ:ММ\`. Встреча занимает переговорную от начала до окончания; если одна встреча заканчивается ровно тогда, когда начинается другая, они могут пройти в одной переговорной. Найдите наименьшее число переговорных, достаточное для всех встреч.

Указание: превратите каждую встречу в два **события** — начало и конец — и опишите тип \`Event\` со временем в минутах и видом события из перечисления. Отсортируйте события по времени и пройдите по ним, считая, сколько встреч идёт одновременно.

**Ввод:** \`n\`, затем \`n\` строк \`ЧЧ:ММ ЧЧ:ММ\`.`,
      constraints: ['1 ≤ n ≤ 500; 00:00 ≤ начало < окончание ≤ 23:59.'],
      hints: [
        'Чтение: scanf("%d:%d %d:%d", &h1, &m1, &h2, &m2). Время в минутах — h * 60 + m.',
        'При равном времени конец встречи должен идти раньше начала другой. Удобно объявить enum { END, START }: тогда при равенстве времени событие с меньшим видом идёт первым.',
        'Начало увеличивает счётчик текущих встреч, конец уменьшает. Ответ — максимум счётчика.',
      ],
      solution: String.raw`
#include <stdio.h>

typedef enum { END, START } Kind;

typedef struct {
    int minute;
    Kind kind;
} Event;

int goes_before(const Event *a, const Event *b) {
    if (a->minute != b->minute) {
        return a->minute < b->minute;
    }
    return a->kind < b->kind;
}

int main(void) {
    Event events[1000];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int h1, m1, h2, m2;
        scanf("%d:%d %d:%d", &h1, &m1, &h2, &m2);
        events[2 * i] = (Event){h1 * 60 + m1, START};
        events[2 * i + 1] = (Event){h2 * 60 + m2, END};
    }
    int total = 2 * n;
    for (int i = 0; i < total - 1; i++) {
        int best = i;
        for (int j = i + 1; j < total; j++) {
            if (goes_before(&events[j], &events[best])) {
                best = j;
            }
        }
        Event tmp = events[i];
        events[i] = events[best];
        events[best] = tmp;
    }
    int current = 0, rooms = 0;
    for (const Event *e = events; e != events + total; e++) {
        if (e->kind == START) {
            current++;
            if (current > rooms) {
                rooms = current;
            }
        } else {
            current--;
        }
    }
    printf("%d\n", rooms);
    return 0;
}`,
      explanation: `
Число занятых переговорных меняется только в моменты начала и конца встреч. Если пройти эти моменты по порядку, счётчик \`current\` в каждый момент равен числу идущих встреч, а его максимум — ответу.

Вся тонкость — в порядке событий с одинаковым временем. Если встреча заканчивается в 10:00, а другая начинается в 10:00, конец нужно обработать раньше: тогда комната успеет освободиться. Значения перечисления выбраны так, что \`END < START\`, и правило порядка записывается одной строкой.

Запись \`(Event){h1 * 60 + m1, START}\` — составной литерал: временная структура, созданная прямо в выражении. Её удобно присваивать элементу массива целиком.`,
      examples: [
        { in: '3\n09:00 10:00\n10:00 11:00\n09:30 10:30', out: '2\n' },
        { in: '2\n12:00 13:00\n12:00 13:00', out: '2\n' },
      ],
      hidden: [
        '1\n00:00 23:59',
        '3\n08:00 09:00\n09:00 10:00\n10:00 11:00',
        '4\n09:00 12:00\n09:30 10:00\n10:00 10:30\n10:30 11:00',
        '5\n10:00 10:01\n10:00 10:02\n10:01 10:03\n10:02 10:04\n10:03 10:05',
        '3\n13:00 14:00\n08:00 20:00\n09:00 13:00',
        `500\n${repeat(500, () => '00:00 23:59').join('\n')}`,
        `500\n${repeat(500, (i) => {
          const start = (i * 37) % 1380;
          return `${time(start)} ${time(start + 1 + ((i * 13) % 59))}`;
        }).join('\n')}`,
      ],
    },
    {
      title: 'Длинная сумма',
      difficulty: 'advanced',
      description: `
Даны \`n\` неотрицательных целых чисел, в каждом до 200 цифр. Выведите их сумму.

Такие числа не помещаются ни в один встроенный тип, поэтому храните их как массив цифр. Опишите

\`\`\`c
typedef struct {
    int digits[260];   // digits[0] — младшая цифра
    int len;
} BigNum;
\`\`\`

и функции разбора строки, прибавления одного числа к другому и печати.

**Ввод:** \`n\`, затем \`n\` чисел без ведущих нулей.`,
      constraints: ['1 ≤ n ≤ 50; в каждом числе от 1 до 200 цифр.'],
      hints: [
        'Читайте число как строку: scanf("%200s", s). Цифра s[i] — это s[i] − \'0\'; младшая цифра — последний символ строки.',
        'Сложение в столбик: для каждого разряда i сумма = a[i] + b[i] + перенос; в разряд записывается сумма % 10, перенос — сумма / 10. Если после старшего разряда остался перенос, длина увеличивается.',
        'Инициализируйте BigNum нулями ({0}): тогда цифры за пределами len равны 0 и числа разной длины складываются без особых случаев.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define MAX_DIGITS 260

typedef struct {
    int digits[MAX_DIGITS];
    int len;
} BigNum;

BigNum parse(const char *s) {
    BigNum x = {{0}, 0};
    int n = (int)strlen(s);
    for (int i = 0; i < n; i++) {
        x.digits[i] = s[n - 1 - i] - '0';
    }
    x.len = n;
    return x;
}

void add_to(BigNum *acc, const BigNum *x) {
    int len = acc->len > x->len ? acc->len : x->len;
    int carry = 0;
    for (int i = 0; i < len; i++) {
        int sum = acc->digits[i] + x->digits[i] + carry;
        acc->digits[i] = sum % 10;
        carry = sum / 10;
    }
    if (carry > 0) {
        acc->digits[len] = carry;
        len++;
    }
    acc->len = len;
}

void print_big(const BigNum *x) {
    for (int i = x->len - 1; i >= 0; i--) {
        printf("%d", x->digits[i]);
    }
    printf("\n");
}

int main(void) {
    int n;
    scanf("%d", &n);
    BigNum total = parse("0");
    char s[201];
    for (int i = 0; i < n; i++) {
        scanf("%200s", s);
        BigNum x = parse(s);
        add_to(&total, &x);
    }
    print_big(&total);
    return 0;
}`,
      explanation: `
Это сложение в столбик, которое вы делали в школе, только цифры лежат в массиве в обратном порядке: единицы в \`digits[0]\`, десятки в \`digits[1]\`. Так разряды двух чисел совпадают по индексам, а новый старший разряд от переноса просто дописывается в конец.

Структура объединяет массив цифр и длину — две вещи, которые по отдельности бессмысленны. \`add_to\` получает накопитель по указателю и меняет его на месте, а слагаемое — по \`const\`-указателю: копировать килобайт цифр при каждом вызове незачем.

Сумма 50 чисел по 200 цифр меньше 10²⁰², поэтому 260 разрядов хватает с запасом. Цифры за пределами \`len\` остаются нулями, потому что структуры инициализированы \`{0}\`, а длина только растёт. Так же устроены «длинные числа» в библиотеках произвольной точности, только вместо одной цифры в элементе хранят сразу 9 или 18.`,
      examples: [
        { in: '2\n99999999999999999999\n1', out: '100000000000000000000\n' },
        { in: '3\n123\n0\n877', out: '1000\n' },
      ],
      hidden: [
        '1\n0',
        '2\n0\n0',
        '2\n5\n5',
        `2\n${'9'.repeat(200)}\n${'9'.repeat(200)}`,
        `50\n${repeat(50, () => '9'.repeat(200)).join('\n')}`,
        `3\n${digits(200, (i) => (i * 7 + 1) % 10 || 1)}\n${digits(150, (i) => (i * 3 + 2) % 10 || 3)}\n${digits(1, () => 7)}`,
        `20\n${repeat(20, (i) => digits(10 * i + 1, (j) => ((i + j) % 9) + 1)).join('\n')}`,
      ],
    },
  ],
};
