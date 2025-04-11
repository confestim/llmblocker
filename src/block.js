async function fetchBlockList() {
  const blockListUrl =
    "https://raw.githubusercontent.com/confestim/llmblocker/refs/heads/main/pihole-list.txt";

  const storageData = await browser.storage.local.get([
    "llmblocker_list",
    "llmblocker_cache_time",
  ]);
  const cachedData = storageData.llmblocker_list;
  const cacheTime = storageData.llmblocker_cache_time;
  const currentTime = new Date().getTime();

  let cacheExpiration = 2 * 24 * 60 * 60 * 1000;

  if (cachedData && cacheTime) {
    console.debug("Got from cache");
    if (currentTime - parseInt(cacheTime) < cacheExpiration) {
      return cachedData.split("\n");
    }
  }

  const response = await fetch(blockListUrl);
  const data = await response.text();

  await browser.storage.local.set({
    llmblocker_list: data,
    llmblocker_cache_time: currentTime.toString(),
  });
  console.debug("Got from network");
  return data.split("\n");
}

// block a page
async function blockPage() {
  let blockList;
  try {
    blockList = await fetchBlockList();
    console.debug("Fetched block list:", blockList);
  } catch (error) {
    console.error("Error fetching block list:", error);
    return;
  }

  const currentUrl = new URL(window.location.href);
  let testStr = currentUrl.hostname;
  let shouldBlock = false;

  for (let i = 0; i < blockList.length; i++) {
    let pattern = blockList[i].trim();
    let isComment =
      pattern.startsWith("#") && pattern.split("#").length - 1 == 1;
    let isSpecific = !isComment && pattern.startsWith("##");

    if (!pattern || isComment) {
      continue;
    }

    try {
      if (pattern.startsWith("||") && !isSpecific) {
        let domain = pattern.slice(2);
        if (domain.endsWith("^")) {
          domain = domain.slice(0, -1);
        }

        if (
          currentUrl.hostname === domain ||
          currentUrl.hostname.endsWith("." + domain)
        ) {
          console.debug("Matched domain pattern:", pattern);
          shouldBlock = true;
          break;
        }
      } else if (isSpecific) {
        let specificPattern = pattern.slice(2).trim();
        let fullUrl =
          currentUrl.hostname + currentUrl.pathname + currentUrl.search;

        if (fullUrl.includes(specificPattern) && specificPattern.length > 0) {
          console.debug("Matched specific pattern:", pattern);
          shouldBlock = true;
          break;
        }
      }
    } catch (error) {
      console.error("Error processing pattern:", pattern, error);
      continue;
    }
  }

  if (shouldBlock) {
    let htmlURL = browser.runtime.getURL("assets/blockPage.html");
    const response = await fetch(htmlURL);
    const text = await response.text();
    const blob = new Blob([text], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    window.location.replace(blobUrl);
  }
}

window.addEventListener("load", async () => {
    let stateObj = await browser.storage.local.get("llmblocker_pause");
    let isPaused = stateObj.llmblocker_pause;

    if (isPaused) {
        return;
    }

    console.log("LLMBlocker checking page...");
    await blockPage();
});
