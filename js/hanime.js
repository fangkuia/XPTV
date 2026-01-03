//来自‘Y哥’
const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1'

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
    const { data } = await $fetch.get(appConfig.site, { headers: { 'User-Agent': UA } })
    const $ = cheerio.load(data)
    
    if ($('title').text().includes('Just a moment')) {
        $utils.openSafari(appConfig.site, UA)
        return []
    }
    
    const list = []
    $('#main-nav-home > a.nav-item').each((i, e) => {
        const name = $(e).text().trim()
        let href = $(e).attr('href')
        
        if (name.includes('新番預告') || name.includes('H漫畫') || name.includes('無碼黃油')) return
        
        if (href && href.startsWith('/')) {
            href = 'https://hanime1.me' + href
        }
        
        list.push({
            name,
            ui: name.includes('裏番') || name.includes('泡麵番') ? 0 : 1,
            ext: { url: href }
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
    const t1 = $('title').text()
      if (t1 === 'Just a moment...') {
    $utils.openSafari(appConfig.site, UA)
           return []
      }
    let videolist = $('.home-rows-videos-wrapper > a')
    if (videolist.length === 0) videolist = $('.content-padding-new > .row > .search-doujin-videos.col-xs-6')

    videolist.each((_, element) => {
    const href = $(element).attr('href') || $(element).find('.overlay').attr('href')
    
    if (href && href.includes('://')) {
        const domainMatch = href.match(/https?:\/\/([^\/]+)/)
        if (domainMatch) {
            const domain = domainMatch[1]
            if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                return 
            }
        }
    }
    
    const title = $(element).find('.home-rows-videos-title').text() || $(element).find('.card-mobile-title').text()
    let cover = $(element).find('img').attr('src')
    if (cover && cover.includes('background')) cover = $(element).find('img').eq(1).attr('src')
    
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
    let url = `${appConfig.site}/search?query=${text}&broad=on&page=${page}`

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

            if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                return 
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
            vod_id: finalHref,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',
            ui: 1,
            ext: {
                url: finalHref,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
