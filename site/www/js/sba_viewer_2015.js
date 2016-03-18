// return index of first case-insensitive match of string s in array a
function firstmatch(s,a) {
  for (var k in a) if (a.hasOwnProperty(k) && a[k] == s) return k; 
  return undefined;
}

// return index of first case-insensitive match of string s in array a
function firstmatch_ci(s,a) {
  s = s.toLowerCase();
  for (var k in a) if (a.hasOwnProperty(k) && a[k].toLowerCase() == s) return k; 
  return undefined;
}

function escB(s) {
  return String(s).replace("'","\\'");
}


/* sbaMarker_class */

function sbaMarker_class(label,origSlice,xySvg) {
  this.label = label;
  this.origSlice = origSlice;
  this.xySvg = xySvg;
  this.rgb = '#0F0';
  this.shape2d = 'balloon'; // alternative: crosshair
  this.shape2d_params = {};
  this.tooltip = '';
}

sbaMarker_class.prototype.balloonPath = function(size) {
  var path = [
    'M',0,',',0,
    'l',0,',',-30,
    'm',0,',',0,
    'c',-10,',',-170,
    ' ',-100,',',-180,
    ' ',-100,',',-250,
    'c',0,',',-60,
    ' ',40,',',-100,
    ' ',100,',',-100,
    'c',60,',',0,
    ' ',100,',',40,
    ' ',100,',',100,
    'c',0,',',70,
    ' ',-90,',',80,
    ' ',-100,',',250,
    'z'
  ];
  var magnifyX = (size+1)/2;
  if (magnifyX>1) for (i=1; i<path.length; i+=4) path[i] *= magnifyX;
  return path.join('');
}

sbaMarker_class.prototype.squarePath = function() {
  var path = [
    'M',-100,',',-100,
    'L',-100,',',100,
    'L',100,',',100,
    'L',100,',',-100,
    'L',-100,',',-100,
    'z'
  ];
  return path.join('');
}

sbaMarker_class.prototype.crosshairPath = function() {
  var path = [
    'M',-20,',',0,
    'l',-105,',',0,
    'M',20,',',0,
    'l',105,',',0,
    'M',0,',',-20,
    'l',0,',',-105,
    'M',0,',',20,
    'l',0,',',105
  ];
  return path.join('');
}

sbaMarker_class.prototype.cornerPath = function(dx,dy) {
  var path = [
    'M',100*dx,',',0,
    'L',0,',',0,
    'L',0,',',100*dy
  ];
  return path.join('');
}

sbaMarker_class.prototype.setShape2d = function(shape,params) {
  this.shape2d = shape;
  this.shape2d_params = params;
}
    
sbaMarker_class.prototype.shape2d_path_style = function(shape,params) {
  var path, style={stroke:'#000',fill:'none'};
  if (shape == 'balloon') {
    path = this.balloonPath(params[0] || this.label.length);
    style.fill = this.rgb;
  } else if (shape == 'crosshair') {
    path = this.crosshairPath();
    //style.stroke = this.rgb;
  } else if (shape == 'corner') {
    path = this.cornerPath(params[0],params[1]);
    //style.stroke = this.rgb;
  } else if (shape == 'square') {
    path = this.squarePath();
    style.fill = this.rgb;
  }
  return [path,style];
}

sbaMarker_class.prototype.onmouseover = function(ev,dim) {
  if (this.tooltip.length) {
    ev.stopPropagation();
    var tip = this.tooltip;
    tooltip.show(ev,tip,undefined);
  }
}

sbaMarker_class.prototype.onmousemove = function(ev,dim) {
  this.onmouseover(ev,dim);
}

sbaMarker_class.prototype.onmouseout = function(ev,dim) {
  if (this.tooltip.length) {
    ev.stopPropagation();
    tooltip.hide();
  }
}

sbaMarker_class.prototype.onclick = function(ev,dim) {
  // overload me
}


/* sbaViewer_class */

function sbaViewer_class(config,svgCapable) {
  this.svgCapable = (svgCapable == undefined ? true : svgCapable);
  
  // initialize state variables
  this.setState({});

  // parse configuration parameters
  if (typeof(config) == 'undefined') config = {};
  this.template = config.template;
  this.templatePath = config.templatePath;

  // are we debugging?
  this.debug = (config['debug'] ? true : false);

  // load region tree
  this.regionTree = new regionTree_class(ACR_TO_PARENT,RGB_TO_ACR,BRAIN_REGIONS,false,config.hierarchyOrphanParent);

  // . slice range [sliceStart sliceEnd sliceStep]
  this.numSlices = hash.keys(BRAIN_SLICES).length;
  var sr = config.sliceRange;
  if (sr == undefined) sr = [1,hash.keys(BRAIN_SLICES).length];
  this.origSliceStart = sr[0];
  this.origSliceEnd = sr[1];
  this.origSliceStep = (sr.length > 2 ? sr[2] : 1);
  this.slicePositionLabel = config.slicePositionLabel;
  this.slicePositionUnit = config.slicePositionUnit;
  this.slicePositionDescription = config.slicePositionDescription;

  // hack: RAS coordinates?
  this.posteriorSliceView = (config.sliceCoordSystem == 'RAS');

  // . SVG bounding box
  var bb = config.boundingBox;
  if (bb == undefined) bb = [0,0,8268,11692];
  this.boundingBox = bb;
  this.aspectRatio = bb[2]/bb[3];

  // coordinate frame
  var cf = config.sliceCoordFrame;
  if (cf == undefined) cf = config.boundingBox;
  this.sliceCoordFrame = cf;
  var xLim = config.sliceXLim;
  if (xLim == undefined) xLim = [0,1];
  this.sliceXLim = xLim;
  var yLim = config.sliceYLim;
  if (yLim == undefined) yLim = [0,1];
  this.sliceYLim = yLim;
  
  // new: RAS limits
  var rasLimits = config.rasLimits;
  if (rasLimits == undefined) {
    pos0 = SLICE_POS[0];
    pos1 = SLICE_POS[SLICE_POS.length];
    rasLimits = [
      xLim,
      [pos0,pos1],
      yLim
    ];
  }
  this.rasLimits = rasLimits;
  
  // positioning 2d
  this.height2d = (config.height2d ? config.height2d : 374); // pixel height of 2d slice view

  // positioning 3d
  this.height3d = (config.height3d ? config.height3d : 300); // pixel height of 3d slice view
  var svgHeight = config.boundingBox[3];
  var svgPerPx = svgHeight/this.height3d;

  // default slice spacing: fit in available viewport width
  var pxSliceSpacing = config.width3d/(this.numSlices-1+10);
  this.bothHemispheres = config.hemisphere ? config.hemisphere == 'LR' : this.aspectRatio>=0.9;
  var pxWidthSlice = this.height3d*this.aspectRatio*(this.bothHemispheres ? 0.5 : 1);
  pxWidthSlice *= (config.sliceSpacing == undefined ? 105 : config.sliceSpacing)/100;
  this.sineAngle = 10*pxSliceSpacing/pxWidthSlice;
  this.defaultSliceSpacing = pxSliceSpacing*svgPerPx;
  // nominal slice spacing: based on stereotaxic coordinates
  if (SLICE_POS != undefined) {
    var mmLeftTop = this.svg2mm([0,config.boundingBox[1]]);
    var mmRightBottom = this.svg2mm([0,config.boundingBox[1]+config.boundingBox[3]]);
    var mmHeight = Math.abs(mmLeftTop[1]-mmRightBottom[1]);
    var iCenter = Math.floor(SLICE_POS.length-0.25);
    var mmSpacing = Math.abs(SLICE_POS[iCenter]-SLICE_POS[iCenter-1]);
    this.nominalSliceSpacing = svgHeight*mmSpacing/mmHeight;
  } else {
    var svgHeight = config.boundingBox[3];
    this.nominalSliceSpacing = svgHeight/this.numSlices; // rather arbitrary value
  }

  // . 3d rendering overlay
  if (config.overlay3d !== false) this.overlay3dTransparency = 0;
  
  // . 3d clipping
  this.clip3d = { signX: 0 };
  if (this.bothHemispheres) this.clip3d.signX = 1;

  
  // . 2d overlay
  this.useOverlays = (config.overlays != undefined);
  if (this.useOverlays) {
    this.overlays = config.overlays;
    if (config.featuredOverlay != undefined) {
      this.overlayMode = 1;
      this.overlayKey = config.featuredOverlay;
      this.overlayWhite = (this.overlays[this.overlayKey].whitebackground ? true : false);
    } else {
      this.overlayMode = 0;
      this.overlayKey = undefined;
      this.overlayWhite = false;
    }
    for (var key in config.overlays) {
      var ovl = config.overlays[key];
      var descr = ovl.descr;
      if (descr) {
        var elem = document.getElementById('TOGGLE_'+key);
        var me = this;
        elem.onmouseover = function(ev) {
          var key = this.id.substr(7);
          var descr = me.overlays[key].descr;
          ev.stopPropagation();
          tooltip.show(ev,descr,undefined);
        }
        elem.onmousemove = elem.onmouseover;
        elem.onmouseout = function(ev) {
          ev.stopPropagation(); 
          tooltip.hide();
        }
      }      
    }
  }
  
  // markers
  this.markers = []; // contains the actual markers
  
  // plugins
  var plugins = config.plugins;
  if (plugins != undefined) this.initPlugins(plugins,config.featuredPlugin);

  var acr2rgb = {};
  var key2acr = {};
  for (var rgb in RGB_TO_ACR) {
    var acr = RGB_TO_ACR[rgb];
    acr2rgb[acr] = rgb;
    key2acr[String(acr).toLowerCase()] = acr;
  }
  this.acr2rgb = acr2rgb;
  this.key2acr = key2acr;
}

sbaViewer_class.prototype.nameSpace = 'http://www.w3.org/2000/svg';

sbaViewer_class.prototype.getState = function() {
  return { 
    'acr':this.currentAcr,
    'origSlice':this.currentOrigSlice,
    'slice':this.currentSlice,
    'spacing3d':this.currentSpacing3d,
    'angle3d':this.currentAngle3d,
    'xyMark':this.currentXyMark
  }
}

sbaViewer_class.prototype.setState = function(state) {
  if (state.acr != undefined) { 
    this.currentAcr = state.acr;
  }
  if (state.origSlice != undefined) {
    this.currentOrigSlice = state.origSlice;
    this.currentSlice = this.orig2slice(state.origSlice);
  }
  if (state.spacing3d != undefined) this.currentSpacing3d = state.spacing3d;
  if (state.angle3d != undefined) this.currentAngle3d = state.angle3d;
  if (state.xyMark != undefined) this.currentXyMark = state.xyMark;
}

sbaViewer_class.prototype.validateState = function(state) {
  if (!state.acr && Object.keys && Object.keys(BS_SUGGESTIONS).length>1) {
    // choose a random acronym
    var keys = hash.keys(BRAIN_REGIONS);
    k = keys[Math.floor((keys.length)*Math.random())];
    state.acr = RGB_TO_ACR[k];
    if (this.debug && ACR_TO_FULL[state.acr] == undefined) alert('Undefined random rgb '+k);
  }
  // find best slice for given region
  if (!state.origSlice) {
    if (state.slice) {
      state.origSlice = this.slice2orig(state.slice);
    } else {
      var rgbList = this.getRgbList(state.acr);
      state.slice = this.bestSliceForGivenRegion(rgbList);
      state.origSlice = this.slice2orig(state.slice);
    }
  } else {
    state.slice = this.orig2slice(state.origSlice);
  }
  if (!state.spacing3d) state.spacing3d = 1;
  if (!state.angle3d) state.angle3d = 0;
  if (!state.xyMark) state.xyMark = [0,0];
  return state;
}

sbaViewer_class.prototype.applyStateChange = function(newState) {
  var state = this.getState();
  // only call functions which are relevant for the state-change  
  if (newState.origSlice != state.origSlice || newState.acr != state.acr) {
    this.showView2d(newState.origSlice,newState.acr);
  }
  if (newState.angle3d != state.angle3d || newState.spacing3d != state.spacing3d) {
    this.showView3d(newState.angle3d,newState.spacing3d);
  }
  if (newState.acr!= state.acr) {
    if (state.acr != undefined) this.hideRegion3D(state.acr);
    this.showRegion3D(newState.acr);
  }
  if (newState.origSlice != state.origSlice) {
    this.showSlice3D(this.orig2slice(newState.origSlice));
  }

  // update STATE variable
  this.setState(newState);

  // update plugin windows
  sbaPluginManager.applyStateChange(this);  
}

sbaViewer_class.prototype.initPlugins = function(plugins,featuredPlugin) {
  if (sbaPluginManager == undefined) { alert('Error: plugin manager not loaded.'); return; }
  for (var k in plugins) {
    sbaPluginManager.addPlugin(plugins[k],this);
  }
  sbaPluginManager.addWindow('SBA_PLUGINS',featuredPlugin,this);
  var regionWindow = sbaPluginManager.addWindow('SBA_REGIONS',false,this);
  regionWindow.navBarHtml = function(pluginName,pluginNiceName,pluginQuery) {
    var a = [];
    if (pluginQuery == 'slice') {
      a.push('<b>Regions in this slice</b> (<a href="javascript:void(0)" onclick="sbaPluginManager.activatePlugin(\'SBA_REGIONS\',\'RegionTree\',\'all\')">region hierarchy</a>)');
    } else {
      a.push('<b>All regions</b> (<a href="javascript:void(0)" onclick="sbaPluginManager.activatePlugin(\'SBA_REGIONS\',\'RegionTree\',\'slice\')">restrict to this slice</a>)');
    }
    return a.join('&#160;&gt;&#160;');
  }
  regionWindow.activatePlugin('RegionTree',this,'slice');
}

sbaViewer_class.prototype.copyObj = function(a) {
  var b = {};
  for (var k in a) b[k] = a[k];
  return b;
}

// returns true if acr is viewable
sbaViewer_class.prototype.isViewable = function(acr) {
  var node = this.regionTree.regionList[acr];
  if (node != undefined) {
    return node.isViewable();
  } else return false;
}

// returns list of this rgb and all its descendants
sbaViewer_class.prototype.getRgbList = function(acr) {
  var node = this.regionTree.regionList[acr];
  if (node != undefined) {
    return node.rgbRegions();
  } else return [];
}

sbaViewer_class.prototype.view3d_innerHTML = function(angle,modeSpacing3d) {
  var a = [];

  var bb = this.boundingBox;
  var svgPerPx = bb[3]/this.height3d;
  var pxHeight = this.height3d;
  var pxWidth2d = pxHeight*this.aspectRatio;
  var pxWidth3d = 10*this.defaultSliceSpacing/svgPerPx;
  var sliceSpacing = this.defaultSliceSpacing;
  if (modeSpacing3d == 0) sliceSpacing = this.nominalSliceSpacing;
  else if (modeSpacing3d == 2) sliceSpacing = 2*this.defaultSliceSpacing;
  else if (modeSpacing3d == 3) sliceSpacing = 0.5*(this.nominalSliceSpacing+this.defaultSliceSpacing);
  
  var pxSliceSpacing = sliceSpacing/svgPerPx;
  var pxWidth = Math.round(pxWidth3d+(this.numSlices-1)*pxSliceSpacing);
  var topMargin = Math.round(bb[3]*0.05);
  var bb3d = [bb[0], bb[1]-2*topMargin, Math.round(svgPerPx*pxWidth), bb[3]+2*topMargin];

  a.push('<svg id="VIEW3D_SVG_ELEM" class="slice3d" xmlns="'+this.nameSpace+'" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" preserveAspectRatio="xMinYMin meet" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; fill-rule:evenodd" width="'+pxWidth+'px" height="'+Math.round(pxHeight*1.1)+'px" viewBox="'+bb3d.join(' ')+'">');
  a.push('<g id="VIEW3D_BB">');
  // . saggital slice underlay
  if (this.saggital3d !== false) a.push('<g id="SAGGITAL3D"></g>');
  
  var sMin = (this.bothHemispheres ? 6 : 1);
  // x coordinate at 0 mm
  var x0 = this.mm2svg([0,0]);
  x0 = x0[0];
  for (var s=this.numSlices; s>=1; s-=1) {
    a.push('<g class="spacing_3d" transform="translate('+((s-sMin)*sliceSpacing)+',0) scale('+(this.sineAngle)+',1)">');
    if (angle != undefined) a.push('<g class="rotate_3d" transform="rotate('+angle+','+bb[2]/2+','+bb[3]/2+')">');
    if (this.posteriorSliceView) {
      a.push('<g transform="translate('+bb[2]+') scale(-1,1)">');
    }
    var signX = this.clip3d.signX;
    if (signX) {
      if (this.posteriorSliceView) signX = -signX;
      if (signX<0) a.push('<clipPath id="VIEW3D_LR"><rect x="'+(0)+'" width="'+(x0)+'" height="'+(bb[3])+'"/></clipPath>');
      else a.push('<clipPath id="VIEW3D_LR"><rect x="'+(x0)+'" width="'+(bb[2])+'" height="'+(bb[3])+'"/></clipPath>');
    }
    if (HULLS != undefined) {
      a.push('<path id="HULL3D_'+(s)+'" class="hull" d="'+HULLS[s-1][0]+'"'+(signX ? ' clip-path="url(#VIEW3D_LR)"' : '')+'/>');
    } else {
      // future: needs refinement
      a.push('<circle id="HULL3D_'+(s)+'" class="hull" cx="2in" cy="2in" r="1.0in"/>')
    }
    if ((s-1) % 10 == 0) {
      a.push('<g id="slice_3d_'+(s)+'" class="slice_3d">');    
      var sData = BRAIN_SLICES[s-1];
      for (var r in sData) if (sData.hasOwnProperty(r)) {
        var wm = (RGB_WHITE[r] != undefined);
        var rData = sData[r];
        for (var i in rData) if (rData.hasOwnProperty(i)) {
          a.push('<path '+(wm ? 'class="wm" ':'class="gm" ')+'d="'+SVG_PATHS[rData[i]]+'"'+(signX ? ' clip-path="url(#VIEW3D_LR)"' : '')+'/>');
        }
      }
      a.push('</g>');    
    }
    a.push('<g id="highlight_'+(s)+'"'+(signX ? ' clip-path="url(#VIEW3D_LR)"' : '')+'></g>');
    if ((s-1) % 10 == 0) {
      if (HULLS != undefined) {
        a.push('<path class="hull_10" onclick="sbaViewer.selectSlice('+(s)+')" d="'+HULLS[s-1][0]+'"/>');
      } else {
        a.push('<circle class="hull_10" onclick="sbaViewer.selectSlice('+(s)+')" cx="2in" cy="2in" r="1.0in"/>');
      }
    }
    if (this.posteriorSliceView) a.push('</g>');
    if (angle != undefined) a.push('</g>');
    a.push('</g>'); // horizontal translate and squeeze
    a.push('<g id="MARKERS3D_'+(s)+'"></g>');
  }
  a.push('</g>');
  if (this.overlay3dTransparency != undefined) a.push('<g id="OVERLAY3D"></g>');
  for (var s=this.numSlices; s>=1; s-=1) {
    a.push('<g id="MARKERS3D_onclick_'+(s)+'"></g>');
  }
  a.push('</svg>');
  return a.join('');
}

sbaViewer_class.prototype.fitOverlay3d = function(elem) {
  var view3d_bb = document.getElementById('VIEW3D_BB').getBBox();  
  elem.setAttribute('x',view3d_bb.x);
  elem.setAttribute('y',view3d_bb.y-50);
  elem.setAttribute('width',view3d_bb.width);
  elem.setAttribute('height',view3d_bb.height+100);
}

sbaViewer_class.prototype.showOverlay3d = function(inputElem) {
  // remove saggital underlay if present
  if (this.saggital3d === 1) {
    var elem = document.getElementById('SBAVIEWER_SHOWSAGGITAL3D');    
    this.showSaggital3d(elem);
  }
  var elem = document.getElementById('OVERLAY3D');
  var ch = elem.childNodes;
  var opacity = this.overlay3dTransparency+0.333;
  if (ch && ch.length) {
    ch = ch[0];
    if (opacity>1) {
      elem.removeChild(ch);
      inputElem.value = 'Activate';
      opacity = 0;
    } else {
      ch.setAttribute('opacity',opacity);
      if (opacity>0.99) inputElem.value = 'Remove'; 
    }
  } else {
    ch = document.createElementNS(this.nameSpace,'image');
    ch.setAttribute('preserveAspectRatio','none');
    ch.setAttribute('opacity',opacity);
    ch.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',this.templatePath+'/3dbar_overlay.png');
    this.fitOverlay3d(ch);
    elem.appendChild(ch);
    inputElem.value = 'Intensify'; 
  }
  this.overlay3dTransparency = opacity;
}

sbaViewer_class.prototype.fitSaggital3d = function(elem,ch) {
  var elem1 = document.getElementById('HULL3D_1');
  var elem2 = document.getElementById('HULL3D_'+this.numSlices);
  var M1 = elem.getTransformToElement(elem1);
  var M2 = elem.getTransformToElement(elem2);
  // var yLim = this.yLim;
  var xzSvg = this.mm2svg([0,0]);
  var xAnt = (xzSvg[0]-M1.e)/M1.a;
  var xPost = (xzSvg[0]-M2.e)/M2.a;
  yLimSlices = [SLICE_POS[SLICE_POS.length-1],SLICE_POS[0]];
  yLimVolume = this.rasLimits[1]; // posterior - anterior
  var cf = this.sliceCoordFrame;
  var svgPerMm = (xAnt-xPost)/(yLimSlices[1]-yLimSlices[0]);
  var x = xAnt+(yLimVolume[1]-yLimSlices[1])*svgPerMm;
  var width = Math.abs((yLimVolume[1]-yLimVolume[0])*svgPerMm);
  ch.setAttribute('x',x);
  ch.setAttribute('y',cf[1]+M1.f);
  ch.setAttribute('width',width);
  ch.setAttribute('height',cf[3]+M1.f);
}

sbaViewer_class.prototype.showSaggital3d = function(inputElem) {
  var elem = document.getElementById('SAGGITAL3D');
  var ch = elem.childNodes;
  if (ch && ch.length) {
    elem.removeChild(ch[0]);
    inputElem.value = 'Activate';
    this.saggital3d = -1;
  } else {
    ch = document.createElementNS(this.nameSpace,'image');
    ch.setAttribute('preserveAspectRatio','none');
    ch.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',this.templatePath+'/mid_saggital.jpg');
    this.fitSaggital3d(elem,ch);
    elem.appendChild(ch);
    inputElem.value = 'Remove'; 
    this.saggital3d = 1;
  }
}

sbaViewer_class.prototype.showView3d = function(angle,modeSpacing3d) {
  var elem = document.getElementById('view3d_svg');
  if (this.svgCapable) {
    var svgHTML = this.view3d_innerHTML(angle,modeSpacing3d);
    if (DOMParser && navigator.appName != 'Microsoft Internet Explorer') {
      var svgElem = elem.firstChild;
      var domElem = (new DOMParser()).parseFromString(svgHTML, "application/xml"); // image/svg+xml would be nicer
      // replace existing svgElem by the new domElem
      elem.replaceChild(document.importNode(domElem.documentElement, true),svgElem);
    } else {
      // old way
      elem.innerHTML = svgHTML;
    }
  } else {
    img = '<img alt="3D view, template '+this.template+'" src="../services/thumbnail.php?template='+this.template+'&size=L&dim=3d"/>';
    elem.innerHTML = img;
  }
  //elem.style.width = null;
  //elem.style.height = null;
  var elem = document.getElementById('sliceSpacing3d');
  elem.selectedIndex = modeSpacing3d;
  var options = elem.options;
  options[0].innerHTML = 'Fiducial (100%)';
  options[1].innerHTML = 'Fit width ('+Math.round(100*this.defaultSliceSpacing/this.nominalSliceSpacing)+'%)';
  options[2].innerHTML = 'Very wide ('+Math.round(200*this.defaultSliceSpacing/this.nominalSliceSpacing)+'%)';
  options[3].innerHTML = 'Intermediate ('+Math.round(50+50*this.defaultSliceSpacing/this.nominalSliceSpacing)+'%)';
  var elem = document.getElementById('angle3d');
  elem.value = angle;
}

// future: use rgbList as argument
sbaViewer_class.prototype.hideRegion3D = function(acr) {
  if (this.svgCapable) {
    var rgbList = this.getRgbList(acr);
    for (var k in rgbList) if (rgbList.hasOwnProperty(k)) {
      var sData = BRAIN_REGIONS[rgbList[k]];
      for (var s0 in sData) {
        s0 = parseInt(s0);
        var elem = document.getElementById('highlight_'+(s0+1));
        var ch = elem.childNodes;
        for (var i=ch.length-1; i>=0; i--) {
          elem.removeChild(ch[i]);
        }
      }
    }
  }
}

sbaViewer_class.prototype.showRegion3D = function(acr,resultClass) {
  var rgbList = this.getRgbList(acr);
  var elem = document.getElementById('view3d_title');
  var info = '';
  if (acr == null || acr == '') {
    info = 'No region selected.';
  } else {
    var acrPlusFull = BS_SUGGESTIONS[acr];
    if (acrPlusFull == undefined) {
      var full = ACR_TO_FULL[acr];
      if (full == undefined) {
        info = 'The atlas does not contain a region <b style="color: #f00">'+acr+'</b>.';
      } else {
        info = 'The atlas contains a region <b style="color: #f00">'+acr+': '+full+'</b>, but it is not part of the imported atlas template.';
      }
    } else {
      info = 'Selected region: <b style="color: #f00">'+BS_SUGGESTIONS[acr]+'</b>'+(rgbList.length>1 ? ' and its subregions' : '')+'<br/>';
    }
  }
  elem.innerHTML = info;  
  if (this.svgCapable) {
    for (var k in rgbList) if (rgbList.hasOwnProperty(k)) {
      var sData = BRAIN_REGIONS[rgbList[k]];
      for (var s0 in sData) {
        s0 = parseInt(s0);
        if (resultClass != undefined && (s0 % 10 != 0)) continue;
        var elem = document.getElementById('highlight_'+(s0+1));
        var dData = sData[s0];
        for (var i in dData) if (dData.hasOwnProperty(i)) {
          var path = SVG_PATHS[dData[i]];
          var tagName = 'path';
          var attrName = 'd';
          if (path.substr(0,1)!='M') {
            tagName = 'polygon';
            attrName = 'points';
          }
          var node = document.createElementNS(this.nameSpace,tagName);
          node.setAttribute('class','highlight'+(resultClass ? '_'+resultClass : ''));
          node.setAttribute(attrName,path);
          elem.appendChild(node);
        }
      }
    }
  } else {
    elem = document.getElementById('view3d_svg');
    img = '<img alt="3D view, region '+escB(acr)+', template '+this.template+'" src="../services/thumbnail.php?template='+this.template+'&region='+escB(acr)+'&size=L&dim=3d"/>';
    elem.innerHTML = img;
  }
}

sbaViewer_class.prototype.hideMarkers3d = function(markers) {
  if (this.svgCapable) {
    for (var k in markers) if (markers.hasOwnProperty(k)) {
      var elem = document.getElementById('MARKER30D_'+k);
      if (elem) elem.parentNode.removeChild(elem);
      var elem = document.getElementById('MARKER31D_'+k);
      if (elem) elem.parentNode.removeChild(elem);
    }
  }
}

sbaViewer_class.prototype.addMarkerElem = function(elem0,marker,dim) {
  // dim 30 and 31 refer to layer 0 and 1 of 3D markers
  var elem1 = document.createElementNS(this.nameSpace,'g');
  elem1.setAttribute('id','MARKER'+dim+'D_'+marker.id);
  if (dim != 30) {
    // handle mouse events
    elem1.setAttribute('onmouseover','sbaViewer.markers['+marker.id+'].onmouseover(evt,'+dim+')');
    elem1.setAttribute('onmousemove','sbaViewer.markers['+marker.id+'].onmousemove(evt,'+dim+')');
    elem1.setAttribute('onmouseout','sbaViewer.markers['+marker.id+'].onmouseout(evt,'+dim+')');
    elem1.setAttribute('onclick','sbaViewer.markers['+marker.id+'].onclick(evt,'+dim+')');
  }
  
  var markerX = marker.xySvg[0];
  var markerY = marker.xySvg[1];
  if (dim == 2) {
    var magnify = 2;
    elem1.setAttribute('transform','translate('+markerX+','+markerY+') scale('+magnify+','+magnify+')');
  }
  // if dim == 3, function positionMarkers3d will position the markers
  var markerShape = 'balloon';
  var markerStyle = [];
  var elem2 = document.createElementNS(this.nameSpace,'path');
  markerStyle.push('stroke-linecap:butt');
  if (dim == 2) {
    markerShape = marker.shape2d;
    var path_style = marker.shape2d_path_style(markerShape,marker.shape2d_params);
    elem2.setAttribute('d',path_style[0]);
    for (var k in path_style[1]) markerStyle.push(k+':'+path_style[1][k]);
  } else {
    elem2.setAttribute('d',marker.balloonPath(marker.label.length));
    markerStyle.push('fill:'+marker.rgb);
  }
  if (dim == 31) {
    // the invisible marker, to handle mouse events
    elem2.setAttribute('class','invisible');
    elem1.appendChild(elem2);
  } else {
    elem2.setAttribute('class','marker');
    elem2.setAttribute('style',markerStyle.join(';'));
    if (markerShape == 'crosshair' || markerShape == 'corner' || markerShape == 'square') {
      var svgElem = document.getElementById('VIEW2D_SVG_ELEM');
      // var px2svg = svgElem.viewBox.baseVal.width / svgElem.width.baseVal.value;
      // clone node to provide background for dasharray
      var elem2a = elem2.cloneNode(false);
      elem2a.setAttribute('style','stroke: '+marker.rgb+'; fill: none');
      elem2.setAttribute('stroke-dasharray','25,35');
      elem1.appendChild(elem2a);
      if (markerShape == 'crosshair') {
        var elem3 = document.createElementNS(this.nameSpace,'animate');
        elem3.setAttribute('attributeType','CSS');
        elem3.setAttribute('attributeName','stroke-width'); 
        elem3.setAttribute('values','20px;60px;20px'); 
        elem3.setAttribute('dur','1.5s'); 
        elem3.setAttribute('repeatCount','indefinite');
        elem2a.appendChild(elem3);
      }
      elem1.appendChild(elem2);
    } else {
      var elem3 = document.createElementNS(this.nameSpace,'text');
      elem3.setAttribute('x','0');
      elem3.setAttribute('y','-250');
      elem3.setAttribute('class','marker');
      elem4 = document.createTextNode(marker.label,true);
      elem3.appendChild(elem4);
      elem1.appendChild(elem2);
      elem1.appendChild(elem3);
    }
  }
  elem0.appendChild(elem1);
  return elem1;
}

sbaViewer_class.prototype.positionMarkers3d = function(markers) {
  if (this.svgCapable) {
    // prepare conversion of markerX and markerY from pixel position to SVG units
    /* OLD
     * var svgElem = document.getElementById('VIEW3D_SVG_ELEM');
     * var px2svgX = svgElem.viewBox.baseVal.width / svgElem.width.baseVal.value;
     * var px2svgY = svgElem.viewBox.baseVal.height / svgElem.height.baseVal.value;
     */
    var magnify = 4;
    for (var k in markers) if (markers.hasOwnProperty(k)) {
      var mk = markers[k];
      var mk_slice = this.orig2slice(mk.origSlice);
      // CTM is the cumulative transformation matrix to transform a point in pixel coordinate space
      var elem = document.getElementById('HULL3D_'+(mk_slice));
      var CTM = elem.getCTM();
      elem = document.getElementById('MARKER30D_'+mk.id);
      var CTM0 = elem.getCTM();
      // apply CTM to marker position and convert to SVG coords
      var markerX0 = mk.xySvg[0];
      var markerY0 = mk.xySvg[1];
      var markerX = CTM.a*markerX0+CTM.c*markerY0+CTM.e-CTM0.e;
      var markerY = CTM.b*markerX0+CTM.d*markerY0+CTM.f-CTM0.f;
      markerX /= CTM0.a;
      markerY /= CTM0.d;
      var elem = document.getElementById('MARKER30D_'+mk.id);
      elem.setAttribute('transform','translate('+markerX+','+markerY+') scale('+magnify+','+magnify+')');
      var elem = document.getElementById('MARKER31D_'+mk.id);
      elem.setAttribute('transform','translate('+markerX+','+markerY+') scale('+magnify+','+magnify+')');
    }
  }
}

sbaViewer_class.prototype.showMarkers3d = function(markers) {
  if (this.svgCapable) {
    for (var k in markers) if (markers.hasOwnProperty(k)) {
      var mk_slice = this.orig2slice(markers[k].origSlice);
      // this places a visible marker in the proper layer between slices
      var elem0 = document.getElementById('MARKERS3D_'+mk_slice);
      var elem1 = this.addMarkerElem(elem0,markers[k],30);
      // this places an invisible marker on top of all layers
      var elem0 = document.getElementById('MARKERS3D_onclick_'+mk_slice);
      var elem1 = this.addMarkerElem(elem0,markers[k],31);
    }
    this.positionMarkers3d(markers);
  }
}

sbaViewer_class.prototype.showMarkers2d = function(s,markers) {
  if (this.svgCapable) {
    for (var k in markers) if (markers.hasOwnProperty(k)) {  
      var mk = markers[k];
      var mk_slice = this.orig2slice(mk.origSlice);
      if (mk_slice == s) {
        var elem0 = document.getElementById('markers2d');
        var elem1 = this.addMarkerElem(elem0,mk,2);
      }
    }
  }
}

sbaViewer_class.prototype.addMarkers = function(markers,overwrite) {
  if (overwrite) {
    this.hideMarkers3d(this.markers);
    // clear all markers in 2d view
    var elem = document.getElementById('markers2d');
    var ch = elem.childNodes;
    for (var i=ch.length-1; i>=0; i--) {
      elem.removeChild(ch[i]);
    }
    this.markers = []; 
  }
  for (var k in markers) if (markers.hasOwnProperty(k)) {
    markers[k].id = this.markers.length;
    this.markers.push(markers[k]);
  }
  this.showMarkers2d(this.currentSlice,markers);
  this.showMarkers3d(markers);
}

sbaViewer_class.prototype.showSlice3D = function(s) {
  if (s==undefined) s=this.currentSlice;
  if (this.currentSlice != undefined) {
    var elem = document.getElementById('HULL3D_'+this.currentSlice);
    if (elem) elem.setAttribute('class','hull');
  }
  if (s != undefined) {
    var elem = document.getElementById('HULL3D_'+s);
    if (elem) elem.setAttribute('class','hull_highlight');
  }
}

sbaViewer_class.prototype.showResultRegions3D = function(resultSet) {
  for (var rgb in resultSet) {
    var cls = resultSet[rgb];
    var acr = RGB_TO_ACR[rgb];
    this.showRegion3D(acr,cls);
  }
}

// two dimensional view of slice s, selected region rgb
sbaViewer_class.prototype.view2d_innerHTML = function(s,acr) {
  var rgbList = this.getRgbList(acr);
  var a = [];
  var bb = this.boundingBox;
  var heightPx = this.height2d;
  var widthPx = this.height2d*this.aspectRatio;

  var pathClass = '';
  if (this.overlayMode==1) pathClass += ' nofill' + (this.overlayWhite ? ' onwhite' : '');
  else if (this.overlayMode==2) pathClass += ' noborders';
  a.push('<svg id="VIEW2D_SVG_ELEM" class="slice2d" xmlns="'+this.nameSpace+'" xml:space="preserve" preserveAspectRatio="xMinYMin" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; fill-rule:evenodd" width="'+Math.round(widthPx)+'px" height="'+Math.round(heightPx)+'px" viewBox="'+bb.join(' ')+'" onmouseover="sbaViewer.mouseoverRegion(evt)" onmousemove="sbaViewer.mousemoveRegion(evt)" onmouseout="sbaViewer.mouseoutRegion(evt)">');
  var sData = BRAIN_SLICES[s-1];
  if (this.debug) { 
    // show hull in 2d view for debugging
    //a.push('<path id="HULL2D" class="hull_highlight" d="'+HULLS[s-1][0]+'"/>');
  }
  var resultSet = this.resultSet;
  if (resultSet != undefined) {
    var classNames = this.copyObj(resultSet);
  } else {
    var classNames = {};
  }
  for (var i in rgbList) if (rgbList.hasOwnProperty(i)) classNames[rgbList[i]] = '';
  for (var r in sData) if (sData.hasOwnProperty(r)) {
    var wm = (this.overlayMode!=1 && RGB_WHITE[r] != undefined ? 'wm ' : '');
    var rData = sData[r];
    var c = classNames[r];
    c = 'class="'+(c != undefined ? 'highlight'+(c != '' ? '_'+c : '')+(this.overlayMode>0 ? ' semifill': '') : wm+pathClass)+'" ';
    for (var i in rData) if (rData.hasOwnProperty(i)) {
      var pathId = rData[i];
      path = SVG_PATHS[pathId];
      //if (path.substr(0,1) != 'M') tagStart = '<polygon points="';
      //else 
      var tagStart = '<path '+(this.debug ? 'id="'+pathId+'"' : '')+' d="';
      a.push(tagStart+path+'" '+c+'onclick="sbaViewer.clickRegion(evt,\''+r+'\')" onmouseover="sbaViewer.mouseoverRegion(evt,\''+r+'\')" onmousemove="sbaViewer.mousemoveRegion(evt,\''+r+'\')" onmouseout="sbaViewer.mouseoutRegion(evt)"/>');      
    }
  }
  a.push('<g id="highlightRegion2d"></g>');
  a.push('<g id="markers2d"></g>');
  a.push('</svg>');
  return a.join('');
}

sbaViewer_class.prototype.mouseoverRegion = function(ev,rgb) {
  ev.stopPropagation();
  var tip = '';
  if (rgb != undefined) {
    var acr = RGB_TO_ACR[rgb];
    tip += (acr == undefined ? '#'+rgb : BS_SUGGESTIONS[acr].replace(/ /g,'&#160;'))+(this.debug ? '<br/>rgb: '+rgb+'<br/>polygon id: '+ev.target.id : '')+'<br/>';
  }
  var xyPix = tooltip.elemXY(ev,'view2d_svg');
  var xySvg = this.view2d_pix2svg(xyPix);
  var xyCoord = this.svg2mm(xySvg);  
  var xy = [Math.round(xyCoord[0]*100)/100,Math.round(xyCoord[1]*100)/100];
  tip += '<span style="font-size: small">XZ&#160;('+xy[0]+','+'&#160;'+xy[1]+')</span>';

  tooltip.show(ev,tip,undefined);
  this.mouseoverAcronym(rgb);
}

sbaViewer_class.prototype.mousemoveRegion = function(ev,rgb) {
  this.mouseoverRegion(ev,rgb);
}

sbaViewer_class.prototype.mouseoutRegion = function(ev) {
  ev.stopPropagation();
  tooltip.hide();
}

sbaViewer_class.prototype.mouseoverAcronym = function(rgb) {
  if (rgb==undefined) rgb = this.hoverAcronym;
  if (this.hoverAcronym != undefined) {
    var elem = document.getElementById('REGIONTREE_region_'+this.hoverAcronym);
    if (elem) elem.className = '';

    if (this.svgCapable) {
      // remove previous highlight in 2D view
      elem = document.getElementById('highlightRegion2d');
      var ch = elem.childNodes;
      for (var i=ch.length-1; i>=0; i--) {
        elem.removeChild(ch[i]);
      }
    }
    this.hoverAcronym = undefined;
  }
  if (rgb != undefined) {
    // highlight in list
    var elem = document.getElementById('REGIONTREE_region_'+rgb);
    if (elem == undefined) {
      //if (this.debug) alert('Undefined element: '+'REGIONTREE_region_'+rgb+' '+ACR_TO_FULL[rgb]);
      return;
    }
    elem.className = 'highlight';
    if (this.svgCapable) {
      // highlight in 2D view
      elem = document.getElementById('highlightRegion2d');
      var sData = BRAIN_REGIONS[rgb];
      var dData = sData[this.currentSlice-1];
      for (var i in dData) if (dData.hasOwnProperty(i)) {
        var node = document.createElementNS(this.nameSpace,'path');
        node.setAttribute('class','acronym_highlight');
        node.setAttribute('d',SVG_PATHS[dData[i]]);
        node.setAttribute('onmouseover','void(0)');
        elem.appendChild(node);
      }
    }
    this.hoverAcronym = rgb;
  }
}

sbaViewer_class.prototype.addOverlay2D = function(os) {
  var divElem = document.getElementById('view2d_overlay');
  var imgElem = document.getElementById('view2d_overlay_img');
  if (this.overlayMode==0) {
    divElem.style.display = 'none';
    return;
  }
  divElem.style.display = 'block';
  var ovl = this.overlays[this.overlayKey];
  var parts = ovl.source.match(/(.*[^%])(%\d+d)(.*)/);
  if (parts) {
    parts.shift();
    slice_no = ovl.orig2overlay ? this.nearestOverlay(os,ovl.orig2overlay) : os;
    if (slice_no) {
      if (parts[1].charAt(1) == '0') {
        var zeropad = parts[1].charAt(2);
        var slice_no = '00000'.substr(0,zeropad-String(slice_no).length)+slice_no;
      }
      parts[1] = slice_no;
      //if (ovl.format == "dzi") {}
      if (this.svgCapable) {
        var svgElem = document.getElementById('VIEW2D_SVG_ELEM');
        var svgWidth = svgElem.width.baseVal.value;
        var bb = this.boundingBox;
        var anchorBox = this.sliceCoordFrame;
        var anchorUnit = ovl.anchorUnit;
        if (anchorUnit != undefined) {
          if (anchorUnit == 'svg') {
            anchorBox = ovl.anchorBox;
          } else if (anchorUnit == 'mm') {
            anchorBox = ovl.anchorBox;
            var xy1 = this.mm2svg([anchorBox[0],anchorBox[1]]);
            var xy2 = this.mm2svg([anchorBox[0]+anchorBox[2],anchorBox[1]+anchorBox[3]]);
            var w = xy2[0]-xy1[0];
            var h = xy2[1]-xy1[1];
            var x = xy1[0];
            var y = xy1[1];
            if (w<0) { w = -w; x = xy2[0] }
            if (h<0) { h = -h; y = xy2[1] }
            anchorBox = [x,y,w,h];
          } else {
            globalErrorConsole.addError('Unsupported anchorUnit "'+anchorUnit+'"');
          }
        }
        var w = svgWidth/bb[2]*anchorBox[2];
        var moveRight = (anchorBox[0]-bb[0])*svgWidth/bb[2];
        var moveDown = ((anchorBox[1])-(bb[1]))*svgWidth/bb[2];
        imgElem.width = w;      
        divElem.style.left = moveRight+'px';
        divElem.style.top = moveDown+'px';
      }
      var img = this.templatePath+'/'+parts.join('');
      if (ovl.colorMap == 'jet') {
        imgElem.src = '../php/jetimage.php?jpg='+encodeURIComponent(img);
      } else {
        imgElem.src = img;
      }
    } else {
      imgElem.src = undefined
    }
  }
  // future: let sba_viewer.js take over the toggle buttons from coronal3d.php
  elem = document.getElementById('TOGGLE_'+this.overlayKey);
  elem.className = "overlay-on";
}

sbaViewer_class.prototype.showView2d = function(os,acr) {
  var s0 = this.orig2slice(os)-1;
  var elem = document.getElementById('view2d_svg');
  if (this.svgCapable) {
    var svgHTML = this.view2d_innerHTML(s0+1,acr);
    if (DOMParser && navigator.appName != 'Microsoft Internet Explorer') {
      var svgElem = elem.firstChild;
      var domElem = (new DOMParser()).parseFromString(svgHTML, "application/xml"); // image/svg+xml would be nicer
      // replace existing svgElem by the new domElem
      elem.replaceChild(document.importNode(domElem.documentElement, true),svgElem);
    } else {
      // old way 
      elem.innerHTML = svgHTML;
    }
  } else {
    if (this.overlayMode < 2) {
      elem.innerHTML = '<img alt="2D view, region '+escB(acr)+', template '+this.template+'" src="../services/thumbnail.php?template='+this.template+'&region='+escB(acr)+'&size=L&dim=2d"/>';
    } else {
      elem.innerHTML = '';
    }
  }
  if (this.debug) { 
    elem = document.getElementById('HULL2D');
  }

  elem = document.getElementById('slice_no');
  slice_no = this.orig2slice(os,true);
  if (os != slice_no) slice_no = ''+slice_no+' ('+os+')';
  elem.value = slice_no;
  slicePos = this.origSlice2mm(os);
  elem = document.getElementById('slice_pos');
  elem.innerHTML = [this.slicePositionLabel,Math.round(100*slicePos)/100,this.slicePositionUnit].join(' ');
  elem = document.getElementById('searchBrainRegion');
  if (acr) {
    var acrPlusFull = BS_SUGGESTIONS[acr];
    elem.value = (acrPlusFull == undefined ? acr : acrPlusFull);
  } else {
    elem.value = '';
  }
  if (this.useOverlays) this.addOverlay2D(os);
  this.showMarkers2d(s0+1,this.markers);
}

sbaViewer_class.prototype.regionCenterAndVolume = function(acr) {
  var rgbList = this.getRgbList(acr);
  var ctr;
  var vol=0;
  if (rgbList.length > 0 && window.RGB_VOLUMES != undefined) {
    var iLargest = 0;
    var vLargest = 0;
    for (var i=0; i<rgbList.length; i++) {
      vol_i = RGB_VOLUMES[rgbList[i]]; 
      vol += vol_i;
      if (vol_i>vLargest) {
        iLargest = i;
        vLargest = vol_i;
      }
    }
    if (window.RGB_CENTERS) {
      ctr = RGB_CENTERS[rgbList[iLargest]];
    } else if (window.RGB_CENTERS_YXZ) {
      ctr = RGB_CENTERS_YXZ[rgbList[iLargest]];
      if (ctr) {
        var xz_mm = this.svg2mm([ctr[1],ctr[2]]);
        var y_mm = SLICE_POS[ctr[0]-1];
        ctr = [xz_mm[0],y_mm,xz_mm[1]];
      }
    }
  }
  return [ctr,vol,rgbList];
}

sbaViewer_class.prototype.nearestOrigSlice = function(yMm) {
  if (window.ORIGSLICE_POS == undefined) return this.slice2orig(this.nearestSlice(yMm));
  var dSelect = undefined;
  var sSelect = undefined;
  for (var s in ORIGSLICE_POS) if (ORIGSLICE_POS.hasOwnProperty(s)) {
    s = parseInt(s);
    var pos = ORIGSLICE_POS[s];
    var d = Math.abs(yMm-pos);
    if (dSelect != undefined && d>=dSelect) break;
    dSelect = d;
    sSelect = s;
  }
  return sSelect;
}

// assume orig2overlay keys are monotonically in- or decreasing
sbaViewer_class.prototype.nearestOverlay = function(os,orig2overlay) {
  var dSelect = undefined;
  var sSelect = undefined;
  for (var s in orig2overlay) {
    var d = Math.abs(os-s);
    if (dSelect != undefined && d>=dSelect) break;
    dSelect = d;
    sSelect = s;
  }
  return orig2overlay[sSelect];
}

/*
sbaViewer_class.prototype.nearestValue = function(target,sortedlist) {
  if (!sortedlist.length) return undefined;
  var len = sortedlist.length;
  var iMin = 0;
  var iMax = len-1;
  var i = iMin;
  var valMin = sortedlist[iMin];
  var valMax = sortedlist[iMax];
  var val = valMin;
  var iter = 0;
  while (iMin < iMax && iter<100) {
    var dval_di = (valMax-valMin)/(iMax-iMin);
    var step = Math.round((target-val)/dval_di);
    i += step;
    if (i>iMax) i = iMax;
    if (i<iMin) i = iMin;
    val = sortedlist[i];
    if (val>target) { iMax = i; valMax = val; }
    else { iMin = 1; valMin = val; }
    iter++;
  }
  return val;
}
*/

sbaViewer_class.prototype.nearestSlice = function(sCoord) {
  var dSelect = undefined;
  for (var s0 in SLICE_POS) if (SLICE_POS.hasOwnProperty(s0)) {
    s0 = parseInt(s0);
    var pos = SLICE_POS[s0];
    var d = Math.abs(sCoord-pos);
    if (dSelect != undefined && d>dSelect) break;
    dSelect = d;
    s0Select = s0;
  }
  // now do the interpolation
  return s0Select+1;
}

sbaViewer_class.prototype.origSlice2mm = function(os) {
  if (window.ORIGSLICE_POS == undefined) return this.sliceIndex2mm(this.orig2slice(os));
  return ORIGSLICE_POS[os];
}

sbaViewer_class.prototype.sliceIndex2mm = function(s) {
  return (SLICE_POS != undefined ? SLICE_POS[s-1] : s);
}

sbaViewer_class.prototype.view2d_pix2svg = function(xyPix) {
  var bb = this.boundingBox; // the SVG bounding box
  var elem = document.getElementById('VIEW2D_SVG_ELEM');
  // cursor position as fraction of container width
  var xyPixFrac = [(xyPix[0]+0.4999)/elem.width.baseVal.value,(xyPix[1]+0.4999)/elem.height.baseVal.value];
  return [bb[0]+xyPixFrac[0]*bb[2],bb[1]+xyPixFrac[1]*bb[3]];
}

sbaViewer_class.prototype.mm2svg = function(xyCoord) {
  var xLim = this.sliceXLim;
  var yLim = this.sliceYLim;
  var xyCoordFrac = [(xyCoord[0]-xLim[0])/(xLim[1]-xLim[0]),(xyCoord[1]-yLim[0])/(yLim[1]-yLim[0])];
  // xy-origin is not top-left but lower-left corner
  xyCoordFrac[1] = 1-xyCoordFrac[1];
  var cf = this.sliceCoordFrame;
  return [cf[0]+xyCoordFrac[0]*cf[2],cf[1]+xyCoordFrac[1]*cf[3]];
}

sbaViewer_class.prototype.svg2mm = function(xySvg) {
  var cf = this.sliceCoordFrame;
  var xyCoordFrac = [(xySvg[0]-cf[0])/cf[2],(xySvg[1]-cf[1])/cf[3]];
  // xy-origin is not top-left but lower-left corner
  xyCoordFrac[1] = 1-xyCoordFrac[1];
  var xLim = this.sliceXLim;
  var yLim = this.sliceYLim;
  return [xLim[0]+xyCoordFrac[0]*(xLim[1]-xLim[0]),yLim[0]+xyCoordFrac[1]*(yLim[1]-yLim[0])];
}

sbaViewer_class.prototype.showResultRegions = function(regions_to_classNames) {
  var report = [];
  var resultSet = {};
  for (var acr in regions_to_classNames) {
    var rgb = this.acr2rgb[acr];
    var cls = regions_to_classNames[acr];
    if (rgb != undefined) {
      resultSet[rgb] = cls;
    } else {
      var tryAcr = this.key2acr[acr.toLowerCase()];
      rgb = this.acr2rgb[tryAcr];
      if (rgb != undefined) {
        resultSet[rgb] = cls;
        report.push('Warning: case error in region \''+acr+'\'');
      } else {
        report.push('Error: unknown region \''+acr+'\'');
      }
    }
  }
  this.showResultRegions3D(resultSet);
  this.resultSet = resultSet;
  this.showView2d(this.currentOrigSlice,this.currentAcr);
  return report;
}

sbaViewer_class.prototype.selectOverlay = function(key) {
  // overlayMode:
  //   0 - show only borders
  //   1 - show overlay + borders
  //   2 - show only overlay
  if (key == undefined) {
    // the 'borders' button was clicked
    if (this.overlayMode == 0) {
      // nothing to show/hide
    } else {
      // toggle delineation
      if (this.overlayMode == 1) {
        this.overlayMode = 2;
        document.getElementById('TOGGLE_DELINEATION').className = "overlay-off";
      } else {
        this.overlayMode = 1;
        document.getElementById('TOGGLE_DELINEATION').className = "overlay-on";
      }      
    }
  } else {
    if (this.overlayMode == 0) {
      this.overlayMode = 1;
      document.getElementById('TOGGLE_'+key).className = "overlay-on";
      this.overlayKey = key;
      this.overlayWhite = (this.overlays[this.overlayKey].whitebackground ? true : false);
    } else {
      if (this.overlayKey == key) {
        this.overlayMode = 0;
        document.getElementById('TOGGLE_DELINEATION').className = "overlay-on";
        document.getElementById('TOGGLE_'+key).className = "overlay-off";
      } else {
        document.getElementById('TOGGLE_'+this.overlayKey).className = "overlay-off";
        document.getElementById('TOGGLE_'+key).className = "overlay-on";      
        this.overlayKey = key;
        this.overlayWhite = (this.overlays[this.overlayKey].whitebackground ? true : false);
      }
    }  
  }
  this.showView2d(this.currentOrigSlice,this.currentAcr);
}

sbaViewer_class.prototype.selectClip3d = function(param,val) {
  if (param == 'signX') this.clip3d.signX = Number(val);
  var state = this.getState();
  this.showView3d(state.angle3d,state.spacing3d);
  this.showRegion3D(state.acr);
  this.showSlice3D(this.orig2slice(state.origSlice));
}

sbaViewer_class.prototype.prevSlice = function() {
  var s = parseInt(this.currentSlice)-1;
  if (s<1) s=this.numSlices;
  this.selectSlice(s);
}

sbaViewer_class.prototype.nextSlice = function() {
  var s = parseInt(this.currentSlice)+1;
  if (s>this.numSlices) s=1;
  this.selectSlice(s);
}

sbaViewer_class.prototype.validateSlice = function(s) {
  if (s<1) s=1;
  if (s>this.numSlices) s=this.numSlices;
  return s;
}

sbaViewer_class.prototype.orig2slice = function(origSlice,keepDecimals) {
  // returns 1-based SBA slice number
  var s = (origSlice-this.origSliceStart)/this.origSliceStep+1;
  s = this.validateSlice(s);
  return (keepDecimals ? Math.round(100*s)/100 : Math.round(s));
}

sbaViewer_class.prototype.slice2orig = function(sbaSlice) {
  // returns original slice closest to sbaSlice
  return Math.round(this.origSliceStart+this.origSliceStep*(sbaSlice-1));
}

sbaViewer_class.prototype.parseAndSelectSlice = function(slice_no) {
  s = parseFloat(slice_no);
  if (isNaN(s)) {
    var origA = slice_no.indexOf('(');
    if (origA>-1) {
      var origB = slice_no.indexOf(')');
      if (origB>origA+1) {
        os = parseInt(slice_no.substring(origA+1,origB));
      }
    }
  } else {
    os = this.slice2orig(s);
  }
  if (os != undefined) this.selectOrigSlice(os);
}

sbaViewer_class.prototype.selectOrigSlice = function(os) {
  if (this.currentOrigSlice == os) return;
  var newState = this.getState();
  newState.origSlice = os;
  this.applyStateChange(newState);
//  this.showView2d(os,this.currentAcr);
//  this.showSlice3D(s);
//  this.setState({'origSlice':os});
}

sbaViewer_class.prototype.selectSlice = function(s) {
  var s = this.validateSlice(s);
  this.selectOrigSlice(this.slice2orig(s));
}

sbaViewer_class.prototype.selectSpacing = function(mode) {
  var sliceSpacing = this.defaultSliceSpacing; 
  if (mode == 0) {
    sliceSpacing = this.nominalSliceSpacing;
  } else if (mode == 2) {
    sliceSpacing = 2*this.defaultSliceSpacing; 
  } else if (mode == 3) {
    sliceSpacing = 0.5*(this.defaultSliceSpacing+this.nominalSliceSpacing); 
  } else {
    mode = 1;
  }

  var elem = document.getElementById('VIEW3D_SVG_ELEM');
  if (elem) {
    var pxHeight = this.height3d;
    var pxSliceSpacing = sliceSpacing*pxHeight/this.boundingBox[3];
    elem.viewBox.baseVal.width = (this.numSlices-1+10)*sliceSpacing;
    elem.width.baseVal.value = (this.numSlices-1+10)*pxSliceSpacing;
  }

  if (document.getElementsByClassName) {
    var elems = document.getElementsByClassName('spacing_3d');
    var lastSlice = elems.length;
    var sMin = (this.bothHemispheres ? 6 : 1);    
    for (var k=0; k<elems.length; k++) {
      var tr = elems[k].transform;      
      if (tr) {
        s = lastSlice-k;
        tr.baseVal.getItem(0).setTranslate((s-sMin)*sliceSpacing,0);
      }
    }
  }
  
  var elem = document.getElementById('sliceSpacing3d');
  elem.selectedIndex = mode;
  this.setState({'spacing3d':mode});
  this.positionMarkers3d(this.markers);

  if (this.overlay3dTransparency > 0) {
    elem = document.getElementById('OVERLAY3D');
    this.fitOverlay3d(elem.childNodes[0]);
  }
}

sbaViewer_class.prototype.prevAngle = function() {
  var a = Number(this.currentAngle3d)-15;
  this.selectAngle(a);
}

sbaViewer_class.prototype.nextAngle = function() {
  var a = Number(this.currentAngle3d)+15;
  this.selectAngle(a);
}

sbaViewer_class.prototype.selectAngle = function(a) {
  if (a<0) a %= 360;
  if (a>=360) a %= 360;
  if (document.getElementsByClassName) {
    var elems = document.getElementsByClassName('rotate_3d');
    for (var k=0; k<elems.length; k++) {
      var tr = elems[k].transform;
      if (tr) tr.baseVal.getItem(0).setRotate(Number(a),this.boundingBox[2]/2,this.boundingBox[3]/2);  
    }
    var elem = document.getElementById('angle3d');
    elem.value = a;
    this.setState({'angle3d':a});
  }
  if (this.debug) {
    var elem = document.getElementById('view3d_svg');
    elem.focus();    
    var time0 = window.globalDebugTimer;
    var date = new Date(); 
    var time1 = date.getTime();
    if (time0) globalErrorConsole.addError('Rotating the view took '+(time1-time0)+' ms');
    globalDebugTimer = time1;
  }
  this.positionMarkers3d(this.markers);
}

sbaViewer_class.prototype.sliceContainsRegion = function(s,rgbList) {
  var s0 = s-1;
  for (var i=0; i<rgbList.length; i++) {
    if (BRAIN_SLICES[s0][rgbList[i]] != undefined) return true;
  }
  return false;
}

sbaViewer_class.prototype.bestSliceForGivenRegion = function(rgbList) {
  // find best slice for given region
  var slice;
  if (rgbList.length>0) {
    var rgb = rgbList[0];
    var slices = hash.keys(BRAIN_REGIONS[rgb]);
    if (slices.length>0) {
      slice = slices[Math.round(slices.length/2-0.25)];
    }
  }
  if (slice == undefined) {
    var slices = hash.keys(BRAIN_SLICES);
    slice = slices[Math.round(slices.length/2-0.25)];
  }
  return slice;
}

sbaViewer_class.prototype.selectRegion = function(acr,s) {
  var state = this.getState();
  if (acr!=undefined) {
    if (s==undefined) {
      var rgbList = this.getRgbList(acr);
      if (!this.sliceContainsRegion(this.currentSlice,rgbList)) {
        state.origSlice = this.slice2orig(this.bestSliceForGivenRegion(rgbList));  
      }
    } else state.origSlice = this.slice2orig(s);
  }
  state.acr = acr;
  this.applyStateChange(state);
  this.writeHistory();
}

sbaViewer_class.prototype.toggleRegion = function(acr,s) {
  var state = this.getState();
  if (state.acr == acr) acr = '';
  this.selectRegion(acr,s);
}

sbaViewer_class.prototype.selectSuggestedRegion = function(acrPlusFullName) {
  if (acrPlusFullName == 'demo') {
    this.runDemo();
    return;
  }
  var acr = firstmatch_ci(acrPlusFullName,BS_SUGGESTIONS);
  if (acr==undefined) {
    // perhaps only the acronym was typed
    var acrTyped = acrPlusFullName.replace(/^\s+|\s+$/g,''); // trim whitespace
    // try case-sensitive match
    if (BS_SUGGESTIONS[acrTyped] != undefined) acr = acrTyped;
    else {
      // try case-insensitive match
      validAcronyms = hash.keys(BS_SUGGESTIONS);
      var i = firstmatch_ci(acrTyped,validAcronyms);
      if (i != undefined) acr = validAcronyms[i];
      else {
        if (ALIAS_TO_ACR) {
          var aliasAcr = ALIAS_TO_ACR[acrTyped];
          if (aliasAcr) {
            var i = firstmatch_ci(aliasAcr,validAcronyms);
            if (i != undefined) acr = validAcronyms[i];
          }
        }
      }
    }
    if (BS_SUGGESTIONS[acr] != undefined) acrPlusFullName = BS_SUGGESTIONS[acr];
  }
  if (acr==undefined) {
    globalErrorConsole.addError('Can\'t find a region named "'+acrPlusFullName+'"');
  } else {
    // region is known to atlas
    var rgbList = this.getRgbList(acr);
    if (rgbList.length == 0) {
      // . but has not been delineated
      globalErrorConsole.addError('No polygon(s) defined for region "'+acrPlusFullName+'"');
    } else {
      // . and can be shown!
      this.selectRegion(acr);
    }
  }
}

sbaViewer_class.prototype.runDemo = function(i) {
  if (this.stopDemo) {
    this.stopDemo = false;
    browser.documentBody().onkeypress = function() {};
    return;
  }
  if (i==undefined) i=0;
  if (i==1) browser.documentBody().onkeypress = function() { sbaViewer.stopDemo = true; }
  var iMatch = 0;
  for (var s0 in BRAIN_SLICES) if (BRAIN_SLICES.hasOwnProperty(s0)) {
    s0 = parseInt(s0);
    var rData = BRAIN_SLICES[s0];
    if (iMatch==i) {
      if (i % 5 == 1) {
        var keys = hash.keys(rData);
        var k = keys[Math.floor((keys.length+1)*Math.random())];
        var acr = RGB_TO_ACR[k];        
        this.selectRegion(acr,s0+1);
      } else {
        this.selectSlice(s0+1);
      }
      setTimeout('sbaViewer.runDemo('+(i+1)+')',1000);
      return;
    }
    iMatch++;
  }
  // no match: restart demo
  this.runDemo();
}

sbaViewer_class.prototype.clickRegion = function(ev,r) {
  // store mouseClick location
  var xyPix = tooltip.elemXY(ev,'view2d_svg');
  this.setState({'xyMark':this.svg2mm(this.view2d_pix2svg(xyPix))});
  /*
    var rgbList = this.getRgbList(this.state.acr);
    iMatch = firstmatch(r,rgbList);
    if (iMatch != undefined) this.onClickSelectedRegion(ev)
    else this.selectRegion(RGB_TO_ACR[r]);
  */
  this.selectRegion(RGB_TO_ACR[r]);
}

sbaViewer_class.prototype.onClickSelectedRegion = function(ev) {
  var contextMenu = new contextWindow_class('launchQuery');
  var acr = this.currentAcr;
  var html = 'Queries for region "'+acr+'"<hr style="position: relative; width: 100%"/>';
  var s = '';
  html += 'No queries have been defined';
  contextMenu.render(ev,html);
}

sbaViewer_class.prototype.hrefNeuroNames = function(nn) {
  var ah = nn.substr(0,1);
  var href = 'http://braininfo.rprc.washington.edu/';
  if (ah == 'A') {
    nn = nn.substr(1);
    href += 'Scripts/ancilcentraldirectory.asp?ID='+nn;
  } else if (ah == 'H') {
    nn = nn.substr(1);
    href += 'Scripts/hiercentraldirectory.asp?ID='+nn;
  } else {
    href += 'centraldirectory.aspx?ID='+nn;
  }
  return href;
}

sbaViewer_class.prototype.initSuggestions = function() {
  BS_SUGGESTIONS = {};
  var validAcronyms = [];
  for (var acr in ACR_TO_FULL) {
    if (ACR_TO_FULL.hasOwnProperty(acr)) if (this.isViewable(acr)) validAcronyms.push(acr);
  }
  for (var i=0; i<validAcronyms.length; i++) {
    var acr = validAcronyms[i];
    var full = ACR_TO_FULL[acr];
    BS_SUGGESTIONS[acr] = acr==full ? full : acr+' : '+full;
  }
  var as = new fastSuggest_class(hash.values(BS_SUGGESTIONS),[' ','(','.'],'BrainRegion');
  as.attachTo('searchBrainRegion');
}

sbaViewer_class.prototype.onClickPermaLink = function(ev) {
  var contextMenu = new contextWindow_class('permaLink');
  var pageurl = top.location.href;
  var posQ = pageurl.indexOf('?');
  if (posQ>-1) pageurl = pageurl.substr(0,posQ);
  var compactUrl = pageurl+'?'+'template='+this.template+'&amp;region='+this.currentAcr;
  var html = '<a class="button" style="width: 26ex" href="'+compactUrl+'" target="_parent">Compact url to this page</a><br/>';
  var state = this.getState();
  var query = hash.keyValueStrings(state,'=').join('&amp;');
  var fullUrl = pageurl+'?'+encodeURI(query);
  html += '<a class="button" style="width: 26ex" href="'+fullUrl+'" target="_parent">Full url to this page</a>';
  contextMenu.render(ev,html);
}

sbaViewer_class.prototype.writeHistory = function() {
  var historyWindow = window.KEEPHISTORY;
  if (historyWindow) {  
    this.isLocked = true;
    var oldQuery = historyWindow.location.search.substr(1);
    var state = this.getState();
    var newQuery = hash.keyValueStrings(state,'=').join('&');
    if (oldQuery == newQuery) return false;
    historyWindow.location.search = '?'+newQuery;
  }
  return true;
}
