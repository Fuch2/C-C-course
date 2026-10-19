import { describe, expect, it } from 'vitest';
import { loadCourse } from '@course/course-engine';
import { allExerciseTests, gradeResults, testInput } from '@course/shared';
import { executeSandbox, runnerReady } from '../../apps/runner/src/sandbox';
const exercise = loadCourse()
  .byId.get('oop-composition-vs-inheritance')!
  .additionalExercises.find((e) => e.id === 'oop-project-telemetry')!;
const contract = `
#include <type_traits>
#include <cassert>
static_assert(std::is_abstract_v<Sensor>);
static_assert(std::has_virtual_destructor_v<Sensor>);
static_assert(std::is_final_v<TemperatureSensor> && std::is_final_v<PressureSensor>);
static_assert(std::is_convertible_v<TemperatureSensor*, Sensor*>);
static_assert(std::is_convertible_v<PressureSensor*, Sensor*>);
static_assert(!std::is_copy_constructible_v<TelemetryProcessor>);
static_assert(!std::is_copy_assignable_v<TelemetryProcessor>);
static_assert(std::is_trivially_copyable_v<Measurement>);
template<class T> concept ExposesId = requires(T t) { t.id_; };
template<class T> concept ExposesSensors = requires(T t) { t.sensors_; };
static_assert(!ExposesId<TemperatureSensor> && !ExposesId<PressureSensor>);
static_assert(!ExposesSensors<TelemetryProcessor>);
class ThirdSensor final : public Sensor {
    int id_;
    int& calls_;
    int& destroyed_;
public:
    ThirdSensor(int id,int& calls,int& destroyed) : id_(id), calls_(calls), destroyed_(destroyed) {}
    Measurement read(int raw) const override { ++calls_; return {id_, raw-1}; }
    ~ThirdSensor() override { ++destroyed_; }
};
class ThrowingSensor final : public Sensor {
public:
    Measurement read(int) const override { throw std::runtime_error("Ошибка источника"); }
};
int main() {
    bool rejected=false;
    try { Filter bad{1,-1}; } catch(const std::invalid_argument&) { rejected=true; }
    assert(rejected);
    const Filter point{0,0};
    assert(point.accepts({1,0}) && !point.accepts({1,-1}) && !point.accepts({1,1}));
    const TemperatureSensor t{7,-3}; const PressureSensor p{8,-2};
    assert(t.read(4).sensorId==7 && t.read(4).value==1);
    assert(p.read(-4).sensorId==8 && p.read(-4).value==8);
    auto copy=t.read(4); copy.value=99; assert(t.read(4).value==1);
    int calls=0, destroyed=0;
    {
        TelemetryProcessor processor{Filter{0,10}};
        assert(processor.process({}).empty());
        auto first=std::make_unique<ThirdSensor>(7,calls,destroyed);
        processor.add(std::move(first));
        assert(!first && destroyed==0);
        processor.add(std::make_unique<ThirdSensor>(7,calls,destroyed));
        rejected=false;
        try { processor.add(nullptr); } catch(const std::invalid_argument&) { rejected=true; }
        assert(rejected && destroyed==0);
        for(const std::vector<int>& raw : std::vector<std::vector<int>>{{}, {1}, {1,2,3}}) {
            rejected=false;
            try { (void)processor.process(raw); } catch(const std::invalid_argument&) { rejected=true; }
            assert(rejected && calls==0);
        }
        const TelemetryProcessor& view=processor;
        const auto one=view.process({0,3});
        assert(calls==2 && one.size()==1 && one[0].sensorId==7 && one[0].value==2);
        const auto two=view.process({1,11});
        assert(calls==4 && two.size()==2);
        assert(two[0].sensorId==7 && two[0].value==0 && two[1].sensorId==7 && two[1].value==10);
        assert(one.size()==1 && one[0].value==2 && destroyed==0);
    }
    assert(destroyed==2);
    {
        TelemetryProcessor processor{Filter{-100,100}};
        processor.add(std::make_unique<ThirdSensor>(3,calls,destroyed));
        processor.add(std::make_unique<ThrowingSensor>());
        bool propagated=false;
        try { (void)processor.process({1,2}); } catch(const std::runtime_error&) { propagated=true; }
        assert(propagated && calls==5 && destroyed==2);
    }
    assert(destroyed==3);
    std::cout << "Контракт соблюдён\\n";
}
`;
const wrap = (source: string) =>
  `#define main telemetry_console_main\n${source}\n#undef main\n${contract}`;
const run = (source: string, cases = [{ stdin: '' }]) =>
  executeSandbox(
    { source, compiler: 'clang', standard: 'c++23', stdin: '', cases, timeoutMs: 10000 },
    'sanitizers',
  );
describe.skipIf(process.env.RUN_DOCKER_TESTS !== '1')('Контракты ООП в Docker', () => {
  it('проверяет сторонний Sensor, владение, ошибки, повторные вызовы и виртуальное уничтожение', async () => {
    const result = await run(wrap(exercise.referenceSolution));
    expect(result.compilation.status, JSON.stringify(result)).toBe('ok');
    expect(result.runs[0]?.status, JSON.stringify(result)).toBe('ok');
    expect(result.runs[0]?.stdout).toBe('Контракт соблюдён\n');
    expect(runnerReady()).toBe(true);
  }, 90000);
  it.each([
    ['исключённая нижняя граница', 'low_ <= m.value', 'low_ < m.value'],
    [
      'фильтрация сырого значения',
      'filter_.accepts(measurement)',
      'filter_.accepts(Measurement{measurement.sensorId, raw[i]})',
    ],
  ])(
    'отвергает ошибку: %s',
    async (_name, before, after) => {
      expect(exercise.referenceSolution).toContain(before);
      const source = exercise.referenceSolution.replace(before, after);
      const result = await run(
        source,
        allExerciseTests(exercise).map((t) => ({ stdin: testInput(t) })),
      );
      expect(result.compilation.status, JSON.stringify(result)).toBe('ok');
      expect(gradeResults(exercise, result).some((t) => !t.passed)).toBe(true);
      expect(runnerReady()).toBe(true);
    },
    180000,
  );
  it('контракт обнаруживает лишний read, даже если stdout проекта остаётся прежним', async () => {
    const before = 'const Measurement measurement = sensors_[i]->read(raw[i]);';
    expect(exercise.referenceSolution).toContain(before);
    const result = await run(
      wrap(
        exercise.referenceSolution.replace(before, `(void)sensors_[i]->read(raw[i]); ${before}`),
      ),
    );
    expect(result.compilation.status, JSON.stringify(result)).toBe('ok');
    expect(result.runs[0]?.status).not.toBe('ok');
    expect(runnerReady()).toBe(true);
  }, 90000);
  it.each([
    'struct B { virtual int read() const = 0; virtual ~B() = default; }; struct D : B { int read() override { return 1; } }; int main() {}',
    'struct Closed final {}; struct Invalid : Closed {}; int main() {}',
  ])(
    'компилятор отклоняет нарушение override/final',
    async (source) => {
      const result = await run(source);
      expect(result.compilation.status).not.toBe('ok');
      expect(result.compilation.stderr.length).toBeGreaterThan(0);
      expect(result.runs).toHaveLength(0);
      expect(runnerReady()).toBe(true);
    },
    90000,
  );
});
