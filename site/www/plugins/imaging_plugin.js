function imagingPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'ImageBoost';
  this.slice = undefined;
  this.layers = {};
  this.panelId = undefined;
  this.activeLayer = undefined;
  this.appliedFilters = {};
  this.superZoom = {};
  if (CONFIG.overlays) {
    this.layers = CONFIG.overlays;
    for (lr in this.layers) {
      this.appliedFilters[lr] = {};
      this.superZoom[lr] = {};
    }
    this.activeLayer = Object.keys(this.layers)[0];
  }
  // compute pixPerMm for "no zoom"
  this.mmPerSvg = (sbaViewer.sliceXLim[1]-sbaViewer.sliceXLim[0])/sbaViewer.sliceCoordFrame[2]
  this.hemisphereWidth_mm = this.mmPerSvg*sbaViewer.boundingBox[2]*(sbaViewer.bothHemispheres ? 0.5 : 1.0);
  this.sliceXLim = sbaViewer.sliceXLim;
  this.sliceYLim = sbaViewer.sliceYLim;
  this.centerPoint_mm = [
    0.5*(this.sliceXLim[0]+this.sliceXLim[1]),
    0.5*(this.sliceYLim[0]+this.sliceYLim[1])
  ]
  this.minZoom = -4;
  this.maxZoom = 12;
  this.zoomLevel = 0;
  this.canvas = undefined;
}
imagingPlugin_class.prototype = new sbaPlugin_class();

imagingPlugin_class.prototype.requirementsReady = function(onready) {
  return browser.require_once('../js/fabric.min.js',onready);
}

imagingPlugin_class.prototype.cmapFilter = function() {
  return fabric.util.createClass(fabric.Image.filters.BaseFilter, {
    initialize: function(cmap) {
      if (cmap=='parula')
        this.map = [[52,42,135],[53,43,138],[53,45,141],[53,46,144],[53,48,147],[54,49,150],[54,51,154],[54,52,157],[54,54,160],[53,55,163],[53,57,166],[53,58,169],[53,60,173],[52,62,176],[51,63,179],[51,65,182],[50,67,185],[48,68,189],[47,70,192],[45,72,195],[43,74,198],[41,75,202],[39,77,205],[36,79,208],[32,82,212],[28,84,215],[24,86,217],[20,89,220],[16,91,222],[11,93,223],[7,95,224],[4,96,225],[2,98,226],[1,100,226],[1,101,226],[0,102,226],[0,103,226],[1,105,226],[1,106,226],[2,107,225],[3,108,225],[4,109,225],[5,110,224],[6,111,224],[7,112,223],[8,113,223],[9,114,222],[10,115,222],[11,116,221],[12,117,221],[13,118,220],[14,119,220],[15,120,219],[15,121,219],[16,122,218],[17,123,218],[17,124,217],[18,125,216],[18,126,216],[19,127,215],[19,128,215],[19,129,214],[19,130,214],[19,131,213],[19,132,213],[19,133,213],[19,134,212],[19,135,212],[19,136,212],[18,137,211],[18,139,211],[17,140,211],[16,141,211],[15,142,211],[14,144,211],[13,145,211],[12,146,211],[11,147,210],[10,149,210],[9,150,210],[9,151,210],[8,152,210],[7,154,209],[7,155,209],[6,156,209],[6,157,208],[6,158,208],[5,159,207],[5,160,206],[5,161,206],[5,161,205],[5,162,204],[5,163,203],[5,164,202],[5,165,202],[5,165,201],[5,166,200],[5,167,199],[5,168,198],[5,168,197],[5,169,196],[6,170,195],[6,170,194],[7,171,193],[8,171,191],[9,172,190],[10,173,189],[11,173,188],[12,174,187],[14,175,186],[15,175,185],[17,176,183],[18,176,182],[20,177,181],[22,177,180],[24,178,178],[25,179,177],[27,179,176],[29,180,174],[31,180,173],[33,181,172],[35,181,170],[38,182,169],[40,182,168],[42,183,166],[44,183,165],[47,184,163],[49,184,162],[51,185,160],[54,185,159],[56,186,157],[59,186,156],[61,186,154],[64,187,153],[67,187,151],[69,188,150],[72,188,148],[75,188,147],[78,189,145],[81,189,144],[84,189,142],[87,190,141],[89,190,139],[92,190,138],[95,190,136],[98,191,135],[101,191,133],[104,191,132],[107,191,131],[110,191,129],[113,191,128],[116,191,127],[119,191,126],[122,191,124],[125,192,123],[128,192,122],[130,192,121],[133,192,120],[136,192,119],[138,191,118],[141,191,116],[143,191,115],[146,191,114],[148,191,113],[151,191,112],[153,191,111],[156,191,110],[158,191,109],[161,191,109],[163,191,108],[165,191,107],[168,190,106],[170,190,105],[172,190,104],[175,190,103],[177,190,102],[179,190,101],[181,190,100],[183,189,99],[186,189,99],[188,189,98],[190,189,97],[192,189,96],[194,189,95],[196,188,94],[198,188,93],[201,188,93],[203,188,92],[205,188,91],[207,188,90],[209,187,89],[211,187,88],[213,187,87],[215,187,86],[217,187,86],[219,186,85],[221,186,84],[223,186,83],[225,186,82],[227,186,81],[229,186,80],[231,186,79],[233,186,78],[235,185,77],[237,185,76],[239,185,75],[241,186,74],[243,186,72],[245,186,71],[247,186,70],[248,187,68],[250,187,67],[252,188,65],[253,189,63],[254,190,62],[255,191,60],[255,192,58],[256,194,57],[256,195,55],[256,196,54],[256,198,53],[255,199,51],[255,200,50],[255,202,49],[254,203,48],[254,204,47],[253,205,46],[253,207,45],[252,208,44],[252,209,43],[251,211,42],[250,212,41],[250,213,40],[249,215,39],[249,216,38],[248,217,37],[248,219,36],[247,220,35],[247,222,34],[246,223,32],[246,224,31],[246,226,30],[246,228,29],[245,229,28],[245,231,27],[245,233,26],[245,234,24],[246,236,23],[246,238,22],[246,240,21],[247,242,20],[247,244,18],[248,246,17],[249,248,16],[249,250,14],[250,252,13]];
      else
        this.map = [[0,0,132],[0,0,136],[0,0,140],[0,0,144],[0,0,148],[0,0,152],[0,0,156],[0,0,160],[0,0,164],[0,0,168],[0,0,172],[0,0,176],[0,0,180],[0,0,184],[0,0,188],[0,0,192],[0,0,196],[0,0,200],[0,0,204],[0,0,208],[0,0,212],[0,0,216],[0,0,220],[0,0,224],[0,0,228],[0,0,232],[0,0,236],[0,0,240],[0,0,244],[0,0,248],[0,0,252],[0,0,255],[0,4,255],[0,8,255],[0,12,255],[0,16,255],[0,20,255],[0,24,255],[0,28,255],[0,32,255],[0,36,255],[0,40,255],[0,44,255],[0,48,255],[0,52,255],[0,56,255],[0,60,255],[0,64,255],[0,68,255],[0,72,255],[0,76,255],[0,80,255],[0,84,255],[0,88,255],[0,92,255],[0,96,255],[0,100,255],[0,104,255],[0,108,255],[0,112,255],[0,116,255],[0,120,255],[0,124,255],[0,128,255],[0,132,255],[0,136,255],[0,140,255],[0,144,255],[0,148,255],[0,152,255],[0,156,255],[0,160,255],[0,164,255],[0,168,255],[0,172,255],[0,176,255],[0,180,255],[0,184,255],[0,188,255],[0,192,255],[0,196,255],[0,200,255],[0,204,255],[0,208,255],[0,212,255],[0,216,255],[0,220,255],[0,224,255],[0,228,255],[0,232,255],[0,236,255],[0,240,255],[0,244,255],[0,248,255],[0,252,255],[0,255,255],[4,255,252],[8,255,248],[12,255,244],[16,255,240],[20,255,236],[24,255,232],[28,255,228],[32,255,224],[36,255,220],[40,255,216],[44,255,212],[48,255,208],[52,255,204],[56,255,200],[60,255,196],[64,255,192],[68,255,188],[72,255,184],[76,255,180],[80,255,176],[84,255,172],[88,255,168],[92,255,164],[96,255,160],[100,255,156],[104,255,152],[108,255,148],[112,255,144],[116,255,140],[120,255,136],[124,255,132],[128,255,128],[132,255,124],[136,255,120],[140,255,116],[144,255,112],[148,255,108],[152,255,104],[156,255,100],[160,255,96],[164,255,92],[168,255,88],[172,255,84],[176,255,80],[180,255,76],[184,255,72],[188,255,68],[192,255,64],[196,255,60],[200,255,56],[204,255,52],[208,255,48],[212,255,44],[216,255,40],[220,255,36],[224,255,32],[228,255,28],[232,255,24],[236,255,20],[240,255,16],[244,255,12],[248,255,8],[252,255,4],[255,255,0],[255,252,0],[255,248,0],[255,244,0],[255,240,0],[255,236,0],[255,232,0],[255,228,0],[255,224,0],[255,220,0],[255,216,0],[255,212,0],[255,208,0],[255,204,0],[255,200,0],[255,196,0],[255,192,0],[255,188,0],[255,184,0],[255,180,0],[255,176,0],[255,172,0],[255,168,0],[255,164,0],[255,160,0],[255,156,0],[255,152,0],[255,148,0],[255,144,0],[255,140,0],[255,136,0],[255,132,0],[255,128,0],[255,124,0],[255,120,0],[255,116,0],[255,112,0],[255,108,0],[255,104,0],[255,100,0],[255,96,0],[255,92,0],[255,88,0],[255,84,0],[255,80,0],[255,76,0],[255,72,0],[255,68,0],[255,64,0],[255,60,0],[255,56,0],[255,52,0],[255,48,0],[255,44,0],[255,40,0],[255,36,0],[255,32,0],[255,28,0],[255,24,0],[255,20,0],[255,16,0],[255,12,0],[255,8,0],[255,4,0],[255,0,0],[252,0,0],[248,0,0],[244,0,0],[240,0,0],[236,0,0],[232,0,0],[228,0,0],[224,0,0],[220,0,0],[216,0,0],[212,0,0],[208,0,0],[204,0,0],[200,0,0],[196,0,0],[192,0,0],[188,0,0],[184,0,0],[180,0,0],[176,0,0],[172,0,0],[168,0,0],[164,0,0],[160,0,0],[156,0,0],[152,0,0],[148,0,0],[144,0,0],[140,0,0],[136,0,0],[132,0,0],[128,0,0]];
      this.map[0] = [0,0,0];
      this.map[255] = [255,255,255];
    },
    type: 'cmap',
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = data.length, i, r, g, b;
      
      var r,g,b,clr,rgb;
      for (i = 0; i < iLen; i+=4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        clr = parseInt((r+g+b) / 3);
        rgb = this.map[clr];
        data[i]     = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
      }

      context.putImageData(imageData, 0, 0);
    }
  });
}

imagingPlugin_class.prototype.rangeFilter = function() {
  var me = this;
  return fabric.util.createClass(fabric.Image.filters.BaseFilter, {
    initialize: function(range_json) {
      this.range = eval(range_json);
    },
    type: 'range',
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = data.length, i, r, g, b,
        offset = 0,
        scale = 1.0;
      if (this.range) {
        offset = this.range[0],
        scale = 255.0/(this.range[1]-this.range[0]);
      }
      
      for (i = 0; i < iLen; i+=4) {
        r = (data[i]-offset)*scale;
        g = (data[i + 1]-offset)*scale;
        b = (data[i + 2]-offset)*scale;
        data[i]     = r>0 ? (r<255 ? r : 255) : 0;
        data[i + 1] = g>0 ? (g<255 ? g : 255) : 0;
        data[i + 2] = b>0 ? (b<255 ? b : 255) : 0;
      }

      context.putImageData(imageData, 0, 0);
    }
  });
}

imagingPlugin_class.prototype.newFabric = function(canvasElem) {
  var me = this;
  var myFabric_class = fabric.util.createClass(fabric.StaticCanvas, {
    initialize: function(el, options) {
      options || (options = { });
      this._initStatic(el, options);
      this.upperCanvasEl = this.lowerCanvasEl;
      this.stateful = false;
      this.renderOnAddRemove = false;
      this._initEventListeners();
    },
    _initEventListeners: function() {
      this._bindEvents();
      fabric.util.addListener(this.upperCanvasEl, 'mousedown', this._onMouseDown);
    },
    _bindEvents: function() {
      this._onMouseDown = this._onMouseDown.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onMouseUp = this._onMouseUp.bind(this);
    },
    _onMouseDown: function (e) {
      this._previousPointer = fabric.util.getPointer(e);
      fabric.util.addListener(fabric.document, 'touchend', this._onMouseUp);
      fabric.util.addListener(fabric.document, 'touchmove', this._onMouseMove);
      if (e.type === 'touchstart') {
        // Unbind mousedown to prevent double triggers from touch devices
        fabric.util.removeListener(this.upperCanvasEl, 'mousedown', this._onMouseDown);
      } else {
        fabric.util.addListener(fabric.document, 'mouseup', this._onMouseUp);
        fabric.util.addListener(fabric.document, 'mouseout', this._onMouseUp);
        fabric.util.addListener(fabric.document, 'mousemove', this._onMouseMove);
      }
    },
    _onMouseMove: function(e) {
      e.preventDefault && e.preventDefault();
      var pointer = fabric.util.getPointer(e);
      var dx = pointer.x - this._previousPointer.x;
      var dy = pointer.y - this._previousPointer.y;
      this._previousPointer = pointer;
      me.updateZoom([dx,dy]);
      me.updateMarker();
    },
    _onMouseUp: function() {
      fabric.util.removeListener(fabric.document, 'mouseup', this._onMouseUp);
      fabric.util.removeListener(fabric.document, 'touchend', this._onMouseUp);
      fabric.util.removeListener(fabric.document, 'mousemove', this._onMouseMove);
      fabric.util.removeListener(fabric.document, 'mouseout', this._onMouseUp);
      fabric.util.removeListener(fabric.document, 'touchmove', this._onMouseMove);
      me.updateZoom();
    }
    /*
    invertTransform: function(t) {
      var r = t.slice(),
          a = 1 / (t[0] * t[3] - t[1] * t[2]);
      r = [a * t[3], -a * t[1], -a * t[2], a * t[0], 0, 0];
      var o = fabric.util.transformPoint({ x: t[4], y: t[5] }, r);
      r[4] = -o.x;
      r[5] = -o.y;
      return r;
    }
    */   
  });
  return new myFabric_class(canvasElem);
}

imagingPlugin_class.prototype.setLayer = function(callerElem) {
  this.activeLayer = callerElem.options[callerElem.selectedIndex].value;
  this.loadImage(this.activeLayer,this.slice);
}

imagingPlugin_class.prototype.setRange = function(value,doApply,moveMin) {
  var minElem = document.getElementById('imageAdjust_range-min'),
    maxElem = document.getElementById('imageAdjust_range-max'),
    rangeElem = document.getElementById('imageAdjust_range');
  if (value) {
    rangeElem.value = value;
    value = eval(value);
    min = value[0], 
    max = value[1];
    if (moveMin) {
      if (min>245) min = 245;
      if (max < min+10) max = min+10;
    } else {
      if (max<10) max = 10;
      if (max < min+10) min = max-10;
    }
  } else {
    rangeElem.value = '';
    min = 0;
    max = 255;
  }
  var elem = minElem.nextSibling;
  if (elem) elem.innerHTML = '&lt;'+min+','+max+'&gt;';
  minElem.value = min;
  maxElem.value = max;
  if (doApply) rangeElem.onchange();
}

imagingPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  if (this.slice === undefined) divElem.innerHTML = 'Loading plugin...';  
  this.panelId = divElem.id;
  var onready = function() { this.activate(sbaViewer,document.getElementById(this.panelId)) }.bind(this);
  var ready = this.requirementsReady(onready);
  if (ready) try {
    this.filterClasses = {
      'range':this.rangeFilter(),
      'invert':fabric.Image.filters.Invert,
      'cmap':this.cmapFilter()
    };
    
    var state = sbaViewer.getState();
    if (state.origSlice == undefined) return;
    this.slice = state.origSlice;
    
    var topElem = document.createElement("div");
    var opts = [];
    for (var lr in this.layers) {
      var selected = (lr == this.activeLayer ? 'selected="selected" ' : '');
      opts.push('<option '+selected+'value="'+lr+'">'+lr+'</option>');
    }
    topElem.innerHTML = 'Image controls for slice <span id="imageAdjust_slice">'+this.slice+'</span>, modality <select onchange="sbaPluginManager.getPlugin(\'imaging\').setLayer(this)">'+opts.join('')+'</select><br/>Input range <input type="hidden" id="imageAdjust_range"/><input type="range" id="imageAdjust_range-min" min="0" max="255" value="0" style="width:10ex; vertical-align: middle"/><span></span><input type="range" id="imageAdjust_range-max" min="0" max="255" value="255" style="width:10ex; vertical-align: middle"/><br/>Colormap <select id="imageAdjust_cmap" style="vertical-align: middle"><option value="">[none]</option><option value="jet">JetBW (blue&gt;green&gt;red)</option><option value="parula">ParulaBW (blue&gt;orange&gt;yellow)</option></select>&#160;&#160;<input type="checkbox" id="imageAdjust_invert" style="vertical-align: middle"/>Invert<br/>Zoom: <input type="range" id="imageAdjust_zoom" min="'+this.minZoom+'" max="'+this.maxZoom+'" style="vertical-align: middle"/>';
    divElem.innerHTML = ''; 
    divElem.appendChild(topElem);
    divElem.style.overflow = 'visible';
    var w = divElem.offsetWidth-4;
    var h = divElem.offsetHeight-topElem.offsetHeight-2;
    divElem.innerHTML += '<canvas id="sliceCanvas" width="'+w+'" height="'+h+'" style="border: 0px"></canvas>';
    this.canvas = this.newFabric('sliceCanvas');
    if (this.activeLayer) {
      var me = this;
      for (var f in this.filterClasses) {
        var fElem = document.getElementById('imageAdjust_'+f);
        fElem.onchange = function() {
          var f = this.id.split('_')[1];
          var field = this.type == "checkbox" ? 'checked' : 'value';
          var value = this[field] ? this[field] : undefined;
          me.appliedFilters[me.activeLayer][f] = value;
          var obj = me.canvas.getObjects();
          for (var k in obj) {
            me.setFilter(obj[k],f,value);
            obj[k].applyFilters(me.canvas.renderAll.bind(me.canvas));
          }
        }
      }
      var onRangeChange = function() {
        var minElem = document.getElementById('imageAdjust_range-min'),
          maxElem = document.getElementById('imageAdjust_range-max'),
          min = parseInt(minElem.value), 
          max = parseInt(maxElem.value);
        me.setRange(JSON.stringify([min,max]),true,this === minElem);
      };
      document.getElementById('imageAdjust_range-min').onchange = onRangeChange;
      document.getElementById('imageAdjust_range-max').onchange = onRangeChange;
      var zoomElem = document.getElementById('imageAdjust_zoom');
      zoomElem.value = this.zoomLevel;
      zoomElem.onchange = function() {
        me.setZoom(this.value);
      };
      this.loadImage(this.activeLayer,state.origSlice);
    }
  } catch(e) {
    globalErrorConsole.addError(e);
  }
}

imagingPlugin_class.prototype.sliceUrl = function(source,slice) {
  var parts = source.match(/(.*[^%])(%\d+d)(.*)/);
  if (!parts) {
    globalErrorConsole.addError('Cannot parse image source "'+browser.htmlspecialchars(layer.source)+'"');
    return;
  }
  parts.shift();
  if (parts[1].charAt(1) == '0') {
    var zeropad = parts[1].charAt(2);
    slice = '00000'.substr(0,zeropad-String(slice).length)+slice;
  }
  parts[1] = slice;
  return sbaViewer.templatePath+'/'+parts.join('');
}

imagingPlugin_class.prototype.setFilter = function(img,f,value) {
  var filterIndex = Object.keys(this.filterClasses).indexOf(f);
  if (value === undefined) {
    delete img.filters[filterIndex];
  } else {
    var filter = new this.filterClasses[f](value);
    img.filters[filterIndex] = filter;
  }
}

imagingPlugin_class.prototype.loadImage = function(lr,origSlice) {
  var layer = this.layers[lr];
  for (var f in this.filterClasses) {
    var fElem = document.getElementById('imageAdjust_'+f);
    var value = this.appliedFilters[lr][f];
    if (f == 'range') {
      this.setRange(value);
    } else if (fElem.type == 'checkbox') {
      fElem.checked = !!value;
    } else if (fElem.tagName == 'select') {
      fElem.value = value === undefined ? '' : value;
    }
  }
  var os = layer.orig2overlay ? sbaViewer.nearestOverlay(origSlice,layer.orig2overlay) : origSlice;
  this.overlaySlice = os;
  if (os === undefined) return;
  var superZoom = this.superZoom[lr] = this.superZoomInit(lr,os);
  var url = this.sliceUrl(layer.source,os);
  if (!url) return;
  if (superZoom.tileSystem == "dzi") {
    url = [
      url+'_files',
      superZoom.singleTileLevel,
      '0_0.jpg'
    ].join('/');
  }
  var me = this;
  fabric.Image.fromURL(url, function(img) {
    var obj = me.canvas.getObjects();
    for (var k in obj) me.canvas.remove(obj[k]);
    img.set({ left: 0, top: 0, angle: 0 }).scale(1.0);
    for (var f in me.appliedFilters[lr]) {
      var value = me.appliedFilters[lr][f];
      me.setFilter(img,f,value);
    }
    me.canvas.add(img);
    img.applyFilters(me.canvas.renderAll.bind(me.canvas));
    me.updateZoom();
    me.updateMarker();
  });
}

imagingPlugin_class.prototype.clearTiles = function() {
  var tiles = this.canvas.getObjects();
  for (i=1; i<tiles.length; i++) {
    this.canvas.remove(tiles[i]);
  }
  this.superZoom[this.activeLayer].tileCache = [];
}

imagingPlugin_class.prototype.loadTiles = function(lr,slice,level,colrows,scale) {
  // debug: load checkerboard of tiles
  // if( (function (a,b) { return ( a || b ) && !( a && b ); })( c%2, r%2 ) ) return;
  var superZoom = this.superZoom[lr];
  var layer = this.layers[lr];
  for (var i in colrows) {
    var c = colrows[i][0];
    var r = colrows[i][1];
    var tileKey = [level,c,r].join('_');
    if (superZoom.tileCache[tileKey] != undefined) continue;
    var url = this.sliceUrl(layer.source,slice);
    if (!url) return;
    if (superZoom.tileSystem == "dzi") {
      url = [
        url+'_files',
        level,
        c+'_'+r+'.jpg'
      ].join('/');
    }
    var left_px = scale*c*superZoom.tileSize;
    var top_px = scale*r*superZoom.tileSize;
    var me = this;
    (function(url,left_px,top_px,scale) {
      fabric.Image.fromURL(url, function(img) {
        img.set({ left: left_px, top: top_px, angle: 0}).scale(scale);      
        for (var f in me.appliedFilters[lr]) {
          var value = me.appliedFilters[lr][f];
          me.setFilter(img,f,value);
        }
        me.canvas.add(img);
        //img.applyFilters(me.canvas.renderAll.bind(me.canvas));
        img.applyFilters(function() {
          var ctx = me.canvas.getContext('2d')
          me.canvas._draw(ctx,this);
        }.bind(img));
      });
    })(url,left_px,top_px,scale);
    superZoom.tileCache[tileKey] = true;
  }
}

imagingPlugin_class.prototype.imageBox_mm = function(lr) {
  var layer = this.layers[lr];
  var L = this.sliceXLim[0];
  var B = this.sliceYLim[0];
  var W = this.sliceXLim[1]-this.sliceXLim[0];
  var H = this.sliceYLim[1]-this.sliceYLim[0];
  if (layer.anchorBox) {
    if (layer.anchorUnit == "mm") {
      L = layer.anchorBox[0];
      B = layer.anchorBox[1];
      W = layer.anchorBox[2];
      H = layer.anchorBox[3];
    } else {
      L = this.mmPerSvg*layer.anchorBox[0];
      B = this.mmPerSvg*layer.anchorBox[1];
      W = this.mmPerSvg*layer.anchorBox[2];
      H = this.mmPerSvg*layer.anchorBox[3];
    }
  }
  return [L,B,W,H];
}

imagingPlugin_class.prototype.superZoomInit = function(lr,slice) {
  var layer = this.layers[lr];
  var tileSystem = (layer.format || 'none');
  var superZoom = {
    tileSystem: tileSystem,
    tileSize: 255,
    overlap: 1,
    imgWidth: [],
		imgHeight: [],
		numCols: [],
		numRows: [],
    tileCache: []
  };  
  if (superZoom.tileSystem == "none") return superZoom;
  var shape = layer.shapelist[slice];
  var width = shape[0], height = shape[1];
  if (superZoom.tileSystem === "dzi") {
    superZoom.maxLevel = Math.ceil(Math.log(Math.max(width,height))/Math.LN2);
  }	else if (superZoom.tileSystem === "zoomify" ) {
    superZoom.maxLevel = Math.ceil(Math.og(Math.max(shape[0],shape[1]))/Math.LN2) - Math.log(superZoom.tileSize)/Math.LN2;
  }
	superZoom.tiles = [];
  var scaledWidth = width;
  var scaledHeight = height;
	var singleTileLevel = -1;
  for (var z=superZoom.maxLevel; z>=0; z--) {
    var nc = Math.ceil(scaledWidth/superZoom.tileSize);
		var nr = Math.ceil(scaledHeight/superZoom.tileSize);
  	singleTileLevel == -1 && scaledWidth<=superZoom.tileSize && scaledHeight<=superZoom.tileSize && (singleTileLevel=z);

		// Tile storage
    superZoom.imgWidth[z] = scaledWidth;
		superZoom.imgHeight[z] = scaledHeight;
		superZoom.numCols[z] = nc;
		superZoom.numRows[z] = nr;

    scaledWidth /= 2;
		scaledHeight /= 2;
  }
  superZoom.singleTileLevel = singleTileLevel;
  return superZoom;
}

imagingPlugin_class.prototype.setZoom = function (level,point) {
  if (level<this.minZoom) level = this.minZoom;
  if (level>this.maxZoom) level = this.maxZoom;
  this.zoomLevel = level;
  this.updateZoom();
  this.updateMarker();
}

imagingPlugin_class.prototype.updateZoom = function(dxy) {
  var cv = this.canvas;
  var canvasWidth_px = cv.getWidth();
  var canvasWidth_mm = this.hemisphereWidth_mm*Math.pow(0.5,0.5*(this.zoomLevel));
  var canvas_mmPerPx = canvasWidth_mm/canvasWidth_px
  var canvasHeight_px = cv.getHeight();
  var canvasHeight_mm = canvasHeight_px*canvas_mmPerPx;
  if (dxy) {
    // apply panning
    this.centerPoint_mm[0] -= dxy[0]*canvas_mmPerPx;
    this.centerPoint_mm[1] += dxy[1]*canvas_mmPerPx;
  }
  var imageWidth_px = cv.item(0).width;
  var imageBox_mm = this.imageBox_mm(this.activeLayer);
  var image_mmPerPx = imageBox_mm[2]/imageWidth_px;
  var zoomFactor = image_mmPerPx/canvas_mmPerPx;

  var centerPoint_px = [
    (this.centerPoint_mm[0]-imageBox_mm[0])/image_mmPerPx,
    (imageBox_mm[1]+imageBox_mm[3]-this.centerPoint_mm[1])/image_mmPerPx,
  ];
  var point = {"x":0.5*cv.getWidth(),"y":0.5*cv.getHeight()};
  // xy has image pixel coordinates
  cv.viewportTransform = [
    zoomFactor,0,
    0,zoomFactor,
    0.5*canvasWidth_px - zoomFactor*centerPoint_px[0], 0.5*canvasHeight_px - zoomFactor*centerPoint_px[1]
  ];
  cv.renderAll();

  var superZoom = this.superZoom[this.activeLayer];
  if (dxy || superZoom.tileSystem == "none") return;
  
  var tile_mmPerPx;
  for (var level=superZoom.singleTileLevel; level<superZoom.maxLevel; level++) {
    tile_mmPerPx = imageBox_mm[2]/superZoom.imgWidth[level];
    if (tile_mmPerPx/canvas_mmPerPx < 1.1) break;
  }
  
  // canvas limits
  var canvasXLim_mm = [this.centerPoint_mm[0]-0.5*canvasWidth_mm,this.centerPoint_mm[0]+0.5*canvasWidth_mm];
  var canvasYLim_mm = [this.centerPoint_mm[1]-0.5*canvasHeight_mm,this.centerPoint_mm[1]+0.5*canvasHeight_mm];

  // tile limits 
  var tileScale = (tile_mmPerPx/canvas_mmPerPx)/zoomFactor;
  var tileLeft_mm = imageBox_mm[0];
  var tileTop_mm = imageBox_mm[1]+imageBox_mm[3];
  var tileWidth_mm = superZoom.tileSize*tile_mmPerPx;
  var tileHeight_mm = superZoom.tileSize*tile_mmPerPx;

  var nc = superZoom.numCols[level];
  var nr = superZoom.numRows[level];
  this.clearTiles();
  var colrows = [];
  for (var c=0; c<nc; c++ ) {
	  var x_mm = tileLeft_mm+c*tileWidth_mm;
    if (x_mm+tileWidth_mm>canvasXLim_mm[0] && x_mm<canvasXLim_mm[1]) {
      for (var r=0; r<nr; r++) {
        var y_mm = tileTop_mm-(r+1)*tileHeight_mm;
        if (y_mm+tileHeight_mm>canvasYLim_mm[0] && y_mm<canvasYLim_mm[1]) {
          colrows.push([c,r]);
        }
      }
    }
	}
  this.loadTiles(this.activeLayer,this.overlaySlice,level,colrows,tileScale);
  // debug: show cached tiles
  // globalErrorConsole.addError(JSON.stringify(superZoom.tileCache));
}

imagingPlugin_class.prototype.updateMarker = function () {
  var lr = this.activeLayer;
  var anchorBox,rasLimits;
  var xLim,yLim,xyUnit;
  if (anchorBox = this.layers[lr].anchorBox) {
    xLim = [anchorBox[0],anchorBox[0]+anchorBox[2]];
    yLim = [anchorBox[1],anchorBox[0]+anchorBox[3]];
    xyUnit = this.layers[lr].anchorUnit;
  } else {
    if (rasLimits = sbaViewer.rasLimits) {
      xLim = rasLimits[0];
      yLim = rasLimits[2];
      xyUnit = 'mm';
    }
  }
  if (xyUnit) {
    var cv = this.canvas;
    invTransf = fabric.util.invertTransform(cv.viewportTransform);
    points = [
      {"x":0*cv.getWidth(),"y":0*cv.getHeight(),"shape":["corner",[1,1]]},
      {"x":1*cv.getWidth(),"y":0*cv.getHeight(),"shape":["corner",[-1,1]]},
      {"x":1*cv.getWidth(),"y":1*cv.getHeight(),"shape":["corner",[-1,-1]]},
      {"x":0*cv.getWidth(),"y":1*cv.getHeight(),"shape":["corner",[1,-1]]}
    ];
    var w = cv.item(0).width;
    var h = cv.item(0).height;
    var markers = [];
    for (var i in points) {
      var point = points[i];
      var xy = fabric.util.transformPoint(point, invTransf);
      var xyMm = [
        xLim[0]+(xy.x/w)*(xLim[1]-xLim[0]),
        yLim[1]-(xy.y/h)*(yLim[1]-yLim[0])
      ];
      var xySvg = xyUnit == 'svg' ? xyMm : sbaViewer.mm2svg(xyMm);
      var marker = new sbaMarker_class('',this.slice,xySvg);
      marker.setShape2d(point.shape[0],point.shape[1]);
      markers.push(marker);
    }
    sbaViewer.addMarkers(markers,1);
  }
}

imagingPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  var state = sbaViewer.getState();
  if (state.origSlice != this.slice) {
    this.slice = state.origSlice;
    if (this.requirementsReady()) this.loadImage(this.activeLayer,this.slice);
  }
}
