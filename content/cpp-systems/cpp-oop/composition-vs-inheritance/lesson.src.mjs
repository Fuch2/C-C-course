import { telemetryStage } from '../../projects/oop-telemetry/stages.mjs';

const SORTED = (fixed) => String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <vector>

${
  fixed
    ? `class SortedList {
public:
    void add(int x) {
        items_.insert(std::ranges::upper_bound(items_, x), x);
    }

    bool contains(int x) const {
        return std::ranges::binary_search(items_, x);
    }

    const std::vector<int> &items() const {
        return items_;
    }

private:
    std::vector<int> items_;
};`
    : `class SortedList : public std::vector<int> {
public:
    void add(int x) {
        insert(std::ranges::upper_bound(*this, x), x);
    }

    bool contains(int x) const {
        return std::ranges::binary_search(*this, x);
    }
};`
}

int main() {
    SortedList list;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            int x;
            std::cin >> x;
            list.add(x);
        } else if (command == "bulk") {
            int n;
            std::cin >> n;
            for (int i = 0; i < n; ++i) {
                int x;
                std::cin >> x;
                ${fixed ? 'list.add(x);' : 'list.push_back(x);  // быстрее, чем add'}
            }
        } else if (command == "has") {
            int x;
            std::cin >> x;
            std::println("{}", list.contains(x) ? "да" : "нет");
        } else {
            std::string line;
            for (int x : ${fixed ? 'list.items()' : 'list'}) {
                line += (line.empty() ? "" : " ") + std::to_string(x);
            }
            std::println("{}", line.empty() ? "пусто" : line);
        }
    }
    return 0;
}`;

export default {
  id: 'oop-composition-vs-inheritance',
  title: 'Композиция или наследование',
  description:
    'Как выбирать между «является» и «содержит»: проверка подстановкой, наследование ради повторного использования кода и почему стандартные контейнеры не наследуют, взрыв комбинаций в иерархиях, стратегия и сборка поведения во время работы, таблица выбора между наследованием, композицией, variant и шаблонами. Третий, завершающий этап проекта «Система обработки датчиков».',
  moduleId: 'cpp-oop',
  order: 28,
  difficulty: 'advanced',
  estimatedMinutes: 70,
  prerequisites: ['oop-solid'],
  objectives: [
    'Различать связи «является», «содержит» и «пользуется»',
    'Заменять наследование ради кода композицией и делегированием',
    'Собирать поведение из независимых частей во время работы',
    'Завершить проект системы обработки датчиков',
  ],
  tags: ['C++23', 'ООП', 'Композиция', 'Наследование', 'Стратегия', 'Проект'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Когда открытое наследование уместно?',
      options: [
        'Объект наследника можно передать везде, где ждут базу, и он выполнит все её обещания',
        'Наследнику нужны некоторые методы базы',
        'У классов похожие названия',
        'Так короче писать',
      ],
      correct: 0,
      explain:
        'Наследование выражает подстановку. Для переиспользования части методов — композиция и делегирование.',
    },
    {
      q: 'Что плохого в class Stack : public std::vector<int>? Выберите все.',
      options: [
        'Открыты все методы вектора, и через них можно нарушить порядок стека',
        'У std::vector нет виртуального деструктора',
        'Это не скомпилируется',
        'Stack станет медленнее при каждом push',
      ],
      correct: [0, 1],
      explain:
        'Код скомпилируется и будет работать — вот только инвариант стека больше никто не охраняет.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <functional>
#include <print>
#include <vector>

int main() {
    std::vector<std::function<int(int)>> steps{[](int x) { return x * 3; }, [](int x) { return x - 1; }};
    int a = 2, b = 2;
    for (const auto &s : steps) {
        a = s(a);
    }
    for (auto it = steps.rbegin(); it != steps.rend(); ++it) {
        b = (*it)(b);
    }
    std::println("{} {}", a, b);
    return 0;
}`,
      lang: 'cpp',
      answers: ['5 3'],
      placeholder: 'Вывод программы',
      explain:
        '2 · 3 − 1 = 5, а в обратном порядке (2 − 1) · 3 = 3. Порядок шагов композиции — часть договора.',
    },
    {
      q: 'Объект различается по трём независимым признакам, у каждого по 3 варианта. Сколько классов нужно иерархии «на каждую комбинацию» и композиции частей?',
      options: ['27 и 9', '9 и 27', '9 и 9', '27 и 27'],
      correct: 0,
      explain: '3 · 3 · 3 = 27 комбинаций против 3 + 3 + 3 = 9 частей.',
    },
    {
      q: 'Как называется приём, когда объект хранит подменяемое поведение в поле (интерфейс или std::function)?',
      options: ['Стратегия', 'Срезка', 'Агрегатная инициализация', 'Специализация'],
      correct: 0,
      explain:
        'Стратегию можно заменить во время работы, в отличие от поведения, выбранного наследованием.',
    },
    {
      q: 'Какая связь у TelemetryProcessor с Filter в проекте?',
      options: [
        'Композиция: фильтр — поле по значению',
        'Наследование: процессор — это фильтр',
        'Агрегация через ссылку на чужой фильтр',
        'Никакой',
      ],
      correct: 0,
      explain: 'Процессор содержит фильтр и делегирует ему проверку.',
    },
    {
      q: 'Какое наследование обычно наименее хрупко?',
      options: [
        'От интерфейса без данных и реализаций',
        'Глубокая иерархия с полями на каждом уровне',
        'От стандартного контейнера',
        'Защищённое наследование ради кода',
      ],
      correct: 0,
      explain:
        'Изменение базы с данными и кодом может сломать наследников, о которых её автор не знает.',
    },
    {
      q: 'Как называется передача вызова внутреннему объекту: Stack::push вызывает items_.push_back?',
      answers: ['делегирование', 'делегация'],
      placeholder: 'Одно слово',
      explain: 'Композиция и делегирование вместе заменяют наследование ради кода.',
    },
  ],
  exercises: [
    {
      id: 'oop-composition-vs-inheritance-exercise',
      title: 'Стек с ограничением',
      difficulty: 'intermediate',
      description: `
Класс \`BoundedStack\` хранит целые числа в закрытом поле \`std::vector<int>\` и не больше заданного числа элементов. Открытые операции — только такие:

- \`explicit BoundedStack(std::size_t capacity)\`;
- \`bool push(int x)\` — \`false\`, если стек полон;
- \`std::optional<int> pop()\` и \`std::optional<int> top() const\` — пусто, если элементов нет;
- \`std::size_t size() const\`.

Первая строка ввода — ёмкость, дальше команды \`push x\`, \`pop\`, \`top\`, \`size\`. На \`push\` при переполнении напечатайте \`переполнение\` (иначе ничего), на \`pop\` и \`top\` — число или \`пусто\`, на \`size\` — размер.`,
      constraints: ['0 ≤ ёмкость ≤ 1000; команд не больше 2000.'],
      hints: [
        'Не наследуйте std::vector: стек открывает только четыре операции, а вектор хранится полем items_.',
        'Печать optional: if (auto v = s.pop()) std::println("{}", *v); else std::println("пусто");',
      ],
      solution: String.raw`
#include <iostream>
#include <optional>
#include <print>
#include <string>
#include <vector>

class BoundedStack {
public:
    explicit BoundedStack(std::size_t capacity) : capacity_(capacity) {}

    bool push(int x) {
        if (items_.size() == capacity_) {
            return false;
        }
        items_.push_back(x);
        return true;
    }

    std::optional<int> pop() {
        if (items_.empty()) {
            return std::nullopt;
        }
        const int x = items_.back();
        items_.pop_back();
        return x;
    }

    std::optional<int> top() const {
        if (items_.empty()) {
            return std::nullopt;
        }
        return items_.back();
    }

    std::size_t size() const {
        return items_.size();
    }

private:
    std::size_t capacity_;
    std::vector<int> items_;
};

void print(std::optional<int> value) {
    if (value) {
        std::println("{}", *value);
    } else {
        std::println("пусто");
    }
}

int main() {
    std::size_t capacity;
    std::cin >> capacity;
    BoundedStack stack(capacity);
    std::string command;
    while (std::cin >> command) {
        if (command == "push") {
            int x;
            std::cin >> x;
            if (!stack.push(x)) {
                std::println("переполнение");
            }
        } else if (command == "pop") {
            print(stack.pop());
        } else if (command == "top") {
            print(stack.top());
        } else {
            std::println("{}", stack.size());
        }
    }
    return 0;
}`,
      explanation: `
Стек содержит вектор и делегирует ему хранение, но открывает только операции стека. Инвариант «не больше \`capacity\` элементов и доступ только к вершине» охраняют четыре метода — других путей к данным нет. Унаследуй стек от вектора, и \`push_back\` или \`insert\` обошли бы ограничение.

\`std::optional\` делает пустой стек частью типа: вызывающий не может забыть проверить результат \`pop\`, как забыл бы проверить специальное значение вроде −1.`,
      examples: [
        {
          in: '2\npush 1\npush 2\npush 3\ntop\npop\npop\npop\nsize\n',
          out: 'переполнение\n2\n2\n1\nпусто\n0\n',
        },
        { in: '0\npush 5\nsize\n', out: 'переполнение\n0\n' },
      ],
      hidden: [
        { in: '5\n', name: 'Без команд' },
        { in: '3\npop\ntop\n', name: 'Пустой стек' },
        { in: '1\npush -7\ntop\npush 8\npop\npush 9\ntop\n', name: 'Ёмкость 1' },
        {
          in: '3\npush 1\npush 2\nsize\npop\nsize\npush 3\npush 4\npush 5\nsize\n',
          name: 'Повторное заполнение',
        },
        { in: '2\npush 2147483647\npush -2147483648\npop\npop\n', name: 'Крайние значения int' },
        {
          in: '4\npush 1\npush 2\npush 3\npush 4\npush 5\npop\npop\npop\npop\npop\n',
          name: 'Переполнение и опустошение',
        },
        { in: '10\ntop\npush 0\ntop\nsize\n', name: 'Ноль в стеке' },
        { in: '0\npop\ntop\nsize\n', name: 'Нулевая ёмкость' },
      ],
    },
    {
      title: 'Конвейер',
      description: `
Класс \`Pipeline\` хранит шаги обработки \`std::vector<std::function<long long(long long)>>\` и применяет их по порядку в \`long long run(long long x) const\`. Команды:

- \`add k\` — шаг «x + k»;
- \`mul k\` — шаг «x · k»;
- \`clamp lo hi\` — шаг «ограничить отрезком [lo, hi]»;
- \`abs\` — шаг «модуль»;
- \`reset\` — удалить все шаги;
- \`run x\` — напечатать \`x → результат\`.

Шаги добавляются к концу конвейера и действуют на все последующие \`run\`.`,
      constraints: [
        'Команд не больше 100; |k|, |x|, |lo|, |hi| ≤ 10⁶, lo ≤ hi; все промежуточные значения помещаются в long long.',
      ],
      hints: [
        'Лямбда захватывает параметр шага по значению: [k](long long x) { return x + k; }. Для clamp — std::clamp(x, lo, hi).',
        'Метод добавления может возвращать *this, чтобы шаги цеплялись: p.then(…).then(…).',
      ],
      solution: String.raw`
#include <algorithm>
#include <functional>
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Pipeline {
public:
    Pipeline &then(std::function<long long(long long)> step) {
        steps_.push_back(std::move(step));
        return *this;
    }

    void reset() {
        steps_.clear();
    }

    long long run(long long x) const {
        for (const auto &step : steps_) {
            x = step(x);
        }
        return x;
    }

private:
    std::vector<std::function<long long(long long)>> steps_;
};

int main() {
    Pipeline pipeline;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            long long k;
            std::cin >> k;
            pipeline.then([k](long long x) { return x + k; });
        } else if (command == "mul") {
            long long k;
            std::cin >> k;
            pipeline.then([k](long long x) { return x * k; });
        } else if (command == "clamp") {
            long long lo, hi;
            std::cin >> lo >> hi;
            pipeline.then([lo, hi](long long x) { return std::clamp(x, lo, hi); });
        } else if (command == "abs") {
            pipeline.then([](long long x) { return x < 0 ? -x : x; });
        } else if (command == "reset") {
            pipeline.reset();
        } else {
            long long x;
            std::cin >> x;
            std::println("{} → {}", x, pipeline.run(x));
        }
    }
    return 0;
}`,
      explanation: `
Конвейер не знает, какие шаги в нём лежат: он содержит функции и вызывает их по очереди. Поведение собирается во время работы из любых шагов в любом порядке. Иерархия «конвейер со сложением и ограничением», «конвейер с умножением и модулем»… потребовала бы класс на каждую комбинацию.

Лямбды захватывают параметры шага по значению: после выхода из ветки \`if\` переменные \`k\`, \`lo\`, \`hi\` исчезают, а их копии живут внутри шагов.`,
      examples: [
        { in: 'add 2\nclamp 0 10\nrun 4\nrun 20\nrun -5\n', out: '4 → 6\n20 → 10\n-5 → 0\n' },
        { in: 'run 7\nmul -3\nabs\nrun 7\nreset\nrun 7\n', out: '7 → 7\n7 → 21\n7 → 7\n' },
      ],
      hidden: [
        { in: '', name: 'Без команд' },
        { in: 'abs\nrun -1000000\nrun 0\n', name: 'Модуль' },
        { in: 'clamp 0 10\nadd 2\nrun 20\n', name: 'Обратный порядок шагов' },
        { in: 'mul 1000000\nmul 1000000\nrun 1000000\n', name: 'Большие значения' },
        { in: 'add 1\nrun 1\nadd 1\nrun 1\nadd 1\nrun 1\n', name: 'Шаги между запусками' },
        { in: 'mul 0\nadd 5\nrun 123\n', name: 'Умножение на ноль' },
        { in: 'clamp -5 -5\nrun 100\nreset\nrun 100\n', name: 'Точечный отрезок и сброс' },
        { in: 'add -10\nabs\nmul 2\nclamp 0 15\nrun 3\nrun 20\nrun 10\n', name: 'Четыре шага' },
      ],
    },
    {
      title: 'Найди ошибку: наследование ради кода',
      bug: true,
      description: `
\`SortedList\` хранит числа по возрастанию и ищет их двоичным поиском. Команды: \`add x\` — добавить число, \`bulk n a₁ … aₙ\` — добавить n чисел, \`has x\` — напечатать \`да\` или \`нет\`, \`print\` — напечатать элементы через пробел (или \`пусто\`).

Список унаследован от \`std::vector<int>\`, и после \`bulk\` поиск отвечает неверно, а печать показывает неотсортированные числа. Исправьте класс так, чтобы нарушить порядок снаружи было **невозможно**.`,
      constraints: ['Чисел не больше 1000; |x| ≤ 10⁹.'],
      hints: [
        'Какой метод вызывается в ветке bulk и откуда он у SortedList?',
        'Храните вектор закрытым полем, откройте add, contains и константный доступ к элементам. После этого компилятор сам укажет на строку с push_back.',
      ],
      starter: SORTED(false),
      solution: SORTED(true),
      explanation: `
\`SortedList\` унаследовал от вектора \`push_back\`, и ветка \`bulk\` им воспользовалась — «так быстрее». Числа легли в конец без сортировки, и \`std::ranges::binary_search\`, рассчитанный на упорядоченные данные, стал ошибаться. Класс не охранял свой инвариант: любой открытый метод вектора мог его нарушить.

С композицией вектор закрыт, а снаружи доступны только \`add\`, \`contains\` и константная ссылка на элементы. Ошибочная строка с \`push_back\` больше не компилируется — инвариант защищает компилятор, а не внимательность программиста.`,
      examples: [
        { in: 'add 5\nbulk 3 9 1 7\nhas 1\nprint\n', out: 'да\n1 5 7 9\n' },
        { in: 'print\nhas 0\n', out: 'пусто\nнет\n' },
      ],
      hidden: [
        'bulk 4 4 3 2 1\nprint\nhas 4\nhas 1\n',
        'add 3\nadd 1\nadd 2\nprint\n',
        'bulk 2 10 -10\nhas -10\n',
        'bulk 0\nprint\n',
        'add 1\nbulk 3 1 1 0\nprint\nhas 0\n',
        'bulk 5 5 4 3 2 1\nadd 6\nprint\n',
        'bulk 3 -1000000000 1000000000 0\nhas 1000000000\nprint\n',
        'add 8\nhas 8\nhas 9\n',
      ],
    },
    telemetryStage,
  ],
};
