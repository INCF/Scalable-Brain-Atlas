% read an image from file and converts it to an indexed color image
%
% inputs:
%   fname - image file name, for any format supported by Matlab's imread function
%
% outputs:
%   A     - indexed color uint8 or uint16 matrix
%   cmap  - colormap, with row number corresponding to (color index + 1)
%           and columns containing rgb values scaled between 0 and 1

function [paths,path2color] = indexedColorImage(fname,debug)

% add xmltree to path
if isempty(which('xmltree')), 
  [pathstr,name,ext] = fileparts(mfilename('fullpath'));  
[pathstr filesep 'xmltree']  
  addpath([pathstr filesep 'xmltree']); 
end

[pathstr,name,ext] = fileparts(fname)
[A,cmap] = imread(fname);
sizeA = size(A);
% convert to indexed color image, if necessary
if numel(sizeA)>2 & sizeA(3)==3,
  [A,hexColors] = rgb2indexedColor(A);
  cmap = rgbList2colorMap(hexColors);
end
tmpfile = [pathstr filesep 'temp_img2svg.bmp'];
paths = {};
path2color = [];
for i=1:size(hexColors,1),
  svg = potrace(A,i-1,hexColors)
  xml = xmltree(svg);
  uid = find(xml,'/svg/g/path')
  for p=1:numel(uid),
    s = get(xml,uid(p),'attributes');
    if numel(s)>0,
      d = s{1}.val;
      paths{end+1} = d;
      path2color(end+1) = hex2dec(hexColors(i,:));
    end
  end
end
for i=1:numel(paths),
  disp(['<path fill="#' dec2hex(path2color(i),6) '" d="' paths{i} '"/>']);
end