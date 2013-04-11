<?php
if ($_SERVER['HTTP_HOST'] == 'localhost') $cocomacRoot = 'http://localhost/cocomac/cocomac2/';
else $cocomacRoot = 'http://cocomac.g-node.org/cocomac2/';

$args[0] = $_REQUEST['originSites'];
$args[1] = $_REQUEST['terminalSites'];
$args[2] = array();
$args[3] = array('format'=>'SBA');
$href = $cocomacRoot.'public/phpRequest.php?LIB=cocomac_api&CMD=public_getAxonalProjections&ARGS='.json_encode($args);
$ans = @file_get_contents($href,NULL);

// make sure that the returned content is json-encoded
foreach ($http_response_header as $s) if (strncasecmp($s,'Content-type',12)===0) {
  if (stripos($s,'application/json')===FALSE) {
    header($s);
    echo $ans;
    return;
  }
}
if (!headers_sent()) {
  header('Content-type: application/json; charset=utf-8');
  echo $ans;
}
?>

