% function [centers] = regionCenters_2d(A)
%
% inputs (obtained from getTemplateAsVolume):
%   A        - 3-dimensional uint16 matrix with the slice position as the first coordinate,
%              and the XY pixel position as the 2nd and 3rd coordinates respectively.
%              Its values map into rgbList and acrList.
%

function [centers] = regionCenters_3d(A,bg)

if nargin<2, bg=A(1,1,1); end
[nS,nI,nJ] = size(A);

nR = double(max(A(:)+1));

fprintf('Calculating 2D region centers...     ');
centers = cell(nS,1);
for si=1:nS,
  fprintf('\b\b\b\b%04d',si);
  centers{si} = zeros(nR,2);
  A_s = squeeze(A(si,:,:));
  
  regions = zeros(nR,1);
  for pass=1:1000,
    % update A
    A_prev = A_s;
    [A_s,adj] = peel(A_s,bg);

    % update regions
    regions_prev = regions;
    regions = zeros(nR,1);
    regions(unique(A_s)+1) = 1;

    % deal with lost regions
    lostRegions = find(regions ~= regions_prev);
    for i=1:numel(lostRegions),
      r = lostRegions(i);
      ai = sort(find(A_prev==r-1));
      ai(ceil(numel(ai)/2)); % middle value of ai
      [jj,kk] = ind2sub(size(A_s),ai(ceil(numel(ai)/2)));    
      centers{si}(r,:) = [kk jj]; % slice,left,top
    end
    if sum(regions)==1, break; end
  end
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
A0(2:end-1,2:end-1) = A;
adj = zeros(size(A),'uint8');
for j=[1 2 3],
  for k=[1 2 3],
    adj = adj+uint8(A0(j:end-3+j,k:end-3+k)==A);
  end
end
A(find(adj<=7)) = bg;