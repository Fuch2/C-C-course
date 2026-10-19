const PATH = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

class Path {
public:
    Path${fixed ? ' &' : ''} add(const std::string &part) {
        text_ += "/" + part;
        return *this;
    }

    const std::string &str() const {
        return text_;
    }

private:
    std::string text_;
};

int main() {
    std::string root, user, file;
    while (std::cin >> root >> user >> file) {
        Path path;
        path.add(root).add(user).add(file);
        std::println("{}", path.str());
    }
    return 0;
}`;

export default {
  id: 'oop-this',
  title: 'this, константные методы и deducing this',
  description:
    'this — скрытый указатель на получателя; тип this в обычном и const-методе; возврат *this и цепочки вызовов; проверка this == &other для операций объекта с самим собой; перегрузка метода по const; явный параметр объекта this auto &self из C++23 и рекурсивные лямбды.',
  moduleId: 'cpp-oop',
  order: 7,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-destructor'],
  objectives: [
    'Объяснять, как метод получает доступ к своему объекту',
    'Строить цепочки вызовов, возвращая *this по ссылке',
    'Обрабатывать операцию объекта с самим собой',
    'Заменять перегрузку по const явным параметром объекта C++23',
  ],
  tags: ['C++23', 'ООП', 'this', 'deducing this', 'const'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Acc {
public:
    Acc &add(int x) { sum_ += x; return *this; }
    int sum() const { return sum_; }

private:
    int sum_ = 0;
};

int main() {
    Acc a;
    a.add(1).add(2).add(3);
    std::println("{}", a.sum());
    return 0;
}`,
      lang: 'cpp',
      answers: ['6'],
      placeholder: 'Вывод программы',
      explain: 'Каждый add возвращает ссылку на тот же объект, и цепочка работает с a.',
    },
    {
      q: 'Что выведет та же программа, если add объявить как Acc add(int x) (без &)?',
      answers: ['1'],
      placeholder: 'Вывод программы',
      explain: 'add(1) меняет a и возвращает копию; add(2) и add(3) меняют временные копии.',
    },
    {
      q: 'Какой тип у this внутри метода int get() const класса Counter?',
      options: ['const Counter *', 'Counter *', 'Counter &', 'const Counter &'],
      correct: 0,
      explain: 'В const-методе this указывает на константу — через него можно только читать поля.',
    },
    {
      q: 'Чему равна запись value_ внутри метода класса?',
      answers: ['this->value_', 'this->value_;', '(*this).value_'],
      placeholder: 'Выражение',
      explain: 'Обращение к полю без this-> — сокращение.',
    },
    {
      q: 'Зачем методу transfer(Account &to, …) проверка this == &to?',
      options: [
        'Чтобы распознать перевод самому себе — операцию, где один объект выступает под двумя именами',
        'Чтобы проверить, что to не равен nullptr',
        'Чтобы сравнить балансы',
        'Без неё код не скомпилируется',
      ],
      correct: 0,
      explain:
        'Операции, которые читают один объект и меняют другой, ломаются, если это один и тот же объект.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Box {
    int v = 1;
    int &get() { return v; }
    const int &get() const { return v; }
};

int main() {
    Box b;
    const Box &c = b;
    b.get() = 10;
    std::println("{}", c.get() + 1);
    return 0;
}`,
      lang: 'cpp',
      answers: ['11'],
      placeholder: 'Вывод программы',
      explain:
        'Для b выбирается неконстантная версия и запись проходит; c — ссылка на тот же объект.',
    },
    {
      q: 'Что означает первый параметр this auto &self в методе C++23?',
      options: [
        'Явный параметр объекта: получатель передаётся как self, его тип выводит компилятор',
        'Метод принимает копию объекта',
        'Метод становится статическим',
        'Метод нельзя вызвать у константы',
      ],
      correct: 0,
      explain:
        'Для константного получателя self — константная ссылка, для изменяемого — обычная. Одно тело вместо двух перегрузок.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

int main() {
    auto fib = [](this auto self, int n) -> int {
        return n < 2 ? n : self(n - 1) + self(n - 2);
    };
    std::println("{}", fib(10));
    return 0;
}`,
      lang: 'cpp',
      answers: ['55'],
      placeholder: 'Вывод программы',
      explain:
        'Лямбда с явным параметром объекта может вызвать сама себя: десятое число Фибоначчи — 55.',
    },
    {
      q: 'Почему в статической функции класса нельзя обратиться к обычному полю?',
      options: [
        'У статической функции нет получателя и нет this',
        'Статические функции не видят закрытых членов',
        'Поля доступны только в конструкторе',
        'Можно — через this',
      ],
      correct: 0,
      explain: 'Статическая функция принадлежит классу, а не объекту.',
    },
  ],
  exercises: [
    {
      id: 'oop-this-exercise',
      title: 'Строка по шагам',
      difficulty: 'beginner',
      description: `
Опишите класс \`Line\` с методами, которые возвращают \`Line &\`, чтобы их можно было соединять в цепочку:

- \`text(const std::string &s)\` — дописать слово;
- \`number(long long n)\` — дописать число;
- \`repeat(char c, int k)\` — дописать символ \`c\` \`k\` раз;
- \`space()\` — дописать пробел.

Метод \`const std::string &str() const\` возвращает результат. Команды ввода: \`text слово\`, \`number n\`, \`repeat c k\`, \`space\`. После всех команд напечатайте результат в квадратных скобках.`,
      constraints: ['Команд не больше 50; k от 0 до 100.'],
      hints: [
        'Каждый метод заканчивается строкой return *this;, а тип результата — Line &.',
        'repeat: text_.append(k, c) — дописывает k копий символа. number: std::to_string(n).',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Line {
public:
    Line &text(const std::string &s) {
        text_ += s;
        return *this;
    }

    Line &number(long long n) {
        text_ += std::to_string(n);
        return *this;
    }

    Line &repeat(char c, int k) {
        text_.append(static_cast<std::size_t>(k), c);
        return *this;
    }

    Line &space() {
        return text(" ");
    }

    const std::string &str() const {
        return text_;
    }

private:
    std::string text_;
};

int main() {
    Line line;
    std::string command;
    while (std::cin >> command) {
        if (command == "text") {
            std::string s;
            std::cin >> s;
            line.text(s);
        } else if (command == "number") {
            long long n;
            std::cin >> n;
            line.number(n);
        } else if (command == "repeat") {
            char c;
            int k;
            std::cin >> c >> k;
            line.repeat(c, k);
        } else {
            line.space();
        }
    }
    std::println("[{}]", line.str());
    return 0;
}`,
      explanation: `
Все изменяющие методы возвращают ссылку на свой объект, поэтому их можно соединять: \`line.text("a").space().number(5)\`. Здесь команды приходят по одной, и цепочка не нужна, но тот же класс без изменений поддерживает оба стиля.

\`space\` выражен через \`text\` и тоже возвращает \`*this\` — результат \`text(" ")\` и есть ссылка на тот же объект.`,
      examples: [
        { in: 'text Итого:\nspace\nnumber 42\nrepeat ! 3\n', out: '[Итого: 42!!!]\n' },
        { in: '', out: '[]\n' },
      ],
      hidden: [
        { in: 'repeat - 10\n', name: 'Линия' },
        { in: 'repeat * 0\n', name: 'Ноль повторов' },
        { in: 'number -7\nspace\nnumber 0\n', name: 'Числа' },
        { in: 'text a\ntext b\ntext c\n', name: 'Слова подряд' },
        { in: 'space\nspace\n', name: 'Пробелы' },
        { in: 'number 9223372036854775807\n', name: 'Большое число' },
        { in: 'text [\nrepeat = 5\ntext ]\n', name: 'Скобки' },
        { in: 'text Привет\nspace\ntext мир\nrepeat . 3\n', name: 'Фраза' },
      ],
    },
    {
      title: 'Поле для игры',
      description: `
Ввод начинается с размеров поля \`r c\` (все клетки — 0). Опишите класс \`Board\` с **одним** методом доступа к клетке через явный параметр объекта C++23:

\`\`\`cpp
auto &at(this auto &self, int row, int col);
\`\`\`

Он должен работать и для изменения клетки, и для чтения через \`const Board &\`. Команды:

- \`put i j v\` — записать значение;
- \`row i\` — сумма строки (вычисляйте функцией, принимающей \`const Board &\`);
- \`col j\` — сумма столбца (тоже через \`const Board &\`).

Индексы считаются с 0 и всегда корректны.`,
      constraints: ['1 ≤ r, c ≤ 50; команд не больше 100; значения по модулю до 10⁶.'],
      hints: [
        'Внутри метода нет неявного доступа к полям — всё через self: return self.cells_[row * self.cols_ + col];.',
        'Функции суммы: long long row_sum(const Board &b, int i) — вызов b.at(i, j) выберет константную версию автоматически. Понадобятся методы rows() const и cols() const.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Board {
public:
    Board(int rows, int cols) : rows_(rows), cols_(cols), cells_(static_cast<std::size_t>(rows * cols)) {}

    auto &at(this auto &self, int row, int col) {
        return self.cells_[static_cast<std::size_t>(row * self.cols_ + col)];
    }

    int rows() const {
        return rows_;
    }

    int cols() const {
        return cols_;
    }

private:
    int rows_;
    int cols_;
    std::vector<long long> cells_;
};

long long row_sum(const Board &b, int i) {
    long long s = 0;
    for (int j = 0; j < b.cols(); j++) {
        s += b.at(i, j);
    }
    return s;
}

long long col_sum(const Board &b, int j) {
    long long s = 0;
    for (int i = 0; i < b.rows(); i++) {
        s += b.at(i, j);
    }
    return s;
}

int main() {
    int r, c;
    std::cin >> r >> c;
    Board board(r, c);
    std::string command;
    while (std::cin >> command) {
        if (command == "put") {
            int i, j;
            long long v;
            std::cin >> i >> j >> v;
            board.at(i, j) = v;
        } else if (command == "row") {
            int i;
            std::cin >> i;
            std::println("{}", row_sum(board, i));
        } else {
            int j;
            std::cin >> j;
            std::println("{}", col_sum(board, j));
        }
    }
    return 0;
}`,
      explanation: `
Один метод \`at\` обслуживает оба случая. В \`board.at(i, j) = v\` получатель изменяемый, \`self\` — \`Board &\`, и метод возвращает \`long long &\`. В \`row_sum\` получатель — \`const Board &\`, \`self\` выводится как константная ссылка, и результат — \`const long long &\`: читать можно, менять нельзя.

Без C++23 понадобились бы две перегрузки — с одинаковыми телами и риском, что они однажды разойдутся. Функции сумм принимают \`const Board &\`: они только читают поле, и это видно из сигнатуры.`,
      examples: [
        { in: '2 3\nput 1 0 1\nput 1 2 7\nrow 1\ncol 2\n', out: '8\n7\n' },
        { in: '1 1\nrow 0\n', out: '0\n' },
      ],
      hidden: [
        { in: '3 3\nput 0 0 5\nput 0 0 6\nrow 0\n', name: 'Перезапись' },
        { in: '2 2\nput 0 0 -1000000\nput 1 1 1000000\ncol 0\ncol 1\n', name: 'Отрицательные' },
        { in: '50 50\nput 49 49 9\nrow 49\ncol 49\n', name: 'Большое поле' },
        {
          in: '1 5\nput 0 0 1\nput 0 1 2\nput 0 2 3\nput 0 3 4\nput 0 4 5\nrow 0\n',
          name: 'Одна строка',
        },
        { in: '5 1\nput 0 0 1\nput 4 0 1\ncol 0\n', name: 'Один столбец' },
        { in: '3 4\nrow 2\ncol 3\n', name: 'Пустое поле' },
        { in: '2 2\nput 0 1 3\nput 1 1 4\ncol 1\nrow 0\nrow 1\n', name: 'Смесь' },
        {
          in: '3 3\nput 1 1 1000000\nput 1 0 1000000\nput 1 2 1000000\nrow 1\n',
          name: 'Большие суммы',
        },
      ],
    },
    {
      title: 'Найди ошибку: цепочка из копий',
      bug: true,
      description: `
Каждая строка ввода — три слова: каталог, пользователь и файл. Программа собирает из них путь цепочкой вызовов \`path.add(root).add(user).add(file)\` и печатает его:

\`\`\`text
/home/ada/notes.txt
\`\`\`

Но печатается только первая часть пути. Найдите и исправьте ошибку в классе \`Path\`.`,
      constraints: ['Строк не больше 20; слова без пробелов.'],
      hints: [
        'Что именно возвращает add? С каким объектом работает второй вызов в цепочке?',
        'add возвращает Path по значению — копию. Второй и третий add меняют временные копии. Тип результата должен быть Path &.',
      ],
      starter: PATH(false),
      solution: PATH(true),
      explanation: `
\`return *this;\` в методе с типом результата \`Path\` создаёт **копию** объекта. Первый \`add\` меняет \`path\`, а возвращает копию; второй \`add\` дописывает пользователя к этой временной копии, которая исчезает в конце строки; третий — к другой копии. В \`path\` остаётся только \`/home\`.

Одного символа \`&\` в типе результата достаточно: метод возвращает ссылку на сам \`path\`, и каждое звено цепочки работает с ним. Компилятор не предупреждает — оба варианта корректны, просто означают разное.`,
      examples: [
        { in: 'home ada notes.txt\n', out: '/home/ada/notes.txt\n' },
        { in: 'var log syslog\n', out: '/var/log/syslog\n' },
      ],
      hidden: [
        'a b c\n',
        'usr local bin\n',
        'tmp x y\nopt app run\n',
        'дом папка файл.txt\n',
        'srv www index.html\n',
        'etc nginx nginx.conf\n',
        '1 2 3\n',
        'mnt usb photo.jpg\n',
      ],
    },
    {
      title: 'Переводы между счетами',
      difficulty: 'advanced',
      description: `
Первая строка — число счетов \`n\` и их начальные балансы. Опишите класс \`Account\` с методом \`bool transfer(Account &to, long long amount)\`. Перевод берёт комиссию — 1% суммы, округлённый вниз; с отправителя списывается сумма плюс комиссия, получатель получает сумму. Перевод отклоняется, если:

- это перевод самому себе (проверьте \`this == &to\`);
- сумма не положительна;
- у отправителя не хватает средств на сумму с комиссией.

Команды: \`transfer i j amount\` — напечатайте \`ок\`, \`отказ\` или \`нет счёта\` (номера с 0); \`show\` — все балансы через пробел.`,
      constraints: ['1 ≤ n ≤ 20; балансы и суммы по модулю до 10¹²; команд не больше 50.'],
      hints: [
        'Счета храните в std::vector<Account>; проверку номеров делайте в main до вызова transfer.',
        'Комиссия — amount / 100. Порядок в transfer: сначала все проверки, затем balance_ -= amount + fee; to.balance_ += amount;.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Account {
public:
    explicit Account(long long balance) : balance_(balance) {}

    bool transfer(Account &to, long long amount) {
        long long fee = amount / 100;
        if (this == &to || amount <= 0 || amount + fee > balance_) {
            return false;
        }
        balance_ -= amount + fee;
        to.balance_ += amount;
        return true;
    }

    long long balance() const {
        return balance_;
    }

private:
    long long balance_;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Account> accounts;
    for (int i = 0; i < n; i++) {
        long long b;
        std::cin >> b;
        accounts.emplace_back(b);
    }
    std::string command;
    while (std::cin >> command) {
        if (command == "show") {
            std::string line;
            for (const Account &a : accounts) {
                line += (line.empty() ? "" : " ") + std::to_string(a.balance());
            }
            std::println("{}", line);
            continue;
        }
        int i, j;
        long long amount;
        std::cin >> i >> j >> amount;
        if (i < 0 || j < 0 || i >= n || j >= n) {
            std::println("нет счёта");
        } else if (accounts[static_cast<std::size_t>(i)].transfer(accounts[static_cast<std::size_t>(j)], amount)) {
            std::println("ок");
        } else {
            std::println("отказ");
        }
    }
    return 0;
}`,
      explanation: `
\`this == &to\` сравнивает адреса: отправитель и получатель — один и тот же объект в векторе. Без этой проверки перевод самому себе с комиссией тихо «съедал» бы деньги: сумма списывалась бы и тут же возвращалась, а комиссия терялась. Отказ здесь — явное решение, а не случайность.

Все проверки выполняются до изменения балансов, поэтому отклонённый перевод ничего не меняет. Метод \`transfer\` обращается к закрытому полю \`to.balance_\` другого объекта — это разрешено: доступ проверяется по классу.`,
      examples: [
        { in: '2 1000 0\ntransfer 0 1 500\ntransfer 0 0 10\nshow\n', out: 'ок\nотказ\n495 500\n' },
        { in: '1 100\ntransfer 0 1 10\nshow\n', out: 'нет счёта\n100\n' },
      ],
      hidden: [
        { in: '2 100 0\ntransfer 0 1 100\nshow\n', name: 'Не хватает на комиссию' },
        { in: '2 101 0\ntransfer 0 1 100\nshow\n', name: 'Ровно хватает' },
        { in: '2 50 50\ntransfer 0 1 0\ntransfer 0 1 -5\nshow\n', name: 'Неположительные' },
        { in: '3 1000 1000 1000\ntransfer 0 1 99\ntransfer 1 2 99\nshow\n', name: 'Без комиссии' },
        { in: '2 1000000000000 0\ntransfer 0 1 990000000000\nshow\n', name: 'Большие суммы' },
        {
          in: '2 10 10\ntransfer 1 1 1\ntransfer -1 0 1\ntransfer 0 2 1\n',
          name: 'Ошибочные номера',
        },
        {
          in: '3 300 0 0\ntransfer 0 1 200\ntransfer 1 2 200\ntransfer 1 2 197\nshow\n',
          name: 'Цепочка переводов',
        },
        { in: '1 5\nshow\n', name: 'Один счёт' },
      ],
    },
  ],
};
