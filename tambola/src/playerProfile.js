/**
 * playerProfile.js
 * Zero-friction guest profile system.
 * Auto-generates a guest identity on first visit — no sign-in required.
 */

const PROFILE_KEY = 'tambola_player_profile';

const FUN_NAMES = [
    'Lucky Star', 'Golden Tiger', 'Silver Fox', 'Diamond King',
    'Happy Panda', 'Brave Lion', 'Cool Cat', 'Swift Eagle',
    'Magic Mango', 'Desi Player', 'Number Boss', 'Bingo Guru',
    'Ticket Master', 'House Hunter', 'Prize Chaser', 'Royal Flush',
    'Full House', 'Top Liner', 'Quick Draw', 'Sharp Shooter',
];

/**
 * Generate a random fun guest name.
 */
const randomName = () => {
    const idx = Math.floor(Math.random() * FUN_NAMES.length);
    return FUN_NAMES[idx];
};

/**
 * Generate a unique guest ID using crypto API.
 */
const generateGuestId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `guest_${crypto.randomUUID()}`;
    }
    // Fallback for older browsers
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Get the player profile from localStorage.
 * If none exists, auto-create one with zero friction.
 * @returns {{ id: string, nickname: string, avatar: string, gamesPlayed: number, wins: number, createdAt: string }}
 */
export const getProfile = () => {
    try {
        const stored = localStorage.getItem(PROFILE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn('[Profile] Failed to load:', e);
    }

    // Auto-create guest profile — zero friction
    const profile = {
        id: generateGuestId(),
        nickname: randomName(),
        avatar: '🎲',
        gamesPlayed: 0,
        wins: 0,
        createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    return profile;
};

/**
 * Save profile to localStorage.
 */
const saveProfile = (profile) => {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.warn('[Profile] Failed to save:', e);
    }
};

/**
 * Update the player's nickname.
 */
export const updateNickname = (name) => {
    const profile = getProfile();
    profile.nickname = name.trim() || randomName();
    saveProfile(profile);
    return profile;
};

/**
 * Update the player's avatar emoji.
 */
export const updateAvatar = (emoji) => {
    const profile = getProfile();
    profile.avatar = emoji;
    saveProfile(profile);
    return profile;
};

/**
 * Increment games played counter.
 */
export const incrementGames = () => {
    const profile = getProfile();
    profile.gamesPlayed += 1;
    saveProfile(profile);
    return profile;
};

/**
 * Increment wins counter.
 */
export const incrementWins = () => {
    const profile = getProfile();
    profile.wins += 1;
    saveProfile(profile);
    return profile;
};

/**
 * Reset the profile entirely (for testing).
 */
export const resetProfile = () => {
    localStorage.removeItem(PROFILE_KEY);
    return getProfile();
};
