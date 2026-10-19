const COPY = (fixed) => String.raw`
#include <stdio.h>

static int save_input(const char *path) {
    FILE *out = fopen(path, "wb");
    if (out == NULL) {
        return 0;
    }
    unsigned char chunk[512];
    size_t n;
    while ((n = fread(chunk, 1, sizeof chunk, stdin)) > 0) {
        fwrite(chunk, 1, n, out);
    }
    return fclose(out) == 0;
}

static long file_size(FILE *f) {
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    rewind(f);
    return size;
}

int main(void) {
    if (!save_input("src.bin")) {
        return 1;
    }
    FILE *in = fopen("src.bin", "rb");
    FILE *out = fopen("dst.bin", "wb");
    if (in == NULL || out == NULL) {
        return 1;
    }
    unsigned char buffer[16] = {0};
    size_t n;
    while ((n = fread(buffer, 1, sizeof buffer, in)) > 0) {
        fwrite(buffer, 1, ${fixed ? 'n' : 'sizeof buffer'}, out);
    }
    fclose(out);

    FILE *copy = fopen("dst.bin", "rb");
    if (copy == NULL) {
        return 1;
    }
    long original = file_size(in), copied = file_size(copy);
    int same = original == copied;
    int a, b;
    while (same && (a = fgetc(in)) != EOF) {
        b = fgetc(copy);
        same = a == b;
    }
    printf("размер оригинала %ld, размер копии %ld, %s\n", original, copied,
           same ? "совпадают" : "отличаются");
    fclose(in);
    fclose(copy);
    return 0;
}`;

export default {
  id: 'advanced-fread-fwrite',
  title: 'Блочный ввод-вывод: fread, fwrite, fseek',
  description:
    'fread и fwrite и их результат в элементах; двоичный режим; запись массива как снимок памяти; копирование блоками и последний неполный блок; позиция в файле — fseek, ftell, rewind; размер файла; записи фиксированного размера и произвольный доступ; переключение чтения и записи; tmpfile.',
  moduleId: 'advanced-c',
  order: 24,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-file-stream'],
  objectives: [
    'Читать и записывать данные блоками и правильно проверять результат fread и fwrite',
    'Перемещаться по файлу с помощью fseek, ftell и rewind',
    'Хранить записи фиксированного размера с произвольным доступом',
    'Отличать двоичный режим от текстового и понимать ограничения снимков памяти',
  ],
  tags: ['Файлы', 'fread', 'fwrite', 'fseek', 'Двоичные файлы'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что возвращает fread(records, sizeof(Record), 10, f), если в файле осталось три полные записи?',
      answers: ['3'],
      placeholder: 'Число',
      explain:
        'fread возвращает число полностью прочитанных элементов, а не байтов. Меньше 10 — значит, файл кончился или была ошибка.',
    },
    {
      q: 'Зачем при открытии двоичного файла пишут "rb" вместо "r"?',
      options: [
        'В Windows текстовый режим преобразует \\r\\n и портит двоичные данные; в Linux и macOS разницы нет',
        'Без b нельзя вызывать fread',
        'b ускоряет чтение в несколько раз',
        'b запрещает запись в файл',
      ],
      correct: 0,
      explain:
        'Текстовый режим может менять байты переводов строк. Для байтов, которые должны остаться точно такими же, нужен двоичный режим.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    FILE *f = fopen("x.bin", "wb+");
    if (f == NULL) {
        return 1;
    }
    fputs("0123456789", f);
    fseek(f, -4, SEEK_END);
    putchar(fgetc(f));
    fseek(f, 1, SEEK_SET);
    putchar(fgetc(f));
    fseek(f, 2, SEEK_CUR);
    putchar(fgetc(f));
    printf(" %ld\n", ftell(f));
    fclose(f);
    return 0;
}`,
      answers: ['614 5'],
      placeholder: 'Вывод программы',
      explain:
        'Четыре байта до конца — позиция 6. Затем позиция 1 — символ 1, после чтения позиция 2; сдвиг на 2 — позиция 4, символ 4, после чтения позиция 5.',
    },
    {
      q: 'Как узнать размер двоичного файла, открытого в потоке f?',
      options: [
        'fseek(f, 0, SEEK_END), затем ftell(f)',
        'sizeof(f)',
        'Прочитать файл через fgets и посчитать строки',
        'ftell(f) сразу после открытия',
      ],
      correct: 0,
      explain:
        'ftell возвращает текущую позицию, а после перехода в конец она равна размеру. sizeof(f) — размер указателя.',
    },
    {
      q: 'В цикле копирования последний fread вернул 44 байта при буфере на 128. Что нужно передать в fwrite?',
      answers: ['44'],
      placeholder: 'Число байтов',
      explain:
        'Записывают ровно столько, сколько прочитано. 128 байтов дописали бы в копию 84 байта мусора из предыдущего блока.',
    },
    {
      q: 'По какому смещению лежит запись номер 5 (считая с нуля) в файле записей по 24 байта?',
      answers: ['120'],
      placeholder: 'Смещение в байтах',
      explain: 'Запись i начинается с i · sizeof(Record) = 5 · 24 = 120.',
    },
    {
      q: 'Что нужно сделать в потоке "r+b" между fread и fwrite?',
      options: ['Вызвать fseek (или fflush)', 'Ничего', 'Закрыть файл', 'Вызвать feof'],
      correct: 0,
      explain:
        'Переключение между чтением и записью без перехода позиции или fflush — неопределённое поведение. Обычно и так нужен fseek: вернуться к началу записи, которую только что прочитали.',
    },
    {
      q: 'Почему структуру с полем char *name нельзя сохранить в файл через fwrite, чтобы потом прочитать в другой программе?',
      options: [
        'В файл попадёт адрес строки, а не её символы; в другой программе этот адрес ничего не значит',
        'fwrite не умеет записывать структуры',
        'Указатели всегда равны NULL при записи',
        'Строки нельзя записывать в двоичные файлы',
      ],
      correct: 0,
      explain:
        'fwrite копирует байты структуры как есть. Сами данные нужно хранить в структуре (char name[32]) или записывать отдельно — например, длину и символы.',
    },
  ],
  exercises: [
    {
      title: 'Копирование блоками',
      difficulty: 'beginner',
      description: `
В первой строке ввода — размер блока \`k\`. Всё, что идёт после этой строки до конца ввода, — содержимое файла (любые байты, включая переводы строк).

Запишите содержимое в файл \`src.bin\`, затем скопируйте \`src.bin\` в \`dst.bin\` блоками по \`k\` байтов с помощью \`fread\` и \`fwrite\`, и сравните файлы побайтно. Напечатайте \`блоков B, байтов N, копия совпадает\` (или \`копия отличается\`), где \`B\` — число вызовов \`fread\`, которые прочитали хотя бы один байт, а \`N\` — размер копии.`,
      constraints: ['1 ≤ k ≤ 4096; содержимое не длиннее 10 000 байтов.'],
      hints: [
        'Первую строку прочитайте fgets и переведите в число через sscanf. Содержимое — fread(chunk, 1, sizeof chunk, stdin) в цикле и fwrite в src.bin.',
        'Буфер размера k выделите через malloc(k) — размер известен только во время работы. Не забудьте free.',
        'Сравнение: откройте оба файла "rb" и читайте их по одному байту fgetc, пока не кончится первый; затем убедитесь, что второй тоже кончился.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>

static int same_files(const char *a, const char *b) {
    FILE *fa = fopen(a, "rb");
    FILE *fb = fopen(b, "rb");
    int same = fa != NULL && fb != NULL;
    while (same) {
        int ca = fgetc(fa), cb = fgetc(fb);
        if (ca != cb) {
            same = 0;
        } else if (ca == EOF) {
            break;
        }
    }
    if (fa != NULL) {
        fclose(fa);
    }
    if (fb != NULL) {
        fclose(fb);
    }
    return same;
}

int main(void) {
    char line[32];
    size_t k;
    if (fgets(line, sizeof line, stdin) == NULL || sscanf(line, "%zu", &k) != 1 || k == 0) {
        return 1;
    }
    FILE *src = fopen("src.bin", "wb");
    if (src == NULL) {
        return 1;
    }
    unsigned char chunk[512];
    size_t n;
    while ((n = fread(chunk, 1, sizeof chunk, stdin)) > 0) {
        fwrite(chunk, 1, n, src);
    }
    fclose(src);

    unsigned char *buffer = malloc(k);
    FILE *in = fopen("src.bin", "rb");
    FILE *out = fopen("dst.bin", "wb");
    if (buffer == NULL || in == NULL || out == NULL) {
        free(buffer);
        return 1;
    }
    size_t blocks = 0, total = 0;
    while ((n = fread(buffer, 1, k, in)) > 0) {
        fwrite(buffer, 1, n, out);
        blocks++;
        total += n;
    }
    fclose(in);
    fclose(out);
    free(buffer);
    printf("блоков %zu, байтов %zu, копия %s\n", blocks, total,
           same_files("src.bin", "dst.bin") ? "совпадает" : "отличается");
    return 0;
}`,
      explanation: `
Копирование блоками — основной способ переносить данные между файлами: \`fread\` читает до \`k\` байтов, \`fwrite\` записывает ровно столько, сколько прочитано. Цикл заканчивается, когда \`fread\` возвращает 0. Число непустых блоков — это \`⌈N / k⌉\`: все блоки, кроме последнего, полные.

Размер блока известен только во время работы, поэтому буфер выделяется в куче. Двоичный режим и побайтное сравнение гарантируют, что копия точная, включая переводы строк и нулевые байты. Сравнение проверяет и длину: файлы совпадают, только если оба кончились одновременно.`,
      examples: [
        { in: '4\nhello world\n', out: 'блоков 3, байтов 12, копия совпадает\n' },
        { in: '100\n', out: 'блоков 0, байтов 0, копия совпадает\n', why: 'Пустое содержимое.' },
      ],
      hidden: [
        { in: '1\nabc', name: 'Блок в один байт' },
        { in: '3\nabcdef', name: 'Ровное деление' },
        { in: '4096\nshort\n', name: 'Блок больше файла' },
        { in: '7\nline one\nline two\nline three\n', name: 'Несколько строк' },
        { in: '2\n\n\n\n', name: 'Только переводы строк' },
        { in: '5\nпривет, мир\n', name: 'Русский текст' },
        { in: '16\n' + 'x'.repeat(100), name: '100 байтов' },
        { in: '10\n1234567890', name: 'Ровно один блок' },
      ],
    },
    {
      title: 'Файл счетов',
      description: `
Храните счета в двоичном файле \`accounts.dat\` записями фиксированного размера:

\`\`\`c
typedef struct {
    int id;
    char name[16];
    long long balance;
} Account;
\`\`\`

Счёт с номером \`id\` хранится записью номер \`id − 1\`. Не держите счета в массиве: каждая команда читает и изменяет нужные записи прямо в файле через \`fseek\`, \`fread\` и \`fwrite\`. Команды:
- \`add ИМЯ СУММА\` — добавить счёт в конец файла; печатает \`создан счёт ID\`;
- \`get ID\` — печатает \`ID ИМЯ БАЛАНС\` или \`нет счёта\`;
- \`deposit ID СУММА\` — изменить баланс (сумма может быть отрицательной, но баланс не должен стать меньше нуля); печатает новый баланс, \`нет счёта\` или \`недостаточно средств\`;
- \`transfer ОТ КУДА СУММА\` — перевести положительную сумму; печатает \`перевод выполнен\`, \`нет счёта\` или \`недостаточно средств\`;
- \`count\` — число счетов, вычисленное по размеру файла.`,
      constraints: [
        'Имена — до 15 латинских букв; суммы по модулю до 10⁹; команд не больше 100.',
        'В команде transfer номера счетов различны.',
      ],
      hints: [
        'Откройте файл режимом "w+b" один раз в начале. Функции read_account(f, id, &a) и write_account(f, &a) делают fseek на (id − 1) · sizeof(Account) и читают или пишут одну запись.',
        'Перед fseek проверьте, что id от 1 до числа счетов; число счетов — размер файла (fseek в конец и ftell), делённый на sizeof(Account).',
        'Новую запись заполните нулями перед заполнением полей (Account a = {0};) — тогда в файл не попадут случайные байты из заполнителей структуры.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    int id;
    char name[16];
    long long balance;
} Account;

static FILE *db;

static long count_accounts(void) {
    fseek(db, 0, SEEK_END);
    return ftell(db) / (long)sizeof(Account);
}

static int read_account(int id, Account *a) {
    if (id < 1 || id > count_accounts()) {
        return 0;
    }
    fseek(db, (long)(id - 1) * (long)sizeof(Account), SEEK_SET);
    return fread(a, sizeof *a, 1, db) == 1;
}

static void write_account(const Account *a) {
    fseek(db, (long)(a->id - 1) * (long)sizeof(Account), SEEK_SET);
    fwrite(a, sizeof *a, 1, db);
    fflush(db);
}

int main(void) {
    db = fopen("accounts.dat", "w+b");
    if (db == NULL) {
        perror("accounts.dat");
        return 1;
    }
    char command[16];
    while (scanf("%15s", command) == 1) {
        Account a, b;
        int id, to;
        long long amount;
        if (strcmp(command, "add") == 0) {
            Account fresh = {0};
            if (scanf("%15s %lld", fresh.name, &fresh.balance) != 2) {
                break;
            }
            fresh.id = (int)count_accounts() + 1;
            write_account(&fresh);
            printf("создан счёт %d\n", fresh.id);
        } else if (strcmp(command, "get") == 0 && scanf("%d", &id) == 1) {
            if (read_account(id, &a)) {
                printf("%d %s %lld\n", a.id, a.name, a.balance);
            } else {
                printf("нет счёта\n");
            }
        } else if (strcmp(command, "deposit") == 0 && scanf("%d %lld", &id, &amount) == 2) {
            if (!read_account(id, &a)) {
                printf("нет счёта\n");
            } else if (a.balance + amount < 0) {
                printf("недостаточно средств\n");
            } else {
                a.balance += amount;
                write_account(&a);
                printf("%lld\n", a.balance);
            }
        } else if (strcmp(command, "transfer") == 0 &&
                   scanf("%d %d %lld", &id, &to, &amount) == 3) {
            if (!read_account(id, &a) || !read_account(to, &b)) {
                printf("нет счёта\n");
            } else if (amount <= 0 || a.balance < amount) {
                printf("недостаточно средств\n");
            } else {
                a.balance -= amount;
                b.balance += amount;
                write_account(&a);
                write_account(&b);
                printf("перевод выполнен\n");
            }
        } else if (strcmp(command, "count") == 0) {
            printf("%ld\n", count_accounts());
        }
    }
    fclose(db);
    return 0;
}`,
      explanation: `
Файл записей фиксированного размера работает как массив на диске: номер записи однозначно определяет смещение, поэтому любая запись читается и изменяется одним переходом позиции. Число записей не нужно хранить отдельно — его даёт размер файла.

Каждое изменение — прочитать запись, поменять поле, вернуться к её началу и записать. В потоке \`"w+b"\` между чтением и записью стоит \`fseek\`, как требует стандарт; \`fflush\` после записи гарантирует, что следующее чтение увидит новые данные. Перевод сначала проверяет оба счёта и средства и только потом записывает обе записи — так файл не окажется в промежуточном состоянии из-за ошибки во входных данных.

Новая запись обнуляется целиком перед заполнением: у структуры есть заполнители между \`name\` и \`balance\`, и без обнуления в файл попали бы случайные байты из памяти.`,
      examples: [
        {
          in: 'add ann 100\nadd bob 50\ntransfer 1 2 30\nget 1\nget 2\ncount\n',
          out: 'создан счёт 1\nсоздан счёт 2\nперевод выполнен\n1 ann 70\n2 bob 80\n2\n',
        },
        {
          in: 'get 1\nadd zoe 10\ndeposit 1 -20\ndeposit 1 15\n',
          out: 'нет счёта\nсоздан счёт 1\nнедостаточно средств\n25\n',
        },
      ],
      hidden: [
        { in: 'count\n', name: 'Пустой файл' },
        {
          in: 'add a 5\ntransfer 1 2 1\ntransfer 3 1 1\n',
          name: 'Перевод с несуществующим счётом',
        },
        { in: 'add a 5\nadd b 0\ntransfer 1 2 6\ntransfer 1 2 0\n', name: 'Недостаточно и ноль' },
        { in: 'add a 1000000000\ndeposit 1 1000000000\nget 1\n', name: 'Большие суммы' },
        { in: 'add a 1\nadd b 2\nadd c 3\nget 3\nget 0\nget 4\ncount\n', name: 'Границы номеров' },
        { in: 'add x 10\ndeposit 1 -10\nget 1\n', name: 'Баланс до нуля' },
        {
          in: 'add a 100\nadd b 100\nadd c 100\ntransfer 1 3 50\ntransfer 3 2 120\nget 1\nget 2\nget 3\n',
          name: 'Цепочка переводов',
        },
        { in: 'add longnameabcdefg 7\nget 1\n', name: 'Имя из 15 букв' },
      ],
    },
    {
      title: 'Найди ошибку: хвост копии',
      bug: true,
      description: `
Программа сохраняет стандартный ввод в файл \`src.bin\`, копирует его в \`dst.bin\` блоками по 16 байтов, а затем печатает размеры оригинала и копии и сообщает, совпадают ли файлы.

Копия почти всегда длиннее оригинала. Найдите и исправьте ошибку копирования.`,
      constraints: ['Ввод не длиннее 10 000 байтов.'],
      hints: [
        'Сколько байтов возвращает последний вызов fread и сколько записывает fwrite?',
        'Последний блок обычно неполный. Записывайте столько байтов, сколько прочитано: fwrite(buffer, 1, n, out).',
      ],
      starter: COPY(false),
      solution: COPY(true),
      explanation: `
\`fread\` возвращает, сколько байтов он действительно прочитал. Последний блок файла почти всегда короче буфера, но \`fwrite(buffer, 1, sizeof buffer, out)\` записывает весь буфер — в копию попадают остатки предыдущего блока. Размер копии округляется вверх до кратного 16, а содержимое хвоста — мусор.

Совпадение возможно, только если размер файла делится на 16, — поэтому ошибка может долго оставаться незамеченной на «удобных» тестовых данных. Правильный шаблон копирования: \`fwrite(buffer, 1, n, out)\`, где \`n\` — результат \`fread\`.`,
      examples: [
        { in: 'hello, world\n', out: 'размер оригинала 13, размер копии 13, совпадают\n' },
        { in: '0123456789abcdef', out: 'размер оригинала 16, размер копии 16, совпадают\n' },
      ],
      hidden: [
        '',
        'x',
        '0123456789abcdefg',
        'line one\nline two\nline three\n',
        'ровно столько байтов',
        '0123456789abcdef0123456789abcdef',
        'abc\n\n\ndef\n',
        'The quick brown fox jumps over the lazy dog',
      ],
    },
    {
      title: 'Последние строки',
      difficulty: 'advanced',
      description: `
Реализуйте упрощённую команду \`tail\`. В первой строке ввода — число \`n\`, всё остальное — текст файла. Сохраните текст в \`log.txt\` и напечатайте его последние \`n\` строк точно так, как они записаны в файле. Если последняя строка файла не заканчивается переводом строки, допечатайте его. Если строк меньше \`n\`, напечатайте весь файл; при \`n = 0\` или пустом файле не печатайте ничего.

Файл может быть большим, поэтому **не читайте его целиком с начала**: найдите начало нужной строки, читая файл с конца блоками по 64 байта (\`fseek\` назад и \`fread\`), затем перейдите к найденной позиции и выведите остаток файла.`,
      constraints: ['0 ≤ n ≤ 1000; текст не длиннее 10 000 байтов.'],
      hints: [
        'Последний байт файла — особый: если это \\n, он завершает последнюю строку и не отделяет новую. Поэтому начните поиск с позиции size − 1 (или size, если последний байт не \\n).',
        'Идите блоками назад: start = pos > 64 ? pos − 64 : 0; fseek(f, start, SEEK_SET); fread(block, 1, pos − start, f); просматривайте блок с конца и считайте \\n. Когда встретится n-й перевод строки, начало нужного куска — сразу после него.',
        'Если дошли до начала файла, а n переводов строк не нашлось, выводите файл целиком. Вывод: fseek на найденную позицию и копирование блоками до конца.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    char header[32];
    long n;
    if (fgets(header, sizeof header, stdin) == NULL || sscanf(header, "%ld", &n) != 1) {
        return 0;
    }
    FILE *f = fopen("log.txt", "w+b");
    if (f == NULL) {
        perror("log.txt");
        return 1;
    }
    char chunk[512];
    size_t got;
    while ((got = fread(chunk, 1, sizeof chunk, stdin)) > 0) {
        fwrite(chunk, 1, got, f);
    }
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    if (n <= 0 || size == 0) {
        fclose(f);
        return 0;
    }
    fseek(f, size - 1, SEEK_SET);
    int last = fgetc(f);
    long pos = last == '\n' ? size - 1 : size;   // завершающий \n не начинает новую строку
    long begin = 0;
    long found = 0;
    char block[64];
    while (pos > 0 && found < n) {
        long start = pos > (long)sizeof block ? pos - (long)sizeof block : 0;
        fseek(f, start, SEEK_SET);
        size_t len = fread(block, 1, (size_t)(pos - start), f);
        for (long i = (long)len - 1; i >= 0; i--) {
            if (block[i] == '\n' && ++found == n) {
                begin = start + i + 1;
                break;
            }
        }
        pos = start;
    }
    fseek(f, begin, SEEK_SET);
    while ((got = fread(chunk, 1, sizeof chunk, f)) > 0) {
        fwrite(chunk, 1, got, stdout);
    }
    if (last != '\n') {
        putchar('\n');
    }
    fclose(f);
    return 0;
}`,
      explanation: `
Настоящий \`tail\` работает с журналами размером в гигабайты и не может читать их с начала. Он идёт от конца файла назад блоками, считая переводы строк, — и прочитывает ровно столько, сколько нужно для последних \`n\` строк. \`fseek\` позволяет перейти к любому месту файла за одно действие, без чтения всего, что перед ним.

Тонкость — завершающий перевод строки. Строка \`"a\\nb\\n"\` состоит из двух строк, а не трёх: последний \`\\n\` закрывает строку \`b\`. Поэтому поиск начинается перед ним. Найдя \`n\`-й перевод строки с конца, программа знает, что нужный кусок начинается сразу после него; если столько переводов нет, выводится весь файл.

Перевод строки внутри блока может оказаться на границе блоков — это не мешает: каждый байт просматривается ровно один раз, а позиция найденного \`\\n\` вычисляется от начала блока.`,
      examples: [
        { in: '2\none\ntwo\nthree\n', out: 'two\nthree\n' },
        { in: '5\na\nb', out: 'a\nb\n', why: 'Строк меньше n, последняя без перевода строки.' },
      ],
      hidden: [
        { in: '0\nx\ny\n', name: 'n = 0' },
        { in: '3\n', name: 'Пустой файл' },
        { in: '1\nonly line\n', name: 'Одна строка' },
        { in: '1\nfirst\nsecond', name: 'Последняя без перевода строки' },
        { in: '2\n\n\n\n', name: 'Пустые строки' },
        {
          in:
            '3\n' +
            Array.from({ length: 40 }, (_, i) => `line ${i + 1} of the log file`).join('\n') +
            '\n',
          name: 'Строки на границах блоков',
        },
        {
          in: '1\n' + 'x'.repeat(200) + '\n' + 'y'.repeat(150) + '\n',
          name: 'Строка длиннее блока',
        },
        { in: '4\nalpha\nbeta\ngamma\ndelta\nepsilon\n', name: 'Обычный журнал' },
      ],
    },
  ],
};
