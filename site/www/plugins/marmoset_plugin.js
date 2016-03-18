/*
 * Plugins are loaded after the global sbaViewer object has been 
 * initialized, see ../js/sba_viewer.js for available methods of 
 * the sbaViewer_class
 */

// Plugin constructor.
// Replace example by your own plugin name, in lowercase.
function marmosetPlugin_class(name,sbaViewer) {
  // JavaScript's way to call parent constructor
  sbaPlugin_class.apply(this,[name]); 
  this.niceName = 'Marmoset';
  // store the atlas template name (e.g. PHT00) in this.template
  this.template = sbaViewer.template; 
}
// JavaScript's way to create a derived class
marmosetPlugin_class.prototype = new sbaPlugin_class();

// Called when plugin is shown for the first time
marmosetPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var sbaState = sbaViewer.getState();
  var ans = '<p><i>This plugin requires a (free) account at <a href="http://marmoset-brain.org">marmoset-brain.org</a></i></p><p>Marmoset-brain.org provides slice images at zoomable, microscopic resolution.</p><p style="padding: 2px; border: 1px solid #AAA; background: #EEE">List of <a href="http://marmoset-brain.org/main/image_database/common_marmoset/adult_brains/Marmoset_03">available modalities</a> and direct link to the current slice';
  var slice = sbaState.slice;
  slice = (slice < 10 ? '0'+slice : ''+slice);
  var base = 'http://marmoset-brain.org/main/image_database/common_marmoset/adult_brains/Marmoset_03';
  var table = [];
  var modalities = [
    ["Nissl","Ni-a","Nissl"],
    ["NisslWithGrid","Ni-G","Nissl with grid"],
    ["NisslWithTerms","Ni-a","Nissl with terms"],
    ["AChE","AchE-a","AcetylCholine Esterase"],
    ["NADPHd","NADPH-a","NADPH-diaphorase"],
    ["SMI-32","SMI32-a","SMI-32"],
    ["TH","TH-a","Tyrosine Hydroxylase"],
    ["PV","Pv-a","Parvalbumin"],
    ["Calbindin","Cb-a","Calbindin-D28K"],
    ["Cr","Cr-a","Calretinin"]
  ];
  var revealsWhat = {
    "SMI-32": "somata, dendrites and some thick axons"
  }
  for (var i=0; i<modalities.length; i++) {
    var mi = modalities[i];
    var link = base+'/'+mi[0]+'/MaSTD3-'+slice+'0-'+mi[1]+'.html';
    table.push(mi[2]+'</td><td><a target="marmoset_org" href="'+link+'">'+mi[1]+', slice '+slice+'</a>');
  }
  ans += '<table class="fancy" style="width:100%"><tr><th>Modality</th><th>Link</th></tr><tr><td>'+table.join('</td></tr><tr><td>')+'</td></tr></table></p>';
  divElem.innerHTML = ans;
}

/*
// Called whenever the state of the SBA has changed
marmosetPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  // by default, this function calls the activate function,
  // so you only need to define it when needed for improved efficiency.
}
*/
