function regiontreePlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.acr = null;
  this.slice = null;
  var nestedArray = sbaViewer.regionTree.rootNode.asNestedArray(ACR_TO_FULL,1);
  this.myRegionTree = new myTree_class('regionTree',nestedArray);
}
regiontreePlugin_class.prototype = new sbaPlugin_class();

regiontreePlugin_class.prototype.activate = function(sbaViewer,divElem) {
  if (this.query == 'slice') {
    var rgbList = sbaViewer.getRgbList(sbaViewer.currentAcr);
    var a = [];
    var regions = [];
    // future: special sort routine as used in hierarchy
    var s0 = sbaViewer.currentSlice-1;
    for (var r in BRAIN_SLICES[s0]) {
      var a_r = RGB_TO_ACR[r];
      regions.push(BS_SUGGESTIONS[a_r] ? BS_SUGGESTIONS[a_r].toLowerCase()+r : r);
    }
    regions.sort();    
    for (var i=0; i<regions.length; i++) { 
      var r = regions[i].substr(regions[i].length-6);
      var a_r = RGB_TO_ACR[r];
      var regionName = (BS_SUGGESTIONS[a_r] ? BS_SUGGESTIONS[a_r] : a_r+' : #'+regions[i]);
      a.push('<li id="REGIONTREE_region_'+r+'" onclick="sbaViewer.toggleRegion(\''+escB(a_r)+'\')" onmouseover="sbaViewer.mouseoverAcronym(\''+r+'\')">'+regionName+'</li>'); 
    }
    divElem.innerHTML = '<ul class="sitelist">'+a.join('')+'</ul>'; 
  } else {
    divElem.innerHTML = this.myRegionTree.html();
    this.applyStateChange(sbaViewer,divElem);
  }
  this.acr = sbaViewer.currentAcr;
  this.slice = sbaViewer.currentSlice;
}

regiontreePlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  if (this.query == 'slice') {
    var newSlice = sbaViewer.currentSlice;
    if (newSlice != this.slice) {
      this.activate(sbaViewer,divElem);
    }
  } else {
    var newAcr = sbaViewer.currentAcr;
    if (newAcr != this.acr) {
      var node = this.myRegionTree.contentRoot.getNodeByKey(newAcr);
      if (node != undefined) {
        node.toggleIntoView();
      }
      this.acr = newAcr;
    }
  }
}

/*
sbaViewer_class.prototype.updateRegionTree = function(acr) {
  var node = this.myRegionTree.contentRoot.getNodeByKey(acr);
  if (node != undefined) {
    node.toggleIntoView();
  }
}

pluginWindow activates/deactivates windows.
onActivate: showthe region tree
applyStateChange: update if necessary
*/
