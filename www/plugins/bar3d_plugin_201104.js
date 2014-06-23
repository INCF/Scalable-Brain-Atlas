function bar3dPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = '3dSurface';
  this.template = sbaViewer.template;
  this.barAddress = "http://212.87.16.231:8080/";
}
bar3dPlugin_class.prototype = new sbaPlugin_class();

bar3dPlugin_class.prototype.barThumbnail = function(dataset,structName){
  return '<img src="'+this.barAddress+'getThumbnail?cafDatasetName='+dataset+'&amp;structureName='+structName+'"/>';
}

bar3dPlugin_class.prototype.barReconstruction = function(dataset, structName, quality, desc){
  var ans = '<a href="'+this.barAddress+'getReconstruction?cafDatasetName='+dataset;
  ans += '&amp;structureName='+structName+'&amp;qualityPreset='+quality;
  ans += '">'+desc+'</a>';
  return ans;
}

bar3dPlugin_class.prototype.barPreview = function(dataset,structName,desc){
  return '<a href="'+this.barAddress+'getPreview?cafDatasetName='+dataset+'&amp;structureName='+structName+'" target="_blank">'+desc+'<img src="../img/external.gif" style="border: 0px; vertical-align: bottom"/></a>';
}

bar3dPlugin_class.prototype.activate = function(sbaState,divElem) {
  // prepare request
  var acr = sbaState.acr;
  if (acr == undefined) return;
  //Assumption: no spaces at the beginning or end of the string
  //perhaps stripping is required
  acr = acr.replace(/ /g,'-');
  // We should customize dataset parameter to handle other templates. Any ideas?
  var dataset = 'sba_WHS10';
  
  // Getting strings with links to reconstructions in various quality and live
  // preview 
  var lqRec = this.barReconstruction(dataset, acr, 'low', 'low');
  var medRec = this.barReconstruction(dataset, acr, 'med', 'medium');
  var hiRec = this.barReconstruction(dataset, acr, 'high', 'high');
  var prev  = this.barPreview(dataset, acr, 'interactive preview');
  
  // Putting all together
  var ans = '3D surface reconstruction of region <b><i>'+acr+'</i></b>:';
  ans += '<div style="text-align:center">'+this.barThumbnail(dataset,acr)+'</div>';
  ans += 'Download surface data in VRML format in '+lqRec+', '+medRec+' or '+hiRec+' quality. ';
  ans += 'If your browser supports <a href="http://en.wikipedia.org/wiki/WebGL">WebGL</a>, try the '+prev+ ' of the model. <br/>';
  ans += 'Reconstructions created by the <a href="http://www.neuroinf.pl/Members/pmajka">3d Brain Atlas Reconstructor</a>.<p/>';
  ans += 'See also the <a href="../howto/analyze_templates_in_matlab.php">SBA Matlab interface</a>.'
  divElem.innerHTML = ans;
}

/*
bar3dPlugin_class.prototype.applyStateChange = function(newState,divElem) {
  // by default, this function calls the activate function
}
*/
