const STORAGE = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <stdexcept>
#include <string>
#include <utility>

${
  fixed
    ? `class Readable {
public:
    virtual ~Readable() = default;
    virtual std::string read() const = 0;
};

class Writable {
public:
    virtual ~Writable() = default;
    virtual void write(const std::string &text) = 0;
};

class Archive final : public Readable {
public:
    explicit Archive(std::string text) : text_(std::move(text)) {}
    std::string read() const override {
        return text_;
    }

private:
    std::string text_;
};

class Journal final : public Readable, public Writable {
public:
    std::string read() const override {
        return text_;
    }
    void write(const std::string &text) override {
        text_ += text;
    }

private:
    std::string text_;
};

void copy_to(const Readable &from, Writable &to) {
    to.write(from.read());
}`
    : `class Storage {
public:
    virtual ~Storage() = default;
    virtual std::string read() const = 0;
    virtual void write(const std::string &text) = 0;
};

class Archive final : public Storage {
public:
    explicit Archive(std::string text) : text_(std::move(text)) {}
    std::string read() const override {
        return text_;
    }
    void write(const std::string &) override {
        throw std::logic_error("архив только для чтения");
    }

private:
    std::string text_;
};

class Journal final : public Storage {
public:
    std::string read() const override {
        return text_;
    }
    void write(const std::string &text) override {
        text_ += text;
    }

private:
    std::string text_;
};

void copy_to(Storage &from, Storage &to) {
    to.write(from.read());
}`
}

int main() {
    Archive archive("[архив]");
    Journal journal;
    std::string command;
    while (std::cin >> command) {
        if (command == "note") {
            std::string text;
            std::cin >> text;
            journal.write(text);
        } else if (command == "restore") {
            ${fixed ? 'copy_to(archive, journal);' : 'copy_to(journal, archive);'}
        } else if (command == "backup") {
            std::println("резервная копия: {}", journal.read());
        }
    }
    std::println("журнал: {}", journal.read());
    return 0;
}`;

export default {
  id: 'oop-interfaces',
  title: 'Интерфейсы',
  description:
    'Интерфейс в C++ — только открытые чисто виртуальные функции и виртуальный деструктор; способность вместо родства; реализация нескольких интерфейсов; принцип разделения интерфейсов и методы-заглушки; зависимость от абстракции, внедрение и подмена реализаций — принцип инверсии зависимостей. Второй этап проекта «Система обработки датчиков».',
  moduleId: 'cpp-oop',
  order: 24,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['oop-slicing'],
  objectives: [
    'Описывать способности объектов интерфейсами',
    'Реализовывать несколько интерфейсов в одном классе',
    'Делить толстые интерфейсы на маленькие',
    'Писать логику, зависящую от интерфейса, и подменять реализацию',
  ],
  tags: ['C++23', 'ООП', 'Интерфейс', 'SOLID', 'Проект'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что входит в интерфейс в C++? Выберите все.',
      options: [
        'Открытые чисто виртуальные функции',
        'Виртуальный деструктор',
        'Поля с данными',
        'Реализации методов',
      ],
      correct: [0, 1],
      explain: 'Поля и реализации превращают интерфейс в абстрактный класс.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Named {
    virtual ~Named() = default;
    virtual const char *name() const = 0;
};

struct Counted {
    virtual ~Counted() = default;
    virtual int count() const = 0;
};

struct Team final : Named, Counted {
    const char *name() const override { return "Альфа"; }
    int count() const override { return 5; }
};

int main() {
    Team t;
    const Named &n = t;
    const Counted &c = t;
    std::println("{} {}", n.name(), c.count());
    return 0;
}`,
      lang: 'cpp',
      answers: ['Альфа 5'],
      placeholder: 'Вывод программы',
      explain: 'Один объект реализует оба интерфейса и виден через ссылку на любой из них.',
    },
    {
      q: 'Почему множественное наследование интерфейсов безопасно?',
      options: [
        'У интерфейсов нет данных, поэтому нечему дублироваться и конфликтовать',
        'C++ запрещает одинаковые имена в интерфейсах',
        'Интерфейсы не занимают памяти вообще',
        'Оно не безопасно',
      ],
      correct: 0,
      explain: 'Проблемы множественного наследования возникают из-за общих данных в базах.',
    },
    {
      q: 'О чём говорит принцип разделения интерфейсов?',
      options: [
        'Много маленьких интерфейсов лучше одного большого: клиент зависит только от того, чем пользуется',
        'Каждый класс должен реализовать ровно один интерфейс',
        'Интерфейсы нужно объявлять в отдельных файлах',
        'Методы интерфейса должны быть закрытыми',
      ],
      correct: 0,
      explain: 'Буква I в SOLID.',
    },
    {
      q: 'Класс реализует интерфейс Storage, но его метод write бросает «не поддерживается». Что это значит?',
      options: [
        'Интерфейс слишком толстый: ошибка проявится во время работы, хотя могла бы при компиляции',
        'Так правильно реализуют интерфейсы',
        'Нужно добавить виртуальный деструктор',
        'Метод нужно сделать final',
      ],
      correct: 0,
      explain: 'Разделите интерфейс, чтобы класс реализовывал только то, что умеет.',
    },
    {
      q: 'Что утверждает принцип инверсии зависимостей?',
      options: [
        'Логика верхнего уровня и детали зависят от абстракций, а не логика — от конкретных деталей',
        'Классы наследников должны зависеть от базы',
        'Зависимости нужно создавать внутри класса',
        'Зависимостей не должно быть',
      ],
      correct: 0,
      explain: 'Буква D в SOLID: OrderService зависит от Sender, а не от ConsoleSender.',
    },
    {
      q: 'Зачем в тесте передавать OrderService «подставной» CountingSender?',
      options: [
        'Чтобы проверить логику, не отправляя настоящих сообщений, и посчитать вызовы',
        'Чтобы ускорить компиляцию',
        'Потому что настоящий отправитель нельзя создать',
        'Чтобы обойти виртуальные функции',
      ],
      correct: 0,
      explain: 'Зависимость от интерфейса позволяет подменять реализацию.',
    },
    {
      q: 'Чего не хватает в интерфейсе class Sender { public: virtual void send(const std::string &) = 0; }; если объекты удаляют через std::unique_ptr<Sender>?',
      answers: [
        'виртуального деструктора',
        'virtual ~Sender() = default;',
        'virtual ~Sender() = default',
      ],
      placeholder: 'Ответ',
      explain: 'Без него удаление через указатель на интерфейс — неопределённое поведение.',
    },
  ],
  exercises: [
    {
      id: 'oop-interfaces-exercise',
      title: 'Печать и цены',
      difficulty: 'beginner',
      description: `
Два интерфейса: \`Printable\` (\`std::string text() const\`) и \`Priced\` (\`long long price() const\`). Классы: \`Book\` (название, цена) — реализует оба, текст \`книга «название»\`; \`Delivery\` (цена) — только \`Priced\`; \`Note\` (текст) — только \`Printable\`, текст — сама заметка.

Строки ввода: \`book название цена\`, \`delivery цена\`, \`note текст\` (одно слово). Сначала напечатайте тексты всех печатаемых объектов в порядке ввода (функция \`void print_all(const std::vector<const Printable *> &)\`), затем \`итого S\` — сумму цен всех объектов с ценой (функция \`long long total(const std::vector<const Priced *> &)\`).`,
      constraints: ['Строк не больше 30; цены до 10⁶.'],
      hints: [
        'Объекты храните в std::vector<std::unique_ptr<…>> конкретных типов или по отдельности; для книги кладите указатель и в вектор Printable, и в вектор Priced.',
        'Один объект Book можно добавить в оба вектора: &*book_ptr превращается и в const Printable *, и в const Priced *.',
      ],
      solution: String.raw`
#include <iostream>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Printable {
public:
    virtual ~Printable() = default;
    virtual std::string text() const = 0;
};

class Priced {
public:
    virtual ~Priced() = default;
    virtual long long price() const = 0;
};

class Book final : public Printable, public Priced {
public:
    Book(std::string title, long long price) : title_(std::move(title)), price_(price) {}
    std::string text() const override {
        return "книга «" + title_ + "»";
    }
    long long price() const override {
        return price_;
    }

private:
    std::string title_;
    long long price_;
};

class Delivery final : public Priced {
public:
    explicit Delivery(long long price) : price_(price) {}
    long long price() const override {
        return price_;
    }

private:
    long long price_;
};

class Note final : public Printable {
public:
    explicit Note(std::string text) : text_(std::move(text)) {}
    std::string text() const override {
        return text_;
    }

private:
    std::string text_;
};

void print_all(const std::vector<const Printable *> &items) {
    for (const Printable *p : items) {
        std::println("{}", p->text());
    }
}

long long total(const std::vector<const Priced *> &items) {
    long long sum = 0;
    for (const Priced *p : items) {
        sum += p->price();
    }
    return sum;
}

int main() {
    std::vector<std::unique_ptr<Book>> books;
    std::vector<std::unique_ptr<Delivery>> deliveries;
    std::vector<std::unique_ptr<Note>> notes;
    std::vector<const Printable *> printable;
    std::vector<const Priced *> priced;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "book") {
            std::string title;
            long long price;
            std::cin >> title >> price;
            books.push_back(std::make_unique<Book>(title, price));
            printable.push_back(books.back().get());
            priced.push_back(books.back().get());
        } else if (kind == "delivery") {
            long long price;
            std::cin >> price;
            deliveries.push_back(std::make_unique<Delivery>(price));
            priced.push_back(deliveries.back().get());
        } else {
            std::string text;
            std::cin >> text;
            notes.push_back(std::make_unique<Note>(text));
            printable.push_back(notes.back().get());
        }
    }
    print_all(printable);
    std::println("итого {}", total(priced));
    return 0;
}`,
      explanation: `
Книга, доставка и заметка ничем не родственны — у них разные способности. Интерфейсы описывают именно способности, и каждая функция требует ровно то, что использует: \`print_all\` — печать, \`total\` — цену. Книга умеет и то и другое и попадает в оба списка.

Объекты принадлежат векторам \`unique_ptr\`, а списки интерфейсов лишь указывают на них. Указатели на объекты в куче не портятся при росте векторов \`unique_ptr\`, поэтому \`reserve\` не нужен.`,
      examples: [
        {
          in: 'book Дюна 900\ndelivery 300\nnote срочно\n',
          out: 'книга «Дюна»\nсрочно\nитого 1200\n',
        },
        { in: '', out: 'итого 0\n' },
      ],
      hidden: [
        { in: 'note a\nnote b\n', name: 'Только заметки' },
        { in: 'delivery 1\ndelivery 2\n', name: 'Только доставка' },
        { in: 'book Кобзарь 1000000\n', name: 'Дорогая книга' },
        { in: 'note x\nbook y 5\nnote z\n', name: 'Порядок печати' },
        { in: 'book a 1\nbook b 2\ndelivery 3\n', name: 'Две книги' },
        { in: 'delivery 0\n', name: 'Бесплатная доставка' },
        { in: 'book Война 700\nnote подарок\ndelivery 250\nbook Мир 700\n', name: 'Заказ' },
        { in: 'note только_текст\n', name: 'Одна заметка' },
      ],
    },
    {
      title: 'Подменный отправитель',
      description: `
Интерфейс \`Sender\` с методом \`void send(const std::string &to, const std::string &text)\`. Класс \`OrderService\` получает ссылку на \`Sender\` в конструкторе и в методе \`place(customer, amount)\` отправляет \`заказ на N принят\` — если сумма положительна, иначе ничего не делает. Реализации:

- \`ConsoleSender\` печатает \`для имя: текст\`;
- \`RecordingSender\` ничего не печатает, а запоминает получателей.

Первое слово ввода — \`console\` или \`record\` — выбирает реализацию. Затем строки \`имя сумма\`. После всех заказов для \`record\` напечатайте \`отправлено N: имена через пробел\` (или \`отправлено 0\`); для \`console\` — ничего дополнительно.`,
      constraints: ['Заказов не больше 30; суммы по модулю до 10⁶.'],
      hints: [
        'OrderService хранит Sender &sender_ и не знает, какая реализация ему досталась.',
        'RecordingSender: std::vector<std::string> recipients_; send добавляет to; метод recipients() const возвращает константную ссылку на вектор.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Sender {
public:
    virtual ~Sender() = default;
    virtual void send(const std::string &to, const std::string &text) = 0;
};

class ConsoleSender final : public Sender {
public:
    void send(const std::string &to, const std::string &text) override {
        std::println("для {}: {}", to, text);
    }
};

class RecordingSender final : public Sender {
public:
    void send(const std::string &to, const std::string &) override {
        recipients_.push_back(to);
    }

    const std::vector<std::string> &recipients() const {
        return recipients_;
    }

private:
    std::vector<std::string> recipients_;
};

class OrderService {
public:
    explicit OrderService(Sender &sender) : sender_(sender) {}

    void place(const std::string &customer, long long amount) {
        if (amount > 0) {
            sender_.send(customer, "заказ на " + std::to_string(amount) + " принят");
        }
    }

private:
    Sender &sender_;
};

void run(Sender &sender) {
    OrderService service(sender);
    std::string name;
    long long amount;
    while (std::cin >> name >> amount) {
        service.place(name, amount);
    }
}

int main() {
    std::string mode;
    std::cin >> mode;
    if (mode == "console") {
        ConsoleSender console;
        run(console);
    } else {
        RecordingSender recorder;
        run(recorder);
        std::string names;
        for (const std::string &n : recorder.recipients()) {
            names += " " + n;
        }
        std::println("отправлено {}{}", recorder.recipients().size(), names.empty() ? "" : ":" + names);
    }
    return 0;
}`,
      explanation: `
\`OrderService\` и \`run\` написаны против интерфейса и работают с любой реализацией. Проверочный \`RecordingSender\` позволяет убедиться, что сервис отправляет уведомления нужным людям и не отправляет при неположительной сумме, — без настоящей отправки и без разбора напечатанного текста.

Это и есть смысл инверсии зависимостей: логика магазина не зависит от способа доставки сообщений. Завтра появится отправка в мессенджер — сервис не изменится.`,
      examples: [
        { in: 'console\nАда 1500\nАлан 0\n', out: 'для Ада: заказ на 1500 принят\n' },
        { in: 'record\na 1\nb 0\nc 5\n', out: 'отправлено 2: a c\n' },
      ],
      hidden: [
        { in: 'record\n', name: 'Пустая запись' },
        { in: 'console\n', name: 'Пустая консоль' },
        { in: 'record\nx -5\n', name: 'Отрицательная сумма' },
        { in: 'console\na 1\nb 2\n', name: 'Две отправки' },
        { in: 'record\nИван 100\nИван 200\n', name: 'Один получатель дважды' },
        { in: 'console\nbig 1000000\n', name: 'Большая сумма' },
        { in: 'record\np 1\nq 1\nr 1\ns 0\n', name: 'Три из четырёх' },
        { in: 'console\nz 0\n', name: 'Ничего не отправлено' },
      ],
    },
    {
      title: 'Найди ошибку: толстый интерфейс',
      bug: true,
      description: `
Журнал пополняется заметками (\`note слово\`), команда \`restore\` дописывает в журнал содержимое архива \`[архив]\`, \`backup\` печатает текущее содержимое журнала. В конце печатается \`журнал: …\`.

Программа написана с одним интерфейсом \`Storage\` (чтение и запись), и архив вынужден реализовать запись заглушкой. Команда \`restore\` приводит к аварийному завершению. Найдите причину и исправьте устройство интерфейсов так, чтобы попытка записать в архив стала **ошибкой компиляции**.`,
      constraints: ['Команд не больше 30.'],
      hints: [
        'Что делает copy_to(archive, journal), если перепутать аргументы? А что происходит сейчас?',
        'Разделите Storage на Readable (read) и Writable (write). Архив реализует только Readable, журнал — оба. copy_to принимает const Readable & и Writable &.',
      ],
      starter: STORAGE(false),
      solution: STORAGE(true),
      explanation: `
В \`main\` перепутаны аргументы: \`copy_to(journal, archive)\` копирует из журнала в архив. \`copy_to(Storage &from, Storage &to)\` принимает два хранилища с одинаковыми возможностями, поэтому компилятор не возражает, а метод-заглушка архива бросает \`std::logic_error\`, которое никто не ловит, — программа завершается через \`std::terminate\`. Толстый интерфейс сделал ошибку возможной и спрятал её до запуска.

Поменять аргументы местами мало: такая же ошибка повторится в следующей функции. После разделения архив вообще не умеет писать: он реализует только \`Readable\`, и передать его туда, где нужен \`Writable\`, — ошибка компиляции. \`copy_to(const Readable &, Writable &)\` своими типами говорит, откуда и куда копируются данные.`,
      examples: [
        { in: 'note a\nrestore\nnote b\n', out: 'журнал: a[архив]b\n' },
        { in: 'note x\nbackup\n', out: 'резервная копия: x\nжурнал: x\n' },
      ],
      hidden: [
        'restore\n',
        'restore\nrestore\n',
        'note q\nrestore\nbackup\n',
        'backup\n',
        'note one\nnote two\nrestore\n',
        'restore\nnote end\n',
        'note a\nbackup\nrestore\nbackup\n',
        'note только\n',
      ],
    },
    {
      id: 'oop-project-filter',
      title: 'Проект, этап 2: фильтр измерений',
      difficulty: 'advanced',
      description: `
Второй этап проекта. К моделям датчиков из первого этапа (\`Measurement\`, интерфейс \`Sensor\`, \`TemperatureSensor\`, \`PressureSensor\`) добавьте класс \`Filter\`:

- конструктор \`Filter(int low, int high)\` бросает \`std::invalid_argument\`, если \`low > high\`; границы закрыты;
- \`bool accepts(const Measurement &m) const\` — \`low ≤ m.value ≤ high\`.

Первая строка ввода — \`low high\`, затем строки датчиков \`T id калибровка raw\` или \`P id калибровка raw\`. Если диапазон некорректен, напечатайте \`некорректный диапазон\` и завершитесь. Иначе для каждого измерения, прошедшего фильтр, напечатайте \`id value\`, а в конце \`принято K из N\`. Фильтр применяется к **преобразованному** значению, а не к сырому.`,
      constraints: [
        '−10 000 ≤ low, high ≤ 10 000; строк датчиков до 100; id от 1 до 1000; калибровка от −10 до 10; raw от −1000 до 1000.',
      ],
      hints: [
        'Создание фильтра — в try; catch (const std::invalid_argument &) печатает сообщение и завершает программу.',
        'Сначала measure(sensor, raw) из первого этапа, потом filter.accepts(m). Фильтр ничего не знает о видах датчиков — только о Measurement.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <stdexcept>

struct Measurement {
    int sensorId;
    int value;
};

class Sensor {
public:
    virtual ~Sensor() = default;
    virtual Measurement read(int raw) const = 0;
};

class TemperatureSensor final : public Sensor {
public:
    TemperatureSensor(int id, int offset) : id_(id), offset_(offset) {}
    Measurement read(int raw) const override {
        return {id_, raw + offset_};
    }

private:
    int id_;
    int offset_;
};

class PressureSensor final : public Sensor {
public:
    PressureSensor(int id, int scale) : id_(id), scale_(scale) {}
    Measurement read(int raw) const override {
        return {id_, raw * scale_};
    }

private:
    int id_;
    int scale_;
};

class Filter {
public:
    Filter(int low, int high) : low_(low), high_(high) {
        if (low > high) {
            throw std::invalid_argument("некорректный диапазон");
        }
    }

    bool accepts(const Measurement &m) const {
        return low_ <= m.value && m.value <= high_;
    }

private:
    int low_;
    int high_;
};

Measurement measure(const Sensor &sensor, int raw) {
    return sensor.read(raw);
}

int main() {
    int low, high;
    std::cin >> low >> high;
    try {
        const Filter filter(low, high);
        char type;
        int id, calibration, raw;
        int accepted = 0, total = 0;
        while (std::cin >> type >> id >> calibration >> raw) {
            const Measurement m = type == 'T' ? measure(TemperatureSensor(id, calibration), raw)
                                              : measure(PressureSensor(id, calibration), raw);
            total++;
            if (filter.accepts(m)) {
                std::println("{} {}", m.sensorId, m.value);
                accepted++;
            }
        }
        std::println("принято {} из {}", accepted, total);
    } catch (const std::invalid_argument &e) {
        std::println("{}", e.what());
    }
    return 0;
}`,
      explanation: `
Фильтр — класс с инвариантом «нижняя граница не больше верхней», и конструктор либо устанавливает его, либо отказывается создавать объект. Поэтому \`accepts\` не проверяет границы: некорректного фильтра не существует.

Фильтр работает с \`Measurement\` и ничего не знает о датчиках, а датчики — о фильтре. Связывает их внешний код: прочитать через интерфейс \`Sensor\`, затем проверить. На третьем этапе эту связь возьмёт на себя процессор телеметрии, который будет владеть набором датчиков.`,
      examples: [
        { in: '0 20\nT 1 2 8\nP 2 3 7\nP 3 2 5\n', out: '1 10\n3 10\nпринято 2 из 3\n' },
        { in: '1 -1\nT 1 0 0\n', out: 'некорректный диапазон\n' },
      ],
      hidden: [
        { in: '0 0\nP 9 0 1000\nT 2 -5 5\n', name: 'Точечный диапазон' },
        { in: '1 2\nT 1 0 -10\nP 2 2 5\n', name: 'Ничего не принято' },
        { in: '-10000 10000\nP 1 10 1000\nP 2 -10 1000\n', name: 'Широкий диапазон' },
        { in: '5 5\nT 42 2 3\n', name: 'Ровно граница' },
        { in: '-20 -1\nT 8 -2 -3\nP 2 2 -10\nP 4 -1 2\n', name: 'Отрицательные' },
        {
          in: '0 10\nT 7 -5 5\nP 7 2 5\nT 3 1 10\nP 4 -1 1\n',
          name: 'Фильтр после преобразования',
        },
        { in: '3 2\n', name: 'Некорректный без датчиков' },
        { in: '-1 1\n', name: 'Без датчиков' },
      ],
    },
  ],
};
