browser.include_script_once('../js/json.js');

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
        "phpFile": '../sitemap.php?path='+path+(path=='' ? '' : '|')+k 
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

/*
function divWindow_class(name,anchorElemId) {
  this.name = name;
  this.anchorElemId = anchorElemId;
}

divWindow_class.prototype.addStyle = function(divElem) {
}

divWindow_class.prototype.addBehavior = function(divElem) {
}

divWindow_class.prototype.render = function(callerElem,htmlContent) {
  // create window element
  this.hide();
  var divElem = document.createElement("div");
  divElem.id = 'divWindow_'+this.name;
  divElem.style.position = 'absolute';
  divElem.style.display = 'none';
  divElem.style.zIndex = "10";
  divElem.innerHTML = htmlContent;
  this.addStyle(divElem);
  this.addBehavior(divElem);
  var anchorElem = document.getElementById(this.anchorElemId);
  if (!anchorElem) anchorElem = callerElem.offsetParent;
  anchorElem.appendChild(divElem);
  // callerElem.parentNode.insertBefore(divElem,callerElem.nextSibling);

  // calculate absolute position of callerElem w.r.t. callerNode
  var oShiftRight = 0.25*callerElem.offsetWidth;
  var oTop = callerElem.offsetTop+callerElem.offsetHeight+1;
  var oLeft = callerElem.offsetLeft+oShiftRight;
  var oParent = callerElem.offsetParent;
  var i = 0;
  var anchored = false;
  while (oParent) {  
    if (oParent == anchorElem) anchored = true;
    if (!anchored) {
      oTop += oParent.offsetTop - oParent.scrollTop;
      oLeft += oParent.offsetLeft - oParent.scrollLeft;
    }
    if (i++>32) { alert('Too many offsetParents in divWindow_class.render().'); return; }
    oParent = oParent.offsetParent;
  }

  // make visible
  divElem.style.display = 'block';
  var oWidth = divElem.offsetWidth;
  var leftMax = browser.documentWidth()-20-oWidth;
  if (oLeft > leftMax) { oLeft = leftMax; }
  divElem.style.top = ''+(oTop+divElem.offsetParent.scrollTop)+'px';
  divElem.style.left = ''+oLeft+'px';
  divElem.style.width = oWidth;

  // focus on first editable field
  divElem.focus();
}


function autoHideWindow_class(name,anchorElemId) {
  divWindow_class.apply(this,[name,anchorElemId]);
}
autoHideWindow_class.prototype = new divWindow_class();

autoHideWindow_class.prototype.addStyle = function(divElem) {
  divElem.className = 'autoHide';
}

autoHideWindow_class.prototype.onmouseout = function(divElem,ev) {
  // use if browser does not support document.activeElement
  var elem = browser.getEventToElement(ev);
  if (elem && elem != divElem) {
    var p = elem;
    while (p = p['offsetParent'])  {
      if (p==divElem) { divElem.focus(); return; }
    }
    this.hide();
  }
}

autoHideWindow_class.prototype.addBehavior = function(divElem) {
  divElem.windowObj = this;
  divElem.onmouseout = function(ev) { this.windowObj.onmouseout(this,ev); }
}
*/