<?php
$plugin = strtolower($_GET['plugin']);
$size_px = $_GET['size_px'];

$externalPlugin = (substr($plugin,0,1)=='@');
$icon = '../plugins/'.$plugin.'_icon'.$size_px.'.png';
if (!file_exists($icon)) {
	$icon = '../plugins/'.$plugin.'_icon.png';
	if (!file_exists($icon)) {
		$icon = $externalPlugin ? '../plugins/external72.gif' : '../plugins/noicon.png'; 
	}
}
header('Location: '.$icon);
?>