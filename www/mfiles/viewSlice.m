% function A = viewSlice(template,sliceNo)
%
% downloads a png image of slice sliceNo for the specified template
% and displays it as a color image
%
% inputs:
%   template - the name of a brain atlas template supported by the SBA, e.g., 'PHT00'
%   sliceNo - the number of the slice to display
%   
% outputs:
%   A - the slice as an image matrix
%
%
% Rembrandt Bakker, 2010
%

function A=viewbrainslice(template,sliceNo)

A = imread(['http://scalablebrainatlas.incf.org/rgbslice.php?template=PHT00&slice=' num2str(sliceNo)]);
image(A);