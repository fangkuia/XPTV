const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const appConfig = {
	ver: 1,
	title: 'star2',
	site: 'https://1.star2.cn',
	tabs: [
		{
			name: '電影',
			ext: {
				id: 'mv',
			},
		},
		{
			name: '国劇',
			ext: {
				id: 'ju',
			},
		},
		{
			name: '外劇',
			ext: {
				id: 'wj',
			},
		},
		{
			name: '韩日',
			ext: {
				id: 'rh',
			},
		},
		{
			name: '英美',
			ext: {
				id: 'ym',
			},
		},
		{
			name: '短劇',
			ext: {
				id: 'dj',
			},
		},
		{
			name: '動漫',
			ext: {
				id: 'dm',
			},
		},
		{
			name: '綜藝',
			ext: {
				id: 'zy',
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

	const url = appConfig.site + `/${id}_${page}`
	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})

	const $ = cheerio.load(data)

	const videos = $('div.a')
	videos.each((_, e) => {
		const href = $(e).find('a.main').attr('href')
		const title = $(e).find('a.main').text()
		const match1 = title.match(/\.(.*?)$/);
		const remarks = match1 && match1[1] ? match1[1] : ''; 
		const match = title.match(/】(.*?)\./);
		const dramaName = match && match[1] ? match[1] : title; 
		cards.push({
			vod_id: href,
			vod_name: dramaName,
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

	const playlist = $('.dlipp-cont-bd')
	playlist.each((_, e) => {
		const panShareUrl = $(e).find('a').attr('href')
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
	let url = `${appConfig.site}/search/?keyword=${text}&page=${page}`

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})

	const $ = cheerio.load(data)
	
	const videos = $('div.a')
	videos.each((_, e) => {
		const href = $(e).find('a.main').attr('href')
		const title = $(e).find('a.main').text()
		const match1 = title.match(/\.(.*?)$/);
		const remarks = match1 && match1[1] ? match1[1] : ''; 
		const match = title.match(/】(.*?)\./);
		const dramaName = match && match[1] ? match[1] : title; 
		cards.push({
			vod_id: href,
			vod_name: dramaName,
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
