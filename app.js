/* ============================================================
   Retro Downloader - app.js
   Strictly ES5. No fetch, no promises, no arrow functions,
   no let/const, no template strings.
   ============================================================ */

var RETRO_CONFIG = {
  apiBase: "",        
  timeoutMs: 120000,   /* 2 minutes to give Render time to download and merge */
  useJson: true       
};

(function () {
  "use strict";

  var form = document.getElementById("dl-form");
  if (!form) { return; }

  var statusEl = document.getElementById("status");
  var resultEl = document.getElementById("result");
  var inputEl  = document.getElementById("url");
  var selectEl = document.getElementById("quality");

  var apiBase = RETRO_CONFIG.apiBase || form.getAttribute("action") || "/download";
  try { form.setAttribute("action", apiBase); } catch (e0) {}

  var busy = false;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function trim(s) {
    return String(s).replace(/^\s+|\s+$/g, "");
  }

  function setStatus(text, cls) {
    if (!statusEl) { return; }
    statusEl.innerHTML = esc(text);
    statusEl.className = "status" + (cls ? " " + cls : "");
  }

  function setResult(html) {
    if (resultEl) { resultEl.innerHTML = html; }
  }

  function hasXhr() {
    return typeof XMLHttpRequest !== "undefined";
  }

  function buildUrl(base, target, quality) {
    var sep = base.indexOf("?") === -1 ? "?" : "&";
    var out = base + sep + "url=" + encodeURIComponent(target) + "&quality=" + encodeURIComponent(quality);
    if (RETRO_CONFIG.useJson) { out += "&format=json"; }
    return out;
  }

  function parseJson(text) {
    if (!text) { return null; }
    if (typeof JSON !== "undefined" && JSON.parse) {
      try { return JSON.parse(text); } catch (e1) { return null; }
    }
    try { return eval("(" + text + ")"); } catch (e2) { return null; }
  }

  function showLink(link, title, size, quality) {
    setStatus("Done. Tap the button below to download.", "ok");
    var html = "";
    if (title) { html += '<p class="file">' + esc(title) + "</p>"; }
    html += '<p><a class="btn" href="' + esc(link) + '">Download ' + esc(quality || "file") + "</a></p>";
    if (size) { html += '<p class="meta">Size: ' + esc(size) + "</p>"; }
    html += '<p class="meta">If the download stalls, open the link again.</p>';
    setResult(html);
  }

  function showFailure(requestUrl, message) {
    setStatus(message, "err");
    setResult('<p class="hint">If this keeps happening, <a href="' + esc(requestUrl) + '">open the request directly</a>.</p>');
  }

  function handleResponse(text, requestUrl, quality) {
    busy = false;
    var data = parseJson(text);

    if (!data) {
      var bare = trim(text);
      if (bare.substring(0, 4) === "http") {
        showLink(bare, "", "", quality);
        return;
      }
      showFailure(requestUrl, "Server sent an unreadable answer.");
      return;
    }

    if (data.ok === false || data.error) {
      showFailure(requestUrl, data.error || "Server refused this link.");
      return;
    }

    var link = data.download_url || data.downloadUrl || data.url || data.link || "";
    if (!link) {
      showFailure(requestUrl, "No download link found.");
      return;
    }

    showLink(link, data.title || "", data.size || "", data.quality || quality);
  }

  function extractError(text) {
    var d = parseJson(text);
    return (d && d.error) ? d.error : "";
  }

  function send(requestUrl, quality) {
    var xhr;
    try {
      xhr = new XMLHttpRequest();
    } catch (e1) {
      busy = false;
      showFailure(requestUrl, "Browser cannot send background requests.");
      return;
    }

    var done = false;

    var timer = setTimeout(function () {
      if (done) { return; }
      done = true;
      try { xhr.abort(); } catch (e2) {}
      busy = false;
      showFailure(requestUrl, "Server took too long to answer.");
    }, RETRO_CONFIG.timeoutMs);

    xhr.onreadystatechange = function () {
      if (done) { return; }
      if (xhr.readyState !== 4) { return; }
      done = true;
      clearTimeout(timer);

      var text = "";
      try { text = xhr.responseText || ""; } catch (e3) {}

      if (xhr.status >= 200 && xhr.status < 300) {
        handleResponse(text, requestUrl, quality);
      } else if (xhr.status === 0) {
        busy = false;
        showFailure(requestUrl, "No connection to server (offline/blocked).");
      } else {
        busy = false;
        showFailure(requestUrl, extractError(text) || ("Server error " + xhr.status + "."));
      }
    };

    try {
      xhr.open("GET", requestUrl, true);
      xhr.send(null);
    } catch (e4) {
      done = true;
      clearTimeout(timer);
      busy = false;
      showFailure(requestUrl, "Could not start request.");
    }
  }

  form.onsubmit = function () {
    var target  = trim(inputEl ? inputEl.value : "");
    var quality = selectEl ? selectEl.value : "240p";

    if (!target) {
      setStatus("Paste a video link first.", "err");
      setResult("");
      return false;
    }

    if (busy) { return false; }

    var requestUrl = buildUrl(apiBase, target, quality);

    if (!hasXhr()) {
      setStatus("Sending request the simple way...", "busy");
      return true; 
    }

    busy = true;
        setStatus("Processing video. Please wait up to 2 mins...", "busy");
    setResult("");
    send(requestUrl, quality);
    return false;
  };

})();
