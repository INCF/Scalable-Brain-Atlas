<?php
// DOCUMENT.createElement still slow in 2d view. WHY???
// move regionTree to region list window (2nd plugin window)
//CONTINUE HERE: 2D VIEW VERY SLOW, BECAUSE IT IS RELATIVE?
// [ok] Version 0.1 with basic features:
//      . 2D view
//      . 3D view
//      . jump to brainsite with fast autosuggest
//      . highlight region
//      . highlight slice using convex hull
// [ok] Text select on activating fastselect field
// [ok] Replace boundingBox by convex hull's (might speed up rendering slightly)
// [ok] Onmouseover feature in 2D view
// [ok] Enable history using a hidden iframe; use only when changing selected region
// [ok] Define standard sets of regions which belong together
// [..] Allow selection of multiple regions (ctrl+click), with a red to yellow color scheme
//

function fileContents($fname,$alt='null') {
  $ans = @file_get_contents($fname);
  return $ans ? $ans : $alt;
}

foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

// deal with non-SVG compatible browsers
$acceptXHTML = stristr($_SERVER["HTTP_ACCEPT"],'application/xhtml+xml');
$chromeFrame = stristr($_SERVER["HTTP_USER_AGENT"],'chromeframe');
$svgCapable = ($acceptXHTML || $chromeFrame) && !isset($_GET['nosvg']);
$contentType = ($svgCapable ? 'application/xhtml+xml' : 'text/html');
header('Content-Type: '.$contentType.'; charset=utf-8');
if ($chromeFrame) header('X-UA-Compatible: chrome=1');
echo '<?xml version="1.0" encoding="utf-8"?>';
//echo '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

$template = $_GET['template'];
$templatePath = '../'.$template.'/template/';
if (!is_dir($templatePath)) {
  echo '<html xmlns="http://www.w3.org/1999/xhtml"><body>Error: you did not specify a valid atlas template.<br/>Example: <a href="coronal3d.php?template=PHT00">coronal3d.php?template=PHT00</a>.</body></html>';
  return;
}
// default configuration
$config = json_decode(file_get_contents('../main/config.json'),true);
$config['template'] = $template;
$config['debug'] = isset($_GET['debug']);

// overload with template-specific configuration
$tmp = json_decode(file_get_contents($templatePath.'config.json'),true);
foreach ($tmp as $k=>$v) $config[$k] = $v;

// merge default and specific plugins
$plugins = $config['defaultPlugins'];
if (isset($plugins)) unset($config['defaultPlugins']);
else $plugins = array();
if (isset($config['plugins'])) $plugins = array_unique(array_merge($plugins,$config['plugins']));
$config['plugins'] = $plugins;

$featuredPlugin = $_GET['plugin'];
if (isset($featuredPlugin)) $config['featuredPlugin'] = $featuredPlugin;
?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>Scalable Brain Atlas - <?php echo @$config['templateName']; ?></title>
<?php if ($svgCapable) {?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style id="svg_style" type="text/css">
    <![CDATA[
    path { opacity: 1; fill: #606055; stroke: #FFF; stroke-width: 0.4in; }
    path.marker2d,path.marker3d { fill: #0F0; stroke: #000; stroke-width: 0.2in; }
    text.marker { opacity:1; text-anchor: middle; fill: #000; stroke: #000; stroke-width: 0; font-size: 120px; font-family: Verdana; font-weight: bold }
    .wm { fill: #909080; }
    .semifill { opacity: 0.3; }
    .nofill { fill-opacity: 0; }
    .noborders { opacity: 0; }
    .highlight { fill: #F00; stroke-width: 0.3in; }
    .acronym_highlight { fill: none; stroke: #F00; stroke-width: 0.5in; }
    .circle_highlight { fill: none; stroke: #AAF; stroke-width: 0.5in; }
    .hull { opacity: 1; fill: none; stroke: #CBC; stroke-width: 0.5in;  }
    .hull_10 { fill-opacity: 0; fill: #FFF; stroke: none }
    .hull_highlight { fill-opacity: 0.65; fill: #FEB; stroke-opacity: 1; stroke: #00F; stroke-width: 2.0in; }
    .marker { opacity: 1; fill: #FB3; stroke-width: 0.3in; }
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
li.sba {
  padding-bottom: 3px;
}
span.emph,a.emph {
  color: #510;
  font-weight: bold;
}
a.emph:link { text-decoration: none; }
a.emph:visited { text-decoration: none; }
a.emph:hover { color: red }
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
  background: #EDA; 
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
}
table.fancy td,th {
  border: 1px solid #999;
  padding-left: 2px;
  padding-right: 2px;
  text-align: left
}

/*
div.regions-content {
  padding-left: 2ex;
  text-indent: -2ex;
}
*/
</style>
<link rel="stylesheet" type="text/css" href="../css/myPage.css"/>
<link rel="stylesheet" type="text/css" href="../css/myForms.css"/>
<link rel="stylesheet" type="text/css" href="../css/myTree.css"/>
<script language="javascript" src="../js/browser.js"></script>
<script language="javascript" src="../js/json.js"></script>
<script language="javascript" src="../js/hash.js"></script>
<script language="javascript" src="../js/instanceManager.js"></script>
<script language="javascript" src="../js/fastsuggest.js"></script>
<script language="javascript" src="../js/tooltip.js"></script>
<script language="javascript" src="../js/myMenu.js"></script>
<script language="javascript" src="../js/myTree.js"></script>
<script language="javascript" src="../js/jsonRequest.js"></script>
<script language="javascript" src="../js/sba_regiontree.js"></script>
<script language="javascript" src="../js/sba_viewer.js"></script>
<script language="javascript" src="../js/sba_plugins.js"></script>
<?php
// include template-specific SBA script
$jsFile = 'sba_'.$template.'.js';
if (file_exists('../'.$template.'/'.$jsFile)) {
  echo '<script language="javascript" src="../'.$template.'/'.$jsFile.'"></script>';
}

// load plugin-related javascript
$plugins = $config['plugins'];
if (isset($plugins)) {
  foreach ($plugins as $pn) {
    echo '<script language="javascript" src="../plugins/'.strtolower($pn).'_plugin.js"></script>';
  }
}
?>
<script language="javascript">
//<![CDATA[
<?php
require_once('../lib/sba_viewer.php');
$STATE = $_GET;
$acr = $STATE['acr'];
$region = $STATE['region'];
$rgb2acr = json_decode(fileContents($templatePath.'rgb2acr.json','[]'),true);
$acr2parent = json_decode(fileContents($templatePath.'acr2parent.json','[]'),true);
$acr2rgb = array_flip($rgb2acr);
if (!isset($acr) && isset($region)) {
  $brainRegions = json_decode(fileContents($templatePath.'brainregions.json','[]'),true);
  $brainSlices = json_decode(fileContents($templatePath.'brainslices.json','[]'),true);
  $alias2acr = json_decode(fileContents($templatePath.'alias2acr.json','[]'),true);

  // get acr from region
  $acr = findAcrForGivenRegion($region,$rgb2acr,$acr2parent,$alias2acr);
  // get rgb list
  $rgbList = getRgbList($acr,$rgb2acr,$acr2parent,$acr2rgb);
  // get middle slice
  $slice = getMiddleSlice($rgbList,$brainRegions,$brainSlices);

  $STATE['acr'] = (isset($acr) ? $acr : $region);
  $STATE['slice'] = $slice;
  unset($STATE['region']);
}
// compose rgbWhite (contains white matter regions)
$RGB_WHITE = array();
$wm = $config['whiteMatterAcronyms'];
if ($wm) {
  foreach($wm as $acr) {
    $rgbList = getRgbList($acr,$rgb2acr,$acr2parent,$acr2rgb);
    foreach($rgbList as $rgb) $RGB_WHITE[$rgb] = 1;
  }
}
echo 'var RGB_WHITE='.json_encode($RGB_WHITE).";\n";

$acr2full = json_decode(fileContents($templatePath.'acr2full.json'),true);
if (!isset($acr2full)) $acr2full = $acr2rgb;
// Note: the most important template data is loaded in iframe "TEMPLATE"
echo 'var RGB_TO_ACR='.json_encode($rgb2acr).";\n";
echo 'var ACR_TO_FULL='.json_encode($acr2full).";\n";
echo 'var ACR_TO_PARENT='.json_encode($acr2parent).";\n";
echo 'var ALIAS_TO_ACR='.json_encode($alias2acr).";\n";
echo 'var HULLS='.fileContents($templatePath.'hulls.json').";\n";
/* deprecated
echo 'var PATH_CENTERS='.fileContents($templatePath.'pathcenters.json').";\n";
*/
echo 'var REGION_CENTERS='.fileContents($templatePath.'regioncenters.json').";\n";
/*
echo 'var XY_SCALING='.fileContents($templatePath.'xyscaling.json').";\n";
*/
echo 'var SLICE_POS='.fileContents($templatePath.'bregma.json').";\n";
echo 'if (SLICE_POS == undefined) SLICE_POS='.fileContents($templatePath.'slicepos.json').";\n";
echo 'var CONFIG='.json_encode($config).";\n";
echo 'var ACR_TO_NNID='.fileContents($templatePath.'acr2nnid.json').";\n";
/* deprecated
echo 'var ACR_TO_NLXID='.fileContents($templatePath.'acr2nlxid.json').";\n";
*/
echo 'var RGB_CENTERS='.fileContents($templatePath.'rgbcenters.json').";\n";
echo 'var RGB_VOLUMES='.fileContents($templatePath.'rgbvolumes.json').";\n";
?>;
var BS_SUGGESTIONS = undefined;

window.bodyOnchange = function(query) {
  if (BS_SUGGESTIONS==undefined) sbaViewer.initSuggestions();
  var newState = sbaViewer.initState(decodeURI(query));
  sbaViewer.applyStateChange(newState);
}

// called from iframe "TEMPLATE"
window.bodyOnload = function() {
  // link to global variables in iframe
  SVG_PATHS = window.TEMPLATE.SVG_PATHS;
  BRAIN_REGIONS = window.TEMPLATE.BRAIN_REGIONS;
  BRAIN_SLICES = window.TEMPLATE.BRAIN_SLICES;

  this.sbaViewer = new sbaViewer_class(CONFIG,<?php echo $svgCapable ? 1 : 0 ?>);
  this.selectRegion = function(acr) { sbaViewer.selectRegion(acr); }    

  var state = <?php echo json_encode($STATE) ?>;
  var query = hash.keyValueStrings(state,'=').join('&');
  bodyOnchange(query);
  sbaViewer.writeHistory();
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
$w_regions = 280;
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
<body style="margin: 0px; padding: 0px; background: #EEE url('../img/incfdonders_bg.png') repeat right top; color: #000">
<div style="background: #FFF; width: <?php echo $w_panel+34; ?>px; height: 1000px; padding: 16px; display: inline-block; text-align: left; border: 1px solid #999">
<a href="../index.php" target="_top">Scalable Brain Atlas</a> &gt; <?php echo $template ?>
<?php
$templateName = @$config['templateName'];
if (isset($templateName)) echo '<h2>'.$config['species'].' - '.$templateName.'</h2>';
?>
<div style="position: absolute; top: 0px; left: <?php echo ($w_panel-100); ?>px; width: 100px; text-align: right"><a id="permalink" href="javascript:void(0)" onclick="">Permalink</a>
</div>
<div id="view3d" class="view-panel" style="width: <?php echo $w_panel; ?>px;">
  <div id="view3d_svg" style="width: <?php echo $w_svg3d; ?>px; overflow: hidden">Loading SVG...</div>
  <div id="view3d_controls" style="position: absolute; left: <?php echo ($w_svg3d+12); ?>px; top: 50px; width: <?php echo $w_ctrl3d; ?>px">
  Rotate view:<br/>
  <button onclick="sbaViewer.prevAngle()"><img src="../img/rotback.gif" alt="back"/></button><input id="angle3d" type="text" size="3" onchange="sbaViewer.selectAngle(this.value)"/><button onclick="sbaViewer.nextAngle()"><img src="../img/rotforward.gif" alt="fwd"/></button>
  </div>
  <div style="height: 64px">
    <div id="view3d_title" style="width: <?php echo $w_plugins ?>px; padding-left: 2ex; text-indent: -2ex">
    </div>
    <div style="position: absolute; left: <?php echo $w_plugins+10 ?>px; top: 0px">
      Search: <input id="searchBrainRegion" type="text" size="60" onfocus="this.select()" onchange="sbaViewer.selectSuggestedRegion(this.value)"/>
    </div>
    <div style="position: absolute; left: <?php echo $w_plugins+10 ?>px; top: 30px">
      Slice: <input type="button" value="&lt;" onclick="sbaViewer.prevSlice()"/><input id="slice_no" type="text" size="7" onchange="sbaViewer.selectSlice(this.value)"/><input type="button" value="&gt;" onclick="sbaViewer.nextSlice()"/><span id="slice_pos" style="font-size: small"></span>
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
  <div id="view2d_content" style="position: absolute; left: <?php echo $w_plugins+10 ?>px; top: 0px; width: <?php echo $w_svg2d.'px; overflow-x: auto; overflow-y: hidden' ?>">
<?php
$hasOverlays = isset($config['overlays']);
if ($hasOverlays) {
  echo '<div id="view2d_overlay" style="position: absolute; left: 0px; top: 0px; ">';
  echo '<img style="position: relative" id="view2d_overlay_img" src="../img/empty8.gif"/>';
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
    <div id="view2d_controls" class="regions" style="position: absolute; left: <?php echo $w_svg2d+420 ?>px; top: 0px">
      <div style="height: 28px; width: <?php echo $w_regions; ?>px" class="regions-head">
        Regions in this slice
      </div>
      <div id="view2d_list" style="height: <?php echo $h_svg2d-36 ?>px; width: <?php echo $w_regions-6; ?>px" class="regions-content">
      </div>
    </div>
  </div>
</div>
<?php
echo '<iframe style="display: none" name="KEEPHISTORY" id="KEEPHISTORY" src="../php/keephistory.php"></iframe>';
echo '<iframe style="display: none" name="TEMPLATE" id="TEMPLATE" src="../php/template_container.php?template='.$template.'&amp;svgcapable='.$svgCapable.'"></iframe>';
?>
<?php
if ($template == 'WHS09') {
  echo '<h3>Coordinate marker</h3>';
  echo '<table><tr>';
  echo '<td>X: left (-) to right(+) ['.$config['sliceUnits'][0].']</td><td><input id="MARKER_XPOS" type="text"/></td>';
  echo '</tr><tr>';
  echo '<td>Y: posterior (-) to anterior(+) ['.$config['sliceUnits'][0].']</td><td><input id="MARKER_SLICEPOS" type="text"/></td>';
  echo '</tr><tr>';
  echo '<td>Z: inferior (-) to superior(+) ['.$config['sliceUnits'][1].']</td><td><input id="MARKER_YPOS" type="text"/></td>';
  echo '</tr><tr>';
  echo '<td>Coordinate space</td><td><select id="MARKER_XYZSPACE"><option value="native">Native</option><option value="FP08">Franklin &amp; Paxinos 2008</option></select><input type="button" value="Show marker" onclick="sbaViewer.showCoordinateMarker(getElementById(\'MARKER_SLICEPOS\').value,getElementById(\'MARKER_XPOS\').value,getElementById(\'MARKER_YPOS\').value,getElementById(\'MARKER_XYZSPACE\').value)"/></td>';
  echo '</tr></table>';
}
?>

<h3>External Resources</h3>
<div id="ExternalResources"></div>

<?php
$creditsLinks = @file_get_contents('../'.$template.'/creditsLinks.snip');
if (!$creditsLinks) $creditsLinks = @file_get_contents('../main/creditsLinks.snip');
if ($creditsLinks) {
  echo '<h3>Credits &amp; Links</h3>';
  echo $creditsLinks;
}
?>
</div>
</body>
</html>