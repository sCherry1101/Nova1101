const ui = (() => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const authModal = document.getElementById('auth-modal');
    const dashboard = document.getElementById('dashboard');
    const authErrorMessage = document.getElementById('auth-error-message');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showLoginTabBtn = document.getElementById('show-login-tab');
    const showSignupTabBtn = document.getElementById('show-signup-tab');
    const displayUsername = document.getElementById('display-username');
    const displayTitle = document.getElementById('display-title');
    const displayLevel = document.getElementById('display-level');
    const displayXP = document.getElementById('display-xp');
    const displayRealTarget = document.getElementById('display-real-target');
    const themeSelector = document.getElementById('theme-selector');
    const customMessageBox = document.getElementById('custom-message-box');
    const customMessageText = document.getElementById('custom-message-text');
    const messageOkBtn = document.getElementById('message-ok-btn');
    const messageCancelBtn = document.getElementById('message-cancel-btn');
    const notepadDetailsScreen = document.getElementById('notepad-details-screen');
    const notepadContentFull = document.getElementById('notepad-content-full');
    const xpDetailsScreen = document.getElementById('xp-details-screen');
    const xpDetailLevel = document.getElementById('xp-detail-level');
    const xpDetailXP = document.getElementById('xp-detail-xp');
    const xpDetailTitle = document.getElementById('xp-detail-title');
    const xpProgressFill = document.getElementById('xp-progress-fill');
    const xpProgressText = document.getElementById('xp-progress-text');
    const milestoneDetails = document.getElementById('milestone-details');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const recoveryQuestionDisplay = document.getElementById('recovery-question-display');
    const recoveryAnswerInput = document.getElementById('recovery-answer-input');
    const submitRecoveryBtn = document.getElementById('submit-recovery-btn');
    const recoveryErrorMessage = document.getElementById('recovery-error-message');

    let resolveMessageBoxPromise;

    const init = () => {
        welcomeScreen.classList.add('active');
        dashboard.classList.remove('active');
        authModal.style.display = 'none';
        customMessageBox.style.display = 'none';
        notepadDetailsScreen.classList.remove('active');
        xpDetailsScreen.classList.remove('active');
        forgotPasswordModal.style.display = 'none';
    };

    const showWelcomeScreen = () => {
        welcomeScreen.classList.add('active');
        dashboard.classList.remove('active');
        authModal.style.display = 'none';
        notepadDetailsScreen.classList.remove('active');
        xpDetailsScreen.classList.remove('active');
        forgotPasswordModal.style.display = 'none';
    };

    const showAuthModal = () => {
        authModal.style.display = 'flex';
        authErrorMessage.textContent = '';
        showLoginTab();
    };

    const hideAuthModal = () => {
        authModal.style.display = 'none';
        authErrorMessage.textContent = '';
        loginForm.reset();
        signupForm.reset();
    };

    const showForgotPasswordModal = () => {
        forgotPasswordModal.style.display = 'flex';
        recoveryErrorMessage.textContent = '';
        recoveryQuestionDisplay.textContent = '';
        recoveryAnswerInput.value = '';
        recoveryAnswerInput.style.display = 'none';
        submitRecoveryBtn.textContent = 'Submit';
    };

    const hideForgotPasswordModal = () => {
        forgotPasswordModal.style.display = 'none';
        recoveryErrorMessage.textContent = '';
        document.getElementById('recovery-username').value = '';
    };

    const showDashboard = () => {
        welcomeScreen.classList.remove('active');
        authModal.style.display = 'none';
        notepadDetailsScreen.classList.remove('active');
        xpDetailsScreen.classList.remove('active');
        forgotPasswordModal.style.display = 'none';
        dashboard.classList.add('active');
    };

    const showNotepadDetailsScreen = () => {
        welcomeScreen.classList.remove('active');
        dashboard.classList.remove('active');
        xpDetailsScreen.classList.remove('active');
        forgotPasswordModal.style.display = 'none';
        notepadDetailsScreen.classList.add('active');
    };

    const showXPDetailsScreen = () => {
        welcomeScreen.classList.remove('active');
        dashboard.classList.remove('active');
        notepadDetailsScreen.classList.remove('active');
        forgotPasswordModal.style.display = 'none';
        xpDetailsScreen.classList.add('active');
    };

    const showLoginTab = () => {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        showLoginTabBtn.classList.add('active');
        showSignupTabBtn.classList.remove('active');
        authErrorMessage.textContent = '';
    };

    const showSignupTab = () => {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        showSignupTabBtn.classList.add('active');
        showLoginTabBtn.classList.remove('active');
        authErrorMessage.textContent = '';
    };

    const updateUsername = (username) => {
        displayUsername.textContent = username;
    };

    const updateTitle = (title) => {
        displayTitle.textContent = title;
        xpDetailTitle.textContent = title;
    };

    const updateLevel = (level) => {
        displayLevel.textContent = level;
        xpDetailLevel.textContent = level;
    };

    const updateXP = (xp) => {
        displayXP.textContent = xp;
        xpDetailXP.textContent = xp;
    };

    const updateRealTarget = (target) => {
        displayRealTarget.textContent = target;
    };

    const updateNotepad = (content) => {
        notepadContentFull.value = content;
    };

    const renderQuests = (quests) => {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = '';

        if (!quests || quests.length === 0) {
            questList.innerHTML = '<li class="no-quests">No quests available. Add some!</li>';
            return;
        }

        quests.forEach(quest => {
            const li = document.createElement('li');
            li.dataset.id = quest.id;
            if (quest.isCompleted) {
                li.classList.add('completed');
            }

            li.innerHTML = `
                <div class="quest-details">
                    <span class="quest-title">${quest.title}</span>
                    <span class="quest-xp">(+${quest.xpReward} XP)</span>
                </div>
                <div class="quest-actions">
                    ${!quest.isCompleted ? `<button class="complete-quest-btn" title="Complete Quest"><i class="fas fa-check"></i></button>` : ''}
                    <button class="delete-quest-btn" title="Delete Quest"><i class="fas fa-trash"></i></button>
                </div>
            `;
            questList.appendChild(li);
        });
    };

    const updateTimerDisplay = (timeString) => {
        document.getElementById('timer-display').textContent = timeString;
    };

    const updateTimerMessage = (message) => {
        document.getElementById('timer-message').textContent = message;
    };

    const setTimerButtonState = (startEnabled, pauseEnabled, resetEnabled) => {
        document.getElementById('start-timer-btn').disabled = !startEnabled;
        document.getElementById('pause-timer-btn').disabled = !pauseEnabled;
        document.getElementById('reset-timer-btn').disabled = !resetEnabled;
    };

    const addChatMessage = (username, message, isSelf = false) => {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        if (isSelf) {
            messageDiv.classList.add('self-message');
        }
        messageDiv.innerHTML = `<strong>${username}:</strong> ${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const clearChatInput = () => {
        document.getElementById('chat-input').value = '';
    };

    const renderOtherUsers = (users) => {
        const otherHuntersList = document.getElementById('other-hunters-list');
        otherHuntersList.innerHTML = '';

        if (!users || users.length === 0) {
            otherHuntersList.innerHTML = '<li class="no-hunters">No other hunters online.</li>';
            return;
        }

        users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="hunter-name">${user.username}</span>
                <span class="hunter-stats">Level ${user.level} | XP ${user.xp}</span>
            `;
            otherHuntersList.appendChild(li);
        });
    };

    const updateXPProgressBar = (currentXP, xpToNextLevel) => {
        const percentage = (currentXP / xpToNextLevel) * 100;
        xpProgressFill.style.width = `${Math.min(100, percentage)}%`;
        xpProgressText.textContent = `${currentXP} / ${xpToNextLevel} XP to next level`;
    };

    const renderMilestones = (milestones) => {
        milestoneDetails.innerHTML = '';
        milestones.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `Level <strong>${m.level}</strong>: ${m.xpRequired} XP - Title: <strong>${m.title}</strong>`;
            milestoneDetails.appendChild(li);
        });
    };

    const applyTheme = (themeName) => {
        document.body.className = '';
        document.body.classList.add(`theme-${themeName}`);
        themeSelector.value = themeName;
    };

    const showMessage = (message, isConfirm = false) => {
        return new Promise((resolve) => {
            customMessageText.textContent = message;
            messageCancelBtn.style.display = isConfirm ? 'inline-block' : 'none';
            customMessageBox.style.display = 'flex';
            resolveMessageBoxPromise = resolve;

            const handleOk = () => {
                customMessageBox.style.display = 'none';
                messageOkBtn.removeEventListener('click', handleOk);
                messageCancelBtn.removeEventListener('click', handleCancel);
                document.querySelector('#custom-message-box .message-close-button').removeEventListener('click', handleCancel);
                resolve(true);
            };

            const handleCancel = () => {
                customMessageBox.style.display = 'none';
                messageOkBtn.removeEventListener('click', handleOk);
                messageCancelBtn.removeEventListener('click', handleCancel);
                document.querySelector('#custom-message-box .message-close-button').removeEventListener('click', handleCancel);
                resolve(false);
            };

            messageOkBtn.addEventListener('click', handleOk);
            messageCancelBtn.addEventListener('click', handleCancel);
            document.querySelector('#custom-message-box .message-close-button').addEventListener('click', handleCancel);
        });
    };

    const showAuthError = (message) => {
        authErrorMessage.textContent = message;
    };

    const showRecoveryError = (message) => {
        recoveryErrorMessage.textContent = message;
    };

    const updateRecoveryQuestionDisplay = (question) => {
        recoveryQuestionDisplay.textContent = question;
        recoveryAnswerInput.style.display = 'block';
        submitRecoveryBtn.textContent = 'Verify Answer';
    };

    return {
        init,
        showWelcomeScreen,
        showAuthModal,
        hideAuthModal,
        showForgotPasswordModal,
        hideForgotPasswordModal,
        showDashboard,
        showNotepadDetailsScreen,
        showXPDetailsScreen,
        showLoginTab,
        showSignupTab,
        updateUsername,
        updateTitle,
        updateLevel,
        updateXP,
        updateRealTarget,
        updateNotepad,
        renderQuests,
        updateTimerDisplay,
        updateTimerMessage,
        setTimerButtonState,
        addChatMessage,
        clearChatInput,
        renderOtherUsers,
        updateXPProgressBar,
        renderMilestones,
        applyTheme,
        showMessage,
        showAuthError,
        showRecoveryError,
        updateRecoveryQuestionDisplay
    };
})();
