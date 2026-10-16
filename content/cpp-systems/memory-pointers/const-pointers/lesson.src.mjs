export default {
  id: 'memory-const-pointers',
  title: 'const в интерфейсах функций',
  description:
    'const как проверяемый договор в сигнатурах: входные и выходные параметры, передача структур через const-указатель, возврат указателя внутрь константных данных, таблицы констант и почему нельзя снимать const.',
  moduleId: 'memory-pointers',
  order: 9,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['memory-pointer-to-pointer'],
  objectives: [
    'Читать сигнатуры функций и определять, какие данные функция может изменить',
    'Объявлять входные параметры-указатели как const и передавать структуры через const-указатель',
    'Возвращать const-указатель на найденное место во входных данных',
    'Объяснять, почему снятие const и запись в литерал — неопределённое поведение',
  ],
  tags: ['C17', 'Память', 'const', 'Интерфейсы', 'Указатели'],
  standard: 'c17',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие параметры функции void *memcpy(void *dst, const void *src, size_t n) функция может изменить через указатель?',
      options: [
        'Только память по адресу dst',
        'Только память по адресу src',
        'Обе области',
        'Ни одну',
      ],
      correct: 0,
      explain: 'src помечен const — данные только читаются. dst без const — туда идёт запись.',
    },
    {
      q: 'Какие операции допустимы, если параметр объявлен как const int *p ? Выберите все.',
      options: ['x = *p;', 'p++;', '*p = 5;', 'p = NULL;', 'p[1] = 0;'],
      correct: [0, 1, 3],
      explain:
        'const относится к данным: читать и двигать сам указатель можно, записывать через него — нет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

const char *skip_spaces(const char *s) {
    while (*s == ' ') {
        s++;
    }
    return s;
}

int main(void) {
    const char *text = "   hello";
    const char *start = skip_spaces(text);
    printf("%td %s\n", start - text, start);
    return 0;
}`,
      answers: ['3 hello'],
      placeholder: 'Вывод программы',
      explain:
        'Функция двигает свою копию указателя и возвращает адрес первого непробельного символа — смещение 3 от начала.',
    },
    {
      q: 'Какое объявление позволяет менять данные, но не позволяет перенаправить указатель?',
      options: ['int *const p', 'const int *p', 'int const *p', 'const int *const p'],
      correct: 0,
      explain:
        'const справа от звёздочки относится к самому указателю. const int * и int const * — одно и то же.',
    },
    {
      q: 'Чем плох код const char *s = "abc"; char *w = (char *)s; w[0] = \'X\'; ?',
      options: [
        'Запись в строковый литерал — неопределённое поведение, обычно аварийное завершение',
        'Это ошибка компиляции',
        'Ничем: приведение снимает ограничение',
        'Изменится копия строки',
      ],
      correct: 0,
      explain:
        'Приведение лишь заставляет компилятор замолчать. Литерал по-прежнему лежит в памяти только для чтения.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

struct Box {
    int w, h;
};

int area(const struct Box *b) {
    return b->w * b->h;
}

void grow(struct Box *b) {
    b->w++;
    b->h++;
}

int main(void) {
    struct Box box = {2, 3};
    grow(&box);
    printf("%d\n", area(&box));
    return 0;
}`,
      answers: ['12'],
      placeholder: 'Вывод программы',
      explain: 'grow меняет коробку до 3×4 через неконстантный указатель, area только читает: 12.',
    },
    {
      q: 'Почему функцию, которая только читает массив, лучше объявить как int sum(const int *a, int n), а не int sum(int *a, int n)?',
      options: [
        'Её можно вызвать и для const-массива, а читатель видит, что массив не изменится',
        'Она будет работать быстрее',
        'Иначе массив скопируется',
        'Без const нельзя читать элементы',
      ],
      correct: 0,
      explain:
        'int * не принимает const int * без приведения. const в сигнатуре — документация, которую проверяет компилятор.',
    },
  ],
  exercises: [
    {
      title: 'Подсчёт без изменения',
      difficulty: 'beginner',
      description: `
Реализуйте две функции, которые только читают строку:

\`\`\`c
size_t count_char(const char *s, char c);   // сколько раз встречается символ c
size_t count_words(const char *s);          // сколько слов (групп непробельных символов)
\`\`\`

Функция \`main\` дана: читает строку и символ на следующей строке, печатает \`chars=N words=W\`. Пробельными считаются пробел, табуляция и перевод строки.`,
      constraints: ['Длина строки — до 200 символов.'],
      hints: [
        "Обход: for (; *s != '\\0'; s++) — двигается копия указателя, это допустимо для const char *.",
        'Слово начинается там, где непробельный символ идёт после пробельного или в самом начале строки. isspace((unsigned char)ch) из <ctype.h> проверяет пробельные символы.',
      ],
      starter: String.raw`
#include <ctype.h>
#include <stdio.h>

size_t count_char(const char *s, char c) {
    return 0;
}

size_t count_words(const char *s) {
    return 0;
}

int main(void) {
    char line[256];
    char symbol[8];
    if (fgets(line, sizeof line, stdin) == NULL || fgets(symbol, sizeof symbol, stdin) == NULL) {
        return 1;
    }
    printf("chars=%zu words=%zu\n", count_char(line, symbol[0]), count_words(line));
    return 0;
}`,
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>

size_t count_char(const char *s, char c) {
    size_t count = 0;
    for (; *s != '\0'; s++) {
        if (*s == c) {
            count++;
        }
    }
    return count;
}

size_t count_words(const char *s) {
    size_t count = 0;
    int inside = 0;
    for (; *s != '\0'; s++) {
        if (isspace((unsigned char)*s)) {
            inside = 0;
        } else if (!inside) {
            inside = 1;
            count++;
        }
    }
    return count;
}

int main(void) {
    char line[256];
    char symbol[8];
    if (fgets(line, sizeof line, stdin) == NULL || fgets(symbol, sizeof symbol, stdin) == NULL) {
        return 1;
    }
    printf("chars=%zu words=%zu\n", count_char(line, symbol[0]), count_words(line));
    return 0;
}`,
      explanation: `
Обе функции принимают \`const char *\`: по сигнатуре видно, что строка не изменится, и их можно вызывать и для литералов, и для массивов. Внутри двигается копия указателя \`s\` — \`const\` относится к символам, а не к самому указателю.

Подсчёт слов — автомат с двумя состояниями: «внутри слова» и «между словами». Счётчик растёт на переходе из второго состояния в первое, поэтому несколько пробелов подряд не создают пустых слов.`,
      examples: [
        { in: 'the cat sat on the mat\nt\n', out: 'chars=5 words=6\n' },
        {
          in: '   \n \n',
          out: 'chars=3 words=0\n',
          why: 'Ищется пробел: в строке их три, а слов нет.',
        },
      ],
      hidden: [
        { in: 'a\na\n', name: 'Один символ' },
        { in: 'hello\nz\n', name: 'Символа нет' },
        { in: '  many   spaces   here  \ne\n', name: 'Много пробелов' },
        { in: 'aaaa aaaa\na\n', name: 'Повторяющиеся буквы' },
        { in: 'tab\tseparated\twords\nt\n', name: 'Табуляции' },
        { in: 'x,y,z\n,\n', name: 'Запятые без пробелов' },
        { in: 'Mixed CASE case\nc\n', name: 'Регистр' },
        { in: 'one\nn\n', name: 'Одно слово' },
      ],
    },
    {
      title: 'Последнее вхождение',
      description: `
Реализуйте функцию

\`\`\`c
const char *last_occurrence(const char *text, const char *word);
\`\`\`

Она возвращает указатель на начало **последнего** вхождения строки \`word\` в \`text\` или \`NULL\`, если вхождений нет. Вхождения могут перекрываться.

Функция \`main\` дана: читает две строки (текст и образец), печатает позицию последнего вхождения и хвост текста начиная с неё, либо \`not found\`.`,
      constraints: [
        'Длина текста — до 200 символов, образца — от 1 до 50.',
        'Строки не содержат пробелов.',
      ],
      hints: [
        'Перебирайте позиции p от text: если strncmp(p, word, len) == 0, запомните p в переменной const char *last.',
        'strncmp сравнивает не больше len символов и останавливается на конце любой из строк, поэтому выхода за границу текста нет.',
        'Можно использовать и strstr: ищите снова с позиции found + 1, пока находится.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

const char *last_occurrence(const char *text, const char *word) {
    return NULL;
}

int main(void) {
    char text[256], word[64];
    if (scanf("%255s %63s", text, word) != 2) {
        return 1;
    }
    const char *found = last_occurrence(text, word);
    if (found == NULL) {
        printf("not found\n");
    } else {
        printf("%td %s\n", found - text, found);
    }
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

const char *last_occurrence(const char *text, const char *word) {
    size_t len = strlen(word);
    const char *last = NULL;
    for (const char *p = text; *p != '\0'; p++) {
        if (strncmp(p, word, len) == 0) {
            last = p;
        }
    }
    return last;
}

int main(void) {
    char text[256], word[64];
    if (scanf("%255s %63s", text, word) != 2) {
        return 1;
    }
    const char *found = last_occurrence(text, word);
    if (found == NULL) {
        printf("not found\n");
    } else {
        printf("%td %s\n", found - text, found);
    }
    return 0;
}`,
      explanation: `
Результат указывает внутрь \`text\`, поэтому его тип — \`const char *\`, как у входа: через него нельзя изменить текст, даже если вызывающий код передал неконстантный массив.

Функция не копирует данные — она возвращает адрес. Вызывающий код получает и позицию (\`found − text\`), и строку-хвост без лишних выделений памяти. Указатель действителен, пока жив \`text\`.`,
      examples: [
        { in: 'abcabcabc\nbc\n', out: '7 bc\n' },
        { in: 'hello\nxyz\n', out: 'not found\n' },
      ],
      hidden: [
        { in: 'aaaa\naa\n', name: 'Перекрывающиеся вхождения' },
        { in: 'abc\nabc\n', name: 'Совпадает целиком' },
        { in: 'abc\nabcd\n', name: 'Образец длиннее текста' },
        { in: 'xyzxyz\nx\n', name: 'Один символ' },
        { in: 'abababab\naba\n', name: 'Перекрытие с шагом 2' },
        { in: 'start-middle-end\nstart\n', name: 'Только в начале' },
        { in: 'mississippi\nissi\n', name: 'mississippi' },
        { in: 'a\nb\n', name: 'Нет совпадений' },
      ],
    },
    {
      title: 'Лучшая запись',
      description: `
Даны \`n\` записей об участниках: имя, баллы и время в секундах. Лучший — участник с наибольшими баллами; при равных баллах — с меньшим временем; при равенстве и времени — с меньшим по алфавиту именем.

Реализуйте функции:

\`\`\`c
int better(const struct Entry *a, const struct Entry *b);         // 1, если a лучше b
const struct Entry *best_entry(const struct Entry *list, int n);  // указатель на лучшего
\`\`\`

Функция \`main\` дана: печатает имя, баллы, время лучшего участника и его номер в списке (с нуля).`,
      constraints: [
        '1 ≤ n ≤ 100.',
        'Имя — до 20 латинских букв.',
        '0 ≤ баллы ≤ 1000, 1 ≤ время ≤ 10⁶.',
      ],
      hints: [
        'better: сравните score; если равны — time (меньше лучше); если равны — strcmp(a->name, b->name) < 0.',
        'best_entry: начните с const struct Entry *best = &list[0]; и обновляйте, если better(&list[i], best).',
      ],
      starter: String.raw`
#include <stdio.h>
#include <string.h>

struct Entry {
    char name[21];
    int score;
    int time;
};

int better(const struct Entry *a, const struct Entry *b) {
    return 0;
}

const struct Entry *best_entry(const struct Entry *list, int n) {
    return list;
}

int main(void) {
    int n;
    scanf("%d", &n);
    struct Entry list[100];
    for (int i = 0; i < n; i++) {
        scanf("%20s %d %d", list[i].name, &list[i].score, &list[i].time);
    }
    const struct Entry *best = best_entry(list, n);
    printf("%s %d %d #%td\n", best->name, best->score, best->time, best - list);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <string.h>

struct Entry {
    char name[21];
    int score;
    int time;
};

int better(const struct Entry *a, const struct Entry *b) {
    if (a->score != b->score) {
        return a->score > b->score;
    }
    if (a->time != b->time) {
        return a->time < b->time;
    }
    return strcmp(a->name, b->name) < 0;
}

const struct Entry *best_entry(const struct Entry *list, int n) {
    const struct Entry *best = &list[0];
    for (int i = 1; i < n; i++) {
        if (better(&list[i], best)) {
            best = &list[i];
        }
    }
    return best;
}

int main(void) {
    int n;
    scanf("%d", &n);
    struct Entry list[100];
    for (int i = 0; i < n; i++) {
        scanf("%20s %d %d", list[i].name, &list[i].score, &list[i].time);
    }
    const struct Entry *best = best_entry(list, n);
    printf("%s %d %d #%td\n", best->name, best->score, best->time, best - list);
    return 0;
}`,
      explanation: `
Каждая запись занимает 32 байта; передача \`const struct Entry *\` копирует только адрес и при этом гарантирует, что сравнение не испортит данные. По сигнатурам сразу видно: обе функции только читают.

\`best_entry\` возвращает указатель на элемент исходного массива, а не копию. Поэтому \`main\` может вычислить номер записи как \`best − list\`. Тип результата — \`const struct Entry *\`, ведь он указывает внутрь данных, полученных только для чтения.`,
      examples: [
        { in: '3\nann 90 300\nbob 95 400\ncid 95 350\n', out: 'cid 95 350 #2\n' },
        { in: '1\nsolo 0 1\n', out: 'solo 0 1 #0\n' },
      ],
      hidden: [
        { in: '2\nzed 50 100\namy 50 100\n', name: 'Равенство до имени' },
        { in: '3\na 10 5\nb 10 5\nc 10 5\n', name: 'Полное равенство, кроме имени' },
        { in: '3\nfast 1 1\nslow 2 1000000\nmid 1 2\n', name: 'Баллы важнее времени' },
        { in: '4\nx 1000 10\ny 1000 9\nz 999 1\nw 1000 9\n', name: 'Время решает' },
        { in: '2\nfirst 0 1000000\nsecond 0 999999\n', name: 'Нулевые баллы' },
        { in: '5\ne 1 1\nd 2 2\nc 3 3\nb 4 4\na 5 5\n', name: 'Лучший последний' },
        { in: '3\nabcdefghijklmnopqrst 7 7\nabc 7 7\nabd 7 7\n', name: 'Длинное имя' },
        { in: '2\nsame 5 5\nsame 5 5\n', name: 'Полные дубликаты' },
      ],
    },
    {
      title: 'Найди ошибку: изменение литерала',
      bug: true,
      description: `
Программа хранит таблицу команд. Для каждого из \`q\` запросов она получает номер команды и печатает её название, сделав первую букву заглавной. Программа аварийно завершается на первом же запросе.

Найдите ошибку и исправьте её так, чтобы таблица оставалась изменяемой (функция \`capitalize\` должна менять строку на месте).`,
      constraints: ['1 ≤ q ≤ 10.', '0 ≤ номер ≤ 3.'],
      hints: [
        'Куда указывают элементы массива commands? Можно ли менять эти байты?',
        'Нужны собственные изменяемые массивы символов: char commands[][8] = {"start", "stop", "pause", "resume"}; — литералы скопируются в массив.',
      ],
      starter: String.raw`
#include <ctype.h>
#include <stdio.h>

void capitalize(char *word) {
    word[0] = (char)toupper((unsigned char)word[0]);
}

int main(void) {
    char *commands[] = {"start", "stop", "pause", "resume"};
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int id;
        scanf("%d", &id);
        capitalize(commands[id]);
        printf("%s\n", commands[id]);
    }
    return 0;
}`,
      solution: String.raw`
#include <ctype.h>
#include <stdio.h>

void capitalize(char *word) {
    word[0] = (char)toupper((unsigned char)word[0]);
}

int main(void) {
    char commands[][8] = {"start", "stop", "pause", "resume"};
    int q;
    scanf("%d", &q);
    for (int i = 0; i < q; i++) {
        int id;
        scanf("%d", &id);
        capitalize(commands[id]);
        printf("%s\n", commands[id]);
    }
    return 0;
}`,
      explanation: `
\`char *commands[]\` — массив указателей на **строковые литералы**, а литералы лежат в памяти только для чтения. Запись \`word[0] = …\` вызывает ошибку сегментации. Компилятор C не предупреждает, потому что тип литерала исторически \`char[N]\`, а не \`const char[N]\`.

\`char commands[][8]\` — двумерный массив символов в кадре \`main\`: литералы **копируются** в него при инициализации, и копии можно изменять. Если бы таблицу менять было не нужно, правильным объявлением было бы \`const char *commands[]\` — тогда ошибка стала бы видна ещё при компиляции.`,
      examples: [
        { in: '2\n0\n3\n', out: 'Start\nResume\n' },
        { in: '1\n1\n', out: 'Stop\n' },
      ],
      hidden: [
        { in: '1\n2\n', name: 'pause' },
        { in: '1\n3\n', name: 'resume' },
        { in: '4\n0\n1\n2\n3\n', name: 'Все команды' },
        { in: '2\n1\n1\n', name: 'Повторный запрос' },
        { in: '3\n3\n2\n1\n', name: 'Обратный порядок' },
        { in: '1\n0\n', name: 'start' },
        { in: '5\n0\n0\n0\n0\n0\n', name: 'Пять раз start' },
        { in: '10\n0\n1\n2\n3\n0\n1\n2\n3\n0\n1\n', name: 'Десять запросов' },
      ],
    },
  ],
};
