<?php
class applet_class {
  function __construct($input=NULL,$submitMethod='get') {
    // make request parameters case-insensitive
    if (!isset($request)) $input = $_REQUEST;
    $this->input_lc = array();
    foreach ($input as $k=>$v) $this->input_lc[strtolower($k)] = $v;
    $this->submitMethod = $submitMethod;

    require_once(__DIR__.'/formfields.php');
    $this->mainForm = new formfields_class();
    $this->start();
  }
  
  function addFormField($name,$field) {
    $this->mainForm->addField($name,$field);
  }
  
  function formFields() {
    return $this->mainForm->fields;
  }
  
  // 
  function inputMustHave($mustHave) {
    return isset($this->input_lc[strtolower($mustHave)]);
  }
  
  // preferred way to call parseAndValidateInputs
  function validateInputs($input) {
    $err = $this->parseAndValidateInputs($input);
    return array($input,$err);
  }

  // deprecated, pass by reference is cumbersome
  function parseAndValidateInputs(&$values) {
    $values_lc = array_change_key_case($values,CASE_LOWER);
    // make sure input keys are case-independent
    $values = array();
    foreach($this->mainForm->fields as $k=>$v) if ($k != "") {
      $k_lc = strtolower($k);
      if (isset($values_lc[$k_lc])) $values[$k] = $values_lc[$k_lc];
    }
    return $this->mainForm->parseAndValidateInputs($values);
  }
  
  function errorReport($errors) {
    return $this->mainForm->errorReport($errors);
  }
  
  // USE readyToSubmit INSTEAD
  function runLevel($run,$mustHave=NULL) {
    if (!isset($run)) {
      // undecided: make depend on presence of required field
      $run = (isset($mustHave) ? (is_array($mustHave) && count($mustHave)==0 ? 0 : 1) : 0);
    } elseif ($run == '') $run = 1;
    return $run;
  }
  
  function standardFormHtml($submitLabel='Submit',$target="iframe",$lastValues=array()) {
    $ans = '<form id="APPLET_FORM" accept-charset="UTF-8" method="'.$this->submitMethod.'"><table>';
    $ans .= $this->mainForm->formAsTableRows($lastValues);
    $ans .= '<tr><td>';
    if ($target == 'iframe') {
      $ans .= '<input type="button" value="'.$submitLabel.'" onclick="applet.submitForm(\'APPLET_FORM\',\'RESPONSE_HANDLER\',\'FEEDBACK\')"/>';
    } else {
      $ans .= '<input type="button" value="'.$submitLabel.'" onclick="applet.submitForm(\'APPLET_FORM\')"/>';
    }
    $ans .= '</td></tr></table></form>';
    if ($target == 'iframe') {
      $ans .= '<div id="FEEDBACK"></div>';
      $ans .= '<iframe id="RESPONSE_HANDLER" name="RESPONSE_HANDLER" style="width: 100%; height: 800px; overflow: auto"></iframe>';
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
