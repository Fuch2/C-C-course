const REGISTRY = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
${fixed ? '' : '#include <string_view>\n'}#include <vector>

class Registry {
public:
    void add(const std::string &first, const std::string &last) {
        names_.push_back(last + ", " + first);
    }

    void print() const {
        for (std::size_t i = 0; i < names_.size(); ++i) {
            std::println("{}. {}", i + 1, names_[i]);
        }
    }

private:
    std::vector<${fixed ? 'std::string' : 'std::string_view'}> names_;
};

int main() {
    Registry registry;
    std::string first, last;
    while (std::cin >> first >> last) {
        registry.add(first, last);
    }
    registry.print();
    return 0;
}`;

export default {
  id: 'lifetime-ownership',
  title: 'Владение и заимствование',
  description:
    'Владелец ресурса и заёмщики; как типы выражают роли — значения, контейнеры и умные указатели владеют, ссылки, сырые указатели, string_view и span заимствуют; правило «сырой указатель не владеет»; что сообщают параметры и возвращаемые типы функций; заёмщик, переживший владельца, и висячие представления.',
  moduleId: 'cpp-lifetime',
  order: 5,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-raii'],
  objectives: [
    'Различать владельцев и заёмщиков ресурса',
    'Выражать владение и заимствование типами параметров и полей',
    'Пользоваться string_view и span как невладеющими представлениями',
    'Находить заёмщиков, переживших владельца',
  ],
  tags: ['C++23', 'Время жизни', 'Владение', 'string_view', 'span'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Кто должен освобождать ресурс?',
      options: [
        'Его единственный владелец',
        'Последний, кто им пользовался',
        'Любой, у кого есть указатель',
        'Операционная система',
      ],
      correct: 0,
      explain: 'Два владельца — двойное освобождение, ни одного — утечка.',
    },
    {
      q: 'Какие типы владеют тем, на что указывают или что содержат? Выберите все.',
      options: ['std::vector<int>', 'std::unique_ptr<int>', 'std::string_view', 'const int *'],
      correct: [0, 1],
      explain: 'string_view и сырой указатель только заимствуют.',
    },
    {
      q: 'Функция получила параметр Widget *w. Может ли она вызвать delete w?',
      options: [
        'Нет: сырой указатель — заёмщик, объект может принадлежать кому-то другому или лежать на стеке',
        'Да, всегда',
        'Да, если w не равен nullptr',
        'Только в деструкторе',
      ],
      correct: 0,
      explain: 'Передача владения выражается std::unique_ptr по значению.',
    },
    {
      q: 'Что не так с std::string_view v = std::to_string(12345678901234567LL);?',
      options: [
        'Строка-владелец временная и умирает на точке с запятой, v висит',
        'string_view нельзя создать из std::string',
        'Ничего',
        'to_string возвращает string_view',
      ],
      correct: 0,
      explain: 'string_view не продлевает жизнь временной строки.',
    },
    {
      q: 'Чем ссылка как параметр-заёмщик отличается от указателя?',
      options: [
        'Ссылка не бывает пустой, указатель может быть nullptr',
        'Ссылка владеет объектом',
        'Указатель быстрее',
        'Ничем',
      ],
      correct: 0,
      explain: 'Указатель выбирают, когда объекта может не быть.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <string_view>

std::string_view tail(std::string_view s) {
    return s.substr(s.find(' ') + 1);
}

int main() {
    const std::string line = "привет мир";
    std::println("{}", tail(line));
    return 0;
}`,
      lang: 'cpp',
      answers: ['мир'],
      placeholder: 'Вывод программы',
      explain: 'Представление указывает внутрь строки-владельца line, которая жива до конца main.',
    },
    {
      q: 'Какой параметр выбрать функции, которая только читает последовательность чисел из вектора или массива?',
      options: ['std::span<const int>', 'std::vector<int>', 'int *', 'std::vector<int> &'],
      correct: 0,
      explain:
        'span заимствует любую непрерывную последовательность без копирования и запрещает изменение.',
    },
    {
      q: 'Как называется объект, который пользуется ресурсом, но не отвечает за его освобождение?',
      answers: ['заёмщик', 'заемщик'],
      placeholder: 'Одно слово',
      explain: 'Заёмщик не должен пережить владельца.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-ownership-exercise',
      title: 'Библиотека',
      difficulty: 'beginner',
      description: `
Полка \`std::vector<Book>\` (\`title\`, \`year\`) — единственный владелец книг. Остальной код только заимствует:

- \`const Book *oldest(std::span<const Book>)\` — самая старая книга (первая при равенстве) или \`nullptr\`;
- \`int count_since(std::span<const Book>, int year)\` — сколько книг изданы в этом году или позже;
- \`bool mentions(const Book &, std::string_view word)\`.

Команды: \`add название год\` (название — одно слово), \`oldest\` — \`старейшая: название (год)\` или \`полка пуста\`, \`since год\` — \`с года: N\`, \`find слово\` — названия книг, содержащих слово, по одному в строке в порядке добавления, или \`не найдено\`.`,
      constraints: ['Команд не больше 200; годы от 0 до 2100.'],
      hints: [
        'Указатель, который вернула oldest, используйте сразу: следующий add может перевыделить память вектора.',
        'std::string::contains(std::string_view) появился в C++23.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <span>
#include <string>
#include <string_view>
#include <vector>

struct Book {
    std::string title;
    int year;
};

const Book *oldest(std::span<const Book> books) {
    const Book *best = nullptr;
    for (const Book &b : books) {
        if (best == nullptr || b.year < best->year) {
            best = &b;
        }
    }
    return best;
}

int count_since(std::span<const Book> books, int year) {
    int count = 0;
    for (const Book &b : books) {
        if (b.year >= year) {
            count++;
        }
    }
    return count;
}

bool mentions(const Book &book, std::string_view word) {
    return book.title.contains(word);
}

int main() {
    std::vector<Book> shelf;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            Book b;
            std::cin >> b.title >> b.year;
            shelf.push_back(b);
        } else if (command == "oldest") {
            if (const Book *b = oldest(shelf)) {
                std::println("старейшая: {} ({})", b->title, b->year);
            } else {
                std::println("полка пуста");
            }
        } else if (command == "since") {
            int year;
            std::cin >> year;
            std::println("с года: {}", count_since(shelf, year));
        } else {
            std::string word;
            std::cin >> word;
            bool found = false;
            for (const Book &b : shelf) {
                if (mentions(b, word)) {
                    std::println("{}", b.title);
                    found = true;
                }
            }
            if (!found) {
                std::println("не найдено");
            }
        }
    }
    return 0;
}`,
      explanation: `
Книгами владеет только \`shelf\`. Функции принимают \`std::span<const Book>\` и ссылки: им не нужно знать, где хранятся книги, и они не могут ни изменить их, ни освободить. \`nullptr\` из \`oldest\` выражает «книги нет» без особых значений и исключений.

Указатель-результат — тоже заёмщик, и он живёт ровно одну команду: следующий \`add\` может перевыделить память вектора.`,
      examples: [
        {
          in: 'add Дюна 1965\nadd Солярис 1961\noldest\nsince 1962\nfind ля\n',
          out: 'старейшая: Солярис (1961)\nс года: 1\nСолярис\n',
        },
        { in: 'oldest\nfind x\n', out: 'полка пуста\nне найдено\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'add A 2000\nadd B 2000\noldest\n', name: 'Равные годы' },
        { in: 'add Kniga 1\nsince 0\nsince 2\n', name: 'Граничные годы' },
        { in: 'add ab 1\nadd abc 2\nadd bc 3\nfind bc\n', name: 'Несколько совпадений' },
        { in: 'add Мир 2001\noldest\nadd Война 1869\noldest\n', name: 'Старейшая меняется' },
        { in: 'add x 2100\nsince 2100\nfind X\n', name: 'Регистр важен' },
        { in: 'add a 5\nadd b 4\nadd c 3\nadd d 2\nadd e 1\noldest\nsince 3\n', name: 'Пять книг' },
        { in: 'find a\nadd a 1\nfind a\n', name: 'Поиск до и после добавления' },
      ],
    },
    {
      title: 'Разбор без копий',
      description: `
Функция \`std::vector<std::string_view> split(std::string_view line)\` возвращает слова строки (разделитель — пробелы) как представления **внутрь** исходной строки, без копирования символов.

Для каждой строки ввода напечатайте \`слов N, самое длинное W\` (при равенстве длин — первое) или \`пусто\`, если слов нет. Строку-владельца храните в \`std::string\`, пока пользуетесь представлениями.`,
      constraints: [
        'Строк не больше 100, длина до 10 000 символов; слова из латинских букв и цифр.',
      ],
      hints: [
        "Ищите начало слова через line.find_first_not_of(' ', pos), конец — через line.find(' ', start); line.substr(start, len) у string_view возвращает string_view.",
        'Пока жив std::string line в теле цикла, представления действительны. Не сохраняйте их между итерациями.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <string_view>
#include <vector>

std::vector<std::string_view> split(std::string_view line) {
    std::vector<std::string_view> words;
    std::size_t pos = 0;
    while (true) {
        const std::size_t start = line.find_first_not_of(' ', pos);
        if (start == std::string_view::npos) {
            break;
        }
        std::size_t end = line.find(' ', start);
        if (end == std::string_view::npos) {
            end = line.size();
        }
        words.push_back(line.substr(start, end - start));
        pos = end;
    }
    return words;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        const std::vector<std::string_view> words = split(line);
        if (words.empty()) {
            std::println("пусто");
            continue;
        }
        std::string_view longest = words.front();
        for (std::string_view w : words) {
            if (w.size() > longest.size()) {
                longest = w;
            }
        }
        std::println("слов {}, самое длинное {}", words.size(), longest);
    }
    return 0;
}`,
      explanation: `
Каждое \`string_view\` — пара «указатель внутрь \`line\` и длина». Слова не копируются, но и не живут сами по себе: они действительны, пока жива строка-владелец и пока она не меняется. Поэтому вектор представлений создаётся и используется внутри одной итерации, а \`getline\`, перезаписывающий \`line\`, вызывается уже после.`,
      examples: [
        {
          in: 'to be or not\n  \nhello   world\n',
          out: 'слов 4, самое длинное not\nпусто\nслов 2, самое длинное hello\n',
        },
        { in: 'a\n', out: 'слов 1, самое длинное a\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: '\n', name: 'Пустая строка' },
        { in: '   lead and trail   \n', name: 'Пробелы по краям' },
        { in: 'abc de fgh\n', name: 'Равная длина' },
        { in: 'x y z\nlongestwordhere a\n', name: 'Две строки' },
        { in: 'one\ntwo three\nfour five six\n', name: 'Три строки' },
        { in: '1234567890 12345678901 1\n', name: 'Цифры' },
        { in: 'single\n', name: 'Одно слово' },
      ],
    },
    {
      title: 'Найди ошибку: реестр имён',
      bug: true,
      description: `
Программа читает пары \`имя фамилия\`, сохраняет их в реестре как \`фамилия, имя\` и в конце печатает нумерованный список. Под AddressSanitizer она падает при печати. Найдите и исправьте ошибку.`,
      constraints: ['Пар не больше 100.'],
      hints: [
        'Кто владеет строкой last + ", " + first после выхода из add?',
        'Реестр должен владеть своими строками: храните std::vector<std::string>.',
      ],
      starter: REGISTRY(false),
      solution: REGISTRY(true),
      explanation: `
\`last + ", " + first\` создаёт временную строку — единственного владельца символов. В вектор попадает \`string_view\` на неё, а сама строка умирает в конце выражения. При печати представления указывают в освобождённую память.

Поле класса, которое должно хранить данные дольше одного вызова, должно ими **владеть**: \`std::vector<std::string>\`. \`string_view\` хорош для параметров и коротких вычислений, но опасен в полях и контейнерах.`,
      examples: [
        { in: 'Ада Лавлейс\nАлан Тьюринг\n', out: '1. Лавлейс, Ада\n2. Тьюринг, Алан\n' },
        { in: 'Грейс Хоппер\n', out: '1. Хоппер, Грейс\n' },
      ],
      hidden: [
        'Бьёрн Страуструп\n',
        'Деннис Ритчи\nКен Томпсон\nБрайан Керниган\n',
        'Длинноеимяпользователя Длиннаяфамилияпользователя\n',
        'Q W\n',
        'Маргарет Гамильтон\nДжон Бэкус\nНиклаус Вирт\nЭдсгер Дейкстра\n',
        'Линус Торвальдс\n',
        'Барбара Лисков\nТони Хоар\n',
        'Джеймс Гослинг\nГвидо Россум\n',
      ],
    },
    {
      title: 'Дерево владения',
      difficulty: 'advanced',
      description: `
Смоделируйте владение объектами. Команды:

- \`new X\` — создать объект X, которым владеет программа; напечатать \`+X\`;
- \`own A X\` — создать объект X, которым владеет живой объект A; напечатать \`+X\`;
- \`use A B\` — A обращается к B: напечатать \`A → B\`, если B жив, иначе \`A → B: висячая ссылка\`;
- \`drop X\` — уничтожить живой объект X: напечатать \`-X\`, затем уничтожить всё, чем X владеет, в порядке, обратном созданию (рекурсивно, по тем же правилам).

В конце уничтожьте все ещё живые объекты программы в порядке, обратном созданию. Уничтоженный объект перестаёт числиться у своего владельца.`,
      constraints: [
        'Команд не больше 300; имена уникальны; own, use и drop ссылаются только на уже созданные имена; own и drop — только на живые объекты.',
      ],
      hints: [
        'Узел: struct Node { std::string owner; std::vector<std::string> owned; bool alive = true; }; все узлы — в std::map<std::string, Node>, у программы — свой список top.',
        'destroy(name): пометить мёртвым, напечатать, затем пройти owned с конца и вызвать destroy для живых. При drop удалите имя из списка владельца (или пропускайте мёртвые при обходе).',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <vector>

struct Node {
    std::vector<std::string> owned;
    bool alive = true;
};

std::map<std::string, Node> nodes;

void destroy(const std::string &name) {
    Node &node = nodes.at(name);
    node.alive = false;
    std::println("-{}", name);
    for (auto it = node.owned.rbegin(); it != node.owned.rend(); ++it) {
        if (nodes.at(*it).alive) {
            destroy(*it);
        }
    }
}

int main() {
    std::vector<std::string> top;
    std::string command;
    while (std::cin >> command) {
        if (command == "new") {
            std::string x;
            std::cin >> x;
            nodes[x] = Node{};
            top.push_back(x);
            std::println("+{}", x);
        } else if (command == "own") {
            std::string a, x;
            std::cin >> a >> x;
            nodes[x] = Node{};
            nodes.at(a).owned.push_back(x);
            std::println("+{}", x);
        } else if (command == "use") {
            std::string a, b;
            std::cin >> a >> b;
            if (nodes.at(b).alive) {
                std::println("{} → {}", a, b);
            } else {
                std::println("{} → {}: висячая ссылка", a, b);
            }
        } else {
            std::string x;
            std::cin >> x;
            destroy(x);
        }
    }
    for (auto it = top.rbegin(); it != top.rend(); ++it) {
        if (nodes.at(*it).alive) {
            destroy(*it);
        }
    }
    return 0;
}`,
      explanation: `
Владение образует дерево: у каждого объекта ровно один владелец, и уничтожение владельца уничтожает всё поддерево. Так устроены объекты C++ с полями-значениями, контейнерами и \`unique_ptr\`: деструктор родителя разрушает детей в обратном порядке.

Заимствование в дерево не входит. \`use\` ничего не продлевает: если B уничтожен вместе со своим владельцем, ссылка на него повисает, — и обнаружить это можно только потому, что модель помнит мёртвые объекты. В настоящей программе такой памяти нет, поэтому заёмщиков проектируют так, чтобы они гарантированно жили меньше владельцев.`,
      examples: [
        {
          in: 'new app\nown app db\nown app cache\nown db pool\nnew logger\nuse logger db\ndrop app\nuse logger pool\n',
          out: '+app\n+db\n+cache\n+pool\n+logger\nlogger → db\n-app\n-cache\n-db\n-pool\nlogger → pool: висячая ссылка\n-logger\n',
        },
        { in: 'new a\nnew b\n', out: '+a\n+b\n-b\n-a\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'new a\nown a b\ndrop b\nuse a b\n', name: 'Удаление дочернего' },
        { in: 'new r\nown r c1\nown r c2\nown r c3\n', name: 'Порядок детей' },
        { in: 'new a\nown a b\nown b c\nown c d\ndrop b\nuse a d\n', name: 'Глубокое поддерево' },
        { in: 'new x\nuse x x\ndrop x\nuse x x\n', name: 'Ссылка на себя' },
        {
          in: 'new a\nnew b\nown a c\ndrop a\nuse b c\nnew d\n',
          name: 'Новый объект после удаления',
        },
        { in: 'new p\nown p q\nown q r\nown p s\n', name: 'Разрушение в конце' },
        { in: 'new a\nown a b\nown a c\ndrop c\nuse b c\n', name: 'Удалён последний ребёнок' },
      ],
    },
  ],
};
