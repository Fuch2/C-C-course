const IMAGE = (fixed) => String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>

class Image {
public:
    Image(int w, int h, int fill) : w_(w), h_(h), pixels_(new int[w * h]) {
        std::fill_n(pixels_, w_ * h_, fill);
    }
    ~Image() {
        delete[] pixels_;
    }
${fixed ? '    Image(const Image &) = delete;\n    Image &operator=(const Image &) = delete;\n' : ''}
    void paint(int x, int y, int value) {
        pixels_[y * w_ + x] = value;
    }

    int width() const {
        return w_;
    }
    int height() const {
        return h_;
    }

    long long brightness() const {
        long long sum = 0;
        for (int i = 0; i < w_ * h_; ++i) {
            sum += pixels_[i];
        }
        return sum / (w_ * h_);
    }

private:
    int w_, h_;
    int *pixels_;
};

void report(${fixed ? 'const Image &img' : 'Image img'}) {
    std::println("{}x{}, средняя яркость {}", img.width(), img.height(), img.brightness());
}

int main() {
    int w, h, fill;
    std::cin >> w >> h >> fill;
    Image img(w, h, fill);
    std::string command;
    while (std::cin >> command) {
        if (command == "paint") {
            int x, y, v;
            std::cin >> x >> y >> v;
            img.paint(x, y, v);
        } else {
            report(img);
        }
    }
    return 0;
}`;

export default {
  id: 'lifetime-shallow-copy',
  title: 'Поверхностное копирование',
  description:
    'Неявное копирование указателя копирует адрес; поверхностная копия правильна для заёмщиков и разрушительна для владельцев: двойное освобождение и висячие указатели после передачи по значению; правило диагностики «одно new — два права на delete»; лечение глубокой копией, запретом копирования, общим владением или полями, которые копируются сами.',
  moduleId: 'cpp-lifetime',
  order: 8,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['lifetime-copy-assignment'],
  objectives: [
    'Понимать, что копирование указателя копирует адрес',
    'Отличать допустимую поверхностную копию заёмщика от ошибочной копии владельца',
    'Диагностировать двойное освобождение после копирования',
    'Выбирать лечение по смыслу типа',
  ],
  tags: ['C++23', 'Время жизни', 'Копирование', 'double free', 'Указатели'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что копирует неявный конструктор копирования для поля int *p?',
      options: [
        'Адрес: копия указывает на тот же int',
        'Сам int в новый блок памяти',
        'Ничего — поле остаётся пустым',
        'Зависит от компилятора',
      ],
      correct: 0,
      explain: 'Это и есть поверхностная копия.',
    },
    {
      q: 'Когда поверхностная копия правильна?',
      options: [
        'Когда указатель — заёмщик и копии должны видеть один объект',
        'Когда класс удаляет указатель в деструкторе',
        'Никогда',
        'Когда объект маленький',
      ],
      correct: 0,
      explain: 'Наблюдатель, представление, итератор — типичные заёмщики.',
    },
    {
      q: 'Класс выделяет int в конструкторе и удаляет в деструкторе, своих операций копирования нет. Что произойдёт после Box b = a; в конце блока?',
      options: [
        'Двойное освобождение одного блока',
        'Утечка',
        'Ничего особенного',
        'Ошибка компиляции',
      ],
      correct: 0,
      explain: 'Оба деструктора вызовут delete для одного адреса.',
    },
    {
      q: 'Что сообщит AddressSanitizer при повторном delete того же адреса?',
      options: [
        'attempting double-free',
        'heap-buffer-overflow',
        'stack-use-after-scope',
        'memory leak',
      ],
      correct: 0,
      explain: 'Обращение к памяти между двумя delete — heap-use-after-free.',
    },
    {
      q: 'Какие способы действительно исправляют класс-владелец с сырым указателем? Выберите все.',
      options: [
        'Глубокое копирование в конструкторе копирования и присваивании',
        'Запрет копирования через = delete',
        'Замена поля на std::unique_ptr или значение',
        'Удаление delete из деструктора',
      ],
      correct: [0, 1, 2],
      explain: 'Удаление delete меняет двойное освобождение на утечку.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Pair {
    int *a;
    int *b;
};

int main() {
    int x = 1, y = 2;
    Pair p{&x, &y};
    Pair q = p;
    *q.a = 10;
    q.b = &x;
    std::println("{} {} {}", x, *p.b, *q.b);
    return 0;
}`,
      lang: 'cpp',
      answers: ['10 2 10'],
      placeholder: 'Вывод программы',
      explain:
        'q.a указывает на тот же x, поэтому *q.a = 10 меняет x. Перенаправление q.b не затрагивает p.b.',
    },
    {
      q: 'Почему поле std::unique_ptr<int> лучше поля int * для владельца?',
      options: [
        'Неявное копирование класса становится запрещённым — ошибка ловится при компиляции',
        'unique_ptr копирует объект глубоко',
        'unique_ptr быстрее',
        'unique_ptr можно не освобождать — он в стеке',
      ],
      correct: 0,
      explain: 'unique_ptr некопируем, поэтому и класс с таким полем некопируем по умолчанию.',
    },
    {
      q: 'Как по-английски называется ошибка повторного освобождения одной и той же памяти?',
      answers: ['double free', 'double-free', 'double delete'],
      placeholder: 'Два слова',
      explain: 'Неопределённое поведение, часто проявляется далеко от причины.',
    },
  ],
  exercises: [
    {
      id: 'lifetime-shallow-copy-exercise',
      title: 'Наблюдатели счёта',
      difficulty: 'beginner',
      description: `
Счёт \`Account { long long balance; }\` — один, им владеет \`main\`. Наблюдатель \`View\` хранит метку и указатель \`const Account *\`; копирование наблюдателя поверхностное (неявное) — копия смотрит на тот же счёт.

Команды:

- \`view имя\` — создать наблюдателя;
- \`copy новое старое\` — новый наблюдатель — копия старого с другой меткой;
- \`deposit x\` / \`withdraw x\` — изменить баланс счёта;
- \`show имя\` — напечатать \`имя: баланс B\`.`,
      constraints: ['Команд не больше 200; суммы до 10⁹; баланс может быть отрицательным.'],
      hints: [
        'Наблюдателей храните в std::map<std::string, View>; копия: View v = views.at(old); v.label = name; views.insert_or_assign(name, v);',
        'Указатель на счёт остаётся действительным: Account живёт в main дольше всех наблюдателей.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>

struct Account {
    long long balance = 0;
};

struct View {
    std::string label;
    const Account *account;

    void show() const {
        std::println("{}: баланс {}", label, account->balance);
    }
};

int main() {
    Account account;
    std::map<std::string, View> views;
    std::string command;
    while (std::cin >> command) {
        if (command == "view") {
            std::string name;
            std::cin >> name;
            views.insert_or_assign(name, View{name, &account});
        } else if (command == "copy") {
            std::string name, old;
            std::cin >> name >> old;
            View copy = views.at(old);
            copy.label = name;
            views.insert_or_assign(name, copy);
        } else if (command == "deposit" || command == "withdraw") {
            long long x;
            std::cin >> x;
            account.balance += command == "deposit" ? x : -x;
        } else {
            std::string name;
            std::cin >> name;
            views.at(name).show();
        }
    }
    return 0;
}`,
      explanation: `
Копия наблюдателя получает свою метку (строка копируется глубоко), но указатель на счёт — тот же адрес. Поэтому все наблюдатели видят одно и то же состояние, и это правильно: наблюдатель ничем не владеет и ничего не удаляет. Поверхностная копия становится ошибкой только у владельцев.`,
      examples: [
        {
          in: 'view a\ncopy b a\ndeposit 500\nshow a\nwithdraw 200\nshow b\n',
          out: 'a: баланс 500\nb: баланс 300\n',
        },
        { in: 'view x\nshow x\n', out: 'x: баланс 0\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'view a\nwithdraw 50\nshow a\n', name: 'Отрицательный баланс' },
        { in: 'view a\ncopy b a\ncopy c b\ndeposit 1\nshow c\n', name: 'Копия копии' },
        { in: 'deposit 1000000000\ndeposit 1000000000\nview z\nshow z\n', name: 'Большие суммы' },
        {
          in: 'view a\ndeposit 5\ncopy b a\ndeposit 5\nshow a\nshow b\n',
          name: 'Копия видит новые изменения',
        },
        { in: 'view a\nview a\nshow a\n', name: 'Повторное создание' },
        {
          in: 'view p\ncopy q p\nwithdraw 1\ndeposit 2\nshow p\nshow q\n',
          name: 'Два наблюдателя',
        },
        { in: 'view a\ncopy a a\nshow a\n', name: 'Копия в себя' },
      ],
    },
    {
      title: 'Документы и стили',
      description: `
Стили \`Style { std::string name; int font; }\` хранятся в таблице стилей \`std::map<std::string, Style>\` — она ими владеет. Документ \`Doc\` хранит строки \`std::vector<std::string>\` и указатель \`const Style *\` на свой стиль. Неявное копирование документа копирует строки **глубоко**, а стиль — **поверхностно**.

Команды:

- \`style S F\` — создать стиль S или изменить его шрифт на F;
- \`doc D S\` — создать пустой документ D со стилем S;
- \`copy D2 D1\` — документ D2 становится копией D1;
- \`line D текст\` — добавить строку (одно слово);
- \`show D\` — \`D: N строк, стиль S, шрифт F\`.`,
      constraints: [
        'Команд не больше 200; doc ссылается на существующий стиль; copy, line и show — на существующие документы.',
      ],
      hints: [
        'Адрес элемента std::map не меняется при вставке других элементов, поэтому указатель на стиль остаётся действительным.',
        'Изменение шрифта: styles[S] — найдёт существующий стиль или создаст новый; все документы со стилем S сразу увидят новый шрифт.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <vector>

struct Style {
    std::string name;
    int font = 0;
};

struct Doc {
    std::vector<std::string> lines;
    const Style *style = nullptr;
};

int main() {
    std::map<std::string, Style> styles;
    std::map<std::string, Doc> docs;
    std::string command, a;
    while (std::cin >> command >> a) {
        if (command == "style") {
            int font;
            std::cin >> font;
            Style &s = styles[a];
            s.name = a;
            s.font = font;
        } else if (command == "doc") {
            std::string s;
            std::cin >> s;
            docs.insert_or_assign(a, Doc{{}, &styles.at(s)});
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            const Doc copy = docs.at(from);
            docs.insert_or_assign(a, copy);
        } else if (command == "line") {
            std::string text;
            std::cin >> text;
            docs.at(a).lines.push_back(text);
        } else {
            const Doc &d = docs.at(a);
            std::println("{}: {} строк, стиль {}, шрифт {}", a, d.lines.size(), d.style->name, d.style->font);
        }
    }
    return 0;
}`,
      explanation: `
Один и тот же неявный конструктор копирования делает разное для разных полей: вектор строк копирует элементы, указатель — только адрес. Поэтому строки у копии свои, а стиль общий — и именно этого мы хотим: стиль принадлежит таблице стилей, документы только ссылаются на него.

Когда вы смотрите на класс, задавайте вопрос для каждого поля-указателя: это владение или заимствование? От ответа зависит, правильна ли неявная копия.`,
      examples: [
        {
          in: 'style main 12\ndoc a main\nline a привет\ncopy b a\nline b мир\nstyle main 14\nshow a\nshow b\n',
          out: 'a: 1 строк, стиль main, шрифт 14\nb: 2 строк, стиль main, шрифт 14\n',
        },
        { in: 'style s 10\ndoc d s\nshow d\n', out: 'd: 0 строк, стиль s, шрифт 10\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        {
          in: 'style a 1\nstyle b 2\ndoc x a\ndoc y b\ncopy y x\nshow y\n',
          name: 'Копия меняет стиль',
        },
        {
          in: 'style s 10\ndoc d s\nline d 1\nline d 2\ncopy e d\nline d 3\nshow d\nshow e\n',
          name: 'Строки независимы',
        },
        { in: 'style s 10\ndoc d s\ncopy e d\nstyle s 20\nshow d\nshow e\n', name: 'Стиль общий' },
        { in: 'style s 1\ndoc d s\ncopy d d\nshow d\n', name: 'Копия в себя' },
        {
          in: 'style s 5\ndoc a s\ncopy b a\ncopy c b\nstyle s 7\nshow c\n',
          name: 'Цепочка копий',
        },
        {
          in: 'style a 1\ndoc d a\nstyle b 2\nstyle c 3\nshow d\n',
          name: 'Новые стили не портят указатель',
        },
        { in: 'style s 9\ndoc d s\nline d x\ndoc d s\nshow d\n', name: 'Пересоздание документа' },
      ],
    },
    {
      title: 'Найди ошибку: изображение по значению',
      bug: true,
      description: `
Первая строка — ширина, высота и начальная яркость пикселей. Дальше команды: \`paint x y v\` — записать яркость пикселя, \`report\` — напечатать \`WxH, средняя яркость B\` (целая часть среднего).

После первого же \`report\` следующие команды работают с испорченными данными, а в конце AddressSanitizer сообщает об ошибке. Исправьте класс так, чтобы подобная ошибка стала **ошибкой компиляции**, а затем — место вызова.`,
      constraints: ['1 ≤ W, H ≤ 100; яркость от 0 до 255; координаты корректны.'],
      hints: [
        'Сколько объектов Image владеют одним массивом пикселей после вызова report(img)?',
        'Запретите копирование: Image(const Image &) = delete; и то же для присваивания. Компилятор укажет на report — передавайте изображение по константной ссылке.',
      ],
      starter: IMAGE(false),
      solution: IMAGE(true),
      explanation: `
\`report\` принимает изображение по значению, и неявный конструктор копирования создаёт копию с тем же указателем \`pixels_\`. Деструктор копии при выходе из \`report\` освобождает массив, а оригинал продолжает им пользоваться: следующий \`paint\` или \`report\` — \`heap-use-after-free\`, а в конце \`main\` — повторный \`delete[]\`.

Запрет копирования выражает смысл класса: изображение — единственный владелец своих пикселей. После этого передача по значению не компилируется, и единственный правильный вариант — константная ссылка.`,
      examples: [
        {
          in: '2 2 10\nreport\npaint 0 0 50\nreport\n',
          out: '2x2, средняя яркость 10\n2x2, средняя яркость 20\n',
        },
        { in: '1 1 0\npaint 0 0 255\nreport\n', out: '1x1, средняя яркость 255\n' },
      ],
      hidden: [
        '3 3 100\nreport\n',
        '2 1 0\nreport\nreport\n',
        '4 4 1\npaint 3 3 17\nreport\npaint 0 0 17\nreport\n',
        '100 100 255\nreport\n',
        '1 2 7\nreport\npaint 0 1 9\nreport\n',
        '5 1 2\npaint 4 0 3\nreport\n',
        '2 2 0\nreport\npaint 1 1 4\nreport\nreport\n',
        '3 1 9\nreport\n',
      ],
    },
    {
      title: 'Аудит указателей',
      difficulty: 'advanced',
      description: `
Смоделируйте сырые указатели и найдите ошибки владения. Блоки памяти нумеруются 1, 2, 3, … в порядке выделения. Команды:

- \`new X\` — переменная X указывает на новый блок;
- \`copy Y X\` — Y указывает туда же, куда X (поверхностная копия);
- \`null X\` — X = nullptr;
- \`delete X\` — если X пуст: \`delete X: nullptr, ничего не делает\`; если блок жив: освободить и напечатать \`освобождён блок N\`; если уже освобождён: \`двойное освобождение блока N\`;
- \`use X\` — \`X: блок N\`, \`X: обращение к освобождённому блоку N\` или \`X: разыменование nullptr\`.

В конце напечатайте \`утечка блока N\` для каждого неосвобождённого блока в порядке номеров или \`утечек нет\`.`,
      constraints: [
        'Команд не больше 300; copy, delete и use применяются только к переменным, которым уже что-то присвоено.',
      ],
      hints: [
        'Переменная хранит номер блока (0 — nullptr): std::map<std::string, int>. Блоки: std::vector<bool> freed, индекс — номер блока.',
        'delete не меняет саму переменную: после delete X переменная X по-прежнему хранит номер освобождённого блока — так же, как настоящий указатель.',
      ],
      solution: String.raw`
#include <iostream>
#include <map>
#include <print>
#include <string>
#include <vector>

int main() {
    std::map<std::string, int> vars;
    std::vector<bool> freed{false};
    std::string command, x;
    while (std::cin >> command >> x) {
        if (command == "new") {
            freed.push_back(false);
            vars[x] = static_cast<int>(freed.size()) - 1;
        } else if (command == "copy") {
            std::string from;
            std::cin >> from;
            vars[x] = vars.at(from);
        } else if (command == "null") {
            vars[x] = 0;
        } else {
            const int block = vars.at(x);
            if (command == "delete") {
                if (block == 0) {
                    std::println("delete {}: nullptr, ничего не делает", x);
                } else if (freed[block]) {
                    std::println("двойное освобождение блока {}", block);
                } else {
                    freed[block] = true;
                    std::println("освобождён блок {}", block);
                }
            } else if (block == 0) {
                std::println("{}: разыменование nullptr", x);
            } else if (freed[block]) {
                std::println("{}: обращение к освобождённому блоку {}", x, block);
            } else {
                std::println("{}: блок {}", x, block);
            }
        }
    }
    bool leaks = false;
    for (std::size_t i = 1; i < freed.size(); ++i) {
        if (!freed[i]) {
            std::println("утечка блока {}", i);
            leaks = true;
        }
    }
    if (!leaks) {
        std::println("утечек нет");
    }
    return 0;
}`,
      explanation: `
Модель показывает три классические ошибки сырых указателей. Двойное освобождение — два «владельца» одного блока после поверхностной копии. Обращение к освобождённому блоку — указатель пережил блок, и \`delete\` его не обнулил. Утечка — блок, который никто не освободил, например потому что последний указатель на него перезаписали.

Настоящая программа такой бухгалтерии не ведёт — поэтому ошибки и опасны. AddressSanitizer ведёт похожий учёт во время выполнения, а умные указатели и RAII делают эти ошибки невозможными по построению.`,
      examples: [
        {
          in: 'new p\ncopy q p\ndelete p\nuse q\ndelete q\nnew r\n',
          out: 'освобождён блок 1\nq: обращение к освобождённому блоку 1\nдвойное освобождение блока 1\nутечка блока 2\n',
        },
        {
          in: 'new a\nuse a\ndelete a\nnull a\ndelete a\n',
          out: 'a: блок 1\nосвобождён блок 1\ndelete a: nullptr, ничего не делает\nутечек нет\n',
        },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'new a\nnew a\ndelete a\n', name: 'Перезапись указателя — утечка' },
        { in: 'null a\nuse a\n', name: 'Разыменование nullptr' },
        { in: 'new a\ncopy b a\ncopy c b\ndelete c\nuse a\nuse b\n', name: 'Три псевдонима' },
        { in: 'new a\nnew b\nnew c\ndelete b\n', name: 'Две утечки' },
        { in: 'new a\ndelete a\ndelete a\ndelete a\n', name: 'Тройное освобождение' },
        { in: 'new a\nnew b\ncopy a b\ndelete a\ndelete b\n', name: 'Потерянный блок и двойное' },
        { in: 'new x\ndelete x\nnew x\nuse x\ndelete x\n', name: 'Повторное выделение' },
      ],
    },
  ],
};
