import { fetchBestBookmarks, fetchBookInfo, fetchBookmarks, fetchChapInfos, fetchReadInfo, fetchReviews } from "~core/core-weread-api";
import { calculateBookStrId, formatTimestamp, getLocalStorageData, sendMessage } from "./core-utils";

/**
 * 导出 Markdown 标注
 * @param chapterImgData 
 * @param curChapterTitle 
 */
export async function exportBookMarks(bookId: string, bookTitle: string, isHot: boolean) {
    // 获取图片数据
    const imgData = await getLocalStorageData(`${bookTitle}-ImgData`) as {};
    console.log('bookTitle', bookTitle, 'bookId', bookId, 'imgData', imgData);
    // 获取标注并根据 chapterUid 分组
    const marks = isHot
        ? (await fetchBestBookmarks(bookId))?.items || []
        : (await fetchBookmarks(bookId))?.updated || [];
    const reviews = (await fetchReviews(bookId))?.reviews.map(item => item.review) || [];
    marks.push(...reviews)
    if (marks.length == 0) return `《${bookTitle}》 还没有任何笔记。`

    const groupedMarks = marks.reduce((groupedMarks: Record<number, any[]>, mark: any) => {
        const { chapterUid } = mark;
        groupedMarks[chapterUid] = groupedMarks[chapterUid] || [];
        groupedMarks[chapterUid].push(mark);
        return groupedMarks;
    }, {});

    // 获取目录
    const chapInfos = await fetchChapInfos(bookId);
    const chapters = chapInfos.data[0].updated;
    // 处理标注和目录，生成 markdown 文本
    let res = await addMeta(bookId);
        res += `# ${bookTitle}\n\n`;
    for (const chapter of chapters) {
        const { title, level, anchors, chapterUid } = chapter;
        res += `${'#'.repeat(level + 1)} ${title}\n\n`;
        if (anchors && anchors[0]?.title !== title) {
            for (const anchor of anchors) {
                res += `${'#'.repeat(anchor.level + 1)} ${anchor.title}\n\n`;
            }
        }
        res += traverseMarks(groupedMarks[chapterUid] || [], imgData);
    }
    return res.replace(/●|•|\d+\. /g, '\n\n- ');
}

const escapeRegExp = require('lodash.escaperegexp');

function traverseMarks(marks: any[], chapterImgData: { [key: string]: string }) {
    let prevMarkText = ""; // 保存上一条标注文本
    let tempRes = ""; // 保存上一条处理后追加到 res 的标注文本
    let res = "";
    marks.sort((a, b) => parseInt(a.range.substr(0, a.range.indexOf('-'))) > parseInt(b.range.substr(0, b.range.indexOf('-'))) ? 1 : -1)
    for (const mark of marks) { // 遍历章内标注
        if (mark.abstract && mark.content) { // 如果为想法
            let thouAbstract = `${mark.abstract}\n\n`; // 想法所标注的内容
            const thouContent = `> ${mark.content}\n\n`; // 想法

            if (mark.abstract === prevMarkText) { // 想法所对应文本与上一条标注相同时
                res = res.replace(new RegExp(escapeRegExp(tempRes) + `$`), ""); 
            }
            // 将想法添加到对应标注之后
            prevMarkText = mark.abstract;
            res += thouAbstract + thouContent;
        } else if (mark.markText.includes("[插图]") && chapterImgData) { // 插图
            let imgData = findImagesInRange(chapterImgData, mark.range);
            let index = 0;
            res += mark.markText.replace(/\[插图\]/g, (match: string) => {
                return `![插图](${imgData[index++]})` || match;
            }) + "\n\n";
        } else { // 标注
            if(prevMarkText === mark.markText) continue;
            prevMarkText = mark.markText;
            tempRes = regexpReplace(prevMarkText);
            tempRes = `${addMarkPreAndSuf(tempRes, mark.style)}\n\n`;
            res += tempRes;
        }
    }

    return res;
}

// 根据 range 查找图片
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

async function addMeta(bookId: string) {
    const bookInfo = await fetchBookInfo(bookId);
    const readInfo = await fetchReadInfo(bookInfo.bookId);
    let markedStatus = '', readingTime = '', finishedDate = '';
    if (readInfo) {
        const hour = Math.floor(readInfo.readingTime / 3600);
        if (hour > 0) {
            readingTime += `${hour}时`;
        }
        const minutes = Math.floor((readInfo.readingTime % 3600) / 60);
        if (minutes > 0) {
            readingTime += `${minutes}分`;
        }
        markedStatus = readInfo.markedStatus === 4 ? '读完' : '在读',
            finishedDate = readInfo.finishedDate ? formatTimestamp(readInfo.finishedDate * 1000) : ''; // 将秒转换为毫秒
    }
    const url = `https://weread.qq.com/web/reader/${calculateBookStrId(bookId)}`
    const meta = `---\n\n封面: <img src="${bookInfo.cover}" alt="封面" width="60">\n\n分类: ${bookInfo.category ?? ''}\n\n推荐值: ${bookInfo.newRating / 10}%\n\n作者: "${bookInfo.author}"\n\n状态: ${markedStatus} \n\n阅读时长: ${readingTime} \n\n读完日期: ${finishedDate} \n\n原书链接: "[${bookInfo.title}](${url})" \n\nISBN: ${bookInfo.isbn} \n\nbookId: ${bookInfo.bookId} \n\n---\n\n`
    return meta;
}

// 根据标注类型获取前后缀
function addMarkPreAndSuf(markText: string, style: number) {

    const pre = (style == 0) ? ""
        : (style == 1) ? "**"
            : (style == 2) ? "": ""

    const suf = (style == 0) ? ""
        : (style == 1) ? "**"
            : (style == 2) ? "" : ""

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

// ======== 以下为配置项 ========

const DefaultRegexPattern = { replacePattern: '', checked: false };

var Config = {
    codePre: "```",
    codeSuf: "```",
    //如果不设置默认值，则在设置页初始化时需要考虑到 
    re: { re1: DefaultRegexPattern, re2: DefaultRegexPattern, re3: DefaultRegexPattern, re4: DefaultRegexPattern, re5: DefaultRegexPattern },
}

