const processGoTop = function () {
  // goTop
  const goTop = util.dom.createElem('div', null, {
    id: 'goTop',
    onclick: function () {
      util.anchor.scrollTop();
    },
  });
  util.dom.insert(window.body, goTop);

  const toggleGoTopBtn = function () {
    const needShow = function () {
      return util.dom.getScrollPosition().y > 300;
    };
    const goTopToggleFade = util.dom.regToggleFade(goTop, null, needShow());
    return function () {
      goTopToggleFade(needShow());
    };
  };
  var goTopThrottled = util.throttle(toggleGoTopBtn());
  document.addEventListener('scroll', goTopThrottled);
};

const processNav = function () {
  const navList = document.getElementById('navList');
  if (navList.children) {
    [].forEach.call(navList.children, function (node) {
      const subNav = node.querySelector('ul');
      if (subNav) {
        const toggleBtn = util.dom.createElem('div', null, { className: 'toggle' });
        util.dom.insertFirst(node, toggleBtn);

        // const toggleSubNav = util.dom.regToggleBlock(
        //   subNav,
        //   {
        //     showFunc: function () {
        //       toggleBtn.classList.add('open');
        //       subNav.style.maxHeight = subNav.scrollHeight + 'px';
        //     },
        //     hideFunc: function () {
        //       toggleBtn.classList.remove('open');
        //       subNav.removeAttribute('style');
        //     },
        //   },
        //   false
        // );

        const toggleSubNav = util.dom.regToggleHeight(
          subNav,
          {
            showFunc: function () {
              console.log('show');
              toggleBtn.classList.add('open');
            },
            hideFunc: function () {
              console.log('hide');
              toggleBtn.classList.remove('open');
            },
          },
          false
        );

        toggleBtn.addEventListener('click', function (e) {
          toggleSubNav(!toggleBtn.classList.contains('open'));
        });
      }
    });
  }
};

const processCodeEditor = function () {
  function CodeControl(node) {
    this.mode = this.status.NORMAL;
    this.target = node;
    this.codeNode = node.firstChild;
    this.init();
  }
  CodeControl.prototype.status = util.newEnum({
    NORMAL: 0,
    EDIT: 1,
  });
  CodeControl.prototype.init = function () {
    this.highlight();

    this.btnRun = util.dom.createElem('BUTTON', 'Run', { className: 'btn btn--run', onclick: this.run.bind(this) });
    this.btnEdit = util.dom.createElem('BUTTON', 'Edit', { className: 'btn btn--edit', onclick: this.edit.bind(this) });
    this.btnSave = util.dom.createElem('BUTTON', 'Save', { className: 'btn btn--save', onclick: this.save.bind(this) });

    util.dom.wrap(this.target);
    util.dom.insert(this.target, this.btnRun);
    util.dom.insert(this.target, this.btnEdit);
    util.dom.insert(this.target, this.btnSave);
  };
  CodeControl.prototype.run = function () {
    var code = this.codeNode.innerText || this.codeNode.firstChild.value;
    console.log(code);
    eval(code);
  };
  CodeControl.prototype.edit = function () {
    if (this.mode === this.status.NORMAL) {
      this.mode = this.status.EDIT;
      this.codeNode.innerHTML = '<textarea>{0}</textarea>'.format(this.codeNode.innerText);
    }
  };
  CodeControl.prototype.save = function () {
    if (this.mode === this.status.EDIT && this.codeNode.firstChild.value) {
      this.mode = this.status.NORMAL;
      this.codeNode.innerHTML = this.codeNode.firstChild.value;
      this.highlight();
    }
  };
  CodeControl.prototype.highlight = function () {
    hljs.highlightBlock(this.codeNode);
  };
  const CodeControlSet = [];

  [].forEach.call(document.querySelectorAll('pre'), function (node) {
    CodeControlSet.push(new CodeControl(node));
  });
};

util.domReady(function () {
  // goTop
  processGoTop();
  // nav
  processNav();
  // code editor
  processCodeEditor();
  // anchor
  util.anchor.processLinks();
  util.anchor.processSections();
});
