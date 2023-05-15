import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["*://weread.qq.com/web/reader/*"],
  world: "MAIN",
  run_at: "document_idle",
}

// 拦截并修改Ajax请求
let originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  const xhr = new originalXHR();
  const originalOnReadyStateChange = xhr.onreadystatechange;
  const originalOnLoad = xhr.onload;

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200 && xhr.responseURL.includes('/web/book/info')) {
      console.log(`xhr.readyState: ${xhr.readyState}, xhr.status: ${xhr.status}`);
      const response = JSON.parse(xhr.responseText);
      if (response.title && response.bookId) {
        // 向页面发送消息，将 bookId 传递给页面
        window.postMessage({ action: 'sendBookId', title: response.title, bookId: response.bookId }, '*');
      }
    }

    // 调用原始的onreadystatechange处理程序
    if (typeof originalOnReadyStateChange === 'function') {
      originalOnReadyStateChange.apply(this, arguments);
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200 && xhr.responseURL.includes('/web/book/info')) {
      const response = JSON.parse(xhr.responseText);
      if (response.title && response.bookId) {
        // 向页面发送消息，将 bookId 传递给页面
        console.log(`xhr.onload bookId: ${response.bookId}`);
        window.postMessage({ action: 'sendBookId', bookId: response.bookId }, '*');
      }
    }

    // 调用原始的onload处理程序
    if (typeof originalOnLoad === 'function') {
      originalOnLoad.apply(this, arguments);
    }
  };

  return xhr;
};