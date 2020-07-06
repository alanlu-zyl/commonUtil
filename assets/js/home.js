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
});
