// Job Status Polling Hook - React hook for monitoring async AI job progress
import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Hook to poll job status and track progress
 * @param {string} jobId - The job ID to track
 * @param {Object} options - { interval, enabled, onComplete, onError }
 */
export function useJobStatus(jobId, options = {}) {
    const {
        interval = 2000,
        enabled = true,
        type = '3d',
        onComplete,
        onError
    } = options;

    const [status, setStatus] = useState('idle'); // idle, polling, completed, failed
    const [progress, setProgress] = useState(0);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchStatus = useCallback(async () => {
        if (!jobId) return;

        try {
            const token = localStorage.getItem('swapsafe_token');
            const response = await fetch(`${API_URL}/jobs/${jobId}/status?type=${type}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.status === 'completed') {
                setStatus('completed');
                setProgress(100);
                setData(result.data);
                onComplete?.(result.data);
                return true; // Stop polling
            } else if (result.status === 'failed') {
                setStatus('failed');
                setError(result.error);
                onError?.(result.error);
                return true; // Stop polling
            } else if (result.status === 'active' || result.status === 'waiting') {
                setStatus('polling');
                setProgress(result.progress || 0);
                return false; // Continue polling
            }

            return false;
        } catch (err) {
            console.error('Job status fetch error:', err);
            setError(err.message);
            return false;
        }
    }, [jobId, type, onComplete, onError]);

    useEffect(() => {
        if (!enabled || !jobId) {
            setStatus('idle');
            return;
        }

        setStatus('polling');
        let pollInterval;
        let stopped = false;

        const poll = async () => {
            const shouldStop = await fetchStatus();
            if (!stopped && !shouldStop) {
                pollInterval = setTimeout(poll, interval);
            }
        };

        poll();

        return () => {
            stopped = true;
            clearTimeout(pollInterval);
        };
    }, [jobId, enabled, interval, fetchStatus]);

    return { status, progress, data, error };
}

/**
 * Component to display job processing status with visual feedback
 */
export function JobStatusIndicator({ jobId, type = '3d', onComplete }) {
    const { status, progress, data, error } = useJobStatus(jobId, {
        enabled: !!jobId,
        type,
        onComplete
    });

    if (!jobId) return null;

    const statusMessages = {
        idle: 'Waiting...',
        polling: 'Processing...',
        completed: 'Complete!',
        failed: 'Failed'
    };

    const statusColors = {
        idle: 'text-gray-400',
        polling: 'text-[var(--legion-gold)]',
        completed: 'text-[var(--signal-green)]',
        failed: 'text-[var(--signal-red)]'
    };

    return (
        <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">JOB_{jobId.slice(-8).toUpperCase()}</span>
                <span className={`text-sm font-bold ${statusColors[status]}`}>
                    {statusMessages[status]}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[var(--legion-gold)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Progress Text */}
            <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>{progress}%</span>
                {status === 'polling' && (
                    <span className="animate-pulse">⏳ Estimated: 30s</span>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                    {error}
                </div>
            )}

            {/* Success Data */}
            {data?.modelUrl && (
                <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded font-mono">
                    ✓ Model ready: {data.polyCount?.toLocaleString()} polys
                </div>
            )}
        </div>
    );
}

export default { useJobStatus, JobStatusIndicator };
