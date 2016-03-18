import sys
sys.path.append('../fancypipe')
from fancypipe import *
import os.path as op
import re
from x3d_tools import WriteVertices,WriteFaces
from midcortical_vertices import MidCortical
from freesurfer_to_mesh import FreesurferToMesh

class Freesurfer_MidCortical(FancyTask):
  inputs = odict(
    ('fsPial',dict(type=assertFile,short='pial')),
    ('fsWhite',dict(type=assertFile,short='white'))
  )
  inputs.extend(FreesurferToMesh.inputs,'originShift')
  inputs.extend(MidCortical.inputs,'wm_pct')
  
  def main(self,fsPial,fsWhite,originShift,wm_pct):
    pial_vertices_csv,faces_csv = FreesurferToMesh().setInput(
      fsPial,
      originShift = originShift
    ).getOutput('vertices_csv','faces_csv')
    
    white_vertices_csv = FreesurferToMesh().setInput(
      fsWhite,
      originShift = originShift
    ).getOutput('vertices_csv')

    midCortical = MidCortical().setInput(
      gm_vertices_csv = pial_vertices_csv,
      wm_vertices_csv = white_vertices_csv,
      mid_vertices_csv = self.tempfile('mid_vertices.csv'),
      mid_vertexlimits_csv = self.tempfile('mid_vertexlimits.csv'),
      wm_pct = wm_pct
    )
    return FancyDict(
      faces_csv = faces_csv,
      mid_vertices_csv = midCortical.requestOutput('mid_vertices_csv'),
      mid_vertexlimits_csv = midCortical.requestOutput('mid_vertexlimits_csv')
    )
#endclass

if __name__ == '__main__':
  Freesurfer_MidCortical.fromCommandLine().run()
