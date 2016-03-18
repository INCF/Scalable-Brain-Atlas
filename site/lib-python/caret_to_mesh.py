import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import numpy
from fancypipe import *
import nibabel
from x3d_tools import LoadFaces,LoadVertices

class SaveMesh(FancyTask):
  inputs = odict(
    ('surf_coord',{'type':assertFile}),
    ('surf_topo',{'type':assertFile}),
    ('faces_csv',{'type':str}),
    ('vertices_csv',{'type':str}),
    ('vertexlimits_csv',{'type':str})
  )
  def main(self,surf_coord,surf_topo,faces_csv,vertices_csv,vertexlimits_csv):
    F = LoadFaces.fromParent(self).setInput(surf_topo).run().getOutput('faces')
    F = numpy.array(F,int)
    with open(faces_csv,'w') as fp:
      for line in F:
        fp.write(','.join([str(v) for v in line])+'\n')
    
    V = LoadVertices.fromParent(self).setInput(surf_coord).run().getOutput('vertices')
    V = numpy.array(V,float)
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
      faces_csv = faces_csv,
      vertices_csv = vertices_csv,
      vertexlimits_csv = vertexlimits_csv
    )
#endclass

if __name__ == '__main__':
  SaveMesh.fromCommandLine().run()
