<?php
if ($_SERVER['HTTP_HOST'] == 'localhost') $cocomacRoot = 'http://localhost/cocomac/cocomac2/';
else $cocomacRoot = 'http://cocomac.g-node.org/cocomac2/';

$args[0] = $_REQUEST['originSites'];
$args[1] = $_REQUEST['terminalSites'];
$args[2] = array();
$args[3] = array('format'=>'SBA');
$href = $cocomacRoot.'public/phpRequest.php?LIB=cocomac_api&CMD=public_getAxonalProjections&ARGS='.json_encode($args);
$ans = @file_get_contents($href,NULL);

if (!headers_sent()) {
  // check if the returned content is valid json
  header('Content-type: application/json; charset=utf-8');
  $validJson = @json_decode($ans,TRUE);
  if (isset($validJson) && !isset($validJson['errors'])) {
    echo '{"result":'.$ans.'}';
  } else {
    echo '{"error":'.$ans.'}';
  }
}

?>

