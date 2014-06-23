function wikipediaPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.template = sbaViewer.template;
  this.niceName = 'Wikipedia';
}
wikipediaPlugin_class.prototype = new sbaPlugin_class();

wikipediaPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  // prepare request
  var acr = sbaViewer.currentAcr;
  var args = {};
  args.topic = ACR_TO_FULL[acr];
  req = new jsonRPC_class('plugins/wikipedia_request.php',args);
  req.responseHandler = function(ans) {
    if (typeof ans == 'object') {
      if (ans.query) {
        var pages = ans.query.pages;
        var pg = [];
        for (var curid in pages) {
          if (pages[curid].extract == undefined) pages[curid] = 'No match';
          else {
            var x = String(pages[curid].extract);
            x = x.replace(/\n/g,'<br/>');
            x = x.replace(/<br\/>/g,' ');
            x = x.replace(/<p>/g,'');
            x = x.replace(/<\/p>/g,'<br/>');
            x = x.replace(/^"/,'');
            x = x.replace(/"$/,'');
            pages[curid] = x;
          }
        }
        var query_url = ans.query_url.replace(/&/g,'&amp;');
        var html = [];
        html.push('WikiPedia <a target="wikipedia" href="'+query_url+'">says</a>:');
        var i = 0;
        for (var curid in pages) {
          i++;
          html.push('<div style="background:#DDD;padding-left:8px;margin-top:4px"><a target="wikipedia" href="http://en.wikipedia.org/wiki/index.html?curid='+curid+'">'+args.topic+'</a></div>'+pages[curid]);
        }
        html.push('');
        divElem.innerHTML = html.join('');
      }
      if (!ans.query) {
        divElem.innerHTML = 'wikipedia seems to have <a target="wikip" href="'+ans.query_url+'">no information</a> on the term "'+args.topic+'", but you can try the <a href="http://www.wikipedia.com/search?limit=30&amp;start=0&amp;query='+(args.topic.replace(' ','+'))+'">search page</a>';
      } 
    } else {
      divElem.innerHTML = htmlspecialchars(ans);
    }    
  }
  req.submit();
}