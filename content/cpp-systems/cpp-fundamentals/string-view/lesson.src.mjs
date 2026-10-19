const FULL_NAME = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <string_view>

// Возвращает «Фамилия, Имя».
${fixed ? 'std::string' : 'std::string_view'} full_name(std::string_view first, std::string_view last) {
    std::string result(last);
    result += ", ";
    result += first;
    return result;
}

int main() {
    std::string first, last;
    while (std::cin >> first >> last) {
        ${fixed ? 'std::string' : 'std::string_view'} name = full_name(first, last);
        std::println("{} ({} байт)", name, name.size());
    }
    return 0;
}`;

export default {
  id: 'cpp23-string-view',
  title: 'Представление строки std::string_view',
  description:
    'Лишние копии строк; std::string_view — указатель и длина без владения; параметр функции по значению; substr, remove_prefix и remove_suffix без копирования; starts_with, ends_with, contains; разбор строки на части; std::from_chars; висячие представления и отсутствие нуля в конце; выбор между string и string_view.',
  moduleId: 'cpp-fundamentals',
  order: 9,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['cpp20-const-references'],
  objectives: [
    'Принимать текст в функциях через std::string_view без копирования',
    'Выделять части строки substr, remove_prefix и remove_suffix',
    'Разбирать строку на поля и числа через std::from_chars',
    'Распознавать висячие представления и выбирать между string и string_view',
  ],
  tags: ['C++17', 'C++23', 'string_view', 'Строки', 'from_chars'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string_view>

int main() {
    std::string_view path = "/home/ada/notes.txt";
    std::size_t slash = path.rfind('/');
    std::println("{} {}", path.substr(slash + 1), path.substr(1, 4));
    return 0;
}`,
      lang: 'cpp',
      answers: ['notes.txt home'],
      placeholder: 'Вывод программы',
      explain:
        'rfind находит последнюю косую черту; после неё — имя файла. substr(1, 4) — четыре символа с позиции 1.',
    },
    {
      q: 'Что хранит объект std::string_view?',
      options: [
        'Указатель на первый символ и длину',
        'Собственную копию всех символов',
        'Указатель на std::string и номер версии',
        'Только указатель: длину он находит по нулевому символу',
      ],
      correct: 0,
      explain:
        'Представление — два числа: где начинаются символы и сколько их. Символами владеет кто-то другой.',
    },
    {
      q: 'Какие вызовы компилируются, если функция объявлена как void show(std::string_view text);? Выберите все.',
      options: [
        'show(std::string("abc"))',
        'show("literal")',
        'char buf[] = "array"; show(buf);',
        'show(42)',
      ],
      correct: [0, 1, 2],
      explain:
        'string_view создаётся из std::string, литерала и массива char без копирования символов. Из числа — нет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string_view>

int main() {
    std::string_view v = "[[data]]";
    v.remove_prefix(2);
    v.remove_suffix(2);
    std::println("{} {}", v, v.size());
    return 0;
}`,
      lang: 'cpp',
      answers: ['data 4'],
      placeholder: 'Вывод программы',
      explain:
        'remove_prefix и remove_suffix сужают представление с краёв; сам литерал не меняется.',
    },
    {
      q: 'Какая из функций безопасна?',
      options: [
        "std::string_view first_word(std::string_view s) { return s.substr(0, s.find(' ')); }",
        'std::string_view greet(std::string_view n) { std::string s = "Hi, "; s += n; return s; }',
        'std::string_view read() { std::string line; std::getline(std::cin, line); return line; }',
        'std::string_view twice(std::string_view s) { return std::string(s) + std::string(s); }',
      ],
      correct: 0,
      explain:
        'first_word возвращает часть аргумента — память принадлежит вызывающему коду. Остальные возвращают представление на строку, которая уничтожается при выходе из функции.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <charconv>
#include <print>
#include <string_view>

int main() {
    std::string_view text = "125kg";
    int value = 0;
    auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), value);
    std::println("{} {}", value, end - text.data());
    return 0;
}`,
      lang: 'cpp',
      answers: ['125 3'],
      placeholder: 'Вывод программы',
      explain:
        'from_chars читает цифры и останавливается на k: прочитано три символа. Ошибки нет, но end показывает, что строка разобрана не целиком.',
    },
    {
      q: 'Почему нельзя писать printf("%s", view.data()) для std::string_view view?',
      options: [
        'Представление не обязано заканчиваться нулевым символом, и printf прочитает лишнее',
        'data() возвращает копию строки, которую никто не освободит',
        'printf не умеет печатать русские буквы',
        'Можно: это то же самое, что c_str()',
      ],
      correct: 0,
      explain:
        'Конец представления задан длиной. Если это часть строки, после неё нет \\0 — printf печатает до первого нуля в памяти.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string_view>

int main() {
    std::string_view name = "test_parser.cpp";
    std::println("{} {} {}", name.starts_with("test"), name.ends_with(".h"), name.contains("pars"));
    return 0;
}`,
      lang: 'cpp',
      answers: ['true false true'],
      placeholder: 'Вывод программы',
      explain: 'Имя начинается с test, заканчивается на .cpp, а не на .h, и содержит pars.',
    },
    {
      q: 'Что не так в строке std::string_view v = first + second; где first и second — std::string?',
      options: [
        'Сумма — временная строка, она уничтожается в конце строки кода, и v сразу висит',
        'Строки нельзя складывать',
        'Нужно явное приведение к string_view',
        'Ничего: представление продлевает жизнь временной строке',
      ],
      correct: 0,
      explain:
        'string_view не владеет символами и не продлевает жизнь объекту. Результат сложения сохраняют в std::string.',
    },
    {
      q: 'Как получить std::string из std::string_view v?',
      answers: ['std::string(v)', 'std::string s(v);', 'std::string s{v};', 'std::string{v}'],
      placeholder: 'Выражение',
      explain:
        'Преобразование в std::string — явное, потому что копирует символы. Обратное преобразование неявное и бесплатное.',
    },
  ],
  exercises: [
    {
      title: 'Расширение файла',
      difficulty: 'beginner',
      description: `
Для каждого имени файла из ввода напечатайте строку \`имя: расширение\`. Расширение — часть после **последней** точки. Если расширения нет, вместо него напечатайте \`нет\`. Расширения нет, если:

- в имени нет точки;
- единственная точка стоит в начале (\`.bashrc\` — скрытый файл без расширения);
- точка — последний символ имени.

Напишите функцию \`std::string_view extension(std::string_view name)\`, которая возвращает расширение или пустое представление.`,
      constraints: ['Имена без пробелов, до 100 символов; их не больше 20.'],
      hints: [
        "Последнюю точку находит rfind('.'). Если результат — npos, 0 или последний индекс, расширения нет.",
        'Расширение — name.substr(dot + 1): новое представление внутри того же имени, без копирования.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <string_view>

std::string_view extension(std::string_view name) {
    std::size_t dot = name.rfind('.');
    if (dot == std::string_view::npos || dot == 0 || dot + 1 == name.size()) {
        return {};
    }
    return name.substr(dot + 1);
}

int main() {
    std::string name;
    while (std::cin >> name) {
        std::string_view ext = extension(name);
        std::println("{}: {}", name, ext.empty() ? std::string_view("нет") : ext);
    }
    return 0;
}`,
      explanation: `
\`rfind\` ищет с конца, поэтому у \`archive.tar.gz\` расширением оказывается \`gz\`. Три особых случая — нет точки (\`npos\`), точка в начале (\`0\`) и точка в конце — проверяются одним условием до вызова \`substr\`.

Функция возвращает \`std::string_view\`, и это безопасно: результат указывает внутрь аргумента, а аргумент смотрит на строку \`name\` из \`main\`, которая жива всё время, пока результат используется. \`return {};\` создаёт пустое представление.`,
      examples: [
        {
          in: 'report.pdf\narchive.tar.gz\nREADME\n',
          out: 'report.pdf: pdf\narchive.tar.gz: gz\nREADME: нет\n',
        },
        { in: '.bashrc\n', out: '.bashrc: нет\n' },
      ],
      hidden: [
        { in: 'file.\n', name: 'Точка в конце' },
        { in: 'a.b\n', name: 'Короткое' },
        { in: 'photo.JPG\n', name: 'Заглавные' },
        { in: '...\n', name: 'Только точки' },
        { in: '.config.json\n', name: 'Скрытый с расширением' },
        { in: 'x\n', name: 'Один символ' },
        { in: 'my.file.name.txt\nmain.cpp\n', name: 'Несколько точек' },
        { in: '', name: 'Пустой ввод' },
      ],
    },
    {
      title: 'Поля через запятую',
      description: `
Каждая строка ввода — запись, поля которой разделены запятыми. Пробелы в начале и конце каждого поля не значимы. Для каждой строки напечатайте число полей, двоеточие и поля в квадратных скобках через пробел:

\`\`\`text
3: [Ада] [Лавлейс] [1815]
\`\`\`

Пустые поля (между соседними запятыми или в конце строки) сохраняются: \`[]\`. Пустая строка — одна запись из одного пустого поля.`,
      constraints: ['Строк не больше 20, каждая до 200 символов.'],
      hints: [
        "Читайте строки через std::getline. Разбивайте представление строки: find(','), substr(0, pos), remove_prefix(pos + 1) — пока find не вернёт npos.",
        'Обрезка пробелов: пока первый символ — пробел, remove_prefix(1); пока последний — remove_suffix(1). Не забудьте проверять empty().',
      ],
      solution: String.raw`
#include <format>
#include <iostream>
#include <print>
#include <string>
#include <string_view>
#include <vector>

std::string_view trim(std::string_view text) {
    while (!text.empty() && text.front() == ' ') {
        text.remove_prefix(1);
    }
    while (!text.empty() && text.back() == ' ') {
        text.remove_suffix(1);
    }
    return text;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::vector<std::string_view> fields;
        std::string_view rest = line;
        while (true) {
            std::size_t comma = rest.find(',');
            fields.push_back(trim(rest.substr(0, comma)));
            if (comma == std::string_view::npos) {
                break;
            }
            rest.remove_prefix(comma + 1);
        }
        std::string out = std::format("{}:", fields.size());
        for (std::string_view field : fields) {
            out += std::format(" [{}]", field);
        }
        std::println("{}", out);
    }
    return 0;
}`,
      explanation: `
Все поля — представления внутри \`line\`: ни разбиение, ни обрезка не копируют символы. Вектор \`fields\` создаётся заново для каждой строки и используется, пока \`line\` не изменилась, — представления не успевают «повиснуть».

Цикл разбиения завершается после поля, за которым запятой нет: \`substr(0, npos)\` берёт остаток целиком. Поэтому строка без запятых — одно поле, а запятая в конце даёт ещё одно пустое поле.`,
      examples: [
        { in: '  Ада , Лавлейс,1815 \n', out: '3: [Ада] [Лавлейс] [1815]\n' },
        { in: 'a,,b,\n\n', out: '4: [a] [] [b] []\n1: []\n' },
      ],
      hidden: [
        { in: 'один\n', name: 'Одно поле' },
        { in: ',\n', name: 'Только запятая' },
        { in: '   ,   ,   \n', name: 'Пробелы' },
        { in: 'x , y , z\n1,2\n', name: 'Две строки' },
        { in: 'Москва,  Санкт-Петербург ,Казань\n', name: 'Города' },
        { in: 'a b,c d\n', name: 'Пробел внутри поля' },
        { in: ',,,,\n', name: 'Пять пустых' },
        { in: 'id,name,score\n7,Ada,99\n', name: 'Таблица' },
      ],
    },
    {
      title: 'Найди ошибку: висячее представление',
      bug: true,
      description: `
Программа читает пары «имя фамилия» и для каждой печатает строку \`Фамилия, Имя (N байт)\`, где N — длина результата в байтах UTF-8:

\`\`\`text
Лавлейс, Ада (22 байт)
\`\`\`

Иногда она печатает мусор, а под AddressSanitizer аварийно завершается. Найдите и исправьте ошибку.`,
      constraints: ['Имена и фамилии — по одному слову до 30 символов; пар не больше 10.'],
      hints: [
        'Посмотрите, что возвращает full_name и на что указывает этот результат после выхода из функции.',
        'Функция создаёт новую строку result — значит, она должна отдать вызывающему коду владение строкой, то есть вернуть std::string. Переменная в main тоже должна быть std::string.',
      ],
      starter: FULL_NAME(false),
      solution: FULL_NAME(true),
      explanation: `
\`full_name\` собирает текст в локальной строке \`result\` и возвращает \`std::string_view\` на неё. При выходе из функции \`result\` уничтожается, память освобождается, и представление указывает в никуда. AddressSanitizer сообщает \`heap-use-after-free\`; без него программа может случайно напечатать правильный текст, а может — мусор. Clang предупреждает уже при компиляции, GCC 14 молчит.

Параметры \`first\` и \`last\` — представления, и это правильно: функция их только читает. А **созданный** текст нужно вернуть владельцем — \`std::string\`. Правило: \`string_view\` на вход — нормально, \`string_view\` на выход — только если он указывает внутрь входных данных.`,
      examples: [
        { in: 'Ада Лавлейс\n', out: 'Лавлейс, Ада (22 байт)\n' },
        { in: 'Alan Turing\n', out: 'Turing, Alan (12 байт)\n' },
      ],
      hidden: [
        'Грейс Хоппер\n',
        'Linus Torvalds\nKen Thompson\n',
        'Деннис Ритчи\n',
        'Бьёрн Страуструп\n',
        'Ada Lovelace\nAlan Turing\nGrace Hopper\n',
        'Эдсгер Дейкстра\n',
        'Margaret Hamilton\n',
        'Дональд Кнут\nНиклаус Вирт\n',
      ],
    },
    {
      title: 'Сумма чисел из строки',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — слова, разделённые одним или несколькими пробелами. Для каждой строки найдите сумму слов, которые целиком являются целыми числами типа \`int\`, и число остальных слов («ошибок»). Напечатайте:

\`\`\`text
сумма 30, ошибок 2
\`\`\`

Число — это необязательный минус и цифры; \`+5\`, \`12a\`, \`-\`, \`3.5\` — ошибки. Число, которое не помещается в \`int\`, — тоже ошибка. Пустая строка даёт \`сумма 0, ошибок 0\`.`,
      constraints: ['Строк не больше 20, каждая до 300 символов.'],
      hints: [
        "Разбейте строку на слова: пропускайте пробелы, затем находите конец слова через find(' '). Пустые слова не считаются.",
        'std::from_chars(word.data(), word.data() + word.size(), value): слово — число, только если ошибки нет (std::errc{}) и прочитаны все символы (end == word.data() + word.size()). Сумму копите в long long.',
      ],
      solution: String.raw`
#include <charconv>
#include <iostream>
#include <print>
#include <string>
#include <string_view>

bool parse_int(std::string_view word, int &value) {
    auto [end, error] = std::from_chars(word.data(), word.data() + word.size(), value);
    return error == std::errc{} && end == word.data() + word.size();
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::string_view rest = line;
        long long sum = 0;
        int errors = 0;
        while (true) {
            std::size_t start = rest.find_first_not_of(' ');
            if (start == std::string_view::npos) {
                break;
            }
            rest.remove_prefix(start);
            std::size_t stop = rest.find(' ');
            std::string_view word = rest.substr(0, stop);
            int value = 0;
            if (parse_int(word, value)) {
                sum += value;
            } else {
                errors++;
            }
            if (stop == std::string_view::npos) {
                break;
            }
            rest.remove_prefix(stop);
        }
        std::println("сумма {}, ошибок {}", sum, errors);
    }
    return 0;
}`,
      explanation: `
Строка разбирается двумя поисками: \`find_first_not_of(' ')\` пропускает пробелы до начала слова, \`find(' ')\` находит его конец. Каждое слово — представление внутри строки, без копий.

Проверка числа опирается на два результата \`from_chars\`: код ошибки говорит, удалось ли прочитать число и поместилось ли оно в \`int\`, а указатель \`end\` — прочитано ли слово **целиком**. Без второй проверки \`12a\` считалось бы числом 12. Сумма хранится в \`long long\`: двадцать чисел около двух миллиардов не помещаются в \`int\`.`,
      examples: [
        { in: '10 abc 20 12a\n', out: 'сумма 30, ошибок 2\n' },
        { in: '\n   -5   5  \n', out: 'сумма 0, ошибок 0\nсумма 0, ошибок 0\n' },
      ],
      hidden: [
        { in: '+5 -\n', name: 'Знаки без чисел' },
        { in: '2147483647 2147483647\n', name: 'Максимум int' },
        { in: '2147483648 -2147483648\n', name: 'За границей' },
        { in: '3.5 007 -0\n', name: 'Дробное и нули' },
        { in: 'один два три\n', name: 'Только слова' },
        { in: '1 2 3 4 5 6 7 8 9 10\n', name: 'Десять чисел' },
        { in: '  42  \n--1 1-\n', name: 'Две строки' },
        { in: '99999999999999999999 1\n', name: 'Очень длинное' },
      ],
    },
  ],
};
