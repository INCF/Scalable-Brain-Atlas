<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|site map",
  "title": "Site map",
  "description": "Displays all public pages as a hierarchical tree"
}
SITEMAP
,TRUE);

$startPath = $_REQUEST['path'];
if (isset($startPath)) {
  $info['title'] = str_replace('|','&#160;&#9658;&#160;',$startPath).'&#160;&#9658;';
  $info['path'] = $startPath;
}

require_once('../shared-lib/sitemap.php');
$siteMap = new siteMap_class($info);
echo '<html><head>';
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->windowTitle();
echo $siteMap->clientScript();
echo '</head><body>';
if (isset($startPath)) {
  $info['path'] = $startPath;
  echo $siteMap->navigationBar();
  echo $siteMap->pageTitle();
  echo $siteMap->siteMap('p',$startPath);
} else {
  echo $siteMap->navigationBar();
  echo $siteMap->pageTitle();
  echo '<p>';
  echo $siteMap->pageDescription();
  echo '<p>';
  echo $siteMap->siteMap('p');
}
echo '</body></html>';
?>