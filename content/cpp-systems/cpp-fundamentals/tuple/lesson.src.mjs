const STATS = (fixed) => String.raw`
#include <iostream>
#include <tuple>
#include <vector>

std::tuple<long long, long long, long long> stats(const std::vector<long long> &v) {
    long long lo = v[0], hi = v[0], sum = 0;
    for (long long x : v) {
        lo = x < lo ? x : lo;
        hi = x > hi ? x : hi;
        sum += x;
    }
    return {lo, hi, sum};
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
    auto [${fixed ? 'lo, hi, total' : 'lo, total, hi'}] = stats(v);
    std::cout << "минимум " << lo << ", максимум " << hi << ", сумма " << total << '\n';
    return 0;
}`;

export default {
  id: 'cpp20-tuple',
  title: 'Кортежи std::tuple',
  description:
    'std::tuple для нескольких значений разных типов; std::get по номеру и по типу; структурные привязки и std::tie, std::ignore; лексикографическое сравнение и функции сравнения по нескольким ключам; когда кортеж, а когда структура.',
  moduleId: 'cpp-fundamentals',
  order: 21,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-pair'],
  objectives: [
    'Создавать кортежи и доставать элементы',
    'Распаковывать кортежи структурными привязками и std::tie',
    'Писать функции сравнения по нескольким ключам через кортежи',
    'Выбирать между кортежем и структурой',
  ],
  tags: ['C++', 'tuple', 'Сортировка'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <tuple>

int main() {
    auto t = std::make_tuple(10, 'x', 2.5);
    std::get<0>(t) += 5;
    std::cout << std::get<0>(t) << std::get<1>(t) << std::get<2>(t) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['15x2.5'],
      placeholder: 'Вывод программы',
      explain: 'Элементы — int 15, char x и double 2.5; печатаются подряд без пробелов.',
    },
    {
      q: 'Почему std::get<i>(t), где i — переменная int, не компилируется?',
      options: [
        'Номер элемента кортежа должен быть известен при компиляции',
        'std::get работает только с парами',
        'Нужно писать t[i]',
        'Компилируется',
      ],
      correct: 0,
      explain:
        'Элементы кортежа могут быть разных типов, и тип выражения std::get<N>(t) зависит от N — поэтому N обязан быть константой компиляции.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <tuple>

std::tuple<int, int, int> f() {
    return {1, 2, 3};
}

int main() {
    int a = 0, c = 0;
    std::tie(a, std::ignore, c) = f();
    auto [x, y, z] = f();
    std::cout << a + c << ' ' << x * 100 + y * 10 + z << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['4 123'],
      placeholder: 'Вывод программы',
      explain:
        'std::tie присваивает a = 1 и c = 3, пропуская второй элемент. Привязка раскладывает 1, 2, 3 по порядку.',
    },
    {
      q: 'Чем std::tie(a, b) = t отличается от auto [a, b] = t?',
      options: [
        'tie присваивает уже существующим переменным, привязка объявляет новые',
        'Ничем',
        'tie объявляет новые переменные, привязка присваивает существующим',
        'tie работает только с парами',
      ],
      correct: 0,
      explain:
        'std::tie собирает кортеж ссылок на существующие переменные, а структурная привязка — новое объявление.',
    },
    {
      q: 'В каком порядке std::sort расположит кортежи (1, "b"), (0, "z"), (1, "a")?',
      options: [
        '(0, "z"), (1, "a"), (1, "b")',
        '(1, "a"), (1, "b"), (0, "z")',
        '(0, "z"), (1, "b"), (1, "a")',
        'В порядке ввода',
      ],
      correct: 0,
      explain: 'Лексикографически: сначала по числу, при равенстве — по строке.',
    },
    {
      q: 'Какое выражение задаёт порядок «по убыванию score, при равенстве — по возрастанию name»?',
      options: [
        'std::make_tuple(-a.score, a.name) < std::make_tuple(-b.score, b.name)',
        'std::tie(-a.score, a.name) < std::tie(-b.score, b.name)',
        'std::make_tuple(a.score, a.name) < std::make_tuple(b.score, b.name)',
        'a.score > b.score && a.name < b.name',
      ],
      correct: 0,
      explain:
        'std::tie не принимает выражения вроде -a.score. Последний вариант — не строгий порядок: для равных score он возвращает false в обе стороны, даже если имена разные.',
    },
    {
      q: 'Функция возвращает tuple (min, max, sum). Что окажется в переменной sum после auto [lo, sum, hi] = f();?',
      options: ['Максимум', 'Сумма', 'Минимум', 'Ошибка компиляции'],
      correct: 0,
      explain:
        'Привязка раскладывает элементы по порядку, имена ничего не значат. Типы совпадают, и компилятор не предупредит.',
    },
    {
      q: 'Когда вместо кортежа лучше объявить структуру?',
      options: [
        'Когда данные хранятся и передаются по программе и важны понятные имена полей',
        'Когда нужно вернуть из функции два значения и сразу их распаковать',
        'Когда нужен временный ключ сортировки',
        'Никогда',
      ],
      correct: 0,
      explain:
        'player.score понятнее std::get<1>(player), а новое поле структуры не сдвигает номера остальных.',
    },
  ],
  exercises: [
    {
      title: 'Дата в ISO',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — дата в формате \`ДД.ММ.ГГГГ\`. Напишите функцию \`std::tuple<bool, int, int, int> parse_date(const std::string &s)\`, которая возвращает признак успеха, день, месяц и год, и напечатайте дату в формате ISO \`ГГГГ-ММ-ДД\`. Если формат нарушен (не ровно 10 символов, точки не на своих местах, не цифры, месяц не от 1 до 12, день не от 1 до 31), напечатайте \`ошибка\`.`,
      constraints: ['Строки без пробелов, до 20 символов; строк не больше 30.'],
      hints: [
        'Распакуйте результат: auto [ok, day, month, year] = parse_date(line);.',
        "Печать с ведущими нулями: std::setfill('0') и std::setw(4), std::setw(2) перед каждым числом.",
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>
#include <string>
#include <tuple>

std::tuple<bool, int, int, int> parse_date(const std::string &s) {
    if (s.size() != 10 || s[2] != '.' || s[5] != '.') {
        return {false, 0, 0, 0};
    }
    for (std::size_t i = 0; i < s.size(); i++) {
        if (i != 2 && i != 5 && (s[i] < '0' || s[i] > '9')) {
            return {false, 0, 0, 0};
        }
    }
    int day = std::stoi(s.substr(0, 2));
    int month = std::stoi(s.substr(3, 2));
    int year = std::stoi(s.substr(6, 4));
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return {false, 0, 0, 0};
    }
    return {true, day, month, year};
}

int main() {
    std::string line;
    while (std::cin >> line) {
        auto [ok, day, month, year] = parse_date(line);
        if (!ok) {
            std::cout << "ошибка\n";
            continue;
        }
        std::cout << std::setfill('0') << std::setw(4) << year << '-' << std::setw(2) << month << '-'
                  << std::setw(2) << day << '\n';
    }
    return 0;
}`,
      explanation: `
Функция возвращает четыре значения разом — признак успеха и три части даты — и вызывающий сразу раскладывает их по именованным переменным. Порядок в кортеже и в привязке совпадает: \`(ok, day, month, year)\`.

\`std::setw\` действует только на следующее число, поэтому стоит перед каждым, а \`std::setfill('0')\` запоминается. Формат ISO «год-месяц-день» удобен тем, что такие строки сортируются по алфавиту в хронологическом порядке.`,
      examples: [
        { in: '17.10.2026\n', out: '2026-10-17\n' },
        { in: '01.02.0099\n1.02.2020\n', out: '0099-02-01\nошибка\n' },
      ],
      hidden: [
        '31.12.9999\n',
        '00.01.2000\n',
        '15.13.2000\n',
        '32.01.2000\n',
        '01-01-2000\n',
        'ab.cd.efgh\n',
        '05.05.2005\n10.10.1010\n',
        '01.01.20000\n',
      ],
    },
    {
      title: 'Сортировка по ключам',
      description: `
Первая строка — \`n\`, дальше \`n\` строк \`город возраст имя\`. Отсортируйте людей: по городу в алфавитном порядке, в одном городе — по убыванию возраста, при равном возрасте — по имени, и напечатайте их в том же формате.

Функцию сравнения напишите через \`std::make_tuple\`.`,
      constraints: ['1 ≤ n ≤ 1000; город и имя — латинские буквы; 0 ≤ возраст ≤ 150.'],
      hints: [
        'Сравнение: std::make_tuple(a.city, -a.age, a.name) < std::make_tuple(b.city, -b.age, b.name).',
        'Минус перед возрастом превращает сортировку по возрастанию в сортировку по убыванию для этого ключа.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <string>
#include <tuple>
#include <vector>

struct Person {
    std::string city;
    int age;
    std::string name;
};

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<Person> people(static_cast<std::size_t>(n));
    for (auto &p : people) {
        std::cin >> p.city >> p.age >> p.name;
    }
    std::sort(people.begin(), people.end(), [](const Person &a, const Person &b) {
        return std::make_tuple(a.city, -a.age, a.name) < std::make_tuple(b.city, -b.age, b.name);
    });
    for (const auto &p : people) {
        std::cout << p.city << ' ' << p.age << ' ' << p.name << '\n';
    }
    return 0;
}`,
      explanation: `
Кортеж — ключ сортировки: сравнение кортежей лексикографическое, поэтому следующий ключ учитывается, только если предыдущие равны. Направление каждого ключа задаётся отдельно: город и имя — по возрастанию, возраст — со знаком минус, то есть по убыванию.

\`std::make_tuple\` копирует строки при каждом сравнении — для тысячи записей это незаметно. Если бы копии мешали, для полей без минуса подошёл бы \`std::tie\`, а для возраста — отдельное сравнение.`,
      examples: [
        {
          in: '4\nOslo 30 Ann\nBern 25 Bob\nOslo 40 Cid\nOslo 30 Abe\n',
          out: 'Bern 25 Bob\nOslo 40 Cid\nOslo 30 Abe\nOslo 30 Ann\n',
        },
        { in: '1\nRome 5 Leo\n', out: 'Rome 5 Leo\n' },
      ],
      hidden: [
        { in: '3\nA 1 x\nA 2 y\nA 3 z\n', name: 'Один город' },
        { in: '3\nC 10 a\nB 10 a\nA 10 a\n', name: 'Разные города' },
        { in: '3\nX 20 c\nX 20 b\nX 20 a\n', name: 'Равные возраст и город' },
        { in: '4\nP 0 a\nP 150 b\nQ 0 c\nQ 150 d\n', name: 'Крайние возрасты' },
        { in: '2\nparis 1 a\nParis 1 a\n', name: 'Регистр' },
        { in: '5\nB 5 e\nA 5 d\nB 6 c\nA 6 b\nA 5 a\n', name: 'Смешанные' },
        { in: '2\nZ 1 m\nZ 1 m\n', name: 'Одинаковые записи' },
        { in: '3\nAa 9 q\nA 9 q\nAaa 9 q\n', name: 'Префиксы городов' },
      ],
    },
    {
      title: 'Найди ошибку: статистика',
      bug: true,
      description: `
Программа читает целые числа до конца ввода; функция \`stats\` возвращает кортеж \`(минимум, максимум, сумма)\`, и программа печатает \`минимум A, максимум B, сумма S\` или \`пусто\`.

Максимум и сумма напечатаны неверно. Найдите и исправьте ошибку.`,
      constraints: ['Чисел не больше 1000; |числа| ≤ 10⁹.'],
      hints: [
        'В каком порядке функция кладёт значения в кортеж и в каком порядке их распаковывает main?',
        'Структурная привязка раскладывает элементы по порядку, а не по именам переменных. Порядок должен совпадать: auto [lo, hi, total].',
      ],
      starter: STATS(false),
      solution: STATS(true),
      explanation: `
\`stats\` возвращает \`{lo, hi, sum}\` — минимум, максимум, сумму. Привязка \`auto [lo, total, hi]\` раскладывает их по порядку: вторая переменная получает максимум, хотя называется \`total\`, а третья — сумму. Все три значения одного типа, поэтому компилятор не видит ошибки.

Это главный риск кортежей: у элементов нет имён, и смысл держится только на порядке. Когда элементов больше двух и они одного типа, надёжнее вернуть структуру — \`struct Stats { long long min, max, sum; };\` — тогда обращение \`s.max\` не перепутать.`,
      examples: [
        { in: '4 -2 9 1\n', out: 'минимум -2, максимум 9, сумма 12\n' },
        { in: '', out: 'пусто\n' },
      ],
      hidden: [
        '5\n',
        '1 2 3\n',
        '-1 -2 -3\n',
        '1000000000 1000000000\n',
        '0 0 0 1\n',
        '7 3 5\n',
        '-5 5\n',
        '2 2 2 2\n',
      ],
    },
    {
      title: 'Расписание',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\`, дальше \`n\` событий \`день ЧЧ:ММ длительность название\` (день — номер от 1, длительность в минутах). Отсортируйте события по дню, времени начала, затем по названию и напечатайте \`день ЧЧ:ММ название\`. Последней строкой напечатайте \`конфликтов: K\` — сколько событий начинается раньше, чем закончилось хотя бы одно из предыдущих (в отсортированном порядке) событий **того же дня**.

Ключ сортировки соберите кортежем.`,
      constraints: [
        '1 ≤ n ≤ 1000; 1 ≤ день ≤ 365; время от 00:00 до 23:59; 1 ≤ длительность ≤ 600; события не переходят через полночь; названия без пробелов.',
      ],
      hints: [
        'Переведите время в минуты от начала дня: start = ЧЧ · 60 + ММ. Время удобно прочитать как строку и разобрать: std::stoi(t.substr(0, 2)).',
        'Сортировка: std::tie(a.day, a.start, a.title) < std::tie(b.day, b.start, b.title) — все ключи по возрастанию, поэтому подходит кортеж ссылок.',
        'Для конфликтов храните наибольшее время окончания среди предыдущих событий текущего дня; при смене дня сбросьте его.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <string>
#include <tuple>
#include <vector>

struct Event {
    int day;
    int start;
    int duration;
    std::string title;
};

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<Event> events(static_cast<std::size_t>(n));
    for (auto &e : events) {
        std::string time;
        std::cin >> e.day >> time >> e.duration >> e.title;
        e.start = std::stoi(time.substr(0, 2)) * 60 + std::stoi(time.substr(3, 2));
    }
    std::sort(events.begin(), events.end(), [](const Event &a, const Event &b) {
        return std::tie(a.day, a.start, a.title) < std::tie(b.day, b.start, b.title);
    });
    int conflicts = 0;
    int current_day = 0, latest_end = 0;
    for (const auto &e : events) {
        if (e.day != current_day) {
            current_day = e.day;
            latest_end = 0;
        } else if (e.start < latest_end) {
            conflicts++;
        }
        latest_end = std::max(latest_end, e.start + e.duration);
        std::cout << e.day << ' ' << std::setfill('0') << std::setw(2) << e.start / 60 << ':' << std::setw(2)
                  << e.start % 60 << ' ' << e.title << '\n';
    }
    std::cout << "конфликтов: " << conflicts << '\n';
    return 0;
}`,
      explanation: `
Хронологический порядок — лексикографический порядок кортежа \`(день, начало, название)\`. Все три ключа сортируются по возрастанию, поэтому подходит \`std::tie\`: он собирает кортеж ссылок на поля и не копирует строки.

После сортировки события одного дня идут подряд по времени начала. Событие конфликтует с предыдущими, если начинается раньше самого позднего окончания среди них, — поэтому храним не конец предыдущего события, а максимум: длинная встреча может перекрыть несколько следующих коротких. При переходе к новому дню максимум сбрасывается. Весь алгоритм — \`O(n log n)\` на сортировку и один проход.`,
      examples: [
        {
          in: '3\n1 10:00 60 Meeting\n1 10:30 15 Call\n1 09:00 30 Standup\n',
          out: '1 09:00 Standup\n1 10:00 Meeting\n1 10:30 Call\nконфликтов: 1\n',
        },
        { in: '2\n2 08:00 30 B\n1 23:00 59 A\n', out: '1 23:00 A\n2 08:00 B\nконфликтов: 0\n' },
      ],
      hidden: [
        { in: '1\n1 00:00 1 Solo\n', name: 'Одно событие' },
        { in: '2\n1 10:00 60 A\n1 11:00 60 B\n', name: 'Встык' },
        {
          in: '3\n1 09:00 300 Long\n1 10:00 10 X\n1 12:00 10 Y\n',
          name: 'Длинное перекрывает несколько',
        },
        { in: '2\n1 10:00 30 B\n1 10:00 30 A\n', name: 'Одновременно' },
        { in: '3\n3 12:00 60 C\n2 12:00 60 B\n1 12:00 60 A\n', name: 'Разные дни' },
        { in: '2\n1 23:00 59 Late\n2 00:00 10 Early\n', name: 'Смена дня' },
        { in: '4\n5 08:05 5 a\n5 08:00 10 b\n5 08:20 5 c\n5 08:09 1 d\n', name: 'Смешанные' },
        { in: '3\n1 07:30 30 Run\n1 08:00 30 Shower\n1 08:29 1 Coffee\n', name: 'Граница минуты' },
      ],
    },
  ],
};
