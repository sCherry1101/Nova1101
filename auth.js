const authModule = (() => {
    const auth = window.auth;
    const db = window.db;

    const generateUniqueEmail = (username) => {
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `${username.replace(/[^a-zA-Z0-9]/g, '')}_${timestamp}_${randomString}@nova.app`;
    };

    const signUp = async (username, password, realTarget, recoveryQuestion, recoveryAnswer) => {
        try {
            const usernameExists = await db.collection('users').where('username', '==', username).get();
            if (!usernameExists.empty) {
                throw new Error('Username already taken. Please choose another.');
            }

            const generatedEmail = generateUniqueEmail(username);
            const userCredential = await auth.createUserWithEmailAndPassword(generatedEmail, password);
            const user = userCredential.user;

            await db.collection('users').doc(user.uid).set({
                username: username,
                firebaseEmail: generatedEmail,
                realTarget: realTarget,
                recoveryQuestion: recoveryQuestion,
                recoveryAnswer: recoveryAnswer,
                level: 1,
                xp: 0,
                title: 'Beginner Hunter',
                currentTheme: 'default',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return userCredential;
        } catch (error) {
            throw error;
        }
    };

    const signIn = async (username, password) => {
        try {
            const userQuery = await db.collection('users').where('username', '==', username).get();
            if (userQuery.empty) {
                throw new Error('Username not found.');
            }

            const userData = userQuery.docs[0].data();
            const firebaseEmail = userData.firebaseEmail;

            const userCredential = await auth.signInWithEmailAndPassword(firebaseEmail, password);
            return userCredential;
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            throw error;
        }
    };

    const getRecoveryDetails = async (username) => {
        try {
            const userQuery = await db.collection('users').where('username', '==', username).get();
            if (userQuery.empty) {
                return null;
            }
            const userData = userQuery.docs[0].data();
            return {
                question: userData.recoveryQuestion,
                answer: userData.recoveryAnswer,
                firebaseEmail: userData.firebaseEmail
            };
        } catch (error) {
            throw error;
        }
    };

    const sendPasswordReset = async (firebaseEmail) => {
        try {
            await auth.sendPasswordResetEmail(firebaseEmail);
        } catch (error) {
            throw error;
        }
    };

    return {
        signUp,
        signIn,
        signOut,
        getRecoveryDetails,
        sendPasswordReset
    };
})();
