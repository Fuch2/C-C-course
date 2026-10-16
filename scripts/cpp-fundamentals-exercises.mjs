// Здесь хранятся тексты C++20; исполнять их разрешено только Docker runner.
export const exercises = [];
const program = (headers, functions, body) =>
  `${headers}\n\n${functions}\nint main() {\n${body}\n}\n`;
function add(
  id,
  title,
  description,
  headers,
  functions,
  body,
  cases,
  demoBody,
  stdout,
  explanation,
) {
  exercises.push({
    id,
    title,
    description,
    source: program(headers, functions, body),
    cases,
    demo: program(headers, functions, demoBody),
    stdout,
    explanation,
  });
}
add(
  'difference',
  'Независимая копия имени устройства',
  'Прочитайте одну ASCII-строку длиной 0…200, включая пробелы. Скопируйте её в отдельный std::string и добавьте к копии суффикс " [копия]". Выведите исходную строку и изменённую копию на отдельных строках. Пустой stdin — пустая строка. Не используйте ручное выделение памяти.',
  '#include <iostream>\n#include <string>',
  '',
  `    std::string original;
    std::getline(std::cin, original);
    auto copy = original;
    copy += " [копия]";
    std::cout << original << '\\n' << copy << '\\n';`,
  [
    ['sensor A\n', 'sensor A\nsensor A [копия]\n'],
    ['\n', '\n [копия]\n'],
    ['', '\n [копия]\n'],
    ['  x  \n', '  x  \n  x   [копия]\n'],
  ],
  `    std::string original{"sensor"};
    auto copy = original;
    copy += "-backup";
    std::cout << original << '\\n' << copy << '\\n';`,
  'sensor\nsensor-backup\n',
  'getline сохраняет пробелы. Инициализация copy создаёт владеющую строку с независимым значением. Оба объекта освобождают ресурсы при выходе из области видимости. Копирование и приписывание требуют O(n) времени в общей оценке, две строки — O(n) памяти.',
);
add(
  'namespaces',
  'Две системы единиц',
  'Ввод: meters и feet, целые 0…10000. Создайте metric::length(int), возвращающую сантиметры (meters×100), и imperial::length(int), возвращающую дюймы (feet×12). Выведите два результата через пробел. Пространство имён выбирается явно.',
  '#include <iostream>',
  `namespace metric {
int length(int meters) { return meters * 100; }
}
namespace imperial {
int length(int feet) { return feet * 12; }
}`,
  `    int meters{}, feet{};
    if (!(std::cin >> meters >> feet)) return 1;
    std::cout << metric::length(meters) << ' ' << imperial::length(feet) << '\\n';`,
  [
    ['2 3', '200 36\n'],
    ['0 0', '0 0\n'],
    ['10000 10000', '1000000 120000\n'],
    ['1 12', '100 144\n'],
  ],
  `    std::cout << metric::length(2) << ' ' << imperial::length(3) << '\\n';`,
  '200 36\n',
  'Имена разрешаются при компиляции. Каждая функция выполняет одно умножение: время и память O(1). int достаточен для заданного диапазона на платформе runner. Пространство имён ещё не предотвращает передачу feet в metric::length: для этого нужны отдельные типы единиц.',
);
add(
  'cout',
  'Сумма без ошибок округления',
  'Ввод: целое cents от −1000000 до 1000000. Выведите сумму с точкой и ровно двумя цифрами после неё, например −5 → -0.05. Используйте std::cout, std::setw и std::setfill; храните сумму в целых единицах, без double.',
  '#include <iostream>\n#include <iomanip>',
  `void print_amount(long long cents) {
    if (cents < 0) { std::cout << '-'; cents = -cents; }
    std::cout << cents / 100 << '.' << std::setfill('0')
              << std::setw(2) << cents % 100 << '\\n';
}`,
  `    long long cents{};
    if (!(std::cin >> cents)) return 1;
    print_amount(cents);`,
  [
    ['1234', '12.34\n'],
    ['-5', '-0.05\n'],
    ['0', '0.00\n'],
    ['1000000', '10000.00\n'],
    ['-1000000', '-10000.00\n'],
    ['101', '1.01\n'],
  ],
  '    print_amount(5);\n    print_amount(-1234);',
  '0.05\n-12.34\n',
  'Знак выводится до получения модуля; диапазон исключает отрицание минимального long long. Частное даёт целую часть, остаток — сотые. setw относится к следующему полю, setfill сохраняется. Стоимость форматирования зависит от числа цифр; ошибок двоичного представления дробей здесь нет.',
);
add(
  'cin',
  'Проверяемый поток измерений',
  'В stdin от 0 до 100 целых измерений −1000…1000, разделённых пробелами. Если есть некорректный токен, переполнение int или нарушение диапазона/количества, выведите ОШИБКА. Иначе — количество и сумму через пробел. 12x тоже ошибка. Допускается пустой ввод.',
  '#include <iostream>\n#include <sstream>',
  `void summarize(std::istream& input) {
    int count = 0;
    long long sum = 0;
    while (true) {
        input >> std::ws;
        if (input.eof()) break;
        int value{};
        if (!(input >> value) || value < -1000 || value > 1000 || count == 100) {
            std::cout << "ОШИБКА\\n";
            return;
        }
        ++count;
        sum += value;
    }
    std::cout << count << ' ' << sum << '\\n';
}`,
  '    summarize(std::cin);',
  [
    ['10 -2 4\n', '3 12\n'],
    ['', '0 0\n'],
    ['   \n', '0 0\n'],
    ['12x', 'ОШИБКА\n'],
    ['999999999999999999999', 'ОШИБКА\n'],
    ['1001', 'ОШИБКА\n'],
    ['-1000 1000', '2 0\n'],
  ],
  '    std::istringstream input{"10 -2 4"};\n    summarize(input);',
  '3 12\n',
  'EOF после пропуска пробелов означает нормальное завершение. Ошибка извлечения числа, даже вместе с eofbit, остаётся ошибкой: это важно для переполнения в конце файла. После чтения 12 из 12x остаётся x, и следующая попытка отвергает его. Сумма печатается после проверки всего входа. Время линейно по длине входа, память O(1).',
);
add(
  'string',
  'Части команды с пустыми полями',
  'Прочитайте одну ASCII-строку длиной до 200 и разделите по ;. Выведите количество полей, затем каждое на новой строке. Сохраните пустые поля, включая последнее: a;;b; даёт четыре поля. Пустая строка содержит одно пустое поле. Не используйте strtok.',
  '#include <iostream>\n#include <string>',
  `void split_command(const std::string& text) {
    std::size_t count = 1;
    for (char ch : text) if (ch == ';') ++count;
    std::cout << count << '\\n';
    std::size_t start = 0;
    while (true) {
        const auto end = text.find(';', start);
        std::cout << text.substr(start, end == std::string::npos ? end : end - start) << '\\n';
        if (end == std::string::npos) break;
        start = end + 1;
    }
}`,
  '    std::string text;\n    std::getline(std::cin, text);\n    split_command(text);',
  [
    ['a;;b;\n', '4\na\n\nb\n\n'],
    ['\n', '1\n\n'],
    [';', '2\n\n\n'],
    ['abc', '1\nabc\n'],
    [' a ; b ', '2\n a \n b \n'],
  ],
  '    split_command("a;;b;");',
  '4\na\n\nb\n\n',
  'find возвращает позицию либо npos; проверяем npos до прибавления единицы. substr(size) создаёт пустую строку. substr владеет результатом и копирует байты. Диапазоны не перекрываются, суммарный поиск и копирование O(n), пиковая рабочая память O(n). size считает char, а не буквы Unicode.',
);
add(
  'references',
  'Калибровка на месте',
  'Ввод: value и offset, целые −1000…1000. Создайте calibrate(int& value, int offset), прибавляющую offset к исходной переменной. Вызовите дважды и выведите значение после каждого вызова через пробел. Не возвращайте новое значение вместо изменения аргумента.',
  '#include <iostream>',
  'void calibrate(int& value, int offset) { value += offset; }',
  `    int value{}, offset{};
    if (!(std::cin >> value >> offset)) return 1;
    calibrate(value, offset);
    std::cout << value << ' ';
    calibrate(value, offset);
    std::cout << value << '\\n';`,
  [
    ['10 2', '12 14\n'],
    ['0 0', '0 0\n'],
    ['-5 3', '-2 1\n'],
    ['1000 -1000', '0 -1000\n'],
  ],
  `    int measurement = 10;
    calibrate(measurement, 2);
    std::cout << measurement << '\\n';`,
  '12\n',
  'int& — псевдоним переменной вызывающего кода. offset передан по значению. Два вызова изменяют один объект последовательно. Время и память O(1). Ссылка не сохраняется дольше вызова, поэтому заимствование не переживает исходную переменную.',
);
add(
  'const-references',
  'Контрольная сумма без копии',
  'Прочитайте ASCII-строку длиной 0…200 с пробелами. checksum(const std::string& text) суммирует коды байтов в unsigned long long. Выведите сумму, затем исходную строку. Пустой stdin — пустая строка. При передаче в функцию строка не копируется и не изменяется.',
  '#include <iostream>\n#include <string>',
  `unsigned long long checksum(const std::string& text) {
    unsigned long long sum = 0;
    for (unsigned char byte : text) sum += byte;
    return sum;
}`,
  `    std::string text;
    std::getline(std::cin, text);
    std::cout << checksum(text) << '\\n' << text << '\\n';`,
  [
    ['AB', '131\nAB\n'],
    ['', '0\n\n'],
    ['a b', '227\na b\n'],
    ['0', '48\n0\n'],
  ],
  `    std::cout << checksum("AB") << '\\n';`,
  '131\n',
  'Параметр заимствует строку и запрещает изменение через эту ссылку. Преобразование к unsigned char исключает влияние знака char на сумму. Для литерала в демонстрации создаётся временный std::string: отсутствие копии параметра не исключает конверсию аргумента. Время O(n), рабочая память функции O(1).',
);
add(
  'auto',
  'Копия и псевдоним измерения',
  'Ввод: value и delta, целые −1000…1000. Создайте auto copy = value и auto& alias = value. Прибавьте delta к alias, затем 1 к copy. Выведите value, copy и alias через пробел.',
  '#include <iostream>',
  '',
  `    int value{}, delta{};
    if (!(std::cin >> value >> delta)) return 1;
    auto copy = value;
    auto& alias = value;
    alias += delta;
    ++copy;
    std::cout << value << ' ' << copy << ' ' << alias << '\\n';`,
  [
    ['10 3', '13 11 13\n'],
    ['0 0', '0 1 0\n'],
    ['-5 -2', '-7 -4 -7\n'],
    ['1000 -1000', '0 1001 0\n'],
  ],
  `    int value = 10;
    auto copy = value;
    auto& alias = value;
    alias += 3;
    std::cout << value << ' ' << copy << '\\n';`,
  '13 10\n',
  'auto выводит int, auto& — int&. alias изменяет value, инкремент copy — отдельный объект. Вывод типа происходит при компиляции. Копирование int дёшево; auto copy для большого контейнера могло бы означать линейное копирование всех элементов.',
);
add(
  'range-for',
  'Преобразование ASCII-команды',
  'Прочитайте ASCII-строку длиной до 200. В range-based for через char& замените a…z на соответствующие заглавные. Остальные ASCII-символы сохраните. Выведите результат. Не используйте индексы и locale-зависимое преобразование.',
  '#include <iostream>\n#include <string>',
  `void uppercase_ascii(std::string& text) {
    for (char& ch : text) {
        if (ch >= 'a' && ch <= 'z') ch = static_cast<char>(ch - 'a' + 'A');
    }
}`,
  `    std::string text;
    std::getline(std::cin, text);
    uppercase_ascii(text);
    std::cout << text << '\\n';`,
  [
    ['start x1', 'START X1\n'],
    ['', '\n'],
    ['aZ09_!', 'AZ09_!\n'],
    ['  ab  ', '  AB  \n'],
  ],
  `    std::string command{"start x1"};
    uppercase_ascii(command);
    std::cout << command << '\\n';`,
  'START X1\n',
  'char& привязывается к элементу; char ch изменял бы копию. Длина строки не меняется, итераторы остаются действительными. Алгоритм рассчитан на ASCII, а не Unicode. Один проход — O(n) времени и O(1) рабочей памяти.',
);
add(
  'overload',
  'Масштабирование двух видов измерений',
  'Ввод: I и int −1000…1000 либо D и конечное double в том же диапазоне, кратное 1. Создайте scale(int) → value×2 и scale(double) → value×0.5. Вызовите нужную через аргумент соответствующего типа. Для I выведите целое, для D — fixed с одной цифрой после точки.',
  '#include <iostream>\n#include <iomanip>',
  'int scale(int value) { return value * 2; }\ndouble scale(double value) { return value * 0.5; }',
  `    char tag{};
    if (!(std::cin >> tag)) return 1;
    if (tag == 'I') {
        int value{};
        if (!(std::cin >> value)) return 1;
        std::cout << scale(value) << '\\n';
    } else if (tag == 'D') {
        double value{};
        if (!(std::cin >> value)) return 1;
        std::cout << std::fixed << std::setprecision(1) << scale(value) << '\\n';
    } else return 1;`,
  [
    ['I 7', '14\n'],
    ['D 7', '3.5\n'],
    ['I -4', '-8\n'],
    ['D -8', '-4.0\n'],
    ['D 0', '0.0\n'],
  ],
  `    std::cout << scale(7) << ' ' << scale(7.0) << '\\n';`,
  '14 3.5\n',
  'Статический тип аргумента выбирает точную перегрузку. Значение 7.0 не выбирает int только потому, что математически целое. Работа O(1). Для реального API смысл перегрузок стоит согласовывать; здесь различие намеренно делает выбор видимым в результате.',
);
add(
  'default-arguments',
  'Настраиваемый порог тревоги',
  'Ввод: value и threshold, целые −1000…1000. above(int value, int threshold = 80) возвращает value > threshold. Выведите above(value) и above(value, threshold) как 0 или 1 через пробел.',
  '#include <iostream>',
  'bool above(int value, int threshold = 80) { return value > threshold; }',
  `    int value{}, threshold{};
    if (!(std::cin >> value >> threshold)) return 1;
    std::cout << above(value) << ' ' << above(value, threshold) << '\\n';`,
  [
    ['90 100', '1 0\n'],
    ['80 70', '0 1\n'],
    ['-5 -10', '0 1\n'],
    ['80 80', '0 0\n'],
  ],
  `    std::cout << above(90) << ' ' << above(90, 100) << '\\n';`,
  '1 0\n',
  'Пропущенный аргумент подставляется из видимого объявления. Равенство не вызывает тревогу. Default argument не создаёт вторую функцию. Два сравнения стоят O(1); сложное выражение по умолчанию могло бы требовать отдельного вычисления при вызове.',
);

function simple(id, title, description, headers, body, cases, demo, stdout, explanation) {
  add(id, title, description, headers, '', body, cases, demo, stdout, explanation);
}
simple(
  'vector',
  'Очистка отрицательных измерений',
  'Прочитайте n (0…100) и n целых значений. Сохраните их в std::vector<int>, удалите отрицательные через std::erase_if и выведите оставшиеся через пробел.',
  '#include <iostream>\n#include <vector>\n#include <algorithm>',
  `    int n{}; if (!(std::cin>>n)||n<0||n>100) return 1; std::vector<int> v; for(int i=0,x;i<n;++i){if(!(std::cin>>x))return 1;v.push_back(x);} std::erase_if(v,[](int x){return x<0;}); for(std::size_t i=0;i<v.size();++i) std::cout<<(i?" ":"")<<v[i]; std::cout<<'\\n';`,
  [
    ['4 3 -1 0 -2', '3 0\n'],
    ['0', '\n'],
    ['3 -1 -2 -3', '\n'],
    ['3 1 2 3', '1 2 3\n'],
  ],
  `    std::vector<int> v{3,-1,0}; std::erase_if(v,[](int x){return x<0;}); for(int x:v)std::cout<<x<<' '; std::cout<<'\\n';`,
  '3 0 \n',
  'erase_if уплотняет вектор, сохраняя порядок. Доступ к элементам плотный и обычно хорошо использует кеш. Фильтрация O(n), память контейнера O(n).',
);
simple(
  'array',
  'Циклическое окно',
  'Прочитайте четыре значения и k. Сдвиньте std::array<int,4> влево на k%4 через std::rotate и выведите окно.',
  '#include <iostream>\n#include <array>\n#include <algorithm>',
  `    std::array<int,4> a{}; for(int& x:a)if(!(std::cin>>x))return 1; int k{}; if(!(std::cin>>k)||k<0)return 1; std::rotate(a.begin(),a.begin()+k%4,a.end()); for(int i=0;i<4;++i)std::cout<<(i?" ":"")<<a[i]; std::cout<<'\\n';`,
  [
    ['1 2 3 4 1', '2 3 4 1\n'],
    ['1 2 3 4 4', '1 2 3 4\n'],
    ['0 0 0 0 9', '0 0 0 0\n'],
  ],
  `    std::array<int,4> a{1,2,3,4}; std::rotate(a.begin(),a.begin()+1,a.end()); for(int x:a)std::cout<<x<<' '; std::cout<<'\\n';`,
  '2 3 4 1 \n',
  'std::array хранит ровно четыре элемента без heap. rotate линейна по размеру диапазона, индексы не проверяются; фиксированный размер известен компилятору.',
);
simple(
  'deque',
  'Двусторонняя очередь команд',
  'Ввод q и команды L x, R x, O. L/R добавляют число на левый/правый конец std::deque<int>, O извлекает слева или печатает ПУСТО.',
  '#include <iostream>\n#include <deque>',
  `    int q{}; if(!(std::cin>>q)||q<0||q>100)return 1; std::deque<int> d; for(int i=0;i<q;++i){char c{};std::cin>>c;if(c=='O'){if(d.empty())std::cout<<"ПУСТО\\n";else{std::cout<<d.front()<<'\\n';d.pop_front();}}else{int x{};std::cin>>x;if(c=='L')d.push_front(x);else if(c=='R')d.push_back(x);else return 1;}}`,
  [
    ['5 R 1 L 2 O O', '2\n1\n'],
    ['1 O', 'ПУСТО\n'],
    ['0', ''],
  ],
  `    std::deque<int> d{1}; d.push_front(2); std::cout<<d.front()<<'\\n';`,
  '2\n',
  'deque поддерживает быстрые операции на обоих концах. Внутреннее представление сегментированное, поэтому случайный доступ обычно чуть менее локален, чем vector; удаление спереди не требует сдвига всех элементов.',
);
simple(
  'map',
  'Упорядоченный журнал',
  'Ввод пар name value до n. Последняя запись заменяет предыдущую. Напечатайте std::map в лексикографическом порядке.',
  '#include <iostream>\n#include <map>\n#include <string>',
  `    int n{};if(!(std::cin>>n)||n<0||n>100)return 1;std::map<std::string,int> m;for(int i=0;i<n;++i){std::string k;int v;if(!(std::cin>>k>>v))return 1;m.insert_or_assign(k,v);}for(const auto& [k,v]:m)std::cout<<k<<' '<<v<<'\\n';`,
  [
    ['3 b 1 a 2 b 9', 'a 2\nb 9\n'],
    ['0', ''],
    ['2 x 1 x 2', 'x 2\n'],
  ],
  `    std::map<std::string,int> m{{"b",1},{"a",2}}; for(const auto& [k,v]:m)std::cout<<k<<' '<<v<<'\\n';`,
  'a 2\nb 1\n',
  'map хранит уникальные ключи упорядоченно. Операции поиска и вставки O(log n), узлы требуют дополнительной памяти и хуже используют кеш, чем плотный vector.',
);
simple(
  'unordered-map',
  'Частоты событий',
  'Ввод n имён, затем q запросов. Подсчитайте частоты в std::unordered_map и выведите частоту каждого запроса; отсутствующий ключ — 0.',
  '#include <iostream>\n#include <unordered_map>\n#include <string>',
  `    int n{};if(!(std::cin>>n)||n<0||n>100)return 1;std::unordered_map<std::string,int> m;for(int i=0;i<n;++i){std::string s;std::cin>>s;++m[s];}int q{};std::cin>>q;for(int i=0;i<q;++i){std::string s;std::cin>>s;auto it=m.find(s);std::cout<<(it==m.end()?0:it->second)<<'\\n';}`,
  [
    ['3 a b a 3 a c b', '2\n0\n1\n'],
    ['0 2 x y', '0\n0\n'],
    ['4 x x x x 1 x', '4\n'],
  ],
  `    std::unordered_map<std::string,int> m{{"a",2}}; std::cout<<m.at("a")<<'\\n';`,
  '2\n',
  'Хеш-таблица даёт ожидаемое O(1), но не гарантирует порядок и имеет худший O(n). find не создаёт отсутствующий ключ, в отличие от operator[].',
);
simple(
  'set',
  'Уникальные коды',
  'Ввод n кодов, затем low high. Выведите уникальные значения std::set в диапазоне [low,high].',
  '#include <iostream>\n#include <set>',
  `    int n{};if(!(std::cin>>n)||n<0||n>100)return 1;std::set<int>s;for(int i=0,x;i<n;++i){std::cin>>x;s.insert(x);}int lo{},hi{};std::cin>>lo>>hi;bool first=true;for(auto it=s.lower_bound(lo);it!=s.end()&&*it<=hi;++it){if(!first)std::cout<<' ';std::cout<<*it;first=false;}std::cout<<'\\n';`,
  [
    ['5 3 1 3 5 2 2 5', '2 3 5\n'],
    ['0 0 9', '\n'],
    ['3 1 2 3 5 1', '\n'],
  ],
  `    std::set<int> s{3,1,3,5,2}; for(int x:s)std::cout<<x<<' '; std::cout<<'\\n';`,
  '1 2 3 5 \n',
  'set удаляет дубликаты и хранит сортировку. lower_bound сразу пропускает меньшие элементы. Поиск O(log n), обход диапазона O(k), память O(n).',
);
simple(
  'pair',
  'Минимум и максимум',
  'Ввод непустого n и n чисел. Верните минимум и максимум как std::pair и распакуйте результат.',
  '#include <iostream>\n#include <vector>\n#include <utility>',
  `    int n{};if(!(std::cin>>n)||n<1||n>100)return 1;std::vector<int>v(n);for(int&x:v)std::cin>>x;std::pair<int,int> r{v[0],v[0]};for(int x:v){if(x<r.first)r.first=x;if(x>r.second)r.second=x;}auto [lo,hi]=r;std::cout<<lo<<' '<<hi<<'\\n';`,
  [
    ['3 7 -2 4', '-2 7\n'],
    ['1 -5', '-5 -5\n'],
    ['4 0 0 0 0', '0 0\n'],
  ],
  `    auto [lo,hi]=std::pair{ -2, 7 }; std::cout<<lo<<' '<<hi<<'\\n';`,
  '-2 7\n',
  'pair объединяет два связанных значения без out-параметров. Инициализация первым элементом корректна и для полностью отрицательного набора. Один проход O(n), результат O(1).',
);
simple(
  'tuple',
  'Сводка измерений',
  'Ввод n значений; верните tuple(valid,sum,errors), где отрицательные — ошибки.',
  '#include <iostream>\n#include <vector>\n#include <tuple>',
  `    int n{};if(!(std::cin>>n)||n<0||n>100)return 1;std::vector<int>v(n);for(int&x:v)std::cin>>x;int valid=0,errors=0;long long sum=0;for(int x:v){if(x<0)++errors;else{++valid;sum+=x;}}auto [a,b,c]=std::tuple{valid,sum,errors};std::cout<<a<<' '<<b<<' '<<c<<'\\n';`,
  [
    ['4 3 -1 0 -2', '2 3 2\n'],
    ['0', '0 0 0\n'],
    ['2 5 6', '2 11 0\n'],
  ],
  `    auto [a,b,c]=std::tuple{2,10LL,1}; std::cout<<a<<' '<<b<<' '<<c<<'\\n';`,
  '2 10 1\n',
  'tuple возвращает несколько значений одного результата. Порядок полей — часть контракта, поэтому для публичного API иногда яснее структура с именами.',
);
simple(
  'exceptions',
  'Разбор с обработкой ошибок',
  'Ввод q строковых токенов. std::stoi должен полностью разобрать токен и дать число −1000…1000; иначе печатайте ОШИБКА.',
  '#include <iostream>\n#include <string>\n#include <stdexcept>',
  `    int q{};if(!(std::cin>>q)||q<0||q>100)return 1;for(int i=0;i<q;++i){std::string s;std::cin>>s;try{std::size_t p{};int x=std::stoi(s,&p);if(p!=s.size()||x<-1000||x>1000)throw std::out_of_range("range");std::cout<<x<<'\\n';}catch(const std::exception&){std::cout<<"ОШИБКА\\n";}}`,
  [
    ['4 12 12x -3 1001', '12\nОШИБКА\n-3\nОШИБКА\n'],
    ['0', ''],
    ['2 bad 7', 'ОШИБКА\n7\n'],
  ],
  `    try { std::cout<<std::stoi("12x")<<'\\n'; } catch(const std::exception&) { std::cout<<"ОШИБКА\\n"; }`,
  'ОШИБКА\n',
  'Исключение отделяет обычный путь от ошибки. Проверка позиции p нужна: stoi допускает числовой префикс. Исключительный путь дороже ветвления, поэтому не используйте исключения для ожидаемого каждого элемента.',
);
simple(
  'enum-class',
  'Машина состояний',
  'Ввод q команд START STOP FAIL. enum class State начинает Idle; допустимые переходы печатают состояние, запрещённые — НЕТ.',
  '#include <iostream>\n#include <string>',
  `    enum class State{Idle,Running,Error};State s=State::Idle;int q{};if(!(std::cin>>q)||q<0||q>100)return 1;for(int i=0;i<q;++i){std::string c;std::cin>>c;bool ok=false;if(c=="FAIL"){s=State::Error;ok=true;}else if(s==State::Idle&&c=="START"){s=State::Running;ok=true;}else if(s==State::Running&&c=="STOP"){s=State::Idle;ok=true;}if(!ok){std::cout<<"НЕТ\\n";continue;}switch(s){case State::Idle:std::cout<<"ОЖИДАНИЕ\\n";break;case State::Running:std::cout<<"РАБОТА\\n";break;case State::Error:std::cout<<"ОШИБКА\\n";break;}}`,
  [
    ['4 START STOP FAIL START', 'РАБОТА\nОЖИДАНИЕ\nОШИБКА\nНЕТ\n'],
    ['0', ''],
    ['3 STOP START STOP', 'НЕТ\nРАБОТА\nОЖИДАНИЕ\n'],
  ],
  `    std::cout<<"ОЖИДАНИЕ\\n";`,
  'ОЖИДАНИЕ\n',
  'enum class не смешивается неявно с int, поэтому состояния нельзя случайно сложить. Переходы остаются явными, стоимость фиксированная O(1), а неверные команды обрабатываются как данные.',
);
