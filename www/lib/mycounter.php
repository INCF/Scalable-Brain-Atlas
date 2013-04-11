<?php
class myCounter_class {
  function __construct($action=NULL) {
    if (class_exists('SQLiteDataBase')) {
		  $this->db = @new SQLiteDataBase('../stats/counter.sql',0666,$msg);
  		$this->sqliteOk($msg,TRUE);
      if ($action == 'update') $this->update();
      if ($action == 'report') echo $this->generateReport();
		}
  }

	function sqliteOk($msg,$verbose=FALSE) {
		if (!$msg && $this->db && $this->db->lastError()) $msg = sqlite_error_string($this->db->lastError());
		if ($msg && $verbose) echo 'Error: '.$msg;
		return !$msg;
	}

	function generateReport() {
		$total = @$this->db->arrayQuery('SELECT ip,year,month,total FROM visits ORDER BY year,month');
		$a = Array();
		$a[] = '<table border="1"><tr><th>IP</th><th>Year</th><th>Month</th><th>Total</th></tr>';
		foreach ($total as $row) {
		  $a[] = '<tr><td>'.$row[0].'</td><td>'.$row[1].'</td><td>'.$row[2].'</td><td>'.$row[3].'</td></tr>';
		}
		$a[] = '</table>';
		return implode($a,"\n");
	}

	function update() {
//echo 'A';	
/*		try {
			$ip = $_SERVER['REMOTE_ADDR'];
			$ip = long2ip($ip);
			$month = date('m');
			$year = date('Y');
			for ($trial=0; $trial<2; $trial++) {
				$total = @$this->db->arrayQuery('SELECT auto_id,total FROM visits WHERE ip=\''.$ip.'\' AND year='.$year.' AND month='.$month,SQLITE_NUM,$msg);
				if (!$this->sqliteOk($msg) && $trial==0) {
					$rs = @$this->db->query('CREATE TABLE visits(auto_id INTEGER PRIMARY KEY,ip TEXT,year INTEGER,month INTEGER,total INTEGER)',SQLITE_NUM,$msg);
				}
			}
			if (is_array($total) && count($total)>0) {
				$autoId = $total[0][0];
				$total = $total[0][1]+1;
				$rs = @$this->db->query('UPDATE visits SET total = \''.$total.'\' WHERE auto_id='.$autoId,SQLITE_NUM,$msg);
				$this->sqliteOk($msg);
			} else {
				$rs = @$this->db->query('INSERT INTO visits(ip,year,month,total) VALUES (\''.long2ip($ip).'\','.$year.','.$month.',1)',SQLITE_NUM,$msg);
				$this->sqliteOk($msg,TRUE);
			}
		} catch(Exception $e) {
			// echo $e->getMessage();
		}
*/		
	}
}
?>