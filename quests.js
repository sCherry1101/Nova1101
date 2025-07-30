const questsModule = (() => {
    const db = window.db;

    const addQuest = async (userId, title, xpReward) => {
        if (!userId) {
            return;
        }
        try {
            await db.collection('users').doc(userId).collection('quests').add({
                title: title,
                xpReward: xpReward,
                isCompleted: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            ui.showMessage("Error adding quest: " + error.message);
        }
    };

    const completeQuest = async (userId, questId, xpReward) => {
        if (!userId || !questId) {
            return;
        }
        try {
            const questRef = db.collection('users').doc(userId).collection('quests').doc(questId);
            await questRef.update({
                isCompleted: true,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (window.mainModule && typeof window.mainModule.gainXP === 'function') {
                await window.mainModule.gainXP(xpReward);
                ui.showMessage(`Quest completed! You gained ${xpReward} XP!`);
            }
        } catch (error) {
            ui.showMessage("Error completing quest: " + error.message);
        }
    };

    const deleteQuest = async (userId, questId) => {
        if (!userId || !questId) {
            return;
        }
        try {
            await db.collection('users').doc(userId).collection('quests').doc(questId).delete();
            ui.showMessage("Quest deleted.");
        } catch (error) {
            ui.showMessage("Error deleting quest: " + error.message);
        }
    };

    const listenForQuests = (userId, callback) => {
        if (!userId) {
            return () => {};
        }
        const questCollectionRef = db.collection('users').doc(userId).collection('quests');

        const unsubscribe = questCollectionRef.onSnapshot(snapshot => {
            const quests = [];
            snapshot.forEach(doc => {
                quests.push({ id: doc.id, ...doc.data() });
            });
            quests.sort((a, b) => {
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }
                const aTime = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt.seconds * 1000) : 0;
                const bTime = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt.seconds * 1000) : 0;
                return bTime - aTime;
            });
            callback(quests);
        }, error => {
            ui.showMessage("Error loading quests: " + error.message);
        });

        return unsubscribe;
    };

    return {
        addQuest,
        completeQuest,
        deleteQuest,
        listenForQuests
    };
})();
