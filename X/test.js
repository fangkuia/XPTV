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
    return jsonify({
        ver: 1,
        title: '哔哩哔哩',
        site: 'https://www.bilibili.com',
        tabs,
    })
}

async function getCards(ext) {
    ext = argsify(ext)
    let uid = ext.uid
    let page = ext.page
    let cards = []

    const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&pn=${page}&ps=30`
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }

    try {
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
    } catch (error) {
        console.error('获取视频列表失败:', error)
    }

    return jsonify({
        list: cards,
    })
}

// 其他函数...
