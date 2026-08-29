const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const db = new Database(path.join(__dirname, 'tasks.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT id, text, done FROM tasks ORDER BY id').all();
  res.json(tasks.map(t => ({ ...t, done: !!t.done })));
});

app.post('/api/tasks', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });
  const info = db.prepare('INSERT INTO tasks (text, done) VALUES (?, 0)').run(text);
  res.status(201).json({ id: info.lastInsertRowid, text, done: false });
});

app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const done = !!req.body.done;
  const result = db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, id);
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ id, done });
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.status(204).end();
});

app.delete('/api/tasks', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE done = 1').run();
  res.status(204).end();
});

const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Todo API running on http://127.0.0.1:${PORT}`);
});
