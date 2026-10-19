const THERMOSTAT = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

// Инвариант: целевая температура всегда от 10 до 30 градусов.
class Thermostat {
public:
    int target() const {
        return target_;
    }

    void set_target(int value) {
        if (value < 10) {
            value = 10;
        }
        if (value > 30) {
            value = 30;
        }
        target_ = value;
    }

    void warmer() {
        ${fixed ? 'set_target(target_ + 5);' : 'target_ += 5;'}
    }

    void colder() {
        ${fixed ? 'set_target(target_ - 5);' : 'target_ -= 5;'}
    }

private:
    int target_ = 20;
};

int main() {
    Thermostat t;
    std::string command;
    while (std::cin >> command) {
        if (command == "set") {
            int value;
            std::cin >> value;
            t.set_target(value);
        } else if (command == "warmer") {
            t.warmer();
        } else {
            t.colder();
        }
        std::println("{}", t.target());
    }
    return 0;
}`;

export default {
  id: 'oop-class',
  title: 'Класс и инвариант',
  description:
    'Инвариант — правило, верное для объекта всегда; class, public и private: открытый интерфейс и закрытое представление; ошибка компиляции при доступе к закрытому полю; чем struct отличается от class и что выбрать; инвариант с несколькими полями; три способа реагировать на недопустимое значение.',
  moduleId: 'cpp-oop',
  order: 2,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['oop-struct'],
  objectives: [
    'Формулировать инвариант типа',
    'Закрывать данные в private и открывать методы в public',
    'Выбирать между struct и class',
    'Писать методы, которые сохраняют инвариант при любом вызове',
  ],
  tags: ['C++23', 'ООП', 'class', 'Инвариант', 'Инкапсуляция'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Level {
public:
    int get() const { return level_; }
    void up() { if (level_ < 3) level_++; }
    void down() { if (level_ > 1) level_--; }

private:
    int level_ = 1;
};

int main() {
    Level l;
    l.up(); l.up(); l.up(); l.up();
    l.down();
    std::println("{}", l.get());
    return 0;
}`,
      lang: 'cpp',
      answers: ['2'],
      placeholder: 'Вывод программы',
      explain: 'Уровень растёт до 3 и дальше не поднимается; down опускает его до 2.',
    },
    {
      q: 'Что такое инвариант класса?',
      options: [
        'Правило о данных объекта, которое верно всегда — после создания и после любого открытого метода',
        'Поле, которое нельзя изменить',
        'Метод, который вызывается при создании объекта',
        'Константа внутри класса',
      ],
      correct: 0,
      explain: 'Например, «громкость от 0 до 100» или «нижняя граница не больше верхней».',
    },
    {
      q: 'Чем struct отличается от class в C++?',
      options: [
        'Только доступом по умолчанию: в struct всё открыто, в class — закрыто',
        'У struct не бывает методов',
        'struct нельзя наследовать',
        'Объекты class хранятся в куче',
      ],
      correct: 0,
      explain: 'Всё остальное у них одинаковое. Выбор — вопрос смысла: есть ли у данных правила.',
    },
    {
      q: 'Что произойдёт при компиляции строки p.volume_ = 250; если volume_ объявлено в секции private класса Player?',
      options: [
        'Ошибка компиляции: поле закрыто',
        'Значение запишется, но будет исправлено на 100',
        'Ошибка во время выполнения',
        'Предупреждение, программа соберётся',
      ],
      correct: 0,
      explain: 'Доступ проверяет компилятор; обойти private из обычного кода нельзя.',
    },
    {
      q: 'Почему для диапазона [low, high] метод set(a, b) лучше, чем два метода set_low и set_high?',
      options: [
        'Между двумя отдельными вызовами объект может оказаться в состоянии low > high',
        'Один метод работает быстрее двух',
        'Методы с одним параметром запрещены',
        'set_low и set_high нельзя сделать public',
      ],
      correct: 0,
      explain: 'Связанные поля меняют вместе — тогда инвариант не нарушается ни на мгновение.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Stock {
public:
    int count() const { return count_; }
    bool take(int n) {
        if (n > count_) return false;
        count_ -= n;
        return true;
    }

private:
    int count_ = 10;
};

int main() {
    Stock s;
    bool a = s.take(4), b = s.take(7), c = s.take(6);
    std::println("{} {} {} {}", a, b, c, s.count());
    return 0;
}`,
      lang: 'cpp',
      answers: ['true false true 0'],
      placeholder: 'Вывод программы',
      explain: '10 − 4 = 6; взять 7 нельзя — отказ без изменения; взять 6 можно — остаётся 0.',
    },
    {
      q: 'Какие варианты реакции метода на недопустимое значение корректны? Выберите все.',
      options: [
        'Исправить значение, если исправление очевидно, и сохранить',
        'Отказаться, не меняя объект, и сообщить об этом результатом',
        'Сообщить об ошибке исключением',
        'Записать значение, а проверить его при следующем вызове',
      ],
      correct: [0, 1, 2],
      explain: 'Запрещено одно: оставить объект в недопустимом состоянии.',
    },
    {
      q: 'Для какого типа уместна struct с открытыми полями?',
      options: [
        'RGB-цвет: любые три значения 0–255 допустимы',
        'Банковский счёт с правилом «баланс не меньше нуля»',
        'Дробь, у которой знаменатель не равен нулю',
        'Очередь с ограниченной ёмкостью',
      ],
      correct: 0,
      explain:
        'У цвета нет правил, связывающих поля, — защищать нечего. У остальных типов есть инварианты.',
    },
    {
      q: 'Метод класса Player пишет volume_ += 10; напрямую, хотя в классе есть проверяющий set_volume. Что не так?',
      options: [
        'Метод имеет доступ к полю и обходит проверку — инвариант может нарушиться изнутри',
        'Методы не могут менять поля',
        'Ничего: внутри класса правило не действует',
        'Это ошибка компиляции',
      ],
      correct: 0,
      explain: 'private защищает от кода снаружи, но не от ошибок в методах самого класса.',
    },
  ],
  exercises: [
    {
      id: 'oop-class-exercise',
      title: 'Громкость',
      difficulty: 'beginner',
      description: `
Опишите класс \`Volume\` с закрытым полем — громкостью от 0 до 100 (начальное значение 50) — и методами \`int get() const\` и \`void set(int value)\`, который приводит значение к границам. Каждая строка ввода — команда:

- \`+ n\` — громче на \`n\`;
- \`- n\` — тише на \`n\`;
- \`= n\` — установить \`n\`.

После каждой команды напечатайте текущую громкость.`,
      constraints: ['Команд не больше 50; n от 0 до 1000.'],
      hints: [
        'Все три команды выражаются через set: set(get() + n), set(get() - n), set(n).',
        'Приведение к границам: если value < 0 — 0, если value > 100 — 100.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>

class Volume {
public:
    int get() const {
        return value_;
    }

    void set(int value) {
        if (value < 0) {
            value = 0;
        }
        if (value > 100) {
            value = 100;
        }
        value_ = value;
    }

private:
    int value_ = 50;
};

int main() {
    Volume v;
    char command;
    int n;
    while (std::cin >> command >> n) {
        if (command == '+') {
            v.set(v.get() + n);
        } else if (command == '-') {
            v.set(v.get() - n);
        } else {
            v.set(n);
        }
        std::println("{}", v.get());
    }
    return 0;
}`,
      explanation: `
Правило «от 0 до 100» проверяется в одном месте — в \`set\`. Все изменения проходят через этот метод, поэтому никакая команда не может вывести громкость за границы. Добавьте завтра команду «тише вдвое» — достаточно выразить её через \`set\`, и правило будет соблюдено автоматически.`,
      examples: [
        { in: '+ 30\n+ 30\n- 5\n', out: '80\n100\n95\n' },
        { in: '= 1000\n- 1000\n', out: '100\n0\n' },
      ],
      hidden: [
        { in: '+ 0\n', name: 'Без изменения' },
        { in: '- 50\n', name: 'Ровно до нуля' },
        { in: '+ 50\n', name: 'Ровно до ста' },
        { in: '= 37\n+ 3\n- 40\n', name: 'Установка' },
        { in: '- 1\n- 1\n- 100\n+ 1\n', name: 'Ниже нуля' },
        { in: '+ 1000\n+ 1000\n- 1\n', name: 'Выше ста' },
        { in: '= 0\n= 100\n= 50\n', name: 'Границы' },
        { in: '', name: 'Без команд' },
      ],
    },
    {
      title: 'Лифт',
      description: `
Опишите класс \`Elevator\` для дома из 20 этажей. Лифт стоит на первом этаже. Метод \`bool move_to(int floor)\` отправляет лифт на этаж \`floor\` и возвращает \`true\`, а если такого этажа нет (меньше 1 или больше 20) — возвращает \`false\` и ничего не меняет. Лифт считает, сколько этажей проехал.

Для каждого числа из ввода вызовите \`move_to\` и напечатайте \`этаж F\` (текущий этаж) или \`нет этажа N\`. В конце напечатайте \`пройдено K этажей\`.`,
      constraints: ['Чисел не больше 50, каждое по модулю до 1000.'],
      hints: [
        'Закрытые поля: floor_ = 1 и travelled_ = 0. Метод floor() const возвращает текущий этаж.',
        'Сначала проверка — потом изменение: если этажа нет, return false до любых присваиваний. Пройденный путь — модуль разности этажей, std::abs из <cstdlib>.',
      ],
      solution: String.raw`
#include <cstdlib>
#include <iostream>
#include <print>

class Elevator {
public:
    int floor() const {
        return floor_;
    }

    int travelled() const {
        return travelled_;
    }

    bool move_to(int target) {
        if (target < 1 || target > 20) {
            return false;
        }
        travelled_ += std::abs(target - floor_);
        floor_ = target;
        return true;
    }

private:
    int floor_ = 1;
    int travelled_ = 0;
};

int main() {
    Elevator lift;
    int target;
    while (std::cin >> target) {
        if (lift.move_to(target)) {
            std::println("этаж {}", lift.floor());
        } else {
            std::println("нет этажа {}", target);
        }
    }
    std::println("пройдено {} этажей", lift.travelled());
    return 0;
}`,
      explanation: `
Инвариант лифта — «этаж от 1 до 20». \`move_to\` проверяет запрос **до** изменения полей и при отказе ничего не трогает: и этаж, и счётчик пути остаются прежними. Результат \`bool\` сообщает вызывающему коду, удалась ли поездка, — решать, что печатать, остаётся ему.

Счётчик пути закрыт так же, как этаж: снаружи его можно только прочитать, а увеличивается он единственным способом — настоящей поездкой.`,
      examples: [
        { in: '5 3 25 20\n', out: 'этаж 5\nэтаж 3\nнет этажа 25\nэтаж 20\nпройдено 23 этажей\n' },
        { in: '', out: 'пройдено 0 этажей\n' },
      ],
      hidden: [
        { in: '1\n', name: 'Тот же этаж' },
        { in: '0 -5 21\n', name: 'Только неверные' },
        { in: '20 1 20 1\n', name: 'Туда и обратно' },
        { in: '2 3 4 5\n', name: 'По одному' },
        { in: '1000 -1000 10\n', name: 'Большие числа' },
        { in: '7 7 7\n', name: 'Повторы' },
        { in: '19 0 2\n', name: 'Отказ посередине' },
        { in: '10 11 9 12 8\n', name: 'Зигзаг' },
      ],
    },
    {
      title: 'Найди ошибку: метод в обход правила',
      bug: true,
      description: `
Класс \`Thermostat\` хранит целевую температуру и обещает, что она всегда от 10 до 30 градусов (начальное значение 20). Команды ввода: \`set n\` — установить, \`warmer\` — на 5 градусов теплее, \`colder\` — на 5 холоднее. После каждой команды печатается текущая цель.

После нескольких команд \`warmer\` температура выходит за 30. Найдите и исправьте ошибку в классе.`,
      constraints: ['Команд не больше 50; в set — числа по модулю до 1000.'],
      hints: [
        'Через какой путь проверку проходит set, а через какой — warmer и colder?',
        'Методы класса имеют доступ к закрытому полю и могут обойти проверку. Выразите warmer и colder через set_target.',
      ],
      starter: THERMOSTAT(false),
      solution: THERMOSTAT(true),
      explanation: `
\`private\` защищает поле от кода **снаружи** класса, но методы самого класса пишут в него напрямую. \`warmer\` и \`colder\` меняли \`target_\` в обход проверки, и инвариант нарушался изнутри.

Надёжный приём — один «шлюз» для изменения поля: все изменяющие методы выражаются через проверяющий \`set_target\`. Тогда правило записано один раз, и новый метод, написанный через тот же шлюз, не сможет его нарушить.`,
      examples: [
        { in: 'warmer\nwarmer\nwarmer\n', out: '25\n30\n30\n' },
        { in: 'set 12\ncolder\n', out: '12\n10\n' },
      ],
      hidden: [
        'set 1000\nwarmer\n',
        'colder\ncolder\ncolder\n',
        'set -1000\ncolder\nwarmer\n',
        'warmer\nwarmer\nwarmer\nwarmer\ncolder\n',
        'set 29\nwarmer\n',
        'set 11\ncolder\n',
        'colder\nwarmer\nwarmer\nwarmer\n',
        'set 15\n',
      ],
    },
    {
      title: 'Окно на экране',
      difficulty: 'advanced',
      description: `
Экран — 1920 × 1080 точек. Класс \`Window\` хранит позицию левого верхнего угла \`x\`, \`y\` и размеры \`w\`, \`h\` и обещает:

- окно целиком на экране: \`x ≥ 0\`, \`y ≥ 0\`, \`x + w ≤ 1920\`, \`y + h ≤ 1080\`;
- окно не меньше 100 × 100.

Начальное состояние: \`0 0 800 600\`. Команды:

- \`move dx dy\` — сдвинуть; если окно выходит за край, оно останавливается у края (новая позиция приводится к границам \`[0, 1920 − w]\` и \`[0, 1080 − h]\`);
- \`resize w h\` — новые размеры, приведённые к границам \`[100, 1920 − x]\` и \`[100, 1080 − y]\`; позиция не меняется.

После каждой команды напечатайте \`x y w h\`.`,
      constraints: ['Команд не больше 50; числа по модулю до 10⁵.'],
      hints: [
        'Удобна вспомогательная функция clamp(value, low, high) — или std::clamp из <algorithm>.',
        'move меняет только позицию и ограничивает её с учётом текущего размера; resize меняет только размер и ограничивает его с учётом текущей позиции. Почему тогда диапазон [100, 1920 − x] никогда не бывает пустым?',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>

class Window {
public:
    void move(int dx, int dy) {
        x_ = std::clamp(x_ + dx, 0, screen_w - w_);
        y_ = std::clamp(y_ + dy, 0, screen_h - h_);
    }

    void resize(int w, int h) {
        w_ = std::clamp(w, min_size, screen_w - x_);
        h_ = std::clamp(h, min_size, screen_h - y_);
    }

    void print() const {
        std::println("{} {} {} {}", x_, y_, w_, h_);
    }

private:
    static constexpr int screen_w = 1920;
    static constexpr int screen_h = 1080;
    static constexpr int min_size = 100;
    int x_ = 0;
    int y_ = 0;
    int w_ = 800;
    int h_ = 600;
};

int main() {
    Window window;
    std::string command;
    int a, b;
    while (std::cin >> command >> a >> b) {
        if (command == "move") {
            window.move(a, b);
        } else {
            window.resize(a, b);
        }
        window.print();
    }
    return 0;
}`,
      explanation: `
Инвариант связывает четыре поля, и каждый метод сохраняет его, меняя только «свою» половину: \`move\` — позицию, ограничивая её текущим размером, \`resize\` — размер, ограничивая его текущей позицией. Диапазон для размера никогда не пуст: окно уже на экране и шире 100, значит \`1920 − x ≥ w ≥ 100\`.

Размеры экрана и минимум записаны как \`static constexpr\` — константы, общие для всех окон и известные при компиляции. \`std::clamp\` из \`<algorithm>\` возвращает значение, приведённое к отрезку; он требует, чтобы нижняя граница не превышала верхнюю, — и инвариант это гарантирует.`,
      examples: [
        { in: 'move 1500 100\nresize 2000 50\n', out: '1120 100 800 600\n1120 100 800 100\n' },
        { in: 'move -50 -50\nresize 1920 1080\n', out: '0 0 800 600\n0 0 1920 1080\n' },
      ],
      hidden: [
        { in: 'resize 1920 1080\nmove 10 10\n', name: 'Во весь экран' },
        { in: 'move 100000 100000\nresize 100000 100000\n', name: 'Огромные сдвиги' },
        { in: 'resize 0 0\nmove 1820 980\n', name: 'Минимальное окно в угол' },
        { in: 'move 500 300\nresize 1500 900\nmove -1000 -1000\n', name: 'Сдвиг после увеличения' },
        { in: 'resize 100 100\nmove 1819 979\nresize 500 500\n', name: 'Почти у края' },
        { in: 'move 0 0\n', name: 'Нулевой сдвиг' },
        { in: 'move 1119 479\nmove 1 1\nmove 1 1\n', name: 'Упор в край' },
        { in: 'resize -5 -5\nresize 99999 50\n', name: 'Отрицательные размеры' },
      ],
    },
  ],
};
