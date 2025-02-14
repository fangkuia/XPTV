const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const appConfig = {
	ver: 1,
	title: '虎斑',
	site: 'http://103.45.162.207:20720',
	tabs: [
		{
			name: '電影',
			ext: {
				id: 1,
			},
		},
		{
			name: '劇集',
			ext: {
				id: 2,
			},
		},
		{
			name: '動漫',
			ext: {
				id: 4,
			},
		},
		{
			name: '綜藝',
			ext: {
				id: 3,
			},
		},
		{
			name: '短劇',
			ext: {
				id: 6,
			},
		},
		{
			name: '精片',
			ext: {
				id: 5,
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

	const url = appConfig.site + `/index.php/vod/show/id/${id}/page/${page}.html`
	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})

	const $ = cheerio.load(data)

	const videos = $('#main .module-item')
	videos.each((_, e) => {
		const href = $(e).find('.module-item-pic a').attr('href')
		const title = $(e).find('.module-item-pic a').attr('title')
		const cover = $(e).find('.module-item-pic img').attr('data-src')
		const remarks = $(e).find('.module-item-text').text()
		
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

	const playlist = $('.module-player-list .module-row-one')
	playlist.each((_, e) => {
		const panShareUrl = $(e).find('.module-row-title p').text()
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
	let url = `${appConfig.site}/index.php/vod/search/page/${page}/wd/${text}.html`

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})

	const $ = cheerio.load(data)

	const videos = $('#main .module-search-item')
	videos.each((_, e) => {
		const href = $(e).find('.video-info-header h3 a').attr('href')
		const title = $(e).find('.video-info-header h3 a').attr('title')
		const cover = $(e).find('.module-item-pic img').attr('data-src')
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
