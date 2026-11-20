/* Strictly ES5 for Opera Mini 4.4 Presto Proxy Compatibility */
(function () {
  // Default configurable backend API endpoint
  var DEFAULT_API_BASE = 'https://your-backend-api.example.com/api/extract';
  var apiBase = DEFAULT_API_BASE;

  // DOM Element Lookups
  var form = document.getElementById('dl-form');
  var urlInput = document.getElementById('video-url');
  var qualitySelect = document.getElementById('quality');
  var submitBtn = document.getElementById('submit-btn');
  var clearBtn = document.getElementById('clear-btn');
  var statusBox = document.getElementById('status-box');
  var statusText = document.getElementById('status-text');
  var resultBox = document.getElementById('result-box');
  var videoTitle = document.getElementById('video-title');
  var videoMeta = document.getElementById('video-meta');
  var downloadLink = document.getElementById('download-link');

  // Config Panel Elements
  var toggleCfg = document.getElementById('toggle-cfg');
  var cfgPanel = document.getElementById('cfg-panel');
  var apiBaseInput = document.getElementById('api-base');
  var saveCfgBtn = document.getElementById('save-cfg');

  // Load saved endpoint from cookie (more reliable than localStorage in Opera Mini 4.4)
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, val) {
    document.cookie = name + '=' + encodeURIComponent(val) + '; path=/; max-age=31536000';
  }

  var savedEndpoint = getCookie('liteget_api');
  if (savedEndpoint) {
    apiBase = savedEndpoint;
  }
  apiBaseInput.value = apiBase;
  form.action = apiBase;

  function showStatus(msg, isError) {
    statusBox.className = isError ? 'box err-box' : 'box';
    statusText.innerHTML = msg;
  }

  function hideStatus() {
    statusBox.className = 'box hidden';
  }

  function hideResult() {
    resultBox.className = 'box result-box hidden';
  }

  function parseJsonSafe(str) {
    if (window.JSON && typeof window.JSON.parse === 'function') {
      return window.JSON.parse(str);
    }
    // Fallback for legacy JS engines without native JSON
    return eval('(' + str + ')');
  }

  function requestVideoLink(targetUrl, quality) {
    var xhr;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else {
      // Fallback to standard form GET submission if XHR is unavailable
      form.submit();
      return;
    }

    var query = '?url=' + encodeURIComponent(targetUrl) + '&quality=' + encodeURIComponent(quality);
    var requestUrl = apiBase + query;

    submitBtn.disabled = true;
    submitBtn.value = 'Loading...';
    hideResult();
    showStatus('Contacting backend... Please wait.', false);

    xhr.open('GET', requestUrl, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        submitBtn.disabled = false;
        submitBtn.value = 'Get Link';

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = parseJsonSafe(xhr.responseText);
            if (data && data.download_url) {
              hideStatus();
              videoTitle.innerHTML = data.title ? data.title : 'Ready to Download';
              videoMeta.innerHTML = 'Quality: ' + (data.quality || quality) +
                (data.size ? ' | Size: ' + data.size : '');
              downloadLink.href = data.download_url;
              resultBox.className = 'box result-box';
            } else {
              showStatus(data && data.error ? data.error : 'Backend returned no download URL.', true);
            }
          } catch (e) {
            showStatus('Invalid response format from backend.', true);
          }
        } else {
          showStatus('Server Error (HTTP ' + xhr.status + '). Check API endpoint.', true);
        }
      }
    };

    xhr.onerror = function () {
      submitBtn.disabled = false;
      submitBtn.value = 'Get Link';
      showStatus('Network error. Could not reach API.', true);
    };

    xhr.send(null);
  }

  // Event Bindings (DOM Level 0 for maximum compatibility)
  form.onsubmit = function (e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    var val = urlInput.value.replace(/^\s+|\s+$/g, '');
    if (!val) {
      showStatus('Please enter a valid video URL.', true);
      return false;
    }
    requestVideoLink(val, qualitySelect.value);
    return false;
  };

  clearBtn.onclick = function () {
    urlInput.value = '';
    hideStatus();
    hideResult();
    urlInput.focus();
  };

  toggleCfg.onclick = function (e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (cfgPanel.className.indexOf('hidden') !== -1) {
      cfgPanel.className = 'cfg-panel';
    } else {
      cfgPanel.className = 'cfg-panel hidden';
    }
    return false;
  };

  saveCfgBtn.onclick = function () {
    var newUrl = apiBaseInput.value.replace(/^\s+|\s+$/g, '');
    if (newUrl) {
      apiBase = newUrl;
      form.action = apiBase;
      setCookie('liteget_api', apiBase);
      showStatus('API endpoint saved.', false);
    }
  };
})();