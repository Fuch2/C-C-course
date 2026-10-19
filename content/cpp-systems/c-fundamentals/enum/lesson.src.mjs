const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const repeat = (n, f) => Array.from({ length: n }, (_, i) => f(i));

export default {
  id: 'c17-enum',
  title: 'Перечисления enum',
  description:
    'Именованные целые константы вместо магических чисел: объявление enum, явные значения, switch с проверкой полноты, таблицы названий, константа-счётчик, проверка ввода и конечные автоматы.',
  moduleId: 'c-fundamentals',
  order: 43,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['c17-struct'],
  objectives: [
    'Заменять магические числа константами перечисления',
    'Понимать, как нумеруются константы, и задавать значения явно',
    'Писать switch по перечислению так, чтобы компилятор находил забытые случаи',
    'Связывать перечисление с массивом названий через константу-счётчик и проверять входные значения',
    'Описывать конечный автомат через перечисление состояний',
  ],
  tags: ['C23', 'Перечисления', 'switch'],
  standard: 'c23',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

enum code { A, B = 5, C, D = 2, E };

int main(void) {
    printf("%d %d %d %d %d\n", A, B, C, D, E);
    return 0;
}`,
      answers: ['0 5 6 2 3'],
      placeholder: 'Вывод программы',
      explain:
        'A — первая константа без значения, 0. C продолжает счёт от B, E — от D. Значения не обязаны возрастать.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

enum weekday { MON, TUE, WED, THU, FRI, SAT, SUN, DAY_COUNT };

int main(void) {
    enum weekday d = SAT;
    d = (d + 10) % DAY_COUNT;
    printf("%d %d\n", d, d == TUE);
    return 0;
}`,
      answers: ['1 1'],
      placeholder: 'Вывод программы',
      explain: 'SAT = 5, (5 + 10) % 7 = 1 — это TUE.',
    },
    {
      q: 'Почему в switch по перечислению, где перечислены все константы, часто не пишут default?',
      options: [
        'Без default компилятор предупредит, если в перечисление добавят константу и забудут её обработать',
        'default запрещён в switch по перечислению',
        'Без default switch работает быстрее',
        'С default программа не скомпилируется',
      ],
      correct: 0,
      explain:
        'С default компилятор считает, что все остальные значения обработаны, и не выдаёт предупреждение -Wswitch.',
    },
    {
      q: 'Какие утверждения о перечислениях в C верны? Выберите все.',
      options: [
        'Константы перечисления имеют тип int',
        'Компилятор запрещает присвоить переменной enum число, которого нет в перечислении',
        'Одно имя константы нельзя использовать в двух перечислениях одного файла',
        'Константу перечисления можно использовать как размер массива',
      ],
      correct: [0, 2, 3],
      explain:
        'Переменная enum в C — обычное целое число, и присвоить ей можно любое значение. Именно поэтому входные данные нужно проверять.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

enum door { CLOSED, OPEN, LOCKED_DOOR };

enum door apply(enum door d, char cmd) {
    switch (d) {
        case CLOSED:
            if (cmd == 'o') return OPEN;
            if (cmd == 'l') return LOCKED_DOOR;
            return CLOSED;
        case OPEN:
            return cmd == 'c' ? CLOSED : OPEN;
        case LOCKED_DOOR:
            return cmd == 'u' ? CLOSED : LOCKED_DOOR;
    }
    return d;
}

int main(void) {
    const char *cmds = "olcloucuo";
    enum door d = CLOSED;
    for (int i = 0; cmds[i] != '\0'; i++) {
        d = apply(d, cmds[i]);
        printf("%d", d);
    }
    printf("\n");
    return 0;
}`,
      answers: ['110220001'],
      placeholder: 'Вывод программы',
      explain:
        'o: CLOSED→OPEN(1); l: открытую дверь не запереть (1); c: →CLOSED(0); l: →LOCKED(2); o: заперта (2); u: →CLOSED(0); c: уже закрыта (0); u: не заперта (0); o: →OPEN(1).',
    },
    {
      q: 'Найдите ошибку.',
      code: String.raw`
enum color { RED, GREEN, BLUE };
enum color c = GREEN;
printf("Цвет: %s\n", c);`,
      options: [
        'c — число, %s ожидает строку; названия нужно хранить отдельно',
        'Переменную enum нельзя инициализировать константой',
        'Нужно писать enum color.GREEN',
        'Ошибки нет, выведется GREEN',
      ],
      correct: 0,
      explain:
        'Имена констант существуют только в исходном коде. В программе c равно 1, и для печати названия нужен массив строк или функция со switch.',
    },
    {
      q: 'Что выведет программа? Обратите внимание на отсутствие break.',
      code: String.raw`
#include <stdio.h>

enum level { LOW, MID, HIGH };

int score(enum level l) {
    int s = 0;
    switch (l) {
        case HIGH:
            s += 100;
            /* fall through */
        case MID:
            s += 10;
            /* fall through */
        case LOW:
            s += 1;
    }
    return s;
}

int main(void) {
    printf("%d %d %d\n", score(LOW), score(MID), score(HIGH));
    return 0;
}`,
      answers: ['1 11 111'],
      placeholder: 'Вывод программы',
      explain: 'Выполнение начинается с подходящего case и проваливается во все следующие.',
    },
    {
      q: 'Код уровня code прочитан через scanf. Как безопасно получить его название из массива level_names[LEVEL_COUNT]?',
      options: [
        'Проверить 0 <= code && code < LEVEL_COUNT, затем взять level_names[code]',
        'Сразу взять level_names[code]: code приводится к enum level',
        'Взять level_names[code % LEVEL_COUNT]',
        'Проверить code <= LEVEL_COUNT, затем взять level_names[code]',
      ],
      correct: 0,
      explain:
        'Компилятор не ограничивает значения enum. Остаток от деления для отрицательных чисел отрицателен, а code == LEVEL_COUNT уже за массивом.',
    },
  ],
  exercises: [
    {
      title: 'Декодер состояния',
      description: `
Станок сообщает коды состояний: \`0\` — \`IDLE\`, \`1\` — \`RUNNING\`, \`2\` — \`FAULT\`. Прочитайте коды до конца ввода и для каждого выведите название состояния. Для кодов вне диапазона выведите \`INVALID\`.

Опишите перечисление \`enum state\` с константой-счётчиком и массив названий.`,
      constraints: ['Кодов от 1 до 1000; каждый код — целое число от −10⁹ до 10⁹.'],
      hints: [
        'enum state { IDLE, RUNNING, FAULT, STATE_COUNT }; и const char *state_names[STATE_COUNT] = {"IDLE", "RUNNING", "FAULT"};',
        'Цикл чтения: while (scanf("%d", &code) == 1). Перед обращением к массиву проверьте 0 <= code && code < STATE_COUNT.',
      ],
      solution: String.raw`
#include <stdio.h>

enum state { IDLE, RUNNING, FAULT, STATE_COUNT };

const char *state_names[STATE_COUNT] = {"IDLE", "RUNNING", "FAULT"};

int main(void) {
    int code;
    while (scanf("%d", &code) == 1) {
        if (code < 0 || code >= STATE_COUNT) {
            printf("INVALID\n");
        } else {
            printf("%s\n", state_names[code]);
        }
    }
    return 0;
}`,
      explanation: `
Константа \`STATE_COUNT\` равна количеству состояний и служит сразу размером массива названий и верхней границей проверки. Если добавить новое состояние перед ней, обе вещи изменятся автоматически — останется только дописать название.

Проверка диапазона обязательна: компилятор не следит за значениями перечисления, и без неё код \`7\` или \`-1\` прочитал бы память за пределами массива.`,
      examples: [
        { in: '0 1 2', out: 'IDLE\nRUNNING\nFAULT\n' },
        { in: '3\n-1\n1', out: 'INVALID\nINVALID\nRUNNING\n' },
      ],
      hidden: [
        '2',
        '1000000000 -1000000000',
        '2 2 2 3 3 0',
        repeat(1000, (i) => (i % 5) - 1).join(' '),
        '1 1 1',
        '-2 -3 4 0',
      ],
    },
    {
      title: 'Автомат запуска',
      description: `
Станок из предыдущей задачи начинает работу в состоянии \`IDLE\` и получает события:

- \`1\` — запуск: из \`IDLE\` переходит в \`RUNNING\`;
- \`2\` — остановка: из \`RUNNING\` переходит в \`IDLE\`;
- \`3\` — авария: из любого состояния переходит в \`FAULT\`;
- \`4\` — сброс: из \`FAULT\` переходит в \`IDLE\`.

Событие, которое в текущем состоянии ничего не делает (например, запуск в состоянии \`FAULT\`), и неизвестные коды состояние не меняют.

Напишите функцию \`enum state step(enum state s, int event)\` со \`switch\` по состоянию. Выведите название состояния после каждого события.

**Ввод:** \`n\`, затем \`n\` кодов событий.`,
      constraints: ['1 ≤ n ≤ 1000; коды событий от 0 до 9.'],
      hints: [
        'Авария действует из любого состояния — её удобно проверить до switch: if (event == 3) return FAULT;',
        'Внутри switch для каждого состояния проверьте единственное событие, которое из него выводит, иначе верните s.',
      ],
      starter: String.raw`
#include <stdio.h>

enum state { IDLE, RUNNING, FAULT, STATE_COUNT };

const char *state_names[STATE_COUNT] = {"IDLE", "RUNNING", "FAULT"};

enum state step(enum state s, int event) {
    // Верните новое состояние.
    return s;
}

int main(void) {
    int n;
    scanf("%d", &n);
    enum state s = IDLE;
    for (int i = 0; i < n; i++) {
        int event;
        scanf("%d", &event);
        s = step(s, event);
        printf("%s\n", state_names[s]);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>

enum state { IDLE, RUNNING, FAULT, STATE_COUNT };

const char *state_names[STATE_COUNT] = {"IDLE", "RUNNING", "FAULT"};

enum state step(enum state s, int event) {
    if (event == 3) {
        return FAULT;
    }
    switch (s) {
        case IDLE:
            return event == 1 ? RUNNING : IDLE;
        case RUNNING:
            return event == 2 ? IDLE : RUNNING;
        case FAULT:
            return event == 4 ? IDLE : FAULT;
        case STATE_COUNT:
            break;
    }
    return s;
}

int main(void) {
    int n;
    scanf("%d", &n);
    enum state s = IDLE;
    for (int i = 0; i < n; i++) {
        int event;
        scanf("%d", &event);
        s = step(s, event);
        printf("%s\n", state_names[s]);
    }
    return 0;
}`,
      explanation: `
Вся логика переходов собрана в \`step\`: по текущему состоянию и событию она возвращает следующее. \`main\` только читает события и печатает результат — его не нужно менять, если правила изменятся.

Событие «авария» действует одинаково из любого состояния, поэтому оно проверяется один раз до \`switch\`, а не повторяется в каждой ветке.

\`case STATE_COUNT\` в решении нужен только для того, чтобы компилятор не предупреждал о необработанной константе: это служебное значение, а не состояние. Функция всегда возвращает корректное состояние, поэтому \`state_names[s]\` в \`main\` безопасен.`,
      examples: [
        { in: '3\n1 3 1', out: 'RUNNING\nFAULT\nFAULT\n' },
        { in: '5\n2 1 2 4 1', out: 'IDLE\nRUNNING\nIDLE\nIDLE\nRUNNING\n' },
      ],
      hidden: [
        '1\n0',
        '1\n3',
        '6\n3 4 1 3 4 2',
        '8\n9 1 1 4 2 2 3 3',
        '7\n1 5 6 7 8 2 4',
        `1000\n${repeat(1000, (i) => (i * 7) % 10).join(' ')}`,
      ],
    },
    {
      title: 'День недели',
      description: `
Дни недели обозначены тремя буквами: \`Mon Tue Wed Thu Fri Sat Sun\`. Для каждого запроса «день и сдвиг \`k\`» выведите, какой день будет через \`k\` дней. Отрицательный \`k\` означает «\`|k|\` дней назад».

Опишите \`enum weekday\` с константой-счётчиком и массив названий. Название из ввода превратите в значение перечисления поиском по массиву.

**Ввод:** запросы \`день k\` до конца ввода.`,
      constraints: ['Запросов от 1 до 1000; |k| ≤ 10⁹; названия дней всегда корректны.'],
      hints: [
        'Найдите индекс названия циклом по массиву со strcmp(name, day_names[d]) == 0.',
        'В C остаток от деления отрицательного числа отрицателен: −3 % 7 = −3. Приведите сдвиг к диапазону 0…6: ((k % 7) + 7) % 7.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

enum weekday { MON, TUE, WED, THU, FRI, SAT, SUN, DAY_COUNT };

const char *day_names[DAY_COUNT] = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};

int main(void) {
    char name[4];
    int k;
    while (scanf("%3s %d", name, &k) == 2) {
        // Найдите день и выведите название дня через k дней.
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

enum weekday { MON, TUE, WED, THU, FRI, SAT, SUN, DAY_COUNT };

const char *day_names[DAY_COUNT] = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};

enum weekday parse_day(const char *name) {
    for (int d = MON; d < DAY_COUNT; d++) {
        if (strcmp(name, day_names[d]) == 0) {
            return d;
        }
    }
    return DAY_COUNT;
}

enum weekday shift_day(enum weekday d, int k) {
    int offset = ((k % DAY_COUNT) + DAY_COUNT) % DAY_COUNT;
    return (d + offset) % DAY_COUNT;
}

int main(void) {
    char name[4];
    int k;
    while (scanf("%3s %d", name, &k) == 2) {
        enum weekday d = parse_day(name);
        if (d == DAY_COUNT) {
            printf("?\n");
            continue;
        }
        printf("%s\n", day_names[shift_day(d, k)]);
    }
    return 0;
}`,
      explanation: `
Перечисление и массив названий — две стороны одного соответствия: \`day_names[d]\` превращает значение в текст, а \`parse_day\` — текст в значение. \`DAY_COUNT\` удобно использовать как признак «не найдено», потому что это не настоящий день.

Главная тонкость — отрицательные сдвиги. В C знак остатка совпадает со знаком делимого: \`-10 % 7 == -3\`. Выражение \`((k % 7) + 7) % 7\` превращает любой сдвиг в число от 0 до 6: −10 дней назад — то же самое, что 4 дня вперёд.

Брать остаток от \`k\` нужно **до** сложения с днём: \`d + k\` при \`k\` = 10⁹ ещё помещается в \`int\`, но привычка сокращать большие числа заранее защищает от переполнения.`,
      examples: [
        { in: 'Wed 10', out: 'Sat\n' },
        { in: 'Mon -1\nSun 1\nFri 0', out: 'Sun\nMon\nFri\n' },
      ],
      hidden: [
        'Sat -10',
        'Thu 7\nThu -7\nThu 14',
        'Tue 1000000000\nTue -1000000000',
        'Sun -1\nSun -6\nSun -8',
        days.map((d, i) => `${d} ${i * 3 - 9}`).join('\n'),
        repeat(1000, (i) => `${days[i % 7]} ${((i * 7919) % 2001) - 1000}`).join('\n'),
      ],
    },
    {
      title: 'Робот',
      description: `
Робот стоит в точке \`(0, 0)\` и смотрит на север. Он выполняет команды: \`L\` — повернуться налево на 90°, \`R\` — направо, \`F\` — шагнуть на одну клетку вперёд. Север — направление увеличения \`y\`, восток — увеличения \`x\`.

Опишите \`enum direction { NORTH, EAST, SOUTH, WEST }\` и выведите итоговые координаты и направление: \`x y NORTH\` и т. п.

**Ввод:** строка команд.`,
      constraints: ['Длина строки от 1 до 1000; только символы L, R, F.'],
      hints: [
        'Если константы идут по часовой стрелке, поворот направо — (dir + 1) % 4, налево — (dir + 3) % 4.',
        'Смещения удобно хранить в массивах, индексированных направлением: dx[] = {0, 1, 0, -1}, dy[] = {1, 0, -1, 0}.',
      ],
      solution: String.raw`
#include <stdio.h>

enum direction { NORTH, EAST, SOUTH, WEST, DIRECTION_COUNT };

const char *direction_names[DIRECTION_COUNT] = {"NORTH", "EAST", "SOUTH", "WEST"};
const int dx[DIRECTION_COUNT] = {0, 1, 0, -1};
const int dy[DIRECTION_COUNT] = {1, 0, -1, 0};

int main(void) {
    char commands[1001];
    scanf("%1000s", commands);
    enum direction dir = NORTH;
    int x = 0, y = 0;
    for (int i = 0; commands[i] != '\0'; i++) {
        if (commands[i] == 'L') {
            dir = (dir + DIRECTION_COUNT - 1) % DIRECTION_COUNT;
        } else if (commands[i] == 'R') {
            dir = (dir + 1) % DIRECTION_COUNT;
        } else if (commands[i] == 'F') {
            x += dx[dir];
            y += dy[dir];
        }
    }
    printf("%d %d %s\n", x, y, direction_names[dir]);
    return 0;
}`,
      explanation: `
Порядок констант выбран не случайно: \`NORTH, EAST, SOUTH, WEST\` идут по часовой стрелке. Поэтому поворот направо — переход к следующей константе, налево — к предыдущей, с переходом по кругу через остаток. Поворот налево записан как прибавление \`DIRECTION_COUNT - 1\` (то есть 3), а не вычитание 1, чтобы не получить отрицательный остаток для \`NORTH\`.

Массивы \`dx\` и \`dy\`, индексированные направлением, заменяют \`switch\` из четырёх веток: шаг вперёд — одна строка для всех направлений. Такой табличный приём часто встречается в задачах на сетки и в играх.`,
      examples: [
        { in: 'FFRFF', out: '2 2 EAST\n' },
        { in: 'LLLL', out: '0 0 NORTH\n', why: 'Четыре поворота налево — полный круг.' },
      ],
      hidden: [
        'F',
        'L',
        'R',
        'RRF',
        'LF',
        'FRFRFRF',
        'FFLFFLFFLFF',
        'F'.repeat(1000),
        'RF'.repeat(500),
        repeat(1000, (i) => 'FLFRR'[i % 5]).join(''),
      ],
    },
  ],
};
