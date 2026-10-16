const BOOK = (copySize, remove) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Contact {
    char *name;
    char *phone;
};

char *copy_text(const char *s) {
    char *c = malloc(${copySize});
    if (c != NULL) {
        strcpy(c, s);
    }
    return c;
}

int main(void) {
    struct Contact book[50];
    int count = 0;
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "add") == 0) {
            char name[32], phone[32];
            scanf("%31s %31s", name, phone);
            if (count == 50) {
                continue;
            }
            book[count].name = copy_text(name);
            book[count].phone = copy_text(phone);
            count++;
        } else if (strcmp(cmd, "del") == 0) {
            char name[32];
            scanf("%31s", name);
            int found = -1;
            for (int i = 0; i < count; i++) {
                if (strcmp(book[i].name, name) == 0) {
                    found = i;
                    break;
                }
            }
            if (found < 0) {
                printf("not found\n");
                continue;
            }
${remove}
            memmove(&book[found], &book[found + 1], (size_t)(count - found - 1) * sizeof book[0]);
            count--;
            printf("deleted\n");
        } else {
            if (count == 0) {
                printf("empty\n");
            }
            for (int i = 0; i < count; i++) {
                printf("%s %s\n", book[i].name, book[i].phone);
            }
        }
    }
    for (int i = 0; i < count; i++) {
        free(book[i].name);
        free(book[i].phone);
    }
    return 0;
}`;

const RING = (advance) => String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int capacity;
    scanf("%d", &capacity);
    int *items = malloc((size_t)capacity * sizeof *items);
    if (items == NULL) {
        return 1;
    }
    int head = 0, size = 0;
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "push") == 0) {
            int x;
            scanf("%d", &x);
            int tail = (head + size) % ${advance};
            items[tail] = x;
            if (size == capacity) {
                head = (head + 1) % ${advance};
            } else {
                size++;
            }
        } else if (strcmp(cmd, "pop") == 0) {
            if (size == 0) {
                printf("empty\n");
            } else {
                printf("%d\n", items[head]);
                head = (head + 1) % ${advance};
                size--;
            }
        } else {
            printf("%d\n", size);
        }
    }
    free(items);
    return 0;
}`;

const CSV_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Record {
    char *name;
    char *city;
    int age;
};`;

const CSV_MAIN = (store, cleanup) => String.raw`
int main(void) {
    int min_age;
    char line[128];
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%d", &min_age) != 1) {
        return 1;
    }
    struct Record records[50];
    int count = 0;
    while (count < 50 && fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\n")] = '\0';
        char *comma1 = strchr(line, ',');
        char *comma2 = comma1 ? strchr(comma1 + 1, ',') : NULL;
        if (comma2 == NULL) {
            continue;
        }
        *comma1 = '\0';
        *comma2 = '\0';
${store}
        records[count].age = atoi(comma2 + 1);
        count++;
    }
    for (int i = 0; i < count; i++) {
        if (records[i].age >= min_age) {
            printf("%s (%s) %d\n", records[i].name, records[i].city, records[i].age);
        }
    }
${cleanup}
    return 0;
}`;

export default {
  id: 'memory-debugging-memory',
  title: 'Практикум: отладка ошибок памяти',
  description:
    'Итоговый практикум модуля: симптомы ошибок памяти и их причины, метод отладки из семи шагов, assert и отладочный вывод, правила кода без ошибок памяти и задачи с несколькими ошибками.',
  moduleId: 'memory-pointers',
  order: 28,
  difficulty: 'advanced',
  estimatedMinutes: 70,
  prerequisites: ['memory-valgrind'],
  objectives: [
    'Сопоставлять симптомы с вероятными причинами ошибок памяти',
    'Применять метод отладки: воспроизведение, инструмент, отчёт, причина, исправление, тест',
    'Использовать assert для проверки инвариантов',
    'Писать и исправлять программы с динамическими строками и структурами без ошибок памяти',
  ],
  tags: ['C17', 'Память', 'Отладка', 'Практикум', 'Найди ошибку'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Программа работает правильно, но после добавления printf для отладки начинает выдавать другой результат. Какая причина вероятнее всего?',
      options: [
        'Порча памяти: выход за границу или use-after-free',
        'printf меняет значения переменных',
        'Ошибка компилятора',
        'Утечка памяти',
      ],
      correct: 0,
      explain:
        'Новый вызов меняет расположение данных на стеке и в куче. Если программа читает чужую память, от этого меняется её поведение.',
    },
    {
      q: 'Расположите первые шаги метода отладки. Какой шаг идёт сразу после «воспроизвести на минимальном входе»?',
      options: [
        'Запустить с AddressSanitizer/UBSan',
        'Исправить подозрительную строку',
        'Добавить тест',
        'Переписать функцию заново',
      ],
      correct: 0,
      explain: 'Сначала нужно получить точный отчёт, и только потом искать причину и исправлять.',
    },
    {
      q: 'ASan сообщает heap-use-after-free в строке 40. Что верно? Выберите все.',
      options: [
        'Строка 40 — место, где ошибка проявилась; причина может быть в другом месте',
        'Нужно посмотреть, где блок освобождён (стек «freed by»)',
        'Достаточно удалить free, указанный в отчёте',
        'Нужно решить, кто владеет объектом и сколько он должен жить',
      ],
      correct: [0, 1, 3],
      explain: 'Удаление free превратит ошибку в утечку. Исправляют время жизни или владение.',
    },
    {
      q: 'Что произойдёт при вызове assert(i < n) с ложным условием в отладочной сборке?',
      options: [
        'Программа остановится и напечатает условие, файл и строку',
        'Условие будет пропущено',
        'Переменная i станет равна n − 1',
        'Компилятор выдаст ошибку',
      ],
      correct: 0,
      explain:
        'При сборке с -DNDEBUG assert отключается, поэтому внутри него нельзя писать код с побочными эффектами.',
    },
    {
      q: 'Какое исправление heap-buffer-overflow при копировании строки правильное?',
      code: String.raw`
char *copy = malloc(strlen(s));
strcpy(copy, s);`,
      lang: 'c',
      options: [
        'malloc(strlen(s) + 1)',
        'malloc(strlen(s) + 16) на всякий случай',
        'Заменить strcpy на memcpy(copy, s, strlen(s)) без нуля',
        'Убрать проверку санитайзера',
      ],
      correct: 0,
      explain:
        'Запас «на всякий случай» прячет неверную формулу, копия без нуля даёт строку без конца. Правильный размер — длина плюс один байт.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char *names[3];
    char buffer[16];
    const char *input[] = {"ann", "bob", "cid"};
    for (int i = 0; i < 3; i++) {
        strcpy(buffer, input[i]);
        names[i] = malloc(strlen(buffer) + 1);
        if (names[i] == NULL) {
            return 1;
        }
        strcpy(names[i], buffer);
    }
    printf("%s %s %s\n", names[0], names[1], names[2]);
    for (int i = 0; i < 3; i++) {
        free(names[i]);
    }
    return 0;
}`,
      answers: ['ann bob cid'],
      placeholder: 'Вывод программы',
      explain:
        'Каждое имя скопировано в собственный блок, поэтому перезапись buffer на них не влияет.',
    },
    {
      q: 'Какие правила снижают вероятность ошибок памяти? Выберите все.',
      options: [
        'Инициализировать переменные при объявлении',
        'Передавать размер буфера вместе с буфером',
        'Хранить указатели на элементы растущего массива дольше одной операции',
        'У каждого блока — один владелец и парная функция destroy',
        'Тестировать только успешные сценарии',
      ],
      correct: [0, 1, 3],
      explain:
        'Указатели на элементы растущего массива становятся висячими после realloc, а ошибки чаще всего прячутся в ветках обработки ошибок.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: телефонная книга',
      bug: true,
      description: `
Телефонная книга обрабатывает команды \`add имя телефон\`, \`del имя\` (печатает \`deleted\` или \`not found\`) и \`list\` (печатает записи или \`empty\`). В программе **две** ошибки памяти. Исправьте обе, действуя по методу: первый отчёт — причина — исправление — повторная проверка.`,
      constraints: ['Команд — до 100.', 'Имена и телефоны — до 31 символа.'],
      hints: [
        'Первая ошибка: сколько байтов выделяет copy_text и сколько записывает strcpy?',
        'Вторая ошибка: что освобождается при удалении записи, а что теряется после memmove?',
      ],
      starter: BOOK('strlen(s)', '            free(book[found].name);'),
      solution: BOOK(
        'strlen(s) + 1',
        '            free(book[found].name);\n            free(book[found].phone);',
      ),
      explanation: `
Первая ошибка — \`malloc(strlen(s))\`: \`strcpy\` записывает завершающий ноль за границу блока, ASan сообщает \`heap-buffer-overflow\` уже на первой команде \`add\`. Вторая видна только после исправления первой: при удалении освобождается имя, но не телефон, а \`memmove\` затирает запись — последний указатель на блок телефона теряется. LeakSanitizer сообщит об утечке в конце программы, и только если в тесте было удаление.

Обе ошибки — нарушение договоров: размер строки и владение каждым полем записи.`,
      examples: [
        { in: 'add ann 111\nadd bob 222\nlist\n', out: 'ann 111\nbob 222\n' },
        { in: 'add ann 111\ndel ann\nlist\ndel ann\n', out: 'deleted\nempty\nnot found\n' },
      ],
      hidden: [
        { in: 'list\n', name: 'Пустая книга' },
        { in: 'add a 1\nadd b 2\nadd c 3\ndel b\nlist\n', name: 'Удаление из середины' },
        { in: 'add a 1\nadd b 2\ndel a\ndel b\nlist\n', name: 'Удалить всё' },
        { in: 'add abcdefghijklmnopqrstuvwxyz01234 +7-900-000-00-00\nlist\n', name: 'Длинное имя' },
        { in: 'add x 1\nadd x 2\ndel x\nlist\n', name: 'Одинаковые имена' },
        { in: 'del ghost\nadd z 9\nlist\n', name: 'Удаление отсутствующего' },
        {
          in: `${Array.from({ length: 30 }, (_, i) => `add n${i} ${i}`).join('\n')}\n${Array.from({ length: 15 }, (_, i) => `del n${i * 2}`).join('\n')}\nlist\n`,
          name: 'Тридцать записей',
        },
        { in: 'add a 1\ndel a\nadd a 2\nlist\n', name: 'Повторное добавление' },
      ],
    },
    {
      title: 'Найди ошибку: кольцевой буфер',
      bug: true,
      description: `
Кольцевой буфер ёмкости \`k\` хранит последние \`k\` чисел. Команды: \`push x\` (если буфер полон, самое старое число вытесняется), \`pop\` (печатает и удаляет самое старое или печатает \`empty\`) и \`size\`. На некоторых последовательностях команд программа выходит за границу массива.

Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ k ≤ 100.', 'Команд — до 500.', '|x| ≤ 10⁹.'],
      hints: [
        'Какие значения может принимать индекс (head + size) % (capacity + 1)? Сколько элементов в массиве items?',
        'Индексы кольцевого буфера берутся по модулю ёмкости: % capacity — во всех трёх местах.',
      ],
      starter: RING('(capacity + 1)'),
      solution: RING('capacity'),
      explanation: `
Массив \`items\` содержит \`capacity\` элементов с индексами \`0 … capacity − 1\`, а остаток по модулю \`capacity + 1\` может равняться \`capacity\` — запись за концом блока. Кроме выхода за границу, неверный модуль ломает и логику: «круг» становится на одну ячейку длиннее массива, и порядок элементов путается.

Ошибки на единицу в модуле — частый спутник кольцевых буферов. Инвариант простой: каждый индекс лежит в \`[0, capacity)\`, а значит, берётся по модулю \`capacity\`.`,
      examples: [
        { in: '3\npush 1\npush 2\npush 3\npush 4\npop\nsize\n', out: '2\n2\n' },
        { in: '2\npop\npush 5\npop\npop\n', out: 'empty\n5\nempty\n' },
      ],
      hidden: [
        { in: '1\npush 1\npush 2\npop\nsize\n', name: 'Ёмкость 1' },
        {
          in: '2\npush 1\npush 2\npush 3\npush 4\npush 5\npop\npop\npop\n',
          name: 'Многократное вытеснение',
        },
        { in: '3\npush 1\npop\npush 2\npop\npush 3\npop\npush 4\npop\n', name: 'Обход по кругу' },
        {
          in: `100\n${Array.from({ length: 250 }, (_, i) => `push ${i}`).join('\n')}\nsize\npop\n`,
          name: 'Ёмкость 100',
        },
        {
          in: '4\nsize\npush -1000000000\npush 1000000000\npop\npop\nsize\n',
          name: 'Крайние значения',
        },
        {
          in: '5\npush 1\npush 2\npush 3\npop\npush 4\npush 5\npush 6\npush 7\npop\npop\n',
          name: 'Смешанные',
        },
        { in: '3\npush 7\npush 8\npop\npop\npop\npush 9\nsize\n', name: 'Опустошение и снова' },
        { in: '2\npush 1\npush 2\npush 3\nsize\npop\npop\n', name: 'Полный буфер' },
      ],
    },
    {
      title: 'Найди ошибку: разбор CSV',
      bug: true,
      description: `
Первая строка ввода — минимальный возраст. Следующие строки — записи \`имя,город,возраст\`. Программа печатает записи с возрастом не меньше минимального в формате \`имя (город) возраст\`. Возрасты печатаются верно, а имена и города у всех записей одинаковые.

Исправьте программу так, чтобы каждая запись хранила свои строки (и не забудьте их освободить).`,
      constraints: ['Записей — до 50.', 'Строка — до 100 символов.'],
      hints: [
        'Куда указывают name и city каждой записи? Что происходит с буфером line при чтении следующей строки?',
        'Копируйте поля в кучу: records[count].name = copy_text(line); — и освобождайте копии в конце.',
      ],
      starter: `${CSV_HEAD}\n${CSV_MAIN('        records[count].name = line;\n        records[count].city = comma1 + 1;', '')}`,
      solution: `${CSV_HEAD}

char *copy_text(const char *s) {
    char *c = malloc(strlen(s) + 1);
    if (c != NULL) {
        strcpy(c, s);
    }
    return c;
}
${CSV_MAIN(
  `        records[count].name = copy_text(line);
        records[count].city = copy_text(comma1 + 1);
        if (records[count].name == NULL || records[count].city == NULL) {
            free(records[count].name);
            free(records[count].city);
            break;
        }`,
  `    for (int i = 0; i < count; i++) {
        free(records[i].name);
        free(records[i].city);
    }`,
)}`,
      explanation: `
Поля \`name\` и \`city\` указывали **внутрь** буфера \`line\`, который перезаписывается каждой следующей строкой. После цикла все указатели смотрят в одну и ту же память, где лежит последняя запись. Санитайзеры молчат: буфер жив, границы не нарушены. Возраст печатается правильно, потому что он скопирован числом.

Копирование в кучу даёт каждой записи собственные строки — и обязанность освободить их. Исправленная программа проверяется LeakSanitizer, поэтому цикл освобождения в конце обязателен.`,
      examples: [
        {
          in: '18\nann,Paris,20\nbob,Oslo,17\ncid,Rome,30\n',
          out: 'ann (Paris) 20\ncid (Rome) 30\n',
        },
        { in: '0\nx,Y,0\n', out: 'x (Y) 0\n' },
      ],
      hidden: [
        { in: '100\nann,Paris,20\n', name: 'Никто не подходит' },
        { in: '1\na,A,1\nb,B,2\nc,C,3\n', name: 'Все подходят' },
        { in: '25\nlongname_person,Saint-Petersburg,25\nz,Q,24\n', name: 'Граница возраста' },
        { in: '10\nbad line\nok,City,11\n', name: 'Строка без запятых' },
        { in: '0\n,Empty,5\nnoname,,6\n', name: 'Пустые поля' },
        {
          in: `20\n${Array.from({ length: 40 }, (_, i) => `p${i},c${i},${i}`).join('\n')}\n`,
          name: 'Сорок записей',
        },
        { in: '30\nann,Paris,30\nann,Paris,31\n', name: 'Одинаковые имена' },
        { in: '5\nal,Rio,5\nbo,Kyiv,4\nce,Lima,6\n', name: 'Три города' },
      ],
    },
    {
      title: 'Мини-словарь',
      difficulty: 'advanced',
      description: `
Реализуйте словарь «строка → число» на динамическом массиве записей \`{ char *key; int value; }\`. Команды до конца ввода:
- \`set k v\` — создать или изменить запись;
- \`get k\` — напечатать значение или \`missing\`;
- \`del k\` — удалить запись, напечатать \`ok\` или \`missing\`;
- \`count\` — напечатать число записей.

Ключи храните копиями в куче, массив записей растите через \`realloc\`, при удалении освобождайте ключ. В конце освободите всё. Порядок записей не важен.`,
      constraints: ['Команд — до 1000.', 'Ключи — до 31 символа.', '|v| ≤ 10⁹.'],
      hints: [
        'Поиск — линейный по strcmp. Функция find возвращает индекс или −1.',
        'Удаление без сдвига: освободить key, перенести последнюю запись на место удалённой, уменьшить count.',
        'set для существующего ключа меняет только value — новый ключ не выделяется, иначе старый утечёт.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Entry {
    char *key;
    int value;
};

struct Dict {
    struct Entry *items;
    int count, capacity;
};

int dict_find(const struct Dict *d, const char *key) {
    for (int i = 0; i < d->count; i++) {
        if (strcmp(d->items[i].key, key) == 0) {
            return i;
        }
    }
    return -1;
}

int dict_set(struct Dict *d, const char *key, int value) {
    int i = dict_find(d, key);
    if (i >= 0) {
        d->items[i].value = value;
        return 0;
    }
    if (d->count == d->capacity) {
        int capacity = d->capacity ? d->capacity * 2 : 4;
        struct Entry *bigger = realloc(d->items, (size_t)capacity * sizeof *bigger);
        if (bigger == NULL) {
            return -1;
        }
        d->items = bigger;
        d->capacity = capacity;
    }
    char *copy = malloc(strlen(key) + 1);
    if (copy == NULL) {
        return -1;
    }
    strcpy(copy, key);
    d->items[d->count].key = copy;
    d->items[d->count].value = value;
    d->count++;
    return 0;
}

int dict_del(struct Dict *d, const char *key) {
    int i = dict_find(d, key);
    if (i < 0) {
        return -1;
    }
    free(d->items[i].key);
    d->items[i] = d->items[d->count - 1];
    d->count--;
    return 0;
}

void dict_free(struct Dict *d) {
    for (int i = 0; i < d->count; i++) {
        free(d->items[i].key);
    }
    free(d->items);
    d->items = NULL;
    d->count = d->capacity = 0;
}

int main(void) {
    struct Dict d = {NULL, 0, 0};
    char cmd[8], key[32];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "count") == 0) {
            printf("%d\n", d.count);
            continue;
        }
        scanf("%31s", key);
        if (strcmp(cmd, "set") == 0) {
            int value;
            scanf("%d", &value);
            if (dict_set(&d, key, value) != 0) {
                break;
            }
        } else if (strcmp(cmd, "get") == 0) {
            int i = dict_find(&d, key);
            if (i < 0) {
                printf("missing\n");
            } else {
                printf("%d\n", d.items[i].value);
            }
        } else {
            printf("%s\n", dict_del(&d, key) == 0 ? "ok" : "missing");
        }
    }
    dict_free(&d);
    return 0;
}`,
      explanation: `
Словарь объединяет всё, что было в модуле. Массив записей растёт удвоением через временный указатель. Каждый ключ — копия в куче, которой владеет словарь; \`set\` для существующего ключа не создаёт копию, а \`del\` освобождает ключ **до** того, как запись затирается последней. Удаление переносом последней записи работает за O(1) и не оставляет дыр.

Обращения к записям идут по индексам, вычисленным заново после каждой операции, поэтому \`realloc\` не создаёт висячих указателей. \`dict_free\` возвращает словарь в пустое состояние — вызвать её повторно безопасно.`,
      examples: [
        { in: 'set a 1\nset b 2\nget a\nset a 5\nget a\ncount\n', out: '1\n5\n2\n' },
        { in: 'get x\ndel x\nset x 3\ndel x\ncount\n', out: 'missing\nmissing\nok\n0\n' },
      ],
      hidden: [
        { in: 'count\n', name: 'Пустой словарь' },
        { in: 'set k 1\nset k 2\nset k 3\ncount\nget k\n', name: 'Перезапись значения' },
        { in: 'set a 1\nset b 2\nset c 3\ndel a\nget c\nget b\ncount\n', name: 'Удаление первого' },
        {
          in: `${Array.from({ length: 300 }, (_, i) => `set key${i} ${i}`).join('\n')}\nget key0\nget key299\ncount\n`,
          name: 'Триста ключей',
        },
        {
          in: `${Array.from({ length: 50 }, (_, i) => `set k${i} ${i}`).join('\n')}\n${Array.from({ length: 50 }, (_, i) => `del k${i}`).join('\n')}\ncount\n`,
          name: 'Добавить и удалить всё',
        },
        {
          in: 'set abcdefghijklmnopqrstuvwxyz01234 -1000000000\nget abcdefghijklmnopqrstuvwxyz01234\n',
          name: 'Длинный ключ',
        },
        { in: 'set a 1\ndel a\nset a 2\nget a\ncount\n', name: 'Повторное создание' },
        { in: 'set x 1\nset y 2\ndel y\ndel y\nget x\n', name: 'Двойное удаление' },
      ],
    },
  ],
};
