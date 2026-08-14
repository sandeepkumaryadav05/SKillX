import * as workspaceService from '../services/workspaceService.js';
import * as resourceService from '../services/resourceService.js';
import * as taskService from '../services/taskService.js';

// ─── WORKSPACE ───────────────────────────────────────────────────────────────

/**
 * GET /api/workspace/:chatRoomId
 * Get or auto-create the workspace for a chat room.
 */
export const getWorkspace = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const participantsHeader = req.headers['participants'];
    const participants = participantsHeader ? participantsHeader.split(',') : [];

    const workspace = await workspaceService.getOrCreateWorkspace(chatRoomId, participants);
    res.status(200).json(workspace);
  } catch (error) {
    console.error('getWorkspace error:', error);
    res.status(500).json({ message: 'Failed to get workspace', error: error.message });
  }
};

// ─── NOTES ───────────────────────────────────────────────────────────────────

/**
 * PUT /api/workspace/notes/:workspaceId
 * Auto-save collaborative notes.
 */
export const updateNotes = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { notes } = req.body;
    const updated = await workspaceService.updateNotes(workspaceId, notes);
    res.status(200).json(updated);
  } catch (error) {
    console.error('updateNotes error:', error);
    res.status(500).json({ message: 'Failed to update notes', error: error.message });
  }
};

// ─── RESOURCES ───────────────────────────────────────────────────────────────

/**
 * POST /api/workspace/resource/upload
 * Upload a file to Cloudinary via multer middleware.
 */
export const uploadResource = async (req, res) => {
  try {
    const { workspaceId, uploadedBy, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Server-side type re-validation (defense in depth — do not trust multer mimetype alone)
    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-zip-compressed',
      'text/javascript', 'application/json', 'text/html', 'text/css',
    ];

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(415).json({ message: 'File type not allowed.' });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(413).json({ message: 'File exceeds 10MB limit.' });
    }

    const file = req.file;
    const mimeType = file.mimetype;

    // Determine resource type from mimetype
    let resourceType = 'OTHER';
    if (mimeType === 'application/pdf') resourceType = 'PDF';
    else if (mimeType.startsWith('video/')) resourceType = 'VIDEO';
    else if (mimeType.startsWith('image/')) resourceType = 'IMAGE';
    else if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') resourceType = 'ZIP';
    else if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) resourceType = 'DOCUMENT';
    else if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) resourceType = 'CODE';

    const resource = await resourceService.createResource({
      workspaceId,
      uploadedBy,
      resourceType,
      title: title || file.originalname,
      url: file.path,
      fileSize: file.size || 0,
      publicId: file.filename || '',
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('uploadResource error:', error);
    res.status(500).json({ message: 'Failed to upload resource', error: error.message });
  }
};

/**
 * POST /api/workspace/resource/link
 * Save an external link as a resource.
 */
export const addLinkResource = async (req, res) => {
  try {
    const { workspaceId, uploadedBy, title, url } = req.body;
    if (!url || !title) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }
    const resource = await resourceService.createLinkResource({ workspaceId, uploadedBy, title, url });
    res.status(201).json(resource);
  } catch (error) {
    console.error('addLinkResource error:', error);
    res.status(500).json({ message: 'Failed to add link', error: error.message });
  }
};

/**
 * GET /api/workspace/resources/:workspaceId
 * Get all resources for a workspace.
 */
export const getResources = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const resources = await resourceService.getResourcesByWorkspace(workspaceId);
    res.status(200).json(resources);
  } catch (error) {
    console.error('getResources error:', error);
    res.status(500).json({ message: 'Failed to get resources', error: error.message });
  }
};

/**
 * DELETE /api/workspace/resource/:id
 * Delete a resource and remove from Cloudinary.
 */
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    await resourceService.deleteResource(id);
    res.status(200).json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('deleteResource error:', error);
    res.status(500).json({ message: 'Failed to delete resource', error: error.message });
  }
};

// ─── TASKS ───────────────────────────────────────────────────────────────────

/**
 * POST /api/workspace/task/create
 * Create a new task in a workspace.
 */
export const createTask = async (req, res) => {
  try {
    const { workspaceId, createdBy, title, description, assignedTo, dueDate } = req.body;
    if (!workspaceId || !createdBy || !title) {
      return res.status(400).json({ message: 'workspaceId, createdBy, and title are required' });
    }
    const task = await taskService.createTask({ workspaceId, createdBy, title, description, assignedTo, dueDate });
    res.status(201).json(task);
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

/**
 * GET /api/workspace/tasks/:workspaceId
 * Get all tasks for a workspace.
 */
export const getTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const tasks = await taskService.getTasksByWorkspace(workspaceId);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

/**
 * PUT /api/workspace/task/:id
 * Update task (status, title, assignedTo, etc.).
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await taskService.updateTask(id, req.body);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

/**
 * DELETE /api/workspace/task/:id
 * Delete a task.
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(id);
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};
