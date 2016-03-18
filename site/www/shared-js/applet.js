function applet_class(callerUrl,method,expectedContentType) {
  var i = callerUrl.indexOf('?');
  this.callerUrl = i>0 ? callerUrl.substr(0,i) : callerUrl;
  this.method = (method != undefined ? method.toUpperCase() : 'POST');
  this.expectedContentType = expectedContentType;
}

applet_class.prototype.responseHandler = function(ans,resultElemId) {
  browser.pleaseWait();
  alert(ans);
}

/* submit immediately */ 
applet_class.prototype.submitForm = function(formElemId,resultElemId,feedbackElemId) {
  function hiddenInput(formElem,name,value) {
    var inp = document.createElement('input');
    inp.type='hidden';
    inp.name = name;
    if (value != null) inp.value = value;
    return formElem.appendChild(inp);
  }
  
  formElem = document.getElementById(formElemId);
  if (formElem == undefined) {
    alert('ERROR: formElem '+formElemId+' not defined');
  }
  //// var contentTypeElem = hiddenInput(formElem,'Content-type','text/html');
  formElem.action = this.callerUrl;
  var directLink = false;
  if (this.method == 'GET') {
    var inputs = formElem.elements;
    var query = [];
    for (var i=0; i<inputs.length; i++) {
      var inp = inputs[i];
      if (inp.type != 'button') {
        if (inp.type == 'checkbox' && !inp.checked) continue;
        query.push(inp.name+'='+encodeURIComponent(inp.value));
      }
    }
    directLink = this.callerUrl+'?'+query.join('&');
    // fall back to POST for very long queries
    if (directLink.length>2000) {
      this.method = 'POST';
      directLink = '';
    }
  }
  formElem.method = this.method;
  // formElem.accept = 'multipart/form-data';
  if (resultElemId != undefined) {
    var resultElem = document.getElementById(resultElemId);
    var iframeElem = (resultElem.tagName.toLowerCase() == 'iframe' ? resultElem : browser.getFrame('PHPSUBMIT_IFRAME')); 
    if (iframeElem == undefined) {
      iframeElem = document.createElement('iframe');
      iframeElem.id = iframeElem.name = 'PHPSUBMIT_IFRAME';
      iframeElem.src = 'about:blank';
      iframeElem.style.display = 'none';
      browser.documentBody().appendChild(iframeElem);
    }
    if (resultElem != iframeElem) {  
      // capture the result for further processing
      me = this;
      iframeElem.onload = function() {
        browser.pleaseWait(); // switch off
        var s = browser.documentBody(this).innerHTML;
        try {
          eval('var ans='+s+';');
          me.responseHandler(ans);
        } catch (e) {
          alert(s);
        }

      }
      browser.pleaseWait(browser.documentBody());
    }
    formElem.target = iframeElem.name = iframeElem.id;
  }
  formElem.submit();

  // remove hidden children from form
  //// formElem.removeChild(contentTypeElem);
  //// formElem.removeChild(submitElem);

  if (feedbackElemId && directLink !== false) {
    var elem = document.getElementById(feedbackElemId);
    if (directLink === '') {
      elem.innerHTML = 'Direct link: not available, link too long.';
    } else {
      var linkText = (directLink.length<=400 ? directLink : 'click here (long link)');
      elem.innerHTML = 'Direct link: <a href="'+directLink+'">'+linkText+'</a>';
    }
  }
}
