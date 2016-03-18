<?php
/*
<<<CONFIG
{
  "searchFolders": ["../sitemap","../main","../services","../howto"],
  "pathRanks": {
    "Scalable Brain Atlas|Coronal3d": "A",
    "Scalable Brain Atlas|services": "_A"
  },
  "loginPage": "../services/siteLogin.php",
  "mainMenu": {
    "Home":"Scalable Brain Atlas"
  }
}
CONFIG
*/
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|Site map",
  "rank": "~",
  "status":"A",
  "title": "Site map",
  "description": "Displays site map as a hierarchical tree"
}
SITEMAP
,TRUE);

$startPath = @$_REQUEST['path'];
if (isset($startPath)) {
  $info['title'] = 'Site map: '.str_replace('|','&#160;&#9658;&#160;',$startPath).'&#160;&#9658;';
  $info['path'] = $startPath;
}

require_once('../../shared-php/fancysite.php');
$siteMap = new siteMap_class($info);
$layout = (new layout_class())->fromSiteMap($siteMap);

echo $layout->htmlUntilContent();
echo $siteMap->siteMap('div',$startPath);
echo $layout->htmlAfterContent();
?>
