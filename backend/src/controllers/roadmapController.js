import Roadmap from '../models/Roadmap.js';
import { generateLearningRoadmap } from '../services/aiService.js';

// POST /api/roadmap/generate
// Generates a roadmap via AI but does NOT save it to the database.
// Returns the raw AI response for the user to preview.
export const generateRoadmap = async (req, res) => {
  try {
    const { email, goal } = req.body;

    if (!email || !goal) {
      return res.status(400).json({ message: 'Email and goal are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI Service is not configured. Missing GEMINI_API_KEY.' });
    }

    const generatedRoadmap = await generateLearningRoadmap(goal);

    // Return the generated roadmap as a preview (not saved to DB)
    res.status(200).json({
      goal,
      generatedRoadmap,
      totalWeeks: generatedRoadmap?.milestones?.length || 0,
    });
  } catch (error) {
    console.error('Error in generateRoadmap controller:', error);
    res.status(500).json({ message: error.message || 'Failed to generate roadmap' });
  }
};

// POST /api/roadmap/save
// Saves a user-approved roadmap to MongoDB.
export const saveRoadmap = async (req, res) => {
  try {
    const { email, goal, generatedRoadmap } = req.body;

    if (!email || !goal || !generatedRoadmap) {
      return res.status(400).json({ message: 'Email, goal, and generatedRoadmap are required' });
    }

    const totalWeeks = generatedRoadmap?.milestones?.length || 0;

    const newRoadmap = await Roadmap.create({
      userEmail: email,
      goal,
      generatedRoadmap,
      isSaved: true,
      progress: 0,
      completedWeeks: [],
      totalWeeks,
      status: 'Active',
    });

    res.status(201).json(newRoadmap);
  } catch (error) {
    console.error('Error saving roadmap:', error);
    res.status(500).json({ message: 'Failed to save roadmap' });
  }
};

// GET /api/roadmap/user?email=...
// Returns all saved roadmaps for a user.
export const getUserRoadmaps = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to fetch roadmaps' });
    }

    const roadmaps = await Roadmap.find({ userEmail: email, isSaved: true }).sort({ createdAt: -1 });
    res.status(200).json(roadmaps);
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({ message: 'Failed to fetch roadmaps' });
  }
};

// PUT /api/roadmap/progress
// Toggles a week as completed/uncompleted and recalculates progress.
export const updateProgress = async (req, res) => {
  try {
    const { id, weekIndex } = req.body;

    if (!id || weekIndex === undefined || weekIndex === null) {
      return res.status(400).json({ message: 'Roadmap id and weekIndex are required' });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Toggle the week: add if not present, remove if present
    const weekSet = new Set(roadmap.completedWeeks);
    if (weekSet.has(weekIndex)) {
      weekSet.delete(weekIndex);
    } else {
      weekSet.add(weekIndex);
    }

    const completedWeeks = Array.from(weekSet).sort((a, b) => a - b);
    const totalWeeks = roadmap.totalWeeks || 1;
    const progress = Math.round((completedWeeks.length / totalWeeks) * 100);
    const status = progress === 100 ? 'Completed' : progress > 0 ? 'Active' : 'Active';

    roadmap.completedWeeks = completedWeeks;
    roadmap.progress = progress;
    roadmap.status = status;
    await roadmap.save();

    res.status(200).json(roadmap);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
};

// DELETE /api/roadmap/:id
// Deletes a roadmap from the database.
export const deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Roadmap id is required' });
    }

    const deleted = await Roadmap.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    res.status(200).json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ message: 'Failed to delete roadmap' });
  }
};
