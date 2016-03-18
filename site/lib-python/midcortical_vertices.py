import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import numpy
from fancypipe import *
import nibabel
from x3d_tools import LoadFaces,LoadVertices

class MidCortical(FancyTask):
  inputs = odict(
    ('gm_vertices_csv',{'type':assertFile}),
    ('wm_vertices_csv',{'type':assertFile}),
    ('mid_vertices_csv',{'type':str}),
    ('mid_vertexlimits_csv',{'type':str}),
    ('wm_pct',{'type':float,'default':50.}),
  )
  def main(self,gm_vertices_csv,wm_vertices_csv,mid_vertices_csv,mid_vertexlimits_csv,wm_pct):
    V_gm = LoadVertices.fromParent(self).setInput(gm_vertices_csv).run().getOutput('vertices')
    V_gm = numpy.array(V_gm,float)

    V_wm = LoadVertices.fromParent(self).setInput(wm_vertices_csv).run().getOutput('vertices')
    V_wm = numpy.array(V_wm,float)
    
    V = V_gm*(1-0.01*wm_pct)+V_wm*0.01*wm_pct
    with open(mid_vertices_csv,'w') as fp:
      for line in V:
        fp.write(','.join([str(v) for v in line])+'\n')

    minmax = [
      ','.join([str(v) for v in V.min(axis=0)]),
      ','.join([str(v) for v in V.max(axis=0)])
    ]
    with open(mid_vertexlimits_csv,'w') as fp:
      fp.write('\n'.join(minmax))

    return FancyDict(
      mid_vertices_csv = mid_vertices_csv,
      mid_vertexlimits_csv = mid_vertexlimits_csv
    )
#endclass

if __name__ == '__main__':
  MidCortical.fromCommandLine().run()
