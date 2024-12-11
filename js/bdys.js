const cheerio = createCheerio()
const CryptoJS = createCryptoJS()
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const headers = {
  'Referer': 'https://www.xlys01.com/',
  'Origin': 'https://www.xlys01.com',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "哔滴影视",
  site: "https://www.xlys01.com",
  tabs: [{
    name: '最新电影',
    ext: {
      url: '/s/all/1?type=0',
    },
  }, {
    name: '最新剧集',
    ext: {
      url: '/s/all/1?type=1'
    },
  }, {
    name: '欧美剧集',
    ext: {
      url: '/s/meiju/1',
    },
  }, {
    name: '日韩剧集',
    ext: {
      url: '/s/hanju/1',
    },
  }, {
    name: '港台剧集',
    ext: {
      url: '/s/gangtaiju/1'
    },
  }, {
    name: '动漫',
    ext: {
      url: '/s/donghua/1?type=1'
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

  url = appConfig.site + url.replace('/1', `/${page}`)

  const { data } = await $fetch.get(url, {
    headers
  })

  const $ = cheerio.load(data)
  const t1 = $('title').text()
  if (t1 === 'Just a moment...') {
    $utils.openSafari(appConfig.site, UA)
  }
  
  $('.card-link').each((_, each) => {
    const path = $(each).find('a').attr('href')
    cards.push({
      vod_id: path,
      vod_name: $(each).find('.card-title').text(),
      vod_pic: $(each).find('img').attr('src'),
      vod_remarks: $(each).find('span.badge').text(),
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
  const $ = cheerio.load(data)
  let group = {
    title: '在线',
    tracks: []
  }
  $('a.btn').each((_, each) => {
    let path = $(each).attr('href') ?? ''
    if (path.startsWith('/play/') || path.startsWith('/guoju/play/')) {
      group.tracks.push({
        name: $(each).text(),
        pan: '',
        ext: {
          url: appConfig.site + path
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
  let pid = data.match(/var pid = (\d+);/)[1]
  let currentTimeMillis = Date.now()
  let str4 = pid + '-' + currentTimeMillis
  let md5Hash = CryptoJS.MD5(str4).toString(CryptoJS.enc.Hex)
  while (md5Hash.length < 32) {
      md5Hash = '0' + md5Hash
  }
  md5Hash = md5Hash.toLowerCase()
  let key = CryptoJS.enc.Utf8.parse(md5Hash.substring(0, 16))
  let encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(str4), key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  })
  let encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex)
  let encryptedString = encryptedHex.toUpperCase()
  let lines = appConfig.site + '/lines?t=' + currentTimeMillis + '&sg=' + encryptedString + '&pid=' + pid
  const data2 = (await $fetch.get(lines, {
    headers
  })).data
  
  if (JSON.parse(data2).data.url3) {
    let url3 = JSON.parse(data2).data.url3
    let play = url3.indexOf(',') !== -1 ? url3.split(',')[0].trim() : url3.trim()
    return jsonify({
      urls: [play],
    })
  } else if (JSON.parse(data2).data.tos) {
    let god = `${appConfig.site}/god/${pid}?type=1`
    let res = await $fetch.post(god, {
      t: currentTimeMillis,
      sg: encryptedString,
      verifyCode: 888,
    }, {
      'User-Agent': headers,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    })
    
    let playUrl = argsify(res.data).url
    return jsonify({
      urls: [playUrl],
    })
  } else {
    let god = `${appConfig.site}/god/${pid}`
    let res = await $fetch.post(god, {
      t: currentTimeMillis,
      sg: encryptedString,
      verifyCode: 666,
    }, {
      'User-Agent': headers,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    })
    
    let playUrl = argsify(res.data).url
    return jsonify({
      urls: [playUrl],
    })
  }
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

  const url = appConfig.site + `/search/${text}?code=112`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  const $ = cheerio.load(data)
  $('div.row').each((_, each) => {
    const a = $(each).find('a.search-movie-title')
    cards.push({
      vod_id: a.attr('href'),
      vod_name: a.attr('title'),
      vod_pic: $(each).find('img.object-cover').attr('src'),
      vod_remarks: '',
      ext: {
        url: appConfig.site + a.attr('href'),
      },
    })
  })

  return jsonify({
      list: cards,
  })
}
