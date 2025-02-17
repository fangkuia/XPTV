const cheerio = createCheerio();

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Mobile/15E148 Safari/604.1";

let appConfig = {
  ver: 1,
  title: "JavMove",
  site: "https://javmove.com",
  tabs: [
    {
      name: "最新AV",
      ui: 1,
      ext: { tag: "release" },
    },
    {
      name: "即将上映",
      ui: 1,
      ext: { tag: "upcoming" },
    },
  ],
};

async function getConfig() {
  return JSON.stringify(appConfig);
}

async function getCards(ext) {
  ext = JSON.parse(ext);
  let { tag, page = 1 } = ext;
  let url = `${appConfig.site}/${tag}?page=${page}`;
  let cards = [];

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA },
  });

  const $ = cheerio.load(data);
  $("#movie-list article").each((_, element) => {
    const href = $(element).find('a[rel="bookmark"]').attr("href");
    const title = $(element).find("h2").attr("title").split(" ")[0];
    const cover =
      $(element).find(".movie-image").attr("data-srcset") ||
      $(element).find(".movie-image").attr("src");
    const pubdate = $(element).find("time").first().attr("datetime").split("T")[0];

    cards.push({
      vod_id: href,
      vod_name: title,
      vod_pic: cover,
      vod_remarks: "",
      vod_pubdate: pubdate,
      ext: {
        url: `${appConfig.site}${href}`,
        ref: url,
      },
    });
  });

  return JSON.stringify({ list: cards });
}

async function getTracks(ext) {
  ext = JSON.parse(ext);
  let groups = [];
  let { url, ref } = ext;

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA, Referer: ref },
  });

  const $ = cheerio.load(data);
  const id = $("#video-player").attr("data-id") || "";

  const promises = $(".video-format")
    .toArray()
    .map(async (element) => {
      const format = $(element).find(".video-format-header").text().trim();
      let formatGroup = { title: format, tracks: [] };

      const partElements = $(element).find(".video-source-btn");

      for (const partEl of partElements.toArray()) {
        const href = $(partEl).attr("href") || "";
        const partMatch = $(partEl).attr("title").match(/part\s*(\d+)/i);
        const partNumber = partMatch ? parseInt(partMatch[1], 10) : 0;
        const title = `part ${partNumber}`;
        let dataID;

        if (href.includes("#")) {
          dataID = id;
        } else {
          const curl = `${appConfig.site}${href}`;
          const { data: data2 } = await $fetch.get(curl, {
            headers: { "User-Agent": UA, Referer: ref },
          });
          const $2 = cheerio.load(data2);
          dataID = $2("#video-player").attr("data-id");
        }

        formatGroup.tracks.push({
          part: partNumber,
          name: title,
          ext: { dataID },
        });
      }

      groups.push(formatGroup);
    });

  await Promise.all(promises);

  const formatPriority = { FullHD: 1, HD: 2, SD: 3 };

  function getFormatPriority(title) {
    if (/^FullHD/i.test(title)) return formatPriority.FullHD;
    if (/^HD/i.test(title)) return formatPriority.HD;
    if (/^SD/i.test(title)) return formatPriority.SD;
    return 999;
  }

  groups.sort((a, b) => getFormatPriority(a.title) - getFormatPriority(b.title));

  groups.forEach((group) => group.tracks.sort((a, b) => a.part - b.part));

  return JSON.stringify({ list: groups });
}

async function getPlayinfo(ext) {
  ext = JSON.parse(ext);
  const url = `${appConfig.site}/watch?token=${ext.dataID}`;

  const { data } = await $fetch.get(url, {
    headers: {
      "User-Agent": UA,
      Referer: "https://javquick.com/",
    },
  });

  return JSON.stringify({ urls: [data] });
}

async function search(ext) {
  ext = JSON.parse(ext);
  let text = encodeURIComponent(ext.text);
  let page = ext.page || 1;
  let url = `${appConfig.site}/search?q=${text}&page=${page}`;
  let cards = [];

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA },
  });

  const $ = cheerio.load(data);
  $("#movie-list article").each((_, element) => {
    const href = $(element).find('a[rel="bookmark"]').attr("href");
    const title = $(element).find("h2").attr("title").split(" ")[0];
    const cover =
      $(element).find(".movie-image").attr("data-srcset") ||
      $(element).find(".movie-image").attr("src");
    const pubdate = $(element).find("time").first().attr("datetime").split("T")[0];

    cards.push({
      vod_id: href,
      vod_name: title,
      vod_pic: cover,
      vod_remarks: "",
      vod_pubdate: pubdate,
      ext: {
        url: `${appConfig.site}${href}`,
        ref: url,
      },
    });
  });

  return JSON.stringify({ list: cards });
}
