const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const taskController = {
  // POST /tasks
  createTask: async (req, res) => {
    console.log('POST /tasks called with body:', req.body);
    try {
      const { title, description, priority, due_date, user_id } = req.body;
      if (!title || !user_id) return res.status(400).json({ success: false, error: 'title and user_id are required' });
      const result = await pool.query(
        `INSERT INTO tasks (title, description, priority, due_date, user_id, completed, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW()) RETURNING *`,
        [title, description || null, priority || 'medium', due_date || null, user_id]
      );
      res.status(201).json({ success: true, task: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create task', details: error.message });
    }
  },

  // GET /tasks?user_id=...
  getTasks: async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ success: false, error: 'user_id is required' });
      const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
      res.json({ success: true, tasks: result.rows, total: result.rows.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch tasks', details: error.message });
    }
  },

  // PATCH /tasks/:id
  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, completed, priority, due_date } = req.body;
      const result = await pool.query(
        `UPDATE tasks SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          completed = COALESCE($3, completed),
          priority = COALESCE($4, priority),
          due_date = COALESCE($5, due_date),
          updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, description, completed, priority, due_date, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
      res.json({ success: true, task: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update task', details: error.message });
    }
  },

  // DELETE /tasks/:id
  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete task', details: error.message });
    }
  },
};

module.exports = taskController;
