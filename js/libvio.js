const cheerio = createCheerio()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
  'Referer': 'https://www.libvio.cc/',
  'Origin': 'https://www.libvio.cc',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "LIBVIO",
  site: "https://www.libvio.cc",
  tabs: [{
    name: '首页',
    ext: {
      url: '/',
      hasMore: false
    },
  }, {
    name: '电影',
    ext: {
      url: '/type/1-1.html'
    },
  }, {
    name: '剧集',
    ext: {
      url: '/type/2-1.html',
    },
  }, {
    name: '动漫',
    ext: {
      url: '/type/4-1.html',
    },
  }, {
    name: '日韩剧',
    ext: {
      url: '/type/15-1.html'
    },
  }, {
    name: '欧美剧',
    ext: {
      url: '/type/16-1.html'
    },
  }]
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getCards(ext) {
  ext = argsify(ext)
  let cards = []
  let url = ext.url
  let page = ext.page || 1
  let hasMore = ext.hasMore || true

  if (!hasMore && page > 1) {
    return jsonify({
      list: cards,
    })
  }

  url = appConfig.site + url.replace('1.html', `${page}.html`)

  const { data } = await $fetch.get(url, {
    headers
  })

  const $ = cheerio.load(data)
  let vods = new Set()
  $('a.stui-vodlist__thumb').each((_, each) => {
    const path = $(each).attr('href')
    if (path.startsWith('/detail/') && !vods.has(path)) {
      vods.add(path)
      cards.push({
        vod_id: path,
        vod_name: $(each).attr('title'),
        vod_pic: $(each).attr('data-original'),
        vod_remarks: $(each).find('.text-right').text(),
        ext: {
          url: appConfig.site + path,
        },
      })
    }
  })

  return jsonify({
    list: cards,
  })
}

async function getTracks(ext) {
  const { url } = argsify(ext)
  let groups = []

  const { data } = await $fetch.get(url, {
    headers
  })
  
  const $ = cheerio.load(data)

  $('div.stui-vodlist__head').each((_, each) => {
    let title = $(each).find('.stui-pannel__head').text().trim()
    if (!title.includes('下载')) {
      let group = {
        title: title,
        tracks: []
      }
      $(each).find('.stui-content__playlist > li').each((_, item) => {
        group.tracks.push({
          name: $(item).text(),
          pan: '',
          ext: {
            url: appConfig.site + $(item).find('a').attr('href')
          }
        })
      })
      if (group.tracks.length > 0) {
        groups.push(group)
      }
    }
  })
  return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
  const { url } = argsify(ext)
  const { data } = await $fetch.get(url, {
    headers
  })
  let obj = JSON.parse(data.match(/var player_.*?=(.*?)</)[1])
  let player = obj.url
  if (player.startsWith('http')) {
    return jsonify({
      urls: [ player ],
      headers: [ headers ],
    })
  }

  const data2 = (await $fetch.get(`${appConfig.site}/vid/ty4.php?${dictToURI({url: obj.url, id: obj.id, nid: obj.nid})}`, {
    headers
  })).data
  const cdn = data2.match(/var vid = '(http.*)';/)[1]
  $print(`***cdn: ` + cdn)
  if (cdn.startsWith('http')) {
    return jsonify({
      urls: [ cdn ],
    })
  }
  return jsonify({
    urls: [],
  })
}

async function search(ext) {
  ext = argsify(ext)
  let cards = [];

  let text = encodeURIComponent(ext.text)
  let page = ext.page || 1
  if (page > 1) {
    return jsonify({
      list: cards,
    })
  }

  const url = appConfig.site + `/search/-------------.html?wd=${text}&submit=`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  const $ = cheerio.load(data)
  $('a.stui-vodlist__thumb').each((_, each) => {
    const path = $(each).attr('href')
    if (path.startsWith('/detail/')) {
      cards.push({
        vod_id: path,
        vod_name: $(each).attr('title'),
        vod_pic: $(each).attr('data-original'),
        vod_remarks: $(each).find('.text-right').text(),
        ext: {
          url: appConfig.site + path,
        },
      })
    }
  })

  return jsonify({
      list: cards,
  })
}

function dictToURI(dict) {
  var str = [];
  for(var p in dict){
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]));
  }
  return str.join("&");
}
