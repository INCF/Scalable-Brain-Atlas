% function hP = viewRegionMask(A,slices,scaling,R,kSize)
%
% displays a 3D-rendering of the region mask obtained by getRegionMask
%
% inputs (all obtained by getRegionMask):
%   A       - the region mask, with in its three dimensions
%             1) the coronal slice position; 2) left-right position; and 3) dorsal-ventral position
%   slices  - the slices that (the first dimension of) A contains
%   scaling - scaling data, lining voxel space to stereotaxic coordinates
%   R       - (optional, default=0.1) reduces the number of faces in the patch 
%              object while preserving its shape:
%             . if R>1, R is the number of faces in the patch object
%             . if 0<R<=1, R is the factor by which the number of faces is reduced
%   kSize   - size of the smoothing kernel (see help smooth3); default [3 3 3],
%             use 1 for no smoothing.
%             
% outputs:
%   hP      - handle to the patch object which represents the 3D surface
%             representation of A
%
%
% Rembrandt Bakker, 2010
%

function [hP,hL] = viewRegionMask(A,slices,scaling,R,kSize)

R = eval('R','[]');
if isempty(R), R = 0.1; end
kSize = eval('kSize','[]');
if isempty(kSize), kSize = [3 3 3]; end

clf;
%B = zeros(size(A)+2,class(A));
%B(2:end-1,2:end-1,2:end-1) = A;
hP = patch(isosurface(smooth3(A,'box',kSize),128),'FaceColor','blue','EdgeColor','none');
reducepatch(hP,R);

% scale the vertices
vertices = get(hP,'vertices');
disp(['Number of vertices: ' num2str(size(vertices,1))]);
vertices = scaleVertices(vertices,scaling,slices,size(A));
set(hP,'vertices',vertices);
disp('Applied scaling to vertices');

% color the faces to get more depth
cdata = angle(complex(vertices(:,1)-0.5*max(vertices(:,1))-0.5*min(vertices(:,1)),vertices(:,3)-0.5*max(vertices(:,3))-0.5*min(vertices(:,3))));
set(hP,'FaceVertexCData',cdata,'CDataMapping','scaled','facecolor','flat');
colormap(hsv);

axis vis3d tight
az = 120;
el = 20;
view(az,el);
lighting flat;
camlight(az,el);

% again: isosurface flips the first two dimensions of A
ylabel('slice position [mm]');
xlabel('left-right [mm]');
zlabel('dorsal-ventral [mm]');
if mean(diff(scaling.slicePosition))<0, set(gca,'YDir','reverse'); end
mmPerSvgUnit_x = diff(scaling.sliceXLim)/scaling.sliceCoordFrame(3);
mmPerSvgUnit_y = diff(scaling.sliceYLim)/scaling.sliceCoordFrame(4);
if mmPerSvgUnit_x<0, set(gca,'XDir','reverse'); end
if mmPerSvgUnit_y<0, set(gca,'ZDir','reverse'); end
box on;
