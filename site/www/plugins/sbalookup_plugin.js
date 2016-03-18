function sbalookupPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.niceName = 'SBA Lookup';
}
sbalookupPlugin_class.prototype = new sbaPlugin_class();

sbalookupPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  // prepare request
  var args = {};
  var req = new jsonRequest_class('plugins/sbalookup.php',args);
  var me = this;
  req.responseHandler = function(ans) {
    me.catalog = ans;
    me.applyStateChange(sbaViewer,divElem);
  }
  if (!this.catalog) req.submit();
}

sbalookupPlugin_class.prototype.applyStateChange = function(sbaViewer,divElem) {
  if (!this.catalog) return;
  var acr = sbaViewer.currentAcr;
  var ans = [];
  ans.push('The region <b>'+acr+'</b> appears in the following templates:<table class="fancy" style="width:100%">');
  ans.push('<tr><th>Template</th><th>Abbrev.</th><th>Full name</th></tr>');
  var acr_lc = String(acr).toLowerCase();
  var hits = this.catalog[acr_lc] || [];
  // also try full name match
  var full = ACR_TO_FULL[acr];
  if (full) {
    var full_lc = String(full).toLowerCase();
    if (full_lc != acr_lc) {
      hits = hits.concat(this.catalog[full_lc]);
    }
    // and finally try alias match
    for (var alias in ALIAS_TO_ACR) {
      var aacr = ALIAS_TO_ACR[alias];
      var aacr_lc = String(aacr).toLowerCase();
      if (aacr_lc == acr_lc) {
        hits = hits.concat(this.catalog[String(alias).toLowerCase()]);
      }
    }
  }
  var template2species = this.catalog['@template2species'];
  var useOnce = [];
  for (var i in hits) {
    var h = hits[i];
    var h3 = h.join('|');
    if (useOnce[h3] != 1) {
      useOnce[h3] = 1;
      var href = '?template='+h[0]+'&amp;region='+h[1]+'&amp;plugin=sbalookup';
      ans.push('<tr><td><a href="'+href+'">'+h[0]+'<br/>('+template2species[h[0]]+')</a></td><td>'+h[1]+'</td><td>'+h[2]+'</td></tr>');
    }
  }
  ans.push('</table>');
  divElem.innerHTML = '<p style="padding: 2px; background: #EEE">'+ans.join('')+'</p>';
}