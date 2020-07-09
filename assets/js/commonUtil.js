'use strict';

(function StringFormat() {
  String.format = function (str, col) {
    col = typeof col === 'object' ? col : [].slice.call(arguments, 1);
    return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
      if (m === '{{') return '{';
      if (m === '}}') return '}';
      return col[n] || '';
    });
  };
  String.prototype.format = function () {
    return String.format.bind(null, this.toString()).apply(null, arguments);
  };
})();

(function Polyfills() {
  if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      const to = Object(target);
      [].forEach.call([].slice.call(arguments, 1), function (nextSource) {
        if (nextSource != null) {
          [].forEach.call(Object.keys(nextSource), function (nextKey) {
            to[nextKey] = nextSource[nextKey];
          });
        }
      });
      return to;
    };
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
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) return kValue;
          k++;
        }
        return undefined;
      },
      configurable: true,
      writable: true,
    });
  }
})();

// Util
const util = {
  domReady: function (callback) {
    return new Promise(function (resolve) {
      const func = function () {
        if (callback) callback();
        resolve();
      };
      if (document.readyState !== 'loading') func();
      else document.addEventListener('DOMContentLoaded', func);
    });
  },
  windowReady: function (callback) {
    return new Promise(function (resolve) {
      const func = function () {
        if (callback) callback();
        resolve();
      };
      if (document.readyState === 'complete') func();
      else window.addEventListener('load', func);
    });
  },
  throttle: function (func, mustRun, delay) {
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
        func.apply(context, args);
      } else if (delay > 0) {
        timer = setTimeout(function () {
          timer = null;
          func.apply(context, args);
        }, delay);
      }
    };
  },
  debounce: function (func, delay) {
    delay = delay || 100;
    let timer = null;

    return function () {
      const context = this;
      const args = arguments;

      clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        func.apply(context, args);
      }, delay);
    };
  },
  pipe: function (/* functions */) {
    const fns = [].slice.apply(arguments);
    return function (/* arguments */) {
      return fns.reduce(
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
  newEnum: function (seed) {
    // properties
    seed.prop = Object.keys(seed).reduce(function (acc, k) {
      const v = seed[k];
      if (v instanceof Array) acc[(seed[k] = v[0])] = { value: v[0], name: v[1], code: v[2] };
      else acc[v] = { value: v, name: k.toLowerCase(), code: k.substring(0, 1) };
      return acc;
    }, {});
    return Object.freeze ? Object.freeze(seed) : seed;
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
    return json.reduce(function (acc, obj) {
      if (obj[key]) acc[obj[key]] = !acc[obj[key]] ? obj : Object.assign({}, acc[obj[key]], obj);
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
  // slice (淺拷貝)
  function slice(arr, start, end) {
    return arr.slice(start || 0, end || arr.length);
  }
  // find (傳參考)
  function find(arr, callback) {
    return arr.find(callback);
  }

  function limit(arr, end) {
    return slice(arr, 0, end);
  }

  function findObjByKey(arr, key, value) {
    return find(arr, function (obj) {
      return obj[key] === value;
    });
  }

  return {
    slice: slice,
    limit: limit,
    find: find,
    findObjByKey: findObjByKey,
  };
})();

// 日期相關
util.date = (function () {
  const week = ['日', '一', '二', '三', '四', '五', '六'];

  function get(date) {
    return date ? new Date(date) : new Date();
  }

  function checkZero(i) {
    return i < 10 ? '0' + i : i;
  }

  function format(date) {
    const _d = get(date);
    const obj = {
      yyyy: _d.getFullYear(),
      mm: _d.getMonth() + 1,
      dd: _d.getDate(),
      hour: _d.getHours(),
      minu: _d.getMinutes(),
      day: week[_d.getDay()],
    };
    obj.ymd = '{yyyy}/{mm}/{dd}'.format({
      yyyy: obj.yyyy,
      mm: checkZero(obj.mm),
      dd: checkZero(obj.dd),
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
  // 千位符
  function thousandSeparator(val) {
    if (!val) return val;
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
    // return Number(val).toLocaleString();
  }

  return {
    thousandth: thousandSeparator,
  };
})();

// 數學相關
util.math = (function () {
  // 最大公約數
  function getGCD(a, b) {
    return b ? getGCD(b, a % b) : a;
  }
  // 最簡分數
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
  const urlParams = util.convert.queryString2Obj(window.location.search.substr(1));

  function getUrlParams(key) {
    return key ? urlParams[key] : Object.assign({}, urlParams);
  }

  function updateHash(hash) {
    hash = hash ? '#' + hash : window.location.pathname + window.location.search;
    window.history.replaceState(null, null, hash);
  }

  function notSupportIE() {
    const userAgent = window.navigator.userAgent;
    const isIE = userAgent.indexOf('MSIE') > 0 || userAgent.indexOf('Trident/') > 0;
    const isEdge = userAgent.indexOf('Edge/') > 0;

    if (isIE || isEdge) {
      util.modal.openError('notSupportIE', null, '您的瀏覽器過舊，請使用new Edge或Chrome以獲得更好的網站體驗。');
    }
  }

  function redirectMemberLogin() {
    // Do Something
    window.location = '/memberLogin';
  }

  return {
    getUrlParams: getUrlParams,
    updateHash: updateHash,
    notSupportIE: notSupportIE,
    redirectMemberLogin: redirectMemberLogin,
  };
})();

// DOM相關
util.dom = (function () {
  let styleSheet = null;

  function addStyleSheet(styles) {
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.type = 'text/css';
      document.head.appendChild(styleSheet);
    }
    styleSheet.innerText += styles;
  }

  function loadStyleSheet(href) {
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    document.head.appendChild(link);
  }

  function loadScript(src, onLoadFunc) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = function () {
      if (onLoadFunc) onLoadFunc();
    };
    document.head.appendChild(script);
  }

  function nodeScriptClone(node) {
    const script = document.createElement('script');
    script.text = node.innerHTML;
    for (let i = node.attributes.length - 1; i >= 0; i--) {
      script.setAttribute(node.attributes[i].name, node.attributes[i].value);
    }
    return script;
  }

  function nodeScriptReplace(node) {
    if (node.tagName === 'SCRIPT') {
      node.parentNode.replaceChild(nodeScriptClone(node), node);
    } else {
      [].forEach.call(node.childNodes, function (children) {
        nodeScriptReplace(children);
      });
    }
    return node;
  }

  function wrap(elem, wrapper) {
    wrapper = wrapper || document.createElement('div');
    elem.parentNode.insertBefore(wrapper, elem); // insert wrapper before elem in the DOM tree
    wrapper.appendChild(elem); // move elem into wrapper
    return wrapper;
  }

  function insert(elem, parentNode) {
    parentNode = parentNode || document.body; // 父節點 (預設 body)
    const lastChild = parentNode.children[parentNode.children.length - 1]; // 尋找最後的子節點
    const referenceNode = lastChild ? lastChild.nextElementSibling : null; // 判斷參考的節點
    parentNode.insertBefore(elem, referenceNode);
  }

  function remove(elem, parentNode) {
    parentNode = parentNode || elem.parentNode;
    parentNode.removeChild(elem);
  }

  function removeChild(elem) {
    while (elem.firstChild) {
      remove(elem.firstChild, elem);
    }
  }

  function getScrollPosition() {
    const root = document.documentElement || document.body;
    return {
      x: window.pageXOffset || root.scrollLeft || 0,
      y: window.pageYOffset || root.scrollTop || 0,
    };
  }

  function getOffset(elem) {
    const rect = elem.getBoundingClientRect();
    const scroll = getScrollPosition();
    return {
      top: rect.top + scroll.y,
      left: rect.left + scroll.x,
    };
  }

  function regToggleBlock(elem, opts, defaultShow) {
    opts = opts || {};
    opts.ms = opts.ms || 300;
    opts.showFunc = opts.showFunc || function () {};
    opts.hideFunc = opts.hideFunc || function () {};

    const showFunc = function () {
      if (opts.activeClass) elem.classList.add(opts.activeClass);
      opts.showFunc();
    };
    const hideFunc = function () {
      if (opts.activeClass) elem.classList.remove(opts.activeClass);
      opts.hideFunc();
    };

    if (!defaultShow) elem.style.display = 'none';

    let timer = null;
    return function (show) {
      clearTimeout(timer);
      if (show) {
        if (elem.style.display === 'none') {
          elem.style.display = '';
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
          elem.style.display = 'none';
        }, opts.ms);
      }
    };
  }

  function regToggleFade(elem, opts, defaultShow) {
    opts = opts || {};
    opts.ms = opts.ms || 300;
    opts.tf = opts.tf || 'ease';

    let _style = window.getComputedStyle(elem, null);
    let _origin = {
      property: _style.transitionProperty,
      duration: _style.transitionDuration,
      delay: _style.transitionDelay,
      tf: _style.transitionTimingFunction,
    };

    elem.style['transitionProperty'] = _origin.property + ',opacity,visibility';
    elem.style['transitionDuration'] = _origin.duration + ',{0}ms,0s'.format(opts.ms);
    elem.style['transitionTimingFunction'] = _origin.tf + ',{0},{0}'.format(opts.tf);

    let hideClass = 'x-hide';
    if (!defaultShow) elem.classList.add(hideClass);

    opts.showFunc = function () {
      elem.style['transitionDelay'] = _origin.delay + ',0s,0s';
      elem.classList.remove(hideClass);
    };
    opts.hideFunc = function () {
      elem.style['transitionDelay'] = _origin.delay + ',0s,{0}ms'.format(opts.ms);
      elem.classList.add(hideClass);
    };

    return regToggleBlock(elem, opts, defaultShow);
  }

  addStyleSheet('.x-hide{opacity:0;visibility:hidden}');

  return {
    addStyleSheet: addStyleSheet,
    loadStyleSheet: loadStyleSheet,
    loadScript: loadScript,
    nodeScriptReplace: nodeScriptReplace,
    wrap: wrap,
    insert: insert,
    remove: remove,
    removeChild: removeChild,
    getScrollPosition: getScrollPosition,
    getOffset: getOffset,
    regToggleBlock: regToggleBlock,
    regToggleFade: regToggleFade,
  };
})();

// 圖片相關
util.img = (function () {
  const radioClasses = [];

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

  function addRadioStyle(x, y) {
    let className = '';
    const rf = util.math.reduceFraction(x, y);
    const ratio = (rf[1] / rf[0]).toFixed(4) * 100;
    if (!isNaN(ratio)) {
      className = 'x-pic-{0}-{1}'.format(rf[0], rf[1]);
      if (radioClasses.indexOf(className) === -1) {
        radioClasses.push(className);
        util.dom.addStyleSheet('.{0}::before{content:"";display:block;padding-top:{1}%}'.format(className, ratio));
      }
    }
    return className;
  }

  const imgStyles = [
    '.x-pic{position:relative;display:block;overflow:hidden}',
    '.x-pic img{position:absolute;top:-100%;bottom:-100%;right:-100%;left:-100%;margin:auto;width:100%;height:auto}',
    '.x-pic img.portrait{width:auto;height:100%}',
  ].join('');
  util.dom.addStyleSheet(imgStyles);

  return {
    preload: preload,
    onError: onError,
    onLoad: onLoad,
    addRadioStyle: addRadioStyle,
  };
})();

// 處理控制相關
util.processControl = (function () {
  const set = {};

  function init(name, prop) {
    return new Promise(function (resolve) {
      if (!set[name]) {
        set[name] = {
          count: 0,
          isProcessing: false,
        };
        Object.assign(set[name], prop);
      }
      resolve(set[name]);
    });
  }

  function check(name, prop) {
    return init(name, prop).then(function (obj) {
      return {
        canStart: canStart.bind(null, name),
        done: done.bind(null, name),
      };
    });
  }

  function checkOnce(name) {
    const prop = {
      limit: 1,
    };
    return check(name, prop);
  }

  function canStart(name, callback) {
    const obj = set[name];
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

  function done(name, callback) {
    set[name].isProcessing = false;
    if (callback) callback();
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
    console.table(set);
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
  const newXHR =
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

  let forceRefresh = util.bom.getUrlParams('Refresh') === '1';

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

        if (forceRefresh) {
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

      const xhr = newXHR();
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
            data: res.Data || res,
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
      [].forEach.call(Object.keys(opts.headers), function (name) {
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

  const httpErrorTemp = {
    '401': function () {
      util.modal.set['loginYet'].open();
    },
    other: function () {
      util.modal.set['systemBusy'].open();
    },
  };

  // 錯誤處理
  function errorHandler(customError) {
    return function (err) {
      const httpError = Object.assign({}, httpErrorTemp, customError);

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
  let fixedHeader = null;
  let wrapper = null;

  // 區塊錨點
  const sections = [];
  let sectionsScrollHandler = null;

  // 初始錨點定位
  let defaultHash = null;

  if (window.location.hash) {
    defaultHash = window.location.hash;
    util.domReady(function () {
      // util.bom.updateHash();
      // _scrollTo(0, 0);
      untilDefault(0);
    });
  }

  function untilDefault(duration) {
    if (!defaultHash) return false;
    util.processControl.check('anchor-untilDefault').then(function (process) {
      if (!process.canStart()) return false;
      // 每次最少執行秒數
      const leastLoading = util.processControl.leastLoading(500);
      // 錨點目標
      const anchorTarget = document.querySelector(defaultHash);

      // 直到錨點函式
      const untilFunc = leastLoading.bind(null, function () {
        let next = null;
        const anchorTargetTop = getElementTop(anchorTarget);
        const scrollY = util.dom.getScrollPosition().y;

        // 如果錨點還沒生成 或還沒定位 (定位則停止，容忍誤差)
        if (util.pipe(Math.abs, Math.floor)(anchorTargetTop - scrollY) > 0) {
          // 再延遲執行一次
          next = function () {
            setTimeout(function () {
              untilDefault(duration);
            }, 500);
          };
        }

        process.done(next);
      });

      if (!anchorTarget) {
        untilFunc();
      } else {
        _scrollTo(getElementTop(anchorTarget), duration, untilFunc);
      }
    });
  }

  function setFixedHeader(elem) {
    if (elem) fixedHeader = elem;
  }

  function setWrapper(elem) {
    if (elem) wrapper = elem;
  }

  function getElementTop(elem) {
    if (!elem) return 0;

    //let scrollY = util.dom.getOffset(elem).top;
    let scrollY = elem.offsetTop;

    if (elem.offsetParent) scrollY += elem.offsetParent.offsetTop;
    if (fixedHeader) scrollY -= fixedHeader.clientHeight;
    if (wrapper) scrollY -= wrapper.offsetTop;

    return scrollY;
  }

  function setSections(id) {
    if (!!id && sections.indexOf(id) === -1) sections.push(id);
  }

  // TODO: 設定初始數據
  function setSectionsData(elem) {
    setSections(elem.id);
  }

  // 區塊錨點處理
  function scrollHashHandler() {
    let root = document.documentElement || document.body,
      rootTop = root.scrollTop,
      rootBottom = rootTop + root.clientHeight,
      targetHash = null;

    // TODO: 可優化 記錄順序等...
    for (let i = 0, sectionID; (sectionID = sections[i]); i++) {
      let elem = document.getElementById(sectionID),
        elemTop = getElementTop(elem),
        elemBottom = elemTop + elem.clientHeight;

      // TODO: 顯示條件可優化
      if (elemTop < rootBottom && elemBottom > rootTop) {
        targetHash = sectionID;
        break;
      }
    }

    util.bom.updateHash(targetHash);
  }

  // 滾動處理
  function scrollHandler(elem, duration, callback) {
    if (!elem) return;

    let anchor = elem.dataset.anchor || elem.getAttribute('href');
    if (anchor === '#') return;

    scrollTo(anchor, duration, callback);
  }

  // 滾動至
  function scrollTo(selector, duration, callback) {
    if (!selector) return;

    let targetAnchor = document.querySelector(selector);
    if (!targetAnchor) return;

    _scrollTo(getElementTop(targetAnchor), duration, callback);
  }

  // 滾動至 (位置, 持續時間, 回呼函式)
  function _scrollTo(to, duration, callback) {
    let root = document.documentElement || document.body,
      start = root.scrollTop,
      change = to - start,
      startDate = +new Date();

    if (duration === 0) {
      root.scrollTop = to;
      if (callback) callback();
      return true;
    }

    duration = duration || 500;

    let easeInOutQuad = function (t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t -= 1;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };
    let animateScroll = function () {
      let currentDate = +new Date();
      let currentTime = currentDate - startDate;
      root.scrollTop = parseInt(easeInOutQuad(currentTime, start, change, duration), 10);
      if (currentTime < duration) {
        requestAnimationFrame(animateScroll);
      } else {
        root.scrollTop = to;
        if (callback) callback();
      }
    };
    animateScroll();
  }

  // 處理錨點連結
  function processLinks(links, duration, callback) {
    let anchorLinks = links || document.querySelectorAll('a[href^="#"]');
    [].forEach.call(anchorLinks, function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        scrollHandler(e.target, duration, callback);
      });
    });
  }

  // 處理錨點區塊
  function processSections(sections) {
    let sectionEls = sections || document.querySelectorAll('section');
    if (sectionEls && sectionEls.length > 0) {
      [].forEach.call(sectionEls, function (sectionEl) {
        util.anchor.setSectionsData(sectionEl, false);
      });

      if (!sectionsScrollHandler) {
        sectionsScrollHandler = util.throttle(util.anchor.scrollHashHandler);
        document.addEventListener('scroll', sectionsScrollHandler);
      }
    }
  }

  return {
    setWrapper: setWrapper,
    setFixedHeader: setFixedHeader,
    setSections: setSections,
    setSectionsData: setSectionsData,
    scrollHashHandler: scrollHashHandler,
    scrollHandler: scrollHandler,
    scrollTo: scrollTo,
    scrollTop: _scrollTo.bind(null, 0),
    untilDefault: untilDefault,
    processLinks: processLinks,
    processSections: processSections,
  };
})();

// 模態框 (TODO: OOP)
util.modal = (function () {
  // 模態框樣式名
  let modalClasses = {
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

  // 初始模態框樣式
  (function initStyles(styles) {
    let modalStyles = styles;
    if (!modalStyles) {
      modalStyles = [
        '.{backdrop}{z-index:1040;position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;display:block;background-color:rgba(18,18,18,.5)}',
        '.{backdrop_error}{z-index:1041}',
        '.{backdrop_active}>.{block}{transform:translateX(-50%) translateY(-50%)}',
        '.{block}{position:absolute;top:50%;left:50%;transform:translateX(-50%) translateY(-70%);transition:transform .5s ease}',
        '.{closeBtn}{position:absolute;top:15px;right:15px;width:15px;height:15px;line-height:15px;text-align:center;font-size:24px;cursor:pointer}',
        '.{content}{position:relative;background-clip:padding-box;border-radius:5px;border:none;background-color:#fff;box-shadow: 0 0px 20px #000;overflow:hidden;outline:0}',
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
        .format(modalClasses);
    }
    util.dom.addStyleSheet(modalStyles);
  })();

  function Modal(parentNode) {
    console.log('new Modal');
    this.init();
    this.create(parentNode);
  }
  Modal.prototype.init = function () {
    console.log('Modal.init()');
    this.target = null; // 目標容器(背景)
    this.block = null; // 區塊(框)
    this.mainContent = null; // 顯示內容
    this.closeBtn = null; // 關閉按鈕
    this.switchFunc = null; // 切換顯示
    this.onClose = null; // 關閉時的回呼函式
    // this.blockClickFunc = null;
  };
  Modal.prototype.create = function (parentNode) {
    console.log('Modal.create() - 0');
    if (!this.target) {
      console.log('Modal.create() - 1');
      // 目標容器(背景)
      this.target = document.createElement('div');
      this.target.classList.add(modalClasses.backdrop);
      // 區塊(框)
      this.block = document.createElement('div');
      this.block.classList.add(modalClasses.block);
      // 顯示內容
      this.mainContent = document.createElement('div');
      this.mainContent.classList.add(modalClasses.content);
      // 關閉按鈕
      this.closeBtn = document.createElement('div');
      this.closeBtn.innerHTML = '&times;';
      this.closeBtn.classList.add(modalClasses.closeBtn);
      // 組合模態框
      this.block.insertBefore(this.mainContent, null);
      this.block.insertBefore(this.closeBtn, this.mainContent.nextElementSibling);
      this.target.insertBefore(this.block, null);
      // 插入模態框
      util.dom.insert(this.target, parentNode);

      // 註冊切換顯示
      this.switchFunc = util.dom.regToggleFade(this.target, { activeClass: modalClasses.backdrop_active }, false);

      // 監聽關閉
      this.closeBtn.addEventListener('click', this.close.bind(this));
    }
  };
  Modal.prototype.destroy = function () {
    console.log('Modal.destroy() - 0');
    if (this.target) {
      console.log('Modal.destroy() - 1');
      // 刪除元素
      util.dom.remove(this.target);
      // 重置屬性
      this.init();
    }
  };
  Modal.prototype.close = function () {
    console.log('Modal.close()');
    this.switchFunc(false);
    // 關閉時的回呼函式
    if (this.onClose) this.onClose();
  };
  Modal.prototype.open = function () {
    console.log('Modal.open()');
    this.switchFunc(true);
  };
  Modal.prototype.addCloseHandler = function (func) {
    console.log('Modal.addCloseHandler()');
    let oldFunc = this.onClose || function () {};
    if (typeof oldFunc !== 'function') {
      this.onClose = func;
    } else {
      this.onClose = function () {
        oldFunc();
        func();
      };
    }
  };
  Modal.prototype.initContent = function (html) {
    console.log('Modal.initContent()');
    while (this.mainContent.firstChild) {
      this.mainContent.removeChild(this.mainContent.firstChild);
    }
    this.mainContent.innerHTML = html;
  };

  // 內容模板
  let contentTemplate = {
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
  let set = {};

  function open(name) {
    if (set[name]) set[name].open();
  }

  function fetch(name, parentNode) {
    return new Promise(function (resolve, reject) {
      if (!set[name]) set[name] = new Modal(parentNode);
      resolve(set[name]);
    });
  }

  function createAlert(name, title, msg) {
    return fetch(name).then(function (modal) {
      if (!modal.mainContent.firstChild && msg) {
        let html = contentTemplate['base'](title, msg);
        modal.initContent(html);
      }

      return modal;
    });
  }
  function createError(name, title, msg) {
    return fetch(name).then(function (modal) {
      if (!modal.mainContent.firstChild && msg) {
        let html = contentTemplate['base'](title, msg);
        modal.initContent(html);

        modal.target.classList.add(modalClasses.backdrop_error);
      }

      return modal;
    });
  }
  function createConfirm(name, title, msg, confirmFunc, cancelFunc) {
    return fetch(name).then(function (modal) {
      if (!modal.mainContent.firstChild && msg) {
        let html = contentTemplate['base'](title, msg);
        modal.initContent(html);

        // footer
        let footer = document.createElement('div');
        footer.classList.add(modalClasses.contentFooter);
        // confirmBtn
        let confirmBtn = document.createElement('div');
        confirmBtn.innerText = '確認';
        confirmBtn.classList.add(modalClasses.btn);
        confirmBtn.classList.add(modalClasses.btn_confirm);
        // cancelBtn
        let cancelBtn = document.createElement('div');
        cancelBtn.innerText = '取消';
        cancelBtn.classList.add(modalClasses.btn);
        cancelBtn.classList.add(modalClasses.btn_cancel);
        // 組合
        footer.insertBefore(confirmBtn, null);
        footer.insertBefore(cancelBtn, confirmBtn.nextElementSibling);
        // 插入模態框
        util.dom.insert(footer, modal.mainContent);

        // 監聽
        confirmBtn.addEventListener('click', function () {
          if (confirmFunc) confirmFunc();
          modal.close();
        });
        cancelBtn.addEventListener('click', function () {
          if (cancelFunc) cancelFunc();
          modal.close();
        });
      }

      return modal;
    });
  }

  createConfirm('loginYet', '尚未登入', '請先登入會員，再進行操作。<br/>立即導轉至登入頁?', function () {
    console.log('xx');
  });
  createAlert('systemBusy', null, '系統忙碌中，請稍後再試！');

  return {
    contentTemplate: contentTemplate,
    set: set,
    open: open,
    fetch: fetch,
    createAlert: createAlert,
    createError: createError,
    createConfirm: createConfirm,
  };
})();

/*
// 創建同步函式 (Generator Function)
util.createAsyncFunction = function (fn) {
    return function () {
        let gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    let info = gen[key](arg);
                    let value = info.value;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (info.done) {
                    resolve(value);
                } else {
                    return Promise.resolve(value).then(
                        function (value) {
                            step('next', value);
                        },
                        function (err) {
                            step('throw', err);
                        }
                    );
                }
            }
            return step('next');
        });
    };
};
*/
