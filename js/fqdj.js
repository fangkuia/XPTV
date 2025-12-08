const CryptoJS = createCryptoJS();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36';

let appConfig = {
  ver: 20251207,
  title: '红果短剧',
  site: 'https://fanqienovel.com/#短剧',
  tabs: [
    {
      id: '1',
      name: '热剧',
      ext: {
        item: "videoseries_hot"
      }
    },
    {
      id: '2',
      name: '新剧',
      ext: {
        item: 'firstonlinetime_new'
      }
    },
    {
      id: '3',
      name: '逆袭',
      ext: {
        item: 'cate_739',
      }
    },
    {
      id: '4',
      name: '总裁',
      ext: {
        item: 'cate_29',
      }
    },
    {
      id: '5',
      name: '现言',
      ext: {
        item: 'cate_3',
      }
    },
    {
      id: '6',
      name: '打脸',
      ext: {
        item: 'cate_1051',
      }
    },
    {
      id: '7',
      name: '马甲',
      ext: {
        item: 'cate_266',
      }
    },
    {
      id: '8',
      name: '豪门',
      ext: {
        item: 'cate_1053',
      }
    },
    {
      id: '9',
      name: '都市',
      ext: {
        item: 'cate_261',
      }
    },
    {
      id: '10',
      name: '神豪',
      ext: {
        item: 'cate_20',
      }
    }
  ],
};

async function getConfig() {
  return jsonify(appConfig)
}

async function getCards(ext) {
  ext = argsify(ext);
  let cards = [];
  let selected_items = ext.item;
  let session_id = getSessionId();
  let offset = ((ext.page || 1) - 1) * 20;
  const offsetStr = offset > 0 ? `&offset=${offset}` : '';

  try {
    const url = `https://reading.snssdk.com/reading/bookapi/bookmall/cell/change/v?change_type=0&selected_items=${selected_items}&tab_type=8&cell_id=6952850996422770718&version_tag=video_feed_refactor&device_id=1423244030195267&aid=1967&app_name=novelapp&ssmix=a&session_id=${session_id}${offsetStr}`;
    const { data } = await $fetch.get(url, {
      headers: {
        'User-Agent': UA
      }
    });

    argsify(data).data.cell_view.cell_data.forEach((e) => {
      cards.push({
        vod_id: e.video_data[0].series_id,
        vod_name: e.video_data[0].title,
        vod_pic: e.video_data[0].cover,
        vod_remarks: getSubTitle(e.video_data[0].sub_title),
        ext: {
          id: e.video_data[0].series_id,
        },
      });
    });

    return jsonify({
      list: cards,
    })
  } catch (error) {
    $print(error);
  }
}

async function getTracks(ext) {
  ext = argsify(ext);
  let tracks = [];
  let id = ext.id;
  let url = `https://fq.skybook.qzz.io/fq/catalog`;
  const { data } = await $fetch.get(`${url}?book_id=${id}`);

  argsify(data).data.item_data_list.forEach((e, i) => {
    tracks.push({
      name: e.title,
      pan: '',
      ext: {
        index: i,
        item_id: e.item_id
      },
    });
  });

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
  ext = argsify(ext);
  let url = `https://fq.skybook.qzz.io/fq/video`;
  let playUrl = '';
  try {
    let item_id = ext.item_id;
    const { data } = await $fetch.get(`${url}?item_ids=${item_id}`);
    let url2 = argsify(data).data[item_id].video_model;
    playUrl = base64Decode(JSON.parse(url2).video_list.video_1.main_url);
    return jsonify({ urls: [playUrl] })
  } catch (error) {
    $print(error);
  }
}

async function search(ext) {
  ext = argsify(ext);
  let cards = [];
  const text = encodeURIComponent(ext.text);
  const page = ext.page || 1;
  if (page > 1) return
  const url = `https://fq.skybook.qzz.io/fq/search?query=${text}&tab_type=11`;
  const { data } = await $fetch.get(url, {
    headers: {
      "User-Agent": UA
    }
  });
  argsify(data).search_tabs.forEach((t) => {
    try {
      if (t.title != "短剧") return
    } catch (e) {
      return
    }

    t.data.forEach((e) => {
      cards.push({
        vod_id: `${e.video_data[0].series_id}`,
        vod_name: e.video_data[0].title,
        vod_pic: e.video_data[0].cover || '',
        vod_remarks: getSubTitle(e.video_data[0].sub_title || ''),
        ext: {
          id: `${e.video_data[0].series_id}`,
        },
      });
    });
  });

  return jsonify({
    list: cards,
  })
}

function getSessionId(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());

  return `${y}${m}${d}${hh}${mm}`;
}

function base64Decode(text) {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text))
}

function getSubTitle(sub_title) {
  let a = sub_title.split('·');
  return sub_title = a.length <= 2 ? sub_title : a.slice(-2).join('·')
}

