// cf-clearance.js v1.2.0
// Cloudflare Clearance 绕过脚本 for Loon
// 配套插件：cf-bypass.plugin
//
// 工作模式：Safari 手动过盾 + cf_clearance 缓存复用。
// - http-request 学习分支：请求已带 cf_clearance（刚过盾）→ 提取入库 + 透传
// - http-request 注入分支：请求无 cf_clearance → 注入缓存 cookie + 固定 UA
// - http-response 检测分支：响应命中 challenge → 清缓存 + 通知用户重新过盾

var CF = {};
CF.VERSION = '1.2.0';

CF.CONFIG = {
  STORE_PREFIX: 'cf_clearance_',
  // 失效通知节流窗口：同一主域在窗口内最多推送一次「CF 盾失效」通知。
  // 页面多资源并发触发 challenge 时（403/503 轰炸），不加节流会连弹十几条通知。
  // 保护窗口（PROTECT_WINDOW）只决定「清不清缓存」，与通知节流相互独立：
  // 缓存清理照样按保护窗口判定，只是通知本身被限流。
  NOTIFY_THROTTLE_MS: 60000,
  // challenge 检测：仅按状态码判定（requires-body=false，无 body 可查特征）。
  // 目标站的 403/503 直接视为 CF challenge。
  CHALLENGE_STATUS: [403, 503],
  NOTIFY_TITLE: 'CF 盾',
  // challenge 后保护窗口：新 cookie 在该时长内刚入库时，不清缓存。
  // 防止过盾后刚存的新 token 被仍在路上的旧 403 响应反复 clearCookie 清掉，
  // 导致注入分支读不到 cookie 而持续裸奔 403（只有重启 App 才恢复）。
  PROTECT_WINDOW: 30000,
  // Safari 导航请求标准 header（注入分支强制覆盖，伪装成浏览器避免指纹检测）。
  // 值取自真实 Safari 导航抓包；iOS/Safari 升级后可能需更新。
  // 注：不含 Sec-Fetch-Site —— 它不是「所有导航都固定」的头，而是按请求上下文派生：
  //   地址栏/新标签页打开 → none（无来源）
  //   站内翻页/跳转      → same-origin（带 Referer）
  // 旧实现把它钉死 none，导致翻页「声称无来源却访问分页」被 CF 判异常 → 403。
  // 现由 CF.deriveSecFetchSite() 按入站 Referer/Origin 在 handleRequest 内派生。
  // 另不含 Sec-Fetch-User —— 真实 Safari 顶层导航抓包里并不发送该头，
  // 加上反而是伪造指纹的破绽。
  // Upgrade-Insecure-Requests 是 Safari 顶层导航必发的头（10.1+/iOS 10.3+）。
  // 注入分支声称 Sec-Fetch-Mode: navigate，必须带上它，否则「自称导航却缺该头」
  // 会让 fetch metadata 头集合自相矛盾，反而暴露伪造。
  SAFARI_NAV_HEADERS: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    // 注：只用 gzip, deflate。真 Safari 导航虽带 br/zstd，但第三方 App 多只能解 gzip，
    // 覆盖成 br/zstd 会让服务器返回 App 解不开的编码 → 页面乱码。gzip 仍是 Safari 合法值。
    'Accept-Encoding': 'gzip, deflate',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    // Connection: keep-alive 是 Safari 在 HTTP/1.1 下的固定头。
    // （HTTP/2 客户端禁止发 Connection，但 Loon 在 H2 下会自剥离，故带上无害。）
    'Connection': 'keep-alive',
    // Priority 顶层导航取最高优先级 u=0。不带 i（增量标记）—— 真实 Safari
    // 主要在 HTTP/3 下发 Priority，H2 下 i 标记并非稳定特征，去掉更稳妥。
    'Priority': 'u=0'
  },
  // Safari 导航请求的 canonical 头顺序（按真实 Safari 抓包）。
  // JA4_H / HTTP2 指纹会校验 header 的原始顺序：dict 传头时 Host 易跑到末尾、
  // Sec-Fetch-* 散落开头，是脚本特征。注入分支在末尾按此顺序重排 newHeaders，
  // 让 Loon 看到的对象顺序对齐 Safari。
  // 未列出的头按原插入顺序追加到末尾（保守保留，不丢头）。
  HEADER_ORDER: [
    'Host',
    'Accept',
    'Upgrade-Insecure-Requests',
    'User-Agent',
    'Accept-Language',
    'Accept-Encoding',
    'Connection',
    'Cookie',
    'Sec-Fetch-Dest',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Site',
    'Priority',
    'Referer',
    'Origin'
  ],
  // Cookie 黑名单：注入前从 Cookie 串剔除这些 name（小写匹配）。
  // _ym_isad：Yandex Metrica 标记，_ym_isad=1 表示前端 JS 已判定为 bot/非交互流量。
  // 清掉它们不影响过盾（CF 只认 cf_clearance），反而让身份更「干净」。
  COOKIE_BLACKLIST: ['_ym_isad'],
  // Cookie 前缀黑名单：name 以这些前缀开头就剔除（小写匹配）。
  // Yandex Metrica 的 _ym_*（_ym_uid/_ym_visiac/_ym_d/_ym_fa/...）会随时间扩容，
  // 用前缀覆盖整个家族比逐个列举更稳，避免漏掉新出现的 _ym_xx 标记。
  COOKIE_PREFIX_BLACKLIST: ['_ym_'],
  // 注入分支白名单：仅保留这些请求头，其余 App/HTTP 库特征头一律删除。
  // 真实 Safari 导航请求是「干净」的；App HTTP 库会注入大量非浏览器特征头
  // （Content-Length: 0、Cache-Control、DNT、Pragma、X-Requested-With 等）。
  // 仅覆盖无法消除它们，故从空对象起按白名单重建一份干净的头。
  // 注：X-Requested-With 默认要删，但已列入白名单（见 HEADER_WHITELIST 末尾）——
  // 仅在目标站后端依赖该头路由时才保留，否则应在白名单中去掉。
  // Upgrade-Insecure-Requests 是 Safari 顶层导航必发的头，进白名单（值由 SAFARI_NAV_HEADERS
  // 强制为 '1'）。切勿把它当 App 特征头删掉 —— 删除会让 fetch metadata 头集合矛盾。
  // Connection 进白名单并由 SAFARI_NAV_HEADERS 强制为 'keep-alive'：Safari 在 HTTP/1.1
  // 下固定发该头，缺失是「不像 Safari」的破绽；同时避免透传 App 注入的 Connection: close。
  // 必须保留 Referer/Origin：它们是 Sec-Fetch-Site 的派生依据；丢掉后所有请求
  // 都退化成 none，翻页便会 403。Sec-Fetch-Site 不进白名单（由派生覆盖，见上）。
  // 大小写不敏感匹配；未列出的头（含未知自定义头）一律丢弃。
  // 头顺序不由白名单决定（白名单仅控制「留/删」），顺序见 HEADER_ORDER。
  HEADER_WHITELIST: [
    'host',
    'cookie',
    'user-agent',
    'accept',
    'accept-language',
    'accept-encoding',
    'upgrade-insecure-requests',
    'connection',
    'referer',
    'origin',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'priority',
    // X-Requested-With 特例保留（按入站原值透传，不强制覆盖）：
    // 它本是 AJAX 特征头，真实 Safari 顶层导航不发 —— 保留会让「自称 navigate」的伪装
    // 带上 AJAX 指纹，与删 Sec-Fetch-User 的理由相反权衡。仅在目标站后端按该头路由
    // （删掉则 400/拒绝）时启用；无需时可整行删除。
    'x-requested-with'
  ],
  // UA 兜底（$loon 取不到系统版本时）
  FALLBACK_UA_VERSION: '17_0',
  FALLBACK_UA_VERSION_DOTTED: '17.0'
};

// ============ header 辅助 ============

// 大小写不敏感取 header 值（HTTP header 名大小写不敏感）
CF.getHeaderCI = function (headers, name) {
  if (!headers) return '';
  var lower = name.toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === lower) return headers[keys[i]];
  }
  return '';
};

// ============ host 解析 / 归一化 ============

// 轻量 eTLD+1 归一化：取 host 最后两段作存储主域（无外部依赖、无配置）。
// 如 www.example.com → example.com；example.com → example.com。
// 对二级后缀（example.co.uk）会误判，但覆盖绝大多数常见站点。
// host 无点或只剩一段时原样返回（localhost / 内网名）。
CF.registrableDomain = function (host) {
  if (!host) return '';
  var parts = host.split('.');
  if (parts.length <= 2) return host;
  return parts.slice(-2).join('.');
};

// 从 URL 提取 host（去掉端口）。要求带协议头（://）；否则视为非法返回空串。
CF.hostFromUrl = function (url) {
  if (!url || typeof url !== 'string') return '';
  var idx = url.indexOf('://');
  if (idx < 0) return '';  // 无协议头，不像合法 URL
  var rest = url.slice(idx + 3);
  var slash = rest.indexOf('/');
  if (slash >= 0) rest = rest.slice(0, slash);
  var colon = rest.indexOf(':');
  if (colon >= 0) rest = rest.slice(0, colon);
  return rest.toLowerCase();
};

// 从 URL 提取协议（小写）。如 'https://x.com/p' → 'https'；无协议头返回空串。
CF.schemeFromUrl = function (url) {
  if (!url || typeof url !== 'string') return '';
  var idx = url.indexOf('://');
  if (idx < 0) return '';
  return url.slice(0, idx).toLowerCase();
};

// 提取 URL 的 origin（协议 + host，无端口则原样，无 path/query/fragment）。
// 输入非法（无协议头）返回空串。仅用于构造 Referer 裁剪后的 origin 值。
CF.originFromUrl = function (url) {
  if (!url || typeof url !== 'string') return '';
  var idx = url.indexOf('://');
  if (idx < 0) return '';
  var rest = url.slice(idx + 3);
  var slash = rest.indexOf('/');
  if (slash < 0) return url;  // 本就无 path，原样返回
  return url.slice(0, idx + 3 + slash);
};

// 按 Safari 默认 Referrer-Policy（strict-origin-when-cross-origin）裁剪 Referer。
//   同源（同 host）          → 保留完整 URL，仅去 fragment
//   跨源（含同站不同子域/跨站）→ 只发 origin（协议+host）
//   降级（https 源 → http 目标）→ 不发（返回空）
// targetUrl 用于判定同源/降级；非法输入（无协议头的 Referer）原样返回（透传，不强行改）。
// 返回 [value, send]：send=false 时调用方应删除 Referer 头。
// 注：fragment（#xxx）在任何情况下都应剥离 —— 真实浏览器从不在 Referer 里带 fragment。
CF.sanitizeReferer = function (refererValue, targetUrl) {
  if (!refererValue) return { value: refererValue, send: true };
  // 先统一去 fragment（fragment 在所有策略下都不发）
  var hashIdx = refererValue.indexOf('#');
  var stripped = hashIdx >= 0 ? refererValue.slice(0, hashIdx) : refererValue;
  var srcScheme = CF.schemeFromUrl(refererValue);
  // 无协议头（不像合法 URL）→ 无法判定，原样返回（透传，不强行改）
  if (!srcScheme) return { value: refererValue, send: true };
  var dstScheme = CF.schemeFromUrl(targetUrl);
  // 降级：源 https → 目标 http → 不发 Referer（strict-origin-when-cross-origin 的降级规则）
  if (srcScheme === 'https' && dstScheme === 'http') {
    return { value: '', send: false };
  }
  var srcHost = CF.hostFromUrl(refererValue);
  var dstHost = CF.hostFromUrl(targetUrl);
  // 同源 → 保留完整 URL（已去 fragment）
  if (srcHost && srcHost === dstHost) return { value: stripped, send: true };
  // 跨源 → 只发 origin
  return { value: CF.originFromUrl(refererValue), send: true };
};

// 按 Referer/Origin 派生 Sec-Fetch-Site，对齐真实浏览器行为。
// 翻页（站内跳转）浏览器发 same-origin + Referer；地址栏/新标签页打开发 none + 无 Referer。
// 旧实现把 Site 钉死 none 并丢弃 Referer，导致翻页「声称无来源却访问分页」被 CF 判异常 → 403。
//   - 无 Referer/Origin（地址栏直接打开、App 不带）→ 'none'（保住首页 200 的现有行为）
//   - 源 host == 目标 host                                → 'same-origin'
//   - 同 eTLD+1 不同子域                                  → 'same-site'
//   - 否则                                                → 'cross-site'
// 优先用 Referer 的 host，其次 Origin（Origin 只含协议+host，无 path，也合法）。
// 源 host 为空（Referer 值非法/无协议头）→ 'none'。
CF.deriveSecFetchSite = function (refererHeader, originHeader, targetHost) {
  var sourceHost = CF.hostFromUrl(refererHeader) || CF.hostFromUrl(originHeader);
  if (!sourceHost) return 'none';
  if (sourceHost === targetHost) return 'same-origin';
  if (CF.registrableDomain(sourceHost) === CF.registrableDomain(targetHost)) return 'same-site';
  return 'cross-site';
};

// ============ cf_clearance 提取 / 合并 ============

// 同域「首次访问」引导标记 key（cf_visit_<主域>）。缓存失效清空后，
// 该标记被 clearCookie 联动清掉，可再次引导用户过盾。
CF.visitKey = function (domain) {
  return 'cf_visit_' + domain.replace(/\./g, '_');
};

// 同一域在 NOTIFY_THROTTLE_MS 内的失效通知去重 key（值存时间戳）。页面多请求并发
// 触发 challenge 时只弹一次，避免 403 轰炸刷屏。
CF.notifyThrottleKey = function (domain) {
  return 'cf_notify_' + domain.replace(/\./g, '_');
};

// 按域名节流失效通知：同域 NOTIFY_THROTTLE_MS 内只推一次（返回 false 表示应跳过）。
// 用 $persistentStore 记录上次通知时间戳；超时后自动过期重推。
CF.notifyThrottled = function (domain) {
  try {
    var key = CF.notifyThrottleKey(domain);
    var last = parseInt($persistentStore.read(key), 10) || 0;
    var now = Date.now();
    if (now - last < CF.CONFIG.NOTIFY_THROTTLE_MS) return false;
    $persistentStore.write(String(now), key);
    return true;
  } catch (e) {
    return true;  // 存储异常时不节流（宁可多通知不可漏通知）
  }
};

// 从 Cookie header 提取 cf_clearance 值；无则返回 null。
CF.extractClearance = function (cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  var m = cookieHeader.match(/cf_clearance=([^;]+)/);
  return m ? m[1] : null;
};

// 从 Cookie header 剔除黑名单 name 的键值对（大小写不敏感）。
// 支持精确匹配（COOKIE_BLACKLIST）和前缀匹配（COOKIE_PREFIX_BLACKLIST）：
// _ym_isad 是直接 bot 标记，精确删；_ym_* 整个家族用前缀删（_ym_uid/_ym_visiac/
// _ym_fa/...会随时间扩容，前缀覆盖比逐个列举稳，避免漏新 _ym_xx 标记）。
// 剔除后整段 trim，多余的 `; ` 会被压平；空串进空串出。CF 只认 cf_clearance，
// 清这些不影响过盾，反而让身份更干净。
CF.scrubCookie = function (cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookieHeader || '';
  var blacklist = CF.CONFIG.COOKIE_BLACKLIST;
  var prefixes = CF.CONFIG.COOKIE_PREFIX_BLACKLIST;
  var kept = [];
  var parts = cookieHeader.split(';');
  for (var i = 0; i < parts.length; i++) {
    var seg = parts[i].trim();
    if (!seg) continue;
    var eq = seg.indexOf('=');
    var name = eq >= 0 ? seg.slice(0, eq) : seg;
    var lname = name.toLowerCase();
    // 精确黑名单
    if (blacklist.indexOf(lname) >= 0) continue;
    // 前缀黑名单
    var hitPrefix = false;
    for (var p = 0; p < prefixes.length; p++) {
      if (lname.length >= prefixes[p].length &&
          lname.slice(0, prefixes[p].length) === prefixes[p]) {
        hitPrefix = true;
        break;
      }
    }
    if (hitPrefix) continue;
    kept.push(seg);
  }
  return kept.join('; ');
};

// 按 HEADER_ORDER 重排 headers 的 key 顺序（返回新对象，原对象不动）。
// JA4_H / HTTP2 指纹校验 header 的原始顺序：dict 传头时 Host 易跑到末尾、
// Sec-Fetch-* 散落开头，是脚本特征。此函数按 Safari canonical 顺序输出新对象。
// 未列出的头（未知自定义头）按原顺序追加到末尾，保守保留不丢。
CF.orderHeaders = function (headers) {
  if (!headers) return {};
  // 索引表只依赖 HEADER_ORDER，与入站头无关 → 建一次缓存，避免每次调用重建。
  // （CONFIG 是静态的；若未来支持运行时改 CONFIG，此处需同步失效。）
  var lowerOrder = CF.orderIndex;
  var tail;
  if (!lowerOrder) {
    lowerOrder = {};
    var order = CF.CONFIG.HEADER_ORDER;
    for (var o = 0; o < order.length; o++) lowerOrder[order[o].toLowerCase()] = o;
    tail = order.length;              // 未列出头的统一末位 index
    CF.orderIndex = lowerOrder;
    CF.orderTail = tail;
  } else {
    tail = CF.orderTail;
  }
  // 按入站 key 的小写形式排序：在 order 表里的按 index 升序，不在的统一排在后面
  // （stable：保留原出现顺序）。
  var keys = Object.keys(headers);
  var indexed = [];
  for (var k = 0; k < keys.length; k++) {
    var lk = keys[k].toLowerCase();
    indexed.push({ key: keys[k], idx: (lk in lowerOrder) ? lowerOrder[lk] : tail });
  }
  indexed.sort(function (a, b) {
    if (a.idx !== b.idx) return a.idx - b.idx;
    return 0;  // stable：同 idx（含都在末段）保持原顺序
  });
  var out = {};
  for (var j = 0; j < indexed.length; j++) out[indexed[j].key] = headers[indexed[j].key];
  return out;
};

// ============ Challenge 检测 ============

// challenge 单条件判定：状态码 ∈ {403,503} 即判为 challenge。
// 不检查 body 特征（requires-body=false 时无 body），不依赖 header。
// 目标站的 403/503 直接视为 CF challenge。
CF.isChallenge = function (status) {
  return CF.CONFIG.CHALLENGE_STATUS.indexOf(status) >= 0;
};

// ============ UA 构造 ============

// 从 $loon 构造 iOS Safari UA。
// $loon 文档对字段名描述模糊，按多个候选别名探测 systemVersion。
// 取不到则用 CONFIG.FALLBACK_UA_VERSION，返回 usedFallback 供调用方决定是否通知。
CF.buildSafariUA = function () {
  var loon = (typeof $loon !== 'undefined') ? $loon : null;
  var version = null;
  if (loon) {
    version = loon.systemVersion || loon.osVersion || loon.system_version || null;
  }
  var usedFallback = false;
  if (!version) {
    version = CF.CONFIG.FALLBACK_UA_VERSION_DOTTED;
    usedFallback = true;
  }
  var underscored = String(version).replace(/\./g, '_');
  return {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS ' + underscored +
        ' like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
        'Version/' + version + ' Mobile/15E148 Safari/604.1',
    usedFallback: usedFallback
  };
};

// ============ 存储 ============

CF.storeKey = function (domain) {
  return CF.CONFIG.STORE_PREFIX + domain.replace(/\./g, '_');
};

CF.saveCookie = function (domain, obj) {
  try {
    var ok = $persistentStore.write(JSON.stringify(obj), CF.storeKey(domain));
    return ok === true;
  } catch (e) {
    return false;
  }
};

CF.loadCookie = function (domain) {
  try {
    var raw = $persistentStore.read(CF.storeKey(domain));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

CF.clearCookie = function (domain) {
  $persistentStore.write('', CF.storeKey(domain));
  // 联动清空「首次访问」引导标记：缓存失效后若用户没立刻过盾，后续裸奔 403 时
  // 应能再次收到引导提示，而不是被上次的 visit 标记永久沉默。
  try {
    $persistentStore.write('', 'cf_visit_' + domain.replace(/\./g, '_'));
  } catch (e) {}
};

// ============ 通知 ============

CF.notify = function (subtitle, content, attach) {
  try {
    if (attach) {
      // 部分 Loon 版本可能不支持 attach（第4参数），先尝试带 attach 调用
      try {
        $notification.post(CF.CONFIG.NOTIFY_TITLE, subtitle, content, attach);
        return;
      } catch (e) {
        // attach 不被支持 → 降级为无 attach
      }
    }
    $notification.post(CF.CONFIG.NOTIFY_TITLE, subtitle, content);
  } catch (e) { /* 通知失败不影响主流程 */ }
};

// ============ 请求分支：学习 + 注入 ============

// 构建一份「干净的 Safari 导航」请求头。仅注入分支使用 —— 针对第三方 App 的脏请求，
// 消除其脚本特征（Content-Length:0、乱序、Connection: close、_ym_* bot 标记等）。
// 学习分支处理的 Safari 请求本身是浏览器真实构造的、合法的、能过盾的，不走此函数，
// 纯透传 —— 脚本拿固定值覆盖真实 Safari 头反而画蛇添足，可能把真头改成「更像伪造」。
//
// 处理顺序（顺序很重要，后置步骤依赖前置结果）：
//   1. 白名单重建：从空对象起只保留浏览器导航该有的头（消除 App 库特征头）
//   2. Cookie / UA 覆盖：用缓存值（含过盾 cf_clearance + 过盾 UA）
//   3. 强制 Safari 导航标准头（Accept/Encoding/Connection/UIR/Sec-Fetch-Dest/Mode/Priority）
//   4. Sec-Fetch-Site 按入站 Referer/Origin 派生（不是钉死 none）
//   5. Referer 按 Safari 默认 strict-origin-when-cross-origin 裁剪
//   6. 按 HEADER_ORDER 重排（对齐 JA4_H / HTTP2 指纹）
//
// req: $request 对象（取 url/headers）。
// overrides: {cookie, ua} —— 注入分支用缓存值覆盖 Cookie/UA，让 CF 看到过盾时的身份。
// 返回清理+重排后的 headers 对象。
CF.buildCleanHeaders = function (req, overrides) {
  var headers = (req && req.headers) || {};
  overrides = overrides || {};

  // 1. 白名单重建：只保留浏览器导航该有的头，消除 App/HTTP 库注入的非浏览器特征头
  //    （Content-Length: 0、Cache-Control、DNT、Pragma 等）。仅覆盖无法消除它们，
  //    故从空对象起按白名单重建一份干净的头。
  //    白名单刻意保留 Referer/Origin —— 它们是 Sec-Fetch-Site 的派生依据（见下）。
  //    X-Requested-With 已列入白名单（特例保留，按入站原值透传），其余 App 特征头照删。
  var newHeaders = {};
  var whitelist = CF.CONFIG.HEADER_WHITELIST;
  var srcKeys = Object.keys(headers);
  for (var i = 0; i < srcKeys.length; i++) {
    var key = srcKeys[i];
    if (whitelist.indexOf(key.toLowerCase()) >= 0) {
      newHeaders[key] = headers[key];
    }
  }

  // 2. Cookie / UA 覆盖为缓存值。Cookie 走 scrubCookie 剔除 _ym_isad 等 bot 标记。
  if (overrides.cookie !== undefined) {
    newHeaders['Cookie'] = CF.scrubCookie(overrides.cookie);
  }
  if (overrides.ua !== undefined) {
    newHeaders['User-Agent'] = overrides.ua;
  }

  // 3. 强制覆盖 Safari 导航标准 header（覆盖掉 App 原带的非 Safari 值）
  var navHeaders = CF.CONFIG.SAFARI_NAV_HEADERS;
  var navKeys = Object.keys(navHeaders);
  for (var j = 0; j < navKeys.length; j++) {
    newHeaders[navKeys[j]] = navHeaders[navKeys[j]];
  }

  // 4. Sec-Fetch-Site 按入站 Referer/Origin 派生，对齐真实浏览器行为：
  //    翻页（同站跳转）发 same-origin + Referer；地址栏直接打开发 none + 无 Referer。
  //    旧实现把 Site 钉死 none，导致翻页「声称无来源却访问分页」被 CF 判异常 → 403。
  var targetHost = CF.hostFromUrl(req.url);
  newHeaders['Sec-Fetch-Site'] = CF.deriveSecFetchSite(
    CF.getHeaderCI(newHeaders, 'Referer'),
    CF.getHeaderCI(newHeaders, 'Origin'),
    targetHost
  );

  // 5. Referer 策略裁剪（对齐 Safari 默认 strict-origin-when-cross-origin）：
  //    直接透传 App 传入的完整跨源 URL 会暴露「不像 Safari」—— 真实浏览器跨源只发 origin。
  //      同源 → 保留完整 URL（去 fragment）
  //      跨源 → 裁到 origin
  //      降级（https→http）→ 删除 Referer 头
  //    Sec-Fetch-Site 用裁剪前的原始 Referer 派生（它判定的是「源 host」，裁剪不影响）。
  var refKey = null;
  var refVal = '';
  var allKeys = Object.keys(newHeaders);
  for (var ri = 0; ri < allKeys.length; ri++) {
    if (allKeys[ri].toLowerCase() === 'referer') {
      refKey = allKeys[ri];
      refVal = newHeaders[refKey];
      break;
    }
  }
  if (refKey !== null) {
    var sanitized = CF.sanitizeReferer(refVal, req.url);
    if (sanitized.send) {
      newHeaders[refKey] = sanitized.value;
    } else {
      delete newHeaders[refKey];  // 降级：不发 Referer
    }
  }

  // 6. 按 Safari canonical 顺序重排（对齐 JA4_H / HTTP2 指纹）。
  //    必须放在所有增删之后，否则顺序又会乱。
  return CF.orderHeaders(newHeaders);
};

// domain 为归一化主域（eTLD+1），存储 key 基于它。
CF.handleRequest = function (domain) {
  var req = $request;
  var headers = (req && req.headers) || {};
  var cookieHeader = CF.getHeaderCI(headers, 'Cookie');
  var uaHeader = CF.getHeaderCI(headers, 'User-Agent');

  var existing = CF.extractClearance(cookieHeader);

  // ---- 学习分支：请求已带 cf_clearance（刚过盾）----
  if (existing) {
    var prev = CF.loadCookie(domain);
    // 重存条件：首次获取 / token 变化 / 完整 cookie 串变化 / UA 变化。
    // 只重存并通知「token 变化」的情况 —— 若只是 cookies/UA 变化（token 未变），
    // 静默刷新缓存即可：新 cookie 集合里 cf_clearance 仍是同一个 token，
    // 但完整身份（如过期后重新拿到的同 token）应同步到注入分支。
    // 避免旧实现「token 未变只更新时间戳」导致 cookies 永远停留在首次过盾时的旧值，
    // 站点 set 的 cookie 更新后注入分支仍发旧串。
    var changed = !prev ||
      prev.cf_clearance !== existing ||
      (prev.cookies || '') !== (cookieHeader || '') ||
      (prev.ua || '') !== (uaHeader || '');
    if (changed) {
      var saved = CF.saveCookie(domain, {
        cf_clearance: existing,
        cookies: cookieHeader,   // 完整 Cookie 头，注入时全量复用
        ua: uaHeader,            // ground truth：过盾请求的实际 UA
        savedAt: Date.now(),
        domain: domain
      });
      // 仅 token 变化才弹通知；cookies/UA 变化静默（避免反复弹窗干扰）
      if (!prev || prev.cf_clearance !== existing) {
        CF.notify('获取成功 ' + domain, '已捕获 cf_clearance');
      }
      if (!saved) {
        // 存储失败：通知用户，否则注入分支一直拿不到 token（静默失败隐患）
        CF.notify(domain + ' 存储失败', 'cf_clearance 未能写入持久化存储，请检查存储空间');
      }
    } else {
      // 完全未变，仅更新时间戳（刷新保护窗口），不重写存储
      prev.savedAt = Date.now();
      CF.saveCookie(domain, prev);
    }
    // 纯透传：真 Safari 过盾请求的头是浏览器真实构造的、合法的、能过盾的。
    // 脚本拿固定值去覆盖反而画蛇添足，可能把真实头改成「更像伪造」。
    // 头清理（删 Content-Length:0、scrub cookie 等）只由注入分支负责，针对第三方
    // App 的脏请求；学习分支处理的 Safari 请求本身干净，无需脚本干预。
    $done({});
    return;
  }

  // ---- 注入分支：无 cf_clearance，白名单重建请求头 ----
  // 从空对象起按白名单重建一份干净的 Safari 导航头：Cookie 全量覆盖为缓存值
  // （含 cf_clearance + 过盾时的其他 cookie），UA 用存储的 Safari UA 覆盖，
  // 其余浏览器头强制为 Safari 标准值。原理：cf_clearance 绑定「过盾时的 UA + IP」，
  // Loon 重写整个请求头让 CF 看到 Safari 身份从而放行；其余 cookie 一并复用，
  // 让第三方 App 拿到过盾时的完整身份。
  var cached = CF.loadCookie(domain);
  if (!cached || !cached.cf_clearance) {
    // 首次访问引导：该域无缓存 token，提示用户 Safari 手动过盾（仅一次，免重复打扰）
    var visitKey = CF.visitKey(domain);
    try {
      if (!$persistentStore.read(visitKey)) {
        CF.notify('首次访问 ' + domain, '无缓存 cf_clearance，请在 Safari 打开该站点完成 CF 验证');
        $persistentStore.write('1', visitKey);
      }
    } catch (e) {}
    $done({});  // 无缓存 → 放行，让响应检测兜底
    return;
  }

  // 注入分支：无 cf_clearance → 用缓存 cookie（含 cf_clearance）+ 缓存 UA 重建头。
  // 头清理逻辑（白名单/nav/派生/裁剪/order/scrub）由 CF.buildCleanHeaders 统一处理，
  // 与学习分支共用，确保两个分支输出的头都是干净的 Safari 导航头。
  // 此分支通过 overrides 把 Cookie/UA 覆盖成缓存值，让 CF 看到过盾时的身份。
  // UA 兜底链：缓存 UA（过盾时 ground truth）→ 请求头 UA → buildSafariUA 动态构造
  // （$loon 设备版本）。前两者都缺失时才构造 —— 此时学习分支从未捕获过该域，
  // 但缓存里可能有旧格式 token；构造 Safari UA 至少让指纹接近真实浏览器。
  var fallbackUA = '';
  if (!cached.ua) {
    try {
      fallbackUA = CF.buildSafariUA().ua;
    } catch (e) { fallbackUA = ''; }
  }
  var injectHeaders = CF.buildCleanHeaders(req, {
    cookie: cached.cookies || ('cf_clearance=' + cached.cf_clearance),
    ua: cached.ua || uaHeader || fallbackUA
  });
  $done({ headers: injectHeaders });
};

// ============ 响应分支：失效检测 ============

// 命中则（按保护窗口）清该域缓存 + 通知 + 放行原响应。
// domain 为归一化主域，作存储 key；通知标题显示「触发盾的子域名 host」，
// attach 跳转到「触发盾的原始请求 URL」，让用户点击即回到该请求当场过盾。
// 刻意不伪造响应，让 Safari 显示盾页以便用户当场过盾。
CF.handleResponse = function (domain) {
  // Loon 的 $response.status 可能是数字、字符串，甚至 "403 Forbidden" 完整状态行
  var status = parseInt($response && $response.status, 10) || 0;

  if (CF.isChallenge(status)) {
    // 保护窗口：新 cookie 刚入库（窗口内）不清，避免与旧 403 响应竞态把新 token 清掉。
    // 无缓存 / 老 cookie（无 savedAt）/ 入库已超出窗口 → 正常清。
    var cached = CF.loadCookie(domain);
    var now = Date.now();
    var fresh = cached && cached.savedAt &&
                (now - cached.savedAt) <= CF.CONFIG.PROTECT_WINDOW;
    if (!fresh) {
      CF.clearCookie(domain);
    }
    // 通知节流：同域 NOTIFY_THROTTLE_MS 内只推一次，防并发 403 刷屏。
    // （缓存清理仍按保护窗口独立判定，节流只限通知。）
    if (CF.notifyThrottled(domain)) {
      // 标题显示触发盾的子域名 host；attach 跳转到原始请求 URL（含 path/query/fragment）。
      // $request.url 缺失（不该发生但防御）时兜底为「https://<host>/」。
      var host = CF.hostFromUrl($request && $request.url) || domain;
      var openUrl = ($request && $request.url) || ('https://' + host + '/');
      CF.notify('CF 盾失效 ' + host,
        '检测到 challenge，点击此处用 Safari 重新过盾，Loon 将自动捕获新 cookie',
        openUrl);
    }
  }
  $done({});  // 放行原响应
};

// ============ 入口分发 ============

// 从 $request.url 取 host，归一化为 eTLD+1 主域作存储 key。
// 分阶段分流：
// - 请求阶段（无 $response）：学习（带 cf_clearance → 入库）或注入（无 → 覆盖请求头）
// - 响应阶段（有 $response）：任意被触发的域名都做 challenge 检测，403/503 必通知
// 域名是否触发脚本由 cf-bypass.plugin 的 [Script] 正则 + [mitm] hostname 决定，
// 脚本对所有被触发的域名生效，无需内置域名清单。
CF.dispatch = function () {
  try {
    if (typeof $request === 'undefined' || !$request || !$request.url) {
      $done({});
      return;
    }
    var host = CF.hostFromUrl($request.url);
    if (!host) { $done({}); return; }
    var domain = CF.registrableDomain(host);  // 归一化主域，用于存储 key

    if (typeof $response === 'undefined' || !$response) {
      CF.handleRequest(domain);
    } else {
      CF.handleResponse(domain);
    }
  } catch (e) {
    CF.notify('插件异常', String(e && e.message || e));
    $done({});
  }
};

// ============ 自测 ============

// 极简 assert 供 selfTest 用
function CF_assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

// 通过 $argument = "__test__" 触发，跑核心纯函数断言。
CF.selfTest = function () {
  var results = [];
  function check(name, fn) {
    try { fn(); results.push({ name: name, ok: true }); }
    catch (e) { results.push({ name: name, ok: false, err: String(e && e.message || e) }); }
  }

  check('isChallenge 503 命中', function () {
    CF_assert(CF.isChallenge(503));
  });
  check('isChallenge 403 命中', function () {
    CF_assert(CF.isChallenge(403));
  });
  check('isChallenge 200 不命中', function () {
    CF_assert(!CF.isChallenge(200));
  });
  check('isChallenge 500 不命中', function () {
    CF_assert(!CF.isChallenge(500));
  });
  check('extractClearance 命中', function () {
    CF_assert(CF.extractClearance('a=1; cf_clearance=TOK; b=2') === 'TOK');
  });
  check('extractClearance 未命中', function () {
    CF_assert(CF.extractClearance('a=1; b=2') === null);
  });
  check('registrableDomain 子域归一', function () {
    CF_assert(CF.registrableDomain('www.example.com') === 'example.com');
  });
  check('registrableDomain 根域不变', function () {
    CF_assert(CF.registrableDomain('example.com') === 'example.com');
  });
  check('scrubCookie 剔除 _ym_isad', function () {
    CF_assert(CF.scrubCookie('a=1; _ym_isad=1; b=2') === 'a=1; b=2');
  });
  check('scrubCookie 前缀剔除所有 _ym_*', function () {
    CF_assert(CF.scrubCookie('a=1; _ym_fa=x; _ym_uid=y; b=2') === 'a=1; b=2');
  });
  check('scrubCookie 无黑名单项原样返回', function () {
    CF_assert(CF.scrubCookie('a=1; b=2') === 'a=1; b=2');
  });

  var passed = results.every(function (r) { return r.ok; });
  return { passed: passed, results: results };
};

// ============ 入口 ============

if (typeof $request !== 'undefined') {
  if (typeof $argument !== 'undefined' && $argument === '__test__') {
    var r = CF.selfTest();
    try {
      $notification.post('CF 插件自测',
        r.passed ? '全部通过' : '存在失败',
        r.passed ? (r.results.length + ' 项全过') :
          r.results.filter(function (x) { return !x.ok; })
            .map(function (x) { return x.name; }).join(', '));
    } catch (e) {}
    $done({});
  } else {
    CF.dispatch();
  }
}

// ============ 导出（供 Node 测试） ============

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CF;
}
