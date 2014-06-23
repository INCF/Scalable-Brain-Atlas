/*
 *  class instanceManager
 */

function instanceManager_class() {
  this.locked = false;
  this.list = {};
}

instanceManager_class.prototype.register = function(myInstance,instanceName,myClass) {
  if (instanceName == undefined) instanceName = Math.floor(Math.random()*1e9);
  if (myClass == undefined) myClass = '';
  var instanceId = (myClass+'::'+instanceName).toLowerCase();
  this.list[instanceId] = myInstance;
  return instanceId;
}

instanceManager_class.prototype.unregister = function(myInstance,instanceId) {
  delete this.list[instanceId.toLowerCase()];
}

instanceManager_class.prototype.get = function(instanceName,myClass) {
  var instanceId = (myClass == undefined ? instanceName : myClass+'::'+instanceName); 
  return this.list[instanceId.toLowerCase()];
}

instanceManager_class.prototype.lock = function() {
  this.locked = true;
}

instanceManager_class.prototype.unlock = function() {
  this.locked = false;
}

var instanceManager = new instanceManager_class();
