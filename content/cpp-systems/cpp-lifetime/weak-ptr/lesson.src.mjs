const NEWSLETTER = (fixed) => String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

struct Reader {
    std::string name;
    int received = 0;
    explicit Reader(std::string n) : name(std::move(n)) {}
};

class Newsletter {
public:
    void subscribe(const std::shared_ptr<Reader> &reader) {
        readers_.push_back(${fixed ? 'reader' : 'reader.get()'});
    }

    void publish(const std::string &title) {
        for (const auto &r : readers_) {
${
  fixed
    ? `            if (auto reader = r.lock()) {
                ++reader->received;
                std::println("{} читает {}", reader->name, title);
            }`
    : `            ++r->received;
            std::println("{} читает {}", r->name, title);`
}
        }
    }

private:
    std::vector<${fixed ? 'std::weak_ptr<Reader>' : 'Reader *'}> readers_;
};

int main() {
    Newsletter news;
    std::map<std::string, std::shared_ptr<Reader>> readers;
    std::string command, arg;
    while (std::cin >> command >> arg) {
        if (command == "join") {
            auto reader = std::make_shared<Reader>(arg);
            news.subscribe(reader);
            readers[arg] = std::move(reader);
        } else if (command == "leave") {
            readers.erase(arg);
        } else {
            news.publish(arg);
        }
    }
    for (const auto &[name, reader] : readers) {
        std::println("{}: получено {}", name, reader->received);
    }
    return 0;
}`;

export default {
  id: 'lifetime-weak-ptr',
  title: 'std::weak_ptr: наблюдение без владения',
  description:
    'Наблюдатель, который не продлевает жизнь объекту: weak_ptr, lock и expired; почему доступ только через lock и проверка expired перед обращением ненадёжна; блок управления живёт ради наблюдателей; кэши, списки подписчиков, ссылки на родителя и колбэки; enable_shared_from_this и weak_from_this; очистка истёкших записей.',
  moduleId: 'cpp-lifetime',
  order: 22,
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  prerequisites: ['lifetime-reference-counting'],
  objectives: [
    'Наблюдать за объектом через weak_ptr, не продлевая ему жизнь',
    'Получать доступ к объекту только через lock',
    'Строить кэши и списки подписчиков на слабых ссылках',
    'Подписывать объект на события через weak_from_this',
  ],
  tags: ['C++23', 'Время жизни', 'weak_ptr', 'Умные указатели', 'Наблюдатель'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что делает weak_ptr с объектом, за которым наблюдает?',
      options: [
        'Не продлевает ему жизнь и не учитывается в use_count',
        'Владеет им вместе с shared_ptr',
        'Удаляет его, когда истекает',
        'Копирует его',
      ],
      correct: 0,
      explain: 'Объект удаляется вместе с последним shared_ptr, сколько бы ни было weak_ptr.',
    },
    {
      q: 'Как правильно обратиться к объекту через weak_ptr w?',
      options: [
        'if (auto sp = w.lock()) { sp->… }',
        'if (!w.expired()) { w->… }',
        'w->…',
        '(*w).…',
      ],
      correct: 0,
      explain: 'У weak_ptr нет операторов доступа; lock атомарно проверяет и захватывает владение.',
    },
    {
      q: 'Почему «if (!w.expired()) { auto sp = w.lock(); sp->f(); }» ненадёжно?',
      options: [
        'Между проверкой и lock другой поток может отпустить последнего владельца',
        'expired всегда возвращает false',
        'lock удаляет объект',
        'Это надёжно',
      ],
      correct: 0,
      explain: 'Результат lock всё равно нужно проверять — а тогда expired лишний.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <memory>
#include <print>

int main() {
    auto a = std::make_shared<int>(5);
    std::weak_ptr<int> w = a;
    auto b = w.lock();
    std::println("{}", a.use_count());
    a.reset();
    std::println("{} {}", w.expired(), *b);
    b.reset();
    std::println("{}", w.expired());
    return 0;
}`,
      lang: 'cpp',
      answers: ['2\nfalse 5\ntrue'],
      placeholder: 'Вывод программы',
      explain: 'lock создал второго владельца b; объект жив, пока жив b.',
    },
    {
      q: 'Когда удаляется блок управления, если остались только weak_ptr?',
      options: [
        'Когда исчезнет последний weak_ptr',
        'Сразу вместе с объектом',
        'Никогда',
        'При вызове lock',
      ],
      correct: 0,
      explain: 'Наблюдателям нужен блок, чтобы узнать, что объект удалён.',
    },
    {
      q: 'Где weak_ptr уместен? Выберите все.',
      options: [
        'Кэш, который не должен держать объекты в памяти',
        'Список подписчиков у издателя',
        'Ссылка ребёнка на родителя при shared_ptr сверху вниз',
        'Единственный владелец объекта',
      ],
      correct: [0, 1, 2],
      explain: 'Владение выражают unique_ptr или shared_ptr.',
    },
    {
      q: 'Как объекту, которым владеет shared_ptr, получить слабую ссылку на себя?',
      options: [
        'Наследовать enable_shared_from_this и вызвать weak_from_this()',
        'std::weak_ptr<T>(this)',
        'std::make_shared<T>(*this)',
        'Никак',
      ],
      correct: 0,
      explain: 'weak_from_this появился в C++17.',
    },
    {
      q: 'Какой метод weak_ptr возвращает shared_ptr на живой объект или пустой shared_ptr?',
      answers: ['lock', 'lock()'],
      placeholder: 'Метод',
      explain: 'Это единственный способ получить доступ к объекту.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-weak-ptr-exercise',
      title: 'Наблюдение за документом',
      difficulty: 'beginner',
      description: `
Документ \`Doc\` печатает \`удалён название\`. Владельцы — \`std::map<std::string, std::shared_ptr<Doc>>\`, наблюдатели — \`std::map<std::string, std::weak_ptr<Doc>>\` (\`operator[]\` создаёт пустые). Команды:

- \`new O название\` — владелец O получает новый документ;
- \`share O2 O\` — O2 становится ещё одним владельцем документа O;
- \`watch W O\` — наблюдатель W следит за документом O;
- \`drop O\` — владелец отпускает документ;
- \`peek W\` — \`W: название (владельцев K)\` или \`W: удалён\`. Число владельцев считайте **до** создания временного владельца в \`lock\` — то есть \`use_count() - 1\` у результата \`lock()\`.

В конце отпустите владельцев от последнего имени к первому.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'if (auto doc = watchers[w].lock()) { … doc.use_count() - 1 … } else { … удалён … }',
        'Наблюдатель от пустого владельца — пустой weak_ptr: lock() вернёт nullptr.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Doc {
    std::string name;
    explicit Doc(std::string n) : name(std::move(n)) {}
    ~Doc() {
        std::println("удалён {}", name);
    }
};

int main() {
    std::map<std::string, std::shared_ptr<Doc>> owners;
    std::map<std::string, std::weak_ptr<Doc>> watchers;
    std::string command, a;
    while (std::cin >> command >> a) {
        if (command == "new") {
            std::string name;
            std::cin >> name;
            owners[a] = std::make_shared<Doc>(name);
        } else if (command == "share") {
            std::string from;
            std::cin >> from;
            owners[a] = owners[from];
        } else if (command == "watch") {
            std::string o;
            std::cin >> o;
            watchers[a] = owners[o];
        } else if (command == "drop") {
            owners[a].reset();
        } else if (auto doc = watchers[a].lock()) {
            std::println("{}: {} (владельцев {})", a, doc->name, doc.use_count() - 1);
        } else {
            std::println("{}: удалён", a);
        }
    }
    for (auto it = owners.rbegin(); it != owners.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
Наблюдатель не входит в число владельцев: документ удаляется, когда его отпустит последний владелец, сколько бы наблюдателей за ним ни следило. \`lock()\` на время проверки создаёт ещё одного владельца — поэтому из \`use_count()\` вычитается единица. После удаления документа \`lock()\` честно возвращает пустой указатель, а не висячий.`,
      examples: [
        {
          in: 'new a отчёт\nshare b a\nwatch w a\npeek w\ndrop a\npeek w\ndrop b\npeek w\n',
          out: 'w: отчёт (владельцев 2)\nw: отчёт (владельцев 1)\nудалён отчёт\nw: удалён\n',
        },
        { in: 'peek x\n', out: 'x: удалён\n' },
      ],
      hidden: [
        { in: 'new a d\nwatch w a\nnew a e\npeek w\n', name: 'Замена документа у владельца' },
        { in: 'watch w nobody\npeek w\n', name: 'Наблюдатель за пустым' },
        {
          in: 'new a d\nwatch w a\nwatch v w\npeek v\n',
          name: 'Имена наблюдателей и владельцев раздельны',
        },
        {
          in: 'new a d\nwatch w a\nwatch w2 a\ndrop a\npeek w\npeek w2\n',
          name: 'Два наблюдателя',
        },
        { in: 'new a d\nshare b a\nshare c b\nwatch w c\npeek w\n', name: 'Три владельца' },
        { in: 'new z 1\nnew a 2\nwatch w z\n', name: 'Удаление в конце' },
        {
          in: 'new a d\nwatch w a\ndrop a\nnew a d\npeek w\n',
          name: 'Новый документ с тем же названием',
        },
        { in: 'new a x\ndrop a\ndrop a\npeek a\n', name: 'Двойной drop' },
      ],
    },
    {
      title: 'Слабый кэш',
      description: `
Картинка \`Image\` печатает \`загружено имя\` и \`выгружено имя\`. Кэш хранит \`std::map<std::string, std::weak_ptr<Image>>\`: \`get(имя)\` возвращает живую картинку из кэша или загружает новую и запоминает слабую ссылку. Окна держат картинки \`std::map<std::string, std::shared_ptr<Image>>\`.

Команды:

- \`show W имя\` — \`windows[W] = cache.get(имя)\`;
- \`close W\` — \`windows[W].reset()\`;
- \`size\` — \`записей N, живых K\`;
- \`prune\` — удалить истёкшие записи и напечатать \`удалено N\`.

В конце закройте окна от последнего имени к первому.`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Живые записи: std::ranges::count_if(slots_, [](const auto &p) { return !p.second.expired(); }); здесь expired уместен — к объекту мы не обращаемся.',
        'prune: std::erase_if(slots_, [](const auto &p) { return p.second.expired(); }) возвращает число удалённых.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>

struct Image {
    std::string name;
    explicit Image(std::string n) : name(std::move(n)) {
        std::println("загружено {}", name);
    }
    ~Image() {
        std::println("выгружено {}", name);
    }
};

class Cache {
public:
    std::shared_ptr<Image> get(const std::string &name) {
        std::weak_ptr<Image> &slot = slots_[name];
        if (auto alive = slot.lock()) {
            return alive;
        }
        auto fresh = std::make_shared<Image>(name);
        slot = fresh;
        return fresh;
    }

    void size() const {
        const auto alive = std::ranges::count_if(slots_, [](const auto &p) { return !p.second.expired(); });
        std::println("записей {}, живых {}", slots_.size(), alive);
    }

    void prune() {
        const auto removed = std::erase_if(slots_, [](const auto &p) { return p.second.expired(); });
        std::println("удалено {}", removed);
    }

private:
    std::map<std::string, std::weak_ptr<Image>> slots_;
};

int main() {
    Cache cache;
    std::map<std::string, std::shared_ptr<Image>> windows;
    std::string command;
    while (std::cin >> command) {
        if (command == "size") {
            cache.size();
        } else if (command == "prune") {
            cache.prune();
        } else {
            std::string w;
            std::cin >> w;
            if (command == "show") {
                std::string name;
                std::cin >> name;
                windows[w] = cache.get(name);
            } else {
                windows[w].reset();
            }
        }
    }
    for (auto it = windows.rbegin(); it != windows.rend(); ++it) {
        it->second.reset();
    }
    return 0;
}`,
      explanation: `
Слабый кэш не влияет на время жизни картинок: они выгружаются, как только их отпустит последнее окно, а кэш лишь помогает не загружать одно и то же дважды, пока картинка кому-то нужна. Цена — истёкшие записи: \`weak_ptr\` не удаляет себя из контейнера, и их приходится чистить.

Сравните с прошлым уроком, где кэш держал \`shared_ptr\`: там картинки жили, пока их не выгнали из кэша явно. Какой вариант выбрать, зависит от того, кто должен решать, сколько живёт объект.`,
      examples: [
        {
          in: 'show w1 кот\nshow w2 кот\nsize\nclose w1\nclose w2\nsize\nprune\nsize\n',
          out: 'загружено кот\nзаписей 1, живых 1\nвыгружено кот\nзаписей 1, живых 0\nудалено 1\nзаписей 0, живых 0\n',
        },
        {
          in: 'show w a\nshow w b\nsize\n',
          out: 'загружено a\nзагружено b\nвыгружено a\nзаписей 2, живых 1\nвыгружено b\n',
        },
      ],
      hidden: [
        { in: 'size\nprune\n', name: 'Пустой кэш' },
        { in: 'show w a\nclose w\nshow v a\n', name: 'Повторная загрузка' },
        { in: 'show w a\nshow v a\nclose w\nsize\n', name: 'Ещё есть владелец' },
        { in: 'show a x\nshow b y\nshow c z\nclose b\nprune\nsize\n', name: 'Чистка одной записи' },
        { in: 'show w a\nshow w a\nsize\n', name: 'То же окно, та же картинка' },
        { in: 'show z 1\nshow a 2\n', name: 'Выгрузка в конце' },
        { in: 'show w a\nclose w\nclose w\nprune\nprune\n', name: 'Повторные операции' },
        {
          in: 'show a p\nshow b q\nclose a\nshow c p\nsize\n',
          name: 'Перезагрузка после выгрузки',
        },
      ],
    },
    {
      title: 'Найди ошибку: мёртвый подписчик',
      bug: true,
      description: `
Рассылка хранит подписчиков. Команды: \`join имя\` — создать читателя (им владеет словарь читателей) и подписать его, \`leave имя\` — читатель уходит и удаляется, \`post заголовок\` — каждый подписчик печатает \`имя читает заголовок\`. В конце печатается, сколько выпусков получил каждый оставшийся читатель.

После ухода любого читателя следующая рассылка обращается к удалённому объекту. Исправьте \`Newsletter\`, не меняя \`main\`.`,
      constraints: ['Команд не больше 200; имена читателей уникальны.'],
      hints: [
        'Как рассылка узнает, что читатель удалён, если хранит сырой указатель?',
        'Храните std::weak_ptr<Reader> и доставляйте только тем, кого удаётся заблокировать через lock().',
      ],
      starter: NEWSLETTER(false),
      solution: NEWSLETTER(true),
      explanation: `
Рассылка хранит \`Reader *\` — сырой указатель, по которому нельзя узнать, жив ли объект. После \`leave\` читатель удалён, а указатель остался в списке, и следующая рассылка пишет в освобождённую память: \`heap-use-after-free\`.

\`std::weak_ptr<Reader>\` решает задачу: рассылка не продлевает жизнь читателям, но перед доставкой проверяет через \`lock()\`, жив ли каждый из них, и на время доставки становится его совладельцем. Ушедшие читатели просто пропускаются.`,
      examples: [
        {
          in: 'join Ада\njoin Алан\npost №1\nleave Ада\npost №2\n',
          out: 'Ада читает №1\nАлан читает №1\nАлан читает №2\nАлан: получено 2\n',
        },
        { in: 'join x\nleave x\npost a\n', out: '' },
      ],
      hidden: [
        'join a\njoin b\nleave b\npost p\n',
        'join a\npost p\nleave a\npost q\n',
        'join a\njoin b\njoin c\nleave a\nleave c\npost p\npost q\n',
        'join длинное-имя-читателя\nleave длинное-имя-читателя\npost a\n',
        'join a\nleave a\njoin b\npost p\n',
        'join p\njoin q\npost 1\nleave p\npost 2\nleave q\npost 3\n',
        'join z\npost x\n',
        'join a\njoin b\nleave a\nleave b\npost p\n',
      ],
    },
    {
      title: 'Шина событий',
      difficulty: 'advanced',
      description: `
Шина \`Bus\` хранит подписки \`std::map<std::string, std::vector<std::weak_ptr<Listener>>>\` (тема → подписчики в порядке подписки). Слушатель \`Listener\` наследует \`std::enable_shared_from_this<Listener>\` и подписывается сам: \`void follow(Bus &bus, const std::string &topic)\` вызывает \`bus.subscribe(topic, weak_from_this())\`. Слушателями владеет \`main\` в \`std::map<std::string, std::shared_ptr<Listener>>\`.

Команды:

- \`new L\` — создать слушателя;
- \`follow L тема\` — подписаться (повторная подписка на ту же тему игнорируется);
- \`drop L\` — удалить слушателя;
- \`publish тема текст\` — доставить живым подписчикам в порядке подписки: \`L получил текст\`; затем удалить из темы истёкшие подписки и, если такие были, напечатать \`очищено N\`;
- \`count тема\` — \`тема: подписок N\` (вместе с истёкшими, ещё не очищенными).`,
      constraints: ['Команд не больше 300.'],
      hints: [
        'Повторная подписка: найдите в векторе weak_ptr, указывающий на тот же объект; сравнить слабые ссылки можно через owner_before или по результату lock().get().',
        'Очистка после доставки: std::erase_if(subs, [](const auto &w) { return w.expired(); }).',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <map>
#include <memory>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Listener;

class Bus {
public:
    void subscribe(const std::string &topic, std::weak_ptr<Listener> listener);
    void publish(const std::string &topic, const std::string &text);
    void count(const std::string &topic) const {
        const auto it = topics_.find(topic);
        std::println("{}: подписок {}", topic, it == topics_.end() ? 0 : it->second.size());
    }

private:
    std::map<std::string, std::vector<std::weak_ptr<Listener>>> topics_;
};

class Listener : public std::enable_shared_from_this<Listener> {
public:
    explicit Listener(std::string name) : name_(std::move(name)) {}

    void follow(Bus &bus, const std::string &topic) {
        bus.subscribe(topic, weak_from_this());
    }

    void receive(const std::string &text) const {
        std::println("{} получил {}", name_, text);
    }

private:
    std::string name_;
};

void Bus::subscribe(const std::string &topic, std::weak_ptr<Listener> listener) {
    auto &subs = topics_[topic];
    const auto self = listener.lock();
    const bool already = std::ranges::any_of(subs, [&](const auto &w) { return w.lock() == self; });
    if (!already) {
        subs.push_back(std::move(listener));
    }
}

void Bus::publish(const std::string &topic, const std::string &text) {
    auto &subs = topics_[topic];
    for (const auto &w : subs) {
        if (auto listener = w.lock()) {
            listener->receive(text);
        }
    }
    const auto removed = std::erase_if(subs, [](const auto &w) { return w.expired(); });
    if (removed > 0) {
        std::println("очищено {}", removed);
    }
}

int main() {
    Bus bus;
    std::map<std::string, std::shared_ptr<Listener>> listeners;
    std::string command, a;
    while (std::cin >> command >> a) {
        if (command == "new") {
            listeners[a] = std::make_shared<Listener>(a);
        } else if (command == "follow") {
            std::string topic;
            std::cin >> topic;
            listeners.at(a)->follow(bus, topic);
        } else if (command == "drop") {
            listeners.erase(a);
        } else if (command == "publish") {
            std::string text;
            std::cin >> text;
            bus.publish(a, text);
        } else {
            bus.count(a);
        }
    }
    return 0;
}`,
      explanation: `
Шина не владеет слушателями и не продлевает им жизнь: подписка — слабая ссылка, которую слушатель отдал сам через \`weak_from_this()\`. Удалённый слушатель перестаёт получать события без отписки, а шина при следующей публикации убирает его мёртвую запись.

\`weak_from_this()\` берёт слабую ссылку из того же блока управления, что у \`shared_ptr\` в \`main\`. Если бы слушатель передал \`this\`, шина хранила бы висячий указатель; если бы \`shared_from_this()\` — шина стала бы совладельцем и не дала бы слушателю умереть.`,
      examples: [
        {
          in: 'new a\nnew b\nfollow a news\nfollow b news\nfollow a news\npublish news привет\ndrop a\ncount news\npublish news пока\ncount news\n',
          out: 'a получил привет\nb получил привет\nnews: подписок 2\nb получил пока\nочищено 1\nnews: подписок 1\n',
        },
        { in: 'publish x y\ncount x\n', out: 'x: подписок 0\n' },
      ],
      hidden: [
        { in: 'new a\nfollow a t\ndrop a\npublish t m\ncount t\n', name: 'Все подписчики удалены' },
        { in: 'new a\nfollow a t1\nfollow a t2\npublish t2 m\npublish t1 n\n', name: 'Две темы' },
        {
          in: 'new a\nnew b\nnew c\nfollow c t\nfollow a t\nfollow b t\npublish t m\n',
          name: 'Порядок подписки',
        },
        {
          in: 'new a\nfollow a t\nnew a\npublish t m\nfollow a t\npublish t n\n',
          name: 'Пересоздание слушателя',
        },
        { in: 'new a\nfollow a t\nfollow a t\nfollow a t\ncount t\n', name: 'Повторная подписка' },
        {
          in: 'new a\nnew b\nfollow a t\nfollow b t\ndrop a\ndrop b\npublish t m\ncount t\n',
          name: 'Очистка двух',
        },
        { in: 'count nothing\n', name: 'Пустая тема' },
        {
          in: 'new a\nfollow a t\npublish t 1\npublish t 2\ndrop a\npublish t 3\npublish t 4\n',
          name: 'Несколько публикаций',
        },
      ],
    },
  ],
};
