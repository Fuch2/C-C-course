const COUNT_A = (fixed) => String.raw`
#include <iostream>
#include <string>

std::string lower(const std::string &text) {
    std::string result = text;
    for (char &c : result) {
        if (c >= 'A' && c <= 'Z') {
            c = static_cast<char>(c - 'A' + 'a');
        }
    }
    return result;
}

int count_char(${fixed ? 'const std::string &' : 'std::string &'}text, char wanted) {
    int count = 0;
    for (char c : text) {
        if (c == wanted) {
            count++;
        }
    }
    return count;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::cout << count_char(lower(line), 'a') << '\n';
    }
    return 0;
}`;

export default {
  id: 'cpp20-const-references',
  title: 'Константные ссылки',
  description:
    'Цена передачи по значению; const T& — передача без копирования и без права изменять; константная ссылка и временные значения; константные переменные и контейнеры; как выбирать способ передачи параметра; обход контейнера без копий; возврат константной ссылки.',
  moduleId: 'cpp-fundamentals',
  order: 8,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['cpp20-references'],
  objectives: [
    'Передавать большие объекты константной ссылкой',
    'Объяснять, почему неконстантная ссылка не принимает временные значения',
    'Выбирать способ передачи параметра по его размеру и назначению',
    'Обходить контейнеры без копирования элементов',
  ],
  tags: ['C++', 'const', 'Ссылки', 'Параметры функций'],
  standard: 'c++23',
  diagnostics: 'sanitizers',
  quiz: [
    {
      q: 'Как лучше передать в функцию std::vector<std::string>, если функция только читает его?',
      options: [
        'const std::vector<std::string> &',
        'std::vector<std::string> — по значению',
        'std::vector<std::string> &',
        'std::vector<std::string> *',
      ],
      correct: 0,
      explain:
        'Константная ссылка не копирует вектор и запрещает его менять. По значению — копия всех строк, неконстантная ссылка — лишнее право на изменение.',
    },
    {
      q: 'Какие вызовы скомпилируются для функции int len(std::string &s)?',
      options: [
        'std::string a = "x"; len(a);',
        'len("hello");',
        'std::string a = "x"; len(a + "y");',
        'len(std::string("z"));',
      ],
      correct: [0],
      explain:
        'Неконстантная ссылка связывается только с именованным изменяемым объектом. Литерал, результат + и явно созданная временная строка — временные значения.',
    },
    {
      q: 'Какой способ передачи лучше для параметра типа double, который функция только читает?',
      options: ['По значению: double', 'const double &', 'double &', 'double *'],
      correct: 0,
      explain:
        'Копирование маленького значения дешевле, чем передача адреса и обращение через него.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> v = {"a", "bb", "ccc"};
    for (std::string s : v) {
        s += "!";
    }
    std::size_t total = 0;
    for (const std::string &s : v) {
        total += s.size();
    }
    std::cout << total << '\n';
    return 0;
}`,
      lang: 'cpp',
      answers: ['6'],
      placeholder: 'Вывод программы',
      explain:
        'Первый цикл меняет копии строк, и вектор не меняется. Суммарная длина 1 + 2 + 3 = 6.',
    },
    {
      q: 'Что произойдёт при компиляции?',
      code: String.raw`
void show(const std::string &s) {
    s += "!";
}`,
      lang: 'cpp',
      noRun: true,
      options: [
        'Ошибка компиляции: s — константная ссылка, изменять строку нельзя',
        'Компилируется; строка вызывающего изменится',
        'Компилируется; изменится копия',
        'Ошибка при запуске программы',
      ],
      correct: 0,
      explain: 'const в типе параметра — обещание функции, и компилятор следит за его выполнением.',
    },
    {
      q: 'Что разрешено делать с const std::vector<int> v = {1, 2, 3};?',
      options: [
        'Читать v[0]',
        'Вызывать v.size()',
        'Вызывать v.push_back(4)',
        'Присваивать v[0] = 5',
      ],
      correct: [0, 1],
      explain: 'У константного объекта можно вызывать только методы, которые его не меняют.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <iostream>
#include <string>

void append(std::string &s) {
    s += "+";
}

void show(const std::string &s) {
    std::cout << s << '\n';
}

int main() {
    std::string lang = "C";
    append(lang);
    append(lang);
    show(lang + "!");
    return 0;
}`,
      lang: 'cpp',
      answers: ['C++!'],
      placeholder: 'Вывод программы',
      explain:
        'append дважды меняет lang через неконстантную ссылку. show принимает временную строку lang + "!" — константная ссылка с ней связывается.',
    },
    {
      q: 'Когда допустимо вернуть из функции const std::string &?',
      options: [
        'Когда ссылка указывает на объект, который переживёт вызов, — например, на элемент вектора, переданного по ссылке',
        'Всегда',
        'Когда строка — локальная переменная функции',
        'Никогда',
      ],
      correct: 0,
      explain:
        'Ссылка на локальную переменную после возврата висит. На элемент внешнего контейнера — действительна, пока контейнер жив и не меняется.',
    },
  ],
  exercises: [
    {
      title: 'Самая длинная строка',
      difficulty: 'beginner',
      description: `
Первая строка — \`n\`, вторая — \`n\` слов. Напишите функцию

\`\`\`cpp
const std::string &longest(const std::vector<std::string> &words);
\`\`\`

которая возвращает ссылку на самое длинное слово (первое из самых длинных), и напечатайте результат и его длину.`,
      constraints: ['1 ≤ n ≤ 1000; слова из латинских букв длиной до 100.'],
      hints: [
        'Храните индекс лучшего слова, а в конце верните words[best] — это ссылка на элемент вектора.',
        'Сравнивайте длины строго (>), чтобы при равенстве осталось первое слово.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>
#include <vector>

const std::string &longest(const std::vector<std::string> &words) {
    std::size_t best = 0;
    for (std::size_t i = 1; i < words.size(); i++) {
        if (words[i].size() > words[best].size()) {
            best = i;
        }
    }
    return words[best];
}

int main() {
    int n;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }
    std::vector<std::string> words(static_cast<std::size_t>(n));
    for (std::string &w : words) {
        std::cin >> w;
    }
    const std::string &answer = longest(words);
    std::cout << answer << ' ' << answer.size() << '\n';
    return 0;
}`,
      explanation: `
Функция ничего не копирует: вектор приходит константной ссылкой, а ответ возвращается константной ссылкой на его элемент. Это безопасно, потому что вектор \`words\` живёт в \`main\` дольше, чем используется \`answer\`, и после вызова не меняется.

Чтение слов идёт циклом \`for (std::string &w : words)\` — ссылка на каждый элемент позволяет записать в него прочитанное слово. Вектор заранее создан из \`n\` пустых строк.`,
      examples: [
        { in: '3\nab abcde abc\n', out: 'abcde 5\n' },
        { in: '1\nx\n', out: 'x 1\n' },
      ],
      hidden: [
        '2\naa bb\n',
        '4\na bb ccc dd\n',
        '3\nlongest short tiny\n',
        '5\nq w e r t\n',
        '3\nab abc abcd\n',
        '2\nabcdefghij abcdefghij\n',
        '6\nz yy xxx wwww vvv uu\n',
        '3\nCpp Cplusplus C\n',
      ],
    },
    {
      title: 'Шаблон с вопросами',
      description: `
Первая строка — шаблон из латинских букв и знаков \`?\`. Дальше до конца ввода идут слова. Напечатайте слова, подходящие под шаблон, по одному в строке, в порядке ввода; если подходящих нет — \`нет\`.

Слово подходит, если его длина равна длине шаблона и в каждой позиции символ шаблона — \`?\` или совпадает с символом слова. Напишите функцию \`bool matches(const std::string &pattern, const std::string &word)\`.`,
      constraints: ['Шаблон и слова длиной до 50; слов не больше 1000.'],
      hints: [
        'Сначала сравните длины; затем в цикле по позициям верните false при первом несовпадении, где в шаблоне не ?.',
        'Оба параметра — константные ссылки: функция только читает строки и не копирует их.',
      ],
      solution: String.raw`
#include <iostream>
#include <string>

bool matches(const std::string &pattern, const std::string &word) {
    if (pattern.size() != word.size()) {
        return false;
    }
    for (std::size_t i = 0; i < word.size(); i++) {
        if (pattern[i] != '?' && pattern[i] != word[i]) {
            return false;
        }
    }
    return true;
}

int main() {
    std::string pattern, word;
    if (!(std::cin >> pattern)) {
        return 0;
    }
    bool any = false;
    while (std::cin >> word) {
        if (matches(pattern, word)) {
            std::cout << word << '\n';
            any = true;
        }
    }
    if (!any) {
        std::cout << "нет\n";
    }
    return 0;
}`,
      explanation: `
Функция получает обе строки константными ссылками: ничего не копируется, и по сигнатуре видно, что строки не меняются. Её можно вызвать и с временными значениями — например, \`matches("c?t", word)\`: литерал превратится во временную строку, и константная ссылка с ней свяжется.

Проверка длины идёт первой: без неё цикл по позициям слова мог бы выйти за границу более короткого шаблона.`,
      examples: [
        { in: 'c?t\ncat cot coat cut dog\n', out: 'cat\ncot\ncut\n' },
        { in: 'a?\nabc b\n', out: 'нет\n' },
      ],
      hidden: [
        { in: '???\nabc de fgh ijkl\n', name: 'Только вопросы' },
        { in: 'abc\nabc abd abc\n', name: 'Без вопросов' },
        { in: '?\na b cc\n', name: 'Один символ' },
        { in: 'h?ll?\nhello hallo hullu help\n', name: 'Два вопроса' },
        { in: 'xyz\n', name: 'Нет слов' },
        { in: 'A?c\nabc Abc ABc\n', name: 'Регистр' },
        { in: '??a\naaa baa aab\n', name: 'Буква в конце' },
        { in: 'q\nq q q\n', name: 'Повторы' },
      ],
    },
    {
      title: 'Найди ошибку: подсчёт символов',
      bug: true,
      description: `
Программа читает строки и для каждой печатает, сколько в ней букв \`a\` без учёта регистра: строка переводится в нижний регистр функцией \`lower\`, а результат передаётся в \`count_char\`.

Программа не компилируется. Найдите причину и исправьте её.`,
      constraints: ['Строк не больше 30, длиной до 200 символов, ASCII.'],
      hints: [
        'Прочитайте сообщение компилятора: cannot bind non-const lvalue reference … to an rvalue. Что возвращает lower(line)?',
        'lower возвращает временную строку, а неконстантная ссылка std::string & с временными значениями не связывается. count_char строку не меняет — объявите параметр как const std::string &.',
      ],
      starter: COUNT_A(false),
      solution: COUNT_A(true),
      explanation: `
\`lower(line)\` возвращает новую строку — временное значение, которое исчезнет в конце выражения. Параметр \`std::string &\` означает «функция может изменить аргумент», а изменять временное значение бессмысленно, поэтому компилятор запрещает такую связь: \`cannot bind non-const lvalue reference of type 'std::string&' to an rvalue\`.

\`count_char\` строку только читает, значит, правильный тип параметра — \`const std::string &\`. Константная ссылка связывается с временным значением, а функция становится честнее: её сигнатура больше не обещает изменений, которых нет.`,
      examples: [
        { in: 'Banana\n', out: '3\n' },
        { in: 'AAA aaa\nxyz\n', out: '6\n0\n' },
      ],
      hidden: [
        '\n',
        'a\n',
        'A\n',
        'Abracadabra\n',
        'no letter here\n',
        'aAaA\naa\n',
        'The quick brown fox\n',
        'CAPITAL A AND a\n',
      ],
    },
    {
      title: 'Сводка по группам',
      difficulty: 'advanced',
      description: `
Первая строка — \`n\`, дальше \`n\` строк \`имя группа балл\`. Затем до конца ввода идут номера групп. Для каждого номера напечатайте \`группа G: K чел., средний балл A, лучший NAME\`, где \`A\` — среднее с одним знаком после точки, а \`NAME\` — студент с наибольшим баллом (первый при равенстве). Если в группе никого нет — \`группа G: пусто\`.

Храните студентов в \`std::vector<Student>\`, где \`struct Student { std::string name; int group; int score; };\`, и передавайте вектор в функции константной ссылкой.`,
      constraints: [
        '1 ≤ n ≤ 1000; имена — латинские буквы; 0 ≤ балл ≤ 100; запросов не больше 100.',
      ],
      hints: [
        'Функция void report(const std::vector<Student> &all, int group) обходит вектор циклом for (const Student &s : all) — без копирования структур со строками.',
        'Для лучшего студента храните указатель или индекс: const Student *best = nullptr;. Среднее печатайте через std::fixed и std::setprecision(1).',
      ],
      solution: String.raw`
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Student {
    std::string name;
    int group;
    int score;
};

void report(const std::vector<Student> &all, int group) {
    int count = 0;
    long long sum = 0;
    const Student *best = nullptr;
    for (const Student &s : all) {
        if (s.group != group) {
            continue;
        }
        count++;
        sum += s.score;
        if (best == nullptr || s.score > best->score) {
            best = &s;
        }
    }
    std::cout << "группа " << group << ": ";
    if (count == 0) {
        std::cout << "пусто\n";
        return;
    }
    std::cout << count << " чел., средний балл " << std::fixed << std::setprecision(1)
              << static_cast<double>(sum) / count << ", лучший " << best->name << '\n';
}

int main() {
    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    std::vector<Student> students;
    for (int i = 0; i < n; i++) {
        Student s;
        std::cin >> s.name >> s.group >> s.score;
        students.push_back(s);
    }
    int group;
    while (std::cin >> group) {
        report(students, group);
    }
    return 0;
}`,
      explanation: `
Вектор структур передаётся в \`report\` константной ссылкой: при сотне запросов функция ни разу не копирует тысячу структур со строками. Цикл \`for (const Student &s : all)\` тоже ничего не копирует.

Лучший студент запоминается указателем \`const Student *\` на элемент вектора — он может быть «пустым» до первого подходящего студента, а ссылку так завести нельзя: ссылка обязана быть инициализирована. Указатель на элемент безопасен: вектор внутри \`report\` не меняется. Среднее считается делением суммы, приведённой к \`double\`, — иначе целочисленное деление отбросило бы дробную часть.`,
      examples: [
        {
          in: '4\nAnn 1 90\nBob 2 75\nCid 1 80\nDan 2 75\n1\n2\n3\n',
          out: 'группа 1: 2 чел., средний балл 85.0, лучший Ann\nгруппа 2: 2 чел., средний балл 75.0, лучший Bob\nгруппа 3: пусто\n',
        },
        { in: '1\nEve 5 100\n5\n', out: 'группа 5: 1 чел., средний балл 100.0, лучший Eve\n' },
      ],
      hidden: [
        { in: '3\nA 1 1\nB 1 2\nC 1 2\n1\n', name: 'Ничья за лучшего' },
        { in: '2\nA 1 0\nB 1 0\n1\n', name: 'Нули' },
        { in: '3\nA 1 1\nB 1 1\nC 1 2\n1\n', name: 'Дробное среднее' },
        { in: '2\nX 7 50\nY 8 60\n9\n7\n8\n', name: 'Пустая группа' },
        { in: '3\nP 1 33\nQ 1 33\nR 1 34\n1\n1\n', name: 'Повторный запрос' },
        { in: '4\nA 2 100\nB 2 99\nC 2 98\nD 2 97\n2\n', name: 'Убывание' },
        { in: '1\nSolo 1 77\n', name: 'Без запросов' },
        { in: '5\nA 1 10\nB 2 20\nC 3 30\nD 1 40\nE 2 50\n3\n2\n1\n', name: 'Несколько групп' },
      ],
    },
  ],
};
