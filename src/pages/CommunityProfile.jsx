import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, BadgeCheck, MapPin, Shield } from 'lucide-react';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/community/PostCard';

function CommunityProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { info, error } = useToast();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await communityAPI.getProfile(id);
                setData(res);
                setFollowing(res.isFollowing);
                setFollowerCount(res.stats.followerCount);
            } catch (_) {
                setData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const toggleFollow = async () => {
        if (!isAuthenticated) return info('Log in to follow members');
        setBusy(true);
        const next = !following;
        setFollowing(next);
        setFollowerCount((c) => c + (next ? 1 : -1));
        try {
            const res = await communityAPI.toggleFollow(id);
            setFollowing(res.following);
            if (typeof res.followerCount === 'number') setFollowerCount(res.followerCount);
        } catch (e) {
            setFollowing(!next);
            setFollowerCount((c) => c + (next ? -1 : 1));
            error(e.message || 'Could not update follow');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-[var(--m-fg-subtle)]" size={28} /></div>;
    }
    if (!data) {
        return <div className="min-h-screen flex items-center justify-center text-[var(--m-fg-muted)] text-sm">Member not found.</div>;
    }

    const { user, stats, isMe, posts } = data;

    return (
        <div className="min-h-screen px-4 pt-24 pb-24">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[var(--m-fg-subtle)] hover:text-[var(--m-fg)] transition-colors mb-5">
                    <ArrowLeft size={14} /> Back
                </button>

                {/* Profile header */}
                <div className="rounded-[12px] border border-[var(--m-hairline)] bg-[var(--m-surface)] p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-16 h-16 rounded-full overflow-hidden bg-[var(--m-surface-strong)] flex items-center justify-center shrink-0">
                                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl text-[var(--m-fg-muted)]">{(user.name || '?')[0]}</span>}
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-lg font-semibold text-[var(--m-fg)] truncate">{user.name}</h1>
                                    {user.isVerified && <BadgeCheck size={17} className="text-[var(--m-accent)] shrink-0" />}
                                </div>
                                {user.trustLevel && user.trustLevel !== 'Unverified' && (
                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--m-fg-muted)] mt-0.5">
                                        <Shield size={12} className="text-[var(--m-accent)]" /> {user.trustLevel} · {user.trustScore}/100
                                    </span>
                                )}
                                {user.location?.city && (
                                    <span className="flex items-center gap-1 text-xs text-[var(--m-fg-subtle)] mt-0.5">
                                        <MapPin size={12} /> {user.location.city}{user.location.state ? `, ${user.location.state}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {isMe ? (
                            <Link to="/settings" className="m-btn-ghost shrink-0">Edit</Link>
                        ) : (
                            <button onClick={toggleFollow} disabled={busy} className={following ? 'm-btn-ghost shrink-0' : 'm-btn-accent shrink-0'}>
                                {following ? 'Following' : 'Follow'}
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--m-hairline)]">
                        <span className="text-sm"><span className="font-semibold text-[var(--m-fg)]">{stats.postCount}</span> <span className="text-[var(--m-fg-muted)]">posts</span></span>
                        <span className="text-sm"><span className="font-semibold text-[var(--m-fg)]">{followerCount}</span> <span className="text-[var(--m-fg-muted)]">followers</span></span>
                        <span className="text-sm"><span className="font-semibold text-[var(--m-fg)]">{stats.followingCount}</span> <span className="text-[var(--m-fg-muted)]">following</span></span>
                        {typeof user.totalSales === 'number' && user.totalSales > 0 && (
                            <span className="text-sm"><span className="font-semibold text-[var(--m-fg)]">{user.totalSales}</span> <span className="text-[var(--m-fg-muted)]">sales</span></span>
                        )}
                    </div>
                </div>

                {/* Their posts */}
                <div className="mt-4 space-y-3">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 text-[var(--m-fg-muted)] text-sm">No posts yet.</div>
                    ) : (
                        posts.map((p) => <PostCard key={p._id} post={p} />)
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default CommunityProfile;
