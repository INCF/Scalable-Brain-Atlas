function neurolexPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.template = sbaViewer.template;
  this.acr2nlxid = undefined;

  var args = {};
  args.template = this.template;
  args.jsonfile = 'acr2nlxid';
  var req = new jsonRequest_class('services/loadjson.php',args);

  // response handler
  var me = this;
  req.responseHandler = function(ans) {
    me.acr2nlxid = eval(ans);
  }
  req.submit();
}
neurolexPlugin_class.prototype = new sbaPlugin_class();

neurolexPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  if (this.acr2nlxid == undefined) {
    divElem.innerHTML = 'The NeuroLex plugin is still loading. Try again.';
  }
  
  // prepare request
  var acr = sbaViewer.currentAcr;
  if (acr == undefined) return;

  var args = {};
  args.region = '('+this.template+')-'+acr;
  var nlxid = this.acr2nlxid[acr];
  if (nlxid == undefined) {
    divElem.innerHTML = 'Region '+acr+' hasn\'t been mapped to NeuroLex';
    return;
  }
  args.nlxid = (isNaN(parseInt(nlxid)) ? nlxid : 'nlx_br_'+nlxid);
  var req = new jsonRequest_class('plugins/neurolex_request.php',args);
  req.responseHandler = function(ans) {
    if (typeof ans == 'object') {
      var neurolexTree = new myTree_class('neurolexInfo',ans);
      divElem.innerHTML = neurolexTree.html();
    } else {
      divElem.innerHTML = ans;
    }
  }
  req.submit();
  this.currentAcr = acr;
}

neurolexPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  // only update if necessary
  if (this.currentAcr != sbaViewer.currentAcr) this.activate(sbaViewer,divElem);
}

