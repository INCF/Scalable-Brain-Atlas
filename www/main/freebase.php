<?php
$topic = preg_replace('/[^_\d\w]+/','_',$_REQUEST['topic']);
$query_json = '{"id":"/topic/en/'.$topic.'","key":{"namespace":"/wikipedia/en_id","value":null},"/common/topic/article": {"id": null}}';
$query_json = '{"query":'.$query_json.'}';
$href = 'http://api.freebase.com/api/service/mqlread?query='.urlencode($query_json);
$ans = @file_get_contents($href);
$ans = @json_decode($ans,true);
$ans['query_url'] =$href;
$id = $ans['result']['/common/topic/article']['id'];
if (isset($id)) {
  $href = 'http://www.freebase.com/api/trans/raw'.$id;
  $content = @file_get_contents($href);
  if ($content) {
    $ans['result']['content'] = preg_replace('/<.*?>/','',$content.'...');
  }
  $ans['result']['href'] = "http://en.wikipedia.org/wiki/index.html?curid=".$ans['result']['key']['value'];
}

if (!headers_sent()) {
  header('Content-type: application/json; charset=utf-8');
  echo json_encode($ans);
}
?>