export default {
  id: 'c17-sizeof',
  title: 'sizeof и размер данных',
  description:
    'Оператор sizeof, тип size_t и спецификатор %zu, гарантии стандарта о размерах, число элементов массива и оценка памяти.',
  moduleId: 'c-fundamentals',
  order: 9,
  difficulty: 'beginner',
  estimatedMinutes: 30,
  prerequisites: ['c17-signed-unsigned'],
  objectives: [
    'Определять размер типов и переменных оператором sizeof',
    'Хранить и печатать размеры в size_t через %zu',
    'Рассчитывать объём памяти для набора элементов',
    'Объяснять, почему в коде пишут sizeof(тип), а не число',
  ],
  tags: ['C17', 'sizeof', 'size_t', 'Память'],
  standard: 'c17',
  quiz: [
    {
      q: 'Чему всегда равен sizeof(char) по стандарту C?',
      options: ['1', '2', '8', 'Зависит от компьютера'],
      correct: 0,
      explain: 'Байт в C по определению — размер char, поэтому sizeof(char) всегда 1.',
    },
    {
      q: 'Что выведет программа на сервере проверки?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int a = 5;
    double b = 2.0;
    printf("%zu\n", sizeof(a + b));
    return 0;
}`,
      answers: ['8'],
      placeholder: 'Вывод программы',
      explain: 'a + b имеет тип double (один операнд дробный), а double занимает 8 байт.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    int n = 10;
    size_t s = sizeof(n++);
    printf("%d %zu\n", n, s);
    return 0;
}`,
      answers: ['10 4'],
      placeholder: 'Вывод программы',
      explain:
        'sizeof не вычисляет выражение, поэтому n++ не выполняется и n остаётся 10. Размер int — 4.',
    },
    {
      q: 'Какой спецификатор printf предназначен для size_t?',
      options: ['%d', '%u', '%zu', '%lld'],
      correct: 2,
      explain: '%zu — для size_t. Другие спецификаторы могут не совпасть по размеру и знаковости.',
    },
    {
      q: 'Что выведет программа?',
      code: String.raw`
#include <stdio.h>

int main(void) {
    double values[] = {1.5, 2.5, 3.5, 4.5, 5.5};
    printf("%zu\n", sizeof(values) / sizeof(values[0]));
    return 0;
}`,
      answers: ['5'],
      placeholder: 'Вывод программы',
      explain: 'Массив занимает 5 · 8 = 40 байт, один элемент — 8. 40 / 8 = 5 элементов.',
    },
    {
      q: 'Какие утверждения гарантирует стандарт C? Выберите все.',
      options: [
        'sizeof(char) == 1',
        'sizeof(int) == 4',
        'sizeof(int) <= sizeof(long long)',
        'sizeof(long) == 8',
      ],
      correct: [0, 2],
      explain:
        'Стандарт задаёт только минимумы и соотношения. int равен 4 байтам на большинстве систем, но не по стандарту; long бывает и 4, и 8 байт.',
    },
    {
      q: 'Почему count * sizeof(price) лучше, чем count * 8, для переменной double price?',
      options: [
        'Расчёт останется верным, если тип price изменится или программа окажется на другой платформе',
        'Так программа работает быстрее',
        'Число 8 запрещено в C',
        'Разницы нет',
      ],
      correct: 0,
      explain:
        'sizeof вычисляется компилятором из настоящего типа, а «магическое число» 8 придётся менять вручную.',
    },
  ],
  exercises: [
    {
      title: 'Сколько памяти',
      description: `
Прочитайте количество элементов \`n\` и напечатайте через пробел, сколько байт займут \`n\` значений типа \`int\`, \`double\` и \`char\`. Используйте \`sizeof\`.`,
      constraints: ['0 ≤ n ≤ 1 000 000 000.'],
      hints: [
        'n · 8 может быть до 8 · 10⁹ — больше int. Храните n и результаты в size_t.',
        'Чтение size_t: проще прочитать long long через %lld и привести к size_t. Печать — %zu.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    long long input;
    scanf("%lld", &input);
    size_t n = (size_t)input;
    printf("%zu %zu %zu\n", n * sizeof(int), n * sizeof(double), n * sizeof(char));
    return 0;
}`,
      explanation: `
Произведение \`n * sizeof(...)\` имеет тип \`size_t\`: оба операнда беззнаковые 64-битные, переполнения при \`n ≤ 10⁹\` нет.

Для \`size_t\` в \`scanf\` тоже есть спецификатор \`%zu\`, но читать через \`long long\` надёжнее для начинающих: так при ошибочном отрицательном вводе значение можно проверить до приведения.`,
      examples: [
        { in: '10', out: '40 80 10\n' },
        { in: '0', out: '0 0 0\n' },
      ],
      hidden: ['1', '1000000000', '1000000', '7', '123456789', '2', '999999999'],
    },
    {
      title: 'Сколько поместится',
      description: `
Есть буфер из \`b\` байт. Напечатайте через пробел, сколько **целых** значений типа \`int\`, \`long long\` и \`double\` в нём поместится.`,
      constraints: ['0 ≤ b ≤ 10¹².'],
      hints: [
        'Количество — целая часть от деления размера буфера на размер элемента.',
        'b может быть больше INT_MAX — используйте size_t или long long.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    long long input;
    scanf("%lld", &input);
    size_t bytes = (size_t)input;
    printf("%zu %zu %zu\n", bytes / sizeof(int), bytes / sizeof(long long),
           bytes / sizeof(double));
    return 0;
}`,
      explanation: `
Деление \`size_t\` на \`size_t\` — целочисленное, поэтому неполный элемент в конце буфера отбрасывается: в 10 байт помещаются два \`int\` (8 байт), третий уже не влезает.`,
      examples: [
        { in: '10', out: '2 1 1\n' },
        { in: '64', out: '16 8 8\n' },
      ],
      hidden: ['0', '3', '7', '1000000000000', '4096', '999'],
    },
    {
      title: 'Страницы памяти',
      description: `
Операционная система выделяет память страницами по 4096 байт. Сколько страниц нужно, чтобы хранить \`n\` значений типа \`double\`?

Неполная страница всё равно занимается целиком.`,
      constraints: ['0 ≤ n ≤ 10⁹.'],
      hints: [
        'Сначала найдите число байт: n * sizeof(double).',
        'Округление вверх при делении: (bytes + 4096 - 1) / 4096.',
      ],
      solution: String.raw`
#include <stdio.h>

int main(void) {
    long long input;
    scanf("%lld", &input);
    size_t bytes = (size_t)input * sizeof(double);
    size_t page = 4096;
    size_t pages = (bytes + page - 1) / page;
    printf("%zu\n", pages);
    return 0;
}`,
      explanation: `
Задача сочетает два приёма: расчёт размера через \`sizeof\` и деление с округлением вверх из урока «Арифметика». Для \`n = 0\` страниц не нужно, и формула даёт \`(0 + 4095) / 4096 = 0\`.

512 значений \`double\` занимают ровно 4096 байт — одна страница; 513-е значение требует второй.`,
      examples: [
        { in: '512', out: '1\n' },
        { in: '513', out: '2\n' },
      ],
      hidden: ['0', '1', '1024', '1025', '1000000000', '100000'],
    },
    {
      title: 'Размер изображения',
      description: `
Изображение имеет ширину \`w\`, высоту \`h\` и \`c\` цветовых каналов; каждый канал пикселя хранится в одном байте типа \`uint8_t\`. Напечатайте размер изображения в байтах и в мебибайтах (1 МиБ = 1024 · 1024 байт) с двумя знаками после точки:

\`\`\`text
6220800 5.93
\`\`\``,
      constraints: ['1 ≤ w, h ≤ 100 000, 1 ≤ c ≤ 4.'],
      hints: [
        'Байты: w * h * c * sizeof(uint8_t). Произведение может быть до 4 · 10¹⁰ — используйте size_t.',
        'Мебибайты: bytes / (1024.0 * 1024.0) — делитель дробный, деление дробное.',
      ],
      solution: String.raw`
#include <stdio.h>
#include <stdint.h>

int main(void) {
    long long w, h, c;
    scanf("%lld %lld %lld", &w, &h, &c);
    size_t bytes = (size_t)w * (size_t)h * (size_t)c * sizeof(uint8_t);
    printf("%zu %.2f\n", bytes, bytes / (1024.0 * 1024.0));
    return 0;
}`,
      explanation: `
\`sizeof(uint8_t)\` равен 1, и умножение на него кажется лишним. Но оно документирует расчёт: если формат перейдёт на 16-битные каналы (\`uint16_t\`), формула останется верной после замены типа.

Деление на \`1024.0 * 1024.0\` дробное, потому что делитель — \`double\`. Деление на целое \`1024 * 1024\` отбросило бы дробную часть.`,
      examples: [
        { in: '1920 1080 3', out: '6220800 5.93\n' },
        { in: '1 1 1', out: '1 0.00\n' },
      ],
      hidden: [
        '100000 100000 4',
        '1024 1024 1',
        '640 480 4',
        '3840 2160 3',
        '7 3 2',
        '100000 1 1',
        '1 100000 4',
        '1023 1025 3',
      ],
    },
  ],
};
