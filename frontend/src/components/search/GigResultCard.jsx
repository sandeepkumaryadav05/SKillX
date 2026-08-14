import React from 'react';
import { Link } from 'react-router-dom';

const GigResultCard = ({ gig }) => {
  const { _id, title, category, skills, budget, duration, location, createdAt } = gig;

  const daysAgo = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  let timeString = 'Today';
  if (daysAgo === 1) timeString = '1 day ago';
  else if (daysAgo > 1) timeString = `${daysAgo} days ago`;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 flex flex-col h-full relative group">
      <div className="absolute top-4 right-4 text-xs font-semibold text-gray-400 bg-[var(--bg-card)] px-2 py-1 rounded-lg">
        {timeString}
      </div>

      <div className="pr-16">
        <span className="inline-block bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold mb-2">
          {category}
        </span>
        <h3 className="font-bold text-[var(--text-primary)] text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
          {title}
        </h3>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Required Skills</p>
        <div className="flex flex-wrap gap-2">
          {skills && skills.length > 0 ? (
            skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">Open to all</span>
          )}
          {skills && skills.length > 3 && (
            <span className="bg-[var(--bg-card)] text-[var(--text-secondary)] border border-gray-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              +{skills.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Budget</p>
          <p className="text-sm font-bold text-green-600 mt-0.5">${budget}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Duration</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{duration}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)] font-medium">📍 {location || 'Remote'}</span>
        <Link
          to={`/gigs/${_id}`}
          className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default GigResultCard;
