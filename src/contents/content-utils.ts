
import $ from 'jquery';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/reader/*"],
    run_at: "document_end",
    all_frames: true
}

/* 复制文本内容 */
async function copy(targetText: string): Promise<void> {
    try {
        // console.log('copy', targetText);
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

function lightenColor(color, amount) {
    // 移除 # 符号并解析颜色值
    color = color.replace("#", "");
    const hexColor = parseInt(color, 16);
  
    // 分离红、绿、蓝通道
    const red = (hexColor >> 16) & 255;
    const green = (hexColor >> 8) & 255;
    const blue = hexColor & 255;
  
    // 调整亮度
    const newRed = Math.round(red + (255 - red) * amount);
    const newGreen = Math.round(green + (255 - green) * amount);
    const newBlue = Math.round(blue + (255 - blue) * amount);
  
    // 将新的 RGB 值转换回十六进制表示
    const newColor = "#" + ((1 << 24) + (newRed << 16) + (newGreen << 8) + newBlue).toString(16).slice(1);
  
    return newColor;
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

export { copy, setScreen, resetScreen, getText, sleep, simulateClick, getBookTile, lightenColor };