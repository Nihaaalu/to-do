package model;

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
    private String completedDate = "";

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

    public String getCompletedDate() { return completedDate; }
    public void setCompletedDate(String completedDate) { this.completedDate = completedDate; }

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

    /**
     * Converts a string priority back to its integer representation.
     */
    public static int parsePriority(String priorityStr) {
        if (priorityStr == null) return 1;
        switch (priorityStr.trim().toLowerCase()) {
            case "high": return 3;
            case "medium": return 2;
            case "low":
            default: return 1;
        }
    }
}
