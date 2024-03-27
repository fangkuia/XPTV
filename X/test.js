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
    ":5.53,",
    ":3.970633,",
    ":3.937267,",
    ":3.93,",
    ":3.136466,",
    ":3.103100,",
    ":3.10,",
    ":3,",
    ":2.936266,",
    ":2.602600,",
    ":2.235567,",
    ":2.002000,",
    ":2.00,",
    ":2,",
    ":1.968633,",
    ":1.96,",
    ":1.36,",
    ":1.334666,",
    ":1.768432,",
    ":1.368033,",
    ":1,",
    ":https://cdnb.kin6c1.com/fvod/c418ca009d79d847c08d72114faee428b8e3261ec5cecb451a2b779591ae3a851a36c29199b4fd0a4e48f2bc987aa8495e84278f37f4722aab91d97c80a84bbb27ae73c0a52e4dfd921c07e8bfad6789b64f007a85e475d1.ts",
	":0.26,", 
	":0,", 
];

const lzzy = [
	":7.166667,",
	":7.041667,",
	":4.800000,",
	":4.166667,",
	":2.833333,",
	":2.733333,",
	":2.500000,",
	":0.458333,"
];

const ffzy = [
	":6.400000,",
	":3.700000,",
	":2.800000,",
	":1.766667,"
];

const url = $request.url;
const lines = $response.body.split("\n");
let valuesToRemove = [];
let indexesToRemove = [];
let website = "";

switch (true) {
	case url.includes("v.cdnlz"):
	case url.includes("lz-cdn"):
		valuesToRemove = lzzy;
		website = "量子資源";
		break;
	case url.includes("m3u.haiwaikan"):
		valuesToRemove = haiwaikan;
		website = "海外看";
		break;
	case url.includes("ffzy"):
		valuesToRemove = ffzy;
		website = "非凡資源";
		break;
	default:
		break;
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
}

console.log(`移除${website}廣告${count}行`);
$done({ body: lines.join("\n") });
