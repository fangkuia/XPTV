const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const cheerio = createCheerio()

const appConfig = {
  ver: 1,
  title: '小盘盘',
  site: 'https://xpanpan.site',
  tabs: [
          {
              name: '影视',
              ext: {
                  id: 'video-tv-list',
              },
          },
          {
              name: '动漫',
              ext: {
                id: 'cartoon-list',
              },
          },
          {
              name: '阿里',
              ext: {
                id: 'ali-yun-pan-list',
              },
          },
          {
              name: '夸克',
              ext: {
                id: 'kua-ke-wang-pan-list',
              },
          },
          {
              name: 'UC',
              ext: {
                id: 'uc-wang-pan-list',
              },
          },
      ],
  }

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { page = 1, id } = ext

    const url = appConfig.site + `/category/${id}/page/${page}`

    const { data } = await $fetch.get(url, {
        headers: {
          'Referer': 'https://xpanpan.site/',
          'User-Agent': UA,
        }
    });

    const $ = cheerio.load(data);
    const t1 = $('title').text()
    if (t1 === 'Just a moment...') {
      $utils.openSafari(appConfig.site, UA)
    }

    $('.bloglo-entry-content-wrapper').each((index, each) => {
        
    const href = $(each).find('.entry-title a').attr('href');
    const title = $(each).find('.entry-title a').text().trim().replace(/\s+/g, ' ');
    const tags = $(each).find('.cat-links a');
      
    const tagTexts = tags.map((i, tag) => $(tag).text()).get(); 
    if (!tagTexts.some(tag => /影视天地|动漫资源/.test(tag))) return; 
    
      const tagArray = [];
      tags.each((i, tag) => {
        const tagText = $(tag).text()
          .replace('夸克网盘', '夸克')
          .replace('阿里云盘', '阿里')
          .replace('UC网盘', 'UC')
          .replace(/移动云盘|迅雷云盘|百度网盘|电子书海|学习资源|影视天地|动漫资源/, ''); 
        tagArray.push(tagText); 
        });
        
        const combinedTags = tagArray.join(' '); 
    
      cards.push({
        vod_id: href,
        vod_name: title,
        vod_pic: '',
        vod_remarks: combinedTags,
        ext: {
          url: href,
        },
      });
    });

    return jsonify({
        list: cards,
    });
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let url = ext.url

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const playlist = $('.wp-block-list a')
    playlist.each((_, e) => {
        const panShareUrl = $(e).attr('href')
        tracks.push({
            name: '网盘',
            pan: panShareUrl,
        })
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
    return jsonify({ urls: [] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/page/${page}?s=${text}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })


    const $ = cheerio.load(data);

$('.bloglo-entry-content-wrapper').each((index, each) => {
        
    const href = $(each).find('.entry-title a').attr('href');
    const title = $(each).find('.entry-title a').text().trim().replace(/\s+/g, ' ');
    const tags = $(each).find('.cat-links a');
      
    const tagTexts = tags.map((i, tag) => $(tag).text()).get(); 
    if (!tagTexts.some(tag => /影视天地|动漫资源/.test(tag))) return; 
    
      const tagArray = [];
      tags.each((i, tag) => {
        const tagText = $(tag).text()
          .replace('夸克网盘', '夸克')
          .replace('阿里云盘', '阿里')
          .replace('UC网盘', 'UC')
          .replace(/移动云盘|迅雷云盘|百度网盘|电子书海|学习资源|影视天地|动漫资源/, ''); 
        tagArray.push(tagText); 
        });
        
        const combinedTags = tagArray.join(' '); 
    
      cards.push({
        vod_id: href,
        vod_name: title,
        vod_pic: '',
        vod_remarks: combinedTags,
        ext: {
          url: href,
        },
      });
    });
    return jsonify({
        list: cards,
    })
}
