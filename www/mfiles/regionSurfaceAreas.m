% function [SA] = regionSurfaceAreas(A,scaling)
%
% inputs (obtained from getTemplateAsVolume):
%   A        - 3-dimensional uint16 matrix with the slice position as the first coordinate,
%              and the XY pixel position as the 2nd and 3rd coordinates respectively.
%              Its values map into both 'cmap' and 'acronyms'
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
% outputs:
%   SA       - list of region surface areas, in square mm
%
%
% Rembrandt Bakker, 2010
%

function [V] = regionSurfaceAreas(A,cmap,scaling,V)

nR = max(max(max(A)))+1;
for r=1:nR,
  r
  B = zeros(size(A),'uint8');
  B(find(A==r-1)) = 255;
  % CONTINUE HERE WITH ISOSURFACE  
  FV = isosurface(B);
  FV.vertices = scaleVertices(FV.vertices,scaling);
end
