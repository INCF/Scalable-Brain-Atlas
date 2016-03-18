# Rembrandt Bakker, Dhruv Kohli, Piotr Majka, June 2014
import sys,os
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
sys.path.append('../nifti-tools')
from fancypipe import *
import os.path as op
import json
import numpy,nibabel
from nibabel.affines import apply_affine
  
class NiftiToCenters(FancyTask):
  inputs = odict(
    ('input_nii', dict(type=assertFile, help="Input Nifti file")),
    ('origin_override', dict(type=assertList, default=None, help="Override origin (i0,j0,k0)")),
    ('index2rgb_json', dict(type=assertFile, default=None, help="Index to rgb map")),
    ('rgbcenters_json', dict(type=str, help="Output rgb center file")),
    ('rgbvolumes_json', dict(type=str, help="Output rgb volume file"))
  )
  def main(self,input_nii,origin_override,index2rgb_json,rgbcenters_json,rgbvolumes_json):
    nii = nibabel.load(input_nii)
    hdr = nii.get_header()
    q = hdr.get_best_affine();
    if origin_override:
      q[0:3,3] = -q[0:3,0:3].dot(origin_override)
    voxVol = numpy.linalg.det(q)
    img = nii.get_data().squeeze();

    labels = numpy.unique(img)
    rgbcenters = {}
    rgbvolumes = {}
    unmapped = []
    for b in labels:
      tmp = numpy.argwhere(img==b)
      xyz = apply_affine(q,tmp.mean(axis=0)).round(3).tolist()
      vol = numpy.round(tmp.shape[0]*voxVol,3)
      rgbcenters[b] = xyz
      rgbvolumes[b] = vol

    if index2rgb_json:
      with open(index2rgb_json,'r') as fp:
        index2rgb = json.load(fp)
        rgbcenters = {index2rgb[b]:ctr for b,ctr in rgbcenters.items()}
        rgbvolumes = {index2rgb[b]:vol for b,vol in rgbvolumes.items()}

    with open(rgbcenters_json,'w') as fp:
      json.dump(rgbcenters,fp)
    with open(rgbvolumes_json,'w') as fp:
      json.dump(rgbvolumes,fp)

    return FancyDict(
      rgbcenters_json=rgbcenters_json,
      rgbvolumes_json=rgbvolumes_json,
      unmapped=unmapped
    )

if __name__ == '__main__':
  NiftiToCenters.fromCommandLine().run()
