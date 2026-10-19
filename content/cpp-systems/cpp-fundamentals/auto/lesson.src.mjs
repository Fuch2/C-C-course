const UPDATE = (fixed) => String.raw`
#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<long long> values(static_cast<std::size_t>(n));
    for (auto &v : values) {
        std::cin >> v;
    }
    int index;
    long long delta;
    while (std::cin >> index >> delta) {
        if (index < 0 || index >= n) {
            continue;
        }
        ${fixed ? 'auto &item' : 'auto item'} = values[static_cast<std::size_t>(index)];
        item += delta;
    }
    for (std::size_t i = 0; i < values.size(); i++) {
        std::cout << values[i] << (i + 1 < values.size() ? ' ' : '\n');
    }
    return 0;
}`;

export default {
  id: 'cpp20-auto',
  title: 'auto и лямбда-выражения',
  description:
    'Вывод типа auto и его ловушки: строковые литералы, целые литералы, отбрасывание ссылок и const; где auto уместен; лямбда-выражения; лямбды в std::sort, std::count_if, std::for_each; захват переменных по значению и по ссылке.',
  moduleId: 'cpp-fundamentals',
  order: 10,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['cpp23-string-view'],
  objectives: [
    'Объявлять переменные с auto и предсказывать выведенный тип',
    'Получать ссылку через auto & и const auto &',
    'Писать лямбда-выражения и передавать их в алгоритмы',
    'Захватывать переменные в лямбду по значению и по ссылке',
  ],
  tags: ['C++', 'auto', 'Лямбды', 'algorithm'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какой тип у переменной s в объявлении auto s = "hello";?',
      options: ['const char *', 'std::string', 'char[6]', 'auto'],
      correct: 0,
      explain:
        'Строковый литерал — массив const char, и при выводе типа он превращается в указатель. Для std::string нужен явный тип или суффикс s.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {5, 6};
    auto a = v[0];
    auto &b = v[1];
    a = 50;
    b = 60;
    std::cout << v[0] + v[1] << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['65'],
      placeholder: 'Вывод программы',
      explain: 'a — копия, изменение не попадает в вектор; b — ссылка. Вектор: 5 и 60.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int main() {
    int base = 10;
    auto add = [base](int x) { return x + base; };
    base = 100;
    std::cout << add(1) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['11'],
      placeholder: 'Вывод программы',
      explain:
        'Захват по значению копирует base в момент создания лямбды — 10. Последующее изменение base на неё не влияет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int main() {
    int counter = 0;
    auto tick = [&counter]() { counter++; };
    tick();
    tick();
    tick();
    std::cout << counter << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3'],
      placeholder: 'Вывод программы',
      explain: '[&counter] — захват по ссылке: лямбда меняет саму переменную.',
    },
    {
      q: 'Почему функция сравнения для std::sort не должна использовать <=?',
      options: [
        'Сравнение должно означать «строго раньше»; с <= для равных элементов получается true в обе стороны — неопределённое поведение',
        'Оператор <= медленнее',
        'std::sort принимает только функции с <',
        'Это не важно',
      ],
      correct: 0,
      explain:
        'std::sort требует строгого слабого порядка. Нарушение может привести к выходу сортировки за границы массива.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {3, -1, 4, -1, 5, -9};
    auto negatives = std::count_if(v.begin(), v.end(), [](int x) { return x < 0; });
    std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
    std::cout << negatives << ' ' << v[0] << ' ' << v[5] << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 5 -9'],
      placeholder: 'Вывод программы',
      explain: 'Отрицательных три. Сортировка с a > b — по убыванию: первым 5, последним −9.',
    },
    {
      q: 'Какие объявления дают ссылку на элемент v[0] (v — std::vector<int>)?',
      options: ['auto &x = v[0];', 'const auto &x = v[0];', 'auto x = v[0];', 'int &x = v[0];'],
      correct: [0, 1, 3],
      explain:
        'auto без & отбрасывает ссылку и создаёт копию. С & — ссылка, с const auto & — ссылка только для чтения.',
    },
    {
      q: 'Когда лучше НЕ использовать auto?',
      options: [
        'Когда тип важен для понимания кода и не виден из правой части',
        'Для итераторов контейнеров',
        'Для хранения лямбды',
        'Когда справа явно написан тип, например std::string("x")',
      ],
      correct: 0,
      explain:
        'auto хорош, когда тип очевиден или неважен. Лямбду вообще нельзя сохранить иначе: у её типа нет имени.',
    },
  ],
  exercises: [
    {
      title: 'Сортировка по правилу',
      difficulty: 'beginner',
      description: `
Первая строка — \`n\`, вторая — \`n\` целых чисел. Отсортируйте их по возрастанию **модуля**, а при равных модулях — по возрастанию самого числа (\`-3\` раньше \`3\`). Напечатайте результат через пробел.

Используйте \`std::sort\` с лямбда-выражением.`,
      constraints: ['1 ≤ n ≤ 1000; |числа| ≤ 10⁹.'],
      hints: [
        'std::sort(v.begin(), v.end(), [](long long a, long long b) { … }); — лямбда отвечает «должно ли a стоять раньше b».',
        'Сравнивайте сначала модули (std::llabs из <cstdlib> или a < 0 ? -a : a), при равенстве — сами числа. Только строгие сравнения.',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstdlib>
#include <iostream>
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
    std::sort(v.begin(), v.end(), [](long long a, long long b) {
        if (std::llabs(a) != std::llabs(b)) {
            return std::llabs(a) < std::llabs(b);
        }
        return a < b;
    });
    for (std::size_t i = 0; i < v.size(); i++) {
        std::cout << v[i] << (i + 1 < v.size() ? ' ' : '\n');
    }
    return 0;
}`,
      explanation: `
Лямбда — функция сравнения «должно ли \`a\` стоять раньше \`b\`», написанная прямо в вызове \`std::sort\`. Порядок по двум ключам: сначала модуль, при равенстве — само число. Оба сравнения строгие, поэтому для равных чисел лямбда возвращает \`false\` в обе стороны — это требование \`std::sort\`.

Числа хранятся в \`long long\`, потому что модуль \`int\` может не поместиться в \`int\` (\`-2147483648\`), а \`std::llabs\` работает с \`long long\`. Чтение организовано циклом \`for (auto &x : v)\` — ссылка на каждый элемент.`,
      examples: [
        { in: '5\n3 -1 -3 2 0\n', out: '0 -1 2 -3 3\n' },
        { in: '1\n-7\n', out: '-7\n' },
      ],
      hidden: [
        '2\n5 -5\n',
        '2\n-5 5\n',
        '4\n4 3 2 1\n',
        '4\n-1 -2 -3 -4\n',
        '3\n7 7 7\n',
        '3\n1000000000 -1000000000 0\n',
        '6\n-2 2 -1 1 0 0\n',
        '5\n10 -20 30 -40 50\n',
      ],
    },
    {
      title: 'Порог',
      description: `
Первая строка — \`n\` и порог \`t\`, вторая — \`n\` баллов. Напечатайте, сколько баллов не меньше порога, а на второй строке — номер (с 1) первого балла меньше порога или \`все сдали\`.

Используйте \`std::count_if\` и \`std::find_if\` с лямбдами, захватывающими \`t\`.`,
      constraints: ['1 ≤ n ≤ 1000; 0 ≤ баллы, t ≤ 100.'],
      hints: [
        'auto passed = std::count_if(v.begin(), v.end(), [t](int s) { return s >= t; });',
        'std::find_if возвращает итератор на первый подходящий элемент или v.end(), если такого нет. Номер элемента — it − v.begin() + 1.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n, t;
    if (!(std::cin >> n >> t) || n < 1) {
        return 0;
    }
    std::vector<int> scores(static_cast<std::size_t>(n));
    for (auto &s : scores) {
        std::cin >> s;
    }
    auto passed = std::count_if(scores.begin(), scores.end(), [t](int s) { return s >= t; });
    auto failed = std::find_if(scores.begin(), scores.end(), [t](int s) { return s < t; });
    std::cout << passed << '\n';
    if (failed == scores.end()) {
        std::cout << "все сдали\n";
    } else {
        std::cout << failed - scores.begin() + 1 << '\n';
    }
    return 0;
}`,
      explanation: `
Порог \`t\` — локальная переменная \`main\`, и лямбда получает её копию через захват \`[t]\`. Без захвата лямбда не видит локальных переменных: \`[](int s) { return s >= t; }\` не скомпилируется.

\`std::find_if\` возвращает **итератор** — «указатель» на найденный элемент — или \`scores.end()\`, если ничего не нашлось. Это аналог \`npos\` у строк: результат обязательно сравнивают с \`end()\`. Разность итераторов вектора — расстояние между элементами, как разность указателей в C. Подробно об итераторах — в следующем уроке.`,
      examples: [
        { in: '5 70\n55 72 90 41 88\n', out: '3\n1\n' },
        { in: '3 50\n50 60 70\n', out: '3\nвсе сдали\n' },
      ],
      hidden: [
        '1 0\n0\n',
        '1 100\n99\n',
        '4 60\n60 61 59 100\n',
        '3 10\n0 0 0\n',
        '5 50\n100 100 100 100 49\n',
        '2 1\n1 0\n',
        '6 75\n80 85 90 95 100 75\n',
        '3 100\n100 100 100\n',
      ],
    },
    {
      title: 'Найди ошибку: копия элемента',
      bug: true,
      description: `
Программа читает \`n\` и \`n\` чисел, затем пары \`i d\` до конца ввода: к элементу с индексом \`i\` (с нуля) нужно прибавить \`d\`; некорректные индексы пропускаются. В конце печатается массив.

Прибавления не применяются. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 1000; |числа|, |d| ≤ 10⁹; пар не больше 1000.'],
      hints: [
        'Какой тип выводит auto item = values[i]? Ссылку или копию?',
        'auto отбрасывает ссылку: item — копия элемента, и изменение копии не попадает в вектор. Нужно auto &item = values[i];.',
      ],
      starter: UPDATE(false),
      solution: UPDATE(true),
      explanation: `
\`values[i]\` возвращает ссылку на элемент, но \`auto\` при выводе типа отбрасывает ссылки: \`auto item = values[i]\` создаёт новую переменную \`long long\` со значением элемента. Прибавление меняет эту копию, и она исчезает в конце итерации. Компилятор не предупреждает: код корректен, просто делает не то.

\`auto &item\` выводит ссылку на элемент, и изменения попадают в вектор. Правило стоит запомнить: если через переменную нужно менять объект — \`auto &\`, если только читать без копии — \`const auto &\`, если нужна независимая копия — \`auto\`.`,
      examples: [
        { in: '3\n1 2 3\n0 10\n2 -3\n', out: '11 2 0\n' },
        { in: '2\n5 5\n', out: '5 5\n' },
      ],
      hidden: [
        '1\n0\n0 1\n0 1\n0 1\n',
        '3\n1 1 1\n5 100\n-1 100\n1 7\n',
        '2\n1000000000 -1000000000\n0 1000000000\n1 -1000000000\n',
        '4\n0 0 0 0\n3 4\n2 3\n1 2\n0 1\n',
        '2\n10 20\n1 -20\n',
        '5\n1 2 3 4 5\n4 -5\n',
        '3\n7 8 9\n1 0\n',
        '2\n-1 -1\n0 2\n1 2\n',
      ],
    },
    {
      title: 'Рейтинг',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\`, дальше \`n\` строк \`имя очки время\`. Постройте рейтинг: больше очков — выше; при равных очках выше тот, у кого меньше время; при равенстве и очков, и времени — по имени в алфавитном порядке. Напечатайте строки \`место. имя очки время\`.

Храните участников в \`std::vector\` структур и сортируйте \`std::sort\` с лямбдой.`,
      constraints: [
        '1 ≤ n ≤ 1000; имена — латинские буквы, различны; 0 ≤ очки ≤ 10 000; 0 ≤ время ≤ 10⁶.',
      ],
      hints: [
        'struct Entry { std::string name; int points; int time; }; Лямбда принимает два const Entry &.',
        'Сравнивайте по очереди: если очки различны — return a.points > b.points; иначе если время различно — return a.time < b.time; иначе — return a.name < b.name.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Entry {
    std::string name;
    int points;
    int time;
};

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<Entry> entries(static_cast<std::size_t>(n));
    for (auto &e : entries) {
        std::cin >> e.name >> e.points >> e.time;
    }
    std::sort(entries.begin(), entries.end(), [](const Entry &a, const Entry &b) {
        if (a.points != b.points) {
            return a.points > b.points;
        }
        if (a.time != b.time) {
            return a.time < b.time;
        }
        return a.name < b.name;
    });
    int place = 1;
    for (const auto &e : entries) {
        std::cout << place++ << ". " << e.name << ' ' << e.points << ' ' << e.time << '\n';
    }
    return 0;
}`,
      explanation: `
Лямбда задаёт лексикографический порядок по трём ключам: следующий ключ сравнивается, только если предыдущие равны. Направление ключа задаёт знак сравнения: «больше очков — выше» — это \`a.points > b.points\`. Имена различны, поэтому порядок полный.

Параметры лямбды — \`const Entry &\`: сортировка вызывает сравнение много раз, и копирование структуры со строкой на каждом вызове было бы заметным. Сравните с пузырьком из модуля «Алгоритмы»: там тот же порядок задавала отдельная функция, а сортировку приходилось писать самим; \`std::sort\` работает за \`O(n log n)\`.`,
      examples: [
        {
          in: '3\nAnn 10 50\nBob 12 70\nCid 10 40\n',
          out: '1. Bob 12 70\n2. Cid 10 40\n3. Ann 10 50\n',
        },
        { in: '2\nZoe 5 5\nAmy 5 5\n', out: '1. Amy 5 5\n2. Zoe 5 5\n' },
      ],
      hidden: [
        { in: '1\nSolo 0 0\n', name: 'Один участник' },
        { in: '3\nA 1 1\nB 2 1\nC 3 1\n', name: 'По очкам' },
        { in: '3\nA 5 3\nB 5 2\nC 5 1\n', name: 'По времени' },
        { in: '3\nc 5 5\nb 5 5\na 5 5\n', name: 'По имени' },
        { in: '4\nX 10000 1000000\nY 10000 0\nZ 0 0\nW 0 1000000\n', name: 'Крайние значения' },
        { in: '4\nAa 3 9\nAb 3 9\nB 4 100\nC 3 8\n', name: 'Смешанные' },
        { in: '2\nlower 1 1\nUpper 1 1\n', name: 'Регистр в именах' },
        { in: '5\nE 1 5\nD 2 4\nC 3 3\nB 4 2\nA 5 1\n', name: 'Обратный порядок' },
      ],
    },
  ],
};
