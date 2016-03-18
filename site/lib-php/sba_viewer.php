<?php
function fixDecimals($v,$d) {
  $f = pow(10,$d);
  return 1.0/$f*round($f*$v);
}

/*
function listSpaces($mode=NULL) {
  $scriptfile = str_replace('\\','/',__FILE__);
  $spacesFolder = str_replace('www/lib/sba_viewer.php','/spaces',$scriptfile);
  $spaces = array();
  if (is_dir($spacesFolder)) {
		if ($dh = opendir($spacesFolder)) {
			while (($space = readdir($dh)) !== false) {
  	    $full = $spacesFolder.'/'.$space;
        if (is_dir($full) && $space[0] != '.') {
				  $spaces[] = $space;
        }
			}
			closedir($dh);
		}
  }
  if ($mode == 'friendlyNames') {
    $spaces = array_combine($spaces,$spaces);
  }  
  return $spaces;
}
*/

function listTemplates($mode=NULL) {
  $publicOnly = !isset($_REQUEST['superuser']);
  $notPublic = array();
  $scriptfile = str_replace('\\','/',__FILE__);
  $templatesFolder = str_replace('/lib/sba_viewer.php','/templates',$scriptfile);
  $templates = array();
  if (is_dir($templatesFolder)) {
		if ($dh = opendir($templatesFolder)) {
			while (($template = readdir($dh)) !== false) {
			  $fullTemplate = $templatesFolder.'/'.$template;
				if (is_dir($fullTemplate) && is_file($fullTemplate.'/config.json')) {
			    if ($publicOnly && @$notPublic[$template]) {}
			    else $templates[] = $template;
				}
			}
			closedir($dh);
		}
    if ($mode == 'friendlyNames') {
      $templates = array_combine($templates,$templates);
      foreach ($templates as $k=>&$v) {
        $config = @file_get_contents($templatesFolder.'/'.$k.'/config.json');
        if (isset($config)) {
          $config = json_decode($config,TRUE);
          $templateName = isset($config['templateName']) ? $config['templateName'] : $v;
          $v = $config['species'].' - '.$k.' ('.$templateName.')';
        }
      }
      asort($templates);
    }
  }
  return $templates;
}

// new listTemplates function, with minimal release (quality) threshold
function listTemplates_release($releaseThresh='beta',$friendlyNames = FALSE) {
  $releaseCodes = array('alpha'=>0,'beta'=>1,'stable'=>3,'final'=>4,'hidden'=>-1);
  $minRelease = isset($releaseCodes[$releaseThresh]) ? $releaseCodes[$releaseThresh] : 1;
  $scriptpath = dirname(__FILE__);
  $templatesFolder = realpath($scriptpath.'/../templates');
  $templates = array();
  if (is_dir($templatesFolder)) {
		if ($dh = opendir($templatesFolder)) {
			while (($template = readdir($dh)) !== false) {
			  $fullTemplate = $templatesFolder.'/'.$template;
				if (is_dir($fullTemplate) && is_file($fullTemplate.'/config.json')) {
          $config = json_decode(file_get_contents($fullTemplate.'/config.json'),TRUE);
          if ($config) {
            $release = isset($config['release']) ? $config['release'] : 'beta';
            $releaseCode = isset($releaseCodes[$release]) ? $releaseCodes[$release] : 1;
            if ($releaseCode>=$minRelease) {
              if ($friendlyNames) {
                $species = isset($config['species']) ? $config['species'] : 'unknown';
                $templateName = isset($config['templateName']) ? $config['templateName'] : $template;
                $v = $species.' - '.$template.' ('.$templateName.')';
                $templates[$template] = $v;
              } else {
                $templates[] = $template;
              }
            }
          }
				}
			}
			closedir($dh);
		}
  }
  return $templates;
}

function addChildren($acr,$acrChildren,$level=0, &$acrList=0) {
  if (!$level>10) return;
  if ($level==0) $acrList = array($acr=>1);
  $ch = @$acrChildren[$acr];
  if (isset($ch) && $level<10) {
    foreach($ch as $c) {    
      if (!isset($acrList[$c])) {
        $acrList[$c] = 1;
        addChildren($c,$acrChildren,$level+1, $acrList);
      }
    }
  }
  if ($level==0) return array_keys($acrList);
}

function findAcrForGivenRegion($region,$rgb2acr,$acr2parent,$alias2acr=undefined) {
  // a valid acronym has an rgb value and/or children
  $validAcronyms = array_merge(array_values($rgb2acr),array_values($acr2parent));
  // first try case-sensitive match
  $acr2acr = array_combine($validAcronyms,$validAcronyms);
  $acr = NULL;
  if (isset($acr2acr[$region])) {
    $acr = $acr2acr[$region];
  } else {
    // then check alias-acronyms
    $alias = $region;
    if (isset($alias2acr[$alias])) {
      $acr = $alias2acr[$alias];
    } else {
      // then check case-insensitive match
      $acr_lc2acr = array_change_key_case($acr2acr,CASE_LOWER);
      $region_lc = strtolower($region);
      if (isset($acr_lc2acr[$region_lc])) {
        $acr = $acr_lc2acr[$region_lc];
      } elseif (isset($alias2acr)) {
        // finally check case-insensitive alias-acronyms
        $alias_lc2acr = array_change_key_case($alias2acr,CASE_LOWER);
        $alias_lc = strtolower($alias);
        if (isset($alias_lc2acr[$alias_lc])) $acr = $alias_lc2acr[$alias_lc];
      }
    }
  }
  return $acr;
}

function getRgbList($acr,$rgb2acr,$acr2parent,$acr2rgb=null) {
  if (!isset($acr)) return array();
  if (!isset($acr2rgb)) $acr2rgb = array_flip($rgb2acr);
  $acrChildren = array();
  foreach($acr2parent as $a=>$p) $acrChildren[$p][] = $a;
  $acrList = addChildren($acr,$acrChildren);
  $rgbList = array();
  foreach($acrList as $a) {
    $r = @$acr2rgb[$a]; 
    if (isset($r)) $rgbList[] = $r;
  }
  return $rgbList;
}

function getMiddleSlice($rgbList,$brainRegions,$brainSlices) {
  $slices = array();
  foreach ($rgbList as $r) {
    if (isset($brainRegions[$r])) {
      $sData = $brainRegions[$r];
      foreach ($sData as $s=>$dummy) { $slices[$s] = 1; }
    }
  }
  // if none of the slices shows the structure, then return the middle slice of all slices
  if (count($slices)) $slices = array_keys($slices);
  else $slices = array_keys($brainSlices);
  sort($slices);
  return $slices[round(count($slices)/2-0.25)];
}

function view2d_innerSVG($s0,$rgbSelect,$brainSlices,$svgPaths,$strokeWidthPx=2) {
  $colorByRGB = ($rgbSelect == 'RGB');
  $sData = @$brainSlices[$s0];
  if (!isset($sData)) throw new Exception('slice '.($s0+1).' out of range');
  if (!$colorByRGB) {
    $classNames = array();
    foreach ($rgbSelect as $rgb) $classNames[$rgb] = 1;
  }
  $a = '';
  foreach($sData as $r=>$rData) {
    if ($colorByRGB) {
      $c = ' fill="#'.$r.'" stroke="#'.$r.'" stroke-width="0px" stroke-antialiasing="false"';
    } else {
      $c = $classNames[$r];
      $c = isset($c) ? ' fill="#F00" stroke="#F99" stroke-width="'.$strokeWidthPx.'px"' : ' fill="#606055" stroke="#FFF" stroke-width="'.$strokeWidthPx.'px"';    
    }
    foreach ($rData as $d) {
      $path = $svgPaths[$d];
      if (substr($path,0,1) != 'M') $tagStart = '<polygon points="';
      else $tagStart = '<path d="';
      $a .= $tagStart.$path.'"'.$c.'/>';
    }
  }
  $a .= '<g id="highlightRegion2d"></g>';
  return $a;
}

function view3d_innerSVG($rgbSelect,$brainSlices,$svgPaths,$hulls,$config,$pxHeight,$pxWidth,$pxStrokeWidth=2,$sSelect=null) {
  $posteriorSliceView = ($config['sliceCoordSystem'] == 'RAS');

  $bb = $config['boundingBox'];
  $aspectRatio = $bb[2]/$bb[3];
  $numSlices = count($brainSlices);

  // positioning 3d
  $svgHeight = $bb[3];
  $svgPerPx = $svgHeight/$pxHeight;

  // default slice spacing: fit in available viewport width
  $pxSliceSpacing = $pxWidth/($numSlices-1+10);
  $bothHemispheres = ($aspectRatio>=0.9);
  $pxWidthSlice = $pxHeight*$aspectRatio*($bothHemispheres ? 0.5 : 1);
  $pxWidthSlice *= (isset($config['sliceSpacing']) ? $config['sliceSpacing'] : 105)/100;
  $sineAngle = 10*$pxSliceSpacing/$pxWidthSlice;
  $sliceSpacing = round($pxSliceSpacing*$svgPerPx);
  $strokeWidth = $pxStrokeWidth*$svgPerPx;

  // get first and last key of brainSlices array
  reset($brainSlices);
  $sliceStart = key($brainSlices);
  end($brainSlices);
  $sliceEnd = key($brainSlices);
  // convert rgbSelect to hash-table
  $rgbMap = array_combine($rgbSelect,array_keys($rgbSelect));
  // generate SVG
  $sMin = ($bothHemispheres ? 6 : 1);
  // x-coordinate at 0 mm
  $x0 = mm2svg(0,0,$config);
  $x0 = round($x0[0]);
  $svgSlices = array();
  for ($s=$sliceEnd; $s>=$sliceStart; $s--) {
    $a = '<g transform="translate('.(($s-$sMin)*$sliceSpacing).',0) scale('.($sineAngle).',1)">';
    if ($posteriorSliceView) {
      $a .= '<g transform="translate('.$bb[2].') scale(-1,1)">';
    }
    if ($bothHemispheres) {
      if ($posteriorSliceView) $a .= '<clipPath id="VIEW3D_LR"><rect x="'.(0).'" width="'.($x0).'" height="'.($bb[3]).'"/></clipPath>';
      else $a .= '<clipPath id="VIEW3D_LR"><rect x="'.($x0).'" width="'.($bb[2]).'" height="'.($bb[3]).'"/></clipPath>';
    }
    if (isset($hulls)) {
      $style = ($s===$sSelect ? 'fill="#FEB" fill-opacity="0.65" stroke="#00F" stroke-width="'.(4*$strokeWidth).'px"' : 'fill="none" stroke="#CCD" stroke-width="'.($strokeWidth).'px"');
      $a .= '<path '.$style.' d="'.$hulls[$s].'"/>';
    }
    if ($s % 10 == 1) {
      $a .= '<g id="slice_3d_'.$s.'" class="slice_3d">';
      $sData =$brainSlices[$s];
      if (isset($sData)) foreach ($sData as $r=>$rData) {
        foreach ($rData as $i=>$p) {
          $a .= '<path d="'.$svgPaths[$p].'" fill="#606055" stroke="#FFF" stroke-width="'.$strokeWidth.'px"'.($bothHemispheres ? ' clip-path="url(#VIEW3D_LR)"' : '').'/>';
        }
      }
      $a .= '</g>';
    }
    $a .= '<g id="highlight_'.$s.'">';
    $sData = $brainSlices[$s];
    if (isset($sData)) foreach ($sData as $r=>$rData) {
      if (isset($rgbMap[$r])) {
        foreach ($rData as $i=>$p) {
          $a .= '<path d="'.$svgPaths[$p].'" fill="#F00" stroke="#F99" stroke-width="'.$strokeWidth.'px"/>';
        }
      }
    }
    if ($posteriorSliceView) {
      $a .= '</g>';
    }
    $a .= '</g></g>';
    $svgSlices[] = $a;
  }
  return implode('',$svgSlices);
}

function generateSvg2d($s0,$rgbSelect,$brainSlices,$svgPaths,$size,$config=array()) {
  $imgHeight = 1024;
  $colorByRGB = ($rgbSelect == 'RGB');
  if ($colorByRGB) {
    $scaleBy = ($size == 'S' ? 0.25 : ($size == 'M' ? 0.5 : 1));
    $shapeRendering = 'crispEdges';
  } else {
    $scaleBy = ($size == 'S' ? 0.5 : 0.75)/3;
    $shapeRendering = 'geometricPrecision';
  }
  $bb = $config['boundingBox'];
  $imgWidth = $imgHeight*($bb[2]/$bb[3]);
  $strokeWidth = 0.003*$bb[2];
  $a = '<svg class="slice2d" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="none" style="shape-rendering:'.$shapeRendering.'; text-rendering:geometricPrecision; fill-rule:evenodd" width="'.round($imgWidth*$scaleBy).'px" height="'.round($imgHeight*$scaleBy).'px" viewBox="'.implode(' ',$bb).'">';
  $a .= view2d_innerSVG($s0,$rgbSelect,$brainSlices,$svgPaths,$strokeWidth);
  $a .= '</svg>';
  return $a;
}

function generateSvg3d($rgbSelect,$brainSlices,$svgPaths,$hulls,$size,$config=array(),$sSelect=NULL) {
  $scaleBy = ($size == 'S' ? 0.5 : 0.75);
  $height3d = 300;  // arbitrary height in px
  $width3d = 3*$height3d; // in case of a fixed width/height ratio
  $bb = $config['boundingBox'];
  $ppx = $bb[3]/$height3d;
  
  $a = '<svg class="slice3d" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="none" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; fill-rule:evenodd; overflow: hidden" width="'.round($width3d*$scaleBy).'px" height="'.round($height3d*$scaleBy).'px" viewBox="0 0 '.round($width3d*$ppx).' '.round($height3d*$ppx).'">';

  
/*
  // nominal slice spacing: based on stereotaxic coordinates
  if (SLICE_POS != undefined) {
    var mmLeftTop = this.svg2mm([0,config.boundingBox[1]]);
    var mmRightBottom = this.svg2mm([0,config.boundingBox[1]+config.boundingBox[3]]);
    var mmHeight = Math.abs(mmLeftTop[1]-mmRightBottom[1]);
    var iCenter = Math.floor(SLICE_POS.length-0.25);
    var mmSpacing = Math.abs(SLICE_POS[iCenter]-SLICE_POS[iCenter-1]);
    this.nominalSliceSpacing = svgHeight*mmSpacing/mmHeight;
  } else {
    var svgHeight = config.boundingBox[3];
    this.nominalSliceSpacing = svgHeight/count($brainSlices)/10; // rather arbitrary value
  }

  $sliceHeightInch = isset($config['heightInch']) ? $config['heightInch'] : 11.6929;
  $bb = isset($config['boundingBox']) ? $config['boundingBox'] : array(0,0,8268,11693);
  $sliceWidthInch = $sliceHeightInch*($bb[2]/$bb[3]);
  $strokeWidthPx = 0.003*$bb[2];
  $ppi = $bb[3]/$sliceHeightInch;
  // compute width and height in inches
  $sliceWidthScaleBy = 0.25;
  end($brainSlices);
  $numSlices = key($brainSlices);
  $sliceSpacing = $sliceWidthInch*$sliceWidthScaleBy/10*$ppi;
  $widthInch = $sliceWidthInch*$sliceWidthScaleBy+$numSlices*$sliceSpacing/$ppi;
  $heightInch = $sliceHeightInch;
*/
  $strokeWidth = 2;
  $a .= view3d_innerSVG($rgbSelect,$brainSlices,$svgPaths,$hulls,$config,$height3d,$width3d,$strokeWidth,$sSelect);
  $a .= '</svg>';
  return $a;
}

function generateSvg2d3d($s0,$rgbSelect,$brainSlices,$svgPaths,$hulls,$size,$config=array()) {
  $scaleBy = ($size == 'S' ? 0.5 : 0.75);
  $height3d = 300;  // arbitrary height in px
  $width3d = 3*$height3d; // in case of a fixed width/height ratio
  $bb = $config['boundingBox'];
  $ppx = $bb[3]/$height3d;

/*
  $scaleBy = ($size == 'S' ? 0.5 : 0.75)/3;
  $dpi = 72;
  $sliceHeightInch = isset($config['heightInch']) ? $config['heightInch'] : 11.6929;
  $bb = isset($config['boundingBox']) ? $config['boundingBox'] : array(0,0,8268,11693);
  $sliceWidthInch = $sliceHeightInch*($bb[2]/$bb[3]);
  $strokeWidthPx = 0.003*$bb[2];
  $ppi = $bb[3]/$sliceHeightInch;
  // compute width and height in inches
  $sliceWidthScaleBy = 0.25;
  end($brainSlices);
  $numSlices = key($brainSlices);
  $sliceSpacing = $sliceWidthInch*$sliceWidthScaleBy/10*$ppi;
  $widthInch = $sliceWidthInch*1.1 + $sliceWidthInch*$sliceWidthScaleBy+$numSlices*$sliceSpacing/$ppi;
  $heightInch = $sliceHeightInch;
*/

  $strokeWidth = 2;
  $a = '<svg class="slice3d" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="none" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; fill-rule:evenodd; overflow: hidden" width="'.(($width3d+$bb[2]/$ppx)*$scaleBy).'px" height="'.($height3d*$scaleBy).'px" viewBox="0 0 '.($width3d*$ppx+$bb[2]).' '.($height3d*$ppx).'">';
  $a .= '<g transform="translate('.(-$bb[0]).','.(-$bb[1]).'">'.view2d_innerSVG($s0,$rgbSelect,$brainSlices,$svgPaths,$strokeWidth).'</g>';
  $a .= '<g transform="translate('.($bb[2]).',0)">'.view3d_innerSVG($rgbSelect,$brainSlices,$svgPaths,$hulls,$config,$height3d,$width3d,$strokeWidth,$s0).'</g>';
  $a .= '</svg>';
  return $a;
}

function private_v2mm($v_cf0,$dcf,$vLim) {
	$xyCoordFrac = ($v_cf0)/$dcf;
	return $vLim[0]+$xyCoordFrac*($vLim[1]-$vLim[0]);
}

function svg2mm($xSvg,$ySvg,$config) {
  $cf = $config['sliceCoordFrame'];
  $xMm = private_v2mm($xSvg-$cf[0],$cf[2],$config['sliceXLim']);
  // use 1-y because svg is defined top 0
  $yMm = private_v2mm($cf[3]-($ySvg-$cf[1]),$cf[3],$config['sliceYLim']);
  return array($xMm,$yMm);
}

function mm2svg($xMm,$yMm,$config) {	
  $xLim = $config['sliceXLim'];
  $yLim = $config['sliceYLim'];
  $xCoordFrac = ($xMm-$xLim[0])/($xLim[1]-$xLim[0]);
  $yCoordFrac = ($yMm-$yLim[0])/($yLim[1]-$yLim[0]);
  // xy-origin is not top-left but lower-left corner
  $yCoordFrac = 1-$yCoordFrac;
  $cf = $config['sliceCoordFrame'];
  return array($cf[0]+$xCoordFrac*$cf[2],$cf[1]+$yCoordFrac*$cf[3]);
}

function rgbslice($template,$s0,$size,$nocache=FALSE) {
  // update cached image, if necessary
  $thumbnail_name = $template.'_slice'.($s0+1).$size;
  $scriptfolder = __DIR__;  
  $svgfile = str_replace('lib','cache/'.$thumbnail_name.'.svg',$scriptfolder);
  $pngfile = str_replace('.svg','.png',$svgfile);
  $lastmodified_cache = @filemtime($pngfile);
  $lastmodified_script = @filemtime($scriptfile);
  if (!$lastmodified_cache || $lastmodified_cache < $lastmodified_script || $nocache) {
    $templatePath = '../templates/'.$template;

    $SVG_PATHS = json_decode(file_get_contents($templatePath.'/template/svgpaths.json'),true);
    $BRAIN_SLICES = json_decode(file_get_contents($templatePath.'/template/brainslices.json'),true);
    $CONFIG = json_decode(file_get_contents($templatePath.'/config.json'),true);

    // generate svg
    try {
      $svg = @generateSvg2d($s0,'RGB',$BRAIN_SLICES,$SVG_PATHS,$size,$CONFIG);
    } catch(Exception $e) {
      echo 'Error: '.$e->getMessage()."\n";
      return;
    }

    // save svg to cache
    file_put_contents($svgfile,$svg);

    if (0) {
      // Problem with this API: can't turn off anti-aliasing, even though SVG has shape-rendering: crispEdges
      // load svg into Imagick
      $im = new Imagick($svgfile);

      // save svg as png
      $im->setImageColorSpace(imagick::COLORSPACE_RGB);
      $im->setImageDepth(8);
      $im->setImageRenderingIntent(imagick::RENDERINGINTENT_ABSOLUTE);
      $im->setImageCompressionQuality(100);
      $im->writeImage($pngfile);
      $im->destroy();
    }
    exec('convert +antialias "'.$svgfile.'" "'.$pngfile.'"');
  }
  return $pngfile;
}

// find the index of the list member that has a value closest to target.
function findNearest($target,$list) {
  $len = @count($list);
  if (!$len) return NULL;
  sort($list);
  $iMin = 0;
  $iMax = $len-1;
  $i = $iMin;
  $valMin = $list[$iMin];
  $valMax = $list[$iMax];
  if ($valMin==$valMax) return $i;
  // iterate using first derivative
  $val = $valMin;
  $iter = 0;
  while ($iter<100) {
    if (($iMax-$iMin)*($target-$val)==0) break;
    $step = round(($iMax-$iMin)*($target-$val)/($valMax-$valMin));
    $i += $step;
    if ($i>$iMax) $i = $iMax;
    if ($i<$iMin) $i = $iMin;
    $val = $list[$i];
    if ($val>$target) { $iMax = $i; $valMax = $val; }
    else { $iMin = $i; $valMin = $val; }
    $iter++;
  }
  return $i;
}

?>
