function braininfoPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'BrainInfo';
}
braininfoPlugin_class.prototype = new sbaPlugin_class();

braininfoPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var args = {};
  var req = new jsonRPC_class('neuronames/neuronames_data.php',args);
  var me = this;
  req.responseHandler = function(ans) {
    for (var k in ans) {
      me[k] = ans[k];
    }
    me.render();
  }
  req.submit();
  this.applyStateChange(sbaViewer,divElem);
}

braininfoPlugin_class.prototype.onclick = function(href) {
  if (this.searchWindow) {
    this.searchWindow.location = href;
    if (window.focus) this.searchWindow.focus();
  } else {
    this.searchWindow = window.open(href);
  }
  this.render();
}

braininfoPlugin_class.prototype.render = function() {
  var reuse = (this.searchWindow != undefined);
  var acr = this.state.acr;
  var full = ACR_TO_FULL[this.state.acr];
  var a = [];
  var href;
  if (this.acr2id) {
    var biid = this.acr2id[acr];
    if (biid !== undefined) {
      href = this.id2url[biid];
      if (!href) href = this.id2url['@root']+biid;
      a.push('BrainInfo: <a href="javascript:sbaPluginManager.getPlugin(\'braininfo\').onclick(\''+href+'\')">Exact match for acronym "'+acr+'"</a>'+(reuse ? '(reuses window)':'')+'<br/>');
    }
  }
  if (!href) a.push('No exact match for acronym "'+acr+'".<br/>');
  a.push('<br/>Alternative search options:<br/><br/>');
  href = 'http://braininfo.rprc.washington.edu/Search.aspx?searchstring='+encodeURIComponent(acr)+'&amp;fromwhere=scalablebrainatlas';
  a.push('BrainInfo: <a href="javascript:sbaPluginManager.getPlugin(\'braininfo\').onclick(\''+href+'\')">Search for acronym "'+acr+'"</a>'+(reuse ? '(reuses window)':'')+'<br/>');
  var href = 'http://braininfo.rprc.washington.edu/Search.aspx?searchstring='+encodeURIComponent(full)+'&amp;fromwhere=scalablebrainatlas';
  a.push('BrainInfo: <a href="javascript:sbaPluginManager.getPlugin(\'braininfo\').onclick(\''+href+'\')">Search for full name "'+full+'"</a>'+(reuse ? '(reuses window)':'')+'<br/>');
  document.getElementById(this.divElemId).innerHTML = a.join('');
}

braininfoPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  this.state = sbaViewer.getState();
  this.divElemId = divElem.id;
  this.render();
}

/*
braininfoPlugin_class.prototype.externalLink = function(sbaState) {
  if (sbaState == undefined) return true;
  else return 'http://braininfo.rprc.washington.edu/Search.aspx?searchstring='+encodeURIComponent(sbaState.acr)+'&fromwhere=scalablebrainatlas';
}
*/