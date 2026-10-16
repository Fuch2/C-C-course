// Авторские реализации. Этот модуль хранит текст C; выполнение разрешено только runner.
export const headers =
  '#include <stdio.h>\n#include <stdlib.h>\n#include <stdint.h>\n#include <string.h>\n#include <limits.h>\n';
export const readArray = `int a[256]; int n;
if (scanf("%d", &n)!=1 || n<0 || n>256) return 1;
for(int i=0;i<n;++i) if(scanf("%d", &a[i])!=1) return 1;`;
export const printArray = 'for(int i=0;i<n;++i) printf("%s%d", i?" ":"",a[i]); puts("");';
export const code = {
  algorithm: `static int count_above(const int *a,int n,int limit){
    int count=0;
    for(int i=0;i<n;++i) if(a[i]>limit) ++count;
    return count;
}`,
  linear: `static int find_first(const int *a,int n,int target){
    for(int i=0;i<n;++i) if(a[i]==target) return i;
    return -1;
}`,
  binary: `static int lower(const int *a,int n,int target){
    int left=0,right=n;
    while(left<right){
        int middle=left+(right-left)/2;
        if(a[middle]<target) left=middle+1; else right=middle;
    }
    return left;
}`,
  bubble: `static void sort(int *a,int n){
    for(int end=n;end>1;--end){
        int changed=0;
        for(int j=1;j<end;++j) if(a[j-1]>a[j]){
            int temp=a[j-1];a[j-1]=a[j];a[j]=temp;changed=1;
        }
        if(!changed) break;
    }
}`,
  selection: `static void sort(int *a,int n){
    for(int i=0;i<n;++i){
        int smallest=i;
        for(int j=i+1;j<n;++j) if(a[j]<a[smallest]) smallest=j;
        int temp=a[i];a[i]=a[smallest];a[smallest]=temp;
    }
}`,
  insertion: `static void sort(int *a,int n){
    for(int i=1;i<n;++i){
        int value=a[i],j=i;
        while(j>0 && a[j-1]>value){a[j]=a[j-1];--j;}
        a[j]=value;
    }
}`,
  merge: `static void merge_range(int *a,int *temp,int left,int right){
    if(right-left<2) return;
    int middle=left+(right-left)/2;
    merge_range(a,temp,left,middle);merge_range(a,temp,middle,right);
    int i=left,j=middle,k=left;
    while(i<middle && j<right) temp[k++]=a[i]<=a[j]?a[i++]:a[j++];
    while(i<middle) temp[k++]=a[i++];
    while(j<right) temp[k++]=a[j++];
    for(i=left;i<right;++i) a[i]=temp[i];
}
static int sort(int *a,int n){
    if(n<2)return 1;
    int *temp=malloc((size_t)n*sizeof *temp);
    if(!temp)return 0;
    merge_range(a,temp,0,n);free(temp);return 1;
}`,
  quick: `static void swap(int *a,int *b){int temp=*a;*a=*b;*b=temp;}
static void quick(int *a,int left,int right){
    /* Три области: меньше опорного, равно, больше. Интервал [left,right). */
    while(right-left>1){
        int pivot=a[left+(right-left)/2],lt=left,i=left,gt=right;
        while(i<gt){
            if(a[i]<pivot)swap(&a[lt++],&a[i++]);
            else if(a[i]>pivot)swap(&a[i],&a[--gt]);
            else ++i;
        }
        /* Рекурсия только в меньшую часть ограничивает глубину стека. */
        if(lt-left<right-gt){quick(a,left,lt);left=gt;}
        else {quick(a,gt,right);right=lt;}
    }
}`,
  recursion: `static int sum_range(const int *a,int left,int right){
    if(left==right)return 0;
    if(right-left==1)return a[left];
    int middle=left+(right-left)/2;
    return sum_range(a,left,middle)+sum_range(a,middle,right);
}`,
  vector: `typedef struct { int *data; size_t size,capacity; } Vector;
static int push(Vector *v,int value){
    if(v->size==v->capacity){
        if(v->capacity>SIZE_MAX/2)return 0;
        size_t capacity=v->capacity?v->capacity*2:1;
        if(capacity>SIZE_MAX/sizeof *v->data)return 0;
        int *next=realloc(v->data,capacity*sizeof *next);
        if(!next)return 0;
        v->data=next;v->capacity=capacity;
    }
    v->data[v->size++]=value;return 1;
}
static int erase(Vector *v,size_t position){
    if(position>=v->size)return 0;
    for(size_t i=position+1;i<v->size;++i)v->data[i-1]=v->data[i];
    --v->size;return 1;
}
static void destroy(Vector *v){free(v->data);*v=(Vector){0};}`,
  list: `typedef struct Node { int value; struct Node *next; } Node;
static int prepend(Node **head,int value){
    Node *node=malloc(sizeof *node);if(!node)return 0;
    *node=(Node){value,*head};*head=node;return 1;
}
static void remove_value(Node **head,int target){
    /* link указывает на поле, которое владеет ссылкой на текущий узел. */
    Node **link=head;
    while(*link){
        if((*link)->value==target){Node *old=*link;*link=old->next;free(old);}
        else link=&(*link)->next;
    }
}
static void destroy(Node **head){
    while(*head){Node *old=*head;*head=old->next;free(old);}
}`,
  doubly: `typedef struct Node { int value; struct Node *prev,*next; } Node;
typedef struct { Node *head,*tail; } List;
static int push(List *list,int value,int left){
    Node *node=malloc(sizeof *node);if(!node)return 0;
    *node=(Node){value,NULL,NULL};
    if(!list->head)list->head=list->tail=node;
    else if(left){node->next=list->head;list->head->prev=node;list->head=node;}
    else {node->prev=list->tail;list->tail->next=node;list->tail=node;}
    return 1;
}
static int pop(List *list,int left,int *out){
    Node *node=left?list->head:list->tail;if(!node)return 0;
    *out=node->value;
    if(node->prev)node->prev->next=node->next;else list->head=node->next;
    if(node->next)node->next->prev=node->prev;else list->tail=node->prev;
    free(node);return 1;
}
static void destroy(List *list){int value;while(pop(list,1,&value)){} }`,
  stack: `typedef struct { int data[128]; size_t size; } Stack;
static int push(Stack *stack,int value){
    if(stack->size==128)return 0;stack->data[stack->size++]=value;return 1;
}
static int pop(Stack *stack,int *out){
    if(!stack->size)return 0;*out=stack->data[--stack->size];return 1;
}
static int top(const Stack *stack,int *out){
    if(!stack->size)return 0;*out=stack->data[stack->size-1];return 1;
}`,
  queue: `typedef struct Node { int value; struct Node *next; } Node;
typedef struct { Node *head,*tail; } Queue;
static int push(Queue *q,int value){
    Node *node=malloc(sizeof *node);if(!node)return 0;
    *node=(Node){value,NULL};
    if(q->tail)q->tail->next=node;else q->head=node;
    q->tail=node;return 1;
}
static int pop(Queue *q,int *out){
    if(!q->head)return 0;
    Node *old=q->head;*out=old->value;q->head=old->next;
    if(!q->head)q->tail=NULL;
    free(old);return 1;
}
static void destroy(Queue *q){int value;while(pop(q,&value)){} }`,
  ring: `typedef struct { int data[32]; size_t head,size,capacity; } Ring;
static int push(Ring *r,int value){
    if(r->size==r->capacity)return 0;
    r->data[(r->head+r->size)%r->capacity]=value;++r->size;return 1;
}
static int pop(Ring *r,int *out){
    if(!r->size)return 0;
    *out=r->data[r->head];r->head=(r->head+1)%r->capacity;--r->size;return 1;
}`,
  hash: `enum { CAPACITY=17, EMPTY=0, FULL=1, DELETED=2 };
typedef struct { int key,value,state; } Slot;
typedef struct { Slot slots[CAPACITY]; } Table;
static int hash(int key){return (key%CAPACITY+CAPACITY)%CAPACITY;}
static int find(const Table *t,int key){
    for(int step=0;step<CAPACITY;++step){
        int i=(hash(key)+step)%CAPACITY;
        if(t->slots[i].state==EMPTY)return -1;
        if(t->slots[i].state==FULL && t->slots[i].key==key)return i;
    }
    return -1;
}
static int set(Table *t,int key,int value){
    int candidate=-1;
    for(int step=0;step<CAPACITY;++step){
        int i=(hash(key)+step)%CAPACITY;Slot *s=&t->slots[i];
        if(s->state==FULL && s->key==key){s->value=value;return 1;}
        if(s->state!=FULL && candidate<0)candidate=i;
        if(s->state==EMPTY)break;
    }
    if(candidate<0)return 0;
    t->slots[candidate]=(Slot){key,value,FULL};return 1;
}
static int remove_key(Table *t,int key){
    int i=find(t,key);if(i<0)return 0;t->slots[i].state=DELETED;return 1;
}`,
  tree: `typedef struct Node { int value; struct Node *left,*right; } Node;
static void destroy(Node *root){if(root){destroy(root->left);destroy(root->right);free(root);}}
static Node *build(const int *a,int n,int i,int *ok){
    if(i>=n || a[i]==-9999)return NULL;
    Node *node=malloc(sizeof *node);if(!node){*ok=0;return NULL;}
    *node=(Node){a[i],NULL,NULL};
    node->left=build(a,n,2*i+1,ok);node->right=build(a,n,2*i+2,ok);
    return node;
}
static int height(const Node *root){
    if(!root)return 0;int l=height(root->left),r=height(root->right);return 1+(l>r?l:r);
}
static int leaves(const Node *root){
    if(!root)return 0;
    if(!root->left && !root->right)return 1;
    return leaves(root->left)+leaves(root->right);
}`,
  bst: `typedef struct Node { int key; struct Node *left,*right; } Node;
static int insert(Node **root,int key){
    while(*root){
        if(key==(*root)->key)return 1;
        root=key<(*root)->key?&(*root)->left:&(*root)->right;
    }
    *root=malloc(sizeof **root);if(!*root)return 0;
    **root=(Node){key,NULL,NULL};return 1;
}
static int contains(const Node *root,int key){
    while(root){if(root->key==key)return 1;root=key<root->key?root->left:root->right;}return 0;
}
static void inorder(const Node *root,int *first){
    if(!root)return;inorder(root->left,first);
    printf("%s%d",*first?"":" ",root->key);*first=0;inorder(root->right,first);
}
static void destroy(Node *root){if(root){destroy(root->left);destroy(root->right);free(root);}}`,
  heap: `typedef struct { int data[128]; int size; } Heap;
static int push(Heap *h,int value){
    if(h->size==128)return 0;
    int i=h->size++;
    while(i>0){int parent=(i-1)/2;if(h->data[parent]<=value)break;h->data[i]=h->data[parent];i=parent;}
    h->data[i]=value;return 1;
}
static int pop(Heap *h,int *out){
    if(!h->size)return 0;*out=h->data[0];int last=h->data[--h->size];
    if(!h->size)return 1;
    int i=0;
    while(2*i+1<h->size){
        int child=2*i+1;
        if(child+1<h->size && h->data[child+1]<h->data[child])++child;
        if(last<=h->data[child])break;
        h->data[i]=h->data[child];i=child;
    }
    h->data[i]=last;return 1;
}`,
  graph: `enum { MAX_VERTICES=32, MAX_ARCS=256 };
typedef struct { int to,next; } Edge;
typedef struct { int head[MAX_VERTICES],count; Edge edges[MAX_ARCS]; } Graph;
static void init(Graph *g){for(int i=0;i<MAX_VERTICES;++i)g->head[i]=-1;g->count=0;}
static int connect(Graph *g,int from,int to){
    if(g->count==MAX_ARCS)return 0;
    g->edges[g->count]=(Edge){to,g->head[from]};g->head[from]=g->count++;return 1;
}
static int read_graph(Graph *g,int *vertices){
    int m;if(scanf("%d%d",vertices,&m)!=2 || *vertices<1 || *vertices>32 || m<0 || m>128)return 0;
    init(g);
    for(int i=0;i<m;++i){int a,b;if(scanf("%d%d",&a,&b)!=2 || a<0 || b<0 || a>=*vertices || b>=*vertices)return 0;
        if(!connect(g,a,b) || !connect(g,b,a))return 0;
    }return 1;
}`,
  bfs: `static void distances(const Graph *g,int n,int start,int *distance){
    int queue[MAX_VERTICES],head=0,tail=0;
    for(int i=0;i<n;++i)distance[i]=-1;
    distance[start]=0;queue[tail++]=start;
    while(head<tail){int v=queue[head++];
        for(int e=g->head[v];e!=-1;e=g->edges[e].next){int to=g->edges[e].to;
            if(distance[to]==-1){distance[to]=distance[v]+1;queue[tail++]=to;}
        }
    }
}`,
  dfs: `static void visit(const Graph *g,int v,int *seen){
    seen[v]=1;
    for(int e=g->head[v];e!=-1;e=g->edges[e].next){int to=g->edges[e].to;if(!seen[to])visit(g,to,seen);}
}
static int components(const Graph *g,int n){
    int seen[MAX_VERTICES]={0},count=0;
    for(int i=0;i<n;++i)if(!seen[i]){++count;visit(g,i,seen);}
    return count;
}`,
};
export const program = (library, body) =>
  `${headers}\n${library}\nint main(void) {\n${body}\nreturn 0;\n}\n`;
