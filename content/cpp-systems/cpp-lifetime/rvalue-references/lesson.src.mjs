const INBOX = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Letter {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string from;
    std::string text;

    Letter(std::string f, std::string t) : from(std::move(f)), text(std::move(t)) {}
    Letter(const Letter &o) : from(o.from), text(o.text) {
        ++copies;
    }
    Letter(Letter &&o) noexcept : from(std::move(o.from)), text(std::move(o.text)) {
        ++moves;
    }
};

class Inbox {
public:
    Inbox() {
        letters_.reserve(1000);
    }

    void receive(Letter &&letter) {
        letters_.push_back(${fixed ? 'std::move(letter)' : 'letter'});
    }

    void print() const {
        for (const Letter &l : letters_) {
            std::println("{}: {}", l.from, l.text);
        }
    }

private:
    std::vector<Letter> letters_;
};

int main() {
    Inbox inbox;
    std::string from, text;
    while (std::cin >> from >> text) {
        inbox.receive(Letter(from, text));
    }
    inbox.print();
    std::println("копий {}, перемещений {}", Letter::copies, Letter::moves);
    return 0;
}`;

export default {
  id: 'lifetime-rvalue-references',
  title: 'Rvalue-ссылки и категории значений',
  description:
    'Категории значений lvalue, prvalue и xvalue; rvalue-ссылка T && и к чему привязываются ссылки разных видов; перегрузка const T & и T && — копировать или забрать; std::move как приведение типа; именованная rvalue-ссылка — lvalue; пробрасывающие ссылки и std::forward; методы с квалификаторами & и &&.',
  moduleId: 'cpp-lifetime',
  order: 12,
  difficulty: 'advanced',
  estimatedMinutes: 55,
  prerequisites: ['lifetime-move-semantics'],
  objectives: [
    'Определять категорию значения выражения',
    'Перегружать функции для копирования и перемещения',
    'Передавать именованные rvalue-ссылки дальше через std::move',
    'Понимать пробрасывающие ссылки и квалификаторы методов',
  ],
  tags: ['C++23', 'Время жизни', 'rvalue', 'std::move', 'std::forward'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Какие выражения — rvalue (x — переменная типа int)? Выберите все.',
      options: ['x + 1', '42', 'std::move(x)', 'x'],
      correct: [0, 1, 2],
      explain: 'x — lvalue: у него есть имя и адрес.',
    },
    {
      q: 'Что делает std::move сама по себе?',
      options: [
        'Приводит выражение к rvalue-ссылке — разрешает забрать ресурсы',
        'Перемещает объект в новую память',
        'Очищает объект',
        'Копирует объект в временную переменную',
      ],
      correct: 0,
      explain: 'Перемещает конструктор или присваивание, выбранные благодаря этому приведению.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>
#include <string>
#include <utility>

void f(const std::string &) { std::print("R"); }
void f(std::string &&) { std::print("M"); }

void g(std::string &&s) {
    f(s);
    f(std::move(s));
}

int main() {
    std::string a = "a";
    f(a);
    g(std::move(a));
    f(a + "b");
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['RRMM'],
      placeholder: 'Вывод программы',
      explain:
        'f(a) — lvalue; внутри g параметр s — имя, то есть lvalue (R), затем std::move (M); a + "b" — временное (M).',
    },
    {
      q: 'К чему привязывается параметр std::string &&s?',
      options: ['Только к rvalue', 'Только к lvalue', 'К чему угодно', 'Только к литералам'],
      correct: 0,
      explain: 'Передать в такую функцию переменную можно только через std::move.',
    },
    {
      q: 'Чем является T && в template <typename T> void f(T &&x)?',
      options: [
        'Пробрасывающей ссылкой: принимает и lvalue, и rvalue',
        'rvalue-ссылкой: принимает только rvalue',
        'Ссылкой на ссылку',
        'Ошибкой компиляции',
      ],
      correct: 0,
      explain:
        'При выводе типа T запоминает категорию аргумента; передают дальше через std::forward<T>(x).',
    },
    {
      q: 'Почему компилятор не перемещает из именованной rvalue-ссылки автоматически?',
      options: [
        'Имя можно использовать несколько раз; молча забрать данные при первом обращении было бы опасно',
        'Это запрещено стандартом для любых ссылок',
        'Из ссылки нельзя перемещать',
        'Перемещает, если включена оптимизация',
      ],
      correct: 0,
      explain: 'Исключение — return локальной переменной: после него имя уже не используется.',
    },
    {
      q: 'Какой метод выберется для Builder().build(), если есть build() const & и build() &&?',
      options: ['build() &&', 'build() const &', 'Ошибка неоднозначности', 'Любой'],
      correct: 0,
      explain:
        'Объект временный — rvalue, поэтому выбирается версия, которая может забрать данные.',
    },
    {
      q: 'Какая функция стандартной библиотеки передаёт аргумент дальше, сохраняя его категорию lvalue или rvalue?',
      answers: ['std::forward', 'forward'],
      placeholder: 'Имя функции',
      explain: 'Её используют с пробрасывающими ссылками в шаблонах.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-rvalue-references-exercise',
      title: 'lvalue или rvalue',
      difficulty: 'beginner',
      description: `
Три перегрузки функции \`kind\` возвращают строку: \`kind(int &)\` — \`изменяемое lvalue\`, \`kind(const int &)\` — \`константное lvalue\`, \`kind(int &&)\` — \`rvalue\`.

В программе есть \`int x = 1;\`, \`const int cx = 2;\`, \`std::vector<int> v{3};\`, \`int *p = &x;\`, функции \`int make()\` (возвращает 5) и \`int &ref()\` (возвращает ссылку на глобальную переменную). Для каждой команды вызовите \`kind\` с выражением и напечатайте \`команда: результат\`:

| команда | выражение |
| --- | --- |
| var | \`x\` |
| const | \`cx\` |
| literal | \`42\` |
| sum | \`x + 1\` |
| move | \`std::move(x)\` |
| elem | \`v[0]\` |
| deref | \`*p\` |
| call | \`make()\` |
| refcall | \`ref()\` |`,
      constraints: ['Команд не больше 100.'],
      hints: [
        'Не угадывайте результат — напишите три перегрузки и вызовите их: выбор сделает компилятор.',
        'Функция, возвращающая ссылку, даёт lvalue; возвращающая значение — prvalue.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

std::string kind(int &) {
    return "изменяемое lvalue";
}

std::string kind(const int &) {
    return "константное lvalue";
}

std::string kind(int &&) {
    return "rvalue";
}

int global = 7;

int make() {
    return 5;
}

int &ref() {
    return global;
}

int main() {
    int x = 1;
    const int cx = 2;
    std::vector<int> v{3};
    int *p = &x;
    std::string command;
    while (std::cin >> command) {
        std::string result;
        if (command == "var") {
            result = kind(x);
        } else if (command == "const") {
            result = kind(cx);
        } else if (command == "literal") {
            result = kind(42);
        } else if (command == "sum") {
            result = kind(x + 1);
        } else if (command == "move") {
            result = kind(std::move(x));
        } else if (command == "elem") {
            result = kind(v[0]);
        } else if (command == "deref") {
            result = kind(*p);
        } else if (command == "call") {
            result = kind(make());
        } else {
            result = kind(ref());
        }
        std::println("{}: {}", command, result);
    }
    return 0;
}`,
      explanation: `
Всё, что обозначает существующий объект, — lvalue: переменная, элемент вектора, разыменованный указатель, результат функции, возвращающей ссылку. Литерал, результат арифметики и функции, возвращающей значение, — временные prvalue. \`std::move(x)\` — xvalue: объект тот же, но помечен как «можно забрать».

Обратите внимание, что \`kind(std::move(x))\` ничего с \`x\` не делает: \`std::move\` лишь меняет категорию, а перегрузка \`kind(int &&)\` ничего не забирает.`,
      examples: [
        {
          in: 'var\nconst\nliteral\nmove\n',
          out: 'var: изменяемое lvalue\nconst: константное lvalue\nliteral: rvalue\nmove: rvalue\n',
        },
        { in: 'refcall\ncall\n', out: 'refcall: изменяемое lvalue\ncall: rvalue\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'sum\n', name: 'Сумма' },
        { in: 'elem\n', name: 'Элемент вектора' },
        { in: 'deref\n', name: 'Разыменование' },
        { in: 'var\nmove\nvar\n', name: 'После move переменная — снова lvalue' },
        { in: 'const\nconst\n', name: 'Повтор' },
        { in: 'var\nconst\nliteral\nsum\nmove\nelem\nderef\ncall\nrefcall\n', name: 'Все команды' },
        { in: 'call\nrefcall\nliteral\n', name: 'Функции и литерал' },
      ],
    },
    {
      title: 'Почтовый ящик',
      description: `
Сообщение \`Message\` хранит текст и считает свои копии и перемещения. \`Mailbox\` хранит сообщения в векторе (место зарезервировано на 1000) и имеет две перегрузки: \`add(const Message &)\` — копирует в ящик, \`add(Message &&)\` — перемещает.

Команды:

- \`send текст\` — \`mailbox.add(Message(текст))\`;
- \`keep текст\` — создать именованное сообщение, передать в \`add\` и напечатать \`у отправителя: текст\` (сообщение осталось у отправителя целым);
- \`forward текст\` — создать именованное сообщение и передать его через \`std::move\`;
- \`list\` — тексты в ящике через пробел;
- \`stats\` — \`копий C, перемещений M\`.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Внутри add(Message &&m) параметр m — имя, то есть lvalue: box_.push_back(std::move(m));',
        'Перегрузку выбирает компилятор по категории аргумента: временный объект и std::move — rvalue, именованная переменная — lvalue.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Message {
    static inline int copies = 0;
    static inline int moves = 0;
    std::string text;

    explicit Message(std::string t) : text(std::move(t)) {}
    Message(const Message &o) : text(o.text) {
        ++copies;
    }
    Message(Message &&o) noexcept : text(std::move(o.text)) {
        ++moves;
    }
};

class Mailbox {
public:
    Mailbox() {
        box_.reserve(1000);
    }

    void add(const Message &m) {
        box_.push_back(m);
    }

    void add(Message &&m) {
        box_.push_back(std::move(m));
    }

    void list() const {
        std::string s;
        for (const Message &m : box_) {
            s += (s.empty() ? "" : " ") + m.text;
        }
        std::println("{}", s);
    }

private:
    std::vector<Message> box_;
};

int main() {
    Mailbox mailbox;
    std::string command;
    while (std::cin >> command) {
        if (command == "list") {
            mailbox.list();
        } else if (command == "stats") {
            std::println("копий {}, перемещений {}", Message::copies, Message::moves);
        } else {
            std::string text;
            std::cin >> text;
            if (command == "send") {
                mailbox.add(Message(text));
            } else if (command == "keep") {
                const Message m(text);
                mailbox.add(m);
                std::println("у отправителя: {}", m.text);
            } else {
                Message m(text);
                mailbox.add(std::move(m));
            }
        }
    }
    return 0;
}`,
      explanation: `
Пара перегрузок \`const T &\` и \`T &&\` — тот же приём, что у \`push_back\` в стандартной библиотеке. Временное сообщение и сообщение, отданное через \`std::move\`, выбирают версию для rvalue и перемещаются; именованное сообщение, которое ещё нужно отправителю, — копируется.

Внутри \`add(Message &&m)\` параметр снова нужно передать через \`std::move\`: у него есть имя, и без этого \`push_back\` выбрал бы копирование.`,
      examples: [
        {
          in: 'send a\nkeep b\nforward c\nlist\nstats\n',
          out: 'у отправителя: b\na b c\nкопий 1, перемещений 2\n',
        },
        { in: 'stats\n', out: 'копий 0, перемещений 0\n' },
      ],
      hidden: [
        { in: 'send x\nsend y\nstats\n', name: 'Только временные' },
        { in: 'keep x\nkeep y\nstats\nlist\n', name: 'Только копии' },
        { in: 'forward x\nstats\n', name: 'Одно перемещение' },
        { in: 'list\n', name: 'Пустой ящик' },
        {
          in: 'keep длинное-сообщение-которое-не-влезет-в-короткую-строку\nlist\n',
          name: 'Длинный текст',
        },
        { in: 'send a\nkeep a\nforward a\nsend a\nstats\n', name: 'Одинаковые тексты' },
        { in: 'forward 1\nforward 2\nkeep 3\nlist\nstats\n', name: 'Смешанные' },
        { in: 'keep q\nstats\nsend w\nstats\n', name: 'Статистика по ходу' },
      ],
    },
    {
      title: 'Найди ошибку: медленная доставка',
      bug: true,
      description: `
Каждая строка ввода — отправитель и текст письма. Программа складывает письма в ящик и печатает их, а затем статистику копий и перемещений. По замыслу письма должны попадать в ящик без единой копии, но статистика показывает обратное. Найдите и исправьте ошибку.`,
      constraints: ['Писем не больше 500.'],
      hints: [
        'Какая категория у выражения letter внутри receive(Letter &&letter)?',
        'Именованная rvalue-ссылка — lvalue. Передайте её дальше через std::move(letter).',
      ],
      starter: INBOX(false),
      solution: INBOX(true),
      explanation: `
\`receive\` принимает \`Letter &&\` — сигнатура обещает «заберу ваше письмо». Но внутри \`letter\` — имя, то есть lvalue, и \`push_back(letter)\` выбирает перегрузку для \`const Letter &\`: письмо копируется, а временный оригинал потом уничтожается. Программа работает правильно, но делает вдвое больше работы.

\`std::move(letter)\` выполняет обещание сигнатуры. Компиляторы не предупреждают о такой ошибке; её находят профилировщиком, счётчиками или проверкой \`clang-tidy\` (performance-move-const-arg и родственные правила).`,
      examples: [
        {
          in: 'Ада привет\nАлан ответ\n',
          out: 'Ада: привет\nАлан: ответ\nкопий 0, перемещений 2\n',
        },
        { in: 'X Y\n', out: 'X: Y\nкопий 0, перемещений 1\n' },
      ],
      hidden: [
        'a b\nc d\ne f\n',
        'Грейс отчёт\n',
        'p q\np q\n',
        'отправитель-с-длинным-именем письмо-с-длинным-текстом\n',
        '1 2\n3 4\n5 6\n7 8\n',
        'z w\n',
        'Бьёрн C++\nДеннис C\n',
        'k l\nm n\n',
      ],
    },
    {
      title: 'Строитель',
      difficulty: 'advanced',
      description: `
Класс \`Builder\` собирает строку из слов (через пробел). У него две пары методов с квалификаторами ссылки:

- \`Builder &add(std::string_view) &\` и \`Builder &&add(std::string_view) &&\` — добавить слово и вернуть себя в той же категории;
- \`std::string build() const &\` — вернуть **копию** строки (увеличивает статический счётчик \`copies\`), \`std::string build() &&\` — **забрать** строку (увеличивает \`moves\`).

Команды:

- \`once a b c\` — \`Builder().add(a).add(b).add(c).build()\` одним выражением (ровно три слова);
- \`named n w₁ … wₙ\` — именованный строитель; напечатать \`build()\` дважды (объект остаётся пригодным);
- \`take n w₁ … wₙ\` — именованный строитель, результат через \`std::move(b).build()\`;
- \`stats\` — \`копий C, перемещений M\`.

Каждый результат печатайте как \`результат: строка\`.`,
      constraints: ['Команд не больше 100; слов в команде до 20.'],
      hints: [
        'Builder &&add(std::string_view s) && { append(s); return std::move(*this); } — у временного объекта цепочка остаётся rvalue до самого build().',
        'build() &&: ++moves; return std::move(text_); build() const &: ++copies; return text_;',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

class Builder {
public:
    static inline int copies = 0;
    static inline int moves = 0;

    Builder &add(std::string_view s) & {
        append(s);
        return *this;
    }

    Builder &&add(std::string_view s) && {
        append(s);
        return std::move(*this);
    }

    std::string build() const & {
        ++copies;
        return text_;
    }

    std::string build() && {
        ++moves;
        return std::move(text_);
    }

private:
    void append(std::string_view s) {
        if (!text_.empty()) {
            text_ += ' ';
        }
        text_ += s;
    }

    std::string text_;
};

std::vector<std::string> read_words(std::istream &in) {
    std::size_t n;
    in >> n;
    std::vector<std::string> words(n);
    for (std::string &w : words) {
        in >> w;
    }
    return words;
}

int main() {
    std::string command;
    while (std::cin >> command) {
        if (command == "once") {
            std::string a, b, c;
            std::cin >> a >> b >> c;
            std::println("результат: {}", Builder().add(a).add(b).add(c).build());
        } else if (command == "named") {
            Builder b;
            for (const std::string &w : read_words(std::cin)) {
                b.add(w);
            }
            std::println("результат: {}", b.build());
            std::println("результат: {}", b.build());
        } else if (command == "take") {
            Builder b;
            for (const std::string &w : read_words(std::cin)) {
                b.add(w);
            }
            std::println("результат: {}", std::move(b).build());
        } else {
            std::println("копий {}, перемещений {}", Builder::copies, Builder::moves);
        }
    }
    return 0;
}`,
      explanation: `
Квалификатор после списка параметров выбирает метод по категории **самого объекта**. У временного \`Builder()\` вся цепочка остаётся rvalue — каждый \`add &&\` возвращает \`Builder &&\`, — и \`build() &&\` забирает строку без копирования. Именованный строитель — lvalue: \`build() const &\` отдаёт копию, и объект можно использовать снова. \`std::move(b).build()\` явно говорит: «строитель больше не нужен, забери».

В C++23 то же самое можно записать одним методом с явным параметром объекта: \`template <class Self> auto build(this Self &&self)\` — и выбирать поведение по типу \`Self\`.`,
      examples: [
        {
          in: 'once a b c\nnamed 2 x y\ntake 1 z\nstats\n',
          out: 'результат: a b c\nрезультат: x y\nрезультат: x y\nрезультат: z\nкопий 2, перемещений 2\n',
        },
        { in: 'stats\n', out: 'копий 0, перемещений 0\n' },
      ],
      hidden: [
        { in: 'once p q r\nstats\n', name: 'Одна цепочка' },
        { in: 'named 0\nstats\n', name: 'Пустой именованный' },
        { in: 'take 0\nstats\n', name: 'Пустой с move' },
        { in: 'named 3 один два три\n', name: 'Кириллица' },
        { in: 'once a a a\nonce b b b\nstats\n', name: 'Две цепочки' },
        { in: 'take 4 w x y z\nnamed 1 q\nstats\n', name: 'take и named' },
        { in: 'named 1 x\nnamed 1 y\ntake 1 z\nonce 1 2 3\nstats\n', name: 'Все команды' },
        { in: 'take 20 a b c d e f g h i j k l m n o p q r s t\n', name: 'Двадцать слов' },
      ],
    },
  ],
};
