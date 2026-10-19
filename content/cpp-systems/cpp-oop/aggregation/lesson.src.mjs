const LABEL = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

class Label {
public:
    explicit Label(const std::string &text) : text_(text) {}

    void print() const {
        std::println("[{}]", text_);
    }

private:
    ${fixed ? 'std::string text_;' : 'const std::string &text_;'}
};

Label make_label(const std::string &category, const std::string &name) {
    std::string text = category + ": " + name;
    return Label(text);
}

int main() {
    std::string category, name;
    while (std::cin >> category >> name) {
        Label label = make_label(category, name);
        label.print();
    }
    return 0;
}`;

export default {
  id: 'oop-aggregation',
  title: 'Агрегация: используем чужой объект',
  description:
    'Чем агрегация отличается от композиции: ссылка или указатель на объект, которым класс не владеет; общий журнал и внедрение зависимости через конструктор; выбор между полем-ссылкой и полем-указателем; главный риск — время жизни и висячие ссылки; правила, которые от них спасают.',
  moduleId: 'cpp-oop',
  order: 12,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-composition'],
  objectives: [
    'Различать композицию и агрегацию',
    'Хранить невладеющие связи ссылкой или указателем',
    'Передавать зависимости через конструктор',
    'Проверять, что используемый объект живёт дольше использующего',
  ],
  tags: ['C++23', 'ООП', 'Агрегация', 'Время жизни', 'Внедрение зависимостей'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Counter {
public:
    void hit() { n_++; }
    int n() const { return n_; }

private:
    int n_ = 0;
};

class Button {
public:
    explicit Button(Counter &c) : c_(c) {}
    void click() { c_.hit(); }

private:
    Counter &c_;
};

int main() {
    Counter total;
    Button a(total), b(total);
    a.click();
    b.click();
    a.click();
    std::println("{}", total.n());
    return 0;
}`,
      lang: 'cpp',
      answers: ['3'],
      placeholder: 'Вывод программы',
      explain: 'Обе кнопки хранят ссылку на один и тот же счётчик.',
    },
    {
      q: 'Что изменится, если в Button поле Counter &c_ заменить на Counter c_ (и параметр конструктора принимать по значению)?',
      options: [
        'У каждой кнопки будет свой счётчик-копия, и total останется 0',
        'Ничего',
        'Программа не скомпилируется',
        'total станет 6',
      ],
      correct: 0,
      explain: 'Поле-значение — композиция: копия принадлежит кнопке.',
    },
    {
      q: 'Чем агрегация отличается от композиции?',
      options: [
        'При агрегации объект пользуется чужим объектом и не уничтожает его; при композиции владеет частью',
        'Агрегация возможна только через наследование',
        'При агрегации объект копирует часть',
        'Это синонимы',
      ],
      correct: 0,
      explain: 'Композиция — поле-объект, агрегация — ссылка или указатель на чужой объект.',
    },
    {
      q: 'Когда поле-указатель лучше поля-ссылки?',
      options: [
        'Когда связь может отсутствовать (nullptr) или меняться со временем',
        'Всегда: указатели быстрее',
        'Когда объект нужно уничтожить в деструкторе',
        'Никогда',
      ],
      correct: 0,
      explain: 'Ссылку нельзя перенаправить и она не бывает пустой.',
    },
    {
      q: 'Почему объект с полем-ссылкой нельзя присвоить (a = b)?',
      options: [
        'Ссылку нельзя перенаправить на другой объект, поэтому присваивание по умолчанию удалено',
        'Ссылки нельзя копировать никогда',
        'Это ошибка во время выполнения',
        'Можно, ссылка начнёт указывать на поле b',
      ],
      correct: 0,
      explain: 'Если присваивание нужно — храните указатель.',
    },
    {
      q: 'Что такое внедрение зависимости?',
      options: [
        'Объект получает используемый объект снаружи, например в конструкторе, а не создаёт его и не берёт из глобальной переменной',
        'Наследование от класса зависимости',
        'Подключение заголовка',
        'Автоматическое создание всех полей',
      ],
      correct: 0,
      explain: 'Зависимость видна в сигнатуре, и её можно подменить — например, в тестах.',
    },
    {
      q: 'Какое обещание лежит в основе агрегации?',
      options: [
        'Используемый объект живёт дольше использующего',
        'Используемый объект нельзя изменить',
        'Использующий объект удалит используемый',
        'Объекты созданы в куче',
      ],
      correct: 0,
      explain: 'Компилятор это обещание не проверяет: нарушение даёт висячие ссылки.',
    },
    {
      q: 'Класс Reader хранит указатель на books[0], а затем в вектор books добавляют ещё книги. Что может случиться?',
      options: [
        'Вектор перевыделит память, и указатель будет указывать на освобождённый блок',
        'Указатель автоматически обновится',
        'push_back не скомпилируется',
        'Ничего: элементы вектора не перемещаются',
      ],
      correct: 0,
      explain: 'Сначала заполняют контейнер, потом раздают указатели — или хранят индексы.',
    },
  ],
  exercises: [
    {
      id: 'oop-aggregation-exercise',
      title: 'Журнал операций',
      difficulty: 'beginner',
      description: `
Опишите класс \`Logger\` (список строк, методы \`write\` и \`dump\`) и класс \`Account\`, который получает в конструкторе имя владельца и **ссылку** на общий журнал. Методы счёта:

- \`deposit(n)\` — пишет в журнал \`имя: +n\`;
- \`withdraw(n)\` — при достаточном остатке пишет \`имя: -n\`, иначе \`имя: отказ n\`.

Команды ввода: \`dep имя n\` и \`wd имя n\`. Счёт создаётся при первом упоминании имени. В конце напечатайте журнал с номерами строк: \`1. Ада: +100\`.`,
      constraints: ['Команд не больше 50; n от 1 до 10⁶.'],
      hints: [
        'Счета удобно хранить в std::map<std::string, Account>. Account не имеет конструктора по умолчанию, поэтому создавайте его через accounts.try_emplace(name, name, log) — она вернёт итератор на существующий или новый счёт.',
        'Поле Logger &log_ инициализируется в списке инициализации конструктора; журнал создайте в main раньше счетов.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Logger {
public:
    void write(const std::string &line) {
        lines_.push_back(line);
    }

    void dump() const {
        for (std::size_t i = 0; i < lines_.size(); i++) {
            std::println("{}. {}", i + 1, lines_[i]);
        }
    }

private:
    std::vector<std::string> lines_;
};

class Account {
public:
    Account(std::string owner, Logger &log) : owner_(std::move(owner)), log_(log) {}

    void deposit(long long n) {
        balance_ += n;
        log_.write(owner_ + ": +" + std::to_string(n));
    }

    void withdraw(long long n) {
        if (n > balance_) {
            log_.write(owner_ + ": отказ " + std::to_string(n));
            return;
        }
        balance_ -= n;
        log_.write(owner_ + ": -" + std::to_string(n));
    }

private:
    std::string owner_;
    Logger &log_;
    long long balance_ = 0;
};

int main() {
    Logger log;
    std::map<std::string, Account> accounts;
    std::string command, name;
    long long n;
    while (std::cin >> command >> name >> n) {
        Account &account = accounts.try_emplace(name, name, log).first->second;
        if (command == "dep") {
            account.deposit(n);
        } else {
            account.withdraw(n);
        }
    }
    log.dump();
    return 0;
}`,
      explanation: `
Журнал один на всю программу и живёт в \`main\` дольше всех счетов — поэтому счета хранят на него ссылку. Если бы каждый счёт хранил журнал полем, получилось бы по журналу на счёт, и общей истории операций не было бы.

\`try_emplace(name, name, log)\` создаёт счёт прямо в словаре, передавая аргументы конструктору \`Account\`, — и ничего не делает, если счёт с таким ключом уже есть. Он возвращает пару «итератор, был ли вставлен», и \`.first->second\` — ссылка на счёт.`,
      examples: [
        {
          in: 'dep Ада 100\ndep Алан 50\nwd Ада 30\nwd Алан 80\n',
          out: '1. Ада: +100\n2. Алан: +50\n3. Ада: -30\n4. Алан: отказ 80\n',
        },
        { in: '', out: '' },
      ],
      hidden: [
        { in: 'wd x 1\n', name: 'Снятие с пустого' },
        { in: 'dep a 5\nwd a 5\nwd a 1\n', name: 'До нуля' },
        { in: 'dep a 1000000\ndep a 1000000\nwd a 2000000\n', name: 'Большие суммы' },
        { in: 'dep a 1\ndep b 2\ndep c 3\n', name: 'Три счёта' },
        { in: 'dep Иван 10\nwd Пётр 10\n', name: 'Разные люди' },
        { in: 'dep a 3\nwd a 1\nwd a 1\nwd a 1\nwd a 1\n', name: 'Много снятий' },
        { in: 'dep x 7\n', name: 'Одна операция' },
        { in: 'wd a 5\ndep a 5\nwd a 5\n', name: 'Отказ, потом успех' },
      ],
    },
    {
      title: 'Табло',
      description: `
Первое число — количество термометров \`n\` (у всех начальная температура 20). Опишите класс \`Thermometer\` и класс \`Display\`, который хранит **указатель на константный термометр** — источник данных — и может быть ни к чему не подключён. Команды:

- \`set i t\` — термометр \`i\` (с нуля) показывает \`t\`;
- \`connect i\` — подключить табло к термометру \`i\`;
- \`disconnect\` — отключить;
- \`show\` — напечатать показание с одним знаком после точки и \`°C\` или \`нет датчика\`.`,
      constraints: [
        '1 ≤ n ≤ 10; номера корректны; команд не больше 50; температуры от −100 до 100.',
      ],
      hints: [
        'Термометры создайте сразу: std::vector<Thermometer> sensors(n); — и не меняйте размер вектора, пока раздаёте указатели.',
        'Display: const Thermometer *source_ = nullptr; connect принимает указатель (&sensors[i]), disconnect присваивает nullptr.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Thermometer {
public:
    void set(double t) {
        value_ = t;
    }

    double value() const {
        return value_;
    }

private:
    double value_ = 20;
};

class Display {
public:
    void connect(const Thermometer *source) {
        source_ = source;
    }

    void disconnect() {
        source_ = nullptr;
    }

    void show() const {
        if (source_ == nullptr) {
            std::println("нет датчика");
        } else {
            std::println("{:.1f} °C", source_->value());
        }
    }

private:
    const Thermometer *source_ = nullptr;
};

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<Thermometer> sensors(n);
    Display display;
    std::string command;
    while (std::cin >> command) {
        if (command == "set") {
            std::size_t i;
            double t;
            std::cin >> i >> t;
            sensors[i].set(t);
        } else if (command == "connect") {
            std::size_t i;
            std::cin >> i;
            display.connect(&sensors[i]);
        } else if (command == "disconnect") {
            display.disconnect();
        } else {
            display.show();
        }
    }
    return 0;
}`,
      explanation: `
Табло не владеет термометрами — оно лишь смотрит на один из них, может переключиться на другой или остаться без источника. Поэтому указатель, а не ссылка и не поле-значение. Указатель на константу закрепляет в типе, что табло только читает показания.

Указатели на элементы вектора безопасны здесь потому, что вектор создан сразу нужного размера и больше не растёт. Если бы термометры добавлялись по ходу работы, перевыделение памяти оставило бы табло с висячим указателем.`,
      examples: [
        {
          in: '2\nshow\nconnect 1\nshow\nset 1 -7.5\nshow\n',
          out: 'нет датчика\n20.0 °C\n-7.5 °C\n',
        },
        { in: '1\nconnect 0\ndisconnect\nshow\n', out: 'нет датчика\n' },
      ],
      hidden: [
        { in: '3\nset 2 30\nconnect 2\nshow\nconnect 0\nshow\n', name: 'Переключение' },
        { in: '1\nconnect 0\nset 0 100\nshow\nset 0 -100\nshow\n', name: 'Изменение источника' },
        { in: '2\nset 0 5\nshow\n', name: 'Без подключения' },
        { in: '2\nconnect 0\nset 1 9\nshow\n', name: 'Меняется другой' },
        { in: '1\nshow\n', name: 'Только показ' },
        { in: '3\nconnect 1\nset 1 0.05\nshow\n', name: 'Округление' },
        { in: '2\nconnect 0\ndisconnect\nconnect 1\nshow\n', name: 'Повторное подключение' },
        { in: '1\nset 0 36.6\nconnect 0\nshow\nshow\n', name: 'Дважды' },
      ],
    },
    {
      title: 'Найди ошибку: висячая надпись',
      bug: true,
      description: `
Каждая строка ввода — категория и название товара. Функция \`make_label\` собирает надпись \`категория: название\` и возвращает объект \`Label\`, который печатает её в квадратных скобках:

\`\`\`text
[электроника: наушники]
\`\`\`

Под AddressSanitizer программа аварийно завершается. Найдите и исправьте ошибку в классе \`Label\`.`,
      constraints: ['Строк не больше 20; слова до 40 символов.'],
      hints: [
        'На что ссылается поле text_ после выхода из make_label?',
        'Надпись — часть этикетки, а не чужой объект: храните её значением, std::string text_.',
      ],
      starter: LABEL(false),
      solution: LABEL(true),
      explanation: `
\`Label\` хранил ссылку на строку, а строка \`text\` — локальная переменная \`make_label\` и уничтожается при выходе из функции. Этикетка возвращалась с висячей ссылкой, и \`print\` читал освобождённую память — AddressSanitizer сообщает \`heap-use-after-free\` (длинные строки хранят символы в куче).

Агрегация была ошибкой проектирования: этикетка не пользуется чужой надписью, а владеет своей. Поле-значение — композиция — копирует строку при создании, и объект становится самостоятельным. Правило: ссылку храните, только если точно знаете, что объект переживёт ссылающегося.`,
      examples: [
        { in: 'электроника наушники\n', out: '[электроника: наушники]\n' },
        { in: 'книги роман\nигрушки мяч\n', out: '[книги: роман]\n[игрушки: мяч]\n' },
      ],
      hidden: [
        'продукты молоко\n',
        'одежда куртка\nобувь кроссовки\n',
        'канцелярия карандаш\n',
        'спорт велосипед\n',
        'сад лопата\nдом кресло\nкухня сковорода\n',
        'электроника телевизор\n',
        'музыка гитара\n',
        'зоотовары корм\n',
      ],
    },
    {
      title: 'Наблюдатели',
      difficulty: 'advanced',
      description: `
Датчик публикует значения, а **наблюдатели** считают, сколько опубликованных значений были не меньше их порога. Датчик хранит невладеющие указатели на подписанных наблюдателей и при каждом значении сообщает его всем подписанным.

Первая строка — число наблюдателей \`k\`, затем \`k\` строк \`имя порог\`. Все наблюдатели сразу подписаны. Команды:

- \`value v\` — датчик публикует значение;
- \`unsub имя\`, \`sub имя\` — отписать или снова подписать наблюдателя (повторная подписка не дублирует);
- \`report\` — для каждого наблюдателя в исходном порядке: \`имя: n\`.`,
      constraints: ['1 ≤ k ≤ 10; команд не больше 100; значения и пороги по модулю до 10⁶.'],
      hints: [
        'Наблюдателей храните в векторе, заполненном до подписки: std::vector<Watcher> watchers; — и не меняйте его размер. Датчик: std::vector<Watcher *> subscribers_.',
        'unsub — std::erase(subscribers_, ptr) (C++20); sub — добавить, если std::ranges::find не нашёл. Наблюдателя по имени ищите в main.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Watcher {
public:
    Watcher(std::string name, long long threshold) : name_(std::move(name)), threshold_(threshold) {}

    void on_value(long long v) {
        if (v >= threshold_) {
            count_++;
        }
    }

    const std::string &name() const {
        return name_;
    }

    int count() const {
        return count_;
    }

private:
    std::string name_;
    long long threshold_;
    int count_ = 0;
};

class Sensor {
public:
    void subscribe(Watcher *w) {
        if (std::ranges::find(subscribers_, w) == subscribers_.end()) {
            subscribers_.push_back(w);
        }
    }

    void unsubscribe(Watcher *w) {
        std::erase(subscribers_, w);
    }

    void publish(long long v) {
        for (Watcher *w : subscribers_) {
            w->on_value(v);
        }
    }

private:
    std::vector<Watcher *> subscribers_;
};

int main() {
    int k;
    std::cin >> k;
    std::vector<Watcher> watchers;
    for (int i = 0; i < k; i++) {
        std::string name;
        long long threshold;
        std::cin >> name >> threshold;
        watchers.emplace_back(name, threshold);
    }
    Sensor sensor;
    for (Watcher &w : watchers) {
        sensor.subscribe(&w);
    }
    auto find = [&watchers](const std::string &name) -> Watcher * {
        for (Watcher &w : watchers) {
            if (w.name() == name) {
                return &w;
            }
        }
        return nullptr;
    };
    std::string command;
    while (std::cin >> command) {
        if (command == "value") {
            long long v;
            std::cin >> v;
            sensor.publish(v);
        } else if (command == "report") {
            for (const Watcher &w : watchers) {
                std::println("{}: {}", w.name(), w.count());
            }
        } else {
            std::string name;
            std::cin >> name;
            if (Watcher *w = find(name)) {
                if (command == "sub") {
                    sensor.subscribe(w);
                } else {
                    sensor.unsubscribe(w);
                }
            }
        }
    }
    return 0;
}`,
      explanation: `
Это шаблон «Наблюдатель»: источник событий хранит список получателей и оповещает их, ничего о них не зная, кроме метода \`on_value\`. Датчик не владеет наблюдателями — они живут в \`main\` дольше датчика, — поэтому хранятся указатели. Отписка удаляет указатель из списка, а сам наблюдатель продолжает существовать и хранит свой счёт.

Указатели безопасны потому, что вектор наблюдателей заполнен **до** подписки и больше не растёт. В уроках о полиморфизме наблюдатели станут объектами разных классов с общим интерфейсом — тогда датчик сможет оповещать и табло, и сигнализацию, и журнал одним списком.`,
      examples: [
        {
          in: '2\nтепло 20\nжара 30\nvalue 25\nvalue 35\nunsub тепло\nvalue 40\nreport\n',
          out: 'тепло: 2\nжара: 2\n',
        },
        { in: '1\na 0\nsub a\nvalue 0\nreport\n', out: 'a: 1\n' },
      ],
      hidden: [
        { in: '1\na 10\nvalue 5\nreport\n', name: 'Ниже порога' },
        { in: '2\na 0\nb 0\nunsub a\nunsub b\nvalue 1\nreport\n', name: 'Все отписаны' },
        { in: '1\na 5\nunsub a\nvalue 9\nsub a\nvalue 9\nreport\n', name: 'Переподписка' },
        { in: '1\na -1000000\nvalue -1000000\nvalue 1000000\nreport\n', name: 'Границы' },
        { in: '3\nx 1\ny 2\nz 3\nvalue 2\nreport\nvalue 3\nreport\n', name: 'Два отчёта' },
        { in: '1\na 1\nunsub b\nvalue 1\nreport\n', name: 'Неизвестное имя' },
        { in: '2\na 5\nb 5\nsub a\nsub a\nvalue 5\nreport\n', name: 'Без дублей' },
        { in: '1\na 0\nreport\n', name: 'Без значений' },
      ],
    },
  ],
};
