const FIRST_WORD = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <sstream>
#include <string>
#include <vector>

std::vector<std::string> split(const std::string &line) {
    std::istringstream in(line);
    std::vector<std::string> words;
    std::string w;
    while (in >> w) {
        words.push_back(w);
    }
    return words;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
${
  fixed
    ? `        const std::vector<std::string> words = split(line);
        if (words.empty()) {
            std::println("пустая строка");
            continue;
        }
        std::println("первое: {}, слов: {}", words.front(), words.size());`
    : `        if (split(line).empty()) {
            std::println("пустая строка");
            continue;
        }
        const std::string &first = split(line).front();
        const std::size_t count = split(line).size();
        std::println("первое: {}, слов: {}", first, count);`
}
    }
    return 0;
}`;

export default {
  id: 'lifetime-object-lifetime',
  title: 'Время жизни объекта',
  description:
    'Время жизни объекта и область видимости имени; автоматический, статический, динамический и потоковый виды хранения; статические переменные функций и порядок уничтожения; временные объекты, продление жизни ссылкой и висячие ссылки; гарантированное устранение копий C++17 и исправление времени жизни временных объектов в цикле for в C++23.',
  moduleId: 'cpp-lifetime',
  order: 1,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-composition-vs-inheritance'],
  objectives: [
    'Отличать время жизни объекта от области видимости имени',
    'Предсказывать порядок создания и уничтожения объектов разных видов хранения',
    'Понимать, когда умирает временный объект и когда его жизнь продлевается',
    'Находить висячие ссылки на части временных объектов',
  ],
  tags: ['C++23', 'Время жизни', 'Временные объекты', 'static', 'Висячие ссылки'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чем время жизни отличается от области видимости?',
      options: [
        'Время жизни — свойство объекта во время работы, область видимости — свойство имени в тексте программы',
        'Это одно и то же',
        'Область видимости бывает только у глобальных переменных',
        'Время жизни определяет компоновщик',
      ],
      correct: 0,
      explain: 'Статическая переменная функции невидима снаружи, но живёт до конца программы.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct T {
    char c;
    ~T() { std::print("{}", c); }
};

int main() {
    T a{'a'};
    {
        T b{'b'};
        T c{'c'};
    }
    T d{'d'};
    return 0;
}`,
      lang: 'cpp',
      answers: ['cbda'],
      placeholder: 'Вывод программы',
      explain: 'Блок закрывается раньше: c, затем b; в конце main — d, затем a.',
    },
    {
      q: 'Когда создаётся статическая переменная внутри функции?',
      options: [
        'При первом выполнении её объявления',
        'До запуска main',
        'При каждом вызове функции',
        'При компиляции',
      ],
      correct: 0,
      explain: 'Инициализация происходит один раз, при первом проходе, и потокобезопасна.',
    },
    {
      q: 'Когда умирает временный объект, не привязанный к ссылке?',
      options: ['В конце полного выражения', 'В конце блока', 'В конце функции', 'После main'],
      correct: 0,
      explain: 'Обычно — на точке с запятой.',
    },
    {
      q: 'В каком случае жизнь временного объекта продлевается?',
      options: [
        'const T &r = make();',
        'const T &r = make().self(); где self() возвращает ссылку на *this',
        'T *p = &make();',
        'Ни в каком',
      ],
      correct: 0,
      explain:
        'Продление работает только при прямой привязке временного объекта к ссылке. Ссылка, полученная через функцию, повисает.',
    },
    {
      q: 'Сколько раз будет вызван конструктор Tracer в строке Tracer t = make(); где make() возвращает Tracer("x")?',
      options: ['Один', 'Два', 'Три', 'Зависит от оптимизации'],
      correct: 0,
      explain: 'С C++17 возврат временного объекта гарантированно строит его сразу на месте t.',
    },
    {
      q: 'В каком порядке уничтожаются статические объекты?',
      options: ['Обратном созданию', 'В порядке создания', 'В алфавитном', 'Не уничтожаются'],
      correct: 0,
      explain: 'Как и автоматические: последний созданный уничтожается первым.',
    },
    {
      q: 'Что изменил C++23 в цикле for (const auto &x : make().items())?',
      options: [
        'Временные объекты заголовка цикла живут до конца цикла',
        'Такой цикл запрещён',
        'items() стал возвращать копию',
        'Ничего',
      ],
      correct: 0,
      explain:
        'Раньше make() умирал до начала цикла. Поддержка компиляторами появилась недавно: Clang 19, GCC 15.',
    },
    {
      q: 'Как называется ссылка на объект, время жизни которого уже закончилось?',
      answers: ['висячая', 'висячая ссылка', 'dangling', 'dangling reference'],
      placeholder: 'Одно слово',
      explain:
        'Обращение через неё — неопределённое поведение; ASan сообщает use-after-free или use-after-scope.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-object-lifetime-exercise',
      title: 'Вложенные области',
      difficulty: 'beginner',
      description: `
Структура \`Tracer\` хранит имя, конструктор печатает \`+имя\`, деструктор — \`-имя\`. Прочитайте все слова входа в вектор и вызовите рекурсивную функцию \`descend(names, 0)\`:

- если \`i\` равно числу слов — напечатайте \`глубина i\`;
- иначе создайте локальный \`Tracer\` с именем \`names[i]\` и вызовите \`descend(names, i + 1)\`.

Порядок строк должен получиться сам — из правил времени жизни, без ручной печати \`-имя\`.`,
      constraints: ['Слов не больше 100.'],
      hints: [
        'Локальный объект живёт до конца вызова descend, а вложенный вызов завершается раньше внешнего.',
        'Передавайте вектор по константной ссылке: const std::vector<std::string> &names.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) {
        std::println("+{}", name);
    }
    ~Tracer() {
        std::println("-{}", name);
    }
};

void descend(const std::vector<std::string> &names, std::size_t i) {
    if (i == names.size()) {
        std::println("глубина {}", i);
        return;
    }
    const Tracer t(names[i]);
    descend(names, i + 1);
}

int main() {
    std::vector<std::string> names;
    std::string w;
    while (std::cin >> w) {
        names.push_back(w);
    }
    descend(names, 0);
    return 0;
}`,
      explanation: `
Каждый вызов \`descend\` создаёт свой объект в своём кадре стека. Вложенный вызов начинается после создания объекта и заканчивается раньше, чем внешний, поэтому объекты уничтожаются в обратном порядке. Эта симметрия — основа RAII: ресурсы освобождаются в порядке, обратном захвату, без единой строчки кода очистки.`,
      examples: [
        { in: 'a b\n', out: '+a\n+b\nглубина 2\n-b\n-a\n' },
        { in: '', out: 'глубина 0\n' },
      ],
      hidden: [
        { in: 'один\n', name: 'Одно имя' },
        { in: 'x y z\n', name: 'Три имени' },
        { in: 'a a a\n', name: 'Одинаковые имена' },
        { in: 'файл соединение блокировка буфер\n', name: 'Четыре ресурса' },
        { in: '1 2 3 4 5 6 7 8 9 10\n', name: 'Десять уровней' },
        { in: 'внешний\nвнутренний\n', name: 'Слова на разных строках' },
        { in: 'α β\n', name: 'Греческие буквы' },
        { in: 'q w e r t\n', name: 'Пять уровней' },
      ],
    },
    {
      title: 'Ленивые настройки',
      description: `
Две функции со статическими переменными:

- \`int next_id()\` — возвращает 1, 2, 3, … при последовательных вызовах (\`static int counter\`);
- \`const Config &config(int version)\` — при **первом** вызове создаёт статический объект \`Config\` с полем \`version\`; конструктор \`Config\` печатает \`загрузка V\`. Последующие вызовы возвращают тот же объект и аргумент игнорируют.

Команды: \`id\` — напечатать \`id N\`; \`cfg V\` — вызвать \`config(V)\` и напечатать \`версия X\`, где X — версия из возвращённого объекта.`,
      constraints: ['Команд не больше 100; версии от 1 до 100.'],
      hints: [
        'static Config instance(version); внутри функции выполнится один раз — при первом вызове.',
        'Возвращайте ссылку на статический объект: он живёт до конца программы, ссылка не повиснет.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

struct Config {
    int version;
    explicit Config(int v) : version(v) {
        std::println("загрузка {}", version);
    }
};

int next_id() {
    static int counter = 0;
    return ++counter;
}

const Config &config(int version) {
    static const Config instance(version);
    return instance;
}

int main() {
    std::string command;
    while (std::cin >> command) {
        if (command == "id") {
            std::println("id {}", next_id());
        } else {
            int version;
            std::cin >> version;
            std::println("версия {}", config(version).version);
        }
    }
    return 0;
}`,
      explanation: `
Статическая переменная функции инициализируется один раз — когда выполнение впервые доходит до её объявления. Поэтому «загрузка» печатается только при первом \`cfg\`, а версия запоминается из первого вызова. Если \`cfg\` не встретилось ни разу, объект \`Config\` вообще не создаётся — отсюда название «ленивая инициализация».

Возвращать ссылку на статический объект безопасно: он живёт до завершения программы. Стандарт гарантирует, что такая инициализация потокобезопасна, — это самый простой правильный способ сделать единственный общий объект.`,
      examples: [
        { in: 'id\ncfg 23\nid\ncfg 17\n', out: 'id 1\nзагрузка 23\nверсия 23\nid 2\nверсия 23\n' },
        { in: 'id\nid\nid\n', out: 'id 1\nid 2\nid 3\n' },
      ],
      hidden: [
        { in: '', name: 'Без команд' },
        { in: 'cfg 5\n', name: 'Одна загрузка' },
        { in: 'cfg 1\ncfg 2\ncfg 3\n', name: 'Аргумент игнорируется' },
        { in: 'cfg 100\nid\nid\ncfg 1\n', name: 'Смешанные команды' },
        { in: 'id\nid\nid\nid\nid\nid\nid\nid\nid\nid\nid\n', name: 'Двузначные номера' },
        { in: 'id\ncfg 42\n', name: 'Сначала номер' },
        { in: 'cfg 7\ncfg 7\n', name: 'Повтор той же версии' },
        { in: 'id\ncfg 3\nid\ncfg 4\nid\n', name: 'Чередование' },
      ],
    },
    {
      title: 'Найди ошибку: первое слово',
      bug: true,
      description: `
Для каждой строки ввода программа печатает \`первое: W, слов: N\` или \`пустая строка\`, если слов нет. Под AddressSanitizer она аварийно завершается на первой же непустой строке. Найдите и исправьте ошибку.`,
      constraints: ['Строк не больше 100, длина строки до 1000 символов.'],
      hints: [
        'Сколько живёт вектор, который вернул split(line)? А ссылка first?',
        'Сохраните результат split в локальную переменную и берите первое слово и размер из неё — заодно строка будет разбиваться один раз, а не три.',
      ],
      starter: FIRST_WORD(false),
      solution: FIRST_WORD(true),
      explanation: `
\`split(line)\` возвращает временный вектор, который умирает в конце полного выражения. \`front()\` вернул ссылку на строку **внутри** этого вектора, и после точки с запятой \`first\` указывает в освобождённую память — \`heap-use-after-free\` при печати. Продление жизни здесь не срабатывает: ссылка привязана не к временному объекту, а к результату вызова его метода.

Исправление — сохранить сам вектор в локальной переменной. Тогда слова живут до конца итерации, а разбиение строки выполняется один раз вместо трёх.`,
      examples: [
        {
          in: 'привет мир\n\nодно\n',
          out: 'первое: привет, слов: 2\nпустая строка\nпервое: одно, слов: 1\n',
        },
        { in: '   отступ и   пробелы   \n', out: 'первое: отступ, слов: 3\n' },
      ],
      hidden: [
        'a\n',
        '\n\n',
        'очень-длинное-первое-слово-которое-не-влезет-в-короткую-строку два\n',
        'x y z w v u t s r q\n',
        'один\nдва три\nчетыре пять шесть\n',
        '\tтабуляция\tтоже\n',
        'повтор повтор повтор\n',
        'последняя строка без перевода',
      ],
    },
    {
      title: 'Расписание уничтожения',
      difficulty: 'advanced',
      description: `
Смоделируйте правила времени жизни. Программа на входе — команды по одной в строке:

- \`{\` — открыть блок, \`}\` — закрыть текущий блок;
- \`obj имя\` — локальный объект текущего блока;
- \`tmp имя\` — временный объект: создаётся и сразу уничтожается;
- \`static имя\` — статическая переменная функции: создаётся при первой встрече этого имени, повторные встречи ничего не делают.

Создание печатайте как \`+имя\`, уничтожение — \`-имя\`. Объекты блока уничтожаются при его закрытии в порядке, обратном созданию. Команды вне всех \`{ }\` относятся к блоку \`main\`. В конце ввода закройте все незакрытые блоки (изнутри наружу) и блок \`main\`, затем уничтожьте статические объекты в порядке, обратном созданию.`,
      constraints: ['Команд не больше 200; } никогда не закрывает блок main; имена без пробелов.'],
      hints: [
        'Стек блоков: std::vector<std::vector<std::string>>, в начале — один пустой блок main. Закрытие — обход последнего блока с конца и pop_back.',
        'Статические имена храните в векторе (для порядка) и проверяйте повтор через std::ranges::contains.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <vector>

void close_block(std::vector<std::vector<std::string>> &blocks) {
    const std::vector<std::string> &block = blocks.back();
    for (auto it = block.rbegin(); it != block.rend(); ++it) {
        std::println("-{}", *it);
    }
    blocks.pop_back();
}

int main() {
    std::vector<std::vector<std::string>> blocks(1);
    std::vector<std::string> statics;
    std::string command;
    while (std::cin >> command) {
        if (command == "{") {
            blocks.emplace_back();
        } else if (command == "}") {
            close_block(blocks);
        } else {
            std::string name;
            std::cin >> name;
            if (command == "obj") {
                std::println("+{}", name);
                blocks.back().push_back(name);
            } else if (command == "tmp") {
                std::println("+{}", name);
                std::println("-{}", name);
            } else if (!std::ranges::contains(statics, name)) {
                std::println("+{}", name);
                statics.push_back(name);
            }
        }
    }
    while (!blocks.empty()) {
        close_block(blocks);
    }
    for (auto it = statics.rbegin(); it != statics.rend(); ++it) {
        std::println("-{}", *it);
    }
    return 0;
}`,
      explanation: `
Модель повторяет то, что делает компилятор. Автоматические объекты образуют стек: блок закрывается — его объекты уничтожаются от последнего к первому. Временный объект не переживает своё выражение. Статические объекты не принадлежат никакому блоку: они создаются при первой встрече и уничтожаются после завершения \`main\`, тоже в обратном порядке.

Обратите внимание, что статический объект, впервые встреченный во вложенном блоке, переживает и этот блок, и \`main\`.`,
      examples: [
        {
          in: 'obj a\n{\nobj b\ntmp t\nstatic s\n}\nstatic s\nobj c\n',
          out: '+a\n+b\n+t\n-t\n+s\n-b\n+c\n-c\n-a\n-s\n',
        },
        { in: 'static z\n', out: '+z\n-z\n' },
      ],
      hidden: [
        { in: 'obj a\nobj b\nobj c\n', name: 'Только main' },
        { in: '{\n{\nobj x\n', name: 'Незакрытые блоки' },
        { in: 'static a\nstatic b\nstatic a\n', name: 'Повтор статического' },
        { in: 'tmp a\ntmp b\n', name: 'Только временные' },
        { in: '{\nobj a\n}\n{\nobj b\n}\n', name: 'Два соседних блока' },
        {
          in: 'obj m\n{\nstatic s1\n{\nobj in\nstatic s2\n}\nobj after\n}\n',
          name: 'Статические во вложенных блоках',
        },
        { in: '{\n}\n{\n{\n}\n}\n', name: 'Пустые блоки' },
        { in: 'obj a\n{\nobj b\n{\nobj c\n{\nobj d\n', name: 'Глубокая вложенность' },
      ],
    },
  ],
};
