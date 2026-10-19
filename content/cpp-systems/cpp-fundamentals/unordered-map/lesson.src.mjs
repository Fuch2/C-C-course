const REPORT = (fixed) => String.raw`
#include <iostream>
${fixed ? '#include <map>\n' : ''}#include <string>
${fixed ? '' : '#include <unordered_map>\n'}
int main() {
    ${fixed ? 'std::map<std::string, int> count;' : 'std::unordered_map<std::string, int> count;'}
    std::string word;
    while (std::cin >> word) {
        ++count[word];
    }
    for (const auto &[w, c] : count) {
        std::cout << w << ' ' << c << '\n';
    }
    return 0;
}`;

export default {
  id: 'cpp20-unordered-map',
  title: 'Хеш-таблица std::unordered_map',
  description:
    'std::unordered_map как хеш-таблица стандартной библиотеки; общий с map интерфейс; неопределённый порядок обхода и упорядоченный вывод; сложность, коэффициент заполнения и reserve; требования к ключу; выбор между map и unordered_map.',
  moduleId: 'cpp-fundamentals',
  order: 24,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['cpp20-map'],
  objectives: [
    'Пользоваться std::unordered_map для быстрого поиска по ключу',
    'Получать упорядоченный вывод из неупорядоченного контейнера',
    'Объяснять сложность операций и роль коэффициента заполнения',
    'Выбирать между std::map и std::unordered_map',
  ],
  tags: ['C++', 'unordered_map', 'Хеш-таблица'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какова средняя сложность поиска по ключу в std::unordered_map?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correct: 0,
      explain:
        'Это хеш-таблица: в среднем O(1). В худшем случае, если ключи попали в одну корзину, — O(n).',
    },
    {
      q: 'В каком порядке обход std::unordered_map выдаёт элементы?',
      options: [
        'В неопределённом порядке, зависящем от хеш-функции и числа корзин',
        'По возрастанию ключей',
        'В порядке вставки',
        'По убыванию значений',
      ],
      correct: 0,
      explain:
        'Стандарт порядок не задаёт. Для упорядоченного вывода ключи сортируют или используют std::map.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int> m;
    m["a"] = 1;
    if (m["b"] == 0) {
        m["c"] = 3;
    }
    std::cout << m.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3'],
      placeholder: 'Вывод программы',
      explain:
        'Проверка через m["b"] создала ключ b со значением 0, затем добавился c: всего три элемента.',
    },
    {
      q: 'Какие типы можно использовать как ключ std::unordered_map без дополнительного кода?',
      options: ['int', 'std::string', 'std::pair<int, int>', 'char'],
      correct: [0, 1, 3],
      explain: 'Для std::pair стандартной хеш-функции нет. Для чисел, символов и строк — есть.',
    },
    {
      q: 'Когда лучше выбрать std::map, а не std::unordered_map?',
      options: [
        'Нужен обход в порядке ключей',
        'Нужны запросы «все ключи от a до b»',
        'Нужен только быстрый поиск по строковому ключу среди миллиона элементов',
        'Ключ — пара чисел, и писать хеш-функцию не хочется',
      ],
      correct: [0, 1, 3],
      explain:
        'Порядок, диапазоны и ключи без хеша — для дерева. Чистый поиск по ключу обычно быстрее в хеш-таблице.',
    },
    {
      q: 'Зачем вызывать reserve(n) перед вставкой n элементов?',
      options: [
        'Чтобы заранее выделить корзины и избежать перестроек таблицы при росте',
        'Чтобы элементы обходились по порядку',
        'Чтобы ограничить размер таблицы n элементами',
        'Без reserve вставка невозможна',
      ],
      correct: 0,
      explain:
        'Каждая перестройка перераспределяет все элементы. reserve делает это один раз заранее.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<int, int> seen;
    int data[] = {5, 3, 5, 7, 3, 5};
    for (int x : data) {
        ++seen[x];
    }
    std::cout << seen.size() << ' ' << seen[5] << ' ' << seen.count(9) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 3 0'],
      placeholder: 'Вывод программы',
      explain:
        'Различных значений три (5, 3, 7); пятёрка встретилась трижды; count не создаёт ключ 9 и возвращает 0.',
    },
    {
      q: 'Что делает таблица, когда load_factor() превышает max_load_factor()?',
      options: [
        'Увеличивает число корзин и перераспределяет все элементы',
        'Отказывается вставлять новые элементы',
        'Удаляет старые элементы',
        'Ничего',
      ],
      correct: 0,
      explain:
        'Это рост с перераспределением из урока о хеш-таблицах: амортизированно O(1) на вставку.',
    },
  ],
  exercises: [
    {
      title: 'Первый повтор',
      difficulty: 'beginner',
      description: `
До конца ввода идут целые числа. Найдите первое число, которое встретилось повторно (то, чьё второе появление раньше всех остальных повторов), и напечатайте \`значение V, позиции I J\` — номера первого и второго появления (с 1). Если повторов нет, напечатайте \`повторов нет\`.

Решите задачу за \`O(n)\` в среднем с \`std::unordered_map\`.`,
      constraints: ['Чисел не больше 10⁴; |числа| ≤ 10¹⁸.'],
      hints: [
        'Храните для каждого значения позицию первого появления: std::unordered_map<long long, int> first.',
        'Для очередного числа: если оно уже есть в first — это ответ, печатайте и завершайте программу; иначе запомните позицию.',
      ],
      solution: String.raw`
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<long long, int> first;
    long long x;
    int position = 0;
    while (std::cin >> x) {
        position++;
        auto it = first.find(x);
        if (it != first.end()) {
            std::cout << "значение " << x << ", позиции " << it->second << ' ' << position << '\n';
            return 0;
        }
        first[x] = position;
    }
    std::cout << "повторов нет\n";
    return 0;
}`,
      explanation: `
Первый повтор — первое число, которое уже есть в таблице в момент чтения. Поиск \`find\` в хеш-таблице — \`O(1)\` в среднем, весь проход — \`O(n)\`. Без таблицы пришлось бы сравнивать каждое число со всеми предыдущими — \`O(n²)\`.

Порядок обхода таблицы здесь не нужен: таблица только отвечает на вопрос «встречалось ли значение и где». Числа до 10¹⁸ — ключи \`long long\`; прямая адресация из модуля «Алгоритмы» на таком диапазоне невозможна.`,
      examples: [
        { in: '3 1 4 1 5 9 2 6 5\n', out: 'значение 1, позиции 2 4\n' },
        { in: '1 2 3\n', out: 'повторов нет\n' },
      ],
      hidden: [
        '',
        '7 7\n',
        '1 2 3 2 1\n',
        '5 6 7 8 5 6\n',
        '1000000000000000000 -1 1000000000000000000\n',
        '0 1 2 3 4 5 6 7 8 9 0\n',
        '-3 3 -3 3\n',
        '9 8 7 8 9\n',
      ],
    },
    {
      title: 'Анаграммы',
      description: `
До конца ввода идут слова из строчных латинских букв. Сгруппируйте анаграммы — слова из одних и тех же букв — и напечатайте каждую группу в отдельной строке: слова группы в алфавитном порядке через пробел (повторы слов сохраняются). Группы упорядочьте по первому слову.

Используйте \`std::unordered_map<std::string, std::vector<std::string>>\`, где ключ — буквы слова, отсортированные по алфавиту.`,
      constraints: ['Слов не больше 1000; длина слова до 20.'],
      hints: [
        'Ключ группы: std::string key = word; std::sort(key.begin(), key.end()); — у анаграмм ключи совпадают. groups[key].push_back(word).',
        'Порядок групп в unordered_map не определён: переложите группы в вектор, отсортируйте слова внутри каждой группы, затем сами группы — по первому слову.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    std::unordered_map<std::string, std::vector<std::string>> groups;
    std::string word;
    while (std::cin >> word) {
        std::string key = word;
        std::sort(key.begin(), key.end());
        groups[key].push_back(word);
    }
    std::vector<std::vector<std::string>> result;
    for (auto &[key, words] : groups) {
        std::sort(words.begin(), words.end());
        result.push_back(words);
    }
    std::sort(result.begin(), result.end());
    for (const auto &group : result) {
        for (std::size_t i = 0; i < group.size(); i++) {
            std::cout << (i ? " " : "") << group[i];
        }
        std::cout << '\n';
    }
    return 0;
}`,
      explanation: `
Анаграммы — слова с одинаковым набором букв, а набор букв удобно представить отсортированной строкой: \`listen\` и \`silent\` дают одинаковый ключ \`eilnst\`. Значение в таблице — вектор слов группы, и \`groups[key].push_back(word)\` создаёт пустой вектор для новой группы — здесь создание по \`operator[]\` полезно.

Таблица группирует за \`O(1)\` на слово (плюс сортировка букв), но порядок групп в ней случаен. Поэтому группы перекладываются в вектор и сортируются: векторы строк сравниваются лексикографически, то есть по первому слову, затем по второму. Так вывод одинаков на любом компиляторе.`,
      examples: [
        {
          in: 'listen silent enlist google tinsel cat act\n',
          out: 'act cat\nenlist listen silent tinsel\ngoogle\n',
        },
        { in: 'a\n', out: 'a\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'ab ba ab\n', name: 'Повтор слова' },
        { in: 'abc def ghi\n', name: 'Без анаграмм' },
        { in: 'stop pots tops opts post spot\n', name: 'Большая группа' },
        { in: 'z y x zz\n', name: 'Разные длины' },
        { in: 'dusty study night thing\n', name: 'Две группы' },
        { in: 'aab aba baa abb\n', name: 'Похожие наборы' },
        { in: 'evil vile live veil a\n', name: 'С одиночкой' },
      ],
    },
    {
      title: 'Найди ошибку: отчёт по словам',
      bug: true,
      description: `
Программа читает слова до конца ввода и печатает каждое различное слово и число его вхождений **в алфавитном порядке**.

Слова печатаются не по алфавиту. Найдите и исправьте ошибку.`,
      constraints: ['Слов не больше 1000; слова из латинских букв.'],
      hints: [
        'В каком порядке обход std::unordered_map выдаёт элементы?',
        'Порядок обхода хеш-таблицы не определён. Используйте std::map — он обходит ключи по возрастанию, — или отсортируйте пары перед печатью.',
      ],
      starter: REPORT(false),
      solution: REPORT(true),
      explanation: `
\`std::unordered_map\` — хеш-таблица, и обход идёт по корзинам, а не по ключам. Порядок зависит от хеш-функции, числа корзин и истории вставок; стандарт его не определяет. На одних данных он может случайно совпасть с алфавитным, на других — нет, а на другом компиляторе — оказаться иным.

Если вывод должен быть упорядоченным, проще всего взять \`std::map\`: интерфейс тот же, а обход идёт по возрастанию ключей. Если данных много и важна скорость подсчёта, считают в \`unordered_map\`, а перед печатью перекладывают пары в вектор и сортируют.`,
      examples: [
        { in: 'to be or not to be\n', out: 'be 2\nnot 1\nor 1\nto 2\n' },
        { in: 'z\n', out: 'z 1\n' },
      ],
      hidden: [
        'banana apple cherry\n',
        'd c b a\n',
        'one two three four five six seven\n',
        'x y z x y z\n',
        'alpha beta gamma delta epsilon\n',
        'zeta eta theta iota kappa lambda mu\n',
        'b a\n',
        'red green blue red green red\n',
      ],
    },
    {
      title: 'Отрезки с заданной суммой',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\` и \`k\`, вторая — \`n\` целых чисел (возможно отрицательных). Напечатайте, сколько существует отрезков подряд идущих элементов с суммой ровно \`k\`.

Перебор всех отрезков — \`O(n²)\`; решите задачу за \`O(n)\` в среднем: префиксные суммы и хеш-таблица.`,
      constraints: ['1 ≤ n ≤ 10⁵; |числа| ≤ 10⁴; |k| ≤ 10⁹.'],
      hints: [
        'Сумма отрезка (i, j] — это prefix[j] − prefix[i]. Отрезок, кончающийся в j, имеет сумму k, если prefix[i] = prefix[j] − k для некоторого i < j.',
        'Идите по массиву, поддерживая текущую префиксную сумму и таблицу «значение префиксной суммы → сколько раз встречалось». Перед первым элементом встречалась сумма 0.',
        'Для каждого j прибавьте к ответу count[prefix − k], затем увеличьте count[prefix]. Ответ бывает до n²/2 — long long.',
      ],
      solution: String.raw`
#include <iostream>
#include <unordered_map>

int main() {
    int n;
    long long k;
    if (!(std::cin >> n >> k) || n < 1) {
        return 0;
    }
    std::unordered_map<long long, long long> count;
    count.reserve(static_cast<std::size_t>(n) + 1);
    count[0] = 1;
    long long prefix = 0, answer = 0;
    for (int j = 0; j < n; j++) {
        long long x;
        std::cin >> x;
        prefix += x;
        auto it = count.find(prefix - k);
        if (it != count.end()) {
            answer += it->second;
        }
        ++count[prefix];
    }
    std::cout << answer << '\n';
    return 0;
}`,
      explanation: `
Отрезок с суммой \`k\`, кончающийся в позиции \`j\`, — это более ранняя префиксная сумма, равная \`prefix_j − k\`. Если таблица помнит, сколько раз каждое значение префиксной суммы уже встречалось, то число таких отрезков — одно обращение к таблице. Пустой префикс (сумма 0 до первого элемента) записан заранее: он отвечает за отрезки, начинающиеся с первого элемента.

С отрицательными числами двух указателей из модуля «Алгоритмы» не хватит: сумма окна не монотонна. Хеш-таблица решает задачу за \`O(n)\` в среднем; поиск идёт через \`find\`, чтобы не создавать ключи для каждой проверки — иначе таблица разрасталась бы вдвое. \`reserve\` выделяет корзины сразу под все префиксные суммы.`,
      examples: [
        { in: '5 3\n1 2 1 2 1\n', out: '4\n' },
        { in: '4 0\n1 -1 1 -1\n', out: '4\n' },
      ],
      hidden: [
        { in: '1 5\n5\n', name: 'Один элемент' },
        { in: '1 5\n4\n', name: 'Нет отрезков' },
        { in: '5 0\n0 0 0 0 0\n', name: 'Все нули' },
        { in: '6 2\n1 1 1 1 1 1\n', name: 'Единицы' },
        { in: '5 -3\n-1 -2 3 -3 0\n', name: 'Отрицательная сумма' },
        { in: '4 1000000000\n1 2 3 4\n', name: 'Недостижимая сумма' },
        { in: '6 5\n2 3 -1 4 1 -2\n', name: 'Смешанные' },
        { in: '7 0\n3 -3 3 -3 3 -3 3\n', name: 'Чередование' },
      ],
    },
  ],
};
