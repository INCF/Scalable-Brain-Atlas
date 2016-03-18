<?php
function daiServer() {
  // Asif's local dev server
  return 'http://132.239.131.188:8080';
  // official local dev server
  // return 'http://incf-dev-local.crbs.ucsd.edu:8080';
}

// this function is needed to use simplexml's xpath
function removeNameSpaces($xml) {
  $xml = preg_replace('/ xmlns([=:])/',' xpathns$1',$xml);
  $xml = preg_replace('/(<\/?\w+?):/', '$1_', $xml);
  $xml = preg_replace('/( \w+?):(\w+?=")/', '$1_$2', $xml);
  return $xml;
}

function getTransformationChain($srsIn,$srsOut) {
  if ($srsIn == $srsOut) return array();
  // workaround WHS_1.0 bug
  if ($srsOut == 'Mouse_WHS_1.0' && $srsIn != 'Mouse_WHS_0.9') {
    $bug1 = TRUE;
    $srsOut = 'Mouse_WHS_0.9';
  }
  $chain = array();
  if ($srsIn == 'Mouse_WHS_1.0' && $srsOut != 'Mouse_WHS_0.9') {
    $bug2 = TRUE;
    $chain[0] = array('hub'=>'WHS','srsIn'=>'Mouse_WHS_1.0','srsOut'=>'Mouse_WHS_0.9');
    $srsIn = 'Mouse_WHS_0.9';
  }
  
  $href = daiServer().'/atlas-central?service=WPS&version=1.0.0&request=Execute&Identifier=GetTransformationChain&DataInputs=inputSrsName='.$srsIn.';outputSrsName='.$srsOut.';filter=Cerebellum';
  $xml = @file_get_contents($href);
  $xml = removeNameSpaces($xml);
  
  // Parse the document
  $xml = simplexml_load_string($xml);
  $tmp = $xml->xpath('//CoordinateTransformationChain/CoordinateTransformation');
  foreach ($tmp as $step) {
    $order = (string)$step['order'];
    $srsTransform = (string)$step['code'];
    $hub = (string)$step['hub'];
    $srsIn = (string)$step['inputSrsName'];
    $srsOut = (string)$step['outputSrsName'];
    $chain[$order] = array('hub'=>$hub,'srsTransform'=>$srsTransform,'srsIn'=>$srsIn,'srsOut'=>$srsOut);
  }

  // workaround WHS_1.0 bug
  if ($bug1) {
    $chain[$order+1] = array('hub'=>'WHS','srsIn'=>'Mouse_WHS_0.9','srsOut'=>'Mouse_WHS_1.0');
  }
  return $chain;
}

function transformPOI($hub,$srsIn,$srsOut,$x,$y,$z) {
  $href = daiServer().'/atlas-'.strtolower($hub).'?service=WPS&version=1.0.0&request=Execute&Identifier=TransformPOI&DataInputs=inputSrsName='.$srsIn.';outputSrsName='.$srsOut.';x='.$x.';y='.$y.';z='.$z;
  $xml = @file_get_contents($href);
  $xml = removeNameSpaces($xml);

  // Parse the document
  $xml = simplexml_load_string($xml);
  $poi = current($xml->xpath('//POI//gml_pos'));
  $poi = explode(' ',(string)$poi);
  $poi[] = $href;
  return $poi;
}

function dec3($x) {
  return sprintf('%.3f',$x);
}

foreach ($_REQUEST as $k=>$v) $_REQUEST[strtolower($k)] = $v;
$cmd = $_REQUEST['cmd'];
if ($cmd == 'ListSRSs') {
  $href = daiServer().'/atlas-central?service=WPS&version=1.0.0&request=Execute&Identifier=ListSRSs';
  $xml = @file_get_contents($href);
  $xml = removeNameSpaces($xml);
  
  // Parse the document
  $xml = simplexml_load_string($xml);
  $srcList = $xml->xpath('//SRSList/SRS');
  $ans = array();
  foreach ($srcList as $elem) {
    $tmp = $elem->xpath('Name');
    $ans['name'][] = (string)current($tmp);
    $tmp = $elem->xpath('Description');
    $ans['description'][] = (string)current($tmp);
    $tmp = current($elem->xpath('Origin'));
    $ans['origin'][] = (string)current($tmp);
    $tmp = current($elem->xpath('Units'));
    $ans['unit'][] = (string)$tmp['uom'];
    $tmp = current($elem->xpath('Neurodimensions/MinusX'));
    $ans['minusX'][] = array( (string)$tmp,(string)$tmp['maxValue'] );
    $tmp = current($elem->xpath('Neurodimensions/PlusX'));
    $ans['plusX'][] = array( (string)$tmp,(string)$tmp['maxValue'] );
    $tmp = current($elem->xpath('Neurodimensions/MinusY'));
    $ans['minusY'][] = array( (string)$tmp,(string)$tmp['maxValue'] );
    $tmp = current($elem->xpath('Neurodimensions/PlusY'));
    $ans['plusY'][] = array( (string)$tmp,(string)$tmp['maxValue'] );
    $tmp = current($elem->xpath('Neurodimensions/MinusZ'));
    $ans['minusZ'][] = array( (string)$tmp,(string)$tmp['maxValue'] );
    $tmp = current($elem->xpath('Neurodimensions/PlusZ'));
    $ans['plusZ'][] = array( (string)$tmp,(string)$tmp['maxValue'] );
  }
  if (!headers_sent()) {
    header('Content-type: application/json; charset=utf-8');
    echo json_encode($ans);
  }
} elseif ($cmd == 'GetTransformationChain') {
  $chain = getTransformationChain($_REQUEST['srsin'],$_REQUEST['srsout']);
  if (!headers_sent()) {
    header('Content-type: application/json; charset=utf-8');
    echo json_encode($chain);
  }
} elseif ($cmd == 'RunTransformationChain') {
  $chain = getTransformationChain($_REQUEST['srsin'],$_REQUEST['srsout']);
  $x = $_REQUEST['x'];
  $y = $_REQUEST['y'];
  $z = $_REQUEST['z'];
  $step = current($chain);
  $ans = array($step['srsIn']=>array(dec3($x),dec3($y),dec3($z)));
  foreach ($chain as $step) {
    $srsOut = $step['srsOut'];
    $poi_url = transformPOI($step['hub'],$step['srsIn'],$step['srsOut'],$x,$y,$z);    
    $x = $poi_url[0];
    $y = $poi_url[1];
    $z = $poi_url[2];
    if ($srsOut == 'Mouse_WHS_0.9') {
      $bug = true;
      $x = round($x);
      $y = round($y);
      $z = round($z);
    }
    $ans[$srsOut] = array(dec3($x),dec3($y),dec3($z),$poi_url[3]);
  }
  if (!headers_sent()) {
    header('Content-type: application/json; charset=utf-8');
    echo json_encode($ans);
  }
}
?>