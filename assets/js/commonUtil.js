'use strict';

// Polyfills
(function Polyfills() {
  if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
      value: function (target) {
        if (target == null) throw new TypeError('Cannot convert undefined or null to object');
        const to = Object(target);
        for (let i = 1, len = arguments.length; i < len; i++) {
          if (arguments[i] == null) continue;
          const nextSource = arguments[i];
          const nextKeys = Object.keys(nextSource);
          for (let j = 0, len = nextKeys.length; j < len; j++) {
            const nextKey = nextKeys[j];
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
        return to;
      },
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      value: function (predicate) {
        if (this == null) throw TypeError('"this" is null or not defined');
        if (typeof predicate !== 'function') throw TypeError('predicate must be a function');
        const o = Object(this);
        const thisArg = arguments[1];
        let k = 0;
        while (k < o.length) {
          const kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) return kValue;
          k++;
        }
        return undefined;
      },
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
          i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }
})();

// Extensions
(function Extensions() {
  if (!String.format && !String.prototype.format) {
    Object.defineProperty(String, 'format', {
      value: function (str, col) {
        col = typeof col === 'object' ? col : [].slice.call(arguments, 1);
        return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
          if (m === '{{') return '{';
          if (m === '}}') return '}';
          return col[n] || '';
        });
      },
      enumerable: false,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(String.prototype, 'format', {
      value: function () {
        return String.format.bind(null, this.toString()).apply(null, arguments);
      },
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
})();

// Util
const util = {
  domReady: function (callback) {
    if (document.readyState !== 'loading') callback();
    else document.addEventListener('DOMContentLoaded', callback);
  },
  windowReady: function (callback) {
    if (document.readyState === 'complete') callback();
    else window.addEventListener('load', callback);
  },
  throttle: function (fn, mustRun, delay) {
    mustRun = mustRun || 150;
    delay = delay || delay === 0 ? delay : 100;
    let timer = null;
    let lastTime = 0;

    return function () {
      const context = this;
      const args = arguments;

      clearTimeout(timer);
      const now = new Date();
      if (now - lastTime >= mustRun) {
        lastTime = now;
        fn.apply(context, args);
      } else if (delay > 0) {
        timer = setTimeout(function () {
          timer = null;
          fn.apply(context, args);
        }, delay);
      }
    };
  },
  debounce: function (fn, delay) {
    delay = delay || 100;
    let timer = null;

    return function () {
      const context = this;
      const args = arguments;

      clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(context, args);
      }, delay);
    };
  },
  bindEvent: function (el, type, selector, fn) {
    el.addEventListener(type, function (e) {
      if (selector) {
        if (e.target.matches(selector)) {
          fn.call(e.target, e);
        }
      } else {
        fn(e);
      }
    });
  },
  dispatchEvent: function (el, type) {
    let ev;
    if (typeof Event === 'function') {
      ev = new Event(type);
    } else {
      ev = document.createEvent('Event');
      ev.initEvent(type, true, true);
    }
    el.dispatchEvent(ev);
  },
  forEach: function (arr, callback, scope) {
    if (!arr || !arr.length || !callback) return;
    for (let i = 0, len = arr.length; i < len; i++) {
      callback.call(scope, arr[i], i);
    }
  },
  mergeFuncs: function () {
    const funcs = [];
    util.forEach(arguments, function (fn) {
      if (typeof fn === 'function') funcs.push(fn);
    });
    return function () {
      util.forEach(funcs, function (fn) {
        fn.call(this, arguments);
      });
    };
  },
  pipe: function (/* functions */) {
    const funcs = [].slice.apply(arguments);
    return function (/* arguments */) {
      return funcs.reduce(
        function (args, f) {
          return [f.apply(this, args)];
        }.bind(this),
        [].slice.apply(arguments)
      )[0];
    }.bind(this);
  },
  deepCopy: function (obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
      return obj.reduce(function (arr, item, i) {
        arr[i] = util.deepCopy(item);
        return arr;
      }, []);
    }
    if (obj instanceof Object) {
      return Object.keys(obj).reduce(function (newObj, key) {
        newObj[key] = util.deepCopy(obj[key]);
        return newObj;
      }, {});
    }
  },
  deepFreeze: function (obj) {
    const propNames = Object.getOwnPropertyNames(obj);
    util.forEach(propNames, function (name) {
      const value = obj[name];
      if (value && typeof value === 'object') util.deepFreeze(value);
    });
    return Object.freeze(obj);
  },
  newEnum: function (seed) {
    const acc = {};
    util.forEach(Object.keys(seed), function (k) {
      const v = seed[k];
      if (v instanceof Array) acc[(seed[k] = v[0])] = { value: v[0], name: v[1], code: v[2] };
      else if (v instanceof Object) acc[(seed[k] = v.value)] = v;
      else acc[v] = { value: v, name: k.toLowerCase(), code: k.substring(0, 1) };
    });
    seed.prop = acc; // properties
    return util.deepFreeze(seed);
  },
};

// 轉換相關
util.convert = (function () {
  function obj2QueryString(params) {
    if (!params) return '';
    return Object.keys(params)
      .map(function (key) {
        return '{key}={value}'.format({
          key: encodeURIComponent(key),
          value: encodeURIComponent(params[key]).replace('/%20/g', '+'),
        });
      })
      .join('&');
  }

  function queryString2Obj(str) {
    if (!str) return {};
    return str.split('&').reduce(function (acc, params) {
      const p = params.split('=', 2);
      if (p.length > 1) acc[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
      return acc;
    }, {});
  }

  function json2ObjByKey(json, key) {
    if (!json) return {};
    key = key || 'id';
    return json.reduce(function (acc, obj) {
      const v = obj[key];
      if (v) acc[v] = Object.assign({}, acc[v], util.deepCopy(obj));
      return acc;
    }, {});
  }

  return {
    obj2QueryString: obj2QueryString,
    queryString2Obj: queryString2Obj,
    json2ObjByKey: json2ObjByKey,
  };
})();

// 陣列相關
util.arr = (function () {
  function slice(arr, start, end) {
    return arr.slice(start || 0, end || arr.length);
  }

  function find(arr, callback) {
    if (!arr) return null;
    return arr.find(callback);
  }

  function findObjByKey(arr, key, value) {
    return find(arr, function (obj) {
      return obj[key] === value;
    });
  }

  function filter() {}

  return {
    slice: slice,
    find: find,
    findObjByKey: findObjByKey,
    filter: filter,
  };
})();

// 日期相關
util.date = (function () {
  const _week = ['日', '一', '二', '三', '四', '五', '六'];

  function _checkZero(i) {
    return i < 10 ? '0' + i : i;
  }

  function get(date) {
    return date ? new Date(date) : new Date();
  }

  function format(date) {
    const _d = get(date);
    const obj = {
      yyyy: _d.getFullYear(),
      mm: _d.getMonth() + 1,
      dd: _d.getDate(),
      hour: _d.getHours(),
      minu: _d.getMinutes(),
      day: _week[_d.getDay()],
    };
    obj.ymd = '{yyyy}/{mm}/{dd}'.format({
      yyyy: obj.yyyy,
      mm: _checkZero(obj.mm),
      dd: _checkZero(obj.dd),
    });
    return obj;
  }

  return {
    get: get,
    format: format,
  };
})();

// 字串相關
util.str = (function () {
  function thousandSeparator(val) {
    if (!val) return val;
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
    // return Number(val).toLocaleString();
  }

  return {
    thousandSeparator: thousandSeparator,
  };
})();

// 數學相關
util.math = (function () {
  function getGCD(a, b) {
    return b ? getGCD(b, a % b) : a;
  }

  function reduceFraction(numerator, denominator) {
    const gcd = getGCD(numerator, denominator);
    return [numerator / gcd, denominator / gcd];
  }

  return {
    getGCD: getGCD,
    reduceFraction: reduceFraction,
  };
})();

// BOM相關
util.bom = (function () {
  const UA = (function () {
    const inBrowser = typeof window !== 'undefined';
    const UA = inBrowser && window.navigator.userAgent.toLowerCase();
    const isIE = UA && /msie|trident/.test(UA);
    const isEdge = UA && /edge\/\d+/.test(UA);
    const isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
    const isFF = UA && /firefox\/\d+/.test(UA);

    const inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
    const weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
    const isAndroid = (UA && /android/.test(UA)) || weexPlatform === 'android';
    const isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || weexPlatform === 'ios';

    return {
      isIE: isIE,
      isEdge: isEdge,
      isChrome: isChrome,
      isFF: isFF,
      isAndroid: isAndroid,
      isIOS: isIOS,
    };
  })();

  function notSupportIE() {
    if (UA.isIE || UA.isEdge) {
      util.modal.openError('notSupportIE', null, '您的瀏覽器過舊，請使用new Edge或Chrome以獲得更好的網站體驗。');
    }
  }

  let _urlParams = null;
  function getUrlParams(key) {
    if (!_urlParams) _urlParams = util.convert.queryString2Obj(window.location.search.substr(1));
    return key ? _urlParams[key] : Object.assign({}, _urlParams);
  }

  function updateHash(hash) {
    hash = hash ? '#' + encodeURI(hash) : window.location.pathname + window.location.search;
    window.history.replaceState(null, null, hash);
  }

  function redirectMemberLogin() {
    // Do Something
    window.location = '/memberLogin';
  }

  return {
    UA: UA,
    notSupportIE: notSupportIE,
    getUrlParams: getUrlParams,
    updateHash: updateHash,
    redirectMemberLogin: redirectMemberLogin,
  };
})();

// DOM相關
util.dom = (function () {
  function createElem(tag, html, attrs) {
    const el = document.createElement(tag);
    if (html) {
      if (html.nodeType === 1) insert(html, el);
      else el.innerHTML = html;
    }
    if (attrs) {
      util.forEach(Object.keys(attrs), function (key) {
        el.setAttribute(key, attrs[key]);
      });
    }
    return el;
  }
  function cloneElem(el) {
    const newEl = createElem(el.tagName, el.innerHTML);
    util.forEach(el.attributes, function (attr) {
      newEl.setAttribute(attr.name, attr.value);
    });
    return newEl;
  }
  function insert(el, parentNode, referenceNode) {
    // return el
    return (parentNode || document.body).insertBefore(el, referenceNode || null);
  }
  function insertPrev(el, refEl) {
    return insert(el, refEl.parentNode, refEl);
  }
  function insertNext(el, refEl) {
    return insert(el, refEl.parentNode, refEl.nextSibling);
  }
  function insertFirst(el, refEl) {
    return insert(el, refEl, refEl.firstChild);
  }
  function insertLast(el, refEl) {
    return insert(el, refEl);
  }
  function wrap(el, wrapper) {
    wrapper = wrapper || createElem('div');
    if (el.parentNode) el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    return wrapper;
  }
  function remove(el, parentNode) {
    parentNode = parentNode || el.parentNode;
    parentNode.removeChild(el);
  }
  function removeChild(parentNode) {
    while (parentNode.firstChild) {
      remove(parentNode.firstChild, parentNode);
    }
  }

  const _styleSheetSet = [];
  function addStyleSheet(styles, id) {
    id = id || 'default';
    if (!_styleSheetSet[id]) {
      _styleSheetSet[id] = createElem('style', null, {
        id: 'x-style-{0}'.format(id),
        type: 'text/css',
      });
      insert(_styleSheetSet[id], document.head);
    }
    _styleSheetSet[id].innerText += styles;
  }

  function _loadTag(tag, onLoadFunc) {
    if (onLoadFunc) tag.onload = onLoadFunc;
    insert(tag, document.head);
  }
  function loadStyleSheet(href, attrs, onLoadFunc) {
    attrs = Object.assign({ href: href, rel: 'stylesheet', type: 'text/css' }, attrs);
    _loadTag(createElem('link', null, attrs), onLoadFunc);
  }
  function loadScript(src, attrs, onLoadFunc) {
    attrs = Object.assign({ src: src }, attrs);
    _loadTag(createElem('script', null, attrs), onLoadFunc);
  }

  function nodeScriptReplace(node) {
    if (node.tagName === 'SCRIPT') {
      node.parentNode.replaceChild(cloneElem(node), node);
    } else {
      util.forEach(node.childNodes, function (children) {
        nodeScriptReplace(children);
      });
    }
    return node;
  }

  function getScrollPosition(el) {
    return {
      y: el ? el.scrollTop : document.documentElement.scrollTop || document.body.scrollTop || 0,
      x: el ? el.scrollLeft : document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    };
  }
  function setScrollPosition(el, y, x) {
    if (el) {
      if (y != null) el.scrollTop = y;
      if (x != null) el.scrollLeft = x;
    } else {
      if (y != null) {
        document.documentElement.scrollTop = y;
        document.body.scrollTop = y;
      }
      if (x != null) {
        document.documentElement.scrollLeft = y;
        document.body.scrollLeft = y;
      }
    }
  }
  function getOffset(el, wrapper) {
    const rect = el.getBoundingClientRect();
    const scrollPosition = getScrollPosition(wrapper);
    return {
      top: rect.top + scrollPosition.y,
      left: rect.left + scrollPosition.x,
    };
  }

  function regToggleBlock(el, opts, defaultShow) {
    opts = opts || {};
    opts.ms = opts.ms || 300;

    const showFunc = util.mergeFuncs(function () {
      if (opts.activeClass) el.classList.add(opts.activeClass);
      if (opts.hideClass) el.classList.remove(opts.hideClass);
    }, opts.showFunc);
    const hideFunc = util.mergeFuncs(function () {
      if (opts.activeClass) el.classList.remove(opts.activeClass);
      if (opts.hideClass) el.classList.add(opts.hideClass);
    }, opts.hideFunc);

    if (el.style.display === 'none') el.style.display = null;

    if (!defaultShow) {
      el.classList.add('x-hide');
      if (opts.hideClass) el.classList.add(opts.hideClass);
    }

    let timer = null;
    return function (show) {
      clearTimeout(timer);
      if (show) {
        if (el.classList.contains('x-hide')) {
          el.classList.remove('x-hide');
          timer = setTimeout(function () {
            showFunc();
          }, 50);
        } else {
          showFunc();
        }
      } else {
        hideFunc();

        timer = setTimeout(function () {
          timer = null;
          el.classList.add('x-hide');
        }, opts.ms);
      }
    };
  }

  function _getTransitionStyle(el) {
    const _style = window.getComputedStyle(el, null);
    return {
      hasDefault: !_style.transition && _style.transition !== 'all 0s ease 0s',
      property: _style.transitionProperty,
      duration: _style.transitionDuration,
      tf: _style.transitionTimingFunction,
      delay: _style.transitionDelay,
    };
  }

  function regToggleFade(el, opts, defaultShow) {
    opts = opts || {};
    opts.ms = opts.ms || 300;
    opts.tf = opts.tf || 'ease';
    opts.hideClass = 'x-hideFade';

    const _t = _getTransitionStyle(el);

    if (_t.hasDefault) {
      el.style['transitionProperty'] = _t.property + ',opacity,visibility';
      el.style['transitionDuration'] = _t.duration + ',{0}ms,0s'.format(opts.ms);
      el.style['transitionTimingFunction'] = _t.tf + ',{0},{0}'.format(opts.tf);
    } else {
      el.style['transitionProperty'] = 'opacity,visibility';
      el.style['transitionDuration'] = '{0}ms,0s'.format(opts.ms);
      el.style['transitionTimingFunction'] = '{0},{0}'.format(opts.tf);
    }

    opts.showFunc = util.mergeFuncs(function () {
      el.style['transitionDelay'] = _t.hasDefault ? _t.delay + ',0s,0s' : '0s,0s';
    }, opts.showFunc);
    opts.hideFunc = util.mergeFuncs(function () {
      el.style['transitionDelay'] = (_t.hasDefault ? _t.delay + ',0s,{0}ms' : '0s,{0}ms').format(opts.ms);
    }, opts.hideFunc);

    return regToggleBlock(el, opts, defaultShow);
  }

  function regToggleHeight(el, opts, defaultShow) {
    opts = opts || {};
    opts.ms = opts.ms || 300;
    opts.tf = opts.tf || 'ease';
    el.classList.add('x-ToggleHeight');

    const _t = _getTransitionStyle(el);
    if (_t.hasDefault) {
      el.style['transitionProperty'] = _t.property + ',max-height';
      el.style['transitionDuration'] = _t.duration + ',{0}ms,0s'.format(opts.ms);
      el.style['transitionTimingFunction'] = _t.tf + ',{0},{0}'.format(opts.tf);
    } else {
      el.style['transitionProperty'] = 'max-height';
      el.style['transitionDuration'] = '{0}ms,0s'.format(opts.ms);
      el.style['transitionTimingFunction'] = '{0},{0}'.format(opts.tf);
    }

    opts.showFunc = util.mergeFuncs(function () {
      el.style.maxHeight = el.scrollHeight + 'px';
    }, opts.showFunc);
    opts.hideFunc = util.mergeFuncs(function () {
      el.style.maxHeight = null;
    }, opts.hideFunc);

    return regToggleBlock(el, opts, defaultShow);
  }

  addStyleSheet(
    [
      '.x-hide{display:none!important}',
      '.x-hideFade{opacity:0;visibility:hidden}',
      '.x-ToggleHeight{max-height:0;overflow:hidden}',
    ].join('')
  );

  return {
    createElem: createElem,
    cloneElem: cloneElem,
    insert: insert,
    insertPrev: insertPrev,
    insertNext: insertNext,
    insertFirst: insertFirst,
    insertLast: insertLast,
    wrap: wrap,
    remove: remove,
    removeChild: removeChild,
    addStyleSheet: addStyleSheet,
    loadStyleSheet: loadStyleSheet,
    loadScript: loadScript,
    nodeScriptReplace: nodeScriptReplace,
    getScrollPosition: getScrollPosition,
    setScrollPosition: setScrollPosition,
    getOffset: getOffset,
    regToggleBlock: regToggleBlock,
    regToggleFade: regToggleFade,
    regToggleHeight: regToggleHeight,
  };
})();

// 圖片相關
util.img = (function () {
  function preload(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.src = src;
    img.onerror = onLoad;
    img.onload = onLoad;
  }

  function onError(img) {
    img.onerror = null;
    img.src = '/assets/images/nopic.jpg';
  }

  function onLoad(img) {
    const parentNode = img.parentNode.clientHeight > 0 ? img.parentNode : img.parentNode.parentNode; // 找出父節點
    const parentRadio = parentNode.clientHeight / parentNode.clientWidth; // 父節點比例
    const targetRadio = img.clientHeight / img.clientWidth; // 圖片比例
    // 比例小於父節點 套用高滿版 (預設寬滿版)
    if (targetRadio < parentRadio) img.classList.add('portrait');
    else img.classList.remove('portrait');
  }

  const _radioClasses = [];
  function addRadioStyle(x, y) {
    let className = '';
    const rf = util.math.reduceFraction(x, y);
    const ratio = (rf[1] / rf[0]).toFixed(4) * 100;
    if (!isNaN(ratio)) {
      className = 'x-pic-{0}-{1}'.format(rf[0], rf[1]);
      if (_radioClasses.indexOf(className) === -1) {
        _radioClasses.push(className);
        util.dom.addStyleSheet('.{0}::before{content:"";display:block;padding-top:{1}%}'.format(className, ratio));
      }
    }
    return className;
  }

  util.dom.addStyleSheet(
    [
      '.x-pic{position:relative;display:block;overflow:hidden}',
      '.x-pic img{position:absolute;top:-100%;bottom:-100%;right:-100%;left:-100%;margin:auto;width:100%;height:auto}',
      '.x-pic img.portrait{width:auto;height:100%}',
    ].join('')
  );

  return {
    preload: preload,
    onError: onError,
    onLoad: onLoad,
    addRadioStyle: addRadioStyle,
  };
})();

// 處理控制相關
util.processControl = (function () {
  const _set = {};

  function init(name, prop) {
    return new Promise(function (resolve) {
      if (!_set[name]) {
        _set[name] = {
          count: 0,
          isProcessing: false,
        };
        Object.assign(_set[name], prop);
      }
      resolve(_set[name]);
    });
  }

  function _canStart(name, callback) {
    const obj = _set[name];
    let pass = !obj.isProcessing;

    if (pass && obj.limit) {
      pass = obj.count < obj.limit;
    }

    if (pass) {
      obj.count++;
      obj.isProcessing = true;

      if (callback) callback();
    }

    return pass;
  }

  function _done(name, callback) {
    _set[name].isProcessing = false;
    if (callback) callback();
  }

  function check(name, prop) {
    return init(name, prop).then(function (obj) {
      return {
        canStart: _canStart.bind(null, name),
        done: _done.bind(null, name),
      };
    });
  }

  function checkOnce(name) {
    const prop = {
      limit: 1,
    };
    return check(name, prop);
  }

  function leastLoading(ms) {
    let pass = false;
    setTimeout(function () {
      pass = true;
    }, ms || 500);

    return function (callback) {
      let timer = setInterval(function () {
        if (pass) {
          clearInterval(timer);
          callback();
        }
      }, 100);
    };
  }

  function showLog() {
    console.table(_set);
  }

  return {
    showLog: showLog,
    check: check,
    checkOnce: checkOnce,
    leastLoading: leastLoading,
  };
})();

// AJAX
util.ajax = (function () {
  const _newXHR =
    window.XMLHttpRequest && (window.location.protocol !== 'file:' || !window.ActiveXObject)
      ? function () {
          return new XMLHttpRequest();
        }
      : function () {
          try {
            return new ActiveXObject('Microsoft.XMLHTTP');
          } catch (e) {
            throw new Error('XMLHttpRequest not supported');
          }
        };

  const _forceRefresh = util.bom.getUrlParams('Refresh') === '1';

  function _ajax(opts) {
    return new Promise(function (resolve, reject) {
      if (!opts.url) {
        reject({
          status: 404,
          statusText: 'Not Found',
        });
      }

      opts.method = opts.method || 'GET';
      opts.headers = opts.headers || { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };

      let url = opts.url;
      let body = null;

      if (opts.params) {
        let params = opts.params;
        if (typeof params === 'object') {
          params = util.convert.obj2QueryString(params);
        }

        if (_forceRefresh) {
          params += '&Refresh=1';
        }

        switch (opts.method) {
          case 'GET':
            url = '{0}?{1}&timestamp={2}'.format(opts.url, params, new Date().getTime());
            break;
          default:
            body = params;
            break;
        }
      }

      const xhr = _newXHR();
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 400) {
          let res;

          try {
            res = JSON.parse(this.response);
          } catch (e) {
            res = this.response;
          }

          resolve({
            status: this.status,
            statusText: this.statusText,
            data: res.Data !== undefined ? res.Data : res,
          });
        } else {
          reject({
            status: this.status,
            statusText: this.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: this.statusText,
        });
      };
      xhr.open(opts.method, url, true);
      util.forEach(Object.keys(opts.headers), function (name) {
        xhr.setRequestHeader(name, opts.headers[name]);
      });
      xhr.send(body);
    });
  }

  function ajax(method, url, params, successFunc, errorFunc) {
    const promise = _ajax({
      method: method,
      url: url,
      params: params,
    });

    if (successFunc) {
      return promise.then(successFunc).catch(errorFunc || errorHandler());
    }

    return promise;
  }

  const _httpErrorTemp = {
    '401': function () {
      util.modal.open('loginYet');
    },
    other: function () {
      util.modal.open('systemBusy');
    },
  };

  // 錯誤處理
  function errorHandler(customError) {
    return function (err) {
      const httpError = Object.assign({}, _httpErrorTemp, customError);

      if (httpError[err.status]) {
        httpError[err.status]();
      } else {
        httpError['other']();
      }
    };
  }

  return {
    errorHandler: errorHandler,
    get: ajax.bind(null, 'GET'),
    post: ajax.bind(null, 'POST'),
  };
})();

// 錨點相關
util.anchor = (function () {
  let _defaultRoot = true;
  let _rootEl = null;
  function getRootEl() {
    return _defaultRoot ? document.documentElement || document.body : _rootEl;
  }
  function setRootEl(el) {
    if (el) {
      _rootEl = el;
      _defaultRoot = false;
    } else {
      _rootEl = null;
      _defaultRoot = true;
    }
  }

  let _fixedHeader = null;
  function setFixedHeader(el) {
    if (el) _fixedHeader = el;
  }

  let _wrapper = null;
  function setWrapper(el) {
    if (el) _wrapper = el;
  }

  function getElementTop(el) {
    if (!el) return null;
    let scrollY = el.offsetTop; // util.dom.getOffset(el, _rootEl).top;
    if (el.offsetParent) scrollY += el.offsetParent.offsetTop;
    if (_fixedHeader) scrollY -= _fixedHeader.offsetHeight;
    if (_wrapper) scrollY -= _wrapper.offsetTop;
    return scrollY;
  }

  function _getAnchorEl(selector) {
    if (!selector || selector === '#') return null;
    if (selector.nodeType === 1) return selector;

    let hash = decodeURI(selector.substr(1));
    hash = hash.replace(/"/g, '\\"');
    const alias = '[data-anchor-alias="{0}"]'.format(hash);

    let el = null;
    try {
      el = document.querySelector(selector) || document.querySelector(alias);
    } catch (error) {
      el = document.querySelector(alias);
    }
    return el;
  }
  function _getAnchorElHash(el) {
    if (!el) return null;
    return el.getAttribute('data-anchor-alias') || el.id;
  }

  function _updateHashControl(hash, force) {
    util.processControl.check('anchor-updateHashControl').then(function (process) {
      let run = null;
      if (force) {
        util.bom.updateHash(hash);
        // 阻止區塊滾動覆蓋UrlHash
        run = util.processControl.leastLoading(200)(process.done);
      } else {
        run = function () {
          util.bom.updateHash(hash);
          process.done();
        };
      }
      process.canStart(run);
    });
  }

  // 滾動至
  function scrollTo(selector, duration, callback) {
    const targetAnchor = _getAnchorEl(selector);
    if (!targetAnchor) return;

    callback = util.mergeFuncs(function () {
      _updateHashControl(_getAnchorElHash(targetAnchor), true);
    }, callback);
    _scrollTo(getElementTop(targetAnchor), duration, callback);
  }
  // 置頂
  function scrollTop(duration, callback) {
    callback = util.mergeFuncs(function () {
      _updateHashControl(null, true);
    }, callback);
    _scrollTo(0, duration, callback);
  }
  // 滾動至 (rootEl, 位置, 持續時間, 回呼函式)
  function _scrollTo(to, duration, callback) {
    if (to == null) return;
    const rootEl = _rootEl;
    const start = util.dom.getScrollPosition(rootEl).y;
    const change = to - start;
    const startDate = +new Date();

    if (duration === 0) {
      util.dom.setScrollPosition(rootEl, to);
      if (callback) callback();
      return true;
    }

    duration = duration || 500;

    const easeInOutQuad = function (t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t -= 1;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };
    const animateScroll = function () {
      const currentDate = +new Date();
      const currentTime = currentDate - startDate;
      util.dom.setScrollPosition(rootEl, parseInt(easeInOutQuad(currentTime, start, change, duration), 10));
      if (currentTime < duration) {
        requestAnimationFrame(animateScroll);
      } else {
        util.dom.setScrollPosition(rootEl, to);
        if (callback) callback();
      }
    };
    animateScroll();
  }

  // 處理錨點連結
  function processLinks(links, duration, callback) {
    const anchorLinks = links || document.querySelectorAll('a[href^="#"]');
    util.forEach(anchorLinks, function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const anchorID = e.target.getAttribute('data-anchor') || e.target.getAttribute('href');
        scrollTo(anchorID, duration, callback);
      });
    });
  }

  // 區塊錨點
  const _sections = [];
  function setSections(id) {
    if (!!id && _sections.indexOf(id) === -1) _sections.push(id);
  }
  function setSectionsData(el) {
    // TODO: 設定初始數據
    setSections(el.id);
  }
  let _sectionsScrollHandler = null;
  function _scrollHashHandler(e) {
    const rootTop = util.dom.getScrollPosition(_rootEl).y;
    const rootEl = getRootEl();
    const rootBottom = rootTop + rootEl.offsetHeight;
    let targetHash = null;

    // TODO: 可優化 記錄順序等...
    for (let i = 0, sectionID; (sectionID = _sections[i]); i++) {
      const el = document.getElementById(sectionID);
      if (el) {
        const elTop = getElementTop(el);
        const elBottom = elTop + el.offsetHeight;

        // TODO: 顯示條件可優化
        if (elTop < rootBottom && elBottom > rootTop) {
          targetHash = _getAnchorElHash(el);
          break;
        }
      }
    }
    _updateHashControl(targetHash);
  }
  // 處理錨點區塊
  function processSections(sectionEls) {
    sectionEls = sectionEls || document.querySelectorAll('section');
    if (sectionEls && sectionEls.length > 0) {
      util.forEach(sectionEls, function (sectionEl) {
        setSectionsData(sectionEl);
      });

      if (!_sectionsScrollHandler) {
        // 區塊錨點處理
        _sectionsScrollHandler = util.throttle(_scrollHashHandler);
        (_defaultRoot ? document : _rootEl).addEventListener('scroll', _sectionsScrollHandler);
      }
    }
  }

  // 初始錨點定位
  let _defaultHash = null;
  if (window.location.hash) {
    _defaultHash = window.location.hash;
    util.domReady(function () {
      // util.bom.updateHash();
      // _scrollTo(0, 0);
      untilDefault(0);
    });
  }
  function untilDefault(duration) {
    if (!_defaultHash) return false;
    util.processControl.check('anchor-untilDefault', { limit: 20 }).then(function (process) {
      if (!process.canStart()) return false;
      // 每次最少執行秒數
      const leastLoading = util.processControl.leastLoading(100);
      // 錨點目標
      const anchorTarget = _getAnchorEl(_defaultHash);
      let anchorTargetTop = getElementTop(anchorTarget);
      // 直到錨點函式
      const untilFunc = leastLoading.bind(null, function () {
        let next = null;
        anchorTargetTop = getElementTop(anchorTarget);
        const scrollY = util.dom.getScrollPosition(_rootEl).y;

        // 如果錨點還沒生成 或還沒定位 (定位則停止，容忍誤差)
        if (anchorTargetTop == null || util.pipe(Math.abs, Math.floor)(anchorTargetTop - scrollY) > 0) {
          // 再延遲執行一次
          next = function () {
            setTimeout(function () {
              untilDefault(duration);
            }, 200);
          };
        }

        process.done(next);
      });

      // 目標不存在 或 目標無法置頂
      if (anchorTargetTop === null || anchorTargetTop > getRootEl().scrollHeight - window.innerHeight) {
        untilFunc();
      } else {
        scrollTo(anchorTarget, duration, untilFunc);
      }
    });
  }

  return {
    getRootEl: getRootEl,
    setRootEl: setRootEl,
    setFixedHeader: setFixedHeader,
    setWrapper: setWrapper,
    getElementTop: getElementTop,
    scrollTo: scrollTo,
    scrollTop: scrollTop,
    processLinks: processLinks,
    setSections: setSections,
    setSectionsData: setSectionsData,
    processSections: processSections,
    untilDefault: untilDefault,
  };
})();

// 模態框
util.modal = (function () {
  // 模態框樣式名
  const modalClasses = {
    backdrop: 'x-modal__backdrop',
    backdrop_active: 'x-modal__backdrop--active',
    backdrop_error: 'x-modal__backdrop--error',
    block: 'x-modal__block',
    content: 'x-modal__content',
    contentHeader: 'x-modal__content__header',
    contentBody: 'x-modal__content__body',
    contentFooter: 'x-modal__content__footer',
    closeBtn: 'x-modal__close',
    btn: 'x-modal__btn',
    btn_confirm: 'x-modal__btn--confirm',
    btn_cancel: 'x-modal__btn--cancel',
  };

  function Modal(parentNode) {
    this.clickEventHandler = this.clickEventHandler.bind(this);
    this.create(parentNode);
  }
  Modal.prototype.init = function () {
    this.target = null; // 目標容器(背景)
    this.block = null; // 區塊(框)
    this.mainContent = null; // 顯示內容
    this.closeBtn = null; // 關閉按鈕
    this.switchFunc = null; // 切換顯示
    this.onClose = null; // 關閉時的回呼函式
    this.onConfirm = null; // 確認時的回呼函式
    this.onCancel = null; // 取消時的回呼函式
  };
  Modal.prototype.destroy = function () {
    if (this.target) {
      this.target.removeEventListener('click', this.clickEventHandler);
      util.dom.remove(this.target);
      this.init();
    }
  };
  Modal.prototype.create = function (parentNode) {
    if (!this.target) {
      this.init();
      // 目標容器(背景)
      this.target = util.dom.createElem('div', null, { class: modalClasses.backdrop });
      // 區塊(框)
      this.block = util.dom.createElem('div', null, { class: modalClasses.block });
      // 顯示內容
      this.mainContent = util.dom.createElem('div', null, { class: modalClasses.content });
      // 關閉按鈕
      this.closeBtn = util.dom.createElem('div', '&times;', { class: modalClasses.closeBtn });
      // 組合模態框
      util.dom.insert(this.mainContent, this.block);
      util.dom.insert(this.closeBtn, this.block);
      util.dom.insert(this.block, this.target);
      util.dom.insert(this.target, parentNode);

      // 註冊切換顯示
      this.switchFunc = util.dom.regToggleFade(this.target, { activeClass: modalClasses.backdrop_active }, false);
      // 註冊監聽
      this.target.addEventListener('click', this.clickEventHandler);
    }
  };
  Modal.prototype.initContent = function (html) {
    util.dom.removeChild(this.mainContent);
    this.mainContent.innerHTML = html;
  };
  Modal.prototype.clickEventHandler = function (e) {
    e.stopPropagation();
    const targetEl = e.target;
    const classList = targetEl.classList;
    // 關閉
    if (classList.contains(modalClasses.closeBtn) || classList.contains(modalClasses.backdrop)) {
      this.close();
    }
    // 確認
    else if (classList.contains(modalClasses.btn_confirm)) {
      if (this.onConfirm) this.onConfirm();
      this.close();
    }
    // 取消
    else if (classList.contains(modalClasses.btn_cancel)) {
      if (this.onCancel) this.onCancel();
      this.close();
    }
  };
  Modal.prototype.close = function () {
    if (this.switchFunc) this.switchFunc(false);
    if (this.onClose) this.onClose();
  };
  Modal.prototype.open = function () {
    if (this.switchFunc) this.switchFunc(true);
  };
  Modal.prototype.addCloseHandler = function (fn) {
    this.onClose = util.mergeFuncs(this.onClose, fn);
  };
  Modal.prototype.addConfirmHandler = function (fn) {
    this.onConfirm = util.mergeFuncs(this.onConfirm, fn);
  };
  Modal.prototype.addCancelHandler = function (fn) {
    this.onCancel = util.mergeFuncs(this.onCancel, fn);
  };

  // 內容模板
  const contentTemplate = {
    base: function (title, content, classes) {
      title = title || '提示訊息';
      classes = classes || {
        header: 'text-center',
      };
      return [
        "<div class='{1} {2}'><span>{0}</span></div>".format(title, modalClasses.contentHeader, classes.header || ''),
        "<div class='{1} {2}'><span>{0}</span></div>".format(content, modalClasses.contentBody, classes.body || ''),
      ].join('');
    },
  };

  // 集合
  const set = {};

  function open(name) {
    if (set[name]) set[name].open();
  }
  function close(name) {
    if (set[name]) set[name].close();
  }
  function addCloseHandler(name, fn) {
    if (set[name]) set[name].addCloseHandler(fn);
  }

  // 模態框類型
  const TYPE = util.newEnum({
    ALERT: 0,
    ERROR: 1,
    CONFIRM: 2,
  });

  function fetch(name, parentNode) {
    return new Promise(function (resolve, reject) {
      if (!set[name]) set[name] = new Modal(parentNode);
      resolve(set[name]);
    });
  }

  function create(opts) {
    // opts = { type, name, html, title, msg, templateType, parentNode, confirmText, confirmFunc, cancelText, cancelFunc };
    return fetch(opts.name, opts.parentNode).then(function (modal) {
      if (!modal.mainContent.firstChild && (opts.msg || opts.html)) {
        if (!opts.html) {
          opts.templateType = opts.templateType || 'base';
          opts.html = contentTemplate[opts.templateType](opts.title, opts.msg);
        }
        modal.initContent(opts.html);

        switch (opts.type) {
          case TYPE.ERROR:
            modal.target.classList.add(modalClasses.backdrop_error);
            break;

          case TYPE.CONFIRM:
            if (opts.confirmFunc) modal.addConfirmHandler(opts.confirmFunc);
            if (opts.cancelFunc) modal.addCloseHandler(opts.cancelFunc);

            const footer = util.dom.createElem('div', null, { class: modalClasses.contentFooter });
            const confirmBtn = util.dom.createElem('div', opts.confirmText || '確認', {
              class: '{0} {1}'.format(modalClasses.btn, modalClasses.btn_confirm),
            });
            const cancelBtn = util.dom.createElem('div', opts.cancelText || '取消', {
              class: '{0} {1}'.format(modalClasses.btn, modalClasses.btn_cancel),
            });
            util.dom.insert(confirmBtn, footer);
            util.dom.insert(cancelBtn, footer);
            util.dom.insert(footer, modal.mainContent);
            break;

          case TYPE.ALERT:
          default:
            break;
        }
      }

      return modal;
    });
  }

  function _createThenOpen(type, name, title, msg) {
    const opts = { type: type, name: name, title: title, msg: msg };
    return create(opts).then(function (modal) {
      modal.open();
      return modal;
    });
  }

  // 初始模態框樣式
  util.dom.addStyleSheet(
    [
      '.{backdrop}{z-index:1040;position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;display:block;background-color:rgba(18,18,18,.5)}',
      '.{backdrop_error}{z-index:1041}',
      '.{backdrop_active}>.{block}{transform:translateX(-50%) translateY(-50%)}',
      '.{block}{position:absolute;top:50%;left:50%;transform:translateX(-50%) translateY(-70%);transition:transform .5s ease}',
      '.{closeBtn}{position:absolute;top:15px;right:15px;width:15px;height:15px;line-height:15px;text-align:center;font-size:24px;cursor:pointer}',
      '.{content}{position:relative;background-clip:padding-box;border-radius:5px;border:none;background-color:#fff;box-shadow: 0 0px 20px rgba(0,0,0,.2);overflow:hidden;outline:0}',
      '.{contentHeader}{padding:15px 15px 10px;border-bottom:1px solid #999}',
      '.{contentHeader}>*{font-size:18px;font-weight:700;}',
      '.{contentBody}{box-sizing:border-box;padding:15px;min-width:300px;max-width:90vw;min-height:70px;max-height:80vh;overflow:auto}',
      '.{contentFooter}{padding:10px 15px 15px;display:flex;justify-content:flex-end;align-items:center}',
      '.{btn}{padding:5px 10px;border-radius:3px;border:1px solid #999;cursor:pointer}',
      '.{btn}:hover{background-color:#eee}',
      '.{btn}+.{btn}{margin-left:10px}',
      '.text-center{text-align:center}',
      '.align-center{display:flex;align-items:center}',
      '.flex-center{display:flex;align-items:center;justify-content:center}',
    ]
      .join('')
      .format(modalClasses)
  );

  // 常用模態框
  util.domReady(function () {
    create({
      type: TYPE.CONFIRM,
      name: 'loginYet',
      title: '尚未登入',
      msg: '請先登入會員，再進行操作。<br/>立即導轉至登入頁?',
      confirmFunc: util.bom.redirectMemberLogin,
    });
    create({ type: TYPE.ERROR, name: 'systemBusy', msg: '系統忙碌中，請稍後再試！' });
  });

  return {
    TYPE: TYPE,
    contentTemplate: contentTemplate,
    set: set,
    open: open,
    close: close,
    addCloseHandler: addCloseHandler,
    fetch: fetch,
    create: create,
    openAlert: _createThenOpen.bind(null, TYPE.ALERT),
    openError: _createThenOpen.bind(null, TYPE.ERROR),
    openConfirm: _createThenOpen.bind(null, TYPE.CONFIRM),
  };
})();
