import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

app.use(express.json({ limit: '10mb' }));

// API endpoint to retrieve all tasks from tasks.json
app.get('/api/tasks', (req, res) => {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      // Create empty tasks file if it does not exist
      fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return res.json([]);
    }
    const rawData = fs.readFileSync(TASKS_FILE, 'utf-8');
    const tasks = JSON.parse(rawData || '[]');
    res.json(tasks);
  } catch (err) {
    console.error('Error loading tasks:', err);
    res.status(500).json({ error: 'Failed to load tasks from local storage' });
  }
});

// API endpoint to save tasks immediately to tasks.json
app.post('/api/tasks', (req, res) => {
  try {
    const tasks = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Data must be an array of tasks' });
    }
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving tasks:', err);
    res.status(500).json({ error: 'Failed to persist tasks to tasks.json' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
