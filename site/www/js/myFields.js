/*
 * myField
 */

function myField(key,label) { this.key = key; this.label = label; }

// html code to display field within a table cell
myField.prototype.cellHtml = function(data) { return this.label; } // private

// html code to display field within a table row
myField.prototype.rowHtml = function(data) { return '<td colspan="4">'+this.cellHtml()+'</td>'; } // public

// format as displayed (html)
myField.prototype.displayFormat = function(val) { return val; } // public

// format as stored in database
myField.prototype.rawFormat = function(val) { return val; } // public

// get field value, entered by user
myField.prototype.getValue = function() {} // private

// set field value, seen by user
myField.prototype.setValue = function(val) {} // private

// add field value to formData
myField.prototype.pushValues = function(formData) {} // public

// add field default to formData
myField.prototype.pushDefaults = function(formData) {} // public

// called when focus moves to other field
myField.prototype.validate = function() { return true; } // public

// called when form opens
myField.prototype.activate = function(data) {} // public

myField.prototype.update = function() {} // public

var myField_onfocus = function() {
  var me = this.myField;
  var ok = myFormManager.activeForm.moveFocus(me);
  if (ok) me.update();  
}

/*
 * myField:Info
 * displays [label | value | unit] OR [value | unit] OR [value]
 * value can be provided by attr.value, or later by form.data[key]
 */

function myInfoField(key,attr) {
  if (!key) return;
  // attr: ..., info
  this.info = attr.info;
  this.unit = attr.unit || '';
  myField.apply(this,[key,attr.label]);
}
myInfoField.prototype = new myField();

myInfoField.prototype.cellHtml = function() {
  var val = (this.info == undefined ? '' : this.info);
  return '<span id="MYFORM_FIELD_'+this.key+'" type="text" + style="width: ' +(6*this.size+8)+'px">'+val+'</span>';  
}

myInfoField.prototype.rowHtml = function() {
  var ans = '';
  if (this.label != undefined) ans += '<td>'+this.label+'<td> : <td>';
  else if (this.unit != undefined) ans += '<td colspan="3">'
  else ans += '<td colspan="4">';
  ans += this.cellHtml();
  if (this.unit) ans += '<td>&nbsp;'+this.unit+'</td>';
  return ans;
}

myInfoField.prototype.setValue = function(val) {
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  elem.innerText = this.displayFormat(val);
}

/*
 * myField:Text 
 */

function myTextField(key,attr) {
  if (!key) return;
  // attr: label, noval, unit, size
  myField.apply(this,[key,attr.label || key]);
  this.noval = attr.noval || null;
  this.unit = attr.unit || '';
  this.size = attr.size || 20;
}
myTextField.prototype = new myField();

myTextField.prototype.cellHtml = function() {
  return '<input id="MYFORM_FIELD_'+this.key+'" type="text" + style="width: '+(6*this.size+8)+'px">';  
}

myTextField.prototype.helpHtml = function() {
//  return '<a class="mf_help" href="javascript:void(0)">?</a>';
  return '';
}

myTextField.prototype.rowHtml = function() {
  return '<td>'+this.helpHtml()+'</td><td>'+this.label+'</td><td> : </td><td>'+this.cellHtml()+(this.unit ? '&nbsp;'+this.unit : '')+'</td>';
}


myTextField.prototype.getEnteredValue = function() { 
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  return elem.value; 
}

myTextField.prototype.getValue = function() { 
  return this.rawFormat(this.getEnteredValue()); 
}

myTextField.prototype.setValue = function(val) { 
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  elem.value = this.displayFormat(val);
}

myTextField.prototype.pushValues = function(formData) { formData[this.key] = this.getValue(); }

myTextField.prototype.pushDefaults = function(formData) { formData[this.key] = this.noval || ''; }

myTextField.prototype.activate = function(data) {
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  elem.myField = this;
  elem.onfocus = myField_onfocus;
  this.setValue(data[this.key] || this.noval || '');
}

myTextField.prototype.showSuggestions = function(suggestions,sep, instanceId) {
  if (suggestions == false && instanceId != undefined) {
    var fastSuggest = instanceManager.get(instanceId);
  } else {
    var fastSuggest = new fastSuggest_class(suggestions,sep,'myField_'+this.key);
  }
  fastSuggest.attachTo('MYFORM_FIELD_'+this.key);
  fastSuggest.showList(this.getEnteredValue());
}

/*
 * myTextField:Number 
 */

function myNumberField(key,attr) {
  if (!key) return;
  // attr: ..., minval, maxval, whitelist
  this.min = attr.minval;
  this.max = attr.maxval;
  this.whitelist = attr.whitelist;
  myTextField.apply(this,[key,attr]);
}
myNumberField.prototype = new myTextField();

myNumberField.prototype.whiteListed = function(val) {
  if (val=='') return true;
  if (this.whitelist != undefined) {
    re = new RegExp('('+this.whitelist+')+','g');
    cleanVal = String(val).replace(re,'');
    return (cleanVal != String(val));
  }
  return false;
}

myNumberField.prototype.rawFormat = function(val) {
  return (this.whiteListed(val) ? val : Number(val));
}

myNumberField.prototype.displayFormat = function(val) {
  return String(val);
}

myNumberField.prototype.validate = function() {
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  var newval = this.getValue();
  if (!this.whiteListed(newval)) {
    if (isNaN(newval)) { 
      myFormError("Value '"+elem.value+ "' is invalid for field '"+this.label+"'.");
    }
    if (this.min != undefined && newval < this.min) {
      myFormError("Value '"+newval+ "' is too low for field '"+this.label+"'."); 
    }
    if (this.max != undefined && newval > this.max) { 
      myFormError("Value '"+newval+ "' is too high for field "+this.label+"'."); 
    }
  }
  return !myFormError();
}


/* 
 * myNumberField:Integer 
 */

function myIntField(key,attr) {
  myNumberField.apply(this,[key,attr]);
  if (attr.size == undefined) this.size = String(this.max).length;
}
myIntField.prototype = new myNumberField();

myIntField.prototype.rawFormat = function(val) {
  return (this.whiteListed(val) ? val : parseInt(val,10));
}


/*
 * myTextField:TextArea 
 */

function myTextAreaField(key,attr) {
  // attr: unit not used
  myTextField.apply(this,[key,attr]);
  if (attr.lines == undefined) this.lines = 4; 
  else this.lines = attr.lines;
}
myTextAreaField.prototype = new myTextField();

myTextAreaField.prototype.activate = function(data) {
  myTextField.prototype.activate.apply(this,[data]);
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  elem.onkeydown = browser.cancelBubble;
}

myTextAreaField.prototype.getValue = function() { 
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  return browser.textareaValue(elem);
}

myTextAreaField.prototype.setValue = function(val) { 
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  elem.innerHTML = val; 
}

myTextAreaField.prototype.cellHtml = function() {
  return '<textarea rows="'+this.lines+'" style="width: '+(6*this.size+8)+'px" id="MYFORM_FIELD_' +this.key+ '"></textarea>';
}


/*
 * myTextField:Pwd 
 */

function myPwdField(key,attr) {
  // attr: format replaces unit
  attr.unit = attr.format;
  myTextField.apply(this,[key,attr]);
}
myPwdField.prototype = new myTextField();

myPwdField.prototype.cellHtml = function() {
  return '<input id="MYFORM_FIELD_'+this.key+'" type="password" + style="width: '+(6*this.size+8)+'px">';  
}


/* 
 * myTextField:File 
 */

function myFileField(key,attr) {
  // attr: unit, size not used, maxfilesize added
  myTextField.apply(this,[key,attr]);
  this.maxfilesize = (attr.maxfilesize ? attr.maxfilesize : 500000); 
}
myFileField.prototype = new myTextField();

myFileField.prototype.cellHtml = function() {
  var ans = '<input id="MAX_FILE_SIZE" value="'+this.maxfilesize+'" type="hidden">'+
    '<input name="MYFORM_FIELD_'+this.key+'" id="MYFORM_FIELD_'+this.key+'" type="file">';
  return ans;  
}

myFileField.prototype.rawFormat = function(val) {
  return val.replace(/\\/g,"\\\\");
}


/*
 * myTextField:Select 
 */

function mySelectField(key,attr) {
  // attr: ..., options
  myTextField.apply(this,[key,attr]);
  var optKeys = [];
  var optLabels = [];
  for (var k in attr.options) { 
    var o = attr.options[k];
    if (typeof o == 'object') {
      for (var m in o) if (o.hasOwnProperty(m)) { optKeys.push(m); optLabels.push(o[m]); }
    } else { 
      optKeys.push(o); 
      optLabels.push(o); 
    };
  }
  this.setOptions(optKeys,optLabels);
}
mySelectField.prototype = new myTextField();

mySelectField.prototype.setOptions = function(optKeys,optLabels) {
  this.optKeys = [undefined].concat(optKeys);
  this.optLabels = ['Choose...'].concat(optLabels);
}

mySelectField.prototype.cellHtml = function() {
  var ans = '<select id="MYFORM_FIELD_' +this.key+ '">';
  var len = this.optKeys.length;
  for (var i=0;i<len;i++) {
    oclass = '';
    if (this.optKeys[i] == undefined) { oclass = ' class="empty"'; }
    if (String(this.optKeys[i]) == '') { oclass = ' class="comment"'; }
    ans += '<option' +oclass+ '>' +this.optLabels[i]; 
  }
  ans +=  '</select>';
  return ans;
}

mySelectField.prototype.getValue = function() {
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  return this.optKeys[elem.selectedIndex];
}

mySelectField.prototype.setValue = function(val) {
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  var o = 0;
  var len = this.optKeys.length;
  for (var i=0; i<this.optKeys.length; i++) { if (this.optKeys[i] == val) { o = i; break; } }
  elem.selectedIndex = o;
}

/*
 * myTextField:Check 
 */

function myCheckField(key,attr) {
  myTextField.apply(this,[key,attr]);
}
myCheckField.prototype = new myTextField();

myCheckField.prototype.cellHtml = function() {
  return '<input id="MYFORM_FIELD_'+this.key+'" type="checkbox">'+this.label;  
}

myCheckField.prototype.rowHtml = function() {
  return '<td>'+this.helpHtml()+'</td><td></td> &nbsp; <td colspan="2">' +this.cellHtml()+'</td>';
}

myCheckField.prototype.getValue = function() { 
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  return Number(elem.checked); 
}

myCheckField.prototype.setValue = function(val) { 
  var elem = document.getElementById('MYFORM_FIELD_'+this.key);
  elem.checked = Number(val); 
}

/*
 * myFieldArray

function myFieldArray(label,fields) { 
  myField.apply(this,[label]);
  this.fields = fields; 
}
myFieldArray.prototype = new myField();

myFieldArray.prototype.cellHtml = function() { 
  var f = this.fields;
  for (var i=0;i<f.length;i++) { ans += f[i].label+' '+f[i].cellHtml(); }
  return ans;
}

myFieldArray.prototype.rowHtml = myTextField.prototype.rowHtml;

myFieldArray.prototype.pushValues = function(formData) {
  var f = this.fields;
  for (var i=0;i<f.length;i++) { f[i].pushValues(formData); }
}

myFieldArray.prototype.pushDefaults = function(formData) {
  var f = this.fields;
  for (var i=0;i<f.length;i++) { f[i].pushDefaults(formData); }
}

myFieldArray.prototype.validate = function() { 
  var f = this.fields;
  for (var i=0;i<f.length;i++) f[i].validate();
  return !myFormError(); 
}

myFieldArray.prototype.activate = function(data) {
  var f = this.fields;
  for (var i=0;i<f.length;i++) { f[i].activate(data); }
}
*/
