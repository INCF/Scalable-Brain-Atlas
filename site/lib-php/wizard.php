<?php
class wizard_class {
  function __construct($request=NULL, $presets=array()) {
    // make request parameters case-insensitive
    if (!isset($request)) $request = $_REQUEST;
    $this->request_lc = array_change_key_case($request,CASE_LOWER);
    $this->presets_lc = array_change_key_case($presets,CASE_LOWER);
    require_once(__DIR__.'/../shared-php/formfields.php');
  }
  
  function rawValue($key) {
    $key_lc = strtolower($key);
    $v = @$this->presets[$key_lc];
    if (!isset($v)) $v = @$this->request_lc[$key_lc];
    return $v;
  }

  // override
  public $keyChain = array();

  // override
  function nextField(&$values, $key) {}

  function getFormAndValues() {
    $formFields = new formFields_class();
    $keys = $this->keyChain;
    $doSubmit = TRUE;
    $breakpoints = array();
    foreach ($keys as &$k) {
      if (substr($k,0,1)=='?') {
        $k = substr($k,1);
        $breakpoints[$k] = TRUE;
      }
      if (substr($k,-1)=='!') {
        $k = substr($k,0,-1);
        $v = $this->rawValue($k);
        if (!isset($v)) $doSubmit = FALSE;
      }
    }
    unset($k);
    $values = array();
    $errors = array();
    $usesDefaults = FALSE;
    foreach ($keys as $k) {
      if (isset($breakpoints[$k])) {
        if ($doSubmit) {
          if (count($errors)) break;
        } else {
          if ($usesDefaults || count($errors)) break;
        }
        // freeze previous fields
        foreach ($formFields->fields as $i=>$ff) {
          $ff->setDefault($values[$i]);
          $ff->setReadOnly(TRUE);
        }
      }
      list($ff,$submitText) = $this->nextField($values, $k);
      $raw = $this->rawValue($k);
      if (isset($raw)) {
        list($val,$err) = $ff->validate($raw);
      } else {
        $val = $ff->getPreset();
        if (!isset($val)) {
          $usesDefaults = TRUE;
          $val = $ff->getDefault();
          if (!isset($val)) $err = 'Missing value for field '.$k;
        }
      }
      $formFields->addField($k,$ff);
      $values[$k] = $val;
      if ($err) $errors[$k] = $err;
    }
    return array($formFields,$values,$errors,$submitText,$doSubmit);
  }
}
?>
