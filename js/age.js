//老登
const cheerio = createCheerio()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
  'Referer': 'https://m.agedm.org/',
  'Origin': 'https://m.agedm.org',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "AGE",
  site: "https://m.agedm.org/#/",
  tabs: [{
    name: '最近更新',
    ext: {
      id: 0,
    },
  }]
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
  ext = argsify(ext)
  let cards = []
  let id = ext.id
  let page = ext.page || 1

  const url = `https://api.agedm.org/v2/catalog?genre=all&label=all&letter=all&order=time&region=all&resource=all&season=all&status=all&year=all&size=20&page=${page}`

  const { data } = await $fetch.get(url, {
    headers
  })
  
  argsify(data).videos?.forEach( each => {
    cards.push({
      vod_id: `${each.id}`,
      vod_name: each.name,
      vod_pic: each.cover,
      vod_remarks: each.uptodate,
      ext: {
        url: `https://api.agedm.org/v2/detail/${each.id}`,
      },
    });
  })

  return jsonify({
      list: cards,
  });
}

async function getTracks(ext) {
  ext = argsify(ext)
  let groups = []
  let url = ext.url

  // 发送请求
  const { data } = await $fetch.get(url, {
      headers
  });
  
  const json = argsify(data)
  const player_label_arr = json.player_label_arr
  const playlists = json.video.playlists
  const vip = json.player_jx.vip
  const zj = json.player_jx.zj
  const player_vip = json.player_vip

  for (var key in playlists) {
    if (!key.includes('m3u8')){
      continue
    }
    let v = playlists[key]
    let group = {
      title: player_label_arr[key],
      tracks: [],
    }
    v.forEach( each => {
      if (each.length == 2) {
        let path = `${zj}${each[1]}`
        if (player_vip.hasOwnProperty(key)) {
          path = `${vip}${each[1]}`
        }
        group.tracks.push({
          name: each[0],
          pan: '',
          ext: {
            url: path
          }
        })
      }
    })
    if (group.tracks.length > 0) {
      groups.push(group)
    }
  }
  
  return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    const { data } = await $fetch.get(url, {
        headers
    })
    const m3u = data.match(/Vurl = '(.+?)'/)[1]
    return jsonify({ 'urls': [m3u] })
}

async function search(ext) {
  ext = argsify(ext)
  let cards = [];

  let text = encodeURIComponent(ext.text)
  let page = ext.page || 1

  const url = `https://api.agedm.org/v2/search?query=${text}&page=${page}`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  argsify(data).data?.videos?.forEach( each => {
    cards.push({
      vod_id: `${each.id}`,
      vod_name: each.name,
      vod_pic: each.cover,
      vod_remarks: each.uptodate,
      ext: {
        url: `https://api.agedm.org/v2/detail/${each.id}`,
      },
    });
  })

  return jsonify({
      list: cards,
  });
}
