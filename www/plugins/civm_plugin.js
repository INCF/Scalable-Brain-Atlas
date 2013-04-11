function civmPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'ImageViewer';
}
civmPlugin_class.prototype = new sbaPlugin_class();

civmPlugin_class.prototype.login = function(formAction,args,divElem) {
  function hiddenInput(formElem,name,value) {
    var inp = document.createElement('input');
    inp.type = 'hidden';
    inp.name = name;
    inp.value = value;
    formElem.appendChild(inp);
  }

  var formElem = document.createElement('form');
  for (var k in args) {
    hiddenInput(formElem,k,args[k]);
  }
  formElem.action = formAction;
  formElem.method = 'post';  
  //formElem.enctype = 'multipart/form-data';
  formElem.target = 'CIVM_HIDDEN_IFRAME'; 
  divElem.appendChild(formElem);  
  
  var iframeElem = browser.getFrame('CIVM_HIDDEN_IFRAME'); 
  if (iframeElem == undefined) {
    iframeElem = document.createElement('iframe');
    iframeElem.id = iframeElem.name = 'CIVM_HIDDEN_IFRAME';
    iframeElem.src = "about:blank";
    iframeElem.style.display = "none";
    divElem.appendChild(iframeElem);
  }
  iframeElem.onload = null;

  formElem.submit();
}

civmPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var args = {
    "username": "civmpub",
    "password": "civmpub"
  };
  this.login("https://civmvoxport.duhs.duke.edu/voxbase/login.php?return_url=%2Fvoxbase%2Fstudyhome.php%3Fstudyid%3D132",args,browser.documentBody());
  this.applyStateChange(sbaViewer,divElem);
}

civmPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  var a = [];
  a.push('The overlay images on the Scalable Brain Atlas are highly compressed.');
  a.push('<br/>Full resolution images are available at the<br/>Duke Center for In Vivo Microscopy (CIVM): ');
  a.push('<br/><a target="CIVM_VIEWER" href="http://civmvoxport.duhs.duke.edu/voxbase/preview.php?tid=B&amp;studyid=132&amp;datasetid=8960">MRI-T1</a> (opens new/existing window)');
  a.push('<br/><a target="CIVM_VIEWER" href="http://civmvoxport.duhs.duke.edu/voxbase/preview.php?tid=B&amp;studyid=132&amp;datasetid=8962">MRI-T2</a> (opens new/existing window)');
  a.push('<br/><a target="CIVM_VIEWER" href="http://civmvoxport.duhs.duke.edu/voxbase/preview.php?tid=B&amp;studyid=132&amp;datasetid=8961">MRI-T2*</a> (opens new/existing window)');
  a.push('<br/><a target="CIVM_VIEWER" href="http://civmvoxport.duhs.duke.edu/voxbase/preview.php?tid=B&amp;studyid=132&amp;datasetid=10622">Nissl stain</a> (opens new/existing window)');
  divElem.innerHTML = a.join('\n');
}
