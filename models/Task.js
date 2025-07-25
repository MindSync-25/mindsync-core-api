const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize'); // Make sure to create this Sequelize instance

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date',
  },
  reminderAt: {
    type: DataTypes.DATE,
    field: 'reminder_at',
  },
  metadata: DataTypes.JSONB,
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    field: 'ai_generated',
  },
  aiConfidence: {
    type: DataTypes.FLOAT,
    field: 'ai_confidence',
  },
  sourceText: {
    type: DataTypes.TEXT,
    field: 'source_text',
  },
}, {
  tableName: 'tasks',
  timestamps: true, // adds createdAt and updatedAt
  underscored: true,
});

module.exports = Task;
