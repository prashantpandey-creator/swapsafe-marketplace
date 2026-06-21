import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2, BadgeCheck, Tag } from 'lucide-react';
import { communityAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const KIND_LABEL = {
    just_listed: 'Just listed',
    looking_for: 'Looking for',
    swap_story: 'Swap story',
    review: 'Review',
};

// Relative time, dependency-free.
function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(date).toLocaleDateString();
}

const PostCard = ({ post, onDeleted }) => {
    const { user, isAuthenticated } = useAuth();
    const { success, error, info } = useToast();

    const [liked, setLiked] = useState(post.likedByMe || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [removed, setRemoved] = useState(false);

    if (removed) return null;

    const author = post.author || {};
    const isMine = user && author._id === user.id;

    const handleLike = async () => {
        if (!isAuthenticated) return info('Log in to like posts');
        // optimistic
        const next = !liked;
        setLiked(next);
        setLikeCount((c) => c + (next ? 1 : -1));
        try {
            const res = await communityAPI.likePost(post._id);
            setLiked(res.liked);
            setLikeCount(res.likeCount);
        } catch (_) {
            setLiked(!next);
            setLikeCount((c) => c + (next ? -1 : 1));
        }
    };

    const handleReport = async () => {
        setMenuOpen(false);
        if (!isAuthenticated) return info('Log in to report');
        try {
            await communityAPI.reportPost(post._id);
            success('Reported. Thanks for keeping the community safe.');
        } catch (e) {
            error(e.message || 'Could not report');
        }
    };

    const handleDelete = async () => {
        setMenuOpen(false);
        try {
            await communityAPI.deletePost(post._id);
            setRemoved(true);
            onDeleted && onDeleted(post._id);
        } catch (e) {
            error(e.message || 'Could not delete');
        }
    };

    return (
        <article className="rounded-[12px] border border-[var(--m-hairline)] bg-[var(--m-surface)] p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <Link to={`/u/${author._id}`} className="flex items-center gap-2.5 group min-w-0">
                    <span className="w-9 h-9 rounded-full overflow-hidden bg-[var(--m-surface-strong)] flex items-center justify-center shrink-0">
                        {author.avatar
                            ? <img src={author.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-sm text-[var(--m-fg-muted)]">{(author.name || '?')[0]}</span>}
                    </span>
                    <span className="min-w-0">
                        <span className="flex items-center gap-1">
                            <span className="text-sm font-medium text-[var(--m-fg)] truncate group-hover:underline">
                                {author.name || 'Member'}
                            </span>
                            {author.isVerified && <BadgeCheck size={14} className="text-[var(--m-accent)] shrink-0" />}
                        </span>
                        <span className="text-xs text-[var(--m-fg-subtle)]">{timeAgo(post.createdAt)}</span>
                    </span>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                    {post.kind && post.kind !== 'general' && KIND_LABEL[post.kind] && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--m-surface-strong)] text-[var(--m-fg-muted)]">
                            {KIND_LABEL[post.kind]}
                        </span>
                    )}
                    <div className="relative">
                        <button onClick={() => setMenuOpen((o) => !o)} className="m-iconbtn" style={{ width: 30, height: 30 }} aria-label="Post menu">
                            <MoreHorizontal size={18} />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-[#0A0A0F] border border-[var(--m-hairline)] rounded-[10px] p-1 z-50 shadow-xl">
                                    {isMine ? (
                                        <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-[8px]">
                                            <Trash2 size={15} /> Delete
                                        </button>
                                    ) : (
                                        <button onClick={handleReport} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--m-fg-muted)] hover:text-[var(--m-fg)] hover:bg-[var(--m-surface)] rounded-[8px]">
                                            <Flag size={15} /> Report
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <p className="text-[15px] text-[var(--m-fg)] leading-relaxed mt-3 whitespace-pre-wrap break-words">
                {post.text}
            </p>

            {post.image && (
                <img src={post.image} alt="" className="mt-3 rounded-[10px] w-full max-h-[420px] object-cover border border-[var(--m-hairline)]" />
            )}

            {/* Attached listing */}
            {post.listing && (
                <Link to={`/product/${post.listing._id}`} className="mt-3 flex items-center gap-3 p-2.5 rounded-[10px] border border-[var(--m-hairline)] hover:bg-[var(--m-surface-strong)] transition-colors">
                    {post.listing.images?.[0] && (
                        <img src={post.listing.images[0]} alt="" className="w-12 h-12 rounded-[8px] object-cover" />
                    )}
                    <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--m-fg-subtle)]"><Tag size={12} /> Listing</span>
                        <span className="block text-sm font-medium text-[var(--m-fg)] truncate">{post.listing.title}</span>
                        <span className="text-sm text-[var(--m-accent)]">₹{post.listing.price?.toLocaleString('en-IN')}</span>
                    </span>
                </Link>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3 pt-1">
                <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[var(--m-accent)]' : 'text-[var(--m-fg-muted)] hover:text-[var(--m-fg)]'}`}>
                    <Heart size={18} className={liked ? 'fill-current' : ''} /> {likeCount > 0 && likeCount}
                </button>
                <Link to={`/community/post/${post._id}`} className="flex items-center gap-1.5 text-sm text-[var(--m-fg-muted)] hover:text-[var(--m-fg)] transition-colors">
                    <MessageCircle size={18} /> {post.commentCount > 0 && post.commentCount}
                </Link>
            </div>
        </article>
    );
};

export default PostCard;
