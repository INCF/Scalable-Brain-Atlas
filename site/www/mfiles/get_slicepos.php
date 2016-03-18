<?php
// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

$template = $_GET['template'];

header('Content-type','text/plain');
$templatePath = '../'.$template.'/template/';
echo file_get_contents($templatePath.'slicepos.json');
?>