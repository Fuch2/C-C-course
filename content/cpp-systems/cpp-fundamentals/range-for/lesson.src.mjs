const HALVES = (fixed) => String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v;
    int x;
    while (std::cin >> x) {
        v.push_back(x);
    }
${
  fixed
    ? `    std::size_t original = v.size();
    for (std::size_t i = 0; i < original; i++) {
        if (v[i] % 2 == 0) {
            v.push_back(v[i] / 2);
        }
    }`
    : `    for (int value : v) {
        if (value % 2 == 0) {
            v.push_back(value / 2);
        }
    }`
}
    for (std::size_t i = 0; i < v.size(); i++) {
        std::cout << v[i] << (i + 1 < v.size() ? ' ' : '\n');
    }
    return 0;
}`;

export default {
  id: 'cpp20-range-for',
  title: 'Цикл по диапазону и итераторы',
  description:
    'Цикл for по диапазону для контейнеров, строк и массивов; копия, ссылка и константная ссылка в переменной цикла; итераторы begin и end, разыменование и арифметика; алгоритмы accumulate, max_element, find, reverse, sort на диапазонах; std::erase_if; почему нельзя менять размер контейнера при обходе.',
  moduleId: 'cpp-fundamentals',
  order: 11,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['cpp20-auto'],
  objectives: [
    'Обходить контейнеры циклом по диапазону с копией, ссылкой и константной ссылкой',
    'Работать с итераторами begin, end, rbegin, rend',
    'Применять алгоритмы стандартной библиотеки к диапазонам',
    'Не изменять размер контейнера во время обхода',
  ],
  tags: ['C++', 'range-for', 'Итераторы', 'algorithm'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {1, 2, 3};
    for (auto x : v) {
        x *= 10;
    }
    for (auto &x : v) {
        x *= 2;
    }
    std::cout << v[0] << v[1] << v[2] << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['246'],
      placeholder: 'Вывод программы',
      explain:
        'Первый цикл меняет копии. Второй удваивает сами элементы: 2, 4, 6 — они печатаются подряд.',
    },
    {
      q: 'На что указывает v.end()?',
      options: [
        'На позицию за последним элементом — её нельзя разыменовывать',
        'На последний элемент',
        'На нулевой элемент',
        'На nullptr',
      ],
      correct: 0,
      explain: 'Диапазон [begin, end) — полуинтервал. Пустой контейнер — это begin() == end().',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {5, 3, 9, 1, 9};
    auto it = std::max_element(v.begin(), v.end());
    std::cout << *it << ' ' << it - v.begin() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['9 2'],
      placeholder: 'Вывод программы',
      explain: 'max_element возвращает итератор на первый наибольший элемент — индекс 2.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<double> v = {0.5, 1.5, 2.5};
    std::cout << std::accumulate(v.begin(), v.end(), 0) << ' '
              << std::accumulate(v.begin(), v.end(), 0.0) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 4.5'],
      placeholder: 'Вывод программы',
      explain:
        'Тип суммы — тип начального значения. С 0 (int) каждое прибавление отбрасывает дробную часть: 0 + 0.5 → 0, 0 + 1.5 → 1, 1 + 2.5 → 3. С 0.0 получается 4.5.',
    },
    {
      q: 'Почему нельзя вызывать v.push_back внутри цикла for (int x : v)?',
      options: [
        'При росте вектора итератор цикла указывает в освобождённую память',
        'push_back нельзя вызывать внутри любых циклов',
        'Цикл станет бесконечным, но память не пострадает',
        'Можно, это безопасно',
      ],
      correct: 0,
      explain:
        'Цикл по диапазону хранит итераторы begin и end, и рост вектора делает их недействительными.',
    },
    {
      q: 'Какие объявления переменной цикла не копируют строки из std::vector<std::string> words?',
      options: [
        'for (const auto &w : words)',
        'for (auto &w : words)',
        'for (auto w : words)',
        'for (std::string w : words)',
      ],
      correct: [0, 1],
      explain:
        'Ссылки не копируют. auto без & и явный тип std::string создают копию каждой строки.',
    },
    {
      q: 'Что возвращает std::find(v.begin(), v.end(), x), если x нет в векторе?',
      options: ['v.end()', 'Итератор на последний элемент', '−1', 'nullptr'],
      correct: 0,
      explain:
        'Алгоритмы сообщают «не найдено» итератором end() — его обязательно проверяют перед разыменованием.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {4, -1, 7, -3, 0};
    auto removed = std::erase_if(v, [](int x) { return x <= 0; });
    std::cout << removed << ' ' << v.size() << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 2'],
      placeholder: 'Вывод программы',
      explain: 'Условие x <= 0 выполняется для −1, −3 и 0 — удалено три, осталось 4 и 7.',
    },
  ],
  exercises: [
    {
      title: 'Итоги массива',
      difficulty: 'beginner',
      description: `
Первая строка — \`n\`, вторая — \`n\` целых чисел. Напечатайте через пробел сумму, минимум, максимум и номер (с 1) первого максимального элемента.

Используйте \`std::accumulate\`, \`std::min_element\` и \`std::max_element\`.`,
      constraints: ['1 ≤ n ≤ 1000; |числа| ≤ 10⁹.'],
      hints: [
        'Сумма до 10¹² — начальное значение accumulate должно быть 0LL, иначе сумма будет считаться в int.',
        'min_element и max_element возвращают итераторы: значение — *it, номер — it − v.begin() + 1.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<long long> v(static_cast<std::size_t>(n));
    for (auto &x : v) {
        std::cin >> x;
    }
    long long sum = std::accumulate(v.begin(), v.end(), 0LL);
    auto lo = std::min_element(v.begin(), v.end());
    auto hi = std::max_element(v.begin(), v.end());
    std::cout << sum << ' ' << *lo << ' ' << *hi << ' ' << hi - v.begin() + 1 << '\n';
    return 0;
}`,
      explanation: `
Три алгоритма заменяют три цикла. \`std::accumulate\` складывает диапазон, начиная со значения \`init\`, и тип \`init\` определяет тип суммы: с \`0\` сумма считалась бы в \`int\` и переполнилась бы. \`std::min_element\` и \`std::max_element\` возвращают итераторы на первый наименьший и наибольший элемент — из итератора получаются и значение, и номер.

Разыменовывать результат можно, потому что вектор не пуст (\`n ≥ 1\`). Для пустого диапазона алгоритмы вернули бы \`end()\`.`,
      examples: [
        { in: '5\n3 9 -2 9 4\n', out: '23 -2 9 2\n' },
        { in: '1\n-7\n', out: '-7 -7 -7 1\n' },
      ],
      hidden: [
        '3\n1000000000 1000000000 1000000000\n',
        '4\n-1 -2 -3 -4\n',
        '4\n1 2 3 4\n',
        '5\n5 5 5 5 5\n',
        '2\n-1000000000 1000000000\n',
        '6\n0 7 0 7 0 7\n',
        '3\n2 1 2\n',
        '7\n9 1 8 2 7 3 6\n',
      ],
    },
    {
      title: 'Зеркальные слова',
      description: `
Каждая строка ввода — слова из латинских букв через пробел. Для каждой строки напечатайте две строки: слова в обратном порядке, а затем исходный порядок слов, но каждое слово задом наперёд. Слова разделяйте одним пробелом.`,
      constraints: ['Строк не больше 20; слов в строке от 1 до 50.'],
      hints: [
        'Разберите строку в std::vector<std::string> через std::istringstream.',
        'std::reverse(words.begin(), words.end()) переворачивает порядок слов, std::reverse(w.begin(), w.end()) — буквы слова. Удобно сделать копию вектора для второй строки.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

void print(const std::vector<std::string> &words) {
    for (std::size_t i = 0; i < words.size(); i++) {
        std::cout << words[i] << (i + 1 < words.size() ? ' ' : '\n');
    }
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::vector<std::string> words;
        std::string w;
        while (in >> w) {
            words.push_back(w);
        }
        if (words.empty()) {
            continue;
        }
        std::vector<std::string> mirrored = words;
        for (auto &word : mirrored) {
            std::reverse(word.begin(), word.end());
        }
        std::reverse(words.begin(), words.end());
        print(words);
        print(mirrored);
    }
    return 0;
}`,
      explanation: `
\`std::reverse\` работает с любым диапазоном итераторов, поэтому один и тот же алгоритм переворачивает и вектор слов, и буквы одного слова — у строки тоже есть \`begin()\` и \`end()\`. Копия \`mirrored = words\` независима от оригинала: копирование вектора копирует и все строки в нём.

Переворот букв делается циклом по ссылкам \`for (auto &word : mirrored)\` — без \`&\` переворачивались бы копии слов.`,
      examples: [
        { in: 'one two three\n', out: 'three two one\neno owt eerht\n' },
        { in: 'abc\n', out: 'abc\ncba\n' },
      ],
      hidden: [
        { in: 'a b\n', name: 'Две буквы' },
        { in: 'level noon\n', name: 'Палиндромы' },
        { in: '  spaced   out  \n', name: 'Лишние пробелы' },
        { in: 'Hello World\nC plus plus\n', name: 'Две строки' },
        { in: 'x\n', name: 'Одна буква' },
        { in: 'the quick brown fox jumps\n', name: 'Пять слов' },
        { in: 'ab ba ab\n', name: 'Повторы' },
        { in: 'Zz Yy Xx\n', name: 'Регистр' },
      ],
    },
    {
      title: 'Найди ошибку: добавление при обходе',
      bug: true,
      description: `
Программа читает целые числа до конца ввода и для каждого **исходного** чётного числа дописывает в конец вектора его половину (добавленные числа повторно не обрабатываются). Затем печатает вектор.

На многих входах AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['От 1 до 1000 чисел; |числа| ≤ 10⁹.'],
      hints: [
        'Что происходит с итераторами цикла по диапазону, когда push_back увеличивает вектор?',
        'Обходите вектор по индексу до исходного размера: запомните std::size_t original = v.size(); и идите for (i = 0; i < original; i++), обращаясь к v[i].',
      ],
      starter: HALVES(false),
      solution: HALVES(true),
      explanation: `
Цикл по диапазону — это цикл по итераторам \`begin()\` и \`end()\`, вычисленным один раз в начале. \`push_back\` может перенести элементы в новый блок памяти, и итератор цикла начинает указывать в освобождённый старый блок: AddressSanitizer сообщает \`heap-use-after-free\`. Даже без переезда цикл работал бы неверно: \`end()\` запомнен до добавлений.

Обход по индексу до исходного размера решает обе проблемы: индекс остаётся действительным после роста, а граница \`original\` гарантирует, что добавленные числа не обрабатываются. Правило: менять элементы во время обхода можно, менять размер контейнера — нельзя.`,
      examples: [
        { in: '3\n', out: '3\n' },
        { in: '4 7 10\n', out: '4 7 10 2 5\n' },
      ],
      hidden: [
        '2\n',
        '1 3 5\n',
        '8 8\n',
        '-4 6\n',
        '0\n',
        '2 4 6 8\n',
        '1000000000 1\n',
        '12 5 7 14\n',
      ],
    },
    {
      title: 'Чистка данных',
      difficulty: 'advanced',
      description: `
До конца ввода идут целые числа. Очистите их в три шага и напечатайте отчёт:

1. удалите отрицательные числа (\`std::erase_if\`);
2. отсортируйте оставшиеся;
3. удалите повторы, оставив по одному значению (\`std::unique\`).

Отчёт — три строки: \`отрицательных: A\`, \`повторов: B\`, \`осталось: x y z…\` (или \`осталось: пусто\`).`,
      constraints: ['Чисел не больше 1000; |числа| ≤ 10⁹.'],
      hints: [
        'std::erase_if(v, условие) возвращает число удалённых элементов.',
        'std::unique не удаляет, а сдвигает уникальные значения к началу отсортированного диапазона и возвращает итератор на новый конец. Удалите хвост: v.erase(new_end, v.end()). Повторов — разность размеров до и после.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<long long> v;
    long long x;
    while (std::cin >> x) {
        v.push_back(x);
    }
    auto negatives = std::erase_if(v, [](long long value) { return value < 0; });
    std::sort(v.begin(), v.end());
    std::size_t before = v.size();
    v.erase(std::unique(v.begin(), v.end()), v.end());
    std::cout << "отрицательных: " << negatives << '\n';
    std::cout << "повторов: " << before - v.size() << '\n';
    std::cout << "осталось:";
    if (v.empty()) {
        std::cout << " пусто";
    }
    for (long long value : v) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    return 0;
}`,
      explanation: `
\`std::erase_if\` удаляет элементы по условию за один проход и сообщает, сколько удалено. \`std::unique\` устроен иначе: он работает с диапазоном итераторов и не может изменить размер контейнера — только сдвинуть первые представители каждой группы равных соседей к началу и вернуть итератор на конец «полезной» части. Хвост удаляется отдельным \`erase\`. Эта пара — классическая идиома «erase-unique».

\`unique\` убирает только **соседние** повторы, поэтому сортировка идёт до него. Итог — множество различных неотрицательных чисел по возрастанию за \`O(n log n)\`.`,
      examples: [
        { in: '5 -1 3 5 0 -7 3 3\n', out: 'отрицательных: 2\nповторов: 3\nосталось: 0 3 5\n' },
        { in: '-1 -2\n', out: 'отрицательных: 2\nповторов: 0\nосталось: пусто\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: '1 2 3\n', name: 'Без изменений' },
        { in: '7 7 7 7\n', name: 'Все равны' },
        { in: '0 -0 0\n', name: 'Нули' },
        { in: '1000000000 -1000000000 1000000000\n', name: 'Крайние значения' },
        { in: '9 8 7 6 5 4 3 2 1\n', name: 'Убывание' },
        { in: '-5 5 -5 5\n', name: 'Пары знаков' },
        { in: '3 1 3 1 3 1 2\n', name: 'Перемешанные повторы' },
      ],
    },
  ],
};
