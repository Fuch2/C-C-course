const PERSON = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

class Person {
public:
    Person(const std::string &first, const std::string &last)
        : first_(first), last_(last), full_(first_ + " " + last_) {}

    const std::string &full() const {
        return full_;
    }

private:
${
  fixed
    ? `    std::string first_;
    std::string last_;
    std::string full_;`
    : `    std::string full_;
    std::string first_;
    std::string last_;`
}
};

int main() {
    std::string first, last;
    while (std::cin >> first >> last) {
        const Person p(first, last);
        std::println("полное имя: {}", p.full());
    }
    return 0;
}`;

export default {
  id: 'lifetime-construction-destruction',
  title: 'Порядок конструирования и разрушения',
  description:
    'Как конструктор собирает объект по частям: базовые классы, поля в порядке объявления, тело; разрушение в обратном порядке; список инициализации не меняет порядок и ловушка -Wreorder; исключение в конструкторе — деструктор не вызывается, построенные части разрушаются; почему ресурсы оборачивают в поля-владельцы.',
  moduleId: 'cpp-lifetime',
  order: 3,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['lifetime-scope-lifetime'],
  objectives: [
    'Предсказывать порядок создания и разрушения баз и полей',
    'Писать список инициализации в порядке объявления полей',
    'Понимать, что происходит при исключении в конструкторе',
    'Разбирать частично построенный объект в правильном порядке',
  ],
  tags: ['C++23', 'Время жизни', 'Конструкторы', 'Деструкторы', 'Исключения'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'В каком порядке строятся части объекта?',
      options: [
        'Базы, поля в порядке объявления, тело конструктора',
        'Тело конструктора, затем поля',
        'Поля в порядке списка инициализации, затем базы',
        'Порядок не определён',
      ],
      correct: 0,
      explain: 'Деструктор проходит тот же путь в обратную сторону.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct P {
    char c;
    P(char c) : c(c) { std::print("{}", c); }
    ~P() { std::print("{}", c); }
};

struct S {
    P b;
    P a;
    S() : a('a'), b('b') { std::print("!"); }
};

int main() {
    S s;
    return 0;
}`,
      lang: 'cpp',
      answers: ['ba!ab'],
      placeholder: 'Вывод программы',
      explain:
        'Поля строятся в порядке объявления (b, затем a), независимо от списка инициализации, и разрушаются в обратном.',
    },
    {
      q: 'Конструктор бросил исключение. Что происходит?',
      options: [
        'Деструктор объекта не вызывается, уже построенные поля и базы разрушаются',
        'Вызывается деструктор объекта',
        'Ничего не разрушается — утечка неизбежна',
        'Программа завершается',
      ],
      correct: 0,
      explain: 'Объект не считается созданным, но его готовые части убираются автоматически.',
    },
    {
      q: 'Конструктор выделил память через new в теле, а затем вызвал функцию, бросившую исключение. Что с памятью?',
      options: [
        'Утечёт: деструктор не вызовется',
        'Освободится деструктором',
        'Освободится автоматически',
        'Будет освобождена при выходе из main',
      ],
      correct: 0,
      explain: 'Поэтому ресурсы хранят в полях-владельцах: строки, векторы, умные указатели.',
    },
    {
      q: 'Какой флаг предупреждает, что список инициализации расходится с порядком объявления полей?',
      options: ['-Wreorder', '-Wshadow', '-Wconversion', '-Wpedantic'],
      correct: 0,
      explain: 'Он входит в -Wall.',
    },
    {
      q: 'Когда выполняется тело деструктора относительно полей?',
      options: [
        'До разрушения полей — они ещё живы',
        'После разрушения полей',
        'Одновременно',
        'Только если поля пустые',
      ],
      correct: 0,
      explain: 'В теле деструктора можно пользоваться полями.',
    },
    {
      q: 'Класс Derived : public Base содержит поле m. Что разрушается последним?',
      options: ['Base', 'm', 'Тело ~Derived', 'Порядок не определён'],
      correct: 0,
      explain: 'Тело ~Derived, затем поля, затем базы.',
    },
    {
      q: 'Как называется ситуация, когда поле инициализируется значением другого поля, которое ещё не построено, и читается мусор? Ответьте: чтение … поля.',
      answers: ['неинициализированного', 'неинициализированного поля'],
      placeholder: 'Одно слово',
      explain: 'Неопределённое поведение; о нём предупреждает -Wuninitialized.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-construction-destruction-exercise',
      title: 'Компьютер',
      difficulty: 'beginner',
      description: `
Структура \`Part\` хранит название и мощность; конструктор печатает \`+название (W Вт)\`, деструктор — \`-название\`. Класс \`Computer(int psu, int board, int cpu)\` содержит три части, объявленные в таком порядке: \`psu_\` («блок питания»), \`board_\` («плата»), \`cpu_\` («процессор»).

Тело конструктора печатает \`собран, запас N Вт\`, где N — мощность блока питания минус мощности платы и процессора; деструктор печатает \`разбирается\`. Каждая строка ввода — три числа; для каждой создайте компьютер в теле цикла.`,
      constraints: ['Строк не больше 50; мощности от 0 до 2000.'],
      hints: [
        'Тело конструктора выполняется, когда все поля уже построены, — запас считайте из psu_.watts, board_.watts и cpu_.watts.',
        'Ни одной строки «-название» печатать вручную не нужно: деструкторы полей вызовутся сами после тела ~Computer.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

struct Part {
    std::string name;
    int watts;
    Part(std::string n, int w) : name(std::move(n)), watts(w) {
        std::println("+{} ({} Вт)", name, watts);
    }
    ~Part() {
        std::println("-{}", name);
    }
};

class Computer {
public:
    Computer(int psu, int board, int cpu)
        : psu_("блок питания", psu), board_("плата", board), cpu_("процессор", cpu) {
        std::println("собран, запас {} Вт", psu_.watts - board_.watts - cpu_.watts);
    }
    ~Computer() {
        std::println("разбирается");
    }

private:
    Part psu_;
    Part board_;
    Part cpu_;
};

int main() {
    int psu, board, cpu;
    while (std::cin >> psu >> board >> cpu) {
        const Computer pc(psu, board, cpu);
    }
    return 0;
}`,
      explanation: `
Поля строятся в порядке объявления, а тело конструктора выполняется последним и уже может читать их. Разборка зеркальна: сначала тело деструктора, затем поля от последнего к первому. Компьютер в теле цикла живёт одну итерацию — к следующей строке ввода он полностью разобран.`,
      examples: [
        {
          in: '500 50 120\n',
          out: '+блок питания (500 Вт)\n+плата (50 Вт)\n+процессор (120 Вт)\nсобран, запас 330 Вт\nразбирается\n-процессор\n-плата\n-блок питания\n',
        },
        { in: '', out: '' },
      ],
      hidden: [
        { in: '100 50 80\n', name: 'Отрицательный запас' },
        { in: '0 0 0\n', name: 'Нули' },
        { in: '650 40 65\n750 60 170\n', name: 'Два компьютера' },
        { in: '2000 2000 2000\n', name: 'Предельные мощности' },
        { in: '300 30 270\n', name: 'Нулевой запас' },
        { in: '450 35 65\n450 35 65\n450 35 65\n', name: 'Три одинаковых' },
        { in: '1000 0 999\n', name: 'Почти без запаса' },
        { in: '550\n45\n105\n', name: 'Числа на разных строках' },
      ],
    },
    {
      title: 'Пара ресурсов',
      description: `
Структура \`Resource\` открывается по имени: если имя начинается с \`!\`, конструктор бросает \`std::runtime_error("не открыть имя")\`, иначе печатает \`+имя\`. Деструктор печатает \`-имя\`.

Класс \`Pair(a, b)\` содержит поля \`first_\` и \`second_\` типа \`Resource\`; тело конструктора печатает \`пара готова\`, деструктор — \`пара закрыта\`. Для каждой строки ввода \`a b\` создайте пару в блоке \`try\`; при исключении напечатайте \`ошибка: текст\`.`,
      constraints: ['Строк не больше 50; имена — слова без пробелов.'],
      hints: [
        'Ничего не очищайте вручную: построенное поле разрушится само, когда исключение покинет конструктор.',
        'Ловите по константной ссылке: catch (const std::exception &e) и печатайте e.what().',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <stdexcept>
#include <string>

struct Resource {
    std::string name;
    explicit Resource(const std::string &n) : name(n) {
        if (n.starts_with('!')) {
            throw std::runtime_error("не открыть " + n);
        }
        std::println("+{}", name);
    }
    ~Resource() {
        std::println("-{}", name);
    }
};

class Pair {
public:
    Pair(const std::string &a, const std::string &b) : first_(a), second_(b) {
        std::println("пара готова");
    }
    ~Pair() {
        std::println("пара закрыта");
    }

private:
    Resource first_;
    Resource second_;
};

int main() {
    std::string a, b;
    while (std::cin >> a >> b) {
        try {
            const Pair p(a, b);
        } catch (const std::exception &e) {
            std::println("ошибка: {}", e.what());
        }
    }
    return 0;
}`,
      explanation: `
Если падает второй ресурс, первый уже построен — и разрушается автоматически до того, как исключение дойдёт до \`catch\`. Если падает первый, разрушать нечего. В обоих случаях \`пара закрыта\` не печатается: деструктор недостроенного объекта не вызывается. Код не содержит ни одной строчки очистки, и всё же ничего не утекает — за это отвечают деструкторы полей.`,
      examples: [
        {
          in: 'a b\na !b\n',
          out: '+a\n+b\nпара готова\nпара закрыта\n-b\n-a\n+a\n-a\nошибка: не открыть !b\n',
        },
        { in: '!x y\n', out: 'ошибка: не открыть !x\n' },
      ],
      hidden: [
        { in: '!a !b\n', name: 'Оба с ошибкой' },
        { in: 'файл сеть\n', name: 'Кириллица' },
        { in: 'a b\nc d\n', name: 'Две удачные пары' },
        { in: 'x !y\nz w\n', name: 'Ошибка, затем успех' },
        { in: 'a! b!\n', name: 'Восклицательный знак не в начале' },
        { in: 'one !two\n!three four\nfive six\n', name: 'Все варианты' },
        { in: 'same same\n', name: 'Одинаковые имена' },
        { in: '', name: 'Пусто' },
      ],
    },
    {
      title: 'Найди ошибку: полное имя',
      bug: true,
      description: `
Для каждой пары слов \`имя фамилия\` программа создаёт \`Person\` и печатает \`полное имя: имя фамилия\`. Вместо этого она печатает мусор, чужие имена или падает. Найдите и исправьте ошибку, не меняя список инициализации.`,
      constraints: ['Пар не больше 50.'],
      hints: [
        'В каком порядке строятся поля Person? Совпадает ли он со списком инициализации?',
        'Поля строятся в порядке объявления. Объявите full_ после first_ и last_.',
      ],
      starter: PERSON(false),
      solution: PERSON(true),
      explanation: `
Список инициализации написан в «правильном» порядке, но строит поля не он, а порядок объявления. \`full_\` объявлено первым и строится, когда \`first_\` и \`last_\` ещё не существуют: выражение \`first_ + " " + last_\` читает неинициализированную память. В зависимости от того, что лежит на стеке, получается мусор, имя из предыдущей итерации или аварийное завершение. Компилятор предупреждал: \`-Wreorder\` и \`-Wuninitialized\`.

Исправление — объявить \`full_\` после полей, от которых оно зависит. Ещё надёжнее — не хранить производное значение, а вычислять его в методе.`,
      examples: [
        { in: 'Ада Лавлейс\n', out: 'полное имя: Ада Лавлейс\n' },
        {
          in: 'Алан Тьюринг\nГрейс Хоппер\n',
          out: 'полное имя: Алан Тьюринг\nполное имя: Грейс Хоппер\n',
        },
      ],
      hidden: [
        'A B\n',
        'Бьёрн Страуструп\n',
        'Деннис Ритчи\nКен Томпсон\nБрайан Керниган\n',
        'Очень-длинное-имя-которое-не-поместится Очень-длинная-фамилия-которая-тоже\n',
        'x y\nx y\n',
        'Линус Торвальдс\n',
        'Маргарет Гамильтон\nДжон Бэкус\n',
        'Q W\nE R\nT Y\nU I\n',
      ],
    },
    {
      title: 'Сборка с откатом',
      difficulty: 'advanced',
      description: `
\`Component(name)\` печатает \`+name\` или, если имя начинается с \`!\`, бросает \`std::runtime_error("сбой name")\`; деструктор печатает \`-name\`.

Класс \`Assembly\` принимает вектор имён и создаёт компоненты по порядку в поле \`std::deque<Component> parts_\`. Требования:

- после успешной сборки тело конструктора печатает \`собрано N\`;
- деструктор разбирает компоненты в порядке, **обратном** созданию;
- если очередной компонент не создался, уже созданные разбираются тоже в обратном порядке, а исключение уходит наружу.

Для каждой строки ввода (имена через пробел) создайте \`Assembly\` в блоке \`try\`; при ошибке напечатайте \`ошибка: текст\`.`,
      constraints: ['Строк не больше 30; в строке до 20 имён; строка может быть пустой.'],
      hints: [
        'Деструктор контейнера не обещает порядок разрушения элементов. Разбирайте сами: while (!parts_.empty()) parts_.pop_back();',
        'При исключении в конструкторе деструктор Assembly не вызовется, а поле parts_ разрушится в своём порядке. Поймайте исключение внутри конструктора, разберите детали в обратном порядке и пробросьте его дальше через throw;',
      ],
      solution: String.raw`
#include <deque>
#include <iostream>
#include <print>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

struct Component {
    std::string name;
    explicit Component(const std::string &n) : name(n) {
        if (n.starts_with('!')) {
            throw std::runtime_error("сбой " + n);
        }
        std::println("+{}", name);
    }
    ~Component() {
        std::println("-{}", name);
    }
};

class Assembly {
public:
    explicit Assembly(const std::vector<std::string> &names) {
        try {
            for (const std::string &n : names) {
                parts_.emplace_back(n);
            }
        } catch (...) {
            dismantle();
            throw;
        }
        std::println("собрано {}", parts_.size());
    }

    ~Assembly() {
        dismantle();
    }

private:
    void dismantle() {
        while (!parts_.empty()) {
            parts_.pop_back();
        }
    }

    std::deque<Component> parts_;
};

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::vector<std::string> names;
        std::string name;
        while (in >> name) {
            names.push_back(name);
        }
        try {
            const Assembly assembly(names);
        } catch (const std::exception &e) {
            std::println("ошибка: {}", e.what());
        }
    }
    return 0;
}`,
      explanation: `
Важная деталь: при исключении в конструкторе деструктор \`Assembly\` не вызывается — объект не достроен. Поле \`parts_\` разрушится само, но в порядке, который выберет \`std::deque\`, а не в обратном. Поэтому конструктор ловит исключение, сам разбирает созданные детали от последней к первой и пробрасывает исключение дальше пустым \`throw;\` — с тем же типом и текстом.

Деструктор использует ту же функцию \`dismantle\`, так что порядок одинаков при успехе и при сбое.`,
      examples: [
        {
          in: 'a b c\na !b c\n',
          out: '+a\n+b\n+c\nсобрано 3\n-c\n-b\n-a\n+a\n-a\nошибка: сбой !b\n',
        },
        { in: '\n', out: 'собрано 0\n' },
      ],
      hidden: [
        { in: '!a\n', name: 'Сбой первого' },
        { in: 'x y z !w\n', name: 'Сбой последнего' },
        { in: 'one\n', name: 'Одна деталь' },
        { in: 'a b\n!c\nd e f\n', name: 'Три сборки' },
        { in: '1 2 3 4 5 6 7 8 9 10\n', name: 'Десять деталей' },
        { in: 'p !q !r\n', name: 'Две ошибки подряд' },
        { in: 'мотор колесо руль\n', name: 'Кириллица' },
        { in: '  a   b  \n', name: 'Лишние пробелы' },
      ],
    },
  ],
};
