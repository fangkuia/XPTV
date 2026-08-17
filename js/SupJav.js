const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const appConfig = {
    ver: 1,
    title: 'SupJav',
    site: 'https://supjav.com/zh',
    tabs: [
        {
            name: '热门',
            ext: {
                id: 'popular',
            },
            ui: 1,
        },
        {
            name: '有码',
            ext: {
                id: 'category/censored-jav',
            },
            ui: 1,
        },
        {
            name: '无码',
            ext: {
                id: 'category/uncensored-jav',
            },
            ui: 1,
        },
        {
            name: '素人',
            ext: {
                id: 'category/amateur',
            },
            ui: 1,
        },
        {
            name: '中文字幕',
            ext: {
                id: 'category/chinese-subtitles',
            },
            ui: 1,
        },
        {
            name: '无码破解',
            ext: {
                id: 'category/reducing-mosaic',
            },
            ui: 1,
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

    const url = appConfig.site + `/${id}/page/${page}`

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

    const videos = $('.post')
    videos.each((_, e) => {
        const href = $(e).find('a').attr('href')
        const title = $(e).find('a').attr('title')
        const cover = $(e).find('a img').attr('data-original').replace('!320x216.jpg', '')
        const remarks = $(e).find('.con .meta .date').text()

        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
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
    const btns = $('a.btn-server')
    btns.each((_, e) => {
        const name = $(e).text()
        const data_link = $(e).attr('data-link')
        tracks.push({
            name,
            pan: '',
            ext: {
                data: data_link,
                name,
            },
        })
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
    const { data, name } = ext

    const param = data.split('').reverse().join('')
    const url = `https://lk1.supremejav.com/supjav.php?c=${param}`
    const res = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            Referer: `https://lk1.supremejav.com/supjav.php?l=${data}&bg=undefined`,
        },
    })
    let playUrl = ''

    if (name === 'TV') {
        const url = res.data.match(/var\s+urlPlay\s*=\s*['"]([^'"]+)['"]/)[1]

        playUrl = url

        // function decrypt(h, u, n, t, e, r) {
        //     r = ''
        //     for (var i = 0, len = h.length; i < len; i++) {
        //         var s = ''
        //         while (h[i] !== n[e]) {
        //             s += h[i]
        //             i++
        //         }
        //         for (var j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], 'g'), j)
        //         r += String.fromCharCode(_0xe99c(s, e, 10) - t)
        //     }
        //     return decodeURIComponent(escape(r))
        // }

        // function _0xe99c(d, e, f) {
        //     let str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'
        //     var g = str.split('')
        //     var h = g.slice(0, e)
        //     var i = g.slice(0, f)
        //     var j = d
        //         .split('')
        //         .reverse()
        //         .reduce(function (a, b, c) {
        //             if (h.indexOf(b) !== -1) return (a += h.indexOf(b) * Math.pow(e, c))
        //         }, 0)
        //     var k = ''
        //     while (j > 0) {
        //         k = i[j % f] + k
        //         j = (j - (j % f)) / f
        //     }
        //     return k || '0'
        // }
    } else if (name === 'FST') {
        try {
            const $ = cheerio.load(res.data)
            let decoded = ''
            let script = $('script:contains(eval)').html() || ''
            const packed = script.replace(/^\s*eval\s*\(/, '').replace(/\)\s*;?\s*$/, '')
            decoded = Function(`return ${packed}`)()

            const match = decoded.match(/var\s+links\s*=\s*(\{[\s\S]*?\})\s*;/)
            const links = match ? JSON.parse(match[1]) : {}

            playUrl = links.hls4 || links.hls3 || links.hls2
            if (decoded.includes('fc2stream')) {
                return jsonify({ urls: [playUrl], headers: [{ 'User-Agent': UA, Referer: 'https://fc2stream.tv/' }] })
            }
            // $('script').each((_, el) => {
            //     const code = $(el).html() || ''

            //     if (code.includes('eval(function(p, a, c, k, e, d)')) {
            //         const packed = code.replace(/^\s*eval\s*\(/, '').replace(/\)\s*;?\s*$/, '')

            //         decoded = Function(`return ${packed}`)()
            //     }
            // })

            // $print(decoded)
            // $('script').each((_, e) => {
            //     if ($(e).text().includes('eval')) {
            //         const script = $(e).text().replace('eval', '')
            //         const result = eval(script)
            //         playUrl = result.match(/sources:\[\{file:"(.*?)"\}\]/)[1]
            //     }
            // })
        } catch (e) {
            $print(e)
        }
    } else if (name === 'ST') {
        const $ = cheerio.load(res.data)
        let robot = $('#robotlink').text()
        robot = robot.substring(0, robot.indexOf('&token=') + 7)
        $('script').each((_, e) => {
            let script = $(e).text()
            if (script.includes("getElementById('robotlink')")) {
                let token = script.split('&token=')[1].split("'")[0]
                playUrl = 'https:/' + robot + token + '&stream=1'
            }
        })
    } else if (name === 'VOE') {
        const location = res.data.match(/window\.location\.href = '(.*?)';/)[1]
        const locres = await $fetch.get(location, {
            headers: {
                'User-Agent': UA,
            },
        })
        const payload = JSON.parse(locres.data.match(/<script type="application\/json">(.*?)<\/script>/s)[1])[0]

        const rot13 = (s) =>
            s.replace(/[a-zA-Z]/g, (c) => {
                const b = c <= 'Z' ? 65 : 97
                return String.fromCharCode(b + ((c.charCodeAt(0) - b + 13) % 26))
            })
        const b64decode = (s) => CryptoJS.enc.Latin1.stringify(CryptoJS.enc.Base64.parse(s)) // atob
        const seps = ['@$', '^^', '~@', '%?', '*~', '!!', '#&']

        let s = rot13(payload)
        for (const t of seps) s = s.split(t).join('')
        let b = b64decode(s)
        b = Array.from(b, (ch) => String.fromCharCode(ch.charCodeAt(0) - 3)).join('')
        b = b.split('').reverse().join('')
        const config = JSON.parse(b64decode(b))
        playUrl = config.source
        // playUrl = locres.data.match(/prompt\("Node", "(.*?)"\);/)[1]
    }

    return jsonify({ urls: [playUrl] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/page/${page}?s=${text}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    const $ = cheerio.load(data)

    $('.post').each((_, e) => {
        const href = $(e).find('a').attr('href')
        const title = $(e).find('a').attr('title')
        const cover = $(e).find('a img').attr('data-original')
        const remarks = $(e).find('.con .meta .date').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: remarks,
            ext: {
                url: href,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
