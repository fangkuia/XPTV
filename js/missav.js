const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const cheerio = createCheerio()

const appConfig = {
    ver: 1,
    title: 'missav',
    site: 'https://missav.com',
    tabs: [
        {
            name: '中文字幕',
            ui: 1,
            ext: {
                id: 'dm265/cn/chinese-subtitle',
            },
        },
        {
            name: '最近更新',
            ui: 1,
            ext: {
                id: 'dm513/cn/new',
            },
        },
        {
            name: '新作上市',
            ui: 1,
            ext: {
                id: 'dm509/cn/release',
            },
        },
        {
            name: '无码流出',
            ui: 1,
            ext: {
                id: 'dm561/cn/uncensored-leak',
            },
        },
        {
            name: 'VR',
            ui: 1,
            ext: {
                id: 'dm2091/cn/genres/VR',
            },
        },
        {
            name: '今日热门',
            ui: 1,
            ext: {
                id: 'dm242/cn/today-hot',
            },
        },
        {
            name: '本週热门',
            ui: 1,
            ext: {
                id: 'dm168/cn/weekly-hot',
            },
        },
        {
            name: '本月热门',
            ui: 1,
            ext: {
                id: 'dm207/cn/monthly-hot',
            },
        },
        {
            name: 'SIRO',
            ui: 1,
            ext: {
                id: 'dm23/cn/siro',
            },
        },
        {
            name: 'LUXU',
            ui: 1,
            ext: {
                id: 'dm20/cn/luxu',
            },
        },
        {
            name: 'GANA',
            ui: 1,
            ext: {
                id: 'dm17/cn/gana',
            },
        },
        {
            name: 'PRESTIGE PREMIUM',
            ui: 1,
            ext: {
                id: 'dm14/cn/maan',
            },
        },
        {
            name: 'S-CUTE',
            ui: 1,
            ext: {
                id: 'dm23/cn/scute',
            },
        },
        {
            name: 'ARA',
            ui: 1,
            ext: {
                id: 'dm19/cn/ara',
            },
        },
        {
            name: 'FC2',
            ui: 1,
            ext: {
                id: 'dm95/cn/fc2',
            },
        },
        {
            name: 'HEYZO',
            ui: 1,
            ext: {
                id: 'dm628/cn/heyzo',
            },
        },
        {
            name: '东京热',
            ui: 1,
            ext: {
                id: 'dm29/cn/tokyohot',
            },
        },
        {
            name: '一本道',
            ui: 1,
            ext: {
                id: 'dm58345/cn/1pondo',
            },
        },
        {
            name: 'Caribbeancom',
            ui: 1,
            ext: {
                id: 'dm124158/cn/caribbeancom',
            },
        },
        {
            name: 'Caribbeancompr',
            ui: 1,
            ext: {
                id: 'dm1442/cn/caribbeancompr',
            },
        },
        {
            name: '10musume',
            ui: 1,
            ext: {
                id: 'dm58632/cn/10musume',
            },
        },
        {
            name: 'pacopacomama',
            ui: 1,
            ext: {
                id: 'dm668/cn/pacopacomama',
            },
        },
        {
            name: 'Gachinco',
            ui: 1,
            ext: {
                id: 'dm135/cn/gachinco',
            },
        },
        {
            name: 'XXX-AV',
            ui: 1,
            ext: {
                id: 'dm26/cn/xxxav',
            },
        },
        {
            name: '人妻斩',
            ui: 1,
            ext: {
                id: 'dm24/cn/marriedslash',
            },
        },
        {
            name: '顽皮 4610',
            ui: 1,
            ext: {
                id: 'dm19/cn/naughty4610',
            },
        },
        {
            name: '顽皮 0930',
            ui: 1,
            ext: {
                id: 'dm22/cn/naughty0930',
            },
        },
        {
            name: '麻豆传媒',
            ui: 1,
            ext: {
                id: 'dm34/cn/madou',
            },
        },
        {
            name: 'TWAV AV',
            ui: 1,
            ext: {
                id: 'dm17/cn/twav',
            },
        },
        {
            name: 'Furuke AV',
            ui: 1,
            ext: {
                id: 'dm15/cn/furuke',
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

    const url = appConfig.site + `/${id}?page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const videos = $('.thumbnail')
    videos.each((_, e) => {
        const href = $(e).find('.text-secondary').attr('href')
        const title = $(e).find('.text-secondary').text().trim().replace(/\s+/g, ' ')
        const cover = $(e).find('.w-full').attr('data-src')
        const duration = $(e).find('.right-1').text().trim()
        let obj = {
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',
            vod_duration: duration,

            ext: {
                url: href,
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
    let url = ext.url
    let m3u8Prefix = 'https://surrit.com/'
    let m3u8Suffix = '/playlist.m3u8'
    let tracks = []

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const match = data.match(/sixyik\.com\\\/(.+)\\\/seek\\\/_0\.jpg/)
    if (match && match[1]) {
        let uuid = match[1]
        let m3u8 = m3u8Prefix + uuid + m3u8Suffix

        tracks.push({
            name: '播放',
            pan: '',
            ext: {
                url: m3u8,
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
    const url = ext.url

    return jsonify({ urls: [url] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/cn/search/${text}?page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const videos = $('.thumbnail')
    videos.each((_, e) => {
        const href = $(e).find('.text-secondary').attr('href')
        const title = $(e).find('.text-secondary').text().trim().replace(/\s+/g, ' ')
        const cover = $(e).find('.w-full').attr('data-src')
        const duration = $(e).find('.right-1').text().trim()
        
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',
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
