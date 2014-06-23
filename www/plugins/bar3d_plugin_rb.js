function bar3dPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,['3dViewer']);
  this.template = sbaViewer.template;
}
bar3dPlugin_class.prototype = new sbaPlugin_class();

bar3dPlugin_class.prototype.activate = function(sbaState,divElem) {
  // prepare request
  var acr = sbaState.acr;
  var ans = '<div><img src="http://212.87.16.231:8080/getThumbnail?cafDatasetName=sba_WHS10&amp;structureName='+acr+'"/></div>';
  ans += 'Download <a href="http://212.87.16.231:8080/getReconstruction?cafDatasetName=sba_WHS10&amp;structureName=amygdala">surface data in VRML format</a>.<br/>';
  ans += 'Created by the <a href="http://neuroinf.pl/Members/pmajka/">3d Brain Atlas Reconstructor</a>.<p/>';
  ans += 'See also: <a href="../howto/analyze_templates_in_matlab.php">Matlab interface</a> to region volumes.'
  divElem.innerHTML = ans;
  
}

/*
default applyStateChange:
bar3dPlugin_class.prototype.applyStateChange = function(newState,divElem) {
  this.activate(newState,divElem);
}
*/
