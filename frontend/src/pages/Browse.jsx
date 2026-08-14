import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { getAvatarColors } from '../utils/avatarUtils';

const SKILL_CHIPS = ['React', 'Node.js', 'Python', 'Design', 'Figma', 'UI/UX', 'Marketing', 'Java', 'Data Science'];
const TABS = ['All', 'Gigs', 'Skill Exchanges', 'People'];

const Browse = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [nearMe, setNearMe] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user: firebaseUser } = useAuth();
  const currentUser = useMemo(() => firebaseUser || {}, [firebaseUser]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, gigsRes] = await Promise.all([
          apiFetch(`/api/search/users?limit=50`),
          apiFetch(`/api/search/gigs?limit=50`)
        ]);
        
        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
        const gigsData = gigsRes.ok ? await gigsRes.json() : { gigs: [] };
        
        setUsers(usersData.users || []);
        setGigs(gigsData.gigs || []);
      } catch (err) {
        console.error('Failed to fetch browse data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };


  // Filter and format data
  const filteredItems = useMemo(() => {
    let items = [];

    // Assemble Gig items
    if (activeTab === 'All' || activeTab === 'Gigs') {
      gigs.forEach(gig => {
        if (gig.userId?._id === currentUser._id) return;
        const searchMatch = gig.title?.toLowerCase().includes(searchQuery.toLowerCase()) || gig.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const skillMatch = selectedSkills.length === 0 || selectedSkills.some(s => gig.requiredSkills?.includes(s));
        
        if (searchMatch && skillMatch) {
          items.push({
            type: 'gig',
            id: gig._id,
            user: gig.userId || {},
            title: gig.title,
            description: gig.description,
            skills: gig.requiredSkills || [],
            views: gig.views || 0,
            completed: gig.completedSessions || 0
          });
        }
      });
    }

    // Assemble Person/Exchange items
    if (activeTab === 'All' || activeTab === 'Skill Exchanges' || activeTab === 'People') {
      users.forEach(u => {
        if (u._id === currentUser._id || u.email === currentUser.email) return;
        const searchMatch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.bio?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const skillMatch = selectedSkills.length === 0 || selectedSkills.some(s => u.skills?.includes(s));
        
        if (searchMatch && skillMatch) {
          items.push({
            type: activeTab === 'People' ? 'person' : 'exchange', // default to exchange for All if we want
            id: u._id,
            user: u,
            title: u.name || u.email?.split('@')[0],
            description: u.bio || 'No bio provided.',
            skills: u.skills || [],
            views: 0,
            completed: 0
          });
        }
      });
    }

    return items;
  }, [gigs, users, activeTab, searchQuery, selectedSkills, currentUser]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 64 }}>
      {/* SEARCH HERO */}
      <div style={{ background: 'var(--panel)', borderBottom: '0.5px solid var(--border)', padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Browse & discover</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Find gigs to request or people to exchange skills with</p>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 16 }} />
              <input
                type="text"
                placeholder="Search for skills, people, or gigs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  background: 'var(--surface2)', border: '0.5px solid var(--border)',
                  borderRadius: 10, fontSize: 13, color: 'var(--text)', outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            
            <button style={{
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13
            }}>
              <i className="ti ti-adjustments-horizontal" style={{ fontSize: 16 }} /> Filters
            </button>
            
            <button
              onClick={() => setNearMe(!nearMe)}
              style={{
                background: nearMe ? 'var(--accent-dim)' : 'var(--surface2)',
                border: nearMe ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
                borderRadius: 10, padding: '10px 14px',
                color: nearMe ? 'var(--accent-light)' : 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s'
              }}
            >
              <i className="ti ti-map-pin" style={{ fontSize: 16 }} /> Near me
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        
        {/* TYPE TABS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
                border: activeTab === tab ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
                color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-dim)',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SKILLS FILTER CHIPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>Skills:</span>
          {SKILL_CHIPS.map(skill => {
            const isActive = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                style={{
                  background: isActive ? 'var(--surface2)' : 'var(--surface)',
                  border: isActive ? '0.5px solid var(--accent-dim)' : '0.5px solid var(--border)',
                  color: isActive ? 'var(--accent-light)' : 'var(--text)',
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {skill}
              </button>
            );
          })}
        </div>

        {/* RESULTS SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Trending {nearMe && 'near you'}</h2>
          <a href="#" style={{ fontSize: 13, color: 'var(--accent-light)', textDecoration: 'none' }}>See all</a>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 40 }}>
            <i className="ti ti-search" style={{ fontSize: 32, color: 'var(--text-dim)', marginBottom: 16, display: 'block' }} />
            <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginBottom: 8 }}>No results found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your filters or search terms.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20
          }}>
            {filteredItems.map((item, index) => {
              const uEmail = item.user.email || '';
              const uName = item.user.name || uEmail.split('@')[0] || 'Anonymous';
              const uInitial = uName.charAt(0).toUpperCase();
              
              return (
                <div key={`${item.id}-${index}`} style={{
                  background: 'var(--surface)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* TOP ROW */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: getAvatarColors(uEmail).bg, color: getAvatarColors(uEmail).text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, flexShrink: 0
                    }}>
                      {uInitial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uName}</span>
                        {item.user.rating >= 4.5 && (
                          <span style={{ color: 'var(--green-text)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <i className="ti ti-check" /> verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-map-pin" /> {item.user.location || 'Remote'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', fontWeight: 600 }}>
                        <i className="ti ti-star-filled" /> {item.user.rating ? Number(item.user.rating).toFixed(1) : 'New'}
                      </div>
                      {item.user.rating && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                          {item.user.reviewCount || 0} reviews
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.type === 'gig' && <span style={{ fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>{item.title}</span>}
                    {item.description}
                  </div>

                  {/* SKILL TRADE SECTION */}
                  <div style={{ marginBottom: 16, flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>
                      Offering ↔ Looking for
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Offering Skills */}
                      {(item.skills && item.skills.length > 0 ? item.skills.slice(0, 2) : ['Mentorship']).map(s => (
                        <span key={`off-${s}`} style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>
                          {s}
                        </span>
                      ))}
                      
                      <i className="ti ti-arrows-left-right" style={{ color: 'var(--text-dim)', fontSize: 12 }} />
                      
                      {/* Looking for Skills (just randomly pick from their skills or mock for design) */}
                      {(item.user.skills && item.user.skills.length > 0 ? item.user.skills.slice(0, 2) : ['React', 'Design']).map(s => (
                        <span key={`look-${s}`} style={{ background: 'var(--green-bg)', border: '0.5px solid var(--green)', color: 'var(--green-text)', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-dim)', fontSize: 11 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-clock" /> 60 min sessions</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-check" /> {item.completed} done</span>
                    </div>
                    
                    {item.type === 'gig' ? (
                      <button
                        onClick={() => navigate(`/gigs/${item.id}`)}
                        style={{
                          background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)',
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        View gig
                      </button>
                    ) : item.type === 'person' ? (
                      <button
                        onClick={() => navigate(`/profile/${item.id}`)}
                        style={{
                          background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)',
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        View profile
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/profile/${item.id}`)}
                        style={{
                          background: 'var(--accent)', border: 'none', color: 'white',
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                        onMouseLeave={e => e.currentTarget.style.opacity = 1}
                      >
                        Request exchange
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Browse;
