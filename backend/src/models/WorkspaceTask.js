import mongoose from 'mongoose';

/**
 * WorkspaceTask — a to-do item within a collaborative Workspace.
 */
const workspaceTaskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    dueDate: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('WorkspaceTask', workspaceTaskSchema);
