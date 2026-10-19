const CONTACT_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Contact {
    char *name;
    char *phone;
};

char *copy_text(const char *s) {
    char *c = malloc(strlen(s) + 1);
    if (c != NULL) {
        strcpy(c, s);
    }
    return c;
}

void contact_free(struct Contact *c) {
    free(c->name);
    free(c->phone);
}`;

const CONTACT_MAIN = (copy) => String.raw`
int main(void) {
    char name[32], phone[32], updated[32];
    if (scanf("%31s %31s %31s", name, phone, updated) != 3) {
        return 1;
    }
    struct Contact original = {copy_text(name), copy_text(phone)};
    ${copy}
    free(original.phone);
    original.phone = copy_text(updated);
    printf("original: %s %s\n", original.name, original.phone);
    printf("backup: %s %s\n", backup.name, backup.phone);
    contact_free(&original);
    contact_free(&backup);
    return 0;
}`;

const LOG_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Печатает сообщение и забирает владение им: освобождает строку.
void log_and_release(char *message) {
    printf("[log] %s\n", message);
    free(message);
}`;

const BUFFER_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Buffer {
    int *data;
    size_t count;
};`;

const BUFFER_MAIN = String.raw`
int main(void) {
    struct Buffer b = {NULL, 0};
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "fill") == 0) {
            size_t k;
            scanf("%zu", &k);
            buffer_reset(&b);
            b.data = malloc(k * sizeof *b.data);
            if (b.data == NULL) {
                return 1;
            }
            for (size_t i = 0; i < k; i++) {
                b.data[i] = (int)i + 1;
            }
            b.count = k;
        } else if (strcmp(cmd, "sum") == 0) {
            long long sum = 0;
            for (size_t i = 0; i < b.count; i++) {
                sum += b.data[i];
            }
            printf("%lld\n", sum);
        } else {
            buffer_reset(&b);
        }
    }
    buffer_reset(&b);
    return 0;
}`;

export default {
  id: 'memory-double-free',
  title: 'Двойное освобождение',
  description:
    'Повторный free одного блока: последствия для распределителя памяти, два владельца как настоящая причина, отчёты ASan и Valgrind, глубокая копия, передача владения, обнуление после free.',
  moduleId: 'memory-pointers',
  order: 19,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-use-after-free'],
  objectives: [
    'Объяснять последствия двойного освобождения и читать отчёт attempting double-free',
    'Находить двух владельцев одного блока, в том числе после копирования структуры',
    'Исправлять ошибку глубокой копией, передачей владения или заимствованием',
    'Делать функции очистки безопасными для повторного вызова',
  ],
  tags: ['C23', 'Память', 'Double free', 'Владение', 'Найди ошибку'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Сколько раз будет освобождён блок строки в этом коде?',
      code: String.raw`
struct Item { char *title; };
struct Item a = {malloc(10)};
struct Item b = a;
struct Item c = b;
free(a.title);
free(b.title);
free(c.title);`,
      lang: 'c',
      answers: ['3'],
      placeholder: 'Число освобождений',
      explain: 'Все три структуры хранят один адрес. Второй и третий free — двойное освобождение.',
    },
    {
      q: 'Какие исправления убирают двойное освобождение после struct Config backup = original; ? Выберите все.',
      options: [
        'Сделать глубокую копию: backup.path = копия строки original.path',
        'После копирования записать original.path = NULL и освобождать только backup',
        'Не освобождать backup.path, если backup лишь заимствует строку',
        'Вызвать free(backup.path) дважды',
      ],
      correct: [0, 1, 2],
      explain:
        'Глубокая копия, передача владения и заимствование — три способа сделать владельца единственным.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int frees = 0;
    char *p = malloc(8);
    for (int i = 0; i < 3; i++) {
        free(p);
        p = NULL;
        frees++;
    }
    printf("%d %d\n", frees, p == NULL);
    return 0;
}`,
      answers: ['3 1'],
      placeholder: 'Вывод программы',
      explain:
        'Первый free освобождает блок, затем p = NULL, и два следующих вызова — это безопасный free(NULL).',
    },
    {
      q: 'Блок увеличен так: int *bigger = realloc(old, n); и bigger != NULL. Что нужно освобождать в конце?',
      options: ['Только bigger', 'old и bigger', 'Только old', 'Ничего — realloc освобождает сам'],
      correct: 0,
      explain:
        'Если блок переехал, realloc уже освободила old. Если остался на месте, bigger == old. В обоих случаях освобождается только bigger.',
    },
    {
      q: 'Какое сообщение обычно выдаёт glibc при двойном освобождении без санитайзеров?',
      options: [
        'free(): double free detected in tcache 2, затем аварийное завершение',
        'Предупреждение компилятора',
        'Ничего — программа продолжает работу корректно',
        'Segmentation fault при компиляции',
      ],
      correct: 0,
      explain:
        'Проверка в glibc ловит только простые случаи. Многие двойные освобождения проходят незаметно и портят кучу.',
    },
    {
      q: 'Почему двойное освобождение — уязвимость безопасности?',
      options: [
        'Испорченная куча может выдать один блок двум владельцам, и злоумышленник перезапишет чужие данные',
        'free печатает адреса в консоль',
        'Двойной free удаляет файл программы',
        'Это не уязвимость, а только утечка',
      ],
      correct: 0,
      explain:
        'Распределитель хранит списки свободных блоков; дважды добавленный блок выдаётся дважды.',
    },
    {
      q: 'Функция void consume(char *s) по документации забирает владение строкой. Что верно? Выберите все.',
      options: [
        'После вызова consume(s) вызывающий код не должен освобождать s',
        'После вызова consume(s) вызывающий код не должен обращаться к s',
        'Вызывающий код обязан вызвать free(s) после consume',
        'consume можно передать строковый литерал',
      ],
      correct: [0, 1],
      explain:
        'Передача владения означает, что освобождает получатель. Литерал нельзя освобождать, поэтому передавать его в consume нельзя.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: копия записи',
      bug: true,
      description: `
Программа читает контакт (имя и телефон) и новый телефон. Она делает резервную копию контакта, затем меняет телефон в оригинале и печатает обе записи. Резервная копия должна сохранить **старый** телефон.

Программа печатает мусор и падает. Исправьте создание резервной копии: напишите глубокое копирование.`,
      constraints: ['Имя и телефоны — до 31 символа без пробелов.'],
      hints: [
        'Какие поля у original и backup указывают на одни и те же блоки?',
        'Глубокая копия: struct Contact backup = {copy_text(original.name), copy_text(original.phone)}; — у каждой записи свои строки, и contact_free для обеих корректен.',
      ],
      starter: `${CONTACT_HEAD}\n${CONTACT_MAIN('struct Contact backup = original;')}`,
      solution: `${CONTACT_HEAD}\n${CONTACT_MAIN('struct Contact backup = {copy_text(original.name), copy_text(original.phone)};')}`,
      explanation: `
\`struct Contact backup = original;\` копирует два адреса, и записи начинают делить строки. Замена телефона освобождает общий блок — у резервной копии остаётся висячий \`phone\` (use-after-free при печати), а в конце обе записи освобождают одно и то же имя (double free).

Глубокая копия создаёт новые строки для резервной записи. Теперь у каждого блока ровно один владелец, и \`contact_free\` для обеих записей освобождает разные блоки.`,
      examples: [
        { in: 'anna 111 222\n', out: 'original: anna 222\nbackup: anna 111\n' },
        { in: 'bob +7-900 +7-901\n', out: 'original: bob +7-901\nbackup: bob +7-900\n' },
      ],
      hidden: [
        { in: 'x 1 1\n', name: 'Тот же телефон' },
        { in: 'abcdefghijklmnopqrstuvwxyz01234 0 9\n', name: 'Длинное имя' },
        { in: 'cid 1234567890123456789012345678901 5\n', name: 'Длинный старый телефон' },
        { in: 'dan 5 1234567890123456789012345678901\n', name: 'Длинный новый телефон' },
        { in: 'eve 000 999\n', name: 'Нули и девятки' },
        { in: 'f a b\n', name: 'Однобуквенные' },
        { in: 'george 555-1234 555-4321\n', name: 'С дефисами' },
        { in: 'h 12 21\n', name: 'Переставленные цифры' },
      ],
    },
    {
      title: 'Найди ошибку: функция забирает владение',
      bug: true,
      description: `
Функция \`log_and_release\` по документации **забирает владение** сообщением: печатает его и освобождает. Программа читает \`q\` слов, создаёт для каждого сообщение \`#номер слово\` в куче, передаёт его в журнал, а затем печатает длину сообщения. Программа аварийно завершается.

Исправьте \`main\`, не меняя \`log_and_release\`.`,
      constraints: ['1 ≤ q ≤ 20.', 'Слова — до 31 символа.'],
      hints: [
        'Кто освобождает message после вызова log_and_release? Сколько раз?',
        'Длину вычислите до передачи владения: size_t length = strlen(message); — и уберите обращения к message после вызова.',
      ],
      starter: String.raw`
${LOG_HEAD}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 1; i <= q; i++) {
        char word[32];
        scanf("%31s", word);
        char *message = malloc(48);
        if (message == NULL) {
            return 1;
        }
        snprintf(message, 48, "#%d %s", i, word);
        log_and_release(message);
        printf("length=%zu\n", strlen(message));
        free(message);
    }
    return 0;
}`,
      solution: String.raw`
${LOG_HEAD}

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 1; i <= q; i++) {
        char word[32];
        scanf("%31s", word);
        char *message = malloc(48);
        if (message == NULL) {
            return 1;
        }
        snprintf(message, 48, "#%d %s", i, word);
        size_t length = strlen(message);
        log_and_release(message);
        printf("length=%zu\n", length);
    }
    return 0;
}`,
      explanation: `
После \`log_and_release(message)\` строка принадлежит журналу, и тот её уже освободил. В исходном \`main\` две ошибки сразу: \`strlen(message)\` — use-after-free, а \`free(message)\` — двойное освобождение.

Передача владения — одностороннее действие: после него вызывающий код не трогает объект вовсе. Всё, что нужно от объекта, берётся **до** передачи.`,
      examples: [
        { in: '2\nhello world\n', out: '[log] #1 hello\nlength=8\n[log] #2 world\nlength=8\n' },
        { in: '1\nx\n', out: '[log] #1 x\nlength=4\n' },
      ],
      hidden: [
        { in: '1\nabcdefghijklmnopqrstuvwxyz01234\n', name: 'Длинное слово' },
        { in: '3\na bb ccc\n', name: 'Разная длина' },
        {
          in: `12\n${Array.from({ length: 12 }, (_, i) => `w${i}`).join(' ')}\n`,
          name: 'Двузначные номера',
        },
        { in: '2\nsame same\n', name: 'Одинаковые слова' },
        { in: '1\n42\n', name: 'Число как слово' },
        {
          in: `20\n${Array.from({ length: 20 }, () => 'z').join(' ')}\n`,
          name: 'Двадцать сообщений',
        },
        { in: '2\nup down\n', name: 'Два слова' },
        { in: '3\nC++ C# C\n', name: 'Спецсимволы' },
      ],
    },
    {
      title: 'Найди ошибку: повторная очистка',
      bug: true,
      description: `
Буфер чисел обрабатывает команды: \`fill k\` (заменить содержимое числами 1…k), \`sum\` (напечатать сумму) и \`reset\` (очистить). В конце программа ещё раз очищает буфер. Если команда \`reset\` встречается хотя бы раз, программа падает.

Исправьте \`buffer_reset\` так, чтобы её можно было вызывать сколько угодно раз.`,
      constraints: ['Команд — до 50.', '1 ≤ k ≤ 10 000.'],
      hints: [
        'Что лежит в b.data после первого buffer_reset? Что сделает следующий вызов?',
        'После free(b->data) запишите b->data = NULL; b->count = 0; — повторный free(NULL) безопасен, а sum увидит пустой буфер.',
      ],
      starter: String.raw`
${BUFFER_HEAD}

void buffer_reset(struct Buffer *b) {
    free(b->data);
}
${BUFFER_MAIN}`,
      solution: String.raw`
${BUFFER_HEAD}

void buffer_reset(struct Buffer *b) {
    free(b->data);
    b->data = NULL;
    b->count = 0;
}
${BUFFER_MAIN}`,
      explanation: `
Исходная \`buffer_reset\` освобождает блок, но оставляет в структуре и висячий указатель, и старый счётчик. Следующий вызов (\`fill\`, \`reset\` или финальная очистка) освобождает тот же блок повторно, а \`sum\` после \`reset\` читает освобождённую память.

Функция очистки должна оставлять объект в **корректном пустом состоянии**: \`data = NULL\`, \`count = 0\`. Тогда повторная очистка — это \`free(NULL)\`, а любые операции над пустым буфером работают как над пустым.`,
      examples: [
        { in: 'fill 3\nsum\nreset\nsum\n', out: '6\n0\n' },
        { in: 'fill 4\nfill 2\nsum\n', out: '3\n' },
      ],
      hidden: [
        { in: 'reset\nreset\nsum\n', name: 'Очистка пустого' },
        { in: 'fill 1\nreset\n', name: 'Очистка в конце' },
        { in: 'fill 10000\nsum\n', name: 'Большой буфер' },
        { in: 'sum\n', name: 'Сумма пустого' },
        { in: 'fill 5\nreset\nfill 5\nsum\nreset\nreset\n', name: 'Несколько очисток' },
        { in: 'fill 2\nsum\nfill 3\nsum\nfill 4\nsum\n', name: 'Перезаполнение' },
        { in: 'fill 100\nreset\nsum\nfill 100\nsum\n', name: 'Сумма после очистки' },
        { in: 'fill 7\n', name: 'Без печати' },
      ],
    },
    {
      title: 'Передача владения',
      difficulty: 'advanced',
      description: `
Есть два списка строк — \`inbox\` и \`archive\` (до 50 строк каждый). Команды до конца ввода:
- \`add w\` — добавить копию слова в конец \`inbox\`;
- \`move i\` — **переместить** строку \`inbox[i]\` в конец \`archive\` (без копирования символов: переходит указатель вместе с владением); если индекса нет — напечатать \`bad index\`;
- \`print\` — напечатать \`inbox: …\` и \`archive: …\` (слова через пробел).

В конце освободите все строки обоих списков — каждую ровно один раз.`,
      constraints: ['Команд — до 100.', 'Слова — до 31 символа.', 'В inbox не больше 50 строк.'],
      hints: [
        'Перемещение: archive[archive_count++] = inbox[i]; затем удалите элемент из inbox сдвигом memmove — у строки остаётся один владелец.',
        'Не вызывайте free при перемещении и не копируйте строку: блок тот же, меняется только список-владелец.',
        'Пустой список печатайте как "inbox:" без пробела в конце — удобно печатать " %s" перед каждым словом.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void print_list(const char *title, char **items, int count) {
    printf("%s:", title);
    for (int i = 0; i < count; i++) {
        printf(" %s", items[i]);
    }
    printf("\n");
}

int main(void) {
    char *inbox[50], *archive[50];
    int inbox_count = 0, archive_count = 0;
    char cmd[8];
    while (scanf("%7s", cmd) == 1) {
        if (strcmp(cmd, "add") == 0) {
            char word[32];
            scanf("%31s", word);
            char *copy = malloc(strlen(word) + 1);
            if (copy == NULL) {
                break;
            }
            strcpy(copy, word);
            inbox[inbox_count++] = copy;
        } else if (strcmp(cmd, "move") == 0) {
            int i;
            scanf("%d", &i);
            if (i < 0 || i >= inbox_count) {
                printf("bad index\n");
                continue;
            }
            archive[archive_count++] = inbox[i];
            memmove(&inbox[i], &inbox[i + 1], (size_t)(inbox_count - i - 1) * sizeof inbox[0]);
            inbox_count--;
        } else {
            print_list("inbox", inbox, inbox_count);
            print_list("archive", archive, archive_count);
        }
    }
    for (int i = 0; i < inbox_count; i++) {
        free(inbox[i]);
    }
    for (int i = 0; i < archive_count; i++) {
        free(archive[i]);
    }
    return 0;
}`,
      explanation: `
Перемещение передаёт владение: указатель записывается в \`archive\` и **убирается** из \`inbox\` сдвигом. В каждый момент адрес строки хранится ровно в одном списке, поэтому финальная очистка двух списков освобождает каждую строку один раз.

Если бы \`move\` только копировала указатель, не удаляя его из \`inbox\`, строка оказалась бы у двух владельцев, и очистка освободила бы её дважды. Если бы \`move\` копировала символы, пришлось бы освобождать оригинал — лишняя работа. Передача указателя — самый дешёвый и при этом безопасный вариант.`,
      examples: [
        { in: 'add a\nadd b\nadd c\nmove 1\nprint\n', out: 'inbox: a c\narchive: b\n' },
        { in: 'move 0\nprint\n', out: 'bad index\ninbox:\narchive:\n' },
      ],
      hidden: [
        { in: 'add x\nmove 0\nprint\n', name: 'Переместить единственную' },
        { in: 'add a\nadd b\nmove 0\nmove 0\nprint\n', name: 'Переместить всё' },
        { in: 'add a\nmove 1\nmove -1\nprint\n', name: 'Неверные индексы' },
        { in: 'add a\nadd b\nadd c\nmove 2\nmove 0\nprint\n', name: 'С конца и с начала' },
        { in: 'add one\nadd two\nprint\n', name: 'Без перемещений' },
        {
          in: `${Array.from({ length: 50 }, (_, i) => `add w${i}`).join('\n')}\n${'move 0\n'.repeat(25)}print\n`,
          name: 'Пятьдесят строк',
        },
        { in: 'add same\nadd same\nmove 1\nprint\n', name: 'Одинаковые слова' },
        {
          in: 'print\nadd abcdefghijklmnopqrstuvwxyz01234\nmove 0\nprint\n',
          name: 'Длинное слово',
        },
      ],
    },
  ],
};
