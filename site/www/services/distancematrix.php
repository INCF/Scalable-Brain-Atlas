<?php
ini_set('display_errors',1);
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|distance matrix",
  "title": "Matrix with euclidian distances between region centers within a hemisphere.",
  "description": "Returns a table (tab-separated) with the euclidian distances [mm] between <a href=\"../services/regioncenters.php\">region centers</a> within a hemisphere, for a given atlas template"
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
$f = new selectField_class('Output format');
$f->setChoices(array('html-matrix'=>'html matrix','tsv-matrix'=>'tab-separated matrix'),'html-matrix');
$applet->addFormField('format',$f);
$f = new selectField_class('Column/row labels');
$f->setChoices(array(1=>'include',0=>'omit'),'yes');
$f->setChoices(array(1=>'include',0=>'omit',2=>'no data, row labels only',3=>'no data, column labels only'),1);
$applet->addFormField('labels',$f);

$template = @$_REQUEST['template'];
$errors = $applet->parseAndValidateInputs($_REQUEST);
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
	echo $applet->standardFormHtml('Get distance matrix');
	echo '</body></html>';
	exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * On submit
 */

require_once('../../lib-php/sba_viewer.php');
require_once('../../shared-php/formatAs.php');
$templatePath = '../templates/'.$template;
$config = @json_decode(file_get_contents($templatePath.'/config.json'),true);
$slicePos = @json_decode(file_get_contents($templatePath.'/template/slicepos.json'),true);
$rgb2acr = @json_decode(file_get_contents($templatePath.'/template/rgb2acr.json'),true);
$brainRegions = @json_decode(file_get_contents($templatePath.'/template/brainregions.json'),true);
$rgbCenters = @json_decode(file_get_contents($templatePath.'/template/rgbcenters_mm.json'),true);

function dist($ctr1,$ctr2) {
  $sum2 = 0;
  foreach ($ctr2 as $i=>$v2) { $d = $v2-$ctr1[$i]; $sum2 += $d*$d; }
  return sqrt($sum2);
}

//$rgbs = array_keys($rgbCenters);
$ctr = array();
foreach ($rgbCenters as $rgb=>$xyz_mm) {
  $acr = $rgb2acr[$rgb];
  $ctr[$acr] = $xyz_mm;
}
/*
foreach ($rgbCenters as $rgb=>$sxz) {
  $acr = $rgb2acr[$rgb];
  $xzMm = svg2mm($sxz[1],$sxz[2],$config);
  $ctr[$acr] = array($xzMm[0],$slicePos[$sxz[0]],$xzMm[1]);
}
*/


$acrs = array_keys($ctr);
sort($acrs);
foreach ($acrs as $acr1) {
  foreach ($acrs as $acr2) {
    $dst[$acr1][$acr2] = dist($ctr[$acr1],$ctr[$acr2]);
  }  
}

$format = $_REQUEST['format'];
$labels = $_REQUEST['labels'];
$withRowLabels = ($labels == 1 || $labels == 2);
$withColLabels = ($labels == 1 || $labels == 3);
$withData = ($labels < 2);
if ($format == 'html-matrix') {
?>
<html><head><style type="text/css">
table.fancy {
	border-collapse: collapse;
	background: #FFF;
	border: 1px solid #000;
}
table.fancy td,th {
	border: 1px solid #999;
	padding-left: 2px;
	padding-right: 2px;
	text-align: left
}
</style>
<?php
  echo '</head><body>';
  echo '<table class="fancy">'.formatAs_basicTable($dst,array('<tr>','</tr>'),array('<td>','</td>'),$withRowLabels,$withColLabels,$withData).'</table>';
  echo '</body></html>';
} elseif ($format == 'tsv-matrix') {
  header('Content-type: text/plain');
  echo formatAs_basicTable($dst,"\n","\t",$withRowLabels,$withColLabels,$withData);
}
?>
