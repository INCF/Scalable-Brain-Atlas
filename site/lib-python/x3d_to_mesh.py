import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import json,numpy,re
from fancypipe import *
sys.path.append('../nifti-tools')
import nibabel,niitools
from lxml import etree
from x3d_tools import LoadFaces,LoadVertices,FaceCenters,FaceVertexCenters,IndexedPoints,LabelsFromVolume,VolumeFromLabels

class SaveMesh(FancyTask):
  inputs = odict(
    ('surface_x3d',{'type':assertFile}),
    ('faces_csv',{'type':str}),
    ('vertices_csv',{'type':str}),
    ('vertexlimits_csv',{'type':str})
  )
  def main(self,surface_x3d,faces_csv,vertices_csv,vertexlimits_csv):
    # custom parser needed to parse files larger than approx. 10 MB.
    tree = etree.parse(surface_x3d,parser=etree.ETCompatXMLParser(huge_tree=True))
    rootNode = tree.getroot()
    faceNode = rootNode.find('.//IndexedFaceSet')
    faces = re.sub('[\s,]+',',',faceNode.attrib['coordIndex'].strip())
    faces = re.sub(',-1,','\n',faces)
    faces = re.sub(',-1$','',faces)
    with open(faces_csv,'w') as fp:
      fp.write(faces)
    # experimental: save binary data (works well, but gz is more useful)
    """
    faces = json.loads('[['+re.sub('\n','],[',faces)+']]')
    faces = numpy.array(faces,numpy.dtype('<u4'))
    faces_dat = re.sub('\.csv$','',faces_csv)+'.dat';
    with open(faces_dat,'w') as fp:
      fp.write(faces.tostring())
    """
    
    vertexNode = faceNode.find('Coordinate')
    with open(vertices_csv,'w') as fp:
      vertices = re.sub('[\s,]+',' ',vertexNode.attrib['point'].strip())
      vertices = vertices.split(' ')
      vertices = [','.join(vertices[i:i+3]) for i in range(0,len(vertices),3)]
      fp.write('\n'.join(vertices))
      
    V = LoadVertices().setInput(vertices_csv).getOutput('vertices')
    V = numpy.array(V,float)
    minmax = [
      ','.join([str(v) for v in V.min(axis=0)]),
      ','.join([str(v) for v in V.max(axis=0)])
    ]
    with open(vertexlimits_csv,'w') as fp:
      fp.write('\n'.join(minmax))

    return FancyDict(
      faces_csv = faces_csv,
      vertices_csv = vertices_csv,
      vertexlimits_csv = vertexlimits_csv
    )
#endclass

if __name__ == '__main__':
  SaveMesh.fromCommandLine().run()
