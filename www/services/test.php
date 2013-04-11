<?php

function decomposeHull($hull,$x0) {
  echo $hull.'| ';
  $hull = str_replace('M','',$hull);
  $hull = str_replace('L',' ',$hull);
  $hull = str_replace('z','',$hull);
  $xyxy =  explode(' ',$hull);
  $xPrev = $xyxy[count($xyxy)-2];
  $yPrev = $xyxy[count($xyxy)-1];
  $path = array(0=>array(),1=>array());
  $side = ($xyxy[0]<$x0 ? 0 : 1);
  for ($p=0; $p<count($xyxy); $p+=2) {
    $x = $xyxy[$p];
    $y = $xyxy[$p+1];
    if (($xPrev-$x0)*($x-$x0)<0) {
      $frac = ($x-$x0)/($x-$xPrev);
      $yM = $y-$frac*($y-$yPrev);
      $path[$side][] = ' '.$x0.' '.$yM;
      $side = 1-$side;
      $path[$side][] = 'M'.$x0.' '.$yM;
    } else {
      $path[$side][] = ' '.$x.' '.$y;
    }
    $xPrev = $x;
    $yPrev = $y;
  }
  $pathL = implode('',$path[0]);
  $start = strpos($pathL,'M');
  $pathL = substr($pathL,$start).substr($pathL,0,$start);
  $pathR = implode('',$path[1]);
  $start = strpos($pathR,'M');
  $pathR = substr($pathR,$start).substr($pathR,0,$start);
  
  echo '<p>'.json_encode($pathL);
  echo '<p>'.json_encode($pathR);
}

$hull = "M1357 2663L1501 1152 2077 828 3229 1007 3611 1309 5230 3036 7069 6125 7366 6764 6920 7722 6142 8347 1897 9031 1213 9031 1033 8851 934 8743 890 7988 890 7916 1357 2663z";
decomposeHull($hull,4000);
?>