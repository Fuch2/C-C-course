const PROCESS_TAIL = String.raw`
int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        long long sum;
        if (sum_record(&sum) == 0) {
            printf("%lld\n", sum);
        } else {
            printf("invalid\n");
        }
    }
    return 0;
}`;

const LONGEST_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Читает слово в новый блок. Возвращает NULL в конце ввода.
char *read_word(void) {
    char buffer[64];
    if (scanf("%63s", buffer) != 1) {
        return NULL;
    }
    char *word = malloc(strlen(buffer) + 1);
    if (word != NULL) {
        strcpy(word, buffer);
    }
    return word;
}`;

const TEAM = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Team {
    char *name;
    char **members;
    int count;
};

char *copy_text(const char *s) {
    char *c = malloc(strlen(s) + 1);
    if (c != NULL) {
        strcpy(c, s);
    }
    return c;
}

struct Team *team_read(void) {
    char buffer[32];
    int count;
    if (scanf("%31s %d", buffer, &count) != 2) {
        return NULL;
    }
    struct Team *t = calloc(1, sizeof *t);
    if (t == NULL) {
        return NULL;
    }
    t->name = copy_text(buffer);
    t->members = calloc((size_t)count, sizeof *t->members);
    for (int i = 0; i < count; i++) {
        scanf("%31s", buffer);
        t->members[i] = copy_text(buffer);
        t->count++;
    }
    return t;
}`;

const TEAM_MAIN = String.raw`
int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        struct Team *t = team_read();
        if (t == NULL) {
            return 1;
        }
        printf("%s:", t->name);
        for (int k = 0; k < t->count; k++) {
            printf(" %s", t->members[k]);
        }
        printf("\n");
        team_destroy(t);
    }
    return 0;
}`;

export default {
  id: 'memory-memory-leak',
  title: 'Утечки памяти',
  description:
    'Что такое утечка и почему она опасна в долгоживущих программах, как читать отчёт LeakSanitizer, прямые и косвенные утечки, пять типичных причин и правила кода без утечек.',
  moduleId: 'memory-pointers',
  order: 16,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-dynamic-arrays'],
  objectives: [
    'Объяснять, что такое утечка памяти и почему она опасна',
    'Читать отчёт LeakSanitizer: размер, число блоков, место выделения, direct и indirect',
    'Находить пять типичных причин утечек в коде',
    'Исправлять утечки на ветках ошибок, при перезаписи указателя и в функциях destroy',
  ],
  tags: ['C17', 'Память', 'Утечка памяти', 'LeakSanitizer', 'Найди ошибку'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие фрагменты содержат утечку? Выберите все.',
      options: [
        'char *p = malloc(10); p = malloc(20); free(p);',
        'char *p = malloc(10); free(p); p = malloc(20); free(p);',
        'int *a = malloc(40); if (bad) return -1; free(a);',
        'int *a = NULL; free(a);',
      ],
      correct: [0, 2],
      explain:
        'В первом фрагменте адрес первого блока перезаписан. В третьем ветка bad выходит, не освободив a. Освобождение NULL корректно.',
    },
    {
      q: 'Что означает строка отчёта Indirect leak of 40 byte(s)?',
      options: [
        'Блок недостижим, потому что указатель на него хранился в другом потерянном блоке',
        'Блок освобождён дважды',
        'Утечка произошла в стандартной библиотеке',
        'Блок утёк в другом потоке',
      ],
      correct: 0,
      explain:
        'Косвенные утечки исчезают, когда исправлена прямая: правильный destroy для потерянной структуры освободит и вложенные блоки.',
    },
    {
      q: 'Какое место в программе показывает стек вызовов в отчёте LeakSanitizer?',
      options: [
        'Где блок был выделен',
        'Где блок нужно было освободить',
        'Где программа завершилась',
        'Где указатель был перезаписан',
      ],
      correct: 0,
      explain:
        'Инструмент знает только место выделения. Место, где потерян последний указатель, находят, отслеживая владельца блока.',
    },
    {
      q: 'Сколько байтов утечёт, если функция ниже вызвана 1000 раз?',
      code: String.raw`
void log_event(int code) {
    char *msg = malloc(32);
    if (msg == NULL) {
        return;
    }
    snprintf(msg, 32, "event %d", code);
    puts(msg);
}`,
      lang: 'c',
      answers: ['32000'],
      placeholder: 'Байтов',
      explain: 'Каждый вызов теряет 32 байта: 1000 · 32 = 32 000.',
    },
    {
      q: 'Почему опасна запись data = realloc(data, n); ?',
      options: [
        'При отказе realloc вернёт NULL, и адрес старого блока будет потерян — утечка',
        'realloc освобождает блок дважды',
        'Компилятор не разрешает присваивать результат той же переменной',
        'Новый блок не будет выровнен',
      ],
      correct: 0,
      explain: 'Результат нужно сохранять во временную переменную и присваивать только при успехе.',
    },
    {
      q: 'Структура выделена malloc и владеет полем name (тоже из malloc). Какой порядок освобождения правильный?',
      options: [
        'free(s->name); free(s);',
        'free(s); free(s->name);',
        'Только free(s);',
        'Только free(s->name);',
      ],
      correct: 0,
      explain:
        'После free(s) читать s->name уже нельзя. Только free(s) оставит косвенную утечку name.',
    },
    {
      q: 'Программа с утечкой напечатала правильный ответ и завершилась с кодом 0. Почему проверка с LeakSanitizer всё равно считает тест непройденным?',
      options: [
        'LeakSanitizer при завершении сообщает об утечке и завершает процесс с ошибкой',
        'LeakSanitizer меняет вывод программы на случайный',
        'Тест проверяет время работы',
        'Код завершения не важен — тест засчитан',
      ],
      correct: 0,
      explain:
        'Отчёт об утечке превращает завершение в ошибку; при этом буферизованный вывод может не попасть в stdout.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: утечка в обработчике',
      bug: true,
      description: `
Программа обрабатывает \`q\` записей. Каждая запись — количество \`n\` и \`n\` чисел. Функция \`sum_record\` считывает запись в блок из кучи и возвращает сумму; если \`n\` некорректно (меньше 1 или больше 100) или среди чисел есть отрицательное, запись считается неверной.

Ответы правильные, но LeakSanitizer находит утечку. Исправьте \`sum_record\`, не меняя формат вывода. Неверная запись прочитывается до конца, как и сейчас.`,
      constraints: ['1 ≤ q ≤ 10.', '|n| ≤ 1000; в записи ровно max(n, 0) чисел.', '|x| ≤ 10⁶.'],
      hints: [
        'Найдите все return в sum_record. Какой из них выполняется после malloc без free?',
        'Перед return -1 в ветке с отрицательным числом нужен free(values) — но только после того, как вся запись прочитана.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>

int sum_record(long long *out) {
    int n;
    scanf("%d", &n);
    if (n < 1 || n > 100) {
        for (int i = 0; i < n; i++) {
            int skip;
            scanf("%d", &skip);
        }
        return -1;
    }
    int *values = malloc((size_t)n * sizeof *values);
    if (values == NULL) {
        return -1;
    }
    int negative = 0;
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
        if (values[i] < 0) {
            negative = 1;
        }
    }
    if (negative) {
        return -1;
    }
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += values[i];
    }
    free(values);
    *out = sum;
    return 0;
}
${PROCESS_TAIL}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

int sum_record(long long *out) {
    int n;
    scanf("%d", &n);
    if (n < 1 || n > 100) {
        for (int i = 0; i < n; i++) {
            int skip;
            scanf("%d", &skip);
        }
        return -1;
    }
    int *values = malloc((size_t)n * sizeof *values);
    if (values == NULL) {
        return -1;
    }
    int negative = 0;
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
        if (values[i] < 0) {
            negative = 1;
        }
    }
    if (negative) {
        free(values);
        return -1;
    }
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += values[i];
    }
    free(values);
    *out = sum;
    return 0;
}
${PROCESS_TAIL}`,
      explanation: `
В функции четыре выхода. Первые два происходят до выделения или при его неудаче — освобождать нечего. Последний освобождает блок. А выход для записи с отрицательным числом случается **после** успешного \`malloc\` и теряет блок. На корректных данных утечки нет, поэтому её легко пропустить, тестируя только «хорошие» записи.

Правило проверки: для каждого \`return\` перечислите ресурсы, полученные выше по коду, и убедитесь, что каждый либо освобождён, либо передан вызывающему коду.`,
      examples: [
        { in: '2\n3\n1 2 3\n2\n5 -1\n', out: '6\ninvalid\n' },
        { in: '1\n0\n', out: 'invalid\n' },
      ],
      hidden: [
        { in: '1\n1\n-5\n', name: 'Одно отрицательное' },
        {
          in: '1\n101\n' + Array.from({ length: 101 }, () => '1').join(' ') + '\n',
          name: 'Слишком много',
        },
        { in: '3\n2\n-1 -2\n2\n3 4\n1\n0\n', name: 'Неверная запись первой' },
        { in: '2\n4\n1000000 1000000 1000000 1000000\n2\n1 2\n', name: 'Большие суммы' },
        { in: '1\n5\n1 2 3 4 -5\n', name: 'Отрицательное в конце' },
        { in: '1\n-3\n', name: 'Отрицательное n' },
        { in: '4\n1\n7\n1\n-7\n1\n8\n1\n-8\n', name: 'Чередование' },
        { in: '1\n3\n0 0 0\n', name: 'Нули' },
      ],
    },
    {
      title: 'Найди ошибку: перезаписанный указатель',
      bug: true,
      description: `
Программа читает слова до конца ввода и печатает самое длинное (первое из самых длинных) и количество слов. Каждое слово функция \`read_word\` возвращает в новом блоке — освобождать его должен вызывающий код.

Ответ правильный, но память утекает. Исправьте \`main\` так, чтобы освобождался каждый блок, кроме того, который ещё нужен.`,
      constraints: ['Слов — от 1 до 1000, каждое до 63 символов.'],
      hints: [
        'Сколько блоков возвращает read_word и сколько из них освобождается?',
        'Если новое слово длиннее — освободите старое longest и сохраните новое; иначе освободите новое слово сразу.',
      ],
      starter: String.raw`
${LONGEST_HEAD}

int main(void) {
    char *longest = NULL;
    int count = 0;
    char *word;
    while ((word = read_word()) != NULL) {
        count++;
        if (longest == NULL || strlen(word) > strlen(longest)) {
            longest = word;
        }
    }
    if (longest != NULL) {
        printf("%s %d\n", longest, count);
    }
    free(longest);
    return 0;
}`,
      solution: String.raw`
${LONGEST_HEAD}

int main(void) {
    char *longest = NULL;
    int count = 0;
    char *word;
    while ((word = read_word()) != NULL) {
        count++;
        if (longest == NULL || strlen(word) > strlen(longest)) {
            free(longest);
            longest = word;
        } else {
            free(word);
        }
    }
    if (longest != NULL) {
        printf("%s %d\n", longest, count);
    }
    free(longest);
    return 0;
}`,
      explanation: `
\`read_word\` передаёт владение каждым блоком в \`main\`. Исходная программа теряет два вида блоков: короткие слова, которые просто отбрасываются, и прежний \`longest\`, когда его заменяет новое слово — присваивание \`longest = word\` стирает последний указатель на старый блок.

После исправления у каждого блока есть ровно один путь к \`free\`: либо сразу, либо при замене, либо в конце программы. Ни одного блока не освобождается дважды — \`longest\` и \`word\` никогда не указывают на один блок в момент \`free\`.`,
      examples: [
        { in: 'a abc ab\n', out: 'abc 3\n' },
        { in: 'single\n', out: 'single 1\n' },
      ],
      hidden: [
        { in: 'aa bb cc\n', name: 'Равная длина' },
        { in: 'a bb ccc dddd\n', name: 'Каждое следующее длиннее' },
        { in: 'dddd ccc bb a\n', name: 'Каждое следующее короче' },
        { in: 'x y z w v\n', name: 'Однобуквенные' },
        {
          in: `${Array.from({ length: 1000 }, (_, i) => 'w'.repeat((i % 7) + 1)).join(' ')}\n`,
          name: 'Тысяча слов',
        },
        { in: `short ${'L'.repeat(63)} mid\n`, name: 'Максимальная длина' },
        { in: 'one\ntwo\nthree\n', name: 'По строкам' },
        { in: 'ab abc abcd abc ab\n', name: 'Пик в середине' },
      ],
    },
    {
      title: 'Найди ошибку: косвенная утечка',
      bug: true,
      description: `
Программа читает \`n\` команд. Каждая команда — название, количество участников и их имена. Функция \`team_read\` создаёт структуру в куче вместе со всеми строками; \`main\` печатает команду и вызывает \`team_destroy\`.

LeakSanitizer сообщает о косвенных утечках. Допишите \`team_destroy\` так, чтобы она освобождала всё, чем владеет команда.`,
      constraints: ['1 ≤ n ≤ 10.', '1 ≤ участников ≤ 20.', 'Имена и названия — до 31 символа.'],
      hints: [
        'Чем владеет struct Team? Посмотрите, что выделяет team_read: структуру, name, массив members и каждую строку members[i].',
        'Освобождайте изнутри наружу: строки участников, массив members, name, структуру.',
      ],
      starter: String.raw`
${TEAM}

void team_destroy(struct Team *t) {
    free(t);
}
${TEAM_MAIN}`,
      solution: String.raw`
${TEAM}

void team_destroy(struct Team *t) {
    if (t == NULL) {
        return;
    }
    for (int i = 0; i < t->count; i++) {
        free(t->members[i]);
    }
    free(t->members);
    free(t->name);
    free(t);
}
${TEAM_MAIN}`,
      explanation: `
\`free(t)\` освобождает только блок самой структуры — 24 байта с тремя полями. Строка названия, массив указателей и строки участников остаются в куче, а единственные указатели на них лежали в только что освобождённой структуре. LeakSanitizer помечает их как **indirect leak**: их потеряли вместе с владельцем.

Функция \`destroy\` должна быть зеркалом функции создания: всё, что \`team_read\` выделила, \`team_destroy\` освобождает — в обратном порядке.`,
      examples: [
        { in: '1\nred 2 ann bob\n', out: 'red: ann bob\n' },
        { in: '2\na 1 x\nb 1 y\n', out: 'a: x\nb: y\n' },
      ],
      hidden: [
        { in: '1\nsolo 1 me\n', name: 'Один участник' },
        { in: '1\nbig 5 a b c d e\n', name: 'Пять участников' },
        {
          in: `1\nmax 20 ${Array.from({ length: 20 }, (_, i) => `m${i}`).join(' ')}\n`,
          name: 'Двадцать участников',
        },
        { in: '3\nx 1 a\ny 2 b c\nz 3 d e f\n', name: 'Три команды' },
        {
          in: '1\nabcdefghijklmnopqrstuvwxyz01234 1 abcdefghijklmnopqrstuvwxyz56789\n',
          name: 'Длинные имена',
        },
        { in: '2\nsame 2 x x\nsame 2 x x\n', name: 'Одинаковые' },
        {
          in: `10\n${Array.from({ length: 10 }, (_, i) => `t${i} 2 p${i} q${i}`).join('\n')}\n`,
          name: 'Десять команд',
        },
        { in: '1\nteam 3 ann bob cid\n', name: 'Три участника' },
      ],
    },
    {
      title: 'Последние k записей',
      difficulty: 'advanced',
      description: `
Журнал хранит только **последние \`k\`** сообщений. Прочитайте \`k\`, затем сообщения (слова) до конца ввода. Каждое сообщение копируйте в новый блок; когда журнал полон, самое старое сообщение вытесняется — его блок нужно освободить.

В конце напечатайте количество вытесненных сообщений, затем оставшиеся — от старых к новым, каждое на своей строке.`,
      constraints: ['1 ≤ k ≤ 50.', 'Сообщений — до 1000, каждое до 31 символа.'],
      hints: [
        'Кольцевой буфер: char *log[50] = {NULL}; позиция записи pos = (pos + 1) % k.',
        'Перед записью в log[pos] освободите старое сообщение: free(log[pos]) — для пустой ячейки это free(NULL).',
        'Самое старое сообщение после заполнения лежит в log[pos] (там, куда будет следующая запись). Печатайте k ячеек начиная с pos, пропуская NULL.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int k;
    scanf("%d", &k);
    char *log[50] = {NULL};
    int pos = 0, evicted = 0;
    char buffer[32];
    while (scanf("%31s", buffer) == 1) {
        char *copy = malloc(strlen(buffer) + 1);
        if (copy == NULL) {
            break;
        }
        strcpy(copy, buffer);
        if (log[pos] != NULL) {
            evicted++;
        }
        free(log[pos]);
        log[pos] = copy;
        pos = (pos + 1) % k;
    }
    printf("%d\n", evicted);
    for (int i = 0; i < k; i++) {
        int index = (pos + i) % k;
        if (log[index] != NULL) {
            printf("%s\n", log[index]);
        }
    }
    for (int i = 0; i < k; i++) {
        free(log[i]);
    }
    return 0;
}`,
      explanation: `
Ячейка журнала владеет своим сообщением. Запись нового сообщения в занятую ячейку — это замена значения, и старый блок нужно освободить **до** того, как указатель на него будет перезаписан. \`free(NULL)\` позволяет не различать пустые и занятые ячейки.

Благодаря вытеснению программа держит в памяти не больше \`k\` сообщений, сколько бы их ни пришло, — так устроены журналы в долгоживущих сервисах. Без \`free\` при замене память росла бы с каждым сообщением, хотя журнал «хранит» только последние \`k\`.`,
      examples: [
        { in: '2\na b c d\n', out: '2\nc\nd\n' },
        { in: '5\nx y\n', out: '0\nx\ny\n' },
      ],
      hidden: [
        { in: '1\nonly\n', name: 'k = 1, одно сообщение' },
        { in: '1\na b c\n', name: 'k = 1, вытеснение' },
        { in: '3\na b c\n', name: 'Ровно k' },
        { in: '3\na b c d\n', name: 'k + 1' },
        { in: '3\n', name: 'Нет сообщений' },
        {
          in: `50\n${Array.from({ length: 1000 }, (_, i) => `m${i}`).join(' ')}\n`,
          name: 'Тысяча сообщений',
        },
        { in: '4\nsame same same same same same\n', name: 'Одинаковые сообщения' },
        { in: `2\n${'x'.repeat(31)} y ${'z'.repeat(31)}\n`, name: 'Длинные сообщения' },
      ],
    },
  ],
};
