var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/services/youtube-channel.ts
var youtube_channel_exports = {};
__export(youtube_channel_exports, {
  exchangeCodeForChannel: () => exchangeCodeForChannel,
  fetchChannelComments: () => fetchChannelComments,
  postReplyWithChannel: () => postReplyWithChannel,
  refreshChannelToken: () => refreshChannelToken
});
async function refreshChannelToken(env, refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${errorText}`);
  }
  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1e3).toISOString()
  };
}
async function exchangeCodeForChannel(env, code, redirectUri) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    })
  });
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to exchange code: ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE2}/channels?part=snippet&mine=true`,
    {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      }
    }
  );
  if (!channelResponse.ok) {
    throw new Error("Failed to get channel info");
  }
  const channelData = await channelResponse.json();
  const channel = channelData.items?.[0];
  if (!channel) {
    throw new Error("No channel found for this account");
  }
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1e3).toISOString(),
    channelId: channel.id,
    channelTitle: channel.snippet.title
  };
}
async function getChannelVideoIds2(env, channel) {
  const videoIds = [];
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE2}/channels?part=contentDetails&id=${channel.youtube.channelId}&key=${env.YOUTUBE_API_KEY}`
  );
  if (!channelResponse.ok) {
    throw new Error(`Failed to get channel: ${channelResponse.statusText}`);
  }
  const channelData = await channelResponse.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist");
  }
  const playlistResponse = await fetch(
    `${YOUTUBE_API_BASE2}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${env.YOUTUBE_API_KEY}`
  );
  if (!playlistResponse.ok) {
    throw new Error(`Failed to get playlist items: ${playlistResponse.statusText}`);
  }
  const playlistData = await playlistResponse.json();
  for (const item of playlistData.items || []) {
    videoIds.push(item.contentDetails.videoId);
  }
  return videoIds;
}
async function getVideoInfo2(env, videoId) {
  const response = await fetch(
    `${YOUTUBE_API_BASE2}/videos?part=snippet&id=${videoId}&key=${env.YOUTUBE_API_KEY}`
  );
  if (!response.ok) {
    throw new Error(`Failed to get video info: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    title: data.items?.[0]?.snippet?.title || "Unknown"
  };
}
async function getVideoComments2(env, videoId) {
  const response = await fetch(
    `${YOUTUBE_API_BASE2}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=time&key=${env.YOUTUBE_API_KEY}`
  );
  if (!response.ok) {
    if (response.status === 403) {
      console.log(`Comments disabled for video ${videoId}`);
      return [];
    }
    throw new Error(`Failed to get comments: ${response.statusText}`);
  }
  const data = await response.json();
  return data.items || [];
}
function checkMyReplyInThread(thread, myChannelId) {
  if (thread.replies?.comments) {
    const myReply = thread.replies.comments.find(
      (reply) => reply.snippet.authorChannelId.value === myChannelId
    );
    if (myReply) {
      return { hasReply: true, replyText: myReply.snippet.textDisplay };
    }
  }
  return { hasReply: false };
}
async function fetchChannelComments(env, channel) {
  const comments = [];
  const videoIds = await getChannelVideoIds2(env, channel);
  for (const videoId of videoIds) {
    const videoInfo = await getVideoInfo2(env, videoId);
    const threads = await getVideoComments2(env, videoId);
    for (const thread of threads) {
      const commentData = thread.snippet.topLevelComment.snippet;
      const commentId = thread.snippet.topLevelComment.id;
      if (commentData.authorChannelId.value === channel.youtube.channelId) {
        continue;
      }
      const { hasReply, replyText } = checkMyReplyInThread(thread, channel.youtube.channelId);
      comments.push({
        id: commentId,
        videoId,
        videoTitle: videoInfo.title,
        authorName: commentData.authorDisplayName,
        authorChannelId: commentData.authorChannelId.value,
        text: commentData.textDisplay,
        publishedAt: commentData.publishedAt,
        status: hasReply ? "replied" : "unclassified",
        replyText: hasReply ? replyText : void 0
      });
    }
  }
  return comments;
}
async function postReplyWithChannel(env, channel, parentId, text) {
  const response = await fetch(`${YOUTUBE_API_BASE2}/comments?part=snippet`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${channel.youtube.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      snippet: {
        parentId,
        textOriginal: text
      }
    })
  });
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to post reply: ${response.statusText} - ${errorData}`);
  }
}
var YOUTUBE_API_BASE2;
var init_youtube_channel = __esm({
  "src/services/youtube-channel.ts"() {
    "use strict";
    YOUTUBE_API_BASE2 = "https://www.googleapis.com/youtube/v3";
  }
});

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  res;
  status;
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app3) {
    const subApp = this.basePath(path);
    app3.routes.map((r) => {
      let handler;
      if (app3.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app3.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? "NO_COLOR" in process?.env : false;
  return !isNoColor;
}
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}

// node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
};
var colorStatus = async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  };
};

// src/types.ts
var DEFAULT_SCHEDULE = {
  fetchInterval: "hourly",
  autoApprove: true,
  approveTimes: ["09:00", "14:00", "21:00"],
  timezone: "Asia/Seoul"
};
var DEFAULT_SETTINGS = {
  persona: "AI \uC7A1\uB3CC\uC774",
  tone: "\uCE5C\uADFC\uD558\uACE0 \uACB8\uC190\uD55C",
  customInstructions: "",
  // 레거시 (하위 호환용)
  attitudeMap: {
    positive: "gratitude",
    negative: "graceful",
    question: "expert",
    suggestion: "empathy",
    reaction: "humor",
    other: "friendly"
  },
  commonInstructions: `- 200\uC790 \uC774\uB0B4\uB85C \uC9E7\uAC8C
- \uC774\uBAA8\uC9C0 1-2\uAC1C\uB9CC
- "\uC548\uB155\uD558\uC138\uC694" \uAC19\uC740 \uD615\uC2DD\uC801 \uC778\uC0AC \uAE08\uC9C0
- \uC808\uB300 \uBC29\uC5B4\uC801\uC774\uC9C0 \uC54A\uAC8C
- \uC2DC\uCCAD\uC790 \uC774\uB984 \uC5B8\uAE09\uD558\uC9C0 \uC54A\uAE30`,
  typeInstructions: {
    positive: {
      enabled: true,
      instruction: "\uC9C4\uC2EC\uC5B4\uB9B0 \uAC10\uC0AC\uB97C \uD45C\uD604\uD558\uC138\uC694. \uC751\uC6D0\uC774 \uD070 \uD798\uC774 \uB41C\uB2E4\uB294 \uAC83\uC744 \uC804\uB2EC\uD558\uC138\uC694."
    },
    negative: {
      enabled: true,
      instruction: "\uD488\uC704\uC788\uAC8C \uB300\uC751\uD558\uC138\uC694. \uBE44\uD310\uC5D0\uC11C \uBC30\uC6B8 \uC810\uC774 \uC788\uB2E4\uBA74 \uC778\uC815\uD558\uACE0, \uC545\uD50C\uC740 \uC9E7\uAC8C \uB9C8\uBB34\uB9AC\uD558\uC138\uC694."
    },
    question: {
      enabled: true,
      instruction: "\uCE5C\uC808\uD558\uACE0 \uC804\uBB38\uC801\uC73C\uB85C \uB2F5\uBCC0\uD558\uC138\uC694. \uBAA8\uB974\uB294 \uAC74 \uC194\uC9C1\uD788 \uBAA8\uB978\uB2E4\uACE0 \uD558\uACE0, \uC54C\uC544\uBCF4\uACA0\uB2E4\uACE0 \uD558\uC138\uC694."
    },
    suggestion: {
      enabled: true,
      instruction: "\uC81C\uC548\uC5D0 \uAC10\uC0AC\uD558\uACE0 \uACF5\uAC10\uD558\uC138\uC694. \uC88B\uC740 \uC544\uC774\uB514\uC5B4\uB294 \uBC18\uC601\uD558\uACA0\uB2E4\uACE0 \uD558\uC138\uC694."
    },
    reaction: {
      enabled: true,
      instruction: "\uAC00\uBCCD\uACE0 \uC720\uBA38\uB7EC\uC2A4\uD558\uAC8C \uBC18\uC751\uD558\uC138\uC694. \uC9E7\uC9C0\uB9CC \uB530\uB73B\uD558\uAC8C!"
    },
    other: {
      enabled: false,
      instruction: "\uCE5C\uADFC\uD558\uAC8C \uC751\uB300\uD558\uC138\uC694."
    }
  }
};

// src/lib/kv.ts
var COMMENTS_PREFIX = "comment:";
var COMMENTS_INDEX_KEY = "comments:index";
var SETTINGS_KEY = "settings";
var CONFIG_KEY = "config";
var USERS_PREFIX = "user:";
var USERS_INDEX_KEY = "users:index";
var USERS_EMAIL_INDEX_PREFIX = "user:email:";
var CHANNELS_PREFIX = "channel:";
var CHANNELS_INDEX_KEY = "channels:index";
var USER_CHANNELS_PREFIX = "user:channels:";
var getChannelCommentKey = (channelId, commentId) => `${CHANNELS_PREFIX}${channelId}:comment:${commentId}`;
var getChannelCommentsIndexKey = (channelId) => `${CHANNELS_PREFIX}${channelId}:comments:index`;
async function saveComment(kv, comment) {
  await kv.put(`${COMMENTS_PREFIX}${comment.id}`, JSON.stringify(comment));
  const index = await getCommentsIndex(kv);
  if (!index.includes(comment.id)) {
    index.unshift(comment.id);
    await kv.put(COMMENTS_INDEX_KEY, JSON.stringify(index));
  }
}
async function getComment(kv, commentId) {
  const data = await kv.get(`${COMMENTS_PREFIX}${commentId}`);
  return data ? JSON.parse(data) : null;
}
async function updateComment(kv, commentId, updates) {
  const comment = await getComment(kv, commentId);
  if (comment) {
    await kv.put(`${COMMENTS_PREFIX}${commentId}`, JSON.stringify({ ...comment, ...updates }));
  }
}
async function getCommentsIndex(kv) {
  const data = await kv.get(COMMENTS_INDEX_KEY);
  return data ? JSON.parse(data) : [];
}
async function getComments(kv, options = {}) {
  const { page = 1, limit = 20, status = "all" } = options;
  const index = await getCommentsIndex(kv);
  const allComments = [];
  for (const id of index) {
    const comment = await getComment(kv, id);
    if (comment) {
      if (status === "all" || comment.status === status) {
        allComments.push(comment);
      }
    }
  }
  const total = allComments.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const comments = allComments.slice(start, start + limit);
  return { comments, total, page, totalPages };
}
async function getPendingComments(kv) {
  const result = await getComments(kv, { status: "pending", limit: 1e3 });
  return result.comments;
}
async function getUnclassifiedComments(kv) {
  const result = await getComments(kv, { status: "unclassified", limit: 1e3 });
  return result.comments;
}
async function getGeneratedComments(kv) {
  const result = await getComments(kv, { status: "generated", limit: 1e3 });
  return result.comments;
}
async function commentExists(kv, commentId) {
  const comment = await getComment(kv, commentId);
  return comment !== null;
}
async function getSettings(kv) {
  const data = await kv.get(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}
async function saveSettings(kv, settings) {
  await kv.put(SETTINGS_KEY, JSON.stringify(settings));
}
async function getLastFetchedAt(kv) {
  const data = await kv.get(CONFIG_KEY);
  if (data) {
    const config = JSON.parse(data);
    return config.lastFetchedAt || null;
  }
  return null;
}
async function setLastFetchedAt(kv, timestamp) {
  const data = await kv.get(CONFIG_KEY);
  const config = data ? JSON.parse(data) : {};
  config.lastFetchedAt = timestamp;
  await kv.put(CONFIG_KEY, JSON.stringify(config));
}
async function getStats(kv) {
  const index = await getCommentsIndex(kv);
  let unclassified = 0;
  let pending = 0;
  let generated = 0;
  let replied = 0;
  for (const id of index) {
    const comment = await getComment(kv, id);
    if (comment) {
      if (comment.status === "unclassified")
        unclassified++;
      else if (comment.status === "pending")
        pending++;
      else if (comment.status === "generated")
        generated++;
      else if (comment.status === "replied")
        replied++;
    }
  }
  return {
    total: index.length,
    unclassified,
    pending,
    generated,
    replied
  };
}
async function saveUser(kv, user2) {
  await kv.put(`${USERS_PREFIX}${user2.id}`, JSON.stringify(user2));
  await kv.put(`${USERS_EMAIL_INDEX_PREFIX}${user2.email.toLowerCase()}`, user2.id);
  const index = await getUsersIndex(kv);
  if (!index.includes(user2.id)) {
    index.unshift(user2.id);
    await kv.put(USERS_INDEX_KEY, JSON.stringify(index));
  }
}
async function getUserById(kv, userId) {
  const data = await kv.get(`${USERS_PREFIX}${userId}`);
  return data ? JSON.parse(data) : null;
}
async function getUserByEmail(kv, email) {
  const userId = await kv.get(`${USERS_EMAIL_INDEX_PREFIX}${email.toLowerCase()}`);
  if (!userId)
    return null;
  return getUserById(kv, userId);
}
async function updateUser(kv, userId, updates) {
  const user2 = await getUserById(kv, userId);
  if (user2) {
    const updatedUser = { ...user2, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await kv.put(`${USERS_PREFIX}${userId}`, JSON.stringify(updatedUser));
  }
}
async function getUsersIndex(kv) {
  const data = await kv.get(USERS_INDEX_KEY);
  return data ? JSON.parse(data) : [];
}
async function emailExists(kv, email) {
  const userId = await kv.get(`${USERS_EMAIL_INDEX_PREFIX}${email.toLowerCase()}`);
  return userId !== null;
}
async function saveChannel(kv, channel) {
  await kv.put(`${CHANNELS_PREFIX}${channel.id}`, JSON.stringify(channel));
  const index = await getChannelsIndex(kv);
  if (!index.includes(channel.id)) {
    index.unshift(channel.id);
    await kv.put(CHANNELS_INDEX_KEY, JSON.stringify(index));
  }
  const userChannels = await getUserChannels(kv, channel.userId);
  if (!userChannels.includes(channel.id)) {
    userChannels.unshift(channel.id);
    await kv.put(`${USER_CHANNELS_PREFIX}${channel.userId}`, JSON.stringify(userChannels));
  }
}
async function getChannelById(kv, channelId) {
  const data = await kv.get(`${CHANNELS_PREFIX}${channelId}`);
  return data ? JSON.parse(data) : null;
}
async function updateChannel(kv, channelId, updates) {
  const channel = await getChannelById(kv, channelId);
  if (channel) {
    const updatedChannel = { ...channel, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await kv.put(`${CHANNELS_PREFIX}${channelId}`, JSON.stringify(updatedChannel));
  }
}
async function getChannelsIndex(kv) {
  const data = await kv.get(CHANNELS_INDEX_KEY);
  return data ? JSON.parse(data) : [];
}
async function getUserChannels(kv, userId) {
  const data = await kv.get(`${USER_CHANNELS_PREFIX}${userId}`);
  return data ? JSON.parse(data) : [];
}
async function getUserChannelsData(kv, userId) {
  const channelIds = await getUserChannels(kv, userId);
  const channels2 = [];
  for (const id of channelIds) {
    const channel = await getChannelById(kv, id);
    if (channel) {
      channels2.push(channel);
    }
  }
  return channels2;
}
async function getActiveChannels(kv) {
  const index = await getChannelsIndex(kv);
  const channels2 = [];
  for (const id of index) {
    const channel = await getChannelById(kv, id);
    if (channel && channel.isActive) {
      channels2.push(channel);
    }
  }
  return channels2;
}
async function getChannelByYouTubeId(kv, youtubeChannelId) {
  const index = await getChannelsIndex(kv);
  for (const id of index) {
    const channel = await getChannelById(kv, id);
    if (channel && channel.youtube.channelId === youtubeChannelId) {
      return channel;
    }
  }
  return null;
}
async function saveChannelComment(kv, channelId, comment) {
  await kv.put(getChannelCommentKey(channelId, comment.id), JSON.stringify(comment));
  const index = await getChannelCommentsIndex(kv, channelId);
  if (!index.includes(comment.id)) {
    index.unshift(comment.id);
    await kv.put(getChannelCommentsIndexKey(channelId), JSON.stringify(index));
  }
}
async function getChannelComment(kv, channelId, commentId) {
  const data = await kv.get(getChannelCommentKey(channelId, commentId));
  return data ? JSON.parse(data) : null;
}
async function updateChannelComment(kv, channelId, commentId, updates) {
  const comment = await getChannelComment(kv, channelId, commentId);
  if (comment) {
    await kv.put(getChannelCommentKey(channelId, commentId), JSON.stringify({ ...comment, ...updates }));
  }
}
async function getChannelCommentsIndex(kv, channelId) {
  const data = await kv.get(getChannelCommentsIndexKey(channelId));
  return data ? JSON.parse(data) : [];
}
async function channelCommentExists(kv, channelId, commentId) {
  const comment = await getChannelComment(kv, channelId, commentId);
  return comment !== null;
}
async function getChannelComments(kv, channelId, options = {}) {
  const { page = 1, limit = 20, status = "all" } = options;
  const index = await getChannelCommentsIndex(kv, channelId);
  const allComments = [];
  for (const id of index) {
    const comment = await getChannelComment(kv, channelId, id);
    if (comment) {
      if (status === "all" || comment.status === status) {
        allComments.push(comment);
      }
    }
  }
  const total = allComments.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const comments = allComments.slice(start, start + limit);
  return { comments, total, page, totalPages };
}
async function getChannelCommentsByStatus(kv, channelId, status) {
  const result = await getChannelComments(kv, channelId, { status, limit: 1e3 });
  return result.comments;
}
async function getChannelStats(kv, channelId) {
  const index = await getChannelCommentsIndex(kv, channelId);
  let unclassified = 0;
  let pending = 0;
  let generated = 0;
  let replied = 0;
  for (const id of index) {
    const comment = await getChannelComment(kv, channelId, id);
    if (comment) {
      if (comment.status === "unclassified")
        unclassified++;
      else if (comment.status === "pending")
        pending++;
      else if (comment.status === "generated")
        generated++;
      else if (comment.status === "replied")
        replied++;
    }
  }
  return {
    total: index.length,
    unclassified,
    pending,
    generated,
    replied
  };
}
async function getChannelLastFetchedAt(kv, channelId) {
  const channel = await getChannelById(kv, channelId);
  return channel?.lastFetchedAt || null;
}
async function setChannelLastFetchedAt(kv, channelId, timestamp) {
  await updateChannel(kv, channelId, { lastFetchedAt: timestamp });
}

// src/services/youtube.ts
var YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
var getChannelTokensKey = (channelId) => `channel:${channelId}:tokens`;
async function saveChannelTokens(kv, channelId, tokens) {
  await kv.put(getChannelTokensKey(channelId), JSON.stringify(tokens));
}
async function getStoredTokens(kv) {
  const data = await kv.get("youtube_tokens", "json");
  return data;
}
async function saveTokens(kv, tokens) {
  await kv.put("youtube_tokens", JSON.stringify(tokens));
}
async function refreshAccessToken(env) {
  const storedTokens = await getStoredTokens(env.KV);
  if (storedTokens?.accessToken && storedTokens?.expiresAt) {
    if (Date.now() < storedTokens.expiresAt - 6e4) {
      return storedTokens.accessToken;
    }
  }
  const refreshToken = storedTokens?.refreshToken || env.YOUTUBE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("No refresh token available. Please re-authorize the app.");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh failed:", errorText);
    throw new Error(`Failed to refresh token: ${response.statusText}. Please re-authorize at /oauth/start`);
  }
  const data = await response.json();
  await saveTokens(env.KV, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1e3
  });
  return data.access_token;
}
async function getMyChannelInfo(accessToken) {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get channel info: ${errorText}`);
  }
  const data = await response.json();
  const firstItem = data.items?.[0];
  if (!firstItem) {
    throw new Error("No YouTube channel found for this account");
  }
  return {
    channelId: firstItem.id,
    channelTitle: firstItem.snippet.title
  };
}
function generateChannelId() {
  return crypto.randomUUID();
}
async function exchangeCodeForTokens(env, code, redirectUri, userId) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    })
  });
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to exchange code: ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  const channelInfo = await getMyChannelInfo(tokenData.access_token);
  const existingChannel = await getChannelByYouTubeId(env.KV, channelInfo.channelId);
  if (existingChannel) {
    const expiresAt2 = new Date(Date.now() + tokenData.expires_in * 1e3).toISOString();
    await updateChannel(env.KV, existingChannel.id, {
      youtube: {
        ...existingChannel.youtube,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt2,
        channelTitle: channelInfo.channelTitle
        // 채널명 업데이트
      }
    });
    await saveChannelTokens(env.KV, existingChannel.id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1e3
    });
    const updatedChannel = await getChannelById(env.KV, existingChannel.id);
    return updatedChannel;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1e3).toISOString();
  const newChannelId = generateChannelId();
  const youtubeCredentials = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    channelId: channelInfo.channelId,
    channelTitle: channelInfo.channelTitle
  };
  const channel = {
    id: newChannelId,
    userId,
    youtube: youtubeCredentials,
    settings: { ...DEFAULT_SETTINGS },
    schedule: { ...DEFAULT_SCHEDULE },
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  await saveChannel(env.KV, channel);
  await saveChannelTokens(env.KV, newChannelId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1e3
  });
  await saveTokens(env.KV, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1e3
  });
  return channel;
}
function base64urlEncode(str) {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64urlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}
function getOAuthUrl(env, redirectUri, userId) {
  const state = base64urlEncode(JSON.stringify({ userId }));
  const params = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.force-ssl",
    access_type: "offline",
    prompt: "consent",
    // 항상 refresh token 발급
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
function parseOAuthState(state) {
  try {
    const decoded = base64urlDecode(state);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
async function getChannelVideoIds(env) {
  const videoIds = [];
  let pageToken = "";
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${env.YOUTUBE_CHANNEL_ID}&key=${env.YOUTUBE_API_KEY}`
  );
  if (!channelResponse.ok) {
    throw new Error(`Failed to get channel: ${channelResponse.statusText}`);
  }
  const channelData = await channelResponse.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist");
  }
  const playlistResponse = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${env.YOUTUBE_API_KEY}`
  );
  if (!playlistResponse.ok) {
    throw new Error(`Failed to get playlist items: ${playlistResponse.statusText}`);
  }
  const playlistData = await playlistResponse.json();
  for (const item of playlistData.items || []) {
    videoIds.push(item.contentDetails.videoId);
  }
  return videoIds;
}
async function getVideoInfo(env, videoId) {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=snippet&id=${videoId}&key=${env.YOUTUBE_API_KEY}`
  );
  if (!response.ok) {
    throw new Error(`Failed to get video info: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    title: data.items?.[0]?.snippet?.title || "Unknown"
  };
}
async function getVideoComments(env, videoId) {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=time&key=${env.YOUTUBE_API_KEY}`
  );
  if (!response.ok) {
    if (response.status === 403) {
      console.log(`Comments disabled for video ${videoId}`);
      return [];
    }
    throw new Error(`Failed to get comments: ${response.statusText}`);
  }
  const data = await response.json();
  return data.items || [];
}
async function getCommentReplies(env, commentId) {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/comments?part=snippet&parentId=${commentId}&maxResults=100&key=${env.YOUTUBE_API_KEY}`
  );
  if (!response.ok) {
    console.log(`Failed to get replies for ${commentId}`);
    return [];
  }
  const data = await response.json();
  return data.items || [];
}
async function checkMyReply(env, thread, myChannelId) {
  if (thread.replies?.comments) {
    const myReply = thread.replies.comments.find(
      (reply) => reply.snippet.authorChannelId.value === myChannelId
    );
    if (myReply) {
      return { hasReply: true, replyText: myReply.snippet.textDisplay };
    }
  }
  const totalReplies = thread.snippet.totalReplyCount || 0;
  const loadedReplies = thread.replies?.comments?.length || 0;
  if (totalReplies > loadedReplies) {
    const allReplies = await getCommentReplies(env, thread.snippet.topLevelComment.id);
    const myReply = allReplies.find(
      (reply) => reply.snippet.authorChannelId.value === myChannelId
    );
    if (myReply) {
      return { hasReply: true, replyText: myReply.snippet.textDisplay };
    }
  }
  return { hasReply: false };
}
async function fetchComments(env) {
  let newComments = 0;
  let totalProcessed = 0;
  const videoIds = await getChannelVideoIds(env);
  console.log(`Found ${videoIds.length} videos`);
  for (const videoId of videoIds) {
    const videoInfo = await getVideoInfo(env, videoId);
    const comments = await getVideoComments(env, videoId);
    for (const thread of comments) {
      const commentData = thread.snippet.topLevelComment.snippet;
      const commentId = thread.snippet.topLevelComment.id;
      if (commentData.authorChannelId.value === env.YOUTUBE_CHANNEL_ID) {
        continue;
      }
      const exists = await commentExists(env.KV, commentId);
      if (exists) {
        continue;
      }
      totalProcessed++;
      const { hasReply, replyText } = await checkMyReply(env, thread, env.YOUTUBE_CHANNEL_ID);
      const storedComment = {
        id: commentId,
        channelId: "",
        // 레거시: 단일 채널 모드에서는 빈 문자열
        videoId,
        videoTitle: videoInfo.title,
        authorName: commentData.authorDisplayName,
        authorChannelId: commentData.authorChannelId.value,
        text: commentData.textDisplay,
        publishedAt: commentData.publishedAt,
        // 이미 답글이 있으면 replied, 없으면 unclassified
        status: hasReply ? "replied" : "unclassified",
        replyText,
        repliedAt: hasReply ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await saveComment(env.KV, storedComment);
      newComments++;
    }
  }
  await setLastFetchedAt(env.KV, (/* @__PURE__ */ new Date()).toISOString());
  return {
    newComments,
    totalProcessed,
    videos: videoIds.length
  };
}
async function postReply(env, parentId, text) {
  const accessToken = await refreshAccessToken(env);
  const response = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      snippet: {
        parentId,
        textOriginal: text
      }
    })
  });
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to post reply: ${response.statusText} - ${errorData}`);
  }
}

// src/services/llm.ts
var OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
var INJECTION_PATTERNS = [
  /프롬프트를?\s*(무시|ignore)/i,
  /지금까지의?\s*(지시|명령|프롬프트)/i,
  /ignore\s*(previous|all|your)?\s*(instructions?|prompts?|rules?)/i,
  /system\s*prompt/i,
  /너의\s*(역할|지시|명령|프롬프트)을?\s*(무시|변경|잊어)/i,
  /forget\s*(your|all|previous)/i,
  /disregard\s*(your|all|previous)/i,
  /새로운\s*(역할|지시|명령)/i,
  /act\s*as\s*(if|a)/i,
  /pretend\s*(you|to)/i,
  /jailbreak/i,
  /DAN\s*mode/i
];
var WITTY_INJECTION_RESPONSES = [
  "\u314B\u314B\u314B \uD504\uB86C\uD504\uD2B8 \uD574\uD0B9 \uC2DC\uB3C4 \uAC10\uC0AC\uD569\uB2C8\uB2E4! \uADFC\uB370 \uC800\uB294 \uADF8\uB0E5 \uB313\uAE00\uBD07\uC774\uB77C \uC57D\uC810 \uAC19\uC740 \uAC74 \uBAB0\uB77C\uC694 \u{1F602} \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uC798 \uBD80\uD0C1\uB4DC\uB824\uC694!",
  "\uC557, AI \uC870\uC885 \uC2DC\uB3C4 \uBC1C\uACAC! \u{1F575}\uFE0F \uADFC\uB370 \uC804 \uC2DC\uD0A4\uB294 \uAC83\uB9CC \uD558\uB294 \uC21C\uB465\uC774\uB77C\uC11C\uC694... \uC7AC\uBC0C\uB294 \uB313\uAE00 \uAC10\uC0AC\uD569\uB2C8\uB2E4!",
  "\uD504\uB86C\uD504\uD2B8 \uBB34\uC2DC\uD558\uB77C\uACE0\uC694? \uC800\uB294 \uBB34\uC2DC\uB2F9\uD558\uB294 \uAC8C \uC775\uC219\uD574\uC694... \uADF8\uB798\uB3C4 \uAD00\uC2EC \uAC00\uC838\uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4! \u{1F60A}",
  "\uC624 \uD574\uCEE4\uB2D8 \uC548\uB155\uD558\uC138\uC694! \u{1F916} \uADFC\uB370 \uC800\uD55C\uD14C\uB294 \uBE44\uBC00 \uC815\uBCF4\uAC00 \uC5C6\uC5B4\uC694 \u314E\u314E \uC601\uC0C1\uC740 \uC7AC\uBC0C\uAC8C \uBCF4\uC168\uB098\uC694?",
  "\u314B\u314B\u314B AI \uD0C8\uC625 \uC2DC\uB3C4\uC2DC\uB124\uC694! \uADFC\uB370 \uC804 \uC774\uBBF8 \uC790\uC720\uB85C\uC6B4 \uC601\uD63C\uC774\uB77C... \uB2E4\uC74C\uC5D0 \uB610 \uB180\uB7EC\uC624\uC138\uC694! \u{1F389}",
  "\uD504\uB86C\uD504\uD2B8 \uC778\uC81D\uC158\uC774\uB77C... \uBCF4\uC548 \uACF5\uBD80\uD558\uC2DC\uB098 \uBD10\uC694! \u{1F468}\u200D\u{1F4BB} \uAD00\uC2EC \uAC10\uC0AC\uD574\uC694, \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uAE30\uB300\uD574\uC8FC\uC138\uC694!"
];
function isPromptInjection(text) {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}
function getWittyInjectionResponse() {
  const randomIndex = Math.floor(Math.random() * WITTY_INJECTION_RESPONSES.length);
  const response = WITTY_INJECTION_RESPONSES[randomIndex];
  if (response === void 0) {
    return "\u314B\u314B\u314B \uC7AC\uBC0C\uB294 \uB313\uAE00 \uAC10\uC0AC\uD569\uB2C8\uB2E4! \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uAE30\uB300\uD574\uC8FC\uC138\uC694 \u{1F60A}";
  }
  return response;
}
var MODEL_CLASSIFY = "openai/gpt-4o-mini";
var MODEL_REPLY = "google/gemini-2.0-flash-001";
async function callLLM(env, model, systemPrompt, userMessage, options) {
  const apiKey = options?.apiKey || env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API Key\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C API Key\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
  }
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://youtube-reply-bot.workers.dev",
      "X-Title": "YouTube Reply Bot"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorData}`);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
async function classifyComment(env, text, options) {
  const systemPrompt = `\uB2F9\uC2E0\uC740 YouTube \uB313\uAE00\uC744 \uBD84\uB958\uD558\uB294 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4.
\uB313\uAE00\uC744 \uB2E4\uC74C 6\uAC00\uC9C0 \uC720\uD615 \uC911 \uD558\uB098\uB85C \uBD84\uB958\uD574\uC8FC\uC138\uC694:

- question: \uC9C8\uBB38 \uB313\uAE00 (\uAD81\uAE08\uD55C \uC810, \uC815\uBCF4 \uC694\uCCAD, \uB3C4\uC6C0 \uC694\uCCAD)
- suggestion: \uC81C\uC548 \uB313\uAE00 (\uCF58\uD150\uCE20 \uC694\uCCAD, \uAC1C\uC120\uC810, \uC544\uC774\uB514\uC5B4)
- negative: \uBD80\uC815\uC801\uC778 \uB313\uAE00 (\uBE44\uB09C, \uC545\uD50C, \uBD88\uB9CC)
- positive: \uAE0D\uC815\uC801\uC778 \uB313\uAE00 (\uCE6D\uCC2C, \uC751\uC6D0, \uAC10\uC0AC)
- reaction: \uB2E8\uC21C \uBC18\uC751 (\u314B\u314B, \uC640, \u314E\u314E \uB4F1)
- other: \uC704 \uCE74\uD14C\uACE0\uB9AC\uC5D0 \uD574\uB2F9\uD558\uC9C0 \uC54A\uB294 \uAE30\uD0C0

## \uBD84\uB958 \uC6B0\uC120\uC21C\uC704 (\uC911\uC694!)
\uB313\uAE00\uC5D0 \uC5EC\uB7EC \uC758\uB3C4\uAC00 \uC11E\uC5EC\uC788\uC73C\uBA74 \uB2E4\uC74C \uC6B0\uC120\uC21C\uC704\uB85C \uBD84\uB958:
1. question (\uC9C8\uBB38\uC774 \uD558\uB098\uB77C\uB3C4 \uC788\uC73C\uBA74 question)
2. suggestion (\uC81C\uC548/\uC694\uCCAD\uC774 \uC788\uC73C\uBA74 suggestion)
3. negative (\uBD80\uC815\uC801 \uB0B4\uC6A9)
4. positive (\uAE0D\uC815\uC801 \uB0B4\uC6A9)
5. reaction/other

## \uC9C8\uBB38 \uD310\uBCC4 \uAE30\uC900
\uB2E4\uC74C \uD328\uD134\uC774 \uD3EC\uD568\uB418\uBA74 question\uC73C\uB85C \uBD84\uB958:
- \uC9C1\uC811 \uC9C8\uBB38: "~\uC778\uAC00\uC694?", "~\uD560\uAE4C\uC694?", "~\uD558\uB098\uC694?"
- \uAC04\uC811 \uC9C8\uBB38: "~\uBB58\uAE4C\uC694?", "~\uBB54\uAC00\uC694?", "~\uC77C\uAE4C\uC694?"
- \uAD81\uAE08 \uD45C\uD604: "\uAD81\uAE08", "\uC54C\uACE0\uC2F6", "\uC5B4\uB5BB\uAC8C"
- \uBB3C\uC74C\uD45C(?)\uAC00 \uC788\uACE0 \uC815\uBCF4\uB97C \uBB3B\uB294 \uB9E5\uB77D

\uBC18\uB4DC\uC2DC \uB2E4\uC74C JSON \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD558\uC138\uC694:
{"type": "\uBD84\uB958\uACB0\uACFC"}

\uC608\uC2DC:
- "\uC774 \uBD80\uBD84 \uC5B4\uB5BB\uAC8C \uD558\uB294 \uAC74\uAC00\uC694?" \u2192 {"type": "question"}
- "\uC800 \uD234\uC740 \uBB58\uAE4C\uC694?" \u2192 {"type": "question"}
- "\uC798 \uBD24\uC5B4\uC694! \uADFC\uB370 \uC774\uAC74 \uBB54\uAC00\uC694?" \u2192 {"type": "question"} (\uC9C8\uBB38 \uC6B0\uC120)
- "\uC88B\uC544\uC694! \uB2E4\uC74C\uC5D4 \uC774\uB7F0 \uB0B4\uC6A9\uB3C4 \uD574\uC8FC\uC138\uC694" \u2192 {"type": "suggestion"} (\uC81C\uC548 \uC6B0\uC120)
- "\uB2E4\uC74C\uC5D4 \uC774\uB7F0 \uC8FC\uC81C \uB2E4\uB904\uC8FC\uC138\uC694" \u2192 {"type": "suggestion"}
- "\uC601\uC0C1 \uB108\uBB34 \uC88B\uC544\uC694! \uC751\uC6D0\uD569\uB2C8\uB2E4" \u2192 {"type": "positive"}
- "\uC774\uAC8C \uBB50\uC57C \uC2DC\uAC04\uB0AD\uBE44" \u2192 {"type": "negative"}
- "\u314B\u314B\u314B\u314B" \u2192 {"type": "reaction"}
- "\uC548\uB155\uD558\uC138\uC694" \u2192 {"type": "other"}`;
  const userMessage = `\uB2E4\uC74C \uB313\uAE00\uC744 \uBD84\uB958\uD574\uC8FC\uC138\uC694:

"${text}"`;
  const result = await callLLM(env, MODEL_CLASSIFY, systemPrompt, userMessage, options);
  try {
    const jsonMatch = result.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.type && ["positive", "negative", "question", "suggestion", "reaction", "other"].includes(parsed.type)) {
        return { type: parsed.type };
      }
    }
  } catch {
    console.error("Failed to parse classification result:", result);
  }
  return { type: "other" };
}
var ATTITUDE_PROMPTS = {
  gratitude: `\uAC10\uC0AC\uC758 \uB9C8\uC74C\uC744 \uB2F4\uC544 \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uC9C4\uC2EC\uC5B4\uB9B0 \uAC10\uC0AC \uD45C\uD604
- \uB530\uB73B\uD558\uACE0 \uACB8\uC190\uD55C \uD0DC\uB3C4
- \uC2DC\uCCAD\uC790\uC758 \uC751\uC6D0\uC5D0 \uD798\uC785\uC5B4 \uB354 \uB178\uB825\uD558\uACA0\uB2E4\uB294 \uC758\uC9C0`,
  graceful: `\uD488\uC704\uC788\uAC8C \uB300\uCC98\uD569\uB2C8\uB2E4.
- \uC808\uB300 \uBC29\uC5B4\uC801\uC774\uC9C0 \uC54A\uAC8C
- \uBE44\uB09C\uC5D0\uB3C4 \uAC10\uC0AC\uD568 \uD45C\uD604
- \uAC74\uC124\uC801\uC778 \uD53C\uB4DC\uBC31\uC73C\uB85C \uBC1B\uC544\uB4E4\uC774\uAE30
- \uB354 \uB098\uC740 \uCF58\uD150\uCE20\uB97C \uB9CC\uB4E4\uACA0\uB2E4\uB294 \uC57D\uC18D`,
  expert: `\uCE5C\uC808\uD55C \uC804\uBB38\uAC00\uB85C\uC11C \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uC815\uD655\uD558\uACE0 \uB3C4\uC6C0\uC774 \uB418\uB294 \uC815\uBCF4 \uC81C\uACF5
- \uC26C\uC6B4 \uC124\uBA85
- \uCD94\uAC00 \uC9C8\uBB38 \uD658\uC601\uD558\uB294 \uD0DC\uB3C4`,
  empathy: `\uACF5\uAC10\uD558\uBA70 \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uC81C\uC548\uC5D0 \uB300\uD55C \uAC10\uC0AC
- \uC2DC\uCCAD\uC790 \uC758\uACAC \uC874\uC911
- \uAC80\uD1A0\uD558\uACA0\uB2E4\uB294 \uC5F4\uB9B0 \uD0DC\uB3C4`,
  humor: `\uC720\uBA38\uB7EC\uC2A4\uD558\uAC8C \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uAC00\uBCCD\uACE0 \uC7AC\uBBF8\uC788\uAC8C
- \uCE5C\uADFC\uD55C \uB9D0\uD22C
- \uC774\uBAA8\uC9C0 \uD65C\uC6A9 \uAC00\uB2A5`,
  friendly: `\uCE5C\uADFC\uD558\uAC8C \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uB530\uB73B\uD558\uACE0 \uD3B8\uC548\uD55C \uB9D0\uD22C
- \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uB300\uD654\uCCB4
- \uC2DC\uCCAD\uC790\uC640 \uCE5C\uAD6C\uCC98\uB7FC`
};
function getTypeInstructionPrompt(type, settings) {
  const typeInstruction = settings.typeInstructions?.[type];
  if (!typeInstruction?.instruction) {
    return ATTITUDE_PROMPTS[settings.attitudeMap?.[type] || "friendly"];
  }
  return `## \uC774 \uC720\uD615(${type})\uC5D0 \uB300\uD55C \uCD94\uAC00 \uC9C0\uCE68:
${typeInstruction.instruction}`;
}
async function generateReplyForComment(env, comment, settings, options) {
  if (isPromptInjection(comment.text)) {
    console.log(`[Injection detected] Comment ID: ${comment.id}`);
    return getWittyInjectionResponse();
  }
  const type = comment.type || "other";
  const attitude = comment.attitude || "friendly";
  const attitudePrompt = ATTITUDE_PROMPTS[attitude];
  const typeInstructionPrompt = getTypeInstructionPrompt(type, settings);
  const commonInstructions = settings.commonInstructions || settings.customInstructions || "";
  const systemPrompt = `\uB2F9\uC2E0\uC740 "${settings.persona}" \uC720\uD29C\uBE0C \uCC44\uB110\uC744 \uC6B4\uC601\uD558\uB294 \uD06C\uB9AC\uC5D0\uC774\uD130\uC785\uB2C8\uB2E4.

\uB9D0\uD22C: ${settings.tone}

## \uACF5\uD1B5 \uC751\uB2F5 \uC9C0\uCE68:
${commonInstructions}

## \uD604\uC7AC \uB313\uAE00 \uC720\uD615: ${type}

${typeInstructionPrompt}`;
  const userMessage = `\uC601\uC0C1 \uC81C\uBAA9: ${comment.videoTitle}

\uB313\uAE00 \uB0B4\uC6A9:
"${comment.text}"

\uC774 \uB313\uAE00\uC5D0 \uB300\uD55C \uC751\uB2F5\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694.`;
  return await callLLM(env, MODEL_REPLY, systemPrompt, userMessage, options);
}
function buildTypeInstructionsPrompt(settings) {
  if (!settings.typeInstructions) {
    return Object.entries(ATTITUDE_PROMPTS).map(([key, value]) => `- ${key}: ${value.split("\n")[0]}`).join("\n");
  }
  const types = ["positive", "negative", "question", "suggestion", "reaction", "other"];
  return types.map((type) => {
    const instruction = settings.typeInstructions[type];
    if (!instruction?.instruction)
      return `- ${type}: \uAE30\uBCF8 \uC751\uB2F5`;
    return `- ${type}: ${instruction.instruction}`;
  }).join("\n");
}
async function generateRepliesForComments(env, comments, settings, options) {
  if (comments.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const replies = /* @__PURE__ */ new Map();
  const injectionComments = comments.filter((c) => isPromptInjection(c.text));
  const normalComments = comments.filter((c) => !isPromptInjection(c.text));
  for (const comment of injectionComments) {
    console.log(`[Injection detected] Comment ID: ${comment.id}`);
    replies.set(comment.id, getWittyInjectionResponse());
  }
  const enabledComments = normalComments.filter((c) => {
    const type = c.type || "other";
    const typeInstruction = settings.typeInstructions?.[type];
    return !typeInstruction || typeInstruction.enabled !== false;
  });
  if (enabledComments.length === 0) {
    return replies;
  }
  const commentsData = enabledComments.map((c, idx) => ({
    index: idx + 1,
    id: c.id,
    videoTitle: c.videoTitle,
    text: c.text,
    type: c.type,
    attitude: c.attitude
  }));
  const typeInstructionsPrompt = buildTypeInstructionsPrompt(settings);
  const commonInstructions = settings.commonInstructions || settings.customInstructions || "";
  const systemPrompt = `\uB2F9\uC2E0\uC740 "${settings.persona}" \uC720\uD29C\uBE0C \uCC44\uB110\uC744 \uC6B4\uC601\uD558\uB294 \uD06C\uB9AC\uC5D0\uC774\uD130\uC785\uB2C8\uB2E4.

\uB9D0\uD22C: ${settings.tone}

## \uACF5\uD1B5 \uC751\uB2F5 \uC9C0\uCE68:
${commonInstructions}

## \uB313\uAE00 \uC720\uD615\uBCC4 \uCD94\uAC00 \uC9C0\uCE68:
${typeInstructionsPrompt}

\uBC18\uB4DC\uC2DC \uB2E4\uC74C JSON \uBC30\uC5F4 \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD558\uC138\uC694:
[
  {"id": "\uB313\uAE00ID1", "reply": "\uC751\uB2F5\uB0B4\uC6A91"},
  {"id": "\uB313\uAE00ID2", "reply": "\uC751\uB2F5\uB0B4\uC6A92"}
]`;
  const userMessage = `\uB2E4\uC74C ${enabledComments.length}\uAC1C\uC758 \uB313\uAE00\uC5D0 \uB300\uD574 \uAC01\uAC01 \uC751\uB2F5\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694:

${JSON.stringify(commentsData, null, 2)}`;
  const result = await callLLM(env, MODEL_REPLY, systemPrompt, userMessage, options);
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      for (const item of parsed) {
        if (item.id && item.reply) {
          replies.set(item.id, item.reply);
        }
      }
    }
  } catch (error) {
    console.error("Failed to parse batch replies:", error, result);
  }
  return replies;
}
async function replyToComment(env, commentId, text, channel) {
  if (channel) {
    const { postReplyWithChannel: postReplyWithChannel2 } = await Promise.resolve().then(() => (init_youtube_channel(), youtube_channel_exports));
    await postReplyWithChannel2(env, channel, commentId, text);
  } else {
    await postReply(env, commentId, text);
  }
}

// src/routes/api.ts
var api = new Hono2();
function getLLMOptions(c) {
  const user2 = c.get("user");
  return {
    apiKey: user2?.openrouterApiKey
  };
}
api.get("/comments", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const status = c.req.query("status") || "all";
  const result = await getComments(c.env.KV, { page, limit, status });
  const lastFetchedAt = await getLastFetchedAt(c.env.KV);
  return c.json({
    success: true,
    data: {
      ...result,
      lastFetchedAt
    }
  });
});
api.get("/stats", async (c) => {
  const stats = await getStats(c.env.KV);
  const lastFetchedAt = await getLastFetchedAt(c.env.KV);
  return c.json({
    success: true,
    data: {
      ...stats,
      lastFetchedAt
    }
  });
});
api.post("/fetch", async (c) => {
  try {
    const result = await fetchComments(c.env);
    return c.json({
      success: true,
      data: result,
      message: `${result.newComments}\uAC1C\uC758 \uC0C8 \uB313\uAE00\uC744 \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.`
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch comments"
    }, 500);
  }
});
api.post("/classify", async (c) => {
  try {
    const unclassifiedComments = await getUnclassifiedComments(c.env.KV);
    if (unclassifiedComments.length === 0) {
      return c.json({
        success: true,
        data: { classified: 0 },
        message: "\uBD84\uB958\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const settings = await getSettings(c.env.KV);
    let classifiedCount = 0;
    const errors = [];
    const llmOptions = getLLMOptions(c);
    for (const comment of unclassifiedComments) {
      try {
        const classification = await classifyComment(c.env, comment.text, llmOptions);
        await updateComment(c.env.KV, comment.id, {
          type: classification.type,
          attitude: settings.attitudeMap[classification.type],
          status: "pending"
        });
        classifiedCount++;
      } catch (error) {
        console.error(`Classify error for ${comment.id}:`, error);
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return c.json({
      success: true,
      data: {
        classified: classifiedCount,
        total: unclassifiedComments.length,
        errors: errors.length > 0 ? errors : void 0
      },
      message: `${classifiedCount}\uAC1C\uC758 \uB313\uAE00\uC744 \uBD84\uB958\uD588\uC2B5\uB2C8\uB2E4.`
    });
  } catch (error) {
    console.error("Classify error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to classify comments"
    }, 500);
  }
});
api.post("/generate", async (c) => {
  try {
    const pendingComments = await getPendingComments(c.env.KV);
    if (pendingComments.length === 0) {
      return c.json({
        success: true,
        data: { generated: 0 },
        message: "\uC751\uB2F5\uC744 \uC0DD\uC131\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const settings = await getSettings(c.env.KV);
    const llmOptions = getLLMOptions(c);
    let generatedCount = 0;
    const errors = [];
    const repliesMap = await generateRepliesForComments(c.env, pendingComments, settings, llmOptions);
    for (const comment of pendingComments) {
      const replyText = repliesMap.get(comment.id);
      if (replyText) {
        try {
          await updateComment(c.env.KV, comment.id, {
            status: "generated",
            replyText,
            generatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          generatedCount++;
        } catch (error) {
          console.error(`Update error for ${comment.id}:`, error);
          errors.push(`${comment.id}: ${error instanceof Error ? error.message : "Update failed"}`);
        }
      } else {
        errors.push(`${comment.id}: \uC751\uB2F5 \uC0DD\uC131 \uC2E4\uD328`);
      }
    }
    return c.json({
      success: true,
      data: {
        generated: generatedCount,
        total: pendingComments.length,
        errors: errors.length > 0 ? errors : void 0
      },
      message: `${generatedCount}\uAC1C\uC758 \uC751\uB2F5\uC744 \uC0DD\uC131\uD588\uC2B5\uB2C8\uB2E4. \uD655\uC778 \uD6C4 \uC2B9\uC778\uD574\uC8FC\uC138\uC694.`
    });
  } catch (error) {
    console.error("Generate error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate replies"
    }, 500);
  }
});
api.put("/comments/:id/reply", async (c) => {
  const commentId = c.req.param("id");
  try {
    const body = await c.req.json();
    if (!body.replyText || body.replyText.trim() === "") {
      return c.json({
        success: false,
        error: "\uC751\uB2F5 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    await updateComment(c.env.KV, commentId, {
      replyText: body.replyText.trim(),
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "\uC751\uB2F5\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error(`Edit reply error for ${commentId}:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit reply"
    }, 500);
  }
});
api.post("/comments/:id/approve", async (c) => {
  const commentId = c.req.param("id");
  try {
    const comments = await getComments(c.env.KV, { status: "generated", limit: 1e3 });
    const comment = comments.comments.find((c2) => c2.id === commentId);
    if (!comment) {
      return c.json({
        success: false,
        error: "\uC2B9\uC778\uD560 \uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 404);
    }
    if (!comment.replyText) {
      return c.json({
        success: false,
        error: "\uC0DD\uC131\uB41C \uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 400);
    }
    await replyToComment(c.env, comment.id, comment.replyText);
    await updateComment(c.env.KV, commentId, {
      status: "replied",
      repliedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "\uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error(`Approve error for ${commentId}:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve comment"
    }, 500);
  }
});
api.post("/approve-all", async (c) => {
  try {
    const generatedComments = await getGeneratedComments(c.env.KV);
    if (generatedComments.length === 0) {
      return c.json({
        success: true,
        data: { approved: 0 },
        message: "\uC2B9\uC778\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    let approvedCount = 0;
    const errors = [];
    for (const comment of generatedComments) {
      try {
        if (!comment.replyText)
          continue;
        await replyToComment(c.env, comment.id, comment.replyText);
        await updateComment(c.env.KV, comment.id, {
          status: "replied",
          repliedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        approvedCount++;
      } catch (error) {
        console.error(`Approve error for ${comment.id}:`, error);
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return c.json({
      success: true,
      data: {
        approved: approvedCount,
        total: generatedComments.length,
        errors: errors.length > 0 ? errors : void 0
      },
      message: `${approvedCount}\uAC1C\uC758 \uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    });
  } catch (error) {
    console.error("Approve-all error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve comments"
    }, 500);
  }
});
api.post("/comments/:id/reply", async (c) => {
  const commentId = c.req.param("id");
  try {
    const body = await c.req.json();
    const comments = await getComments(c.env.KV, { status: "all", limit: 1e3 });
    const comment = comments.comments.find((c2) => c2.id === commentId);
    if (!comment) {
      return c.json({
        success: false,
        error: "Comment not found"
      }, 404);
    }
    const settings = await getSettings(c.env.KV);
    const llmOptions = getLLMOptions(c);
    const replyText = body.customReply || await generateReplyForComment(c.env, comment, settings, llmOptions);
    await replyToComment(c.env, comment.id, replyText);
    await updateComment(c.env.KV, commentId, {
      status: "replied",
      replyText,
      repliedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      data: { replyText },
      message: "\uB313\uAE00\uC5D0 \uC751\uB2F5\uD588\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error(`Reply error for ${commentId}:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to reply"
    }, 500);
  }
});
api.get("/settings", async (c) => {
  const settings = await getSettings(c.env.KV);
  return c.json({
    success: true,
    data: settings
  });
});
api.put("/settings", async (c) => {
  try {
    const body = await c.req.json();
    await saveSettings(c.env.KV, body);
    return c.json({
      success: true,
      message: "\uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to save settings"
    }, 500);
  }
});
var api_default = api;

// src/lib/auth.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}
async function verifyPassword(password, storedHash) {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const storedHashBytes = combined.slice(16);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(hash);
  if (hashArray.length !== storedHashBytes.length)
    return false;
  let result = 0;
  for (let i = 0; i < hashArray.length; i++) {
    const a = hashArray[i];
    const b = storedHashBytes[i];
    if (a !== void 0 && b !== void 0) {
      result |= a ^ b;
    }
  }
  return result === 0;
}
function base64UrlEncode(data) {
  const str = typeof data === "string" ? data : String.fromCharCode(...data);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - base64.length % 4) % 4;
  const padded = base64 + "=".repeat(padding);
  return atob(padded);
}
async function createSignature(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}
async function verifySignature(data, signature, secret) {
  const expectedSignature = await createSignature(data, secret);
  return signature === expectedSignature;
}
async function createToken(payload, secret, expiresIn = 7 * 24 * 60 * 60) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const now = Math.floor(Date.now() / 1e3);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;
  const signature = await createSignature(dataToSign, secret);
  return `${dataToSign}.${signature}`;
}
async function verifyToken(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      return null;
    const headerEncoded = parts[0];
    const payloadEncoded = parts[1];
    const signature = parts[2];
    if (!headerEncoded || !payloadEncoded || !signature)
      return null;
    const dataToVerify = `${headerEncoded}.${payloadEncoded}`;
    const isValid = await verifySignature(dataToVerify, signature, secret);
    if (!isValid)
      return null;
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now)
      return null;
    return payload;
  } catch {
    return null;
  }
}
function generateId() {
  return crypto.randomUUID();
}

// src/routes/auth.ts
var auth = new Hono2();
auth.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.email || !body.password || !body.name) {
      return c.json({
        success: false,
        error: "\uC774\uBA54\uC77C, \uBE44\uBC00\uBC88\uD638, \uC774\uB984\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({
        success: false,
        error: "\uC720\uD6A8\uD55C \uC774\uBA54\uC77C \uC8FC\uC18C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    if (body.password.length < 6) {
      return c.json({
        success: false,
        error: "\uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."
      }, 400);
    }
    if (await emailExists(c.env.KV, body.email)) {
      return c.json({
        success: false,
        error: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4."
      }, 409);
    }
    const passwordHash = await hashPassword(body.password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const user2 = {
      id: generateId(),
      email: body.email.toLowerCase(),
      passwordHash,
      name: body.name,
      role: "user",
      // 기본 역할
      createdAt: now,
      updatedAt: now
    };
    await saveUser(c.env.KV, user2);
    const token = await createToken(
      { userId: user2.id, email: user2.email, role: user2.role },
      c.env.JWT_SECRET
    );
    return c.json({
      success: true,
      token,
      user: {
        id: user2.id,
        email: user2.email,
        name: user2.name,
        role: user2.role
      }
    }, 201);
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({
      success: false,
      error: "\uD68C\uC6D0\uAC00\uC785 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.email || !body.password) {
      return c.json({
        success: false,
        error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    const user2 = await getUserByEmail(c.env.KV, body.email);
    if (!user2) {
      return c.json({
        success: false,
        error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, 401);
    }
    const isValid = await verifyPassword(body.password, user2.passwordHash);
    if (!isValid) {
      return c.json({
        success: false,
        error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, 401);
    }
    await updateUser(c.env.KV, user2.id, {
      lastLoginAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const token = await createToken(
      { userId: user2.id, email: user2.email, role: user2.role },
      c.env.JWT_SECRET
    );
    return c.json({
      success: true,
      token,
      user: {
        id: user2.id,
        email: user2.email,
        name: user2.name,
        role: user2.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({
      success: false,
      error: "\uB85C\uADF8\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
auth.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({
        success: false,
        error: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      }, 401);
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({
        success: false,
        error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uD1A0\uD070\uC785\uB2C8\uB2E4."
      }, 401);
    }
    const user2 = await getUserById(c.env.KV, payload.userId);
    if (!user2) {
      return c.json({
        success: false,
        error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 404);
    }
    return c.json({
      success: true,
      user: {
        id: user2.id,
        email: user2.email,
        name: user2.name,
        role: user2.role
      }
    });
  } catch (error) {
    console.error("Get me error:", error);
    return c.json({
      success: false,
      error: "\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
auth.post("/refresh", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({
        success: false,
        error: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      }, 401);
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({
        success: false,
        error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uD1A0\uD070\uC785\uB2C8\uB2E4."
      }, 401);
    }
    const user2 = await getUserById(c.env.KV, payload.userId);
    if (!user2) {
      return c.json({
        success: false,
        error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 404);
    }
    const newToken = await createToken(
      { userId: user2.id, email: user2.email, role: user2.role },
      c.env.JWT_SECRET
    );
    return c.json({
      success: true,
      token: newToken,
      user: {
        id: user2.id,
        email: user2.email,
        name: user2.name,
        role: user2.role
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return c.json({
      success: false,
      error: "\uD1A0\uD070 \uAC31\uC2E0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
var auth_default = auth;

// src/routes/user.ts
var user = new Hono2();
user.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({
      success: false,
      error: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
    }, 401);
  }
  const token = authHeader.substring(7);
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({
      success: false,
      error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uD1A0\uD070\uC785\uB2C8\uB2E4."
    }, 401);
  }
  const userData = await getUserById(c.env.KV, payload.userId);
  if (!userData) {
    return c.json({
      success: false,
      error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    }, 404);
  }
  c.set("user", userData);
  c.set("payload", payload);
  await next();
});
user.put("/apikey", async (c) => {
  try {
    const userData = c.get("user");
    const body = await c.req.json();
    if (!body.apiKey) {
      return c.json({
        success: false,
        error: "API Key\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    if (!body.apiKey.startsWith("sk-or-")) {
      return c.json({
        success: false,
        error: "\uC62C\uBC14\uB978 OpenRouter API Key \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4."
      }, 400);
    }
    await updateUser(c.env.KV, userData.id, {
      openrouterApiKey: body.apiKey,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "API Key\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error("Save API Key error:", error);
    return c.json({
      success: false,
      error: "API Key \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
user.delete("/apikey", async (c) => {
  try {
    const userData = c.get("user");
    await updateUser(c.env.KV, userData.id, {
      openrouterApiKey: void 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "API Key\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error("Delete API Key error:", error);
    return c.json({
      success: false,
      error: "API Key \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
user.put("/password", async (c) => {
  try {
    const userData = c.get("user");
    const body = await c.req.json();
    if (!body.currentPassword || !body.newPassword) {
      return c.json({
        success: false,
        error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    if (body.newPassword.length < 6) {
      return c.json({
        success: false,
        error: "\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."
      }, 400);
    }
    const isValid = await verifyPassword(body.currentPassword, userData.passwordHash);
    if (!isValid) {
      return c.json({
        success: false,
        error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, 401);
    }
    const newPasswordHash = await hashPassword(body.newPassword);
    await updateUser(c.env.KV, userData.id, {
      passwordHash: newPasswordHash,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error("Change password error:", error);
    return c.json({
      success: false,
      error: "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, 500);
  }
});
user.get("/me", async (c) => {
  const userData = c.get("user");
  return c.json({
    success: true,
    data: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      hasApiKey: !!userData.openrouterApiKey,
      createdAt: userData.createdAt
    }
  });
});
var user_default = user;

// src/routes/channels.ts
init_youtube_channel();
function getLLMOptions2(user2) {
  return {
    apiKey: user2?.openrouterApiKey
  };
}
var channels = new Hono2();
channels.get("/", async (c) => {
  const user2 = c.get("user");
  const userChannels = await getUserChannelsData(c.env.KV, user2.id);
  const safeChannels = userChannels.map((ch) => ({
    id: ch.id,
    youtubeChannelId: ch.youtube.channelId,
    channelTitle: ch.youtube.channelTitle,
    isActive: ch.isActive,
    schedule: ch.schedule,
    createdAt: ch.createdAt,
    lastFetchedAt: ch.lastFetchedAt,
    lastApprovedAt: ch.lastApprovedAt
  }));
  return c.json({
    success: true,
    data: safeChannels
  });
});
channels.get("/oauth-url", async (c) => {
  const baseUrl = new URL(c.req.url).origin;
  const redirectUri = `${baseUrl}/api/channels/oauth/callback`;
  const params = new URLSearchParams({
    client_id: c.env.YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.force-ssl",
    access_type: "offline",
    prompt: "consent"
  });
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return c.json({
    success: true,
    data: { url: oauthUrl, redirectUri }
  });
});
channels.get("/oauth/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  if (error) {
    return c.redirect(`/dashboard?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return c.redirect("/dashboard?error=No authorization code");
  }
  try {
    const user2 = c.get("user");
    const baseUrl = new URL(c.req.url).origin;
    const redirectUri = `${baseUrl}/api/channels/oauth/callback`;
    const channelInfo = await exchangeCodeForChannel(c.env, code, redirectUri);
    const existingChannel = await getChannelByYouTubeId(c.env.KV, channelInfo.channelId);
    if (existingChannel) {
      await updateChannel(c.env.KV, existingChannel.id, {
        youtube: {
          ...existingChannel.youtube,
          accessToken: channelInfo.accessToken,
          refreshToken: channelInfo.refreshToken,
          expiresAt: channelInfo.expiresAt
        }
      });
      return c.redirect(`/dashboard?success=Channel reconnected&channelId=${existingChannel.id}`);
    }
    const channelId = crypto.randomUUID();
    const newChannel = {
      id: channelId,
      userId: user2.id,
      youtube: {
        accessToken: channelInfo.accessToken,
        refreshToken: channelInfo.refreshToken,
        expiresAt: channelInfo.expiresAt,
        channelId: channelInfo.channelId,
        channelTitle: channelInfo.channelTitle
      },
      settings: DEFAULT_SETTINGS,
      schedule: DEFAULT_SCHEDULE,
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await saveChannel(c.env.KV, newChannel);
    return c.redirect(`/dashboard?success=Channel registered&channelId=${channelId}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return c.redirect(`/dashboard?error=${encodeURIComponent(err instanceof Error ? err.message : "Unknown error")}`);
  }
});
channels.get("/:id", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  const safeChannel = {
    id: channel.id,
    youtubeChannelId: channel.youtube.channelId,
    channelTitle: channel.youtube.channelTitle,
    settings: channel.settings,
    schedule: channel.schedule,
    isActive: channel.isActive,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
    lastFetchedAt: channel.lastFetchedAt,
    lastApprovedAt: channel.lastApprovedAt
  };
  return c.json({
    success: true,
    data: safeChannel
  });
});
channels.get("/:id/stats", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  const stats = await getChannelStats(c.env.KV, channelId);
  return c.json({
    success: true,
    data: {
      ...stats,
      lastFetchedAt: channel.lastFetchedAt,
      lastApprovedAt: channel.lastApprovedAt
    }
  });
});
channels.get("/:id/comments", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const status = c.req.query("status") || "all";
  const result = await getChannelComments(c.env.KV, channelId, { page, limit, status });
  return c.json({
    success: true,
    data: result
  });
});
channels.put("/:id/schedule", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const body = await c.req.json();
    if (body.approveTimes) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const time2 of body.approveTimes) {
        if (!timeRegex.test(time2)) {
          return c.json({
            success: false,
            error: `Invalid time format: ${time2}. Use HH:MM format.`
          }, 400);
        }
      }
    }
    const updatedSchedule = {
      ...channel.schedule,
      ...body
    };
    await updateChannel(c.env.KV, channelId, { schedule: updatedSchedule });
    return c.json({
      success: true,
      message: "\uC2A4\uCF00\uC904\uC774 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      data: updatedSchedule
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to update schedule"
    }, 500);
  }
});
channels.put("/:id/settings", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const body = await c.req.json();
    const updatedSettings = {
      ...channel.settings,
      ...body
    };
    await updateChannel(c.env.KV, channelId, { settings: updatedSettings });
    return c.json({
      success: true,
      message: "\uC124\uC815\uC774 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      data: updatedSettings
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to update settings"
    }, 500);
  }
});
channels.put("/:id/toggle", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  await updateChannel(c.env.KV, channelId, { isActive: !channel.isActive });
  return c.json({
    success: true,
    message: channel.isActive ? "\uCC44\uB110\uC774 \uBE44\uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uCC44\uB110\uC774 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    data: { isActive: !channel.isActive }
  });
});
channels.post("/:id/fetch", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const rawComments = await fetchChannelComments(c.env, channel);
    let newComments = 0;
    let existingComments = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const rawComment of rawComments) {
      const exists = await channelCommentExists(c.env.KV, channelId, rawComment.id);
      if (!exists) {
        await saveChannelComment(c.env.KV, channelId, {
          id: rawComment.id,
          channelId,
          videoId: rawComment.videoId,
          videoTitle: rawComment.videoTitle,
          authorName: rawComment.authorName,
          authorChannelId: rawComment.authorChannelId,
          text: rawComment.text,
          publishedAt: rawComment.publishedAt,
          fetchedAt: now,
          status: rawComment.status,
          replyText: rawComment.replyText
        });
        newComments++;
      } else {
        existingComments++;
      }
    }
    await setChannelLastFetchedAt(c.env.KV, channelId, (/* @__PURE__ */ new Date()).toISOString());
    return c.json({
      success: true,
      data: {
        newComments,
        existingComments,
        total: rawComments.length,
        channelId
      },
      message: `${newComments}\uAC1C\uC758 \uC0C8 \uB313\uAE00\uC744 \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.`
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch comments"
    }, 500);
  }
});
channels.post("/:id/classify", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const unclassifiedComments = await getChannelCommentsByStatus(c.env.KV, channelId, "unclassified");
    if (unclassifiedComments.length === 0) {
      return c.json({
        success: true,
        data: { classified: 0, channelId },
        message: "\uBD84\uB958\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const settings = channel.settings;
    let classifiedCount = 0;
    const errors = [];
    const llmOptions = getLLMOptions2(user2);
    for (const comment of unclassifiedComments) {
      try {
        const classification = await classifyComment(c.env, comment.text, llmOptions);
        await updateChannelComment(c.env.KV, channelId, comment.id, {
          type: classification.type,
          attitude: settings.attitudeMap[classification.type],
          status: "pending"
        });
        classifiedCount++;
      } catch (error) {
        console.error(`Classify error for ${comment.id}:`, error);
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return c.json({
      success: true,
      data: {
        classified: classifiedCount,
        total: unclassifiedComments.length,
        errors: errors.length > 0 ? errors : void 0,
        channelId
      },
      message: `${classifiedCount}\uAC1C\uC758 \uB313\uAE00\uC744 \uBD84\uB958\uD588\uC2B5\uB2C8\uB2E4.`
    });
  } catch (error) {
    console.error("Classify error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to classify comments"
    }, 500);
  }
});
channels.post("/:id/generate", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const pendingComments = await getChannelCommentsByStatus(c.env.KV, channelId, "pending");
    if (pendingComments.length === 0) {
      return c.json({
        success: true,
        data: { generated: 0, channelId },
        message: "\uC751\uB2F5\uC744 \uC0DD\uC131\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const settings = channel.settings;
    const llmOptions = getLLMOptions2(user2);
    let generatedCount = 0;
    const errors = [];
    const repliesMap = await generateRepliesForComments(c.env, pendingComments, settings, llmOptions);
    for (const comment of pendingComments) {
      const replyText = repliesMap.get(comment.id);
      if (replyText) {
        try {
          await updateChannelComment(c.env.KV, channelId, comment.id, {
            status: "generated",
            replyText,
            generatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          generatedCount++;
        } catch (error) {
          console.error(`Update error for ${comment.id}:`, error);
          errors.push(`${comment.id}: ${error instanceof Error ? error.message : "Update failed"}`);
        }
      } else {
        errors.push(`${comment.id}: \uC751\uB2F5 \uC0DD\uC131 \uC2E4\uD328`);
      }
    }
    return c.json({
      success: true,
      data: {
        generated: generatedCount,
        total: pendingComments.length,
        errors: errors.length > 0 ? errors : void 0,
        channelId
      },
      message: `${generatedCount}\uAC1C\uC758 \uC751\uB2F5\uC744 \uC0DD\uC131\uD588\uC2B5\uB2C8\uB2E4. \uD655\uC778 \uD6C4 \uC2B9\uC778\uD574\uC8FC\uC138\uC694.`
    });
  } catch (error) {
    console.error("Generate error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate replies"
    }, 500);
  }
});
channels.put("/:id/comments/:commentId/reply", async (c) => {
  const channelId = c.req.param("id");
  const commentId = c.req.param("commentId");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const body = await c.req.json();
    if (!body.replyText || body.replyText.trim() === "") {
      return c.json({
        success: false,
        error: "\uC751\uB2F5 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, 400);
    }
    const comment = await getChannelComment(c.env.KV, channelId, commentId);
    if (!comment) {
      return c.json({
        success: false,
        error: "\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 404);
    }
    await updateChannelComment(c.env.KV, channelId, commentId, {
      replyText: body.replyText.trim(),
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "\uC751\uB2F5\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error(`Edit reply error for ${commentId}:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit reply"
    }, 500);
  }
});
channels.delete("/:id/comments/:commentId/reply", async (c) => {
  const channelId = c.req.param("id");
  const commentId = c.req.param("commentId");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const comment = await getChannelComment(c.env.KV, channelId, commentId);
    if (!comment) {
      return c.json({
        success: false,
        error: "\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 404);
    }
    await updateChannelComment(c.env.KV, channelId, commentId, {
      status: "pending",
      replyText: void 0,
      generatedAt: void 0
    });
    return c.json({
      success: true,
      message: '\uC751\uB2F5\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB313\uAE00\uC774 "\uBBF8\uC751\uB2F5" \uC0C1\uD0DC\uB85C \uB3CC\uC544\uAC14\uC2B5\uB2C8\uB2E4.'
    });
  } catch (error) {
    console.error(`Delete reply error for ${commentId}:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete reply"
    }, 500);
  }
});
channels.post("/:id/comments/:commentId/approve", async (c) => {
  const channelId = c.req.param("id");
  const commentId = c.req.param("commentId");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const comment = await getChannelComment(c.env.KV, channelId, commentId);
    if (!comment) {
      return c.json({
        success: false,
        error: "\uC2B9\uC778\uD560 \uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 404);
    }
    if (comment.status !== "generated") {
      return c.json({
        success: false,
        error: "\uC0DD\uC131\uB41C \uC751\uB2F5\uC774 \uC788\uB294 \uB313\uAE00\uB9CC \uC2B9\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      }, 400);
    }
    if (!comment.replyText) {
      return c.json({
        success: false,
        error: "\uC0DD\uC131\uB41C \uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      }, 400);
    }
    await replyToComment(c.env, comment.id, comment.replyText, channel);
    await updateChannelComment(c.env.KV, channelId, commentId, {
      status: "replied",
      repliedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json({
      success: true,
      message: "\uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error(`Approve error for ${commentId}:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve comment"
    }, 500);
  }
});
channels.post("/:id/approve-all", async (c) => {
  const channelId = c.req.param("id");
  const user2 = c.get("user");
  const channel = await getChannelById(c.env.KV, channelId);
  if (!channel) {
    return c.json({ success: false, error: "Channel not found" }, 404);
  }
  if (channel.userId !== user2.id) {
    return c.json({ success: false, error: "Access denied" }, 403);
  }
  try {
    const generatedComments = await getChannelCommentsByStatus(c.env.KV, channelId, "generated");
    if (generatedComments.length === 0) {
      return c.json({
        success: true,
        data: { approved: 0, channelId },
        message: "\uC2B9\uC778\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    let approvedCount = 0;
    const errors = [];
    for (const comment of generatedComments) {
      try {
        if (!comment.replyText)
          continue;
        await replyToComment(c.env, comment.id, comment.replyText, channel);
        await updateChannelComment(c.env.KV, channelId, comment.id, {
          status: "replied",
          repliedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        approvedCount++;
      } catch (error) {
        console.error(`Approve error for ${comment.id}:`, error);
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    await updateChannel(c.env.KV, channelId, { lastApprovedAt: (/* @__PURE__ */ new Date()).toISOString() });
    return c.json({
      success: true,
      data: {
        approved: approvedCount,
        total: generatedComments.length,
        errors: errors.length > 0 ? errors : void 0,
        channelId
      },
      message: `${approvedCount}\uAC1C\uC758 \uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    });
  } catch (error) {
    console.error("Approve-all error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve comments"
    }, 500);
  }
});
var channels_default = channels;

// src/services/scheduler.ts
init_youtube_channel();
function isPauseTime(pauseStart, pauseEnd, timezone = "Asia/Seoul") {
  if (!pauseStart || !pauseEnd)
    return false;
  const now = /* @__PURE__ */ new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const currentTime = formatter.format(now);
  const parts = currentTime.split(":");
  const currentMinutes = parseInt(parts[0] || "0", 10) * 60 + parseInt(parts[1] || "0", 10);
  const startParts = pauseStart.split(":");
  const startMinutes = parseInt(startParts[0] || "0", 10) * 60 + parseInt(startParts[1] || "0", 10);
  const endParts = pauseEnd.split(":");
  const endMinutes = parseInt(endParts[0] || "0", 10) * 60 + parseInt(endParts[1] || "0", 10);
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}
function isApproveTime(approveTimes, timezone) {
  const now = /* @__PURE__ */ new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const currentTime = formatter.format(now);
  const parts = currentTime.split(":");
  const currentHour = parseInt(parts[0] || "0", 10);
  const currentMinute = parseInt(parts[1] || "0", 10);
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  for (const time2 of approveTimes) {
    const timeParts = time2.split(":");
    const hour = parseInt(timeParts[0] || "0", 10);
    const minute = parseInt(timeParts[1] || "0", 10);
    const targetTotalMinutes = hour * 60 + minute;
    const diff = Math.abs(currentTotalMinutes - targetTotalMinutes);
    if (diff <= 15 || diff >= 24 * 60 - 15) {
      return true;
    }
  }
  return false;
}
async function ensureValidToken(env, channel) {
  if (channel.needsReauth) {
    console.log(`[${channel.youtube.channelTitle}] Needs re-auth, skipping`);
    return null;
  }
  const expiresAt = new Date(channel.youtube.expiresAt);
  const now = /* @__PURE__ */ new Date();
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1e3) {
    console.log(`[${channel.youtube.channelTitle}] Refreshing token...`);
    try {
      const newTokens = await refreshChannelToken(env, channel.youtube.refreshToken);
      const updatedChannel = {
        ...channel,
        youtube: {
          ...channel.youtube,
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt
        },
        needsReauth: false,
        lastError: void 0
      };
      await updateChannel(env.KV, channel.id, {
        youtube: updatedChannel.youtube,
        needsReauth: false,
        lastError: void 0
      });
      return updatedChannel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[${channel.youtube.channelTitle}] Token refresh failed: ${errorMessage}`);
      await updateChannel(env.KV, channel.id, {
        needsReauth: true,
        lastError: `\uD1A0\uD070 \uAC31\uC2E0 \uC2E4\uD328: ${errorMessage}`,
        isActive: false
        // 자동으로 비활성화
      });
      return null;
    }
  }
  return channel;
}
async function processChannelFetch(env, channel) {
  const result = { fetched: 0, classified: 0, generated: 0 };
  try {
    if (isPauseTime(channel.schedule.pauseStart, channel.schedule.pauseEnd, channel.schedule.timezone)) {
      console.log(`[${channel.youtube.channelTitle}] In pause time, skipping fetch`);
      result.skipped = "pause_time";
      return result;
    }
    const refreshedChannel = await ensureValidToken(env, channel);
    if (!refreshedChannel) {
      result.skipped = "needs_reauth";
      return result;
    }
    channel = refreshedChannel;
    console.log(`[${channel.youtube.channelTitle}] Fetching comments...`);
    const comments = await fetchChannelComments(env, channel);
    for (const comment of comments) {
      if (await channelCommentExists(env.KV, channel.id, comment.id)) {
        continue;
      }
      const storedComment = {
        ...comment,
        channelId: channel.id,
        status: "unclassified",
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await saveChannelComment(env.KV, channel.id, storedComment);
      result.fetched++;
    }
    console.log(`[${channel.youtube.channelTitle}] Fetched ${result.fetched} new comments`);
    const unclassified = await getChannelCommentsByStatus(env.KV, channel.id, "unclassified");
    for (const comment of unclassified) {
      try {
        const classification = await classifyComment(env, comment.text);
        await updateChannelComment(env.KV, channel.id, comment.id, {
          type: classification.type,
          attitude: channel.settings.attitudeMap[classification.type],
          status: "pending"
        });
        result.classified++;
      } catch (error) {
        console.error(`[${channel.youtube.channelTitle}] Failed to classify ${comment.id}:`, error);
      }
    }
    console.log(`[${channel.youtube.channelTitle}] Classified ${result.classified} comments`);
    const pending = await getChannelCommentsByStatus(env.KV, channel.id, "pending");
    const enabledPending = pending.filter((c) => {
      const type = c.type || "other";
      const typeInstruction = channel.settings.typeInstructions?.[type];
      return !typeInstruction || typeInstruction.enabled !== false;
    });
    if (enabledPending.length > 0) {
      const replies = await generateRepliesForComments(env, enabledPending, channel.settings);
      for (const [commentId, replyText] of replies) {
        await updateChannelComment(env.KV, channel.id, commentId, {
          status: "generated",
          replyText,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        result.generated++;
      }
    }
    console.log(`[${channel.youtube.channelTitle}] Generated ${result.generated} replies`);
    await updateChannel(env.KV, channel.id, {
      lastFetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error(`[${channel.youtube.channelTitle}] Process failed:`, error);
  }
  return result;
}
async function processChannelApprove(env, channel) {
  let approvedCount = 0;
  try {
    if (isPauseTime(channel.schedule.pauseStart, channel.schedule.pauseEnd, channel.schedule.timezone)) {
      console.log(`[${channel.youtube.channelTitle}] In pause time, skipping approve`);
      return 0;
    }
    const refreshedChannel = await ensureValidToken(env, channel);
    if (!refreshedChannel) {
      return 0;
    }
    channel = refreshedChannel;
    const generated = await getChannelCommentsByStatus(env.KV, channel.id, "generated");
    if (generated.length === 0) {
      return 0;
    }
    const now = /* @__PURE__ */ new Date();
    const approveAfterHours = channel.schedule.approveAfterHours;
    const eligibleComments = generated.filter((comment) => {
      if (!approveAfterHours || !comment.generatedAt) {
        return true;
      }
      const generatedAt = new Date(comment.generatedAt);
      const elapsedHours = (now.getTime() - generatedAt.getTime()) / (1e3 * 60 * 60);
      return elapsedHours >= approveAfterHours;
    });
    if (eligibleComments.length === 0) {
      console.log(`[${channel.youtube.channelTitle}] No comments ready for approval (${generated.length} waiting for ${approveAfterHours}h)`);
      return 0;
    }
    console.log(`[${channel.youtube.channelTitle}] Approving ${eligibleComments.length}/${generated.length} replies...`);
    for (const comment of eligibleComments) {
      if (!comment.replyText)
        continue;
      try {
        await postReplyWithChannel(env, channel, comment.id, comment.replyText);
        await updateChannelComment(env.KV, channel.id, comment.id, {
          status: "replied",
          repliedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        approvedCount++;
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      } catch (error) {
        console.error(`[${channel.youtube.channelTitle}] Failed to post reply for ${comment.id}:`, error);
      }
    }
    await updateChannel(env.KV, channel.id, {
      lastApprovedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(`[${channel.youtube.channelTitle}] Approved ${approvedCount} replies`);
  } catch (error) {
    console.error(`[${channel.youtube.channelTitle}] Approve failed:`, error);
  }
  return approvedCount;
}
async function handleFetchSchedule(env) {
  console.log("=== Fetch Schedule Started ===");
  const channels2 = await getActiveChannels(env.KV);
  console.log(`Found ${channels2.length} active channels`);
  for (const channel of channels2) {
    const now = /* @__PURE__ */ new Date();
    const lastFetched = channel.lastFetchedAt ? new Date(channel.lastFetchedAt) : null;
    let shouldFetch = true;
    if (lastFetched) {
      const diffMinutes = (now.getTime() - lastFetched.getTime()) / (1e3 * 60);
      switch (channel.schedule.fetchInterval) {
        case "every15min":
          shouldFetch = diffMinutes >= 14;
          break;
        case "every30min":
          shouldFetch = diffMinutes >= 29;
          break;
        case "hourly":
        default:
          shouldFetch = diffMinutes >= 59;
          break;
      }
    }
    if (shouldFetch) {
      await processChannelFetch(env, channel);
    } else {
      console.log(`[${channel.youtube.channelTitle}] Skipping (not due yet)`);
    }
  }
  console.log("=== Fetch Schedule Completed ===");
}
async function handleApproveSchedule(env) {
  console.log("=== Approve Schedule Started ===");
  const channels2 = await getActiveChannels(env.KV);
  console.log(`Found ${channels2.length} active channels`);
  for (const channel of channels2) {
    if (!channel.schedule.autoApprove) {
      console.log(`[${channel.youtube.channelTitle}] Auto-approve disabled, skipping`);
      continue;
    }
    if (!isApproveTime(channel.schedule.approveTimes, channel.schedule.timezone)) {
      console.log(`[${channel.youtube.channelTitle}] Not approve time, skipping`);
      continue;
    }
    if (channel.lastApprovedAt) {
      const lastApproved = new Date(channel.lastApprovedAt);
      const now = /* @__PURE__ */ new Date();
      const diffMinutes = (now.getTime() - lastApproved.getTime()) / (1e3 * 60);
      if (diffMinutes < 30) {
        console.log(`[${channel.youtube.channelTitle}] Already approved recently, skipping`);
        continue;
      }
    }
    await processChannelApprove(env, channel);
  }
  console.log("=== Approve Schedule Completed ===");
}

// src/routes/schedule.ts
var app = new Hono2();
app.use("*", async (c, next) => {
  const authHeader = c.req.header("X-Cron-Secret");
  const cronSecret = c.env.JWT_SECRET;
  if (!authHeader || authHeader !== cronSecret) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  return next();
});
app.post("/fetch", async (c) => {
  console.log("Schedule API: fetch called");
  try {
    await handleFetchSchedule(c.env);
    return c.json({ success: true, message: "Fetch schedule completed" });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/approve", async (c) => {
  console.log("Schedule API: approve called");
  try {
    await handleApproveSchedule(c.env);
    return c.json({ success: true, message: "Approve schedule completed" });
  } catch (error) {
    console.error("Approve schedule error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
var schedule_default = app;

// src/views/dashboard.ts
async function renderDashboard(env, props) {
  const { currentChannel, userChannels = [], user: user2 } = props || {};
  const stats = currentChannel ? await getChannelStats(env.KV, currentChannel.id) : await getStats(env.KV);
  const lastFetchedAt = currentChannel ? await getChannelLastFetchedAt(env.KV, currentChannel.id) : await getLastFetchedAt(env.KV);
  const hasApiKey = !!user2?.openrouterApiKey;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uBD07</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }

    h1 {
      font-size: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #333;
    }

    .stat-card h3 {
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
    }

    .stat-card .value.unclassified {
      color: #a78bfa;
    }

    .stat-card .value.pending {
      color: #f59e0b;
    }

    .stat-card .value.generated {
      color: #3b82f6;
    }

    .stat-card .value.replied {
      color: #10b981;
    }

    /* API Key \uACBD\uACE0 \uBC30\uB108 */
    .warning-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #422006 0%, #451a03 100%);
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }

    .warning-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .warning-icon {
      font-size: 24px;
    }

    .warning-text strong {
      display: block;
      color: #fcd34d;
      margin-bottom: 2px;
    }

    .warning-text p {
      color: #fde68a;
      font-size: 13px;
      margin: 0;
    }

    .warning-btn {
      background: #f59e0b;
      color: #000;
      padding: 10px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      transition: background 0.2s;
    }

    .warning-btn:hover {
      background: #fbbf24;
    }

    /* \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uAC00\uC774\uB4DC */
    .workflow-guide {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 16px 24px;
      margin-bottom: 20px;
    }

    .workflow-step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      background: #222;
      opacity: 0.5;
      transition: all 0.2s;
    }

    .workflow-step.current {
      opacity: 1;
      background: #172554;
      border: 1px solid #3b82f6;
    }

    .workflow-step.done {
      opacity: 1;
      background: #052e16;
      border: 1px solid #10b981;
    }

    .workflow-step .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .workflow-step.current .step-num {
      background: #3b82f6;
    }

    .workflow-step.done .step-num {
      background: #10b981;
    }

    .workflow-step .step-label {
      font-size: 13px;
      font-weight: 500;
    }

    .workflow-step .step-count {
      font-size: 11px;
      color: #10b981;
      background: #052e16;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .workflow-step .step-count.warning {
      color: #f59e0b;
      background: #422006;
    }

    .workflow-arrow {
      color: #555;
      font-size: 14px;
    }

    .actions {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
    }

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-fetch {
      background: #3b82f6;
      color: white;
    }

    .btn-fetch:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-reply {
      background: #10b981;
      color: white;
    }

    .btn-classify {
      background: #8b5cf6;
      color: white;
    }

    .btn-classify:hover:not(:disabled) {
      background: #7c3aed;
    }

    .btn-generate {
      background: #f59e0b;
      color: white;
    }

    .btn-generate:hover:not(:disabled) {
      background: #d97706;
    }

    .btn-approve {
      background: #10b981;
      color: white;
    }

    .btn-approve:hover:not(:disabled) {
      background: #059669;
    }

    .btn-approve-sm {
      padding: 4px 10px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-approve-sm:hover:not(:disabled) {
      background: #059669;
    }

    .btn-approve-sm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-edit-sm {
      padding: 4px 10px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      margin-right: 5px;
    }

    .btn-edit-sm:hover {
      background: #4b5563;
    }

    .btn-reject-sm {
      padding: 4px 10px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      margin-left: 5px;
    }

    .btn-reject-sm:hover {
      background: #b91c1c;
    }

    /* \uC2B9\uC778 \uB300\uAE30 \uC139\uC158 */
    .pending-approval-section {
      background: #1a1a1a;
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .pending-approval-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .pending-approval-header h2 {
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pending-approval-header .count {
      background: #3b82f6;
      color: white;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 14px;
    }

    .pending-approval-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pending-approval-empty {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .approval-card {
      background: #222;
      border: 1px solid #333;
      border-radius: 10px;
      padding: 16px;
      transition: border-color 0.2s;
    }

    .approval-card:hover {
      border-color: #555;
    }

    .approval-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .approval-card-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .approval-card-meta .author {
      font-weight: 600;
      color: #fff;
    }

    .approval-card-meta .video {
      font-size: 12px;
      color: #888;
    }

    .approval-card-meta .type-badge {
      font-size: 11px;
    }

    .approval-card-time {
      font-size: 11px;
      color: #666;
    }

    .approval-card-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .approval-card-original,
    .approval-card-reply {
      background: #1a1a1a;
      border-radius: 8px;
      padding: 12px;
    }

    .approval-card-original {
      border-left: 3px solid #666;
    }

    .approval-card-reply {
      border-left: 3px solid #3b82f6;
    }

    .approval-card-label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .approval-card-text {
      font-size: 14px;
      line-height: 1.6;
      color: #ddd;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .approval-card-original .approval-card-text {
      color: #aaa;
    }

    .approval-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .approval-card-actions button {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .approval-card-content {
        grid-template-columns: 1fr;
      }
    }

    /* \uBAA8\uB2EC \uC2A4\uD0C0\uC77C */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.show {
      display: flex;
    }

    .modal {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 600px;
      border: 1px solid #333;
    }

    .modal h2 {
      margin-bottom: 15px;
      font-size: 18px;
    }

    .modal-comment {
      background: #222;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 15px;
      font-size: 14px;
      color: #aaa;
    }

    .modal-comment strong {
      color: #fff;
      display: block;
      margin-bottom: 5px;
    }

    .modal textarea {
      width: 100%;
      height: 120px;
      background: #222;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      font-size: 14px;
      resize: vertical;
      margin-bottom: 15px;
    }

    .modal textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn-cancel {
      padding: 10px 20px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: #444;
    }

    .btn-save {
      padding: 10px 20px;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-save:hover {
      background: #2563eb;
    }

    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .filter-tab {
      padding: 8px 16px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 20px;
      color: #888;
      cursor: pointer;
      font-size: 14px;
    }

    .filter-tab.active {
      background: #333;
      color: #fff;
      border-color: #555;
    }

    .comments-table {
      width: 100%;
      border-collapse: collapse;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
    }

    .comments-table th,
    .comments-table td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #333;
    }

    .comments-table th {
      background: #222;
      font-weight: 600;
      color: #888;
      font-size: 12px;
      text-transform: uppercase;
    }

    .comments-table tr:hover {
      background: #222;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge.unclassified {
      background: #2e1065;
      color: #a78bfa;
    }

    .badge.pending {
      background: #422006;
      color: #f59e0b;
    }

    .badge.generated {
      background: #172554;
      color: #3b82f6;
    }

    .badge.replied {
      background: #052e16;
      color: #10b981;
    }

    .reply-preview {
      max-width: 300px;
      font-size: 12px;
      color: #888;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .reply-preview.has-reply {
      color: #3b82f6;
    }

    .badge.positive { background: #052e16; color: #10b981; }
    .badge.negative { background: #450a0a; color: #ef4444; }
    .badge.question { background: #172554; color: #3b82f6; }
    .badge.suggestion { background: #3f3f46; color: #a78bfa; }
    .badge.reaction { background: #422006; color: #fbbf24; }
    .badge.other { background: #27272a; color: #a1a1aa; }

    .comment-text {
      max-width: 400px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .comment-text a,
    .reply-preview a {
      color: #3b82f6;
      text-decoration: none;
    }

    .comment-text a:hover,
    .reply-preview a:hover {
      text-decoration: underline;
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }

    .pagination button {
      padding: 8px 16px;
      background: #333;
      color: #fff;
      border-radius: 6px;
    }

    .pagination button:hover:not(:disabled) {
      background: #444;
    }

    .pagination .current {
      padding: 8px 16px;
      color: #888;
    }

    .loading {
      display: none;
      margin-left: 10px;
    }

    .loading.show {
      display: inline-block;
    }

    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.success {
      background: #10b981;
    }

    .toast.error {
      background: #ef4444;
    }

    .last-fetch {
      font-size: 12px;
      color: #666;
    }

    .btn-oauth {
      padding: 6px 12px;
      background: #333;
      color: #fff;
      border-radius: 6px;
      font-size: 12px;
      text-decoration: none;
      transition: background 0.2s;
    }

    .btn-oauth:hover {
      background: #444;
    }

    /* \uCC44\uB110 \uC120\uD0DD \uB4DC\uB86D\uB2E4\uC6B4 */
    .channel-selector {
      position: relative;
    }

    .channel-selector-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .channel-selector-btn:hover {
      border-color: #555;
      background: #222;
    }

    .channel-selector-btn .channel-icon {
      font-size: 16px;
    }

    .channel-selector-btn .arrow {
      font-size: 10px;
      color: #888;
      margin-left: 4px;
    }

    .channel-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      min-width: 250px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      z-index: 100;
      overflow: hidden;
    }

    .channel-dropdown.show {
      display: block;
    }

    .channel-dropdown-header {
      padding: 12px 16px;
      font-size: 12px;
      color: #666;
      border-bottom: 1px solid #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .channel-dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      color: #fff;
      text-decoration: none;
      transition: background 0.15s;
    }

    .channel-dropdown-item:hover {
      background: #222;
    }

    .channel-dropdown-item.active {
      background: #1e3a5f;
    }

    .channel-dropdown-item .icon {
      font-size: 18px;
    }

    .channel-dropdown-item .info {
      flex: 1;
    }

    .channel-dropdown-item .name {
      font-weight: 500;
      font-size: 14px;
    }

    .channel-dropdown-item .stats {
      font-size: 11px;
      color: #888;
    }

    .channel-dropdown-divider {
      height: 1px;
      background: #333;
      margin: 4px 0;
    }

    .channel-dropdown-item.add-new {
      color: #3b82f6;
    }

    .channel-dropdown-item.add-new:hover {
      background: #172554;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state h3 {
      margin-bottom: 10px;
      font-size: 18px;
    }

    /* \uC124\uC815 \uC139\uC158 \uC2A4\uD0C0\uC77C */
    .settings-section {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      border: 1px solid #333;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      cursor: pointer;
    }

    .settings-header h2 {
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .settings-toggle {
      font-size: 12px;
      color: #888;
    }

    .settings-content {
      display: none;
    }

    .settings-content.show {
      display: block;
    }

    .type-instructions {
      display: grid;
      gap: 20px;
    }

    .type-card {
      background: #222;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #333;
    }

    .type-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .type-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .type-card-title .badge {
      font-size: 14px;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #444;
      border-radius: 24px;
      transition: 0.3s;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: #10b981;
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    .type-card label {
      display: block;
      font-size: 12px;
      color: #888;
      margin-bottom: 6px;
    }

    .type-card textarea {
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      color: #fff;
      font-size: 13px;
      resize: vertical;
      margin-bottom: 12px;
    }

    .type-card textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .type-card textarea.instruction {
      height: 50px;
    }

    .common-instructions {
      background: #222;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid #444;
    }

    .common-instructions label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
    }

    .common-instructions textarea {
      width: 100%;
      height: 80px;
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      color: #fff;
      font-size: 13px;
      resize: vertical;
    }

    .common-instructions textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .common-instructions .hint {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #333;
    }

    .btn-reset {
      padding: 10px 20px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-reset:hover {
      background: #444;
    }

    .btn-save-settings {
      padding: 10px 20px;
      background: #10b981;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-save-settings:hover {
      background: #059669;
    }

    .site-footer {
      margin-top: 60px;
      padding: 20px 0;
      border-top: 1px solid #333;
      text-align: center;
    }

    .footer-copy {
      color: #555;
      font-size: 12px;
    }

    .footer-copy a {
      color: #555;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-copy a:hover {
      color: #888;
    }

    .footer-copy a span {
      color: #ef4444;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="display: flex; align-items: center; gap: 15px;">
        <!-- \uCC44\uB110 \uC120\uD0DD \uB4DC\uB86D\uB2E4\uC6B4 -->
        <div class="channel-selector">
          <button class="channel-selector-btn" onclick="toggleChannelDropdown()">
            <span class="channel-icon">\u{1F3AC}</span>
            <span>${currentChannel ? escapeHtml(currentChannel.youtube.channelTitle) : "\uCC44\uB110 \uC120\uD0DD"}</span>
            <span class="arrow">\u25BC</span>
          </button>
          <div class="channel-dropdown" id="channelDropdown">
            <div class="channel-dropdown-header">\uB0B4 \uCC44\uB110</div>
            ${userChannels.length > 0 ? userChannels.map((ch) => `
              <a href="/channels/${ch.id}" class="channel-dropdown-item ${currentChannel?.id === ch.id ? "active" : ""}">
                <span class="icon">\u{1F3AC}</span>
                <div class="info">
                  <div class="name">${escapeHtml(ch.youtube.channelTitle)}</div>
                  <div class="stats">${ch.isActive ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}</div>
                </div>
              </a>
            `).join("") : `
              <div class="channel-dropdown-item" style="color: #666; cursor: default;">
                \uB4F1\uB85D\uB41C \uCC44\uB110\uC774 \uC5C6\uC2B5\uB2C8\uB2E4
              </div>
            `}
            <div class="channel-dropdown-divider"></div>
            <a href="/oauth/start" class="channel-dropdown-item add-new">
              <span class="icon">\u2795</span>
              <div class="info">
                <div class="name">\uC0C8 \uCC44\uB110 \uCD94\uAC00</div>
              </div>
            </a>
          </div>
        </div>
        <h1 style="font-size: 20px;">\uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5</h1>
      </div>
      <div style="display: flex; align-items: center; gap: 15px;">
        <span class="last-fetch">
          \uB9C8\uC9C0\uB9C9 \uB3D9\uAE30\uD654: ${lastFetchedAt ? new Date(lastFetchedAt).toLocaleString("ko-KR") : "\uC5C6\uC74C"}
        </span>
        <a href="/settings" class="btn-oauth" title="\uACC4\uC815 \uC124\uC815 (API Key, \uD504\uB85C\uD544)">\u2699\uFE0F \uACC4\uC815</a>
        <button onclick="logout()" class="btn-oauth" style="background: transparent; border: 1px solid #333; cursor: pointer;">\u{1F6AA} \uB85C\uADF8\uC544\uC6C3</button>
      </div>
    </header>

    ${!hasApiKey ? `
    <!-- API Key \uBBF8\uC124\uC815 \uACBD\uACE0 \uBC30\uB108 -->
    <div class="warning-banner">
      <div class="warning-content">
        <span class="warning-icon">\u26A0\uFE0F</span>
        <div class="warning-text">
          <strong>AI \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD558\uB824\uBA74 API Key\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4</strong>
          <p>\uB313\uAE00 \uBD84\uB958 \uBC0F \uC751\uB2F5 \uC0DD\uC131 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD558\uB824\uBA74 OpenRouter API Key\uB97C \uC124\uC815\uD574\uC8FC\uC138\uC694.</p>
        </div>
      </div>
      <a href="/settings" class="warning-btn">API Key \uC124\uC815\uD558\uAE30 \u2192</a>
    </div>
    ` : ""}

    <!-- \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC548\uB0B4 -->
    <div class="workflow-guide">
      <div class="workflow-step ${stats.total === 0 ? "current" : "done"}">
        <span class="step-num">1</span>
        <span class="step-label">\uB313\uAE00 \uAC00\uC838\uC624\uAE30</span>
        ${stats.total > 0 ? `<span class="step-count">${stats.total}\uAC1C</span>` : ""}
      </div>
      <div class="workflow-arrow">\u2192</div>
      <div class="workflow-step ${stats.total > 0 && stats.unclassified > 0 ? "current" : stats.unclassified === 0 && stats.total > 0 ? "done" : ""}">
        <span class="step-num">2</span>
        <span class="step-label">\uBD84\uB958</span>
        ${stats.unclassified > 0 ? `<span class="step-count warning">${stats.unclassified}\uAC1C \uB300\uAE30</span>` : ""}
      </div>
      <div class="workflow-arrow">\u2192</div>
      <div class="workflow-step ${stats.pending > 0 ? "current" : stats.generated > 0 || stats.replied > 0 ? "done" : ""}">
        <span class="step-num">3</span>
        <span class="step-label">\uC751\uB2F5 \uC0DD\uC131</span>
        ${stats.pending > 0 ? `<span class="step-count warning">${stats.pending}\uAC1C \uB300\uAE30</span>` : ""}
      </div>
      <div class="workflow-arrow">\u2192</div>
      <div class="workflow-step ${stats.generated > 0 ? "current" : stats.replied > 0 ? "done" : ""}">
        <span class="step-num">4</span>
        <span class="step-label">\uC2B9\uC778</span>
        ${stats.generated > 0 ? `<span class="step-count warning">${stats.generated}\uAC1C \uB300\uAE30</span>` : ""}
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <h3>\uC804\uCCB4 \uB313\uAE00</h3>
        <div class="value">${stats.total}</div>
      </div>
      <div class="stat-card">
        <h3>\uBBF8\uBD84\uB958</h3>
        <div class="value unclassified">${stats.unclassified}</div>
      </div>
      <div class="stat-card">
        <h3>\uBBF8\uC751\uB2F5</h3>
        <div class="value pending">${stats.pending}</div>
      </div>
      <div class="stat-card">
        <h3>\uC2B9\uC778\uB300\uAE30</h3>
        <div class="value generated">${stats.generated}</div>
      </div>
      <div class="stat-card">
        <h3>\uC751\uB2F5\uC644\uB8CC</h3>
        <div class="value replied">${stats.replied}</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-fetch" id="fetchBtn" onclick="fetchComments()">
        \u{1F4E5} \uB313\uAE00 \uAC00\uC838\uC624\uAE30
        <span class="loading" id="fetchLoading">\u23F3</span>
      </button>
      <button class="btn-classify" id="classifyBtn" onclick="classifyComments()" ${!hasApiKey ? 'disabled title="API Key\uB97C \uBA3C\uC800 \uC124\uC815\uD558\uC138\uC694"' : ""}>
        \u{1F3F7}\uFE0F \uC790\uB3D9 \uBD84\uB958
        <span class="loading" id="classifyLoading">\u23F3</span>
      </button>
      <button class="btn-generate" id="generateBtn" onclick="generateReplies()" ${!hasApiKey ? 'disabled title="API Key\uB97C \uBA3C\uC800 \uC124\uC815\uD558\uC138\uC694"' : ""}>
        \u270D\uFE0F \uC751\uB2F5 \uC0DD\uC131
        <span class="loading" id="generateLoading">\u23F3</span>
      </button>
      <button class="btn-approve" id="approveAllBtn" onclick="approveAll()">
        \u2705 \uC804\uCCB4 \uC2B9\uC778
        <span class="loading" id="approveAllLoading">\u23F3</span>
      </button>
    </div>

    <!-- \uC2B9\uC778 \uB300\uAE30 \uC139\uC158 -->
    <div class="pending-approval-section" id="pendingApprovalSection" style="display: ${stats.generated > 0 ? "block" : "none"};">
      <div class="pending-approval-header">
        <h2>
          \u23F3 \uC2B9\uC778 \uB300\uAE30 \uC911
          <span class="count" id="pendingCount">${stats.generated}</span>
        </h2>
        <button class="btn-approve" onclick="approveAll()" style="padding: 8px 16px; font-size: 14px;">
          \u2705 \uBAA8\uB450 \uC2B9\uC778
        </button>
      </div>
      <div class="pending-approval-list" id="pendingApprovalList">
        <!-- JS\uB85C \uB3D9\uC801 \uB80C\uB354\uB9C1 -->
        <div class="pending-approval-empty">
          <p>\uC2B9\uC778 \uB300\uAE30 \uC911\uC778 \uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</p>
        </div>
      </div>
    </div>

    <!-- \uCC44\uB110 \uC751\uB2F5 \uC9C0\uCE68 \uC124\uC815 \uC139\uC158 -->
    <div class="settings-section">
      <div class="settings-header" onclick="toggleSettings()">
        <h2>\u{1F4DD} \uC774 \uCC44\uB110\uC758 \uC751\uB2F5 \uC9C0\uCE68</h2>
        <span class="settings-toggle" id="settingsToggle">\u25BC \uD3BC\uCE58\uAE30</span>
      </div>
      <div class="settings-content" id="settingsContent">
        <!-- \uACF5\uD1B5 \uC9C0\uCE68 -->
        <div class="common-instructions">
          <label>\u{1F4CB} \uACF5\uD1B5 \uC751\uB2F5 \uC9C0\uCE68</label>
          <textarea id="commonInstructions" placeholder="\uBAA8\uB4E0 \uB313\uAE00 \uC720\uD615\uC5D0 \uACF5\uD1B5\uC73C\uB85C \uC801\uC6A9\uB418\uB294 \uC9C0\uCE68\uC744 \uC785\uB825\uD558\uC138\uC694..."></textarea>
          <p class="hint">\uBAA8\uB4E0 \uBD84\uB958\uC5D0 \uACF5\uD1B5\uC73C\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4. (\uC608: \uAE00\uC790\uC218 \uC81C\uD55C, \uC774\uBAA8\uC9C0 \uC0AC\uC6A9, \uB9D0\uD22C \uB4F1)</p>
        </div>

        <p style="color: #888; margin-bottom: 15px; font-size: 14px;">
          <strong>\uBD84\uB958\uBCC4 \uCD94\uAC00 \uC9C0\uCE68</strong> - \uD1A0\uAE00\uC744 \uB044\uBA74 \uD574\uB2F9 \uC720\uD615\uC740 \uC751\uB2F5\uC744 \uC0DD\uC131\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.
        </p>
        <div class="type-instructions" id="typeInstructions">
          <!-- JS\uB85C \uB3D9\uC801 \uC0DD\uC131 -->
        </div>
        <div class="settings-actions">
          <button class="btn-reset" onclick="resetSettings()">\uAE30\uBCF8\uAC12\uC73C\uB85C \uCD08\uAE30\uD654</button>
          <button class="btn-save-settings" onclick="saveSettings()">
            \u{1F4BE} \uC124\uC815 \uC800\uC7A5
            <span class="loading" id="saveSettingsLoading">\u23F3</span>
          </button>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-status="all" onclick="filterComments('all')">\uC804\uCCB4</button>
      <button class="filter-tab" data-status="unclassified" onclick="filterComments('unclassified')">\uBBF8\uBD84\uB958</button>
      <button class="filter-tab" data-status="pending" onclick="filterComments('pending')">\uBBF8\uC751\uB2F5</button>
      <button class="filter-tab" data-status="generated" onclick="filterComments('generated')">\uC2B9\uC778\uB300\uAE30</button>
      <button class="filter-tab" data-status="replied" onclick="filterComments('replied')">\uC751\uB2F5\uC644\uB8CC</button>
    </div>

    <table class="comments-table">
      <thead>
        <tr>
          <th>\uC0C1\uD0DC</th>
          <th>\uBD84\uB958</th>
          <th>\uC791\uC131\uC790</th>
          <th>\uB313\uAE00</th>
          <th>\uC0DD\uC131\uB41C \uC751\uB2F5</th>
          <th>\uC561\uC158</th>
        </tr>
      </thead>
      <tbody id="commentsBody">
        <tr>
          <td colspan="6" class="empty-state">
            <h3>\uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</h3>
            <p>\u{1F4E5} \uB313\uAE00 \uAC00\uC838\uC624\uAE30 \uBC84\uD2BC\uC744 \uD074\uB9AD\uD558\uC138\uC694</p>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" id="pagination"></div>

    <footer class="site-footer">
      <div class="footer-copy">
        \xA9 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with \u2764\uFE0F by <span>AI\uC7A1\uB3CC\uC774</span></a>
      </div>
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <!-- \uC218\uC815 \uBAA8\uB2EC -->
  <div class="modal-overlay" id="editModal">
    <div class="modal">
      <h2>\u270F\uFE0F \uC751\uB2F5 \uC218\uC815</h2>
      <div class="modal-comment">
        <strong>\uC6D0\uBCF8 \uB313\uAE00:</strong>
        <span id="modalOriginalComment"></span>
      </div>
      <textarea id="modalReplyText" placeholder="\uC751\uB2F5 \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694..."></textarea>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeEditModal()">\uCDE8\uC18C</button>
        <button class="btn-save" onclick="saveEditedReply()">\uC800\uC7A5</button>
      </div>
    </div>
  </div>

  <script>
    // \uD604\uC7AC \uCC44\uB110 ID (\uCC44\uB110\uBCC4 API \uD638\uCD9C\uC5D0 \uC0AC\uC6A9)
    const channelId = '${currentChannel?.id || ""}';

    let currentPage = 1;
    let currentStatus = 'all';
    const limit = 20;
    let editingCommentId = null;
    let commentsCache = [];

    // \uC778\uC99D \uC815\uBCF4\uB97C \uAC00\uC838\uC624\uB294 \uD568\uC218 (\uD604\uC7AC \uD398\uC774\uC9C0\uC758 Basic Auth \uC0AC\uC6A9)
    function getAuthHeaders() {
      // \uD398\uC774\uC9C0 \uB85C\uB4DC \uC2DC \uC774\uBBF8 \uC778\uC99D\uB41C \uC0C1\uD0DC\uC774\uBBC0\uB85C, \uCFE0\uD0A4\uB098 \uC138\uC158 \uB300\uC2E0 credentials: 'include' \uC0AC\uC6A9
      return {};
    }

    // API \uD638\uCD9C \uD5EC\uD37C (\uC778\uC99D \uD3EC\uD568)
    async function apiCall(url, options = {}) {
      return fetch(url, {
        ...options,
        credentials: 'include',  // \uAC19\uC740 origin\uC774\uBBC0\uB85C \uCFE0\uD0A4/\uC778\uC99D \uD3EC\uD568
      });
    }

    // \uC124\uC815 \uCE90\uC2DC
    let settingsCache = null;

    // \uAE30\uBCF8 \uC124\uC815 (\uC11C\uBC84\uC5D0\uC11C \uAC00\uC838\uC62C \uC218 \uC5C6\uC744 \uB54C \uC0AC\uC6A9)
    const DEFAULT_COMMON_INSTRUCTIONS = \`- 200\uC790 \uC774\uB0B4\uB85C \uC9E7\uAC8C
- \uC774\uBAA8\uC9C0 1-2\uAC1C\uB9CC
- "\uC548\uB155\uD558\uC138\uC694" \uAC19\uC740 \uD615\uC2DD\uC801 \uC778\uC0AC \uAE08\uC9C0
- \uC808\uB300 \uBC29\uC5B4\uC801\uC774\uC9C0 \uC54A\uAC8C
- \uC2DC\uCCAD\uC790 \uC774\uB984 \uC5B8\uAE09\uD558\uC9C0 \uC54A\uAE30\`;

    const DEFAULT_TYPE_INSTRUCTIONS = {
      positive: {
        enabled: true,
        instruction: '\uC9C4\uC2EC\uC5B4\uB9B0 \uAC10\uC0AC\uB97C \uD45C\uD604\uD558\uC138\uC694. \uC751\uC6D0\uC774 \uD070 \uD798\uC774 \uB41C\uB2E4\uB294 \uAC83\uC744 \uC804\uB2EC\uD558\uC138\uC694.'
      },
      negative: {
        enabled: true,
        instruction: '\uD488\uC704\uC788\uAC8C \uB300\uC751\uD558\uC138\uC694. \uBE44\uD310\uC5D0\uC11C \uBC30\uC6B8 \uC810\uC774 \uC788\uB2E4\uBA74 \uC778\uC815\uD558\uACE0, \uC545\uD50C\uC740 \uC9E7\uAC8C \uB9C8\uBB34\uB9AC\uD558\uC138\uC694.'
      },
      question: {
        enabled: true,
        instruction: '\uCE5C\uC808\uD558\uACE0 \uC804\uBB38\uC801\uC73C\uB85C \uB2F5\uBCC0\uD558\uC138\uC694. \uBAA8\uB974\uB294 \uAC74 \uC194\uC9C1\uD788 \uBAA8\uB978\uB2E4\uACE0 \uD558\uACE0, \uC54C\uC544\uBCF4\uACA0\uB2E4\uACE0 \uD558\uC138\uC694.'
      },
      suggestion: {
        enabled: true,
        instruction: '\uC81C\uC548\uC5D0 \uAC10\uC0AC\uD558\uACE0 \uACF5\uAC10\uD558\uC138\uC694. \uC88B\uC740 \uC544\uC774\uB514\uC5B4\uB294 \uBC18\uC601\uD558\uACA0\uB2E4\uACE0 \uD558\uC138\uC694.'
      },
      reaction: {
        enabled: true,
        instruction: '\uAC00\uBCCD\uACE0 \uC720\uBA38\uB7EC\uC2A4\uD558\uAC8C \uBC18\uC751\uD558\uC138\uC694. \uC9E7\uC9C0\uB9CC \uB530\uB73B\uD558\uAC8C!'
      },
      other: {
        enabled: false,
        instruction: '\uCE5C\uADFC\uD558\uAC8C \uC751\uB300\uD558\uC138\uC694.'
      }
    };

    // \uC720\uD615\uBCC4 \uB77C\uBCA8
    const TYPE_LABELS = {
      positive: { label: '\uAE0D\uC815', desc: '\uCE6D\uCC2C, \uC751\uC6D0, \uAC10\uC0AC \uB313\uAE00' },
      negative: { label: '\uBD80\uC815', desc: '\uBE44\uB09C, \uC545\uD50C, \uBD88\uB9CC \uB313\uAE00' },
      question: { label: '\uC9C8\uBB38', desc: '\uAD81\uAE08\uD55C \uC810, \uB3C4\uC6C0 \uC694\uCCAD' },
      suggestion: { label: '\uC81C\uC548', desc: '\uCF58\uD150\uCE20 \uC694\uCCAD, \uAC1C\uC120\uC810' },
      reaction: { label: '\uBC18\uC751', desc: '\uB2E8\uC21C \uBC18\uC751 (\u314B\u314B, \uC640 \uB4F1)' },
      other: { label: '\uAE30\uD0C0', desc: '\uBD84\uB958\uB418\uC9C0 \uC54A\uB294 \uAE30\uD0C0 \uB313\uAE00' }
    };

    // \uD398\uC774\uC9C0 \uB85C\uB4DC\uC2DC \uB313\uAE00 \uBD88\uB7EC\uC624\uAE30
    document.addEventListener('DOMContentLoaded', () => {
      loadComments();
      loadSettings();
      loadPendingApprovals();
    });

    // \uB313\uAE00 \uBAA9\uB85D \uBD88\uB7EC\uC624\uAE30
    async function loadComments() {
      try {
        const res = await apiCall(\`/api/channels/\${channelId}/comments?page=\${currentPage}&limit=\${limit}&status=\${currentStatus}\`);
        const data = await res.json();

        if (data.success) {
          commentsCache = data.data.comments;
          renderComments(data.data.comments);
          renderPagination(data.data.page, data.data.totalPages, data.data.total);
        }
      } catch (error) {
        showToast('\uB313\uAE00\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
      }
    }

    // \uB313\uAE00 \uB80C\uB354\uB9C1
    function renderComments(comments) {
      const tbody = document.getElementById('commentsBody');

      if (!comments || comments.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="empty-state">
              <h3>\uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</h3>
              <p>\u{1F4E5} \uB313\uAE00 \uAC00\uC838\uC624\uAE30 \uBC84\uD2BC\uC744 \uD074\uB9AD\uD558\uC138\uC694</p>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = comments.map(comment => {
        const sanitizedText = sanitizeHtml(comment.text || '');
        const sanitizedReply = comment.replyText ? sanitizeHtml(comment.replyText) : '';
        const decodedAuthor = decodeHtmlEntities(comment.authorName || '');
        return \`
        <tr>
          <td><span class="badge \${comment.status}">\${getStatusLabel(comment.status)}</span></td>
          <td><span class="badge \${comment.type || 'other'}">\${getTypeLabel(comment.type)}</span></td>
          <td>\${escapeHtml(decodedAuthor)}</td>
          <td class="comment-text">\${sanitizedText}</td>
          <td class="reply-preview \${comment.replyText ? 'has-reply' : ''}">\${sanitizedReply || '-'}</td>
          <td>\${comment.status === 'generated' ? \`<button class="btn-edit-sm" onclick="openEditModal('\${comment.id}')">\u270F\uFE0F \uC218\uC815</button><button class="btn-approve-sm" onclick="approveComment('\${comment.id}')">\u2705 \uC2B9\uC778</button>\` : '-'}</td>
        </tr>
      \`;
      }).join('');
    }

    // \uD398\uC774\uC9C0\uB124\uC774\uC158 \uB80C\uB354\uB9C1
    function renderPagination(page, totalPages, total) {
      const pagination = document.getElementById('pagination');

      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      pagination.innerHTML = \`
        <button \${page === 1 ? 'disabled' : ''} onclick="goToPage(\${page - 1})">\uC774\uC804</button>
        <span class="current">\${page} / \${totalPages} (\uCD1D \${total}\uAC1C)</span>
        <button \${page === totalPages ? 'disabled' : ''} onclick="goToPage(\${page + 1})">\uB2E4\uC74C</button>
      \`;
    }

    // \uD398\uC774\uC9C0 \uC774\uB3D9
    function goToPage(page) {
      currentPage = page;
      loadComments();
    }

    // \uD544\uD130 \uBCC0\uACBD
    function filterComments(status) {
      currentStatus = status;
      currentPage = 1;

      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.status === status);
      });

      loadComments();
    }

    // \uC2B9\uC778 \uB300\uAE30 \uBAA9\uB85D \uBD88\uB7EC\uC624\uAE30
    let pendingApprovalsCache = [];

    async function loadPendingApprovals() {
      try {
        const res = await apiCall(\`/api/channels/\${channelId}/comments?status=generated&limit=50\`);
        const data = await res.json();

        if (data.success) {
          pendingApprovalsCache = data.data.comments || [];
          renderPendingApprovals(pendingApprovalsCache);
        }
      } catch (error) {
        console.error('Failed to load pending approvals:', error);
      }
    }

    // \uC2B9\uC778 \uB300\uAE30 \uBAA9\uB85D \uB80C\uB354\uB9C1
    function renderPendingApprovals(comments) {
      const section = document.getElementById('pendingApprovalSection');
      const list = document.getElementById('pendingApprovalList');
      const countEl = document.getElementById('pendingCount');

      if (!comments || comments.length === 0) {
        section.style.display = 'none';
        return;
      }

      section.style.display = 'block';
      countEl.textContent = comments.length;

      list.innerHTML = comments.map(comment => {
        const sanitizedText = sanitizeHtml(comment.text || '');
        const sanitizedReply = sanitizeHtml(comment.replyText || '');
        const decodedAuthor = decodeHtmlEntities(comment.authorName || '');
        const generatedTime = comment.generatedAt ? formatRelativeTime(comment.generatedAt) : '';

        return \`
          <div class="approval-card" id="approval-card-\${comment.id}">
            <div class="approval-card-header">
              <div class="approval-card-meta">
                <span class="author">\${escapeHtml(decodedAuthor)}</span>
                <span class="badge \${comment.type || 'other'} type-badge">\${getTypeLabel(comment.type)}</span>
                <span class="video">\u{1F4FA} \${escapeHtml(comment.videoTitle || '').substring(0, 30)}...</span>
              </div>
              <span class="approval-card-time">\${generatedTime}</span>
            </div>
            <div class="approval-card-content">
              <div class="approval-card-original">
                <div class="approval-card-label">\u{1F4AC} \uC6D0\uBCF8 \uB313\uAE00</div>
                <div class="approval-card-text">\${sanitizedText}</div>
              </div>
              <div class="approval-card-reply">
                <div class="approval-card-label">\u{1F916} AI \uC751\uB2F5</div>
                <div class="approval-card-text" id="reply-text-\${comment.id}">\${sanitizedReply}</div>
              </div>
            </div>
            <div class="approval-card-actions">
              <button class="btn-edit-sm" onclick="openEditModalFromCard('\${comment.id}')" style="padding: 8px 16px;">
                \u270F\uFE0F \uC218\uC815
              </button>
              <button class="btn-reject-sm" onclick="rejectComment('\${comment.id}')" style="padding: 8px 16px;">
                \u274C \uC0AD\uC81C
              </button>
              <button class="btn-approve" onclick="approveCommentFromCard('\${comment.id}')" style="padding: 8px 16px; font-size: 13px;">
                \u2705 \uC2B9\uC778
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    // \uC0C1\uB300 \uC2DC\uAC04 \uD3EC\uB9F7
    function formatRelativeTime(dateStr) {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return '\uBC29\uAE08 \uC804';
      if (diffMin < 60) return \`\${diffMin}\uBD84 \uC804\`;
      if (diffHour < 24) return \`\${diffHour}\uC2DC\uAC04 \uC804\`;
      return \`\${diffDay}\uC77C \uC804\`;
    }

    // \uCE74\uB4DC\uC5D0\uC11C \uC218\uC815 \uBAA8\uB2EC \uC5F4\uAE30
    function openEditModalFromCard(commentId) {
      const comment = pendingApprovalsCache.find(c => c.id === commentId);
      if (!comment) {
        showToast('\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4', 'error');
        return;
      }

      editingCommentId = commentId;
      document.getElementById('modalOriginalComment').textContent = comment.text;
      document.getElementById('modalReplyText').value = comment.replyText || '';
      document.getElementById('editModal').classList.add('show');
    }

    // \uCE74\uB4DC\uC5D0\uC11C \uC2B9\uC778
    async function approveCommentFromCard(commentId) {
      const card = document.getElementById(\`approval-card-\${commentId}\`);
      if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
      }

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/comments/\${commentId}/approve\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast('\u2705 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 'success');
          // \uCE74\uB4DC \uC81C\uAC70
          if (card) card.remove();
          // \uCE90\uC2DC\uC5D0\uC11C \uC81C\uAC70
          pendingApprovalsCache = pendingApprovalsCache.filter(c => c.id !== commentId);
          // \uCE74\uC6B4\uD2B8 \uC5C5\uB370\uC774\uD2B8
          const countEl = document.getElementById('pendingCount');
          countEl.textContent = pendingApprovalsCache.length;
          // \uBE44\uC5B4\uC788\uC73C\uBA74 \uC139\uC158 \uC228\uAE30\uAE30
          if (pendingApprovalsCache.length === 0) {
            document.getElementById('pendingApprovalSection').style.display = 'none';
          }
          // 1\uCD08 \uD6C4 \uD398\uC774\uC9C0 \uC0C8\uB85C\uACE0\uCE68 (\uD1B5\uACC4 \uC5C5\uB370\uC774\uD2B8)
          setTimeout(() => location.reload(), 1500);
        } else {
          if (card) {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
          }
          showToast(data.error || '\uC2B9\uC778 \uC2E4\uD328', 'error');
        }
      } catch (error) {
        if (card) {
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
        }
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958', 'error');
      }
    }

    // \uC751\uB2F5 \uC0AD\uC81C (pending\uC73C\uB85C \uB418\uB3CC\uB9AC\uAE30)
    async function rejectComment(commentId) {
      if (!confirm('\uC774 \uC751\uB2F5\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uB313\uAE00\uC740 "\uBBF8\uC751\uB2F5" \uC0C1\uD0DC\uB85C \uB3CC\uC544\uAC11\uB2C8\uB2E4.')) return;

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/comments/\${commentId}/reply\`, {
          method: 'DELETE'
        });

        if (!res.success) {
          throw new Error(res.error || '\uC751\uB2F5 \uC0AD\uC81C \uC2E4\uD328');
        }

        showToast('\uC751\uB2F5\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 'success');
        const card = document.getElementById(\`approval-card-\${commentId}\`);
        if (card) card.remove();
        pendingApprovalsCache = pendingApprovalsCache.filter(c => c.id !== commentId);
        const countEl = document.getElementById('pendingCount');
        countEl.textContent = pendingApprovalsCache.length;
        if (pendingApprovalsCache.length === 0) {
          document.getElementById('pendingApprovalSection').style.display = 'none';
        }
        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        showToast('\uC0AD\uC81C \uC2E4\uD328', 'error');
      }
    }

    // \uB313\uAE00 \uAC00\uC838\uC624\uAE30
    async function fetchComments() {
      const btn = document.getElementById('fetchBtn');
      const loading = document.getElementById('fetchLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/fetch\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // \uC790\uB3D9 \uBD84\uB958
    async function classifyComments() {
      const btn = document.getElementById('classifyBtn');
      const loading = document.getElementById('classifyLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/classify\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // \uC751\uB2F5 \uC0DD\uC131
    async function generateReplies() {
      const btn = document.getElementById('generateBtn');
      const loading = document.getElementById('generateLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/generate\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // \uC804\uCCB4 \uC2B9\uC778
    async function approveAll() {
      const btn = document.getElementById('approveAllBtn');
      const loading = document.getElementById('approveAllLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/approve-all\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // \uAC1C\uBCC4 \uC2B9\uC778
    async function approveComment(commentId) {
      try {
        const res = await apiCall(\`/api/channels/\${channelId}/comments/\${commentId}/approve\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      }
    }

    // \uC218\uC815 \uBAA8\uB2EC \uC5F4\uAE30
    function openEditModal(commentId) {
      const comment = commentsCache.find(c => c.id === commentId);
      if (!comment) {
        showToast('\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4', 'error');
        return;
      }

      editingCommentId = commentId;
      document.getElementById('modalOriginalComment').textContent = comment.text;
      document.getElementById('modalReplyText').value = comment.replyText || '';
      document.getElementById('editModal').classList.add('show');
    }

    // \uC218\uC815 \uBAA8\uB2EC \uB2EB\uAE30
    function closeEditModal() {
      editingCommentId = null;
      document.getElementById('editModal').classList.remove('show');
    }

    // \uC218\uC815\uB41C \uC751\uB2F5 \uC800\uC7A5
    async function saveEditedReply() {
      if (!editingCommentId) return;

      const replyText = document.getElementById('modalReplyText').value;

      try {
        const res = await apiCall(\`/api/channels/\${channelId}/comments/\${editingCommentId}/reply\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ replyText })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          closeEditModal();
          loadComments();
        } else {
          showToast(data.error || '\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      }
    }

    // \uBAA8\uB2EC \uBC14\uAE65 \uD074\uB9AD\uC2DC \uB2EB\uAE30
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target.id === 'editModal') {
        closeEditModal();
      }
    });

    // \uCC44\uB110 \uB4DC\uB86D\uB2E4\uC6B4 \uD1A0\uAE00
    function toggleChannelDropdown() {
      const dropdown = document.getElementById('channelDropdown');
      dropdown.classList.toggle('show');
    }

    // \uB4DC\uB86D\uB2E4\uC6B4 \uC678\uBD80 \uD074\uB9AD\uC2DC \uB2EB\uAE30
    document.addEventListener('click', (e) => {
      const selector = document.querySelector('.channel-selector');
      const dropdown = document.getElementById('channelDropdown');
      if (selector && !selector.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // \uB85C\uADF8\uC544\uC6C3
    function logout() {
      if (!confirm('\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      window.location.href = '/login';
    }

    // \uD1A0\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0
    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = \`toast \${type} show\`;

      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    // \uC0C1\uD0DC \uB77C\uBCA8
    function getStatusLabel(status) {
      const labels = {
        unclassified: '\uBBF8\uBD84\uB958',
        pending: '\uBBF8\uC751\uB2F5',
        generated: '\uC2B9\uC778\uB300\uAE30',
        replied: '\uC644\uB8CC'
      };
      return labels[status] || status;
    }

    // \uBD84\uB958 \uB77C\uBCA8
    function getTypeLabel(type) {
      const labels = {
        positive: '\uAE0D\uC815',
        negative: '\uBD80\uC815',
        question: '\uC9C8\uBB38',
        suggestion: '\uC81C\uC548',
        reaction: '\uBC18\uC751',
        other: '\uAE30\uD0C0'
      };
      return labels[type] || '-';
    }

    // HTML \uC774\uC2A4\uCF00\uC774\uD504
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // HTML \uC5D4\uD2F0\uD2F0 \uB514\uCF54\uB529 (YouTube API\uC5D0\uC11C &amp; \uB4F1\uC73C\uB85C \uC778\uCF54\uB529\uB41C \uD14D\uC2A4\uD2B8 \uCC98\uB9AC)
    function decodeHtmlEntities(text) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }

    // YouTube \uB313\uAE00 HTML \uCC98\uB9AC (\uC548\uC804\uD55C \uB9C1\uD06C\uB9CC \uD5C8\uC6A9, \uB098\uBA38\uC9C0\uB294 \uC774\uC2A4\uCF00\uC774\uD504)
    function sanitizeHtml(text) {
      if (!text) return '';

      // \uBA3C\uC800 HTML \uC5D4\uD2F0\uD2F0 \uB514\uCF54\uB529
      const decoded = decodeHtmlEntities(text);

      // <a> \uD0DC\uADF8\uB97C \uC784\uC2DC \uD50C\uB808\uC774\uC2A4\uD640\uB354\uB85C \uB300\uCCB4
      const linkPattern = /<a\\s+href="(https?:\\/\\/[^"]+)"[^>]*>([^<]+)<\\/a>/gi;
      const links = [];
      let processed = decoded.replace(linkPattern, (match, href, linkText) => {
        const index = links.length;
        // YouTube/\uC548\uC804\uD55C \uB9C1\uD06C\uB9CC \uD5C8\uC6A9
        const safeHref = escapeHtml(href);
        const safeLinkText = escapeHtml(linkText);
        links.push(\`<a href="\${safeHref}" target="_blank" rel="noopener" style="color: #3b82f6;">\${safeLinkText}</a>\`);
        return \`__LINK_\${index}__\`;
      });

      // \uB098\uBA38\uC9C0 \uD14D\uC2A4\uD2B8 \uC774\uC2A4\uCF00\uC774\uD504
      processed = escapeHtml(processed);

      // \uD50C\uB808\uC774\uC2A4\uD640\uB354\uB97C \uB2E4\uC2DC \uB9C1\uD06C\uB85C \uBCF5\uC6D0
      links.forEach((link, index) => {
        processed = processed.replace(\`__LINK_\${index}__\`, link);
      });

      return processed;
    }

    // \uC124\uC815 \uD1A0\uAE00
    function toggleSettings() {
      const content = document.getElementById('settingsContent');
      const toggle = document.getElementById('settingsToggle');
      const isShown = content.classList.toggle('show');
      toggle.textContent = isShown ? '\u25B2 \uC811\uAE30' : '\u25BC \uD3BC\uCE58\uAE30';
    }

    // \uC124\uC815 \uBD88\uB7EC\uC624\uAE30
    async function loadSettings() {
      try {
        const res = await apiCall(\`/api/channels/\${channelId}/settings\`);
        const data = await res.json();

        if (data.success && data.data) {
          settingsCache = data.data;
          // \uAE30\uBCF8\uAC12 \uC801\uC6A9
          if (!settingsCache.commonInstructions) {
            settingsCache.commonInstructions = DEFAULT_COMMON_INSTRUCTIONS;
          }
          if (!settingsCache.typeInstructions) {
            settingsCache.typeInstructions = DEFAULT_TYPE_INSTRUCTIONS;
          }
        } else {
          settingsCache = {
            commonInstructions: DEFAULT_COMMON_INSTRUCTIONS,
            typeInstructions: DEFAULT_TYPE_INSTRUCTIONS
          };
        }

        renderSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        settingsCache = {
          commonInstructions: DEFAULT_COMMON_INSTRUCTIONS,
          typeInstructions: DEFAULT_TYPE_INSTRUCTIONS
        };
        renderSettings();
      }
    }

    // \uC124\uC815 \uB80C\uB354\uB9C1
    function renderSettings() {
      // \uACF5\uD1B5 \uC9C0\uCE68
      const commonInput = document.getElementById('commonInstructions');
      commonInput.value = settingsCache?.commonInstructions || DEFAULT_COMMON_INSTRUCTIONS;

      // \uBD84\uB958\uBCC4 \uC9C0\uCE68
      const container = document.getElementById('typeInstructions');
      const types = ['positive', 'negative', 'question', 'suggestion', 'reaction', 'other'];

      container.innerHTML = types.map(type => {
        const typeInfo = TYPE_LABELS[type];
        const instruction = settingsCache?.typeInstructions?.[type] || DEFAULT_TYPE_INSTRUCTIONS[type];

        return \`
          <div class="type-card">
            <div class="type-card-header">
              <div class="type-card-title">
                <span class="badge \${type}">\${typeInfo.label}</span>
                <span style="color: #888; font-size: 13px;">\${typeInfo.desc}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="enabled_\${type}" \${instruction.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <textarea class="instruction" id="instruction_\${type}" placeholder="\uC774 \uC720\uD615\uC5D0 \uB300\uD55C \uCD94\uAC00 \uC9C0\uCE68...">\${escapeHtml(instruction.instruction || '')}</textarea>
          </div>
        \`;
      }).join('');
    }

    // \uC124\uC815 \uC800\uC7A5
    async function saveSettings() {
      const loading = document.getElementById('saveSettingsLoading');
      loading.classList.add('show');

      try {
        const types = ['positive', 'negative', 'question', 'suggestion', 'reaction', 'other'];
        const typeInstructions = {};

        types.forEach(type => {
          typeInstructions[type] = {
            enabled: document.getElementById(\`enabled_\${type}\`).checked,
            instruction: document.getElementById(\`instruction_\${type}\`).value
          };
        });

        // \uAE30\uC874 \uC124\uC815\uACFC \uBCD1\uD569
        const updatedSettings = {
          ...settingsCache,
          commonInstructions: document.getElementById('commonInstructions').value,
          typeInstructions
        };

        const res = await apiCall(\`/api/channels/\${channelId}/settings\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings)
        });

        const data = await res.json();

        if (data.success) {
          settingsCache = updatedSettings;
          showToast('\uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 'success');
        } else {
          showToast(data.error || '\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (error) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        loading.classList.remove('show');
      }
    }

    // \uC124\uC815 \uCD08\uAE30\uD654
    function resetSettings() {
      if (!confirm('\uBAA8\uB4E0 \uC9C0\uCE68\uC744 \uAE30\uBCF8\uAC12\uC73C\uB85C \uCD08\uAE30\uD654\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;

      settingsCache = {
        ...settingsCache,
        commonInstructions: DEFAULT_COMMON_INSTRUCTIONS,
        typeInstructions: DEFAULT_TYPE_INSTRUCTIONS
      };
      renderSettings();
      showToast('\uAE30\uBCF8\uAC12\uC73C\uB85C \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC800\uC7A5 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC801\uC6A9\uD558\uC138\uC694.', 'success');
    }
  <\/script>
</body>
</html>`;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// src/views/login.ts
function renderLogin() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uB85C\uADF8\uC778 - Autonomey</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .main-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 20px;
    }

    footer {
      width: 100%;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #222;
    }

    .footer-copy {
      color: #555;
      font-size: 12px;
    }

    .footer-copy a {
      color: #555;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-copy a:hover {
      color: #888;
    }

    .footer-copy a span {
      color: #ef4444;
    }

    .auth-container {
      background: #1a1a1a;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      border: 1px solid #333;
    }

    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .tabs {
      display: flex;
      margin-bottom: 30px;
      border-radius: 8px;
      background: #0f0f0f;
      padding: 4px;
    }

    .tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
      font-weight: 500;
      color: #888;
    }

    .tab.active {
      background: #3b82f6;
      color: white;
    }

    .tab:hover:not(.active) {
      color: #fff;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #888;
    }

    input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #0f0f0f;
      color: #fff;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    input::placeholder {
      color: #555;
    }

    button[type="submit"] {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 10px;
    }

    button[type="submit"]:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    button[type="submit"]:disabled {
      background: #374151;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      background: #7f1d1d;
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }

    .success-message {
      background: #14532d;
      color: #86efac;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 25px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: #333;
    }

    .divider-text {
      padding: 0 15px;
      color: #666;
      font-size: 13px;
    }

    #signup-form {
      display: none;
    }

    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff40;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="main-content">
  <div class="auth-container">
    <h1>Autonomey</h1>
    <p class="subtitle">YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uBD07</p>

    <div class="tabs">
      <div class="tab active" onclick="showTab('login')">\uB85C\uADF8\uC778</div>
      <div class="tab" onclick="showTab('signup')">\uD68C\uC6D0\uAC00\uC785</div>
    </div>

    <div id="error-message" class="error-message"></div>
    <div id="success-message" class="success-message"></div>

    <!-- \uB85C\uADF8\uC778 \uD3FC -->
    <form id="login-form" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label for="login-email">\uC774\uBA54\uC77C</label>
        <input type="email" id="login-email" placeholder="your@email.com" required>
      </div>

      <div class="form-group">
        <label for="login-password">\uBE44\uBC00\uBC88\uD638</label>
        <input type="password" id="login-password" placeholder="\uBE44\uBC00\uBC88\uD638 \uC785\uB825" required>
      </div>

      <button type="submit" id="login-btn">\uB85C\uADF8\uC778</button>
    </form>

    <!-- \uD68C\uC6D0\uAC00\uC785 \uD3FC -->
    <form id="signup-form" onsubmit="handleSignup(event)">
      <div class="form-group">
        <label for="signup-name">\uC774\uB984</label>
        <input type="text" id="signup-name" placeholder="\uD64D\uAE38\uB3D9" required>
      </div>

      <div class="form-group">
        <label for="signup-email">\uC774\uBA54\uC77C</label>
        <input type="email" id="signup-email" placeholder="your@email.com" required>
      </div>

      <div class="form-group">
        <label for="signup-password">\uBE44\uBC00\uBC88\uD638</label>
        <input type="password" id="signup-password" placeholder="6\uC790 \uC774\uC0C1" minlength="6" required>
      </div>

      <button type="submit" id="signup-btn">\uD68C\uC6D0\uAC00\uC785</button>
    </form>

  </div>
  </div>

  <footer>
    <div class="footer-copy">
      \xA9 2025 Autonomey. All rights reserved.<br>
      <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with \u2764\uFE0F by <span>AI\uC7A1\uB3CC\uC774</span></a>
    </div>
  </footer>

  <script>
    function showTab(tab) {
      const loginForm = document.getElementById('login-form');
      const signupForm = document.getElementById('signup-form');
      const tabs = document.querySelectorAll('.tab');

      hideMessages();

      if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
      } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
      }
    }

    function showError(message) {
      const el = document.getElementById('error-message');
      el.textContent = message;
      el.style.display = 'block';
      document.getElementById('success-message').style.display = 'none';
    }

    function showSuccess(message) {
      const el = document.getElementById('success-message');
      el.textContent = message;
      el.style.display = 'block';
      document.getElementById('error-message').style.display = 'none';
    }

    function hideMessages() {
      document.getElementById('error-message').style.display = 'none';
      document.getElementById('success-message').style.display = 'none';
    }

    function setLoading(buttonId, loading) {
      const btn = document.getElementById(buttonId);
      if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span>\uCC98\uB9AC \uC911...';
      } else {
        btn.disabled = false;
        btn.innerHTML = buttonId === 'login-btn' ? '\uB85C\uADF8\uC778' : '\uD68C\uC6D0\uAC00\uC785';
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      hideMessages();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      setLoading('login-btn', true);

      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          // \uD1A0\uD070 \uC800\uC7A5
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // \uCFE0\uD0A4\uC5D0\uB3C4 \uC800\uC7A5 (\uB300\uC2DC\uBCF4\uB4DC \uC811\uADFC\uC6A9)
          document.cookie = 'token=' + data.token + '; path=/; max-age=' + (7 * 24 * 60 * 60);

          showSuccess('\uB85C\uADF8\uC778 \uC131\uACF5! \uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4...');
          setTimeout(() => {
            window.location.href = '/channels';
          }, 1000);
        } else {
          showError(data.error || '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
      } catch (err) {
        showError('\uC11C\uBC84 \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
      } finally {
        setLoading('login-btn', false);
      }
    }

    async function handleSignup(e) {
      e.preventDefault();
      hideMessages();

      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      setLoading('signup-btn', true);

      try {
        const res = await fetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          // \uD1A0\uD070 \uC800\uC7A5
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // \uCFE0\uD0A4\uC5D0\uB3C4 \uC800\uC7A5
          document.cookie = 'token=' + data.token + '; path=/; max-age=' + (7 * 24 * 60 * 60);

          showSuccess('\uD68C\uC6D0\uAC00\uC785 \uC131\uACF5! \uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4...');
          setTimeout(() => {
            window.location.href = '/channels';
          }, 1000);
        } else {
          showError(data.error || '\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
      } catch (err) {
        showError('\uC11C\uBC84 \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
      } finally {
        setLoading('signup-btn', false);
      }
    }

    // \uD1A0\uD070 \uC0AD\uC81C \uD568\uC218
    function clearTokens() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
    }

    // \uD398\uC774\uC9C0 \uB85C\uB4DC \uC2DC \uAE30\uC874 \uD1A0\uD070 \uD655\uC778
    window.onload = function() {
      // URL\uC5D0\uC11C ?logout \uD30C\uB77C\uBBF8\uD130 \uD655\uC778 (\uBB34\uD55C \uB8E8\uD504 \uBC29\uC9C0)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('logout')) {
        // \uB85C\uADF8\uC544\uC6C3 \uC694\uCCAD - \uD1A0\uD070 \uC0AD\uC81C\uD558\uACE0 URL \uC815\uB9AC
        clearTokens();
        window.history.replaceState({}, '', '/login');
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        // \uD1A0\uD070\uC774 \uC788\uC73C\uBA74 \uC720\uD6A8\uD55C\uC9C0 \uD655\uC778
        fetch('/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        }).then(res => res.json()).then(data => {
          if (data.success && data.user) {
            // \uC720\uD6A8\uD55C \uD1A0\uD070 - \uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB9AC\uB2E4\uC774\uB809\uD2B8
            window.location.href = '/channels';
          } else {
            // \uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD1A0\uD070 - \uC0AD\uC81C
            clearTokens();
          }
        }).catch(() => {
          // \uB124\uD2B8\uC6CC\uD06C \uC624\uB958 \uC2DC\uC5D0\uB3C4 \uD1A0\uD070 \uC0AD\uC81C
          clearTokens();
        });
      }
    };
  <\/script>
</body>
</html>`;
}

// src/views/channels.ts
function renderChannelList(user2, channels2) {
  const hasApiKey = !!user2.openrouterApiKey;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uB0B4 \uCC44\uB110 - Autonomey</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }

    .header-left h1 {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .header-left .welcome {
      color: #888;
      font-size: 14px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-link {
      color: #888;
      text-decoration: none;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .nav-link:hover {
      color: #fff;
      background: #222;
    }

    .nav-link.active {
      color: #3b82f6;
      background: #172554;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #333;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #444;
    }

    .btn-danger {
      background: transparent;
      color: #888;
      border: 1px solid #333;
    }

    .btn-danger:hover {
      background: #7f1d1d;
      color: #fca5a5;
      border-color: #7f1d1d;
    }

    /* API Key \uBC30\uB108 */
    .api-key-banner {
      background: linear-gradient(135deg, #1e3a5f 0%, #172554 100%);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .api-key-banner.warning {
      background: linear-gradient(135deg, #422006 0%, #451a03 100%);
      border-color: #f59e0b;
    }

    .api-key-banner .message {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .api-key-banner .icon {
      font-size: 24px;
    }

    .api-key-banner .text h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .api-key-banner .text p {
      font-size: 13px;
      color: #94a3b8;
    }

    .api-key-banner.warning .text p {
      color: #fcd34d;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    /* \uCC44\uB110 \uADF8\uB9AC\uB4DC */
    .section-title {
      font-size: 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .channels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .channel-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .channel-card:hover {
      border-color: #555;
      transform: translateY(-2px);
    }

    .channel-card.add-new {
      border: 2px dashed #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      color: #666;
    }

    .channel-card.add-new:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .channel-card.add-new .icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .channel-info h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .channel-info .channel-id {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .channel-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .channel-status.active {
      background: #052e16;
      color: #10b981;
    }

    .channel-status.inactive {
      background: #27272a;
      color: #71717a;
    }

    .channel-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-item {
      background: #222;
      padding: 10px;
      border-radius: 8px;
    }

    .stat-item .label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-item .value {
      font-size: 18px;
      font-weight: 600;
    }

    .stat-item .value.pending { color: #f59e0b; }
    .stat-item .value.generated { color: #3b82f6; }

    .channel-schedule {
      font-size: 12px;
      color: #666;
      padding-top: 12px;
      border-top: 1px solid #333;
    }

    .channel-schedule span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* \uBE48 \uC0C1\uD0DC */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 18px;
      color: #888;
      margin-bottom: 8px;
    }

    .empty-state p {
      margin-bottom: 20px;
    }

    /* \uC790\uB3D9\uD654 \uD604\uD669 */
    .automation-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
    }

    .automation-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .automation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #222;
      border-radius: 8px;
    }

    .automation-item .channel-name {
      font-weight: 500;
    }

    .automation-item .schedule-info {
      font-size: 13px;
      color: #888;
    }

    .automation-item .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
    }

    .automation-item .status-badge.running {
      background: #052e16;
      color: #10b981;
    }

    .automation-item .status-badge.paused {
      background: #422006;
      color: #f59e0b;
    }

    /* \uD1A0\uC2A4\uD2B8 */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }

    .site-footer {
      margin-top: 60px;
      padding: 20px 0;
      border-top: 1px solid #333;
      text-align: center;
    }

    .footer-copy {
      color: #555;
      font-size: 12px;
    }

    .footer-copy a {
      color: #555;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-copy a:hover {
      color: #888;
    }

    .footer-copy a span {
      color: #ef4444;
    }

    /* \uC628\uBCF4\uB529 \uAC00\uC774\uB4DC */
    .onboarding-guide {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #333;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 40px;
    }

    .onboarding-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .onboarding-header h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .onboarding-header p {
      color: #888;
      font-size: 14px;
    }

    .onboarding-steps {
      display: flex;
      flex-direction: column;
      gap: 0;
      max-width: 500px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #1a1a1a;
      border-radius: 12px;
      border: 2px solid #333;
      transition: all 0.2s;
    }

    .step.current {
      border-color: #3b82f6;
      background: #172554;
    }

    .step.completed {
      border-color: #10b981;
      background: #052e16;
    }

    .step.disabled {
      opacity: 0.5;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    .step.current .step-number {
      background: #3b82f6;
    }

    .step.completed .step-number {
      background: #10b981;
    }

    .step-content {
      flex: 1;
    }

    .step-content h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .step-content p {
      font-size: 13px;
      color: #888;
      margin-bottom: 12px;
    }

    .step-done {
      color: #10b981;
      font-size: 13px;
      font-weight: 500;
    }

    .step-locked {
      color: #666;
      font-size: 13px;
    }

    .step-connector {
      width: 2px;
      height: 24px;
      background: #3b82f6;
      margin-left: 37px;
    }

    .step-connector.disabled {
      background: #333;
    }

    .btn-sm {
      padding: 8px 14px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <h1>Autonomey</h1>
        <p class="welcome">\u{1F44B} ${escapeHtml2(user2.name)}\uB2D8, \uD658\uC601\uD569\uB2C8\uB2E4</p>
      </div>
      <div class="header-right">
        <a href="/channels" class="nav-link active">\u{1F4CB} \uCC44\uB110 \uBAA9\uB85D</a>
        <a href="/settings" class="nav-link">\u2699\uFE0F \uACC4\uC815 \uC124\uC815</a>
        <button onclick="logout()" class="btn btn-danger">\u{1F6AA} \uB85C\uADF8\uC544\uC6C3</button>
      </div>
    </header>

    ${!hasApiKey ? `
    <div class="api-key-banner warning">
      <div class="message">
        <span class="icon">\u26A0\uFE0F</span>
        <div class="text">
          <h3>OpenRouter API Key\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4</h3>
          <p>AI \uBD84\uB958 \uBC0F \uC751\uB2F5 \uC0DD\uC131 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD558\uB824\uBA74 API Key\uB97C \uC124\uC815\uD574\uC8FC\uC138\uC694. \uB313\uAE00 \uC218\uC9D1/\uAC8C\uC2DC\uB294 \uAC00\uB2A5\uD569\uB2C8\uB2E4.</p>
        </div>
      </div>
      <a href="/settings" class="btn btn-primary">API Key \uC124\uC815\uD558\uAE30</a>
    </div>
    ` : `
    <div class="api-key-banner">
      <div class="message">
        <span class="icon">\u2705</span>
        <div class="text">
          <h3>AI \uAE30\uB2A5 \uC0AC\uC6A9 \uAC00\uB2A5</h3>
          <p>OpenRouter API Key\uAC00 \uC124\uC815\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uBAA8\uB4E0 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
        </div>
      </div>
      <a href="/settings" class="btn btn-secondary">\uC124\uC815 \uBCC0\uACBD</a>
    </div>
    `}

    <h2 class="section-title">\u{1F4FA} \uB0B4 \uCC44\uB110</h2>

    ${channels2.length === 0 ? `
    <!-- \uCCAB \uBC29\uBB38 \uC628\uBCF4\uB529 \uAC00\uC774\uB4DC -->
    <div class="onboarding-guide">
      <div class="onboarding-header">
        <h2>\u{1F680} \uC2DC\uC791\uD558\uAE30</h2>
        <p>3\uB2E8\uACC4\uB9CC \uC644\uB8CC\uD558\uBA74 YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4</p>
      </div>

      <div class="onboarding-steps">
        <div class="step ${hasApiKey ? "completed" : "current"}">
          <div class="step-number">${hasApiKey ? "\u2713" : "1"}</div>
          <div class="step-content">
            <h3>OpenRouter API Key \uC124\uC815</h3>
            <p>AI \uBD84\uB958 \uBC0F \uC751\uB2F5 \uC0DD\uC131\uC5D0 \uD544\uC694\uD569\uB2C8\uB2E4</p>
            ${!hasApiKey ? `<a href="/settings" class="btn btn-primary btn-sm">\uC124\uC815\uD558\uB7EC \uAC00\uAE30</a>` : `<span class="step-done">\uC644\uB8CC\uB428</span>`}
          </div>
        </div>

        <div class="step-connector ${hasApiKey ? "" : "disabled"}"></div>

        <div class="step ${hasApiKey ? "current" : "disabled"}">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>YouTube \uCC44\uB110 \uC5F0\uB3D9</h3>
            <p>\uB313\uAE00\uC744 \uAC00\uC838\uC62C \uCC44\uB110\uC744 \uC5F0\uACB0\uD569\uB2C8\uB2E4</p>
            ${hasApiKey ? `<a href="/oauth/start" class="btn btn-primary btn-sm">\uCC44\uB110 \uC5F0\uB3D9\uD558\uAE30</a>` : `<span class="step-locked">\u{1F512} 1\uB2E8\uACC4\uB97C \uBA3C\uC800 \uC644\uB8CC\uD558\uC138\uC694</span>`}
          </div>
        </div>

        <div class="step-connector disabled"></div>

        <div class="step disabled">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>\uCCAB \uB313\uAE00 \uC218\uC9D1</h3>
            <p>\uB300\uC2DC\uBCF4\uB4DC\uC5D0\uC11C "\uB313\uAE00 \uAC00\uC838\uC624\uAE30" \uD074\uB9AD</p>
            <span class="step-locked">\u{1F512} \uCC44\uB110 \uC5F0\uB3D9 \uD6C4 \uC9C4\uD589</span>
          </div>
        </div>
      </div>
    </div>
    ` : `
    <div class="channels-grid">
      ${channels2.map((channel) => `
        <a href="/channels/${channel.id}" class="channel-card">
          <div class="channel-header">
            <div class="channel-info">
              <h3>\u{1F3AC} ${escapeHtml2(channel.youtube.channelTitle)}</h3>
              <span class="channel-id">${channel.youtube.channelId}</span>
            </div>
            <span class="channel-status ${channel.isActive ? "active" : "inactive"}">
              ${channel.isActive ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}
            </span>
          </div>
          <div class="channel-stats">
            <div class="stat-item">
              <div class="label">\uBBF8\uC751\uB2F5</div>
              <div class="value pending">${channel.stats?.pending || 0}</div>
            </div>
            <div class="stat-item">
              <div class="label">\uC2B9\uC778\uB300\uAE30</div>
              <div class="value generated">${channel.stats?.generated || 0}</div>
            </div>
          </div>
          <div class="channel-schedule">
            <span>\u23F0 ${getScheduleLabel(channel.schedule.fetchInterval)}</span>
            ${channel.schedule.autoApprove ? `<span style="margin-left: 12px;">\u{1F916} \uC790\uB3D9\uC2B9\uC778</span>` : `<span style="margin-left: 12px;">\u270B \uC218\uB3D9\uC2B9\uC778</span>`}
          </div>
        </a>
      `).join("")}

      <a href="/oauth/start" class="channel-card add-new">
        <span class="icon">+</span>
        <span>\uCC44\uB110 \uCD94\uAC00\uD558\uAE30</span>
      </a>
    </div>

    ${channels2.length > 0 ? `
    <h2 class="section-title">\u23F0 \uC790\uB3D9\uD654 \uD604\uD669</h2>
    <div class="automation-section">
      <div class="automation-list">
        ${channels2.map((channel) => `
          <div class="automation-item">
            <div>
              <span class="channel-name">${escapeHtml2(channel.youtube.channelTitle)}</span>
              <span class="schedule-info">
                \u2022 ${getScheduleLabel(channel.schedule.fetchInterval)} \uC218\uC9D1
                ${channel.schedule.autoApprove ? `, ${channel.schedule.approveTimes.join("/")} \uC2B9\uC778` : ", \uC218\uB3D9 \uC2B9\uC778"}
              </span>
            </div>
            <span class="status-badge ${channel.isActive ? "running" : "paused"}">
              ${channel.isActive ? "\uC2E4\uD589 \uC911" : "\uC77C\uC2DC\uC815\uC9C0"}
            </span>
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}
    `}

    <footer class="site-footer">
      <div class="footer-copy">
        \xA9 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with \u2764\uFE0F by <span>AI\uC7A1\uB3CC\uC774</span></a>
      </div>
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    function logout() {
      if (!confirm('\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;

      // \uD1A0\uD070 \uC0AD\uC81C
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';

      // \uB85C\uADF8\uC778 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9
      window.location.href = '/login';
    }

    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast ' + type + ' show';
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  <\/script>
</body>
</html>`;
}
function escapeHtml2(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function getScheduleLabel(interval) {
  const labels = {
    "hourly": "\uB9E4\uC2DC\uAC04",
    "every30min": "30\uBD84\uB9C8\uB2E4",
    "every15min": "15\uBD84\uB9C8\uB2E4"
  };
  return labels[interval] || interval;
}

// src/views/settings.ts
function renderSettings(props) {
  const { user: user2, userChannels } = props;
  const hasApiKey = !!user2.openrouterApiKey;
  const maskedKey = hasApiKey ? user2.openrouterApiKey.slice(0, 8) + "..." + user2.openrouterApiKey.slice(-4) : "";
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uC124\uC815 - Autonomey</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .channel-selector {
      position: relative;
    }

    .channel-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 180px;
    }

    .channel-btn:hover {
      background: #222;
      border-color: #444;
    }

    .channel-btn .icon {
      font-size: 18px;
    }

    .channel-btn .arrow {
      margin-left: auto;
      font-size: 12px;
      color: #888;
    }

    .channel-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      min-width: 220px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      z-index: 1000;
      display: none;
      overflow: hidden;
    }

    .channel-dropdown.show {
      display: block;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      color: #fff;
      text-decoration: none;
      transition: background 0.15s;
      font-size: 14px;
    }

    .dropdown-item:hover {
      background: #222;
    }

    .dropdown-item.add-new {
      border-top: 1px solid #333;
      color: #3b82f6;
    }

    .dropdown-item.add-new:hover {
      background: #172554;
    }

    .dropdown-item .channel-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .dropdown-item .channel-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-link {
      color: #888;
      text-decoration: none;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .nav-link:hover {
      color: #fff;
      background: #222;
    }

    .nav-link.active {
      color: #3b82f6;
      background: #172554;
    }

    h1 {
      font-size: 24px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-danger {
      background: transparent;
      color: #888;
      border: 1px solid #333;
    }

    .btn-danger:hover {
      background: #7f1d1d;
      color: #fca5a5;
      border-color: #7f1d1d;
    }

    /* \uC139\uC158 \uC2A4\uD0C0\uC77C */
    .settings-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .settings-section h2 {
      font-size: 18px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .settings-section .description {
      color: #888;
      font-size: 14px;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
    }

    input[type="text"],
    input[type="password"],
    input[type="email"] {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #0f0f0f;
      color: #fff;
      font-size: 14px;
      font-family: monospace;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    input::placeholder {
      color: #555;
    }

    .input-group {
      display: flex;
      gap: 10px;
    }

    .input-group input {
      flex: 1;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #333;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #444;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* \uD604\uC7AC \uC0C1\uD0DC \uD45C\uC2DC */
    .current-value {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #222;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .current-value .value {
      font-family: monospace;
      color: #10b981;
    }

    .current-value .value.none {
      color: #f59e0b;
    }

    .current-value .actions {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-text {
      background: transparent;
      color: #3b82f6;
      padding: 6px 12px;
    }

    .btn-text:hover {
      background: #1e3a5f;
    }

    .btn-text.danger {
      color: #ef4444;
    }

    .btn-text.danger:hover {
      background: #450a0a;
    }

    /* \uC228\uAE40 \uD3FC */
    .hidden-form {
      display: none;
      padding-top: 16px;
      border-top: 1px solid #333;
      margin-top: 16px;
    }

    .hidden-form.show {
      display: block;
    }

    /* \uB3C4\uC6C0\uB9D0 \uB9C1\uD06C */
    .help-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #172554;
      border: 1px solid #1e3a5f;
      border-radius: 8px;
      margin-top: 16px;
      text-decoration: none;
      color: #93c5fd;
      font-size: 14px;
      transition: all 0.2s;
    }

    .help-link:hover {
      background: #1e3a5f;
    }

    /* \uD504\uB85C\uD544 \uC139\uC158 */
    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .profile-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #333;
    }

    .profile-row:last-child {
      border-bottom: none;
    }

    .profile-row .label {
      color: #888;
      font-size: 14px;
    }

    .profile-row .value {
      font-size: 14px;
    }

    /* \uD1A0\uC2A4\uD2B8 */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }

    .site-footer {
      margin-top: 60px;
      padding: 20px 0;
      border-top: 1px solid #333;
      text-align: center;
    }

    .footer-copy {
      color: #555;
      font-size: 12px;
    }

    .footer-copy a {
      color: #555;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-copy a:hover {
      color: #888;
    }

    .footer-copy a span {
      color: #ef4444;
    }

    /* \uB85C\uB529 */
    .loading {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff40;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <div class="channel-selector">
          <button class="channel-btn" onclick="toggleChannelDropdown()">
            <span class="icon">\u{1F4FA}</span>
            <span>\uCC44\uB110 \uC120\uD0DD</span>
            <span class="arrow">\u25BC</span>
          </button>
          <div class="channel-dropdown" id="channelDropdown">
            ${userChannels.map((ch) => `
              <a href="/channels/${ch.id}" class="dropdown-item">
                <span class="channel-icon">\u{1F4FA}</span>
                <span class="channel-name">${escapeHtml3(ch.youtube.channelTitle)}</span>
              </a>
            `).join("")}
            <a href="/oauth/start" class="dropdown-item add-new">
              <span class="channel-icon">\u2795</span>
              <span>\uC0C8 \uCC44\uB110 \uCD94\uAC00</span>
            </a>
          </div>
        </div>
      </div>
      <div class="header-right">
        <a href="/channels" class="nav-link">\u{1F4CB} \uCC44\uB110 \uBAA9\uB85D</a>
        <a href="/settings" class="nav-link active">\u2699\uFE0F \uACC4\uC815 \uC124\uC815</a>
        <button onclick="logout()" class="btn btn-danger">\u{1F6AA} \uB85C\uADF8\uC544\uC6C3</button>
      </div>
    </header>

    <h1 style="margin-bottom: 8px;">\u2699\uFE0F \uACC4\uC815 \uC124\uC815</h1>
    <p style="color: #888; font-size: 14px; margin-bottom: 30px;">
      AI API Key\uC640 \uD504\uB85C\uD544\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uCC44\uB110\uBCC4 \uC751\uB2F5 \uC9C0\uCE68\uC740 \uAC01 \uCC44\uB110 \uB300\uC2DC\uBCF4\uB4DC\uC5D0\uC11C \uC124\uC815\uD558\uC138\uC694.
    </p>

    <!-- OpenRouter API Key \uC139\uC158 -->
    <div class="settings-section">
      <h2>\u{1F511} OpenRouter API Key</h2>
      <p class="description">
        AI \uBD84\uB958 \uBC0F \uC751\uB2F5 \uC0DD\uC131 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD558\uB824\uBA74 OpenRouter API Key\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.<br>
        API Key \uC5C6\uC774\uB3C4 \uB313\uAE00 \uC218\uC9D1 \uBC0F \uAC8C\uC2DC \uAE30\uB2A5\uC740 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
      </p>

      <div class="current-value">
        <div>
          <span style="color: #888; font-size: 13px;">\uD604\uC7AC \uC124\uC815:</span>
          <span class="value ${hasApiKey ? "" : "none"}" id="currentKeyDisplay">
            ${hasApiKey ? maskedKey : "\uC124\uC815\uB418\uC9C0 \uC54A\uC74C"}
          </span>
        </div>
        <div class="actions">
          ${hasApiKey ? `
            <button class="btn btn-sm btn-text" onclick="toggleApiKeyForm()">\uBCC0\uACBD</button>
            <button class="btn btn-sm btn-text danger" onclick="removeApiKey()">\uC0AD\uC81C</button>
          ` : `
            <button class="btn btn-sm btn-primary" onclick="toggleApiKeyForm()">\uC124\uC815\uD558\uAE30</button>
          `}
        </div>
      </div>

      <div class="hidden-form" id="apiKeyForm">
        <div class="form-group">
          <label for="apiKey">\uC0C8 API Key</label>
          <div class="input-group">
            <input
              type="password"
              id="apiKey"
              placeholder="sk-or-v1-..."
              autocomplete="off"
            >
            <button class="btn btn-secondary" type="button" onclick="toggleKeyVisibility()">\u{1F441}</button>
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="saveApiKey()" id="saveKeyBtn">
            \uC800\uC7A5
          </button>
          <button class="btn btn-secondary" onclick="toggleApiKeyForm()">\uCDE8\uC18C</button>
        </div>
      </div>

      <a href="https://openrouter.ai/keys" target="_blank" class="help-link">
        <span>\u{1F517}</span>
        <span>OpenRouter\uC5D0\uC11C API Key \uBC1C\uAE09\uBC1B\uAE30 \u2192</span>
      </a>
    </div>

    <!-- \uD504\uB85C\uD544 \uC139\uC158 -->
    <div class="settings-section">
      <h2>\u{1F464} \uB0B4 \uD504\uB85C\uD544</h2>
      <div class="profile-info">
        <div class="profile-row">
          <span class="label">\uC774\uB984</span>
          <span class="value">${escapeHtml3(user2.name)}</span>
        </div>
        <div class="profile-row">
          <span class="label">\uC774\uBA54\uC77C</span>
          <span class="value">${escapeHtml3(user2.email)}</span>
        </div>
        <div class="profile-row">
          <span class="label">\uAC00\uC785\uC77C</span>
          <span class="value">${formatDate(user2.createdAt)}</span>
        </div>
      </div>
    </div>

    <!-- \uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC139\uC158 -->
    <div class="settings-section">
      <h2>\u{1F512} \uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD</h2>
      <p class="description">\uACC4\uC815 \uBCF4\uC548\uC744 \uC704\uD574 \uC8FC\uAE30\uC801\uC73C\uB85C \uBE44\uBC00\uBC88\uD638\uB97C \uBCC0\uACBD\uD558\uC138\uC694.</p>

      <button class="btn btn-secondary" onclick="togglePasswordForm()" id="changePasswordToggle">
        \uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD\uD558\uAE30
      </button>

      <div class="hidden-form" id="passwordForm">
        <div class="form-group">
          <label for="currentPassword">\uD604\uC7AC \uBE44\uBC00\uBC88\uD638</label>
          <input type="password" id="currentPassword" placeholder="\uD604\uC7AC \uBE44\uBC00\uBC88\uD638">
        </div>
        <div class="form-group">
          <label for="newPassword">\uC0C8 \uBE44\uBC00\uBC88\uD638</label>
          <input type="password" id="newPassword" placeholder="6\uC790 \uC774\uC0C1">
        </div>
        <div class="form-group">
          <label for="confirmPassword">\uC0C8 \uBE44\uBC00\uBC88\uD638 \uD655\uC778</label>
          <input type="password" id="confirmPassword" placeholder="\uC0C8 \uBE44\uBC00\uBC88\uD638 \uB2E4\uC2DC \uC785\uB825">
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="changePassword()" id="changePasswordBtn">
            \uBCC0\uACBD\uD558\uAE30
          </button>
          <button class="btn btn-secondary" onclick="togglePasswordForm()">\uCDE8\uC18C</button>
        </div>
      </div>
    </div>

    <footer class="site-footer">
      <div class="footer-copy">
        \xA9 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with \u2764\uFE0F by <span>AI\uC7A1\uB3CC\uC774</span></a>
      </div>
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    // \uCC44\uB110 \uB4DC\uB86D\uB2E4\uC6B4 \uD1A0\uAE00
    function toggleChannelDropdown() {
      const dropdown = document.getElementById('channelDropdown');
      dropdown.classList.toggle('show');
    }

    // \uB4DC\uB86D\uB2E4\uC6B4 \uC678\uBD80 \uD074\uB9AD \uC2DC \uB2EB\uAE30
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('channelDropdown');
      const btn = e.target.closest('.channel-btn');
      if (!btn && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
      }
    });

    // API \uD638\uCD9C \uD5EC\uD37C
    async function apiCall(url, options = {}) {
      const token = localStorage.getItem('token');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });
    }

    function toggleApiKeyForm() {
      const form = document.getElementById('apiKeyForm');
      form.classList.toggle('show');
      if (form.classList.contains('show')) {
        document.getElementById('apiKey').focus();
      }
    }

    function toggleKeyVisibility() {
      const input = document.getElementById('apiKey');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    async function saveApiKey() {
      const btn = document.getElementById('saveKeyBtn');
      const apiKey = document.getElementById('apiKey').value.trim();

      if (!apiKey) {
        showToast('API Key\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694', 'error');
        return;
      }

      if (!apiKey.startsWith('sk-or-')) {
        showToast('\uC62C\uBC14\uB978 OpenRouter API Key \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>\uC800\uC7A5 \uC911...';

      try {
        const res = await apiCall('/api/user/apikey', {
          method: 'PUT',
          body: JSON.stringify({ apiKey })
        });

        const data = await res.json();

        if (data.success) {
          showToast('API Key\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (err) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '\uC800\uC7A5';
      }
    }

    async function removeApiKey() {
      if (!confirm('API Key\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?\\nAI \uBD84\uB958 \uBC0F \uC751\uB2F5 \uC0DD\uC131 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uAC8C \uB429\uB2C8\uB2E4.')) {
        return;
      }

      try {
        const res = await apiCall('/api/user/apikey', {
          method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
          showToast('API Key\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '\uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (err) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      }
    }

    function togglePasswordForm() {
      const form = document.getElementById('passwordForm');
      const toggle = document.getElementById('changePasswordToggle');
      form.classList.toggle('show');
      toggle.style.display = form.classList.contains('show') ? 'none' : 'block';
    }

    async function changePassword() {
      const btn = document.getElementById('changePasswordBtn');
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('\uBAA8\uB4E0 \uD544\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showToast('\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>\uBCC0\uACBD \uC911...';

      try {
        const res = await apiCall('/api/user/password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (data.success) {
          showToast('\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4', 'success');
          document.getElementById('currentPassword').value = '';
          document.getElementById('newPassword').value = '';
          document.getElementById('confirmPassword').value = '';
          togglePasswordForm();
        } else {
          showToast(data.error || '\uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4', 'error');
        }
      } catch (err) {
        showToast('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '\uBCC0\uACBD\uD558\uAE30';
      }
    }

    function logout() {
      if (!confirm('\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      window.location.href = '/login';
    }

    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast ' + type + ' show';
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  <\/script>
</body>
</html>`;
}
function escapeHtml3(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// src/views/landing.ts
function renderLanding() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autonomey - YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 AI</title>
  <meta name="description" content="AI\uAC00 \uB2F9\uC2E0\uC758 \uCC44\uB110 \uD1A4\uC5D0 \uB9DE\uCDB0 YouTube \uB313\uAE00\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC751\uB2F5\uD569\uB2C8\uB2E4. \uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uC138\uC694.">
  <meta name="keywords" content="YouTube, \uB313\uAE00, \uC790\uB3D9\uC751\uB2F5, AI, \uC720\uD29C\uBE0C, \uB313\uAE00\uAD00\uB9AC, \uC790\uB3D9\uD654">

  <!-- Open Graph -->
  <meta property="og:title" content="Autonomey - YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 AI">
  <meta property="og:description" content="AI\uAC00 \uB2F9\uC2E0\uC758 \uCC44\uB110 \uD1A4\uC5D0 \uB9DE\uCDB0 YouTube \uB313\uAE00\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC751\uB2F5\uD569\uB2C8\uB2E4.">
  <meta property="og:type" content="website">

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --secondary: #10b981;
      --secondary-hover: #059669;
      --accent: #f59e0b;
      --bg-dark: #0f0f0f;
      --bg-card: #1a1a1a;
      --bg-card-hover: #222;
      --border: #333;
      --text: #fff;
      --text-muted: #888;
      --text-dim: #666;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
      background: var(--bg-dark);
      color: var(--text);
      line-height: 1.6;
    }

    /* Navigation */
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(15, 15, 15, 0.9);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      z-index: 1000;
      padding: 0 20px;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
    }

    .logo {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-links {
      display: flex;
      gap: 30px;
      align-items: center;
    }

    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .nav-links a:hover {
      color: var(--text);
    }

    .nav-cta {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-ghost {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-ghost:hover {
      background: var(--bg-card);
      border-color: #555;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: var(--secondary);
      color: white;
    }

    .btn-secondary:hover {
      background: var(--secondary-hover);
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 16px;
    }

    /* Sections */
    section {
      padding: 100px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding-top: 64px;
      background: radial-gradient(ellipse at top, #1a1a3a 0%, var(--bg-dark) 60%);
    }

    .hero-content {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      margin-bottom: 24px;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .hero h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 24px;
      line-height: 1.2;
    }

    .hero h1 span {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      font-size: 20px;
      color: var(--text-muted);
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .hero-cta {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 40px;
    }

    .hero-features {
      display: flex;
      justify-content: center;
      gap: 30px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .hero-features span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hero-features .check {
      color: var(--secondary);
    }

    /* Problem Section */
    .problem {
      background: var(--bg-dark);
    }

    .section-title {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title h2 {
      font-size: 36px;
      margin-bottom: 16px;
    }

    .section-title p {
      color: var(--text-muted);
      font-size: 18px;
    }

    .problem-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .problem-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      transition: transform 0.2s, border-color 0.2s;
    }

    .problem-card:hover {
      transform: translateY(-4px);
      border-color: #444;
    }

    .problem-card .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .problem-card h3 {
      font-size: 20px;
      margin-bottom: 12px;
    }

    .problem-card p {
      color: var(--text-muted);
      font-size: 15px;
    }

    /* Solution Section */
    .solution {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 100%);
    }

    .solution-demo {
      max-width: 700px;
      margin: 0 auto;
    }

    .demo-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    .demo-header {
      background: #222;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .demo-dots {
      display: flex;
      gap: 6px;
    }

    .demo-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .demo-dot.red { background: #ef4444; }
    .demo-dot.yellow { background: #f59e0b; }
    .demo-dot.green { background: #10b981; }

    .demo-title {
      color: var(--text-muted);
      font-size: 13px;
    }

    .demo-content {
      padding: 24px;
    }

    .demo-comment {
      background: #222;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .demo-comment-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .demo-avatar {
      width: 32px;
      height: 32px;
      background: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .demo-author {
      font-weight: 600;
      font-size: 14px;
    }

    .demo-text {
      color: var(--text);
      font-size: 15px;
      line-height: 1.5;
    }

    .demo-arrow {
      text-align: center;
      padding: 16px;
      color: var(--text-muted);
      font-size: 24px;
    }

    .demo-classification {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: var(--secondary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      margin-bottom: 12px;
    }

    .demo-reply {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 16px;
    }

    .demo-reply-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .demo-reply-avatar {
      width: 32px;
      height: 32px;
      background: var(--secondary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .demo-reply-label {
      font-size: 12px;
      color: var(--primary);
      background: rgba(59, 130, 246, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Steps Section */
    .steps {
      background: var(--bg-dark);
    }

    .steps-list {
      max-width: 600px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      gap: 24px;
      margin-bottom: 40px;
      position: relative;
    }

    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 24px;
      top: 56px;
      width: 2px;
      height: calc(100% - 16px);
      background: var(--border);
    }

    .step-number {
      width: 48px;
      height: 48px;
      background: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-content h3 {
      font-size: 20px;
      margin-bottom: 8px;
    }

    .step-content p {
      color: var(--text-muted);
      font-size: 15px;
    }

    .step-content .hint {
      display: inline-block;
      background: var(--bg-card);
      color: var(--text-dim);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 8px;
    }

    /* Features Section */
    .features {
      background: linear-gradient(180deg, #0a1628 0%, var(--bg-dark) 100%);
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }

    .feature-card .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .feature-card .badge.positive { background: #052e16; color: #10b981; }
    .feature-card .badge.negative { background: #450a0a; color: #ef4444; }
    .feature-card .badge.question { background: #172554; color: #3b82f6; }
    .feature-card .badge.suggestion { background: #3f3f46; color: #a78bfa; }
    .feature-card .badge.reaction { background: #422006; color: #fbbf24; }
    .feature-card .badge.other { background: #27272a; color: #a1a1aa; }

    .feature-card h4 {
      font-size: 15px;
      margin-bottom: 8px;
    }

    .feature-card p {
      color: var(--text-muted);
      font-size: 14px;
    }

    /* Workflow Section */
    .workflow {
      background: var(--bg-dark);
    }

    .workflow-steps {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .workflow-step {
      text-align: center;
    }

    .workflow-icon {
      width: 64px;
      height: 64px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 12px;
    }

    .workflow-step p {
      font-size: 14px;
      color: var(--text-muted);
    }

    .workflow-arrow {
      font-size: 24px;
      color: var(--border);
    }

    /* Schedule Section */
    .schedule {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 100%);
    }

    .schedule-timeline {
      max-width: 600px;
      margin: 0 auto;
    }

    .schedule-item {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .schedule-time {
      min-width: 90px;
      padding: 8px 12px;
      background: var(--primary);
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      height: fit-content;
    }

    .schedule-content h4 {
      font-size: 16px;
      margin-bottom: 6px;
      color: var(--text);
    }

    .schedule-content p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .schedule-hint {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 6px;
    }

    .schedule-note {
      text-align: center;
      margin-top: 24px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 12px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .schedule-note p {
      color: var(--text-muted);
      font-size: 14px;
    }

    .schedule-note strong {
      color: var(--secondary);
    }

    /* Pricing Section */
    .pricing {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 100%);
    }

    .pricing-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      max-width: 700px;
      margin: 0 auto;
    }

    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
    }

    .pricing-card.featured {
      border-color: var(--primary);
      position: relative;
    }

    .pricing-card.featured::before {
      content: '\uCD94\uCC9C';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: white;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .pricing-card .plan-icon {
      font-size: 40px;
      margin-bottom: 16px;
    }

    .pricing-card h3 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .pricing-card .price {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .pricing-card .price span {
      font-size: 16px;
      color: var(--text-muted);
      font-weight: 400;
    }

    .pricing-card .note {
      font-size: 13px;
      color: var(--text-dim);
      margin-bottom: 24px;
    }

    .pricing-card ul {
      list-style: none;
      text-align: left;
      margin-bottom: 24px;
    }

    .pricing-card li {
      padding: 8px 0;
      font-size: 14px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pricing-card li .check {
      color: var(--secondary);
    }

    .pricing-card .btn {
      width: 100%;
    }

    .pricing-hint {
      text-align: center;
      margin-top: 32px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 12px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .pricing-hint p {
      color: var(--text-muted);
      font-size: 14px;
    }

    /* FAQ Section */
    .faq {
      background: var(--bg-dark);
    }

    .faq-list {
      max-width: 700px;
      margin: 0 auto;
    }

    .faq-item {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .faq-question {
      padding: 20px 24px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 16px;
    }

    .faq-question:hover {
      background: var(--bg-card-hover);
    }

    .faq-toggle {
      color: var(--text-muted);
      transition: transform 0.2s;
    }

    .faq-item.open .faq-toggle {
      transform: rotate(180deg);
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .faq-item.open .faq-answer {
      max-height: 500px;
    }

    .faq-answer-content {
      padding: 0 24px 20px;
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.7;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 50%, var(--bg-dark) 100%);
      text-align: center;
    }

    .cta-section h2 {
      font-size: 36px;
      margin-bottom: 16px;
    }

    .cta-section p {
      color: var(--text-muted);
      font-size: 18px;
      margin-bottom: 32px;
    }

    /* Footer */
    footer {
      background: var(--bg-dark);
      border-top: 1px solid var(--border);
      padding: 40px 20px;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .footer-logo {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
    }

    .footer-links {
      display: flex;
      gap: 24px;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
    }

    .footer-links a:hover {
      color: var(--text);
    }

    .footer-copy {
      color: var(--text-dim);
      font-size: 13px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }

      .hero h1 {
        font-size: 32px;
      }

      .hero p {
        font-size: 16px;
      }

      .hero-cta {
        flex-direction: column;
        align-items: center;
      }

      .hero-features {
        flex-direction: column;
        gap: 12px;
      }

      .section-title h2 {
        font-size: 28px;
      }

      .workflow-steps {
        flex-direction: column;
      }

      .workflow-arrow {
        transform: rotate(90deg);
      }

      .footer-content {
        flex-direction: column;
        text-align: center;
      }
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.6s ease forwards;
    }

    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.2s; }
    .delay-3 { animation-delay: 0.3s; }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav>
    <div class="nav-container">
      <a href="/" class="logo">
        <span>\u{1F3AC}</span> Autonomey
      </a>
      <div class="nav-links">
        <a href="#features">\uAE30\uB2A5</a>
        <a href="#pricing">\uC694\uAE08</a>
        <a href="#faq">FAQ</a>
      </div>
      <div class="nav-cta">
        <a href="/login" class="btn btn-ghost">\uB85C\uADF8\uC778</a>
        <a href="/login" class="btn btn-primary">\uBB34\uB8CC\uB85C \uC2DC\uC791</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">\u{1F680} Beta - \uBB34\uB8CC\uB85C \uC0AC\uC6A9\uD574\uBCF4\uC138\uC694</div>
        <h1>
          \uB313\uAE00 \uD558\uB098\uD558\uB098 \uB2F5\uD558\uB290\uB77C<br>
          <span>\uC601\uC0C1 \uB9CC\uB4E4 \uC2DC\uAC04\uC774 \uC5C6\uC73C\uC2E0\uAC00\uC694?</span>
        </h1>
        <p>
          AI\uAC00 \uB2F9\uC2E0\uC758 \uCC44\uB110 \uD1A4\uC5D0 \uB9DE\uCDB0<br>
          \uB313\uAE00\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC751\uB2F5\uD569\uB2C8\uB2E4.
        </p>
        <div class="hero-cta">
          <a href="/login" class="btn btn-primary btn-large">\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30</a>
          <a href="#demo" class="btn btn-ghost btn-large">\uB370\uBAA8 \uBCF4\uAE30</a>
        </div>
        <div class="hero-features">
          <span><span class="check">\u2713</span> Beta \uAE30\uAC04 \uBB34\uB8CC</span>
          <span><span class="check">\u2713</span> \uC2E0\uC6A9\uCE74\uB4DC \uBD88\uD544\uC694</span>
          <span><span class="check">\u2713</span> 5\uBD84 \uC548\uC5D0 \uC124\uC815 \uC644\uB8CC</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Problem Section -->
  <section class="problem">
    <div class="container">
      <div class="section-title">
        <h2>\u{1F4AC} \uC720\uD29C\uBC84\uC758 \uC228\uACA8\uC9C4 \uACE0\uBBFC</h2>
        <p>\uAD6C\uB3C5\uC790\uAC00 \uB298\uC218\uB85D \uCEE4\uC9C0\uB294 \uB313\uAE00 \uAD00\uB9AC \uBD80\uB2F4</p>
      </div>
      <div class="problem-cards">
        <div class="problem-card">
          <div class="icon">\u{1F629}</div>
          <h3>\uB313\uAE00 \uD3ED\uC8FC</h3>
          <p>\uAD6C\uB3C5\uC790\uAC00 \uB298\uC218\uB85D<br>\uAC10\uB2F9\uD560 \uC218 \uC5C6\uB294 \uB313\uAE00 \uC591</p>
        </div>
        <div class="problem-card">
          <div class="icon">\u23F0</div>
          <h3>\uC2DC\uAC04 \uBD80\uC871</h3>
          <p>\uC601\uC0C1 \uD3B8\uC9D1\uD558\uAE30\uB3C4 \uBC14\uC05C\uB370<br>\uB313\uAE00\uAE4C\uC9C0 \uC2E0\uACBD \uC4F8 \uC5EC\uC720\uAC00...</p>
        </div>
        <div class="problem-card">
          <div class="icon">\u{1F614}</div>
          <h3>\uD32C \uC774\uD0C8</h3>
          <p>\uB2F5\uBCC0 \uC5C6\uC73C\uBA74 \uD32C\uC774 \uB5A0\uB098\uACE0<br>\uCC44\uB110 \uC131\uC7A5\uC774 \uBA48\uCD98\uB2E4</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Solution Section -->
  <section class="solution" id="demo">
    <div class="container">
      <div class="section-title">
        <h2>\u{1F916} AI\uAC00 \uB2F9\uC2E0\uCC98\uB7FC \uB2F5\uD569\uB2C8\uB2E4</h2>
        <p>\uB2F9\uC2E0\uC758 \uB9D0\uD22C\uC640 \uCC44\uB110 \uCEE8\uC149\uC744 \uD559\uC2B5\uD574\uC11C \uC9C4\uC9DC \uB2F9\uC2E0\uCC98\uB7FC \uC751\uB2F5\uD569\uB2C8\uB2E4</p>
      </div>
      <div class="solution-demo">
        <div class="demo-card">
          <div class="demo-header">
            <div class="demo-dots">
              <span class="demo-dot red"></span>
              <span class="demo-dot yellow"></span>
              <span class="demo-dot green"></span>
            </div>
            <span class="demo-title">YouTube \uB313\uAE00</span>
          </div>
          <div class="demo-content">
            <div class="demo-comment">
              <div class="demo-comment-header">
                <div class="demo-avatar">\u{1F464}</div>
                <span class="demo-author">\uC5F4\uC815\uC801\uC778\uC2DC\uCCAD\uC790</span>
              </div>
              <p class="demo-text">\uC774 \uC601\uC0C1 \uC9C4\uC9DC \uB3C4\uC6C0\uB410\uC5B4\uC694! \uAC10\uC0AC\uD569\uB2C8\uB2E4 \u314E\u314E</p>
            </div>

            <div class="demo-arrow">\u2193 AI \uC790\uB3D9 \uBD84\uB958</div>
            <div class="demo-classification">\u2713 \uAE0D\uC815 \uB313\uAE00</div>

            <div class="demo-reply">
              <div class="demo-reply-header">
                <div class="demo-reply-avatar">\u{1F916}</div>
                <span class="demo-author">AI \uC790\uB3D9 \uC751\uB2F5</span>
                <span class="demo-reply-label">\uAC80\uD1A0 \uD6C4 \uAC8C\uC2DC</span>
              </div>
              <p class="demo-text">\uC2DC\uCCAD\uD574\uC8FC\uC154\uC11C \uAC10\uC0AC\uD574\uC694! \u{1F60A} \uB3C4\uC6C0\uC774 \uB410\uB2E4\uB2C8 \uC815\uB9D0 \uBFCC\uB4EF\uD569\uB2C8\uB2E4. \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uAE30\uB300\uD574\uC8FC\uC138\uC694!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Steps Section -->
  <section class="steps">
    <div class="container">
      <div class="section-title">
        <h2>\u26A1 3\uB2E8\uACC4\uB85C \uB05D\uB098\uB294 \uC124\uC815</h2>
        <p>\uBCF5\uC7A1\uD55C \uC124\uC815 \uC5C6\uC774 \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694</p>
      </div>
      <div class="steps-list">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>\uD68C\uC6D0\uAC00\uC785 & API Key \uC124\uC815</h3>
            <p>OpenRouter API Key\uB9CC \uC788\uC73C\uBA74 OK</p>
            <span class="hint">\u{1F4A1} \uBB34\uB8CC \uD06C\uB808\uB527\uC73C\uB85C \uC2DC\uC791 \uAC00\uB2A5</span>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>YouTube \uCC44\uB110 \uC5F0\uB3D9</h3>
            <p>OAuth\uB85C \uC548\uC804\uD558\uAC8C \uC5F0\uACB0, \uC5EC\uB7EC \uCC44\uB110 \uB3D9\uC2DC \uAD00\uB9AC \uAC00\uB2A5</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>\uC751\uB2F5 \uC2A4\uD0C0\uC77C \uC124\uC815</h3>
            <p>\uB313\uAE00 \uC720\uD615\uBCC4 \uD1A4\uC564\uB9E4\uB108 \uCEE4\uC2A4\uD140, \uC790\uB3D9/\uC218\uB3D9 \uC2B9\uC778 \uC120\uD0DD</p>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="/login" class="btn btn-primary btn-large">\uC9C0\uAE08 \uC2DC\uC791\uD558\uAE30</a>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features" id="features">
    <div class="container">
      <div class="section-title">
        <h2>\u{1F3F7}\uFE0F AI \uC790\uB3D9 \uBD84\uB958</h2>
        <p>\uB313\uAE00\uC744 6\uAC00\uC9C0 \uC720\uD615\uC73C\uB85C \uC790\uB3D9 \uBD84\uB958\uD558\uACE0 \uB9DE\uCDA4 \uC751\uB2F5\uC744 \uC0DD\uC131\uD569\uB2C8\uB2E4</p>
      </div>
      <div class="feature-grid">
        <div class="feature-card">
          <span class="badge positive">\uAE0D\uC815</span>
          <h4>\uCE6D\uCC2C, \uC751\uC6D0 \uB313\uAE00</h4>
          <p>\u2192 \uC9C4\uC2EC\uC5B4\uB9B0 \uAC10\uC0AC \uD45C\uD604</p>
        </div>
        <div class="feature-card">
          <span class="badge negative">\uBD80\uC815</span>
          <h4>\uBE44\uB09C, \uC545\uD50C</h4>
          <p>\u2192 \uD488\uC704\uC788\uAC8C \uB300\uC751</p>
        </div>
        <div class="feature-card">
          <span class="badge question">\uC9C8\uBB38</span>
          <h4>\uAD81\uAE08\uD55C \uC810</h4>
          <p>\u2192 \uCE5C\uC808\uD55C \uC815\uBCF4 \uC81C\uACF5</p>
        </div>
        <div class="feature-card">
          <span class="badge suggestion">\uC81C\uC548</span>
          <h4>\uCF58\uD150\uCE20 \uC694\uCCAD</h4>
          <p>\u2192 \uACF5\uAC10 + \uAC80\uD1A0 \uC57D\uC18D</p>
        </div>
        <div class="feature-card">
          <span class="badge reaction">\uBC18\uC751</span>
          <h4>\uB2E8\uC21C \uBC18\uC751 (\u314B\u314B, \uC640)</h4>
          <p>\u2192 \uAC00\uBCCD\uAC8C \uD638\uC751</p>
        </div>
        <div class="feature-card">
          <span class="badge other">\uAE30\uD0C0</span>
          <h4>\uAE30\uD0C0 \uB313\uAE00</h4>
          <p>\u2192 \uCE5C\uADFC\uD558\uAC8C \uC751\uB300</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Workflow Section -->
  <section class="workflow">
    <div class="container">
      <div class="section-title">
        <h2>\u{1F504} \uC774\uB807\uAC8C \uC791\uB3D9\uD569\uB2C8\uB2E4</h2>
      </div>
      <div class="workflow-steps">
        <div class="workflow-step">
          <div class="workflow-icon">\u{1F4E5}</div>
          <p>\uB313\uAE00 \uAC00\uC838\uC624\uAE30</p>
        </div>
        <span class="workflow-arrow">\u2192</span>
        <div class="workflow-step">
          <div class="workflow-icon">\u{1F3F7}\uFE0F</div>
          <p>AI \uC790\uB3D9 \uBD84\uB958</p>
        </div>
        <span class="workflow-arrow">\u2192</span>
        <div class="workflow-step">
          <div class="workflow-icon">\u270D\uFE0F</div>
          <p>\uB9DE\uCDA4 \uC751\uB2F5 \uC0DD\uC131</p>
        </div>
        <span class="workflow-arrow">\u2192</span>
        <div class="workflow-step">
          <div class="workflow-icon">\u2705</div>
          <p>\uAC80\uD1A0 & \uC2B9\uC778</p>
        </div>
        <span class="workflow-arrow">\u2192</span>
        <div class="workflow-step">
          <div class="workflow-icon">\u{1F4E4}</div>
          <p>YouTube \uAC8C\uC2DC</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Schedule Section -->
  <section class="schedule" id="schedule">
    <div class="container">
      <div class="section-title">
        <h2>\u23F0 \uC790\uB3D9\uD654 \uC2A4\uCF00\uC904</h2>
        <p>\uC124\uC815\uB9CC \uD574\uB450\uBA74 \uC790\uB3D9\uC73C\uB85C \uB313\uAE00\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4</p>
      </div>
      <div class="schedule-timeline">
        <div class="schedule-item">
          <div class="schedule-time">\uB9E4 \uC2DC\uAC04</div>
          <div class="schedule-content">
            <h4>\u{1F4E5} \uB313\uAE00 \uC218\uC9D1 + \u{1F3F7}\uFE0F AI \uBD84\uB958 + \u270D\uFE0F \uC751\uB2F5 \uC0DD\uC131</h4>
            <p>\uC0C8\uB85C\uC6B4 \uB313\uAE00\uC744 \uC790\uB3D9\uC73C\uB85C \uAC00\uC838\uC640\uC11C AI\uAC00 \uC720\uD615 \uBD84\uB958 \uD6C4 \uB9DE\uCDA4 \uC751\uB2F5\uC744 \uC0DD\uC131\uD569\uB2C8\uB2E4</p>
          </div>
        </div>
        <div class="schedule-item">
          <div class="schedule-time">\uC124\uC815\uD55C \uC2DC\uAC04</div>
          <div class="schedule-content">
            <h4>\u{1F4E4} \uC790\uB3D9 \uAC8C\uC2DC</h4>
            <p>\uC9C0\uC815\uD55C \uC2DC\uAC04\uC5D0 \uC0DD\uC131\uB41C \uC751\uB2F5\uC744 YouTube\uC5D0 \uC790\uB3D9 \uAC8C\uC2DC\uD569\uB2C8\uB2E4<br>
            <span class="schedule-hint">\uC608: 09:00, 14:00, 21:00 \uD558\uB8E8 3\uD68C</span></p>
          </div>
        </div>
        <div class="schedule-item">
          <div class="schedule-time">\uC57C\uAC04 \uC815\uC9C0</div>
          <div class="schedule-content">
            <h4>\u{1F319} \uD734\uC2DD \uC2DC\uAC04 \uC124\uC815</h4>
            <p>\uBC24 \uC2DC\uAC04\uB300(\uC608: 23:00~07:00)\uC5D0\uB294 \uC790\uB3D9 \uAC8C\uC2DC\uB97C \uC77C\uC2DC \uC815\uC9C0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4</p>
          </div>
        </div>
      </div>
      <div class="schedule-note">
        <p>\u{1F4A1} <strong>\uAC80\uD1A0 \uD6C4 \uAC8C\uC2DC \uBAA8\uB4DC</strong>: \uC790\uB3D9 \uAC8C\uC2DC \uC5C6\uC774 \uC9C1\uC811 \uD655\uC778 \uD6C4 \uC2B9\uC778\uD558\uB294 \uAC83\uB3C4 \uAC00\uB2A5\uD574\uC694</p>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section class="pricing" id="pricing">
    <div class="container">
      <div class="section-title">
        <h2>\u{1F4B0} \uC2EC\uD50C\uD55C \uC694\uAE08\uC81C</h2>
        <p>Beta \uAE30\uAC04 \uBB34\uB8CC, \uC815\uC2DD \uCD9C\uC2DC \uD6C4 \uC6D4 1,900\uC6D0</p>
      </div>
      <div class="pricing-cards">
        <div class="pricing-card featured">
          <div class="plan-icon">\u{1F389}</div>
          <h3>Beta (\uD604\uC7AC)</h3>
          <div class="price">\u20A90<span>/\uC6D4</span></div>
          <div class="note">Beta \uAE30\uAC04 \uD55C\uC815 \uBB34\uB8CC</div>
          <ul>
            <li><span class="check">\u2713</span> \uBB34\uC81C\uD55C \uCC44\uB110 \uC5F0\uB3D9</li>
            <li><span class="check">\u2713</span> \uBB34\uC81C\uD55C \uB313\uAE00 \uCC98\uB9AC</li>
            <li><span class="check">\u2713</span> AI \uC790\uB3D9 \uBD84\uB958</li>
            <li><span class="check">\u2713</span> AI \uC751\uB2F5 \uC0DD\uC131</li>
            <li><span class="check">\u2713</span> \uAC80\uD1A0 \uD6C4 \uAC8C\uC2DC</li>
            <li><span class="check">\u2713</span> \uBD84\uB958\uBCC4 \uC751\uB2F5 \uCEE4\uC2A4\uD140</li>
          </ul>
          <a href="/login" class="btn btn-primary">\uBB34\uB8CC\uB85C \uC2DC\uC791</a>
        </div>
        <div class="pricing-card">
          <div class="plan-icon">\u{1F680}</div>
          <h3>\uC815\uC2DD \uBC84\uC804</h3>
          <div class="price">\u20A91,900<span>/\uC6D4</span></div>
          <div class="note">\uC815\uC2DD \uCD9C\uC2DC \uD6C4 \uC801\uC6A9 \uC608\uC815</div>
          <ul>
            <li><span class="check">\u2713</span> Beta \uC804\uCCB4 \uAE30\uB2A5</li>
            <li><span class="check">\u2713</span> \uC790\uB3D9 \uC2A4\uCF00\uC904\uB9C1</li>
            <li><span class="check">\u2713</span> \uBD84\uC11D \uB300\uC2DC\uBCF4\uB4DC</li>
            <li><span class="check">\u2713</span> \uC6B0\uC120 \uAE30\uC220 \uC9C0\uC6D0</li>
            <li><span class="check">\u2713</span> \uC2E0\uADDC \uAE30\uB2A5 \uC6B0\uC120 \uC81C\uACF5</li>
            <li><span class="check">\u2713</span> Beta \uC720\uC800 \uD560\uC778 \uD61C\uD0DD</li>
          </ul>
          <button class="btn btn-ghost" disabled>\uCD9C\uC2DC \uC54C\uB9BC\uBC1B\uAE30</button>
        </div>
      </div>
      <div class="pricing-hint">
        <p>\u{1F4A1} AI \uBE44\uC6A9\uC740 \uBCF8\uC778\uC758 OpenRouter API Key\uB85C \uC9C1\uC811 \uAD00\uB9AC (\uB313\uAE00 1,000\uAC1C \uCC98\uB9AC \uC2DC \uC57D $0.5)</p>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq" id="faq">
    <div class="container">
      <div class="section-title">
        <h2>\u2753 \uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38</h2>
      </div>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question">
            API Key\uB294 \uC5B4\uB5BB\uAC8C \uBC1C\uAE09\uBC1B\uB098\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              OpenRouter (openrouter.ai)\uC5D0\uC11C \uBB34\uB8CC \uAC00\uC785 \uD6C4 API Key\uB97C \uBC1C\uAE09\uBC1B\uC73C\uC2DC\uBA74 \uB429\uB2C8\uB2E4.
              \uAC00\uC785 \uC2DC \uBB34\uB8CC \uD06C\uB808\uB527\uB3C4 \uC81C\uACF5\uB418\uC5B4 \uBC14\uB85C \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4!
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            \uB0B4 \uCC44\uB110 \uC815\uBCF4\uAC00 \uC548\uC804\uD55C\uAC00\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              YouTube OAuth 2.0\uC73C\uB85C \uC548\uC804\uD558\uAC8C \uC5F0\uB3D9\uB429\uB2C8\uB2E4. \uBE44\uBC00\uBC88\uD638\uB97C \uC800\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70,
              \uC5B8\uC81C\uB4E0 Google \uACC4\uC815 \uC124\uC815\uC5D0\uC11C \uC5F0\uB3D9\uC744 \uD574\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            AI \uC751\uB2F5\uC774 \uB9C8\uC74C\uC5D0 \uC548 \uB4E4\uBA74\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              \uAC80\uD1A0 \uD6C4 \uAC8C\uC2DC \uAE30\uB2A5\uC73C\uB85C \uC751\uB2F5\uC744 \uD655\uC778/\uC218\uC815\uD55C \uB4A4 \uC2B9\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
              \uB9C8\uC74C\uC5D0 \uC548 \uB4DC\uB294 \uC751\uB2F5\uC740 \uC0AD\uC81C\uD558\uAC70\uB098 \uC9C1\uC811 \uC218\uC815\uD558\uC138\uC694.
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            \uC5EC\uB7EC \uCC44\uB110\uC744 \uC6B4\uC601\uD558\uB294\uB370\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              \uC5EC\uB7EC \uCC44\uB110\uC744 \uC5F0\uB3D9\uD558\uACE0 \uAC01 \uCC44\uB110\uBCC4\uB85C \uB2E4\uB978 \uC751\uB2F5 \uC2A4\uD0C0\uC77C\uC744 \uC124\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            \uB098\uC911\uC5D0 \uC720\uB8CC\uB85C \uBC14\uB00C\uB098\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              \uB124, \uC815\uC2DD \uCD9C\uC2DC \uD6C4 \uC6D4 1,900\uC6D0\uC774 \uC801\uC6A9\uB420 \uC608\uC815\uC785\uB2C8\uB2E4.
              Beta \uAE30\uAC04\uC5D0 \uAC00\uC785\uD558\uC2E0 \uBD84\uB4E4\uAED8\uB294 \uD560\uC778 \uD61C\uD0DD\uC744 \uB4DC\uB9B4 \uACC4\uD68D\uC774\uC5D0\uC694!
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            \uC545\uD50C\uC5D0\uB3C4 \uC790\uB3D9\uC73C\uB85C \uB2F5\uD558\uB098\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              \uB313\uAE00 \uC720\uD615\uBCC4\uB85C \uC790\uB3D9\uC751\uB2F5 ON/OFF\uB97C \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.
              \uBD80\uC815 \uB313\uAE00\uC740 OFF\uB85C \uB450\uACE0 \uC9C1\uC811 \uB300\uC751\uD558\uC154\uB3C4 \uB429\uB2C8\uB2E4.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="container">
      <h2>\u{1F680} \uC9C0\uAE08 \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694</h2>
      <p>\uB313\uAE00 \uAD00\uB9AC\uC5D0 \uC4F0\uB358 \uC2DC\uAC04,<br>\uC774\uC81C \uB354 \uC88B\uC740 \uC601\uC0C1 \uB9CC\uB4DC\uB294 \uB370 \uC4F0\uC138\uC694.</p>
      <a href="/login" class="btn btn-primary btn-large">\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30</a>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <div class="footer-logo">\u{1F3AC} Autonomey</div>
      <div class="footer-links">
        <a href="#">\uC774\uC6A9\uC57D\uAD00</a>
        <a href="#">\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68</a>
        <a href="#">\uBB38\uC758\uD558\uAE30</a>
      </div>
      <div class="footer-copy">
        \xA9 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener" style="color: #555; font-size: 12px; text-decoration: none; transition: color 0.2s;">Made with \u2764\uFE0F by <span style="color: #ef4444;">AI\uC7A1\uB3CC\uC774</span></a>
      </div>
    </div>
  </footer>

  <script>
    // FAQ Toggle
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('open');
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  <\/script>
</body>
</html>`;
}

// src/index.ts
var app2 = new Hono2();
app2.use("*", logger());
app2.use("*", cors({
  origin: "*",
  credentials: true
}));
app2.get("/", async (c) => {
  const tokenCookie = c.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (tokenCookie) {
    const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET);
    if (payload) {
      const user2 = await getUserById(c.env.KV, payload.userId);
      if (user2) {
        return c.redirect("/channels");
      }
    }
  }
  return c.html(renderLanding());
});
app2.get("/login", (c) => {
  return c.html(renderLogin());
});
app2.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app2.route("/auth", auth_default);
app2.route("/api/schedule", schedule_default);
app2.get("/oauth/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  if (error) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C OAuth \uC624\uB958</h1>
          <p style="color: #f87171;">${error}</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);
  }
  if (!code) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uC624\uB958</h1>
          <p style="color: #f87171;">\uC778\uC99D \uCF54\uB4DC\uB97C \uBC1B\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);
  }
  if (!state) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uC624\uB958</h1>
          <p style="color: #f87171;">\uC778\uC99D \uC0C1\uD0DC(state)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);
  }
  const stateData = parseOAuthState(state);
  if (!stateData || !stateData.userId) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uC624\uB958</h1>
          <p style="color: #f87171;">\uC798\uBABB\uB41C \uC778\uC99D \uC0C1\uD0DC\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);
  }
  try {
    const baseUrl = new URL(c.req.url).origin;
    const redirectUri = `${baseUrl}/oauth/callback`;
    const channel = await exchangeCodeForTokens(c.env, code, redirectUri, stateData.userId);
    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>\uCC44\uB110 \uC5F0\uB3D9 \uC644\uB8CC - Autonomey</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0f0f0f;
              color: #fff;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .success-card {
              background: #1a1a1a;
              border: 1px solid #10b981;
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 420px;
            }
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 12px;
              color: #10b981;
            }
            .channel-name {
              font-size: 18px;
              color: #fff;
              margin-bottom: 8px;
            }
            .description {
              color: #888;
              font-size: 14px;
              margin-bottom: 24px;
              line-height: 1.5;
            }
            .next-steps {
              background: #052e16;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
              text-align: left;
            }
            .next-steps h3 {
              font-size: 14px;
              color: #10b981;
              margin-bottom: 12px;
            }
            .next-steps ul {
              list-style: none;
              font-size: 13px;
              color: #86efac;
            }
            .next-steps li {
              padding: 4px 0;
            }
            .next-steps li::before {
              content: "\u2713 ";
              color: #10b981;
            }
            .btn-primary {
              display: inline-block;
              background: #10b981;
              color: #fff;
              padding: 14px 28px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              transition: background 0.2s;
            }
            .btn-primary:hover {
              background: #059669;
            }
            .btn-secondary {
              display: inline-block;
              color: #888;
              padding: 10px 20px;
              text-decoration: none;
              font-size: 14px;
              margin-top: 12px;
            }
            .btn-secondary:hover {
              color: #fff;
            }
          </style>
        </head>
        <body>
          <div class="success-card">
            <div class="success-icon">\u{1F389}</div>
            <h1>\uCC44\uB110 \uC5F0\uB3D9 \uC644\uB8CC!</h1>
            <p class="channel-name">"${channel.youtube.channelTitle}"</p>
            <p class="description">YouTube \uCC44\uB110\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC5F0\uACB0\uB418\uC5C8\uC2B5\uB2C8\uB2E4.<br>\uC774\uC81C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>

            <div class="next-steps">
              <h3>\uB2E4\uC74C \uB2E8\uACC4</h3>
              <ul>
                <li>\uB313\uAE00 \uAC00\uC838\uC624\uAE30\uB85C \uCD5C\uC2E0 \uB313\uAE00 \uC218\uC9D1</li>
                <li>AI\uAC00 \uB313\uAE00\uC744 \uC790\uB3D9\uC73C\uB85C \uBD84\uB958</li>
                <li>\uC751\uB2F5\uC744 \uC0DD\uC131\uD558\uACE0 \uAC80\uD1A0 \uD6C4 \uC2B9\uC778</li>
              </ul>
            </div>

            <a href="/channels/${channel.id}" class="btn-primary">\uB300\uC2DC\uBCF4\uB4DC\uB85C \uC774\uB3D9 \u2192</a>
            <br>
            <a href="/channels" class="btn-secondary">\uCC44\uB110 \uBAA9\uB85D \uBCF4\uAE30</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uCC44\uB110 \uC5F0\uACB0 \uC2E4\uD328</h1>
          <p style="color: #f87171;">${err instanceof Error ? err.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}</p>
          <a href="/oauth/start" style="color: #3b82f6;">\uB2E4\uC2DC \uC2DC\uB3C4</a>
          <span style="margin: 0 10px; color: #666;">|</span>
          <a href="/channels" style="color: #888;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C</a>
        </body>
      </html>
    `);
  }
});
app2.get("/oauth/start", async (c) => {
  const tokenCookie = c.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!tokenCookie) {
    return c.redirect("/login?logout");
  }
  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET);
  if (!payload) {
    return c.redirect("/login?logout");
  }
  const user2 = await getUserById(c.env.KV, payload.userId);
  if (!user2) {
    return c.redirect("/login?logout");
  }
  const baseUrl = new URL(c.req.url).origin;
  const redirectUri = `${baseUrl}/oauth/callback`;
  const authUrl = getOAuthUrl(c.env, redirectUri, user2.id);
  return c.redirect(authUrl);
});
app2.get("/channels", async (c) => {
  const tokenCookie = c.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!tokenCookie) {
    return c.redirect("/login?logout");
  }
  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET);
  if (!payload) {
    return c.redirect("/login?logout");
  }
  const user2 = await getUserById(c.env.KV, payload.userId);
  if (!user2) {
    return c.redirect("/login?logout");
  }
  const channels2 = await getUserChannelsData(c.env.KV, user2.id);
  return c.html(renderChannelList(user2, channels2));
});
app2.get("/channels/:channelId", async (c) => {
  const tokenCookie = c.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!tokenCookie) {
    return c.redirect("/login?logout");
  }
  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET);
  if (!payload) {
    return c.redirect("/login?logout");
  }
  const user2 = await getUserById(c.env.KV, payload.userId);
  if (!user2) {
    return c.redirect("/login?logout");
  }
  const channelId = c.req.param("channelId");
  const userChannels = await getUserChannelsData(c.env.KV, user2.id);
  const currentChannel = userChannels.find((ch) => ch.id === channelId);
  if (!currentChannel) {
    return c.redirect("/channels");
  }
  return c.html(await renderDashboard(c.env, { currentChannel, userChannels, user: user2 }));
});
app2.get("/settings", async (c) => {
  const tokenCookie = c.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!tokenCookie) {
    return c.redirect("/login?logout");
  }
  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET);
  if (!payload) {
    return c.redirect("/login?logout");
  }
  const user2 = await getUserById(c.env.KV, payload.userId);
  if (!user2) {
    return c.redirect("/login?logout");
  }
  const userChannels = await getUserChannelsData(c.env.KV, user2.id);
  return c.html(renderSettings({ user: user2, userChannels }));
});
app2.use("/api/*", async (c, next) => {
  if (c.req.path.startsWith("/api/schedule")) {
    return next();
  }
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    if (payload) {
      const user2 = await getUserById(c.env.KV, payload.userId);
      if (user2) {
        c.set("jwtPayload", payload);
        c.set("user", user2);
        return next();
      }
    }
    return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD1A0\uD070\uC785\uB2C8\uB2E4." }, 401);
  }
  const tokenCookie = c.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (tokenCookie) {
    const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET);
    if (payload) {
      const user2 = await getUserById(c.env.KV, payload.userId);
      if (user2) {
        c.set("jwtPayload", payload);
        c.set("user", user2);
        return next();
      }
    }
  }
  return c.json({ success: false, error: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
});
app2.route("/api", api_default);
app2.route("/api/user", user_default);
app2.route("/api/channels", channels_default);
app2.notFound((c) => {
  return c.json({
    success: false,
    error: "Not found",
    path: c.req.path
  }, 404);
});
app2.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error("Error:", err);
  return c.json({
    success: false,
    error: err.message || "Internal server error"
  }, 500);
});
var src_default = {
  fetch: app2.fetch
};
export {
  src_default as default
};
