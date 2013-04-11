% function cmap = rgbList2colorMap(rgbList)
%
% converts list of 6-character hexadecimal RGB values
% to a Matlab colormap, with values between 0 and 1

function cmap = rgbList2colorMap(rgbList)

if iscell(rgbList),
  numColors = numel(rgbList);
  cmap = zeros(numCOlors,3);
  for i=1:numColors,
    rgb = rgbList{i,:};
    cmap(i,:) = [hex2dec(rgb(1:2)) hex2dec(rgb(3:4)) hex2dec(rgb(5:6))]/256;
  end
else 
  numColors = size(rgbList,1);
  cmap = zeros(numCOlors,3);
  for i=1:numColors,
    rgb = rgbList(i,:);
    cmap(i,:) = [hex2dec(rgb(1:2)) hex2dec(rgb(3:4)) hex2dec(rgb(5:6))]/256;
  end
end