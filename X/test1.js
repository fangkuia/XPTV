let appConfig = {
    ver: 1,
    title: '小雅tvbox',
}

async function getConfig() {
    let config = appConfig
    let host = $cache.get('alist_tvbox_host')
    if (!host) {
        host = 'http://192.168.3.6:4567/'
        config.site = host
        config.tabs = [
            {
                name: '未配置站點',
                ext: {
                    url: host,
                },
            },
        ]
    } else {
        config.site = host
        config.tabs = await getTabs(host)
    }

    return jsonify(config)
}

async function getTabs(host) {
    let list = []

    let url = host + '/vod1'

    const { data } = await $fetch.get(url)

    let allClass = argsify(data).class
    allClass.forEach((e) => {
        if (e.type_flag === 1) return
        list.push({
            name: e.type_name,
            ext: {
                url: url + `?t=${e.type_id}`,
            },
        })
    })

    return list
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { url, page = 1 } = ext

    if (url === 'http://192.168.3.6:4567/') {
        cards = [
            {
                vod_id: '-1',
                vod_name: '請在單源搜索中輸入alist_tvbox面板的URL',
                vod_pic: '',
                vod_remarks: '',
                ext: {
                    url: '',
                },
            },
            {
                vod_id: '-1',
                vod_name: '例: http://192.168.5.5:4567',
                vod_pic: '',
                vod_remarks: '',
                ext: {
                    url: '',
                },
            },
        ]
    } else {
        let host = ext.url.split('?')[0]
        let url = ext.url + `&pg=${page}`
        const { data } = await $fetch.get(url)

        argsify(data).list.forEach((e) => {
            cards.push({
                vod_id: e.vod_id,
                vod_name: e.vod_name,
                vod_pic: e.vod_pic,
                vod_remarks: e.vod_remarks,
                ext: {
                    url: `${host}?ids=${e.vod_id}`,
                },
            })
        })
    }

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let url = ext.url
    let host = ext.url.split('?')[0]
    let play = host.replace('/vod1', '/play')

    const { data } = await $fetch.get(url)

    const vod_play_url = argsify(data).list[0].vod_play_url
    const eps = vod_play_url.split('#')
    eps.forEach((e) => {
        const [name, url] = e.split('$')
        tracks.push({
            name: name,
            pan: '',
            ext: {
                url: `${play}?id=${url || name}&from=open`,
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
    let url = ext.url

    const { data } = await $fetch.get(url)

    let playUrl = argsify(data).url

    return jsonify({ urls: [playUrl] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    if (ext.text.startsWith('http')) {
        let host = ext.text
        $cache.set('alist_tvbox_host', host)
        cards = [
            {
                vod_id: '-1',
                vod_name: '已添加站點，重新進入',
                vod_pic: '',
                vod_remarks: '',
                ext: {
                    url: '',
                },
            },
        ]
    } else {
        const text = ext.text
        const page = ext.page || 1
        const host = $cache.get('alist_tvbox_host')
        const url = `${host}/vod1?wd=${text}`

        const { data } = await $fetch.get(url)

        argsify(data).list.forEach((e) => {
            const id = e.vod_id
            cards.push({
                vod_id: id,
                vod_name: e.vod_name,
                vod_pic: e.vod_pic,
                vod_remarks: e.vod_remarks,
                ext: {
                    url: `${host}/vod1?ids=${id}`,
                },
            })
        })
    }

    return jsonify({
        list: cards,
    })
}
