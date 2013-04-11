% function [volumes] = regionVolumes(V,scaling)
%
% inputs (obtained from getTemplateAsVolume):
%   V        - 3-dimensional uint16 matrix with the slice position as the first coordinate,
%              and the XY pixel position as the 2nd and 3rd coordinates respectively.
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
% outputs:
%   volumes        - list of region volumes, indexed by region index, in cubic mm
%
%
% Rembrandt Bakker, 2010
%

function [volumes] = regionVolumes(V,scaling)

nR = max(max(max(V)))+1;
sliceThickness = abs(diff(scaling.slicePosition));
sliceThickness = [sliceThickness(1); 0.5*(sliceThickness(1:end-1)+sliceThickness(2:end)); sliceThickness(end)];
mmPerSvgUnit_x = diff(scaling.sliceXLim)/scaling.sliceCoordFrame(3);
mmPerSvgUnit_y = diff(scaling.sliceYLim)/scaling.sliceCoordFrame(4);
pixWidth = abs(scaling.boundingBox(3)/size(V,2)*mmPerSvgUnit_x);
pixHeight = abs(scaling.boundingBox(4)/size(V,3)*mmPerSvgUnit_y); 
volumes = zeros(nR,1);
fprintf('Calculating %d region volumes...     ',size(V,1));
% debug...
meanSliceThickness = mean(sliceThickness)
pixWidth
pixHeight

for si=1:size(V,1),
  fprintf('\b\b\b\b%04d',si);
  A_s = squeeze(V(si,:,:));
  voxelVolume = sliceThickness(si)*pixWidth*pixHeight;
  tmp = sort(A_s(:));
  indx = [1; find(diff(tmp))+1];
  numPix = diff([indx; numel(tmp)+1]);
  volumes(tmp(indx)+1) = volumes(tmp(indx)+1)+numPix*voxelVolume;
end
fprintf('\b\b\b\bDone.\n');
