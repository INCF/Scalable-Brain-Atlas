function vtc = scaleVertices(vtc,scaling,slices,sizeA)

% NOTE: if the 3-dimensional source matrix for the vertices has coordinates S,X,Y,
%       then the vertices produced by 'isosurface' have coordinates X,S,Y

% scaling the slice position
% distance between slices
slicePos = scaling.slicePosition(slices)';
dPos = diff(slicePos);
dPos = [dPos(1); dPos(:); dPos(end)];
sliceIndx = round(vtc(:,2));
pos = slicePos(sliceIndx);
err = vtc(:,2)-sliceIndx;
% case 1: vertex position slightly beyond the nearest slice
indx = find(err>0);
pos(indx) = pos(indx)+err(indx).*(dPos(sliceIndx(indx)+1));
% case 1: vertex position slightly before the nearest slice
indx = find(err<0);
pos(indx) = pos(indx)+err(indx).*(dPos(sliceIndx(indx)));
vtc(:,2) = pos;

% assume that the xy scaling is the same for every slice; otherwise use average scaling
boundingBox = scaling.boundingBox;
%%xyScaling = mean(scaling.xyScaling,1);

bb = scaling.boundingBox;
cf = scaling.sliceCoordFrame;
% scaling the x-coordinate of the slice
xLim = scaling.sliceXLim;
xSvg = bb(1)+((vtc(:,1)-0.5)./sizeA(2))*bb(3);
vtc(:,1) = xLim(1)+(xSvg-cf(1))/cf(3)*diff(xLim);
% scaling the y-coordinate of the slice
yLim = scaling.sliceYLim;
ySvg = bb(2)+((vtc(:,3)-0.5)./sizeA(3))*bb(4);
vtc(:,3) = yLim(1)+(1-(ySvg-cf(2))/cf(4))*diff(yLim);

