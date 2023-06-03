

async function fetchBookmarks(bookId: string) {
    const url = `https://weread.qq.com/web/book/bookmarklist?bookId=${bookId}`;
    const data = await getJson(url);
    console.log(data);
    return data;
}

async function fetchChapInfos(bookId: string) {
    const data = await getJson(`https://i.weread.qq.com/book/chapterInfos?bookIds=${bookId}&synckeys=0`);
    console.log(data);
    return data;
}

async function fetchBestBookmarks(bookId: string) {
    const url = `https://i.weread.qq.com/book/bestbookmarks?bookId=${bookId}`;
    const data = await getJson(url);
    console.log(data);
    return data;
}

async function fetchBookInfo(bookId: string) {
    const url = `https://i.weread.qq.com/book/info?bookId=${bookId}`
    const data = await getJson(url);
    return data;
}

async function fetchReadInfo(bookId: string) {
    const url = `https://i.weread.qq.com/book/readinfo?bookId=${bookId}&readingDetail=1&readingBookIndex=1&finishedDate=1`;
    const data = await getJson(url);
    return data;
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
        console.log('resp', resp);
        let json = await resp.json();
        return json;
    } catch (error) {

    }
}

export { fetchBookmarks, fetchChapInfos, fetchBestBookmarks, fetchBookInfo, fetchReadInfo };