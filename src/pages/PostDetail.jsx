import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, Send, Trash2, BadgeCheck } from 'lucide-react';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/community/PostCard';

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
    return new Date(date).toLocaleDateString();
}

function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { error, info } = useToast();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await communityAPI.getPost(id);
                setPost(res.post);
                setComments(res.comments || []);
            } catch (_) {
                setPost(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const submitComment = async () => {
        if (!isAuthenticated) return info('Log in to comment');
        if (!text.trim()) return;
        setSending(true);
        try {
            const res = await communityAPI.addComment(id, text.trim());
            setComments((c) => [...c, res.comment]);
            setText('');
        } catch (e) {
            error(e.message || 'Could not comment');
        } finally {
            setSending(false);
        }
    };

    const deleteComment = async (cid) => {
        try {
            await communityAPI.deleteComment(cid);
            setComments((c) => c.filter((x) => x._id !== cid));
        } catch (e) {
            error(e.message || 'Could not delete');
        }
    };

    return (
        <div className="min-h-screen px-4 pt-24 pb-32">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-xl">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[var(--m-fg-subtle)] hover:text-[var(--m-fg)] transition-colors mb-5">
                    <ArrowLeft size={14} /> Back
                </button>

                {loading ? (
                    <div className="flex justify-center py-16"><Loader className="animate-spin text-[var(--m-fg-subtle)]" size={28} /></div>
                ) : !post ? (
                    <div className="text-center py-16 text-[var(--m-fg-muted)] text-sm">This post isn’t available.</div>
                ) : (
                    <>
                        <PostCard post={post} onDeleted={() => navigate('/community')} />

                        {/* Comments */}
                        <div className="mt-5 space-y-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--m-fg-subtle)] px-1">
                                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                            </p>
                            {comments.map((c) => {
                                const a = c.author || {};
                                const mine = user && a._id === user.id;
                                return (
                                    <div key={c._id} className="flex gap-2.5">
                                        <Link to={`/u/${a._id}`} className="w-8 h-8 rounded-full overflow-hidden bg-[var(--m-surface-strong)] flex items-center justify-center shrink-0">
                                            {a.avatar ? <img src={a.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-[var(--m-fg-muted)]">{(a.name || '?')[0]}</span>}
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="rounded-[10px] bg-[var(--m-surface)] border border-[var(--m-hairline)] px-3 py-2">
                                                <div className="flex items-center gap-1">
                                                    <Link to={`/u/${a._id}`} className="text-sm font-medium text-[var(--m-fg)] hover:underline">{a.name || 'Member'}</Link>
                                                    {a.isVerified && <BadgeCheck size={13} className="text-[var(--m-accent)]" />}
                                                    <span className="text-xs text-[var(--m-fg-subtle)] ml-1">{timeAgo(c.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-[var(--m-fg)] mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
                                            </div>
                                        </div>
                                        {mine && (
                                            <button onClick={() => deleteComment(c._id)} className="m-iconbtn shrink-0" style={{ width: 30, height: 30 }} aria-label="Delete comment">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </motion.div>

            {/* Comment composer (sticky bottom) */}
            {post && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--m-hairline)] bg-[var(--m-bar-bg)] backdrop-blur-xl"
                     style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                    <div className="mx-auto max-w-xl px-4 py-3 flex items-center gap-2">
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                            placeholder={isAuthenticated ? 'Add a comment…' : 'Log in to comment'}
                            disabled={!isAuthenticated}
                            className="flex-1 bg-[var(--m-surface)] border border-[var(--m-hairline)] rounded-[10px] px-3 py-2.5 text-sm text-[var(--m-fg)] placeholder:text-[var(--m-fg-subtle)] outline-none focus:border-[var(--m-accent)]/40"
                        />
                        <button onClick={submitComment} disabled={!text.trim() || sending} className="m-btn-accent disabled:opacity-40" style={{ height: 40 }}>
                            {sending ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PostDetail;
