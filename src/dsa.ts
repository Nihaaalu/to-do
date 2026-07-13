import { Task, UndoAction } from './types';

export function calculateUrgencyScore(task: Task, now: number = Date.now()): number {
  const remainingHours = ((task.dueTimestamp || 0) - now) / (1000 * 60 * 60);
  
  // Time Weight × Remaining Time (closer deadline = higher urgency score)
  const timeWeight = 100;
  const timeScore = -remainingHours * timeWeight;
  
  // Task Priority Weight (Priority: 1 = Low, 2 = Medium, 3 = High)
  const priorityWeight = 10;
  const priorityScore = task.priority * priorityWeight;
  
  // Age Weight (older tasks get slightly higher weight if everything else is equal)
  const ageHours = (now - task.createdAt) / (1000 * 60 * 60);
  const ageWeight = 0.001;
  const ageScore = ageHours * ageWeight;
  
  return timeScore + priorityScore + ageScore;
}

// Generic Node
export class DSANode<T> {
  public data: T;
  public next: DSANode<T> | null = null;
  constructor(data: T) {
    this.data = data;
  }
}

// Custom Singly Linked List with head and tail
export class DSALinkedList<T> {
  public head: DSANode<T> | null = null;
  public tail: DSANode<T> | null = null;
  private _size: number = 0;

  public insert(data: T): string {
    const newNode = new DSANode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      if (this.tail) {
        this.tail.next = newNode;
        this.tail = newNode;
      }
    }
    this._size++;
    return `[LINKED LIST] Inserted node at end in O(1) time. Updated size: ${this._size}.`;
  }

  public contains(data: T, keyExtractor?: (item: T) => any): boolean {
    return this.find(data, keyExtractor) !== null;
  }

  public find(data: T, keyExtractor?: (item: T) => any): T | null {
    let current = this.head;
    const extractor = keyExtractor || ((item: T) => item);
    const eq = (a: T, b: T): boolean => {
      if (a && b) {
        if (typeof (a as any).equals === 'function') {
          return (a as any).equals(b);
        }
        if (typeof a === 'object' && typeof b === 'object') {
          const idA = (a as any).taskId;
          const idB = (b as any).taskId;
          if (idA !== undefined && idB !== undefined) {
            return idA === idB;
          }
        }
      }
      return extractor(a) === extractor(b);
    };

    while (current) {
      if (eq(current.data, data)) {
        return current.data;
      }
      current = current.next;
    }
    return null;
  }

  public delete(data: T, keyExtractor: (item: T) => any): { success: boolean; log: string } {
    if (!this.head) return { success: false, log: `[LINKED LIST] List is empty. Deletion failed.` };

    const eq = (a: T, b: T): boolean => {
      if (a && b) {
        if (typeof (a as any).equals === 'function') {
          return (a as any).equals(b);
        }
        if (typeof a === 'object' && typeof b === 'object') {
          const idA = (a as any).taskId;
          const idB = (b as any).taskId;
          if (idA !== undefined && idB !== undefined) {
            return idA === idB;
          }
        }
      }
      return keyExtractor(a) === keyExtractor(b);
    };

    if (eq(this.head.data, data)) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this._size--;
      return { success: true, log: `[LINKED LIST] Deleted head node in O(1) time. Remaining size: ${this._size}.` };
    }

    let current = this.head;
    let stepCount = 1;
    while (current.next !== null) {
      stepCount++;
      if (eq(current.next.data, data)) {
        if (current.next === this.tail) {
          this.tail = current;
        }
        current.next = current.next.next;
        this._size--;
        return { 
          success: true, 
          log: `[LINKED LIST] Traversed ${stepCount} node(s) to delete task in O(n) time. Remaining size: ${this._size}.` 
        };
      }
      current = current.next;
    }

    return { success: false, log: `[LINKED LIST] Traversed entire list (${stepCount} nodes). Target element not found.` };
  }

  public get(index: number): T {
    if (index < 0 || index >= this._size) {
      throw new Error(`Index out of bounds: ${index}`);
    }
    let current = this.head;
    for (let i = 0; i < index; i++) {
      if (current) current = current.next;
    }
    return current!.data;
  }

  public set(index: number, data: T) {
    if (index < 0 || index >= this._size) {
      throw new Error(`Index out of bounds: ${index}`);
    }
    let current = this.head;
    for (let i = 0; i < index; i++) {
      if (current) current = current.next;
    }
    current!.data = data;
  }

  public size(): number {
    return this._size;
  }

  public toArray(): T[] {
    const arr: T[] = [];
    let current = this.head;
    while (current) {
      arr.push(current.data);
      current = current.next;
    }
    return arr;
  }

  public clear() {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }
}

// Custom Node-based Stack
export class DSAStack<T> {
  public top: DSANode<T> | null = null;
  private _size: number = 0;

  public push(data: T): string {
    const newNode = new DSANode(data);
    newNode.next = this.top;
    this.top = newNode;
    this._size++;
    return `[STACK] Pushed action to top in O(1) time. Stack depth: ${this._size}.`;
  }

  public pop(): { data: T | null; log: string } {
    if (!this.top) {
      return { data: null, log: `[STACK] Stack is empty. Pop operation skipped.` };
    }
    const data = this.top.data;
    this.top = this.top.next;
    this._size--;
    return { data, log: `[STACK] Popped top state in O(1) time. Remaining depth: ${this._size}.` };
  }

  public peek(): T | null {
    return this.top ? this.top.data : null;
  }

  public peekOrNull(): T | null {
    return this.top ? this.top.data : null;
  }

  public isEmpty(): boolean {
    return this.top === null;
  }

  public size(): number {
    return this._size;
  }

  public toArray(): T[] {
    const arr: T[] = [];
    let current = this.top;
    while (current) {
      arr.push(current.data);
      current = current.next;
    }
    return arr;
  }
}

// Custom Node-based Queue
export class DSAQueue<T> {
  public head: DSANode<T> | null = null;
  public tail: DSANode<T> | null = null;
  private _size: number = 0;

  public enqueue(data: T): string {
    const newNode = new DSANode(data);
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this._size++;
    return `[QUEUE] Enqueued event (FIFO) in O(1) time. History queue size: ${this._size}.`;
  }

  public dequeue(): T | null {
    if (!this.head) return null;
    const data = this.head.data;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this._size--;
    return data;
  }

  public peek(): T | null {
    return this.head ? this.head.data : null;
  }

  public isEmpty(): boolean {
    return this.head === null;
  }

  public size(): number {
    return this._size;
  }

  public toArray(): T[] {
    const arr: T[] = [];
    let current = this.head;
    while (current) {
      arr.push(current.data);
      current = current.next;
    }
    return arr;
  }

  public remove(data: T): boolean {
    if (!this.head) return false;
    
    const eq = (a: T, b: T) => {
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        const idA = (a as any).taskId;
        const idB = (b as any).taskId;
        if (idA !== undefined && idB !== undefined) return idA === idB;
      }
      return a === b;
    };

    if (eq(this.head.data, data)) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this._size--;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (eq(current.next.data, data)) {
        if (current.next === this.tail) {
          this.tail = current;
        }
        current.next = current.next.next;
        this._size--;
        return true;
      }
      current = current.next;
    }
    return false;
  }
}

// Custom Hash Table with Separate Chaining
export class DSAHashTable<K, V> {
  private buckets: Array<DSANode<{ key: K; value: V }> | null>;
  private capacity: number;
  private _size: number = 0;

  constructor(initialCapacity = 11) {
    this.capacity = this.nextPrime(initialCapacity);
    this.buckets = new Array(this.capacity).fill(null);
  }

  private isPrime(n: number): boolean {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  private nextPrime(n: number): number {
    if (n <= 2) return 2;
    let prime = n;
    if (prime % 2 === 0) prime++;
    while (!this.isPrime(prime)) {
      prime += 2;
    }
    return prime;
  }

  private hash(key: K): number {
    const hashCode = String(key).split('').reduce((acc, char) => {
      return (acc * 31 + char.charCodeAt(0)) | 0;
    }, 0);
    return (hashCode & 0x7fffffff) % this.capacity;
  }

  public insert(key: K, value: V): string {
    const idx = this.hash(key);
    let head = this.buckets[idx];
    let steps = 0;

    let current = head;
    while (current) {
      steps++;
      if (current.data.key === key) {
        current.data.value = value;
        return `[HASH TABLE] Updated existing key "${key}" at bucket ${idx} after ${steps} chain traversals (Separate Chaining).`;
      }
      current = current.next;
    }

    const newNode = new DSANode({ key, value });
    newNode.next = this.buckets[idx];
    this.buckets[idx] = newNode;
    this._size++;

    let resizeLog = '';
    // Resize if load factor >= 0.75
    if (this._size / this.capacity >= 0.75) {
      const oldCap = this.capacity;
      const nextCap = this.nextPrime(oldCap * 2);
      this.resize(nextCap);
      resizeLog = ` [RESIZED] Load factor exceeded 0.75. Capacity increased from ${oldCap} to ${this.capacity} (prime) and elements rehashed.`;
    }

    return `[HASH TABLE] Inserted key "${key}" in bucket ${idx} in O(1) average time.${resizeLog}`;
  }

  public search(key: K): { value: V | null; log: string } {
    const idx = this.hash(key);
    let current = this.buckets[idx];
    let steps = 0;

    while (current) {
      steps++;
      if (current.data.key === key) {
        return { 
          value: current.data.value, 
          log: `[HASH TABLE] Found key "${key}" at bucket ${idx} in ${steps} step(s) (O(1) average lookup).` 
        };
      }
      current = current.next;
    }

    return { 
      value: null, 
      log: `[HASH TABLE] Key "${key}" not found in bucket ${idx} after scanning ${steps} chain links.` 
    };
  }

  public delete(key: K): { value: V | null; log: string } {
    const idx = this.hash(key);
    let head = this.buckets[idx];
    let prev: DSANode<{ key: K; value: V }> | null = null;
    let current = head;
    let steps = 0;

    while (current) {
      steps++;
      if (current.data.key === key) {
        if (prev) {
          prev.next = current.next;
        } else {
          this.buckets[idx] = current.next;
        }
        this._size--;

        let resizeLog = '';
        // Shrink if load factor falls below 0.25 and capacity is above 11
        if (this._size / this.capacity < 0.25 && this.capacity > 11) {
          const oldCap = this.capacity;
          const nextCap = this.nextPrime(Math.max(11, Math.floor(oldCap / 2)));
          if (nextCap !== oldCap) {
            this.resize(nextCap);
            resizeLog = ` [RESIZED] Load factor fell below 0.25. Capacity decreased from ${oldCap} to ${this.capacity} (prime) and elements rehashed.`;
          }
        }

        return { 
          value: current.data.value, 
          log: `[HASH TABLE] Deleted key "${key}" from bucket ${idx} in ${steps} step(s) (O(1) average deletion).${resizeLog}` 
        };
      }
      prev = current;
      current = current.next;
    }

    return { 
      value: null, 
      log: `[HASH TABLE] Deletion failed. Key "${key}" not found in bucket ${idx} after traversing ${steps} node(s).` 
    };
  }

  private resize(newCapacity = this.nextPrime(this.capacity * 2)) {
    const oldCapacity = this.capacity;
    const oldBuckets = this.buckets;

    this.capacity = newCapacity;
    this.buckets = new Array(this.capacity).fill(null);
    this._size = 0;

    for (let i = 0; i < oldCapacity; i++) {
      let node = oldBuckets[i];
      while (node) {
        this.insert(node.data.key, node.data.value);
        node = node.next;
      }
    }
  }

  public entries(): Array<{ key: K; value: V }> {
    const result: Array<{ key: K; value: V }> = [];
    for (let i = 0; i < this.capacity; i++) {
      let current = this.buckets[i];
      while (current) {
        result.push({ key: current.data.key, value: current.data.value });
        current = current.next;
      }
    }
    return result;
  }

  public keys(): K[] {
    return this.entries().map(e => e.key);
  }

  public values(): V[] {
    return this.entries().map(e => e.value);
  }

  public forEach(callback: (value: V, key: K) => void): void {
    for (let i = 0; i < this.capacity; i++) {
      let current = this.buckets[i];
      while (current) {
        callback(current.data.value, current.data.key);
        current = current.next;
      }
    }
  }

  public getDiagnostics() {
    let collisionCount = 0;
    let maxChainLength = 0;
    let totalChainLength = 0;
    let occupiedBuckets = 0;

    for (let i = 0; i < this.capacity; i++) {
      let chainLength = 0;
      let current = this.buckets[i];
      while (current) {
        chainLength++;
        current = current.next;
      }
      if (chainLength > 0) {
        occupiedBuckets++;
        totalChainLength += chainLength;
        if (chainLength > 1) {
          collisionCount += (chainLength - 1);
        }
        if (chainLength > maxChainLength) {
          maxChainLength = chainLength;
        }
      }
    }

    const loadFactor = this._size / this.capacity;
    const averageChainLength = occupiedBuckets > 0 ? totalChainLength / occupiedBuckets : 0;

    return {
      collisionCount,
      loadFactor,
      maxChainLength,
      averageChainLength,
      capacity: this.capacity,
      size: this._size
    };
  }

  public getBucketsInfo(): Array<{ index: number; keys: K[] }> {
    return this.buckets.map((node, idx) => {
      const keys: K[] = [];
      let current = node;
      while (current) {
        keys.push(current.data.key);
        current = current.next;
      }
      return { index: idx, keys };
    });
  }

  public size() { return this._size; }
  public getCapacity() { return this.capacity; }
}

// Custom Binary Heap (Max-Heap) for Task Priority
export class DSABinaryHeap {
  private heap: Task[] = [];
  private initialCapacity: number = 16;
  private capacity: number;
  private comparisonTime: number = Date.now();

  constructor(initialCapacity = 16) {
    this.initialCapacity = initialCapacity;
    this.capacity = initialCapacity;
  }

  private parent(i: number) { return Math.floor((i - 1) / 2); }
  private leftChild(i: number) { return 2 * i + 1; }
  private rightChild(i: number) { return 2 * i + 2; }

  private swap(i: number, j: number) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  private compare(t1: Task, t2: Task): number {
    const score1 = calculateUrgencyScore(t1, this.comparisonTime);
    const score2 = calculateUrgencyScore(t2, this.comparisonTime);
    if (Math.abs(score1 - score2) > 1e-9) {
      return score1 - score2;
    }
    if (t1.priority !== t2.priority) {
      return t1.priority - t2.priority;
    }
    const ts1 = t1.dueTimestamp || 0;
    const ts2 = t2.dueTimestamp || 0;
    if (ts1 !== ts2) {
      return ts2 - ts1; // earlier deadline wins
    }
    return t2.createdAt - t1.createdAt; // older created task wins (FIFO)
  }

  private parseDateValue(dStr: string): number {
    if (!dStr) return 0;
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
    }
    return new Date(dStr).getTime();
  }


  public clear(resetCapacity: boolean = false): string {
    this.heap = [];
    if (resetCapacity) {
      this.capacity = this.initialCapacity;
    }
    return `[BINARY HEAP] Heap cleared.${resetCapacity ? ` Capacity reset back to ${this.initialCapacity}.` : ''}`;
  }

  public contains(task: Task): boolean {
    return this.heap.some(t => t.taskId === task.taskId);
  }

  public remove(task: Task): boolean {
    this.comparisonTime = Date.now();
    const idx = this.heap.findIndex(t => t.taskId === task.taskId);
    if (idx === -1) return false;

    const lastIdx = this.heap.length - 1;
    if (idx === lastIdx) {
      this.heap.pop();
      return true;
    }

    this.swap(idx, lastIdx);
    this.heap.pop();

    const parentIdx = this.parent(idx);
    if (idx > 0 && this.compare(this.heap[idx], this.heap[parentIdx]) > 0) {
      this.heapifyUp(idx);
    } else {
      this.heapifyDown(idx);
    }
    return true;
  }

  public updatePriority(task: Task): boolean {
    this.comparisonTime = Date.now();
    const idx = this.heap.findIndex(t => t.taskId === task.taskId);
    if (idx === -1) return false;

    this.heap[idx] = task;

    const parentIdx = this.parent(idx);
    if (idx > 0 && this.compare(this.heap[idx], this.heap[parentIdx]) > 0) {
      this.heapifyUp(idx);
    } else {
      this.heapifyDown(idx);
    }
    return true;
  }

  public insert(task: Task): string {
    this.comparisonTime = Date.now();
    this.heap.push(task);
    if (this.heap.length > this.capacity) {
      this.capacity *= 2;
    }
    const sifts = this.heapifyUp(this.heap.length - 1);
    return `[BINARY HEAP] Inserted task ID ${task.taskId} with Priority ${task.priority}. Heap sift-up triggered: ${sifts} swaps. O(log n) time.`;
  }

  public removeMax(): { task: Task | null; log: string } {
    if (this.heap.length === 0) {
      return { task: null, log: `[BINARY HEAP] Heap is empty. Extraction skipped.` };
    }
    this.comparisonTime = Date.now();
    const max = this.heap[0];
    const last = this.heap.pop()!;
    
    let sifts = 0;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      sifts = this.heapifyDown(0);
    }
    return { 
      task: max, 
      log: `[BINARY HEAP] Extracted root Max task "${max.title}" (Priority ${max.priority}) in O(log n) time. Heapify sift-down triggered: ${sifts} swaps.` 
    };
  }

  public peekMax(): Task | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  private heapifyUp(i: number): number {
    let swaps = 0;
    while (i > 0 && this.compare(this.heap[i], this.heap[this.parent(i)]) > 0) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
      swaps++;
    }
    return swaps;
  }

  private heapifyDown(i: number): number {
    let swaps = 0;
    const size = this.heap.length;

    while (true) {
      const left = this.leftChild(i);
      const right = this.rightChild(i);
      let currentMax = i;

      if (left < size && this.compare(this.heap[left], this.heap[currentMax]) > 0) {
        currentMax = left;
      }
      if (right < size && this.compare(this.heap[right], this.heap[currentMax]) > 0) {
        currentMax = right;
      }

      if (currentMax !== i) {
        this.swap(i, currentMax);
        swaps++;
        i = currentMax;
      } else {
        break;
      }
    }
    return swaps;
  }

  public buildHeap(tasks: Task[]): string {
    if (!tasks || tasks.length === 0) {
      this.heap = [];
      return `[BINARY HEAP] Bottom-up built heap of 0 elements safely.`;
    }
    this.comparisonTime = Date.now();
    this.heap = [...tasks];
    const size = this.heap.length;
    let swaps = 0;
    for (let i = Math.floor(size / 2) - 1; i >= 0; i--) {
      swaps += this.heapifyDown(i);
    }
    return `[BINARY HEAP] Bottom-up built heap of ${size} elements in O(n) linear time. Sift-down actions: ${swaps} swaps.`;
  }

  public toArray(): Task[] {
    return [...this.heap];
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public size(): number {
    return this.heap.length;
  }
}

// Custom Merge Sort Algorithm
export class DSAMergeSort {
  public static sort(array: Task[], sortBy: 'id' | 'title' | 'priority' | 'duedate'): { array: Task[]; log: string } {
    if (array.length < 2) return { array, log: `[MERGE SORT] Array size ${array.length} is already sorted.` };
    const comparisons = { count: 0 };
    const nowSnapshot = Date.now();
    const sorted = this.mergeSort(array, sortBy, comparisons, nowSnapshot);
    return { 
      array: sorted, 
      log: `[MERGE SORT] Sorted ${array.length} tasks by "${sortBy}" in O(n log n) time. Performed ${comparisons.count} comparisons.` 
    };
  }

  private static mergeSort(array: Task[], sortBy: string, comparisons: { count: number }, nowSnapshot: number): Task[] {
    if (array.length <= 1) return array;

    const mid = Math.floor(array.length / 2);
    const left = this.mergeSort(array.slice(0, mid), sortBy, comparisons, nowSnapshot);
    const right = this.mergeSort(array.slice(mid), sortBy, comparisons, nowSnapshot);

    return this.merge(left, right, sortBy, comparisons, nowSnapshot);
  }

  private static merge(left: Task[], right: Task[], sortBy: string, comparisons: { count: number }, nowSnapshot: number): Task[] {
    const result: Task[] = [];
    let lIdx = 0;
    let rIdx = 0;

    while (lIdx < left.length && rIdx < right.length) {
      comparisons.count++;
      const cmp = this.compare(left[lIdx], right[rIdx], sortBy, nowSnapshot);
      if (cmp <= 0) {
        result.push(left[lIdx]);
        lIdx++;
      } else {
        result.push(right[rIdx]);
        rIdx++;
      }
    }

    return result.concat(left.slice(lIdx)).concat(right.slice(rIdx));
  }

  private static compare(t1: Task, t2: Task, sortBy: string, nowSnapshot: number): number {
    switch (sortBy) {
      case 'title':
        return t1.title.localeCompare(t2.title);
      case 'priority': {
        const score1 = calculateUrgencyScore(t1, nowSnapshot);
        const score2 = calculateUrgencyScore(t2, nowSnapshot);
        if (Math.abs(score1 - score2) > 1e-9) {
          return score2 - score1; // higher urgency score first
        }
        if (t1.priority !== t2.priority) {
          return t2.priority - t1.priority; // higher priority first
        }
        const ts1 = t1.dueTimestamp || 0;
        const ts2 = t2.dueTimestamp || 0;
        if (ts1 !== ts2) {
          return ts1 - ts2; // earlier deadline first
        }
        return t1.createdAt - t2.createdAt; // older created task first (FIFO)
      }
      case 'duedate': {
        const ts1 = t1.dueTimestamp || 0;
        const ts2 = t2.dueTimestamp || 0;
        if (ts1 !== ts2) {
          return ts1 - ts2; // Earlier combined deadline first
        }
        if (t1.priority !== t2.priority) {
          return t2.priority - t1.priority; // Priority DESC as secondary
        }
        return t1.createdAt - t2.createdAt;
      }
      case 'id':
      default:
        return t1.taskId - t2.taskId;
    }
  }
}

// Custom Binary Search Algorithm
export class DSABinarySearch {
  public static searchById(sortedTasks: Task[], targetId: number): { index: number; log: string } {
    let left = 0;
    let right = sortedTasks.length - 1;
    let steps = 0;

    while (left <= right) {
      steps++;
      const mid = Math.floor(left + (right - left) / 2);
      const midId = sortedTasks[mid].taskId;

      if (midId === targetId) {
        return { 
          index: mid, 
          log: `[BINARY SEARCH] Found ID ${targetId} at index ${mid} in ${steps} steps (O(log n) time complexity).` 
        };
      } else if (midId < targetId) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return { 
      index: -1, 
      log: `[BINARY SEARCH] Exhausted search range for ID ${targetId} in ${steps} steps. Task not found.` 
    };
  }

  public static searchByTitle(sortedTasks: Task[], targetTitle: string): { index: number; log: string } {
    let left = 0;
    let right = sortedTasks.length - 1;
    let steps = 0;
    const targetLower = targetTitle.toLowerCase();

    while (left <= right) {
      steps++;
      const mid = Math.floor(left + (right - left) / 2);
      const midTitleLower = sortedTasks[mid].title.toLowerCase();

      const cmp = midTitleLower.localeCompare(targetLower);
      if (cmp === 0) {
        return { 
          index: mid, 
          log: `[BINARY SEARCH] Found Title "${targetTitle}" at index ${mid} in ${steps} steps (O(log n) time complexity).` 
        };
      } else if (cmp < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return { 
      index: -1, 
      log: `[BINARY SEARCH] Exhausted search range for Title "${targetTitle}" in ${steps} steps. Task not found.` 
    };
  }
}
