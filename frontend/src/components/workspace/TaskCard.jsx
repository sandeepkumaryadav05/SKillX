import React from 'react';

const STATUS_CONFIG = {
  Pending: { color: 'bg-[var(--bg-card)] text-gray-600', dot: 'bg-gray-400' },
  'In Progress': { color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  Completed: { color: 'bg-green-50 text-green-600', dot: 'bg-green-500' },
};

const TaskCard = ({ task, onStatusChange, onDelete }) => {
  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;
  const isCompleted = task.status === 'Completed';

  const cycleStatus = () => {
    const next = { Pending: 'In Progress', 'In Progress': 'Completed', Completed: 'Pending' };
    onStatusChange(task._id, next[task.status]);
  };

  return (
    <div className={`flex items-start gap-3 p-3 bg-[var(--bg-card)] rounded-xl border transition-all ${isCompleted ? 'border-green-100 opacity-70' : 'border-gray-100 hover:shadow-sm'} group`}>
      {/* Checkbox toggle */}
      <button
        onClick={cycleStatus}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {isCompleted && <span className="text-[10px]">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
            {task.status}
          </span>
          {task.assignedTo && (
            <span className="text-[10px] text-gray-400">→ {task.assignedTo.split('@')[0]}</span>
          )}
          {task.dueDate && (
            <span className="text-[10px] text-gray-400">📅 {task.dueDate}</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task._id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all text-xs"
        title="Delete task"
      >
        🗑
      </button>
    </div>
  );
};

export default TaskCard;
