<?php
$q = $_SERVER['QUERY_STRING'];
$location = '../main/coronal3d.php?template=DB08&'.$q;
header('Location:'.$location);
?>
