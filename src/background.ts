import { exportBookMarks } from "~background/bg-exporter";



// 监听消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('background onMessage: ', msg);
    let tabId: number | undefined;
    if (sender && sender.tab) tabId = sender.tab.id;
    switch (msg.type) {
        case "getBookMarks":
            exportBookMarks(msg.title, msg.isBestBookMarks).then((content) => {
                sendResponse({ content: content });
            });
            return true;
        case "getCurChapMarks":
            exportBookMarks(msg.title, msg.curChapterTitle).then((content) => {
                sendResponse({ content: content });
            });
            return true;
        case 'fetch':
            if (!msg.url) return;
            fetch(msg.url, msg.init).then(resp => {
                console.log('resp', resp);
                let contentType = msg.init.headers['content-type'];
                if (contentType === undefined || contentType === 'application/json')
                    return resp.json();
                else if (contentType === 'text/plain')
                    return resp.text();
            }).then(data => {
                sendResponse({ data: data });
            });
            break;
    }
    return true;
});

