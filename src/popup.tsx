import React from 'react';
import { Card, Typography, Button, Popover } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faBilibili, faTiktok, faWeixin } from '@fortawesome/free-brands-svg-icons';

const { Paragraph } = Typography;

const PopupPage = () => {
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
      <Card title="微信读书工具箱">
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
          <Button type="primary" ghost onClick={() => openLink("https://github.com/sancijun/weread-toolbox/issues/new?assignees=&labels=enhancement&projects=&template=----.md&title=%5BFeature%5D+")} style={{ marginRight: '8px' }}>
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
      </Card>
    </div>
  );
};

export default PopupPage;
