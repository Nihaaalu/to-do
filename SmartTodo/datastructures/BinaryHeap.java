package datastructures;

import model.Task;

/**
 * A custom implementation of a Binary Max-Heap (Priority Queue).
 * This structure serves to display and sort tasks by highest priority.
 * Priority is an integer: 3 (High) > 2 (Medium) > 1 (Low).
 * If priorities are equal, tasks are ordered by their ID (smaller ID first).
 * 
 * Complexity Report:
 * - Space Complexity: O(n) to store heap elements.
 * - Time Complexity:
 *   - insert: O(log n)
 *   - removeMax: O(log n)
 *   - peekMax: O(1)
 *   - heapifyUp / heapifyDown: O(log n)
 */
public class BinaryHeap {
    private Task[] heap;
    private int size;
    private int capacity;

    public BinaryHeap(int initialCapacity) {
        this.capacity = initialCapacity;
        this.heap = new Task[capacity];
        this.size = 0;
    }

    public BinaryHeap() {
        this(10);
    }

    private int parent(int i) { return (i - 1) / 2; }
    private int leftChild(int i) { return 2 * i + 1; }
    private int rightChild(int i) { return 2 * i + 2; }

    private void swap(int i, int j) {
        Task temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    private void resize() {
        capacity *= 2;
        Task[] newHeap = new Task[capacity];
        System.arraycopy(heap, 0, newHeap, 0, size);
        heap = newHeap;
    }

    /**
     * Compares two tasks. Returns positive if t1 has higher priority than t2.
     * High priority (3) > Medium (2) > Low (1).
     * Tie-breaker: smaller taskId comes first (oldest task created).
     */
    private int compare(Task t1, Task t2) {
        if (t1.getPriority() != t2.getPriority()) {
            return Integer.compare(t1.getPriority(), t2.getPriority());
        }
        // Smaller ID has higher precedence (FIFO for same priority)
        return Integer.compare(t2.getTaskId(), t1.getTaskId());
    }

    /**
     * Inserts a task into the priority queue.
     * Time Complexity: O(log n)
     */
    public void insert(Task task) {
        if (size == capacity) {
            resize();
        }
        heap[size] = task;
        heapifyUp(size);
        size++;
    }

    /**
     * Removes and returns the highest priority task.
     * Time Complexity: O(log n)
     */
    public Task removeMax() {
        if (size == 0) {
            throw new IllegalStateException("Heap is empty");
        }
        Task max = heap[0];
        heap[0] = heap[size - 1];
        heap[size - 1] = null;
        size--;
        if (size > 0) {
            heapifyDown(0);
        }
        return max;
    }

    /**
     * Returns the highest priority task without removing it.
     * Time Complexity: O(1)
     */
    public Task peekMax() {
        if (size == 0) return null;
        return heap[0];
    }

    /**
     * Sifts up the element at index i to restore heap property.
     * Time Complexity: O(log n)
     */
    private void heapifyUp(int i) {
        while (i > 0 && compare(heap[i], heap[parent(i)]) > 0) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    /**
     * Sifts down the element at index i to restore heap property.
     * Time Complexity: O(log n)
     */
    private void heapifyDown(int i) {
        int maxIndex = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < size && compare(heap[left], heap[maxIndex]) > 0) {
            maxIndex = left;
        }

        if (right < size && compare(heap[right], heap[maxIndex]) > 0) {
            maxIndex = right;
        }

        if (i != maxIndex) {
            swap(i, maxIndex);
            heapifyDown(maxIndex);
        }
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }

    public void clear() {
        heap = new Task[capacity];
        size = 0;
    }

    /**
     * Returns a copy of the underlying tasks in their unsorted heap order.
     * Time Complexity: O(n)
     */
    public Task[] toArray() {
        Task[] array = new Task[size];
        System.arraycopy(heap, 0, array, 0, size);
        return array;
    }

    /**
     * Rebuilds the heap from an array of tasks.
     * Time Complexity: O(n)
     */
    public void buildHeap(Task[] tasks) {
        this.size = tasks.length;
        if (size > capacity) {
            capacity = size * 2;
        }
        this.heap = new Task[capacity];
        System.arraycopy(tasks, 0, this.heap, 0, size);
        for (int i = parent(size - 1); i >= 0; i--) {
            heapifyDown(i);
        }
    }
}
