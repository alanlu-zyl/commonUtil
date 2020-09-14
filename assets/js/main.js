const codeControlSet = [];
function CodeControl(node) {
  this.mode = this.status.NORMAL;
  this.init(node);
}
CodeControl.prototype.status = util.newEnum({
  NORMAL: 0,
  EDIT: 1,
});
CodeControl.prototype.highlight = function () {
  if (!util.bom.UA.isIE) hljs.highlightBlock(this.codeNode);
};
CodeControl.prototype.init = function (node) {
  if (this.target) return;
  this.target = node;
  this.codeNode = this.target.firstChild;
  this.highlight();

  const wrap = util.dom.createElem('div');
  const btnRun = util.dom.createElem('button', 'Run', { class: 'btn btn--run' });
  const btnEdit = util.dom.createElem('button', 'Edit', { class: 'btn btn--edit' });
  const btnSave = util.dom.createElem('button', 'Save', { class: 'btn btn--save' });

  const _this = this;
  wrap.addEventListener('click', function (e) {
    const classList = e.target.classList;
    if (classList.contains('btn--run')) _this.run();
    else if (classList.contains('btn--edit')) _this.edit();
    else if (classList.contains('btn--save')) _this.save();
  });

  util.dom.insert(btnRun, wrap);
  util.dom.insert(btnEdit, wrap);
  util.dom.insert(btnSave, wrap);
  util.dom.insertNext(wrap, this.target);
};
CodeControl.prototype.run = function () {
  var code = this.mode === this.status.NORMAL ? this.codeNode.textContent : this.target.firstChild.value;
  // console.log(code);
  eval(code);
};
CodeControl.prototype.edit = function () {
  if (this.mode === this.status.NORMAL) {
    this.mode = this.status.EDIT;
    const textArea = util.dom.createElem('textarea', this.codeNode.textContent, { spellcheck: false });
    textArea.style.height = this.codeNode.offsetHeight + 'px';
    this.codeNode.classList.add('x-hide');
    util.dom.insertFirst(textArea, this.target);
  }
};
CodeControl.prototype.save = function () {
  if (this.mode === this.status.EDIT) {
    this.mode = this.status.NORMAL;
    this.codeNode.classList.remove('x-hide');
    this.codeNode.innerHTML = this.target.firstChild.value;
    util.dom.remove(this.target.firstChild);
    this.highlight();
  }
};

// 處理置頂按鈕
const processGoTop = function () {
  // 主區塊
  const mainDiv = document.getElementById('main');

  // 創建置頂按鈕
  const goTopBtn = util.dom.createElem('div', null, { id: 'goTop' });
  // 監聽點擊
  util.bindEvent(goTopBtn, 'click', null, function () {
    util.anchor.scrollTop();
  });
  // 加入主區塊
  util.dom.insert(goTopBtn, mainDiv);

  // 切換淡出淡入函式
  const toggleGoTopBtnFunc = function () {
    // 是否需要顯示
    const needShow = function () {
      return util.dom.getScrollPosition(mainDiv).y > 300;
    };
    // 註冊並取得切換淡出淡入函式
    const goTopToggleFade = util.dom.regToggleFade(goTopBtn, null, needShow());
    return function () {
      goTopToggleFade(needShow());
    };
  };

  // 將切換函式加入節流閥
  var goTopThrottled = util.throttle(toggleGoTopBtnFunc());
  // 主畫面新增滾動監聽
  util.bindEvent(mainDiv, 'scroll', null, goTopThrottled);
};

// 處理內容
const processContent = function () {
  const mainDiv = document.getElementById('main'); // 主區塊
  const navList = document.getElementById('navList'); // 導覽列區塊 (tag: ul)

  // 取得內容資訊
  util.ajax.get('/assets/data/content.json').then(function (res) {
    // 處理內容資訊
    util.forEach(res.data, function (nav) {
      // 第一層

      // 連結
      const link = util.dom.createElem('a', nav.text, { href: '#' + nav.name });

      // 導覽列
      const navItem = util.dom.createElem('li');
      util.dom.insert(link, navItem);
      util.dom.insert(navItem, navList);

      // 主區塊
      const sectionWrapper = util.dom.createElem('section', null, { id: nav.name, 'data-anchor-alias': nav.alias });
      const sectionTitle = util.dom.createElem('h2', util.dom.cloneElem(link));
      util.dom.insert(sectionTitle, sectionWrapper);
      util.dom.insert(sectionWrapper, mainDiv);

      if (nav.item && nav.item.length > 0) {
        const subNavList = util.dom.createElem('ul');
        util.dom.insert(subNavList, navItem);

        const sectionBlock = util.dom.createElem('div');
        util.dom.insert(sectionBlock, sectionWrapper);

        util.forEach(nav.item, function (item) {
          const subLink = util.dom.createElem('a', item.text, { href: '#{0}-{1}'.format(nav.name, item.name) });

          // 第二層
          const subNavItem = util.dom.createElem('li');
          util.dom.insert(subLink, subNavItem);
          util.dom.insert(subNavItem, subNavList);

          let _title = (nav.root ? nav.root + '.' : '') + item.name + (item.args ? item.args : '');
          let _code = Array.isArray(item.code) ? item.code.join('\r\n') : item.code.replace(/<br?\/?>/gi, '\r\n');
          if (!_code.length) _code = '// {0}'.format(_title);
          const codeTitle = util.dom.createElem('h3', _title, { id: '{0}-{1}'.format(nav.name, item.name) });
          util.dom.insert(codeTitle, sectionBlock);

          const codeSnippet = util.dom.createElem('div', null, { class: 'snippet' });
          const codePre = util.dom.createElem('pre', null);
          const codeMain = util.dom.createElem('code', _code, { class: 'hljs js' });
          util.dom.insert(codeMain, codePre);
          util.dom.insert(codePre, codeSnippet);
          util.dom.insert(codeSnippet, sectionBlock);

          // TODO
          codeControlSet.push(new CodeControl(codePre));
        });

        // 創建展開按鈕
        const toggleBtn = util.dom.createElem('div', null, { class: 'toggle' });
        // 註冊切換展開函式
        const toggleSubNavListFunc = util.dom.regToggleHeight(subNavList, {
          showFunc: function () {
            toggleBtn.classList.add('open');
          },
          hideFunc: function () {
            toggleBtn.classList.remove('open');
          },
        });

        // 監聽按鈕
        toggleBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleSubNavListFunc(!toggleBtn.classList.contains('open'));
        });
        navItem.addEventListener('click', function () {
          toggleSubNavListFunc(true);
        });
        util.dom.insertLast(toggleBtn, navItem);
      }
    });

    // anchor
    util.anchor.setRootEl(mainDiv);
    util.anchor.processLinks();
    util.anchor.processSections();
    // util.anchor.untilDefault(0);
  });

  // 搜尋函式
  const searchFunc = function (e) {
    const searchVal = e.target.value.toLowerCase();
    if (searchVal !== '' && searchVal.length < 2) return;
    // 遍歷所有大項
    util.forEach(navList.children, function (nav) {
      // 先取得切換按鈕
      const toggleBtn = nav.querySelector('.toggle');
      // 取得細項列表(第二層)
      const subNavList = nav.querySelector('ul');

      // 大項是否符合
      var mainCheck =
        nav.firstChild.href.toLowerCase().indexOf(searchVal) > -1 ||
        nav.firstChild.text.toLowerCase().indexOf(searchVal) > -1;
      // 準備記錄細項的符合次數
      let itemCheckCount = 0;
      if (subNavList) {
        util.forEach(subNavList.children, function (item) {
          // 檢查細項是否符合，不符合則隱藏
          if (
            item.firstChild.href.toLowerCase().indexOf(searchVal) > -1 ||
            item.firstChild.text.toLowerCase().indexOf(searchVal) > -1
          ) {
            item.classList.remove('x-hide');
            itemCheckCount++;
          } else {
            item.classList.add('x-hide');
          }
        });
      }

      // 如果細項有符合
      if (itemCheckCount > 0) {
        nav.classList.remove('x-hide');
      }
      //如果細項不符合，但主項符合
      else if (mainCheck) {
        nav.classList.remove('x-hide');
        // 將細項全部顯示
        util.forEach(subNavList.children, function (item) {
          item.classList.remove('x-hide');
        });
      }
      // 都不符合
      else {
        nav.classList.add('x-hide');
      }

      // 如果搜尋欄空白
      if (!searchVal) {
        // 並且已經打開
        if (toggleBtn.classList.contains('open')) {
          // 觸發click事件 將細項列表隱藏
          util.dispatchEvent(toggleBtn, 'click');
        }
        return;
      }
      // 如果主項隱藏 但細項打開，觸發click事件 將細項列表 隱藏
      // 如果主項顯示 但細項不顯示，觸發click事件 將細項列表 顯示
      if (
        (nav.classList.contains('x-hide') && toggleBtn.classList.contains('open')) ||
        (!nav.classList.contains('x-hide') && !toggleBtn.classList.contains('open'))
      ) {
        util.dispatchEvent(toggleBtn, 'click');
      }
    });
  };

  // 監聽搜尋框 (函式防抖)
  const search = document.getElementById('search');
  search.addEventListener('input', util.debounce(searchFunc));
};

function init() {
  util.domReady(function () {
    processGoTop(); // goTop
    processContent(); // content
  });
}

if (util.bom.isIE) {
  util.bom.notSupportIE();
  init();
} else {
  util.dom.loadStyleSheet('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/styles/default.min.css');
  util.dom.loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/highlight.min.js', null, init);
}
