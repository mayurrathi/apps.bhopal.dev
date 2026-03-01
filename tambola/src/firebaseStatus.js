/**
 * firebaseStatus.js
 * Detects whether Firebase is available and reachable.
 * If Firebase config is 'demo' or auth fails, we are in OFFLINE mode.
 *
 * Components import `isFirebaseAvailable()` to gate features.
 */

import { getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

let _firebaseAvailable = null; // null = unknown, true/false = resolved

/**
 * Check if Firebase is actually available and configured with a real project.
 * Caches the result after first check.
 * @returns {Promise<boolean>}
 */
export const checkFirebaseAvailability = async () => {
    if (_firebaseAvailable !== null) return _firebaseAvailable;

    try {
        const apps = getApps();
        if (!apps.length) { _firebaseAvailable = false; return false; }

        const config = apps[0].options;
        // If using demo/placeholder config, Firebase is not available
        if (!config.apiKey || config.apiKey === 'demo' || config.projectId === 'demo') {
            _firebaseAvailable = false;
            return false;
        }

        // Try anonymous auth as a connection test (with timeout)
        const auth = getAuth(apps[0]);
        const result = await Promise.race([
            signInAnonymously(auth).then(() => true).catch(() => false),
            new Promise(resolve => setTimeout(() => resolve(false), 5000)), // 5s timeout
        ]);

        _firebaseAvailable = result;
        return result;
    } catch (e) {
        console.warn('Firebase availability check failed:', e);
        _firebaseAvailable = false;
        return false;
    }
};

/**
 * Synchronous getter — returns the last known state.
 * Returns false if not yet checked.
 */
export const isFirebaseAvailable = () => _firebaseAvailable === true;

/**
 * Subscribe to availability changes (simple callback).
 */
export const onFirebaseStatusChange = (callback) => {
    checkFirebaseAvailability().then(callback);
};
