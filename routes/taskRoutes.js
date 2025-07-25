const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Create task
router.post('/tasks', taskController.createTask);
// Get all tasks for user (with optional filters)
router.get('/tasks', taskController.getTasks);
// Update task
router.patch('/tasks/:id', taskController.updateTask);
// Delete (soft-delete/archive) task
router.delete('/tasks/:id', taskController.deleteTask);

module.exports = router;
