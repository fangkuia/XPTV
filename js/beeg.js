//来自“John Smith”
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const API_BASE = 'https://store.externulls.com'

const CHANNELS = [
    { name: 'Blacked', slug: 'blacked' },
    { name: 'Vixen', slug: 'vixencom' },
    { name: 'Team Skeet', slug: 'teamskeet' },
    { name: 'Teen Mega World', slug: 'teenmegaworld' },
    { name: 'Nubiles', slug: 'nubilesporn' },
    { name: 'Wow Girls', slug: 'wowgirls' },
    { name: 'Bratty Sis', slug: 'brattysis' },
    { name: 'Adult Time', slug: 'adulttime' },
    { name: 'Family Strokes', slug: 'familystrokes' },
    { name: 'Ultra Films', slug: 'ultrafilms' },
    { name: 'Nubile Films', slug: 'nubilefilms' },
    { name: 'LetsDoeIt', slug: 'letsdoeit' },
    { name: 'Family XXX', slug: 'familyxxx' },
    { name: 'Tiny 4K', slug: 'tiny4k' },
    { name: 'New Sensations', slug: 'newsensations' },
    { name: 'Naughty America', slug: 'naughtyamerica' },
    { name: 'Sis Loves Me', slug: 'sislovesme' },
    { name: 'Pure Taboo', slug: 'puretaboo' },
    { name: 'Step Siblings Caught', slug: 'stepsiblingscaught' },
    { name: 'Moms Teach Sex', slug: 'momsteachsex' },
    { name: 'Hot Wife XXX', slug: 'hotwifexxx' },
    { name: 'Porn Force', slug: 'pornforce' },
    { name: 'Dorcel Club', slug: 'dorcelclub' },
    { name: 'Vixen Plus', slug: 'vixenplus' },
    { name: 'My Family Pies', slug: 'myfamilypies' },
    { name: "My Friend's Hot Mom", slug: 'myfriendshotmom' },
    { name: 'Bare Back Studios', slug: 'barebackstudios' },
    { name: 'NF Busty', slug: 'nfbusty' },
    { name: 'Passion HD', slug: 'passionhd' },
    { name: '21 Naturals', slug: '21naturals' },
    { name: 'Teen Fidelity', slug: 'teenfidelity' },
    { name: 'Tushy', slug: 'tushy' },
    { name: 'Porn World', slug: 'pornworld' },
    { name: 'Cum 4K', slug: 'cum4k' },
    { name: 'My Pervy Family', slug: 'mypervyfamily' },
    { name: 'Porn Fidelity', slug: 'pornfidelity' },
    { name: 'NVG', slug: 'nvg' },
    { name: 'Exploited College Girls', slug: 'exploitedcollegegirls' },
    { name: 'Deeper', slug: 'deeperofficial' },
    { name: 'Bellesa Plus', slug: 'bellesaplus' },
    { name: 'Princess Cum', slug: 'princesscum' },
    { name: 'White Boxxx', slug: 'whiteboxxx' },
    { name: 'Pure Mature', slug: 'puremature' },
    { name: 'Perv Mom', slug: 'pervmom' },
    { name: 'Blacked Raw', slug: 'blackedraw' },
    { name: 'Mom Wants to Breed', slug: 'momwantstobreed' },
    { name: '21 Sextury', slug: '21sextury' },
    { name: 'Hegre', slug: 'hegre' },
    { name: 'Life Selector', slug: 'lifeselector' },
    { name: 'Exxxtra Small', slug: 'exxtrasmall' },
    { name: 'JAV HD', slug: 'javhd' },
    { name: 'Girl Cum', slug: 'girlcumofficial' },
    { name: 'Sex Art', slug: 'sexart' },
    { name: "Tonight's Girlfriend", slug: 'tonightsgirlfriend' },
    { name: 'Dad Crush', slug: 'dadcrush' },
    { name: 'Lubed', slug: 'lubedcom' },
    { name: 'VIP 4K', slug: 'vip4k' },
    { name: 'Evil Angel', slug: 'evilangel' },
    { name: 'JAV Hub', slug: 'javhub' },
    { name: 'Caribbeancom', slug: 'caribbeancom' },
    { name: "My Sister's Hot Friend", slug: 'mysistershotfriend' },
    { name: 'Daughter Swap', slug: 'daughterswap' },
]

const MODELS = [
    { name: 'Eva Elfie', slug: 'evaelfie' },
    { name: 'Angela White', slug: 'angelawhite' },
    { name: 'Dani Daniels', slug: 'danidaniels' },
    { name: 'Mia Malkova', slug: 'miamalkova' },
    { name: 'Riley Reid', slug: 'rileyreid' },
    { name: 'Mila Lioness', slug: 'milalioness' },
    { name: 'Alexa Grace', slug: 'alexagrace' },
    { name: 'Alina Lopez', slug: 'alinalopez' },
    { name: 'Comatozze', slug: 'comatozze' },
    { name: 'Candy Love', slug: 'candylove' },
    { name: 'Diana Rider', slug: 'dianarider' },
    { name: 'Sweetie Fox', slug: 'sweetiefox' },
    { name: 'Lana Rhoades', slug: 'lanarhoades' },
    { name: 'Julie Jess', slug: 'juliejess' },
    { name: 'Anny Walker', slug: 'annywalker' },
    { name: 'Angel X', slug: 'angelx' },
    { name: 'Shinaryen', slug: 'shinaryen' },
    { name: 'Abella Danger', slug: 'abelladanger' },
    { name: 'Sybil', slug: 'sybil' },
    { name: 'Emilia Bunny', slug: 'emiliabunny' },
    { name: 'Syndicete', slug: 'syndicete' },
    { name: 'Jenny Kitty', slug: 'jennykitty' },
    { name: 'Emily Willis', slug: 'emilywillis' },
    { name: 'Elsa Jean', slug: 'elsajean' },
    { name: 'Nicole Aniston', slug: 'nicoleaniston' },
    { name: 'Fantasy Babe', slug: 'fantasybabe' },
    { name: 'Lena Paul', slug: 'lenapaul' },
    { name: 'Bonnie Blaze', slug: 'bonnieblaze' },
    { name: 'Cory Chase', slug: 'corychase' },
    { name: 'Martin & Paola', slug: 'martinpaola' },
    { name: 'Dick For Lily', slug: 'dickforlily' },
    { name: 'Gabbie Carter', slug: 'gabbiecarter' },
    { name: 'Lexi Lore', slug: 'lexilore' },
    { name: 'Kate Kuray', slug: 'katekuray' },
    { name: 'Blake Blossom', slug: 'blakeblossom' },
    { name: 'Carla Cute', slug: 'carlacute' },
    { name: 'Hotties Two', slug: 'hottiestwo' },
    { name: 'Adriana Chechik', slug: 'adrianachechik' },
    { name: 'Yummy Mira', slug: 'yummymira' },
    { name: 'Reislin', slug: 'reislin' },
    { name: 'Anastangel', slug: 'anastangel' },
    { name: 'Gina Valentina', slug: 'ginavalentina' },
    { name: 'Kenzie Reeves', slug: 'kenzie Reeves' },
    { name: 'Valentina Nappi', slug: 'valentinanappi' },
    { name: 'Leah Meow', slug: 'leahmeow' },
    { name: 'Carry Light', slug: 'carrylight' },
    { name: 'Purple Bitch', slug: 'purplebitch' },
    { name: 'Pink Loving', slug: 'pinkloving' },
    { name: 'My Anny', slug: 'myanny' },
    { name: 'Lil Karina', slug: 'lilkarina' },
    { name: 'Melody Marks', slug: 'melodymarks' },
    { name: 'Luxury Mur', slug: 'luxurymur' },
    { name: 'Diana Daniels', slug: 'danadaniels' },
    { name: 'Stacy Cruz', slug: 'stacycruz' },
    { name: 'Allinika', slug: 'allinika' },
    { name: 'Autumn Falls', slug: 'autumnfalls' },
    { name: 'Sola Zola', slug: 'solazola' },
    { name: 'Krystal Boyd', slug: 'krystalboyd' },
    { name: 'Lexi Luna', slug: 'lexiluna' },
    { name: 'Lauren Phillips', slug: 'laurenphillips' },
    { name: 'Kera Bear', slug: 'kerabear' },
    { name: 'Little Caprice', slug: 'littlecaprice' },
    { name: 'Sia Siberia', slug: 'siasiberia' },
    { name: 'Molly Red Wolf', slug: 'mollyredwolf' },
    { name: 'Samantha Flair', slug: 'samanthaflair' },
    { name: 'Luxury Girl', slug: 'luxurygirl' },
    { name: 'Molly Little', slug: 'mollylittle' },
    { name: 'Kelly Aleman', slug: 'kellyaleman' },
    { name: 'Yinyleon', slug: 'yinyleon' },
    { name: 'Liya Silver', slug: 'liyasilver' },
    { name: 'Telari Love', slug: 'telarilove' },
    { name: 'Skye Young', slug: 'skyeyoung' },
    { name: 'Tru Kait', slug: 'trukait' },
    { name: 'Eliza Ibarra', slug: 'elizaibarra' },
    { name: 'Jenny Lux', slug: 'jennylux' },
    { name: 'Anissa Kate', slug: 'anissakate' },
    { name: 'Haley Reed', slug: 'haleyreed' },
    { name: 'Kyler Quinn', slug: 'kylerquinn' },
    { name: 'Skylar Vox', slug: 'skylarvox' },
    { name: 'Leah Gotti', slug: 'leahgotti' },
    { name: 'Lina Migurtt', slug: 'linamigurtt' },
    { name: 'Dillion Harper', slug: 'dillionharper' },
    { name: 'Brandi Love', slug: 'brandilove' },
    { name: 'Jia Lissa', slug: 'jialissa' },
    { name: 'Brooke Tilli', slug: 'brooketilli' },
    { name: 'Miss Lexa', slug: 'misslexa' },
    { name: 'Bunny Rabbits', slug: 'bunnyrabbits' },
    { name: 'Leo Lulu', slug: 'leolulu' },
    { name: 'Layla Ray', slug: 'laylaray' },
    { name: 'Web To Love', slug: 'webtolove' },
    { name: 'Nancy Ace', slug: 'nancyace' },
    { name: 'Hansel & Grettel', slug: 'hanselgrettel' },
    { name: 'Xreindeers', slug: 'xreindeers' },
    { name: 'Tiffany Tatum', slug: 'tiffanystatum' },
    { name: 'Mirari', slug: 'mirari' },
    { name: 'Adria Rae', slug: 'adriarae' },
    { name: 'Kristel Jack', slug: 'kristeljack' },
    { name: 'Mila Solana', slug: 'milasolana' },
    { name: 'Alexis Fawx', slug: 'alexisfawx' },
]

let tabs = [
    {
    name: 'Home',
    ext: { id: 'home', url: `${API_BASE}/tag/videos/index` },
},
    ...CHANNELS.map((ch) => ({
    name: ch.name,
    ext: { id: ch.slug, url: `${API_BASE}/tag/videos/${ch.slug}` },
})),
    ...MODELS.map((m) => ({
    name: m.name,
    ext: { id: m.slug, url: `${API_BASE}/tag/videos/${m.slug}` },
})),
]

let appConfig = {
    ver: 20260224,
    title: 'Beeg',
    site: 'https://beeg.com',
    tabs: tabs,
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    try {
        ext = argsify(ext)
        let cards = []
        let page = ext.page || 1
        let offset = (page - 1) * 48
        let url = `${ext.url}?limit=48&offset=${offset}`

        const { data } = await $fetch.get(url, {
            headers: {
                'User-Agent': UA,
            },
        })

        const videos = parseJsonData(data)
        if (Array.isArray(videos)) {
            videos.forEach((video) => {
                let card = buildCardFromVideo(video)
                if (card) {
                    cards.push(card)
                }
            })
        }

        return jsonify({
            list: cards,
        })
    } catch (error) {
        $print(`getCards error: ${error}`)
        return jsonify({ list: [] })
    }
}

async function getTracks(ext) {
    try {
        ext = argsify(ext)
        let tracks = []
        let videoId = ext.url
        let title = ext.title || 'Video'

        tracks.push({
            name: title,
            pan: '',
            ext: {
                video_id: videoId,
                file_id: ext.file_id,
                title: title,
                hls_resources: ext.hls_resources,
            },
        })

        return jsonify({
            list: [
                {
                    title: 'Default',
                    tracks: tracks,
                },
            ],
        })
    } catch (error) {
        $print(`getTracks error: ${error}`)
        return jsonify({ list: [] })
    }
}

async function getPlayinfo(ext) {
    try {
        ext = argsify(ext)

        let urls = []
        let hlsResources = ext.hls_resources

        // If hls_resources not available in ext, fetch from API
        if (!hlsResources || Object.keys(hlsResources).length === 0) {
            let videoId = ext.video_id || ext.url
            if (videoId && typeof videoId === 'string' && videoId.startsWith('-0')) {
                videoId = videoId.substring(2)
            }

            const videoData = await $fetch.get(`${API_BASE}/facts/file/${videoId}`, {
                headers: {
                    'User-Agent': UA,
                    'Origin': 'https://beeg.com',
                    'Referer': 'https://beeg.com/',
                },
            })

            const parsed = typeof videoData.data === 'string'
                ? JSON.parse(videoData.data)
                : videoData.data
            hlsResources = parsed?.file?.hls_resources
        }

        if (hlsResources) {
            // Get all available qualities and sort by resolution
            const qualities = []
            for (const [key, value] of Object.entries(hlsResources)) {
                if (value && key.startsWith('fl_cdn_') && key !== 'fl_cdn_multi') {
                    const match = key.match(/fl_cdn_(\d+)/)
                    const height = match ? parseInt(match[1]) : 0
                    const m3u8Url = `https://video.beeg.com/${value}`
                    qualities.push({ height, url: m3u8Url })
                }
            }

            // Sort by height descending (best quality first)
            qualities.sort((a, b) => b.height - a.height)

            for (const q of qualities) {
                urls.push(q.url)
            }
        }

        return jsonify({ urls: urls })
    } catch (error) {
        $print(`getPlayinfo error: ${error}`)
        return jsonify({ urls: [] })
    }
}

async function search(ext) {
    try {
        ext = argsify(ext)
        const text = (ext.text || '').trim()
        const page = ext.page || 1
        if (!text) {
            return jsonify({ list: [] })
        }

        const queryWords = splitQueryWords(text)
        let cards = []
        let seen = {}
        const pagesPerSearchPage = 5
        const startHomePage = (page - 1) * pagesPerSearchPage + 1
        const endHomePage = startHomePage + pagesPerSearchPage - 1

        for (let homePage = startHomePage; homePage <= endHomePage; homePage++) {
            const offset = (homePage - 1) * 48
            const url = `${API_BASE}/tag/videos/index?limit=48&offset=${offset}`
            try {
                const { data } = await $fetch.get(url, {
                    headers: { 'User-Agent': UA },
                })
                const videos = parseJsonData(data)
                if (!Array.isArray(videos)) {
                    continue
                }

                for (const video of videos) {
                    let card = buildCardFromVideo(video)
                    if (
                        card &&
                        !seen[card.vod_id] &&
                        titleMatchesQuery(card.vod_name, queryWords)
                    ) {
                        seen[card.vod_id] = true
                        cards.push(card)
                        if (cards.length >= 48) {
                            break
                        }
                    }
                }
            } catch (error) {
                $print(`search page ${homePage} error: ${error}`)
            }

            if (cards.length >= 48) {
                break
            }
        }

        return jsonify({ list: cards })
    } catch (error) {
        $print(`search error: ${error}`)
        return jsonify({ list: [] })
    }
}

function buildCardFromVideo(video) {
    const fcFacts = video.fc_facts?.[0]
    const factId = fcFacts?.id
    const fileData = video.file?.data || []
    const fileId = video.file?.id || fileData[0]?.cd_file || factId
    if (!fileId) {
        return null
    }

    const duration = video.file?.fl_duration || 0
    const durationStr = formatDuration(duration)
    const height = video.file?.fl_height || 0
    const fcThumbs = fcFacts?.fc_thumbs || []

    let title = 'Untitled'
    for (const item of fileData) {
        if (item.cd_column === 'sf_name') {
            title = item.cd_value || title
            break
        }
    }

    let cover = ''
    if (fcThumbs.length > 0) {
        cover = `https://thumbs.externulls.com/videos/${fileId}/${fcThumbs[0]}.jpg`
    } else if (fileData[0]?.cd_file) {
        cover = `https://img.externulls.com/${fileData[0].cd_file}/preview_01.jpg`
    }

    return {
        vod_id: String(fileId),
        vod_name: title,
        vod_pic: cover,
        vod_remarks: `${height}p ${durationStr}`,
        ext: {
            url: String(fileId),
            title: title,
            file_id: fileId,
            fact_id: factId,
            hls_resources: video.file?.hls_resources || {},
        },
    }
}

function parseJsonData(data) {
    return typeof data === 'string' ? JSON.parse(data) : data
}

function normalizeSlug(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
}

function splitQueryWords(text) {
    return String(text || '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 2)
}

function titleMatchesQuery(title, queryWords) {
    const normalizedTitle = normalizeSlug(title)
    if (!normalizedTitle) {
        return false
    }
    if (queryWords.length === 0) {
        return true
    }
    return queryWords.every((word) => normalizedTitle.includes(word))
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return ''
    let h = Math.floor(seconds / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = seconds % 60
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
}
