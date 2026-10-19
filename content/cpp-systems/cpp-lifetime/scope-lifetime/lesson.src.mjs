const GREETER = (fixed) => String.raw`
#include <functional>
#include <iostream>
#include <print>
#include <string>
#include <utility>

std::function<std::string(const std::string &)> make_greeter(std::string greeting) {
    return [${fixed ? 'greeting = std::move(greeting)' : '&greeting'}](const std::string &name) {
        return greeting + ", " + name + "!";
    };
}

int main() {
    std::string word;
    std::cin >> word;
    const auto greet = make_greeter(word);
    std::string name;
    while (std::cin >> name) {
        std::println("{}", greet(name));
    }
    return 0;
}`;

export default {
  id: 'lifetime-scope-lifetime',
  title: 'Область видимости и время жизни',
  description:
    'Область видимости имени и затенение; объявление в самом узком блоке; инициализаторы в if, switch и цикле for по диапазону; объекты в теле цикла создаются на каждой итерации; лямбды, переживающие свою область, захват по значению и по ссылке, висячий захват и stack-use-after-return; объекты, срабатывающие при выходе из области.',
  moduleId: 'cpp-lifetime',
  order: 2,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['lifetime-object-lifetime'],
  objectives: [
    'Различать область видимости имени и время жизни объекта',
    'Сужать область переменных инициализаторами в if и for',
    'Выбирать захват по значению для лямбд, переживающих свою область',
    'Выполнять действия при выходе из области через деструктор',
  ],
  tags: ['C++23', 'Время жизни', 'Область видимости', 'Лямбды', 'Захват'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

int main() {
    int x = 1;
    {
        int x = 2;
        x += 10;
    }
    std::println("{}", x);
    return 0;
}`,
      lang: 'cpp',
      answers: ['1'],
      placeholder: 'Вывод программы',
      explain: 'Внутренний x затеняет внешний и умирает в конце блока. Внешний не менялся.',
    },
    {
      q: 'Где видна переменная it в if (auto it = m.find(k); it != m.end()) { … } else { … }?',
      options: [
        'В условии и в обеих ветках',
        'Только в условии',
        'Только в ветке if',
        'До конца функции',
      ],
      correct: 0,
      explain: 'Инициализатор действует на весь оператор if, включая else.',
    },
    {
      q: 'Сколько раз вызовется деструктор std::string s в цикле for (int i = 0; i < 5; i++) { std::string s = "x"; }?',
      options: ['5', '1', '0', '6'],
      correct: 0,
      explain: 'Переменная в теле цикла создаётся и уничтожается на каждой итерации.',
    },
    {
      q: 'Лямбда возвращается из функции. Какой захват безопасен?',
      options: ['По значению: [x] или [x = std::move(x)]', 'По ссылке: [&x]', '[&]', 'Любой'],
      correct: 0,
      explain: 'Ссылки на локальные переменные повиснут после возврата из функции.',
    },
    {
      q: 'Что сообщит AddressSanitizer, если лямбда обращается к локальной переменной уже завершившейся функции через захват по ссылке?',
      options: ['stack-use-after-return', 'heap-buffer-overflow', 'memory leak', 'Ничего'],
      correct: 0,
      explain: 'Кадр стека функции освобождён, а ссылка указывает в него.',
    },
    {
      q: 'Зачем mutable в лямбде [value = 0]() mutable { return ++value; }?',
      options: [
        'Без него захваченные по значению копии внутри лямбды нельзя менять',
        'Чтобы захватить по ссылке',
        'Чтобы лямбду можно было копировать',
        'Он ничего не меняет',
      ],
      correct: 0,
      explain: 'operator() лямбды по умолчанию константный.',
    },
    {
      q: 'Когда захват [&] безопасен? Выберите все.',
      options: [
        'Лямбда передаётся в std::ranges::sort и вызывается немедленно',
        'Лямбда используется внутри той же функции до выхода из неё',
        'Лямбда сохраняется в поле объекта, который живёт дольше функции',
        'Лямбда возвращается из функции',
      ],
      correct: [0, 1],
      explain: 'Безопасно, пока захваченные переменные живы во время каждого вызова лямбды.',
    },
    {
      q: 'Какой флаг GCC и Clang предупреждает о затенении имён?',
      answers: ['-Wshadow', 'Wshadow'],
      placeholder: 'Флаг',
      explain: 'Он не входит в -Wall и -Wextra, его включают отдельно.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-scope-lifetime-exercise',
      title: 'Словарь',
      difficulty: 'beginner',
      description: `
Словарь \`std::map<std::string, std::string>\` и команды:

- \`set ключ значение\` — записать (перезаписать) значение, ничего не печатать;
- \`get ключ\` — напечатать \`ключ: значение\` или \`ключ: нет\`;
- \`del ключ\` — удалить и напечатать \`удалено ключ\` или \`ключ: нет\`.

Ищите ключ один раз и объявляйте итератор в инициализаторе \`if\`, чтобы он не был виден за его пределами.`,
      constraints: ['Команд не больше 200; ключи и значения — слова без пробелов.'],
      hints: [
        'if (auto it = dict.find(key); it != dict.end()) { … it->second … } else { … }',
        'Удаление по найденному итератору: dict.erase(it) — без повторного поиска.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>

int main() {
    std::map<std::string, std::string> dict;
    std::string command, key;
    while (std::cin >> command >> key) {
        if (command == "set") {
            std::string value;
            std::cin >> value;
            dict[key] = value;
        } else if (command == "get") {
            if (auto it = dict.find(key); it != dict.end()) {
                std::println("{}: {}", key, it->second);
            } else {
                std::println("{}: нет", key);
            }
        } else {
            if (auto it = dict.find(key); it != dict.end()) {
                dict.erase(it);
                std::println("удалено {}", key);
            } else {
                std::println("{}: нет", key);
            }
        }
    }
    return 0;
}`,
      explanation: `
Инициализатор в \`if\` объявляет итератор ровно там, где он нужен: в условии и в обеих ветках. В ветках \`get\` и \`del\` это два разных итератора с одинаковым именем, и ни один не виден снаружи, поэтому их нельзя перепутать или использовать после \`erase\`, когда итератор уже недействителен.`,
      examples: [
        {
          in: 'set кот cat\nget кот\nget пёс\ndel кот\nget кот\n',
          out: 'кот: cat\nпёс: нет\nудалено кот\nкот: нет\n',
        },
        { in: 'del x\n', out: 'x: нет\n' },
      ],
      hidden: [
        { in: '', name: 'Без команд' },
        { in: 'set a 1\nset a 2\nget a\n', name: 'Перезапись' },
        { in: 'set a 1\ndel a\ndel a\n', name: 'Двойное удаление' },
        { in: 'set k v\nset l w\nget l\nget k\n', name: 'Два ключа' },
        { in: 'get пусто\n', name: 'Поиск в пустом словаре' },
        { in: 'set x 1\ndel x\nset x 2\nget x\n', name: 'Запись после удаления' },
        { in: 'set A a\nget a\n', name: 'Регистр важен' },
        {
          in: 'set дом house\nset дым smoke\ndel дом\nget дым\nget дом\n',
          name: 'Удаление одного из двух',
        },
      ],
    },
    {
      title: 'Счётчики',
      description: `
Функция \`std::function<int()> make_counter(int start, int step)\` возвращает лямбду, которая при каждом вызове прибавляет \`step\` к своему значению (начиная со \`start\`) и возвращает результат. Счётчики хранятся в \`std::map<std::string, std::function<int()>>\`.

Команды:

- \`new имя start step\` — создать счётчик; если имя занято — напечатать \`имя занято\`;
- \`next имя\` — напечатать \`имя = V\` или \`имя: нет такого счётчика\`.`,
      constraints: ['Команд не больше 200; |start|, |step| ≤ 1000; значения помещаются в int.'],
      hints: [
        'Лямбда выходит из make_counter, поэтому захватывайте по значению: [value = start, step]() mutable { … }.',
        'try_emplace(name, make_counter(…)) вставляет, только если имени ещё нет, и возвращает пару, второй элемент которой — признак вставки.',
      ],
      solution: String.raw`
#include <functional>
#include <iostream>
#include <map>
#include <print>
#include <string>

std::function<int()> make_counter(int start, int step) {
    return [value = start, step]() mutable {
        value += step;
        return value;
    };
}

int main() {
    std::map<std::string, std::function<int()>> counters;
    std::string command, name;
    while (std::cin >> command >> name) {
        if (command == "new") {
            int start, step;
            std::cin >> start >> step;
            if (!counters.try_emplace(name, make_counter(start, step)).second) {
                std::println("{} занято", name);
            }
        } else if (auto it = counters.find(name); it != counters.end()) {
            std::println("{} = {}", name, it->second());
        } else {
            std::println("{}: нет такого счётчика", name);
        }
    }
    return 0;
}`,
      explanation: `
Каждая лямбда — отдельный объект с собственными копиями \`value\` и \`step\`. Они живут столько же, сколько сама лямбда в словаре, — давно после того, как \`make_counter\` вернулась. \`mutable\` разрешает менять копию \`value\` при вызове.

Захват \`[&]\` здесь был бы ошибкой: параметры \`start\` и \`step\` умирают при выходе из \`make_counter\`.`,
      examples: [
        {
          in: 'new a 10 5\nnext a\nnext a\nnew b 0 1\nnext b\nnext c\n',
          out: 'a = 15\na = 20\nb = 1\nc: нет такого счётчика\n',
        },
        { in: 'new a 1 1\nnew a 2 2\nnext a\n', out: 'a занято\na = 2\n' },
      ],
      hidden: [
        { in: '', name: 'Без команд' },
        { in: 'next x\n', name: 'Нет счётчиков' },
        { in: 'new d 0 -3\nnext d\nnext d\nnext d\n', name: 'Отрицательный шаг' },
        { in: 'new z 7 0\nnext z\nnext z\n', name: 'Нулевой шаг' },
        {
          in: 'new p 1 1\nnew q 100 100\nnext q\nnext p\nnext q\nnext p\n',
          name: 'Независимые счётчики',
        },
        { in: 'new big 1000 1000\nnext big\nnext big\nnext big\n', name: 'Большие шаги' },
        {
          in: 'new a 0 1\nnext a\nnew a 50 50\nnext a\n',
          name: 'Повторное создание не сбрасывает',
        },
        { in: 'new m -1000 1\nnext m\n', name: 'Отрицательный старт' },
      ],
    },
    {
      title: 'Найди ошибку: забытое приветствие',
      bug: true,
      description: `
Первое слово ввода — приветствие, остальные — имена. Для каждого имени программа печатает \`приветствие, имя!\`. Функция \`make_greeter\` возвращает лямбду, которая строит такую строку.

Под AddressSanitizer программа аварийно завершается при первом же вызове лямбды. Найдите и исправьте ошибку.`,
      constraints: ['Слов не больше 100.'],
      hints: [
        'Где живёт параметр greeting и когда он умирает?',
        'Перенесите строку внутрь лямбды: [greeting = std::move(greeting)].',
      ],
      starter: GREETER(false),
      solution: GREETER(true),
      explanation: `
Параметр \`greeting\`, переданный по значению, — локальная переменная \`make_greeter\`. Лямбда захватила его по ссылке, и после возврата из функции ссылка указывает в освобождённый кадр стека: \`stack-use-after-return\`.

Захват с инициализацией \`[greeting = std::move(greeting)]\` переносит строку внутрь лямбды без копирования. Теперь лямбда владеет своими данными и может жить сколько угодно.`,
      examples: [
        { in: 'Привет Ада Алан\n', out: 'Привет, Ада!\nПривет, Алан!\n' },
        { in: 'Здравствуйте Мир\n', out: 'Здравствуйте, Мир!\n' },
      ],
      hidden: [
        'Hi Bob\n',
        'Добрый-день-уважаемые-коллеги-и-друзья мир\n',
        'Ой а б в\n',
        'Hello\nWorld\n',
        'Салют Гагарин\n',
        'Привет Привет\n',
        'Хей 1 2 3 4 5\n',
        'Bonjour Мари Пьер\n',
      ],
    },
    {
      title: 'Отмена действий',
      difficulty: 'advanced',
      description: `
Класс \`ScopeGuard\` хранит \`std::function<void()>\` и вызывает её в деструкторе, если до этого не был вызван \`dismiss()\`. Копирование запрещено.

Команды:

- \`begin\` — открыть транзакцию (транзакции могут быть вложенными);
- \`do x\` — напечатать \`сделано x\` и зарегистрировать в текущей транзакции страж, печатающий \`откат x\`;
- \`commit\` — отменить срабатывание всех стражей текущей транзакции, напечатать \`подтверждено N\` (N — число действий в ней) и закрыть её;
- \`abort\` — закрыть текущую транзакцию: её стражи срабатывают в порядке, обратном регистрации.

В конце ввода все незакрытые транзакции закрываются как при \`abort\`, начиная с самой внутренней.`,
      constraints: [
        'Команд не больше 200; do, commit и abort встречаются только внутри транзакции; x — слово.',
      ],
      hints: [
        'Храните стражей в std::deque<ScopeGuard>, а транзакции — в std::deque<std::deque<ScopeGuard>>: emplace_back в deque не перемещает существующие элементы, а ScopeGuard некопируем.',
        'Порядок срабатывания задайте сами: удаляйте стражей по одному через pop_back — деструктор контейнера порядок уничтожения элементов не гарантирует.',
      ],
      solution: String.raw`
#include <deque>
#include <functional>
#include <iostream>
#include <print>
#include <string>
#include <utility>

class ScopeGuard {
public:
    explicit ScopeGuard(std::function<void()> action) : action_(std::move(action)) {}
    ScopeGuard(const ScopeGuard &) = delete;
    ScopeGuard &operator=(const ScopeGuard &) = delete;
    ~ScopeGuard() {
        if (action_) {
            action_();
        }
    }

    void dismiss() {
        action_ = nullptr;
    }

private:
    std::function<void()> action_;
};

using Transaction = std::deque<ScopeGuard>;

void abort_last(std::deque<Transaction> &transactions) {
    Transaction &t = transactions.back();
    while (!t.empty()) {
        t.pop_back();
    }
    transactions.pop_back();
}

int main() {
    std::deque<Transaction> transactions;
    std::string command;
    while (std::cin >> command) {
        if (command == "begin") {
            transactions.emplace_back();
        } else if (command == "do") {
            std::string x;
            std::cin >> x;
            std::println("сделано {}", x);
            transactions.back().emplace_back([x] { std::println("откат {}", x); });
        } else if (command == "commit") {
            Transaction &t = transactions.back();
            for (ScopeGuard &guard : t) {
                guard.dismiss();
            }
            std::println("подтверждено {}", t.size());
            transactions.pop_back();
        } else {
            abort_last(transactions);
        }
    }
    while (!transactions.empty()) {
        abort_last(transactions);
    }
    return 0;
}`,
      explanation: `
Страж связывает действие с концом жизни объекта: когда объект уничтожается, откат выполняется сам. \`commit\` «отпускает» стражей, и их уничтожение ничего не делает. Лямбда захватывает \`x\` по значению — страж переживает итерацию цикла, в которой был создан.

Этот приём — частный случай RAII, о котором следующий урок. В стандарт его пока не включили, но \`scope_exit\` есть в Library Fundamentals TS и во многих библиотеках.`,
      examples: [
        {
          in: 'begin\ndo a\ndo b\nabort\nbegin\ndo c\ncommit\n',
          out: 'сделано a\nсделано b\nоткат b\nоткат a\nсделано c\nподтверждено 1\n',
        },
        { in: 'begin\ndo x\nbegin\ndo y\n', out: 'сделано x\nсделано y\nоткат y\nоткат x\n' },
      ],
      hidden: [
        { in: 'begin\ncommit\n', name: 'Пустая транзакция' },
        {
          in: 'begin\ndo a\nbegin\ndo b\ncommit\nabort\n',
          name: 'Вложенная подтверждена, внешняя отменена',
        },
        { in: 'begin\ndo 1\ndo 2\ndo 3\ncommit\n', name: 'Три действия подтверждены' },
        { in: 'begin\ndo a\n', name: 'Незакрытая транзакция' },
        { in: 'begin\nbegin\nbegin\ndo deep\n', name: 'Глубокая вложенность' },
        { in: 'begin\ndo a\nabort\nbegin\ndo b\nabort\n', name: 'Две отмены' },
        { in: '', name: 'Без команд' },
        {
          in: 'begin\ndo p\nbegin\ndo q\nabort\ndo r\ncommit\n',
          name: 'Отмена внутри и подтверждение снаружи',
        },
      ],
    },
  ],
};
