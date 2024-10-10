const cheerio = createCheerio()
const CryptoJS = createCryptoJS()
/*
{
  "follows": [
    {"name": "徐雅","code": "@e_seoa"}, 
    {"name": "陈一发儿", "code": "@chenyifaer"}
  ]
}
*/
let $config = argsify($config_str)

let appConfig = {
    ver: 1,
    title: '油管',
    site: 'https://www.youtube.com',
}

async function getConfig() {
    let tabs = []
    $config.follows.forEach((each) => {
        tabs.push({
            name: each.name,
            ext: {
                code: each.code,
            },
        })
    })
    await initSession()
    return jsonify({
        ver: 1,
        title: '油管',
        site: 'https://www.youtube.com',
        tabs,
    })
}

async function initSession() {
    const url = appConfig.site
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }
    const { data } = await $fetch.get(url, {
        headers,
    })
    const regex = /window.*?ytplayer=\{\};ytcfg\.set\((.*?)\);/
    const match = data.replace(/\n/g, '').match(regex)
    const ytcfg = JSON.parse(match[1])
    const apikey = ytcfg.INNERTUBE_API_KEY
    const context = ytcfg.INNERTUBE_CONTEXT
    $cache.set('youtube_api_key', apikey)
    $cache.set('youtube_context', jsonify(context))
}

async function getCards(ext) {
    ext = argsify(ext)
    let code = ext.code
    let page = ext.page
    let cards = []

    const apiKey = $cache.get('youtube_api_key')
    const context = argsify($cache.get('youtube_context'))

    const url = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
    }
    let postData = undefined
    if (page === 1) {
        const channelId = await getChannelId(code)
        postData = {
            context: context,
            browseId: channelId,
            // videos,new
            params: 'EgZ2aWRlb3MYAyAAMAE%3D',
        }
    } else {
        const continuationToken = $cache.get('youtube_continuation_token')
        postData = {
            context: context,
            continuation: continuationToken,
        }
    }

    const { data } = await $fetch.post(url, jsonify(postData), {
        headers,
    })

    let videos = argsify(data).contents?.twoColumnBrowseResultsRenderer?.tabs[1]?.tabRenderer?.content?.richGridRenderer?.contents
    if (page > 1) {
        videos = argsify(data).onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems
    }
    videos.forEach((e) => {
        if (e.richItemRenderer != undefined) {
            const item = e.richItemRenderer.content.videoRenderer
            cards.push({
                vod_id: item.videoId,
                vod_name: item.title.runs[0].text,
                vod_pic: item.thumbnail.thumbnails.at(-1).url,
                vod_remarks: item?.publishedTimeText?.simpleText || '',
                ext: {
                    id: item.videoId,
                },
            })
        }
        if (e.continuationItemRenderer) {
            const token = e.continuationItemRenderer.continuationEndpoint.continuationCommand.token
            $cache.set('youtube_continuation_token', token)
        }
    })

    return jsonify({
        list: cards,
    })
}

async function getChannelId(code) {
    const url = `https://www.youtube.com/${code}`
    const headers = {
        Origin: 'https://www.youtube.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }
    const response = await $fetch.get(url, { headers })
    const $ = cheerio.load(response.data)
    const link = $('link[rel="canonical"]').attr('href')
    const channelId = link.split('/channel/')[1]
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
    $print(`***id: ${videoId}`)
    const apiKey = 'AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc'
    const headers = {
        'X-YouTube-Client-Name': '5',
        'X-YouTube-Client-Version': '19.09.3',
        Origin: 'https://www.youtube.com',
        'User-Agent': 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
        'content-type': 'application/json',
    }

    const b = {
        context: {
            client: {
                clientName: 'IOS',
                clientVersion: '19.09.3',
                deviceModel: 'iPhone14,3',
                userAgent: 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
                hl: 'en',
                timeZone: 'UTC',
                utcOffsetMinutes: 0,
            },
        },
        videoId,
        playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } },
        contentCheckOk: true,
        racyCheckOk: true,
    }

    const { data } = await $fetch.post(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`, JSON.stringify(b), {
        headers,
    })

    let playurl = argsify(data).streamingData.hlsManifestUrl
    $print(`***playurl: ${playurl}`)
    return jsonify({ urls: [playurl] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    function getSearchParam() {
        let d = new Uint8Array(50)
        let t = 0
        let c = 0
        d[t] = 0x12
        t++
        c = t
        t++
        d[t] = 0x10
        t++
        d[t] = ['any', 'videos', 'channels', 'playlists', 'movies'].indexOf('any')
        t++
        d[c] = t - c - 1
        // let n = Buffer.from(d.slice(0, t))
        // let s = n.toString('base64')
        let n = CryptoJS.lib.WordArray.create(d.slice(0, t))
        let s = CryptoJS.enc.Base64.stringify(n)
        return encodeURIComponent(s)
    }

    const text = ext.text
    const apiKey = $cache.get('youtube_api_key')
    const context = argsify($cache.get('youtube_context'))

    const url = `https://www.youtube.com/youtubei/v1/search?key=${apiKey}`
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
    }
    const postData = {
        context: context,
        params: getSearchParam(),
        query: text,
    }
    const { data } = await $fetch.post(url, jsonify(postData), {
        headers,
    })
    const videos = argsify(data).contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
    // $print(videos)
    videos.forEach((e) => {
        if (e.videoRenderer != undefined) {
            const item = e.videoRenderer
            cards.push({
                vod_id: item.videoId,
                vod_name: item.title.runs[0].text,
                vod_pic: item.thumbnail.thumbnails.at(-1).url,
                vod_remarks: item?.publishedTimeText?.simpleText || '',
                ext: {
                    id: item.videoId,
                },
            })
        }
    })
    return jsonify({
        list: cards,
    })
}
