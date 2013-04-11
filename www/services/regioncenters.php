<?php
ini_set('display_errors',1);
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|region centers",
  "title": "Region centers (optimized for label placement)",
  "description": "Returns a table (tab-separated) with columns [acronym | rgb-value | x | y | z], where x (left-right), y (posterior-anterior), z (inferior-superior) are the region centers in [mm] optimized for label placement. They are obtained by peeling of the discretized region volume until a single point remains, see regionCenters_3d.m (<a href=\"http://scalablebrainatlas.incf.org/mfiles/download_mfiles.php\">download m-files</a>)."
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
$f = new selectField_class('Output format');
$f->setChoices(array('html-matrix'=>'html matrix','tsv-matrix'=>'tab-separated matrix'),'html-matrix');
$applet->addFormField('format',$f);

$template = @$_REQUEST['template'];
$errors = $applet->parseAndValidateInputs($_REQUEST);
$runLevel = $applet->runLevel(@$_REQUEST['run'],$template);

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
  echo '<p/>';
  echo $applet->standardFormHtml('Get region centers');
  echo '</body></html>';
  exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * On submit
 */

require_once('../lib/sba_viewer.php');
require_once('../shared-lib/formatAs.php');
$config = @json_decode(file_get_contents('../'.$template.'/template/config.json'),true);
$slicePos = @json_decode(file_get_contents('../'.$template.'/template/slicepos.json'),true);
$rgb2acr = @json_decode(file_get_contents('../'.$template.'/template/rgb2acr.json'),true);
$brainRegions = @json_decode(file_get_contents('../'.$template.'/template/brainregions.json'),true);
$rgbCenters = @json_decode(file_get_contents('../'.$template.'/template/rgbcenters.json'),true);

$T = array();
foreach ($rgbCenters as $rgb=>$sxz) {
  $acr = $rgb2acr[$rgb];
  $xzMm = svg2mm($sxz[1],$sxz[2],$config);
  $T[$acr] = array($rgb,fixDecimals($xzMm[0],2),$slicePos[$sxz[0]],fixDecimals($xzMm[1],2));
}

$format = $_REQUEST['format'];
$withRowLabels = 1;
$withColLabels = 0;
$withData = 1;
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
  echo '<table class="fancy">'.formatAs_basicTable($T,array('<tr>','</tr>'),array('<td>','</td>'),$withRowLabels,$withColLabels,$withData).'</table>';
  echo '</body></html>';
} elseif ($format == 'tsv-matrix') {
  header('Content-type: text/plain');
  echo formatAs_basicTable($T,"\n","\t",$withRowLabels,$withColLabels,$withData);
}
?>