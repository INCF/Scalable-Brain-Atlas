/*
 * Plugins are loaded after the global sbaViewer object has been 
 * initialized, see ../js/sba_viewer.js for available methods of 
 * the sbaViewer_class
 */

// Plugin constructor.
// Replace example by your own plugin name, in lowercase.
function examplePlugin_class(name,sbaViewer) {
  // JavaScript's way to call parent constructor
  sbaPlugin_class.apply(this,[name]); 
  this.niceName = 'myExample';
  // store the atlas template name (e.g. PHT00) in this.template
  this.template = sbaViewer.template; 
}
// JavaScript's way to create a derived class
examplePlugin_class.prototype = new sbaPlugin_class();

// Called when plugin is shown for the first time
examplePlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var sbaState = sbaViewer.getState();
  divElem.innerHTML = 'HELLO WORLD<pre>'+json_encode(sbaState)+'</pre>';
}

/*
// Called whenever the state of the SBA has changed
examplePlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  // by default, this function calls the activate function,
  // so you only need to define it when needed for improved efficiency.
}
*/
