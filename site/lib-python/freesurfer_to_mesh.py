import sys
sys.path.append('../fancypipe')
from fancypipe import *
import os.path as op
import numpy,nibabel
from x3d_tools import WriteVertices,WriteFaces

def vtk_to_mesh(vtkSurf):
  V = []
  F = []
  with open(vtkSurf) as fp:
    i = 0
    line = fp.readline(); i+=1
    # skip comments
    while (line[0] == '#'): line = fp.readline(); i+=1
    if (line[0:3] != 'vtk'): raise RuntimeError('Expecting "vtk" at start of line {}'.format(i))
    line = fp.readline().strip(); i+=1
    if (line != 'ASCII'): raise RuntimeError('Expecting "ASCII" at line {}'.format(i))
    line = fp.readline().strip(); i+=1
    if (line != 'DATASET POLYDATA'): raise RuntimeError('Expecting "DATASET POLYDATA" at line {}'.format(i))
    line = fp.readline().strip(); i+=1
    line = line.split()
    if (line[0] != 'POINTS'): raise RuntimeError('Expecting "POINTS" at line {}'.format(i))
    numVertices = int(line[1])
    dtype = int if line[2] == 'integer' else float
    for n in range(0,numVertices):
      point = fp.readline().strip(); i+=1
      V.append([dtype(v) for v in point.split()])
    line = fp.readline().strip(); i+=1
    line = line.split()
    if (line[0] != 'POLYGONS'): raise RuntimeError('Expecting "POLYGONS" at line {}'.format(i))
    numFaces = int(line[1])
    for n in range(0,numFaces):
      point = fp.readline().strip(); i+=1
      point = [int(v) for v in point.split()]
      F.append(point[1:])
  return V,F
    
  
class FreesurferToMesh(FancyTask):
  inputs = odict(
    ('fsSurf',dict(type=assertFile,short='surf')),
    ('originShift',dict(type=assertList,short='shift',default=None,help='shift the origin by this amount [mm]'))
  )
  def main(self,fsSurf,originShift):
    baseName = op.basename(fsSurf)
    toVtk = FancyExec().setProg('mris_convert').setInput(
      '--to-scanner',
      fsSurf,
      self.tempfile('{}.vtk'.format(baseName))
    )
    vtkSurf = toVtk.getOutput(2)
    V,F = vtk_to_mesh(vtkSurf)
    if originShift:
      V = numpy.array(V)
      for i in range(0,V.shape[0]): V[i] += originShift
      V = V.tolist()
    writeVertices = WriteVertices().setInput(
      V,
      vertices_csv = self.tempfile('vertices.csv'),
      vertexlimits_csv = self.tempfile('vertexlimits.csv')
    )
    writeFaces = WriteFaces().setInput(
      F,
      faces_csv = self.tempfile('faces.csv')
    )
    return FancyDict(
      faces_csv = writeFaces.requestOutput('faces_csv'),
      vertices_csv = writeVertices.requestOutput('vertices_csv'),
      vertexlimits_csv = writeVertices.requestOutput('vertexlimits_csv')
    )
#endclass

if __name__ == '__main__':
  FreesurferToMesh.fromCommandLine().run()
