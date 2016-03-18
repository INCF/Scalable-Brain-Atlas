<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|thumbnail",
  "title": "Region thumbnail in 2D (slice) or 3D (stack of slices)",
  "description": "Returns a region thumbnail in 2D (slice), 3D (stack of slices), or both."
}
SITEMAP
,TRUE);

require_once('../../shared-php/fancysite.php');
require_once('../../shared-php/applet.php');
$siteMap = new siteMap_class($info);
$applet = new applet_class();

/* Create form fields for this applet */
$attrs = array('size'=>40);
$f = new selectField_class('Atlas template');
require_once('../../lib-php/sba_viewer.php');
$f->setChoices(listTemplates_release('alpha','friendlyNames'),NULL);
$applet->addFormField('template',$f);
//$applet->addFormField('acr',new textField_class('Region acronym/abbreviation (strict)',$attrs,0,16));
$applet->addFormField('region',new textField_class('Region (abbrev.)',$attrs,0,64));
$applet->addFormField('size',new selectField_class('Image size',NULL,array('S'=>'Small','M'=>'Medium','L'=>'Large'),'L'));
$applet->addFormField('dim',new selectField_class('Thumbnail type',NULL,array('2d'=>'2D: Region in slice','3d'=>'3D: Region in stack of slices','2d3d'=>'2D+3D: Both'),'2d3d'));
$applet->addFormField('format',new selectField_class('Image format',NULL,array('png'=>'PNG (raster)','svg'=>'SVG (vector)'),'png'));

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = $_REQUEST['template'];
$runLevel = $applet->runLevel(@$_REQUEST['run'],$template);

if ($runLevel == 0) {
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
	echo 'You can embed a thumbnail of a brain region in your own site by placing an image tag with the appropriate source attribute in your html code.';
  echo '<br/>For example: <span style="color: #070">';
  echo htmlspecialchars('<img src="https://scalablebrainatlas.incf.org/thumbnail.php?template=PHT00&region=Cd&size=S&dim=2d3d">');
  echo '</span>';
	echo $applet->standardFormHtml('Get thumbnail','iframe',$_REQUEST);
	echo '</body></html>';
	exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * On submit
 */

// template must be one of supported SBA templates
$templatePath = '../templates/'.$template;
$jsonPath = $templatePath.'/template';
$config = @json_decode(file_get_contents($templatePath.'/config.json'),true);

// acr must be an exact acronym/abbreviation as defined in the template
$acr = @$_REQUEST['acr'];
$rgb2acr = json_decode(file_get_contents($jsonPath.'/rgb2acr.json'),true);
$acr2parent = @json_decode(file_get_contents($jsonPath.'/acr2parent.json'),true);
if (!isset($acr2parent)) $acr2parent = array();
$alias2acr = @json_decode(file_get_contents($jsonPath.'/alias2acr.json'),true);
if (!isset($acr)) {
  // region is similar to acronym, but more forgiving: tries case insensitive, considers aliases etc.
  $region = $_REQUEST['region'];
  $acr = findAcrForGivenRegion($region,$rgb2acr,$acr2parent,$alias2acr);
}

// size S or L
$sizes = array('S'=>'S','L'=>'L');
$size = $sizes[strtoupper($_REQUEST['size'])];
if (!isset($size)) $size = 'L';

// space dimension 2D or 3D
$dims = array('2D'=>'2d','3D'=>'3d','2D3D'=>'2d3d');
$dim = $dims[strtoupper($_REQUEST['dim'])];
if (!isset($dim)) $dim = '2d';

// format svg or png
$formats = array('PNG'=>'png','SVG'=>'svg');
$format = @$formats[strtoupper($_REQUEST['format'])];
if (!isset($format)) $format = 'png';

// update cached image, if necessary
$nocache = isset($_GET['nocache']);
$scriptfile = $_SERVER['SCRIPT_FILENAME'];
$thumbnail_name = $template.'_'.rawurlencode($acr).'_'.$dim.$size;
$svgfile = str_replace('services/thumbnail.php','cache/'.$thumbnail_name.'.svg',$scriptfile);
$pngfile = str_replace('.svg','.png',$svgfile);
$lastmodified_cache = @filemtime($pngfile);
$lastmodified_script = @filemtime($scriptfile);
if (!isset($lastmodified_cache) || $lastmodified_cache < $lastmodified_script || $nocache) {

  $SVG_PATHS = json_decode(file_get_contents($jsonPath.'/svgpaths.json'),true);
  $BRAIN_REGIONS = json_decode(file_get_contents($jsonPath.'/brainregions.json'),true);
  $BRAIN_SLICES = json_decode(file_get_contents($jsonPath.'/brainslices.json'),true);
  
  // parse region hierarchy
  $acr2parent = json_decode(file_get_contents($jsonPath.'/acr2parent.json'),true);
  
  // get rgb list
  $rgbList = getRgbList($acr,$rgb2acr,$acr2parent);

  // generate svg
  if ($dim == '3d') {
    $hulls = @json_decode(file_get_contents($jsonPath.'/hulls.json'),true);
    $svg = generateSvg3d($rgbList,$BRAIN_SLICES,$SVG_PATHS,$hulls,$size,$config);
  } elseif ($dim == '2d3d') {
    // get middle slice
    $s = getMiddleSlice($rgbList,$BRAIN_REGIONS,$BRAIN_SLICES);
    $hulls = @json_decode(file_get_contents($jsonPath.'/hulls.json'),true);
    $svg = generateSvg2d3d($s,$rgbList,$BRAIN_SLICES,$SVG_PATHS,$hulls,$size,$config);
  } else {
    // get middle slice
    $s = getMiddleSlice($rgbList,$BRAIN_REGIONS,$BRAIN_SLICES);
    $svg = generateSvg2d($s,$rgbList,$BRAIN_SLICES,$SVG_PATHS,$size,$config);
  }
  
  // save svg to cache
  file_put_contents($svgfile,$svg);

  if (0) {
    // load svg into Imagick
    $im = new Imagick($svgfile);

    // save svg as png
    $im->setImageDepth(8);
    $im->setImageRenderingIntent(imagick::RENDERINGINTENT_PERCEPTUAL);
    $im->quantizeImage(16,imagick::COLORSPACE_RGB,4,0,0);
    //$im->setImageType('Palette');
    $im->setImageCompressionQuality(100);
    $im->writeImage($pngfile);

    /*
    $im->setImageFormat('GIF');
    $giffile = str_replace('.svg','.gif',$svgfile);
    $im->writeImage($giffile);
    */

    /*
    $im->setImageFormat('JPEG');
    $jpgfile = str_replace('.svg','.jpg',$svgfile);
    $im->writeImage($jpgfile);
    */

    $im->destroy(); 
  } else {
    exec('convert -colorspace RGB -depth 8 -antialias "'.$svgfile.'" "'.$pngfile.'"');
  }
}

// redirect to the appropriate cached image
$location = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
$pos = strpos($location,'services/thumbnail.php');
$templateLocation = substr($location,0,$pos);
if ($format=='svg') {
  $cached_svg = $templateLocation.'cache/'.rawurlencode($thumbnail_name).'.svg';
  header('Location: '.$cached_svg);
} else {
  $cached_png = $templateLocation.'cache/'.rawurlencode($thumbnail_name).'.png';
  if (isset($_GET['noredirect'])) {
    header('Content-Type: image/png');
    echo readfile($cached_png);
  } else {
    header('Location: '.$cached_png);
  }
}
?>
