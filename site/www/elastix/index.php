<html><p>This folder contains Elastix parameter files.</p>
<?php
$files = scandir('.');
foreach ($files as $f) {
  $parts = pathinfo($f);
  if ($parts['extension'] == 'txt') echo '<a href="./'.$f.'">'.$f.'</a><br/>';
}
?>
</html>
