const timerModule = (() => {
    let timerInterval = null;
    let totalDurationMs = 0;
    let remainingTimeMs = 0;
    let isPaused = false;
    let alertPoints = [];

    const ONE_SECOND = 1000;
    const ONE_MINUTE = 60 * ONE_SECOND;

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / ONE_SECOND);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const updateDisplay = () => {
        ui.updateTimerDisplay(formatTime(remainingTimeMs));
    };

    const calculateAlertPoints = () => {
        alertPoints = [];
        if (totalDurationMs > 0) {
            alertPoints.push(Math.floor(totalDurationMs * 0.75));
            alertPoints.push(Math.floor(totalDurationMs * 0.50));
            alertPoints.push(Math.floor(totalDurationMs * 0.25));
            alertPoints.sort((a, b) => b - a);
        }
    };

    const checkAlerts = () => {
        if (alertPoints.length === 0) return;

        for (let i = 0; i < alertPoints.length; i++) {
            const alertThreshold = alertPoints[i];
            if (remainingTimeMs <= alertThreshold && remainingTimeMs > alertThreshold - ONE_SECOND * 2) {
                const percentage = (alertThreshold / totalDurationMs * 100).toFixed(0);
                ui.showMessage(`Timer Alert: ${100 - percentage}% of your training time has passed! Keep going, Hunter!`);
                alertPoints.splice(i, 1);
                break;
            }
        }
    };

    const startTimer = (durationMinutes = 0) => {
        if (timerInterval) {
            return;
        }

        if (remainingTimeMs <= 0 && durationMinutes > 0) {
            totalDurationMs = durationMinutes * ONE_MINUTE;
            remainingTimeMs = totalDurationMs;
            calculateAlertPoints();
            ui.updateTimerMessage(`Time remaining for your ${durationMinutes}-minute training.`);
        } else if (remainingTimeMs <= 0) {
            ui.showMessage("Please set a duration (in minutes) for the timer.");
            return;
        }

        isPaused = false;
        ui.setTimerButtonState(false, true, true);

        timerInterval = setInterval(() => {
            if (!isPaused) {
                remainingTimeMs -= ONE_SECOND;
                updateDisplay();
                checkAlerts();

                if (remainingTimeMs <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    remainingTimeMs = 0;
                    updateDisplay();
                    ui.showMessage("Training complete! You've finished your session, Hunter!");
                    ui.updateTimerMessage("Session finished.");
                    ui.setTimerButtonState(true, false, false);
                }
            }
        }, ONE_SECOND);
    };

    const pauseTimer = () => {
        if (timerInterval) {
            isPaused = true;
            clearInterval(timerInterval);
            timerInterval = null;
            ui.setTimerButtonState(true, false, true);
            ui.updateTimerMessage("Training paused.");
        }
    };

    const resetTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        totalDurationMs = 0;
        remainingTimeMs = 0;
        isPaused = false;
        alertPoints = [];
        updateDisplay();
        ui.updateTimerMessage("Timer reset.");
        ui.setTimerButtonState(true, false, false);
    };

    updateDisplay();
    ui.setTimerButtonState(true, false, false);

    return {
        startTimer,
        pauseTimer,
        resetTimer
    };
})();
