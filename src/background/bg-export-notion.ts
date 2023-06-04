import { fetchBestBookmarks, fetchBookInfo, fetchBookmarks, fetchChapInfos, fetchReadInfo } from "~background/bg-weread-api";
import { Client } from '@notionhq/client';
import { getLocalStorageData, sendMessage, sleep } from "./bg-utils";
import { MD5 } from 'crypto-js';

/**
 * 导出笔记到 Notion
 * @param bookTitle 
 * @param isHot 
 * @param curChapterTitle 
 */
export async function exportToNotion(bookTitle: string, isHot: boolean, curChapterTitle?: string) {
    try {
        const databaseId = await getLocalStorageData('databaseId') as string;
        const notionToken = await getLocalStorageData('notionToken') as string;
        const bookId = await getLocalStorageData(`${bookTitle}-bookId`) as string;
        console.log('databaseId', databaseId, 'notionToken', notionToken, 'bookId', bookId);
        if (!bookId) {
            sendMessage({ message: { alert: '信息缺失，请点击上一页(或下一页)，加载更多信息后重试！' } });
            return false;
        }
        const client = new Client({ auth: notionToken, });
        await check(client, databaseId, bookId);
        const id = await insertToNotion(client, databaseId, bookId);
        console.log('insert to notion id=', id);
        const children = await getNotionChildrens(bookTitle, isHot, curChapterTitle);
        await addChildren(client, id, children);
        return true;
    } catch (error) {
        sendMessage({ message: { alert: '导出失败，请检查 Notion 设置是否正确。可联系三此君，反馈异常详情！' } });
        console.error("exportToNotion error:", error);
        return false;
    }
}

// 检查 Notion 中是否存在，如果存在则删除
async function check(client: Client, databaseId: string, bookId: string): Promise<void> {
    await sleep(300); // 0.3-second delay

    const filter = {
        property: "BookId",
        rich_text: {
            equals: bookId
        }
    };

    const response = await client.databases.query({
        database_id: databaseId,
        filter: filter
    });

    for (const result of response.results) {
        await sleep(300); // 0.3-second delay
        await client.blocks.delete({ block_id: result.id });
    }
}

// 插入书籍信息到 Notion
async function insertToNotion(client: Client, databaseId: string, bookId: string) {
    await sleep(300);
    // 获取书籍信息
    const bookInfo = await fetchBookInfo(bookId);
    const parent = {
        database_id: databaseId,
    };

    const properties: any = {
        标题: {
            title: [
                {
                    type: 'text',
                    text: {
                        content: bookInfo.title,
                    },
                },
            ],
        },
        封面: {
            files: [
                {
                    type: 'external',
                    name: 'Cover',
                    external: {
                        url: bookInfo.cover,
                    },
                },
            ],
        },
        分类: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: bookInfo.category,
                    },
                },
            ],
        },
        链接: {
            url: `https://weread.qq.com/web/reader/${calculateBookStrId(bookId)}`,
        },
        作者: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: bookInfo.author,
                    },
                },
            ],
        },
        推荐值: {
            number: bookInfo.newRating / 1000,
        },
        BookId: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: bookInfo.bookId,
                    },
                },
            ],
        },
        ISBN: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: bookInfo.isbn,
                    },
                },
            ],
        },
    };
    //获取阅读信息
    const readInfo = await fetchReadInfo(bookInfo.bookId);
    if (readInfo) {
        const markedStatus = readInfo.markedStatus || 0;
        const readingTime = readInfo.readingTime || 0;
        let formatTime = '';
        const hour = Math.floor(readingTime / 3600);
        if (hour > 0) {
            formatTime += `${hour}时`;
        }
        const minutes = Math.floor((readingTime % 3600) / 60);
        if (minutes > 0) {
            formatTime += `${minutes}分`;
        }
        properties['状态'] = {
            select: {
                name: markedStatus === 4 ? '读完' : '在读',
            },
        };
        properties['阅读时长'] = {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: formatTime,
                    },
                },
            ],
        };
        if ('finishedDate' in readInfo) {
            const finishedDate = new Date(readInfo.finishedDate * 1000); // 将秒转换为毫秒
            properties['读完日期'] = {
                date: {
                    start: finishedDate.toISOString(),
                    time_zone: 'Asia/Shanghai',
                },
            };
        }

    }

    const icon: any = {
        type: 'external',
        external: {
            url: bookInfo.cover,
        },
    };
    //创建 Notion 页面
    const response = await client.pages.create({
        parent,
        icon,
        properties,
    });

    return response.id;
}

// 添加 Block 到 Notion 页面
async function addChildren(client: Client, id: string, children: any[]) {
    for (let i = 0; i < children.length; i += 100) {
        await sleep(300);
        const response = await client.blocks.children.append({
            block_id: id,
            children: children.slice(i, i + 100),
        });
    }
}

/**
 * 生成 Notion 页面的 Blocks
 * @param bookTitle 
 * @param isHot 
 * @param curChapterTitle 
 */
async function getNotionChildrens(bookTitle: string, isHot: boolean, curChapterTitle?: string) {
    try {
        const childrens = [];
        // Get book ID and image data
        const bookId = await getLocalStorageData(`${bookTitle}-bookId`) as string;
        const imgData = await getLocalStorageData(`${bookTitle}-ImgData`) as {};
        console.log('bookId', bookId, 'imgData', imgData);

        // Get bookmarks and group them by chapterUid
        const marks = isHot
            ? (await fetchBestBookmarks(bookId))?.items || []
            : (await fetchBookmarks(bookId))?.updated || [];

        const groupedMarks = marks.reduce((groupedMarks: Record<number, any[]>, mark: any) => {
            const { chapterUid } = mark;
            groupedMarks[chapterUid] = groupedMarks[chapterUid] || [];
            groupedMarks[chapterUid].push(mark);
            return groupedMarks;
        }, {});

        // Get chapters
        const chapInfos = await fetchChapInfos(bookId);
        const chapters = chapInfos.data[0].updated;

        // Process bookmarks and chapters to generate markdown text
        for (const chapter of chapters) {
            const { title, level, anchors, chapterUid } = chapter;
            // If curChapterTitle is specified, process only that chapter
            if (curChapterTitle && title !== curChapterTitle) continue;
            childrens.push(getHeading(level, title));
            if (anchors && anchors[0]?.title !== title) {
                for (const anchor of anchors) {
                    childrens.push(getHeading(anchor.level, anchor.title));
                }
            }
            if (!groupedMarks[chapterUid]) continue; // If no marks in this chapter, skip
            for (const mark of groupedMarks[chapterUid]) { // Iterate over marks within a chapter
                if (mark.abstract && mark.content) { // If it's a thought
                    const thoughtContent = mark.content; // Thought content
                    let thoughtAbstract = mark.abstract; // Content marked by thought
                    childrens.push(getParagraph(thoughtAbstract + thoughtContent));
                } else if (mark.markText.includes("[插图]")) { // Image
                    let imgs = findImagesInRange(imgData, mark.range);
                    const parts = mark.markText.split("[插图]");
                    for (let i = 0; i < parts.length; i++) {
                        const content = parts[i];
                        childrens.push(getParagraph(content));
                        if (i < imgs.length) {
                            childrens.push(getImage(imgs[i]));
                        }
                    }

                } else { // Bookmark
                    childrens.push(getParagraph(mark.markText));
                }
            }
        }

        return childrens;
    } catch (error) {
        console.error("exportBookmarks error:", error);
    }
}

function transformId(bookId: string): [string, string[]] {
    const idLength = bookId.length;

    if (/^\d*$/.test(bookId)) {
        const ary: string[] = [];
        for (let i = 0; i < idLength; i += 9) {
            ary.push(parseInt(bookId.slice(i, i + 9)).toString(16));
        }
        return ['3', ary];
    }

    let result = '';
    for (let i = 0; i < idLength; i++) {
        result += bookId.charCodeAt(i).toString(16);
    }
    return ['4', [result]];
}

function calculateBookStrId(bookId: string): string {
    const md5Digest = MD5(bookId).toString();
    let result = md5Digest.slice(0, 3);

    const [code, transformedIds] = transformId(bookId);
    result += code + '2' + md5Digest.slice(-2);

    for (let i = 0; i < transformedIds.length; i++) {
        let hexLengthStr = transformedIds[i].length.toString(16);
        if (hexLengthStr.length === 1) {
            hexLengthStr = '0' + hexLengthStr;
        }

        result += hexLengthStr + transformedIds[i];

        if (i < transformedIds.length - 1) {
            result += 'g';
        }
    }

    if (result.length < 20) {
        result += md5Digest.slice(0, 20 - result.length);
    }

    const finalMd5Digest = MD5(result).toString();
    result += finalMd5Digest.slice(0, 3);

    return result;
}

function getHeading(level: number, content: string) {
    let headingType: 'heading_1' | 'heading_2' | 'heading_3' = 'heading_3';

    if (level === 1) {
        headingType = 'heading_1';
    } else if (level === 2) {
        headingType = 'heading_2';
    } else {
        headingType = 'heading_3';
    }

    return {
        type: headingType,
        [headingType]: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: content,
                    },
                },
            ],
            color: 'default',
            is_toggleable: false,
        },
    };
}

function getParagraph(content: string) {
    return {
        type: 'paragraph',
        paragraph: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: content,
                        link: null,
                    },
                },
            ],
            color: 'default',
        },
    };
}

function getImage(url: string) {
    if (!url) {
        return getParagraph('图片获取失败');
    }
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.tif', '.tiff', '.ico', '.webp', '.psd', '.ai', '.eps', '.raw', '.indd', '.pdf']; // 常见的图片扩展名列表
    const isImage = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    if (!isImage) {
         return getParagraph("图片链接格式错误，您可以访问该链接获取图片，并复制粘贴到此处：" + url);
    }

    return {
        type: "image",
        image: {
            type: "external",
            external: {
                url: url
            }
        }
    };
}

// 查找 range 内的图片
function findImagesInRange(imageDict: { [offset: string]: string }, range: string): string[] {
    if (imageDict === undefined) return [];
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
