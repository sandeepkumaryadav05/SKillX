import express from 'express';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
// Mongoose Map keys cannot contain "." — must use same encoding as index.js
const toMapKey = (email) => email.replace(/\./g, '_dot_');
// Chat routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * POST /api/chat/create
 * Create or get a direct chat room between two users
 */
router.post('/create', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ message: 'Two participants are required' });
    }

    // Check if a direct room already exists with exact participants
    let room = await ChatRoom.findOne({
      participants: { $all: participants, $size: 2 },
      referenceType: 'direct'
    });

    // If not, create a new one
    if (!room) {
      room = await ChatRoom.create({
        participants,
        referenceType: 'direct'
      });
    }

    res.json(room);
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

/**
 * GET /api/chat/room/:roomId
 * Get a specific chat room by ID
 */
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params
    const room = await ChatRoom.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    res.json(room)
  } catch (error) {
    console.error('Error fetching room by id:', error)
    res.status(500).json({ message: 'Failed to fetch room' })
  }
})

/**
 * GET /api/chat/unread-total
 * Returns the total unread message count across all rooms for the authenticated user.
 * MUST be defined before GET /:email to avoid the param catching 'unread-total'.
 */
router.get('/unread-total', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ message: 'Unauthorized' });

    const rooms = await ChatRoom.find({ participants: userEmail });
    let total = 0;
    for (const room of rooms) {
      total += room.unreadCounts?.get(toMapKey(userEmail)) || 0;
    }
    res.json({ total });
  } catch (err) {
    console.error('unread-total error:', err);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

/**
 * GET /api/chat/:email
 * Get all chat rooms for a specific user, with caller's unread count as a flat number.
 */
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const rooms = await ChatRoom.find({ participants: email }).sort({ updatedAt: -1 });

    // Serialize Map → flat number for easy frontend consumption
    const roomsWithUnread = rooms.map(room => {
      const obj = room.toObject();
      obj.unreadCount = room.unreadCounts?.get(toMapKey(email)) || 0;
      return obj;
    });

    res.json(roomsWithUnread);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Failed to fetch chat rooms' });
  }
});

/**
 * GET /api/chat/messages/:roomId
 * Get all messages for a specific chat room
 */
router.get('/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ chatRoomId: roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

export default router;
