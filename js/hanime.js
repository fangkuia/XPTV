//来自‘Y’
const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

let appConfig = {
    ver: 1,
    title: 'hanime',
    site: 'https://hanime1.me',
}

async function getConfig() {
    let config = appConfig
    config.tabs = await getTabs()
    return jsonify(config)
}

async function getTabs() {
    let list = []
    let ignore = ['新番預告', 'H漫畫', '無碼黃油'] 
    function isIgnoreClassName(className) {
        return ignore.some((element) => className.includes(element))
    }

    const { data } = await $fetch.get(appConfig.site, {
        headers: {
            'User-Agent': UA,
        },
    })
    const $ = cheerio.load(data)

    let allClass = $('#main-nav-home > a.nav-item')

    allClass.each((i, e) => {
        const name = $(e).text()
        const href = $(e).attr('href')
        const isIgnore = isIgnoreClassName(name)
        if (isIgnore) return

        let ui = 1
        if (name.includes('裏番') || name.includes('泡麵番')) {
            ui = 0 
        }

        list.push({
            name,
            ui: ui,
            ext: {
                url: encodeURI(href),
            },
        })
    })

    return list
}
async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { page = 1, url } = ext

    if (page > 1) {
        url += `&page=${page}`
    }

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)
    let videolist = $('.home-rows-videos-wrapper > a')
    if (videolist.length === 0) videolist = $('.content-padding-new > .row > .search-doujin-videos.col-xs-6')

    videolist.each((_, element) => {
    const href = $(element).attr('href') || $(element).find('.overlay').attr('href')
    
    // 添加域名过滤 - 只保留 hanime1.me 的链接
    if (href && href.includes('://')) {
        const domainMatch = href.match(/https?:\/\/([^\/]+)/)
        if (domainMatch) {
            const domain = domainMatch[1]
            // 只允许 hanime1.me 域名
            if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                return // 跳过当前迭代
            }
        }
    }
    
    const title = $(element).find('.home-rows-videos-title').text() || $(element).find('.card-mobile-title').text()
    let cover = $(element).find('img').attr('src')
    if (cover && cover.includes('background')) cover = $(element).find('img').eq(1).attr('src')
    
    // 处理相对路径
    let finalHref = href
    if (href && href.startsWith('/')) {
        finalHref = `https://hanime1.me${href}`
    }
    
    cards.push({
        vod_id: finalHref,
        vod_name: title,
        vod_pic: cover,
        vod_remarks: '',
        ext: {
            url: finalHref,
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
    
    const videoElement = $('video#player')
    const mainSrc = videoElement.attr('src') 
    const sourceTags = videoElement.find('source')
    
    if (mainSrc) {
        tracks.push({
            name: '默认播放',
            pan: '',
            ext: {
                url: url,
                quality: 'default'
            },
        })
    }
    
    // 添加不同清晰度的选项
    sourceTags.each((index, element) => {
        const src = $(element).attr('src')
        const size = $(element).attr('size') || 'unknown'
        const type = $(element).attr('type') || 'video/mp4'
        
        if (src) {
            tracks.push({
                name: `${size}p`,
                pan: '',
                ext: {
                    url: url,
                    quality: size,
                    sourceIndex: index
                },
            })
        }
    })

    return jsonify({
        list: [
            {
                title: '清晰度选择',
                tracks,
            },
        ],
    })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    const url = ext.url
    const quality = ext.quality || 'default' 

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)
    const videoElement = $('video#player')
    
    let playUrl = ''
    
    if (quality === 'default') {
        
        playUrl = videoElement.attr('src')
    } else {
        // 根据清晰度选择对应的source标签
        const sourceElement = videoElement.find(`source[size="${quality}"]`)
        if (sourceElement.length > 0) {
            playUrl = sourceElement.attr('src')
        } else {
           
            playUrl = videoElement.attr('src')
        }
    }

    if (!playUrl) {
        const firstSource = videoElement.find('source').first()
        playUrl = firstSource.attr('src') || videoElement.attr('src')
    }

    return jsonify({ 
        urls: [playUrl],
        quality: quality
    })
}
async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/search?query=${text}&page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    const $ = cheerio.load(data)

    $('.col-xs-6').each((_, element) => {
        const href = $(element).find('.overlay').attr('href')
        if (href && href.includes('://')) {
        const domainMatch = href.match(/https?:\/\/([^\/]+)/)
        if (domainMatch) {
            const domain = domainMatch[1]
            // 只允许 hanime1.me 域名
            if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                return // 跳过当前迭代
            }
        }
    }
        const title = $(element).find('.card-mobile-title').text()
        const cover = $(element).find('img').eq(1).attr('src')
        let finalHref = href
    if (href && href.startsWith('/')) {
        finalHref = `https://hanime1.me${href}`
    }
    
        cards.push({
            ui: 1,
            vod_id: finalHref,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',
            ext: {
                url: finalHref,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
