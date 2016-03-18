// dependency: browser.js
browser.include_style_once('../shared-css/dragdiv.css');

var dragdiv = {
  getId: function(name) { 
    return name ? 'DRAGDIV_'+name : 'DRAGDIV_global' 
  },
  show: function(html,title,name) {
    if (title == undefined) title = '';
    var id = dragdiv.getId(name);
    divElem = document.getElementById(id);
    if (divElem == undefined) {
      divElem = document.createElement("div");
      divElem.id = id;
      divElem.style.visibility = 'hidden';
      divElem.style.position = 'fixed';
      divElem.style.border = '1px solid #000';
      divElem.style.color = '#000';
      divElem.style.background = '#ccc';
      divElem.style.padding = '6px';
      divElem.style.zIndex = '20';
      divElem.style.top = '6px';
      divElem.style.left = '6px';
      browser.documentBody().appendChild(divElem);
    }
    divElem.style.width = null;
    divElem.innerHTML = '<div style="width: 100%; position: relative; padding: 2px; cursor: move" onmousedown="dragdiv.startDrag(event,\''+id+'\')"><div class="clicktoclose" onclick="dragdiv.hide(\''+id+'\')">X</div><div style="left: 0%; width: 90%; position: relative"><b>'+title+'</b></div></div><div style="padding: 5px; border-radius:10px; -moz-border-radius: 10px; background: #fff">'+html+'</div>';
    divElem.style.visibility = 'visible';
    return divElem;
  },
  startDrag: function(evt,id) {  
    divElem = document.getElementById(id);
    if (!evt) evt = windows.event;
    evt.preventDefault();
    browser.documentBody().onmousemove = function(evt1) { dragdiv.doDrag(evt1,evt.clientX,evt.clientY,id); } 
    browser.documentBody().onmouseup = function(evt1) { dragdiv.stopDrag(); }
  },
  stopDrag: function() {
    browser.documentBody().onmousemove = null;
    browser.documentBody().onmouseup = null;
  },
  doDrag: function(evt,x0,y0,id) {
    elem = document.getElementById(id);
    if (!evt) evt = windows.event;
    evt.preventDefault();
    var dx = evt.clientX-x0;
    var dy = evt.clientY-y0;
    elem.style.left = parseInt(elem.style.left)+dx+'px';
    elem.style.top = parseInt(elem.style.top)+dy+'px';
    dragdiv.startDrag(evt,id);
  },
  hide: function(id) {
    divElem = document.getElementById(id);
    if (divElem != undefined) {
      divElem.style.visibility = 'hidden';
      divElem.innerHTML = '';
    }
  }
}
