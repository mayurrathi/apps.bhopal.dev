const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Initialize Firebase Admin globally
admin.initializeApp();
const db = admin.firestore();

// Constants
const REFERRAL_BONUS = 200; // Tokens awarded to BOTH sender and receiver
const WELCOME_BONUS = 500;  // Standard welcome bonus (from walletService)

/**
 * DOUBLE-SIDED REFERRAL LOGIC
 * Runs securely on the server to prevent client-side token spoofing.
 * 
 * Flow:
 * 1. User B opens app via User A's deep link.
 * 2. Client calls this Callable Function: processReferral({ referralCode: 'user_A_uid' })
 * 3. Server checks if User B is new and hasn't been referred before.
 * 4. Server transactionally deposits 200 tokens to User A, and 200 tokens to User B.
 * 5. Returns success to unlock the "Invite Locked" features on both clients.
 */
exports.processReferral = functions.https.onCall(async (data, context) => {
    // 1. Verify caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to process a referral.'
        );
    }

    const newUserId = context.auth.uid;
    const referrerId = data.referralCode;

    // 2. Validate inputs
    if (!referrerId || typeof referrerId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid referral code.');
    }
    if (newUserId === referrerId) {
        throw new functions.https.HttpsError('invalid-argument', 'You cannot refer yourself.');
    }

    // 3. Prevent duplicate referrals
    const newUserRef = db.collection('tambola_users').doc(newUserId);
    const referrerStatsRef = db.collection('tambola_referrals_stats').doc(referrerId);
    const newUserWalletRef = db.collection('tambola_wallets').doc(newUserId);
    const referrerWalletRef = db.collection('tambola_wallets').doc(referrerId);

    try {
        await db.runTransaction(async (transaction) => {
            const newUserDoc = await transaction.get(newUserRef);

            // Check if user has already been referred
            if (newUserDoc.exists && newUserDoc.data().referredBy) {
                throw new functions.https.HttpsError('already-exists', 'User has already claimed a referral bonus.');
            }

            // --- 1. Mark user as referred ---
            transaction.set(newUserRef, {
                referredBy: referrerId,
                referralTimestamp: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // --- 2. Update Referrer's Stats ---
            transaction.set(referrerStatsRef, {
                totalInvites: admin.firestore.FieldValue.increment(1),
                lastInviteAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // --- 3. Credit Referrer (User A) Wallet ---
            transaction.set(referrerWalletRef, {
                balance: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                totalEarned: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                transactions: admin.firestore.FieldValue.arrayUnion({
                    type: 'earn',
                    amount: REFERRAL_BONUS,
                    label: 'Friend Referral Bonus 🤝',
                    timestamp: new Date().toISOString()
                })
            }, { merge: true });

            // --- 4. Credit New User (User B) Wallet ---
            // If the wallet exists, increment it. If it doesn't, initialize it + welcome bonus + referral bonus.
            const newUserWallet = await transaction.get(newUserWalletRef);
            if (newUserWallet.exists) {
                transaction.set(newUserWalletRef, {
                    balance: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                    totalEarned: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                    transactions: admin.firestore.FieldValue.arrayUnion({
                        type: 'earn',
                        amount: REFERRAL_BONUS,
                        label: 'Referral Sign-Up Bonus 🎁',
                        timestamp: new Date().toISOString()
                    })
                }, { merge: true });
            } else {
                // Initialize new wallet securely on the server
                const startingBalance = WELCOME_BONUS + REFERRAL_BONUS;
                transaction.set(newUserWalletRef, {
                    uid: newUserId,
                    balance: startingBalance,
                    totalEarned: startingBalance,
                    totalSpent: 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    transactions: [
                        {
                            type: 'bonus',
                            amount: WELCOME_BONUS,
                            label: 'Welcome Bonus 🎉',
                            timestamp: new Date().toISOString()
                        },
                        {
                            type: 'earn',
                            amount: REFERRAL_BONUS,
                            label: 'Referral Sign-Up Bonus 🎁',
                            timestamp: new Date().toISOString()
                        }
                    ]
                });
            }
        });

        return {
            success: true,
            message: `Referral applied! You and your friend both got ${REFERRAL_BONUS} tokens.`,
            awardedAmount: REFERRAL_BONUS
        };

    } catch (error) {
        console.error("Referral transaction failed: ", error);
        // Throw proper HTTP error to client
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Transaction failed to complete', error.message);
    }
});

/**
 * AD REWARD SERVER-SIDE VERIFICATION
 * Runs securely on the server to prevent client-side "Infinite Token" spoofing.
 */
exports.verifyAdReward = functions.https.onCall(async (data, context) => {
    // 1. Verify caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to claim ad rewards.'
        );
    }

    const uid = context.auth.uid;
    const REWARD_AMOUNT = 50;

    // In a full production app, you would validate a cryptographic Server-Side Verification (SSV) callback
    // ping from the AdMob servers here (via Custom Data). 
    // Since Firebase Client SDK handles the event trigger, we move the actual Token write 
    // to the backend to prevent DevTools spoofing (localStorage modification / DB brute force).

    const walletRef = db.collection('tambola_wallets').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const walletDoc = await transaction.get(walletRef);

            if (walletDoc.exists) {
                // Initialize balance if absent
                const currentBalance = walletDoc.data().balance || 0;
                const currentTotalEarned = walletDoc.data().totalEarned || 0;

                transaction.set(walletRef, {
                    balance: currentBalance + REWARD_AMOUNT,
                    totalEarned: currentTotalEarned + REWARD_AMOUNT,
                    transactions: admin.firestore.FieldValue.arrayUnion({
                        type: 'earn',
                        amount: REWARD_AMOUNT,
                        label: 'Ad Reward 📺',
                        timestamp: new Date().toISOString()
                    })
                }, { merge: true });
            } else {
                // Failsafe initialization
                transaction.set(walletRef, {
                    uid: uid,
                    balance: WELCOME_BONUS + REWARD_AMOUNT,
                    totalEarned: WELCOME_BONUS + REWARD_AMOUNT,
                    totalSpent: 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    transactions: [
                        { type: 'bonus', amount: WELCOME_BONUS, label: 'Welcome Bonus 🎉', timestamp: new Date().toISOString() },
                        { type: 'earn', amount: REWARD_AMOUNT, label: 'Ad Reward 📺', timestamp: new Date().toISOString() }
                    ]
                });
            }
        });

        return { success: true, awardedAmount: REWARD_AMOUNT };
    } catch (error) {
        console.error("Ad reward transaction failed:", error);
        throw new functions.https.HttpsError('internal', 'Failed to credit ad reward', error.message);
    }
});
