<?php
foreach ($_REQUEST as $k=>$v) $_REQUEST[strtolower($k)] = $v;

function loadUrl($host,$port,$uri,$post,$lim=1000) {
  $fp = @fsockopen($host,$port, $errno, $errstr, 10);
  $method = isset($post) ? 'POST' : 'GET';
  if (isset($port) && $port != 80) $host .= ':'.$port;
  if ($fp) {
    $h .= $method.' '.$uri.' HTTP/1.0'."\r\n";
    $h .= 'Host: '.$host."\r\n";
    $h .= 'User-Agent: Mozilla/5.0'."\r\n";
    $h .= 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'."\r\n";
    $h .= 'Connection: Close'."\r\n\r\n";
    fwrite($fp,$h);
    if ($method == 'POST') {
WHAT EXACTLY TO WRITE HERE?
      fwrite($fp,$post);
    }
    $hdr = array();
    $ans = array();
HOW TO SEPARATE HDR FROM ANS    
    while (!feof($fp) and count($ans)<$lim) {
      array_push($ans,fgets($fp, 128));
    }
    fclose($fp);
    $ans = implode('',$ans);
  }
  return $ans;
}

$server = $_REQUEST['server'];
$query = $_REQUEST['query'];
$method = $_REQUEST['method'];

// gatekeeper
$trustedServers = json_decode(file_get_contents('../plugins/trusted_urls.json'),TRUE);
$ok = FALSE;
foreach ($trustedServers as $ts) { if (strcmp($ts,$server) === 0) $ok = TRUE; break; }
if (!$ok) trigger_error('The server "'.$server.'" is not registered as a trusted server');

//$url = $server.$query;
//$ans = @file_get_contents($url);
$ans = loadUrl($server,$query,$method);
echo $ans;
?>