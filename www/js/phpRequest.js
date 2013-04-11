var PHP_REQUEST_DEBUG = 1;
var PHP_REQUEST_PATH = (document.location.host == 'vitellius.azn.nl' ? '/neuropi/cocomac2_gamma/public/phpRequest.php' : '/cocomac/cocomac2/public/phpRequest.php');

/*
 * phpRequestManager keeps a list of requests (jobs), 
 * and processes them in received order.
 */
function phpRequestManager_class() { 
  this.jobQueue = [];
  this.currentRequest = undefined;
  this.xmlhttp = this.new_xmlhttp();
  this.xmlhttp_sync = this.new_xmlhttp();
  var server = document.location.host;
  this.queryUrl = 'http://' +server+encodeURI(PHP_REQUEST_PATH);
  
// NEW:
//  var server = window.location.host;
//  var path = window.location.pathname.split('/');
//  this.queryUrl = 'http://' +server+path.slice(0,path.length-2).join('/')+'/public/phpRequest.php';
  
}

/* create xmlhttp request object */
phpRequestManager_class.prototype.new_xmlhttp = function() {
  var xmlhttp = false;
  /*@cc_on @*/
  /*@if (@_jscript_version >= 5)
  try {
    xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
    try {
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    } catch (E) {
      xmlhttp = false;
    }
  }
  @end @*/
  if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
    xmlhttp = new XMLHttpRequest();
  }
  if (!xmlhttp) alert('phpRequestManager: Failed to create XMLHttpRequest object.');
  return xmlhttp;
}

/* add job to jobQueue and try to run it immediately */
phpRequestManager_class.prototype.submitJob = function(req) {
  this.jobQueue.push(req);
  this.nextJob();
}

/* empty the jobQueue */
phpRequestManager_class.prototype.emptyQueue = function() {
  phpRequestManager.jobQueue = [];
}

/* run the next job, unless other jobs are in progress */
phpRequestManager_class.prototype.nextJob = function() {
  if (this.jobQueue.length<=0) return;
  if (this.xmlhttp.readyState == 0 || this.xmlhttp.readyState == 4) {
    this.currentRequest = this.jobQueue.shift();
    browser.pleaseWait(browser.documentBody());
    this.currentRequest.submitNow();
  }
  setTimeout('phpRequestManager.nextJob()',200);
}

/* instantiate the phpRequestManager */
phpRequestManager = new phpRequestManager_class();

/*
 * phpRequest class, used to send requests to php-server.
 * Works either in synchronous mode by calling submit_waitForResponse()
 * or in asynchronous mode by calling submit(), using the responseHandler.
 */
function phpRequest_class(lib_cmd,args,responseType) {
  if (lib_cmd != undefined) {
    this.queryParams = this.getQueryParams(lib_cmd,args);
    this.responseType = responseType;
  }
}

/* translate lib, cmd and args into uri_encoded string */
phpRequest_class.prototype.getQueryParams = function(lib_cmd,args) {
  var lib_cmd = lib_cmd.split('::');
  var lib = lib_cmd[0];
  var cmd = lib_cmd[1];
  if (!cmd) { return undefined; }
  var queryParams = 'LIB=' +lib+ '&CMD=' +cmd;
  // submit arguments as json_encoded string
  queryParams += '&ARGS=' + encodeURIComponent(json_encode(args));
  if (String(queryParams).length > 1000000) {
    throw('Query parameters exceed 1MB limit.');
  } 
  return queryParams;
}

/* display server error */
phpRequest_class.prototype.serverError = function(msg) {
  var wdw = top.phpRequestErrorLog;
  if (wdw == undefined) {
    alert('server error: '+(typeof msg == 'object' ? json_encode(msg) : msg));
    return;
  }
  if (typeof msg == 'object') {
    // attributes
    msg['<>'] = {'summary': json_encode(msg.errors)};
    var tree = wdw.myTreeManager.getTreeByName('phpRequestErrorLog');
    var nd = tree.contentNode('PHP Error Log').addChild(tree.newNode(msg),Date().toString());
    var elem = wdw.document.getElementById('phpRequestErrorLog');
    elem.innerHTML = tree.html();
  } else {
    wdw.window.document.body.innerHTML += json_encode(msg);
  }
  wdw.focus();
}

/* asynchronous request */
phpRequest_class.prototype.submit = function() {
  phpRequestManager.submitJob(this);
}

/* called by phpRequestManager when xmlhttp object is ready */
phpRequest_class.prototype.submitNow = function() {
  try {
    var queryUrl = phpRequestManager.queryUrl;
    var queryParams = this.queryParams;
    var xmlhttp = phpRequestManager.xmlhttp;
    xmlhttp.open("POST",phpRequestManager.queryUrl,true); // true means 'synchronous'
    xmlhttp.onreadystatechange = function() {
      var xmlhttp = phpRequestManager.xmlhttp;
      if (xmlhttp.readyState==4) {
        browser.pleaseWait();
        var req = phpRequestManager.currentRequest;
        if (xmlhttp.status==200) {
          var ans = req.getValidResponse(xmlhttp);
          req.responseHandler(ans);
        }
        else throw('query url: '+phpRequestManager.queryUrl+'; xmlhttp status code '+xmlhttp.status);
      }
    }
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send(queryParams);
    return true; // ok
  } catch(e) {
    if (PHP_REQUEST_DEBUG ) {
      alert('phpRequest.submit(async) error: ' +e+'\n\nQuery: \n'+unescape(queryUrl+'?'+queryParams)); 
    }
    return false;
  }
}

/* synchronous request */
phpRequest_class.prototype.submit_waitForResponse = function() {
  try {
    var queryUrl = phpRequestManager.queryUrl;
    var queryParams = this.queryParams;
    var xmlhttp = phpRequestManager.xmlhttp_sync;
    xmlhttp.open("POST",phpRequestManager.queryUrl,false); // false means 'not asynchronous'
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send(queryParams);
    return this.getValidResponse(xmlhttp);
  } catch(e) {
    if (PHP_REQUEST_DEBUG ) {
      alert('phpRequest.submit(sync) error: ' +e+'\n\nQuery: \n'+unescape(queryUrl+'?'+queryParams)); 
    }
  }
}

/* abort asynchronous request */
phpRequest_class.prototype.abort = function() {
  phpRequestManager.emptyQueue();
}

/* get response and check for errors */
phpRequest_class.prototype.getValidResponse = function(xmlhttp) {
  var responseType = xmlhttp.getResponseHeader('Content-type');
  var s = xmlhttp.responseText;
  // consider html response as error message, unless responseType html is specifically requested
  if (responseType.indexOf('text/html') >= 0 && this.responseType != 'text/html') {
    this.serverError(s);
    return undefined;
  }
  if (responseType.indexOf('application/json') >= 0) {
    eval('var ans='+s+';');
    if (typeof ans == 'object' && ans != null && ans['phpRequestError']) {
      this.serverError(ans['phpRequestError']);
      return undefined;
    }
    return ans;
  } else {
    return s;
  }
}

/* default response handler, to be overloaded */
phpRequest_class.prototype.responseHandler = function(ans) {
  alert('phpRequest received the following response:\n'+ans);
}

/* 
 * Function-oriented version of phpRequest_class,
 * using synchronous mode.
 *
 * response = module::command, arg1, arg2, ...
 */
function phpRequest(/* arguments */) {
  var lib_cmd = arguments[0];
  var args = [];
  var len = arguments.length;
  for (var i=1;i<len;i++) args.push(arguments[i]);
  var req = new phpRequest_class(lib_cmd,args);
  return req.submit_waitForResponse();
}

/*
 * phpSubmit class, used to send requests to php-server,
 * by using a hidden IFrame.
 * Useful for uploading files to the server.
 * Can only receive html-response.
 */

function phpSubmit_class(lib_cmd,args) {
  var lib_cmd = lib_cmd.split('::');
  this.lib = lib_cmd[0];
  this.cmd = lib_cmd[1];
  this.args = args;
}

/* default response handler, to be overloaded */
phpSubmit_class.prototype.responseHandler = function(ans) {
  alert('phpSubmit received the following response:\n'+ans);
}

/* submit immediately */ 
phpSubmit_class.prototype.submit = function(formElem) {
  function hiddenInput(formElem,name,value) {
    var inp = document.createElement('INPUT');
    inp.type='hidden';
    inp.name = name;
    inp.value = value;
    formElem.appendChild(inp);
  }
  hiddenInput(formElem,'LIB',this.lib);
  hiddenInput(formElem,'CMD',this.cmd);
  hiddenInput(formElem,'METHOD','phpSubmit');
  hiddenInput(formElem,'ARGS',json_encode(this.args));
  formElem.action = PHP_REQUEST_PATH; //.replace('.php','.html');
  formElem.method = "post";
  formElem.enctype = "multipart/form-data";
  formElem.target = 'PHPSUBMIT_IFRAME'; 
  var iframeElem = browser.getFrame('PHPSUBMIT_IFRAME'); 
  if (iframeElem == undefined) {
    iframeElem = document.createElement('IFRAME');
    iframeElem.id = iframeElem.name = 'PHPSUBMIT_IFRAME';
    iframeElem.src = "about:blank";
    iframeElem.style.display = "none";
    browser.documentBody().appendChild(iframeElem);
  }
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
  formElem.submit();
}
