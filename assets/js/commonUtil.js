'use strict';

// String.format
(function () {
  String.prototype.format = function () {
    return String.format.bind(null, this.toString()).apply(null, arguments);
  };
  String.format = function (str, col) {
    col = typeof col === 'object' ? col : [].slice.call(arguments, 1);

    return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
      if (m === '{{') {
        return '{';
      }
      if (m === '}}') {
        return '}';
      }
      return col[n];
    });
  };
})();

// Util
var util = {
  domReady: function (callback) {
    return new Promise(function (resolve) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          if (callback) callback();
          resolve();
        });
      } else {
        if (callback) callback();
        resolve();
      }
    });
  },
  windowReady: function (callback) {
    return new Promise(function (resolve) {
      if (document.readyState === 'complete') {
        if (callback) callback();
        resolve();
      } else {
        window.addEventListener('load', function () {
          if (callback) callback();
          resolve();
        });
      }
    });
  },
  // 節流閥 (執行函式, 必執行(毫秒), 延遲執行(毫秒))
  throttle: function (func, mustRun, delay) {
    mustRun = mustRun || 150;
    delay = delay === 0 || !!delay ? delay : 100;
    var timeoutId = null,
      lastTime = 0;

    return function () {
      var context = this,
        args = arguments;

      clearTimeout(timeoutId);
      var now = new Date();
      if (now - lastTime >= mustRun) {
        func.apply(context, args);
        lastTime = now;
      } else if (delay > 0) {
        timeoutId = setTimeout(function () {
          timeoutId = null;
          func.apply(context, args);
        }, delay);
      }
    };
  },
  // 防抖動 (執行函式, 延遲執行(毫秒))
  debounce: function (func, delay) {
    delay = delay || 100;
    var timeoutId = null;

    return function () {
      var context = this,
        args = arguments;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(function () {
        timeoutId = null;
        func.apply(context, args);
      }, delay);
    };
  },
  piper: function (/* functions */) {
    var fs = [].slice.apply(arguments);
    return function (/* arguments */) {
      return fs.reduce(
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
    var p = {};
    for (var k in seed) {
      var v = seed[k];
      if (v instanceof Array) p[(seed[k] = v[0])] = { value: v[0], name: v[1], code: v[2] };
      else p[v] = { value: v, name: k.toLowerCase(), code: k.substring(0, 1) };
    }
    seed.properties = p;

    return Object.freeze ? Object.freeze(seed) : seed;
  },
};

// 陣列相關
util.array = {
  limit: function (arr, count) {
    return arr.slice(0, count);
  },
};

// 物件相關
util.obj = {
  find: function (obj, key, value) {
    return obj.find(function (item) {
      return item[key] === value;
    });
  },
};

// 轉換相關
util.convert = {
  obj2QueryString: function (params) {
    if (!params) return '';

    return Object.keys(params)
      .map(function (key) {
        return '{key}={value}'.format({
          key: encodeURIComponent(key),
          value: encodeURIComponent(params[key]).replace('/%20/g', '+'),
        });
      })
      .join('&');
  },
  queryString2Obj: function (str) {
    if (!str) return {};

    var obj = {};
    [].forEach.call(str.split('&'), function (params) {
      var p = params.split('=', 2);
      obj[p[0]] = p.length > 1 ? decodeURIComponent(p[1].replace(/\+/g, ' ')) : '';
    });

    return obj;
  },
  json2ObjByKey: function (json, key) {
    return json.reduce(function (acc, obj) {
      if (obj[key]) acc[obj[key]] = !acc[obj[key]] ? obj : Object.assign({}, acc[obj[key]], obj);
      return acc;
    }, {});
  },
};

// 數學相關
util.math = {
  // 最簡分數
  reduceFraction: function (numerator, denominator) {
    var gcd = function gcd(a, b) {
      return b ? gcd(b, a % b) : a;
    };
    gcd = gcd(numerator, denominator);
    return [numerator / gcd, denominator / gcd];
  },
  // 千位符
  intThousandth: function (val) {
    if (!val) return val;
    return val.toString().replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, '$1,');
  },
};

// 日期相關
util.date = (function () {
  var week = ['日', '一', '二', '三', '四', '五', '六'];

  function get(date) {
    return date ? new Date(date) : new Date();
  }

  function checkZero(i) {
    return i < 10 ? '0' + i : i;
  }

  function format(date) {
    var _d = get(date);

    var obj = {
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

// 瀏覽器相關
util.browser = (function () {
  function notSupportIE() {
    var userAgent = window.navigator.userAgent;
    var isIE = userAgent.indexOf('MSIE') > 0 || userAgent.indexOf('Trident/') > 0;
    var isEdge = userAgent.indexOf('Edge/') > 0;

    if (isIE || isEdge) {
      util.modal.openError('notSupportIE', null, '您的瀏覽器過舊，請使用new Edge或Chrome以獲得更好的網站體驗。');
    }
  }

  return {
    notSupportIE: notSupportIE,
  };
})();

// URL相關
util.url = (function () {
  var urlParams = util.convert.queryString2Obj(window.location.search.substr(1));

  function getParams(key) {
    return key ? urlParams[key] : Object.assign({}, urlParams);
  }

  function updateHash(hash) {
    hash = hash ? '#' + hash : window.location.pathname + window.location.search;
    window.history.replaceState(null, null, hash);
  }

  function redirectMemberLogin() {
    // Do Something
    window.location = '/memberLogin';
  }

  return {
    getParams: getParams,
    updateHash: updateHash,
    redirectMemberLogin: redirectMemberLogin,
  };
})();

// 處理控制相關
util.processControl = (function () {
  var set = {};

  function get(name, prop) {
    return new Promise(function (resolve, reject) {
      if (!set[name]) {
        set[name] = {
          count: 0,
          isProcessing: false,
        };
        if (prop) Object.assign(set[name], prop);
      }

      resolve(set[name]);
    });
  }

  function check(name, prop) {
    return get(name, prop).then(function (obj) {
      return {
        canStart: canStart.bind(null, name),
        done: done.bind(null, name),
      };
    });
  }

  function checkOnce(name) {
    var prop = {
      limit: 1,
    };
    return check(name, prop);
  }

  function canStart(name, callback) {
    var obj = set[name];

    var pass = !obj.isProcessing;

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
    var pass = false;
    setTimeout(function () {
      pass = true;
    }, ms || 500);

    return function (callback) {
      var timer = setInterval(function () {
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
  var newXHR =
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

  var forceRefresh = util.url.getParams('Refresh') === '1';

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

      var url = opts.url;
      var body = null;

      if (opts.params) {
        var params = opts.params;
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

      var xhr = newXHR();
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 400) {
          var res;

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
    var opts = {
      method: method,
      url: url,
      params: params,
    };

    var promise = _ajax(opts);

    if (successFunc) {
      return promise.then(successFunc).catch(errorFunc || errorHandler());
    }

    return promise;
  }

  var httpErrorTemp = {
    '401': function () {
      util.modal.set['loginYet']();
    },
    other: function () {
      util.modal.set['systemBusy']();
    },
  };

  // 錯誤處理
  function errorHandler(customError) {
    return function (err) {
      var httpError = httpErrorTemp;

      if (customError) {
        httpError = Object.assign({}, httpError, customError);
      }

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

// DOM相關
util.dom = (function () {
  var styleSheet = null;

  function addStyleSheet(styles) {
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.type = 'text/css';
      document.head.appendChild(styleSheet);
    }
    styleSheet.innerText += styles;
  }

  function loadStyleSheet(href) {
    var stylesheet = document.createElement('link');
    stylesheet.href = href;
    stylesheet.rel = 'stylesheet';
    stylesheet.type = 'text/css';
    document.head.appendChild(stylesheet);
  }

  function loadScript(src, onLoadFunc) {
    var script = document.createElement('script');
    script.onload = function () {
      if (onLoadFunc) onLoadFunc();
    };
    script.src = src;
    document.head.appendChild(script);
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

  function nodeScriptClone(node) {
    var script = document.createElement('script');
    script.text = node.innerHTML;
    for (var i = node.attributes.length - 1; i >= 0; i--) {
      script.setAttribute(node.attributes[i].name, node.attributes[i].value);
    }
    return script;
  }

  function wrap(ele, wrapper) {
    wrapper = wrapper || document.createElement('div');
    ele.parentNode.insertBefore(wrapper, ele);
    wrapper.appendChild(ele);
  }

  function getScrollPosition() {
    var root = document.documentElement || document.body;
    return {
      x: window.pageXOffset || root.scrollLeft || 0,
      y: window.pageYOffset || root.scrollTop || 0,
    };
  }

  function getOffset(ele) {
    var rect = ele.getBoundingClientRect(),
      scroll = getScrollPosition();
    return {
      top: rect.top + scroll.y,
      left: rect.left + scroll.x,
    };
  }

  function regToggleBlock(ele, opts, defaultShow) {
    var opts = opts || {};
    opts.ms = opts.ms || 300;

    var showFunc = function () {
      if (opts.activeClass) ele.classList.add(opts.activeClass);
      if (opts.showFunc) opts.showFunc();
    };
    var hideFunc = function () {
      if (opts.activeClass) ele.classList.remove(opts.activeClass);
      if (opts.hideFunc) opts.hideFunc();
    };

    if (!defaultShow) {
      ele.style.display = 'none';
    }

    var timeoutId = null;

    return function (show) {
      clearTimeout(timeoutId);
      if (show) {
        if (ele.style.display === 'none') {
          ele.style.display = '';
          timeoutId = setTimeout(function () {
            showFunc();
          }, 50);
        } else {
          showFunc();
        }
      } else {
        hideFunc();

        timeoutId = setTimeout(function () {
          timeoutId = null;
          ele.style.display = 'none';
        }, opts.ms);
      }
    };
  }

  function regToggleFade(ele, opts, defaultShow) {
    var opts = opts || {};
    opts.ms = opts.ms || 300;
    opts.tf = opts.tf || 'ease';

    var _style = window.getComputedStyle(ele, null);
    var _transition = {
      property: _style.transitionProperty,
      duration: _style.transitionDuration,
      delay: _style.transitionDelay,
      tf: _style.transitionTimingFunction,
    };

    ele.style['transitionProperty'] = _transition.property + ',opacity,visibility';
    ele.style['transitionDuration'] = _transition.duration + ',{0}ms,0s'.format(opts.ms);
    ele.style['transitionTimingFunction'] = _transition.tf + ',{0},{0}'.format(opts.tf);

    var hideClass = 'x-hide';
    if (!defaultShow) ele.classList.add(hideClass);

    opts.showFunc = function () {
      ele.style['transitionDelay'] = _transition.delay + ',0s,0s';
      ele.classList.remove(hideClass);
    };
    opts.hideFunc = function () {
      ele.style['transitionDelay'] = _transition.delay + ',0s,{0}ms'.format(opts.ms);
      ele.classList.add(hideClass);
    };

    return regToggleBlock(ele, opts, defaultShow);
  }

  addStyleSheet('.x-hide{opacity:0;visibility:hidden}');

  return {
    addStyleSheet: addStyleSheet,
    loadStyleSheet: loadStyleSheet,
    loadScript: loadScript,
    nodeScriptReplace: nodeScriptReplace,
    wrap: wrap,
    getScrollPosition: getScrollPosition,
    getOffset: getOffset,
    regToggleBlock: regToggleBlock,
    regToggleFade: regToggleFade,
  };
})();

// 圖片相關
util.img = (function () {
  var radioClasses = [];

  function preload(img) {
    var src = img.getAttribute('data-src');
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
    // 找出父節點
    var parentNode = img.parentNode.clientHeight > 0 ? img.parentNode : img.parentNode.parentNode;
    // 父節點比例
    var parentRadio = parentNode.clientWidth / parentNode.clientHeight;
    // 圖片比例
    var targetRadio = img.clientWidth / img.clientHeight;
    // 套用高滿版
    if (parentRadio < targetRadio) img.classList.add('portrait');
    else img.classList.remove('portrait');
  }

  function addRadioStyle(x, y) {
    var className = '';
    var rf = util.math.reduceFraction(x, y);
    var ratio = (rf[1] / rf[0]).toFixed(4) * 100;

    if (!isNaN(ratio)) {
      className = 'x-pic-{0}-{1}'.format(rf[0], rf[1]);
      if (radioClasses.indexOf(className) === -1) {
        radioClasses.push(className);
        util.dom.addStyleSheet('.{0}::before{content:"";display:block;padding-top:{1}%}'.format(className, ratio));
      }
    }

    return className;
  }

  var imgStyles = [
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

// 錨點相關
util.anchor = (function () {
  var fixedHeader = null;
  var wrapper = null;

  // 區塊錨點
  var sections = [];
  var sectionsScrollHandler = null;

  // 初始錨點定位
  var defaultHash = null;

  if (window.location.hash) {
    defaultHash = window.location.hash;
    util.domReady(function () {
      // util.url.updateHash();
      // _scrollTo(0, 0);
      untilDefault(0);
    });
  }

  function untilDefault(duration) {
    if (!defaultHash) return false;
    util.processControl.check('anchor-untilDefault').then(function (process) {
      if (!process.canStart()) return false;
      // 每次最少執行秒數
      var leastLoading = util.processControl.leastLoading(500);
      // 錨點目標
      var anchorTarget = document.querySelector(defaultHash);

      // 直到錨點函式
      var untilFunc = leastLoading.bind(null, function () {
        var next = null,
          anchorTargetTop = getElementTop(anchorTarget),
          scrollY = util.dom.getScrollPosition().y;

        // 如果錨點還沒生成 或還沒定位 (定位則停止)
        if (anchorTargetTop !== scrollY) {
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

  function setFixedHeader(ele) {
    if (ele) fixedHeader = ele;
  }

  function setWrapper(ele) {
    if (ele) wrapper = ele;
  }

  function getElementTop(ele) {
    if (!ele) return 0;

    //var scrollY = util.dom.getOffset(ele).top;
    var scrollY = ele.offsetTop;

    if (ele.offsetParent) scrollY += ele.offsetParent.offsetTop;
    if (fixedHeader) scrollY -= fixedHeader.clientHeight;
    if (wrapper) scrollY -= wrapper.offsetTop;

    return scrollY;
  }

  function setSections(id) {
    if (!!id && sections.indexOf(id) === -1) sections.push(id);
  }

  // TODO: 設定初始數據
  function setSectionsData(ele) {
    setSections(ele.id);
  }

  // 區塊錨點處理
  function scrollHashHandler() {
    var root = document.documentElement || document.body,
      rootTop = root.scrollTop,
      rootBottom = rootTop + root.clientHeight,
      targetHash = null;

    // TODO: 可優化 記錄順序等...
    for (var i = 0, sectionID; (sectionID = sections[i]); i++) {
      var ele = document.getElementById(sectionID),
        eleTop = getElementTop(ele),
        eleBottom = eleTop + ele.clientHeight;

      // TODO: 顯示條件可優化
      if (eleTop < rootBottom && eleBottom > rootTop) {
        targetHash = sectionID;
        break;
      }
    }

    util.url.updateHash(targetHash);
  }

  // 滾動處理
  function scrollHandler(ele, duration, callback) {
    if (!ele) return;

    var anchor = ele.dataset.anchor || ele.getAttribute('href');
    if (anchor === '#') return;

    scrollTo(anchor, duration, callback);
  }

  // 滾動至
  function scrollTo(selector, duration, callback) {
    if (!selector) return;

    var targetAnchor = document.querySelector(selector);
    if (!targetAnchor) return;

    _scrollTo(getElementTop(targetAnchor), duration, callback);
  }

  // 滾動至 (位置, 持續時間, 回呼函式)
  function _scrollTo(to, duration, callback) {
    var root = document.documentElement || document.body,
      start = root.scrollTop,
      change = to - start,
      startDate = +new Date();

    if (duration === 0) {
      root.scrollTop = to;
      if (callback) callback();
      return true;
    }

    duration = duration || 500;

    var easeInOutQuad = function (t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t -= 1;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };
    var animateScroll = function () {
      var currentDate = +new Date();
      var currentTime = currentDate - startDate;
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
    var anchorLinks = links || document.querySelectorAll('a[href^="#"]');
    [].forEach.call(anchorLinks, function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        scrollHandler(e.target, duration, callback);
      });
    });
  }

  // 處理錨點區塊
  function processSections(sections) {
    var sectionEls = sections || document.querySelectorAll('section');
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
  // 模態框
  var modal = {};

  // 模態框模板
  var modalTemplate = {
    // 目標
    target: null,
    // 關閉時的回呼函式
    onClose: null,
    // 確認時的回呼函式
    onConfirm: null,
  };

  // 模態框樣式名
  var modalClasses = {
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

  // 內容模板
  var contentTemplate = {
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

  // 創建模態框 (名稱, 父節點, 回呼函式)
  function create(name, parentNode, callback) {
    if (modal[name]) return;

    // 父節點 (預設 body)
    if (!parentNode) parentNode = document.body;
    // 尋找最後的子節點
    var lastChild = parentNode.children[parentNode.children.length - 1];
    // 判斷參考的節點
    var referenceNode = lastChild ? lastChild.nextSibling : null;

    // 容器(背景)
    var wrap = document.createElement('div');
    wrap.classList.add(modalClasses.backdrop);
    wrap.style.display = 'none';
    // 區塊(框)
    var block = document.createElement('div');
    block.classList.add(modalClasses.block);
    // 內容
    var content = document.createElement('div');
    content.classList.add(modalClasses.content);
    // 關閉按鈕
    var closeBtn = document.createElement('div');
    closeBtn.innerHTML = '&times;';
    closeBtn.classList.add(modalClasses.closeBtn);

    // 插入模態框
    block.insertBefore(content, null);
    block.insertBefore(closeBtn, content.nextElementSibling);
    wrap.insertBefore(block, null);
    parentNode.insertBefore(wrap, referenceNode);

    // 監聽關閉
    //wrap.addEventListener('click', function (e) {
    //    e.stopPropagation();
    //    switchActive(name, false);
    //});
    block.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      switchActive(name, false);
    });

    // 記錄模態框
    modal[name] = Object.assign({}, modalTemplate, { target: wrap });
    modal[name].switchActive = util.dom.regToggleFade(wrap, { activeClass: modalClasses.backdrop_active });

    // 回呼函式
    if (callback) callback();
  }

  // 切換開關 (名稱, 開/關)
  function switchActive(name, flag) {
    if (modal[name]) {
      modal[name].switchActive(flag);
      if (!flag) {
        // 關閉時的回呼函式
        if (modal[name].onClose) modal[name].onClose();
      }
    }
  }

  // 加入關閉按鈕的監聽 (名稱, 函式)
  function addCloseHandler(name, func) {
    if (modal[name]) {
      var oldFunc = modal[name].onClose || function () {};
      if (typeof oldFunc !== 'function') {
        modal[name].onClose = func;
      } else {
        modal[name].onClose = function () {
          oldFunc();
          func();
        };
      }
    }
  }

  // 初始內容 (名稱, HTML內容, 回呼函式)
  function initContent(name, html, callback) {
    if (modal[name]) {
      // 重置內容
      var content = modal[name].target.querySelector('.' + modalClasses.content);
      if (content) content.innerHTML = html;
      // 回呼函式
      if (callback) callback();
    } else {
      // 創建模態框
      create(name, null, function () {
        initContent(name, html, callback);
      });
    }
  }

  // 關閉模態框 (名稱)
  function close(name) {
    // 指定
    if (name) {
      switchActive(name, false);
    }
    // 全部
    else {
      [].forEach.call(Object.keys(modal), function (name) {
        switchActive(name, false);
      });
    }
  }

  // 開啟模態框 (名稱, HTML內容)
  function open(name, html) {
    if (html) {
      // 初始內容
      initContent(name, html, function () {
        open(name);
      });
    } else {
      switchActive(name, true);
    }
  }

  // 打開通知模態框 (名稱, 標題, 訊息)
  function openAlert(name, title, msg) {
    if (modal[name]) {
      open(name);
    } else if (msg) {
      initContent(name, contentTemplate['base'](title, msg), function () {
        open(name);
      });
    }
  }
  // 打開錯誤模態框 (名稱, 標題, 訊息)
  function openError(name, title, msg) {
    if (modal[name]) {
      open(name);
    } else if (msg) {
      initContent(name, contentTemplate['base'](title, msg), function () {
        modal[name].target.classList.add(modalClasses.backdrop_error);
        open(name);
      });
    }
  }

  // 打開確認模態框 (名稱, 標題, 訊息, 確認的回呼函式)
  function openConfirm(name, title, msg, confirmFunc) {
    if (modal[name]) {
      open(name);
    } else if (msg) {
      initContent(name, contentTemplate['base'](title, msg), function () {
        // footer
        var footer = document.createElement('div');
        footer.classList.add(modalClasses.contentFooter);
        // confirmBtn
        var confirmBtn = document.createElement('div');
        confirmBtn.innerText = '確認';
        confirmBtn.classList.add(modalClasses.btn);
        confirmBtn.classList.add(modalClasses.btn_confirm);
        // cancelBtn
        var cancelBtn = document.createElement('div');
        cancelBtn.innerText = '取消';
        cancelBtn.classList.add(modalClasses.btn);
        cancelBtn.classList.add(modalClasses.btn_cancel);

        // 插入模態框
        footer.insertBefore(confirmBtn, null);
        footer.insertBefore(cancelBtn, confirmBtn.nextElementSibling);
        var content = modal[name].target.querySelector('.' + modalClasses.content);
        if (content) content.appendChild(footer);

        modal[name].onConfirm = confirmFunc;

        confirmBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          switchActive(name, false);
          if (modal[name].onConfirm) modal[name].onConfirm();
        });

        cancelBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          switchActive(name, false);
        });

        open(name);
      });
    }
  }

  // 初始模態框樣式
  (function initStyles(styles) {
    var modalStyles = styles;
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

  // 集合
  var set = {
    loginYet: function () {
      openConfirm('loginYet', '尚未登入', '請先登入會員，再進行操作。<br/>立即導轉至登入頁?', util.url.redirectMemberLogin);
    },
    systemBusy: function () {
      openError('systemBusy', null, '系統忙碌中，請稍後再試！');
    },
  };

  return {
    modalClasses: modalClasses,
    contentTemplate: contentTemplate,
    addCloseHandler: addCloseHandler,
    close: close,
    open: open,
    openAlert: openAlert,
    openError: openError,
    openConfirm: openConfirm,
    set: set,
  };
})();

/*
// 創建同步函式 (Generator Function)
util.createAsyncFunction = function (fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value;
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

// Polyfill - check support(simple)
(function () {
  // Object.assign
  if (typeof Object.assign !== 'function') {
    Object.assign = function (target, varArgs) {
      // .length of function is 2
      'use strict';
      if (target == null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
})();
