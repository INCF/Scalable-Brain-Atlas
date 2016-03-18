<?php header("Content-Type: application/xhtml+xml;charset=utf-8"); ?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script type="text/javascript" src="../js/x3dom.js"></script>
<script type="text/javascript">
</script>
<link rel='stylesheet' type='text/css' href='../css/x3dom.css' />
</head>
<body>
<div>
<?php
if (isset($_GET['x3d'])) $x3d_file = $_GET['x3d']; else $x3d_file=NULL;
if ($x3d_file) $x3d = file_get_contents($x3d_file); else $x3d = NULL; 
if (isset($_GET['stl'])) $stl_file = $_GET['stl']; else $stl_file=NULL;
if (isset($_GET['size'])) $size = $_GET['size']; else $size=800;
if ($x3d) {
  $_or_stl = $stl_file ? ' or as 3d-printable <a href="'.$stl_file.'">STL file</a>' : '';
  echo '<div>Download this scene <a href="'.$x3d_file.'">in X3D</a> format'.$_or_stl.'.</div>';
  $x3d_tag = "<X3D width='".$size."' height='".$size."' profile='Interchange' version='3.2' xmlns:xsd='http://www.w3.org/2001/XMLSchema-instance' xsd:noNamespaceSchemaLocation='http://www.web3d.org/specifications/x3d-3.2.xsd'>";
  $x3d = preg_replace('/(.*?)(<Scene([^>]*)>)/si',$x3d_tag.'\2',$x3d,1);
  echo $x3d;
} else {
  echo 'No x3d file specified.';
}
?>
</div>
</body>
</html>
