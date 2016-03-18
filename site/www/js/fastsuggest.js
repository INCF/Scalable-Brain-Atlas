// uses browser.js, instancemanager.js, hash.js

// Features: 
// [..] allow sep to be a regexp
// [ok] field's original onblur function is called when:
//      . field *really* loses focus
// [ok] field's original onchange function is called when:
//      . field *really* loses focus and field.value on blur is different from its original value
// [ok] on pressing enter or mouse click to select suggestion:
//      . if currently highlighted suggestion differs from field.value,
//        field.value is made equal to suggestion
//      . otherwise, pressing enter has same effect as losing focus


// this global variable is a necessary evil used for sorting
var FAST_SUGGEST_TEMP;

function fastSuggest_class(suggestions,sep,instanceName) {
  this.instanceId = instanceManager.register(this,instanceName,'fastsuggest');
  this.setSuggestions(suggestions,sep);
}

fastSuggest_class.prototype.attachTo = function(callerId) {
  var callerElem = document.getElementById(callerId);

  // turn browsers' own autocomplete feature off
  callerElem.setAttribute('autocomplete','off');

  // callerElem events
  var instanceId = this.instanceId;
  callerElem.onkeydown = function(ev) { 
    var me = instanceManager.get(instanceId);
    me.field_onkeydown(ev);
  }
  callerElem.onkeyup = function(ev) {
    var me = instanceManager.get(instanceId);
    me.field_onkeyup(this.value);
  }
  this.orig_focus = callerElem.onfocus;
  this.orig_blur = callerElem.onblur;
  this.orig_change = callerElem.onchange;
  callerElem.onfocus = function(ev) {
    var me = instanceManager.get(instanceId);
    me.field_onfocus(ev);
  }
  callerElem.onchange = null;
  callerElem.onblur = function() { 
    // this is to ensure that onblur is called last in the event train
    setTimeout('instanceManager.get(\''+instanceId+'\').field_onblur();',1);
  }
  
  // initialize fastsuggest list
  var listId = callerId+'_fastsuggest_list';
  var list = document.getElementById(listId);
  if (list != undefined) callerElem.offsetParent.removeChild(list);
  list = document.createElement('div');
  list.id = listId;
  list.style.display = 'none';
  list.style.position = 'absolute';
  list.style.border = '2px solid #ddd';
  list.style.overflow = 'auto';
  list.style.zIndex = 11;
  list.onmousedown = function() { 
    var me = instanceManager.get(instanceId);
    me.locked = true;
  }
  list.onmouseup = function() { 
    var me = instanceManager.get(instanceId);
    if (me.locked) {
      callerElem = document.getElementById(me.callerId);
      callerElem.focus();
      me.locked = false;
    }
  }
  var oParent = callerElem.offsetParent;
  oParent.appendChild(list);
  
  // store output
  this.callerId = callerId;
  this.listId = listId;
}

fastSuggest_class.prototype.setSuggestions = function(suggestions,sep) {
  if (!(suggestions instanceof Array)) {
    suggestions = [];
  }
  this.pointers = this.initCatalog(suggestions,sep);
  this.suggestions = suggestions;
  this.matchingKeys = [];
}

fastSuggest_class.prototype.field_onkeydown = function(ev) {
  var OK = 13;
  var TAB = 9;
  var ESC = 27;
  var UP = 38;
  var DWN = 40;

  var key = browser.getKeyCode(ev);
  switch(key) {
  case OK:
    var callerElem = document.getElementById(this.callerId);
    if (this.highlight>-1) { 
      this.useSuggestion(); browser.cancelEvent(ev); 
    } else { 
      this.field_onblur(); 
    }
    break;
  case ESC:
    if (this.listShown) { this.hideList(this); browser.cancelEvent(ev); }    
    break;
  case UP:
    if (this.listShown) {
      if (this.matchingKeys.length>0) {
        var h = this.highlight-1;
        if (h < 0) { h = this.matchingKeys.length-1; }
        this.changeHighlight(h);
      } 
    } else {
      this.showList(this.lastQuery);
    }
    break;
  case DWN:
    if (this.listShown) {
      if (this.matchingKeys.length>0) {
        var h = this.highlight+1;
        if (h >= this.matchingKeys.length) { h = 0; }
        this.changeHighlight(h);
      }
    } else {
      this.showList(this.lastQuery);
      if (this.matchingKeys.length>0) this.changeHighlight(0);
    }
    break;
  }
}

fastSuggest_class.prototype.field_onkeyup = function(query) {
  if (query != this.lastQuery || !this.listShown) {
    this.hideList();
    this.showList(query); 
  }
}

fastSuggest_class.prototype.field_onfocus = function(ev) {
  if (this.locked) return;
  var callerElem = document.getElementById(this.callerId);
  // init session
  this.listShown = 0;
  this.highlight = -1;
  this.origQuery = callerElem.value;
  //if (this.orig_focus) {
  //  this.orig_focus.apply(callerElem,arguments);
  //}
}

fastSuggest_class.prototype.field_onblur = function(ev) {
  if (this.locked) return;
  var callerElem = document.getElementById(this.callerId);
  this.hideList();
  
  // close session
  if (this.orig_blur) {
    this.orig_blur.apply(callerElem,arguments);
  }
  if (this.orig_change && callerElem.value != this.origQuery) {
    this.orig_change.apply(callerElem,arguments);
  }
}

fastSuggest_class.prototype.showList = function(query) {
  var list = document.getElementById(this.listId);
  var callerId = this.callerId;
  var callerElem = document.getElementById(callerId);

  // populate list
  list.innerHTML = '';
  var matches = (query=='?' ? this.suggestions : this.findMatches(query));
  this.matchingKeys = hash.keys(matches);
  var mValues = hash.values(matches);
  var md = ' onmousedown="instanceManager.get(\''+this.instanceId+'\').useSuggestion(); browser.cancelEvent(event)"';
  var a = ['<ul '+md+' id="'+callerId+'_fastsuggest_ul" class="autosuggest">'];
  if (query == '' && this.pointers.length) {
    a.push('<li class="nomatch">[type ? for all suggestions]</li>');
  } else if (mValues.length == 0) {
    a.push('<li class="nomatch">[no suggestions]</li>');
  } else {
    for (var i=0; i<mValues.length; i++) {
      var sug = mValues[i];
      var mm = ' onmousemove="instanceManager.get(\''+this.instanceId+'\').changeHighlight('+i+')"';
      a.push('<li '+mm+' id="'+callerId+'_fastsuggest_li_'+i+'">'+sug+'</li>');
    }
  }
  a.push('</ul>');
  list.innerHTML = a.join('');

  // position list
  this.locked = true;
  list.style.height = '12px';
  list.style.display = 'block';
  list.style.width = callerElem.offsetWidth+'px';
  // list.style.left = callerElem.left + 4+ 'px';
  list.style.left = callerElem.offsetLeft + 4+ 'px';
  list.style.top = callerElem.offsetHeight + callerElem.offsetTop + 'px';
  ul = document.getElementById(callerId+'_fastsuggest_ul');  
  list.style.height = (ul.scrollHeight < 200 ? list.scrollHeight : 200)+'px';
  this.locked = false;
  
  this.lastQuery = query;
  this.listShown = 1;
}

fastSuggest_class.prototype.hideList = function() {
  var list = document.getElementById(this.listId);
  this.listShown = 0;
  this.highlight = -1;
  if (list != undefined) list.style.display = 'none';
};

fastSuggest_class.prototype.changeHighlight = function(h) {
  var list = document.getElementById(this.listId);
  var callerId = this.callerId;
  var callerElem = document.getElementById(callerId);
  
  // remove previous highlight
  var hPrev = this.highlight;
  if (hPrev > -1) {
    document.getElementById(callerId+'_fastsuggest_li_'+hPrev).className = undefined;
  }

  // apply highlight
  var li_h = document.getElementById(callerId+'_fastsuggest_li_'+h);
  li_h.className = 'highlight';
  if (li_h.offsetTop < list.scrollTop) { 
    list.scrollTop = li_h.offsetTop; // callerElem.scrollIntoView(false); 
  }
  if (li_h.offsetTop+li_h.offsetHeight > list.scrollTop+list.offsetHeight-4) { 
    list.scrollTop = li_h.offsetTop+li_h.offsetHeight-list.offsetHeight+4; 
  };

  // store h
  this.highlight = h;
}

fastSuggest_class.prototype.useSuggestion = function() {
  var callerElem = document.getElementById(this.callerId);
  if (this.highlight > -1) {
    var m = this.matchingKeys[this.highlight];
    callerElem.value = this.suggestions[m];
    var matches = this.findMatches(callerElem.value);
    this.matchingKeys = hash.keys(matches);
  }
  this.hideList();
  this.field_onblur();
};


// used for sorting; a and b are position pointers, FAST_SUGGEST_TEMP must contain this.suggestions
fastSuggest_class.prototype.pointerCompare = function(a,b) {
  if (a == b) return 0;
  var posA = a % 1000; // posA stored in first 3 digits
  var posB = b % 1000;
  var sugA = FAST_SUGGEST_TEMP[(a-posA)/1000];
  var sugB = FAST_SUGGEST_TEMP[(b-posB)/1000];
  var sA = sugA.charAt(posA);
  var sB = sugB.charAt(posB);
  if (sA == sB) {
    sA = sugA.substr(posA)+'\t'+(posA>0).toString()+sugA;
    sB = sugB.substr(posB)+'\t'+(posB>0).toString()+sugB;
  }
  return (sA>sB ? 1 : -1);
}

// used to find matches, s is the search string, a is the position pointer
fastSuggest_class.prototype.wordComparePointer = function(s,a) {
  var posA = a % 1000;
  var s = s.toLowerCase();
  var sA = this.suggestions[(a-posA)/1000].substr(posA,s.length).toLowerCase();
  return (s==sA ? 0 : (s>sA ? 1 : -1));
}


fastSuggest_class.prototype.initCatalog = function(suggestions,sepArray) {
  var pointers = [];
  var suggestions_lc = [];
  var numSuggestions = suggestions.length;
  for (var i=0; i<numSuggestions; i++) {
    pointers.push(1000*i); // include all suggestions with zero offset
    suggestions_lc[i] = suggestions[i].toLowerCase();
  }
  if (sepArray != undefined) {
    if (typeof(sepArray) == 'string') sepArray = [sepArray];
    for (var s in sepArray) if (sepArray.hasOwnProperty(s)) {
      var sep = sepArray[s];
      var sepLen = sep.length;
      if (sepLen == 0) {
        alert('Error in fastsuggest.initCatalog: separator has zero length');
      }
      for (var i=0; i<numSuggestions; i++) {
        var s = suggestions[i];
        var posLast = s.length-1;
        var pos2 = s.indexOf(sep);
        var ok = (pos2 != -1);
        var pos = pos2+sepLen;
        while (ok) {
          pos2 = s.indexOf(sep,pos);
          ok = (pos2 != -1);
          len = (ok ? pos2-pos : posLast-pos);
          if (len>0) {
            pointers.push(pos+1000*i);
          }
          pos = pos2+sepLen;
        }
      }
    }
  }
  FAST_SUGGEST_TEMP = suggestions_lc;
  pointers.sort(this.pointerCompare);
  FAST_SUGGEST_TEMP = undefined;
  return pointers;
}

fastSuggest_class.prototype.specialChars = function(s) {
  return s.replace(/</g,'&lt;').replace('>','&gt;');
}

fastSuggest_class.prototype.findMatches = function(query,firstMatch,lastMatch) {
  // deal with empty query
  if (query == undefined || query.length == 0) {
    this.firstMatch = 0;
    this.lastMatch = undefined;
    return {};
  }
  
  // get 'global' variables
  var pointers = this.pointers;
  var suggestions = this.suggestions;
  var iMin,iMax,iFirst,iLast;
  var cmp,cmp1;
  // get index of first match
  iMin = (firstMatch == undefined ? -1 : firstMatch);
  iMax = (lastMatch == undefined ? pointers.length-1 : lastMatch);
  iFirst = Math.ceil(0.5*(iMin+iMax));
  cmp1 = -1;
  while (iMax != iFirst) {
    cmp = this.wordComparePointer(query,pointers[iFirst]);
    // iMin always has cmp>0!
    if (cmp>0) {
      // need to search further down in the list
      iMin = iFirst;
      iFirst = Math.ceil(0.5*(iMax+iFirst));
    } else {
      cmp1 = cmp;
      iMax = iFirst;
      iFirst = Math.ceil(0.5*(iMin+iFirst));
    }
  }
  if (cmp1==0) {
    // get index of last match
    iMin=iFirst;
    iMax = (lastMatch == undefined ? pointers.length-1 : lastMatch);
    iLast = Math.floor(0.5*(iMin+iMax));
    while (iMin != iLast) {
      if (this.wordComparePointer(query,pointers[iLast])<0) {
        iMax = iLast;
        iLast = Math.floor(0.5*(iMin+iLast));
      } else {
        iMin = iLast;
        iLast = Math.floor(0.5*(iMax+iLast));
      }
    }
  }
  
  // store matched interval
  this.firstMatch = iFirst;
  this.lastMatch = iLast;

  // get list of matched values and emphasize query
  var matches = {}; 
  for (var i=iFirst; i<=iLast; i++) {
    var p = pointers[i] % 1000;
    var j = (pointers[i]-p)/1000;
    p = (p<10 ? '00'+p : (p<100 ? '0'+p : p));
    if (matches[j]) matches[j].push(p);
    else matches[j] = [p];
  }
  var qLen = query.length;
  var emphStart = '<b class="emph">';
  var emphEnd = '</b>';
  var emphLen = emphStart.length+emphEnd.length;
  for (var j in matches) {
    var pos = matches[j].sort();
    var word = suggestions[j];
    var emph = Array(pos.length);
    var pPrev = 0;
    for (var k=0; k<pos.length; k++) {
      var p = Number(pos[k]);
      emph[p] = this.specialChars(word.substr(pPrev,p-pPrev))+emphStart+this.specialChars(word.substr(p,qLen))+emphEnd;
      pPrev = p+qLen;
    }
    matches[j] = emph.join('')+this.specialChars(word.substr(p+qLen));
  }
  return matches;
}
