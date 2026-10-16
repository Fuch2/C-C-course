export default {
  id: 'c17-string-library',
  title: 'Функции для строк: string.h',
  description:
    'strlen, strcpy, strcat, безопасная сборка строк через snprintf, сравнение strcmp, поиск strchr и strstr, типичные ошибки работы со строками.',
  moduleId: 'c-fundamentals',
  order: 33,
  difficulty: 'beginner',
  estimatedMinutes: 50,
  prerequisites: ['c17-c-strings'],
  objectives: [
    'Отличать длину строки от размера массива',
    'Копировать и склеивать строки, проверяя размер буфера',
    'Собирать строки безопасно с помощью snprintf',
    'Сравнивать строки через strcmp и искать в них через strchr и strstr',
  ],
  tags: ['C17', 'Строки', 'string.h', 'strcmp'],
  standard: 'c17',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[20] = "abc";
    strcat(s, "de");
    printf("%zu %zu\n", strlen(s), sizeof(s));
    return 0;
}`,
      answers: ['5 20'],
      placeholder: 'Вывод программы',
      explain: 'После склеивания строка «abcde» длиной 5. Размер массива не меняется — 20 байт.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    printf("%d %d %d\n", strcmp("cat", "car") > 0, strcmp("dog", "dogs") < 0, strcmp("B", "a") < 0);
    return 0;
}`,
      answers: ['1 1 1'],
      placeholder: 'Вывод программы',
      explain:
        "'t' > 'r', поэтому cat > car. Префикс dog короче dogs — идёт раньше. 'B' (66) < 'a' (97).",
    },
    {
      q: 'Когда условие if (strcmp(a, b)) истинно?',
      options: ['Когда строки различаются', 'Когда строки равны', 'Всегда', 'Никогда'],
      correct: 0,
      explain:
        'strcmp возвращает 0 для равных строк, а 0 — это «ложь». Ненулевой результат означает различие.',
    },
    {
      q: 'Что вернёт snprintf(buf, 8, "%d", 123456789)?',
      answers: ['9'],
      placeholder: 'Число',
      explain:
        'snprintf возвращает длину полной строки — 9 символов, хотя в буфер записаны только 7 символов и \\0. Сравнение 9 >= 8 показывает, что произошла обрезка.',
    },
    {
      q: 'Какие вызовы опасны для массива char buf[8]? Выберите все.',
      options: [
        'strcpy(buf, "overflowing");',
        'snprintf(buf, sizeof(buf), "%s", "overflowing");',
        'char t[8]; strcat(t, "x");',
        'strcpy(buf, "ok");',
      ],
      correct: [0, 2],
      explain:
        'strcpy длинной строки переполнит массив. strcat в неинициализированный массив ищет конец строки в мусоре. snprintf с размером безопасен, короткая строка помещается.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "banana";
    char *p = strchr(s, 'n');
    printf("%td %s\n", p - s, p);
    return 0;
}`,
      answers: ['2 nana'],
      placeholder: 'Вывод программы',
      explain:
        'Первая буква n стоит на позиции 2. %s печатает строку, начиная с найденного места: nana.',
    },
  ],
  exercises: [
    {
      title: 'Какое слово раньше',
      description: `
Прочитайте два слова и напечатайте \`<\`, если первое идёт раньше второго при сравнении по кодам символов, \`>\` — если позже, и \`=\` — если слова одинаковые.`,
      constraints: ['Слова из латинских букв и цифр, длина каждого от 1 до 100.'],
      hints: [
        'int r = strcmp(a, b); и три ветки по знаку r.',
        'strcmp возвращает отрицательное число, ноль или положительное число — не обязательно −1, 0 и 1. Сравнивайте результат с нулём.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char a[101], b[101];
    scanf("%100s %100s", a, b);
    int r = strcmp(a, b);
    if (r < 0) {
        printf("<\n");
    } else if (r > 0) {
        printf(">\n");
    } else {
        printf("=\n");
    }
    return 0;
}`,
      explanation: `
Результат \`strcmp\` сохраняется в переменную и сравнивается с нулём — конкретные значения вроде −1 или −17 стандарт не гарантирует.

Тесты включают префиксы (\`abc\` и \`abcd\`) и разный регистр: заглавные буквы имеют меньшие коды, поэтому \`Zoo < apple\`.`,
      examples: [
        { in: 'apple banana', out: '<\n' },
        { in: 'abc abc', out: '=\n' },
      ],
      hidden: ['banana apple', 'abc abcd', 'abcd abc', 'Zoo apple', 'a1 a2', 'x x'],
    },
    {
      title: 'Самое длинное слово',
      description: `
Во вводе — слова до конца ввода. Напечатайте самое длинное слово и его длину через пробел. Если таких несколько, напечатайте то, что встретилось первым.`,
      constraints: ['От 1 до 1000 слов, каждое от 1 до 100 латинских букв.'],
      hints: [
        'Читайте слова в цикле while (scanf("%100s", word) == 1).',
        'Новое лучшее — только при строго большей длине. Копируйте его в отдельный массив через strcpy.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[101], best[101] = "";
    size_t best_length = 0;
    while (scanf("%100s", word) == 1) {
        size_t length = strlen(word);
        if (length > best_length) {
            best_length = length;
            strcpy(best, word);
        }
    }
    printf("%s %zu\n", best, best_length);
    return 0;
}`,
      explanation: `
Шаблон «лучший на данный момент» работает и для строк, только вместо присваивания — \`strcpy\`: массив \`word\` перезаписывается при каждом чтении, и лучшее слово нужно сохранить в отдельном месте.

Строгое \`>\` оставляет первое из слов одинаковой длины. \`strcpy\` здесь безопасен: оба массива по 101 байту, а прочитанное слово не длиннее 100 символов.`,
      examples: [
        {
          in: 'C is a powerful language',
          out: 'powerful 8\n',
          why: 'powerful и language одной длины — выбирается первое.',
        },
        { in: 'one two six', out: 'one 3\n' },
      ],
      hidden: [
        'x',
        'aa bb cc ddd ee fff',
        'supercalifragilisticexpialidocious\nshort',
        'a\nab\nabc\nabcd',
        'abc abd abe',
        `${'b'.repeat(99)} ${'a'.repeat(100)} ${'c'.repeat(100)}`,
      ],
    },
    {
      title: 'Сколько раз встречается',
      description: `
В первой строке — текст, во второй — образец (одно слово). Напечатайте, сколько раз образец встречается в тексте как подстрока. Вхождения могут перекрываться: в \`aaaa\` образец \`aa\` встречается 3 раза.`,
      constraints: ['Длина текста до 1000 символов, образца — от 1 до 100.'],
      hints: [
        'Текст читайте через fgets, образец — через scanf("%100s").',
        'Ищите strstr, начиная с позиции после начала предыдущей находки: p = strstr(p + 1, pattern).',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char text[1002], pattern[101];
    if (fgets(text, sizeof(text), stdin) == NULL) {
        return 0;
    }
    scanf("%100s", pattern);
    int count = 0;
    char *p = strstr(text, pattern);
    while (p != NULL) {
        count++;
        p = strstr(p + 1, pattern);
    }
    printf("%d\n", count);
    return 0;
}`,
      explanation: `
\`strstr\` возвращает место первой находки. Следующий поиск начинается на один символ дальше — так находятся и перекрывающиеся вхождения. Если сдвигаться на длину образца, считались бы только неперекрывающиеся.

Перевод строки, оставшийся в \`text\` после \`fgets\`, здесь не мешает: образец из букв с ним не совпадёт.`,
      examples: [
        { in: 'the cat and the hat\nthe', out: '2\n' },
        { in: 'aaaa\naa', out: '3\n' },
      ],
      hidden: [
        'hello\nworld',
        'abababab\naba',
        'x\nx',
        'mississippi\nissi',
        'aaa\naaaa',
        'ab ab ab\nab b',
      ],
    },
    {
      title: 'Склейка через дефис',
      description: `
Во вводе — число \`n\`, затем \`n\` слов. Склейте их в одну строку через дефис и напечатайте результат и его длину через пробел.

**Пример:** \`3 low level code\` → \`low-level-code 14\`.`,
      constraints: ['1 ≤ n ≤ 50; слова из 1–20 латинских букв.'],
      hints: [
        'Наибольший результат — 50 · 20 + 49 дефисов = 1049 символов. Буфер на 1100 байт хватит.',
        'Начните с пустой строки result[0] = \'\\0\'. Перед каждым словом, кроме первого, — strcat(result, "-").',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char result[1100];
    result[0] = '\0';
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        char word[21];
        scanf("%20s", word);
        if (i > 0) {
            strcat(result, "-");
        }
        strcat(result, word);
    }
    printf("%s %zu\n", result, strlen(result));
    return 0;
}`,
      explanation: `
\`strcat\` ищет конец существующей строки, поэтому \`result\` обязательно начинается как пустая строка — с \`'\\0'\` в первом байте. Размер буфера рассчитан заранее по ограничениям: худший случай — 1049 символов плюс \`'\\0'\`.

Каждый \`strcat\` проходит строку с начала, чтобы найти её конец, — для 50 слов это неважно, но для тысяч частей лучше хранить текущую длину и дописывать сразу в конец.`,
      examples: [
        { in: '3\nlow level code', out: 'low-level-code 14\n' },
        { in: '1\nsingle', out: 'single 6\n' },
      ],
      hidden: [
        '2\na b',
        '5\nthe quick brown fox jumps',
        '4\nx y z w',
        '2\nabcdefghijklmnopqrst abcdefghijklmnopqrst',
        '3\nC is fun',
        `50\n${Array.from({ length: 50 }, (_, i) => 'abcdefghijklmnopqrst'.slice(0, 1 + (i % 20))).join(' ')}`,
      ],
    },
    {
      title: 'Три слова по порядку',
      description: `
Прочитайте три слова и напечатайте их в порядке возрастания по \`strcmp\`, каждое на отдельной строке.`,
      constraints: ['Слова из 1–50 латинских букв.'],
      hints: [
        'Тот же алгоритм, что для трёх чисел в уроке if: три сравнения с обменом.',
        'Обмен строк — через временный массив и три strcpy.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <string.h>

void swap_words(char a[], char b[]) {
    char tmp[51];
    strcpy(tmp, a);
    strcpy(a, b);
    strcpy(b, tmp);
}

int main(void) {
    char a[51], b[51], c[51];
    scanf("%50s %50s %50s", a, b, c);
    if (strcmp(a, b) > 0) {
        swap_words(a, b);
    }
    if (strcmp(b, c) > 0) {
        swap_words(b, c);
    }
    if (strcmp(a, b) > 0) {
        swap_words(a, b);
    }
    printf("%s\n%s\n%s\n", a, b, c);
    return 0;
}`,
      explanation: `
Алгоритм тот же, что для чисел, но строки нельзя обменять присваиванием — только копированием содержимого. Функция \`swap_words\` меняет массивы вызывающего кода: массивы передаются без копирования.

Все массивы одного размера, поэтому \`strcpy\` между ними безопасен.`,
      examples: [
        { in: 'pear apple fig', out: 'apple\nfig\npear\n' },
        { in: 'b a a', out: 'a\na\nb\n' },
      ],
      hidden: ['a b c', 'c b a', 'Banana apple Cherry', 'same same same', 'ab a abc', 'zz z zzz'],
    },
  ],
};
