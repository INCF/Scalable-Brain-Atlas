<?php
ini_set('display_errors',1);
/*
example usage:
http://localhost/incf/development/test/pngtest.php?jpg=../DB08/coronal_MRI/mri_242.jpg
*/

$gdi = function_exists('imagecreatefromjpeg');
if ($gdi) {
  $im = @imagecreatefromjpeg($_REQUEST['jpg']);
} else {
  header('Location:'.$_REQUEST['jpg']);
}
if (!$im) return;

imagetruecolortopalette($im, false, 63);

for ($i=0; $i<63; $i++) {
  $v = imagecolorsforindex($im,$i);
  $v = max($v);
  $r = $v<96 ? 0 : ($v<160 ? ($v-96)*4+3 : ($v<224 ? 255 : 255-($v-224)*4));
  $g = $v<32 ? 0 : ($v<96 ? ($v-32)*4+3 : ($v<160 ? 255 : ($v<224 ? 255-($v-160)*4 : 0)));
  $b = $v<32 ? ($v+0)*8+3 : ($v<96 ? 255 : ($v<160 ? 255-($v-96)*4 : 0));
  imagecolorset($im, $i, $r, $g, $b);
}

/*
echo '<table>';
for ($i=0; $i<255; $i++) {
  $v = $i;
  $r = $v<96 ? 0 : ($v<160 ? ($v-96)*4+3 : ($v<224 ? 255 : 255-($v-224)*4));
  $g = $v<32 ? 0 : ($v<96 ? ($v-32)*4+3 : ($v<160 ? 255 : ($v<224 ? 255-($v-160)*4 : 0)));
  $b = $v<32 ? ($v+32)*8+3 : ($v<96 ? 255 : ($v<160 ? 255-($v-96)*4 : 0));
  echo '<tr><td>'.($i+1).'</td><td>'.$r.'</td><td>'.$g.'</td><td>'.$b.'</td></tr>';
}
echo '</table>';
*/

//imagegammacorrect($im, 1.0, 0.537);

header('Content-Type: image/png');

imagepng($im);

imagedestroy($im);
?>