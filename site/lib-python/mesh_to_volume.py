import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import json,numpy,re
from fancypipe import *
sys.path.append('../nifti-tools')
import nibabel,niitools
from x3d_tools import LoadFaces,LoadVertices,FaceCenters,FaceVertexCenters,IndexedPoints,VolumeFromLabels
from multilabelsmooth import MultiLabelSmooth

class MeshToLabelVolume(FancyTask):
  inputs = odict(
    ('faces_csv',{'type':assertFile}),
    ('vertices_csv',{'type':str}),
    ('labels_nii',{'type':assertFile}),
    ('volume_nii',{'type':assertList,'default':None})
  )
  def main(self,faces_csv,vertices_csv,labels_nii,volume_nii):
    V = LoadVertices().setInput(vertices_csv).getOutput('vertices')
    F = LoadFaces().setInput(faces_csv).getOutput('faces')
    X = FaceCenters().setInput(F,V).getOutput('centers')
    nii = nibabel.load(labels_nii)
    affine = nii.get_header().get_best_affine()
    points = IndexedPoints().setInput(X,affine).getOutput('points')
    if volume_nii is None: volume_nii = self.tempfile('volume.nii.gz')
    output_nii = VolumeFromLabels().setInput(
      points = points,
      labels = numpy.zeros((len(points),),numpy.uint8)+255,
      reference = labels_nii,
      output = volume_nii
    ).getOutput('output')
    return FancyDict(
      volume_nii = output_nii
    )
#endclass

if __name__ == '__main__':
  MeshToLabelVolume.fromCommandLine().run()
