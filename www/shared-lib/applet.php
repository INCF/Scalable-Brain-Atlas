<?php
class applet_class {
  function __construct($submitMethod='get') {
    $this->submitMethod = $submitMethod;
    require_once('../shared-lib/formfields.php');
    $this->mainForm = new formfields_class();
    $this->start();
  }
  
  function addFormField($name,$field) {
    $this->mainForm->addField($name,$field);
  }
  
  function formFields() {
    return $this->mainForm->fields;
  }
  
  function parseAndValidateInputs(&$values) {
    // make request parameters case-insensitive
    foreach ($values as $k=>$v) $values[strtolower($k)] = $v;
    return $this->mainForm->parseAndValidateInputs($values);
  }
  
  function errorReport($errors) {
    return $this->mainForm->errorReport($errors);
  }
  
  function runLevel($run,$mustHave=NULL) {
    if (!isset($run)) {
      // undecided: make depend on presence of required field
      $run = (isset($mustHave) ? (is_array($mustHave) && count($mustHave)==0 ? 0 : 1) : 0);
    } elseif ($run == '') $run = 1;
    return $run;
  }
  
  function standardFormHtml($submitLabel='Submit',$target="iframe",$lastValues=array()) {
    if ($target == 'iframe') {
      $ans = '<form id="APPLET_FORM" accept-charset="UTF-8"><table>';
      $ans .= $this->mainForm->formAsTableRows($lastValues);
      $ans .= '<tr><td>';
      $ans .= '<input type="button" value="'.$submitLabel.'" onclick="applet.submitForm(\'APPLET_FORM\',\'RESPONSE_HANDLER\',\'FEEDBACK\')"/>';
      $ans .= '</td></tr></table></form>';
      $ans .= '<div id="FEEDBACK"></div>';
      $ans .= '<iframe id="RESPONSE_HANDLER" name="RESPONSE_HANDLER" style="width: 100%; height: 800px; overflow: auto"></iframe>';
    } else {
      $ans = '<form id="APPLET_FORM" method="'.$this->submitMethod.'"><table>';
      $ans .= $this->mainForm->formAsTableRows($lastValues);
      $ans .= '<tr><td>';
      $ans .= '<input type="submit" value="'.$submitLabel.'"/>';
      $ans .= '</td></tr></table></form>';
    }
    return $ans;
  }
  
  function clientScript() {
    $ans = '<link rel="stylesheet" href="../shared-css/applet.css" type="text/css"/>';
    $ans .= '<script type="text/javascript" src="../shared-js/applet.js"></script>';
    $scriptUrl = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
    $ans .= '<script type="text/javascript">var applet = new applet_class(\''.$scriptUrl.'\',\''.$this->submitMethod.'\');</script>';
    $ans .= $this->mainForm->headSection();
    return $ans;
  }
    
  function start() {
    $this->startTime = time();
  }

  function elapsedTime() {
    return (time() - $this->startTime);
  }
  
  function submitted() {
    return count($_REQUEST)>(isset($_REQUEST['PHPSESSID']) ? 1 : 0);
  }
}
?>
