import React, { useEffect, useRef } from 'react';
import { FloatButton } from 'antd';
import {
    BookOutlined,
    HighlightOutlined,
    FireOutlined,
    BgColorsOutlined,
    PlusCircleOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import type { PlasmoCSConfig } from 'plasmo';
import { copy, getBookTile, setScreen, simulateClick, sleep } from './content-utils';
import './content-menu.css';

export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/reader/*"],
    run_at: "document_idle",
    css: ["./content-menu.css"],
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
        console.log('openChange', open);
        const parentElement = document.querySelector('.readerControls');
        let childElements = Array.from(parentElement.children);
        childElements = childElements.slice(0, childElements.length - 2);

        if (open) {
            childElements.forEach((element) => element.style.visibility = 'hidden') // 设置元素隐藏
        } else {
            childElements.forEach((element) => element.style.visibility = 'visible')// 设置元素可见
        }
    };

    const onClickSetScreen = () => {
        chrome.storage.local.get('screenCoefficient', function (result) {
            let screen = result.screenCoefficient || 1.0
            screen = Number.parseFloat(screen) + 0.1;
            screen = screen > 1.6 ? 1.0 : screen;
            console.log("screenCoefficient", screen)
            setScreen(initWidth.current * screen)
            chrome.storage.local.set({ 'screenCoefficient': screen })
        })
    };

    const onClickExportBookMarks = (isHot: boolean) => {
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
        message.open({ key: 'export', type: 'loading', content: '数据加载中...', duration: 0 });

        // 点击下一章直到最后
        setTimeout(() => clickReaderFooterButton(isHot), 1000);
    }

    function clickReaderFooterButton(isHot: boolean) {
        const nextPageButton = document.querySelector('.readerFooter_button');
        if (nextPageButton) {
            var evt = new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
            nextPageButton.dispatchEvent(evt);
            setTimeout(() => clickReaderFooterButton(isHot), 1000);
        } else {
            // 通知 background.js 执行 getAllMarks
            const title = getBookTile();
            chrome.runtime.sendMessage({ type: "exportBookMarks", title: title, isHot: isHot }, function (resp) {
                console.log('exportBookMarks', resp);
                copy(resp.content).then(() => {
                    message.open({ key: 'export', type: 'success', content: '已成功导出到剪贴板!', duration: 2 });
                });
            });
        }
    }

    function initImageLoader() {
        console.log('initImageLoader');
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

    function initMessageListener() {
        console.log('initMessageListener');
        // 监听 service worker 消息
        chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.alert) {
                // showToast(msg.alert);
                // 通知后台正常显示了通知
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
                if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    const data = { [`${title}-bookId`]: bookId };
                    chrome.storage.local.set(data);
                }
            }
        });
    }

    return (
        <FloatButton.Group onOpenChange={openChange} trigger="click" type="default" icon={<BookOutlined />} >
            <FloatButton onClick={() => onClickExportBookMarks(false)} icon={<HighlightOutlined />} tooltip={<div>导出全书标注</div>} className="readerControls_item" />
            <FloatButton onClick={() => onClickExportBookMarks(true)} icon={<FireOutlined />} tooltip={<div>导出热门标注</div>} className="readerControls_item" />
            <FloatButton onClick={() => onClickSetScreen()} icon={<PlusCircleOutlined />} tooltip={<div>调整屏幕宽度</div>} className="readerControls_item" />
            {/* <FloatButton onClick={() => console.log('click 设置主题')} icon={<BgColorsOutlined />} tooltip={<div>设置主题</div>} className="readerControls_item" /> */}
        </FloatButton.Group>
    )
}

export default Menu;
