export interface JavaFile {
  path: string;
  name: string;
  content: string;
}

export const javaFiles: JavaFile[] = [
  {
    path: 'SmartTodo/Main.java',
    name: 'Main.java',
    content: `import ui.MainFrame;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;

/**
 * Main application launcher for the Smart To-Do List (DSA Project).
 * 
 * Complexity Report:
 * - Space Complexity: O(1) for static app bootstrap.
 * - Time Complexity: O(1) GUI thread initialization.
 */
public class Main {
    public static void main(String[] args) {
        // Set modern Look and Feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            System.err.println("Failed to initialize modern OS look and feel: " + e.getMessage());
        }

        // Launch the application window within the Event Dispatch Thread (EDT)
        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}`
  },
  {
    path: 'SmartTodo/model/Task.java',
    name: 'Task.java',
    content: `package model;

/**
 * Task model representing a single to-do item.
 * 
 * Complexity Report:
 * - Space Complexity: O(1) for storing task fields.
 * - Time Complexity: O(1) for all getters, setters, and constructor.
 */
public class Task {
    private int taskId;
    private String title;
    private String description;
    private int priority; // 1 = Low, 2 = Medium, 3 = High
    private String dueDate; // dd/MM/yyyy
    private String status; // "Pending" or "Completed"
    private String category; // e.g. "Work", "Personal", "Study"
    private String createdDate; // dd/MM/yyyy

    public Task(int taskId, String title, String description, int priority, String dueDate, String status, String category, String createdDate) {
        this.taskId = taskId;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.status = status;
        this.category = category;
        this.createdDate = createdDate;
    }

    // Getters and Setters
    public int getTaskId() { return taskId; }
    public void setTaskId(int taskId) { this.taskId = taskId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }

    @Override
    public String toString() {
        return "Task [ID=" + taskId + ", Title=" + title + ", Priority=" + getPriorityString() + 
               ", DueDate=" + dueDate + ", Status=" + status + ", Category=" + category + "]";
    }

    public String getPriorityString() {
        switch (priority) {
            case 3: return "High";
            case 2: return "Medium";
            case 1:
            default: return "Low";
        }
    }

    public static int parsePriority(String priorityStr) {
        if (priorityStr == null) return 1;
        switch (priorityStr.trim().toLowerCase()) {
            case "high": return 3;
            case "medium": return 2;
            case "low":
            default: return 1;
        }
    }
}`
  },
  {
    path: 'SmartTodo/datastructures/Node.java',
    name: 'Node.java',
    content: `package datastructures;

/**
 * A generic node class used for the custom LinkedList.
 * 
 * Complexity Report:
 * - Space Complexity: O(1)
 * - Time Complexity: O(1)
 */
public class Node<T> {
    public T data;
    public Node<T> next;

    public Node(T data) {
        this.data = data;
        this.next = null;
    }
}`
  },
  {
    path: 'SmartTodo/datastructures/LinkedList.java',
    name: 'LinkedList.java',
    content: `package datastructures;

/**
 * A custom implementation of a Singly Linked List with head and tail pointers.
 * This class serves as the primary storage for all tasks.
 * 
 * Complexity Report:
 * - Space Complexity: O(n) to store 'n' elements in nodes.
 * - Time Complexity:
 *   - insert: O(1) because we maintain a tail reference.
 *   - delete: O(n) in the worst case to traverse and find the element to delete.
 *   - get: O(n) to traverse to the specified index.
 *   - size: O(1) since we track the count.
 *   - clear: O(1).
 */
public class LinkedList<T> {
    private Node<T> head;
    private Node<T> tail;
    private int size;

    public LinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    public void insert(T data) {
        Node<T> newNode = new Node<>(data);
        if (head == null) {
            head = newNode;
            tail = newNode;
        } else {
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    public boolean delete(T data) {
        if (head == null) return false;

        if (head.data.equals(data)) {
            head = head.next;
            if (head == null) {
                tail = null;
            }
            size--;
            return true;
        }

        Node<T> current = head;
        while (current.next != null) {
            if (current.next.data.equals(data)) {
                if (current.next == tail) {
                    tail = current;
                }
                current.next = current.next.next;
                size--;
                return true;
            }
            current = current.next;
        }
        return false;
    }

    public T get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
        Node<T> current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        return current.data;
    }

    public void set(int index, T data) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
        Node<T> current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        current.data = data;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
    public void clear() {
        head = null;
        tail = null;
        size = 0;
    }
    public Node<T> getHead() { return head; }
}`
  },
  {
    path: 'SmartTodo/datastructures/Stack.java',
    name: 'Stack.java',
    content: `package datastructures;

/**
 * A custom Node-based implementation of a Stack (LIFO).
 * Used for undoing the last task operations (Add, Delete, Edit).
 * 
 * Complexity Report:
 * - Space Complexity: O(k) where k is the number of stored states in the stack.
 * - Time Complexity:
 *   - push: O(1)
 *   - pop: O(1)
 *   - peek: O(1)
 *   - isEmpty: O(1)
 */
public class Stack<T> {
    private Node<T> top;
    private int size;

    public Stack() {
        this.top = null;
        this.size = 0;
    }

    public void push(T data) {
        Node<T> newNode = new Node<>(data);
        newNode.next = top;
        top = newNode;
        size++;
    }

    public T pop() {
        if (isEmpty()) {
            throw new java.util.EmptyStackException();
        }
        T data = top.data;
        top = top.next;
        size--;
        return data;
    }

    public T peek() {
        if (isEmpty()) {
            throw new java.util.EmptyStackException();
        }
        return top.data;
    }

    public boolean isEmpty() { return top == null; }
    public int size() { return size; }
}`
  },
  {
    path: 'SmartTodo/datastructures/Queue.java',
    name: 'Queue.java',
    content: `package datastructures;

/**
 * A custom Node-based implementation of a Queue (FIFO).
 * Used for maintaining the completed task history or a general event log.
 * 
 * Complexity Report:
 * - Space Complexity: O(n) where n is the number of items in the queue.
 * - Time Complexity:
 *   - enqueue: O(1) because we maintain a tail pointer.
 *   - dequeue: O(1) since we remove from the head.
 *   - isEmpty: O(1)
 *   - size: O(1)
 */
public class Queue<T> {
    private Node<T> head;
    private Node<T> tail;
    private int size;

    public Queue() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    public void enqueue(T data) {
        Node<T> newNode = new Node<>(data);
        if (tail == null) {
            head = newNode;
            tail = newNode;
        } else {
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    public T dequeue() {
        if (isEmpty()) {
            throw new java.util.NoSuchElementException("Queue is empty");
        }
        T data = head.data;
        head = head.next;
        if (head == null) {
            tail = null;
        }
        size--;
        return data;
    }

    public boolean isEmpty() { return head == null; }
    public int size() { return size; }

    public Object[] toArray() {
        Object[] array = new Object[size];
        Node<T> current = head;
        int i = 0;
        while (current != null) {
            array[i++] = current.data;
            current = current.next;
        }
        return array;
    }
}`
  },
  {
    path: 'SmartTodo/datastructures/HashTable.java',
    name: 'HashTable.java',
    content: `package datastructures;

/**
 * A custom implementation of a Hash Table with Separate Chaining for collision handling.
 * Used for O(1) average-time search by Task ID.
 * 
 * Complexity Report:
 * - Space Complexity: O(m + n) where m is the number of buckets and n is the number of items.
 * - Time Complexity:
 *   - insert: O(1) average-time, O(n) worst-case.
 *   - delete: O(1) average-time.
 *   - search: O(1) average-time.
 */
public class HashTable<K, V> {
    private static class HashNode<K, V> {
        K key;
        V value;
        HashNode<K, V> next;
        public HashNode(K key, V value) {
            this.key = key;
            this.value = value;
        }
    }

    private HashNode<K, V>[] buckets;
    private int capacity;
    private int size;
    private static final double LOAD_FACTOR_THRESHOLD = 0.75;

    @SuppressWarnings("unchecked")
    public HashTable(int initialCapacity) {
        this.capacity = initialCapacity;
        this.buckets = (HashNode<K, V>[]) new HashNode[capacity];
        this.size = 0;
    }

    public HashTable() { this(16); }

    private int getBucketIndex(K key) {
        return Math.abs(key.hashCode()) % capacity;
    }

    public void insert(K key, V value) {
        int bucketIndex = getBucketIndex(key);
        HashNode<K, V> head = buckets[bucketIndex];

        HashNode<K, V> current = head;
        while (current != null) {
            if (current.key.equals(key)) {
                current.value = value;
                return;
            }
            current = current.next;
        }

        HashNode<K, V> newNode = new HashNode<>(key, value);
        newNode.next = buckets[bucketIndex];
        buckets[bucketIndex] = newNode;
        size++;

        if ((double) size / capacity >= LOAD_FACTOR_THRESHOLD) {
            resize();
        }
    }

    public V search(K key) {
        int bucketIndex = getBucketIndex(key);
        HashNode<K, V> current = buckets[bucketIndex];
        while (current != null) {
            if (current.key.equals(key)) return current.value;
            current = current.next;
        }
        return null;
    }

    public V delete(K key) {
        int bucketIndex = getBucketIndex(key);
        HashNode<K, V> current = buckets[bucketIndex];
        HashNode<K, V> prev = null;

        while (current != null) {
            if (current.key.equals(key)) {
                if (prev != null) prev.next = current.next;
                else buckets[bucketIndex] = current.next;
                size--;
                return current.value;
            }
            prev = current;
            current = current.next;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        int oldCapacity = capacity;
        HashNode<K, V>[] oldBuckets = buckets;

        capacity = oldCapacity * 2;
        buckets = (HashNode<K, V>[]) new HashNode[capacity];
        size = 0;

        for (int i = 0; i < oldCapacity; i++) {
            HashNode<K, V> head = oldBuckets[i];
            while (head != null) {
                insert(head.key, head.value);
                head = head.next;
            }
        }
    }
}`
  },
  {
    path: 'SmartTodo/datastructures/BinaryHeap.java',
    name: 'BinaryHeap.java',
    content: `package datastructures;

import model.Task;

/**
 * A custom implementation of a Binary Max-Heap (Priority Queue).
 * This structure serves to display and sort tasks by highest priority.
 * Priority is an integer: 3 (High) > 2 (Medium) > 1 (Low).
 * 
 * Complexity Report:
 * - Space Complexity: O(n) to store heap elements.
 * - Time Complexity:
 *   - insert: O(log n)
 *   - removeMax: O(log n)
 *   - peekMax: O(1)
 */
public class BinaryHeap {
    private Task[] heap;
    private int size;
    private int capacity;

    public BinaryHeap() {
        this.capacity = 10;
        this.heap = new Task[capacity];
        this.size = 0;
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

    private int compare(Task t1, Task t2) {
        if (t1.getPriority() != t2.getPriority()) {
            return Integer.compare(t1.getPriority(), t2.getPriority());
        }
        return Integer.compare(t2.getTaskId(), t1.getTaskId());
    }

    public void insert(Task task) {
        if (size == capacity) resize();
        heap[size] = task;
        heapifyUp(size);
        size++;
    }

    public Task removeMax() {
        if (size == 0) throw new IllegalStateException("Heap is empty");
        Task max = heap[0];
        heap[0] = heap[size - 1];
        heap[size - 1] = null;
        size--;
        if (size > 0) heapifyDown(0);
        return max;
    }

    public boolean isEmpty() { return size == 0; }

    private void heapifyUp(int i) {
        while (i > 0 && compare(heap[i], heap[parent(i)]) > 0) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    private void heapifyDown(int i) {
        int maxIndex = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < size && compare(heap[left], heap[maxIndex]) > 0) maxIndex = left;
        if (right < size && compare(heap[right], heap[maxIndex]) > 0) maxIndex = right;

        if (i != maxIndex) {
            swap(i, maxIndex);
            heapifyDown(maxIndex);
        }
    }

    public void buildHeap(Task[] tasks) {
        this.size = tasks.length;
        this.heap = new Task[size * 2];
        System.arraycopy(tasks, 0, this.heap, 0, size);
        for (int i = parent(size - 1); i >= 0; i--) {
            heapifyDown(i);
        }
    }
}`
  },
  {
    path: 'SmartTodo/algorithms/MergeSort.java',
    name: 'MergeSort.java',
    content: `package algorithms;

import model.Task;

/**
 * A custom implementation of the Merge Sort algorithm for Task sorting.
 * 
 * Complexity Report:
 * - Space Complexity: O(n) auxiliary space.
 * - Time Complexity: O(n log n) in all cases.
 */
public class MergeSort {
    public static void sort(Task[] array, String sortBy) {
        if (array == null || array.length < 2) return;
        mergeSort(array, 0, array.length - 1, sortBy.toLowerCase().trim());
    }

    private static void mergeSort(Task[] array, int left, int right, String sortBy) {
        if (left < right) {
            int mid = left + (right - left) / 2;
            mergeSort(array, left, mid, sortBy);
            mergeSort(array, mid + 1, right, sortBy);
            merge(array, left, mid, right, sortBy);
        }
    }

    private static void merge(Task[] array, int left, int mid, int right, String sortBy) {
        int n1 = mid - left + 1;
        int n2 = right - mid;

        Task[] leftArr = new Task[n1];
        Task[] rightArr = new Task[n2];

        System.arraycopy(array, left, leftArr, 0, n1);
        System.arraycopy(array, mid + 1, rightArr, 0, n2);

        int i = 0, j = 0, k = left;
        while (i < n1 && j < n2) {
            if (compareTasks(leftArr[i], rightArr[j], sortBy) <= 0) {
                array[k] = leftArr[i++];
            } else {
                array[k] = rightArr[j++];
            }
            k++;
        }

        while (i < n1) array[k++] = leftArr[i++];
        while (j < n2) array[k++] = rightArr[j++];
    }

    private static int compareTasks(Task t1, Task t2, String sortBy) {
        switch (sortBy) {
            case "title": return t1.getTitle().compareToIgnoreCase(t2.getTitle());
            case "priority": return Integer.compare(t2.getPriority(), t1.getPriority());
            case "duedate":
                try {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd/MM/yyyy");
                    java.util.Date d1 = sdf.parse(t1.getDueDate());
                    java.util.Date d2 = sdf.parse(t2.getDueDate());
                    return d1.compareTo(d2);
                } catch (Exception e) {
                    return t1.getDueDate().compareTo(t2.getDueDate());
                }
            default: return Integer.compare(t1.getTaskId(), t2.getTaskId());
        }
    }
}`
  },
  {
    path: 'SmartTodo/algorithms/BinarySearch.java',
    name: 'BinarySearch.java',
    content: `package algorithms;

import model.Task;

/**
 * A custom implementation of the Binary Search algorithm.
 * 
 * Complexity Report:
 * - Space Complexity: O(1) iterative.
 * - Time Complexity: O(log n)
 */
public class BinarySearch {
    public static int searchById(Task[] array, int targetId) {
        int left = 0, right = array.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (array[mid].getTaskId() == targetId) return mid;
            else if (array[mid].getTaskId() < targetId) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static int searchByTitle(Task[] array, String targetTitle) {
        int left = 0, right = array.length - 1;
        String targetLower = targetTitle.toLowerCase();
        while (left <= right) {
            int mid = left + (right - left) / 2;
            int cmp = array[mid].getTitle().toLowerCase().compareTo(targetLower);
            if (cmp == 0) return mid;
            else if (cmp < 0) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`
  }
];
