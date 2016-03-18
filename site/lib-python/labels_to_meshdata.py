import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import json,numpy,re
from fancypipe import *
sys.path.append('../nifti-tools')
import os.path as op
import nibabel,niitools
from x3d_tools import LoadFaces,LoadVertices,FaceCenters,FaceVertexCenters,IndexedPoints,LabelsFromVolume,VolumeFromLabels
from multilabelsmooth import MultiLabelSmooth
import time

def firstUpdate(*args):
  u = time.time()+1.0
  for f in args:
    u = min(u,op.getmtime(f)) if f and op.isfile(f) else 0.0
  return u

def lastUpdate(*args):
  u = 0.0;
  for f in args:
    if f: u = max(u,op.getmtime(f)) if f and op.isfile(f) else u
  return u
  
class LabelsToMeshdata(FancyTask):
  inputs = odict(
    ('faces_csv',{'type':assertFile}),
    ('vertices_csv',{'type':str}),
    ('labels_nii',{'type':assertFile}),
    ('multilabelfilter',{'type':assertList,'default':None}),
    ('colormap_json',{'type':assertFile}),
    ('labels_csv',{'type':str}),
    ('labelmode',{'type':str,'default':'F','help':'F: face-labels, V: vertex-labels, FV: face-vertex labels'}),
    ('label2rgb_csv',{'type':str}),
    ('mesh2labels_nii',{'type':str,'default':None})
  )
  def main(self,faces_csv,vertices_csv,labels_nii,multilabelfilter,colormap_json,labels_csv,labelmode,label2rgb_csv,mesh2labels_nii):
    if lastUpdate(faces_csv,vertices_csv,labels_nii) < firstUpdate(label2rgb_csv):
      FANCYDEBUG('SKIPPING LABELSTOMESHDATA!!!',labels_nii)
      return FancyDict(
        labels_csv = labels_csv,
        label2rgb_csv = label2rgb_csv
      )

    V = LoadVertices().setInput(vertices_csv).getOutput('vertices')
    if labelmode=='F':
      F = LoadFaces().setInput(faces_csv).requestOutput('faces')
      X = FaceCenters().setInput(F,V).requestOutput('centers')
    elif labelmode=='V':
      X = V
    elif labelmode=='FV':
      F = LoadFaces().setInput(faces_csv).getOutput('faces')
      X = FaceVertexCenters().setInput(F,V).requestOutput('centers')
    else:
      raise RuntimeError('Invalid labelmode "{}".'.format(labelmode))
    if multilabelfilter:
      labels_nii = MultiLabelSmooth().setInput(raw_nii=labels_nii,filter=multilabelfilter,ignore=[0]).getOutput('smoothed_nii')
    nii = nibabel.load(labels_nii)
    affine = nii.get_header().get_best_affine()
    labelVolume = nii.get_data()
    indexedPoints = IndexedPoints().setInput(
      X,affine
    )
    labelsFromVolume = LabelsFromVolume().setInput(
      labelVolume = labelVolume,
      points = indexedPoints.requestOutput('points'),
      bgIndex = 0
    )
    labels = labelsFromVolume.getOutput('labels').tolist()
    labels = [str(v) for v in labels]
    if labelmode == 'FV':
      offset = numpy.cumsum([0]+[len(line) for line in F])
      labels = [','.join(labels[offset[i]:offset[i+1]]) for i in range(0,len(F))]
    with open(labels_csv,'w') as fp:
      fp.write('\n'.join(labels))
    
    if mesh2labels_nii:
      VolumeFromLabels().setInput(
        points = indexedPoints.requestOutput('points'),
        labels = labelsFromVolume.requestOutput('labels'),
        reference = labels_nii,
        output = mesh2labels_nii
      ).getOutput()

    with open(colormap_json,'r') as fp:
      colormap = json.load(fp)
    if isinstance(colormap,dict):
      mx = 0;
      for k in colormap.keys(): 
        if int(k)>mx:
          mx=int(k)
      baseColor = 'AAAAAA'
      colormap = [colormap[str(i)] if str(i) in colormap else baseColor for i in range(0,mx+1)]
    colormap = [','.join(['{0:.3f}'.format(int(v[i:i+2], 16)/255.0) for i in range(0,6,2)]) for v in colormap]
    with open(label2rgb_csv,'w') as fp:
      fp.write('\n'.join(colormap))

    return FancyDict(
      labels_csv = labels_csv,
      label2rgb_csv = label2rgb_csv
    )
#endclass

if __name__ == '__main__':
  LabelsToMeshdata.fromCommandLine().run()
