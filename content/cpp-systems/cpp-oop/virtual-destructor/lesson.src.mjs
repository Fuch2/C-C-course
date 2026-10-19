const NOTICE = (fixed) => String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Notice {
public:
    ${fixed ? 'virtual ~Notice() = default;' : '~Notice() {}'}
    virtual std::string text() const = 0;
};

class Email : public Notice {
public:
    Email(std::string to, std::string subject) : to_(std::move(to)), subject_(std::move(subject)) {}

    std::string text() const override {
        return "письмо для " + to_ + ": " + subject_;
    }

private:
    std::string to_;
    std::string subject_;
};

class Sms : public Notice {
public:
    explicit Sms(std::string phone) : phone_(std::move(phone)) {}

    std::string text() const override {
        return "SMS на " + phone_;
    }

private:
    std::string phone_;
};

int main() {
    std::vector<std::unique_ptr<Notice>> queue;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "email") {
            std::string to, subject;
            std::cin >> to >> subject;
            queue.push_back(std::make_unique<Email>(to, subject));
        } else {
            std::string phone;
            std::cin >> phone;
            queue.push_back(std::make_unique<Sms>(phone));
        }
    }
    for (const auto &n : queue) {
        std::println("{}", n->text());
    }
    std::println("отправлено {}", queue.size());
    return 0;
}`;

export default {
  id: 'oop-virtual-destructor',
  title: 'Виртуальный деструктор и полиморфное владение',
  description:
    'Как владеть объектами разных классов: std::unique_ptr и std::make_unique, вектор умных указателей на базу; удаление через указатель на базу и почему без виртуального деструктора не вызывается деструктор наследника; new-delete-type-mismatch в AddressSanitizer; правило «public virtual или protected невиртуальный»; момент уничтожения элементов.',
  moduleId: 'cpp-oop',
  order: 21,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-abstract-classes'],
  objectives: [
    'Хранить объекты разных классов в std::vector<std::unique_ptr<База>>',
    'Объявлять виртуальный деструктор полиморфной базы',
    'Предсказывать момент и порядок уничтожения элементов владеющего контейнера',
  ],
  tags: ['C++23', 'ООП', 'Виртуальный деструктор', 'unique_ptr', 'Владение'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа? Запишите вывод в одну строку через пробел.',
      code: String.raw`
#include <memory>
#include <print>

struct A {
    virtual ~A() { std::print("~A "); }
};

struct B : A {
    ~B() override { std::print("~B "); }
};

int main() {
    {
        std::unique_ptr<A> p = std::make_unique<B>();
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['~B ~A'],
      placeholder: 'Вывод программы',
      explain:
        'С виртуальным деструктором удаление через A вызывает деструктор настоящего объекта, а он — деструктор базы.',
    },
    {
      q: 'Что произойдёт, если в предыдущей программе убрать virtual у ~A()?',
      options: [
        'Деструктор B не вызовется: неопределённое поведение, ASan сообщит new-delete-type-mismatch',
        'Ничего не изменится',
        'Ошибка компиляции',
        'Деструкторы вызовутся дважды',
      ],
      correct: 0,
      explain: 'Удаление через базу выбирает деструктор по статическому типу.',
    },
    {
      q: 'Как создать объект Circle(1) в куче и сразу передать владение умному указателю на базу Shape?',
      answers: [
        'std::unique_ptr<Shape> p = std::make_unique<Circle>(1);',
        'std::unique_ptr<Shape> p = std::make_unique<Circle>(1)',
        'auto p = std::unique_ptr<Shape>(std::make_unique<Circle>(1));',
      ],
      placeholder: 'Объявление',
      explain:
        'make_unique создаёт объект и возвращает unique_ptr<Circle>, который превращается в unique_ptr<Shape>.',
    },
    {
      q: 'Почему нельзя хранить фигуры разных видов в std::vector<Shape>?',
      options: [
        'Абстрактный класс нельзя хранить по значению, а неабстрактная база обрезала бы наследников',
        'Векторы не хранят классы',
        'Можно, если Shape имеет виртуальный деструктор',
        'Вектор не умеет вызывать виртуальные функции',
      ],
      correct: 0,
      explain: 'Полиморфными объектами владеют через указатели — std::unique_ptr<Shape>.',
    },
    {
      q: 'Каким должен быть деструктор базового класса по правилу C++ Core Guidelines?',
      options: [
        'Открытым и виртуальным — или защищённым и невиртуальным',
        'Всегда закрытым',
        'Всегда невиртуальным ради скорости',
        'Чисто виртуальным',
      ],
      correct: 0,
      explain:
        'Защищённый невиртуальный деструктор запрещает удаление через базу на этапе компиляции.',
    },
    {
      q: 'Что выведет программа? Запишите вывод в одну строку через пробел.',
      code: String.raw`
#include <memory>
#include <print>
#include <vector>

struct T {
    int id;
    explicit T(int id) : id(id) {}
    virtual ~T() { std::print("{} ", id); }
};

int main() {
    std::vector<std::unique_ptr<T>> v;
    for (int i = 1; i <= 3; i++) {
        v.push_back(std::make_unique<T>(i));
    }
    v.erase(v.begin());
    std::print("| ");
    v.clear();
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 | 2 3'],
      placeholder: 'Вывод программы',
      explain: 'erase сразу уничтожает первый объект; clear уничтожает оставшиеся.',
    },
    {
      q: 'Сколько стоит виртуальный деструктор в классе, где уже есть виртуальные функции?',
      options: [
        'Практически ничего: указатель на таблицу виртуальных функций в объекте уже есть',
        'Плюс 8 байт на каждый объект',
        'Каждое удаление в 10 раз медленнее',
        'Запрещает копирование',
      ],
      correct: 0,
      explain: 'Поэтому в полиморфных классах его объявляют всегда.',
    },
    {
      q: 'Кто удаляет объекты в std::vector<std::unique_ptr<Shape>> при уничтожении вектора?',
      options: [
        'Каждый unique_ptr удаляет свой объект в деструкторе',
        'Программист вызывает delete для каждого',
        'Объекты не удаляются — утечка',
        'Удаляется только первый объект',
      ],
      correct: 0,
      explain: 'Умный указатель владеет объектом: это RAII для памяти в куче.',
    },
  ],
  exercises: [
    {
      id: 'oop-virtual-destructor-exercise',
      title: 'Зоопарк',
      difficulty: 'beginner',
      description: `
Абстрактный класс \`Animal\` (кличка, чисто виртуальные \`kind()\` и \`sound()\`, виртуальный деструктор) и наследники \`Cat\` (\`кошка\`, \`мяу\`), \`Dog\` (\`собака\`, \`гав\`), \`Parrot\` (\`попугай\`, \`привет\`). Каждая строка ввода — вид (\`cat\`, \`dog\`, \`parrot\`) и кличка. Сложите всех животных в \`std::vector<std::unique_ptr<Animal>>\`, затем напечатайте для каждого \`кличка (вид): звук\` и в конце \`животных N\`.`,
      constraints: ['Строк не больше 50.'],
      hints: [
        'zoo.push_back(std::make_unique<Cat>(name)); — объект создаётся в куче, владеет им вектор.',
        'Обход: for (const auto &a : zoo) — a имеет тип const std::unique_ptr<Animal> &, методы вызываются через ->.',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Animal {
public:
    explicit Animal(std::string name) : name_(std::move(name)) {}
    virtual ~Animal() = default;

    const std::string &name() const {
        return name_;
    }

    virtual std::string kind() const = 0;
    virtual std::string sound() const = 0;

private:
    std::string name_;
};

class Cat : public Animal {
public:
    using Animal::Animal;

    std::string kind() const override {
        return "кошка";
    }

    std::string sound() const override {
        return "мяу";
    }
};

class Dog : public Animal {
public:
    using Animal::Animal;

    std::string kind() const override {
        return "собака";
    }

    std::string sound() const override {
        return "гав";
    }
};

class Parrot : public Animal {
public:
    using Animal::Animal;

    std::string kind() const override {
        return "попугай";
    }

    std::string sound() const override {
        return "привет";
    }
};

int main() {
    std::vector<std::unique_ptr<Animal>> zoo;
    std::string kind, name;
    while (std::cin >> kind >> name) {
        if (kind == "cat") {
            zoo.push_back(std::make_unique<Cat>(name));
        } else if (kind == "dog") {
            zoo.push_back(std::make_unique<Dog>(name));
        } else {
            zoo.push_back(std::make_unique<Parrot>(name));
        }
    }
    for (const auto &a : zoo) {
        std::println("{} ({}): {}", a->name(), a->kind(), a->sound());
    }
    std::println("животных {}", zoo.size());
    return 0;
}`,
      explanation: `
Один вектор владеет животными всех видов: \`unique_ptr<Animal>\` одинакового размера, а сами объекты лежат в куче. Ни одного \`delete\` в программе нет — каждый умный указатель удаляет своё животное при уничтожении вектора. Виртуальный деструктор \`Animal\` гарантирует, что удаление через указатель на базу уничтожит объект целиком, вместе со строкой клички.

По сравнению с прошлыми уроками исчезли и векторы для каждого вида, и \`reserve\`: указатели на объекты в куче не портятся, когда вектор \`unique_ptr\` перевыделяет память.`,
      examples: [
        {
          in: 'cat Мурка\ndog Шарик\nparrot Кеша\n',
          out: 'Мурка (кошка): мяу\nШарик (собака): гав\nКеша (попугай): привет\nживотных 3\n',
        },
        { in: '', out: 'животных 0\n' },
      ],
      hidden: [
        { in: 'cat a\n', name: 'Одна кошка' },
        { in: 'dog a\ndog b\ndog c\n', name: 'Три собаки' },
        { in: 'parrot Гоша\ncat Барсик\n', name: 'Два вида' },
        { in: 'cat Tom\ndog Spike\n', name: 'Латиница' },
        { in: 'parrot p\nparrot q\n', name: 'Попугаи' },
        { in: 'dog Рекс\ncat Рекс\n', name: 'Одинаковые клички' },
        { in: 'cat 1\ndog 2\nparrot 3\ncat 4\n', name: 'Четыре' },
        { in: 'parrot x\n', name: 'Один попугай' },
      ],
    },
    {
      title: 'Порядок уничтожения',
      description: `
Базовый класс \`Job\` (имя) с **виртуальным** деструктором, печатающим \`~Job имя\`. Наследники \`Backup\` и \`Report\` печатают в своих деструкторах \`~Backup имя\` и \`~Report имя\`. Задания хранятся в \`std::vector<std::unique_ptr<Job>>\`.

Команды: \`backup имя\`, \`report имя\`, \`job имя\` — добавить задание; \`done i\` — удалить задание номер \`i\` (с 1) или напечатать \`нет задания i\`; \`stop\` — напечатать \`остановка\` и удалить все задания (\`clear\`). После ввода программа печатает \`конец\`; оставшиеся задания уничтожаются после этого — при уничтожении вектора.`,
      constraints: ['Команд не больше 50.'],
      hints: [
        'Деструктор наследника печатает своё, а после него автоматически вызывается деструктор базы — печатать «~Job» вручную в наследнике не нужно.',
        'Удаление по номеру: jobs.erase(jobs.begin() + (i - 1)); проверьте 1 ≤ i ≤ size.',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Job {
public:
    explicit Job(std::string name) : name_(std::move(name)) {}

    virtual ~Job() {
        std::println("~Job {}", name_);
    }

protected:
    const std::string &name() const {
        return name_;
    }

private:
    std::string name_;
};

class Backup : public Job {
public:
    using Job::Job;

    ~Backup() override {
        std::println("~Backup {}", name());
    }
};

class Report : public Job {
public:
    using Job::Job;

    ~Report() override {
        std::println("~Report {}", name());
    }
};

int main() {
    std::vector<std::unique_ptr<Job>> jobs;
    std::string command;
    while (std::cin >> command) {
        if (command == "stop") {
            std::println("остановка");
            jobs.clear();
            continue;
        }
        if (command == "done") {
            long long i;
            std::cin >> i;
            if (i < 1 || i > static_cast<long long>(jobs.size())) {
                std::println("нет задания {}", i);
            } else {
                jobs.erase(jobs.begin() + (i - 1));
            }
            continue;
        }
        std::string name;
        std::cin >> name;
        if (command == "backup") {
            jobs.push_back(std::make_unique<Backup>(name));
        } else if (command == "report") {
            jobs.push_back(std::make_unique<Report>(name));
        } else {
            jobs.push_back(std::make_unique<Job>(name));
        }
    }
    std::println("конец");
    return 0;
}`,
      explanation: `
Удаление через \`unique_ptr<Job>\` вызывает деструктор настоящего объекта благодаря \`virtual ~Job()\`. После тела деструктора наследника автоматически работает деструктор базы — поэтому для резервной копии печатаются две строки, сначала \`~Backup\`, затем \`~Job\`.

Время жизни объектов связано с вектором: \`erase\` и \`clear\` уничтожают задания сразу, а оставшиеся к концу программы — при уничтожении вектора, уже после строки «конец».`,
      examples: [
        {
          in: 'backup db\nreport week\ndone 1\n',
          out: '~Backup db\n~Job db\nконец\n~Report week\n~Job week\n',
        },
        { in: 'job x\ndone 5\nstop\n', out: 'нет задания 5\nостановка\n~Job x\nконец\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'report a\n', name: 'Одно задание' },
        { in: 'job a\njob b\ndone 2\ndone 1\n', name: 'Удалить все' },
        { in: 'backup a\nreport b\njob c\nstop\nbackup d\n', name: 'Стоп и продолжение' },
        { in: 'done 0\n', name: 'Номер ноль' },
        { in: 'backup x\nbackup y\ndone 2\n', name: 'Две копии' },
        { in: 'report r\njob j\ndone 1\n', name: 'Отчёт удалён' },
        { in: 'job a\nreport b\nbackup c\n', name: 'Уничтожение в конце' },
      ],
    },
    {
      title: 'Найди ошибку: невиртуальный деструктор',
      bug: true,
      description: `
Очередь уведомлений хранит письма и SMS в \`std::vector<std::unique_ptr<Notice>>\`. Строки ввода: \`email адресат тема\` или \`sms номер\`. Программа печатает каждое уведомление и \`отправлено N\`:

\`\`\`text
письмо для ada@example.com: отчёт
отправлено 1
\`\`\`

Вывод правильный, но проверка с AddressSanitizer отклоняет решение. Найдите и исправьте ошибку.`,
      constraints: ['Уведомлений не больше 20.'],
      hints: [
        'Прочитайте отчёт AddressSanitizer: new-delete-type-mismatch. Какой деструктор вызывает unique_ptr<Notice>?',
        'Деструктор Notice не виртуальный — удаление через базу не вызывает деструктор Email и Sms, их строки не освобождаются. Объявите virtual ~Notice() = default;.',
      ],
      starter: NOTICE(false),
      solution: NOTICE(true),
      explanation: `
\`unique_ptr<Notice>\` удаляет объект через указатель на \`Notice\`. Деструктор \`Notice\` не виртуальный, поэтому вызывается только он — деструкторы \`Email\` и \`Sms\` не работают, и их строки-поля не уничтожаются. Вдобавок память объекта размером \`Email\` освобождается как память размера \`Notice\` — неопределённое поведение, которое AddressSanitizer называет \`new-delete-type-mismatch\`.

Одно слово \`virtual\` у деструктора базы делает удаление через базу правильным. Правило простое: в классе с виртуальными функциями всегда объявляйте \`virtual ~Класс() = default;\`.`,
      examples: [
        {
          in: 'email ada@example.com отчёт\n',
          out: 'письмо для ada@example.com: отчёт\nотправлено 1\n',
        },
        { in: 'sms +79001234567\n', out: 'SMS на +79001234567\nотправлено 1\n' },
      ],
      hidden: [
        'email a b\n',
        'sms 1\nsms 2\n',
        'email boss@company.org квартальный_отчёт\nsms +70000000000\n',
        'email x@y.z тема\nemail q@w.e другая\n',
        'sms 112\n',
        'email user@mail.ru напоминание\n',
        'sms 1\nemail a b\nsms 2\n',
        'email long.address.for.testing@example.com очень_длинная_тема_письма\n',
      ],
    },
    {
      title: 'Редактор фигур',
      difficulty: 'advanced',
      description: `
Редактор хранит фигуры в \`std::vector<std::unique_ptr<Shape>>\`. Абстрактный \`Shape\` — с чисто виртуальными \`area()\` и \`name()\` и виртуальным деструктором; наследники \`Circle\` (\`круг\`), \`Rect\` (\`прямоугольник\`), \`Square\` (\`квадрат\`).

Команды:

- \`circle r\`, \`rect w h\`, \`square s\` — добавить фигуру;
- \`remove i\` — удалить фигуру номер \`i\` (с 1) или напечатать \`нет фигуры i\`;
- \`list\` — для каждой фигуры \`i. имя: площадь\` с двумя знаками или \`пусто\`;
- \`largest\` — \`самая большая: имя площадь\` (первая из равных) или \`пусто\`;
- \`total\` — \`всего: S\` с двумя знаками.`,
      constraints: ['Команд не больше 100; размеры от 0.1 до 1000.'],
      hints: [
        'Самую большую удобно искать через std::ranges::max_element(shapes, {}, [](const auto &s) { return s->area(); }) — с проекцией.',
        'Square можно сделать отдельным классом со своей площадью; наследоваться от Rect не обязательно.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <memory>
#include <numbers>
#include <print>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::string name() const = 0;
};

class Circle final : public Shape {
public:
    explicit Circle(double r) : r_(r) {}

    double area() const override {
        return std::numbers::pi * r_ * r_;
    }

    std::string name() const override {
        return "круг";
    }

private:
    double r_;
};

class Rect final : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}

    double area() const override {
        return w_ * h_;
    }

    std::string name() const override {
        return "прямоугольник";
    }

private:
    double w_;
    double h_;
};

class Square final : public Shape {
public:
    explicit Square(double s) : s_(s) {}

    double area() const override {
        return s_ * s_;
    }

    std::string name() const override {
        return "квадрат";
    }

private:
    double s_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    std::string command;
    while (std::cin >> command) {
        if (command == "circle") {
            double r;
            std::cin >> r;
            shapes.push_back(std::make_unique<Circle>(r));
        } else if (command == "rect") {
            double w, h;
            std::cin >> w >> h;
            shapes.push_back(std::make_unique<Rect>(w, h));
        } else if (command == "square") {
            double s;
            std::cin >> s;
            shapes.push_back(std::make_unique<Square>(s));
        } else if (command == "remove") {
            long long i;
            std::cin >> i;
            if (i < 1 || i > static_cast<long long>(shapes.size())) {
                std::println("нет фигуры {}", i);
            } else {
                shapes.erase(shapes.begin() + (i - 1));
            }
        } else if (shapes.empty() && (command == "list" || command == "largest")) {
            std::println("пусто");
        } else if (command == "list") {
            for (std::size_t i = 0; i < shapes.size(); i++) {
                std::println("{}. {}: {:.2f}", i + 1, shapes[i]->name(), shapes[i]->area());
            }
        } else if (command == "largest") {
            const auto &best = *std::ranges::max_element(shapes, {}, [](const auto &s) { return s->area(); });
            std::println("самая большая: {} {:.2f}", best->name(), best->area());
        } else {
            double total = 0;
            for (const auto &s : shapes) {
                total += s->area();
            }
            std::println("всего: {:.2f}", total);
        }
    }
    return 0;
}`,
      explanation: `
Редактор владеет фигурами через один вектор умных указателей: добавление — \`make_unique\`, удаление — \`erase\`, который сразу уничтожает фигуру. Код команд не знает формул площадей: все вызовы виртуальные. Новая фигура — новый класс и одна ветка разбора ввода.

\`std::ranges::max_element\` с проекцией сравнивает фигуры по площади; при равенстве возвращает первую из максимальных. Конкретные фигуры объявлены \`final\` — это листья иерархии.`,
      examples: [
        {
          in: 'circle 1\nrect 2 3\nlist\nlargest\nremove 2\ntotal\n',
          out: '1. круг: 3.14\n2. прямоугольник: 6.00\nсамая большая: прямоугольник 6.00\nвсего: 3.14\n',
        },
        { in: 'list\nremove 1\ntotal\n', out: 'пусто\nнет фигуры 1\nвсего: 0.00\n' },
      ],
      hidden: [
        { in: 'square 2\nrect 1 4\nlargest\n', name: 'Равные площади' },
        { in: 'circle 1000\ntotal\n', name: 'Большой круг' },
        { in: 'square 1\nremove 1\nlist\nlargest\n', name: 'Удалить единственную' },
        { in: 'rect 0.1 0.1\nlist\n', name: 'Маленькая' },
        { in: 'circle 1\ncircle 2\ncircle 3\nremove 2\nlist\n', name: 'Удаление из середины' },
        { in: 'square 3\nremove 0\nremove 2\nlist\n', name: 'Неверные номера' },
        { in: 'rect 2 5\nsquare 3\ncircle 1\nlargest\ntotal\n', name: 'Смесь' },
        { in: 'total\n', name: 'Пустой итог' },
      ],
    },
  ],
};
