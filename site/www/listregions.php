<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'services/listregions.php?'.$q;
header('Location:'.$location);
?>