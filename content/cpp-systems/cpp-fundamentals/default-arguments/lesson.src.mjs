const BAR = (fixed) => String.raw`
#include <iostream>
#include <sstream>
#include <string>

std::string progress_bar(int percent, int width = 20);

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        int percent, width;
        if (!(in >> percent)) {
            continue;
        }
        std::cout << (in >> width ? progress_bar(percent, width) : progress_bar(percent)) << '\n';
    }
    return 0;
}

std::string progress_bar(int percent, int width${fixed ? '' : ' = 20'}) {
    int filled = percent * width / 100;
    return "[" + std::string(static_cast<std::size_t>(filled), '#') +
           std::string(static_cast<std::size_t>(width - filled), '.') + "] " + std::to_string(percent) + "%";
}`;

export default {
  id: 'cpp20-default-arguments',
  title: 'Аргументы по умолчанию',
  description:
    'Значения параметров по умолчанию и подстановка в месте вызова; правила: справа налево и только в объявлении; значения по умолчанию или перегрузка; функция join с разделителем; почему логические параметры по умолчанию делают вызовы непонятными.',
  moduleId: 'cpp-fundamentals',
  order: 13,
  difficulty: 'beginner',
  estimatedMinutes: 35,
  prerequisites: ['cpp20-overload'],
  objectives: [
    'Задавать параметрам значения по умолчанию',
    'Соблюдать правила: справа налево и только в объявлении',
    'Выбирать между значениями по умолчанию и перегрузкой',
    'Проектировать понятные вызовы функций',
  ],
  tags: ['C++', 'Функции', 'Аргументы по умолчанию'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int volume(int a, int b = 2, int c = 3) {
    return a * b * c;
}

int main() {
    std::cout << volume(1) << ' ' << volume(1, 5) << ' ' << volume(1, 5, 7) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['6 15 35'],
      placeholder: 'Вывод программы',
      explain: 'Недостающие аргументы берутся из значений по умолчанию: 1·2·3, 1·5·3, 1·5·7.',
    },
    {
      q: 'Какое объявление корректно?',
      options: [
        'void f(int a, int b = 0, int c = 0);',
        'void f(int a = 0, int b, int c);',
        'void f(int a = 0, int b, int c = 0);',
        'void f(int a, int b = 0, int c);',
      ],
      correct: 0,
      explain:
        'Если у параметра есть значение по умолчанию, оно должно быть и у всех параметров правее.',
    },
    {
      q: 'Где указывают значение по умолчанию, если функция объявлена в заголовке, а определена в .cpp-файле?',
      options: [
        'Только в объявлении в заголовке',
        'Только в определении',
        'И там, и там',
        'В месте вызова',
      ],
      correct: 0,
      explain:
        'Значение подставляется при компиляции вызова, поэтому его должны видеть все вызывающие — через заголовок. Повторение в определении — ошибка.',
    },
    {
      q: "Можно ли вызвать функцию void line(char symbol = '-', int length = 10), указав только length?",
      options: [
        'Нет: аргументы опускаются только с конца',
        'Да: line(, 5)',
        'Да: line(length = 5)',
        'Да: line(5) — компилятор поймёт по типу',
      ],
      correct: 0,
      explain:
        'В C++ нет именованных аргументов. line(5) скомпилируется, но 5 станет значением symbol — символом с кодом 5.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

std::string wrap(const std::string &s, const std::string &left = "[", const std::string &right = "]") {
    return left + s + right;
}

int main() {
    std::cout << wrap("a") << wrap("b", "<", ">") << wrap("c", "(") << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['[a]<b>(c]'],
      placeholder: 'Вывод программы',
      explain: 'В третьем вызове указан только left, а right остаётся по умолчанию — «]».',
    },
    {
      q: 'Когда значение по умолчанию лучше перегрузки?',
      options: [
        'Когда логика функции одна, а меняется только значение параметра',
        'Когда для разных типов нужна разная логика',
        'Когда нужно различать функции по возвращаемому типу',
        'Всегда',
      ],
      correct: 0,
      explain:
        'Значения по умолчанию — короткая запись одинаковых перегрузок. Разная логика — повод для перегрузки.',
    },
    {
      q: 'Почему вызов save("a.txt", true, false) — плохой стиль?',
      options: [
        'По вызову не понять, что означают true и false — нужно смотреть объявление',
        'Логические параметры запрещены',
        'Значения по умолчанию нельзя задавать для bool',
        'Это не плохой стиль',
      ],
      correct: 0,
      explain: 'Понятнее перечисление с говорящими именами или отдельные функции.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int counter = 0;

int next_id() {
    return ++counter;
}

void show(int id = next_id()) {
    std::cout << id << ' ';
}

int main() {
    show();
    show(10);
    show();
    std::cout << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 10 2'],
      placeholder: 'Вывод программы',
      explain:
        'Значение по умолчанию вычисляется в момент каждого вызова без аргумента. Во втором вызове аргумент указан, и next_id не вызывается.',
    },
  ],
  exercises: [
    {
      title: 'Склеивание',
      difficulty: 'beginner',
      description: `
Каждая строка ввода начинается с разделителя, затем идут слова. Если разделитель — \`-\`, используйте разделитель по умолчанию \`", "\` (запятая и пробел). Напечатайте слова, соединённые разделителем.

Напишите функцию \`std::string join(const std::vector<std::string> &words, const std::string &sep = ", ")\` и вызывайте её с одним аргументом, когда нужен разделитель по умолчанию.`,
      constraints: [
        'Строк не больше 30; в строке от 0 до 50 слов; разделитель и слова — без пробелов.',
      ],
      hints: [
        'Разберите строку std::istringstream: первым прочитайте разделитель, затем слова в std::vector<std::string>.',
        'Если разделитель "-", вызовите join(words), иначе join(words, sep). Если слов нет, печатается пустая строка.',
      ],
      solution: String.raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

std::string join(const std::vector<std::string> &words, const std::string &sep = ", ") {
    std::string result;
    for (std::size_t i = 0; i < words.size(); i++) {
        if (i > 0) {
            result += sep;
        }
        result += words[i];
    }
    return result;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::string sep, word;
        if (!(in >> sep)) {
            continue;
        }
        std::vector<std::string> words;
        while (in >> word) {
            words.push_back(word);
        }
        std::cout << (sep == "-" ? join(words) : join(words, sep)) << '\n';
    }
    return 0;
}`,
      explanation: `
Вызов \`join(words)\` без второго аргумента компилятор превращает в \`join(words, ", ")\`. Сама функция не знает, передан ли разделитель явно, — она всегда получает два параметра.

Разделитель вставляется **между** элементами: перед каждым, кроме первого. Так пустой вектор даёт пустую строку, а вектор из одного слова — само слово, без лишних разделителей.`,
      examples: [
        { in: '- C C++ Rust\n', out: 'C, C++, Rust\n' },
        { in: '/ usr local bin\n+ one\n', out: 'usr/local/bin\none\n' },
      ],
      hidden: [
        '-\n',
        '- solo\n',
        '| a b c d\n',
        '-- x y\n',
        '; alpha beta\n- p q r s t\n',
        '* 1 2 3\n',
        '- a\n- a b\n',
        '::: left right\n',
      ],
    },
    {
      title: 'Округление',
      description: `
Каждая строка ввода — дробное число и, возможно, число знаков после точки \`d\`. Напечатайте число, округлённое до \`d\` знаков (по умолчанию — 0), ровно с \`d\` знаками после точки.

Напишите функцию \`std::string format_number(double x, int digits = 0)\` и вызывайте её с одним аргументом, когда \`d\` не указано.`,
      constraints: [
        '|x| ≤ 10⁶; 0 ≤ d ≤ 6; строк не больше 30; во входе нет чисел, лежащих ровно посередине между вариантами округления.',
      ],
      hints: [
        'Внутри функции соберите строку строковым потоком вывода: std::ostringstream out; out << std::fixed << std::setprecision(digits) << x; return out.str();.',
        'Строку ввода разберите std::istringstream: прочитайте x, затем попробуйте прочитать d — если удалось, вызовите format_number(x, d), иначе format_number(x).',
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

std::string format_number(double x, int digits = 0) {
    std::ostringstream out;
    out << std::fixed << std::setprecision(digits) << x;
    return out.str();
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        double x;
        int d;
        if (!(in >> x)) {
            continue;
        }
        std::cout << (in >> d ? format_number(x, d) : format_number(x)) << '\n';
    }
    return 0;
}`,
      explanation: `
\`std::ostringstream\` — поток, который пишет не на экран, а в строку: все манипуляторы \`<iomanip>\` работают с ним так же, как с \`std::cout\`. Функция возвращает готовый текст, и форматирование не «залипает» в \`std::cout\` для следующих чисел.

Точность по умолчанию — 0: число округляется до целого и печатается без точки. Половинные случаи вроде 2.5 условие исключает: \`printf\` и потоки округляют двоичное представление числа, и для точных половин glibc выбирает чётную цифру — 2.5 превращается в 2.`,
      examples: [
        { in: '3.14159 2\n2.71828\n', out: '3.14\n3\n' },
        { in: '-1.26 1\n1000000\n', out: '-1.3\n1000000\n' },
      ],
      hidden: [
        { in: '0.4\n', name: 'Меньше половины' },
        { in: '0.6\n', name: 'Больше половины' },
        { in: '-7.7\n', name: 'Отрицательное' },
        { in: '1.23456789 6\n', name: 'Шесть знаков' },
        { in: '42 3\n', name: 'Целое с дробной частью' },
        { in: '999999.99 1\n', name: 'Перенос разряда' },
        { in: '0.001 2\n0.009 2\n', name: 'Маленькие' },
        { in: '123.456 0\n123.456\n', name: 'Явный ноль и по умолчанию' },
      ],
    },
    {
      title: 'Найди ошибку: полоса загрузки',
      bug: true,
      description: `
Каждая строка ввода — процент выполнения и, возможно, ширина полосы. Программа печатает полосу загрузки вида \`[#####...............] 25%\`; ширина по умолчанию — 20.

Программа не компилируется. Исправьте её.`,
      constraints: ['0 ≤ процент ≤ 100; 1 ≤ ширина ≤ 100; строк не больше 30.'],
      hints: [
        'Прочитайте сообщение компилятора: default argument given for parameter 2. Где ещё указано значение 20?',
        'Значение по умолчанию пишут один раз — в объявлении функции, которое видят вызовы. Уберите = 20 из определения.',
      ],
      starter: BAR(false),
      solution: BAR(true),
      explanation: `
Функция объявлена в начале файла, чтобы \`main\` могла её вызвать, а определена после \`main\`. Значение по умолчанию указано в обоих местах — и это ошибка компиляции, даже если значения совпадают: \`default argument given for parameter 2 of ...\`.

Значение должно быть в **объявлении**: компилятор подставляет его при компиляции вызова, а вызов видит только объявление. В настоящем проекте объявление лежит в заголовке, определение — в \`.cpp\`-файле, и значение по умолчанию живёт в заголовке.`,
      examples: [
        { in: '25\n', out: '[#####...............] 25%\n' },
        { in: '50 10\n', out: '[#####.....] 50%\n' },
      ],
      hidden: ['0\n', '100\n', '100 5\n', '1 100\n', '33 3\n', '99\n', '10 1\n', '75 8\n'],
    },
    {
      title: 'Рамка',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — до трёх полей через \`|\`: текст, отступ и символ рамки, например \`Hello|2|#\`. Отсутствующие поля берутся по умолчанию: отступ 1, символ \`*\`. Нарисуйте рамку из трёх строк:

\`\`\`text
###########
#  Hello  #
###########
\`\`\`

Напишите функцию \`void draw_box(const std::string &text, int padding = 1, char border = '*')\`. Верхняя и нижняя строки — символ рамки длиной \`длина текста + 2 · отступ + 2\`; средняя — символ рамки, отступ из пробелов, текст, отступ, символ рамки.`,
      constraints: [
        'Текст — ASCII до 60 символов, может содержать пробелы, не содержит |; 0 ≤ отступ ≤ 10; строк не больше 20.',
      ],
      hints: [
        "Разбейте строку по |: std::getline(in, part, '|') читает до разделителя. Сохраните части в вектор.",
        'Вызов зависит от числа частей: draw_box(t), draw_box(t, std::stoi(p)) или draw_box(t, std::stoi(p), b[0]).',
        'Строку из повторяющихся символов создаёт конструктор std::string(n, c).',
      ],
      solution: String.raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

void draw_box(const std::string &text, int padding = 1, char border = '*') {
    std::string edge(text.size() + 2 * static_cast<std::size_t>(padding) + 2, border);
    std::string space(static_cast<std::size_t>(padding), ' ');
    std::cout << edge << '\n' << border << space << text << space << border << '\n' << edge << '\n';
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::vector<std::string> parts;
        std::string part;
        while (std::getline(in, part, '|')) {
            parts.push_back(part);
        }
        if (parts.size() == 1) {
            draw_box(parts[0]);
        } else if (parts.size() == 2) {
            draw_box(parts[0], std::stoi(parts[1]));
        } else if (parts.size() >= 3) {
            draw_box(parts[0], std::stoi(parts[1]), parts[2][0]);
        }
    }
    return 0;
}`,
      explanation: `
Три вызова \`draw_box\` с одним, двумя и тремя аргументами обслуживает одна функция: недостающие аргументы подставляет компилятор. Порядок параметров выбран по частоте изменения: текст нужен всегда, отступ меняют чаще, чем символ, — поэтому символ последний. Если бы часто меняли только символ, пришлось бы каждый раз указывать и отступ.

\`std::getline(in, part, '|')\` — та же функция, что читает строки, но с другим разделителем: так строку удобно разрезать по любому символу. \`std::string(n, c)\` строит строку из \`n\` одинаковых символов — это и края рамки, и отступы.`,
      examples: [
        { in: 'Hello|2|#\n', out: '###########\n#  Hello  #\n###########\n' },
        { in: 'C++\n', out: '*******\n* C++ *\n*******\n' },
      ],
      hidden: [
        { in: 'x|0\n', name: 'Без отступа' },
        { in: 'hello world|3\n', name: 'Пробел в тексте' },
        { in: 'abc|1|=\n', name: 'Свой символ' },
        { in: 'A|10|+\n', name: 'Большой отступ' },
        { in: 'one\ntwo|0|-\n', name: 'Две рамки' },
        { in: 'Box\n', name: 'По умолчанию' },
        { in: 'long text with several words|2|@\n', name: 'Длинный текст' },
        { in: 'z|5\n', name: 'Только отступ' },
      ],
    },
  ],
};
