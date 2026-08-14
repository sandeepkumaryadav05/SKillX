import express from 'express'
import { upload } from '../config/cloudinary.js'
import UserProfile from '../models/UserProfile.js'

const router = express.Router()

router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' })
    }
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email required' })
    }
    const imageUrl = req.file.path || req.file.secure_url
    const updated = await UserProfile.findOneAndUpdate(
      { email },
      { $set: { avatar: imageUrl } },
      { returnDocument: 'after' }
    )
    if (!updated) {
      return res.status(404).json({ message: 'Profile not found' })
    }
    res.json({ avatar: imageUrl })
  } catch (err) {
    console.error('Avatar upload error:', err)
    res.status(500).json({ message: 'Failed to upload avatar' })
  }
})

export default router
