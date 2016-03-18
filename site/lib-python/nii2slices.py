# Rembrandt Bakker, Dhruv Kohli, Piotr Majka, June 2014
import sys,os
os.chdir(sys.path[0])
sys.path.append('../fancypipe')
sys.path.append('../nifti-tools')
from fancypipe import *
import os, os.path as op
import re, json
import numpy, scipy.misc, nibabel
import niitools as nit
  
class NiftiToSlices(FancyTask):
  colormapHelp = """
      Colormap supports various formats:
      1. comma separated list of rgb-hex values: #RGB1,#RGB2,...
      2. range of rgb-hex values: #RGB1-#RGB2
      3. constant color with range of alpha values: alpha-#RGB
      4. automatic high-contrast colormap: auto
  """
  inputs = odict(
    ('input_nii', dict(type=assertFile, help="Input Nifti file")),
    ('slicedir', dict(type=str, default='y', help="Slicing direction: 0 or x = Saggital, 1 or y = Coronal, 2 or z = Axial")),
    ('outFolder', dict(type=str, help="Output folder (existing files will only be overwritten if --replace is set)")),
    ('pctile', dict(type=str, default=None, help='Rescale data using these min/max percentile values, e.q. "1,99". If omitted, no rescaling is done and image is saved as png.')),
    ('origin', dict(type=str, default=None, help="If set to 'center', the (0,0,0) point is take to be the center of the volume.")),
    ('colormap',dict(type=str, help=colormapHelp)),
    ('reorient',dict(type=str, default=None, help="Reorient volume by permuting and flipping axes. Example: '+j+i+k' to permute dimension i and j.")),
    ('replace', dict(action='store_true', default=False, help="If set, existing png files will be replaced.")),
    ('boundingbox_bgcolor', dict(type=str, default='', help="If specified, compute boundingboxes of non-background area and save as boundingbox.json. Use hex-color or 'auto'.")),
    ('count_pixels', dict(action='store_true', default=False, help="Also compute region volumes"))
  )
  def main(self,input_nii,slicedir,outFolder,pctile,origin,colormap,reorient,replace,boundingbox_bgcolor,count_pixels):
    nii = nibabel.load(input_nii)
    dir2dim = {'x':0,'y':1,'z':2,'0':0,'1':1,'2':2,'coronal':0,'saggital':1,'horizontal':2,'axial':2}
    sliceDim = dir2dim[slicedir.lower()]
    
    # Nifti data is supposed to be in RAS orientation.
    # For Nifti files that violate the standard, the reorient string can be used to correct the orientation.
    if reorient:
      nii = nit.reorient(nii,reorient)

    hdr = nii.get_header()
    q = hdr.get_best_affine();
    ornt = nibabel.io_orientation(q)
    print('The orientation is: {}'.format(ornt))
    dims0 = [int(d) for d in nii.shape if d>1]
    dims = list(dims0)
    for i,d in enumerate(ornt):
      dims[i] = dims0[int(d[0])]
    print('The dimensions are: {}'.format(dims))
    numSlices = dims[sliceDim];
    baseName = op.basename(input_nii)
    baseName = re.sub('.gz$', '',baseName)
    baseName = re.sub('.nii$', '',baseName)
    if not op.exists(outFolder):
      os.makedirs(outFolder)
      print('Created output folder "{}".'.format(outFolder))

    rgbMode = False
    img_dtype = nii.get_data_dtype();
    if len(dims)==4 and dims[3]==3: 
      rgbMode = True
    elif img_dtype.names:
      if len(img_dtype.names)==3:
        rgbMode = 'record'
    rescale =  pctile is not None

    fmt = 'png'
    if rescale or rgbMode:
      fmt = 'jpg'

    filePattern = baseName+'_%04d.{}'.format(fmt)
    filePattern_py = filePattern.replace('_%04d','_{:04d}')

    if origin:
      try:
        if origin.startswith('['):
          ijk0 = json.loads(origin)
        elif origin == 'center':
          dims = hdr.get_data_shape()
          ijk0 = [dims[0]/2,dims[1]/2,dims[2]/2]
        q = hdr.get_best_affine()
        q[0:3,3] = -q[0:3,0:3].dot(ijk0)
        hdr.set_sform(q)
      except:
        raise Exception('Invalid origin "{}".'.format(origin))

    # save coordinate system (Right Anterior Superior) information
    rasLimits = nit.rasLimits(hdr)
    
    # Some nii files have no origin set (other than i=0, j=0, k=0)
    # Use the origin parameter to overrule this.
    ##if origin == 'center':
    ##  def ctr(x1,x2): 
    ##    w=x2-x1
    ##    return -w/2,w/2
    ##  rasLimits = [ctr(xx[0],xx[1]) for xx in rasLimits]
        
    with open(op.join(outFolder,'raslimits.json'), 'w') as fp:
      json.dump(rasLimits,fp)
      
    slicePos = (rasLimits[sliceDim][0] + (numpy.arange(0.0,dims[sliceDim])+0.5)*(rasLimits[sliceDim][1]-rasLimits[sliceDim][0])/dims[sliceDim]).tolist()
    with open(op.join(outFolder,'slicepos.json'), 'w') as fp:
      json.dump(slicePos,fp)

    # quit if ALL slices already exist
    if not replace:
      done = True
      for i in range(0,numSlices):
        outFile = filePattern_py.format(i)
        fullFile = op.join(outFolder,outFile)
        if not op.exists(fullFile): 
          done = False
          break
      if done:
        return FancyDict(
          filePattern = op.join(outFolder,filePattern),
          rasLimits = rasLimits
        )
    
    # load image, it is needed 
    img = nii.get_data()
    img = nibabel.apply_orientation(img,ornt)
    img = numpy.squeeze(img)
    if rgbMode == 'record': img = nit.record2rgb(img)
    
    print('Nifti image loaded, shape "{}",data type "{}"'.format(dims,img.dtype))

    maxSlices = 2048;
    if numSlices>maxSlices:
      raise Exception('Too many slices (more than '+str(maxSlices)+')');

    if not rgbMode:
      minmax = nit.get_limits(img)
      if rescale:                
        minmax = nit.get_limits(img,pctile)
      print('minmax {}, rescale {}'.format(minmax,rescale))
      index2rgb = nit.parse_colormap(colormap,minmax)

      if isinstance(index2rgb,dict):
        rgbLen = len(index2rgb[index2rgb.keys()[0]])
      else:
        rgbLen = len(index2rgb[0])

      # save index2rgb
      if not rescale:
        if isinstance(index2rgb,dict):
          index2rgb_hex = {index:'{:02X}{:02X}{:02X}'.format(rgb[0],rgb[1],rgb[2]) for (index,rgb) in index2rgb.iteritems()}
        else:
          index2rgb_hex = ['{:02X}{:02X}{:02X}'.format(rgb[0],rgb[1],rgb[2]) for rgb in index2rgb]
        with open(op.join(outFolder,'index2rgb.json'), 'w') as fp:
          json.dump(index2rgb_hex,fp)
    elif rgbMode:
      grayscale = img.dot(numpy.array([0.2989,0.5870,0.1140]))
      minmax = nit.get_limits(grayscale)
      if rescale:                
        minmax = nit.get_limits(grayscale,pctile)
      rescale = True
      rgbLen = 3
      index2rgb = False
    else:
      rescale = False
      rgbLen = 3
      index2rgb = False

    bbg = boundingbox_bgcolor
    if bbg is '': bbg = False
    if bbg:
      boundingBox = {}
      boundingBoxFile = op.join(outFolder,'boundingbox.json')
      if op.exists(boundingBoxFile):
        with open(boundingBoxFile, 'r') as fp:
          boundingBox = json.load(fp)

    pxc = count_pixels
    if pxc:
      pixCount = {};
      pixCountFile = op.join(outFolder,'pixcount.json')
      if op.exists(pixCountFile):
        with open(pixCountFile, 'r') as fp:
          pixCount = json.load(fp)

    for i in range(0,numSlices):
      outFile = filePattern_py.format(i)
      fullFile = op.join(outFolder,outFile)
      if op.exists(fullFile):
        if i==0:
          print('image {}{} already exists as {}-file "{}".'.format(sliceDim,i,fmt,fullFile))
        if not replace: 
          continue
      slc = nit.get_slice(img,sliceDim,i)

      if pxc:
        labels = numpy.unique(slc)
        cnt = {}
        for b in labels:
          cnt[str(b)] = numpy.count_nonzero(slc == b)
        pixCount[i] = cnt
        
      if index2rgb:
        slc = nit.slice2rgb(slc,index2rgb,rescale,minmax[0],minmax[1])
      elif rescale:
        slc = nit.rgbslice_rescale(slc,minmax[0],minmax[1])

      # Save image
      ans = scipy.misc.toimage(slc).save(op.join(outFolder,outFile))

      if bbg:
        if(bbg == "auto"):
          # do this only once
          bgColor = nit.autoBackgroundColor(slc)
          print('boundingbox auto bgColor is {}'.format(bgColor))
        else:
          bgColor = nit.hex2rgb(bgg)
        mask = nit.imageMask(slc,[bgColor])
        print 'mask shape {} {}'.format(bgColor,mask.shape)
      
        ## bounding box
        nonzero = numpy.argwhere(mask)
        #print 'nonzero {}'.format(nonzero)
        if nonzero.size>0:
          lefttop = nonzero.min(0)[::-1] # because y=rows and x=cols
          rightbottom = nonzero.max(0)[::-1]
          bb = lefttop.tolist()
          bb.extend(rightbottom-lefttop+(1,1))
          boundingBox[i] = bb
      
      if i==0:
        print('image {}{} saved to {}-file "{}".'.format(sliceDim,i,fmt,fullFile))
      
    if bbg:
      if len(boundingBox)>0:
        bb0 = boundingBox.itervalues().next()
        xyMin = [bb0[0],bb0[1]]
        xyMax = [bb0[0]+bb0[2],bb0[1]+bb0[3]]
        for bb in boundingBox.itervalues():
          if bb[0]<xyMin[0]: xyMin[0] = bb[0]
          if bb[1]<xyMin[1]: xyMin[1] = bb[1]
          if bb[0]+bb[2]>xyMax[0]: xyMax[0] = bb[0]+bb[2]
          if bb[1]+bb[3]>xyMax[1]: xyMax[1] = bb[1]+bb[3]
        boundingBox['combined'] = [xyMin[0],xyMin[1],xyMax[0]-xyMin[0],xyMax[1]-xyMin[1]]
      with open(boundingBoxFile, 'w') as fp:
        json.dump(boundingBox,fp)
      
    if pxc:
      with open(pixCountFile, 'w') as fp:
        json.dump(pixCount,fp)

    return FancyDict(
      filePattern=op.join(outFolder,filePattern),
      rasLimits=rasLimits
    )

if __name__ == '__main__':
  NiftiToSlices.fromCommandLine().run()
