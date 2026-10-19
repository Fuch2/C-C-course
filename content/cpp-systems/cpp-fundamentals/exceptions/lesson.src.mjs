const HANDLERS = (fixed) => String.raw`
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream in(line);
    std::vector<int> values;
    int x;
    while (in >> x) {
        values.push_back(x);
    }
    std::string query;
    while (std::cin >> query) {
        try {
            int index = std::stoi(query);
            std::cout << values.at(static_cast<std::size_t>(index)) << '\n';
        }${
          fixed
            ? ` catch (const std::invalid_argument &) {
            std::cout << "не номер\\n";
        } catch (const std::out_of_range &) {
            std::cout << "нет такого индекса\\n";
        } catch (const std::exception &) {
            std::cout << "ошибка\\n";
        }`
            : ` catch (const std::exception &) {
            std::cout << "ошибка\\n";
        } catch (const std::invalid_argument &) {
            std::cout << "не номер\\n";
        } catch (const std::out_of_range &) {
            std::cout << "нет такого индекса\\n";
        }`
        }
    }
    return 0;
}`;

export default {
  id: 'cpp20-exceptions',
  title: 'Исключения',
  description:
    'Ошибки в C и в C++; throw, try и catch; стандартные исключения at, stoi и иерархия std::exception; порядок обработчиков и ловля по константной ссылке; раскрутка стека и освобождение ресурсов; неперехваченное исключение; когда бросать исключения.',
  moduleId: 'cpp-fundamentals',
  order: 26,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['cpp20-set'],
  objectives: [
    'Бросать и перехватывать исключения',
    'Обрабатывать исключения стандартной библиотеки',
    'Располагать обработчики в правильном порядке',
    'Объяснять раскрутку стека и связь исключений с освобождением ресурсов',
  ],
  tags: ['C++', 'Исключения', 'try', 'catch'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <stdexcept>

int main() {
    try {
        std::cout << 'A';
        throw std::runtime_error("x");
        std::cout << 'B';
    } catch (const std::exception &) {
        std::cout << 'C';
    }
    std::cout << 'D' << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['ACD'],
      placeholder: 'Вывод программы',
      explain:
        'После throw оставшаяся часть try пропускается, выполняется обработчик, затем код после блока.',
    },
    {
      q: 'Что бросает std::stoi("hello")?',
      options: [
        'std::invalid_argument',
        'std::out_of_range',
        'Возвращает 0 без исключения',
        'std::runtime_error',
      ],
      correct: 0,
      explain:
        'Строка не начинается с числа — invalid_argument. Для числа, не помещающегося в int, — out_of_range.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <stdexcept>
#include <vector>

int main() {
    std::vector<int> v = {1, 2};
    try {
        v.at(5) = 10;
    } catch (const std::out_of_range &) {
        std::cout << "диапазон ";
    } catch (const std::exception &) {
        std::cout << "общее ";
    }
    std::cout << v.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['диапазон 2'],
      placeholder: 'Вывод программы',
      explain:
        'at бросает std::out_of_range — срабатывает первый подходящий обработчик. Вектор не изменился.',
    },
    {
      q: 'Почему обработчик catch (const std::exception &) ставят последним?',
      options: [
        'Он ловит любое стандартное исключение, и обработчики после него никогда не сработают',
        'Иначе программа не скомпилируется',
        'Он медленнее остальных',
        'Порядок не важен',
      ],
      correct: 0,
      explain:
        'Обработчики проверяются по порядку, срабатывает первый подходящий. GCC предупреждает о недостижимых обработчиках.',
    },
    {
      q: 'Как правильно ловить исключения?',
      options: [
        'По константной ссылке: catch (const std::exception &e)',
        'По значению: catch (std::exception e)',
        'По указателю: catch (std::exception *e)',
        'Без типа: catch ()',
      ],
      correct: 0,
      explain:
        'Ловля по значению копирует объект и обрезает потомка до базового класса. Указатель не подходит: бросают объекты, а не указатели.',
    },
    {
      q: 'Что происходит с локальным std::vector функции, из которой вылетело исключение?',
      options: [
        'Он уничтожается, и его память освобождается',
        'Память утекает до конца программы',
        'Вектор продолжает существовать до catch',
        'Неопределённое поведение',
      ],
      correct: 0,
      explain:
        'При раскрутке стека все локальные объекты уничтожаются, как при обычном выходе из функции. Поэтому ресурсы в объектах не утекают.',
    },
    {
      q: 'Что произойдёт, если исключение не перехватил ни один обработчик?',
      options: [
        'Программа аварийно завершится через std::terminate',
        'Исключение будет проигнорировано',
        'Функция вернёт 0',
        'Программа продолжит работу с main',
      ],
      correct: 0,
      explain:
        'Неперехваченное исключение вызывает std::terminate, которая обычно завершает программу сигналом SIGABRT.',
    },
    {
      q: 'Для каких ситуаций исключения подходят лучше всего?',
      options: [
        'Неверные входные данные, которые функция не может обработать',
        'Не удалось открыть нужный файл',
        'Элемент не найден при обычном поиске',
        'Выход из цикла по достижении конца данных',
      ],
      correct: [0, 1],
      explain:
        '«Не найдено» и конец данных — обычный ход программы: для них есть end(), признаки и условия цикла.',
    },
  ],
  exercises: [
    {
      title: 'Безопасное деление',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — два числа \`a\` и \`b\`. Напишите функцию \`double divide(double a, double b)\`, которая при \`b == 0\` бросает \`std::invalid_argument("деление на ноль")\`. Для каждой строки напечатайте частное с тремя знаками после точки или \`ошибка: деление на ноль\`, перехватив исключение.`,
      constraints: ['|a|, |b| ≤ 10⁶; строк не больше 30.'],
      hints: [
        'throw std::invalid_argument("деление на ноль"); — заголовок <stdexcept>.',
        'Вызов в try, обработчик catch (const std::invalid_argument &e) печатает "ошибка: " и e.what().',
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>
#include <stdexcept>

double divide(double a, double b) {
    if (b == 0) {
        throw std::invalid_argument("деление на ноль");
    }
    return a / b;
}

int main() {
    std::cout << std::fixed << std::setprecision(3);
    double a, b;
    while (std::cin >> a >> b) {
        try {
            std::cout << divide(a, b) << '\n';
        } catch (const std::invalid_argument &e) {
            std::cout << "ошибка: " << e.what() << '\n';
        }
    }
    return 0;
}`,
      explanation: `
Функция не знает, что делать при делении на ноль, — печатать сообщение или прекращать работу решает вызывающий. Поэтому она сообщает об ошибке исключением, а цикл в \`main\` перехватывает его и продолжает со следующей строки. Возвращаемое значение \`divide\` занято только результатом — не нужно ни особого значения, ни параметра для кода ошибки.

Блок \`try\` стоит внутри цикла: исключение прерывает только текущую итерацию. Если бы цикл был внутри \`try\`, первая же ошибка завершила бы всю обработку.`,
      examples: [
        { in: '10 4\n1 0\n-9 3\n', out: '2.500\nошибка: деление на ноль\n-3.000\n' },
        { in: '1 3\n', out: '0.333\n' },
      ],
      hidden: [
        '0 5\n',
        '5 0\n0 0\n',
        '1000000 0.5\n',
        '-1 -4\n',
        '2 3\n',
        '7 7\n',
        '1 1000000\n',
        '0.25 0.5\n',
      ],
    },
    {
      title: 'Проверка чисел',
      description: `
До конца ввода идут слова. Для каждого попробуйте превратить его в \`int\` через \`std::stoi\` и напечатайте:

- \`число N\` — если всё слово — корректное целое число, помещающееся в \`int\`;
- \`не число\` — если \`std::stoi\` бросил \`std::invalid_argument\`;
- \`слишком большое\` — если бросил \`std::out_of_range\`;
- \`лишние символы\` — если число разобрано, но после него остались символы.`,
      constraints: ['Слов не больше 100, длиной до 30 символов.'],
      hints: [
        'std::size_t pos; int value = std::stoi(word, &pos); — в pos окажется число разобранных символов.',
        'Если pos != word.size(), разобрано не всё слово — бросьте своё исключение или выведите ответ сразу. Обработчики invalid_argument и out_of_range — отдельные catch.',
      ],
      solution: String.raw`
#include <iostream>
#include <stdexcept>
#include <string>

int main() {
    std::string word;
    while (std::cin >> word) {
        try {
            std::size_t pos;
            int value = std::stoi(word, &pos);
            if (pos != word.size()) {
                std::cout << "лишние символы\n";
            } else {
                std::cout << "число " << value << '\n';
            }
        } catch (const std::invalid_argument &) {
            std::cout << "не число\n";
        } catch (const std::out_of_range &) {
            std::cout << "слишком большое\n";
        }
    }
    return 0;
}`,
      explanation: `
\`std::stoi\` сообщает о двух видах ошибок двумя типами исключений: строка не начинается с числа — \`invalid_argument\`, число не помещается в \`int\` — \`out_of_range\`. Отдельные обработчики дают разные сообщения. Третий случай — число в начале слова, а за ним мусор — \`stoi\` ошибкой не считает: он разбирает, сколько может, и сообщает длину разобранного через \`pos\`.

\`stoi\`, как и \`strtol\`, пропускает пробелы в начале и принимает знак, поэтому \`+5\` — корректное число. Сравните с проверкой ввода через \`>>\` из урока о \`std::cin\`: там «12abc» разбивалось на число и слово, здесь слово проверяется целиком.`,
      examples: [
        {
          in: '42 abc 12abc 99999999999\n',
          out: 'число 42\nне число\nлишние символы\nслишком большое\n',
        },
        { in: '-7 +5\n', out: 'число -7\nчисло 5\n' },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '2147483647 2147483648\n', name: 'Граница int' },
        { in: '-2147483648 -2147483649\n', name: 'Нижняя граница' },
        { in: '- + x\n', name: 'Знаки без цифр' },
        { in: '3.14 1e5\n', name: 'Дробные' },
        { in: '007 0x1F\n', name: 'Ведущие нули и hex' },
        { in: 'word 100500\n', name: 'Смешанные' },
        { in: '123456789012345678901234567890\n', name: 'Очень длинное' },
      ],
    },
    {
      title: 'Найди ошибку: доступ по индексу',
      bug: true,
      description: `
Первая строка — список целых чисел. Дальше до конца ввода идут запросы — слова. Для каждого запроса программа превращает слово в номер через \`std::stoi\` и печатает элемент \`values.at(номер)\`. Ошибки обрабатываются так: слово не число — \`не номер\`, номера нет в списке — \`нет такого индекса\`, прочие ошибки — \`ошибка\`.

Вместо точных сообщений программа всегда печатает \`ошибка\`. Найдите и исправьте ошибку.`,
      constraints: ['В списке от 1 до 100 чисел; запросов не больше 100.'],
      hints: [
        'В каком порядке проверяются обработчики catch? Какой из них подходит к std::out_of_range первым?',
        'catch (const std::exception &) ловит любое стандартное исключение — поставленный первым, он перехватывает всё. Переставьте его в конец.',
      ],
      starter: HANDLERS(false),
      solution: HANDLERS(true),
      explanation: `
Обработчики \`catch\` проверяются сверху вниз, и срабатывает первый, чей тип подходит. \`std::invalid_argument\` и \`std::out_of_range\` — потомки \`std::exception\`, поэтому обработчик для \`std::exception\`, стоящий первым, перехватывает их все, а точные обработчики становятся недостижимыми. GCC предупреждает об этом: \`exception of type 'std::invalid_argument' will be caught by earlier handler\`.

Правило: от частного к общему. Точные типы — первыми, общий \`std::exception\` — последним, как запасной вариант для непредвиденных ошибок. Отрицательный номер тоже даёт \`out_of_range\`: \`-1\`, приведённый к \`std::size_t\`, — огромное число, и \`at\` его отвергает.`,
      examples: [
        { in: '10 20 30\n1\nx\n5\n', out: '20\nне номер\nнет такого индекса\n' },
        { in: '7\n0\n', out: '7\n' },
      ],
      hidden: [
        '1 2 3\n-1\n',
        '5\nabc\n',
        '5\n99999999999\n',
        '4 5 6\n2\n3\n',
        '9 8\n0\n1\n2\n',
        '1\n1x\n',
        '3 3 3\nzero\n0\n',
        '100\n10\n',
      ],
    },
    {
      title: 'Калькулятор с ошибками',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — выражение \`a op b\`, где \`a\` и \`b\` — целые числа, \`op\` — одна из операций \`+\`, \`-\`, \`*\`, \`/\` (деление целочисленное). Напечатайте результат или \`ошибка: ТЕКСТ\`, где текст — сообщение исключения:

- \`не число\` — \`a\` или \`b\` не является целым числом целиком (используйте \`std::stoll\` и проверку разобранной длины) или не помещается в \`long long\`;
- \`неизвестная операция\`;
- \`деление на ноль\`;
- \`переполнение\` — результат не помещается в \`long long\`.

Каждую ошибку бросайте исключением из функции \`long long calculate(const std::string &a, const std::string &op, const std::string &b)\`, а перехватывайте в \`main\` одним обработчиком \`catch (const std::exception &e)\`.`,
      constraints: ['Строк не больше 30; в каждой ровно три слова.'],
      hints: [
        'Разбор числа: функция long long parse(const std::string &s) с std::stoll(s, &pos); если pos != s.size() — throw std::invalid_argument("не число"). out_of_range от stoll тоже превратите в «не число»: перехватите и бросьте заново.',
        'Переполнение проверяют до вычисления. Для + - * в GCC и Clang есть встроенные функции __builtin_add_overflow(a, b, &result) и аналогичные для вычитания и умножения: они возвращают true при переполнении. Для деления переполнение одно — LLONG_MIN / −1.',
        'Используйте разные классы: std::invalid_argument, std::domain_error, std::overflow_error — все они потомки std::exception, и один обработчик в main напечатает what() любого из них.',
      ],
      solution: String.raw`
#include <climits>
#include <iostream>
#include <stdexcept>
#include <string>

long long parse(const std::string &s) {
    std::size_t pos = 0;
    long long value = 0;
    try {
        value = std::stoll(s, &pos);
    } catch (const std::logic_error &) {
        throw std::invalid_argument("не число");
    }
    if (pos != s.size()) {
        throw std::invalid_argument("не число");
    }
    return value;
}

long long calculate(const std::string &a_text, const std::string &op, const std::string &b_text) {
    long long a = parse(a_text), b = parse(b_text), result = 0;
    if (op == "+") {
        if (__builtin_add_overflow(a, b, &result)) {
            throw std::overflow_error("переполнение");
        }
    } else if (op == "-") {
        if (__builtin_sub_overflow(a, b, &result)) {
            throw std::overflow_error("переполнение");
        }
    } else if (op == "*") {
        if (__builtin_mul_overflow(a, b, &result)) {
            throw std::overflow_error("переполнение");
        }
    } else if (op == "/") {
        if (b == 0) {
            throw std::domain_error("деление на ноль");
        }
        if (a == LLONG_MIN && b == -1) {
            throw std::overflow_error("переполнение");
        }
        result = a / b;
    } else {
        throw std::invalid_argument("неизвестная операция");
    }
    return result;
}

int main() {
    std::string a, op, b;
    while (std::cin >> a >> op >> b) {
        try {
            std::cout << calculate(a, op, b) << '\n';
        } catch (const std::exception &e) {
            std::cout << "ошибка: " << e.what() << '\n';
        }
    }
    return 0;
}`,
      explanation: `
Ошибки обнаруживаются в разных местах — при разборе числа, при выборе операции, при вычислении, — но обрабатываются в одном: исключение пролетает через \`parse\` и \`calculate\` до \`main\`, и промежуточным функциям не нужно передавать коды ошибок. Все классы ошибок — потомки \`std::exception\`, поэтому одного обработчика с \`e.what()\` достаточно; при необходимости \`main\` мог бы различать их отдельными \`catch\`.

\`parse\` перехватывает исключения \`std::stoll\` (\`invalid_argument\` и \`out_of_range\` — потомки \`std::logic_error\`) и бросает своё, с понятным сообщением, — так исключения переводят с «языка библиотеки» на язык задачи. Переполнение проверяется **до** вычисления: переполнение знакового целого — неопределённое поведение, и UBSan остановил бы программу. Встроенные функции GCC и Clang \`__builtin_*_overflow\` вычисляют результат и сообщают, поместился ли он.`,
      examples: [
        { in: '7 * 6\n10 / 0\n', out: '42\nошибка: деление на ноль\n' },
        {
          in: '9223372036854775807 + 1\n2 ^ 3\nx + 1\n',
          out: 'ошибка: переполнение\nошибка: неизвестная операция\nошибка: не число\n',
        },
      ],
      hidden: [
        { in: '-7 / 2\n', name: 'Деление к нулю' },
        { in: '-9223372036854775808 / -1\n', name: 'Переполнение деления' },
        { in: '-9223372036854775808 - 1\n', name: 'Переполнение вычитания' },
        { in: '3037000500 * 3037000500\n', name: 'Переполнение умножения' },
        { in: '3037000499 * 3037000499\n', name: 'Умножение без переполнения' },
        { in: '99999999999999999999 + 1\n', name: 'Слишком длинное число' },
        { in: '12a + 1\n5 - 3b\n', name: 'Лишние символы' },
        { in: '0 / 5\n-1 * -1\n100 - 250\n', name: 'Обычные операции' },
      ],
    },
  ],
};
