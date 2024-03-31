

async function fetchBookmarks(bookId: string) {
    const url = `https://i.weread.qq.com/book/bookmarklist?bookId=${bookId}`;
    return await getJson(url);
}

async function fetchChapInfos(bookId: string) {
    return await getJson(`https://i.weread.qq.com/book/chapterInfos?bookIds=${bookId}&synckeys=0`);
}

async function fetchBestBookmarks(bookId: string) {
    const url = `https://i.weread.qq.com/book/bestbookmarks?bookId=${bookId}`;
    return await getJson(url);
}

async function fetchBookInfo(bookId: string) {
    const url = `https://i.weread.qq.com/book/info?bookId=${bookId}`
    return await getJson(url);
}

async function fetchReadInfo(bookId: string) {
    const url = `https://i.weread.qq.com/book/readinfo?bookId=${bookId}&readingDetail=1&readingBookIndex=1&finishedDate=1`;
    return await getJson(url);
}

async function fetchReviews(bookId: string) {
    const url = `https://i.weread.qq.com/review/list?bookId=${bookId}&listType=11&mine=1&synckey=0&listMode=0`;
    return await getJson(url)
}

async function fetchShelfData(){
    const data = await getJson('https://weread.qq.com/web/shelf/sync');
    console.log(data);
    return data;
}

async function getJson(url: string) {
    try {
        let resp = await fetch(url, {
            credentials: "include",
            cache: 'no-cache'
        });
        let json = await resp.json();
        console.log('url', url, 'resp', json);
        return json;
    } catch (error) {
        console.log('error', error, 'url', url);
        return null;
    }
}

export { fetchBookmarks, fetchChapInfos, fetchBestBookmarks, fetchBookInfo, fetchReadInfo, fetchReviews, fetchShelfData };