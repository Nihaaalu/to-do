package datastructures;

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

    /**
     * Adds an item to the end of the queue.
     * Time Complexity: O(1)
     */
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

    /**
     * Removes and returns the item at the front of the queue.
     * Time Complexity: O(1)
     */
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

    public boolean isEmpty() {
        return head == null;
    }

    public int size() {
        return size;
    }

    public void clear() {
        head = null;
        tail = null;
        size = 0;
    }

    /**
     * Custom traversal to return an array of elements in queue order.
     * Time Complexity: O(n)
     */
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
}
