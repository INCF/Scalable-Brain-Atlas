import os,sys
os.chdir(sys.path[0])
sys.path.append('../shared-python')
import json,numpy,re
import jsonrpc2 as JR2
from fancypipe import *
sys.path.append('../nifti-tools')
import nibabel,niitools
from nibabel.affines import apply_affine
from lxml import etree
from x3d_tools import LoadFaces,LoadVertices,FaceCenters,IndexedPoints,LabelsFromVolume

class GetLabelValues(FancyTask):
  runParallel = True
  def main(self,faceLabels,label2name,name2value,colormap,colorlimits):
    label2value = None
    if label2name and name2value:
      with open(label2name) as fp:
        label2name = json.load(fp)
      items = label2name.items() if hasattr(label2name,'items') else enumerate(label2name)
      name2label = { name:label for label,name in items }
      if name2value:
        with open(name2value) as fp:
          name2value = json.load(fp)
      else:
        name2value = name2label
      label2value = { name2label[name]:value for name,value in name2value.items() if name in name2label }
    else:
      label2value = { value:value for value in faceLabels }
    if colormap:
      colormap = niitools.parse_colormap(colormap,bg=[],assertList=True)
    else:
      colormap = [[i,i,i] for i in range(0,255)]

    # scale the values
    label2rgb = label2value
    if len(colorlimits)>1:
      numColors = len(colormap)
      values = numpy.array(label2value.values())
      mn = values.min() if colorlimits[0] is None else colorlimits[0]
      mx = values.max() if colorlimits[1] is None else colorlimits[1]
      if mx>mn:
        label2rgb = { label:int((value-mn)*(numColors-1e-8)/(mx-mn)) for label,value in label2value.items() }
    baseColor = [200,200,200]
    label2rgb = [colormap[int(label2rgb[label])] if label in label2rgb else baseColor for label in range(0,len(colormap))]

    return FancyDict(
      label2value=label2value,
      label2rgb=label2rgb,
      colormap=colormap
    )


class GenerateX3D(FancyTask):
  title = 'Convert vertices and faces to X3D'
  description = None
  inputs = odict(
    ('vertices',dict(type=assertList,help='List of lists with 3 vertex coordinates per row.')),
    ('faces',dict(type=assertList,help='List of lists with one face triangle (3 vertex indices) per row.')),
    ('facelabels',dict(type=assertList,help='List of label indices for each face.',default=None)),
    ('label2rgb',dict(type=assertList,help='List of colors to map label indices to.',default=None)),
    ('label2name',dict(type=assertDict,default=None)),
    ('label2value',dict(type=assertDict,default=None)),
    ('colormap',dict(type=assertDict,default=None)),
    ('x3dtemplate',dict(type=assertFile,help='Empty x3d file.',default='../lib-python/emptybrain.x3d')),
  )
  
  def main(self,vertices,faces,facelabels,label2rgb,label2name,label2value,colormap,x3dtemplate):
    F = numpy.array(faces,numpy.uint32)
    V = numpy.array(vertices,float)
    meanV = V.mean(axis=0)
    minV = V.min(axis=0)
    maxV = V.max(axis=0)
    print 'Original vertex data has mean {}, min {}, max {}'.format(meanV,minV,maxV)
    
    # normalize V
    mxmx = V.max()
    mn = V.min(axis=0)
    mnmn = mn.min()
    #V = numpy.array([65535.9999*(V[:,i]-mn[i])/(mxmx-mnmn) for i in range(0,3)],numpy.uint16).T
    meanV = V.mean(axis=0)
    minV = V.min(axis=0)
    maxV = V.max(axis=0)
    print 'Rescaled vertex data has mean {}, min {}, max {}'.format(meanV,minV,maxV)
    
    tree = etree.parse(x3dtemplate)
    rootNode = tree.getroot()
    backgroundNode = rootNode.find('Scene/Background')
    backgroundNode.attrib['skyColor'] = "1 1 1"
    shapeNode = rootNode.find('Scene/Transform/Shape')
    faceNode = shapeNode.find('IndexedFaceSet')
    lines = [' '.join([str(x) for x in line]) for line in F]
    faceNode.attrib['coordIndex'] = '{}'.format(' -1 '.join(lines))
    vertexNode = faceNode.find('Coordinate')
    lines = [' '.join([str(x) for x in line]) for line in V.tolist()]
    vertexNode.attrib['point'] = '{}'.format(','.join(lines))
    if facelabels is not None:
      values = [str(x) for x in facelabels.tolist()]
      faceNode.attrib['colorIndex'] = '{}'.format(' '.join(values))
      faceNode.attrib['colorPerVertex'] = "false"
      colors = [' '.join(['{0:.3f}'.format(x/255.0) for x in rgb]) for rgb in label2rgb]
      colors = '{}'.format(' '.join(colors))
      faceNode.append(etree.Element('Color', {'color': colors}))
    viewNode = rootNode.find('Scene/Viewpoint')
    viewNode.attrib['position'] = '{} {} {}'.format(-65536*2,meanV[1],meanV[2])
    viewNode.attrib['centerOfRotation'] = '{}'.format(' '.join([str(x) for x in meanV.tolist()]))
    x3dfile = self.tempfile('output.x3d')
    tree.write(x3dfile,encoding='utf-8',method="xml",xml_declaration=True,pretty_print=True,with_tail=True)

    with open('x3dviewer.html','r') as fp:
      html = fp.readlines()
    if label2rgb:
      hexColors = [niitools.rgb2hex(v,prefix='#') for v in label2rgb]
      for i,line in enumerate(html):
        if line == 'var index2rgb = {};\n':
          html[i] = 'var index2rgb = {};\n'.format(json.dumps(hexColors))
          break
    if label2name:
      for i,line in enumerate(html):
        if line == 'var index2name = {};\n':
          html[i] = 'var index2name = {};\n'.format(json.dumps(label2name))
          break
    if label2value:
      for i,line in enumerate(html):
        if line == 'var index2value = {};\n':
          #label2value = { str(label):str(value) for label,value in label2value.items() }
          #FANCYDEBUG(label2value)
          html[i] = 'var index2value = {};\n'.format(json.dumps(FancyLog.stringifyValue(label2value)))
          break
    x3dviewer = self.tempfile('x3dviewer.html')
    with open(x3dviewer,'w') as fp:
      fp.write(''.join(html))

    x3dviewer_files = self.tempdir('x3dviewer_files')
    with open('../www/js/x3dom.js','r') as fp:
      x3dom_js = fp.read()
    with open('{}/x3dom.js'.format(x3dviewer_files),'w') as fp:
      fp.write(x3dom_js)
    with open('../www/css/x3dom.css','r') as fp:
      x3dom_css = fp.read()
    with open('{}/x3dom.css'.format(x3dviewer_files),'w') as fp:
      fp.write(x3dom_css)
      
    return FancyDict(
      x3dfile = x3dfile,
      x3dviewer = x3dviewer,
      x3dviewer_files = x3dviewer_files
    )
#endclass


class RenderSurface(FancyTask):
  inputs = odict(
    ('space',{'type':str}),
    ('mesh',{'type':str}),
    ('deformation',{'type':str,'default':'fiducial'}),
    ('labelvolume',{'type':assertFile,'default':None,'help':'nifti file with 3d volume of label indices (e.g. representing brain regions).'}),
    ('labelnames',{'type':assertFile,'default':None,'help':'json-file with list or dict that maps label indices to label names.'}),
    ('name2value',{'type':assertFile,'default':None,'help':'json-file with dict that maps label name to value.'}),
    ('colormap',{'type':str,'default':None,'help':'json-file with list or dict that maps value to rgb color triplets (white = [256,256,256])'}),
    ('colorlimits',{'type':assertList,'default':[None,None],'help':'Two-element list with min,max color axis limits, use [] for no scaling and [None,None] for auto-scaling.'}),
    ('spacesroot',{'type':str,'default':'../spaces'}),
    ('jsonrpc2',{'action':'store_true','default':False})
  )
  def main(self,space,mesh,deformation,labelvolume,labelnames,name2value,colormap,colorlimits,spacesroot,jsonrpc2):
    spacesFolder = '{}/{}'.format(spacesroot,space)
    with open( '{}/config.json'.format(spacesFolder) ) as fp:
      spaceConfig = json.load(fp)
    meshConfig = spaceConfig['meshes'][mesh]['deformations']['fiducial']

    facesFile = None
    verticesFile = None
    faceLabels = None
    label2value = None
    label2rgb = None
    if labelvolume:
      nii = nibabel.load(labelvolume)
      hdr = nii.get_header()
      img = nii.get_data()
      sform = hdr.get_sform()
      bgIndex = 0

      facesFile = '{}/meshes/{}'.format(spacesFolder,meshConfig['faces'])
      verticesFile = '{}/meshes/{}'.format(spacesFolder,meshConfig['vertices'])
      F = LoadFaces.fromParent(self).setInput(facesFile).requestOutput('faces')
      V = LoadVertices.fromParent(self).setInput(verticesFile).requestOutput('vertices')
      X = FaceCenters.fromParent(self).setInput(F,V).requestOutput('centers')
      faceCenters = IndexedPoints.fromParent(self).setInput(X,sform).requestOutput('points')
      faceLabels = LabelsFromVolume.fromParent(self).setInput(
        labelVolume = img,
        points = faceCenters,
        bgIndex = bgIndex
      ).run().requestOutput('labels')
      with open(self.tempfile('facelabels.csv'),'w') as fp:
        fp.write('\n'.join([str(v) for v in faceLabels]))      
      
      getLabelValues = GetLabelValues.fromParent(self).setInput(faceLabels,labelnames,name2value,colormap,colorlimits)
      label2value = getLabelValues.requestOutput('label2value')
      label2rgb = getLabelValues.requestOutput('label2rgb')
      colormap = getLabelValues.requestOutput('colormap')
    
    meshConfig = spaceConfig['meshes'][mesh]['deformations'][deformation]
    deformedVerticesFile = '{}/meshes/{}'.format(spacesFolder,meshConfig['vertices'])
    deformedFacesFile = '{}/meshes/{}'.format(spacesFolder,meshConfig['faces'])
    if deformedVerticesFile != verticesFile: 
      V = LoadVertices.fromParent(self).setInput(deformedVerticesFile).requestOutput('vertices')
    if deformedFacesFile != facesFile: 
      F = LoadFaces.fromParent(self).setInput(deformedFacesFile).requestOutput('faces')
    if labelnames:
      with open(labelnames) as fp:
        labelnames = json.load(fp)
    
    generateX3D = GenerateX3D.fromParent(self).setInput(
      vertices = V,
      faces = F,
      facelabels = faceLabels,
      label2rgb = label2rgb,
      label2name = labelnames,
      label2value = label2value,
      colormap = colormap
    )
    return FancyDict(
      x3dfile = generateX3D.requestOutput('x3dfile'),
      x3dviewer = generateX3D.requestOutput('x3dviewer'),
      x3d_files = generateX3D.requestOutput('x3dviewer_files')
    )
#endclass

if __name__ == '__main__':
  report = JR2.rpc_report_class() if '--jsonrpc2' in sys.argv else JR2.report_class()
  mainTask = RenderSurface.fromCommandLine()
  ans = mainTask.run()
  report.success(mainTask.myOutput.kwargs)
