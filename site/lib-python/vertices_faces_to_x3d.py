import sys
sys.path.append('../shared-python/fancypipe')
from fancypipe import *
import csv,numpy,re
from lxml import etree

class GenerateX3D(FancyTask):
  title = 'Convert vertices and faces to X3D'
  description = None
  inputs = odict(
    ('vertices',dict(type=assertFile,help='tab-separated text file with 3 vertex coordinates per row. Or caret .coord file.')),
    ('faces',dict(type=assertFile,help='tab-separated text file with one face triangle (3 vertex indices) per row. Or caret .topo file.')),
    ('labels',dict(type=assertFile,help='nifti file with integer label indices, with 0 representing background.',default=None))
  )
  
  def init(self,vertices,faces,labels):
    x3dtemplate = '../lib-python/emptybrain.x3d'
    # load faces
    F = []
    with open(faces,'rb') as fp:
      lines = fp.readlines()
      if re.search('\.topo$',faces):
        for iEnd,line in enumerate(lines):
          if line.strip() == 'EndHeader': break
        line = lines[iEnd+1]
        tv1 = re.match('tag-version 1',line)
        if tv1: iEnd += 1
        nF = int(lines[iEnd+1])
        iNext = iEnd+2
        if tv1:
          for f in range(0,nF):
            line = [int(x) for x in lines[iNext].split(' ')]
            iNext += 1
            line.append(-1)
            F.append(line)
        else:
          for f in range(0,nF):
            line = [int(x) for x in lines[iNext].split(' ')]
            iNext += 1
            nP = line[1]
            poly = []
            for p in range(0,nP):
              line = [int(x) for x in lines[iNext].split(' ')]
              iNext += 1
              poly.append(line[1])
            poly.append(-1)
            F.append(poly)       
      else:
        for line in lines:
          line = line.strip().split('\t')
          line = [int(float(line[i])) for i in range(0,3)]
          line.append(-1)
          F.append(line)

    V = []
    with open(vertices,'rb') as fp:
      lines = fp.readlines()
      if re.search('\.coord$',vertices):
        for iEnd,line in enumerate(lines):
          if line.strip() == 'EndHeader': break
        nV = int(lines[iEnd+1])
        iStart = iEnd+2
        for i in range(iStart,iStart+nV):
          line = lines[i].strip().split(' ')
          line = [float(line[i]) for i in range(1,4)]
          V.append(line)
      else:
        for line in lines:
          line = line.strip().split('\t')
          line = [float(x) for x in line]
          V.append(line)
    V = numpy.array(V)
    
    if labels:
      faceColors = []
      import nibabel
      from nibabel.affines import apply_affine
      nii = nibabel.load(labels)
      hdr = nii.get_header()
      img = nii.get_data()
      sform = hdr.get_sform()
      inv_sform = numpy.linalg.inv(sform)
      print('{}\n\n{}'.format(sform,inv_sform))
      shift05 = numpy.array([0.5,0.5,0.5])
      for line in F:
        coords = numpy.array([V[i] for i in line])
        ctr = coords.mean(axis=0)
        ctr_ijk = (apply_affine(inv_sform,ctr)+shift05).astype(numpy.uint16)
        try:
          sample = img[ctr_ijk[0],ctr_ijk[1],ctr_ijk[2]]
        except:
          nearby = [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,-1]]
          for dk in nearby:
            try:
              sample = img[ctr_ijk[0]+dk[0],ctr_ijk[1]+dk[1],ctr_ijk[2]+dk[2]]
            except:
              pass
          sample = 0
        faceColors.append(sample)
      mx = numpy.array(faceColors).max()
      colorMap = [[float(i)/mx,float(i)/mx,float(i)/mx] for i in range(0,mx+1)]

    # normalize V
    mx = V.max()
    mn = V.min()
    for i in range(0,3): V[:,i] = 65535.9999*(V[:,i]-V[:,i].min())/(mx-mn)
    V = V.astype(numpy.uint16)
    meanV = V.mean(axis=0).astype(numpy.uint16)
    print 'Vertex data is {}\nwith mean {}'.format(V,meanV)
    
    tree = etree.parse(x3dtemplate)
    rootNode = tree.getroot()
    shapeNode = rootNode.find('Scene/Transform/Shape')
    faceNode = shapeNode.find('IndexedFaceSet')
    lines = [' '.join([str(x) for x in line]) for line in F]
    faceNode.attrib['coordIndex'] = '{}'.format(' '.join(lines))
    vertexNode = faceNode.find('Coordinate')
    lines = [' '.join([str(x) for x in line]) for line in V.tolist()]
    vertexNode.attrib['point'] = '{}'.format(','.join(lines))
    if labels:
      values = [str(x) for x in faceColors]
      faceNode.attrib['colorIndex'] = '{}'.format(' '.join(values))
      faceNode.attrib['colorPerVertex'] = "false"
      cmapNode = faceNode.find('Color')
      colors = [' '.join([str(x) for x in line]) for line in colorMap]
      cmapNode.attrib['color'] = '{}'.format(' '.join(colors))
    viewNode = rootNode.find('Scene/Viewpoint')
    viewNode.attrib['position'] = '{} {} {}'.format(-65536*5,meanV[1],meanV[2])
    viewNode.attrib['centerOfRotation'] = '{}'.format(' '.join([str(x) for x in meanV.tolist()]))
    x3dfile = self.tempfile('output.x3d')
    tree.write(x3dfile,encoding='utf-8',method="xml",xml_declaration=True,pretty_print=True,with_tail=True)

    return FancyOutput(
      x3dfile = x3dfile
    )
#endclass

if __name__ == '__main__':
  GenerateX3D.fromCommandLine().run()
