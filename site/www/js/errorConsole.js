function errorConsole_class() {
  this.messages = [];
  this.newErrors = 0;
}

errorConsole_class.prototype.contentHtml = function() {
  return this.messages.join('<br/>');
}

errorConsole_class.prototype.createConsole = function(minimized) {
  var elem = document.createElement('div');
  elem.id = 'ERROR_CONSOLE_CONTAINER';
  elem.style.position = "fixed";
  elem.style.zIndex = 1000000;
  elem.style.right = "5%";
  elem.style.bottom = "0px";
  elem.style.color = "#FFF";
  elem.style.background = "#DDD";
  elem.style.border = "2px solid #888";
  elem.style.borderBottom = "0px";
  elem.style.BorderRadius = "6px 6px 0px 0px";
  elem.style.MozBorderRadius = "6px 6px 0px 0px";
  elem.innerHTML = 
    '<div id="ERROR_CONSOLE_TITLE" style="width: 100%; height: 2em; padding: 3px">'+
    '<b id="ERROR_CONSOLE_SUMMARY"></b>'+
    '<span style="float: right">'+
    '<input id="ERROR_CONSOLE_TOGGLE" type="button" value="_" onclick="globalErrorConsole.toggle(this)" style="font-size: 67%; font-weight: bold"/>'+
    '<input type="button" value="X" onclick="globalErrorConsole.close(this)" style="font-size: 67%; font-weight: bold"/></span>'+
    '</div><iframe name="ERROR_CONSOLE_IFRAME" id="ERROR_CONSOLE_IFRAME" src="../js/errorConsole.html" style="width: 100%; border: 0px;"/>';
  browser.document().firstChild.appendChild(elem);
}

errorConsole_class.prototype.close = function() {
  var elem = document.getElementById('ERROR_CONSOLE_CONTAINER');
  elem.style.display = "none";
}

errorConsole_class.prototype.toggle = function(callerElem,minimized) {
  var containerElem = document.getElementById('ERROR_CONSOLE_CONTAINER');
  var contentIFrame = document.getElementById('ERROR_CONSOLE_IFRAME');
  if (callerElem == undefined) callerElem = document.getElementById('ERROR_CONSOLE_TOGGLE');
  if (minimized == undefined) minimized = !this.minimized;
  if (minimized) {
    contentIFrame.style.display = "none";
    containerElem.style.width = "25%";
    containerElem.style.height = null;
    callerElem.value = String.fromCharCode(9723);
    summaryElem = document.getElementById('ERROR_CONSOLE_SUMMARY');
    var nM = this.messages.length;
    if (nM == 0) summaryElem.innerHTML = 'Error console';
    else summaryElem.innerHTML = nM+' message'+(nM>1 ? 's' : '')+'; '+this.newErrors+' new';
  } else {
    containerElem.style.width = "75%";
    containerElem.style.background = '#DDD';
    containerElem.style.color = '#B00';
    contentIFrame.style.display = 'block';
    contentIFrame.style.height = "400px";
    callerElem.value = '_';
    this.newErrors = 0;
    summaryElem = document.getElementById('ERROR_CONSOLE_SUMMARY');
    summaryElem.innerHTML = 'Error console';
  }
  containerElem.style.display = "block";
  this.minimized = minimized;
}

errorConsole_class.prototype.addError = function(msg,data) {
  this.messages.unshift(msg);
  this.newErrors++;
  var consoleWindow = window.ERROR_CONSOLE_IFRAME;
  if (consoleWindow == undefined) {
    this.createConsole(0);
    consoleWindow = window.ERROR_CONSOLE_IFRAME;
    // automatically calls globalErrorConsole.display
  }
  if (consoleWindow.document.getElementById('ERROR_CONSOLE_CONTENT')) globalErrorConsole.display();
}

errorConsole_class.prototype.display = function() {
  var contentElem = window.ERROR_CONSOLE_IFRAME.document.getElementById('ERROR_CONSOLE_CONTENT');
  contentElem.innerHTML = this.contentHtml();
  containerElem = document.getElementById('ERROR_CONSOLE_CONTAINER');
  containerElem.style.background = '#B00';
  containerElem.style.color = '#FFF';
  this.toggle(null,this.minimized);
}

var globalErrorConsole = new errorConsole_class();