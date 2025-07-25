const taskService = require('../services/taskService');

const taskController = {
  // POST /tasks
  createTask: async (req, res) => {
    console.log('POST /tasks called with body:', req.body);
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // GET /tasks?user_id=...
  getTasks: async (req, res) => {
    try {
      const { user_id, ...filters } = req.query;
      if (!user_id) return res.status(400).json({ message: 'user_id is required' });
      const tasks = await taskService.getTasksByUser(user_id, filters);
      res.json(tasks);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // PATCH /tasks/:id
  updateTask: async (req, res) => {
    try {
      console.log('PATCH /tasks/:id called with id:', req.params.id, 'body:', req.body);
      await taskService.updateTask(req.params.id, req.body);
      // Fetch the full updated task
      const updatedTask = await taskService.getTaskById(req.params.id);
      res.json(updatedTask);
    } catch (err) {
      console.error('PATCH /tasks/:id error:', err);
      res.status(400).json({ message: err.message, details: err });
    }
  },

  // DELETE /tasks/:id
  deleteTask: async (req, res) => {
    try {
      const deleted = await taskService.deleteTask(req.params.id);
      res.json({ deleted });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = taskController;
