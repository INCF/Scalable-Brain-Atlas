<?php
header('HTTP/1.1 301 Moved Permanently');
$q = $_SERVER['QUERY_STRING'];
$location = 'main/index.php?'.$q;
header('Location:'.$location);
?>
