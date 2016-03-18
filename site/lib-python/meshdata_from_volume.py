import os,sys
os.chdir(sys.path[0])
sys.path.append('../shared-python')
import json,numpy,re
import jsonrpc2 as JR2
from fancypipe import *
sys.path.append('../nifti-tools')
import nibabel,niitools
from lxml import etree
from x3d_tools import LoadFaces,LoadVertices,FaceCenters,FaceVertexCenters,IndexedPoints,LabelsFromVolume,VolumeFromLabels

class MeshDataFromVolume(FancyTask):
  inputs = odict(
    ('vertices_csv',{'type':assertFile}),
    ('faces_csv',{'type':assertFile}),
    ('datavolume_nii',{'type':assertFile}),
    ('paintmode',{'type':str,'default':'F','help':'F: face-labels, V: vertex-labels, FV: face-vertex labels'})
  )
  def main(self,vertices_csv,faces_csv,datavolume_nii,paintmode):
    V = LoadVertices.fromParent(self).setInput(vertices_csv).run().getOutput('vertices')
    if paintmode=='F':
      F = LoadFaces.fromParent(self).setInput(faces_csv).requestOutput('faces')
      X = FaceCenters.fromParent(self).setInput(F,V).requestOutput('centers')
    elif paintmode=='V':
      X = V
    elif paintmode=='FV':
      F = LoadFaces.fromParent(self).setInput(faces_csv).run().getOutput('faces')
      X = FaceVertexCenters.fromParent(self).setInput(F,V).requestOutput('centers')
    else:
      raise RuntimeError('Invalid paintmode "{}".'.format(paintmode))
    nii = nibabel.load(datavolume_nii)
    affine = nii.get_header().get_sform()
    dataVolume = nii.get_data()
    indexedPoints = IndexedPoints.fromParent(self).setInput(
      X,affine
    )
    labelsFromVolume = LabelsFromVolume.fromParent(self).setInput(
      labelVolume = dataVolume,
      points = indexedPoints.requestOutput('points'),
      bgIndex = 0
    )
    meshdata = labelsFromVolume.run().getOutput('labels').tolist()
    meshdata = [str(v) for v in meshdata]
    if paintmode == 'FV':
      offset = numpy.cumsum([0]+[len(line) for line in F])
      meshdata = [','.join(labels[offset[i]:offset[i+1]]) for i in range(0,len(F))]

    meshdata_csv = self.tempfile('meshdata.csv')
    with open(meshdata_csv,'w') as fp:
      fp.write('\n'.join(meshdata))
    
    minmax = numpy.array(V,float)
    minmax = [
      ','.join([str(v) for v in minmax.min(axis=0)]),
      ','.join([str(v) for v in minmax.max(axis=0)])
    ]
    vertexlimits_csv = self.tempfile('vertexlimits.csv')
    with open(vertexlimits_csv,'w') as fp:
      fp.write('\n'.join(minmax))

    return FancyDict(
      vertexlimits_csv = vertexlimits_csv,
      meshdata_csv = meshdata_csv
    )
#endclass

if __name__ == '__main__':
  mainTask = MeshDataFromVolume.fromCommandLine()
  ans = mainTask.run()
