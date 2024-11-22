//来自群友“夢”
const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'

let appConfig = {
    ver: 1,
    title: 'KoreaPornMovie',
    site: 'https://koreanpornmovie.com',
    tabs: [
        {
            name: '首页',
            ext: {
                tip: '',
            },
        },
        {
            name: '三级',
            ext: {
                tip: '18-movies',
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
    let { tip, page = 1 } = ext
    let url = `${appConfig.site}/page/${page}/`
    if (tip) {
        url = `${appConfig.site}/tag/${tip}/page/${page}/`
    }
    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })

    const $ = cheerio.load(data)

    $('#main .videos-list article').each((_, element) => {
        const href = $(element).find('a').attr('href')
        const title = $(element).find('a').attr('title')
        const cover = $(element).find('img').attr('data-src') || $(element).find('img').attr('src')
        const duration = $(element).find('.duration').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_duration: duration,
            ext: {
                url: href,
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
    let url = ext.url
    
    const { data } = await $fetch.get(url, {
        headers: {
             'User-Agent': UA,
            },
    })
    
    const $ = cheerio.load(data)
    const videourl = $('.video-player').find('meta[itemprop="contentURL"]').attr('content') || $(element).find('video source[type="video/mp4"]').attr('src')
    if (videourl) {
        tracks.push({
            name: '播放',
            ext: {
                url: videourl,
            },
        })
    }
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
    const playUrl = ext.url
    
    return jsonify({
        urls: [playUrl],
        headers: [{
            'User-Agent': UA,
            'Referer': 'https://koreanpornmovie.com/'
        }]
    })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/page/${page}/?s=${text}`

    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })

    const $ = cheerio.load(data)

    $('section #main article').each((_, element) => {
        const href = $(element).find('a').attr('href')
        const title = $(element).find('a').attr('title')
        const cover = $(element).find('img').attr('data-src') || $(element).find('img').attr('src')
        const duration = $(element).find('.duration').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_duration: duration,
            ext: {
                url: href,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
