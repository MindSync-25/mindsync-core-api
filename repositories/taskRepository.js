const Task = require('../models/Task');

const taskRepository = {
  create: (data) => Task.create(data),
  findById: (id) => Task.findByPk(id),
  findAllByUser: (userId, filters = {}) => Task.findAll({ where: { userId, ...filters } }),
  update: (id, data) => Task.update(data, { where: { id } }),
  delete: (id) => Task.destroy({ where: { id } }),
  // Add more methods as needed
};

module.exports = taskRepository;
