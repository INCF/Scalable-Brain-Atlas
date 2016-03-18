<?
require_once('../lib/runtime.php');

error_reporting(E_ALL ^ E_NOTICE);

/*
 * class phpRequest
 */

class phpRequest_class {
  public $lib;
  
  function __construct($lib) {
    $this->lib = $lib;
  }

  function parseArguments($H) {
    $args = array();
    if (isset($H['ARGS'])) {
      // undo annoying php behavior of adding slashes to '"\ by default
      $args = (get_magic_quotes_gpc() ? stripslashes($H['ARGS']) : $H['ARGS']);
      $args = json_decode($args,true);
    }
    return $args;
  }

  function callFunction($func,$args) {
    global $phpReport;
    try {
      $lib = $this->lib;
      if (!preg_match('/cocomac|cocoaccount|cocolegacy|cocodataentry|cocodisplay|cocomac_api/',$lib)) phpLibError('Invalid library');
      $ok = session_start();
      require phpLibPath().$lib.'_lib.php';
      $obj = $lib.'_lib';
      $obj = $$obj; 
      $obj->requireFunction($func);
      $ans = call_user_func_array(array($obj,$func),$args);
      return (isset($ans) ? $ans : $phpReport->asArray());
    } catch (Exception $e) {
      addError($e->getMessage());
      $err = $phpReport->asArray();
      $e0 = @$err->Errors[0];
      if (isset($e0)) $err['<>'] = array('summary' => $e0->data[0]);
      $err['Trace'] = $e->getTrace();
      return array('phpRequestError'=>$err);
    }
  }
  
  function jsonHeaders() {
    header('Content-type: application/json; charset=utf-8');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  }

  function textHeaders() {
    header('Content-type: text/html; charset=utf-8');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  }
}
?>