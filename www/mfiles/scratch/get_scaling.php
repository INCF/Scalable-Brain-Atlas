<?php
//require_once('../lib/sba_viewer.php');

// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

// template must be one of supported SBA templates
$template = $_GET['template'];
$templateDir = '../'.$template.'/template/';

// get config for boundingBox
$config = json_decode(file_get_contents($templateDir.'config.json'),true);
$boundingBox = $config['boundingBox'];
$sliceRange = $config['sliceRange'];
if (!isset($sliceRange[2])) $sliceRange[2] = 1;

// get xy scaling (deprecated)
$xyScaling = @json_decode(file_get_contents($templateDir.'xyscaling.json'),true);
if (isset($xyScaling)) foreach ($xyScaling as &$v) $v = implode(' ',$v);
else $xyScaling = array();

// get slice position
$slicePos = json_decode(file_get_contents($templateDir.'slicepos.json'),true);

// get coordinate frame
$sliceXLim = $config['sliceXLim'];
$sliceYLim = $config['sliceYLim'];
$sliceCoordFrame = $config['sliceCoordFrame'];

// output scaling data as a struct
header('Content-type','text/plain');
echo 'struct(\'boundingBox\',['.implode(' ',$boundingBox).'],\'sliceRange\',['.implode(' ',$sliceRange).'],\'slicePosition\',['.implode(';',$slicePos).'],\'xyScaling\',['.implode("\n",$xyScaling).'],\'sliceXLim\',['.implode("\n",$sliceXLim).'],\'sliceYLim\',['.implode("\n",$sliceYLim).'],\'sliceCoordFrame\',['.implode("\n",$sliceCoordFrame).'])';
?>