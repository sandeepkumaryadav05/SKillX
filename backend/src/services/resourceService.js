import Resource from '../models/Resource.js';
import cloudinary from '../config/cloudinary.js';

export const createResource = async ({ workspaceId, uploadedBy, resourceType, title, url, fileSize, publicId }) => {
  return await Resource.create({ workspaceId, uploadedBy, resourceType, title, url, fileSize, publicId });
};

export const createLinkResource = async ({ workspaceId, uploadedBy, title, url }) => {
  return await Resource.create({
    workspaceId,
    uploadedBy,
    resourceType: 'LINK',
    title,
    url,
    fileSize: 0,
    publicId: '',
  });
};

export const getResourcesByWorkspace = async (workspaceId) => {
  return await Resource.find({ workspaceId }).sort({ createdAt: -1 });
};

export const deleteResource = async (resourceId) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new Error('Resource not found');

  // Delete from Cloudinary if it was an uploaded file
  if (resource.publicId && resource.resourceType !== 'LINK') {
    try {
      await cloudinary.uploader.destroy(resource.publicId, { resource_type: 'raw' });
    } catch (err) {
      // If Cloudinary deletion fails, still remove from DB
      console.error('Cloudinary deletion failed:', err.message);
    }
  }

  await Resource.findByIdAndDelete(resourceId);
  return resource;
};
