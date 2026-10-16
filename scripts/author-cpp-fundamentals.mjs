import { mkdir, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { lessons } from './cpp-fundamentals-lessons.mjs';
import { exercises } from './cpp-fundamentals-exercises.mjs';

const root = 'content/cpp-systems';
const esc = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');
const json = async (path, value) => {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  await writeFile(path, await format(JSON.stringify(value), { parser: 'json' }));
};
if (lessons.length !== 21 || exercises.length !== 21)
  throw new Error(`Ожидались 21 урок и задача, получено ${lessons.length}/${exercises.length}`);
const examples = [];
for (const [i, lesson] of lessons.entries()) {
  const ex = exercises[i];
  const id = `cpp20-${lesson.id}`;
  const tests = ex.cases.map(([stdin, expected], n) => ({
    id: `case-${n + 1}`,
    name: n < 2 ? `Пример ${n + 1}` : `Граничный сценарий ${n - 1}`,
    stdin,
    expected,
  }));
  const exercise = {
    id: `${id}-exercise`,
    title: ex.title,
    description: ex.description,
    difficulty: i < 5 ? 'beginner' : i < 12 ? 'intermediate' : 'advanced',
    language: 'cpp',
    standard: 'c++20',
    compiler: 'clang',
    diagnostics: 'sanitizers',
    starterCode:
      '#include <iostream>\n\nint main() {\n    // Реализуйте решение на современном C++.\n}\n',
    examples: ex.cases.slice(0, 2).map(([input, output]) => ({
      input,
      output,
      explanation:
        'Публичный пример фиксирует контракт; дополнительные границы проверяются отдельно.',
    })),
    constraints: [
      'Используйте C++20 и стандартную библиотеку.',
      'Проверяйте состояние ввода и не смешивайте владение вручную без необходимости.',
      'Выводите только требуемый результат.',
    ],
    hints: [
      {
        id: 'hint-1',
        order: 1,
        text: 'Сначала сформулируйте инвариант состояния и выберите контейнер по операциям.',
      },
      {
        id: 'hint-2',
        order: 2,
        text: 'Проверьте пустой ввод, границу диапазона и повторяющиеся значения.',
      },
    ],
    publicTests: tests.slice(0, 2),
    hiddenTests: tests.slice(2),
    referenceSolution: ex.source,
    solutionExplanation: ex.explanation,
    checking: { type: 'stdout', comparison: 'exact' },
  };
  const metadata = {
    id,
    title: lesson.title,
    description: lesson.theory,
    moduleId: 'cpp-fundamentals',
    order: i + 1,
    difficulty: exercise.difficulty,
    estimatedMinutes: i < 5 ? 35 : 50,
    prerequisites: i ? [`cpp20-${lessons[i - 1].id}`] : ['advanced-sanitizers'],
    objectives: [
      `Объяснить, зачем появился ${lesson.title} и какую проблему он решает.`,
      `Сравнить стоимость и ограничения с аналогом в C.`,
      `Применить инструмент в задаче обработки данных.`,
    ],
    tags: ['C++20', 'основы C++', lesson.title],
    published: true,
    standard: 'c++20',
    completion: 'practice',
    exercise,
    additionalExercises: [],
    quiz: {
      id: `${id}-quiz`,
      title: 'Проверка понимания',
      questions: [
        {
          id: 'purpose',
          question: lesson.question,
          options: [lesson.answer, lesson.wrong],
          correct: 0,
          explanation: lesson.theory,
        },
        {
          id: 'cost',
          question: 'Что нужно учитывать при выборе инструмента?',
          options: ['Только длину исходного кода', lesson.time],
          correct: 1,
          explanation: lesson.tradeoff,
        },
        {
          id: 'mistake',
          question: 'Как избежать типичной ошибки?',
          options: [lesson.mistake, 'Считать C-подход рекомендуемым стилем в любой задаче'],
          correct: 0,
          explanation: lesson.stl,
        },
      ],
    },
  };
  const body = `## Цели обучения\n\n${metadata.objectives.map((x) => `- ${esc(x)}`).join('\n')}\n\n## Теория\n\n${esc(lesson.theory)}\n\n<Concept title="Ментальная модель">\n\n${esc(lesson.model)}\n\n</Concept>\n\n## Пошаговый разбор\n\n${esc(lesson.trace)}\n\n## Зачем инструмент нужен\n\n${esc(lesson.theory)}\n\n## Пример C++20\n\n\`\`\`cpp\n${ex.demo}\n\`\`\`\n\nОжидаемый вывод:\n\n\`\`\`text\n${ex.stdout}\n\`\`\`\n\n## Стоимость и ограничения\n\n| Аспект | Разбор |\n| --- | --- |\n| Время | ${esc(lesson.time)} |\n| Память | ${esc(lesson.memory)} |\n| Компромисс | ${esc(lesson.tradeoff)} |\n\n## Сравнение с C\n\n${esc(lesson.stl)} Аналог C может дать больше ручного контроля, но требует самостоятельно поддерживать размеры, ошибки и время жизни. В C++ используйте абстракцию по её контракту, а не копируйте C-код в новом синтаксисе.\n\n<CommonMistake title="Типичная ошибка">\n\n${esc(lesson.mistake)}\n\n</CommonMistake>\n\n## Практика\n\n${esc(ex.description)}\n\n<CodingExercise />\n\n## Краткое резюме\n\n${esc(lesson.model)} ${esc(lesson.tradeoff)}`;
  await json(`${root}/cpp-fundamentals/${lesson.id}/lesson.json`, metadata);
  await writeFile(
    `${root}/cpp-fundamentals/${lesson.id}/lesson.mdx`,
    await format(body, { parser: 'mdx' }),
  );
  examples.push({
    id: `${id}-example`,
    lessonId: id,
    standard: 'c++20',
    source: ex.demo,
    stdout: ex.stdout,
  });
}
const course = JSON.parse(
  await (await import('node:fs/promises')).readFile(`${root}/course.json`, 'utf8'),
);
course.modules = course.modules.filter((m) => m.id !== 'cpp-fundamentals');
course.modules.push({
  id: 'cpp-fundamentals',
  title: 'Основы C++',
  description:
    '21 урок C++20 для знающих C: новый синтаксис, стандартная библиотека и изменение подхода к владению и типам.',
  order: 5,
  level: 'Средний',
  icon: 'code',
  prerequisites: ['algorithms-structures'],
});
course.modules.sort((a, b) => a.order - b.order);
await json(`${root}/course.json`, course);
await json(`${root}/cpp-fundamentals/examples.json`, examples);
console.log(
  `Создан модуль Основы C++: ${lessons.length} уроков, ${exercises.length} задач, ${examples.length} примеров.`,
);
