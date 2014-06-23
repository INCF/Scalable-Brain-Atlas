function baseNode_class(attr) {
  if (attr == undefined) return;
}

baseNode_class.prototype.key = undefined;
baseNode_class.prototype.parent = undefined;
baseNode_class.prototype.attr = {};
baseNode_class.prototype.hidden = false;

baseNode_class.prototype.private_data = undefined;
baseNode_class.prototype.private_children = {};
baseNode_class.prototype.private_count = 0;

baseNode_class.prototype.private_canToggle = false;

baseNode_class.prototype.canToggle = function() { return this.private_canToggle; }

baseNode_class.prototype.setParent = function(parent,key) { 
  this.parent = parent; 
  this.key = key;
};

baseNode_class.prototype.itemHtml = function() { return ''; }

baseNode_class.prototype.html = function() { return ''; };

baseNode_class.prototype.getRoot = function() {
  var me, pn = this;
  do { me = pn; pn = me.parent; } while (pn != undefined);
  return me;
}

baseNode_class.prototype.domElemId = function() {
  var treeName = this.getRoot().treeName;
  var cp = this.contentPath();
  return (cp==undefined ? undefined : treeName+'.node['+cp+']');
}

baseNode_class.prototype.tag = 'baseNode';
baseNode_class.prototype.xmlAttr = function() {
  ans = {};
  ans.key = this.key;
  ans.domElemId = this.domElemId();
  return ans;
} 
baseNode_class.prototype.innerXML = function() {
  // start XML 
  var attrXML = hash.keyValueStrings(this.xmlAttr(),'="',' ','"').join('');
  var xml = '<'+this.tag+attrXML+'>\n';
  // children XML
  var ch = this.getChildren();
  for (var k in ch) if (ch.hasOwnProperty(k)) xml += ch[k].innerXML();
  // end XML 
  xml += '</'+this.tag+'>\n';
  return xml;
}

baseNode_class.prototype.initChildren = function() {
  var treeRoot = this.getRoot();
  var S = this.private_data;
  this.private_count = 0;
  var ch = {};
  if (typeof(S) == 'object') {
    for (var k in S) {
      if (S.hasOwnProperty(k)) {
        var nd = treeRoot.newNode(S[k],k);
        ch[k] = nd;
        this.private_count++;
        nd.setParent(this,k);
      }
    }
  }
  delete this.private_data;
  this.private_children = ch;
}

baseNode_class.prototype.getChildren = function() {
  if (this.private_data != undefined) this.initChildren();
  return this.private_children;
}

baseNode_class.prototype.getChild = function(key) {
  var ch = this.getChildren();
  return ch[key];
}

baseNode_class.prototype.addChild = function(nd,key) {
  this.getChildren();
  if (!this.hasOwnProperty('private_children')) this.private_children = {}; 
  nd.key = key;
  this.private_children[key] = nd;
  this.private_count++;
  nd.setParent(this,key);
  return nd;
}

baseNode_class.prototype.private_getNode = function(path,sep) {
  var i = path.indexOf(sep);
  if (i>-1) {
    firstKey = path.substr(0,i);
    var ch = this.getChild(firstKey);
    return (ch != undefined ? ch.private_getNode(path.substr(i+1),sep) : undefined);
  } else {
    return this.getChild(path);
  }
}

baseNode_class.prototype.getNode = function(path,sep) {
  if (sep == undefined) sep = '|';
  if (path == undefined) return undefined;
  if (path == '') return this;
  var ans = this.private_getNode(String(path),sep);
  if (ans == undefined) alert('getNode: cannot find subnode '+path+' from node '+this.getPath(undefined,sep));
  return ans;
}

baseNode_class.prototype.getPath = function(rootNode,sep) {
  if (rootNode == undefined) rootNode = this.getRoot();
  if (sep == undefined) sep = '|';
  if (this == rootNode) return '';
  var me = this;
  var keys = [];
  while (me != rootNode && me != undefined) { 
    keys.push(me.key); me = me.parent; 
  }
  return (me == rootNode ? keys.reverse().join(sep) : undefined);
}

baseNode_class.prototype.getNodeByKey = function(key) {
  if (this.key==key) return this;
  var ch = this.getChildren();
  for (var k in ch) {
    var c = ch[k];
    var node = c.getNodeByKey(key);
    if (node) return node;
  }
}

baseNode_class.prototype.contentPath = function(sep) {
  var contentRoot = this.getRoot().contentRoot;
  return this.getPath(contentRoot,sep);
}

function node_class(data,attr) {
  baseNode_class.apply(this,[attr]);
  if (attr != undefined) {
    if (attr.tag != undefined) { this.tag = attr.tag; delete attr.tag }
    if (attr.sortby != undefined) { this.sortby = attr.sortby; delete attr.sortby }
    // store remaining attributes, if any
    for (var k in attr) { this.attr = attr; break; }
    if (attr.collapse != undefined) {
      if (attr.collapse == 'false' || !attr.collapse) {
        this.private_isOpen = true;
      }
      if (attr.collapse == 'never') {    
        this.private_isOpen = true;
        this.private_canToggle = false;
      }
    }
  }
  if (data != undefined) this.private_data = data;
  return this;
}
node_class.prototype = new baseNode_class();

node_class.prototype.tag = 'node';
node_class.prototype.sortby = undefined;
node_class.prototype.style = [''];

node_class.prototype.private_isOpen = false;
node_class.prototype.private_canToggle = true;
node_class.prototype.tag = 'node';

node_class.prototype.isOpen = function() { return this.private_isOpen; }

node_class.prototype.private_forms = null;

node_class.prototype.setParent = function(parent,key) {
  baseNode_class.prototype.setParent.apply(this,[parent,key]);
} 

node_class.prototype.initChildren = function() {
  baseNode_class.prototype.initChildren.apply(this,[]);
  var ch = this.private_children;
  
  // sorting
  var sortby = this.sortby; 
  if (sortby != undefined) {
    try {
      var s = [];
      var u = [];
      for (var k in ch) {
        var sb = ch[k].attr[sortby];
        if (sb == undefined) u.push([k,ch[k]]);
        else s.push([k,ch[k],sb]);
      }
      var sortFunc = function(a,b) {
        return ( a[2] > b[2] ? 1 : (a[2] < b[2] ? -1 : 0) ); 
      }
      s.sort(sortFunc);
      ch = {};
      for (var i=0; i<u.length; i++) ch[u[i][0]] = u[i][1]; 
      for (var i=0; i<s.length; i++) ch[s[i][0]] = s[i][1];
      this.private_children = ch;
    } catch(e) {
      alert('sorting error: '+e);
    }
  }
}

node_class.prototype.toggleIntoView = function() {
  var chain = [];
  var node = this;
  while (node.parent != undefined) {
    chain.push(node.parent);
    node = node.parent;
  } 
  for (var k in chain.reverse()) if (chain.hasOwnProperty(k)) {
    node = chain[k];
    if (node.isOpen && !node.isOpen()) node.toggle();
  }
  var elem = document.getElementById(this.domElemId());
  elem.innerHTML = (this.parent.treeName == undefined ? this.html() : this.valueHtml());
}

node_class.prototype.display = function(context) {
  var elem = document.getElementById(this.domElemId());
  elem.innerHTML = (this.parent.treeName == undefined ? this.html(context) : this.valueHtml(context));
}

node_class.prototype.toggle = function(context) {
  this.private_isOpen = !this.private_isOpen;  
  this.display(context);
}

node_class.prototype.toggleHtml = function(context) {
  if (!this.private_canToggle) return '<img class="myTreeBullet" src="../img/bullet.gif"/> ';
  var treeName = this.getRoot().treeName;
//  if (this.private_count > 0) {
    var s = "myTreeManager.getTreeByName('"+treeName+"').nodeToggle('" +this.contentPath().replace("'","\\'")+ "','"+context+"')";
    var t = '';
    if (this.private_isOpen) t = '<img  class="myTreeButton" src="../img/minussign.gif"/>';
    else t = '<img class="myTreeButton" src="../img/plussign.gif"/>';
    return '<span class="myToggle" onclick="' +s+ '">' +t+ '</span>';
//  } else {
//    var t = '<img class="myTreeButton" src="../img/empty8.gif"/>';
//    return '<span class="myToggle">' +t+ '</span>';
//  }
}

node_class.prototype.showMore = function() {
  if (this.private_canToggle && !this.private_isOpen) { this.toggle(); return; }
  var ch = this.getChildren();
  for (var k in ch) {
    var c = ch[k];
    if (c.private_canToggle) {
      if (c.private_isOpen) c.showMore()
      else c.toggle();
    }
  }
}

node_class.prototype.showLess = function() {
  var allClosed = true;
  var ch = this.getChildren();
  for (var k in ch) {
    var c = ch[k];
    if (c.private_canToggle) {
      if (c.private_isOpen) {
        allClosed = false;
        c.showLess();
      }
    }
  }
  if (allClosed && this.private_canToggle && this.private_isOpen) this.toggle();
}

node_class.prototype.optionsMenu = function(context) {
  var treeName = this.getRoot().treeName;
  var menuWindow = new autoHideWindow_class('OptionsMenu_'+treeName);
  var s = "myTreeManager.getTreeByName('"+treeName+"').showMore('" +this.contentPath().replace("'","\\'")+ "')";
  var html = '<a class="button" style="width: 12ex" href="javascript:void(0)" onclick="' +s+ '">Show More</a>';
  s = "myTreeManager.getTreeByName('"+treeName+"').showLess('" +this.contentPath()+ "')";
  html += '<br/><a class="button" style="width: 12ex" href="javascript:void(0)" onclick="' +s+ '">Show Less</a>';
  var callerElem = document.getElementById(this.getOptionsMenuId());
  menuWindow.render(callerElem,html);
}

node_class.prototype.getOptionsMenuId = function() {
  return 'OptionsMenu_' +this.domElemId();
}

node_class.prototype.optionsHtml = function(context) {
  var ans = '';
  if (this.private_isOpen && this.private_count>0) {
    var treeName = this.getRoot().treeName;
    var s = "myTreeManager.getTreeByName('"+treeName+"').nodeOptionsMenu('" +this.contentPath().replace("'","\\'")+ "','"+context+"')";
    ans += '<span id="' +this.getOptionsMenuId()+ '" class="myNodeOptions" onclick="' +s+ '"><img class="myTreeButton" src="../img/doubledownarrow.gif"/></span> ';
  } else {
    ans += '<span class="myNodeOptions"><img class="myTreeNoButton" src="../img/hdots.gif"/></span> ';
  }
  return ans;
}

node_class.prototype.label = function() {
  return (this.attr.label ? this.attr.label : this.key);
}

node_class.prototype.labelHtml = function(context) {
  return '<b class="'+this.style.join(' ')+'">'+this.label()+'</b> ';
}

node_class.prototype.summary = function() {
  return (this.attr.summary != undefined ? this.attr.summary : '...');
}

node_class.prototype.itemHtml = function(context) {
   var elemId = this.domElemId();
   return '<li class="myItem '+this.style.join(' ')+'" id="' +elemId+ '">' + this.html(context) + '</li>';
}

node_class.prototype.valueHtml = function(context) {
  var ans = this.summary();
  return this.private_isOpen ? ans+this.listHtml(context) : ans;
}

node_class.prototype.listHtml = function(context) {
  var a = [];
  // headers
  var p = this.private_headers;
  if (p) for (var i=0; i<p.length; i++) a.push(p[i].html(context));
  a.push('<ul class="myList">');
  // body
  var ch = this.getChildren();
  for (var k in ch) {
    if (ch.hasOwnProperty(k)) {
      a.push(ch[k].itemHtml());
    }
  }
  a.push('</ul>');
  // footers
  var p = this.private_footers;
  if (p) for (var i=0; i<p.length; i++) a.push(p[i].html(context));
  return a.join('');
}

node_class.prototype.recordSpan = function(s,myClass) {
  return '<span class="' +myClass+ '">'+s+'</span>';
}

node_class.prototype.html = function(context) {
  var a = [];
  // children may alter this node's html; make sure they are loaded 
  this.getChildren();
  if (context=='record') {
    a.push(this.recordSpan(this.labelHtml(context),'myRecordKey'));
    a.push(this.recordSpan(':','myRecordColon'))
    a.push(this.recordSpan(this.toggleHtml(context)+this.optionsHtml(context)+this.valueHtml(context),'myRecordValue'));
  } else {
    a.push(this.toggleHtml(context));
    a.push(this.optionsHtml(context));
    var p = this.private_forms;
    if (p) for (var i=0; i<p.length; i++) a.push(p[i].valueHtml(context));
    a.push(this.labelHtml(context));
    a.push(this.valueHtml(context)) 
  }
  return a.join('');
}

/*
 *  class scalarNode
 */

scalarNode_class = function(myData,myAttr) {
  node_class.apply(this,[undefined,myAttr]);
  this.value = (myData != undefined ? myData[0] : undefined);
}
scalarNode_class.prototype = new node_class();

scalarNode_class.prototype.style = ['mt_scalar'];

scalarNode_class.prototype.private_canToggle = false;

scalarNode_class.prototype.toggleHtml = function(context) {
  return '';
}

scalarNode_class.prototype.optionsHtml = function(context) {
}

scalarNode_class.prototype.valueHtml = function(context) {
  var v = (this.attr.summary ? this.attr.summary : this.value);
  if (v==undefined) v = '';
  return '<span class="'+this.style.join(' ')+'">'+v+'</span>';
}

/*
 *  class htmlNode
 */

htmlNode_class = function(myData,myAttr) {
  node_class.apply(this,[undefined,myAttr]);
  this.value = myData[0];
}
htmlNode_class.prototype = new node_class();

htmlNode_class.prototype.optionsHtml = function(context) {
}

htmlNode_class.prototype.valueHtml = function(context) {
  if (!this.private_isOpen) return (this.attr.summary || '...');
  return this.value;
}

/*
 *  class arrayNode
 */
 
arrayNode_class = function(myData,myAttr) {
  node_class.apply(this,[myData,myAttr]);
}
arrayNode_class.prototype = new node_class();

arrayNode_class.prototype.summary = function() {
  return (this.private_count > 0 ? (this.attr.summary || '...')+'&#160;('+this.private_count+')' : '');
}

arrayNode_class.prototype.toggleHtml = function(context) {
  if (!this.private_canToggle) return '<img class="myTreeBullet" src="../img/bullet.gif"/> ';
  if (this.private_count > 0) {
    return node_class.prototype.toggleHtml.apply(this,[context]);
  } else {
    var t = '<img class="myTreeButton" src="../img/empty8.gif"/>';
    return '<span class="myToggle">' +t+ '</span>';
  }
}

/*
 *  class errorNode
 */
 
errorNode_class = function(myData,myAttr) {
  arrayNode_class.apply(this,[myData,myAttr]);
}
errorNode_class.prototype = new arrayNode_class();

errorNode_class.prototype.labelHtml = function(context) {
  return '<b class="myError">'+this.label()+'</b> ';
}

/*
 *  class warningNode
 */
 
warningNode_class = function(myData,myAttr) {
  arrayNode_class.apply(this,[myData,myAttr]);
}
warningNode_class.prototype = new arrayNode_class();

warningNode_class.prototype.labelHtml = function(context) {
  return '<b class="myWarning">'+this.label()+'</b> ';
}

/*
 *  class stringNode
 */
 
stringNode_class = function(myData,myAttr) {
  scalarNode_class.apply(this,[myData,myAttr]);
  // can open?
  var a = String(this.value).split(' ');
  if (a.length>16) {
    this.private_canToggle = true;
    this.style = [];
  }
}
stringNode_class.prototype = new scalarNode_class();

stringNode_class.prototype.private_canToggle = false;

stringNode_class.prototype.toggleHtml = function(context) {
  if (!this.private_canToggle) return '';
  var treeName = this.getRoot().treeName;
  var s = "myTreeManager.getTreeByName('"+treeName+"').nodeToggle('" +this.contentPath().replace("'","\\'")+"','" +context+"')";
  var t = '';
  if (this.private_isOpen) t = '<img class="myTreeButton" src="../img/dotsign.gif"/>';
  else t = '<img class="myTreeButton" src="../img/squaresign.gif"/>';
  return '<span class="myToggle" onclick="' +s+ '">' +t+ '</span> ';
}

stringNode_class.prototype.optionsHtml = function(context) {
}

stringNode_class.prototype.valueHtml = function(context) {
  if (!this.private_isOpen) {
    var a = String(this.value).split(' ');
    var len = a.length;
    if (len>16) return a.splice(0,10).join(' ')+' ... (10 of '+(len)+' words)' ;
  }
  return this.value;
}

/*
 *  class compactNode
 *  Like normal node, but always open
 */
 
compactNode_class = function(myData,myAttr) {
  node_class.apply(this,[myData,myAttr]);
}
compactNode_class.prototype = new node_class();

compactNode_class.prototype.private_canToggle = false;
compactNode_class.prototype.private_isOpen = true;

compactNode_class.prototype.valueHtml = function(context) {
  return this.attr.summary;
}

/*
 *  class myFormTemplateNode
 */
 
myFormTemplateNode_class = function(myData,myAttr) {
  if (myData == undefined) return;
  this.formFields = myData.fields;
  this.formButtons = myData.buttons;
  this.formAttr = myData.attr;
  
  this.myForm = new myForm_class(myAttr.key);
  var me = this;
  this.myForm.init = function(cmd) {
    me.formInit(this,cmd);
  }
  this.myForm.callback = function(formData,cmd) {
    me.formCallback(this,formData,cmd);
  }
}
myFormTemplateNode_class.prototype = new baseNode_class();

myFormTemplateNode_class.prototype.formInit = function(myForm,cmd) { 
  if (this.formFields != undefined) {
    var callerNode = this.getRoot().contentNode(myForm.dataLink);
    var dataNode = callerNode.parent;
    var fields = [];
    var data = [];
    for (var k in this.formFields) {
      var ff = this.formFields[k];
      if (ff.type) {
        var attr = ff.attr;
        try {
          eval('var field = new '+ff.type+'(k,attr)');
        } catch(e) {
          var field = new myTextField(k,attr);
        }
        // autosuggest ...
        if (attr.suggestions) {
          field.callback_suggestions = attr.suggestions;
          field.update = function() {
            var sg = this.callback_suggestions; 
            var formData = myForm.getFieldValues();
            var req = new phpRequest_class(sg.lib+'|'+sg.cmd,[sg.args,formData]);
            var thisField = this;
            req.responseHandler = function(ans) {
              if (typeof(ans) == 'object') {
                thisField.showSuggestions(ans,sg.sep);
              }
            }
            req.submit();
          }
        }
        fields.push(field);
        try {
          var ch = dataNode.getChild(k);
          data[k] = ch.value;
        } catch(e) {}
      }
    }    
    myForm.fields = fields;
    myForm.data = data;
  }
  if (this.formButtons != undefined) {
    var buttons = [];
    for (var k in this.formButtons) {
      var b = this.formButtons[k];
      if (b.label != undefined) buttons[k] = b.label;
    }
    myForm.buttons = buttons;
  }
}

myFormTemplateNode_class.prototype.formCallback = function(myForm,formData,cmd) {
  try {
    var formAttr = this.formAttr;
    var callerNode = this.getRoot().contentNode(myForm.dataLink);
    formAttr.nodePath = callerNode.nodePath;
    var args = [formAttr,formData];
    var cb = this.formButtons[cmd];
    var req;
    if (cb.method == 'phpRequest') {
      req = new phpRequest_class(cb.lib+'|'+cb.cmd,args);
    } else if (cb.method == 'phpSubmit') {
      req = new phpSubmit_class(cb.lib+'|'+cb.cmd,args);
    } else throw('Unknown callback method "'+cb.method+'"');
    var me = this;
    req.responseHandler = function(ans) {
      myFormUnlock();
      if (ans.errors && ans.errors.length>0) {
        alert(ans.errors.join('\n'));
      } else {
        if (ans.warnings && ans.warnings.length>0) alert('Warning:\n'+ans.warnings.join('\n'));
        if (ans.report && ans.report.length>0) alert(ans.report.join('\n'));
        myFormHide();
        me.getRoot().refresh(ans.data,me.myForm.name);
      }
    }
    myFormLock();
    if (cb.method == 'phpSubmit') {
      formElem = document.getElementById('MYFORM_HTMLFORM');
      req.submit(formElem);
    } else {
      req.submit();
    }
  } catch(e) {
    alert('Error in callback routine "'+cmd+'": '+e);
  }
}

/*
 *  class myFormInstanceNode
 */

myFormInstanceNode_class = function(myData,myAttr) {
  baseNode_class.apply(this,[myAttr]);
  this.formName = myAttr.formName;
  this.formLabel = (myAttr && myAttr.label ? myAttr.label : 'form');
  this.nodePath = myAttr.nodePath;
}
myFormInstanceNode_class.prototype = new baseNode_class();

myFormInstanceNode_class.prototype.hidden = true;

myFormInstanceNode_class.prototype.setParent = function(parent,key) {
  baseNode_class.prototype.setParent.apply(this,[parent,key]);
  if (!parent.private_forms) parent.private_forms = [];
  parent.private_forms.push(this);
} 

myFormInstanceNode_class.prototype.valueHtml = function(context) { 
  if (this.parent.private_isOpen) {
    var myForm = this.getRoot().getMyForm(this.formName); 
    return '<a href="javascript:void(0)"'+myFormLink(myForm,this.contentPath())+'>['+this.formLabel+']</a>&nbsp';
  }
}

/*
 *  class callbackNode
 */
 
callbackNode_class = function(myData,myAttr) {
  node_class.apply(this,[undefined,myAttr]);
  this.attr = myAttr;
  this.args = myData.args;
}
callbackNode_class.prototype = new node_class();

callbackNode_class.prototype.toggle = function(context) {
  var method = this.attr.method;
  if (method=='phpRequest') {
    var req = new phpRequest_class(this.attr.lib+'|'+this.attr.cmd,this.args,this.attr.responseType);
    var me = this;
    req.responseHandler = function(ans) {
      var subTree = new myTree_class('subTree',ans);
      try {
        var root = me.getRoot();      
        var nd = root.insertTree(subTree,'',me.contentPath());
        if (nd.canToggle()) nd.private_isOpen = true;        
        nd.parent.display();
      } catch(e) {
        alert('Error in callbackNode_class: '+e);
        this.abort();
      }
    }
    req.submit();
  } else alert('callbackNode_class error: unknown method '+method);
}

/*
 *  class myTree
 */

myTree_class = function(treeName,T,displayMode) {
  baseNode_class.apply(this,[]);
  this.setParent(undefined,'mytree');
  this.treeName = treeName;
  this.displayMode = displayMode;

  this.contentRoot = undefined;
  this.formsRoot = undefined;  

  var attr = T['<>'];
  if (attr == undefined) {
    // mytree->content->T
    this.contentRoot = this.addChild(this.newNode(T),'content');
  } else {
    // see whether tree includes a content node ...
    var tag = String(attr.tag);
    if (tag.toLowerCase() == 'mytree') {
      this.attr = attr;
      if (T.content != undefined) {
        this.contentRoot = this.addChild(this.newNode(T.content),'content');
      }
      if (T.forms != undefined) {
        this.formsRoot = this.addChild(this.newNode(T.forms),'forms');
      }
    }
    // ... otherwise, create one
    if (this.contentRoot == undefined) {
      // support basic trees
      tmp = {}; tmp.summary = '';
      this.contentRoot = this.addChild(new node_class(undefined,tmp),'content');
      var key = attr.key || 0;
      this.contentRoot.addChild(this.newNode(T),key);
    }
  }
  this.contentRoot.private_isOpen = true;
  myTreeManager.registerTree(this);
}
myTree_class.prototype = new baseNode_class();

/*
myTree_class = function(treeName,T) {
  baseNode_class.apply(this,[]);
  this.setParent(undefined,'mytree');
  this.treeName = treeName;

  this.contentRoot = undefined;
  this.formsRoot = undefined;  

  var attr = T['<>'];
  if (attr == undefined || attr.tag == undefined) {
    // mytree->content->T
    this.contentRoot = this.addChild(this.newNode(T),'content');
  } else {
    var tag = String(attr.tag);  
    if (tag.toLowerCase() == 'mytree') {
      this.attr = attr;
      if (T.content != undefined) {
        this.contentRoot = this.addChild(this.newNode(T.content),'content');
      }
      if (T.forms != undefined) {
        this.formsRoot = this.addChild(this.newNode(T.forms),'forms');
      }
    }
    if (this.contentRoot == undefined) {
      // support basic trees
      this.contentRoot = this.addChild(new node_class(undefined,undefined,'content'),'content');
      var key = attr.key || 0;
      this.contentRoot.addChild(this.newNode(T),key);
    }
  }
  this.contentRoot.private_isOpen = true;
  myTreeManager.registerTree(this);
}
myTree_class.prototype = new baseNode_class();
*/

myTree_class.prototype.newNode = function(T) {
  var nd = undefined;
  switch (typeof T) {
  case 'undefined':
    nd = new scalarNode_class(undefined,undefined);
    break;
  case 'string':
    nd = new stringNode_class([T],undefined);
    break;      
  case 'number':
  case 'boolean':
    nd = new scalarNode_class([T],undefined);      
    break;
  case 'object':
    if (T == undefined) nd = new scalarNode_class(undefined,undefined);
    else {
      // xml node?
      if (T['<>']) {
        var myAttr = T['<>'];
        var myTag = myAttr.tag;
        delete T['<>'];
        if (myTag != undefined && myTag != 'node') {
          var c;
          try {
            eval('c = '+myTag+'Node_class');
          } catch(e) {}
          if (c) nd = new c(T,myAttr);
        }
      }
      if (nd==undefined) {
        if (T.length == undefined) nd = new node_class(T,myAttr); 
        else nd = new arrayNode_class(T,myAttr);
      }
    } 
    break;
  }

  return nd;
}

myTree_class.prototype.insertTree = function(tree,path,targetPath) {
  // insert content
  if (path == undefined) targetPath = tree.attr.contentPath;
  if (targetPath == undefined) throw('insertTree: cannot replace contentRoot');
  var targetNode = this.contentNode(targetPath);
  if (path != undefined) {
    var newNode = targetNode.parent.addChild(tree.contentNode(path),targetNode.key);
  } else {
    var newNode = targetNode.parent.addChild(tree.contentRoot,tree.contentRoot.attr.key);
  }
  // insert forms
  if (tree.formsRoot != undefined) {
    var ch = tree.formsRoot.getChildren();
    for (k in ch) {
      this.formsRoot.addChild(ch[k],k);
    }
  }
  return newNode;
}

myTree_class.prototype.nodeToggle = function(contentPath,context) {
  if (window.phpRequestManager) phpRequestManager.emptyQueue();
  this.contentNode(contentPath).toggle(context);
}

myTree_class.prototype.nodeOptionsMenu = function(contentPath,context) {
  this.contentNode(contentPath).optionsMenu(context);
}

myTree_class.prototype.contentNode = function(path,sep) {
  return this.contentRoot.getNode(path,sep);
}

myTree_class.prototype.formNode = function(formName) {
  return this.formsRoot.getChild(formName);
}

myTree_class.prototype.getMyForm = function(formName) {
  // make sure that formNode is loaded
  var formNode = this.formNode(formName);
  return myFormManager.getFormByName(formName);
}

myTree_class.prototype.showMore = function(contentPath) {
  if (window.phpRequestManager) phpRequestManager.emptyQueue();
  this.contentNode(contentPath).showMore();
}

myTree_class.prototype.showLess = function(contentPath) {
  if (window.phpRequestManager) phpRequestManager.emptyQueue();
  this.contentNode(contentPath).showLess();
}

myTree_class.prototype.html = function() {
  return '<div id="'+this.contentRoot.domElemId()+'" class="myTree">'+this.contentRoot.listHtml('tree')+'</div>';  
}

myTree_class.prototype.refresh = function() {
  var elem = document.getElementById(this.contentRoot.domElemId());
  elem.innerHTML = 'empty refresh function';
}

myTree_class.prototype.openAt = function(contentPath,sep) {
  if (sep == undefined) sep = '|';
  var parts = contentPath.split(sep);
  var nd = this.contentRoot;
  for (var i=0;i<parts.length;i++) {
    nd = nd.getChild(parts[i]);
    if (nd.private_canToggle() && !nd.private_isOpen) nd.toggle();
  }
}

/*
 *  class treeManager
 */

function myTreeManager_class() {
  this.locked = false;
  this.treeList = {};
}

myTreeManager_class.prototype.registerTree = function(myTree,mayOverwrite) {
  if (mayOverwrite == false && this.treeList[myTree.treeName] != undefined) {
    alert('error: tree ' +myTree.treeName+' already exists');
    return;
  }
  this.treeList[myTree.treeName] = myTree;
}

myTreeManager_class.prototype.getTreeByName = function(name) {
  return this.treeList[name];
}

myTreeManager_class.prototype.lock = function() {
  this.locked = true;
}

myTreeManager_class.prototype.unlock = function() {
  this.locked = false;
}

var myTreeManager = new myTreeManager_class();

