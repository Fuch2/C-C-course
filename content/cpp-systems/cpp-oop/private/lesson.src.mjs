const MONEY = (fixed) => String.raw`
#include <cmath>
#include <iostream>
#include <print>

class Money {
public:
    explicit Money(double rubles) : ${fixed ? 'kopecks_(std::llround(rubles * 100))' : 'rubles_(rubles)'} {}

    void add(Money other) {
        ${fixed ? 'kopecks_ += other.kopecks_;' : 'rubles_ += other.rubles_;'}
    }

    bool equals(Money other) const {
        return ${fixed ? 'kopecks_ == other.kopecks_' : 'rubles_ == other.rubles_'};
    }

    void print() const {
        ${fixed ? 'std::println("итого {}.{:02}", kopecks_ / 100, kopecks_ % 100);' : 'std::println("итого {:.2f}", rubles_);'}
    }

private:
    ${fixed ? 'long long kopecks_;' : 'double rubles_;'}
};

int main() {
    double target;
    std::cin >> target;
    Money total(0);
    double amount;
    while (std::cin >> amount) {
        total.add(Money(amount));
    }
    total.print();
    std::println("{}", total.equals(Money(target)) ? "сходится" : "не сходится");
    return 0;
}`;

export default {
  id: 'oop-private',
  title: 'Закрытое представление',
  description:
    'Вторая причина закрывать данные — возможность менять представление, не трогая клиентов: деньги в double и в копейках; доступ private проверяется по классу, а не по объекту; закрытые вспомогательные методы; что открыть, а что спрятать; friend как редкое исключение.',
  moduleId: 'cpp-oop',
  order: 5,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['oop-public'],
  objectives: [
    'Отделять интерфейс от представления данных',
    'Менять представление класса, не меняя клиентов',
    'Выносить вспомогательные операции в закрытые методы',
    'Понимать, когда уместен friend',
  ],
  tags: ['C++23', 'ООП', 'private', 'Представление', 'friend'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Score {
public:
    explicit Score(int v) : v_(v) {}
    bool beats(const Score &other) const { return v_ > other.v_; }

private:
    int v_;
};

int main() {
    Score a(7), b(5);
    std::println("{} {}", a.beats(b), b.beats(a));
    return 0;
}`,
      lang: 'cpp',
      answers: ['true false'],
      placeholder: 'Вывод программы',
      explain:
        'Метод видит закрытое поле другого объекта того же класса: доступ проверяется по классу.',
    },
    {
      q: 'Почему закрытое представление можно заменить без изменения клиентов?',
      options: [
        'Клиенты используют только открытый интерфейс и не знают, как хранятся данные',
        'Компилятор сам переписывает клиентский код',
        'Закрытые поля не занимают памяти',
        'Нельзя — клиентов придётся переписать',
      ],
      correct: 0,
      explain: 'Это вторая причина закрывать данные — наряду с защитой инварианта.',
    },
    {
      q: 'Может ли метод класса Money обратиться к закрытому полю kopecks_ другого объекта Money?',
      options: [
        'Да: private ограничивает доступ для других классов и функций, а не для других объектов того же класса',
        'Нет: каждый объект видит только свои поля',
        'Только если объект передан по указателю',
        'Только в конструкторе',
      ],
      correct: 0,
      explain: 'Поэтому сравнение и сложение объектов удобно писать методами.',
    },
    {
      q: 'Почему деньги не хранят в double?',
      options: [
        'Двоичная дробь не хранит точно 0.1, поэтому суммы перестают сравниваться и накапливают погрешность',
        'double занимает слишком много памяти',
        'double не умеет хранить отрицательные числа',
        'double нельзя напечатать с двумя знаками',
      ],
      correct: 0,
      explain: 'Деньги хранят в целых минимальных единицах — копейках — или в десятичном типе.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <cmath>
#include <print>

int main() {
    long long kopecks = std::llround(19.99 * 3 * 100);
    std::println("{}.{:02}", kopecks / 100, kopecks % 100);
    return 0;
}`,
      lang: 'cpp',
      answers: ['59.97'],
      placeholder: 'Вывод программы',
      explain:
        '19.99 · 3 = 59.97; llround убирает двоичную погрешность, и дальше арифметика целочисленная.',
    },
    {
      q: 'Какие члены класса скорее стоит сделать закрытыми? Выберите все.',
      options: [
        'Поля',
        'Вспомогательные методы промежуточных вычислений',
        'Операции предметной области, нужные клиентам',
        'Детали формата хранения («в копейках»)',
      ],
      correct: [0, 1, 3],
      explain: 'Открывают операции, которые нужны клиенту независимо от способа хранения.',
    },
    {
      q: 'Что даёт объявление friend double dot(Vector2 a, Vector2 b); внутри класса Vector2?',
      options: [
        'Функция dot получает доступ к закрытым членам Vector2, оставаясь обычной функцией',
        'dot становится методом Vector2',
        'Все функции с именем dot получают доступ ко всем классам',
        'Vector2 получает доступ к закрытым членам dot',
      ],
      correct: 0,
      explain: 'Дружбу объявляет сам класс; это часть его интерфейса.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

class Celsius {
public:
    explicit Celsius(double c) : kelvin_(c + 273.15) {}
    double value() const { return kelvin_ - 273.15; }
    void warm(double d) { kelvin_ += d; }

private:
    double kelvin_;
};

int main() {
    Celsius t(20);
    t.warm(5);
    std::println("{:.1f}", t.value());
    return 0;
}`,
      lang: 'cpp',
      answers: ['25.0'],
      placeholder: 'Вывод программы',
      explain: 'Внутри — кельвины, снаружи — градусы Цельсия. Клиент не знает о представлении.',
    },
    {
      q: 'Вы не уверены, понадобится ли метод клиентам. Что безопаснее?',
      options: [
        'Сделать его закрытым: открыть потом легко, а закрыть открытое — значит сломать клиентов',
        'Сделать его открытым на всякий случай',
        'Сделать его friend',
        'Сделать его static',
      ],
      correct: 0,
      explain: 'Закрытое можно менять свободно, открытое — обещание.',
    },
  ],
  exercises: [
    {
      id: 'oop-private-exercise',
      title: 'Температура',
      difficulty: 'beginner',
      description: `
Опишите класс \`Temperature\`, который **хранит температуру в кельвинах** в закрытом поле, а снаружи умеет отдавать её в трёх шкалах: \`celsius()\`, \`fahrenheit()\`, \`kelvin()\`. Создание — статическими функциями \`from_celsius\`, \`from_fahrenheit\`, \`from_kelvin\`.

Каждая строка ввода — шкала (\`C\`, \`F\` или \`K\`) и значение. Напечатайте \`C=… F=… K=…\` с двумя знаками после точки или \`ниже абсолютного нуля\`, если температура в кельвинах отрицательна.`,
      constraints: ['Значения по модулю до 10⁴; строк не больше 20.'],
      hints: [
        'K = C + 273.15; C = (F − 32) · 5 / 9. Обратно: F = C · 9 / 5 + 32.',
        'Статическая функция from_celsius(double c) возвращает Temperature(c + 273.15) через закрытый конструктор от кельвинов.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>

class Temperature {
public:
    static Temperature from_kelvin(double k) {
        return Temperature(k);
    }

    static Temperature from_celsius(double c) {
        return Temperature(c + 273.15);
    }

    static Temperature from_fahrenheit(double f) {
        return from_celsius((f - 32) * 5 / 9);
    }

    double kelvin() const {
        return kelvin_;
    }

    double celsius() const {
        return kelvin_ - 273.15;
    }

    double fahrenheit() const {
        return celsius() * 9 / 5 + 32;
    }

private:
    explicit Temperature(double kelvin) : kelvin_(kelvin) {}
    double kelvin_;
};

int main() {
    char scale;
    double value;
    while (std::cin >> scale >> value) {
        Temperature t = scale == 'C'   ? Temperature::from_celsius(value)
                        : scale == 'F' ? Temperature::from_fahrenheit(value)
                                       : Temperature::from_kelvin(value);
        if (t.kelvin() < 0) {
            std::println("ниже абсолютного нуля");
        } else {
            std::println("C={:.2f} F={:.2f} K={:.2f}", t.celsius(), t.fahrenheit(), t.kelvin());
        }
    }
    return 0;
}`,
      explanation: `
Внутри — одно поле в одной шкале, снаружи — три. Все преобразования сосредоточены в классе, и клиент не знает, что хранится именно кельвин. Если бы понадобилось хранить градусы Цельсия, поменялись бы только тела методов.

Статические функции с говорящими именами решают проблему, которую не решить конструкторами: \`Temperature(double)\` не может означать одновременно «из Цельсия» и «из Фаренгейта» — у них одинаковые параметры. Имена \`from_celsius\` и \`from_fahrenheit\` делают единицы явными.`,
      examples: [
        { in: 'C 25\nF 212\n', out: 'C=25.00 F=77.00 K=298.15\nC=100.00 F=212.00 K=373.15\n' },
        { in: 'K -1\n', out: 'ниже абсолютного нуля\n' },
      ],
      hidden: [
        { in: 'K 0\n', name: 'Абсолютный ноль' },
        { in: 'C -273.15\n', name: 'Ноль в Цельсиях' },
        { in: 'C -300\n', name: 'Ниже нуля в Цельсиях' },
        { in: 'F -40\nC -40\n', name: 'Минус сорок' },
        { in: 'F 32\n', name: 'Замерзание' },
        { in: 'K 10000\n', name: 'Горячо' },
        { in: 'C 36.6\n', name: 'Норма' },
        { in: 'F -500\n', name: 'Ниже нуля в Фаренгейтах' },
      ],
    },
    {
      title: 'Время в секундах',
      description: `
Опишите класс \`Clock\` — время суток. Снаружи — часы, минуты и секунды, а **внутри — одно число секунд от полуночи**. Интерфейс: конструктор \`Clock(int h, int m, int s)\`, метод \`void add(int seconds)\` (время идёт по кругу, секунды могут быть отрицательными) и \`void print() const\` в формате \`ЧЧ:ММ:СС\`.

Первая строка ввода — начальное время \`ч м с\`. Каждая следующая — число секунд, на которое сдвинуть часы. После каждого сдвига напечатайте время.`,
      constraints: ['0 ≤ ч < 24, 0 ≤ м, с < 60; сдвиги по модулю до 10⁹; их не больше 30.'],
      hints: [
        'Нормализация по кругу с учётом отрицательных: ((x % 86400) + 86400) % 86400.',
        'Печать: часы — seconds_ / 3600, минуты — seconds_ / 60 % 60, секунды — seconds_ % 60; формат {:02}.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>

class Clock {
public:
    Clock(int h, int m, int s) : seconds_(normalize(h * 3600LL + m * 60LL + s)) {}

    void add(long long seconds) {
        seconds_ = normalize(seconds_ + seconds);
    }

    void print() const {
        std::println("{:02}:{:02}:{:02}", seconds_ / 3600, seconds_ / 60 % 60, seconds_ % 60);
    }

private:
    static constexpr long long day = 24 * 60 * 60;

    static long long normalize(long long x) {
        return (x % day + day) % day;
    }

    long long seconds_;
};

int main() {
    int h, m, s;
    std::cin >> h >> m >> s;
    Clock clock(h, m, s);
    long long delta;
    while (std::cin >> delta) {
        clock.add(delta);
        clock.print();
    }
    return 0;
}`,
      explanation: `
Хранить время одним числом секунд удобнее, чем тремя полями: сдвиг — одно сложение, переход через полночь — один остаток. Перенос секунд в минуты и минут в часы не нужен вовсе — разложение на части происходит только при печати.

Нормализация вынесена в закрытую статическую функцию: она нужна и конструктору, и \`add\`, но клиенту не интересна. \`(x % day + day) % day\` приводит и отрицательные значения к диапазону \`[0, day)\`: в C++ остаток от отрицательного числа отрицателен.`,
      examples: [
        { in: '23 59 30\n45\n-60\n', out: '00:00:15\n23:59:15\n' },
        { in: '0 0 0\n86400\n-1\n', out: '00:00:00\n23:59:59\n' },
      ],
      hidden: [
        { in: '12 0 0\n3600\n', name: 'Час' },
        { in: '0 0 0\n1000000000\n', name: 'Миллиард секунд' },
        { in: '0 0 0\n-1000000000\n', name: 'Минус миллиард' },
        { in: '10 30 15\n0\n', name: 'Без сдвига' },
        { in: '23 59 59\n1\n1\n', name: 'Полночь' },
        { in: '6 15 0\n-22500\n', name: 'Ровно в полночь' },
        { in: '1 2 3\n59\n61\n', name: 'Через минуту' },
        { in: '18 45 30\n-86401\n', name: 'Сутки назад' },
      ],
    },
    {
      title: 'Найди ошибку: деньги в double',
      bug: true,
      description: `
Первая строка ввода — ожидаемая сумма, следующие — суммы покупок в рублях (с копейками). Программа складывает покупки и печатает \`итого X.XX\`, а затем \`сходится\` или \`не сходится\` — совпадает ли итог с ожидаемой суммой.

Иногда программа говорит «не сходится», хотя суммы равны. Исправьте класс \`Money\`, **не меняя его интерфейс и \`main\`**.`,
      constraints: [
        'Суммы от 0 до 10⁶ с не более чем двумя знаками после точки; покупок не больше 50.',
      ],
      hints: [
        'Сложите 0.1 и 0.2 в double и сравните с 0.3 — равны ли они?',
        'Храните внутри целое число копеек: kopecks_(std::llround(rubles * 100)). Интерфейс (конструктор, add, equals, print) остаётся прежним.',
      ],
      starter: MONEY(false),
      solution: MONEY(true),
      explanation: `
\`0.1\`, \`0.2\` и \`0.3\` не представимы точно в двоичном \`double\`, и \`0.1 + 0.2\` даёт \`0.30000000000000004\`. Печать с двумя знаками это скрывает, а точное сравнение — нет. Чем больше покупок, тем больше накопленная погрешность.

Исправление меняет только представление: конструктор один раз округляет рубли до целых копеек (\`std::llround\`), а дальше вся арифметика целочисленная и точная. Интерфейс и \`main\` не изменились — именно ради такой возможности поле и было закрытым.`,
      examples: [
        { in: '0.3\n0.1\n0.2\n', out: 'итого 0.30\nсходится\n' },
        { in: '5\n2.5\n2.49\n', out: 'итого 4.99\nне сходится\n' },
      ],
      hidden: [
        '1\n0.1\n0.1\n0.1\n0.1\n0.1\n0.1\n0.1\n0.1\n0.1\n0.1\n',
        '100\n99.99\n0.01\n',
        '0\n',
        '1000000\n999999.99\n0.01\n',
        '59.97\n19.99\n19.99\n19.99\n',
        '0.6\n0.2\n0.2\n0.2\n',
        '10.5\n10\n0.5\n',
        '1.11\n0.37\n0.37\n0.37\n',
      ],
    },
    {
      title: 'Множество малых чисел',
      difficulty: 'advanced',
      description: `
Опишите класс \`SmallSet\` — множество чисел от 0 до 63. **Внутри — одно 64-битное число**, где бит \`i\` означает «число \`i\` есть в множестве». Интерфейс: \`void add(int)\`, \`void remove(int)\`, \`bool contains(int) const\`, \`int size() const\` и \`std::string to_string() const\` — элементы по возрастанию в фигурных скобках через запятую с пробелом: \`{1, 5, 63}\` или \`{}\`.

Команды: \`add x\`, \`remove x\`, \`has x\` (\`да\`/\`нет\`), \`size\`, \`print\`. Числа вне 0–63 в \`add\` и \`remove\` игнорируются, а \`has\` для них отвечает \`нет\`.`,
      constraints: ['Команд не больше 100; числа по модулю до 1000.'],
      hints: [
        'Поле — std::uint64_t bits_ = 0. Бит i: std::uint64_t{1} << i. add — |=, remove — &= ~, contains — & != 0.',
        'size — std::popcount(bits_) из <bit>. to_string перебирает i от 0 до 63; удобно вынести проверку диапазона в закрытый статический метод valid(int).',
      ],
      solution: String.raw`
#include <bit>
#include <cstdint>
#include <iostream>
#include <print>
#include <string>

class SmallSet {
public:
    void add(int x) {
        if (valid(x)) {
            bits_ |= bit(x);
        }
    }

    void remove(int x) {
        if (valid(x)) {
            bits_ &= ~bit(x);
        }
    }

    bool contains(int x) const {
        return valid(x) && (bits_ & bit(x)) != 0;
    }

    int size() const {
        return std::popcount(bits_);
    }

    std::string to_string() const {
        std::string out = "{";
        for (int i = 0; i < 64; i++) {
            if (contains(i)) {
                out += out.size() > 1 ? ", " : "";
                out += std::to_string(i);
            }
        }
        return out + "}";
    }

private:
    static bool valid(int x) {
        return x >= 0 && x < 64;
    }

    static std::uint64_t bit(int x) {
        return std::uint64_t{1} << x;
    }

    std::uint64_t bits_ = 0;
};

int main() {
    SmallSet set;
    std::string command;
    while (std::cin >> command) {
        if (command == "size") {
            std::println("{}", set.size());
        } else if (command == "print") {
            std::println("{}", set.to_string());
        } else {
            int x;
            std::cin >> x;
            if (command == "add") {
                set.add(x);
            } else if (command == "remove") {
                set.remove(x);
            } else {
                std::println("{}", set.contains(x) ? "да" : "нет");
            }
        }
    }
    return 0;
}`,
      explanation: `
Клиент видит обычное множество с понятными операциями, а внутри — восемь байт и битовые операции из модуля «Углублённый C». Каждая операция выполняется за несколько машинных команд, а \`std::popcount\` (C++20) подсчитывает элементы одной инструкцией процессора.

Литерал \`std::uint64_t{1}\` важен: \`1 << 40\` в типе \`int\` — неопределённое поведение, сдвигать нужно 64-битную единицу. Проверка диапазона и построение маски — закрытые статические методы: им не нужен объект, а клиенту они не нужны вовсе. Если завтра понадобятся числа до 1000, представление сменится на \`std::bitset\` или вектор — интерфейс останется прежним.`,
      examples: [
        { in: 'add 5\nadd 1\nadd 63\nprint\nsize\n', out: '{1, 5, 63}\n3\n' },
        { in: 'add 64\nadd -1\nhas 64\nprint\n', out: 'нет\n{}\n' },
      ],
      hidden: [
        { in: 'add 0\nhas 0\nremove 0\nhas 0\n', name: 'Ноль' },
        { in: 'add 63\nadd 62\nremove 63\nprint\n', name: 'Старшие биты' },
        { in: 'add 7\nadd 7\nadd 7\nsize\n', name: 'Повторы' },
        { in: 'remove 5\nsize\nprint\n', name: 'Удалить отсутствующее' },
        {
          in: 'add 1\nadd 2\nadd 3\nadd 4\nadd 5\nremove 3\nprint\nsize\n',
          name: 'Последовательность',
        },
        { in: 'has 1000\nhas -1000\n', name: 'Вне диапазона' },
        { in: 'add 32\nadd 31\nadd 33\nprint\n', name: 'Середина' },
        { in: 'print\nsize\n', name: 'Пустое' },
      ],
    },
  ],
};
