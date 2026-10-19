const NUMBERS = (fixed) => String.raw`
#include <stdio.h>

int main(void) {
    FILE *out = fopen("numbers.txt", "w");
    if (out == NULL) {
        perror("numbers.txt");
        return 1;
    }
    int value;
    while (scanf("%d", &value) == 1) {
        fprintf(out, "%d\n", value);
    }
    if (fclose(out) != 0) {
        perror("numbers.txt");
        return 1;
    }

    FILE *in = fopen("numbers.txt", "r");
    if (in == NULL) {
        perror("numbers.txt");
        return 1;
    }
    int count = 0;
    long long sum = 0;
    int max = 0;
    value = 0;
${
  fixed
    ? '    while (fscanf(in, "%d", &value) == 1) {'
    : '    while (!feof(in)) {\n        fscanf(in, "%d", &value);'
}
        if (count == 0 || value > max) {
            max = value;
        }
        sum += value;
        count++;
    }
    fclose(in);
    if (count == 0) {
        printf("чисел нет\n");
    } else {
        printf("чисел %d, сумма %lld, максимум %d\n", count, sum, max);
    }
    return 0;
}`;

export default {
  id: 'advanced-file-stream',
  title: 'Файлы: FILE * и текстовый ввод-вывод',
  description:
    'Поток FILE * и стандартные потоки; fopen и режимы открытия, проверка NULL и perror; fclose и её результат; запись fprintf, fputs, fputc; чтение строк fgets и символов fgetc, тип int для EOF; признаки конца файла и ошибки, ловушка while (!feof); буферизация и fflush; функции для любого потока.',
  moduleId: 'advanced-c',
  order: 23,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-registers'],
  objectives: [
    'Открывать, читать, записывать и закрывать файлы с проверкой ошибок',
    'Выбирать режим открытия файла',
    'Читать строки и символы, правильно распознавая конец файла',
    'Учитывать буферизацию потоков',
  ],
  tags: ['Файлы', 'FILE *', 'fopen', 'fgets', 'feof'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что вернёт fopen("report.txt", "r"), если такого файла нет?',
      options: [
        'NULL',
        'Пустой поток, из которого ничего нельзя прочитать',
        'stdin',
        'Программа завершится с ошибкой',
      ],
      correct: 0,
      explain:
        'При неудаче fopen возвращает NULL и записывает причину в errno. Результат проверяют сразу, а причину выводят через perror.',
    },
    {
      q: 'Какой режим fopen создаёт файл, если его нет, и дописывает данные в конец, если он есть?',
      answers: ['"a"', 'a'],
      placeholder: 'Режим',
      explain:
        '"w" стёр бы существующее содержимое, "r" не создаёт файл. "a" — append, дописывание.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    FILE *f = fopen("t.txt", "w");
    if (f == NULL) {
        return 1;
    }
    fputs("ab\ncd\n", f);
    fclose(f);
    f = fopen("t.txt", "a");
    if (f == NULL) {
        return 1;
    }
    fputs("ef\n", f);
    fclose(f);
    f = fopen("t.txt", "r");
    if (f == NULL) {
        return 1;
    }
    char line[16];
    int count = 0;
    while (fgets(line, sizeof line, f) != NULL) {
        count++;
    }
    fclose(f);
    printf("%d\n", count);
    return 0;
}`,
      answers: ['3'],
      placeholder: 'Вывод программы',
      explain: 'Режим "a" дописал третью строку к двум существующим, и fgets прочитал три строки.',
    },
    {
      q: 'Почему результат fgetc сохраняют в int, а не в char?',
      options: [
        'fgetc возвращает байты 0–255 и отдельное значение EOF; в char их не различить',
        'char не может хранить буквы',
        'fgetc возвращает номер строки',
        'Так быстрее',
      ],
      correct: 0,
      explain:
        'EOF обычно равен −1, а байт 0xFF в знаковом char тоже становится −1: цикл закончится раньше времени. В беззнаковом char EOF не появится никогда, и цикл станет бесконечным.',
    },
    {
      q: 'Что не так в цикле while (!feof(f)) { fgets(line, 100, f); process(line); }?',
      options: [
        'feof становится истинным только после неудачного чтения, поэтому последняя строка обработается дважды',
        'feof нельзя вызывать для файлов, открытых на чтение',
        'Цикл никогда не начнётся',
        'Ничего, это правильный способ',
      ],
      correct: 0,
      explain:
        'После чтения последней строки признак конца ещё не установлен. Следующий fgets вернёт NULL, line останется прежней — и обработается снова. Условие цикла — результат fgets.',
    },
    {
      q: 'Какие утверждения о буферизации верны? Выберите все.',
      options: [
        'Данные, записанные fprintf, могут оставаться в буфере до fflush или fclose',
        'stderr не буферизуется',
        'Если программа упадёт до fclose, хвост буфера может не попасть в файл',
        'Каждый вызов fputc сразу записывает байт на диск',
      ],
      correct: [0, 1, 2],
      explain:
        'Поток копит данные в буфере и отдаёт их системе блоками. stderr — без буфера, чтобы сообщения об ошибках не терялись.',
    },
    {
      q: 'Буфер для fgets объявлен как char buf[6]. Сколько символов строки "abcdefgh\\n" прочитает первый вызов fgets(buf, sizeof buf, f)?',
      answers: ['5'],
      placeholder: 'Число',
      explain:
        'fgets читает не больше size − 1 символов и дописывает нулевой символ: "abcde". Остаток прочитают следующие вызовы.',
    },
    {
      q: 'Что нужно сделать между записью и чтением в потоке, открытом режимом "r+"?',
      options: [
        'Вызвать fflush или изменить позицию (fseek, rewind)',
        'Ничего, можно переключаться в любой момент',
        'Закрыть и снова открыть файл — другого способа нет',
        'Вызвать feof',
      ],
      correct: 0,
      explain:
        'Без fflush или перехода позиции переключение между записью и чтением — неопределённое поведение: буфер записи и буфер чтения не согласованы.',
    },
  ],
  exercises: [
    {
      title: 'Журнал заметок',
      difficulty: 'beginner',
      description: `
В первой строке ввода — слово для поиска, в остальных строках до конца ввода — заметки.

Запишите заметки в файл \`journal.txt\`, каждую строкой вида \`N: текст\` (нумерация с 1). Закройте файл, откройте его снова на чтение и напечатайте строки файла, в которых встречается слово поиска (как подстрока, с учётом регистра), а затем \`найдено: K\`.`,
      constraints: [
        'Заметки — до 200 символов, их не больше 50; слово поиска — до 30 символов без пробелов.',
      ],
      hints: [
        'Слово прочитайте fgets и удалите перевод строки: word[strcspn(word, "\\n")] = \'\\0\'. Заметки читайте fgets до конца ввода и пишите fprintf(out, "%d: %s", n, line) — перевод строки уже в line.',
        'Последняя заметка может не заканчиваться \\n: проверьте это и допишите перевод строки сами, чтобы строки файла не склеились.',
        'После fclose откройте файл режимом "r" и проверяйте каждую строку функцией strstr(line, word).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[64], line[256];
    if (fgets(word, sizeof word, stdin) == NULL) {
        return 0;
    }
    word[strcspn(word, "\n")] = '\0';

    FILE *out = fopen("journal.txt", "w");
    if (out == NULL) {
        perror("journal.txt");
        return 1;
    }
    int n = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        line[strcspn(line, "\n")] = '\0';
        fprintf(out, "%d: %s\n", ++n, line);
    }
    if (fclose(out) != 0) {
        perror("journal.txt");
        return 1;
    }

    FILE *in = fopen("journal.txt", "r");
    if (in == NULL) {
        perror("journal.txt");
        return 1;
    }
    int found = 0;
    char stored[300];
    while (fgets(stored, sizeof stored, in) != NULL) {
        if (strstr(stored, word) != NULL) {
            fputs(stored, stdout);
            found++;
        }
    }
    fclose(in);
    printf("найдено: %d\n", found);
    return 0;
}`,
      explanation: `
Программа проходит полный цикл работы с файлом: открыть на запись, записать, закрыть (и проверить результат \`fclose\` — данные попадают на диск именно здесь), открыть снова на чтение, прочитать, закрыть. Между двумя открытиями файл закрыт, поэтому все данные из буфера гарантированно записаны.

Перевод строки удаляется из каждой заметки и дописывается заново в \`fprintf\` — так последняя заметка без \`\\n\` в конце ввода не склеится со следующей строкой файла. Поиск идёт по строкам файла, а не по исходным заметкам: номер в начале строки — часть сохранённых данных, и слово-число может совпасть и с ним.`,
      examples: [
        {
          in: 'хлеб\nкупить хлеб\nпозвонить маме\nхлеб и молоко\n',
          out: '1: купить хлеб\n3: хлеб и молоко\nнайдено: 2\n',
        },
        { in: 'xyz\nnothing here\n', out: 'найдено: 0\n' },
      ],
      hidden: [
        { in: 'a\n', name: 'Нет заметок' },
        { in: 'cat\ncat\nCat\nconcatenate\n', name: 'Регистр и подстроки' },
        { in: 'end\nno newline at the end', name: 'Без перевода строки в конце' },
        { in: '2\nfirst\nsecond\n', name: 'Число совпадает с номером' },
        { in: 'x\n\nx\n\n', name: 'Пустые заметки' },
        { in: 'фото\nотпуск: фото моря\nфотография\nвидео\n', name: 'Русский текст' },
        { in: ':\nbuy milk\n', name: 'Двоеточие есть в каждой строке' },
        { in: 'todo\ntodo 1\ntodo 2\ntodo 3\ndone\n', name: 'Несколько совпадений' },
      ],
    },
    {
      title: 'Статистика файла',
      description: `
Скопируйте весь стандартный ввод в файл \`data.txt\` (байт за байтом), закройте его, затем откройте снова и посчитайте:
- **строки** — число переводов строки плюс одна, если файл не пуст и последний байт не \`\\n\`;
- **слова** — последовательности символов, отличных от пробела, табуляции и перевода строки;
- **байты** — размер файла;
- **самую длинную строку** — наибольшее число байтов в строке без перевода строки.

Напечатайте \`строк L, слов W, байтов B, самая длинная M\`.`,
      constraints: ['Ввод не длиннее 10 000 байтов.'],
      hints: [
        'Копирование: int c; while ((c = getchar()) != EOF) fputc(c, out);. Результат getchar и fgetc храните в int.',
        'При чтении считайте длину текущей строки: на \\n сравнивайте её с максимумом и обнуляйте. После цикла не забудьте последнюю строку без \\n.',
        'Слово начинается, когда после разделителя (или в начале) встретился не разделитель: заведите флаг «внутри слова».',
      ],
      solution: String.raw`
#include <stdio.h>

static int is_space(int c) {
    return c == ' ' || c == '\t' || c == '\n';
}

int main(void) {
    FILE *out = fopen("data.txt", "w");
    if (out == NULL) {
        perror("data.txt");
        return 1;
    }
    int c;
    while ((c = getchar()) != EOF) {
        fputc(c, out);
    }
    if (fclose(out) != 0) {
        perror("data.txt");
        return 1;
    }

    FILE *in = fopen("data.txt", "r");
    if (in == NULL) {
        perror("data.txt");
        return 1;
    }
    long lines = 0, words = 0, bytes = 0, current = 0, longest = 0;
    int inside = 0, last = '\n';
    while ((c = fgetc(in)) != EOF) {
        bytes++;
        if (c == '\n') {
            lines++;
            if (current > longest) {
                longest = current;
            }
            current = 0;
        } else {
            current++;
        }
        if (is_space(c)) {
            inside = 0;
        } else if (!inside) {
            inside = 1;
            words++;
        }
        last = c;
    }
    fclose(in);
    if (bytes > 0 && last != '\n') {
        lines++;
        if (current > longest) {
            longest = current;
        }
    }
    printf("строк %ld, слов %ld, байтов %ld, самая длинная %ld\n", lines, words, bytes, longest);
    return 0;
}`,
      explanation: `
Посимвольное чтение через \`fgetc\` — самый простой способ пройти файл целиком, не думая о длине строк: буфер потока всё равно читает данные блоками, поэтому вызов на каждый байт обходится дёшево. Результат хранится в \`int\`, чтобы \`EOF\` не путался с байтом \`0xFF\`.

Последняя строка без перевода строки — классическая граница: \`wc -l\` её не считает, а в этой задаче она считается, поэтому после цикла нужна отдельная проверка последнего байта. Длина строки измеряется в байтах: в UTF-8 русская буква занимает два байта, и «самая длинная строка» из русских слов окажется вдвое длиннее, чем в буквах.`,
      examples: [
        { in: 'раз два\nтри\n', out: 'строк 2, слов 3, байтов 21, самая длинная 13\n' },
        { in: 'no newline', out: 'строк 1, слов 2, байтов 10, самая длинная 10\n' },
      ],
      hidden: [
        { in: '', name: 'Пустой ввод' },
        { in: '\n', name: 'Один перевод строки' },
        { in: '\n\n\n', name: 'Пустые строки' },
        { in: '  a  b\t\tc  \n', name: 'Разделители' },
        { in: 'short\na much longer line here\nmid\n', name: 'Самая длинная в середине' },
        { in: 'last line is the longest one', name: 'Последняя строка без перевода' },
        { in: 'word\n\tindent\n    spaces\n', name: 'Отступы' },
        { in: 'один\nдва\nтри\nчетыре\n', name: 'Русские слова' },
      ],
    },
    {
      title: 'Найди ошибку: лишнее число',
      bug: true,
      description: `
Программа читает целые числа из стандартного ввода, записывает их в файл \`numbers.txt\` по одному в строке, затем читает файл и печатает \`чисел N, сумма S, максимум M\` (или \`чисел нет\`).

Результат всегда на одно число больше, а сумма — на последнее число больше правильной. Найдите и исправьте ошибку чтения.`,
      constraints: ['Чисел не больше 100, каждое по модулю не больше 10⁶.'],
      hints: [
        'Когда именно feof(in) становится истинным — до или после неудачной попытки чтения?',
        'После последнего числа в файле остаётся перевод строки, и цикл делает лишнюю итерацию со старым значением. Сделайте условием цикла результат чтения: while (fscanf(in, "%d", &value) == 1).',
      ],
      starter: NUMBERS(false),
      solution: NUMBERS(true),
      explanation: `
Признак конца файла устанавливается только тогда, когда функция чтения **попыталась** прочитать за концом. После чтения последнего числа в файле остаётся перевод строки, \`feof\` ещё ложен, и цикл выполняется снова: \`fscanf\` пропускает перевод строки, упирается в конец файла и возвращает \`EOF\`, не меняя \`value\`. Старое значение обрабатывается второй раз.

Правильная схема — проверять результат самой функции чтения: \`fscanf(...) == 1\` означает «одно число прочитано». А \`feof\` и \`ferror\` нужны после цикла — чтобы понять, закончились ли данные или произошла ошибка. Для пустого ввода исправленная программа тоже работает: цикл не выполнится ни разу.`,
      examples: [
        { in: '10 20 30\n', out: 'чисел 3, сумма 60, максимум 30\n' },
        { in: '-5\n', out: 'чисел 1, сумма -5, максимум -5\n' },
      ],
      hidden: [
        '1 2\n',
        '7\n7\n7\n',
        '-1 -2 -3\n',
        '1000000 -1000000 999999\n',
        '0\n',
        '5 4 3 2 1\n',
        '42 17\n',
        '3 1 4 1 5 9 2 6\n',
      ],
    },
    {
      title: 'Раскладка по файлам',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — запись \`категория,сумма\`, например \`food,250\`. Разложите суммы по файлам: сумма записывается строкой в конец файла \`категория.txt\`. Затем для каждой категории в порядке первого появления откройте её файл, прочитайте суммы и напечатайте \`категория: записей N, итого S, максимум M\`.

Некорректные строки пропустите, напечатав \`строка K пропущена\` (K — номер строки ввода, с 1), в момент их обработки. Строка некорректна, если в ней нет запятой, если категория пуста, длиннее 15 символов или содержит что-то кроме строчных латинских букв, или если после запятой не целое число (допустимы знак и цифры, больше ничего).

Открывайте файл категории режимом \`"a"\` при каждой записи и сразу закрывайте — так программе не нужно держать открытыми много файлов одновременно.`,
      constraints: [
        'Строк не больше 100, каждая до 100 символов; различных категорий не больше 20.',
        'Суммы по модулю не больше 10⁶.',
      ],
      hints: [
        'Разбор строки: найдите запятую через strchr, проверьте категорию (длина 1–15, только a–z), число — через strtol с проверкой, что после числа строка закончилась.',
        'Имя файла: snprintf(path, sizeof path, "%s.txt", category). Проверка «только строчные буквы» заодно защищает от имён вроде ../secret — не используйте ввод как путь без проверки.',
        'Порядок первого появления храните в массиве имён категорий. Во второй части для каждой категории откройте файл режимом "r" и читайте числа fscanf(f, "%ld", &value) == 1.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char categories[20][16];
static int category_count;

static int valid_category(const char *text, size_t len) {
    if (len == 0 || len > 15) {
        return 0;
    }
    for (size_t i = 0; i < len; i++) {
        if (text[i] < 'a' || text[i] > 'z') {
            return 0;
        }
    }
    return 1;
}

static int parse_amount(const char *text, long *out) {
    char *end;
    if (*text == '\0') {
        return 0;
    }
    long value = strtol(text, &end, 10);
    if (*end != '\0' || end == text || text[0] == ' ') {
        return 0;
    }
    *out = value;
    return 1;
}

int main(void) {
    char line[128];
    int number = 0;
    while (fgets(line, sizeof line, stdin) != NULL) {
        number++;
        line[strcspn(line, "\r\n")] = '\0';
        char *comma = strchr(line, ',');
        long amount;
        if (comma == NULL || !valid_category(line, (size_t)(comma - line)) ||
            !parse_amount(comma + 1, &amount)) {
            printf("строка %d пропущена\n", number);
            continue;
        }
        *comma = '\0';
        int index = -1;
        for (int i = 0; i < category_count; i++) {
            if (strcmp(categories[i], line) == 0) {
                index = i;
            }
        }
        if (index < 0) {
            if (category_count == 20) {
                printf("строка %d пропущена\n", number);
                continue;
            }
            index = category_count++;
            strcpy(categories[index], line);
        }
        char path[32];
        snprintf(path, sizeof path, "%s.txt", categories[index]);
        FILE *out = fopen(path, "a");
        if (out == NULL) {
            perror(path);
            return 1;
        }
        fprintf(out, "%ld\n", amount);
        if (fclose(out) != 0) {
            perror(path);
            return 1;
        }
    }
    for (int i = 0; i < category_count; i++) {
        char path[32];
        snprintf(path, sizeof path, "%s.txt", categories[i]);
        FILE *in = fopen(path, "r");
        if (in == NULL) {
            perror(path);
            return 1;
        }
        long value, total = 0, max = 0;
        int count = 0;
        while (fscanf(in, "%ld", &value) == 1) {
            if (count == 0 || value > max) {
                max = value;
            }
            total += value;
            count++;
        }
        fclose(in);
        printf("%s: записей %d, итого %ld, максимум %ld\n", categories[i], count, total, max);
    }
    return 0;
}`,
      explanation: `
Программа работает с несколькими файлами, но держит открытым не больше одного: каждая запись — \`fopen\` режимом \`"a"\`, запись строки, \`fclose\`. У процесса есть предел одновременно открытых файлов (в песочнице курса — 64), и программа, открывающая по файлу на каждую категорию, упёрлась бы в него при большом вводе. Режим \`"a"\` гарантирует, что каждая новая сумма окажется в конце файла.

Проверка имени категории — не только формальность. Имя файла строится из пользовательского ввода, и без проверки строка \`../../etc/passwd,1\` попыталась бы писать за пределами рабочего каталога. Разрешив только строчные латинские буквы, программа исключает любые пути. Число проверяется \`strtol\` с указателем на конец: строка \`12abc\` или пустая сумма отклоняются, а не превращаются молча в 12 или 0.`,
      examples: [
        {
          in: 'food,250\ntaxi,400\nfood,100\nfood,-50\n',
          out: 'food: записей 3, итого 300, максимум 250\ntaxi: записей 1, итого 400, максимум 400\n',
        },
        {
          in: 'food,10\nbad line\nFood,5\nfood,12x\n,7\nfood,20\n',
          out: 'строка 2 пропущена\nстрока 3 пропущена\nстрока 4 пропущена\nстрока 5 пропущена\nfood: записей 2, итого 30, максимум 20\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пустой ввод' },
        { in: 'abcdefghijklmnop,1\nabcdefghijklmno,2\n', name: 'Длина категории' },
        { in: '../etc,5\nsafe,5\n', name: 'Попытка пути' },
        { in: 'a,1\nb,2\nc,3\na,4\nb,5\n', name: 'Порядок первого появления' },
        { in: 'x,\nx,+7\nx,-0\n', name: 'Знаки и пустая сумма' },
        { in: 'cafe,1000000\ncafe,-1000000\ncafe,999999\n', name: 'Большие суммы' },
        { in: 'rent,100\r\nrent,200\r\n', name: 'Окончания строк Windows' },
        {
          in: 'aa,1\nbb,1\ncc,1\ndd,1\nee,1\nff,1\ngg,1\nhh,1\nii,1\njj,1\nkk,1\nll,1\n',
          name: 'Двенадцать категорий',
        },
      ],
    },
  ],
};
