const cheerio = createCheerio()

const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const appConfig = {
    ver: 20260319,
    title: '在线之家',
    site: 'https://www.zxzjhd.com',
    tabs: [
        {
            name: '首页',
            ext: {
                id: 0,
            },
        },
        {
            name: '电影',
            ext: {
                id: 1,
            },
        },
        {
            name: '美剧',
            ext: {
                id: 2,
            },
        },
        {
            name: '韩剧',
            ext: {
                id: 3,
            },
        },
        {
            name: '日剧',
            ext: {
                id: 4,
            },
        },
        {
            name: '泰剧',
            ext: {
                id: 5,
            },
        },
        {
            name: '动漫',
            ext: {
                id: 6,
            },
        },
    ],
}
const filterList = {
    1: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '' },
                { n: '喜剧', v: '喜剧' },
                { n: '爱情', v: '爱情' },
                { n: '恐怖', v: '恐怖' },
                { n: '动作', v: '动作' },
                { n: '科幻', v: '科幻' },
                { n: '剧情', v: '剧情' },
                { n: '战争', v: '战争' },
                { n: '警匪', v: '警匪' },
                { n: '犯罪', v: '犯罪' },
                { n: '动画', v: '动画' },
                { n: '奇幻', v: '奇幻' },
                { n: '冒险', v: '冒险' },
                { n: '悬疑', v: '悬疑' },
                { n: '惊悚', v: '惊悚' },
                { n: '青春', v: '青春' },
                { n: '情色', v: '情色' },
            ],
        },
        {
            key: 'area',
            name: '地区',
            value: [
                { n: '全部', v: '' },
                { n: '大陆', v: '大陆' },
                { n: '香港', v: '香港' },
                { n: '台湾', v: '台湾' },
                { n: '欧美', v: '欧美' },
                { n: '韩国', v: '韩国' },
                { n: '日本', v: '日本' },
                { n: '泰国', v: '泰国' },
                { n: '印度', v: '印度' },
                { n: '俄罗斯', v: '俄罗斯' },
                { n: '其他', v: '其他' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2023', v: '2023' },
                { n: '2022', v: '2022' },
                { n: '2021', v: '2021' },
                { n: '2020', v: '2020' },
                { n: '2019', v: '2019' },
                { n: '2018', v: '2018' },
                { n: '2017', v: '2017' },
                { n: '2016', v: '2016' },
                { n: '2015', v: '2015' },
                { n: '2014', v: '2014' },
                { n: '2013', v: '2013' },
                { n: '2012', v: '2012' },
                { n: '2011', v: '2011' },
                { n: '2010', v: '2010' },
                { n: '2009', v: '2009' },
                { n: '2008', v: '2008' },
                { n: '2007', v: '2007' },
                { n: '2006', v: '2006' },
                { n: '2005', v: '2005' },
                { n: '2004', v: '2004' },
                { n: '2003', v: '2003' },
                { n: '2002', v: '2002' },
                { n: '2001', v: '2001' },
                { n: '2000', v: '2000' },
            ],
        },
        {
            key: 'order',
            name: '排序',
            value: [
                { n: '時間', v: 'time' },
                { n: '人氣', v: 'hits' },
                { n: '評分', v: 'score' },
            ],
        },
    ],
    2: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '' },
                { n: '剧情', v: '剧情' },
                { n: '喜剧', v: '喜剧' },
                { n: '爱情', v: '爱情' },
                { n: '动作', v: '动作' },
                { n: '悬疑', v: '悬疑' },
                { n: '恐怖', v: '恐怖' },
                { n: '奇幻', v: '奇幻' },
                { n: '惊悚', v: '惊悚' },
                { n: '犯罪', v: '犯罪' },
                { n: '科幻', v: '科幻' },
                { n: '音乐', v: '音乐' },
                { n: '其他', v: '其他' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2023', v: '2023' },
                { n: '2022', v: '2022' },
                { n: '2021', v: '2021' },
                { n: '2020', v: '2020' },
                { n: '2019', v: '2019' },
                { n: '2018', v: '2018' },
                { n: '2017', v: '2017' },
                { n: '2016', v: '2016' },
                { n: '2015', v: '2015' },
                { n: '2014', v: '2014' },
                { n: '2013', v: '2013' },
                { n: '2012', v: '2012' },
                { n: '2011', v: '2011' },
                { n: '2010', v: '2010' },
                { n: '2009', v: '2009' },
                { n: '2008', v: '2008' },
                { n: '2006', v: '2006' },
                { n: '2005', v: '2005' },
                { n: '2004', v: '2004' },
            ],
        },
        {
            key: 'order',
            name: '排序',
            value: [
                { n: '時間', v: 'time' },
                { n: '人氣', v: 'hits' },
                { n: '評分', v: 'score' },
            ],
        },
    ],
    3: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '' },
                { n: '剧情', v: '剧情' },
                { n: '喜剧', v: '喜剧' },
                { n: '爱情', v: '爱情' },
                { n: '动作', v: '动作' },
                { n: '悬疑', v: '悬疑' },
                { n: '恐怖', v: '恐怖' },
                { n: '奇幻', v: '奇幻' },
                { n: '惊悚', v: '惊悚' },
                { n: '犯罪', v: '犯罪' },
                { n: '科幻', v: '科幻' },
                { n: '音乐', v: '音乐' },
                { n: '其他', v: '其他' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2023', v: '2023' },
                { n: '2022', v: '2022' },
                { n: '2021', v: '2021' },
                { n: '2020', v: '2020' },
                { n: '2019', v: '2019' },
                { n: '2018', v: '2018' },
                { n: '2017', v: '2017' },
                { n: '2016', v: '2016' },
                { n: '2015', v: '2015' },
                { n: '2014', v: '2014' },
                { n: '2013', v: '2013' },
                { n: '2012', v: '2012' },
                { n: '2011', v: '2011' },
                { n: '2010', v: '2010' },
                { n: '2009', v: '2009' },
                { n: '2008', v: '2008' },
                { n: '2007', v: '2007' },
                { n: '2006', v: '2006' },
                { n: '2005', v: '2005' },
                { n: '2004', v: '2004' },
                { n: '2003', v: '2003' },
                { n: '2002', v: '2002' },
                { n: '2001', v: '2001' },
                { n: '2000', v: '2000' },
            ],
        },
        {
            key: 'order',
            name: '排序',
            value: [
                { n: '時間', v: 'time' },
                { n: '人氣', v: 'hits' },
                { n: '評分', v: 'score' },
            ],
        },
    ],
    4: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '' },
                { n: '剧情', v: '剧情' },
                { n: '喜剧', v: '喜剧' },
                { n: '爱情', v: '爱情' },
                { n: '动作', v: '动作' },
                { n: '悬疑', v: '悬疑' },
                { n: '恐怖', v: '恐怖' },
                { n: '奇幻', v: '奇幻' },
                { n: '惊悚', v: '惊悚' },
                { n: '犯罪', v: '犯罪' },
                { n: '科幻', v: '科幻' },
                { n: '音乐', v: '音乐' },
                { n: '其他', v: '其他' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2023', v: '2023' },
                { n: '2022', v: '2022' },
                { n: '2021', v: '2021' },
                { n: '2020', v: '2020' },
                { n: '2019', v: '2019' },
                { n: '2018', v: '2018' },
                { n: '2017', v: '2017' },
                { n: '2016', v: '2016' },
                { n: '2015', v: '2015' },
                { n: '2014', v: '2014' },
                { n: '2013', v: '2013' },
                { n: '2012', v: '2012' },
                { n: '2011', v: '2011' },
                { n: '2010', v: '2010' },
                { n: '2009', v: '2009' },
                { n: '2008', v: '2008' },
                { n: '2007', v: '2007' },
                { n: '2006', v: '2006' },
                { n: '2005', v: '2005' },
                { n: '2004', v: '2004' },
                { n: '2003', v: '2003' },
                { n: '2002', v: '2002' },
                { n: '2001', v: '2001' },
                { n: '2000', v: '2000' },
            ],
        },
        {
            key: 'order',
            name: '排序',
            value: [
                { n: '時間', v: 'time' },
                { n: '人氣', v: 'hits' },
                { n: '評分', v: 'score' },
            ],
        },
    ],
    5: [
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2022', v: '2022' },
                { n: '2021', v: '2021' },
                { n: '2020', v: '2020' },
                { n: '2019', v: '2019' },
                { n: '2018', v: '2018' },
                { n: '2017', v: '2017' },
                { n: '2016', v: '2016' },
                { n: '2015', v: '2015' },
                { n: '2014', v: '2014' },
                { n: '2013', v: '2013' },
                { n: '2012', v: '2012' },
                { n: '2011', v: '2011' },
                { n: '2010', v: '2010' },
                { n: '2009', v: '2009' },
                { n: '2008', v: '2008' },
                { n: '2007', v: '2007' },
                { n: '2006', v: '2006' },
                { n: '2005', v: '2005' },
                { n: '2004', v: '2004' },
                { n: '2003', v: '2003' },
                { n: '2002', v: '2002' },
                { n: '2001', v: '2001' },
                { n: '2000', v: '2000' },
            ],
        },
        {
            key: 'order',
            name: '排序',
            value: [
                { n: '時間', v: 'time' },
                { n: '人氣', v: 'hits' },
                { n: '評分', v: 'score' },
            ],
        },
    ],
    6: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '' },
                { n: '情感', v: '情感' },
                { n: '科幻', v: '科幻' },
                { n: '热血', v: '热血' },
                { n: '推理', v: '推理' },
                { n: '搞笑', v: '搞笑' },
                { n: '冒险', v: '冒险' },
                { n: '萝莉', v: '萝莉' },
                { n: '校园', v: '校园' },
                { n: '动作', v: '动作' },
                { n: '机战', v: '机战' },
                { n: '运动', v: '运动' },
                { n: '战争', v: '战争' },
                { n: '少年', v: '少年' },
                { n: '少女', v: '少女' },
                { n: '社会', v: '社会' },
                { n: '原创', v: '原创' },
                { n: '亲子', v: '亲子' },
                { n: '益智', v: '益智' },
                { n: '励志', v: '励志' },
                { n: '其他', v: '其他' },
            ],
        },
        {
            key: 'area',
            name: '地区',
            value: [
                { n: '全部', v: '' },
                { n: '国产', v: '国产' },
                { n: '日本', v: '日本' },
                { n: '欧美', v: '欧美' },
                { n: '其他', v: '其他' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2023', v: '2023' },
                { n: '2022', v: '2022' },
                { n: '2021', v: '2021' },
                { n: '2020', v: '2020' },
                { n: '2019', v: '2019' },
                { n: '2018', v: '2018' },
                { n: '2017', v: '2017' },
                { n: '2016', v: '2016' },
                { n: '2015', v: '2015' },
                { n: '2014', v: '2014' },
                { n: '2013', v: '2013' },
                { n: '2012', v: '2012' },
                { n: '2011', v: '2011' },
                { n: '2010', v: '2010' },
                { n: '2009', v: '2009' },
                { n: '2008', v: '2008' },
                { n: '2007', v: '2007' },
                { n: '2006', v: '2006' },
                { n: '2005', v: '2005' },
                { n: '2004', v: '2004' },
                { n: '2003', v: '2003' },
                { n: '2002', v: '2002' },
                { n: '2001', v: '2001' },
                { n: '2000', v: '2000' },
            ],
        },
        {
            key: 'order',
            name: '排序',
            value: [
                { n: '時間', v: 'time' },
                { n: '人氣', v: 'hits' },
                { n: '評分', v: 'score' },
            ],
        },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    var cards = []
    let id = ext.id
    let page = ext.page || 1

    try {
        var url = `${appConfig.site}/`
        if (id == 0 && page > 1) {
            return jsonify({
                list: cards,
            })
        }

        if (id > 0) {
            const { area = '', order = '', cateId = '', year = '' } = ext?.filters || {}

            url = `${appConfig.site}/vodshow/${id}-${area}-${order}-${cateId}-----${page}---${year}.html`
        }

        const { data } = await $fetch.get(url, {
            headers: {
                // Referer: `${appConfig.site}/`,
                'User-Agent': UA,
            },
        })

        const $ = cheerio.load(data)
        $('.stui-vodlist__box').each((_, element) => {
            const href = $(element).find('.stui-vodlist__thumb').attr('href')
            const title = $(element).find('.stui-vodlist__thumb').attr('title')
            const cover = $(element).find('.stui-vodlist__thumb').attr('data-original')
            const subTitle = $(element).find('.pic-text').find('.text-right').text()

            if (href.startsWith('/detail/')) {
                cards.push({
                    vod_id: href.replace(/.*?\/detail\/(.*).html/g, '$1'),
                    vod_name: title,
                    vod_pic: cover,
                    vod_remarks: subTitle,
                    ext: {
                        url: `${appConfig.site}${href}`,
                    },
                })
            }
        })
    } catch (error) {
        $print(error)
    }

    return jsonify({
        list: cards,
        filter: id > 0 ? filterList[id] : [],
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    var tracks = []
    let url = ext.url

    // 发送请求
    const { data } = await $fetch.get(url, {
        headers: {
            // Referer: 'https://www.zxzja.com/',
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    // 解析数据，例如提取标题
    $('.stui-content__playlist > li > a').each((_, each) => {
        const href = $(each).attr('href')
        const name = $(each).text()
        if (href && name && name !== '合集') {
            tracks.push({
                name,
                pan: '',
                ext: {
                    url: `${appConfig.site}${href}`,
                },
            })
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
    ext = argsify(ext)
    let url = ext.url

    try {
        // 发送请求
        const { data } = await $fetch.get(url, {
            headers: {
                'User-Agent': UA,
            },
        })

        const html = data.match(/r player_.*?=(.*?)</)[1]
        const json = JSON.parse(html)

        const playurl = json.url
        const from = json.from
        if (json.encrypt == '1') {
            playurl = decodeURIComponent(url)
        } else if (json.encrypt == '2') {
            playurl = decodeURIComponent(Buffer.from(url, 'base64').toString('utf-8'))
        }
        // $print(`playurl: ${playurl}`)
        if (playurl.indexOf('m3u8') >= 0 || playurl.indexOf('mp4') >= 0) {
            return jsonify({ urls: [playurl] })
            // } else if (from.indexOf('line3') >= 0 || from.indexOf('line5') >= 0) {
        } else {
            const { data } = await $fetch.get(playurl, {
                headers: {
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    Referer: `${appConfig.site}/`,
                    'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"macOS"',
                    'Sec-Fetch-Dest': 'iframe',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-site',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': UA,
                },
            })
            let resultv2 = data.match(/var result_v2 = {(.*?)};/)[1]
            let code = JSON.parse('{' + resultv2 + '}')
                .data.split('')
                .reverse()
            let temp = ''
            for (let i = 0x0; i < code.length; i = i + 0x2) {
                temp += String.fromCharCode(parseInt(code[i] + code[i + 0x1], 0x10))
            }
            const purl =
                temp.substring(0x0, (temp.length - 0x7) / 0x2) + temp.substring((temp.length - 0x7) / 0x2 + 0x7)
            $print('***在线之家purl =====>' + purl)
            return jsonify({ urls: [purl] })
        }
        return jsonify({ urls: [] })
    } catch (error) {
        $print(error)
    }
}

async function search(ext) {
    ext = argsify(ext)
    var cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1

    if (page > 1) {
        return jsonify({
            list: cards,
        })
    }

    const url = `${appConfig.site}/vodsearch/--.html?wd=${text}&submit=`
    const { data } = await $fetch.get(url, {
        headers: {
            Referer: `${appConfig.site}`,
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)
    $('a.lazyload').each((_, element) => {
        const href = $(element).attr('href')
        const title = $(element).attr('title')
        const cover = $(element).attr('data-original')
        const subTitle = $(element).find('.text-right').text()

        if (href.startsWith('/detail/')) {
            cards.push({
                vod_id: href.replace(/.*?\/detail\/(.*).html/g, '$1'),
                vod_name: title,
                vod_pic: cover,
                vod_remarks: subTitle,
                ext: {
                    url: `${appConfig.site}${href}`,
                },
            })
        }
    })

    return jsonify({
        list: cards,
    })
}
