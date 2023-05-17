import $ from 'jquery';
import { copy, getBookTile, simulateClick } from "./content-utils";
import type { PlasmoCSConfig } from 'plasmo';
import { message } from 'antd';

export const config: PlasmoCSConfig = {
	matches: ["*://weread.qq.com/web/reader/*"],
	run_at: "document_end",
	all_frames: true
}

/**
 * 导出笔记：
 * 先跳转第一章，然后点击下一章直到最后一章，点击下一章的时候，页面会加载数据。
 * content-dom.js 会监听DOM变化，获取所有的图片数据，存入 Storage。
 * 最后通知 background.js 执行 getAllMarks，导出所有的笔记。
 */
function exportBookMarks(isBestBookMarks?: boolean) {
	// 跳转到第一章
	const catalogItem = document.querySelector('.readerControls_item.catalog') as HTMLElement;
	simulateClick(catalogItem);

	const readerCatalog = document.querySelector('.readerCatalog');
	if (readerCatalog) {
		readerCatalog.removeAttribute('style');
		simulateClick(document.querySelector('.chapterItem_link'));
		readerCatalog.setAttribute('style', 'display: none;');
	}

	simulateClick(catalogItem);

	// 关闭助手弹窗
	document.querySelector('.wr_dialog_container')?.classList.add('hide');

	message.open({ key: 'export', type: 'loading', content: '数据加载中...', duration: 0 });

	// 点击下一章直到最后
	setTimeout(() => clickReaderFooterButton(isBestBookMarks), 1000);
}

function clickReaderFooterButton(isBestBookMarks: boolean) {
	const nextPageButton = document.querySelector('.readerFooter_button');
	if (nextPageButton) {
		var evt = new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
		nextPageButton.dispatchEvent(evt);
		setTimeout(() => clickReaderFooterButton(isBestBookMarks), 1000);
	} else {
		// 通知 background.js 执行 getAllMarks
		const title = getBookTile();
		chrome.runtime.sendMessage({ type: "getBookMarks", title: title, isBestBookMarks: isBestBookMarks }, function (resp) {
			copy(resp.content).then(() => {
				message.open({ key: 'export', type: 'success', content: '已成功导出到剪贴板!', duration: 2 });
			});

			// 关闭导出窗口
			$('#webook_box').hide();
			$('.wr_dialog_container').show();
		});
	}
}

export { exportBookMarks };
