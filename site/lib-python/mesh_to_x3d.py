import os,sys
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
import numpy
from fancypipe import *
from x3d_tools import LoadFaces,LoadVertices

class MeshToX3D(FancyTask):
  inputs = odict(
    ('vertices_csv',{'type':assertFile}),
    ('faces_csv',{'type':assertFile}),
    ('vertexlimits_csv',{'type':assertFile}),
    ('output_x3d',{'type':str}),
  )
  def main(self,faces_csv,vertices_csv,vertexlimits_csv,output_x3d,x3d_width=800,x3d_height=800):
    if isinstance(vertices_csv,list): V = vertices_csv
    else: V = LoadVertices().setInput(vertices_csv).getOutput('vertices')
    if isinstance(faces_csv,list): F = faces_csv
    else: F = LoadFaces().setInput(faces_csv).getOutput('faces')
    with open(vertexlimits_csv,'r') as fp:
      limits = fp.readlines()
    mn = [float(v) for v in limits[0].split(',')]
    mx = [float(v) for v in limits[1].split(',')]
    centerX = 0.5*(mx[0]+mn[0])
    centerY = 0.5*(mx[1]+mn[1])
    centerZ = 0.5*(mx[2]+mn[2])
    distanceW = 32*max(mx[0]-mn[0],mx[1]-mn[1])*x3d_height/x3d_width
    distanceH = 32*max(mx[0]-mn[0],mx[2]-mn[2])*x3d_width/x3d_height
    distance = max(distanceW,distanceH)
    position = '{},{},{}'.format(centerX-distance,centerY,centerZ)
    centerOfRotation = '{},{},{}'.format(centerX,centerY,centerZ)
    faces = ' -1 '.join([' '.join([str(v) for v in line]) for line in F])
    vertices = ' '.join([','.join([str(v) for v in line]) for line in V])

    with open(output_x3d,'w') as fp:
      fp.write('<X3D id="X3D_ROOT" width="{}px" height="{}px" profile="Interchange" version="3.2" xmlns:xsd="http://www.w3.org/2001/XMLSchema-instance" xsd:noNamespaceSchemaLocation="http://www.web3d.org/specifications/x3d-3.2.xsd">\n'.format(x3d_width,x3d_height))
      fp.write('<Scene id="X3D_SCENE">\n')
      fp.write('<Background id="X3D_BACKGROUND" skyColor="0 0 0"/>\n')
      fp.write('<Viewpoint id="X3D_VIEW" fieldOfView="0.032725" position="{}" description="Left" orientation="-0.57735 0.57735 0.57735 -2.0944" centerOfRotation="{}"/>\n'.format(position,centerOfRotation))
      fp.write('<NavigationInfo type="&quot;EXAMINE&quot; &quot;FLY&quot; &quot;ANY&quot;" speed="4" headlight="true"/>\n')
      fp.write('<DirectionalLight ambientIntensity="1" intensity="0" color="1 1 1"/>\n')
      fp.write('<Transform DEF="ROOT" translation="0 0 0">\n')
      fp.write('<Shape>\n')
      fp.write('<Appearance>\n')
      fp.write('<Material ambientIntensity="0" emissiveColor="0 0 0" diffuseColor="1 1 1" specularColor="0 0 0" shininess="0.0078125" transparency="0"/>\n')
      fp.write('</Appearance>\n')
      fp.write('<IndexedFaceSet id="X3D_SURF" creaseAngle="0.785" solid="false" colorPerVertex="false" normalPerVertex="false" coordIndex="{}">\n'.format(faces))
      fp.write('<Coordinate point="{}"/>\n'.format(vertices))
      fp.write('</IndexedFaceSet>\n')
      fp.write('</Shape>\n')
      fp.write('</Transform>\n')
      fp.write('</Scene>\n')
      fp.write('</X3D>\n')

    return FancyDict(
      output_x3d = output_x3d
    )
#endclass

if __name__ == '__main__':
  MeshToX3D.fromCommandLine().run()
