const NUMBERED = (fixed) => String.raw`
#include <iostream>
${fixed ? '#include <limits>\n' : ''}#include <string>

int main() {
    int n;
    if (!(std::cin >> n)) {
        return 0;
    }${fixed ? "\n    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');" : ''}
    for (int i = 1; i <= n; i++) {
        std::string line;
        std::getline(std::cin, line);
        std::cout << i << ": " << line << '\n';
    }
    return 0;
}`;

export default {
  id: 'cpp20-cin',
  title: 'Ввод: std::cin',
  description:
    'Ввод по типу переменной оператором >>; чтение до конца ввода; состояние ошибки, clear и пропуск мешающих символов; std::getline и ловушка после >>; std::ws и ignore; разбор строк через std::istringstream; ускорение ввода.',
  moduleId: 'cpp-fundamentals',
  order: 5,
  difficulty: 'beginner',
  estimatedMinutes: 45,
  prerequisites: ['cpp23-format'],
  objectives: [
    'Читать значения разных типов и читать до конца ввода',
    'Обнаруживать ошибку чтения и восстанавливать поток',
    'Читать строки целиком и сочетать getline с >>',
    'Разбирать строки строковым потоком',
  ],
  tags: ['C++', 'cin', 'getline', 'istringstream'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа на вводе «4 abc 5»?',
      code: String.raw`
#include <iostream>

int main() {
    int sum = 0, x;
    while (std::cin >> x) {
        sum += x;
    }
    std::cout << sum << '\n';
    return 0;
}`,
      lang: 'cpp',
      noRun: true,
      answers: ['4'],
      placeholder: 'Вывод программы',
      explain:
        'Чтение «abc» как числа не удаётся, поток переходит в состояние ошибки, и цикл заканчивается. Пятёрка не прочитана.',
    },
    {
      q: 'Что прочитает std::cin >> name, где name — std::string, из строки «Анна Петрова»?',
      options: ['Анна', 'Анна Петрова', 'Пустую строку', 'Ошибку чтения'],
      correct: 0,
      explain:
        '>> для строки читает одно слово — до первого пробельного символа. Для строки с пробелами нужен std::getline.',
    },
    {
      q: 'Почему getline сразу после std::cin >> n возвращает пустую строку?',
      options: [
        '>> оставляет в потоке перевод строки после числа, и getline читает строку до него — пустую',
        'getline всегда пропускает первую строку',
        'n занимает всю строку',
        'Это ошибка компилятора',
      ],
      correct: 0,
      explain:
        "Перед getline нужно пропустить остаток строки: std::cin >> std::ws или std::cin.ignore(…, '\\n').",
    },
    {
      q: 'Что делает std::cin.clear()?',
      options: [
        'Сбрасывает состояние ошибки потока, чтобы чтение снова работало',
        'Удаляет из потока все непрочитанные символы',
        'Очищает экран',
        'Закрывает ввод',
      ],
      correct: 0,
      explain:
        'clear не удаляет символы: слово, из-за которого чтение не удалось, остаётся в потоке, и его нужно забрать отдельно.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream in("7 8 x 9");
    int a = 0, b = 0, c = 0, d = 0;
    in >> a >> b >> c >> d;
    std::cout << a << ' ' << b << ' ' << c << ' ' << d << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['7 8 0 0'],
      placeholder: 'Вывод программы',
      explain:
        'a и b прочитаны. На «x» чтение c не удаётся — c получает 0, поток в ошибке, и чтение d уже не выполняется: d остаётся 0.',
    },
    {
      q: 'Какие способы правильно читают строку текста с пробелами после std::cin >> n?',
      options: [
        'std::getline(std::cin >> std::ws, line)',
        "std::cin.ignore(…, '\\n'); std::getline(std::cin, line)",
        'std::getline(std::cin, line) сразу после >>',
        'std::cin >> line',
      ],
      correct: [0, 1],
      explain:
        'Оба первых способа убирают перевод строки, оставленный оператором >>. Третий вернёт пустую строку, четвёртый прочитает одно слово.',
    },
    {
      q: 'Что выведет программа на вводе из двух строк «3 4» и «5»?',
      code: String.raw`
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        int x, count = 0;
        while (in >> x) {
            count++;
        }
        std::cout << count;
    }
    std::cout << '\n';
    return 0;
}`,
      lang: 'cpp',
      noRun: true,
      answers: ['21'],
      placeholder: 'Вывод программы',
      explain:
        'В первой строке два числа, во второй одно: печатается 2, затем 1 — без разделителя.',
    },
    {
      q: 'Что дают строки std::ios::sync_with_stdio(false); std::cin.tie(nullptr);?',
      options: [
        'Ускоряют ввод: отключают синхронизацию со scanf и сброс cout перед каждым чтением',
        'Включают проверку ошибок ввода',
        'Разрешают смешивать cin и scanf',
        'Делают ввод небуферизованным',
      ],
      correct: 0,
      explain: 'После отключения синхронизации cin и scanf в одной программе смешивать нельзя.',
    },
  ],
  exercises: [
    {
      title: 'Анкета',
      difficulty: 'beginner',
      description: `
Ввод — три строки: полное имя (может содержать пробелы), возраст (целое число), город (может содержать пробелы). Напечатайте:

\`\`\`text
Имя: <имя>
Возраст: <возраст>
Город: <город>
\`\`\``,
      constraints: ['Имя и город — непустые строки до 100 символов; 0 ≤ возраст ≤ 150.'],
      hints: [
        'Имя — std::getline(std::cin, name); возраст — std::cin >> age.',
        'После >> в потоке остался перевод строки: город читайте так — std::getline(std::cin >> std::ws, city).',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

int main() {
    std::string name, city;
    int age;
    std::getline(std::cin, name);
    std::cin >> age;
    std::getline(std::cin >> std::ws, city);
    std::cout << "Имя: " << name << '\n';
    std::cout << "Возраст: " << age << '\n';
    std::cout << "Город: " << city << '\n';
    return 0;
}`,
      explanation: `
Имя и город могут содержать пробелы, поэтому читаются \`std::getline\`. Возраст читается \`>>\`, который останавливается сразу после числа, оставляя в потоке перевод строки. Без \`std::ws\` следующий \`getline\` прочитал бы пустой остаток строки с возрастом, и город оказался бы пустым.

\`std::cin >> std::ws\` пропускает все пробельные символы и возвращает поток — поэтому его можно передать прямо в \`getline\`.`,
      examples: [
        { in: 'Ада Лавлейс\n36\nЛондон\n', out: 'Имя: Ада Лавлейс\nВозраст: 36\nГород: Лондон\n' },
        { in: 'Alan\n41\nNew York\n', out: 'Имя: Alan\nВозраст: 41\nГород: New York\n' },
      ],
      hidden: [
        'X\n0\nY\n',
        'Мария Склодовская-Кюри\n66\nПариж\n',
        'Grace Brewster Murray Hopper\n85\nArlington, Virginia\n',
        'A B\n150\nC D E\n',
        'Linus\n  28\nHelsinki\n',
        'Ken Thompson\n81\nNew Orleans\n',
        'Bjarne\n74\nAarhus\n',
        'Dennis Ritchie\n70\nBerkeley Heights\n',
      ],
    },
    {
      title: 'Суммы по строкам',
      description: `
Каждая строка ввода содержит ноль или больше целых чисел через пробелы. Для каждой строки напечатайте сумму её чисел, а для строки без чисел — \`пусто\`.`,
      constraints: ['Строк не больше 50; в строке не больше 100 чисел; |числа| ≤ 10⁹.'],
      hints: [
        'Читайте ввод построчно: while (std::getline(std::cin, line)).',
        'Каждую строку разберите строковым потоком: std::istringstream in(line); while (in >> x) … Сумма до 10¹¹ — long long.',
      ],
      solution: String.raw`
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        long long sum = 0, x;
        int count = 0;
        while (in >> x) {
            sum += x;
            count++;
        }
        if (count == 0) {
            std::cout << "пусто\n";
        } else {
            std::cout << sum << '\n';
        }
    }
    return 0;
}`,
      explanation: `
Если читать числа прямо из \`std::cin\`, границы строк потеряются: \`>>\` считает перевод строки обычным пробелом. Поэтому сначала строка читается целиком, а потом разбирается отдельным потоком \`std::istringstream\` — он читается тем же оператором \`>>\` и так же сообщает о конце.

Пустая строка или строка из пробелов не содержит чисел — счётчик остаётся нулём, и печатается \`пусто\`. Сумма считается в \`long long\`: сто чисел до 10⁹ дают до 10¹¹.`,
      examples: [
        { in: '1 2 3\n10\n', out: '6\n10\n' },
        { in: '\n-5 5\n', out: 'пусто\n0\n' },
      ],
      hidden: [
        '7\n',
        '   \n',
        '1000000000 1000000000 1000000000\n',
        '-1 -2 -3\n\n4\n',
        '  12   30  \n',
        '0\n0 0\n',
        '1 1 1 1 1 1 1 1 1 1\n2 2\n',
        '\n\n\n',
      ],
    },
    {
      title: 'Найди ошибку: нумерация строк',
      bug: true,
      description: `
Первая строка ввода — число \`n\`, дальше \`n\` строк текста (строки могут начинаться с пробелов и быть пустыми — печатать их нужно как есть). Программа печатает каждую строку с номером: \`1: текст\`.

Нумерация сбивается: первая строка выводится пустой, а последняя теряется. Найдите и исправьте ошибку.`,
      constraints: ['1 ≤ n ≤ 50; строки до 200 символов.'],
      hints: [
        'Что остаётся в потоке после std::cin >> n? Что прочитает первый вызов getline?',
        "Пропустите остаток первой строки один раз, сразу после чтения n: std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n'). std::ws здесь не подойдёт — он съест и пустые строки, и пробелы в начале первой строки текста.",
      ],
      starter: NUMBERED(false),
      solution: NUMBERED(true),
      explanation: `
\`std::cin >> n\` останавливается сразу после числа, и перевод строки остаётся в потоке. Первый \`getline\` читает остаток этой строки — пустой — и программа печатает его как первую строку текста. Все строки сдвигаются, а последняя не успевает прочитаться.

Исправление — пропустить остаток строки с числом: \`ignore\` с огромным пределом и разделителем \`'\\n'\`. Здесь важно не использовать \`std::ws\`: он пропустил бы не только перевод строки, но и пустые строки и пробелы в начале первой строки текста, а по условию их нужно напечатать как есть.`,
      examples: [
        { in: '2\nfirst\nsecond\n', out: '1: first\n2: second\n' },
        { in: '1\n  indented\n', out: '1:   indented\n' },
      ],
      hidden: [
        '3\na\nb\nc\n',
        '2\n\nafter empty\n',
        '1\nonly\n',
        '3\n  one\n   two\nthree  \n',
        '2\nс пробелами внутри\nещё строка\n',
        '4\n1\n2\n3\n4\n',
        '2\n\n\n',
        '3\nx\n\ny\n',
      ],
    },
    {
      title: 'Проверка ввода',
      difficulty: 'advanced',
      description: `
Ввод — слова и числа вперемешку. Читайте целые числа оператором \`>>\`. Если чтение не удалось, сбросьте ошибку потока, прочитайте мешающее слово в строку и продолжайте.

Напечатайте \`сумма S, чисел K, пропущено M\`, где \`K\` — сколько чисел прочитано, \`M\` — сколько слов пропущено.

Обратите внимание: \`>>\` читает число, пока может, поэтому из \`12abc\` прочитается число 12, а слово \`abc\` будет пропущено отдельно; из \`3.5\` — число 3, а пропущено \`.5\`.`,
      constraints: [
        'Числа во вводе помещаются в int; слов и чисел не больше 1000.',
        'Нет одиночных знаков «+» и «-» и слов, начинающихся со знака и не продолжающихся цифрой.',
      ],
      hints: [
        'Цикл: while (true) { if (std::cin >> x) { … } else if (std::cin.eof()) break; else { std::cin.clear(); std::string bad; std::cin >> bad; … } }.',
        'Проверка eof() отличает «ввод кончился» от «встретилось не число»: в первом случае восстанавливать нечего.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

int main() {
    long long sum = 0;
    int numbers = 0, skipped = 0;
    while (true) {
        int x;
        if (std::cin >> x) {
            sum += x;
            numbers++;
        } else if (std::cin.eof()) {
            break;
        } else {
            std::cin.clear();
            std::string bad;
            std::cin >> bad;
            skipped++;
        }
    }
    std::cout << "сумма " << sum << ", чисел " << numbers << ", пропущено " << skipped << '\n';
    return 0;
}`,
      explanation: `
Неудачное чтение бывает по двум причинам: ввод кончился или встретилось не число. Метод \`eof()\` различает их: при конце ввода цикл заканчивается, а иначе нужно восстановиться — \`clear()\` снимает состояние ошибки, но не убирает символы, поэтому мешающее слово забирается отдельным чтением в строку.

Оператор \`>>\` для \`int\` жаден: он берёт столько символов, сколько может составить число, и останавливается на первом неподходящем. Поэтому \`12abc\` разбивается на число 12 и слово \`abc\`, а \`3.5\` — на 3 и \`.5\`. Если нужна проверка «всё слово целиком — число», слово читают в строку и разбирают целиком — например, \`std::stoi\` с проверкой позиции; об этом в уроке об исключениях.`,
      examples: [
        { in: '12 abc 7 x9 -3\n', out: 'сумма 16, чисел 3, пропущено 2\n' },
        { in: '12abc 3.5\n', out: 'сумма 15, чисел 2, пропущено 2\n' },
      ],
      hidden: [
        { in: '', name: 'Пусто' },
        { in: 'один два три\n', name: 'Только слова' },
        { in: '1 2 3\n', name: 'Только числа' },
        { in: '2147483647 1\n', name: 'Большие числа' },
        { in: '-5 minus 5 plus\n', name: 'Знаки' },
        { in: 'a1 1a 11\n', name: 'Цифры в словах' },
        { in: '10\nword\n20\n\nmore words 30\n', name: 'Несколько строк' },
        { in: '0.5 .5 5.\n', name: 'Дроби' },
      ],
    },
  ],
};
