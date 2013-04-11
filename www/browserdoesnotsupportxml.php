<?php
// make query case-insensitive
foreach ($_GET as $k=>$v) $_GET[strtolower($k)] = $v;

// template must be one of supported SBA templates
$template = $_GET['template'];
if (isset($template)) {
  $rgb2acr = json_decode(file_get_contents('./'.$template.'/template/rgb2acr.json'),true);
  $acr2rgb = array_flip($rgb2acr);
}
?>
<html>
<style>
b { color: #009; }
</style>
The <? echo $template ?>-template you are trying to view contains <a href="listregions.php?template=<? echo $template; ?>"><? echo count($acr2rgb); ?> viewable regions</a>.
<p>
Unfortunately, your browser does not support xhtml documents and/or SVG graphics.<br>
The viewer works well in recent versions of these<br>
supported browsers: <b>Mozilla FireFox</b>, <b>Google Chrome</b>, <b>Safari</b>, <b>Opera</b>.
<p>
To view the page in <b>Internet Explorer</b>, you can install<br>
the <a href="http://www.google.com/chromeframe/eula.html">Google Chrome Frame</a> plugin.
</html>
