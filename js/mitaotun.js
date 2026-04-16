// 蜜桃臀 XPTV 源
// 網站: https://mitaotunbbx.xyz
// 類型: HTML 抓取

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SITE = 'https://mitaotunbbx.xyz';

// 分類 ID 對照表
const CATEGORIES = {
  'guochan': { id: 'ff80808172b90a110172b90dca6c0013', name: '國產情色' },
  'ripen': { id: 'ff80808172b90a110172b90dca830017', name: '日本無碼' },
  'riyou': { id: 'ff80808172b90a110172b90dca8d001b', name: '日本有碼' },
  'zhongwen': { id: 'ff80808172b90a110172b90dca97001e', name: '中文精品' },
  'wanghong': { id: 'ff80808172b90a110172b90dcaa00021', name: '網紅主播' },
  'chengren': { id: 'ff80808172b90a110172b90dcaaa0024', name: '成人動漫' },
  'oumei': { id: 'ff80808172b90a110172b90dcab30027', name: '歐美情色' },
  'guomosi': { id: 'ff80808172b90a110172b90dcabb002a', name: '國模私拍' },
  'changtui': { id: 'ff80808172b90a110172b90dcac7002d', name: '長腿絲襪' },
  'linjia': { id: 'ff80808172b90a110172b90dcace0030', name: '鄰家人妻' },
  'jingpin': { id: 'ff80808172b90a110172b90dcae80038', name: '精品推薦' },
  'wuma': { id: '20230202101612431', name: '無碼熱門' },
  'madou': { id: '20230202101613064', name: '麻豆專區' },
};

const HEADERS = {
  'User-Agent': UA,
  'Referer': SITE + '/'
};

async function getLocalInfo() {
  return jsonify({
    ver: 1,
    name: '蜜桃臀',
    api: 'csp_mitaotun',
    type: 3
  });
}

async function getConfig() {
  return jsonify({
    ver: 1,
    title: '蜜桃臀',
    site: SITE,
    tabs: [
      { name: '國產情色', ext: { id: 'guochan' }, ui: 1 },
      { name: '日本無碼', ext: { id: 'ripen' }, ui: 1 },
      { name: '日本有碼', ext: { id: 'riyou' }, ui: 1 },
      { name: '中文精品', ext: { id: 'zhongwen' }, ui: 1 },
      { name: '網紅主播', ext: { id: 'wanghong' }, ui: 1 },
      { name: '成人動漫', ext: { id: 'chengren' }, ui: 1 },
      { name: '歐美情色', ext: { id: 'oumei' }, ui: 1 },
      { name: '國模私拍', ext: { id: 'guomosi' }, ui: 1 },
      { name: '長腿絲襪', ext: { id: 'changtui' }, ui: 1 },
      { name: '鄰家人妻', ext: { id: 'linjia' }, ui: 1 },
      { name: '精品推薦', ext: { id: 'jingpin' }, ui: 1 },
      { name: '無碼熱門', ext: { id: 'wuma' }, ui: 1 },
      { name: '麻豆專區', ext: { id: 'madou' }, ui: 1 },
    ]
  });
}

async function getCards(ext) {
  ext = argsify(ext);
  const { id, page = 1 } = ext;
  
  const cat = CATEGORIES[id];
  if (!cat) return jsonify({ list: [], page });
  
  let url;
  if (page == 1) {
    url = `${SITE}/list/${cat.id}.html`;
  } else {
    url = `${SITE}/list/${cat.id}/${page}.html`;
  }
  
  const { data } = await $fetch.get(url, { headers: HEADERS });
  const cheerio = createCheerio();
  const $ = cheerio.load(data);
  
  const list = [];
  $('li.col-md-2').each((i, el) => {
    const $el = $(el);
    const $a = $el.find('a.video-pic');
    const href = $a.attr('href') || '';
    const style = $a.attr('style') || '';
    const title = $el.find('.title h5 a').first().attr('title') || $el.find('.title h5 a').first().text().trim();
    
    // 提取封面圖片
    const picMatch = style.match(/url\('([^']+)'\)/);
    const pic = picMatch ? picMatch[1] : '';
    
    // 提取 ID
    const idMatch = href.match(/\/detail\/(\d+)\.html/);
    const detailId = idMatch ? idMatch[1] : '';
    
    if (detailId && title) {
      list.push({
        vod_id: detailId,
        vod_name: title.trim(),
        vod_pic: pic,
        ext: { id: detailId }
      });
    }
  });
  
  return jsonify({ list, page });
}

async function getTracks(ext) {
  ext = argsify(ext);
  const { id } = ext;
  
  const url = `${SITE}/detail/${id}.html`;
  const { data } = await $fetch.get(url, { headers: HEADERS });
  const cheerio = createCheerio();
  const $ = cheerio.load(data);
  
  const tracks = [];
  
  // 提取播放地址按鈕
  $('button.button a').each((i, el) => {
    const $a = $(el);
    const name = $a.text().trim() || `播放地址${i + 1}`;
    const href = $a.attr('href') || '';
    
    if (href) {
      const playUrl = href.startsWith('http') ? href : SITE + href;
      tracks.push({
        name: name,
        ext: { url: playUrl, id: id }
      });
    }
  });
  
  // 如果沒有找到播放按鈕，添加一個默認的
  if (tracks.length === 0) {
    tracks.push({
      name: '播放',
      ext: { url: `${SITE}/vodplay/${id}.html`, id: id }
    });
  }
  
  return jsonify({
    list: [{
      title: '播放線路',
      tracks: tracks
    }]
  });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  const { url, id } = ext;
  
  try {
    // 如果直接傳入的是 m3u8 連結
    if (url && url.includes('.m3u8')) {
      return jsonify({
        urls: [url],
        headers: [HEADERS]
      });
    }
    
    // 從播放頁提取 m3u8
    const playUrl = url || `${SITE}/vodplay/${id}.html`;
    const { data } = await $fetch.get(playUrl, { headers: HEADERS });
    
    // 提取 var playUrl = '...'
    const playUrlMatch = data.match(/var\s+playUrl\s*=\s*'([^']+)'/);
    if (playUrlMatch && playUrlMatch[1]) {
      return jsonify({
        urls: [playUrlMatch[1]],
        headers: [HEADERS]
      });
    }
    
    // 嘗試其他格式
    const urlMatch = data.match(/https?:\/\/[^'"]+\.m3u8[^'"]*/);
    if (urlMatch) {
      return jsonify({
        urls: [urlMatch[0]],
        headers: [HEADERS]
      });
    }
    
  } catch (e) {
    console.error('getPlayinfo error:', e);
  }
  
  return jsonify({ urls: [] });
}

async function search(ext) {
  ext = argsify(ext);
  const { text, wd, page = 1 } = ext;
  const keyword = text || wd || '';
  
  if (!keyword) return jsonify({ list: [], page });
  
  const url = `${SITE}/search/${encodeURIComponent(keyword)}.html`;
  
  try {
    const { data } = await $fetch.get(url, { headers: HEADERS });
    const cheerio = createCheerio();
    const $ = cheerio.load(data);
    
    const list = [];
    $('li.col-md-2').each((i, el) => {
      const $el = $(el);
      const $a = $el.find('a.video-pic');
      const href = $a.attr('href') || '';
      const style = $a.attr('style') || '';
      const title = $el.find('.title h5 a').first().attr('title') || $el.find('.title h5 a').first().text().trim();
      
      const picMatch = style.match(/url\('([^']+)'\)/);
      const pic = picMatch ? picMatch[1] : '';
      
      const idMatch = href.match(/\/detail\/(\d+)\.html/);
      const detailId = idMatch ? idMatch[1] : '';
      
      if (detailId && title) {
        list.push({
          vod_id: detailId,
          vod_name: title.trim(),
          vod_pic: pic,
          ext: { id: detailId }
        });
      }
    });
    
    return jsonify({ list, page });
  } catch (e) {
    console.error('search error:', e);
    return jsonify({ list: [], page });
  }
}
