// simple things to simplify:
// make menuBar standard item of panel

browser.include_script_once('../shared-js/json.js');
browser.include_script_once('../shared-js/jsonRequest.js');
browser.include_script_once('../shared-js/sprintf.js');
browser.include_style_once('../shared-css/dbViewer.css');

function dbViewer_class(instanceName,dbResponse,dbLayout,elemId,dbCallback) {
  if (instanceName == null) return;
  this.instanceName = instanceName;

  this.dbLayout = dbLayout;
  this.dbTables = [];
  try {
    this.addTables(dbResponse.tables);
  } catch (e) {
    this.error(e);
  }
  
  // the address of the service that will send additional data on request
  if (!dbCallback) {
    dbCallback = document.location.href;
    qpos = dbCallback.indexOf('?');
    dbCallback = dbCallback.substr(0,qpos);
  }
  this.dbCallback = dbCallback;
  
  /*
   * The panel tree contains nested table views
   */
  this.panels = [];
  if (elemId) {
    // display response table
    var elem = document.getElementById(elemId);
    var dbTable = this.dbTables[dbResponse.resultTable];
    var panel = new dbTPanel_class('root',dbTable,this,elem);
    elem.innerHTML = 'If you see this, the page does not display properly.';
    panel.render(dbResponse.resultKeys,dbResponse.resultCount);
  }
}

dbViewer_class.prototype.addTables = function(responseTables) {
  var dbTables = this.dbTables;
  var newTables = [];
  for (var name in responseTables) {
    var T = responseTables[name];
    if (!dbTables[name]) {
      dbTables[name] = new dbTable_class(name,T,this);
      newTables.push(name);
    } else {
      for (var k in T.data) {
        dbTables[name].data[k] = T.data[k];
      }
      for (var c in T.collections) {
        var Tccc = T.collections[c].count;
        for (var k in Tccc) dbTables[name].collections[c].count[k] = Tccc[k];
      }
    }
  }

  // init table relations
  for (var i=0; i<newTables.length; i++) {
    var name = newTables[i];
    this.dbTables[name].initLinks();
  }
}

dbViewer_class.prototype.error = function(msg) {
  alert('dbViewer error: '+msg);
}

dbViewer_class.prototype.addPanel = function(panel) {
  var id = this.panels.length;
  this.panels.push(panel);
  return id;
}

dbViewer_class.prototype.toggleRow = function(panelId,key,callerElem) {
  var panel = this.panels[panelId];
  panel.expandRow(key,callerElem);
}

dbViewer_class.prototype.openMenu = function(panelId,callerElem) {
  var panel = this.panels[panelId];
  panel.openMenu(callerElem);
}


dbViewer_class.prototype.expandOutlink = function(panelId,field,value,callerElem) {
  var panel = this.panels[panelId];
  panel.expandOutlink(field,value,callerElem);
}

dbViewer_class.prototype.collapseOutlink = function(panelId,field,value,callerElem) {
  var panel = this.panels[panelId];
  panel.collapseOutlink(field,value,callerElem);
}

dbViewer_class.prototype.expandInlink = function(panelId,inlink,key,callerElem) {
  var panel = this.panels[panelId];
  panel.expandInlink(inlink,key,callerElem);
}

dbViewer_class.prototype.collapseInlink = function(panelId,inlink,key,callerElem) {
  var panel = this.panels[panelId];
  panel.collapseInlink(inlink,key,callerElem);
}

dbViewer_class.prototype.expandXY = function(panelId,x,y,callerElem) {
  var panel = this.panels[panelId];
  panel.expandXY(x,y,callerElem);
}



/*** 
 *** dbTable class 
 ***/
dbTable_class.prototype.custom_asCell = {};
dbTable_class.prototype.custom_asItem = {};
function dbTable_class(name,T,viewer) {
  this.name = name;
  for (var k in T) {  
    this[k] = T[k];
  }
  this.viewer = viewer;
  this.layout = viewer.dbLayout[name];
  // create field-by-index lookup table
  var fields = this.fields;
  var f2i = {};
  for (var i in fields) {
    f2i[fields[i]] = i;
  }
  this.field2idx = f2i;

  // customized row display
  var custom_asCell = this.custom_asCell;
  if (custom_asCell[name]) {
    this.asCell = custom_asCell[name];
  }
  var custom_asItem = this.custom_asItem;
  if (custom_asItem[name]) {
    this.asItem = custom_asItem[name];
  }
}

/*
 * initLinks must be called before using .row()
 */
dbTable_class.prototype.initLinks = function() {
  this.outLinks = {};
  for (var f in this.links) {
    this.outLinks[f] = this.viewer.dbTables[this.links[f]];
  }
}

/*
 * returns an object that represents a single table row
 */
dbTable_class.prototype.row = function(key) {
  return new dbRow_class(key,this);
}

/*
 * to be called from a dbRow_class object
 */
dbTable_class.prototype.asCell = function(R) {
  var spec = this.layout.asCell;
  if (spec) {  
    var args = [];
    for (var i in spec.fields) {
      var k = spec.fields[i];
      var v = R.field(k);
      args.push(spec.links[k] != undefined ? R.lnk[k].failsafe_asCell(v) : v);
    }
    return spec.format ? vsprintf(spec.format,args) : args.join(',');
  }
  return R.key;
}

dbTable_class.prototype.failsafe_asCell = function(key) {
  try {
    var R = this.row(key,this);
    return this.asCell(R);
  } catch(e) {
    return 'error (key='+key+', error'+e+')';
  }
}

dbTable_class.prototype.asItem = function(R) {
  return this.asCell(R)+'&nbsp;~&nbsp;'+this.name+'<small>&nbsp;['+R.key+']</small>';
}

dbTable_class.prototype.failsafe_asItem = function(key) {
  try {
    var R = this.row(key);
    return this.asItem(R);
  } catch(e) {
    return 'error (key='+key+')';
  }
}

/*
 * prepare a server request to load a table that links to this table
 */
dbTable_class.prototype.inlinkRequest = function(inlink,keyValue,limit) {
  var dotpos = inlink.indexOf('.');
  var ftable = inlink.substr(0,dotpos);
  var fkeys = inlink.substr(dotpos+1);
  fkeys = fkeys.split(',');
  limit = limit || 100;
  
  var keys = this.keys.split(',');
  var R = keyValue.split('|'); // e.g. BrainMap,Acronym
  var args = { "T": ftable };
  for (var c=0; c<fkeys.length; c++) {
    args['x'+c] = 'AND';
    args['L'+c] = '^'+fkeys[c]+'.'+keys[c];
    args['op'+c] = 'eq';
    args['R'+c] = R[c];
  };
  args['x0'] = 'WHERE'; // overwrite x0
  args['x'+(fkeys.length)] = ''; // set xEnd to '' (to indicate last constraint)
  args['limit'] = limit; // max. number of results to download
  args['rpc'] = 1; // this is a "remote procedure call"
  return new jsonRPC_class(this.viewer.dbCallback,args);
}

dbTable_class.prototype.inlinkLoadRequest = function(viewer, inlink,keyValue,limit) {
  // if data is already available, return empty request
  if (this.collections[inlink].keys[keyValue] != undefined) {
    // check whether results are already downloaded to the client
    var nServer = this.collections[inlink].count[keyValue];
    var nClient = this.collections[inlink].keys[keyValue].length;
    if (nServer <= nClient || nClient >= limit) return new jsonRPC_class();
  }
  // create ajax request  
  var req = this.inlinkRequest(inlink,keyValue,limit);
  // response handler
  var me = this;
  req.responseHandler = function(ans) { 
    // add new tables to the viewer (in so far the rows do not already exist)
    viewer.addTables(ans.tables);
    // store the resultKeys
    me.collections[inlink].keys[keyValue] = ans.resultKeys;
  }
  return req;
}


/***
 *** A dbRow is a dbTable property designed for easy customization
 ***/
dbRow_class = function(key,T) {
  this.key = key;  
  this.f2i = T.field2idx;
  this.lnk = T.outLinks;
  this.data = T.data[key];
}

// return field f of dbRow's data vector
dbRow_class.prototype.field = function(f) {
  return this.data[this.f2i[f]];
}

dbRow_class.prototype.iffield = function(f,pre,post) {
  var v = this.data[this.f2i[f]];
  return (v == undefined ? '' : pre+v+post);
}

dbRow_class.prototype.trunc = function(f,mx) {
  var v = this.data[this.f2i[f]];
  if (v.length>mx) v = v.substr(0,mx)+'...';
  return v;
}

dbRow_class.prototype.link = function(f) {
  return this.lnk[f].row(this.field(f));
}

dbRow_class.prototype.custom_niceValue = {};
dbRow_class.prototype.niceValue = function(f) {
  var v = this.field(f);
  if (this.custom_niceValue[f]) {
    return this.custom_niceValue[f].apply(this,[v]);
  }
  return v;
};


/***
 *** A Panel is a view of a table or table row
 ***/
function dbPanel_class(name,dbTable,parent,contentElem) {
  if (!name) return; // constructor with no arguments
  this.name = name;
  this.dbTable = dbTable;
  this.children = {};
  if (parent) {
    this.parent = parent;
    if (parent.viewer) {
      // parent is not the viewer
      parent.children[name] = this;
      this.viewer = parent.viewer;
    } else {
      this.viewer = parent;
    }
  }
  this.id = this.viewer.addPanel(this);
  if (contentElem) {
    if (!contentElem.id) contentElem.id = this.viewer.instanceName+'.'+this.id;
    this.contentElemId = contentElem.id;
  }  
}
dbPanel_class.prototype.contentElemId = null;
dbPanel_class.prototype._display = 'block';
dbPanel_class.prototype._hidden = false;
dbPanel_class.prototype.custom_menu = {};

dbPanel_class.prototype.childElem = function(callerElem,customClass,offsetLeft_px) {
  var op = callerElem.offsetParent; 
  // IE quirk, enclose all tables in style-free <div></div>
  if (op.tagName == 'TABLE') op = op.offsetParent;
  var elem = document.createElement('DIV');
  elem.className = (customClass ? customClass : 'db_item');
  elem.style.position = 'absolute';
  var left = callerElem.offsetLeft+offsetLeft_px+'px';
  elem.style.left = left;
  var top = callerElem.offsetTop+callerElem.offsetHeight+1+'px';
  elem.style.top = top;
  op.appendChild(elem);
  return elem;
}

dbPanel_class.prototype.underConstruction = function() {
  alert('under construction');
}

// calls the menu-action specified by path
dbPanel_class.prototype.menuAction = function(callerElem,path) {
  if (this.menuBar) this.menuBar.action(this,callerElem,path,-1);
}

dbPanel_class.prototype.openMenu = function(callerElem) {
  if (this.menuBar) this.menuBar.open(this,callerElem,'');
}

dbPanel_class.prototype.hide = function() {
  var contentElem = document.getElementById(this.contentElemId);
  if (contentElem) {
    this._display = contentElem.style.display;
    contentElem.style.display = 'none';
  }
  this._hidden = true;
}

dbPanel_class.prototype.unhide = function() {
  var contentElem = document.getElementById(this.contentElemId);
  if (contentElem) {
    contentElem.style.display = this._display;
  }
  this._hidden = false;
}

dbPanel_class.prototype.toggle = function() {
  this._hidden ? this.unhide() : this.hide();
}

dbPanel_class.prototype.close = function() {
  var contentElem = document.getElementById(this.contentElemId);
  if (contentElem) contentElem.parentNode.removeChild(contentElem);
  delete this.viewer.panels[this.id];
  for (var k in this.children) {
    this.children[k].close();
  }
}

dbPanel_class.prototype.toggleHtml = function(mode,onClick,disabled) {
  var instanceName = this.viewer.instanceName;
  return '<img src="../shared-css/'+mode+'sign.gif" style="padding: 1px; background: #00D" onclick="'+instanceName+'.'+onClick+'"/>&nbsp;';
/*
<img src="../shared-css/menusign.gif" style="padding: 1px; background: #00D" onclick="'+instanceName+'.openMenu('+this.id+',this)"/>&nbsp;
*/  
}


/***
 *** A dbMenu represents a level in the menu hierarchy
 ***/

function dbMenu_class(parent,tree) {
  this.parent = parent;
  this.tree = tree;
}

dbMenu_class.prototype.barHtml = function(panel,divClass) {
  var panelName = panel.viewer.instanceName+'.panels['+panel.id+']';
  var ans = ['<div class="db_menu '+divClass+'"><ul>'];
  for (var m in this.tree) {
    var onclick = panelName+'.menuAction(this,\''+m+'\')';
    ans.push('<li onclick="'+onclick+'" style="display:inline">'+m+'</li>');
  }
  ans.push('</ul></div>');
  return ans.join('&nbsp;');
}

dbMenu_class.prototype.action = function(panel,callerElem,path,sepPos0) {
  var sepPos = path.indexOf('|',sepPos0+1);
  if (sepPos > -1) {
    // go down the tree to find the proper action
    var key = path.substring(sepPos0+1,sepPos);
    // this.tree[key] contains a dbMenu_class item
    this.tree[key].action(panel,callerElem,path,sepPos);
  } else {
    var key = path.substr(sepPos0+1);
    if (this.menuElem) {
      this.menuElem.parentNode.removeChild(this.menuElem);
      this.menuElem = null;
      if (this.activeKey == key) {
        this.activeKey = null;
        return;
      }
    }
    var subMenu = this.tree[key];
    if (typeof(subMenu) == 'function') {
      // function with no arguments, pass only the callerElem
      subMenu.apply(panel,[callerElem]);
    } else if (typeof(subMenu[0]) == 'function') {
      // function with arguments
      subMenu[0].apply(panel,subMenu[1]);
    } else {
      if (!(subMenu instanceof dbMenu_class)) {
        subMenu = this.tree[key] = new dbMenu_class(this,this.tree[key]);
      }
      subMenu.open(panel,callerElem,path);
    }
    this.activeKey = key;
  }
}

// path should be the full path to this submenu
dbMenu_class.prototype.open = function(panel,callerElem,path) {
  var panelName = panel.viewer.instanceName+'.panels['+panel.id+']';
  ans = ['<ul>'];
  for (var m in this.tree) {
    var onclick = panelName+'.menuAction(this,\''+path+'|'+m+'\')';
    ans.push('<li onclick="'+onclick+'">'+m+'</li>');
  }
  ans.push('</ul>');
  var elem = panel.childElem(callerElem,'db_menu',1);
  elem.innerHTML = ans.join('');
  this.parent.menuElem = elem;
}


/***
 *** A TForm represents a form attached to a menu entry
 ***/
function dbTForm_class() {
  // CONTINUE HERE
}

/*
 * A TPanel is a view of an expanded table
 */
function dbTPanel_class(name,dbTable,parent,contentElem) {
  dbPanel_class.apply(this,[name,dbTable,parent,contentElem]);
}
dbTPanel_class.prototype = new dbPanel_class();
dbTPanel_class.prototype.activeRow = null;

dbTPanel_class.prototype.menuTree = function() {
  var menu = {
    "Add/Edit": {
      "Under construction": this.underConstruction
    },
    "Views": {
      "Table (default)": this.tableView,
      "Y vs. X": {
      }
    }
  }
    
  // include XY view only if table has two or more columns
  var T = this.dbTable;
  var numFields = T.fields.length;
  if (numFields >= 2) menu.Views['Y vs. X'] = [this.xyView,[0,1]];

  // customize the menu, depending on the table class
  var className = T.layout.class;
  if (className == undefined) className = T.name;
  var func = this.custom_menu[className];
  if (func) func.apply(this,[menu]);

  return menu;
}

/*
 * table display, including menu tree
 */
dbTPanel_class.prototype.defaultDisplay = function(keys) {
  this.keys = keys; // to support xyView()

  this.menuBar = new dbMenu_class(null,this.menuTree())
  var ans = [];
  ans.push(this.menuBar.barHtml(this,'db_menu'));
  ans.push('<div id="TPanelBody_'+this.id+'">'+this.tableView()+'</div>');

  return ans.join('');
}


/*
 * tableView
 */
dbTPanel_class.prototype.tableView = function(callerElem) {
  var keys = this.keys;
  var ans = [];
  ans.push('<div><table class="db_table">');
  var T = this.dbTable;
  var links = T.links;
  var row = [];
  var mx = 0;
  for (var f=0; f<T.fields.length; f++) {
    var field = T.fields[f];
    row.push(field);
    if (field.length>mx) mx = field.length;
  }
  // detect whether tables link into this multiple times
  var inlinks = {};
  for (var inlink in T.collections) {
    var dotpos = inlink.indexOf('.');
    var ftable = inlink.substr(0,dotpos);
    var fkey = inlink.substr(dotpos+1);
    if (!inlinks[ftable]) inlinks[ftable] = [];
    inlinks[ftable].push(fkey);
  }
  for (var ftable in inlinks) {
    fkeys = inlinks[ftable];
    if (fkeys.length > 1) {
      for (var i=0; i<fkeys.length; i++) row.push('#&nbsp;'+ftable+'|'+fkeys[i]);
    } else {
      row.push('#&nbsp;'+ftable);
    }
  }

  ans.push('<tr><td></td><th class="db_head" style="height: '+Math.round(1.125*mx)+'ex"><div class="db_oblique">'+row.join('</div></th><th class="db_head"><div class="db_oblique">')+'</div></th></tr>');
  var rowCount = 0;
  for (var k in keys) if (keys.hasOwnProperty(k)) {
    var key = keys[k];
    var R = T.row(key);
    row = [];
    for (var i=0; i<T.fields.length; i++) {
      var f = T.fields[i];
      var value = R.data[i];
      var outLink = T.outLinks[f];
      if (outLink) {
        value = ( value==null ? '' : outLink.failsafe_asCell(value) );
      } else {
        if (value && value.length>64 && T.layout['fields'][f].size > 64)  value = value.substr(0,64)+' (...)';
      }
      row.push(value);
    }
    for (var ftable in inlinks) {
      fkeys = inlinks[ftable];
      for (var i=0; i<fkeys.length; i++) {
        inlink = ftable+'.'+fkeys[i];
        var n = T.collections[inlink].count[key];
        if (n == undefined) row.push(' ')
        else if (n==0) row.push('-');
        else row.push('('+n+')');
      }          
    }
    var elemId = this.viewer.instanceName+'.'+(this.id)+'.'+key;
    ans.push('<tr id="'+elemId+'" class="db_row" onclick="'+this.viewer.instanceName+'.toggleRow(\''+(this.id)+'\',\''+key+'\',this)"><td class="db_key">'+key+'</td><td class="db_cell">'+row.join('</td><td class="db_cell">')+'</td></tr>');
    rowCount++;
    if (rowCount >= 1000) {
      ans.push('<tr class="db_row"><td></td><td class="db_cell" colspan="'+row.length+'"><i>Table truncated after 1000 rows</i></td></tr>');
      break;
    }
  }
  ans.push('</table></div>');
  
  if (callerElem) {
    document.getElementById('TPanelBody_'+this.id).innerHTML = ans.join('');
  } else {
    return ans.join('');
  }
}

/*
 * xyView
 */
dbTPanel_class.prototype.xyView = function(xIndex,yIndex) {
  var keys = this.keys;
  var ans = [];
  ans.push('<div><table class="db_table">');
  var T = this.dbTable;
  var fieldX = T.fields[xIndex];
  var linkX = T.outLinks[fieldX];
  var fieldY = T.fields[yIndex];
  var linkY = T.outLinks[fieldY];
  var M = [];
  var rowLabels = {};
  var colLabels = {};
  for (var k=0; k<keys.length; k++) {
    var key = keys[k];
    var td = T.data[key];
    var x = td[0];
    var y = td[1];
    rowLabels[x] = 1;
    colLabels[y] = 1;
    if (!M[x]) M[x] = [];
    if (!M[x][y]) M[x][y] = [];
    M[x][y].push(key);
  }
  row = [];
  var mx = 0;
  for (var y in colLabels) {
    var label = (linkY ? linkY.failsafe_asCell(y) : y);
    row.push(label);
    if (label.length>mx) mx = label.length;
  }
  ans.push('<tr><td></td><th class="db_head" style="height: '+Math.round(1.125*mx)+'ex"><div class="db_oblique">'+row.join('</div></th><th class="db_head"><div class="db_oblique">')+'</div></th></tr>');
  for (var x in rowLabels) {
    var row = [];
    Mx = M[x];
    for (var y in colLabels) {
      var value = Mx[y];
      if (value) {
        var onClick = this.viewer.instanceName+'.expandXY(\''+this.id+'\',\''+x+'\',\''+y+'\',this)';
        row.push('<td class="db_cell db_xy" onclick="'+onClick+'">'+value.length+'</td>');
      } else row.push('<td class="db_cell">-</td>');
    }
    var label = (linkX ? linkX.failsafe_asCell(x) : x);
    ans.push('<tr><th class="db_head">'+label+'</th>'+row.join('')+'</tr>');
  }
  this.M = M;
  ans.push('</table></div>');
  document.getElementById('TPanelBody_'+this.id).innerHTML = ans.join('');
}

dbTPanel_class.prototype.render = function(resultKeys,resultCount) {
  var contentElem = document.getElementById(this.contentElemId);
  var ans = '<h2 class="db">Table '+(this.dbTable.name)+' ('+(resultKeys.length+' of '+resultCount)+' results)</h2>';
  contentElem.innerHTML = ans+this.defaultDisplay(resultKeys);
}

dbTPanel_class.prototype.expandRow = function(key,callerElem) {
  // close the active row panel
  var rowPanel = this.activeRow;
  if (rowPanel) {
    var activeKey = rowPanel.name;
    rowPanel.close();
    this.activeRow = undefined;
    // toggle mode
    if (activeKey == key) return;
  }
  var elem = this.childElem(callerElem,'db_item',80);
  rowPanel = new dbRowPanel_class(key,this.dbTable,this,elem);
  this.activeRow = rowPanel.render(key);
}

dbTPanel_class.prototype.expandXY = function(x,y,callerElem) {
  var xyPanel = this.activeRow;
  var xyKey = x+'|'+y;
  if (xyPanel) {
    var activeKey = xyPanel.name;
    xyPanel.close();
    this.activeRow = undefined;
    // toggle mode
    if (activeKey == xyKey) return;
  }
  var elem = this.childElem(callerElem,'db_item db_xy',1);
  var xyPanel = new dbTPanel_class(xyKey,this.dbTable,this,elem);
  var keys = this.M[x][y];
  var ans = xyPanel.defaultDisplay(keys);
  elem.innerHTML = ans;
  this.activeRow = xyPanel;
}


/***
 *** A RowPanel is a view of an expanded row;
 ***/
function dbRowPanel_class(name,dbTable,parent,contentElem) {
  dbPanel_class.apply(this,[name,dbTable,parent,contentElem]);
}
dbRowPanel_class.prototype = new dbPanel_class();

// menu tree similar to that of TablePanel
dbRowPanel_class.prototype.menuTree = function() {
  var menu = {
    "Edit": {
      "Under construction": this.underConstruction
    },
    "Views": {
      "List (default)": this.listView
    }
  }
    
  // customize the menu, depending on the table class
  var T = this.dbTable;
  var className = T.layout.class;
  if (className == undefined) className = T.name;
  var func = this.custom_menu[className];
  if (func) func.apply(this,[menu]);

  return menu;
}

/*
 * default display: menu + listView
 */
dbRowPanel_class.prototype.defaultDisplay = function(key) {
  this.key = key;

  this.menuBar = new dbMenu_class(null,this.menuTree())
  var ans = [];
  ans.push('<div class="db_item_hdr">');
  ans.push(this.menuBar.barHtml(this,'db_rmenu'));
  ans.push('Table '+this.dbTable.name+',&nbsp;item&nbsp;\''+(this.name)+'\'</div>');
  ans.push('<div id="RowPanelBody_'+this.id+'">'+this.listView()+'</div>');

  return ans.join('');
}


// render the panel, including a styled div window
//dbRowPanel_class.prototype.render = function(callerElem) {
dbRowPanel_class.prototype.render = function(key) {
  var contentElem = document.getElementById(this.contentElemId);
  var ans = this.defaultDisplay(key);
  contentElem.innerHTML = ans;
  return this;
}

/*
 * returns HTML for detailed view of a table row
 */
dbRowPanel_class.prototype.listView = function(callerElem,key) {
  // hack
  if (key == undefined) key = this.key;
  
  var T = this.dbTable;
  var R = T.row(key);
  if (!R.data) {
    // the table has no row(key): error
    return '<div class="db_error">[error] : Table "'+(this.dbTable.name)+'" has no row '+key+'</div>';
  } 

  // list the properties
  var ans = ['<table class="dbNode"><col style="width: 5%"><col style="width: 1%"><col style="width: 95%">'];
  for (var i=0; i<T.fields.length; i++) {
    var f = T.fields[i];
    var link = T.links[f];
    if (link) {
      // this field is a foreign key

//alert(link);    
// now check whether ftable.row[link] exists?
// or should I do this at the outlinkSummary level?
// or when I render a RowPanel for the first time?
// at least I'll need a callerElem somewhere.
// http://localhost/cocomac/cocomac2/main/search_wizard.php?T=AxonalProjections_FV91&x0=&limit=100&page=1&format=dhtml
// Table AxonalProjections_FV91, item '94'
// Other option: assign auto-incrementing ID to unresolved element, e.g. <dbViewerName>_req123
      // subPanel gets created when link is expanded for the first time
      var subPanel = this.children[f];
      if (subPanel && !subPanel._hidden) {
        // expand the subPanel
        ans.push('<tr><td colspan="3">'+subPanel.outlinkDetail(R.data[i])+'</td></tr>');
      } else {
        ans.push('<tr><td colspan="3"><div>'+this.outlinkSummary(f,R.data[i])+'</div></td></tr>');
      };
    } else {
      ans.push('<tr><td class="db_label">'+f+'</td><td>:</td><td>'+this.asItem(R,f)+'</td>');
    }
  }
  var hasInlinks = false;
  for (var inlink in T.collections) { hasInlinks = true; break; }
  if (hasInlinks) {
    ans.push('<tr><td colspan="3"><div class="db_item_in"><i>Tables/fields linking into this item:</i>');
    for (var inlink in T.collections) {
      ans.push('<div>'+this.inlinkSummary(inlink,key)+'</div>');
    }
  } else {
    ans.push('<tr><td colspan="3"><div class="db_item_in"><i>No tables link into this item</i>');
  }
  ans.push('</div></td></tr></table>');
  
  if (callerElem) {
    document.getElementById('RowPanelBody_'+this.id).innerHTML = ans.join('');
  } else {
    return ans.join('');
  }
}

dbRowPanel_class.prototype.asItem = function(R,f) {
  var v = R.field(f);
  if (R.custom_niceValue[f]) {
    v = R.custom_niceValue[f].apply(R,[v]);
  } else {
    v = browser.htmlspecialchars(v);
    var layout = this.dbTable.layout;
    if (v && v.length>48 && layout['fields'][f].size > 64) {
      var height = (v.length > 196 ? 'height:6em;' : '');
      v = '<div class="db_longtext" style="'+height+'">'+v+'</div>';
    }
  }
  return v;
}


// returns HTML with outlink collapsed
dbRowPanel_class.prototype.outlinkSummary = function(field,value) {
  // outgoing link
  if (value === null) return '<img src="../shared-css/empty8.gif" style="padding: 1px; background: #00D"/> '+field+'&nbsp;(-)';
  var onClick = 'expandOutlink('+(this.id)+',\''+field+'\',\''+value+'\',this.parentNode)';
  var outLink = this.dbTable.outLinks[field];
  var descr = outLink.failsafe_asItem(value);
  //// here I can can check whether outLink has a valid value:
  //// if not, asItem returns an error message.
  //// this can be caused by (any descendant of) outLink.data[value] not being loaded, or not being available on the server
  //// If not on the server, the dbResponse returns a 
  return this.toggleHtml('plus',onClick)+field+'&nbsp;'+descr;
}

// returns HTML with outlink expanded
dbRowPanel_class.prototype.outlinkDetail = function(value) {
  var field = this.name;
  var descr = this.dbTable.failsafe_asItem(value);

  // panel refers to self
  var onClick = 'collapseOutlink('+(this.id)+',\''+field+'\',\''+value+'\',this.parentNode)';
  var value = this.listView(undefined,value);

  var ans = [];
  ans.push(this.toggleHtml('minus',onClick)+field+' '+descr);
  ans.push('<div style="margin-left:4px; padding-left: 2ex; border-left: 2px solid #eee">'+value+'</div>');
  return ans.join('');
}

dbRowPanel_class.prototype.expandOutlink = function(field,value,contentElem) {
  var subPanel = this.children[field];
  if (subPanel) {
    subPanel._hidden = false;
  } else {
    var link = this.dbTable.links[field];
    subPanel = new dbRowPanel_class(field,this.viewer.dbTables[link],this,contentElem);
  }
  var ans = subPanel.outlinkDetail(value);
  contentElem.innerHTML = ans;
}

// called on parent of the row panel to be deleted?
dbRowPanel_class.prototype.collapseOutlink = function(field,value,contentElem) {
  this._hidden = true;
  var ans = this.parent.outlinkSummary(field,value);
  contentElem.innerHTML = ans;
}

dbRowPanel_class.prototype.inlinkSummary = function(inlink,key) {
  // inLink consists of tableName.keyName
  var dotpos = inlink.indexOf('.');
  var ftable = inlink.substr(0,dotpos);
  var fkey = inlink.substr(dotpos+1);
  var numLinks = this.dbTable.collections[inlink].count[key];
  var descr = ftable+'&nbsp;|&nbsp;'+fkey;
  
  if (numLinks == undefined) {
    return '<img src="../shared-css/empty8.gif" style="padding: 1px; background: #00D"/> '+descr+'&nbsp;(-)';
  }
  
  var onClick = 'expandInlink('+(this.id)+',\''+inlink+'\',\''+key+'\',this.parentNode)';
  return this.toggleHtml('tee',onClick)+descr+'&nbsp;('+numLinks+')';
}

dbTPanel_class.prototype.inlinkDetail = function(parentKey,linkedKeys,keyCount) {
  var inlink = this.name;
  var dotpos = inlink.indexOf('.');
  var ftable = inlink.substr(0,dotpos);
  var fkey = inlink.substr(dotpos+1);
  var descr = ftable+' | '+fkey;
  
  var onClick = 'collapseInlink('+(this.id)+',\''+inlink+'\',\''+parentKey+'\',this.parentNode)';
  var ans = [];
  ans.push('<td colspan="3">'+this.toggleHtml('minus',onClick)+descr);
  ans.push('<div class="db_inlink">');
  if (linkedKeys == undefined) {
    ans.push('<img src="../shared-css/ajax-loader.gif">');
  } else {
    // panel refers to self
    if (keyCount > linkedKeys.length) ans.push('('+linkedKeys.length+' of '+keyCount+' results)<br/>');
    ans.push(this.defaultDisplay(linkedKeys));
  }
  ans.push('</div></td>');
  return ans.join('');
}

dbRowPanel_class.prototype.expandInlink = function(inlink,keyValue,contentElem) {
  // create ajax request
  var T = this.dbTable;
  var req = T.inlinkLoadRequest(this.viewer, inlink,keyValue);
  var me = this;  
  // req.resume is called after the response handler
  req.resume = function() { 
    var dotpos = inlink.indexOf('.');
    var ftable = inlink.substr(0,dotpos);      
    var subPanel = new dbTPanel_class(inlink,me.viewer.dbTables[ftable],me,contentElem);

    // render the result
    var linkedKeys = T.collections[inlink].keys[keyValue];
    var keyCount = T.collections[inlink].count[keyValue];
    contentElem.innerHTML = subPanel.inlinkDetail(keyValue,linkedKeys,keyCount);
  }
  req.submit();
}

dbTPanel_class.prototype.collapseInlink = function(inlink,key,callerElem) {
  this._hidden = true;
  var ans = this.parent.inlinkSummary(inlink,key);
  callerElem.innerHTML = ans;
}
