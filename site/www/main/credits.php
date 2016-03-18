<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|credits",
  "title": "Credits",
  "description": "Lists grant numbers and people who contributed to the Scalable Brain Atlas"
}
SITEMAP
,TRUE);
require_once('../../shared-php/fancysite.php');
$siteMap = new siteMap_class($info);
echo '<html><head>';
echo '<meta http-equiv="content-type" content="text/html; charset=UTF-8">';
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->windowTitle();
echo $siteMap->clientScript();
echo '</head><body>';
echo $siteMap->navigationBar();
echo $siteMap->pageTitle();
?>
<p>
The Scalable Brain Atlas is developed by Rembrandt Bakker, initially under supervision of the late Prof. Rolf Kötter
at the Donders Institute, Radboud University and Medical Center Nijmegen. It started out as a web-based alternative to the "CoCoMac-Paxinos-3D Viewer" by Gleb Bezgin, Andrew T. Reid, and Rolf Kötter (2009).
</p>
<a name="acknowledgements"></a>
<h3>Acknowledgements</h3>
The following people contributed to the services, plugins and templates (<a href="../services/listtemplates.php">abbreviations</a>) that constitute the SBA:
<ul><li>Daniel Wojcik and Piotr Majka (3dBAR plugin, whole brain 3d renderings, Marmoset template)
</li><li>Andreas Hess and Marina Sergejeva (Landmarks plugin)
</li><li>Hironobu Tokuno, Marcello Rosa and Tristan Chaplin (Marmoset template)
</li><li>Thomas Wachtler, Markus Diesmann (CoCoMac plugin)
</li><li>Jyl Boline, Janis Breeze (INCF taskforce integration)
</li><li>Doug Bowden (DB08 template, NeuroNames expertise)
</li><li>Gleb Bezgin (PHT00 and RM_on_F99 template and inspiration)
</li><li>Simon Eickhoff (EAZ05 template)
</li><li>Allan Johnson, Seth Ruffins (WHS template)
</li><li>Stephen Larson, Maryann Martone (bidirectional NeuroLex plugin)
</li><li>David van Essen (templates derived from Caret/SumsDB)
</li><li>Jan Sijbers and Jelle Veraart (VLAetal11 template)
</li><li>Henry Kennedy (citation policy)
</li><li>Eszter Papp (PLCJB14 template)
</li><li>Evan Calabrese (CBCetal DTI-Paxinos template)
</li><li>Andrew J. Worth (Neuromorphometrics Inc. human template)
</li></ul>

<a name="grants"></a>
<h3>Financial support</h3>
The Scalable Brain Atlas is developed with joint financial support from various sources.
<ul>
  <li>Core functions and default plugins
    <ul>
      <li>International Neuroinformatics Coordinating Facility (INCF). The work was conducted in the context of two INCF Programs: Ontologies of Neural Structures (PONS) and Digital Brain Atlasing (DAI).</li>
      <li>Donders Institute for Brain, Cognition and Behaviour of the Radboud University and UMC Nijmegen.</li>
    </ul>
  </li><li>The CoCoMac plugin: 
    <ul>
      <li>German INCF Node (BMBF grant 01GQ0801).</li>
      <li>Helmholtz Association HASB and portfolio theme SMHB. JUGENE Grant JINB33, and EU Grant 269921 (BrainScaleS).</li>
    </ul>
  <li>Inclusion of the Waxholm Space rat template
    <ul>
      <li>European Union Seventh Framework Programme (FP7/2007-2013) under grant agreement n° 604102 (HBP).</li>
    </ul>
  <li>Image registration services
    <ul>
      <li>Netherlands eSciene Center, grant 027.011.304.</li>
    </ul>
  </li>
</ul>

<h3>References</h3>
<ol><li>Bezgin G1, Reid AT, Schubert D, Kötter R. (2009) "Matching spatial with ontological brain regions using Java tools for visualization, database access, and integrated data analysis." Neuroinformatics 7(1):7-22. doi: 10.1007/s12021-008-9039-5.</li></ol>
</body></html>

