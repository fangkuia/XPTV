const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const cheerio = createCheerio()
let appConfig = {
	ver: 1,
	title: 'spankbang',
	site: 'https://jp.spankbang.com',
	tabs: [
		{
			name: '最新',
			ui: 1,
			ext: {
				id: 'new_videos',
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

	const url = appConfig.site + `/${id}/${page}`

	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})
	if (data.includes('Just a moment...')) {
		$utils.openSafari(url, UA)
	}

	const $ = cheerio.load(data)

	const videos = $('.video-item')

	videos.each((_, e) => {
		const href = $(e).find('a.thumb').attr('href')
		const title = $(e).find('img.cover').attr('alt')
		const cover = $(e).find('img.cover').attr('data-src')
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
	
	// 从script标签中提取stream_data信息
	const streamDataMatch = data.match(/var stream_data\s*=\s*({[^;]+});/)
	if (streamDataMatch && streamDataMatch[1]) {
		try {
			// 将单引号转换为双引号以便JSON解析
			const jsonString = streamDataMatch[1].replace(/'/g, '"')
			const streamData = JSON.parse(jsonString)
			
			// 处理不同分辨率的视频源
			const qualityOrder = ['240p', '320p', '480p', '720p', '1080p', '4k']
			
			qualityOrder.forEach(quality => {
				if (streamData[quality] && Array.isArray(streamData[quality]) && streamData[quality].length > 0) {
					const videoUrl = streamData[quality][0]
					tracks.push({
						name: quality.toUpperCase(),
						pan: '',
						ext: {
							url: videoUrl,
							type: 'mp4'
						}
					})
				}
			})
			
			// 处理m3u8格式的流
			if (streamData.m3u8 && streamData.m3u8.length > 0) {
				tracks.push({
					name: 'M3U8 (自适应)',
					pan: '',
					ext: {
						url: streamData.m3u8[0],
						type: 'm3u8'
					}
				})
			}
			
			if (tracks.length > 0) {
				let defaultUrl = ''
				let defaultType = 'mp4'
				
				if (streamData.main && streamData.main.length > 0) {
					defaultUrl = streamData.main[0]
				} else if (tracks.length > 0) {
					defaultUrl = tracks[0].ext.url
					defaultType = tracks[0].ext.type
				}
				
				if (defaultUrl) {
					tracks.unshift({
						name: '自动',
						pan: '',
						ext: {
							url: defaultUrl,
							type: defaultType
						}
					})
				}
			}
			
		} catch (error) {
			// 静默处理错误
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
	let url = `${appConfig.site}/s/${text}/${page}/`
	const { data } = await $fetch.get(url, {
		headers: {
			'User-Agent': UA,
		},
	})
	const $ = cheerio.load(data)

	const videos = $('.js-video-item') 

	videos.each((_, e) => {
    const href = $(e).find('a[href*="/video/"]').attr('href')
    
    const title = $(e).find('img').attr('alt')
    
    const cover = $(e).find('img').attr('data-src') || $(e).find('img').attr('src')
    
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
