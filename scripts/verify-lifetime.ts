/** Полная проверка модуля «Время жизни объектов» в Docker sandbox; подробности — scripts/lessons/verify-module.ts. */
import { verifyCppModule } from './lessons/verify-module';

await verifyCppModule({
  moduleId: 'cpp-lifetime',
  title: 'Время жизни объектов',
  lessons: 24,
  report: 'lifetime',
});
