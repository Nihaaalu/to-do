package controller;

import model.Task;
import datastructures.LinkedList;
import datastructures.Node;
import datastructures.Stack;
import datastructures.Queue;
import datastructures.HashTable;
import datastructures.BinaryHeap;
import algorithms.MergeSort;
import algorithms.BinarySearch;
import storage.FileManager;

/**
 * TaskManager manages the core business logic of the Smart To-Do List application.
 * It coordinates custom data structures and algorithms to fulfill requirements.
 * 
 * Complexity Report:
 * - Space Complexity: O(n + h + k) where n is number of tasks, h is history queue size, and k is undo stack depth.
 * - Time Complexity:
 *   - addTask: O(1) average-time (O(1) list insert, O(1) hash table insert, O(1) stack push)
 *   - deleteTask: O(n) worst-case (O(n) list deletion, O(1) hash table delete)
 *   - editTask: O(n) worst-case (lookup and field assignment)
 *   - searchById: O(1) average-time using custom Hash Table.
 *   - searchByTitle: O(n log n) because we sort using Merge Sort, then O(log n) Binary Search.
 *   - sortTasks: O(n log n) using custom Merge Sort.
 *   - getHighestPriorityTasks: O(n log n) to heapify and extract tasks from custom Binary Heap.
 */
public class TaskManager {

    // Custom Data Structures
    private LinkedList<Task> taskList;
    private HashTable<Integer, Task> idLookupTable;
    private Stack<UndoAction> undoStack;
    private Queue<String> historyLogQueue;

    // Undo action representation
    public static class UndoAction {
        public enum ActionType { ADD, DELETE, EDIT }
        
        public ActionType type;
        public Task task; // State of task at deletion or addition
        public Task oldState; // Previous state (only for EDIT)

        public UndoAction(ActionType type, Task task) {
            this.type = type;
            this.task = task;
        }

        public UndoAction(ActionType type, Task task, Task oldState) {
            this.type = type;
            this.task = task;
            this.oldState = oldState;
        }
    }

    public TaskManager() {
        this.taskList = new LinkedList<>();
        this.idLookupTable = new HashTable<>();
        this.undoStack = new Stack<>();
        this.historyLogQueue = new Queue<>();
    }

    private Task cloneTask(Task t) {
        if (t == null) return null;
        Task cloned = new Task(
            t.getTaskId(),
            t.getTitle(),
            t.getDescription(),
            t.getPriority(),
            t.getDueDate(),
            t.getStatus(),
            t.getCategory(),
            t.getCreatedDate()
        );
        cloned.setCompletedDate(t.getCompletedDate());
        return cloned;
    }

    /**
     * Adds a new task to the list and lookup table.
     * Time Complexity: O(1) average
     */
    public void addTask(Task task) {
        taskList.insert(task);
        idLookupTable.insert(task.getTaskId(), task);
        
        // Push to undo stack
        undoStack.push(new UndoAction(UndoAction.ActionType.ADD, cloneTask(task)));
        
        logHistory("Added Task [ID: " + task.getTaskId() + "] \"" + task.getTitle() + "\"");
    }

    /**
     * Deletes a task by ID.
     * Time Complexity: O(n) worst-case
     */
    public boolean deleteTask(int taskId) {
        Task taskToDelete = idLookupTable.search(taskId);
        if (taskToDelete == null) return false;

        // Remove from primary list
        taskList.delete(taskToDelete);
        
        // Remove from hash table
        idLookupTable.delete(taskId);

        // Push to undo stack
        undoStack.push(new UndoAction(UndoAction.ActionType.DELETE, cloneTask(taskToDelete)));

        logHistory("Deleted Task [ID: " + taskId + "] \"" + taskToDelete.getTitle() + "\"");
        return true;
    }

    /**
     * Modifies an existing task.
     * Time Complexity: O(n) worst-case due to reference lookup in the linked list
     */
    public boolean editTask(int taskId, String newTitle, String newDesc, int newPriority, String newDueDate, String newCategory, String newStatus) {
        Task target = idLookupTable.search(taskId);
        if (target == null) return false;

        // Keep a copy of old state for undo
        Task oldState = cloneTask(target);

        // Update fields
        target.setTitle(newTitle);
        target.setDescription(newDesc);
        target.setPriority(newPriority);
        target.setDueDate(newDueDate);
        target.setCategory(newCategory);
        target.setStatus(newStatus);

        // Push to undo stack
        undoStack.push(new UndoAction(UndoAction.ActionType.EDIT, cloneTask(target), oldState));

        logHistory("Edited Task [ID: " + taskId + "] \"" + target.getTitle() + "\"");
        return true;
    }

    /**
     * Marks a task as completed.
     * Time Complexity: O(1) average (via fast Hash Table lookup)
     */
    public boolean markComplete(int taskId) {
        Task task = idLookupTable.search(taskId);
        if (task == null) return false;

        if (task.getStatus().equals("Completed")) return true; // Already completed

        // Save state for undo
        Task oldState = cloneTask(task);
        task.setStatus("Completed");
        task.setCompletedDate(new java.text.SimpleDateFormat("dd/MM/yyyy").format(new java.util.Date()));

        undoStack.push(new UndoAction(UndoAction.ActionType.EDIT, cloneTask(task), oldState));
        logHistory("Completed Task [ID: " + taskId + "] \"" + task.getTitle() + "\"");
        return true;
    }

    /**
     * Undoes the last action performed.
     * Time Complexity: O(n) worst-case if adding/deleting elements
     */
    public boolean undo() {
        if (undoStack.isEmpty()) return false;

        UndoAction action = undoStack.pop();
        switch (action.type) {
            case ADD:
                // Undo an add -> Delete the task
                taskList.delete(action.task);
                idLookupTable.delete(action.task.getTaskId());
                logHistory("Undid add of Task [ID: " + action.task.getTaskId() + "]");
                break;
                
            case DELETE:
                // Undo a delete -> Insert the task back
                taskList.insert(action.task);
                idLookupTable.insert(action.task.getTaskId(), action.task);
                logHistory("Undid deletion of Task [ID: " + action.task.getTaskId() + "]");
                break;
                
            case EDIT:
                // Undo an edit -> Revert to oldState
                Task current = idLookupTable.search(action.task.getTaskId());
                if (current != null) {
                    current.setTitle(action.oldState.getTitle());
                    current.setDescription(action.oldState.getDescription());
                    current.setPriority(action.oldState.getPriority());
                    current.setDueDate(action.oldState.getDueDate());
                    current.setCategory(action.oldState.getCategory());
                    current.setStatus(action.oldState.getStatus());
                    current.setCompletedDate(action.oldState.getCompletedDate());
                    logHistory("Undid edits on Task [ID: " + action.task.getTaskId() + "]");
                }
                break;
        }
        return true;
    }

    /**
     * Fast search by Task ID using the custom Hash Table.
     * Time Complexity: O(1) average
     */
    public Task searchById(int taskId) {
        return idLookupTable.search(taskId);
    }

    /**
     * Search by Title using Merge Sort and Binary Search.
     * Demonstrates combining custom algorithms.
     * Time Complexity: O(n log n) due to sorting, then O(log n) for searching.
     */
    public Task searchByTitle(String title) {
        Task[] sortedArray = getTasksAsArray();
        if (sortedArray.length == 0) return null;

        // Sort by title first so we can binary search
        MergeSort.sort(sortedArray, "title");

        int index = BinarySearch.searchByTitle(sortedArray, title);
        if (index != -1) {
            return sortedArray[index];
        }
        return null;
    }

    /**
     * Sorts and returns tasks as an array.
     * Time Complexity: O(n log n)
     */
    public Task[] getSortedTasks(String sortBy) {
        Task[] array = getTasksAsArray();
        MergeSort.sort(array, sortBy);
        return array;
    }

    /**
     * Gets a sorted array of high-priority tasks using the custom Binary Heap (Max-Heap).
     * Time Complexity: O(n log n)
     */
    public Task[] getHighestPriorityTasks() {
        Task[] allTasks = getTasksAsArray();
        
        // Count pending tasks
        int pendingCount = 0;
        for (Task t : allTasks) {
            if (t.getStatus().equalsIgnoreCase("Pending")) {
                pendingCount++;
            }
        }

        Task[] pendingTasks = new Task[pendingCount];
        int idx = 0;
        for (Task t : allTasks) {
            if (t.getStatus().equalsIgnoreCase("Pending")) {
                pendingTasks[idx++] = t;
            }
        }

        // Build Heap
        BinaryHeap heap = new BinaryHeap(pendingCount + 5);
        heap.buildHeap(pendingTasks);

        // Extract sorted priority list
        Task[] priorityList = new Task[pendingCount];
        int i = 0;
        while (!heap.isEmpty()) {
            priorityList[i++] = heap.removeMax();
        }

        return priorityList;
    }

    /**
     * Converts custom linked list to standard array.
     * Time Complexity: O(n)
     */
    public Task[] getTasksAsArray() {
        Task[] array = new Task[taskList.size()];
        for (int i = 0; i < taskList.size(); i++) {
            array[i] = taskList.get(i);
        }
        return array;
    }

    /**
     * Logs action message in Queue. Keep history to max 50 items.
     * Time Complexity: O(1)
     */
    public void logHistory(String event) {
        historyLogQueue.enqueue(event);
        if (historyLogQueue.size() > 50) {
            historyLogQueue.dequeue(); // Keep history size bounded
        }
    }

    public Object[] getHistoryLog() {
        return historyLogQueue.toArray();
    }

    /**
     * Save all tasks to persistent disk file.
     * Time Complexity: O(n)
     */
    public void saveToFile(String filePath) {
        FileManager.saveTasks(taskList, filePath);
    }

    /**
     * Load tasks from persistent disk file. Re-initializes LinkedList and HashTable.
     * Time Complexity: O(n)
     */
    public void loadFromFile(String filePath) {
        this.taskList = FileManager.loadTasks(filePath);
        
        // Rebuild ID lookup table
        this.idLookupTable.clear();
        Node<Task> current = taskList.getHead();
        while (current != null) {
            idLookupTable.insert(current.data.getTaskId(), current.data);
            current = current.next;
        }
        logHistory("Loaded tasks database from disk.");
    }

    public int getNextAvailableId() {
        int maxId = 0;
        Node<Task> current = taskList.getHead();
        while (current != null) {
            if (current.data.getTaskId() > maxId) {
                maxId = current.data.getTaskId();
            }
            current = current.next;
        }
        return maxId + 1;
    }

    // Statistics methods
    public int getTotalCount() { return taskList.size(); }
    
    public int getPendingCount() {
        int count = 0;
        Node<Task> curr = taskList.getHead();
        while (curr != null) {
            if (curr.data.getStatus().equalsIgnoreCase("Pending")) count++;
            curr = curr.next;
        }
        return count;
    }

    public int getCompletedCount() {
        int count = 0;
        Node<Task> curr = taskList.getHead();
        while (curr != null) {
            if (curr.data.getStatus().equalsIgnoreCase("Completed")) count++;
            curr = curr.next;
        }
        return count;
    }

    public int getHighPriorityCount() {
        int count = 0;
        Node<Task> curr = taskList.getHead();
        while (curr != null) {
            if (curr.data.getPriority() == 3 && curr.data.getStatus().equalsIgnoreCase("Pending")) count++;
            curr = curr.next;
        }
        return count;
    }

    public int getOverdueCount(String todayDate) {
        int count = 0;
        Node<Task> curr = taskList.getHead();
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd/MM/yyyy");
        try {
            java.util.Date todayParsed = sdf.parse(todayDate);
            while (curr != null) {
                Task t = curr.data;
                if (t.getStatus().equalsIgnoreCase("Pending")) {
                    try {
                        java.util.Date dueDateParsed = sdf.parse(t.getDueDate());
                        if (dueDateParsed.before(todayParsed)) {
                            count++;
                        }
                    } catch (Exception e) {
                        // ignore malformed
                    }
                }
                curr = curr.next;
            }
        } catch (Exception e) {
            // ignore
        }
        return count;
    }

    public LinkedList<Task> getRawTaskList() {
        return taskList;
    }
}
