<?php
$template = $_REQUEST['template'];
$templatePath = '../templates/'.$template;
$jsonPath = $templatePath.'/template';

$config = json_decode(file_get_contents('../main/config.json'),true);

// overload with template-specific configuration
$tmp = json_decode(file_get_contents($templatePath.'config.json'),true);
foreach ($tmp as $k=>$v) $config[$k] = $v;

$slicePos = json_decode(file_get_contents($jsonPath.'/slicepos.json'),true);
$midSlice = round(count($slicePos)/2);
echo '<br/>midSlice '.$midSlice;

// distance between successive slices
$sliceSpacing = abs($slicePos[$midSlice+1]-$slicePos[$midSlice]);
echo '<br/>sliceSpacing '.$sliceSpacing;

// number of mm per svg unit, coordFrame and Ylim from config.json
$mmPerSvgX = abs($config['sliceXLim'][1]-$config['sliceXLim'][0])/$config['sliceCoordFrame'][2];
$mmPerSvgY = abs($config['sliceYLim'][1]-$config['sliceYLim'][0])/$config['sliceCoordFrame'][3];
echo '<br/>mmPerSvgX '.$mmPerSvgX;
echo '<br/>mmPerSvgY '.$mmPerSvgY;
$mmPerSvg = 0.5*$mmPerSvgX+0.5*$mmPerSvgY;
echo '<br/>mmPerSvg '.$mmPerSvg;

// width of a 2d slice
$sliceWidth = $config['boundingBox'][2]*$mmPerSvg;
echo '<br/>sliceWidth '.$sliceWidth;

$aspectRatio = $config['boundingBox'][2]/$config['boundingBox'][3];
echo '<br/>aspectRatio '.$aspectRatio;

$bothHemispheres = ($aspectRatio>=0.9);
echo '<br/>bothHemispheres '.(0+$bothHemispheres);

// width of single brain half of a 2d slice
if ($bothHemispheres) {
  $sliceWidthSingle = 0.5*$sliceWidth;
} else {
  $sliceWidthSingle = $sliceWidth;
}
echo '<br/>sliceWidthSingle '.$sliceWidthSingle;

// give the slice a bit more space beyond the tight boundingbox
$sliceWidthPlus = $sliceWidthSingle*1.05;
echo '<br/>sliceWidthPlus '.$sliceWidthPlus;

// height of a 2d slice
$sliceHeight = $config['boundingBox'][3]*$mmPerSvg;
echo '<br/>sliceHeight '.$sliceHeight;

// gap between every 10th slice in SBA 3d view, set this gap to 0
//sliceGap = 10*sliceSpacing-sliceWidthPlus*sinA
//=>
//0 = 10*sliceSpacing-sliceWidthPlus*sinA
//=>
//sinA = 10*sliceSpacing/sliceWidthPlus
$sinA = 10*$sliceSpacing/$sliceWidthPlus;
echo '<br/>sinA '.$sinA;
echo '<br/>azimuth '.asin($sinA);
echo '<br/>azimuth degrees '.(180/M_PI*asin($sinA));
?>
