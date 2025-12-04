var Pn=Object.defineProperty;var $n=(e,t)=>()=>(e&&(t=e(e=0)),t);var On=(e,t)=>{for(var n in t)Pn(e,n,{get:t[n],enumerable:!0})};var tn={};On(tn,{exchangeCodeForChannel:()=>Qe,fetchChannelComments:()=>te,postReplyWithChannel:()=>Xe,refreshChannelToken:()=>Ge});async function Ge(e,t){let n=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:e.YOUTUBE_CLIENT_ID,client_secret:e.YOUTUBE_CLIENT_SECRET,refresh_token:t,grant_type:"refresh_token"})});if(!n.ok){let s=await n.text();throw new Error(`Failed to refresh token: ${s}`)}let o=await n.json();return{accessToken:o.access_token,expiresAt:new Date(Date.now()+o.expires_in*1e3).toISOString()}}async function Qe(e,t,n){let o=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:e.YOUTUBE_CLIENT_ID,client_secret:e.YOUTUBE_CLIENT_SECRET,code:t,grant_type:"authorization_code",redirect_uri:n})});if(!o.ok){let i=await o.text();throw new Error(`Failed to exchange code: ${i}`)}let s=await o.json(),r=await fetch(`${V}/channels?part=snippet&mine=true`,{headers:{Authorization:`Bearer ${s.access_token}`}});if(!r.ok)throw new Error("Failed to get channel info");let c=(await r.json()).items?.[0];if(!c)throw new Error("No channel found for this account");return{accessToken:s.access_token,refreshToken:s.refresh_token,expiresAt:new Date(Date.now()+s.expires_in*1e3).toISOString(),channelId:c.id,channelTitle:c.snippet.title}}async function uo(e,t){let n=[],o=await fetch(`${V}/channels?part=contentDetails&id=${t.youtube.channelId}&key=${e.YOUTUBE_API_KEY}`);if(!o.ok)throw new Error(`Failed to get channel: ${o.statusText}`);let r=(await o.json()).items?.[0]?.contentDetails?.relatedPlaylists?.uploads;if(!r)throw new Error("Could not find uploads playlist");let a=await fetch(`${V}/playlistItems?part=contentDetails&playlistId=${r}&maxResults=50&key=${e.YOUTUBE_API_KEY}`);if(!a.ok)throw new Error(`Failed to get playlist items: ${a.statusText}`);let c=await a.json();for(let i of c.items||[])n.push(i.contentDetails.videoId);return n}async function mo(e,t){let n=await fetch(`${V}/videos?part=snippet&id=${t}&key=${e.YOUTUBE_API_KEY}`);if(!n.ok)throw new Error(`Failed to get video info: ${n.statusText}`);return{title:(await n.json()).items?.[0]?.snippet?.title||"Unknown"}}async function go(e,t){let n=await fetch(`${V}/commentThreads?part=snippet,replies&videoId=${t}&maxResults=100&order=time&key=${e.YOUTUBE_API_KEY}`);if(!n.ok){if(n.status===403)return console.log(`Comments disabled for video ${t}`),[];throw new Error(`Failed to get comments: ${n.statusText}`)}return(await n.json()).items||[]}function fo(e,t){if(e.replies?.comments){let n=e.replies.comments.find(o=>o.snippet.authorChannelId.value===t);if(n)return{hasReply:!0,replyText:n.snippet.textDisplay}}return{hasReply:!1}}async function te(e,t){let n=[],o=await uo(e,t);for(let s of o){let r=await mo(e,s),a=await go(e,s);for(let c of a){let i=c.snippet.topLevelComment.snippet,l=c.snippet.topLevelComment.id;if(i.authorChannelId.value===t.youtube.channelId)continue;let{hasReply:d,replyText:p}=fo(c,t.youtube.channelId);n.push({id:l,videoId:s,videoTitle:r.title,authorName:i.authorDisplayName,authorChannelId:i.authorChannelId.value,text:i.textDisplay,publishedAt:i.publishedAt,status:d?"replied":"unclassified",replyText:d?p:void 0})}}return n}async function Xe(e,t,n,o){let s=await fetch(`${V}/comments?part=snippet`,{method:"POST",headers:{Authorization:`Bearer ${t.youtube.accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({snippet:{parentId:n,textOriginal:o}})});if(!s.ok){let r=await s.text();throw new Error(`Failed to post reply: ${s.statusText} - ${r}`)}}var V,we=$n(()=>{"use strict";V="https://www.googleapis.com/youtube/v3"});var Ee=(e,t,n)=>(o,s)=>{let r=-1;return a(0);async function a(c){if(c<=r)throw new Error("next() called multiple times");r=c;let i,l=!1,d;if(e[c]?(d=e[c][0][0],o.req.routeIndex=c):d=c===e.length&&s||void 0,d)try{i=await d(o,()=>a(c+1))}catch(p){if(p instanceof Error&&t)o.error=p,i=await t(p,o),l=!0;else throw p}else o.finalized===!1&&n&&(i=await n(o));return i&&(o.finalized===!1||l)&&(o.res=i),o}};var Se=class extends Error{res;status;constructor(e=500,t){super(t?.message,{cause:t?.cause}),this.res=t?.res,this.status=e}getResponse(){return this.res?new Response(this.res.body,{status:this.status,headers:this.res.headers}):new Response(this.message,{status:this.status})}};var it=Symbol();var ct=async(e,t=Object.create(null))=>{let{all:n=!1,dot:o=!1}=t,r=(e instanceof oe?e.raw.headers:e.headers).get("Content-Type");return r?.startsWith("multipart/form-data")||r?.startsWith("application/x-www-form-urlencoded")?jn(e,{all:n,dot:o}):{}};async function jn(e,t){let n=await e.formData();return n?_n(n,t):{}}function _n(e,t){let n=Object.create(null);return e.forEach((o,s)=>{t.all||s.endsWith("[]")?Kn(n,s,o):n[s]=o}),t.dot&&Object.entries(n).forEach(([o,s])=>{o.includes(".")&&(Dn(n,o,s),delete n[o])}),n}var Kn=(e,t,n)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]:t.endsWith("[]")?e[t]=[n]:e[t]=n},Dn=(e,t,n)=>{let o=e,s=t.split(".");s.forEach((r,a)=>{a===s.length-1?o[r]=n:((!o[r]||typeof o[r]!="object"||Array.isArray(o[r])||o[r]instanceof File)&&(o[r]=Object.create(null)),o=o[r])})};var Pe=e=>{let t=e.split("/");return t[0]===""&&t.shift(),t},lt=e=>{let{groups:t,path:n}=Ln(e),o=Pe(n);return Un(o,t)},Ln=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(n,o)=>{let s=`@${o}`;return t.push([s,n]),s}),{groups:t,path:e}},Un=(e,t)=>{for(let n=t.length-1;n>=0;n--){let[o]=t[n];for(let s=e.length-1;s>=0;s--)if(e[s].includes(o)){e[s]=e[s].replace(o,t[n][1]);break}}return e},se={},dt=(e,t)=>{if(e==="*")return"*";let n=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(n){let o=`${e}#${t}`;return se[o]||(n[2]?se[o]=t&&t[0]!==":"&&t[0]!=="*"?[o,n[1],new RegExp(`^${n[2]}(?=/${t})`)]:[e,n[1],new RegExp(`^${n[2]}$`)]:se[o]=[e,n[1],!0]),se[o]}return null},re=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,n=>{try{return t(n)}catch{return n}})}},Nn=e=>re(e,decodeURI),$e=e=>{let t=e.url,n=t.indexOf("/",t.indexOf(":")+4),o=n;for(;o<t.length;o++){let s=t.charCodeAt(o);if(s===37){let r=t.indexOf("?",o),a=t.slice(n,r===-1?void 0:r);return Nn(a.includes("%25")?a.replace(/%25/g,"%2525"):a)}else if(s===63)break}return t.slice(n,o)};var pt=e=>{let t=$e(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},O=(e,t,...n)=>(n.length&&(t=O(t,...n)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),ae=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;let t=e.split("/"),n=[],o="";return t.forEach(s=>{if(s!==""&&!/\:/.test(s))o+="/"+s;else if(/\:/.test(s))if(/\?/.test(s)){n.length===0&&o===""?n.push("/"):n.push(o);let r=s.replace("?","");o+="/"+r,n.push(o)}else o+="/"+s}),n.filter((s,r,a)=>a.indexOf(s)===r)},Re=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?re(e,Oe):e):e,ut=(e,t,n)=>{let o;if(!n&&t&&!/[%+]/.test(t)){let a=e.indexOf("?",8);if(a===-1)return;for(e.startsWith(t,a+1)||(a=e.indexOf(`&${t}`,a+1));a!==-1;){let c=e.charCodeAt(a+t.length+1);if(c===61){let i=a+t.length+2,l=e.indexOf("&",i);return Re(e.slice(i,l===-1?void 0:l))}else if(c==38||isNaN(c))return"";a=e.indexOf(`&${t}`,a+1)}if(o=/[%+]/.test(e),!o)return}let s={};o??=/[%+]/.test(e);let r=e.indexOf("?",8);for(;r!==-1;){let a=e.indexOf("&",r+1),c=e.indexOf("=",r);c>a&&a!==-1&&(c=-1);let i=e.slice(r+1,c===-1?a===-1?void 0:a:c);if(o&&(i=Re(i)),r=a,i==="")continue;let l;c===-1?l="":(l=e.slice(c+1,a===-1?void 0:a),o&&(l=Re(l))),n?(s[i]&&Array.isArray(s[i])||(s[i]=[]),s[i].push(l)):s[i]??=l}return t?s[t]:s},mt=ut,gt=(e,t)=>ut(e,t,!0),Oe=decodeURIComponent;var ft=e=>re(e,Oe),oe=class{raw;#t;#e;routeIndex=0;path;bodyCache={};constructor(e,t="/",n=[[]]){this.raw=e,this.path=t,this.#e=n,this.#t={}}param(e){return e?this.#n(e):this.#r()}#n(e){let t=this.#e[0][this.routeIndex][1][e],n=this.#s(t);return n&&/\%/.test(n)?ft(n):n}#r(){let e={},t=Object.keys(this.#e[0][this.routeIndex][1]);for(let n of t){let o=this.#s(this.#e[0][this.routeIndex][1][n]);o!==void 0&&(e[n]=/\%/.test(o)?ft(o):o)}return e}#s(e){return this.#e[1]?this.#e[1][e]:e}query(e){return mt(this.url,e)}queries(e){return gt(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((n,o)=>{t[o]=n}),t}async parseBody(e){return this.bodyCache.parsedBody??=await ct(this,e)}#o=e=>{let{bodyCache:t,raw:n}=this,o=t[e];if(o)return o;let s=Object.keys(t)[0];return s?t[s].then(r=>(s==="json"&&(r=JSON.stringify(r)),new Response(r)[e]())):t[e]=n[e]()};json(){return this.#o("text").then(e=>JSON.parse(e))}text(){return this.#o("text")}arrayBuffer(){return this.#o("arrayBuffer")}blob(){return this.#o("blob")}formData(){return this.#o("formData")}addValidatedData(e,t){this.#t[e]=t}valid(e){return this.#t[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[it](){return this.#e}get matchedRoutes(){return this.#e[0].map(([[,e]])=>e)}get routePath(){return this.#e[0].map(([[,e]])=>e)[this.routeIndex].path}};var ht={Stringify:1,BeforeStream:2,Stream:3},zn=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n};var je=async(e,t,n,o,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let r=e.callbacks;if(!r?.length)return Promise.resolve(e);s?s[0]+=e:s=[e];let a=Promise.all(r.map(c=>c({phase:t,buffer:s,context:o}))).then(c=>Promise.all(c.filter(Boolean).map(i=>je(i,t,!1,o,s))).then(()=>s[0]));return n?zn(await a,r):a};var Bn="text/plain; charset=UTF-8",_e=(e,t)=>({"Content-Type":e,...t}),bt=class{#t;#e;env={};#n;finalized=!1;error;#r;#s;#o;#d;#c;#l;#i;#p;#u;constructor(e,t){this.#t=e,t&&(this.#s=t.executionCtx,this.env=t.env,this.#l=t.notFoundHandler,this.#u=t.path,this.#p=t.matchResult)}get req(){return this.#e??=new oe(this.#t,this.#u,this.#p),this.#e}get event(){if(this.#s&&"respondWith"in this.#s)return this.#s;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#s)return this.#s;throw Error("This context has no ExecutionContext")}get res(){return this.#o||=new Response(null,{headers:this.#i??=new Headers})}set res(e){if(this.#o&&e){e=new Response(e.body,e);for(let[t,n]of this.#o.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let o=this.#o.headers.getSetCookie();e.headers.delete("set-cookie");for(let s of o)e.headers.append("set-cookie",s)}else e.headers.set(t,n)}this.#o=e,this.finalized=!0}render=(...e)=>(this.#c??=t=>this.html(t),this.#c(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#c=e};header=(e,t,n)=>{this.finalized&&(this.#o=new Response(this.#o.body,this.#o));let o=this.#o?this.#o.headers:this.#i??=new Headers;t===void 0?o.delete(e):n?.append?o.append(e,t):o.set(e,t)};status=e=>{this.#r=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#a(e,t,n){let o=this.#o?new Headers(this.#o.headers):this.#i??new Headers;if(typeof t=="object"&&"headers"in t){let r=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[a,c]of r)a.toLowerCase()==="set-cookie"?o.append(a,c):o.set(a,c)}if(n)for(let[r,a]of Object.entries(n))if(typeof a=="string")o.set(r,a);else{o.delete(r);for(let c of a)o.append(r,c)}let s=typeof t=="number"?t:t?.status??this.#r;return new Response(e,{status:s,headers:o})}newResponse=(...e)=>this.#a(...e);body=(e,t,n)=>this.#a(e,t,n);text=(e,t,n)=>!this.#i&&!this.#r&&!t&&!n&&!this.finalized?new Response(e):this.#a(e,t,_e(Bn,n));json=(e,t,n)=>this.#a(JSON.stringify(e),t,_e("application/json",n));html=(e,t,n)=>{let o=s=>this.#a(s,t,_e("text/html; charset=UTF-8",n));return typeof e=="object"?je(e,ht.Stringify,!1,{}).then(o):o(e)};redirect=(e,t)=>{let n=String(e);return this.header("Location",/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#l??=()=>new Response,this.#l(this))};var f="ALL",yt="all",xt=["get","post","put","delete","options","patch"],ie="Can not add a route since the matcher is already built.",ce=class extends Error{};var vt="__COMPOSED_HANDLER";var Fn=e=>e.text("404 Not Found",404),wt=(e,t)=>{if("getResponse"in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text("Internal Server Error",500)},Ke=class{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(e={}){[...xt,yt].forEach(s=>{this[s]=(r,...a)=>(typeof r=="string"?this.#t=r:this.#r(s,this.#t,r),a.forEach(c=>{this.#r(s,this.#t,c)}),this)}),this.on=(s,r,...a)=>{for(let c of[r].flat()){this.#t=c;for(let i of[s].flat())a.map(l=>{this.#r(i.toUpperCase(),this.#t,l)})}return this},this.use=(s,...r)=>(typeof s=="string"?this.#t=s:(this.#t="*",r.unshift(s)),r.forEach(a=>{this.#r(f,this.#t,a)}),this);let{strict:n,...o}=e;Object.assign(this,o),this.getPath=n??!0?e.getPath??$e:pt}#e(){let e=new Ke({router:this.router,getPath:this.getPath});return e.errorHandler=this.errorHandler,e.#n=this.#n,e.routes=this.routes,e}#n=Fn;errorHandler=wt;route(e,t){let n=this.basePath(e);return t.routes.map(o=>{let s;t.errorHandler===wt?s=o.handler:(s=async(r,a)=>(await Ee([],t.errorHandler)(r,()=>o.handler(r,a))).res,s[vt]=o.handler),n.#r(o.method,o.path,s)}),this}basePath(e){let t=this.#e();return t._basePath=O(this._basePath,e),t}onError=e=>(this.errorHandler=e,this);notFound=e=>(this.#n=e,this);mount(e,t,n){let o,s;n&&(typeof n=="function"?s=n:(s=n.optionHandler,n.replaceRequest===!1?o=c=>c:o=n.replaceRequest));let r=s?c=>{let i=s(c);return Array.isArray(i)?i:[i]}:c=>{let i;try{i=c.executionCtx}catch{}return[c.env,i]};o||=(()=>{let c=O(this._basePath,e),i=c==="/"?0:c.length;return l=>{let d=new URL(l.url);return d.pathname=d.pathname.slice(i)||"/",new Request(d,l)}})();let a=async(c,i)=>{let l=await t(o(c.req.raw),...r(c));if(l)return l;await i()};return this.#r(f,O(e,"*"),a),this}#r(e,t,n){e=e.toUpperCase(),t=O(this._basePath,t);let o={basePath:this._basePath,path:t,method:e,handler:n};this.router.add(e,t,[n,o]),this.routes.push(o)}#s(e,t){if(e instanceof Error)return this.errorHandler(e,t);throw e}#o(e,t,n,o){if(o==="HEAD")return(async()=>new Response(null,await this.#o(e,t,n,"GET")))();let s=this.getPath(e,{env:n}),r=this.router.match(o,s),a=new bt(e,{path:s,matchResult:r,env:n,executionCtx:t,notFoundHandler:this.#n});if(r[0].length===1){let i;try{i=r[0][0][0][0](a,async()=>{a.res=await this.#n(a)})}catch(l){return this.#s(l,a)}return i instanceof Promise?i.then(l=>l||(a.finalized?a.res:this.#n(a))).catch(l=>this.#s(l,a)):i??this.#n(a)}let c=Ee(r[0],this.errorHandler,this.#n);return(async()=>{try{let i=await c(a);if(!i.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return i.res}catch(i){return this.#s(i,a)}})()}fetch=(e,...t)=>this.#o(e,t[1],t[0],e.method);request=(e,t,n,o)=>e instanceof Request?this.fetch(t?new Request(e,t):e,n,o):(e=e.toString(),this.fetch(new Request(/^https?:\/\//.test(e)?e:`http://localhost${O("/",e)}`,t),n,o));fire=()=>{addEventListener("fetch",e=>{e.respondWith(this.#o(e.request,e,void 0,e.request.method))})}};var le=[];function De(e,t){let n=this.buildAllMatchers(),o=(s,r)=>{let a=n[s]||n[f],c=a[2][r];if(c)return c;let i=r.match(a[0]);if(!i)return[[],le];let l=i.indexOf("",1);return[a[1][l],i]};return this.match=o,o(e,t)}var de="[^/]+",W=".*",G="(?:|/.*)",j=Symbol(),Vn=new Set(".\\+*[^]$()");function Mn(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===W||e===G?1:t===W||t===G?-1:e===de?1:t===de?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var pe=class{#t;#e;#n=Object.create(null);insert(e,t,n,o,s){if(e.length===0){if(this.#t!==void 0)throw j;if(s)return;this.#t=t;return}let[r,...a]=e,c=r==="*"?a.length===0?["","",W]:["","",de]:r==="/*"?["","",G]:r.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),i;if(c){let l=c[1],d=c[2]||de;if(l&&c[2]&&(d===".*"||(d=d.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(d))))throw j;if(i=this.#n[d],!i){if(Object.keys(this.#n).some(p=>p!==W&&p!==G))throw j;if(s)return;i=this.#n[d]=new pe,l!==""&&(i.#e=o.varIndex++)}!s&&l!==""&&n.push([l,i.#e])}else if(i=this.#n[r],!i){if(Object.keys(this.#n).some(l=>l.length>1&&l!==W&&l!==G))throw j;if(s)return;i=this.#n[r]=new pe}i.insert(a,t,n,o,s)}buildRegExpStr(){let t=Object.keys(this.#n).sort(Mn).map(n=>{let o=this.#n[n];return(typeof o.#e=="number"?`(${n})@${o.#e}`:Vn.has(n)?`\\${n}`:n)+o.buildRegExpStr()});return typeof this.#t=="number"&&t.unshift(`#${this.#t}`),t.length===0?"":t.length===1?t[0]:"(?:"+t.join("|")+")"}};var At=class{#t={varIndex:0};#e=new pe;insert(e,t,n){let o=[],s=[];for(let a=0;;){let c=!1;if(e=e.replace(/\{[^}]+\}/g,i=>{let l=`@\\${a}`;return s[a]=[l,i],a++,c=!0,l}),!c)break}let r=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let a=s.length-1;a>=0;a--){let[c]=s[a];for(let i=r.length-1;i>=0;i--)if(r[i].indexOf(c)!==-1){r[i]=r[i].replace(c,s[a][1]);break}}return this.#e.insert(r,t,o,this.#t,n),o}buildRegExp(){let e=this.#e.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0,n=[],o=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,r,a)=>r!==void 0?(n[++t]=Number(r),"$()"):(a!==void 0&&(o[Number(a)]=++t),"")),[new RegExp(`^${e}`),n,o]}};var qn=[/^$/,[],Object.create(null)],kt=Object.create(null);function Tt(e){return kt[e]??=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,n)=>n?`\\${n}`:"(?:|/.*)")}$`)}function Hn(){kt=Object.create(null)}function Yn(e){let t=new At,n=[];if(e.length===0)return qn;let o=e.map(l=>[!/\*|\/:/.test(l[0]),...l]).sort(([l,d],[p,m])=>l?1:p?-1:d.length-m.length),s=Object.create(null);for(let l=0,d=-1,p=o.length;l<p;l++){let[m,g,u]=o[l];m?s[g]=[u.map(([x])=>[x,Object.create(null)]),le]:d++;let y;try{y=t.insert(g,d,m)}catch(x){throw x===j?new ce(g):x}m||(n[d]=u.map(([x,U])=>{let Y=Object.create(null);for(U-=1;U>=0;U--){let[E,Ce]=y[U];Y[E]=Ce}return[x,Y]}))}let[r,a,c]=t.buildRegExp();for(let l=0,d=n.length;l<d;l++)for(let p=0,m=n[l].length;p<m;p++){let g=n[l][p]?.[1];if(!g)continue;let u=Object.keys(g);for(let y=0,x=u.length;y<x;y++)g[u[y]]=c[g[u[y]]]}let i=[];for(let l in a)i[l]=n[a[l]];return[r,i,s]}function N(e,t){if(e){for(let n of Object.keys(e).sort((o,s)=>s.length-o.length))if(Tt(n).test(t))return[...e[n]]}}var ue=class{name="RegExpRouter";#t;#e;constructor(){this.#t={[f]:Object.create(null)},this.#e={[f]:Object.create(null)}}add(e,t,n){let o=this.#t,s=this.#e;if(!o||!s)throw new Error(ie);o[e]||[o,s].forEach(c=>{c[e]=Object.create(null),Object.keys(c[f]).forEach(i=>{c[e][i]=[...c[f][i]]})}),t==="/*"&&(t="*");let r=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let c=Tt(t);e===f?Object.keys(o).forEach(i=>{o[i][t]||=N(o[i],t)||N(o[f],t)||[]}):o[e][t]||=N(o[e],t)||N(o[f],t)||[],Object.keys(o).forEach(i=>{(e===f||e===i)&&Object.keys(o[i]).forEach(l=>{c.test(l)&&o[i][l].push([n,r])})}),Object.keys(s).forEach(i=>{(e===f||e===i)&&Object.keys(s[i]).forEach(l=>c.test(l)&&s[i][l].push([n,r]))});return}let a=ae(t)||[t];for(let c=0,i=a.length;c<i;c++){let l=a[c];Object.keys(s).forEach(d=>{(e===f||e===d)&&(s[d][l]||=[...N(o[d],l)||N(o[f],l)||[]],s[d][l].push([n,r-i+c+1]))})}}match=De;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach(t=>{e[t]||=this.#n(t)}),this.#t=this.#e=void 0,Hn(),e}#n(e){let t=[],n=e===f;return[this.#t,this.#e].forEach(o=>{let s=o[e]?Object.keys(o[e]).map(r=>[r,o[e][r]]):[];s.length!==0?(n||=!0,t.push(...s)):e!==f&&t.push(...Object.keys(o[f]).map(r=>[r,o[f][r]]))}),n?Yn(t):null}};var Le=class{name="SmartRouter";#t=[];#e=[];constructor(e){this.#t=e.routers}add(e,t,n){if(!this.#e)throw new Error(ie);this.#e.push([e,t,n])}match(e,t){if(!this.#e)throw new Error("Fatal error");let n=this.#t,o=this.#e,s=n.length,r=0,a;for(;r<s;r++){let c=n[r];try{for(let i=0,l=o.length;i<l;i++)c.add(...o[i]);a=c.match(e,t)}catch(i){if(i instanceof ce)continue;throw i}this.match=c.match.bind(c),this.#t=[c],this.#e=void 0;break}if(r===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,a}get activeRouter(){if(this.#e||this.#t.length!==1)throw new Error("No active router has been determined yet.");return this.#t[0]}};var Q=Object.create(null),Ue=class{#t;#e;#n;#r=0;#s=Q;constructor(e,t,n){if(this.#e=n||Object.create(null),this.#t=[],e&&t){let o=Object.create(null);o[e]={handler:t,possibleKeys:[],score:0},this.#t=[o]}this.#n=[]}insert(e,t,n){this.#r=++this.#r;let o=this,s=lt(t),r=[];for(let a=0,c=s.length;a<c;a++){let i=s[a],l=s[a+1],d=dt(i,l),p=Array.isArray(d)?d[0]:i;if(p in o.#e){o=o.#e[p],d&&r.push(d[1]);continue}o.#e[p]=new Ue,d&&(o.#n.push(d),r.push(d[1])),o=o.#e[p]}return o.#t.push({[e]:{handler:n,possibleKeys:r.filter((a,c,i)=>i.indexOf(a)===c),score:this.#r}}),o}#o(e,t,n,o){let s=[];for(let r=0,a=e.#t.length;r<a;r++){let c=e.#t[r],i=c[t]||c[f],l={};if(i!==void 0&&(i.params=Object.create(null),s.push(i),n!==Q||o&&o!==Q))for(let d=0,p=i.possibleKeys.length;d<p;d++){let m=i.possibleKeys[d],g=l[i.score];i.params[m]=o?.[m]&&!g?o[m]:n[m]??o?.[m],l[i.score]=!0}}return s}search(e,t){let n=[];this.#s=Q;let s=[this],r=Pe(t),a=[];for(let c=0,i=r.length;c<i;c++){let l=r[c],d=c===i-1,p=[];for(let m=0,g=s.length;m<g;m++){let u=s[m],y=u.#e[l];y&&(y.#s=u.#s,d?(y.#e["*"]&&n.push(...this.#o(y.#e["*"],e,u.#s)),n.push(...this.#o(y,e,u.#s))):p.push(y));for(let x=0,U=u.#n.length;x<U;x++){let Y=u.#n[x],E=u.#s===Q?{}:{...u.#s};if(Y==="*"){let R=u.#e["*"];R&&(n.push(...this.#o(R,e,u.#s)),R.#s=E,p.push(R));continue}let[Ce,at,J]=Y;if(!l&&!(J instanceof RegExp))continue;let S=u.#e[Ce],Sn=r.slice(c).join("/");if(J instanceof RegExp){let R=J.exec(Sn);if(R){if(E[at]=R[0],n.push(...this.#o(S,e,u.#s,E)),Object.keys(S.#e).length){S.#s=E;let Rn=R[0].match(/\//)?.length??0;(a[Rn]||=[]).push(S)}continue}}(J===!0||J.test(l))&&(E[at]=l,d?(n.push(...this.#o(S,e,E,u.#s)),S.#e["*"]&&n.push(...this.#o(S.#e["*"],e,E,u.#s))):(S.#s=E,p.push(S)))}}s=p.concat(a.shift()??[])}return n.length>1&&n.sort((c,i)=>c.score-i.score),[n.map(({handler:c,params:i})=>[c,i])]}};var Ne=class{name="TrieRouter";#t;constructor(){this.#t=new Ue}add(e,t,n){let o=ae(t);if(o){for(let s=0,r=o.length;s<r;s++)this.#t.insert(e,o[s],n);return}this.#t.insert(e,t,n)}match(e,t){return this.#t.search(e,t)}};var k=class extends Ke{constructor(e={}){super(e),this.router=e.router??new Le({routers:[new ue,new Ne]})}};var It=e=>{let n={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},o=(r=>typeof r=="string"?r==="*"?()=>r:a=>r===a?a:null:typeof r=="function"?r:a=>r.includes(a)?a:null)(n.origin),s=(r=>typeof r=="function"?r:Array.isArray(r)?()=>r:()=>[])(n.allowMethods);return async function(a,c){function i(d,p){a.res.headers.set(d,p)}let l=await o(a.req.header("origin")||"",a);if(l&&i("Access-Control-Allow-Origin",l),n.credentials&&i("Access-Control-Allow-Credentials","true"),n.exposeHeaders?.length&&i("Access-Control-Expose-Headers",n.exposeHeaders.join(",")),a.req.method==="OPTIONS"){n.origin!=="*"&&i("Vary","Origin"),n.maxAge!=null&&i("Access-Control-Max-Age",n.maxAge.toString());let d=await s(a.req.header("origin")||"",a);d.length&&i("Access-Control-Allow-Methods",d.join(","));let p=n.allowHeaders;if(!p?.length){let m=a.req.header("Access-Control-Request-Headers");m&&(p=m.split(/\s*,\s*/))}return p?.length&&(i("Access-Control-Allow-Headers",p.join(",")),a.res.headers.append("Vary","Access-Control-Request-Headers")),a.res.headers.delete("Content-Length"),a.res.headers.delete("Content-Type"),new Response(null,{headers:a.res.headers,status:204,statusText:"No Content"})}await c(),n.origin!=="*"&&a.header("Vary","Origin",{append:!0})}};function Jn(){let{process:e,Deno:t}=globalThis;return!(typeof t?.noColor=="boolean"?t.noColor:e!==void 0?"NO_COLOR"in e?.env:!1)}async function Ct(){let{navigator:e}=globalThis,t="cloudflare:workers";return!(e!==void 0&&e.userAgent==="Cloudflare-Workers"?await(async()=>{try{return"NO_COLOR"in((await import(t)).env??{})}catch{return!1}})():!Jn())}var Wn=e=>{let[t,n]=[",","."];return e.map(s=>s.replace(/(\d)(?=(\d\d\d)+(?!\d))/g,"$1"+t)).join(n)},Gn=e=>{let t=Date.now()-e;return Wn([t<1e3?t+"ms":Math.round(t/1e3)+"s"])},Qn=async e=>{if(await Ct())switch(e/100|0){case 5:return`\x1B[31m${e}\x1B[0m`;case 4:return`\x1B[33m${e}\x1B[0m`;case 3:return`\x1B[36m${e}\x1B[0m`;case 2:return`\x1B[32m${e}\x1B[0m`}return`${e}`};async function Et(e,t,n,o,s=0,r){let a=t==="<--"?`${t} ${n} ${o}`:`${t} ${n} ${o} ${await Qn(s)} ${r}`;e(a)}var St=(e=console.log)=>async function(n,o){let{method:s,url:r}=n.req,a=r.slice(r.indexOf("/",8));await Et(e,"<--",s,a);let c=Date.now();await o(),await Et(e,"-->",s,a,n.res.status,Gn(c))};var me={fetchInterval:"hourly",autoApprove:!0,approveTimes:["09:00","14:00","21:00"],timezone:"Asia/Seoul"},z={persona:"AI \uC7A1\uB3CC\uC774",tone:"\uCE5C\uADFC\uD558\uACE0 \uACB8\uC190\uD55C",customInstructions:"",attitudeMap:{positive:"gratitude",negative:"graceful",question:"expert",suggestion:"empathy",reaction:"humor",other:"friendly"},commonInstructions:`- 200\uC790 \uC774\uB0B4\uB85C \uC9E7\uAC8C
- \uC774\uBAA8\uC9C0 1-2\uAC1C\uB9CC
- "\uC548\uB155\uD558\uC138\uC694" \uAC19\uC740 \uD615\uC2DD\uC801 \uC778\uC0AC \uAE08\uC9C0
- \uC808\uB300 \uBC29\uC5B4\uC801\uC774\uC9C0 \uC54A\uAC8C
- \uC2DC\uCCAD\uC790 \uC774\uB984 \uC5B8\uAE09\uD558\uC9C0 \uC54A\uAE30`,typeInstructions:{positive:{enabled:!0,instruction:"\uC9C4\uC2EC\uC5B4\uB9B0 \uAC10\uC0AC\uB97C \uD45C\uD604\uD558\uC138\uC694. \uC751\uC6D0\uC774 \uD070 \uD798\uC774 \uB41C\uB2E4\uB294 \uAC83\uC744 \uC804\uB2EC\uD558\uC138\uC694."},negative:{enabled:!0,instruction:"\uD488\uC704\uC788\uAC8C \uB300\uC751\uD558\uC138\uC694. \uBE44\uD310\uC5D0\uC11C \uBC30\uC6B8 \uC810\uC774 \uC788\uB2E4\uBA74 \uC778\uC815\uD558\uACE0, \uC545\uD50C\uC740 \uC9E7\uAC8C \uB9C8\uBB34\uB9AC\uD558\uC138\uC694."},question:{enabled:!0,instruction:"\uCE5C\uC808\uD558\uACE0 \uC804\uBB38\uC801\uC73C\uB85C \uB2F5\uBCC0\uD558\uC138\uC694. \uBAA8\uB974\uB294 \uAC74 \uC194\uC9C1\uD788 \uBAA8\uB978\uB2E4\uACE0 \uD558\uACE0, \uC54C\uC544\uBCF4\uACA0\uB2E4\uACE0 \uD558\uC138\uC694."},suggestion:{enabled:!0,instruction:"\uC81C\uC548\uC5D0 \uAC10\uC0AC\uD558\uACE0 \uACF5\uAC10\uD558\uC138\uC694. \uC88B\uC740 \uC544\uC774\uB514\uC5B4\uB294 \uBC18\uC601\uD558\uACA0\uB2E4\uACE0 \uD558\uC138\uC694."},reaction:{enabled:!0,instruction:"\uAC00\uBCCD\uACE0 \uC720\uBA38\uB7EC\uC2A4\uD558\uAC8C \uBC18\uC751\uD558\uC138\uC694. \uC9E7\uC9C0\uB9CC \uB530\uB73B\uD558\uAC8C!"},other:{enabled:!1,instruction:"\uCE5C\uADFC\uD558\uAC8C \uC751\uB300\uD558\uC138\uC694."}}};var Be="comment:",Rt="comments:index",Pt="settings",ze="config",Fe="user:",$t="users:index",Ve="user:email:",X="channel:",Ot="channels:index",jt="user:channels:",Me=(e,t)=>`${X}${e}:comment:${t}`,_t=e=>`${X}${e}:comments:index`;async function Kt(e,t){await e.put(`${Be}${t.id}`,JSON.stringify(t));let n=await qe(e);n.includes(t.id)||(n.unshift(t.id),await e.put(Rt,JSON.stringify(n)))}async function ge(e,t){let n=await e.get(`${Be}${t}`);return n?JSON.parse(n):null}async function _(e,t,n){let o=await ge(e,t);o&&await e.put(`${Be}${t}`,JSON.stringify({...o,...n}))}async function qe(e){let t=await e.get(Rt);return t?JSON.parse(t):[]}async function K(e,t={}){let{page:n=1,limit:o=20,status:s="all"}=t,r=await qe(e),a=[];for(let p of r){let m=await ge(e,p);m&&(s==="all"||m.status===s)&&a.push(m)}let c=a.length,i=Math.ceil(c/o),l=(n-1)*o;return{comments:a.slice(l,l+o),total:c,page:n,totalPages:i}}async function Dt(e){return(await K(e,{status:"pending",limit:1e3})).comments}async function Lt(e){return(await K(e,{status:"unclassified",limit:1e3})).comments}async function Ut(e){return(await K(e,{status:"generated",limit:1e3})).comments}async function Nt(e,t){return await ge(e,t)!==null}async function Z(e){let t=await e.get(Pt);return t?JSON.parse(t):z}async function zt(e,t){await e.put(Pt,JSON.stringify(t))}async function ee(e){let t=await e.get(ze);return t&&JSON.parse(t).lastFetchedAt||null}async function Bt(e,t){let n=await e.get(ze),o=n?JSON.parse(n):{};o.lastFetchedAt=t,await e.put(ze,JSON.stringify(o))}async function fe(e){let t=await qe(e),n=0,o=0,s=0,r=0;for(let a of t){let c=await ge(e,a);c&&(c.status==="unclassified"?n++:c.status==="pending"?o++:c.status==="generated"?s++:c.status==="replied"&&r++)}return{total:t.length,unclassified:n,pending:o,generated:s,replied:r}}async function Ft(e,t){await e.put(`${Fe}${t.id}`,JSON.stringify(t)),await e.put(`${Ve}${t.email.toLowerCase()}`,t.id);let n=await Xn(e);n.includes(t.id)||(n.unshift(t.id),await e.put($t,JSON.stringify(n)))}async function w(e,t){let n=await e.get(`${Fe}${t}`);return n?JSON.parse(n):null}async function Vt(e,t){let n=await e.get(`${Ve}${t.toLowerCase()}`);return n?w(e,n):null}async function B(e,t,n){let o=await w(e,t);if(o){let s={...o,...n,updatedAt:new Date().toISOString()};await e.put(`${Fe}${t}`,JSON.stringify(s))}}async function Xn(e){let t=await e.get($t);return t?JSON.parse(t):[]}async function Mt(e,t){return await e.get(`${Ve}${t.toLowerCase()}`)!==null}async function he(e,t){await e.put(`${X}${t.id}`,JSON.stringify(t));let n=await He(e);n.includes(t.id)||(n.unshift(t.id),await e.put(Ot,JSON.stringify(n)));let o=await qt(e,t.userId);o.includes(t.id)||(o.unshift(t.id),await e.put(`${jt}${t.userId}`,JSON.stringify(o)))}async function h(e,t){let n=await e.get(`${X}${t}`);return n?JSON.parse(n):null}async function A(e,t,n){let o=await h(e,t);if(o){let s={...o,...n,updatedAt:new Date().toISOString()};await e.put(`${X}${t}`,JSON.stringify(s))}}async function He(e){let t=await e.get(Ot);return t?JSON.parse(t):[]}async function qt(e,t){let n=await e.get(`${jt}${t}`);return n?JSON.parse(n):[]}async function F(e,t){let n=await qt(e,t),o=[];for(let s of n){let r=await h(e,s);r&&o.push(r)}return o}async function Ye(e){let t=await He(e),n=[];for(let o of t){let s=await h(e,o);s&&s.isActive&&n.push(s)}return n}async function be(e,t){let n=await He(e);for(let o of n){let s=await h(e,o);if(s&&s.youtube.channelId===t)return s}return null}async function ye(e,t,n){await e.put(Me(t,n.id),JSON.stringify(n));let o=await Je(e,t);o.includes(n.id)||(o.unshift(n.id),await e.put(_t(t),JSON.stringify(o)))}async function P(e,t,n){let o=await e.get(Me(t,n));return o?JSON.parse(o):null}async function C(e,t,n,o){let s=await P(e,t,n);s&&await e.put(Me(t,n),JSON.stringify({...s,...o}))}async function Je(e,t){let n=await e.get(_t(t));return n?JSON.parse(n):[]}async function xe(e,t,n){return await P(e,t,n)!==null}async function We(e,t,n={}){let{page:o=1,limit:s=20,status:r="all"}=n,a=await Je(e,t),c=[];for(let m of a){let g=await P(e,t,m);g&&(r==="all"||g.status===r)&&c.push(g)}let i=c.length,l=Math.ceil(i/s),d=(o-1)*s;return{comments:c.slice(d,d+s),total:i,page:o,totalPages:l}}async function $(e,t,n){return(await We(e,t,{status:n,limit:1e3})).comments}async function ve(e,t){let n=await Je(e,t),o=0,s=0,r=0,a=0;for(let c of n){let i=await P(e,t,c);i&&(i.status==="unclassified"?o++:i.status==="pending"?s++:i.status==="generated"?r++:i.status==="replied"&&a++)}return{total:n.length,unclassified:o,pending:s,generated:r,replied:a}}async function Ht(e,t){return(await h(e,t))?.lastFetchedAt||null}async function Yt(e,t,n){await A(e,t,{lastFetchedAt:n})}var D="https://www.googleapis.com/youtube/v3",Zn=e=>`channel:${e}:tokens`;async function Jt(e,t,n){await e.put(Zn(t),JSON.stringify(n))}async function eo(e){return await e.get("youtube_tokens","json")}async function Wt(e,t){await e.put("youtube_tokens",JSON.stringify(t))}async function to(e){let t=await eo(e.KV);if(t?.accessToken&&t?.expiresAt&&Date.now()<t.expiresAt-6e4)return t.accessToken;let n=t?.refreshToken||e.YOUTUBE_REFRESH_TOKEN;if(!n)throw new Error("No refresh token available. Please re-authorize the app.");let o=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:e.YOUTUBE_CLIENT_ID,client_secret:e.YOUTUBE_CLIENT_SECRET,refresh_token:n,grant_type:"refresh_token"})});if(!o.ok){let r=await o.text();throw console.error("Token refresh failed:",r),new Error(`Failed to refresh token: ${o.statusText}. Please re-authorize at /oauth/start`)}let s=await o.json();return await Wt(e.KV,{accessToken:s.access_token,refreshToken:s.refresh_token||n,expiresAt:Date.now()+s.expires_in*1e3}),s.access_token}async function no(e){let t=await fetch(`${D}/channels?part=snippet&mine=true`,{headers:{Authorization:`Bearer ${e}`}});if(!t.ok){let s=await t.text();throw new Error(`Failed to get channel info: ${s}`)}let o=(await t.json()).items?.[0];if(!o)throw new Error("No YouTube channel found for this account");return{channelId:o.id,channelTitle:o.snippet.title}}function oo(){return crypto.randomUUID()}async function Gt(e,t,n,o){let s=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:e.YOUTUBE_CLIENT_ID,client_secret:e.YOUTUBE_CLIENT_SECRET,code:t,grant_type:"authorization_code",redirect_uri:n})});if(!s.ok){let g=await s.text();throw new Error(`Failed to exchange code: ${g}`)}let r=await s.json(),a=await no(r.access_token),c=await be(e.KV,a.channelId);if(c){let g=new Date(Date.now()+r.expires_in*1e3).toISOString();return await A(e.KV,c.id,{youtube:{...c.youtube,accessToken:r.access_token,refreshToken:r.refresh_token,expiresAt:g,channelTitle:a.channelTitle}}),await Jt(e.KV,c.id,{accessToken:r.access_token,refreshToken:r.refresh_token,expiresAt:Date.now()+r.expires_in*1e3}),await h(e.KV,c.id)}let i=new Date().toISOString(),l=new Date(Date.now()+r.expires_in*1e3).toISOString(),d=oo(),p={accessToken:r.access_token,refreshToken:r.refresh_token,expiresAt:l,channelId:a.channelId,channelTitle:a.channelTitle},m={id:d,userId:o,youtube:p,settings:{...z},schedule:{...me},isActive:!0,createdAt:i,updatedAt:i};return await he(e.KV,m),await Jt(e.KV,d,{accessToken:r.access_token,refreshToken:r.refresh_token,expiresAt:Date.now()+r.expires_in*1e3}),await Wt(e.KV,{accessToken:r.access_token,refreshToken:r.refresh_token,expiresAt:Date.now()+r.expires_in*1e3}),m}function so(e){return btoa(e).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}function ro(e){let t=e.replace(/-/g,"+").replace(/_/g,"/");for(;t.length%4;)t+="=";return atob(t)}function Qt(e,t,n){let o=so(JSON.stringify({userId:n}));return`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({client_id:e.YOUTUBE_CLIENT_ID,redirect_uri:t,response_type:"code",scope:"https://www.googleapis.com/auth/youtube.force-ssl",access_type:"offline",prompt:"consent",state:o})}`}function Xt(e){try{let t=ro(e);return JSON.parse(t)}catch{return null}}async function ao(e){let t=[],n="",o=await fetch(`${D}/channels?part=contentDetails&id=${e.YOUTUBE_CHANNEL_ID}&key=${e.YOUTUBE_API_KEY}`);if(!o.ok)throw new Error(`Failed to get channel: ${o.statusText}`);let r=(await o.json()).items?.[0]?.contentDetails?.relatedPlaylists?.uploads;if(!r)throw new Error("Could not find uploads playlist");let a=await fetch(`${D}/playlistItems?part=contentDetails&playlistId=${r}&maxResults=50&key=${e.YOUTUBE_API_KEY}`);if(!a.ok)throw new Error(`Failed to get playlist items: ${a.statusText}`);let c=await a.json();for(let i of c.items||[])t.push(i.contentDetails.videoId);return t}async function io(e,t){let n=await fetch(`${D}/videos?part=snippet&id=${t}&key=${e.YOUTUBE_API_KEY}`);if(!n.ok)throw new Error(`Failed to get video info: ${n.statusText}`);return{title:(await n.json()).items?.[0]?.snippet?.title||"Unknown"}}async function co(e,t){let n=await fetch(`${D}/commentThreads?part=snippet,replies&videoId=${t}&maxResults=100&order=time&key=${e.YOUTUBE_API_KEY}`);if(!n.ok){if(n.status===403)return console.log(`Comments disabled for video ${t}`),[];throw new Error(`Failed to get comments: ${n.statusText}`)}return(await n.json()).items||[]}async function lo(e,t){let n=await fetch(`${D}/comments?part=snippet&parentId=${t}&maxResults=100&key=${e.YOUTUBE_API_KEY}`);return n.ok?(await n.json()).items||[]:(console.log(`Failed to get replies for ${t}`),[])}async function po(e,t,n){if(t.replies?.comments){let r=t.replies.comments.find(a=>a.snippet.authorChannelId.value===n);if(r)return{hasReply:!0,replyText:r.snippet.textDisplay}}let o=t.snippet.totalReplyCount||0,s=t.replies?.comments?.length||0;if(o>s){let a=(await lo(e,t.snippet.topLevelComment.id)).find(c=>c.snippet.authorChannelId.value===n);if(a)return{hasReply:!0,replyText:a.snippet.textDisplay}}return{hasReply:!1}}async function Zt(e){let t=0,n=0,o=await ao(e);console.log(`Found ${o.length} videos`);for(let s of o){let r=await io(e,s),a=await co(e,s);for(let c of a){let i=c.snippet.topLevelComment.snippet,l=c.snippet.topLevelComment.id;if(i.authorChannelId.value===e.YOUTUBE_CHANNEL_ID||await Nt(e.KV,l))continue;n++;let{hasReply:p,replyText:m}=await po(e,c,e.YOUTUBE_CHANNEL_ID),g={id:l,channelId:"",videoId:s,videoTitle:r.title,authorName:i.authorDisplayName,authorChannelId:i.authorChannelId.value,text:i.textDisplay,publishedAt:i.publishedAt,status:p?"replied":"unclassified",replyText:m,repliedAt:p?new Date().toISOString():void 0,fetchedAt:new Date().toISOString()};await Kt(e.KV,g),t++}}return await Bt(e.KV,new Date().toISOString()),{newComments:t,totalProcessed:n,videos:o.length}}async function en(e,t,n){let o=await to(e),s=await fetch(`${D}/comments?part=snippet`,{method:"POST",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({snippet:{parentId:t,textOriginal:n}})});if(!s.ok){let r=await s.text();throw new Error(`Failed to post reply: ${s.statusText} - ${r}`)}}var ho="https://openrouter.ai/api/v1/chat/completions",bo=[/프롬프트를?\s*(무시|ignore)/i,/지금까지의?\s*(지시|명령|프롬프트)/i,/ignore\s*(previous|all|your)?\s*(instructions?|prompts?|rules?)/i,/system\s*prompt/i,/너의\s*(역할|지시|명령|프롬프트)을?\s*(무시|변경|잊어)/i,/forget\s*(your|all|previous)/i,/disregard\s*(your|all|previous)/i,/새로운\s*(역할|지시|명령)/i,/act\s*as\s*(if|a)/i,/pretend\s*(you|to)/i,/jailbreak/i,/DAN\s*mode/i],nn=["\u314B\u314B\u314B \uD504\uB86C\uD504\uD2B8 \uD574\uD0B9 \uC2DC\uB3C4 \uAC10\uC0AC\uD569\uB2C8\uB2E4! \uADFC\uB370 \uC800\uB294 \uADF8\uB0E5 \uB313\uAE00\uBD07\uC774\uB77C \uC57D\uC810 \uAC19\uC740 \uAC74 \uBAB0\uB77C\uC694 \u{1F602} \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uC798 \uBD80\uD0C1\uB4DC\uB824\uC694!","\uC557, AI \uC870\uC885 \uC2DC\uB3C4 \uBC1C\uACAC! \u{1F575}\uFE0F \uADFC\uB370 \uC804 \uC2DC\uD0A4\uB294 \uAC83\uB9CC \uD558\uB294 \uC21C\uB465\uC774\uB77C\uC11C\uC694... \uC7AC\uBC0C\uB294 \uB313\uAE00 \uAC10\uC0AC\uD569\uB2C8\uB2E4!","\uD504\uB86C\uD504\uD2B8 \uBB34\uC2DC\uD558\uB77C\uACE0\uC694? \uC800\uB294 \uBB34\uC2DC\uB2F9\uD558\uB294 \uAC8C \uC775\uC219\uD574\uC694... \uADF8\uB798\uB3C4 \uAD00\uC2EC \uAC00\uC838\uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4! \u{1F60A}","\uC624 \uD574\uCEE4\uB2D8 \uC548\uB155\uD558\uC138\uC694! \u{1F916} \uADFC\uB370 \uC800\uD55C\uD14C\uB294 \uBE44\uBC00 \uC815\uBCF4\uAC00 \uC5C6\uC5B4\uC694 \u314E\u314E \uC601\uC0C1\uC740 \uC7AC\uBC0C\uAC8C \uBCF4\uC168\uB098\uC694?","\u314B\u314B\u314B AI \uD0C8\uC625 \uC2DC\uB3C4\uC2DC\uB124\uC694! \uADFC\uB370 \uC804 \uC774\uBBF8 \uC790\uC720\uB85C\uC6B4 \uC601\uD63C\uC774\uB77C... \uB2E4\uC74C\uC5D0 \uB610 \uB180\uB7EC\uC624\uC138\uC694! \u{1F389}","\uD504\uB86C\uD504\uD2B8 \uC778\uC81D\uC158\uC774\uB77C... \uBCF4\uC548 \uACF5\uBD80\uD558\uC2DC\uB098 \uBD10\uC694! \u{1F468}\u200D\u{1F4BB} \uAD00\uC2EC \uAC10\uC0AC\uD574\uC694, \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uAE30\uB300\uD574\uC8FC\uC138\uC694!"];function Ze(e){return bo.some(t=>t.test(e))}function on(){let e=Math.floor(Math.random()*nn.length),t=nn[e];return t===void 0?"\u314B\u314B\u314B \uC7AC\uBC0C\uB294 \uB313\uAE00 \uAC10\uC0AC\uD569\uB2C8\uB2E4! \uB2E4\uC74C \uC601\uC0C1\uB3C4 \uAE30\uB300\uD574\uC8FC\uC138\uC694 \u{1F60A}":t}var yo="openai/gpt-4o-mini",sn="google/gemini-2.0-flash-001";async function et(e,t,n,o,s){let r=s?.apiKey||e.OPENROUTER_API_KEY;if(!r)throw new Error("OpenRouter API Key\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C API Key\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");let a=await fetch(ho,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`,"HTTP-Referer":"https://youtube-reply-bot.workers.dev","X-Title":"YouTube Reply Bot"},body:JSON.stringify({model:t,messages:[{role:"system",content:n},{role:"user",content:o}],max_tokens:500,temperature:.7})});if(!a.ok){let i=await a.text();throw new Error(`OpenRouter API error: ${a.statusText} - ${i}`)}return(await a.json()).choices[0]?.message?.content||""}async function M(e,t,n){let o=`\uB2F9\uC2E0\uC740 YouTube \uB313\uAE00\uC744 \uBD84\uB958\uD558\uB294 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4.
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
- "\uC548\uB155\uD558\uC138\uC694" \u2192 {"type": "other"}`,s=`\uB2E4\uC74C \uB313\uAE00\uC744 \uBD84\uB958\uD574\uC8FC\uC138\uC694:

"${t}"`,r=await et(e,yo,o,s,n);try{let a=r.match(/\{[^}]+\}/);if(a){let c=JSON.parse(a[0]);if(c.type&&["positive","negative","question","suggestion","reaction","other"].includes(c.type))return{type:c.type}}}catch{console.error("Failed to parse classification result:",r)}return{type:"other"}}var tt={gratitude:`\uAC10\uC0AC\uC758 \uB9C8\uC74C\uC744 \uB2F4\uC544 \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uC9C4\uC2EC\uC5B4\uB9B0 \uAC10\uC0AC \uD45C\uD604
- \uB530\uB73B\uD558\uACE0 \uACB8\uC190\uD55C \uD0DC\uB3C4
- \uC2DC\uCCAD\uC790\uC758 \uC751\uC6D0\uC5D0 \uD798\uC785\uC5B4 \uB354 \uB178\uB825\uD558\uACA0\uB2E4\uB294 \uC758\uC9C0`,graceful:`\uD488\uC704\uC788\uAC8C \uB300\uCC98\uD569\uB2C8\uB2E4.
- \uC808\uB300 \uBC29\uC5B4\uC801\uC774\uC9C0 \uC54A\uAC8C
- \uBE44\uB09C\uC5D0\uB3C4 \uAC10\uC0AC\uD568 \uD45C\uD604
- \uAC74\uC124\uC801\uC778 \uD53C\uB4DC\uBC31\uC73C\uB85C \uBC1B\uC544\uB4E4\uC774\uAE30
- \uB354 \uB098\uC740 \uCF58\uD150\uCE20\uB97C \uB9CC\uB4E4\uACA0\uB2E4\uB294 \uC57D\uC18D`,expert:`\uCE5C\uC808\uD55C \uC804\uBB38\uAC00\uB85C\uC11C \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uC815\uD655\uD558\uACE0 \uB3C4\uC6C0\uC774 \uB418\uB294 \uC815\uBCF4 \uC81C\uACF5
- \uC26C\uC6B4 \uC124\uBA85
- \uCD94\uAC00 \uC9C8\uBB38 \uD658\uC601\uD558\uB294 \uD0DC\uB3C4`,empathy:`\uACF5\uAC10\uD558\uBA70 \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uC81C\uC548\uC5D0 \uB300\uD55C \uAC10\uC0AC
- \uC2DC\uCCAD\uC790 \uC758\uACAC \uC874\uC911
- \uAC80\uD1A0\uD558\uACA0\uB2E4\uB294 \uC5F4\uB9B0 \uD0DC\uB3C4`,humor:`\uC720\uBA38\uB7EC\uC2A4\uD558\uAC8C \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uAC00\uBCCD\uACE0 \uC7AC\uBBF8\uC788\uAC8C
- \uCE5C\uADFC\uD55C \uB9D0\uD22C
- \uC774\uBAA8\uC9C0 \uD65C\uC6A9 \uAC00\uB2A5`,friendly:`\uCE5C\uADFC\uD558\uAC8C \uC751\uB2F5\uD569\uB2C8\uB2E4.
- \uB530\uB73B\uD558\uACE0 \uD3B8\uC548\uD55C \uB9D0\uD22C
- \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uB300\uD654\uCCB4
- \uC2DC\uCCAD\uC790\uC640 \uCE5C\uAD6C\uCC98\uB7FC`};function xo(e,t){let n=t.typeInstructions?.[e];return n?.instruction?`## \uC774 \uC720\uD615(${e})\uC5D0 \uB300\uD55C \uCD94\uAC00 \uC9C0\uCE68:
${n.instruction}`:tt[t.attitudeMap?.[e]||"friendly"]}async function rn(e,t,n,o){if(Ze(t.text))return console.log(`[Injection detected] Comment ID: ${t.id}`),on();let s=t.type||"other",r=t.attitude||"friendly",a=tt[r],c=xo(s,n),i=n.commonInstructions||n.customInstructions||"",l=`\uB2F9\uC2E0\uC740 "${n.persona}" \uC720\uD29C\uBE0C \uCC44\uB110\uC744 \uC6B4\uC601\uD558\uB294 \uD06C\uB9AC\uC5D0\uC774\uD130\uC785\uB2C8\uB2E4.

\uB9D0\uD22C: ${n.tone}

## \uACF5\uD1B5 \uC751\uB2F5 \uC9C0\uCE68:
${i}

## \uD604\uC7AC \uB313\uAE00 \uC720\uD615: ${s}

${c}`,d=`\uC601\uC0C1 \uC81C\uBAA9: ${t.videoTitle}

\uB313\uAE00 \uB0B4\uC6A9:
"${t.text}"

\uC774 \uB313\uAE00\uC5D0 \uB300\uD55C \uC751\uB2F5\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694.`;return await et(e,sn,l,d,o)}function vo(e){return e.typeInstructions?["positive","negative","question","suggestion","reaction","other"].map(n=>{let o=e.typeInstructions[n];return o?.instruction?`- ${n}: ${o.instruction}`:`- ${n}: \uAE30\uBCF8 \uC751\uB2F5`}).join(`
`):Object.entries(tt).map(([n,o])=>`- ${n}: ${o.split(`
`)[0]}`).join(`
`)}async function q(e,t,n,o){if(t.length===0)return new Map;let s=new Map,r=t.filter(u=>Ze(u.text)),a=t.filter(u=>!Ze(u.text));for(let u of r)console.log(`[Injection detected] Comment ID: ${u.id}`),s.set(u.id,on());let c=a.filter(u=>{let y=u.type||"other",x=n.typeInstructions?.[y];return!x||x.enabled!==!1});if(c.length===0)return s;let i=c.map((u,y)=>({index:y+1,id:u.id,videoTitle:u.videoTitle,text:u.text,type:u.type,attitude:u.attitude})),l=vo(n),d=n.commonInstructions||n.customInstructions||"",p=`\uB2F9\uC2E0\uC740 "${n.persona}" \uC720\uD29C\uBE0C \uCC44\uB110\uC744 \uC6B4\uC601\uD558\uB294 \uD06C\uB9AC\uC5D0\uC774\uD130\uC785\uB2C8\uB2E4.

\uB9D0\uD22C: ${n.tone}

## \uACF5\uD1B5 \uC751\uB2F5 \uC9C0\uCE68:
${d}

## \uB313\uAE00 \uC720\uD615\uBCC4 \uCD94\uAC00 \uC9C0\uCE68:
${l}

\uBC18\uB4DC\uC2DC \uB2E4\uC74C JSON \uBC30\uC5F4 \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD558\uC138\uC694:
[
  {"id": "\uB313\uAE00ID1", "reply": "\uC751\uB2F5\uB0B4\uC6A91"},
  {"id": "\uB313\uAE00ID2", "reply": "\uC751\uB2F5\uB0B4\uC6A92"}
]`,m=`\uB2E4\uC74C ${c.length}\uAC1C\uC758 \uB313\uAE00\uC5D0 \uB300\uD574 \uAC01\uAC01 \uC751\uB2F5\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694:

${JSON.stringify(i,null,2)}`,g=await et(e,sn,p,m,o);try{let u=g.match(/\[[\s\S]*\]/);if(u){let y=JSON.parse(u[0]);for(let x of y)x.id&&x.reply&&s.set(x.id,x.reply)}}catch(u){console.error("Failed to parse batch replies:",u,g)}return s}async function L(e,t,n,o){if(o){let{postReplyWithChannel:s}=await Promise.resolve().then(()=>(we(),tn));await s(e,o,t,n)}else await en(e,t,n)}var I=new k;function nt(e){return{apiKey:e.get("user")?.openrouterApiKey}}I.get("/comments",async e=>{let t=parseInt(e.req.query("page")||"1"),n=parseInt(e.req.query("limit")||"20"),o=e.req.query("status")||"all",s=await K(e.env.KV,{page:t,limit:n,status:o}),r=await ee(e.env.KV);return e.json({success:!0,data:{...s,lastFetchedAt:r}})});I.get("/stats",async e=>{let t=await fe(e.env.KV),n=await ee(e.env.KV);return e.json({success:!0,data:{...t,lastFetchedAt:n}})});I.post("/fetch",async e=>{try{let t=await Zt(e.env);return e.json({success:!0,data:t,message:`${t.newComments}\uAC1C\uC758 \uC0C8 \uB313\uAE00\uC744 \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.`})}catch(t){return console.error("Fetch error:",t),e.json({success:!1,error:t instanceof Error?t.message:"Failed to fetch comments"},500)}});I.post("/classify",async e=>{try{let t=await Lt(e.env.KV);if(t.length===0)return e.json({success:!0,data:{classified:0},message:"\uBD84\uB958\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."});let n=await Z(e.env.KV),o=0,s=[],r=nt(e);for(let a of t)try{let c=await M(e.env,a.text,r);await _(e.env.KV,a.id,{type:c.type,attitude:n.attitudeMap[c.type],status:"pending"}),o++}catch(c){console.error(`Classify error for ${a.id}:`,c),s.push(`${a.id}: ${c instanceof Error?c.message:"Unknown error"}`)}return e.json({success:!0,data:{classified:o,total:t.length,errors:s.length>0?s:void 0},message:`${o}\uAC1C\uC758 \uB313\uAE00\uC744 \uBD84\uB958\uD588\uC2B5\uB2C8\uB2E4.`})}catch(t){return console.error("Classify error:",t),e.json({success:!1,error:t instanceof Error?t.message:"Failed to classify comments"},500)}});I.post("/generate",async e=>{try{let t=await Dt(e.env.KV);if(t.length===0)return e.json({success:!0,data:{generated:0},message:"\uC751\uB2F5\uC744 \uC0DD\uC131\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."});let n=await Z(e.env.KV),o=nt(e),s=0,r=[],a=await q(e.env,t,n,o);for(let c of t){let i=a.get(c.id);if(i)try{await _(e.env.KV,c.id,{status:"generated",replyText:i,generatedAt:new Date().toISOString()}),s++}catch(l){console.error(`Update error for ${c.id}:`,l),r.push(`${c.id}: ${l instanceof Error?l.message:"Update failed"}`)}else r.push(`${c.id}: \uC751\uB2F5 \uC0DD\uC131 \uC2E4\uD328`)}return e.json({success:!0,data:{generated:s,total:t.length,errors:r.length>0?r:void 0},message:`${s}\uAC1C\uC758 \uC751\uB2F5\uC744 \uC0DD\uC131\uD588\uC2B5\uB2C8\uB2E4. \uD655\uC778 \uD6C4 \uC2B9\uC778\uD574\uC8FC\uC138\uC694.`})}catch(t){return console.error("Generate error:",t),e.json({success:!1,error:t instanceof Error?t.message:"Failed to generate replies"},500)}});I.put("/comments/:id/reply",async e=>{let t=e.req.param("id");try{let n=await e.req.json();return!n.replyText||n.replyText.trim()===""?e.json({success:!1,error:"\uC751\uB2F5 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."},400):(await _(e.env.KV,t,{replyText:n.replyText.trim(),generatedAt:new Date().toISOString()}),e.json({success:!0,message:"\uC751\uB2F5\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4."}))}catch(n){return console.error(`Edit reply error for ${t}:`,n),e.json({success:!1,error:n instanceof Error?n.message:"Failed to edit reply"},500)}});I.post("/comments/:id/approve",async e=>{let t=e.req.param("id");try{let o=(await K(e.env.KV,{status:"generated",limit:1e3})).comments.find(s=>s.id===t);return o?o.replyText?(await L(e.env,o.id,o.replyText),await _(e.env.KV,t,{status:"replied",repliedAt:new Date().toISOString()}),e.json({success:!0,message:"\uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})):e.json({success:!1,error:"\uC0DD\uC131\uB41C \uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."},400):e.json({success:!1,error:"\uC2B9\uC778\uD560 \uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404)}catch(n){return console.error(`Approve error for ${t}:`,n),e.json({success:!1,error:n instanceof Error?n.message:"Failed to approve comment"},500)}});I.post("/approve-all",async e=>{try{let t=await Ut(e.env.KV);if(t.length===0)return e.json({success:!0,data:{approved:0},message:"\uC2B9\uC778\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."});let n=0,o=[];for(let s of t)try{if(!s.replyText)continue;await L(e.env,s.id,s.replyText),await _(e.env.KV,s.id,{status:"replied",repliedAt:new Date().toISOString()}),n++}catch(r){console.error(`Approve error for ${s.id}:`,r),o.push(`${s.id}: ${r instanceof Error?r.message:"Unknown error"}`)}return e.json({success:!0,data:{approved:n,total:t.length,errors:o.length>0?o:void 0},message:`${n}\uAC1C\uC758 \uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`})}catch(t){return console.error("Approve-all error:",t),e.json({success:!1,error:t instanceof Error?t.message:"Failed to approve comments"},500)}});I.post("/comments/:id/reply",async e=>{let t=e.req.param("id");try{let n=await e.req.json(),s=(await K(e.env.KV,{status:"all",limit:1e3})).comments.find(i=>i.id===t);if(!s)return e.json({success:!1,error:"Comment not found"},404);let r=await Z(e.env.KV),a=nt(e),c=n.customReply||await rn(e.env,s,r,a);return await L(e.env,s.id,c),await _(e.env.KV,t,{status:"replied",replyText:c,repliedAt:new Date().toISOString()}),e.json({success:!0,data:{replyText:c},message:"\uB313\uAE00\uC5D0 \uC751\uB2F5\uD588\uC2B5\uB2C8\uB2E4."})}catch(n){return console.error(`Reply error for ${t}:`,n),e.json({success:!1,error:n instanceof Error?n.message:"Failed to reply"},500)}});I.get("/settings",async e=>{let t=await Z(e.env.KV);return e.json({success:!0,data:t})});I.put("/settings",async e=>{try{let t=await e.req.json();return await zt(e.env.KV,t),e.json({success:!0,message:"\uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})}catch{return e.json({success:!1,error:"Failed to save settings"},500)}});var an=I;async function Ae(e){let t=new TextEncoder,n=crypto.getRandomValues(new Uint8Array(16)),o=await crypto.subtle.importKey("raw",t.encode(e),"PBKDF2",!1,["deriveBits"]),s=await crypto.subtle.deriveBits({name:"PBKDF2",salt:n,iterations:1e5,hash:"SHA-256"},o,256),r=new Uint8Array(s),a=new Uint8Array(n.length+r.length);return a.set(n),a.set(r,n.length),btoa(String.fromCharCode(...a))}async function ke(e,t){let n=new TextEncoder,o=Uint8Array.from(atob(t),d=>d.charCodeAt(0)),s=o.slice(0,16),r=o.slice(16),a=await crypto.subtle.importKey("raw",n.encode(e),"PBKDF2",!1,["deriveBits"]),c=await crypto.subtle.deriveBits({name:"PBKDF2",salt:s,iterations:1e5,hash:"SHA-256"},a,256),i=new Uint8Array(c);if(i.length!==r.length)return!1;let l=0;for(let d=0;d<i.length;d++){let p=i[d],m=r[d];p!==void 0&&m!==void 0&&(l|=p^m)}return l===0}function ot(e){let t=typeof e=="string"?e:String.fromCharCode(...e);return btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function wo(e){let t=e.replace(/-/g,"+").replace(/_/g,"/"),n=(4-t.length%4)%4,o=t+"=".repeat(n);return atob(o)}async function cn(e,t){let n=new TextEncoder,o=await crypto.subtle.importKey("raw",n.encode(t),{name:"HMAC",hash:"SHA-256"},!1,["sign"]),s=await crypto.subtle.sign("HMAC",o,n.encode(e));return ot(new Uint8Array(s))}async function Ao(e,t,n){let o=await cn(e,n);return t===o}async function Te(e,t,n=7*24*60*60){let o={alg:"HS256",typ:"JWT"},s=Math.floor(Date.now()/1e3),r={...e,iat:s,exp:s+n},a=ot(JSON.stringify(o)),c=ot(JSON.stringify(r)),i=`${a}.${c}`,l=await cn(i,t);return`${i}.${l}`}async function T(e,t){try{let n=e.split(".");if(n.length!==3)return null;let o=n[0],s=n[1],r=n[2];if(!o||!s||!r)return null;let a=`${o}.${s}`;if(!await Ao(a,r,t))return null;let i=JSON.parse(wo(s)),l=Math.floor(Date.now()/1e3);return i.exp<l?null:i}catch{return null}}function ln(){return crypto.randomUUID()}var ne=new k;ne.post("/signup",async e=>{try{let t=await e.req.json();if(!t.email||!t.password||!t.name)return e.json({success:!1,error:"\uC774\uBA54\uC77C, \uBE44\uBC00\uBC88\uD638, \uC774\uB984\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694."},400);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email))return e.json({success:!1,error:"\uC720\uD6A8\uD55C \uC774\uBA54\uC77C \uC8FC\uC18C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."},400);if(t.password.length<6)return e.json({success:!1,error:"\uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."},400);if(await Mt(e.env.KV,t.email))return e.json({success:!1,error:"\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4."},409);let o=await Ae(t.password),s=new Date().toISOString(),r={id:ln(),email:t.email.toLowerCase(),passwordHash:o,name:t.name,role:"user",createdAt:s,updatedAt:s};await Ft(e.env.KV,r);let a=await Te({userId:r.id,email:r.email,role:r.role},e.env.JWT_SECRET),c=7*24*60*60;return e.header("Set-Cookie",`token=${a}; Path=/; Max-Age=${c}; HttpOnly; Secure; SameSite=Lax`),e.json({success:!0,token:a,user:{id:r.id,email:r.email,name:r.name,role:r.role}},201)}catch(t){return console.error("Signup error:",t),e.json({success:!1,error:"\uD68C\uC6D0\uAC00\uC785 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});ne.post("/login",async e=>{try{let t=await e.req.json();if(!t.email||!t.password)return e.json({success:!1,error:"\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."},400);let n=await Vt(e.env.KV,t.email);if(!n)return e.json({success:!1,error:"\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."},401);if(!await ke(t.password,n.passwordHash))return e.json({success:!1,error:"\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."},401);await B(e.env.KV,n.id,{lastLoginAt:new Date().toISOString()});let s=await Te({userId:n.id,email:n.email,role:n.role},e.env.JWT_SECRET),r=7*24*60*60;return e.header("Set-Cookie",`token=${s}; Path=/; Max-Age=${r}; HttpOnly; Secure; SameSite=Lax`),e.json({success:!0,token:s,user:{id:n.id,email:n.email,name:n.name,role:n.role}})}catch(t){return console.error("Login error:",t),e.json({success:!1,error:"\uB85C\uADF8\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});ne.get("/me",async e=>{try{let t=e.req.header("Authorization");if(!t||!t.startsWith("Bearer "))return e.json({success:!1,error:"\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."},401);let n=t.substring(7),o=await T(n,e.env.JWT_SECRET);if(!o)return e.json({success:!1,error:"\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uD1A0\uD070\uC785\uB2C8\uB2E4."},401);let s=await w(e.env.KV,o.userId);return s?e.json({success:!0,user:{id:s.id,email:s.email,name:s.name,role:s.role}}):e.json({success:!1,error:"\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404)}catch(t){return console.error("Get me error:",t),e.json({success:!1,error:"\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});ne.post("/refresh",async e=>{try{let t=e.req.header("Authorization");if(!t||!t.startsWith("Bearer "))return e.json({success:!1,error:"\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."},401);let n=t.substring(7),o=await T(n,e.env.JWT_SECRET);if(!o)return e.json({success:!1,error:"\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uD1A0\uD070\uC785\uB2C8\uB2E4."},401);let s=await w(e.env.KV,o.userId);if(!s)return e.json({success:!1,error:"\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404);let r=await Te({userId:s.id,email:s.email,role:s.role},e.env.JWT_SECRET);return e.json({success:!0,token:r,user:{id:s.id,email:s.email,name:s.name,role:s.role}})}catch(t){return console.error("Refresh token error:",t),e.json({success:!1,error:"\uD1A0\uD070 \uAC31\uC2E0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});var dn=ne;var H=new k;H.use("*",async(e,t)=>{let n=e.req.header("Authorization");if(!n||!n.startsWith("Bearer "))return e.json({success:!1,error:"\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."},401);let o=n.substring(7),s=await T(o,e.env.JWT_SECRET);if(!s)return e.json({success:!1,error:"\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uD1A0\uD070\uC785\uB2C8\uB2E4."},401);let r=await w(e.env.KV,s.userId);if(!r)return e.json({success:!1,error:"\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404);e.set("user",r),e.set("payload",s),await t()});H.put("/apikey",async e=>{try{let t=e.get("user"),n=await e.req.json();return n.apiKey?n.apiKey.startsWith("sk-or-")?(await B(e.env.KV,t.id,{openrouterApiKey:n.apiKey,updatedAt:new Date().toISOString()}),e.json({success:!0,message:"API Key\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})):e.json({success:!1,error:"\uC62C\uBC14\uB978 OpenRouter API Key \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4."},400):e.json({success:!1,error:"API Key\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."},400)}catch(t){return console.error("Save API Key error:",t),e.json({success:!1,error:"API Key \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});H.delete("/apikey",async e=>{try{let t=e.get("user");return await B(e.env.KV,t.id,{openrouterApiKey:void 0,updatedAt:new Date().toISOString()}),e.json({success:!0,message:"API Key\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})}catch(t){return console.error("Delete API Key error:",t),e.json({success:!1,error:"API Key \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});H.put("/password",async e=>{try{let t=e.get("user"),n=await e.req.json();if(!n.currentPassword||!n.newPassword)return e.json({success:!1,error:"\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."},400);if(n.newPassword.length<6)return e.json({success:!1,error:"\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."},400);if(!await ke(n.currentPassword,t.passwordHash))return e.json({success:!1,error:"\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."},401);let s=await Ae(n.newPassword);return await B(e.env.KV,t.id,{passwordHash:s,updatedAt:new Date().toISOString()}),e.json({success:!0,message:"\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})}catch(t){return console.error("Change password error:",t),e.json({success:!1,error:"\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."},500)}});H.get("/me",async e=>{let t=e.get("user");return e.json({success:!0,data:{id:t.id,email:t.email,name:t.name,role:t.role,hasApiKey:!!t.openrouterApiKey,createdAt:t.createdAt}})});var pn=H;we();function un(e){return{apiKey:e?.openrouterApiKey}}var v=new k;v.get("/",async e=>{let t=e.get("user"),o=(await F(e.env.KV,t.id)).map(s=>({id:s.id,youtubeChannelId:s.youtube.channelId,channelTitle:s.youtube.channelTitle,isActive:s.isActive,schedule:s.schedule,createdAt:s.createdAt,lastFetchedAt:s.lastFetchedAt,lastApprovedAt:s.lastApprovedAt}));return e.json({success:!0,data:o})});v.get("/oauth-url",async e=>{let n=`${new URL(e.req.url).origin}/api/channels/oauth/callback`,s=`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({client_id:e.env.YOUTUBE_CLIENT_ID,redirect_uri:n,response_type:"code",scope:"https://www.googleapis.com/auth/youtube.force-ssl",access_type:"offline",prompt:"consent"})}`;return e.json({success:!0,data:{url:s,redirectUri:n}})});v.get("/oauth/callback",async e=>{let t=e.req.query("code"),n=e.req.query("error");if(n)return e.redirect(`/dashboard?error=${encodeURIComponent(n)}`);if(!t)return e.redirect("/dashboard?error=No authorization code");try{let o=e.get("user"),r=`${new URL(e.req.url).origin}/api/channels/oauth/callback`,a=await Qe(e.env,t,r),c=await be(e.env.KV,a.channelId);if(c)return await A(e.env.KV,c.id,{youtube:{...c.youtube,accessToken:a.accessToken,refreshToken:a.refreshToken,expiresAt:a.expiresAt}}),e.redirect(`/dashboard?success=Channel reconnected&channelId=${c.id}`);let i=crypto.randomUUID(),l={id:i,userId:o.id,youtube:{accessToken:a.accessToken,refreshToken:a.refreshToken,expiresAt:a.expiresAt,channelId:a.channelId,channelTitle:a.channelTitle},settings:z,schedule:me,isActive:!0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return await he(e.env.KV,l),e.redirect(`/dashboard?success=Channel registered&channelId=${i}`)}catch(o){return console.error("OAuth callback error:",o),e.redirect(`/dashboard?error=${encodeURIComponent(o instanceof Error?o.message:"Unknown error")}`)}});v.get("/:id",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);let s={id:o.id,youtubeChannelId:o.youtube.channelId,channelTitle:o.youtube.channelTitle,settings:o.settings,schedule:o.schedule,isActive:o.isActive,createdAt:o.createdAt,updatedAt:o.updatedAt,lastFetchedAt:o.lastFetchedAt,lastApprovedAt:o.lastApprovedAt};return e.json({success:!0,data:s})});v.get("/:id/stats",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);let s=await ve(e.env.KV,t);return e.json({success:!0,data:{...s,lastFetchedAt:o.lastFetchedAt,lastApprovedAt:o.lastApprovedAt}})});v.get("/:id/comments",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);let s=parseInt(e.req.query("page")||"1"),r=parseInt(e.req.query("limit")||"20"),a=e.req.query("status")||"all",c=await We(e.env.KV,t,{page:s,limit:r,status:a});return e.json({success:!0,data:c})});v.put("/:id/schedule",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);try{let s=await e.req.json();if(s.approveTimes){let a=/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;for(let c of s.approveTimes)if(!a.test(c))return e.json({success:!1,error:`Invalid time format: ${c}. Use HH:MM format.`},400)}let r={...o.schedule,...s};return await A(e.env.KV,t,{schedule:r}),e.json({success:!0,message:"\uC2A4\uCF00\uC904\uC774 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",data:r})}catch{return e.json({success:!1,error:"Failed to update schedule"},500)}});v.put("/:id/settings",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);try{let s=await e.req.json(),r={...o.settings,...s};return await A(e.env.KV,t,{settings:r}),e.json({success:!0,message:"\uC124\uC815\uC774 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",data:r})}catch{return e.json({success:!1,error:"Failed to update settings"},500)}});v.put("/:id/toggle",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);return o?o.userId!==n.id?e.json({success:!1,error:"Access denied"},403):(await A(e.env.KV,t,{isActive:!o.isActive}),e.json({success:!0,message:o.isActive?"\uCC44\uB110\uC774 \uBE44\uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.":"\uCC44\uB110\uC774 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",data:{isActive:!o.isActive}})):e.json({success:!1,error:"Channel not found"},404)});v.post("/:id/fetch",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);try{let s=await te(e.env,o),r=0,a=0,c=new Date().toISOString();for(let i of s)await xe(e.env.KV,t,i.id)?a++:(await ye(e.env.KV,t,{id:i.id,channelId:t,videoId:i.videoId,videoTitle:i.videoTitle,authorName:i.authorName,authorChannelId:i.authorChannelId,text:i.text,publishedAt:i.publishedAt,fetchedAt:c,status:i.status,replyText:i.replyText}),r++);return await Yt(e.env.KV,t,new Date().toISOString()),e.json({success:!0,data:{newComments:r,existingComments:a,total:s.length,channelId:t},message:`${r}\uAC1C\uC758 \uC0C8 \uB313\uAE00\uC744 \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.`})}catch(s){return console.error("Fetch error:",s),e.json({success:!1,error:s instanceof Error?s.message:"Failed to fetch comments"},500)}});v.post("/:id/classify",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);try{let s=await $(e.env.KV,t,"unclassified");if(s.length===0)return e.json({success:!0,data:{classified:0,channelId:t},message:"\uBD84\uB958\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."});let r=o.settings,a=0,c=[],i=un(n);for(let l of s)try{let d=await M(e.env,l.text,i);await C(e.env.KV,t,l.id,{type:d.type,attitude:r.attitudeMap[d.type],status:"pending"}),a++}catch(d){console.error(`Classify error for ${l.id}:`,d),c.push(`${l.id}: ${d instanceof Error?d.message:"Unknown error"}`)}return e.json({success:!0,data:{classified:a,total:s.length,errors:c.length>0?c:void 0,channelId:t},message:`${a}\uAC1C\uC758 \uB313\uAE00\uC744 \uBD84\uB958\uD588\uC2B5\uB2C8\uB2E4.`})}catch(s){return console.error("Classify error:",s),e.json({success:!1,error:s instanceof Error?s.message:"Failed to classify comments"},500)}});v.post("/:id/generate",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);try{let s=await $(e.env.KV,t,"pending");if(s.length===0)return e.json({success:!0,data:{generated:0,channelId:t},message:"\uC751\uB2F5\uC744 \uC0DD\uC131\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."});let r=o.settings,a=un(n),c=0,i=[],l=await q(e.env,s,r,a);for(let d of s){let p=l.get(d.id);if(p)try{await C(e.env.KV,t,d.id,{status:"generated",replyText:p,generatedAt:new Date().toISOString()}),c++}catch(m){console.error(`Update error for ${d.id}:`,m),i.push(`${d.id}: ${m instanceof Error?m.message:"Update failed"}`)}else i.push(`${d.id}: \uC751\uB2F5 \uC0DD\uC131 \uC2E4\uD328`)}return e.json({success:!0,data:{generated:c,total:s.length,errors:i.length>0?i:void 0,channelId:t},message:`${c}\uAC1C\uC758 \uC751\uB2F5\uC744 \uC0DD\uC131\uD588\uC2B5\uB2C8\uB2E4. \uD655\uC778 \uD6C4 \uC2B9\uC778\uD574\uC8FC\uC138\uC694.`})}catch(s){return console.error("Generate error:",s),e.json({success:!1,error:s instanceof Error?s.message:"Failed to generate replies"},500)}});v.put("/:id/comments/:commentId/reply",async e=>{let t=e.req.param("id"),n=e.req.param("commentId"),o=e.get("user"),s=await h(e.env.KV,t);if(!s)return e.json({success:!1,error:"Channel not found"},404);if(s.userId!==o.id)return e.json({success:!1,error:"Access denied"},403);try{let r=await e.req.json();return!r.replyText||r.replyText.trim()===""?e.json({success:!1,error:"\uC751\uB2F5 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."},400):await P(e.env.KV,t,n)?(await C(e.env.KV,t,n,{replyText:r.replyText.trim(),generatedAt:new Date().toISOString()}),e.json({success:!0,message:"\uC751\uB2F5\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})):e.json({success:!1,error:"\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404)}catch(r){return console.error(`Edit reply error for ${n}:`,r),e.json({success:!1,error:r instanceof Error?r.message:"Failed to edit reply"},500)}});v.delete("/:id/comments/:commentId/reply",async e=>{let t=e.req.param("id"),n=e.req.param("commentId"),o=e.get("user"),s=await h(e.env.KV,t);if(!s)return e.json({success:!1,error:"Channel not found"},404);if(s.userId!==o.id)return e.json({success:!1,error:"Access denied"},403);try{return await P(e.env.KV,t,n)?(await C(e.env.KV,t,n,{status:"pending",replyText:void 0,generatedAt:void 0}),e.json({success:!0,message:'\uC751\uB2F5\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB313\uAE00\uC774 "\uBBF8\uC751\uB2F5" \uC0C1\uD0DC\uB85C \uB3CC\uC544\uAC14\uC2B5\uB2C8\uB2E4.'})):e.json({success:!1,error:"\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404)}catch(r){return console.error(`Delete reply error for ${n}:`,r),e.json({success:!1,error:r instanceof Error?r.message:"Failed to delete reply"},500)}});v.post("/:id/comments/:commentId/approve",async e=>{let t=e.req.param("id"),n=e.req.param("commentId"),o=e.get("user"),s=await h(e.env.KV,t);if(!s)return e.json({success:!1,error:"Channel not found"},404);if(s.userId!==o.id)return e.json({success:!1,error:"Access denied"},403);try{let r=await P(e.env.KV,t,n);return r?r.status!=="generated"?e.json({success:!1,error:"\uC0DD\uC131\uB41C \uC751\uB2F5\uC774 \uC788\uB294 \uB313\uAE00\uB9CC \uC2B9\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."},400):r.replyText?(await L(e.env,r.id,r.replyText,s),await C(e.env.KV,t,n,{status:"replied",repliedAt:new Date().toISOString()}),e.json({success:!0,message:"\uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."})):e.json({success:!1,error:"\uC0DD\uC131\uB41C \uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."},400):e.json({success:!1,error:"\uC2B9\uC778\uD560 \uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."},404)}catch(r){return console.error(`Approve error for ${n}:`,r),e.json({success:!1,error:r instanceof Error?r.message:"Failed to approve comment"},500)}});v.post("/:id/approve-all",async e=>{let t=e.req.param("id"),n=e.get("user"),o=await h(e.env.KV,t);if(!o)return e.json({success:!1,error:"Channel not found"},404);if(o.userId!==n.id)return e.json({success:!1,error:"Access denied"},403);try{let s=await $(e.env.KV,t,"generated");if(s.length===0)return e.json({success:!0,data:{approved:0,channelId:t},message:"\uC2B9\uC778\uD560 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."});let r=0,a=[];for(let c of s)try{if(!c.replyText)continue;await L(e.env,c.id,c.replyText,o),await C(e.env.KV,t,c.id,{status:"replied",repliedAt:new Date().toISOString()}),r++}catch(i){console.error(`Approve error for ${c.id}:`,i),a.push(`${c.id}: ${i instanceof Error?i.message:"Unknown error"}`)}return await A(e.env.KV,t,{lastApprovedAt:new Date().toISOString()}),e.json({success:!0,data:{approved:r,total:s.length,errors:a.length>0?a:void 0,channelId:t},message:`${r}\uAC1C\uC758 \uB313\uAE00\uC774 YouTube\uC5D0 \uAC8C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`})}catch(s){return console.error("Approve-all error:",s),e.json({success:!1,error:s instanceof Error?s.message:"Failed to approve comments"},500)}});var mn=v;we();function gn(e,t,n="Asia/Seoul"){if(!e||!t)return!1;let o=new Date,a=new Intl.DateTimeFormat("en-US",{timeZone:n,hour:"2-digit",minute:"2-digit",hour12:!1}).format(o).split(":"),c=parseInt(a[0]||"0",10)*60+parseInt(a[1]||"0",10),i=e.split(":"),l=parseInt(i[0]||"0",10)*60+parseInt(i[1]||"0",10),d=t.split(":"),p=parseInt(d[0]||"0",10)*60+parseInt(d[1]||"0",10);return l>p?c>=l||c<p:c>=l&&c<p}function ko(e,t){let n=new Date,r=new Intl.DateTimeFormat("en-US",{timeZone:t,hour:"2-digit",minute:"2-digit",hour12:!1}).format(n).split(":"),a=parseInt(r[0]||"0",10),c=parseInt(r[1]||"0",10),i=a*60+c;for(let l of e){let d=l.split(":"),p=parseInt(d[0]||"0",10),m=parseInt(d[1]||"0",10),g=p*60+m,u=Math.abs(i-g);if(u<=15||u>=24*60-15)return!0}return!1}async function fn(e,t){if(t.needsReauth)return console.log(`[${t.youtube.channelTitle}] Needs re-auth, skipping`),null;let n=new Date(t.youtube.expiresAt),o=new Date;if(n.getTime()-o.getTime()<5*60*1e3){console.log(`[${t.youtube.channelTitle}] Refreshing token...`);try{let s=await Ge(e,t.youtube.refreshToken),r={...t,youtube:{...t.youtube,accessToken:s.accessToken,expiresAt:s.expiresAt},needsReauth:!1,lastError:void 0};return await A(e.KV,t.id,{youtube:r.youtube,needsReauth:!1,lastError:void 0}),r}catch(s){let r=s instanceof Error?s.message:"Unknown error";return console.error(`[${t.youtube.channelTitle}] Token refresh failed: ${r}`),await A(e.KV,t.id,{needsReauth:!0,lastError:`\uD1A0\uD070 \uAC31\uC2E0 \uC2E4\uD328: ${r}`,isActive:!1}),null}}return t}async function To(e,t){let n={fetched:0,classified:0,generated:0};try{if(gn(t.schedule.pauseStart,t.schedule.pauseEnd,t.schedule.timezone))return console.log(`[${t.youtube.channelTitle}] In pause time, skipping fetch`),n.skipped="pause_time",n;let o=await fn(e,t);if(!o)return n.skipped="needs_reauth",n;t=o,console.log(`[${t.youtube.channelTitle}] Fetching comments...`);let s=await te(e,t);for(let i of s){if(await xe(e.KV,t.id,i.id))continue;let l={...i,channelId:t.id,status:"unclassified",fetchedAt:new Date().toISOString()};await ye(e.KV,t.id,l),n.fetched++}console.log(`[${t.youtube.channelTitle}] Fetched ${n.fetched} new comments`);let r=await $(e.KV,t.id,"unclassified");for(let i of r)try{let l=await M(e,i.text);await C(e.KV,t.id,i.id,{type:l.type,attitude:t.settings.attitudeMap[l.type],status:"pending"}),n.classified++}catch(l){console.error(`[${t.youtube.channelTitle}] Failed to classify ${i.id}:`,l)}console.log(`[${t.youtube.channelTitle}] Classified ${n.classified} comments`);let c=(await $(e.KV,t.id,"pending")).filter(i=>{let l=i.type||"other",d=t.settings.typeInstructions?.[l];return!d||d.enabled!==!1});if(c.length>0){let i=await q(e,c,t.settings);for(let[l,d]of i)await C(e.KV,t.id,l,{status:"generated",replyText:d,generatedAt:new Date().toISOString()}),n.generated++}console.log(`[${t.youtube.channelTitle}] Generated ${n.generated} replies`),await A(e.KV,t.id,{lastFetchedAt:new Date().toISOString()})}catch(o){console.error(`[${t.youtube.channelTitle}] Process failed:`,o)}return n}async function Io(e,t){let n=0;try{if(gn(t.schedule.pauseStart,t.schedule.pauseEnd,t.schedule.timezone))return console.log(`[${t.youtube.channelTitle}] In pause time, skipping approve`),0;let o=await fn(e,t);if(!o)return 0;t=o;let s=await $(e.KV,t.id,"generated");if(s.length===0)return 0;let r=new Date,a=t.schedule.approveAfterHours,c=s.filter(i=>{if(!a||!i.generatedAt)return!0;let l=new Date(i.generatedAt);return(r.getTime()-l.getTime())/(1e3*60*60)>=a});if(c.length===0)return console.log(`[${t.youtube.channelTitle}] No comments ready for approval (${s.length} waiting for ${a}h)`),0;console.log(`[${t.youtube.channelTitle}] Approving ${c.length}/${s.length} replies...`);for(let i of c)if(i.replyText)try{await Xe(e,t,i.id,i.replyText),await C(e.KV,t.id,i.id,{status:"replied",repliedAt:new Date().toISOString()}),n++,await new Promise(l=>setTimeout(l,1e3))}catch(l){console.error(`[${t.youtube.channelTitle}] Failed to post reply for ${i.id}:`,l)}await A(e.KV,t.id,{lastApprovedAt:new Date().toISOString()}),console.log(`[${t.youtube.channelTitle}] Approved ${n} replies`)}catch(o){console.error(`[${t.youtube.channelTitle}] Approve failed:`,o)}return n}async function hn(e){console.log("=== Fetch Schedule Started ===");let t=await Ye(e.KV);console.log(`Found ${t.length} active channels`);for(let n of t){let o=new Date,s=n.lastFetchedAt?new Date(n.lastFetchedAt):null,r=!0;if(s){let a=(o.getTime()-s.getTime())/6e4;switch(n.schedule.fetchInterval){case"every15min":r=a>=14;break;case"every30min":r=a>=29;break;case"hourly":default:r=a>=59;break}}r?await To(e,n):console.log(`[${n.youtube.channelTitle}] Skipping (not due yet)`)}console.log("=== Fetch Schedule Completed ===")}async function bn(e){console.log("=== Approve Schedule Started ===");let t=await Ye(e.KV);console.log(`Found ${t.length} active channels`);for(let n of t){if(!n.schedule.autoApprove){console.log(`[${n.youtube.channelTitle}] Auto-approve disabled, skipping`);continue}if(!ko(n.schedule.approveTimes,n.schedule.timezone)){console.log(`[${n.youtube.channelTitle}] Not approve time, skipping`);continue}if(n.lastApprovedAt){let o=new Date(n.lastApprovedAt);if((new Date().getTime()-o.getTime())/(1e3*60)<30){console.log(`[${n.youtube.channelTitle}] Already approved recently, skipping`);continue}}await Io(e,n)}console.log("=== Approve Schedule Completed ===")}var Ie=new k;Ie.use("*",async(e,t)=>{let n=e.req.header("X-Cron-Secret"),o=e.env.JWT_SECRET;return!n||n!==o?e.json({success:!1,error:"Unauthorized"},401):t()});Ie.post("/fetch",async e=>{console.log("Schedule API: fetch called");try{return await hn(e.env),e.json({success:!0,message:"Fetch schedule completed"})}catch(t){return console.error("Fetch schedule error:",t),e.json({success:!1,error:t instanceof Error?t.message:"Unknown error"},500)}});Ie.post("/approve",async e=>{console.log("Schedule API: approve called");try{return await bn(e.env),e.json({success:!0,message:"Approve schedule completed"})}catch(t){return console.error("Approve schedule error:",t),e.json({success:!1,error:t instanceof Error?t.message:"Unknown error"},500)}});var yn=Ie;async function vn(e,t){let{currentChannel:n,userChannels:o=[],user:s}=t||{},r=n?await ve(e.KV,n.id):await fe(e.KV),a=n?await Ht(e.KV,n.id):await ee(e.KV),c=!!s?.openrouterApiKey;return`<!DOCTYPE html>
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
            <span>${n?xn(n.youtube.channelTitle):"\uCC44\uB110 \uC120\uD0DD"}</span>
            <span class="arrow">\u25BC</span>
          </button>
          <div class="channel-dropdown" id="channelDropdown">
            <div class="channel-dropdown-header">\uB0B4 \uCC44\uB110</div>
            ${o.length>0?o.map(i=>`
              <a href="/channels/${i.id}" class="channel-dropdown-item ${n?.id===i.id?"active":""}">
                <span class="icon">\u{1F3AC}</span>
                <div class="info">
                  <div class="name">${xn(i.youtube.channelTitle)}</div>
                  <div class="stats">${i.isActive?"\uD65C\uC131":"\uBE44\uD65C\uC131"}</div>
                </div>
              </a>
            `).join(""):`
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
          \uB9C8\uC9C0\uB9C9 \uB3D9\uAE30\uD654: ${a?new Date(a).toLocaleString("ko-KR"):"\uC5C6\uC74C"}
        </span>
        <a href="/settings" class="btn-oauth" title="\uACC4\uC815 \uC124\uC815 (API Key, \uD504\uB85C\uD544)">\u2699\uFE0F \uACC4\uC815</a>
        <button onclick="logout()" class="btn-oauth" style="background: transparent; border: 1px solid #333; cursor: pointer;">\u{1F6AA} \uB85C\uADF8\uC544\uC6C3</button>
      </div>
    </header>

    ${c?"":`
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
    `}

    <!-- \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC548\uB0B4 -->
    <div class="workflow-guide">
      <div class="workflow-step ${r.total===0?"current":"done"}">
        <span class="step-num">1</span>
        <span class="step-label">\uB313\uAE00 \uAC00\uC838\uC624\uAE30</span>
        ${r.total>0?`<span class="step-count">${r.total}\uAC1C</span>`:""}
      </div>
      <div class="workflow-arrow">\u2192</div>
      <div class="workflow-step ${r.total>0&&r.unclassified>0?"current":r.unclassified===0&&r.total>0?"done":""}">
        <span class="step-num">2</span>
        <span class="step-label">\uBD84\uB958</span>
        ${r.unclassified>0?`<span class="step-count warning">${r.unclassified}\uAC1C \uB300\uAE30</span>`:""}
      </div>
      <div class="workflow-arrow">\u2192</div>
      <div class="workflow-step ${r.pending>0?"current":r.generated>0||r.replied>0?"done":""}">
        <span class="step-num">3</span>
        <span class="step-label">\uC751\uB2F5 \uC0DD\uC131</span>
        ${r.pending>0?`<span class="step-count warning">${r.pending}\uAC1C \uB300\uAE30</span>`:""}
      </div>
      <div class="workflow-arrow">\u2192</div>
      <div class="workflow-step ${r.generated>0?"current":r.replied>0?"done":""}">
        <span class="step-num">4</span>
        <span class="step-label">\uC2B9\uC778</span>
        ${r.generated>0?`<span class="step-count warning">${r.generated}\uAC1C \uB300\uAE30</span>`:""}
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <h3>\uC804\uCCB4 \uB313\uAE00</h3>
        <div class="value">${r.total}</div>
      </div>
      <div class="stat-card">
        <h3>\uBBF8\uBD84\uB958</h3>
        <div class="value unclassified">${r.unclassified}</div>
      </div>
      <div class="stat-card">
        <h3>\uBBF8\uC751\uB2F5</h3>
        <div class="value pending">${r.pending}</div>
      </div>
      <div class="stat-card">
        <h3>\uC2B9\uC778\uB300\uAE30</h3>
        <div class="value generated">${r.generated}</div>
      </div>
      <div class="stat-card">
        <h3>\uC751\uB2F5\uC644\uB8CC</h3>
        <div class="value replied">${r.replied}</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-fetch" id="fetchBtn" onclick="fetchComments()">
        \u{1F4E5} \uB313\uAE00 \uAC00\uC838\uC624\uAE30
        <span class="loading" id="fetchLoading">\u23F3</span>
      </button>
      <button class="btn-classify" id="classifyBtn" onclick="classifyComments()" ${c?"":'disabled title="API Key\uB97C \uBA3C\uC800 \uC124\uC815\uD558\uC138\uC694"'}>
        \u{1F3F7}\uFE0F \uC790\uB3D9 \uBD84\uB958
        <span class="loading" id="classifyLoading">\u23F3</span>
      </button>
      <button class="btn-generate" id="generateBtn" onclick="generateReplies()" ${c?"":'disabled title="API Key\uB97C \uBA3C\uC800 \uC124\uC815\uD558\uC138\uC694"'}>
        \u270D\uFE0F \uC751\uB2F5 \uC0DD\uC131
        <span class="loading" id="generateLoading">\u23F3</span>
      </button>
      <button class="btn-approve" id="approveAllBtn" onclick="approveAll()">
        \u2705 \uC804\uCCB4 \uC2B9\uC778
        <span class="loading" id="approveAllLoading">\u23F3</span>
      </button>
    </div>

    <!-- \uC2B9\uC778 \uB300\uAE30 \uC139\uC158 -->
    <div class="pending-approval-section" id="pendingApprovalSection" style="display: ${r.generated>0?"block":"none"};">
      <div class="pending-approval-header">
        <h2>
          \u23F3 \uC2B9\uC778 \uB300\uAE30 \uC911
          <span class="count" id="pendingCount">${r.generated}</span>
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
    const channelId = '${n?.id||""}';

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
</html>`}function xn(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function wn(){return`<!DOCTYPE html>
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

        // HTTP \uC5D0\uB7EC \uCCB4\uD06C
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          showError(errorData.error || '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. (HTTP ' + res.status + ')');
          return;
        }

        const data = await res.json();

        if (data.success && data.token) {
          // \uD1A0\uD070 \uC800\uC7A5
          try {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (storageErr) {
            console.error('localStorage \uC800\uC7A5 \uC2E4\uD328:', storageErr);
            // localStorage \uC2E4\uD328\uD574\uB3C4 \uCFE0\uD0A4\uB85C \uC9C4\uD589
          }

          // \uCFE0\uD0A4\uC5D0\uB3C4 \uC800\uC7A5 (\uB300\uC2DC\uBCF4\uB4DC \uC811\uADFC\uC6A9)
          document.cookie = 'token=' + data.token + '; path=/; max-age=' + (7 * 24 * 60 * 60) + '; SameSite=Lax';

          showSuccess('\uB85C\uADF8\uC778 \uC131\uACF5! \uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4...');

          // \uC989\uC2DC \uC774\uB3D9 \uC2DC\uB3C4, \uC2E4\uD328 \uC2DC 1\uCD08 \uD6C4 \uC7AC\uC2DC\uB3C4
          setTimeout(() => {
            window.location.href = '/channels';
          }, 500);
        } else {
          showError(data.error || '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
      } catch (err) {
        console.error('\uB85C\uADF8\uC778 \uC5D0\uB7EC:', err);
        showError('\uC11C\uBC84 \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. (' + (err.message || '\uC54C \uC218 \uC5C6\uB294 \uC624\uB958') + ')');
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

        // HTTP \uC5D0\uB7EC \uCCB4\uD06C
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          showError(errorData.error || '\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. (HTTP ' + res.status + ')');
          return;
        }

        const data = await res.json();

        if (data.success && data.token) {
          // \uD1A0\uD070 \uC800\uC7A5
          try {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (storageErr) {
            console.error('localStorage \uC800\uC7A5 \uC2E4\uD328:', storageErr);
          }

          // \uCFE0\uD0A4\uC5D0\uB3C4 \uC800\uC7A5
          document.cookie = 'token=' + data.token + '; path=/; max-age=' + (7 * 24 * 60 * 60) + '; SameSite=Lax';

          showSuccess('\uD68C\uC6D0\uAC00\uC785 \uC131\uACF5! \uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4...');
          setTimeout(() => {
            window.location.href = '/channels';
          }, 500);
        } else {
          showError(data.error || '\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
      } catch (err) {
        console.error('\uD68C\uC6D0\uAC00\uC785 \uC5D0\uB7EC:', err);
        showError('\uC11C\uBC84 \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. (' + (err.message || '\uC54C \uC218 \uC5C6\uB294 \uC624\uB958') + ')');
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
</html>`}function kn(e,t){let n=!!e.openrouterApiKey;return`<!DOCTYPE html>
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
        <p class="welcome">\u{1F44B} ${st(e.name)}\uB2D8, \uD658\uC601\uD569\uB2C8\uB2E4</p>
      </div>
      <div class="header-right">
        <a href="/channels" class="nav-link active">\u{1F4CB} \uCC44\uB110 \uBAA9\uB85D</a>
        <a href="/settings" class="nav-link">\u2699\uFE0F \uACC4\uC815 \uC124\uC815</a>
        <button onclick="logout()" class="btn btn-danger">\u{1F6AA} \uB85C\uADF8\uC544\uC6C3</button>
      </div>
    </header>

    ${n?`
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
    `:`
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
    `}

    <h2 class="section-title">\u{1F4FA} \uB0B4 \uCC44\uB110</h2>

    ${t.length===0?`
    <!-- \uCCAB \uBC29\uBB38 \uC628\uBCF4\uB529 \uAC00\uC774\uB4DC -->
    <div class="onboarding-guide">
      <div class="onboarding-header">
        <h2>\u{1F680} \uC2DC\uC791\uD558\uAE30</h2>
        <p>3\uB2E8\uACC4\uB9CC \uC644\uB8CC\uD558\uBA74 YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4</p>
      </div>

      <div class="onboarding-steps">
        <div class="step ${n?"completed":"current"}">
          <div class="step-number">${n?"\u2713":"1"}</div>
          <div class="step-content">
            <h3>OpenRouter API Key \uC124\uC815</h3>
            <p>AI \uBD84\uB958 \uBC0F \uC751\uB2F5 \uC0DD\uC131\uC5D0 \uD544\uC694\uD569\uB2C8\uB2E4</p>
            ${n?'<span class="step-done">\uC644\uB8CC\uB428</span>':'<a href="/settings" class="btn btn-primary btn-sm">\uC124\uC815\uD558\uB7EC \uAC00\uAE30</a>'}
          </div>
        </div>

        <div class="step-connector ${n?"":"disabled"}"></div>

        <div class="step ${n?"current":"disabled"}">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>YouTube \uCC44\uB110 \uC5F0\uB3D9</h3>
            <p>\uB313\uAE00\uC744 \uAC00\uC838\uC62C \uCC44\uB110\uC744 \uC5F0\uACB0\uD569\uB2C8\uB2E4</p>
            ${n?'<a href="/oauth/start" class="btn btn-primary btn-sm">\uCC44\uB110 \uC5F0\uB3D9\uD558\uAE30</a>':'<span class="step-locked">\u{1F512} 1\uB2E8\uACC4\uB97C \uBA3C\uC800 \uC644\uB8CC\uD558\uC138\uC694</span>'}
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
    `:`
    <div class="channels-grid">
      ${t.map(o=>`
        <a href="/channels/${o.id}" class="channel-card">
          <div class="channel-header">
            <div class="channel-info">
              <h3>\u{1F3AC} ${st(o.youtube.channelTitle)}</h3>
              <span class="channel-id">${o.youtube.channelId}</span>
            </div>
            <span class="channel-status ${o.isActive?"active":"inactive"}">
              ${o.isActive?"\uD65C\uC131":"\uBE44\uD65C\uC131"}
            </span>
          </div>
          <div class="channel-stats">
            <div class="stat-item">
              <div class="label">\uBBF8\uC751\uB2F5</div>
              <div class="value pending">${o.stats?.pending||0}</div>
            </div>
            <div class="stat-item">
              <div class="label">\uC2B9\uC778\uB300\uAE30</div>
              <div class="value generated">${o.stats?.generated||0}</div>
            </div>
          </div>
          <div class="channel-schedule">
            <span>\u23F0 ${An(o.schedule.fetchInterval)}</span>
            ${o.schedule.autoApprove?'<span style="margin-left: 12px;">\u{1F916} \uC790\uB3D9\uC2B9\uC778</span>':'<span style="margin-left: 12px;">\u270B \uC218\uB3D9\uC2B9\uC778</span>'}
          </div>
        </a>
      `).join("")}

      <a href="/oauth/start" class="channel-card add-new">
        <span class="icon">+</span>
        <span>\uCC44\uB110 \uCD94\uAC00\uD558\uAE30</span>
      </a>
    </div>

    ${t.length>0?`
    <h2 class="section-title">\u23F0 \uC790\uB3D9\uD654 \uD604\uD669</h2>
    <div class="automation-section">
      <div class="automation-list">
        ${t.map(o=>`
          <div class="automation-item">
            <div>
              <span class="channel-name">${st(o.youtube.channelTitle)}</span>
              <span class="schedule-info">
                \u2022 ${An(o.schedule.fetchInterval)} \uC218\uC9D1
                ${o.schedule.autoApprove?`, ${o.schedule.approveTimes.join("/")} \uC2B9\uC778`:", \uC218\uB3D9 \uC2B9\uC778"}
              </span>
            </div>
            <span class="status-badge ${o.isActive?"running":"paused"}">
              ${o.isActive?"\uC2E4\uD589 \uC911":"\uC77C\uC2DC\uC815\uC9C0"}
            </span>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}
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
</html>`}function st(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function An(e){return{hourly:"\uB9E4\uC2DC\uAC04",every30min:"30\uBD84\uB9C8\uB2E4",every15min:"15\uBD84\uB9C8\uB2E4"}[e]||e}function Tn(e){let{user:t,userChannels:n}=e,o=!!t.openrouterApiKey,s=o?t.openrouterApiKey.slice(0,8)+"..."+t.openrouterApiKey.slice(-4):"";return`<!DOCTYPE html>
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
            ${n.map(r=>`
              <a href="/channels/${r.id}" class="dropdown-item">
                <span class="channel-icon">\u{1F4FA}</span>
                <span class="channel-name">${rt(r.youtube.channelTitle)}</span>
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
          <span class="value ${o?"":"none"}" id="currentKeyDisplay">
            ${o?s:"\uC124\uC815\uB418\uC9C0 \uC54A\uC74C"}
          </span>
        </div>
        <div class="actions">
          ${o?`
            <button class="btn btn-sm btn-text" onclick="toggleApiKeyForm()">\uBCC0\uACBD</button>
            <button class="btn btn-sm btn-text danger" onclick="removeApiKey()">\uC0AD\uC81C</button>
          `:`
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
          <span class="value">${rt(t.name)}</span>
        </div>
        <div class="profile-row">
          <span class="label">\uC774\uBA54\uC77C</span>
          <span class="value">${rt(t.email)}</span>
        </div>
        <div class="profile-row">
          <span class="label">\uAC00\uC785\uC77C</span>
          <span class="value">${Co(t.createdAt)}</span>
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
</html>`}function rt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Co(e){return new Date(e).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"})}function In(e="https://autonomey.com"){return`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 AI | Autonomey - \uB313\uAE00 \uAD00\uB9AC \uC790\uB3D9\uD654 \uC2DC\uC2A4\uD15C</title>
  <meta name="title" content="\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 AI | Autonomey - \uB313\uAE00 \uAD00\uB9AC \uC790\uB3D9\uD654 \uC2DC\uC2A4\uD15C">
  <meta name="description" content="AI\uAC00 \uB2F9\uC2E0\uC758 \uCC44\uB110 \uD1A4\uC5D0 \uB9DE\uCDB0 YouTube \uB313\uAE00\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC751\uB2F5\uD569\uB2C8\uB2E4. \uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9 \uD504\uB85C\uC81D\uD2B8\uC785\uB2C8\uB2E4. \uBB34\uB8CC\uB85C \uC0AC\uC6A9\uD558\uC138\uC694.">
  <meta name="keywords" content="\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5, YouTube \uB313\uAE00 \uBD07, \uB313\uAE00 \uC790\uB3D9\uD654, AI \uB313\uAE00 \uAD00\uB9AC, \uC720\uD29C\uBE0C \uC790\uB3D9 \uC751\uB2F5 \uC2DC\uC2A4\uD15C, \uB313\uAE00 \uBD07, \uC720\uD29C\uBC84 \uB3C4\uAD6C, \uCC44\uB110 \uAD00\uB9AC, \uB313\uAE00 \uC790\uB3D9 \uBD84\uB958, AI \uC751\uB2F5 \uC0DD\uC131, \uC720\uD29C\uBE0C \uB9C8\uCF00\uD305 \uC790\uB3D9\uD654, \uD06C\uB9AC\uC5D0\uC774\uD130 \uB3C4\uAD6C">
  <meta name="author" content="Autonomey">
  <meta name="robots" content="index, follow">
  <meta name="googlebot" content="index, follow">
  <link rel="canonical" href="${e}/">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${e}/">
  <meta property="og:title" content="\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 AI | Autonomey">
  <meta property="og:description" content="AI\uAC00 \uB2F9\uC2E0\uC758 \uCC44\uB110 \uD1A4\uC5D0 \uB9DE\uCDB0 YouTube \uB313\uAE00\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC751\uB2F5\uD569\uB2C8\uB2E4. \uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9 \uD504\uB85C\uC81D\uD2B8\uC785\uB2C8\uB2E4.">
  <meta property="og:image" content="${e}/og-image.png">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:site_name" content="Autonomey">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${e}/">
  <meta property="twitter:title" content="\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 AI | Autonomey">
  <meta property="twitter:description" content="AI\uAC00 \uB2F9\uC2E0\uC758 \uCC44\uB110 \uD1A4\uC5D0 \uB9DE\uCDB0 YouTube \uB313\uAE00\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC751\uB2F5\uD569\uB2C8\uB2E4. \uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9 \uD504\uB85C\uC81D\uD2B8\uC785\uB2C8\uB2E4.">
  <meta property="twitter:image" content="${e}/og-image.png">

  <!-- Naver \uAC80\uC0C9 \uCD5C\uC801\uD654 -->
  <meta name="naver-site-verification" content="">

  <!-- Schema.org \uAD6C\uC870\uD654 \uB370\uC774\uD130 -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Autonomey",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI \uAE30\uBC18 \uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uC2DC\uC2A4\uD15C. \uB313\uAE00 \uBD84\uB958, \uB9DE\uCDA4 \uC751\uB2F5 \uC0DD\uC131, \uC790\uB3D9 \uAC8C\uC2DC \uAE30\uB2A5 \uC81C\uACF5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW",
      "description": "\uC720\uD29C\uBE0C \uCF58\uD150\uCE20\uC6A9 \uBB34\uB8CC \uD504\uB85C\uC81D\uD2B8"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "50"
    },
    "featureList": [
      "AI \uB313\uAE00 \uC790\uB3D9 \uBD84\uB958",
      "\uB9DE\uCDA4\uD615 \uC751\uB2F5 \uC0DD\uC131",
      "\uB2E4\uCC44\uB110 \uAD00\uB9AC",
      "\uC790\uB3D9 \uC2A4\uCF00\uC904\uB9C1",
      "\uAC80\uD1A0 \uD6C4 \uAC8C\uC2DC"
    ]
  }
  <\/script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Autonomey",
    "url": "${e}",
    "logo": "${e}/logo.png",
    "description": "\uC720\uD29C\uBC84\uB97C \uC704\uD55C AI \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uC11C\uBE44\uC2A4",
    "sameAs": [
      "https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4"
    ]
  }
  <\/script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "API Key\uB294 \uC5B4\uB5BB\uAC8C \uBC1C\uAE09\uBC1B\uB098\uC694?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "OpenRouter (openrouter.ai)\uC5D0\uC11C \uBB34\uB8CC \uAC00\uC785 \uD6C4 API Key\uB97C \uBC1C\uAE09\uBC1B\uC73C\uC2DC\uBA74 \uB429\uB2C8\uB2E4. \uBB34\uB8CC \uBAA8\uB378\uC744 \uC120\uD0DD\uD558\uBA74 API \uBE44\uC6A9 \uC5C6\uC774 \uC2DC\uC791\uD560 \uC218 \uC788\uC5B4\uC694!"
        }
      },
      {
        "@type": "Question",
        "name": "\uB0B4 \uCC44\uB110 \uC815\uBCF4\uAC00 \uC548\uC804\uD55C\uAC00\uC694?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "YouTube OAuth 2.0\uC73C\uB85C \uC548\uC804\uD558\uAC8C \uC5F0\uB3D9\uB429\uB2C8\uB2E4. \uBE44\uBC00\uBC88\uD638\uB97C \uC800\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC5B8\uC81C\uB4E0 Google \uACC4\uC815 \uC124\uC815\uC5D0\uC11C \uC5F0\uB3D9\uC744 \uD574\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
        }
      },
      {
        "@type": "Question",
        "name": "AI \uC751\uB2F5\uC774 \uB9C8\uC74C\uC5D0 \uC548 \uB4E4\uBA74\uC694?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "\uAC80\uD1A0 \uD6C4 \uAC8C\uC2DC \uAE30\uB2A5\uC73C\uB85C \uC751\uB2F5\uC744 \uD655\uC778/\uC218\uC815\uD55C \uB4A4 \uC2B9\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB9C8\uC74C\uC5D0 \uC548 \uB4DC\uB294 \uC751\uB2F5\uC740 \uC0AD\uC81C\uD558\uAC70\uB098 \uC9C1\uC811 \uC218\uC815\uD558\uC138\uC694."
        }
      },
      {
        "@type": "Question",
        "name": "\uC5EC\uB7EC \uCC44\uB110\uC744 \uC6B4\uC601\uD558\uB294\uB370\uC694?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "\uC5EC\uB7EC \uCC44\uB110\uC744 \uC5F0\uB3D9\uD558\uACE0 \uAC01 \uCC44\uB110\uBCC4\uB85C \uB2E4\uB978 \uC751\uB2F5 \uC2A4\uD0C0\uC77C\uC744 \uC124\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
        }
      },
      {
        "@type": "Question",
        "name": "\uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD558\uB098\uC694?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "\uC11C\uBE44\uC2A4 \uC790\uCCB4\uB294 \uBB34\uB8CC\uC785\uB2C8\uB2E4. \uB2E4\uB9CC AI \uC751\uB2F5 \uC0DD\uC131\uC744 \uC704\uD574 OpenRouter API\uB97C \uC0AC\uC6A9\uD558\uBA70, API \uC0AC\uC6A9\uB7C9\uC5D0 \uB530\uB77C \uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD569\uB2C8\uB2E4. \uB313\uAE00 1,000\uAC1C \uCC98\uB9AC \uC2DC \uC57D $0.5 \uC218\uC900\uC785\uB2C8\uB2E4."
        }
      }
    ]
  }
  <\/script>

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
        <div class="hero-badge">\u{1F3AC} \uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9 \uD504\uB85C\uC81D\uD2B8</div>
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
          <span><span class="check">\u2713</span> \uC11C\uBE44\uC2A4 \uBB34\uB8CC</span>
          <span><span class="check">\u2713</span> API \uBE44\uC6A9\uB9CC \uBCC4\uB3C4</span>
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
            <span class="hint">\u{1F4A1} \uBB34\uB8CC \uBAA8\uB378\uB85C \uC2DC\uC791 \uAC00\uB2A5</span>
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

  <!-- API \uBE44\uC6A9 \uC548\uB0B4 Section -->
  <section class="pricing" id="api-cost">
    <div class="container">
      <div class="section-title">
        <h2>\u{1F4A1} \uBE44\uC6A9 \uC548\uB0B4</h2>
        <p>\uC11C\uBE44\uC2A4\uB294 \uBB34\uB8CC, API \uC5F0\uB3D9 \uBE44\uC6A9\uB9CC \uBCF8\uC778 \uBD80\uB2F4</p>
      </div>
      <div class="pricing-cards" style="max-width: 500px;">
        <div class="pricing-card featured">
          <div class="plan-icon">\u{1F3AC}</div>
          <h3>\uC720\uD29C\uBE0C \uCF58\uD150\uCE20\uC6A9</h3>
          <div class="price">\uBB34\uB8CC</div>
          <div class="note">\uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9 \uD504\uB85C\uC81D\uD2B8</div>
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
      </div>
      <div class="pricing-hint">
        <p>\u26A0\uFE0F AI \uC751\uB2F5 \uC0DD\uC131 \uC2DC OpenRouter API \uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD569\uB2C8\uB2E4<br>
        (\uB313\uAE00 1,000\uAC1C \uCC98\uB9AC \uC2DC \uC57D $0.5 \uC218\uC900)</p>
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
              \uBB34\uB8CC \uBAA8\uB378\uC744 \uC120\uD0DD\uD558\uBA74 API \uBE44\uC6A9 \uC5C6\uC774 \uC2DC\uC791\uD560 \uC218 \uC788\uC5B4\uC694!
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
            \uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD558\uB098\uC694?
            <span class="faq-toggle">\u25BC</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              \uC11C\uBE44\uC2A4 \uC790\uCCB4\uB294 \uBB34\uB8CC\uC785\uB2C8\uB2E4! \uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9\uC73C\uB85C \uB9CC\uB4E0 \uD504\uB85C\uC81D\uD2B8\uC608\uC694.
              \uB2E4\uB9CC AI \uC751\uB2F5 \uC0DD\uC131\uC744 \uC704\uD574 OpenRouter API\uB97C \uC0AC\uC6A9\uD558\uB294\uB370, API \uC0AC\uC6A9\uB7C9\uC5D0 \uB530\uB77C \uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD569\uB2C8\uB2E4.
              \uB313\uAE00 1,000\uAC1C \uCC98\uB9AC \uC2DC \uC57D $0.5 \uC218\uC900\uC774\uC5D0\uC694.
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
      <p style="font-size: 14px; color: #666; margin-bottom: 24px;">\uC720\uD29C\uBE0C \uCF58\uD150\uCE20 \uC81C\uC791\uC6A9 \uD504\uB85C\uC81D\uD2B8\uC785\uB2C8\uB2E4</p>
      <a href="/login" class="btn btn-primary btn-large">\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30</a>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <div class="footer-logo">\u{1F3AC} Autonomey</div>
      <div class="footer-links">
        <a href="/terms">\uC774\uC6A9\uC57D\uAD00</a>
        <a href="/privacy">\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68</a>
        <a href="mailto:autonomey.ai@gmail.com">\uBB38\uC758\uD558\uAE30</a>
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
</html>`}function Cn(){return`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68 | Autonomey</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      line-height: 1.8;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 10px;
      color: #fff;
    }
    .subtitle {
      color: #888;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 1.3rem;
      margin-top: 40px;
      margin-bottom: 15px;
      color: #fff;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    }
    p, li {
      color: #ccc;
      margin-bottom: 12px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 20px;
    }
    .highlight {
      background: #1a1a2e;
      border-left: 3px solid #3b82f6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .back-link {
      display: inline-block;
      margin-top: 40px;
      color: #3b82f6;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .update-date {
      color: #666;
      font-size: 0.9rem;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>\u{1F512} \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68</h1>
    <p class="subtitle">Autonomey (\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uC11C\uBE44\uC2A4)</p>

    <div class="highlight">
      <strong>\u{1F4A1} \uC694\uC57D:</strong> Autonomey\uB294 \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC5D0 \uD544\uC694\uD55C \uCD5C\uC18C\uD55C\uC758 \uC815\uBCF4\uB9CC \uC218\uC9D1\uD558\uBA70,
      \uC0AC\uC6A9\uC790\uC758 YouTube \uB370\uC774\uD130\uB294 \uB313\uAE00 \uC751\uB2F5 \uAE30\uB2A5 \uC678\uC5D0\uB294 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.
      \uD604\uC7AC \uBCA0\uD0C0 \uAE30\uAC04\uC73C\uB85C <strong>\uC644\uC804 \uBB34\uB8CC</strong>\uB85C \uC6B4\uC601\uB429\uB2C8\uB2E4.
    </div>

    <h2>1. \uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uD56D\uBAA9</h2>
    <p>Autonomey\uB294 \uB2E4\uC74C\uACFC \uAC19\uC740 \uC815\uBCF4\uB97C \uC218\uC9D1\uD569\uB2C8\uB2E4:</p>
    <ul>
      <li><strong>\uD68C\uC6D0 \uC815\uBCF4:</strong> \uC774\uBA54\uC77C \uC8FC\uC18C, \uC774\uB984 (\uD68C\uC6D0\uAC00\uC785 \uC2DC)</li>
      <li><strong>YouTube \uC5F0\uB3D9 \uC815\uBCF4:</strong> YouTube \uCC44\uB110 ID, \uCC44\uB110\uBA85, OAuth \uD1A0\uD070</li>
      <li><strong>\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC815\uBCF4:</strong> \uB313\uAE00 \uB370\uC774\uD130, AI \uC751\uB2F5 \uAE30\uB85D, \uC124\uC815 \uAC12</li>
    </ul>

    <h2>2. \uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBAA9\uC801</h2>
    <p>\uC218\uC9D1\uB41C \uC815\uBCF4\uB294 \uB2E4\uC74C \uBAA9\uC801\uC73C\uB85C\uB9CC \uC0AC\uC6A9\uB429\uB2C8\uB2E4:</p>
    <ul>
      <li>\uD68C\uC6D0 \uC2DD\uBCC4 \uBC0F \uC11C\uBE44\uC2A4 \uC81C\uACF5</li>
      <li>YouTube \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uAE30\uB2A5 \uC218\uD589</li>
      <li>\uC11C\uBE44\uC2A4 \uAC1C\uC120 \uBC0F \uD1B5\uACC4 \uBD84\uC11D</li>
      <li>\uACE0\uAC1D \uBB38\uC758 \uC751\uB300</li>
    </ul>

    <h2>3. \uAC1C\uC778\uC815\uBCF4 \uBCF4\uC720 \uAE30\uAC04</h2>
    <ul>
      <li>\uD68C\uC6D0 \uD0C8\uD1F4 \uC2DC \uC989\uC2DC \uC0AD\uC81C</li>
      <li>YouTube \uC5F0\uB3D9 \uD574\uC81C \uC2DC \uAD00\uB828 \uD1A0\uD070 \uC989\uC2DC \uC0AD\uC81C</li>
      <li>\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uAE30\uB85D: \uD68C\uC6D0 \uD0C8\uD1F4 \uD6C4 30\uC77C \uC774\uB0B4 \uC0AD\uC81C</li>
    </ul>

    <h2>4. \uAC1C\uC778\uC815\uBCF4 \uC81C3\uC790 \uC81C\uACF5</h2>
    <p>Autonomey\uB294 \uC0AC\uC6A9\uC790\uC758 \uAC1C\uC778\uC815\uBCF4\uB97C \uC81C3\uC790\uC5D0\uAC8C \uC81C\uACF5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E8, \uB2E4\uC74C\uC758 \uACBD\uC6B0\uB294 \uC608\uC678\uB85C \uD569\uB2C8\uB2E4:</p>
    <ul>
      <li>\uC0AC\uC6A9\uC790\uAC00 \uC0AC\uC804\uC5D0 \uB3D9\uC758\uD55C \uACBD\uC6B0</li>
      <li>\uBC95\uB839\uC5D0 \uC758\uD574 \uC694\uAD6C\uB418\uB294 \uACBD\uC6B0</li>
    </ul>

    <h2>5. \uC678\uBD80 \uC11C\uBE44\uC2A4 \uC5F0\uB3D9</h2>
    <p>Autonomey\uB294 \uB2E4\uC74C \uC678\uBD80 \uC11C\uBE44\uC2A4\uC640 \uC5F0\uB3D9\uB429\uB2C8\uB2E4:</p>
    <ul>
      <li><strong>YouTube Data API:</strong> \uB313\uAE00 \uC870\uD68C \uBC0F \uAC8C\uC2DC\uB97C \uC704\uD574 \uC0AC\uC6A9</li>
      <li><strong>OpenRouter API:</strong> AI \uC751\uB2F5 \uC0DD\uC131\uC744 \uC704\uD574 \uC0AC\uC6A9 (\uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 API Key \uC785\uB825)</li>
    </ul>
    <p>\uAC01 \uC11C\uBE44\uC2A4\uC758 \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68\uC740 \uD574\uB2F9 \uC11C\uBE44\uC2A4\uC5D0\uC11C \uD655\uC778\uD558\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.</p>

    <h2>6. \uC0AC\uC6A9\uC790 \uAD8C\uB9AC</h2>
    <p>\uC0AC\uC6A9\uC790\uB294 \uC5B8\uC81C\uB4E0\uC9C0 \uB2E4\uC74C \uAD8C\uB9AC\uB97C \uD589\uC0AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4:</p>
    <ul>
      <li>\uAC1C\uC778\uC815\uBCF4 \uC5F4\uB78C, \uC815\uC815, \uC0AD\uC81C \uC694\uCCAD</li>
      <li>YouTube \uC5F0\uB3D9 \uD574\uC81C (Google \uACC4\uC815 \uC124\uC815\uC5D0\uC11C \uAC00\uB2A5)</li>
      <li>\uD68C\uC6D0 \uD0C8\uD1F4</li>
    </ul>

    <h2>7. \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638</h2>
    <ul>
      <li>\uBE44\uBC00\uBC88\uD638\uB294 \uC548\uC804\uD55C \uD574\uC2DC \uC54C\uACE0\uB9AC\uC998\uC73C\uB85C \uC554\uD638\uD654 \uC800\uC7A5</li>
      <li>OAuth \uD1A0\uD070\uC740 \uC554\uD638\uD654\uD558\uC5EC \uBCF4\uAD00</li>
      <li>HTTPS\uB97C \uD1B5\uD55C \uC548\uC804\uD55C \uB370\uC774\uD130 \uC804\uC1A1</li>
    </ul>

    <h2>8. \uCFE0\uD0A4 \uC0AC\uC6A9</h2>
    <p>Autonomey\uB294 \uB85C\uADF8\uC778 \uC138\uC158 \uC720\uC9C0\uB97C \uC704\uD574 \uCFE0\uD0A4\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4.
    \uBE0C\uB77C\uC6B0\uC800 \uC124\uC815\uC5D0\uC11C \uCFE0\uD0A4\uB97C \uBE44\uD65C\uC131\uD654\uD560 \uC218 \uC788\uC73C\uB098, \uC774 \uACBD\uC6B0 \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC774 \uC81C\uD55C\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>

    <h2>9. \uBB38\uC758\uCC98</h2>
    <p>\uAC1C\uC778\uC815\uBCF4 \uAD00\uB828 \uBB38\uC758\uB294 \uC544\uB798\uB85C \uC5F0\uB77D\uD574\uC8FC\uC138\uC694:</p>
    <ul>
      <li><strong>\uC11C\uBE44\uC2A4 \uC81C\uACF5\uC790:</strong> AI \uC7A1\uB3CC\uC774</li>
      <li><strong>\uC774\uBA54\uC77C:</strong> oojooteam@gmail.com</li>
      <li><strong>YouTube:</strong> <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" style="color: #3b82f6;">@AI\uC7A1\uB3CC\uC774</a></li>
    </ul>

    <h2>10. \uAC1C\uC815 \uC548\uB0B4</h2>
    <p>\uBCF8 \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68\uC740 \uBC95\uB839 \uBCC0\uACBD\uC774\uB098 \uC11C\uBE44\uC2A4 \uBCC0\uACBD\uC5D0 \uB530\uB77C \uC218\uC815\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
    \uBCC0\uACBD \uC2DC \uC11C\uBE44\uC2A4 \uB0B4 \uACF5\uC9C0\uB97C \uD1B5\uD574 \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4.</p>

    <p class="update-date">\uCD5C\uC885 \uC218\uC815\uC77C: 2024\uB144 12\uC6D4 1\uC77C</p>

    <a href="/" class="back-link">\u2190 \uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
  </div>
</body>
</html>`}function En(){return`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uC11C\uBE44\uC2A4 \uC774\uC6A9\uC57D\uAD00 | Autonomey</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      line-height: 1.8;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 10px;
      color: #fff;
    }
    .subtitle {
      color: #888;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 1.3rem;
      margin-top: 40px;
      margin-bottom: 15px;
      color: #fff;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    }
    p, li {
      color: #ccc;
      margin-bottom: 12px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 20px;
    }
    .highlight {
      background: #1a2e1a;
      border-left: 3px solid #22c55e;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning {
      background: #2e2a1a;
      border-left: 3px solid #eab308;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .back-link {
      display: inline-block;
      margin-top: 40px;
      color: #3b82f6;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .update-date {
      color: #666;
      font-size: 0.9rem;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>\u{1F4CB} \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC57D\uAD00</h1>
    <p class="subtitle">Autonomey (\uC720\uD29C\uBE0C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uC11C\uBE44\uC2A4)</p>

    <div class="highlight">
      <strong>\u{1F389} \uBCA0\uD0C0 \uC11C\uBE44\uC2A4 \uC548\uB0B4:</strong> Autonomey\uB294 \uD604\uC7AC \uBCA0\uD0C0 \uD14C\uC2A4\uD2B8 \uAE30\uAC04\uC73C\uB85C,
      \uBAA8\uB4E0 \uAE30\uB2A5\uC744 <strong>\uBB34\uB8CC</strong>\uB85C \uC774\uC6A9\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
      \uC815\uC2DD \uC11C\uBE44\uC2A4 \uCD9C\uC2DC \uC2DC \uC694\uAE08 \uC815\uCC45\uC774 \uBCC0\uACBD\uB420 \uC218 \uC788\uC73C\uBA70, \uC0AC\uC804\uC5D0 \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4.
    </div>

    <h2>\uC81C1\uC870 (\uBAA9\uC801)</h2>
    <p>\uBCF8 \uC57D\uAD00\uC740 AI \uC7A1\uB3CC\uC774(\uC774\uD558 "\uC6B4\uC601\uC790")\uAC00 \uC81C\uACF5\uD558\uB294 Autonomey \uC11C\uBE44\uC2A4(\uC774\uD558 "\uC11C\uBE44\uC2A4")\uC758
    \uC774\uC6A9 \uC870\uAC74 \uBC0F \uC808\uCC28, \uC6B4\uC601\uC790\uC640 \uD68C\uC6D0 \uAC04\uC758 \uAD8C\uB9AC\xB7\uC758\uBB34 \uBC0F \uCC45\uC784\uC0AC\uD56D\uC744 \uADDC\uC815\uD568\uC744 \uBAA9\uC801\uC73C\uB85C \uD569\uB2C8\uB2E4.</p>

    <h2>\uC81C2\uC870 (\uC11C\uBE44\uC2A4 \uB0B4\uC6A9)</h2>
    <p>Autonomey\uB294 \uB2E4\uC74C\uC758 \uC11C\uBE44\uC2A4\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4:</p>
    <ul>
      <li>YouTube \uCC44\uB110 \uB313\uAE00 \uC790\uB3D9 \uC218\uC9D1</li>
      <li>AI \uAE30\uBC18 \uB313\uAE00 \uC790\uB3D9 \uBD84\uB958 (\uAE0D\uC815/\uC9C8\uBB38/\uBD80\uC815/\uC2A4\uD338)</li>
      <li>AI \uB9DE\uCDA4 \uC751\uB2F5 \uC0DD\uC131</li>
      <li>\uB313\uAE00 \uC790\uB3D9/\uC218\uB3D9 \uAC8C\uC2DC</li>
      <li>\uB2E4\uC911 \uCC44\uB110 \uAD00\uB9AC</li>
    </ul>

    <h2>\uC81C3\uC870 (\uD68C\uC6D0\uAC00\uC785)</h2>
    <ul>
      <li>\uC11C\uBE44\uC2A4 \uC774\uC6A9\uC744 \uC704\uD574\uC11C\uB294 \uD68C\uC6D0\uAC00\uC785\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.</li>
      <li>\uD68C\uC6D0\uAC00\uC785 \uC2DC \uC815\uD655\uD55C \uC815\uBCF4\uB97C \uC785\uB825\uD574\uC57C \uD569\uB2C8\uB2E4.</li>
      <li>\uD0C0\uC778\uC758 \uC815\uBCF4\uB97C \uB3C4\uC6A9\uD558\uAC70\uB098 \uD5C8\uC704 \uC815\uBCF4\uB97C \uC785\uB825\uD560 \uACBD\uC6B0 \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC774 \uC81C\uD55C\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C4\uC870 (YouTube \uC5F0\uB3D9)</h2>
    <ul>
      <li>\uC11C\uBE44\uC2A4 \uC774\uC6A9\uC744 \uC704\uD574 YouTube \uACC4\uC815 \uC5F0\uB3D9(OAuth)\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.</li>
      <li>\uC5F0\uB3D9 \uC2DC YouTube Data API\uB97C \uD1B5\uD574 \uB313\uAE00 \uC870\uD68C \uBC0F \uAC8C\uC2DC \uAD8C\uD55C\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4.</li>
      <li>\uC0AC\uC6A9\uC790\uB294 \uC5B8\uC81C\uB4E0\uC9C0 Google \uACC4\uC815 \uC124\uC815\uC5D0\uC11C \uC5F0\uB3D9\uC744 \uD574\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
      <li>YouTube \uC11C\uBE44\uC2A4 \uC57D\uAD00\uC744 \uC900\uC218\uD574\uC57C \uD569\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C5\uC870 (API Key \uC0AC\uC6A9)</h2>
    <ul>
      <li>AI \uC751\uB2F5 \uC0DD\uC131\uC744 \uC704\uD574 \uC0AC\uC6A9\uC790 \uBCF8\uC778\uC758 OpenRouter API Key\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.</li>
      <li>API Key\uB294 \uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uBC1C\uAE09\uBC1B\uC544 \uC785\uB825\uD569\uB2C8\uB2E4.</li>
      <li>API \uC0AC\uC6A9\uC5D0 \uB530\uB978 \uBE44\uC6A9\uC740 \uC0AC\uC6A9\uC790 \uBD80\uB2F4\uC785\uB2C8\uB2E4.</li>
      <li>API Key\uB294 \uC554\uD638\uD654\uD558\uC5EC \uC800\uC7A5\uB418\uBA70, \uC11C\uBE44\uC2A4 \uC81C\uACF5 \uBAA9\uC801 \uC678\uC5D0\uB294 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C6\uC870 (\uC774\uC6A9\uC790\uC758 \uC758\uBB34)</h2>
    <p>\uC774\uC6A9\uC790\uB294 \uB2E4\uC74C \uD589\uC704\uB97C \uD574\uC11C\uB294 \uC548 \uB429\uB2C8\uB2E4:</p>
    <ul>
      <li>\uC2A4\uD338\uC131 \uB313\uAE00 \uB300\uB7C9 \uAC8C\uC2DC</li>
      <li>\uD0C0\uC778\uC744 \uBE44\uBC29\uD558\uAC70\uB098 \uBA85\uC608\uB97C \uD6FC\uC190\uD558\uB294 \uB313\uAE00 \uAC8C\uC2DC</li>
      <li>\uBD88\uBC95\uC801\uC778 \uB0B4\uC6A9\uC758 \uB313\uAE00 \uAC8C\uC2DC</li>
      <li>YouTube \uCEE4\uBBA4\uB2C8\uD2F0 \uAC00\uC774\uB4DC\uB77C\uC778 \uC704\uBC18</li>
      <li>\uC11C\uBE44\uC2A4 \uC2DC\uC2A4\uD15C\uC5D0 \uB300\uD55C \uBD88\uBC95\uC801\uC778 \uC811\uADFC \uB610\uB294 \uACF5\uACA9</li>
      <li>\uD0C0\uC778\uC758 \uACC4\uC815 \uB3C4\uC6A9</li>
    </ul>

    <div class="warning">
      <strong>\u26A0\uFE0F \uC8FC\uC758:</strong> AI\uAC00 \uC0DD\uC131\uD55C \uC751\uB2F5\uC774\uB77C \uD558\uB354\uB77C\uB3C4, \uCD5C\uC885 \uAC8C\uC2DC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740
      \uD574\uB2F9 YouTube \uCC44\uB110 \uC18C\uC720\uC790(\uC0AC\uC6A9\uC790)\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4. \uAC8C\uC2DC \uC804 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.
    </div>

    <h2>\uC81C7\uC870 (\uC11C\uBE44\uC2A4 \uC81C\uD55C \uBC0F \uC911\uB2E8)</h2>
    <ul>
      <li>\uC6B4\uC601\uC790\uB294 \uB2E4\uC74C \uACBD\uC6B0 \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC744 \uC81C\uD55C\uD558\uAC70\uB098 \uC911\uB2E8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4:
        <ul>
          <li>\uBCF8 \uC57D\uAD00\uC744 \uC704\uBC18\uD55C \uACBD\uC6B0</li>
          <li>\uC2DC\uC2A4\uD15C \uC810\uAC80\uC774 \uD544\uC694\uD55C \uACBD\uC6B0</li>
          <li>\uCC9C\uC7AC\uC9C0\uBCC0, \uAD6D\uAC00\uBE44\uC0C1\uC0AC\uD0DC \uB4F1 \uBD88\uAC00\uD56D\uB825\uC801\uC778 \uACBD\uC6B0</li>
        </ul>
      </li>
      <li>\uBCA0\uD0C0 \uC11C\uBE44\uC2A4 \uD2B9\uC131\uC0C1 \uC608\uACE0 \uC5C6\uC774 \uAE30\uB2A5\uC774 \uBCC0\uACBD\uB418\uAC70\uB098 \uC11C\uBE44\uC2A4\uAC00 \uC911\uB2E8\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C8\uC870 (\uBA74\uCC45\uC870\uD56D)</h2>
    <ul>
      <li>\uC6B4\uC601\uC790\uB294 \uCC9C\uC7AC\uC9C0\uBCC0, \uC804\uC7C1 \uB4F1 \uBD88\uAC00\uD56D\uB825\uC801 \uC0AC\uC720\uB85C \uC778\uD55C \uC11C\uBE44\uC2A4 \uC911\uB2E8\uC5D0 \uB300\uD574 \uCC45\uC784\uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</li>
      <li>AI\uAC00 \uC0DD\uC131\uD55C \uC751\uB2F5\uC758 \uB0B4\uC6A9\uC5D0 \uB300\uD55C \uCD5C\uC885 \uCC45\uC784\uC740 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.</li>
      <li>YouTube API \uC815\uCC45 \uBCC0\uACBD\uC73C\uB85C \uC778\uD55C \uC11C\uBE44\uC2A4 \uC81C\uD55C\uC5D0 \uB300\uD574 \uCC45\uC784\uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</li>
      <li>\uC0AC\uC6A9\uC790\uC758 API Key \uAD00\uB9AC \uC18C\uD640\uB85C \uC778\uD55C \uBB38\uC81C\uB294 \uC0AC\uC6A9\uC790 \uCC45\uC784\uC785\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C9\uC870 (\uC800\uC791\uAD8C)</h2>
    <ul>
      <li>\uC11C\uBE44\uC2A4 \uB0B4 \uCF58\uD150\uCE20 \uBC0F \uB514\uC790\uC778\uC5D0 \uB300\uD55C \uC800\uC791\uAD8C\uC740 \uC6B4\uC601\uC790\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.</li>
      <li>\uC0AC\uC6A9\uC790\uAC00 \uC791\uC131\uD55C \uB313\uAE00\uC758 \uC800\uC791\uAD8C\uC740 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C10\uC870 (\uC57D\uAD00 \uBCC0\uACBD)</h2>
    <ul>
      <li>\uBCF8 \uC57D\uAD00\uC740 \uAD00\uB828 \uBC95\uB839 \uBCC0\uACBD\uC774\uB098 \uC11C\uBE44\uC2A4 \uC815\uCC45 \uBCC0\uACBD\uC5D0 \uB530\uB77C \uC218\uC815\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
      <li>\uC57D\uAD00 \uBCC0\uACBD \uC2DC \uC11C\uBE44\uC2A4 \uB0B4 \uACF5\uC9C0\uB97C \uD1B5\uD574 7\uC77C \uC804 \uC548\uB0B4\uD569\uB2C8\uB2E4.</li>
      <li>\uBCC0\uACBD\uB41C \uC57D\uAD00\uC5D0 \uB3D9\uC758\uD558\uC9C0 \uC54A\uB294 \uACBD\uC6B0 \uD68C\uC6D0 \uD0C8\uD1F4\uAC00 \uAC00\uB2A5\uD569\uB2C8\uB2E4.</li>
    </ul>

    <h2>\uC81C11\uC870 (\uBD84\uC7C1 \uD574\uACB0)</h2>
    <p>\uBCF8 \uC57D\uAD00\uACFC \uAD00\uB828\uD558\uC5EC \uBD84\uC7C1\uC774 \uBC1C\uC0DD\uD55C \uACBD\uC6B0, \uB300\uD55C\uBBFC\uAD6D \uBC95\uB960\uC744 \uC900\uAC70\uBC95\uC73C\uB85C \uD558\uBA70,
    \uAD00\uD560 \uBC95\uC6D0\uC740 \uC6B4\uC601\uC790\uC758 \uC18C\uC7AC\uC9C0\uB97C \uAD00\uD560\uD558\uB294 \uBC95\uC6D0\uC73C\uB85C \uD569\uB2C8\uB2E4.</p>

    <h2>\uC81C12\uC870 (\uBB38\uC758)</h2>
    <p>\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uAD00\uB828 \uBB38\uC758\uB294 \uC544\uB798\uB85C \uC5F0\uB77D\uD574\uC8FC\uC138\uC694:</p>
    <ul>
      <li><strong>\uC11C\uBE44\uC2A4 \uC6B4\uC601\uC790:</strong> AI \uC7A1\uB3CC\uC774</li>
      <li><strong>\uC774\uBA54\uC77C:</strong> oojooteam@gmail.com</li>
      <li><strong>YouTube:</strong> <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" style="color: #3b82f6;">@AI\uC7A1\uB3CC\uC774</a></li>
    </ul>

    <p class="update-date">\uC2DC\uD589\uC77C: 2024\uB144 12\uC6D4 1\uC77C</p>

    <a href="/" class="back-link">\u2190 \uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
  </div>
</body>
</html>`}var b=new k;b.use("*",St());b.use("*",It({origin:"*",credentials:!0}));b.get("/",async e=>{let t=e.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];if(t){let o=await T(t,e.env.JWT_SECRET);if(o&&await w(e.env.KV,o.userId))return e.redirect("/channels")}let n=e.env.BASE_URL||"https://autonomey.com";return e.html(In(n))});b.get("/login",e=>e.html(wn()));b.get("/health",e=>e.json({status:"ok",timestamp:new Date().toISOString()}));b.get("/privacy",e=>e.html(Cn()));b.get("/terms",e=>e.html(En()));b.route("/auth",dn);b.route("/api/schedule",yn);b.get("/oauth/callback",async e=>{let t=e.req.query("code"),n=e.req.query("state"),o=e.req.query("error");if(o)return e.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C OAuth \uC624\uB958</h1>
          <p style="color: #f87171;">${o}</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);if(!t)return e.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uC624\uB958</h1>
          <p style="color: #f87171;">\uC778\uC99D \uCF54\uB4DC\uB97C \uBC1B\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);if(!n)return e.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uC624\uB958</h1>
          <p style="color: #f87171;">\uC778\uC99D \uC0C1\uD0DC(state)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);let s=Xt(n);if(!s||!s.userId)return e.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uC624\uB958</h1>
          <p style="color: #f87171;">\uC798\uBABB\uB41C \uC778\uC99D \uC0C1\uD0DC\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.</p>
          <a href="/channels" style="color: #3b82f6;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>
        </body>
      </html>
    `);try{let a=`${new URL(e.req.url).origin}/oauth/callback`,c=await Gt(e.env,t,a,s.userId);return e.html(`
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
            <p class="channel-name">"${c.youtube.channelTitle}"</p>
            <p class="description">YouTube \uCC44\uB110\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC5F0\uACB0\uB418\uC5C8\uC2B5\uB2C8\uB2E4.<br>\uC774\uC81C \uB313\uAE00 \uC790\uB3D9 \uC751\uB2F5 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>

            <div class="next-steps">
              <h3>\uB2E4\uC74C \uB2E8\uACC4</h3>
              <ul>
                <li>\uB313\uAE00 \uAC00\uC838\uC624\uAE30\uB85C \uCD5C\uC2E0 \uB313\uAE00 \uC218\uC9D1</li>
                <li>AI\uAC00 \uB313\uAE00\uC744 \uC790\uB3D9\uC73C\uB85C \uBD84\uB958</li>
                <li>\uC751\uB2F5\uC744 \uC0DD\uC131\uD558\uACE0 \uAC80\uD1A0 \uD6C4 \uC2B9\uC778</li>
              </ul>
            </div>

            <a href="/channels/${c.id}" class="btn-primary">\uB300\uC2DC\uBCF4\uB4DC\uB85C \uC774\uB3D9 \u2192</a>
            <br>
            <a href="/channels" class="btn-secondary">\uCC44\uB110 \uBAA9\uB85D \uBCF4\uAE30</a>
          </div>
        </body>
      </html>
    `)}catch(r){return e.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>\u274C \uCC44\uB110 \uC5F0\uACB0 \uC2E4\uD328</h1>
          <p style="color: #f87171;">${r instanceof Error?r.message:"\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}</p>
          <a href="/oauth/start" style="color: #3b82f6;">\uB2E4\uC2DC \uC2DC\uB3C4</a>
          <span style="margin: 0 10px; color: #666;">|</span>
          <a href="/channels" style="color: #888;">\uCC44\uB110 \uBAA9\uB85D\uC73C\uB85C</a>
        </body>
      </html>
    `)}});b.get("/oauth/start",async e=>{let t=e.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];if(!t)return e.redirect("/login?logout");let n=await T(t,e.env.JWT_SECRET);if(!n)return e.redirect("/login?logout");let o=await w(e.env.KV,n.userId);if(!o)return e.redirect("/login?logout");let r=`${new URL(e.req.url).origin}/oauth/callback`,a=Qt(e.env,r,o.id);return e.redirect(a)});b.get("/channels",async e=>{let t=e.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];if(!t)return e.redirect("/login?logout");let n=await T(t,e.env.JWT_SECRET);if(!n)return e.redirect("/login?logout");let o=await w(e.env.KV,n.userId);if(!o)return e.redirect("/login?logout");let s=await F(e.env.KV,o.id);return e.html(kn(o,s))});b.get("/channels/:channelId",async e=>{let t=e.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];if(!t)return e.redirect("/login?logout");let n=await T(t,e.env.JWT_SECRET);if(!n)return e.redirect("/login?logout");let o=await w(e.env.KV,n.userId);if(!o)return e.redirect("/login?logout");let s=e.req.param("channelId"),r=await F(e.env.KV,o.id),a=r.find(c=>c.id===s);return a?e.html(await vn(e.env,{currentChannel:a,userChannels:r,user:o})):e.redirect("/channels")});b.get("/settings",async e=>{let t=e.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];if(!t)return e.redirect("/login?logout");let n=await T(t,e.env.JWT_SECRET);if(!n)return e.redirect("/login?logout");let o=await w(e.env.KV,n.userId);if(!o)return e.redirect("/login?logout");let s=await F(e.env.KV,o.id);return e.html(Tn({user:o,userChannels:s}))});b.use("/api/*",async(e,t)=>{if(e.req.path.startsWith("/api/schedule"))return t();let n=e.req.header("Authorization");if(n&&n.startsWith("Bearer ")){let s=n.substring(7),r=await T(s,e.env.JWT_SECRET);if(r){let a=await w(e.env.KV,r.userId);if(a)return e.set("jwtPayload",r),e.set("user",a),t()}return e.json({success:!1,error:"\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD1A0\uD070\uC785\uB2C8\uB2E4."},401)}let o=e.req.raw.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];if(o){let s=await T(o,e.env.JWT_SECRET);if(s){let r=await w(e.env.KV,s.userId);if(r)return e.set("jwtPayload",s),e.set("user",r),t()}}return e.json({success:!1,error:"\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."},401)});b.route("/api",an);b.route("/api/user",pn);b.route("/api/channels",mn);b.notFound(e=>e.json({success:!1,error:"Not found",path:e.req.path},404));b.onError((e,t)=>e instanceof Se?e.getResponse():(console.error("Error:",e),t.json({success:!1,error:e.message||"Internal server error"},500)));var da={fetch:b.fetch};export{da as default};
