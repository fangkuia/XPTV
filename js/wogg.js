const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'

const appConfig = {
	ver: 1,
	title: '玩偶哥哥',
	site: 'https://www.wogg.one',

	tabs: [
		{
			name: '电影',
			ext: {
				id: '1',
			},
		},
		{
			name: '剧集',
			ext: {
				id: '2',
			},
		},
		{
			name: '臻彩视界',
			ext: {
				id: '44',
			},
		},
		{
			name: '动漫',
			ext: {
				id: '3',
			},
		},
		{
			name: '综艺',
			ext: {
				id: '4',
			},
		},
		{
			name: '短剧',
			ext: {
				id: '6',
			},
		},
		{
			name: '音乐',
			ext: {
				id: '5',
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

	const url = appConfig.site + `/vodshow/${id}--------${page}---.html`

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})

	const $ = cheerio.load(data)
  
  const t1 = $('title').text()
  if (t1 === 'Just a moment...') {
    $utils.openSafari(appConfig.site, UA)
  }

	const videos = $('.module-item')
	videos.each((_, e) => {
		const href = $(e).find('.module-item-pic a').attr('href')
		const title = $(e).find('.module-item-pic img').attr('alt')
		const cover = $(e).find('.module-item-pic img').attr('data-src')
		const text = $(e).find('.module-item-text').eq(0).text()
		//const lb = $(e).find('.module-item-caption span').eq(1).text().replace('玩偶', '')
		const dq = $(e).find('.module-item-caption span').eq(2).text().replace(/中国大陆|中国中国大陆/, '国产').replace('中国香港', '港剧').replace('中国台湾', '台剧')
		
		const remarks = (`${dq} ${text}`).trim()
		let obj = {
			vod_id: href,
			vod_name: title,
			vod_pic: cover,
			vod_remarks: remarks,

			ext: {
				url: `${appConfig.site}${href}`,
			},
		}

		cards.push(obj)
	})

	return jsonify({
		list: cards,
	})
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

	const playlist = $('.module-row-title')
	playlist.each((_, e) => {
		const name = $(e).find('h4').text().replace(' - 玩偶哥哥', '')
		const panShareUrl = $(e).find('p').text()
		
		tracks.push({
			name: name,
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
	let url = `${appConfig.site}/vodsearch/${text}----------${page}---.html`

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})

	const $ = cheerio.load(data)

	const videos = $('.module-search-item')
	videos.each((_, e) => {
		const href = $(e).find('.video-serial').attr('href')
		const title = $(e).find('.lazyload').attr('alt')
		const cover = $(e).find('.lazyload').attr('data-src')
		const remarks = $(e).find('.video-serial').text()
		cards.push({
			vod_id: href,
			vod_name: title,
			vod_pic: cover,
			vod_remarks: remarks,

			ext: {
				url: `${appConfig.site}${href}`,
			},
		})
	})
	return jsonify({
		list: cards,
	})
}
