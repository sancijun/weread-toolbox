
import $ from 'jquery';
import { message } from 'antd';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/reader/*"],
    run_at: "document_end",
    all_frames: true
}

function showToast(msg: string): void {
    const toastUI = `<div id="webook_toast" style="position: fixed; background-color: #f78d8d; color: #fff; border-radius: 6px; padding: 2px 10px; display: block; text-align: center; margin: 0 auto;left:50%;transform: translateX(-50%);z-index:99999; margin-top: 10px;">${msg}</div>`;
    $('body').prepend(toastUI);
    setTimeout(function () {
        $('#webook_toast').remove();
    }, 1500);
}

/* 复制文本内容 */
async function copy(targetText: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(targetText);
    } catch (err) {
        console.log('Failed to copy: ', err);
    }
}

function setScreen(px: number): void {
    if (px > 0) {
        $('.app_content').css('max-width', `${px}px`);
        $('.readerTopBar').css('max-width', `${px}px`);
        $('.readerControls').css('margin-left', `${px / 2 + 48}px`);
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        }, 500);
    }
}

function resetScreen(): void {
    $('.app_content').css('max-width', '');
    $('.readerTopBar').css('max-width', '');
    $('.readerControls').css('margin-left', '');

    setTimeout(function () {
        window.dispatchEvent(new Event('resize'));
    }, 500);
}

function getText(): string {
    const textArr = [];
    $('span.wr_absolute').each(function () {
        const obj = $(this);
        if (obj.css('left') && obj.css('top')) {
            textArr.push({ top: parseInt(obj.css('top').replace('px', '')), left: parseInt(obj.css('left').replace('px', '')), text: obj.text() });
        }
    });

    let content = '';
    _.sortBy(textArr, ['top', 'left']).forEach(function (val) {
        content += val['text'];
    });

    return content;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* 模拟点击 */
function simulateClick(element: HTMLElement, init = {}): void {
    const clientRect = element.getBoundingClientRect();
    const clientX = clientRect.left;
    const clientY = clientRect.top;
    const position = { clientX: clientX, clientY: clientY };
    Object.assign(init, position);
    let mouseEvent = new MouseEvent("click", init);
    element.dispatchEvent(mouseEvent);
}

function getBookTile(): string {
    const title = $('.readerTopBar_title_link').text().replace(/[\u3000\s]/g, '');
    return title;
}

export { showToast, copy, setScreen, resetScreen, getText, sleep, simulateClick, getBookTile };