const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

let $config = argsify($config_str)

let appConfig = {
    ver: 1,
    title: '哔哩哔哩',
    site: 'https://www.bilibili.com',
}

async function getConfig() {
    let tabs = []
    $config.follows.forEach((each) => {
        tabs.push({
            name: each.name,
            ext: {
                uid: each.uid,
            },
        })
    })
    await initSession()
    return jsonify({
        ver: 1,
        title: '哔哩哔哩',
        site: 'https://www.bilibili.com',
        tabs,
    })
}

async function initSession() {
    const url = appConfig.site
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }
    const { data } = await $fetch.get(url, {
        headers,
    })
    // 哔哩哔哩的 API 可能不需要像 YouTube 那样的初始化
}

async function getCards(ext) {
    ext = argsify(ext)
    let uid = ext.uid
    let page = ext.page
    let cards = []

    const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&pn=${page}&ps=30`
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
    }

    const { data } = await $fetch.get(url, { headers })
    const videos = argsify(data).data.list.vlist

    videos.forEach((item) => {
        cards.push({
            vod_id: item.bvid,
            vod_name: item.title,
            vod_pic: item.pic,
            vod_remarks: item.pubdate ? new Date(item.pubdate * 1000).toLocaleString() : '',
            ext: {
                id: item.bvid,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    tracks.push({
        name: '播放',
        pan: '',
        ext,
    })

    return jsonify({
        list: [
            {
                title: '默认分组',
                tracks,
            },
        ],
    })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let bvid = ext.id
    const apiKey = 'YOUR_API_KEY' // 如果需要 API 密钥
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
    }

    const { data } = await $fetch.get(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=YOUR_CID&qn=80`, {
        headers,
    })

    let playurl = argsify(data).data.durl[0].url
    return jsonify({ urls: [playurl] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    const text = ext.text
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(text)}`
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
    }

    const { data } = await $fetch.get(url, { headers })
    const videos = argsify(data).data.result

    videos.forEach((item) => {
        cards.push({
            vod_id: item.bvid,
            vod_name: item.title,
            vod_pic: item.pic,
            vod_remarks: item.pubdate ? new Date(item.pubdate * 1000).toLocaleString() : '',
            ext: {
                id: item.bvid,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
