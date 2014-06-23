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

ini_set('display_errors',1);
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
$applet->addFormField('output',new selectField_class('Image format',NULL,array('json'=>'json'),'json'));

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = @$_REQUEST['template'];

if (!$template) {
	/*
	 * Interactive mode
	 */
	echo '<html><head>';
  echo '<meta http-equiv="content-type" content="text/html; charset=UTF-8">';
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

/*
// . get the number of slices (quick: from bregma; slow: from brainslices)
$numSlices = count($slicePos);
*/

$config = @json_decode(file_get_contents($jsonPath.'config.json'),true);
if (!isset($config)) $config = array();
/*
// . get the slice range (sliceStart, sliceEnd, sliceStep)
$sliceRange = $config['sliceRange'];
if (!isset($sliceRange)) $sliceRange = array(1,$numSlices,1);
if (!isset($sliceRange[2])) $sliceRange[2] = 1;
$indx2slice = range($sliceRange[0],$sliceRange[1],$sliceRange[2]);
*/

// . find index with smallest difference between y and slicePos
$s0 = NULL;
$rgb = NULL;
$acr = '[error]';

$sortPos = $slicePos;
sort($sortPos);
$end = count($sortPos)-1;
$yMin = $sortPos[0]-0.5*($sortPos[1]-$sortPos[0]);
$yMax = $sortPos[$end]+0.5*($sortPos[$end]-$sortPos[$end-1]);

if ($y<$yMin || $y>$yMax) {
  $full = 'Y out of limits ['.$yMin.','.$yMax.']';
} else {
  $bb = $config['boundingBox'];
  $xz1 = svg2mm($bb[0],$bb[1],$config);
  $xz2 = svg2mm($bb[0]+$bb[2],$bb[1]+$bb[3],$config);
  $xMin = min($xz1[0],$xz2[0]);
  $xMax = max($xz1[0],$xz2[0]);
  $zMin = min($xz1[1],$xz2[1]);
  $zMax = max($xz1[1],$xz2[1]);
  if ($x<$xMin || $x>$xMax) {
    $full = 'X out of limits ['.fixDecimals($xMin,4).','.fixDecimals($xMax,4).']';
  } elseif ($z<$zMin || $z>$zMax) {
    $full = 'Z out of limits ['.fixDecimals($zMin,4).','.fixDecimals($zMax,4).']';
  } else {
    $dSelect = NULL;
    foreach ($slicePos as $i=>$b) {
      $d = abs($y-$b);
      if (isset($dSelect) && $d>$dSelect) break; 
      $dSelect = $d;
      $iSelect = $i;
    }
    $s0 = $iSelect;
    $posSelect = $slicePos[$iSelect];

    $pngfile = rgbslice($template,$s0,'L',FALSE);
    $useIM = class_exists('Imagick');
    if ($useIM) {
      $im = new Imagick($pngfile);
      $imgWidth = $im->getImageWidth();
      $imgHeight = $im->getImageHeight();
    } else {
      $im = imagecreatefrompng($pngfile);
      $imgWidth = imagesx($im);
      $imgHeight = imagesy($im);
    }

    // convert the stereotaxic XY coordinates to SVG coordinates
    $xzSvg = mm2svg($x,$z,$config);

    // convert SVG coordinates to pixel coordinates
    $xPx = ($xzSvg[0]-$bb[0])*$imgHeight/$bb[3];
    $zPx = $imgHeight *(($xzSvg[1]-$bb[1])/$bb[3]);

    // read rgb value at pixel coordinate
    if ($useIM) {
      $idx = $im->getImagePixelColor($xPx,$zPx);
      $rgb = $idx->getColor();
      $rgb = sprintf('%02X%02X%02X',$rgb['r'],$rgb['g'],$rgb['b']);
    } else {
      $idx = imagecolorat($im,$xPx,$zPx);
      $rgb = @imagecolorsforindex($im,$idx);
      $rgb = sprintf('%02X%02X%02X',$rgb['red'],$rgb['green'],$rgb['blue']);
    }

    if (!isset($idx)) {
      $full = 'Error in imagecolorat()';
    } else {
      $RGB_TO_ACR = json_decode(file_get_contents($jsonPath.'/rgb2acr.json'),true);
      $ACR_TO_FULL = json_decode(file_get_contents($jsonPath.'/acr2full.json'),true);
      $acr = @$RGB_TO_ACR[$rgb];
      if (isset($acr)) {
        $full = $ACR_TO_FULL[$acr];
      } else {
        $acr = '[error]';
        $full = '[Found no acronym for RGB '.$rgb.']';
      }
    }
  }
}
$ans['template'] = $template;
$ans['region'] = $acr;
$ans['fullName'] = $full;
$ans['rgb'] = $rgb;
$ans['xyz'] = array($x,$y,$z);
$ans['sbaSlice'] = $s0+1;

if ($outputType == 'json') {
  require_once('../shared-lib/formatAs.php');
  echo formatAs_jsonHeaders();
  echo formatAs_prettyJson($ans);
}
?>
