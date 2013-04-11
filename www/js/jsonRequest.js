var JSON_REQUEST_DEBUG = 1;

/*
 * jsonRequestManager keeps a list of requests (jobs), 
 * and processes them in received order.
 */
function jsonRequestManager_class() { 
  this.jobQueue = [];
  this.currentRequest = undefined;
  this.xmlhttp = this.new_xmlhttp();
  var server = window.location.host;
  var path = window.location.pathname.split('/');
  this.queryUrl = 'http://' +server+path.slice(0,path.length-2).join('/')+'/';
}

/* create xmlhttp request object */
jsonRequestManager_class.prototype.new_xmlhttp = function() {
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
  if (!xmlhttp) alert('jsonRequestManager: Failed to create XMLHttpRequest object.');
  return xmlhttp;
}

/* add job to jobQueue and try to run it immediately */
jsonRequestManager_class.prototype.submitJob = function(req) {
  this.jobQueue.push(req);
  this.nextJob();
}

/* empty the jobQueue */
jsonRequestManager_class.prototype.emptyQueue = function() {
  jsonRequestManager.jobQueue = [];
}

/* run the next job, unless other jobs are in progress */
jsonRequestManager_class.prototype.nextJob = function() {
  if (this.jobQueue.length<=0) return;
  if (this.xmlhttp.readyState == 0 || this.xmlhttp.readyState == 4) {
    this.currentRequest = this.jobQueue.shift();
    browser.pleaseWait(browser.documentBody());
    this.currentRequest.submitNow();
  }
  setTimeout('jsonRequestManager.nextJob()',200);
}

/* instantiate the jsonRequestManager */
var jsonRequestManager = new jsonRequestManager_class();

/*
 * jsonRequest class, used to send asynchronous requests to server.
 */
function jsonRequest_class(path,args) {
  if (path != undefined) {
    this.queryParams = this.getQueryParams(args);
  }
  this.queryUrl = jsonRequestManager.queryUrl+path;
}

/* translate lib, cmd and args into uri_encoded string */
jsonRequest_class.prototype.getQueryParams = function(args) {
  var query = [];
  for (var k in args) if (args.hasOwnProperty(k)) {
    query.push(k+'='+encodeURIComponent(args[k]));
  }
  query = query.join('&');
  if (query.length > 1000000) {
    throw('Query parameters exceed 1MB limit.');
  } 
  return query;
}

/* display server error */
jsonRequest_class.prototype.serverError = function(msg) {
  var errorConsole = globalErrorConsole;
  if (errorConsole == undefined) {
    if (typeof msg == 'object') {
      alert('server error: '+json_encode(msg));
    } else {
      alert('server error: '+msg);
    }
  } else {
    if (typeof msg == 'object') {
      errorConsole.addError('jsonRequest error: '+json_encode(msg));
/*
      // attributes
      msg['<>'] = {'summary': json_encode(msg.errors)};
      var tree = wdw.myTreeManager.getTreeByName('jsonRequestErrorLog');
      var nd = tree.contentNode('PHP Error Log').addChild(tree.newNode(msg),Date().toString());
      var elem = wdw.document.getElementById('jsonRequestErrorLog');
      elem.innerHTML = tree.html();
*/      
    } else {
      errorConsole.addError('jsonRequest error: '+json_encode(msg));
    }
  }
}

/* asynchronous request */
jsonRequest_class.prototype.submit = function() {
  jsonRequestManager.submitJob(this);
}

/* called by jsonRequestManager when xmlhttp object is ready */
jsonRequest_class.prototype.submitNow = function() {
  try {
    var queryParams = this.queryParams;
    var xmlhttp = jsonRequestManager.xmlhttp;
    xmlhttp.open("POST",this.queryUrl,true); // true means 'asynchronous'
    var me = this;
    xmlhttp.onreadystatechange = function() {
      var xmlhttp = jsonRequestManager.xmlhttp;
      if (xmlhttp.readyState==4) {
        browser.pleaseWait();
        var req = jsonRequestManager.currentRequest;
        if (xmlhttp.status==200) {
          var ans = req.getValidResponse(xmlhttp);
          if (ans != undefined) req.responseHandler(ans);
        } else me.serverError('The request to '+req.queryUrl+' came back with status code '+xmlhttp.status);
      }
    }
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send(queryParams);
    return true; // ok
  } catch(e) {
    if (JSON_REQUEST_DEBUG) {
      alert('jsonRequest.submit error: ' +e+'\n\nQuery: \n'+unescape(queryUrl+'?'+queryParams)); 
    }
    return false;
  }
}

/* abort asynchronous request */
jsonRequest_class.prototype.abort = function() {
  jsonRequestManager.emptyQueue();
}

/* get response and check for errors */
jsonRequest_class.prototype.getValidResponse = function(xmlhttp) {
  var responseType = xmlhttp.getResponseHeader('Content-type');
  var s = xmlhttp.responseText;
  // consider html response as error message
  if (responseType.indexOf('text/html') >= 0) {
    this.serverError(s);
    return undefined;
  }
  if (responseType.indexOf('application/json') >= 0) {
    eval('var ans='+s+';');
    if (typeof ans == 'object' && ans != undefined && ans['jsonRequestError'] != undefined) {
      this.serverError(ans['jsonRequestError']);
      return undefined;
    }
    return ans;
  } else {
    this.serverError('Unsupported content-type '.$responseType);
  }
}

/* default response handler, to be overloaded */
jsonRequest_class.prototype.responseHandler = function(ans) {
  alert('jsonRequest received the following response:\n'+ans);
}
