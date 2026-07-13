package ui;

import controller.TaskManager;
import model.Task;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;

/**
 * CompletedPanel shows a table containing completed tasks with search and filtering.
 */
public class CompletedPanel extends JPanel {
    private TaskManager taskManager;
    private JTable completedTable;
    private DefaultTableModel tableModel;
    
    private JTextField searchField;
    private JComboBox<String> searchTypeCombo;
    private JComboBox<String> priorityFilterCombo;
    private JLabel countLabel;

    public CompletedPanel(TaskManager taskManager) {
        this.taskManager = taskManager;
        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(15, 15, 15, 15));
        setBackground(Color.WHITE);

        // --- TOP PANEL: TITLE AND COUNT ---
        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.setBackground(Color.WHITE);

        JLabel titleLabel = new JLabel("Completed Archive");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 22));
        titleLabel.setForeground(new Color(46, 204, 113));
        topPanel.add(titleLabel, BorderLayout.WEST);

        countLabel = new JLabel("Completed : 0");
        countLabel.setFont(new Font("Segoe UI", Font.BOLD, 14));
        countLabel.setForeground(new Color(127, 140, 141));
        topPanel.add(countLabel, BorderLayout.EAST);

        // --- TOOLBAR PANEL: SEARCH & FILTER ---
        JPanel toolbarPanel = new JPanel();
        toolbarPanel.setLayout(new BoxLayout(toolbarPanel, BoxLayout.X_AXIS));
        toolbarPanel.setBackground(Color.WHITE);
        toolbarPanel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createMatteBorder(0, 0, 1, 0, new Color(230, 230, 230)),
            BorderFactory.createEmptyBorder(5, 5, 10, 5)
        ));

        searchField = new JTextField();
        searchField.setPreferredSize(new Dimension(140, 28));
        searchField.setMaximumSize(new Dimension(140, 28));
        searchTypeCombo = new JComboBox<>(new String[]{"By Name", "By Task ID"});
        searchTypeCombo.setPreferredSize(new Dimension(100, 28));
        searchTypeCombo.setMaximumSize(new Dimension(100, 28));

        JButton findBtn = new JButton("Find");
        findBtn.setBackground(new Color(52, 152, 219));
        findBtn.setForeground(Color.WHITE);
        findBtn.setFocusPainted(false);
        findBtn.addActionListener(e -> refresh());

        JButton clearBtn = new JButton("Clear");
        clearBtn.addActionListener(e -> {
            searchField.setText("");
            refresh();
        });

        priorityFilterCombo = new JComboBox<>(new String[]{"All Priorities", "High", "Medium", "Low"});
        priorityFilterCombo.setPreferredSize(new Dimension(120, 28));
        priorityFilterCombo.setMaximumSize(new Dimension(120, 28));
        priorityFilterCombo.addActionListener(e -> refresh());

        toolbarPanel.add(new JLabel("Search: "));
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(searchField);
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(searchTypeCombo);
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(findBtn);
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(clearBtn);
        toolbarPanel.add(Box.createHorizontalGlue());

        toolbarPanel.add(new JLabel("Priority Filter: "));
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(priorityFilterCombo);

        JPanel headerContainer = new JPanel(new BorderLayout(5, 5));
        headerContainer.setBackground(Color.WHITE);
        headerContainer.add(topPanel, BorderLayout.NORTH);
        headerContainer.add(toolbarPanel, BorderLayout.SOUTH);

        add(headerContainer, BorderLayout.NORTH);

        // Columns definition
        String[] columns = {"ID", "Title", "Category", "Priority", "Completed Date"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        completedTable = new JTable(tableModel);
        completedTable.setRowHeight(28);
        completedTable.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 12));
        completedTable.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        completedTable.setShowGrid(true);
        completedTable.setGridColor(new Color(240, 240, 240));

        JScrollPane scrollPane = new JScrollPane(completedTable);
        add(scrollPane, BorderLayout.CENTER);

        refresh();
    }

    /**
     * Rebuilds the completed list from the TaskManager with search and filter applied.
     */
    public void refresh() {
        if (tableModel == null) return;
        tableModel.setRowCount(0);

        String query = searchField != null ? searchField.getText().trim().toLowerCase() : "";
        int searchType = searchTypeCombo != null ? searchTypeCombo.getSelectedIndex() : 0; // 0 = name, 1 = id
        String priorityFilter = priorityFilterCombo != null ? (String) priorityFilterCombo.getSelectedItem() : "All Priorities";

        Task[] allTasks = taskManager.getTasksAsArray();
        int completedCount = 0;
        int displayedCount = 0;

        for (Task t : allTasks) {
            if (t.getStatus().equalsIgnoreCase("Completed")) {
                completedCount++;

                // Apply priority filter
                if (!priorityFilter.equalsIgnoreCase("All Priorities") && !t.getPriorityString().equalsIgnoreCase(priorityFilter)) {
                    continue;
                }

                // Apply search
                if (!query.isEmpty()) {
                    if (searchType == 1) { // By ID
                        if (!String.valueOf(t.getTaskId()).equals(query)) {
                            continue;
                        }
                    } else { // By Name
                        if (!t.getTitle().toLowerCase().contains(query)) {
                            continue;
                        }
                    }
                }

                String compDate = t.getCompletedDate();
                if (compDate == null || compDate.isEmpty()) {
                    compDate = t.getDueDate(); // Fallback
                }

                tableModel.addRow(new Object[]{
                    t.getTaskId(),
                    t.getTitle(),
                    t.getCategory(),
                    t.getPriorityString(),
                    compDate
                });
                displayedCount++;
            }
        }

        if (countLabel != null) {
            countLabel.setText("Completed : " + completedCount);
        }
    }
}
