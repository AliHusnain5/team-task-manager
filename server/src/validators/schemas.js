const Joi = require('joi');

const dateString = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

module.exports = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().lowercase().email().max(255).required(),
    password: Joi.string().min(8).max(72).required(),
  }),
  login: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
  }),
  team: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().allow('').max(500).default(''),
  }),
  addMember: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
  }),
  taskCreate: Joi.object({
    teamId: Joi.number().integer().positive().required(),
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().allow('').max(2000).default(''),
    status: Joi.string().valid('todo', 'in_progress', 'done').default('todo'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    dueDate: dateString.allow(null, '').default(null),
    assigneeId: Joi.number().integer().positive().allow(null).default(null),
  }),
  taskUpdate: Joi.object({
    title: Joi.string().trim().min(1).max(200),
    description: Joi.string().trim().allow('').max(2000),
    status: Joi.string().valid('todo', 'in_progress', 'done'),
    priority: Joi.string().valid('low', 'medium', 'high'),
    dueDate: dateString.allow(null, ''),
    assigneeId: Joi.number().integer().positive().allow(null),
  }).min(1),
};
