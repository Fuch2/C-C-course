const TEAM = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Player {
public:
    Player(std::string name, int salary) : name_(std::move(name)), salary_(salary) {}

    int salary() const {
        return salary_;
    }

    void set_salary(int value) {
        salary_ = value;
    }

private:
    std::string name_;
    int salary_;
};

// Инвариант: сумма зарплат игроков не превышает лимит команды.
class Team {
public:
    explicit Team(int cap) : cap_(cap) {}

    bool hire(Player p) {
        if (payroll() + p.salary() > cap_) {
            return false;
        }
        players_.push_back(std::move(p));
        return true;
    }
${
  fixed
    ? `
    bool raise(std::size_t i, int amount) {
        if (i >= players_.size() || payroll() + amount > cap_) {
            return false;
        }
        players_[i].set_salary(players_[i].salary() + amount);
        return true;
    }
`
    : `
    Player &player(std::size_t i) {
        return players_[i];
    }

    std::size_t size() const {
        return players_.size();
    }
`
}
    int payroll() const {
        int sum = 0;
        for (const Player &p : players_) {
            sum += p.salary();
        }
        return sum;
    }

private:
    int cap_;
    std::vector<Player> players_;
};

int main() {
    int cap;
    std::cin >> cap;
    Team team(cap);
    std::string command;
    while (std::cin >> command) {
        if (command == "hire") {
            std::string name;
            int salary;
            std::cin >> name >> salary;
            std::println("{}", team.hire(Player(name, salary)) ? "принят" : "отказ");
        } else {
            std::size_t i;
            int amount;
            std::cin >> i >> amount;
${
  fixed
    ? '            std::println("{}", team.raise(i, amount) ? "повышено" : "отказ");'
    : `            if (i < team.size()) {
                Player &p = team.player(i);
                p.set_salary(p.salary() + amount);
                std::println("повышено");
            } else {
                std::println("отказ");
            }`
}
        }
    }
    std::println("фонд {} из {}", team.payroll(), cap);
    return 0;
}`;

export default {
  id: 'oop-composition',
  title: 'Композиция: объект из объектов',
  description:
    'Композиция — объекты-части как поля; распределение ответственности между классами; владение: части создаются, копируются и уничтожаются вместе с целым; делегирование и закон Деметры; инвариант, связывающий части, охраняет внешний класс.',
  moduleId: 'cpp-oop',
  order: 11,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-printing'],
  objectives: [
    'Собирать классы из объектов-частей',
    'Распределять ответственность между целым и частями',
    'Делегировать операции частям, не раскрывая их клиентам',
    'Охранять инвариант, связывающий части',
  ],
  tags: ['C++23', 'ООП', 'Композиция', 'Делегирование'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <vector>

class Bag {
public:
    void add(int w) { items_.push_back(w); }
    int weight() const {
        int s = 0;
        for (int w : items_) s += w;
        return s;
    }

private:
    std::vector<int> items_;
};

int main() {
    Bag a;
    a.add(3);
    Bag b = a;
    b.add(4);
    std::println("{} {}", a.weight(), b.weight());
    return 0;
}`,
      lang: 'cpp',
      answers: ['3 7'],
      placeholder: 'Вывод программы',
      explain:
        'Копия владеет своими частями: вектор копируется вместе с объектом, и изменения b не затрагивают a.',
    },
    {
      q: 'Что означает композиция?',
      options: [
        'Объект содержит другие объекты как поля и владеет ими',
        'Класс наследует другой класс',
        'Объект хранит указатель на чужой объект, не владея им',
        'Функция вызывает другую функцию',
      ],
      correct: 0,
      explain: 'Части создаются и уничтожаются вместе с целым.',
    },
    {
      q: 'Что выведет программа? Запишите вывод в одну строку через пробел.',
      code: String.raw`
#include <print>

struct Part {
    char n;
    explicit Part(char n) : n(n) { std::print("+{} ", n); }
    ~Part() { std::print("-{} ", n); }
};

struct Whole {
    Part a{'a'};
    Part b{'b'};
};

int main() {
    {
        Whole w;
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['+a +b -b -a'],
      placeholder: 'Вывод программы',
      explain: 'Части создаются в порядке объявления и уничтожаются в обратном — вместе с целым.',
    },
    {
      q: 'Класс Car содержит поле Engine engine_. Какой интерфейс лучше?',
      options: [
        'void refuel(int) и void start(), которые делегируют работу двигателю',
        'Engine &engine(), чтобы клиент сам управлял двигателем',
        'Открытое поле engine_',
        'Engine *engine() с возвратом указателя',
      ],
      correct: 0,
      explain:
        'Клиент работает с машиной, а не с её деталями; двигатель можно заменить, не трогая клиентов.',
    },
    {
      q: 'Что говорит закон Деметры?',
      options: [
        'Разговаривай только с непосредственными друзьями: не тянись через объект к его частям',
        'Каждый класс должен иметь деструктор',
        'Поля нужно делать открытыми',
        'Наследование лучше композиции',
      ],
      correct: 0,
      explain: 'car.engine().refuel() нарушает его, car.refuel() — нет.',
    },
    {
      q: 'Кто должен охранять инвариант «сумма площадей комнат не больше площади квартиры»?',
      options: [
        'Класс квартиры: только он видит все комнаты',
        'Каждая комната',
        'Клиентский код',
        'Деструктор квартиры',
      ],
      correct: 0,
      explain: 'Инвариант, связывающий части, охраняет целое.',
    },
    {
      q: 'Почему Order::total лучше считать через line.cost(), а не через поля позиции?',
      options: [
        'Если у позиции появится скидка, изменится только Line::cost, а Order останется прежним',
        'Поля позиции всё равно закрыты, иначе нельзя',
        'Так быстрее',
        'Иначе не скомпилируется',
      ],
      correct: 0,
      explain: 'Каждый класс отвечает за своё: позиция знает свою стоимость.',
    },
    {
      q: 'Почему часть, которая не нужна отдельно от целого, лучше хранить полем, а не указателем new?',
      options: [
        'Поле создаётся и уничтожается автоматически и правильно копируется; указатель требует delete и ломает копирование',
        'Указатели запрещены в классах',
        'Поле занимает меньше памяти, чем указатель',
        'Без указателя нельзя делегировать',
      ],
      correct: 0,
      explain: 'Классы из стандартных частей копируются и освобождаются сами.',
    },
  ],
  exercises: [
    {
      id: 'oop-composition-exercise',
      title: 'Заказ',
      difficulty: 'beginner',
      description: `
Опишите класс \`Line\` (товар, цена, количество) с методом \`int cost() const\` и класс \`Order\`, который хранит позиции в векторе и умеет \`add(Line)\`, \`total()\` и \`size()\`. Каждая строка ввода — позиция: товар, цена и количество. Напечатайте для каждой позиции \`товар: стоимость\`, затем \`позиций N, итого S\`.`,
      constraints: ['Позиций не больше 30; цены до 10⁶, количество до 100.'],
      hints: [
        'Order не читает поля Line — он вызывает line.cost().',
        'Печатать позиции удобно в main, сразу при чтении; итог — через order.size() и order.total().',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Line {
public:
    Line(std::string item, long long price, int quantity)
        : item_(std::move(item)), price_(price), quantity_(quantity) {}

    long long cost() const {
        return price_ * quantity_;
    }

    const std::string &item() const {
        return item_;
    }

private:
    std::string item_;
    long long price_;
    int quantity_;
};

class Order {
public:
    void add(Line line) {
        lines_.push_back(std::move(line));
    }

    long long total() const {
        long long sum = 0;
        for (const Line &line : lines_) {
            sum += line.cost();
        }
        return sum;
    }

    std::size_t size() const {
        return lines_.size();
    }

private:
    std::vector<Line> lines_;
};

int main() {
    Order order;
    std::string item;
    long long price;
    int quantity;
    while (std::cin >> item >> price >> quantity) {
        Line line(item, price, quantity);
        std::println("{}: {}", line.item(), line.cost());
        order.add(std::move(line));
    }
    std::println("позиций {}, итого {}", order.size(), order.total());
    return 0;
}`,
      explanation: `
Позиция знает свою стоимость, заказ — свою сумму. \`Order::total\` не умножает цену на количество сам, а спрашивает у каждой позиции \`cost()\`: правила расчёта позиции живут в одном месте.

Заказ владеет позициями — они лежат в его векторе и исчезнут вместе с ним. \`std::move\` передаёт позицию в вектор без копирования строки; после этого \`line\` в \`main\` больше не используется.`,
      examples: [
        {
          in: 'книга 450 2\nлампа 1200 1\n',
          out: 'книга: 900\nлампа: 1200\nпозиций 2, итого 2100\n',
        },
        { in: '', out: 'позиций 0, итого 0\n' },
      ],
      hidden: [
        { in: 'a 1 1\n', name: 'Одна позиция' },
        { in: 'x 1000000 100\n', name: 'Большая сумма' },
        { in: 'a 0 5\nb 5 0\n', name: 'Нули' },
        { in: 'чай 100 3\nчай 100 2\n', name: 'Повтор товара' },
        { in: 'p 1 1\nq 2 2\nr 3 3\ns 4 4\n', name: 'Четыре' },
        { in: 'ноутбук 99999 1\nмышь 999 2\n', name: 'Техника' },
        { in: 'a 7 100\n', name: 'Количество 100' },
        { in: 'z 999999 99\ny 1 1\n', name: 'Почти максимум' },
      ],
    },
    {
      title: 'Плеер',
      description: `
Опишите класс \`Playlist\` (песни и номер текущей) и класс \`Player\`, который **содержит** плейлист и делегирует ему операции. Клиент работает только с \`Player\`:

- \`add название\` — добавить песню (первая добавленная становится текущей);
- \`next\`, \`prev\` — следующая или предыдущая песня по кругу;
- \`play\` — напечатать \`играет: название\` или \`плейлист пуст\`.

\`next\` и \`prev\` для пустого плейлиста ничего не делают.`,
      constraints: ['Команд не больше 100; названия — одно слово.'],
      hints: [
        'Playlist: std::vector<std::string> songs_ и std::size_t current_ = 0. next: current_ = (current_ + 1) % size; prev: (current_ + size - 1) % size.',
        'Player хранит поле Playlist list_ и открывает add, next, prev, play — каждый вызывает соответствующий метод плейлиста. Метод const std::string *current() const у плейлиста может вернуть nullptr для пустого.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Playlist {
public:
    void add(const std::string &song) {
        songs_.push_back(song);
    }

    void next() {
        if (!songs_.empty()) {
            current_ = (current_ + 1) % songs_.size();
        }
    }

    void prev() {
        if (!songs_.empty()) {
            current_ = (current_ + songs_.size() - 1) % songs_.size();
        }
    }

    const std::string *current() const {
        return songs_.empty() ? nullptr : &songs_[current_];
    }

private:
    std::vector<std::string> songs_;
    std::size_t current_ = 0;
};

class Player {
public:
    void add(const std::string &song) {
        list_.add(song);
    }

    void next() {
        list_.next();
    }

    void prev() {
        list_.prev();
    }

    void play() const {
        if (const std::string *song = list_.current()) {
            std::println("играет: {}", *song);
        } else {
            std::println("плейлист пуст");
        }
    }

private:
    Playlist list_;
};

int main() {
    Player player;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string song;
            std::cin >> song;
            player.add(song);
        } else if (command == "next") {
            player.next();
        } else if (command == "prev") {
            player.prev();
        } else {
            player.play();
        }
    }
    return 0;
}`,
      explanation: `
\`Player\` ничего не делает сам — он делегирует. Это не лишний слой: клиент знает только о плеере, а устройство плейлиста можно менять (перемешивание, история прослушивания), не трогая клиентов. Плеер мог бы добавить и своё поведение — громкость, паузу, — не смешивая его с хранением песен.

\`current()\` возвращает указатель, а не ссылку: он может быть \`nullptr\`, если песен нет. Возвращается указатель на константу — клиент не может изменить песню через него. Переход «назад по кругу» записан как \`(current + size − 1) % size\`: у беззнаковых чисел вычитание единицы из нуля дало бы огромное значение.`,
      examples: [
        {
          in: 'add a\nadd b\nadd c\nplay\nnext\nnext\nnext\nplay\nprev\nplay\n',
          out: 'играет: a\nиграет: a\nиграет: c\n',
        },
        { in: 'play\nnext\nplay\n', out: 'плейлист пуст\nплейлист пуст\n' },
      ],
      hidden: [
        { in: 'add x\nnext\nprev\nplay\n', name: 'Одна песня' },
        { in: 'add a\nadd b\nprev\nplay\n', name: 'Назад с первой' },
        { in: 'add a\nadd b\nadd c\nnext\nplay\nnext\nplay\n', name: 'Вперёд' },
        { in: 'prev\nadd a\nplay\n', name: 'Назад в пустом' },
        { in: 'add a\nplay\nadd b\nplay\nnext\nplay\n', name: 'Добавление на ходу' },
        { in: '', name: 'Без команд' },
        { in: 'add один\nadd два\nnext\nnext\nplay\n', name: 'Полный круг' },
        { in: 'add a\nadd b\nadd c\nprev\nprev\nprev\nprev\nplay\n', name: 'Много назад' },
      ],
    },
    {
      title: 'Найди ошибку: целое не охраняет инвариант',
      bug: true,
      description: `
Команда хранит игроков и обещает: **суммарный фонд зарплат не превышает лимит**. Первое число — лимит. Команды:

- \`hire имя зарплата\` — нанять (\`принят\` или \`отказ\`);
- \`raise i сумма\` — повысить зарплату игрока номер \`i\` (с нуля) на сумму (\`повышено\` или \`отказ\`, если номер неверный или лимит будет превышен).

В конце печатается \`фонд F из L\`. После повышений фонд превышает лимит. Найдите ошибку в устройстве классов и исправьте её так, чтобы нарушить инвариант снаружи было невозможно.`,
      constraints: ['Лимит до 10⁶; команд не больше 50; зарплаты и суммы от 1 до 10⁶.'],
      hints: [
        'Через какой метод main меняет зарплату и проверяет ли кто-нибудь лимит?',
        'Team отдаёт игрока по неконстантной ссылке, и изменение проходит мимо команды. Уберите player(i) и добавьте Team::raise(i, amount), который проверяет лимит до изменения.',
      ],
      starter: TEAM(false),
      solution: TEAM(true),
      explanation: `
Каждая часть — \`Player\` — допустима сама по себе: у неё любая положительная зарплата. Правило «фонд не больше лимита» связывает всех игроков, и охранять его может только \`Team\`. Но \`Team\` отдавал игрока по неконстантной ссылке, и \`main\` повышал зарплату напрямую — команда даже не знала об изменении.

Исправление — операция на уровне целого: \`Team::raise\` проверяет номер и лимит **до** изменения и только потом меняет зарплату. Ссылки на части наружу больше не уходят, и обойти проверку нельзя.`,
      examples: [
        {
          in: '100\nhire Ада 60\nhire Алан 30\nraise 1 20\n',
          out: 'принят\nпринят\nотказ\nфонд 90 из 100\n',
        },
        {
          in: '50\nhire A 10\nraise 0 40\nraise 5 1\n',
          out: 'принят\nповышено\nотказ\nфонд 50 из 50\n',
        },
      ],
      hidden: [
        '10\nhire a 5\nraise 0 6\n',
        '100\nhire a 50\nhire b 50\nraise 0 1\n',
        '1000\nhire a 1\nraise 0 999\nraise 0 1\n',
        '30\nhire a 10\nhire b 10\nraise 0 5\nraise 1 6\n',
        '5\nhire a 6\nraise 0 1\n',
        '100\nhire a 40\nraise 0 30\nraise 0 30\n',
        '1000000\nhire a 999999\nraise 0 2\n',
        '20\nhire a 5\nhire b 5\nraise 1 10\nraise 0 1\n',
      ],
    },
    {
      title: 'Расписание поездов',
      difficulty: 'advanced',
      description: `
Ввод: число маршрутов, затем каждый маршрут — название, число остановок \`k\` и \`k\` строк \`станция ЧЧ:ММ\` (время прибытия, по возрастанию, в пределах суток). После маршрутов идут запросы:

- \`show маршрут\` — остановки маршрута в виде \`ЧЧ:ММ станция\`;
- \`trip маршрут A B\` — время в пути от станции A до станции B в минутах (\`N мин\`) или \`нет такого участка\`, если какой-то станции нет на маршруте или A не раньше B.

Неизвестный маршрут — \`нет маршрута\`. Постройте композицию из трёх уровней: \`Time\` → \`Stop\` (станция и время) → \`Route\` (остановки) → \`Schedule\` (маршруты по названию).`,
      constraints: ['Маршрутов до 10, остановок до 20, запросов до 30; названия — одно слово.'],
      hints: [
        'Time хранит минуты от полуночи и умеет minutes(); Route умеет find(station) → индекс или −1 и duration(a, b) через find; Schedule — std::map<std::string, Route> с методом const Route *find(name) const.',
        'Запрос trip: маршрут найден → индексы обеих станций найдены и i < j → разница времени j и i.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <optional>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Time {
public:
    Time(int h, int m) : minutes_(h * 60 + m) {}

    int minutes() const {
        return minutes_;
    }

    int hours_part() const {
        return minutes_ / 60;
    }

    int minutes_part() const {
        return minutes_ % 60;
    }

private:
    int minutes_;
};

struct Stop {
    std::string station;
    Time arrival;
};

class Route {
public:
    void add(Stop stop) {
        stops_.push_back(std::move(stop));
    }

    void print() const {
        for (const Stop &s : stops_) {
            std::println("{:02}:{:02} {}", s.arrival.hours_part(), s.arrival.minutes_part(), s.station);
        }
    }

    std::optional<int> duration(const std::string &from, const std::string &to) const {
        int i = find(from), j = find(to);
        if (i < 0 || j < 0 || i >= j) {
            return std::nullopt;
        }
        return stops_[static_cast<std::size_t>(j)].arrival.minutes() -
               stops_[static_cast<std::size_t>(i)].arrival.minutes();
    }

private:
    int find(const std::string &station) const {
        for (std::size_t i = 0; i < stops_.size(); i++) {
            if (stops_[i].station == station) {
                return static_cast<int>(i);
            }
        }
        return -1;
    }

    std::vector<Stop> stops_;
};

class Schedule {
public:
    void add(const std::string &name, Route route) {
        routes_[name] = std::move(route);
    }

    const Route *find(const std::string &name) const {
        auto it = routes_.find(name);
        return it == routes_.end() ? nullptr : &it->second;
    }

private:
    std::map<std::string, Route> routes_;
};

int main() {
    Schedule schedule;
    int count;
    std::cin >> count;
    for (int r = 0; r < count; r++) {
        std::string name;
        int k;
        std::cin >> name >> k;
        Route route;
        for (int i = 0; i < k; i++) {
            std::string station;
            int h, m;
            char colon;
            std::cin >> station >> h >> colon >> m;
            route.add({station, Time(h, m)});
        }
        schedule.add(name, std::move(route));
    }
    std::string command, name;
    while (std::cin >> command >> name) {
        const Route *route = schedule.find(name);
        if (command == "show") {
            if (route) {
                route->print();
            } else {
                std::println("нет маршрута");
            }
            continue;
        }
        std::string a, b;
        std::cin >> a >> b;
        if (!route) {
            std::println("нет маршрута");
        } else if (auto minutes = route->duration(a, b)) {
            std::println("{} мин", *minutes);
        } else {
            std::println("нет такого участка");
        }
    }
    return 0;
}`,
      explanation: `
Каждый уровень знает ровно своё: \`Time\` — как хранить и печатать время, \`Route\` — как искать станции и считать время в пути, \`Schedule\` — как находить маршрут по имени. \`main\` не заглядывает ни в вектор остановок, ни в словарь маршрутов: он спрашивает \`schedule.find\` и \`route->duration\`.

\`Schedule::find\` возвращает указатель на константу: маршрута может не быть (\`nullptr\`), а найденный нельзя изменить снаружи. \`duration\` возвращает \`std::optional<int>\` — ответа может не быть, и тип говорит об этом прямо. Поиск станции закрыт: это деталь реализации маршрута.`,
      examples: [
        {
          in: '1\nR1 3\nМосква 08:00\nТверь 09:45\nПетербург 12:10\nshow R1\ntrip R1 Москва Петербург\ntrip R1 Тверь Москва\n',
          out: '08:00 Москва\n09:45 Тверь\n12:10 Петербург\n250 мин\nнет такого участка\n',
        },
        { in: '0\nshow X\ntrip X a b\n', out: 'нет маршрута\nнет маршрута\n' },
      ],
      hidden: [
        { in: '1\nA 2\nx 00:00\ny 23:59\ntrip A x y\n', name: 'Целые сутки' },
        { in: '1\nA 2\nx 10:00\ny 10:30\ntrip A x x\n', name: 'Та же станция' },
        { in: '1\nA 2\nx 10:00\ny 10:30\ntrip A x z\n', name: 'Нет станции' },
        {
          in: '2\nA 2\nx 10:00\ny 11:00\nB 2\ny 12:00\nz 12:05\ntrip B y z\nshow A\n',
          name: 'Два маршрута',
        },
        { in: '1\nA 1\nx 06:07\nshow A\n', name: 'Одна остановка' },
        {
          in: '1\nA 4\na 01:00\nb 02:00\nc 03:30\nd 05:00\ntrip A b d\ntrip A a c\n',
          name: 'Внутренние участки',
        },
        { in: '1\nA 2\nx 10:00\ny 11:00\nshow B\n', name: 'Неизвестный маршрут' },
        {
          in: '1\nЛасточка 3\nМосква 09:00\nКлин 10:05\nТверь 10:50\ntrip Ласточка Клин Тверь\n',
          name: 'Кириллица',
        },
      ],
    },
  ],
};
