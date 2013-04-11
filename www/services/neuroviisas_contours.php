<?php
ini_set('display_errors',1);
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|neuroVIISAS contours",
  "title": "Export brain region contours to neuroVIISAS-compatible XML",
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
$f->setChoices(array('xml'=>'NeuroVIISAS XML','txt'=>'XML, but with text header'),NULL);
$applet->addFormField('output',$f);

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = $_REQUEST['template'];
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
	echo $applet->standardFormHtml('Export brain region contours');
	echo '</body></html>';
	exit;
} elseif (count($errors)) {
  echo '<html>'.$applet->errorReport($errors).'</html>';
  exit;
}

/*
 * On submit
 */

// generate xml of the type:
// <region id="123" name="V1">
// <slice id="15">
// <polygon>0.0,0.5 1,0.5 1.2,1 0.5,1</polygon>
// <polygon>...</polygon>
// <polygon>...</polygon>
// </slice>
// </region> 

function decomposePath($d) {
  $parts = array();
  preg_match_all('/([MmLlCcZz])([^MmLlCcZz]*)/',$d,$M,PREG_PATTERN_ORDER);
  foreach ($M[1] as $i=>$m) {
    $M2 = trim($M[2][$i]);
    $points = explode(' ',str_replace(',',' ',$M2));
    if ($m == 'M' || $m == 'L') {
      $x = current($points);
      while ($x !== FALSE) {
        $xy = array($x,next($points));
        $parts[] = $m;
        $parts[] = $xy;
        $x = next($points);
      }
    } elseif ($m == 'l' || $m == 'm') {
      $dxy = $M2;
      $dxyPrev0 = NULL;
      while (isset($dxy)) {
        $dxy = explode(' ',$dxy,3);
        $xy[0] += $dxy[0];
        $xy[1] += $dxy[1];
        $parts[] = strtoupper($m);
        $parts[] = array($xy[0],$xy[1]);
        $dxyPrev0 = $dxy[0];
        $dxy = @$dxy[2];
      }
    } elseif ($m == 'c') { // curveto relative
      $dxy = $M2;
      while (isset($dxy)) {
        $dxy = explode(' ',$dxy,4);
        $dxy0 = explode(',',$dxy[0]);
        $dxy1 = explode(',',$dxy[1]);
        $dxy2 = explode(',',$dxy[2]); // 3rd point contains x,y
        $cp1 = array($xy[0]+$dxy0[0],$xy[1]+$dxy0[1]);
        $cp2 = array($xy[0]+$dxy1[0],$xy[1]+$dxy1[1]);
        $xy[0] += $dxy2[0];
        $xy[1] += $dxy2[1];
        $parts[] = strtoupper($m);
        $parts[] = array($cp1,$cp2,$xy);
        $dxy = @$dxy[3];
      } 
    } elseif ($m == 'C') { // curveto absolute
      $xy = $M2;
      while (isset($xy)) {
        $xy = explode(' ',$xy,4); // get 3 elems + remainder, elem[2] contains x,y
        if ($xy[0] != '') {
          $cp1 = explode(',',$xy[0]);
          $cp2 = explode(',',$xy[1]);
          $xy = explode(',',$xy[2]); // 3rd point contains x,y
          $parts[] = $m;
          $parts[] = array($cp1,$cp2,$xy);
          $xy = $xy[3];
        }
        $xy = $xy[3];
      } 
    } elseif ($m == 'z' || $m == 'Z') {
      $parts[] = $m;
    } else {
      echo 'Unknown command '.$m."\n";
    }
    if ($m == 'm' || $m == 'M') $xy0 = $xy;
  }
  if (isset($corelHorizontalLineBugFixes)) echo 'Fixed '.$corelHorizontalLineBugFixes.' Corel horizontal line bugs.'."\n";
  return $parts;
}

function svg2pix($xSvg,$ySvg,$config) {
  $bb = $config['boundingBox'];
  // $cf = $config['sliceCoordFrame'];
  $imageHeight = 512; // this is the height used by rgbslice with size=M
  $scaleFactor = $imageHeight/$bb[3];
  // This routine assumes that the underlying image covers the same physical area as the SVG boundingbox.
  // This is true for label images generated with the rgbslice service, but not for MRI overlays.
  return array($xSvg*$scaleFactor,$ySvg*$scaleFactor);
}

function mmPointsFromParts($parts,$config) {
	foreach($parts as $p) {
		if (is_array($p)) { 
			// p contains absolute coordinates
			if (is_array($p[0])) {
				$xy = $p[2];
			} else {
				$xy = $p;
			}
			$xy = svg2pix($xy[0],$xy[1],$config);
			$apoints[] = fixDecimals($xy[0],2).','.fixDecimals($xy[1],2);
		}
  }
  return $apoints;
}

require_once('../shared-lib/formatAs.php');
$jsonPath = '../'.$template.'/template/';
$config = json_decode(file_get_contents($jsonPath.'config.json'),true);
$rgb2acr = json_decode(file_get_contents($jsonPath.'rgb2acr.json'),true);
$acr2full = json_decode(file_get_contents($jsonPath.'acr2full.json'),true);
$acr2parent = json_decode(file_get_contents($jsonPath.'acr2parent.json'),true);
$acr2rgb = array_flip($rgb2acr);
$brainRegions = json_decode(file_get_contents($jsonPath.'brainregions.json'),true);
$svgPaths = json_decode(file_get_contents($jsonPath.'svgpaths.json'),true);
$slicePos = json_decode(file_get_contents($jsonPath.'slicepos.json'),true);

if ($_REQUEST['output']=='txt') formatAs_textHeaders(); else formatAs_xmlHeaders();
echo '<xml>'."\n";
foreach ($brainRegions as $rgb=>$regions) {
  $acr = $rgb2acr[$rgb];
  $full = $acr2full[$acr];
  echo '<region id="'.$rgb.'" abbr="'.$acr.'" name="'.$full.'">'."\n";
  foreach ($regions as $s0=>$paths) {
    $pos = $slicePos[$s0];
    echo '<slice id="'.($s0+1).'" pos="'.$pos.'">'."\n";
    foreach ($paths as $p) {
      $d = $svgPaths[$p];
      $parts = decomposePath($d);
      $points = mmPointsFromParts($parts,$config);
      echo '<polygon>'."\n".implode("\n",$points)."\n".'</polygon>'."\n";
    }
    echo '</slice>'."\n";
  }
  echo '</region>'."\n";
}
echo '</xml>';

?>