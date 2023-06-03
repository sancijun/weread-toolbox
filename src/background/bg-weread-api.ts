

async function fetchBookmarks(bookId: string) {
    const url = `https://weread.qq.com/web/book/bookmarklist?bookId=${bookId}`;
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

async function getReviewList(bookId: string) {
    const url = `https://weread.qq.com/wrpage/review/list?bookId=${bookId}&_=${Date.now()}`;
    const response = await getJson(url)
    if (response.ok && 'data' in response.json()) {
        const data = response.json().data;
        const summary = data.summary || [];
        const reviews = data.review || [];
        return [summary, reviews];
    }
    return [[], []];
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

export { fetchBookmarks, fetchChapInfos, fetchBestBookmarks, fetchBookInfo, fetchReadInfo };