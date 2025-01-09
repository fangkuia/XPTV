const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const appConfig = {
    ver: 1,
    title: '追光影视',
    site: 'https://www.sgsd.xyz',
    tabs: [
        {
            name: '全部',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=',
            },
        },
        {
            name: '女频恋爱',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=女频恋爱',
            },
        },
        {
            name: '反转爽剧',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=反转爽剧',
            },
        },
        {
            name: '古装仙侠',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=古装仙侠',
            },
        },
        {
            name: '年代穿越',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=年代穿越',
            },
        },
        {
            name: '脑洞悬疑',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=脑洞悬疑',
            },
        },
        {
            name: '现代都市',
            ext: {
                id: '/api/movie/list?columnValue=serial&genres=现代都市',
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

    const url = appConfig.site + id +`&pageNum=${page}&pageSize=30&orderByColumn=createTime&isAsc=desc`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    
    argsify(data).rows.forEach((e) => {
        cards.push({
            vod_id: `${e.id}`, 
            vod_name: e.title,
            vod_pic: e.poster,
            vod_pubdate: e.createTime.split('T')[0], 
            ext: {
                url: `${appConfig.site}/column/serial/movie/${e.id}`,
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

    const playlist = $('.clearfix > li > a')
    playlist.each((_, e) => {
        const href = $(e).attr('href')
        const fullName = $(e).find('p').text()
        const match = fullName.match(/第(\d+)集/)
        const name = match ? `第${match[1]}集` : fullName;
              tracks.push({
                  name,
                  pan: "",
                  ext: {
                    'url': `${appConfig.site}${href}`,
                  }
              });
        });
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
    ext = argsify(ext);
    const url = ext.url;

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    });

    const match = data.match(/<a href="infuse:\/\/x-callback-url\/play\?url=(https?:\/\/[^"]+)"[^>]*>/)
    let playUrl = null; 

    if (match && match[1]) {
        playUrl = encodeURI(match[1].trim());
    }

    return jsonify({ urls: playUrl ? [playUrl] : [] })
    
}
async function search(ext) {

    ext = argsify(ext);
    let cards = [];
    const text = encodeURIComponent(ext.text);
    const page = ext.page || 1;
    const url = `${appConfig.site}/api/movie/list?title=${text}&pageNum=${page}&pageSize=30`;

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    });

    argsify(data).rows.forEach((e) => {
        cards.push({
            vod_id: `${e.id}`, 
            vod_name: e.title,
            vod_pic: e.poster,
            vod_pubdate: e.createTime.split('T')[0], 
            ext: {
                url: `${appConfig.site}/column/serial/movie/${e.id}`,
            },
        });
    });

    return jsonify({
        list: cards,
    });
}
