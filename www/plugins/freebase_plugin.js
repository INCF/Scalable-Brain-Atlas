function freebasePlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.template = sbaViewer.template;
  this.acr2nlxid = undefined;

  var args = {};
  args.template = this.template;
  args.jsonfile = 'acr2nlxid';
  var req = new jsonRequest_class('services/loadjson.php',args);

  // response handler
  var me = this;
  req.responseHandler = function(ans) {
    me.acr2nlxid = eval(ans);
  }
  req.submit();
}
freebasePlugin_class.prototype = new sbaPlugin_class();

freebasePlugin_class.prototype.activate = function(sbaViewer,divElem) {
  // prepare request
  var acr = sbaViewer.currentAcr;
  var args = {};
  args.topic = ACR_TO_FULL[acr];
  req = new jsonRequest_class('DB08/freebase.php',args);
  req.responseHandler = function(ans) {
    if (typeof ans == 'object') {
      if (ans.code=='/api/status/error') {
        divElem.innerHTML = 'Error connecting to Freebase.';
      } else if (!ans.result) {
        divElem.innerHTML = 'Freebase seems to have <a target="FREEBASE" href="'+ans.query_url+'">no information</a> on the term "'+args.topic+'", but you can try the <a href="http://www.freebase.com/search?limit=30&amp;start=0&amp;query='+(args.topic.replace(' ','+'))+'">search page</a>';
      } else {
        divElem.innerHTML = 'WikiPedia <a target="FREEBASE" href="'+ans.result.href+'">says</a>: '+ans.result.content;
      }
    } else {
      divElem.innerHTML = json_encode(ans);
    }
  }
  req.submit();
}