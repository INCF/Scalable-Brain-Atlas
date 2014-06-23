<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|neuroVIISAS hierarchy",
  "title": "Export brain region hierarchy to neuroVIISAS-compatible XML",
  "description": "<a href=\"http://139.30.176.116/index.htm\">neuroVIISAS</a> is a platform for mapping, visualization and analysis of connectivity data from tracing studies"
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
$f->setChoices(array('xml'=>'NeuroVIISAS XML','table'=>'Summary table'),NULL);
$applet->addFormField('output',$f);

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = $_REQUEST['template'];
$runLevel = $applet->runLevel($_REQUEST['run'],$template);

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
	echo $applet->standardFormHtml('Export brain hierarchy');
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
$rgb2acr = json_decode(file_get_contents($jsonPath.'rgb2acr.json'),true);
global $acr2full;
$acr2full = json_decode(file_get_contents($jsonPath.'acr2full.json'),true);
$acr2parent = json_decode(file_get_contents($jsonPath.'acr2parent.json'),true);
global $acr2rgb;
$acr2rgb = array_flip($rgb2acr);

function addAcronymChildren(&$node,$acr) {
  global $acr2children,$acr2rgb,$acr2full;
  if (isset($acr2children[$acr])) {
		foreach ($acr2children[$acr] as $ch) {
			$aChild = $node->addChild('void');
			$aChild->addAttribute('property','unterHirne');
			$bChild = $aChild->addChild('void');
			$bChild->addAttribute('method','add');
			$cChild = $bChild->addChild('object'); 
			$cChild->addAttribute('id',$ch);
			$cChild->addAttribute('class','projekt.Hirnobjekt');
			// farbe
			if (isset($acr2rgb[$ch])) {
  			$rgb = $acr2rgb[$ch];
  			$dChild = $cChild->addChild('void');
  			$dChild->addAttribute('property','farbe');
			  $eChild = $dChild->addChild('object');
  			$eChild->addAttribute('class','java.awt.Color');
  			$fChild = $eChild->addChild('int',hexdec(substr($rgb,0,2)));
  			$fChild = $eChild->addChild('int',hexdec(substr($rgb,2,2)));
  			$fChild = $eChild->addChild('int',hexdec(substr($rgb,4,2)));
  			$fChild = $eChild->addChild('int',255);
			}
			// nameObjectForView
			$dChild = $cChild->addChild('void');
			$dChild->addAttribute('property','nameObjectForView');
			$eChild = $dChild->addChild('void');
			$eChild->addAttribute('property','name');
			$full = @$acr2full[$ch];
			if (!isset($full)) $full = $ch;
			$fChild = $eChild->addChild('string',$full);
			$eChild = $dChild->addChild('void');
			$eChild->addAttribute('property','shortName');
			$fChild = $eChild->addChild('string',$ch);

						
			// children
			addAcronymChildren($cChild,$ch);

			// vater
			$dChild = $cChild->addChild('void');
			$dChild->addAttribute('property','vater');
			$eChild = $dChild->addChild('object');
			$eChild->addAttribute('idref',$acr);
		}
  }
}

$rootLabel = '['.$template.']';
$flatLabel = '[not in hierarchy]';
$xsl = '';
if ($_REQUEST['output']=='table') $xsl = '<?xml-stylesheet type="text/xsl" href="../xsl/nvii_table.xsl"?>';
$xmlRoot = new SimpleXMLElement($xsl.'<java version="1.6.0_23" class="java.beans.XMLDecoder"></java>');
$node = $xmlRoot->addChild('object');
$node->addAttribute('class','projekt.HierarchyObject');
$node = $node->addChild('void');
$node->addAttribute('property','wurzel');
$node = $node->addChild('object');
$node->addAttribute('id',$rootLabel);
$node->addAttribute('class','projekt.Hirnobjekt');

// so there's rgb2acr and acr2parent
// valid acronyms are acr in rgb2acr, and parent in acr2parent.
global $acr2children;
$acr2children = array();
foreach ($acr2parent as $acr=>$p) $acr2children[$p] = array();
foreach ($acr2parent as $acr=>$p) $acr2children[$p][] = $acr;
// deal with parent-less regions
$rootNodes = array();
$flatNodes = array();
foreach ($acr2children as $acr=>$ch) if (!isset($acr2parent[$acr])) $rootNodes[] = $acr;
// deal with unassigned regions
foreach ($rgb2acr as $rgb=>$acr) {
  $p = @$acr2parent[$acr];
  if (!isset($p)) $flatNodes[] = $acr;
}
$acr2children[$rootLabel] = $rootNodes;
$acr2children[$flatLabel] = $flatNodes;
$acr2children[$rootLabel][] = $flatLabel;

addAcronymChildren($node,$rootLabel);

header('Content-type: text/xml');
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
echo $xmlRoot->asXML();
?>