const LONGEST = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::vector<std::string> words;
    std::string w;
    while (std::cin >> w) {
        words.push_back(std::move(w));
    }
    std::string longest;
    for (std::string &word : words) {
        if (word.size() > longest.size()) {
            longest = ${fixed ? 'word' : 'std::move(word)'};
        }
    }
    std::string all;
    for (const std::string &word : words) {
        all += (all.empty() ? "" : " ") + word;
    }
    std::println("самое длинное: {}", longest);
    std::println("все слова: {}", all);
    return 0;
}`;

export default {
  id: 'lifetime-std-move',
  title: 'std::move: когда разрешать перемещение',
  description:
    'std::move как приведение типа и обещание не использовать содержимое; последнее использование переменной; параметр-приёмник — принять по значению и переместить в поле; перенос диапазонов std::ranges::move и std::views::as_rvalue из C++23; где std::move вреден или бесполезен — return локальной переменной, константы, простые типы, чтение после перемещения.',
  moduleId: 'cpp-lifetime',
  order: 13,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['lifetime-rvalue-references'],
  objectives: [
    'Ставить std::move при последнем использовании переменной',
    'Писать параметры-приёмники по значению с перемещением в поле',
    'Переносить диапазоны алгоритмами и представлениями',
    'Узнавать вредные и бесполезные std::move',
  ],
  tags: ['C++23', 'Время жизни', 'std::move', 'Перемещение', 'ranges'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что означает std::move(x) в коде?',
      options: [
        'Обещание: содержимое x дальше не понадобится, его можно забрать',
        'Команду немедленно переместить x в другую память',
        'Удаление x',
        'Копирование x во временный объект',
      ],
      correct: 0,
      explain: 'Перемещает конструктор или присваивание, выбранные благодаря приведению.',
    },
    {
      q: 'Конструктор Person(std::string name) : name_(std::move(name)) {}. Сколько копий строки при Person p(s); где s — переменная?',
      options: ['Одна', 'Ноль', 'Две', 'Три'],
      correct: 0,
      explain:
        'Копия в параметр, затем перемещение в поле. Для временного аргумента копий нет вовсе.',
    },
    {
      q: 'Какие std::move бесполезны или вредны? Выберите все.',
      options: [
        'return std::move(local);',
        'std::move(x) для int x',
        'f(std::move(c)) для const std::string c',
        'v.push_back(std::move(s)) при последнем использовании s',
      ],
      correct: [0, 1, 2],
      explain: 'Последнее — правильное использование.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <utility>

int main() {
    std::string a = "текст";
    std::string b = std::move(a);
    a = "новое";
    std::println("{} {}", a, b);
    return 0;
}`,
      lang: 'cpp',
      answers: ['новое текст'],
      placeholder: 'Вывод программы',
      explain:
        'После перемещения переменной можно присвоить новое значение и пользоваться ею дальше.',
    },
    {
      q: 'Что делает представление std::views::as_rvalue (C++23)?',
      options: [
        'Отдаёт элементы диапазона как rvalue, чтобы их можно было переместить',
        'Копирует элементы',
        'Сортирует элементы',
        'Удаляет элементы из исходного контейнера',
      ],
      correct: 0,
      explain: 'Сам контейнер не меняется по размеру: в нём остаются перемещённые элементы.',
    },
    {
      q: 'Какие операции безопасны для std::string сразу после перемещения из неё? Выберите все.',
      options: ['s.clear()', 's = "новое"', 'уничтожение s', 's[0]'],
      correct: [0, 1, 2],
      explain: 's[0] требует непустой строки, а содержимое не определено.',
    },
    {
      q: 'Почему для параметра-приёмника выбирают передачу по значению вместо двух перегрузок const T & и T &&?',
      options: [
        'Одна функция вместо двух ценой одного дешёвого перемещения',
        'Так всегда быстрее',
        'Перегрузки по ссылкам запрещены в конструкторах',
        'Передача по значению не копирует',
      ],
      correct: 0,
      explain: 'Для типов с дорогим перемещением выгоднее перегрузки.',
    },
    {
      q: 'Какой флаг GCC и Clang предупреждает о return std::move(local)?',
      answers: ['-Wpessimizing-move', 'Wpessimizing-move'],
      placeholder: 'Флаг',
      explain: 'Он входит в -Wall у Clang и GCC.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-std-move-exercise',
      title: 'Параметр-приёмник',
      difficulty: 'beginner',
      description: `
Структура \`Tag\` хранит строку и считает копии и перемещения. Класс \`User\` принимает имя **по значению** и перемещает его в поле: \`explicit User(Tag name) : name_(std::move(name)) {}\`.

Команды (каждая создаёт локального пользователя и печатает \`пользователь имя\`):

- \`var x\` — \`Tag t(x); const User u(t);\`
- \`temp x\` — \`const User u{Tag(x)};\` (с круглыми скобками \`u(Tag(x))\` компилятор прочитал бы строку как объявление функции — «most vexing parse»)
- \`moved x\` — \`Tag t(x); const User u(std::move(t));\`
- \`stats\` — \`копий C, перемещений M\`.`,
      constraints: ['Команд не больше 200.'],
      hints: [
        'Посчитайте сами до запуска: var — копия в параметр и перемещение в поле; temp — только перемещение в поле; moved — два перемещения.',
        'Временный Tag(x) в аргументе инициализирует параметр без копий и перемещений — это гарантированное устранение копии.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>

struct Tag {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string v;

    explicit Tag(std::string s) : v(std::move(s)) {}
    Tag(const Tag &o) : v(o.v) {
        ++copies;
    }
    Tag(Tag &&o) noexcept : v(std::move(o.v)) {
        ++moves;
    }
};

class User {
public:
    explicit User(Tag name) : name_(std::move(name)) {}

    const std::string &name() const {
        return name_.v;
    }

private:
    Tag name_;
};

int main() {
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            std::println("копий {}, перемещений {}", Tag::copies, Tag::moves);
            continue;
        }
        std::string x;
        std::cin >> x;
        if (command == "var") {
            Tag t(x);
            const User u(t);
            std::println("пользователь {}", u.name());
        } else if (command == "temp") {
            const User u{Tag(x)};
            std::println("пользователь {}", u.name());
        } else {
            Tag t(x);
            const User u(std::move(t));
            std::println("пользователь {}", u.name());
        }
    }
    return 0;
}`,
      explanation: `
Параметр по значению — «приёмник»: функция получает собственный экземпляр, а как он появился, решает вызывающий. Из переменной — копией (вызывающий сохраняет оригинал), из временного — без операций вовсе, через \`std::move\` — перемещением. Дальше конструктор перемещает свой экземпляр в поле. Итог: копия только там, где без неё нельзя.`,
      examples: [
        {
          in: 'var a\ntemp b\nmoved c\nstats\n',
          out: 'пользователь a\nпользователь b\nпользователь c\nкопий 1, перемещений 4\n',
        },
        { in: 'stats\n', out: 'копий 0, перемещений 0\n' },
      ],
      hidden: [
        { in: 'var a\nvar b\nstats\n', name: 'Только переменные' },
        { in: 'temp a\ntemp b\ntemp c\nstats\n', name: 'Только временные' },
        { in: 'moved a\nstats\n', name: 'Только move' },
        { in: '', name: 'Пусто' },
        { in: 'var длинное-имя-пользователя-системы\nstats\n', name: 'Длинное имя' },
        { in: 'temp x\nstats\nvar y\nstats\n', name: 'Статистика по ходу' },
        { in: 'moved p\nvar q\ntemp r\nmoved s\nstats\n', name: 'Смешанные' },
        { in: 'var Ада\n', name: 'Кириллица' },
      ],
    },
    {
      title: 'Список дел',
      description: `
Два списка строк: \`todo\` и \`done\`. Команды:

- \`add текст\` — в конец \`todo\`;
- \`finish i\` — перенести i-е дело (с 1) из \`todo\` в конец \`done\` **перемещением** и удалить его из \`todo\`;
- \`finish-all\` — перенести все дела \`todo\` в конец \`done\` алгоритмом \`std::ranges::move\` и очистить \`todo\`;
- \`show\` — две строки: \`дела: …\` и \`готово: …\` (элементы через запятую с пробелом, пустой список — \`—\`).`,
      constraints: ['Команд не больше 300; finish ссылается на существующее дело.'],
      hints: [
        'done.push_back(std::move(todo[i - 1])); todo.erase(todo.begin() + (i - 1));',
        'std::ranges::move(todo, std::back_inserter(done)); — после этого в todo остались перемещённые строки, поэтому todo.clear().',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <iterator>
#include <print>
#include <string>
#include <utility>
#include <vector>

std::string join(const std::vector<std::string> &items) {
    std::string s;
    for (const std::string &item : items) {
        s += (s.empty() ? "" : ", ") + item;
    }
    return s.empty() ? "—" : s;
}

int main() {
    std::vector<std::string> todo;
    std::vector<std::string> done;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string text;
            std::cin >> text;
            todo.push_back(std::move(text));
        } else if (command == "finish") {
            std::size_t i;
            std::cin >> i;
            done.push_back(std::move(todo[i - 1]));
            todo.erase(todo.begin() + static_cast<std::ptrdiff_t>(i - 1));
        } else if (command == "finish-all") {
            std::ranges::move(todo, std::back_inserter(done));
            todo.clear();
        } else {
            std::println("дела: {}", join(todo));
            std::println("готово: {}", join(done));
        }
    }
    return 0;
}`,
      explanation: `
Каждое дело существует в одном экземпляре и лишь меняет владельца: перемещение забирает буфер строки, а \`erase\` и \`clear\` убирают опустевшие места. Без \`erase\` или \`clear\` в списке остались бы строки в неопределённом состоянии — формально корректные, но с неизвестным содержимым.

\`std::ranges::move\` — алгоритм-двойник \`std::ranges::copy\`: он присваивает каждому месту назначения rvalue из источника.`,
      examples: [
        {
          in: 'add код\nadd тест\nadd ревью\nfinish 2\nshow\nfinish-all\nshow\n',
          out: 'дела: код, ревью\nготово: тест\nдела: —\nготово: тест, код, ревью\n',
        },
        { in: 'show\n', out: 'дела: —\nготово: —\n' },
      ],
      hidden: [
        { in: 'add a\nfinish 1\nshow\n', name: 'Одно дело' },
        { in: 'finish-all\nshow\n', name: 'Перенос пустого' },
        { in: 'add a\nadd b\nadd c\nfinish 3\nfinish 1\nshow\n', name: 'Последнее и первое' },
        { in: 'add a\nfinish-all\nadd b\nfinish-all\nshow\n', name: 'Два переноса' },
        {
          in: 'add очень-длинное-дело-которое-точно-в-куче\nfinish 1\nshow\n',
          name: 'Длинная строка',
        },
        { in: 'add x\nadd y\nshow\nfinish 1\nshow\nfinish 1\nshow\n', name: 'По одному' },
        {
          in: 'add 1\nadd 2\nadd 3\nadd 4\nfinish 2\nfinish 2\nfinish-all\nshow\n',
          name: 'Смешанные',
        },
        { in: 'add a\nadd a\nfinish 1\nshow\n', name: 'Одинаковые дела' },
      ],
    },
    {
      title: 'Найди ошибку: пустое слово',
      bug: true,
      description: `
Программа читает слова, печатает самое длинное (первое из самых длинных, длина — \`size()\`) и затем все слова в исходном порядке. Самое длинное печатается правильно, но в списке всех слов на его месте пусто. Найдите и исправьте ошибку.`,
      constraints: ['Слов не больше 1000.'],
      hints: [
        'Что остаётся в векторе words после строки longest = std::move(word)?',
        'Самое длинное слово нужно и в списке, поэтому его надо скопировать (или запомнить индекс), а не забрать.',
      ],
      starter: LONGEST(false),
      solution: LONGEST(true),
      explanation: `
\`std::move(word)\` пообещал, что содержимое \`word\` больше не нужно, и присваивание забрало его. Но слово остаётся в векторе и печатается во второй строке — теперь пустым (в libstdc++ перемещённая строка пуста, в других реализациях содержимое может быть любым).

Перемещайте только то, что действительно отдаёте. Здесь подходит копия \`longest = word\` или, чтобы не копировать вовсе, хранение индекса самого длинного слова.`,
      examples: [
        { in: 'кот слон мышь\n', out: 'самое длинное: слон\nвсе слова: кот слон мышь\n' },
        { in: 'a bb ccc bb\n', out: 'самое длинное: ccc\nвсе слова: a bb ccc bb\n' },
      ],
      hidden: [
        'one\n',
        'ab cd\n',
        'x yy zzz wwww\n',
        'длинное-слово короткое\n',
        'aaa bbb\n',
        'q\nw\nee\n',
        'supercalifragilisticexpialidocious is long\n',
        'a b c d e f\n',
      ],
    },
    {
      title: 'Слияние без копий',
      difficulty: 'advanced',
      description: `
Структура \`Tracked\` хранит строку и считает копии и перемещения (в конструкторах и в операторах присваивания). Первая строка ввода — список A, вторая — список B; оба отсортированы по возрастанию. Прочитайте их в \`std::vector<Tracked>\` через \`reserve\` и \`emplace_back\` и обнулите счётчики.

Затем:

1. \`std::vector<Tracked> merge(std::vector<Tracked> a, std::vector<Tracked> b)\` — слить в один отсортированный вектор (при равенстве сначала элемент из A), вызвать как \`merge(std::move(a), std::move(b))\`; напечатать \`слияние: …\`;
2. \`void dedupe(std::vector<Tracked> &v)\` — удалить подряд идущие повторы на месте, сдвигая элементы перемещающим присваиванием (как \`std::unique\`), и обрезать хвост через \`erase\`; напечатать \`без повторов: …\`;
3. напечатать \`копий C, перемещений M\`.

Пустой список печатается как \`—\`.`,
      constraints: ['В каждом списке до 100 слов; строки могут быть пустыми.'],
      hints: [
        'Передача векторов в merge через std::move перемещает сами векторы — ни один элемент при этом не трогается. Внутри: result.reserve(a.size() + b.size()) и push_back(std::move(…)).',
        'dedupe: индекс записи w = 1; для r от 1: если v[r].v != v[w - 1].v, то при r != w выполнить v[w] = std::move(v[r]); затем ++w. В конце v.erase(v.begin() + w, v.end()).',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

struct Tracked {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string v;

    explicit Tracked(std::string value) : v(std::move(value)) {}
    Tracked(const Tracked &other) : v(other.v) {
        ++copies;
    }
    Tracked(Tracked &&other) noexcept : v(std::move(other.v)) {
        ++moves;
    }
    Tracked &operator=(const Tracked &other) {
        v = other.v;
        ++copies;
        return *this;
    }
    Tracked &operator=(Tracked &&other) noexcept {
        v = std::move(other.v);
        ++moves;
        return *this;
    }
};

std::vector<Tracked> read_line() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream in(line);
    std::vector<std::string> words;
    std::string w;
    while (in >> w) {
        words.push_back(w);
    }
    std::vector<Tracked> items;
    items.reserve(words.size());
    for (std::string &word : words) {
        items.emplace_back(std::move(word));
    }
    return items;
}

std::vector<Tracked> merge(std::vector<Tracked> a, std::vector<Tracked> b) {
    std::vector<Tracked> result;
    result.reserve(a.size() + b.size());
    std::size_t i = 0, j = 0;
    while (i < a.size() || j < b.size()) {
        if (j == b.size() || (i < a.size() && !(b[j].v < a[i].v))) {
            result.push_back(std::move(a[i++]));
        } else {
            result.push_back(std::move(b[j++]));
        }
    }
    return result;
}

void dedupe(std::vector<Tracked> &v) {
    if (v.empty()) {
        return;
    }
    std::size_t w = 1;
    for (std::size_t r = 1; r < v.size(); ++r) {
        if (v[r].v != v[w - 1].v) {
            if (r != w) {
                v[w] = std::move(v[r]);
            }
            ++w;
        }
    }
    v.erase(v.begin() + static_cast<std::ptrdiff_t>(w), v.end());
}

std::string join(const std::vector<Tracked> &items) {
    std::string s;
    for (const Tracked &t : items) {
        s += (s.empty() ? "" : " ") + t.v;
    }
    return s.empty() ? "—" : s;
}

int main() {
    std::vector<Tracked> a = read_line();
    std::vector<Tracked> b = read_line();
    Tracked::copies = 0;
    Tracked::moves = 0;
    std::vector<Tracked> merged = merge(std::move(a), std::move(b));
    std::println("слияние: {}", join(merged));
    dedupe(merged);
    std::println("без повторов: {}", join(merged));
    std::println("копий {}, перемещений {}", Tracked::copies, Tracked::moves);
    return 0;
}`,
      explanation: `
Векторы передаются в \`merge\` и возвращаются из неё перемещением — это три обмена указателями, элементы при этом не трогаются. Каждый элемент перемещается в результат ровно один раз, а \`dedupe\` сдвигает влево только те элементы, которым действительно нужно сменить место. Итог — ни одной копии строк при любом объёме данных.

Так же устроены стандартные \`std::ranges::merge\` с \`std::move_iterator\` и \`std::ranges::unique\`: алгоритмы, переставляющие элементы, работают перемещениями.`,
      examples: [
        {
          in: 'a c c e\nb c d\n',
          out: 'слияние: a b c c c d e\nбез повторов: a b c d e\nкопий 0, перемещений 9\n',
        },
        { in: '\nx\n', out: 'слияние: x\nбез повторов: x\nкопий 0, перемещений 1\n' },
      ],
      hidden: [
        { in: '\n\n', name: 'Оба пустые' },
        { in: 'a a a\na a\n', name: 'Все одинаковые' },
        { in: 'a b c\nd e f\n', name: 'Без пересечения' },
        { in: 'd e f\na b c\n', name: 'B раньше A' },
        { in: 'apple banana\napple cherry\n', name: 'Общий элемент' },
        { in: '1 3 5 7 9\n2 4 6 8\n', name: 'Чередование' },
        {
          in: 'длинная-строка-раз длинная-строка-раз\nдлинная-строка-два\n',
          name: 'Длинные строки',
        },
        { in: 'x\n\n', name: 'Пустой B' },
      ],
    },
  ],
};
