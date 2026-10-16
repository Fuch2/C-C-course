import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { lessons } from './algorithms-lessons.mjs';
import { explanations } from './algorithms-explanations.mjs';
import { code, program, readArray, printArray } from './algorithms-code.mjs';

const root = 'content/cpp-systems';
const specs = new Map();
function task(id, title, description, library, body, cases, demoBody, demoOutput) {
  specs.set(id, { title, description, library, body, cases, demoBody, demoOutput });
}
task(
  'algorithm',
  'Сколько измерений превысили порог',
  'Ввод: n (0…256), n значений −1000…1000, затем порог t того же диапазона. Выведите число значений строго больше t.',
  code.algorithm,
  `${readArray}\nint t;if(scanf("%d",&t)!=1)return 1;printf("%d\\n",count_above(a,n,t));`,
  [
    ['4 4 9 2 7 5', '2\n'],
    ['3 5 5 5 5', '0\n'],
    ['0 10', '0\n'],
    ['3 -3 -2 -1 -4', '3\n'],
  ],
  'int a[]={4,9,2,7};printf("%d\\n",count_above(a,4,5));',
  '2\n',
);
task(
  'time-complexity',
  'Два прохода и все пары',
  'Ввод n (0…1000). Двумя последовательными циклами подсчитайте 2n посещений, затем вложенными циклами — n² пар (i,j). Выведите оба счётчика. Это измерение операций, а не времени.',
  '',
  'int n;if(scanf("%d",&n)!=1 || n<0 || n>1000)return 1;long long sequential=0,pairs=0;for(int i=0;i<n;++i)++sequential;for(int i=0;i<n;++i)++sequential;for(int i=0;i<n;++i)for(int j=0;j<n;++j)++pairs;printf("%lld %lld\\n",sequential,pairs);',
  [
    ['4', '8 16\n'],
    ['1', '2 1\n'],
    ['0', '0 0\n'],
    ['10', '20 100\n'],
  ],
  'int count=0;for(int i=0;i<4;++i)for(int j=0;j<4;++j)++count;printf("%d\\n",count);',
  '16\n',
);
task(
  'big-o',
  'Бюджет вычислений',
  'Модель цены обработки: 3*n*n + 7*n + 12 операций. Ввод n (0…10000) и бюджет B (0…1000000000). Выведите точное число операций и ДА, если оно не превышает B, иначе НЕТ. Используйте long long; O(n²) не заменяет точную формулу.',
  '',
  'long long n,b;if(scanf("%lld%lld",&n,&b)!=2 || n<0 || n>10000)return 1;long long cost=3*n*n+7*n+12;printf("%lld %s\\n",cost,cost<=b?"ДА":"НЕТ");',
  [
    ['10 382', '382 ДА\n'],
    ['10 381', '382 НЕТ\n'],
    ['0 12', '12 ДА\n'],
    ['10000 1000000000', '300070012 ДА\n'],
  ],
  'long long n=20;printf("%lld\\n",3*n*n+7*n+12);',
  '1352\n',
);
task(
  'constant',
  'Безопасный доступ к каналу',
  'Ввод n (0…256), n int −1000…1000 и индекс k (−1…256). Выведите a[k] либо ОШИБКА. Проверяйте границы до доступа; оценивайте отдельно загрузку и запрос.',
  '',
  `${readArray}\nint k;if(scanf("%d",&k)!=1)return 1;if(k<0 || k>=n)puts("ОШИБКА");else printf("%d\\n",a[k]);`,
  [
    ['3 10 20 30 1', '20\n'],
    ['3 10 20 30 3', 'ОШИБКА\n'],
    ['0 0', 'ОШИБКА\n'],
    ['1 5 -1', 'ОШИБКА\n'],
  ],
  'int a[]={10,20,30};printf("%d\\n",a[2]);',
  '30\n',
);
task(
  'linear-time',
  'Сумма пакета измерений',
  'Ввод n (0…256) и n int −1000…1000. Выведите сумму через long long; для пустого набора — 0.',
  '',
  `${readArray}\nlong long sum=0;for(int i=0;i<n;++i)sum+=a[i];printf("%lld\\n",sum);`,
  [
    ['3 3 -2 5', '6\n'],
    ['0', '0\n'],
    ['3 -1 -2 -3', '-6\n'],
    ['2 1000 1000', '2000\n'],
  ],
  'int a[]={3,-2,5};long long sum=0;for(int i=0;i<3;++i)sum+=a[i];printf("%lld\\n",sum);',
  '6\n',
);
task(
  'logarithmic',
  'Сколько шагов деления',
  'Ввод unsigned n (0…1000000). Считайте ненулевые состояния, пока n делится на 2 с целочисленным округлением вниз. Выведите счётчик. Для 0 ответ 0.',
  '',
  'unsigned n,count=0;if(scanf("%u",&n)!=1 || n>1000000)return 1;while(n){++count;n/=2;}printf("%u\\n",count);',
  [
    ['13', '4\n'],
    ['0', '0\n'],
    ['1', '1\n'],
    ['1024', '11\n'],
  ],
  'unsigned n=13;while(n){printf("%u%s",n,n==1?"\\n":" ");n/=2;}',
  '13 6 3 1\n',
);
task(
  'quadratic',
  'Близкие измерения',
  'Ввод n (0…256), n int −1000…1000 и d (0…2000). Посчитайте неупорядоченные пары индексов i<j, для которых |a[i]−a[j]|<=d. Дубликаты по разным индексам — разные измерения. Выведите число пар.',
  '',
  `${readArray}\nint d;if(scanf("%d",&d)!=1)return 1;long long pairs=0;for(int i=0;i<n;++i)for(int j=i+1;j<n;++j)if(abs(a[i]-a[j])<=d)++pairs;printf("%lld\\n",pairs);`,
  [
    ['3 1 2 4 1', '1\n'],
    ['3 5 5 5 0', '3\n'],
    ['0 2', '0\n'],
    ['4 1 2 3 4 2000', '6\n'],
  ],
  'int pairs=0;for(int i=0;i<4;++i)for(int j=i+1;j<4;++j)++pairs;printf("%d\\n",pairs);',
  '6\n',
);
task(
  'linear-search',
  'Первый индекс ключа',
  'Ввод n (0…256), n int −1000…1000 и target. Верните индекс первого совпадения или −1. Массив не отсортирован.',
  code.linear,
  `${readArray}\nint target;if(scanf("%d",&target)!=1)return 1;printf("%d\\n",find_first(a,n,target));`,
  [
    ['3 8 3 8 8', '0\n'],
    ['3 8 3 8 5', '-1\n'],
    ['0 0', '-1\n'],
    ['3 2 4 6 6', '2\n'],
  ],
  'int a[]={8,3,8};printf("%d %d\\n",find_first(a,3,8),find_first(a,3,5));',
  '0 -1\n',
);
task(
  'binary-search',
  'Первая позиция в журнале',
  'Ввод n (0…256), n отсортированных по неубыванию int −1000…1000 и target. Выведите индекс первого совпадения или −1. Реализуйте lower_bound на полуинтервале.',
  code.binary,
  `${readArray}\nint target;if(scanf("%d",&target)!=1)return 1;int i=lower(a,n,target);printf("%d\\n",i<n && a[i]==target?i:-1);`,
  [
    ['4 1 3 3 7 3', '1\n'],
    ['4 1 3 3 7 8', '-1\n'],
    ['0 0', '-1\n'],
    ['1 -3 -3', '0\n'],
    ['4 2 2 2 2 2', '0\n'],
  ],
  'int a[]={1,3,3,7};printf("%d\\n",lower(a,4,3));',
  '1\n',
);
const sortCases = [
  ['5 3 -1 3 0 2', '-1 0 2 3 3\n'],
  ['0', '\n'],
  ['1 -8', '-8\n'],
  ['5 5 4 3 2 1', '1 2 3 4 5\n'],
  ['4 2 2 2 2', '2 2 2 2\n'],
  ['5 -3 -1 0 1 2', '-3 -1 0 1 2\n'],
];
for (const id of ['bubble', 'selection', 'insertion', 'merge', 'quick']) {
  const action =
    id === 'merge' ? 'if(!sort(a,n))return 1;' : id === 'quick' ? 'quick(a,0,n);' : 'sort(a,n);';
  task(
    id,
    `Сортировка измерений: ${id}`,
    'Ввод n (0…256) и n int −1000…1000. Отсортируйте по неубыванию алгоритмом урока и выведите числа через пробел, затем перевод строки. Пустой массив даёт пустую строку. Не вызывайте qsort. Тесты проверяют результат; выбор алгоритма обоснуйте его инвариантом.',
    code[id],
    `${readArray}\n${action}\n${printArray}`,
    sortCases,
    `int a[]={4,1,3,2};int n=4;${action}${printArray}`,
    '1 2 3 4\n',
  );
}
task(
  'recursion',
  'Рекурсивная сумма диапазона',
  'Ввод n (0…256) и n int −100…100. Разделяя полуинтервал пополам, вычислите сумму. Пустой диапазон даёт 0. Обоснуйте отдельно число вызовов и глубину стека.',
  code.recursion,
  `${readArray}\nprintf("%d\\n",sum_range(a,0,n));`,
  [
    ['4 2 4 6 8', '20\n'],
    ['0', '0\n'],
    ['1 -5', '-5\n'],
    ['3 -3 2 1', '0\n'],
  ],
  'int a[]={2,4,6,8};printf("%d\\n",sum_range(a,0,4));',
  '20\n',
);
task(
  'vector',
  'Массив с удалением по позиции',
  'Ввод q (0…128), затем q команд: P x добавляет int −1000…1000, E i удаляет индекс i (0…256) и выводит ДА либо НЕТ, G i выводит значение по индексу либо НЕТ, S выводит size и capacity. Начальное состояние пустое. Вместимость растёт 0→1→2→4… только при заполнении; удаление её не уменьшает. В конце освободите память.',
  code.vector,
  `Vector v={0};int q,failed=0;if(scanf("%d",&q)!=1 || q<0 || q>128)return 1;
for(int k=0;k<q;++k){char command;if(scanf(" %c",&command)!=1){failed=1;break;}
 if(command=='P'){int x;if(scanf("%d",&x)!=1 || !push(&v,x)){failed=1;break;}}
 else if(command=='E'){size_t i;if(scanf("%zu",&i)!=1){failed=1;break;}puts(erase(&v,i)?"ДА":"НЕТ");}
 else if(command=='G'){size_t i;if(scanf("%zu",&i)!=1){failed=1;break;}if(i<v.size)printf("%d\\n",v.data[i]);else puts("НЕТ");}
 else if(command=='S')printf("%zu %zu\\n",v.size,v.capacity);else {failed=1;break;}}
destroy(&v);if(failed)return 1;`,
  [
    ['6 P 1 P 2 P 3 E 1 S E 2', 'ДА\n2 4\nНЕТ\n'],
    ['2 E 0 S', 'НЕТ\n0 0\n'],
    ['6 P 1 E 0 P 2 S E 0 S', 'ДА\n1 1\nДА\n0 1\n'],
    ['0', ''],
    ['8 P 10 P 20 P 30 E 0 G 0 G 1 G 2 S', 'ДА\n20\n30\nНЕТ\n2 4\n'],
  ],
  'Vector v={0};if(!push(&v,10)||!push(&v,20)||!push(&v,30)){destroy(&v);return 1;}erase(&v,1);printf("%zu %zu %d\\n",v.size,v.capacity,v.data[1]);destroy(&v);',
  '2 4 30\n',
);
task(
  'list',
  'Удаление всех совпадений из цепочки',
  'Ввод n (0…256), n int −1000…1000 и target. Постройте односвязный список в порядке ввода и удалите все узлы с target, освободив их. Выведите оставшиеся значения через пробел и перевод строки. Освободите оставшийся список. Допускается временный входной массив для построения с головы в обратном порядке.',
  code.list,
  `${readArray}\nint target;if(scanf("%d",&target)!=1)return 1;Node *head=NULL;for(int i=n;i>0;--i)if(!prepend(&head,a[i-1])){destroy(&head);return 1;}remove_value(&head,target);int first=1;for(Node *node=head;node;node=node->next){printf("%s%d",first?"":" ",node->value);first=0;}puts("");destroy(&head);`,
  [
    ['5 3 3 5 3 7 3', '5 7\n'],
    ['3 2 2 2 2', '\n'],
    ['0 0', '\n'],
    ['3 1 2 3 9', '1 2 3\n'],
    ['4 4 5 6 4 4', '5 6\n'],
  ],
  'Node *head=NULL;if(!prepend(&head,5)||!prepend(&head,3)||!prepend(&head,3)){destroy(&head);return 1;}remove_value(&head,3);printf("%d\\n",head->value);destroy(&head);',
  '5\n',
);
task(
  'doubly',
  'Два конца списка',
  'Ввод q (0…128), затем команды L x/R x — добавить слева/справа без вывода; l/r — удалить слева/справа и вывести значение или ПУСТО. x — int −1000…1000. После всех команд выведите список вперёд и назад на двух строках, затем освободите узлы.',
  code.doubly,
  `List list={0};int q,failed=0;if(scanf("%d",&q)!=1 || q<0 || q>128)return 1;
for(int i=0;i<q;++i){char c;if(scanf(" %c",&c)!=1){failed=1;break;}int x;
 if(c=='L'||c=='R'){if(scanf("%d",&x)!=1 || !push(&list,x,c=='L')){failed=1;break;}}
 else if(c=='l'||c=='r'){if(pop(&list,c=='l',&x))printf("%d\\n",x);else puts("ПУСТО");}else{failed=1;break;}}
if(!failed){int first=1;for(Node *p=list.head;p;p=p->next){printf("%s%d",first?"":" ",p->value);first=0;}puts("");first=1;for(Node *p=list.tail;p;p=p->prev){printf("%s%d",first?"":" ",p->value);first=0;}puts("");}destroy(&list);if(failed)return 1;`,
  [
    ['4 L 1 R 2 L 3 r', '2\n3 1\n1 3\n'],
    ['3 L 9 r l', '9\nПУСТО\n\n\n'],
    ['0', '\n\n'],
    ['4 R 1 l R 2 L 3', '1\n3 2\n2 3\n'],
  ],
  'List list={0};if(!push(&list,1,1)||!push(&list,2,0)){destroy(&list);return 1;}int x;pop(&list,1,&x);printf("%d %d\\n",x,list.tail->value);destroy(&list);',
  '1 2\n',
);
task(
  'stack',
  'История операций LIFO',
  'Ввод q (0…128), затем команды P x — положить int −1000…1000; O — извлечь; T — посмотреть верхний. O/T выводят значение или ПУСТО. Вместимость стека 128; q гарантирует, что число добавлений не превышает её.',
  code.stack,
  `Stack stack={0};int q;if(scanf("%d",&q)!=1 || q<0 || q>128)return 1;for(int i=0;i<q;++i){char c;int x;if(scanf(" %c",&c)!=1)return 1;if(c=='P'){if(scanf("%d",&x)!=1||!push(&stack,x))return 1;}else if(c=='O'||c=='T'){int ok=c=='O'?pop(&stack,&x):top(&stack,&x);if(ok)printf("%d\\n",x);else puts("ПУСТО");}else return 1;}`,
  [
    ['6 P 4 P 9 T O O O', '9\n9\n4\nПУСТО\n'],
    ['2 T O', 'ПУСТО\nПУСТО\n'],
    ['4 P -1 T T O', '-1\n-1\n-1\n'],
    ['0', ''],
  ],
  'Stack stack={0};push(&stack,4);push(&stack,9);int x;pop(&stack,&x);printf("%d\\n",x);',
  '9\n',
);
task(
  'queue',
  'Обработка задач FIFO',
  'Ввод q (0…128), затем команды P x — добавить int −1000…1000 и O — извлечь первый элемент. O выводит значение или ПУСТО. Реализуйте связную очередь с head и tail, освободите все узлы.',
  code.queue,
  `Queue queue={0};int q,failed=0;if(scanf("%d",&q)!=1||q<0||q>128)return 1;for(int i=0;i<q;++i){char c;int x;if(scanf(" %c",&c)!=1){failed=1;break;}if(c=='P'){if(scanf("%d",&x)!=1||!push(&queue,x)){failed=1;break;}}else if(c=='O'){if(pop(&queue,&x))printf("%d\\n",x);else puts("ПУСТО");}else{failed=1;break;}}destroy(&queue);if(failed)return 1;`,
  [
    ['6 P 4 P 9 O P 2 O O', '4\n9\n2\n'],
    ['2 O O', 'ПУСТО\nПУСТО\n'],
    ['5 P 1 O P -2 O O', '1\n-2\nПУСТО\n'],
    ['0', ''],
  ],
  'Queue queue={0};if(!push(&queue,4)||!push(&queue,9)){destroy(&queue);return 1;}int x;pop(&queue,&x);printf("%d\\n",x);destroy(&queue);',
  '4\n',
);
task(
  'ring',
  'Ограниченная очередь пакетов',
  'Ввод capacity (1…32), q (0…128), затем команды P x и O. Успешное добавление молчит, отказ в полном буфере выводит ПОЛНО и сохраняет прежние данные. O выводит старейшее значение или ПУСТО. x — int −1000…1000. Не используйте аллокации на операцию.',
  code.ring,
  `Ring ring={0};int q;if(scanf("%zu%d",&ring.capacity,&q)!=2||ring.capacity<1||ring.capacity>32||q<0||q>128)return 1;for(int i=0;i<q;++i){char c;int x;if(scanf(" %c",&c)!=1)return 1;if(c=='P'){if(scanf("%d",&x)!=1)return 1;if(!push(&ring,x))puts("ПОЛНО");}else if(c=='O'){if(pop(&ring,&x))printf("%d\\n",x);else puts("ПУСТО");}else return 1;}`,
  [
    ['3 9 P 1 P 2 P 3 P 4 O P 4 O O O', 'ПОЛНО\n1\n2\n3\n4\n'],
    ['1 6 P 7 P 8 O P 9 O O', 'ПОЛНО\n7\n9\nПУСТО\n'],
    ['3 0', ''],
    ['3 4 O P -1 O O', 'ПУСТО\n-1\nПУСТО\n'],
  ],
  'Ring r={.capacity=3};push(&r,1);push(&r,2);push(&r,3);int x;pop(&r,&x);push(&r,4);while(pop(&r,&x))printf("%d%s",x,r.size?" ":"\\n");',
  '2 3 4\n',
);
task(
  'hash',
  'Справочник с коллизиями и удалением',
  'Ввод q (0…128), затем S key value — вставить/обновить без вывода (ПОЛНО при отсутствии места); G key — значение или НЕТ; D key — удалить и вывести ДА/НЕТ. key/value — int −1000…1000. Таблица 17 слотов, линейное пробирование, tombstone. Обновление существующего ключа должно работать и в полной таблице.',
  code.hash,
  `Table table={0};int q;if(scanf("%d",&q)!=1||q<0||q>128)return 1;for(int j=0;j<q;++j){char c;int key,value;if(scanf(" %c%d",&c,&key)!=2)return 1;if(c=='S'){if(scanf("%d",&value)!=1)return 1;if(!set(&table,key,value))puts("ПОЛНО");}else if(c=='G'){int i=find(&table,key);if(i<0)puts("НЕТ");else printf("%d\\n",table.slots[i].value);}else if(c=='D')puts(remove_key(&table,key)?"ДА":"НЕТ");else return 1;}`,
  [
    ['7 S 0 10 S 17 20 D 0 G 17 S 17 30 G 17 G 0', 'ДА\n20\n30\nНЕТ\n'],
    ['4 S -17 5 G -17 D -17 G -17', '5\nДА\nНЕТ\n'],
    ['3 D 9 G 9 D 9', 'НЕТ\nНЕТ\nНЕТ\n'],
    ['0', ''],
    ['6 S 0 1 S 17 2 D 0 S 34 3 G 17 G 34', 'ДА\n2\n3\n'],
  ],
  'Table t={0};set(&t,0,10);set(&t,17,20);remove_key(&t,0);int i=find(&t,17);if(i<0)return 1;printf("%d\\n",t.slots[i].value);',
  '20\n',
);
// Заполненная таблица: отказ нового ключа и успешное обновление старого.
specs
  .get('hash')
  .cases.push([
    `21 ${Array.from({ length: 17 }, (_, i) => `S ${i} ${i}`).join(' ')} S 100 1 S 0 99 G 0 G 16`,
    'ПОЛНО\n99\n16\n',
  ]);
task(
  'tree',
  'Высота и листья дерева',
  'Ввод n (0…256) и n позиций бинарного дерева в порядке индексов: дети i находятся в 2i+1 и 2i+2. Значение −9999 означает отсутствие узла, остальные значения −1000…1000. Потомки отсутствующих узлов также отсутствуют. Создайте узлы со ссылками, выведите высоту в узлах и число листьев; пустое дерево даёт 0 0. Освободите дерево.',
  code.tree,
  `${readArray}\nint ok=1;Node *root=build(a,n,0,&ok);if(!ok){destroy(root);return 1;}printf("%d %d\\n",height(root),leaves(root));destroy(root);`,
  [
    ['7 5 2 8 1 3 7 9', '3 4\n'],
    ['1 4', '1 1\n'],
    ['0', '0 0\n'],
    ['1 -9999', '0 0\n'],
    ['7 5 -9999 8 -9999 -9999 7 9', '3 2\n'],
  ],
  'int a[]={5,2,8};int ok=1;Node *root=build(a,3,0,&ok);if(!ok){destroy(root);return 1;}printf("%d %d\\n",height(root),leaves(root));destroy(root);',
  '2 2\n',
);
task(
  'bst',
  'Упорядоченный справочник',
  'Ввод n (0…128), n int −1000…1000 и target. Вставьте ключи в несбалансированное BST, игнорируя дубликаты. Выведите уникальные ключи по возрастанию на первой строке и ДА/НЕТ для наличия target на второй. Освободите дерево.',
  code.bst,
  `${readArray}\nif(n>128)return 1;int target;if(scanf("%d",&target)!=1)return 1;Node *root=NULL;for(int i=0;i<n;++i)if(!insert(&root,a[i])){destroy(root);return 1;}int first=1;inorder(root,&first);puts("");puts(contains(root,target)?"ДА":"НЕТ");destroy(root);`,
  [
    ['5 4 2 6 2 5 5', '2 4 5 6\nДА\n'],
    ['0 7', '\nНЕТ\n'],
    ['4 1 2 3 4 9', '1 2 3 4\nНЕТ\n'],
    ['3 -1 -1 -1 -1', '-1\nДА\n'],
  ],
  'Node *root=NULL;if(!insert(&root,4)||!insert(&root,2)||!insert(&root,6)){destroy(root);return 1;}int first=1;inorder(root,&first);puts("");destroy(root);',
  '2 4 6\n',
);
task(
  'heap',
  'События с минимальным приоритетом',
  'Ввод q (0…128), команды P x — добавить int −1000…1000, O — извлечь минимум. O выводит минимум или ПУСТО. Используйте бинарную min-heap в массиве вместимости 128. Одинаковые приоритеты сохраняются как отдельные элементы.',
  code.heap,
  `Heap heap={0};int q;if(scanf("%d",&q)!=1||q<0||q>128)return 1;for(int i=0;i<q;++i){char c;int x;if(scanf(" %c",&c)!=1)return 1;if(c=='P'){if(scanf("%d",&x)!=1||!push(&heap,x))return 1;}else if(c=='O'){if(pop(&heap,&x))printf("%d\\n",x);else puts("ПУСТО");}else return 1;}`,
  [
    ['7 P 5 P 2 P 7 O O O O', '2\n5\n7\nПУСТО\n'],
    ['6 P 1 P 1 P -1 O O O', '-1\n1\n1\n'],
    ['5 P 4 O P 3 O O', '4\n3\nПУСТО\n'],
    ['0', ''],
  ],
  'Heap h={0};push(&h,5);push(&h,2);push(&h,7);int x;while(pop(&h,&x))printf("%d%s",x,h.size?" ":"\\n");',
  '2 5 7\n',
);
const graphInput =
  'Ввод V (1…32), E (0…128), затем E пар вершин 0…V−1. Граф неориентированный, петли и повторные рёбра допускаются. Храните списки смежности в массиве дуг.';
task(
  'graph',
  'Степени вершин сети',
  `${graphInput} Выведите степени всех вершин через пробел. Петля вносит 2 в степень.`,
  code.graph,
  'Graph g;int n;if(!read_graph(&g,&n))return 1;for(int v=0;v<n;++v){int degree=0;for(int e=g.head[v];e!=-1;e=g.edges[e].next)++degree;printf("%s%d",v?" ":"",degree);}puts("");',
  [
    ['3 3 0 1 1 2 1 1', '1 4 1\n'],
    ['3 0', '0 0 0\n'],
    ['2 2 0 1 0 1', '2 2\n'],
    ['1 1 0 0', '2\n'],
  ],
  'Graph g;init(&g);connect(&g,0,1);connect(&g,1,0);connect(&g,1,2);connect(&g,2,1);for(int v=0;v<3;++v){int d=0;for(int e=g.head[v];e!=-1;e=g.edges[e].next)++d;printf("%s%d",v?" ":"",d);}puts("");',
  '1 2 1\n',
);
task(
  'bfs',
  'Расстояния между устройствами',
  `${graphInput} После рёбер дан источник s. Выведите кратчайшие расстояния в числе рёбер до всех вершин; недостижимые обозначьте −1.`,
  code.graph + '\n' + code.bfs,
  'Graph g;int n,s;if(!read_graph(&g,&n)||scanf("%d",&s)!=1||s<0||s>=n)return 1;int d[32];distances(&g,n,s,d);for(int i=0;i<n;++i)printf("%s%d",i?" ":"",d[i]);puts("");',
  [
    ['5 4 0 1 0 2 1 3 2 3 0', '0 1 1 2 -1\n'],
    ['1 0 0', '0\n'],
    ['3 0 1', '-1 0 -1\n'],
    ['3 4 0 0 0 1 0 1 1 2 0', '0 1 2\n'],
  ],
  'Graph g;init(&g);connect(&g,0,1);connect(&g,1,0);connect(&g,1,2);connect(&g,2,1);int d[4];distances(&g,4,0,d);for(int i=0;i<4;++i)printf("%s%d",i?" ":"",d[i]);puts("");',
  '0 1 2 -1\n',
);
task(
  'dfs',
  'Компоненты связности',
  `${graphInput} Выведите число компонент связности, включая изолированные вершины. Используйте DFS с пометкой до входа к соседям.`,
  code.graph + '\n' + code.dfs,
  'Graph g;int n;if(!read_graph(&g,&n))return 1;printf("%d\\n",components(&g,n));',
  [
    ['5 2 0 1 2 3', '3\n'],
    ['4 0', '4\n'],
    ['3 3 0 1 1 2 2 0', '1\n'],
    ['2 2 0 0 0 0', '2\n'],
  ],
  'Graph g;init(&g);connect(&g,0,1);connect(&g,1,0);connect(&g,2,3);connect(&g,3,2);printf("%d\\n",components(&g,5));',
  '3\n',
);

const benchmarks = new Map();
benchmarks.set('time-complexity', {
  title: 'Benchmark: сравнения линейного и двоичного поиска',
  description:
    'Ввод n (0…256) и target (−1…1000). Массив задан формулой a[i]=2*i. Посчитайте сравнения a[i]==target линейного поиска с ранним выходом и сравнения a[mid]<target в lower_bound. Финальную проверку равенства после lower_bound не учитывайте. Выведите два счётчика. Это воспроизводимая модель работы, не замер времени.',
  source: program(
    '',
    'int n,target;if(scanf("%d%d",&n,&target)!=2||n<0||n>256)return 1;int linear=0,binary=0;for(int i=0;i<n;++i){++linear;if(2*i==target)break;}int left=0,right=n;while(left<right){int mid=left+(right-left)/2;++binary;if(2*mid<target)left=mid+1;else right=mid;}printf("%d %d\\n",linear,binary);',
  ),
  cases: [
    ['8 6', '4 3\n'],
    ['8 17', '8 3\n'],
    ['8 0', '1 4\n'],
    ['0 0', '0 0\n'],
    ['1 -1', '1 1\n'],
  ],
  explanation:
    'Линейный счётчик увеличивается перед проверкой и прекращается при совпадении. В lower_bound счётчик растёт один раз на уменьшение полуинтервала. При target=0 линейный поиск выигрывает по сравнениям, поэтому нельзя объявлять бинарный быстрее на каждом входе. Подготовка данных исключена из обоих счётчиков.',
});
benchmarks.set('insertion', {
  title: 'Benchmark: сравнения и сдвиги вставок',
  description:
    'Ввод n (0…256) и n int −1000…1000. Выполните insertion sort. Считайте каждое вычисление a[j−1]>value (включая последнее ложное, но не проверку j>0) и каждый сдвиг a[j]=a[j−1]. Запись сохранённого value не является сдвигом. Выведите сравнения и сдвиги.',
  source: program(
    '',
    `${readArray}\nlong long comparisons=0,shifts=0;for(int i=1;i<n;++i){int value=a[i],j=i;while(j>0){++comparisons;if(a[j-1]<=value)break;a[j]=a[j-1];--j;++shifts;}a[j]=value;}printf("%lld %lld\\n",comparisons,shifts);`,
  ),
  cases: [
    ['3 3 1 2', '3 2\n'],
    ['4 1 2 3 4', '3 0\n'],
    ['4 4 3 2 1', '6 6\n'],
    ['3 2 2 2', '2 0\n'],
    ['0', '0 0\n'],
  ],
  explanation:
    'Число сдвигов совпадает с числом инверсий. На отсортированном входе есть n−1 ложных сравнений и ни одного сдвига. На обратном входе все сравнения истинны, а цикл заканчивается по j=0. Эти два пути объясняют различие счётчиков, которое легко пропустить при измерении.',
});
benchmarks.set('vector', {
  title: 'Benchmark: цена роста вместимости',
  description:
    'Ввод n (0…10000). Сравните n добавлений при двух политиках: вместимость каждый раз size+1 и геометрический рост 0→1→2→4… Считайте логически переносимые прежние элементы при каждом росте, предполагая полный перенос. Новое значение не учитывается. Выведите два счётчика. Реальный realloc иногда расширяет блок на месте; здесь проверяется явно заданная модель, а не число физических копирований allocator.',
  source: program(
    '',
    'long long n,exact=0,doubling=0,capacity=0;if(scanf("%lld",&n)!=1||n<0||n>10000)return 1;for(long long size=0;size<n;++size){exact+=size;if(size==capacity){doubling+=size;capacity=capacity?capacity*2:1;}}printf("%lld %lld\\n",exact,doubling);',
  ),
  cases: [
    ['5', '10 7\n'],
    ['8', '28 7\n'],
    ['0', '0 0\n'],
    ['1', '0 0\n'],
    ['9', '36 15\n'],
  ],
  explanation:
    'Точный рост переносит 0+1+…+(n−1) элементов, то есть Θ(n²). Удвоение суммирует 1+2+4+… и даёт O(n). Это аргумент об амортизированной цене последовательности. Сравнивать один дорогой resize с одним дешёвым push без контекста неверно.',
});

const cppExamples = {
  'linear-search': [
    '#include <algorithm>\n#include <vector>',
    'std::vector<int> a{8,3,8};auto it=std::find(a.begin(),a.end(),8);std::cout<<(it==a.end()?-1:static_cast<int>(it-a.begin()))<<"\\n";',
    '0\n',
  ],
  'binary-search': [
    '#include <algorithm>\n#include <vector>',
    'std::vector<int> a{1,3,3,7};auto it=std::lower_bound(a.begin(),a.end(),3);std::cout<<(it-a.begin())<<"\\n";',
    '1\n',
  ],
  quick: [
    '#include <algorithm>\n#include <vector>',
    'std::vector<int> a{4,1,3,2};std::sort(a.begin(),a.end());for(std::size_t i=0;i<a.size();++i)std::cout<<(i?" ":"")<<a[i];std::cout<<"\\n";',
    '1 2 3 4\n',
  ],
  vector: [
    '#include <vector>',
    'std::vector<int> a; a.reserve(8);a.push_back(10);a.push_back(20);a.erase(a.begin());std::cout<<a.size()<<" "<<a.at(0)<<"\\n";',
    '1 20\n',
  ],
  list: [
    '#include <forward_list>',
    'std::forward_list<int> a{3,3,5};a.remove(3);for(int x:a)std::cout<<x;std::cout<<"\\n";',
    '5\n',
  ],
  doubly: [
    '#include <list>',
    'std::list<int> a{1,2};a.push_front(3);a.pop_back();bool first=true;for(int x:a){std::cout<<(first?"":" ")<<x;first=false;}std::cout<<"\\n";',
    '3 1\n',
  ],
  stack: [
    '#include <stack>',
    'std::stack<int> s;s.push(4);s.push(9);std::cout<<s.top()<<"\\n";s.pop();',
    '9\n',
  ],
  queue: [
    '#include <queue>',
    'std::queue<int> q;q.push(4);q.push(9);std::cout<<q.front()<<"\\n";q.pop();',
    '4\n',
  ],
  hash: [
    '#include <unordered_map>',
    'std::unordered_map<int,int> counts;counts[17]=20;counts.erase(0);auto it=counts.find(17);if(it==counts.end())return 1;std::cout<<it->second<<"\\n";',
    '20\n',
  ],
  bst: [
    '#include <set>',
    'std::set<int> a{4,2,6,2};bool first=true;for(int x:a){std::cout<<(first?"":" ")<<x;first=false;}std::cout<<"\\n";',
    '2 4 6\n',
  ],
  heap: [
    '#include <queue>\n#include <vector>\n#include <functional>',
    'std::priority_queue<int,std::vector<int>,std::greater<int>> q;q.push(5);q.push(2);q.push(7);std::cout<<q.top()<<"\\n";',
    '2\n',
  ],
  graph: [
    '#include <vector>',
    'std::vector<std::vector<int>> g(3);g[0].push_back(1);g[1].push_back(0);g[1].push_back(2);g[2].push_back(1);for(std::size_t i=0;i<g.size();++i)std::cout<<(i?" ":"")<<g[i].size();std::cout<<"\\n";',
    '1 2 1\n',
  ],
};

function makeExercise(id, title, description, source, cases, explanation, hints) {
  const tests = cases.map(([stdin, expected], i) => ({
    id: `case-${i + 1}`,
    name: i < 2 ? `Пример ${i + 1}` : `Граничный сценарий ${i - 1}`,
    stdin,
    expected,
  }));
  return {
    id,
    title,
    description,
    difficulty: 'intermediate',
    language: 'c',
    standard: 'c17',
    compiler: 'clang',
    diagnostics: 'sanitizers',
    starterCode:
      '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    /* Реализуйте ввод, алгоритм и освобождение ресурсов. */\n    return 0;\n}\n',
    examples: cases.slice(0, 2).map(([input, output]) => ({
      input,
      output,
      explanation: 'Пример фиксирует протокол. Границы и особые состояния проверяются отдельно.',
    })),
    constraints: [
      'Используйте C17 и диапазоны входа из условия.',
      'Выводите только требуемый результат.',
      'Не обращайтесь за логическую длину и освобождайте все полученные ресурсы.',
    ],
    hints: hints.map((text, i) => ({ id: `hint-${i + 1}`, order: i + 1, text })),
    publicTests: tests.slice(0, 2),
    hiddenTests: tests.slice(2),
    referenceSolution: source,
    solutionExplanation: explanation,
    checking: { type: 'stdout', comparison: 'exact' },
  };
}
async function json(path, value) {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  await writeFile(path, await format(JSON.stringify(value), { parser: 'json' }));
}
function escapeText(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');
}
const examples = [];
if (lessons.length !== 28 || specs.size !== 28)
  throw new Error('Ожидаются 28 уроков и упражнений.');
for (const [index, lesson] of lessons.entries()) {
  const spec = specs.get(lesson.id);
  const id = `algo-${lesson.id}`;
  const reference = program(spec.library, spec.body),
    demo = program(spec.library, spec.demoBody);
  const explanation = `Инвариант: ${lesson.model}\n\n${lesson.trace}\n\nВ эталоне сначала проверяется ввод, затем строится состояние и выполняется операция. ${lesson.mistake}\n\nВремя: ${lesson.time}\nПамять: ${lesson.memory}\nКомпромисс: ${lesson.tradeoff}\n\nДля динамических структур проследите все ветви отказа: частично созданные узлы или блоки должны быть освобождены. Тесты stdout проверяют функциональный контракт, ASan/UBSan дополняют его на выполненных путях; требуемую асимптотику обосновывайте по реализации, она не выводится из малого времени теста.`;
  const extra = benchmarks.get(lesson.id);
  const exercise = makeExercise(
    `${id}-exercise`,
    spec.title,
    spec.description,
    reference,
    spec.cases,
    explanation,
    [lesson.model, lesson.mistake, lesson.trace],
  );
  const additionalExercises = extra
    ? [
        makeExercise(
          `${id}-benchmark`,
          extra.title,
          extra.description,
          extra.source,
          extra.cases,
          extra.explanation,
          [
            'Сначала письменно определите событие, увеличивающее каждый счётчик.',
            'Проверьте пустой, минимальный и крайний вход; не подменяйте счётчик временем.',
          ],
        ),
      ]
    : [];
  const metadata = {
    id,
    title: lesson.title,
    description: lesson.theory.split('. ')[0] + '.',
    moduleId: 'algorithms-structures',
    order: index + 1,
    difficulty: 'intermediate',
    estimatedMinutes: index >= 15 ? 60 : 40,
    prerequisites: index ? [`algo-${lessons[index - 1].id}`] : [],
    objectives: [
      `Объяснить инвариант: ${lesson.model}`,
      `Обосновать время: ${lesson.time}`,
      `Оценить память и компромиссы: ${lesson.tradeoff}`,
    ],
    tags: [
      'алгоритмы',
      'C17',
      lesson.title,
      ...(index >= 15 ? ['структуры данных', 'cache locality'] : []),
      ...(extra ? ['benchmark'] : []),
    ],
    published: true,
    standard: 'c17',
    completion: 'practice',
    exercise,
    additionalExercises,
    quiz: {
      id: `${id}-quiz`,
      title: 'Проверка понимания',
      questions: [
        {
          id: 'invariant',
          question: lesson.question,
          options: [lesson.answer, lesson.wrong],
          correct: 0,
          explanation: lesson.model + ' ' + lesson.trace,
        },
        {
          id: 'complexity',
          question: 'Какая оценка соответствует рассмотренной реализации?',
          options: ['Всегда O(1), потому что все тесты ограничены по размеру.', lesson.time],
          correct: 1,
          explanation: lesson.tradeoff,
        },
        {
          id: 'engineering',
          question: 'Какое инженерное ограничение необходимо учитывать?',
          options: [
            lesson.mistake,
            'Совпадение Big O гарантирует одинаковое время на любой машине.',
          ],
          correct: 0,
          explanation: lesson.cache + ' ' + lesson.memory,
        },
      ],
    },
  };
  const directory = `${root}/algorithms-structures/${lesson.id}`;
  await json(`${directory}/lesson.json`, metadata);
  examples.push({
    id: `${id}-c-example`,
    lessonId: id,
    standard: 'c17',
    source: demo,
    stdout: spec.demoOutput,
  });
  let cpp = '';
  if (cppExamples[lesson.id]) {
    const [includes, body, stdout] = cppExamples[lesson.id];
    const source = `#include <iostream>\n${includes}\nint main(){\n${body}\nreturn 0;\n}\n`;
    examples.push({ id: `${id}-cpp-example`, lessonId: id, standard: 'c++20', source, stdout });
    cpp = `\n\nЗапускаемый вариант C++20:\n\n\`\`\`cpp\n${source}\`\`\`\n\nВывод:\n\n\`\`\`text\n${stdout}\`\`\``;
  }
  const body = `## Цели обучения

${metadata.objectives.map((o) => '- ' + escapeText(o)).join('\n')}

## Теория и инвариант

${escapeText(lesson.theory)}

<Concept title="Ментальная модель">

${escapeText(lesson.model)}

</Concept>

## Пошаговый разбор

${escapeText(lesson.trace)}

## Реализация и запускаемый пример на C17

Пример не требует stdin. Сначала предскажите результат; затем выполните код и измените данные. Функции демонстрируют алгоритм, а практика ниже требует самостоятельного ввода и обработки граничных состояний.

\`\`\`c
${demo}\`\`\`

Ожидаемый вывод:

\`\`\`text
${spec.demoOutput}\`\`\`

## Почему реализация корректна

${escapeText(explanations[lesson.id])}

## Сложность и память

| Что оцениваем | Гарантия |
| --- | --- |
| Время | ${escapeText(lesson.time)} |
| Память | ${escapeText(lesson.memory)} |

Размеры в учебном коде ограничены ради безопасного запуска. При анализе представляйте масштабируемый вариант той же структуры; фиксированный тестовый предел не превращает любой алгоритм в полезное «O(1)».

## Cache locality и компромиссы

${escapeText(lesson.cache)}

${escapeText(lesson.tradeoff)}

Практическое применение: ${escapeText(lesson.use)}

<CommonMistake title="Типичная ошибка">

${escapeText(lesson.mistake)}

</CommonMistake>

## Связь со STL C++

${escapeText(lesson.stl)}${cpp}

## Практическое задание

${escapeText(spec.description)}

В практике доступны стартовый код, примеры, публичные тесты и подсказки. Эталонное решение и разбор открываются по подтверждённому запросу. Оценивание не раскрывает входы скрытых тестов.

<CodingExercise />

${extra ? `## Benchmark-задача\n\n${escapeText(extra.description)}\n\nВыберите «${escapeText(extra.title)}» среди заданий во вкладке «Практика». Сравните отсортированный, обратный, пустой и обычный вход там, где они применимы. Счётчик отвечает на вопрос об объёме работы; секунды зависят от машины и сборки.\n\nДля отдельного эксперимента со временем подготовьте одинаковые входы до начала замера. Используйте clock() вокруг исследуемой операции, проверяйте результат на (clock_t)-1 и делите разницу на CLOCKS_PER_SEC с преобразованием к double. Выведите контрольную сумму результата, чтобы компилятор не мог просто удалить неиспользуемую работу. Короткую операцию повторяйте в пределах timeout: нулевой отсчёт может означать недостаточное разрешение часов.\n\nСделайте прогрев и несколько замеров с переменой порядка вариантов. Сравните медианы и разброс, запишите компилятор и режим сборки. Диагностику ASan/UBSan проверяйте отдельно: её накладные расходы искажают сравнение обычных реализаций. Поле времени всего запуска в интерфейсе не заменяет время операции. Никакое фиксированное ускорение не требуется для зачёта.\n` : ''}
## Краткое резюме

${escapeText(lesson.model)} ${escapeText(lesson.time)} ${escapeText(lesson.memory)}

Выбор для реальной системы: ${escapeText(lesson.tradeoff)} ${escapeText(lesson.stl)}
`;
  await writeFile(`${directory}/lesson.mdx`, await format(body, { parser: 'mdx' }));
}
await json(`${root}/algorithms-structures/examples.json`, examples);
const course = JSON.parse(await readFile(`${root}/course.json`, 'utf8'));
course.modules = course.modules.filter((m) => m.id !== 'algorithms-structures');
for (const courseModule of course.modules)
  if (courseModule.id === 'c-basics') courseModule.order = 5;
course.modules.push({
  id: 'algorithms-structures',
  title: 'Алгоритмы и структуры данных',
  description:
    '28 уроков: сложность, поиск и сортировки, структуры на C, связь со STL, графы и воспроизводимые benchmark-задачи.',
  order: 4,
  level: 'Продвинутый',
  icon: 'code',
  prerequisites: ['advanced-c'],
});
course.modules.sort((a, b) => a.order - b.order);
await json(`${root}/course.json`, course);
console.log(
  `Создано ${lessons.length} уроков, ${examples.length} примеров, ${lessons.length + benchmarks.size} задач.`,
);
