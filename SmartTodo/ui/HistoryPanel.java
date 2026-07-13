package ui;

import controller.TaskManager;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

/**
 * HistoryPanel displays a simple list of recently executed actions from the custom History Queue.
 * 
 * Complexity Report:
 * - Space Complexity: O(h) where h is number of log messages in queue.
 * - Time Complexity: O(h) to extract and render list elements.
 */
public class HistoryPanel extends JPanel {
    private TaskManager taskManager;
    private JList<String> historyList;
    private DefaultListModel<String> listModel;

    public HistoryPanel(TaskManager taskManager) {
        this.taskManager = taskManager;
        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(20, 20, 20, 20));
        setBackground(Color.WHITE);

        // Header
        JLabel titleLabel = new JLabel("Completed Action History Log (FIFO Queue)");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 22));
        titleLabel.setForeground(new Color(52, 73, 94));
        add(titleLabel, BorderLayout.NORTH);

        // List
        listModel = new DefaultListModel<>();
        historyList = new JList<>(listModel);
        historyList.setFont(new Font("Consolas", Font.PLAIN, 12));
        historyList.setFixedCellHeight(24);
        
        JScrollPane scrollPane = new JScrollPane(historyList);
        add(scrollPane, BorderLayout.CENTER);

        // Description
        JTextArea descLabel = new JTextArea("This view demonstrates the custom Queue data structure. Recent edits, additions, and deletions are enqueued (FIFO) and displayed here in real time.");
        descLabel.setFont(new Font("Segoe UI", Font.ITALIC, 12));
        descLabel.setForeground(Color.GRAY);
        descLabel.setWrapStyleWord(true);
        descLabel.setLineWrap(true);
        descLabel.setEditable(false);
        descLabel.setBackground(null);
        add(descLabel, BorderLayout.SOUTH);

        refresh();
    }

    /**
     * Refreshes the queue representation.
     * Time Complexity: O(h)
     */
    public void refresh() {
        listModel.clear();
        Object[] history = taskManager.getHistoryLog();
        for (int i = history.length - 1; i >= 0; i--) { // Show newest first
            listModel.addElement((String) history[i]);
        }
    }
}
