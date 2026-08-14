import Workspace from '../models/Workspace.js';

/**
 * Get or create a workspace for a given chatRoomId.
 * Prevents duplicates via the unique index on chatRoomId.
 */
export const getOrCreateWorkspace = async (chatRoomId, participants) => {
  let workspace = await Workspace.findOne({ chatRoomId });
  if (!workspace) {
    workspace = await Workspace.create({ chatRoomId, participants, notes: '' });
  }
  return workspace;
};

export const getWorkspaceById = async (workspaceId) => {
  return await Workspace.findById(workspaceId);
};

export const updateNotes = async (workspaceId, notes) => {
  return await Workspace.findByIdAndUpdate(
    workspaceId,
    { notes },
    { returnDocument: 'after' }
  );
};
