// cf-clearance.js v1.0.0
// Cloudflare Clearance 绕过脚本 for Loon
// 配套插件：cf-bypass.plugin
//
// 工作模式：Safari 手动过盾 + cf_clearance 缓存复用。
// - http-request 学习分支：请求已带 cf_clearance（刚过盾）→ 提取入库 + 透传
// - http-request 注入分支：请求无 cf_clearance → 注入缓存 cookie + 固定 UA
// - http-response 检测分支：响应命中 challenge → 清缓存 + 通知用户重新过盾

var CF = {};
CF.VERSION = '1.0.0';

CF.CONFIG = {
  STORE_PREFIX: 'cf_clearance_',
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
  // challenge 后保护窗口：新 cookie 在该时长内刚入库时，不清缓存。
  // 防止过盾后刚存的新 token 被仍在路上的旧 403 响应反复 clearCookie 清掉，
  // 导致注入分支读不到 cookie 而持续裸奔 403（只有重启 App 才恢复）。
  PROTECT_WINDOW: 30000,
  // Safari 导航请求标准 header（注入分支强制覆盖，伪装成浏览器避免指纹检测）。
  // 值取自真实 Safari 导航抓包；iOS/Safari 升级后可能需更新。
  SAFARI_NAV_HEADERS: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Priority': 'u=0, i'
  },
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
    // 只在首次获取或 token 变化时通知，避免页面多请求重复弹窗
    if (!prev || prev.cf_clearance !== existing) {
      CF.saveCookie(domain, {
        cf_clearance: existing,
        cookies: cookieHeader,   // 完整 Cookie 头，注入时全量复用
        ua: uaHeader,            // ground truth：过盾请求的实际 UA
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
  // 全量覆盖 Cookie 头为存储的 cookies 串（含 cf_clearance + 其他 cookie），
  // UA 用存储的 Safari UA 覆盖。原理：cf_clearance 绑定「过盾时的 UA + IP」，
  // Loon 重写整个请求头让 CF 看到 Safari 身份从而放行；其余 cookie 一并复用，
  // 让第三方 App 拿到过盾时的完整身份。
  var cached = CF.loadCookie(domain);
  if (!cached || !cached.cf_clearance) {
    // 首次访问引导：该域无缓存 token，提示用户 Safari 手动过盾（仅一次，免重复打扰）
    var visitKey = 'cf_visit_' + domain.replace(/\./g, '_');
    try {
      if (!$persistentStore.read(visitKey)) {
        CF.notify('首次访问 ' + domain, '无缓存 cf_clearance，请在 Safari 打开该站点完成 CF 验证');
        $persistentStore.write('1', visitKey);
      }
    } catch (e) {}
    $done({});  // 无缓存 → 放行，让响应检测兜底
    return;
  }

  // 全量覆盖 Cookie 头 + 强制伪装 Safari 导航 header，消除 App 请求头指纹矛盾
  var newHeaders = CF.shallowCopy(headers);
  newHeaders['Cookie'] = cached.cookies || ('cf_clearance=' + cached.cf_clearance);
  newHeaders['User-Agent'] = cached.ua || uaHeader;
  // 强制覆盖 Safari 导航标准 header（App 原带的 HTTP 库特征会暴露指纹）
  var navHeaders = CF.CONFIG.SAFARI_NAV_HEADERS;
  var navKeys = Object.keys(navHeaders);
  for (var i = 0; i < navKeys.length; i++) {
    newHeaders[navKeys[i]] = navHeaders[navKeys[i]];
  }
  // 删除 Content-Length（GET 导航请求不该有；大小写不敏感）
  var ck = Object.keys(newHeaders);
  for (var j = 0; j < ck.length; j++) {
    if (ck[j].toLowerCase() === 'content-length') delete newHeaders[ck[j]];
  }
  $done({ headers: newHeaders });
};

// ============ 响应分支：失效检测 ============

// 命中则（按保护窗口）清该域缓存 + 通知 + 放行原响应。
// domain 为归一化主域，作存储 key；通知标题与 attach URL 用「触发盾的子域名 host」。
// attach 必须是干净可打开的子域名根 URL：触发盾的多是带长 query 的深层 API/子资源
// 请求，用 $request.url 做 attach 会让 Loon 回退显示脚本执行简报。
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
    // 跳转目标用触发盾的子域名根（CF 盾常挂在子域上，跳裸主域可能再撞盾）。
    var host = CF.hostFromUrl($request && $request.url) || domain;
    var openUrl = 'https://' + host + '/';
    CF.notify('CF 盾失效 ' + host,
      '检测到 challenge，点击此处用 Safari 重新过盾，Loon 将自动捕获新 cookie',
      openUrl);
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
