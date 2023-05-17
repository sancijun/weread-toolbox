/* 监听 DOM 变化，获取预加载的图片 */

import type { PlasmoCSConfig } from "plasmo";
import { getBookTile } from "./content-utils";

export const config: PlasmoCSConfig = {
	matches: ["*://weread.qq.com/web/reader/*"],
	run_at: "document_start",
	all_frames: true
}

function initDomChangeObserver() {
	const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
		console.log("mutationsList======")
		for (let mutation of mutationsList) {
			if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach((node: Node) => {
					if ((node as Element).matches && (node as Element).matches('div.preRenderContainer')) {
						// 获取本书标题
						const title = getBookTile() ?? '';
						const imgDataKey = `${title}-ImgData`;

						// 获取本书已存储的图片数据
						chrome.storage.local.get(imgDataKey, (result: any) => {
							const imgData = result[imgDataKey] || {};
							// 获取当前预渲染容器中的所有图片数据
							const imgElements = (node as Element).querySelectorAll('img');
							imgElements.forEach((img: HTMLImageElement) => {
								const dataWrCo = img.getAttribute('data-wr-co');
								const dataSrc = img.getAttribute('data-src');
								if (dataWrCo && dataSrc) {
									imgData[dataWrCo] = dataSrc;
								}
							});

							// 将更新后的数据存储到 chrome.storage.local 中
							const data = { [imgDataKey]: imgData };
							// console.log('imgData:', imgData);
							chrome.storage.local.set(data);
						});

					}
				});
			}
		}
	});

	// 开始监听节点变化
	observer.observe(document.body, { childList: true, subtree: true });

}

export { initDomChangeObserver };