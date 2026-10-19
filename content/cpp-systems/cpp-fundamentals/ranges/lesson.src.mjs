const POSITIVE = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> values;
    int n, m, x;
    std::cin >> n;
    for (int i = 0; i < n; i++) {
        std::cin >> x;
        values.push_back(x);
    }
    auto is_positive = [](int v) { return v > 0; };
    auto positive = values | std::views::filter(is_positive);
    std::println("положительных: {}", std::ranges::distance(positive));
    std::cin >> m;
    for (int i = 0; i < m; i++) {
        int index;
        std::cin >> index >> x;
        values[index] = x;
    }
${
  fixed
    ? '    auto updated = values | std::views::filter(is_positive);\n    std::println("после изменений: {}", std::ranges::distance(updated));\n'
    : '    std::println("после изменений: {}", std::ranges::distance(positive));\n'
}    return 0;
}`;

export default {
  id: 'cpp23-ranges',
  title: 'Диапазоны и представления: std::ranges и std::views',
  description:
    'Алгоритмы std::ranges вместо пар итераторов: sort, find, count_if, minmax, contains и fold_left; проекции и сортировка по полю; ленивые представления filter, transform, take, drop, reverse; iota, enumerate, zip, adjacent; сбор результата через std::ranges::to; почему представление устаревает после изменения контейнера.',
  moduleId: 'cpp-fundamentals',
  order: 18,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['cpp23-span'],
  objectives: [
    'Применять алгоритмы std::ranges к контейнерам целиком',
    'Сортировать и искать по полю с помощью проекций',
    'Строить ленивые конвейеры из представлений std::views',
    'Собирать результат в контейнер и не допускать устаревших представлений',
  ],
  tags: ['C++20', 'C++23', 'ranges', 'views', 'Алгоритмы'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5, 6};
    for (int x : v | std::views::filter([](int x) { return x % 3 != 0; })
                   | std::views::transform([](int x) { return x * 10; })) {
        std::print("{} ", x);
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['10 20 40 50'],
      placeholder: 'Вывод программы',
      explain: 'filter убирает 3 и 6, transform умножает оставшиеся на 10.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <ranges>

int main() {
    for (int x : std::views::iota(1, 10) | std::views::drop(2) | std::views::take(3)) {
        std::print("{}", x);
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['345'],
      placeholder: 'Вывод программы',
      explain: 'iota(1, 10) — числа 1…9. drop(2) отбрасывает 1 и 2, take(3) берёт 3, 4, 5.',
    },
    {
      q: 'Что означает третий аргумент в вызове std::ranges::sort(people, {}, &Person::age)?',
      options: [
        'Проекция: сравнивать людей по полю age',
        'Компаратор: сортировать по убыванию',
        'Количество сортируемых элементов',
        'Поле, которое нужно обнулить после сортировки',
      ],
      correct: 0,
      explain:
        'Второй аргумент — способ сравнения ({} — по возрастанию), третий — что взять у элемента перед сравнением.',
    },
    {
      q: 'Когда выполняется работа в строке auto r = v | std::views::transform(f);?',
      options: [
        'Ни при создании r: f вызывается, когда цикл обращается к очередному элементу',
        'Сразу для всех элементов, результат хранится в r',
        'При компиляции',
        'Только при вызове r.size()',
      ],
      correct: 0,
      explain: 'Представления ленивы: они описывают вычисление, а выполняется оно при обходе.',
    },
    {
      q: 'Почему v | std::views::filter(f) нельзя индексировать через [i]?',
      options: [
        'Чтобы найти i-й подходящий элемент, нужно пройти все предыдущие — произвольного доступа нет',
        'Потому что filter копирует элементы',
        'Индексация запрещена у всех представлений',
        'Можно, но только с i = 0',
      ],
      correct: 0,
      explain:
        'Нужен доступ по индексу — соберите результат в вектор через std::ranges::to<std::vector>().',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <algorithm>
#include <functional>
#include <print>
#include <vector>

int main() {
    std::vector<int> v = {4, 1, 7};
    std::println("{} {}", std::ranges::fold_left(v, 100, std::plus{}), std::ranges::contains(v, 7));
    return 0;
}`,
      lang: 'cpp',
      answers: ['112 true'],
      placeholder: 'Вывод программы',
      explain:
        'fold_left начинает со 100 и прибавляет каждый элемент: 112. contains проверяет наличие 7.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <ranges>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> a = {"x", "y", "z"};
    std::vector<int> b = {1, 2};
    for (auto [s, n] : std::views::zip(a, b)) {
        std::print("{}{} ", s, n);
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['x1 y2'],
      placeholder: 'Вывод программы',
      explain: 'zip останавливается на более коротком диапазоне — у b два элемента.',
    },
    {
      q: 'Какой вызов собирает отфильтрованные элементы в новый вектор (C++23)?',
      answers: [
        'std::ranges::to<std::vector>()',
        'std::ranges::to<std::vector>',
        'ranges::to<std::vector>()',
        'std::ranges::to<std::vector<int>>()',
      ],
      placeholder: 'Выражение после |',
      explain:
        'v | std::views::filter(f) | std::ranges::to<std::vector>() создаёт вектор из элементов конвейера.',
    },
    {
      q: 'Чем stable_sort отличается от sort при сортировке студентов по баллу?',
      options: [
        'stable_sort сохраняет исходный порядок студентов с равными баллами',
        'stable_sort сортирует по убыванию',
        'sort не принимает проекцию',
        'Ничем',
      ],
      correct: 0,
      explain:
        'Порядок равных после sort не гарантирован. Если он важен, нужна стабильная сортировка.',
    },
  ],
  exercises: [
    {
      title: 'Лучшие студенты',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — имя студента (одно слово) и балл. Напечатайте трёх лучших по баллу в формате \`место. имя балл\`. При равных баллах выше тот, кто раньше встретился во вводе. Если студентов меньше трёх, напечатайте всех; если их нет — \`нет студентов\`.`,
      constraints: ['Студентов не больше 50; баллы от 0 до 100.'],
      hints: [
        'std::ranges::stable_sort(group, std::ranges::greater{}, &Student::score) — по убыванию балла с сохранением порядка равных.',
        'Первые три элемента даёт group | std::views::take(3), а номер — std::views::enumerate.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <ranges>
#include <string>
#include <vector>

struct Student {
    std::string name;
    int score;
};

int main() {
    std::vector<Student> group;
    Student s;
    while (std::cin >> s.name >> s.score) {
        group.push_back(s);
    }
    if (group.empty()) {
        std::println("нет студентов");
        return 0;
    }
    std::ranges::stable_sort(group, std::ranges::greater{}, &Student::score);
    for (auto [i, student] : std::views::enumerate(group | std::views::take(3))) {
        std::println("{}. {} {}", i + 1, student.name, student.score);
    }
    return 0;
}`,
      explanation: `
Проекция \`&Student::score\` избавляет от лямбды-компаратора, а \`std::ranges::greater{}\` задаёт убывание. Стабильная сортировка выполняет требование «при равенстве — кто раньше»: обычная \`sort\` порядок равных не сохраняет.

\`take(3)\` сам справляется с короткими группами: если студентов двое, он вернёт двоих. \`enumerate\` даёт номер с нуля, поэтому место — \`i + 1\`.`,
      examples: [
        {
          in: 'Ада 90\nАлан 75\nГрейс 95\nДеннис 88\n',
          out: '1. Грейс 95\n2. Ада 90\n3. Деннис 88\n',
        },
        { in: '', out: 'нет студентов\n' },
      ],
      hidden: [
        { in: 'Ann 50\n', name: 'Один студент' },
        { in: 'A 70\nB 80\n', name: 'Два студента' },
        { in: 'A 90\nB 90\nC 90\nD 90\n', name: 'Все равны' },
        { in: 'A 10\nB 20\nC 30\nD 40\nE 50\n', name: 'Возрастание' },
        { in: 'Иван 100\nПётр 0\nОльга 100\nАнна 99\n', name: 'Ничья за первое' },
        { in: 'x 1\ny 2\nz 2\nw 2\n', name: 'Ничья за второе' },
        { in: 'A 0\nB 0\nC 0\n', name: 'Нули' },
        { in: 'a 55\nb 66\nc 77\nd 66\ne 77\n', name: 'Пары равных' },
      ],
    },
    {
      title: 'Чётные квадраты',
      description: `
Прочитайте целые числа до конца ввода. Напечатайте в одной строке через пробел квадраты **чётных** чисел в порядке, **обратном** вводу, а во второй строке — \`сумма S\`, где S — сумма этих квадратов. Если чётных чисел нет, в первой строке напечатайте \`нет\`.

Решите задачу конвейером представлений: \`filter\`, \`transform\`, \`reverse\`.`,
      constraints: ['Чисел не больше 1000, каждое по модулю до 10⁶.'],
      hints: [
        'Квадрат до 10¹² не помещается в int: в transform возвращайте long long — [](int x) { return 1LL * x * x; }.',
        'Сумму элементов конвейера посчитает std::ranges::fold_left(pipeline, 0LL, std::plus{}). Чётность отрицательных: x % 2 == 0 работает и для них.',
      ],
      solution: String.raw`
#include <algorithm>
#include <functional>
#include <iostream>
#include <print>
#include <ranges>
#include <string>
#include <vector>

int main() {
    std::vector<int> values;
    int x;
    while (std::cin >> x) {
        values.push_back(x);
    }
    auto squares = values | std::views::filter([](int v) { return v % 2 == 0; })
                          | std::views::transform([](int v) { return 1LL * v * v; })
                          | std::views::reverse;
    std::string line;
    for (long long s : squares) {
        line += line.empty() ? "" : " ";
        line += std::to_string(s);
    }
    std::println("{}", line.empty() ? "нет" : line);
    std::println("сумма {}", std::ranges::fold_left(squares, 0LL, std::plus{}));
    return 0;
}`,
      explanation: `
Конвейер описывает всю обработку одной строкой и не создаёт промежуточных векторов: отбор, возведение в квадрат и разворот выполняются на лету, при обходе. Обходится он дважды — для печати и для суммы, — и каждый раз вычисляется заново; для простых функций это дёшево.

\`1LL * v * v\` переводит вычисление в \`long long\` до умножения: \`v * v\` в \`int\` переполнился бы уже при \`v = 50 000\`. Начальное значение свёртки \`0LL\` задаёт тип суммы — с \`0\` она считалась бы в \`int\`.`,
      examples: [
        { in: '1 2 3 4 5 6\n', out: '36 16 4\nсумма 56\n' },
        { in: '1 3 5\n', out: 'нет\nсумма 0\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: '0\n', name: 'Ноль' },
        { in: '-2 -4 7\n', name: 'Отрицательные' },
        { in: '1000000 -1000000\n', name: 'Большие' },
        { in: '2 2 2\n', name: 'Повторы' },
        { in: '10 9 8 7 6 5 4 3 2 1\n', name: 'Убывание' },
        { in: '-1 -3 -5 -7\n', name: 'Только нечётные' },
        { in: '999999 1000000 2\n', name: 'Почти граница' },
      ],
    },
    {
      title: 'Найди ошибку: запомненное начало',
      bug: true,
      description: `
Программа читает число \`n\` и \`n\` целых чисел и печатает, сколько среди них положительных. Затем читает число \`m\` и \`m\` изменений \`i v\` — «записать v в элемент с номером i (с нуля)» — и печатает число положительных после всех изменений:

\`\`\`text
положительных: 1
после изменений: 2
\`\`\`

Иногда второе число оказывается неверным. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 50; 0 ≤ m ≤ 100; 0 ≤ i < n; числа по модулю до 10⁶.'],
      hints: [
        'filter_view при первом обходе запоминает, где находится первый подходящий элемент, и при следующих обходах начинает оттуда. Что будет, если положительным стал более ранний элемент?',
        'Создайте новое представление после добавления элементов — или посчитайте через std::ranges::count_if, который ничего не запоминает.',
      ],
      starter: POSITIVE(false),
      solution: POSITIVE(true),
      explanation: `
\`std::views::filter\` ищет первый подходящий элемент при первом обращении к \`begin()\` и **запоминает** найденную позицию, чтобы следующие обходы были быстрыми: так требует стандарт, ведь \`begin()\` должен работать за амортизированное O(1). Второй \`distance\` начинает обход с запомненной позиции. Если положительным стал более ранний элемент, он пропускается; если запомненный элемент перестал быть положительным, он всё равно посчитается.

Представление — это описание вычисления над конкретным состоянием данных. Изменили данные — создайте представление заново. Для одноразового подсчёта проще и надёжнее алгоритм: \`std::ranges::count_if(values, is_positive)\` ничего не хранит между вызовами.`,
      examples: [
        { in: '3\n-5 -1 2\n1\n0 7\n', out: 'положительных: 1\nпосле изменений: 2\n' },
        { in: '3\n4 -1 2\n1\n0 -3\n', out: 'положительных: 2\nпосле изменений: 1\n' },
      ],
      hidden: [
        '2\n-1 -2\n2\n0 5\n1 6\n',
        '4\n1 -1 1 -1\n2\n1 1\n3 1\n',
        '3\n0 0 5\n1\n1 3\n',
        '1\n-7\n0\n',
        '5\n-1 -2 -3 -4 10\n3\n0 1\n1 1\n4 -10\n',
        '3\n1000000 -1000000 0\n2\n1 1000000\n2 1\n',
        '2\n5 5\n2\n0 -5\n1 -5\n',
        '6\n-1 -1 -1 -1 -1 1\n1\n0 1\n',
      ],
    },
    {
      title: 'Изменения цены',
      difficulty: 'advanced',
      description: `
Ввод: число \`n\` и цены за \`n\` дней. Для каждого дня, начиная со второго, напечатайте изменение цены по сравнению с предыдущим днём со знаком: \`день 2: +3\`, \`день 3: -1\`, \`день 4: +0\`. В конце напечатайте \`наибольший рост: d (день i)\` — самое большое положительное изменение и день, когда оно произошло (при равенстве — более ранний), или \`роста не было\`.

Решите задачу через \`std::views::adjacent<2>\` (пары соседних цен) и \`std::views::enumerate\`.`,
      constraints: ['1 ≤ n ≤ 100; цены от 0 до 10⁶.'],
      hints: [
        'std::views::enumerate(std::views::adjacent<2>(prices)) даёт пары (номер, пара соседей). Пару соседей разложите: auto [before, after] = pair;.',
        'Номер пары с нуля соответствует дню номер + 2. Изменение со знаком печатается спецификацией {:+}.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <ranges>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> prices(static_cast<std::size_t>(n));
    for (int &p : prices) {
        std::cin >> p;
    }
    int best = 0;
    long long best_day = 0;
    for (auto [i, pair] : std::views::enumerate(std::views::adjacent<2>(prices))) {
        auto [before, after] = pair;
        int change = after - before;
        std::println("день {}: {:+}", i + 2, change);
        if (change > best) {
            best = change;
            best_day = i + 2;
        }
    }
    if (best > 0) {
        std::println("наибольший рост: {} (день {})", best, best_day);
    } else {
        std::println("роста не было");
    }
    return 0;
}`,
      explanation: `
\`adjacent<2>\` превращает последовательность цен в последовательность пар соседей: \`(p₁, p₂), (p₂, p₃), …\` — без индексов и без риска выйти за границу на последнем элементе. \`enumerate\` нумерует эти пары с нуля, поэтому пара номер \`i\` описывает переход ко дню \`i + 2\`.

При одной цене пар нет, цикл не выполняется ни разу, и программа сразу сообщает, что роста не было. Наибольший рост обновляется только при строго большем изменении, поэтому при равенстве остаётся более ранний день. Спецификация \`{:+}\` ставит знак и у нуля: \`+0\`.`,
      examples: [
        {
          in: '4\n10 13 12 12\n',
          out: 'день 2: +3\nдень 3: -1\nдень 4: +0\nнаибольший рост: 3 (день 2)\n',
        },
        { in: '1\n100\n', out: 'роста не было\n' },
      ],
      hidden: [
        { in: '3\n5 4 3\n', name: 'Только падение' },
        { in: '2\n0 1000000\n', name: 'Большой рост' },
        { in: '5\n1 3 1 3 1\n', name: 'Равный рост' },
        { in: '4\n7 7 7 7\n', name: 'Без изменений' },
        { in: '6\n1 2 4 8 16 32\n', name: 'Удвоение' },
        { in: '5\n10 5 20 1 15\n', name: 'Скачки' },
        { in: '3\n1000000 0 1000000\n', name: 'Обвал и восстановление' },
        { in: '7\n3 1 4 1 5 9 2\n', name: 'Пи' },
      ],
    },
  ],
};
