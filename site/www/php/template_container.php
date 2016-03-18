<?php
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;
$svgCapable = $_GET['svgcapable'] == 1;
$template = $_GET['template'];
$contentType = ($svgCapable ? 'application/xhtml+xml' : 'text/html');
header('Content-Type: '.$contentType.'; charset=utf-8');
$cachePath = '../cache/';
$cacheFile = $cachePath.'template_container_'.$template.'.html';
$jsonPath = '../templates/'.$template.'/template/';
$last_modified_cache = @filemtime($cacheFile);
$last_modified_template = filemtime($jsonPath.'svgpaths.json');
header("Last-Modified: ".gmdate("D, d M Y H:i:s", $last_modified_template)." GMT");
header("Robots: None");

if (!$svgCapable) {
  echo '<?xml version="1.0" encoding="utf-8"?>';
  echo '<html><head><script language="javascript">';
  echo 'window.SVG_PATHS=[];';
  echo 'window.BRAIN_REGIONS='; readfile($jsonPath.'brainregions.json'); echo ';'; 
  echo 'window.BRAIN_SLICES='; readfile($jsonPath.'brainslices.json'); echo ';';
  echo 'parent.bodyOnload();';
  echo '</script></head></html>';
  return;
} 
if (!isset($last_modified_cache) || $last_modified_cache<$last_modified_template) {
  $page = array();
  $page[] = '<?xml version="1.0" encoding="utf-8"?>';
  $page[] = '<html xmlns="http://www.w3.org/1999/xhtml"><head><script language="javascript">';
  $page[] = '//<![CDATA[';
  $page[] = 'window.SVG_PATHS='.file_get_contents($jsonPath.'svgpaths.json').';'; 
  $page[] = 'window.BRAIN_REGIONS='.file_get_contents($jsonPath.'brainregions.json').';'; 
  $page[] = 'window.BRAIN_SLICES='.file_get_contents($jsonPath.'brainslices.json').';';
  $page[] = 'parent.bodyOnload();';
  $page[] = '//]]>';
  $page[] = '</script></head></html>';
  $page = implode("\n",$page);
  file_put_contents($cacheFile,$page);
  file_put_contents($cacheFile.'.gz',gzencode($page,9));
}
if (stristr($_SERVER['HTTP_ACCEPT_ENCODING'],'x-gzip')) {
  header("Content-Encoding: gzip");
  readfile($cacheFile.'.gz');
} else {
  readfile($cacheFile);
}
?>
