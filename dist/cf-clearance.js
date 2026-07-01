// cf-clearance.js
// Cloudflare Clearance 绕过脚本 for Loon
// 配套插件：cf-bypass.plugin
//
// 工作模式：Safari 手动过盾 + cf_clearance 缓存复用。
// - http-request 学习分支：请求已带 cf_clearance（刚过盾）→ 提取入库 + 透传
// - http-request 注入分支：请求无 cf_clearance → 注入缓存 cookie + 固定 UA
// - http-response 检测分支：响应命中 challenge → 清缓存 + 通知用户重新过盾

var CF = {};

CF.CONFIG = {
  STORE_PREFIX: 'cf_clearance_',
  INPUT_DOMAINS: 'domains',
  // 内置默认域名列表（#!input domains 为空时使用，用户可通过插件 UI 覆盖）
  DEFAULT_DOMAINS: 'missav.live,jable.tv,51cg1.com,hanime1.me,m.pandalive.co.kr,zh.spankbang.com,api.pandalive.co.kr,noodlemagazine.com',
  // challenge 检测：状态码（必要条件之一）
  CHALLENGE_STATUS: [403, 503],
  // challenge 检测：body 特征（任一命中即满足特征条件）
  CHALLENGE_BODY_MARKERS: [
    'Just a moment...',
    '/cdn-cgi/challenge-platform/',
    '__cf_chl_jschl_tk__',
    'jschl'
  ],
  CHALLENGE_HEADER_KEY: 'cf-mitigated',
  CHALLENGE_HEADER_VALUE: 'challenge',
  NOTIFY_TITLE: 'CF 盾',
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

CF.shallowCopy = function (obj) {
  var copy = {};
  if (!obj) return copy;
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) copy[keys[i]] = obj[keys[i]];
  return copy;
};

// ============ 多站点解析 ============

// 解析 #!input domains（逗号分隔主域）为去空去重的数组
CF.parseDomains = function (raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
};

// 从请求 host 找出命中的清单主域；返回清单项本身（用于归一化存储 key）。
// 匹配规则：host === domain，或 host 以 "." + domain 结尾（严格后缀，防前缀混淆）。
CF.extractRegistrableDomain = function (host, domains) {
  if (!host || !domains || domains.length === 0) return null;
  for (var i = 0; i < domains.length; i++) {
    var d = domains[i];
    if (host === d) return d;
    if (host.length > d.length + 1 &&
        host.charAt(host.length - d.length - 1) === '.' &&
        host.slice(host.length - d.length) === d) {
      return d;
    }
  }
  return null;
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

// ============ cf_clearance 提取 / 合并 ============

// 从 Cookie header 提取 cf_clearance 值；无则返回 null。
CF.extractClearance = function (cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  var m = cookieHeader.match(/cf_clearance=([^;]+)/);
  return m ? m[1] : null;
};

// 把 cf_clearance=<value> 合并进 cookieHeader：移除旧 cf_clearance，末尾追加新的。
// value 为空则原样返回 cookieHeader（不注入）。
CF.mergeClearance = function (cookieHeader, value) {
  if (!value) return cookieHeader || '';
  var base = cookieHeader || '';
  base = base.replace(/(?:^|; )cf_clearance=[^;]*/g, '');
  base = base.replace(/^;\s*/, '').trim();
  if (base.length === 0) return 'cf_clearance=' + value;
  return base + '; cf_clearance=' + value;
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
};

// ============ 通知 ============

CF.notify = function (subtitle, content, attach) {
  try {
    $notification.post(CF.CONFIG.NOTIFY_TITLE, subtitle, content, attach);
  } catch (e) { /* 通知失败不影响主流程 */ }
};

// ============ 请求分支：学习 + 注入 ============

// domain 为归一化主域（来自清单匹配），存储 key 基于它。
CF.handleRequest = function (domain) {
  var req = $request;
  var headers = (req && req.headers) || {};
  var cookieHeader = CF.getHeaderCI(headers, 'Cookie');
  var uaHeader = CF.getHeaderCI(headers, 'User-Agent');

  var existing = CF.extractClearance(cookieHeader);

  // ---- 学习分支：请求已带 cf_clearance（刚过盾）----
  if (existing) {
    var prev = CF.loadCookie(domain);
    // 只在首次获取或 token 变化时通知，避免页面多请求重复弹窗
    if (!prev || prev.cf_clearance !== existing) {
      CF.saveCookie(domain, {
        cf_clearance: existing,
        ua: uaHeader,           // ground truth：过盾请求的实际 UA
        savedAt: Date.now(),
        domain: domain
      });
      CF.notify('获取成功 ' + domain, '已捕获 cf_clearance');
    } else {
      // token 未变，仅更新时间戳，不通知
      prev.savedAt = Date.now();
      CF.saveCookie(domain, prev);
    }
    $done({});  // 透传，不改请求
    return;
  }

  // ---- 注入分支：无 cf_clearance，用缓存覆盖请求头 ----
  // 一律用存储的 Safari UA + cf_clearance 覆盖，不校验 App 原始 UA。
  // 原理：cf_clearance 绑定「过盾时的 UA + IP」。Loon 拦截请求后重写
  // 整个请求头（UA + Cookie），让 CF 看到的是 Safari 身份，从而放行。
  // 适用于「第三方 App 访问」场景（App 自身 UA 与 Safari 不同）。
  var cached = CF.loadCookie(domain);
  if (!cached || !cached.cf_clearance) {
    $done({});  // 无缓存 → 放行，让响应检测兜底
    return;
  }

  // 合并 Cookie 并用存储的 Safari UA 覆盖 App 的 UA
  var merged = CF.mergeClearance(cookieHeader, cached.cf_clearance);
  var newHeaders = CF.shallowCopy(headers);
  newHeaders['Cookie'] = merged;
  newHeaders['User-Agent'] = cached.ua || uaHeader;
  $done({ headers: newHeaders });
};

// ============ 响应分支：失效检测 ============

// 命中则清该域缓存 + 通知 + 放行原响应。
// 刻意不伪造响应，让 Safari 显示盾页以便用户当场过盾。
CF.handleResponse = function (domain) {
  var status = ($response && $response.status) || 0;

  if (CF.isChallenge(status)) {
    CF.clearCookie(domain);
    // 点击通知直接打开触发盾的页面，方便用户在 Safari 重新过盾
    var openUrl = ($request && $request.url) ? $request.url : ('https://' + domain);
    CF.notify('CF 盾失效 ' + domain,
      '检测到 challenge，点击此处用 Safari 重新过盾，Loon 将自动捕获新 cookie',
      openUrl);
  }
  $done({});  // 放行原响应
};

// ============ 入口分发 ============

// 读 #!input domains；为空时使用 CF.CONFIG.DEFAULT_DOMAINS 内置列表。
// 从 $request.url 取 host 匹配；不命中则透传。
// 命中且无 $response → 走 request 分支；有 $response → 走 response 分支。
CF.dispatch = function () {
  try {
    var domainsRaw = '';
    try { domainsRaw = $persistentStore.read(CF.CONFIG.INPUT_DOMAINS); } catch (e) {}
    if (!domainsRaw) {
      domainsRaw = CF.CONFIG.DEFAULT_DOMAINS;
    }
    var domains = CF.parseDomains(domainsRaw);

    if (typeof $request === 'undefined' || !$request || !$request.url) {
      $done({});
      return;
    }
    var host = CF.hostFromUrl($request.url);
    var matched = CF.extractRegistrableDomain(host, domains);
    if (!matched) {
      $done({});
      return;
    }
    if (typeof $response === 'undefined' || !$response) {
      CF.handleRequest(matched);
    } else {
      CF.handleResponse(matched);
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
  check('extractRegistrableDomain 子域命中', function () {
    CF_assert(CF.extractRegistrableDomain('www.example.com', ['example.com']) === 'example.com');
  });
  check('extractRegistrableDomain 防前缀混淆', function () {
    CF_assert(CF.extractRegistrableDomain('notexample.com', ['example.com']) === null);
  });
  check('mergeClearance 覆盖旧值', function () {
    CF_assert(CF.mergeClearance('cf_clearance=OLD; k=v', 'NEW') === 'k=v; cf_clearance=NEW');
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
