<?php
// create the zip file and add all m-files in the current folder
$scriptfile = $_SERVER['SCRIPT_FILENAME'];
$zipname = 'scalablebrainatlas_mfiles.zip';
$mfolder = str_replace('download_mfiles.php','',$scriptfile);
$cachefolder = str_replace('mfiles/download_mfiles.php','cache/',$scriptfile);
$zipfile = $cachefolder.$zipname;
if (is_file($zipfile)) unlink($zipfile);
$zip = new ZipArchive();
if ($zip->open($zipfile, ZIPARCHIVE::CREATE)!==TRUE) {
  exit("cannot open <$zipfile>\n");
}
if (is_dir($mfolder)) {
  if ($dh = opendir($mfolder)) {
    while (($mfile = readdir($dh)) !== false) {
      if (is_file($mfile) && substr($mfile,-2) == '.m') {
        $zip->addFile($mfolder . $mfile,$mfile);
      }
    }
    closedir($dh);
  }
}
$zip->close();

// send the zip file to the client
$location = 'http://'.$_SERVER['SERVER_ADDR'].$_SERVER['REQUEST_URI'];
$pos = strpos($location,'mfiles/download_mfiles.php');
$cached_zip = substr($location,0,$pos).'cache/'.$zipname;
header('Content-type','application/zip');
header('Location: '.$cached_zip);
?>