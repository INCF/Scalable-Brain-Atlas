<html>
The SVG_Converter VBA script converts bitmap images to SVG vector graphics, 
by invoking the PowerTRACE module in CorelDraw X4 or X5.
The script is a copy of the File_Converter script that is included
with Corel, with two additional steps:

1. each image is converted to curves using the Bitmap.Trace routine.
After this step, saving to the SVG file format will produce code
that contains just curves, no bitmaps.

2. the rectangular outline of the original bitmap image is added.
This rectangle is used later on to reconstruct the correct stereotaxic
coordinates of the slice.

If you are an atlas provider, you can submit your data either in
SVG format or as color-coded images (preferrably NIFTI format).
</html>
