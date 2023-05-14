

async function featchBookmarks(bookId: string) {
    const url = `https://weread.qq.com/web/book/bookmarklist?bookId=${bookId}`;
    const data = await getJson(url);
    console.log(data);
    return data;
}

async function featchChapInfos(bookId: string){
    const data = await getJson(`https://i.weread.qq.com/book/chapterInfos?bookIds=${bookId}&synckeys=0`);
    console.log(data);
    return data;
}

async function getJson(url: string) {
    try {
        let resp = await fetch(url, {
            credentials: "include",
            cache: 'no-cache'
        });
        console.log('resp', resp);
        let json = await resp.json();
        return json;
    } catch (error) {

    }
}

export { featchBookmarks, featchChapInfos };