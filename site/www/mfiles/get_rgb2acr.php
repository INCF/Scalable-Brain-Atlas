<?php
require_once('../../lib-php/sba_viewer.php');

// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

// template must be one of supported SBA templates
$template = $_GET['template'];
$templateDir = '../'.$template.'/template/';

// find acronym which best matches the region
$rgb2acr = json_decode(file_get_contents($templateDir.'rgb2acr.json'),true);

// output rgb2acr as a cell array
header('Content-type','text/plain');
$kv = array();
foreach ($rgb2acr as $rgb=>$acr) {
  $kv[] = '\''.$rgb.'\' \''.rawurlencode($acr).'\'';
}
echo '{'.implode(';',$kv).'}';
?>
