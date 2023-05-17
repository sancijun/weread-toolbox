import type { PlasmoCSConfig } from "plasmo";
import { copy, showToast } from "./content-utils";
import { Button, message } from 'antd';
import $ from "jquery";

/**
 * 监听从背景页发过来的消息，如果是 alert 消息，则调用 mySweetAlert 显示通知
 */

export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/reader/*"],
    run_at: "document_start",
    all_frames: true
}

function initMessage() {
    console.log('initMessage');
    // 监听后台消息
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

        if (msg.alert) {
            showToast(msg.alert);
            // 通知后台正常显示了通知
            sendResponse({ succ: 1 });
        } else if (msg.content) {
            copy(msg.content);
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

    // 接收interceptor传来的信息，将bookId存入 storage
    // 数据存入格式 title-bookId: bookId
    window.addEventListener('message', function (event) {
        if (event.source === window && event.data && event.data.action === 'sendBookId') {
            const bookId = event.data.bookId;
            const title = event.data.title;
            if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                const data = { [`${title}-bookId`]: bookId };
                chrome.storage.local.set(data);
            }
        }
    });


}

export { initMessage };