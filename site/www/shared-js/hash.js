// 
// Hash Functions, perl-like hash functions
//

var hash = {
  keys: function(H) {
    if (H == undefined) return undefined;
    var keys = [];
    for (var k in H) keys.push(k);
    return keys;
  },
  values: function(H,keys) {
    var values = [];
    if (keys == undefined) for (var k in H) values.push(H[k]);
    else for (var i=0;i<keys.length;i++) values.push(H[keys[i]]);
    return values;
  },
  uniqueValues: function(H) {
    var J = {};
    for (var k in H) J[H[k]] = true;
    return hash.keys(J);
  },
  count: function(H) {
    i = 0;
    for (var k in H) i++;
    return i;
  },
  // return pre-key-sep-value-post strings
  keyValueStrings: function(H,sep,pre,post) {
    if (pre == undefined) pre = '';
    if (post == undefined) post = '';
    var kv = [];
    for (var i in H) kv.push(pre+i+sep+H[i]+post);
    return kv;
  },
  // create hash from separate key and value arrays
  create: function(keys,values) {
    if (keys == undefined) return undefined;
    var H = {}
    for (var i=0;i<keys.length;i++) H[keys[i]] = values[i];
    return H;
  },
  // create hash from keys only, using index as value
  createFromKeys: function(keys,offset) {
    if (offset == undefined) offset = 0;
    var H = {}
    for (var i=0;i<keys.length;i++) H[keys[i]] = offset+i;
    return H;
  },
  // create from key-sep-value strings; if sep is not found, entry is discarded
  createFromKeyValueStrings: function(keyValueStrings,sep) {
    var H = {};
    var maxIndex = -1;
    for (var i in keyValueStrings) if (keyValueStrings.hasOwnProperty(i)) {
      var k,v;
      var s = keyValueStrings[i];
      indx = s.indexOf(sep);
      if (indx>-1) { 
        k = s.substr(0,indx);
        v = s.substr(indx+sep.length);
        H[k] = v;
      }
    }
    return H;
  },
  // create hash (=Object) from Array
  createFromArray: function(A) {
    if (A instanceof Array) {
      H = {};
      for (var i in A) if (A.hasOwnProperty(i)) { H[i] = A[i]; }
      return H;
    } else return A;
  },
  // return first key that matches value
  firstMatch: function(H,v) {
    for (var k in H) if (H[k] == v) return k;
    return false;
  },
  // return first key that matches value
  firstMatch_ci: function(H,v) {
    v = v.toLowerCase();
    for (var k in H) if (H[k].toLowerCase() == v) return k; 
    return undefined;
  },
  // return all keys that match value
  allMatches: function(H,v) {
    var keys = [];
    for (var k in H) if (H[k] == v) keys.push(k);
    return keys;
  },
  // return all keys that match value
  allMatches_ci: function(H,v) {
    var keys = [];
    v = v.toLowerCase();
    for (var k in H) if (H[k].toLowerCase() == v) keys.push(k);
    return keys;
  }
}