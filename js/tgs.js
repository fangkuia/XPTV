//来自群友“tou tie”
const cheerio = createCheerio()
/*
{	
	"channels": [
		"QuarkFree",
		"ucpanpan",
	]
}
*/
let $config = argsify($config_str)
const UA = 'MOBILE_UA'
let appConfig = {
	ver: 1,
	title: 'tg搜索',
	site: 'https://t.me/s/',
	tabs: [{
		name: '只能搜索',
		ext: {
			id: '',
		},
	}]
}

async function getConfig() {
	let config = appConfig
	return jsonify(config)
}

async function getCards() {
	return jsonify({
		list: [],
	})
}

async function getTracks(ext) {
	ext = argsify(ext)
	let tracks = []
	let urls = ext.url
	urls.forEach(url => {
		tracks.push({
			name: '网盘',
			pan: url,
		})
	})
	return jsonify({
		list: [
			{
				title: '默认分组',
				tracks,
			}
		],
	})
}

async function getPlayinfo(ext) {
	return jsonify({ urls: [] })
}

async function search(ext) {
    ext = argsify(ext);
    let cards = [];
    let page = ext.page || 1;
    if (page > 1) {
        return jsonify({
            list: [],
        });
    }
    let text = encodeURIComponent(ext.text);

    for (const channel of $config.channels) {
        let url = `${appConfig.site}${channel}?q=${text}`;
        const { data } = await $fetch.get(url, {
            headers: {
                "User-Agent": UA,
            },
        });
        const $ = cheerio.load(data);
        if ($('div.tgme_widget_message_bubble').length === 0) continue;
        $('div.tgme_widget_message_bubble').each((_, element) => {
            let nameHtml = $(element).find('.tgme_widget_message_text').html();
            const title = nameHtml.split('<br>')[0].replace(/<b[^>]*>|<\/b>|<a[^>]*>|<\/a>|<mark[^>]*>|<\/mark>/g, '').replace(/【[^】]*】/g, '').trim();
            nameHtml = title; 
            let hrefs = [];
            $(element).find('.tgme_widget_message_text > a').each((_, element) => {
                const href = $(element).attr('href');
                if (href.includes('t.me')) return;
                hrefs.push(href);
            });
            const cover = $(element)
                .find('.tgme_widget_message_photo_wrap')
                .attr('style')
                .match(/image\:url\('(.+)'\)/)[1];
            cards.push({
                vod_id: hrefs[0],
                vod_name: title,
                vod_pic: cover,
                vod_remarks: '',
                ext: {
                    url: hrefs,
                },
            });
        });
    }
    return jsonify({
        list: cards,
    });
}
