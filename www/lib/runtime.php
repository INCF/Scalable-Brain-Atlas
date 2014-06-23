<?
/*
 * runtime library contains common functions for logging and error handling
 */

function phpLibPath() {
  return '../lib/';
}

function phpLibError($msg) {
  throw(new Exception($msg));
}

function addReport($msg,$key=null) {
  global $phpReport;
  $phpReport->report($msg,$key);
}

function fatalError($msg) {
  global $phpReport;
  $phpReport->fatal($msg);
}

function addError($msg) {
  global $phpReport;
  $phpReport->error($msg);
}

function addWarning($msg) {
  global $phpReport;
  $phpReport->warning($msg);
}

function addResponse($key,$data) {
  global $phpReport;
  return $phpReport->addData($key,$data);
}
  
function statusOk() {
  global $phpReport;
  return $phpReport->ok();
}

function anyError() {
  global $phpReport;
  if (!$phpReport->ok()) {
    $report = $phpReport->asArray();
    return json_encode($report);
  } else return false;
}

function errorReport(Exception $e) {
  echo $e->getMessage().'<br>';
  global $phpReport;
  $err = $phpReport->asArray();
  $e0 = @$err->Errors[0];
  if (isset($e0)) $err['<>'] = array('summary' => $e0->data[0]);
  $err['Trace'] = $e->getTrace();
  echo json_encode($err);
}

/*
 * class phpReport_class
 */
class phpReport_class {
  public $e = array();
  public $nE = 0;
  public $w = array();
  public $nW = 0;
  public $r = array();
  public $data = array();
  
  function error($s) {
    $this->e[] = $s;
    if (++$this->nE==200) throw new Exception('Too many errors ('.$this->nE.')');
  }
  function fatal($s) {
    $this->e[] = $s;
    throw new Exception($s);
  }
  function warning($s) {
    $this->w[] = $s;
    if (++$this->nW>200) throw(new Exception('Too many warnings ('.$this->nW.')'));
  }
  function report($s,$k=null) {
    if (isset($k)) $this->r[$k] = $s;
    else $this->r[] = $s;
  }
  function addData($key,$data) {
    $this->data[$key] = $data;
  }
  function ok() {
    return !isset($this->e[0]);
  }
  function asArray() {
    return array(
      'errors'=>$this->e,
      'warnings'=>$this->w,
      'report'=>$this->r,
      'data'=>$this->data
    );
  }
}

$phpReport = new phpReport_class();

?>