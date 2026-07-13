package ui;

import controller.TaskManager;
import model.Task;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;

/**
 * PriorityPanel displays the tasks sorted by their priority using the custom Binary Heap (Max-Heap).
 * Includes an interactive demonstration of extracting the maximum priority task in O(log n) time.
 * 
 * Complexity Report:
 * - Space Complexity: O(n) to store priority heap states in memory.
 * - Time Complexity:
 *   - Displaying list: O(n log n) heap build and extraction.
 *   - Extract Max operation: O(log n) heap sift-down.
 */
public class PriorityPanel extends JPanel {
    private TaskManager taskManager;
    private JTable heapTable;
    private DefaultTableModel tableModel;
    private JLabel maxTaskLabel;

    public PriorityPanel(TaskManager taskManager) {
        this.taskManager = taskManager;
        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(20, 20, 20, 20));
        setBackground(Color.WHITE);

        // Header Title
        JPanel headerPanel = new JPanel(new GridLayout(2, 1, 5, 5));
        headerPanel.setBackground(null);
        JLabel titleLabel = new JLabel("High Priority Agenda (Binary Max-Heap)");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 22));
        titleLabel.setForeground(new Color(231, 76, 60));
        headerPanel.add(titleLabel);

        JLabel subtitle = new JLabel("Tasks are organized dynamically using a custom Binary Heap structure based on Priority (3=High, 2=Medium, 1=Low).");
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        subtitle.setForeground(Color.GRAY);
        headerPanel.add(subtitle);
        
        add(headerPanel, BorderLayout.NORTH);

        // Center Table showing Heap Extraction order
        String[] columns = {"Heap Position", "ID", "Title", "Priority", "Category", "Due Date"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int col) {
                return false;
            }
        };

        heapTable = new JTable(tableModel);
        heapTable.setRowHeight(25);
        heapTable.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        heapTable.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 12));

        JScrollPane scrollPane = new JScrollPane(heapTable);
        add(scrollPane, BorderLayout.CENTER);

        // Footer Interactive Demonstrator Panel
        JPanel demoPanel = new JPanel(new BorderLayout(10, 10));
        demoPanel.setBackground(new Color(254, 242, 242));
        demoPanel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(252, 165, 165), 1),
            new EmptyBorder(15, 15, 15, 15)
        ));

        JLabel demoTitle = new JLabel("Binary Heap Operator");
        demoTitle.setFont(new Font("Segoe UI", Font.BOLD, 14));
        demoTitle.setForeground(new Color(153, 27, 27));
        demoPanel.add(demoTitle, BorderLayout.NORTH);

        maxTaskLabel = new JLabel("Highest Priority Task: [None Loaded]");
        maxTaskLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        maxTaskLabel.setForeground(new Color(31, 41, 55));
        demoPanel.add(maxTaskLabel, BorderLayout.CENTER);

        JButton extractButton = new JButton("Extract Max Priority Task (O(log n))");
        extractButton.setBackground(new Color(239, 68, 68));
        extractButton.setForeground(Color.WHITE);
        extractButton.setFont(new Font("Segoe UI", Font.BOLD, 12));
        extractButton.setFocusPainted(false);
        extractButton.addActionListener(e -> performExtractMax());
        demoPanel.add(extractButton, BorderLayout.EAST);

        add(demoPanel, BorderLayout.SOUTH);

        refresh();
    }

    /**
     * Refreshes the display of highest priority tasks using the Custom Binary Heap.
     * Time Complexity: O(n log n)
     */
    public void refresh() {
        tableModel.setRowCount(0);

        // Get priority-extracted order using BinaryHeap
        Task[] sortedByPriority = taskManager.getHighestPriorityTasks();

        if (sortedByPriority.length > 0) {
            maxTaskLabel.setText("Highest Priority Task: [ID " + sortedByPriority[0].getTaskId() + "] \"" + 
                                  sortedByPriority[0].getTitle() + "\" (Priority: " + sortedByPriority[0].getPriorityString() + ")");
        } else {
            maxTaskLabel.setText("Highest Priority Task: [None]");
        }

        for (int i = 0; i < sortedByPriority.length; i++) {
            Task t = sortedByPriority[i];
            tableModel.addRow(new Object[]{
                "Root Index #" + i,
                t.getTaskId(),
                t.getTitle(),
                t.getPriorityString(),
                t.getCategory(),
                t.getDueDate()
            });
        }
    }

    private void performExtractMax() {
        Task[] pending = taskManager.getHighestPriorityTasks();
        if (pending.length == 0) {
            JOptionPane.showMessageDialog(this, "No pending tasks remaining to extract from Heap.", "Heap Empty", JOptionPane.WARNING_MESSAGE);
            return;
        }

        Task max = pending[0];
        int confirm = JOptionPane.showConfirmDialog(this, 
            "Extracting Root Task:\n" +
            "ID: " + max.getTaskId() + "\n" +
            "Title: \"" + max.getTitle() + "\"\n" +
            "Priority: " + max.getPriorityString() + "\n\n" +
            "Mark this task as Completed and trigger heapify-down?", 
            "Extract Max (O(log n))", 
            JOptionPane.YES_NO_OPTION
        );

        if (confirm == JOptionPane.YES_OPTION) {
            taskManager.markComplete(max.getTaskId());
            refresh();
        }
    }
}
