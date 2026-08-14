import mongoose from 'mongoose';

/**
 * Resource — tracks files, links, and documents shared within a Workspace.
 * Handles metadata and cloud storage references (Cloudinary).
 */
const resourceSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: String, // Maps to UserProfile.email
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['PDF', 'VIDEO', 'LINK', 'IMAGE', 'ZIP', 'DOCUMENT', 'CODE', 'OTHER'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // bytes, 0 for links
      default: 0,
    },
    publicId: {
      type: String, // Cloudinary public_id for deletion
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Resource', resourceSchema);
