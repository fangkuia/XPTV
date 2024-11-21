const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const appConfig = {
    ver: 1,
    title: '校长影视',
    site: 'https://xzys.fun',

    tabs: [
        {
            name: '电视剧',
            ext: {
                id: 'dsj',
            },
        },
        {
            name: '电影',
            ext: {
                id: 'dy',
            },
        },
        {
            name: '动漫',
            ext: {
                id: 'dm',
            },
        },
        {
            name: '纪录片',
            ext: {
                id: 'jlp',
            },
        },
        {
            name: '综艺',
            ext: {
                id: 'zy',
            },
        },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { page = 1, id } = ext

    const url = appConfig.site + `/${id}.html?page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const videos = $('.container .list-boxes .left_ly a')
    videos.each((_, e) => {
        const href = $(e).attr('href')
        const title = $(e).find('img').attr('alt')
        const cover = $(e).find('img').attr('src')
        if (title === '网盘选择问题') return
        let obj = {
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',

            ext: {
                url: `${appConfig.site}${href}`,
            },
        }

        cards.push(obj)
    })

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let url = ext.url

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const playlist = $('.col-md-9 .article-box p')
    playlist.each((_, e) => {
        const name = $(e).find('.btn-info').text()
        const panShareUrl = $(e).find('a').attr('href')
        if (!/夸克|阿里|UC|115|天翼/.test(name)) return
        tracks.push({
            name: name.trim(),
            pan: panShareUrl,
        })
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
    return jsonify({ urls: [] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/search.html?keyword=${text}&page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const videos = $('#container .list-boxes .left_ly a')
    videos.each((_, e) => {
        const href = $(e).attr('href')
        const title = $(e).find('img').attr('alt')
        const cover = $(e).find('img').attr('src')

        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',

            ext: {
                url: `${appConfig.site}${href}`,
            },
        })
    })
    return jsonify({
        list: cards,
    })
}
