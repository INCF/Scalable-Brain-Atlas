function [A,slices,scaling] = getRegionMask(template,region,sz)

% function [A,slices,scaling] = getRegionMask(template,region,sz)
%
% downloads a series of png images containing the given region,
% puts them in voxel space, setting the region voxels to 255 and all other voxels to 0
%
% inputs:
%   template - the name of a brain atlas template supported by the SBA, e.g., 'PHT00'
%   region   - the name of the region to be visualized
%   sz       - (optional, default 'M') the size of the rasterized slices:
%              the height of each slice is 256, 512 or 1024 pixels for 
%              sz equal to 'S','M' or 'L', repectively;
%              the width follows automatically from the slice's aspect ratio.
%
% outputs:
%   A        - 3-dimensional uint8 matrix with the slice position as the first coordinate,
%              and the XY pixel position as the 2nd and 3rd coordinates respectively.
%              Voxels containing the region have value 255, all others are 0
%   slices   - the slices that (the first dimension of) A contains
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
% Rembrandt Bakker, 2010
%

sz = eval('sz','''M''');

baseUrl = getBaseUrl();

% get the rgb2acr map as a N-by-2 cell array
tmp = urlread([baseUrl 'mfiles/get_rgb2acr.php'],'get',{'template',template});
rgb2acr = eval(char(tmp));
% create an index map with numeric rgb as key 
rgbhex = rgb2acr(:,1);
rgbhex{end+1} = 'FFFFFF';
rgbdec1 = hex2dec(rgbhex)+1; % plus 1 because rgbhex can be 0
acronyms = rgb2acr(:,2);
rgbdec2indx = sparse(rgbdec1,ones(size(rgbdec1)),1:numel(rgbdec1));

% get start and end slice for the specified region
[baseUrl 'mfiles/get_region_slicerange.php'];
tmp = urlread([baseUrl 'mfiles/get_region_slicerange.php'],'get',{'template',template,'region',region});
sliceRange = eval(char(tmp))

% get all rgb values belonging to the specified region
tmp = urlread([baseUrl 'mfiles/get_region_rgbList.php'],'get',{'template',template,'region',region});
rgbList = eval(char(tmp))

% download the rasterized images, set the selected region to the value 255 and all other regions to 0
s0 = sliceRange(1)-1;
max_uint16 = intmax('uint16');
for s=sliceRange(1):sliceRange(2),
  s
  [tmp,map] = imread([baseUrl 'rgbslice.php?template=' template '&slice=' num2str(s) '&size=' sz]);
  if numel(size(tmp)) == 3,
    % depending on the installation of ImageMagick, the png's may have 16 bits per rgb channel instead of 8
    if isa(tmp,'uint16'), tmp = uint8(bitshift(tmp,-8)); end
    % convert the three rgb values to a single 32-bit number
    tmp = 256*256*uint32(tmp(:,:,1))+256*uint32(tmp(:,:,2))+uint32(tmp(:,:,3));
    % replace the 32-bit number by the 16-bit colormap index, stored in rgbdec2indx 
    % (subtract one because a zero uint16 number points to the first colormap entry)
    tmp = uint16(reshape(rgbdec2indx(tmp+1,1)-1,size(tmp)));
    % set all voxels that are part of the specified region to max_uint16
    for r=1:size(rgbList,1),
      rgbdec1 = hex2dec(rgbList(r,:))+1;
      rgbIndx = rgbdec2indx(rgbdec1)-1;
      tmp(find(tmp == rgbIndx)) = max_uint16;
    end
  else
    map2dec1 = 256*256*uint32(255*map(:,1))+256*uint32(255*map(:,2))+uint32(255*map(:,3))+1;
    % set all voxels that are part of the specified region to max_uint16
    tmp = uint16(tmp);
    for r=1:size(rgbList,1),
      rgbdec1 = hex2dec(rgbList(r,:))+1;
      idx = find(map2dec1==rgbdec1)-1;
      if isempty(idx),
        warning(['Slice ' num2str(s) ' contains no voxels for region ' acronyms{rgbdec2indx(rgbdec1)}]);
      else
        tmp(find(tmp == idx)) = max_uint16;
      end
    end
  end
  % set all other voxels to 0
  tmp(find(tmp ~= max_uint16)) = 0;
  % store the mask in 3d matrix A
  if s-s0==1,
    % reserve memory for 3d matrix A
    A = zeros(diff(sliceRange)+1,size(tmp,2),size(tmp,1),'uint8');
  end
  % the max_uint16 numbers will become max_uint8 (255) because A is a uint8 matrix
  A(s-s0,:,:) = tmp';
end

% get stereotaxic coordinate information
slices = sliceRange(1):sliceRange(2);
scaling = getScaling(template);

