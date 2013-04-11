% function [A,hexColors] = rgb2indexedColor(A,hexColors)
%
% converts an RGB-image matrix (m by n by 3) to 
% an indexed color matrix (m by n, uint16),
% using either the provided list of colors (in 6-digit hexadecimal format)
% or, alternatively, the list of unique colors found in A
%
% inputs:
%   A         - m by n by 3 matrix, representing an RGB image
%   hexColors - (optional) list of colors used by A, in 6-digit hexadecimal format
%               the value a_ij in A maps to row (a_ij+1) in hexColors
%
% outputs:
%   A         - m by n matrix (uint16), representing an indexed color image
%   hexColors - (optional) list of colors used by A, in 6-digit hexadecimal format;
%               the value a_ij in A maps to row (a_ij+1) in hexColors

function [A,hexColors] = rgb2indexedColor(A,hexColors)

if isa(A,'uint16'), A = uint8(bitshift(A,-8)); end
% convert rgb values in A to 32-bit representations
A = 256*256*uint32(A(:,:,1))+256*uint32(A(:,:,2))+uint32(A(:,:,3));
if nargin<2,
  % put unique colors in A into vector rgbUnique
  colors = double(unique(A));
  hexColors = dec2hex(colors,6);
else
  colors = hex2dec(hexColors);
end
% create a mapping to indexed color
colors2indx = sparse(colors,ones(size(colors)),1:numel(colors));
% convert A to indexed color representation
A = uint16(reshape(colors2indx(A,1)-1,size(A)));
