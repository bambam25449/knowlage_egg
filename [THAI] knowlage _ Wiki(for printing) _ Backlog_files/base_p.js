/**
 * Backlog - base.js
 *
 * @requires jquery.js
 */
if (typeof Backlog == "undefined" || !Backlog) {
  var Backlog = {};
}

(function () {
  var basePath = "";
  var s = document.getElementsByTagName("script");
  s = s[s.length - 1];
  var matches = s.src.match(/base_p\.(?:[^.]*\.)?js\?.*bp=([a-z,/]*)/);
  if (matches) {
    basePath = matches[1];
  }
  Backlog.getBasePath = function () {
    return basePath;
  };

  var assetBasePath = jQuery("link[rel=assets]").attr("href");
  Backlog.getAssetBasePath = function () {
    return assetBasePath;
  };

  var modalDialogs = [];
})();

Backlog.getAssetPath = function (path) {
  return (
    Backlog.getAssetBasePath() + (path.indexOf("/") === 0 ? "" : "/") + path
  );
};
Backlog.getUserIconUrl = function (path) {
  if (path.match(/^https?:\/\//)) {
    return path;
  } else if (path.match(/^icons\//)) {
    return Backlog.getAssetPath(path);
  } else if (path.match(/^shared\/img\/icon\//)) {
    return Backlog.getAssetPath(path);
  } else if (path.match(/^images\/svg\/icon_paticients\.svg$/)) {
    return Backlog.getAssetPath(path);
  } else {
    return Backlog.getBasePath() + (path.indexOf("/") === 0 ? "" : "/") + path;
  }
};
Backlog.getProjectIconUrl = function (path) {
  if (path.match(/^https?:\/\//)) {
    return path;
  } else if (path.match(/^project_icons\//)) {
    return Backlog.getAssetPath(path);
  } else {
    return Backlog.getBasePath() + (path.indexOf("/") === 0 ? "" : "/") + path;
  }
};

/**
 * 一定時間毎に処理を実行
 */
Backlog.Timer = function (interval, callback) {
  var val = interval || 60000;

  if (!callback) return false;

  _timer = function (interval, callback) {
    this.stop = function () {
      clearInterval(self.id);
    };
    this.internalCallback = function () {
      callback(self);
    };
    this.reset = function (val) {
      if (self.id) clearInterval(self.id);

      var newval = val || 60000;
      this.id = setInterval(this.internalCallback, newval);
    };
    this.interval = interval;
    this.id = setInterval(this.internalCallback, this.interval);
    var self = this;
  };
  return new _timer(val, callback);
};

/**
 * input 内でのカーソルの位置を取得、設定する
 *
 * @see http://d.hatena.ne.jp/brazil/20061021/1161377936
 * @see http://d.hatena.ne.jp/language_and_engineering/20090225/p1
 */
Backlog.Caret = {
  getPos: function (elm) {
    if (!elm) {
      return null;
    }
    elm.focus();
    return Backlog.Caret.doGetPos(elm);
  },
  doGetPos: function (elm) {
    // 通知用の @記法の場合、呼び出しが頻発するのでブラウザ判別の部分を遅延評価してスルー出来るように
    if (
      document.selection &&
      document.selection.createRange &&
      elm.createTextRange
    ) {
      // IE
      Backlog.Caret.doGetPos = function (elm) {
        var range = document.selection.createRange(),
          textRange = null;
        if (elm.tagName.toUpperCase() === "TEXTAREA") {
          var tmpRange = document.body.createTextRange();
          tmpRange.moveToElementText(elm);
          textRange = tmpRange.duplicate();
        } else {
          textRange = elm.createTextRange();
        }
        textRange.setEndPoint("EndToStart", range);
        return textRange.text.length;
      };
    } else {
      // FF and the others
      Backlog.Caret.doGetPos = function (elm) {
        if (elm.selectionStart) {
          return elm.selectionStart;
        }
        return -1;
      };
    }
    return Backlog.Caret.doGetPos(elm);
  },
  setPos: function (elm, pos) {
    if (pos < 0 || !elm) {
      return;
    }
    if (elm.createTextRange) {
      // IE
      var textRange = elm.createTextRange();
      textRange.collapse();
      textRange.moveEnd("character", pos);
      textRange.moveStart("character", pos);
      textRange.select();
    } else if (elm.setSelectionRange) {
      // FF and the others
      elm.setSelectionRange(pos, pos);
    }
  },
};

Backlog.Element = {
  /**
   * Firefox 4.0 で Prototype.js の Element.replace が select 要素に対して動かなくなったため
   * https://nulab.backlog.jp/view/BLG-2539
   */
  replace: function (element, html) {
    element = $(element);
    html = typeof html == "undefined" ? "" : html.toString();
    if (element.outerHTML) {
      element.outerHTML = html.stripScripts();
    } else {
      var range = element.ownerDocument.createRange();
      // range.selectNodeContents(element);
      range.selectNode(element);
      element.parentNode.replaceChild(
        range.createContextualFragment(html.stripScripts()),
        element
      );
    }
    setTimeout(function () {
      html.evalScripts();
    }, 10);
    return element;
  },
};

/**
 * selectを単一選択から複数選択に変更する
 */
Backlog.multiSelectHandler = function (select) {
  var $select = jQuery(select);
  if ($select.hasClass("chzn-done")) {
    $select.next(".chzn-container").hide();
  }
  var selected = $select.val();
  var newSelect;
  if (select.size > 0) {
    newSelect = jQuery(
      "<select id='" +
        select.id +
        "' ' name='" +
        select.name +
        "' tabindex='" +
        $select.attr("tabindex") +
        "'>" +
        $select.html() +
        "</select>"
    );
  } else {
    newSelect = jQuery(
      "<select multiple='multiple' id='" +
        $select.attr("id") +
        "' ' name='" +
        $select.attr("name") +
        "' tabindex='" +
        $select.attr("tabindex") +
        "' size='5'>" +
        $select.html() +
        "</select>"
    );
  }
  //	$(select.id).selectedIndex = selected;
  $select.replaceWith(newSelect);
  if ($select.hasClass("errInput")) {
    newSelect.addClass("errInput");
  }
  newSelect.val(selected).trigger(Backlog.Event.MULTISELECT_SWITCHED);
};
function switching(select, a) {
  a.style.display = "none";
  Backlog.multiSelectHandler(select);
}

Backlog.selectMe = function (select, me) {
  if (typeof select === "string") {
    select = $(select);
  }
  if (!select || !select.options) {
    return;
  }
  for (var i = 0; i < select.options.length; i++) {
    if (select.options[i].value == me) {
      select.options[i].selected = true;
    } else {
      select.options[i].selected = false;
    }
  }
  if (jQuery(select).hasClass("chzn-done")) {
    jQuery(select).trigger("liszt:updated");
  }
};
Backlog.attribToHtml = function (str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
};

Backlog.Textarea = {
  noscroll: function (textareas) {
    // BLG-2654 IE8 の問題への対応 : https://nulab.backlog.jp/view/BLG-2654
    if (/MSIE (\d+)\.\d+;/.test(navigator.userAgent)) {
      var version = RegExp.$1;
      if (version == "8") {
        for (var i = 0, len = textareas.length; i < len; i++) {
          var textarea = document.getElementById(textareas[i]);
          if (textarea && textarea.cols) {
            textarea.cols = 10000;
          }
        }
      }
    }
  },
};

Backlog.escapeHTML = function (value) {
  if (value) {
    return jQuery("<div>").text(value).html();
  } else {
    return "";
  }
};

Backlog.unescapeHTML = function (value) {
  if (value) {
    var doc = new DOMParser().parseFromString(value, "text/html");
    return doc.documentElement.textContent;
  } else {
    return "";
  }
};

Backlog.replaceCsrfToken = function (xhr, status) {
  if (xhr.status == 200 || xhr.status == 403) {
    var token = xhr.getResponseHeader("X-CSRF-Token");
    if (token) {
      jQuery("input[name='csrf-token']").each(function () {
        jQuery(this).val(token);
      });
    }
  }
};

// jQuery.ajax 共通処理
// ( Ajax時に自動ログインが発生した場合に更新されたトークンに交換 )
jQuery.ajaxSetup({
  complete: function (xhr, status) {
    Backlog.replaceCsrfToken(xhr, status);
  },
});

// UAを確認してiPhone,Androidの場合にhtml要素にクラス追加
jQuery(document).ready(function () {
  var agent = navigator.userAgent;
  if (agent.search(/iPhone/) != -1) {
    jQuery("html").addClass("iPhone");
  } else if (agent.search(/Android/) != -1) {
    jQuery("html").addClass("android");
  }
});

// 各種サポートに関するショートカット
Backlog.support = {
  localStorage: "localStorage" in window && window["localStorage"] !== null,
};

// 機能間をまたがるイベント
Backlog.Event = {
  // カスタム属性のフォームの表示が完了した場合に発火
  ATTRIBUTE_FORM_INITIALIZED: "AttributeFormInitialized",
  // マルチセレクトに変化した場合に発火
  MULTISELECT_SWITCHED: "MultiselectSwitched",
};

/** ConvertUtil#formatHumanReadableBytes と同様のロジックでのバイト表記 */
Backlog.formatBytes = function (baseNumber) {
  var num = baseNumber,
    label = "";
  if (baseNumber < 1024) {
    label = "B";
  } else if (baseNumber < 524288) {
    num = baseNumber / 1024;
    label = "KB";
  } else if (baseNumber < 1073741824) {
    num = baseNumber / 1048576;
    label = "MB";
  } else {
    num = baseNumber / 1073741824;
    label = "GB";
  }
  return num.toFixed(1) + " " + label;
};

Backlog.isTouchDevice = function () {
  return !!("ontouchstart" in window);
};

Backlog.isIOSOrAndroidDevice = function () {
  var agent = navigator.userAgent.toLowerCase();
  return agent.search(/iphone|ipad|ipod|android/) != -1;
};

/**
 * IE8 判定用
 * jQuery.browser は非推奨なので jQuery.support で判定します
 *
 * @returns {boolean|*} IE8 の場合に true
 */
Backlog.isIE8 = function () {
  return !jQuery.support.leadingWhitespace && jQuery.support.hrefNormalized;
};

// the method will be overwritten when mixpanel tracking enabled in mixpanel.js
Backlog.dispatcher = {
  on: jQuery.noop,
  trigger: jQuery.noop,
};

Backlog.onLogout = function () {
  if (Backlog.support.localStorage) {
    var regex = /^\d+-FindIssueTableColumns:.+/;
    // known issue: can't remove key:tree data because of tree.jquery.js
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.match(regex) === null) {
        localStorage.removeItem(key);
      }
    }
  }
};

Backlog.preventMultipleSubmit = function (form) {
  var submitted = false;
  form.addEventListener("submit", function (e) {
    if (submitted) {
      e.preventDefault();
    } else {
      submitted = true;
    }
  });
};

Backlog.onNulabAppsLogout = function () {
  if (Backlog.nulabLaunchBox) {
    Backlog.nulabLaunchBox.signout();
  } else {
    location.href = Backlog.getBasePath() + "/Logout.action?from=lb";
  }
};
