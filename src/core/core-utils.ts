import { MD5 } from 'crypto-js';

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
                if (!tabs[0]) return rej("No active tabs found.");
                chrome.tabs.sendMessage(tabs[0].id!, sendMsg.message, callbackHandler);
            });
        }
    }).catch((error) => { console.log(error); });
}


async function getLocalStorageData(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key]);
        });
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getActiveTabId(): Promise<number> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
          resolve(tabs[0].id);
        } else {
          reject(new Error('No active tab found.'));
        }
      });
    });
}

function transformId(bookId: string): [string, string[]] {
    const idLength = bookId.length;

    if (/^\d*$/.test(bookId)) {
        const ary: string[] = [];
        for (let i = 0; i < idLength; i += 9) {
            ary.push(parseInt(bookId.slice(i, i + 9)).toString(16));
        }
        return ['3', ary];
    }

    let result = '';
    for (let i = 0; i < idLength; i++) {
        result += bookId.charCodeAt(i).toString(16);
    }
    return ['4', [result]];
}

function calculateBookStrId(bookId: string): string {
    const md5Digest = MD5(bookId).toString();
    let result = md5Digest.slice(0, 3);

    const [code, transformedIds] = transformId(bookId);
    result += code + '2' + md5Digest.slice(-2);

    for (let i = 0; i < transformedIds.length; i++) {
        let hexLengthStr = transformedIds[i].length.toString(16);
        if (hexLengthStr.length === 1) {
            hexLengthStr = '0' + hexLengthStr;
        }

        result += hexLengthStr + transformedIds[i];

        if (i < transformedIds.length - 1) {
            result += 'g';
        }
    }

    if (result.length < 20) {
        result += md5Digest.slice(0, 20 - result.length);
    }

    const finalMd5Digest = MD5(result).toString();
    result += finalMd5Digest.slice(0, 3);

    return result;
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export { sendMessage, getLocalStorageData, sleep, getActiveTabId, calculateBookStrId, formatTimestamp }