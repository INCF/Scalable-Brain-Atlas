var browser = {
  // see compatibility table at http://www.quirksmode.org/js/doctypes.html
  document: function(wdw) {
    if (wdw == undefined) wdw = window;
    return wdw.document ? wdw.document : wdw.contentDocument;
  },
  documentBody: function(wdw) {
    return browser.document(wdw).body;
  },
  documentHeight: function() {
    // all except Explorer
    if (self.innerHeight) 
       return self.innerHeight;
    // Explorer 6 Strict Mode
    if (document.documentElement && document.documentElement.clientHeight) 
       return document.documentElement.clientHeight;
    // other Explorers
    if (document.body) 
       return document.body.clientHeight;
    // default
    return 750;
  },
  documentWidth: function() {
    // all except Explorer
    if (self.innerWidth) 
       return self.innerWidth;
    // Explorer 6 Strict Mode
    if (document.documentElement && document.documentElement.clientWidth) 
       return document.documentElement.clientWidth;
    // other Explorers
    if (document.body) 
       return document.body.clientWidth;
    // default
    return 1000;
  },
  elemHeight: function(elem) {
    return elem ? elem.offsetHeight : 0;
  },
  elemWidth: function(elem) {
    return elem ? elem.offsetWidth : 0;
  },
  elemByIdHeight: function(id) {
    return browser.elemHeight(document.getElementById(id));
  },  
  elemByIdWidth: function(id) {
    return browser.elemWidth(document.getElementById(id));
  },  
  getKeyCode: function(ev) {
    if(window.event) { return window.event.keyCode; } //IE
    else if(ev) { return ev.keyCode; } //Moz
  },
  getEventSource: function(ev) {
    if (window.event) { return window.event.srcElement; } //IE
    else if (ev) { return ev.target; } //Moz
  },
  getEventToElement: function(ev) {
    if (window.event) { return window.event.toElement; } //IE
    else if (ev) { return ev.relatedTarget; } //Moz
  },
  getFrame: function(name) {
    return window.frames[name];
  },
  getSelectedValue: function(elem) {
    var sel = elem.options[elem.selectedIndex];
    return (sel.innerText == undefined ? sel.value : sel.innerText);
  },
  cancelBubble: function(ev) {
    if(window.event) { //IE
      window.event.cancelBubble = true;
    } else if(ev) { //Moz
      ev.stopPropagation();
    }
  },
  cancelEvent: function(ev) {
    if(window.event) { //IE
      window.event.returnValue = false;
      window.event.cancelBubble = true;
    } else if(ev) { //Moz
      ev.preventDefault();
      ev.stopPropagation();
    }
  },
  pleaseWait: function(elem) {
    if (elem == undefined) {
      var divElem = document.getElementById('BROWSER_PLEASE_WAIT');
      if (divElem && divElem.parentNode) divElem.parentNode.removeChild(divElem);
      return;
    }
    var wait = document.createElement('div');
    wait.id = 'BROWSER_PLEASE_WAIT';
    wait.className = 'pleaseWait';
    wait.innerHTML = 'Loading...';
    wait.display = 'block';
    wait.style.position = 'absolute';
    wait.style.zIndex = 255;
    elem.appendChild(wait);
    wait.style.top = 0;
    wait.style.left = ''+(elem.offsetWidth - wait.offsetWidth-10)+'px';
  },
  removeNode: function(elem) {
    elem.parentNode.removeChild(elem);
  },
  textareaValue: function(elem) {
    return (elem.innerText == undefined ? elem.value : elem.innerText);
  },
  fileExt: function(path) {
    var i = path.lastIndexOf('.');
    return i == -1 ? '' : path.substr(i+1);
  },
  fileName: function(path) {
    var i = path.lastIndexOf('/');
    return i == -1 ? path : path.substr(i+1);
  },
  require_once: function(url,onload,type) {
    var name = browser.fileName(url);
    if (!type) type = browser.fileExt(name);
    if (!browser.included) browser.included = {};
    if (browser.included[name] == 2) return true; // done
    if (browser.included[name] == 1) return false; // started
    browser.included[name] = 1;
    var elem;
    if (type == 'js') {
      elem = document.createElement('script');
      elem.setAttribute('type','text/javascript');
      elem.setAttribute('src',url);
    } else if (type == 'css') {
      elem = document.createElement('link');
      elem.setAttribute('rel','stylesheet');
      elem.setAttribute('href',url);
    }
    elem.onreadystatechange = elem.onload = function() {
      browser.included[name] = 2;
      if (onload) onload();
    };
    document.getElementsByTagName('head')[0].appendChild(elem);
    return false;
  },
  // DEPRECATED
  include_script_once: function(url) {
    return browser.require_once(url,undefined,'js');
  },
  // DEPRECATED
  include_style_once: function(url) {
    return browser.require_once(url,undefined,'css');
  },
  htmlspecialchars: function(s) {
    return (typeof(s) == 'string' ? s.replace('<', "&lt;").replace('>', "&gt;") : s);
  }
}
