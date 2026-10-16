import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { lessons } from './lifetime-lessons.mjs';
import { bugs } from './lifetime-bugs.mjs';
import { notes } from './lifetime-notes.mjs';
const root = 'content/cpp-systems';
const directory = `${root}/cpp-lifetime`;
const includes =
  '#include <iostream>\n#include <memory>\n#include <vector>\n#include <utility>\n#include <string>\n\n';
const esc = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');
const json = async (path, value) =>
  writeFile(path, await format(JSON.stringify(value), { parser: 'json' }));
const args = [
  [3, 7],
  [0, 0],
  [-8, 3],
  [5, -9],
  [-1000, 1000],
  [1000, -1000],
  [4, 4],
];
const results = {
  sum: (a, b) => a + b,
  guards: (a, b) => 2 * a + b + 2,
  b: (_a, b) => b,
  12: () => 12,
  21: () => 21,
};
function exercise(id, title, description, solution, tests, explanation, starter, hint1) {
  return {
    id,
    title,
    description,
    difficulty: 'advanced',
    language: 'cpp',
    standard: 'c++20',
    compiler: 'clang',
    diagnostics: 'sanitizers',
    starterCode:
      includes +
      (starter ??
        '// Реализуйте типы и операции из условия.\nint solve(int a,int b){\n    (void)a; (void)b;\n    return 0;\n}\n'),
    examples: tests.slice(0, 2).map((t) => ({
      input: `solve(${t.arguments.join(', ')})`,
      output: t.expected,
      explanation: 'Проследите операции и сопоставьте результат с контрактом задания.',
    })),
    constraints: [
      'C++20. Аргументы a,b — целые от −1000 до 1000; исключения для диагностических заданий указаны в условии.',
      'Не добавляйте main: его предоставляет система. Возвращайте int из solve.',
      'Соблюдайте описанный контракт типов, владения и операций. Проверка значений дополняется ASan/UBSan.',
    ],
    hints: [
      {
        id: 'owners',
        order: 1,
        text:
          hint1 ??
          'Выпишите для каждого ресурса владельца, заёмщиков и событие окончания жизни. Для копирования сравните адреса ресурсов; для перемещения проверьте состояние источника.',
      },
      { id: 'boundary', order: 2, text: explanation },
    ],
    publicTests: tests.slice(0, 2),
    hiddenTests: tests.slice(2),
    referenceSolution: includes + solution,
    solutionExplanation: explanation,
    checking: {
      type: 'function',
      functionName: 'solve',
      returnType: 'int',
      parameters: [
        { name: 'a', type: 'int' },
        { name: 'b', type: 'int' },
      ],
    },
  };
}
if (lessons.length !== 24) throw Error('Ожидаются 24 урока');
for (const l of lessons) {
  if (!Array.isArray(l.objectives) || l.objectives.length !== 3)
    throw Error(`Урок ${l.id}: ожидаются 3 цели обучения`);
  if (typeof l.hint1 !== 'string' || l.hint1.trim().length < 20)
    throw Error(`Урок ${l.id}: отсутствует содержательная первая подсказка`);
}
await mkdir(directory, { recursive: true });
const examples = [];
for (const [i, l] of lessons.entries()) {
  const id = `lifetime-${l.id}`,
    bug = bugs[l.id];
  const tests = args.map(([a, b], j) => ({
    id: `case-${j + 1}`,
    name: j < 2 ? `Пример ${j + 1}` : `Граничный случай ${j - 1}`,
    arguments: [a, b],
    expected: `${results[l.expected](a, b)}\n`,
  }));
  const repair = exercise(
    `${id}-exercise`,
    bug ? '2. Исправление: ' + bug.name : 'Практика: ' + l.title,
    l.task,
    l.solution,
    tests,
    `${l.mechanics}\n\n${l.pitfall}\n\n${bug?.why ?? l.experiment}`,
    bug?.starter,
    l.hint1,
  );
  let primary = repair;
  if (bug) {
    const description =
      'Сначала диагностируйте четыре независимых фрагмента по номерам 0–3; не исполняйте их. solve(a,b) принимает номер фрагмента a; b не используется. Верните код первичного дефекта: 0 — безопасно в показанных границах; 1 — double delete; 2 — use-after-free; 3 — dangling reference при возврате; 4 — нарушение заявленного договора заимствования; 5 — цикл сильного владения; 6 — move constructor оставил двух владельцев. Для 4 и 6 выбирайте причину, а не последующий double delete. В комментарии к решению укажите строку, событие окончания жизни и владельца. После проверки диагноза перейдите к заданию 2 и исправьте исходник.\n\n' +
      bug.snippets.map((s, j) => `Фрагмент ${j}:\n${s}`).join('\n\n');
    const cases = [0, 1, 2, 3].map((j) => ({
      id: `fragment-${j}`,
      name: `Фрагмент ${j}`,
      arguments: [j, 0],
      expected: `${bug.codes[j]}\n`,
    }));
    primary = exercise(
      `${id}-diagnose`,
      '1. Диагностика: ' + bug.name,
      description,
      `int solve(int a,int b){(void)b; const int diagnosis[4]={${bug.codes.join(',')}}; return diagnosis[a];}`,
      cases,
      bug.why,
      undefined,
      'Не исполняйте фрагменты. Для каждого найдите объект, чьё время жизни заканчивается раньше использования, и сопоставьте событие с кодами 0–6. Если дефектов два, выбирайте первопричину: нарушение договора или неверный move, а не их следствие в виде double delete.',
    );
    primary.constraints[0] =
      'Аргумент a — номер фрагмента 0…3; b=0. Возвращайте код 0…6 согласно условию.';
  }
  const source = includes + l.demo + '\n';
  const meta = {
    id,
    title: l.title,
    description: l.model.split('. ')[0] + '.',
    moduleId: 'cpp-lifetime',
    order: i + 1,
    difficulty: 'advanced',
    estimatedMinutes: bug ? 75 : 55,
    prerequisites: [i ? `lifetime-${lessons[i - 1].id}` : 'oop-composition-vs-inheritance'],
    objectives: l.objectives,
    tags: [
      'C++20',
      'время жизни',
      'управление ресурсами',
      l.title,
      ...(bug ? ['диагностика', 'исправление ошибок', bug.name] : []),
    ],
    published: true,
    standard: 'c++20',
    completion: 'practice',
    exercise: primary,
    additionalExercises: bug ? [repair] : [],
    quiz: {
      id: `${id}-quiz`,
      title: 'Проверка понимания',
      questions: [
        {
          id: 'concept',
          question: l.question,
          options: [l.wrong, l.answer],
          correct: 1,
          explanation: l.mechanics,
        },
        {
          id: 'trace',
          question:
            'Какой вывод даст запускаемый пример? Сначала проследите владельцев и выход из блоков.',
          options: [l.output.trim(), 'Ошибка компиляции', 'Неопределённое поведение'],
          correct: 0,
          explanation: l.trace,
        },
        {
          id: 'review',
          question: 'Какое утверждение соответствует контракту урока?',
          options: ['Если stdout совпал, любые операции со сроком жизни корректны.', l.pitfall],
          correct: 1,
          explanation: l.experiment,
        },
      ],
    },
  };
  const body = `## Цели обучения\n\n${meta.objectives.map((o) => '- ' + esc(o)).join('\n')}\n\n## Модель и назначение\n\n${esc(l.model)}\n\n## Механика и гарантии\n\n${esc(l.mechanics)}\n\n<MemoryDiagram title="Время жизни и связи владения">\n\n\`\`\`text\n${l.trace}\n\`\`\`\n\n</MemoryDiagram>\n\nСхема показывает логические объекты и отношения, а не реальную раскладку ABI. Сплошная стрелка означает владение, пунктирная — заимствование. Исчезновение имени и уничтожение объекта проверяйте отдельно.\n\n## Запускаемый пример\n\n\`\`\`cpp\n${source}\`\`\`\n\nОжидаемый вывод:\n\n\`\`\`text\n${l.output}\`\`\`\n\n## Разбор и эксперимент\n\n${esc(l.experiment)}\n\n${esc(notes[l.id])}\n\n<CommonMistake title="Граница корректности">\n\n${esc(l.pitfall)}\n\n</CommonMistake>\n\n${bug ? '## Сначала диагноз, затем исправление\n\nВ переключателе практики два обязательных задания. Первое проверяет классификацию четырёх фрагментов. Зафиксируйте причину и границу времени жизни до изменения кода. Второе содержит дефектный исходник: исправьте владение, сохранив требуемое поведение. Код диагноза проверяется автоматически; пояснение в комментарии служит самопроверке. Оба задания нужны для завершения практики.\n\n' + bug.snippets.map((s, j) => `### Фрагмент ${j}\n\n\`\`\`cpp\n${s}\n\`\`\`\n`).join('\n') : '## Практика\n'}\n${esc(l.task)}\n\n<CodingExercise />\n\n## Что нужно унести из урока\n\n${esc(l.model.split('. ')[0])}. ${esc(l.pitfall)}\n`;
  await mkdir(`${directory}/${l.id}`, { recursive: true });
  await json(`${directory}/${l.id}/lesson.json`, meta);
  await writeFile(`${directory}/${l.id}/lesson.mdx`, body);
  examples.push({ id: `${id}-example`, lessonId: id, source, stdout: l.output, standard: 'c++20' });
}
await json(`${directory}/examples.json`, examples);
const course = JSON.parse(await readFile(`${root}/course.json`, 'utf8'));
course.modules = course.modules.filter((m) => m.id !== 'cpp-lifetime');
course.modules.push({
  id: 'cpp-lifetime',
  title: 'Время жизни объектов и управление ресурсами',
  description:
    '24 углублённых урока C++20: lifetime, RAII, копирование, перемещение и умные указатели. MemoryDiagram и шесть двухэтапных практикумов: сначала диагноз, затем исправление.',
  order: 7,
  level: 'Продвинутый',
  icon: 'memory',
  prerequisites: ['cpp-oop'],
});
await json(`${root}/course.json`, course);
console.log('Созданы 24 урока, 30 упражнений, 72 вопроса и 24 примера.');
