const REGISTERED = (fixed) => String.raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    std::map<std::string, bool> registered;
    for (int i = 0; i < n; i++) {
        std::string name;
        std::cin >> name;
        registered[name] = true;
    }
    std::string query;
    while (std::cin >> query) {
        std::cout << (${fixed ? 'registered.contains(query)' : 'registered[query]'} ? "есть" : "нет") << '\n';
    }
    std::cout << "в базе: " << registered.size() << '\n';
    return 0;
}`;

export default {
  id: 'cpp20-map',
  title: 'Словарь std::map',
  description:
    'Упорядоченный словарь std::map на дереве поиска; operator[] и ловушка создания элементов; contains, count, find и at для чтения; подсчёт частот; insert и erase; запросы по диапазону ключей lower_bound и upper_bound.',
  moduleId: 'cpp-fundamentals',
  order: 23,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['cpp23-optional'],
  objectives: [
    'Хранить пары «ключ → значение» в std::map и обходить их по порядку ключей',
    'Читать из словаря, не создавая элементы',
    'Считать частоты и обновлять значения',
    'Выполнять запросы по диапазону ключей',
  ],
  tags: ['C++', 'map', 'Словарь', 'Контейнеры'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <map>

int main() {
    std::map<int, int> m;
    m[3] = 30;
    m[1] = 10;
    m[3] += 3;
    for (const auto &[k, v] : m) {
        std::cout << k << ':' << v << ' ';
    }
    std::cout << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1:10 3:33'],
      placeholder: 'Вывод программы',
      explain: 'Обход идёт по возрастанию ключей; m[3] += 3 меняет существующее значение.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> m = {{"a", 1}};
    int x = m["b"];
    std::cout << x << ' ' << m.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['0 2'],
      placeholder: 'Вывод программы',
      explain:
        'operator[] для отсутствующего ключа создаёт элемент со значением 0 — словарь вырос до двух элементов.',
    },
    {
      q: 'Какие способы проверяют наличие ключа, не изменяя словарь?',
      options: ['m.contains(k)', 'm.count(k)', 'm.find(k) != m.end()', 'm[k] != 0'],
      correct: [0, 1, 2],
      explain: 'm[k] создаёт отсутствующий ключ.',
    },
    {
      q: 'Какова сложность поиска по ключу в std::map из n элементов?',
      options: ['O(log n)', 'O(1)', 'O(n)', 'O(n log n)'],
      correct: 0,
      explain: 'std::map — сбалансированное дерево поиска, его высота O(log n).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> m = {{"x", 1}};
    auto [it, ok] = m.insert({"x", 5});
    std::cout << it->second << ' ' << ok << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 0'],
      placeholder: 'Вывод программы',
      explain:
        'insert не заменяет существующее значение: возвращается итератор на старый элемент и false.',
    },
    {
      q: 'Что делает m.at(k), если ключа k нет?',
      options: [
        'Бросает исключение std::out_of_range',
        'Создаёт элемент со значением по умолчанию',
        'Возвращает end()',
        'Неопределённое поведение',
      ],
      correct: 0,
      explain: 'at — проверяемый доступ: ошибка становится явной, а словарь не меняется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <map>

int main() {
    std::map<int, char> m = {{10, 'a'}, {20, 'b'}, {30, 'c'}};
    std::cout << m.lower_bound(20)->second << m.upper_bound(20)->second
              << m.lower_bound(15)->second << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['bcb'],
      placeholder: 'Вывод программы',
      explain:
        'lower_bound(20) — ключ 20; upper_bound(20) — первый больше 20, то есть 30; lower_bound(15) — первый не меньше 15, то есть 20.',
    },
    {
      q: 'Почему нельзя изменить ключ элемента через итератор: it->first = "new";?',
      options: [
        'Ключ константный: его изменение нарушило бы порядок в дереве',
        'Итераторы map только для чтения целиком',
        'Можно, это обычная операция',
        'Ключи строки нельзя менять в C++',
      ],
      correct: 0,
      explain: 'Элемент map — std::pair<const Key, Value>. Значение менять можно, ключ — нет.',
    },
  ],
  exercises: [
    {
      title: 'Словарь частот',
      difficulty: 'beginner',
      description: `
До конца ввода идут слова. Напечатайте каждое различное слово и число его вхождений в алфавитном порядке (по кодам символов): \`слово число\`.

Используйте \`std::map<std::string, int>\` и \`++count[word]\`.`,
      constraints: ['Слов не больше 3000; слова — латинские буквы до 30 символов.'],
      hints: [
        'Новый ключ в operator[] начинается с 0, поэтому ++count[word] сразу даёт правильный счёт.',
        'Обход for (const auto &[word, c] : count) идёт в порядке ключей — сортировать не нужно.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> count;
    std::string word;
    while (std::cin >> word) {
        ++count[word];
    }
    for (const auto &[w, c] : count) {
        std::cout << w << ' ' << c << '\n';
    }
    return 0;
}`,
      explanation: `
Здесь создание элемента по \`operator[]\` — именно то, что нужно: встреченное впервые слово получает счётчик 0, и \`++\` превращает его в 1. Обход \`std::map\` идёт по возрастанию ключей, поэтому алфавитный порядок получается бесплатно. Каждое слово — \`O(log n)\` сравнений строк.

В модуле «Алгоритмы» та же задача потребовала хеш-таблицы с цепочками и отдельного массива для порядка; здесь — пять строк.`,
      examples: [
        { in: 'to be or not to be\n', out: 'be 2\nnot 1\nor 1\nto 2\n' },
        { in: 'b a B\n', out: 'B 1\na 1\nb 1\n' },
      ],
      hidden: [
        '',
        'solo\n',
        'a a a a\n',
        'z y x w\n',
        'ab a abc ab\n',
        'the cat the dog the end\n',
        'Zebra apple Apple zebra\n',
        'x\ny\nx\n',
      ],
    },
    {
      title: 'Телефонная книга',
      description: `
Выполните команды над телефонной книгой:

- \`add имя телефон\` — записать телефон (если имя есть — заменить);
- \`del имя\` — удалить запись; напечатать \`удалено\` или \`нет такого\`;
- \`find имя\` — напечатать телефон или \`нет такого\`;
- \`list\` — напечатать все записи \`имя телефон\` в алфавитном порядке или \`пусто\`.

Команды \`find\` и \`del\` не должны добавлять записи.`,
      constraints: ['Команд не больше 1000; имена и телефоны без пробелов.'],
      hints: [
        'add: book[name] = phone. find: auto it = book.find(name); if (it != book.end()) печать it->second.',
        'del: book.erase(name) возвращает число удалённых элементов — 0 или 1.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, std::string> book;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string name, phone;
            std::cin >> name >> phone;
            book[name] = phone;
        } else if (command == "del") {
            std::string name;
            std::cin >> name;
            std::cout << (book.erase(name) > 0 ? "удалено" : "нет такого") << '\n';
        } else if (command == "find") {
            std::string name;
            std::cin >> name;
            auto it = book.find(name);
            std::cout << (it != book.end() ? it->second : "нет такого") << '\n';
        } else if (command == "list") {
            if (book.empty()) {
                std::cout << "пусто\n";
            }
            for (const auto &[name, phone] : book) {
                std::cout << name << ' ' << phone << '\n';
            }
        }
    }
    return 0;
}`,
      explanation: `
Запись — \`operator[]\`: он создаёт ключ или заменяет значение, и это ровно поведение команды \`add\`. Чтение — \`find\`: он возвращает итератор на элемент или \`end()\` и ничего не добавляет. Если бы \`find\` был написан через \`book[name]\`, каждый поиск несуществующего имени добавлял бы пустую запись, и \`list\` начал бы показывать людей без телефонов.

\`erase(key)\` возвращает число удалённых элементов: в \`std::map\` ключ уникален, поэтому это 0 или 1 — готовый ответ «удалено или нет».`,
      examples: [
        {
          in: 'add Ann 111\nadd Bob 222\nfind Ann\nfind Cid\nlist\n',
          out: '111\nнет такого\nAnn 111\nBob 222\n',
        },
        { in: 'del X\nlist\n', out: 'нет такого\nпусто\n' },
      ],
      hidden: [
        { in: 'add A 1\nadd A 2\nfind A\n', name: 'Замена' },
        { in: 'find Ghost\nlist\n', name: 'Поиск не создаёт' },
        { in: 'add A 1\ndel A\ndel A\nlist\n', name: 'Двойное удаление' },
        { in: 'add Zed 9\nadd Amy 1\nadd Max 5\nlist\n', name: 'Алфавитный порядок' },
        { in: 'add a 1\nadd B 2\nlist\n', name: 'Регистр' },
        { in: 'add P +7-900\nfind P\n', name: 'Телефон с символами' },
        { in: 'add A 1\nfind B\nfind C\nlist\n', name: 'Несколько поисков' },
        { in: 'list\nadd Q 7\nlist\ndel Q\nlist\n', name: 'Пусто и обратно' },
      ],
    },
    {
      title: 'Найди ошибку: проверка имён',
      bug: true,
      description: `
Первая строка — \`n\`, вторая — \`n\` зарегистрированных имён. Дальше до конца ввода идут запросы — имена. Для каждого запроса программа печатает \`есть\` или \`нет\`, а в конце — \`в базе: K\`, число зарегистрированных имён.

Число в последней строке получается больше правильного. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 1000; запросов не больше 1000; имена без пробелов.'],
      hints: [
        'Что делает operator[] словаря, если ключа ещё нет?',
        'registered[query] для незарегистрированного имени создаёт запись со значением false — словарь растёт с каждым неудачным запросом. Проверяйте наличие через registered.contains(query).',
      ],
      starter: REGISTERED(false),
      solution: REGISTERED(true),
      explanation: `
Ответы «есть/нет» получаются правильными: для отсутствующего имени \`registered[query]\` возвращает \`false\`. Но по пути \`operator[]\` **вставляет** это имя со значением по умолчанию — и каждый запрос незарегистрированного имени увеличивает словарь. В итоге \`size()\` считает и зарегистрированные имена, и все неудачные запросы.

\`contains\` (или \`count\`, или \`find\`) только проверяет наличие ключа. Правило: \`operator[]\` — для записи, а для чтения — методы, которые словарь не меняют. Тип \`std::map<std::string, bool>\` здесь, кстати, избыточен: для множества имён есть \`std::set\` — о нём урок после следующего.`,
      examples: [
        { in: '2\nAnn Bob\nAnn\nBob\n', out: 'есть\nесть\nв базе: 2\n' },
        { in: '1\nAnn\nZed\n', out: 'нет\nв базе: 1\n' },
      ],
      hidden: [
        '1\nX\n',
        '2\nA B\nC\nD\nE\n',
        '3\nA B C\nA\nZ\nZ\n',
        '1\nSolo\nSolo\nsolo\n',
        '2\nA A\nA\n',
        '3\nx y z\nw\nx\nv\n',
        '2\nP Q\nQ\nP\nR\n',
        '1\nOne\nTwo\nThree\nOne\n',
      ],
    },
    {
      title: 'Журнал измерений',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\`, дальше \`n\` строк \`время значение\` (времена — различные целые числа, не обязательно по порядку). Затем запросы:

- \`sum a b\` — сумма значений с временем от \`a\` до \`b\` включительно (0, если таких нет);
- \`next t\` — первое измерение со временем строго больше \`t\`: \`время значение\` или \`нет\`;
- \`prev t\` — последнее измерение со временем строго меньше \`t\`: \`время значение\` или \`нет\`.

Храните журнал в \`std::map<long long, long long>\` и отвечайте через \`lower_bound\` и \`upper_bound\`.`,
      constraints: ['1 ≤ n ≤ 10⁴; |время| ≤ 10⁹; |значение| ≤ 10⁶; запросов не больше 1000.'],
      hints: [
        'sum: идите итератором от lower_bound(a) до upper_bound(b), складывая it->second. Если a > b, диапазон пуст.',
        'next t — upper_bound(t). prev t — lower_bound(t), и если это не begin(), шаг назад: --it.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    std::map<long long, long long> journal;
    for (int i = 0; i < n; i++) {
        long long time, value;
        std::cin >> time >> value;
        journal[time] = value;
    }
    std::string command;
    while (std::cin >> command) {
        if (command == "sum") {
            long long a, b, total = 0;
            std::cin >> a >> b;
            if (a <= b) {
                for (auto it = journal.lower_bound(a); it != journal.upper_bound(b); ++it) {
                    total += it->second;
                }
            }
            std::cout << total << '\n';
        } else if (command == "next") {
            long long t;
            std::cin >> t;
            auto it = journal.upper_bound(t);
            if (it == journal.end()) {
                std::cout << "нет\n";
            } else {
                std::cout << it->first << ' ' << it->second << '\n';
            }
        } else if (command == "prev") {
            long long t;
            std::cin >> t;
            auto it = journal.lower_bound(t);
            if (it == journal.begin()) {
                std::cout << "нет\n";
            } else {
                --it;
                std::cout << it->first << ' ' << it->second << '\n';
            }
        }
    }
    return 0;
}`,
      explanation: `
Ключи \`std::map\` упорядочены, поэтому «все измерения с временем от \`a\` до \`b\`» — непрерывный участок обхода от \`lower_bound(a)\` (первый ключ \`≥ a\`) до \`upper_bound(b)\` (первый ключ \`> b\`). Поиск границ — \`O(log n)\`, обход — по числу попавших ключей. Хеш-таблица на такие вопросы не отвечает: у неё нет порядка.

\`prev t\` — «последний ключ \`< t\`» — получается шагом назад от \`lower_bound(t)\`: всё, что левее первого ключа \`≥ t\`, меньше \`t\`. Шагать назад от \`begin()\` нельзя, поэтому этот случай проверяется отдельно. Итераторы \`map\` двунаправленные: \`--it\` работает, а \`it + 5\` — нет.`,
      examples: [
        {
          in: '4\n900 5\n1015 7\n930 2\n1200 10\nsum 930 1100\nnext 1015\nprev 900\n',
          out: '9\n1200 10\nнет\n',
        },
        { in: '1\n0 -3\nsum -5 5\nprev 1\n', out: '-3\n0 -3\n' },
      ],
      hidden: [
        { in: '2\n1 1\n2 2\nsum 3 4\nsum 2 1\n', name: 'Пустые диапазоны' },
        {
          in: '3\n10 1\n20 2\n30 3\nsum 10 30\nsum 10 10\nsum 11 29\n',
          name: 'Границы включительно',
        },
        { in: '3\n10 1\n20 2\n30 3\nnext 30\nnext 29\nnext -100\n', name: 'next' },
        { in: '3\n10 1\n20 2\n30 3\nprev 10\nprev 11\nprev 1000\n', name: 'prev' },
        {
          in: '2\n-1000000000 1000000\n1000000000 -1000000\nsum -1000000000 1000000000\n',
          name: 'Крайние времена',
        },
        { in: '4\n5 1\n1 1\n3 1\n2 1\nsum 1 3\nnext 3\nprev 3\n', name: 'Не по порядку' },
        { in: '1\n7 7\nnext 7\nprev 7\nsum 7 7\n', name: 'Одно измерение' },
        { in: '5\n1 10\n2 20\n3 30\n4 40\n5 50\nsum 2 4\nprev 2\nnext 4\n', name: 'Подряд' },
      ],
    },
  ],
};
