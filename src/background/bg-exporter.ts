import { featchBookmarks, featchChapInfos } from "~background/bg-weread-api";
import { sendMssage } from "./bg-utils";

/**
 * 导出所有标注
 * @param chapterImgData 
 * @param curChapterTitle 
 */
export async function exportBookMarks(chapterImgData: {}, curChapterTitle?: string) {
    try {
        // 获取书籍 id
        const bookId = await getBookIdFromStorage() as string;
        console.log('getBookMarks', bookId);

        // 获取标注并根据 chapterUid 分组
        const { updated: marks = [] } = await featchBookmarks(bookId) || {};
        const groupedMarks = marks.reduce((groupedMarks: Record<number, any[]>, mark: any) => {
            const { chapterUid } = mark;
            groupedMarks[chapterUid] = groupedMarks[chapterUid] || [];
            groupedMarks[chapterUid].push(mark);
            return groupedMarks;
        }, {});

        // 获取目录
        const chapInfos = await featchChapInfos(bookId);
        const chapters = chapInfos.data[0].updated;
        console.log('chapters', chapters);
        // 处理标注和目录，生成 markdown 文本
        let res = "";
        for (const chapter of chapters) {
            const { title, level, anchors, chapterUid } = chapter;
            // 如果指定了章节标题，只处理该章节
            if (curChapterTitle && title !== curChapterTitle) continue;
            if (Config.allTitles || marks.length) {
                res += `${getTitleAddedPreAndSuf(title, level)}\n\n`;
                if (anchors && anchors[0]?.title !== title) {
                    for (const anchor of anchors) {
                        res += `${getTitleAddedPreAndSuf(anchor.title, anchor.level)}\n\n`;
                    }
                }
            }
            res += traverseMarks(groupedMarks[chapterUid] || [], chapterImgData);
        }

        // 发送生成的 markdown 文本给前端
        return res;
    } catch (error) {
        console.error("exportBookMarks error:", error);
    }
}

const escapeRegExp = require('lodash.escaperegexp');

function traverseMarks(marks: any[], chapterImgData: { [key: string]: string }) {
    let prevMarkText = ""; // 保存上一条标注文本
    let tempRes = ""; // 保存上一条处理后追加到 res 的标注文本
    let res = "";
  
    for (const mark of marks) { // 遍历章内标注
      if (mark.abstract && mark.content) { // 如果为想法
        const thouContent = `${Config.thouPre}${mark.content}${Config.thouSuf}\n\n`; // 想法
        let thouAbstract = `${Config.thouMarkPre}${mark.abstract}${Config.thouMarkSuf}\n\n`; // 想法所标注的内容
  
        if (mark.abstract === prevMarkText) { // 想法所对应文本与上一条标注相同时
          if (Config.thoughtTextOptions === ThoughtTextOptions.JustMark) {
            thouAbstract = ''; // 如果只保留标注文本，则 thouAbstract 设为空
          } else if (Config.thoughtTextOptions === ThoughtTextOptions.JustThought) {
            res = res.replace(new RegExp(escapeRegExp(tempRes) + `$`), ""); // 如果只保留想法所对应的文本，将上一次追加得到的标注文本（tempRes）删掉
          }
          prevMarkText = '';
        }
  
        // 是否将想法添加到对应标注之前
        if (Config.thoughtFirst) {
          res += thouContent + thouAbstract;
        } else {
          res += thouAbstract + thouContent;
        }
      } else if (mark.markText.includes("[插图]")) { // 插图
        let imgData = findImagesInRange(chapterImgData, mark.range);
        let index = 0;
        res += mark.markText.replace(/\[插图\]/g, (match: string) => {
          return `![插图](${imgData[index++]})\n` || match;
        });
      } else { // 标注
        prevMarkText = mark.markText;
        tempRes = regexpReplace(prevMarkText);
        tempRes = `${addMarkPreAndSuf(tempRes, mark.style)}\n\n`;
        res += tempRes;
      }
    }
  
    return res;
}


function findImagesInRange(imageDict: { [offset: string]: string }, range: string): string[] {
    let [min, max] = range.split("-").map(Number);
    if (max === undefined || max - min <= 1) {
        return [imageDict[min]];
    }
    const result: string[] = [];
    for (const [offset, imgUrl] of Object.entries(imageDict)) {
        const offsetNum = Number(offset);
        if (offsetNum >= min && offsetNum <= max) result.push(imgUrl);
    }

    return result;
}

// 给标题添加前后缀
function getTitleAddedPreAndSuf(title: string, level: number) {
    let newTitle = '';
    switch (level) {
        case 1:
        case 2:
        case 3:
            newTitle = Config[`lev${level}Pre`] + title + Config[`lev${level}Suf`];
            break;
        case 4: //添加 4 5 6 级及 default 是为了处理特别的书（如导入的书籍）
        case 5:
        case 6:
        default:
            const { lev3Pre, lev3Suf } = Config;
            newTitle = `${lev3Pre}${title}${lev3Suf}`;
            break;
    }
    return newTitle;
}

// 根据标注类型获取前后缀
function addMarkPreAndSuf(markText: string, style: number) {

    const pre = (style == 0) ? Config["s1Pre"]
        : (style == 1) ? Config["s2Pre"]
            : (style == 2) ? Config["s3Pre"]
                : ""

    const suf = (style == 0) ? Config["s1Suf"]
        : (style == 1) ? Config["s2Suf"]
            : (style == 2) ? Config["s3Suf"]
                : ""

    return pre + markText + suf
}

// 给 markText 进行正则替换
function regexpReplace(markText: string) {
    let regexpConfig = Config.re
    for (let reId in regexpConfig) {
        let replaceMsg = regexpConfig[reId].replacePattern.match(/^s\/(.+?)\/(.*?)\/(\w*)$/)
        if (!regexpConfig[reId].checked
            || replaceMsg == null
            || replaceMsg.length < 4) {//检查是否选中以及是否满足格式
            continue
        }
        let pattern = replaceMsg[1]
        let replacement = replaceMsg[2]
        let flag = replaceMsg[3]
        let regexpObj = new RegExp(pattern, flag)
        if (regexpObj.test(markText)) {
            markText = markText.replace(regexpObj, replacement)
            //匹配一次后结束匹配
            break
        }
    }
    return markText
}


// 获取当前活动标签页的 bookId
async function getBookIdFromStorage() {
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    console.log('getBookIdFromStorage tab', tab);
    if (tab && tab.url && tab.url.indexOf('//weread.qq.com/web/reader/') < 0) return null;
    if (tab.id) {
        return new Promise((res, rej) => {
            chrome.storage.local.get(tab.id.toString(), function (data) {
                const bookId = data[tab.id.toString()];
                console.log('getBookIdFromStorage bookId', bookId);
                return res(bookId.toString());
            });
        }).catch(err => { });
    }
}

// ======== 以下为配置项 ========
// "选中后动作"选项
export enum SelectActionOptions {
    None = "underlineNone",
    Copy = "copy",
    Bg = "underlineBg",
    Straight = "underlineStraight",
    HandWrite = "underlineHandWrite"
}

// "想法所对应文本被标注时保留"选项
export enum ThoughtTextOptions {
    JustThought = "thoughtTextThought",
    All = "thoughtTextAll",
    JustMark = "thoughtTextMark"
}

const DefaultRegexPattern = { replacePattern: '', checked: false };

var Config = {
    s1Pre: "",
    s1Suf: "",
    s2Pre: "**",
    s2Suf: "**",
    s3Pre: "",
    s3Suf: "",
    lev1Pre: "## ",
    lev1Suf: "",
    lev2Pre: "### ",
    lev2Suf: "",
    lev3Pre: "#### ",
    lev3Suf: "",
    thouPre: "==",
    thouSuf: "==",
    thouMarkPre: "> ",
    thouMarkSuf: "",
    codePre: "```",
    codeSuf: "```",
    displayN: false,
    mpShrink: false,
    mpContent: false,
    mpAutoLoad: true,
    allTitles: false,
    addThoughts: true,
    thoughtFirst: false,
    enableDevelop: false,
    enableStatistics: false,
    enableOption: true,
    enableCopyImgs: true,
    enableFancybox: true,
    enableThoughtEsc: true,
    backupName: "默认设置",
    selectAction: SelectActionOptions.None,
    thoughtTextOptions: ThoughtTextOptions.JustThought,
    //如果不设置默认值，则在设置页初始化时需要考虑到 
    re: { re1: DefaultRegexPattern, re2: DefaultRegexPattern, re3: DefaultRegexPattern, re4: DefaultRegexPattern, re5: DefaultRegexPattern },
    flag: 0
}

