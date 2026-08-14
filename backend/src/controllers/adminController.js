import UserProfile from '../models/UserProfile.js';
import Session from '../models/Session.js';
import SkillExchange from '../models/SkillExchange.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await UserProfile.find().select('-__v');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const user = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended' },
      { returnDocument: 'after' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ message: 'Failed to suspend user' });
  }
};

export const activateUser = async (req, res) => {
  try {
    const user = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { returnDocument: 'after' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ message: 'Failed to activate user' });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await UserProfile.countDocuments();
    const totalSessions = await Session.countDocuments();
    const totalExchanges = await SkillExchange.countDocuments();
    
    res.json({
      totalUsers,
      totalSessions,
      totalExchanges
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch platform stats' });
  }
};
