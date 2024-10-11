/*
{
  "follows": [
    {"name": "bilibili 大会员", "uid": "233233"}, 
    {"name": "bilibili 官方账号", "uid": "1"} 
  ]
}
*/
let $config = argsify($config_str)

let appConfig = {
    ver: 1,
    title: 'Bilibili',
    site: 'https://www.bilibili.com',
}

async function getConfig() {
  let tabs = []
  $config.follows.forEach( each => {
    tabs.push({
      name: each.name,
      ext: {
        uid: each.uid,
      }
    })
  })
  return jsonify({
      ver: 1,
      title: 'Bilibili',
      site: 'https://www.bilibili.com',
      tabs
  })
}

async function getCards(ext) {
  ext = argsify(ext)
  uid = ext.uid
  const url = `https://api.bilibili.com/x/space/arc/search?mid=${uid}&ps=30&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp`
  const headers = {
    Origin: 'https://www.bilibili.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  }
  const { data } = await $fetch.get(url, {
    headers
  });
  $print(`***url: ${url}`)
  let cards = []
  data.data.list.vlist.forEach( each => {
    cards.push({
      vod_id: each.aid,
      vod_name: each.title,
      vod_pic: each.pic,
      vod_remarks: '',
      ext: {
        id: each.aid
      }
    })
  })

  return jsonify({
      list: cards,
  })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    tracks.push({
      name: '播放',
      pan: '',
      ext
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
  let videoId = ext.id
  $print(`***id: ${videoId}`)
  const headers = {
    'Referer': 'https://www.bilibili.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  }

  const { data } = await $fetch.get(`https://api.bilibili.com/x/player/playurl?avid=${videoId}&cid=${videoId}&qn=80`, {
    headers
  })

  let playurl = data.data.durl[0].url
  $print(`***playurl: ${playurl}`)
  return jsonify({ urls: [playurl] })
}

async function search(ext) {
    return jsonify({
        list: [],
    })
}
