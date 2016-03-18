// avoid circular references, see
// http://www.bazon.net/mishoo/articles.epl?art_id=824

/*
 * myForm
 */

function myForm_class(formName) {
  if (!formName) { alert('myForm_class requires a non-empty formName'); return; }
  // form fields and buttons
  this.formName = formName;
  this.fields = [new myField('empty form')];
  this.data = new Object();
  this.buttons = {ok: 'OK', hide: 'Cancel'};
  this.cmdEnter = 'ok';
  this.cmdClose = '';
  this.activeField = undefined;
  this.formWindow = undefined;
  myFormManager.registerForm(this);
}


myForm_class.prototype.callerId = function(dataLink) {
  return 'myFormList['+this.formName+']:' +(dataLink == undefined ? '' : dataLink);
}

// attributes to invoke this form from a html element
myForm_class.prototype.callerAttr = function(dataLink,anchorId) {
  var callerId = this.callerId(dataLink);
  var formName = this.formName;
  return {
    id: callerId,
    language: 'javascript',
    onmouseover: function() { myFormMouseover(callerId); },
    onmouseout: function() { myFormMouseout(callerId); },
    onclick: function() { myFormOpen(formName,callerId,anchorId); }
  }
}

// html code to invoke this form from a html element
myForm_class.prototype.callerHtml = function(dataLink,anchorId) {
  var callerId = this.callerId(dataLink);
  var myStyle = 'background-image: url(/img/myformcorner.gif); background-position: bottom right; background-repeat: no-repeat';
  var ans = 
   'style="' +myStyle+ '" ' +
   'id="' +callerId+ '" ' +
   'language="javascript" ' +
   'onmouseover="myFormMouseover(\''+callerId+'\')" ' +
   'onmouseout="myFormMouseout(\''+callerId+'\')" ' +
   'onclick="myFormOpen(\''+this.formName+'\',\''+callerId+'\',\''+anchorId+'\')"';
  return ans;
}

// html code to invoke this form from a link
myForm_class.prototype.linkHtml = function(dataLink,anchorId) {
//  if (this.autoId == undefined) throw('myForm_class.linkHtml: form not registered');
  var callerId = this.callerId(dataLink);
  var ans = 
   'id="' +callerId+ '" ' +
   'class="myFormLink" ' +
   'onclick="myFormOpen(\''+this.formName+'\',\''+callerId+'\',\''+anchorId+'\')"';
  return ans;
}

// html code to show the form and its fields
myForm_class.prototype.formHtml = function() {
  var ans = '<form id="MYFORM_HTMLFORM"><table class="myForm"><tr><td>';
  ans += '<table>';
  for (var i=0;i<this.fields.length;i++) 
    { ans += '<tr>'+this.fields[i].rowHtml(); }
  ans += '</table>';
  ans += '<tr><td><div align="center">';
  var d = this.cmdClose;
  for (var b in this.buttons) {
    var txt = this.buttons[b];
    ans += '<input type="button" '+
      (b==d ? 'style="font-weight: bold" ' : '')+
      'value="'+txt+'" onclick="myFormSubmit(\''+b+'\')">&nbsp;&nbsp;&nbsp;';
  }
  ans += '</div></table></form>';
  return ans;
}

// (re-)init fields and data
myForm_class.prototype.init = function(cmd) { }

// action taken when form is submitted
myForm_class.prototype.callback = function(fv,cmd) { alert('Empty callback function'); }

// action taken just after form is created from html code
myForm_class.prototype.activate = function() {
  var f = this.fields;
  for (var i=0;i<f.length;i++) f[i].activate(this.data);
}

// put focus on first form field
myForm_class.prototype.firstFocus = function() {
  this.activeField = undefined;
  var f = this.fields;
  var firstElem = undefined;
  for (var i=0;i<f.length;i++) {
    var e = document.getElementById('MYFORM_FIELD_'+f[i].key);
    if (e && e.onfocus) { firstElem = e; break; }
  }
  if (firstElem) firstElem.focus();
}

// get values of form fields
myForm_class.prototype.getFieldValues = function() { 
  var f = this.fields;
  var fd = new Object();
  for (var i=0;i<f.length;i++) f[i].pushValues(fd);
  return fd;
}

// set value of a single form field
myForm_class.prototype.setFieldValue = function(key,val) {
  var f = this.fields;
  for (var i=0;i<f.length;i++) { if (f[i].key == key) f[i].setValue(val); }
}

myForm_class.prototype.update = function(cmd) {
  // init fields and data
  this.init(cmd);
  // display form
  var callerElem = document.getElementById(this.callerId(this.dataLink));  
  this.formWindow.render(callerElem,this.formHtml());
  // add behavior
  this.activate();
}

myForm_class.prototype.moveFocus = function(toField) {
  var fromField = this.activeField;
  if (fromField) {
    if (!fromField.validate()) {
      this.activeField = undefined;
      myFormManager.catchError(); 
      var elem = document.getElementById('MYFORM_FIELD_'+fromField.key);
      elem.focus(); 
      return false;
    }
  }
  this.activeField = toField;
  return true;
}

myForm_class.prototype.open = function(callerId,anchorId) {
  this.formWindow = new myFormWindow_class("myForm",anchorId);
  // store callerId and dataLink
  this.dataLink = callerId.substr(callerId.indexOf(']:')+2);
  // update form
  this.update();
}

myForm_class.prototype.submit = function(cmd) {
  if (!cmd) cmd = this.cmdClose;
  if (cmd) return this.callback(this.getFieldValues(),cmd);
}

/*
 * myFormWindow
 * extends myMenu::divWindow_class
 */
 
function myFormWindow_class(windowName,anchorElemId) {
  divWindow_class.apply(this,[windowName,anchorElemId]);
}
myFormWindow_class.prototype = new divWindow_class();

myFormWindow_class.prototype.addStyle = function(divElem) {
  divElem.className = 'myFormWindow';
}

myFormWindow_class.prototype.addBehavior = function(divElem) {
  divElem.onkeydown = myFormKeyPressed;
}

/*
 * myFormManager 
 */

function myFormManager_class() {
  this.callerId = undefined;
  this.activeForm = undefined;
  this.errStr = '';
  this.locked = false;
  this.formList = Array();
}

myFormManager_class.prototype.registerForm = function(myForm) {
  this.formList[myForm.formName] = myForm;
}

myFormManager_class.prototype.getFormByName = function(name) {
  return this.formList[name];
}

myFormManager_class.prototype.updateForm = function(cmd) {
  // load form in window
  this.activeForm.update(cmd);
}

myFormManager_class.prototype.openForm = function(formName,callerId,anchorId) {
  if (this.isLocked()) return;
  // close active form
  if (this.activeForm && !this.submitForm()) return;

  // load form in window
  var targetForm = this.formList[formName];
  this.activeForm = targetForm;
  this.callerId = callerId;
  targetForm.open(callerId,anchorId);
}

myFormManager_class.prototype.submitForm = function(cmd) {
  if (this.isLocked()) return;
  // hide immediately?
  if (!cmd) cmd = this.activeForm.cmdClose || 'hide';
  if (cmd == 'hide') return this.hideWindow();
  
  // validate last edited field
  if (!this.activeForm.moveFocus()) return false;

  // delegate to activeForm
  this.activeForm.submit(cmd);
  return !this.catchError();
}

myFormManager_class.prototype.hideWindow = function() {
  if (this.isLocked()) return;
  this.activeForm.formWindow.hide();

  var elem = document.getElementById(this.callerId);
  if (elem) {
    var i = (elem.className ? elem.className.indexOf(' myFormMouseover') : -1);
    if (i>-1) elem.className = elem.className.substr(0,i);
  }
  // restore empty state
  this.callerId = undefined;
  this.activeForm = undefined;
  
  return true;
}

myFormManager_class.prototype.keyPressed = function(ev) {
  var kc = browser.getKeyCode(ev)
  if (kc == 13) {
    browser.cancelEvent(ev);
    this.submitForm(this.activeForm.cmdEnter);
  } else if (kc == 27) {
    browser.cancelEvent(ev);
    this.hideWindow();
  }
}

myFormManager_class.prototype.throwError = function(s) {
  if (s) this.errStr += s+'\n';
  return this.errStr;
}

myFormManager_class.prototype.catchError = function() {
  s = this.errStr;
  this.errStr = '';
  if (s) { alert(s); return true; }
  else return false;
}

myFormManager_class.prototype.mouseover = function(id) {
  var elem = document.getElementById(id);
  if (elem.className == undefined) elem.className = 'myFormMouseover';
  else elem.className += ' myFormMouseover';
}

myFormManager_class.prototype.mouseout = function(id) {
  var elem = document.getElementById(id);
  if (elem.id != this.callerId) { 
    if (elem.className) {
      if (elem.className == 'myFormMouseover') elem.className = undefined;
      else { 
        var i = elem.className.indexOf(' myFormMouseover');
        if (i>-1) { elem.className = elem.className.substr(0,i); }
      }
    }
  }
}

myFormManager_class.prototype.isLocked = function() {
  if (this.locked) {
    alert('Waiting for server response...');
    return true;
  } else return false;
}

myFormManager_class.prototype.lock = function() {
  this.locked = true;
}

myFormManager_class.prototype.unlock = function() {
  this.locked = false;
}

myFormManager_class.prototype.feedbackResponseHandler = function(fb) {
  this.unlock();
  if (fb == undefined) { this.hideWindow(); return; }
  if (fb.errors && fb.errors[0] != undefined) {
    alert(fb.errors.join('\n'));
  } else {
    if (fb.warnings && fb.warnings[0] != undefined) alert('Warning:\n'+fb.warnings.join('\n'));
    if (fb.report && fb.report[0] != undefined) alert('\n'+fb.report.join('\n'));
    this.hideWindow();
  }
}

/*
 * global myForms functions
 */

var myFormManager = new myFormManager_class();

function myFormLink(myForm,dataLink,anchorId) { return myForm.linkHtml(dataLink,anchorId); }
function myFormHtml(myForm,dataLink,anchorId) { return myForm.callerHtml(dataLink,anchorId); }

function myFormOpen(formName,callerId,anchorId) { myFormManager.openForm(formName,callerId,anchorId); }

function myFormSubmit(cmd) { myFormManager.submitForm(cmd); }
function myFormLock() { myFormManager.lock(); }
function myFormUnlock() { myFormManager.unlock(); }
function myFormUpdateForm(cmd) { myFormManager.updateForm(cmd); }
function myFormHide() { return myFormManager.hideWindow(); }

function myFormKeyPressed(ev) { return myFormManager.keyPressed(ev); }
function myFormMouseover(id) { return myFormManager.mouseover(id); }
function myFormMouseout(id) { return myFormManager.mouseout(id); }
function myFormError(s) { return (s ? myFormManager.throwError(s) : myFormManager.errStr); }
function myFormCatchError(s) { if (s) myFormManager.throwError(s); return myFormManager.catchError(); }
