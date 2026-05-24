const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./BrjyQf75.js","./BMrFdEU2.js","./BzWj2wsH.js","./Btj8EfoF.js","./entry.C8y3yuKh.css","./DoChJKP1.js"])))=>i.map(i=>d[i]);
import { _ as _export_sfc, j as resolveDirective, c as createElementBlock, o as openBlock, k as withDirectives, i as createBaseVNode, m as normalizeStyle, l as withModifiers, g as __vitePreload } from "#entry";
import { d as drag } from "./DoChJKP1.js";
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const finalizer = Symbol("Comlink.finalizer");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
const proxyTransferHandler = {
  canHandle: (val) => isObject(val) && val[proxyMarker],
  serialize(obj) {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },
  deserialize(port) {
    port.start();
    return wrap(port);
  }
};
const throwTransferHandler = {
  canHandle: (value) => isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized;
    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack
        }
      };
    } else {
      serialized = { isError: false, value };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(new Error(serialized.value.message), serialized.value);
    }
    throw serialized.value;
  }
};
const transferHandlers = /* @__PURE__ */ new Map([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler]
]);
function isAllowedOrigin(allowedOrigins, origin) {
  for (const allowedOrigin of allowedOrigins) {
    if (origin === allowedOrigin || allowedOrigin === "*") {
      return true;
    }
    if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
      return true;
    }
  }
  return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
  ep.addEventListener("message", function callback(ev) {
    if (!ev || !ev.data) {
      return;
    }
    if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
      return;
    }
    const { id, type, path } = Object.assign({ path: [] }, ev.data);
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
      const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
      switch (type) {
        case "GET":
          {
            returnValue = rawValue;
          }
          break;
        case "SET":
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case "APPLY":
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;
        case "CONSTRUCT":
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case "ENDPOINT":
          {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port2);
            returnValue = transfer(port1, [port1]);
          }
          break;
        case "RELEASE":
          {
            returnValue = void 0;
          }
          break;
        default:
          return;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }
    Promise.resolve(returnValue).catch((value) => {
      return { value, [throwMarker]: 0 };
    }).then((returnValue2) => {
      const [wireValue, transferables] = toWireValue(returnValue2);
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
      if (type === "RELEASE") {
        ep.removeEventListener("message", callback);
        closeEndPoint(ep);
        if (finalizer in obj && typeof obj[finalizer] === "function") {
          obj[finalizer]();
        }
      }
    }).catch((error) => {
      const [wireValue, transferables] = toWireValue({
        value: new TypeError("Unserializable return value"),
        [throwMarker]: 0
      });
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
    });
  });
  if (ep.start) {
    ep.start();
  }
}
function isMessagePort(endpoint) {
  return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
  if (isMessagePort(endpoint))
    endpoint.close();
}
function wrap(ep, target) {
  const pendingListeners = /* @__PURE__ */ new Map();
  ep.addEventListener("message", function handleMessage(ev) {
    const { data } = ev;
    if (!data || !data.id) {
      return;
    }
    const resolver = pendingListeners.get(data.id);
    if (!resolver) {
      return;
    }
    try {
      resolver(data);
    } finally {
      pendingListeners.delete(data.id);
    }
  });
  return createProxy(ep, pendingListeners, [], target);
}
function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}
function releaseEndpoint(ep) {
  return requestResponseMessage(ep, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    closeEndPoint(ep);
  });
}
const proxyCounter = /* @__PURE__ */ new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((ep) => {
  const newCount = (proxyCounter.get(ep) || 0) - 1;
  proxyCounter.set(ep, newCount);
  if (newCount === 0) {
    releaseEndpoint(ep);
  }
});
function registerProxy(proxy2, ep) {
  const newCount = (proxyCounter.get(ep) || 0) + 1;
  proxyCounter.set(ep, newCount);
  if (proxyFinalizers) {
    proxyFinalizers.register(proxy2, ep, proxy2);
  }
}
function unregisterProxy(proxy2) {
  if (proxyFinalizers) {
    proxyFinalizers.unregister(proxy2);
  }
}
function createProxy(ep, pendingListeners, path = [], target = function() {
}) {
  let isProxyReleased = false;
  const proxy2 = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === releaseProxy) {
        return () => {
          unregisterProxy(proxy2);
          releaseEndpoint(ep);
          pendingListeners.clear();
          isProxyReleased = true;
        };
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy2 };
        }
        const r2 = requestResponseMessage(ep, pendingListeners, {
          type: "GET",
          path: path.map((p2) => p2.toString())
        }).then(fromWireValue);
        return r2.then.bind(r2);
      }
      return createProxy(ep, pendingListeners, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const [value, transferables] = toWireValue(rawValue);
      return requestResponseMessage(ep, pendingListeners, {
        type: "SET",
        path: [...path, prop].map((p2) => p2.toString()),
        value
      }, transferables).then(fromWireValue);
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === createEndpoint) {
        return requestResponseMessage(ep, pendingListeners, {
          type: "ENDPOINT"
        }).then(fromWireValue);
      }
      if (last === "bind") {
        return createProxy(ep, pendingListeners, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, pendingListeners, {
        type: "APPLY",
        path: path.map((p2) => p2.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, pendingListeners, {
        type: "CONSTRUCT",
        path: path.map((p2) => p2.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    }
  });
  registerProxy(proxy2, ep);
  return proxy2;
}
function myFlat(arr) {
  return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
  const processed = argumentList.map(toWireValue);
  return [processed.map((v2) => v2[0]), myFlat(processed.map((v2) => v2[1]))];
}
const transferCache = /* @__PURE__ */ new WeakMap();
function transfer(obj, transfers) {
  transferCache.set(obj, transfers);
  return obj;
}
function proxy(obj) {
  return Object.assign(obj, { [proxyMarker]: true });
}
function toWireValue(value) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transferables] = handler.serialize(value);
      return [
        {
          type: "HANDLER",
          name,
          value: serializedValue
        },
        transferables
      ];
    }
  }
  return [
    {
      type: "RAW",
      value
    },
    transferCache.get(value) || []
  ];
}
function fromWireValue(value) {
  switch (value.type) {
    case "HANDLER":
      return transferHandlers.get(value.name).deserialize(value.value);
    case "RAW":
      return value.value;
  }
}
function requestResponseMessage(ep, pendingListeners, msg, transfers) {
  return new Promise((resolve) => {
    const id = generateUUID();
    pendingListeners.set(id, resolve);
    if (ep.start) {
      ep.start();
    }
    ep.postMessage(Object.assign({ id }, msg), transfers);
  });
}
function generateUUID() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
function e$1(e2, t2, r2, n2) {
  return new (r2 || (r2 = Promise))((function(o2, a2) {
    function i3(e3) {
      try {
        d2(n2.next(e3));
      } catch (e4) {
        a2(e4);
      }
    }
    function c2(e3) {
      try {
        d2(n2.throw(e3));
      } catch (e4) {
        a2(e4);
      }
    }
    function d2(e3) {
      var t3;
      e3.done ? o2(e3.value) : (t3 = e3.value, t3 instanceof r2 ? t3 : new r2((function(e4) {
        e4(t3);
      }))).then(i3, c2);
    }
    d2((n2 = n2.apply(e2, [])).next());
  }));
}
"function" == typeof SuppressedError && SuppressedError;
const t$1 = ["geforce 320m", "geforce 8600", "geforce 8600m gt", "geforce 8800 gs", "geforce 8800 gt", "geforce 9400", "geforce 9400m g", "geforce 9400m", "geforce 9600m gt", "geforce 9600m", "geforce fx go5200", "geforce gt 120", "geforce gt 130", "geforce gt 330m", "geforce gtx 285", "google swiftshader", "intel g41", "intel g45", "intel gma 4500mhd", "intel gma x3100", "intel hd 3000", "intel q45", "legacy", "mali-2", "mali-3", "mali-4", "quadro fx 1500", "quadro fx 4", "quadro fx 5", "radeon hd 2400", "radeon hd 2600", "radeon hd 4670", "radeon hd 4850", "radeon hd 4870", "radeon hd 5670", "radeon hd 5750", "radeon hd 6290", "radeon hd 6300", "radeon hd 6310", "radeon hd 6320", "radeon hd 6490m", "radeon hd 6630m", "radeon hd 6750m", "radeon hd 6770m", "radeon hd 6970m", "sgx 543", "sgx543"];
function r(e2) {
  return e2 = e2.toLowerCase().replace(/.*angle ?\((.+)\)(?: on vulkan [0-9.]+)?$/i, "$1").replace(/\s(\d{1,2}gb|direct3d.+$)|\(r\)| \([^)]+\)$/g, "").replace(/(?:vulkan|opengl) \d+\.\d+(?:\.\d+)?(?: \((.*)\))?/, "$1");
}
const n$1 = "undefined" == typeof window, o = (() => {
  if (n$1) return;
  const { userAgent: e2, platform: t2, maxTouchPoints: r2 } = window.navigator, o2 = /(iphone|ipod|ipad)/i.test(e2), a2 = "iPad" === t2 || "MacIntel" === t2 && r2 > 0 && !window.MSStream;
  return { isIpad: a2, isMobile: /android/i.test(e2) || o2 || a2, isSafari12: /Version\/12.+Safari/.test(e2), isFirefox: /Firefox/.test(e2) };
})();
function a$1(e2, t2, r2) {
  if (!r2) return [t2];
  const n2 = (function(e3) {
    const t3 = "\n    precision highp float;\n    attribute vec3 aPosition;\n    varying float vvv;\n    void main() {\n      vvv = 0.31622776601683794;\n      gl_Position = vec4(aPosition, 1.0);\n    }\n  ", r3 = "\n    precision highp float;\n    varying float vvv;\n    void main() {\n      vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * vvv;\n      enc = fract(enc);\n      enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);\n      gl_FragColor = enc;\n    }\n  ", n3 = e3.createShader(35633), o2 = e3.createShader(35632), a3 = e3.createProgram();
    if (!(o2 && n3 && a3)) return;
    e3.shaderSource(n3, t3), e3.shaderSource(o2, r3), e3.compileShader(n3), e3.compileShader(o2), e3.attachShader(a3, n3), e3.attachShader(a3, o2), e3.linkProgram(a3), e3.detachShader(a3, n3), e3.detachShader(a3, o2), e3.deleteShader(n3), e3.deleteShader(o2), e3.useProgram(a3);
    const i4 = e3.createBuffer();
    e3.bindBuffer(34962, i4), e3.bufferData(34962, new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 35044);
    const c3 = e3.getAttribLocation(a3, "aPosition");
    e3.vertexAttribPointer(c3, 3, 5126, false, 0, 0), e3.enableVertexAttribArray(c3), e3.clearColor(1, 1, 1, 1), e3.clear(16384), e3.viewport(0, 0, 1, 1), e3.drawArrays(4, 0, 3);
    const d3 = new Uint8Array(4);
    return e3.readPixels(0, 0, 1, 1, 6408, 5121, d3), e3.deleteProgram(a3), e3.deleteBuffer(i4), d3.join("");
  })(e2), a2 = "801621810", i3 = "8016218135", c2 = "80162181161", d2 = (null == o ? void 0 : o.isIpad) ? [["a7", c2, 12], ["a8", i3, 15], ["a8x", i3, 15], ["a9", i3, 15], ["a9x", i3, 15], ["a10", i3, 15], ["a10x", i3, 15], ["a12", a2, 15], ["a12x", a2, 15], ["a12z", a2, 15], ["a14", a2, 15], ["a15", a2, 15], ["m1", a2, 15], ["m2", a2, 15]] : [["a7", c2, 12], ["a8", i3, 12], ["a9", i3, 15], ["a10", i3, 15], ["a11", a2, 15], ["a12", a2, 15], ["a13", a2, 15], ["a14", a2, 15], ["a15", a2, 15], ["a16", a2, 15], ["a17", a2, 15]];
  let l2;
  "80162181255" === n2 ? l2 = d2.filter((([, , e3]) => e3 >= 14)) : (l2 = d2.filter((([, e3]) => e3 === n2)), l2.length || (l2 = d2));
  return l2.map((([e3]) => `apple ${e3} gpu`));
}
let i$1 = class i extends Error {
  constructor(e2) {
    super(e2), Object.setPrototypeOf(this, new.target.prototype);
  }
};
const c$1 = [], d$1 = [];
function l$1(e2, t2) {
  if (e2 === t2) return 0;
  const r2 = e2;
  e2.length > t2.length && (e2 = t2, t2 = r2);
  let n2 = e2.length, o2 = t2.length;
  for (; n2 > 0 && e2.charCodeAt(~-n2) === t2.charCodeAt(~-o2); ) n2--, o2--;
  let a2, i3 = 0;
  for (; i3 < n2 && e2.charCodeAt(i3) === t2.charCodeAt(i3); ) i3++;
  if (n2 -= i3, o2 -= i3, 0 === n2) return o2;
  let l2, s2, f2 = 0, u2 = 0, g2 = 0;
  for (; u2 < n2; ) d$1[u2] = e2.charCodeAt(i3 + u2), c$1[u2] = ++u2;
  for (; g2 < o2; ) for (a2 = t2.charCodeAt(i3 + g2), l2 = g2++, f2 = g2, u2 = 0; u2 < n2; u2++) s2 = a2 === d$1[u2] ? l2 : l2 + 1, l2 = c$1[u2], f2 = c$1[u2] = l2 > f2 ? s2 > f2 ? f2 + 1 : s2 : s2 > l2 ? l2 + 1 : s2;
  return f2;
}
function s$1(e2) {
  return null != e2;
}
const f$1 = ({ mobileTiers: c2 = [0, 15, 30, 60], desktopTiers: d2 = [0, 15, 30, 60], override: f2 = {}, glContext: u2, failIfMajorPerformanceCaveat: g2 = false, benchmarksURL: h2 = "https://unpkg.com/detect-gpu@5.0.70/dist/benchmarks" } = {}) => e$1(void 0, void 0, void 0, (function* () {
  const p2 = {};
  if (n$1) return { tier: 0, type: "SSR" };
  const { isIpad: m2 = !!(null == o ? void 0 : o.isIpad), isMobile: v2 = !!(null == o ? void 0 : o.isMobile), screenSize: w2 = window.screen, loadBenchmarks: x = ((t2) => e$1(void 0, void 0, void 0, (function* () {
    const e2 = yield fetch(`${h2}/${t2}`).then(((e3) => e3.json()));
    if (parseInt(e2.shift().split(".")[0], 10) < 4) throw new i$1("Detect GPU benchmark data is out of date. Please update to version 4x");
    return e2;
  }))) } = f2;
  let { renderer: A2 } = f2;
  const P2 = (e2, t2, r2, n2, o2) => ({ device: o2, fps: n2, gpu: r2, isMobile: v2, tier: e2, type: t2 });
  let S, b2 = "";
  if (A2) A2 = r(A2), S = [A2];
  else {
    const e2 = u2 || (function(e3, t3 = false) {
      const r2 = { alpha: false, antialias: false, depth: false, failIfMajorPerformanceCaveat: t3, powerPreference: "high-performance", stencil: false };
      e3 && delete r2.powerPreference;
      const n2 = window.document.createElement("canvas"), o2 = n2.getContext("webgl", r2) || n2.getContext("experimental-webgl", r2);
      return null != o2 ? o2 : void 0;
    })(null == o ? void 0 : o.isSafari12, g2);
    if (!e2) return P2(0, "WEBGL_UNSUPPORTED");
    const t2 = (null == o ? void 0 : o.isFirefox) ? null : e2.getExtension("WEBGL_debug_renderer_info");
    if (A2 = t2 ? e2.getParameter(t2.UNMASKED_RENDERER_WEBGL) : e2.getParameter(e2.RENDERER), !A2) return P2(1, "FALLBACK");
    b2 = A2, A2 = r(A2), S = (function(e3, t3, r2) {
      return "apple gpu" === t3 ? a$1(e3, t3, r2) : [t3];
    })(e2, A2, v2);
  }
  const E = (yield Promise.all(S.map((function(t2) {
    var r2;
    return e$1(this, void 0, void 0, (function* () {
      const e2 = ((e3) => {
        const t3 = v2 ? ["adreno", "apple", "mali-t", "mali", "nvidia", "powervr", "samsung"] : ["intel", "apple", "amd", "radeon", "nvidia", "geforce", "adreno"];
        for (const r3 of t3) if (e3.includes(r3)) return r3;
      })(t2);
      if (!e2) return;
      const n2 = `${v2 ? "m" : "d"}-${e2}${m2 ? "-ipad" : ""}.json`, o2 = p2[n2] = null !== (r2 = p2[n2]) && void 0 !== r2 ? r2 : x(n2);
      let a2;
      try {
        a2 = yield o2;
      } catch (e3) {
        if (e3 instanceof i$1) throw e3;
        return;
      }
      const c3 = (function(e3) {
        var t3;
        const r3 = (e3 = e3.replace(/\([^)]+\)/, "")).match(/\d+/) || e3.match(/(\W|^)([A-Za-z]{1,3})(\W|$)/g);
        return null !== (t3 = null == r3 ? void 0 : r3.join("").replace(/\W|amd/g, "")) && void 0 !== t3 ? t3 : "";
      })(t2);
      let d3 = a2.filter((([, e3]) => e3 === c3));
      d3.length || (d3 = a2.filter((([e3]) => e3.includes(t2))));
      const s2 = d3.length;
      if (0 === s2) return;
      const f3 = t2.split(/[.,()\[\]/\s]/g).sort().filter(((e3, t3, r3) => 0 === t3 || e3 !== r3[t3 - 1])).join(" ");
      let u3, [g3, , , , h3] = s2 > 1 ? d3.map(((e3) => [e3, l$1(f3, e3[2])])).sort((([, e3], [, t3]) => e3 - t3))[0][0] : d3[0], A3 = Number.MAX_VALUE;
      const { devicePixelRatio: P3 } = window, S2 = w2.width * P3 * w2.height * P3;
      for (const e3 of h3) {
        const [t3, r3] = e3, n3 = t3 * r3, o3 = Math.abs(S2 - n3);
        o3 < A3 && (A3 = o3, u3 = e3);
      }
      if (!u3) return;
      const [, , b3, E2] = u3;
      return [A3, b3, g3, E2];
    }));
  })))).filter(s$1).sort((([e2 = Number.MAX_VALUE, t2], [r2 = Number.MAX_VALUE, n2]) => e2 === r2 ? t2 - n2 : e2 - r2));
  if (!E.length) {
    const e2 = t$1.find(((e3) => A2.includes(e3)));
    return e2 ? P2(0, "BLOCKLISTED", e2) : P2(1, "FALLBACK", `${A2} (${b2})`);
  }
  const [, y2, C, L2] = E[0];
  if (-1 === y2) return P2(0, "BLOCKLISTED", C, y2, L2);
  const M2 = v2 ? c2 : d2;
  let $ = 0;
  for (let e2 = 0; e2 < M2.length; e2++) y2 >= M2[e2] && ($ = e2);
  return P2($, "BENCHMARK", C, y2, L2);
}));
function e(e2, t2) {
  const n2 = /* @__PURE__ */ Object.create(null), o2 = e2.split(",");
  for (let e3 = 0; e3 < o2.length; e3++) n2[o2[e3]] = true;
  return (e3) => !!n2[e3];
}
const t = {};
const n = () => {
}, s = Object.assign, i2 = (e2, t2) => {
  const n2 = e2.indexOf(t2);
  n2 > -1 && e2.splice(n2, 1);
}, c = Object.prototype.hasOwnProperty, a = (e2, t2) => c.call(e2, t2), l = Array.isArray, u = (e2) => "[object Map]" === y(e2), p = (e2) => "[object Set]" === y(e2), f = (e2) => "function" == typeof e2, d = (e2) => "string" == typeof e2, h = (e2) => "symbol" == typeof e2, v = (e2) => null !== e2 && "object" == typeof e2, _ = (e2) => (v(e2) || f(e2)) && f(e2.then) && f(e2.catch), g = Object.prototype.toString, y = (e2) => g.call(e2), b = (e2) => y(e2).slice(8, -1), m = (e2) => "[object Object]" === y(e2), w = (e2) => d(e2) && "NaN" !== e2 && "-" !== e2[0] && "" + parseInt(e2, 10) === e2, N = (e2, t2) => !Object.is(e2, t2), O = (e2, t2, n2) => {
  Object.defineProperty(e2, t2, { configurable: true, enumerable: false, value: n2 });
};
let k;
const V = () => k || (k = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof globalThis ? globalThis : {});
let P;
const I = (e2) => {
  const t2 = new Set(e2);
  return t2.w = 0, t2.n = 0, t2;
}, T = (e2) => (e2.w & U) > 0, M = (e2) => (e2.n & U) > 0, F = /* @__PURE__ */ new WeakMap();
let A = 0, U = 1;
const z = 30;
let H;
const W = Symbol(""), J = Symbol("");
class K {
  constructor(e2, t2 = null, n2) {
    this.fn = e2, this.scheduler = t2, this.active = true, this.deps = [], this.parent = void 0, (function(e3, t3 = P) {
      t3 && t3.active && t3.effects.push(e3);
    })(this, n2);
  }
  run() {
    if (!this.active) return this.fn();
    let e2 = H, t2 = B;
    for (; e2; ) {
      if (e2 === this) return;
      e2 = e2.parent;
    }
    try {
      return this.parent = H, H = this, B = true, U = 1 << ++A, A <= z ? (({ deps: e3 }) => {
        if (e3.length) for (let t3 = 0; t3 < e3.length; t3++) e3[t3].w |= U;
      })(this) : q(this), this.fn();
    } finally {
      A <= z && ((e3) => {
        const { deps: t3 } = e3;
        if (t3.length) {
          let n2 = 0;
          for (let o2 = 0; o2 < t3.length; o2++) {
            const r2 = t3[o2];
            T(r2) && !M(r2) ? r2.delete(e3) : t3[n2++] = r2, r2.w &= ~U, r2.n &= ~U;
          }
          t3.length = n2;
        }
      })(this), U = 1 << --A, H = this.parent, B = t2, this.parent = void 0, this.deferStop && this.stop();
    }
  }
  stop() {
    H === this ? this.deferStop = true : this.active && (q(this), this.onStop && this.onStop(), this.active = false);
  }
}
function q(e2) {
  const { deps: t2 } = e2;
  if (t2.length) {
    for (let n2 = 0; n2 < t2.length; n2++) t2[n2].delete(e2);
    t2.length = 0;
  }
}
let B = true;
const L = [];
function G() {
  L.push(B), B = false;
}
function Q() {
  const e2 = L.pop();
  B = void 0 === e2 || e2;
}
function X(e2, t2, n2) {
  if (B && H) {
    let o2 = F.get(e2);
    o2 || F.set(e2, o2 = /* @__PURE__ */ new Map());
    let r2 = o2.get(n2);
    r2 || o2.set(n2, r2 = I());
    !(function(e3, t3) {
      let n3 = false;
      A <= z ? M(e3) || (e3.n |= U, n3 = !T(e3)) : n3 = !e3.has(H);
      n3 && (e3.add(H), H.deps.push(e3), false);
    })(r2);
  }
}
function Y(e2, t2, n2, o2, r2, s2) {
  const i22 = F.get(e2);
  if (!i22) return;
  let c2 = [];
  if ("clear" === t2) c2 = [...i22.values()];
  else if ("length" === n2 && l(e2)) {
    const e3 = Number(o2);
    i22.forEach(((t3, n3) => {
      ("length" === n3 || !h(n3) && n3 >= e3) && c2.push(t3);
    }));
  } else switch (void 0 !== n2 && c2.push(i22.get(n2)), t2) {
    case "add":
      l(e2) ? w(n2) && c2.push(i22.get("length")) : (c2.push(i22.get(W)), u(e2) && c2.push(i22.get(J)));
      break;
    case "delete":
      l(e2) || (c2.push(i22.get(W)), u(e2) && c2.push(i22.get(J)));
      break;
    case "set":
      u(e2) && c2.push(i22.get(W));
  }
  if (1 === c2.length) c2[0] && Z(c2[0]);
  else {
    const e3 = [];
    for (const t3 of c2) t3 && e3.push(...t3);
    Z(I(e3));
  }
}
function Z(e2, t2) {
  const n2 = l(e2) ? e2 : [...e2];
  for (const e3 of n2) e3.computed && ee(e3);
  for (const e3 of n2) e3.computed || ee(e3);
}
function ee(e2, t2) {
  (e2 !== H || e2.allowRecurse) && (e2.scheduler ? e2.scheduler() : e2.run());
}
const te = e("__proto__,__v_isRef,__isVue"), ne = new Set(Object.getOwnPropertyNames(Symbol).filter(((e2) => "arguments" !== e2 && "caller" !== e2)).map(((e2) => Symbol[e2])).filter(h)), oe = re();
function re() {
  const e2 = {};
  return ["includes", "indexOf", "lastIndexOf"].forEach(((t2) => {
    e2[t2] = function(...e3) {
      const n2 = qe(this);
      for (let e4 = 0, t3 = this.length; e4 < t3; e4++) X(n2, "get", e4 + "");
      const o2 = n2[t2](...e3);
      return -1 === o2 || false === o2 ? n2[t2](...e3.map(qe)) : o2;
    };
  })), ["push", "pop", "shift", "unshift", "splice"].forEach(((t2) => {
    e2[t2] = function(...e3) {
      G();
      const n2 = qe(this)[t2].apply(this, e3);
      return Q(), n2;
    };
  })), e2;
}
function se(e2) {
  const t2 = qe(this);
  return X(t2, "has", e2), t2.hasOwnProperty(e2);
}
class ie {
  constructor(e2 = false, t2 = false) {
    this._isReadonly = e2, this._shallow = t2;
  }
  get(e2, t2, n2) {
    const o2 = this._isReadonly, r2 = this._shallow;
    if ("__v_isReactive" === t2) return !o2;
    if ("__v_isReadonly" === t2) return o2;
    if ("__v_isShallow" === t2) return r2;
    if ("__v_raw" === t2 && n2 === (o2 ? r2 ? Me : Te : r2 ? Ie : Pe).get(e2)) return e2;
    const s2 = l(e2);
    if (!o2) {
      if (s2 && a(oe, t2)) return Reflect.get(oe, t2, n2);
      if ("hasOwnProperty" === t2) return se;
    }
    const i22 = Reflect.get(e2, t2, n2);
    return (h(t2) ? ne.has(t2) : te(t2)) ? i22 : (o2 || X(e2, "get", t2), r2 ? i22 : Ge(i22) ? s2 && w(t2) ? i22 : i22.value : v(i22) ? o2 ? Ae(i22) : Fe(i22) : i22);
  }
}
class ce extends ie {
  constructor(e2 = false) {
    super(false, e2);
  }
  set(e2, t2, n2, o2) {
    let r2 = e2[t2];
    if (We(r2) && Ge(r2) && !Ge(n2)) return false;
    if (!this._shallow && (Je(n2) || We(n2) || (r2 = qe(r2), n2 = qe(n2)), !l(e2) && Ge(r2) && !Ge(n2))) return r2.value = n2, true;
    const s2 = l(e2) && w(t2) ? Number(t2) < e2.length : a(e2, t2), i22 = Reflect.set(e2, t2, n2, o2);
    return e2 === qe(o2) && (s2 ? N(n2, r2) && Y(e2, "set", t2, n2) : Y(e2, "add", t2, n2)), i22;
  }
  deleteProperty(e2, t2) {
    const n2 = a(e2, t2);
    e2[t2];
    const r2 = Reflect.deleteProperty(e2, t2);
    return r2 && n2 && Y(e2, "delete", t2, void 0), r2;
  }
  has(e2, t2) {
    const n2 = Reflect.has(e2, t2);
    return h(t2) && ne.has(t2) || X(e2, "has", t2), n2;
  }
  ownKeys(e2) {
    return X(e2, "iterate", l(e2) ? "length" : W), Reflect.ownKeys(e2);
  }
}
class ae extends ie {
  constructor(e2 = false) {
    super(true, e2);
  }
  set(e2, t2) {
    return true;
  }
  deleteProperty(e2, t2) {
    return true;
  }
}
const le = new ce(), ue = new ae();
new ae(true);
const fe = (e2) => e2, de = (e2) => Reflect.getPrototypeOf(e2);
function he(e2, t2, n2 = false, o2 = false) {
  const r2 = qe(e2 = e2.__v_raw), s2 = qe(t2);
  n2 || (N(t2, s2) && X(r2, "get", t2), X(r2, "get", s2));
  const { has: i22 } = de(r2), c2 = o2 ? fe : n2 ? Le : Be;
  return i22.call(r2, t2) ? c2(e2.get(t2)) : i22.call(r2, s2) ? c2(e2.get(s2)) : void (e2 !== r2 && e2.get(t2));
}
function ve(e2, t2 = false) {
  const n2 = this.__v_raw, o2 = qe(n2), r2 = qe(e2);
  return t2 || (N(e2, r2) && X(o2, "has", e2), X(o2, "has", r2)), e2 === r2 ? n2.has(e2) : n2.has(e2) || n2.has(r2);
}
function _e(e2, t2 = false) {
  return e2 = e2.__v_raw, !t2 && X(qe(e2), "iterate", W), Reflect.get(e2, "size", e2);
}
function ge(e2) {
  e2 = qe(e2);
  const t2 = qe(this);
  return de(t2).has.call(t2, e2) || (t2.add(e2), Y(t2, "add", e2, e2)), this;
}
function ye(e2, t2) {
  t2 = qe(t2);
  const n2 = qe(this), { has: o2, get: r2 } = de(n2);
  let s2 = o2.call(n2, e2);
  s2 ? false : (e2 = qe(e2), s2 = o2.call(n2, e2));
  const i22 = r2.call(n2, e2);
  return n2.set(e2, t2), s2 ? N(t2, i22) && Y(n2, "set", e2, t2) : Y(n2, "add", e2, t2), this;
}
function be(e2) {
  const t2 = qe(this), { has: n2, get: o2 } = de(t2);
  let r2 = n2.call(t2, e2);
  r2 ? false : (e2 = qe(e2), r2 = n2.call(t2, e2));
  o2 ? o2.call(t2, e2) : void 0;
  const i22 = t2.delete(e2);
  return r2 && Y(t2, "delete", e2, void 0), i22;
}
function me() {
  const e2 = qe(this), t2 = 0 !== e2.size, o2 = e2.clear();
  return t2 && Y(e2, "clear", void 0, void 0), o2;
}
function we(e2, t2) {
  return function(n2, o2) {
    const r2 = this, s2 = r2.__v_raw, i22 = qe(s2), c2 = t2 ? fe : e2 ? Le : Be;
    return !e2 && X(i22, "iterate", W), s2.forEach(((e3, t3) => n2.call(o2, c2(e3), c2(t3), r2)));
  };
}
function Ee(e2, t2, n2) {
  return function(...o2) {
    const r2 = this.__v_raw, s2 = qe(r2), i22 = u(s2), c2 = "entries" === e2 || e2 === Symbol.iterator && i22, a2 = "keys" === e2 && i22, l2 = r2[e2](...o2), p2 = n2 ? fe : t2 ? Le : Be;
    return !t2 && X(s2, "iterate", a2 ? J : W), { next() {
      const { value: e3, done: t3 } = l2.next();
      return t3 ? { value: e3, done: t3 } : { value: c2 ? [p2(e3[0]), p2(e3[1])] : p2(e3), done: t3 };
    }, [Symbol.iterator]() {
      return this;
    } };
  };
}
function Ne(e2) {
  return function(...t2) {
    return "delete" !== e2 && ("clear" === e2 ? void 0 : this);
  };
}
function Oe() {
  const e2 = { get(e3) {
    return he(this, e3);
  }, get size() {
    return _e(this);
  }, has: ve, add: ge, set: ye, delete: be, clear: me, forEach: we(false, false) }, t2 = { get(e3) {
    return he(this, e3, false, true);
  }, get size() {
    return _e(this);
  }, has: ve, add: ge, set: ye, delete: be, clear: me, forEach: we(false, true) }, n2 = { get(e3) {
    return he(this, e3, true);
  }, get size() {
    return _e(this, true);
  }, has(e3) {
    return ve.call(this, e3, true);
  }, add: Ne("add"), set: Ne("set"), delete: Ne("delete"), clear: Ne("clear"), forEach: we(true, false) }, o2 = { get(e3) {
    return he(this, e3, true, true);
  }, get size() {
    return _e(this, true);
  }, has(e3) {
    return ve.call(this, e3, true);
  }, add: Ne("add"), set: Ne("set"), delete: Ne("delete"), clear: Ne("clear"), forEach: we(true, true) };
  return ["keys", "values", "entries", Symbol.iterator].forEach(((r2) => {
    e2[r2] = Ee(r2, false, false), n2[r2] = Ee(r2, true, false), t2[r2] = Ee(r2, false, true), o2[r2] = Ee(r2, true, true);
  })), [e2, n2, t2, o2];
}
const [ke, Ve, Se, xe] = Oe();
function De(e2, t2) {
  const n2 = t2 ? e2 ? xe : Se : e2 ? Ve : ke;
  return (t3, o2, r2) => "__v_isReactive" === o2 ? !e2 : "__v_isReadonly" === o2 ? e2 : "__v_raw" === o2 ? t3 : Reflect.get(a(n2, o2) && o2 in t3 ? n2 : t3, o2, r2);
}
const $e = { get: De(false, false) }, Re = { get: De(true, false) };
const Pe = /* @__PURE__ */ new WeakMap(), Ie = /* @__PURE__ */ new WeakMap(), Te = /* @__PURE__ */ new WeakMap(), Me = /* @__PURE__ */ new WeakMap();
function Fe(e2) {
  return We(e2) ? e2 : ze(e2, false, le, $e, Pe);
}
function Ae(e2) {
  return ze(e2, true, ue, Re, Te);
}
function ze(e2, t2, n2, o2, r2) {
  if (!v(e2)) return e2;
  if (e2.__v_raw && (!t2 || !e2.__v_isReactive)) return e2;
  const s2 = r2.get(e2);
  if (s2) return s2;
  const i22 = (c2 = e2).__v_skip || !Object.isExtensible(c2) ? 0 : (function(e3) {
    switch (e3) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  })(b(c2));
  var c2;
  if (0 === i22) return e2;
  const a2 = new Proxy(e2, 2 === i22 ? o2 : n2);
  return r2.set(e2, a2), a2;
}
function He(e2) {
  return We(e2) ? He(e2.__v_raw) : !(!e2 || !e2.__v_isReactive);
}
function We(e2) {
  return !(!e2 || !e2.__v_isReadonly);
}
function Je(e2) {
  return !(!e2 || !e2.__v_isShallow);
}
function qe(e2) {
  const t2 = e2 && e2.__v_raw;
  return t2 ? qe(t2) : e2;
}
const Be = (e2) => v(e2) ? Fe(e2) : e2, Le = (e2) => v(e2) ? Ae(e2) : e2;
function Ge(e2) {
  return !(!e2 || true !== e2.__v_isRef);
}
const Qe = { get: (e2, t2, n2) => {
  return Ge(o2 = Reflect.get(e2, t2, n2)) ? o2.value : o2;
  var o2;
}, set: (e2, t2, n2, o2) => {
  const r2 = e2[t2];
  return Ge(r2) && !Ge(n2) ? (r2.value = n2, true) : Reflect.set(e2, t2, n2, o2);
} };
function nt(e2, t2, n2, o2) {
  let r2;
  try {
    r2 = o2 ? e2(...o2) : e2();
  } catch (e3) {
    rt(e3, t2, n2);
  }
  return r2;
}
function ot(e2, t2, n2, o2) {
  if (f(e2)) {
    const r3 = nt(e2, t2, n2, o2);
    return r3 && _(r3) && r3.catch(((e3) => {
      rt(e3, t2, n2);
    })), r3;
  }
  const r2 = [];
  for (let s2 = 0; s2 < e2.length; s2++) r2.push(ot(e2[s2], t2, n2, o2));
  return r2;
}
function rt(e2, t2, n2, o2 = true) {
  const r2 = t2 ? t2.vnode : null;
  if (t2) {
    let o3 = t2.parent;
    const r3 = t2.proxy, s2 = n2;
    for (; o3; ) {
      const t3 = o3.ec;
      if (t3) {
        for (let n3 = 0; n3 < t3.length; n3++) if (false === t3[n3](e2, r3, s2)) return;
      }
      o3 = o3.parent;
    }
    const i22 = t2.appContext.config.errorHandler;
    if (i22) return void nt(i22, null, 10, [e2, r3, s2]);
  }
  !/* @__PURE__ */ (function(e3, t3, n3, o3 = true) {
  })(e2, n2, r2, o2);
}
let st = false, it = false;
const ct = [];
let at = 0;
const lt = [];
let ut = null, pt = 0;
const ft = Promise.resolve();
let dt = null;
function vt(e2) {
  const t2 = dt || ft;
  return e2 ? t2.then(this ? e2.bind(this) : e2) : t2;
}
function _t(e2) {
  ct.length && ct.includes(e2, st && e2.allowRecurse ? at + 1 : at) || (null == e2.id ? ct.push(e2) : ct.splice((function(e3) {
    let t2 = at + 1, n2 = ct.length;
    for (; t2 < n2; ) {
      const o2 = t2 + n2 >>> 1, r2 = ct[o2], s2 = bt(r2);
      s2 < e3 || s2 === e3 && r2.pre ? t2 = o2 + 1 : n2 = o2;
    }
    return t2;
  })(e2.id), 0, e2), gt());
}
function gt() {
  st || it || (it = true, dt = ft.then(wt));
}
function yt(e2) {
  l(e2) ? lt.push(...e2) : ut && ut.includes(e2, e2.allowRecurse ? pt + 1 : pt) || lt.push(e2), gt();
}
const bt = (e2) => null == e2.id ? 1 / 0 : e2.id, mt = (e2, t2) => {
  const n2 = bt(e2) - bt(t2);
  if (0 === n2) {
    if (e2.pre && !t2.pre) return -1;
    if (t2.pre && !e2.pre) return 1;
  }
  return n2;
};
function wt(e2) {
  it = false, st = true, ct.sort(mt);
  try {
    for (at = 0; at < ct.length; at++) {
      const e3 = ct[at];
      if (e3 && false !== e3.active) {
        if (false) ;
        nt(e3, null, 14);
      }
    }
  } finally {
    at = 0, ct.length = 0, (function(e3) {
      if (lt.length) {
        const t3 = [...new Set(lt)];
        if (lt.length = 0, ut) return void ut.push(...t3);
        for (ut = t3, ut.sort(((e4, t4) => bt(e4) - bt(t4))), pt = 0; pt < ut.length; pt++) ut[pt]();
        ut = null, pt = 0;
      }
    })(), st = false, dt = null, (ct.length || lt.length) && wt();
  }
}
const Rt = {};
function Ct(e2, o2, { immediate: r2, deep: s2, flush: c2, onTrack: a2, onTrigger: u2 } = t) {
  var p2;
  const h2 = P === (null == (p2 = pn) ? void 0 : p2.scope) ? pn : null;
  let v2, _2, g2 = false, y2 = false;
  if (Ge(e2) ? (v2 = () => e2.value, g2 = Je(e2)) : He(e2) ? (v2 = () => e2, s2 = true) : l(e2) ? (y2 = true, g2 = e2.some(((e3) => He(e3) || Je(e3))), v2 = () => e2.map(((e3) => Ge(e3) ? e3.value : He(e3) ? Pt(e3) : f(e3) ? nt(e3, h2, 2) : void 0))) : f(e2) ? v2 = o2 ? () => nt(e2, h2, 2) : () => {
    if (!h2 || !h2.isUnmounted) return _2 && _2(), ot(e2, h2, 3, [b2]);
  } : (v2 = n, false), o2 && s2) {
    const e3 = v2;
    v2 = () => Pt(e3());
  }
  let b2 = (e3) => {
    _2 = O2.onStop = () => {
      nt(e3, h2, 4), _2 = O2.onStop = void 0;
    };
  }, m2 = y2 ? new Array(e2.length).fill(Rt) : Rt;
  const w2 = () => {
    if (O2.active) if (o2) {
      const e3 = O2.run();
      (s2 || g2 || (y2 ? e3.some(((e4, t2) => N(e4, m2[t2]))) : N(e3, m2))) && (_2 && _2(), ot(o2, h2, 3, [e3, m2 === Rt ? void 0 : y2 && m2[0] === Rt ? [] : m2, b2]), m2 = e3);
    } else O2.run();
  };
  let E2;
  w2.allowRecurse = !!o2, "sync" === c2 ? E2 = w2 : "post" === c2 ? E2 = () => Lt(w2, h2 && h2.suspense) : (w2.pre = true, h2 && (w2.id = h2.uid), E2 = () => _t(w2));
  const O2 = new K(v2, E2);
  o2 ? r2 ? w2() : m2 = O2.run() : "post" === c2 ? Lt(O2.run.bind(O2), h2 && h2.suspense) : O2.run();
  return () => {
    O2.stop(), h2 && h2.scope && i2(h2.scope.effects, O2);
  };
}
function jt(e2, t2, n2) {
  const o2 = this.proxy, r2 = d(e2) ? e2.includes(".") ? (function(e3, t3) {
    const n3 = t3.split(".");
    return () => {
      let t4 = e3;
      for (let e4 = 0; e4 < n3.length && t4; e4++) t4 = t4[n3[e4]];
      return t4;
    };
  })(o2, e2) : () => o2[e2] : e2.bind(o2, o2);
  let s2;
  f(t2) ? s2 = t2 : (s2 = t2.handler, n2 = t2);
  const i22 = pn;
  dn(this);
  const c2 = Ct(r2, s2.bind(o2), n2);
  return i22 ? dn(i22) : hn(), c2;
}
function Pt(e2, t2) {
  if (!v(e2) || e2.__v_skip) return e2;
  if ((t2 = t2 || /* @__PURE__ */ new Set()).has(e2)) return e2;
  if (t2.add(e2), Ge(e2)) Pt(e2.value, t2);
  else if (l(e2)) for (let n2 = 0; n2 < e2.length; n2++) Pt(e2[n2], t2);
  else if (p(e2) || u(e2)) e2.forEach(((e3) => {
    Pt(e3, t2);
  }));
  else if (m(e2)) for (const n2 in e2) Pt(e2[n2], t2);
  return e2;
}
const It = (e2) => e2 ? 4 & e2.vnode.shapeFlag ? (function(e3) {
  if (e3.exposed) return e3.exposeProxy || (e3.exposeProxy = new Proxy((n2 = e3.exposed, O(n2, "__v_skip", true), He(t2 = n2) ? t2 : new Proxy(t2, Qe)), { get: (t3, n3) => n3 in t3 ? t3[n3] : n3 in Tt ? Tt[n3](e3) : void 0, has: (e4, t3) => t3 in e4 || t3 in Tt }));
  var t2;
  var n2;
})(e2) || e2.proxy : It(e2.parent) : null, Tt = s(/* @__PURE__ */ Object.create(null), { $: (e2) => e2, $el: (e2) => e2.vnode.el, $data: (e2) => e2.data, $props: (e2) => e2.props, $attrs: (e2) => e2.attrs, $slots: (e2) => e2.slots, $refs: (e2) => e2.refs, $parent: (e2) => It(e2.parent), $root: (e2) => It(e2.root), $emit: (e2) => e2.emit, $options: (e2) => (function(e3) {
  const t2 = e3.type, { mixins: n2, extends: o2 } = t2, { mixins: r2, optionsCache: s2, config: { optionMergeStrategies: i22 } } = e3.appContext, c2 = s2.get(t2);
  let a2;
  c2 ? a2 = c2 : r2.length || n2 || o2 ? (a2 = {}, r2.length && r2.forEach(((e4) => zt(a2, e4, i22, true))), zt(a2, t2, i22)) : a2 = t2;
  v(t2) && s2.set(t2, a2);
  return a2;
})(e2), $forceUpdate: (e2) => e2.f || (e2.f = () => _t(e2.update)), $nextTick: (e2) => e2.n || (e2.n = vt.bind(e2.proxy)), $watch: (e2) => jt.bind(e2) });
function At(e2) {
  return l(e2) ? e2.reduce(((e3, t2) => (e3[t2] = null, e3)), {}) : e2;
}
function zt(e2, t2, n2, o2 = false) {
  const { mixins: r2, extends: s2 } = t2;
  s2 && zt(e2, s2, n2, true), r2 && r2.forEach(((t3) => zt(e2, t3, n2, true)));
  for (const r3 in t2) if (o2 && "expose" === r3) ;
  else {
    const o3 = Ht[r3] || n2 && n2[r3];
    e2[r3] = o3 ? o3(e2[r3], t2[r3]) : t2[r3];
  }
  return e2;
}
const Ht = { data: Wt, props: Bt, emits: Bt, methods: qt, computed: qt, beforeCreate: Kt, created: Kt, beforeMount: Kt, mounted: Kt, beforeUpdate: Kt, updated: Kt, beforeDestroy: Kt, beforeUnmount: Kt, destroyed: Kt, unmounted: Kt, activated: Kt, deactivated: Kt, errorCaptured: Kt, serverPrefetch: Kt, components: qt, directives: qt, watch: function(e2, t2) {
  if (!e2) return t2;
  if (!t2) return e2;
  const n2 = s(/* @__PURE__ */ Object.create(null), e2);
  for (const o2 in t2) n2[o2] = Kt(e2[o2], t2[o2]);
  return n2;
}, provide: Wt, inject: function(e2, t2) {
  return qt(Jt(e2), Jt(t2));
} };
function Wt(e2, t2) {
  return t2 ? e2 ? function() {
    return s(f(e2) ? e2.call(this, this) : e2, f(t2) ? t2.call(this, this) : t2);
  } : t2 : e2;
}
function Jt(e2) {
  if (l(e2)) {
    const t2 = {};
    for (let n2 = 0; n2 < e2.length; n2++) t2[e2[n2]] = e2[n2];
    return t2;
  }
  return e2;
}
function Kt(e2, t2) {
  return e2 ? [...new Set([].concat(e2, t2))] : t2;
}
function qt(e2, t2) {
  return e2 ? s(/* @__PURE__ */ Object.create(null), e2, t2) : t2;
}
function Bt(e2, t2) {
  return e2 ? l(e2) && l(t2) ? [.../* @__PURE__ */ new Set([...e2, ...t2])] : s(/* @__PURE__ */ Object.create(null), At(e2), At(null != t2 ? t2 : {})) : t2;
}
const Lt = function(e2, t2) {
  t2 && t2.pendingBranch ? l(e2) ? t2.effects.push(...e2) : t2.effects.push(e2) : yt(e2);
};
let ln, un, pn = null, fn = "__VUE_INSTANCE_SETTERS__";
(un = V()[fn]) || (un = V()[fn] = []), un.push(((e2) => pn = e2)), ln = (e2) => {
  un.length > 1 ? un.forEach(((t2) => t2(e2))) : un[0](e2);
};
const dn = (e2) => {
  ln(e2), e2.scope.on();
}, hn = () => {
  pn && pn.scope.off(), ln(null);
};
function wn(e2, t2, n2) {
  if (2 === arguments.length) for (var o2, r2 = 0, s2 = t2.length; r2 < s2; r2++) !o2 && r2 in t2 || (o2 || (o2 = Array.prototype.slice.call(t2, 0, r2)), o2[r2] = t2[r2]);
  return e2.concat(o2 || Array.prototype.slice.call(t2));
}
function En(e2, t2) {
  if (e2 === t2) return true;
  if ("object" == typeof e2) {
    for (var n2 in e2) if (!En(e2[n2], t2[n2])) return false;
    return true;
  }
  return false;
}
"function" == typeof SuppressedError && SuppressedError;
var Nn = (function() {
  function e2(e3, t2) {
    this.el = e3, this.observer = null, this.frozen = false, this.createObserver(t2);
  }
  return Object.defineProperty(e2.prototype, "threshold", { get: function() {
    return this.options.intersection && this.options.intersection.threshold || 0;
  }, enumerable: false, configurable: true }), e2.prototype.createObserver = function(e3) {
    var t2 = this;
    if (this.observer && this.destroyObserver(), !this.frozen) {
      var n2;
      if (this.options = "function" == typeof (n2 = e3) ? { callback: n2 } : n2, this.callback = function(e4, n3) {
        t2.options.callback(e4, n3), e4 && t2.options.once && (t2.frozen = true, t2.destroyObserver());
      }, this.callback && this.options.throttle) {
        var o2 = (this.options.throttleOptions || {}).leading;
        this.callback = (function(e4, t3, n3) {
          var o3, r2, s2;
          void 0 === n3 && (n3 = {});
          var i22 = function(i3) {
            for (var c2 = [], a2 = 1; a2 < arguments.length; a2++) c2[a2 - 1] = arguments[a2];
            if (s2 = c2, !o3 || i3 !== r2) {
              var l2 = n3.leading;
              "function" == typeof l2 && (l2 = l2(i3, r2)), o3 && i3 === r2 || !l2 || e4.apply(void 0, wn([i3], s2, false)), r2 = i3, clearTimeout(o3), o3 = setTimeout((function() {
                e4.apply(void 0, wn([i3], s2, false)), o3 = 0;
              }), t3);
            }
          };
          return i22._clear = function() {
            clearTimeout(o3), o3 = null;
          }, i22;
        })(this.callback, this.options.throttle, { leading: function(e4) {
          return "both" === o2 || "visible" === o2 && e4 || "hidden" === o2 && !e4;
        } });
      }
      this.oldResult = void 0, this.observer = new IntersectionObserver((function(e4) {
        var n3 = e4[0];
        if (e4.length > 1) {
          var o3 = e4.find((function(e5) {
            return e5.isIntersecting;
          }));
          o3 && (n3 = o3);
        }
        if (t2.callback) {
          var r2 = n3.isIntersecting && n3.intersectionRatio >= t2.threshold;
          if (r2 === t2.oldResult) return;
          t2.oldResult = r2, t2.callback(r2, n3);
        }
      }), this.options.intersection), vt((function() {
        t2.observer && t2.observer.observe(t2.el);
      }));
    }
  }, e2.prototype.destroyObserver = function() {
    this.observer && (this.observer.disconnect(), this.observer = null), this.callback && this.callback._clear && (this.callback._clear(), this.callback = null);
  }, e2;
})(), On = { beforeMount: function(e2, t2) {
  var n2 = t2.value;
  n2 && ("undefined" == typeof IntersectionObserver ? void 0 : e2._vue_visibilityState = new Nn(e2, n2));
}, updated: function(e2, t2) {
  var n2 = t2.value;
  if (!En(n2, t2.oldValue)) {
    var o2 = e2._vue_visibilityState;
    n2 && o2 && o2.createObserver(n2);
  }
}, unmounted: function(e2) {
  var t2 = e2._vue_visibilityState;
  t2 && (t2.destroyObserver(), delete e2._vue_visibilityState);
} };
let workerApi;
let worker;
let emitter;
let terminate;
const _sfc_main = {
  name: "Render",
  emits: ["ready", "flappybird", "loaded"],
  props: {
    tier: {
      type: Number,
      default: 1
    },
    mobile: {
      type: Boolean,
      default: false
    },
    safari: {
      type: Boolean,
      default: false
    },
    modules: {
      type: Array,
      default: () => []
    },
    noWorker: {
      type: Boolean,
      default: false
    },
    payload: {
      type: Object,
      default: () => ({})
    }
  },
  directives: {
    ObserveVisibility: On,
    drag
  },
  data() {
    return {
      events: {},
      boundframe: void 0,
      loaded: false,
      mouse: {
        x: 0,
        y: 0
      },
      canvas: null,
      worker: null,
      dispatchModuleEvent: null,
      innerWidth: 0,
      innerHeight: 0,
      devicePixelRatio: 1,
      sharedBuffer: null,
      focus: true,
      quit: false,
      msPrev: 0,
      fps: 90,
      msPerFrame: 1e3 / 90,
      perf: null,
      orbit: null
    };
  },
  async mounted() {
    this.$lenisEmitter.on("mostViewable", (e2) => {
      if (e2.lerpedTimecode == 2) {
        this.$refs.canvas.style.zIndex = 0;
      } else {
        this.$refs.canvas.style.zIndex = -1;
      }
    });
    emitter = new EventTarget();
    let module;
    if (window.location.search.includes("no-load")) {
      return;
    }
    let safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const tier = await f$1({
      benchmarksURL: "/benchmarks"
    });
    const isTablet = window.innerWidth > 1024 && window.innerHeight > 768 || window.innerHeight > 1024;
    if (tier.isMobile && isTablet) {
      tier.tier = 1;
    }
    if (tier.isMobile) {
      tier.tier = 0;
    }
    if (tier.fps < 60) {
      tier.tier = 1;
    }
    if (tier.gpu?.toLowerCase().includes("swiftshader")) {
      tier.tier = 0;
    }
    if (tier.gpu?.includes("intel")) {
      tier.tier = 1;
    }
    if (tier.gpu?.includes("apple") && !tier.gpu?.includes("pro")) {
      tier.tier = 1;
    }
    if (tier.gpu?.includes("apple a1")) {
      tier.tier = 1;
    }
    if (tier.gpu?.includes("firepro d500")) {
      tier.tier = 1;
    }
    if (innerWidth <= 1680 && tier.gpu?.includes("apple") && navigator.hardwareConcurrency <= 8) {
      tier.tier = 1;
    }
    if (tier.gpu?.includes("mobile") && !tier.gpu?.includes("rtx")) {
      tier.tier = 1;
    }
    if (tier.gpu?.includes("iris")) {
      tier.tier = 1;
    }
    let isWorker = this.noWorker != true && !window.location.search.includes("no-worker") || window.location.search.includes("force-worker");
    let canvas = this.$refs.canvas;
    this.$refs.canvas.width = window.innerWidth;
    this.$refs.canvas.height = window.innerHeight;
    if (typeof canvas.transferControlToOffscreen !== "function") {
      isWorker = false;
    }
    if (!isWorker) {
      module = await __vitePreload(() => import("./BrjyQf75.js"), true ? __vite__mapDeps([0,1,2,3,4,5]) : void 0, import.meta.url);
      const RenderWorker = module.default;
      worker = new RenderWorker();
    } else {
      worker = new Worker(new URL(
        /* @vite-ignore */
        "" + new URL("render-dQnHK5xC.js", import.meta.url).href,
        import.meta.url
      ), {
        type: "module"
      });
      canvas = this.$refs.canvas.transferControlToOffscreen();
    }
    window.started = true;
    if (worker instanceof Worker) {
      workerApi = wrap(worker);
    } else {
      workerApi = worker;
    }
    document.hasFocus();
    workerApi.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", this.events["resize"] = () => {
      workerApi.setSize(window.innerWidth, window.innerHeight);
      workerApi.dispatchEvent("resize");
    });
    window.addEventListener("mousemove", this.events["mousemove"] = (e2) => {
      this.mouse.x = e2.clientX;
      this.mouse.y = e2.clientY;
      this.mouse.xScreen = e2.clientX / innerWidth * 2 - 1;
      this.mouse.yScreen = e2.clientY / innerHeight * 2 - 1;
      workerApi.dispatchEvent("mousemove", {
        clientX: e2.clientX,
        clientY: e2.clientY
      });
    });
    window.addEventListener("blur", this.events["blur"] = () => {
      workerApi.dispatchEvent("blur");
    });
    window.addEventListener("wheel", this.events["wheel"] = (e2) => {
      workerApi.dispatchEvent("wheel", {
        deltaX: e2.deltaX,
        deltaY: e2.deltaY
      });
    });
    window.addEventListener("focus", this.events["focus"] = () => {
      workerApi.dispatchEvent("focus");
    });
    window.addEventListener("touchstart", this.events["touchstart"] = () => {
      workerApi.dispatchEvent("mousedown");
    });
    window.addEventListener("touchmove", this.events["touchmove"] = (e2) => {
      this.mouse.x = e2.touches[0].clientX;
      this.mouse.y = e2.touches[0].clientY;
      this.mouse.xScreen = e2.touches[0].clientX / innerWidth * 2 - 1;
      this.mouse.yScreen = e2.touches[0].clientY / innerHeight * 2 - 1;
      workerApi.dispatchEvent("mousemove", {
        clientX: e2.touches[0].clientX,
        clientY: e2.touches[0].clientY
      });
    });
    window.addEventListener("touchend", this.events["touchend"] = () => {
      workerApi.dispatchEvent("mouseup");
    });
    window.addEventListener("mousedown", this.events["mousedown"] = (e2) => {
      workerApi.dispatchEvent("mousedown", {
        button: e2.button,
        clientX: e2.clientX,
        clientY: e2.clientY
      });
    });
    this.$refs.canvas.addEventListener("dragclick", this.events["dragclick"] = (e2) => {
      workerApi.dispatchEvent("click", {
        clientX: e2.detail.clientX,
        clientY: e2.detail.clientY
      });
      workerApi.dispatchEvent("mousemove", {
        clientX: e2.detail.clientX,
        clientY: e2.detail.clientY
      });
    });
    this.$refs.canvas.addEventListener("dragging", this.events["dragging"] = (e2) => {
      workerApi.dispatchEvent("drag", {
        deltaX: e2.detail.deltaX,
        deltaY: e2.detail.deltaY
      });
    });
    window.addEventListener("mouseup", this.events["mouseup"] = (e2) => {
      workerApi.dispatchEvent("mouseup", {
        clientX: e2.clientX,
        button: e2.button,
        clientY: e2.clientY
      });
    });
    window.addEventListener("pointerdown", this.events["pointerdown"] = (e2) => {
      workerApi.dispatchEvent("pointerdown", {
        clientX: e2.clientX,
        clientY: e2.clientY,
        button: e2.button,
        pointerId: e2.pointerId,
        pointerType: e2.pointerType
      });
    });
    window.addEventListener("pointermove", this.events["pointermove"] = (e2) => {
      workerApi.dispatchEvent("pointermove", {
        clientX: e2.clientX,
        clientY: e2.clientY,
        button: e2.button,
        pointerId: e2.pointerId,
        pointerType: e2.pointerType
      });
    });
    window.addEventListener("pointerup", this.events["pointerup"] = (e2) => {
      workerApi.dispatchEvent("pointerup", {
        clientX: e2.clientX,
        clientY: e2.clientY,
        button: e2.button,
        pointerId: e2.pointerId,
        pointerType: e2.pointerType
      });
    });
    window.addEventListener("pointercancel", this.events["pointercancel"] = (e2) => {
      workerApi.dispatchEvent("pointercancel", {
        clientX: e2.clientX,
        clientY: e2.clientY,
        pointerId: e2.pointerId,
        pointerType: e2.pointerType
      });
    });
    window.addEventListener("keydown", this.events["keydown"] = (e2) => {
      workerApi.dispatchEvent("keydown", {
        code: e2.code,
        key: e2.key
      });
    });
    window.addEventListener("keyup", this.events["keyup"] = (e2) => {
      workerApi.dispatchEvent("keyup", {
        code: e2.code,
        key: e2.key
      });
    });
    terminate = await workerApi.render(
      JSON.stringify(this.payload),
      JSON.stringify(this.modules),
      isWorker ? transfer(canvas, [canvas]) : canvas,
      proxy(() => {
        this.loaderCb();
      }),
      safari,
      tier.tier,
      tier.isMobile,
      proxy((type, data) => {
        const event = new CustomEvent(type, { detail: data });
        emitter.dispatchEvent(event);
        this.$emit(type, data);
      })
    );
    emitter.addEventListener("mouseenter", this.events["em_mouseenter"] = (e2) => {
      this.mouseOnHover = true;
    });
    emitter.addEventListener("mouseleave", this.events["em_mouseleave"] = (e2) => {
      this.mouseOnHover = false;
    });
    workerApi.setSize(window.innerWidth, window.innerHeight);
    workerApi.dispatchEvent("resize");
    this.dispatchModuleEvent = (moduleName, eventType, data) => {
      const event = new CustomEvent(`${moduleName}_${eventType}`, { detail: data });
      emitter.dispatchEvent(event);
    };
    this.$emit("ready", {
      dispatchModuleEvent: this.dispatchModuleEvent
    });
  },
  beforeUnmount() {
    cancelAnimationFrame(this.boundframe);
    window.removeEventListener("resize", this.events["resize"]);
    window.removeEventListener("mousemove", this.events["mousemove"]);
    window.removeEventListener("blur", this.events["blur"]);
    window.removeEventListener("focus", this.events["focus"]);
    window.removeEventListener("touchstart", this.events["touchstart"]);
    window.removeEventListener("touchmove", this.events["touchmove"]);
    window.removeEventListener("touchend", this.events["touchend"]);
    window.removeEventListener("mousedown", this.events["mousedown"]);
    window.removeEventListener("mouseup", this.events["mouseup"]);
    window.removeEventListener("pointerdown", this.events["pointerdown"]);
    window.removeEventListener("pointermove", this.events["pointermove"]);
    window.removeEventListener("pointerup", this.events["pointerup"]);
    window.removeEventListener("pointercancel", this.events["pointercancel"]);
    window.removeEventListener("dragclick", this.events["dragclick"]);
    window.removeEventListener("dragging", this.events["dragging"]);
    window.removeEventListener("keydown", this.events["keydown"]);
    window.removeEventListener("keyup", this.events["keyup"]);
    emitter.removeEventListener("em_mouseenter", this.events["em_mouseenter"]);
    emitter.removeEventListener("em_mouseleave", this.events["em_mouseleave"]);
    terminate?.();
    if (worker instanceof Worker) {
      worker.terminate();
    }
  },
  methods: {
    visibilityChanged(v2) {
      this.dispatchEvent(v2 ? "visible" : "hidden");
    },
    dispatchEvent(v2, payload) {
      workerApi?.dispatchEvent(v2, payload);
    },
    loaderCb() {
      this.$emit("loaded");
      this.loaded = true;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_observe_visibility = resolveDirective("observe-visibility");
  const _directive_drag = resolveDirective("drag");
  return openBlock(), createElementBlock("div", null, [
    withDirectives(createBaseVNode("canvas", {
      onContextmenu: _cache[0] || (_cache[0] = withModifiers(() => {
      }, ["prevent"])),
      style: normalizeStyle({
        opacity: $data.loaded ? 1 : 0
      }),
      ref: "canvas"
    }, null, 36), [
      [_directive_observe_visibility, $options.visibilityChanged],
      [_directive_drag]
    ])
  ]);
}
const Render = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-8f891b8b"]]);
const Render$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Render
}, Symbol.toStringTag, { value: "Module" }));
export {
  Render$1 as R,
  expose as e
};
