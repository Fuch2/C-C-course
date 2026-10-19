const ACCOUNT = (fixed) => String.raw`
#include <iostream>
#include <print>

struct Account {
    long long balance = 0;
    int rejected = 0;

    void deposit(long long ${fixed ? 'amount' : 'balance'}) {
        balance += ${fixed ? 'amount' : 'balance'};
    }

    void withdraw(long long amount) {
        if (amount > balance) {
            rejected++;
            return;
        }
        balance -= amount;
    }
};

int main() {
    Account account;
    char operation;
    long long amount;
    while (std::cin >> operation >> amount) {
        if (operation == '+') {
            account.deposit(amount);
        } else {
            account.withdraw(amount);
        }
    }
    std::println("баланс {}, отказов {}", account.balance, account.rejected);
    return 0;
}`;

export default {
  id: 'oop-struct',
  title: 'Структуры с методами',
  description:
    'От C-структуры и отдельных функций к типу с поведением: методы и получатель вызова; const-методы и константные ссылки; значения полей по умолчанию и именованная инициализация; определение методов вне структуры через ::; структуры в контейнерах; почему структура не защищает свои данные.',
  moduleId: 'cpp-oop',
  order: 1,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp23-expected'],
  objectives: [
    'Объявлять методы в структуре и вызывать их через точку',
    'Помечать const методы, которые не меняют объект',
    'Задавать значения полей по умолчанию и пользоваться именованной инициализацией',
    'Определять методы вне структуры',
  ],
  tags: ['C++23', 'ООП', 'struct', 'Методы', 'const'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Box {
    int w = 1, h = 1, d = 1;
    int volume() const { return w * h * d; }
    void grow() { w++; h++; d++; }
};

int main() {
    Box b{2, 3};
    b.grow();
    std::println("{}", b.volume());
    return 0;
}`,
      lang: 'cpp',
      answers: ['24'],
      placeholder: 'Вывод программы',
      explain: 'b{2, 3} задаёт w = 2, h = 3, а d остаётся 1. После grow — 3, 4, 2: объём 24.',
    },
    {
      q: 'Что означает const после списка параметров метода — int get() const?',
      options: [
        'Метод не меняет объект; его можно вызывать у констант и через const &',
        'Метод возвращает константу',
        'Метод нельзя переопределить',
        'Метод вычисляется при компиляции',
      ],
      correct: 0,
      explain: 'Это обещание компилятору: внутри метода поля только читаются.',
    },
    {
      q: 'Функция принимает const Counter &c. Какие вызовы скомпилируются, если get() const, а increment() — без const? Выберите все.',
      options: ['c.get()', 'c.increment()', 'c.value (чтение поля)', 'c.value = 5'],
      correct: [0, 2],
      explain: 'Через константную ссылку можно читать поля и вызывать только const-методы.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Score {
    int points = 10;
    void add(int points) { points += points; }
};

int main() {
    Score s;
    s.add(5);
    std::println("{}", s.points);
    return 0;
}`,
      lang: 'cpp',
      answers: ['10'],
      placeholder: 'Вывод программы',
      explain:
        'Внутри add имя points означает параметр: метод удваивает свою копию аргумента, а поле не меняется.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Options {
    int width = 80;
    int height = 24;
    bool color = true;
};

int main() {
    Options o{.height = 50};
    std::println("{} {} {}", o.width, o.height, o.color);
    return 0;
}`,
      lang: 'cpp',
      answers: ['80 50 true'],
      placeholder: 'Вывод программы',
      explain:
        'Именованная инициализация задаёт только height; остальные поля получают значения по умолчанию.',
    },
    {
      q: 'Как правильно определить вне структуры метод, объявленный в ней как double area() const;?',
      options: [
        'double Rect::area() const { … }',
        'double area() const { … }',
        'double Rect.area() const { … }',
        'Rect::double area() { … }',
      ],
      correct: 0,
      explain:
        'Имя структуры и :: указывают, чей это метод; const повторяется — это часть типа метода.',
    },
    {
      q: 'Почему метод Point moved(double dx, double dy) const удобнее, чем void move(double dx, double dy)?',
      options: [
        'Он не меняет исходную точку и работает даже у константы — результат возвращается новым объектом',
        'Он быстрее, потому что ничего не копирует',
        'Методы с void нельзя вызывать через точку',
        'moved можно вызвать без объекта',
      ],
      correct: 0,
      explain: 'Оба варианта полезны; moved не трогает получателя и годится для const-объектов.',
    },
    {
      q: 'Чего не умеет структура с открытыми полями?',
      options: [
        'Защитить свои данные от изменения в обход правил',
        'Иметь методы',
        'Храниться в std::vector',
        'Иметь значения полей по умолчанию',
      ],
      correct: 0,
      explain:
        'Любой код может присвоить полю что угодно. Защиту правил даёт класс с закрытыми полями.',
    },
    {
      q: 'Чему равно поле count в объекте Tally t; если структура объявлена как struct Tally { int count; };?',
      options: [
        'Неопределённому значению — мусору',
        'Нулю',
        'Единице',
        'Программа не скомпилируется',
      ],
      correct: 0,
      explain:
        'Без значения по умолчанию локальный объект содержит то, что осталось в памяти. Пишите int count = 0;.',
    },
  ],
  exercises: [
    {
      id: 'oop-struct-exercise',
      title: 'Прямоугольники',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — ширина и высота прямоугольника. Опишите структуру \`Rect\` с полями \`width\`, \`height\` и методами \`area() const\`, \`perimeter() const\` и \`is_square() const\`. Для каждого прямоугольника напечатайте:

\`\`\`text
площадь 12.00, периметр 14.00, квадрат: нет
\`\`\``,
      constraints: [
        'Стороны — положительные числа до 10 000 с не более чем двумя знаками после точки; строк не больше 20.',
      ],
      hints: [
        'Все три метода только читают поля — помечайте их const.',
        'Числа печатайте через {:.2f}, а ответ про квадрат — через тернарный оператор: r.is_square() ? "да" : "нет".',
      ],
      solution: String.raw`
#include <iostream>
#include <print>

struct Rect {
    double width = 0;
    double height = 0;

    double area() const {
        return width * height;
    }

    double perimeter() const {
        return 2 * (width + height);
    }

    bool is_square() const {
        return width == height;
    }
};

int main() {
    Rect r;
    while (std::cin >> r.width >> r.height) {
        std::println("площадь {:.2f}, периметр {:.2f}, квадрат: {}", r.area(), r.perimeter(),
                     r.is_square() ? "да" : "нет");
    }
    return 0;
}`,
      explanation: `
Все вычисления о прямоугольнике живут внутри \`Rect\`: \`main\` только читает данные и печатает ответы. Методы помечены \`const\` — они не меняют прямоугольник, и их можно было бы вызвать через \`const Rect &\`.

Поля читаются прямо в объект: \`std::cin >> r.width >> r.height\`. Значения по умолчанию \`= 0\` гарантируют, что объект никогда не содержит мусора, даже до первого чтения.`,
      examples: [
        {
          in: '3 4\n5 5\n',
          out: 'площадь 12.00, периметр 14.00, квадрат: нет\nплощадь 25.00, периметр 20.00, квадрат: да\n',
        },
        { in: '2.5 0.5\n', out: 'площадь 1.25, периметр 6.00, квадрат: нет\n' },
      ],
      hidden: [
        { in: '1 1\n', name: 'Единичный квадрат' },
        { in: '10000 10000\n', name: 'Большой квадрат' },
        { in: '0.01 10000\n', name: 'Вытянутый' },
        { in: '7 3\n3 7\n', name: 'Повёрнутый' },
        { in: '1.5 1.5\n', name: 'Дробный квадрат' },
        { in: '', name: 'Пустой ввод' },
        { in: '12.34 5.67\n', name: 'Дробные стороны' },
        { in: '2 2\n2 3\n3 3\n', name: 'Три прямоугольника' },
      ],
    },
    {
      title: 'Маршрут',
      description: `
Ввод: число \`n\`, затем \`n\` точек — пары целых координат. Опишите структуру \`Point\` с методами \`double distance_to(Point other) const\` и \`double from_origin() const\` (расстояние до начала координат). Напечатайте:

\`\`\`text
длина маршрута 10.000
дальше всех (6, 8)
\`\`\`

Длина маршрута — сумма расстояний между соседними точками в порядке ввода. Дальняя точка — самая удалённая от начала координат; при равенстве — та, что встретилась раньше.`,
      constraints: ['1 ≤ n ≤ 100; координаты по модулю до 10⁴.'],
      hints: [
        'Расстояние — std::hypot(x - other.x, y - other.y) из <cmath>.',
        'Храните точки в std::vector<Point> и пройдите по соседним парам индексов i - 1 и i.',
      ],
      solution: String.raw`
#include <cmath>
#include <iostream>
#include <print>
#include <vector>

struct Point {
    int x = 0;
    int y = 0;

    double distance_to(Point other) const {
        return std::hypot(x - other.x, y - other.y);
    }

    double from_origin() const {
        return distance_to(Point{});
    }
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Point> points(static_cast<std::size_t>(n));
    for (Point &p : points) {
        std::cin >> p.x >> p.y;
    }
    double length = 0;
    std::size_t farthest = 0;
    for (std::size_t i = 0; i < points.size(); i++) {
        if (i > 0) {
            length += points[i - 1].distance_to(points[i]);
        }
        if (points[i].from_origin() > points[farthest].from_origin()) {
            farthest = i;
        }
    }
    std::println("длина маршрута {:.3f}", length);
    std::println("дальше всех ({}, {})", points[farthest].x, points[farthest].y);
    return 0;
}`,
      explanation: `
\`from_origin\` выражен через \`distance_to\`: начало координат — это \`Point{}\`, точка со значениями по умолчанию. Один метод опирается на другой, и формула расстояния написана один раз.

\`std::hypot\` вычисляет \`√(dx² + dy²)\` без переполнения промежуточных квадратов. Сравнение \`>\` (а не \`>=\`) оставляет при равенстве первую точку.`,
      examples: [
        { in: '3\n0 0\n3 4\n6 8\n', out: 'длина маршрута 10.000\nдальше всех (6, 8)\n' },
        { in: '1\n-2 0\n', out: 'длина маршрута 0.000\nдальше всех (-2, 0)\n' },
      ],
      hidden: [
        { in: '2\n0 0\n0 0\n', name: 'Одна точка дважды' },
        { in: '4\n1 1\n-1 1\n-1 -1\n1 -1\n', name: 'Квадрат' },
        { in: '3\n5 0\n0 5\n-5 0\n', name: 'Равные расстояния' },
        { in: '2\n10000 10000\n-10000 -10000\n', name: 'Большие координаты' },
        { in: '5\n0 0\n1 0\n1 1\n0 1\n0 0\n', name: 'Замкнутый путь' },
        { in: '3\n0 1\n0 2\n0 3\n', name: 'По прямой' },
        { in: '2\n1 2\n4 6\n', name: 'Пифагоров отрезок' },
        { in: '4\n7 7\n0 0\n-3 9\n2 -8\n', name: 'Смесь' },
      ],
    },
    {
      title: 'Найди ошибку: вклад, который не зачисляется',
      bug: true,
      description: `
Программа ведёт счёт: каждая строка ввода — операция \`+ сумма\` (вклад) или \`- сумма\` (снятие). Снятие больше остатка отклоняется. В конце печатается остаток и число отклонённых снятий:

\`\`\`text
баланс 70, отказов 1
\`\`\`

Вклады почему-то не зачисляются. Найдите и исправьте ошибку в структуре \`Account\`.`,
      constraints: ['Операций не больше 50, суммы от 1 до 10⁹.'],
      hints: [
        'Посмотрите на метод deposit: какую переменную он увеличивает?',
        'Параметр назван так же, как поле, и внутри метода имя balance означает параметр. Переименуйте параметр, например в amount.',
      ],
      starter: ACCOUNT(false),
      solution: ACCOUNT(true),
      explanation: `
Внутри \`deposit\` имя \`balance\` относится к **параметру**: параметр — более близкое объявление, и оно скрывает поле с тем же именем. Строка \`balance += balance\` удваивает копию аргумента, которая исчезает при выходе из метода, а поле счёта не меняется. Компилятор не предупреждает: код корректен, просто делает не то.

Исправление — дать параметру другое имя. Иногда поля помечают особым образом (\`balance_\`, \`m_balance\`), чтобы такая путаница была невозможна, — так поступают многие руководства по стилю. Обратиться к полю явно можно и через \`this->balance\`.`,
      examples: [
        { in: '+ 100\n- 30\n- 500\n', out: 'баланс 70, отказов 1\n' },
        { in: '- 1\n', out: 'баланс 0, отказов 1\n' },
      ],
      hidden: [
        '+ 1\n',
        '+ 1000000000\n+ 1000000000\n- 1\n',
        '+ 50\n- 50\n- 1\n',
        '+ 10\n+ 20\n+ 30\n',
        '- 5\n+ 5\n- 5\n',
        '+ 100\n- 99\n- 2\n- 1\n',
        '+ 7\n- 8\n+ 1\n- 8\n',
        '+ 3\n',
      ],
    },
    {
      title: 'Расписание',
      difficulty: 'advanced',
      description: `
Первая строка ввода — время начала \`ЧЧ:ММ\`. Каждая следующая — дело: название (одно слово) и длительность в минутах. Дела идут подряд без перерывов. Напечатайте для каждого дела строку \`ЧЧ:ММ-ЧЧ:ММ название\`, а в конце — \`итого N мин\`.

Время идёт по кругу: после \`23:59\` наступает \`00:00\`. Опишите структуру \`Time\` с полями \`hours\`, \`minutes\` и методом \`Time after(int duration) const\`, который возвращает время через \`duration\` минут.`,
      constraints: ['Дел не больше 30; длительность от 1 до 1440 минут.'],
      hints: [
        'Внутри after удобно перейти к минутам от полуночи: total = hours * 60 + minutes + duration, затем взять остаток от деления на 1440.',
        'Время читается так: char colon; std::cin >> t.hours >> colon >> t.minutes; печать с ведущими нулями — {:02}:{:02}.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

struct Time {
    int hours = 0;
    int minutes = 0;

    Time after(int duration) const {
        int total = (hours * 60 + minutes + duration) % (24 * 60);
        return {total / 60, total % 60};
    }
};

int main() {
    Time now;
    char colon;
    std::cin >> now.hours >> colon >> now.minutes;
    std::string name;
    int duration;
    int sum = 0;
    while (std::cin >> name >> duration) {
        Time end = now.after(duration);
        std::println("{:02}:{:02}-{:02}:{:02} {}", now.hours, now.minutes, end.hours, end.minutes, name);
        now = end;
        sum += duration;
    }
    std::println("итого {} мин", sum);
    return 0;
}`,
      explanation: `
\`after\` не меняет время, а возвращает новое — поэтому он \`const\` и его удобно применять к текущему моменту в цикле: \`now = now.after(…)\`. Переход через полночь решается одним остатком от деления на 1440 — количеством минут в сутках.

Перевод «часы и минуты → минуты от полуночи → часы и минуты» — обычный приём для времени: считать в одной единице проще, чем переносить минуты в часы вручную. Ведущие нули даёт спецификация \`{:02}\`.`,
      examples: [
        {
          in: '09:00\nзарядка 15\nзавтрак 30\n',
          out: '09:00-09:15 зарядка\n09:15-09:45 завтрак\nитого 45 мин\n',
        },
        { in: '23:50\nфильм 20\n', out: '23:50-00:10 фильм\nитого 20 мин\n' },
      ],
      hidden: [
        { in: '00:00\n', name: 'Без дел' },
        { in: '00:00\nсутки 1440\n', name: 'Ровно сутки' },
        { in: '12:34\na 1\nb 1\nc 1\n', name: 'По минуте' },
        { in: '23:59\nшаг 1\n', name: 'Полночь' },
        { in: '07:05\nдорога 55\nработа 480\nобед 60\n', name: 'Рабочий день' },
        { in: '18:00\nсон 720\n', name: 'Через полночь надолго' },
        { in: '01:01\nx 59\ny 61\n', name: 'Границы часа' },
        { in: '22:30\nигра 1000\nчтение 45\n', name: 'Долгое дело' },
      ],
    },
  ],
};
