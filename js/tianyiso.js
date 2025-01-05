const cheerio = createCheerio()
const CryptoJS = createCryptoJS()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

const headers = {
  'Referer': 'https://www.tianyiso.com/',
  'Origin': 'https://www.tianyiso.com',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "天逸搜",
  site: "https://www.tianyiso.com",
  tabs: [{
    name: '只有搜索功能',
    ext: {
      url: '/'
    },
  }]
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getCards(ext) {
  ext = argsify(ext)
  let cards = []
  return jsonify({
    list: cards,
  })
}

async function getTracks(ext) {
  const { url } = argsify(ext)
  const { data } = await $fetch.get(url, {
    headers
  })
  let pan = data.match(/"(https:\/\/cloud\.189\.cn\/t\/.*)",/)[1]
  return jsonify({ 
    list: [{
      title: '在线',
      tracks: [{
        name: '网盘',
        pan,
      }]
    }]
  })
}

async function getPlayinfo(ext) {
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

  const url = appConfig.site + `/search?k=${text}`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  const $ = cheerio.load(data)
  $('a').each((_, each) => {
    const path = $(each).attr('href') ?? ''
    if (path.startsWith('/s/')) {
      cards.push({
        vod_id: path,
        vod_name: $(each).find('template').first().text().trim(),
        vod_pic: '',
        vod_remarks: '',
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
