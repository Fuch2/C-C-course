const UPPER = (fixed) => String.raw`
#include <cctype>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>
#include <print>
#include <string>

// Условная C-библиотека: результат выделен malloc, освобождать — free.
extern "C" char *c_upper(const char *s) {
    const std::size_t n = std::strlen(s);
    char *out = static_cast<char *>(std::malloc(n + 1));
    for (std::size_t i = 0; i <= n; ++i) {
        out[i] = static_cast<char>(std::toupper(static_cast<unsigned char>(s[i])));
    }
    return out;
}
${
  fixed
    ? `
struct FreeDeleter {
    void operator()(char *p) const noexcept {
        std::free(p);
    }
};
`
    : ''
}
int main() {
    std::string word;
    while (std::cin >> word) {
        const std::unique_ptr<char${fixed ? ', FreeDeleter' : ''}> upper(c_upper(word.c_str()));
        std::println("{} → {}", word, upper.get());
    }
    return 0;
}`;

const DEVICE_API = String.raw`struct Device {
    int id;
    char name[32];
};

// Условная C-библиотека устройств.
extern "C" Device *device_open(const char *name) {
    static int next = 1;
    if (std::strchr(name, ':') == nullptr) {
        return nullptr;
    }
    auto *d = static_cast<Device *>(std::malloc(sizeof(Device)));
    d->id = next++;
    std::snprintf(d->name, sizeof d->name, "%s", name);
    std::println("открыто #{} {}", d->id, d->name);
    return d;
}

extern "C" int device_read(const Device *d) {
    return d->id * 10;
}

extern "C" void device_close(Device *d) {
    std::println("закрыто #{}", d->id);
    std::free(d);
}`;

export default {
  id: 'lifetime-custom-deleters',
  title: 'Пользовательские функции освобождения',
  description:
    'Ресурсы C-библиотек освобождаются своими функциями: free, fclose, xxx_destroy. Функция освобождения unique_ptr как часть типа — пустая структура, лямбда в decltype, указатель на функцию, структура с состоянием, и их цена; почему не брать адреса функций стандартной библиотеки; std::out_ptr и std::inout_ptr (C++23) для выходных параметров; функция освобождения shared_ptr в блоке управления; несовпадение способов выделения и освобождения.',
  moduleId: 'cpp-lifetime',
  order: 24,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-cyclic-references'],
  objectives: [
    'Оборачивать ресурсы C-библиотек в unique_ptr с функцией освобождения',
    'Выбирать тип функции освобождения без лишних накладных расходов',
    'Связывать выходные параметры C-функций с умными указателями через std::out_ptr',
    'Писать функции освобождения с состоянием',
  ],
  tags: ['C++23', 'Время жизни', 'unique_ptr', 'shared_ptr', 'out_ptr', 'C API'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Чем освобождать память, выделенную malloc?',
      options: ['free', 'delete', 'delete[]', 'Любым из трёх'],
      correct: 0,
      explain:
        'Способы выделения и освобождения должны совпадать; иначе — неопределённое поведение.',
    },
    {
      q: 'Что верно про функцию освобождения std::unique_ptr? Выберите все.',
      options: [
        'Она часть типа unique_ptr',
        'Пустая структура с operator() не увеличивает размер',
        'Указатель на функцию увеличивает размер до двух указателей',
        'Её можно поменять у существующего объекта на другой тип',
      ],
      correct: [0, 1, 2],
      explain: 'Тип функции освобождения фиксирован в типе указателя.',
    },
    {
      q: 'Почему не стоит писать std::unique_ptr<FILE, decltype(&std::fclose)>?',
      options: [
        'Стандарт не разрешает брать адреса функций стандартной библиотеки, и указатель на функцию увеличивает размер',
        'fclose нельзя вызывать из деструктора',
        'FILE нельзя хранить в unique_ptr',
        'Это ошибка компиляции во всех компиляторах',
      ],
      correct: 0,
      explain: 'Оборачивайте вызов в собственную структуру с operator().',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>

struct Noisy {
    void operator()(int *p) const {
        std::print("[{}]", *p);
        delete p;
    }
};

int main() {
    std::unique_ptr<int, Noisy> a(new int(1));
    std::unique_ptr<int, Noisy> b(new int(2));
    a = std::move(b);
    std::print("|");
    return 0;
}`,
      lang: 'cpp',
      answers: ['[1]|[2]'],
      placeholder: 'Вывод программы',
      explain:
        'Присваивание освобождает старый объект a через Noisy; в конце освобождается объект, который теперь у a.',
    },
    {
      q: 'Где хранится функция освобождения std::shared_ptr?',
      options: [
        'В блоке управления — тип shared_ptr от неё не зависит',
        'В типе shared_ptr',
        'В самом объекте',
        'Нигде — shared_ptr всегда вызывает delete',
      ],
      correct: 0,
      explain:
        'Поэтому shared_ptr с разными функциями освобождения можно хранить в одном контейнере.',
    },
    {
      q: 'Для чего нужен std::out_ptr (C++23)?',
      options: [
        'Чтобы передать умный указатель в C-функцию, возвращающую ресурс через параметр T **',
        'Чтобы вывести указатель в поток',
        'Чтобы освободить ресурс досрочно',
        'Чтобы преобразовать shared_ptr в unique_ptr',
      ],
      correct: 0,
      explain: 'После вызова адаптер кладёт полученный указатель во владельца.',
    },
    {
      q: 'Что сообщит AddressSanitizer, если память из malloc освобождается через delete?',
      options: [
        'alloc-dealloc-mismatch',
        'heap-buffer-overflow',
        'stack-use-after-return',
        'Ничего',
      ],
      correct: 0,
      explain: 'Та же ошибка — при delete для памяти из new[].',
    },
    {
      q: 'Можно ли использовать std::make_shared вместе с пользовательской функцией освобождения?',
      answers: ['нет', 'Нет'],
      placeholder: 'Да или нет',
      explain:
        'make_shared сам создаёт объект и знает, как его уничтожить; для своей функции освобождения нужен конструктор shared_ptr.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-custom-deleters-exercise',
      title: 'Устройства C-библиотеки',
      difficulty: 'beginner',
      description: `
В программе есть условная C-библиотека: \`Device *device_open(const char *name)\` (возвращает \`nullptr\`, если в имени нет двоеточия), \`int device_read(const Device *)\` и \`void device_close(Device *)\`. Открытие и закрытие печатают сообщения сами.

Напишите структуру \`DeviceCloser\` с \`operator()\`, вызывающим \`device_close\`, и тип \`using DevicePtr = std::unique_ptr<Device, DeviceCloser>;\`. Устройства хранятся в \`std::map<std::string, DevicePtr>\`. Команды:

- \`open X имя\` — открыть; если не удалось — напечатать \`ошибка открытия имя\` (старое устройство X не трогать); иначе заменить устройство X;
- \`read X\` — \`X: значение\` или \`X: закрыто\`;
- \`close X\` — закрыть.

В конце закройте устройства от последнего имени к первому.`,
      constraints: ['Команд не больше 200; имена до 30 символов.'],
      hints: [
        'struct DeviceCloser { void operator()(Device *d) const noexcept { device_close(d); } };',
        'Сначала откройте во временный DevicePtr и проверьте его, а уже потом присваивайте: тогда при ошибке старое устройство останется.',
      ],
      solution: String.raw`
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

${DEVICE_API}

struct DeviceCloser {
    void operator()(Device *d) const noexcept {
        device_close(d);
    }
};

using DevicePtr = std::unique_ptr<Device, DeviceCloser>;

int main() {
    std::map<std::string, DevicePtr> devices;
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "open") {
            std::string name;
            std::cin >> name;
            DevicePtr opened(device_open(name.c_str()));
            if (!opened) {
                std::println("ошибка открытия {}", name);
            } else {
                devices[x] = std::move(opened);
            }
        } else if (command == "read") {
            if (const DevicePtr &d = devices[x]) {
                std::println("{}: {}", x, device_read(d.get()));
            } else {
                std::println("{}: закрыто", x);
            }
        } else {
            devices[x].reset();
        }
    }
    for (auto it = devices.rbegin(); it != devices.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
\`DevicePtr\` — RAII-владелец ресурса C-библиотеки: при замене, \`reset\` и уничтожении он вызывает \`device_close\`, а не \`delete\`. Пустая структура \`DeviceCloser\` не занимает места, так что \`DevicePtr\` размером с обычный указатель.

Открытие во временный указатель даёт строгую гарантию: если устройство не открылось, старое продолжает работать.`,
      examples: [
        {
          in: 'open a usb:1\nread a\nopen a bad\nread a\nopen a usb:2\nclose a\nread a\n',
          out: 'открыто #1 usb:1\na: 10\nошибка открытия bad\na: 10\nоткрыто #2 usb:2\nзакрыто #1\nзакрыто #2\na: закрыто\n',
        },
        { in: 'read x\n', out: 'x: закрыто\n' },
      ],
      hidden: [
        { in: 'open a d:1\nopen b d:2\n', name: 'Закрытие в конце' },
        { in: 'open a nocolon\nread a\n', name: 'Ошибка без старого' },
        { in: 'open a d:1\nclose a\nclose a\n', name: 'Двойное закрытие' },
        { in: 'open z d:1\nopen a d:2\nopen m d:3\n', name: 'Порядок закрытия' },
        { in: 'open a d:1\nopen a d:2\nopen a d:3\nread a\n', name: 'Многократная замена' },
        { in: 'open a :\nread a\n', name: 'Только двоеточие' },
        { in: 'open a x:y\nopen b bad\nread b\nread a\n', name: 'Ошибка у другого' },
        { in: 'close q\nread q\n', name: 'Закрытие пустого' },
      ],
    },
    {
      title: 'Строки из malloc',
      description: `
Условная C-библиотека выделяет строки через \`malloc\` и считает выделения и освобождения:

- \`char *c_greet(const char *name)\` — возвращает строку \`Привет, имя!\`;
- \`int c_reverse(const char *s, char **out)\` — записывает в \`*out\` перевёрнутую копию ASCII-строки и возвращает 0, а для пустой строки возвращает −1 и ничего не выделяет;
- \`void c_free(void *p)\` — освобождает.

Напишите \`struct CFree\` для \`std::unique_ptr<char, CFree>\` и используйте \`std::out_ptr\` для \`c_reverse\`. Команды: \`greet имя\`, \`reverse слово\` (печатает результат), \`stats\` — \`выделено A, освобождено F\`. После всех команд напечатайте \`stats\` ещё раз — счётчики должны совпасть.`,
      constraints: ['Команд не больше 200; слова в reverse — латиница и цифры.'],
      hints: [
        'std::unique_ptr<char, CFree> out; if (c_reverse(word.c_str(), std::out_ptr(out)) == 0) … out.get() …',
        'Результат c_greet сразу отдайте владельцу: std::unique_ptr<char, CFree> s(c_greet(name.c_str()));',
      ],
      solution: String.raw`
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>
#include <print>
#include <string>

int allocated = 0;
int freed = 0;

// Условная C-библиотека.
extern "C" char *c_greet(const char *name) {
    const std::string text = std::string("Привет, ") + name + "!";
    char *out = static_cast<char *>(std::malloc(text.size() + 1));
    std::memcpy(out, text.c_str(), text.size() + 1);
    ++allocated;
    return out;
}

extern "C" int c_reverse(const char *s, char **out) {
    const std::size_t n = std::strlen(s);
    if (n == 0) {
        return -1;
    }
    *out = static_cast<char *>(std::malloc(n + 1));
    for (std::size_t i = 0; i < n; ++i) {
        (*out)[i] = s[n - 1 - i];
    }
    (*out)[n] = '\0';
    ++allocated;
    return 0;
}

extern "C" void c_free(void *p) {
    if (p) {
        ++freed;
    }
    std::free(p);
}

struct CFree {
    void operator()(char *p) const noexcept {
        c_free(p);
    }
};

using CString = std::unique_ptr<char, CFree>;

void stats() {
    std::println("выделено {}, освобождено {}", allocated, freed);
}

int main() {
    std::string command;
    while (std::cin >> command) {
        if (command == "stats") {
            stats();
            continue;
        }
        std::string arg;
        std::cin >> arg;
        if (command == "greet") {
            const CString s(c_greet(arg.c_str()));
            std::println("{}", s.get());
        } else {
            CString out;
            if (c_reverse(arg.c_str(), std::out_ptr(out)) == 0) {
                std::println("{}", out.get());
            } else {
                std::println("пусто");
            }
        }
    }
    stats();
    return 0;
}`,
      explanation: `
Память из C-библиотеки возвращается в неё же через \`c_free\`, и каждый блок освобождается ровно один раз — счётчики сходятся. \`std::out_ptr(out)\` передаёт в \`c_reverse\` адрес временного указателя, а после вызова кладёт результат в \`out\`: между вызовом и владельцем нет ни одной строки, где ресурс принадлежал бы сырому указателю.

Если бы строки освобождались через \`delete\` (умный указатель по умолчанию), AddressSanitizer сообщил бы о несовпадении способов выделения и освобождения.`,
      examples: [
        {
          in: 'greet Ада\nreverse abc\nstats\n',
          out: 'Привет, Ада!\ncba\nвыделено 2, освобождено 2\nвыделено 2, освобождено 2\n',
        },
        { in: 'stats\n', out: 'выделено 0, освобождено 0\nвыделено 0, освобождено 0\n' },
      ],
      hidden: [
        { in: 'reverse a\n', name: 'Один символ' },
        { in: 'reverse 12345\nreverse 54321\n', name: 'Цифры' },
        { in: 'greet Алан\ngreet Грейс\nstats\n', name: 'Два приветствия' },
        { in: 'reverse level\n', name: 'Палиндром' },
        { in: 'greet x\nreverse xy\ngreet y\n', name: 'Чередование' },
        { in: 'reverse abcdefghijklmnopqrstuvwxyz\n', name: 'Длинное слово' },
        { in: 'greet Длинное-имя-пользователя\n', name: 'Длинное имя' },
        { in: 'stats\nreverse ok\nstats\n', name: 'Статистика по ходу' },
      ],
    },
    {
      title: 'Найди ошибку: не тот способ освобождения',
      bug: true,
      description: `
Для каждого слова программа вызывает C-функцию \`c_upper\`, которая возвращает копию слова в верхнем регистре (память выделена \`malloc\`), и печатает \`слово → СЛОВО\`. Вывод правильный, но AddressSanitizer сообщает об ошибке. Найдите и исправьте её.`,
      constraints: ['Слов не больше 100; слова — латиница и цифры.'],
      hints: [
        'Чем выделена память и чем её освобождает std::unique_ptr<char> по умолчанию?',
        'Добавьте функцию освобождения: struct FreeDeleter { void operator()(char *p) const noexcept { std::free(p); } };',
      ],
      starter: UPPER(false),
      solution: UPPER(true),
      explanation: `
\`std::unique_ptr<char>\` освобождает объект через \`delete\`, а память выделена \`malloc\`. Смешивать способы нельзя: \`delete\` может работать с другим распределителем и вызывать деструкторы, а \`malloc\` их не знает. AddressSanitizer сообщает \`alloc-dealloc-mismatch (malloc vs operator delete)\`.

Функция освобождения \`FreeDeleter\` возвращает память тем же способом, каким она выделена. Пустая структура не увеличивает размер указателя.`,
      examples: [
        { in: 'hello world\n', out: 'hello → HELLO\nworld → WORLD\n' },
        { in: 'Cpp23\n', out: 'Cpp23 → CPP23\n' },
      ],
      hidden: [
        'a\n',
        'ABC\n',
        'mixed CASE words\n',
        'x1y2z3\n',
        'longwordlongwordlongwordlongword\n',
        'q w e r t y\n',
        'already UPPER\n',
        '123\n',
      ],
    },
    {
      title: 'Пул соединений',
      difficulty: 'advanced',
      description: `
Соединение \`Conn { int id; }\` дорого создавать, поэтому их переиспользуют. Пул \`Pool\` выдаёт \`Handle = std::unique_ptr<Conn, Return>\`, где \`Return\` — функция освобождения **с состоянием**: она хранит указатель на пул и вместо удаления возвращает соединение в пул.

- \`acquire()\` берёт последнее возвращённое свободное соединение (\`переиспользовано #N\`) или создаёт новое (\`новое соединение #N\`, номера с 1);
- возврат печатает \`возвращено #N\`;
- деструктор пула удаляет свободные соединения в порядке, в котором они лежат в списке свободных, печатая \`закрыто #N\`.

Ручки хранятся в \`std::map<std::string, Pool::Handle>\`. Команды: \`get H\` — \`handles[H] = pool.acquire()\` (если у H уже было соединение, оно возвращается **после** выдачи нового), \`put H\` — вернуть, \`idle\` — \`свободно N\`. В конце верните ручки от последнего имени к первому; затем пул уничтожается.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'struct Return { Pool *pool; void operator()(Conn *c) const noexcept { pool->give_back(c); } }; — Handle(c, Return{this}).',
        'Пул должен пережить все ручки: объявите его в main раньше словаря ручек.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <vector>

struct Conn {
    int id;
};

class Pool {
public:
    struct Return {
        Pool *pool;
        void operator()(Conn *c) const noexcept {
            pool->give_back(c);
        }
    };
    using Handle = std::unique_ptr<Conn, Return>;

    Pool() = default;
    Pool(const Pool &) = delete;
    Pool &operator=(const Pool &) = delete;
    ~Pool() {
        for (Conn *c : free_) {
            std::println("закрыто #{}", c->id);
            delete c;
        }
    }

    Handle acquire() {
        if (!free_.empty()) {
            Conn *c = free_.back();
            free_.pop_back();
            std::println("переиспользовано #{}", c->id);
            return Handle(c, Return{this});
        }
        auto owned = std::make_unique<Conn>(++created_);
        std::println("новое соединение #{}", owned->id);
        return Handle(owned.release(), Return{this});
    }

    void give_back(Conn *c) {
        std::println("возвращено #{}", c->id);
        free_.push_back(c);
    }

    std::size_t idle() const {
        return free_.size();
    }

private:
    std::vector<Conn *> free_;
    int created_ = 0;
};

int main() {
    Pool pool;
    std::map<std::string, Pool::Handle> handles;
    std::string command;
    while (std::cin >> command) {
        if (command == "idle") {
            std::println("свободно {}", pool.idle());
            continue;
        }
        std::string h;
        std::cin >> h;
        if (command == "get") {
            handles.insert_or_assign(h, pool.acquire());
        } else if (auto it = handles.find(h); it != handles.end()) {
            it->second.reset();
        }
    }
    for (auto it = handles.rbegin(); it != handles.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
Функция освобождения не обязана освобождать память — она описывает, что значит «отпустить ресурс». Здесь это возврат в пул: код, который пользуется ручкой, по-прежнему просто перестаёт ею владеть, а соединение переживает ручку и достаётся следующему клиенту. Цена состояния — ручка хранит указатель на пул и занимает два указателя.

Пул должен пережить все ручки — иначе функция освобождения обратится к уничтоженному пулу. Поэтому в \`main\` пул объявлен первым и уничтожается последним. \`release()\` в \`acquire\` передаёт владение новым соединением из временного \`unique_ptr\` в ручку без единого момента, когда соединение никому не принадлежит.`,
      examples: [
        {
          in: 'get a\nget b\nput a\nidle\nget c\nget b\nidle\n',
          out: 'новое соединение #1\nновое соединение #2\nвозвращено #1\nсвободно 1\nпереиспользовано #1\nновое соединение #3\nвозвращено #2\nсвободно 1\nвозвращено #1\nвозвращено #3\nзакрыто #2\nзакрыто #1\nзакрыто #3\n',
        },
        { in: 'idle\n', out: 'свободно 0\n' },
      ],
      hidden: [
        { in: 'get a\n', name: 'Одна ручка' },
        { in: 'get a\nput a\nget a\nput a\nidle\n', name: 'Повторное использование' },
        { in: 'put a\nidle\n', name: 'Возврат несуществующей' },
        { in: 'get a\nget a\nget a\nidle\n', name: 'Замена у одной ручки' },
        { in: 'get z\nget y\nget x\n', name: 'Возврат в конце' },
        { in: 'get a\nget b\nput b\nput a\nget c\nget d\n', name: 'Порядок переиспользования' },
        { in: 'get a\nput a\nput a\nidle\n', name: 'Двойной возврат' },
        { in: 'get p\nget q\nput p\nput q\nget r\nidle\n', name: 'Последний возвращённый' },
      ],
    },
  ],
};
