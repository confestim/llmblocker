document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.querySelector('button');

    resetButton.addEventListener('click', () => {
        browser.storage.local.remove(['llmblocker_list', 'llmblocker_cache_time']);

        resetButton.textContent = 'List reset!';
        setTimeout(() => {
            resetButton.textContent = 'Reset sources';
        }, 1500);
    })

;});
