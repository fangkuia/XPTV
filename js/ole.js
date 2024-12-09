const cheerio = createCheerio()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
  'Referer': 'https://www.olehdtv.com/',
  'Origin': 'https://www.olehdtv.com',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "欧乐影院",
  site: "https://www.olehdtv.com",
  tabs: [{
    name: '首页',
    ext: {
      url: '/index.php',
      hasMore: false
    },
  }, {
    name: '电影',
    ext: {
      url: '/index.php/vod/show/id/1.html'
    },
  }, {
    name: '电视剧',
    ext: {
      url: '/index.php/vod/show/id/2.html',
    },
  }, {
    name: '综艺',
    ext: {
      url: '/index.php/vod/show/id/3.html',
    },
  }, {
    name: '动漫',
    ext: {
      url: '/index.php/vod/show/id/4.html'
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

  if (page > 1) {
    url = appConfig.site + url.replace('.html', `/page/${page}.html`)
  } else {
    url = appConfig.site + url
  }

  const { data } = await $fetch.get(url, {
    headers
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
  })
}

async function getTracks(ext) {
  const { url } = argsify(ext)
  let groups = []

  const { data } = await $fetch.get(url, {
    headers
  })
  
  $print('***data: ' + data)
  const $ = cheerio.load(data)
  let group = {
    title: '在线',
    tracks: []
  }
  $('.content_playlist.list_scroll > li > a').each((_, each) => {
    group.tracks.push({
      name: $(each).text(),
      pan: '',
      ext: {
        url: appConfig.site + $(each).attr('href')
      }
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
    headers
  })
  const obj = JSON.parse(data.match(/player_aaaa=(.+?)<\/script>/)[1])
  const m3u = obj.url 
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

  const url = appConfig.site + `/index.php/vod/search.html?wd=${text}&submit=`
  const { data } = await $fetch.get(url, {
    headers
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

function dictToURI(dict) {
  var str = [];
  for(var p in dict){
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]));
  }
  return str.join("&");
}
