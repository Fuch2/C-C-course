const SESSIONS = (fixed) => String.raw`
#include <functional>
#include <iostream>
#include <iterator>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

class Timer {
public:
    void set(std::function<void()> callback) {
        callback_ = std::move(callback);
    }
    void fire() const {
        if (callback_) {
            callback_();
        }
    }

private:
    std::function<void()> callback_;
};

class Session : public std::enable_shared_from_this<Session> {
public:
    explicit Session(std::string user) : user_(std::move(user)) {}
    ~Session() {
        std::println("сессия {} закрыта", user_);
    }

    void start() {
${
  fixed
    ? `        timer_.set([weak = weak_from_this()] {
            if (auto self = weak.lock()) {
                self->ping();
            }
        });`
    : `        timer_.set([self = shared_from_this()] { self->ping(); });`
}
    }

    void tick() const {
        timer_.fire();
    }

private:
    void ping() {
        ++pings_;
        std::println("пинг {} #{}", user_, pings_);
    }

    std::string user_;
    int pings_ = 0;
    Timer timer_;
};

int main() {
    std::map<std::string, std::shared_ptr<Session>> sessions;
    std::string command, user;
    while (std::cin >> command >> user) {
        if (command == "start") {
            auto s = std::make_shared<Session>(user);
            s->start();
            sessions[user] = std::move(s);
        } else if (command == "tick") {
            sessions.at(user)->tick();
        } else {
            sessions.erase(user);
        }
    }
    while (!sessions.empty()) {
        sessions.erase(std::prev(sessions.end()));
    }
    return 0;
}`;

export default {
  id: 'lifetime-cyclic-references',
  title: 'Циклические ссылки',
  description:
    'Цикл владения из shared_ptr никогда не освобождается: почему счётчики не доходят до нуля и как LeakSanitizer показывает утечку; разрыв цикла невладеющей связью — weak_ptr, сырой указатель, индекс; выбор направления владения в парах, деревьях, двусвязных списках и графах; цикл через хранимую лямбду и захват weak_from_this; почему подсчёт ссылок не видит циклы, а обход от корней видит.',
  moduleId: 'cpp-lifetime',
  order: 23,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-weak-ptr'],
  objectives: [
    'Распознавать циклы владения из shared_ptr',
    'Разрывать циклы невладеющими связями по смыслу предметной области',
    'Писать хранимые колбэки без циклов через weak_from_this',
    'Объяснять, почему подсчёт ссылок не освобождает циклы',
  ],
  tags: ['C++23', 'Время жизни', 'shared_ptr', 'weak_ptr', 'Утечки'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Почему два объекта, владеющие друг другом через shared_ptr, не освобождаются?',
      options: [
        'Каждый держит другого, и счётчики не опускаются ниже единицы',
        'shared_ptr не умеет удалять объекты',
        'Деструкторы вызываются, но память не освобождается',
        'Они освобождаются при следующем выделении памяти',
      ],
      correct: 0,
      explain: 'Подсчёт ссылок видит только числа, а не то, что владельцы сами недостижимы.',
    },
    {
      q: 'Как разорвать цикл «родитель ↔ ребёнок» в дереве?',
      options: [
        'Родитель владеет детьми, ребёнок хранит weak_ptr или сырой указатель на родителя',
        'Оба направления — weak_ptr',
        'Оба направления — shared_ptr, а в конце вызвать reset',
        'Ребёнок владеет родителем',
      ],
      correct: 0,
      explain: 'Направление владения — сверху вниз.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>

struct Node {
    std::shared_ptr<Node> next;
    ~Node() { std::print("~"); }
};

int main() {
    {
        auto a = std::make_shared<Node>();
        auto b = std::make_shared<Node>();
        a->next = b;
    }
    std::print("|");
    {
        auto c = std::make_shared<Node>();
        c->next = c;
        std::print("{}", c.use_count());
        c->next.reset();
    }
    std::println("|");
    return 0;
}`,
      lang: 'cpp',
      answers: ['~~|2~|'],
      placeholder: 'Вывод программы',
      explain:
        'a → b — не цикл, оба удаляются в конце блока. c → c — цикл из одного объекта (счётчик 2); без ручного c->next.reset() он не удалился бы никогда.',
    },
    {
      q: 'Чем опасен колбэк [self = shared_from_this()] { … }, сохранённый в поле того же объекта?',
      options: [
        'Объект владеет колбэком, колбэк владеет объектом — цикл и утечка',
        'shared_from_this нельзя вызывать в методах',
        'Колбэк вызовется дважды',
        'Ничем',
      ],
      correct: 0,
      explain: 'Нужно захватить weak_from_this() и вызывать lock() внутри.',
    },
    {
      q: 'Какая связь в двусвязном списке на shared_ptr должна быть невладеющей?',
      options: ['prev', 'next', 'обе', 'никакая'],
      correct: 0,
      explain: 'next владеет цепочкой от головы, prev лишь смотрит назад.',
    },
    {
      q: 'Почему ручной reset() партнёра перед выходом из функции — плохое решение цикла?',
      options: [
        'Он не выполнится при исключении или раннем выходе, и утечка вернётся',
        'reset нельзя вызывать для полей',
        'Он удаляет оба объекта сразу',
        'Это хорошее решение',
      ],
      correct: 0,
      explain: 'Чинить нужно структуру связей, а не отдельные пути выполнения.',
    },
    {
      q: 'Как сборщик мусора находит циклы, которые не видит подсчёт ссылок?',
      options: [
        'Обходит граф ссылок от корней; всё недостижимое — мусор, даже если счётчики больше нуля',
        'Считает ссылки точнее',
        'Удаляет все объекты с одинаковыми счётчиками',
        'Никак',
      ],
      correct: 0,
      explain: 'Так работают сборщики Java, C# и детектор циклов в Python.',
    },
    {
      q: 'Какой санитайзер сообщает о памяти, которая не освобождена к концу программы?',
      answers: ['LeakSanitizer', 'LSan', 'lsan'],
      placeholder: 'Название',
      explain: 'Он входит в AddressSanitizer на Linux.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-cyclic-references-exercise',
      title: 'Партнёры',
      difficulty: 'beginner',
      description: `
Реестр \`std::map<std::string, std::shared_ptr<Person>>\` владеет людьми. \`Person\` хранит партнёра как \`std::weak_ptr<Person>\` и имя партнёра (пусто, если пары не было); деструктор печатает \`ушёл имя\`.

Команды:

- \`new X\` — добавить человека;
- \`pair A B\` — A и B становятся партнёрами друг друга (прежние связи A и B заменяются);
- \`leave X\` — убрать X из реестра;
- \`partner X\` — \`X: партнёр Y\`, \`X: партнёр Y ушёл\` или \`X: нет партнёра\`.

В конце уберите людей из реестра от последнего имени к первому — все должны уйти.`,
      constraints: ['Команд не больше 300; pair, leave и partner — для людей из реестра.'],
      hints: [
        'Если бы partner был shared_ptr, пара никогда бы не освободилась: каждый держал бы другого.',
        'partner: if (auto p = person.partner.lock()) … else if (!person.partner_name.empty()) … ушёл … else … нет партнёра.',
      ],
      solution: String.raw`
#include <iostream>
#include <iterator>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Person {
    std::string name;
    std::weak_ptr<Person> partner;
    std::string partner_name;
    explicit Person(std::string n) : name(std::move(n)) {}
    ~Person() {
        std::println("ушёл {}", name);
    }
};

int main() {
    std::map<std::string, std::shared_ptr<Person>> people;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "new") {
            people[x] = std::make_shared<Person>(x);
        } else if (command == "pair") {
            std::string y;
            std::cin >> y;
            auto &a = people.at(x);
            auto &b = people.at(y);
            a->partner = b;
            a->partner_name = y;
            b->partner = a;
            b->partner_name = x;
        } else if (command == "leave") {
            people.erase(x);
        } else {
            const Person &p = *people.at(x);
            if (auto other = p.partner.lock()) {
                std::println("{}: партнёр {}", x, other->name);
            } else if (!p.partner_name.empty()) {
                std::println("{}: партнёр {} ушёл", x, p.partner_name);
            } else {
                std::println("{}: нет партнёра", x);
            }
        }
    }
    while (!people.empty()) {
        people.erase(std::prev(people.end()));
    }
    return 0;
}`,
      explanation: `
Владеет людьми только реестр; связь «партнёр» — наблюдение. Поэтому уход одного не мешает удалению другого, а оставшийся узнаёт об уходе через \`lock()\`. Имя партнёра хранится отдельно лишь для сообщения: \`weak_ptr\`, который никогда не указывал на объект, и истёкший выглядят одинаково.

Если заменить \`weak_ptr\` на \`shared_ptr\`, каждая пара образовала бы цикл, и в конце программы «ушёл» напечатали бы только люди без партнёров.`,
      examples: [
        {
          in: 'new a\nnew b\npair a b\npartner a\nleave b\npartner a\n',
          out: 'a: партнёр b\nушёл b\na: партнёр b ушёл\nушёл a\n',
        },
        { in: 'new x\npartner x\n', out: 'x: нет партнёра\nушёл x\n' },
      ],
      hidden: [
        { in: 'new a\nnew b\npair a b\n', name: 'Пара уходит в конце' },
        {
          in: 'new a\nnew b\nnew c\npair a b\npair a c\npartner a\npartner b\npartner c\n',
          name: 'Смена партнёра',
        },
        { in: 'new a\npair a a\npartner a\n', name: 'Сам себе партнёр' },
        { in: 'new a\nnew b\npair a b\nleave a\nleave b\n', name: 'Оба уходят' },
        {
          in: 'new a\nnew b\npair a b\nleave b\nnew b\npartner a\n',
          name: 'Новый с тем же именем',
        },
        { in: 'new z\nnew y\nnew x\n', name: 'Порядок ухода' },
        {
          in: 'new a\nnew b\nnew c\nnew d\npair a b\npair c d\nleave a\nleave d\npartner b\npartner c\n',
          name: 'Две пары',
        },
        { in: 'new a\nnew b\npair b a\npartner a\npartner b\n', name: 'Пара в обратном порядке' },
      ],
    },
    {
      title: 'Двусвязный список',
      description: `
Узел \`Node\` хранит число, \`std::shared_ptr<Node> next\` (владеет) и \`std::weak_ptr<Node> prev\` (наблюдает); деструктор увеличивает глобальный счётчик удалённых узлов. Список хранит \`head_\` (\`shared_ptr\`) и \`tail_\` (\`weak_ptr\`). Деструктор списка удаляет узлы циклом.

Команды: \`push_back x\`, \`push_front x\`, \`pop_back\` и \`pop_front\` (печатают значение или \`пусто\`), \`forward\` — \`вперёд: …\`, \`backward\` — \`назад: …\` (по \`prev\` от хвоста; пустой список — \`—\`), \`stats\` — \`удалено узлов N\`. После всех команд уничтожьте список и напечатайте \`stats\` ещё раз — должны быть удалены все узлы.`,
      constraints: ['Команд не больше 1000.'],
      hints: [
        'pop_back: tail = tail_.lock(); auto prev = tail->prev.lock(); если prev есть — prev->next.reset() (удалит хвост) и tail_ = prev, иначе head_.reset().',
        'Если бы prev был shared_ptr, каждая пара соседних узлов образовала бы цикл, и ни один узел не удалился бы.',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <optional>
#include <print>
#include <string>
#include <utility>

int destroyed = 0;

struct Node {
    int value;
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev;
    explicit Node(int v) : value(v) {}
    ~Node() {
        ++destroyed;
    }
};

class List {
public:
    List() = default;
    List(const List &) = delete;
    List &operator=(const List &) = delete;
    ~List() {
        while (head_) {
            head_ = std::move(head_->next);
        }
    }

    void push_back(int x) {
        auto node = std::make_shared<Node>(x);
        if (auto tail = tail_.lock()) {
            node->prev = tail;
            tail->next = node;
        } else {
            head_ = node;
        }
        tail_ = node;
    }

    void push_front(int x) {
        auto node = std::make_shared<Node>(x);
        if (head_) {
            head_->prev = node;
            node->next = std::move(head_);
        } else {
            tail_ = node;
        }
        head_ = std::move(node);
    }

    std::optional<int> pop_front() {
        if (!head_) {
            return std::nullopt;
        }
        const int v = head_->value;
        head_ = std::move(head_->next);
        if (head_) {
            head_->prev.reset();
        }
        return v;
    }

    std::optional<int> pop_back() {
        auto tail = tail_.lock();
        if (!tail) {
            return std::nullopt;
        }
        const int v = tail->value;
        if (auto prev = tail->prev.lock()) {
            tail_ = prev;
            prev->next.reset();
        } else {
            head_.reset();
        }
        return v;
    }

    void forward() const {
        std::string s;
        for (const Node *n = head_.get(); n; n = n->next.get()) {
            s += (s.empty() ? "" : " ") + std::to_string(n->value);
        }
        std::println("вперёд: {}", s.empty() ? "—" : s);
    }

    void backward() const {
        std::string s;
        for (auto n = tail_.lock(); n; n = n->prev.lock()) {
            s += (s.empty() ? "" : " ") + std::to_string(n->value);
        }
        std::println("назад: {}", s.empty() ? "—" : s);
    }

private:
    std::shared_ptr<Node> head_;
    std::weak_ptr<Node> tail_;
};

void show_value(std::optional<int> v) {
    if (v) {
        std::println("{}", *v);
    } else {
        std::println("пусто");
    }
}

int main() {
    {
        List list;
        std::string command;
        while (std::cin >> command) {
            if (command == "push_back" || command == "push_front") {
                int x;
                std::cin >> x;
                if (command == "push_back") {
                    list.push_back(x);
                } else {
                    list.push_front(x);
                }
            } else if (command == "pop_back") {
                show_value(list.pop_back());
            } else if (command == "pop_front") {
                show_value(list.pop_front());
            } else if (command == "forward") {
                list.forward();
            } else if (command == "backward") {
                list.backward();
            } else {
                std::println("удалено узлов {}", destroyed);
            }
        }
    }
    std::println("удалено узлов {}", destroyed);
    return 0;
}`,
      explanation: `
Каждый узел принадлежит ровно одному владельцу — предыдущему узлу через \`next\` или списку через \`head_\`; \`prev\` и \`tail_\` только наблюдают. Поэтому удаление узла из цепочки освобождает его сразу, а уничтожение списка освобождает всё — итоговый счётчик совпадает с числом созданных узлов.

\`backward\` блокирует \`prev\` на каждом шаге: \`lock()\` подтверждает, что соседний узел жив, и на время перехода делает его совладельцем.`,
      examples: [
        {
          in: 'push_back 1\npush_back 2\npush_front 0\nforward\nbackward\npop_back\npop_front\nforward\nstats\n',
          out: 'вперёд: 0 1 2\nназад: 2 1 0\n2\n0\nвперёд: 1\nудалено узлов 2\nудалено узлов 3\n',
        },
        { in: 'pop_back\nbackward\n', out: 'пусто\nназад: —\nудалено узлов 0\n' },
      ],
      hidden: [
        { in: 'push_back 1\npop_back\npush_front 2\nbackward\n', name: 'Один элемент' },
        {
          in: 'push_front 3\npush_front 2\npush_front 1\nbackward\nforward\n',
          name: 'Только push_front',
        },
        {
          in: 'push_back 1\npush_back 2\npush_back 3\npop_front\npop_front\npop_front\npop_front\nbackward\nstats\n',
          name: 'Опустошение с головы',
        },
        {
          in: 'push_back 1\npush_back 2\npush_back 3\npop_back\npop_back\npop_back\npop_back\nforward\nstats\n',
          name: 'Опустошение с хвоста',
        },
        { in: 'push_back 5\npush_back 6\n', name: 'Удаление в деструкторе' },
        {
          in: 'push_front 1\npush_back 2\npush_front 0\npush_back 3\nbackward\n',
          name: 'Чередование',
        },
        {
          in: 'push_back -1\npop_front\npush_back -2\nforward\nbackward\nstats\n',
          name: 'Повторное заполнение',
        },
        { in: 'stats\n', name: 'Пустой список' },
      ],
    },
    {
      title: 'Найди ошибку: вечная сессия',
      bug: true,
      description: `
Сервер хранит сессии в словаре. Команды: \`start пользователь\` — создать сессию и запустить её таймер, \`tick пользователь\` — сработать таймеру (сессия печатает \`пинг пользователь #N\`), \`stop пользователь\` — убрать сессию из словаря. Сессия при закрытии печатает \`сессия пользователь закрыта\`.

Остановленные сессии не закрываются, а при завершении LeakSanitizer сообщает об утечке. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 200; tick и stop — только для запущенных сессий.'],
      hints: [
        'Кто владеет сессией после start? Перечислите всех владельцев, включая захваченные лямбдой.',
        'Захватите слабую ссылку: [weak = weak_from_this()] и внутри if (auto self = weak.lock()) self->ping();',
      ],
      starter: SESSIONS(false),
      solution: SESSIONS(true),
      explanation: `
Сессия владеет таймером, таймер — колбэком, а колбэк захватил \`shared_from_this()\` — ещё одного владельца сессии. Получился цикл: сессия → таймер → лямбда → сессия. Удаление из словаря убирает внешнего владельца, но счётчик остаётся равным единице, деструктор не вызывается, и память утекает.

Захват \`weak_from_this()\` разрывает цикл: колбэк знает о сессии, но не держит её. Если сессия жива, \`lock()\` даёт временного владельца на время пинга; если нет — колбэк ничего не делает. Это стандартный приём для колбэков, таймеров и асинхронных обработчиков.`,
      examples: [
        {
          in: 'start ada\ntick ada\ntick ada\nstop ada\n',
          out: 'пинг ada #1\nпинг ada #2\nсессия ada закрыта\n',
        },
        {
          in: 'start a\nstart b\ntick b\n',
          out: 'пинг b #1\nсессия b закрыта\nсессия a закрыта\n',
        },
      ],
      hidden: [
        'start x\nstop x\n',
        'start x\n',
        'start a\ntick a\nstart b\nstop a\ntick b\n',
        'start a\nstart b\nstart c\nstop b\n',
        'start длинное-имя\ntick длинное-имя\nstop длинное-имя\n',
        'start a\ntick a\ntick a\ntick a\n',
        'start z\nstart a\n',
        'start a\nstop a\nstart a\ntick a\n',
      ],
    },
    {
      title: 'Сборщик циклов',
      difficulty: 'advanced',
      description: `
Смоделируйте подсчёт ссылок и найдите то, что он пропускает. У каждого объекта счётчик = число входящих сильных ссылок от других объектов + 1, если на него есть внешний владелец (корень).

Команды:

- \`new X\` — объект с внешним владельцем (счётчик 1);
- \`ref A B\` — A получает сильную ссылку на B (B: +1; ссылки могут повторяться);
- \`unref A B\` — убрать одну ссылку A → B (она есть);
- \`drop X\` — убрать внешнего владельца X (он был).

Когда счётчик объекта становится 0, объект освобождается: печатается \`освобождён X\`, затем убираются все его исходящие ссылки в порядке добавления — это может каскадно освободить другие объекты.

- \`leaks\` — живые объекты, недостижимые по сильным ссылкам от объектов с внешним владельцем: \`утечка: имена по алфавиту\` или \`утечек нет\`;
- \`alive\` — \`живых N\`.`,
      constraints: [
        'Команд не больше 500; ref, unref и drop — только для живых объектов; имена уникальны.',
      ],
      hints: [
        'Храните для объекта: счётчик, флаг корня, вектор исходящих ссылок. Освобождение рекурсивно: release(x) печатает, помечает мёртвым и для каждой исходящей ссылки уменьшает счётчик цели, вызывая release при нуле.',
        'leaks — обход в ширину или глубину от всех живых корней по исходящим ссылкам; живые и непосещённые — утечки.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <map>
#include <print>
#include <set>
#include <string>
#include <vector>

struct Object {
    int count = 0;
    bool root = false;
    bool alive = true;
    std::vector<std::string> refs;
};

std::map<std::string, Object> objects;

void dec(const std::string &name);

void release(const std::string &name) {
    Object &o = objects.at(name);
    o.alive = false;
    std::println("освобождён {}", name);
    const std::vector<std::string> refs = std::move(o.refs);
    for (const std::string &target : refs) {
        dec(target);
    }
}

void dec(const std::string &name) {
    Object &o = objects.at(name);
    if (--o.count == 0) {
        release(name);
    }
}

void visit(const std::string &name, std::set<std::string> &seen) {
    if (!seen.insert(name).second) {
        return;
    }
    for (const std::string &target : objects.at(name).refs) {
        visit(target, seen);
    }
}

int main() {
    std::string command;
    while (std::cin >> command) {
        if (command == "leaks" || command == "alive") {
            if (command == "alive") {
                int n = 0;
                for (const auto &[name, o] : objects) {
                    n += o.alive;
                }
                std::println("живых {}", n);
                continue;
            }
            std::set<std::string> seen;
            for (const auto &[name, o] : objects) {
                if (o.alive && o.root) {
                    visit(name, seen);
                }
            }
            std::string leaked;
            for (const auto &[name, o] : objects) {
                if (o.alive && !seen.contains(name)) {
                    leaked += " " + name;
                }
            }
            std::println("{}", leaked.empty() ? "утечек нет" : "утечка:" + leaked);
            continue;
        }
        std::string a;
        std::cin >> a;
        if (command == "new") {
            objects[a] = Object{1, true, true, {}};
        } else if (command == "drop") {
            objects.at(a).root = false;
            dec(a);
        } else {
            std::string b;
            std::cin >> b;
            if (command == "ref") {
                objects.at(a).refs.push_back(b);
                ++objects.at(b).count;
            } else {
                auto &refs = objects.at(a).refs;
                refs.erase(std::ranges::find(refs, b));
                dec(b);
            }
        }
    }
    return 0;
}`,
      explanation: `
Подсчёт ссылок работает локально: он знает только число входящих ссылок и освобождает объект, как только оно стало нулём. Поэтому цепочки освобождаются каскадом, а циклы — никогда: у объектов в цикле счётчики больше нуля, хотя ни до одного из них нельзя добраться от внешних владельцев.

Обход от корней смотрит глобально: всё, что недостижимо, — мусор, сколько бы ссылок на него ни было. Так работают сборщики мусора Java и C# и дополнительный детектор циклов в CPython, который дополняет его подсчёт ссылок. В C++ сборщика нет — поэтому циклы проектируют так, чтобы их не было: одна связь в каждом цикле — \`weak_ptr\` или сырой указатель.`,
      examples: [
        {
          in: 'new a\nnew b\nref a b\nref b a\ndrop a\ndrop b\nalive\nleaks\n',
          out: 'живых 2\nутечка: a b\n',
        },
        {
          in: 'new a\nnew b\nref a b\ndrop b\ndrop a\nalive\nleaks\n',
          out: 'освобождён a\nосвобождён b\nживых 0\nутечек нет\n',
        },
      ],
      hidden: [
        { in: 'new a\nref a a\ndrop a\nleaks\n', name: 'Петля' },
        {
          in: 'new a\nnew b\nnew c\nref a b\nref b c\ndrop b\ndrop c\nleaks\ndrop a\nalive\n',
          name: 'Каскад по цепочке',
        },
        {
          in: 'new a\nnew b\nref a b\nref b a\ndrop b\nleaks\nunref a b\nalive\nleaks\n',
          name: 'Цикл с корнем',
        },
        {
          in: 'new a\nnew b\nref a b\nref a b\ndrop b\nunref a b\nalive\nunref a b\nalive\n',
          name: 'Повторная ссылка',
        },
        {
          in: 'new a\nnew b\nnew c\nref a b\nref b c\nref c a\ndrop a\ndrop b\ndrop c\nleaks\n',
          name: 'Цикл из трёх',
        },
        { in: 'alive\nleaks\n', name: 'Пусто' },
        {
          in: 'new x\nnew y\nref x y\nref y x\ndrop y\nleaks\ndrop x\nleaks\n',
          name: 'Цикл становится утечкой',
        },
        {
          in: 'new a\nnew b\nnew c\nref a c\nref b c\ndrop c\ndrop a\nalive\ndrop b\nalive\n',
          name: 'Общая цель',
        },
      ],
    },
  ],
};
