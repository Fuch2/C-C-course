import { describe, expect, it } from 'vitest';
import { loadCourse } from '@course/course-engine';
import { allExerciseTests, buildSubmissionSource, gradeResults, testInput } from '@course/shared';
import { executeSandbox } from '../../apps/runner/src/sandbox';

const projects = loadCourse()
  .lessons.filter((l) => l.moduleId === 'advanced-c')
  .flatMap((l) => l.additionalExercises);
describe.skipIf(process.env.RUN_DOCKER_TESTS !== '1')('Контракты проектов C17 в Docker', () => {
  it('vector сохраняет владельца, размер и данные при отказе realloc', async () => {
    const vector = projects.find((e) => e.id === 'advanced-project-vector')!;
    const source = `
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
static int deny_allocation;
static void *test_realloc(void *old, size_t bytes) {
    if (deny_allocation) return NULL;
    return realloc(old, bytes);
}
#define realloc test_realloc
#define main project_main
${vector.referenceSolution}
#undef main
#undef realloc
int main(void) {
    Vector v = {0};
    if (!push(&v, 17)) return 1;
    int *old = v.data;
    size_t old_capacity = v.capacity;
    deny_allocation = 1;
    if (reserve(&v, 20) || push(&v, 18)) return 2;
    if (v.data != old || v.size != 1 || v.capacity != old_capacity || v.data[0] != 17) return 3;
    if (reserve(&v, SIZE_MAX)) return 4;
    int out = 99;
    if (at(&v, 1, &out) || out != 99) return 5;
    clear(&v);
    if (pop(&v, &out) || out != 99 || v.capacity != old_capacity) return 6;
    deny_allocation = 0;
    if (!push(&v, 42) || v.data[0] != 42) return 7;
    destroy(&v);
    destroy(&v);
    if (v.data || v.size || v.capacity) return 8;
    puts("Контракт соблюдён");
    return 0;
}`;
    const result = await executeSandbox(
      {
        source,
        standard: 'c17',
        compiler: 'clang',
        stdin: '',
        cases: [{ stdin: '' }],
        timeoutMs: 10000,
      },
      'sanitizers',
    );
    expect(result.compilation.status, JSON.stringify(result)).toBe('ok');
    expect(result.runs[0]?.status, JSON.stringify(result)).toBe('ok');
    expect(result.runs[0]?.stdout).toBe('Контракт соблюдён\n');
  }, 90000);
  it.each([
    [
      'advanced-project-binary-parser',
      '(unsigned long)bytes[0] | ((unsigned long)bytes[1] << 8)',
      '((unsigned long)bytes[0] << 8) | (unsigned long)bytes[1]',
    ],
    [
      'advanced-project-measurement-log',
      'if(!stats->count || value>stats->max)',
      'if(value>stats->max)',
    ],
  ])(
    'тесты отвергают смысловую ошибку в %s',
    async (id, before, after) => {
      const exercise = projects.find((e) => e.id === id)!;
      expect(exercise.referenceSolution).toContain(before);
      const source = buildSubmissionSource(
        exercise,
        exercise.referenceSolution.replace(before, after),
      );
      const result = await executeSandbox(
        {
          source,
          standard: 'c17',
          compiler: 'clang',
          stdin: '',
          cases: allExerciseTests(exercise).map((test) => ({ stdin: testInput(test) })),
          timeoutMs: 10000,
        },
        'sanitizers',
      );
      expect(result.compilation.status, JSON.stringify(result)).toBe('ok');
      expect(gradeResults(exercise, result).some((test) => !test.passed)).toBe(true);
    },
    90000,
  );
});
