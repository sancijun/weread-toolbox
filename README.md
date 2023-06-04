<h2 align="center"><img src="assets/icon.png" height="128"><br></h2>
<p align="center"><strong>微信读书工具箱，支持导出图文 Markdown 笔记，同步 Notion 等。</strong></p>

## 安装

[![Chrome](https://img.shields.io/badge/-Chrome-brightgreen?logo=GoogleChrome)](./build/chrome-mv3-prod.zip)
[![Edge](https://img.shields.io/badge/-Edge-blue?logo=MicrosoftEdge)](./build/edge-mv3-prod.zip)
[![Mozilla add\-on: Firefox](https://img.shields.io/badge/-Firefox-brightgreen?logo=FirefoxBrowser)](./build/firefox-mv2-prod.zip)
[![Brave](https://img.shields.io/badge/-Brave-yellow?logo=Brave)](./build/brave-mv3-prod.zip)
[![Opera](https://img.shields.io/badge/-Opera-red?logo=Opera)](./build/opera-mv3-prod.zip)

1. 首先，点击上方图标，下载你需要的浏览器插件压缩包。下载好后解压到某个文件夹（比如 `weread-toobox`）。
![image-20230603145959878](https://img2023.cnblogs.com/blog/2740513/202306/2740513-20230603150001391-1222145165.png)
[百度云下载地址（可能不是最新版）](https://pan.baidu.com/s/1TKgvpArGmRSvDkS-pTVV5g?pwd=8ssd)

2. 接下来，进入 Chrome 在地址栏输入 `chrome://extensions/` 后回车，进入扩展管理页面。

3. 进入页面后，先打开 `开发者模式`，再点击 `加载已解压的扩展程序`，找到前面解压得到的文件夹 `weread-toobox`，**单击**该文件夹，这时候文件夹被选中，点击 `选择文件夹` 即可。

[查看演示]()

## 功能

1. 导出全书标注：支持导出全书图文 Markdown 笔记；
2. 导出热门标注：导出本书图文热门笔记，快速了解全书精华内容；
3. 同步 Notion：支持图文笔记导出到 Notion；
4. 调整读书页屏幕宽度；
5. 解除右键限制；

## 导出 Notion

1. 获取 Notion Token：
浏览器打开 https://www.notion.so/my-integrations
点击 New integration 输入 name 提交
点击 show，然后 copy

2. 复制 [Notion 模板](https://sancijun.notion.site/8a17716b20db4ec1a99c2e03d9c633ee)，并点击右上角设置，Connections 添加你创建的 Integration。
<img src="https://img2023.cnblogs.com/blog/2740513/202306/2740513-20230604120901298-1557718703.png" alt="image-20230604120858733" style="zoom: 33%;" />

3. 获取 Notion Database ID：
  打开 Notion 数据库，点击右上角的 Share，然后点击 Copy link
  获取链接，比如 https://sancijun.notion.site/8a17716b20db4ec1a99c2e03d9c633ee 中间的 `8a17716b20db4ec1a99c2e03d9c633ee` 就是 Database ID

4. 微信读书工具箱设置，然后点击同步到 Notion 按钮即可。
<img src="https://img2023.cnblogs.com/blog/2740513/202306/2740513-20230603144931569-2690162.png" alt="image-20230603144930462" style="zoom: 33%;" />

## FQA

1. 如果导出图片失败，可能由于网络问题，有的图片没有加载到，建议重试。
2. 如果插件安装后没有微信读书工具箱的按钮，可以先禁用其他同类插件。

## 致谢

| Item                                                         | Reason                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [wereader](https://github.com/Higurashi-kagome/wereader)     | 本项目导出全部标注参考了 [wereader](https://github.com/Higurashi-kagome/wereader) 。 |
| [weread_to_notion](https://github.com/malinkang/weread_to_notion) | 本项目导出到 Notion 功能参考了 [weread_to_notion](https://github.com/malinkang/weread_to_notion) 项目。 |