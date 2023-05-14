import { copy, showToast } from "./content-utils";
import $ from "jquery";

/**
 * 监听从背景页发过来的消息，如果是 alert 消息，则调用 mySweetAlert 显示通知
 */
function initMessage() {
    console.log('initMessage');
    // 监听后台消息
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

        if (msg.alert) {
            showToast(msg.alert);
            // 通知后台正常显示了通知
            sendResponse({ succ: 1 });
        } else if (msg.content) {
            copy(msg.content, 'text/plain;charset=UTF-8');
        } else if (msg.isAddMask) {
            $('.mask_parent.need_remove').remove();
            let mask = $(`<div class='mask_parent need_remove'><div class="wr_mask wr_mask_Show"></div></div>`);
            $('#routerView').append(mask);
            // 防止导出标注出错导致遮盖不被移除
            $(document).on('keydown', function (event) {
                $('.mask_parent.need_remove').remove();
            });
        } else if (msg.isRemoveMask) {
            $('.mask_parent.need_remove').remove();
        }

    });

    // 接收interceptor传来的信息，转发给background
    window.addEventListener('message', function (event) {
        if (event.source === window && event.data && event.data.action === 'sendBookId') {
            const bookId = event.data.bookId;
            console.log('content script received bookId:', bookId);
            if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                // 将 bookId 发送给后台脚本
                chrome.runtime.sendMessage({ type: 'receiveBookId', bookId: bookId });
            }
        }
    });


}

export { initMessage };