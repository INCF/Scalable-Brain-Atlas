<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|hierarchy",
  "title": "Complete brain region hierarchy",
  "description": "Interactively displays the brain region hierarchy for a given template, including all structures without visible representation in the template"
}
SITEMAP
,TRUE);

require_once('../shared-lib/sitemap.php');
require_once('../shared-lib/applet.php');
require_once('../lib/sba_viewer.php');

$siteMap = new siteMap_class($info);
$applet = new applet_class('get');
$f = new selectField_class('Atlas templatei');
$f->setChoices(listTemplates('friendlyNames'),NULL);
$applet->addFormField('template',$f);

$errors = $applet->parseAndValidateInputs($_REQUEST);
$template = $_REQUEST['template'];
$runLevel = $applet->runLevel($_REQUEST['run'],$template);

if ($runLevel == 0 || count($errors)) {
	/*
	 * Interactive mode
	 */
	echo '<html><head>';
	echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
	echo $siteMap->windowTitle();
	echo $siteMap->clientScript();
	echo $applet->clientScript();
	echo '</head><body>';
	echo $siteMap->navigationBar();
	echo $siteMap->pageTitle();
	echo $siteMap->pageDescription();
	echo '<p>';
	echo $applet->standardFormHtml('Show hierarchy','_top',$_REQUEST);  
	if (count($errors) && isset($template)) echo $applet->errorReport($errors);
	echo '</body></html>';
	exit;
}

/*
 * On submit
 */
 
$template = $_REQUEST['template'];
$jsonPath = '../'.$template.'/template/';

// default configuration
$config = json_decode(file_get_contents('../main/config.json'),true);

// overload with template-specific configuration
$tmp = json_decode(file_get_contents($jsonPath.'config.json'),true);
foreach ($tmp as $k=>$v) $config[$k] = $v;
$info['title'] .= ' - '.@$config['templateName'];
$siteMap = new siteMap_class($info);

echo '<?xml version="1.0" encoding="utf-8"?>';
echo '<html><head>';
echo '<script type="text/javascript" src="../shared-js/browser.js"></script>';
echo $siteMap->windowTitle();
echo $siteMap->clientScript();
echo $applet->clientScript();

function fileContents($fname,$alt='null') {
  $ans = @file_get_contents($fname);
  return $ans ? $ans : $alt;
}
?>

<style type="text/css">
* {
  -moz-box-sizing: border-box; /* mozilla */
  -webkit-box-sizing: border-box; /* google chrome */
  box-sizing: border-box; /* Opera7, IE */
  -ms-box-sizing: border-box; /* IE8 */
  position: relative;
}
a:link { text-decoration: none; color: blue }
a:visited { text-decoration: none; color: blue }
a:hover { text-decoration: underline; color: red }

#view2d_list { 
  background: #fec;
  border: 1px solid #bbb;
}
ul.sitelist { 
  color: #000;
  padding: 2px;
  margin: 0px;
  list-style-type: none;
  font-size: small;
}
.sitelist .highlight {
  background: #007;
  color: #ddd;
}
a.rgb,a.nn {
  font-size: small;
}
a.nn {
  font-variant: small-caps;
}
</style>
<link rel="stylesheet" type="text/css" href="../css/myPage.css"/>
<link rel="stylesheet" type="text/css" href="../css/myForms.css"/>
<link rel="stylesheet" type="text/css" href="../css/myTree.css"/>
<script language="javascript" src="../js/browser.js"></script>
<script language="javascript" src="../js/json.js"></script>
<script language="javascript" src="../js/hash.js"></script>
<script language="javascript" src="../js/instanceManager.js"></script>
<script language="javascript" src="../js/fastsuggest.js"></script>
<script language="javascript" src="../js/tooltip.js"></script>
<script language="javascript" src="../js/myMenu.js"></script>
<script language="javascript" src="../js/myTree.js"></script>
<script language="javascript" src="../js/sba_regiontree.js"></script>
<script language="javascript">
<?php 
echo 'var BRAIN_REGIONS='.fileContents($jsonPath.'brainregions.json').';';
echo 'var RGB_TO_ACR='.fileContents($jsonPath.'rgb2acr.json').';';
echo 'var ACR_TO_FULL='.file_get_contents($jsonPath.'acr2full.json').';';
echo 'var ACR_TO_PARENT='.fileContents($jsonPath.'acr2parent.json').';';
echo 'var ACR_TO_NNID='.fileContents($jsonPath.'acr2nnid.json').';';
?>

function showRegionTree(elemId) {
  var nestedArray = REGION_TREE.rootNode.asNestedArray(ACR_TO_FULL,0);
  var domTree = new myTree_class('regionTree',nestedArray);
  document.getElementById(elemId).innerHTML = domTree.html();
}

function selectRegion(acr) {
  var nd = REGION_TREE.regionList[acr];
  rgbList = nd.rgbRegions();
  if (BRAIN_REGIONS != undefined) {
    var slices = [];
    for (var i in rgbList) if (rgbList.hasOwnProperty(i)) {
      var s = hash.keys(BRAIN_REGIONS[rgbList[i]]);
      for (var j in s) if (s.hasOwnProperty(j)) {
        slices[s[j]] = true;
      }
    }
  }
  alert('Region "'+acr+'" consists of '+(rgbList.length)+' parts/subregions, and is visible in slices '+hash.keys(slices));
}

function goBrainInfo(nn) {
  var ah = nn.substr(0,1);
  var href = 'http://braininfo.rprc.washington.edu/';
  if (ah == 'A') {
    nn = nn.substr(1);
    href += 'Scripts/ancilcentraldirectory.asp?ID='+nn;
  } else if (ah == 'H') {
    nn = nn.substr(1);
    href += 'Scripts/hiercentraldirectory.asp?ID='+nn;
  } else {
    href += 'centraldirectory.aspx?ID='+nn;
  }
  if (typeof(BRAIN_INFO_WINDOW) != 'undefined') {
    BRAIN_INFO_WINDOW.close();
  }
  BRAIN_INFO_WINDOW = window.open(href);
}

function bodyOnload() {
  showRegionTree('regionTree');
}

var REGION_TREE = new regionTree_class(ACR_TO_PARENT,RGB_TO_ACR,BRAIN_REGIONS,ACR_TO_NNID,'[not in hierarchy]');
</script>

</head>
<body onload="bodyOnload()">
<?php
echo $siteMap->navigationBar();
echo $siteMap->pageTitle();
echo $siteMap->pageDescription();
echo '<p>';
echo $applet->standardFormHtml('Show hierarchy','_top',$_REQUEST);  
?>
This hierarchy may be much larger than the one in the Scalable Brain Atlas (SBA) region tree <a href="coronal3d.php?template=<? echo $template ?>&amp;plugin=RegionTree">panel</a>, because
the SBA eliminates all regions which are not viewable (i.e., have no polygons assigned to them).
<br/>Regions which neither have a parent nor children are lumped together in the category '[not in hierarchy]'.
<p/>
<div id="regionTree"></div>
</body>
</html>