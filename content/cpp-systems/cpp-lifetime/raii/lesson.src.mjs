const SUMS = (fixed) => String.raw`
#include <charconv>
#include <iostream>
#include <print>
#include <sstream>
#include <stdexcept>
#include <string>
${fixed ? '#include <vector>\n' : ''}
int parse(const std::string &token) {
    int value = 0;
    const char *end = token.data() + token.size();
    const auto [ptr, ec] = std::from_chars(token.data(), end, value);
    if (ec != std::errc() || ptr != end) {
        throw std::invalid_argument("не число " + token);
    }
    return value;
}

long long sum_line(const std::string &line) {
    std::istringstream in(line);
    int n = 0;
    in >> n;
${
  fixed
    ? `    std::vector<int> values(n);
    for (int i = 0; i < n; i++) {
        std::string token;
        in >> token;
        values[i] = parse(token);
    }
    long long sum = 0;
    for (int v : values) {
        sum += v;
    }
    return sum;`
    : `    int *values = new int[n];
    for (int i = 0; i < n; i++) {
        std::string token;
        in >> token;
        values[i] = parse(token);
    }
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += values[i];
    }
    delete[] values;
    return sum;`
}
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        try {
            std::println("сумма {}", sum_line(line));
        } catch (const std::exception &e) {
            std::println("ошибка: {}", e.what());
        }
    }
    return 0;
}`;

export default {
  id: 'lifetime-raii',
  title: 'RAII: ресурс принадлежит объекту',
  description:
    'Ресурсы — память, файлы, соединения, блокировки, потоки — и почему ручное освобождение ломается при раннем выходе и исключениях. Идиома RAII: захват в конструкторе, освобождение в деструкторе; некопируемый владелец; RAII-классы стандартной библиотеки — контейнеры, умные указатели, файловые потоки, scoped_lock, jthread; деструкторы не бросают исключений; объекты, восстанавливающие состояние.',
  moduleId: 'cpp-lifetime',
  order: 4,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-construction-destruction'],
  objectives: [
    'Объяснять, почему ручное освобождение ресурсов ненадёжно',
    'Писать RAII-классы, захватывающие ресурс в конструкторе и освобождающие в деструкторе',
    'Пользоваться RAII-типами стандартной библиотеки',
    'Сохранять корректное состояние программы при исключениях',
  ],
  tags: ['C++23', 'Время жизни', 'RAII', 'Ресурсы', 'Исключения'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что означает RAII?',
      options: [
        'Ресурс захватывается в конструкторе объекта и освобождается в его деструкторе',
        'Ресурсы выделяются только при инициализации программы',
        'Все ресурсы освобождает сборщик мусора',
        'Ресурс освобождают вручную сразу после использования',
      ],
      correct: 0,
      explain: 'Время жизни ресурса совпадает со временем жизни объекта-владельца.',
    },
    {
      q: 'Почему RAII надёжнее ручного освобождения?',
      options: [
        'Деструктор локального объекта вызывается при любом выходе из блока, включая исключения',
        'RAII-объекты быстрее',
        'Компилятор запрещает исключения в таких функциях',
        'Ресурсы освобождаются при завершении программы',
      ],
      correct: 0,
      explain: 'Ранний return, break и исключения не могут обойти деструктор.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Guard {
    ~Guard() { std::print("снято "); }
};

int f(int x) {
    const Guard g;
    if (x > 0) {
        return 1;
    }
    return 2;
}

int main() {
    const int r = f(5);
    std::println("{}", r);
    return 0;
}`,
      lang: 'cpp',
      answers: ['снято 1'],
      placeholder: 'Вывод программы',
      explain:
        'Деструктор вызывается и при раннем return — до того, как управление вернётся в main.',
    },
    {
      q: 'Что не так со строкой std::scoped_lock(m);?',
      options: [
        'Создаётся безымянный временный объект: блокировка снимается сразу на точке с запятой',
        'Ничего, это правильная блокировка',
        'scoped_lock нельзя создавать без шаблонного аргумента',
        'Она не скомпилируется',
      ],
      correct: 0,
      explain: 'RAII-объекту нужно имя, чтобы он жил до конца блока.',
    },
    {
      q: 'Почему владельца ресурса обычно делают некопируемым?',
      options: [
        'Две копии освободили бы один ресурс дважды',
        'Копирование медленнее перемещения',
        'Так требует стандарт',
        'Чтобы его нельзя было передать в функцию',
      ],
      correct: 0,
      explain: 'Копирование владельца должно либо создавать новый ресурс, либо быть запрещено.',
    },
    {
      q: 'Что произойдёт, если исключение покинет деструктор?',
      options: [
        'Вызовется std::terminate',
        'Исключение поймает ближайший catch',
        'Оно будет проигнорировано',
        'Объект не будет уничтожен',
      ],
      correct: 0,
      explain: 'Деструкторы по умолчанию noexcept.',
    },
    {
      q: 'Какие типы стандартной библиотеки являются RAII-владельцами? Выберите все.',
      options: ['std::vector', 'std::ofstream', 'std::lock_guard', 'int *'],
      correct: [0, 1, 2],
      explain: 'Сырой указатель ничем не владеет и ничего не освобождает сам.',
    },
    {
      q: 'Какой тип потока из C++20 сам дожидается завершения потока в деструкторе?',
      answers: ['std::jthread', 'jthread'],
      placeholder: 'Тип',
      explain:
        'std::thread в деструкторе завершает программу, если поток не присоединён; std::jthread присоединяет его сам.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-raii-exercise',
      title: 'Соединения',
      difficulty: 'beginner',
      description: `
Класс \`Connection\` — RAII-владелец соединения: конструктор печатает \`открыто имя\` и увеличивает глобальный счётчик открытых соединений, деструктор печатает \`закрыто имя\` и уменьшает его. Копирование запрещено.

Каждая строка ввода — имя соединения и команды. Функция \`handle(line)\` открывает соединение и выполняет команды по порядку:

- \`ok\` — напечатать \`запрос выполнен\`;
- \`return\` — напечатать \`ранний выход\` и выйти из функции;
- \`fail\` — бросить \`std::runtime_error("сбой запроса")\`.

\`main\` вызывает \`handle\` для каждой строки и ловит исключения, печатая \`ошибка: текст\`. В конце напечатайте \`открытых: N\`.`,
      constraints: ['Строк не больше 50, команд в строке не больше 20.'],
      hints: [
        'В handle нет ни одной строки закрытия: соединение — локальный объект, и его деструктор отработает при любом выходе.',
        'Деструктор Connection выполняется до того, как исключение попадёт в catch в main, поэтому «закрыто» печатается раньше «ошибка».',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>

int open_connections = 0;

class Connection {
public:
    explicit Connection(std::string name) : name_(std::move(name)) {
        ++open_connections;
        std::println("открыто {}", name_);
    }
    ~Connection() {
        --open_connections;
        std::println("закрыто {}", name_);
    }
    Connection(const Connection &) = delete;
    Connection &operator=(const Connection &) = delete;

private:
    std::string name_;
};

void handle(const std::string &line) {
    std::istringstream in(line);
    std::string name;
    if (!(in >> name)) {
        return;
    }
    const Connection connection(name);
    std::string command;
    while (in >> command) {
        if (command == "ok") {
            std::println("запрос выполнен");
        } else if (command == "return") {
            std::println("ранний выход");
            return;
        } else {
            throw std::runtime_error("сбой запроса");
        }
    }
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        try {
            handle(line);
        } catch (const std::exception &e) {
            std::println("ошибка: {}", e.what());
        }
    }
    std::println("открытых: {}", open_connections);
    return 0;
}`,
      explanation: `
У функции три пути выхода — конец команд, \`return\` и исключение, — и на каждом соединение закрывается, хотя в коде нет ни одного вызова «закрыть». Деструктор локального объекта вызывается при раскрутке стека раньше, чем исключение дойдёт до обработчика, поэтому \`закрыто\` печатается перед \`ошибка\`. Счётчик в конце всегда равен нулю.`,
      examples: [
        {
          in: 'db ok ok\napi ok fail ok\ncache return ok\n',
          out: 'открыто db\nзапрос выполнен\nзапрос выполнен\nзакрыто db\nоткрыто api\nзапрос выполнен\nзакрыто api\nошибка: сбой запроса\nоткрыто cache\nранний выход\nзакрыто cache\nоткрытых: 0\n',
        },
        { in: 'x\n', out: 'открыто x\nзакрыто x\nоткрытых: 0\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'a fail\n', name: 'Сразу сбой' },
        { in: 'a return\n', name: 'Сразу выход' },
        { in: 'a ok\nb ok\nc ok\n', name: 'Три соединения' },
        { in: '\nz ok\n', name: 'Пустая строка' },
        { in: 's ok ok ok ok ok\n', name: 'Много запросов' },
        { in: 'p fail\nq return\nr ok\n', name: 'Все пути выхода' },
        { in: 'база ok fail\n', name: 'Кириллица' },
      ],
    },
    {
      title: 'Отступы',
      description: `
Глобальная переменная \`depth\` задаёт текущий отступ (по два пробела на уровень). Класс \`Indent\` — RAII-объект: конструктор увеличивает \`depth\`, деструктор восстанавливает **прежнее** значение.

Ввод — строки-команды:

- \`begin имя\` — напечатать \`имя:\` с текущим отступом и обработать следующие строки как вложенный раздел (на уровень глубже) до парной команды \`end\`;
- \`item текст\` — напечатать текст с текущим отступом;
- \`end\` — закрыть раздел.

Если ввод кончился внутри разделов, они закрываются сами. Решите рекурсией: раздел — вызов функции с локальным объектом \`Indent\`.`,
      constraints: [
        'Строк не больше 200; глубина не больше 50; end не встречается на верхнем уровне.',
      ],
      hints: [
        "Отступ: std::string(depth * 2, ' ').",
        'void section(std::istream &in) { const Indent indent; while (читается команда) { if (end) return; … if (begin) { печать; section(in); } } } — Indent восстановит depth при любом выходе.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

int depth = 0;

class Indent {
public:
    Indent() : saved_(depth) {
        ++depth;
    }
    ~Indent() {
        depth = saved_;
    }
    Indent(const Indent &) = delete;
    Indent &operator=(const Indent &) = delete;

private:
    int saved_;
};

void print_line(const std::string &text) {
    std::println("{}{}", std::string(depth * 2, ' '), text);
}

void process(std::istream &in, bool nested);

void section(std::istream &in) {
    const Indent indent;
    process(in, true);
}

void process(std::istream &in, bool nested) {
    std::string command;
    while (in >> command) {
        if (command == "end" && nested) {
            return;
        }
        std::string text;
        in >> text;
        if (command == "begin") {
            print_line(text + ":");
            section(in);
        } else {
            print_line(text);
        }
    }
}

int main() {
    process(std::cin, false);
    return 0;
}`,
      explanation: `
\`Indent\` запоминает прежнее значение и восстанавливает его в деструкторе, поэтому каждый вложенный раздел возвращает отступ ровно туда, где он был, — и при \`end\`, и при окончании ввода, когда разделы закрываются раскруткой рекурсии. Так же работают «сохранители» состояния в библиотеках: восстановление флагов потока, временная смена рабочего каталога, временное переключение режима.

Восстанавливать **сохранённое** значение надёжнее, чем уменьшать на единицу: состояние вернётся правильным, даже если кто-то внутри изменил его не по правилам.`,
      examples: [
        {
          in: 'begin План\nitem чай\nbegin Покупки\nitem хлеб\nend\nitem звонок\nend\nitem конец\n',
          out: 'План:\n  чай\n  Покупки:\n    хлеб\n  звонок\nконец\n',
        },
        { in: 'begin a\nbegin b\nitem c\n', out: 'a:\n  b:\n    c\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'item один\nitem два\n', name: 'Без разделов' },
        { in: 'begin пустой\nend\nitem после\n', name: 'Пустой раздел' },
        {
          in: 'begin 1\nbegin 2\nbegin 3\nbegin 4\nitem дно\nend\nend\nend\nend\nitem верх\n',
          name: 'Глубокая вложенность',
        },
        { in: 'begin a\nitem x\nend\nbegin b\nitem y\nend\n', name: 'Соседние разделы' },
        { in: 'begin a\nbegin b\nend\nitem в_a\n', name: 'Возврат на уровень' },
        { in: 'begin незакрытый\nitem текст\n', name: 'Незакрытый раздел' },
        { in: 'item x\nbegin s\nitem y\nbegin t\nend\nitem z\nend\nitem w\n', name: 'Смешанный' },
      ],
    },
    {
      title: 'Найди ошибку: утечка при ошибке разбора',
      bug: true,
      description: `
Каждая строка ввода — число \`n\` и \`n\` целых чисел. Программа печатает \`сумма S\` или, если среди чисел встретилось нечисло, \`ошибка: не число X\`.

Вывод правильный, но LeakSanitizer при завершении сообщает об утечке памяти, и проверка отклоняет решение. Найдите и исправьте причину.`,
      constraints: ['Строк не больше 50; 0 ≤ n ≤ 100; числа помещаются в int.'],
      hints: [
        'Какая строка sum_line не выполняется, если parse бросает исключение?',
        'Замените new int[n] на std::vector<int> values(n): вектор освободит память при любом выходе из функции.',
      ],
      starter: SUMS(false),
      solution: SUMS(true),
      explanation: `
\`parse\` бросает исключение из середины цикла, и управление уходит в \`catch\` в \`main\`, минуя \`delete[] values\`. Память, выделенная \`new int[n]\`, больше никому не принадлежит — утечка на каждую строку с ошибкой.

\`std::vector<int>\` — RAII-владелец памяти: его деструктор вызывается при раскрутке стека, и освобождение нельзя пропустить. Заодно исчезла ручная работа с размером.`,
      examples: [
        { in: '3 1 2 3\n2 5 x\n', out: 'сумма 6\nошибка: не число x\n' },
        { in: '0\n', out: 'сумма 0\n' },
      ],
      hidden: [
        '1 abc\n',
        '2 1 2\n2 1 2x\n',
        '4 -1 -2 -3 -4\n',
        '3 1 2 три\n3 4 5 6\n',
        '5 2147483647 1 1 1 1\n',
        '2 +5 5\n',
        '1 0\n1 -0\n1 --1\n',
        '3 10 20 30\n',
      ],
    },
    {
      title: 'Стек состояний рисования',
      difficulty: 'advanced',
      description: `
Графические библиотеки хранят текущее состояние рисования и позволяют сохранить его и потом восстановить. Глобальное состояние: цвет (сначала \`чёрный\`) и толщина (сначала \`1\`). RAII-класс \`StateSaver\` запоминает состояние в конструкторе и восстанавливает в деструкторе.

Команды:

- \`color C\`, \`width W\` — изменить текущее состояние;
- \`draw имя\` — напечатать \`имя: цвет C, толщина W\`;
- \`save\` — начать вложенный блок (рекурсивный вызов с локальным \`StateSaver\`), \`restore\` — закончить его;
- \`error\` — бросить \`std::runtime_error("ошибка рисования")\`.

Главный цикл выполняет команды верхнего уровня по одной и ловит исключения, печатая их текст. После ошибки состояние должно оказаться таким, каким было на верхнем уровне перед входом во все прерванные блоки, а обработка продолжается со следующей команды на верхнем уровне. Команда \`restore\` на верхнем уровне игнорируется.`,
      constraints: [
        'Команд не больше 200; глубина вложенности не больше 50; C — слово, 1 ≤ W ≤ 100.',
      ],
      hints: [
        'void block(std::istream &in) { const StateSaver saver; while (in >> cmd) { if (cmd == "restore") return; execute(cmd, in); } } — а execute для save вызывает block.',
        'Ловите исключение только в main. Раскрутка стека уничтожит все StateSaver прерванных блоков, от внутреннего к внешнему, и каждый вернёт своё сохранённое состояние.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <stdexcept>
#include <string>

struct State {
    std::string color = "чёрный";
    int width = 1;
};

State current;

class StateSaver {
public:
    StateSaver() : saved_(current) {}
    ~StateSaver() {
        current = saved_;
    }
    StateSaver(const StateSaver &) = delete;
    StateSaver &operator=(const StateSaver &) = delete;

private:
    State saved_;
};

void execute(const std::string &command, std::istream &in);

void block(std::istream &in) {
    const StateSaver saver;
    std::string command;
    while (in >> command) {
        if (command == "restore") {
            return;
        }
        execute(command, in);
    }
}

void execute(const std::string &command, std::istream &in) {
    if (command == "color") {
        in >> current.color;
    } else if (command == "width") {
        in >> current.width;
    } else if (command == "draw") {
        std::string name;
        in >> name;
        std::println("{}: цвет {}, толщина {}", name, current.color, current.width);
    } else if (command == "save") {
        block(in);
    } else if (command == "error") {
        throw std::runtime_error("ошибка рисования");
    }
}

int main() {
    std::string command;
    while (std::cin >> command) {
        try {
            execute(command, std::cin);
        } catch (const std::exception &e) {
            std::println("{}", e.what());
        }
    }
    return 0;
}`,
      explanation: `
Исключение из глубины вложенных блоков раскручивает стек: каждый прерванный \`block\` уничтожает свой \`StateSaver\`, и состояние возвращается по цепочке до верхнего уровня. Ни одна функция не ловит исключение ради очистки — восстановление встроено во время жизни объектов.

Без RAII каждому \`save\` понадобился бы \`try\`/\`catch\` с восстановлением и повторным пробросом, и пропуск хотя бы одного оставил бы программу в чужом цвете.`,
      examples: [
        {
          in: 'draw a\nsave\ncolor красный\nwidth 3\ndraw b\nrestore\ndraw c\n',
          out: 'a: цвет чёрный, толщина 1\nb: цвет красный, толщина 3\nc: цвет чёрный, толщина 1\n',
        },
        {
          in: 'color синий\nsave\nwidth 5\nsave\ncolor зелёный\nerror\ndraw d\n',
          out: 'ошибка рисования\nd: цвет синий, толщина 1\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'draw x\n', name: 'Начальное состояние' },
        { in: 'restore\ncolor белый\ndraw y\n', name: 'restore на верхнем уровне' },
        {
          in: 'save\ncolor a\nsave\ncolor b\ndraw in\nrestore\ndraw mid\nrestore\ndraw out\n',
          name: 'Вложенные сохранения',
        },
        { in: 'save\nwidth 7\ndraw z\n', name: 'Незакрытый блок' },
        { in: 'width 2\nerror\ndraw after\n', name: 'Ошибка на верхнем уровне' },
        {
          in: 'save\ncolor red\nerror\ndraw a\nrestore\ndraw b\n',
          name: 'Продолжение после ошибки',
        },
        {
          in: 'save\nsave\nsave\nwidth 100\nerror\nwidth 4\ndraw q\n',
          name: 'Ошибка на глубине три',
        },
      ],
    },
  ],
};
