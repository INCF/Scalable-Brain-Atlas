import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import json,numpy,re
from fancypipe import *
sys.path.append('../nifti-tools')
import nibabel,niitools
from nibabel.affines import apply_affine

class WriteFaces(FancyTask):
  inputs = odict(
    ('F',dict(type=assertList)),
    ('faces_csv',dict(type=assertOutputFile,default=None))
  )
  def main(self,F,faces_csv):
    F = numpy.array(F,int)
    if faces_csv is None: faces_csv = self.tempfile('faces.csv')
    with open(faces_csv,'w') as fp:
      for line in F:
        fp.write(','.join([str(v) for v in line])+'\n')
    return FancyDict(
      faces_csv=faces_csv
    )

class WriteVertices(FancyTask):
  inputs = odict(
    ('V',dict(type=assertList)),
    ('vertices_csv',dict(type=assertOutputFile,default=None)),
    ('vertexlimits_csv',dict(type=assertOutputFile,default=None))
  )
  def main(self,V,vertices_csv,vertexlimits_csv):
    V = numpy.array(V,float)
    if vertices_csv is None: vertices_csv = self.tempfile('vertices.csv')
    if vertexlimits_csv is None: vertexlimits_csv = self.tempfile('vertexlimits.csv')
    with open(vertices_csv,'w') as fp:
      for line in V:
        fp.write(','.join([str(v) for v in line])+'\n')

    minmax = [
      ','.join([str(v) for v in V.min(axis=0)]),
      ','.join([str(v) for v in V.max(axis=0)])
    ]
    with open(vertexlimits_csv,'w') as fp:
      fp.write('\n'.join(minmax))
    return FancyDict(
      vertices_csv=vertices_csv,
      vertexlimits_csv=vertexlimits_csv
    )
#endclass    
    
class LoadFaces(FancyTask):
  #runParallel = True
  def main(self,facesFile):
    F = []
    with open(facesFile,'r') as fp:
      lines = fp.readlines()
      if re.search('\.topo$',facesFile):
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
            F.append(poly)       
      elif re.search('\.csv$',facesFile):
        for line in lines:
          line = [int(v) for v in line.split(',')]
          F.append(line)
      else:
        for line in lines:
          line = line.strip().split('\t')
          line = [int(float(line[i])) for i in range(0,3)]
          F.append(line)
    return FancyDict(faces=F)


class LoadVertices(FancyTask):
  #runParallel = True
  def main(self,verticesFile):
    V = []
    with open(verticesFile,'rb') as fp:
      lines = fp.readlines()
      if re.search('\.coord$',verticesFile):
        for iEnd,line in enumerate(lines):
          if line.strip() == 'EndHeader': break
        nV = int(lines[iEnd+1])
        iStart = iEnd+2
        for i in range(iStart,iStart+nV):
          line = lines[i].strip().split(' ')
          line = [float(line[i]) for i in range(1,4)]
          V.append(line)
      elif re.search('\.csv$',verticesFile):
        for line in lines:
          line = [float(v) for v in line.split(',')]
          V.append(line)
      else:
        for line in lines:
          line = line.strip().split('\t')
          line = [float(x) for x in line]
          V.append(line)
    return FancyDict(vertices=V)


class FaceCenters(FancyTask):
  #runParallel = True
  def main(self,F,V):
    centers = []
    for line in F:
      points = [V[i] for i in line]
      m = numpy.mean(points,axis=0)
      centers.append(m)
    return FancyDict(centers=centers)
  

class FaceVertexCenters(FancyTask):
  #runParallel = True
  def main(self,F,V):
    centers = []
    for line in F:
      points = numpy.array([V[i] for i in line],float)
      m = numpy.mean(points,axis=0)
      centers.extend([(p+m)*0.5 for p in points])
    return FancyDict(centers=centers)
  

class IndexedPoints(FancyTask):
  #runParallel = True
  def main(self,X,affine):
    inv_affine = numpy.linalg.inv(affine)
    shift05 = numpy.array([0.5,0.5,0.5])
    points = []
    for i,line in enumerate(X):
      points.append((apply_affine(inv_affine,line)+shift05).astype(int).tolist())
    return FancyDict(points=points)
  

class LabelsFromVolume(FancyTask):
  #runParallel = True
  def main(self,labelVolume,points,bgIndex):
    labels = numpy.zeros((len(points),),labelVolume.dtype)
    for f,fc in enumerate(points):
      sample = bgIndex
      try:
        sample = labelVolume[fc[0],fc[1],fc[2]]
      except:
        sample = bgIndex
      if sample == bgIndex:
        # If face center is in background voxel, try to find nearby non-background voxel.
        neighbors = [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,-1], [0,-1,-1],[0,-1,1],[0,1,-1],[0,1,1], [-1,0,-1],[-1,0,1],[1,0,-1],[1,0,1], [-1,-1,0],[-1,1,0],[1,-1,0],[1,1,0] ]
        for n in neighbors:
          try:
            sample = labelVolume[fc[0]+n[0],fc[1]+n[1],fc[2]+n[2]]
            if sample != bgIndex: break
          except:
            sample = bgIndex
      labels[f] = sample
    scaling = (None,None)
    if not numpy.issubdtype(labels.dtype,numpy.integer):
      mn = labels.min()
      mx = labels.max()
      if mx>mn:
        labels = (labels-mn)*255.9999/(mx-mn)
      labels = labels.astype(numpy.uint8)
      scaling = (mn,mx)
    return FancyDict(labels=labels,scaling=scaling)

class VolumeFromLabels(FancyTask):
  def main(self,points,labels,reference,output):
    nii = nibabel.load(reference)
    hdr = nii.get_header()
    q = nii.get_sform()
    img = numpy.zeros(hdr.get_data_shape(),hdr.get_data_dtype())
    for i,p in enumerate(points):
      try:
        img[p[0],p[1],p[2]] = labels[i]
      except IndexError:
        pass
    nii = nibabel.Nifti1Image(img,q)
    nibabel.save(nii,output)
    return FancyDict(output = output)

if __name__ == '__main__':
  # do nothing
  pass
