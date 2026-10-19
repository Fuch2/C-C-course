const CLAMP = (fixed) =>
  fixed
    ? String.raw`
#include <iostream>

template <typename T>
T clamp_value(T value, T lo, T hi) {
    return value < lo ? lo : hi < value ? hi : value;
}

int main() {
    int x;
    while (std::cin >> x) {
        std::cout << clamp_value(x, 0, 100) << '\n';
    }
    return 0;
}`
    : String.raw`
#include <iostream>

long long clamp_value(long long value, long long lo, long long hi) {
    return value < lo ? lo : hi < value ? hi : value;
}

double clamp_value(double value, double lo, double hi) {
    return value < lo ? lo : hi < value ? hi : value;
}

int main() {
    int x;
    while (std::cin >> x) {
        std::cout << clamp_value(x, 0, 100) << '\n';
    }
    return 0;
}`;

export default {
  id: 'cpp20-overload',
  title: 'Перегрузка и шаблоны функций',
  description:
    'Перегрузка функций по типам и количеству параметров; почему возвращаемый тип не различает перегрузки; правила выбора и неоднозначные вызовы; nullptr и перегрузка; шаблоны функций, вывод параметра-типа и явное указание.',
  moduleId: 'cpp-fundamentals',
  order: 12,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['cpp20-range-for'],
  objectives: [
    'Объявлять перегруженные функции',
    'Предсказывать, какую перегрузку выберет компилятор, и устранять неоднозначность',
    'Объяснять, зачем нужен nullptr',
    'Писать простые шаблоны функций',
  ],
  tags: ['C++', 'Перегрузка', 'Шаблоны'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int f(int) { return 1; }
int f(double) { return 2; }
int f(char) { return 3; }

int main() {
    std::cout << f(10) << f(1.5) << f('x') << f(2.5f) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1232'],
      placeholder: 'Вывод программы',
      explain:
        'int, double и char совпадают точно. float продвигается до double — это лучше, чем преобразование в int или char.',
    },
    {
      q: 'Можно ли объявить вместе int parse(std::string s) и double parse(std::string s)?',
      options: [
        'Нет: перегрузки должны различаться параметрами, а возвращаемый тип не учитывается',
        'Да: компилятор выберет по типу переменной, в которую сохраняют результат',
        'Да, если функции в одном файле',
        'Только для шаблонов',
      ],
      correct: 0,
      explain:
        'Вызов parse(s) не содержит информации о нужном возвращаемом типе — различить функции невозможно.',
    },
    {
      q: 'Какая функция будет вызвана: check(0) при перегрузках check(int) и check(int *)?',
      options: ['check(int)', 'check(int *)', 'Ошибка неоднозначности', 'Ни одна'],
      correct: 0,
      explain:
        '0 — литерал типа int, точное совпадение с check(int). Для пустого указателя нужен nullptr.',
    },
    {
      q: 'Почему вызов show(5) неоднозначен при перегрузках show(long) и show(double)?',
      options: [
        'int → long и int → double — преобразования одного ранга, лучшего варианта нет',
        '5 подходит только к show(double)',
        'Перегрузки с long запрещены',
        'Компилятор не знает тип литерала 5',
      ],
      correct: 0,
      explain: 'Добавьте show(int) или приведите аргумент явно: show(5L), show(5.0).',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

template <typename T>
T repeat_add(T value, int times) {
    T result = value;
    for (int i = 1; i < times; i++) {
        result = result + value;
    }
    return result;
}

int main() {
    std::cout << repeat_add(5, 3) << ' ' << repeat_add(std::string("ab"), 3) << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['15 ababab'],
      placeholder: 'Вывод программы',
      explain:
        'Один шаблон, две версии: для int сложение чисел, для std::string — склеивание строк.',
    },
    {
      q: 'Почему не компилируется std::max(3, 2.5)?',
      options: [
        'У шаблона один параметр-тип T, а аргументы разных типов — T не выводится однозначно',
        'std::max работает только с целыми',
        'std::max принимает три аргумента',
        'Нужно подключить <cmath>',
      ],
      correct: 0,
      explain: 'Укажите тип явно — std::max<double>(3, 2.5) — или передайте аргументы одного типа.',
    },
    {
      q: 'Чем шаблон функции лучше макроса #define MAX(a, b) ((a) > (b) ? (a) : (b))?',
      options: [
        'Проверяются типы',
        'Аргументы вычисляются один раз',
        'Ошибки сообщаются в терминах функции, а не текстовой подстановки',
        'Шаблон работает быстрее при любых условиях',
      ],
      correct: [0, 1, 2],
      explain:
        'Скорость обычно одинакова — функция-шаблон встраивается. Главное — безопасность и понятность.',
    },
    {
      q: "Какой тип T выведет компилятор при вызове largest('a', 'z') для template <typename T> T largest(T, T)?",
      answers: ['char'],
      placeholder: 'Тип',
      explain: 'Оба аргумента — символьные литералы типа char, поэтому T = char.',
    },
  ],
  exercises: [
    {
      title: 'Площади фигур',
      difficulty: 'beginner',
      description: `
Каждая строка ввода — фигура и её размеры: \`circle r\`, \`rect w h\` или \`triangle a b c\` (длины сторон). Напишите три перегрузки функции \`area\` — с одним, двумя и тремя параметрами \`double\` — и напечатайте площадь каждой фигуры с двумя знаками после точки. Если треугольник с такими сторонами не существует (одна сторона не меньше суммы двух других), напечатайте \`нет\`.

Площадь треугольника по формуле Герона: \`√(p(p − a)(p − b)(p − c))\`, где \`p\` — полупериметр.`,
      constraints: [
        'Размеры положительны и не больше 10⁴; строк не больше 30. π = 3.14159265358979.',
      ],
      hints: [
        'double area(double r), double area(double w, double h), double area(double a, double b, double c) — компилятор выберет перегрузку по числу аргументов.',
        'Проверку существования треугольника сделайте до вызова area. Вывод: std::fixed и std::setprecision(2); корень — std::sqrt из <cmath>.',
      ],
      solution: String.raw`
#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>

double area(double r) {
    return 3.14159265358979 * r * r;
}

double area(double w, double h) {
    return w * h;
}

double area(double a, double b, double c) {
    double p = (a + b + c) / 2;
    return std::sqrt(p * (p - a) * (p - b) * (p - c));
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    std::string shape;
    while (std::cin >> shape) {
        if (shape == "circle") {
            double r;
            std::cin >> r;
            std::cout << area(r) << '\n';
        } else if (shape == "rect") {
            double w, h;
            std::cin >> w >> h;
            std::cout << area(w, h) << '\n';
        } else {
            double a, b, c;
            std::cin >> a >> b >> c;
            if (a >= b + c || b >= a + c || c >= a + b) {
                std::cout << "нет\n";
            } else {
                std::cout << area(a, b, c) << '\n';
            }
        }
    }
    return 0;
}`,
      explanation: `
Три функции называются одинаково, потому что делают одно и то же — считают площадь, — а различаются числом параметров. Компилятор выбирает версию по вызову: \`area(r)\`, \`area(w, h)\` или \`area(a, b, c)\`. В C пришлось бы придумать три имени.

Проверка существования треугольника стоит до формулы Герона: для вырожденного треугольника под корнем был бы 0 (площадь 0.00 — сомнительный ответ), а для невозможного — отрицательное число и \`nan\`.`,
      examples: [
        { in: 'circle 1\nrect 2 3.5\n', out: '3.14\n7.00\n' },
        { in: 'triangle 3 4 5\ntriangle 1 2 3\n', out: '6.00\nнет\n' },
      ],
      hidden: [
        { in: 'circle 10\n', name: 'Круг радиуса 10' },
        { in: 'circle 0.5\n', name: 'Маленький круг' },
        { in: 'rect 10000 10000\n', name: 'Большой прямоугольник' },
        { in: 'triangle 2 2 2\n', name: 'Равносторонний' },
        { in: 'triangle 1 1 3\n', name: 'Невозможный' },
        { in: 'triangle 5 12 13\n', name: 'Прямоугольный' },
        { in: 'rect 0.1 0.2\n', name: 'Дробные' },
        { in: 'circle 2\nrect 1 1\ntriangle 7 8 9\n', name: 'Все фигуры' },
      ],
    },
    {
      title: 'Описание значения',
      description: `
До конца ввода идут слова. Каждое слово — целое число (необязательный знак и цифры), дробное число (необязательный знак, цифры, одна точка, цифры; хотя бы одна цифра) или что-то иное. Напишите три перегрузки \`describe\` для \`long long\`, \`double\` и \`const std::string &\` и для каждого слова напечатайте:

- \`целое N, чётное\` или \`целое N, нечётное\`;
- \`дробное, округлено N\` — до ближайшего целого (\`std::llround\`);
- \`слово S, длина L\`.`,
      constraints: ['Слов не больше 100; целые числа по модулю до 10¹⁸; дробные — до 10⁹.'],
      hints: [
        'Сначала определите вид слова проверкой символов: функции is_integer и is_real. Затем преобразуйте: std::stoll для целых, std::stod для дробных, — и вызовите describe с нужным типом.',
        'Перегрузка выбирается по типу аргумента: describe(std::stoll(w)), describe(std::stod(w)), describe(w).',
      ],
      solution: String.raw`
#include <cmath>
#include <iostream>
#include <string>

bool is_digit(char c) {
    return c >= '0' && c <= '9';
}

bool is_integer(const std::string &w) {
    std::size_t i = (w[0] == '-' || w[0] == '+') ? 1 : 0;
    if (i == w.size()) {
        return false;
    }
    for (; i < w.size(); i++) {
        if (!is_digit(w[i])) {
            return false;
        }
    }
    return true;
}

bool is_real(const std::string &w) {
    std::size_t i = (w[0] == '-' || w[0] == '+') ? 1 : 0;
    int dots = 0, digits = 0;
    for (; i < w.size(); i++) {
        if (w[i] == '.') {
            dots++;
        } else if (is_digit(w[i])) {
            digits++;
        } else {
            return false;
        }
    }
    return dots == 1 && digits > 0;
}

void describe(long long n) {
    std::cout << "целое " << n << ", " << (n % 2 == 0 ? "чётное" : "нечётное") << '\n';
}

void describe(double x) {
    std::cout << "дробное, округлено " << std::llround(x) << '\n';
}

void describe(const std::string &s) {
    std::cout << "слово " << s << ", длина " << s.size() << '\n';
}

int main() {
    std::string w;
    while (std::cin >> w) {
        if (is_integer(w)) {
            describe(std::stoll(w));
        } else if (is_real(w)) {
            describe(std::stod(w));
        } else {
            describe(w);
        }
    }
    return 0;
}`,
      explanation: `
Перегрузка позволяет назвать все три действия одним словом — «описать», — а выбор делает компилятор по типу аргумента: \`std::stoll\` возвращает \`long long\`, \`std::stod\` — \`double\`, а строка остаётся строкой. Если бы перегрузки для \`long long\` не было, вызов \`describe(std::stoll(w))\` молча выбрал бы \`describe(double)\`: преобразования \`long long\` в \`std::string\` нет, а в \`double\` есть, — и большие целые потеряли бы точность.

Вид слова определяется заранее проверкой символов, поэтому \`stoll\` и \`stod\` получают только корректные строки и не бросают исключений. \`std::llround\` округляет половины от нуля: 2.5 → 3, −2.5 → −3. Остаток \`n % 2\` для отрицательных нечётных равен −1, поэтому проверка — \`== 0\`.`,
      examples: [
        {
          in: '42 -7 3.6 hello\n',
          out: 'целое 42, чётное\nцелое -7, нечётное\nдробное, округлено 4\nслово hello, длина 5\n',
        },
        {
          in: '.5 - 1.2.3\n',
          out: 'дробное, округлено 1\nслово -, длина 1\nслово 1.2.3, длина 5\n',
        },
      ],
      hidden: [
        { in: '0\n', name: 'Ноль' },
        { in: '1000000000000000000 -999999999999999999\n', name: 'Большие целые' },
        { in: '2.5 -2.5 0.49\n', name: 'Округление половин' },
        { in: '+5 +2.0\n', name: 'Знак плюс' },
        { in: '5. .\n', name: 'Точка с краю' },
        { in: 'abc 12a a12\n', name: 'Смешанные' },
        { in: '-0 -0.0\n', name: 'Минус ноль' },
        { in: 'C++ 3.14159 2026\n', name: 'Разное' },
      ],
    },
    {
      title: 'Найди ошибку: ограничение диапазона',
      bug: true,
      description: `
Программа читает целые числа до конца ввода и для каждого печатает его, ограниченное отрезком \`[0, 100]\`: меньше 0 — печатается 0, больше 100 — 100. Для этого есть две перегрузки \`clamp_value\` — для \`long long\` и для \`double\`.

Программа не компилируется. Исправьте её.`,
      constraints: ['Числа int; не больше 100 чисел.'],
      hints: [
        'Прочитайте сообщение компилятора: call of overloaded clamp_value(int&, int, int) is ambiguous. Почему ни одна перегрузка не подходит лучше другой?',
        'int → long long и int → double — преобразования одного ранга. Замените две перегрузки одним шаблоном template <typename T> T clamp_value(T value, T lo, T hi) — для int компилятор создаст точную версию.',
      ],
      starter: CLAMP(false),
      solution: CLAMP(true),
      explanation: `
Аргументы вызова \`clamp_value(x, 0, 100)\` — три \`int\`. Перегрузки для \`int\` нет, а превращение \`int\` в \`long long\` и \`int\` в \`double\` — преобразования одного ранга. Ни один вариант не лучше другого, и компилятор сообщает о неоднозначности.

Можно было бы привести аргументы явно или добавить третью перегрузку для \`int\`. Но все три функции одинаковы, кроме типа, — это прямое показание для шаблона: одно тело, а версию для нужного типа создаст компилятор. Так устроена и стандартная \`std::clamp\` из \`<algorithm>\`.`,
      examples: [
        { in: '50\n-5\n150\n', out: '50\n0\n100\n' },
        { in: '0 100\n', out: '0\n100\n' },
      ],
      hidden: [
        '-2147483648\n',
        '2147483647\n',
        '1\n99\n',
        '101\n-1\n',
        '42\n',
        '7 -7 77 777\n',
        '100 100 0 0\n',
        '55 66 -77 188\n',
      ],
    },
    {
      title: 'Обобщённая статистика',
      difficulty: 'advanced',
      description: `
Первая строка — тип значений: \`int\` или \`str\`. Вторая — \`n\`, третья — \`n\` значений этого типа (числа или слова). Напечатайте \`минимум A, максимум B, различных K\`.

Напишите **шаблоны** функций, работающие с \`std::vector<T>\` для любого \`T\` с оператором \`<\`: \`smallest\`, \`largest\` и \`count_distinct\`, — и вызовите их для \`std::vector<long long>\` или \`std::vector<std::string>\`.`,
      constraints: [
        '1 ≤ n ≤ 1000; числа по модулю до 10¹⁸; слова — латинские буквы до 20 символов.',
      ],
      hints: [
        'template <typename T> T smallest(const std::vector<T> &v) — цикл по элементам с запоминанием наименьшего. largest — так же.',
        'count_distinct: скопируйте вектор (параметр по значению — уже копия), отсортируйте std::sort, удалите соседние повторы std::unique и верните новый размер.',
        'Чтобы не писать вывод дважды, сделайте шаблон report(const std::vector<T> &v), который вызывает остальные и печатает строку.',
      ],
      solution: String.raw`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

template <typename T>
T smallest(const std::vector<T> &v) {
    T best = v[0];
    for (const auto &x : v) {
        if (x < best) {
            best = x;
        }
    }
    return best;
}

template <typename T>
T largest(const std::vector<T> &v) {
    T best = v[0];
    for (const auto &x : v) {
        if (best < x) {
            best = x;
        }
    }
    return best;
}

template <typename T>
std::size_t count_distinct(std::vector<T> v) {
    std::sort(v.begin(), v.end());
    return static_cast<std::size_t>(std::unique(v.begin(), v.end()) - v.begin());
}

template <typename T>
void report(int n) {
    std::vector<T> values(static_cast<std::size_t>(n));
    for (auto &x : values) {
        std::cin >> x;
    }
    std::cout << "минимум " << smallest(values) << ", максимум " << largest(values)
              << ", различных " << count_distinct(values) << '\n';
}

int main() {
    std::string type;
    int n;
    if (!(std::cin >> type >> n) || n < 1) {
        return 0;
    }
    if (type == "int") {
        report<long long>(n);
    } else {
        report<std::string>(n);
    }
    return 0;
}`,
      explanation: `
Все функции используют только оператор \`<\`, копирование и сортировку — поэтому одно и то же тело работает и для чисел, и для строк. Компилятор создаёт две версии каждого шаблона: с \`T = long long\` и с \`T = std::string\`. Для строк \`<\` сравнивает по алфавиту (по кодам символов), поэтому минимум — первое по алфавиту слово.

\`report\` — шаблон, у которого \`T\` не выводится из аргументов (параметр только \`int n\`), поэтому тип указан явно: \`report<long long>(n)\`. \`count_distinct\` принимает вектор **по значению**: функции нужна своя копия для сортировки, и передача по значению выражает это честнее, чем копирование внутри.`,
      examples: [
        { in: 'int\n5\n3 -1 3 7 -1\n', out: 'минимум -1, максимум 7, различных 3\n' },
        { in: 'str\n4\npear apple pear fig\n', out: 'минимум apple, максимум pear, различных 3\n' },
      ],
      hidden: [
        { in: 'int\n1\n42\n', name: 'Одно число' },
        { in: 'str\n1\nsolo\n', name: 'Одно слово' },
        { in: 'int\n4\n5 5 5 5\n', name: 'Все равны' },
        { in: 'int\n3\n1000000000000000000 -1000000000000000000 0\n', name: 'Крайние значения' },
        { in: 'str\n3\nb B a\n', name: 'Регистр' },
        { in: 'str\n5\nab a abc abcd a\n', name: 'Префиксы' },
        { in: 'int\n6\n9 8 7 6 5 4\n', name: 'Все различны' },
        { in: 'str\n4\nzeta zeta zeta zeta\n', name: 'Повтор слова' },
      ],
    },
  ],
};
