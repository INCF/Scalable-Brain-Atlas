<?php
require_once('../lib/runtime.php');

/*
 * class mysqlib
 */

class mysqlib_class {
  private $lastQuery = null;
  private $conn = null;
  
  function __construct($conn) {
    $this->conn = $conn;
  }
  
  function close() {
    mysqli_close($this->conn);
  }

  public function createWhereClause($whereClause) {
    $op = $whereClause[1];
    $left = $whereClause[0];
    $right = $whereClause[2];
    if ($op == 'AND' || $op == 'OR') {
      $left = $this->createWhereClause($left);
      $right = $this->createWhereClause($right);
    } else {
      if ($op == 'IN' || $op == 'NOT IN') {
        if (is_array($right)) {
          if (count($right)==0) return 0;
          $q = array();
          foreach ($right as $r) $q[] = $this->quote($r);
          $right = implode(',',$q);
        } else {
          if ($right == '') return 0;
        }
        $right = '('.$right.')';
      } else {
        $right = $this->quote($right);
      }
    }
    return $left.' '.$op.' '.$right;
  }

  private function addWhereClause(&$query,$whereClause) {
    if (is_array($whereClause)) {
      if (isset($whereClause[0])) {
        $query .= ' WHERE '.$this->createWhereClause($whereClause);
      } else {
        $where = array();
        foreach ($whereClause as $k => $v) {
          $w = $this->strip($k);
          if (is_string($v) || is_numeric($v)) {
            if (substr($v,0,5) == 'LIKE ') $w .= ' LIKE '.$this->quote(substr($v,5));
            elseif (substr($v,0,7) == 'REGEXP ') $w .= ' REGEXP '.$this->quote(substr($v,7));
            else $w .= '='.$this->quote($v);
          } elseif (is_array($v)) {
            if ($v[0] == 'IN') {
              $q = array();
              foreach ($v[1] as $u) $q[] = $this->quote($u);
              $w .= ' IN ('.implode(',',$q).')';
            } else {
              $w .= ' '.$this->strip($v[0]).' '.$this->quote($v[1]);
            }
          }
          else phpLibError('Invalid where clause, query \''.$query.'\' where clause \''.json_encode($whereClause).'\'');
          $where[] = $w;
        }
        if (count($where)>0) $query .= ' WHERE '.implode(' AND ',$where);
      }
    } elseif (is_string($whereClause) && substr($whereClause,0,6) == 'WHERE ') {
      $query .= ' '.$whereClause;
    }
  }
  
  private function selectQuery($table,$fields,$whereClause,$orderBy,$limit=null) {
    $query = 'SELECT '.$fields.' FROM '.$this->strip($table);
    $this->addWhereClause($query,$whereClause);
    if (is_string($orderBy)) {
      $query .= ' ORDER BY '.$orderBy;
    }
    if (isset($limit)) {
      $query .= ' LIMIT '.$limit;
    }
    $this->lastQuery = $query;
    return $query;
  }
  
  function getLastQuery() {
    return $this->lastQuery;
  }
  
  function numAffectedRows() {
    return $this->conn->affected_rows;
  }
  
  function anyQuery($query,$abortOnError=true) {
    $rs = @$this->conn->query($query);
    if (!$rs && $abortOnError) phpLibError('Error in mysql query: '.mysqli_error($this->conn).'<br>Query: '.$query);
    return $rs;
  }
  
  function multiQuery($query,$abortOnError=true) {
    $rs = @$this->conn->multi_query($query);
    if (!$rs && $abortOnError) phpLibError('Error in mysql multi_query: '.mysqli_error($this->conn).'<br>Query: '.$query);
    return $rs;
  }
  
  /*
   * reading data from mysql
   */

  function readScalar($table,$field,$whereClause=null) {
    $query = $this->selectQuery($table,$field,$whereClause,null,1);
    $rs = $this->anyQuery($query);
    $row = mysqli_fetch_row($rs);
    $rs->free();
    return (isset($row) ? $row[0] : null);
  }
  
  function readRow($table,$fields,$whereClause=null) {
    $query = $this->selectQuery($table,$fields,$whereClause,null);
    $rs = $this->anyQuery($query);
    $ans = mysqli_fetch_assoc($rs);
    $rs->free();
    return $ans;
  }
  
  function fetchRows($rs,$free=true) {
    $rows = array();
    while ($row = mysqli_fetch_assoc($rs)) {
      $rows[] = $row;
    }
    if ($free) $rs->free();
    return $rows;
  }
  
  function fetchRowsAssoc($rs,$keyField) {
    $rows = array();
    while ($row = mysqli_fetch_assoc($rs)) {
      $key = $row[$keyField];
      unset($row[$keyField]);
      $rows[$key] = $row;
    }
    $rs->free();
    return $rows;
  }
  
  function readRows($table,$fields,$whereClause=null,$orderBy=null,$keyField=null) {
    $query = $this->selectQuery($table,$fields,$whereClause,$orderBy);
    $rs = $this->anyQuery($query);
    return (isset($keyField) ? $this->fetchRowsAssoc($rs,$keyField) : $this->fetchRows($rs));
  }
  
  function countRows($table,$fields,$whereClause=null) {
    $query = $this->selectQuery($table,$fields,$whereClause,$orderBy);
    $rs = $this->anyQuery($query);
    $n = $rs->num_rows;
    $rs->free();
    return $n;
  }
  
  function readColumn($table,$field,$whereClause=null,$orderBy=null) {
    $query = $this->selectQuery($table,$field,$whereClause,$orderBy);
    $rs = $this->anyQuery($query);
    $cols = $this->fetchTableColumns($rs);
    return $cols[$field];
  }

  function readColumns($table,$fields,$whereClause=null,$orderBy=null) {
    $query = $this->selectQuery($table,$fields,$whereClause,$orderBy);
    $rs = $this->anyQuery($query);
    return $this->fetchTableColumns($rs);
  }

  function fetchRowsTransposed(&$rs,$free=true) {
    $T = array();
    $i = 0; 
    while ($row = mysqli_fetch_row($rs)) {
      $j = 0;
      foreach ($row as $cell) {
        $T[$j][$i] = $cell;
        $j++;
      }
      $i++;
    };
    if ($free) $rs->free();
    return $T;
  }

  function fetchTableColumns(&$rs,$free=true) {
    $T = $this->fetchRowsTransposed($rs,false);
    // transpose T and replace array indices by field names
    $H = array();
    $i = 0;
    while ($meta = mysqli_fetch_field($rs)) {
      $H[$meta->name] = (isset($T[$i]) ? $T[$i] : array()); 
      $i++;
    }
    if ($free) $rs->free();
    // return result
    return $H;
  }

  function fetchColumn(&$rs,$free=true) {
    $T = array();
    $i = 0; 
    while ($row = mysqli_fetch_row($rs)) {
      $T[$i] = $row[0];
      $i++;
    };
    if ($free) $rs->free();
    return $T;
  }

  function listTables() {
    $rs = mysqli_query($this->conn,'SHOW TABLES') or phpLibError('cannot show tables');
    $ans = $this->fetchRowsTransposed($rs);
    return $ans[0];
  }

  /*
   * writing data to mysql
   */
   
  function quote($value) {
    if ($value == null) return 'NULL';
    else return "'".mysqli_real_escape_string($this->conn,$value)."'";
  }

  function quoteArray($a) {
    foreach ($a as &$v) $this->quote($v);
    return $a;
  }
  
  function insertQuery($table,$hash) {
    foreach ($hash as &$v) $v = $this->quote($v);
    $query = 'INSERT INTO '.$table.'('.implode(',',array_keys($hash)).') VALUES ('.implode(',',array_values($hash)).')';
    $this->lastQuery = $query;
    return $query;
  }
  
  function insertRow($table,$hash) {
    $query = $this->insertQuery($table,$hash);
    $ok = $this->anyQuery($query,false);
    return ($ok ? 0 : mysqli_error($this->conn)); // return error if any
  }
  
  function insertRows($table,&$H,$keyField=null,$fields=null) {
    if (!isset($fields)) {
      $first = key($H);
      if (!isset($first)) return 0;
      $inFields = $outFields = array_keys($H[$first]);
    } else {
      if (is_string($fields)) {
        $first = key($H);
        $inFields = array_keys($H[$first]);
        $outFields = explode(',',$fields);
      } else {
        $inFields = $outFields = array();
        foreach ($fields as $k=>$v) {
          if (is_int($k)) $inFields[] = $v;
          else $inFields[] = $k;
          $outFields[] = $v;      
        }
      }
    }
    if (isset($keyField)) $outFields[] = $keyField;
    $numFields = count($outFields);
    $query = 'INSERT INTO '.$table.'(`'.implode('`,`',$outFields).'`) VALUES ('.implode(',',array_fill(0,$numFields,'?')).')';
    $stmt = @mysqli_prepare($this->conn,$query);
    if (!$stmt) phpLibError('insertRows('.$table.'): cannot prepare statement '.$query.' because '.mysqli_error($this->conn));
    $fieldTypes = str_repeat('s',$numFields);
    foreach ($H as $k=>&$h) {
      // check whether each row of H has the same keys
      $v = array();
      foreach ($inFields as $f) {
        if (!array_key_exists($f,$h)) addError('insertRows('.$table.'): missing field \''.$f.'\' for key \''.$k.'\'');
        $v[] = $h[$f];
      }
      if (isset($keyField)) $v[] = $k;
      $args = array_merge(array($fieldTypes),$v);
      call_user_func_array(array(&$stmt,'bind_param'),$args) or $E[] = mysqli_error($this->conn);
      $ok = $stmt->execute();
      if (!$ok) addError('insertRows('.$table.'): '.mysqli_error($this->conn)."\nQuery: ".$query);
    }
    $ok = mysqli_commit($this->conn);
    if (!$ok) addError('insertRows('.$table.'): '.mysqli_error($this->conn)."\nQuery: ".$query);
    $ok = $stmt->close();
    if (!$ok) addError('insertRows('.$table.'): '.mysqli_error($this->conn)."\nQuery: ".$query);
  }
  
  function insertColumns($table,$T,$emptyFirst=false,$scalarColums=false) {
    if ($emptyFirst) $this->emptyTable($table);
    // column fields
    $fields = array_keys($T);
    $afields = array();
    $row = array_keys($fields);
    foreach ($fields as $i=>$f) {
      $col = $T[$f];
      if (is_array($col)) {
        if (!isset($rowKeys)) $rowKeys = array_keys($col);
        $afields[$i] = $f;
      } else {
        if ($scalarColums) {
          // treat scalar column as single-valued column 
          $row[$i] = $col;
        } else addError('insertColumns('.$table.'): scalar column '.$f.' not allowed.');      
      }
    }
    if (!isset($rowKeys)) return 0;
    // column fields
    $numFields = count($fields);
    $query = 'INSERT INTO '.$table.'(`'.implode('`,`',$fields).'`) VALUES ('.implode(',',array_fill(0,$numFields,'?')).')';
    $stmt = mysqli_prepare($this->conn,$query) or phpLibError('insertColumns('.$table.'): cannot prepare statement '.$query);
    $fieldTypes = str_repeat('s',$numFields);
    foreach ($rowKeys as $r) {
      foreach ($afields as $i=>$f) {
        $col = $T[$f];
        if (!array_key_exists($r,$col)) addError('insertColumns('.$table.'): missing row \''.$r.'\' for field \''.$f.'\'');
        $row[$i] = $col[$r];
      }
      $args = array_merge(array($fieldTypes),$row);
      $ok = call_user_func_array(array(&$stmt,'bind_param'),$args);
      if (!$ok) addError('insertColumns('.$table.'): '.mysqli_error($this->conn)."\nQuery: ".$query);
      $ok = $stmt->execute();
      if (!$ok) addError('insertColumns('.$table.'): '.mysqli_error($this->conn)."\nQuery: ".$query);
    }
    $ok = mysqli_commit($this->conn);
    if (!$ok) addError('insertColumns('.$table.'): '.mysqli_error($this->conn)."\nQuery: ".$query);
    $stmt->close();
  }
  
  function setKeyToValueQuery($hash) {
    if (is_string($hash)) return $hash;
    foreach ($hash as $k=>&$v) $v = $k.'='.$this->quote($v);
    return implode(',',array_values($hash));
  }
  
  function updateQuery($table,$hash,$whereClause) {
    $query = 'UPDATE '.$table.' SET '.$this->setKeyToValueQuery($hash);
    $this->addWhereClause($query,$whereClause);
    $this->lastQuery = $query;
    return $query;
  }
  
  function updateRows($table,$hash,$whereClause) {
    $query = $this->updateQuery($table,$hash,$whereClause);
    $ok = $this->anyQuery($query,true);
    return ($ok ? 0 : mysqli_error($this->conn)); // return error if any
  }
  
  function updateColumn($table,$pkey_colkey,$col) {
    // prepare statement
    $pkey = key($pkey_colkey);
    $colkey = current($pkey_colkey);
    $query = 'UPDATE '.$table.' SET '.$colkey.'=? WHERE '.$pkey.'=?';
    $stmt = mysqli_prepare($this->conn,$query) or phpLibError('updateColumn: cannot prepare statement');
    foreach ($col as $k=>$v) {
      $ok = $stmt->bind_param('ss',$v,$k);
      if (!$ok) addError(mysqli_error($this->conn));
      $ok = $stmt->execute();
      if (!$ok) addError(mysqli_error($this->conn));
    }
    $ok = mysqli_commit($this->conn);
    if (!$ok) addError(mysqli_error($this->conn));
    $stmt->close();
  }
  
  function insertOrUpdateQuery($table,$insertHash,$updateHash) {
    $setQuery = $this->setKeyToValueQuery($insertHash);
    $query = 'INSERT INTO '.$table.' SET '.$this->setKeyToValueQuery($insertHash).' ON DUPLICATE KEY UPDATE '.$this->setKeyToValueQuery($updateHash);
    $this->lastQuery = $query;
    return $query;
  }

  function insertOrUpdateRows($table,$insertHash,$updateHash,$whereClause) {
    $query = $this->insertOrUpdateQuery($table,$insertHash,$updateHash,$whereClause);
    $ok = $this->anyQuery($query,true);
    return ($ok ? 0 : mysqli_error($this->conn)); // return error if any
  }
  
  function emptyTable($table) {
    $query = 'TRUNCATE TABLE '.$table;
    return mysqli_query($this->conn,$query);
  }
  
  function fillTable($table,$columns_json) {
    // get column info from table to extract fieldTypes
    $query = 'SHOW COLUMNS FROM '.$table;
    $rs = mysqli_query($this->conn,$query) or phpLibError('cannot show columns from table '.$table);
    $fieldInfo = $this->fetchRowsTransposed($rs);
    $numfields = count($fieldInfo[0]);
    $fieldTypes = array();
    for ($i=0; $i<$numfields; $i++) {
      $fieldTypes[$fieldInfo[$i]['Field']] = $fieldInfo[$i]['Type']; 
    }
    // convert json to php array
    $colData = json_decode($columns_json,true);
    if (!isset($colData)) phpLibError('colData has no columns');
    $colNames = array_keys($colData);
    // if no columns, do nothing and be happy about it
    $numcols = count($colNames);
    if ($numcols == 0) return TRUE;
    // if no rows, do nothing and be happy about it
    $numrows = count($colData[$colNames[0]]);
    if ($numrows == 0) return TRUE;
    // delete existing rows
    $numdeleted = $this->emptyTable($table);
    // make sure SQL expects utf8 encoding
    $ok = mysqli_query($this->conn,'SET NAMES \'utf8\'');
    // prepare statement
    $what = array_fill(0,$numcols,'?');
    $query = 'INSERT INTO '.$table.'('.implode(',',$colNames).') VALUES ('.implode(',',$what).')';
    // get variable types from column info
    $colTypes = '';
    foreach ($colNames as $n) {
      if (preg_match("/INT\b/",$n)) $colTypes .= 'i';
      elseif (preg_match("/BLOB\b/",$n)) $colTypes .= 'b';
      elseif ($n == 'FLOAT' || $n == 'DOUBLE') $colTypes .= 'd';
      else $colTypes .= 's';
    }
    $ok = mysqli_autocommit($this->conn,FALSE);
    $stmt = mysqli_prepare($this->conn,$query) or phpLibError('cannot prepare statement');
    $args = array($colTypes);
    for ($i=0; $i<$numrows; $i++) {
      for ($j=0; $j<$numcols; $j++) { $args[$j+1] = $colData[$colNames[$j]][$i]; }
      $ok = call_user_func_array(array(&$stmt,'bind_param'),$args);
      $ok = $stmt->execute();
    }
    $ok = mysqli_commit($this->conn);
    if (!$ok) addError(mysqli_error($this->conn));
    $ok = $stmt->close();
    return TRUE;
  }
  
  function createTable($tName,$tCreate,$dropIfExists=true) {
    $this->conn->query('SET FOREIGN_KEY_CHECKS = 0');
    if ($dropIfExists) {
      $rs = $this->anyQuery('DROP TABLE IF EXISTS `'.$tName.'`');
    }
    $rs = $this->anyQuery($tCreate); 
    $this->conn->query('SET FOREIGN_KEY_CHECKS = 1');
  }
  
  function copyTable($fromTable,$toTable,$fields_csv='*',$tDef=null,$abortOnError=true) {
    if (!isset($tDef)) {
      $rs = $this->anyQuery('SHOW CREATE TABLE '.$fromTable.';');
      $h = $rs->fetch_assoc();
      $tDef = $h['Create Table'];
    }
    $this->createTable($toTable,$tDef,true);
    if ($fields_csv=='*') {
      // get column info from table to extract fieldNames
      $query = 'SHOW COLUMNS FROM '.$fromTable;
      $rs = mysqli_query($this->conn,$query) or phpLibError('cannot show columns from table '.$table);
      $fieldInfo = $this->fetchTableColumns($rs);
      $fields_csv = implode(',',$fieldInfo['Field']);
    }
    $ok = $this->anyQuery('INSERT '.$this->strip($toTable).'('.$this->strip($fields_csv).') SELECT '.$this->strip($fields_csv).' FROM '.$this->strip($fromTable));
  }

  /*
   * deleting data from mysql
   */
  
  private function deleteQuery($table,$whereClause) {
    $query = 'DELETE FROM '.$this->strip($table);
    $this->addWhereClause($query,$whereClause);
    $this->lastQuery = $query;
    return $query;
  }

  function deleteRows($table,$whereClause=null) {
    $query = $this->deleteQuery($table,$whereClause,$this->conn);
    $this->anyQuery($query,false);
  }
   
  // private functions
  
  private function strip($s) {
    return preg_replace('/[^\w\d\.,*]+/','',$s);
  }
}

class cocosql_class extends mysqlib_class {
  function __construct($dbName,$mode='r') {
    require_once(phpLibPath().'coconnect.php');
    $coconnect = new coconnect_class($dbName,$mode);
    $conn = $coconnect->open();
    parent::__construct($conn);
  }  
}
?>