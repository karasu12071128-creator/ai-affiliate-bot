(function () {
  var SELECTOR = "[data-event='affiliate_click'],[data-event='outbound_click']";

  function onClick(event) {
    var link = event.target.closest && event.target.closest(SELECTOR);
    if (!link) return;
    var name = link.getAttribute("data-event");
    var detail = {
      event: name,
      product: link.getAttribute("data-product"),
      article: link.getAttribute("data-article"),
      placement: link.getAttribute("data-placement")
    };
    window.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  document.addEventListener("click", onClick, { passive: true });
})();
