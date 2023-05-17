

// Send message to content script
async function sendMessage(sendMsg: { tabId?: number; message: any; }) {
    return new Promise((res, rej) => {
        let callbackHandler = (response: any) => {
            if (chrome.runtime.lastError) return rej();
            if (response) return res(response);
        }

        if (sendMsg.tabId != undefined) {
            chrome.tabs.sendMessage(sendMsg.tabId, sendMsg.message, callbackHandler);
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs[0]) return rej();
                chrome.tabs.sendMessage(tabs[0].id!, sendMsg.message, callbackHandler);
            });
        }
    }).catch((error) => { console.log(error); });
}

function getLocalStorageData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
}

export { sendMessage, getLocalStorageData }