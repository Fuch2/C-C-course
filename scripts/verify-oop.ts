/** Полная проверка модуля «ООП в C++» в Docker sandbox; подробности — scripts/lessons/verify-module.ts. */
import { verifyCppModule } from './lessons/verify-module';

await verifyCppModule({ moduleId: 'cpp-oop', title: 'ООП в C++', lessons: 28, report: 'oop' });
