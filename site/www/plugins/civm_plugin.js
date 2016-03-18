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
  
  if (sbaViewer.template == 'CBWJ13_age_P80') {
    var studyid = 208;
    var return_url = '%2Fvoxbase%2Fstudyhome.php%3Fstudyid%3D214%26supplement_redirect%3D208';
    var datasets = {
      "11953":"GRE"
    }
  } else {
    var studyid = 132;
    var return_url = '%2Fvoxbase%2Fstudyhome.php%3Fstudyid%3D132';
    var datasets = {
      "8960":"MRI-T1",
      "8962":"MRI-T2",
      "8961":"MRI-T2*",
      "10622":"Nissl stain"
    }
  }
  this.login('https://civmvoxport.duhs.duke.edu/voxbase/login.php?return_url='+return_url,args,browser.documentBody());
  var a = [];
  a.push('The overlay images on the Scalable Brain Atlas are compressed.');
  a.push('<br/>Full resolution images are available at the<br/>Duke Center for In Vivo Microscopy (CIVM).');
  a.push('<br/>Download NIFTI files from the <a href="http://civmvoxport.duhs.duke.edu/voxbase/studyhome.php?studyid=132">overview page</a>,<br/>or view the data directly:');
  
  for (var k in datasets) {
    a.push('<br/><a target="CIVM_VIEWER" href="http://civmvoxport.duhs.duke.edu/voxbase/preview.php?tid=B&amp;studyid='+studyid+'&amp;datasetid='+k+'">'+datasets[k]+'</a> (opens new/existing window)');
  }
  divElem.innerHTML = a.join('\n');
}

civmPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
}
