% function A = viewregion3d(template,region)
%
% downloads a series of png images containing the given region,
% puts them in voxel space, gets the isosurface and displays it in 3d
%

function [A,cmap] = viewregion3d(template,region)

% get the original SVG boundingbox
A = urlread('http://scalablebrainatlas.incf.org/mfiles/get_boundingBox.php','get',{'template',template});
boundingBox = eval(char(A))

% get the rgb2acr map as a N-by-2 cell array
A = urlread('http://scalablebrainatlas.incf.org/mfiles/get_rgb2acr.php','get',{'template',template});
rgb2acr = eval(char(A));
% create an index map with numeric rgb as key 
rgbhex = rgb2acr(:,1);
rgbhex{end+1} = 'FFFFFF';
rgbdec = hex2dec(rgbhex);
acronyms = rgb2acr(:,2);
rgbdec2indx = sparse(rgbdec,ones(size(rgbdec)),1:numel(rgbdec));
% create the color map
cmap = zeros(numel(rgbhex),3);
for i=1:numel(rgbhex),
  rgb = rgbhex{i};
  cmap(i,:) = [hex2dec(rgb(1:2)) hex2dec(rgb(3:4)) hex2dec(rgb(5:6))]/255;
end

% get start and end slice for the specified region
A = urlread('http://scalablebrainatlas.incf.org/mfiles/get_region_sliceRange.php','get',{'template',template,'region',region});
sliceRange = eval(char(A))

% get all rgb values belonging to the specified region
A = urlread('http://scalablebrainatlas.incf.org/mfiles/get_region_rgbList.php','get',{'template',template,'region',region});
rgbList = eval(char(A))

% download the rasterized images, and cut out the selected region
s0 = sliceRange(1)-1;
max_uint16 = intmax('uint16');
for s=sliceRange(1):sliceRange(2),
  s
  tmp = imread(['http://scalablebrainatlas.incf.org/rgbslice.php?template=' template '&slice=' num2str(s)]); 
  if isa(tmp,'uint16'), tmp = uint8(bitshift(tmp,-8)); end
  tmp = 256*256*uint32(tmp(:,:,1))+256*uint32(tmp(:,:,2))+uint32(tmp(:,:,3));
  tmp = uint16(reshape(rgbdec2indx(tmp,1)-1,size(tmp)));
  for r=1:size(rgbList,1),
    rgbdec = rgbdec2indx(hex2dec(rgbList(r,:)))-1;
    tmp(find(tmp == rgbdec)) = max_uint16;
  end
  tmp(find(tmp ~= max_uint16)) = 0;
  %tmp(find(tmp == max_uint16)) = 1;
  if s-s0==1,
    A = zeros(diff(sliceRange)+1,size(tmp,1),size(tmp,2),'uint8');
  end
  A(s-s0,:,:) = tmp;
end


if 0,
%TO DO: proper stereotaxic coordinates: all axes in [mm]
% get all face surface area's and border regions!!!
% output total surface area and total volume.
% ½ |V0V1 × V0V2|.
%fx(2,:)-fx(1,:) 
%
% render the structure in 3d
p = patch(isosurface(A,128),'FaceColor', 'blue', 'EdgeColor', 'none');
reducepatch(p,0.1);

pX = get(p,'XData');
pY = get(p,'YData');
pZ = get(p,'ZData');
d21 = sqrt((pX(2,:)-pX(1,:)).^2+(pY(2,:)-pY(1,:)).^2+(pZ(2,:)-pZ(1,:)).^2);
d31 = sqrt((pX(3,:)-pX(1,:)).^2+(pY(3,:)-pY(1,:)).^2+(pZ(3,:)-pZ(1,:)).^2);
d32 = sqrt((pX(3,:)-pX(2,:)).^2+(pY(3,:)-pY(2,:)).^2+(pZ(3,:)-pZ(2,:)).^2);
s = (d21+d31+d32)./2;
pMid = [mean(pX); mean(pY); mean(pZ)];
pArea = sqrt(abs(s.*(s-d21).*(s-d31).*(s-d32)));

a=norm(v1-v2);  % length of first side
    b=norm(v1-v3);
    c=norm(v2-v3);

axis vis3d tight
camlight; lighting flat;
box on;
end