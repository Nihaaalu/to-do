package algorithms;

import model.Task;

/**
 * A custom implementation of the Merge Sort algorithm for Task sorting.
 * Supports sorting by: Name (Title), Priority, and Due Date.
 * 
 * Complexity Report:
 * - Space Complexity: O(n) auxiliary space for temp arrays.
 * - Time Complexity: O(n log n) in all cases (best, average, worst).
 */
public class MergeSort {

    /**
     * Entry point for sorting an array of tasks.
     * @param array The array of tasks to sort.
     * @param sortBy "title", "priority", or "dueDate".
     */
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

        int i = 0, j = 0;
        int k = left;

        while (i < n1 && j < n2) {
            if (compareTasks(leftArr[i], rightArr[j], sortBy) <= 0) {
                array[k] = leftArr[i];
                i++;
            } else {
                array[k] = rightArr[j];
                j++;
            }
            k++;
        }

        while (i < n1) {
            array[k] = leftArr[i];
            i++;
            k++;
        }

        while (j < n2) {
            array[k] = rightArr[j];
            j++;
            k++;
        }
    }

    /**
     * Compares two tasks based on the specified sorting criteria.
     * Returns negative if t1 < t2, positive if t1 > t2, 0 if equal.
     */
    private static int compareTasks(Task t1, Task t2, String sortBy) {
        switch (sortBy) {
            case "title":
            case "name":
                return t1.getTitle().compareToIgnoreCase(t2.getTitle());
            case "priority":
                // Highest priority first (3 -> 2 -> 1)
                // To sort high priority to low, return t2.priority - t1.priority
                return Integer.compare(t2.getPriority(), t1.getPriority());
            case "duedate":
            case "due date":
                try {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd/MM/yyyy");
                    java.util.Date d1 = sdf.parse(t1.getDueDate());
                    java.util.Date d2 = sdf.parse(t2.getDueDate());
                    return d1.compareTo(d2);
                } catch (Exception e) {
                    return t1.getDueDate().compareTo(t2.getDueDate());
                }
            case "id":
            default:
                return Integer.compare(t1.getTaskId(), t2.getTaskId());
        }
    }
}
