const cheerio = createCheerio()
/*
{	
    "channels": [
        "QuarkFree",
        "ucpanpan",
    ]
}
*/
let $config = argsify($config_str)
const UA = 'MOBILE_UA'
let appConfig = {
    ver: 1,
    title: 'tg搜索',
    site: 'https://t.me/s/',
    // tabs: [
    //     {
    //         name: '只能搜索',
    //         ui: 1,
    //         ext: {
    //             id: '',
    //         },
    //     },
    // ],
}

async function getConfig() {
    let config = appConfig
    config.tabs = []
    let channels = $config.channels
    channels.forEach((e) => {
        config.tabs.push({
            name: e,
            // ui: 1,
            ext: {
                channel: e,
            },
        })
    })
    return jsonify(config)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let page = ext.page || 1
    let url = `${appConfig.site}${ext.channel}`
    let headers = {
        'User-Agent': UA,
    }

    try {
        if (page > 1) {
            let config = argsify($cache.get('tgs-card-config'))
            if (config && config.hasMore) {
                url = config.nextPage
                headers['Referer'] = `${appConfig.site}${ext.channel}`
                headers['X-Requested-With'] = 'XMLHttpRequest'
            } else
                return jsonify({
                    list: cards,
                })
        }

        let { data } = await $fetch.get(url, {
            headers,
        })
        if (page > 1) {
            data = data.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\n', '').replaceAll('\\/', '/')
        }

        const $ = cheerio.load(data)

        if ($('div.tgme_widget_message_bubble').length === 0) return

        $('div.tgme_widget_message_bubble').each((_, element) => {
            let title = ''
            let hrefs = []
            let cover = ''
            let remarks = ''
            try {
                const html = $(element).find('.tgme_widget_message_text').html()
                html.split('<br>').forEach((e) => {
                    const titletext = e.trim()
                    if (/(名称|名字|短剧|资源标题)(：|:)/.test(titletext)) {
                        title = titletext
                            .split(/：|:/)[1]
                            .replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>|<i[^>]*>|<\/i>/g, '')
                            .replace(/【[^】]*】/g, '')
                            .trim()
                            .split(/（|\(|\[/)[0]
                    } else if (/(.+)\s(更新?至|全).*集/.test(titletext)) {
                        title = titletext.split(' ')[0]
                        .replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>|<i[^>]*>|<\/i>/g, '')
                        .replace(/【[^】]*】/g, '')
                    } else if (/S\d+/.test(titletext)) {
                        title = titletext.split('S')[0]
                        .replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>|<i[^>]*>|<\/i>/g, '')
                        .replace(/【[^】]*】/g, '')
                    }
                })
                title = title.replace('<b>', '')

                $(element)
                    .find('.tgme_widget_message_text > a')
                    .each((_, element) => {
                        const href = $(element).attr('href').replace('anxia.com', '115.com')
                        if (href.match(/https:\/\/(.+)\/s\/(.+)/)) {
                            hrefs.push(href)
                        }
                    })
                cover = $(element)
                    .find('.tgme_widget_message_photo_wrap')
                    .attr('style')
                    .match(/image\:url\('(.+)'\)/)[1]
                remarks = hrefs[0].match(/https:\/\/(.+)\/s\//)[1].replace(/(115\.com)|(anxia\.com)/, '115')
                .replace(/(pan\.quark\.cn)/, '夸克')
                .replace(/(drive\.uc\.cn)/, 'UC')
                .replace(/(www\.aliyundrive\.com)|(www\.alipan\.com)/, '阿里')
                .replace(/(cloud\.189\.cn)/, '天翼')
                .trim();
            } catch (e) {
                // $utils.toastError(`${ext.channel}搜索失败`)
            }
            if (remarks === '') return
            cards.push({
                vod_id: hrefs[0],
                vod_name: title,
                vod_pic: cover,
                vod_remarks: remarks,
                ext: {
                    url: hrefs,
                },
            })
        })

        let nextPage = $('.js-messages_more_wrap a').attr('href')
        nextPage = nextPage ? `https://t.me${nextPage}` : ''
        if (nextPage) {
            let config = {
                hasMore: true,
                nextPage,
            }
            $cache.set('tgs-card-config', jsonify(config))
        } else {
            $cache.set(
                'tgs-card-config',
                jsonify({
                    hasMore: false,
                })
            )
        }
        return jsonify({
            list: cards.reverse(),
        })
    } catch (error) {
        $print(error)
    }
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let urls = ext.url
    urls.forEach((url) => {
        tracks.push({
            name: '网盘',
            pan: url,
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
    return jsonify({ urls: [] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let page = ext.page || 1
    if (page > 1) {
        return jsonify({
            list: [],
        })
    }
    let text = encodeURIComponent(ext.text)

    for (const channel of $config.channels) {
        let url = `${appConfig.site}${channel}?q=${text}`
        const { data } = await $fetch.get(url, {
            headers: {
                'User-Agent': UA,
            },
        })
        const $ = cheerio.load(data)
        if ($('div.tgme_widget_message_bubble').length === 0) continue
        $('div.tgme_widget_message_bubble').each((_, element) => {
            let title = ''
            let hrefs = []
            let cover = ''
            let remarks = ''
            try {
                const html = $(element).find('.tgme_widget_message_text').html()
                html.split('<br>').forEach((e) => {
                    const titletext = e.trim()
                    if (/(名称|名字|短剧|资源标题)(：|:)/.test(titletext)) {
                        title = titletext
                            .split(/：|:/)[1]
                            .replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>|<i[^>]*>|<\/i>/g, '')
                            .replace(/【[^】]*】/g, '')
                            .trim()
                            .split(/（|\(|\[/)[0]
                    } else if (/(.+)\s(更新?至|全).*集/.test(titletext)) {
                        title = titletext.split(' ')[0]
                        .replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>|<i[^>]*>|<\/i>/g, '')
                        .replace(/【[^】]*】/g, '')
                    } else if (/S\d+/.test(titletext)) {
                        title = titletext.split('S')[0]
                        .replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>|<i[^>]*>|<\/i>/g, '')
                        .replace(/【[^】]*】/g, '')
                    }
                })
                title = title.replace('<b>', '')
                $(element)
                    .find('.tgme_widget_message_text > a')
                    .each((_, element) => {
                        const href = $(element).attr('href')
                        if (href.match(/https:\/\/(.+)\/s\/(.+)/)) {
                            hrefs.push(href)
                        }
                    })
                cover = $(element)
                    .find('.tgme_widget_message_photo_wrap')
                    .attr('style')
                    .match(/image\:url\('(.+)'\)/)[1]
                remarks = hrefs[0].match(/https:\/\/(.+)\/s\//)[1].replace(/(115\.com)|(anxia\.com)/, '115')
                .replace(/(pan\.quark\.cn)/, '夸克')
                .replace(/(drive\.uc\.cn)/, 'UC')
                .replace(/(www\.aliyundrive\.com)|(www\.alipan\.com)/, '阿里')
                .replace(/(cloud\.189\.cn)/, '天翼')
                .trim();
            } catch (e) {
                $utils.toastError(`${channel}搜索失败`)
            }
            if (remarks === '') return
            cards.push({
                vod_id: hrefs[0],
                vod_name: title,
                vod_pic: cover,
                vod_remarks: remarks,
                ext: {
                    url: hrefs,
                },
            })
        })
    }
    return jsonify({
        list: cards,
    })
}
