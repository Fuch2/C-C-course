const HISTOGRAM = (fixed) => String.raw`
#include <iostream>
#include <print>

// Считает, сколько раз встретилось каждое число от 0 до size - 1.
class Histogram {
public:
    explicit Histogram(int size) : counts_(new int[size]{}), size_(size) {}
${
  fixed
    ? `
    ~Histogram() {
        delete[] counts_;
    }
`
    : ''
}
    Histogram(const Histogram &) = delete;
    Histogram &operator=(const Histogram &) = delete;

    void add(int value) {
        if (value >= 0 && value < size_) {
            counts_[value]++;
        }
    }

    void print() const {
        for (int i = 0; i < size_; i++) {
            if (counts_[i] > 0) {
                std::println("{}: {}", i, counts_[i]);
            }
        }
    }

private:
    int *counts_;
    int size_;
};

int main() {
    Histogram h(10);
    int x;
    while (std::cin >> x) {
        h.add(x);
    }
    h.print();
    return 0;
}`;

export default {
  id: 'oop-destructor',
  title: 'Деструктор и время жизни',
  description:
    'Деструктор — парный конструктору метод, который вызывает компилятор; когда заканчивается жизнь локальных, временных, вложенных и глобальных объектов; обратный порядок разрушения локальных объектов и полей; RAII — ресурс в руках объекта; new[] и delete[]; запрет копирования класса, владеющего ресурсом; почему деструктор не бросает исключений.',
  moduleId: 'cpp-oop',
  order: 6,
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  prerequisites: ['oop-private'],
  objectives: [
    'Предсказывать момент и порядок вызова деструкторов',
    'Освобождать ресурсы в деструкторе по принципу RAII',
    'Запрещать копирование класса, владеющего ресурсом',
  ],
  tags: ['C++23', 'ООП', 'Деструктор', 'RAII', 'Время жизни'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Что выведет программа? Запишите вывод в одну строку через пробел.',
      code: String.raw`
#include <print>

struct T {
    char c;
    explicit T(char c) : c(c) { std::print("+{} ", c); }
    ~T() { std::print("-{} ", c); }
};

void run() {
    T a('a');
    {
        T b('b');
        T c('c');
    }
    T d('d');
}

int main() {
    run();
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['+a +b +c -c -b +d -d -a'],
      placeholder: 'Вывод программы',
      explain:
        'b и c уничтожаются при выходе из блока в обратном порядке, затем при выходе из run — d и a, тоже в обратном порядке.',
    },
    {
      q: 'Когда вызывается деструктор локального объекта?',
      options: [
        'При выходе из его блока любым путём — обычным, через return, break или исключение',
        'Только при обычном выходе из блока',
        'Когда программист вызывает его явно',
        'При завершении программы',
      ],
      correct: 0,
      explain: 'Поэтому работа, записанная в деструкторе, выполняется при любом пути выхода.',
    },
    {
      q: 'В каком порядке уничтожаются поля объекта?',
      options: [
        'После тела деструктора, в порядке, обратном объявлению',
        'До тела деструктора, в порядке объявления',
        'В порядке инициализации в списке конструктора',
        'В алфавитном порядке',
      ],
      correct: 0,
      explain: 'Построение и разрушение зеркальны: в теле деструктора поля ещё живы.',
    },
    {
      q: 'Что означает RAII?',
      options: [
        'Ресурс захватывается в конструкторе и освобождается в деструкторе — его жизнь совпадает с жизнью объекта',
        'Ресурсы выделяются только при запуске программы',
        'Все объекты создаются в куче',
        'Исключения запрещены',
      ],
      correct: 0,
      explain:
        'Resource Acquisition Is Initialization — основная идиома управления ресурсами в C++.',
    },
    {
      q: 'Класс выделяет память new int[n] в конструкторе и освобождает delete[] в деструкторе, но копирование не запрещено. Что произойдёт при IntBuffer b = a; и выходе из блока?',
      options: [
        'Оба объекта освободят один и тот же массив — двойное освобождение',
        'b получит собственную копию массива',
        'Ошибка компиляции',
        'Ничего плохого: деструктор вызовется один раз',
      ],
      correct: 0,
      explain:
        'Копирование по умолчанию копирует указатель, а не массив. Поэтому такое копирование запрещают через = delete.',
    },
    {
      q: 'Чем освобождают память, выделенную new int[100]?',
      answers: ['delete[]', 'delete []', 'delete[] p', 'delete[] p;'],
      placeholder: 'Оператор',
      explain:
        'Для массивов — delete[], для одиночных объектов — delete. Перепутанная пара — неопределённое поведение.',
    },
    {
      q: 'Что выведет программа? Запишите вывод в одну строку через пробел.',
      code: String.raw`
#include <print>

struct Part {
    int id;
    explicit Part(int id) : id(id) { std::print("{} ", id); }
    ~Part() { std::print("~{} ", id); }
};

struct Box {
    Part first{1};
    Part second{2};
    Box() { std::print("box "); }
    ~Box() { std::print("~box "); }
};

int main() {
    {
        Box b;
    }
    std::println();
    return 0;
}`,
      lang: 'cpp',
      answers: ['1 2 box ~box ~2 ~1'],
      placeholder: 'Вывод программы',
      explain:
        'Сначала поля в порядке объявления, потом тело конструктора; разрушение — в обратном порядке.',
    },
    {
      q: 'Почему деструктор не должен бросать исключений?',
      options: [
        'Он может вызываться во время раскрутки стека, и второе исключение завершит программу через std::terminate',
        'Исключения в деструкторе игнорируются',
        'Деструктор не может содержать try',
        'Это замедляет программу',
      ],
      correct: 0,
      explain:
        'Деструкторы по умолчанию noexcept; ошибки освобождения в них записывают в журнал или игнорируют.',
    },
    {
      q: 'Когда уничтожается временный объект в строке Guard("x").print();?',
      options: [
        'В конце полного выражения — после вызова print',
        'Сразу после создания, до вызова print',
        'В конце блока',
        'При завершении программы',
      ],
      correct: 0,
      explain: 'Временные объекты живут до конца полного выражения, в котором созданы.',
    },
  ],
  exercises: [
    {
      id: 'oop-destructor-exercise',
      title: 'Вход и выход',
      difficulty: 'beginner',
      description: `
Ввод — слова. Опишите класс \`Guard\`, конструктор которого печатает \`вход: слово\`, а деструктор — \`выход: слово\`. Создайте охранников **вложенно**: первый охраняет всё, внутри его жизни создаётся второй, внутри жизни второго — третий и так далее.

Для вложенности удобна рекурсивная функция \`visit(words, i)\`: она создаёт охранника для \`words[i]\` и вызывает себя для \`i + 1\`.`,
      constraints: ['Слов не больше 30.'],
      hints: [
        'void visit(const std::vector<std::string> &words, std::size_t i) { if (i == words.size()) return; Guard g(words[i]); visit(words, i + 1); }',
        'Печатать «выход» вручную не нужно: деструктор g вызовется сам, когда visit завершится.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>
#include <utility>
#include <vector>

class Guard {
public:
    explicit Guard(std::string name) : name_(std::move(name)) {
        std::println("вход: {}", name_);
    }

    ~Guard() {
        std::println("выход: {}", name_);
    }

private:
    std::string name_;
};

void visit(const std::vector<std::string> &words, std::size_t i) {
    if (i == words.size()) {
        return;
    }
    Guard guard(words[i]);
    visit(words, i + 1);
}

int main() {
    std::vector<std::string> words;
    std::string word;
    while (std::cin >> word) {
        words.push_back(word);
    }
    visit(words, 0);
    return 0;
}`,
      explanation: `
Каждый вызов \`visit\` создаёт своего охранника и живёт, пока не завершатся все более глубокие вызовы. Поэтому выходы печатаются в обратном порядке: самый глубокий охранник уничтожается первым. Это тот же порядок, что у вложенных блоков, — стек вызовов работает как стопка областей видимости.

В программе нет ни одной строки, печатающей «выход»: это делает компилятор, вызывая деструктор при возврате из функции.`,
      examples: [
        {
          in: 'дом комната шкаф\n',
          out: 'вход: дом\nвход: комната\nвход: шкаф\nвыход: шкаф\nвыход: комната\nвыход: дом\n',
        },
        { in: '', out: '' },
      ],
      hidden: [
        { in: 'один\n', name: 'Один' },
        { in: 'a b\n', name: 'Два' },
        { in: 'x x x\n', name: 'Повторы' },
        { in: 'main parse read close\n', name: 'Четыре' },
        { in: 'a\nb\nc\nd\ne\n', name: 'По строкам' },
        { in: 'город улица дом квартира комната\n', name: 'Пять' },
        { in: 'z y\n', name: 'Обратный алфавит' },
        { in: '1 2 3 4 5 6 7 8\n', name: 'Восемь' },
      ],
    },
    {
      title: 'Буфер в куче',
      description: `
Первое число ввода — размер буфера \`n\`. Опишите класс \`IntBuffer\`, который в конструкторе выделяет в куче массив из \`n\` нулей (\`new int[n]{}\`), в деструкторе освобождает его и запрещает копирование. Интерфейс: \`bool set(int i, int value)\`, \`bool get(int i, int &out) const\`, \`long long sum() const\`.

Команды: \`set i v\`, \`get i\` (напечатайте значение) и \`sum\`. Для индекса вне буфера печатайте \`нет индекса i\`.`,
      constraints: ['1 ≤ n ≤ 10⁵; команд не больше 100; значения по модулю до 10⁹.'],
      hints: [
        'Поля: int *data_ и int size_. Проверка индекса: i >= 0 && i < size_.',
        'Копирование: IntBuffer(const IntBuffer &) = delete; IntBuffer &operator=(const IntBuffer &) = delete;. Освобождение — delete[] data_; в деструкторе.',
      ],
      solution: String.raw`
#include <iostream>
#include <print>
#include <string>

class IntBuffer {
public:
    explicit IntBuffer(int size) : data_(new int[size]{}), size_(size) {}

    ~IntBuffer() {
        delete[] data_;
    }

    IntBuffer(const IntBuffer &) = delete;
    IntBuffer &operator=(const IntBuffer &) = delete;

    bool set(int i, int value) {
        if (!valid(i)) {
            return false;
        }
        data_[i] = value;
        return true;
    }

    bool get(int i, int &out) const {
        if (!valid(i)) {
            return false;
        }
        out = data_[i];
        return true;
    }

    long long sum() const {
        long long s = 0;
        for (int i = 0; i < size_; i++) {
            s += data_[i];
        }
        return s;
    }

private:
    bool valid(int i) const {
        return i >= 0 && i < size_;
    }

    int *data_;
    int size_;
};

int main() {
    int n;
    std::cin >> n;
    IntBuffer buffer(n);
    std::string command;
    while (std::cin >> command) {
        if (command == "sum") {
            std::println("{}", buffer.sum());
            continue;
        }
        int i;
        std::cin >> i;
        if (command == "set") {
            int value;
            std::cin >> value;
            if (!buffer.set(i, value)) {
                std::println("нет индекса {}", i);
            }
        } else {
            int value;
            if (buffer.get(i, value)) {
                std::println("{}", value);
            } else {
                std::println("нет индекса {}", i);
            }
        }
    }
    return 0;
}`,
      explanation: `
Буфер владеет массивом: выделяет его при создании и освобождает при уничтожении, поэтому в \`main\` нет ни одного \`delete[]\`. Запуск под AddressSanitizer подтверждает, что утечки нет.

Запрет копирования — не формальность. Без него \`IntBuffer copy = buffer;\` скопировал бы указатель, и в конце оба объекта освободили бы один массив. Проверка индекса вынесена в закрытый метод \`valid\`: её используют и \`set\`, и \`get\`. Пустые фигурные скобки в \`new int[size]{}\` обнуляют элементы — без них в массиве был бы мусор.`,
      examples: [
        { in: '5\nset 0 10\nset 4 -3\nget 4\nsum\n', out: '-3\n7\n' },
        { in: '3\nset 3 1\nget -1\n', out: 'нет индекса 3\nнет индекса -1\n' },
      ],
      hidden: [
        { in: '1\nsum\n', name: 'Новый буфер' },
        { in: '2\nset 0 1000000000\nset 1 1000000000\nsum\n', name: 'Большие значения' },
        { in: '100000\nset 99999 5\nget 99999\nsum\n', name: 'Большой буфер' },
        { in: '4\nget 2\n', name: 'Ноль по умолчанию' },
        { in: '3\nset 1 5\nset 1 7\nget 1\n', name: 'Перезапись' },
        { in: '2\nset 2 1\nset -5 1\nsum\n', name: 'Только ошибки' },
        { in: '5\nset 0 1\nset 1 2\nset 2 3\nset 3 4\nset 4 5\nsum\n', name: 'Заполнение' },
        { in: '3\n', name: 'Без команд' },
      ],
    },
    {
      title: 'Найди ошибку: забытый деструктор',
      bug: true,
      description: `
Программа читает числа и печатает гистограмму: для каждого числа от 0 до 9, которое встретилось, — строку \`число: сколько раз\`. Числа вне 0–9 пропускаются.

Вывод верный, но проверка с AddressSanitizer отклоняет решение. Найдите и исправьте ошибку в классе \`Histogram\`.`,
      constraints: ['Чисел не больше 1000, каждое по модулю до 10⁶.'],
      hints: [
        'Запустите программу и прочитайте отчёт LeakSanitizer в конце: какая память не освобождена?',
        'Конструктор выделяет массив new int[size]{}, но никто его не освобождает. Добавьте деструктор ~Histogram() с delete[] counts_;.',
      ],
      starter: HISTOGRAM(false),
      solution: HISTOGRAM(true),
      explanation: `
Класс захватывает ресурс — массив в куче, — но не освобождает его: у него нет деструктора. Программа печатает правильный ответ, но при завершении LeakSanitizer находит невозвращённый блок (\`detected memory leaks\`), и проверка отклоняет решение. В долго работающей программе каждая гистограмма оставляла бы утечку.

RAII требует обе половины: захват в конструкторе **и** освобождение в деструкторе. Копирование здесь уже запрещено — значит, освобождение в деструкторе безопасно. Ещё проще — хранить счётчики в \`std::vector<int>\`: он сам реализует RAII, и деструктор писать не придётся.`,
      examples: [
        { in: '3 1 3 9 3\n', out: '1: 1\n3: 3\n9: 1\n' },
        { in: '10 -1\n', out: '' },
      ],
      hidden: [
        '0\n',
        '5 5 5 5\n',
        '0 1 2 3 4 5 6 7 8 9\n',
        '9 8 7\n',
        '1000000 -1000000 4\n',
        '2 2 3 3 3\n',
        '',
        '7\n7\n0\n',
      ],
    },
    {
      title: 'Временный файл',
      difficulty: 'advanced',
      description: `
Опишите класс \`TempFile\` — владельца временного файла C. Конструктор открывает файл функцией \`std::tmpfile()\` из \`<cstdio>\` и бросает \`std::runtime_error\`, если она вернула \`nullptr\`; деструктор закрывает файл \`std::fclose\` (временный файл при этом удаляется системой). Копирование запрещено. Методы: \`void write_line(const std::string &)\`, \`void rewind()\`, \`bool read_line(std::string &out)\`.

Программа записывает в файл все строки ввода, перематывает его в начало, читает обратно и печатает \`строк N\` и \`самая длинная: текст\` (первая из самых длинных по числу байтов) или только \`строк 0\`.`,
      constraints: ['Строк не больше 100, каждая не длиннее 200 байт.'],
      hints: [
        "write_line: std::fputs(text.c_str(), file_); std::fputc('\\n', file_);. rewind: std::rewind(file_);.",
        "read_line: char buf[256]; if (!std::fgets(buf, sizeof buf, file_)) return false; затем убрать '\\n' в конце и присвоить out = buf.",
      ],
      solution: String.raw`
#include <cstdio>
#include <iostream>
#include <print>
#include <stdexcept>
#include <string>

class TempFile {
public:
    TempFile() : file_(std::tmpfile()) {
        if (file_ == nullptr) {
            throw std::runtime_error("не удалось создать временный файл");
        }
    }

    ~TempFile() {
        std::fclose(file_);
    }

    TempFile(const TempFile &) = delete;
    TempFile &operator=(const TempFile &) = delete;

    void write_line(const std::string &text) {
        std::fputs(text.c_str(), file_);
        std::fputc('\n', file_);
    }

    void rewind() {
        std::rewind(file_);
    }

    bool read_line(std::string &out) {
        char buffer[256];
        if (std::fgets(buffer, sizeof buffer, file_) == nullptr) {
            return false;
        }
        out = buffer;
        if (!out.empty() && out.back() == '\n') {
            out.pop_back();
        }
        return true;
    }

private:
    std::FILE *file_;
};

int main() {
    TempFile file;
    std::string line;
    while (std::getline(std::cin, line)) {
        file.write_line(line);
    }
    file.rewind();
    int count = 0;
    std::string longest;
    bool any = false;
    while (file.read_line(line)) {
        count++;
        if (!any || line.size() > longest.size()) {
            longest = line;
            any = true;
        }
    }
    std::println("строк {}", count);
    if (any) {
        std::println("самая длинная: {}", longest);
    }
    return 0;
}`,
      explanation: `
\`FILE *\` — ресурс из мира C, и его тоже можно отдать под управление объекта. Конструктор либо открывает файл, либо бросает исключение — объекта с нулевым указателем не существует, и методам не нужно его проверять. Деструктор закрывает файл при любом выходе из \`main\`, в том числе при исключении.

Методы скрывают функции C и превращают их в операции класса. Запрет копирования обязателен: две копии закрыли бы один \`FILE *\` дважды. Стандартная библиотека C++ решает ту же задачу классом \`std::fstream\` — он тоже закрывает файл в деструкторе.`,
      examples: [
        {
          in: 'первая\nсамая длинная строка\nкороткая\n',
          out: 'строк 3\nсамая длинная: самая длинная строка\n',
        },
        { in: '', out: 'строк 0\n' },
      ],
      hidden: [
        { in: 'одна\n', name: 'Одна строка' },
        { in: 'aa\nbb\ncc\n', name: 'Равные' },
        { in: '\n\n\n', name: 'Пустые строки' },
        { in: 'x\nxx\nxxx\nxxxx\n', name: 'Растущие' },
        { in: 'длинная строка с пробелами\nкороче\n', name: 'Первая длиннее' },
        { in: 'a b c\nd e f g\n', name: 'С пробелами' },
        { in: '1\n22\n1\n22\n', name: 'Ничья по длине' },
        { in: 'последняя без перевода', name: 'Без перевода строки' },
      ],
    },
  ],
};
