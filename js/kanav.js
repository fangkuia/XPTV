//来自“夢”
const cheerio = createCheerio();
const CryptoJS = createCryptoJS();

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X)AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1';

let appConfig = {
  ver: 1,
  title: 'KanAV',
  site: 'https://kanav.info',
  tabs: [
    {
      name: '中文字幕',
      ui: 1,
      ext: {
        id: 1,
      },
    },
    {
      name: '日韩有码',
      ui: 1,
      ext: {
        id: 2,
      },
    },
    {
      name: '日韩无码',
      ui: 1,
      ext: {
        id: 3,
      },
    },
    {
      name: '国产AV',
      ui: 1,
      ext: {
        id: 4,
      },
    },
    {
      name: '自拍泄密',
      ui: 1,
      ext: {
        id: 30,
      },
    },
    {
      name: '探花约炮',
      ui: 1,
      ext: {
        id: 31,
      },
    },
    {
      name: '主播录制',
      ui: 1,
      ext: {
        id: 32,
      },
    },
    {
      name: '动漫番剧',
      ui: 1,
      ext: {
        id: 20,
      },
    },
  ],
};

async function getConfig() {
  return JSON.stringify(appConfig);
}

async function getCards(ext) {
  let cards = [];
  let { id, page = 1 } = JSON.parse(ext);

  let url = `${appConfig.site}/index.php/vod/type/id/${id}/page/${page}.html`;

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  });

  const $ = cheerio.load(data);

  $('.post-list .col-md-3').each((_, element) => {
    const videoItem = $(element).find('.video-item');
    const entryTitle = $(element).find('.entry-title');
    const vodUrl = entryTitle.find('a').attr('href');
    const vodPic = videoItem.find('.featured-content-image a img').attr('data-original');
    const vodName = entryTitle.find('a').text().trim();
    const remark = videoItem.find('span.model-view-left').text().trim();
    const duration = videoItem.find('span.model-view').text().trim();
    const fullText = entryTitle.text().trim();
    const pubdate = fullText.replace(vodName, '').trim();

    cards.push({
      vod_id: vodUrl,
      vod_name: vodName,
      vod_pic: vodPic,
      vod_remarks: remark,
      vod_duration: duration,
      vod_pubdate: pubdate,
      ext: {
        url: `${appConfig.site}${vodUrl}`,
      },
    });
  });

  return JSON.stringify({
    list: cards,
  });
}

async function getTracks(ext) {
  let list = [];
  let url = JSON.parse(ext).url;

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  });

  let tracks = [];
  list = [
    {
      title: '默认分组',
      tracks,
    },
  ];

  const $ = cheerio.load(data);
  const player = $('script:contains(player_aaaa)')
    .text()
    .replace('var player_aaaa=', '');
  const encodedUrl = JSON.parse(player).url;
  const base64Decoded = CryptoJS.enc.Base64.parse(encodedUrl).toString(CryptoJS.enc.Utf8);
  const decodedUrl = decodeURIComponent(base64Decoded);

  tracks.push({
    name: '播放',
    ext: {
      url: decodedUrl,
    },
  });

  return JSON.stringify({
    list: list,
  });
}

async function getPlayinfo(ext) {
  const playUrl = JSON.parse(ext).url;

  return JSON.stringify({ urls: [playUrl] });
}

async function search(ext) {
  ext = JSON.parse(ext);
  let cards = [];

  let text = encodeURIComponent(ext.text);
  let page = ext.page || 1;
  let url = `${appConfig.site}/index.php/vod/search/by/time_add/page/${page}/wd/${text}.html`;

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  });

  const $ = cheerio.load(data);

  $('.post-list .col-md-3').each((_, element) => {
    const videoItem = $(element).find('.video-item');
    const entryTitle = $(element).find('.entry-title');
    const vodUrl = entryTitle.find('a').attr('href');
    const vodPic = videoItem.find('.featured-content-image a img').attr('data-original');
    const vodName = entryTitle.find('a').text().trim();
    const remark = videoItem.find('span.model-view-left').text().trim();
    const duration = videoItem.find('span.model-view').text().trim();
    const fullText = entryTitle.text().trim();
    const pubdate = fullText.replace(vodName, '').trim();

    cards.push({
      vod_id: vodUrl,
      vod_name: vodName,
      vod_pic: vodPic,
      vod_remarks: remark,
      vod_duration: duration,
      vod_pubdate: pubdate,
      ext: {
        url: `${appConfig.site}${vodUrl}`,
      },
    });
  });

  return JSON.stringify({
    list: cards,
  });
}
