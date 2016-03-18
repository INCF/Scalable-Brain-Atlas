/*
 * json routines, to encode objects posted via phpRequest
 */
 
function json_encode(v) {
  switch (typeof v) {
    case 'string':
    case 'number':
    case 'boolean':
      return json_encodeString(v);
    case 'object':
      if (v) {
        if (v instanceof Array) {
          return json_encodeArray(v);
        } else {
          return json_encodeObject(v);
        }
      } else return 'null';
  }
  return 'null';
}

function json_encodeString(s) {
  if (/[\x00-\x1f\"\\]/.test(s)) {
    var rfunc = function(a) {
      var m = {'\b': '\\b','\t': '\\t','\n': '\\n','\f': '\\f','\r': '\\r','"' : '\\"','\\': '\\\\'};
      var c = m[a];
      if (c) return c;
      c = a.charCodeAt();
      return '\\u00' +Math.floor(c / 16).toString(16)+(c % 16).toString(16);
    }
    s = s.replace(/[\\\x00-\x1f\"]/g,rfunc);
  }
  return '"'+s+'"';
}

function json_encodeObject(H) {
  var a = []; // array holding the partial texts
  for (var k in H) {
    if (H.hasOwnProperty(k)) {
      var v = H[k];
      a.push(json_encodeString(k)+ ':' +json_encode(v));
    }
  }
  return '{' + a.join(',') + '}';
}

function json_encodeArray(A) {
  var a = []; // array holding the partial texts
  for (var i=0;i<A.length;i++) {
    var v = A[i];
    a.push(json_encode(v));
  }
  return '[' + a.join(',') + ']';
}


