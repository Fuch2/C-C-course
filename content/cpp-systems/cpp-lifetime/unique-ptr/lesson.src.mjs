const REGISTRY = (fixed) => String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Item {
    std::string name;
    explicit Item(std::string n) : name(std::move(n)) {}
};

class Registry {
public:
    void adopt(std::unique_ptr<Item> item) {
        items_.push_back(std::move(item));
    }

    void print() const {
        for (const auto &item : items_) {
            std::println("в реестре: {}", item->name);
        }
    }

private:
    std::vector<std::unique_ptr<Item>> items_;
};

int main() {
    Registry registry;
    std::string name;
    while (std::cin >> name) {
        auto current = std::make_unique<Item>(name);
        std::println("создан {}", current->name);
        registry.adopt(${fixed ? 'std::move(current)' : 'std::unique_ptr<Item>(current.get())'});
    }
    registry.print();
    return 0;
}`;

export default {
  id: 'lifetime-unique-ptr',
  title: 'std::unique_ptr: единственный владелец',
  description:
    'std::unique_ptr как RAII-владелец объекта в куче: создание через make_unique, доступ, get, reset, release; передача владения перемещением; владение в сигнатурах функций — забрать, отдать, заимствовать; контейнеры полиморфных объектов; деревья с владеющими детьми и невладеющими ссылками на родителя; ошибка двух владельцев; итеративное удаление длинных цепочек.',
  moduleId: 'cpp-lifetime',
  order: 18,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-rule-of-zero'],
  objectives: [
    'Владеть объектами в куче через std::unique_ptr',
    'Передавать владение перемещением и выражать его в сигнатурах',
    'Сочетать владеющие unique_ptr и заимствующие сырые указатели',
    'Избегать двойного владения и висячих результатов get()',
  ],
  tags: ['C++23', 'Время жизни', 'unique_ptr', 'Умные указатели', 'Владение'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что делает std::unique_ptr в деструкторе?',
      options: [
        'Удаляет объект, которым владеет (если владеет)',
        'Ничего',
        'Уменьшает счётчик ссылок',
        'Обнуляет все копии',
      ],
      correct: 0,
      explain: 'Копий у unique_ptr не бывает — владелец один.',
    },
    {
      q: 'Как передать владение из unique_ptr a в функцию void take(std::unique_ptr<T>)?',
      options: ['take(std::move(a));', 'take(a);', 'take(a.get());', 'take(*a);'],
      correct: 0,
      explain: 'Копирование запрещено; после вызова a пуст.',
    },
    {
      q: 'Чем отличаются reset() и release()?',
      options: [
        'reset удаляет объект, release отдаёт сырой указатель и перестаёт владеть, не удаляя',
        'Ничем',
        'release удаляет, reset — нет',
        'reset копирует объект',
      ],
      correct: 0,
      explain: 'После release удалять объект должен тот, кто взял указатель.',
    },
    {
      q: 'Функции нужен только объект Widget для чтения. Какой параметр лучше?',
      options: [
        'const Widget &',
        'const std::unique_ptr<Widget> &',
        'std::unique_ptr<Widget>',
        'std::unique_ptr<Widget> &',
      ],
      correct: 0,
      explain: 'Ссылка на объект работает для любого владельца, в том числе стека и вектора.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>

struct T {
    int v;
    explicit T(int v) : v(v) {}
    ~T() { std::print("~{} ", v); }
};

int main() {
    auto a = std::make_unique<T>(1);
    auto b = std::make_unique<T>(2);
    a = std::move(b);
    std::print("| ");
    return 0;
}`,
      lang: 'cpp',
      answers: ['~1 | ~2'],
      placeholder: 'Вывод программы',
      explain:
        'Присваивание удаляет старый объект a (1) и забирает объект b; в конце удаляется 2, а b пуст.',
    },
    {
      q: 'Что будет при std::unique_ptr<int> a(raw); std::unique_ptr<int> b(raw);?',
      options: ['Двойное удаление в конце области', 'Ошибка компиляции', 'Утечка', 'Всё корректно'],
      correct: 0,
      explain: 'Каждый уверен, что владеет объектом единолично.',
    },
    {
      q: 'Сколько памяти занимает std::unique_ptr<T> с функцией удаления по умолчанию?',
      options: [
        'Столько же, сколько сырой указатель',
        'Вдвое больше',
        'Указатель плюс счётчик',
        'Зависит от T',
      ],
      correct: 0,
      explain: 'Удаление по умолчанию не хранит состояния.',
    },
    {
      q: 'Какой метод unique_ptr возвращает сырой указатель для заимствования, сохраняя владение?',
      answers: ['get', 'get()', 'p.get()'],
      placeholder: 'Метод',
      explain: 'Указатель из get() не должен пережить владельца.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-unique-ptr-exercise',
      title: 'Владелец документа',
      difficulty: 'beginner',
      description: `
Структура \`Doc\` хранит название; конструктор печатает \`открыт название\`, деструктор — \`закрыт название\`. Документы живут в \`std::map<std::string, std::unique_ptr<Doc>>\` (\`operator[]\` создаёт пустой указатель). Команды:

- \`open X название\` — \`docs[X] = std::make_unique<Doc>(название)\` (старый документ X закрывается);
- \`give Y X\` — \`docs[Y] = std::move(docs[X])\`;
- \`close X\` — \`docs[X].reset()\`;
- \`show X\` — \`X: название\` или \`X: пусто\`.

В конце программы оставшиеся документы закройте сами, перебирая имена от последнего к первому и вызывая \`reset\`.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Присваивание unique_ptr сначала забирает новый объект, затем удаляет старый — поэтому при open «открыт» нового печатается раньше «закрыт» старого.',
        'Перебор с конца: for (auto it = docs.rbegin(); it != docs.rend(); ++it) it->second.reset();',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Doc {
    std::string name;
    explicit Doc(std::string n) : name(std::move(n)) {
        std::println("открыт {}", name);
    }
    ~Doc() {
        std::println("закрыт {}", name);
    }
};

int main() {
    std::map<std::string, std::unique_ptr<Doc>> docs;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "open") {
            std::string name;
            std::cin >> name;
            docs[x] = std::make_unique<Doc>(name);
        } else if (command == "give") {
            std::string to;
            std::cin >> to;
            docs[to] = std::move(docs[x]);
        } else if (command == "close") {
            docs[x].reset();
        } else if (const auto &doc = docs[x]) {
            std::println("{}: {}", x, doc->name);
        } else {
            std::println("{}: пусто", x);
        }
    }
    for (auto it = docs.rbegin(); it != docs.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
Каждый документ в любой момент принадлежит ровно одному указателю. \`give\` перемещает владение — источник становится пустым, — а присваивание поверх непустого указателя закрывает его старый документ. Ни одного \`delete\`: документы закрываются при замене, при \`reset\` и при уничтожении указателей.`,
      examples: [
        {
          in: 'open a отчёт\ngive a b\nshow a\nshow b\nopen b письмо\nclose b\n',
          out: 'открыт отчёт\na: пусто\nb: отчёт\nоткрыт письмо\nзакрыт отчёт\nзакрыт письмо\n',
        },
        {
          in: 'open x один\nopen y два\n',
          out: 'открыт один\nоткрыт два\nзакрыт два\nзакрыт один\n',
        },
      ],
      hidden: [
        { in: 'show z\n', name: 'Пустой' },
        { in: 'open a d\nclose a\nclose a\n', name: 'Двойное закрытие' },
        { in: 'open a d\ngive a a\nshow a\n', name: 'Передача себе' },
        { in: 'open a 1\nopen b 2\ngive a b\nshow a\nshow b\n', name: 'Передача поверх' },
        { in: 'give a b\nshow b\n', name: 'Передача пустого' },
        { in: 'open a 1\ngive a b\ngive b c\ngive c d\nshow d\n', name: 'Цепочка передач' },
        { in: 'open z 1\nopen a 2\nopen m 3\n', name: 'Закрытие в конце' },
        { in: 'open a x\nopen a y\nopen a z\nshow a\n', name: 'Замена' },
      ],
    },
    {
      title: 'Дерево каталогов',
      description: `
Узел \`Node\` хранит имя, указатель на родителя \`Node *parent\` (не владеет) и детей \`std::vector<std::unique_ptr<Node>>\` (владеет). Деструктор узла увеличивает глобальный счётчик удалённых узлов и убирает имя из индекса \`std::map<std::string, Node *> by_name\` (тоже не владеет). Корень называется \`/\` и создаётся в начале.

Команды:

- \`add родитель имя\` — новый ребёнок в конце списка детей (имена уникальны);
- \`rm имя\` — удалить узел со всем поддеревом (из списка детей родителя) и напечатать \`удалено N\`; корень не удаляется;
- \`path имя\` — путь от корня: \`/a/b/c\` (для корня — \`/\`);
- \`tree\` — дерево: имя каждого узла на своей строке с отступом в 2 пробела на уровень, обход в глубину, дети в порядке добавления.`,
      constraints: ['Команд не больше 300; add, rm и path ссылаются на существующие узлы.'],
      hints: [
        'Удаление: найти узел через индекс, в parent->children найти unique_ptr с этим адресом (std::ranges::find_if по get()) и erase — деструкторы удалят всё поддерево.',
        'Путь строится подъёмом по parent до корня и разворотом списка имён.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Node;
std::map<std::string, Node *> by_name;
int removed = 0;

struct Node {
    std::string name;
    Node *parent;
    std::vector<std::unique_ptr<Node>> children;

    Node(std::string n, Node *p) : name(std::move(n)), parent(p) {
        by_name[name] = this;
    }
    ~Node() {
        ++removed;
        by_name.erase(name);
    }
};

void print_tree(const Node &node, int depth) {
    std::println("{}{}", std::string(depth * 2, ' '), node.name);
    for (const auto &child : node.children) {
        print_tree(*child, depth + 1);
    }
}

int main() {
    Node root("/", nullptr);
    std::string command;
    while (std::cin >> command) {
        if (command == "tree") {
            print_tree(root, 0);
            continue;
        }
        std::string a;
        std::cin >> a;
        if (command == "add") {
            std::string name;
            std::cin >> name;
            Node *parent = by_name.at(a);
            parent->children.push_back(std::make_unique<Node>(name, parent));
        } else if (command == "rm") {
            Node *node = by_name.at(a);
            auto &siblings = node->parent->children;
            const int before = removed;
            siblings.erase(std::ranges::find_if(siblings, [&](const auto &p) { return p.get() == node; }));
            std::println("удалено {}", removed - before);
        } else {
            std::vector<std::string> parts;
            for (const Node *n = by_name.at(a); n->parent; n = n->parent) {
                parts.push_back(n->name);
            }
            std::string path;
            for (auto it = parts.rbegin(); it != parts.rend(); ++it) {
                path += "/" + *it;
            }
            std::println("{}", path.empty() ? "/" : path);
        }
    }
    return 0;
}`,
      explanation: `
Владение в дереве направлено сверху вниз: родитель владеет детьми через \`unique_ptr\`, поэтому удаление узла автоматически удаляет всё поддерево — деструктор вектора детей вызывает деструкторы их \`unique_ptr\`, и так рекурсивно. Ссылки вверх (\`parent\`) и индекс — сырые указатели-заёмщики: они ничем не владеют, и их корректность обеспечена тем, что узел сам убирает себя из индекса при уничтожении, а родитель всегда переживает детей.

Если бы \`parent\` тоже был владеющим указателем, получился бы цикл владения, и дерево никогда бы не удалилось.`,
      examples: [
        {
          in: 'add / home\nadd home ada\nadd ada docs\nadd / etc\npath docs\ntree\nrm home\ntree\n',
          out: '/home/ada/docs\n/\n  home\n    ada\n      docs\n  etc\nудалено 3\n/\n  etc\n',
        },
        { in: 'path /\ntree\n', out: '/\n/\n' },
      ],
      hidden: [
        { in: 'add / a\nrm a\ntree\n', name: 'Удаление листа' },
        {
          in: 'add / a\nadd a b\nadd b c\nadd c d\npath d\nrm b\npath a\n',
          name: 'Глубокое поддерево',
        },
        { in: 'add / a\nadd / b\nadd / c\nrm b\ntree\n', name: 'Удаление из середины' },
        { in: 'add / a\nrm a\nadd / a\nadd a x\npath x\n', name: 'Повторное создание' },
        { in: 'add / x\nadd x y\nadd x z\nadd y w\ntree\n', name: 'Порядок детей' },
        { in: 'add / a\nadd a a1\nadd a a2\nadd a a3\nrm a\n', name: 'Подсчёт удалённых' },
        { in: 'add / дом\nadd дом кухня\npath кухня\n', name: 'Кириллица' },
        { in: 'add / p\nadd p q\nrm q\nrm p\ntree\n', name: 'Удаление по очереди' },
      ],
    },
    {
      title: 'Найди ошибку: два владельца',
      bug: true,
      description: `
Для каждого слова программа создаёт \`Item\`, печатает \`создан слово\` и передаёт его в реестр, который хранит владеющие \`unique_ptr\`. В конце печатается содержимое реестра. С первым же словом AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['Слов не больше 100.'],
      hints: [
        'Сколько unique_ptr владеют объектом после вызова adopt? Что происходит с current в конце итерации?',
        'Владение передают перемещением: registry.adopt(std::move(current));',
      ],
      starter: REGISTRY(false),
      solution: REGISTRY(true),
      explanation: `
\`std::unique_ptr<Item>(current.get())\` создаёт **второй** «единственный» владелец того же объекта. В конце итерации \`current\` удаляет объект, и реестр хранит висячий указатель: печать читает освобождённую память, а в конце программы объект удаляется повторно.

\`unique_ptr\` гарантирует единоличное владение, только если владение передают перемещением. Конструктор из сырого указателя — опасная дверь: используйте её только для объектов, которые точно никому не принадлежат, а лучше — не используйте вовсе и создавайте объекты через \`std::make_unique\`.`,
      examples: [
        { in: 'a b\n', out: 'создан a\nсоздан b\nв реестре: a\nв реестре: b\n' },
        { in: 'один\n', out: 'создан один\nв реестре: один\n' },
      ],
      hidden: [
        'x\n',
        'p q r s\n',
        'длинное-имя-элемента-реестра\n',
        'a\nb\nc\n',
        'кот пёс\n',
        'z z\n',
        '1 2 3 4 5 6 7 8\n',
        'item\n',
      ],
    },
    {
      title: 'Длинный список',
      difficulty: 'advanced',
      description: `
Односвязный список на умных указателях: \`struct Node { int value; std::unique_ptr<Node> next; };\`, класс \`List\` хранит \`std::unique_ptr<Node> head_\` и размер. Реализуйте:

- \`push_front(x)\`, \`pop_front()\` (возвращает \`std::optional<int>\`);
- \`reverse()\` — разворот на месте перестановкой указателей, без новых узлов;
- деструктор, удаляющий узлы **циклом**: неявный деструктор удалял бы цепочку рекурсивно и на длинном списке переполнил бы стек.

Команды: \`push x\`, \`pop\` (значение или \`пусто\`), \`fill n\` (push_front чисел 1, 2, …, n по порядку), \`reverse\`, \`print\` — \`размер N: первые до 10 значений\` и \`…\`, если элементов больше 10.`,
      constraints: ['Команд не больше 100; суммарно до 300 000 элементов.'],
      hints: [
        'reverse: std::unique_ptr<Node> prev; while (head_) { auto next = std::move(head_->next); head_->next = std::move(prev); prev = std::move(head_); head_ = std::move(next); } head_ = std::move(prev);',
        'Деструктор: while (head_) head_ = std::move(head_->next); — каждое присваивание удаляет один узел, у которого next уже пуст.',
      ],
      solution: String.raw`
#include <cstddef>
#include <iostream>
#include <memory>
#include <optional>
#include <print>
#include <string>
#include <utility>

struct Node {
    int value;
    std::unique_ptr<Node> next;
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

    void push_front(int x) {
        head_ = std::make_unique<Node>(Node{x, std::move(head_)});
        ++size_;
    }

    std::optional<int> pop_front() {
        if (!head_) {
            return std::nullopt;
        }
        const int v = head_->value;
        head_ = std::move(head_->next);
        --size_;
        return v;
    }

    void reverse() {
        std::unique_ptr<Node> prev;
        while (head_) {
            auto next = std::move(head_->next);
            head_->next = std::move(prev);
            prev = std::move(head_);
            head_ = std::move(next);
        }
        head_ = std::move(prev);
    }

    void print() const {
        std::string s;
        int shown = 0;
        for (const Node *n = head_.get(); n && shown < 10; n = n->next.get(), ++shown) {
            s += " " + std::to_string(n->value);
        }
        if (size_ > 10) {
            s += " …";
        }
        std::println("размер {}:{}", size_, s);
    }

private:
    std::unique_ptr<Node> head_;
    std::size_t size_ = 0;
};

int main() {
    List list;
    std::string command;
    while (std::cin >> command) {
        if (command == "push") {
            int x;
            std::cin >> x;
            list.push_front(x);
        } else if (command == "pop") {
            if (auto v = list.pop_front()) {
                std::println("{}", *v);
            } else {
                std::println("пусто");
            }
        } else if (command == "fill") {
            int n;
            std::cin >> n;
            for (int i = 1; i <= n; ++i) {
                list.push_front(i);
            }
        } else if (command == "reverse") {
            list.reverse();
        } else {
            list.print();
        }
    }
    return 0;
}`,
      explanation: `
Цепочка \`unique_ptr\` удаляет себя рекурсивно: деструктор узла вызывает деструктор \`next\`, тот — деструктор следующего узла, и так глубина стека растёт с длиной списка. На сотнях тысяч узлов стек переполняется. Цикл в деструкторе \`List\` отсоединяет узлы по одному: \`head_ = std::move(head_->next)\` удаляет голову, у которой \`next\` уже пуст, — глубина рекурсии всегда единица.

Разворот — только перестановка владения: ни одного выделения памяти, ни одной копии значений, ни одного сырого \`delete\`. Каждый узел в любой момент принадлежит ровно одному \`unique_ptr\`.`,
      examples: [
        {
          in: 'fill 3\nprint\nreverse\nprint\npop\nprint\n',
          out: 'размер 3: 3 2 1\nразмер 3: 1 2 3\n1\nразмер 2: 2 3\n',
        },
        { in: 'pop\nprint\n', out: 'пусто\nразмер 0:\n' },
      ],
      hidden: [
        { in: 'fill 12\nprint\n', name: 'Больше десяти' },
        { in: 'push 5\nreverse\nprint\n', name: 'Разворот одного' },
        { in: 'reverse\nprint\n', name: 'Разворот пустого' },
        { in: 'fill 200000\nprint\n', name: 'Длинный список' },
        { in: 'fill 300000\nreverse\nprint\npop\npop\n', name: 'Разворот длинного' },
        { in: 'push 1\npush 2\npop\npop\npop\n', name: 'Опустошение' },
        { in: 'fill 10\nprint\nreverse\nreverse\nprint\n', name: 'Двойной разворот' },
        { in: 'fill 5\npush -1\nreverse\nprint\n', name: 'Смешанные команды' },
      ],
    },
  ],
};
