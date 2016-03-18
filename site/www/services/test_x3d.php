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
$size=800;
echo "<X3D width='".$size."' height='".$size."' profile='Interchange' version='3.2' xmlns:xsd='http://www.w3.org/2001/XMLSchema-instance' xsd:noNamespaceSchemaLocation='http://www.web3d.org/specifications/x3d-3.2.xsd'>";
?>
  <Scene pickMode="color">
    <Background skyColor="0 0 0"/>
    <Viewpoint DEF="VIEW" fieldOfView="0.523599" position="-131072 30520.9443875 22527.7260388" description="Default View" orientation="-0.57735 0.57735 0.57735 -2.0944" centerOfRotation="14294.0783409 30520.9443875 22527.7260388"/>
    <NavigationInfo type="&quot;EXAMINE&quot; &quot;FLY&quot; &quot;ANY&quot;" speed="4" headlight="true"/>
    <DirectionalLight ambientIntensity="1" intensity="0" color="1 1 1"/>
    <Transform DEF="ROOT" translation="0 0 0">
      <Shape>
        <Appearance>
          <Material ambientIntensity="0" emissiveColor="0 0 0" diffuseColor="1 1 1" specularColor="0 0 0" shininess="0.0078125" transparency="0"/>
        </Appearance>
        <IndexedFaceSet DEF="SURF" solid="false" colorPerVertex="false" normalPerVertex="false" coordIndex="0 1 2 -1 1 3 4 -1 2 1 4 -1 2 4 5 -1 3 6 7 -1 6 8 9 -1 7 6 9 -1 7 9 10 -1 5 4 11 -1 4 3 7 -1 11 4 7 -1 11 7 10 -1 5 11 12">
          <Coordinate point="10014 40473 20283,10270 40359 20472,10183 40111 20295,10523 40228 20656,10430 39966 20486,10344 39662 20319,10802 40053 20863,10727 39702 20713,11067 39854 21050,10986 39498 20932,10871 39127 20864,10623 39392 20583,10438 39074 20481,10654 38843 20821,10363 38583 20850,11349 39615 21245,11241 39263 21175,11604 39365 21418,11478 39042 21405,11309 38727 21447"/>
        </IndexedFaceSet>
      </Shape>
    </Transform>
  </Scene>
<?php
echo "</X3D>";
?>
</div>
</body>
</html>
