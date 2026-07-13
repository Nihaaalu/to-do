package ui;

import controller.TaskManager;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

/**
 * MainFrame coordinates the entire application window structure, side navigation, and panel swapping.
 * 
 * Complexity Report:
 * - Space Complexity: O(1) for fixed UI panel structures.
 * - Time Complexity: O(1) button swap routing.
 */
public class MainFrame extends JFrame {
    private TaskManager taskManager;

    private CardLayout cardLayout;
    private JPanel centerCardPanel;

    // View Panels
    private TaskPanel taskPanel;
    private CompletedPanel completedPanel;
    private PriorityPanel priorityPanel;
    private HistoryPanel historyPanel;

    public MainFrame() {
        // Initialize Core Logic
        this.taskManager = new TaskManager();
        
        // Attempt to load any default saved database on startup
        this.taskManager.loadFromFile(null);

        // Window configuration
        setTitle("Smart To-Do List");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1100, 780);
        setMinimumSize(new Dimension(950, 650));
        setLocationRelativeTo(null); // Center window
        setLayout(new BorderLayout());

        // --- LEFT NAVIGATION PANEL ---
        JPanel leftNavPanel = new JPanel();
        leftNavPanel.setLayout(new BoxLayout(leftNavPanel, BoxLayout.Y_AXIS));
        leftNavPanel.setBackground(new Color(44, 62, 80));
        leftNavPanel.setPreferredSize(new Dimension(220, 0));
        leftNavPanel.setBorder(new EmptyBorder(25, 15, 25, 15));

        // Application Logo Text
        JLabel appTitleLabel = new JLabel("Smart Todo");
        appTitleLabel.setFont(new Font("Segoe UI", Font.BOLD, 22));
        appTitleLabel.setForeground(Color.WHITE);
        appTitleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        
        JLabel appSubtitleLabel = new JLabel("DSA Core Engine");
        appSubtitleLabel.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        appSubtitleLabel.setForeground(new Color(149, 165, 166));
        appSubtitleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);

        leftNavPanel.add(appTitleLabel);
        leftNavPanel.add(appSubtitleLabel);
        leftNavPanel.add(Box.createVerticalStrut(40));

        // Navigation Buttons
        cardLayout = new CardLayout();
        centerCardPanel = new JPanel(cardLayout);

        addNavButton("Home", "Tasks", leftNavPanel);
        addNavButton("Completed List", "Completed", leftNavPanel);
        addNavButton("Priority Heap", "Priority", leftNavPanel);
        addNavButton("Action Logs", "History", leftNavPanel);

        leftNavPanel.add(Box.createVerticalGlue());

        add(leftNavPanel, BorderLayout.WEST);

        // --- CENTER CARD VIEWPORT ---
        taskPanel = new TaskPanel(taskManager, this);
        completedPanel = new CompletedPanel(taskManager);
        priorityPanel = new PriorityPanel(taskManager);
        historyPanel = new HistoryPanel(taskManager);

        centerCardPanel.add(taskPanel, "Tasks");
        centerCardPanel.add(completedPanel, "Completed");
        centerCardPanel.add(priorityPanel, "Priority");
        centerCardPanel.add(historyPanel, "History");

        add(centerCardPanel, BorderLayout.CENTER);

        // Show default panel
        cardLayout.show(centerCardPanel, "Tasks");
    }

    private void addNavButton(String label, String cardName, JPanel navPanel) {
        JButton btn = new JButton(label);
        btn.setMaximumSize(new Dimension(190, 40));
        btn.setPreferredSize(new Dimension(190, 40));
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(Color.WHITE);
        btn.setBackground(new Color(52, 73, 94));
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setAlignmentX(Component.CENTER_ALIGNMENT);

        btn.addActionListener(e -> {
            cardLayout.show(centerCardPanel, cardName);
            // Refresh swapped components dynamically
            if ("Tasks".equals(cardName)) taskPanel.refreshTable();
            else if ("Completed".equals(cardName)) completedPanel.refresh();
            else if ("Priority".equals(cardName)) priorityPanel.refresh();
            else if ("History".equals(cardName)) historyPanel.refresh();
        });

        navPanel.add(btn);
        navPanel.add(Box.createVerticalStrut(12));
    }

    /**
     * Updates dependent stats views. Called by TaskPanel during updates.
     */
    public void refreshDashboardAndLogs() {
        completedPanel.refresh();
        priorityPanel.refresh();
        historyPanel.refresh();
    }
}
