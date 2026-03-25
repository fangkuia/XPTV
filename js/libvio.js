const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = {
  'Referer': 'https://www.libvio.la/',
  'Origin': 'https://www.libvio.la',
  'User-Agent': UA,
}
const appConfig = {
  ver: 1,
  title: 'LIBVIO',
  site: 'https://www.libvio.la',  // 改这里：从 libvio.cc 改成 libvio.la
  tabs: [
    { name: '首页', ext: { url: '/', hasMore: false } },
    { name: '电影', ext: { url: '/type/1-1.html' } },
    { name: '剧集', ext: { url: '/type/2-1.html' } },
    { name: '动漫', ext: { url: '/type/4-1.html' } },
    { name: '日韩剧', ext: { url: '/type/15-1.html' } },
    { name: '欧美剧', ext: { url: '/type/16-1.html' } },
  ],
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
        headers,
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

// getTracks 改成这样（兼容新结构）：
async function getTracks(ext) {
  const { url } = argsify(ext)
  let groups = []
  const { data } = await $fetch.get(url, { headers })
  const $ = cheerio.load(data)
  
  // 方式1: 从 playlist-panel 抓播放列表
  $('div.playlist-panel').each((_, panel) => {
    const $panel = $(panel)
    const title = $panel.find('.panel-head h3').text().trim()
    if (!title || title.includes('猜你喜欢')) return
    if (title.includes('下载')) return
    
    let group = { title, tracks: [] }
    $panel.find('.stui-content__playlist li').each((_, item) => {
      const a = $(item).find('a')
      group.tracks.push({
        name: a.text().trim(),
        pan: '',
        ext: { url: appConfig.site + a.attr('href') },
      })
    })
    if (group.tracks.length > 0) groups.push(group)
  })
  
  // 方式2: 如果没有 playlist-panel，从立即播放按钮抓
  if (groups.length === 0) {
    const playBtn = $('a[href^="/play/"]').attr('href')
    if (playBtn) {
      groups.push({
        title: '立即播放',
        tracks: [{ name: '第1集', pan: '', ext: { url: appConfig.site + playBtn } }],
      })
    }
  }
  
  // 网盘下载
  $('div.netdisk-panel, div.playlist-panel.netdisk-panel').each((_, panel) => {
    const $panel = $(panel)
    const title = $panel.find('.panel-head h3').text().trim()
    if (!title || !title.includes('下载')) return
    $panel.find('.netdisk-list a').each((_, item) => {
      const a = $(item)
      groups.push({
        title: title,
        tracks: [{ name: a.find('.netdisk-name').text().trim() || '合集', pan: a.attr('href') }],
      })
    })
  })
  
  return jsonify({ list: groups })
}

// getPlayinfo 改成这样（加 encrypt=3 处理）：
async function getPlayinfo(ext) {
  ext = argsify(ext)
  const { url, pan } = ext
  
  if (pan) {
    return jsonify({ urls: [pan] })
  }
  
  if (url) {
    try {
      const { data } = await $fetch.get(url, { headers })
      const match = data.match(/var player_.*?=(.*?)</)
      if (match) {
        const obj = JSON.parse(match[1])
        let playerUrl = obj.url
        
        if (obj.encrypt === '1') {
          playerUrl = unescape(playerUrl)
        } else if (obj.encrypt === '2') {
          playerUrl = unescape(base64decode(playerUrl))
        } else if (obj.encrypt === '3') {  // base64
          playerUrl = base64decode(playerUrl)
        }
        
        if (playerUrl.startsWith('http')) {
          return jsonify({ urls: [playerUrl], headers: [headers] })
        }
      }
    } catch (e) {
      $print('getPlayinfo error: ' + e.message)
    }
  }
  return jsonify({ urls: [] })
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

    const url = appConfig.site + `/search/-------------.html?wd=${text}&submit=`
    const { data } = await $fetch.get(url, {
        headers,
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
    var str = []
    for (var p in dict) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(dict[p]))
    }
    return str.join('&')
}
