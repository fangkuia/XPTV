const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const cheerio = createCheerio()
let appConfig = {
	ver: 1,
	title: 'exporntoons',
	site: 'https://exporntoons.net',
	tabs: [
		{
			name: '最新',
			ui: 1,
			ext: {
				id: 'now',
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

	const url = appConfig.site + `/${id}?p=${page}`

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})
	if (data.includes('Just a moment...')) {
		$utils.openSafari(url, UA)
	}

	const $ = cheerio.load(data)

	const videos = $('.item')

	videos.each((_, e) => {
		const href = $(e).find('.item_link').attr('href')
		const title = $(e).find('.title').text().trim()
		const cover = $(e).find('.i_img img').attr('data-src')
		let obj = {
			vod_id: href,
			vod_name: title,
			vod_pic: cover,
			ui: 1,
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
	let url = ext.url
	let tracks = []

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})
	
	const playlistMatch = data.match(/window\.playlist\s*=\s*({[^;]+});/)
	if (playlistMatch && playlistMatch[1]) {
		try {
			const playlist = JSON.parse(playlistMatch[1])
			
			if (playlist.sources && Array.isArray(playlist.sources)) {
				playlist.sources.forEach(source => {
					if (source.file && source.label) {
						tracks.push({
							name: source.label + 'p',
							pan: '',
							ext: {
								url: source.file,
								type: source.type || 'mp4'
							}
						})
					}
				})
			}
			

			if (tracks.length > 0) {

				const defaultSource = playlist.sources.find(source => source.default) || playlist.sources[0]
				if (defaultSource) {
					tracks.unshift({
						name: '自动',
						pan: '',
						ext: {
							url: defaultSource.file,
							type: defaultSource.type || 'mp4'
						}
					})
				}
			}
			
		} catch (error) {
			console.error('解析playlist失败:', error)
		}
	}

	return jsonify({
		list: [
			{
				title: '视频质量',
				tracks,
			},
		],
	})
}

async function getPlayinfo(ext) {
	ext = argsify(ext)
	const url = ext.url
	const type = ext.type || 'mp4'

	return jsonify({ 
		urls: [url],
		type: type
	})
}
async function search(ext) {
	ext = argsify(ext)
	let cards = []

	let text = encodeURIComponent(ext.text)
	let page = ext.page || 1
	let url = `${appConfig.site}/video/${text}?p=${page}`
	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})
	const $ = cheerio.load(data)

	const videos = $('.item')

	videos.each((_, e) => {
		const href = $(e).find('.item_link').attr('href')
		const title = $(e).find('.title').text().trim()
		const cover = $(e).find('.i_img img').attr('data-src')
		let obj = {
			vod_id: href,
			vod_name: title,
			vod_pic: cover,
			ui: 1,
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
