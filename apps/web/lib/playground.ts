import { z } from 'zod';
import { standardSchema, type PublicLesson } from '@course/shared';
import raw from '../../../content/cpp-systems/playground.json';
const content = z
  .strictObject({
    title: z.string().min(1),
    description: z.string().min(1),
    starter: z.string().min(1),
    standard: standardSchema,
  })
  .parse(raw);
export const playgroundLesson: PublicLesson = {
  id: 'playground',
  moduleId: 'playground',
  title: content.title,
  summary: content.description,
  minutes: 0,
  standard: content.standard,
  completion: 'practice',
  prerequisites: [],
  objectives: [],
  tags: [],
  body: '',
  quiz: { id: 'playground-quiz', title: 'Проверка знаний', questions: [] },
  description: content.description,
  order: 0,
  difficulty: 'beginner',
  estimatedMinutes: 1,
  published: false,
  format: 'md',
  sections: [],
  document: { type: 'root', children: [] },
  previousLessonId: null,
  nextLessonId: null,
  effectivePrerequisites: [],
  exercise: {
    id: 'playground-exercise',
    title: 'Свободный эксперимент',
    description: content.description,
    starterCode: content.starter,
    difficulty: 'beginner',
    language: content.standard.startsWith('c++') ? 'cpp' : 'c',
    standard: content.standard,
    compiler: 'gcc',
    examples: [
      { input: '', output: '', explanation: 'Свободный запуск без автоматической проверки.' },
    ],
    constraints: ['Действуют лимиты безопасного Docker runner'],
    hints: [],
    publicTests: [],
    hiddenTestCount: 0,
    checking: { type: 'stdout', comparison: 'exact' },
  },
};
