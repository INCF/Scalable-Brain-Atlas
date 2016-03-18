<?php
$region = $_REQUEST['region'];
$nlxid = $_REQUEST['nlxid'];
$href = 'http://neurolex.org/wiki/Special:ExportRDF/'.$nlxid;
$xml = @file_get_contents($href);
if ($xml) {
  $xml = preg_replace('/(<\/?\w+?):/', '$1_', $xml);
  $xml = preg_replace('/( \w+?):(\w+?=")/', '$1_$2', $xml);
  $xml = simplexml_load_string($xml);
  $ch = $xml->xpath('//rdfs_label');
  $ch = current($ch);
  $info = array();
  $ok = (strtolower(str_replace(' ','_',$ch)) == $nlxid);
  $info['<>']['label'] = ' ';
  $info['<>']['collapse'] = 0;
  $info['<>']['ok'] = $ok;
  $propertyCount = 0;
  if ($ok) {
    $elem = current($ch->xpath('parent::*'));
    foreach ($elem as $k=>$v) {
      $spos = strpos($k,'property_');
      if ($spos === 0) {
        $property = substr($k,9);
        if (isset($v['rdf_resource'])) {
          $parts = parse_url($v['rdf_resource']);
          $base = basename($parts['path']);
          $pos = strpos($base,'-3A');
          if ($pos !== FALSE) $base = substr($base,$pos+3);
          $s = '<a href="'.$v['rdf_resource'].'">'.$base.'</a>';
        } else {
          $s = (string)$v;
        }
        if (isset($info[$property])) {
          $info[$property] .= ', '.$s;
        } else {
          $info[$property] = $s;
          $propertyCount++;
        } 
      }
    }
  }
  if ($propertyCount>0) {
    $info['<>']['label'] = ' NeuroLex';
    $info['<>']['summary'] = 'has a <a target="_blank" href="'.$elem->swivt_page['rdf_resource'].'">wiki-page</a> for the term '.$region.' with the following properties:';
  } else {
    $info['<>']['summary'] = 'NeuroLex seems to have no information on the term "'.$region.'" (id='.$nlxid.')';
  }
} else {
  $info = 'Error connecting to '.$href;
}
if (!headers_sent()) {
  header('Content-type: application/json; charset=utf-8');
  echo json_encode($info);
}
?>