<?php

class siteMap_class {
  function __construct($info=array()) {
    $this->info = $info;
    if (isset($info['allow'])) {
      $allow = $info['allow'];
      @session_start();
      $user = @$_SESSION['verified_user'];
      $pm = @$allow[$user];
      if (!isset($pm) || $pm != '*') {
        $config = $this->readDocString('../sitemap/index.php','CONFIG');
        $loginPage = isset($config['loginPage']) ? $config['loginPage'] : '../sitemap/login.php';
        $location = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];      
        echo 'You have no permission to access this page.<br/>Go to the <a href="'.$loginPage.'?redirect='.$location.'">login page</a> and try again.';
        exit;
      }
    }
    $this->path2page = FALSE;
  }

  function windowTitle() {
    return '<title>'.$this->info['title'].'</title>';
  }

  function clientScript() {
    list($path2page,$mainMenu) = $this->prepareSiteMap();
    $pageTree = $this->convertToPageTree($path2page);
    return '
      <link rel="stylesheet" href="../shared-css/sitemap.css" type="text/css"/>
      <script type="text/javascript" src="../shared-js/sitemap.js"></script>
      <script type="text/javascript">
        //<![CDATA[
        globalSiteMap = new siteMap_class('.json_encode($pageTree).');
        //]]>
      </script>
    ';
  }

  function currentUser() {
    return @$_SESSION['verified_user'];
  }
  
  function userInfo($tagName='div') {
    $user = $this->currentUser();
    return $user ? '<'.$tagName.'>You are logged in as user <tt>'.$user.'</tt></'.$tagName.'>' : '';
  }
  
  function pageTitle($tagName='h1') {
    return '<'.$tagName.'>'.$this->info['title'].'</'.$tagName.'>';
  }

  function pageDescription($tagName='i') {
    return '<'.$tagName.'>'.$this->info['description'].'</'.$tagName.'>';
  }
  
  function pageMenu($tagName='ul') {
    $items = [];
    if ($this->mainMenu) foreach ($this->mainMenu as $k=>$v) {
      if (is_string($v)) {
        $page = isset($this->path2page[$v]) ? $this->path2page[$v]['phpFile'] : '../sitemap/index.php?path='.$v;
        $items[] = '<li><a href="'.$page.'">'.$k.'</a></li>';
      }
    }
    return '<'.$tagName.'>'.join('',$items).'</'.$tagName.'>';
  }
  
  function sortPath($path1,$path2) {
    $p2r = $this->path2rank;
    $parts1 = explode('|',strtolower($path1));
    $parts2 = explode('|',strtolower($path2));
    $n1 = count($parts1);
    $n2 = count($parts2);
    $mn = min($n1,$n2);
    $pp1 = '';
    $pp2 = '';
    for ($i=0; $i<$mn; $i++) {
      $pp1 .= $parts1[$i];
      $pp2 .= $parts2[$i];
      $r1 = isset($p2r[$pp1]) ?  $p2r[$pp1] : '_';
      $r2 = isset($p2r[$pp2]) ?  $p2r[$pp2] : '_';
      $cmp = strcmp($r1,$r2); // compare ranks, if specified.
      if ($cmp != 0) return $cmp;
      $cmp = strcmp($parts1[$i],$parts2[$i]); // compare labels
      if ($cmp != 0) return $cmp;
      $pp1 .= '|';
      $pp2 .= '|';
    }
    return $n1>$n2;
  }

  static function labelsFromPath($path) {
    return explode('|',$path);
  }

  static function readDocString($fname,$tag) {
    $info = NULL;
    if (is_file($fname)) {
      $fp = fopen($fname,'r');
      while (($s = fgets($fp, 1000)) !== FALSE) {
        if (strpos($s,'<<<'.$tag) !== FALSE) break;
      }
      if ($s !== FALSE) {
        $json = '';
        while (($s = fgets($fp, 1000)) !== FALSE) {
          if (strpos($s,$tag) === 0) break;
          $json .= $s;
        }
        if (strlen(trim($json))>0) {
          $info = json_decode($json,TRUE);
          if ($info == null && $json != 'null')
            throw new Exception('File '.$fname.' contains invalid json data: '.htmlspecialchars($json));
        }
      }
    }    
    return $info;
  }

  function prepareSiteMap($requiredStatus='B') {
    if ($this->path2page && $this->mainMenu) return array($this->path2page,$this->mainMenu);
    
    $config = $this->readDocString('../sitemap/index.php','CONFIG');
    $mainMenu = $config['mainMenu'];
    
    // get current folder
    $scriptFile = $_SERVER['SCRIPT_FILENAME'];
    $pos = strrpos($scriptFile,'/');
    $scriptPath = substr($scriptFile,0,$pos+1);

    $cacheDir = $scriptPath.'../cache';
    try {
      // try to load sitemap data from cache
      if (is_file($cacheDir.'/path2page.json')) {
        $age = time()-filemtime($cacheDir.'/path2page.json');
        if ($age>60) throw new Exception('path2page expired');
        $path2page = json_decode(file_get_contents($cacheDir.'/path2page.json'),TRUE);
      } else throw new Exception('no cache');
    } catch (Exception $e) {
      // If cache fails, generate sitemap data from docstrings.
      if (isset($config['searchFolders'])) {
        $searchFolders = $config['searchFolders'];
      } else {
        $searchFolders = glob('../*', GLOB_ONLYDIR);
      }
      $path2rank = array();
      if (isset($config['pathRanks'])) {
        $path2rank = array_change_key_case ($config['pathRanks'],CASE_LOWER);
      }
            
      $path2page = array();
      foreach ($searchFolders as &$sf) {
        $searchPath = $scriptPath.$sf.'/';
        if (is_dir($searchPath)) {
          if ($dh = opendir($searchPath)) {
            while (($phpFile = readdir($dh)) !== false) {
              if (substr($phpFile,-4) == '.php') {
                $info = $this->readDocString($searchPath.$phpFile,'SITEMAP');
                if (is_array($info)) {
                  $status = isset($info['status']) ? $info['status'] : 'B';
                  if (strcmp($status,$requiredStatus)<=0) {
                    $info['phpFile'] = $sf.'/'.$phpFile;
                    if (isset($info['path'])) {
                      $path = $info['path'];
                      $path2page[$path] = $info;
                      if (isset($info['rank'])) {
                        $path2rank[strtolower($path)] = $info['rank'];
                      }
                    }
                  }
                }
              }
            }
            closedir($dh);
          }
        } else
          throw new Exception('Sitemap cannot search the non-existent folder "'.$searchPath.'"');
      }
      $this->path2rank = $path2rank;
      uksort($path2page,array($this,'sortPath'));
      if (is_dir($cacheDir)) {
        file_put_contents($cacheDir.'/path2page.json',json_encode($path2page,JSON_PRETTY_PRINT));
      }
    }
    $this->path2page = $path2page;
    $this->mainMenu = $mainMenu;
    return array($path2page,$mainMenu);
  }
  
  function convertToPageTree($path2page) {
    $pageTree = array();
    foreach ($path2page as $path=>$page) {
      //$parts = explode('|',$path);
      $labels = $this->labelsFromPath($path);
      $p2p =& $pageTree;
      //$rank = 0;
      foreach ($labels as $p) {
        $p2p =& $p2p[$p];
      }
      $p2p['@'] = $page;
    }
    
    if (0) {
      $scriptFile = $_SERVER['SCRIPT_FILENAME'];
      $pos = strrpos($scriptFile,'/');
      $scriptPath = substr($scriptFile,0,$pos+1);
      $cacheDir = $scriptPath.'../cache';
      if (is_dir($cacheDir)) {
        file_put_contents($cacheDir.'/pageTree.json',json_encode($pageTree,JSON_PRETTY_PRINT));
      }
    }
    return $pageTree;
  }
  
  function navigationBar() {
    function pageName($p) {
      $pos = strpos($p,'. ');
      return $pos === FALSE ? $p : substr($p,$pos+2);
    }
    
    list($path2page,$mainMenu) = $this->prepareSiteMap();
    $pageTree = $this->convertToPageTree($path2page);

    $path = $this->info['path'];
    $labels = $this->labelsFromPath($path);
    $thisPage = (isset($path2page[$path]) ? $path2page[$path]['phpFile'] : NULL);
    
    $ans = '';
    $p2p =& $pageTree;
    $path = '';
    foreach ($labels as $p) {
      $p2p =& $p2p[$p];
      $page = @$p2p['@'];
      $path .= $p;
      $phpFile = isset($page) ? $page['phpFile'] : '../sitemap/index.php?path='.$path;
      $ans .= ($phpFile == $thisPage ? pageName($p) : '<a href="'.$phpFile.'">'.pageName($p).'</a>');
      if ($phpFile != $thisPage || count($p2p)>1) {
        $ans .= '&#160;<input type="button" value="&#9658;" class="sm_navbar" onclick="globalSiteMap.menu(this,\''.$path.'\')"/>&#160;';
      }
      $path .= '|';
    }
    return $ans;
  }
  
  function tree2html($p2p,$depth=0) {
    if ($depth>100) return;
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
  
  function siteMap($tagName='div',$startPath=NULL) {
    list($path2page,$mainMenu) = $this->prepareSiteMap();
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
  
  function getLayout() {
    return new template_class(file_get_contents('../css/template.html'));
  }
  
  function basicLoginForm($action,$redirect,$fixedUser=FALSE) {
    $a  = '<html><head>';
    $a .=	'</head><body>';
    $a .= '<form name="login" method="POST" action="'.$action.'">';
    $a .= '<h1>Login page</h1>';
    $a .= '<table><tr>';
    if ($fixedUser) {
      $a .= '<td>User name</td><td>:</td><td><input name="user" type="hidden" value="'.$fixedUser.'"/>'.$fixedUser.'</td>';
    } else {
      $a .= '<td>User name</td><td>:</td><td><input name="user" type="text"/></td>';
    }    
    $a .= '</tr><tr>';
    $a .= '<td>Password</td><td>:</td><td><input name="pwd" type="password"/></td>';
    $a .= '</tr></table>';
    if ($redirect) $a .= '<input name="redirect" type="hidden" value="'.$redirect.'"/>';
    $a .= '<input type="submit"/>';
    $a .= '</form></body></html>';
    return $a;
  }
}

class layout_class {
  function __construct($fname='default.html') {
    ob_start();
    $html = file_get_contents('../layout/'.$fname);
    $parts = preg_split('/(<body[^\>]*>)/',$html,NULL,PREG_SPLIT_DELIM_CAPTURE);
    $this->head = implode('',array_splice($parts,0,1));
    $this->body = implode('',$parts);
    $this->content = array();
  }
  
  function fromSiteMap($sm) {
    $this->addHead([
      $sm->windowTitle(),
      $this->script('../shared-js/browser.js'),
      $sm->clientScript()
    ]);
    $this->addBody(array(
      'navigationBar' => $sm->navigationBar(),
      'pageTitle' => $sm->pageTitle(),
      'pageDescription' => $sm->pageDescription(),
      'pageMenu' => $sm->pageMenu()
    ));
    return $this;
  }
  
  function script($src) {
    return '<script type="text/javascript" src="'.$src.'"></script>';
  }

  function style($css) {
    return '<link rel="stylesheet" href="'.$css.'" type="text/css"/>';
  }
  
  function addHead($list) {
    $this->head = str_replace('</head>',implode('',$list).'</head>',$this->head);
  }

  function addBody($dict) {
    foreach ($dict as $k=>$v) $this->content[$k] = $v;
  }
  
  function htmlUntilContent() {
    $parts = preg_split('/id="([^"]+)">/',$this->body,NULL,PREG_SPLIT_DELIM_CAPTURE);
    $iContent = -1;
    foreach ($parts as $i=>$key) {
      if ($i % 2) {
	      $parts[$i] = 'id="'.$key.'">'.(isset($this->content[$key]) ? $this->content[$key] : '');
        if ($key == 'pageContent') $iContent = $i;
      }
    }
    $this->partsUntilContent = array_splice($parts,0,$iContent+1);
    $this->partsAfterContent = $parts;
    return $this->head.implode('',$this->partsUntilContent);
  }
  
  function htmlAfterContent() {
    return implode('',$this->partsAfterContent);
  }

  function pageHtml() {
    $content = ob_get_clean();
    return $this->htmlUntilContent().$content.$this->htmlAfterContent();
  }

  function pageJson() {
    $this->content['pageContent'] = ob_get_clean();
    return json_encode($this->content);
  }
}
?>
