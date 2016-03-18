<?php
require_once('../../lib-php/sba_viewer.php');

// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

// template must be one of supported SBA templates
$template = $_GET['template'];
$templateDir = '../'.$template;
$jsonDir = $templateDir.'/template';

// find acronym which best matches the region
$region = $_GET['region'];
$rgb2acr = json_decode(file_get_contents($jsonDir.'/rgb2acr.json'),true);
$acr2parent = @json_decode(file_get_contents($jsonDir.'/acr2parent.json'),true);
if (!isset($acr2parent)) $acr2parent = array();
$alias2acr = @json_decode(file_get_contents($jsonDir.'/alias2acr.json'),true);
$acr = findAcrForGivenRegion($region,$rgb2acr,$acr2parent,$alias2acr);
if (!isset($acr)) exit('No match for region '.$region);

// get rgb list for the given acronym
$rgbList = getRgbList($acr,$rgb2acr,$acr2parent);

// get min/max slice, considering all rgbs
// . get global slice range
$config = @json_decode(file_get_contents($templateDir.'/config.json'),true);
$sliceRange = $config['sliceRange'];
// . brainregions contains polygon indices, organized first by region, next by slice
$brainRegions = @json_decode(file_get_contents($jsonDir.'/brainregions.json'),true);

// . loop to find min/max
$sliceStart = 1e6;
$sliceEnd = 0;
foreach ($rgbList as $rgb) {
  $slices = @array_keys($brainRegions[$rgb]);
  if (@isset($slices[0])) {
    $s = reset($slices);
    if ($s < $sliceStart) $sliceStart = $s;
    $s = end($slices);
    if ($s > $sliceEnd) $sliceEnd = $s;
  }
}

// output slice range
header('Content-type','text/plain');
echo '['.($sliceStart+1).' '.($sliceEnd+1).'];';
?>
