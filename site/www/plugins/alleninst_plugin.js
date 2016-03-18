function alleninstPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'AllenAtlas';
}
alleninstPlugin_class.prototype = new sbaPlugin_class();

alleninstPlugin_class.prototype.externalLink = function(sbaState) {
  if (sbaState == undefined) return true;
  //else return 'http://mouse.brain-map.org/viewImage.do?imageId='+encodeURIComponent(+131008-parseInt(sbaState.slice));
  else return 'http://mouse.brain-map.org/viewImage.do?imageId='+encodeURIComponent(+130879+parseInt((sbaState.origSlice-3)/4));
}
