<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'services/coord2region.php?'.$q;
header('Location:'.$location);
?>
