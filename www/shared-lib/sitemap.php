<?php

class siteMap_class {
  function __construct($info=array(),$loginPage='',$searchFolders=NULL) {
    $this->info = $info;
    $this->searchFolders = $searchFolders;
    $allow = @$info['allow'];
    if (isset($allow)) {
      session_start();
      $user = @$_SESSION['verified_user'];
      $pm = @$allow[$user];
      if (!isset($pm) || $pm != '*') {
        $location = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];      
        echo 'You have no permission to access this page.<br/>Go to the <a href="'.$loginPage.'?redirect='.$location.'">login page</a> and try again.';
        exit;
      }
    }
  }
  
  function windowTitle() {
    return '<title>'.$this->info['title'].'</title>';
  }

  function clientScript() {
    $path2page = $this->prepareSiteMap();
    $pageTree = $this->convertToPageTree($path2page);    
    return '
      <meta http-equiv="X-UA-Compatible" content="IE=9" /> 
      <link rel="stylesheet" href="../shared-css/sitemap.css" type="text/css"/>
      <script type="text/javascript" src="../shared-js/sitemap.js"></script>
      <script type="text/javascript">
        //<![CDATA[
        globalSiteMap = new siteMap_class('.json_encode($pageTree).');
        //]]>
      </script>
    ';
  }

  function pageTitle($tagName='h1') {
    return '<'.$tagName.'>'.$this->info['title'].'</'.$tagName.'>';
  }

  function pageDescription($tagName='i') {
    return '<'.$tagName.'>'.$this->info['description'].'</'.$tagName.'>';
  }

  function prepareSiteMap() {
    // get current folder
    $scriptFile = $_SERVER['SCRIPT_FILENAME'];
    $pos = strrpos($scriptFile,'/');
    $scriptPath = substr($scriptFile,0,$pos+1);

    $searchFolders = $this->searchFolders;
    if (!isset($searchFolders)) {
			$searchFolders = @file_get_contents($scriptPath.'../sitemapinclude.txt');
			if (isset($searchFolders)) {
				$searchFolders = explode("\n",$searchFolders);
				foreach ($searchFolders as &$sf) $sf = '../'.trim($sf);
			} else {
				$searchFolders = array('.');
			}
		}
    
    $path2page = array();
    foreach ($searchFolders as &$sf) {
      $searchPath = $scriptPath.$sf.'/';
      if (is_dir($searchPath)) {
        if ($dh = opendir($searchPath)) {
          while (($phpFile = readdir($dh)) !== false) {
            if (substr($phpFile,-4) == '.php' && is_file($searchPath.$phpFile)) {
              $fh = fopen($searchPath.$phpFile,'r');
              while (($s = fgets($fh, 1000)) !== FALSE) {
                if (strpos($s,'<<<SITEMAP') !== FALSE) break;
              }
              if ($s !== FALSE) {
                $json = '';
                while (($s = fgets($fh, 1000)) !== FALSE) {
                  if (strpos($s,'SITEMAP') === 0) break;
                  $json .= $s;
                }
                if (strlen(trim($json))>0) {
                  $info = json_decode($json,TRUE);
                  $info['phpFile'] = $sf.'/'.$phpFile;
                  $path = $info['path'];
                  if (isset($path)) {
                    $path2page[$path] = $info;
                  }
                }
              }
            }
          }
          closedir($dh);
        }
      }
    }
    return $path2page;
  }
  
  function convertToPageTree($path2page) {
    $pageTree = array();
    foreach ($path2page as $path=>$page) {
      $parts = explode('|',$path);
      $p2p =& $pageTree;
      foreach ($parts as $p) {
        $p2p =& $p2p[$p];
      }
      $p2p['@'] = $page;
    }
    return $pageTree;
  }
  
  function navigationBar() {
    function pageName($p) {
      $pos = strpos($p,'. ');
      return $pos === FALSE ? $p : substr($p,$pos+2);
    }
    $path = $this->info['path'];
    $parts = explode('|',$path);
    $thisPage = end($parts);
    
    $path2page = $this->prepareSiteMap();
    $pageTree = $this->convertToPageTree($path2page);
    
    $ans = '';
    // '<input type="button" value="&#9658;" class="sm_navbar" onclick="globalSiteMap.menu(this,\'\')"/>&#160;';
    $p2p =& $pageTree;
    $path = '';
    foreach ($parts as $p) {
      $p2p =& $p2p[$p];
      $page = @$p2p['@'];
      $path .= $p;
      $phpFile = isset($page) ? $page['phpFile'] : '../sitemap.php?path='.$path;
      $ans .= ($p == $thisPage ? pageName($thisPage) : '<a href="'.$phpFile.'">'.pageName($p).'</a>');
      if ($p != $thisPage || count($p2p)>1) {
        $ans .= '&#160;<input type="button" value="&#9658;" class="sm_navbar" onclick="globalSiteMap.menu(this,\''.$path.'\')"/>&#160;';
      }
      $path .= '|';
    }
    return $ans;
  }
  
  function tree2html($p2p,$depth=0) {
    if ($depth>100) return;
    asort($p2p);
    $ans = '';
    foreach ($p2p as $k=>$v) {
      if ($k == '@') {
        if ($v['path'] != $this->info['path']) {
          $ans .= '<div style="margin-left: 2ex"><a href="'.$v['phpFile'].'">'.$v['title'].'</a><br/><i>'.$v['description'].'</i></div>';
        } else {
          $ans .= '<div style="margin-left: 2ex"><i>This page</i></div>';
        }
      } else $ans .= '<div style="margin-left: '.($depth ? 2 : 0).'ex; border: 0px solid #000"><b>'.$k.'</b>'.$this->tree2html($v,$depth+1).'</div>';
    }
    return $ans;
  }
  
  function siteMap($tagName='p',$startPath=NULL) {
    $path2page = $this->prepareSiteMap();
    $pageTree = $this->convertToPageTree($path2page);
    $subTree = $pageTree;
    if (isset($startPath)) {
      $parts = explode('|',$startPath);
      foreach($parts as $k) {
        if (!isset($subTree[$k])) break;
        $subTree = $subTree[$k];
      }
    }
    return '<'.$tagName.'>'.$this->tree2html($subTree).'</'.$tagName.'>';
  }
  
  function basicLoginForm($action,$redirect) {
    $a  = '<html><head>';
    $a .=	'</head><body>';
	  $a .= '<form name="login" method="POST" action="'.$action.'">';
	  $a .= '<h1>Login page</h1>';
	  $a .= '<table><tr>';
	  $a .= '<td>User name</td><td>:</td><td><input name="user" type="text"/></td>';
	  $a .= '</tr><tr>';
	  $a .= '<td>Password</td><td>:</td><td><input name="pwd" type="password"/></td>';
	  $a .= '</tr></table>';
	  if ($redirect) $a .= '<input name="redirect" type="hidden" value="'.$redirect.'"/>';
	  $a .= '<input type="submit"/>';
	  $a .= '</form></body></html>';
	  return $a;
  }
}
?>