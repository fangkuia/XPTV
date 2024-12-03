// 來自群友:夢
const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1'

let appConfig = {
    ver: 1,
    title: 'pppPorn',
    site: 'https://ppp.porn',
}
async function getConfig() {
    let config = appConfig
    config.tabs = await getTabs()
    return jsonify(config)
}

async function getTabs() {
    let list = []
    
    let classUrl = `${appConfig.site}/categories/`

    const { data } = await $fetch.get(classUrl, {
        headers: {
            'User-Agent': UA,
            'Referer': 'https://ppp.porn/pp1/',
        },
    })
    
    const $ = cheerio.load(data)

    $('section.padding-bottom-xl .card-cat-v2').each((_, e) => {
        const title = $(e).find('.card-cat-v2__title').text().trim()
        const count = $(e).find('.card-cat-v2__count').text().trim()
        const name = `${title}(${count})`
        const href = $(e).find('a').attr('href')
        list.push({
            name,
            ui: 1,
            ext: {
                href: href,
            },
        })
    })
    return list
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let {href, page = 1 } = ext
    
    let url = `${href}?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=post_date&from=${page}`
    
    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })
    
    const $ = cheerio.load(data)
    $('#list_videos_common_videos_list_items .item').each((_, element) => {
        const title = $(element).find('h4 a').text().trim()
        const cover = $(element).find('img').attr('data-src')
        const href = $(element).find('h4 a').attr('href')
        const duration = $(element).find('.card-video__duration').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_duration: duration,
            vod_remarks: '',
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
    let m3u8Url = null
    $('script').each((i, script) => {
        const content = $(script).html()
        if (content.includes('.m3u8')) {
            m3u8Url = content.match(/https?:\/\/[\w./-]+\.m3u8/)[0]
            if (m3u8Url) {
                tracks.push({
                    name: '播放',
                    ext: {
                        url: m3u8Url,
                    },
                })
            }
        }
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
    const url = ext.url
    return jsonify({ urls: [url] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    const text = encodeURIComponent(ext.text)
     let page = ext.page || 1
    
     let url = `${appConfig.site}/search/${text}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${text}&category_ids=&sort_by=&from_videos=${page}&from_albums=${page}`
    
    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })
    
    const $ = cheerio.load(data)
    $('#list_videos_videos_list_search_result_items .item').each((_, element) => {
        const title = $(element).find('h4 a').text().trim()
        const cover = $(element).find('img').attr('data-src')
        const href = $(element).find('h4 a').attr('href')
        const duration = $(element).find('.card-video__duration').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_duration: duration,
            vod_remarks: '',
            ext: {
                url: href,
            },
        })
    })
    return jsonify({
        list: cards,
    })
}
