const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Changed from DATABASE_URL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get all tasks for a user
exports.getTasks = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id is required' 
      });
    }

    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    res.json({ 
      success: true, 
      tasks: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tasks',
      details: error.message 
    });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { user_id, title, description, category, priority } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id and title are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, category, priority) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, title, description || '', category || 'general', priority || 'medium']
    );

    res.status(201).json({ 
      success: true, 
      task: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create task',
      details: error.message 
    });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, category, priority } = req.body;

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           completed = COALESCE($3, completed),
           category = COALESCE($4, category),
           priority = COALESCE($5, priority),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, description, completed, category, priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    res.json({ 
      success: true, 
      task: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update task',
      details: error.message 
    });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete task',
      details: error.message 
    });
  }
};
