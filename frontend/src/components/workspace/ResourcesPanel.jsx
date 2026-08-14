import React, { useState, useEffect, useRef, useCallback } from 'react';
import ResourceCard from './ResourceCard';
import { apiFetch } from '../../api/apiClient';

const ResourcesPanel = ({ workspaceId, currentUserEmail }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: '', url: '' });
  const fileInputRef = useRef(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/workspace/resources/${workspaceId}`);
      const data = await res.json();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) fetchResources();
  }, [workspaceId, fetchResources]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation for immediate feedback before any network request
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-zip-compressed',
      'text/javascript', 'application/json', 'text/html', 'text/css',
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('File type not supported. Please upload an image, PDF, document, zip, or code file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      alert('File is too large. Maximum size is 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);
    formData.append('uploadedBy', currentUserEmail);
    formData.append('title', file.name);

    try {
      setUploading(true);
      const res = await apiFetch(`/api/workspace/resource/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const newResource = await res.json();
      setResources((prev) => [newResource, ...prev]);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkForm.title.trim() || !linkForm.url.trim()) return;
    try {
      const res = await apiFetch(`/api/workspace/resource/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, uploadedBy: currentUserEmail, ...linkForm }),
      });
      const newResource = await res.json();
      setResources((prev) => [newResource, ...prev]);
      setLinkForm({ title: '', url: '' });
      setShowLinkForm(false);
    } catch (err) {
      console.error('Failed to add link', err);
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      await apiFetch(`/api/workspace/resource/${resourceId}`, { method: 'DELETE' });
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      console.error('Failed to delete resource', err);
    }
  };

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[var(--bg-card)] px-3 py-2 rounded-lg text-xs border border-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {uploading ? (
              <span className="animate-spin text-base">⏳</span>
            ) : (
              <span>⬆ Upload File</span>
            )}
          </button>
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--bg-card)] text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            🔗 Add Link
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip,application/x-zip-compressed,text/javascript,application/json,text/html,text/css"
            onChange={handleFileUpload}
          />
        </div>

        {showLinkForm && (
          <form onSubmit={handleAddLink} className="space-y-2 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)]">
            <input
              type="text"
              placeholder="Title (e.g. React Docs)"
              value={linkForm.title}
              onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={linkForm.url}
              onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition">
                Save Link
              </button>
              <button type="button" onClick={() => setShowLinkForm(false)} className="flex-1 py-1.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3 p-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm">{searchQuery ? 'No resources match your search.' : 'No resources yet. Upload a file or add a link!'}</p>
          </div>
        ) : (
          filtered.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onDelete={handleDelete}
              currentUserEmail={currentUserEmail}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ResourcesPanel;
