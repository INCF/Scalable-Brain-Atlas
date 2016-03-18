<?php
$info = json_decode(
<<<SITEMAP
{
  "path": "Scalable Brain Atlas|services|label index mapper",
  "title": "Map label indices to region names.",
  "description": "Generates a map from label indices to region acronym, full name, or rgb-value."
}
SITEMAP
,TRUE);

$rpc = (@$_REQUEST['rpc'] !== NULL);
ini_set('display_errors',1);
session_start();
ob_start();
require_once(__DIR__.'/../../shared-php/formatAs.php');
require_once(__DIR__.'/../../lib-php/wizard.php');
try {
  // global variables
  $viewpoints = array('L'=>'Left','R'=>'Right','P'=>'Posterior','A'=>'Anterior','I'=>'Inferior','S'=>'Superior');
  $attrs = array('size'=>40);

  class myWizard_class extends wizard_class {
    public $keyChain = array('template!','to!','format!');
    
    function nextField(&$values, $key) {
      $submitText = 'Next...';
      require_once('../../lib-php/sba_viewer.php');
      switch ($key) {
        case 'template':
          $ff = new selectField_class('Atlas template');
          $ff->setChoices(listTemplates_release('alpha','friendlyNames'),NULL);
          break;
        case 'to':
          $ff = new selectField_class('Map index to');
          $ff->setChoices(array('rgb'=>'RGB value','acr'=>'region acronym','full'=>'full name'),'acr');
          break;
        case 'format':
          $ff = new selectField_class('Output format');
          $ff->setChoices(array('json'=>'json','cell'=>'matlab cell array'),'json');
          $submitText = 'Show result';
          break;
        default:
          $ff = new textField_class('Unknown field "'.$key.'"');
      }
      return array($ff,$submitText);
    }
  }

  $wizard = new myWizard_class($_REQUEST);
  list($formFields,$inputs,$errors,$submitText,$doSubmit) = $wizard->getFormAndValues();
  $errors = $doSubmit ? $errors : array();
  if (!$doSubmit || $errors) {
    /*
     * Interactive mode
     */
    if ($rpc) {
      throw new Exception('Not ready to submit; '.$readyToSubmit.' '.json_encode($_REQUEST));
    }
    $submitAction = $scriptUrl = $_SERVER['REQUEST_URI']; // submit reloads page with new form values
    $submitMethod = 'GET';

    require_once('../../shared-php/fancysite.php');
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

    if ($errors) {
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

  $template = $inputs['template'];
  $atlasFolder = __DIR__.'/../templates/'.$template;
  $index2rgb = json_decode(
    file_get_contents($atlasFolder.'/template/index2rgb.json'),
    TRUE
  );
  $map = $inputs['to'];
  if ($map != 'rgb') {
    $rgb2acr = json_decode(
      file_get_contents($atlasFolder.'/template/rgb2acr.json'),
      TRUE
    );
    if ($map == 'full') {
      $acr2full = json_decode(
        file_get_contents($atlasFolder.'/template/acr2full.json'),
        TRUE
      );
    }
  }
  $index2label = $index2rgb;
  foreach ($index2rgb as $i=>$rgb) {
    $label = $rgb2acr[$rgb];
    $index2label[$i] = ($map == 'full' ? $acr2full[$label] : $label);
  }
  if ($inputs['format'] == 'cell') {
    formatAs_textHeaders();
    echo "% Note that indices in the nifti label file start at zero, while indices in Matlab start at one.\n";
    echo "% Therefore, assign the cell array below to variable 'label2".$map."' in Matlab,\n";
    echo "% and retrieve the ".$formFields->fields['to']->choices[$map]." of label i as: label2".$map."{i+1}.\n\n";
    $cell = array();
    $maxIndex = max(array_keys($index2label));
    for ($i=0; $i<=$maxIndex; $i++) {
      $cell[] = (isset($index2label[$i]) ? $index2label[$i] : '?');
    }
    echo "{\n'".join("',\n'",$cell)."'\n}";
  } else {
    formatAs_jsonHeaders();
    echo formatAs_prettyJson($index2label);
  }
} catch (Exception $e) {
  $ans = array('error'=>array('message'=>$e->getMessage()));
  formatAs_jsonHeaders();
  ob_end_clean();
  echo json_encode($ans);
}
?>
