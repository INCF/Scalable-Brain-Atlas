% function [V,rgbList,acrList,scaling] = getTemplateAsVolume(template,sz)
%
% Get all regions from a given template in voxel space,
% by downloading png images for all slices, and replacing the RGB value 
% of each pixel by the corresponding 16-bit colormap index.
%
% inputs:
%   template - the name of a brain atlas template supported by the SBA, e.g., 'PHT00'
%   sz       - (optional, default 'M') the size of the rasterized slices:
%              the height of each slice is 256, 512 or 1024 pixels for 
%              sz equal to 'S','M' or 'L', repectively;
%              the width follows automatically from the slice's aspect ratio.
%
% outputs:
%   V        - 3-dimensional uint16 matrix with the slice position as the first coordinate,
%              and the XY pixel position as the 2nd and 3rd coordinates respectively.
%              Its values map into both 'rgbList' and 'acrList'
%   rgbList  - list of colors, with the 6-character hexadecimal RGB values used by the template
%   acrList  - list of acronyms, with short region names
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
%
% Rembrandt Bakker, 2010
%

function [V,rgbList,acrList,scaling] = getTemplateAsVolume(template,sz)

sz = eval('sz','''M''');
baseUrl = getBaseUrl();
% get the rgb2acr map as a N-by-2 cell array
tmp = urlread([baseUrl 'mfiles/get_rgb2acr.php'],'get',{'template',template});
rgb2acr = eval(char(tmp));
% make sure WHITE is part of the colormap
rgb2acr(end+1,:) = {'FFFFFF' '[]'};
% create an index map with numeric rgb as key
rgbList = rgb2acr(:,1);
[rgbdec,indx] = unique(hex2dec(rgbList),'first');
rgbList = rgb2acr(indx,1);
acrList = rgb2acr(indx,2);
rgbdec2indx = sparse(rgbdec+1,ones(size(rgbdec)),1:numel(rgbdec));

% get stereotaxic coordinate information
[scaling] = getScaling(template);
numSlices = numel(scaling.slicePosition);

% download the rasterized images and store them in V
fprintf('Loading %d slices...     ',numSlices);
for si=1:numSlices,
  fprintf('\b\b\b\b%04d',si);
  [tmp,map] = imread([baseUrl 'rgbslice.php?template=' template '&slice=' num2str(si) '&size=' sz]);
  if numel(size(tmp)) == 3,
		% depending on the installation of ImageMagick, the png's may have 16 bits per rgb channel instead of 8
		if isa(tmp,'uint16'), tmp = uint8(bitshift(tmp,-8)); end
		% convert the three rgb values to a single 32-bit number
		tmp = 256*256*uint32(tmp(:,:,1))+256*uint32(tmp(:,:,2))+uint32(tmp(:,:,3));
		% replace the 32-bit number by the 16-bit colormap index, stored in rgbdec2indx 
		% (subtract one because a zero uint16 number points to the first colormap entry)
		tmp = uint16(reshape(rgbdec2indx(tmp+1,1)-1,size(tmp)));
  else
    % dealing with an indexed-color png
    x100 = 256-1e-8;
    map2rgbdec = 256*256*floor(x100*map(:,1))+256*floor(x100*map(:,2))+floor(x100*map(:,3));
    tmp = uint16(reshape(rgbdec2indx(map2rgbdec(tmp(:)+1)+1,1)-1,size(tmp)));
    % THE ABOVE THREE LINES HAVEN'T BEEN TESTED YET
  end
  
  % store the slice in 3d matrix V
  if si==1,
    % reserve memory for 3d matrix V
    V = zeros(numSlices,size(tmp,2),size(tmp,1),'uint16');
  end
  V(si,:,:) = tmp';
end
fprintf('\b\b\b\bDone.\n');
