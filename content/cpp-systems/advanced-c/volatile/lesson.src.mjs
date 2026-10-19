const DEVICE = String.raw`
#include <stdint.h>
#include <stdio.h>
#include <string.h>

// ---- модель устройства (не меняйте) ----
#define STATUS_READY 0x1u
#define STATUS_ERROR 0x2u

static volatile uint32_t device_status;      // регистр состояния
static volatile uint32_t device_data;        // регистр данных
static long ready_in, error_in;
static uint32_t pending;

static void device_start(long ready_after, long error_after, uint32_t value) {
    device_status = 0;
    device_data = 0;
    ready_in = ready_after;
    error_in = error_after;
    pending = value;
}

// Один такт времени: устройство может стать готовым или сообщить об ошибке.
static void device_tick(void) {
    if (error_in > 0 && --error_in == 0) {
        device_status |= STATUS_ERROR;
    }
    if (ready_in > 0 && --ready_in == 0 && !(device_status & STATUS_ERROR)) {
        device_data = pending;
        device_status |= STATUS_READY;
    }
}
// ---- конец модели ----`;

const DEVICE_MAIN = String.raw`
int main(void) {
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "start") == 0) {
            long ready_after, error_after;
            uint32_t value;
            if (scanf("%ld %ld %u", &ready_after, &error_after, &value) != 3) {
                break;
            }
            device_start(ready_after, error_after, value);
        } else if (strcmp(command, "read") == 0) {
            long timeout, waited = 0;
            uint32_t value = 0;
            if (scanf("%ld", &timeout) != 1) {
                break;
            }
            int status = read_value(&device_status, &device_data, timeout, &value, &waited);
            if (status == 0) {
                printf("значение %u за %ld тактов\n", value, waited);
            } else if (status == -1) {
                printf("таймаут после %ld тактов\n", waited);
            } else {
                printf("ошибка устройства после %ld тактов\n", waited);
            }
        }
    }
    return 0;
}`;

export default {
  id: 'advanced-volatile',
  title: 'volatile: обращения, которые нельзя убрать',
  description:
    'Правило «как если бы» и почему компилятор убирает обращения к памяти; квалификатор volatile и наблюдаемость каждого обращения; указатели на volatile и const volatile; регистры устройств, флаги сигналов volatile sig_atomic_t, setjmp/longjmp; чего volatile не делает и atomics C11; очистка секретов.',
  moduleId: 'advanced-c',
  order: 21,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['advanced-bit-masks'],
  objectives: [
    'Объяснять, какие обращения к памяти компилятор вправе убрать и что меняет volatile',
    'Писать обработчики сигналов, которые только ставят флаг volatile sig_atomic_t',
    'Применять setjmp/longjmp и защищать изменённые локальные переменные с помощью volatile',
    'Отличать volatile от средств синхронизации потоков',
  ],
  tags: ['volatile', 'Сигналы', 'setjmp', 'sig_atomic_t', 'Оптимизация'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Почему цикл while (!ready) { } может стать бесконечным при -O2, если ready меняет обработчик сигнала, а переменная объявлена как обычный int?',
      options: [
        'Компилятор видит, что в цикле ready не меняется, и читает её один раз',
        'Обработчик сигнала не может менять глобальные переменные',
        'При -O2 сигналы не доставляются',
        'Цикл без тела всегда бесконечен',
      ],
      correct: 0,
      explain:
        'По правилу «как если бы» компилятор вправе вынести чтение из цикла: для абстрактной машины значение не может измениться. volatile запрещает такую оптимизацию.',
    },
    {
      q: 'Что гарантирует квалификатор volatile?',
      options: [
        'Каждое чтение и запись объекта выполняется так, как написано в коде',
        'Операции с объектом атомарны',
        'Объект виден всем потокам без синхронизации',
        'Объект хранится в регистре процессора',
      ],
      correct: 0,
      explain:
        'Обращения к volatile — часть наблюдаемого поведения. Атомарности и межпоточной синхронизации volatile не даёт.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <signal.h>
#include <stdio.h>

static volatile sig_atomic_t hits = 0;

static void handler(int sig) {
    signal(sig, handler);       // переустановить: реакция могла сброситься
    hits = hits + 1;
}

int main(void) {
    signal(SIGINT, handler);
    raise(SIGINT);
    raise(SIGINT);
    printf("%d\n", (int)hits);
    return 0;
}`,
      answers: ['2'],
      placeholder: 'Вывод программы',
      explain:
        'Каждый raise синхронно вызывает обработчик, и он увеличивает счётчик. Строка signal(sig, handler) внутри обработчика важна: в строгом режиме C17 glibc перед вызовом обработчика возвращает действие по умолчанию, и без переустановки второй SIGINT завершил бы программу.',
    },
    {
      q: 'Что можно делать в обработчике сигнала по стандарту C? Выберите все.',
      options: [
        'Записать значение в переменную типа volatile sig_atomic_t',
        'Вызвать printf',
        'Вызвать malloc',
        'Вернуться из обработчика',
      ],
      correct: [0, 3],
      explain:
        'printf и malloc не рассчитаны на повторный вход: сигнал мог прервать программу внутри них. Обработчик ставит флаг и возвращается, а работа выполняется в основном цикле.',
    },
    {
      q: 'Как объявить указатель status на регистр, который меняет устройство, а программа только читает?',
      options: [
        'const volatile uint32_t *status;',
        'volatile uint32_t *const status;',
        'uint32_t *const volatile status;',
        'const uint32_t *status;',
      ],
      correct: 0,
      explain:
        'Квалификаторы перед типом относятся к объекту по указателю: volatile — меняется извне, const — программа не пишет. В варианте volatile uint32_t *const константен сам указатель, а писать в регистр можно; const uint32_t * без volatile позволит компилятору не перечитывать регистр.',
    },
    {
      q: 'Локальная переменная функции, вызвавшей setjmp, изменена после setjmp и прочитана после longjmp. Что нужно, чтобы её значение было определено?',
      answers: ['volatile'],
      placeholder: 'Квалификатор',
      explain:
        'Без volatile значение такой переменной после longjmp не определено: она могла жить в регистре, а longjmp восстанавливает регистры на момент setjmp.',
    },
    {
      q: 'Два потока одновременно выполняют counter++ для volatile int counter. Что верно?',
      options: [
        'Возможна гонка: часть увеличений потеряется; нужен _Atomic или мьютекс',
        'volatile делает увеличение атомарным',
        'Компилятор выдаст ошибку',
        'Результат всегда будет верным, но медленным',
      ],
      correct: 0,
      explain:
        'counter++ — это чтение, сложение и запись. volatile лишь запрещает их убирать, но не делает неделимыми. Для потоков — atomic_int и atomic_fetch_add.',
    },
    {
      q: 'Почему компилятор вправе удалить memset(password, 0, sizeof password) перед выходом из функции?',
      options: [
        'После записи массив больше не читается, и запись не влияет на наблюдаемое поведение',
        'memset нельзя применять к локальным массивам',
        'Компилятор всегда удаляет memset с нулём',
        'Так требует стандарт для безопасности',
      ],
      correct: 0,
      explain:
        'С точки зрения абстрактной машины такая запись бесполезна. Для гарантированной очистки — explicit_bzero, memset_s или запись через указатель на volatile.',
    },
  ],
  exercises: [
    {
      title: 'Остановка по сигналу',
      difficulty: 'beginner',
      description: `
Программа читает слова до конца ввода. Числа она складывает. Слово \`INT\` имитирует нажатие Ctrl+C: программа посылает себе сигнал вызовом \`raise(SIGINT)\`.

Установите обработчик \`SIGINT\`, который только записывает 1 во флаг типа \`volatile sig_atomic_t\`. Основной цикл проверяет флаг **перед** чтением каждого следующего слова; если флаг установлен, программа печатает \`остановка по сигналу\` и прекращает чтение.

В конце (в любом случае) напечатайте \`сумма: S, чисел: N\`.`,
      constraints: [
        'Слов не больше 100; числа — целые от −10⁹ до 10⁹; других слов, кроме чисел и INT, нет.',
      ],
      hints: [
        'static volatile sig_atomic_t stop_requested = 0; и обработчик static void on_interrupt(int sig) { (void)sig; stop_requested = 1; }. Установка — signal(SIGINT, on_interrupt) в начале main.',
        'Цикл: while (!stop_requested && scanf("%31s", word) == 1) { … }. После цикла проверьте флаг и напечатайте сообщение об остановке.',
        'Отличить число от INT поможет strcmp(word, "INT") == 0; число получите через sscanf(word, "%lld", &value).',
      ],
      solution: String.raw`
#include <signal.h>
#include <stdio.h>
#include <string.h>

static volatile sig_atomic_t stop_requested = 0;

static void on_interrupt(int sig) {
    (void)sig;
    stop_requested = 1;
}

int main(void) {
    signal(SIGINT, on_interrupt);
    long long sum = 0;
    int count = 0;
    char word[32];
    while (!stop_requested && scanf("%31s", word) == 1) {
        if (strcmp(word, "INT") == 0) {
            raise(SIGINT);
            continue;
        }
        long long value;
        if (sscanf(word, "%lld", &value) == 1) {
            sum += value;
            count++;
        }
    }
    if (stop_requested) {
        printf("остановка по сигналу\n");
    }
    printf("сумма: %lld, чисел: %d\n", sum, count);
    return 0;
}`,
      explanation: `
Обработчик сигнала может сработать посреди любой операции основной программы, поэтому он делает минимум — ставит флаг. Вся работа, включая вывод, остаётся в основном цикле: он проверяет флаг перед каждой итерацией и завершается аккуратно, напечатав итог. Так устроено корректное завершение серверов и утилит по Ctrl+C.

Тип \`sig_atomic_t\` гарантирует, что запись не прервётся на середине, а \`volatile\` — что цикл перечитывает флаг из памяти. Без \`signal(...)\` сработало бы действие по умолчанию: \`SIGINT\` завершил бы программу, и итог не был бы напечатан.`,
      examples: [
        { in: '1 2 INT 3\n', out: 'остановка по сигналу\nсумма: 3, чисел: 2\n' },
        { in: '10 20 30\n', out: 'сумма: 60, чисел: 3\n' },
      ],
      hidden: [
        { in: '', name: 'Пустой ввод' },
        { in: 'INT 5\n', name: 'Сигнал сразу' },
        { in: '1 2 3 INT\n', name: 'Сигнал в конце' },
        { in: '-5 7 INT INT 9\n', name: 'Два сигнала' },
        { in: '1000000000 1000000000 1000000000\n', name: 'Большие числа' },
        { in: '4\nINT\n8\n', name: 'Слова на разных строках' },
        { in: '0 0 0 0 INT 1\n', name: 'Нули' },
        { in: '-1 -2 -3\n', name: 'Отрицательные' },
      ],
    },
    {
      title: 'Опрос устройства с таймаутом',
      description: `
В заготовке — модель устройства с двумя регистрами: \`device_status\` (бит 0 — данные готовы, бит 1 — ошибка) и \`device_data\`. Функция \`device_tick()\` продвигает время устройства на один такт. Функция \`main\` обрабатывает команды:
- \`start R E V\` — устройство станет готовым через \`R\` тактов со значением \`V\`, а через \`E\` тактов сообщит об ошибке (\`E = 0\` — никогда);
- \`read T\` — прочитать значение, ожидая не больше \`T\` тактов.

Напишите функцию

\`\`\`c
int read_value(const volatile uint32_t *status, const volatile uint32_t *data,
               long timeout, uint32_t *out, long *waited);
\`\`\`

Она в цикле читает регистр состояния: если установлен бит ошибки — возвращает −2; если бит готовности — записывает \`*data\` в \`*out\` и возвращает 0; если уже прошло \`timeout\` тактов — возвращает −1; иначе вызывает \`device_tick()\` и увеличивает \`*waited\`. Проверка выполняется до каждого такта, в том числе до первого.`,
      constraints: ['0 ≤ R, E, T ≤ 10⁶; команд не больше 20; перед каждым read есть start.'],
      hints: [
        'Каркас: for (;;) { uint32_t s = *status; if (s & STATUS_ERROR) return -2; if (s & STATUS_READY) { … return 0; } if (*waited == timeout) return -1; device_tick(); (*waited)++; }.',
        'Регистр состояния читайте один раз за итерацию в локальную переменную: так оба бита проверяются в одном и том же состоянии устройства.',
        'Параметры объявлены как const volatile: функция только читает регистры, а меняет их «устройство».',
      ],
      starter: `${DEVICE}

// Напишите функцию read_value.
${DEVICE_MAIN}`,
      solution: String.raw`${DEVICE}

int read_value(const volatile uint32_t *status, const volatile uint32_t *data, long timeout,
               uint32_t *out, long *waited) {
    for (;;) {
        uint32_t s = *status;                  // одно чтение регистра за итерацию
        if (s & STATUS_ERROR) {
            return -2;
        }
        if (s & STATUS_READY) {
            *out = *data;
            return 0;
        }
        if (*waited == timeout) {
            return -1;
        }
        device_tick();
        (*waited)++;
    }
}
${DEVICE_MAIN}`,
      explanation: `
Опрос регистра — основной способ общения программы с простыми устройствами: программа раз за разом читает регистр состояния, пока устройство не сообщит о готовности. Регистры объявлены \`volatile\`, поэтому каждое чтение \`*status\` действительно обращается к «железу». Без \`volatile\` оптимизирующий компилятор вправе прочитать регистр один раз до цикла — и функция никогда не увидит готовности.

Квалификатор \`const\` в параметрах означает, что функция регистры только читает. Значение регистра копируется в локальную \`s\` один раз за итерацию: регистр может измениться между двумя чтениями, и проверки ошибки и готовности должны относиться к одному состоянию.

Таймаут обязателен в любом цикле ожидания устройства: если устройство сломалось или не подключено, программа должна сообщить об этом, а не зависнуть.`,
      examples: [
        { in: 'start 3 0 42\nread 10\n', out: 'значение 42 за 3 тактов\n' },
        {
          in: 'start 5 2 7\nread 10\nstart 9 0 1\nread 4\n',
          out: 'ошибка устройства после 2 тактов\nтаймаут после 4 тактов\n',
        },
      ],
      hidden: [
        { in: 'start 1 0 100\nread 1\n', name: 'Готово через такт' },
        { in: 'start 1 0 100\nread 0\n', name: 'Нулевой таймаут' },
        { in: 'start 0 0 5\nread 3\n', name: 'Никогда не готово' },
        { in: 'start 10 10 5\nread 20\n', name: 'Ошибка и готовность одновременно' },
        { in: 'start 1000000 0 4294967295\nread 1000000\n', name: 'Долгое ожидание' },
        { in: 'start 4 0 11\nread 3\nread 3\n', name: 'Повторное чтение после таймаута' },
        { in: 'start 2 0 9\nread 5\nread 5\n', name: 'Повторное чтение готового' },
        { in: 'start 6 3 1\nread 2\nread 2\n', name: 'Ошибка во втором чтении' },
      ],
    },
    {
      title: 'Разбор с восстановлением',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — вложенный список из неотрицательных целых чисел, например \`(1 2 (3 4) 5)\`. Между элементами могут стоять пробелы. Для корректного списка напечатайте \`сумма S, глубина D\` — сумму всех чисел и наибольшую вложенность (у внешнего списка глубина 1; пустой список \`()\` корректен).

При ошибке напечатайте \`ошибка в позиции P после K чисел\`, где \`P\` — номер (с 1) первого символа, на котором стало ясно, что строка неверна (для неожиданного конца строки — её длина + 1), а \`K\` — сколько чисел успешно прочитано до ошибки. Ошибки: строка начинается не с \`(\`, внутри списка встретилось что-то кроме числа, \`(\`, \`)\` и пробела, список не закрыт до конца строки, после внешнего списка есть что-то кроме пробелов.

Разбор напишите рекурсивно, а из глубины рекурсии при ошибке возвращайтесь через \`longjmp\` в функцию, вызвавшую \`setjmp\`. Счётчик чисел — локальная переменная этой функции, которая меняется после \`setjmp\`.`,
      constraints: ['Строки не длиннее 200 символов; числа до 10⁶; строк не больше 20.'],
      hints: [
        'Глобальные данные разбора: jmp_buf on_error, const char *text и позиция pos. Функция fail() запоминает позицию ошибки и вызывает longjmp(on_error, 1).',
        'parse_list(depth, numbers) — после ( в цикле пропускает пробелы и смотрит на символ: цифра — число, ( — рекурсивный вызов, ) — конец списка, конец строки или другое — fail().',
        'Счётчик объявите volatile int numbers в функции с setjmp и передавайте как volatile int *: без volatile его значение после longjmp не определено.',
      ],
      solution: String.raw`
#include <ctype.h>
#include <setjmp.h>
#include <stdio.h>
#include <string.h>

static jmp_buf on_error;
static const char *text;
static size_t pos;
static size_t error_pos;
static long long sum;
static int max_depth;

static void fail(void) {
    error_pos = pos + 1;
    longjmp(on_error, 1);
}

static void skip_spaces(void) {
    while (text[pos] == ' ') {
        pos++;
    }
}

static void parse_list(int depth, volatile int *numbers) {
    if (depth > max_depth) {
        max_depth = depth;
    }
    pos++;                                    // открывающая скобка
    for (;;) {
        skip_spaces();
        char c = text[pos];
        if (c == ')') {
            pos++;
            return;
        }
        if (c == '(') {
            parse_list(depth + 1, numbers);
        } else if (isdigit((unsigned char)c)) {
            long long value = 0;
            while (isdigit((unsigned char)text[pos])) {
                value = value * 10 + (text[pos] - '0');
                pos++;
            }
            sum += value;
            (*numbers)++;
        } else {
            fail();
        }
    }
}

static void check_line(const char *line) {
    volatile int numbers = 0;
    text = line;
    pos = 0;
    sum = 0;
    max_depth = 0;
    if (setjmp(on_error) == 0) {
        if (text[pos] != '(') {
            fail();
        }
        parse_list(1, &numbers);
        skip_spaces();
        if (text[pos] != '\0') {
            fail();
        }
        printf("сумма %lld, глубина %d\n", sum, max_depth);
    } else {
        printf("ошибка в позиции %zu после %d чисел\n", error_pos, numbers);
    }
}

int main(void) {
    char line[256];
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\r\n")] = '\0';
        check_line(line);
    }
    return 0;
}`,
      explanation: `
Ошибка может обнаружиться на любой глубине рекурсии. Возвращать код ошибки из каждой функции и проверять его в каждом вызове — громоздко; \`longjmp\` переносит управление сразу в \`check_line\`, минуя все промежуточные кадры. Так библиотеки на C реализуют подобие исключений.

Счётчик \`numbers\` — локальная переменная функции, вызвавшей \`setjmp\`, и он меняется после \`setjmp\` (через указатель). По стандарту такая переменная после \`longjmp\` сохраняет значение только если она \`volatile\` — иначе компилятор мог держать её в регистре, и \`longjmp\` вернул бы старое значение. Глобальные переменные \`sum\` и \`pos\` этой проблемы не имеют: у них статическое время хранения.

\`longjmp\` не выполняет никакой очистки. Здесь это не важно — разбор не выделяет память. В программе, которая выделяет ресурсы внутри рекурсии, перед \`longjmp\` их пришлось бы освобождать вручную — поэтому в обычном коде предпочитают коды возврата.`,
      examples: [
        {
          in: '(1 2 (3 4) 5)\n(1 (2 x) 3)\n',
          out: 'сумма 15, глубина 2\nошибка в позиции 7 после 2 чисел\n',
        },
        { in: '()\n(1 2\n', out: 'сумма 0, глубина 1\nошибка в позиции 5 после 2 чисел\n' },
      ],
      hidden: [
        { in: 'x\n', name: 'Не скобка в начале' },
        { in: '\n', name: 'Пустая строка' },
        { in: '(((7)))\n', name: 'Глубина 3' },
        { in: '(1 2) 3\n', name: 'Хвост после списка' },
        { in: '(1 2)   \n', name: 'Пробелы после списка' },
        { in: '(10 (20 (30 (40))) 50)\n', name: 'Глубокая вложенность' },
        { in: '(1 -2)\n', name: 'Минус' },
        { in: '( 1000000 1000000 ( ) )\n', name: 'Большие числа и пробелы' },
        { in: '(1 (2 (3 (4\n', name: 'Не закрыто несколько списков' },
        { in: '(1))\n', name: 'Лишняя скобка' },
      ],
    },
  ],
};
