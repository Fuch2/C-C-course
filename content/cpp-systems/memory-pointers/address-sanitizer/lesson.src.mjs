const SALES = (index) => String.raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int stores, days;
    scanf("%d %d", &stores, &days);
    int *sales = malloc((size_t)stores * days * sizeof *sales);
    if (sales == NULL) {
        return 1;
    }
    for (int s = 0; s < stores; s++) {
        for (int d = 0; d < days; d++) {
            scanf("%d", &sales[${index}]);
        }
    }
    for (int s = 0; s < stores; s++) {
        long long total = 0;
        for (int d = 0; d < days; d++) {
            total += sales[${index}];
        }
        printf(s + 1 < stores ? "%lld " : "%lld\n", total);
    }
    for (int d = 0; d < days; d++) {
        long long total = 0;
        for (int s = 0; s < stores; s++) {
            total += sales[${index}];
        }
        printf(d + 1 < days ? "%lld " : "%lld\n", total);
    }
    free(sales);
    return 0;
}`;

const CLOCK = (size) => String.raw`
#include <stdio.h>

int main(void) {
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        unsigned minutes;
        scanf("%u", &minutes);
        char text[${size}];
        snprintf(text, sizeof text, "%02u:%02u", minutes / 60 % 24, minutes % 60);
        printf("%s\n", text);
    }
    return 0;
}`;

const DAYS = (mod) => String.raw`
#include <stdio.h>

static const char *const DAYS[7] = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};

int main(void) {
    int start, q;
    scanf("%d %d", &start, &q);
    for (int i = 0; i < q; i++) {
        int offset;
        scanf("%d", &offset);
        printf("%s\n", DAYS[(start + offset) % ${mod}]);
    }
    return 0;
}`;

const WORDS_HEAD = String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char **words = NULL;
    int count = 0, capacity = 0;
    char buffer[32];
    while (scanf("%31s", buffer) == 1) {
        if (count == capacity) {
            capacity = capacity ? capacity * 2 : 4;
            char **bigger = realloc(words, (size_t)capacity * sizeof *bigger);
            if (bigger == NULL) {
                return 1;
            }
            words = bigger;
        }
        words[count] = malloc(strlen(buffer) + 1);
        if (words[count] == NULL) {
            return 1;
        }
        strcpy(words[count], buffer);
        count++;
    }
    printf("%d\n", count);`;

export default {
  id: 'memory-address-sanitizer',
  title: 'AddressSanitizer и UBSan',
  description:
    'Санитайзеры в своём проекте: флаги и переменные окружения, теневая память, красные зоны и карантин, полный список находимых ошибок, ограничения и систематическое чтение отчёта по четырём вопросам.',
  moduleId: 'memory-pointers',
  order: 26,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['memory-endianness'],
  objectives: [
    'Включать ASan и UBSan флагами компилятора и настраивать их переменными окружения',
    'Объяснять устройство ASan: теневая память, красные зоны, карантин, перехват функций',
    'Знать, какие ошибки находят санитайзеры и какие остаются незамеченными',
    'Читать отчёт по четырём вопросам и исправлять несколько ошибок по одной',
  ],
  tags: ['C17', 'Память', 'AddressSanitizer', 'UBSan', 'Отладка'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие флаги нужны, чтобы отчёты ASan содержали имена файлов и номера строк? Выберите все.',
      options: ['-fsanitize=address', '-g', '-O3', '-Wall'],
      correct: [0, 1],
      explain:
        '-fsanitize=address включает проверки, -g добавляет отладочную информацию для стека вызовов.',
    },
    {
      q: 'Какие ошибки AddressSanitizer НЕ обнаруживает? Выберите все.',
      options: [
        'Чтение неинициализированной локальной переменной',
        'Чтение data[6] в векторе с length = 5 и capacity = 8',
        'Чтение за концом блока malloc',
        'Ошибку в ветке кода, которая ни разу не выполнилась',
        'Повторный free',
      ],
      correct: [0, 1, 3],
      explain:
        'ASan проверяет доступность памяти в выполненном коде. Инициализированность и логические границы контейнеров он не знает.',
    },
    {
      q: 'Как называется в отчёте ASan обращение к локальной переменной после выхода из её блока?',
      options: [
        'stack-use-after-scope',
        'heap-use-after-free',
        'stack-buffer-overflow',
        'global-buffer-overflow',
      ],
      correct: 0,
      explain:
        'Use-after-scope — стековый аналог use-after-free: объект существовал, но его блок уже закончился.',
    },
    {
      q: 'Зачем ASan держит освобождённые блоки в карантине?',
      options: [
        'Чтобы use-after-free обнаруживался, даже если после free были новые выделения',
        'Чтобы ускорить malloc',
        'Чтобы находить утечки',
        'Чтобы уменьшить потребление памяти',
      ],
      correct: 0,
      explain:
        'Если бы блок сразу отдавался новому malloc, обращение по старому указателю попало бы в «живую» память и не было бы замечено.',
    },
    {
      q: 'Блок — массив из 4 элементов double. Отчёт: READ of size 8 … 8 bytes to the right of 32-byte region. Элемент с каким индексом был прочитан?',
      answers: ['5'],
      placeholder: 'Индекс',
      explain:
        'Блок занимает индексы 0…3. «0 bytes to the right» — индекс 4, а 8 байтов дальше — индекс 5.',
    },
    {
      q: 'В программе две ошибки памяти. Что увидит программист при первом запуске с ASan?',
      options: [
        'Отчёт только о первой ошибке — программа остановится на ней',
        'Отчёты об обеих ошибках',
        'Ничего: ASan не работает при нескольких ошибках',
        'Только сводку с количеством ошибок',
      ],
      correct: 0,
      explain:
        'ASan останавливает программу на первой ошибке. Исправив её, перезапустите программу.',
    },
    {
      q: 'Что делает переменная окружения UBSAN_OPTIONS=halt_on_error=1?',
      options: [
        'Останавливает программу на первой найденной ошибке UBSan вместо предупреждения',
        'Отключает UBSan',
        'Включает поиск утечек',
        'Печатает отчёты в файл',
      ],
      correct: 0,
      explain:
        'По умолчанию UBSan сообщает об ошибке и продолжает работу. Проверка задач курса останавливает программу.',
    },
  ],
  exercises: [
    {
      title: 'Найди ошибку: таблица продаж',
      difficulty: 'beginner',
      bug: true,
      description: `
Таблица продаж \`stores × days\` хранится в одном блоке. Программа печатает суммы по магазинам (первая строка) и по дням (вторая). На квадратных таблицах всё правильно, на прямоугольных — неверные суммы или \`heap-buffer-overflow\`.

Найдите ошибку по отчёту санитайзера и исправьте её.`,
      constraints: ['1 ≤ stores, days ≤ 30.', '0 ≤ продажи ≤ 10⁶.'],
      hints: [
        'Сколько элементов в строке таблицы? На что умножается номер строки в формуле индекса?',
        'Элемент магазина s и дня d: sales[s * days + d].',
      ],
      starter: SALES('s * stores + d'),
      solution: SALES('s * days + d'),
      explanation: `
В строке таблицы \`days\` элементов, поэтому номер строки умножается на \`days\`. Формула \`s * stores + d\` совпадает с правильной только при \`stores == days\`. Если магазинов больше, чем дней, индекс выходит за блок — ASan показывает \`heap-buffer-overflow\` при чтении данных. Если меньше — индексы остаются в блоке, но строки «наезжают» друг на друга, и ASan молчит: ошибку выдают только неверные суммы.

Это напоминание: санитайзер ловит выход за границы, но не неверную логику. Тестируйте на прямоугольных данных.`,
      examples: [
        { in: '2 2\n1 2\n3 4\n', out: '3 7\n4 6\n' },
        { in: '3 2\n1 2\n3 4\n5 6\n', out: '3 7 11\n9 12\n' },
      ],
      hidden: [
        { in: '2 3\n1 2 3\n4 5 6\n', name: 'Дней больше' },
        { in: '1 5\n1 2 3 4 5\n', name: 'Один магазин' },
        { in: '5 1\n1\n2\n3\n4\n5\n', name: 'Один день' },
        { in: '1 1\n7\n', name: 'Одна клетка' },
        { in: '4 2\n1000000 0\n0 1000000\n1 1\n2 2\n', name: 'Высокая таблица' },
        {
          in: `30 2\n${Array.from({ length: 30 }, (_, i) => `${i} ${2 * i}`).join('\n')}\n`,
          name: 'Тридцать магазинов',
        },
        {
          in: `2 30\n${Array.from({ length: 2 }, (_, s) => Array.from({ length: 30 }, (_, d) => s + d).join(' ')).join('\n')}\n`,
          name: 'Тридцать дней',
        },
        { in: '3 3\n1 0 0\n0 1 0\n0 0 1\n', name: 'Квадрат' },
      ],
    },
    {
      title: 'Найди ошибку: формат времени',
      bug: true,
      description: `
Программа переводит минуты от начала суток в запись \`ЧЧ:ММ\`. Время печатается обрезанным: \`12:0\` вместо \`12:05\`, — хотя \`snprintf\` и защищает от переполнения.

Исправьте ошибку. Подумайте, сколько байтов нужно строке \`ЧЧ:ММ\`.`,
      constraints: ['1 ≤ q ≤ 20.', '0 ≤ минуты ≤ 10⁶ (часы берутся по модулю 24).'],
      hints: [
        'Сколько символов в "12:05" и сколько байтов нужно вместе с завершающим нулём?',
        'Массиву нужно 6 байтов. snprintf не вышла за границу, но честно обрезала результат до 4 символов.',
      ],
      starter: CLOCK('5'),
      solution: CLOCK('6'),
      explanation: `
Строка \`ЧЧ:ММ\` — 5 символов и завершающий ноль, всего 6 байтов. В массив из 5 байтов \`snprintf\` записывает 4 символа и ноль: переполнения нет, санитайзер молчит, но результат неверен. С \`sprintf\` на этом месте было бы \`stack-buffer-overflow\` на один байт.

Ошибки на единицу с \`'\\0'\` — самые частые ошибки строк. \`snprintf\` превращает их из порчи памяти в обрезку, а проверка возвращаемого значения превратила бы и обрезку в явную ошибку.`,
      examples: [
        { in: '2\n725\n0\n', out: '12:05\n00:00\n' },
        { in: '1\n1439\n', out: '23:59\n' },
      ],
      hidden: [
        { in: '1\n60\n', name: 'Час' },
        { in: '1\n1440\n', name: 'Ровно сутки' },
        { in: '1\n1000000\n', name: 'Много суток' },
        { in: '3\n1\n59\n61\n', name: 'Минуты' },
        { in: '1\n720\n', name: 'Полдень' },
        { in: '2\n599\n600\n', name: 'Переход к 10:00' },
        { in: '1\n1380\n', name: '23:00' },
        { in: '4\n100\n200\n300\n400\n', name: 'Сотни минут' },
      ],
    },
    {
      title: 'Найди ошибку: день недели',
      bug: true,
      description: `
Программа получает номер стартового дня недели (0 — понедельник) и \`q\` сдвигов в днях. Для каждого сдвига печатается день недели. Иногда программа печатает мусор или падает; санитайзер сообщает о выходе за глобальный массив.

Найдите и исправьте ошибку.`,
      constraints: ['0 ≤ start ≤ 6.', '1 ≤ q ≤ 20.', '0 ≤ сдвиг ≤ 10⁶.'],
      hints: [
        'Какие индексы может дать выражение (start + offset) % 8? Сколько элементов в DAYS?',
        'Дней в неделе 7: индекс — (start + offset) % 7.',
      ],
      starter: DAYS('8'),
      solution: DAYS('7'),
      explanation: `
Остаток от деления на 8 принимает значения 0…7, а в массиве \`DAYS\` 7 элементов с индексами 0…6. При остатке 7 программа читает элемент за концом глобального массива — \`global-buffer-overflow\` в ASan или \`index 7 out of bounds for type 'const char *const[7]'\` в UBSan. Без санитайзера там лежит что угодно, и \`printf("%s")\` получает мусорный указатель.

Помимо выхода за границу, \`% 8\` давал бы и неверные дни для корректных индексов: неделя повторяется каждые 7 дней.`,
      examples: [
        { in: '0 3\n0\n1\n7\n', out: 'Mon\nTue\nMon\n' },
        { in: '6 1\n1\n', out: 'Mon\n' },
      ],
      hidden: [
        { in: '0 1\n6\n', name: 'Воскресенье' },
        { in: '3 2\n4\n11\n', name: 'Через неделю' },
        { in: '0 1\n1000000\n', name: 'Миллион дней' },
        { in: '5 3\n0\n2\n9\n', name: 'Суббота и далее' },
        { in: '1 7\n0\n1\n2\n3\n4\n5\n6\n', name: 'Вся неделя' },
        { in: '6 2\n6\n13\n', name: 'Из воскресенья' },
        { in: '2 1\n5\n', name: 'Среда плюс пять' },
        { in: '4 2\n14\n15\n', name: 'Две недели' },
      ],
    },
    {
      title: 'Найди ошибку: две ошибки в одной программе',
      difficulty: 'advanced',
      bug: true,
      description: `
Программа читает слова до конца ввода в растущий массив копий, печатает их количество и сами слова в обратном порядке. В ней **две** ошибки памяти. AddressSanitizer сначала сообщит об одной; исправьте её, перезапустите проверку и найдите вторую.`,
      constraints: ['Слов — от 1 до 200, каждое до 31 символа.'],
      hints: [
        'Первая ошибка: какой индекс первым читает цикл печати? Существует ли элемент words[count]?',
        'Вторая ошибка: сколько блоков выделено через malloc и сколько освобождено? Каждое слово — отдельный блок.',
      ],
      starter: String.raw`${WORDS_HEAD}
    for (int i = count; i >= 0; i--) {
        printf(i > 0 ? "%s " : "%s\n", words[i]);
    }
    free(words);
    return 0;
}`,
      solution: String.raw`${WORDS_HEAD}
    for (int i = count - 1; i >= 0; i--) {
        printf(i > 0 ? "%s " : "%s\n", words[i]);
    }
    for (int i = 0; i < count; i++) {
        free(words[i]);
    }
    free(words);
    return 0;
}`,
      explanation: `
Первая ошибка — цикл печати начинается с \`words[count]\`, на один элемент дальше последнего. Если массив заполнен до ёмкости, это чтение за концом блока — \`heap-buffer-overflow\`; если нет — чтение неинициализированного указателя, который \`printf\` попытается разыменовать. Вторая — освобождается лишь массив указателей, а каждая строка утекает: на них больше никто не указывает, и LeakSanitizer сообщает о **direct leak** для каждого слова.

Главный урок задачи — порядок работы: исправить первую ошибку, перезапустить, прочитать новый отчёт. Вторая ошибка была не видна, пока программа падала на первой.`,
      examples: [
        { in: 'one two three\n', out: '3\nthree two one\n' },
        { in: 'solo\n', out: '1\nsolo\n' },
      ],
      hidden: [
        { in: 'a b c d\n', name: 'Ровно начальная ёмкость' },
        { in: 'a b c d e\n', name: 'После первого роста' },
        {
          in: `${Array.from({ length: 200 }, (_, i) => `w${i}`).join(' ')}\n`,
          name: 'Двести слов',
        },
        { in: 'abcdefghijklmnopqrstuvwxyz01234 x\n', name: 'Длинное слово' },
        { in: 'same same same\n', name: 'Одинаковые' },
        { in: 'first\nsecond\n', name: 'По строкам' },
        { in: 'x y z w v u t s\n', name: 'Восемь слов' },
        { in: 'memory safety matters\n', name: 'Три слова' },
      ],
    },
  ],
};
