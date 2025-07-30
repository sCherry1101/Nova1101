window.mainModule = (() => {
    const auth = window.auth;
    const db = window.db;
    const rtdb = window.rtdb;

    let currentUser = null;
    let unsubscribeQuestListener = null;
    let unsubscribeChatListener = null;
    let unsubscribeOtherUsersListener = null;

    const XP_MILESTONES = [
        { level: 1, xpRequired: 0, title: 'Beginner Hunter' },
        { level: 2, xpRequired: 100, title: 'Novice Hunter' },
        { level: 3, xpRequired: 250, title: 'Apprentice Hunter' },
        { level: 4, xpRequired: 500, title: 'Skilled Hunter' },
        { level: 5, xpRequired: 800, title: 'Elite Hunter' },
        { level: 6, xpRequired: 1200, title: 'Advanced Hunter' },
        { level: 7, xpRequired: 1700, title: 'Expert Hunter' },
        { level: 8, xpRequired: 2300, title: 'Master Hunter' },
        { level: 9, xpRequired: 3000, title: 'Grand Master Hunter' },
        { level: 10, xpRequired: 4000, title: 'Shadow Monarch' },
    ];

    const getXPThresholdForLevel = (level) => {
        const milestone = XP_MILESTONES.find(m => m.level === level);
        return milestone ? milestone.xpRequired : Infinity;
    };

    const getTitleForLevel = (level) => {
        const milestone = XP_MILESTONES.find(m => m.level === level);
        return milestone ? milestone.title : 'Unranked Hunter';
    };

    const gainXP = async (amount) => {
        if (!currentUser) {
            return;
        }

        currentUser.xp += amount;
        let leveledUp = false;
        let newTitle = currentUser.title;

        while (currentUser.level < XP_MILESTONES.length && currentUser.xp >= getXPThresholdForLevel(currentUser.level + 1)) {
            currentUser.level++;
            newTitle = getTitleForLevel(currentUser.level);
            currentUser.xp -= getXPThresholdForLevel(currentUser.level);
            leveledUp = true;
            ui.showMessage(`Congratulations, Hunter ${currentUser.username}! You've reached Level ${currentUser.level}! Your new title is "${newTitle}"!`);
        }
        currentUser.title = newTitle;

        ui.updateXP(currentUser.xp);
        ui.updateLevel(currentUser.level);
        ui.updateTitle(currentUser.title);

        const xpToNextLevel = getXPThresholdForLevel(currentUser.level + 1) - getXPThresholdForLevel(currentUser.level);
        ui.updateXPProgressBar(currentUser.xp, xpToNextLevel);

        try {
            await db.collection('users').doc(currentUser.uid).update({
                xp: currentUser.xp,
                level: currentUser.level,
                title: currentUser.title
            });
        } catch (error) {
            ui.showMessage("Error updating XP/Level: " + error.message);
        }
    };

    const setupChatListener = () => {
        if (unsubscribeChatListener) {
            unsubscribeChatListener();
        }

        const chatRef = rtdb.ref('messages').orderByChild('timestamp').limitToLast(50);

        unsubscribeChatListener = chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            const isSelf = currentUser && message.senderId === currentUser.uid;
            ui.addChatMessage(message.username, message.text, isSelf);
        }, (error) => {
            ui.showMessage("Error loading chat: " + error.message);
        });
    };

    const sendChatMessage = async (messageText) => {
        if (!currentUser) {
            ui.showMessage("You must be logged in to chat.");
            return;
        }
        if (!messageText.trim()) {
            return;
        }

        try {
            const chatRef = rtdb.ref('messages');
            await chatRef.push({
                senderId: currentUser.uid,
                username: currentUser.username,
                text: messageText,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            ui.clearChatInput();
        } catch (error) {
            ui.showMessage("Error sending message: " + error.message);
        }
    };

    const setupOtherUsersListener = () => {
        if (unsubscribeOtherUsersListener) {
            unsubscribeOtherUsersListener();
        }

        const usersRef = db.collection('users');
        unsubscribeOtherUsersListener = usersRef.onSnapshot(snapshot => {
            const users = [];
            snapshot.forEach(doc => {
                const userData = doc.data();
                if (doc.id !== currentUser.uid) {
                    users.push({
                        id: doc.id,
                        username: userData.username,
                        level: userData.level,
                        xp: userData.xp
                    });
                }
            });
            ui.renderOtherUsers(users);
        }, error => {
            ui.showMessage("Error loading other hunters: " + error.message);
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        ui.init();

        document.getElementById('start-journey-btn').addEventListener('click', () => {
            ui.showAuthModal();
        });

        document.querySelector('#auth-modal .close-button').addEventListener('click', () => {
            ui.hideAuthModal();
        });

        document.getElementById('show-login-tab').addEventListener('click', ui.showLoginTab);
        document.getElementById('show-signup-tab').addEventListener('click', ui.showSignupTab);

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            ui.showAuthError('');
            try {
                await authModule.signIn(username, password);
            } catch (error) {
                ui.showAuthError(error.message);
            }
        });

        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const realTarget = document.getElementById('signup-real-target').value;
            const recoveryQuestion = document.getElementById('signup-recovery-question').value;
            const recoveryAnswer = document.getElementById('signup-recovery-answer').value;
            ui.showAuthError('');
            try {
                await authModule.signUp(username, password, realTarget, recoveryQuestion, recoveryAnswer);
            } catch (error) {
                ui.showAuthError(error.message);
            }
        });

        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            ui.hideAuthModal();
            ui.showForgotPasswordModal();
        });

        document.querySelector('#forgot-password-modal .close-button').addEventListener('click', () => {
            ui.hideForgotPasswordModal();
        });

        document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('recovery-username');
            const recoveryAnswerInput = document.getElementById('recovery-answer-input');
            const recoveryQuestionDisplay = document.getElementById('recovery-question-display');
            ui.showRecoveryError('');

            if (recoveryQuestionDisplay.textContent === '') {
                const username = usernameInput.value;
                try {
                    const recoveryDetails = await authModule.getRecoveryDetails(username);
                    if (recoveryDetails) {
                        usernameInput.disabled = true;
                        ui.updateRecoveryQuestionDisplay(recoveryDetails.question);
                    } else {
                        ui.showRecoveryError('Username not found.');
                    }
                } catch (error) {
                    ui.showRecoveryError(error.message);
                }
            } else {
                const username = usernameInput.value;
                const answer = recoveryAnswerInput.value;
                try {
                    const recoveryDetails = await authModule.getRecoveryDetails(username);
                    if (recoveryDetails && recoveryDetails.answer.toLowerCase() === answer.toLowerCase()) {
                        await authModule.sendPasswordReset(recoveryDetails.firebaseEmail);
                        ui.showMessage("Identity verified. A password reset link has been sent to your internal account email. Please contact support if you need further assistance.");
                        ui.hideForgotPasswordModal();
                    } else {
                        ui.showRecoveryError('Incorrect answer.');
                    }
                } catch (error) {
                    ui.showRecoveryError(error.message);
                }
            }
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            const confirmLogout = await ui.showMessage("Are you sure you want to logout?", true);
            if (confirmLogout) {
                try {
                    await authModule.signOut();
                } catch (error) {
                    ui.showMessage("Error logging out: " + error.message);
                }
            }
        });

        document.getElementById('notepad-btn').addEventListener('click', async () => {
            if (currentUser) {
                const noteContent = await notepadModule.loadNote(currentUser.uid);
                ui.updateNotepad(noteContent);
                ui.showNotepadDetailsScreen();
            } else {
                ui.showMessage("Please log in to access your notepad.");
            }
        });

        document.getElementById('back-to-dashboard-from-notepad').addEventListener('click', ui.showDashboard);

        document.getElementById('save-note-full-btn').addEventListener('click', async () => {
            if (currentUser) {
                const content = document.getElementById('notepad-content-full').value;
                await notepadModule.saveNote(currentUser.uid, content);
                ui.showMessage("Note saved!");
            } else {
                ui.showMessage("Please log in to save notes.");
            }
        });

        document.getElementById('xp-details-btn').addEventListener('click', () => {
            if (currentUser) {
                const xpToNextLevel = getXPThresholdForLevel(currentUser.level + 1) - getXPThresholdForLevel(currentUser.level);
                ui.updateXPProgressBar(currentUser.xp, xpToNextLevel);
                ui.renderMilestones(XP_MILESTONES);
                ui.showXPDetailsScreen();
            } else {
                ui.showMessage("Please log in to view XP details.");
            }
        });

        document.getElementById('back-to-dashboard-from-xp').addEventListener('click', ui.showDashboard);

        document.getElementById('add-quest-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (currentUser) {
                const title = document.getElementById('new-quest-title').value;
                const xpInput = document.getElementById('new-quest-xp');
                let xp = parseInt(xpInput.value, 10);

                if (xp > 100) {
                    xp = 100;
                    xpInput.value = 100;
                    ui.showMessage("XP reward capped at 100.");
                }

                if (title && xp > 0) {
                    await questsModule.addQuest(currentUser.uid, title, xp);
                    document.getElementById('new-quest-title').value = '';
                    document.getElementById('new-quest-xp').value = '10';
                } else {
                    ui.showMessage("Please enter a valid quest title and XP reward (1-100).");
                }
            } else {
                ui.showMessage("Please log in to add quests.");
            }
        });

        document.getElementById('quest-list').addEventListener('click', async (e) => {
            if (!currentUser) {
                ui.showMessage("Please log in to manage quests.");
                return;
            }
            const listItem = e.target.closest('li');
            if (!listItem) return;

            const questId = listItem.dataset.id;

            if (e.target.classList.contains('complete-quest-btn') || e.target.closest('.complete-quest-btn')) {
                const confirmComplete = await ui.showMessage("Mark this quest as complete?", true);
                if (confirmComplete) {
                    const xpRewardText = listItem.querySelector('.quest-xp').textContent;
                    const xpReward = parseInt(xpRewardText.replace('(+','').replace(' XP)',''), 10);
                    await questsModule.completeQuest(currentUser.uid, questId, xpReward);
                }
            } else if (e.target.classList.contains('delete-quest-btn') || e.target.closest('.delete-quest-btn')) {
                const confirmDelete = await ui.showMessage("Permanently delete this quest?", true);
                if (confirmDelete) {
                    await questsModule.deleteQuest(currentUser.uid, questId);
                }
            }
        });

        document.getElementById('start-timer-btn').addEventListener('click', () => {
            const durationInput = document.getElementById('timer-duration-input');
            const duration = parseInt(durationInput.value, 10);
            if (duration > 0) {
                timerModule.startTimer(duration);
            } else {
                ui.showMessage("Please enter a valid duration (in minutes) for the timer.");
            }
        });

        document.getElementById('pause-timer-btn').addEventListener('click', () => {
            timerModule.pauseTimer();
        });

        document.getElementById('reset-timer-btn').addEventListener('click', () => {
            timerModule.resetTimer();
        });

        document.getElementById('theme-selector').addEventListener('change', async (e) => {
            const newTheme = e.target.value;
            ui.applyTheme(newTheme);
            if (currentUser) {
                try {
                    await db.collection('users').doc(currentUser.uid).update({ currentTheme: newTheme });
                } catch (error) {
                    ui.showMessage("Error saving theme: " + error.message);
                }
            }
        });

        document.getElementById('chat-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = document.getElementById('chat-input').value;
            await sendChatMessage(message);
        });

        document.querySelector('#custom-message-box .message-close-button').addEventListener('click', () => {
            document.getElementById('custom-message-box').style.display = 'none';
        });

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDocRef = db.collection('users').doc(user.uid);
                try {
                    const doc = await userDocRef.get();
                    if (doc.exists) {
                        currentUser = { uid: user.uid, ...doc.data() };

                        ui.updateUsername(currentUser.username);
                        ui.updateTitle(currentUser.title || 'Beginner Hunter');
                        ui.updateLevel(currentUser.level);
                        ui.updateXP(currentUser.xp);
                        ui.updateRealTarget(currentUser.realTarget);
                        ui.applyTheme(currentUser.currentTheme || 'default');

                        const xpToNextLevel = getXPThresholdForLevel(currentUser.level + 1) - getXPThresholdForLevel(currentUser.level);
                        ui.updateXPProgressBar(currentUser.xp, xpToNextLevel);
                        ui.renderMilestones(XP_MILESTONES);

                        if (unsubscribeQuestListener) {
                            unsubscribeQuestListener();
                        }
                        unsubscribeQuestListener = questsModule.listenForQuests(currentUser.uid, (quests) => {
                            ui.renderQuests(quests);
                        });

                        setupChatListener();
                        setupOtherUsersListener();

                        ui.hideAuthModal();
                        ui.hideForgotPasswordModal();
                        ui.showDashboard();
                    } else {
                        ui.showMessage("User profile not found. Please try logging in again or signing up.");
                        await authModule.signOut();
                    }
                } catch (error) {
                    ui.showMessage("Error loading user data: " + error.message);
                    await authModule.signOut();
                }
            } else {
                currentUser = null;
                if (unsubscribeQuestListener) {
                    unsubscribeQuestListener();
                    unsubscribeQuestListener = null;
                }
                if (unsubscribeChatListener) {
                    unsubscribeChatListener();
                    unsubscribeChatListener = null;
                }
                if (unsubscribeOtherUsersListener) {
                    unsubscribeOtherUsersListener();
                    unsubscribeOtherUsersListener = null;
                }
                ui.showWelcomeScreen();
            }
        });
    });

    return {
        gainXP
    };
})();
