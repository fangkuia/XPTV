// 引入所需的库
const cheerio = createCheerio(); // 用于解析 HTML 的库
const CryptoJS = createCryptoJS(); // 用于加密和解密的库

// 设置用户代理字符串，模拟浏览器请求
let UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

// 应用配置，包括版本、标题和网站链接
let appConfig = {
    ver: 1,
    title: '哔哩哔哩',
    site: 'https://www.bilibili.com',
};

// 获取应用的配置，包括推荐、热门和订阅标签
async function getConfig() {
    let tabs = [
        {
            name: '推荐', // 标签名称
            ext: {
                code: '',
                type: 'home', // 类型为首页
            },
        },
        {
            name: '热门', // 标签名称
            ext: {
                code: '',
                type: 'hot', // 类型为热门
            },
        },
        {
            name: '订阅', // 标签名称
            ext: {
                code: '',
                type: 'follow', // 类型为订阅
            },
        },
    ];

    // 返回配置的 JSON 对象
    return jsonify({
        ver: 1,
        title: '哔哩哔哩',
        site: 'https://www.bilibili.com',
        tabs,
    });
}

// 根据类型获取视频卡片
async function getCards(ext) {
    ext = argsify(ext); // 解析传入的参数
    let { type } = ext; // 获取类型
    type = type.toLowerCase(); // 转换为小写

    let cards = []; // 存储视频卡片的数组
    switch (type) {
        case 'home':
            cards = await parseHomeVideos(); // 获取首页视频
            break;
        case 'hot':
            cards = await parseTrendingVideos(); // 获取热门视频
            break;
        case 'follow':
            cards = await parseFollowVideos(); // 获取订阅视频
            break;
        default:
            break;
    }

    // 返回视频卡片的 JSON 对象
    return jsonify({
        list: cards,
    });
}

// 解析首页视频
async function parseHomeVideos() {
    let cards = []; // 存储视频卡片的数组
    const url = 'https://www.bilibili.com/'; // 哔哩哔哩首页链接
    const { data } = await $fetch.get(url, { // 发送 GET 请求获取首页数据
        headers: {
            'User-Agent': UA, // 设置用户代理
        },
    });

    const $ = cheerio.load(data); // 使用 cheerio 加载返回的 HTML 数据
    // 遍历每个视频卡片
    $('.container_is-version8').each((index, element) => {
        const videoLink = $(element).find('a').attr('href'); // 假设视频链接在 <a> 标签中
        const videoId = videoLink.match(/video\/(BV\w+)/)[1]; 
        const title = $(element).find('.title').text(); // 获取视频标题
        const thumbnail = $(element).find('.img').attr('src'); // 获取视频缩略图链接
        const remarks = $(element).find('span.bili-video-card__info--date').text()
        // 将视频信息推入卡片数组
        cards.push({
            vod_id: videoId,
            vod_name: title,
            vod_pic: thumbnail,
            vod_remarks: remarks, // 备注信息（可根据需要填充）
            ext: {
                id: videoId, // 扩展信息，包含视频 ID
            },
        });
    });

    return cards; // 返回视频卡片数组
}

// 解析热门视频
async function parseTrendingVideos() {
    let cards = []; // 存储视频卡片的数组
    const url = 'https://www.bilibili.com/v/popular/all'; // 哔哩哔哩热门视频链接
    const { data } = await $fetch.get(url, { // 发送 GET 请求获取热门视频数据
        headers: {
            'User-Agent': UA, // 设置用户代理
        },
    });

    const $ = cheerio.load(data); // 使用 cheerio 加载返回的 HTML 数据
    // 遍历每个热门视频项
    $('.video-card').each((index, element) => {
        const videoLink = $(element).find('a').attr('href'); // 假设视频链接在 <a> 标签中
        const videoId = videoLink.match(/video\/(BV\w+)/)[1];
        const title = $(element).find('.title').text(); // 获取视频标题
        const thumbnail = $(element).find('.img').attr('src'); // 获取视频缩略图链接
        const remarks = $(element).find('span.bili-video-card__info--date').text()
    // 将视频信息推入卡片数组
            cards.push({
                vod_id: videoId, // 视频 ID
                vod_name: title, // 视频标题
                vod_pic: thumbnail, // 视频缩略图链接
                vod_remarks: remarks, // 备注信息（可根据需要填充）
                ext: {
                    id: videoId, // 扩展信息，包含视频 ID
                },
            });
        });
    
        return cards; // 返回热门视频卡片数组
    }
    
    // 解析用户订阅的视频
    async function parseFollowVideos() {
        let cards = []; // 存储视频卡片的数组
        // 这里可以实现获取用户订阅的视频
        // 需要用户登录并获取相应的 cookie
        // 由于涉及用户隐私和登录状态，这里暂时返回空数组
        return cards; // 返回空数组，表示没有获取到订阅视频
    }
    
    // 其他功能可以根据需要添加，例如搜索视频、获取视频详情等
    
    
    // 示例：搜索视频的函数
    async function searchVideos(query) {
        const url = `https://search.bilibili.com/all?keyword=${encodeURIComponent(query)}`; // 搜索链接
        const { data } = await $fetch.get(url, { // 发送 GET 请求获取搜索结果
            headers: {
                'User-Agent': UA, // 设置用户代理
            },
        });
    
        const $ = cheerio.load(data); // 使用 cheerio 加载返回的 HTML 数据
        let cards = []; // 存储搜索结果的数组
    
        // 遍历搜索结果
        $('.video-list_row').each((index, element) => {
            const videoLink = $(element).find('a').attr('href'); // 假设视频链接在 <a> 标签中
            const videoId = videoLink.match(/video\/(BV\w+)/)[1];
            const title = $(element).find('.title').text(); // 获取视频标题
            const thumbnail = $(element).find('.img').attr('src'); // 获取视频缩略图链接
            const remarks = $(element).find('span.bili-video-card__info--date').text()
            // 将视频信息推入搜索结果数组
            cards.push({
                vod_id: videoId,
                vod_name: title,
                vod_pic: thumbnail,
                vod_remarks: remarks, // 备注信息（可根据需要填充）
                ext: {
                    id: videoId, // 扩展信息，包含视频 ID
                },
            });
        });
    
        return jsonify({ // 返回搜索结果的 JSON 对象
            list: cards,
        });
    }

