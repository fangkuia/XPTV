const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1'

let appConfig = {
    ver: 1,
    title: 'JavMove',
    site: 'https://javmove.com',
    tabs: [
        {
            name: '最新AV',
            ui: 1,
            ext: {
                tag: 'release',
            },
        },
        {
            name: '即将上映',
            ui: 1,
            ext: {
                tag: 'upcoming',
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
    let { tag, page = 1 } = ext
    let url = `${appConfig.site}/${tag}?page=${page}`

    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })
    const $ = cheerio.load(data)
    $('#movie-list article').each((_, element) => {
        const href = $(element).find('a[rel="bookmark"]').attr('href')
        const title = $(element).find('.movie-info h2').attr('title').split(" ")[0]
        const cover = $(element).find('.movie-image').attr('data-srcset') || $(element).find('.movie-image').attr('src')
        const pubdate = $(element).find('time.tag').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_pubdate: pubdate,
            ext: {
                url: `${appConfig.site}${href}`,
                ref: url,
            },
        })
    })
    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let groups = []
    let url = ext.url
    let referer = ext.ref

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            'Referer': referer,
        },
    })

    const $ = cheerio.load(data)
    const id = $('#video-player').attr('data-id') || ''

    const promises = $('.video-format').toArray().map(async (element) => {
        const format = $(element).find('.video-format-header').text().trim()
        let formatGroup = {
            title: format,
            tracks: [],
        }

        const partElements = $(element).find('.video-source-btn')
        for (const partEl of partElements.toArray()) {
            const href = $(partEl).attr('href') || ''

            const partMatch = $(partEl).attr('title').match(/part\s*(\d+)/i)
            const partNumber = partMatch ? parseInt(partMatch[1], 10) : 0
            const title = `part ${partNumber}`
            let dataID

            if (href.includes('#')) {
                dataID = id
            } else {
                const curl = `${appConfig.site}${href}`
                const { data: data2 } = await $fetch.get(curl, {
                    headers: {
                        'User-Agent': UA,
                        'Referer': referer,
                    },
                })
                const $2 = cheerio.load(data2)
                dataID = $2('#video-player').attr('data-id')
            }

            formatGroup.tracks.push({
                part: partNumber,
                name: title,
                ext: {
                    dataID: dataID,
                },
            })
        }

        groups.push(formatGroup)
    })

    await Promise.all(promises)

    const formatPriority = { FullHD: 1, HD: 2, SD: 3 }
    groups.sort((a, b) => {
        return formatPriority[a.title] - formatPriority[b.title]
    })

    groups.forEach(group => {
        group.tracks.sort((a, b) => a.part - b.part)
    })

    return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    const url = `${appConfig.site}/watch?token=${ext.dataID}`
    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            'Referer': 'https://javquick.com/'
            },
    })
        return jsonify({ urls: [data] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/search?q=${text}&page=${page}`
    const { data } = await $fetch.get(url, {
        headers:  {
            'User-Agent': UA,
            },
    })
    const $ = cheerio.load(data)
    $('#movie-list article').each((_, element) => {
        const href = $(element).find('a[rel="bookmark"]').attr('href')
        const title = $(element).find('.movie-info h2').attr('title').split(" ")[0]
        const cover = $(element).find('.movie-image').attr('data-srcset') || $(element).find('.movie-image').attr('src')
        const pubdate = $(element).find('time.tag').text()
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_pubdate: pubdate,
            ext: {
                url: `${appConfig.site}${href}`,
                ref: url,
            },
        })
    })
    return jsonify({
        list: cards,
    })
}