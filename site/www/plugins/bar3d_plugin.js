//create String.trim method if necessary
if (typeof(String.prototype.trim) === "undefined")
{
  String.prototype.trim = function() 
  {
    return String(this).replace(/^\s+|\s+$/g, '');
  }
}

function bar3dPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = '3dBAR';
  this.template = sbaViewer.template;
  this.barAddress = "http://service.3dbar.org/";
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

bar3dPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  // prepare request
  var acr = sbaViewer.currentAcr;
  if (acr == undefined) return;
  var template_lc = this.template.toLowerCase();
  if (template_lc=='whs12') {
    acr = ACR_TO_FULL[acr];
  }
  var acrshow = acr.trim()

  /*
  if (this.template == 'PHT00')
  { //    replaceMap = [('(', 'OpParen'),
    //                  (')', 'ClParen'),
    //                  ('$', 'Dollar'),
    //                  ('/', 'Slash'),
    //                  ('\\', 'Backslash'),                                    
    //                  ('+', 'Plus'),
    //                  ('-', ' '),
    //                  ('\'', 'Prime')] 
    //acr = acr.replace(/[\(\)\$\/\'\+\-]/g, ' ');
    //acr = acr.replace(/[\x28\x29\x24\x2F\x27\x2B\x2D]/g, ' ');
    acr = acr.replace(/\x24/g, 'Dollar');
    acr = acr.replace(/\x27/g, 'Prime');
    acr = acr.replace(/\x28/g, 'OpParen');
    acr = acr.replace(/\x29/g, 'ClParen');
    acr = acr.replace(/\x2B/g, 'Plus');
    acr = acr.replace(/\x2D/g, ' ');
    acr = acr.replace(/\x2F/g, 'Slash');
    acr = acr.replace(/\x5C/g, 'Backslash');
  }
  */
  acr = acr.trim();
  acr = acr.replace(/ /g,'-');
  var dataset = 'sba_' +this.template;
  if (template_lc=='aba07') dataset = 'aba';
  if (template_lc=='aba12') dataset = 'aba2011';
  if (template_lc=='whs11') dataset = 'whs_0.6.2';
  if (template_lc=='whs12') dataset = 'whs_0.6.2';
  if (template_lc=='pwprt12') dataset = 'mbisc_11';
  if (template_lc=='opsm14') dataset = 'pos_0.1';
  if (template_lc=='cbwj13_age_p80') dataset = 'CBWJ13_P80';
  
  // Getting strings with links to reconstructions in various quality and live
  // preview 
  var lqRec = this.barReconstruction(dataset, acr, 'low', 'low');
  var hiRec = this.barReconstruction(dataset, acr, 'high', 'high');
  var prev  = this.barPreview(dataset, acr, 'interactive preview');
  
  // Putting all together
  var ans = '3D surface reconstruction of region <b><i>'+acrshow+'</i></b>:';
  ans += '<div style="text-align:center">'+this.barThumbnail(dataset,acr)+'</div>';
  ans += 'Download surface data in VRML format in '+lqRec+' or '+hiRec+' quality. ';
  ans += 'If your browser supports <a href="http://en.wikipedia.org/wiki/WebGL">WebGL</a>, try the '+prev+ ' of the model. <br/>';
  ans += 'Reconstructions created by the <a href="http://www.3dbar.org">3d Brain Atlas Reconstructor</a>.<p/>';
  ans += 'See also the <a href="../howto/analyze_templates_in_matlab.php">SBA Matlab interface</a>.'
  divElem.innerHTML = ans;
  this.currentAcr = acr;
}

bar3dPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  // only update if necessary
  if (this.currentAcr != sbaViewer.currentAcr) this.activate(sbaViewer,divElem);
}
