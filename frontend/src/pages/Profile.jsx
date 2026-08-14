/**
 * Profile.jsx
 * Displays and manages the user's public and private profile details, stats, and reviews.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Skeleton from '../components/ui/Skeleton';
import { getAvatarColors, getAvatarInitials } from '../utils/avatarUtils';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const storedUser = firebaseUser || {};
  const currentUserEmail = storedUser.email;
  const currentUid = storedUser.uid;

  const targetEmail = userId || currentUserEmail;
  const targetUid = userId || currentUid;
  const isOwnProfile = targetEmail === currentUserEmail;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [exchangeRequests, setExchangeRequests] = useState({ sent: [], received: [] });
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview | gigs | exchanges | reviews

  const [showSocialInput, setShowSocialInput] = useState(false);
  const [newSocialType, setNewSocialType] = useState('github');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', location: '', skills: '' });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddSocialLink = async () => {
    if (!newSocialUrl) return;
    setIsSaving(true);
    try {
      const updatedLinks = [...(profile.socialLinks || []), { type: newSocialType, url: newSocialUrl, label: newSocialType }];
      
      const res = await apiFetch(`/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          socialLinks: updatedLinks,
          stats: profile.stats,
          skills: profile.skills
        })
      });
      
      if (res.ok) {
        setProfile({ ...profile, socialLinks: updatedLinks });
        setShowSocialInput(false);
        setNewSocialUrl('');
        toast.success('Social link added!');
      } else {
        toast.error('Failed to add social link.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!targetEmail) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const profRes = await apiFetch(`/api/profile/${targetEmail}`);
        if (profRes.ok) {
          const profData = await profRes.json();
          // Initialize socialLinks if undefined
          profData.socialLinks = profData.socialLinks || [];
          setProfile(profData);
          setBioInput(profData.bio || '');
          setEditForm({
            name: profData.name || '',
            location: profData.location || '',
            skills: Array.isArray(profData.skills) ? profData.skills.join(', ') : (profData.skills || '')
          });
        }

        const gigsRes = await apiFetch(`/api/gigs`);
        if (gigsRes.ok) {
          const allGigs = await gigsRes.json();
          // Filter by creator email (Gig docs store the poster in `postedBy`)
          setGigs(allGigs.filter(g => g.postedBy === targetEmail));
        }

        const exRes = await apiFetch(`/api/skill-exchange?userId=${targetUid}`);
        if (exRes.ok) {
          setExchanges(await exRes.json());
        }

        const reqRes = await apiFetch(`/api/exchange-requests?userId=${targetUid}`);
        if (reqRes.ok) {
          setExchangeRequests(await reqRes.json());
        }

        const revRes = await apiFetch(`/api/reviews/user/${targetEmail}`);
        if (revRes.ok) {
          setReviews(await revRes.json());
        }

      } catch (err) {
        console.error('Failed to fetch profile data', err);
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetEmail, targetUid]);

  const saveBio = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, bio: bioInput })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => ({ ...prev, bio: updated.bio ?? bioInput }));
        setIsEditingBio(false);
        toast.success('Bio saved successfully!');
      } else {
        toast.error('Failed to save bio.');
      }
    } catch (err) {
      console.error('Failed to save bio:', err);
      toast.error('An error occurred while saving bio.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      const skillsArray = editForm.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          name: editForm.name,
          location: editForm.location,
          skills: skillsArray
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => ({
          ...prev,
          name: updated.name ?? editForm.name,
          location: updated.location ?? editForm.location,
          skills: updated.skills ?? skillsArray
        }));
        setIsEditingProfile(false);
        toast.success('Profile saved successfully!');
      } else {
        toast.error('Failed to save profile.');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('An error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('email', profile.email);
      const res = await apiFetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, avatar: data.avatar }));
        toast.success('Photo uploaded successfully!');
      } else {
        toast.error('Failed to upload photo.');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error('An error occurred while uploading photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!targetEmail) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
          <h1 className="text-h2" style={{ marginBottom: 8 }}>Not signed in</h1>
          <p className="text-caption">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 64 }}>
        {/* Hero skeleton */}
        <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)', padding: '32px 24px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
            <Skeleton width="128px" height="128px" style={{ borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton width="220px" height="28px" style={{ borderRadius: 6 }} />
              <Skeleton width="160px" height="16px" style={{ borderRadius: 6 }} />
              <Skeleton width="280px" height="14px" style={{ borderRadius: 6 }} />
              <Skeleton width="100%" height="14px" style={{ borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Skeleton width="96px" height="34px" style={{ borderRadius: 8 }} />
                <Skeleton width="120px" height="34px" style={{ borderRadius: 8 }} />
              </div>
            </div>
            <Skeleton width="256px" height="160px" style={{ borderRadius: 16, flexShrink: 0 }} />
          </div>
        </div>

        {/* Stats skeleton */}
        <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Skeleton width="48px" height="28px" style={{ borderRadius: 6 }} />
                <Skeleton width="64px" height="12px" style={{ borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs skeleton */}
        <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 32, padding: '0 24px' }}>
            {[1,2,3,4].map(i => (
              <Skeleton key={i} width="72px" height="40px" style={{ borderRadius: 0 }} />
            ))}
          </div>
        </div>

        {/* Content skeleton — two columns */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="120px" height="22px" style={{ borderRadius: 6 }} />
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <Skeleton width="48px" height="48px" style={{ borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton width="60%" height="14px" style={{ borderRadius: 6 }} />
                  <Skeleton width="80%" height="11px" style={{ borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="120px" height="22px" style={{ borderRadius: 6 }} />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Skeleton width="48px" height="48px" style={{ borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton width="50%" height="14px" style={{ borderRadius: 6 }} />
                  <Skeleton width="30%" height="11px" style={{ borderRadius: 6 }} />
                </div>
              </div>
              <Skeleton width="100%" height="14px" style={{ borderRadius: 6 }} />
              <Skeleton width="90%" height="14px" style={{ borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
          <h1 className="text-h2" style={{ marginBottom: 8 }}>Profile not found</h1>
          <p className="text-caption">This user does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const stats = profile.stats || { gigsPosted: 0, gigsCompleted: 0, skillExchanges: 0, skillExchangesCompleted: 0, averageRating: 0, totalReviews: 0 };
  const skillArray = Array.isArray(profile.skills) ? profile.skills : (profile.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  const handleUpdateRequest = async (id, newStatus) => {
    try {
      const res = await apiFetch(`/api/exchange-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update request')
      
      const updated = await res.json()
      
      setExchangeRequests(prev => ({
        received: prev.received.map(r => r._id === updated._id ? updated : r),
        sent: prev.sent.map(r => r._id === updated._id ? updated : r),
      }))

      if (newStatus === 'accepted') {
        toast.success('Exchange request accepted!')
      } else if (newStatus === 'rejected') {
        toast.info('Exchange request rejected.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update request. Please try again.')
    }
  }

  const calculateCompleteness = () => {
    let score = 0;
    if (profile.bio) score++;
    if (profile.location) score++;
    if (skillArray.length > 0) score++;
    if (profile.socialLinks && profile.socialLinks.length > 0) score++;
    if (profile.name) score++; // Avatar placeholder
    return (score / 5) * 100;
  };

  const completeness = calculateCompleteness();
  const avatarColors = getAvatarColors(profile?.name || profile?.email || '')
  const avatarInitials = getAvatarInitials(profile?.name, profile?.email)

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-16">
      {/* ── PROFILE HERO ── */}
      <div className="bg-[var(--panel)] border-b border-[var(--border)] pt-8 pb-8 px-6">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row gap-8">
          
          {/* Avatar with upload overlay */}
          <div className="relative flex-shrink-0 mb-6 md:mb-0 w-24 h-24 md:w-32 md:h-32 mx-auto md:mx-0">
            <div
              className="w-full h-full rounded-full border-4 border-[var(--accent)] flex items-center justify-center text-4xl font-bold overflow-hidden shadow-sm"
              style={{ background: profile.avatar ? undefined : avatarColors.bg, color: profile.avatar ? undefined : avatarColors.text }}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                avatarInitials
              )}
            </div>
            {isOwnProfile && (
              <div 
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer hover:bg-[var(--surface)] transition-colors shadow-md group"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="ti ti-camera text-base group-hover:text-[var(--text)] transition-colors" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Info block */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:justify-start gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight">
                {profile.name || 'Your Name'}
              </h1>
              {profile.role && (
                <span className="px-3 py-1 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-full border border-[var(--border)]">
                  {profile.role}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-[var(--text-muted)] mb-4 font-medium">
              <span className="flex items-center gap-1.5">
                <i className="ti ti-map-pin text-[var(--text-dim)]" /> {profile.location || 'Unknown Location'}
              </span>
              <span className="text-[var(--border)] hidden md:inline">·</span>
              <span className="flex items-center gap-1.5">
                <i className="ti ti-calendar text-[var(--text-dim)]" /> Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
              </span>
            </div>

            {stats.averageRating > 0 && (
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <i key={star} className={star <= Math.round(stats.averageRating) ? "ti ti-star-filled text-[var(--amber)]" : "ti ti-star text-[var(--border)]"} />
                  ))}
                </div>
                <span className="text-sm font-bold text-[var(--text)]">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  · {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {skillArray.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1">Skills</span>
                {skillArray.slice(0, 5).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-[var(--accent-dim)] border border-[var(--accent)] border-opacity-20 rounded-full text-xs font-bold text-[var(--accent)] shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-6">
              {isEditingBio ? (
                <div className="max-w-2xl mx-auto md:mx-0">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell others what you do, what you're learning, and what you want to exchange..."
                    rows={3}
                    maxLength={300}
                    className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] p-2.5 resize-none focus:outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex gap-2 mt-1.5 items-center">
                    <button
                      onClick={saveBio}
                      disabled={isSaving}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 hover:bg-opacity-90"
                    >
                      {isSaving ? 'Saving...' : 'Save bio'}
                    </button>
                    <button
                      onClick={() => setIsEditingBio(false)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                    >
                      Cancel
                    </button>
                    <span className="text-xs font-medium text-[var(--text-muted)] ml-auto">{bioInput.length}/300</span>
                  </div>
                </div>
              ) : profile?.bio ? (
                <p
                  className="text-[var(--text-muted)] text-sm leading-relaxed max-w-2xl mx-auto md:mx-0 cursor-pointer hover:text-[var(--text)] transition-colors"
                  onClick={() => { setIsEditingBio(true); setBioInput(profile.bio) }}
                >
                  {profile.bio}
                </p>
              ) : (
                <button
                  onClick={() => { setIsEditingBio(true); setBioInput('') }}
                  className="flex items-center gap-1.5 text-[var(--text-dim)] text-sm italic cursor-pointer hover:text-[var(--text-muted)] transition-colors inline-block"
                >
                  <i className="ti ti-pencil text-xs" aria-hidden="true" /> Click to add a bio
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {isOwnProfile && (
                <>
                  <button onClick={() => setIsEditingProfile(true)} className="btn-secondary px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-sm">
                    <i className="ti ti-edit text-lg" /> Edit profile
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-sm">
                    <i className="ti ti-photo text-lg" /> {isUploadingPhoto ? 'Uploading...' : 'Upload photo'}
                  </button>
                  <button
                    onClick={async () => {
                      const profileUrl = `${window.location.origin}/profile/${profile.email || targetEmail}`
                      try {
                        await navigator.clipboard.writeText(profileUrl)
                        toast.success('Profile link copied!')
                      } catch {
                        toast.error('Could not copy link.')
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface2)] transition-colors shadow-sm"
                  >
                    <i className="ti ti-link text-sm" /> Copy link
                  </button>
                </>
              )}
              
              {(profile.socialLinks || []).map((link, i) => {
                const getIcon = (type) => {
                  switch(type?.toLowerCase()) {
                    case 'github': return 'ti-brand-github';
                    case 'linkedin': return 'ti-brand-linkedin';
                    case 'twitter': return 'ti-brand-twitter';
                    default: return 'ti-link';
                  }
                };
                return (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--text-muted)] transition-all shadow-sm">
                    <i className={`ti ${getIcon(link.type)} text-[var(--text-muted)] text-lg`} />
                    {link.label || link.type}
                  </a>
                );
              })}

              {isOwnProfile && !showSocialInput && (
                <button 
                  onClick={() => setShowSocialInput(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-transparent border-2 border-dashed border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all"
                >
                  <i className="ti ti-plus text-lg" /> Add link
                </button>
              )}

              {isOwnProfile && showSocialInput && (
                <div className="flex items-center gap-2 p-1.5 bg-[var(--surface)] border-2 border-[var(--border)] rounded-lg shadow-sm">
                  <select 
                    value={newSocialType}
                    onChange={(e) => setNewSocialType(e.target.value)}
                    className="bg-[var(--surface2)] border border-[var(--border)] rounded text-[var(--text)] text-xs font-medium outline-none cursor-pointer py-1.5 px-2"
                  >
                    <option value="github">GitHub</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="portfolio">Portfolio</option>
                  </select>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    className="bg-transparent border-none text-[var(--text)] text-sm w-32 outline-none px-2 placeholder-[var(--text-dim)]"
                  />
                  <button onClick={handleAddSocialLink} disabled={isSaving} className="bg-[var(--accent)] text-white border-none rounded px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-opacity-90 disabled:opacity-50 transition-opacity">
                    {isSaving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setShowSocialInput(false)} className="bg-transparent text-[var(--text-muted)] border-none text-lg cursor-pointer hover:text-[var(--text)] px-2 transition-colors flex items-center justify-center">
                    <i className="ti ti-x" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile completion bar */}
          {isOwnProfile && (
            <div className="w-full md:w-64 flex flex-col pt-2 shrink-0">
              <div className="bg-gradient-to-br from-[var(--surface2)] to-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] shadow-sm">
                <div className="flex justify-between items-end text-sm font-bold text-[var(--text)] mb-3">
                  <span>Profile setup</span>
                  <span className="text-[var(--accent)] text-lg">{Math.round(completeness)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[var(--bg)] rounded-full overflow-hidden mb-4 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-[var(--accent-light)] to-[var(--accent)] rounded-full transition-all duration-700 ease-out relative overflow-hidden" style={{ width: `${completeness}%` }}>
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-20 w-full animate-pulse"></div>
                  </div>
                </div>
                {completeness < 100 && (
                  <div className="space-y-1 mt-1">
                    {!profile?.name && (
                      <div className="flex justify-between text-xs cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsEditingProfile(true)}>
                        <span className="text-[var(--text-muted)] font-medium">Add your name</span>
                        <span className="text-[var(--accent)] font-bold">+20%</span>
                      </div>
                    )}
                    {!profile?.bio && (
                      <div className="flex justify-between text-xs cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsEditingBio(true)}>
                        <span className="text-[var(--text-muted)] font-medium">Add a bio</span>
                        <span className="text-[var(--accent)] font-bold">+20%</span>
                      </div>
                    )}
                    {!profile?.location && (
                      <div className="flex justify-between text-xs cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsEditingProfile(true)}>
                        <span className="text-[var(--text-muted)] font-medium">Add your location</span>
                        <span className="text-[var(--accent)] font-bold">+20%</span>
                      </div>
                    )}
                    {(!profile?.skills || skillArray.length === 0) && (
                      <div className="flex justify-between text-xs cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsEditingProfile(true)}>
                        <span className="text-[var(--text-muted)] font-medium">Add your skills</span>
                        <span className="text-[var(--accent)] font-bold">+20%</span>
                      </div>
                    )}
                    {(!profile?.socialLinks || profile.socialLinks.length === 0) && (
                      <div className="flex justify-between text-xs cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setShowSocialInput(true)}>
                        <span className="text-[var(--text-muted)] font-medium">Add a social link</span>
                        <span className="text-[var(--accent)] font-bold">+20%</span>
                      </div>
                    )}
                  </div>
                )}
                {completeness === 100 && (
                  <p className="text-xs text-[var(--green)] font-bold mt-1">Profile complete!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="bg-[var(--panel)] border-b border-[var(--border)] shadow-sm relative z-10">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
          {[
            { num: stats.gigsPosted || 0, label: 'Gigs posted', icon: 'ti-briefcase' },
            { num: stats.gigsCompleted || 0, label: 'Completed', icon: 'ti-check' },
            { num: stats.skillExchanges || 0, label: 'Exchanges', icon: 'ti-arrows-exchange' },
            { num: stats.skillExchangesCompleted || 0, label: 'Sessions', icon: 'ti-video' },
          ].map(({ num, label, icon }, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-6 px-4 hover:bg-[var(--surface2)] transition-colors group cursor-default">
              <div className="flex items-center gap-2 text-2xl font-black text-[var(--text)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                <i className={`ti ${icon} text-[var(--accent-light)] opacity-70 group-hover:opacity-100 transition-opacity`} />
                {num}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="bg-[var(--panel)] border-b border-[var(--border)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-[900px] mx-auto flex gap-6 md:gap-10 px-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'gigs', label: 'My Gigs', count: gigs.length },
            { id: 'exchanges', label: 'Exchanges', count: exchanges.length + exchangeRequests.received.length + exchangeRequests.sent.length },
            { id: 'reviews', label: 'Reviews', count: reviews.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 -mb-px transition-all whitespace-nowrap group ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] font-semibold hover:text-[var(--text)] hover:border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-sm">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[var(--accent)] text-white shadow-sm' 
                    : 'bg-[var(--surface2)] text-[var(--text-muted)] group-hover:bg-[var(--surface)] group-hover:text-[var(--text)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 mt-10">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column: Badges */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                <i className="ti ti-medal text-[var(--accent)] text-2xl" /> Badges
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  { name: 'Early Adopter', description: 'Joined during beta phase', progress: 100, earned: true },
                  { name: 'Top Rated', description: 'Maintain 4.5+ average rating', progress: Math.min((stats.totalReviews / 5) * 100, 100), earned: stats.averageRating >= 4.5 && stats.totalReviews >= 5 },
                  { name: 'Mentor', description: 'Complete 5+ exchange sessions', progress: Math.min((stats.skillExchangesCompleted / 5) * 100, 100), earned: stats.skillExchangesCompleted >= 5 },
                  { name: 'Active Networker', description: 'Initiate 10+ skill exchanges', progress: Math.min((stats.skillExchanges / 10) * 100, 100), earned: stats.skillExchanges >= 10 },
                ].map((badge, i) => (
                  <div key={i} className={`p-4 rounded-2xl border transition-all duration-300 ${badge.earned ? 'bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] border-[var(--border)] shadow-sm hover:shadow-md' : 'bg-transparent border-[var(--border-subtle)] opacity-60'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${badge.earned ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : 'bg-[var(--surface2)] text-[var(--text-muted)]'}`}>
                        <i className={`ti ${badge.earned ? 'ti-award' : 'ti-lock'} text-2xl`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--text)] truncate">{badge.name}</div>
                        <div className="text-xs font-medium text-[var(--text-muted)] truncate mt-0.5">{badge.description}</div>
                        {!badge.earned && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">
                              <span>Progress</span>
                              <span>{Math.round(badge.progress)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--accent-dim)] rounded-full" style={{ width: `${badge.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 self-start">
                        {badge.earned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent-light)] bg-[var(--accent-dim)] border border-[var(--accent)] border-opacity-20 px-2 py-1 rounded">
                            Earned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Latest Review */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                <i className="ti ti-message-star text-[var(--amber)] text-2xl" /> Latest Review
              </h3>
              {reviews.length > 0 ? (
                <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--surface2)] to-[var(--border)] flex items-center justify-center text-[var(--text)] font-bold text-lg border border-[var(--border)] shadow-inner">
                        {(reviews[0].reviewerName || reviews[0].reviewerEmail || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text)]">
                          {reviews[0].reviewerName || reviews[0].reviewerEmail?.split('@')[0]}
                        </div>
                        <div className="text-xs font-medium text-[var(--text-muted)]">
                          {new Date(reviews[0].createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 bg-[var(--surface2)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i key={star} className={`text-sm ${star <= (reviews[0].rating || 0) ? 'ti ti-star-filled text-[var(--amber)] drop-shadow-sm' : 'ti ti-star text-[var(--border)]'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--text)] font-medium leading-relaxed italic border-l-4 border-[var(--accent-dim)] pl-4 py-1 bg-[var(--surface2)] bg-opacity-50 rounded-r-lg">
                    {reviews[0].feedback ? (
                      `"${reviews[0].feedback}"`
                    ) : (
                      <span className="text-[var(--text-muted)]">No written review — rating only.</span>
                    )}
                  </div>
                  <div className="mt-8 pt-5 border-t border-[var(--border)]">
                    <div className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <i className="ti ti-chart-bar" /> Rating Breakdown
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => Math.round(r.rating) === star).length;
                        const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <div className="text-xs font-bold text-[var(--text-muted)] w-8 flex items-center justify-end gap-1">
                              {star} <i className="ti ti-star-filled text-[10px] text-[var(--amber)]" />
                            </div>
                            <div className="flex-1 h-2 bg-[var(--surface2)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                              <div className="h-full bg-gradient-to-r from-[var(--amber)] to-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="text-xs font-bold text-[var(--text-muted)] w-6">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-[var(--border)] rounded-2xl text-center flex flex-col items-center justify-center bg-[var(--surface)] bg-opacity-50">
                  <div className="w-16 h-16 bg-[var(--surface2)] rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <i className="ti ti-message-off text-3xl text-[var(--text-muted)]" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--text)] mb-1">No Reviews Yet</h4>
                  <p className="text-sm font-medium text-[var(--text-muted)]">Complete a session to get feedback.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY GIGS TAB */}
        {activeTab === 'gigs' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                <i className="ti ti-briefcase text-[var(--accent)]" /> Gigs {isOwnProfile ? "you've posted" : "they've posted"}
              </h3>
              {isOwnProfile && (
                <button onClick={() => navigate('/post-gig')} className="btn-primary text-sm px-5 py-2.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all rounded-lg font-bold">
                  <i className="ti ti-plus text-lg" /> Post new gig
                </button>
              )}
            </div>

            {gigs.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-[var(--border)] rounded-2xl text-center bg-[var(--surface)] bg-opacity-30">
                <div className="w-20 h-20 bg-[var(--surface2)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <i className="ti ti-briefcase-off text-4xl text-[var(--text-muted)]" />
                </div>
                <h4 className="text-lg font-bold text-[var(--text)] mb-2">No gigs posted</h4>
                <p className="text-[var(--text-muted)] font-medium mb-6 max-w-sm mx-auto">Create a gig to offer your skills and start exchanging with others.</p>
                {isOwnProfile && (
                  <button onClick={() => navigate('/post-gig')} className="btn-secondary px-6 py-2.5 font-bold shadow-sm">
                    Create First Gig
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {gigs.map(gig => (
                  <div key={gig._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)] transition-all hover:shadow-md group flex flex-col md:flex-row gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-dim)] to-[var(--surface2)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 border border-[var(--border)] shadow-sm">
                      <i className="ti ti-briefcase text-2xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <h4 className="text-lg font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">{gig.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                          gig.status === 'active' ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)] border-opacity-20' : 'bg-[var(--surface2)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}>
                          {gig.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-muted)] line-clamp-2 mb-4 leading-relaxed">
                        {gig.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-5 text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-[var(--text)]">
                          <i className="ti ti-map-pin text-[var(--text-muted)] text-base" /> {gig.location || 'Remote'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
                        <span className="flex items-center gap-1.5">
                          <i className="ti ti-calendar text-base" /> {new Date(gig.createdAt).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
                        <span className="flex items-center gap-1.5 bg-[var(--surface2)] px-2 py-1 rounded-md">
                          <i className="ti ti-eye text-base" /> {gig.views || 0} views
                        </span>
                        <span className="flex items-center gap-1.5 bg-[var(--surface2)] px-2 py-1 rounded-md">
                          <i className="ti ti-check text-[var(--green)] text-base" /> {gig.completions || 0} done
                        </span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <div className="flex md:flex-col gap-3 items-center md:items-end justify-center md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-[var(--border)] pt-5 md:pt-0 md:pl-5">
                        <button className="text-xs px-4 py-2 font-bold text-[var(--text)] bg-[var(--surface2)] border border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--text-muted)] rounded-lg shadow-sm transition-all w-full md:w-32 text-center flex justify-center items-center gap-2">
                          <i className="ti ti-edit" /> Edit
                        </button>
                        <button className="text-xs px-4 py-2 font-bold text-[var(--red)] bg-transparent border border-[var(--red)] border-opacity-50 hover:bg-[var(--red-bg)] hover:border-opacity-100 rounded-lg transition-all w-full md:w-32 text-center flex justify-center items-center gap-2">
                          <i className="ti ti-ban" /> Unpublish
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXCHANGES TAB */}
        {activeTab === 'exchanges' && (
          <div className="flex flex-col gap-10">
            {exchangeRequests.received.length === 0 && exchangeRequests.sent.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-[var(--border)] rounded-2xl text-center bg-[var(--surface)] bg-opacity-30">
                <div className="w-20 h-20 bg-[var(--surface2)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <i className="ti ti-arrows-exchange text-4xl text-[var(--text-muted)]" />
                </div>
                <h4 className="text-lg font-bold text-[var(--text)] mb-2">No exchange requests</h4>
                <p className="text-[var(--text-muted)] font-medium">You haven't sent or received any requests yet.</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/skill-exchange')}
                    className="mt-6 btn-secondary px-6 py-2.5 font-bold shadow-sm"
                  >
                    Browse Skill Exchanges
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Received */}
                {exchangeRequests.received.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
                      <i className="ti ti-inbox text-[var(--accent)] text-2xl" /> Received Requests
                      <span className="bg-[var(--accent-dim)] text-[var(--accent-light)] text-xs px-2 py-0.5 rounded-full ml-2">{exchangeRequests.received.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-5">
                      {exchangeRequests.received.map(req => (
                        <div key={req._id} className={`bg-[var(--surface)] border rounded-2xl p-6 flex flex-col md:flex-row gap-6 transition-all hover:shadow-md ${
                          req.status === 'pending' ? 'border-[var(--accent)] border-opacity-50 shadow-[0_0_20px_rgba(83,74,183,0.05)]' : 
                          req.status === 'accepted' ? 'border-[var(--green)] border-opacity-50' : 'border-[var(--border)] opacity-80'
                        }`}>
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--surface2)] to-[var(--border)] flex items-center justify-center text-[var(--text)] text-xl font-bold flex-shrink-0 shadow-inner border border-[var(--border)]">
                            {(req.fromEmail?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                              <h4 className="text-base font-bold text-[var(--text)]">
                                <span className="text-[var(--text-muted)] font-medium mr-1">From:</span>
                                {req.fromName || req.fromEmail?.split('@')[0] || 'Unknown'}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                                req.status === 'pending' ? 'bg-[var(--accent-dim)] text-[var(--accent-light)] border-[var(--accent)] border-opacity-20' : 
                                req.status === 'accepted' ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)] border-opacity-20' : 
                                'bg-[var(--surface2)] text-[var(--text-muted)] border-[var(--border)]'
                              }`}>
                                {req.status === 'rejected' ? 'Declined' : req.status}
                              </span>
                            </div>
                            <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--border-subtle)] mb-4 text-sm font-medium text-[var(--text)] italic leading-relaxed relative">
                              <i className="ti ti-quote absolute text-3xl text-[var(--surface2)] -top-2 -left-1 opacity-50" />
                              <span className="relative z-10">"{req.message}"</span>
                            </div>
                            <div className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                              <span className="flex items-center gap-1.5">
                                <i className="ti ti-clock text-base" /> {new Date(req.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <div className="flex gap-3">
                                {req.status === 'pending' && (
                                  <>
                                    <button onClick={() => handleUpdateRequest(req._id, 'accepted')} className="btn-primary text-xs px-5 py-2 rounded-lg font-bold shadow-md hover:shadow-lg flex items-center gap-1.5">
                                      <i className="ti ti-check text-base" /> Accept
                                    </button>
                                    <button onClick={() => handleUpdateRequest(req._id, 'rejected')} className="bg-transparent border border-[var(--red)] border-opacity-50 text-[var(--red)] text-xs px-5 py-2 rounded-lg font-bold hover:bg-[var(--red-bg)] hover:border-opacity-100 transition-all flex items-center gap-1.5">
                                      <i className="ti ti-x text-base" /> Decline
                                    </button>
                                  </>
                                )}
                                {req.status === 'accepted' && (
                                  <button onClick={() => {
                                    if (req.chatRoomId) {
                                      navigate('/chat', { state: { roomId: req.chatRoomId } })
                                    } else {
                                      const otherEmail = isOwnProfile ? (req.toEmail || req.fromEmail) : req.fromEmail
                                      navigate('/chat', otherEmail ? { state: { selectPerson: otherEmail } } : undefined)
                                    }
                                  }} className="bg-[var(--green)] text-white text-xs px-5 py-2.5 rounded-lg font-bold hover:bg-green-600 transition-all shadow-md flex items-center gap-2">
                                    <i className="ti ti-messages text-base" /> Message User
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent */}
                {exchangeRequests.sent.length > 0 && (
                  <div className="flex flex-col gap-4 mt-4">
                    <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
                      <i className="ti ti-send text-[var(--text-muted)] text-2xl" /> Sent Requests
                      <span className="bg-[var(--surface2)] text-[var(--text-muted)] text-xs px-2 py-0.5 rounded-full ml-2 border border-[var(--border)]">{exchangeRequests.sent.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {exchangeRequests.sent.map(req => (
                        <div key={req._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col sm:flex-row gap-5 opacity-90 hover:opacity-100 transition-opacity">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                              <h4 className="text-sm font-bold text-[var(--text)]">
                                <span className="text-[var(--text-muted)] font-medium mr-1">To:</span> 
                                {req.toName || req.toEmail?.split('@')[0] || req.toUserId || 'Unknown User'}
                              </h4>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                                req.status === 'pending' ? 'bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber)] border-opacity-30' : 
                                req.status === 'accepted' ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)] border-opacity-30' : 
                                'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red)] border-opacity-30'
                              }`}>
                                {req.status === 'rejected' ? 'Declined' : req.status}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-[var(--text-muted)] mb-3 line-clamp-2 leading-relaxed bg-[var(--surface2)] p-3 rounded-lg border border-[var(--border-subtle)]">
                              "{req.message}"
                            </p>
                            <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider flex items-center gap-1.5">
                              <i className="ti ti-calendar-time text-sm" />
                              Sent on {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <i className="ti ti-star text-[var(--amber)] text-2xl" /> Reviews & Feedback
            </h3>
            {reviews.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-[var(--border)] rounded-2xl text-center bg-[var(--surface)] bg-opacity-30">
                <div className="w-20 h-20 bg-[var(--surface2)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <i className="ti ti-message-star text-4xl text-[var(--text-muted)]" />
                </div>
                <h4 className="text-lg font-bold text-[var(--text)] mb-2">No reviews yet</h4>
                <p className="text-[var(--text-muted)] font-medium">Complete your first session to receive a review.</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/skill-exchange')}
                    className="mt-6 btn-secondary px-6 py-2.5 font-bold shadow-sm"
                  >
                    Find a Skill Exchange Partner
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--surface2)] to-[var(--border)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center font-bold text-lg shadow-inner">
                          {(review.reviewerName || review.reviewerEmail || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--text)]">
                            {review.reviewerName || review.reviewerEmail?.split('@')[0]}
                          </div>
                          <div className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 bg-[var(--surface2)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                        {[1, 2, 3, 4, 5].map(star => (
                          <i key={star} className={`text-sm ${star <= (review.rating || 0) ? 'ti ti-star-filled text-[var(--amber)] drop-shadow-sm' : 'ti ti-star text-[var(--border)]'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 bg-[var(--bg)] rounded-xl p-4 border border-[var(--border-subtle)]">
                      {review.feedback ? (
                        <p className="text-sm font-medium text-[var(--text)] leading-relaxed italic relative">
                          "{review.feedback}"
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-[var(--text-dim)] italic flex items-center gap-2">
                          <i className="ti ti-info-circle" /> No written review — rating only.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[var(--text)]">Edit profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <i className="ti ti-x text-lg" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] mb-1.5 block">Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-2.5 focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] mb-1.5 block">Location</label>
                <input
                  value={editForm.location}
                  onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country or Remote"
                  className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-2.5 focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] mb-1.5 block">Skills <span className="font-normal opacity-70">(comma separated)</span></label>
                <input
                  value={editForm.skills}
                  onChange={e => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, Node.js, MongoDB..."
                  className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-2.5 focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="flex-1 text-sm font-bold py-2.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 hover:bg-opacity-90 transition-opacity"
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-5 text-sm font-bold py-2.5 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
