const cheerio = createCheerio()

const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = {
    Referer: 'https://www.olehdtv.com/',
    Origin: 'https://www.olehdtv.com',
    'User-Agent': UA,
}

const appConfig = {
    ver: 20260319,
    title: '欧乐影院',
    site: 'https://www.olehdtv.com',
    tabs: [
        // {
        //     name: '首页',
        //     ext: {
        //         url: '/index.php',
        //         hasMore: false,
        //     },
        // },
        {
            name: '电影',
            ext: {
                id: 1,
            },
        },
        {
            name: '电视剧',
            ext: {
                id: 2,
            },
        },
        {
            name: '综艺',
            ext: {
                id: 3,
            },
        },
        {
            name: '动漫',
            ext: {
                id: 4,
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
                { n: '全部', v: '1' },
                { n: '动作片', v: '101' },
                { n: '喜剧片', v: '102' },
                { n: '爱情片', v: '103' },
                { n: '科幻片', v: '104' },
                { n: '恐怖片', v: '105' },
                { n: '剧情片', v: '106' },
                { n: '战争片', v: '107' },
                { n: '动画片', v: '108' },
                { n: '悬疑片', v: '109' },
                { n: '惊悚片', v: '110' },
                { n: '纪录片', v: '111' },
                { n: '奇幻片', v: '112' },
                { n: '犯罪片', v: '113' },
            ],
        },
        {
            key: 'area',
            name: '地区',
            value: [
                { n: '全部', v: '' },
                { n: '大陆', v: '/area/大陆' },
                { n: '香港', v: '/area/香港' },
                { n: '台湾', v: '/area/台湾' },
                { n: '美国', v: '/area/美国' },
                { n: '韩国', v: '/area/韩国' },
                { n: '日本', v: '/area/日本' },
                { n: '印度', v: '/area/印度' },
                { n: '英国', v: '/area/英国' },
                { n: '法国', v: '/area/法国' },
                { n: '加拿大', v: '/area/加拿大' },
                { n: '西班牙', v: '/area/西班牙' },
                { n: '德国', v: '/area/德国' },
                { n: '俄罗斯', v: '/area/俄罗斯' },
                { n: '意大利', v: '/area/意大利' },
                { n: '泰国', v: '/area/泰国' },
                { n: '新加坡', v: '/area/新加坡' },
                { n: '马来西亚', v: '/area/马来西亚' },
                { n: '其它', v: '/area/其它' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2025', v: '/year/2025' },
                { n: '2024', v: '/year/2024' },
                { n: '2023', v: '/year/2023' },
                { n: '2022', v: '/year/2022' },
                { n: '2021', v: '/year/2021' },
                { n: '2020', v: '/year/2020' },
                { n: '2019', v: '/year/2019' },
                { n: '2018', v: '/year/2018' },
                { n: '2017', v: '/year/2017' },
                { n: '2016', v: '/year/2016' },
                { n: '2015', v: '/year/2015' },
                { n: '2014', v: '/year/2014' },
                { n: '2013', v: '/year/2013' },
                { n: '2012', v: '/year/2012' },
                { n: '2011', v: '/year/2011' },
                { n: '2010', v: '/year/2010' },
                { n: '2009', v: '/year/2009' },
                { n: '2008', v: '/year/2008' },
                { n: '2007', v: '/year/2007' },
                { n: '2006', v: '/year/2006' },
                { n: '2005', v: '/year/2005' },
                { n: '2004', v: '/year/2004' },
                { n: '2003', v: '/year/2003' },
                { n: '2002', v: '/year/2002' },
                { n: '2001', v: '/year/2001' },
                { n: '2000', v: '/year/2000' },
            ],
        },
        {
            key: 'by',
            name: '排序',
            value: [
                { n: '按最新', v: '/by/time' },
                { n: '按添加', v: '/by/time_add' },
                { n: '按最热', v: '/by/hits' },
                { n: '按评分', v: '/by/score' },
            ],
        },
    ],
    2: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '2' },
                { n: '国产剧', v: '202' },
                { n: '欧美剧', v: '201' },
                { n: '港台剧', v: '203' },
                { n: '日韩剧', v: '204' },
                { n: '短剧', v: '1207' },
            ],
        },
        {
            key: 'area',
            name: '地区',
            value: [
                { n: '全部', v: '' },
                { n: '大陆', v: '/area/大陆' },
                { n: '香港', v: '/area/香港' },
                { n: '台湾', v: '/area/台湾' },
                { n: '美国', v: '/area/美国' },
                { n: '韩国', v: '/area/韩国' },
                { n: '日本', v: '/area/日本' },
                { n: '印度', v: '/area/印度' },
                { n: '英国', v: '/area/英国' },
                { n: '法国', v: '/area/法国' },
                { n: '加拿大', v: '/area/加拿大' },
                { n: '西班牙', v: '/area/西班牙' },
                { n: '俄罗斯', v: '/area/俄罗斯' },
                { n: '意大利', v: '/area/意大利' },
                { n: '泰国', v: '/area/泰国' },
                { n: '新加坡', v: '/area/新加坡' },
                { n: '马来西亚', v: '/area/马来西亚' },
                { n: '其它', v: '/area/其它' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2025', v: '/year/2025' },
                { n: '2024', v: '/year/2024' },
                { n: '2023', v: '/year/2023' },
                { n: '2022', v: '/year/2022' },
                { n: '2021', v: '/year/2021' },
                { n: '2020', v: '/year/2020' },
                { n: '2019', v: '/year/2019' },
                { n: '2018', v: '/year/2018' },
                { n: '2017', v: '/year/2017' },
                { n: '2016', v: '/year/2016' },
                { n: '2015', v: '/year/2015' },
                { n: '2014', v: '/year/2014' },
                { n: '2013', v: '/year/2013' },
                { n: '2012', v: '/year/2012' },
                { n: '2011', v: '/year/2011' },
                { n: '2010', v: '/year/2010' },
                { n: '2009', v: '/year/2009' },
                { n: '2008', v: '/year/2008' },
                { n: '2007', v: '/year/2007' },
                { n: '2006', v: '/year/2006' },
                { n: '2005', v: '/year/2005' },
                { n: '2004', v: '/year/2004' },
                { n: '2003', v: '/year/2003' },
                { n: '2002', v: '/year/2002' },
                { n: '2001', v: '/year/2001' },
                { n: '2000', v: '/year/2000' },
            ],
        },
        {
            key: 'by',
            name: '排序',
            value: [
                { n: '按最新', v: '/by/time' },
                { n: '按添加', v: '/by/time_add' },
                { n: '按最热', v: '/by/hits' },
                { n: '按评分', v: '/by/score' },
            ],
        },
    ],
    3: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '3' },
                { n: '真人秀', v: '305' },
                { n: '音乐', v: '302' },
                { n: '搞笑', v: '304' },
                { n: '家庭', v: '301' },
                { n: '曲艺', v: '303' },
            ],
        },
        {
            key: 'area',
            name: '地区',
            value: [
                { n: '全部', v: '' },
                { n: '大陆', v: '/area/大陆' },
                { n: '香港', v: '/area/香港' },
                { n: '台湾', v: '/area/台湾' },
                { n: '美国', v: '/area/美国' },
                { n: '韩国', v: '/area/韩国' },
                { n: '日本', v: '/area/日本' },
                { n: '印度', v: '/area/印度' },
                { n: '英国', v: '/area/英国' },
                { n: '法国', v: '/area/法国' },
                { n: '加拿大', v: '/area/加拿大' },
                { n: '西班牙', v: '/area/西班牙' },
                { n: '俄罗斯', v: '/area/俄罗斯' },
                { n: '意大利', v: '/area/意大利' },
                { n: '泰国', v: '/area/泰国' },
                { n: '新加坡', v: '/area/新加坡' },
                { n: '马来西亚', v: '/area/马来西亚' },
                { n: '其它', v: '/area/其它' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2025', v: '/year/2025' },
                { n: '2024', v: '/year/2024' },
                { n: '2023', v: '/year/2023' },
                { n: '2022', v: '/year/2022' },
                { n: '2021', v: '/year/2021' },
                { n: '2020', v: '/year/2020' },
                { n: '2019', v: '/year/2019' },
                { n: '2018', v: '/year/2018' },
                { n: '2017', v: '/year/2017' },
                { n: '2016', v: '/year/2016' },
                { n: '2015', v: '/year/2015' },
                { n: '2014', v: '/year/2014' },
                { n: '2013', v: '/year/2013' },
                { n: '2012', v: '/year/2012' },
                { n: '2011', v: '/year/2011' },
                { n: '2010', v: '/year/2010' },
                { n: '2009', v: '/year/2009' },
                { n: '2008', v: '/year/2008' },
                { n: '2007', v: '/year/2007' },
                { n: '2006', v: '/year/2006' },
                { n: '2005', v: '/year/2005' },
                { n: '2004', v: '/year/2004' },
                { n: '2003', v: '/year/2003' },
                { n: '2002', v: '/year/2002' },
                { n: '2001', v: '/year/2001' },
                { n: '2000', v: '/year/2000' },
            ],
        },
        {
            key: 'by',
            name: '排序',
            value: [
                { n: '按最新', v: '/by/time' },
                { n: '按添加', v: '/by/time_add' },
                { n: '按最热', v: '/by/hits' },
                { n: '按评分', v: '/by/score' },
            ],
        },
    ],
    4: [
        {
            key: 'cateId',
            name: '分类',
            value: [
                { n: '全部', v: '4' },
                { n: '日本', v: '401' },
                { n: '国产', v: '402' },
                { n: '欧美', v: '403' },
            ],
        },
        {
            key: 'area',
            name: '地区',
            value: [
                { n: '全部', v: '' },
                { n: '大陆', v: '/area/大陆' },
                { n: '香港', v: '/area/香港' },
                { n: '台湾', v: '/area/台湾' },
                { n: '美国', v: '/area/美国' },
                { n: '韩国', v: '/area/韩国' },
                { n: '日本', v: '/area/日本' },
                { n: '印度', v: '/area/印度' },
                { n: '英国', v: '/area/英国' },
                { n: '法国', v: '/area/法国' },
                { n: '加拿大', v: '/area/加拿大' },
                { n: '西班牙', v: '/area/西班牙' },
                { n: '俄罗斯', v: '/area/俄罗斯' },
                { n: '意大利', v: '/area/意大利' },
                { n: '泰国', v: '/area/泰国' },
                { n: '新加坡', v: '/area/新加坡' },
                { n: '马来西亚', v: '/area/马来西亚' },
                { n: '其它', v: '/area/其它' },
            ],
        },
        {
            key: 'year',
            name: '年份',
            value: [
                { n: '全部', v: '' },
                { n: '2025', v: '/year/2025' },
                { n: '2024', v: '/year/2024' },
                { n: '2023', v: '/year/2023' },
                { n: '2022', v: '/year/2022' },
                { n: '2021', v: '/year/2021' },
                { n: '2020', v: '/year/2020' },
                { n: '2019', v: '/year/2019' },
                { n: '2018', v: '/year/2018' },
                { n: '2017', v: '/year/2017' },
                { n: '2016', v: '/year/2016' },
                { n: '2015', v: '/year/2015' },
                { n: '2014', v: '/year/2014' },
                { n: '2013', v: '/year/2013' },
                { n: '2012', v: '/year/2012' },
                { n: '2011', v: '/year/2011' },
                { n: '2010', v: '/year/2010' },
                { n: '2009', v: '/year/2009' },
                { n: '2008', v: '/year/2008' },
                { n: '2007', v: '/year/2007' },
                { n: '2006', v: '/year/2006' },
                { n: '2005', v: '/year/2005' },
                { n: '2004', v: '/year/2004' },
                { n: '2003', v: '/year/2003' },
                { n: '2002', v: '/year/2002' },
                { n: '2001', v: '/year/2001' },
                { n: '2000', v: '/year/2000' },
            ],
        },
        {
            key: 'by',
            name: '排序',
            value: [
                { n: '按最新', v: '/by/time' },
                { n: '按添加', v: '/by/time_add' },
                { n: '按最热', v: '/by/hits' },
                { n: '按评分', v: '/by/score' },
            ],
        },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let id = ext.id
    let page = ext.page || 1
    // let hasMore = ext.hasMore || true

    // if (!hasMore && page > 1) {
    //     return jsonify({
    //         list: cards,
    //     })
    // }

    let url = `${appConfig.site}/index.php/vod/show${ext?.filters?.area || ''}${ext?.filters?.by || ''}/id/${ext?.filters?.cateId || id}/page/${page}${ext?.filters?.year || ''}.html`
    console.log(url)

    const { data } = await $fetch.get(url, {
        headers,
    })

    const $ = cheerio.load(data)
    $('.vodlist_item > a').each((_, each) => {
        const path = $(each).attr('href')
        cards.push({
            vod_id: path,
            vod_name: $(each).attr('title'),
            vod_pic: $(each).attr('data-original'),
            vod_remarks: $(each).find('span.text_right > em.voddate').text(),
            ext: {
                url: appConfig.site + path,
            },
        })
    })

    return jsonify({
        list: cards,
        filter: filterList[id],
    })
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
    $('.content_playlist.list_scroll > li > a').each((_, each) => {
        group.tracks.push({
            name: $(each).text(),
            pan: '',
            ext: {
                url: appConfig.site + $(each).attr('href'),
            },
        })
    })

    if (group.tracks.length > 0) {
        groups.push(group)
    }

    return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    const { url } = argsify(ext)
    const { data } = await $fetch.get(url, {
        headers,
    })
    const obj = JSON.parse(data.match(/player_aaaa=(.+?)<\/script>/)[1])
    const m3u = obj.url

    return jsonify({ urls: [m3u] })
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

    const url = appConfig.site + `/index.php/vod/search.html?wd=${text}&submit=`
    const { data } = await $fetch.get(url, {
        headers,
    })

    const $ = cheerio.load(data)
    $('a.vodlist_thumb').each((_, each) => {
        const path = $(each).attr('href')
        cards.push({
            vod_id: path,
            vod_name: $(each).attr('title'),
            vod_pic: $(each).attr('data-original'),
            vod_remarks: $(each).find('span.text_right').text(),
            ext: {
                url: appConfig.site + path,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
