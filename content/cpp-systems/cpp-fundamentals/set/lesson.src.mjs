const ORDERS = (fixed) => String.raw`
#include <iostream>
#include <set>
#include <string>

int main() {
    std::multiset<int> orders;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            int price;
            std::cin >> price;
            orders.insert(price);
        } else if (command == "remove") {
            int price;
            std::cin >> price;
            auto it = orders.find(price);
            if (it == orders.end()) {
                std::cout << "нет такой\n";
            } else {
                orders.erase(${fixed ? 'it' : 'price'});
            }
        } else if (command == "best") {
            if (orders.empty()) {
                std::cout << "пусто\n";
            } else {
                int best = *orders.begin();
                std::cout << best << " x" << orders.count(best) << '\n';
            }
        }
    }
    return 0;
}`;

export default {
  id: 'cpp20-set',
  title: 'Множества std::set и std::unordered_set',
  description:
    'Упорядоченное множество std::set: уникальность, insert с признаком вставки, contains, erase, минимум и максимум; ближайшие значения через lower_bound; std::multiset и ловушка erase; хеш-множество std::unordered_set; операции над множествами.',
  moduleId: 'cpp-fundamentals',
  order: 25,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['cpp20-unordered-map'],
  objectives: [
    'Хранить уникальные значения в std::set и std::unordered_set',
    'Находить ближайшие значения в меняющемся множестве',
    'Правильно удалять элементы из std::multiset',
    'Вычислять пересечение и разность упорядоченных наборов',
  ],
  tags: ['C++', 'set', 'multiset', 'unordered_set'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <set>

int main() {
    std::set<int> s = {3, 1, 3, 2, 1};
    s.insert(5);
    s.insert(2);
    for (int x : s) {
        std::cout << x;
    }
    std::cout << ' ' << s.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1235 4'],
      placeholder: 'Вывод программы',
      explain:
        'Повторы не хранятся: {1, 2, 3}, затем добавляется 5, а 2 уже есть. Обход — по возрастанию.',
    },
    {
      q: 'Что возвращает s.insert(x).second?',
      options: [
        'true, если x был добавлен, и false, если он уже был в множестве',
        'Количество элементов после вставки',
        'Итератор на вставленный элемент',
        'Всегда true',
      ],
      correct: 0,
      explain: 'insert возвращает пару: итератор на элемент и признак, произошла ли вставка.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <set>

int main() {
    std::multiset<int> m = {7, 7, 7, 3};
    m.erase(m.find(7));
    std::cout << m.size() << ' ';
    m.erase(7);
    std::cout << m.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 1'],
      placeholder: 'Вывод программы',
      explain: 'erase по итератору удаляет одну семёрку, erase по значению — все оставшиеся.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <set>

int main() {
    std::set<int> s = {10, 20, 30};
    std::cout << *s.lower_bound(15) << ' ' << *s.upper_bound(20) << ' ' << *s.rbegin() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['20 30 30'],
      placeholder: 'Вывод программы',
      explain:
        'lower_bound(15) — первое не меньше 15, upper_bound(20) — первое больше 20, rbegin — наибольший элемент.',
    },
    {
      q: 'Почему нельзя написать *s.begin() = 0; для std::set<int> s?',
      options: [
        'Элементы множества константные: изменение нарушило бы порядок дерева',
        'begin() у множества не существует',
        'Множество нельзя изменять вовсе',
        'Можно',
      ],
      correct: 0,
      explain: 'Чтобы изменить значение, удалите старое и вставьте новое.',
    },
    {
      q: 'Какое множество выбрать, чтобы просто проверять «встречалось ли значение» среди миллиона чисел без требований к порядку?',
      options: [
        'std::unordered_set',
        'std::set',
        'std::multiset',
        'std::vector с линейным поиском',
      ],
      correct: 0,
      explain:
        'Хеш-множество проверяет и добавляет за O(1) в среднем. set — O(log n), вектор с поиском — O(n) на запрос.',
    },
    {
      q: 'Какое условие обязательно для std::set_intersection(a.begin(), a.end(), b.begin(), b.end(), out)?',
      options: [
        'Оба диапазона отсортированы',
        'Оба диапазона одной длины',
        'В диапазонах нет отрицательных чисел',
        'Диапазоны — обязательно std::set',
      ],
      correct: 0,
      explain:
        'Алгоритм сливает два отсортированных диапазона за один проход. Подойдут и отсортированные векторы.',
    },
    {
      q: 'Какие утверждения о std::set верны?',
      options: [
        'Вставка и поиск выполняются за O(log n)',
        'Обход выдаёт элементы по возрастанию',
        'Элемент можно хранить дважды',
        '*s.begin() — наименьший элемент',
      ],
      correct: [0, 1, 3],
      explain: 'Повторы разрешены только в std::multiset.',
    },
  ],
  exercises: [
    {
      title: 'Различные числа',
      difficulty: 'beginner',
      description: `
До конца ввода идут целые числа. Напечатайте строку \`различных: K\`, а на следующей — различные числа по возрастанию через пробел (пустая строка, если чисел нет).`,
      constraints: ['Чисел не больше 10⁴; |числа| ≤ 10⁹.'],
      hints: [
        'Вставляйте числа в std::set<long long> — повторы отбросятся сами.',
        'Обход множества уже идёт по возрастанию.',
      ],
      solution: String.raw`
#include <iostream>
#include <set>

int main() {
    std::set<long long> values;
    long long x;
    while (std::cin >> x) {
        values.insert(x);
    }
    std::cout << "различных: " << values.size() << '\n';
    bool first = true;
    for (long long v : values) {
        std::cout << (first ? "" : " ") << v;
        first = false;
    }
    std::cout << '\n';
    return 0;
}`,
      explanation: `
Множество само поддерживает два инварианта: каждое значение хранится один раз, и значения упорядочены. Поэтому задача сводится к вставкам и обходу — \`O(n log n)\`. Та же задача на векторе потребовала бы сортировки и \`std::unique\` (урок о цикле по диапазону).`,
      examples: [
        { in: '3 1 4 1 5 9 2 6 5\n', out: 'различных: 7\n1 2 3 4 5 6 9\n' },
        { in: '', out: 'различных: 0\n\n' },
      ],
      hidden: [
        '7\n',
        '2 2 2 2\n',
        '-1 1 -1 1\n',
        '1000000000 -1000000000 0\n',
        '5 4 3 2 1\n',
        '1 2 3 4 5\n',
        '0 0 0 1\n',
        '10 9 10 8 9 7\n',
      ],
    },
    {
      title: 'Ближайшее значение',
      description: `
Выполните команды над множеством целых чисел:

- \`add x\` — добавить \`x\`;
- \`del x\` — удалить \`x\`, если есть;
- \`near x\` — напечатать значение из множества, ближайшее к \`x\` (при равном расстоянии — меньшее), или \`пусто\`.

Каждая команда — \`O(log n)\`.`,
      constraints: ['Команд не больше 10⁴; |x| ≤ 10⁹.'],
      hints: [
        'auto it = s.lower_bound(x) — первое значение ≥ x. Кандидаты на ответ — *it (если it != end()) и предыдущее значение std::prev(it) (если it != begin()).',
        'Сравните расстояния; при равенстве выберите меньшее значение, то есть левого кандидата.',
      ],
      solution: String.raw`
#include <iostream>
#include <iterator>
#include <set>
#include <string>

int main() {
    std::set<long long> s;
    std::string command;
    long long x;
    while (std::cin >> command >> x) {
        if (command == "add") {
            s.insert(x);
        } else if (command == "del") {
            s.erase(x);
        } else if (command == "near") {
            if (s.empty()) {
                std::cout << "пусто\n";
                continue;
            }
            auto right = s.lower_bound(x);
            if (right == s.end()) {
                std::cout << *std::prev(right) << '\n';
            } else if (right == s.begin()) {
                std::cout << *right << '\n';
            } else {
                long long a = *std::prev(right), b = *right;
                std::cout << (x - a <= b - x ? a : b) << '\n';
            }
        }
    }
    return 0;
}`,
      explanation: `
Ближайшее к \`x\` значение — либо наименьшее не меньше \`x\` (\`lower_bound\`), либо наибольшее меньше \`x\` (предыдущий элемент). Оба находятся за \`O(log n)\`, и между запросами множество может меняться — в этом преимущество перед отсортированным вектором, где вставка стоит \`O(n)\`.

Крайние случаи: если все значения меньше \`x\`, \`lower_bound\` вернёт \`end()\` и ответ — последний элемент; если все не меньше — \`begin()\` и ответ — первый. Разыменовывать \`end()\` и брать \`prev(begin())\` нельзя, поэтому эти случаи разобраны явно.`,
      examples: [
        { in: 'add 3\nadd 8\nnear 5\nnear 6\nnear 100\n', out: '3\n8\n8\n' },
        { in: 'near 1\nadd 1\ndel 1\nnear 1\n', out: 'пусто\nпусто\n' },
      ],
      hidden: [
        { in: 'add 10\nnear 10\nnear -5\n', name: 'Одно значение' },
        { in: 'add 1\nadd 5\nnear 3\n', name: 'Равное расстояние' },
        { in: 'add -1000000000\nadd 1000000000\nnear 0\n', name: 'Крайние значения' },
        { in: 'add 2\nadd 4\nadd 6\ndel 4\nnear 4\nnear 5\n', name: 'После удаления' },
        { in: 'add 7\nadd 7\ndel 7\nnear 7\n', name: 'Повторная вставка' },
        { in: 'add 1\nadd 2\nadd 3\nnear 2\nnear 0\nnear 4\n', name: 'Совпадение' },
        { in: 'del 5\nadd 5\nnear 9\n', name: 'Удаление отсутствующего' },
        { in: 'add 100\nadd 200\nadd 300\nnear 249\nnear 251\nnear 250\n', name: 'Около середины' },
      ],
    },
    {
      title: 'Найди ошибку: биржевой стакан',
      bug: true,
      description: `
Программа хранит цены заявок в \`std::multiset<int>\` (одинаковых заявок может быть несколько) и выполняет команды:

- \`add p\` — добавить заявку с ценой \`p\`;
- \`remove p\` — снять **одну** заявку с ценой \`p\` или напечатать \`нет такой\`;
- \`best\` — напечатать наименьшую цену и число заявок по ней: \`p xK\`, или \`пусто\`.

После снятия одной заявки исчезают и другие с той же ценой. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 1000; 1 ≤ p ≤ 10⁶.'],
      hints: [
        'Сколько элементов удаляет multiset::erase, если передать ему значение?',
        'erase(значение) удаляет все копии. Чтобы удалить одну, передайте итератор, который уже нашёл find: orders.erase(it).',
      ],
      starter: ORDERS(false),
      solution: ORDERS(true),
      explanation: `
У \`std::multiset\` два вида \`erase\`: по значению — удаляет **все** элементы с этим значением и возвращает их число; по итератору — удаляет ровно один элемент. Заготовка нашла заявку через \`find\`, но удалила по значению и сняла все заявки с этой ценой.

Исправление — передать в \`erase\` найденный итератор. Проверка \`it == end()\` перед удалением обязательна: \`erase(end())\` — неопределённое поведение. В \`std::set\` эта разница незаметна — там значение встречается один раз, — поэтому ловушка проявляется именно при переходе на \`multiset\`.`,
      examples: [
        { in: 'add 100\nadd 100\nadd 120\nremove 100\nbest\n', out: '100 x1\n' },
        { in: 'remove 5\nbest\n', out: 'нет такой\nпусто\n' },
      ],
      hidden: [
        'add 1\nadd 1\nadd 1\nremove 1\nremove 1\nbest\n',
        'add 50\nremove 50\nbest\n',
        'add 10\nadd 20\nadd 10\nremove 10\nbest\nremove 10\nbest\n',
        'add 7\nadd 7\nbest\n',
        'add 3\nadd 3\nadd 2\nremove 3\nremove 2\nbest\n',
        'add 1000000\nadd 1000000\nremove 1000000\nbest\n',
        'remove 1\nadd 1\nadd 1\nremove 1\nbest\n',
        'add 9\nadd 8\nadd 8\nadd 8\nremove 8\nbest\n',
      ],
    },
    {
      title: 'Сравнение списков',
      difficulty: 'advanced',
      description: `
Ввод — две строки целых чисел (в каждой могут быть повторы; строка может быть пустой). Напечатайте три строки:

- \`общие: …\` — различные числа, которые есть в обоих списках;
- \`только в первом: …\` — различные числа только первого списка;
- \`только во втором: …\` — различные числа только второго.

Числа — по возрастанию через пробел; если их нет — \`нет\`. Используйте \`std::set_intersection\` и \`std::set_difference\`.`,
      constraints: ['В каждой строке не больше 1000 чисел; |числа| ≤ 10⁹.'],
      hints: [
        'Прочитайте каждую строку через std::getline и std::istringstream в std::set<long long> — повторы исчезнут, а порядок станет возрастающим.',
        'std::set_intersection(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(result)) записывает общие элементы в вектор. set_difference(a, b) — элементы a, которых нет в b.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <iterator>
#include <set>
#include <sstream>
#include <string>
#include <vector>

std::set<long long> read_line() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream in(line);
    std::set<long long> result;
    long long x;
    while (in >> x) {
        result.insert(x);
    }
    return result;
}

void print(const std::string &title, const std::vector<long long> &values) {
    std::cout << title << ':';
    if (values.empty()) {
        std::cout << " нет";
    }
    for (long long v : values) {
        std::cout << ' ' << v;
    }
    std::cout << '\n';
}

int main() {
    std::set<long long> a = read_line();
    std::set<long long> b = read_line();
    std::vector<long long> both, only_a, only_b;
    std::set_intersection(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(both));
    std::set_difference(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(only_a));
    std::set_difference(b.begin(), b.end(), a.begin(), a.end(), std::back_inserter(only_b));
    print("общие", both);
    print("только в первом", only_a);
    print("только во втором", only_b);
    return 0;
}`,
      explanation: `
Множества убирают повторы и упорядочивают значения — именно это требуется алгоритмам \`std::set_intersection\` и \`std::set_difference\`: они сливают два отсортированных диапазона за один проход, как слияние в сортировке слиянием, — \`O(n + m)\`. Результат пишется через \`std::back_inserter\`: итератор, который превращает каждую запись в \`push_back\`.

Порядок аргументов \`set_difference\` важен: \`(a, b)\` — элементы \`a\` без элементов \`b\`, \`(b, a)\` — наоборот. Функция \`read_line\` возвращает множество по значению — без копирования, как и векторы.`,
      examples: [
        {
          in: '1 2 3 4 5\n4 5 6 7\n',
          out: 'общие: 4 5\nтолько в первом: 1 2 3\nтолько во втором: 6 7\n',
        },
        { in: '1 1 1\n1\n', out: 'общие: 1\nтолько в первом: нет\nтолько во втором: нет\n' },
      ],
      hidden: [
        { in: '\n\n', name: 'Обе пустые' },
        { in: '1 2 3\n\n', name: 'Вторая пустая' },
        { in: '\n4 5\n', name: 'Первая пустая' },
        { in: '1 2\n3 4\n', name: 'Без общих' },
        { in: '5 4 3 2 1\n1 2 3 4 5\n', name: 'Одинаковые наборы' },
        { in: '-1 0 1\n0 0 0\n', name: 'Отрицательные и повторы' },
        { in: '1000000000 -1000000000\n-1000000000\n', name: 'Крайние значения' },
        { in: '2 4 6 8 10\n3 6 9\n', name: 'Кратные' },
      ],
    },
  ],
};
