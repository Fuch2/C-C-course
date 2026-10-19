const ADULT = (fixed) => String.raw`
#include <iostream>
#include <optional>
#include <print>

// Пусто — возраст невозможен; иначе true, если человеку 18 лет или больше.
std::optional<bool> is_adult(int age) {
    if (age < 0 || age > 150) {
        return std::nullopt;
    }
    return age >= 18;
}

int main() {
    int age;
    while (std::cin >> age) {
        std::optional<bool> adult = is_adult(age);
${
  fixed
    ? `        if (!adult) {
            std::println("{}: ошибка", age);
        } else if (*adult) {
            std::println("{}: взрослый", age);
        } else {
            std::println("{}: несовершеннолетний", age);
        }`
    : `        if (adult) {
            std::println("{}: взрослый", age);
        } else if (adult == false) {
            std::println("{}: несовершеннолетний", age);
        } else {
            std::println("{}: ошибка", age);
        }`
}
    }
    return 0;
}`;

export default {
  id: 'cpp23-optional',
  title: 'Необязательное значение std::optional',
  description:
    'Как в C сообщают «результата нет» и чем это опасно; std::optional — значение или пустота; has_value, *, value, value_or, reset; функции поиска и разбора, возвращающие optional; исключение bad_optional_access; цепочки transform, and_then, or_else из C++23; необязательные поля структур; ловушка optional<bool>.',
  moduleId: 'cpp-fundamentals',
  order: 22,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-tuple'],
  objectives: [
    'Возвращать из функций std::optional вместо особых значений и флагов',
    'Безопасно получать значение: проверка, value и value_or',
    'Строить цепочки шагов через transform и and_then',
    'Описывать необязательные поля структур',
  ],
  tags: ['C++17', 'C++23', 'optional', 'Обработка ошибок'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <optional>
#include <print>

int main() {
    std::optional<int> a = 5;
    std::optional<int> b;
    std::println("{} {} {}", a.value_or(0), b.value_or(-1), b.has_value());
    return 0;
}`,
      lang: 'cpp',
      answers: ['5 -1 false'],
      placeholder: 'Вывод программы',
      explain: 'У a есть значение 5, b пуст — value_or возвращает запасное значение.',
    },
    {
      q: 'Чем плох C-интерфейс bool parse(const char *s, int *out) по сравнению с std::optional<int> parse(std::string_view s)?',
      options: [
        'Ничто не мешает прочитать out после неудачи, когда его никто не заполнил',
        'Функция с bool работает медленнее',
        'В C нельзя вернуть bool',
        'Ничем',
      ],
      correct: 0,
      explain:
        'С optional до числа нельзя добраться, не узнав, есть ли оно: результат и признак успеха — один объект.',
    },
    {
      q: 'Что произойдёт при вызове value() у пустого std::optional<int>?',
      options: [
        'Будет выброшено исключение std::bad_optional_access',
        'Вернётся 0',
        'Неопределённое поведение',
        'Ошибка компиляции',
      ],
      correct: 0,
      explain: 'value() проверяет наличие значения. Неопределённое поведение — у *x без проверки.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <optional>
#include <print>

int main() {
    std::optional<bool> flag = false;
    std::println("{} {}", flag ? "есть" : "нет", flag.value() ? "да" : "нет");
    return 0;
}`,
      lang: 'cpp',
      answers: ['есть нет'],
      placeholder: 'Вывод программы',
      explain: 'Условие проверяет наличие значения (оно есть), а само значение — false.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <optional>
#include <print>

std::optional<int> half(int x) {
    if (x % 2 != 0) {
        return std::nullopt;
    }
    return x / 2;
}

int main() {
    std::println("{} {}", half(20).and_then(half).value_or(-1), half(6).and_then(half).value_or(-1));
    return 0;
}`,
      lang: 'cpp',
      answers: ['5 -1'],
      placeholder: 'Вывод программы',
      explain:
        '20 → 10 → 5. 6 → 3, а 3 нечётное — второй шаг возвращает пустоту, и value_or даёт -1.',
    },
    {
      q: 'Когда в цепочке нужен and_then, а когда transform?',
      options: [
        'and_then — если функция сама возвращает optional (шаг может не удаться); transform — если она возвращает обычное значение',
        'and_then — для чисел, transform — для строк',
        'Это синонимы',
        'transform вызывается только для пустых optional',
      ],
      correct: 0,
      explain:
        'transform заворачивает результат в optional сам; and_then ожидает optional от функции и не заворачивает его повторно.',
    },
    {
      q: 'Сколько байт занимает std::optional<int> (на 64-битной системе курса)?',
      answers: ['8'],
      placeholder: 'Число',
      explain:
        'Значение хранится внутри объекта: 4 байта int плюс признак наличия, выровнено до 8. Кучи нет.',
    },
    {
      q: 'Какие объявления создают пустой std::optional<int>? Выберите все.',
      options: [
        'std::optional<int> x;',
        'std::optional<int> x = std::nullopt;',
        'std::optional<int> x = 0;',
        'std::optional<int> x{};',
      ],
      correct: [0, 1, 3],
      explain:
        'x = 0 — это непустой optional со значением 0. Пустой — без значения, nullopt или {}.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <optional>
#include <print>
#include <string>

int main() {
    std::optional<std::string> s = "код";
    s->append("!");
    std::string first = *s;
    s.reset();
    std::println("{} {} {}", first, first.size(), s.value_or("пусто"));
    return 0;
}`,
      lang: 'cpp',
      answers: ['код! 7 пусто'],
      placeholder: 'Вывод программы',
      explain:
        'Оператор -> обращается к методам хранимой строки. «код» — 6 байт UTF-8, с восклицательным знаком 7. reset очищает optional.',
    },
  ],
  exercises: [
    {
      title: 'Первое отрицательное',
      difficulty: 'beginner',
      description: `
Прочитайте целые числа до конца ввода. Напишите функцию

\`\`\`cpp
std::optional<std::size_t> find_first_negative(std::span<const int> values);
\`\`\`

которая возвращает индекс первого отрицательного числа или пустой \`optional\`, и напечатайте \`первое отрицательное: позиция P, значение V\` (позиция с 1) или \`отрицательных нет\`.`,
      constraints: ['Чисел не больше 1000, каждое по модулю до 10⁹.'],
      hints: [
        'Внутри цикла return i; — индекс неявно станет непустым optional. После цикла — return std::nullopt;.',
        'if (auto pos = find_first_negative(values)) { … *pos … } — внутри if значение точно есть.',
      ],
      solution: String.raw`
#include <iostream>
#include <optional>
#include <print>
#include <span>
#include <vector>

std::optional<std::size_t> find_first_negative(std::span<const int> values) {
    for (std::size_t i = 0; i < values.size(); i++) {
        if (values[i] < 0) {
            return i;
        }
    }
    return std::nullopt;
}

int main() {
    std::vector<int> values;
    int x;
    while (std::cin >> x) {
        values.push_back(x);
    }
    if (auto pos = find_first_negative(values)) {
        std::println("первое отрицательное: позиция {}, значение {}", *pos + 1, values[*pos]);
    } else {
        std::println("отрицательных нет");
    }
    return 0;
}`,
      explanation: `
Тип \`std::optional<std::size_t>\` честно описывает ответ: индекса может не быть. С особым значением вроде \`-1\` пришлось бы смешивать знаковые и беззнаковые числа и помнить договорённость в каждом месте вызова.

\`if (auto pos = …)\` объединяет вызов и проверку: в ветке \`if\` значение гарантированно есть, и \`*pos\` безопасен. Функция принимает \`std::span<const int>\`, поэтому работает и с вектором, и с массивом.`,
      examples: [
        { in: '3 5 -2 4 -7\n', out: 'первое отрицательное: позиция 3, значение -2\n' },
        { in: '1 2 3\n', out: 'отрицательных нет\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: '-1\n', name: 'Сразу' },
        { in: '0 0 0\n', name: 'Нули' },
        { in: '5 4 3 2 1 -1000000000\n', name: 'В конце' },
        { in: '1000000000 -1 -2\n', name: 'Второе' },
        { in: '7\n', name: 'Одно положительное' },
        { in: '-5 -6 -7\n', name: 'Все отрицательные' },
        { in: '1 2 3 4 5 6 7 8 9 -10\n', name: 'Десятое' },
      ],
    },
    {
      title: 'Контакты',
      description: `
Каждая строка ввода — имя, телефон и почта через пробел; вместо отсутствующего телефона или почты стоит дефис \`-\`. Храните контакт в структуре с полями \`std::optional<std::string>\` и напечатайте каждый:

\`\`\`text
Ада: телефон 89001234567, почта нет
\`\`\`

В последней строке — \`без связи: K\`, где K — число контактов без телефона и без почты.`,
      constraints: ['Контактов не больше 50; поля — слова без пробелов.'],
      hints: [
        'Вспомогательная функция: std::optional<std::string> field(const std::string &s) — пустой optional для "-", иначе строка.',
        'Печать: c.phone.value_or("нет"). Контакт без связи: !c.phone && !c.email.',
      ],
      solution: String.raw`
#include <iostream>
#include <optional>
#include <print>
#include <string>
#include <vector>

struct Contact {
    std::string name;
    std::optional<std::string> phone;
    std::optional<std::string> email;
};

std::optional<std::string> field(const std::string &text) {
    if (text == "-") {
        return std::nullopt;
    }
    return text;
}

int main() {
    std::vector<Contact> contacts;
    std::string name, phone, email;
    while (std::cin >> name >> phone >> email) {
        contacts.push_back({name, field(phone), field(email)});
    }
    int unreachable = 0;
    for (const Contact &c : contacts) {
        std::println("{}: телефон {}, почта {}", c.name, c.phone.value_or("нет"), c.email.value_or("нет"));
        if (!c.phone && !c.email) {
            unreachable++;
        }
    }
    std::println("без связи: {}", unreachable);
    return 0;
}`,
      explanation: `
Отсутствие данных переведено в тип при чтении — в одном месте, функцией \`field\`. Дальше программа не знает о договорённости «дефис означает пусто»: она работает с \`std::optional\`, и каждое обращение к телефону явно решает, что делать, если его нет.

\`value_or("нет")\` подставляет текст только для печати, не меняя данных. Проверка «без связи» читается как в описании задачи: \`!c.phone && !c.email\`.`,
      examples: [
        {
          in: 'Ада 89001234567 -\nАлан - alan@example.com\nГрейс - -\n',
          out: 'Ада: телефон 89001234567, почта нет\nАлан: телефон нет, почта alan@example.com\nГрейс: телефон нет, почта нет\nбез связи: 1\n',
        },
        { in: '', out: 'без связи: 0\n' },
      ],
      hidden: [
        { in: 'A 1 a@b\n', name: 'Всё есть' },
        { in: 'A - -\nB - -\n', name: 'Все без связи' },
        { in: 'Иван 112 -\n', name: 'Только телефон' },
        { in: 'X - x@y.z\nY 1 -\nZ - -\n', name: 'Смесь' },
        { in: 'Минус -1 -\n', name: 'Телефон с минусом' },
        { in: 'a - -\nb 2 b@c\nc - -\nd - -\n', name: 'Трое без связи' },
        { in: 'Ольга 89990000000 olga@mail.ru\n', name: 'Полный контакт' },
        { in: 'p q r\ns - t\n', name: 'Короткие' },
      ],
    },
    {
      title: 'Найди ошибку: optional<bool> в условии',
      bug: true,
      description: `
Функция \`is_adult\` возвращает пустой \`optional\`, если возраст невозможен (меньше 0 или больше 150), иначе — \`true\` для 18 лет и старше. Программа печатает для каждого возраста из ввода \`взрослый\`, \`несовершеннолетний\` или \`ошибка\`:

\`\`\`text
30: взрослый
12: несовершеннолетний
-5: ошибка
\`\`\`

Но всех детей она объявляет взрослыми. Найдите и исправьте ошибку.`,
      constraints: ['Возрасты — целые числа по модулю до 1000; их не больше 30.'],
      hints: [
        'Что проверяет условие if (adult), когда adult — std::optional<bool>?',
        'if (adult) истинно, если значение ЕСТЬ, — даже если это false. Сначала проверьте наличие (if (!adult) — ошибка), потом само значение *adult.',
      ],
      starter: ADULT(false),
      solution: ADULT(true),
      explanation: `
У \`std::optional\` условие \`if (x)\` означает «значение есть». Для \`std::optional<bool>\` это особенно коварно: \`false\` — тоже значение, поэтому для 12 лет \`if (adult)\` истинно и программа печатает «взрослый».

Исправление разделяет два вопроса: есть ли ответ (\`!adult\` — возраст невозможен) и какой он (\`*adult\`). Сравнение \`adult == false\` в исходной программе было верным, но до него выполнение не доходило. Если тип допускает такую путаницу, полезно назвать вещи прямо: например, вернуть \`enum class Age { invalid, minor, adult }\`.`,
      examples: [
        { in: '30 12 -5\n', out: '30: взрослый\n12: несовершеннолетний\n-5: ошибка\n' },
        { in: '18 17\n', out: '18: взрослый\n17: несовершеннолетний\n' },
      ],
      hidden: [
        '0\n',
        '150 151\n',
        '1 2 3\n',
        '-1\n',
        '99\n',
        '16 18 20\n',
        '1000 -1000\n',
        '5 25 45 65\n',
      ],
    },
    {
      title: 'Даты',
      difficulty: 'advanced',
      description: `
Каждая строка ввода — дата в виде \`ДД.ММ\` (год не високосный). Напечатайте её словами — \`18 октября\` — или \`неверная дата\`, если строка не в этом формате или такой даты нет. День и месяц — только цифры (допустим ведущий ноль: \`01.02\` — это \`1 февраля\`).

Постройте решение цепочкой: функция разбора возвращает \`std::optional<Date>\`, функция проверки — тоже \`std::optional<Date>\`, а итоговая строка получается через \`and_then\`, \`transform\` и \`value_or\`.`,
      constraints: ['Строк не больше 30, каждая до 20 символов.'],
      hints: [
        'Разбор: найдите точку, обе части разберите std::from_chars в optional<int>; если что-то не удалось — std::nullopt.',
        'Названия в родительном падеже — массив из 12 строк, дни в месяцах — {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}. Цепочка: parse_date(line).and_then(validate).transform(…).value_or("неверная дата").',
      ],
      solution: String.raw`
#include <array>
#include <charconv>
#include <format>
#include <iostream>
#include <optional>
#include <print>
#include <string>
#include <string_view>

struct Date {
    int day;
    int month;
};

std::optional<int> parse_int(std::string_view text) {
    int value = 0;
    auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), value);
    if (text.empty() || error != std::errc{} || end != text.data() + text.size()) {
        return std::nullopt;
    }
    return value;
}

std::optional<Date> parse_date(std::string_view text) {
    std::size_t dot = text.find('.');
    if (dot == std::string_view::npos) {
        return std::nullopt;
    }
    std::optional<int> day = parse_int(text.substr(0, dot));
    std::optional<int> month = parse_int(text.substr(dot + 1));
    if (!day || !month) {
        return std::nullopt;
    }
    return Date{*day, *month};
}

std::optional<Date> validate(Date d) {
    constexpr std::array<int, 12> days = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (d.month < 1 || d.month > 12) {
        return std::nullopt;
    }
    if (d.day < 1 || d.day > days[static_cast<std::size_t>(d.month - 1)]) {
        return std::nullopt;
    }
    return d;
}

int main() {
    constexpr std::array<std::string_view, 12> names = {
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря"};
    std::string line;
    while (std::getline(std::cin, line)) {
        std::string text = parse_date(line)
                               .and_then(validate)
                               .transform([&names](Date d) {
                                   return std::format("{} {}", d.day, names[static_cast<std::size_t>(d.month - 1)]);
                               })
                               .value_or("неверная дата");
        std::println("{}", text);
    }
    return 0;
}`,
      explanation: `
Задача распадается на три шага, и каждый может не удаться или удаётся всегда: разбор (\`parse_date\`, может вернуть пустоту), проверка (\`validate\`, может вернуть пустоту), оформление (\`transform\`, всегда удаётся). \`and_then\` подключает шаг, который сам возвращает \`optional\`, \`transform\` — обычную функцию. Первая же пустота проходит по цепочке до \`value_or\`.

Без цепочки получилась бы лесенка вложенных \`if\` с повторяющимися ветками «неверная дата». \`from_chars\` строг: \`+5\`, \`5a\`, пустая строка не числа, поэтому формат проверяется заодно с разбором.`,
      examples: [
        { in: '18.10\n31.04\n', out: '18 октября\nневерная дата\n' },
        { in: '01.02\nabc\n', out: '1 февраля\nневерная дата\n' },
      ],
      hidden: [
        { in: '29.02\n28.02\n', name: 'Февраль' },
        { in: '31.12\n1.1\n', name: 'Границы года' },
        { in: '0.5\n32.1\n', name: 'Неверный день' },
        { in: '15.13\n15.0\n', name: 'Неверный месяц' },
        { in: '10\n.\n', name: 'Без точки' },
        { in: '+5.5\n5.+5\n', name: 'Знак плюс' },
        { in: '30.06\n31.07\n31.08\n', name: 'Длинные месяцы' },
        { in: '-1.5\n07.07\n', name: 'Минус и ведущий ноль' },
      ],
    },
  ],
};
