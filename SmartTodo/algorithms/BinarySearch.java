package algorithms;

import model.Task;

/**
 * A custom implementation of the Binary Search algorithm.
 * Searches for tasks inside a pre-sorted array of Task objects.
 * 
 * Complexity Report:
 * - Space Complexity: O(1) iterative binary search.
 * - Time Complexity: O(log n)
 */
public class BinarySearch {

    /**
     * Searches a sorted array of tasks by Task ID.
     * Assumes array is sorted by ID ascending.
     * @return The index of the found task, or -1 if not found.
     */
    public static int searchById(Task[] array, int targetId) {
        int left = 0;
        int right = array.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            int midId = array[mid].getTaskId();

            if (midId == targetId) {
                return mid; // Found!
            } else if (midId < targetId) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1; // Not found
    }

    /**
     * Searches a sorted array of tasks by Title (case-insensitive).
     * Assumes array is sorted by Title ascending.
     * @return The index of the found task, or -1 if not found.
     */
    public static int searchByTitle(Task[] array, String targetTitle) {
        int left = 0;
        int right = array.length - 1;
        String targetLower = targetTitle.toLowerCase();

        while (left <= right) {
            int mid = left + (right - left) / 2;
            String midTitleLower = array[mid].getTitle().toLowerCase();

            int cmp = midTitleLower.compareTo(targetLower);
            if (cmp == 0) {
                return mid; // Found!
            } else if (cmp < 0) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1; // Not found
    }
}
