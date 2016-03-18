function addmarkerPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.template = sbaViewer.template;
  if (this.template == 'WHS09' || this.template == 'WHS10') {
    args = {'CMD':'ListSRSs'};
    var req = new jsonRequest_class('plugins/dai_services_2009.php',args);
    // response handler
    me = this;
    me.selectedCoordTransform = -1;
    req.responseHandler = function(ans) {    
      me.srsInfo = ans;
      me.selectedCoordTransform = 0;
      me.activateCoordTransform();
    }
    req.submit();
  }
}
addmarkerPlugin_class.prototype = new sbaPlugin_class();

addmarkerPlugin_class.prototype.activate = function(sbaState,divElem) {
  var a = '';
  a += '<b>Show coordinate marker</b><p></p>';
  a += '<table><col style="width:3ex"/><col style="width:5ex"/>';
  a += '<tr><td>X: </td><td colspan="2"><input id="SBA_PLUGINS_ADDMARKER_X" type="text" size="10" value="0"/> [mm] left (-) to right (+)</td>';
  a += '</tr><tr><td>Y: </td><td colspan="2"><input id="SBA_PLUGINS_ADDMARKER_Y" type="text" size="10" value="0"/> [mm] posterior (-) to anterior (+)</td>';
  a += '</tr><tr><td>Z: </td><td colspan="2"><input id="SBA_PLUGINS_ADDMARKER_Z" type="text" size="10" value="0"/> [mm] inferior (-) to superior (+)</td>';
  a += '</tr><tr><td colspan="2">label: </td><td><input id="SBA_PLUGINS_ADDMARKER_label" type="text" size="3" value="X"/> (appears inside marker)</td>';
  a += '</tr><tr><td colspan="2">comment: </td><td><input id="SBA_PLUGINS_ADDMARKER_comment" type="text" size="20" value=""/> (appears as tooltip)</td>';
  a += '</tr><tr><td colspan="4"><input id="SBA_PLUGINS_ADDMARKER_submit" type="button" value="Show marker" onclick="sbaPluginManager.getPlugin(\'AddMarker\').showMe()"/><input id="SBA_PLUGINS_ADDMARKER_remove" type="button" value="Remove all markers" onclick="sbaViewer.addMarkers([],1)"/></td></tr></table>';
  a += '<div id="SBA_PLUGINS_ADDMARKER_COORDTRANSFORM">';
  a += '</div>';
  divElem.innerHTML = a;
  this.activateCoordTransform(); 
}

addmarkerPlugin_class.prototype.activateCoordTransform = function() {
  if (this.selectedCoordTransform != undefined) {
    var elem = document.getElementById('SBA_PLUGINS_ADDMARKER_COORDTRANSFORM');
    if (elem) {
			if (this.selectedCoordTransform > -1) {
				elem.innerHTML = this.coordTransformHtml();
				this.setCoordTransformSRS(this.selectedCoordTransform);
			} else {
				elem.innerHTML = 'Coordinate transformations still loading or not available; check error console.';
			}
	  }
  }
}

addmarkerPlugin_class.prototype.showMe = function() {
  // create marker with specified label and position
  var X = document.getElementById('SBA_PLUGINS_ADDMARKER_X').value;
  var Y = document.getElementById('SBA_PLUGINS_ADDMARKER_Y').value;
  var Z = document.getElementById('SBA_PLUGINS_ADDMARKER_Z').value;
  var label = document.getElementById('SBA_PLUGINS_ADDMARKER_label').value;
  var slice = sbaViewer.nearestSlice(Y);
  var xy = sbaViewer.mm2svg([X,Z]);
  var marker = new sbaMarker_class(label,slice,xy);
  marker.onclick = function() {
    alert('This is marker '+marker.label+', at slice '+marker.slice+'.');
  }
  // add comment as tooltip
  var comment = document.getElementById('SBA_PLUGINS_ADDMARKER_comment').value;
  marker.tooltip = comment;
  // show the marker
  sbaViewer.selectSlice(slice);
  sbaViewer.addMarkers([marker]);
}

addmarkerPlugin_class.prototype.setCoordTransformSRS = function(srsIndex) {
  this.selectedCoordTransform = srsIndex;
  var elem = document.getElementById('SBA_PLUGINS_COORDTRANSF_XYZORIGIN');
  elem.innerHTML = this.srsInfo.origin[srsIndex];
  var elem = document.getElementById('SBA_PLUGINS_COORDTRANSF_XLIM');
  elem.innerHTML = '['+this.srsInfo.unit[srsIndex]+'] '+this.srsInfo.minusX[srsIndex][0]+' (-) to '+this.srsInfo.plusX[srsIndex][0]+' (+)';
  var elem = document.getElementById('SBA_PLUGINS_COORDTRANSF_YLIM');
  elem.innerHTML = '['+this.srsInfo.unit[srsIndex]+'] '+this.srsInfo.minusY[srsIndex][0]+' (-) to '+this.srsInfo.plusY[srsIndex][0]+' (+)';
  var elem = document.getElementById('SBA_PLUGINS_COORDTRANSF_ZLIM');
  elem.innerHTML = '['+this.srsInfo.unit[srsIndex]+'] '+this.srsInfo.minusZ[srsIndex][0]+' (-) to '+this.srsInfo.plusZ[srsIndex][0]+' (+)';
}

addmarkerPlugin_class.prototype.doCoordTransform = function(inverse) {
  var prefixIn = 'SBA_PLUGINS_COORDTRANSF_';
  var prefixOut = 'SBA_PLUGINS_ADDMARKER_';
  var srsIn = this.srsInfo.name[this.selectedCoordTransform];  
  var srsOut = 'Mouse_WHS_1.0';
  if (inverse) {
    var swap = prefixIn; prefixIn = prefixOut; prefixOut = swap;
    var swap = srsIn; srsIn = srsOut; srsOut = swap;
  }
  var elem = document.getElementById(prefixIn+'X');
  var x = elem.value;
  var elem = document.getElementById(prefixIn+'Y');
  var y = elem.value;
  var elem = document.getElementById(prefixIn+'Z');
  var z = elem.value;
  args = {'CMD':'RunTransformationChain','srsIn':srsIn,'srsOut':srsOut,'x':x,'y':y,'z':z};
  var req = new jsonRequest_class('plugins/dai_services_2009.php',args);
  // response handler
  me = this;
  req.responseHandler = function(ans) {
    var poi = ans[srsOut];
    var elem = document.getElementById(prefixOut+'X');
    elem.value = poi[0];
    var elem = document.getElementById(prefixOut+'Y');
    elem.value = poi[1];
    var elem = document.getElementById(prefixOut+'Z');
    elem.value = poi[2];
    var elem = document.getElementById('SBA_PLUGINS_COORDTRANSF_LOG');
    var log = ['<i>Transformation log:'];
    for (var k in ans) {
      var xyz = ans[k][0]+','+ans[k][1]+','+ans[k][2];
      if (ans[k][3]) {
        xyz = '<a target="DAI_TRANSFORM_POI" href="'+ ans[k][3].replace(/&/g,'&amp;') +'">'+xyz+'</a>';
      }
      log.push(k+': (x,y,z) = ('+xyz+')');
    }
    log.push('</i>');
    elem.innerHTML = log.join('<br/>');
  }
  var elem = document.getElementById('SBA_PLUGINS_COORDTRANSF_LOG');
  elem.innerHTML = '<i>Running transformation chain...</i>';
  req.submit();
}

addmarkerPlugin_class.prototype.coordTransformHtml = function() {
  var a = [];
  if (this.template == 'WHS09' || this.template == 'WHS10') { 
    a.push('<p></p><b>Coordinate transformations provided by <a href="http://www.incf.org/core/programs/atlasing">INCF DAI</a></b><p></p>');
    if (this.srsInfo) {
      a.push('<table><tr>');
      a.push('<td colspan="3">Transform: <input type="button" value="&#9660; From WHS 1.0 &#9660;" onclick="sbaPluginManager.getPlugin(\'AddMarker\').doCoordTransform(1)"/><input type="button" value="&#9650; To WHS 1.0 &#9650;" onclick="sbaPluginManager.getPlugin(\'AddMarker\').doCoordTransform()"/></td>');
      a.push('</tr><tr><td colspan="3">Coord. space: <select style="width: 40ex" id="SBA_PLUGINS_COORDTRANSF_SRS" onchange="sbaPluginManager.getPlugin(\'AddMarker\').setCoordTransformSRS(this.selectedIndex)">');
      var srsNames = this.srsInfo.name;
      for (var k in srsNames) if (srsNames.hasOwnProperty(k)) {
        var name = srsNames[k];
        var descr = this.srsInfo.description[k];
        a.push('<option value="'+name+'">'+descr+' ('+name+')</option>');
      }
      a.push('</select></td></tr><tr>');
      a.push('<td colspan="3">XYZ-origin: <div class="inlineBlue" id="SBA_PLUGINS_COORDTRANSF_XYZORIGIN"></div></td>');
      a.push('</tr><tr><td>X: </td><td><input id="SBA_PLUGINS_COORDTRANSF_X" type="text"/></td><td><div class="inlineBlue" id="SBA_PLUGINS_COORDTRANSF_XLIM"></div></td>');
      a.push('</tr><tr>');
      a.push('<td>Y: </td><td><input id="SBA_PLUGINS_COORDTRANSF_Y" type="text"/></td><td><div class="inlineBlue" id="SBA_PLUGINS_COORDTRANSF_YLIM"></div></td>');
      a.push('</tr><tr>');
      a.push('<td>Z: </td><td><input id="SBA_PLUGINS_COORDTRANSF_Z" type="text"/></td><td><div class="inlineBlue" id="SBA_PLUGINS_COORDTRANSF_ZLIM"></div></td>');
      a.push('</tr></table>');
      a.push('<div id="SBA_PLUGINS_COORDTRANSF_LOG" style="width:100%; overflow:auto; white-space:nowrap; background: #DFD"></div>');
    }
  }
  return a.join('\n');
}