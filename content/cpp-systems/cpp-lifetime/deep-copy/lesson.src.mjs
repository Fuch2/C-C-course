const PLAYLIST = (fixed) => String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class Playlist {
public:
    Playlist() = default;
    Playlist(const Playlist &other) : size_(other.size_), songs_(new std::string[other.size_]) {
        std::copy_n(other.songs_, size_, songs_);
    }
${
  fixed
    ? `    Playlist &operator=(const Playlist &other) {
        Playlist copy(other);
        std::swap(size_, copy.size_);
        std::swap(songs_, copy.songs_);
        return *this;
    }
`
    : ''
}    ~Playlist() {
        delete[] songs_;
    }

    void add(const std::string &song) {
        auto *bigger = new std::string[size_ + 1];
        std::copy_n(songs_, size_, bigger);
        bigger[size_] = song;
        delete[] songs_;
        songs_ = bigger;
        ++size_;
    }

    std::string text() const {
        std::string s;
        for (std::size_t i = 0; i < size_; ++i) {
            s += (i ? ", " : "") + songs_[i];
        }
        return s.empty() ? "пусто" : s;
    }

private:
    std::size_t size_ = 0;
    std::string *songs_ = nullptr;
};

int main() {
    Playlist a, b;
    auto pick = [&](char name) -> Playlist & { return name == 'A' ? a : b; };
    std::string command;
    char x;
    while (std::cin >> command >> x) {
        if (command == "add") {
            std::string song;
            std::cin >> song;
            pick(x).add(song);
        } else if (command == "assign") {
            char y;
            std::cin >> y;
            pick(x) = pick(y);
        } else {
            std::println("{}: {}", x, pick(x).text());
        }
    }
    return 0;
}`;

export default {
  id: 'lifetime-deep-copy',
  title: 'Глубокое копирование',
  description:
    'Глубокая копия создаёт собственные копии всех ресурсов: конструктор копирования и присваивание для класса с владеющим указателем; рекурсивное копирование деревьев; копия графа с общими узлами и циклами через таблицу соответствия; цена глубокой копии и альтернативы — ссылки, перемещение, copy-on-write, clone().',
  moduleId: 'cpp-lifetime',
  order: 9,
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-shallow-copy'],
  objectives: [
    'Писать глубокое копирование для класса, владеющего памятью',
    'Копировать рекурсивные структуры целиком',
    'Сохранять связи при копировании графа',
    'Оценивать цену глубокой копии',
  ],
  tags: ['C++23', 'Время жизни', 'Копирование', 'Деревья', 'Графы'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что отличает глубокую копию от поверхностной?',
      options: [
        'Копия получает собственные экземпляры всех ресурсов, общих данных нет',
        'Копия быстрее',
        'Копируется только верхний уровень объекта',
        'Копия ссылается на оригинал',
      ],
      correct: 0,
      explain: 'Поэтому каждый объект освобождает только своё.',
    },
    {
      q: 'Класс владеет int *value_. Какой конструктор копирования делает глубокую копию?',
      options: [
        'Box(const Box &o) : value_(new int(*o.value_)) {}',
        'Box(const Box &o) : value_(o.value_) {}',
        'Box(const Box &o) = default;',
        'Box(const Box &o) : value_(nullptr) {}',
      ],
      correct: 0,
      explain: 'Новый блок и копия значения в него.',
    },
    {
      q: 'Конструктор копирования глубокий, а оператор присваивания неявный. Что будет после b = a; и выхода из блока?',
      options: [
        'Утечка старого блока b и двойное освобождение блока a',
        'Всё корректно',
        'Ошибка компиляции',
        'Только утечка',
      ],
      correct: 0,
      explain:
        'Неявное присваивание копирует адрес: старый блок b потерян, а блок a теперь у двоих.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> a{"x", "y"};
    std::vector<std::string> b = a;
    b[0] += "!";
    b.push_back("z");
    std::println("{} {} {}", a.size(), a[0], b[0]);
    return 0;
}`,
      lang: 'cpp',
      answers: ['2 x x!'],
      placeholder: 'Вывод программы',
      explain: 'Вектор копирует элементы глубоко: у b свои строки.',
    },
    {
      q: 'Почему при копировании графа с общими узлами нужна таблица «старый узел → новый узел»?',
      options: [
        'Чтобы общий узел скопировать один раз, а циклы не привели к бесконечной рекурсии',
        'Для сортировки узлов',
        'Чтобы освободить старый граф',
        'Таблица не нужна',
      ],
      correct: 0,
      explain: 'Без неё узел, на который ведут два ребра, раздвоится, а цикл зациклит обход.',
    },
    {
      q: 'Как сделать полную копию полиморфного объекта, известного по ссылке на базу?',
      options: [
        'Виртуальной функцией clone()',
        'Конструктором копирования базы',
        'memcpy',
        'Присваиванием базе',
      ],
      correct: 0,
      explain: 'Копирование через базу срезает наследника.',
    },
    {
      q: 'Чем стоит заменить глубокую копию, если оригинал больше не нужен?',
      options: ['Перемещением', 'Поверхностной копией', 'Ещё одной копией', 'Ничем'],
      correct: 0,
      explain: 'Перемещение забирает ресурсы, а не копирует их — об этом следующие уроки.',
    },
    {
      q: 'Как называется приём, при котором копии разделяют данные, пока одна из них не захочет их изменить? (англ.)',
      answers: ['copy-on-write', 'copy on write', 'COW', 'копирование при записи'],
      placeholder: 'Термин',
      explain: 'Обычно делается через std::shared_ptr<const T> и копию при первом изменении.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-deep-copy-exercise',
      title: 'Матрица',
      difficulty: 'beginner',
      description: `
Класс \`Matrix\` хранит размеры и массив \`long long\` в куче (\`new[]\`). Напишите конструктор \`Matrix(rows, cols)\` (заполнен нулями), глубокий конструктор копирования, оператор присваивания (copy-and-swap) и деструктор.

Матрицы хранятся в \`std::map<std::string, Matrix>\`. Команды:

- \`new X r c\` — создать (пересоздать) нулевую матрицу;
- \`set X i j v\` — элемент (с нуля);
- \`copy X Y\` — X становится копией Y (X может не существовать или совпадать с Y);
- \`add X Y\` — прибавить Y к X поэлементно (размеры совпадают);
- \`print X\` — строка \`X:\`, затем строки матрицы через пробел.`,
      constraints: ['Команд не больше 200; 1 ≤ r, c ≤ 20; |v| ≤ 10⁹.'],
      hints: [
        'Matrix(const Matrix &o) : rows_(o.rows_), cols_(o.cols_), data_(new long long[o.rows_ * o.cols_]) { std::copy_n(…); }',
        'insert_or_assign(name, matrix) копирует матрицу конструктором копирования (новое имя) или оператором присваивания (существующее).',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

class Matrix {
public:
    Matrix(int rows, int cols) : rows_(rows), cols_(cols), data_(new long long[rows * cols]()) {}
    Matrix(const Matrix &other)
        : rows_(other.rows_), cols_(other.cols_), data_(new long long[other.rows_ * other.cols_]) {
        std::copy_n(other.data_, rows_ * cols_, data_);
    }
    Matrix &operator=(const Matrix &other) {
        Matrix copy(other);
        std::swap(rows_, copy.rows_);
        std::swap(cols_, copy.cols_);
        std::swap(data_, copy.data_);
        return *this;
    }
    ~Matrix() {
        delete[] data_;
    }

    long long &at(int i, int j) {
        return data_[i * cols_ + j];
    }

    void add(const Matrix &other) {
        for (int k = 0; k < rows_ * cols_; ++k) {
            data_[k] += other.data_[k];
        }
    }

    void print(const std::string &name) const {
        std::println("{}:", name);
        for (int i = 0; i < rows_; ++i) {
            std::string row;
            for (int j = 0; j < cols_; ++j) {
                row += (j ? " " : "") + std::to_string(data_[i * cols_ + j]);
            }
            std::println("{}", row);
        }
    }

private:
    int rows_;
    int cols_;
    long long *data_;
};

int main() {
    std::map<std::string, Matrix> m;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "new") {
            int r, c;
            std::cin >> r >> c;
            m.insert_or_assign(x, Matrix(r, c));
        } else if (command == "set") {
            int i, j;
            long long v;
            std::cin >> i >> j >> v;
            m.at(x).at(i, j) = v;
        } else if (command == "copy") {
            std::string y;
            std::cin >> y;
            m.insert_or_assign(x, m.at(y));
        } else if (command == "add") {
            std::string y;
            std::cin >> y;
            m.at(x).add(m.at(y));
        } else {
            m.at(x).print(x);
        }
    }
    return 0;
}`,
      explanation: `
Каждая матрица владеет своим массивом: конструктор копирования выделяет новый и копирует элементы, присваивание строит полную копию и обменивается с ней. Поэтому \`copy B A\` и последующие \`set\` в одной из матриц не влияют на другую, \`add X X\` (сложение с собой) корректно удваивает элементы, а при пересоздании старый массив освобождается.

\`new long long[n]()\` — круглые скобки после размера заполняют массив нулями.`,
      examples: [
        {
          in: 'new A 2 2\nset A 0 1 5\ncopy B A\nset B 0 1 7\nadd A B\nprint A\nprint B\n',
          out: 'A:\n0 12\n0 0\nB:\n0 7\n0 0\n',
        },
        { in: 'new M 1 3\nprint M\n', out: 'M:\n0 0 0\n' },
      ],
      hidden: [
        { in: 'new A 1 1\nset A 0 0 3\nadd A A\nprint A\n', name: 'Сложение с собой' },
        { in: 'new A 2 1\nset A 1 0 9\ncopy A A\nprint A\n', name: 'Копия в себя' },
        {
          in: 'new A 2 2\nnew B 3 3\ncopy A B\nset A 2 2 1\nprint A\nprint B\n',
          name: 'Копия другого размера',
        },
        {
          in: 'new A 1 2\nset A 0 0 1000000000\nadd A A\nadd A A\nprint A\n',
          name: 'Большие числа',
        },
        {
          in: 'new A 1 1\nset A 0 0 -5\ncopy B A\ncopy C B\nadd C A\nprint C\nprint A\n',
          name: 'Цепочка копий',
        },
        { in: 'new A 2 2\nset A 0 0 1\nnew A 1 1\nprint A\n', name: 'Пересоздание' },
        { in: 'new X 20 1\nset X 19 0 7\nprint X\n', name: 'Высокая матрица' },
        {
          in: 'new A 1 2\nnew B 1 2\nset B 0 1 4\nadd A B\nadd A B\nprint A\n',
          name: 'Двойное сложение',
        },
      ],
    },
    {
      title: 'Копия дерева',
      description: `
Двоичное дерево поиска \`Tree\` хранит узлы \`Node { int value; Node *left; Node *right; }\`, выделенные \`new\`. Напишите рекурсивные \`clone\` и \`destroy\`, глубокий конструктор копирования, присваивание (copy-and-swap) и деструктор.

Деревья хранятся в \`std::map<std::string, Tree>\` (\`operator[]\` создаёт пустое). Команды:

- \`insert T x\` — вставить x (равные — в правое поддерево);
- \`copy T2 T1\` — T2 становится копией T1;
- \`print T\` — \`T: значения по возрастанию\` или \`T: пусто\`;
- \`height T\` — \`T: высота H\` (пустое — 0, один узел — 1).`,
      constraints: ['Команд не больше 300; значения по модулю до 10⁶.'],
      hints: [
        'Node *clone(const Node *n) { return n ? new Node{n->value, clone(n->left), clone(n->right)} : nullptr; }',
        'Обход по возрастанию — симметричный: левое поддерево, узел, правое поддерево.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

struct Node {
    int value;
    Node *left = nullptr;
    Node *right = nullptr;
};

Node *clone(const Node *n) {
    return n ? new Node{n->value, clone(n->left), clone(n->right)} : nullptr;
}

void destroy(Node *n) {
    if (n) {
        destroy(n->left);
        destroy(n->right);
        delete n;
    }
}

class Tree {
public:
    Tree() = default;
    Tree(const Tree &other) : root_(clone(other.root_)) {}
    Tree &operator=(const Tree &other) {
        Tree copy(other);
        std::swap(root_, copy.root_);
        return *this;
    }
    ~Tree() {
        destroy(root_);
    }

    void insert(int v) {
        Node **slot = &root_;
        while (*slot) {
            slot = v < (*slot)->value ? &(*slot)->left : &(*slot)->right;
        }
        *slot = new Node{v};
    }

    std::string text() const {
        std::string s;
        walk(root_, s);
        return s.empty() ? "пусто" : s;
    }

    int height() const {
        return height(root_);
    }

private:
    static void walk(const Node *n, std::string &s) {
        if (n) {
            walk(n->left, s);
            s += (s.empty() ? "" : " ") + std::to_string(n->value);
            walk(n->right, s);
        }
    }

    static int height(const Node *n) {
        return n ? 1 + std::max(height(n->left), height(n->right)) : 0;
    }

    Node *root_ = nullptr;
};

int main() {
    std::map<std::string, Tree> trees;
    std::string command, t;
    while (std::cin >> command >> t) {
        if (command == "insert") {
            int x;
            std::cin >> x;
            trees[t].insert(x);
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            trees[t] = trees[from];
        } else if (command == "print") {
            std::println("{}: {}", t, trees[t].text());
        } else {
            std::println("{}: высота {}", t, trees[t].height());
        }
    }
    return 0;
}`,
      explanation: `
\`clone\` повторяет форму дерева: для каждого узла оригинала создаётся новый, и его указатели ведут на новые копии поддеревьев. После копирования деревья не имеют общих узлов, поэтому вставка в одно не влияет на другое, а два деструктора освобождают каждый свои узлы.

\`trees[t] = trees[from]\` при совпадающих именах — самоприсваивание, и copy-and-swap справляется с ним без особых проверок.`,
      examples: [
        {
          in: 'insert A 5\ninsert A 3\ninsert A 8\ncopy B A\ninsert B 1\nprint A\nprint B\nheight B\n',
          out: 'A: 3 5 8\nB: 1 3 5 8\nB: высота 3\n',
        },
        { in: 'print X\nheight X\n', out: 'X: пусто\nX: высота 0\n' },
      ],
      hidden: [
        {
          in: 'insert A 1\ninsert A 2\ninsert A 3\ninsert A 4\nheight A\n',
          name: 'Вырожденное дерево',
        },
        { in: 'insert A 5\ncopy A A\nprint A\n', name: 'Копия в себя' },
        { in: 'insert A 5\ninsert B 9\ncopy B A\nprint B\n', name: 'Копия заменяет' },
        { in: 'insert A 2\ninsert A 2\ninsert A 2\nprint A\nheight A\n', name: 'Равные значения' },
        {
          in: 'insert A 4\ninsert A 2\ninsert A 6\ninsert A 1\ninsert A 3\ninsert A 5\ninsert A 7\ncopy B A\ncopy C B\ninsert C 8\nprint A\nprint C\nheight C\n',
          name: 'Полное дерево',
        },
        { in: 'copy A B\nprint A\n', name: 'Копия пустого' },
        { in: 'insert A -1000000\ninsert A 1000000\nprint A\n', name: 'Крайние значения' },
        {
          in: 'insert A 3\ncopy B A\ninsert A 1\ninsert B 9\nprint A\nprint B\n',
          name: 'Независимые изменения',
        },
      ],
    },
    {
      title: 'Найди ошибку: забытое присваивание',
      bug: true,
      description: `
Два плейлиста \`A\` и \`B\`. Команды: \`add X песня\`, \`assign X Y\` — X становится копией Y, \`print X\` — песни через запятую или \`пусто\`. Класс \`Playlist\` сам владеет массивом строк в куче.

После \`assign\` плейлисты начинают влиять друг на друга, а AddressSanitizer сообщает об ошибках памяти. Найдите и исправьте ошибку.`,
      constraints: ['Команд не больше 100.'],
      hints: [
        'Какие специальные функции написаны в Playlist, а какие компилятор создаёт сам?',
        'Неявный operator= копирует указатель. Напишите присваивание по идиоме copy-and-swap на основе уже готового конструктора копирования.',
      ],
      starter: PLAYLIST(false),
      solution: PLAYLIST(true),
      explanation: `
Конструктор копирования и деструктор написаны правильно, а копирующее присваивание компилятор создал сам — поверхностное. После \`A = B\` старый массив \`A\` потерян (утечка), а массив \`B\` принадлежит обоим плейлистам. Следующий \`add\` в одном из них удаляет общий массив, и второй указывает в освобождённую память; в конце — двойное освобождение.

Класс, которому понадобились свой деструктор и свой конструктор копирования, почти наверняка нуждается и в своём присваивании. Это правило трёх — тема следующего урока.`,
      examples: [
        {
          in: 'add A раз\nadd B два\nassign A B\nadd A три\nprint A\nprint B\n',
          out: 'A: два, три\nB: два\n',
        },
        { in: 'add A x\nprint A\nprint B\n', out: 'A: x\nB: пусто\n' },
      ],
      hidden: [
        'add B a\nassign A B\nprint A\n',
        'add A a\nassign A B\nprint A\nprint B\n',
        'add A a\nadd B b\nassign A B\nassign B A\nadd B c\nprint A\nprint B\n',
        'add A one\nassign A A\nprint A\n',
        'add B x\nadd B y\nassign A B\nadd B z\nprint A\nprint B\n',
        'assign A B\nadd A q\nprint B\n',
        'add A 1\nadd A 2\nadd B 3\nassign B A\nprint B\n',
        'add A песня\nassign B A\nassign A B\nprint A\n',
      ],
    },
    {
      title: 'Копия графа',
      difficulty: 'advanced',
      description: `
Граф \`Graph\` владеет узлами \`Node { std::string name; std::vector<Node *> out; }\`, выделенными \`new\` и перечисленными в \`std::vector<Node *> nodes_\`. Рёбра — указатели на узлы **этого же** графа; возможны циклы и несколько рёбер в один узел.

Напишите глубокий конструктор копирования: новые узлы для каждого старого и рёбра, переведённые на новые узлы через таблицу \`std::unordered_map<const Node *, Node *>\`. Присваивание — copy-and-swap, деструктор удаляет все узлы.

Графы хранятся в \`std::map<std::string, Graph>\`. Команды:

- \`node G имя\` — добавить узел (имена в графе уникальны);
- \`edge G a b\` — ребро a → b (узлы существуют);
- \`copy H G\` — H становится копией G;
- \`rename G старое новое\` — переименовать узел;
- \`print G\` — строка \`G:\`, затем для каждого узла в порядке добавления \`имя → цели через пробел\` или \`имя → —\`.`,
      constraints: ['Команд не больше 300; узлов в графе до 50.'],
      hints: [
        'Первый проход создаёт копии узлов и заполняет таблицу; второй для каждого старого узла переводит его рёбра: copy->out.push_back(map.at(target)).',
        'Переименование в копии не должно менять оригинал: если рёбра копии указывают на узлы оригинала, print копии покажет новые имена и в оригинале — так проверяется глубина копии.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct Node {
    std::string name;
    std::vector<Node *> out;
};

class Graph {
public:
    Graph() = default;

    Graph(const Graph &other) {
        std::unordered_map<const Node *, Node *> twin;
        nodes_.reserve(other.nodes_.size());
        for (const Node *n : other.nodes_) {
            nodes_.push_back(new Node{n->name, {}});
            twin[n] = nodes_.back();
        }
        for (const Node *n : other.nodes_) {
            for (const Node *target : n->out) {
                twin.at(n)->out.push_back(twin.at(target));
            }
        }
    }

    Graph &operator=(const Graph &other) {
        Graph copy(other);
        std::swap(nodes_, copy.nodes_);
        return *this;
    }

    ~Graph() {
        for (Node *n : nodes_) {
            delete n;
        }
    }

    void add_node(const std::string &name) {
        nodes_.push_back(new Node{name, {}});
    }

    void add_edge(const std::string &a, const std::string &b) {
        find(a)->out.push_back(find(b));
    }

    void rename(const std::string &from, const std::string &to) {
        find(from)->name = to;
    }

    void print(const std::string &title) const {
        std::println("{}:", title);
        for (const Node *n : nodes_) {
            std::string targets;
            for (const Node *t : n->out) {
                targets += (targets.empty() ? "" : " ") + t->name;
            }
            std::println("{} → {}", n->name, targets.empty() ? "—" : targets);
        }
    }

private:
    Node *find(const std::string &name) const {
        for (Node *n : nodes_) {
            if (n->name == name) {
                return n;
            }
        }
        return nullptr;
    }

    std::vector<Node *> nodes_;
};

int main() {
    std::map<std::string, Graph> graphs;
    std::string command, g;
    while (std::cin >> command >> g) {
        if (command == "node") {
            std::string name;
            std::cin >> name;
            graphs[g].add_node(name);
        } else if (command == "edge") {
            std::string a, b;
            std::cin >> a >> b;
            graphs[g].add_edge(a, b);
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            graphs[g] = graphs[from];
        } else if (command == "rename") {
            std::string a, b;
            std::cin >> a >> b;
            graphs[g].rename(a, b);
        } else {
            graphs[g].print(g);
        }
    }
    return 0;
}`,
      explanation: `
Наивная рекурсия «скопировать узел и всех, на кого он указывает» не годится для графа: узел, на который ведут два ребра, скопировался бы дважды, а цикл зациклил бы копирование. Таблица соответствия решает обе проблемы: каждый старый узел получает ровно одного двойника, а рёбра переводятся по таблице во втором проходе.

Переименование проверяет глубину копии: рёбра копии ведут на её собственные узлы, поэтому новое имя видно только в ней. Если бы хоть одно ребро осталось указывать на узел оригинала, изменения смешались бы, а деструкторы двух графов удалили бы этот узел дважды.`,
      examples: [
        {
          in: 'node G a\nnode G b\nedge G a b\nedge G b a\ncopy H G\nrename H a x\nprint G\nprint H\n',
          out: 'G:\na → b\nb → a\nH:\nx → b\nb → x\n',
        },
        { in: 'node G solo\nprint G\n', out: 'G:\nsolo → —\n' },
      ],
      hidden: [
        { in: 'print E\n', name: 'Пустой граф' },
        { in: 'node G a\nedge G a a\ncopy H G\nrename H a b\nprint G\nprint H\n', name: 'Петля' },
        {
          in: 'node G a\nnode G b\nnode G c\nedge G a c\nedge G b c\ncopy H G\nrename H c d\nprint H\nprint G\n',
          name: 'Общая цель',
        },
        {
          in: 'node G a\nnode G b\nedge G a b\nedge G a b\ncopy H G\nprint H\n',
          name: 'Кратные рёбра',
        },
        { in: 'node G a\ncopy G G\nprint G\n', name: 'Копия в себя' },
        {
          in: 'node G a\nnode G b\nedge G a b\ncopy H G\nnode H c\nedge H c a\nprint G\nprint H\n',
          name: 'Расширение копии',
        },
        {
          in: 'node G a\ncopy H G\ncopy K H\nrename K a z\nprint G\nprint H\nprint K\n',
          name: 'Копия копии',
        },
        {
          in: 'node G p\nnode G q\nnode G r\nedge G p q\nedge G q r\nedge G r p\ncopy H G\nrename G q Q\nprint G\nprint H\n',
          name: 'Цикл из трёх',
        },
      ],
    },
  ],
};
