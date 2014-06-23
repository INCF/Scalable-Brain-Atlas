<?php
$q = $_SERVER['QUERY_STRING'];
if (trim($q) == '') $q = 'template=PHT00';
$location = 'main/hierarchy.php?'.$q;
header('Location:'.$location);
?>