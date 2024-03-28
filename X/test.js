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
  ":0.26,"
];

const url = $request.url;
const lines = $response.body.split("\n");

let indexesToRemove = [];
let adCount = 0;

if (url.includes("m3u.haiwaikan")) {
  filterAds(haiwaikan);
  removeAds();
}

function filterAds(valuesToRemove) {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (valuesToRemove.some((value) => lines[i].includes(value))) {
      indexesToRemove.push(i);
    }
  }
}

function removeAds() {
  indexesToRemove.forEach((indexToRemove) => {
    if (indexToRemove !== -1 && lines[indexToRemove].endsWith(".ts")) {
      if (lines[indexToRemove].includes("https://cdnb.kin6c1.com/fvod/c418ca009d79d847c08d72114faee428b8e3261ec5cecb451a2b779591ae3a851a36c29199b4fd0a4e48f2bc987aa8495e84278f37f4722aab91d97c80a84bbb27ae73c0a52e4dfd921c07e8bfad6789b64f007a85e475d1.ts")) {
        lines.splice(indexToRemove - 1, 2); // Remove both hostname and .ts link
        adCount++;
      }
    } else if (indexToRemove !== -1 && lines[indexToRemove + 1].endsWith(".ts")) {
      lines.splice(indexToRemove, 2); // Remove duration and .ts link
      adCount++;
    }
  }
}

console.log(`移除海外看广告${adCount}行`);
$done({ body: lines.join("\n") });
