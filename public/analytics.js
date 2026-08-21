(function () {
  function onClick(event) {
    var link = event.target.closest && event.target.closest("[data-event='affiliate_click']");
    if (!link) return;
    var detail = {
      event: "affiliate_click",
      product: link.getAttribute("data-product"),
      article: link.getAttribute("data-article"),
      placement: link.getAttribute("data-placement")
    };
    window.dispatchEvent(new CustomEvent("affiliate_click", { detail: detail }));
  }
  document.addEventListener("click", onClick, { passive: true });
})();
