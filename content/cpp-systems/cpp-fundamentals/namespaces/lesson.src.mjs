const COUNT = (fixed) =>
  fixed
    ? String.raw`
#include <algorithm>
#include <iostream>

int positives = 0;

int main() {
    int x;
    while (std::cin >> x) {
        if (x > 0) {
            positives++;
        }
    }
    std::cout << positives << '\n';
    return 0;
}`
    : String.raw`
#include <algorithm>
#include <iostream>
using namespace std;

int count = 0;

int main() {
    int x;
    while (cin >> x) {
        if (x > 0) {
            count++;
        }
    }
    cout << count << '\n';
    return 0;
}`;

export default {
  id: 'cpp20-namespaces',
  title: 'Пространства имён',
  description:
    'Столкновения имён и префиксы в C; объявление пространства имён и полные имена с ::; пространство std; using-объявление и using-директива и почему using namespace std опасен; вложенные пространства и псевдонимы; безымянное пространство вместо static.',
  moduleId: 'cpp-fundamentals',
  order: 2,
  difficulty: 'beginner',
  estimatedMinutes: 35,
  prerequisites: ['cpp20-difference'],
  objectives: [
    'Объявлять пространства имён и обращаться к именам через ::',
    'Выбирать между полными именами, using-объявлением и using-директивой',
    'Объяснять, чем опасен using namespace std',
    'Скрывать внутренние функции файла безымянным пространством',
  ],
  tags: ['C++', 'namespace', 'std', 'using'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

namespace a {
int value() { return 1; }
}
namespace b {
int value() { return 2; }
}

int main() {
    std::cout << a::value() * 10 + b::value() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['12'],
      placeholder: 'Вывод программы',
      explain: 'a::value() и b::value() — разные функции: 1 · 10 + 2 = 12.',
    },
    {
      q: 'В каком пространстве имён лежат std::string, std::vector и std::sort?',
      answers: ['std'],
      placeholder: 'Имя',
      explain: 'Вся стандартная библиотека C++ объявлена в пространстве имён std.',
    },
    {
      q: 'Почему using namespace std; нельзя писать в заголовочном файле?',
      options: [
        'Директива попадёт во все файлы, подключающие заголовок, и их имена начнут конфликтовать с именами из std',
        'Заголовки не могут содержать using',
        'Это замедлит компиляцию в сотни раз',
        'Можно, это обычная практика',
      ],
      correct: 0,
      explain:
        'Подключение заголовка — это текстовая вставка. Автор другого файла получит все имена std, даже не подозревая об этом.',
    },
    {
      q: 'Чем using std::cout; отличается от using namespace std;?',
      options: [
        'Первое вводит одно имя cout, второе — все имена пространства std',
        'Ничем',
        'Первое работает только в C',
        'Второе вводит только cout, cin и endl',
      ],
      correct: 0,
      explain:
        'using-объявление точечное и безопаснее: столкнуться может только одно, явно выбранное имя.',
    },
    {
      q: 'Что заменяет в C++ ключевое слово static у функции, видимой только в своём файле?',
      options: [
        'Безымянное пространство имён',
        'namespace std',
        'using namespace',
        'Ключевое слово private',
      ],
      correct: 0,
      explain:
        'Имена в namespace { … } имеют внутреннее связывание, как static в C. static для функций тоже работает, но безымянное пространство принято в C++ и вмещает сразу и функции, и типы.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int x = 1;

namespace inner {
int x = 2;
int sum() { return x + ::x; }
}

int main() {
    std::cout << inner::sum() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3'],
      placeholder: 'Вывод программы',
      explain:
        'Внутри inner имя x означает inner::x = 2, а ::x — глобальную переменную, 1. Сумма 3.',
    },
    {
      q: 'Какие записи корректны в C++17 и новее?',
      options: [
        'namespace app::net { int port = 80; }',
        'namespace fs = std::filesystem;',
        'namespace { int helper = 0; }',
        'namespace 2d { int x; }',
      ],
      correct: [0, 1, 2],
      explain:
        'Вложенное объявление через ::, псевдоним пространства и безымянное пространство корректны. Имя пространства подчиняется правилам идентификаторов и не может начинаться с цифры.',
    },
    {
      q: 'Программа с using namespace std; объявляет глобальную переменную distance и подключает <iterator>. Что произойдёт при обращении distance++?',
      options: [
        'Ошибка компиляции: имя неоднозначно — переменная или функция std::distance',
        'Увеличится переменная',
        'Вызовется std::distance',
        'Ошибка при запуске программы',
      ],
      correct: 0,
      explain: 'Директива сделала видимыми оба имени, и компилятор не может выбрать.',
    },
  ],
  exercises: [
    {
      title: 'Единицы длины',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — целое число и единица длины: \`mm\`, \`cm\`, \`m\`, \`in\` или \`ft\`. Переведите длину в микрометры и напечатайте целое число.

Множители: 1 mm = 1000 мкм, 1 cm = 10 000 мкм, 1 m = 1 000 000 мкм, 1 in = 25 400 мкм, 1 ft = 304 800 мкм.

Разложите перевод по пространствам имён: метрические единицы — в \`metric\`, британские — в \`imperial\`, в каждом — функция \`to_micrometers\`.`,
      constraints: ['|число| ≤ 10⁶; строк не больше 30; единица всегда одна из пяти.'],
      hints: [
        'Объявите namespace metric { long long to_micrometers(long long value, const std::string &unit) { … } } и такое же imperial.',
        'Единицу читайте в std::string: std::cin >> value >> unit. Сравнение строк — обычный ==: unit == "cm". Результат до 3·10¹¹ — long long.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

namespace metric {
long long to_micrometers(long long value, const std::string &unit) {
    if (unit == "mm") {
        return value * 1000;
    }
    if (unit == "cm") {
        return value * 10000;
    }
    return value * 1000000;
}
}

namespace imperial {
long long to_micrometers(long long value, const std::string &unit) {
    return unit == "in" ? value * 25400 : value * 304800;
}
}

int main() {
    long long value;
    std::string unit;
    while (std::cin >> value >> unit) {
        bool british = unit == "in" || unit == "ft";
        std::cout << (british ? imperial::to_micrometers(value, unit)
                              : metric::to_micrometers(value, unit))
                  << '\n';
    }
    return 0;
}`,
      explanation: `
Две функции называются одинаково — \`to_micrometers\`, — но живут в разных пространствах имён, поэтому не конфликтуют. Вызывающий код выбирает нужную полным именем: \`imperial::to_micrometers\`. В C пришлось бы назвать их \`metric_to_micrometers\` и \`imperial_to_micrometers\` и следить за этим соглашением вручную.

Сравнение \`unit == "cm"\` работает потому, что \`unit\` — \`std::string\`: оператор \`==\` сравнивает символы, а не адреса, как было бы с \`char *\`. Параметр \`const std::string &\` — константная ссылка, о ней будет отдельный урок.`,
      examples: [
        { in: '5 cm\n', out: '50000\n' },
        { in: '1 in\n2 ft\n', out: '25400\n609600\n' },
      ],
      hidden: [
        '1 mm\n',
        '1 m\n',
        '0 ft\n',
        '-3 cm\n',
        '1000000 ft\n',
        '-1000000 m\n',
        '12 in\n1 ft\n',
        '7 mm\n7 cm\n7 m\n7 in\n7 ft\n',
      ],
    },
    {
      title: 'Статистика',
      description: `
До конца ввода идут целые числа. Напечатайте строку \`сумма S, минимум A, максимум B\` или \`пусто\`, если чисел нет.

Положите функции в пространство имён \`stats\`: \`stats::sum\`, \`stats::min\`, \`stats::max\` принимают \`const std::vector<long long> &\`. Общую проверку пустоты вынесите в безымянное пространство имён.`,
      constraints: ['Чисел не больше 1000; |числа| ≤ 10⁹.'],
      hints: [
        'Прочитайте числа в std::vector<long long> values; — values.push_back(x) добавляет число в конец, values.size() — количество.',
        'Внутри stats обращайтесь к своим функциям без префикса. Безымянное пространство: namespace { bool is_empty(const std::vector<long long> &v) { return v.size() == 0; } }.',
      ],
      solution: String.raw`
#include <iostream>
#include <vector>

namespace {
bool is_empty(const std::vector<long long> &values) {
    return values.size() == 0;
}
}

namespace stats {
long long sum(const std::vector<long long> &values) {
    long long total = 0;
    for (std::size_t i = 0; i < values.size(); i++) {
        total += values[i];
    }
    return total;
}

long long min(const std::vector<long long> &values) {
    long long best = values[0];
    for (std::size_t i = 1; i < values.size(); i++) {
        if (values[i] < best) {
            best = values[i];
        }
    }
    return best;
}

long long max(const std::vector<long long> &values) {
    long long best = values[0];
    for (std::size_t i = 1; i < values.size(); i++) {
        if (values[i] > best) {
            best = values[i];
        }
    }
    return best;
}
}

int main() {
    std::vector<long long> values;
    long long x;
    while (std::cin >> x) {
        values.push_back(x);
    }
    if (is_empty(values)) {
        std::cout << "пусто\n";
        return 0;
    }
    std::cout << "сумма " << stats::sum(values) << ", минимум " << stats::min(values)
              << ", максимум " << stats::max(values) << '\n';
    return 0;
}`,
      explanation: `
Функции \`min\` и \`max\` есть и в стандартной библиотеке — \`std::min\` и \`std::max\`. Благодаря пространству имён \`stats\` наши функции с ними не конфликтуют: \`stats::max\` и \`std::max\` — разные имена. С \`using namespace std;\` такой гарантии уже не было бы.

\`is_empty\` — служебная функция этого файла, поэтому она лежит в безымянном пространстве: её не видно из других файлов, как если бы она была объявлена \`static\`. \`std::vector\` — массив, который растёт сам; подробно о нём — в отдельном уроке.`,
      examples: [
        { in: '3 1 4 1 5\n', out: 'сумма 14, минимум 1, максимум 5\n' },
        { in: '', out: 'пусто\n' },
      ],
      hidden: [
        '7\n',
        '-5 -3 -9\n',
        '1000000000 1000000000 1000000000\n',
        '-1000000000 1000000000\n',
        '0 0 0\n',
        '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
        '5 -5 5 -5\n',
        '42 -42\n',
      ],
    },
    {
      title: 'Найди ошибку: count',
      bug: true,
      description: `
Программа читает целые числа до конца ввода и печатает, сколько из них положительных. Она не компилируется. Найдите причину и исправьте программу.`,
      constraints: ['Чисел не больше 1000; числа int.'],
      hints: [
        'Прочитайте сообщение компилятора: reference to count is ambiguous. Какие ещё сущности с именем count видны в этой точке?',
        'using namespace std; сделал видимой функцию std::count из <algorithm>. Уберите директиву и пишите std:: явно — или переименуйте переменную.',
      ],
      starter: COUNT(false),
      solution: COUNT(true),
      explanation: `
\`using namespace std;\` вносит в глобальную область все имена из \`std\`, объявленные в подключённых заголовках, — в том числе функцию \`std::count\` из \`<algorithm>\`. Глобальная переменная \`count\` с ней сталкивается: в выражении \`count++\` компилятор не может решить, о чём речь, и сообщает \`reference to 'count' is ambiguous\`.

Лучшее исправление — убрать директиву и писать \`std::cin\`, \`std::cout\` явно: тогда имена стандартной библиотеки и ваши никогда не пересекутся. Переименование переменной тоже помогает, но не защищает от следующего столкновения: в \`std\` сотни коротких имён.`,
      examples: [
        { in: '3 -1 4 0 5\n', out: '3\n' },
        { in: '', out: '0\n' },
      ],
      hidden: [
        '-1 -2 -3\n',
        '1\n',
        '0\n',
        '2147483647 -2147483648\n',
        '1 1 1 1 1\n',
        '5 -5 5 -5 5\n',
        '100\n-100\n100\n',
        '0 0 1\n',
      ],
    },
    {
      title: 'Текстовые команды',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — команда и слово из латинских букв:

- \`upper слово\` — напечатать слово заглавными буквами;
- \`reverse слово\` — напечатать слово задом наперёд;
- \`palindrome слово\` — напечатать \`да\`, если слово читается одинаково в обе стороны без учёта регистра, иначе \`нет\`.

Разместите функции в пространстве имён \`text\`, а вспомогательные (перевод символа в верхний регистр) — во вложенном \`text::detail\`.`,
      constraints: ['Слова длиной от 1 до 100; строк не больше 30.'],
      hints: [
        'Вложенное пространство: namespace text::detail { char to_upper(char c) { … } }. Изнутри text к нему можно обращаться как detail::to_upper.',
        "Символ строки — s[i], длина — s.size(). Новую строку можно собрать: std::string result; result += символ;. Перевод в верхний регистр для латиницы — c - 'a' + 'A' при c от 'a' до 'z'.",
      ],
      solution: String.raw`
#include <iostream>
#include <string>

namespace text::detail {
char to_upper(char c) {
    return c >= 'a' && c <= 'z' ? static_cast<char>(c - 'a' + 'A') : c;
}
}

namespace text {
std::string upper(const std::string &word) {
    std::string result;
    for (std::size_t i = 0; i < word.size(); i++) {
        result += detail::to_upper(word[i]);
    }
    return result;
}

std::string reverse(const std::string &word) {
    std::string result;
    for (std::size_t i = word.size(); i > 0; i--) {
        result += word[i - 1];
    }
    return result;
}

bool palindrome(const std::string &word) {
    std::string u = upper(word);
    return u == reverse(u);
}
}

int main() {
    std::string command, word;
    while (std::cin >> command >> word) {
        if (command == "upper") {
            std::cout << text::upper(word) << '\n';
        } else if (command == "reverse") {
            std::cout << text::reverse(word) << '\n';
        } else if (command == "palindrome") {
            std::cout << (text::palindrome(word) ? "да" : "нет") << '\n';
        }
    }
    return 0;
}`,
      explanation: `
Пространство \`text\` объединяет публичные функции, а \`text::detail\` — подробности реализации. Имя \`detail\` — распространённое соглашение: «это внутреннее, не вызывайте снаружи». Изнутри \`text\` вложенное пространство доступно по короткому имени \`detail::to_upper\`, снаружи — по полному \`text::detail::to_upper\`.

Функции принимают \`const std::string &\` — строку без копирования — и возвращают новую строку по значению: в C++ так можно, \`std::string\` сам управляет памятью результата. Обратный цикл идёт по беззнаковому \`i\` с условием \`i > 0\` и обращением \`word[i - 1]\` — так не возникает «бесконечного» \`size_t\` при уменьшении нуля.`,
      examples: [
        { in: 'upper hello\nreverse hello\n', out: 'HELLO\nolleh\n' },
        { in: 'palindrome Level\npalindrome cpp\n', out: 'да\nнет\n' },
      ],
      hidden: [
        { in: 'upper a\n', name: 'Одна буква' },
        { in: 'reverse a\n', name: 'Разворот одной буквы' },
        { in: 'upper MixedCase\n', name: 'Смешанный регистр' },
        { in: 'palindrome A\npalindrome ab\n', name: 'Короткие палиндромы' },
        { in: 'palindrome RaceCar\n', name: 'Регистр в палиндроме' },
        { in: 'reverse abcdefghijklmnopqrstuvwxyz\n', name: 'Алфавит' },
        {
          in: 'palindrome abba\npalindrome abcba\npalindrome abca\n',
          name: 'Чётная и нечётная длина',
        },
        { in: 'upper zz\nreverse Zy\npalindrome Zz\n', name: 'Все команды' },
      ],
    },
  ],
};
