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
                uid: each.uid, // 使用 uid 替代 code
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
    // 这里可以解析 Bilibili 的相关配置
}

async function getCards(ext) {
    ext = argsify(ext)
    let uid = ext.uid // 使用 uid
    let page = ext.page
    let cards = []

    const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&pn=${page}&ps=20`
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
            vod_remarks: item.pubdate,
            ext: {
                id: item.bvid,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function getChannelId(uid) {
    const url = `https://space.bilibili.com/${uid}`
    const headers = {
        Origin: 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }
    const response = await $fetch.get(url, { headers })
    const $ = cheerio.load(response.data)
    const link = $('link[rel="canonical"]').attr('href')
    const channelId = link.split('/space/')[1]
    return channelId
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
    let videoId = ext.id
    const url = `https://api.bilibili.com/x/player/playurl?bvid=${videoId}`
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }

    const { data } = await $fetch.get(url, { headers })
    let playurl = argsify(data).data.durl[0].url
    return jsonify({ urls: [playurl] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    const text = ext.text
    const url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${text}&search_type=video`
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
            vod_remarks: item.pubdate,
            ext: {
                id: item.bvid,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
