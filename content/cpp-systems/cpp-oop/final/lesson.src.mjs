const CARDS = (fixed) => String.raw`
#include <iostream>
#include <print>
#include <string>

class Payment {
public:
    virtual ~Payment() = default;
    virtual bool authorize(long long amount) const = 0;
    virtual std::string name() const = 0;
};

class CardPayment : public Payment {
public:
    // Обязательное правило для всех карт: сумма положительна и не больше лимита.
    bool authorize(long long amount) const ${fixed ? 'final' : 'override'} {
        return amount > 0 && amount <= limit();
    }

protected:
    virtual long long limit() const {
        return 50000;
    }
};

class DebitCard final : public CardPayment {
public:
    std::string name() const override {
        return "дебетовая";
    }
};

class GoldCard final : public CardPayment {
public:
    std::string name() const override {
        return "золотая";
    }

${
  fixed
    ? `protected:
    long long limit() const override {
        return 1000000;
    }`
    : `    bool authorize(long long amount) const override {
        return amount <= 1000000;
    }`
}
};

void check(const Payment &p, long long amount) {
    std::println("{} {}: {}", p.name(), amount, p.authorize(amount) ? "одобрено" : "отказ");
}

int main() {
    DebitCard debit;
    GoldCard gold;
    std::string kind;
    long long amount;
    while (std::cin >> kind >> amount) {
        if (kind == "gold") {
            check(gold, amount);
        } else {
            check(debit, amount);
        }
    }
    return 0;
}`;

export default {
  id: 'oop-final',
  title: 'final: закрываем расширение',
  description:
    'Наследование нужно проектировать; final на классе запрещает наследовать, final на функции — переопределять дальше; типы-значения и листья иерархии; обязательное правило как финальная функция с одной точкой расширения; final подразумевает override; девиртуализация; почему снять final безопасно, а добавить — нет.',
  moduleId: 'cpp-oop',
  order: 18,
  difficulty: 'intermediate',
  estimatedMinutes: 35,
  prerequisites: ['oop-override'],
  objectives: [
    'Закрывать классы, не предназначенные для наследования',
    'Фиксировать обязательные правила финальными функциями',
    'Оставлять наследникам узкие точки расширения',
  ],
  tags: ['C++23', 'ООП', 'final', 'Наследование'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что запрещает запись class Money final { … };?',
      options: [
        'Наследовать от Money',
        'Создавать объекты Money',
        'Копировать Money',
        'Изменять поля Money',
      ],
      correct: 0,
      explain:
        'final на классе закрывает его для наследования; всем остальным он пользуется как обычно.',
    },
    {
      q: 'Что запрещает final у виртуальной функции bool authorize(long long) const final?',
      options: [
        'Переопределять её в наследниках этого класса',
        'Вызывать её через ссылку на базу',
        'Переопределять её в этом классе',
        'Вызывать её у константных объектов',
      ],
      correct: 0,
      explain: 'Переопределение становится последним: правило фиксируется для всех наследников.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <print>

struct Base {
    virtual ~Base() = default;
    virtual int step() const { return 1; }
    int run() const { return step() * 10; }
};

struct Middle : Base {
    int step() const final { return 2; }
};

struct Leaf final : Middle {};

int main() {
    Leaf leaf;
    const Base &b = leaf;
    std::println("{}", b.run());
    return 0;
}`,
      lang: 'cpp',
      answers: ['20'],
      placeholder: 'Вывод программы',
      explain: 'Leaf наследует финальную версию step из Middle.',
    },
    {
      q: 'Что верно о final у функции? Выберите все.',
      options: [
        'Он подразумевает override: функция обязана переопределять виртуальную функцию базы',
        'Наследники не могут переопределить функцию',
        'Он делает класс абстрактным',
        'Его можно указать у невиртуальной функции, которая ничего не переопределяет',
      ],
      correct: [0, 1],
      explain: 'final у функции, которая ничего не переопределяет, — ошибка компиляции.',
    },
    {
      q: 'Почему типы-значения (деньги, дата, координаты) удобно объявлять final?',
      options: [
        'Наследник мог бы добавить поля, теряющиеся при копировании в базовый тип, или изменить смысл операций',
        'Иначе их нельзя копировать',
        'final ускоряет арифметику',
        'Так требует стандарт',
      ],
      correct: 0,
      explain: 'Тип-значение не проектируют для расширения; final делает это явным.',
    },
    {
      q: 'Что такое девиртуализация?',
      options: [
        'Компилятор вызывает виртуальную функцию напрямую, зная, что у типа нет наследников',
        'Удаление виртуальных функций из класса',
        'Ошибка вызова виртуальной функции в конструкторе',
        'Превращение класса в абстрактный',
      ],
      correct: 0,
      explain: 'Для финального класса таблица виртуальных функций при вызове не нужна.',
    },
    {
      q: 'Какое изменение безопасно для существующего кода клиентов?',
      options: [
        'Снять final с класса',
        'Добавить final к классу, от которого уже наследуют',
        'Добавить final к функции, которую наследники переопределяют',
        'Все три',
      ],
      correct: 0,
      explain: 'Снятие final ничего не ломает; добавление ломает существующих наследников.',
    },
    {
      q: 'Класс CardPayment объявил authorize final и оставил наследникам protected virtual limit(). Сколько точек расширения у наследника карты в части авторизации?',
      answers: ['1', 'одна'],
      placeholder: 'Число',
      explain: 'Только limit(): правило проверки зафиксировано, наследник выбирает лишь лимит.',
    },
  ],
  exercises: [
    {
      id: 'oop-final-exercise',
      title: 'Финальные деньги',
      difficulty: 'beginner',
      description: `
Опишите финальный класс \`Money final\` (копейки) с операторами \`+=\` и \`<=>\` (по умолчанию) и методом \`std::string str() const\`, возвращающим \`R.KK\`. Прочитайте суммы в копейках до конца ввода и напечатайте \`итого R.KK\` и \`максимум R.KK\` (или только \`итого 0.00\`, если сумм нет).`,
      constraints: ['Сумм не больше 50; каждая от 0 до 10⁹ копеек.'],
      hints: [
        'auto operator<=>(const Money &) const = default; даст и сравнение, и std::max для Money.',
        'str(): std::format("{}.{:02}", kopecks_ / 100, kopecks_ % 100).',
      ],
      solution: String.raw`
#include <algorithm>
#include <format>
#include <iostream>
#include <optional>
#include <print>
#include <string>

class Money final {
public:
    explicit Money(long long kopecks) : kopecks_(kopecks) {}

    Money &operator+=(Money other) {
        kopecks_ += other.kopecks_;
        return *this;
    }

    auto operator<=>(const Money &) const = default;

    std::string str() const {
        return std::format("{}.{:02}", kopecks_ / 100, kopecks_ % 100);
    }

private:
    long long kopecks_;
};

int main() {
    Money total(0);
    std::optional<Money> largest;
    long long k;
    while (std::cin >> k) {
        Money m(k);
        total += m;
        largest = largest ? std::max(*largest, m) : m;
    }
    std::println("итого {}", total.str());
    if (largest) {
        std::println("максимум {}", largest->str());
    }
    return 0;
}`,
      explanation: `
\`Money\` — тип-значение: его копируют, складывают и сравнивают, и никакого поведения «для наследников» у него нет. \`final\` фиксирует это решение в коде: попытка унаследоваться станет ошибкой компиляции.

Сравнение по умолчанию подходит, потому что деньги равны, когда равны копейки, — а с ним работает и \`std::max\`. Максимум хранится в \`std::optional\`: до первой суммы его нет.`,
      examples: [
        { in: '1050 99 300000\n', out: 'итого 3011.49\nмаксимум 3000.00\n' },
        { in: '', out: 'итого 0.00\n' },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '1\n', name: 'Копейка' },
        { in: '1000000000 1000000000\n', name: 'Большие' },
        { in: '5 5 5\n', name: 'Одинаковые' },
        { in: '100 50\n', name: 'Убывание' },
        { in: '99 1\n', name: 'Ровно рубль' },
        { in: '12345 67890 11111\n', name: 'Три суммы' },
        { in: '7\n', name: 'Одна сумма' },
      ],
    },
    {
      title: 'Правило авторизации',
      description: `
Абстрактный класс \`Payment\` объявляет \`authorize(amount)\` и \`name()\`. Класс \`CardPayment\` реализует \`authorize\` как **финальную** функцию: сумма положительна и не больше \`limit()\` — защищённой виртуальной функции (по умолчанию 50 000). Наследники карт: \`DebitCard\` (\`дебетовая\`, лимит по умолчанию) и \`GoldCard\` (\`золотая\`, лимит 1 000 000) — обе \`final\`. Отдельно — \`Wallet\` (\`кошелёк\`) с балансом: одобряет положительную сумму, не превышающую баланс.

Строки ввода: \`debit сумма\`, \`gold сумма\`, \`wallet баланс сумма\`. Напечатайте \`имя сумма: одобрено\` или \`… отказ\` через функцию \`check(const Payment &, amount)\`.`,
      constraints: ['Строк не больше 30; суммы по модулю до 10⁹.'],
      hints: [
        'В CardPayment: bool authorize(long long amount) const final { return amount > 0 && amount <= limit(); }',
        'Wallet — прямой наследник Payment со своим authorize (override); баланс передаётся в конструктор.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class Payment {
public:
    virtual ~Payment() = default;
    virtual bool authorize(long long amount) const = 0;
    virtual std::string name() const = 0;
};

class CardPayment : public Payment {
public:
    bool authorize(long long amount) const final {
        return amount > 0 && amount <= limit();
    }

protected:
    virtual long long limit() const {
        return 50000;
    }
};

class DebitCard final : public CardPayment {
public:
    std::string name() const override {
        return "дебетовая";
    }
};

class GoldCard final : public CardPayment {
public:
    std::string name() const override {
        return "золотая";
    }

protected:
    long long limit() const override {
        return 1000000;
    }
};

class Wallet final : public Payment {
public:
    explicit Wallet(long long balance) : balance_(balance) {}

    bool authorize(long long amount) const override {
        return amount > 0 && amount <= balance_;
    }

    std::string name() const override {
        return "кошелёк";
    }

private:
    long long balance_;
};

void check(const Payment &p, long long amount) {
    std::println("{} {}: {}", p.name(), amount, p.authorize(amount) ? "одобрено" : "отказ");
}

int main() {
    DebitCard debit;
    GoldCard gold;
    std::string kind;
    while (std::cin >> kind) {
        long long amount;
        if (kind == "wallet") {
            long long balance;
            std::cin >> balance >> amount;
            check(Wallet(balance), amount);
        } else {
            std::cin >> amount;
            if (kind == "gold") {
                check(gold, amount);
            } else {
                check(debit, amount);
            }
        }
    }
    return 0;
}`,
      explanation: `
Правило «сумма положительна и не больше лимита» общее для всех карт и записано в \`CardPayment::authorize\` один раз; \`final\` не даёт наследникам карт его ослабить. Каждая карта меняет только лимит — единственную точку расширения.

\`Wallet\` — другая ветка иерархии: это не карта, и правило карт на него не распространяется, поэтому он реализует \`authorize\` сам. Конкретные классы помечены \`final\`: наследников у них не планируется.`,
      examples: [
        {
          in: 'debit 60000\ngold 600000\nwallet 100 50\n',
          out: 'дебетовая 60000: отказ\nзолотая 600000: одобрено\nкошелёк 50: одобрено\n',
        },
        { in: 'gold -5\n', out: 'золотая -5: отказ\n' },
      ],
      hidden: [
        { in: 'debit 50000\n', name: 'Ровно лимит' },
        { in: 'debit 0\n', name: 'Ноль' },
        { in: 'gold 1000000\ngold 1000001\n', name: 'Лимит золотой' },
        { in: 'wallet 100 101\n', name: 'Больше баланса' },
        { in: 'wallet 0 -1\n', name: 'Отрицательная сумма' },
        { in: 'debit 1\ngold 1\nwallet 1 1\n', name: 'Единицы' },
        { in: 'gold -1000000000\n', name: 'Большой минус' },
        { in: 'wallet 1000000000 1000000000\n', name: 'Весь баланс' },
      ],
    },
    {
      title: 'Найди ошибку: правило обойдено',
      bug: true,
      description: `
Для всех карт действует обязательное правило: сумма **положительна** и не больше лимита карты (у дебетовой — 50 000, у золотой — 1 000 000). Строки ввода: \`debit сумма\` или \`gold сумма\`; программа печатает \`имя сумма: одобрено\` или \`… отказ\`.

Золотая карта одобряет отрицательные суммы. Найдите ошибку и исправьте иерархию так, чтобы ни одна карта не могла обойти обязательное правило.`,
      constraints: ['Строк не больше 30; суммы по модулю до 10⁹.'],
      hints: [
        'Какую функцию переопределила GoldCard и что в ней пропущено?',
        'Сделайте CardPayment::authorize финальной (final), а в GoldCard переопределите только limit(), вернув 1000000.',
      ],
      starter: CARDS(false),
      solution: CARDS(true),
      explanation: `
\`GoldCard\` переопределил \`authorize\` целиком, чтобы поднять лимит, — и по дороге потерял проверку положительности. Обязательное правило оказалось лишь «рекомендацией», которую каждый наследник может переписать.

\`final\` у \`CardPayment::authorize\` делает правило неприкосновенным: попытка переопределить его станет ошибкой компиляции. Наследникам остаётся предусмотренная точка расширения — \`limit()\`. Так база управляет тем, что наследники **могут** менять, а что — нет.`,
      examples: [
        { in: 'gold -100\ngold 500000\n', out: 'золотая -100: отказ\nзолотая 500000: одобрено\n' },
        { in: 'debit 60000\n', out: 'дебетовая 60000: отказ\n' },
      ],
      hidden: [
        'gold 0\n',
        'gold -1\ndebit -1\n',
        'gold 1000000\n',
        'gold 1000001\n',
        'debit 50000\n',
        'gold -1000000000\n',
        'debit 1\ngold 1\n',
        'gold 999999\n',
      ],
    },
    {
      title: 'Тарифы',
      difficulty: 'advanced',
      description: `
Абстрактный класс \`Tariff\` с функциями \`long long cost(int minutes) const\` и \`std::string name() const\` и три **финальных** тарифа:

- \`Поминутный\`: 3 руб. за минуту;
- \`Базовый\`: 300 руб. в месяц, включено 200 минут, сверх них — 2 руб.;
- \`Безлимитный\`: 650 руб. в месяц.

Для каждого числа минут из ввода найдите самый дешёвый тариф одним циклом по \`std::vector<const Tariff *>\` и напечатайте \`N мин: тариф (стоимость руб.)\`. При равной стоимости выбирайте тариф, стоящий в векторе раньше (порядок: поминутный, базовый, безлимитный).`,
      constraints: ['Чисел не больше 30; минуты от 0 до 100 000.'],
      hints: [
        'Базовый: 300 + 2 · max(0, minutes − 200).',
        'Цикл: const Tariff *best = tariffs[0]; для каждого t: if (t->cost(m) < best->cost(m)) best = t;.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <print>
#include <string>
#include <vector>

class Tariff {
public:
    virtual ~Tariff() = default;
    virtual long long cost(int minutes) const = 0;
    virtual std::string name() const = 0;
};

class PerMinute final : public Tariff {
public:
    long long cost(int minutes) const override {
        return 3LL * minutes;
    }

    std::string name() const override {
        return "Поминутный";
    }
};

class Basic final : public Tariff {
public:
    long long cost(int minutes) const override {
        return 300 + 2LL * std::max(0, minutes - 200);
    }

    std::string name() const override {
        return "Базовый";
    }
};

class Unlimited final : public Tariff {
public:
    long long cost(int) const override {
        return 650;
    }

    std::string name() const override {
        return "Безлимитный";
    }
};

int main() {
    PerMinute per_minute;
    Basic basic;
    Unlimited unlimited;
    const std::vector<const Tariff *> tariffs = {&per_minute, &basic, &unlimited};
    int minutes;
    while (std::cin >> minutes) {
        const Tariff *best = tariffs[0];
        for (const Tariff *t : tariffs) {
            if (t->cost(minutes) < best->cost(minutes)) {
                best = t;
            }
        }
        std::println("{} мин: {} ({} руб.)", minutes, best->name(), best->cost(minutes));
    }
    return 0;
}`,
      explanation: `
Тарифы — листья иерархии: каждый реализует договор \`Tariff\`, а наследников у них не будет, поэтому они \`final\`. Цикл выбора тарифа не знает формул — он сравнивает результаты виртуальных вызовов. Новый тариф добавляется в вектор, и цикл его учтёт.

Сравнение строго \`<\`, поэтому при равной стоимости остаётся тариф, стоящий раньше. В \`Unlimited::cost\` параметр не используется — у него нет имени, и компилятор не предупреждает о неиспользуемом параметре.`,
      examples: [
        {
          in: '50\n250\n1000\n',
          out: '50 мин: Поминутный (150 руб.)\n250 мин: Базовый (400 руб.)\n1000 мин: Безлимитный (650 руб.)\n',
        },
        { in: '0\n', out: '0 мин: Поминутный (0 руб.)\n' },
      ],
      hidden: [
        { in: '100\n', name: 'Поровну поминутный и базовый' },
        { in: '200\n', name: 'Ровно включено' },
        { in: '375\n', name: 'Поровну базовый и безлимитный' },
        { in: '376\n', name: 'Чуть больше' },
        { in: '100000\n', name: 'Очень много' },
        { in: '99\n101\n', name: 'Около ста' },
        { in: '216\n217\n', name: 'Около порога' },
        { in: '1\n', name: 'Минута' },
      ],
    },
  ],
};
