% function [C] = regionCenters(s,A_slice,cmap,scaling)
%
% inputs:
%   s        - slice number
%   A_slice  - 2-dimensional uint16 matrix with the XY pixel position as coordinates.
%              Its values map into 'cmap'
%   cmap     - list of colors, with the original RGB values used by the template
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
% outputs:
%   C        - list of region centers, in stereotaxic coordinates
%
%
% Rembrandt Bakker, 2010
%

function [V] = regionCenters(s,A_slice,cmap,scaling)

xyScaling = scaling.xyScaling;
if size(xyScaling,1) > 1, xyScaling = xyScaling(s,:); end
nR = size(cmap,1);
C = zeros(nR,1);

pix = sort(slice(:));
indx = [1; find(diff(pix))+1];
numPix = diff([indx; numel(pix)+1]);
V(pix(indx)+1) = V(pix(indx)+1)+numPix*voxelVolume;
