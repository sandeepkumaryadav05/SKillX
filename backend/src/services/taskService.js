import WorkspaceTask from '../models/WorkspaceTask.js';

export const createTask = async ({ workspaceId, createdBy, title, description, assignedTo, dueDate }) => {
  return await WorkspaceTask.create({
    workspaceId,
    createdBy,
    title,
    description: description || '',
    assignedTo: assignedTo || '',
    dueDate: dueDate || '',
    status: 'Pending',
  });
};

export const getTasksByWorkspace = async (workspaceId) => {
  return await WorkspaceTask.find({ workspaceId }).sort({ createdAt: -1 });
};

export const updateTask = async (taskId, updates) => {
  const allowed = ['title', 'description', 'assignedTo', 'status', 'dueDate'];
  const sanitized = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  });
  return await WorkspaceTask.findByIdAndUpdate(taskId, sanitized, { returnDocument: 'after' });
};

export const deleteTask = async (taskId) => {
  return await WorkspaceTask.findByIdAndDelete(taskId);
};
