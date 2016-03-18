<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'main/coronal3d.php?'.$q;
header('Location:'.$location);
?>