package datastructures;

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
}
