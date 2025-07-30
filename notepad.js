const notepadModule = (() => {
    const db = window.db;

    const saveNote = async (userId, content) => {
        if (!userId) {
            return;
        }
        try {
            await db.collection('users').doc(userId).collection('notepad').doc('myNote').set({
                content: content,
                lastSaved: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            ui.showMessage("Error saving note: " + error.message);
        }
    };

    const loadNote = async (userId) => {
        if (!userId) {
            return "";
        }
        try {
            const docRef = db.collection('users').doc(userId).collection('notepad').doc('myNote');
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const data = docSnap.data();
                return data.content || "";
            } else {
                return "";
            }
        } catch (error) {
            ui.showMessage("Error loading note: " + error.message);
            return "";
        }
    };

    return {
        saveNote,
        loadNote
    };
})();
