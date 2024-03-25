import type { PlasmoCSConfig } from "plasmo";
import { getCurrentTimestamp, sleep } from "./content-utils";
import { Button, Form, Input, Modal, Tooltip, Typography, notification } from "antd";
import { useEffect, useState } from "react";
import { QuestionCircleOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';

import './content-export.css';
import { exportBookMarks } from "~core/core-export-local";
import { fetchShelfData } from "~core/core-weread-api";
import JSZip from "jszip";


export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/shelf"],
    run_at: "document_idle",
};

export const getRootContainer = async () => {
    let container;
    for (let retryCount = 0; retryCount < 50 && !container; retryCount++) {
        container = document.querySelector('.shelf_download_app');
        console.log('container', container);
        await sleep(500)
    }
    const menuContainer = document.createElement('div');
    container.insertAdjacentElement('beforebegin', menuContainer);
    return menuContainer;
};

const Exporter: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        // 监听 service worker 消息
        chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            if(msg.type == 'download'){
                console.log('download content', msg.content);
                saveAs(msg.content, `weread-toolbox-export-${getCurrentTimestamp()}.zip`);
            }else{
                api[msg.type]({
                    key: msg.key,
                    message: msg.title,
                    description: msg.content,
                    duration: null,
                });
            }
            
            sendResponse({ succ: 1 });
        });
    }, []);

    async function showModal() {
        setIsModalOpen(true);
        chrome.storage.local.get(
            ["databaseId", "notionToken"],
            (result) => {
                const { databaseId, notionToken } = result;
                if (databaseId) {
                    form.setFieldsValue({ databaseId });
                }
                if (notionToken) {
                    form.setFieldsValue({ notionToken });
                }
            }
        );
    };

    async function onClickExportAllToNotion() {
        setIsModalOpen(false);
        const { databaseId, notionToken } = form.getFieldsValue();
        if (!databaseId || !notionToken) {
            api['error']({key: 'export', message: '全量导出微信读书笔记', description: '请先查看使用说明，设置 Notion Database ID, Notion Token！', duration: null });
            return;
        }
        console.log('onClickExportAllToLocal', databaseId, notification);
        chrome.runtime.sendMessage({ type: "exportAllToNotion", databaseId: databaseId, notionToken: notionToken }, (resp) => {console.log('exportAllToNotion', resp);});
    }

    async function onClickExportAllToLocal() {
        setIsModalOpen(false);
        const zip = new JSZip()
        let noMarkCount = 0;
        try {
            const shelf = await fetchShelfData();
            console.log('export all to local, books', shelf.books.length);
            for (let i = 0; i < shelf.books.length; i++) {
                const book = shelf.books[i];
                try {
                    api['info']({ key: 'exportAllToLocal', message:'全量导出微信读书笔记', description: `正在导出《${book.title}》，当前进度 ${i + 1} / ${shelf.books.length} ，导出完成前请勿关闭或刷新本页面，`, duration: null, });
                    const content = await exportBookMarks(book.title, false, book.bookId);
                    if(content && !content.includes("没有任何笔记")) {
                        zip.file(`${book.title}.md`, content);
                    }else{
                        noMarkCount++;
                    }
                } catch (error) {
                    console.error("Export Single To Local Error:", book, error);
                }
            }
            const f = await zip.generateAsync({ type: 'blob' });
            api['success']({ key: 'exportAllToLocal', message:'全量导出微信读书笔记', description: `导出完成，共处理 ${shelf.books.length } 本书籍，其中 ${noMarkCount} 本书籍没有笔记，成功导出 ${shelf.books.length-noMarkCount} 篇笔记。`, duration: null, });
            saveAs(f, `weread-toolbox-export-${getCurrentTimestamp()}.zip`);
        } catch (error) {
            api['error']({ key: 'exportAllToLocal', message:'全量导出微信读书笔记', description: '导出失败，请检查 Notion 设置是否正确。可联系三此君，反馈异常详情！', duration: null, })
            console.error("Export All To Local Error:", error);
            return false;
        }
    }


    async function onClickCancel() {
        setIsModalOpen(false);
    }

    return (
        <>
            {contextHolder}
            <Button onClick={showModal} shape="round" type="text" className="shelf_download_app">导出微信读书笔记</Button>
            <Modal title="全量导出微信读书笔记" open={isModalOpen} onCancel={onClickCancel}
                footer={[
                    <Button key="exportToNotion" onClick={onClickExportAllToNotion} >
                        同步Notion
                    </Button>,
                    <Button key="exportToLocal" onClick={onClickExportAllToLocal} >
                        下载到本地
                    </Button>,
                ]}>
                <Typography.Text>你可以选择全量导出到本地或者全量同步到 Notion。</Typography.Text>
                <Typography.Text>全量同步 Notion 不会覆盖数据库中已经存在的内容。</Typography.Text>
                <Form form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 24 }} layout="vertical" style={{ marginTop: "24px"}}>
                    <Form.Item
                        label={
                            <span>
                                Database ID&nbsp;
                                <Tooltip title="点击关于->使用说明，查看如何获取 Notion Database ID">
                                    <QuestionCircleOutlined />
                                </Tooltip>
                            </span>
                        }
                        name="databaseId"
                        rules={[{ required: true, message: "Please enter the Database ID" }]}
                    >
                        <Input placeholder="请输入 Notion Database ID" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <span>
                                Notion Token&nbsp;
                                <Tooltip title="点击关于->使用说明，查看如何获取 Notion Token">
                                    <QuestionCircleOutlined />
                                </Tooltip>
                            </span>
                        }
                        name="notionToken"
                        rules={[{ required: true, message: "Please enter the Notion Token" }]}
                    >
                        <Input.Password placeholder="请输入 Notion Token" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default Exporter;