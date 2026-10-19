const SETTINGS = (fixed) => String.raw`
#include <charconv>
#include <iostream>
#include <print>
#include <string>
#include <variant>

using Value = std::variant<std::string, long long>;

template <class... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

Value parse(const std::string &text) {
    long long number = 0;
    const char *end = text.data() + text.size();
    const auto [ptr, ec] = std::from_chars(text.data(), end, number);
    if (ec == std::errc() && ptr == end) {
        return number;
    }
    return text;
}

int main() {
    std::string key, raw;
    long long total = 0;
    while (std::cin >> key >> raw) {
        const Value value = parse(raw);
        std::visit(overloaded{
                       [&](long long n) { std::println("{}: число {}", key, n); },
                       [&](const std::string &s) { std::println("{}: текст {}", key, s); },
                   },
                   value);
${
  fixed
    ? `        if (const long long *n = std::get_if<long long>(&value)) {
            total += *n;
        }`
    : `        if (value.index() == 0) {
            total += std::get<long long>(value);
        }`
}
    }
    std::println("сумма {}", total);
    return 0;
}`;

const OVERLOADED = `template <class... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};`;

export default {
  id: 'oop-variant',
  title: 'std::variant и std::visit',
  description:
    'Тип-сумма std::variant для закрытого набора видов: альтернативы, index, get, get_if, holds_alternative, bad_variant_access; std::visit с набором лямбд overloaded и проверка всех случаев компилятором; сравнение с виртуальными функциями — что легче добавлять, типы или операции; конечный автомат на variant и monostate.',
  moduleId: 'cpp-oop',
  order: 25,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-interfaces'],
  objectives: [
    'Хранить значение одного из нескольких типов в std::variant',
    'Безопасно доставать значение через get_if и std::visit',
    'Выбирать между variant и иерархией с виртуальными функциями',
    'Описывать состояния конечного автомата альтернативами variant',
  ],
  tags: ['C++23', 'ООП', 'variant', 'visit', 'Конечный автомат'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <variant>

int main() {
    std::variant<int, double, std::string> v = 2.5;
    std::println("{}", v.index());
    return 0;
}`,
      lang: 'cpp',
      answers: ['1'],
      placeholder: 'Вывод программы',
      explain: 'Нумерация альтернатив начинается с нуля: int — 0, double — 1.',
    },
    {
      q: 'Что делает std::get<int>(v), если в v сейчас строка?',
      options: [
        'Бросает std::bad_variant_access',
        'Возвращает 0',
        'Возвращает nullptr',
        'Неопределённое поведение без диагностики',
      ],
      correct: 0,
      explain: 'std::get проверяет альтернативу и бросает исключение при несовпадении.',
    },
    {
      q: 'Что возвращает std::get_if<int>(&v), если в v не int?',
      options: ['nullptr', 'Указатель на 0', 'Исключение', 'Указатель на строку'],
      correct: 0,
      explain: 'get_if — проверка и доступ за один шаг, без исключений.',
    },
    {
      q: 'В overloaded для std::visit нет обработчика одной из альтернатив. Что произойдёт?',
      options: [
        'Ошибка компиляции',
        'Исключение во время работы',
        'Эта альтернатива молча пропускается',
        'Вызовется первый обработчик',
      ],
      correct: 0,
      explain:
        'visit должен уметь вызвать функцию для каждой альтернативы — это проверяется при компиляции.',
    },
    {
      q: 'Что легче добавить, если виды объектов описаны std::variant?',
      options: [
        'Новую операцию над всеми видами',
        'Новый вид объектов',
        'И то и другое одинаково легко',
        'Ничего нельзя добавить без переписывания программы',
      ],
      correct: 0,
      explain:
        'Новая операция — ещё одна функция с visit. Новый вид требует правки всех обработчиков; с виртуальными функциями — наоборот.',
    },
    {
      q: 'Что хранит std::variant<Idle, Running> state; сразу после создания?',
      options: [
        'Значение первой альтернативы, созданное по умолчанию',
        'Ничего — variant пуст',
        'Значение последней альтернативы',
        'Неинициализированную память',
      ],
      correct: 0,
      explain: 'Поэтому первой ставят начальное состояние или std::monostate.',
    },
    {
      q: 'Где хранится значение std::variant<int, std::string>?',
      options: [
        'Внутри самого объекта variant',
        'Всегда в куче',
        'В статической памяти',
        'В отдельном векторе',
      ],
      correct: 0,
      explain:
        'variant не выделяет память сам; размер — наибольшая альтернатива плюс номер. Строка, конечно, может держать свои символы в куче.',
    },
    {
      q: 'Почему проверка if (v.index() == 1) хуже, чем std::holds_alternative<std::string>(v)?',
      options: [
        'Номер ломается при изменении порядка типов в variant',
        'index() медленнее',
        'index() не существует',
        'holds_alternative бросает исключение',
      ],
      correct: 0,
      explain: 'Проверка по типу не зависит от порядка альтернатив.',
    },
    {
      q: 'Как называется пустой тип, который ставят первой альтернативой variant, если у остальных нет конструктора по умолчанию?',
      answers: ['std::monostate', 'monostate'],
      placeholder: 'Имя типа',
      explain: 'std::monostate — «нет значения» для variant.',
    },
  ],
  exercises: [
    {
      id: 'oop-variant-exercise',
      title: 'Команды робота',
      difficulty: 'beginner',
      description: `
Робот стоит в точке (0, 0) и смотрит на север. Команды описаны структурами \`Move { int steps; }\`, \`Turn { bool left; }\`, \`Say { std::string text; }\` и типом \`using Command = std::variant<Move, Turn, Say>;\`.

Ввод — команды по одной: \`move N\`, \`turn left\` или \`turn right\`, \`say слово\`. Сначала разберите команду в \`Command\`, затем выполните её через \`std::visit\`:

- \`Move\` — шаг на N клеток в текущем направлении (север — \`y + N\`, восток — \`x + N\`, юг — \`y − N\`, запад — \`x − N\`);
- \`Turn\` — поворот на 90°;
- \`Say\` — печать \`(x, y) слово\`.

В конце напечатайте \`конец (x, y) направление\`, где направление — \`север\`, \`восток\`, \`юг\` или \`запад\`.`,
      constraints: ['Команд не больше 100; 0 ≤ N ≤ 1000.'],
      hints: [
        'Направление удобно хранить числом 0…3 (север, восток, юг, запад): поворот направо — (d + 1) % 4, налево — (d + 3) % 4.',
        'Обработчики в overloaded захватывают состояние робота по ссылке: [&](const Move &m) { … }.',
      ],
      solution: String.raw`
#include <array>
#include <iostream>
#include <print>
#include <string>
#include <variant>

struct Move {
    int steps;
};

struct Turn {
    bool left;
};

struct Say {
    std::string text;
};

using Command = std::variant<Move, Turn, Say>;

${OVERLOADED}

Command parse(const std::string &kind, std::istream &in) {
    if (kind == "move") {
        int steps;
        in >> steps;
        return Move{steps};
    }
    if (kind == "turn") {
        std::string side;
        in >> side;
        return Turn{side == "left"};
    }
    std::string text;
    in >> text;
    return Say{text};
}

int main() {
    constexpr std::array<int, 4> dx{0, 1, 0, -1};
    constexpr std::array<int, 4> dy{1, 0, -1, 0};
    constexpr std::array<const char *, 4> names{"север", "восток", "юг", "запад"};
    int x = 0, y = 0, dir = 0;
    std::string kind;
    while (std::cin >> kind) {
        const Command command = parse(kind, std::cin);
        std::visit(overloaded{
                       [&](const Move &m) {
                           x += dx[dir] * m.steps;
                           y += dy[dir] * m.steps;
                       },
                       [&](const Turn &t) { dir = t.left ? (dir + 3) % 4 : (dir + 1) % 4; },
                       [&](const Say &s) { std::println("({}, {}) {}", x, y, s.text); },
                   },
                   command);
    }
    std::println("конец ({}, {}) {}", x, y, names[dir]);
    return 0;
}`,
      explanation: `
Разбор и выполнение разделены: \`parse\` превращает текст в значение \`Command\`, а \`visit\` выполняет его. Команда — просто данные, её можно сохранить в вектор, отменить или передать по сети, и для этого не нужна иерархия классов с кучей.

Если добавить в \`Command\` новую команду, например \`Jump\`, компилятор потребует обработчик в \`visit\` — забыть случай не получится.`,
      examples: [
        {
          in: 'move 2\nturn right\nmove 3\nsay привет\nturn left\nturn left\nmove 1\n',
          out: '(3, 2) привет\nконец (2, 2) запад\n',
        },
        { in: '', out: 'конец (0, 0) север\n' },
      ],
      hidden: [
        { in: 'turn left\n', name: 'Поворот налево с севера' },
        { in: 'turn right\nturn right\nturn right\nturn right\n', name: 'Полный оборот' },
        { in: 'turn right\nturn right\nmove 5\nsay юг\n', name: 'Движение на юг' },
        { in: 'say старт\nmove 0\nsay стоп\n', name: 'Нулевой шаг' },
        { in: 'move 1000\nturn left\nmove 1000\n', name: 'Большие шаги' },
        { in: 'turn left\nturn left\nturn left\nmove 4\n', name: 'Три поворота налево' },
        { in: 'move 1\nsay a\nmove 1\nsay b\nmove 1\nsay c\n', name: 'Несколько фраз' },
        {
          in: 'turn right\nmove 2\nturn right\nmove 2\nturn right\nmove 2\nturn right\nmove 2\nsay дома\n',
          name: 'Квадрат',
        },
      ],
    },
    {
      title: 'Токены',
      description: `
Разберите слова входа на токены \`using Token = std::variant<long long, double, std::string>;\`:

- слово целиком читается как целое (\`std::from_chars\` в \`long long\`) — целое;
- иначе слово целиком читается как дробное (\`std::from_chars\` в \`double\`) — дробное;
- иначе — строка.

Для каждого токена напечатайте \`целое N\`, \`дробное D\` или \`строка S\` (дробное — в формате \`{}\` библиотеки \`<format>\`). В конце напечатайте \`целых K, сумма S\` — количество и сумму целых токенов (используйте \`std::get_if\` или \`std::holds_alternative\`).`,
      constraints: [
        'Слов не больше 100; целые по модулю до 10¹²; слова nan и inf во входе не встречаются.',
      ],
      hints: [
        'Чтобы слово читалось «целиком», проверьте не только ec == std::errc(), но и что указатель ptr дошёл до конца строки.',
        'Печать через visit: [](long long n) { … }, [](double d) { … }, [](const std::string &s) { … }.',
      ],
      solution: String.raw`
#include <charconv>
#include <iostream>
#include <print>
#include <string>
#include <variant>
#include <vector>

using Token = std::variant<long long, double, std::string>;

${OVERLOADED}

Token classify(const std::string &word) {
    const char *begin = word.data();
    const char *end = begin + word.size();
    long long integer = 0;
    if (const auto [ptr, ec] = std::from_chars(begin, end, integer); ec == std::errc() && ptr == end) {
        return integer;
    }
    double real = 0;
    if (const auto [ptr, ec] = std::from_chars(begin, end, real); ec == std::errc() && ptr == end) {
        return real;
    }
    return word;
}

int main() {
    std::vector<Token> tokens;
    std::string word;
    while (std::cin >> word) {
        tokens.push_back(classify(word));
    }
    for (const Token &t : tokens) {
        std::visit(overloaded{
                       [](long long n) { std::println("целое {}", n); },
                       [](double d) { std::println("дробное {}", d); },
                       [](const std::string &s) { std::println("строка {}", s); },
                   },
                   t);
    }
    long long count = 0, sum = 0;
    for (const Token &t : tokens) {
        if (const long long *n = std::get_if<long long>(&t)) {
            count++;
            sum += *n;
        }
    }
    std::println("целых {}, сумма {}", count, sum);
    return 0;
}`,
      explanation: `
Каждый токен знает свой вид, и дальше программа не разбирает текст повторно. Печать перебирает все случаи через \`visit\`, а подсчёт интересуется только целыми — для него достаточно \`get_if\`, который возвращает \`nullptr\` для остальных альтернатив.

Порядок проверок важен: «42» читается и как целое, и как дробное, поэтому сначала пробуем целое. Условие «указатель дошёл до конца» отбрасывает слова вроде «12кг», у которых число — только начало.`,
      examples: [
        {
          in: '42 2.5 кот -7\n',
          out: 'целое 42\nдробное 2.5\nстрока кот\nцелое -7\nцелых 2, сумма 35\n',
        },
        { in: '', out: 'целых 0, сумма 0\n' },
      ],
      hidden: [
        { in: '1e3 12кг 0.1\n', name: 'Экспонента и хвост' },
        { in: 'a b c\n', name: 'Только строки' },
        { in: '1000000000000 -1000000000000 5\n', name: 'Большие целые' },
        { in: '3.0 -0.5\n', name: 'Дробные' },
        { in: '0 00 -0\n', name: 'Нули' },
        { in: '+5 5.\n', name: 'Знак плюс и точка в конце' },
        { in: 'x1 1x 7\n', name: 'Смешанные слова' },
        { in: '1 2 3 4 5 6 7 8 9 10\n', name: 'Десять целых' },
      ],
    },
    {
      title: 'Найди ошибку: номер вместо типа',
      bug: true,
      description: `
Программа читает настройки \`ключ значение\`. Значение, которое целиком читается как целое, хранится как число, иначе — как текст (\`using Value = std::variant<std::string, long long>;\`). Для каждой настройки печатается \`ключ: число N\` или \`ключ: текст S\`, а в конце — \`сумма S\` всех числовых значений.

Сначала \`Value\` было объявлено как \`std::variant<long long, std::string>\`, потом альтернативы переставили — и сумма сломалась, а на текстовых настройках программа завершается аварийно. Исправьте проверку так, чтобы она не зависела от порядка альтернатив.`,
      constraints: ['Настроек не больше 50; числа по модулю до 10¹².'],
      hints: [
        'Какой тип теперь имеет альтернатива с номером 0?',
        'Проверяйте тип, а не номер: std::get_if<long long>(&value) или std::holds_alternative<long long>(value).',
      ],
      starter: SETTINGS(false),
      solution: SETTINGS(true),
      explanation: `
После перестановки альтернатив номер 0 принадлежит строке. Условие \`value.index() == 0\` теперь истинно для текста, и \`std::get<long long>\` бросает \`std::bad_variant_access\`, которое никто не ловит. А для чисел (номер 1) условие ложно — они не попадают в сумму.

\`std::get_if<long long>(&value)\` проверяет тип и достаёт значение за один шаг и не зависит от порядка альтернатив. Номер альтернативы почти никогда не нужен в прикладном коде.`,
      examples: [
        {
          in: 'port 8080\nhost localhost\nretries 3\n',
          out: 'port: число 8080\nhost: текст localhost\nretries: число 3\nсумма 8083\n',
        },
        { in: 'a 1\nb 2\n', out: 'a: число 1\nb: число 2\nсумма 3\n' },
      ],
      hidden: [
        'x -5\n',
        'name Ада\n',
        'v 1.5\nw 2\n',
        'a 1000000000000\nb 1000000000000\n',
        'k 12кг\n',
        'p 0\nq ноль\n',
        'one 1\ntwo два\nthree 3\nfour четыре\n',
        'only 42\n',
      ],
    },
    {
      title: 'Соединение',
      difficulty: 'advanced',
      description: `
Опишите конечный автомат соединения. Состояния: \`Disconnected\`, \`Connecting { int attempt; }\`, \`Connected { std::string session; }\` — альтернативы \`State\`. События: \`Connect\`, \`Fail\`, \`Ok { std::string session; }\`, \`Drop\` — альтернативы \`Event\`. Начальное состояние — \`Disconnected\`.

Переходы:

- \`Disconnected\` + \`Connect\` → \`Connecting { 1 }\`;
- \`Connecting { n }\` + \`Fail\` → \`Connecting { n + 1 }\`, если \`n < 3\`, иначе \`Disconnected\`;
- \`Connecting\` + \`Ok { s }\` → \`Connected { s }\`;
- \`Connected\` + \`Drop\` → \`Disconnected\`;
- любое другое сочетание — событие игнорируется.

Функция \`std::optional<State> next(const State &, const Event &)\` возвращает новое состояние или \`std::nullopt\`. Ввод — слова \`connect\`, \`fail\`, \`ok ид\`, \`drop\`. После каждого события напечатайте новое состояние: \`отключено\`, \`подключение, попытка N\` или \`подключено, сессия ид\`; для проигнорированного — \`игнор: событие\` (\`connect\`, \`fail\`, \`ok\` или \`drop\`) и состояние не меняйте.`,
      constraints: ['Событий не больше 100.'],
      hints: [
        'std::visit принимает несколько variant сразу: std::visit(overloaded{…}, state, event) вызывает обработчик с двумя параметрами.',
        'Последним в overloaded поставьте обобщённую лямбду [](const auto &, const auto &) -> std::optional<State> { return std::nullopt; } — она поймает все остальные пары. Точные обработчики выигрывают у шаблона при перегрузке.',
      ],
      solution: String.raw`
#include <iostream>
#include <optional>
#include <print>
#include <string>
#include <utility>
#include <variant>

struct Disconnected {};
struct Connecting {
    int attempt;
};
struct Connected {
    std::string session;
};
using State = std::variant<Disconnected, Connecting, Connected>;

struct Connect {};
struct Fail {};
struct Ok {
    std::string session;
};
struct Drop {};
using Event = std::variant<Connect, Fail, Ok, Drop>;

${OVERLOADED}

std::optional<State> next(const State &state, const Event &event) {
    return std::visit(
        overloaded{
            [](const Disconnected &, const Connect &) -> std::optional<State> { return Connecting{1}; },
            [](const Connecting &c, const Fail &) -> std::optional<State> {
                if (c.attempt < 3) {
                    return Connecting{c.attempt + 1};
                }
                return Disconnected{};
            },
            [](const Connecting &, const Ok &ok) -> std::optional<State> { return Connected{ok.session}; },
            [](const Connected &, const Drop &) -> std::optional<State> { return Disconnected{}; },
            [](const auto &, const auto &) -> std::optional<State> { return std::nullopt; },
        },
        state, event);
}

std::string describe(const State &state) {
    return std::visit(overloaded{
                          [](const Disconnected &) { return std::string("отключено"); },
                          [](const Connecting &c) { return "подключение, попытка " + std::to_string(c.attempt); },
                          [](const Connected &c) { return "подключено, сессия " + c.session; },
                      },
                      state);
}

int main() {
    State state;
    std::string word;
    while (std::cin >> word) {
        Event event = Connect{};
        if (word == "fail") {
            event = Fail{};
        } else if (word == "ok") {
            std::string session;
            std::cin >> session;
            event = Ok{session};
        } else if (word == "drop") {
            event = Drop{};
        }
        if (std::optional<State> changed = next(state, event)) {
            state = std::move(*changed);
            std::println("{}", describe(state));
        } else {
            std::println("игнор: {}", word);
        }
    }
    return 0;
}`,
      explanation: `
Таблица переходов записана прямо в \`overloaded\`: одна лямбда — одна строка таблицы. \`std::visit\` с двумя \`variant\` выбирает обработчик по паре «состояние + событие», а обобщённая лямбда в конце обрабатывает все недопустимые пары.

Данные живут только в своих состояниях: номер сессии есть лишь у \`Connected\`, и прочитать его в состоянии «отключено» невозможно — такого поля там просто нет. С флагами и полями в одном классе этот инвариант пришлось бы поддерживать вручную.`,
      examples: [
        {
          in: 'connect fail fail ok s7 drop drop\n',
          out: 'подключение, попытка 1\nподключение, попытка 2\nподключение, попытка 3\nподключено, сессия s7\nотключено\nигнор: drop\n',
        },
        {
          in: 'connect fail fail fail ok a\n',
          out: 'подключение, попытка 1\nподключение, попытка 2\nподключение, попытка 3\nотключено\nигнор: ok\n',
        },
      ],
      hidden: [
        { in: '', name: 'Без событий' },
        { in: 'fail\ndrop\n', name: 'События в начальном состоянии' },
        { in: 'connect\nconnect\n', name: 'Повторное подключение' },
        { in: 'connect\nok x\nconnect\nfail\n', name: 'События в подключённом состоянии' },
        { in: 'connect ok 1 drop connect ok 2\n', name: 'Переподключение' },
        { in: 'ok z\n', name: 'Ok без подключения' },
        { in: 'connect fail ok abc drop\n', name: 'Успех со второй попытки' },
        { in: 'connect fail fail fail connect fail fail fail\n', name: 'Два исчерпания попыток' },
      ],
    },
  ],
};
