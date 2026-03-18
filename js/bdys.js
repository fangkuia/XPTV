const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

const appConfig = {
    ver: 1,
    title: '哔滴影视',
    // xlys.me
    site: 'https://xl01.com.de',
    tabs: [
        {
            name: '分類',
            ext: {
                type: 'filter',
                url: '/s/all',
            },
        },
        {
            name: '最新电影',
            ext: {
                url: '/s/all/1?type=0',
            },
        },
        {
            name: '最新剧集',
            ext: {
                url: '/s/all/1?type=1',
            },
        },
        {
            name: '欧美剧集',
            ext: {
                url: '/s/meiju/1',
            },
        },
        {
            name: '日韩剧集',
            ext: {
                url: '/s/hanju/1',
            },
        },
        {
            name: '港台剧集',
            ext: {
                url: '/s/gangtaiju/1',
            },
        },
        {
            name: '动漫',
            ext: {
                url: '/s/donghua/1?type=1',
            },
        },
    ],
}
const filter = []

const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = {
    Referer: appConfig.site + '/',
    Origin: appConfig.site,
    'User-Agent': UA,
}

async function getConfig() {
    if (!headers['Cookie']){
        const { respHeaders } = await $fetch.get(appConfig.site + '/zzzzz', {
            headers,
        })
        headers['Cookie'] = respHeaders['Set-Cookie'].split(';')[0]
    }
    
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []

    let page = ext.page || 1
    let url = `${appConfig.site}/s/all/${page}`

    if (ext.type && ext.type === 'filter' && !ext.filters) {
        const { data } = await $fetch.get(url, {
            headers,
        })

        const $ = cheerio.load(data)
        cards = await extractCards(url)
        $('.all-filter-wrapper > dl').each((_, e) => {
            const name = $(e).find('dt').text().replace(/：/g, '').trim()
            if (filter.some((f) => f.name === name)) return
            const isCategory = name === '影视类型'

            const values = []
            let key = ''

            $(e)
                .find('dd > a')
                .each((_, each) => {
                    const subname = $(each).text().trim()
                    const path = $(each).attr('href') || ''

                    let value = ''
                    let currentKey = ''

                    if (isCategory) {
                        // /s/xxx
                        value = path.replace('/s/', '')
                        currentKey = 'cat'
                    } else {
                        // /s/all?type=xxx
                        const query = path.replace(/\/s\/all\??/, '')
                        const [k, v] = query.split('=')

                        currentKey = k
                        value = v || ''
                    }

                    if (!key) key = currentKey

                    values.push({
                        n: subname,
                        v: subname === '不限' ? '' : value,
                    })
                })

            filter.push({
                name,
                key,
                init: values[0]?.v || '',
                value: values,
            })
        })
        $print(JSON.stringify(filter))

        return jsonify({
            list: cards,
            filter,
        })
    } else if (ext.type && ext.type === 'filter' && ext.filters) {
        url = `${appConfig.site}/s/${ext.filters?.cat || 'all'}/${page}?type=${ext.filters?.type || ''}&year=${ext.filters?.year || ''}&order=${ext.filters?.order || ''}`
        if (ext.filters?.area) url += `&area=${ext.filters?.area}`

        cards = await extractCards(url)

        return jsonify({
            list: cards,
            filter,
        })
    } else {
        url = url.replace('/1', `/${page}`)

        cards = await extractCards(url)

        return jsonify({
            list: cards,
        })
    }
}

async function extractCards(url) {
    let cards = []
    const { data } = await $fetch.get(url, {
        headers,
    })

    const $ = cheerio.load(data)
    $('.card-link').each((_, each) => {
        const path = $(each).find('a').attr('href')
        cards.push({
            vod_id: path,
            vod_name: $(each).find('.card-title').text(),
            vod_pic: $(each).find('img').attr('src'),
            vod_remarks: $(each).find('span.badge').text(),
            ext: {
                url: appConfig.site + path,
            },
        })
    })
    return cards
}

async function getTracks(ext) {
    const { url } = argsify(ext)
    let groups = []

    const { data } = await $fetch.get(url, {
        headers,
    })
    const $ = cheerio.load(data)
    let group = {
        title: '在线',
        tracks: [],
    }
    $('a.btn').each((_, each) => {
        let path = $(each).attr('href') ?? ''
        if (path.startsWith('/play/') || path.startsWith('/guoju/play/')) {
            group.tracks.push({
                name: $(each).text(),
                pan: '',
                ext: {
                    url: appConfig.site + path,
                },
            })
        }
    })
    groups.push(group)
    return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    const { url } = argsify(ext)
    const { data } = await $fetch.get(url, {
        headers,
    })
    let pid = data.match(/var pid = (\d+);/)[1]
    let currentTimeMillis = Date.now()
    let str4 = pid + '-' + currentTimeMillis
    let md5Hash = CryptoJS.MD5(str4).toString(CryptoJS.enc.Hex)
    while (md5Hash.length < 32) {
        md5Hash = '0' + md5Hash
    }
    md5Hash = md5Hash.toLowerCase()
    let key = CryptoJS.enc.Utf8.parse(md5Hash.substring(0, 16))
    let encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(str4), key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    })
    let encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex)
    let encryptedString = encryptedHex.toUpperCase()
    let lines = appConfig.site + '/lines?t=' + currentTimeMillis + '&sg=' + encryptedString + '&pid=' + pid
    const data2 = (
        await $fetch.get(lines, {
            headers,
        })
    ).data

    if (JSON.parse(data2).data.url3) {
        let url3 = JSON.parse(data2).data.url3
        let play = url3.indexOf(',') !== -1 ? url3.split(',')[1].trim() : url3.trim()
        return jsonify({
            urls: [play],
            headers: [headers],
        })
    } else if (JSON.parse(data2).data.tos) {
        let god = `${appConfig.site}/god/${pid}?type=1`
        let res = await $fetch.post(
            god,
            {
                t: currentTimeMillis,
                sg: encryptedString,
                verifyCode: 888,
            },
            {
                headers: {
                    'User-Agent': UA,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        )

        let playUrl = argsify(res.data).url
        return jsonify({
            urls: [playUrl],
            headers: [{ 'User-Agent': UA }],
        })
    } else {
        let god = `${appConfig.site}/god/${pid}`
        let res = await $fetch.post(
            god,
            {
                t: currentTimeMillis,
                sg: encryptedString,
                verifyCode: 666,
            },
            {
                headers: {
                    'User-Agent': UA,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        )

        let playUrl = argsify(res.data).url
        return jsonify({
            urls: [playUrl],
            headers: [headers],
        })
    }
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    if (page > 1) {
        return jsonify({
            list: cards,
        })
    }

    const url = appConfig.site + `/search/${text}?code=112`
    const { data } = await $fetch.get(url, {
        headers,
    })

    const $ = cheerio.load(data)
    $('div.row').each((_, each) => {
        const a = $(each).find('a.search-movie-title')
        cards.push({
            vod_id: a.attr('href'),
            vod_name: a.attr('title'),
            vod_pic: $(each).find('img.object-cover').attr('src'),
            vod_remarks: '',
            ext: {
                url: appConfig.site + a.attr('href'),
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
