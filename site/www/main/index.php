<?php
ini_set('display_errors',1);
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas",
  "title": "Scalable Brain Atlas - Neuroanatomy at your fingertips",
  "description": "Home page with an overview of the supported atlas templates and services"
}
SITEMAP
,TRUE);
header("Content-Type: text/html; charset=utf-8");
echo '<?xml version="1.0" encoding="utf-8"?>';
require_once('../../shared-php/fancysite.php');
$siteMap = new siteMap_class($info);
?>
<html><head>
<?php
echo $siteMap->windowTitle();
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->clientScript();
?>
<link rel="stylesheet" type="text/css" href="../css/myPage.css"/>
<style>
h1 {
  font-family: arial rounded MT bold, trebuchet MS, arial, helvetica, sans-serif;
  font-size: 40pt;
  font-weight: normal;
  vertical-alignment: top;
  margin-top: 10px;
  margin: 10px 0px;
}
img.logo {
  vertical-align: text-top;
  padding: 0px 6px;
  border: 0px;
}
td.species-header {
  border-top: 8px solid #FFF
}
</style>
<script type="text/javascript">
var _gaq = _gaq || [];
_gaq.push(['_setAccount','UA-18298640-1']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://www.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
</script>
</head><body>
<?php
echo $siteMap->navigationBar();
?>
<h1>Scalable Brain Atlas<a href="#sponsors"><img class="logo" alt="INCF logo" src="../img/incflogo41.png"/><img class="logo" alt="Donders Institute" src="../img/donderslogo41.png"/></a></h1>
The Scalable Brain Atlas (SBA) is a fully web-based display engine for brain atlases, imaging data and ontologies.
<br/>It allows client websites to show brain region related data in a 3D interactive context and provides<br/>
<a href="../services">services</a> to look up regions, generate thumbnails or download nomenclature- and delineation data.
<br/>
<table>
<tr>
  <td colspan="2" class="species-header"><h2 style="margin: 0px">Macaque atlases</h2></td>
</tr><tr>
  <td rowspan="5" style="width: 180px"><img src="../img/macaquebrain.png" alt="Macaque brain"/></td>
  <td>The <b><a href="../macaque/CBCetal15">Calabrese et al. (2015) MRI+DTI atlas</a></b> with Paxinos regions.</li></td>
</tr><tr>
  <td>The <b><a href="../macaque/PHT00">Paxinos Rhesus Monkey atlas (2000)</a></b>.</li></td>
</tr><tr>
  <td>The <b><a href="../macaque/DB08">NeuroMaps Macaque atlas (2008)</a></b>.</li></td>
</tr><tr>
  <td>The <b><a href="../macaque/MERetal14">Markov et al. (2014)</a></b> 91 cortical regions atlas.</li></td>
</tr><tr>
  <td>
  Various templates available through <a href="http://brainvis.wustl.edu/wiki/index.php/Caret:About">Caret</a>, registered to F99 space:
  <ul>
    <li><b><a href="../macaque/FVE91_on_F99"-->Felleman and Van Essen (1991)</a></b></li>
    <li><b><a href="../macaque/LVE00_on_F99">Lewis and Van Essen (2000)</a></b></li>
    <li><b><a href="../macaque/RM_on_F99">Regional Map from Kötter and Wanke (2005)</a></b></li>
    <li><b><a href="../macaque/PHT00_on_F99">Paxinos Rhesus Monkey (2000)</a></b></li>
    <li><b><a href="../macaque/MMFetal11_on_F99">Markov, Misery et al. (2011)</li>
    <li><b><a href="../macaque/MERetal14_on_F99">Markov, Ercsey-Ravas et al. (2014)</li></ul></td>
</tr><tr>
  <td colspan="2" class="species-header"><h2 style="margin: 0px">Mouse atlases</h2></td>
</tr><tr>
  <td rowspan="2"><img src="../img/mousebrain.png" alt="Mouse brain"/></td>
  <td>The INCF <b><a href="../mouse/WHS12">Waxholm Space for the mouse (2012)</a></b>.<br/>
  [archived: <b><a href="../mouse/WHS11">2011 version</a>, <a href="../mouse/WHS10">2010 version</a>, <a href="../mouse/WHS09">2009 version</a></b>]
  </td>
</tr><tr>
  <td>The <b><a href="../mouse/ABA12">Allen Mouse Brain volumetric atlas (ABA12)</a></b>.</br>
  [archived: <b><a href="../mouse/ABA07">2007 version</a></b>]
  </td>
</tr><tr>
  <td colspan="2" class="species-header"><h2 style="margin: 0px">Rat atlases</h2></td>
</tr><tr>
  <td rowspan="5"><img src="../img/ratbrain.png" alt="Rat brain"/></td>
  <td>The <b><a href="../rat/PLCJB14">Waxholm Space Sprague Dawley rat</a></b> atlas of Papp et al. (2014).</td>
</tr><tr>  
  <td>The <b><a href="../rat/CBWJ13_age_P80">MR-histology atlas (age P80)</a></b> of Calabrese et al. (2013) at age P80.</td>
</tr><tr>  
  <td>The <b><a href="../rat/VSNetal11">in vivo MRI template</a></b> of Valdés-Hernández et al. (2011).</td>
</tr><tr>  
  <td>The <b><a href="../rat/RMJetal13_age_P72">DTI Atlas (age P72)</a></b> of Rumple et al. (2013).</td>
</tr><tr>  
  <td>The <b><a href="../rat/VLAetal11">Population-averaged DTI atlas</a></b> of Veraart et al. (2011).</td>
</tr><tr>
  <td colspan="2" class="species-header"><h2 style="margin: 0px">Human atlases</h2></td>
</tr><tr>
  <td rowspan="6"><center><img src="../img/humanbrain.png" alt="Human brain"/></center></td>
  <td>The <b><a href="../human/HOA06">Harvard Oxford cortical parcellation</a></b>, as distributed with FSL.</td>
</tr><tr>  
  <td>The <b><a href="../human/EAZ05_v20">JuBrain cytoarchitectonic atlas by Amunts, Zilles et al.</a></b> with maximum probability maps from Eickhoff et al. (2005).</td>
</tr><tr>
  <td>The <b><a href="../human/NMM1103">Neuromorphometrics Inc. manually segmented brain</a></b>, with cortical and subcortical parcellation.</td>
</tr><tr>
  <td>The <b><a href="../human/LPBA40_on_SRI24">LPBA40 parcellation</a></b>, registered to SRI24 space.</td>
</tr><tr>  
  <td>The <b><a href="../human/BIGB13">BigBrain Nissl stained slices</a></b> resampled at 400 µm.</td>
</tr><tr>  
  <td>The <b><a href="../human/B05_on_Conte69">Brodmann areas</a></b>, projected on Conte69 space.
  </td>
</tr><tr>  
  <td colspan="2" class="species-header"><h2 style="margin: 0px">Marmoset atlas</h2></td>
</tr><tr>
  <td rowspan="1"><center><img src="../img/marmosetbrain.png" alt="Marmoset brain"/></center></td>
  <td>The <b><a href="../marmoset/PWPRT12">Marmoset</a></b> atlas in Stereotactic Coordinates</td>
</tr><tr>
  <td colspan="1" class="species-header"><h2 style="margin: 0px">Opossum atlas</h2></td>
</tr><tr>
  <td rowspan="2"><img src="../img/opossumbrain.png" alt="Opossum brain"/></td>
  <td>The <b><a href="../opossum/OPSM14">Multimodal atlas of gray short-tailed opossum brain</a></b> by Chlodzinska, Majka et. al.
  </td>
</tr>
</table>
<p/>
A variety of services are being developed around the templates contained in the Scalable Brain Atlas. For example,
you can include thumbnails of brain regions in your own webpage, following <a href="../services/thumbnail.php">these instructions</a>. See the <a href="../main/sitemap.php">site map</a> for more applications.
<p/>
The SBA runs in recent versions of these web browsers (ordered by SVG rendering speed): Google Chrome 8+, Safari, Opera 10+, FireFox 3.6+, Internet Explorer 9+ (beta-release has bugs in SVG rendering). Users of Internet Explorer 8- need <a href="http://www.google.com/chromeframe/eula.html">this plugin</a>.
<a name="sponsors">
<p/>
</a><b>Development &amp; Support</b>
<p/>
<div style="float: left; width: 50px; margin-right: 10px"><img alt="INCF logo" src="../img/incflogo29.png"/> <img class="logo" alt="Donders Institute" src="../img/donderslogo29.png"/></div>The viewer is developed by Rembrandt Bakker under supervision of Rolf Kötter at the <a href="http://www.ru.nl/mbphysics">Donders Institute</a>, Radboud UMC Nijmegen, The Netherlands.
It uses exploratory work of Gleb Bezgin, creator of the <a href="http://www.nitrc.org/projects/cp3d">CoCoMac-Paxinos3D</a> tool.
Hosting and financial support are provided by the <a href="http://www.incf.org">INCF</a>.<br/>
To suggest a feature or report a bug, <a href="mailto:feedback@scalablebrainatlas.org">mail us</a>.
<p/>
The SBA was first presented as a poster and demo session at the INCF booth of SFN 2009 in Chicago.
<p/>
<p/>
<a href="../sfn2009/scalablebrainatlas_sfn2009.html"><img alt="Scalable Brain Atlas SFN 2009 poster" src="../sfn2009/scalablebrainatlas_sfn2009_mini.png"></a>
<p/>
<a href="http://www.nitrc.org/projects/sba/"><img alt="NITRC Listed" src="../img/nitrc_listed.gif" style="border: 0px"/></a>
<a href="http://www.neuinfo.org/">
<img src="https://neuinfo.org/images/registered_with_nif_button.jpg" alt="Registered with NIF" style="border:0px; margin-left: 10px" />
</a>
<p/>
<b>What's new</b>
<ul>
<li>2016-03: Matlab export option in 3d viewer, <a href="https://sba.incf.org/services/view3d_l2v.php?template=PLCJB14&space=PLCJB14&mesh=wholebrain&deform=fiducial&l2v=&clim=[null%2Cnull]&bg=[0%2C0%2C0]&width=800&height=800&cam=L&overlay=labels&format=mfile">example</a>.</li>
<li>2016-03: Scalable layout, snaps to width of browser window, to support embedding in the HBP <a href="https://collab.humanbrainproject.eu/#/collab/47/nav/236">neuroinformatics platform</a>.</li>
<li>2016-03: Hosting on secure server, to enable HBP platform integration.</li>
<li>2015-12: Improved 3d viewer with color painting, available for FVE_on_F99, PLCJB14 and future/updated templates. Example: <a href="https://scalablebrainatlas.incf.org/services/view3d_l2v.php?template=PLCJB14&overlay=labels">PLCJB14</a>.</li>
<li>2015-11: Updated definitions for landmark AC in the WHS12 and PLCB14 templates (thanks to Eszter Papp).</li>
<li>2015-10: New 3d rendering capability, available for MERetal14, CBCetal15, BIGB13, and all future/updated templates. Example: <a href="https://scalablebrainatlas.incf.org/services/x3d_viewer.php?x3d=../BIGB13/wholebrain.x3d&stl=../BIGB13/wholebrain.stl">Bigbrain</a>.</li>
<li>2015-10: <a href="https://scalablebrainatlas.incf.org/macaque/MERetal14">New macaque template</a>, used as the basis of the connectivity data in <a href="http://dx.doi.org/10.1093/cercor/bhs270">Markov et al. (2014)</a></li>
<li>2015-10: <a href="https://scalablebrainatlas.incf.org/macaque/CBCetal15">New macaque template</a> based on the work of Evan Calabrese, Alexandra Badea, Christopher L. Coe, Gabriele R. Lubach, Yundi Shi, Martin A. Styner, and G. Allan Johnson.</li>
<li>2015-07: Bug fixes in JuBrain and BigBrain atlases.</li>
<li>2015-05: Changed slice sampling for ABA12, now starting at slice 2, step 4, ending at 526. Also updated mfiles.</li>
<li>2015-03: Check out some <a href="https://scalablebrainatlas.incf.org/docs/bigbrainworkshop_2015apr01.html">interesting SBA pages</a>, presented at the BigBrain workshop on April 01, 2015.</li>
<li>2015-01: Nieuw html5-canvas based 'virtual microscopy' plugin allows inverting, recoloring and rescaling of all imaging modalities. To see its deep-zoom capabilities, select the <a href="https://scalablebrainatlas.incf.org/ABA12?plugin=imaging">Nissl+ data in the ABA12 template</a>.</li>
<li>2014-12: Experimental "SuperZoom" plugin for Virtual Microscopy, applied to <a href="https://scalablebrainatlas.incf.org/mouse/ABA12?plugin=superzoom">Allen Brain Mouse</a> atlas.</li>
<li>2014-12: Renamed MERetal12_on_F99 to MERetal14_on_F99,</li>
<li>2014-11: Bigbrain template 1st release @ 400 µm. Zoomify plugin under development.</li>
<li>2014-11: Much improved version 2.0 of human Eickhoff et al. template.</li>
<li>2014-11: More rat templates: VSNetal11, VLAetal12, RMJetal13_age_P72.</li>
<li>2014-11: New rat template: Waxholm rat (Papp et al.).</li>
<li>2014-02: Smoother convex hulls (using autotrace), see for example the FVE91_on_F99 template.</li>
<li>2013-12: Experimental feature in WHS12 template only: try and press the <a href="/mouse/WHS12">Saggital slice button (right of 3d panel)</a></li>
<li>2013-12: For templates that cover both hemispheres, you can now select to view left, right or both.</li>
<li>2013-11: Marmoset template now has Nissl overlays, obtained with permission from Marmoset-brain.org.</li>
<li>2013-10: New cross-template plugin: 'SBA Lookup', to find out which other atlases have a region with the same name as the active region.</li>
<li>2013-10: New template: <a href="https://scalablebrainatlas.incf.org/marmoset/PPWRT12">Marmoset</a></li>
<li>2013-07: Better error handling for CoCoMac plugin</li>
<li>2013-04: Uploaded the Scalable Brain Atlas viewer code to the public repository <a href="https://github.com/INCF/Scalable-Brain-Atlas">https://github.com/INCF/Scalable-Brain-Atlas</a>.</li>
<li>2013-01: Renamed MM11_on_F99 to MMFetal11_on_F99 to be consistent with MERetal12_on_F99.</li>
<li>2013-01: Added <a href="https://scalablebrainatlas.incf.org/macaque/MERetal14_on_F99">MERetal12_on_F99</a> template (Caret based, Macaque).</li>
<li>2013-01: Fixed in Landmarks plugin: Crosshair markers animated dashoffset didn't work properly in Firefox. Now animating stroke-width.</li>
<li>2013-01: Fixed AddMarker plugin: markers pointed approx 15 pixels too low in 3D view in all browsers.</li>
<li>2013-01: Fixed in AddMarker plugin: balloon-style markers pointed a few pixels below coordinate in 2D view in Firefox.</li>
<li>2012-05: New version of <a href="https://scalablebrainatlas.incf.org/mouse/ABA12">Allen Mouse Brain Atlas</a>.</li>
<li>2012-05: New human template: <a href="https://scalablebrainatlas.incf.org/human/B05_on_Conte69">Brodmann areas</a> in Conte69 space.</li>
<li>2012-04: New macaque template:  <a href="https://scalablebrainatlas.incf.org/macaque/MM11_on_F99">Markov and Misery delineation</a> in F99 space.</li>
<li>2012-04: New human template: Eickhoff et al., cytoarchitectonic parcellation in MNI space.</li>
<li>2012-03: CoCoMac plugin improved: tabular view links back to CoCoMac axonal projections search query</li>
<li>2012-01: <a href="https://scalablebrainatlas.incf.org/WHS10?plugin=Landmarks">Landmarks</a> updated for WHS10/WHS11 template</li>
<li>2011-09: An updated version of the Waxholm mouse atlas has been imported: <a href="https://scalablebrainatlas.incf.org/WHS11">WHS11</a>, it has a hierarchical region tree and supports the NeuroLex plugin</li>
<li>2011-09: <a href="https://scalablebrainatlas.incf.org/WHS10?plugin=Landmarks">Landmarks</a> updated for WHS10 template</li>
<li>2011-09: Distance matrix service <a href="https://scalablebrainatlas.incf.org/services/distancematrix.php">added</a></li>
<li>2011-08: Fixed 60 acronym mismatches (mostly capitalization) between CoCoMac and SBA to prevent empty results in cocomac plugin</li>
<li>2011-08: Created <a href="https://scalablebrainatlas.incf.org/WHS10?plugin=Landmarks">landmark plugin for WHS10</a> with Andreas Hess and Marina Sergejeva.</li>
<li>2011-08: Fixed 60 acronym mismatches (mostly capitalization) between CoCoMac and SBA to prevent empty results in cocomac plugin.</li>
<li>2011-08: Status of <a href="https://scalablebrainatlas.incf.org/mouse/ABA07">Allen Brain Mouse atlas</a> upgraded from "As Is" to "supported". Including Nissl!
<li>2011-08: 3D view now fits better in its frame.
<li>2011-08: WHS09 and WHS10 templates show additional overlay 'rgb'. It can be used to check the accuracy of the polygon extraction procedure (bitmap to curves). Other templates will follow.
<li>2011-07: PHT00 and DB08 atlas pages show small 3d renderings (powered by 3dbar!) of whole brain in top-right corner.
<li>2011-07: Export region hierarchy tree in NeuroVIISAS format, plus XSL app to view XML as table.
<li>2011-05: Add Marker enhanced: you can get a marker coordinate by clicking anywhere in the 2d slice.
<li>2011-03: Bug-fix to make SBA work in FireFox 4.
<li>2011-03: New exciting plugin: 3D Brain Atlas Reconstructor. Will later be available for all templates, now only for <a href="../coronal3d.php?template=WHS10&plugin=bar3d">WHS10</a>.
<li>2011-02: Automatically generated sitemap and navigation bar on top of every page
<li>2011-02: Most services now show user friendly dialog when called without proper arguments
<li>2011-02: First self-explanatory service: <a href="https://scalablebrainatlas.incf.org/services/rgbslice.php">rgbslice.php</a>
<li>2011-01: Experimental CoCoMac plugin available for <a href="https://scalablebrainatlas.incf.org/coronal3d.php?template=PHT00&plugin=CoCoMac">preview</a>
<li>2011-01: Added support for Internet Explorer 9 beta, and solved several issues with Opera and Chrome</a>
<li>2011-01: The Scalable Brain Atlas is <a href="http://www.nitrc.org/projects/sba/">NITRC listed</a>
<li>2011-01: You can open a plugin directly from the URL by adding &plugin=PluginName
<li>2011-01: The spacing between slices in the 3D view can now be selected: by default the brain is stretched in the posterior/anterior dimension to get a better view. The new control includes a fiducial mode, to see what the brain looks like without deformations.
<li>2011-01: The new Error Console replaces disturbing javascript alerts.
<li>2010-12: Added INCF-DAI coordinate transformations to the WHS09 template (AddMarker plugin)
<li>2010-12: Created CIVM Image Viewer plugin for WHS09 template, it shows the WHS images in original resolution.
Could not find a way to directly link to individual coronal slices.
<li>2010-11: Added human LPBA40 parcellation in SRI24 space.
<li>2010-11: First version of CoCoMac plugin: only avaible on development server.
<li>2010-11: Properties plugin shows volume and centerpoint for selected region.
<li>2010-11: Existing services reimplemented as plugins: NeuroLex (for template PHT00), Brain Region Hierarchy.
<li>2010-11: The new FreeBase plugin automatically looks up brain site names in Wikipedia.
<li>2010-11: Created ipad-style Plugin window to provide intuitive access to features and services.
<li>2010-10: Volume and centerpoints are computed for each template.
<li>2010-10: Stereotaxic coordinates are shown for most templates, and also work with MRI overlays.
<li>2010-10: Finished templates obtained through Caret by adding full names and MRI overlays, and switching hemisphere from R to L.
<li>2010-10: First attempt to include three templates that are available through David van Essen's Caret software. Needed a lot of work to get the png-to-svg conversion right.
<li>2010-10: Improved handling of regions that are part of the original atlas, but not of the imported atlas template
<li>2010-10: Automatically generated guide to <a href="../howto">SBA services</a>
<li>2010-09: View the region hierarchy of each template separately: e.g. <a href="../hierarchy.php?template=PHT00">hierarchy.php?template=PHT00</a>
<li>2010-09: Improved sorting of region lookup: suggestions starting with the typed characters appear first
<li>2010-09: First attempt to include the <a href="../coronal3d.php?template=TT88">Human - Talairach template</a>
<li>2010-09: In progress: Follow up on Doug Bowdens comments to clean up the region list and hierarchy. Done: Show only viewable regions
<li>2010-09: Made a crippled, thumbnail-based version of the SBA for SVG-incapable browsers (including the Google robot)
<li>2010-09: Installed Google Analytics tracker
<li>2010-08: DB08 and WHS09 template now show MRI overlays
<li>2010-08: DB08 template now shows WikiPedia definitions, obtained from freebase.com
<li>2010-08: Loading of templates nearly 3 times faster using gzip compression
<li>2010-08: Fixed bug (work-around) in Corel Trace, leading to spurious horizontal lines in SVG output
<li>2010-08: Dubach and Bowden 2008 Macaque template added, including NeuroNames hierarchy
<li>2010-07: Automated pipeline for template import from png sources
<li>2010-07: Get templates/regions as tab-separated data using <a href="../listregions.php">listregions.php</a>
<li>2010-06: Single php/html source for all templates, new features are automatically shared
<li>2010-06: Comparison of potrace vs. Corel trace to convert raster images to SVG: Corel makes better partitions, but potrace is much easier to automate
<li>2010-05: Matlab interface to view 3d renderings of regions
<li>2010-05: Lookup region name by stereotaxic coordinate implemented for PHT00
<li>2010-04: Stereotaxic coordinates of mouse-cursor displayed in 2d view
<li>2010-03: New atlas template: PHT00_on_F99
<li>2010-03: Thumbnail service extended with 3d view and indexed-color png files
<li>2010-03: Opera is now a supported browser
<li>2010-03: Doubled speed of auto-complete function</ul>
<?php
echo '<i>Last update: '.date("l, j F Y",filemtime($_SERVER['SCRIPT_FILENAME'])).'</i>';
?>
</body></html>
