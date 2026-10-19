const TOTAL = (fixed) => String.raw`
#include <charconv>
#include <expected>
#include <iostream>
#include <print>
#include <string>
#include <string_view>
#include <vector>

std::expected<int, std::string> parse_int(std::string_view text) {
    int value = 0;
    auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), value);
    if (error != std::errc{} || end != text.data() + text.size()) {
        return std::unexpected("'" + std::string(text) + "' — не число");
    }
    return value;
}

std::expected<long long, std::string> total(const std::vector<std::string> &words) {
    long long sum = 0;
    for (const std::string &word : words) {
${
  fixed
    ? `        auto value = parse_int(word);
        if (!value) {
            return std::unexpected(value.error());
        }
        sum += *value;`
    : `        sum += parse_int(word).value_or(0);`
}
    }
    return sum;
}

int main() {
    std::vector<std::string> words;
    std::string word;
    while (std::cin >> word) {
        words.push_back(word);
    }
    auto result = total(words);
    if (result) {
        std::println("сумма {}", *result);
    } else {
        std::println("ошибка: {}", result.error());
    }
    return 0;
}`;

export default {
  id: 'cpp23-expected',
  title: 'Результат или ошибка: std::expected',
  description:
    'Чего не хватает optional и исключениям; std::expected<T, E> из C++23 — значение или ошибка с причиной; std::unexpected; has_value, value, error, value_or; ошибки-перечисления; передача ошибки наверх с контекстом; цепочки and_then, transform, or_else, transform_error; expected<void, E>; выбор между expected, optional, исключениями и assert.',
  moduleId: 'cpp-fundamentals',
  order: 27,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['cpp20-exceptions'],
  objectives: [
    'Возвращать из функций std::expected с причиной ошибки',
    'Описывать ошибки перечислением и передавать их наверх с контекстом',
    'Строить цепочки шагов через and_then и transform',
    'Выбирать между expected, optional, исключениями и assert',
  ],
  tags: ['C++23', 'expected', 'Обработка ошибок'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <expected>
#include <print>
#include <string>

std::expected<int, std::string> root(int x) {
    if (x < 0) {
        return std::unexpected("отрицательное");
    }
    int r = 0;
    while ((r + 1) * (r + 1) <= x) {
        r++;
    }
    return r;
}

int main() {
    auto a = root(17), b = root(-4);
    std::println("{} {} {}", *a, b.has_value(), b.error());
    return 0;
}`,
      lang: 'cpp',
      answers: ['4 false отрицательное'],
      placeholder: 'Вывод программы',
      explain: 'Целая часть корня из 17 — 4. Для -4 функция вернула ошибку с текстом.',
    },
    {
      q: 'Чем std::expected<int, E> отличается от std::optional<int>?',
      options: [
        'Вместо пустоты он хранит ошибку типа E — причину неудачи',
        'expected всегда выделяет память в куче',
        'expected нельзя проверить в if',
        'Ничем, это синонимы',
      ],
      correct: 0,
      explain: 'optional сообщает только «нет значения», expected — ещё и почему.',
    },
    {
      q: 'Зачем ошибку оборачивают в std::unexpected(…)?',
      options: [
        'Чтобы отличить ошибку от значения — например, когда T и E одного типа',
        'Чтобы выбросить исключение',
        'Чтобы ошибка напечаталась в stderr',
        'Это необязательно, просто стиль',
      ],
      correct: 0,
      explain:
        'Без обёртки return "текст" в expected<std::string, std::string> создал бы значение.',
    },
    {
      q: 'Что произойдёт при вызове value() у std::expected, который хранит ошибку?',
      options: [
        'Будет выброшено исключение std::bad_expected_access<E>, которое содержит ошибку',
        'Вернётся значение по умолчанию',
        'Неопределённое поведение',
        'Ошибка компиляции',
      ],
      correct: 0,
      explain:
        'value() проверяет состояние; неопределённое поведение — у *r и r.error() без проверки.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <expected>
#include <print>
#include <string>

std::expected<int, std::string> step(int x) {
    if (x > 100) {
        return std::unexpected("больше 100");
    }
    return x * 3;
}

int main() {
    auto a = step(5).and_then(step).and_then(step);
    auto b = step(20).and_then(step).and_then(step);
    std::println("{} {}", a.value_or(-1), b ? "успех" : b.error());
    return 0;
}`,
      lang: 'cpp',
      answers: ['135 больше 100'],
      placeholder: 'Вывод программы',
      explain: '5 → 15 → 45 → 135. 20 → 60 → 180, а step(180) возвращает ошибку.',
    },
    {
      q: 'Какой тип возвращает функция, которая сохраняет настройки и может сообщить об ошибке, но результата не имеет?',
      answers: [
        'std::expected<void, std::string>',
        'std::expected<void,std::string>',
        'expected<void, std::string>',
        'std::expected<void, E>',
      ],
      placeholder: 'Тип',
      explain: 'expected<void, E>: при успехе возвращают {}, при неудаче — std::unexpected(…).',
    },
    {
      q: 'Почему тип ошибки часто делают enum class, а не строкой?',
      options: [
        'Вызывающий код может реагировать на вид ошибки, не сравнивая тексты, а switch проверит, что обработаны все варианты',
        'Строки нельзя хранить в expected',
        'enum class печатается автоматически',
        'Так требует стандарт',
      ],
      correct: 0,
      explain:
        'Текст — для человека, перечисление — для программы. Описание получают отдельной функцией.',
    },
    {
      q: 'Что плохого в строке int n = parse(text).value_or(0);, если parse возвращает std::expected<int, Error>?',
      options: [
        'Ошибка разбора молча превращается в ноль, и причина теряется',
        'Строка не компилируется',
        'value_or бросает исключение',
        'Ничего, так и задумано',
      ],
      correct: 0,
      explain:
        'value_or уместен, только когда запасное значение действительно верный ответ. Иначе ошибку передают наверх.',
    },
    {
      q: 'Для какой ситуации исключение подходит лучше, чем std::expected?',
      options: [
        'Редкий сбой, который обрабатывают далеко от места возникновения, — например, нехватка памяти',
        'Пользователь ввёл не число',
        'Файл настроек не найден',
        'В строке конфигурации нет знака =',
      ],
      correct: 0,
      explain:
        'Ожидаемые ошибки ввода удобнее возвращать через expected — их обрабатывают рядом. Редкие сбои передают исключениями.',
    },
  ],
  exercises: [
    {
      title: 'Деление',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — два целых числа \`a\` и \`b\`. Напишите функцию \`std::expected<int, std::string> divide(int a, int b)\`, которая возвращает целую часть частного или ошибку:

- \`деление на ноль\`, если \`b = 0\`;
- \`переполнение\`, если \`a = −2 147 483 648\` и \`b = −1\` (результат не помещается в \`int\`).

Напечатайте для каждой пары \`a / b = q\` или \`a / b: ошибка: текст\`.`,
      constraints: ['Числа помещаются в int; пар не больше 20.'],
      hints: [
        'Ошибку возвращайте через std::unexpected("деление на ноль"), значение — просто return a / b;.',
        'Наименьший int — std::numeric_limits<int>::min() из <limits>. Его нельзя разделить на −1: модуль результата на единицу больше наибольшего int.',
      ],
      solution: String.raw`
#include <expected>
#include <iostream>
#include <limits>
#include <print>
#include <string>

std::expected<int, std::string> divide(int a, int b) {
    if (b == 0) {
        return std::unexpected("деление на ноль");
    }
    if (a == std::numeric_limits<int>::min() && b == -1) {
        return std::unexpected("переполнение");
    }
    return a / b;
}

int main() {
    int a, b;
    while (std::cin >> a >> b) {
        auto q = divide(a, b);
        if (q) {
            std::println("{} / {} = {}", a, b, *q);
        } else {
            std::println("{} / {}: ошибка: {}", a, b, q.error());
        }
    }
    return 0;
}`,
      explanation: `
Обе неудачи — ожидаемые случаи, а не сбои, поэтому \`expected\` подходит лучше исключения: вызывающий код обрабатывает их прямо на месте. Деление \`INT_MIN / -1\` — неопределённое поведение (результат 2 147 483 648 не помещается в \`int\`, а на x86 программа просто аварийно завершается), поэтому его нужно проверить **до** деления.

Сообщение об ошибке несёт причину: вызывающий код может напечатать её, не зная, какие проверки выполняет функция.`,
      examples: [
        { in: '17 5\n1 0\n', out: '17 / 5 = 3\n1 / 0: ошибка: деление на ноль\n' },
        { in: '-2147483648 -1\n', out: '-2147483648 / -1: ошибка: переполнение\n' },
      ],
      hidden: [
        { in: '-7 2\n', name: 'Отрицательное делимое' },
        { in: '0 5\n', name: 'Ноль делимое' },
        { in: '0 0\n', name: 'Ноль на ноль' },
        { in: '-2147483648 1\n', name: 'Минимум на 1' },
        { in: '2147483647 -1\n', name: 'Максимум на -1' },
        { in: '-2147483648 2\n', name: 'Минимум на 2' },
        { in: '100 -3\n9 9\n', name: 'Две пары' },
        { in: '5 0\n-2147483648 -1\n6 3\n', name: 'Обе ошибки' },
      ],
    },
    {
      title: 'Разбор настроек',
      description: `
Каждая строка ввода — настройка вида \`имя=значение\`, где значение — целое число. Разберите каждую строку функцией, возвращающей \`std::expected\` с ошибкой-перечислением:

| Ошибка          | Когда                                         | Текст                |
| --------------- | --------------------------------------------- | -------------------- |
| нет \`=\`       | в строке нет знака \`=\`                      | \`нет знака =\`      |
| пустое имя      | \`=\` стоит первым символом                   | \`пустое имя\`       |
| не число        | после \`=\` не целое число (или пусто)        | \`значение не число\` |

Для успешной строки напечатайте \`имя = значение\`, для ошибочной — \`строка N: текст\` (строки нумеруются с 1). В конце — \`настроек: K, ошибок: E\`.`,
      constraints: ['Строк не больше 30, в них нет пробелов; числа помещаются в int.'],
      hints: [
        'enum class ConfigError { no_equals, empty_key, not_number }; и функция std::string_view describe(ConfigError).',
        "Разбор: pos = line.find('='); имя — substr(0, pos), значение — substr(pos + 1), число — std::from_chars с проверкой, что прочитаны все символы.",
      ],
      solution: String.raw`
#include <charconv>
#include <expected>
#include <iostream>
#include <print>
#include <string>
#include <string_view>

enum class ConfigError { no_equals, empty_key, not_number };

std::string_view describe(ConfigError e) {
    switch (e) {
    case ConfigError::no_equals:
        return "нет знака =";
    case ConfigError::empty_key:
        return "пустое имя";
    case ConfigError::not_number:
        return "значение не число";
    }
    return "?";
}

struct Setting {
    std::string_view key;
    int value;
};

std::expected<Setting, ConfigError> parse_setting(std::string_view line) {
    std::size_t eq = line.find('=');
    if (eq == std::string_view::npos) {
        return std::unexpected(ConfigError::no_equals);
    }
    if (eq == 0) {
        return std::unexpected(ConfigError::empty_key);
    }
    std::string_view text = line.substr(eq + 1);
    int value = 0;
    auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), value);
    if (text.empty() || error != std::errc{} || end != text.data() + text.size()) {
        return std::unexpected(ConfigError::not_number);
    }
    return Setting{line.substr(0, eq), value};
}

int main() {
    std::string line;
    int number = 0, good = 0, bad = 0;
    while (std::getline(std::cin, line)) {
        number++;
        auto setting = parse_setting(line);
        if (setting) {
            std::println("{} = {}", setting->key, setting->value);
            good++;
        } else {
            std::println("строка {}: {}", number, describe(setting.error()));
            bad++;
        }
    }
    std::println("настроек: {}, ошибок: {}", good, bad);
    return 0;
}`,
      explanation: `
Перечисление \`ConfigError\` — словарь ошибок, которые может вернуть разбор, а \`describe\` переводит его на человеческий язык. Разделение полезно: программа, читающая настройки, могла бы, например, пропускать строки с \`not_number\`, но останавливаться на \`no_equals\`, — сравнивать для этого тексты не пришлось бы.

Успешный результат — структура \`Setting\`, а к её полям удобно обращаться через \`->\`. Имя хранится как \`std::string_view\` внутри \`line\` и используется до чтения следующей строки, поэтому представление не успевает «повиснуть».`,
      examples: [
        {
          in: 'width=80\nheight\n=5\n',
          out: 'width = 80\nстрока 2: нет знака =\nстрока 3: пустое имя\nнастроек: 1, ошибок: 2\n',
        },
        { in: '', out: 'настроек: 0, ошибок: 0\n' },
      ],
      hidden: [
        { in: 'a=1\nb=-2\n', name: 'Две настройки' },
        { in: 'name=Ada\n', name: 'Не число' },
        { in: 'empty=\n', name: 'Пустое значение' },
        { in: 'x=1=2\n', name: 'Два знака' },
        { in: '=\n', name: 'Только знак' },
        { in: 'port=8080\ndebug=1\nlevel=x3\nretries=+3\n', name: 'Смесь' },
        { in: 'big=2147483647\nsmall=-2147483648\n', name: 'Границы int' },
        { in: 'a\nb\nc\n', name: 'Все без знака' },
      ],
    },
    {
      title: 'Найди ошибку: проглоченная ошибка',
      bug: true,
      description: `
Программа читает слова до конца ввода и печатает сумму чисел — или сообщение об ошибке, если среди слов встретилось не число:

\`\`\`text
ошибка: 'abc' — не число
\`\`\`

Сообщается о **первом** неверном слове. Программа компилируется и работает, но вместо ошибки печатает сумму. Найдите и исправьте ошибку.`,
      constraints: ['Слов не больше 100; числа помещаются в int.'],
      hints: [
        'Что делает value_or(0), если parse_int вернул ошибку?',
        'Ошибку нужно передать наверх: проверить результат и при неудаче вернуть std::unexpected(value.error()) из total.',
      ],
      starter: TOTAL(false),
      solution: TOTAL(true),
      explanation: `
\`parse_int(word).value_or(0)\` превращает любую ошибку в ноль: неверное слово молча пропускается, и программа выдаёт сумму, которой пользователь поверит. Причина ошибки, которую так старательно сформулировал \`parse_int\`, теряется.

Функция \`total\` не может исправить неверное слово — значит, должна передать ошибку тому, кто её вызвал: проверить результат и вернуть \`std::unexpected(value.error())\`. Первое же неверное слово прерывает подсчёт, а \`main\` печатает его причину. \`value_or\` годится, только когда запасное значение — действительно верный ответ, а не способ «заглушить» ошибку.`,
      examples: [
        { in: '10 20 abc 5\n', out: "ошибка: 'abc' — не число\n" },
        { in: '1 2 3\n', out: 'сумма 6\n' },
      ],
      hidden: [
        'x\n',
        '5 7a\n',
        '1 2 3 4 5 + 6\n',
        '2147483647 2147483647\n',
        '-5 -6 seven\n',
        '0\n',
        'один два\n',
        '3.14 1\n',
      ],
    },
    {
      title: 'Калькулятор',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — выражение из трёх слов: \`a op b\`, где \`op\` — одна из операций \`+ - * /\`. Вычислите его в типе \`int\` и напечатайте \`a op b = r\` или \`ошибка: текст\`. Ошибки проверяются в таком порядке:

1. \`'x' — не число\` — для первого из \`a\`, \`b\`, которое не целое число \`int\`;
2. \`неизвестная операция 'op'\`;
3. \`деление на ноль\`;
4. \`переполнение\` — если точный результат не помещается в \`int\`.

Деление — целочисленное, с отбрасыванием дробной части.`,
      constraints: ['Строк не больше 30.'],
      hints: [
        'Разбор числа — функция std::expected<int, std::string> parse_int(std::string_view). Вычисление — std::expected<int, std::string> apply(int a, std::string_view op, int b).',
        'Переполнение проще всего проверить, вычислив результат в long long и сравнив с std::numeric_limits<int>::min() и max(). Операция — ровно один символ из четырёх.',
      ],
      solution: String.raw`
#include <charconv>
#include <expected>
#include <iostream>
#include <limits>
#include <print>
#include <string>
#include <string_view>

std::expected<int, std::string> parse_int(std::string_view text) {
    int value = 0;
    auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), value);
    if (error != std::errc{} || end != text.data() + text.size()) {
        return std::unexpected("'" + std::string(text) + "' — не число");
    }
    return value;
}

std::expected<int, std::string> apply(int a, std::string_view op, int b) {
    long long x = a, y = b, r = 0;
    if (op == "+") {
        r = x + y;
    } else if (op == "-") {
        r = x - y;
    } else if (op == "*") {
        r = x * y;
    } else if (op == "/") {
        if (y == 0) {
            return std::unexpected("деление на ноль");
        }
        r = x / y;
    } else {
        return std::unexpected("неизвестная операция '" + std::string(op) + "'");
    }
    if (r < std::numeric_limits<int>::min() || r > std::numeric_limits<int>::max()) {
        return std::unexpected("переполнение");
    }
    return static_cast<int>(r);
}

std::expected<int, std::string> evaluate(std::string_view a, std::string_view op, std::string_view b) {
    return parse_int(a).and_then([&](int x) {
        return parse_int(b).and_then([&](int y) { return apply(x, op, y); });
    });
}

int main() {
    std::string a, op, b;
    while (std::cin >> a >> op >> b) {
        auto result = evaluate(a, op, b);
        if (result) {
            std::println("{} {} {} = {}", a, op, b, *result);
        } else {
            std::println("ошибка: {}", result.error());
        }
    }
    return 0;
}`,
      explanation: `
Вычисление собрано из трёх функций, каждая из которых может не удаться, — и \`and_then\` соединяет их так, что первая же ошибка проходит до \`main\` без единого \`if\` в \`evaluate\`. Порядок проверок из условия соблюдается сам: сначала разбирается \`a\`, затем \`b\`, и только потом вызывается \`apply\`, которая проверяет операцию, ноль и переполнение.

Переполнение определяется честно: \`int\` расширяется до \`long long\`, где сумма, разность и произведение двух \`int\` точно помещаются, и результат сравнивается с границами \`int\`. Проверять «после» в самом \`int\` нельзя — переполнение знакового типа уже было бы неопределённым поведением.`,
      examples: [
        { in: '7 * 6\n9 / 0\n', out: '7 * 6 = 42\nошибка: деление на ноль\n' },
        { in: 'x + 1\n2 ^ 3\n', out: "ошибка: 'x' — не число\nошибка: неизвестная операция '^'\n" },
      ],
      hidden: [
        { in: '2147483647 + 1\n', name: 'Переполнение суммы' },
        { in: '-2147483648 / -1\n', name: 'Переполнение деления' },
        { in: '-7 / 2\n', name: 'Отбрасывание дроби' },
        { in: '100000 * 100000\n', name: 'Переполнение произведения' },
        { in: '1 ^ y\n', name: 'Сначала числа' },
        { in: '5 - 8\n0 * -3\n', name: 'Простые' },
        { in: '-2147483648 - 1\n', name: 'Вниз' },
        { in: '12 + 4x\n10 // 2\n', name: 'Второе число и двойной слэш' },
      ],
    },
  ],
};
