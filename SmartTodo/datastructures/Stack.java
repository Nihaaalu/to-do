package datastructures;

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

    /**
     * Pushes an element onto the stack.
     * Time Complexity: O(1)
     */
    public void push(T data) {
        Node<T> newNode = new Node<>(data);
        newNode.next = top;
        top = newNode;
        size++;
    }

    /**
     * Pops and returns the top element from the stack.
     * Time Complexity: O(1)
     */
    public T pop() {
        if (isEmpty()) {
            throw new java.util.EmptyStackException();
        }
        T data = top.data;
        top = top.next;
        size--;
        return data;
    }

    /**
     * Returns the top element without removing it.
     * Time Complexity: O(1)
     */
    public T peek() {
        if (isEmpty()) {
            throw new java.util.EmptyStackException();
        }
        return top.data;
    }

    public boolean isEmpty() {
        return top == null;
    }

    public int size() {
        return size;
    }

    public void clear() {
        top = null;
        size = 0;
    }
}
