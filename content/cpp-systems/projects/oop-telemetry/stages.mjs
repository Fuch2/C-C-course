// Этап 3 проекта «Система обработки датчиков» (урок oop-composition-vs-inheritance). Эталон дополнительно проверяет tests/runner/oop-project.test.ts.
export const telemetryStage = {
  id: 'oop-project-telemetry',
  title: 'Проект, этап 3: процессор телеметрии',
  difficulty: 'advanced',
  description: String.raw`
Завершающий этап проекта. Стартовый код содержит все классы с сигнатурами и готовый консольный адаптер в \`main\`; заполните тела методов, не меняя сигнатур.

- \`Measurement { int sensorId; int value; }\`, интерфейс \`Sensor\` с \`Measurement read(int raw) const\` и виртуальным деструктором, финальные \`TemperatureSensor(id, offset)\` → \`{id, raw + offset}\` и \`PressureSensor(id, scale)\` → \`{id, raw · scale}\` — из первого этапа.
- \`Filter(low, high)\` — из второго этапа: при \`low > high\` бросает \`std::invalid_argument\`, \`accepts\` проверяет \`low ≤ value ≤ high\`.
- \`TelemetryProcessor(Filter)\` **содержит** фильтр по значению и **владеет** датчиками через \`std::vector<std::unique_ptr<Sensor>>\`. Копирование запрещено.
- \`add(std::unique_ptr<Sensor>)\` забирает владение; \`nullptr\` отклоняется через \`std::invalid_argument\`, коллекция не меняется.
- \`process(const std::vector<int> &raw) const\` сначала проверяет, что входов столько же, сколько датчиков (иначе \`std::invalid_argument\` до любого \`read\`). Затем вызывает \`read\` каждого датчика ровно один раз, фильтрует **преобразованное** значение и возвращает принятые измерения в порядке добавления датчиков. Повторный вызов независим от предыдущего. Никаких \`switch\`, \`dynamic_cast\` и знания конкретных классов: алгоритм работает с любым наследником \`Sensor\`.

Протокол адаптера: первая строка \`n low high\`, затем \`n\` строк \`T|P id калибровка raw\`. Для каждого принятого измерения печатается \`id value\`, в конце — \`Принято k\`.`,
  constraints: [
    'n от 0 до 100; id от 1 до 1000 (повторы допустимы); калибровка от −10 до 10; raw от −1000 до 1000; −10 000 ≤ low ≤ high ≤ 10 000.',
    'Не используйте ручные new и delete: датчиками владеет процессор через unique_ptr.',
  ],
  hints: [
    'Порядок в process: проверка размеров → один цикл по индексам → sensors_[i]->read(raw[i]) → filter_.accepts(measurement) → push_back в результат.',
    'В add проверьте nullptr до std::move в вектор: если бросить исключение после перемещения, датчик будет потерян. Значения разных датчиков не суммируйте — это коды разных величин.',
  ],
  starter: String.raw`
#include <iostream>
#include <memory>
#include <vector>
#include <stdexcept>
#include <utility>
struct Measurement { int sensorId; int value; };
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
class Filter {
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
class TelemetryProcessor {
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
int main() {
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
    for (const auto& m : accepted) std::cout << m.sensorId << ' ' << m.value << '\n';
    std::cout << "Принято " << accepted.size() << '\n';
}
`,
  solution: String.raw`
#include <iostream>
#include <memory>
#include <vector>
#include <stdexcept>
#include <utility>
struct Measurement { int sensorId; int value; };
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
class Filter {
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
class TelemetryProcessor {
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
int main() {
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
    for (const auto& m : accepted) std::cout << m.sensorId << ' ' << m.value << '\n';
    std::cout << "Принято " << accepted.size() << '\n';
}
`,
  explanation: String.raw`
Связи в проекте выбраны по правилам урока. Датчики **являются** \`Sensor\` и подставляются вместо него — наследование от интерфейса. Процессор **содержит** фильтр — поле по значению, и **владеет** датчиками — \`std::vector<std::unique_ptr<Sensor>>\`, поэтому срезки нет, а виртуальный деструктор разрушает конкретные объекты.

Проверка размеров до цикла гарантирует, что при ошибке ни один датчик не вызван. Результат собирается в новом векторе, поэтому повторный \`process\` не зависит от предыдущего, а исключение из \`read\` не оставляет наружу частичного результата. Время — O(n), дополнительная память — O(k) для k принятых измерений.`,
  examples: [
    { in: '3 0 20\nT 1 2 8\nP 2 3 7\nP 3 2 5\n', out: '1 10\n3 10\nПринято 2\n' },
    { in: '0 -1 1\n', out: 'Принято 0\n' },
  ],
  hidden: [
    {
      in: '4 0 10\nT 7 -5 5\nP 7 2 5\nT 3 1 10\nP 4 -1 1\n',
      name: 'Отрицательная калибровка и повтор id',
    },
    { in: '3 -20 -1\nT 8 -2 -3\nP 2 2 -10\nP 4 -1 2\n', name: 'Отрицательный диапазон' },
    { in: '2 0 0\nP 9 0 1000\nT 2 -5 5\n', name: 'Точечный диапазон' },
    { in: '2 1 2\nT 1 0 -10\nP 2 2 5\n', name: 'Ничего не принято' },
    { in: '2 -10000 10000\nP 1 10 1000\nP 2 -10 1000\n', name: 'Широкий диапазон' },
    { in: '1 5 5\nT 42 2 3\n', name: 'Ровно граница' },
    {
      in: '100 -1 1\nT 1 0 0\nT 2 0 0\nT 3 0 0\nT 4 0 0\nT 5 0 0\nT 6 0 0\nT 7 0 0\nT 8 0 0\nT 9 0 0\nT 10 0 0\nT 11 0 0\nT 12 0 0\nT 13 0 0\nT 14 0 0\nT 15 0 0\nT 16 0 0\nT 17 0 0\nT 18 0 0\nT 19 0 0\nT 20 0 0\nT 21 0 0\nT 22 0 0\nT 23 0 0\nT 24 0 0\nT 25 0 0\nT 26 0 0\nT 27 0 0\nT 28 0 0\nT 29 0 0\nT 30 0 0\nT 31 0 0\nT 32 0 0\nT 33 0 0\nT 34 0 0\nT 35 0 0\nT 36 0 0\nT 37 0 0\nT 38 0 0\nT 39 0 0\nT 40 0 0\nT 41 0 0\nT 42 0 0\nT 43 0 0\nT 44 0 0\nT 45 0 0\nT 46 0 0\nT 47 0 0\nT 48 0 0\nT 49 0 0\nT 50 0 0\nT 51 0 0\nT 52 0 0\nT 53 0 0\nT 54 0 0\nT 55 0 0\nT 56 0 0\nT 57 0 0\nT 58 0 0\nT 59 0 0\nT 60 0 0\nT 61 0 0\nT 62 0 0\nT 63 0 0\nT 64 0 0\nT 65 0 0\nT 66 0 0\nT 67 0 0\nT 68 0 0\nT 69 0 0\nT 70 0 0\nT 71 0 0\nT 72 0 0\nT 73 0 0\nT 74 0 0\nT 75 0 0\nT 76 0 0\nT 77 0 0\nT 78 0 0\nT 79 0 0\nT 80 0 0\nT 81 0 0\nT 82 0 0\nT 83 0 0\nT 84 0 0\nT 85 0 0\nT 86 0 0\nT 87 0 0\nT 88 0 0\nT 89 0 0\nT 90 0 0\nT 91 0 0\nT 92 0 0\nT 93 0 0\nT 94 0 0\nT 95 0 0\nT 96 0 0\nT 97 0 0\nT 98 0 0\nT 99 0 0\nT 100 0 0\n',
      name: 'Сто датчиков',
    },
  ],
};
