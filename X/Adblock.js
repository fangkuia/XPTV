
const m3u8 = $response.body;
const lines = m3u8.split("\n");

const haiwaikan = [
	":16.0599,",
	":15.2666,",
	":15.1666,",
	":15.08,",
	":12.33,",
	":10.85,",
	":10.3333,",
	":10.0099,",
	":8.641966,",
	":8.1748,",
	":7.907899,",
	":5.939267,",
	":5.538866,",
	":3.970633,",
	":3.937267,",
	":3.136466,",
	":3.103100,",
	":2.936266,",
	":2.602600,",
	":2.235567,",
	":2.002000,",
	":1.968633,",
	":1.334666,",
	":1.768432,",
	":1.368033,",
	":0.266932,",
];

const lzzy = [
	":7.041667,",
	":4.166667,",
	":2.833333,",
	":0.458333,",
];

let valuesToRemove = [];
let indexesToRemove = [];
let website = "";

if ($request.url.includes("v.cdnlz") || $request.url.includes("lz-cdn")) {
	valuesToRemove = lzzy;
	website = "量子資源";
} else if ($request.url.includes("m3u.haiwaikan")) {
	valuesToRemove = haiwaikan;
	website = "海外看";
}

for (let i = lines.length - 1; i >= 0; i--) {
	if (valuesToRemove.some((value) => lines[i].includes(value))) {
		indexesToRemove.push(i);
	}
}

let count = 0;
indexesToRemove.forEach((indexToRemove) => {
	if (indexToRemove !== -1 && lines[indexToRemove + 1].endsWith(".ts")) {
		lines.splice(indexToRemove, 2);
		count++;
	}
});

let modifiedM3u8 = lines.join("\n");
console.log(`移除${website}廣告${count}行`)

$done({ body: modifiedM3u8 });


