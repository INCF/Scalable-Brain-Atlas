browser.include_script_once('../js/dragdiv.js');

function landmarksPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.template = sbaViewer.template;
  if (this.template == 'PLCJB14') {
    this.modalities = {
      'T2*':[0,"#AF0",true]
    }
    this.landmarks = this.landmarks_PLCJB14;
  } else {
    this.modalities = {
      'T1':[0,"#FA0",true],
      'T2':[3,"#0DF",true],
      'T2*':[6,"#AF0",true]
    };
    this.landmarks = this.landmarks_hires;
  }
  this.niceName = 'Landmarks';
}
landmarksPlugin_class.prototype = new sbaPlugin_class();

/*
// version 1
landmarksPlugin_class.prototype.landmarks_lores = {
"CM"  :[102,129, 57,102,128, 57,101,129, 57],
"CM1" :[ 93,132, 57, 93,132, 57, 93,132, 57],
"PAG3":[  0,  0,  0, 72,126,175, 71,127,171],
"KM"  :[ 29,127,207, 29,127,208, 29,129,207],
"HM1" :[  0,  0,  0, 68,127,226, 64,128,221],
"HL1" :[  0,  0,  0, 45, 92,226, 44, 92,221],
"HR1" :[  0,  0,  0, 45,159,226, 44,160,221],
"IP"  :[131,128,192,131,128,192,128,129,193],
"IPL" :[133,116,192,134,117,192,134,119,193],
"IPR" :[133,141,192,134,140,192,134,140,193],
"VM1" :[112,128,278,110,128,279,114,129,280],
"FM1" :[ 97,130,316, 96,129,317, 98,131,316],
"FL2" :[101,120,316,100,117,317,102,119,316],
"FR2" :[102,140,316,100,141,317,102,143,316],
"AC": [255-(257/2-0.2),(251/2-0.2)+3,(558/2-0.2)+1,255-(257/2-0.2),(251/2-0.2)+3,(558/2-0.2)+1,255-(257/2-0.2),(251/2-0.2)+3,(558/2-0.2)+1]
};
*/

/*
// version 2
landmarksPlugin_class.prototype.landmarks_hires = {
"CM":  [206,250,112,206,252,112,207,251,112],
"CM1": [187,258,112,186,258,112,187,258,112],
"PAG3":[  0,  0,  0,144,249,341,143,246,342],
"KM":  [ 60,249,415, 60,252,412, 62,247,417],
"PM":  [286,251,378,286,252,378,287,250,381],
"PL":  [291,194,378,293,196,378,294,194,381],
"PR":  [292,304,378,294,306,378,294,303,381],
"HM1": [  0,  0,  0,131,251,441,135,248,449],
"HL1": [  0,  0,  0, 95,184,441, 95,185,449],
"HR1": [  0,  0,  0, 94,319,441, 93,311,449],
"IP":  [261,251,382,258,254,384,262,250,382],
"IPL": [269,228,382,270,233,384,270,228,382],
"IPR": [268,276,382,270,276,384,270,275,382],
"CCM": [138,250,527,148,252,528,138,250,527],
"VM1": [222,253,555,226,252,557,221,250,557],
"FM1": [194,253,632,196,255,631,197,252,633],
"FL2": [203,233,632,209,232,631,202,232,633],
"FR2": [204,274,632,208,280,631,202,274,633],
"AC":  [512-257,251+1,558+1,512-257,251+1,558+1,512-257,251+1,558+1]
}
*/

// version 3
landmarksPlugin_class.prototype.landmarks_hires = {
"CM":  [206,250,112,206,252,112,207,251,112],
"CM1": [187,258,112,186,258,112,187,258,112],
"PAG3":[ -1, -1, -1,144,249,341,143,246,342],
"KM":  [ 60,249,415, 60,252,412, 62,247,417],
"PM":  [286,251,378,286,252,378,287,250,381],
//"PL":  [291,194,378,293,196,378,294,194,381],
//"PR":  [292,304,378,294,306,378,294,303,381],
//"HM1": [ -1, -1, -1,131,251,441,135,248,449],
"HM1": [135,248,449,136,250,449,135,248,449],       
//"HL1": [ -1, -1, -1, 95,184,441, 95,185,449],
//"HR1": [ -1, -1, -1, 94,319,441, 93,311,449],
"IP":  [261,251,382,258,254,384,262,250,382],
"IPL": [269,228,382,270,233,384,270,228,382],
"IPR": [268,276,382,270,276,384,270,275,382],
"CCM": [138,250,527,148,252,528,138,250,527],
"VM1": [222,253,555,226,252,557,221,250,557],
"ACL": [267,209,573,269,209,575,272,203,575],
"ACR": [268,301,573,269,302,575,270,299,575],
"FM1": [194,253,632,196,255,631,197,252,633],
"FL2": [203,233,632,209,232,631,202,232,633],
"FR2": [204,274,632,208,280,631,202,274,633],
"AC":  [512-257,251+1,558+1,512-257,251+1,558+1,512-257,251+1,558+1]
}

landmarksPlugin_class.prototype.landmarks_PLCJB14 = {
"CM":   [245,229,277],
"CM1":  [244,229,299],
"PAG3": [245,448,315],
"KM":   [239,465,419],
"IP":   [243,463,220],
"IPL":  [261,463,215],
"IPR":  [224,463,216],
"PM":   [243,463,201],
"HM1":  [244,509,353],
"CCM":  [242,592,346],
"VM1":  [243,615,279],
"ACL":  [284,636,238],
"ACR":  [205,636,237],
"FM1":  [245,679,306],
"AC" :  [244+1,623,248+1]
}

landmarksPlugin_class.prototype.landmarks_fullname = {
"CM"  : "Cerebellum middle",
"CM1" : "Cerebellum middle 1",
"PAG" : "Periaqueductal gray  middle",
"PAG3": "Periaqueductal gray  middle 3",
"KM"  : "Cortex middle",
"PM"  : "Pontine nucleus middle",
//"PL"  : "Pontine nucleus left",
//"PR"  : "Pontine nucleus right",  
"HM1" : "Hippocampus middle 1",
//"HL1" : "Hippocampus left 1",
//"HR1" : "Hippocampus right 1",
"IP"  : "Interpeduncular nucleus middle",
"IPL" : "Interpeduncular nucleus left",
"IPR" : "Interpeduncular nucleus right",
"CCM" : "Corpus Callosum middle",
"VM1" : "Ventricle middle 1",
"ACL" : "Anterior Commissure Left",
"ACR" : "Anterior Commissure Right",
"FM1" : "Frontal middle 1",
"FL2" : "Frontal left 2",
"FR2" : "Frontal right 2",
"AC"  : "Anterior Commissure: WHS origin"
};

// Brainsite MDEFT RARE FLASH overall
landmarksPlugin_class.prototype.landmarks_quality = {
"CM1":["0.78","0.80","0.64","0.79"],
"CM":["0.90","0.90","0.60","0.90"],
"KM":["0.91","0.91","0.48","0.91"],
"PAG3":["0.81","0.88","0.35","0.84"],
"PM":["0.52","0.79","0.85","0.65"],
"HM1":["0.87","0.84","0.80","0.85"],
"IP":["0.94","0.92","0.93","0.93"],
"IPL":["0.93","0.88","0.90","0.91"],
"IPR":["0.93","0.89","0.90","0.91"],
"CCM":["0.89","0.70","0.77","0.79"],
"VM1":["0.86","0.93","0.69","0.90"],
"FM1":["0.89","0.92","0.90","0.90"],
"FL2":["0.88","0.88","0.89","0.88"],
"FR2":["0.82","0.79","0.88","0.81"],
"ACL":["0.78","0.90","0.78"],
"ACR":["0.77","0.90","0.77"],
"MEAN":["0.85","0.85","0.77","0.85"]
}

landmarksPlugin_class.prototype.landmarks_defs = {
"CM"  : {
  "T1":   ["T1(MDEFT): Move anteriorly until cerebellum is visible for the 1st time. CM is in the middle of the (imaginary) line separating it from the brainstem.","T1_landmarks_v3_Page_03.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until cerebellum is visible for the 1st time. CM is in the middle of the (imaginary) line separating it from the brainstem.","T2_landmarks_v3_Page_03.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until cerebellum is visible for the 1st time. CM is in the middle of the (imaginary) line separating it from the brainstem.","T2star_landmarks_v3_Page_03.jpg"]
},
"CM1" : {
  "T1":   ["T1(MDEFT): Move anteriorly until cerebellum is visible for the 1st time. CM1 is in the middle of the cerebellum.","T1_landmarks_v3_Page_04.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until cerebellum is visible for the 1st time. CM1 is in the middle of the cerebellum.","T2_landmarks_v3_Page_04.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until cerebellum is visible for the 1st time. CM1 is in the middle of the cerebellum.","T2star_landmarks_v3_Page_04.jpg"]
},
"PAG3": {
  "T1":   ["T1(MDEFT): Move anteriorly until the slice where PAG is most even and has a limulus shape. PAG3 is in its 'eye'.","T1_landmarks_v3_Page_05.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until the slice where PAG is most even and has a limulus shape. PAG3 is in its 'eye'.","T2_landmarks_v3_Page_05.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the slice where PAG is most even and has a limulus shape. PAG3 is in its 'eye'.","T2star_landmarks_v3_Page_05.jpg"]
},
"KM"  : {
  "T1": ["T1(MDEFT): Move anteriorly until the last slice with clearly separated cortex halves. KM is between them","T1_landmarks_v3_Page_05.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the last slice with clearly separated cortex halves. KM is between them.","T2_landmarks_v3_Page_05.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the last slice with clearly separated cortex halves. KM is between them.","T2star_landmarks_v3_Page_05.jpg"]
},
"PM"  : {
  "T1": ["T1(MDEFT): Move anteriorly until the last slice where Pontine Nuclei are connected. PM is the center of this connection.","T1_landmarks_v3_Page_06.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the last slice where Pontine Nuclei are connected. PM is the center of this connection.","T2_landmarks_v3_Page_06.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the last slice where Pontine Nuclei are connected. PM is the center of this connection.","T2star_landmarks_v3_Page_06.jpg"]
},
"HM1" : {
  "T1": ["T1(MDEFT): Move anteriorly until Corpus Callosum gets continuous in the middle. HM1 is in the opening at the crossing of midline and borderline between hippocampus and thalamus/superior colliculus.","T1_landmarks_v3_Page_07.jpg"],
  "T2": ["T2(RARE): Move anteriorly until Corpus Callosum gets continuous in the middle. HM1 is in the opening at the crossing of midline and borderline between hippocampus and thalamus/superior colliculus.","T2_landmarks_v3_Page_07.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until Corpus Callosum gets continuous in the middle. HM1 is in the opening at the crossing of midline and borderline between hippocampus and thalamus/superior colliculus.","T2star_landmarks_v3_Page_07.jpg"]
},
"IP"  : {
  "T1": ["T1(MDEFT): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IP is in its middle.","T1_landmarks_v3_Page_07.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IP is in its middle.","T2_landmarks_v3_Page_07.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IP is in its middle.","T2star_landmarks_v3_Page_07.jpg"]
},
"IPL" : {
  "T1": ["T1(MDEFT): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPL is its left most distal point","T1_landmarks_v3_Page_07.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPL is its left most distal point","T2_landmarks_v3_Page_07.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPL is its left most distal point","T2star_landmarks_v3_Page_07.jpg"]
},
"IPR" : {
  "T1": ["T1(MDEFT): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPR is its right most distal point","T1_landmarks_v3_Page_07.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPR is its right most distal point","T2_landmarks_v3_Page_07.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPR is its right most distal point","T2star_landmarks_v3_Page_07.jpg"]
},
"CCM" : {
  "T1":   ["T1(MDEFT): Move anteriorly until the last slice where the Hippocampus has an obvious butterfly shape. CCM is in the middle of the borderline between corpus callosum and the fore wings of this butterfly","T1_landmarks_v3_Page_08.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until the last slice where the Hippocampus has an obvious butterfly shape. CCM is in the middle of the borderline between corpus callosum and the fore wings of this butterfly","T2_landmarks_v3_Page_08.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the last slice where the Hippocampus has an obvious butterfly shape. CCM is in the middle of the borderline between corpus callosum and the fore wings of this butterfly","T2star_landmarks_v3_Page_08.jpg"]
},
"VM1" : {
  "T1":   ["T1(MDEFT): Move anteriorly until you get to the most articulate \"Wineglass\"-slice, where the lateral ventricles are still connected to the \"glass stem\". VM1 is between stem and bowl.","T1_landmarks_v3_Page_09.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until you get to the most articulate \"Wineglass\"-slice, where the lateral ventricles are still connected to the \"glass stem\". VM1 is between stem and bowl.","T2_landmarks_v3_Page_09.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until you get to the most articulate \"Wineglass\"-slice, where the lateral ventricles are still connected to the \"glass stem\". VM1 is between stem and bowl.","T2star_landmarks_v3_Page_09.jpg"]
},
"ACL": {
  "T1":   ["T1(MDEFT): Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACL is on the remaining 'islet' on the left, on its left border","T1_landmarks_v3_Page_10.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACL is on the remaining 'islet' on the left, on its left border","T2_landmarks_v3_Page_10.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACL is on the remaining 'islet' on the left, on its left border","T2star_landmarks_v3_Page_10.jpg"]
},
"ACR": {
  "T1":   ["T1(MDEFT): Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACR is on the remaining 'islet' on the right, on its right border","T1_landmarks_v3_Page_10.jpg"],
  "T2":    ["T2(RARE): Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACR is on the remaining 'islet' on the right, on its right border","T2_landmarks_v3_Page_10.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACR is on the remaining 'islet' on the right, on its right border","T2star_landmarks_v3_Page_10.jpg"]
},
"FM1" : {
  "T1": ["T1(MDEFT): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FM1 is in its middle.","T1_landmarks_v3_Page_11.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FM1 is in its middle.","T2_landmarks_v3_Page_11.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FM1 is in its middle.","T2star_landmarks_v3_Page_11.jpg"]
},
"FL2" : {
  "T1": ["T1(MDEFT): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FL2 is the left inner ventricle tip","T1_landmarks_v3_Page_11.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FL2 is the left inner ventricle tip","T2_landmarks_v3_Page_11.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FL2 is the left inner ventricle tip","T2star_landmarks_v3_Page_11.jpg"]
},
"FR2" : {
  "T1": ["T1(MDEFT): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FR2 is the right inner ventricle tip","T1_landmarks_v3_Page_11.jpg"],
  "T2": ["T2(RARE): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FR2 is the right inner ventricle tip","T2_landmarks_v3_Page_11.jpg"],
  "T2*": ["T2*(FLASH): Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FR2 is the right inner ventricle tip","T2star_landmarks_v3_Page_11.jpg"]
},
"AC": {
  "T1": ["AC is used as the origin of the Mouse-WHS coordinate space. It is located in the anterior commissure (AC) at the intersection between:<ul><li>The mid-sagittal plane,</li><li>A coronal plane passing midway (rostro-caudal) through the anterior and posterior branches of AC,</li><li>A horizontal plane passing midway through the most dorsal and ventral aspect of the AC.</li></ul>","WHS_origin_2011.png"],
  "T2": ["T2: Junction of the rostral and dorsal tangential planes of the anterior commissure with the mid-sagittal plane.","WHS_origin_2011.png"],
  "T2*": ["T2*: Junction of the rostral and dorsal tangential planes of the anterior commissure with the mid-sagittal plane.","WHS_origin_2011.png"]
}
};

landmarksPlugin_class.prototype.landmarks_defs_PLCJB14 = {
"CM"  : {
  "T2*": ["Move anteriorly until cerebellum is visible for the 1st time. CM is in the middle of the (imaginary) line separating it from the brainstem.","CM.jpg"]
},
"CM1" : {
  "T2*": ["Move anteriorly until cerebellum is visible for the 1st time. CM1 is in the middle of the cerebellum.","CM1.jpg"]
},
"PAG3": {
  "T2*": ["Move anteriorly until the slice where PAG is most even and has a limulus shape. PAG3 is in its 'eye'.","PAG3.jpg"]
},
"KM"  : {
  "T2*": ["Move anteriorly until the last slice with clearly separated cortex halves. KM is between them.","KM.jpg"]
},
"IP"  : {
  "T2*": ["Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IP is in its middle.","IP.jpg"]
},
"IPL" : {
  "T2*": ["Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPL is its left most distal point","IP.jpg"]
},
"IPR" : {
  "T2*": ["Move anteriorly until the Interpeduncular Nucleus is largest and most sharply bounded. IPR is its right most distal point","IP.jpg"]
},
"PM"  : {
  "T2*": ["Move anteriorly until the last slice where Pontine Nuclei are connected. PM is the center of this connection.","PM.jpg"]
},
"HM1" : {
  "T2*": ["Move anteriorly until Corpus Callosum gets continuous in the middle. HM1 is in the opening at the crossing of midline and borderline between hippocampus and thalamus/superior colliculus.","HM1.jpg"]
},
"CCM" : {
  "T2*": ["Move anteriorly until the last slice where the Hippocampus has an obvious butterfly shape. CCM is in the middle of the borderline between corpus callosum and the fore wings of this butterfly","CCM.jpg"]
},
"VM1" : {
  "T2*": ["Move anteriorly until you get to the most articulate \"Wineglass\"-slice, where the lateral ventricles are still connected to the \"glass stem\". VM1 is between stem and bowl.","VM1.jpg"]
},
"ACL": {
  "T2*": ["Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACL is on the remaining 'islet' on the left, on its left border","ACR.jpg"]
},
"ACR": {
  "T2*": ["Move anteriorly until the first slice with no shade of the anterior commissure in the middle. ACR is on the remaining 'islet' on the right, on its right border","ACR.jpg"]
},
"FM1" : {
  "T2*": ["Move anteriorly until the last slice where the Corpus Callosum is uninterupted. FM1 is in its middle.","FM1.jpg"]
},
"AC": {
  "T2*": ["AC is used as the origin of the Rat-WHS coordinate space. It is located at the intersection of:<ol><li>The mid-sagittal plane,</li><li>A coronal plane passing midway (rostro-caudal) through the decussation of the anterior and posterior part of the anterior commissure,</li><li>A horizontal plane passing midway through the most dorsal and ventral aspect of the decussation of the anterior commissure.</li></ol>","AC.jpg"]
}
};

landmarksPlugin_class.prototype.round3 = function(x) {
  return Math.round(1000*x)/1000;
}

landmarksPlugin_class.prototype.xyzLandmark = function(hires,i0) {
  // x and z are zero-based; y (slice no) is 1-based.
  // x has bug: 2 pixels too large
  //var landm = [2*(lores[i0+1]-3)+0.4, 2*(lores[i0+2]-1)+0.4, 2*(255-(lores[i0+0]))+0.4];
  if (this.template == 'PLCJB14') {
    var landm = [hires[i0+0]-(244+1), hires[i0+1]-623, hires[i0+2]-(248+1)];
    var x_mm = this.round3(0.0390625*landm[0]);
    var slice_mm = this.round3(0.0390625*landm[1]);
    var z_mm = this.round3(0.0390625*landm[2]);
  } else {
    var landm = [hires[i0+1]-1, hires[i0+2]-1, 512-hires[i0+0]];
    // convert to mm
    var x_mm = this.round3(-5.3965+0.0215*landm[0]);
    var slice_mm = this.round3(-11.997+0.0215*landm[1]);
    var z_mm = this.round3(-5.5255+0.0215*landm[2]);
  }
  return [x_mm,slice_mm,z_mm];
}

landmarksPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  divElem.innerHTML = '<b>Landmarks that are visible in all MRI modalities</b><p/>';
  var ans = '';
  for (var m in this.modalities) {
    var md = this.modalities[m];
    var rgb = md[1];
    var show = md[2];
    var button = '<input type="checkbox" onclick="sbaPluginManager.plugins[\''+this.name.toLowerCase()+'\'].updateMarkers(this,\''+m+'\')"'+(show ?  ' checked="checked"' : '')+'/>';
    ans += 'Show landmarks based on <b style="background:'+rgb+'">MRI-'+m+'</b> '+button+'<br/>';
  }
  for (var m in this.modalities) {
    var md = this.modalities[m];
    var i0 = md[0];
    var rgb = md[1];
    var show = md[2];
    ans += '<p style="padding: 2px; background: '+rgb+'">Landmark locations based on <b style="background:'+rgb+'">MRI-'+m+'</b>';
    ans += '<table class="fancy"><tr><th>Abbr</th><th>Name</th><th>Def</th><th>X</th><th>Y</th><th>Z</th></tr>';
    for (var k in this.landmarks) {
      var hires = this.landmarks[k];      
      var full = this.landmarks_fullname[k];
      if (hires[i0] != -1) {
        // Andress Hess supplied values in which
        // first coord is 0-based, top-down z-axis
        // second coord is 0-based left-right axis, shifted to right by 2 pixels
        // third coord is 1-based posterior-anterior axis (original slice number)
        var xyz = this.xyzLandmark(hires,i0);
        slice_mm = xyz[1];
        var os = sbaViewer.nearestOrigSlice(slice_mm);
        ans += '<tr><td><a class="link" onclick="sbaViewer.selectOrigSlice('+os+')">'+k+'</a></td><td>'+full+'</td><td><a class="link" onclick="sbaViewer.selectOrigSlice('+os+');sbaPluginManager.plugins[\''+this.name.toLowerCase()+'\'].showDef(\''+k+'\',\''+m+'\')">def</a></td><td>'+xyz[0]+'</td><td>'+slice_mm+'</td><td>'+xyz[2]+'</td></tr>';
      }
    }
    ans += '</table></p>';
  }
  divElem.innerHTML += ans;
  this.updateMarkers();
}

landmarksPlugin_class.prototype.showDef = function(abbr,md) {
  var full = this.landmarks_fullname[abbr];
  var defs = (this.template=='PLCJB14' ? this.landmarks_defs_PLCJB14[abbr] : this.landmarks_defs[abbr]);
  if (defs != undefined) {
    var src = defs[md];
    if (src != undefined) {
      var html = '<table><col width="600px"/><tr><td>'+src[0];
      if (this.template == 'PLCJB14') {
        if (abbr != 'AC') html += '<br/>Note: the image below shows the posterior slice view, while SBA shows the anterior view (i.e., mirrored)';
        else html += '<br/>Fig. 2 in Papp et al. (2014) <a href="dx.doi.org/10.1016/j.neuroimage.2014.04.001">10.1016/j.neuroimage.2014.04.001</a>.';
      } else {
        if (abbr != 'AC') html += '<br/>Note: the image below differs from the WHS standard in <a href="../plugins/WHS_landmarks/note_on_cuttingangle.php">cutting angle, contrast and extent</a>.';
        else html += '<br/>Note: the image below shows the actual orientation of the WHS mouse.';
      }      
      html += '</td></tr><tr><td>'+'<img src="../plugins/'+(this.template=='PLCJB14' ? 'PLCJB14' : 'WHS')+'_landmarks/'+src[1]+'" alt="Location description for landmark '+abbr+'" style="width:600px"/></td></tr></table>';
      elem = dragdiv.show(html,'Definition of landmark '+abbr+' - '+full);
    }
  }
}

landmarksPlugin_class.prototype.updateMarkers = function(elem,md) {
  if (window.sbaViewer == undefined) return;
  if (elem) {
    this.modalities[md][2] = !this.modalities[md][2];
  }
  var markers = [];
  for (var m in this.modalities) {
    var md = this.modalities[m];
    var i0 = md[0];
    var rgb = md[1];
    var show = md[2];
    for (var k in this.landmarks) {
      var hires = this.landmarks[k];
      var full = this.landmarks_fullname[k];
      if (hires[i0]>0 && show) {
        // Andress Hess supplied values in which
        // first coord is 0-based, top-down z-axis
        // second coord is 0-based left-right axis, shifted to right by 2 pixels
        // third coord is 1-based posterior-anterior axis (original slice number)
        var xyz = this.xyzLandmark(hires,i0);
        var origSlice = sbaViewer.nearestOrigSlice(xyz[1]);       
        var xz = sbaViewer.mm2svg([xyz[0],xyz[2]]);
        var mk = new sbaMarker_class(k,origSlice,xz);
        mk.rgb = rgb;
        mk.shape2d = 'crosshair';
        mk.tooltip = full;
        mk.onclick = function() {
          sbaViewer.selectOrigSlice(this.origSlice);
        };
        markers.push(mk);
      }
    }
  }
  sbaViewer.addMarkers(markers,1);
}

