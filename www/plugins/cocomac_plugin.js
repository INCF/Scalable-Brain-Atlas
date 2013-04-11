function cocomacPlugin_class(name,sbaViewer) {
  sbaPlugin_class.apply(this,[name]);
  this.acr = null;
  var brainMap = sbaViewer.template;
  var pos = brainMap.indexOf('_');
  if (pos >= 0) brainMap = brainMap.substr(0,pos);
  if (brainMap == 'PHT00') brainMap = 'PHT00';
  else if (brainMap == 'FVE91') brainMap = 'FV91';
  else if (brainMap == 'LVE00') brainMap = 'LV00a';
  else if (brainMap == 'RM') brainMap = 'RM';
  else alert('Error: CoCoMac plugin does not support template '+sbaViewer.template);
  this.brainMap = brainMap;
}
cocomacPlugin_class.prototype = new sbaPlugin_class();

// some acronyms in CoCoMac are not exactly the same as those in SBA
cocomacPlugin_class.prototype.sba2cocoAcr = function() {
  if (this.brainMap == 'PHT00') return {
    "10D": "10d",
    "10M": "10m",
    "10V": "10v",
    "11L": "11l",
    "11M": "11m",
    "4(F1)": "4",
    "46D": "46d",
    "46V": "46v",
    "47(12)L":"47(12L)",
    "47(12)O":"47(12O)",
    "6DR(F7)":"6DR",
    "6VC(F4)":"6VC",
    "6VR(F5)":"6VR",
    "8AD":"8Ad",
    "8AV":"8Av",
    "9/46D":"9/46d",
    "9/46V":"9/46v",
    "9M":"9m",
    "ELC":"ELc",
    "ELR":"ELr",
    "MT(V5)":"MT",
    "OPAI":"OPAl",
    "OPT":"Opt",
    "PaAC":"paAc",
    "PaAR":"paAr",
    "PEC":"PEc",
    "PFOp":"PFop",
    "PGM":"PGm",
    "PGOp":"PGop",
    "ProM":"proM",
    "ReIT":"reIt",
    "TEM":"TEm",
    "TEOM":"TEOm",
    "TL(36)":"TL",
    "TLO(36O)":"TLO",
    "TLR(36R)":"TLR",
    "TPOC":"TPOc",
    "TPPAI":"TPPAl",
    "TPt":"Tpt",
    "V3D":"V3d",
    "V3V":"V3v",
    "V4D":"V4d",
    "V4T":"V4t",
    "V4V":"V4v",
    "Ce":"CE",
    "Me":"ME",
    "PaI":"paI"
  }
  else return {};
}

cocomacPlugin_class.prototype.sortFunc = function(a,b) {
  return a;
}

cocomacPlugin_class.prototype.activate = function(sbaViewer,divElem) {
  var sbaAcr = sbaViewer.currentAcr;
  if (sbaAcr != undefined) {
    var cocoAcr = this.sba2cocoAcr()[sbaAcr];
    if (cocoAcr == undefined) cocoAcr = sbaAcr;
    var originSite = this.brainMap+'-'+cocoAcr;
    // progress message
    divElem.innerHTML = '<b>Axonal projections for region '+originSite+'</b><p/><div id="SBA_COCOMAC_CONNECTIVITY">Connecting to CoCoMac...</div>';
    this.retrieveConnectivity(originSite);
  }
}

cocomacPlugin_class.prototype.retrieveConnectivity = function(originSite) {
  // prepare request
  var args = {};
  args.originSites = originSite;
  args.terminalSites = this.brainMap;
  var req = new jsonRequest_class('plugins/cocomac_request.php',args);

  // response handler
  var acrStart = this.brainMap.length+1;
  req.sortfunc = function(a,b) { return (a.sortBy)<(b.sortBy); }
  var cocoAcr2sba = {};
  var tmp = this.sba2cocoAcr();
  for (var k in tmp) cocoAcr2sba[tmp[k]] = k;
  req.responseHandler = function(ans) {
    var divElem = document.getElementById('SBA_COCOMAC_CONNECTIVITY');
    if (!divElem) return;
    var brainsiteNames = ans.brainsiteNames;
    var densities = ans.densities;
    var axonalProjections = ans.axonalProjections;
    var html = [];
    for (var aO in axonalProjections) {
      var apList = [];
      var axProj_O = axonalProjections[aO];
      for (var aT in axProj_O) { 
        var axProj_OT = axProj_O[aT];
        axProj_OT.aT = aT;
        var density = '';
        var maxDensity = 0;
        var sm10 = 0;
        var ssd10 = 0;
        var n10 = 0;
        for (var i=0; i<axProj_OT.length; i++) {
          var d = densities[axProj_OT[i][1]];
          density += d;
          var d10 = (d=='X' ? 15 : 10*d);
          if (d10>0) {
            sm10 += d10;
            ssd10 += d10*d10;
            n10++;
            if (d10>maxDensity) maxDensity = d10;
          }
        }
        if (maxDensity>0) {
          var sd = Math.sqrt((15*15+ssd10-sm10*sm10/n10)/(n10));
          axProj_OT.ssd10 = Math.round(maxDensity*15/(15+2*sd));
          axProj_OT.adhocDensity = Math.round(maxDensity*15/(15+2*sd));
          axProj_OT.sortBy = ''+(100+axProj_OT.adhocDensity)+'_'+(100+axProj_OT.length);
          axProj_OT.density = density;
          apList.push(axProj_OT);
        }
      }
      apList.sort(this.sortfunc);
      
      var markers = [];
      var colorMap = ['#555','#5A5','#0F0','#5F0','#AF0','#FF0'];
      for (var k=0; k<apList.length; k++) {
        var ap = apList[k];
        var cocoAcr = brainsiteNames[ap.aT].substr(acrStart);
        var sbaAcr = cocoAcr2sba[cocoAcr];
        if (sbaAcr == undefined) sbaAcr = cocoAcr;
        html.push('<tr><td>'+cocoAcr+'</td><td>'+ap.adhocDensity/10+'</td><td><a href="http://cocomac.g-node.org/cocomac2/services/axonal_projections.php?axonOriginList='+(args.originSites)+'&amp;axonTerminalList='+(args.terminalSites+'-'+cocoAcr)+'&amp;includeLargeInjections=0&amp;useAM=1&amp;useSORT=0&amp;output=dhtml" terget="SBA_COCOMAC">'+ap.density+'</a></td></tr>');
        var origSlice_xy = sbaViewer.regionCenter(sbaAcr);
        if (origSlice_xy != undefined) {
          var mk = new sbaMarker_class(cocoAcr,origSlice_xy[0],origSlice_xy[1]);
          mk.rgb = colorMap[Math.round(ap.adhocDensity/6)];
          mk.tooltip = ACR_TO_FULL[sbaAcr];
          markers.push(mk);
        } else {
          globalErrorConsole.addError('No center coordinates found for region '+cocoAcr);
        }
      }

      sbaViewer.addMarkers(markers,1);
      break; // HACK, if CoCoMac does not 'know' a site it returns too many results
    }
    var htmlStart = '<table class="fancy"><tr><th>Axon terminal</th><th>Est. density</th><th>Density vector</th></tr>';
    var htmlEnd = '</table>';
    divElem.innerHTML = htmlStart+html.join('')+htmlEnd;
  }

  // submit request
  req.submit();
}