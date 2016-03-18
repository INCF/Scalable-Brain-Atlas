<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|Matlab analysis",
  "title": "Analyze atlas templates in Matlab",
  "description": "This service lets you download slices and matlab-scripts to your computer, to create advanced 3D visualizations using your local installation of <a href=\"http://www.mathworks.com/products/matlab/\">Matlab</a>."
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
You can view and analyse the brain templates supported by the Scalable Brain Atlas using Matlab.
<a href="http://www.mathworks.com">Matlab</a> is a commercial software package which provides an easy to learn, high level programming language, with extensive capabilities for matrix manipulations, image analysis and fancy graphics.
<p>
To get started, you need:
<ul>
<li>Matlab installed on your local system.
<li>The set of m-files written for the Scalable Brain Atlas, which you can download <a href="../mfiles/download_mfiles.php">here</a>.
<li>Save the m-files to a folder on your local system, and either go to this folder in Matlab (using 'cd') or add it to the Matlab path (using 'addpath').
<li>Explore the m-files in the folder, and modify them to implement your own type of image analysis.
</ul>
Example:
<tt>
[A,slices,scaling] = getRegionMask('PHT00','V2');
hP = viewRegionMask(A,slices,scaling);
</tt>
This produces a 3D-rendering of area V2. The coloring is done to create more depth in the image; it has no physical interpretation.
<p>
<img src="viewRegionMask_V2.png">
</body></html>
