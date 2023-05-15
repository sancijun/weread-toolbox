import $ from 'jquery';
import { copy, showToast, simulateClick, sleep } from "./content-utils";
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ["*://weread.qq.com/web/reader/*"],
	run_at: "document_end",
	all_frames: true
}

/**
 * 导出笔记：
 * 先挑战第一章，然后点击下一章直到最后一章，点击下一章的时候，页面会加载数据。
 * content-dom.js 会监听DOM变化，获取所有的图片数据，存入 localStorage。
 * 最后通知 background.js 执行 getAllMarks，导出所有的笔记。
 */
function exportData() {
	localStorage.setItem('chapterImgData', '{}')
	// 跳转到第一章
	simulateClick($('.readerControls_item.catalog')[0]); // 点击目录显示之后才能够正常获取 BoundingClientRect
	const readerCatalog: HTMLElement | null = document.querySelector('.readerCatalog');
	if (readerCatalog) {
		readerCatalog.removeAttribute('style');
		simulateClick($('.chapterItem_link')[0]);
		readerCatalog.setAttribute('style', 'display: none;');
	}
	// 点击下一章直到最后
	setTimeout(clickReaderFooterButton, 1000);

	// 导出本章
	// chrome.runtime.sendMessage({type:"getMarksInCurChap", chapterImgData: JSON.parse(localStorage.getItem('chapterImgData') ?? '{}')})
}

function clickReaderFooterButton() {
	const nextPageButton = document.querySelector('.readerFooter_button');
	if (nextPageButton) {
		showToast('数据加载中,请稍等后……');
		var evt = new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
		nextPageButton.dispatchEvent(evt);
		setTimeout(clickReaderFooterButton, 1000);
	} else {
		// 通知 background.js 执行 getAllMarks
		chrome.runtime.sendMessage(
			{ type: "getAllMarks", chapterImgData: JSON.parse(localStorage.getItem('chapterImgData') ?? '{}') },
			function (resp) {
				console.log('getAllMarks resp', resp)
				copy(resp.content, 'text/plain;charset=UTF-8');
				showToast('👏 已成功导出笔记到剪贴板');
			}
		);
	}
}

export { exportData };