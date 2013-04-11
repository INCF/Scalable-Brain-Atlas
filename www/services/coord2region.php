<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|region by coordinate",
  "title": "Find region by coordinate",
  "description": "Returns the name of a brain region, given a stereotaxic coordinate as input."
}
SITEMAP
,TRUE);

require_once('../shared-lib/sitemap.php');
require_once('../shared-lib/applet.php');
$siteMap = new siteMap_class($info);
$applet = new applet_class();

/* Create form fields for this applet */
$attrs = array('size'=>40);
$f = new selectField_class('Atlas template');
require_once('../lib/sba_viewer.php');
$f->setChoices(listTemplates('friendlyNames'),NULL);
$applet->addFormField('template',$f);
$comment = 'Enter coordinates as a comma separated list [x,y,z]. The origin and direction of x, y and z depend on the atlas template, but in all cases x refers to the left/right axis, y to the posterior/anterior axis and z to the inferior/superior axis.';
$applet->addFormField('comment',new commentField_class($comment));
$applet->addFormField('coord',new textField_class('Coordinate',$attrs,3,40));
$applet->addFormField('output',new selectField_class('Image format',NULL,array('json'=>'json','html'=>'html'),'json'));

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = $_REQUEST['template'];
$runLevel = $applet->runLevel($_REQUEST['run'],$template);

if ($runLevel == 0) {
	/*
	 * Interactive mode
	 */
	echo '<html><head>';
	echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
	echo $siteMap->windowTitle();
	echo $siteMap->clientScript();
	echo $applet->clientScript();
	echo '</head><body>';
	echo $siteMap->navigationBar();
	echo $siteMap->pageTitle();
	echo $siteMap->pageDescription();
	echo '<p>';
	echo $applet->standardFormHtml('Get region name');
	echo '</body></html>';
	exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * On submit
 */

$jsonPath = '../'.$template.'/template/';

// output type
$outputType = $_REQUEST['output'];
if (!isset($outputType)) $outputType = 'json';

// coordinates X, Y and Z
$xyz = $_REQUEST['coord'];
if (!isset($xyz)) $xyz = array(0,0,0);
else {
  $xyz = preg_replace('/^[\[\(]|[\]\)]$/','',$xyz);
  $xyz = explode(',',$xyz);
}
$x = $xyz[0];
$y = $xyz[1];
$z = $xyz[2];

// find the slice closest to the slicePos specified in Y
$slicePos = @json_decode(file_get_contents($jsonPath.'slicepos.json'),true);
// . get the number of slices (quick: from bregma; slow: from brainslices)
$numSlices = count($slicePos);

$config = @json_decode(file_get_contents($jsonPath.'config.json'),true);
if (!isset($config)) $config = array();
// . get the slice range (sliceStart, sliceEnd, sliceStep)
$sliceRange = $config['sliceRange'];
if (!isset($sliceRange)) $sliceRange = array(1,$numSlices,1);
if (!isset($sliceRange[2])) $sliceRange[2] = 1;
$indx2slice = range($sliceRange[0],$sliceRange[1],$sliceRange[2]);

// . find index with smallest difference between y and slicePos
$dSelect = NULL;
foreach ($slicePos as $i=>$b) {
  $d = abs($y-$b);
  if (isset($dSelect) && $d>$dSelect) break; 
  $dSelect = $d;
  $iSelect = $i;
}  
$s1 = $iSelect+1;
$posSelect = $slicePos[$iSelect];

CALL RGBSLICE FOR THE CACHED FILE NAME.
LOAD THAT FILE
AND USE X AND Z TO COMPUTE COORDS

// update cached image, if necessary
$scriptfile = $_SERVER['SCRIPT_FILENAME'];
$size = 'L';
$thumbnail_name = $template.'_slice'.$slice.$size;
$svgfile = str_replace('services/coord2region.php','cache/'.$thumbnail_name.'.svg',$scriptfile);
$pngfile = str_replace('.svg','.png',$svgfile);
$lastmodified_cache = @filemtime($pngfile);
$lastmodified_script = @filemtime($scriptfile);
if (!isset($lastmodified_cache) || $lastmodified_cache < $lastmodified_script) {
  $SVG_PATHS = json_decode(file_get_contents($jsonPath.'svgpaths.json'),true);
  $BRAIN_SLICES = json_decode(file_get_contents($jsonPath.'brainslices.json'),true);
  
  // generate svg
  $svg = generateSvg2d($slice,'RGB',$BRAIN_SLICES,$SVG_PATHS,$size);
  
  // save svg to cache
  file_put_contents($svgfile,$svg);

  if (0) {
    // Problem with this API: can't turn off anti-aliasing, even though SVG has shape-rendering: crispEdges
    // load svg into Imagick
    $im = new Imagick($svgfile);

    // save svg as png
    $im->setImageColorSpace(imagick::COLORSPACE_RGB);
    $im->setImageDepth(8);
    $im->setImageRenderingIntent(imagick::RENDERINGINTENT_ABSOLUTE);
    $im->setImageCompressionQuality(100);
    $im->writeImage($pngfile);
    $im->destroy(); 
  }
  exec('convert -colorspace RGB -depth 8 -type TrueColor +antialias '.$svgfile.' '.$pngfile);
}

$im = new Imagick($pngfile);
$imgHeight = $im->getImageHeight();

// convert the stereotaxic XY coordinates to SVG coordinates
$xyScaling = @json_decode(file_get_contents($template.'/template/xyscaling.json'),true);
if (!isset($xyScaling)) $xyScaling = array(0,1,0,1);
if (is_array(current($xyScaling))) $s = $xyScaling[$slice];
else $s = $xyScaling;
$xPt = ($x-$s[0])/$s[1];
$yPt = ($y-$s[2])/$s[3];
// convert SVG coordinates to pixel coordinates
$bb = $config['boundingBox'];
if (!isset($bb)) $bb = array(0,0,8268,11693);
$xPx = ($xPt-$bb[0])*$imgHeight/$bb[3];
$yPx = ($yPt-$bb[1])*$imgHeight/$bb[3];

// read rgb value at pixel coordinate
$rgb = $im->getImagePixelColor($xPx,$yPx);
$rgb = $rgb->getColor();
$rgb = sprintf('%02X%02X%02X',$rgb['r'],$rgb['g'],$rgb['b']);
$RGB_TO_ACR = json_decode(file_get_contents($template.'/template/rgb2acr.json'),true);
$ACR_TO_FULL = json_decode(file_get_contents($template.'/template/acr2full.json'),true);
$acr = $RGB_TO_ACR[$rgb];
if (isset($acr)) {
  $full = $ACR_TO_FULL[$acr];
} else {
  $acr = $full = '[unknown]';
}
$ans['region'] = $template.'-'.$acr;
$ans['fullName'] = $full;
$ans['rgb'] = $rgb;
$ans['stereotaxicCoord'] = array($x,$y,$z);
$ans['selectedSlice'] = $slice;
if (isset($bregmaSelect)) $ans['selectedBregma'] = $bregmaSelect;

if ($outputType == 'json') {
  echo json_encode($ans);
} elseif ($outputType == 'html') {
  require_once('lib/json_html.php');
  echo json_html($ans);
}
?>
