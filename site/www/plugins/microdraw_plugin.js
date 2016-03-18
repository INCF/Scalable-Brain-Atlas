function microdrawPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'Microdraw';
}
microdrawPlugin_class.prototype = new sbaPlugin_class();

microdrawPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var templateName = CONFIG.templateName
  for (var k in CONFIG.superzoom) break
  var src = CONFIG.superzoom[k].source
  for (var pos = src.length-1; pos>0; pos--)
      if (src.charAt(pos)=='/') { src = src.substr(0,pos); break }
  var a = 'Annotate the high resolution '+k+' slices of the '+templateName+' with the <a href="http://siphonophore.org/microdraw/microdraw.html?source=http://scalablebrainatlas.incf.org/templates/'+sbaViewer.template+'/'+src+'/microdraw.jsonp">microdraw online atlas editor</a>.'
  divElem.innerHTML = a
}

microdrawPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
}
