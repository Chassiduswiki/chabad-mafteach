import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLockOptions {
  slug: string;
  enabled?: boolean;
  onLockedByOther?: (userId: string) => void;
}

export function useTopicLock({ slug, enabled = true, onLockedByOther }: UseLockOptions) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkLockStatus = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`/api/topics/${slug}/lock`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to check lock status');

      const data = await response.json();
      setIsLocked(data.isLocked);
      setLockedBy(data.lockedBy);
      setIsOwner(data.isOwner);

      if (data.isLocked && onLockedByOther) {
        onLockedByOther(data.lockedBy);
      }
    } catch (err) {
      console.error('Lock check error:', err);
      setError('Connection lost. Please refresh.');
    }
  }, [slug, onLockedByOther]);

  const acquireLock = useCallback(async () => {
    try {
      // const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`/api/topics/${slug}/lock`, {
        // headers: {
        //   ...(token && { 'Authorization': `Bearer ${token}` }),
        // },
      });

      if (response.status === 409) {
        const data = await response.json();
        setIsLocked(true);
        setLockedBy(data.lockedBy);
        setIsOwner(false);
        if (onLockedByOther) onLockedByOther(data.lockedBy);
        return false;
      }

      if (!response.ok) throw new Error('Failed to acquire lock');

      const data = await response.json();
      setIsLocked(false);
      setIsOwner(true);
      return true;
    } catch (err) {
      console.error('Lock acquisition error:', err);
      return false;
    }
  }, [slug, onLockedByOther]);

  const releaseLock = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`/api/topics/${slug}/lock`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
    } catch (err) {
      console.error('Lock release error:', err);
    }
  }, [slug]);

  useEffect(() => {
    if (!enabled || !slug) return;

    // Initial check and acquisition
    const init = async () => {
      await checkLockStatus();
      if (!isLocked) {
        await acquireLock();
      }
    };

    init();

    // Heartbeat every 2 minutes
    lockIntervalRef.current = setInterval(() => {
      if (isOwner) {
        acquireLock();
      } else {
        checkLockStatus();
      }
    }, 2 * 60 * 1000);

    return () => {
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
      if (isOwner) releaseLock();
    };
  }, [slug, enabled, isOwner, isLocked, checkLockStatus, acquireLock, releaseLock]);

  return { isLocked, lockedBy, isOwner, error, retry: checkLockStatus };
}
