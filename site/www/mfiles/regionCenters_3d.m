% function [centers] = regionCenters_3d(V)
%
% inputs (obtained from getTemplateAsVolume):
%   V       - 3-dimensional uint16 matrix with the slice (=Y) position as the first coordinate,
%              and the XZ pixel position as the 2nd and 3rd coordinates, respectively.
%

function [centers,bg] = regionCenters_3d(V,bg)

if nargin<2, bg=V(1,1,1); end
[nS,nI,nJ] = size(V);

nR = double(max(V(:)+1));
regions = zeros(nR,1);

fprintf('Calculating 3D region centers...     ');
centers = zeros(nR,3);
for pass=1:1000,
  fprintf('\b\b\b\b%04d',pass);

  % update V
  V_prev = V;
  [V,adj] = peel(V,bg);

  % update regions
  regions_prev = regions;
  regions = zeros(nR,1);
  regions(unique(V)+1) = 1;

  % deal with lost regions
  lostRegions = find(regions ~= regions_prev);
  for i=1:numel(lostRegions),
    r = lostRegions(i);
    ai = find(V_prev==r-1);
    aiSelect = ai(ceil(numel(ai)/2)); % middle value of ai
    [ii,jj,kk] = ind2sub(size(V),aiSelect);
    centers(r,:) = [ii jj kk]; % slice,left,top
  end
  if sum(regions)==1, break; end
end
fprintf('\b\b\b\bDone.\n');

%%%%
%
%%%
%
%

function [A,adj] = peel(A,bg)

bg = uint16(bg);
A0 = bg(ones(size(A)+2));
A0(2:end-1,2:end-1,2:end-1) = A;
adj = zeros(size(A),'uint8');
for i=[1 2 3],
  for j=[1 2 3],
    for k=[1 2 3],
      adj = adj+uint8(A0(i:end-3+i,j:end-3+j,k:end-3+k)==A);
    end
  end
end
A(find(adj<=20)) = bg;