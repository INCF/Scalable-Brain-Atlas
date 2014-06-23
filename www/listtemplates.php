<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'services/listtemplates.php?'.$q;
header('Location:'.$location);
?>