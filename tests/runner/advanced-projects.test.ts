import { describe, expect, it } from 'vitest';
import { loadCourse } from '@course/course-engine';
import { allExerciseTests, buildSubmissionSource, gradeResults, testInput } from '@course/shared';
import { executeSandbox } from '../../apps/runner/src/sandbox';

const projects = loadCourse()
  .lessons.filter((l) => l.moduleId === 'advanced-c')
  .flatMap((l) => l.additionalExercises);
describe.skipIf(process.env.RUN_DOCKER_TESTS !== '1')('Контракты проектов C17 в Docker', () => {
  it('обобщённый вектор сохраняет данные и состояние при отказе realloc', async () => {
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
    Vector v;
    vector_init(&v, sizeof(int));
    int x = 17;
    if (!vector_push(&v, &x)) return 1;
    void *old = v.data;
    size_t old_capacity = v.capacity;
    for (int i = 0; i < 3; i++) {
        x = i;
        if (!vector_push(&v, &x)) return 2;
    }
    deny_allocation = 1;
    x = 99;
    if (vector_push(&v, &x) || vector_insert(&v, 0, &x) || vector_reserve(&v, 100)) return 3;
    if (v.data != old || v.size != 4 || v.capacity != old_capacity) return 4;
    if (*(int *)vector_get(&v, 0) != 17 || *(int *)vector_get(&v, 3) != 2) return 5;
    if (vector_reserve(&v, SIZE_MAX) || vector_get(&v, 4) != NULL) return 6;
    deny_allocation = 0;
    int out = -1;
    if (!vector_remove(&v, 0, &out) || out != 17 || v.size != 3) return 7;
    while (vector_pop(&v, &out)) {
    }
    out = 55;
    if (vector_pop(&v, &out) || out != 55 || v.capacity != old_capacity) return 8;
    vector_free(&v);
    vector_free(&v);
    if (v.data || v.size || v.capacity) return 9;
    puts("Контракт соблюдён");
    return 0;
}`;
    const result = await executeSandbox(
      {
        source,
        standard: 'c23',
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
      '(unsigned long)bytes[0] | (unsigned long)bytes[1] << 8',
      '(unsigned long)bytes[0] << 8 | (unsigned long)bytes[1]',
    ],
    [
      'advanced-project-measurement-log',
      'if (stats->count == 0 || value > stats->max)',
      'if (value > stats->max)',
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
          standard: 'c23',
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
