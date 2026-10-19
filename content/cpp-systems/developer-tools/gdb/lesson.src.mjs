export default {
  id: 'advanced-gdb',
  title: 'Отладчик GDB',
  description:
    'Сборка с -g, запуск программы в GDB, точки останова и условия, next, step, finish и continue, print и info locals, стек вызовов bt и frame, разбор падения и точки наблюдения watch.',
  moduleId: 'developer-tools',
  order: 9,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['advanced-cmake'],
  objectives: [
    'Запускать программу в GDB и останавливать её точками останова',
    'Проходить код по шагам и смотреть значения переменных',
    'Находить место падения по стеку вызовов',
    'Находить момент изменения переменной точкой наблюдения',
  ],
  tags: ['GDB', 'Отладка', 'Точки останова', 'Стек вызовов', 'watch'],
  standard: 'c23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'С какими флагами собрать программу для удобной отладки в GDB?',
      options: ['-g -O0', '-O2', '-O3 -DNDEBUG', '-Wall'],
      correct: 0,
      explain:
        '-g добавляет отладочную информацию, -O0 сохраняет код близким к исходнику. -Wall полезен, но на отладку не влияет.',
    },
    {
      q: 'Программа остановлена на строке total = compute(x);. Чем next отличается от step?',
      options: [
        'next выполнит строку целиком, step зайдёт внутрь compute',
        'step выполнит строку целиком, next зайдёт внутрь compute',
        'next продолжит до следующей точки останова',
        'Ничем',
      ],
      correct: 0,
      explain:
        'step нужен, когда ошибка, вероятно, внутри вызываемой функции; next — когда ей можно доверять.',
    },
    {
      q: 'Какой командой GDB посмотреть цепочку вызовов, которая привела к текущему месту?',
      answers: ['bt', 'backtrace', 'where'],
      placeholder: 'Команда',
      explain: 'bt печатает кадры от текущей функции до main; frame N переключает на нужный кадр.',
    },
    {
      q: 'Что напечатает print arr[0]@3, если int arr[5] = {7, 8, 9, 10, 11}?',
      options: ['{7, 8, 9}', '7', '{7, 8, 9, 10, 11}', '3'],
      correct: 0,
      explain: 'Запись x@n показывает n элементов подряд, начиная с x.',
    },
    {
      q: 'Переменная limit где-то получает неверное значение, но в коде много мест, где она меняется. Что поможет быстрее всего?',
      options: [
        'watch limit — GDB остановится в момент изменения',
        'break main и много раз next',
        'print limit в начале программы',
        'Пересобрать с -O2',
      ],
      correct: 0,
      explain:
        'Точка наблюдения покажет старое и новое значение и строку, где произошло изменение, — даже если запись идёт по чужому указателю.',
    },
    {
      q: 'Программа упала с SIGSEGV, кадр #0 — __memcpy_avx_unaligned в libc. Что делать дальше?',
      options: [
        'Подняться по bt до первого кадра своего кода и проверить аргументы вызова',
        'Сообщить об ошибке в библиотеке C',
        'Пересобрать программу без -g',
        'Заменить memcpy на цикл',
      ],
      correct: 0,
      explain:
        'Библиотечная функция падает, когда ей передали неверный указатель или размер. Ошибка — в месте вызова.',
    },
    {
      q: 'Напишите команду GDB, которая ставит точку останова на строку 25 файла parser.c.',
      answers: ['break parser.c:25', 'b parser.c:25'],
      placeholder: 'Команда',
      explain: 'Формат файл:строка; если файл один, достаточно номера строки: b 25.',
    },
    {
      q: 'Цикл выполняется 1000 раз, ошибка проявляется при i == 999. Как остановиться сразу в нужной итерации?',
      options: ['break 30 if i == 999', 'break 30 и 999 раз continue', 'watch i', 'step 999'],
      correct: 0,
      explain:
        'Условная точка останова проверяет выражение при каждом прохождении строки и останавливает программу, только когда оно истинно.',
    },
    {
      q: 'Что делает команда finish?',
      options: [
        'Дорабатывает текущую функцию до возврата и показывает возвращённое значение',
        'Завершает программу',
        'Удаляет все точки останова',
        'Выходит из GDB',
      ],
      correct: 0,
      explain:
        'finish удобен, если вы случайно зашли step в неинтересную функцию или хотите увидеть её результат.',
    },
  ],
  exercises: [
    {
      title: 'Читаем backtrace',
      difficulty: 'beginner',
      description: `
На вход до конца ввода подаётся вывод команды \`bt\`. Строки кадров начинаются с \`#N\`; остальные строки пропускайте. Кадр выглядит так:

\`\`\`
#1  0x0000555555555190 in longest (words=0x7fffffffe3b0, count=3) at main.c:7
#2  main () at main.c:17
#0  0x00007ffff7e4b6a5 in __strlen_avx2 () from /lib/x86_64-linux-gnu/libc.so.6
\`\`\`

Адрес и слово \`in\` могут отсутствовать. Имя функции идёт до \` (\`. Место — после последнего \` at \` в виде \`файл:строка\` или после \` from \` (библиотека).

Кадр относится к **вашему коду**, если у него есть \` at \`, а файл не начинается с \`/\` и \`../\`.

Напечатайте:
- \`цепочка: …\` — функции от последнего кадра к \`#0\` через \` -> \`; у кадров вашего кода после имени в скобках место \`(файл:строка)\`;
- \`ваш код: функция, файл:строка\` для кадра вашего кода с наименьшим номером или \`ваш код: не найден\`.`,
      constraints: [
        'От 1 до 30 кадров, строки не длиннее 300 символов; кадры идут по возрастанию номеров.',
      ],
      hints: [
        'Начало имени: после номера и пробелов; если там адрес 0x…, имя начинается после подстроки " in ". Конец имени — strstr(name, " (").',
        'Последнее вхождение " at " найдите циклом: while ((next = strstr(p + 1, " at ")) != NULL) p = next;.',
        'Кадры сохраните в массив и печатайте цепочку с конца.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

#define LINE 320
#define FRAMES 30

static char functions[FRAMES][LINE];
static char places[FRAMES][LINE];
static int is_user[FRAMES];

int main(void) {
    char line[LINE];
    int count = 0;
    while (fgets(line, sizeof line, stdin) != NULL && count < FRAMES) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] != '#') {
            continue;
        }
        char *p = line + 1;
        while (*p >= '0' && *p <= '9') {
            p++;
        }
        while (*p == ' ') {
            p++;
        }
        if (strncmp(p, "0x", 2) == 0) {
            char *in = strstr(p, " in ");
            if (in == NULL) {
                continue;
            }
            p = in + 4;
        }
        char *paren = strstr(p, " (");
        size_t length = paren != NULL ? (size_t)(paren - p) : strlen(p);
        memcpy(functions[count], p, length);
        functions[count][length] = '\0';
        char *at = strstr(p, " at ");
        if (at != NULL) {
            char *next;
            while ((next = strstr(at + 1, " at ")) != NULL) {
                at = next;
            }
            strcpy(places[count], at + 4);
            is_user[count] = places[count][0] != '/' && strncmp(places[count], "../", 3) != 0;
        } else {
            places[count][0] = '\0';
            is_user[count] = 0;
        }
        count++;
    }
    printf("цепочка:");
    for (int i = count - 1; i >= 0; i--) {
        printf(" %s", functions[i]);
        if (is_user[i]) {
            printf(" (%s)", places[i]);
        }
        if (i > 0) {
            printf(" ->");
        }
    }
    putchar('\n');
    for (int i = 0; i < count; i++) {
        if (is_user[i]) {
            printf("ваш код: %s, %s\n", functions[i], places[i]);
            return 0;
        }
    }
    printf("ваш код: не найден\n");
    return 0;
}`,
      explanation: `
Backtrace читают снизу вверх, чтобы понять **как** программа сюда попала, и сверху вниз, чтобы найти **где** искать ошибку. Верхние кадры часто принадлежат библиотеке C: \`strlen\`, \`memcpy\`, \`printf\` падают, когда получили неверный указатель. Пути вида \`../sysdeps/…\` или \`from /lib/…\` выдают чужой код.

Первый кадр вашего кода — место, где был сформирован плохой аргумент или нарушено условие. С него начинается расследование: \`frame N\`, затем \`info locals\` и \`print\` для подозрительных значений.`,
      examples: [
        {
          in: '#0  __strlen_avx2 () at ../sysdeps/x86_64/multiarch/strlen-avx2.S:76\n#1  0x0000555555555190 in longest (words=0x7fffffffe3b0, count=3) at main.c:7\n#2  0x00005555555551f4 in main () at main.c:17\n',
          out: 'цепочка: main (main.c:17) -> longest (main.c:7) -> __strlen_avx2\nваш код: longest, main.c:7\n',
        },
        {
          in: '#0  sum (values=0x7fffffffe3d0, count=4) at main.c:6\n#1  0x00005555555551d2 in main () at main.c:13\n',
          out: 'цепочка: main (main.c:13) -> sum (main.c:6)\nваш код: sum, main.c:6\n',
        },
      ],
      hidden: [
        {
          in: '#0  0x00007ffff7e4b6a5 in __strlen_avx2 () from /lib/x86_64-linux-gnu/libc.so.6\n#1  0x00007ffff7e01234 in puts () from /lib/x86_64-linux-gnu/libc.so.6\n',
          name: 'Только библиотека',
        },
        { in: '#0  main () at main.c:3\n', name: 'Один кадр' },
        {
          in: 'Program received signal SIGSEGV, Segmentation fault.\n#0  parse_number (s=0x0) at src/parser.c:42\n#1  0x0000555555555300 in parse (line=0x5555555592a0 "1 + x") at src/parser.c:80\n#2  0x0000555555555400 in main (argc=1, argv=0x7fffffffe4a8) at src/main.c:12\n(gdb)\n',
          name: 'Посторонние строки',
        },
        {
          in: '#0  __memmove_avx_unaligned_erms () at ../sysdeps/x86_64/multiarch/memmove-vec-unaligned-erms.S:317\n#1  0x00005555555551a0 in copy_name (dst=0x7fffffffe3b0 "", src=0x0) at names.c:14\n#2  0x00005555555551f0 in main () at names.c:30\n',
          name: 'memmove',
        },
        {
          in: '#0  helper (msg=0x5555555560 "look at me") at util.c:5\n#1  0x0000555555555170 in main () at main.c:9\n',
          name: '" at " в аргументе',
        },
        {
          in: '#0  0x00007ffff7c4a9fc in __pthread_kill_implementation () from /lib/libc.so.6\n#1  0x00007ffff7bf6476 in raise () from /lib/libc.so.6\n#2  0x00007ffff7bdc7f3 in abort () from /lib/libc.so.6\n#3  0x00007ffff7bdc71b in __assert_fail_base () from /lib/libc.so.6\n#4  0x0000555555555189 in check_range (value=-1) at check.c:8\n#5  0x00005555555551c0 in main () at check.c:20\n',
          name: 'Сработал assert',
        },
        {
          in: '#0  free_list (head=0x5555555592c0) at /usr/src/app/list.c:31\n#1  0x0000555555555300 in main () at /usr/src/app/main.c:44\n',
          name: 'Абсолютные пути',
        },
        {
          in: '#0  visit (node=0x0, depth=3) at tree.c:12\n#1  0x0000555555555220 in visit (node=0x5555555593a0, depth=2) at tree.c:15\n#2  0x0000555555555220 in visit (node=0x555555559380, depth=1) at tree.c:15\n#3  0x0000555555555260 in main () at tree.c:40\n',
          name: 'Рекурсия',
        },
        {
          in: '#0  0x0000555555555199 in step () at sim.c:3\n#1  run () at sim.c:9\n#2  0x00005555555551e0 in main () at sim.c:14\n',
          name: 'Кадр без адреса в середине',
        },
      ],
    },
    {
      title: 'Точка наблюдения',
      difficulty: 'beginner',
      description: `
Смоделируйте команду \`watch\`. В первой строке — \`watch ИМЯ\`. Во второй — число событий \`n\`, далее \`n\` строк \`строка переменная значение\`: при выполнении строки программы переменной присвоено значение. В начале все переменные равны 0.

GDB останавливается, только когда наблюдаемая переменная **меняет** значение. Для каждой остановки напечатайте \`строка L: СТАРОЕ -> НОВОЕ\`. В конце напечатайте \`остановок: K\`.`,
      constraints: [
        '1 ≤ n ≤ 1000; имена не длиннее 30 символов; значения — целые от −10¹⁸ до 10¹⁸.',
      ],
      hints: [
        'Отслеживать нужно только одну переменную: храните её текущее значение в long long current = 0.',
        'Событие с другой переменной пропускайте; событие с наблюдаемой — сравнивайте новое значение с current.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char watched[64];
    int n;
    if (scanf("watch %63s %d", watched, &n) != 2) {
        return 0;
    }
    long long current = 0;
    int stops = 0;
    for (int i = 0; i < n; i++) {
        int line;
        char name[64];
        long long value;
        if (scanf("%d %63s %lld", &line, name, &value) != 3) {
            break;
        }
        if (strcmp(name, watched) != 0 || value == current) {
            continue;
        }
        printf("строка %d: %lld -> %lld\n", line, current, value);
        current = value;
        stops++;
    }
    printf("остановок: %d\n", stops);
    return 0;
}`,
      explanation: `
Точка наблюдения реагирует на **изменение значения**, а не на присваивание: \`total = total;\` или запись того же числа программу не остановит. Аппаратные точки наблюдения (\`Hardware watchpoint\`) процессор проверяет сам при каждой записи по адресу, поэтому программа почти не замедляется.

Это самый быстрый способ найти, кто портит переменную: вместо поиска всех мест, где она упоминается, отладчик сам укажет на строку — даже если запись идёт через чужой указатель или за границей соседнего массива.`,
      examples: [
        {
          in: 'watch total\n4\n5 total 0\n6 total 3\n6 i 1\n6 total 4\n',
          out: 'строка 6: 0 -> 3\nстрока 6: 3 -> 4\nостановок: 2\n',
        },
        { in: 'watch limit\n2\n3 count 7\n4 count 8\n', out: 'остановок: 0\n' },
      ],
      hidden: [
        { in: 'watch x\n1\n10 x 5\n', name: 'Одно изменение' },
        { in: 'watch x\n3\n1 x 0\n2 x 0\n3 x 0\n', name: 'Присваивание того же значения' },
        { in: 'watch x\n4\n1 x 1\n2 x 2\n3 x 1\n4 x 1\n', name: 'Возврат к старому' },
        {
          in: 'watch big\n2\n7 big 1000000000000000000\n8 big -1000000000000000000\n',
          name: 'Большие числа',
        },
        { in: 'watch a\n3\n1 ab 5\n2 b 5\n3 a 5\n', name: 'Похожие имена' },
        { in: 'watch n\n5\n2 n -1\n3 n -2\n4 m -3\n5 n -2\n6 n 0\n', name: 'Отрицательные' },
        {
          in: 'watch limit\n6\n12 limit 10\n20 buf 65\n21 buf 66\n22 limit 66\n23 limit 66\n30 limit 10\n',
          name: 'Порча соседней переменной',
        },
        { in: 'watch sum\n1\n4 total 9\n', name: 'Другая переменная' },
        {
          in: 'watch i\n8\n5 i 0\n5 i 1\n5 i 2\n5 i 3\n6 sum 6\n5 i 4\n5 i 5\n7 i 5\n',
          name: 'Счётчик цикла',
        },
      ],
    },
    {
      title: 'Сеанс отладчика',
      difficulty: 'advanced',
      description: `
Смоделируйте сеанс GDB. В первой строке — длина трассы \`t\` и \`t\` номеров строк: в таком порядке программа выполняет строки при запуске. Далее до конца ввода — команды:

| Команда | Действие и вывод |
| --- | --- |
| \`break N\` | точка останова с очередным номером K (нумерация общая, с 1): \`Breakpoint K at line N\` |
| \`tbreak N\` | временная точка, удаляется после первого срабатывания: \`Temporary breakpoint K at line N\` |
| \`delete K\` | удалить точку K; если её нет — \`No breakpoint number K.\` |
| \`run\` | запустить программу с начала трассы (даже если она уже запущена) |
| \`continue\` | продолжить с позиции после текущей |
| \`next\` | перейти к следующей позиции трассы: \`line N\`; точки останова при этом не проверяются |
| \`info breakpoints\` | для каждой точки: \`K line N hits H\`, у временных в конце \` temp\`; если точек нет — \`No breakpoints.\` |

При \`run\` и \`continue\` программа выполняется до первой позиции, строка которой совпадает со строкой существующей точки останова. Если таких точек несколько, срабатывает точка с наименьшим номером: увеличьте её счётчик и напечатайте \`Breakpoint K, line N\` (для временной — \`Temporary breakpoint K, line N\`, после чего удалите её). Если программа дошла до конца трассы — \`program exited\`, и программа больше не выполняется.

Если программа не выполняется, \`continue\` и \`next\` печатают \`The program is not being run.\``,
      constraints: ['1 ≤ t ≤ 1000; не больше 100 команд; номера строк — от 1 до 10⁴.'],
      hints: [
        'Состояние: позиция в трассе pos и флаг running. Точки храните в массиве структур { number, line, hits, temporary, deleted }.',
        'Общая функция resume(start) ищет первую позицию p ≥ start, для которой есть точка на строке trace[p]. Для run — start = 0, для continue — pos + 1.',
        'Команды читайте словами: scanf("%15s", command), затем для break, tbreak и delete — число.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

typedef struct {
    int line;
    int hits;
    int temporary;
    int deleted;
} Breakpoint;

static int trace[1000];
static int trace_length;
static Breakpoint points[101];
static int point_count;
static int pos;
static int running;

static int find_point(int line) {
    for (int i = 0; i < point_count; i++) {
        if (!points[i].deleted && points[i].line == line) {
            return i;
        }
    }
    return -1;
}

static void resume(int start) {
    for (int p = start; p < trace_length; p++) {
        int k = find_point(trace[p]);
        if (k >= 0) {
            pos = p;
            running = 1;
            points[k].hits++;
            printf("%sreakpoint %d, line %d\n", points[k].temporary ? "Temporary b" : "B", k + 1,
                   trace[p]);
            if (points[k].temporary) {
                points[k].deleted = 1;
            }
            return;
        }
    }
    running = 0;
    printf("program exited\n");
}

int main(void) {
    if (scanf("%d", &trace_length) != 1) {
        return 0;
    }
    for (int i = 0; i < trace_length; i++) {
        if (scanf("%d", &trace[i]) != 1) {
            return 0;
        }
    }
    char command[16];
    while (scanf("%15s", command) == 1) {
        if (strcmp(command, "break") == 0 || strcmp(command, "tbreak") == 0) {
            int line;
            if (scanf("%d", &line) != 1 || point_count >= 100) {
                break;
            }
            Breakpoint *point = &points[point_count++];
            point->line = line;
            point->temporary = command[0] == 't';
            printf("%sreakpoint %d at line %d\n", point->temporary ? "Temporary b" : "B",
                   point_count, line);
        } else if (strcmp(command, "delete") == 0) {
            int number;
            if (scanf("%d", &number) != 1) {
                break;
            }
            if (number < 1 || number > point_count || points[number - 1].deleted) {
                printf("No breakpoint number %d.\n", number);
            } else {
                points[number - 1].deleted = 1;
            }
        } else if (strcmp(command, "run") == 0) {
            resume(0);
        } else if (strcmp(command, "continue") == 0) {
            if (running) {
                resume(pos + 1);
            } else {
                printf("The program is not being run.\n");
            }
        } else if (strcmp(command, "next") == 0) {
            if (!running) {
                printf("The program is not being run.\n");
            } else if (pos + 1 >= trace_length) {
                running = 0;
                printf("program exited\n");
            } else {
                pos++;
                printf("line %d\n", trace[pos]);
            }
        } else if (strcmp(command, "info") == 0) {
            char what[16];
            if (scanf("%15s", what) != 1) {
                break;
            }
            int shown = 0;
            for (int i = 0; i < point_count; i++) {
                if (!points[i].deleted) {
                    printf("%d line %d hits %d%s\n", i + 1, points[i].line, points[i].hits,
                           points[i].temporary ? " temp" : "");
                    shown++;
                }
            }
            if (shown == 0) {
                printf("No breakpoints.\n");
            }
        }
    }
    return 0;
}`,
      explanation: `
Трасса — это последовательность строк, которые выполняет программа; цикл даёт повторы одних и тех же номеров. Поэтому одна точка останова в теле цикла срабатывает много раз, и счётчик \`hits\` в \`info breakpoints\` показывает, сколько итераций прошло. Так же работает и настоящий GDB, а команда \`ignore K 99\` позволяет пропустить первые 99 срабатываний.

Ключевое различие команд: \`continue\` «бежит» до следующей точки, а \`next\` делает ровно один шаг. Временная точка (\`tbreak\`) удобна, чтобы один раз остановиться в начале интересного участка, не загромождая список. Нумерация точек общая и не переиспользуется после \`delete\` — как в GDB.`,
      examples: [
        {
          in: '7 1 2 3 4 3 4 5\nbreak 4\nrun\ncontinue\ninfo breakpoints\ncontinue\n',
          out: 'Breakpoint 1 at line 4\nBreakpoint 1, line 4\nBreakpoint 1, line 4\n1 line 4 hits 2\nprogram exited\n',
        },
        {
          in: '4 10 11 12 13\ntbreak 11\nrun\nnext\nnext\nnext\ncontinue\n',
          out: 'Temporary breakpoint 1 at line 11\nTemporary breakpoint 1, line 11\nline 12\nline 13\nprogram exited\nThe program is not being run.\n',
        },
      ],
      hidden: [
        { in: '3 1 2 3\nrun\n', name: 'Без точек' },
        { in: '3 1 2 3\ncontinue\nnext\ninfo breakpoints\n', name: 'Программа не запущена' },
        {
          in: '5 1 2 3 2 3\nbreak 3\nbreak 2\nrun\ncontinue\ncontinue\ncontinue\ncontinue\n',
          name: 'Две точки',
        },
        {
          in: '4 5 5 5 5\nbreak 5\nbreak 5\nrun\ninfo breakpoints\n',
          name: 'Две точки на одной строке',
        },
        { in: '3 1 2 3\nbreak 2\ndelete 1\ndelete 1\ndelete 7\nrun\n', name: 'Удаление' },
        {
          in: '6 1 2 3 1 2 3\ntbreak 2\nbreak 3\nrun\ncontinue\ncontinue\ninfo breakpoints\n',
          name: 'Временная и обычная',
        },
        { in: '4 1 2 3 4\nbreak 3\nrun\nrun\nnext\nnext\n', name: 'Повторный run' },
        {
          in: '10 1 2 3 4 3 4 3 4 3 5\nbreak 4\nrun\ncontinue\ndelete 1\nbreak 5\ncontinue\ninfo breakpoints\n',
          name: 'Смена точек на ходу',
        },
        { in: '2 7 8\nbreak 8\nrun\nnext\nnext\n', name: 'next в конце' },
      ],
    },
    {
      title: 'Найди ошибку: падение',
      difficulty: 'intermediate',
      bug: true,
      description: `
Программа читает \`n\` слов и печатает длину самого длинного слова и само слово (первое из самых длинных). На всех тестах она аварийно завершается.

В GDB backtrace выглядит так:

\`\`\`
#0  __strlen_avx2 () at ../sysdeps/x86_64/multiarch/strlen-avx2.S:76
#1  0x0000555555555231 in longest (words=0x5555555592a0, count=3) at main.c:8
#2  0x0000555555555390 in main () at main.c:27
\`\`\`

Найдите первый кадр своего кода, выясните, при каком \`i\` происходит падение, и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 100; слова из латинских букв, не длиннее 63 символов.'],
      hints: [
        'Кадр #1 — функция longest, строка с strlen(words[i]). Какое последнее значение принимает i при count = 3?',
        'Массив words содержит count указателей: допустимые индексы — от 0 до count − 1.',
      ],
      starter: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int longest(char *const *words, int count) {
    int best = 0;
    for (int i = 0; i <= count; i++) {
        if (strlen(words[i]) > strlen(words[best])) {
            best = i;
        }
    }
    return best;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) {
        return 0;
    }
    char **words = malloc((size_t)n * sizeof *words);
    char buffer[64];
    for (int i = 0; i < n; i++) {
        scanf("%63s", buffer);
        words[i] = malloc(strlen(buffer) + 1);
        strcpy(words[i], buffer);
    }
    int best = longest(words, n);
    printf("%zu %s\n", strlen(words[best]), words[best]);
    for (int i = 0; i < n; i++) {
        free(words[i]);
    }
    free(words);
    return 0;
}`,
      solution: String.raw`
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int longest(char *const *words, int count) {
    int best = 0;
    for (int i = 0; i < count; i++) {
        if (strlen(words[i]) > strlen(words[best])) {
            best = i;
        }
    }
    return best;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) {
        return 0;
    }
    char **words = malloc((size_t)n * sizeof *words);
    char buffer[64];
    for (int i = 0; i < n; i++) {
        scanf("%63s", buffer);
        words[i] = malloc(strlen(buffer) + 1);
        strcpy(words[i], buffer);
    }
    int best = longest(words, n);
    printf("%zu %s\n", strlen(words[best]), words[best]);
    for (int i = 0; i < n; i++) {
        free(words[i]);
    }
    free(words);
    return 0;
}`,
      explanation: `
Кадр \`#0\` — \`strlen\` из библиотеки C, но она лишь получила плохой указатель. Первый кадр своего кода — \`longest\`, строка 8. В отладчике \`frame 1\` и \`print i\` показали бы \`i = 3\` при \`count = 3\`: условие \`i <= count\` делает лишнюю итерацию и читает \`words[3]\` — за концом массива из трёх указателей.

Без санитайзеров такое чтение иногда «работает» — за массивом случайно оказывается что-то похожее на указатель. AddressSanitizer сообщает \`heap-buffer-overflow\` при первом же запуске, а GDB помогает понять, **почему** индекс вышел за границу.`,
      examples: [
        { in: '3\ngdb debugger stack\n', out: '8 debugger\n' },
        { in: '1\nx\n', out: '1 x\n' },
      ],
      hidden: [
        { in: '2\nab cd\n', name: 'Равные длины — первое' },
        { in: '4\na bb ccc dddd\n', name: 'Последнее длиннее' },
        { in: '4\ndddd ccc bb a\n', name: 'Первое длиннее' },
        { in: '3\nbreak watch frame\n', name: 'Несколько самых длинных' },
        {
          in: '1\nabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk\n',
          name: 'Максимальная длина',
        },
        { in: '5\nrun next step finish continue\n', name: 'Команды GDB' },
        { in: '6\na b c d e f\n', name: 'Однобуквенные' },
        { in: '3\nlong longer longest\n', name: 'Растущие' },
        { in: '2\nbacktrace bt\n', name: 'Два слова' },
      ],
    },
  ],
};
