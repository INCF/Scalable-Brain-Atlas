<?php
// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

$template = $_GET['template'];

header('Content-type','text/plain');
$templatePath = '../'.$template;
$config = json_decode(file_get_contents($templatePath.'/config.json'),TRUE);
$boundingBox = $config['boundingBox'];
if (isset($boundingBox)) {
  echo '['.implode(' ',$boundingBox).'];';
}
?>
