<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|list regions",
  "title": "Lists all regions belonging to the given template",
  "description": "Returns a table (tab-separated) with all regions contained in a given template, their full names, place in the region hierarchy and whether they are a visible structure in the Scalable Brain Atlas"
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

$template = $_REQUEST['template'];
$errors = $applet->parseAndValidateInputs($_REQUEST);
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
	echo <<<HTML
<p>
Outputs a tab-separated table with columns
<ol>
<li>rgb value (internal use)
<li>abbreviation 
<li>full name (if the region name is an alias, this field contains an abbreviation preceded by the @-sign)
<li>parent abbreviation (available for hierarchical nomenclatures)
<li>shape-detail
<ul>
<li>C: region shape consists of the area covered by its children
<li>P: closed polygon(s) define the region shape; they exclude the area covered by its children
<li>Q: closed polygon(s) define the region shape; they include the area covered by its children
<li>S: single spot marks the approximate region location
<li>U: undefined region shape
</ul>
</ol>
</ul>
See also: <a href="../listtemplates.php">list templates</a>
HTML;
	echo $applet->standardFormHtml('List regions');
	echo '</body></html>';
	exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * On submit
 */

// default configuration
$rgb2acr = json_decode(file_get_contents('../'.$template.'/template/rgb2acr.json'),true);
$acr2full = json_decode(file_get_contents('../'.$template.'/template/acr2full.json'),true);
$acr2parent = @json_decode(file_get_contents('../'.$template.'/template/acr2parent.json'),true);
$brainregions = json_decode(file_get_contents('../'.$template.'/template/brainregions.json'),true);
$acr2rgb = array_flip($rgb2acr);
// fill acr2shape, first pass
$acr2shape = array();
foreach($acr2full as $acr=>$full) {
	$rgb = $acr2rgb[$acr];
	$acr2shape[$acr] = isset($brainregions[$rgb]) ? 'P' : 'U';    
}
// sort acr2shape such that children appear before their parents
if (isset($acr2parent)) {
	foreach($acr2full as $acr=>$full) {
		$parent = $acr2parent[$acr];
		if (isset($parent)) {
			$parentShape = $acr2shape[$parent];
			unset($acr2shape[$parent]);
			$acr2shape[$parent] = $parentShape;
		}
	}
}
// fill acr2shape, use 'C' for regions with children
foreach($acr2shape as $acr=>$shape) {
	$parent = $acr2parent[$acr];
	$parentShape = $acr2shape[$parent];
	if ($shape != 'U' && $parentShape == 'U') {
		$acr2shape[$parent] = 'C';
	}
}
// check if each rgb has an entry in $acr2full
foreach($brainregions as $rgb=>$x) {
	$acr = $rgb2acr[$rgb];
	if (!isset($acr2full[$acr])) {
		$acr2full[$acr] = 'ERROR, no full name defined for rgb #'.$rgb.'/acronym '.$acr;
	}
}  
// list the regions
header('Content-type: text/plain');
foreach($acr2full as $acr=>$full) {
	$rgb = $acr2rgb[$acr];
	echo '#'.$rgb."\t".$acr;
	$full = $acr2full[$acr];
	echo "\t".$full;
	$parent = $acr2parent[$acr];
	echo "\t".$parent;
	$shape = $acr2shape[$acr];    
	echo "\t".$shape;
	echo "\n";
}
?>