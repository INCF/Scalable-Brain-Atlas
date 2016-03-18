<?php
function daiServer() {
  // Asif's local dev server
  //return 'http://132.239.131.188:8080';
  // official dev server in stockholm
  //return 'http://incf-dev.crbs.ucsd.edu';
  // "staging server"
  //return 'http://incf-dev.crbs.ucsd.edu';
  return 'http://whs1.pdc.kth.se';
}

// this function is needed to use simplexml's xpath
function removeNameSpaces($xml) {
  $xml = preg_replace('/ xmlns([=])/',' removed_ns$1',$xml);
  $xml = preg_replace('/(<\/?[\w\d-]+?):/', '$1_', $xml);
  $xml = preg_replace('/( [\w\d-]+?):([\w\d-]+?=")/', '$1_$2', $xml);
  return $xml;
}

function getTransformationChain($srsIn,$srsOut) {
  if ($srsIn == $srsOut) return array();
  $href = daiServer().'/central/atlas?service=WPS&version=1.0.0&request=Execute&Identifier=GetTransformationChain&DataInputs=inputSrsName='.$srsIn.';outputSrsName='.$srsOut.';filter=Cerebellum';
  $xml = @file_get_contents($href);
  if (empty($xml)) throw new Exception('Can\'t reach the DAI service '.$href);
  $xml = removeNameSpaces($xml);
  // Parse the document
  $xml = simplexml_load_string($xml);
  $tmp = @$xml->xpath('//CoordinateTransformationChain/CoordinateTransformation');
  if (empty($tmp)) throw new Exception('Can\'t parse the DAI service '.$href);
  $chain = array();
  foreach ($tmp as $step) {
    $order = (string)$step['order'];
    $srsTransform = (string)$step['code'];
    $ok = preg_match('/([^\s]+)_To_([^\s]+)_v\d\.\d/',$srsTransform,$matches);
    $srsIn = $matches[1];
    $srsOut = $matches[2];
    $hub = (string)$step['hub'];
    $chain[$order] = array('hub'=>$hub,'srsTransform'=>$srsTransform,'srsIn'=>$srsIn,'srsOut'=>$srsOut);
  }
  return $chain;
}

function transformPOI($hub,$srsTransform,$x,$y,$z) {
  //$href = daiServer().'/atlas-'.strtolower($hub).'?service=WPS&version=1.0.0&request=Execute&Identifier=TransformPOI&DataInputs=inputSrsName='.$srsIn.';outputSrsName='.$srsOut.';x='.$x.';y='.$y.';z='.$z;
  $href = daiServer().'/'.strtolower($hub).'/atlas?service=WPS&version=1.0.0&request=Execute&Identifier=TransformPOI&DataInputs=transformationCode='.$srsTransform.';x='.$x.';y='.$y.';z='.$z;
  $xml = @file_get_contents($href);
  if (empty($xml)) throw new Exception('Can\'t reach the DAI service '.$href);
  $xml = removeNameSpaces($xml);  

  // Parse the document
  $xml = simplexml_load_string($xml);
  //$poi = @$xml->xpath('//TransformationResponse/POI/MultiPoint/pointMember/Point/pos');
  $poi = @$xml->xpath('//TransformationResponse/POI/Point/pos');
  try {
    if (!isset($poi)) throw new Exception('A service request error occured, check the transformation log');
    if (empty($poi)) throw new Exception('A transformation error occured, check the transformation log');
    $poi = current($poi);
    $poi = explode(' ',(string)$poi);
    if (count($poi) != 3) throw new Exception('An xml format error occured, check the transformation log');
  } catch(Exception $e) {
    $poi = array($e->getMessage()); 
  }
  $poi[] = $href;
  return $poi;
}

function dec3($x) {
  return sprintf('%.3f',$x);
}

foreach ($_REQUEST as $k=>$v) $_REQUEST[strtolower($k)] = $v;
$cmd = $_REQUEST['cmd'];
try {
  if ($cmd == 'ListSRSs') {
    $href = daiServer().'/central/atlas?service=WPS&version=1.0.0&request=Execute&Identifier=ListSRSs';
    $xml = @file_get_contents($href);
    if (empty($xml)) throw new Exception('Can\'t reach the DAI service '.$href);
    $xml = removeNameSpaces($xml);
    // Parse the document
    $xml = simplexml_load_string($xml);
    $srcList = @$xml->xpath('//SRSList/SRS');
    if (empty($srcList)) throw new Exception('Can\'t parse the DAI service '.$href);
    $ans = array();
    foreach ($srcList as $elem) {
      $tmp = $elem->xpath('Name');
      $ans['name'][] = (string)current($tmp);
      $tmp = $elem->xpath('Description');
      $ans['description'][] = (string)current($tmp);
      $tmp = current($elem->xpath('Origin'));
      $ans['origin'][] = (string)$tmp;
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
      $poi_url = transformPOI($step['hub'],$step['srsTransform'],$x,$y,$z);
      if (count($poi_url)==2) {
        $ans[$srsOut] = array('?','?','?',$poi_url[1]);
      } else {
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
    }
    if (!headers_sent()) {
      header('Content-type: application/json; charset=utf-8');
      echo json_encode($ans);
    }
  }
} catch(Exception $e) {
  echo $e->getMessage();
}
?>
