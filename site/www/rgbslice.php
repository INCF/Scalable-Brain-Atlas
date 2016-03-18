<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'services/rgbslice.php?'.$q;
header('Location:'.$location);
?>
