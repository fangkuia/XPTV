const haiwaikan = [
	":16.0599,",
	":15.2666,",
	":15.1666,",
	":15.08,",
	":12.33,",
	":10.85,",
	":10.3333,",
	":10.106555,",
	":10.0099,",
	":8.641966,",
	":8.1748,",
	":7.907899,",
	":5.939267,",
	":5.538866,",
	":5.53,",
	":3.970633,",
	":3.937267,",
	":3.93,",
	":3.136466,",
	":3.103100,",
	":3.10,",
	":2.936266,",
	":2.602600,",
	":2.235567,",
	":2.002000,",
	":2.00,",
	":1.968633,",
	":1.96,",
	":1.36,",
	":1.334666,",
	":1.768432,",
	":1.368033,",
	":0.266932,",
	":0.26,",
];

const lzzy = [":7.166667,", ":7.041667,", ":4.166667,", ":2.833333,", ":2.733333,", ":2.500000,", ":0.458333,"];

const ffzy = [":6.400000,", ":3.700000,", ":2.800000,", ":1.766667,"];

const url = $request.url;
const lines = $response.body.split("\n");

let adCount = 0;

switch (true) {
	case url.includes("v.cdnlz"):
	case url.includes("lz-cdn"):
		filterAds(lzzy);
		break;
	case url.includes("m3u.haiwaikan"):
		haiwaikanHostsCount();
		filterAds(haiwaikan);
		break;
	case url.includes("ffzy"):
		filterAds(ffzy);
		break;
	default:
		break;
}

function filterAds(valuesToRemove) {
	for (let i = 0; i < lines.length; i++) {
		if (valuesToRemove.some((value) => lines[i].includes(value))) {
			console.log("Match:" + valuesToRemove.find(value => lines[i].includes(value)));
			if (lines[i].endsWith(".ts")) {
				console.log("Remove ad(by host):" + lines[i]);
				lines.splice(i - 1, 2);
				adCount++;
			} else if (lines[i + 1].endsWith(".ts")) {
				console.log("Remove ad(by duration):" + lines[i + 1]);
				lines.splice(i, 2);
				adCount++;
			}
		}
	}
	
	console.log(`移除廣告${adCount}行`);
	$done({ body: lines.join("\n") });
}

function haiwaikanHostsCount() {
	const hostsCount = {};
	lines.forEach((line) => {
		if (line.includes(".ts")) {
			const hostname = getHost(line);
			hostsCount[hostname] = (hostsCount[hostname] || 0) + 1;
		}
	});

	const keys = Object.keys(hostsCount);
	if (keys.length > 1) {
		haiwaikan.push(keys[1]);
	} else return;
}

function getHost(url) {
  return url.toLowerCase().match(/^https?:\/\/(.*?)\//)[1];
}
