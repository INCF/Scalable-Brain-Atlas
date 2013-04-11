% function [V] = regionVolumes(A,cmap,scaling)
%
% inputs (obtained from getTemplateAsVolume):
%   A        - 3-dimensional uint16 matrix with the slice position as the first coordinate,
%              and the XY pixel position as the 2nd and 3rd coordinates respectively.
%              Its values map into both 'cmap' and 'acronyms'
%   cmap     - list of colors, with the original RGB values used by the template
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
% outputs:
%   V        - list of region volumes, in cubic mm
%
%
% Rembrandt Bakker, 2010
%

function [V] = regionVolumes(A,cmap,scaling)

nR = size(cmap,1);
sliceThickness = abs(diff(scaling.slicePosition));
sliceThickness = [sliceThickness(1); 0.5*(sliceThickness(1:end-1)+sliceThickness(2:end)); sliceThickness(end)];
xyScaling = scaling.xyScaling;
if size(xyScaling,1) == 1, xyScaling = xyScaling(ones(size(sliceThickness)),:); end
V = zeros(nR,1);
for s=1:size(A,1),
  s
  slice = squeeze(A(s,:,:));
  pixWidth = abs(scaling.boundingBox(3)/size(A,2)*xyScaling(s,2));
  pixHeight = abs(scaling.boundingBox(4)/size(A,3)*xyScaling(s,4)); 
  voxelVolume = sliceThickness(s)*pixWidth*pixHeight;
  pix = sort(slice(:));
  indx = [1; find(diff(pix))+1];
  numPix = diff([indx; numel(pix)+1]);
  V(pix(indx)+1) = V(pix(indx)+1)+numPix*voxelVolume;
end
