import React from 'react';

const TYPE_ICONS = {
  PDF: '📄',
  VIDEO: '📹',
  LINK: '🔗',
  IMAGE: '🖼',
  ZIP: '💻',
  DOCUMENT: '📃',
  CODE: '⌨',
  OTHER: '📎',
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ResourceCard = ({ resource, onDelete, currentUserEmail }) => {
  const isOwner = resource.uploadedBy === currentUserEmail;

  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--bg-card)] rounded-xl border border-gray-100 hover:shadow-sm transition-shadow group">
      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
        {TYPE_ICONS[resource.resourceType] || '📎'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{resource.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {resource.resourceType}
          {resource.fileSize > 0 && ` · ${formatSize(resource.fileSize)}`}
          {' · '}
          {resource.uploadedBy.split('@')[0]}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
          title="Open / Preview"
        >
          ↗
        </a>
        <a
          href={resource.url}
          download
          className="p-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card)] rounded-lg transition-colors font-medium"
          title="Download"
        >
          ⬇
        </a>
        {isOwner && (
          <button
            onClick={() => onDelete(resource._id)}
            className="p-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
            title="Delete"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
