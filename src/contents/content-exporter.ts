import $ from 'jquery';
import { showToast, simulateClick, sleep } from "./content-utils";

// 获取当所有图片数据
function loadData() {
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
		console.log("前往下一章...")
		var evt = new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
		nextPageButton.dispatchEvent(evt);
		setTimeout(clickReaderFooterButton, 1000);
	} else {
		// 通知 background.js 执行 getAllMarks
		chrome.runtime.sendMessage({ type: "getAllMarks", chapterImgData: JSON.parse(localStorage.getItem('chapterImgData') ?? '{}') })
	}
}

export { loadData };