<?php
foreach ($_REQUEST as $k=>$v) $_REQUEST[strtolower($k)] = $v;
$x = $_REQUEST['x'];
$y = $_REQUEST['y'];
$z = $_REQUEST['z'];
$href = 'http://incf-dev.crbs.ucsd.edu:8080/atlas-ucsd?service=WPS&version=1.0.0&request=Execute&Identifier=TransformPOI&DataInputs=inputSrsName=Mouse_Paxinos_1.0;outputSrsName=Mouse_WHS_0.9;x='.$x.';y='.$y.';z='.$z;
$xml = @file_get_contents($href);
//$xml = preg_replace('/(<\/?\w+?):/', '$1_', $xml);
//$xml = preg_replace('<xmlns','<test',$xml);
//$xml = simplexml_load_string($xml);
//$poi = $xml->xpath('//POI');
if (!headers_sent()) {
  header('Content-type: application/json; charset=utf-8');
  echo json_encode($xml);
}
?>