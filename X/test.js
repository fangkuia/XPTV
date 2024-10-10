
/*
{
  "follows": [
    {"name": "徐雅","code": "@e_seoa"}, 
    {"name": "陈一发儿", "code": "@chenyifaer"}
  ]
}
*/
let $config = argsify($config_str)

let appConfig = {
    ver: 1,
    title: '油管',
    site: 'https://www.youtube.com',
}

async function getConfig() {
  let tabs = []
  $config.follows.forEach( each => {
    tabs.push({
      name: each.name,
      ext: {
        code: each.code,
      }
    })
  })
  return jsonify({
      ver: 1,
      title: '油管',
      site: 'https://www.youtube.com',
      tabs
  })
}

async function getCards(ext) {
  ext = argsify(ext)
  code = ext.code
  const url = `https://www.youtube.com/${code}/streams`
  const headers = {
    Origin: 'https://www.youtube.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  }
  const { data } = await $fetch.get(url, {
    headers
  });
  $print(`***url: ${url}`)
  // $print(data)
  let matches = data.match(/var ytInitialData = (.*)}}};/);
  let jsdata = matches[1] + '}}}'
  let parsedResponse = JSON.parse(jsdata);
  let items = parsedResponse.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content.richGridRenderer.contents
  let cards = []
  items.forEach( each => {
    if (each.richItemRenderer != undefined) {
      cards.push({
        vod_id: each.richItemRenderer.content.videoRenderer.videoId,
        vod_name: each.richItemRenderer.content.videoRenderer.title.runs[0].text,
        vod_pic: each.richItemRenderer.content.videoRenderer.thumbnail.thumbnails.at(-1).url,
        vod_remarks: '',
        ext: {
          id: each.richItemRenderer.content.videoRenderer.videoId
        }
      })
    }
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
  const apiKey = 'AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc'
  const headers = {
    'X-YouTube-Client-Name': '5',
    'X-YouTube-Client-Version': '19.09.3',
    Origin: 'https://www.youtube.com',
    'User-Agent': 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
    'content-type': 'application/json'
  }

  const b = {
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '19.09.3',
        deviceModel: 'iPhone14,3',
        userAgent: 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
        hl: 'en',
        timeZone: 'UTC',
        utcOffsetMinutes: 0
      }
    },
    videoId,
    playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } },
    contentCheckOk: true,
    racyCheckOk: true
  }

  const { data } = await $fetch.post(`https://www.youtube.com/youtubei/v1/player?key${apiKey}&prettyPrint=false`, JSON.stringify(b), {
    headers
  })

  let playurl = argsify(data).streamingData.hlsManifestUrl
  $print(`***playurl: ${playurl}`)
  return jsonify({ urls: [playurl] })
}

async function search(ext) {
    return jsonify({
        list: [],
    })
}
