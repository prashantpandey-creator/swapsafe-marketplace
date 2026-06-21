import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader, Globe, UserCheck } from 'lucide-react';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComposePost from '../components/community/ComposePost';
import PostCard from '../components/community/PostCard';

function Community() {
    const { isAuthenticated } = useAuth();
    const [scope, setScope] = useState('global');
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const load = useCallback(async (nextScope, nextPage) => {
        const first = nextPage === 1;
        first ? setLoading(true) : setLoadingMore(true);
        try {
            const res = await communityAPI.getFeed({ scope: nextScope, page: nextPage });
            setPosts((prev) => (first ? res.posts : [...prev, ...res.posts]));
            setHasMore(res.hasMore);
            setPage(nextPage);
        } catch (_) {
            if (first) setPosts([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => { load(scope, 1); }, [scope, load]);

    const handlePosted = (post, autoFlagged) => {
        // Auto-flagged posts are hidden from the public feed — don't prepend.
        if (!autoFlagged && post) setPosts((prev) => [post, ...prev]);
    };

    const handleDeleted = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

    const tabs = [
        { key: 'global', label: 'Discover', icon: Globe },
        ...(isAuthenticated ? [{ key: 'following', label: 'Following', icon: UserCheck }] : []),
    ];

    return (
        <div className="min-h-screen px-4 pt-24 pb-24">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-xl"
            >
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-5">
                    <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-[var(--m-surface)] border border-[var(--m-hairline)]">
                        <Users size={18} className="text-[var(--m-accent)]" />
                    </span>
                    <h1 className="text-xl font-semibold tracking-tight text-[var(--m-fg)]">Community</h1>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-4 border-b border-[var(--m-hairline)]">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setScope(t.key)}
                            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors ${scope === t.key ? 'text-[var(--m-fg)]' : 'text-[var(--m-fg-muted)] hover:text-[var(--m-fg)]'}`}
                        >
                            <t.icon size={15} /> {t.label}
                            {scope === t.key && <span className="absolute left-3 right-3 bottom-[-1px] h-[1.5px] bg-[var(--m-accent)] rounded" />}
                        </button>
                    ))}
                </div>

                {/* Compose */}
                <div className="mb-4">
                    <ComposePost onPosted={handlePosted} />
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader className="animate-spin text-[var(--m-fg-subtle)]" size={28} />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 text-[var(--m-fg-muted)] text-sm">
                        {scope === 'following'
                            ? 'Follow members to see their posts here.'
                            : 'No posts yet — be the first to share something.'}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.map((p) => (
                            <PostCard key={p._id} post={p} onDeleted={handleDeleted} />
                        ))}
                        {hasMore && (
                            <button
                                onClick={() => load(scope, page + 1)}
                                disabled={loadingMore}
                                className="m-btn-ghost w-full justify-center mt-2"
                            >
                                {loadingMore ? <Loader size={15} className="animate-spin" /> : 'Load more'}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default Community;
