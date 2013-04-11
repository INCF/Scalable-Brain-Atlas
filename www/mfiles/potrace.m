% function svg = potrace(A,value,hexColors)
%

function svg = potrace(A,value,hexColors)

[pathstr,name,ext] = fileparts(mfilename('fullpath'));
[poPath] = fileparts([pathstr filesep '..' filesep '..' filesep 'development' filesep 'potrace' filesep])
tmpfile = [poPath filesep 'DELETE_ME.BMP']

if 0,
  sizeA = size(A);
  A = (A==value);
  B = zeros(sizeA+1);
  B(2:end,2:end) = A;
  B(2:end,1:end-1) = B(2:end,1:end-1) + A;
  B(1:end-1,2:end) = B(1:end-1,2:end) + A;
  B(1:end-1,1:end-1) = B(1:end-1,1:end-1) + A;
  B(2:end-1,2:end-1) = B(2:end-1,2:end-1)/4;
  B([1 end],2:end-1) = B([1 end],2:end-1)/2;
  B(2:end-1,[1 end]) = B(2:end-1,[1 end])/2;

  B = (B <= 0.49);
  imwrite(B,tmpfile);
end

imwrite(A~=value,tmpfile);

% svg is written 'upside down', values are integers, pixel coords. multiplied by 100
cmd = ['"' poPath filesep 'potrace" "' tmpfile '" -a 0.0 -O 0.0 -t 1 -s -u 100 -r 72 -o "-" -C #' hexColors(value+1,:)];
[status,svg] = system(cmd);