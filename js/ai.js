//老登
const cheerio = createCheerio()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
  'Referer': 'https://anime.girigirilove.com/',
  'Origin': 'https://anime.girigirilove.com',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "ギリギリ动漫",
  site: "https://anime.girigirilove.com",
  tabs: [{
    name: '日番',
    ext: {
      url: 'https://anime.girigirilove.com/show/2--------{page}---/'
    },
  }, {
    name: '美番',
    ext: {
      url: 'https://anime.girigirilove.com/show/3--------{page}---/'
    },
  }, {
    name: '剧场版',
    ext: {
      url: 'https://anime.girigirilove.com/show/21--------{page}---/'
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
  url = url.replace('{page}', page)

  const { data } = await $fetch.get(url, {
    headers
  })

  const $ = cheerio.load(data)
  $('a.public-list-exp').each((_, each) => {
    cards.push({
      vod_id: $(each).attr('href'),
      vod_name: $(each).attr('title'),
      vod_pic: appConfig.site + $(each).find('img.gen-movie-img').attr('data-src'),
      vod_remarks: $(each).find('.public-list-prb').text(),
      ext: {
        url: appConfig.site + $(each).attr('href'),
      },
    })
  })

  return jsonify({
      list: cards,
  });
}

async function getTracks(ext) {
  ext = argsify(ext)
  let groups = []
  let url = ext.url

  const { data } = await $fetch.get(url, {
      headers
  })
  
  const $ = cheerio.load(data)
  let gn = []
  $('a.swiper-slide').each((_, each) => {
    gn.push($(each).text().replace(/[0-9]/g, ''))
  })

  $('div.anthology-list-box').each((i, each) => {
    let group = {
      title: gn[i],
      tracks: [],
    }
    $(each).find('li.box > a').each((_, item) => {
      group.tracks.push({
        name: $(item).text(),
        pan: '',
        ext: {
          url: appConfig.site + $(item).attr('href')
        }
      })
    })
    groups.push(group)
  })
  
  return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    const { data } = await $fetch.get(url, {
        headers
    })
    const obj = JSON.parse(data.match(/player_aaaa=(.+?)<\/script>/)[1])
    const m3u = decodeURIComponent(base64decode(obj.url))
    $print(`***m3u: ${m3u}`)
    return jsonify({ 'urls': [m3u] })
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

  const url = appConfig.site + `/search/-------------/?wd=${text}`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  const $ = cheerio.load(data)
  $('.public-list-box').each((_, each) => {
    cards.push({
      vod_id: $(each).find('a.public-list-exp').attr('href'),
      vod_name: $(each).find('.thumb-txt').text(),
      vod_pic: appConfig.site + $(each).find('img.gen-movie-img').attr('data-src'),
      vod_remarks: $(each).find('.public-list-prb').text(),
      ext: {
        url: appConfig.site + $(each).find('a.public-list-exp').attr('href'),
      },
    })
  })

  return jsonify({
      list: cards,
  })
}

function base64decode(str) {
  var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
  var c1, c2, c3, c4;
  var i, len, out;
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
