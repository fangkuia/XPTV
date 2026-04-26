const CryptoJS = createCryptoJS();
const cheerio = createCheerio();

const appConfig = {
    ver: 1,
    title: 'LIBVIO',
    site: 'https://www.libvios.com', // 改这里：从 libvio.cc 改成 libvio.la
    tabs: [
        { name: '首页', ext: { url: '/', hasMore: false } },
        { name: '电影', ext: { url: '/type/1-1.html' } },
        { name: '剧集', ext: { url: '/type/2-1.html' } },
        { name: '动漫', ext: { url: '/type/4-1.html' } },
        { name: '日韩剧', ext: { url: '/type/15-1.html' } },
        { name: '欧美剧', ext: { url: '/type/16-1.html' } },
    ],
};
const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const headers = {
    Referer: `${appConfig.site}/`,
    Origin: appConfig.site,
    'User-Agent': UA,
};

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext);
    let cards = [];
    let url = ext.url;
    let page = ext.page || 1;
    ext.hasMore || true;

    url = appConfig.site + url.replace('1.html', `${page}.html`);

    const { data } = await $fetch.get(url, {
        headers,
    });

    const $ = cheerio.load(data);
    let vods = new Set();
    $('a.stui-vodlist__thumb').each((_, each) => {
        const path = $(each).attr('href');
        if (path.startsWith('/detail/') && !vods.has(path)) {
            vods.add(path);
            cards.push({
                vod_id: path,
                vod_name: $(each).attr('title'),
                vod_pic: $(each).attr('data-original'),
                vod_remarks: $(each).find('.text-right').text(),
                ext: {
                    url: appConfig.site + path,
                },
            });
        }
    });

    return jsonify({
        list: cards,
    })
}

// getTracks 改成这样（兼容新结构）：
async function getTracks(ext) {
    const { url } = argsify(ext);
    let groups = [];
    const { data } = await $fetch.get(url, { headers });
    const $ = cheerio.load(data);

    // 方式1: 从 playlist-panel 抓播放列表
    $('div.playlist-panel').each((_, panel) => {
        const $panel = $(panel);
        const title = $panel.find('.panel-head h3').text().trim();
        if (!title || title.includes('猜你喜欢')) return
        if (title.includes('下载')) return

        let group = { title, tracks: [] };
        $panel.find('.stui-content__playlist li').each((_, item) => {
            const a = $(item).find('a');
            group.tracks.push({
                name: a.text().trim(),
                pan: '',
                ext: { url: appConfig.site + a.attr('href') },
            });
        });
        if (group.tracks.length > 0) groups.push(group);
    });

    // 方式2: 如果没有 playlist-panel，从立即播放按钮抓
    if (groups.length === 0) {
        const playBtn = $('a[href^="/play/"]').attr('href');
        if (playBtn) {
            groups.push({
                title: '立即播放',
                tracks: [{ name: '第1集', pan: '', ext: { url: appConfig.site + playBtn } }],
            });
        }
    }

    // 网盘下载
    $('div.netdisk-panel, div.playlist-panel.netdisk-panel').each((_, panel) => {
        const $panel = $(panel);
        const title = $panel.find('.panel-head h3').text().trim();
        if (!title || !title.includes('下载')) return
        $panel.find('.netdisk-list a').each((_, item) => {
            const a = $(item);
            groups.push({
                title: title,
                tracks: [{ name: a.find('.netdisk-name').text().trim() || '合集', pan: a.attr('href') }],
            });
        });
    });

    return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    ext = argsify(ext);
    const { url, pan } = ext;

    if (pan) {
        return jsonify({ urls: [pan] })
    }

    if (url) {
        try {
            const { data } = await $fetch.get(url, { headers });
            const match = data.match(/var player_.*?=(.*?)</);
            if (match) {
                const obj = JSON.parse(match[1]);
                let playerUrl = obj.url;

                if (obj.encrypt === '1') {
                    playerUrl = unescape(playerUrl);
                } else if (obj.encrypt === '2') {
                    playerUrl = unescape(CryptoJS.enc.Base64.parse(playerUrl).toString(CryptoJS.enc.Utf8));
                } else if (obj.encrypt === '3') {
                    playerUrl = CryptoJS.enc.Base64.parse(playerUrl).toString(CryptoJS.enc.Utf8);
                }

                if (playerUrl.startsWith('http')) {
                    return jsonify({ urls: [playerUrl], headers: [headers] })
                } else {
                    const ty_new = `${appConfig.site}/vid/ty4.php?url=${playerUrl}&next=${obj.link_next}&id=${obj.id}&nid=1`;
                    const { data: tyData } = await $fetch.get(ty_new, { headers });
                    const parseUrlMatch = tyData.match(/var\s+PARSE_URL\s*=\s*['"]([^'"]+)['"]/);
                    if (!parseUrlMatch) return jsonify({ urls: [] })
                    const parseUrl = parseUrlMatch[1];

                    // PARSE_BODY is JS syntax: JSON.stringify({url: '...'})
                    // Extract the url value and build proper JSON
                    const bodyUrlMatch = tyData.match(
                        /var\s+PARSE_BODY\s*=\s*JSON\.stringify\(\s*\{url:\s*['"]([^'"]+)['"]\s*\}\s*\)/,
                    );
                    if (!bodyUrlMatch) return jsonify({ urls: [] })
                    const postBody = JSON.stringify({ url: bodyUrlMatch[1] });

                    // Retry up to 6 times (server may need time to process)
                    const MAX_RETRY = 6;
                    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
                        try {
                            const { data: parseData } = await $fetch.post(appConfig.site + parseUrl, postBody, {
                                headers: {
                                    Referer: ty_new,
                                    Origin: appConfig.site,
                                    'User-Agent': UA,
                                    'Content-Type': 'application/json',
                                    'sec-fetch-mode': 'cors',
                                    'sec-fetch-site': 'same-origin',
                                    'sec-fetch-dest': 'empty',
                                },
                            });
                            const parsed = argsify(parseData);
                            if (parsed.url) {
                                return jsonify({ urls: [parsed.url], headers: [headers] })
                            }
                            if (parsed.fatal === true) break
                        } catch (e) {
                            console.log(`parse attempt ${attempt + 1} error: ${e.message}`);
                        }
                        // Wait 2s before retry
                        await new Promise((r) => setTimeout(r, 2000));
                    }
                }
            }
        } catch (e) {
            console.log('getPlayinfo error: ' + e.message);
        }
    }
    return jsonify({ urls: [] })
}

async function search(ext) {
    ext = argsify(ext);
    let cards = [];

    let text = encodeURIComponent(ext.text);
    let page = ext.page || 1;
    if (page > 1) {
        return jsonify({
            list: cards,
        })
    }

    const url = appConfig.site + `/search/-------------.html?wd=${text}&submit=`;
    const { data } = await $fetch.get(url, {
        headers,
    });

    const $ = cheerio.load(data);
    $('a.stui-vodlist__thumb').each((_, each) => {
        const path = $(each).attr('href');
        if (path.startsWith('/detail/')) {
            cards.push({
                vod_id: path,
                vod_name: $(each).attr('title'),
                vod_pic: $(each).attr('data-original'),
                vod_remarks: $(each).find('.text-right').text(),
                ext: {
                    url: appConfig.site + path,
                },
            });
        }
    });

    return jsonify({
        list: cards,
    })
}

