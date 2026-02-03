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
    const t1 = $('title').text()
      if (t1 === 'Just a moment...') {
    $utils.openSafari(appConfig.site, UA)
      }
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
    const t1 = $('title').text()
    if (t1 === 'Just a moment...') {
        $utils.openSafari(appConfig.site, UA)
    }
    
    let videoContainers = $('.video-item-container')
    if (videoContainers.length === 0) {
        videoContainers = $('.home-rows-videos-wrapper > a, .content-padding-new > .row > .search-doujin-videos.col-xs-6')
    }

    videoContainers.each((_, element) => {
        let href, title, cover
        
        if ($(element).hasClass('video-item-container')) {
            const videoLink = $(element).find('.video-link')
            href = videoLink.attr('href')
            title = $(element).find('.title').text().trim()
            cover = $(element).find('.main-thumb').attr('src')
            
            const stats = {
                likes: '',
                views: '',
                subtitle: ''
            }
            
            $(element).find('.stat-item').each((i, statEl) => {
                const text = $(statEl).text().trim()
                if (i === 0) {
                    stats.likes = text.replace('thumb_up', '').trim()
                } else if (i === 1) {
                    stats.views = text
                }
            })
            
            stats.subtitle = $(element).find('.subtitle a').text().trim()
            
            const duration = $(element).find('.duration').text().trim()
            
            const remarks = []
            if (duration) remarks.push(duration)
            if (stats.subtitle) remarks.push(stats.subtitle)
            if (stats.likes) remarks.push(stats.likes)
            if (stats.views) remarks.push(stats.views)
            
            if (href && href.includes('://')) {
                const domainMatch = href.match(/https?:\/\/([^\/]+)/)
                if (domainMatch) {
                    const domain = domainMatch[1]
                    if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                        return 
                    }
                }
            }
            
            let finalHref = href
            if (href && href.startsWith('/')) {
                finalHref = `https://hanime1.me${href}`
            }
            
            cards.push({
                vod_id: finalHref,
                vod_name: title,
                vod_pic: cover,
                vod_remarks: remarks.join(' · '),
                ext: {
                    url: finalHref,
                    duration: duration,
                    subtitle: stats.subtitle,
                    stats: stats
                },
            })
        } else {
            href = $(element).attr('href') || $(element).find('.overlay').attr('href')
            
            if (href && href.includes('://')) {
                const domainMatch = href.match(/https?:\/\/([^\/]+)/)
                if (domainMatch) {
                    const domain = domainMatch[1]
                    if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                        return 
                    }
                }
            }
            
            title = $(element).find('.home-rows-videos-title').text() || $(element).find('.card-mobile-title').text()
            cover = $(element).find('img').attr('src')
            if (cover && cover.includes('background')) {
                cover = $(element).find('img').eq(1).attr('src')
            }
            
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
        }
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

    $('.video-item-container').each((_, element) => {
        const videoLink = $(element).find('.video-link')
        const href = videoLink.attr('href')
        
        if (href && href.includes('://')) {
            const domainMatch = href.match(/https?:\/\/([^\/]+)/)
            if (domainMatch) {
                const domain = domainMatch[1]
                if (domain !== 'hanime1.me' && !domain.endsWith('.hanime1.me')) {
                    return 
                }
            }
        }
        
        const title = $(element).find('.title').text().trim()
        const cover = $(element).find('.main-thumb').attr('src')
        
        const subtitle = $(element).find('.subtitle a').text().trim()

        const stats = {
            likes: '',
            views: ''
        }
        
        $(element).find('.stat-item').each((i, statEl) => {
            const text = $(statEl).text().trim()
            if (i === 0) {
                stats.likes = text.replace('thumb_up', '').trim()
            } else if (i === 1) {
                stats.views = text
            }
        })
        
        const duration = $(element).find('.duration').text().trim()
        
        let finalHref = href
        if (href && href.startsWith('/')) {
            finalHref = `https://hanime1.me${href}`
        }
        
        const remarks = []
        if (duration) remarks.push(duration)
        if (subtitle) remarks.push(subtitle)
        if (stats.likes) remarks.push(stats.likes)
        if (stats.views) remarks.push(stats.views)
        
        cards.push({
            ui: 1,
            vod_id: finalHref,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: remarks.join(' · '),
            ext: {
                url: finalHref,
                duration: duration,
                subtitle: subtitle,
                stats: stats
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
