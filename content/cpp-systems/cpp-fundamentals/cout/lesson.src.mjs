const PIXELS = (fixed) => String.raw`
#include <cstdint>
#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<std::uint8_t> pixels;
    int total = 0;
    for (int i = 0; i < n; i++) {
        int value;
        std::cin >> value;
        pixels.push_back(static_cast<std::uint8_t>(value));
        total += value;
    }
    for (std::size_t i = 0; i < pixels.size(); i++) {
        std::cout << ${fixed ? 'static_cast<int>(pixels[i])' : 'pixels[i]'} << (i + 1 < pixels.size() ? ' ' : '\n');
    }
    std::cout << "средняя " << total / n << '\n';
    return 0;
}`;

export default {
  id: 'cpp20-cout',
  title: 'Вывод: std::cout',
  description:
    'Вывод без строки формата и оператор <<; \\n и std::endl; std::cerr; манипуляторы <iomanip>: fixed и setprecision, setw, left и right, setfill; boolalpha, hex и uppercase; почему char и uint8_t печатаются символами.',
  moduleId: 'cpp-fundamentals',
  order: 3,
  difficulty: 'beginner',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-namespaces'],
  objectives: [
    'Выводить значения разных типов цепочкой <<',
    'Форматировать дробные числа и таблицы манипуляторами',
    'Отличать манипуляторы, которые действуют один раз, от запоминаемых',
    'Печатать байты и символы как числа',
  ],
  tags: ['C++', 'cout', 'iomanip', 'Форматирование'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iomanip>
#include <iostream>

int main() {
    std::cout << std::fixed << std::setprecision(3) << 2.0 / 3 << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['0.667'],
      placeholder: 'Вывод программы',
      explain: 'fixed с точностью 3 — ровно три знака после точки с округлением: 0.666… → 0.667.',
    },
    {
      q: 'Что выведет программа? Пробелы в ответе важны.',
      code: String.raw`
#include <iomanip>
#include <iostream>

int main() {
    std::cout << '[' << std::setw(4) << 7 << ']' << '[' << 7 << "]\n";
    return 0;
}`,
      lang: 'cpp',
      answers: ['[   7][7]'],
      placeholder: 'Вывод программы',
      explain:
        'setw(4) действует только на следующее значение: первая семёрка выровнена по правому краю поля из 4 символов, вторая печатается без ширины.',
    },
    {
      q: "Чем std::endl отличается от '\\n'?",
      options: [
        'std::endl ещё и сбрасывает буфер потока — это медленнее',
        'std::endl переводит строку дважды',
        'Ничем',
        "'\\n' не работает с std::cout",
      ],
      correct: 0,
      explain:
        "Оба переводят строку, но endl дополнительно вызывает flush. В циклах предпочтителен '\\n'.",
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>

int main() {
    std::cout << std::hex << 31 << ' ' << 16 << ' ' << std::dec << 16 << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['1f 10 16'],
      placeholder: 'Вывод программы',
      explain:
        'std::hex запоминается и действует на оба числа, пока std::dec не вернёт десятичную систему.',
    },
    {
      q: 'Какие манипуляторы действуют только на одно следующее значение?',
      options: ['std::setw', 'std::fixed', 'std::setfill', 'std::boolalpha'],
      correct: [0],
      explain:
        'Ширина сбрасывается после каждого вывода. fixed, setfill и boolalpha остаются в силе.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <cstdint>
#include <iostream>

int main() {
    std::uint8_t a = 72;
    std::uint8_t b = 105;
    std::cout << a << b << ' ' << +a << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['Hi 72'],
      placeholder: 'Вывод программы',
      explain:
        'uint8_t — это unsigned char, и он печатается символом: 72 — H, 105 — i. Унарный плюс превращает его в int.',
    },
    {
      q: 'Почему вывод через std::cout безопаснее printf?',
      options: [
        'Тип каждого значения известен компилятору, и спецификатор формата нельзя перепутать',
        'std::cout работает быстрее',
        'printf нельзя использовать в C++',
        'std::cout не буферизуется',
      ],
      correct: 0,
      explain:
        'printf("%d", 3.5) — неопределённое поведение. Оператор << выбирает способ печати по типу во время компиляции.',
    },
    {
      q: 'Какой поток используют для сообщений об ошибках?',
      answers: ['std::cerr', 'cerr'],
      placeholder: 'Имя потока',
      explain:
        'std::cerr — аналог stderr: не буферизуется и не смешивается с основным выводом при перенаправлении.',
    },
  ],
  exercises: [
    {
      title: 'Таблица результатов',
      difficulty: 'beginner',
      description: `
Первая строка — \`n\`, дальше \`n\` строк \`имя баллы\` (имена из латинских букв). Напечатайте таблицу: имя выровнено влево в поле шириной 12, баллы — вправо в поле шириной 6. Последняя строка таблицы — \`total\` и сумма баллов в том же формате.`,
      constraints: ['1 ≤ n ≤ 50; имена от 1 до 12 букв; 0 ≤ баллы ≤ 1000.'],
      hints: [
        "std::cout << std::left << std::setw(12) << name << std::right << std::setw(6) << score << '\\n';",
        'setw нужно ставить перед каждым полем, а left и right — переключать, потому что они запоминаются.',
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>
#include <string>

int main() {
    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    int total = 0;
    for (int i = 0; i < n; i++) {
        std::string name;
        int score;
        std::cin >> name >> score;
        total += score;
        std::cout << std::left << std::setw(12) << name << std::right << std::setw(6) << score << '\n';
    }
    std::cout << std::left << std::setw(12) << "total" << std::right << std::setw(6) << total << '\n';
    return 0;
}`,
      explanation: `
\`std::setw\` задаёт ширину только следующему значению, поэтому стоит перед каждым полем. \`std::left\` и \`std::right\` запоминаются: если не переключить обратно на \`left\` в начале следующей строки, имена тоже выровняются вправо.

Ширина — минимальная: имя длиннее поля напечаталось бы целиком и сдвинуло колонку. По условию имена не длиннее 12 букв, поэтому таблица ровная.`,
      examples: [
        {
          in: '3\nAnn 91\nBoris 7\nVera 100\n',
          out: 'Ann             91\nBoris            7\nVera           100\ntotal          198\n',
        },
        { in: '1\nX 0\n', out: 'X                0\ntotal            0\n' },
      ],
      hidden: [
        '2\nAbcdefghijkl 1000\nB 1000\n',
        '3\nA 1\nBb 22\nCcc 333\n',
        '4\nZed 0\nYan 0\nXi 0\nWu 0\n',
        '1\nLongnamehere 5\n',
        '5\nA 100\nB 200\nC 300\nD 400\nE 0\n',
        '2\nMax 999\nMin 1\n',
        '3\nq 10\nw 20\ne 30\n',
        '6\nAa 1\nBb 2\nCc 3\nDd 4\nEe 5\nFf 6\n',
      ],
    },
    {
      title: 'Чек',
      description: `
Каждая строка ввода — количество (целое) и цена за штуку (до двух знаков после точки). Для каждой строки напечатайте стоимость с двумя знаками после точки, а в конце — строку \`итого S\` с суммой, тоже с двумя знаками.`,
      constraints: ['Строк от 1 до 30; 1 ≤ количество ≤ 1000; 0 ≤ цена ≤ 100 000.'],
      hints: [
        'Один раз включите формат: std::cout << std::fixed << std::setprecision(2); — он запомнится для всех чисел.',
        'Количество читайте в int, цену — в double. Стоимость — количество * цена; сумму копите в double.',
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int quantity;
    double price;
    double total = 0;
    while (std::cin >> quantity >> price) {
        double cost = quantity * price;
        total += cost;
        std::cout << cost << '\n';
    }
    std::cout << "итого " << total << '\n';
    return 0;
}`,
      explanation: `
\`std::fixed\` вместе с \`std::setprecision(2)\` — аналог \`%.2f\`: ровно два знака после точки с округлением. Включить формат достаточно один раз, до цикла: манипуляторы запоминаются потоком.

Двоичный \`double\` не хранит 0,1 точно, и \`3 * 0.1\` на самом деле равно 0,30000000000000004. Округление до двух знаков при выводе скрывает эту погрешность. В настоящих финансовых программах суммы хранят в целых копейках, чтобы погрешности не накапливались.`,
      examples: [
        { in: '3 19.99\n2 0.5\n', out: '59.97\n1.00\nитого 60.97\n' },
        { in: '1 100\n', out: '100.00\nитого 100.00\n' },
      ],
      hidden: [
        '3 0.1\n',
        '1 0\n',
        '1000 100000\n',
        '7 12.34\n3 0.66\n',
        '10 0.01\n10 0.02\n10 0.03\n',
        '2 49.99\n1 0.02\n',
        '5 1.5\n5 2.5\n',
        '999 99.99\n',
      ],
    },
    {
      title: 'Найди ошибку: яркость пикселей',
      bug: true,
      description: `
Программа читает \`n\` и \`n\` яркостей пикселей от 0 до 255, хранит их в \`std::vector<std::uint8_t>\`, печатает через пробел и на следующей строке — среднюю яркость (целая часть).

Вместо чисел программа печатает странные символы. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 100; 0 ≤ яркость ≤ 255.'],
      hints: [
        'Какой тип у std::uint8_t на самом деле и как оператор << печатает этот тип?',
        'std::uint8_t — это unsigned char, и << печатает его символом. Перед выводом приведите значение к int: static_cast<int>(pixels[i]).',
      ],
      starter: PIXELS(false),
      solution: PIXELS(true),
      explanation: `
\`std::uint8_t\` удобен для байтов, но это не отдельный числовой тип: на всех распространённых платформах это псевдоним \`unsigned char\`. Оператор \`<<\` для символьных типов печатает символ, а не число: яркость 65 выводится как \`A\`, 10 — как перевод строки, 0 — как невидимый нулевой байт.

Исправление — привести значение к \`int\` перед выводом: \`static_cast<int>(pixels[i])\` или короче \`+pixels[i]\`. Сумма уже копится в \`int\`, поэтому средняя печатается правильно. Хранить байты в \`std::uint8_t\` по-прежнему разумно: так массив пикселей занимает вчетверо меньше памяти, чем в \`int\`.`,
      examples: [
        { in: '3\n65 66 67\n', out: '65 66 67\nсредняя 66\n' },
        { in: '1\n255\n', out: '255\nсредняя 255\n' },
      ],
      hidden: [
        '2\n0 255\n',
        '1\n10\n',
        '4\n1 2 3 4\n',
        '3\n128 128 128\n',
        '5\n0 0 0 0 1\n',
        '2\n32 126\n',
        '6\n200 210 220 230 240 250\n',
        '3\n9 13 48\n',
      ],
    },
    {
      title: 'Шестнадцатеричный дамп',
      difficulty: 'advanced',
      description: `
Прочитайте весь ввод побайтно (включая пробелы и переводы строк) и напечатайте его шестнадцатеричный дамп по 8 байт в строке:

\`\`\`text
0000: 48 65 6c 6c 6f 2c 20 43  |Hello, C|
0008: 2b 2b 0a                 |++.|
\`\`\`

Формат строки: смещение первого байта — 4 шестнадцатеричные цифры с ведущими нулями, двоеточие и пробел; затем до 8 байт двумя строчными шестнадцатеричными цифрами через пробел — эта колонка всегда шириной 23 символа, в неполной строке она дополняется пробелами справа; затем два пробела и байты как символы между \`|\`: печатные символы с кодами 32–126 как есть, остальные — точкой. Если ввод пуст, напечатайте \`пусто\`.`,
      constraints: ['Ввод до 2000 байт, ASCII.'],
      hints: [
        'Чтение всех байтов: char c; std::string data; while (std::cin.get(c)) data += c; — get, в отличие от >>, не пропускает пробелы.',
        "Шестнадцатеричное число с ведущим нулём: std::cout << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(static_cast<unsigned char>(c));. setw повторяйте перед каждым числом.",
        'Ширина колонки байтов постоянна: 8 · 3 − 1 = 23 символа. Проще всего собрать её в std::string, дополнить пробелами до 23 и потом напечатать.',
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string data;
    char c;
    while (std::cin.get(c)) {
        data += c;
    }
    if (data.empty()) {
        std::cout << "пусто\n";
        return 0;
    }
    for (std::size_t offset = 0; offset < data.size(); offset += 8) {
        std::ostringstream bytes;
        std::string text;
        for (std::size_t i = offset; i < offset + 8 && i < data.size(); i++) {
            unsigned char byte = static_cast<unsigned char>(data[i]);
            if (i > offset) {
                bytes << ' ';
            }
            bytes << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(byte);
            text += byte >= 32 && byte <= 126 ? static_cast<char>(byte) : '.';
        }
        std::cout << std::hex << std::setw(4) << std::setfill('0') << offset << ": ";
        std::cout << std::left << std::setw(23) << std::setfill(' ') << bytes.str() << std::right;
        std::cout << "  |" << text << "|\n";
    }
    return 0;
}`,
      explanation: `
Дамп собирается из трёх полей, и у каждого свой формат. Смещение — \`hex\` с шириной 4 и заполнителем \`'0'\`. Байты — тоже \`hex\`, ширина 2 и заполнитель \`'0'\`; символ сначала приводится к \`unsigned char\`, чтобы байты больше 127 не стали отрицательными, а затем к \`int\`, чтобы печатался код, а не символ. Колонка байтов собрана в \`std::ostringstream\` — поток, который пишет в строку, — и выведена с шириной 23 и выравниванием влево: так последняя неполная строка дополняется пробелами, и колонка символов не сдвигается.

Манипуляторы запоминаются, поэтому после колонки байтов поток явно возвращается к \`std::right\` и заполнителю пробелом перед следующим числом. \`std::cin.get(c)\` читает каждый байт, включая пробелы и переводы строк, — оператор \`>>\` их бы пропустил.`,
      examples: [
        {
          in: 'Hello, C++\n',
          out: '0000: 48 65 6c 6c 6f 2c 20 43  |Hello, C|\n0008: 2b 2b 0a                 |++.|\n',
        },
        { in: '', out: 'пусто\n' },
      ],
      hidden: [
        { in: 'A', name: 'Один байт' },
        { in: '12345678', name: 'Ровно одна строка' },
        { in: '123456789', name: 'Девять байт' },
        { in: '\t\n \n', name: 'Непечатные символы' },
        { in: '~ !\n', name: 'Границы печатных' },
        { in: `${'abcdefgh'.repeat(40)}`, name: 'Смещение больше 0x100' },
        { in: 'line one\nline two\n', name: 'Две строки' },
        { in: '0123456789ABCDEF', name: 'Две полные строки' },
      ],
    },
  ],
};
