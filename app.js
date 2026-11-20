/* Strictly ES5 for Opera Mini 4.4 Presto Proxy Compatibility */
(function () {
  var DEFAULT_API_HOST = 'https://retro-downloader-api.onrender.com';
  var apiHost = DEFAULT_API_HOST;

  var form = document.getElementById('dl-form');
  var siteSelect = document.getElementById('site-select');
  var inputLbl = document.getElementById('input-lbl');
  var urlInput = document.getElementById('video-url');
  var qualitySelect = document.getElementById('quality');
  var submitBtn = document.getElementById('submit-btn');
  var clearBtn = document.getElementById('clear-btn');
  var statusBox = document.getElementById('status-box');
  var statusText = document.getElementById('status-text');
  var searchBox = document.getElementById('search-box');
  var searchList = document.getElementById('search-list');
  var resultBox = document.getElementById('result-box');
  var videoTitle = document.getElementById('video-title');
  var videoMeta = document.getElementById('video-meta');
  var downloadLink = document.getElementById('download-link');

  var toggleCfg = document.getElementById('toggle-cfg');
  var cfgPanel = document.getElementById('cfg-panel');
  var apiBaseInput = document.getElementById('api-base');
  var saveCfgBtn = document.getElementById('save-cfg');

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, val) {
    document.cookie = name + '=' + encodeURIComponent(val) + '; path=/; max-age=31536000';
  }

  function normalizeHost(raw) {
    return raw.replace(/\/api\/(extract|search)\/?$/, '').replace(/\/+$/, '');
  }

  var savedEndpoint = getCookie('liteget_api');
  if (savedEndpoint) {
    apiHost = normalizeHost(savedEndpoint);
  }
  apiBaseInput.value = apiHost;

  function updateModeUI() {
    if (siteSelect.value === 'url') {
      inputLbl.innerHTML = 'Video URL:';
      submitBtn.value = 'Get Link';
      form.action = apiHost + '/api/extract';
    } else {
      inputLbl.innerHTML = 'Search Keywords:';
      submitBtn.value = 'Search';
      form.action = apiHost + '/api/search';
    }
  }

  siteSelect.onchange = updateModeUI;
  updateModeUI();

  function showStatus(msg, isError) {
    statusBox.className = isError ? 'box err-box' : 'box';
    statusText.innerHTML = msg;
  }

  function hideStatus() {
    statusBox.className = 'box hidden';
  }

  function hideAllResults() {
    searchBox.className = 'box hidden';
    resultBox.className = 'box result-box hidden';
  }

  function parseJsonSafe(str) {
    if (window.JSON && typeof window.JSON.parse === 'function') {
      return window.JSON.parse(str);
    }
    return eval('(' + str + ')');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function requestVideoLink(targetUrl, quality) {
    if (!window.XMLHttpRequest) {
      form.submit();
      return;
    }
    var xhr = new XMLHttpRequest();
    var requestUrl = apiHost + '/api/extract?url=' + encodeURIComponent(targetUrl) +
      '&quality=' + encodeURIComponent(quality);

    submitBtn.disabled = true;
    resultBox.className = 'box result-box hidden';
    showStatus('Fetching ' + quality + ' link... Please wait.', false);

    xhr.open('GET', requestUrl, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        submitBtn.disabled = false;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = parseJsonSafe(xhr.responseText);
            if (data && data.download_url) {
              hideStatus();
              videoTitle.innerHTML = escapeHtml(data.title || 'Ready to Download');
              videoMeta.innerHTML = 'Quality: ' + escapeHtml(data.quality || quality) +
                (data.size ? ' | Size: ' + escapeHtml(data.size) : '');
              downloadLink.href = data.download_url;
              resultBox.className = 'box result-box';
            } else {
              showStatus(data && data.error ? escapeHtml(data.error) : 'No download URL returned.', true);
            }
          } catch (e) {
            showStatus('Invalid response from backend.', true);
          }
        } else {
          showStatus('Server Error (HTTP ' + xhr.status + ').', true);
        }
      }
    };
    xhr.onerror = function () {
      submitBtn.disabled = false;
      showStatus('Network error reaching backend.', true);
    };
    xhr.send(null);
  }

  function renderSearchResults(results) {
    if (!results || !results.length) {
      showStatus('No videos found for that search.', true);
      return;
    }
    hideStatus();
    var html = '';
    for (var i = 0; i < results.length; i++) {
      var item = results[i];
      var dur = item.duration ? ' <span class="sr-dur">[' + escapeHtml(item.duration) + ']</span>' : '';
      html += '<a href="#pick" class="sr-item" data-url="' + escapeHtml(item.url) + '">' +
        (i + 1) + '. ' + escapeHtml(item.title) + dur + '</a>';
    }
    searchList.innerHTML = html;
    searchBox.className = 'box';

    var links = searchList.getElementsByTagName('a');
    for (var j = 0; j < links.length; j++) {
      links[j].onclick = function (e) {
        if (e && e.preventDefault) {
          e.preventDefault();
        }
        var pickedUrl = this.getAttribute('data-url');
        if (pickedUrl) {
          requestVideoLink(pickedUrl, qualitySelect.value);
        }
        return false;
      };
    }
  }

  function requestSearch(site, keyword) {
    if (!window.XMLHttpRequest) {
      form.submit();
      return;
    }
    var xhr = new XMLHttpRequest();
    var requestUrl = apiHost + '/api/search?site=' + encodeURIComponent(site) +
      '&q=' + encodeURIComponent(keyword);

    submitBtn.disabled = true;
    hideAllResults();
    showStatus('Searching ' + site + '... Please wait.', false);

    xhr.open('GET', requestUrl, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        submitBtn.disabled = false;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = parseJsonSafe(xhr.responseText);
            if (data && data.results) {
              renderSearchResults(data.results);
            } else {
              showStatus(data && data.error ? escapeHtml(data.error) : 'Search failed.', true);
            }
          } catch (e) {
            showStatus('Invalid search response from backend.', true);
          }
        } else {
          showStatus('Search Error (HTTP ' + xhr.status + ').', true);
        }
      }
    };
    xhr.onerror = function () {
      submitBtn.disabled = false;
      showStatus('Network error reaching backend.', true);
    };
    xhr.send(null);
  }

  form.onsubmit = function (e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    var val = urlInput.value.replace(/^\s+|\s+$/g, '');
    if (!val) {
      showStatus('Please enter a keyword or URL.', true);
      return false;
    }
    if (siteSelect.value === 'url') {
      hideAllResults();
      requestVideoLink(val, qualitySelect.value);
    } else {
      requestSearch(siteSelect.value, val);
    }
    return false;
  };

  clearBtn.onclick = function () {
    urlInput.value = '';
    hideStatus();
    hideAllResults();
    urlInput.focus();
  };

  toggleCfg.onclick = function (e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    cfgPanel.className = cfgPanel.className.indexOf('hidden') !== -1 ? 'cfg-panel' : 'cfg-panel hidden';
    return false;
  };

  saveCfgBtn.onclick = function () {
    var newUrl = apiBaseInput.value.replace(/^\s+|\s+$/g, '');
    if (newUrl) {
      apiHost = normalizeHost(newUrl);
      apiBaseInput.value = apiHost;
      setCookie('liteget_api', apiHost);
      updateModeUI();
      showStatus('Backend host saved.', false);
    }
  };
})();
