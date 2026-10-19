const KEY_VALUE = (fixed) => String.raw`
#include <iostream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::size_t eq = line.find('=');${
          fixed
            ? `
        if (eq == std::string::npos) {
            std::cout << "нет значения: " << line << '\\n';
            continue;
        }`
            : ''
        }
        std::string key = line.substr(0, eq);
        std::string value = line.substr(eq + 1);
        std::cout << "ключ " << key << ", значение " << value << '\n';
    }
    return 0;
}`;

export default {
  id: 'cpp20-string',
  title: 'Строки: std::string',
  description:
    'Строка, которая хранит длину и управляет памятью; size, +=, push_back и доступ по индексу; сравнение и склеивание; find, rfind, npos и substr; insert, replace, erase; to_string и stoi; at и c_str; стоимость копирования.',
  moduleId: 'cpp-fundamentals',
  order: 6,
  difficulty: 'beginner',
  estimatedMinutes: 45,
  prerequisites: ['cpp20-cin'],
  objectives: [
    'Создавать, изменять и сравнивать строки std::string',
    'Искать подстроки и правильно обрабатывать npos',
    'Переводить числа в строки и обратно',
    'Передавать строки функциям C через c_str',
  ],
  tags: ['C++', 'string', 'Строки'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string s = "abc";
    s += s;
    s.push_back('!');
    std::cout << s << ' ' << s.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['abcabc! 7'],
      placeholder: 'Вывод программы',
      explain: 's += s дописывает копию строки к самой себе: «abcabc», затем «!» — семь символов.',
    },
    {
      q: 'Что возвращает find, если подстрока не найдена?',
      options: ['std::string::npos', '−1 типа int', '0', 'Длину строки'],
      correct: 0,
      explain:
        'npos — наибольшее значение std::size_t. Его нужно явно сравнивать с результатом find, а позиции хранить в std::size_t.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string s = "2026-10-17";
    std::cout << s.substr(5, 2) << s.substr(8) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1017'],
      placeholder: 'Вывод программы',
      explain:
        'substr(5, 2) — два символа с позиции 5: «10»; substr(8) — от позиции 8 до конца: «17».',
    },
    {
      q: 'Какое выражение не скомпилируется?',
      options: [
        '"Hello, " + "world"',
        'std::string("Hello, ") + "world"',
        'std::string s = "Hello"; s + \'!\'',
        'std::string a, b; a + b',
      ],
      correct: 0,
      explain:
        'Два строковых литерала — это два указателя const char *, а складывать указатели нельзя. Хотя бы один операнд должен быть std::string.',
    },
    {
      q: 'Почему "apple" > "Apple" при сравнении std::string?',
      options: [
        'Сравнение идёт по кодам символов, а код строчной a больше кода заглавной A',
        'Строчные буквы всегда больше в любой кодировке по правилам языка',
        'Сравниваются длины строк',
        'Сравниваются адреса строк',
      ],
      correct: 0,
      explain:
        'Операторы сравнения std::string работают лексикографически по кодам символов, как strcmp.',
    },
    {
      q: 'Чем s.at(i) отличается от s[i]?',
      options: [
        'at проверяет индекс и при выходе за границы бросает исключение std::out_of_range',
        'at работает быстрее',
        'at возвращает копию символа, а [] — ссылку',
        'Ничем',
      ],
      correct: 0,
      explain:
        's[i] за границами — неопределённое поведение, как в массиве C. at делает ошибку явной.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string a = "copy";
    std::string b = a;
    b[0] = 'C';
    std::cout << a << ' ' << b << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['copy Copy'],
      placeholder: 'Вывод программы',
      explain:
        'std::string b = a создаёт независимую копию символов. Изменение b не затрагивает a — в отличие от копирования указателя char *.',
    },
    {
      q: 'Какие утверждения верны?',
      options: [
        'size() работает за O(1)',
        'std::to_string(42) возвращает строку "42"',
        'c_str() возвращает указатель, который остаётся действительным после любых изменений строки',
        'insert в середину строки стоит O(n)',
      ],
      correct: [0, 1, 3],
      explain:
        'После изменения строки её буфер может переехать, и указатель из c_str() станет недействительным.',
    },
  ],
  exercises: [
    {
      title: 'Инициалы',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — фамилия, имя и, возможно, отчество латинскими буквами через пробел. Напечатайте фамилию и инициалы: \`Ivanov I. P.\` или \`Ivanov I.\`, если отчества нет.`,
      constraints: [
        'Строк не больше 30; в строке 2 или 3 слова, каждое начинается с заглавной буквы.',
      ],
      hints: [
        'Разберите строку строковым потоком: std::istringstream in(line); in >> surname >> name >> patronymic; — если отчества нет, третье чтение не удастся и patronymic останется пустой.',
        'Инициал — первый символ: name[0]. Ответ удобно собрать в std::string: result = surname + " " + name[0] + ".".',
      ],
      solution: String.raw`
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::string surname, name, patronymic;
        in >> surname >> name >> patronymic;
        std::string result = surname + " " + name[0] + ".";
        if (!patronymic.empty()) {
            result += " ";
            result += patronymic[0];
            result += ".";
        }
        std::cout << result << '\n';
    }
    return 0;
}`,
      explanation: `
Строка разбирается на слова строковым потоком: если третьего слова нет, чтение \`patronymic\` не удаётся и строка остаётся пустой — это проверяет \`empty()\`.

Выражение \`surname + " " + name[0] + "."\` вычисляется слева направо: \`surname + " "\` — уже \`std::string\`, к нему можно прибавить символ \`name[0]\` и литерал. Если бы выражение начиналось с двух литералов или литерала и символа, склеивания не было бы — получилась бы арифметика указателей.`,
      examples: [
        { in: 'Ivanov Ivan Petrovich\n', out: 'Ivanov I. P.\n' },
        { in: 'Lovelace Ada\nHopper Grace Murray\n', out: 'Lovelace A.\nHopper G. M.\n' },
      ],
      hidden: [
        'Ritchie Dennis\n',
        'Stroustrup Bjarne Q\n',
        'A B C\n',
        'A B\n',
        'Torvalds Linus Benedict\nThompson Ken\n',
        'Knuth Donald Ervin\n',
        'Kernighan Brian Wilson\nPike Rob\n',
        'Liskov Barbara Jane\n',
      ],
    },
    {
      title: 'Замена подстроки',
      description: `
Первая строка ввода — два слова: что искать (\`from\`) и чем заменять (\`to\`). Дальше идут строки текста. В каждой строке замените все вхождения \`from\` на \`to\` слева направо (найденное вхождение заменяется, поиск продолжается после вставленного текста) и напечатайте строку.`,
      constraints: [
        'from и to — непустые слова без пробелов, до 20 символов; строк текста не больше 30, длиной до 200 символов.',
      ],
      hints: [
        'Цикл: pos = line.find(from, pos); пока pos != std::string::npos — line.replace(pos, from.size(), to); pos += to.size(); — и снова find.',
        'Продолжать поиск нужно после вставленного текста (pos += to.size()), иначе при to, содержащем from, цикл никогда не закончится.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string from, to;
    if (!(std::cin >> from >> to)) {
        return 0;
    }
    std::string line;
    std::getline(std::cin, line);
    while (std::getline(std::cin, line)) {
        std::size_t pos = line.find(from);
        while (pos != std::string::npos) {
            line.replace(pos, from.size(), to);
            pos = line.find(from, pos + to.size());
        }
        std::cout << line << '\n';
    }
    return 0;
}`,
      explanation: `
\`find(from, pos)\` ищет начиная с позиции \`pos\`, \`replace(pos, len, to)\` заменяет \`len\` символов строкой \`to\` — длины могут не совпадать, строка сама сдвинет хвост. После замены поиск продолжается **за** вставленным текстом: если начать с той же позиции, а \`to\` содержит \`from\` (например, \`a\` → \`aa\`), цикл заменял бы бесконечно.

Первая строка читается оператором \`>>\`, а остаток этой строки пропускается пустым \`getline\` — иначе первый «текст» оказался бы пустой строкой.`,
      examples: [
        { in: 'cat dog\nthe cat sat on a cat\n', out: 'the dog sat on a dog\n' },
        { in: 'a aa\nbanana\n', out: 'baanaanaa\n' },
      ],
      hidden: [
        { in: 'x y\nno match here\n', name: 'Нет вхождений' },
        { in: 'ab X\nababab\n', name: 'Подряд' },
        { in: 'aa b\naaaaa\n', name: 'Перекрывающиеся' },
        { in: 'C C++\nC and C\nC\n', name: 'Несколько строк' },
        { in: 'long s\nlonglonglong\n', name: 'Короче исходного' },
        { in: 's longer\nsss\n', name: 'Длиннее исходного' },
        { in: 'the THE\nthe theme of the\n', name: 'Внутри слова' },
        { in: 'z zz\nzzz\n\nz\n', name: 'Пустая строка' },
      ],
    },
    {
      title: 'Найди ошибку: ключ и значение',
      bug: true,
      description: `
Каждая строка ввода — пара вида \`ключ=значение\` или просто текст без знака \`=\`. Для пары программа печатает \`ключ K, значение V\`, а для строки без \`=\` должна печатать \`нет значения: СТРОКА\`.

Строки без \`=\` обрабатываются неправильно. Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 30, длиной до 100 символов.'],
      hints: [
        'Что возвращает find, если символа нет? Чему тогда равны line.substr(0, eq) и line.substr(eq + 1)?',
        'npos — наибольшее значение size_t, и npos + 1 переполняется в 0. Проверьте eq == std::string::npos до вызова substr.',
      ],
      starter: KEY_VALUE(false),
      solution: KEY_VALUE(true),
      explanation: `
Если знака \`=\` нет, \`find\` возвращает \`npos\`. Заготовка этого не проверяет: \`line.substr(0, npos)\` — вся строка (длина обрезается до конца строки), а \`line.substr(npos + 1)\` — это \`substr(0)\`, потому что беззнаковое \`npos + 1\` переполняется в ноль. В итоге и ключ, и значение равны всей строке, и программа не падает, а молча печатает неверный ответ.

\`npos\` — не ошибка, которую можно не заметить, а обычное значение, которое нужно обработать. Сравнение с ним должно стоять сразу после \`find\`, до любого использования позиции.`,
      examples: [
        { in: 'name=Ada\nyear=1843\n', out: 'ключ name, значение Ada\nключ year, значение 1843\n' },
        { in: 'comment\n', out: 'нет значения: comment\n' },
      ],
      hidden: [
        '=x\n',
        'x=\n',
        'a=b=c\n',
        'plain text line\n',
        '\n',
        'k=v\nno pair\nk2=v2\n',
        'path=/usr/bin\n',
        'equals sign missing here\n',
      ],
    },
    {
      title: 'Сжатие повторов',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — команда и строка из строчных латинских букв или код:

- \`encode s\` — сжать \`s\`: каждая серия одинаковых букв записывается буквой и, если серия длиннее 1, её длиной: \`aaabcc\` → \`a3bc2\`;
- \`decode s\` — развернуть код обратно: \`a3bc2\` → \`aaabcc\`.

Напечатайте результат каждой команды.`,
      constraints: [
        'Для encode — от 1 до 1000 букв.',
        'Для decode — корректный код: буквы, после которых может идти число от 2 до 1000; результат не длиннее 10 000 символов; строк не больше 20.',
      ],
      hints: [
        'Кодирование: идите по строке, считая длину текущей серии; когда символ меняется или строка кончилась — допишите букву и, если длина больше 1, std::to_string(длина).',
        "Декодирование: запомните букву, затем соберите идущие следом цифры в число (count = count * 10 + (c - '0')); если цифр нет, count = 1. Добавить символ count раз: result.append(count, буква).",
      ],
      solution: String.raw`
#include <iostream>
#include <string>

std::string encode(const std::string &s) {
    std::string result;
    for (std::size_t i = 0; i < s.size();) {
        std::size_t j = i;
        while (j < s.size() && s[j] == s[i]) {
            j++;
        }
        result += s[i];
        if (j - i > 1) {
            result += std::to_string(j - i);
        }
        i = j;
    }
    return result;
}

std::string decode(const std::string &code) {
    std::string result;
    for (std::size_t i = 0; i < code.size();) {
        char letter = code[i++];
        std::size_t count = 0;
        while (i < code.size() && code[i] >= '0' && code[i] <= '9') {
            count = count * 10 + static_cast<std::size_t>(code[i] - '0');
            i++;
        }
        result.append(count == 0 ? 1 : count, letter);
    }
    return result;
}

int main() {
    std::string command, s;
    while (std::cin >> command >> s) {
        std::cout << (command == "encode" ? encode(s) : decode(s)) << '\n';
    }
    return 0;
}`,
      explanation: `
Кодирование находит границы серий двумя индексами: \`i\` — начало серии, \`j\` идёт вперёд, пока символы совпадают. Длина серии \`j − i\` превращается в текст через \`std::to_string\` и дописывается к результату. Декодирование — обратный разбор: буква, затем, возможно, многозначное число, которое собирается по цифрам.

Строки здесь растут по одному символу или куску — \`+=\` и \`append\` работают как добавление в конец динамического массива, амортизированно за \`O(1)\` на символ. Функции возвращают \`std::string\` по значению: в C++ это нормально, современные компиляторы не копируют возвращаемую строку. Такое сжатие (RLE) используют в простых графических форматах и факсах — оно выгодно, когда длинных серий много.`,
      examples: [
        { in: 'encode aaabcc\ndecode a3bc2\n', out: 'a3bc2\naaabcc\n' },
        { in: 'encode abc\n', out: 'abc\n' },
      ],
      hidden: [
        { in: 'encode a\n', name: 'Одна буква' },
        { in: 'decode a\n', name: 'Декодирование одной буквы' },
        { in: 'encode zzzzzzzzzzzz\n', name: 'Двузначная длина' },
        { in: 'decode z12\n', name: 'Декодирование двузначного числа' },
        { in: `encode ${'b'.repeat(1000)}\n`, name: 'Серия из 1000' },
        { in: 'decode a1000b2\n', name: 'Длинный результат' },
        { in: 'encode aabbaa\n', name: 'Повторяющиеся серии' },
        { in: 'decode x2y3x2\nencode xxyyyxx\n', name: 'Туда и обратно' },
      ],
    },
  ],
};
