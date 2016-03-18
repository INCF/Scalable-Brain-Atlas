<?php
require_once('../../lib-php/sba_viewer.php');

// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

// template must be one of supported SBA templates
$template = $_GET['template'];
$templateDir = '../'.$template.'/template/';

// find acronym which best matches the region
$region = $_GET['region'];
$rgb2acr = json_decode(file_get_contents($templateDir.'rgb2acr.json'),true);
$acr2parent = @json_decode(file_get_contents($templateDir.'acr2parent.json'),true);
if (!isset($acr2parent)) $acr2parent = array();
$alias2acr = @json_decode(file_get_contents($templateDir.'alias2acr.json'),true);
$acr = findAcrForGivenRegion($region,$rgb2acr,$acr2parent,$alias2acr);
if (!isset($acr)) exit('No match for region '.$region);

// get rgb list for the given acronym
$rgbList = getRgbList($acr,$rgb2acr,$acr2parent);

// output slice range
header('Content-type','text/plain');
foreach ($rgbList as &$rgb) $rgb = '\''.$rgb.'\'';
echo '['.implode(';',$rgbList).'];';
?>
