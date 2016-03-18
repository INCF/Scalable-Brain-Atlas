var tooltip = {
  xy: function(ev) {
    if (window.event) ev = window.event;
    if (ev.pageX)   {
      xy = [ev.pageX,ev.pageY];
    } else if (ev.clientX || ev.clientY)  {
      var anchorElem = browser.documentBody();
      var scrollTop = (document.documentElement ? document.documentElement.scrollTop : anchorElem.scrollTop);
      xy = [ev.clientX + anchorElem.scrollLeft,ev.clientY + scrollTop];
    }
    return xy;
  },
  show: function(ev,tip,name) {
    var id = 'TOOLTIP'+(name ? '_'+name : '');
    divElem = document.getElementById(id);
    if (divElem == undefined) {
      divElem = document.createElement("div");
      divElem.style.visibility = 'hidden';
      browser.documentBody().appendChild(divElem);
      divElem.id = id;
      divElem.style.position = 'absolute';
      divElem.style.background = '#ffd';
      divElem.style.border = '1px solid #ccc';
      divElem.style.zIndex = '20';
    }
    divElem.style.width = null;
    divElem.innerHTML = tip;
    tooltip.move(ev,name);
    divElem.style.width = ''+(divElem.offsetWidth>400 ? 400 : divElem.offsetWidth)+'px';
    divElem.style.visibility = 'visible';
  },
  move: function(ev,name) {
    var id = 'TOOLTIP'+(name ? '_'+name : '');
    divElem = document.getElementById(id);
    if (divElem != undefined) {
      var xy = tooltip.xy(ev);
      divElem.style.left = ''+(xy[0]+20)+'px';
      divElem.style.top = ''+xy[1]+'px';
    }
  },
  hide: function(name) {
    var id = 'TOOLTIP'+(name ? '_'+name : '');
    divElem = document.getElementById(id);
    if (divElem != undefined) {
      divElem.style.visibility = 'hidden';
//      browser.documentBody().removeChild(divElem);
    }
  },
  elemXY: function(ev,elemId) {
    var xy = tooltip.xy(ev);
    var elem = document.getElementById(elemId);
    var depth = 0;
    var anchorElem = browser.documentBody();
    while (elem && elem != anchorElem && depth<20) {
      xy[0] -= elem.offsetLeft-elem.scrollLeft;
      xy[1] -= elem.offsetTop-elem.scrollTop;
      elem = elem.offsetParent;      
      depth++;
    }
    return xy;
  }
}
