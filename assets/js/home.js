util.domReady().then(function () {
  // goTop
  var goTop = document.getElementById('goTop');
  goTop.addEventListener('click', function (e) {
    util.anchor.scrollTop();
  });

  var goTopToggleFade = util.dom.regToggleFade(goTop, null, util.dom.getScrollPosition().y > 300);
  var goTopThrottled = util.throttle(function () {
    goTopToggleFade(util.dom.getScrollPosition().y > 300);
  });
  document.addEventListener('scroll', goTopThrottled);

  // nav
  util.anchor.processLinks();

  // section
  util.anchor.processSections();

  [].forEach.call(document.querySelectorAll('pre'), function (node) {
    var btnRun = document.createElement('BUTTON');
    btnRun.innerHTML = 'Run';
    btnRun.classList.add('btn');
    btnRun.classList.add('btn--run');
    btnRun.addEventListener('click', function () {
      var code = node.firstChild.innerText || node.firstChild.firstChild.value;
      console.log(code);
      eval(code);
    });

    var btnEdit = document.createElement('BUTTON');
    btnEdit.innerHTML = 'Edit';
    btnEdit.classList.add('btn');
    btnEdit.classList.add('btn--edit');
    btnEdit.addEventListener('click', function () {
      node.firstChild.innerHTML = '<textarea>{0}</textarea>'.format(node.firstChild.innerText);
    });

    var btnSave = document.createElement('BUTTON');
    btnSave.innerHTML = 'Save';
    btnSave.classList.add('btn');
    btnSave.classList.add('btn--save');
    btnSave.addEventListener('click', function () {
      if (node.firstChild.firstChild.value) {
        node.firstChild.innerHTML = node.firstChild.firstChild.value;
        hljs.highlightBlock(node.firstChild);
      }
    });

    util.dom.wrap(node);
    util.dom.insert(btnRun, node);
    util.dom.insert(btnEdit, node);
    util.dom.insert(btnSave, node);
  });
});
