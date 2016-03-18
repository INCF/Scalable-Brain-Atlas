<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|list templates",
  "title": "List of supported atlas templates",
  "description": "Returns a html-table with all supported atlas templates, including their title and species"
}
SITEMAP
,TRUE);

require_once('../../shared-php/fancysite.php');
$siteMap = new siteMap_class($info);
?>
<head>
<?php
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->windowTitle();
echo $siteMap->clientScript();
?>
</head>
<body>
<?php
echo $siteMap->navigationBar();
echo $siteMap->pageTitle();
echo $siteMap->pageDescription();
?>
<p>
<table border=1>
<tr><th>Abbreviation<th>Species<th>Atlas space<th>Template name<th>Reference
<?php
require_once('../../lib-php/sba_viewer.php');
$templates = listTemplates_release('alpha');
foreach ($templates as $template) {
  // default configuration
  $config = json_decode(file_get_contents('../main/config.json'),true);
  // overload with template-specific configuration
  $templatePath = '../templates/'.$template;
  $tmp = json_decode(file_get_contents($templatePath.'/config.json'),true);
  foreach ($tmp as $k=>$v) $config[$k] = $v;
  echo '<tr><td>'.$template.'<td>'.$config['species'].'<td>'.$config['atlasSpace'].'<td>'.$config['templateName'];
}
?>
