const ACCOUNT_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Account {
    char owner[32];
    long long balance;
};

struct Account *account_open(void) {
    struct Account *a = malloc(sizeof *a);
    if (a == NULL || scanf("%31s", a->owner) != 1) {
        free(a);
        return NULL;
    }
    a->balance = 0;
    return a;
}

void account_close(struct Account *a) {
    printf("closed %s\n", a->owner);
    free(a);
}`;

const LIST_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

struct Node *read_list(void) {
    struct Node *head = NULL, **tail = &head;
    int x;
    while (scanf("%d", &x) == 1) {
        struct Node *node = malloc(sizeof *node);
        if (node == NULL) {
            break;
        }
        node->value = x;
        node->next = NULL;
        *tail = node;
        tail = &node->next;
    }
    return head;
}

void free_list(struct Node *head) {
    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
}`;

const LIST_TAIL = String.raw`
int main(void) {
    struct Node *head = read_list();
    int removed = remove_negative(&head);
    for (struct Node *n = head; n != NULL; n = n->next) {
        printf("%d ", n->value);
    }
    printf("(removed %d)\n", removed);
    free_list(head);
    return 0;
}`;

const TASKS_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>

struct Task {
    char name[24];
    int duration;
};`;

const TASKS_READ = String.raw`
    int n;
    scanf("%d", &n);
    struct Task *all[50] = {NULL};
    for (int i = 0; i < n; i++) {
        all[i] = malloc(sizeof *all[i]);
        if (all[i] == NULL) {
            return 1;
        }
        scanf("%23s %d", all[i]->name, &all[i]->duration);
    }
    struct Task *queue[50];
    int length;
    scanf("%d", &length);
    for (int i = 0; i < length; i++) {
        int id;
        scanf("%d", &id);
        queue[i] = all[id];
    }
    int c;
    scanf("%d", &c);`;

const TASKS_RUN = String.raw`
    int total = 0;
    for (int i = 0; i < length; i++) {
        if (queue[i] != NULL) {
            printf("%s ", queue[i]->name);
            total += queue[i]->duration;
        }
    }
    printf("total=%d\n", total);
    for (int i = 0; i < n; i++) {
        free(all[i]);
    }
    return 0;
}`;

export default {
  id: 'memory-use-after-free',
  title: 'Use-after-free',
  description:
    'Обращение к освобождённой памяти: почему ошибка опасна и часто незаметна, полный разбор отчёта AddressSanitizer с тремя стеками, типичные места появления и правильные способы исправления.',
  moduleId: 'memory-pointers',
  order: 18,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-dangling-pointer'],
  objectives: [
    'Объяснять, почему use-after-free опасен и почему часто «работает»',
    'Читать отчёт heap-use-after-free: место обращения, освобождения, выделения и смещение',
    'Находить use-after-free в порядке операций, функциях-закрывателях, циклах и при нескольких ссылках',
    'Исправлять ошибку изменением времени жизни или копированием данных, а не удалением free',
  ],
  tags: ['C17', 'Память', 'Use-after-free', 'AddressSanitizer', 'Найди ошибку'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие три места программы показывает отчёт heap-use-after-free?',
      options: [
        'Обращение к памяти, освобождение блока и выделение блока',
        'Объявление переменной, вызов main и выход из программы',
        'Только место обращения',
        'Место компиляции, линковки и запуска',
      ],
      correct: 0,
      explain:
        'Три стека — вся история объекта: где создан, где уничтожен и где использован после уничтожения.',
    },
    {
      q: 'Структура: char name[16]; int count;. Отчёт говорит READ of size 4, located 16 bytes inside of 20-byte region. К какому полю было обращение?',
      options: ['count', 'name', 'name[4]', 'К байтам за концом структуры'],
      correct: 0,
      explain:
        'Первые 16 байтов занимает name, поле int count начинается со смещения 16 и занимает 4 байта.',
    },
    {
      q: 'Почему use-after-free без санитайзера часто даёт правильный результат?',
      options: [
        'free не стирает данные; пока блок не переиспользован, старые байты на месте',
        'Компилятор откладывает free до конца программы',
        'free копирует данные в новое место',
        'Чтение освобождённой памяти разрешено стандартом',
      ],
      correct: 0,
      explain:
        'Поведение не определено: как только блок займёт новый объект, программа прочитает чужие данные или испортит их.',
    },
    {
      q: 'Какие исправления use-after-free правильные? Выберите все.',
      options: [
        'Скопировать нужное значение в локальную переменную до вызова free',
        'Перенести free после последнего обращения к объекту',
        'Удалить free, чтобы санитайзер не ругался',
        'Добавить проверку if (p != NULL) после free(p)',
      ],
      correct: [0, 1],
      explain:
        'Удаление free превращает ошибку в утечку. Проверка на NULL бесполезна: free не обнуляет указатель.',
    },
    {
      q: 'Что не так с этим циклом?',
      code: String.raw`
for (struct Node *n = head; n != NULL; n = n->next) {
    if (n->value == 0) {
        free(n);
    }
}`,
      lang: 'c',
      options: [
        'После free(n) шаг n = n->next читает поле освобождённого узла',
        'Цикл никогда не заканчивается',
        'free нельзя вызывать внутри for',
        'Ничего, это корректный код',
      ],
      correct: 0,
      explain:
        'Следующий узел нужно запомнить до free. Кроме того, предыдущий узел продолжит указывать на удалённый.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *score = malloc(sizeof *score);
    if (score == NULL) {
        return 1;
    }
    *score = 42;
    int saved = *score;
    free(score);
    score = NULL;
    printf("%d %d\n", saved, score == NULL);
    return 0;
}`,
      answers: ['42 1'],
      placeholder: 'Вывод программы',
      explain:
        'Значение скопировано до free, а указатель обнулён явно. Ни одного обращения к освобождённому блоку нет.',
    },
    {
      q: 'Почему use-after-free считается уязвимостью безопасности?',
      options: [
        'Освобождённый блок может занять объект с данными злоумышленника, и программа будет использовать их как свои',
        'free отправляет данные по сети',
        'Освобождённая память видна другим процессам',
        'Он замедляет программу',
      ],
      correct: 0,
      explain:
        'Если на месте старого объекта окажутся подконтрольные данные — например, указатель на функцию, — программа может выполнить чужой код.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: итог после закрытия',
      difficulty: 'beginner',
      bug: true,
      description: `
Программа открывает счёт (имя владельца), читает \`n\` операций (положительные — пополнение, отрицательные — списание), затем закрывает счёт функцией \`account_close\` и печатает итоговый баланс.

AddressSanitizer сообщает \`heap-use-after-free\`. Исправьте \`main\`, сохранив порядок вывода: сначала строка \`closed …\`, затем \`balance=…\`.`,
      constraints: ['0 ≤ n ≤ 100.', '|операция| ≤ 10⁹.'],
      hints: [
        'Что делает account_close с объектом? Какая строка main обращается к нему после этого?',
        'Сохраните баланс в локальную переменную до закрытия: long long final = a->balance;',
      ],
      starter: String.raw`
${ACCOUNT_HEAD}

int main(void) {
    struct Account *a = account_open();
    if (a == NULL) {
        return 1;
    }
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        long long amount;
        scanf("%lld", &amount);
        a->balance += amount;
    }
    account_close(a);
    printf("balance=%lld\n", a->balance);
    return 0;
}`,
      solution: String.raw`
${ACCOUNT_HEAD}

int main(void) {
    struct Account *a = account_open();
    if (a == NULL) {
        return 1;
    }
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        long long amount;
        scanf("%lld", &amount);
        a->balance += amount;
    }
    long long final = a->balance;
    account_close(a);
    printf("balance=%lld\n", final);
    return 0;
}`,
      explanation: `
\`account_close\` освобождает объект, а следующая строка \`main\` читает его поле. Отчёт санитайзера покажет обращение в \`main\`, освобождение в \`account_close\` и выделение в \`account_open\`.

Порядок вывода требует закрыть счёт раньше, чем напечатать баланс, поэтому нужное значение **копируется** заранее. Перенести \`account_close\` ниже было бы тоже корректно с точки зрения памяти, но изменило бы порядок строк.`,
      examples: [
        { in: 'anna\n3\n100 -30 5\n', out: 'closed anna\nbalance=75\n' },
        { in: 'bob\n0\n', out: 'closed bob\nbalance=0\n' },
      ],
      hidden: [
        { in: 'x\n1\n-50\n', name: 'Отрицательный баланс' },
        { in: 'max\n2\n1000000000 1000000000\n', name: 'Большой баланс' },
        { in: 'min\n2\n-1000000000 -1000000000\n', name: 'Большой долг' },
        { in: 'abcdefghijklmnopqrstuvwxyz01234\n1\n1\n', name: 'Длинное имя' },
        { in: 'z\n4\n10 -10 10 -10\n', name: 'Ноль в итоге' },
        {
          in: `many\n100\n${Array.from({ length: 100 }, (_, i) => i - 50).join(' ')}\n`,
          name: 'Сто операций',
        },
        { in: 'q\n1\n7\n', name: 'Одна операция' },
        { in: 'w\n3\n1 2 3\n', name: 'Только пополнения' },
      ],
    },
    {
      title: 'Найди ошибку: удаление в цикле',
      bug: true,
      description: `
Функция \`remove_negative\` удаляет из односвязного списка все узлы с отрицательными значениями, освобождая их, и возвращает количество удалённых. На списках без отрицательных чисел всё работает, иначе — \`heap-use-after-free\`.

Исправьте \`remove_negative\`.`,
      constraints: ['Чисел — от 0 до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'Какое выражение выполняется после free(n) в заголовке цикла for?',
        'Запоминайте следующий узел до освобождения: struct Node *next = n->next; … n = next; — и не обновляйте prev при удалении.',
      ],
      starter: String.raw`
${LIST_HEAD}

int remove_negative(struct Node **head) {
    int removed = 0;
    struct Node *prev = NULL;
    for (struct Node *n = *head; n != NULL; n = n->next) {
        if (n->value < 0) {
            if (prev == NULL) {
                *head = n->next;
            } else {
                prev->next = n->next;
            }
            free(n);
            removed++;
        } else {
            prev = n;
        }
    }
    return removed;
}
${LIST_TAIL}`,
      solution: String.raw`
${LIST_HEAD}

int remove_negative(struct Node **head) {
    int removed = 0;
    struct Node *prev = NULL;
    struct Node *n = *head;
    while (n != NULL) {
        struct Node *next = n->next;
        if (n->value < 0) {
            if (prev == NULL) {
                *head = next;
            } else {
                prev->next = next;
            }
            free(n);
            removed++;
        } else {
            prev = n;
        }
        n = next;
    }
    return removed;
}
${LIST_TAIL}`,
      explanation: `
В исходном цикле шаг \`n = n->next\` выполняется **после** тела, где узел уже освобождён. Связи в списке перешиты правильно, ошибка только в том, откуда берётся следующий узел.

Сохранение \`next\` до \`free\` разрывает зависимость от освобождённой памяти. Узел \`prev\` при удалении не меняется: предыдущим для следующего узла остаётся тот же сохранённый узел.`,
      examples: [
        { in: '3 -1 4 -1 5\n', out: '3 4 5 (removed 2)\n' },
        { in: '1 2 3\n', out: '1 2 3 (removed 0)\n' },
      ],
      hidden: [
        { in: '-1\n', name: 'Единственный отрицательный' },
        { in: '-1 -2 -3\n', name: 'Все отрицательные' },
        { in: '-5 1 2\n', name: 'Первый отрицательный' },
        { in: '1 2 -5\n', name: 'Последний отрицательный' },
        { in: '', name: 'Пустой список' },
        { in: '0 -0 0\n', name: 'Нули' },
        {
          in: `${Array.from({ length: 1000 }, (_, i) => (i % 3 === 0 ? -i - 1 : i)).join(' ')}\n`,
          name: 'Тысяча узлов',
        },
        { in: '-1000000000 1000000000 -1 1\n', name: 'Крайние значения' },
      ],
    },
    {
      title: 'Найди ошибку: два владельца',
      difficulty: 'advanced',
      bug: true,
      description: `
Задачи хранятся в массиве \`all\` (он владеет ими) и дополнительно перечислены в очереди выполнения \`queue\` (она только ссылается). Программа читает \`n\` задач, очередь из номеров задач и \`c\` отмен. Отмена освобождает задачу. Затем программа «выполняет» очередь: печатает названия оставшихся задач и суммарную длительность.

При отмене задачи, стоящей в очереди, AddressSanitizer сообщает \`heap-use-after-free\`. Исправьте обработку отмены.`,
      constraints: [
        '1 ≤ n ≤ 50.',
        'В очереди от 0 до 50 номеров, номера могут повторяться.',
        'Отменяемые номера различны.',
      ],
      hints: [
        'Очередь хранит копии указателей. Что происходит с ними, когда all[id] освобождается?',
        'При отмене пройдите по очереди и замените все указатели на отменённую задачу на NULL — цикл выполнения уже пропускает NULL. Затем освободите задачу и обнулите all[id].',
      ],
      starter: String.raw`
${TASKS_HEAD}

int main(void) {${TASKS_READ}
    for (int i = 0; i < c; i++) {
        int id;
        scanf("%d", &id);
        free(all[id]);
        all[id] = NULL;
    }
${TASKS_RUN}`,
      solution: String.raw`
${TASKS_HEAD}

int main(void) {${TASKS_READ}
    for (int i = 0; i < c; i++) {
        int id;
        scanf("%d", &id);
        for (int k = 0; k < length; k++) {
            if (queue[k] == all[id]) {
                queue[k] = NULL;
            }
        }
        free(all[id]);
        all[id] = NULL;
    }
${TASKS_RUN}`,
      explanation: `
Обнуление \`all[id]\` защищает только сам массив \`all\`. Очередь хранит **копии** того же адреса, и они продолжают указывать на освобождённую задачу. Это типичная ситуация с двумя ссылками на объект: владелец удаляет объект, не сообщив остальным.

Исправление — при удалении убрать все заимствованные ссылки. В больших программах для этого используют либо обратные ссылки (объект знает, где на него ссылаются), либо дескрипторы с поколением из прошлого урока.`,
      examples: [
        { in: '3\na 5\nb 7\nc 2\n3\n0 1 2\n1\n1\n', out: 'a c total=7\n' },
        { in: '2\nx 1\ny 2\n2\n1 1\n0\n', out: 'y y total=4\n' },
      ],
      hidden: [
        { in: '1\nonly 3\n1\n0\n1\n0\n', name: 'Отменена единственная' },
        { in: '2\na 1\nb 2\n4\n0 1 0 1\n1\n0\n', name: 'Повторы в очереди' },
        { in: '3\na 1\nb 2\nc 3\n2\n0 2\n1\n1\n', name: 'Отменена задача вне очереди' },
        { in: '3\na 1\nb 2\nc 3\n3\n2 1 0\n3\n0\n1\n2\n', name: 'Отменено всё' },
        { in: '2\na 10\nb 20\n0\n1\n0\n', name: 'Пустая очередь' },
        { in: '4\np 1\nq 2\nr 3\ns 4\n4\n3 2 1 0\n2\n3\n0\n', name: 'Отмена с краёв' },
        { in: '3\nlong_task_name_1234567 100\nb 1\nc 1\n2\n0 0\n0\n', name: 'Без отмен' },
        { in: '5\na 1\nb 1\nc 1\nd 1\ne 1\n5\n4 4 4 4 4\n1\n4\n', name: 'Одна задача много раз' },
      ],
    },
    {
      title: 'Удаление из списка по значению',
      description: `
Обработайте команды до конца ввода над односвязным списком целых чисел:
- \`add x\` — добавить \`x\` в конец;
- \`del x\` — удалить **все** узлы со значением \`x\` и напечатать, сколько удалено;
- \`print\` — напечатать список через пробел или \`empty\`.

В конце освободите все узлы. Удобный приём — указатель на указатель \`struct Node **link\`, который указывает либо на \`head\`, либо на поле \`next\` предыдущего узла.`,
      constraints: ['Команд — до 1000.', '|x| ≤ 10⁹.'],
      hints: [
        'Удаление: struct Node **link = &head; while (*link) { if ((*link)->value == x) { struct Node *dead = *link; *link = dead->next; free(dead); } else link = &(*link)->next; }',
        'Добавление в конец: тот же приём — дойти до link, где *link == NULL, и записать туда новый узел.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Node {
    int value;
    struct Node *next;
};

int main(void) {
    struct Node *head = NULL;
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "print") == 0) {
            if (head == NULL) {
                printf("empty\n");
            }
            for (struct Node *n = head; n != NULL; n = n->next) {
                printf(n->next ? "%d " : "%d\n", n->value);
            }
            continue;
        }
        int x;
        scanf("%d", &x);
        struct Node **link = &head;
        if (strcmp(cmd, "add") == 0) {
            while (*link != NULL) {
                link = &(*link)->next;
            }
            struct Node *node = malloc(sizeof *node);
            if (node == NULL) {
                break;
            }
            node->value = x;
            node->next = NULL;
            *link = node;
        } else {
            int removed = 0;
            while (*link != NULL) {
                if ((*link)->value == x) {
                    struct Node *dead = *link;
                    *link = dead->next;
                    free(dead);
                    removed++;
                } else {
                    link = &(*link)->next;
                }
            }
            printf("%d\n", removed);
        }
    }
    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
    return 0;
}`,
      explanation: `
\`link\` указывает на то место, где хранится указатель на текущий узел: на переменную \`head\` или на поле \`next\` предыдущего узла. Удаление — одна запись \`*link = dead->next\`, и первый узел не требует отдельного случая.

После \`free(dead)\` к узлу никто не обращается: следующий узел уже записан в \`*link\`, а \`link\` указывает на поле **живого** узла (или на \`head\`). Поэтому \`link\` не сдвигается после удаления — на этом месте теперь стоит следующий узел, его тоже нужно проверить.`,
      examples: [
        { in: 'add 1\nadd 2\nadd 1\ndel 1\nprint\n', out: '2\n2\n' },
        { in: 'print\ndel 5\n', out: 'empty\n0\n' },
      ],
      hidden: [
        { in: 'add 7\ndel 7\nprint\n', name: 'Удалить единственный' },
        { in: 'add 1\nadd 1\nadd 1\ndel 1\nprint\n', name: 'Все одинаковые' },
        { in: 'add 1\nadd 2\nadd 3\ndel 3\nprint\ndel 1\nprint\n', name: 'Края списка' },
        { in: 'add 5\nadd 6\ndel 9\nprint\n', name: 'Нечего удалять' },
        { in: 'add 2\nadd 2\nadd 3\nadd 2\nadd 2\ndel 2\nprint\n', name: 'Подряд идущие' },
        {
          in: `${Array.from({ length: 500 }, (_, i) => `add ${i % 5}`).join('\n')}\ndel 0\ndel 4\nprint\n`,
          name: 'Пятьсот узлов',
        },
        {
          in: 'add -1000000000\nadd 1000000000\nprint\ndel -1000000000\nprint\n',
          name: 'Крайние значения',
        },
        { in: 'add 1\nadd 2\nprint\n', name: 'Без удаления' },
      ],
    },
  ],
};
