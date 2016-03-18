// rgb2acr: simple mapping from RGB color to region acronym, implies acr2rgb
// acr2parent: contains for each acronym the name of its parent acronym, this defines the hierarchy
// acr2full: as before
// 
// So
// . acr2full needs to cover all acronyms used in the hierarchy
// . every rgb corresponds to an acronym, but not every acronym has an rgb
// . every acr has a parent, if not it is a child of root


regionNode_class = function(acr,parent) {
  this.acr = String(acr);
  if (parent != undefined) this.parent = parent;
  this.children = [];
}

regionNode_class.prototype.parent = undefined;

regionNode_class.prototype.setParent = function(parentNode) {
  if (this.parent != undefined && this.parent.acr != 'ROOT') alert('Error in regionNode_class.setParent(): parent '+this.parent.acr+' already set for node '+this.acr);
  this.parent = parentNode;
}

regionNode_class.prototype.addChild = function(node) {
  this.children.push(node);
}

regionNode_class.prototype.asNestedArray = function(acr2full,minViewable,nestedArray,depth) {
  if (nestedArray == undefined) {
    if (minViewable == undefined) minViewable = 0;
    depth = 0;
    nestedArray = [];
  }
  if (depth>32) return;
  var viewable = this.isViewable();
  nestedArray['<>'] = {};
  var acr_lc = this.acr.toLowerCase();
  nestedArray['<>']['acr_lc'] = acr_lc.replace(/(\d+)/,function($1) { return ($1<10 ? '0'+$1 : $1) });
  nestedArray['<>']['sortby'] = 'acr_lc';
  var fullName = acr2full[this.acr];
  if (fullName == undefined) fullName = '';
  else if (fullName == this.acr) fullName = '';
  else fullName = ' : '+fullName;
  var label = this.acr + fullName + (viewable ? ' <a href="javascript:void(0)" class="rgb" onclick="selectRegion(\''+this.acr.replace("'","\\'")+'\')">[view]</a>' : '');
  if (this.nn != undefined) {
    label += ' <a class="nn" href="javascript:void(0)" onclick="goBrainInfo(\''+this.nn+'\')">[NN]</a>'; 
  }
  nestedArray['<>']['label'] = label;
  var ch = this.children;
  for (var k in ch) if (ch.hasOwnProperty(k)) {
    if (ch[k].numViewable >= minViewable) {
      var acr = ch[k].acr;
      nestedArray[acr] = [];
      ch[k].asNestedArray(acr2full,minViewable,nestedArray[acr],depth+1);
    }
  }
  if (depth == 0) {
    nestedArray['<>']['label'] = 'Brain region hierarchy';
    nestedArray['<>']['tag'] = 'myTree';
    nestedArray['<>']['collapse'] = false;
    return nestedArray;
  }
}

regionNode_class.prototype.isViewable = function(depth) {
  return (this.numViewable>0);
}

regionNode_class.prototype.countViewable = function(depth) {
  if (depth == undefined) depth=0;
  if (depth>20) return 0;
  var numViewable = 0;
  if (this.rgb != undefined) numViewable++;
  var ch = this.children;
  for (var k in ch) if (ch.hasOwnProperty(k)) {
    numViewable += ch[k].countViewable(depth+1);
  }
  this.numViewable = numViewable;
  return numViewable;
}

regionNode_class.prototype.rgbRegions = function(rgbList,depth) {
  if (rgbList == undefined) {
    depth = 0;
    rgbList = [];
  }
  if (depth>20) return;
  if (this.rgb != undefined) rgbList.push(this.rgb);
  var ch = this.children;
  for (var k in ch) if (ch.hasOwnProperty(k)) {
    ch[k].rgbRegions(rgbList,depth+1);
  }
  if (depth == 0) return rgbList;
}

regionTree_class = function(acr2parent,rgb2acr,brainRegions,acr2nn,orphanParentAcr) {
  this.regionList = {};
  this.rootNode = new regionNode_class('ROOT',undefined);
  var acr2rgb = {};
  
  // create hierarchy
  for (var k in acr2parent) {
    var parentAcr = acr2parent[k];
    if (parentAcr == k) continue;
    var parentNode = this.regionList[parentAcr];
    if (parentNode == undefined) {
      parentNode = this.newNode(parentAcr,this.rootNode);
    }
    var node = this.regionList[k];
    if (node == undefined) {
      node = this.newNode(k,parentNode);
    } else {
      node.setParent(parentNode);
    }
    parentNode.addChild(node);
  }

  // add rgb patterns
  for (var rgb in rgb2acr) {
    var acr = rgb2acr[rgb];
    var node = this.regionList[acr];
    if (node == undefined) {
      node = this.newNode(acr,this.rootNode);
    }
    // is the node really viewable?
    var slices = brainRegions[rgb];
    if (slices != undefined) {
      node.rgb=rgb;
    }
  }
  
  // add neuronameIDs
  if (acr2nn != undefined) {
    for (var acr in acr2nn) {
      var nn = acr2nn[acr];
      var node = this.regionList[acr];
      if (node == undefined) {
        node = this.newNode(acr,this.rootNode);
      }
      node.nn = nn;
    }
  }

  var orphanParent;
  for (var k in this.regionList) {
    var node = this.regionList[k];
    if (node == this.rootNode) continue;
    if (node.parent == this.rootNode) {
      // node is an orphan: has no parent
      if (node.children.length == 0) {
        // node also has no children
        if (orphanParentAcr) {
          orphanParent = this.regionList[orphanParentAcr];
          if (orphanParent == undefined) {
            orphanParent = this.newNode(orphanParentAcr,this.rootNode);
            this.rootNode.addChild(orphanParent);
          }
          node.parent = orphanParent;
        }
      }
      node.parent.addChild(node);
    }
  }
  
  // calculate number of viewable children
  this.rootNode.countViewable();
}

regionTree_class.prototype.newNode = function(acr,parent) {
  var node = new regionNode_class(acr,parent);
  this.regionList[acr] = node;
  return node;
}
