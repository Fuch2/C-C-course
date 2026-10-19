const SERIES = (fixed) => String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Series {
public:
    Series(std::string name, std::size_t size) : name_(std::move(name)), size_(size), values_(new double[size]()) {}
${
  fixed
    ? `    Series(const Series &other) : name_(other.name_), size_(other.size_), values_(new double[other.size_]) {
        std::copy_n(other.values_, size_, values_);
    }
    Series &operator=(const Series &other) {
        Series copy(other);
        std::swap(name_, copy.name_);
        std::swap(size_, copy.size_);
        std::swap(values_, copy.values_);
        return *this;
    }
`
    : ''
}    ~Series() {
        delete[] values_;
    }

    void set(std::size_t i, double v) {
        values_[i] = v;
    }

    const std::string &name() const {
        return name_;
    }

    double mean() const {
        double sum = 0;
        for (std::size_t i = 0; i < size_; ++i) {
            sum += values_[i];
        }
        return size_ ? sum / static_cast<double>(size_) : 0;
    }

private:
    std::string name_;
    std::size_t size_;
    double *values_;
};

int main() {
    std::vector<Series> all;
    std::string command, name;
    while (std::cin >> command >> name) {
        if (command == "series") {
            std::size_t n;
            std::cin >> n;
            Series s(name, n);
            for (std::size_t i = 0; i < n; ++i) {
                double v;
                std::cin >> v;
                s.set(i, v);
            }
            all.push_back(s);
        } else {
            for (const Series &s : all) {
                if (s.name() == name) {
                    std::println("{}: {:.2f}", name, s.mean());
                }
            }
        }
    }
    return 0;
}`;

export default {
  id: 'lifetime-rule-of-three',
  title: 'Правило трёх',
  description:
    'Деструктор, конструктор копирования и копирующее присваивание пишут вместе: причина у них одна — класс сам управляет ресурсом. Что ломается при неполном наборе; устаревшее неявное копирование при пользовательском деструкторе и предупреждения компиляторов; полный класс строки по правилу трёх; запрет копирования как выполнение правила; путь к правилам пяти и нуля.',
  moduleId: 'cpp-lifetime',
  order: 10,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-deep-copy'],
  objectives: [
    'Объяснять, почему три специальные функции связаны',
    'Предсказывать последствия неполного набора',
    'Писать класс-владелец по правилу трёх',
    'Выбирать между реализацией и запретом копирования',
  ],
  tags: ['C++23', 'Время жизни', 'Правило трёх', 'Копирование', 'Деструкторы'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие функции входят в правило трёх? Выберите все.',
      options: [
        'Деструктор',
        'Конструктор копирования',
        'Оператор копирующего присваивания',
        'Конструктор по умолчанию',
      ],
      correct: [0, 1, 2],
      explain: 'Конструктор по умолчанию к ресурсной тройке не относится.',
    },
    {
      q: 'Почему эти функции связаны?',
      options: [
        'Все три нужны по одной причине: класс сам управляет ресурсом',
        'Компилятор не создаёт их по отдельности',
        'Так требует синтаксис',
        'Они не связаны',
      ],
      correct: 0,
      explain: 'Ресурс нужно освобождать, копировать при создании и заменять при присваивании.',
    },
    {
      q: 'В классе есть только деструктор с delete[]. Что произойдёт после v.push_back(obj) и выхода obj из области видимости?',
      options: [
        'Элемент вектора укажет на освобождённую память, в конце — двойное освобождение',
        'Всё корректно',
        'Ошибка компиляции',
        'Утечка',
      ],
      correct: 0,
      explain: 'push_back сделал поверхностную копию.',
    },
    {
      q: 'Класс владеет ресурсом, копия которого не имеет смысла. Как выполнить правило трёх?',
      options: [
        'Запретить копирование: конструктор и присваивание = delete; деструктор освобождает',
        'Не писать ничего',
        'Написать только деструктор',
        'Сделать конструктор копирования пустым',
      ],
      correct: 0,
      explain: 'Ответ «копировать нельзя» — тоже полный ответ.',
    },
    {
      q: 'Что изменилось в C++11 для класса с пользовательским деструктором?',
      options: [
        'Неявное создание копирования для него объявлено устаревшим',
        'Копирование стало запрещено',
        'Деструктор стал виртуальным',
        'Ничего',
      ],
      correct: 0,
      explain: 'Компиляторы предупреждают: -Wdeprecated-copy-dtor, -Wdeprecated-copy.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct T {
    T() { std::print("c"); }
    T(const T &) { std::print("C"); }
    T &operator=(const T &) { std::print("="); return *this; }
    ~T() { std::print("d"); }
};

int main() {
    T a;
    T b = a;
    b = a;
    return 0;
}`,
      lang: 'cpp',
      answers: ['cC=dd'],
      placeholder: 'Вывод программы',
      explain: 'Создание a, копия b, присваивание, затем два деструктора.',
    },
    {
      q: 'Классу Report { std::string title; std::vector<int> data; } нужны свои деструктор и копирование?',
      options: [
        'Нет: поля сами управляют ресурсами',
        'Да, все три',
        'Только деструктор',
        'Только копирование',
      ],
      correct: 0,
      explain: 'Это правило нуля — тема отдельного урока.',
    },
    {
      q: 'Назовите правило, которое добавляет к правилу трёх перемещающий конструктор и перемещающее присваивание: правило …',
      answers: ['пяти', 'правило пяти', 'five', 'rule of five'],
      placeholder: 'Одно слово',
      explain: 'Перемещение позволяет передавать ресурс без копирования.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-rule-of-three-exercise',
      title: 'Стек на массиве',
      difficulty: 'intermediate',
      description: `
Класс \`IntStack\` хранит элементы в массиве \`int\`, выделенном \`new[]\`; когда места нет, массив заменяется вдвое большим (начальная ёмкость — 4). Реализуйте всё по правилу трёх: деструктор, глубокий конструктор копирования и присваивание.

Стеки хранятся в \`std::map<std::string, IntStack>\` (\`operator[]\` создаёт пустой). Команды:

- \`push S x\`;
- \`pop S\` — напечатать снятое значение или \`S: пусто\`;
- \`copy T S\` — T становится копией S;
- \`size S\` — \`S: размер N\`.`,
      constraints: ['Команд не больше 2000; значения помещаются в int.'],
      hints: [
        'При росте: выделить новый массив, скопировать size_ элементов, delete[] старый, заменить указатель и ёмкость.',
        'Копия может выделить ровно capacity_ элементов оригинала (или size_, если он больше нуля) — главное, чтобы буфер был свой.',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

class IntStack {
public:
    IntStack() = default;
    IntStack(const IntStack &other)
        : size_(other.size_), capacity_(other.capacity_), data_(other.capacity_ ? new int[other.capacity_] : nullptr) {
        std::copy_n(other.data_, size_, data_);
    }
    IntStack &operator=(const IntStack &other) {
        IntStack copy(other);
        std::swap(size_, copy.size_);
        std::swap(capacity_, copy.capacity_);
        std::swap(data_, copy.data_);
        return *this;
    }
    ~IntStack() {
        delete[] data_;
    }

    void push(int x) {
        if (size_ == capacity_) {
            const std::size_t bigger = capacity_ ? capacity_ * 2 : 4;
            int *fresh = new int[bigger];
            std::copy_n(data_, size_, fresh);
            delete[] data_;
            data_ = fresh;
            capacity_ = bigger;
        }
        data_[size_++] = x;
    }

    bool empty() const {
        return size_ == 0;
    }

    int pop() {
        return data_[--size_];
    }

    std::size_t size() const {
        return size_;
    }

private:
    std::size_t size_ = 0;
    std::size_t capacity_ = 0;
    int *data_ = nullptr;
};

int main() {
    std::map<std::string, IntStack> stacks;
    std::string command, s;
    while (std::cin >> command >> s) {
        if (command == "push") {
            int x;
            std::cin >> x;
            stacks[s].push(x);
        } else if (command == "pop") {
            IntStack &st = stacks[s];
            if (st.empty()) {
                std::println("{}: пусто", s);
            } else {
                std::println("{}", st.pop());
            }
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            stacks[s] = stacks[from];
        } else {
            std::println("{}: размер {}", s, stacks[s].size());
        }
    }
    return 0;
}`,
      explanation: `
Стек владеет массивом, поэтому ему нужны все три функции. Деструктор освобождает массив, конструктор копирования создаёт свой, присваивание выражено через конструктор копирования и обмен — так логика копирования написана один раз. Копия пустого стека не выделяет память: \`nullptr\` и нулевая ёмкость.

Рост массива — та же схема «сначала новое, потом удалить старое», что и в copy-and-swap: если \`new\` бросит, стек останется прежним.`,
      examples: [
        {
          in: 'push A 1\npush A 2\ncopy B A\npush B 3\npop A\npop B\nsize A\nsize B\n',
          out: '2\n3\nA: размер 1\nB: размер 2\n',
        },
        { in: 'pop X\nsize X\n', out: 'X: пусто\nX: размер 0\n' },
      ],
      hidden: [
        {
          in: 'push A 1\npush A 2\npush A 3\npush A 4\npush A 5\npush A 6\npop A\npop A\npop A\npop A\npop A\npop A\npop A\n',
          name: 'Рост массива',
        },
        { in: 'push A 1\ncopy A A\npop A\npop A\n', name: 'Копия в себя' },
        { in: 'copy B A\npush B 5\nsize A\nsize B\n', name: 'Копия пустого' },
        { in: 'push A 7\ncopy B A\ncopy C B\npop C\npop B\npop A\n', name: 'Цепочка копий' },
        { in: 'push A -2147483648\npush A 2147483647\npop A\npop A\n', name: 'Крайние значения' },
        {
          in: 'push A 1\npush B 9\npush B 8\ncopy B A\npop B\npop B\n',
          name: 'Присваивание поверх непустого',
        },
        {
          in: 'push A 1\npush A 2\npush A 3\npush A 4\npush A 5\ncopy B A\npush B 6\nsize B\npop B\n',
          name: 'Копия после роста',
        },
        { in: 'size A\npush A 0\nsize A\npop A\nsize A\n', name: 'Ноль в стеке' },
      ],
    },
    {
      title: 'Кто вызван?',
      description: `
Структура \`Tracked\` хранит строку \`v\` и печатает каждое событие своей жизни: конструктор — \`+v\`, конструктор копирования — \`копия v\`, копирующее присваивание — \`присваивание старое ← новое\`, деструктор — \`-v\`.

Объекты хранятся в \`std::map<std::string, Tracked>\`. Выполняйте команды **ровно так**:

- \`new X v\` — если X нет: \`try_emplace(X, v)\`; если есть: \`objects.at(X) = Tracked(v)\`;
- \`copy Y X\` — если Y нет: \`try_emplace(Y, objects.at(X))\`; если есть: \`objects.at(Y) = objects.at(X)\`;
- \`drop X\` — \`erase(X)\`.

В конце удаляйте оставшиеся объекты по одному, начиная с последнего по имени.`,
      constraints: ['Команд не больше 100; copy и drop ссылаются на существующие объекты.'],
      hints: [
        'Присваивание печатает до изменения: std::println("присваивание {} ← {}", v, other.v); v = other.v;',
        'Удаление с конца: while (!objects.empty()) objects.erase(std::prev(objects.end()));',
      ],
      solution: String.raw`
#include <iostream>
#include <iterator>
#include <map>
#include <print>
#include <string>
#include <utility>

struct Tracked {
    std::string v;

    explicit Tracked(std::string value) : v(std::move(value)) {
        std::println("+{}", v);
    }
    Tracked(const Tracked &other) : v(other.v) {
        std::println("копия {}", v);
    }
    Tracked &operator=(const Tracked &other) {
        std::println("присваивание {} ← {}", v, other.v);
        v = other.v;
        return *this;
    }
    ~Tracked() {
        std::println("-{}", v);
    }
};

int main() {
    std::map<std::string, Tracked> objects;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "new") {
            std::string v;
            std::cin >> v;
            if (objects.contains(x)) {
                objects.at(x) = Tracked(v);
            } else {
                objects.try_emplace(x, v);
            }
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            if (objects.contains(x)) {
                objects.at(x) = objects.at(from);
            } else {
                objects.try_emplace(x, objects.at(from));
            }
        } else {
            objects.erase(x);
        }
    }
    while (!objects.empty()) {
        objects.erase(std::prev(objects.end()));
    }
    return 0;
}`,
      explanation: `
Каждая операция вызывает свою специальную функцию. Новый объект на месте (\`try_emplace\` с аргументами конструктора) — обычный конструктор, без копий. Новый объект из существующего — конструктор копирования. Существующий объект из другого — присваивание. Присваивание временного \`Tracked(v)\` порождает три события: создание временного, присваивание и уничтожение временного на точке с запятой.

Перемещающих операций у \`Tracked\` нет: пользовательский конструктор копирования и деструктор подавляют их. Поэтому даже временное значение присваивается копированием — это исправит правило пяти.`,
      examples: [
        {
          in: 'new a 1\ncopy b a\nnew a 2\ncopy b a\ndrop a\n',
          out: '+1\nкопия 1\n+2\nприсваивание 1 ← 2\n-2\nприсваивание 1 ← 2\n-2\n-2\n',
        },
        { in: 'new x q\n', out: '+q\n-q\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'new a 1\nnew b 2\nnew c 3\n', name: 'Порядок удаления в конце' },
        { in: 'new a 1\ncopy a a\n', name: 'Самоприсваивание' },
        { in: 'new a 1\ncopy b a\ncopy c b\ndrop b\n', name: 'Цепочка копий' },
        { in: 'new a 1\nnew a 2\nnew a 3\n', name: 'Многократное присваивание' },
        { in: 'new a x\ndrop a\nnew a y\n', name: 'Повторное создание' },
        { in: 'new z 1\nnew a 2\ncopy z a\n', name: 'Присваивание по имени' },
        { in: 'new a 1\ncopy b a\ncopy a b\ndrop a\ndrop b\n', name: 'Всё удалено вручную' },
      ],
    },
    {
      title: 'Найди ошибку: один деструктор',
      bug: true,
      description: `
Программа хранит ряды измерений. Команда \`series имя n v₁ … vₙ\` создаёт ряд и добавляет его в вектор; \`mean имя\` печатает \`имя: среднее\` с двумя знаками после точки (среднее пустого ряда — 0).

С первым же рядом что-то идёт не так: AddressSanitizer сообщает об ошибке. Найдите причину и исправьте класс \`Series\`, не меняя \`main\`.`,
      constraints: ['Рядов не больше 30; n от 0 до 100.'],
      hints: [
        'Что делает all.push_back(s) с объектом s и что происходит с s в конце итерации?',
        'Деструктор в классе есть, а копирования нет. Добавьте глубокий конструктор копирования и присваивание по правилу трёх.',
      ],
      starter: SERIES(false),
      solution: SERIES(true),
      explanation: `
\`all.push_back(s)\` копирует ряд неявным, поверхностным конструктором копирования: элемент вектора получает тот же указатель \`values_\`. В конце итерации \`s\` уничтожается и освобождает массив, а элемент вектора продолжает на него указывать. Следующее обращение — \`heap-use-after-free\`, а при росте вектора и в конце программы — повторные освобождения.

Класс с собственным деструктором нуждается и в собственном копировании: это правило трёх. Ещё лучше было бы хранить значения в \`std::vector<double>\` — тогда не нужна ни одна из трёх функций.`,
      examples: [
        { in: 'series t 3 1 2 3\nmean t\n', out: 't: 2.00\n' },
        { in: 'series a 2 1 2\nseries b 1 10\nmean a\nmean b\n', out: 'a: 1.50\nb: 10.00\n' },
      ],
      hidden: [
        'series z 0\nmean z\n',
        'series a 1 5\nseries a 1 7\nmean a\n',
        'series x 4 -1 -2 -3 -4\nmean x\n',
        'series p 2 0.25 0.75\nmean p\n',
        'series a 1 1\nseries b 1 2\nseries c 1 3\nseries d 1 4\nseries e 1 5\nmean c\n',
        'series big 3 1000000 2000000 3000000\nmean big\n',
        'mean none\n',
        'series q 5 1 1 1 1 6\nmean q\n',
      ],
    },
    {
      title: 'Кольцевой буфер',
      difficulty: 'advanced',
      description: `
Кольцевой буфер фиксированной ёмкости хранит последние значения: когда он полон, новое значение вытесняет самое старое. Класс \`Ring\` хранит массив \`new int[capacity]\`, индекс самого старого элемента и число элементов; реализуйте его по правилу трёх.

Буферы хранятся в \`std::map<std::string, Ring>\`. Команды:

- \`make X c\` — создать (пересоздать) пустой буфер ёмкости c через \`insert_or_assign\`;
- \`push X v\` — добавить; если буфер был полон, напечатать \`X: вытеснено старое\`;
- \`pop X\` — удалить самый старый и напечатать его, или \`X: пусто\`;
- \`copy Y X\` — Y становится копией X;
- \`print X\` — \`X: элементы от старых к новым\` или \`X: пусто\`.`,
      constraints: [
        'Команд не больше 500; 1 ≤ c ≤ 100; push, pop, copy и print — только для созданных буферов.',
      ],
      hints: [
        'Позиция i-го по старшинству элемента: (head_ + i) % capacity_. Добавление в неполный буфер — в позицию (head_ + size_) % capacity_.',
        'Копия должна сохранить порядок: проще всего скопировать массив целиком вместе с head_ и size_.',
      ],
      solution: String.raw`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <utility>

class Ring {
public:
    explicit Ring(std::size_t capacity) : capacity_(capacity), data_(new int[capacity]()) {}
    Ring(const Ring &other)
        : capacity_(other.capacity_), head_(other.head_), size_(other.size_), data_(new int[other.capacity_]) {
        std::copy_n(other.data_, capacity_, data_);
    }
    Ring &operator=(const Ring &other) {
        Ring copy(other);
        std::swap(capacity_, copy.capacity_);
        std::swap(head_, copy.head_);
        std::swap(size_, copy.size_);
        std::swap(data_, copy.data_);
        return *this;
    }
    ~Ring() {
        delete[] data_;
    }

    bool push(int v, int &evicted) {
        if (size_ < capacity_) {
            data_[(head_ + size_) % capacity_] = v;
            ++size_;
            return false;
        }
        evicted = data_[head_];
        data_[head_] = v;
        head_ = (head_ + 1) % capacity_;
        return true;
    }

    bool empty() const {
        return size_ == 0;
    }

    int pop() {
        const int v = data_[head_];
        head_ = (head_ + 1) % capacity_;
        --size_;
        return v;
    }

    std::string text() const {
        std::string s;
        for (std::size_t i = 0; i < size_; ++i) {
            s += (i ? " " : "") + std::to_string(data_[(head_ + i) % capacity_]);
        }
        return s.empty() ? "пусто" : s;
    }

private:
    std::size_t capacity_;
    std::size_t head_ = 0;
    std::size_t size_ = 0;
    int *data_;
};

int main() {
    std::map<std::string, Ring> rings;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "make") {
            std::size_t c;
            std::cin >> c;
            rings.insert_or_assign(x, Ring(c));
        } else if (command == "push") {
            int v, evicted = 0;
            std::cin >> v;
            if (rings.at(x).push(v, evicted)) {
                std::println("{}: вытеснено {}", x, evicted);
            }
        } else if (command == "pop") {
            Ring &r = rings.at(x);
            if (r.empty()) {
                std::println("{}: пусто", x);
            } else {
                std::println("{}", r.pop());
            }
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            rings.insert_or_assign(x, rings.at(from));
        } else {
            std::println("{}: {}", x, rings.at(x).text());
        }
    }
    return 0;
}`,
      explanation: `
Логический порядок кольцевого буфера задаётся не только массивом, но и индексом начала. Глубокая копия переносит всё состояние — массив, \`head_\` и \`size_\`, — поэтому копия продолжает вытеснять элементы в том же порядке, что и оригинал, но уже в собственном массиве.

Конструктор копирования копирует весь массив, включая ячейки, где ещё ничего не записано. Поэтому конструктор заполняет массив нулями (\`new int[capacity]()\`): копировать неинициализированные \`int\` — неопределённое поведение, даже если их потом никто не читает.`,
      examples: [
        {
          in: 'make A 3\npush A 1\npush A 2\npush A 3\npush A 4\ncopy B A\npush B 5\nprint A\nprint B\npop A\nprint A\n',
          out: 'A: вытеснено 1\nB: вытеснено 2\nA: 2 3 4\nB: 3 4 5\n2\nA: 3 4\n',
        },
        { in: 'make Z 1\npop Z\nprint Z\n', out: 'Z: пусто\nZ: пусто\n' },
      ],
      hidden: [
        { in: 'make A 1\npush A 1\npush A 2\npush A 3\nprint A\n', name: 'Ёмкость 1' },
        { in: 'make A 2\npush A 1\ncopy A A\nprint A\n', name: 'Копия в себя' },
        {
          in: 'make A 3\npush A 1\npush A 2\npop A\npush A 3\npush A 4\npush A 5\nprint A\n',
          name: 'Перенос через край',
        },
        { in: 'make A 2\npush A 1\nmake A 3\nprint A\n', name: 'Пересоздание' },
        {
          in: 'make A 4\nmake B 2\npush B 7\ncopy B A\npush B 1\npush B 2\npush B 3\npush B 4\npush B 5\nprint B\n',
          name: 'Копия меняет ёмкость',
        },
        {
          in: 'make A 3\npush A 1\npush A 2\npush A 3\npop A\npop A\npop A\npop A\n',
          name: 'Опустошение',
        },
        {
          in: 'make A 2\npush A -5\npush A 5\ncopy B A\npop B\nprint A\nprint B\n',
          name: 'Независимость копий',
        },
        {
          in: 'make A 5\npush A 1\npush A 2\npush A 3\npush A 4\npush A 5\npush A 6\npush A 7\ncopy B A\npop B\npop B\nprint B\nprint A\n',
          name: 'Копия после переноса',
        },
      ],
    },
  ],
};
