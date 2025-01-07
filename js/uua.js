//来着群友’夢‘
const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'

let appConfig = {
    ver: 1,
    title: '有爱爱',
    site: 'https://www.uaa.com',
    tabs: [
        {
            name: '国产视频',
            ui: 1,
            ext: {
                tip: 'chinese-av-porn',
                origin: 1,
            },
        },
        {
            name: '日本AV',
            ui: 1,
            ext: {
                tip: 'jav',
                origin: 1,
            },
        },
        {
            name: '无码流出',
            ui: 1,
            ext: {
                category: '无码流出',
                origin: 2,
            },
        },
        {
            name: 'H动漫',
            ui: 1,
            ext: {
                origin: 3,
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
    let { tip, category, origin, page = 1 } = ext
    
    let url = appConfig.site
    
    if (tip) {
        url += `/${tip}`
        if (page > 1) {
            url += `?origin=${origin}$sort=1&page=${page}`
        }
    } else {
        url += `/video/list?`
        if (category && origin) url += `category=${category}&origin=${origin}`
        if (origin  && !category) url += `origin=${origin}`
        if (page > 1) {
            url += `&$sort=1&page=${page}`
        }
    }
    
    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })

    const $ = cheerio.load(data)

    $('li.video_li').each((_, element) => {
        const href = $(element).find('.title a').attr('href')
        const title = $(element).find('.title a').text()
        const cover = $(element).find('.cover').attr('src') || $(element).find('.cover').attr('data-cfsrc')
        const pubdate = $(element).find('span').first().text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_pubdate: pubdate,
            ext: {
                url: `${appConfig.site}${href}`,
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
        const videourl = $('#mui-player').attr('src')
            tracks.push({
            name: '播放',
            ext: {
                url: videourl,
            },
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
    const playUrl = ext.url
    
    return jsonify({
        urls: [playUrl],
        headers: [{
            'User-Agent': UA,
            'Referer': 'https://www.uaa.com/',
            'Origin': 'https://www.uaa.com'
        }]
    })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/video/list?searchType=1&keyword=${text}`
    
    if(page >1){
        url = `https://www.uaa.com/video/list?keyword=${text}&category=&origin=&tag=&sort=0&page=${page}`
    }

    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })

    const $ = cheerio.load(data)

    $('li.video_li').each((_, element) => {
        const href = $(element).find('.title a').attr('href')
        const title = $(element).find('.title a').text()
        const cover = $(element).find('.cover').attr('src') || $(element).find('.cover').attr('data-cfsrc')
        const pubdate = $(element).find('span').first().text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_pubdate: pubdate,
            ext: {
                url: `${appConfig.site}${href}`,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
