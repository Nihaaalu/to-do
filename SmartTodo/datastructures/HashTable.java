package datastructures;

/**
 * A custom implementation of a Hash Table with Separate Chaining for collision handling.
 * Used for O(1) average-time search by Task ID.
 * 
 * Complexity Report:
 * - Space Complexity: O(m + n) where m is the number of buckets and n is the number of items.
 * - Time Complexity:
 *   - insert: O(1) average-time, O(n) worst-case if all items hash to the same bucket.
 *   - delete: O(1) average-time, O(n) worst-case.
 *   - search: O(1) average-time, O(n) worst-case.
 *   - resize: O(n + m) when load factor (> 0.75) is exceeded.
 */
public class HashTable<K, V> {
    
    private static class HashNode<K, V> {
        K key;
        V value;
        HashNode<K, V> next;

        public HashNode(K key, V value) {
            this.key = key;
            this.value = value;
            this.next = null;
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

    public HashTable() {
        this(16);
    }

    private int getBucketIndex(K key) {
        int hashCode = key.hashCode();
        int index = hashCode % capacity;
        return Math.abs(index);
    }

    /**
     * Inserts or updates a key-value pair.
     * Time Complexity: O(1) average
     */
    public void insert(K key, V value) {
        int bucketIndex = getBucketIndex(key);
        HashNode<K, V> head = buckets[bucketIndex];

        // Check if key already exists, if so update value
        HashNode<K, V> current = head;
        while (current != null) {
            if (current.key.equals(key)) {
                current.value = value;
                return;
            }
            current = current.next;
        }

        // Key doesn't exist, insert at head of chain
        HashNode<K, V> newNode = new HashNode<>(key, value);
        newNode.next = buckets[bucketIndex];
        buckets[bucketIndex] = newNode;
        size++;

        // Resize if load factor exceeds threshold
        if ((double) size / capacity >= LOAD_FACTOR_THRESHOLD) {
            resize();
        }
    }

    /**
     * Searches for a key and returns the associated value.
     * Time Complexity: O(1) average
     */
    public V search(K key) {
        int bucketIndex = getBucketIndex(key);
        HashNode<K, V> head = buckets[bucketIndex];

        HashNode<K, V> current = head;
        while (current != null) {
            if (current.key.equals(key)) {
                return current.value;
            }
            current = current.next;
        }
        return null;
    }

    /**
     * Deletes a key-value pair.
     * Time Complexity: O(1) average
     */
    public V delete(K key) {
        int bucketIndex = getBucketIndex(key);
        HashNode<K, V> head = buckets[bucketIndex];
        HashNode<K, V> prev = null;

        HashNode<K, V> current = head;
        while (current != null) {
            if (current.key.equals(key)) {
                if (prev != null) {
                    prev.next = current.next;
                } else {
                    buckets[bucketIndex] = current.next;
                }
                size--;
                return current.value;
            }
            prev = current;
            current = current.next;
        }
        return null;
    }

    /**
     * Dynamically doubles the bucket array size and rehashes all elements.
     * Time Complexity: O(n + m) where n is size, m is capacity.
     */
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

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void clear() {
        capacity = 16;
        buckets = (HashNode<K, V>[]) new HashNode[capacity];
        size = 0;
    }

    /**
     * Debugging helper to list bucket chain lengths.
     */
    public int[] getChainLengths() {
        int[] lengths = new int[capacity];
        for (int i = 0; i < capacity; i++) {
            int len = 0;
            HashNode<K, V> current = buckets[i];
            while (current != null) {
                len++;
                current = current.next;
            }
            lengths[i] = len;
        }
        return lengths;
    }

    public int getCapacity() {
        return capacity;
    }
}
