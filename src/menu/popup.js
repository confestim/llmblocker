document.addEventListener('DOMContentLoaded', async () => {
    // reset button (id="reset")
    const resetButton = document.getElementById('reset');

    resetButton.addEventListener('click', async () => {
        await browser.storage.local.remove(['llmblocker_list', 'llmblocker_cache_time']);
        resetButton.textContent = 'List reset!';
        setTimeout(() => {
            resetButton.textContent = 'Reset sources';
        }, 1500);
    });

    const pauseButton = document.getElementById('pause');

    let stateObj = await browser.storage.local.get('llmblocker_pause');
    let isPaused = stateObj.llmblocker_pause;
    pauseButton.textContent = isPaused ? "⏳" : "😎";

    pauseButton.addEventListener('click', async () => {
        const stateObj = await browser.storage.local.get('llmblocker_pause');
        const currentState = stateObj.llmblocker_pause;
        const newState = !currentState;
        await browser.storage.local.set({ llmblocker_pause: newState });
        pauseButton.textContent = newState ? "⏳" : "😎";

        // change icon of extension
        const iconPath = newState ? '../assets/bot.png' : '../assets/nobot.png';
        await browser.browserAction.setIcon({ path: iconPath });
    });
});
