//来自群友'Qi Qi'
const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'

const appConfig = {
	ver: 1,
	title: '观影网',
	site: 'https://www.gying.org',
	tabs: [
		{
			name: '电影',
			ext: {
				id: '/mv/------',
			},
		},
		{
			name: '剧集',
			ext: {
				id: '/tv/------',
			},
		},
		{
			name: '动漫',
			ext: {
				id: '/ac/------',
			},
		}
		
	],
}
async function getConfig() {
	return jsonify(appConfig)
}

async function getCards(ext) {
	ext = argsify(ext)
	let cards = []
	let { page = 1, id } = ext
	const url =appConfig.site + id + page
	const { data } = await $fetch.get(url, {
    headers: {
		"User-Agent": UA,
  	  },
});
	const $ = cheerio.load(data)
	const t1 = $('p.error').text()
	  if ($('p.error').length > 0) { 
		$utils.openSafari(appConfig.site, UA);
	  }
	
	const scriptContent = $('script').filter((_, script) => {
			return $(script).html().includes('_obj.header');
		}).html();

		const jsonStart = scriptContent.indexOf('{');
		const jsonEnd = scriptContent.lastIndexOf('}') + 1;
		const jsonString = scriptContent.slice(jsonStart, jsonEnd);

		const inlistMatch = jsonString.match(/_obj\.inlist=({.*});/);
		if (!inlistMatch) {
		$utils.toastError("未找到 _obj.inlist 数据");
		} else {
	
		const inlistData = JSON.parse(inlistMatch[1]);
	
		inlistData["i"].forEach((item,index)=>{
	  
	  	cards.push({
				  vod_id: item,
				  vod_name: inlistData["t"][index],
				  vod_pic: `https://s.tutu.pm/img/${inlistData["ty"]}/${item}.webp`,
				  vod_remarks: inlistData["g"][index], 
				  ext: {
					  url: `https://www.gyg.la/res/downurl/${inlistData["ty"]}/${item}`,
				  },
			  })
	})	
}
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
	 const respstr =JSON.parse(data)

	 if(respstr.hasOwnProperty('panlist')){

     respstr.panlist.url.forEach((item, index) => {
			tracks.push({
				name:'网盘',
				pan: item,
				ext: {
					url: '',
				},
			})
		})
   }else if(respstr.hasOwnProperty('file')){

   $utils.toastError('网盘验证掉签')
   }else{

	$utils.toastError('没有网盘资源');
	
}
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
	ext = argsify(ext)
	const url = ext.url
   	  
	return jsonify({ urls: [ext.url] })
}

async function search(ext) {
	ext = argsify(ext)
	

	let text = encodeURIComponent(ext.text)
	let page = ext.page || 1
	let url = `${appConfig.site}/s/1---${page}/${text}`

	const { data } = await $fetch.get(url, {
	   headers: {
	"User-Agent": UA,
    	},
	})

	const $ = cheerio.load(data)
let cards = []
   $('.v5d').each((index, element) => {
   const name = $(element).find('b').text().trim() || 'N/A';
   const imgUrl = $(element).find('picture source[data-srcset]').attr('data-srcset') || 'N/A';
  
  	const additionalInfo = $(element).find('p').text().trim() || 'N/A';

  	const pathMatch =  $(element).find('a').attr('href') || 'N/A'
		cards.push({
			vod_id: pathMatch,
			vod_name: name,
			vod_pic: imgUrl,
			vod_remarks: additionalInfo,

			ext: {
				url: `${appConfig.site}/res/downurl${pathMatch}`,
			},
		})
});
	return jsonify({
		list: cards,
	})
}
