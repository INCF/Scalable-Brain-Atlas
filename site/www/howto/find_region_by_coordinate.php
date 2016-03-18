<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|region by coordinate",
  "title": "Find region by coordinate",
  "description": "This service outputs the name of a brain region, given a stereotaxic coordinate as input."
}
SITEMAP
,TRUE);

require_once('../../shared-php/fancysite.php');

$siteMap = new siteMap_class($info);
echo '<html><head>';
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->windowTitle();
echo $siteMap->clientScript();
echo '</head><body>';
echo $siteMap->navigationBar();
echo $siteMap->pageTitle();
?>
This service is called using this url:
<br>
<a href="https://scalablebrainatlas.incf.org/coord2region.php?template=PHT00&coord=2,34,-20&output=html">http://scalablebrainatlas.incf.org/coord2region.php?template=PHT00&coord=2,34,-20&output=html</a>
<br>where
<ul>
<li>'template=' specifies the name of the brain atlas. Currently only PHT00 (rhesus monkey) has correct stereotaxic coordinates.
<li>'coord=' specifies the stereotaxic coordinate triplet (x,y,z), where x is the distance from midline (right is positive), y is the dorsoventral distance from the interaural line, and z is the anterior-posterior distance from bregma.
<li>'output=' specifies the output format. Currently 'html' (html table) and 'json' (json string) are supported.
</ul>
</body></html>
