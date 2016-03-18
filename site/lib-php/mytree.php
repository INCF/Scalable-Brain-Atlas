<?php
/*
 * Common functions
 */

// separator must be single character
function splitRight($path,&$L=null,&$R=null,$sep='.') {
  $pos = strrpos($path,$sep);
  if ($pos === false) {
    $R = $path;
    $L = '';
  } else {
    $R = substr($path,$pos+1);
    $L = substr($path,0,$pos);
  }
  if ($R == '') $R = null;
}

// separator must be single character
function splitLeft($path,&$L=null,&$R=null,$sep='.') {
  $pos = strpos($path,$sep);
  if ($pos === false) {
    $L = $path;
    $R = '';
  } else {
    $R = substr($path,$pos+1);
    $L = substr($path,0,$pos);
  }
  if ($L == '') $L = null;
}

/*
 * class myNode
 */
class myNode_class {
  protected $attr = array();
  protected $data = array();
  protected $tag = "node";
  protected $parent = null;
  protected $key = null;
  
  // construct/init
  function __construct($label=null) {
    $this->init('node',$label);
  }
  function init($tag,$label=null) {
    $this->tag = $tag;
    if (isset($label)) $this->setAttribute('label',$label);
  }
  
  // key and parent
  function setParent(&$parent,$key) {
    $this->parent = $parent;
    $this->key = $this->attr['key'] = $key;
  }

  function getKey() {
    return $this->key;
  }
  
  function &getParent() {
    return $this->parent;
  }
  
  // value
  function setValue($value) {
    phpLibError('setValue not defined for node of type '.$this.tag);
  }

  // properties
  function addProperty($key,$value) {
    if (isset($this->data[$key])) phpLibError('Property '.$key.' already exists');
    $this->data[$key] = $value;
  }
  
  function addProperties($h) {
    foreach ($h as $k=>$v) $this->addProperty($k,$v);
  }
  
  function &getProperty($key) {
    return $this->data[$key];
  }
  
  function getProperties() {
    return $this->data;
  }
  
  // attributes
  function setAttribute($key,$value) {
    $this->attr[$key] = $value;
  }
  
  function setAttributes($h) {
    foreach ($h as $k=>$v) $this->setAttribute($k,$v);
  }
  
  function getAttribute($key) {
    return $this->attr[$key];
  }

  // children
  function &addChild(&$node,$key=null) {
    if (isset($key)) {
      if (isset($this->data[$key])) phpLibError('Cannot add child '.json_encode($node->innerData()).'; Key "'.$key.'" already in use by parent '.$this->getPath());
      $this->data[$key] = $node;
    } else {
      // use auto-increment numeric key
      $this->data[] = $node;
      end($this->data);
      $key = key($this->data);
    }
    $node->setParent($this,$key);
    return $node;
  }
  
  function removeChild($key) {
    unset($this->data[$key]);
  }
  
  // nodes
  function &getNode($path,$mustExist=true) {
    if ($path == '') return $this;
    $keys = explode('.',$path);
    $nd =& $this;
    foreach ($keys as $k) { $nd =& $nd->data[$k]; }
    if (!isset($nd) && $mustExist) phpLibError('Cannot find (sub)node with path '.$path);
    return $nd;
  }
  
  // root and path
  function &getRoot() {
    $me = $this;
    while ($pn = $me->parent) { $me = $pn; }
    return $me;
  }
  
  function getPath($rootNode=null,$sep='.') {
    if (!isset($rootNode)) $rootNode = $this->getRoot();
    if ($this === $rootNode) return '';
    $me = $this;
    $keys = array();
    while (isset($me) && $me !== $rootNode) { 
      $keys[] = $me->key; $me = $me->parent; 
    }
    return ($me === $rootNode ? implode($sep,array_reverse($keys)) : null);
  }

  function contentPath($sep='.') {
    $contentRoot = $this->getRoot()->contentRoot;
    return $this->getPath($contentRoot,$sep);
  }
  
  // replaces all non-scalar properties by nodes
  function fullyExpand($jsonDecode=true) {
    if (is_array($this->data)) {
      foreach ($this->data as $i=>$v) {
        if ($v instanceof myNode_class) $v->fullyExpand($jsonDecode);
        else {
          if ($jsonDecode && is_string($v) && strripos($i,'_json')==strlen($i)-5) {
            $v = json_decode($v,true);
          }
          if (is_array($v)) {
            unset($this->data[$i]);
            $n1 = $this->addChild(new arrayNode_class($i),$i);
            foreach ($v as $k=>$v) {
              $n1->addProperty($k,$v);
            }
            $n1->fullyExpand($jsonDecode);
          }
        }
      }
    }
  }
  
  // xml output
  function innerXML() {
    require_once(phpLibPath().'util.php');
    $xml = '<'.$this->tag;
    $xml .= join('',getHashKeyValueStrings($this->attr,'="',' ','"')).'>';
    if (is_scalar($this->data)) {
      $xml .= $this->data;
    } else {
      foreach ($this->data as $i=>$v) {
        if ($v instanceof myNode_class) $xml .= $v->innerXML();
        else {
          $encoding = '';
          if (!is_scalar($v)) {
            $encoding = ' encoding="json"';
            $v = json_encode($v);
          }
          $v = htmlspecialchars($v,ENT_COMPAT);
          $xml .= '<elem key="'.$i.'"'.$encoding.'>'.$v.'</elem>';
        }
      }
    }
    $xml .= '</'.$this->tag.'>';
    return $xml;
  }
  
  // release memory used by the tree, see bug report
  // http://bugs.php.net/?id=45520&edit=2
  function freeMem() {
    $this->parent = null;
    foreach ($this->data as &$nd) {
      if ($nd instanceof myNode_class) $nd->freeMem();
    }
  }
  
  function recursive_innerData() {
    $myData = array('<>'=>$this->attr);
    $myData['<>']['tag'] = $this->tag;
    if (is_array($this->data)) {
      foreach ($this->data as $i=>$v) {
        if ($v instanceof myNode_class) $myData[$i] = $v->recursive_innerData();
        else $myData[$i] = $v;
      }
    } else $myData = $this->data;
    return $myData;
  }
  
  // output as nested php arrays
  function innerData($freeMem=true) {
    $myData = $this->recursive_innerData();
    if ($freeMem) $this->getRoot()->freeMem();
    return $myData;
  }
  
  function recursive_innerList($nodePath,$sep,&$list) {
    $list[$nodePath] = $this->attr;
    foreach ($this->data as $i=>$v) {
      $childPath = $nodePath.$sep.$v->key;
      $v->recursive_innerList($childPath,$sep,$list);
    }
  }
  
  // output as serialized list, 
  // with data as members, nodePath as keys, and attr as values
  function innerList($parentPath='',$sep='.',$freeMem=true) {
    $list = array();
    $nodePath = ($parentPath ? $parentPath.$sep : '').$this->key;
    $this->recursive_innerList($nodePath,$sep,$list);
    if ($freeMem) $this->getRoot()->freeMem();
    return $list;  
  }
}

/*
 * expandNode: additional routines for expanding the tree
 */
class expandNode_class extends myNode_class {
  function __construct($label=null) {
    parent::__construct($label);
  }
  
  // expansion  
  function addRow($row,$fields) {
    foreach ($fields as $f => $childClass) {
      if (isset($childClass)) {
        $node = new $childClass($f);
        $this->addChild($node,$f);
        $node->expand($row);
      } else $this->addProperty($f,$row[$f]);
    }
  }
  function addRowAsNewChild($key,$childClass='expandNode_class',$row,$fields) {
    if ($row) {
      $node = new $childClass($key);
      $this->addChild($node,$key);
      $node->addRow($row,$fields); 
    } else $this->addProperty($key,'No data');
  }
  function addTable($rows,$fields,$keyField=NULL,$rowClass='expandNode_class') {
    $num_rows = count($rows);
    for ($i=0; $i<$num_rows; $i++) {
      $row = $rows[$i];
      $key = (isset($keyField) ? $row[$keyField] : $i);
      $this->addRowAsNewChild($key,$rowClass,$row,$fields);
    }
  }
  function addTableAsNewChild($key,$childClass,$rows,$fields,$keyField=NULL,$rowClass='expandNode_class') {
    if (count($rows)) {
      $node = new $childClass($key);
      $this->addChild($node,$key);
      $node->addTable($rows,$fields,$keyField,$rowClass);
    } else $this->addProperty($key,'No data');
  }
}

class tagNode_class extends myNode_class {
  function __construct($tag,$label=null) {
    parent::init($tag,$label);
  }
}

class scalarNode_class extends myNode_class {
  function __construct($label=null,$value=null) {
    parent::init('scalar',$label);
    $this->setValue($value);
  }

  function getValue() {
    return $this->data[0];
  }

  function setValue($value) {
    $this->data[0] = $value;
  }
}

class htmlNode_class extends scalarNode_class {
  function __construct($label=null,$value=null) {
    parent::init('html',$label);
    if (isset($value)) $this->setValue($value);
  }
}

class arrayNode_class extends myNode_class {
  function __construct($label=null) {
    parent::init('array',$label);
  }
}

class errorNode_class extends myNode_class {
  function __construct($label=null,$value=null) {
    parent::init('error',$label);
    if (isset($value)) $this->data = $value;
  }
}

class warningNode_class extends myNode_class {
  function __construct($label=null,$value=null) {
    parent::init('warning',$label);
    if (isset($value)) $this->data = $value;
  }
}

class callbackNode_class extends myNode_class {
  function __construct($label=null,$args=null) {
    parent::init('callback',$label);
    if (isset($args)) {
      $this->setAttribute('method',$args['method']);
      $this->setAttribute('lib',$args['lib']);
      $this->setAttribute('cmd',$args['cmd']);
      $this->setAttribute('responseType',$args['responseType']);
      $this->addProperty('args',$args['args']);
    }
  }
}

class myFormInstanceNode_class extends myNode_class {
  function __construct($label,$formName) {
    parent::init('myFormInstance',$label);
    $this->setAttribute('formName',$formName);
    $this->setAttribute('display','hidden');
  }
  function setParent(&$parent,$key) {
    parent::setParent($parent,$key);
    $this->setAttribute('nodePath',$parent->contentPath());
  }
}

class myFormTemplateNode_class extends myNode_class {
  function __construct($formLayout=null,$formAttr=null) {
    parent::init('myFormTemplate',null);
    $this->data = $formLayout;
    $this->data['attr'] = $formAttr;
  }
}

class myTree_class extends myNode_class {
  protected $contentRoot;
  private $formsRoot;
  private $contentPath; // prefixes the path of all contentNodes  
  private $dataObj;
  
  function __construct($treeName,$contentNode=null,$contentPath=null) {
    parent::init('mytree','mytree');
    $this->key = $this->attr['key'] = 'mytree';
  	$this->setAttribute('treeName',$treeName);
  	if (isset($contentPath) && strlen($contentPath)>0) {
  	  $this->contentPath = $contentPath;
  	  $this->setAttribute('contentPath',$contentPath);  	  
  	}
    if (isset($contentNode)) {
  	  $this->contentRoot = parent::addChild($contentNode,'content');
    } else {
      $this->contentRoot = parent::addChild(new tagNode_class('content'),'content');
    }
    $this->formsRoot = parent::addChild(new tagNode_class('forms'),'forms');
  }
  
  function &contentNode($path='',$mustExist=true) {
  	return $this->contentRoot->getNode($path,$mustExist);
  }

  function &getForm($formName) {
  	return $this->formsRoot->getNode($formName,/* mustExist */ false);
  }
  
  function formExists($formName) {
  	return isset($this->formsRoot->data[$formName]);
  }

  function addChild(&$node,$key=null) {
    return $this->contentRoot->addChild($node,$key);
  }
  
  function addForm($formLayout=null,$formAttr,$formName) {
    $this->formsRoot->addChild(new myFormTemplateNode_class($formLayout,$formAttr),$formName);
  }
  
//  function nodePath($nd,$rootNode=null) {
//  	if (!isset($rootNode)) $rootNode = $this->contentRoot;
//    $keys = array();
//    do { $keys[] = $nd->key; $nd = $nd->parent; } while (isset($nd) && $nd != $rootNode);
//    return implode('.',array_reverse($keys));
//  }
  
  function treeName() {
    return $this->getAttribute('treeName');
  }
  
  function getBranch($contentPath) {
//    $branch = new myTree_class($this->treeName(),$this->contentNode($contentPath),$contentPath);
    $branch = new myTree_class($this->treeName(),null,$contentPath);
    $nd = $this->contentNode($contentPath);
    $branch->contentRoot = $branch->data['content'] = $nd; 
    $branch->formsRoot = $branch->data['forms'] = $this->formsRoot; 
    return $branch;
  }

  function dataObj(&$dataObj=null) {
  	if (isset($dataObj)) $this->dataObj = $dataObj;
  	return $this->dataObj;
  }
}
?>