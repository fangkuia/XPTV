const specificTsUrl = "https://cdnb.kin6c1.com/fvod/c418ca009d79d847c08d72114faee428b8e3261ec5cecb451a2b779591ae3a851a36c29199b4fd0a4e48f2bc987aa8495e84278f37f4722aab91d97c80a84bbb27ae73c0a52e4dfd921c07e8bfad6789b64f007a85e475d1.ts";

const lines = $response.body.split("\n");
let count = 0;

for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(specificTsUrl)) {
        lines.splice(i, 1);
        count++;
    }
}

console.log(`移除特定.ts链接${count}行`);
$done({ body: lines.join("\n") });
