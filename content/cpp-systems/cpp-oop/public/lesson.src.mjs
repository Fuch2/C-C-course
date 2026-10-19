const OPEN_INSIDE = (fixed) => String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <vector>

// Инвариант: items_ всегда упорядочен по возрастанию.
class SortedList {
public:
    void insert(int value) {
        auto pos = std::ranges::upper_bound(items_, value);
        items_.insert(pos, value);
    }

${fixed ? '    const std::vector<int> &items() const {' : '    std::vector<int> &items() {'}
        return items_;
    }

    int min() const {
        return items_.front();
    }

    int max() const {
        return items_.back();
    }

private:
    std::vector<int> items_;
};

int main() {
    SortedList list;
    int x;
    while (std::cin >> x) {
        ${fixed ? 'list.insert(x);' : 'list.items().push_back(x);'}
    }
    if (list.items().empty()) {
        std::println("пусто");
        return 0;
    }
    std::println("min {}, max {}, всего {}", list.min(), list.max(), list.items().size());
    return 0;
}`;

export default {
  id: 'oop-public',
  title: 'Открытый интерфейс',
  description:
    'Интерфейс как обещание клиентам; операции предметной области вместо пар «получить/установить»; принцип «говори, а не спрашивай»; почему нельзя отдавать неконстантную ссылку на закрытые данные; что возвращать — значение или const &; статические члены: общие данные, константы и функции класса.',
  moduleId: 'cpp-oop',
  order: 4,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-constructors'],
  objectives: [
    'Проектировать интерфейс из операций, а не из доступа к полям',
    'Возвращать закрытые данные, не нарушая инкапсуляцию',
    'Объявлять статические данные, константы и функции класса',
  ],
  tags: ['C++23', 'ООП', 'Интерфейс', 'static'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Wallet {
public:
    bool pay(int sum) {
        if (sum > money_) return false;
        money_ -= sum;
        return true;
    }
    void add(int sum) { money_ += sum; }
    int money() const { return money_; }

private:
    int money_ = 100;
};

int main() {
    Wallet w;
    w.pay(70);
    w.pay(40);
    w.add(10);
    w.pay(40);
    std::println("{}", w.money());
    return 0;
}`,
      lang: 'cpp',
      answers: ['0'],
      placeholder: 'Вывод программы',
      explain: '100 − 70 = 30; платёж 40 отклонён; +10 = 40; платёж 40 проходит — остаётся 0.',
    },
    {
      q: 'Почему пара методов balance() и set_balance() — плохой интерфейс для счёта?',
      options: [
        'set_balance позволяет записать любое значение, и правила работы со счётом расходятся по клиентам',
        'Методы с префиксом set запрещены',
        'Получать баланс нельзя',
        'Такой интерфейс работает медленнее',
      ],
      correct: 0,
      explain:
        'Нужны операции предметной области — deposit и withdraw, которые сами проверяют правила.',
    },
    {
      q: 'Что означает принцип «говори, а не спрашивай»?',
      options: [
        'Клиент говорит объекту, что сделать, а решение по правилам принимает сам объект',
        'Методы не должны возвращать значения',
        'Объект сообщает о своём состоянии в журнал',
        'Клиент должен проверять состояние объекта перед каждым вызовом',
      ],
      correct: 0,
      explain:
        'acc.withdraw(x) лучше, чем if (acc.balance() >= x) acc.set_balance(acc.balance() - x).',
    },
    {
      q: 'Какой вариант метода доступа к закрытому вектору items_ сохраняет инкапсуляцию и не копирует данные?',
      options: [
        'const std::vector<int> &items() const',
        'std::vector<int> &items()',
        'std::vector<int> *items()',
        'std::vector<int> &items() const',
      ],
      correct: 0,
      explain:
        'Константная ссылка позволяет читать без копирования, но не менять. Последний вариант даже не скомпилируется: const-метод не может вернуть неконстантную ссылку на поле.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Widget {
public:
    Widget() { ++count_; }
    static int count() { return count_; }

private:
    inline static int count_ = 0;
};

int main() {
    Widget a, b;
    {
        Widget c;
    }
    Widget d;
    std::println("{}", Widget::count());
    return 0;
}`,
      lang: 'cpp',
      answers: ['4'],
      placeholder: 'Вывод программы',
      explain:
        'Статический счётчик общий для всех объектов: конструктор вызван четыре раза. Уничтожение c счётчик не уменьшает.',
    },
    {
      q: 'Что верно о статической функции класса static int created()? Выберите все.',
      options: [
        'Её вызывают через имя класса: Order::created()',
        'У неё нет получателя, поэтому она не видит обычных полей объекта',
        'Она может обращаться к статическим полям класса',
        'Она вызывается автоматически при создании объекта',
      ],
      correct: [0, 1, 2],
      explain: 'Статическая функция принадлежит классу, а не объекту.',
    },
    {
      q: 'Чем опасна строка const auto &v = make_list().items();, если items() возвращает const & на поле?',
      options: [
        'Временный объект уничтожается в конце строки, и ссылка висит',
        'Ничем: константная ссылка продлевает жизнь всему объекту',
        'Компилятор запретит такую запись',
        'v получит копию вектора',
      ],
      correct: 0,
      explain:
        'Продление жизни работает только для ссылки на сам временный объект, а не на его поле, возвращённое методом.',
    },
    {
      q: 'Какое объявление задаёт константу класса, известную при компиляции?',
      answers: ['static constexpr int max_items = 50;', 'static constexpr int max_items = 50'],
      placeholder: 'Объявление с max_items = 50',
      explain: 'static — одна на класс, constexpr — значение известно при компиляции.',
    },
    {
      q: 'Почему не стоит добавлять в интерфейс методы «на будущее»?',
      options: [
        'Каждый открытый метод придётся поддерживать, пока у него есть клиенты; убрать его потом трудно',
        'Классы с большим числом методов не компилируются',
        'Методы без вызовов замедляют программу',
        'Компилятор удалит неиспользуемые методы',
      ],
      correct: 0,
      explain: 'Интерфейс — обещание. Минимальный интерфейс проще сохранить неизменным.',
    },
  ],
  exercises: [
    {
      id: 'oop-public-exercise',
      title: 'Склад',
      difficulty: 'beginner',
      description: `
Опишите класс \`Inventory\` с закрытым словарём «товар → количество» и операциями:

- \`void add(const std::string &item, int quantity)\`;
- \`bool remove(const std::string &item, int quantity)\` — отказ, если товара не хватает; товар с нулевым остатком исчезает со склада;
- \`int count(const std::string &item) const\`;
- \`std::size_t positions() const\` — сколько разных товаров на складе.

Команды ввода: \`add товар n\`, \`remove товар n\` (напечатайте \`ок\` или \`недостаточно товар\`), \`count товар\` (напечатайте \`товар: n\`). В конце напечатайте \`позиций: K\`.`,
      constraints: ['Команд не больше 50; n от 1 до 10⁶.'],
      hints: [
        'Внутри — std::map<std::string, int>. count для отсутствующего товара: используйте find, а не operator[] — он создал бы запись.',
        'remove: если count(item) < quantity — false; иначе вычесть и при нуле стереть запись (erase).',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>

class Inventory {
public:
    void add(const std::string &item, int quantity) {
        stock_[item] += quantity;
    }

    bool remove(const std::string &item, int quantity) {
        if (count(item) < quantity) {
            return false;
        }
        auto it = stock_.find(item);
        it->second -= quantity;
        if (it->second == 0) {
            stock_.erase(it);
        }
        return true;
    }

    int count(const std::string &item) const {
        auto it = stock_.find(item);
        return it == stock_.end() ? 0 : it->second;
    }

    std::size_t positions() const {
        return stock_.size();
    }

private:
    std::map<std::string, int> stock_;
};

int main() {
    Inventory inventory;
    std::string command, item;
    while (std::cin >> command >> item) {
        if (command == "add") {
            int n;
            std::cin >> n;
            inventory.add(item, n);
        } else if (command == "remove") {
            int n;
            std::cin >> n;
            if (inventory.remove(item, n)) {
                std::println("ок");
            } else {
                std::println("недостаточно {}", item);
            }
        } else {
            std::println("{}: {}", item, inventory.count(item));
        }
    }
    std::println("позиций: {}", inventory.positions());
    return 0;
}`,
      explanation: `
Клиент (\`main\`) не знает, что внутри словарь: он видит только операции склада. Правила — «нельзя отпустить больше, чем есть» и «пустая позиция исчезает» — записаны в \`remove\`, и обойти их нельзя.

\`count\` ищет товар через \`find\`, а не \`operator[]\`: тот вставил бы в словарь пустую запись, и простой вопрос «сколько?» менял бы склад — а \`const\`-метод этого и не позволил бы.`,
      examples: [
        {
          in: 'add чай 5\nremove чай 3\nremove чай 3\ncount чай\n',
          out: 'ок\nнедостаточно чай\nчай: 2\nпозиций: 1\n',
        },
        { in: 'count кофе\n', out: 'кофе: 0\nпозиций: 0\n' },
      ],
      hidden: [
        { in: 'add a 1\nremove a 1\ncount a\n', name: 'До нуля' },
        { in: 'remove x 1\n', name: 'Нет товара' },
        { in: 'add a 2\nadd b 3\nadd a 4\ncount a\ncount b\n', name: 'Накопление' },
        { in: 'add a 1000000\nremove a 999999\ncount a\n', name: 'Большие числа' },
        { in: 'add x 1\nadd y 1\nadd z 1\nremove y 1\n', name: 'Позиции' },
        { in: '', name: 'Без команд' },
        {
          in: 'add сахар 10\nremove сахар 11\nremove сахар 10\nremove сахар 1\n',
          name: 'Ровно всё',
        },
        { in: 'count a\ncount b\n', name: 'Пустой склад' },
      ],
    },
    {
      title: 'Отсортированный список',
      description: `
Опишите класс \`SortedList\`, который хранит целые числа по возрастанию. Интерфейс: \`void insert(int)\`, \`bool contains(int) const\`, \`std::size_t size() const\`, \`int min() const\`, \`int max() const\`, \`int median() const\` (элемент с индексом \`(size − 1) / 2\`).

Команды ввода: \`add x\`, \`has x\` (\`да\`/\`нет\`), \`min\`, \`max\`, \`median\`. Для запросов к пустому списку печатайте \`пусто\`.`,
      constraints: ['Команд не больше 100; числа по модулю до 10⁹.'],
      hints: [
        'Позиция вставки — std::ranges::upper_bound(items_, x): первый элемент больше x. Вставка — items_.insert(pos, x).',
        'Поиск в упорядоченном векторе — std::ranges::binary_search(items_, x). min — front(), max — back(), медиана — items_[(size() - 1) / 2].',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <vector>

class SortedList {
public:
    void insert(int value) {
        items_.insert(std::ranges::upper_bound(items_, value), value);
    }

    bool contains(int value) const {
        return std::ranges::binary_search(items_, value);
    }

    std::size_t size() const {
        return items_.size();
    }

    int min() const {
        return items_.front();
    }

    int max() const {
        return items_.back();
    }

    int median() const {
        return items_[(items_.size() - 1) / 2];
    }

private:
    std::vector<int> items_;
};

int main() {
    SortedList list;
    std::string command;
    while (std::cin >> command) {
        if (command == "add" || command == "has") {
            int x;
            std::cin >> x;
            if (command == "add") {
                list.insert(x);
            } else {
                std::println("{}", list.contains(x) ? "да" : "нет");
            }
        } else if (list.size() == 0) {
            std::println("пусто");
        } else if (command == "min") {
            std::println("{}", list.min());
        } else if (command == "max") {
            std::println("{}", list.max());
        } else {
            std::println("{}", list.median());
        }
    }
    return 0;
}`,
      explanation: `
Инвариант «по возрастанию» устанавливается при каждой вставке, и благодаря ему остальные операции просты и быстры: минимум и максимум — края вектора, медиана — средний индекс, поиск — двоичный за O(log n). Интерфейс не даёт способа вставить число «не на место»: в нём нет ни \`push_back\`, ни неконстантного доступа к вектору.

Методы \`min\`, \`max\`, \`median\` требуют непустого списка — это их **предусловие**. Проверку выполняет клиент через \`size()\`; в уроке об инкапсуляции вы увидите, как сделать такие требования явными.`,
      examples: [
        { in: 'add 5\nadd 1\nadd 4\nmin\nmax\nmedian\nhas 4\n', out: '1\n5\n4\nда\n' },
        { in: 'median\nhas 1\n', out: 'пусто\nнет\n' },
      ],
      hidden: [
        { in: 'add 3\nmedian\n', name: 'Один элемент' },
        { in: 'add 2\nadd 1\nmedian\n', name: 'Два элемента' },
        { in: 'add 7\nadd 7\nadd 7\nhas 7\nmin\n', name: 'Повторы' },
        { in: 'add -1000000000\nadd 1000000000\nmax\nmin\n', name: 'Границы' },
        { in: 'add 10\nadd 20\nadd 30\nadd 40\nmedian\n', name: 'Чётное число' },
        { in: 'max\nmin\n', name: 'Пустой' },
        { in: 'add 5\nadd 3\nadd 9\nadd 1\nadd 7\nhas 6\nmedian\n', name: 'Пять' },
        { in: 'add 0\nhas 0\nhas -0\n', name: 'Ноль' },
      ],
    },
    {
      title: 'Найди ошибку: открытые внутренности',
      bug: true,
      description: `
Класс \`SortedList\` обещает хранить числа по возрастанию, поэтому \`min()\` и \`max()\` берут края вектора. Программа читает числа до конца ввода и печатает \`min A, max B, всего N\` (или \`пусто\`).

Минимум и максимум получаются неверными. Найдите ошибку и исправьте интерфейс класса так, чтобы нарушить порядок снаружи было невозможно.`,
      constraints: ['Чисел не больше 1000, каждое по модулю до 10⁹.'],
      hints: [
        'Через какой метод main добавляет числа и проходят ли они через insert?',
        'items() возвращает неконстантную ссылку на закрытый вектор — через неё можно сделать что угодно. Верните const std::vector<int> &, сделайте метод const, а в main добавляйте числа через insert.',
      ],
      starter: OPEN_INSIDE(false),
      solution: OPEN_INSIDE(true),
      explanation: `
\`items()\` отдавал неконстантную ссылку на закрытый вектор, и \`main\` добавлял числа прямо в конец через \`push_back\`, в обход \`insert\`. Порядок нарушался, а \`min\`/\`max\`, рассчитывающие на инвариант, возвращали первый и последний введённые числа.

Ключевое исправление — в интерфейсе: \`const std::vector<int> &items() const\`. После него строка \`list.items().push_back(x)\` перестаёт компилироваться, и единственный способ добавить число — \`insert\`. Ошибка клиента превращается в ошибку компиляции — так и должен работать хороший интерфейс.`,
      examples: [
        { in: '5 1 4\n', out: 'min 1, max 5, всего 3\n' },
        { in: '', out: 'пусто\n' },
      ],
      hidden: [
        '3 2 1\n',
        '1 2 3\n',
        '7\n',
        '-5 10 -20 15\n',
        '1000000000 -1000000000\n',
        '4 4 1 4\n',
        '9 8 7 6 5 4 3 2 1 0\n',
        '2 9 2 9\n',
      ],
    },
    {
      title: 'Талоны',
      difficulty: 'advanced',
      description: `
Электронная очередь выдаёт талоны для разных услуг, обозначенных одной заглавной латинской буквой. Номера у каждой услуги свои и идут с 1: \`A-001\`, \`A-002\`, \`B-001\`…

Опишите класс \`Ticket\` с конструктором \`explicit Ticket(char service)\`, методом \`std::string code() const\` и **статическими** членами: закрытым словарём счётчиков по услугам и функцией \`static void print_stats()\`, которая печатает для каждой услуги в алфавитном порядке \`A: n\` (или \`пусто\`, если талонов не было).

Команды: \`take X\` — выдать талон и напечатать его код; \`stats\` — статистика.`,
      constraints: ['Команд не больше 100; номера не превышают 999.'],
      hints: [
        'inline static std::map<char, int> issued_; — один словарь на весь класс. В конструкторе: number_ = ++issued_[service].',
        'Код — std::format("{}-{:03}", service_, number_). std::map перебирается по возрастанию ключей — алфавитный порядок получится сам.',
      ],
      solution: String.raw`
#include <format>
#include <iostream>
#include <map>
#include <print>
#include <string>

class Ticket {
public:
    explicit Ticket(char service) : service_(service), number_(++issued_[service]) {}

    std::string code() const {
        return std::format("{}-{:03}", service_, number_);
    }

    static void print_stats() {
        if (issued_.empty()) {
            std::println("пусто");
            return;
        }
        for (const auto &[service, count] : issued_) {
            std::println("{}: {}", service, count);
        }
    }

private:
    inline static std::map<char, int> issued_;
    char service_;
    int number_;
};

int main() {
    std::string command;
    while (std::cin >> command) {
        if (command == "take") {
            char service;
            std::cin >> service;
            Ticket ticket(service);
            std::println("{}", ticket.code());
        } else {
            Ticket::print_stats();
        }
    }
    return 0;
}`,
      explanation: `
Счётчики — свойство очереди в целом, а не отдельного талона, поэтому словарь объявлен \`static\`: один на весь класс, общий для всех объектов. Номер выдаётся в конструкторе — талон не может существовать без номера, и два талона одной услуги не получат одинаковых номеров.

\`print_stats\` — статическая функция: ей не нужен конкретный талон, и её вызывают через имя класса. Порядок полей важен: \`service_\` объявлено раньше \`number_\`, и список инициализации следует ему.`,
      examples: [
        { in: 'take A\ntake B\ntake A\nstats\n', out: 'A-001\nB-001\nA-002\nA: 2\nB: 1\n' },
        { in: 'stats\n', out: 'пусто\n' },
      ],
      hidden: [
        { in: 'take Z\ntake A\nstats\n', name: 'Алфавитный порядок' },
        {
          in: 'take C\ntake C\ntake C\ntake C\ntake C\ntake C\ntake C\ntake C\ntake C\ntake C\n',
          name: 'Десять',
        },
        { in: 'stats\ntake A\nstats\n', name: 'До и после' },
        { in: 'take X\n', name: 'Один талон' },
        { in: 'take A\ntake B\ntake C\ntake A\ntake B\ntake A\nstats\n', name: 'Три услуги' },
        { in: '', name: 'Без команд' },
        { in: 'take Q\nstats\ntake Q\nstats\n', name: 'Повторная статистика' },
        { in: 'take M\ntake N\ntake M\ntake N\ntake M\n', name: 'Чередование' },
      ],
    },
  ],
};
