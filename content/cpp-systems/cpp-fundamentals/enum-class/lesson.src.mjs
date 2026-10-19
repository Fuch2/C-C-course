const LEVELS = (fixed) => String.raw`
#include <iostream>
#include <string>

enum class Level { Info, Warning, Error };

std::string label(Level level) {
    std::string text;
    switch (level) {
    case Level::Info:
        text = "[INFO]";${fixed ? '\n        break;' : ''}
    case Level::Warning:
        text = "[WARN]";
        break;
    case Level::Error:
        text = "[ERROR]";
        break;
    }
    return text;
}

int main() {
    std::string word, message;
    while (std::cin >> word && std::getline(std::cin >> std::ws, message)) {
        Level level = word == "info" ? Level::Info : word == "warning" ? Level::Warning : Level::Error;
        std::cout << label(level) << ' ' << message << '\n';
    }
    return 0;
}`;

export default {
  id: 'cpp20-enum-class',
  title: 'Перечисления enum class',
  description:
    'Недостатки перечислений C; enum class: область видимости, нет неявного преобразования в int, разные перечисления несравнимы; базовый тип; switch по перечислению и предупреждения компилятора; перечисления вместо логических флагов; конечные автоматы.',
  moduleId: 'cpp-fundamentals',
  order: 14,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-default-arguments'],
  objectives: [
    'Объявлять и использовать enum class',
    'Явно переводить перечисление в число и обратно',
    'Обрабатывать перечисления в switch без проваливания',
    'Описывать состояния программы перечислением',
  ],
  tags: ['C++', 'enum class', 'switch', 'Конечный автомат'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

enum class Size { Small = 1, Medium, Large = 10, Huge };

int main() {
    std::cout << static_cast<int>(Size::Medium) << ' ' << static_cast<int>(Size::Huge) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['2 11'],
      placeholder: 'Вывод программы',
      explain: 'Значение без инициализатора на единицу больше предыдущего: Medium = 2, Huge = 11.',
    },
    {
      q: 'Какие строки не скомпилируются, если объявлено enum class Color { Red, Green };?',
      options: [
        'int x = Color::Red;',
        'Color c = Red;',
        'Color c = Color::Green;',
        'int y = static_cast<int>(Color::Green);',
      ],
      correct: [0, 1],
      explain:
        'Неявного преобразования в int нет, а имена значений живут внутри перечисления — без Color:: их не видно.',
    },
    {
      q: 'Чем enum class лучше перечисления в стиле C?',
      options: [
        'Имена значений не конфликтуют с другими именами',
        'Значения не превращаются в int неявно',
        'Значения разных перечислений нельзя сравнить по ошибке',
        'enum class занимает меньше памяти в любом случае',
      ],
      correct: [0, 1, 2],
      explain: 'Размер по умолчанию такой же — int. Его можно уменьшить, явно задав базовый тип.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

enum class Op { Add, Sub, Mul };

int apply(Op op, int a, int b) {
    switch (op) {
    case Op::Add:
        return a + b;
    case Op::Sub:
        return a - b;
    case Op::Mul:
        return a * b;
    }
    return 0;
}

int main() {
    std::cout << apply(Op::Mul, apply(Op::Add, 2, 3), apply(Op::Sub, 10, 6)) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['20'],
      placeholder: 'Вывод программы',
      explain: '(2 + 3) · (10 − 6) = 20. return в каждой ветке исключает проваливание.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

enum class Mode { A, B, C };

int main() {
    int score = 0;
    Mode m = Mode::A;
    switch (m) {
    case Mode::A:
        score += 1;
    case Mode::B:
        score += 10;
        break;
    case Mode::C:
        score += 100;
        break;
    }
    std::cout << score << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['11'],
      placeholder: 'Вывод программы',
      explain:
        'В ветке A нет break: выполнение проваливается в ветку B и останавливается на её break. 1 + 10 = 11.',
    },
    {
      q: 'Как задать, что перечисление занимает один байт?',
      options: [
        'enum class Flag : std::uint8_t { … };',
        'enum class Flag(1) { … };',
        'short enum class Flag { … };',
        'Нельзя',
      ],
      correct: 0,
      explain: 'После имени через двоеточие указывают базовый целочисленный тип.',
    },
    {
      q: 'Почему функция-переключатель по enum class часто заканчивается return после switch?',
      options: [
        'Перечислению можно силой присвоить число вне списка значений, и функция обязана что-то вернуть и тогда',
        'Иначе switch не скомпилируется',
        'Чтобы switch выполнился дважды',
        'Это не нужно',
      ],
      correct: 0,
      explain:
        'Компилятор не может доказать, что значение всегда одно из перечисленных, и без return предупреждает о возможном выходе из функции без значения.',
    },
    {
      q: 'Какой вызов понятнее при чтении кода?',
      options: [
        'connect(host, Security::Tls, Retry::Never)',
        'connect(host, true, false)',
        'connect(host, 1, 0)',
        'Все одинаково понятны',
      ],
      correct: 0,
      explain:
        'Перечисления называют смысл аргументов, а логические и числовые флаги требуют смотреть объявление.',
    },
  ],
  exercises: [
    {
      title: 'Светофор',
      difficulty: 'beginner',
      description: `
Светофор переключается по кругу: красный → зелёный → жёлтый → красный. Каждая строка ввода — начальный цвет (\`red\`, \`green\` или \`yellow\`) и число переключений \`n\`. Напечатайте через пробел \`n + 1\` цветов по-русски: начальный и все следующие.

Опишите цвет перечислением \`enum class Light\` и напишите функции \`Light next(Light)\` и \`std::string name(Light)\`.`,
      constraints: ['0 ≤ n ≤ 20; строк не больше 20.'],
      hints: [
        'enum class Light { Red, Green, Yellow }; — порядок совпадает с порядком переключения, поэтому next можно написать через static_cast и % 3 или через switch.',
        'name возвращает "красный", "зелёный" или "жёлтый" — switch с return в каждой ветке.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

enum class Light { Red, Green, Yellow };

Light next(Light light) {
    switch (light) {
    case Light::Red:
        return Light::Green;
    case Light::Green:
        return Light::Yellow;
    case Light::Yellow:
        return Light::Red;
    }
    return Light::Red;
}

std::string name(Light light) {
    switch (light) {
    case Light::Red:
        return "красный";
    case Light::Green:
        return "зелёный";
    case Light::Yellow:
        return "жёлтый";
    }
    return "?";
}

int main() {
    std::string start;
    int n;
    while (std::cin >> start >> n) {
        Light light = start == "red" ? Light::Red : start == "green" ? Light::Green : Light::Yellow;
        for (int i = 0; i <= n; i++) {
            std::cout << name(light) << (i < n ? ' ' : '\n');
            light = next(light);
        }
    }
    return 0;
}`,
      explanation: `
Состояние светофора — значение перечисления, а правила переключения собраны в одной функции \`next\`. \`switch\` с \`return\` в каждой ветке не может провалиться в следующую, а если в перечисление добавят новый цвет, компилятор с \`-Wall\` укажет на функции, где его забыли обработать.

Можно было бы написать \`next\` через арифметику — \`static_cast<Light>((static_cast<int>(light) + 1) % 3)\`, — но такая версия молча зависит от порядка значений в перечислении. \`switch\` описывает правило явно.`,
      examples: [
        { in: 'red 3\n', out: 'красный зелёный жёлтый красный\n' },
        { in: 'yellow 0\ngreen 1\n', out: 'жёлтый\nзелёный жёлтый\n' },
      ],
      hidden: [
        'red 0\n',
        'green 0\n',
        'yellow 1\n',
        'red 6\n',
        'green 4\n',
        'yellow 5\n',
        'red 1\nred 2\n',
        'green 20\n',
      ],
    },
    {
      title: 'Робот',
      description: `
Робот стоит в точке \`(0, 0)\` и смотрит на север. До конца ввода идут команды: \`L\` — повернуть налево, \`R\` — направо, \`F k\` — пройти \`k\` шагов вперёд. Север — увеличение \`y\`, восток — увеличение \`x\`.

Напечатайте итоговые координаты и направление по-русски: \`x y направление\`. Направление храните в \`enum class Direction\`.`,
      constraints: ['Команд не больше 1000; 0 ≤ k ≤ 10⁶.'],
      hints: [
        'enum class Direction { North, East, South, West }; поворот направо — следующее значение по кругу, налево — предыдущее: (d + 3) % 4.',
        'Шаги по направлению: switch по Direction меняет x или y. Координаты до 10⁹ — long long.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

enum class Direction { North, East, South, West };

Direction turn(Direction d, int quarter) {
    return static_cast<Direction>((static_cast<int>(d) + quarter) % 4);
}

std::string name(Direction d) {
    switch (d) {
    case Direction::North:
        return "север";
    case Direction::East:
        return "восток";
    case Direction::South:
        return "юг";
    case Direction::West:
        return "запад";
    }
    return "?";
}

int main() {
    long long x = 0, y = 0;
    Direction d = Direction::North;
    std::string command;
    while (std::cin >> command) {
        if (command == "L") {
            d = turn(d, 3);
        } else if (command == "R") {
            d = turn(d, 1);
        } else if (command == "F") {
            long long k;
            std::cin >> k;
            switch (d) {
            case Direction::North:
                y += k;
                break;
            case Direction::East:
                x += k;
                break;
            case Direction::South:
                y -= k;
                break;
            case Direction::West:
                x -= k;
                break;
            }
        }
    }
    std::cout << x << ' ' << y << ' ' << name(d) << '\n';
    return 0;
}`,
      explanation: `
Направление — перечисление из четырёх значений по часовой стрелке, поэтому поворот направо — следующее значение, налево — предыдущее. «Предыдущее по кругу» записано как \`+ 3\`, а не \`− 1\`: остаток от деления отрицательного числа в C++ отрицателен, и \`(0 − 1) % 4\` дал бы −1 — значение вне перечисления.

Преобразования между перечислением и числом собраны в одной функции \`turn\` и записаны явно через \`static_cast\` — такие места сразу видны при чтении. Движение — \`switch\` с \`break\` в каждой ветке.`,
      examples: [
        { in: 'F 5\nR\nF 3\n', out: '3 5 восток\n' },
        { in: 'L\nL\nF 2\n', out: '0 -2 юг\n' },
      ],
      hidden: [
        { in: '', name: 'Без команд' },
        { in: 'R\nR\nR\nR\n', name: 'Полный оборот' },
        { in: 'L\n', name: 'Налево с севера' },
        { in: 'F 1000000\nR\nF 1000000\nR\nF 1000000\n', name: 'Большие шаги' },
        { in: 'L\nF 7\nL\nF 3\n', name: 'Запад и юг' },
        { in: 'F 0\nR\nF 0\n', name: 'Нулевые шаги' },
        { in: 'R\nF 1\nL\nF 1\nR\nF 1\nL\nF 1\n', name: 'Лесенка' },
        { in: 'L\nL\nL\nF 4\n', name: 'Три поворота налево' },
      ],
    },
    {
      title: 'Найди ошибку: уровни журнала',
      bug: true,
      description: `
Каждая строка ввода — уровень (\`info\`, \`warning\` или \`error\`) и сообщение. Программа печатает метку уровня и сообщение: \`[INFO] текст\`, \`[WARN] текст\`, \`[ERROR] текст\`.

Сообщения уровня \`info\` получают неверную метку. Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 30; сообщения до 100 символов.'],
      hints: [
        'Что происходит в switch после выполнения ветки case Level::Info, если в ней нет break?',
        'Без break выполнение «проваливается» в следующую ветку, и text перезаписывается на "[WARN]". Добавьте break или возвращайте строку через return прямо из ветки.',
      ],
      starter: LEVELS(false),
      solution: LEVELS(true),
      explanation: `
Ветки \`switch\` — это метки, а не отдельные блоки: после выполнения ветки управление переходит к следующей строке, то есть к коду следующей ветки, пока не встретится \`break\` или \`return\`. В ветке \`Info\` нет \`break\`, поэтому \`text\` сначала получает \`"[INFO]"\`, а затем — \`"[WARN]"\`.

Компилятор с \`-Wextra\` предупреждает о таком проваливании (\`-Wimplicit-fallthrough\`). Если проваливание нужно намеренно, его отмечают атрибутом \`[[fallthrough]];\`. Надёжнее всего функции-переключатели писать с \`return\` в каждой ветке — тогда проваливание невозможно.`,
      examples: [
        { in: 'info started\nerror disk full\n', out: '[INFO] started\n[ERROR] disk full\n' },
        { in: 'warning low memory\n', out: '[WARN] low memory\n' },
      ],
      hidden: [
        'info a\n',
        'info one two three\n',
        'warning x\ninfo y\n',
        'error z\ninfo w\n',
        'info info\n',
        'error e\nwarning w\ninfo i\n',
        'info Сообщение по-русски\n',
        'warning  spaced\n',
      ],
    },
    {
      title: 'Автомат для чисел',
      difficulty: 'advanced',
      description: `
До конца ввода идут слова. Для каждого напечатайте \`да\`, если это корректная запись числа, иначе \`нет\`. Корректная запись:

- необязательный знак \`+\` или \`-\`;
- одна или больше цифр;
- необязательная дробная часть: точка и одна или больше цифр;
- необязательный порядок: \`e\` или \`E\`, необязательный знак и одна или больше цифр.

Например, \`-12\`, \`3.14\`, \`6.02e23\`, \`1E-9\` — корректны; \`.5\`, \`5.\`, \`1e\`, \`+-1\`, \`1.2.3\` — нет.

Напишите **конечный автомат**: состояние — \`enum class State\`, функция переходов получает состояние и символ и возвращает новое состояние.`,
      constraints: ['Слов не больше 100, длиной до 50 символов.'],
      hints: [
        'Состояния: Start, Sign, Integer, Dot, Fraction, Exp, ExpSign, ExpDigits, Error. Например, из Start цифра ведёт в Integer, знак — в Sign, всё остальное — в Error.',
        'Функция State step(State s, char c) — switch по s. Из Error никуда не уйти. После последнего символа слово корректно, если состояние — Integer, Fraction или ExpDigits.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

enum class State { Start, Sign, Integer, Dot, Fraction, Exp, ExpSign, ExpDigits, Error };

bool is_digit(char c) {
    return c >= '0' && c <= '9';
}

State step(State s, char c) {
    switch (s) {
    case State::Start:
        return is_digit(c) ? State::Integer : (c == '+' || c == '-') ? State::Sign : State::Error;
    case State::Sign:
        return is_digit(c) ? State::Integer : State::Error;
    case State::Integer:
        return is_digit(c)               ? State::Integer
               : c == '.'                ? State::Dot
               : (c == 'e' || c == 'E') ? State::Exp
                                         : State::Error;
    case State::Dot:
        return is_digit(c) ? State::Fraction : State::Error;
    case State::Fraction:
        return is_digit(c) ? State::Fraction : (c == 'e' || c == 'E') ? State::Exp : State::Error;
    case State::Exp:
        return is_digit(c) ? State::ExpDigits : (c == '+' || c == '-') ? State::ExpSign : State::Error;
    case State::ExpSign:
    case State::ExpDigits:
        return is_digit(c) ? State::ExpDigits : State::Error;
    case State::Error:
        return State::Error;
    }
    return State::Error;
}

bool is_number(const std::string &word) {
    State s = State::Start;
    for (char c : word) {
        s = step(s, c);
    }
    return s == State::Integer || s == State::Fraction || s == State::ExpDigits;
}

int main() {
    std::string word;
    while (std::cin >> word) {
        std::cout << (is_number(word) ? "да" : "нет") << '\n';
    }
    return 0;
}`,
      explanation: `
Автомат читает слово по одному символу и помнит только своё состояние — что уже прочитано: знак, целая часть, точка, дробная часть, порядок. Каждое правило формата — одна строка функции \`step\`: «после точки обязательна цифра», «после e — знак или цифра». Слово корректно, если после последнего символа автомат в **принимающем** состоянии: в целой части, дробной части или цифрах порядка. Остановка в \`Dot\` (\`5.\`) или \`Exp\` (\`1e\`) означает незаконченную запись.

Две ветки \`case State::ExpSign:\` и \`case State::ExpDigits:\` стоят подряд намеренно: у этих состояний одинаковые переходы, а пустая ветка без кода — законный и понятный способ сказать об этом. Так устроены лексические анализаторы компиляторов и разбор чисел в \`strtod\`.`,
      examples: [
        { in: '-12 3.14 6.02e23 1E-9\n', out: 'да\nда\nда\nда\n' },
        { in: '.5 5. 1e +-1 1.2.3\n', out: 'нет\nнет\nнет\nнет\nнет\n' },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '+7 -0\n', name: 'Знаки' },
        { in: '1e+5 1e-5 1e5\n', name: 'Порядки' },
        { in: 'e5 E\n', name: 'Только порядок' },
        { in: '1.5e 1.5e+\n', name: 'Незаконченный порядок' },
        { in: '12a a12 1_000\n', name: 'Посторонние символы' },
        { in: '3.0e10 0.000001\n', name: 'Длинные' },
        { in: '- + 1.e5\n', name: 'Только знак' },
      ],
    },
  ],
};
