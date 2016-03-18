<html><head><meta http-equiv="content-type" content="text/html; charset=UTF-8"></head><body>
<h2>Template data storage</h2>
The SBA stores atlas template data as a set of plain text files, each containing a data object in Javascript Object Notation (JSON). The data for template X are stored in the folder https://scalablebrainatlas.incf.org/X/template, valid values of X are listed here: <a href="https://scalablebrainatlas.incf.org/services/listtemplates.php">https://scalablebrainatlas.incf.org/services/listtemplates.php</a>.
<p>
Each template folder contains the following files (version 2):<ul>
<li>config.json – metadata and configuration parameters, as specified in the next section.</li>
<li>rgb2acr.json – contains a mapping from each region-ID to the region’s acronym. The region-ID is encoded as a Red-Green-Blue (RGB) value with two hexadecimal values for each channel.
Acronyms do not need to have a region-ID in these cases:<ol>
<li>The acronym is part of the template but no shape data is provided</il>
<li>The acronym represents a superstructure that has no shape data of its own.</li></ol></li>
<li>acr2full.json – contains a mapping from each brain region acronym (abbreviation) to its full name. 
If no full name is defined for an acronym, its region-ID is used instead.</li>
<li>acr2parent.json – contains a mapping from a brain region acronym to its parent acronym, to construct a hierarchy (optional).</li>
<li>alias2acr.json – contains a mapping from alternative brain region names (aliases) to the standard acronym (optional).</li>
<li>svgpaths.json – contains a list of all shape data, encoded as SVG-paths, in the template (i.e. for all regions in all slices). The list index is called path-ID.</li>
<li>brainslices.json – contains for each slice-ID a list that contains, for each region-ID that is visible in the slice, a list of path-IDs that make up the region.</li>
<li>brainregions.json – contains for each region-ID a list that contains, for each slice-ID that contains the region, a list of path-IDs that make up the region.</li>
<li>hulls.json – contains for each slice-ID an SVG-path that represents its convex hull.
<li>slicepos.json – contains the position of each slice in millimeters from the reference point defined in config.json</li>
<li>origslicepos.json – same as slicepos.json, but now for each slice in the original data set.</li>
<li>rgbvolumes.json – the volume of each region in cubic millimeters</li>
<li>rgbcenters.json – the centerpoint of each region in stereotactic coordinates. The centerpoint is obtained by peeling of the region until a single pixel remains. This procedure ensures that the centerpoint lies inside the region (unlike the center of gravity).</li>
</ul>
</p><p>
In the above, slice-ID refers to the SBA internal coronal slice numbering, which starts at 0 for the most anterior slice. SBA downsamples coronal slices to arrive at a total of 100-150 slices.
</p>
<h2>Configuration parameters</h2>
The file config.json contains the following parameters (version 2):<ul>
<li>version – the version number of the config file.</li>
<li>release – the maturity of the template, either “alpha”, “beta”, or “stable”.</li>
<li>species – the animal species.</li>
<li>ncbiName – the species name according to the ncbi taxonomy database http://www.ncbi.nlm.nih.gov/taxonomy.</li>
<li>ncbiId – the species ID of the NCBI taxonomy database.</li>
<li>nlxName – the species name according to the Neuroscience lexicon http://neurolex.org.</li>
<li>nlxId – the species ID as used by NeuroLex.</li>
<li>templateName –full name of the template.</li>
<li>boundingBox – bounding box in SVG coordinates of a coronal slice, the same bounding box is used for all slices. Bounding box contains four numbers: Left, Bottom, Width, Height.</li>
<li>whiteMatterAcronyms – list of acronyms that should get a lighter color in the slice viewer.
Example: [“cc”].</li>
<li>slicePositionUnit – the units of the posterior-anterior slice positions stored in slicepos.json.</li>
<li>slicePositionDescription – the description of the slice positions stored in slicepos.json. Example: “anterior distance to center of anterior commissure”.</li>
<li>sliceUnits – the units of the left-right and bottom-top dimensions of a coronal slice. 
Example: [“mm”,”mm”].</li>
<li>sliceCoordFrame –defines a rectangular coordinate frame in SVG coordinates of a coronal slice. Uses same format as BoundingBox. Used in conjunction with sliceXLim and sliceYLim.</li>
<li>sliceXLim – defines, for the rectangle defined by sliceCoordFrame, what the physical coordinates of its left and right borders are. Example: [-8,8].</li>
<li>sliceYLim – defines, for the rectangle defined by sliceCoordFrame, what the physical coordinates of its bottom and top borders are. Example: [-8,8].</li>
<li>sliceCoordSystem – if not defined, slices are considered to be in anterior view, whereby the left side of each slice represents the right hemisphere of the brain (as seen by the subject). If set to "RAS", slices are considered to be in posterior view. RAS means that the X, Y and Z coordinate represent the Left to Right, Posterior to Anterior and Inferior to Superior axis, respectively.</li>
<li>sliceRange – defines how the original slices were resampled by the SBA, as a triplet of (1) start slice, (2) end slice, and (3) step size. Example: [1341,84,-10]. The internal SBA number starts at 0 for the most anterior slice.</li>
<li>plugins – list of plugins that are compatible with this template. Default plugins are defined in the default configuration file https://scalablebrainatlas.incf.org/main/config.json.</li>
<li>overlays – contains for each overlay modality a list with the following parameters:<ul>
<li>source – the file location of the coronal slice images as a printf format string, with a substitution field for the original slice number. Example: “coronal_GRE/p80_average_gre_%03d.jpg”.</li>
<li>anchorUnit – specifies the units of the anchorBox field below. Supports only the value “SVG”.</li>
<li>anchorBox – the coordinate frame to place the image in. Uses same format as BoundingBox. If not specified, the overlay image is assumed to lie within the sliceCoordFrame.</li></ul></li></ul></body></html>
