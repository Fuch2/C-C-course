const BONUS = (fixed) => String.raw`
#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    std::vector<std::pair<std::string, int>> people;
    for (int i = 0; i < n; i++) {
        std::string name;
        int score;
        std::cin >> name >> score;
        people.push_back({name, score});
    }
    std::string command;
    while (std::cin >> command) {
        if (command == "bonus") {
            int k;
            std::cin >> k;
            for (${fixed ? 'auto &' : 'auto '}[name, score] : people) {
                score += k;
            }
        } else if (command == "show") {
            for (const auto &[name, score] : people) {
                std::cout << name << ' ' << score << '\n';
            }
        }
    }
    return 0;
}`;

export default {
  id: 'cpp20-pair',
  title: 'Пары std::pair и структурные привязки',
  description:
    'std::pair: поля first и second, создание и вывод типов; лексикографическое сравнение и сортировка пар; функция, возвращающая два значения; структурные привязки для пар, массивов и структур; копия или ссылка в привязке.',
  moduleId: 'cpp-fundamentals',
  order: 20,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-deque'],
  objectives: [
    'Создавать пары и обращаться к их полям',
    'Сортировать векторы пар с учётом лексикографического сравнения',
    'Возвращать из функции пару и раскладывать её структурной привязкой',
    'Выбирать между копией и ссылкой в структурной привязке',
  ],
  tags: ['C++', 'pair', 'Структурные привязки'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <utility>

int main() {
    std::pair<int, int> a{2, 9}, b{3, 1};
    std::cout << (a < b) << ' ' << (std::make_pair(2, 9) < std::make_pair(2, 10)) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 1'],
      placeholder: 'Вывод программы',
      explain:
        'Сначала сравниваются first: 2 < 3. Во втором сравнении first равны, и решает second: 9 < 10.',
    },
    {
      q: 'В каком порядке std::sort расположит пары {2, 1}, {1, 5}, {2, 0}?',
      options: [
        '{1, 5}, {2, 0}, {2, 1}',
        '{2, 0}, {2, 1}, {1, 5}',
        '{2, 1}, {2, 0}, {1, 5}',
        '{1, 5}, {2, 1}, {2, 0}',
      ],
      correct: 0,
      explain: 'По first: 1, затем двойки; среди двоек — по second: 0, затем 1.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <utility>

std::pair<int, int> sum_diff(int a, int b) {
    return {a + b, a - b};
}

int main() {
    auto [s, d] = sum_diff(7, 3);
    std::cout << s * d << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['40'],
      placeholder: 'Вывод программы',
      explain: 'Сумма 10, разность 4, произведение 40.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <utility>

int main() {
    std::pair<int, int> p{1, 2};
    auto [a, b] = p;
    auto &[c, d] = p;
    a = 10;
    d = 20;
    std::cout << p.first << ' ' << p.second << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 20'],
      placeholder: 'Вывод программы',
      explain: 'a — часть копии пары, изменение не затрагивает p. d ссылается на p.second.',
    },
    {
      q: 'С чем работают структурные привязки?',
      options: [
        'std::pair',
        'Массив фиксированного размера',
        'Структура с открытыми полями',
        'std::vector произвольного размера',
      ],
      correct: [0, 1, 2],
      explain:
        'Число переменных в привязке должно быть известно при компиляции, а размер вектора — нет.',
    },
    {
      q: 'Какой тип у p в объявлении auto p = std::make_pair(1, 2.5);?',
      options: [
        'std::pair<int, double>',
        'std::pair<double, double>',
        'std::pair<int, int>',
        'std::pair<auto, auto>',
      ],
      correct: 0,
      explain: 'make_pair выводит типы полей из аргументов: 1 — int, 2.5 — double.',
    },
    {
      q: 'Как отсортировать слова по убыванию частоты, а при равной частоте — по алфавиту, не написав функцию сравнения?',
      options: [
        'Сортировать пары (−частота, слово)',
        'Сортировать пары (частота, слово)',
        'Сортировать пары (слово, частота)',
        'Без функции сравнения нельзя',
      ],
      correct: 0,
      explain:
        'Пары сортируются по first по возрастанию, и знак минус превращает возрастание в убывание частоты. При равенстве — по second, то есть по алфавиту.',
    },
    {
      q: 'Что не так в цикле for (auto [name, score] : scores) score++;?',
      options: [
        'Каждая пара копируется, и изменение score не попадает в вектор',
        'Структурные привязки нельзя использовать в цикле',
        'score — константа',
        'Ничего',
      ],
      correct: 0,
      explain: 'auto без & — копия. Для изменения элементов нужно auto &[name, score].',
    },
  ],
  exercises: [
    {
      title: 'Минимум и максимум',
      difficulty: 'beginner',
      description: `
До конца ввода идут целые числа. Напишите функцию \`std::pair<long long, long long> min_max(const std::vector<long long> &v)\` и напечатайте \`минимум A, максимум B\`, разложив результат структурной привязкой. Если чисел нет, напечатайте \`пусто\`.`,
      constraints: ['Чисел не больше 1000; |числа| ≤ 10¹⁸.'],
      hints: [
        'Внутри функции: lo = hi = v[0], затем цикл; return {lo, hi};.',
        'В main: auto [lo, hi] = min_max(v); — проверьте пустоту до вызова, иначе v[0] не существует.',
      ],
      solution: String.raw`
#include <iostream>
#include <utility>
#include <vector>

std::pair<long long, long long> min_max(const std::vector<long long> &v) {
    long long lo = v[0], hi = v[0];
    for (long long x : v) {
        if (x < lo) {
            lo = x;
        }
        if (x > hi) {
            hi = x;
        }
    }
    return {lo, hi};
}

int main() {
    std::vector<long long> v;
    long long x;
    while (std::cin >> x) {
        v.push_back(x);
    }
    if (v.empty()) {
        std::cout << "пусто\n";
        return 0;
    }
    auto [lo, hi] = min_max(v);
    std::cout << "минимум " << lo << ", максимум " << hi << '\n';
    return 0;
}`,
      explanation: `
Функция возвращает два результата одним значением — парой, а вызывающий раскладывает её по переменным с понятными именами. Это нагляднее параметров-ссылок: по сигнатуре видно, что функция ничего не меняет и что именно возвращает.

\`return {lo, hi};\` создаёт пару нужного типа из фигурных скобок — тип известен из объявления функции. Пустой вектор проверяется до вызова: \`v[0]\` у него нет.`,
      examples: [
        { in: '4 -2 9 0\n', out: 'минимум -2, максимум 9\n' },
        { in: '', out: 'пусто\n' },
      ],
      hidden: [
        '7\n',
        '-1 -1 -1\n',
        '1000000000000000000 -1000000000000000000\n',
        '1 2 3 4 5\n',
        '5 4 3 2 1\n',
        '0 0\n',
        '3\n-3\n',
        '-5 10 -20 15\n',
      ],
    },
    {
      title: 'Точки на плоскости',
      description: `
Первая строка — \`n\`, дальше \`n\` строк с координатами \`x y\`. Отсортируйте точки по \`x\`, при равных \`x\` — по \`y\`, удалите повторяющиеся и напечатайте каждую оставшуюся точку в формате \`(x, y)\` по одной в строке. Последней строкой напечатайте \`повторов: K\`.

Храните точки в \`std::vector<std::pair<int, int>>\`.`,
      constraints: ['1 ≤ n ≤ 1000; |x|, |y| ≤ 10⁹.'],
      hints: [
        'std::sort для вектора пар уже сортирует по first, затем по second — функция сравнения не нужна.',
        'Повторы после сортировки стоят рядом: v.erase(std::unique(v.begin(), v.end()), v.end()). Повторов — разность размеров до и после.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<std::pair<int, int>> points(static_cast<std::size_t>(n));
    for (auto &[x, y] : points) {
        std::cin >> x >> y;
    }
    std::sort(points.begin(), points.end());
    std::size_t before = points.size();
    points.erase(std::unique(points.begin(), points.end()), points.end());
    for (const auto &[x, y] : points) {
        std::cout << '(' << x << ", " << y << ")\n";
    }
    std::cout << "повторов: " << before - points.size() << '\n';
    return 0;
}`,
      explanation: `
Лексикографическое сравнение пар — ровно тот порядок, который нужен: сначала \`x\`, при равенстве \`y\`. Поэтому \`std::sort\` работает без лямбды, а \`std::unique\` сравнивает пары целиком оператором \`==\`.

Чтение идёт через структурную привязку по ссылке \`auto &[x, y]\` — значения попадают прямо в поля пары. Печать — через \`const auto &[x, y]\`: без копирования и с понятными именами вместо \`first\` и \`second\`.`,
      examples: [
        { in: '4\n3 1\n1 9\n3 1\n1 2\n', out: '(1, 2)\n(1, 9)\n(3, 1)\nповторов: 1\n' },
        { in: '1\n0 0\n', out: '(0, 0)\nповторов: 0\n' },
      ],
      hidden: [
        '3\n5 5\n5 5\n5 5\n',
        '3\n2 1\n1 2\n0 3\n',
        '4\n1 3\n1 1\n1 2\n1 0\n',
        '2\n-1000000000 1000000000\n1000000000 -1000000000\n',
        '5\n0 0\n0 0\n1 1\n1 1\n0 1\n',
        '3\n-1 -1\n-1 -2\n-2 -1\n',
        '4\n7 7\n7 6\n6 7\n6 6\n',
        '2\n3 4\n4 3\n',
      ],
    },
    {
      title: 'Найди ошибку: прибавка к баллам',
      bug: true,
      description: `
Первая строка — \`n\`, дальше \`n\` строк \`имя балл\`. Затем команды: \`bonus k\` — прибавить \`k\` к баллу каждого, \`show\` — напечатать всех: \`имя балл\`.

Прибавки не применяются. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 100; |баллы|, |k| ≤ 1000; команд не больше 100.'],
      hints: [
        'Чем являются name и score в привязке auto [name, score] — полями элементов вектора или полями копии?',
        'auto без & копирует каждую пару. Чтобы изменить элементы вектора, нужна привязка по ссылке: auto &[name, score].',
      ],
      starter: BONUS(false),
      solution: BONUS(true),
      explanation: `
Структурная привязка \`auto [name, score] = элемент\` сначала создаёт **копию** элемента, а \`name\` и \`score\` — имена полей этой копии. Прибавка меняет копию, которая исчезает в конце итерации, и вектор остаётся прежним. Это то же правило, что для обычного \`auto\` в цикле по диапазону.

С \`auto &[name, score]\` копии нет: имена связаны с полями самого элемента вектора. Для печати используется \`const auto &[name, score]\` — без копирования и без права изменять.`,
      examples: [
        { in: '2\nAda 90\nAlan 85\nbonus 5\nshow\n', out: 'Ada 95\nAlan 90\n' },
        { in: '1\nX 0\nshow\n', out: 'X 0\n' },
      ],
      hidden: [
        '1\nA 1\nbonus 1\nbonus 1\nshow\n',
        '2\nA 10\nB 20\nbonus -5\nshow\n',
        '3\nA 0\nB 0\nC 0\nshow\nbonus 100\nshow\n',
        '1\nZ -1000\nbonus 1000\nshow\n',
        '2\nP 5\nQ 6\nbonus 0\nshow\n',
        '2\nM 1\nN 2\nbonus 3\nbonus -1\nshow\n',
        '1\nSolo 42\nbonus 8\nshow\nbonus 50\nshow\n',
        '3\nX 1\nY 2\nZ 3\nbonus 10\nshow\n',
      ],
    },
    {
      title: 'Объединение интервалов',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\`, дальше \`n\` интервалов \`l r\` (\`l ≤ r\`). Объедините пересекающиеся и соприкасающиеся интервалы (\`[1, 3]\` и \`[3, 5]\` → \`[1, 5]\`; \`[1, 2]\` и \`[3, 4]\` остаются раздельными). Напечатайте получившиеся интервалы по возрастанию в формате \`[l, r]\`, а последней строкой — \`длина: L\`, суммарную длину интервалов (сумма \`r − l\`).`,
      constraints: ['1 ≤ n ≤ 10⁴; |l|, |r| ≤ 10⁹.'],
      hints: [
        'Отсортируйте вектор пар (l, r) — по началу, затем по концу.',
        'Идите по отсортированным интервалам, храня текущий объединённый [start, end]. Если следующий начинается не позже end — продлите end = max(end, r); иначе сохраните текущий и начните новый.',
        'Объединённые интервалы не пересекаются, поэтому их суммарная длина не больше 2·10⁹ — считайте её в long long.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<std::pair<long long, long long>> intervals(static_cast<std::size_t>(n));
    for (auto &[l, r] : intervals) {
        std::cin >> l >> r;
    }
    std::sort(intervals.begin(), intervals.end());
    std::vector<std::pair<long long, long long>> merged;
    for (const auto &[l, r] : intervals) {
        if (!merged.empty() && l <= merged.back().second) {
            merged.back().second = std::max(merged.back().second, r);
        } else {
            merged.push_back({l, r});
        }
    }
    long long length = 0;
    for (const auto &[l, r] : merged) {
        std::cout << '[' << l << ", " << r << "]\n";
        length += r - l;
    }
    std::cout << "длина: " << length << '\n';
    return 0;
}`,
      explanation: `
После сортировки по началу интервалы, которые нужно объединить, идут подряд. Инвариант прохода: \`merged\` — объединение всех просмотренных интервалов, а последний элемент \`merged\` — единственный, с которым может пересечься следующий интервал: его начало не меньше начал всех предыдущих. Если следующий начинается не позже конца последнего, они сливаются; конец берётся как максимум — вложенный интервал \`[2, 3]\` не должен укоротить \`[1, 10]\`.

Сортировка — \`O(n log n)\`, проход — \`O(n)\`. Лексикографический порядок пар здесь как раз нужный, а последний элемент вектора удобно менять через \`merged.back().second\`. Такая задача встречается в календарях (занятые промежутки), в обработке диапазонов адресов и в геометрии.`,
      examples: [
        { in: '4\n1 3\n2 6\n8 10\n15 18\n', out: '[1, 6]\n[8, 10]\n[15, 18]\nдлина: 10\n' },
        { in: '2\n1 3\n3 5\n', out: '[1, 5]\nдлина: 4\n' },
      ],
      hidden: [
        { in: '1\n5 5\n', name: 'Точка' },
        { in: '2\n1 2\n3 4\n', name: 'Не соприкасаются' },
        { in: '3\n1 10\n2 3\n4 5\n', name: 'Вложенные' },
        { in: '3\n5 6\n1 2\n3 4\n', name: 'Не по порядку' },
        { in: '4\n1 4\n4 5\n5 8\n8 9\n', name: 'Цепочка касаний' },
        { in: '2\n-1000000000 1000000000\n0 1\n', name: 'Огромный интервал' },
        { in: '3\n1 1\n1 1\n1 1\n', name: 'Одинаковые точки' },
        { in: '5\n10 12\n1 3\n2 4\n11 15\n20 20\n', name: 'Смешанные' },
      ],
    },
  ],
};
