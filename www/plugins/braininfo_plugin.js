function braininfoPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
}
braininfoPlugin_class.prototype = new sbaPlugin_class();

braininfoPlugin_class.prototype.externalLink = function(sbaState) {
  if (sbaState == undefined) return true;
  else return 'http://braininfo.rprc.washington.edu/Search.aspx?searchstring='+encodeURIComponent(sbaState.acr)+'&fromwhere=scalablebrainatlas';
}
