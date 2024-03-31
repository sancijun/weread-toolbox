import React, { useEffect, useRef, useState } from 'react';
import { FloatButton, notification, Modal, Button, Space, Tooltip } from 'antd';
import {
    BookOutlined,
    HighlightOutlined,
    FireOutlined,
    CloudSyncOutlined,
    PlusCircleOutlined,
    CopyOutlined,
    CloudDownloadOutlined,
    RetweetOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
} from '@ant-design/icons';
import type { PlasmoCSConfig } from 'plasmo';
import { copy, getBookTile, getLocalStorageData, setScreen, simulateClick, sleep } from './content-utils';
import saveAs from 'file-saver';
import { exportBookMarks } from '~core/core-export-local';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Markmap from '../component/Markmap';
import 'github-markdown-css/github-markdown.css';


import './content-menu.css';
import { exportToNotion } from '~core/core-export-notion';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMarkmapModel, setIsMarkmapModel] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [api, contextHolder] = notification.useNotification();
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

        document.body.style.userSelect = 'auto';
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
        const title = getBookTile();
        try {
            api['info']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》全书标注导出中，请稍等...`, duration: null });
            await loadImage();
            const bookId = await getLocalStorageData(`${title}-bookId`) as string;
            if (!bookId) {
                api['error']({ key: 'export', message: '导出微信读书笔记', description: `信息缺失，请点击上一页(或下一页)，加载更多信息后重试！`, duration:  10 });
                return false;
            }
            const content = await exportBookMarks(bookId, title, false) as string;
            setIsModalOpen(true);
            setMarkdownContent(content);
            api['success']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》 全书标注已成功导出!`, duration: 5 });
        } catch (error) {
            console.error('Error occurred during export:', error);
            api['error']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》全书标注导出失败！可联系三此君，反馈异常详情！${error}`, duration:  10 });
        }
    }

    // 导出热门标注
    async function onClickExportHotBookMarks() {
        const title = getBookTile();
        try {
            api['info']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》热门标注导出中，请稍等...`, duration: null });
            await loadImage();
            const bookId = await getLocalStorageData(`${title}-bookId`) as string;
            if (!bookId) {
                api['error']({ key: 'export', message: '导出微信读书笔记', description: `信息缺失，请点击上一页(或下一页)，加载更多信息后重试！`, duration:  10 });
                return false;
            }
            const content = await exportBookMarks(bookId, title, true) as string;
            setIsModalOpen(true);
            setMarkdownContent(content);
            api['success']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》热门标注已成功导出!`, duration: 5 });
        } catch (error) {
            console.error('error occurred during export:', error);
            api['error']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》热门标注导出失败！可联系三此君，反馈异常详情！${error}`, duration: null });
        }
    }

    // 导出到 Notion
    async function onClickExportToNotion() {
        const title = getBookTile();
        try {
            // 检查 databaseId 和 notionToken 是否为空
            const databaseId = await getLocalStorageData('databaseId') as string;
            const notionToken = await getLocalStorageData('notionToken') as string;
            if (!databaseId || !notionToken) {
                api['error']({ key: 'export', message: '导出微信读书笔记', description: '请先查看使用说明，设置 Notion Database ID, Notion Token！', duration: null });
                return;
            }
            api['info']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》微信读书笔记导出中，请稍等...`, duration: null });
            await loadImage();
            api['info']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》微信读书笔记导出中，请稍等...`, duration: null });

            chrome.runtime.sendMessage({ type: "exportToNotion", title: title }, function (resp) {
                console.log('exportToNotion', resp);
                if (resp.content) {
                    api['success']({ key: 'export', message: '微信读书笔记', description: `《${title}》微信读书笔记已同步到 Notion!`, duration: null });
                } else {
                    api['error']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》微信读书笔记同步 Notion 失败!`, duration: null });
                }
            });
        } catch (error) {
            console.error('Error occurred during export:', error);
            api['error']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》微信读书笔记同步 Notion 失败!`, duration: null });
        }
    }

    // 加载图片
    function loadImage() {
        return new Promise(async (resolve, reject) => {
            // 获取 isExportImage 的值
            const isExportImage = await getLocalStorageData('isExportImage') as boolean;
            const isImageLoadedKey = `${getBookTile()}-isImageLoaded`;
            const isImageLoaded = await getLocalStorageData(isImageLoadedKey) as boolean;
            console.log('load image', isExportImage, isImageLoaded);
            if (!isExportImage && isImageLoaded) {
                // 如果不强制导出图片，并且加载过图片，则不执行后续逻辑
                resolve(undefined);
                return;
            }
            api['info']({ key: 'export', message: '导出微信读书笔记', description: '图片加载中，首次导出时会加载图片，如果图片加载有问题，可在设置也开启强制加载图片后重试...', duration: null });
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

            } catch (error) {
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
            const isImageLoadedKey = `${getBookTile()}-isImageLoaded`;
            chrome.storage.local.set({ [isImageLoadedKey]: true}, () => { console.log("image load success.");});
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
                api['error']({ key: 'export', message: '导出微信读书笔记', description: msg.alter });
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

    function downloadMarkdown(){
        const title = getBookTile();
        saveAs(new Blob([markdownContent], { type: 'text/plain' }), `${title}.md`)
        api['success']({ key: 'export', message: '导出微信读书笔记', description: `《${title}》微信读书笔记已成功下载!`, duration: 10 });
    }

    function copyMarkdown(){
        copy(markdownContent).then(() => {
            api['success']({ key: 'export', message: '导出微信读书笔记', description: `《${getBookTile()}》微信读书笔记已成功复制到剪贴板!`, duration: 10 });
        }); 
    }

    return (
        <>
            {contextHolder}
            <FloatButton.Group onOpenChange={openChange} trigger="click" type="default" icon={<BookOutlined />} >
                <FloatButton onClick={() => onClickExportBookMarks()} icon={<HighlightOutlined />} tooltip={<div>全书标注</div>} className="readerControls_item" />
                <FloatButton onClick={() => onClickExportHotBookMarks()} icon={<FireOutlined />} tooltip={<div>热门标注</div>} className="readerControls_item" />
                <FloatButton onClick={() => onClickExportToNotion()} icon={<CloudSyncOutlined />} tooltip={<div>同步Notion</div>} className="readerControls_item" />
                <FloatButton onClick={() => onClickSetScreen()} icon={<PlusCircleOutlined />} tooltip={<div>调整屏幕宽度</div>} className="readerControls_item" />
            </FloatButton.Group>
            <Modal title={`微信读书工具箱 |《${getBookTile()}》笔记`} open={isModalOpen} width={isFullscreen ? "100%" : "50%"} style={{ height: isFullscreen ? "100vh" : "auto", top: 10  }} onCancel={() => setIsModalOpen(false)} footer={null}>
                {isMarkmapModel ? (
                    <div id="react-markmap-content" >
                        <Space style={{ float: "right", marginTop: "-40px", marginRight: "30px" }}>
                            <Tooltip placement="bottom" title='转换'>
                                <Button type="text" onClick={() => setIsMarkmapModel(!isMarkmapModel)} icon={<RetweetOutlined />} />
                            </Tooltip>
                            <Tooltip placement="bottom" title={isFullscreen ? '退出全屏' : '全屏'}>
                                <Button type="text" onClick={() => setIsFullscreen(!isFullscreen)} icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}  />
                            </Tooltip>
                            <Tooltip placement="bottom" title='下载'>
                                <Button type="text" onClick={downloadMarkdown} icon={<CloudDownloadOutlined />} />
                            </Tooltip>
                            <Tooltip placement="bottom" title='复制'>
                                <Button type="text" onClick={copyMarkdown} icon={<CopyOutlined />} />
                            </Tooltip>
                        </Space>
                        <Markmap initValue={markdownContent} ></Markmap>
                    </div>
                ) : (
                    <div id="react-markdown-content">
                        <Space style={{ float: "right", marginTop: "-40px", marginRight: "30px" }}>
                            <Tooltip placement="bottom" title='转换'>
                                <Button type="text" onClick={() => setIsMarkmapModel(!isMarkmapModel)} icon={<RetweetOutlined />} />
                            </Tooltip>
                            <Tooltip placement="bottom" title='下载'>
                                <Button type="text" onClick={downloadMarkdown} icon={<CloudDownloadOutlined />} />
                            </Tooltip>
                            <Tooltip placement="bottom" title='复制'>
                                <Button type="text" onClick={copyMarkdown} icon={<CopyOutlined />} />
                            </Tooltip>
                        </Space>
                        <div className="markdown-body">
                            <ReactMarkdown children={markdownContent} remarkPlugins={[remarkGfm]} />
                        </div>
                    </div>
                )}
            </Modal>

        </>
    )
}

export default Menu;
