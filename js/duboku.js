//老登
const cheerio = createCheerio()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
  'Referer': 'https://tv.gboku.com/',
  'Origin': 'https://tv.gboku.com',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "独播库",
  site: "https://tv.gboku.com",
  tabs: [{
    name: '首页',
    ext: {
      url: '/',
      hasMore: false
    },
  }, {
    name: '电影',
    ext: {
      url: '/vodtype/1-1.html'
    },
  }, {
    name: '连续剧',
    ext: {
      url: '/vodtype/2-1.html',
    },
  }, {
    name: '综艺',
    ext: {
      url: '/vodtype/3-1.html',
    },
  }, {
    name: '动漫',
    ext: {
      url: '/vodtype/4-1.html'
    },
  }, {
    name: '港剧',
    ext: {
      url: '/vodtype/20-1.html'
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
  $('.myui-vodlist__box > a').each((_, each) => {
    const path = $(each).attr('href')
    if (path.startsWith('/voddetail/') && !vods.has(path)) {
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

  let group = {
    title: '在线',
    tracks: []
  }

  $('#playlist1 a').each((_, each) => {
    const p = $(each).attr('href')
    if (p.startsWith('/vodplay/')) {
      group.tracks.push({
        name: $(each).text(),
        pan: '',
        ext: {
          url: appConfig.site + p
        }
      })
    }
  })

  groups.push(group)

  return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
  const { url } = argsify(ext)
  const { data } = await $fetch.get(url, {
    headers
  })
  let obj = JSON.parse(data.match(/var player_.*?=(.*?)</)[1])
  let player = obj.url
  if (obj.encrypt == 1) {
    player = decodeURIComponent(player)
  } else if (obj.encrypt == 2) {
    player = decodeURIComponent(base64decode(player))
    const data2 = (await $fetch.get(`${appConfig.site}/static/player/vidjs25.php`, {
      headers
    })).data
    const sign = data2.match(/var encodedRkey = encodeURIComponent\('(.*)'\);/)[1]
    player = `${player}?sign=${encodeURIComponent(sign)}`
  } else if (obj.encrypt == 3) {
    player = player.substring(8, player.length)
    player = base64decode(player)
    player = player.substring(8, (player.length) - 8)
  }
  return jsonify({
    urls: [ player ],
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

  const url = appConfig.site + `/vodsearch/-------------.html?wd=${text}&submit=`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  const $ = cheerio.load(data)
  $('a.myui-vodlist__thumb').each((_, each) => {
    const path = $(each).attr('href')
    if (path.startsWith('/voddetail/')) {
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

function base64decode(str) {
  let base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
  let c1, c2, c3, c4;
  let i, len, out;
  len = str.length;
  i = 0;
  out = "";
  while (i < len) {
    do {
      c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
    } while (i < len && c1 == -1);
    if (c1 == -1)
      break;
    do {
      c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
    } while (i < len && c2 == -1);
    if (c2 == -1)
      break;
    out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
    do {
      c3 = str.charCodeAt(i++) & 0xff;
      if (c3 == 61)
        return out;
      c3 = base64DecodeChars[c3]
    } while (i < len && c3 == -1);
    if (c3 == -1)
      break;
    out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
    do {
      c4 = str.charCodeAt(i++) & 0xff;
      if (c4 == 61)
        return out;
      c4 = base64DecodeChars[c4]
    } while (i < len && c4 == -1);
    if (c4 == -1)
      break;
    out += String.fromCharCode(((c3 & 0x03) << 6) | c4)
  }
  return out
}
