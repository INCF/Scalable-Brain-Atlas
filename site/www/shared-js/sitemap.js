browser.require_once('../shared-js/json.js');

function siteMap_class(siteMap) {
  this.siteMap = siteMap;
}

siteMap_class.prototype.menu = function(callerElem,path) {
  var parts = (path == '' ? [] : path.split('|'));
  var sm = this.siteMap;
  for (var k in parts) if (parts.hasOwnProperty(k)) {
    sm = sm[parts[k]];
  }
  var pages = [];
  for (k in sm) if (k != '@' && sm.hasOwnProperty(k)) {
    var page = sm[k]['@'];
    if (!page) {
      page = { 
        "title": k+'&#160;&#9658;',
        "phpFile": '../sitemap/index.php?path='+path+(path=='' ? '' : '|')+k 
      };
    }
    pages.push('<a class="sm-menu" href="'+page.phpFile+'">'+page.title+'</a>');
  }

  var id = 'SITEMAP_MENU';
  divElem = document.getElementById(id);
  var anchorElem = callerElem.offsetParent;
  if (divElem == undefined) {
    divElem = document.createElement("div");
    divElem.style.visibility = 'hidden';
    divElem.id = id;
    divElem.style.position = 'absolute';
    divElem.className = 'sm-menu';
    divElem.style.zIndex = '20';
    divElem.onmouseout = function(ev) {
      // use if browser does not support document.activeElement
      var elem = browser.getEventToElement(ev);
      if (elem && elem != this) {
        var p = elem;
        while (p = p['offsetParent'])  {
          if (p==divElem) { divElem.focus(); return; }
        }
        this.style.visibility = 'hidden';
      }
    }
    anchorElem.appendChild(divElem);
  }
  divElem.style.width = null;
  divElem.innerHTML = pages.join('');

  // calculate absolute position of callerElem w.r.t. callerNode
  var oShiftRight = 0.25*callerElem.offsetWidth;
  var oTop = callerElem.offsetTop+callerElem.offsetHeight;
  var oLeft = callerElem.offsetLeft+oShiftRight;

  divElem.style.display = 'block';
  divElem.style.top = ''+(oTop+anchorElem.scrollTop)+'px';
  divElem.style.left = ''+oLeft+'px';
  divElem.style.width = ''+divElem.offsetWidth+'px';
  divElem.style.visibility = 'visible';
  
}
