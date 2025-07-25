const taskRepository = require('../repositories/taskRepository');

const taskService = {
  createTask: async (taskData) => {
    // Normalize status and priority
    if (taskData.status) {
      const status = String(taskData.status).toLowerCase();
      if (["pending", "in_progress", "completed"].includes(status)) {
        taskData.status = status;
      } else {
        taskData.status = "pending";
      }
    }
    if (taskData.priority) {
      const priority = String(taskData.priority).toLowerCase();
      if (["low", "medium", "high"].includes(priority)) {
        taskData.priority = priority;
      } else {
        taskData.priority = "medium";
      }
    }
    return await taskRepository.create(taskData);
  },
  getTasksByUser: async (userId, filters) => {
    return await taskRepository.findAllByUser(userId, filters);
  },
  updateTask: async (id, data) => {
    // Normalize status and priority for PATCH/PUT
    if (data.status) {
      let status = String(data.status).toLowerCase().replace(/\s+/g, '_');
      if (["pending", "in_progress", "completed"].includes(status)) {
        data.status = status;
      } else {
        data.status = "pending";
      }
    }
    if (data.priority) {
      let priority = String(data.priority).toLowerCase();
      if (["low", "medium", "high"].includes(priority)) {
        data.priority = priority;
      } else {
        data.priority = "medium";
      }
    }
    return await taskRepository.update(id, data);
  },
  getTaskById: async (id) => {
    return await taskRepository.findById(id);
  },
  deleteTask: async (id) => {
    return await taskRepository.delete(id);
  },
  // Add more service methods as needed
};

module.exports = taskService;
