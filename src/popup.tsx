import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Popover, Input, Tooltip, Form, Switch } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { faGithub, faBilibili, faTiktok, faWeixin } from '@fortawesome/free-brands-svg-icons';

const { Paragraph } = Typography;


const AboutPageContent = () => {
  const popoverContent = {
    github: "三此君 GitHub",
    bilibili: <img src="https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230530083651756-1915761883.jpg" alt="视频B站首发" style={{ width: '150px', height: '150px' }} />,
    tiktok: <img src="https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230529203236662-1716684994.jpg" alt="抖音" style={{ width: '150px', height: '150px' }} />,
    gzh: <img src="https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230529203219168-2117666216.jpg" alt="公众号" style={{ width: '150px', height: '150px' }} />,
    wechat: <img src="https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230529203303815-1142190090.jpg" alt="微信号" style={{ width: '150px', height: '150px' }} />,
  };

  const openLink = (url) => {
    chrome.tabs.create({ url });
  };

  return (
    <div style={{ padding: '10px', width: '350px' }}>
      <Paragraph style={{ fontSize: '15px', padding: '5px' }}>
        感谢支持！
        <br />
        如果觉得本工具不错，请分享给你的朋友！
        <br />
        有任何问题也可以私信三此君，交个朋友。
      </Paragraph>

      <div style={{ display: 'flex' }}>
        <Button onClick={() => openLink("https://github.com/sancijun/weread-toolbox#readme")} style={{ marginRight: '8px', marginLeft: '5px' }}>
          使用说明
        </Button>
        <Button type="primary" ghost onClick={() => openLink("https://github.com/sancijun/weread-toolbox/issues/new?assignees=&labels=enhancement&projects=&template=---feature.md&title=%5BFeature%5D+")} style={{ marginRight: '8px' }}>
          功能建议
        </Button>
        <Button danger onClick={() => openLink("https://github.com/sancijun/weread-toolbox/issues/new?assignees=&labels=&projects=&template=---bug.md&title=%5BBug%5D+")}>
          缺陷反馈
        </Button>
      </div>

      <div style={{ display: 'flex', marginTop: '12px' }}>
        <Popover content={popoverContent.wechat} title="三此君微信号">
          <Button type="text" style={{ padding: '5px', fontSize: '13px' }}>
            联系作者：微信
          </Button>
        </Popover>
        <Popover content={popoverContent.bilibili} title="视频在B站首发">
          <Button type="text" icon={<FontAwesomeIcon icon={faBilibili} />} onClick={() => openLink("https://space.bilibili.com/96271327/")} style={{ padding: '5px', fontSize: '13px' }}>
            B站
          </Button>
        </Popover>
        <Popover content={popoverContent.tiktok} title="三此君抖音号">
          <Button type="text" icon={<FontAwesomeIcon icon={faTiktok} />} onClick={() => openLink("https://v.douyin.com/UuXokgA/")} style={{ padding: '5px', fontSize: '13px' }}>
            抖音
          </Button>
        </Popover>
        <Popover content={popoverContent.gzh} title="三此君公众号">
          <Button type="text" icon={<FontAwesomeIcon icon={faWeixin} />} style={{ padding: '5px', fontSize: '13px' }}>
            公众号
          </Button>
        </Popover>
      </div>
    </div>
  );
}

const { Item } = Form;

function SettingsPageContent() {
  const [form] = Form.useForm();

  useEffect(() => {
    chrome.storage.local.get(
      ["databaseId", "notionToken", "isExportImage"],
      (result) => {
        const { databaseId, notionToken, isExportImage } = result;
        if (databaseId) {
          form.setFieldsValue({ databaseId });
        }
        if (notionToken) {
          form.setFieldsValue({ notionToken });
        }
        if (isExportImage !== undefined) {
          form.setFieldsValue({ isExportImage });
        }
      }
    );
  }, [form]);

  const handleFormChange = (changedValues, allValues) => {
    chrome.storage.local.set(allValues, () => {
      console.log("Setting Data saved successfully.", allValues);
    });
  };

  return (
    <Form form={form} onValuesChange={handleFormChange} labelCol={{ span: 8 }} wrapperCol={{ span: 24 }}>
      <Item
        label={
          <span>
            强制图片加载&nbsp;
            <Tooltip title="如果开启强制图片加载，则每次导出笔记都会重新加载图片，否则只有在首次导出时才会加载图片。">
              <QuestionCircleOutlined />
            </Tooltip>
          </span>
        }
        name="isExportImage"
        valuePropName="checked"
        rules={[{ required: true }]}
      >
        <Switch/>
      </Item>
      <Item
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
      </Item>
      <Item
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
      </Item>
    </Form>

  );
}

const tabList = [
  {
    key: 'tab1',
    tab: '关于',
  },
  {
    key: 'tab2',
    tab: '设置',
  },
];

const contentList: Record<string, React.ReactNode> = {
  tab1: <AboutPageContent />,
  tab2: <SettingsPageContent />,
};

const PopupPage: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState<string>('tab1');

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  return (
    <Card
      style={{ width: '350px' }}
      tabList={tabList.map(tab => ({
        ...tab,
        key: tab.key,
        tab: <div style={{ width: '125px', display: 'flex', justifyContent: 'center' }}>{tab.tab}</div>, // 设置标签宽度
      }))}
      activeTabKey={activeTabKey}
      onTabChange={onTabChange}
    >
      {contentList[activeTabKey]}

    </Card>
  );
};

export default PopupPage;
