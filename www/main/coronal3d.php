<?php
// [ok] FIT WIDTH doesn't fit

$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|coronal3d",
  "title": "Interactive 3d atlas viewer (coronal)",
  "description": "The main atlas viewer, based on 3d display of coronal sections"
}
SITEMAP
,TRUE);

require_once('../shared-lib/sitemap.php');
require_once('../shared-lib/applet.php');
require_once('../lib/sba_viewer.php');

$siteMap = new siteMap_class($info);
$applet = new applet_class('get');
$f = new selectField_class('Atlas template');
$f->setChoices(listTemplates_release('alpha',TRUE),NULL);
$applet->addFormField('template',$f);

list($inputs,$errors) = $applet->validateInputs($_REQUEST);
$template = @$inputs['template'];

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
$jsonPath = '../'.$template.'/template/';

// default configuration
$config = json_decode(file_get_contents('../main/config.json'),true);

// overload with template-specific configuration
$tmp = json_decode(file_get_contents($jsonPath.'config.json'),true);
foreach ($tmp as $k=>$v) $config[$k] = $v;
$config['template'] = $template;
$config['debug'] = isset($_REQUEST['debug']);
$config['width3d'] = $config['width3d']['main'][0];
$config['width2d'] = array($config['width2d']['main'][1],$config['width2d']['main'][2]);
$fname = '../'.$template.'/3dbar_overlay.png';
$config['overlay3d'] = file_exists($fname);
$fname = '../'.$template.'/mid_saggital.jpg';
$config['saggital3d'] = file_exists($fname);

$info['title'] = 'Scalable Brain Atlas - '.@$config['templateName'];
$info['path'] = str_replace('coronal3d',$template,$info['path']);
$siteMap = new siteMap_class($info);

function fileContents($fname,$alt='null') {
  $ans = @file_get_contents($fname);
  return $ans ? $ans : $alt;
}

// deal with non-SVG compatible browsers
$acceptXHTML = stristr($_SERVER["HTTP_ACCEPT"],'application/xhtml+xml');
$chromeFrame = stristr($_SERVER["HTTP_USER_AGENT"],'chromeframe');
$svgCapable = ($acceptXHTML || $chromeFrame) && !isset($_REQUEST['nosvg']);
$contentType = ($svgCapable ? 'application/xhtml+xml' : 'text/html');
header('Content-Type: '.$contentType.'; charset=utf-8');
if ($chromeFrame) header('X-UA-Compatible: chrome=1');
echo '<?xml version="1.0" encoding="utf-8"?>';
//echo '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

// merge default and specific plugins
$plugins = $config['defaultPlugins'];
if (isset($plugins)) unset($config['defaultPlugins']);
else $plugins = array();
if (isset($config['plugins'])) $plugins = array_unique(array_merge($plugins,$config['plugins']));
$config['plugins'] = $plugins;

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
    path.onwhite { stroke: #0F0 }
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
div.view-panel {
<?php echo 'background: #'.(isset($_REQUEST['skin']) ? preg_replace('/[^\d\w]+/','',$_REQUEST['skin']) : 'EDA').';'; ?>
  padding: 12px; 
  border: 2px solid #999;
  -moz-border-radius: 12px;
  border-radius: 12px;
}
div.plugins,div.regions {
  border: 1px solid #999;
  background: #FFF;
  -moz-border-radius: 9px;
  border-radius: 9px;
}
div.regions {
  background: #FEC;
}
div.plugin-head,div.regions-head {
  font-size: small;
  border-bottom: 1px solid #999;
  padding: 3px;
  padding-left: 6px;
}
div.plugin-content,div.regions-content {
  font-size: small;
  overflow-y: auto;
  margin: 3px;
  margin-left: 6px;
}
div.plugin-item {
  font-size: medium;
  height: 100px;
  width: 100px;
  text-align: center;
  padding: 2px;
  margin: 14px;
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
#licenceAccept {
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

// include template-specific SBA script (deprecated)
//$jsFile = 'sba_'.$template.'.js';
//if (file_exists('../'.$template.'/'.$jsFile)) {
//  echo '<script type="text/javascript" src="../'.$template.'/'.$jsFile.'"></script>';
//}

// deal with featured overlay
if (isset($_REQUEST['underlay2d'])) {
  $featuredOverlay = $_REQUEST['underlay2d'];
  if (isset($config['overlays'][$featuredOverlay])) {
    $config['featuredOverlay'] = $featuredOverlay;
  }
}

// deal with featured/external plugin
$featuredPlugin = $_REQUEST['plugin'];
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
require_once('../lib/sba_viewer.php');
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
/* deprecated
echo 'var ACR_TO_NLXID='.fileContents($jsonPath.'acr2nlxid.json').";\n";
*/
echo 'var RGB_CENTERS='.fileContents($jsonPath.'rgbcenters.json').";\n";
echo 'var RGB_VOLUMES='.fileContents($jsonPath.'rgbvolumes.json').";\n";
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
  SVG_PATHS = window.TEMPLATE.SVG_PATHS;
  BRAIN_REGIONS = window.TEMPLATE.BRAIN_REGIONS;
  BRAIN_SLICES = window.TEMPLATE.BRAIN_SLICES;

  this.sbaViewer = new sbaViewer_class(CONFIG,<?php echo $svgCapable ? 1 : 0 ?>);
  sbaViewer.initSuggestions();
  
  // used by region hierarchy plugin
  this.selectRegion = function(acr) { sbaViewer.selectRegion(acr); }    

  // apply and render the current state
  var newState = sbaViewer.validateState(<?php echo json_encode($STATE) ?>);
  sbaViewer.applyStateChange(newState);
  //if (CONFIG.featuredPlugin) sbaPluginManager.activatePlugin('SBA_PLUGINS',CONFIG.featuredPlugin);
}

window.bodyOnresize = function() {
}

// GOOGLE ANALYTICS
var _gaq = _gaq || [];
_gaq.push(['_setAccount','UA-18298640-1']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'http://www.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
//]]>
</script>

</head>
<?php
// size of 3d panel elements
$w_svg3d = $config['width3d'];
$h_svg3d = $config['height3d'];
$w_ctrl3d = 180;
// size of 2d panel elements
$w_plugins = 400;
$bb = $config['boundingBox'];
$h_svg2d = $config['height2d'];
$wScroll = $h_svg2d/$bb[3]*$bb[2];
$wMin = $config['width2d'];
if (is_array($wMin)) list($wMin,$wMax) = $wMin;
else $wMax = $wMin;
if ($wScroll<$wMin) $w_svg2d = $wMin;
elseif ($wScroll>$wMax) $w_svg2d = $wMax;
else $w_svg2d = $wScroll;
$w_regions = 380;
$h_svg2d += 20;

// overall
$w_panel3d = $w_svg3d+$w_ctrl3d+28;
$w_panel2d = $w_plugins+10+$w_svg2d+10+$w_regions+28;
if ($w_panel3d > $w_panel2d) {
  $w_regions += $w_panel3d-$w_panel2d;
  $w_panel2d += $w_panel3d-$w_panel2d;
}
$w_panel = $w_panel2d;
?>
<body style="margin: 0px; padding: 0px; background: #FFF" onresize="bodyOnresize()"><div style="padding: 16px">
<?php
echo $siteMap->navigationBar();

$templateName = @$config['templateName'];
if (isset($templateName)) {
  echo '<table><tr><td rowspan="2" style="padding-right:3px"><a href="#about"><img src="../img/info.png"/></a></td><td>';
  if (@$config['release']=='alpha') echo '<div style="background: #A00; color: #FFF; padding:2px"><i>This template is under construction and may change or disappear without notice</i></div>';
  echo '<h2 style="margin-bottom:0px">'.$config['species'].' - '.$templateName.'</h2></td></tr><tr><td>';
  $nlxId = @$config['nlxId'];
  if ($nlxId) {
    echo ' '.$config['nlxName'].' (<a href="http://neurolex.org/wiki/'.$nlxId.'" target="_blank">Neurolex</a>)';
    $ncbiId = @$config['ncbiId'];
    if ($nlxId) {
      echo ' | '.$config['ncbiName'].' (<a href="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='.$ncbiId.'" target="_blank">NCBI</a>)';    
    }
  }
  echo '</td></tr>';
  if (isset($config['licenceHtml'])) {
    $licenceHtml = $config['licenceHtml'];
    echo '<tr><td colspan="2" id="licenceAccept">'.$licenceHtml.'<div style="margin-top: 40px"><input type="button" value="Hide" onclick="document.getElementById(\'licenceAccept\').style.display=\'none\'"/></div></td></tr>';
  }
  echo '</table>';
}
?>
<div style="position: absolute; top: 0px; left: <?php echo ($w_panel-100); ?>px; width: 100px; text-align: right"><a id="permalink" href="javascript:void(0)" onclick="sbaViewer.onClickPermaLink(event)">Permalink</a>
</div>
<div id="SBA_VIEWPANEL" class="view-panel" style="margin-top:6px; width: <?php echo $w_panel; ?>px;">
  <div id="view3d_svg" style="width: <?php echo ($w_svg3d+20); ?>px; height: <?php echo $h_svg3d; ?>px; overflow-x: auto; overflow-y: scroll">Loading SVG...</div>
  <div id="view3d_controls" style="position: absolute; left: <?php echo ($w_svg3d+36); ?>px; top: 10px; width: <?php echo $w_ctrl3d; ?>px">
<?php
$fname = '../'.$template.'/3dbar_wholebrain.png';
if (file_exists($fname)) {
  echo '<img '.($config['overlay3d'] ? 'height="120" ':'').'src="'.$fname.'"/>';
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
  <div style="height: 64px">
    <div id="view3d_title" style="width: <?php echo $w_plugins ?>px; padding-left: 2ex; text-indent: -2ex">
    </div>
    <div style="position: absolute; left: <?php echo $w_plugins+10 ?>px; top: 0px">
      Search: <input id="searchBrainRegion" type="text" size="60" onfocus="this.select()" onchange="sbaViewer.selectSuggestedRegion(this.value)"/>
    </div>
    <div style="position: absolute; left: <?php echo $w_plugins+10 ?>px; top: 30px">
      Slice: <input type="button" value="&lt;" onclick="sbaViewer.prevSlice()"/><input id="slice_no" type="text" size="7" onchange="sbaViewer.parseAndSelectSlice(this.value)"/><input type="button" value="&gt;" onclick="sbaViewer.nextSlice()"/><span id="slice_pos" style="font-size: small"></span>
    </div>
  </div>
<?php
if (!$svgCapable) {
  echo '<div style="background: #FFF; color: #A00; padding: 5px; margin-top: 5px; border: 2px solid #999">';
  echo 'Oops, interactive graphical content is disabled, as you seem to have an SVG-incapable browser.<br/>';
  echo 'The viewer works well in recent versions of these browsers: ';
  echo '<b>Mozilla FireFox</b>, <b>Google Chrome</b>, <b>Safari</b>, <b>Opera</b>.';
  echo '<br/>To view the page in <b>Internet Explorer</b>, you can install the ';
  echo '<a href="http://www.google.com/chromeframe/eula.html">Google Chrome Frame</a> plugin.';
  echo '</div><p/>';
}
?>
  <div>
  <div id="SBA_PLUGINS" class="plugins" style="height: <?php echo $h_svg2d ?>px; width: <?php echo $w_plugins ?>px">
  </div>
  <div id="view2d_content" style="position: absolute; left: <?php echo $w_plugins+10 ?>px; top: 0px; width: <?php echo $w_svg2d.'px; overflow-x: visible; overflow-y: hidden' ?>">
<?php
$hasOverlays = isset($config['overlays']);
if ($hasOverlays) {
  echo '<div id="view2d_overlay" style="position: absolute; left: 0px; top: 0px; background: #000; display: none">';
  echo '<img style="position: relative" id="view2d_overlay_img"/>';
  echo '</div>';
}
?>
    <div id="view2d_svg" style="position: relative; left: 0px; top: 0px">
    Loading SVG...
    </div>
  </div>
<?php
if (isset($config['overlays'])) {
  echo '<div style="position: absolute; left: 420px; top: 0px;">';
  echo '&#160;<input id="TOGGLE_DELINEATION" type="button" class="overlay-on" value="borders" onclick="sbaViewer.selectOverlay()"/>';
  foreach($config['overlays'] as $k=>$v) {
    echo '<input id="TOGGLE_'.$k.'" type="button" class="overlay-off" value="'.$k.'" onclick="sbaViewer.selectOverlay(\''.$k.'\')"/>';
  }
  echo '</div>';
}
?>
    <!-- third column -->
    <!--div id="view2d_controls" class="regions" style="position: absolute; left: <?php echo $w_svg2d+420 ?>px; top: 0px"-->
      <div id="SBA_REGIONS"  class="plugins" style="position: absolute; left: <?php echo $w_svg2d+420 ?>px; top: 0px; height: <?php echo $h_svg2d ?>px; width: <?php echo $w_regions-6; ?>px; background:#FEC">
      </div>
      <!--div style="height: 28px; width: <?php echo $w_regions; ?>px" class="regions-head">
        Regions in this slice
      </div>
      <div id="view2d_list" style="height: <?php echo $h_svg2d-36 ?>px; width: <?php echo $w_regions-6; ?>px" class="regions-content">
      </div-->
    <!--/div-->
  </div>
</div>
<?php
echo '<iframe style="display: none" name="KEEPHISTORY" id="KEEPHISTORY" src="../php/keephistory.php"></iframe>';
echo '<iframe style="display: none" name="TEMPLATE" id="TEMPLATE" src="../php/template_container.php?template='.$template.'&amp;svgcapable='.$svgCapable.'"></iframe>';
?>
<?php
$about = @file_get_contents('../'.$template.'/creditsLinks.snip');
if (!$about) $about = '';
$about .= file_get_contents('../main/creditsLinks.snip');
echo '<p/><h2>About</h2><a name="about"/><ul class="sba">'.$about.'</ul>';

// my ultra basic visitor counter
require_once('../lib/mycounter.php');
$counter = new myCounter_class('update');
?>
</div></body>
</html>