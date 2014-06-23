<?php
$location = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
$pos = strrpos($location,'/cocomac');
$templateLocation = substr($location,0,$pos+1);
header('Location: '.$templateLocation.'coronal3d.php?template=PHT00&plugin=CoCoMac');
?>