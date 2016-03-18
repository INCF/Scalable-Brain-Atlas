<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'services/thumbnail.php?'.$q;
header('Location:'.$location);
?>