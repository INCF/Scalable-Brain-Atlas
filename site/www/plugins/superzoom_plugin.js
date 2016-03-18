function superzoomPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'SuperZoom';
  this.slice = undefined;
  this.layers = [];
  if (CONFIG.superzoom) {
    this.layers = CONFIG.superzoom;
  }
}
superzoomPlugin_class.prototype = new sbaPlugin_class();

function isCanvasSupported(){
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d'));
}

superzoomPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  if (this.slice === undefined) divElem.innerHTML = 'Loading plugin...';
  var me = this;
  var onload = function() { me.activate(sbaViewer,divElem) };
  var ready = true;
  if (!isCanvasSupported()) {
    ready &= browser.require_once('../js/excanvas.js',onload);
  }
  if (ready) {
    ready &= browser.require_once('../js/imageloader_sba.js',onload);
    ready &= browser.require_once('../js/canvaszoom_sba.js',onload);
  }
  if (ready) try {
    var state = sbaViewer.getState();
    if (state.origSlice == undefined) return;
    this.slice = state.origSlice;
    for (var k in this.layers) {
      lr = this.layers[k];
      var sliceId = lr.orig2overlay[state.origSlice];
      if (sliceId == undefined) sliceId = lr.orig2overlay[state.origSlice-1];
      if (sliceId == undefined) sliceId = lr.orig2overlay[state.origSlice+1];
      if (sliceId != undefined) {
        var slicePos = lr.poslist[sliceId];
        var sliceShape = lr.shapelist[sliceId];
        var src = lr.source;
        var parts = src.match(/(.*[^%])(%\d+d)(.*)/);
        parts.shift();
        if (parts[1].charAt(1) == '0') {
          var zeropad = parts[1].charAt(2);
          var sliceId = '00000'.substr(0,zeropad-String(sliceId).length)+sliceId;
        }
        parts[1] = sliceId;
        src = sbaViewer.templatePath+'/'+parts.join('');
      }
      break;
    }
    var topElem = document.createElement("div");
    topElem.innerHTML = '<b>Position: '+slicePos+'mm.</b><br/>'+src;
    divElem.appendChild(topElem);
    divElem.style.overflow = 'visible';
    var w = divElem.offsetWidth-4;
    var h = divElem.offsetHeight-topElem.offsetHeight-2;
    divElem.innerHTML = '<b>Position: '+slicePos+'mm.</b><br/>(Experimental plugin, new features under development)<canvas id="sliceCanvas" width="'+w+'" height="'+h+'" style="border: 0px"></canvas>';
    var settings = {
      "canvas": document.getElementById('sliceCanvas'),
      "tileOverlap": 1, 
			"tileSize": 255,
			"fileType": "jpg",
			"tilesSystem": "deepzoom", // or "zoomify"
			"minZoom": 8,
      "tilesFolder": src+"_files",
      "imageWidth": sliceShape[0],
      "imageHeight": sliceShape[1]
    }
    var obj = new CanvasZoom(settings);
  } catch(e) {
    globalErrorConsole.addError(e);
  }
}

superzoomPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  var state = sbaViewer.getState();
  if (state.origSlice != this.slice) this.activate(sbaViewer,divElem);
}
