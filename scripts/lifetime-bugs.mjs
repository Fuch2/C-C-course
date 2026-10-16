// Фрагменты для чтения, а не исполнения. Дефектные starterCode проверяются только в sandbox.
export const bugs = {
  'scope-lifetime': {
    name: 'Висячая ссылка (dangling reference)',
    snippets: [
      'const int& factory(int a) { int local = a * 2; return local; }',
      'int value = 5; const int& ref = value; int result = ref;',
      'std::string_view sv = std::string{"temp"}; char c = sv[0];',
      'int* p = new int(4); delete p; int result = *p;',
    ],
    codes: [3, 0, 2, 2],
    why: 'В варианте 0 ссылка возвращается на локальный объект, который уничтожается при возврате из функции: классическая висячая ссылка. В варианте 1 ref живёт, пока жив value, чтение законно. В варианте 2 временная строка разрушается в конце полного выражения инициализации, а string_view не продлевает её жизнь — обращение к sv[0] идёт в освобождённый буфер. В варианте 3 чтение выполняется после delete — это use-after-free. Исправленный factory возвращает int по значению: результат принадлежит вызывающему коду и не зависит от кадра стека функции.',
    starter:
      'const int& factory(int a,int b){int value=a+b;return value;}\nint solve(int a,int b){const int& value=factory(a,b); volatile int observed=value; return observed;}',
    diagnostic: 'stack-use-after-return|stack-use-after-scope|AddressSanitizer',
  },
  ownership: {
    name: 'Неоднозначное владение (ownership ambiguity)',
    snippets: [
      '// Контракт: log только читает значение.\nvoid log(int* p) { std::cout << *p << "\\n"; delete p; }',
      'int consume(std::unique_ptr<int> p) { return *p; }',
      '// Контракт: вызывающий остаётся владельцем.\nint* borrow(std::unique_ptr<int>& p) { return p.release(); }',
      'auto owner = std::make_shared<int>(7); auto copy = owner; int result = *copy;',
    ],
    codes: [4, 0, 4, 0],
    why: 'В варианте 0 log обещает чтение, но удаляет объект вызывающего: нарушение договора заимствования — первичный дефект, даже если crash проявится позже как double delete. В варианте 1 unique_ptr по значению явно объявляет передачу владения: вызывающий обязан написать std::move, двусмысленности нет. В варианте 2 borrow заявлен как заимствование, но release прекращает владение вызывающего и передаёт ответственность наружу — снова нарушен контракт. В варианте 3 копия shared_ptr законно разделяет владение. Исправленный inspect принимает const int&: чтение без передачи владения выражено типом.',
    starter:
      'int inspect(int* p){int x=*p;delete p;return x;}\nint solve(int a,int b){auto owner=std::make_unique<int>(a);return inspect(owner.get())+b;}',
    diagnostic: 'double-free',
  },
  'shallow-copy': {
    name: 'Повторное удаление (double delete)',
    snippets: [
      'struct Buf { int* p; explicit Buf(int n):p(new int[n]){} ~Buf(){delete[] p;} };\nBuf a(4); Buf b = a;',
      'struct Buf { std::vector<int> p; };\nBuf a; Buf b = a;',
      'struct Pair { int* a; int* b; ~Pair(){delete a; delete b;} };\nint* shared = new int(1); Pair p{shared, shared};',
      'int* p = new int(3); int* q = p; p = nullptr; delete p; delete q;',
    ],
    codes: [1, 0, 1, 0],
    why: 'В варианте 0 неявный копирующий конструктор дублирует адрес: два Buf владеют одним буфером, и оба деструктора вызовут delete[] — повторное удаление. В варианте 1 vector сам реализует глубокое копирование: у b собственный буфер. В варианте 2 одно поле shared записано в два владеющих поля Pair: деструктор удалит один блок дважды. В варианте 3 delete nullptr безопасен (no-op), а delete q освобождает блок ровно один раз. У исправленного Box глубокий копирующий конструктор: каждая копия владеет отдельным int, поэтому разрушение second не затрагивает first.',
    starter:
      'struct Box {int* p; explicit Box(int x):p(new int(x)){} ~Box(){delete p;}};\nint solve(int a,int b){Box first{a}; int saved; {Box second=first; *second.p=b; saved=*first.p+*second.p;} return saved;}',
    diagnostic: 'double-free',
  },
  'move-constructor': {
    name: 'Неправильный move constructor',
    snippets: [
      '// ~Cell вызывает delete p.\nCell(Cell&& other) noexcept : p(other.p) {}',
      'Cell(Cell&& other) noexcept : p(other.p) { other.p = nullptr; }',
      'Cell(Cell&& other) : p(std::exchange(other.p, nullptr)) {}',
      'auto src = std::make_unique<int>(2); int* raw = src.get(); src.reset(); int v = *raw;',
    ],
    codes: [6, 0, 0, 2],
    why: 'В варианте 0 операция названа перемещением, но источник сохраняет указатель: два объекта считают себя единственными владельцами и оба вызовут delete. Выбирайте первопричину — неверный move constructor (код 6), а не его следствие double delete. В варианте 1 источник явно обнулён, инвариант «один блок — один владелец» сохранён. В варианте 2 std::exchange делает то же самое; отсутствие noexcept снижает эффективность в контейнерах, но дефектом памяти не является. В варианте 3 raw используется после reset владельца — use-after-free.',
    starter:
      'struct Cell {int* p;explicit Cell(int n):p(new int(n)){} ~Cell(){delete p;} Cell(const Cell&)=delete;Cell& operator=(const Cell&)=delete;Cell(Cell&& x) noexcept:p(x.p){} int get()const{return p?*p:0;}};\nint solve(int a,int b){Cell source{a};int saved;{Cell target(std::move(source));saved=target.get()+b;} return saved;}',
    diagnostic: 'double-free',
  },
  'unique-ptr': {
    name: 'Использование после освобождения (use-after-free)',
    snippets: [
      'auto p = std::make_unique<int>(5); int* raw = p.get(); p.reset(); int v = *raw;',
      'auto p = std::make_unique<int>(5); int v = *p; p.reset();',
      'auto p = std::make_unique<int>(5); auto q = std::move(p); int v = *q;',
      'auto p = std::make_unique<int>(5); std::unique_ptr<int> q(p.get());',
    ],
    codes: [2, 0, 0, 1],
    why: 'В варианте 0 get выдал заимствованный адрес; после reset объект удалён, и чтение через raw — use-after-free. В варианте 1 значение скопировано до освобождения: копия int независима от владельца. В варианте 2 владение корректно перемещено, q жив при чтении. В варианте 3 из get() создан второй независимый unique_ptr: два блока управления удалят один объект дважды — double delete. Исправление сохраняет значение до reset и не использует сырой адрес после прекращения владения.',
    starter:
      'int solve(int a,int b){auto owner=std::make_unique<int>(a);int* observer=owner.get();owner.reset();return *observer+b;}',
    diagnostic: 'heap-use-after-free',
  },
  'cyclic-references': {
    name: 'Цикл shared_ptr',
    snippets: [
      'struct N { std::shared_ptr<N> next; };\nvoid f() { auto a = std::make_shared<N>(); auto b = std::make_shared<N>(); a->next = b; b->next = a; }',
      'struct N { std::shared_ptr<N> child; std::weak_ptr<N> parent; };\nvoid f() { auto r = std::make_shared<N>(); auto c = std::make_shared<N>(); r->child = c; c->parent = r; }',
      'auto a = std::make_shared<int>(1); std::weak_ptr<int> w = a; a.reset(); auto b = w.lock();',
      'struct N { std::function<void()> cb; };\nvoid f() { auto a = std::make_shared<N>(); a->cb = [a] {}; }',
    ],
    codes: [5, 0, 0, 5],
    why: 'В варианте 0 после выхода из f каждый узел удерживается другим: сильные счётчики никогда не достигнут нуля, деструкторы не выполнятся — утечка из-за цикла сильного владения. В варианте 1 обратное ребро слабое, граф владения ацикличен. В варианте 2 weak_ptr не удерживает объект; lock после reset честно возвращает пустой shared_ptr. В варианте 3 цикл скрыт в замыкании: объект владеет std::function, который захватил shared_ptr на тот же объект — тот же код 5. Исправление выбирает направление владения root → child, а parent делает наблюдателем через weak_ptr.',
    starter:
      'struct Node {int& live; std::shared_ptr<Node> peer; explicit Node(int& n):live(n){++live;} ~Node(){--live;} };\nint solve(int a,int b){int live=0,saved;{auto x=std::make_shared<Node>(live);auto y=std::make_shared<Node>(live);x->peer=y;y->peer=x;saved=a+b;} return live==0?saved:-9999;}',
    diagnostic: 'LeakSanitizer|detected memory leaks',
  },
};
