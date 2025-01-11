const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1'

let appConfig = {
    ver: 1,
    title: 'Taiav',
    site: 'https://taiav.com',
    tabs: [
        {
            name: '网红主播',
            ext: {
                tip: 'category',
                class: '网红主播'
            },
        },
        {
            name: '国产AV',
            ext: {
                tip: 'category',
                class: '国产AV'
            },
        },
        {
            name: '有码',
            ui: 1,
            ext: {
                tip: 'category',
                class: '有码'
            },
        },
        {
            name: '无码',
            ui: 1,
            ext: {
                tip: 'category',
                class: '无码'
            },
        },
        {
            name: 'Onlyfans',
            ui: 1,
            ext: {
                tip: 'tag',
                class: 'Onlyfans'
            },
        },
        {
            name: 'Korean Bj',
            ext: {
                tip: 'tag',
                class: 'Korean Bj'
            },
        },
        {
            name: '探花',
            ext: {
                tip: 'tag',
                class: '探花'
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
    let text = encodeURIComponent(ext.class)
    let { tip, page = 1 } = ext
    let url = `${appConfig.site}/api/getcontents?page=${page}&size=12&${tip}=${text}&type=movie,tv`
    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    argsify(data).forEach((e) => {
        const cover = `${appConfig.site}${e.poster2.url}`
        const time = e.duration
        const addtime = e.createAt
        cards.push({
            vod_id: e._id.toString(),
            vod_name: e.originalname,
            vod_pic: cover,
            vod_remarks: 'HD',
            vod_pubdate: addtime,
            vod_duration: time,
            ext: {
                url: `${appConfig.site}/api/getmovie?type=1280&id=${e._id}`, // 拼接URL
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
    let playlist = argsify(data)
        const name = '播放'
        const m3u8 = playlist.m3u8.replace(/\?.*$/, '')
        tracks.push({
            name: name,
            pan: '',
            ext: {
                playurl: `${appConfig.site}${m3u8}`,
            },
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
    let playurl = ext.playurl
    return jsonify({
        urls: [playurl],
        headers: [{
            'User-Agent': UA,
            'Referer': 'https://taiav.com/'
        }]
    })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    const text = encodeURIComponent(ext.text)
    const page = ext.page || 1
    const url = `${appConfig.site}/api/getcontents?page=${page}&size=48&q=${text}&type=movie,tv`
    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    argsify(data).forEach((e) => {
        const cover = `${appConfig.site}${e.poster2.url}`
        const time = e.duration
        const addtime = e.createAt
        cards.push({
            vod_id: e._id.toString(),
            vod_name: e.originalname,
            vod_pic: cover,
            vod_remarks: 'HD',
            vod_pubdate: addtime,
            vod_duration: time,
            ext: {
                url: `${appConfig.site}/api/getmovie?type=1280&id=${e._id}`, 
            },
        })
    })
    return jsonify({
        list: cards,
    })
}