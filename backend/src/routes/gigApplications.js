import express from 'express';
import GigApplication from '../models/GigApplication.js';
import Gig from '../models/Gig.js';
import Profile from '../models/UserProfile.js';
import ChatRoom from '../models/ChatRoom.js';

// GigApplication routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * POST /api/gig-applications
 * Body: { gigId, applicantEmail, message }
 */
router.post('/', async (req, res) => {
  try {
    const { gigId, applicantEmail, message } = req.body;

    if (!gigId || !applicantEmail) {
      return res
        .status(400)
        .json({ message: 'gigId and applicantEmail are required' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.postedBy === applicantEmail) {
      return res
        .status(400)
        .json({ message: 'You cannot apply to your own gig.' });
    }

    const existing = await GigApplication.findOne({
      gigId,
      applicantEmail,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'You have already applied to this gig.' });
    }

    const app = await GigApplication.create({
      gigId,
      gigTitle: gig.title,
      gigOwnerEmail: gig.postedBy,
      applicantEmail,
      message,
      status: 'pending',
    });

    res.status(201).json(app);
  } catch (error) {
    console.error('Error creating gig application:', error);
    res.status(500).json({ message: 'Failed to apply for gig' });
  }
});

/**
 * GET /api/gig-applications?email=abc@gmail.com
 * Returns { received: [...], sent: [...] }
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      const all = await GigApplication.find().sort({ createdAt: -1 });
      return res.json({ received: [], sent: [], all });
    }

    const [received, sent] = await Promise.all([
      GigApplication.find({ gigOwnerEmail: email }).sort({ createdAt: -1 }),
      GigApplication.find({ applicantEmail: email }).sort({ createdAt: -1 }),
    ]);

    res.json({ received, sent });
  } catch (error) {
    console.error('Error fetching gig applications:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch gig applications' });
  }
});

/**
 * PATCH /api/gig-applications/:id
 * Body: { status }  // 'pending' | 'accepted' | 'rejected'
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'rejected'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appBefore = await GigApplication.findById(req.params.id);
    if (!appBefore) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const wasAcceptedBefore = appBefore.status === 'accepted';

    const updated = await GigApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    );

    // Increment completion stats and create a chat room upon new acceptance
    if (status === 'accepted' && !wasAcceptedBefore) {
      try {
        const ownerEmail = updated.gigOwnerEmail;
        const applicantEmail = updated.applicantEmail;

        if (ownerEmail) {
          await Profile.findOneAndUpdate(
            { email: ownerEmail },
            { $inc: { 'stats.gigsCompleted': 1 } },
            { upsert: true, returnDocument: 'after' }
          );
        }

        if (applicantEmail) {
          await Profile.findOneAndUpdate(
            { email: applicantEmail },
            { $inc: { 'stats.gigsCompleted': 1 } },
            { upsert: true, returnDocument: 'after' }
          );
        }
        
        // Auto-create chat room
        const room = await ChatRoom.findOne({ referenceId: updated._id });
        if (!room) {
          await ChatRoom.create({
            participants: [applicantEmail, ownerEmail],
            referenceId: updated._id,
            referenceType: 'gig',
            title: updated.gigTitle || 'Gig Chat'
          });
        }
      } catch (err) {
        console.error('Error on gig application accept:', err);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating gig application:', error);
    res
      .status(500)
      .json({ message: 'Failed to update gig application' });
  }
});

export default router;
