package ui;

import controller.TaskManager;
import model.Task;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.DefaultTableCellRenderer;
import java.awt.*;
import java.awt.event.ActionListener;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Calendar;

/**
 * TaskPanel is the merged Home/Task Dashboard UI view.
 * It contains statistics cards, search/filter controls, and the main task list table.
 */
public class TaskPanel extends JPanel {
    private TaskManager taskManager;
    private MainFrame parentFrame;

    private JTable taskTable;
    private DefaultTableModel tableModel;
    private JTextField searchField;
    private JComboBox<String> searchTypeCombo;
    private JComboBox<String> filterCombo;
    private JComboBox<String> sortCombo;

    private JLabel totalLabel, pendingLabel, completedLabel, highPriorityLabel, overdueLabel;
    private JTextArea recentLogArea;

    private String currentSort = "id";
    private String currentFilter = "All Active";

    public TaskPanel(TaskManager taskManager, MainFrame parentFrame) {
        this.taskManager = taskManager;
        this.parentFrame = parentFrame;

        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(15, 15, 15, 15));
        setBackground(Color.WHITE);

        // --- 1. TOP SECTION: STATS CARDS ROW ---
        JPanel statsPanel = new JPanel(new GridLayout(1, 4, 10, 10));
        statsPanel.setBackground(Color.WHITE);
        statsPanel.setBorder(new EmptyBorder(0, 0, 5, 0));

        totalLabel = new JLabel("0", SwingConstants.CENTER);
        pendingLabel = new JLabel("0", SwingConstants.CENTER);
        highPriorityLabel = new JLabel("0", SwingConstants.CENTER);
        overdueLabel = new JLabel("0", SwingConstants.CENTER);

        statsPanel.add(createMiniStatCard("Total Active", totalLabel, new Color(52, 152, 219)));
        statsPanel.add(createMiniStatCard("Pending", pendingLabel, new Color(241, 196, 15)));
        statsPanel.add(createMiniStatCard("High Priority", highPriorityLabel, new Color(231, 76, 60)));
        statsPanel.add(createMiniStatCard("Overdue", overdueLabel, new Color(155, 89, 182)));

        // --- 2. MIDDLE SECTION: TOOLBAR + TABLE ---
        JPanel centerContainer = new JPanel(new BorderLayout(10, 10));
        centerContainer.setBackground(Color.WHITE);

        // Toolbar Panel - Everything in ONE row
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

        JButton searchButton = new JButton("Find");
        searchButton.setBackground(new Color(52, 152, 219));
        searchButton.setForeground(Color.WHITE);
        searchButton.setFocusPainted(false);
        searchButton.addActionListener(e -> performSearch());

        JButton clearButton = new JButton("Clear");
        clearButton.addActionListener(e -> {
            searchField.setText("");
            refreshTable();
        });

        filterCombo = new JComboBox<>(new String[]{"All Active", "Pending", "Overdue"});
        filterCombo.setPreferredSize(new Dimension(100, 28));
        filterCombo.setMaximumSize(new Dimension(100, 28));
        filterCombo.addActionListener(e -> {
            currentFilter = (String) filterCombo.getSelectedItem();
            refreshTable();
        });

        sortCombo = new JComboBox<>(new String[]{"ID", "Name", "Priority", "Due Date"});
        sortCombo.setPreferredSize(new Dimension(100, 28));
        sortCombo.setMaximumSize(new Dimension(100, 28));
        sortCombo.addActionListener(e -> {
            String selected = (String) sortCombo.getSelectedItem();
            if ("ID".equals(selected)) currentSort = "id";
            else if ("Name".equals(selected)) currentSort = "title";
            else if ("Priority".equals(selected)) currentSort = "priority";
            else if ("Due Date".equals(selected)) currentSort = "duedate";
            refreshTable();
        });

        JButton addTaskButton = new JButton("Add Task");
        addTaskButton.setBackground(new Color(46, 204, 113));
        addTaskButton.setForeground(Color.WHITE);
        addTaskButton.setFont(new Font("Segoe UI", Font.BOLD, 12));
        addTaskButton.setFocusPainted(false);
        addTaskButton.addActionListener(e -> showAddTaskDialog());

        // Assemble toolbar elements with spacers
        toolbarPanel.add(new JLabel("Search: "));
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(searchField);
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(searchTypeCombo);
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(searchButton);
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(clearButton);
        toolbarPanel.add(Box.createHorizontalGlue());

        toolbarPanel.add(new JLabel("Filter: "));
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(filterCombo);
        toolbarPanel.add(Box.createHorizontalStrut(15));

        toolbarPanel.add(new JLabel("Sort by: "));
        toolbarPanel.add(Box.createHorizontalStrut(5));
        toolbarPanel.add(sortCombo);
        toolbarPanel.add(Box.createHorizontalStrut(20));

        toolbarPanel.add(addTaskButton);

        centerContainer.add(toolbarPanel, BorderLayout.NORTH);

        // Task Table Setup
        String[] columns = {"ID", "Task", "Priority", "Category", "Due Date", "Status", "Actions"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int col) {
                return false;
            }
        };

        taskTable = new JTable(tableModel);
        taskTable.setRowHeight(32); // Slightly increased row height
        taskTable.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        taskTable.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 12));
        taskTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        taskTable.setShowGrid(true);
        taskTable.setGridColor(new Color(240, 240, 240));

        // Add custom renderer to handle priority colors, overdue badges, hover effects, and hyperlinks
        taskTable.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                
                // Row hover background rendering
                Integer hoveredRow = (Integer) table.getClientProperty("hoveredRow");
                if (isSelected) {
                    c.setBackground(table.getSelectionBackground());
                    c.setForeground(table.getSelectionForeground());
                } else if (hoveredRow != null && hoveredRow == row) {
                    c.setBackground(new Color(243, 245, 249)); // hover color
                    c.setForeground(Color.BLACK);
                } else {
                    c.setBackground(table.getBackground());
                    c.setForeground(Color.BLACK);
                }

                if (c instanceof JLabel) {
                    JLabel label = (JLabel) c;
                    label.setBorder(BorderFactory.createEmptyBorder(5, 10, 5, 10));
                    label.setHorizontalAlignment(SwingConstants.LEFT);

                    // Priority (Col index 2)
                    if (column == 2) {
                        String priority = (String) value;
                        if ("High".equals(priority)) {
                            label.setForeground(new Color(231, 76, 60)); // Red
                        } else if ("Medium".equals(priority)) {
                            label.setForeground(new Color(230, 126, 34)); // Orange
                        } else {
                            label.setForeground(new Color(46, 204, 113)); // Green
                        }
                        label.setFont(label.getFont().deriveFont(Font.BOLD));
                    }
                    // Status (Col index 5)
                    else if (column == 5) {
                        String status = (String) value;
                        if ("Completed".equals(status)) {
                            label.setForeground(new Color(46, 204, 113));
                        } else {
                            // Calculate if overdue
                            String dueDateStr = (String) table.getValueAt(row, 4);
                            boolean overdue = false;
                            try {
                                SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
                                Date parsedDue = sdf.parse(dueDateStr);
                                Date today = new Date();
                                Calendar cal = Calendar.getInstance();
                                cal.setTime(today);
                                cal.set(Calendar.HOUR_OF_DAY, 0);
                                cal.set(Calendar.MINUTE, 0);
                                cal.set(Calendar.SECOND, 0);
                                cal.set(Calendar.MILLISECOND, 0);
                                if (parsedDue.before(cal.getTime())) {
                                    overdue = true;
                                }
                            } catch (Exception e) {}

                            if (overdue) {
                                label.setForeground(new Color(155, 89, 182)); // Purple
                                label.setText("Overdue");
                            } else {
                                label.setForeground(new Color(241, 196, 15)); // Yellow
                            }
                        }
                        label.setFont(label.getFont().deriveFont(Font.BOLD));
                    }
                    // Actions (Col index 6)
                    else if (column == 6) {
                        label.setText("<html><a href='#'>Complete</a> &nbsp;|&nbsp; <a href='#'>Edit</a> &nbsp;|&nbsp; <a href='#'>Delete</a></html>");
                        label.setHorizontalAlignment(SwingConstants.CENTER);
                        label.setForeground(new Color(52, 152, 219));
                    }
                }
                return c;
            }
        });

        // Set column widths
        taskTable.getColumnModel().getColumn(0).setPreferredWidth(40);  // ID
        taskTable.getColumnModel().getColumn(1).setPreferredWidth(220); // Task
        taskTable.getColumnModel().getColumn(2).setPreferredWidth(80);  // Priority
        taskTable.getColumnModel().getColumn(3).setPreferredWidth(90);  // Category
        taskTable.getColumnModel().getColumn(4).setPreferredWidth(100); // Due Date
        taskTable.getColumnModel().getColumn(5).setPreferredWidth(90);  // Status
        taskTable.getColumnModel().getColumn(6).setPreferredWidth(200); // Actions

        // Mouse listeners to handle hover highlighting and actions column hyperlink clicks
        taskTable.addMouseMotionListener(new java.awt.event.MouseMotionAdapter() {
            private int lastHoveredRow = -1;
            @Override
            public void mouseMoved(java.awt.event.MouseEvent e) {
                int row = taskTable.rowAtPoint(e.getPoint());
                if (row != lastHoveredRow) {
                    lastHoveredRow = row;
                    taskTable.putClientProperty("hoveredRow", row);
                    taskTable.repaint();
                }
            }
        });

        taskTable.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseExited(java.awt.event.MouseEvent e) {
                taskTable.putClientProperty("hoveredRow", -1);
                taskTable.repaint();
            }

            @Override
            public void mouseClicked(java.awt.event.MouseEvent e) {
                int row = taskTable.rowAtPoint(e.getPoint());
                int col = taskTable.columnAtPoint(e.getPoint());
                if (row >= 0 && col == 6) {
                    int cellX = e.getX() - taskTable.getCellRect(row, col, true).x;
                    int cellWidth = taskTable.getCellRect(row, col, true).width;
                    int taskId = (int) taskTable.getValueAt(row, 0);

                    if (cellX < cellWidth / 3) {
                        // Complete
                        taskManager.markComplete(taskId);
                        refreshTable();
                    } else if (cellX < (2 * cellWidth) / 3) {
                        // Edit
                        showEditTaskDialogForRow(taskId);
                    } else {
                        // Delete
                        int confirm = JOptionPane.showConfirmDialog(taskTable, "Are you sure you want to delete Task ID: " + taskId + "?", "Confirm Delete", JOptionPane.YES_NO_OPTION);
                        if (confirm == JOptionPane.YES_OPTION) {
                            taskManager.deleteTask(taskId);
                            refreshTable();
                        }
                    }
                }
            }
        });

        JScrollPane scrollPane = new JScrollPane(taskTable);
        centerContainer.add(scrollPane, BorderLayout.CENTER);

        // Assemble Top Stats + Center Table Container
        JPanel mainDisplayPanel = new JPanel(new BorderLayout(10, 10));
        mainDisplayPanel.setBackground(Color.WHITE);
        mainDisplayPanel.add(statsPanel, BorderLayout.NORTH);
        mainDisplayPanel.add(centerContainer, BorderLayout.CENTER);

        add(mainDisplayPanel, BorderLayout.CENTER);

        // --- 3. BOTTOM SECTION: COLLAPSIBLE PANEL FOR ACTIONS & LOGS ---
        JPanel bottomCollapsePanel = new JPanel(new BorderLayout(5, 5));
        bottomCollapsePanel.setBackground(Color.WHITE);

        JPanel collapseHeader = new JPanel(new BorderLayout());
        collapseHeader.setBackground(new Color(245, 246, 250));
        collapseHeader.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(220, 224, 230), 1),
            BorderFactory.createEmptyBorder(5, 12, 5, 12)
        ));

        JLabel collapseTitle = new JLabel("Activity Logs & Undo Panel (Collapsed)");
        collapseTitle.setFont(new Font("Segoe UI", Font.BOLD, 12));
        collapseTitle.setForeground(new Color(127, 140, 141));
        collapseHeader.add(collapseTitle, BorderLayout.WEST);

        JButton toggleBtn = new JButton("Expand");
        toggleBtn.setFont(new Font("Segoe UI", Font.BOLD, 11));
        collapseHeader.add(toggleBtn, BorderLayout.EAST);

        JPanel collapseContent = new JPanel(new BorderLayout(10, 10));
        collapseContent.setBackground(Color.WHITE);
        collapseContent.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        collapseContent.setVisible(false); // Initially collapsed

        // Undo & DB Operators on left
        JPanel operationsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        operationsPanel.setBackground(Color.WHITE);

        JButton undoBtn = new JButton("Undo Operation");
        undoBtn.setBackground(new Color(52, 73, 94));
        undoBtn.setForeground(Color.WHITE);
        undoBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        undoBtn.setFocusPainted(false);
        undoBtn.addActionListener(e -> performUndo());
        operationsPanel.add(undoBtn);

        JButton saveBtn = new JButton("Save DB");
        saveBtn.setBackground(new Color(52, 152, 219));
        saveBtn.setForeground(Color.WHITE);
        saveBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        saveBtn.addActionListener(e -> performSave());
        operationsPanel.add(saveBtn);

        JButton loadBtn = new JButton("Load DB");
        loadBtn.setBackground(new Color(44, 62, 80));
        loadBtn.setForeground(Color.WHITE);
        loadBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        loadBtn.addActionListener(e -> performLoad());
        operationsPanel.add(loadBtn);

        JButton exitBtn = new JButton("Exit App");
        exitBtn.setBackground(Color.BLACK);
        exitBtn.setForeground(Color.WHITE);
        exitBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        exitBtn.addActionListener(e -> System.exit(0));
        operationsPanel.add(exitBtn);

        collapseContent.add(operationsPanel, BorderLayout.WEST);

        // Recent Logs scrollable panel on right
        recentLogArea = new JTextArea(3, 40);
        recentLogArea.setEditable(false);
        recentLogArea.setFont(new Font("Consolas", Font.PLAIN, 11));
        recentLogArea.setBackground(new Color(250, 250, 250));
        JScrollPane logScroll = new JScrollPane(recentLogArea);
        collapseContent.add(logScroll, BorderLayout.CENTER);

        bottomCollapsePanel.add(collapseHeader, BorderLayout.NORTH);
        bottomCollapsePanel.add(collapseContent, BorderLayout.CENTER);

        toggleBtn.addActionListener(e -> {
            boolean isVisible = collapseContent.isVisible();
            collapseContent.setVisible(!isVisible);
            toggleBtn.setText(!isVisible ? "Collapse" : "Expand");
            collapseTitle.setText(!isVisible ? "Activity Logs & Undo Panel (Expanded)" : "Activity Logs & Undo Panel (Collapsed)");
            bottomCollapsePanel.revalidate();
            bottomCollapsePanel.repaint();
        });

        add(bottomCollapsePanel, BorderLayout.SOUTH);

        refreshTable();
    }

    private JPanel createMiniStatCard(String title, JLabel valueLabel, Color accentColor) {
        JPanel card = new JPanel(new BorderLayout(5, 5)) {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2d = (Graphics2D) g;
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.setColor(getBackground());
                g2d.fillRoundRect(0, 0, getWidth(), getHeight(), 10, 10);
            }
        };
        card.setOpaque(false);
        card.setBackground(new Color(245, 246, 250));
        card.setBorder(new EmptyBorder(10, 15, 10, 15));

        JLabel titleLabel = new JLabel(title, SwingConstants.CENTER);
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        titleLabel.setForeground(new Color(127, 140, 141));

        valueLabel.setFont(new Font("Segoe UI", Font.BOLD, 22));
        valueLabel.setForeground(accentColor);

        card.add(titleLabel, BorderLayout.NORTH);
        card.add(valueLabel, BorderLayout.CENTER);

        return card;
    }

    /**
     * Refreshes stats cards row metrics.
     */
    private void refreshStats() {
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
        String today = sdf.format(new Date());

        int activeCount = 0;
        for (Task t : taskManager.getTasksAsArray()) {
            if (!t.getStatus().equalsIgnoreCase("Completed")) {
                activeCount++;
            }
        }

        totalLabel.setText(String.valueOf(activeCount));
        pendingLabel.setText(String.valueOf(taskManager.getPendingCount()));
        highPriorityLabel.setText(String.valueOf(taskManager.getHighPriorityCount()));
        overdueLabel.setText(String.valueOf(taskManager.getOverdueCount(today)));
    }

    /**
     * Refreshes the scrollable collapsible logs area.
     */
    private void refreshRecentLogs() {
        Object[] history = taskManager.getHistoryLog();
        StringBuilder sb = new StringBuilder();
        if (history == null || history.length == 0) {
            sb.append("[No recent activity logged]");
        } else {
            for (int i = history.length - 1; i >= 0; i--) {
                sb.append("-> ").append(history[i]).append("\n");
            }
        }
        recentLogArea.setText(sb.toString());
    }

    /**
     * Refreshes table contents according to current sorting & filtering configurations.
     */
    private boolean isTaskOverdue(Task t) {
        if ("Completed".equalsIgnoreCase(t.getStatus())) {
            return false;
        }
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            Date parsedDue = sdf.parse(t.getDueDate());
            Date today = new Date();
            Calendar cal = Calendar.getInstance();
            cal.setTime(today);
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            return parsedDue.before(cal.getTime());
        } catch (Exception e) {
            return false;
        }
    }

    public void refreshTable() {
        tableModel.setRowCount(0);

        // Get sorted list of tasks
        Task[] tasks = taskManager.getSortedTasks(currentSort);

        for (Task t : tasks) {
            if (t.getStatus().equalsIgnoreCase("Completed")) {
                continue; // Never show completed tasks on the Home page table
            }

            // Apply filter
            if ("Pending".equalsIgnoreCase(currentFilter) && !t.getStatus().equalsIgnoreCase("Pending")) {
                continue;
            }
            if ("Overdue".equalsIgnoreCase(currentFilter) && !isTaskOverdue(t)) {
                continue;
            }

            tableModel.addRow(new Object[]{
                t.getTaskId(),
                t.getTitle(),
                t.getPriorityString(),
                t.getCategory(),
                t.getDueDate(),
                t.getStatus(),
                ""
            });
        }
        refreshStats();
        refreshRecentLogs();
        parentFrame.refreshDashboardAndLogs();
    }

    private void performSearch() {
        String query = searchField.getText().trim();
        if (query.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please enter a search phrase.", "Empty Search", JOptionPane.WARNING_MESSAGE);
            return;
        }

        Task found = null;
        if (searchTypeCombo.getSelectedIndex() == 1) {
            try {
                int id = Integer.parseInt(query);
                found = taskManager.searchById(id);
            } catch (NumberFormatException e) {
                JOptionPane.showMessageDialog(this, "Task ID must be a number.", "Invalid ID", JOptionPane.ERROR_MESSAGE);
                return;
            }
        } else {
            found = taskManager.searchByTitle(query);
        }

        if (found != null && !found.getStatus().equalsIgnoreCase("Completed")) {
            tableModel.setRowCount(0);
            tableModel.addRow(new Object[]{
                found.getTaskId(),
                found.getTitle(),
                found.getPriorityString(),
                found.getCategory(),
                found.getDueDate(),
                found.getStatus(),
                ""
            });
            JOptionPane.showMessageDialog(this, "Task Found!\n" + found.toString(), "Search Result", JOptionPane.INFORMATION_MESSAGE);
        } else {
            JOptionPane.showMessageDialog(this, "No matching active task found.", "Search Result", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void showAddTaskDialog() {
        JTextField titleF = new JTextField();
        JTextField descF = new JTextField();
        JComboBox<String> priorityCombo = new JComboBox<>(new String[]{"Low", "Medium", "High"});
        JTextField categoryF = new JTextField("Work");
        JTextField dueDateF = new JTextField(new SimpleDateFormat("dd/MM/yyyy").format(new Date()));

        Object[] message = {
            "Task Title:", titleF,
            "Description:", descF,
            "Priority:", priorityCombo,
            "Category:", categoryF,
            "Due Date (dd/MM/yyyy):", dueDateF
        };

        int option = JOptionPane.showConfirmDialog(this, message, "Add New Task", JOptionPane.OK_CANCEL_OPTION);
        if (option == JOptionPane.OK_OPTION) {
            String title = titleF.getText().trim();
            String desc = descF.getText().trim();
            int priority = Task.parsePriority((String) priorityCombo.getSelectedItem());
            String category = categoryF.getText().trim();
            String dueDate = dueDateF.getText().trim();

            if (title.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Title cannot be empty.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            if (!dueDate.matches("\\d{2}/\\d{2}/\\d{4}")) {
                JOptionPane.showMessageDialog(this, "Due Date must be in dd/MM/yyyy format.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            int id = taskManager.getNextAvailableId();
            String createdDate = new SimpleDateFormat("dd/MM/yyyy").format(new Date());
            Task newTask = new Task(id, title, desc, priority, dueDate, "Pending", category, createdDate);

            taskManager.addTask(newTask);
            refreshTable();
        }
    }

    private void showEditTaskDialogForRow(int id) {
        Task target = taskManager.searchById(id);
        if (target == null) return;

        JTextField titleF = new JTextField(target.getTitle());
        JTextField descF = new JTextField(target.getDescription());
        JComboBox<String> priorityCombo = new JComboBox<>(new String[]{"Low", "Medium", "High"});
        priorityCombo.setSelectedItem(target.getPriorityString());
        JTextField categoryF = new JTextField(target.getCategory());
        JTextField dueDateF = new JTextField(target.getDueDate());
        JComboBox<String> statusCombo = new JComboBox<>(new String[]{"Pending", "Completed"});
        statusCombo.setSelectedItem(target.getStatus());

        Object[] message = {
            "Task Title:", titleF,
            "Description:", descF,
            "Priority:", priorityCombo,
            "Category:", categoryF,
            "Due Date (dd/MM/yyyy):", dueDateF,
            "Status:", statusCombo
        };

        int option = JOptionPane.showConfirmDialog(this, message, "Edit Task ID: " + id, JOptionPane.OK_CANCEL_OPTION);
        if (option == JOptionPane.OK_OPTION) {
            String title = titleF.getText().trim();
            String desc = descF.getText().trim();
            int priority = Task.parsePriority((String) priorityCombo.getSelectedItem());
            String category = categoryF.getText().trim();
            String dueDate = dueDateF.getText().trim();
            String status = (String) statusCombo.getSelectedItem();

            if (title.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Title cannot be empty.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            if (!dueDate.matches("\\d{2}/\\d{2}/\\d{4}")) {
                JOptionPane.showMessageDialog(this, "Due Date must be in dd/MM/yyyy format.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            taskManager.editTask(id, title, desc, priority, dueDate, category, status);
            refreshTable();
        }
    }

    private void performUndo() {
        boolean success = taskManager.undo();
        if (success) {
            JOptionPane.showMessageDialog(this, "Last action undone successfully!", "Undo", JOptionPane.INFORMATION_MESSAGE);
            refreshTable();
        } else {
            JOptionPane.showMessageDialog(this, "No actions left to undo.", "Undo Stack Empty", JOptionPane.WARNING_MESSAGE);
        }
    }

    private void performSave() {
        taskManager.saveToFile(null);
        JOptionPane.showMessageDialog(this, "Database saved to disk!", "Save Success", JOptionPane.INFORMATION_MESSAGE);
        refreshRecentLogs();
    }

    private void performLoad() {
        taskManager.loadFromFile(null);
        refreshTable();
        JOptionPane.showMessageDialog(this, "Database loaded from disk!", "Load Success", JOptionPane.INFORMATION_MESSAGE);
    }
}
