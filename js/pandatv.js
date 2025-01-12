const headers = {
  'Referer': 'https://m.pandalive.co.kr/',
  'Origin': 'https://m.pandalive.co.kr',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
};

let appConfig = {
  ver: 1,
  title: 'pandatv',
  site: 'https://m.pandalive.co.kr',
  tabs: [
    {
      name: '最热',
      ui: 1,
      ext: {
        orderBy: 'hot',
        onlyNewBj: 'N',
      },
    },
    {
      name: '最新',
      ui: 1,
      ext: {
        orderBy: 'new',
        onlyNewBj: 'N',
      },
    },
    {
      name: '顺序',
      ui: 1,
      ext: {
        orderBy: 'user',
        onlyNewBj: 'N',
      },
    },
    {
      name: '新BJ',
      ui: 1,
      ext: {
        orderBy: 'user',
        onlyNewBj: 'Y',
      },
    },
  ],
};

async function getConfig() {
  return jsonify(appConfig);
}

async function getCards(ext) {
  ext = argsify(ext);
  let cards = [];
  let { orderBy, onlyNewBj ,page = 1 } = ext;
  let url = `${appConfig.site.replace('m', 'api')}/v1/live`;
  let offset = 0;
  let limit = 80;

  if (page > 1) {
    offset = 75 + (page - 2) * 20;
    limit = 25;
  }

  const body = {
    offset: offset,
    limit: limit,
    orderBy: orderBy,
    onlyNewBj: onlyNewBj,
  };

  const { data } = await $fetch.post(url, body, {
    headers: headers,
  });

  argsify(data).list.forEach((e) => {
    let koreaTime = new Date(e.startTime.replace(' ', 'T'));
    koreaTime.setHours(koreaTime.getHours() + 7);
    let beijingTime = koreaTime.toISOString().replace('T', ' ').slice(0, 19);
    cards.push({
      vod_id: e.userIdx.toString(),
      vod_name: e.title,
      vod_pic: e.thumbUrl,
      vod_remarks: e.sizeHeight + 'P',
      vod_pubdate: beijingTime,
      vod_duration: e.userNick,
      ext: {
        userId: e.userId,
      },
    });
  });

  return jsonify({
    list: cards,
  });
}

async function getTracks(ext) {
  ext = argsify(ext);
  let tracks = [];
  let url = `${appConfig.site.replace('m', 'api')}/v1/live/play`;
  let userId = ext.userId;

  const body = {
    action: 'watch',
    userId: userId,
    password: '',
    shareLinkType: '',
  };

  const { data } = await $fetch.post(url, body, {
    headers: headers,
  });

  const sourceurl = argsify(data).PlayList.hls[0].url + '&player_version=1.22.0';

  const {data: data2} = await $fetch.get(sourceurl, {
    headers: headers,
  });
  
  data2.split('#EXT-X-MEDIA:').slice(1).map(m3u => {
    const name = m3u.match(/NAME="(.*?)"/)[1];
    const link = m3u.match(/https?:\/\/[^\s]+\.m3u8/)[0];
    tracks.push({
      name: name,
      ext: {
        playurl: link,
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
  });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  let playurl = ext.playurl;
  return jsonify({
    urls: [playurl],
    headers: [headers]
  });
}

async function search(ext) {
  ext = argsify(ext);
  let cards = [];
  const text = ext.text;
  const page = ext.page || 1;
  let url = `${appConfig.site.replace('m', 'api')}/v1/live`;
  let offset = 0;
  let limit = 80;

  if (page > 1) {
    offset = 75 + (page - 2) * 20;
    limit = 25;
  }

  const body = {
    offset: offset,
    limit: limit,
    orderBy: 'user',
    searchVal: text,
  };

  const { data } = await $fetch.post(url, body, {
    headers: headers,
  });

  argsify(data).list.forEach((e) => {
    let koreaTime = new Date(e.startTime.replace(' ', 'T'));
    koreaTime.setHours(koreaTime.getHours() + 7);
    let beijingTime = koreaTime.toISOString().replace('T', ' ').slice(0, 19);
    cards.push({
      vod_id: e.userIdx.toString(),
      vod_name: e.title,
      vod_pic: e.thumbUrl,
      vod_remarks: e.sizeHeight + 'P',
      vod_pubdate: beijingTime,
      vod_duration: e.userNick,
      ext: {
        userId: e.userId,
      },
    });
  });

  return jsonify({
    list: cards,
  });
}