import React, { useState, useRef } from 'react';
import { ImagePlus, X, Loader, Send } from 'lucide-react';
import { communityAPI, uploadImage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const KINDS = [
    { value: 'general', label: 'Post' },
    { value: 'just_listed', label: 'Just listed' },
    { value: 'looking_for', label: 'Looking for' },
    { value: 'swap_story', label: 'Swap story' },
];

const ComposePost = ({ onPosted }) => {
    const { user, isAuthenticated } = useAuth();
    const { error, success } = useToast();
    const fileRef = useRef(null);

    const [text, setText] = useState('');
    const [kind, setKind] = useState('general');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="rounded-[12px] border border-[var(--m-hairline)] bg-[var(--m-surface)] p-4 text-center text-sm text-[var(--m-fg-muted)]">
                Log in to share with the community.
            </div>
        );
    }

    const pickImage = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImageFile(f);
        setImagePreview(URL.createObjectURL(f));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (fileRef.current) fileRef.current.value = '';
    };

    const submit = async () => {
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            let imageUrl = '';
            if (imageFile) imageUrl = await uploadImage(imageFile);

            const res = await communityAPI.createPost({ text: text.trim(), image: imageUrl, kind });
            setText('');
            setKind('general');
            clearImage();

            if (res.autoFlagged) {
                success('Posted — under quick review before it appears publicly.');
            }
            onPosted && onPosted(res.post, res.autoFlagged);
        } catch (e) {
            error(e.message || 'Could not post');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rounded-[12px] border border-[var(--m-hairline)] bg-[var(--m-surface)] p-4">
            <div className="flex gap-3">
                <span className="w-9 h-9 rounded-full overflow-hidden bg-[var(--m-surface-strong)] flex items-center justify-center shrink-0">
                    {user?.avatar
                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sm text-[var(--m-fg-muted)]">{(user?.name || '?')[0]}</span>}
                </span>
                <div className="flex-1 min-w-0">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={1000}
                        rows={2}
                        placeholder="Share a find, a swap, or what you're looking for…"
                        className="w-full bg-transparent text-[15px] text-[var(--m-fg)] placeholder:text-[var(--m-fg-subtle)] resize-none outline-none"
                    />

                    {imagePreview && (
                        <div className="relative mt-2 inline-block">
                            <img src={imagePreview} alt="" className="max-h-48 rounded-[10px] border border-[var(--m-hairline)]" />
                            <button onClick={clearImage} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center">
                                <X size={15} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <button onClick={() => fileRef.current?.click()} className="m-iconbtn" style={{ width: 34, height: 34 }} aria-label="Add image">
                                <ImagePlus size={18} />
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
                            <select
                                value={kind}
                                onChange={(e) => setKind(e.target.value)}
                                className="bg-[var(--m-surface-strong)] text-[var(--m-fg-muted)] text-xs rounded-[8px] px-2 py-1.5 outline-none border border-[var(--m-hairline)]"
                            >
                                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={submit}
                            disabled={!text.trim() || submitting}
                            className="m-btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ height: 34 }}
                        >
                            {submitting ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                            <span>Post</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComposePost;
