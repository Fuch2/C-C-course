const ORDER = (fixed) => String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <vector>

struct Request {
    std::string item;
    int quantity;
};

class Warehouse {
public:
    void add(const std::string &item, int quantity) {
        stock_[item] += quantity;
    }

    // Выдаёт весь заказ или не выдаёт ничего.
    bool take_all(const std::vector<Request> &order) {
${
  fixed
    ? `        for (const Request &r : order) {
            if (count(r.item) < r.quantity) {
                return false;
            }
        }
        for (const Request &r : order) {
            stock_[r.item] -= r.quantity;
        }
        return true;`
    : `        for (const Request &r : order) {
            if (count(r.item) < r.quantity) {
                return false;
            }
            stock_[r.item] -= r.quantity;
        }
        return true;`
}
    }

    int count(const std::string &item) const {
        auto it = stock_.find(item);
        return it == stock_.end() ? 0 : it->second;
    }

private:
    std::map<std::string, int> stock_;
};

int main() {
    Warehouse w;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string item;
            int n;
            std::cin >> item >> n;
            w.add(item, n);
        } else if (command == "order") {
            int k;
            std::cin >> k;
            std::vector<Request> order(static_cast<std::size_t>(k));
            for (Request &r : order) {
                std::cin >> r.item >> r.quantity;
            }
            std::println("{}", w.take_all(order) ? "выдано" : "отказ");
        } else {
            std::string item;
            std::cin >> item;
            std::println("{}: {}", item, w.count(item));
        }
    }
    return 0;
}`;

export default {
  id: 'oop-encapsulation',
  title: 'Инкапсуляция: договор класса',
  description:
    'Договор операции: предусловие, постусловие и инвариант класса; кто и как проверяет предусловие — отказ результатом для ожидаемых ситуаций, assert для ошибок в программе; строгая гарантия «всё или ничего» и двухфазные операции; проверка инварианта закрытым методом; контракты pre и post в C++26.',
  moduleId: 'cpp-oop',
  order: 8,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-this'],
  objectives: [
    'Формулировать предусловия, постусловия и инвариант класса',
    'Выбирать реакцию на нарушение предусловия',
    'Писать операции со строгой гарантией',
    'Проверять инвариант закрытым методом',
  ],
  tags: ['C++23', 'ООП', 'Инкапсуляция', 'Инвариант', 'Контракты'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <optional>
#include <print>
#include <vector>

class Queue {
public:
    void push(int x) { items_.push_back(x); }
    std::optional<int> pop() {
        if (head_ == items_.size()) return std::nullopt;
        return items_[head_++];
    }

private:
    std::vector<int> items_;
    std::size_t head_ = 0;
};

int main() {
    Queue q;
    q.push(7);
    q.push(8);
    int a = q.pop().value_or(0);
    int b = q.pop().value_or(0);
    int c = q.pop().value_or(0);
    std::println("{} {} {}", a, b, c);
    return 0;
}`,
      lang: 'cpp',
      answers: ['7 8 0'],
      placeholder: 'Вывод программы',
      explain:
        'Очередь отдаёт элементы в порядке добавления; третий pop возвращает пустой optional.',
    },
    {
      q: 'Что такое предусловие операции?',
      options: [
        'Условие, которое должно быть верно до вызова, — например, «стек не пуст» для pop',
        'Условие, которое метод гарантирует после вызова',
        'Правило, верное для объекта всегда',
        'Проверка в конструкторе',
      ],
      correct: 0,
      explain:
        'Постусловие — гарантия после вызова, инвариант — правило до и после любого открытого метода.',
    },
    {
      q: 'Почему порядок вывода у std::println("{} {}", s.pop(), s.pop()) может оказаться неожиданным?',
      options: [
        'Порядок вычисления аргументов функции в C++ не определён',
        'println вызывает pop дважды для каждого аргумента',
        'Аргументы всегда вычисляются справа налево',
        'Такой вызов не скомпилируется',
      ],
      correct: 0,
      explain: 'Вызовы с побочными эффектами выносят в отдельные инструкции.',
    },
    {
      q: 'Как правильно реагировать на ввод пользователя, нарушающий предусловие (например, отрицательный возраст)?',
      options: [
        'Проверить явно и сообщить об ошибке результатом или исключением',
        'assert(age >= 0)',
        'Ничего: такое значение невозможно',
        'Привести к нулю молча',
      ],
      correct: 0,
      explain:
        'assert исчезает в выпускной сборке и предназначен для ошибок в программе, а не в данных.',
    },
    {
      q: 'Что означает строгая гарантия операции?',
      options: [
        'Операция либо выполняется целиком, либо не меняет объект вовсе',
        'Операция никогда не бросает исключений',
        'Операция выполняется за постоянное время',
        'Операция может изменить объект частично, но сообщит об этом',
      ],
      correct: 0,
      explain: 'Как транзакция: сначала все проверки, потом все изменения.',
    },
    {
      q: 'Склад: болтов 10, гаек 3. Метод проверяет и списывает в одном цикле. Заказ: 4 болта и 5 гаек. Сколько болтов останется после отказа?',
      answers: ['6'],
      placeholder: 'Число',
      explain:
        'Болты списаны до того, как обнаружилась нехватка гаек. Строгая гарантия оставила бы 10.',
    },
    {
      q: 'Зачем вызывать assert(invariant()) в конце каждой изменяющей операции?',
      options: [
        'Чтобы ошибка проявилась в том методе, который её внёс, а не позже',
        'Чтобы исправить нарушенный инвариант',
        'Это обязательно для компиляции',
        'Чтобы проверки работали в выпускной сборке',
      ],
      correct: 0,
      explain:
        'С -DNDEBUG проверки исчезают и ничего не стоят; при разработке они указывают на виновника.',
    },
    {
      q: 'Что даёт синтаксис int top() const pre(!empty()); из C++26?',
      options: [
        'Записывает предусловие в объявлении функции — его видят читатель, инструменты и компилятор',
        'Делает функцию constexpr',
        'Запрещает вызывать функцию у константы',
        'Ничего: это комментарий',
      ],
      correct: 0,
      explain:
        'Контракты C++26 — договор операции в синтаксисе языка. В GCC 14 и Clang 19 их ещё нет.',
    },
    {
      q: 'Какие ситуации разумно сообщать результатом (bool, optional, expected), а не assert? Выберите все.',
      options: [
        'Нет места в ограниченном буфере',
        'Пользователь ввёл несуществующий номер',
        'Файл не найден',
        'Метод класса забыл обновить счётчик',
      ],
      correct: [0, 1, 2],
      explain: 'Ожидаемые ситуации обрабатывает клиент. Ошибка в самом классе — дело assert.',
    },
  ],
  exercises: [
    {
      id: 'oop-encapsulation-exercise',
      title: 'Ограниченный стек',
      difficulty: 'beginner',
      description: `
Первое число — ёмкость стека. Опишите класс \`BoundedStack\` с методами \`bool push(int)\` (отказ, если стек полон), \`std::optional<int> pop()\` (пусто, если стек пуст), \`int top() const\` (предусловие: стек не пуст — проверяйте \`assert\`) и \`std::size_t size() const\`.

Команды: \`push x\` (\`ок\` или \`полон\`), \`pop\` (значение или \`пусто\`), \`top\` (значение или \`пусто\` — проверяйте размер в \`main\` перед вызовом), \`size\`.`,
      constraints: ['Ёмкость от 1 до 100; команд не больше 100; значения по модулю до 10⁹.'],
      hints: [
        'Внутри — std::vector<int> и поле ёмкости. push: if (items_.size() == capacity_) return false;.',
        'top — предусловие: assert(!items_.empty()). В main перед вызовом top проверьте size() — это обязанность клиента.',
      ],
      solution: String.raw`
#include <cassert>
#include <iostream>
#include <optional>
#include <print>
#include <string>
#include <vector>

class BoundedStack {
public:
    explicit BoundedStack(std::size_t capacity) : capacity_(capacity) {}

    bool push(int value) {
        if (items_.size() == capacity_) {
            return false;
        }
        items_.push_back(value);
        return true;
    }

    std::optional<int> pop() {
        if (items_.empty()) {
            return std::nullopt;
        }
        int value = items_.back();
        items_.pop_back();
        return value;
    }

    int top() const {
        assert(!items_.empty());
        return items_.back();
    }

    std::size_t size() const {
        return items_.size();
    }

private:
    std::size_t capacity_;
    std::vector<int> items_;
};

int main() {
    std::size_t capacity;
    std::cin >> capacity;
    BoundedStack stack(capacity);
    std::string command;
    while (std::cin >> command) {
        if (command == "push") {
            int x;
            std::cin >> x;
            std::println("{}", stack.push(x) ? "ок" : "полон");
        } else if (command == "pop") {
            if (auto value = stack.pop()) {
                std::println("{}", *value);
            } else {
                std::println("пусто");
            }
        } else if (command == "top") {
            if (stack.size() == 0) {
                std::println("пусто");
            } else {
                std::println("{}", stack.top());
            }
        } else {
            std::println("{}", stack.size());
        }
    }
    return 0;
}`,
      explanation: `
У трёх операций три разных договора. Переполнение и снятие с пустого стека — обычные ситуации, и \`push\` и \`pop\` сообщают о них результатом. У \`top\` предусловие «стек не пуст» возложено на клиента: \`main\` проверяет \`size()\` до вызова, а \`assert\` внутри ловит ошибку программиста, если проверку забудут.

Инвариант «размер не больше ёмкости» поддерживается единственным местом, где стек растёт, — \`push\`.`,
      examples: [
        {
          in: '2\npush 1\npush 2\npush 3\ntop\npop\npop\npop\n',
          out: 'ок\nок\nполон\n2\n2\n1\nпусто\n',
        },
        { in: '1\ntop\nsize\n', out: 'пусто\n0\n' },
      ],
      hidden: [
        { in: '1\npush 5\npush 6\nsize\n', name: 'Ёмкость 1' },
        { in: '3\npush -1\npush -2\ntop\nsize\n', name: 'Отрицательные' },
        { in: '100\npush 1000000000\ntop\n', name: 'Большое значение' },
        { in: '2\npop\npush 1\npop\npop\n', name: 'Пустой стек' },
        { in: '2\npush 1\npop\npush 2\npush 3\npush 4\nsize\n', name: 'Освобождение места' },
        { in: '5\nsize\n', name: 'Только размер' },
        { in: '3\npush 1\npush 2\npush 3\ntop\npop\ntop\n', name: 'Вершина меняется' },
        { in: '2\npush 7\npush 7\npush 7\npop\npop\npop\n', name: 'Повторы' },
      ],
    },
    {
      title: 'Бронирование',
      description: `
Переговорная комната бронируется на интервалы \`[начало, конец)\` в минутах от начала дня. Опишите класс \`Booking\`, который хранит интервалы без пересечений, упорядоченными по началу. Интерфейс:

- \`std::string add(int start, int end)\` — \`ок\`, \`ошибка\` (если \`start >= end\`) или \`занято\` (если пересекается с существующей бронью; касание концами — не пересечение);
- \`bool cancel(int start)\` — снять бронь, которая начинается в \`start\`;
- \`void print() const\` — брони через пробел в виде \`начало-конец\` или \`пусто\`.

Команды: \`add s e\`, \`cancel s\` (\`отменено\` или \`нет брони\`), \`list\`.`,
      constraints: ['Числа от 0 до 1440; команд не больше 100.'],
      hints: [
        'Интервалы [a, b) и [c, d) пересекаются, если a < d && c < b.',
        'Храните std::vector<std::pair<int, int>>. Вставка на место: std::ranges::lower_bound по паре {start, end} — или просто push_back и std::ranges::sort.',
      ],
      solution: String.raw`
#include <algorithm>
#include <format>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Booking {
public:
    std::string add(int start, int end) {
        if (start >= end) {
            return "ошибка";
        }
        for (const auto &[s, e] : slots_) {
            if (start < e && s < end) {
                return "занято";
            }
        }
        slots_.insert(std::ranges::lower_bound(slots_, std::pair{start, end}), {start, end});
        return "ок";
    }

    bool cancel(int start) {
        auto it = std::ranges::find(slots_, start, &std::pair<int, int>::first);
        if (it == slots_.end()) {
            return false;
        }
        slots_.erase(it);
        return true;
    }

    void print() const {
        if (slots_.empty()) {
            std::println("пусто");
            return;
        }
        std::string line;
        for (const auto &[s, e] : slots_) {
            line += std::format("{}{}-{}", line.empty() ? "" : " ", s, e);
        }
        std::println("{}", line);
    }

private:
    std::vector<std::pair<int, int>> slots_;
};

int main() {
    Booking room;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            int s, e;
            std::cin >> s >> e;
            std::println("{}", room.add(s, e));
        } else if (command == "cancel") {
            int s;
            std::cin >> s;
            std::println("{}", room.cancel(s) ? "отменено" : "нет брони");
        } else {
            room.print();
        }
    }
    return 0;
}`,
      explanation: `
Инвариант класса — «интервалы не пересекаются и упорядочены по началу». \`add\` сначала проверяет все условия и только потом вставляет — неудачная попытка ничего не меняет. Вставка через \`lower_bound\` ставит интервал на его место, поэтому \`print\` не сортирует ничего.

Для полуоткрытых интервалов условие пересечения симметрично и короткое: \`a < d && c < b\`. Брони \`[60, 120)\` и \`[120, 180)\` лишь касаются и не пересекаются — так удобно бронировать встречи «встык».`,
      examples: [
        {
          in: 'add 60 120\nadd 120 180\nadd 90 150\nlist\n',
          out: 'ок\nок\nзанято\n60-120 120-180\n',
        },
        { in: 'add 10 10\ncancel 5\nlist\n', out: 'ошибка\nнет брони\nпусто\n' },
      ],
      hidden: [
        { in: 'add 300 400\nadd 100 200\nlist\n', name: 'Порядок' },
        { in: 'add 0 1440\nadd 500 501\n', name: 'Весь день' },
        { in: 'add 100 200\ncancel 100\nadd 150 160\nlist\n', name: 'Отмена освобождает' },
        { in: 'add 100 200\nadd 50 100\nadd 200 250\nlist\n', name: 'Касание' },
        { in: 'add 100 200\nadd 99 101\nadd 199 300\n', name: 'Перекрытие краёв' },
        { in: 'add 100 200\nadd 120 130\n', name: 'Вложенный' },
        { in: 'add 200 100\nlist\n', name: 'Обратный' },
        { in: 'add 1 2\nadd 3 4\nadd 5 6\ncancel 3\nlist\ncancel 3\n', name: 'Несколько броней' },
      ],
    },
    {
      title: 'Найди ошибку: заказ наполовину',
      bug: true,
      description: `
Склад выдаёт заказ **целиком или никак**: если хотя бы одного товара не хватает, ничего не списывается. Команды:

- \`add товар n\` — приход;
- \`order k товар₁ n₁ … товарₖ nₖ\` — заказ (\`выдано\` или \`отказ\`);
- \`count товар\` — остаток.

После отклонённых заказов остатки оказываются неверными. Найдите и исправьте ошибку в \`take_all\`.`,
      constraints: ['Команд не больше 50; количества от 1 до 10⁶.'],
      hints: [
        'Что происходит с товарами, которые идут в заказе раньше того, которого не хватило?',
        'Проверка и списание в одном цикле нарушают строгую гарантию. Разделите их: первый цикл только проверяет, второй только списывает.',
      ],
      starter: ORDER(false),
      solution: ORDER(true),
      explanation: `
Цикл проверял и списывал товары по очереди. Когда очередь доходила до недостающего товара, метод возвращал отказ — но товары, стоявшие в заказе раньше, уже были списаны. Клиент слышал «отказ» и считал, что склад не изменился, а остатки уменьшились.

Двухфазная операция даёт строгую гарантию: фаза проверки ничего не меняет и может отказать, фаза применения не может отказать, потому что всё уже проверено. Этот приём — основа транзакций в базах данных и надёжных операций над несколькими объектами.`,
      examples: [
        {
          in: 'add болт 10\nadd гайка 3\norder 2 болт 4 гайка 5\ncount болт\n',
          out: 'отказ\nболт: 10\n',
        },
        { in: 'add a 5\norder 1 a 5\ncount a\n', out: 'выдано\na: 0\n' },
      ],
      hidden: [
        'add a 1\nadd b 1\norder 2 a 1 c 1\ncount a\n',
        'add x 10\nadd y 10\norder 3 x 5 y 5 x 6\ncount x\ncount y\n',
        'add a 3\norder 2 a 2 b 1\norder 1 a 3\ncount a\n',
        'add p 100\nadd q 1\norder 2 p 50 q 2\norder 2 p 50 q 1\ncount p\ncount q\n',
        'add a 1\norder 1 a 2\ncount a\n',
        'add m 7\nadd n 7\norder 2 m 7 n 8\ncount m\n',
        'add k 1000000\norder 2 k 500000 z 1\ncount k\n',
        'add a 2\nadd b 2\nadd c 2\norder 3 a 1 b 1 c 3\ncount a\ncount b\n',
      ],
    },
    {
      title: 'Касса',
      difficulty: 'advanced',
      description: `
Первое число — наличные в кассе на начало смены. Опишите класс \`CashRegister\` с инвариантом **«наличные = начальная сумма + продажи − возвраты»** и операциями, которые возвращают \`std::expected<void, std::string>\`:

- \`sell(amount)\` — продажа;
- \`refund(amount)\` — возврат.

Ошибки (проверяйте по порядку): \`сумма должна быть положительной\`; для возврата — \`возврат больше продаж\` (возвраты за смену не могут превысить продажи) и \`в кассе недостаточно денег\`.

Проверяйте инвариант закрытым методом через \`assert\` в конце каждой операции. Команды: \`sell n\`, \`refund n\` (\`ок\` или \`ошибка: текст\`), \`report\` — \`в кассе C, продаж S, возвратов R\`.`,
      constraints: ['Суммы по модулю до 10⁹; команд не больше 50.'],
      hints: [
        'Поля: initial_, cash_, sold_, refunded_. Инвариант: cash_ == initial_ + sold_ - refunded_.',
        'В каждой операции сначала все проверки с return std::unexpected("…"), затем изменения, затем assert(invariant()) и return {};.',
      ],
      solution: String.raw`
#include <cassert>
#include <expected>
#include <iostream>
#include <print>
#include <string>

class CashRegister {
public:
    explicit CashRegister(long long initial) : initial_(initial), cash_(initial) {}

    std::expected<void, std::string> sell(long long amount) {
        if (amount <= 0) {
            return std::unexpected("сумма должна быть положительной");
        }
        cash_ += amount;
        sold_ += amount;
        assert(invariant());
        return {};
    }

    std::expected<void, std::string> refund(long long amount) {
        if (amount <= 0) {
            return std::unexpected("сумма должна быть положительной");
        }
        if (refunded_ + amount > sold_) {
            return std::unexpected("возврат больше продаж");
        }
        if (amount > cash_) {
            return std::unexpected("в кассе недостаточно денег");
        }
        cash_ -= amount;
        refunded_ += amount;
        assert(invariant());
        return {};
    }

    void report() const {
        std::println("в кассе {}, продаж {}, возвратов {}", cash_, sold_, refunded_);
    }

private:
    bool invariant() const {
        return cash_ == initial_ + sold_ - refunded_;
    }

    long long initial_;
    long long cash_;
    long long sold_ = 0;
    long long refunded_ = 0;
};

int main() {
    long long initial;
    std::cin >> initial;
    CashRegister register_(initial);
    std::string command;
    while (std::cin >> command) {
        if (command == "report") {
            register_.report();
            continue;
        }
        long long amount;
        std::cin >> amount;
        auto result = command == "sell" ? register_.sell(amount) : register_.refund(amount);
        if (result) {
            std::println("ок");
        } else {
            std::println("ошибка: {}", result.error());
        }
    }
    return 0;
}`,
      explanation: `
Инвариант кассы связывает четыре поля, и его невозможно нарушить снаружи: поля закрыты, а обе операции проверяют всё до изменений. \`assert(invariant())\` в конце операций — страховка от ошибок в самом классе: если когда-нибудь новый метод забудет обновить \`sold_\`, программа остановится в этом методе, а не напечатает неверный отчёт через неделю.

Ошибки возврата — ожидаемые ситуации, а не ошибки программы, поэтому они возвращаются как \`std::expected\` с причиной. Порядок проверок задаёт, какую причину увидит пользователь, если нарушены сразу несколько условий.`,
      examples: [
        {
          in: '100\nsell 50\nrefund 70\nrefund 30\nreport\n',
          out: 'ок\nошибка: возврат больше продаж\nок\nв кассе 120, продаж 50, возвратов 30\n',
        },
        {
          in: '0\nsell 0\nreport\n',
          out: 'ошибка: сумма должна быть положительной\nв кассе 0, продаж 0, возвратов 0\n',
        },
      ],
      hidden: [
        { in: '0\nsell 100\nrefund 100\nrefund 1\nreport\n', name: 'Ровно продажи' },
        { in: '-50\nsell 30\nrefund 30\n', name: 'Отрицательная начальная сумма' },
        { in: '10\nrefund 5\n', name: 'Возврат без продаж' },
        { in: '1000000000\nsell 1000000000\nsell 1000000000\nreport\n', name: 'Большие суммы' },
        { in: '0\nsell 10\nrefund -1\nrefund 0\nreport\n', name: 'Неположительные возвраты' },
        { in: '5\nsell 1\nsell 2\nsell 3\nrefund 6\nreport\n', name: 'Несколько продаж' },
        { in: '-100\nsell 20\nrefund 10\nreport\n', name: 'Мало наличных' },
        { in: '100\nreport\n', name: 'Только отчёт' },
      ],
    },
  ],
};
