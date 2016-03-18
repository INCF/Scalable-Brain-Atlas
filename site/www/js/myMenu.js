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

divWindow_class.prototype.hide = function() {
  var divElem = document.getElementById('divWindow_'+this.name);
  if (divElem && divElem.parentNode) divElem.parentNode.removeChild(divElem);
}


/*
 * autohideWindow
 */
 
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

/*
 * contextWindow
 */
 
function contextWindow_class(name) {
  autoHideWindow_class.apply(this,[name]);
}
contextWindow_class.prototype = new autoHideWindow_class();

contextWindow_class.prototype.render = function(ev,htmlContent) {
  // create window element
  this.hide();
  var divElem = document.createElement("div");
  divElem.id = 'divWindow_'+this.name;

  divElem.style.position = 'absolute';
  divElem.style.display = 'none';
  divElem.style.zIndex = "21";
  divElem.innerHTML = htmlContent;
  this.addStyle(divElem);
  this.addBehavior(divElem);
  browser.documentBody().appendChild(divElem);

  this.addStyle(divElem);
  this.addBehavior(divElem);
  divElem.innerHTML = htmlContent;
  var xy = tooltip.xy(ev);
  divElem.style.display = 'block';  

  var oWidth = (divElem.offsetWidth>400 ? 400 : divElem.offsetWidth);
  var oLeft = xy[0]+20;
  var leftMax = browser.documentWidth()-20-oWidth;
  if (oLeft > leftMax) { oLeft = leftMax; }
  divElem.style.left = oLeft+'px';
  divElem.style.top = xy[1]+'px';
  divElem.style.width = oWidth+'px';
}

/*
 * popupWindow
 */
 
function popupWindow_class(name,anchorElemId) {
  divWindow_class.apply(this,[name,anchorElemId]);
}
popupWindow_class.prototype = new divWindow_class();

popupWindow_class.prototype.addStyle = function(divElem) {
  divElem.className = 'popup';
  divElem.innerHTML += '<center><input type="button" value="close"></center>';
}

popupWindow_class.prototype.addBehavior = function(divElem) {
  divElem.windowObj = this;
  divElem.onclick = function(ev) { this.windowObj.hide(); }
}

/*
 * panelWindow
 */
function panelWindow_class(name,anchorElemId) {
  divWindow_class.apply(this,[name,anchorElemId]);
}
panelWindow_class.prototype = new divWindow_class();

panelWindow_class.prototype.addStyle = function(divElem) {
  divElem.className = 'panel';
  divElem.innerHTML += '<center><input type="button" value="close"></center>';
}

 