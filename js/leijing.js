const CryptoJS = createCryptoJS()
const cheerio = createCheerio()

/*
搜尋需要登入
自定義配置按照以下填入
{"usr":"你的帳號","pwd":"你的密碼"}
*/

const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const appConfig = {
    ver: 20260417,
    title: '雷鲸',
    site: 'https://www.leijing1.com',
    tabs: [
        {
            name: '剧集',
            ext: {
                id: '?tagId=42204684250355',
            },
        },
        {
            name: '电影',
            ext: {
                id: '?tagId=42204681950354',
            },
        },
        {
            name: '动漫',
            ext: {
                id: '?tagId=42204792950357',
            },
        },
        {
            name: '纪录片',
            ext: {
                id: '?tagId=42204697150356',
            },
        },
        {
            name: '综艺',
            ext: {
                id: '?tagId=42210356650363',
            },
        },
        {
            name: '影视原盘',
            ext: {
                id: '?tagId=42212287587456',
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

    const url = appConfig.site + `/${id}&page=${page}`

    const { data, respHeaders } = await $fetch.get(url, {
        headers: {
            Referer: `${appConfig.site}/`,
            'User-Agent': UA,
        },
    })
    if (respHeaders['Set-Cookie']) {
        $cache.set('leijing_firstVisit', respHeaders['Set-Cookie'])
    }

    const $ = cheerio.load(data)

    $('.topicItem').each((index, each) => {
        if ($(each).find('.cms-lock-solid').length > 0) return

        const href = $(each).find('h2 a').attr('href')
        const title = $(each).find('h2 a').text()
        const regex = /(?:【.*?】)?(?:（.*?）)?([^\s.（]+(?:\s+[^\s.（]+)*)/
        const match = title.match(regex)
        const dramaName = match ? match[1] : title
        const r = $(each).find('.summary').text()
        const tag = $(each).find('.tag').text()
        const pic = $(each).find('ul.tm-m-photos-thumb li').first().attr('data-src') || ''

        if (/content/.test(r) && !/cloud/.test(r)) return
        if (/软件|游戏|书籍|图片|公告|音乐|课程/.test(tag)) return

        cards.push({
            vod_id: href,
            vod_name: dramaName,
            vod_pic: pic,
            vod_remarks: '',
            ext: {
                url: `${appConfig.site}/${href}`,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    var tracks = []
    let url = ext.url

    const { data } = await $fetch.get(url, {
        headers: {
            Referer: `${appConfig.site}/`,
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)
    const pans = new Set()

    const urlRegex = /(https?:\/\/[^\s（]+)/g

    const processUrl = (url) => {
        if (url.startsWith('https://cloud.189.cn/') && !pans.has(url)) {
            pans.add(url)
            tracks.push({
                name: '网盘',
                pan: url,
                ext: {},
            })
        }
    }

    $('div,p,a').each((index, each) => {
        const href = ($(each).attr('href') ?? '').replace('http://', 'https://')
        processUrl(href)

        const text = $(each).text().trim()
        const urls = text.match(urlRegex)
        if (urls) {
            urls.forEach(processUrl)
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
    return jsonify({ urls: [] })
}

async function search(ext) {
    await checkLoginState()
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/search?keyword=${text}&page=${page}`
    const token = argsify($cache.get('leijing_token')) || {}

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            Cookie: `cms_accessToken=${token?.cmsAccessToken || ''}; cms_refreshToken=${token?.cmsRefreshToken || ''}`,
        },
    })

    const $ = cheerio.load(data)

    $('.topicItem').each((index, each) => {
        if ($(each).find('.cms-lock-solid').length > 0) return

        const href = $(each).find('h2 a').attr('href')
        const title = $(each).find('h2 a').text()
        const regex = /(?:【.*?】)?(?:（.*?）)?([^\s.（]+(?:\s+[^\s.（]+)*)/
        const match = title.match(regex)
        const dramaName = match ? match[1] : title
        const r = $(each).find('.summary').text()
        const tag = $(each).find('.tag').text()
        const pic = $(each).find('ul.tm-m-photos-thumb li').first().attr('data-src') || ''

        if (/content/.test(r) && !/cloud/.test(r)) return
        if (/软件|游戏|书籍|图片|公告|音乐|课程/.test(tag)) return

        cards.push({
            vod_id: href,
            vod_name: dramaName,
            vod_pic: pic,
            vod_remarks: '',
            ext: {
                url: `${appConfig.site}/${href}`,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function checkLoginState() {
    try {
        const config = argsify($cache.get('leijing_token')) || {}
        const lastLoginTime = config?.lastLoginTime || 1
        const ONE_DAY_MS = 24 * 60 * 60 * 1000
        if (Date.now() - lastLoginTime > ONE_DAY_MS) await login()
    } catch (error) {
        $print(error)
        return
    }
}
async function login() {
    try {
        const ts = Date.now()
        const url = `${appConfig.site}/login?_=${ts}`
        const config = argsify($config_str)
        const { usr: username, pwd: password } = config
        if (!username || !password) {
            return
        }
        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': UA,
        }
        let cmsToken = ''
        const cache = $cache.get('leijing_firstVisit')
        if (cache.includes('cms_token')) {
            cmsToken = cache.split('cms_token=')[1].split(';')[0]
        } else {
            const firstVisit = await $fetch.get(url, { headers })
            let setCookie = argsify(firstVisit.respHeaders)['Set-Cookie']
            cmsToken = setCookie.split('cms_token=')[1].split(';')[0]
        }

        headers.cookie = `cms_token=${cmsToken}`
        const postData = `type=10&account=${username}&password=${CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)}&jumpUrl=&captchaKey=&captchaValue=&rememberMe=false&token=${cmsToken}`
        const { respHeaders } = await $fetch.post(url, postData, {
            headers,
        })
        const setCookie = respHeaders['Set-Cookie']
        const cmsAccessToken = setCookie.match(/cms_accessToken=([^;]+)/)[1]
        const cmsRefreshToken = setCookie.match(/cms_refreshToken=([^;]+)/)[1]
        const token = {
            cmsAccessToken,
            cmsRefreshToken,
            lastLoginTime: ts,
        }
        $cache.set('leijing_token', jsonify(token))
        return true
    } catch (error) {
        $print(error)
        return
    }
}
