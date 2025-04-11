async function fetchBlockList() {
    const blockListUrl = "https://raw.githubusercontent.com/confestim/llmblocker/main/pihole-list.txt";
    
    const storageData = await browser.storage.local.get(['llmblocker_list', 'llmblocker_cache_time']);
    const cachedData = storageData.llmblocker_list;
    const cacheTime = storageData.llmblocker_cache_time;
    const currentTime = new Date().getTime();
    
    let cacheExpiration = 2 * 24 * 60 * 60 * 1000;
    
    if (cachedData && cacheTime) {
        if ((currentTime - parseInt(cacheTime)) < cacheExpiration) {
            return cachedData.split('\n');
        }
    }
    
    const response = await fetch(blockListUrl);
    const data = await response.text();
    
    await browser.storage.local.set({
        llmblocker_list: data,
        llmblocker_cache_time: currentTime.toString()
    });
    return data.split('\n');
}

// block a page
async function blockPage() {
    let blockList;
    try {
        blockList = await fetchBlockList();
        console.log("Block list fetched:", blockList);
    }
    catch (error) {
        console.error("Error fetching block list:", error);
        return;
    }
    
    const currentUrl = window.location.hostname + window.location.pathname + window.location.search;
    console.log("Current URL:", currentUrl);

    const shouldBlock = blockList.some(entry => {
        if (entry.startsWith('#') || !entry.trim()) return false;

        const pattern = entry.trim()
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');

        const regex = new RegExp(`^${pattern}$`, 'i');
        const matches = regex.test(currentUrl);
        if (matches) {
            console.log(`Matched blocking pattern: ${entry}`);
        }
        return matches;
    });
    
    if (shouldBlock) {
        let htmlURL = browser.runtime.getURL("assets/blockPage.html");
        // create blob from htmlURL
        const response = await fetch(htmlURL);
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.location.replace(blobUrl);
    }
}

// on page load, conditionally block the page
window.addEventListener('load', async () => {
    console.log("LLMBlocker checking page...");
    await blockPage();
});
