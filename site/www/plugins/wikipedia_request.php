<?php
$topic = preg_replace('/[^_\d\w]+/','_',$_REQUEST['topic']);
$href = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles='.urlencode($topic);
try {
  $ans = @file_get_contents($href);
  if (!$ans) throw new Exception('Error reading from '.$href);
  $ans = @json_decode($ans,TRUE);
  if (!$ans) throw new Exception('Error decoding '.$href);
  $ans['result'] = $ans;
  $ans['result']['query_url'] = $href;
} catch(Exception $e) {
  $ans = array('error'=>$e->getMessage());
}
if (!headers_sent()) {
  header('Content-type: application/json; charset=utf-8');
  echo json_encode($ans);
}
?>