<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|citation policy",
  "title": "Citation policy",
  "description": "The citation policy is designed to protect those who contribute data to the Scalable Brain Atlas."
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
If you use data from the Scalable Brain Atlas in your research, you must abide by our citation policy. This policy is designed to protect researchers who contribute data to the platform. 
</p>
<ol>
<li>For each atlas template that contributes to or is mentioned in your publication: cite the 'defining citation(s)', as listed in the About section of each atlas.</li>

<li>If you mention the Scalable Brain Atlas in your publication, then in addition to the above you need to cite the Scalable Brain Atlas. The current Scalable Brain Atlas citation is:
<div style="padding: 0.5ex; padding-left: 2ex">
<a name="sba"></a>
Rembrandt Bakker, Paul Tiesinga, Rolf K&ouml;tter (2015)
<br/>"The Scalable Brain Atlas: instant web-based access to public brain atlases and related content."
<br/>Neuroinformatics. <a href="http://dx.doi.org/10.1007/s12021-014-9258-x">http://link.springer.com/content/pdf/10.1007/s12021-014-9258-x</a> (author copy: <a href="http://arxiv.org/abs/1312.6310">arXiv:1312.6310</a>)
</div>
</li><li>If you mention the use of a plugin, you need to cite its main citation.
<a name="plugins"></a>
<ul><li>3dBAR plugin
<div style="padding: 0.5ex; padding-left: 2ex">
Majka P, Kublik E, Furga G, Wójcik DK (2012) "Common atlas format and 3D brain atlas reconstructor: infrastructure for constructing 3D brain atlases." Neuroinformatics 10(2):181-97.<br/><a href="http://dx.doi.org/10.1007/s12021-011-9138-6">10.1007/s12021-011-9138-6</a>
</div>
<li>BrainInfo plugin
<div style="padding: 0.5ex; padding-left: 2ex">
Bowden DM, Song E, Kosheleva J, Dubach MF. (2012) "NeuroNames: an ontology for the BrainInfo portal to neuroscience on the web." Neuroinformatics. 10(1):97-114.
<br/><a href="http://dx.doi.org/10.1007/s12021-011-9128-8">10.1007/s12021-011-9128-8</a>
</div>
<li>NeuroLex plugin
<div style="padding: 0.5ex; padding-left: 2ex">
Larson SD, Martone ME (2013) "NeuroLex.org: an online framework for neuroscience knowledge." Front Neuroinform. 7:18.
<br/><a href="http://dx.doi.org/10.3389/fninf.2013.00018">10.3389/fninf.2013.00018</a>
</div>
<li>CoCoMac plugin
<div style="padding: 0.5ex; padding-left: 2ex">
Bakker R, Wachtler T, Diesmann M (2012) "CoCoMac 2.0 and the future of tract-tracing databases." Front Neuroinform. 2012 6:30.
<br/><a href="http://dx.doi.org/10.3389/fninf.2012.00030">10.3389/fninf.2012.00030</a>
</div>
</li></ul>
</ol>
With this citation policy we want to encourage data owners to contribute data and get proper credit. If a publication does not abide by this policy we retain the right to write to the journal editor and request an erratum.
</body></html>  

