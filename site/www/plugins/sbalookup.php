<?php
ob_start();
ini_set('display_errors',1);
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|SBA Lookup",
  "title": "Create a catalog for cross-template brain region lookup",
  "description": "Creates/updates the SBA Lookup catalog based on acronyms, full names and aliases of all mature templates, and stores it as ../cache/sbalookup.json."
}
SITEMAP
,TRUE);

require_once('../../shared-php/formatAs.php');

function update_cache() {
  require_once('../../lib-php/sba_viewer.php');
  $templates = listTemplates_release('beta');
  $modified = @filemtime('acr2id.json');
  if ($modified) {
    $update = FALSE;
    foreach ($templates as $template) {
      if (file_exists('../templates/'.$template.'/template/acr2full.json')) {
        $mtime = @filemtime('acr2id.json');
        if ($mtime && $mtime>$modified) $update = TRUE; break;
      }
    }
    if (!$update) return;
  }
  
  $hits = array('@template2species'=>array());
  foreach ($templates as $template) {
    if (file_exists('../templates/'.$template.'/template/acr2full.json')) {
      $s = file_get_contents('../templates/'.$template.'/template/acr2full.json');
      $acr2full = json_decode($s,TRUE);
      foreach ($acr2full as $acr=>$full) {
        $acr_lc = strtolower($acr);
        if (!isset($hits[$acr_lc])) $hits[$acr_lc] = array();
        $hits[$acr_lc][] = array($template,$acr,$full);
        $full_lc = strtolower($full);
        if ($full_lc != $acr_lc) {
          if (!isset($hits[$full_lc])) $hits[$full_lc] = array();
          $hits[$full_lc][] = array($template,$acr,$full);
        }
      }
      if (file_exists('../templates/'.$template.'/template/alias2acr.json')) {
        $s = file_get_contents('../templates/'.$template.'/template/alias2acr.json');
        $alias2acr = json_decode($s,TRUE);
        foreach ($alias2acr as $alias=>$acr) {
          $full = $acr2full[$acr];
          $alias_lc = strtolower($alias);
          if (!isset($hits[$alias_lc])) $hits[$alias_lc] = array();
          $hits[$alias_lc][] = array($template,$acr,$full); // 11: PWPRT12,A11,area 11 of cortex
        }   
      }
    }
    $s = file_get_contents('../templates/'.$template.'/config.json');
    $config = json_decode($s,TRUE);
    $hits['@template2species'][$template] = isset($config['species']) ? $config['species'] : 'unknown';
  }
  file_put_contents('../cache/sbalookup.json',json_encode($hits));
}

try {
  update_cache();
  // return results in json-rpc format
  $ans = file_get_contents('../cache/sbalookup.json');
  $msg = ob_get_clean();
  if ($msg) throw new Exception($msg);
} catch(Exception $e) {
  // return error in json-rpc format
  $ans = json_encode(array(
    "error" => $e->getMessage()
  ));
}
echo formatAs_jsonHeaders().$ans;
?>
