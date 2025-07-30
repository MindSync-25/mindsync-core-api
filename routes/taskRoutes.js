const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// GET /api/tasks?user_id=123
router.get('/', taskController.getTasks);

// POST /api/tasks
router.post('/', taskController.createTask);

// PUT /api/tasks/:id
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
