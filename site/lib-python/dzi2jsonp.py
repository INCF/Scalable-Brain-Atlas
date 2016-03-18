import os,sys
os.chdir(sys.path[0])
import os.path as op
sys.path.append('../fancypipe')
from fancypipe import *
import lxml.etree
import json,re

"""
jsonp = f({
  "pixelsPerMeter": 1000000, 
  "tileSources": [
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
		{width:4400,height:4064,tileSize:254,tileOverlap:1,getTileUrl:function(level,x,y){return "http://scalablebrainatlas.incf.org/templates/ABA12/zoom_coronal_Nissl/nissl_0091_files/"+level+"/"+x+"_"+y+".jpg";}}
  ]
});
"""

class Dzi2JsonP(FancyTask):
  inputs = odict(
    ('dziPath',{'short':'i','type':assertDir})
  )
  
  def main(self,dziPath):
    baseUrl = re.sub('^.*?templates','http://scalablebrainatlas.incf.org/templates',dziPath)
    files = [f for f in os.listdir(dziPath) if op.isfile(op.join(dziPath,f))]
    dziInfo = {'pixelsPerMeter': 1000000,'tileSources':[]}
    for f in sorted(files):
      try:
        with open(op.join(dziPath,f)) as fp:
          content = fp.read()
        content = re.sub('<\?.*\?>','',content);
        content = '<dzi>{}</dzi>'.format(content);
        root = lxml.etree.fromstring(content)
        Format = False
        Overlap = False
        TileSize = False
        sizeElem = False
        Height = False
        Width = False
        for elem in root:
          if elem.tag == '{http://schemas.microsoft.com/deepzoom/2008}Image':
            Format = elem.get('Format')
            Overlap = int(elem.get('Overlap'))
            TileSize = int(elem.get('TileSize'))
            sizeElem = elem[0]
            Height = int(sizeElem.get('Height'))
            Width = int(sizeElem.get('Width'))
        if Format:
          tileUrl = 'function(level,x,y){ return "'+op.join(baseUrl,f)+'_files/"+level+"/"+x+"_"+y+".jpg"}'
          dziInfo['tileSources'].append({'width':Width,'height':Height,'tileSize':TileSize,'tileOverlap':Overlap,'getTileUrl':tileUrl})
          jsonp = 'f({});'.format(json.dumps(dziInfo,indent=2))
          jsonpFile = op.join(dziPath,'microdraw.jsonp')
          with open(jsonpFile,'w') as fp:
            fp.write(jsonp)
      except lxml.etree.XMLSyntaxError:
        FANCYDEBUG(f,'Not an xml file')

    return jsonpFile
#endclass

if __name__ == '__main__':
  Dzi2JsonP.fromCommandLine().run()
