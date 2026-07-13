package storage;

import model.Task;
import datastructures.LinkedList;
import datastructures.Node;
import java.io.*;

/**
 * Custom File Manager to load and save tasks using a robust flat-file text storage format.
 * Fields are serialized as pipe-separated values (|) to avoid dependency on external JSON libraries.
 * 
 * Serialization format:
 * taskId|title|description|priority|dueDate|status|category|createdDate
 * 
 * Complexity Report:
 * - Space Complexity: O(n) to construct the loaded tasks list or read lines.
 * - Time Complexity:
 *   - saveTasks: O(n) to traverse the linked list and write to file.
 *   - loadTasks: O(n) to read lines from disk and parse.
 */
public class FileManager {

    private static final String DEFAULT_FILE_NAME = "tasks_db.txt";

    /**
     * Saves all tasks from the custom LinkedList to a flat file.
     * Time Complexity: O(n)
     */
    public static void saveTasks(LinkedList<Task> taskList, String filePath) {
        String path = (filePath == null || filePath.isEmpty()) ? DEFAULT_FILE_NAME : filePath;
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(path))) {
            Node<Task> current = taskList.getHead();
            while (current != null) {
                Task t = current.data;
                // Escape any potential pipe characters in user text to prevent corrupt entries
                String titleEscaped = t.getTitle().replace("|", "~~PIPE~~");
                String descEscaped = t.getDescription().replace("|", "~~PIPE~~");
                String catEscaped = t.getCategory().replace("|", "~~PIPE~~");

                String line = String.format("%d|%s|%s|%d|%s|%s|%s|%s|%s",
                    t.getTaskId(),
                    titleEscaped,
                    descEscaped,
                    t.getPriority(),
                    t.getDueDate(),
                    t.getStatus(),
                    catEscaped,
                    t.getCreatedDate(),
                    t.getCompletedDate() == null ? "" : t.getCompletedDate()
                );
                writer.write(line);
                writer.newLine();
                current = current.next;
            }
        } catch (IOException e) {
            System.err.println("Error saving tasks to " + path + ": " + e.getMessage());
        }
    }

    /**
     * Loads tasks from the flat file into a custom LinkedList.
     * Time Complexity: O(n)
     */
    public static LinkedList<Task> loadTasks(String filePath) {
        String path = (filePath == null || filePath.isEmpty()) ? DEFAULT_FILE_NAME : filePath;
        LinkedList<Task> taskList = new LinkedList<>();
        File file = new File(path);
        
        if (!file.exists()) {
            return taskList; // Return empty list if database file doesn't exist yet
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                
                String[] parts = line.split("\\|", -1);
                if (parts.length < 8) {
                    System.err.println("Skipping corrupted line: " + line);
                    continue; // Skip invalid entries
                }

                try {
                    int taskId = Integer.parseInt(parts[0]);
                    String title = parts[1].replace("~~PIPE~~", "|");
                    String description = parts[2].replace("~~PIPE~~", "|");
                    int priority = Integer.parseInt(parts[3]);
                    String dueDate = parts[4];
                    String status = parts[5];
                    String category = parts[6].replace("~~PIPE~~", "|");
                    String createdDate = parts[7];
                    String completedDate = "";
                    if (parts.length >= 9) {
                        completedDate = parts[8];
                    }

                    Task task = new Task(taskId, title, description, priority, dueDate, status, category, createdDate);
                    task.setCompletedDate(completedDate);
                    taskList.insert(task);
                } catch (NumberFormatException e) {
                    System.err.println("Error parsing number fields in line: " + line);
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading tasks from " + path + ": " + e.getMessage());
        }
        return taskList;
    }
}
