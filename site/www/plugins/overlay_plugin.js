function overlayPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'Overlay';
  this.template = sbaViewer.template;
  this.currentOverlay = undefined;
}
overlayPlugin_class.prototype = new sbaPlugin_class();

overlayPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var ok = sbaViewer.overlayKey;
  var anchorBox;
  if (ok) {
    anchorBox = sbaViewer.overlays[ok].anchorBox;
  }
  if (!anchorBox) {
    anchorBox = sbaViewer.sliceCoordFrame;
  }
  var ans = 'Left: <input type="text" value="'+anchorBox[0]+'" onchange="sbaPluginManager.getPlugin(\'overlay\').changeAnchorBox(this,0)"/>';
  ans += 'Top: <input type="text" value="'+anchorBox[1]+'" onchange="sbaPluginManager.getPlugin(\'overlay\').changeAnchorBox(this,1)"/>';
  ans += 'Width: <input type="text" value="'+anchorBox[2]+'" onchange="sbaPluginManager.getPlugin(\'overlay\').changeAnchorBox(this,2)"/>';
  ans += 'Height: <input type="text" value="'+anchorBox[3]+'" onchange="sbaPluginManager.getPlugin(\'overlay\').changeAnchorBox(this,3)"/>';
  ans += '<div id="SBA_PLUGINS_OVERLAY_ANCHORBOX">Select an overlay in the 2D slice view panel</div>';
  divElem.innerHTML = ans;
}

overlayPlugin_class.prototype.showAnchorBox = function(sbaViewer) {
  var elem = document.getElementById('SBA_PLUGINS_OVERLAY_ANCHORBOX');
  var ok = this.currentOverlay;
  if (elem && ok) {
    var anchorBox = sbaViewer.overlays[ok].anchorBox;
    if (!anchorBox) anchorBox = sbaViewer.sliceCoordFrame;
    elem.innerHTML = sbaViewer.overlays[ok].anchorBox.join(',');
  }
}

overlayPlugin_class.prototype.changeAnchorBox = function(elem,idx) {
  var ok = sbaViewer.overlayKey;
  if (ok) {
    sbaViewer.overlays[ok].anchorBox[idx] = elem.value;
  }
  this.showAnchorBox(sbaViewer);
}

overlayPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  var ok = sbaViewer.overlayKey;
  if  (this.currentOverlay != ok) {
    this.currentOverlay = ok;
    this.activate(sbaViewer,divElem);
  }
  this.showAnchorBox(sbaViewer);
}
