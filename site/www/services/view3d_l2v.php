<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|view/map 3d surface",
  "title": "View a brain surface in 3D and map values onto brain regions.",
  "description": "Generates an html-embedded X3D scene with controls to map values onto brain regions."
}
SITEMAP
,TRUE);

$rpc = (@$_REQUEST['rpc'] !== NULL);
ini_set('display_errors',1);
session_start();
ob_start();
require_once(__DIR__.'/../../shared-php/formatAs.php');
try {
  // global variables
  $viewpoints = array('L'=>'Left','R'=>'Right','P'=>'Posterior','A'=>'Anterior','I'=>'Inferior','S'=>'Superior');
  $attrs = array('size'=>40);

  function getConfig($template) {
    $atlasFolder = __DIR__.'/../templates/'.$template;
    $config = file_get_contents($atlasFolder.'/config.json');
    return json_decode($config,TRUE);
  }
  
  class wizard_class {
    function __construct($request=NULL, $presets=array()) {
      // make request parameters case-insensitive
      if (!isset($request)) $request = $_REQUEST;
      $this->request_lc = array_change_key_case($request,CASE_LOWER);
      $this->presets_lc = array_change_key_case($presets,CASE_LOWER);
      require_once(__DIR__.'/../../shared-php/formfields.php');
    }
    
    function rawValue($key) {
      $key_lc = strtolower($key);
      $v = @$this->presets[$key_lc];
      if (!isset($v)) $v = @$this->request_lc[$key_lc];
      return $v;
    }

    // override
    public $keyChain = array();

    // override
    function nextField(&$values, $key) {}

    function getFormAndValues() {
      $formFields = new formFields_class();
      $keys = $this->keyChain;
      $doSubmit = TRUE;
      $breakpoints = array();
      foreach ($keys as &$k) {
        if (substr($k,0,1)=='?') {
          $k = substr($k,1);
          $breakpoints[$k] = TRUE;
        }
        if (substr($k,-1)=='!') {
          $k = substr($k,0,-1);
          $v = $this->rawValue($k);
          if (!isset($v)) $doSubmit = FALSE;
        }
      }
      unset($k);
      $values = array();
      $errors = array();
      $usesDefaults = FALSE;
      foreach ($keys as $k) {
        if (isset($breakpoints[$k])) {
          if ($doSubmit) {
            if (count($errors)) break;
          } else {
            if ($usesDefaults || count($errors)) break;
          }
          // freeze previous fields
          foreach ($formFields->fields as $i=>$ff) {
            $ff->setDefault($values[$i]);
            $ff->setReadOnly(TRUE);
          }
        }
        list($ff,$submitText) = $this->nextField($values, $k);
        $raw = $this->rawValue($k);
        if (isset($raw)) {
          list($val,$err) = $ff->validate($raw);
        } else {
          $val = $ff->getPreset();
          if (!isset($val)) {
            $usesDefaults = TRUE;
            $val = $ff->getDefault();
            if (!isset($val)) $err = 'Missing value for field '.$k;
          }
        }
        $formFields->addField($k,$ff);
        $values[$k] = $val;
        if ($err) $errors[$k] = $err;
      }
      return array($formFields,$values,$errors,$submitText,$doSubmit);
    }
  }
  
  class myWizard_class extends wizard_class {
    public $keyChain = array('template!','?space','?mesh','?deform','l2v','clim','bg','width','height','cam','overlay!','format');
    
    function nextField(&$values, $key) {
      $submitText = 'Next...';
      require_once('../../lib-php/sba_viewer.php');
      switch ($key) {
        case 'template':
          $ff = new selectField_class('Atlas template');
          $ff->setChoices(listTemplates_release('alpha','friendlyNames'),NULL);
          break;
        case 'space':
          $template = $values['template'];
          $values['_config'] = getConfig($template);
          $config = $values['_config'];
          $ff = new selectField_class('Mesh space');
          if (isset($config['meshdata'])) {
            $keys = array_keys($config['meshdata']);
            $ff->setChoices(array_combine($keys,$keys),$keys[0]);
          }          
          break;
        case 'mesh':
          $template = $values['template'];
          $space = $values['space'];
          $config = $values['_config'];
          $meshdata = $config['meshdata'][$space];
          if (isset($meshdata['key'])) {
            $regions = array($meshdata['key']);
          } else {
            $regions = array_keys($meshdata);
          }
          $ff = new selectField_class('Brain region');
          $ff->setChoices(array_combine($regions,$regions),$regions[0]);
          break;
        case 'deform':
          $template = $values['template'];
          $space = $values['space'];
          $region = $values['mesh'];
          $sConfig = getConfig($space);
          $deformations = array();
          if (isset($sConfig['meshes'][$region])) {
            $meshes = $sConfig['meshes'][$region];
            $deformations = array_keys($meshes['deformations']);
          }      
          $ff = new selectField_class('Deformation  ');
          $ff->setChoices(array_combine($deformations,$deformations),$deformations[0]);
          break;
        case 'l2v':
          global $attrs;
          $ff = new textField_class('Map labels to values',$attrs,0,65536);
          break;
        case 'clim':
          $ff = new textField_class('Color axis limits');
          $ff->setDefault('[null,null]');
          break;
        case 'bg':
          $ff = new textField_class('Background color');
          $ff->setDefault('[0,0,0]');
          break;
        case 'width':
          $ff = new textField_class('3d panel width [pixels]');
          $ff->setDefault('800');
          break;
        case 'height':
          $ff = new textField_class('3d panel height [pixels]');
          $ff->setDefault('800');
          break;
        case 'cam':
          global $viewpoints;
          $ff = new selectField_class('Initial view point');
          $ff->setChoices($viewpoints,'L');
          break;
        case 'overlay':
          $ff = new selectField_class('Initial view mode');
          $ff->setChoices(array('none'=>'Show bare brain','labels'=>'Show brain regions','values'=>'Show values mapped to brain regions'),'labels');
          $submitText = 'Open 3D Viewer';
          break;
        case 'format':
          $ff = new selectField_class('Output format');
          $ff->setChoices(array('xhtml'=>'Interactive page','png'=>'Screenshot (png)','mfile'=>'Matlab (m-file)'),'xhtml');
          $submitText = 'Open 3D Viewer';
          break;
        default:
          $ff = new textField_class('Unknown field "'.$key.'"');
      }
      return array($ff,$submitText);
    }
  }

  $wizard = new myWizard_class($_REQUEST);
  list($formFields,$inputs,$errors,$submitText,$doSubmit) = $wizard->getFormAndValues();
  $hasErrors = count($errors);
  if (!$doSubmit || $hasErrors) {
    /*
     * Interactive mode
     */
    if ($rpc) {
      throw new Exception('Not ready to submit; '.$readyToSubmit.' '.json_encode($_REQUEST));
    }
    $submitAction = $scriptUrl = $_SERVER['REQUEST_URI']; // submit reloads page with new form values
    $submitMethod = 'GET';

    require_once(__DIR__.'/../../shared-php/fancysite.php');
    $siteMap = new siteMap_class($info);
    $layout = (new layout_class())->fromSiteMap($siteMap);
    $layout->addHead([
      $layout->script('../shared-js/browser.js'),
      $siteMap->clientScript(),
      $formFields->headSection(),
      $siteMap->windowTitle()
    ]);
    echo $layout->htmlUntilContent();

    echo '<p><form action="'.$submitAction.'" method="'.$submitMethod.'"><table>';
    echo $formFields->formAsTableRows($inputs,$errors);
    $goBackURL = "";
    echo '<tr><td colspan="3"><!--input type="button" value="Previous" onclick="document.location.replace(\''.$goBackURL.'\')"/-->&nbsp;<input type="submit" value="'.$submitText.'"/></td></tr>';
    echo '</table></form></p>';

    if ($hasErrors) {
      echo '<hr/>'.$formFields->errorReport($errors);
    }

    echo $layout->htmlAfterContent();
    exit;
  }

  /*
   * On submit
   */
  if (!$rpc) {
    $msg = ob_get_clean();
    if ($msg) throw new Exception($msg);
  }

  header("Content-Type: application/xhtml+xml;charset=utf-8");

  function insertScene($positions,$centerOfRotation,$faces,$vertices,$labelsIfAny,$colorsIfAny,$bg) {
  echo '<Scene id="X3D_SCENE" pickMode="color">
  <Background id="X3D_BACKGROUND" skyColor="'.join(' ',$bg).'"/>
  <Viewpoint id="X3D_VIEW_L" fieldOfView="0.032725" position="'.$positions[0].'" description="Left" orientation="-0.57735 0.57735 0.57735 -2.0944" centerOfRotation="'.$centerOfRotation.'"/>
  <Viewpoint id="X3D_VIEW_R" fieldOfView="0.032725" position="'.$positions[1].'" description="Right" orientation="0.57735 0.57735 0.57735 2.0944" centerOfRotation="'.$centerOfRotation.'"/>
  <Viewpoint id="X3D_VIEW_P" fieldOfView="0.032725" position="'.$positions[2].'" description="Posterior" orientation="1 0 0 1.571" centerOfRotation="'.$centerOfRotation.'"/>
  <Viewpoint id="X3D_VIEW_A" fieldOfView="0.032725" position="'.$positions[3].'" description="Anterior" orientation="0 0.7071 0.7071 3.1415" centerOfRotation="'.$centerOfRotation.'"/>
  <Viewpoint id="X3D_VIEW_I" fieldOfView="0.032725" position="'.$positions[4].'" description="Inferior" orientation="0.7071 -0.7071  0 3.1415" centerOfRotation="'.$centerOfRotation.'"/>
  <Viewpoint id="X3D_VIEW_S" fieldOfView="0.032725" position="'.$positions[5].'" description="Superior" orientation="0 0 -1 1.571" centerOfRotation="'.$centerOfRotation.'"/>
    <NavigationInfo type="&quot;EXAMINE&quot; &quot;FLY&quot; &quot;ANY&quot;" speed="4" headlight="true"/>
    <DirectionalLight ambientIntensity="1" intensity="0" color="1 1 1"/>
    <Transform DEF="ROOT" translation="0 0 0">
      <Shape>
        <Appearance>
          <Material ambientIntensity="0" emissiveColor="0 0 0" diffuseColor="1 1 1" specularColor="0 0 0" shininess="0.0078125" transparency="0"/>
        </Appearance>
        <IndexedFaceSet id="X3D_SURF" creaseAngle="0.785" solid="false" colorPerVertex="false" normalPerVertex="false" coordIndex="'.$faces.'"'.$labelsIfAny.'>
          <Coordinate point="'.$vertices.'"/>'.$colorsIfAny.'
        </IndexedFaceSet>
      </Shape>
    </Transform>
  </Scene>';
  }

  $template = $inputs['template'];
  $templateFolder = __DIR__.'/../templates/'.$template;
  $tConfig = file_get_contents($templateFolder.'/config.json');
  $tConfig = json_decode($tConfig,TRUE);
  $meshSpace = $inputs['space'];
  $meshRegion = $inputs['mesh'];
  $meshData = $tConfig['meshdata'][$meshSpace][$meshRegion];
  //$meshKey = isset($meshData['key']) ? $meshData['key'] : 'wholebrain';
  $spaceFolder = __DIR__.'/../templates/'.$meshSpace;
  if ($spaceFolder==$templateFolder) {
    $sConfig = $tConfig;
  } else {
    $sConfig = file_get_contents($spaceFolder.'/config.json');
    $sConfig = json_decode($sConfig,TRUE);
  }
  $meshConfig = $sConfig['meshes'][$meshRegion];
  if (isset($inputs['deform'])) {
    $deformation = $meshConfig['deformations'][$inputs['deform']];
  } else {
    $deformation = current($meshConfig['deformations']);
  }
  $x3d_width = json_decode($inputs['width'],true);
  $x3d_height = json_decode($inputs['height'],true);
  $limits = isset($deformation['vertexlimits']) ? $deformation['vertexlimits'] : 'wholebrain_vertexlimits.csv';
  $limits = file_get_contents($spaceFolder.'/meshes/'.$limits);
  $limits = split("\n",$limits);
  foreach ($limits as $k=>&$v) {
    $v = split(',',$v);
  }
  $centerX = 0.5*($limits[1][0]+$limits[0][0]);
  $centerY = 0.5*($limits[1][1]+$limits[0][1]);
  $centerZ = 0.5*($limits[1][2]+$limits[0][2]);
  # width axis: 0 and 1 coordinate
  $distanceW = 32*max($limits[1][0]-$limits[0][0],$limits[1][1]-$limits[0][1])*$x3d_height/$x3d_width;
  #*max($x3d_width,$x3d_height)/$x3d_width;
  # height axis: 0 and 2 coordinate
  $distanceH = 32*max($limits[1][0]-$limits[0][0],$limits[1][2]-$limits[0][2])*$x3d_width/$x3d_height;
  #
  $distance = max($distanceW,$distanceH);
  $positions = [
    join(',',array($centerX-$distance,$centerY,$centerZ)),
    join(',',array($centerX+$distance,$centerY,$centerZ)),
    join(',',array($centerX,$centerY-$distance,$centerZ)),
    join(',',array($centerX,$centerY+$distance,$centerZ)),
    join(',',array($centerX,$centerY,$centerZ-$distance)),
    join(',',array($centerX,$centerY,$centerZ+$distance))
  ];
  $centerOfRotation = join(',',array($centerX,$centerY,$centerZ));
  $verticesFile = isset($deformation['vertices']) ? $deformation['vertices'] : 'wholebrain_vertices.csv';
  $verticesFile = $spaceFolder.'/meshes/'.$verticesFile;
  $vertices = file_get_contents($verticesFile);
  $vertices = str_replace("\n",' ',$vertices);
  $facesFile = isset($deformation['faces']) ? $deformation['faces'] : 'wholebrain_faces.csv';
  $facesFile = $spaceFolder.'/meshes/'.$facesFile;
  $faces = file_get_contents($facesFile);
  $faces = str_replace("\n",' -1 ',$faces);
  $labelsFile = isset($meshData['labels']) ? $meshData['labels'] : 'wholebrain_labels.csv';
  $labelsFile = $templateFolder.'/meshdata/'.$labelsFile;
  $faceLabels_str = file_get_contents($labelsFile);
  $faceLabels_str = str_replace("\n",' ',$faceLabels_str);
  $labelsIfAny = "\n".'colorIndex="'.$faceLabels_str.'"';
  $label2rgbFile = isset($tConfig['colormaps']['labels']) ? $tConfig['colormaps']['labels'] : 'wholebrain_colormap.csv';
  $label2rgbFile = $templateFolder.'/meshdata/'.$label2rgbFile;
  $label2rgb_csv = split("\n",file_get_contents($label2rgbFile));
  // hack to show brain instead of background.
  $label2rgb_csv[0] = '0.9,0.9,0.9';
  $label2rgb_json = '[['.join('],[',$label2rgb_csv).']]';
  $colorsIfAny = "\n".'<Color id="X3D_COLORMAP" color="'.join(',',$label2rgb_csv).'"/>';
  $index2rgb = json_decode(file_get_contents($templateFolder.'/template/index2rgb.json'),TRUE);
  $rgb2index = array_flip($index2rgb);
  $rgb2acrFile = $templateFolder.'/template/rgb2acr.json';
  $rgb2acr_json = file_get_contents($rgb2acrFile);
  $rgb2acr = json_decode($rgb2acr_json,TRUE);
  $index2acr = array();
  foreach ($rgb2index as $rgb=>$index) $index2acr[$index] = $rgb2acr[$rgb];
  $acr2index = array_flip($index2acr);
  $acr2full_json = file_get_contents($templateFolder.'/template/acr2full.json');
  $colormap_json = file_get_contents(__DIR__.'/../colormaps/colormap_mpl2.json');
  $format = $inputs['format'];
  
  if ($format == 'mfile') {
    header("Content-Type: text/plain;charset=utf-8");
    $mfile = file_get_contents('./view3d_l2v.m');
    $scriptUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST'].$_SERVER['SCRIPT_NAME'];
    $mfile = str_replace('$SCRIPT_URL$',$scriptUrl.", with parameters:\n% ".str_replace("\n","\n% ",json_encode($_REQUEST,JSON_PRETTY_PRINT)),$mfile);
    $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST'].dirname(dirname($_SERVER['SCRIPT_NAME']));
    $verticesUrl = $baseUrl.'/'.substr($verticesFile,strpos($verticesFile,'/templates/')+1);
    $mfile = str_replace('$VERTICES_URL$',$verticesUrl,$mfile);
    $facesUrl = $baseUrl.'/'.substr($facesFile,strpos($facesFile,'/templates/')+1);
    $mfile = str_replace('$FACES_URL$',$facesUrl,$mfile);
    $paintUrl = $baseUrl.'/'.substr($labelsFile,strpos($labelsFile,'/templates/')+1);
    $mfile = str_replace('$PAINT_URL$',$paintUrl,$mfile);
    $cmapUrl = $baseUrl.'/'.substr($label2rgbFile,strpos($label2rgbFile,'/templates/')+1);
    $mfile = str_replace('$CMAP_URL$',$cmapUrl,$mfile);
    $rgb2acrUrl = $baseUrl.'/'.substr($rgb2acrFile,strpos($rgb2acrFile,'/templates/')+1);
    $mfile = str_replace('$RGB2ACR_URL$',$rgb2acrUrl,$mfile);
    echo $mfile;
    exit(0);
  }
  ?>

  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel='stylesheet' type='text/css' href='../css/x3dom.css' />
  <script type="text/javascript" src="../js/x3dom.js"></script>
  <!--script type="text/javascript" src="http://x3dom.org/release/x3dom.js"></script-->

  <script type="text/javascript">
  //<![CDATA[
  var g_rgb2acr = <?php echo $rgb2acr_json; ?>;
  var g_acr2index = <?php echo json_encode($acr2index); ?>;
  var g_acr2full = <?php echo $acr2full_json; ?>;
  var g_label2rgb = <?php echo $label2rgb_json; ?>;
  var g_value2rgb = <?php echo $colormap_json; ?>;
  var g_clim = [null,null];
  var g_views = <?php echo json_encode($viewpoints); ?>;
  var g_init = <?php echo json_encode(array('overlay'=>$inputs['overlay'],'cam'=>$inputs['cam'],'format'=>$inputs['format'])); ?>;
  var g_overlay = 'labels';

  function dec2hex(i) {
     return (i+0x100).toString(16).substr(-2).toUpperCase();
  }

  function colorBar(canvasElem,index2rgb) {
    ctx = canvasElem.getContext('2d');

    for (var i in index2rgb) { // fill strokes
      ctx.beginPath();
      ctx.fillStyle = index2rgb[i];
      ctx.fillRect(i * 2, 0, 2, 50);
    }

    canvasElem.onclick = function(e) {
      var x = e.offsetX, // mouse x
          y = e.offsetY, // mouse y
          p = ctx.getImageData(x, y, 1, 1),
          x = p.data; // pixel at mouse (x, y) - contains [r, g, b, a]
      alert('Color: rgb(' + x[0] + ', ' + x[1] + ', ' + x[2] + ')');
    };
  }

  function minmax(map) {
    var mn,mx;
    for (k in map) {
      v = map[k];
      if (mx == undefined) {
        mn = mx = v;
      } else {
        if (v<mn) mn = v;
        if (v>mx) mx = v;
      }
    }
    return [mn,mx];
  }

  function rescale(map,mn,mx,numColors) {
    if (mn==mx) {
      for (k in map) map[k] = numColors-1
    } else for (k in map) {
      v = (map[k]-mn)/(mx-mn);
      if (v<0) v=0;
      if (v>1) v=1;
      map[k] = Math.floor(v*(numColors-1e-8));
    }
    return map;
  }

  function getFirstChild(parent) {
    ch = parent.firstChild;
    while (ch.nodeType!=1) ch=ch.nextSibling;
    return ch;
  }
    
  function replaceSurface(surf,label2value,value2rgb) {
    parentNode = surf.parentNode;
    var oldSurf = surf;
    var surf = oldSurf.cloneNode(true)
    // NOW DO SOMETHING WITH SURF
    parentNode.removeChild(oldSurf);
    parentNode.appendChild(surf);
  }
          
  function activate(event,format) {
    var surf = document.getElementById('X3D_SURF')
    surf.onclick = function(event) {
      var rgb = event.hitPnt;
      var rgbHex = dec2hex(rgb[0])+dec2hex(rgb[1])+dec2hex(rgb[2]);
      if (g_overlay=='labels') {
        var acr = g_rgb2acr[rgbHex];
        var full = g_acr2full[acr];
        document.getElementById('INFO').innerHTML = 'Color '+rgbHex+' corresponds to brain region '+acr+': '+full+'.';
      } else if (g_overlay=='values') {
        var cSelect = undefined
        for (var c in g_value2rgb) {
          var rgb_c = g_value2rgb[c];
          if (rgb_c[0]==rgb[0] && rgb_c[1]==rgb[1] && rgb_c[2]==rgb[2]) { cSelect = c; break }
        }
        var value = undefined;
        if (cSelect != undefined) value = g_clim[0]+cSelect*(g_clim[1]-g_clim[0])/(g_value2rgb.length-1);
        document.getElementById('INFO').innerHTML = 'Color '+rgbHex+' corresponds to colormap index '+cSelect+' with value '+value+'.';
      } else {
        document.getElementById('INFO').innerHTML = 'Color '+rgbHex+'.';
      }
    }
    var nolabels = document.getElementById('NOLABELSBUTTON');
    nolabels.onclick = function(event) {
      var cmapNode = document.getElementById('X3D_COLORMAP');
      var cmap = cmapNode.requestFieldRef('color');
      for (var c=0; c<cmap.length; c++) {
        cmap[c].r = 0.9; cmap[c].g = 0.9; cmap[c].b = 0.9; 
      }
      cmapNode.releaseFieldRef('color');
      g_overlay = 'none';
    }
    var showlabels = document.getElementById('SHOWLABELSBUTTON');
    showlabels.onclick = function(event) {
      var cmapNode = document.getElementById('X3D_COLORMAP');
      var cmap = cmapNode.requestFieldRef('color');
      for (var c=0; c<cmap.length; c++) { cmap[c].r = g_label2rgb[c][0]; cmap[c].g =  g_label2rgb[c][1]; cmap[c].b = g_label2rgb[c][2]; }
      cmapNode.releaseFieldRef('color');
      g_overlay = 'labels';
    }
    var labels2values = document.getElementById('LABELS2VALUES');
    if (labels2values.value == '') labels2values.value = '<?php echo str_replace('\'','\\\'',json_encode($acr2index)); ?>';
    var colormap = document.getElementById('COLORMAP');
    colormap.value = '<?php echo str_replace("\n",'',$colormap_json); ?>';
    //var colorlimits = document.getElementById('COLORLIMITS');
    //colorlimits.value = '[null,null]';
    var showvalues = document.getElementById('SHOWVALUESBUTTON');
    showvalues.onclick = function(event) {
      var acr2value = JSON.parse(document.getElementById('LABELS2VALUES').value);
      g_value2rgb = JSON.parse(document.getElementById('COLORMAP').value);
      var colorLimits = JSON.parse(document.getElementById('COLORLIMITS').value);
      var index2value = [];
      var unmapped = [];
      for (var acr in acr2value) {
        var index = g_acr2index[acr] != undefined ? g_acr2index[acr] : null;
        if (index != undefined) index2value[index] = acr2value[acr];
        else unmapped.push(acr)
      }
      if (unmapped.length) alert('Values for these regions could not be mapped: '+unmapped);
      var mn = colorLimits[0];
      var mx=colorLimits[1];
      if (mn==undefined || mx==undefined) {
        var mm = minmax(acr2value);
        if (mn == undefined) mn = mm[0];
        if (mx == undefined) mx = mm[1];
      }
      g_clim = [mn,mx];
      index2value = rescale(index2value,mn,mx,g_value2rgb.length);
      var cmapNode = document.getElementById('X3D_COLORMAP');
      var cmap = cmapNode.requestFieldRef('color');
      for (var i=0; i<cmap.length; i++) {
        var rgb = (index2value[i] != undefined ? g_value2rgb[index2value[i]] : [200,200,200]);
        cmap[i].r = rgb[0]/255.0; cmap[i].g = rgb[1]/255.0; cmap[i].b = rgb[2]/255.0; 
      }
      cmapNode.releaseFieldRef('color');
      g_overlay = 'values';
      //var surfaceNode = document.getElementById('X3D_SURF');
      //replaceSurface(surfaceNode,label2value,label2rgb);
    }
    var bgcolorButton = document.getElementById('BGCOLORBUTTON');
    bgcolorButton.onclick = function(event) {
      var rgb = JSON.parse(document.getElementById('BGCOLOR').value);
      bgNode = document.getElementById('X3D_BACKGROUND');
      skyColor = bgNode.requestFieldRef('skyColor');
      skyColor[0].r = rgb[0]/255;
      skyColor[0].g = rgb[1]/255;
      skyColor[0].b = rgb[2]/255;
      bgNode.releaseFieldRef('skyColor');
    }
    for (var i=0; i<1; i++) {
      var button = document.getElementById('SCREENSHOTBUTTON_'+i);
      button.onclick = function(event) {
        var i = this.id.substr(-1);
        var x3d = document.getElementById("X3D_ROOT");
        var img = x3d.runtime.getScreenshot();
        document.getElementById('SCREENSHOT_'+i).src = img;
      }
    }
    for (var ch in g_views) {
      var button = document.getElementById('VIEWBUTTON_'+ch);
      button.onclick = function(event) {
        var ch = this.id.substr(-1);
        document.getElementById('X3D_VIEW_'+ch).setAttribute('bind','true');
      }
    }
    
    if (g_init['overlay'] == 'none') nolabels.onclick();
    if (g_init['overlay'] == 'values') showvalues.onclick();
    if (g_init['cam'] != '') {
      var button = document.getElementById('VIEWBUTTON_'+g_init['cam']);
      button.onclick();
    }
    
    if (format=='png') {
      var x3d = document.getElementById("X3D_ROOT");
      var img = x3d.runtime.getScreenshot();
      window.location = img;
    }
  }
  
  // GOOGLE ANALYTICS
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount','UA-18298640-1']);
  _gaq.push(['_trackPageview']);
  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://www.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
  //]]>
  </script>
  </head>
  <body onload="activate(event,'<?php echo $format; ?>')">
  <div id="INFO">Click on a color to see what it maps to.</div>
  <div>
  <?php
  $label2value = json_decode($inputs['l2v'],true);
  $clim = json_decode($inputs['clim'],true);
  $bg = json_decode($inputs['bg'],true);
  echo '<X3D id="X3D_ROOT" width="'.$x3d_width.'px" height="'.$x3d_height.'px" profile="Interchange" version="3.2" xmlns:xsd="http://www.w3.org/2001/XMLSchema-instance" xsd:noNamespaceSchemaLocation="http://www.web3d.org/specifications/x3d-3.2.xsd">';
  insertScene($positions,$centerOfRotation,$faces,$vertices,$labelsIfAny,$colorsIfAny,$bg);
  echo '</X3D>';
  ?>
  
  </div>
  <table><tr><td>
    <input id="NOLABELSBUTTON" type="button" value="No labels" style=""/><br/>
    <input id="SHOWLABELSBUTTON" type="button" value="Show labels" style=""/><br/>
    Map labels to values: <br/>
    <input id="LABELS2VALUES" type="text" value="<?php echo htmlspecialchars($inputs['l2v']) ?>" style=""/><br/>
    Use colormap:<br/>
    <input id="COLORMAP" type="text" value="" style=""/><br/>
    Color axis limits:<br/>
    <input id="COLORLIMITS" type="text" value="<?php echo htmlspecialchars($inputs['clim']) ?>" style=""/><br/>
    <input id="SHOWVALUESBUTTON" type="button" value="Show values" style=""/><br/>
    Background color:<br/>
    <input id="BGCOLOR" type="text" value="<?php echo htmlspecialchars($inputs['bg']) ?>" style=""/><br/>
    <input id="BGCOLORBUTTON" type="button" value="Apply background color" style=""/><br/>
    <br/>
  </td></tr><tr><td>
    <input id="VIEWBUTTON_L" type="button" value="Left view" style=""/><br/>
    <input id="VIEWBUTTON_R" type="button" value="Right view" style=""/><br/>
    <input id="VIEWBUTTON_P" type="button" value="Posterior view" style=""/><br/>
    <input id="VIEWBUTTON_A" type="button" value="Anterior view" style=""/><br/>
    <input id="VIEWBUTTON_I" type="button" value="Inferior view" style=""/><br/>
    <input id="VIEWBUTTON_S" type="button" value="Superior view" style=""/><br/>
    <br/>
  </td></tr><tr><td>
    <input id="SCREENSHOTBUTTON_0" type="button" value="Screenshot" style=""/><br/>
    <img id="SCREENSHOT_0" style="height: 200px; width: 200px" alt="Screenshot will appear here"/>
    <br/>(use [right-click] Save Image As... to save the image)
    <br/>
  </td></tr><tr><td>
    <a href="?template=<?php echo $template; ?>">Advanced options</a>
    <br/>(other surfaces, Matlab export)
  </td></tr>
  </table>
  </body>
  </html>

<?php
} catch (Exception $e) {
  $ans = array('error'=>array('message'=>$e->getMessage()));
  formatAs_jsonHeaders();
  ob_end_clean();
  echo json_encode($ans);
}
?>
