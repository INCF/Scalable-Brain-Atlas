<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|rgb slice",
  "title": "Color-coded PNG (bitmap) or SVG (vector) image of a brain atlas slice",
  "description": "Returns a color-coded SVG or PNG image of a single brain atlas slice. Get the color scheme from the 'list regions' service. Warning: the PNG image is produced using the RSVG library, which has the shortcoming that anti-aliasing can't be turned off. As a result, border pixels get interpolated RGB values that do not map to a valid brain region."
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
$applet->addFormField('slice',new numField_class('Slice (1 = most anterior)',$attrs,1,999));
$applet->addFormField('size',new selectField_class('Image size',NULL,array('S'=>'Small','M'=>'Medium','L'=>'Large'),'M'));
$applet->addFormField('format',new selectField_class('Image format',NULL,array('png'=>'PNG (raster)','svg'=>'SVG (vector)'),'PNG'));

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = $_REQUEST['template'];
$runLevel = $applet->runLevel($_REQUEST['run'],$template);

if ($runLevel == 0) {
	/*
	 * The following code is used when applet is called in interactive mode
	 */
	echo '<html><head>';
	echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
	echo $siteMap->windowTitle();
	echo $siteMap->clientScript();
	echo $applet->clientScript();
	echo '</head>	<body>';
	echo $siteMap->navigationBar();
	echo $siteMap->pageTitle();
	echo $siteMap->pageDescription();
	echo '<p>';
	echo $applet->standardFormHtml('Get slice');
	echo '</body></html>';
	exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * The following code is used when applet is called on submit
 */

// slice number
$slice = $_REQUEST['slice'];
$slice0 = $slice-1;

// size S or M or L
$sizes = array('S'=>'S','M'=>'M','L'=>'L');
$size = $sizes[strtoupper($_REQUEST['size'])];
if (!isset($size)) $size = 'L';

// format svg or png
$formats = array('PNG'=>'png','SVG'=>'svg');
$format = @$formats[strtoupper($_REQUEST['format'])];
if (!isset($format)) $format = 'png';

// template dir
$templateRoot = isset($_GET['develop']) ? '../../development/' : '../';
$templateRoot .= $template.'/';

// update cached image, if necessary
$nocache = isset($_GET['nocache']);
$thumbnail_name = $template.'_slice'.$slice.$size;
$scriptfile = $_SERVER['SCRIPT_FILENAME'];
$svgfile = str_replace('services/rgbslice.php','cache/'.$thumbnail_name.'.svg',$scriptfile);
$pngfile = str_replace('.svg','.png',$svgfile);
$lastmodified_cache = @filemtime($pngfile);
$lastmodified_script = @filemtime($scriptfile);
if (!isset($lastmodified_cache) || $lastmodified_cache < $lastmodified_script || $nocache) {
	$SVG_PATHS = json_decode(file_get_contents($templateRoot.'template/svgpaths.json'),true);
	$BRAIN_SLICES = json_decode(file_get_contents($templateRoot.'template/brainslices.json'),true);
	$CONFIG = @json_decode(file_get_contents($templateRoot.'template/config.json'),true);

	// generate svg
	try {
		$svg = @generateSvg2d($slice0,'RGB',$BRAIN_SLICES,$SVG_PATHS,$size,$CONFIG);
	} catch(Exception $e) {
		echo 'Error: '.$e->getMessage()."\n";
		return;
	}

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
	exec('convert -colorspace RGB -depth 8 -type TrueColor +antialias "MSVG:'.$svgfile.'" "'.$pngfile.'"');
	//exec('convert +antialias "'.$svgfile.'" "'.$pngfile.'"');
}

// redirect to the appropriate cached image
$location = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
$pos = strpos($location,'services/rgbslice.php');
$templateLocation = substr($location,0,$pos);

if ($format=='svg') {
	$cached_svg = $templateLocation.'cache/'.rawurlencode($thumbnail_name).'.svg';
	header('Location: '.$cached_svg);
} else {
	$cached_png = $templateLocation.'cache/'.rawurlencode($thumbnail_name).'.png';
	header('Location: '.$cached_png);
}