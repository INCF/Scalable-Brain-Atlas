<?php
/*
 * json routines, to encode objects posted via phpRequest
 */
 
function json_html($v) {
  if (is_scalar($v)) {
    return json_htmlString($v);
  } elseif (is_array($v)) {
    return json_htmlArray($v);
  }
  return 'NULL';
}

function json_htmlString($s) {
  $s = json_encode($s);
  return preg_replace('/^"|"$/','',$s);
}

function json_htmlArray($H) {
  $a = array('<table border=1 class="json_html">'); // array holding the partial texts
  foreach ($H as $k=>$v) {
    $a[] = '<tr><td class="k">'.json_htmlString($k).'</td><td class="v">'.json_html($v).'</td></tr>';
  }
  $a[] = '</table>';
  return implode("\n",$a);
}
?>