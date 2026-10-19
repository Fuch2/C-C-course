/** Полная проверка модуля «Основы C++» в Docker sandbox; подробности — scripts/lessons/verify-module.ts. */
import { verifyCppModule } from './lessons/verify-module';

await verifyCppModule({
  moduleId: 'cpp-fundamentals',
  title: 'Основы C++',
  lessons: 27,
  report: 'cpp-fundamentals',
});
