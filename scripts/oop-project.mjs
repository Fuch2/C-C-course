export const headers = `#include <iostream>
#include <memory>
#include <vector>
#include <stdexcept>
#include <utility>
`;
export const model = `struct Measurement { int sensorId; int value; };
class Sensor {
public:
    virtual Measurement read(int raw) const = 0;
    virtual ~Sensor() = default;
};
class TemperatureSensor final : public Sensor {
    int id_;
    int offset_;
public:
    TemperatureSensor(int id, int offset) : id_(id), offset_(offset) {}
    Measurement read(int raw) const override { return {id_, raw + offset_}; }
};
class PressureSensor final : public Sensor {
    int id_;
    int scale_;
public:
    PressureSensor(int id, int scale) : id_(id), scale_(scale) {}
    Measurement read(int raw) const override { return {id_, raw * scale_}; }
};
`;
export const filter = `class Filter {
    int low_;
    int high_;
public:
    Filter(int low, int high) : low_(low), high_(high) {
        if (low > high) throw std::invalid_argument("Некорректный диапазон");
    }
    bool accepts(const Measurement& m) const {
        return low_ <= m.value && m.value <= high_;
    }
};
`;
export const processor = `class TelemetryProcessor {
    Filter filter_;
    std::vector<std::unique_ptr<Sensor>> sensors_;
public:
    explicit TelemetryProcessor(Filter filter) : filter_(filter) {}
    TelemetryProcessor(const TelemetryProcessor&) = delete;
    TelemetryProcessor& operator=(const TelemetryProcessor&) = delete;
    void add(std::unique_ptr<Sensor> sensor) {
        if (!sensor) throw std::invalid_argument("Пустой датчик");
        sensors_.push_back(std::move(sensor));
    }
    std::vector<Measurement> process(const std::vector<int>& raw) const {
        if (raw.size() != sensors_.size())
            throw std::invalid_argument("Размеры не совпадают");
        std::vector<Measurement> result;
        for (std::size_t i = 0; i < sensors_.size(); ++i) {
            const Measurement measurement = sensors_[i]->read(raw[i]);
            if (filter_.accepts(measurement)) result.push_back(measurement);
        }
        return result;
    }
};
`;
export const adapter = `int main() {
    int count{}, low{}, high{};
    if (!(std::cin >> count >> low >> high)) return 1;
    TelemetryProcessor processor{Filter{low, high}};
    std::vector<int> raw;
    for (int i = 0; i < count; ++i) {
        char type{};
        int id{}, calibration{}, value{};
        if (!(std::cin >> type >> id >> calibration >> value)) return 1;
        if (type == 'T') processor.add(std::make_unique<TemperatureSensor>(id, calibration));
        else if (type == 'P') processor.add(std::make_unique<PressureSensor>(id, calibration));
        else return 1;
        raw.push_back(value);
    }
    const auto accepted = processor.process(raw);
    for (const auto& m : accepted) std::cout << m.sensorId << ' ' << m.value << '\\n';
    std::cout << "Принято " << accepted.size() << '\\n';
}
`;
export const projectContract = `Реализуйте систему обработки датчиков C++20 в одном файле. Интерфейс и готовый консольный адаптер находятся в стартовом коде; заполните тела методов, сохраняя сигнатуры. Measurement — значение с int sensorId и int value. Sensor — абстрактный интерфейс Measurement read(int raw) const с публичным виртуальным деструктором. TemperatureSensor(id, offset) возвращает {id, raw+offset}; PressureSensor(id, scale) — {id, raw*scale}. Оба конечных класса объявите final. Все поля реализации закрыты.

Filter(low, high) принимает Measurement, когда low <= value <= high. При low>high конструктор бросает std::invalid_argument. TelemetryProcessor(Filter) владеет фильтром по значению и датчиками через vector<unique_ptr<Sensor>>. add(unique_ptr<Sensor>) передаёт владение и отклоняет nullptr через std::invalid_argument без изменения коллекции. Копирование процессора запрещено. process(const vector<int>& raw) const сначала проверяет соответствие числа входов числу датчиков, иначе бросает std::invalid_argument до любого read. Затем вызывает каждый read ровно один раз, применяет фильтр к преобразованному значению и возвращает vector<Measurement> в порядке добавления датчиков. Повторный process независим от предыдущего, источники не удаляются. Алгоритм работает с любым наследником Sensor, без switch, dynamic_cast и знания конкретных классов. Исключения read распространяются вызывающему коду; предыдущие вызовы не откатываются, частичный результат наружу не возвращается.

Протокол адаптера: n low high, затем n строк type id calibration raw. type=T или P; n=0…100; id=1…1000 (повторы допустимы); calibration=−10…10; raw=−1000…1000; −10000 <= low <= high <= 10000. Вход корректен. Для каждого принятого измерения выведите id и преобразованное value через пробел на отдельной строке; в конце «Принято k». Порядок и повторные идентификаторы сохраняются. Пустой набор печатает только «Принято 0». Не суммируйте температуры с давлениями: здесь целые нормализованные коды тестового протокола, не физические величины в общих единицах. В реальном адаптере понадобятся отдельные единицы и диапазоны.

Сдайте заполненный стартовый файл. Публичные и скрытые тесты проверяют протокол. Отдельный test:oop-project проверяет архитектуру эталона, включая сторонний Sensor, время жизни, повторные вызовы и ошибки. Проверка произвольной архитектуры ученика по одному stdout невозможна: на ревью дополнительно проверьте private, override, final, владение и отсутствие срезки.`;
const modelStarter = `struct Measurement { int sensorId; int value; };
class Sensor {
public:
    virtual Measurement read(int raw) const = 0;
    virtual ~Sensor() = default;
};
class TemperatureSensor final : public Sensor {
    int id_; int offset_;
public:
    TemperatureSensor(int id, int offset) : id_(id), offset_(offset) {}
    Measurement read(int raw) const override {
        (void)raw; (void)id_; (void)offset_;
        throw std::logic_error("Реализуйте преобразование температуры");
    }
};
class PressureSensor final : public Sensor {
    int id_; int scale_;
public:
    PressureSensor(int id, int scale) : id_(id), scale_(scale) {}
    Measurement read(int raw) const override {
        (void)raw; (void)id_; (void)scale_;
        throw std::logic_error("Реализуйте преобразование давления");
    }
};
`;
const filterStarter = `class Filter {
    int low_; int high_;
public:
    Filter(int low, int high) : low_(low), high_(high) {
        // Добавьте проверку инварианта границ.
    }
    bool accepts(const Measurement& m) const {
        (void)m; (void)low_; (void)high_;
        throw std::logic_error("Реализуйте проверку диапазона");
    }
};
`;
const processorStarter = `class TelemetryProcessor {
    Filter filter_;
    std::vector<std::unique_ptr<Sensor>> sensors_;
public:
    explicit TelemetryProcessor(Filter filter) : filter_(filter) {}
    TelemetryProcessor(const TelemetryProcessor&) = delete;
    TelemetryProcessor& operator=(const TelemetryProcessor&) = delete;
    void add(std::unique_ptr<Sensor> sensor) {
        (void)sensor;
        throw std::logic_error("Реализуйте передачу владения");
    }
    std::vector<Measurement> process(const std::vector<int>& raw) const {
        (void)raw;
        throw std::logic_error("Реализуйте обработку через Sensor");
    }
};
`;
export const stages = [
  {
    lesson: 'pure-virtual',
    id: 'oop-project-sensors',
    title: 'Проект, этап 1: модели датчиков',
    task: 'Реализуйте Measurement{int sensorId,int value}, абстрактный Sensor с virtual Measurement read(int raw) const=0 и virtual destructor; TemperatureSensor(int id,int offset) возвращает {id,raw+offset}, PressureSensor(int id,int scale) — {id,raw*scale}. Поля закрыты, реализации final, методы override. solve(a,b) создаёт TemperatureSensor{1,b} и PressureSensor{2,2}, читает оба через const Sensor& с raw=a и возвращает сумму кодов результатов. Это техническая контрольная сумма, а не сумма физических величин. a,b — целые −1000…1000. Без main.',
    solution:
      headers +
      model +
      `int solve(int a,int b) { TemperatureSensor t{1,b}; PressureSensor p{2,2}; const Sensor& left=t; const Sensor& right=p; return left.read(a).value+right.read(a).value; }`,
    starter:
      headers +
      modelStarter +
      `int solve(int a,int b) { (void)a; (void)b; throw std::logic_error("Соберите проверку двух датчиков через Sensor"); }`,
    cases: [
      [10, 2, 32],
      [0, -3, -3],
      [-10, 2, -28],
      [1000, -1000, 2000],
    ],
    explanation:
      'Каждый конкретный датчик хранит свою калибровку, read возвращает независимое Measurement. Базовые ссылки сохраняют динамический тип. Процессору не придётся знать формулы конкретных устройств. Время и дополнительная память каждого чтения O(1).',
  },
  {
    lesson: 'interfaces',
    id: 'oop-project-filter',
    title: 'Проект, этап 2: инвариант фильтра',
    task: 'Реализуйте Measurement{int sensorId,int value} и Filter(int low,int high). Границы private, конструктор бросает std::invalid_argument при low>high. bool accepts(const Measurement&) const использует замкнутый диапазон. solve(a,b) создаёт Filter{a,b} и возвращает количество принятых измерений с value −100, 0, 100 (id=1,2,3 соответственно); при std::invalid_argument возвращает −1. Аргументы целые −1000…1000. Без main. Не перехватывайте другие исключения.',
    solution:
      headers +
      `struct Measurement { int sensorId; int value; };\n` +
      filter +
      `int solve(int a,int b) { try { Filter f{a,b}; int count=0; for (const auto& m : std::vector<Measurement>{{1,-100},{2,0},{3,100}}) if(f.accepts(m)) ++count; return count; } catch(const std::invalid_argument&) { return -1; } }`,
    starter:
      headers +
      `struct Measurement { int sensorId; int value; };\n` +
      filterStarter +
      `int solve(int a,int b) { (void)a; (void)b; throw std::logic_error("Проверьте три измерения и обработайте отказ конструктора"); }`,
    cases: [
      [-100, 100, 3],
      [0, 0, 1],
      [1, -1, -1],
      [-99, 99, 1],
      [101, 1000, 0],
      [-100, -100, 1],
      [100, 100, 1],
    ],
    explanation:
      'Проверка в конструкторе исключает существование ошибочного фильтра. accepts не зависит от вида датчика и не меняет измерение. Обе границы включены; точечный диапазон допустим. Один вызов O(1), тестовый обход трёх значений O(1).',
  },
  {
    lesson: 'composition-vs-inheritance',
    id: 'oop-project-telemetry',
    title: 'Система обработки датчиков',
    task: projectContract,
    solution: headers + model + filter + processor + adapter,
    starter: headers + modelStarter + filterStarter + processorStarter + adapter,
    cases: [
      ['3 0 20\nT 1 2 8\nP 2 3 7\nP 3 2 5\n', '1 10\n3 10\nПринято 2\n'],
      ['0 -1 1\n', 'Принято 0\n'],
      ['4 0 10\nT 7 -5 5\nP 7 2 5\nT 3 1 10\nP 4 -1 1\n', '7 0\n7 10\nПринято 2\n'],
      ['3 -20 -1\nT 8 -2 -3\nP 2 2 -10\nP 4 -1 2\n', '8 -5\n2 -20\n4 -2\nПринято 3\n'],
      ['2 0 0\nP 9 0 1000\nT 2 -5 5\n', '9 0\n2 0\nПринято 2\n'],
      ['2 1 2\nT 1 0 -10\nP 2 2 5\n', 'Принято 0\n'],
      ['2 -10000 10000\nP 1 10 1000\nP 2 -10 1000\n', '1 10000\n2 -10000\nПринято 2\n'],
      ['1 5 5\nT 42 2 3\n', '42 5\nПринято 1\n'],
      [
        '100 -1 1\n' + Array.from({ length: 100 }, (_, i) => `T ${i + 1} 0 0`).join('\n') + '\n',
        Array.from({ length: 100 }, (_, i) => `${i + 1} 0`).join('\n') + '\nПринято 100\n',
      ],
    ],
    explanation:
      'Сначала проверяем число входов, поэтому ошибка размера не вызывает ни одного датчика. unique_ptr передаётся в коллекцию только после проверки nullptr. Один цикл вызывает read по виртуальному интерфейсу, затем фильтрует полученное Measurement. Не суммируем значения разных датчиков. Результаты сохраняют порядок и дубликаты id, повторный вызов создаёт новый vector. Время O(n), дополнительная память O(k) для k принятых измерений; владение датчиками O(n). Виртуальный деструктор обеспечивает разрушение конкретных источников. Стандартные контейнеры освобождают ресурсы при исключениях.',
  },
];
