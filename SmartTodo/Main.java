import ui.MainFrame;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;

/**
 * Main application launcher for the Smart To-Do List (DSA Project).
 * 
 * Complexity Report:
 * - Space Complexity: O(1) for static app bootstrap.
 * - Time Complexity: O(1) GUI thread initialization.
 */
public class Main {
    public static void main(String[] args) {
        // Set modern Look and Feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            System.err.println("Failed to initialize modern OS look and feel: " + e.getMessage());
        }

        // Launch the application window within the Event Dispatch Thread (EDT)
        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
