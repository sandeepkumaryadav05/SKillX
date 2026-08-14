import express from 'express';
import { upload } from '../config/cloudinary.js';
import {
  getWorkspace,
  updateNotes,
  uploadResource,
  addLinkResource,
  getResources,
  deleteResource,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from '../controllers/workspaceController.js';

// Workspace routes — secured by the global authenticate middleware
const router = express.Router();

/** GET /api/workspace/:chatRoomId - Fetch workspace metadata */
router.get('/:chatRoomId', getWorkspace);

/** PUT /api/workspace/notes/:workspaceId - Update shared workspace notes */
router.put('/notes/:workspaceId', updateNotes);

/** POST /api/workspace/resource/upload - Upload a new file resource */
router.post('/resource/upload', upload.single('file'), uploadResource);

/** POST /api/workspace/resource/link - Add a new link resource */
router.post('/resource/link', addLinkResource);

/** GET /api/workspace/resources/:workspaceId - Fetch all resources in a workspace */
router.get('/resources/:workspaceId', getResources);

/** DELETE /api/workspace/resource/:id - Delete a resource */
router.delete('/resource/:id', deleteResource);

/** POST /api/workspace/task/create - Create a new task */
router.post('/task/create', createTask);

/** GET /api/workspace/tasks/:workspaceId - Fetch all tasks in a workspace */
router.get('/tasks/:workspaceId', getTasks);

/** PUT /api/workspace/task/:id - Update an existing task */
router.put('/task/:id', updateTask);

/** DELETE /api/workspace/task/:id - Delete a task */
router.delete('/task/:id', deleteTask);

export default router;
