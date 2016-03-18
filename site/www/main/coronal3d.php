<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|Coronal3d",
  "title": "Interactive 3d atlas viewer (coronal)",
  "description": "The main atlas viewer, based on 3d display of coronal sections"
}
SITEMAP
,TRUE);

require_once('../../shared-php/fancysite.php');
require_once('../../shared-php/applet.php');
require_once('../../lib-php/sba_viewer.php');

$siteMap = new siteMap_class($info);
$applet = new applet_class('get');

class templateField_class extends selectField_class {
  function parseAndValidate(&$value) {
    $error = NULL;
    if (strpos($value,'dev:') === 0) {
      $value = substr($value,4);
      $path = '../../templates_dev/'.$value;
      $useCache = FALSE;
      if (!is_dir($path.'/template')) $error = 'Cannot find template data at "'.$path.'"';
    } else {
      $error = parent::parseAndValidate($value);
      $path = '../templates/'.$value;
      $useCache = TRUE;
    }
    $value = array($path,$value,$useCache);
    return $error;
  }
}

$f = new templateField_class('Atlas template');
$f->setChoices(listTemplates_release('alpha',TRUE),NULL);
$applet->addFormField('template',$f);

list($inputs,$errors) = $applet->validateInputs($_REQUEST);
list($templatePath,$template,$useCache) = $inputs['template'];

if (!$template || count($errors)) {
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
  echo $applet->standardFormHtml('Start atlas viewer','_top',$_REQUEST);  
  if (count($errors) && isset($template)) echo $applet->errorReport($errors);
  echo '</p></body></html>';
  exit;
}

/*
 * On submit
 */
$jsonPath = $templatePath.'/template/';

// default configuration
$config = json_decode(file_get_contents('../main/config.json'),true);

// overload with template-specific configuration
$tmp = json_decode(file_get_contents($templatePath.'/config.json'),true);
foreach ($tmp as $k=>$v) $config[$k] = $v;
$config['template'] = $template;
$config['templatePath'] = $templatePath;
$config['debug'] = isset($_REQUEST['debug']);
$config['width3d'] = $config['width3d']['main'][0];
$config['width2d'] = array($config['width2d']['main'][1],$config['width2d']['main'][2]);
$fname = $templatePath.'/3dbar_overlay.png';
$config['overlay3d'] = file_exists($fname);
$fname = $templatePath.'/mid_saggital.jpg';
$config['saggital3d'] = file_exists($fname);

$info['title'] = 'Scalable Brain Atlas - '.@$config['templateName'];
$info['path'] = str_replace('coronal3d',$template,$info['path']);
$siteMap = new siteMap_class($info);

function fileContents($fname,$alt='null') {
  $ans = @file_get_contents($fname);
  return $ans ? $ans : $alt;
}

function formatCitation($df) {
  $ans = array();
  if (@$df['authors']) $ans[] = htmlspecialchars(implode(', ',$df['authors']));
  if (@$df['year']) $ans[] = ' ('.htmlspecialchars($df['year']).')';
  if (@$df['title']) $ans[] = ' "'.htmlspecialchars($df['title']).'"';
  if (@$df['journal']) $ans[] = ' <i>'.htmlspecialchars($df['journal']).'</i>';
  if (@$df['volume']) $ans[] = ' '.htmlspecialchars($df['volume']);
  if (@$df['pages']) $ans[] = ':'.htmlspecialchars($df['pages']);
  if (@$df['doi']) $ans[] = '. <a href="http://dx.doi.org/'.$df['doi'].'">'.htmlspecialchars($df['doi']).'</a>';
  $ans = implode('',$ans);
  return $ans;
}

// deal with non-SVG compatible browsers
$acceptXHTML = stristr($_SERVER["HTTP_ACCEPT"],'application/xhtml+xml');
$svgCapable = $acceptXHTML && !isset($_REQUEST['nosvg']);
$contentType = ($svgCapable ? 'application/xhtml+xml' : 'text/html');
header('Content-Type: '.$contentType.'; charset=utf-8');
echo '<?xml version="1.0" encoding="utf-8"?>';

// merge default and specific plugins
$plugins = $config['defaultPlugins'];
if (isset($plugins)) unset($config['defaultPlugins']);
else $plugins = array();
if (isset($config['plugins'])) $plugins = array_unique(array_merge($plugins,$config['plugins']));
$config['plugins'] = $plugins;

// prepare superzoom and regular overlays
$overlays = array();
$hasSuperzoom = isset($config['superzoom']);
if ($hasSuperzoom) {
  $origSlicePos = @json_decode(fileContents($jsonPath.'origslicepos.json'),TRUE);
  if ($origSlicePos) {
    foreach ($config['superzoom'] as $key=>$lr) {
      if (!isset($lr['slicepos'])) {
        $pattern = $lr['source'];
        $lr['slicepos'] = pathinfo($pattern,PATHINFO_DIRNAME).'/slicepos.json';
      }
      if (is_string($lr['slicepos'])) {
        $fname = $templatePath.'/'.$lr['slicepos'];
        if (is_file($fname)) {
          $poslist = json_decode(file_get_contents($fname),TRUE);
          $lr['poslist'] = $poslist;
        }
      } else {
        $poslist = $lr['slicepos'];
      }
      if (isset($poslist)) {
        $orig2overlay = array();
        foreach ($poslist as $i=>$pos) {
          $orig = findNearest($pos,$origSlicePos);
          $orig2overlay[$orig] = $i;
        }
        $lr['orig2overlay'] = $orig2overlay;
      }
      // slice shape
      $lr['sliceshape'] = pathinfo($pattern,PATHINFO_DIRNAME).'/sliceshape.json';
      $fname = $templatePath.'/'.$lr['sliceshape'];
      if (is_file($fname)) {
        $shapelist = json_decode(file_get_contents($fname),TRUE);
        $lr['shapelist'] = $shapelist;
      }
      $overlays[$key.'+'] = $lr;
    }
  }
}

// prepare overlays
$hasOverlays = isset($config['overlays']);
if ($hasOverlays) {
  $origSlicePos = @json_decode(fileContents($jsonPath.'origslicepos.json'),TRUE);
  if ($origSlicePos) {
    foreach ($config['overlays'] as $key=>$lr) {
      if (isset($lr['slicepos'])) {
        if (is_string($lr['slicepos'])) {
          $fname = $templatePath.'/'.$lr['slicepos'];
          if (is_file($fname)) {
            $poslist = json_decode(file_get_contents($fname),true);
          }
        } else {
          $poslist = $lr['slicepos'];
        }
        if (isset($poslist)) {
          $orig2overlay = array();
          foreach ($poslist as $i=>$pos) {
            $orig = findNearest($pos,$origSlicePos);
            $orig2overlay[$orig] = $i;
          }
          $lr['orig2overlay'] = $orig2overlay;
          //echo(json_encode($orig2overlay));
        }
      }
      $overlays[$key] = $lr;
    }
  }  
}
$config['overlays'] = $overlays;
?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<?php
echo $siteMap->windowTitle();
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->clientScript();
?>
<?php if ($svgCapable) {?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style id="svg_style" type="text/css">
    <![CDATA[
    path { opacity: 1; fill: #606055; stroke: #FFF; stroke-width: 0.4in; }
    path.onwhite { stroke: #0D0 }
    path.wm { fill-opacity: 0.7; fill: #998; }
    path.gm { fill-opacity: 0.7; fill: #202530; }
    path.marker { opacity: 1; stroke: #000; stroke-width: 0.2in; }
    path.invisible { opacity: 0; }
    text.marker { opacity:1; text-anchor: middle; fill: #000; stroke: #000; stroke-width: 0; font-size: 120px; font-family: Verdana; font-weight: bold }
    .semifill { opacity: 0.3; }
    .nofill { fill-opacity: 0; }
    .noborders { opacity: 0; }
    .highlight { fill: #F00; stroke-width: 0.3in; }
    .acronym_highlight { fill: none; stroke: #F00; stroke-width: 0.5in; }
    .circle_highlight { fill: none; stroke: #AAF; stroke-width: 0.5in; }
    .hull { opacity: 1; fill: none; stroke: #CBC; stroke-width: 0.5in;  }
    .hull_10 { fill-opacity: 0; fill: #FFF; stroke: none }
    .hull_highlight { fill-opacity: 0.65; fill: #FEB; stroke-opacity: 1; stroke: #00F; stroke-width: 2.0in; }
    ]]>
    </style>
  </defs>
</svg>
<?php }?>

<style type="text/css">
html,body { 
  position: relative;
  margin: 0px;
  padding: 0.5%; 
  background: #FFF;
}
#permalink {
  float: right
}
#SBA_VIEWPANEL {
  margin-top:6px; 
  width: 100%;
  min-width: 600px;
<?php 
$skin = 'EDA';
if (isset($_REQUEST['skin'])) {
  $skin = $_REQUEST['skin'];
  $skin = preg_replace('/[^\d\w]+/','',$skin);
}
echo 'background: #'.$skin.';'; 
?>
  padding: 12px; 
  border: 2px solid #999;
  -moz-border-radius: 12px;
  border-radius: 12px;
}
#view3d_panel {
  width: 100%;
  padding-bottom: 22%
}
#view3d_svg {
  position: absolute; 
  left: 0%;
  width: 74%;
  top: 0.5%;
  bottom: 0.5%;
  overflow-x: hidden; 
  overflow-y: scroll;
}
#view3d_controls {
  position: absolute; 
  left: 75%;
  width: 25%;
  top: 0.5%;
  bottom: 0.5%;
}
img.view3d_surface {
  max-width: 100%;
  height: 38%;
  max-height: 38%;
}
#view3d_new {
  position: absolute; 
  top:10%; left:20%; 
  text-align: center; 
  background-color:rgba(255,255,255,0.8); 
  border: 1px solid #aaa
}
#view3d_title {
  width: 30%; 
  top: 0%;
  padding-left: 2ex; 
  text-indent: -2ex;
}
#view3d_search {
  position: absolute;
  top: 0%;
  left: 30%;
  width: 40%;
}
#searchBrainRegion {
  width: 100%
}
#view2d_panel {
  width: 100%;
  padding-bottom: 36%;
}
#SBA_PLUGINS {
  position: absolute;
  top: 0%;
  bottom: 0%;
  width: 27.5%;
  overflow: auto
}
#view2d_content {
  position: absolute; 
  left: 28%;
  width: 44%; 
  top: 0%;
  bottom: 0%;
  overflow-x: hidden; 
  overflow-y: hidden;
}
#view2d_overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #000; 
  display: none;
}
#view2d_overlaybuttons {
  position: absolute; 
  top: 0%;
  width: 100%;
}
#view2d_overlay_img {
  position: absolute;
}
#view2d_svg {
}
#SBA_REGIONS {
  position: absolute; 
  left: 72%;
  width: 27.5%;
  top: 0%;
  bottom: 0%; 
  background:#FEC
}
h2 {
  margin-top: 3px;
}
ul.sba {
  padding: 0px;
  margin: 0px;
  list-style-type: none;
}
ul.sba li {
  padding-bottom: 4px;
}
span.emph,a.emph {
  color: #510;
  font-weight: bold;
}
a.emph:link { text-decoration: none; }
a.emph:visited { text-decoration: none; }
a.emph:hover { color: red }
a.link { color: #00D; }
ul.sitelist {
  color: #000;
  padding: 2px;
  margin: 0px;
  list-style-type: none;
  font-size: small;
}
.sitelist .highlight {
  background: #007;
  color: #DDD;
}
a.rgb {
  font-size: small;
}
input.overlay-off,input.overlay-on {
  font-size: 10px;
  font-weight: bold;
  border: 1px solid #000;
  margin-left: 2px;
  z-index: 9;
}
input.overlay-off {
  color: #FFF;
  background-color: #668;
}
input.overlay-on {
  color: #000;
  background-color: #FFF;
}
div.plugins,div.regions {
  border: 1px solid #999;
  background: #FFF;
  -moz-border-radius: 9px;
  border-radius: 9px;
  padding-top: 0px;
}
div.regions {
  background: #FEC;
}
div.plugin-head,div.regions-head {
  font-size: small;
  border-bottom: 1px solid #999;
  padding: 3px;
  padding-left: 6px;
  height: 28px;
}
div.plugin-content,div.regions-content {
  position: absolute;
  font-size: small;
  overflow-y: auto;
  margin: 3px;
  margin-left: 6px;
  top: 36px;
  bottom: 0px;
  overflow: auto;
}
div.plugin-item {
  font-size: medium;
  height: 100px;
  width: 100px;
  text-align: center;
  padding: 2px;
  margin: 10px;
  border: 1px solid #999;
  -moz-border-radius: 6px;
  border-radius: 6px;
  display: inline-block;
}
div.plugin-item a:hover {
  text-decoration: none;
}
div.plugin-item:hover {
  border: 1px solid #009;
  background: #EEE;
}
table.fancy {
  border-collapse: collapse;
  background: #FFF
}
table.fancy td,th {
  border: 1px solid #999;
  padding-left: 2px;
  padding-right: 2px;
  text-align: left
}
div.inlineBlue {
  color: #006;
  display: inline-block;
}
#licenseAccept {
  text-align: center;
  padding: 40px;
  border: 5px solid #00A;
  -moz-border-radius: 20px;
  border-radius: 20px;
}
</style>
<link rel="stylesheet" type="text/css" href="../css/myPage.css"/>
<link rel="stylesheet" type="text/css" href="../css/myForms.css"/>
<link rel="stylesheet" type="text/css" href="../css/myTree.css"/>
<script type="text/javascript">
browser.include_script_once("../js/json.js");
browser.include_script_once("../js/hash.js");
browser.include_script_once("../js/instanceManager.js");
browser.include_script_once("../js/errorConsole.js");
</script>
<script type="text/javascript" src="../js/fastsuggest.js"></script>
<script type="text/javascript" src="../js/tooltip.js"></script>
<script type="text/javascript" src="../js/myMenu.js"></script>
<script type="text/javascript" src="../js/myTree.js"></script>
<script type="text/javascript" src="../shared-js/jsonRequest.js"></script>
<script type="text/javascript">
jsonRPC_class.prototype.serverError = function(msg) {
  if (typeof msg == 'object') {
    globalErrorConsole.addError(json_encode(msg));
  } else {
    globalErrorConsole.addError(msg);
  }
}
</script>
<script type="text/javascript" src="../js/sba_regiontree.js"></script>
<script type="text/javascript" src="../js/sba_viewer.js"></script>
<script type="text/javascript" src="../js/sba_plugins.js"></script>
<?php

// deal with featured overlay
if (isset($_REQUEST['underlay2d'])) {
  $featuredOverlay = $_REQUEST['underlay2d'];
  if (isset($config['overlays'][$featuredOverlay])) {
    $config['featuredOverlay'] = $featuredOverlay;
  }
}

// deal with featured/external plugin
$featuredPlugin = @$_REQUEST['plugin'];
$externalPlugin = NULL;
if (isset($featuredPlugin)) {
  if (strncmp($featuredPlugin,'http://',7)==0 || strncmp($featuredPlugin,'https://',8)==0) {
    $ok = preg_match('/([\d\w_]+)_plugin\.js/',$featuredPlugin,$matches);
    if ($ok) {
      $scriptSource = $featuredPlugin;
      //$externalPlugin = '@'.$matches[1];
      $externalPlugin = $matches[1];
      $config['featuredPlugin'] = $externalPlugin;
      $config['plugins'][] = $externalPlugin;
      echo '<script type="text/javascript" src="'.str_replace('"','\"',$scriptSource).'"></script>';
      $featuredPlugin = $externalPlugin;
    } else {
      echo '<script type="text/javascript">globalErrorConsole.addError('.json_encode('Invalid external plugin '.$featuredPlugin).')</script>';      
    }
  } else {
    $config['featuredPlugin'] = $featuredPlugin;
  }
}

// load plugin-related javascript
$plugins = $config['plugins'];
if (isset($plugins)) {
  $ep = substr($externalPlugin,1);
  foreach ($plugins as $pn) {
    if ($pn != $ep) {
      $pluginScript = '../plugins/'.strtolower($pn).'_plugin.js';
      if (file_exists($pluginScript)) {
        echo '<script type="text/javascript" src="'.$pluginScript.'"></script>';    
      } else {
        $pluginScript = '../plugins/'.strtolower($pn).'_plugin.php';
        if (file_exists($pluginScript)) {
          echo '<script type="text/javascript" src="'.$pluginScript.'"></script>';    
        }
      }
    }
  }
}

?>
<script type="text/javascript">
//<![CDATA[
<?php
require_once('../../lib-php/sba_viewer.php');
$STATE = $_REQUEST;
$acr = @$STATE['acr'];
$region = @$STATE['region'];
$slice = @$STATE['slice'];
$rgb2acr = json_decode(fileContents($jsonPath.'rgb2acr.json','[]'),true);
$acr2parent = json_decode(fileContents($jsonPath.'acr2parent.json','[]'),true);
$acr2rgb = array_flip($rgb2acr);
$alias2acr = json_decode(fileContents($jsonPath.'alias2acr.json','[]'),true);
if (!isset($acr) && isset($region)) {
  $brainRegions = json_decode(fileContents($jsonPath.'brainregions.json','[]'),true);
  $brainSlices = json_decode(fileContents($jsonPath.'brainslices.json','[]'),true);

  // get acr from region
  $acr = findAcrForGivenRegion($region,$rgb2acr,$acr2parent,$alias2acr);
  
  // get rgb list
  $rgbList = getRgbList($acr,$rgb2acr,$acr2parent,$acr2rgb);
  if (!isset($slice)) {
    // get middle slice
    $slice = getMiddleSlice($rgbList,$brainRegions,$brainSlices);
  }
  
  $STATE['acr'] = (isset($acr) ? $acr : $region);
  $STATE['slice'] = $slice;
  unset($STATE['region']);
}
// compose rgbWhite (contains white matter regions)
$RGB_WHITE = array();
$wm = @$config['whiteMatterAcronyms'];
if ($wm) {
  foreach($wm as $acr) {
    $rgbList = getRgbList($acr,$rgb2acr,$acr2parent,$acr2rgb);
    foreach($rgbList as $rgb) $RGB_WHITE[$rgb] = 1;
  }
}
echo 'var RGB_WHITE='.json_encode($RGB_WHITE).";\n";

$acr2full = json_decode(fileContents($jsonPath.'acr2full.json'),true);
if (!isset($acr2full)) $acr2full = $acr2rgb;
// Note: the most important template data is loaded in iframe "TEMPLATE"
echo 'var RGB_TO_ACR='.json_encode($rgb2acr).";\n";
echo 'var ACR_TO_FULL='.json_encode($acr2full).";\n";
echo 'var ACR_TO_PARENT='.json_encode($acr2parent).";\n";
echo 'var ALIAS_TO_ACR='.json_encode($alias2acr).";\n";
echo 'var HULLS='.fileContents($jsonPath.'hulls.json').";\n";
echo 'var SLICE_POS='.fileContents($jsonPath.'slicepos.json').";\n";
echo 'var ORIGSLICE_POS='.fileContents($jsonPath.'origslicepos.json').";\n";
echo 'var CONFIG='.json_encode($config).";\n";
echo 'var ACR_TO_NNID='.fileContents($jsonPath.'acr2nnid.json').";\n";
// deprecated
echo 'var RGB_CENTERS_YXZ='.fileContents($jsonPath.'rgbcenters.json').";\n";
// replacement
echo 'var RGB_CENTERS='.fileContents($jsonPath.'rgbcenters_mm.json').";\n";
echo 'var RGB_VOLUMES='.fileContents($jsonPath.'rgbvolumes.json').";\n";
if (!$useCache) {
  echo 'var SVG_PATHS='.fileContents($jsonPath.'svgpaths.json').";\n"; 
  echo 'var BRAIN_REGIONS='.fileContents($jsonPath.'brainregions.json').";\n"; 
  echo 'var BRAIN_SLICES='.fileContents($jsonPath.'brainslices.json').";\n"; 
}
?>;
if (HULLS != undefined) {
  for (var k in HULLS) {
    if (typeof(HULLS[k]) == 'string') HULLS[k] = [HULLS[k]];
  }
}
var BS_SUGGESTIONS = undefined;

window.bodyOnchange = function(query) {
  var kv = query.split('&');
  var newState = sbaViewer.validateState(hash.createFromKeyValueStrings(kv,'='));
  sbaViewer.applyStateChange(newState);
}

// called from iframe "TEMPLATE"
window.bodyOnload = function() {
  // link to global variables in iframe
  if (!window.SVG_PATHS) {
    window.SVG_PATHS = window.TEMPLATE.SVG_PATHS;
    window.BRAIN_REGIONS = window.TEMPLATE.BRAIN_REGIONS;
    window.BRAIN_SLICES = window.TEMPLATE.BRAIN_SLICES;
  }
  if (!window.SVG_PATHS) return;

  if (!this.sbaViewer) {
    this.sbaViewer = new sbaViewer_class(CONFIG,<?php echo $svgCapable ? 1 : 0 ?>);
    sbaViewer.initSuggestions();
  }
  
  // used by region hierarchy plugin
  this.selectRegion = function(acr) { sbaViewer.selectRegion(acr); }    

  // apply and render the current state
  var newState = sbaViewer.validateState(<?php echo json_encode($STATE) ?>);
  sbaViewer.applyStateChange(newState);
  //if (CONFIG.featuredPlugin) sbaPluginManager.activatePlugin('SBA_PLUGINS',CONFIG.featuredPlugin);
}

window.bodyOnresize = function() {
}

<?php if (1) ?>
// GOOGLE ANALYTICS
var _gaq = _gaq || [];
_gaq.push(['_setAccount','UA-18298640-1']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://www.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
<?php if (1) ?>
//]]>
</script>

</head>
<body onresize="bodyOnresize()" onload="bodyOnload()">
<div id="permalink">
  <a id="permalink" href="javascript:void(0)" onclick="sbaViewer.onClickPermaLink(event)">Permalink</a>
</div>
<?php
echo $siteMap->navigationBar();

$templateName = @$config['templateName'];
if (isset($templateName)) {
  if (@$config['release']=='alpha') echo '<div style="background: #A00; color: #FFF; padding:2px"><i>This template is under construction and may change or disappear without notice</i></div>';
  echo '<h2 style="margin-bottom:0px">'.$config['species'].' - '.$templateName.'</h2>';
  $download = isset($config['downloads']) ? '&#160;|&#160;<a href="#downloads">download</a>' : '';
  echo '<div><a href="#howtocite">terms of use</a>&#160;|&#160;<a href="#about">about</a>'.$download.'&#160;|&#160;<a href="#contact">contact</a>';
  $nlxId = @$config['nlxId'];
  if ($nlxId) {
    echo '&#160;|&#160;Neurolex: <a href="http://uri.neuinfo.org/nif/nifstd/'.$nlxId.'" target="_blank">'.$config['nlxName'].'</a>';
  }    
  $ncbiId = @$config['ncbiId'];
  if ($ncbiId) {
    echo '&#160;|&#160;NCBI: <a href="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='.$ncbiId.'" target="_blank">'.$config['ncbiName'].'</a>';
  }
  echo '</div>';
  if (isset($config['licenseHtml'])) {
    echo '<div id="licenseAccept">';
    $licenseHtml = implode('<br/>',$config['licenseHtml']);
    echo $licenseHtml.'<div style="margin-top: 40px"><input type="button" value="Hide" onclick="document.getElementById(\'licenseAccept\').style.display=\'none\'"/></div>';
    echo '</div>';
  }
}
?>
<div id="SBA_VIEWPANEL">
  <div id="view3d_panel">
    <div id="view3d_svg">Loading SVG...</div>
    <div id="view3d_controls">
<?php
$fname = $templatePath.'/3dbar_wholebrain.png';
if (file_exists($fname)) {
  echo '<img '.($config['overlay3d'] ? 'height="120" ':'').'src="'.$fname.'"/>';
}
$fname = $templatePath.'/lateral_wholebrain.png';
if (file_exists($fname)) {
  echo '<img class="view3d_surface" src="'.$fname.'"/>';
}
if (isset($config['meshdata'])) {
  echo '<div id="view3d_new"><a href="../services/view3d_l2v.php?template='.$template.'&amp;overlay=labels" target="SBA_x3d_viewer"><i>new!</i><br/>[3d viewer]</a></div>';
} else {
  $fname = $templatePath.'/wholebrain.x3d';
  if (file_exists($fname)) {
    $_and_stl = file_exists($templatePath.'/wholebrain.stl') ? '&amp;stl='.$templatePath.'/wholebrain.stl' : '';
    echo '<div style="position: absolute; top:40px; left:60px; background-color:rgba(255,255,255,0.5)"><a href="../services/x3d_viewer.php?x3d='.$fname.$_and_stl.'" target="SBA_x3d_viewer">[3d viewer]</a></div>';
  }
}
?>
  <br/>
  Slice spacing:<br/>
  <select id="sliceSpacing3d" onchange="sbaViewer.selectSpacing(this.options[this.selectedIndex].value)"><option value="0">Fiducial</option><option value="1">Fit width</option><option value="2">Very wide</option><option value="3">Intermediate</option></select>
  <br/>
  Rotate view:<br/>
  <button onclick="sbaViewer.prevAngle()"><img src="../img/rotback.gif" alt="back"/></button><input id="angle3d" type="text" size="3" onchange="sbaViewer.selectAngle(this.value)" onkeypress="if (navigator.appName=='Opera') if (browser.getKeyCode()==13) this.onchange()"/><button onclick="sbaViewer.nextAngle()"><img src="../img/rotforward.gif" alt="fwd"/></button>
<?php 
echo '<table>';
if ($config['overlay3d']) { 
  echo '<tr><td>3d overlay:</td><td><input type="button" value="Activate" onclick="sbaViewer.showOverlay3d(this)"/></td></tr>';
} 
if ($config['saggital3d']) { 
  echo '<tr><td>Saggital slice:</td><td><input id="SBAVIEWER_SHOWSAGGITAL3D" type="button" value="Activate" onclick="sbaViewer.showSaggital3d(this)"/></td></tr>';
} 
if (@$config['hemisphere']) {
  $L = strpos($config['hemisphere'],'L') !== FALSE;
  $R = strpos($config['hemisphere'],'R') !== FALSE;
  echo '<tr><td>Hemisphere:</td><td><select id="hemisphere3d" onchange="sbaViewer.selectClip3d(\'signX\',this.options[this.selectedIndex].value)">'.($L ? '<option value="1">Left</option>':'').($R ? '<option value="-1">Right</option>':'').($L&$R ? '<option value="0">Both</option>':'').'</select></td></tr>';
}
echo '</table>';
?>
    </div>
  </div>
  <div style="height: 64px">
    <div id="view3d_title">
    </div>
    <table id="view3d_search"><tr>
      <td style="width:7ex; text-align: right">Search: </td><td><input id="searchBrainRegion" type="text" onfocus="this.select()" onchange="sbaViewer.selectSuggestedRegion(this.value)"/></td>
    </tr><tr>
      <td style="text-align: right">Slice: </td>
      <td><div style="position: absolute; width: 150%; top: 0px"><input type="button" value="&lt;" onclick="sbaViewer.prevSlice()"/><input id="slice_no" type="text" size="7" onchange="sbaViewer.parseAndSelectSlice(this.value)"/><input type="button" value="&gt;" onclick="sbaViewer.nextSlice()"/><span id="slice_pos" style="font-size: small"></span></div>
      </td>
    </tr></table>
  </div>
<?php
if (!$svgCapable) {
  echo '<div style="background: #FFF; color: #A00; padding: 5px; margin-top: 5px; border: 2px solid #999">';
  echo 'Oops, interactive graphical content is disabled, as you seem to have an SVG-incapable browser.<br/>';
  echo '</div>';
}
?>
<div id="view2d_panel">
  <div id="SBA_PLUGINS" class="plugins">
  </div>
  <div id="view2d_content">
<?php
if ($hasOverlays) {
  echo '<div id="view2d_overlay">';
  echo '<img id="view2d_overlay_img"/>';
  echo '</div>';
}
?>
    <div id="view2d_svg">
    Loading SVG...
    </div>
<?php
if ($hasOverlays) {
  echo '<div id="view2d_overlaybuttons">';
  echo '&#160;<input id="TOGGLE_DELINEATION" type="button" class="overlay-on" value="borders" onclick="sbaViewer.selectOverlay()"/>';
  foreach($config['overlays'] as $k=>$v) {
    if (isset($v['format']) && $v['format'] == "dzi") continue;
    echo '<input id="TOGGLE_'.$k.'" type="button" class="overlay-off" value="'.$k.'" onclick="sbaViewer.selectOverlay(\''.$k.'\')"/>';
  }
  echo '</div>';
}
?>
  </div>
  <div id="SBA_REGIONS" class="plugins">
  </div>
</div>
</div>
<?php
echo '<iframe style="display: none" name="KEEPHISTORY" id="KEEPHISTORY" src="../php/keephistory.php"></iframe>';
if ($useCache) {
  echo '<iframe style="display: none" name="TEMPLATE" id="TEMPLATE" src="../php/template_container.php?template='.$template.'&amp;svgcapable='.$svgCapable.'"></iframe>';
}
?>
<?php
$definingCitations = array();
if (isset($config['definingCitations'])) {
  foreach ($config['definingCitations'] as $df) {
    $definingCitations[] = formatCitation($df);
  }
  implode("\n",$definingCitations);
}
$about = @file_get_contents('../'.$template.'/creditsLinks.snip');
if (isset($config['aboutHtml'])) {
  $about .= '<p>'.implode('</p><p>',$config['aboutHtml']).'</p>';
}
if (!$about) $about = '';
echo '<p/><h2>About this atlas</h2><a name="about"/><ul class="sba">'.$about.'</ul>';
echo '<a name="howtocite"/>';
echo '<p/><h2>Terms of use</h2>';
if (isset($config['licenseUrl'])) {
  echo 'This template is subject to <a href="'.htmlspecialchars($config['licenseUrl']).'">license terms</a>';
  echo (isset($config['licenseIssuer']) ? ', issued by the '.htmlspecialchars($config['licenseIssuer']).'.<br/>' : '.<br/>');
  echo 'In addition, you must abide by our <a href="../main/citationpolicy.php">citation policy</a>, designed to give proper credit to atlas makers.<br/>';
} else {
  echo 'The Scalable Brain Atlas does not "own" any of its templates. To ensure that the atlas makers receive proper credit, you must abide by our <a href="../main/citationpolicy.php">citation policy</a>.<br/>';
}
echo 'In brief, always (1) cite <i>each data source</i> that contributed to your analysis, and (2) cite the Scalable Brain Atlas <a href="../main/citationpolicy.php#sba">main publication</a> and <a href="../main/citationpolicy.php#plugins">plugin references</a> where appropriate.';
if ($definingCitations) echo '<br/>The defining citations for this atlas template are:<ol><li>'.implode('</li><li>',$definingCitations).'</li></ol>';
if (isset($config['downloads'])) {
  $licenseTerms = isset($config['licenseUrl']) ? '<a href="'.htmlspecialchars($config['licenseUrl']).'">license terms</a>' : 'license terms';
  $dataSource = isset($config['sourceUrl']) ? '<a href="'.htmlspecialchars($config['sourceUrl']).'">original atlas data source</a>' : 'original atlas data source';
  echo '<a name="downloads"/>';
  echo '<p/><h2>Downloads</h2>';
  echo 'The Scalable Brain Atlas provides selected (downsampled) datasets for your convenience. Always check the '.$licenseTerms.' of the '.$dataSource.', which may also contain additional and higher resolution data sets.';
  $downloads = $config['downloads'];
  echo '<ul>';
  foreach ($downloads as $key=>$src) {
    $versions = @$src['versions'];
    $descr = @$src['descr'];
    if ($key == 'labels') {
      $descr .= '<br/>The <a href="../services/labelmapper.php?template='.$template.'">label index mapper</a> converts label indices to acronyms, full names, and rgb-values.';
    }
    if (is_array($descr)) $descr = @implode('<br/>',$descr);
    echo '<li>'.$key.': '.$descr;
    echo '<ul>';
    if (is_array($versions)) foreach ($versions as $v) {
      $url = @$v['url'];
      $filesize = @$v['filesize'];
      if ($filesize>100e6) $filesize = round($filesize*1e-6).'&#160;MB';
      elseif ($filesize>100e3) $filesize = round($filesize*1e-3).'&#160;kB';
      $shape = isset($v['shape']) ? '; shape ['.implode('x',$v['shape']).']' : '';
      echo '<li><a href="'.$url.'">'.$url.'</a>; filesize '.$filesize.$shape.'</li>';
    }
    echo '</ul></li>';
  }
  echo '</ul>';
}
echo '<hr/><a name="contact"/>The <i><span class="emph">Scalable Brain Atlas</span></i> is developed by Rembrandt Bakker and <a href="../main/credits.php#acknowledgements">many contributors</a> with financial support from <a href="http://incf.org">INCF</a>, Radboud University Nijmegen, and <a href="../main/credits.php#grants">others</a>.<br/>Send <a href="mailto:feedback@scalablebrainatlas.org">feedback, report a bug, request a feature, collaborate</a>.'?>
</body>
</html>
