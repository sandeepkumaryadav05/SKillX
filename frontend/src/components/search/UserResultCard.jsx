import React from 'react';
import { Link } from 'react-router-dom';

const UserResultCard = ({ user }) => {
  const { name, email, skills, stats, trustScore, location } = user;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">{name}</h3>
            {location && <p className="text-xs text-[var(--text-secondary)] mt-0.5">📍 {location}</p>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-sm font-bold">
            <span>⭐</span> {stats?.averageRating ? stats.averageRating.toFixed(1) : 'New'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Skills</p>
        <div className="flex flex-wrap gap-2">
          {skills && skills.length > 0 ? (
            skills.slice(0, 4).map((skill, index) => (
              <span key={index} className="bg-[var(--bg-card)] text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No skills listed</span>
          )}
          {skills && skills.length > 4 && (
            <span className="bg-[var(--bg-card)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg text-xs font-medium">
              +{skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Trust Score</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-full bg-[var(--bg-card)] rounded-full h-1.5 max-w-[60px]">
              <div 
                className={`h-1.5 rounded-full ${trustScore >= 80 ? 'bg-green-500' : trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`} 
                style={{ width: `${Math.min(trustScore || 0, 100)}%` }}
              ></div>
            </div>
            {!trustScore || trustScore === 0 ? (
              <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Building trust</span>
            ) : (
              <span className="text-xs font-bold text-gray-700">{trustScore}</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Exchanges</p>
          <div className="mt-1">
            {(!stats?.skillExchangesCompleted || stats.skillExchangesCompleted === 0) ? (
              <span className="inline-flex items-center bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-sm font-bold">New Member</span>
            ) : (
              <span className="text-xs font-bold text-gray-700">{stats.skillExchangesCompleted} completed</span>
            )}
          </div>
        </div>
      </div>

      <Link
        to={`/user/${email}`}
        className="mt-5 block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2.5 rounded-xl transition text-sm"
      >
        View Profile
      </Link>
    </div>
  );
};

export default UserResultCard;
