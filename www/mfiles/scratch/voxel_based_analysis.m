A = zeros(size(nii.img)+2);
A(2:end-1,2:end-1,2:end-1) = nii.img;
szA = size(A);
nR = max(A(:));
borderVoxels = cell(nR,1);
for r=1:nR,
  % for each region, find all points belonging to that region.
  indx = find(A == r);
before = size(indx)
  [ii,jj,kk] = ind2sub(szA,indx);
  
  % remove all non-border points (checking 6 neighbors)
  nNeighbor =zeros(size(indx));
  nb = sub2ind(szA,ii-1,jj,kk);
  nNeighbor = nNeighbor+(A(nb)==r);
  nb = sub2ind(szA,ii+1,jj,kk);
  nNeighbor = nNeighbor+(A(nb)==r);
  nb = sub2ind(szA,ii,jj-1,kk);
  nNeighbor = nNeighbor+(A(nb)==r);
  nb = sub2ind(szA,ii,jj+1,kk);
  nNeighbor = nNeighbor+(A(nb)==r);
  nb = sub2ind(szA,ii,jj,kk-1);
  nNeighbor = nNeighbor+(A(nb)==r);
  nb = sub2ind(szA,ii,jj,kk+1);
  nNeighbor = nNeighbor+(A(nb)==r);
  indx(find(nNeighbor==6)) = [];
  
  % store result in borderVoxels
  borderVoxels{r} = indx;
after = size(indx)
end

% question: how many voxels of region rA have at least one border voxel in region rB?

% preliminary conclusion: in 3D, about 2/3 of all voxels are border voxels!
for r1=1:nR,
  bv1 = borderVoxels{1};
  [ii1,jj1,kk1] = ind2sub(size(A),bv1);  
  for r2=1:nR,
    bv2 = borderVoxels{2};
    [ii2,jj2,kk2] = ind2sub(size(A),bv1);  
    


3. for each region, find the nearest border point of every other region

180x180 matrix with minumum distances between regions.
take a colormap with 16 contrasting colors
