<?php
$q = $_SERVER['QUERY_STRING'];
$location = 'main/sitemap.php?'.$q;
header('Location:'.$location);
?>
