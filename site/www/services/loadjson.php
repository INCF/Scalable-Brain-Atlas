<?php
foreach ($_REQUEST as $k=>$v) $_REQUEST[strtolower($k)] = $v;

$template = $_REQUEST['template'];
$jsonfile = $_REQUEST['jsonfile'];

$jsonfile = '../'.$template.'/template/'.$jsonfile.'.json';
header('Content-type: application/json; charset=utf-8');
if (file_exists($jsonfile)) readfile($jsonfile);
else echo 'null';
?>