import React, { useEffect, useRef } from 'react';
import { FloatButton } from 'antd';
import {
    BookOutlined,
    HighlightOutlined,
    FireOutlined,
    CloudSyncOutlined,
    PlusCircleOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import type { PlasmoCSConfig } from 'plasmo';
import { copy, getBookTile, getLocalStorageData, setScreen, simulateClick, sleep } from './content-utils';
import './content-menu.css';

export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/reader/*"],
    run_at: "document_idle",
    all_frames: true
};

const getContainer = async () => {
    try {
        await sleep(300)
        let container = document.querySelector('.readerControls');
        const menuContainer = document.createElement('div');
        menuContainer.classList.add('readerControls_item');
        container.appendChild(menuContainer);
        return menuContainer;
    } catch (error) {
        console.error("================", error)
    }
}

export const getRootContainer = async () => {
    return await getContainer()
}

const Menu: React.FC = () => {

    const initWidth = useRef(0);

    useEffect(() => {
        // 初始化消息监听
        initMessageListener();
        // 初始化图片加载器
        initImageLoader();
        // 解除右键限制
        window.addEventListener("contextmenu", function (t) {
            t.stopImmediatePropagation();
        }, true);
        // 隐藏下载按钮
        document.querySelector(".readerControls_item.download").style.display = "none";
        // 获取 app_content 宽度
        const appContentElement = document.querySelector('.app_content');
        if (appContentElement) {
            initWidth.current = parseFloat(getComputedStyle(appContentElement).maxWidth);
        }
        // 初始化屏幕宽度
        chrome.storage.local.get('screenCoefficient', function (result) {
            let screen = result.screenCoefficient || 1.0
            setScreen(initWidth.current * screen)
        })
        console.log('initWidth', initWidth.current);

    }, []);

    const openChange = (open) => {
        const parentElement = document.querySelector('.readerControls');
        let childElements = Array.from(parentElement.children);
        childElements = childElements.slice(0, childElements.length - 2);

        if (open) {
            childElements.forEach((element) => element.style.visibility = 'hidden') // 设置元素隐藏
        } else {
            childElements.forEach((element) => element.style.visibility = 'visible')// 设置元素可见
        }
    };

    // 调整屏幕宽度
    const onClickSetScreen = () => {
        chrome.storage.local.get('screenCoefficient', async function (result) {
            let screen = result.screenCoefficient || 1.0
            screen = Number.parseFloat(screen) + 0.1;
            const screenWidth = initWidth.current * screen;
            if (screen > 1.6 || screenWidth > (window.outerWidth - 150)) {
                screen = 1.0
            }
            console.log("setScreen", screen, screenWidth, window.outerWidth - 150);
            setScreen(screenWidth)
            chrome.storage.local.set({ 'screenCoefficient': screen })
        })
    };

    // 导出全部标注
    async function onClickExportBookMarks() {
        try {
            message.open({ key: 'export', type: 'loading', content: '导出中，请稍等...', duration: 0 });
            await loadImage();
            message.open({ key: 'export', type: 'loading', content: '导出中，请稍等...', duration: 0 });
            // 通知 background.js 执行 getAllMarks
            const title = getBookTile();
            chrome.runtime.sendMessage({ type: "exportBookMarks", title: title }, function (resp) {
                console.log('exportBookMarks', resp);
                if (!resp.content || resp.content == false) {
                    message.open({ key: 'export', type: 'error', content: '导出全部标注失败!', duration: 5 });
                } else {
                    copy(resp.content).then(() => {
                        message.open({ key: 'export', type: 'success', content: '已成功导出到剪贴板!', duration: 2 });
                    });
                }

            });
        } catch (error) {
            console.error('Error occurred during export:', error);
            message.open({ key: 'export', type: 'error', content: '导出全部标注失败!', duration: 2 });
        }
    }

    // 导出热门标注
    async function onClickExportHotBookMarks() {
        try {
            message.open({ key: 'export', type: 'loading', content: '导出中，请稍等...', duration: 0 });
            await loadImage();
            message.open({ key: 'export', type: 'loading', content: '导出中，请稍等...', duration: 0 });
            // 通知 background.js 执行 getAllMarks
            const title = getBookTile();
            chrome.runtime.sendMessage({ type: "exportHotBookMarks", title: title, isHot: true }, function (resp) {
                console.log('exportHotBookMarks', resp);
                if (!resp.content || resp.content == false) {
                    message.open({ key: 'export', type: 'error', content: '导出热门标注失败!', duration: 5 });
                } else {
                    copy(resp.content).then(() => {
                        message.open({ key: 'export', type: 'success', content: '已成功导出到剪贴板!', duration: 2 });
                    });
                }

            });
        } catch (error) {
            console.error('Error occurred during export:', error);
            message.open({ key: 'export', type: 'error', content: '导出热门标注失败!', duration: 5 });
        }
    }

    // 导出到 Notion
    async function onClickExportToNotion() {
        try {
            // 检查 databaseId 和 notionToken 是否为空
            const databaseId = await getLocalStorageData('databaseId') as string;
            const notionToken = await getLocalStorageData('notionToken') as string;
            if (!databaseId || !notionToken) {
                message.error('请先查看使用说明，设置 Notion Database ID, Notion Token！', 10);
                return;
            }
            message.open({ key: 'export', type: 'loading', content: '导出中，请稍等...', duration: 0 });
            await loadImage();
            message.open({ key: 'export', type: 'loading', content: '导出中，请稍等...', duration: 0 });
            const title = getBookTile();
            chrome.runtime.sendMessage({ type: "exportToNotion", title: title }, function (resp) {
                console.log('exportToNotion', resp);
                if (!resp.content || resp.content == false) {
                    message.open({ key: 'export', type: 'error', content: '导出到 Notion 失败!', duration: 5 });
                } else {
                    message.open({ key: 'export', type: 'success', content: '已成功导出到 Notion!', duration: 2 });
                }

            });
        } catch (error) {
            console.error('Error occurred during export:', error);
            message.open({ key: 'export', type: 'error', content: '导出到 Notion 失败!', duration: 2 });
        }
    }

    // 加载图片
    function loadImage() {
        return new Promise(async (resolve, reject) => {
            // 获取 isExportImage 的值
            const isExportImage = await getLocalStorageData('isExportImage') as boolean;
            console.log('isExportImage is ', isExportImage);
            if (isExportImage == false) {
                // 不执行后续逻辑
                resolve(undefined);
                return;
            }
            message.open({ key: 'export', type: 'loading', content: '图片加载中，如果本书已加载过图片，可在设置页关闭图片加载...', duration: 0 });
            try {
                const catalogItem = document.querySelector('.readerControls_item.catalog') as HTMLElement;
                simulateClick(catalogItem);
                const readerCatalog = document.querySelector('.readerCatalog');
                if (readerCatalog) {
                    readerCatalog.removeAttribute('style');
                    simulateClick(document.querySelector('.readerCatalog_list_item'));
                    readerCatalog.setAttribute('style', 'display: none;');
                }
                simulateClick(catalogItem);

            }catch (error) {
                console.log('simulateClick catalogItem error: ', error);
            }
            await sleep(1000); // 等待数据加载完成
            // 点击下一章直到最后
            clickReaderFooterButton(resolve);
        });
    }

    // 点击下一章直到最后
    function clickReaderFooterButton(resolve) {
        const nextPageButton = document.querySelector('.readerFooter_button');
        console.log('nextPageButton', nextPageButton);
        if (nextPageButton) {
            var evt = new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
            nextPageButton.dispatchEvent(evt);
            setTimeout(() => clickReaderFooterButton(resolve), 1000);
        } else {
            resolve(); // 图片加载完成，解析Promise
        }
    }

    // 初始化图片加载器
    function initImageLoader() {
        console.log('initImageLoader');
        const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
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

    // 初始化消息监听
    function initMessageListener() {
        console.log('initMessageListener');
        // 监听 service worker 消息
        chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.alert) {
                message.error(msg.alert, 10);
                sendResponse({ succ: 1 });
            } else if (msg.content) {
                copy(msg.content);
            }

        });

        // 接收interceptor传来的信息，将bookId存入 storage
        // 数据存入格式 title-bookId: bookId
        window.addEventListener('message', function (event) {
            if (event.source === window && event.data && event.data.action === 'sendBookId') {
                const bookId = event.data.bookId;
                const title = event.data.title;
                if (chrome && chrome.storage && chrome.storage.local) {
                    const data = { [`${title}-bookId`]: bookId };
                    chrome.storage.local.set(data);
                }
            }
        });
    }

    return (
        <FloatButton.Group onOpenChange={openChange} trigger="click" type="default" icon={<BookOutlined />} >
            <FloatButton onClick={() => onClickExportBookMarks()} icon={<HighlightOutlined />} tooltip={<div>导出全书标注</div>} className="readerControls_item" />
            <FloatButton onClick={() => onClickExportHotBookMarks()} icon={<FireOutlined />} tooltip={<div>导出热门标注</div>} className="readerControls_item" />
            <FloatButton onClick={() => onClickExportToNotion()} icon={<CloudSyncOutlined />} tooltip={<div>同步到 Notion</div>} className="readerControls_item" />
            <FloatButton onClick={() => onClickSetScreen()} icon={<PlusCircleOutlined />} tooltip={<div>调整屏幕宽度</div>} className="readerControls_item" />
        </FloatButton.Group>
    )
}

export default Menu;
