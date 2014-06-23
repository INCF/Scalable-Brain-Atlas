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

function sbaViewer_class(orphanParentAcr,aspectRatio) {
  this.state = {};
  this.regionTree = new regionTree_class(ACR_TO_PARENT,RGB_TO_ACR,BRAIN_REGIONS,false,orphanParentAcr);
  this.showRegionTree();
  this.sliceSpacing = (GLOBAL.sliceSpacing != undefined ? GLOBAL.sliceSpacing : 180);
  this.size2dReduce = (GLOBAL.size2dReduce != undefined ? GLOBAL.size2dReduce : 1/3);
  this.aspectRatio = (aspectRatio != undefined ? aspectRatio : 8.26772/11.6929);
  var acr2rgb = {};
  var key2acr = {};
  for (var rgb in RGB_TO_ACR) {
    var acr = RGB_TO_ACR[rgb];
    acr2rgb[acr] = rgb;
    key2acr[acr.toLowerCase()] = acr;
  }
  this.acr2rgb = acr2rgb;
  this.key2acr = key2acr;
}

sbaViewer_class.prototype.copyObj = function(a) {
  var b = {};
  for (var k in a) b[k] = a[k];
  return b;
}

sbaViewer_class.prototype.getState = function() {
  // future expansion: return only important state variables
  return this.state;
}

// returns list of this rgb and all its descendants
sbaViewer_class.prototype.rgbList = function(rgb) {
  var acr = RGB_TO_ACR[rgb];
  var node = this.regionTree.regionList[acr];
  if (node != undefined) {
    return node.rgbRegions();
  } else return [];
}

sbaViewer_class.prototype.showRegionTree = function() {
  var nestedArray = this.regionTree.rootNode.asNestedArray(ACR_TO_FULL);
  this.myRegionTree = new myTree_class('regionTree',nestedArray);
  document.getElementById('regionTree').innerHTML = this.myRegionTree.html();
}

sbaViewer_class.prototype.updateRegionTree = function(rgb) {
  var acr = RGB_TO_ACR[rgb];
  var node = this.myRegionTree.contentRoot.getNodeByKey(acr);
  if (node != undefined) {
    node.toggleIntoView();
  }
}

sbaViewer_class.prototype.showExternalResources = function(rgb) {
}

sbaViewer_class.prototype.view3D_innerHTML = function(angle) {
  var a = [];
  var width1000 = 4000*GLOBAL.width3d;
  a.push('<svg class="slice3d" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="none" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; fill-rule:evenodd; overflow: hidden" width="'+(width1000/4000)+'in" height="'+GLOBAL.height3d+'in" viewBox="0 -400 '+width1000+' 12092">');
  for (var s=GLOBAL.sliceEnd; s>=GLOBAL.sliceStart; s--) {
    a.push('<g transform="translate('+((s-1)*this.sliceSpacing)+',0)">');
    a.push('<g class="scale_3d" transform="scale('+GLOBAL.width3dReduce+',1)">');    
    if (angle != undefined) a.push('<g class="rotate_3d" transform="rotate('+angle+',3134,6046)">');
    // a.push('<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>');

    if (typeof HULLS != 'undefined') {
      a.push('<path id="hull_'+(s)+'" class="hull" d="'+HULLS[s]+'"/>');
    } else {
      // needs refinement
      a.push('<circle id="hull_'+(s)+'" class="hull" cx="2in" cy="2in" r="1.0in"/>')
    }
    if (s-10*Math.floor(0.1*s)==1) {
      a.push('<g id="slice_3d_'+(s)+'" class="slice_3d">');    
      var sData = BRAIN_SLICES[s];
      for (var r in sData) if (sData.hasOwnProperty(r)) {
        var rData = sData[r];
        for (var i in rData) if (rData.hasOwnProperty(i)) {
          a.push('<path d="'+SVG_PATHS[rData[i]]+'"/>');
        }
      }
      a.push('</g>');    
    }
    a.push('<g id="highlight_'+(s)+'"></g>');
    if (s-10*Math.floor(0.1*s)==1) {
      if (typeof HULLS != 'undefined') {
        a.push('<path class="hull_10" onclick="sbaViewer.selectSlice('+(s)+')" d="'+HULLS[s]+'"/>');
      } else {
        a.push('<circle class="hull_10" onclick="sbaViewer.selectSlice('+(s)+')" cx="2in" cy="2in" r="1.0in"/>');
      }
    }
    if (angle != undefined) a.push('</g>');
    a.push('</g></g>');
  }
  a.push('</svg>');
  return a.join('');
}

sbaViewer_class.prototype.showView3D = function(angle) {
  var elem = document.getElementById('view3d_svg');
  elem.innerHTML = this.view3D_innerHTML(angle);
  elem.style.width = GLOBAL.width3d+'in'; 
  elem.style.height = GLOBAL.height3d+'in'; 
  var elem = document.getElementById('view3d_controls');
  elem.style.left = GLOBAL.width3d+0.1+'in';
  var elem = document.getElementById('angle3d');
  elem.value = angle;
}

sbaViewer_class.prototype.hideRegion3D = function(rgb) {
  var rgbList = this.rgbList(rgb);
  for (var k in rgbList) if (rgbList.hasOwnProperty(k)) {
    var sData = BRAIN_REGIONS[rgbList[k]];
    for (var s in sData) {
      var elem = document.getElementById('highlight_'+s);
      var ch = elem.childNodes;
      for (var i=ch.length-1; i>=0; i--) {
        elem.removeChild(ch[i]);
      }
    }
  }
}

sbaViewer_class.prototype.showRegion3D = function(rgb,resultClass) {
  var rgbList = this.rgbList(rgb);
  var elem = document.getElementById('view3d_title');
  elem.innerHTML = '3D view, showing every 10-th slice, with region <b style="color: #f00">'+BS_SUGGESTIONS[rgbList[0]]+'</b> '+(rgbList.length>1 ? 'and its subregions' : '')+' in red<br/>';  
  for (var k in rgbList) if (rgbList.hasOwnProperty(k)) {
    var sData = BRAIN_REGIONS[rgbList[k]];
    for (var s in sData) {
      if (resultClass != undefined && ((s-1) % 10 != 0)) continue;
      var elem = document.getElementById('highlight_'+s);
      var dData = sData[s];
      for (var i in dData) if (dData.hasOwnProperty(i)) {
        var path = SVG_PATHS[dData[i]];
        var tagName = 'path';
        var attrName = 'd';
        if (path.substr(0,1)!='M') {
          tagName = 'polygon';
          attrName = 'points';
        }
        if (document.createElementNS) {
          var node = document.createElementNS('http://www.w3.org/2000/svg',tagName);
          node.setAttribute('class','highlight'+(resultClass ? '_'+resultClass : ''));
          node.setAttribute(attrName,path);
          elem.appendChild(node);
        }
      }
    }
  }
}

sbaViewer_class.prototype.showSlice3D = function(s) {
  if (s==undefined) s=this.state.slice;
  if (this.state.slice != undefined) {
    var elem = document.getElementById('hull_'+this.state.slice);
    if (elem) elem.setAttribute('class','hull');
  }
  if (s != undefined) {
    var elem = document.getElementById('hull_'+s);
    if (elem) elem.setAttribute('class','hull_highlight');
  }
}

sbaViewer_class.prototype.showResultRegions3D = function(resultSet) {
  for (var rgb in resultSet) {
    var cls = resultSet[rgb];
    this.showRegion3D(rgb,cls);
  }
}

// two dimensional view of slice s, selected region rgb
sbaViewer_class.prototype.view2D_innerHTML = function(s,rgb) {
  var rgbList = this.rgbList(rgb);
  var a = [];
  var widthInch = 11.6929*this.aspectRatio;
  a.push('<svg class="slice2d" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="none" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; fill-rule:evenodd" width="'+(widthInch*this.size2dReduce)+'in" height="'+(11.6929*this.size2dReduce)+'in" viewBox="0 0 '+Math.round(widthInch*1000)+' 11692">');
  a.push('<g transform="translate(0,400)">');
  var sData = BRAIN_SLICES[s];
  // debug hulls, add 'if debug...'
  if (this.mode == 'debug') { 
    a.push('<path class="hull_highlight" d="'+HULLS[s]+'"/>');
  }
  var resultSet = this.resultSet;
  if (resultSet != undefined) {
    var classNames = this.copyObj(resultSet);
  } else {
    var classNames = {};
  }
  for (var i in rgbList) if (rgbList.hasOwnProperty(i)) classNames[rgbList[i]] = '';
  for (var r in sData) if (sData.hasOwnProperty(r)) {
    var rData = sData[r];
    var c = classNames[r];
    c = (c != undefined ? 'class="highlight'+(c != '' ? '_'+c : '')+'" ' : '');
    for (var i in rData) if (rData.hasOwnProperty(i)) {
      path = SVG_PATHS[rData[i]];
      if (path.substr(0,1) != 'M') tagStart = '<polygon points="';
      else tagStart = '<path d="';
      a.push(tagStart+path+'" '+c+'onclick="sbaViewer.onClickRegion(evt,\''+r+'\')" onmouseover="sbaViewer.mouseoverRegion(evt,\''+r+'\')" onmousemove="tooltip.move(evt)" onmouseout="sbaViewer.mouseoutRegion(\''+r+'\')"/>');
    }
  }
  a.push('<g id="highlightRegion2d"></g>');
  a.push('</g>');
  a.push('</svg>');
  return a.join('');
}

sbaViewer_class.prototype.mouseoverRegion = function(ev,rgb) {
  var x=0,y=0;
  tooltip.show(ev,BS_SUGGESTIONS[rgb],undefined);
}

sbaViewer_class.prototype.mouseoutRegion = function(rgb) {
  tooltip.hide();
}

sbaViewer_class.prototype.mouseoverAcronym = function(rgb) {
  if (rgb==undefined) rgb = GLOBAL.mouseoverAcronym;
  if (GLOBAL.mouseoverAcronym != undefined) {
    var elem = document.getElementById('li_region_'+GLOBAL.mouseoverAcronym);
    if (elem) elem.className = '';

    // remove previous highlight in 2D view
    elem = document.getElementById('highlightRegion2d');
    var ch = elem.childNodes;
    for (var i=ch.length-1; i>=0; i--) {
      elem.removeChild(ch[i]);
    }
  }
  if (rgb != undefined) {
    // highlight in list
    var elem = document.getElementById('li_region_'+rgb);
    elem.className = 'highlight';
    // highlight in 2D view
    elem = document.getElementById('highlightRegion2d');
    var sData = BRAIN_REGIONS[rgb];
    var dData = sData[this.state.slice];
    for (var i in dData) if (dData.hasOwnProperty(i)) {
      var node = document.createElementNS('http://www.w3.org/2000/svg','path');
      node.setAttribute('class','acronym_highlight');
      node.setAttribute('d',SVG_PATHS[dData[i]]);
      elem.appendChild(node);
      if (typeof(PATH_CENTERS) != 'undefined') {
        var node = document.createElementNS('http://www.w3.org/2000/svg','circle');
        var ctr = PATH_CENTERS[dData[i]].split(' ');
        node.setAttribute('class','circle_highlight');
        node.setAttribute('cx',ctr[0]);
        node.setAttribute('cy',ctr[1]);
        node.setAttribute('r',50);
        elem.appendChild(node);
      }
    }
  }
  GLOBAL.mouseoverAcronym = rgb;
}

sbaViewer_class.prototype.showView2D = function(s,rgb) {
  var rgbList = this.rgbList(rgb);
  var elem = document.getElementById('view2d_title');
  elem.innerHTML = '2D view, showing slice '+s+', with region <b style="color: #f00">'+BS_SUGGESTIONS[rgb]+'</b> '+(rgbList.length>1 ? 'and its subregions' : '')+' in red<br/>';  
  var elem = document.getElementById('view2d_list');
  var a = [];
  var regions = [];
  // ... think of special sort routine as used in hierarchy
  for (var r in BRAIN_SLICES[s]) {
    regions.push(RGB_TO_ACR[r] ? BS_SUGGESTIONS[r].toLowerCase()+r : r);
  }
  regions.sort();
  for (var i=0; i<regions.length; i++) { 
    var r = regions[i].substr(-6);
    var regionName = (RGB_TO_ACR[r] ? BS_SUGGESTIONS[r] : '[#'+regions[i]+']');
    // if (r==rgb) class="selected"
    a.push('<li id="li_region_'+r+'" onclick="sbaViewer.selectRegion(\''+r+'\')" onmouseover="sbaViewer.mouseoverAcronym(\''+r+'\')">'+regionName+'</li>'); 
  }
  elem.innerHTML = '<ul class="sitelist">'+a.join('')+'</ul>'; 
  var elem = document.getElementById('view2d_svg');
  elem.innerHTML = this.view2D_innerHTML(s,rgb);
  elem = document.getElementById('slice_no');
  elem.value = s;
  elem = document.getElementById('searchBrainRegion');
  elem.value = BS_SUGGESTIONS[rgb];
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
  this.showView2D(this.state.slice,this.state.rgb);
  return report;
}


sbaViewer_class.prototype.prevSlice = function() {
  var s = Number(this.state.slice)-1;
  if (s<1) s=GLOBAL.sliceEnd;
  this.selectSlice(s);
}

sbaViewer_class.prototype.nextSlice = function() {
  var s = Number(this.state.slice)+1;
  if (s>GLOBAL.sliceEnd) s=1;
  this.selectSlice(s);
}

sbaViewer_class.prototype.validateSlice = function(s) {
  if (s<1) s=1;
  if (s>GLOBAL.sliceEnd) s=GLOBAL.sliceEnd;
  return s;
}

sbaViewer_class.prototype.selectSlice = function(s) {
  var s = this.validateSlice(s);
  this.showView2D(s,sbaViewer.state.rgb);
  this.showSlice3D(s);
  this.state.slice = s;
}

sbaViewer_class.prototype.prevAngle = function() {
  var a = Number(this.state.angle3d)-15;
  if (a<0) a+=360;
  this.selectAngle(a);
}

sbaViewer_class.prototype.nextAngle = function() {
  var a = Number(this.state.angle3d)+15;
  if (a>=360) a-=360;
  this.selectAngle(a);
}

sbaViewer_class.prototype.selectAngle = function(a) {
  if (document.getElementsByClassName) {
    var elems = document.getElementsByClassName('rotate_3d');
    for (var k in elems) if (elems.hasOwnProperty(k)) {
      var tr = elems[k].transform;
      if (tr) tr.baseVal.getItem(0).setRotate(a,3134,6046);  
    }
    var elem = document.getElementById('angle3d');
    elem.value = a;
    this.state.angle3d = a;
  }
}

sbaViewer_class.prototype.selectRegion = function(rgb,slice) {
  if (rgb==undefined) return;
  var myState = this.copyObj(this.state);
  if (slice==undefined) {
    if (BRAIN_SLICES[myState.slice][rgb] == undefined) {
      var sData = BRAIN_REGIONS[rgb];
      for (var s in sData) if (s.hasOwnProperty(s)) break;
      myState.slice = s;
    }
  } else myState.slice = slice;
  myState.rgb = rgb;
  this.storeState(myState);
}

sbaViewer_class.prototype.selectSuggestedRegion = function(acrPlusFullName) {
  if (acrPlusFullName == 'demo') {
    this.runDemo();
    return;
  }
  var rgb = firstmatch_ci(acrPlusFullName,BS_SUGGESTIONS);
  if (rgb==undefined) {
    // perhaps only the acronym was typed
    var acr = acrPlusFullName.replace(/^\s+|\s+$/g,'');
    // case-sensitive match?
    rgb = firstmatch(acr,RGB_TO_ACR);
    if (rgb==undefined) {
      // try case-insensitive match
      rgb = firstmatch_ci(acr,RGB_TO_ACR);
    } 
    if (BS_SUGGESTIONS[rgb] != undefined) acrPlusFullName = BS_SUGGESTIONS[rgb];
  }
  if (rgb==undefined) {
    alert('Can\'t find a region named "'+acrPlusFullName+'"');
  } else {
    // region is known to atlas
    if (BRAIN_REGIONS[rgb] == undefined) {
      // . but has not been delineated
      alert('No contour available for region '+acrPlusFullName);
    } else {
      // . and can be shown!
      this.selectRegion(rgb);
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
  for (var s in BRAIN_SLICES) if (BRAIN_SLICES.hasOwnProperty(s)) {
    var rData = BRAIN_SLICES[s];
    if (iMatch==i) {
      if (i % 5 == 1) {
        var keys = hash.keys(rData);
        k = keys[Math.floor((keys.length+1)*Math.random())];
        this.selectRegion(k,s);
      } else {
        this.selectSlice(s);
      }
      setTimeout('sbaViewer.runDemo('+(i+1)+')',1000);
      return;
    }
    iMatch++;
  }
  // no match: restart demo
  this.runDemo();
}

sbaViewer_class.prototype.onClickRegion = function(ev,r) {
  if (this.state.rgb == r) this.onClickSelectedRegion(ev)
  else this.selectRegion(r);
}

sbaViewer_class.prototype.onClickSelectedRegion = function(ev) {
  var contextMenu = new contextWindow_class('launchQuery');
  var acr = RGB_TO_ACR[this.state.rgb];
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
  for (var rgb in BRAIN_REGIONS) if (BRAIN_REGIONS.hasOwnProperty(rgb)) {
    var acr = RGB_TO_ACR[rgb];
    var full = ACR_TO_FULL[acr];
    BS_SUGGESTIONS[rgb] = acr+' : '+full;
  }
  var as = new fastSuggest_class(hash.values(BS_SUGGESTIONS),' ','BrainRegion');
  as.attachTo('searchBrainRegion');
}

sbaViewer_class.prototype.initState = function(query) {
  var kv = query.split('&');
  var state = hash.createFromKeyValueStrings(kv,'=');
  if (state.region) {
    var acr = state.region;
    var minus = acr.indexOf('-');
    if (minus>-1) acr = acr.substr(minus+1);
    state.rgb = firstmatch(acr,RGB_TO_ACR);
    if (!state.rgb) state.rgb = firstmatch_ci(acr,RGB_TO_ACR);
    delete state.region; // as long as rgb is the main region identifier
  }
  if (!state.rgb) {
    for (state.rgb in BRAIN_REGIONS) break;
  }
  if (!state.slice && state.rgb) {
    var slices = hash.keys(BRAIN_REGIONS[state.rgb]);
    var s = slices[Math.round(slices.length/2-0.25)];
    state.slice = s;
  }
  state.slice = (state.slice == undefined ? 61 : this.validateSlice(state.slice)); 
  if (!state.angle3d) state.angle3d = 0;
  return state;
}

sbaViewer_class.prototype.onClickPermaLink = function(ev) {
  var contextMenu = new contextWindow_class('permaLink');
  var acr = RGB_TO_ACR[this.state.rgb];
  var pageurl = top.location.href;
  var posQ = pageurl.indexOf('?');
  if (posQ>-1) pageurl = pageurl.substr(0,posQ);
  var compactUrl = pageurl+'?'+'template='+this.state.template+'&amp;region='+acr;
  var html = '<a class="button" style="width: 26ex" href="'+compactUrl+'" target="_parent">Compact url to this page</a><br/>';
  var query = hash.keyValueStrings(this.state,'=').join('&amp;');
  var fullUrl = pageurl+'?'+encodeURI(query);
  html += '<a class="button" style="width: 26ex" href="'+fullUrl+'" target="_parent">Full url to this page</a>';
  contextMenu.render(ev,html);
}

sbaViewer_class.prototype.storeState = function(myState) {
  var newQuery = hash.keyValueStrings(myState,'=').join('&');
  var historyWindow = window.KEEPHISTORY;
  if (historyWindow) {
    var oldQuery = historyWindow.location.search.substr(1);
    if (oldQuery != newQuery) {
      historyWindow.location.search = '?'+newQuery;
    }
  }
}

sbaViewer_class.prototype.applyStateChange = function(newState) {
  // only call functions which are relevant for the state-change
  if (newState.slice != this.state.slice || newState.rgb != this.state.rgb) {
    this.showView2D(newState.slice,newState.rgb);
  }
  if (newState.angle3d != this.state.angle3d) {
    this.showView3D(newState.angle3d);
  }
  if (newState.rgb != this.state.rgb) {
    if (this.state.rgb != undefined) this.hideRegion3D(this.state.rgb);
    this.showRegion3D(newState.rgb);
    this.updateRegionTree(newState.rgb);
    this.showExternalResources(newState.rgb);
  }
  if (newState.slice != this.state.slice) {
    this.showSlice3D(newState.slice);
  }
  // adjust permalink to reflect new state
  var pm = document.getElementById('permalink');
  var me = this;
  pm.onclick = function(ev) {
    me.onClickPermaLink(ev);
  }
  // update STATE variable
  this.state = newState;
}

