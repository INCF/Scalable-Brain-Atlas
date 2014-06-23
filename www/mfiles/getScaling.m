function [scaling] = getScaling(template)

% function [scaling] = getScaling(template,slices)
%
% downloads scaling parameters for the given slices
%
% inputs:
%   template - the name of a brain atlas template supported by the SBA, e.g., 'PHT00'
%
% outputs:
%   scaling  - scaling parameters linking voxel space to stereotaxic coordinates
%
% Rembrandt Bakker, 2010
%

baseUrl = getBaseUrl();
tmp = urlread([baseUrl 'mfiles/get_config.php'],'get',{'template',template});
[config,tp] = json_decode(tmp);
tmp = urlread([baseUrl 'mfiles/get_slicepos.php'],'get',{'template',template});
[slicePos,tp] = json_decode(tmp);
scaling.slicePosition = slicePos;
scaling.boundingBox = config.v_boundingBox;
scaling.sliceXLim = config.v_sliceXLim;
scaling.sliceYLim = config.v_sliceYLim;
scaling.sliceCoordFrame = config.v_sliceCoordFrame;
scaling.sliceRange = config.v_sliceRange;
