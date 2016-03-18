<?php
function formatAs_basicTable($T,$rowSep,$colSep,$withRowNames=TRUE,$withColNames=TRUE,$withData=TRUE,$maxLength=0) {
  if (is_array($rowSep)) {
    $rowOn = $rowSep[0]; 
    $rowOff = $rowSep[1]; 
    $rowSep = $rowOff.$rowOn;
  } else {
    $rowOn = $rowOff = '';
  }
  if (is_array($colSep)) {
    $colOn = $colSep[0]; 
    $colOff = $colSep[1]; 
    $colSep = $colOff.$colOn;
  } else {
    $colOn = $colOff = '';
  }
  $rows = array();
  if ($withColNames) {
    $keys = array_keys(current($T));
    $rows[] = ($withRowNames ? $colOn.$colSep : $colOn).implode($colSep,$keys).$colOff;
  }
  if ($withData) {
    foreach ($T as $r=>$row) {
      if ($maxLength>0) foreach ($row as &$v) {
        if (strlen($v)>$maxLength) $v = substr($v,0,$maxLength).' (...)';
      }
      $rows[$r] = ($withRowNames ? $colOn.$r.$colSep : $colOn).implode($colSep,$row).$colOff;
    }
  } elseif ($withRowNames) {
    foreach ($T as $r=>$row) $rows[$r] = $colOn.$r.$colOff;
  }
  return (isset($rowSep) ? $rowOn.implode($rowSep,$rows).$rowOff : $rows);
}

function formatAs_htmlTable($fields,$T,$tableName=NULL) {
  $ans = '';
  $mx = 0;
  foreach ($fields as $f) { $len=strlen($f); if ($len>$mx) $mx = $len; }
  $ans .= '<style>table{border-collapse:collapse} td{border:1px solid #44A;padding:0px 4px} td.pkey{border:0px;text-align:right} div.vertical{width:1em;height:1em;overflow:visible;writing-mode:tb-rl;-webkit-transform:rotate(-60deg);-moz-transform:rotate(-60deg);-o-transform:rotate(-60deg);}</style>';
  $ans .= '<table><tr><th style="vertical-align: bottom"><div class="vertical"></div></th>';
  foreach ($fields as $f) {
    $ans .= '<th style="vertical-align: bottom; height: '.round(1.125*$mx).'ex"><div class="vertical">'.$f.'</div></th>';
  }
  $rows = formatAs_basicTable($T,NULL,array('<td>','</td>'),FALSE,FALSE,TRUE);
  $addLink = isset($tableName);
  $ans .= '</tr>';
  foreach ($rows as $r=>$row) {
    $tr = '<tr';
    if ($addLink) {
      $tr .= ' id="'.$tableName.'['.$r.']"';
    }
    $ans .= $tr.'><td class="pkey"><b>'.$r.'</b></td>'.$row.'</tr>';
  }
  if (empty($rows)) $ans .= '<tr><td class="pkey"></td><td colspan="'.count($fields).'">No matches to your query</td></tr>';
  $ans .= '</table>';
  return $ans;
}

function formatAs_prettyJson($val,$asHtml=FALSE) {
  $cmpct = json_encode($val);
  $level=0;
  $inQuote = FALSE;
  $escape = FALSE;
  $pretty = '';
  for ($i=0; $i<strlen($cmpct); $i++) {
    $char = substr($cmpct,$i,1);  
    if ($inQuote) {
      if ($char === '"') {
        if (!$escape) $inQuote = FALSE;
      }
      if ($escape) $escape = FALSE;
      elseif ($char === '\\') $escape = TRUE;
    } else {
      if ($char === '"') {
        $inQuote = TRUE;
      } else {
        if ($char === '{' || $char === '[' || $char === ',') {
          if ($char !== ',') $level++;
          $nxt = substr($cmpct,$i+1,1);
          if ($nxt != ']' && $nxt != '}') $char .= "\n".str_repeat('  ',$level);
        }
        if ($char === '}' || $char === ']') {
          $level--;
          $prv = substr($cmpct,$i-1,1);
          if ($prv != '[' && $prv != '{') $char = "\n".str_repeat('  ',$level).$char;
        }
      }
    }
    $pretty .= $char;
  }
  return ($asHtml ? '<pre>'.htmlspecialchars($pretty).'</pre>' :  $pretty);
}

function formatAs_textHeaders($val=NULL) {
  header('Content-type: text/plain; charset=utf-8');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  if (isset($val)) echo $val;
}

function formatAs_jsonHeaders($val=NULL) {
  header('Content-type: application/json; charset=utf-8');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  if (isset($val)) echo json_encode($val);
}

function formatAs_xmlHeaders($val=NULL) {
  header('Content-type: text/xml; charset=utf-8');
  if (isset($val)) echo $val;
}

function formatAs_htmlHeaders($val=NULL) {
  header('Content-type: text/html; charset=utf-8');
  if (isset($val)) echo $val;
}

function formatAs_error($msg) {
//  if (headers_sent()) {
//    // deal with case that headers are already sent
//    $hdrs = headers_list();
//    foreach ($hdrs as $h) {
//      if (stripos($h,'text/html')) {
//        echo formatAs_prettyJson($msg,TRUE);
//        exit(1);
//      }
//    }
//  }
//  formatAs_jsonHeaders();
  throw new Exception(formatAs_prettyJson($msg));
//  exit(1);
}
?>
