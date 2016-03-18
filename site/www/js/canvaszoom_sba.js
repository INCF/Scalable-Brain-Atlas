/*
The MIT License

Copyright (c) 2012 Matthew Wilcoxson (www.akademy.co.uk)
Copyright (c) 2011 Peter Tribble (www.petertribble.co.uk) - Touch / gesture controls.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
/*
CanvasZoom
By Matthew Wilcoxson

Description:    Zooming of very large images with Javascript, HTML5 and the canvas element (based on DeepZoom format and now the Zoomify format).
Website:        http://www.akademy.co.uk/software/canvaszoom/canvaszoom.php
Like it?:       http://www.akademy.co.uk/me/donate.php
Version:        1.1.4
*/
/* global ImageLoader, window */
function CanvasZoom( _settings, _tilesFolderDeprecated, _imageWidthDeprecated, _imageHeightDeprecated ) {

	"use strict";
	//var t = this; // make "this" accessible when out of "this" scope and minify
	var NULL=null, UNDEFINED, FALSE=false, TRUE=true, MATH=Math; // To minify
	
	var _debug = FALSE,
		_debugShowRectangle = FALSE; // Paint a rectangle rather than an image, adjust as needed!

	var _tileOverlap = 1, 
			_tileSize = 255,
			_fileType = "jpg",
			_tilesSystem = "deepzoom", // or "zoomify"
			_canvas,_drawBorder,_defaultZoom, _minZoom, _maxZoom, _tilesFolder, _imageWidth, _imageHeight;
			
	if( _settings.getContext === UNDEFINED ) {

		// settings
		_canvas = _settings.canvas;
		_tilesFolder = _settings.tilesFolder;
		_imageWidth = _settings.imageWidth;
		_imageHeight = _settings.imageHeight;

		_drawBorder = (_settings.drawBorder === UNDEFINED) ? TRUE : _settings.drawBorder;

		_defaultZoom = _settings.defaultZoom;//(_settings.defaultZoom === UNDEFINED) ? UNDEFINED : _settings.defaultZoom;
		_minZoom = _settings.minZoom;//(_settings.minZoom === UNDEFINED) ? UNDEFINED : _settings.minZoom;
		_maxZoom = _settings.maxZoom;//(_settings.maxZoom === UNDEFINED) ? UNDEFINED : _settings.maxZoom;
		
		_tilesSystem = (_settings.tilesSystem === UNDEFINED) ? _tilesSystem : _settings.tilesSystem;
		_tileOverlap = (_settings.tileOverlap === UNDEFINED) ? _tileOverlap : _settings.tileOverlap;
		_tileSize = (_settings.tileSize === UNDEFINED) ? _tileSize : _settings.tileSize;
		_fileType = (_settings.fileType === UNDEFINED) ? _fileType : _settings.fileType;
	}
	else {
		// canvas, old deprecated way for backward compatibility with tiles, width, height.
		_canvas = _settings;
		_tilesFolder = _tilesFolderDeprecated;
		_imageWidth = _imageWidthDeprecated;
		_imageHeight = _imageHeightDeprecated;
	}

	var _zoomLevelMin = 0,
			_zoomLevelMax = 0,
			_zoomLevelFull = -1, // For painting a background image for all missing tiles.	
			_zoomLevel = -1,

		_lastscale = 1.0,
		
		_rotate = 0,
	
		_mouseX = 0,
			_mouseY = 0,
			_mouseDownX = 0,
			_mouseDownY = 0,
			_mouseMoveX = 0,
			_mouseMoveY = 0,

		_mouseIsDown = FALSE,
			_mouseLeftWhileDown = FALSE,

		_offsetX = 0,
			_offsetY = 0,

		_aGetWidth = 'w',
			_aGetHeight = 'h',
			_aGetTile = 't',
			_aGetWaiting = 'wt',
	
		_tileZoomArray = NULL,
			_imageLoader = NULL,

		_ctx = NULL,
		
		_canvasWidth = _canvas.width,
		_canvasHeight = _canvas.height,
		
		_canvasLeft = 0, 
		_canvasTop = 0,
		_canvasRight = _canvasLeft + _canvasWidth,
		_canvasBottom = _canvasTop + _canvasHeight,
		
		PI = MATH.PI,
		TWOPI = MATH.PI * 2,
		LN2 = MATH.LN2,
		
		mathMin = MATH.min,
		mathMax = MATH.max,
		mathSqrt = MATH.sqrt,
		mathCos = MATH.cos,
		mathSin = MATH.sin,
		mathFloor = MATH.floor,
		mathCeil = MATH.ceil,
		mathLog = MATH.log,
		mathATan2 = MATH.atan2,
		mathATan = MATH.atan
		;

	function getTileFile( zoom, column, row ) {
		
		var totalNumber, zooms = 0, _tiles = NULL, tileGroupNumber;
		
		if( _tilesSystem === "deepzoom" ) {
			return _tilesFolder + "/" + zoom + "/" + column + "_" + row + "." + _fileType;
		}
		else if( _tilesSystem === "zoomify" ) {
			totalNumber = (_tileZoomArray[zoom].length * row) + column;
			if ( zoom > 0 ) {
				for( zooms = zoom-1; zooms; zooms-- ) {
					_tiles = _tileZoomArray[zooms];
					totalNumber += _tiles.length * _tiles[0].length;
				}
			}
			
			tileGroupNumber = mathFloor( totalNumber / _tileSize );
			return _tilesFolder + "/" + "TileGroup" + tileGroupNumber + "/" + zoom + "-" +  column + "-" + row + "." + _fileType;
		}
	}

	function initialTilesLoaded() {
		var tileZoomLevel = _tileZoomArray[_zoomLevel],
			columns = tileZoomLevel.length,
			rows = tileZoomLevel[0].length,
			mouse='mouse', touch='touch', gesture='gesture', // extreme minify!
			iColumn = 0, iRow = 0, imageId = 0;
			
		for( iColumn = 0; iColumn < columns; iColumn++ ) {
			for( iRow = 0; iRow < rows; iRow++ ) {
				tileZoomLevel[iColumn][iRow][_aGetTile] = _imageLoader.getImageById( imageId++ );
			}
		}

		_tileZoomArray[_zoomLevelFull][0][0][_aGetTile] = _imageLoader.getImageById( imageId );
		
		//
		// Centre image
		//
		_offsetX = (_canvasWidth - tileZoomLevel[_aGetWidth]) / 2;
		_offsetY = (_canvasHeight - tileZoomLevel[_aGetHeight]) / 2;

		// 
		// Add mouse listener events
		//
		addEvent( mouse+'move', mouseMove, TRUE );
		addEvent( mouse+'down', mouseDown, TRUE );
		addEvent( mouse+'up', mouseUp, TRUE );
		
		addEvent( mouse+'out', mouseOut, TRUE );
		addEvent( mouse+'over', mouseOver, TRUE );
		addEvent( 'DOMMouseScroll', mouseWheel, TRUE );
		addEvent( mouse+'wheel', mouseWheel, TRUE );
		
		addEvent(touch+'start', touchDown );
		addEvent(touch+'end', touchDown );
		addEvent(touch+'move', touchDown );
				
		addEvent( gesture+'end', gestureEnd ); // gestures to handle pinch
		addEvent( gesture+'change', gestureChange, TRUE ); // don't let a gesturechange event propagate
		
		addEvent( mouse+'up', mouseUpWindow, FALSE, window );
		addEvent( mouse+'move', mouseMoveWindow, FALSE, window );
		
		_ctx = _canvas.getContext('2d');
		
		requestPaint();
	}
    
	function addEvent( event, func, ret, obj ) {
		obj = obj || _canvas;
		obj.addEventListener( event, function(e){ func( e || window.event ); }, ret || FALSE );
	}
    
	function mouseDown( event ) {
		_mouseIsDown = TRUE;
		_mouseLeftWhileDown = FALSE;
		
		_mouseMoveX = _mouseDownX = mousePosX(event);
		_mouseMoveY = _mouseDownY = mousePosY(event); 
	}
	
	function mouseUp( event ) {
		_mouseIsDown = FALSE;
		_mouseLeftWhileDown = FALSE;
		
		_mouseX = mousePosX(event);
		_mouseY = mousePosY(event); 
		
		if( _mouseX === _mouseDownX &&
				_mouseY === _mouseDownY ) {

			// Didn't drag so assume a click.
			zoomInMouse();
		}
	}
	
	function mouseMove(event) {
	
		_mouseX = mousePosX(event);
		_mouseY = mousePosY(event); 

		if( _mouseIsDown ) {

			var newOffsetX = _offsetX + (_mouseX - _mouseMoveX),
				newOffsetY = _offsetY + (_mouseY - _mouseMoveY);
			
			calculateNeededTiles( _zoomLevel, newOffsetX, newOffsetY );
			
			_mouseMoveX = _mouseX;
			_mouseMoveY = _mouseY;
			
			_offsetX = newOffsetX;
			_offsetY = newOffsetY;
			
			requestPaint();
		}
	}

	function touchDown( event ) {
		
		event.preventDefault();
		_mouseIsDown = TRUE;
		_mouseLeftWhileDown = FALSE;

		_mouseDownX = touchPosX(event);
		_mouseDownY = touchPosY(event);

		_mouseMoveX = _mouseDownX;
		_mouseMoveY = _mouseDownY;
	}

	function touchUp( event ) {
		
		var tolerence = 50;
		_mouseIsDown = FALSE;
		_mouseLeftWhileDown = FALSE;

		_mouseX = touchPosX(event);
		_mouseY = touchPosY(event);

		if( _mouseX >= _mouseDownX - tolerence && _mouseX <= _mouseDownX + tolerence &&
				_mouseY >= _mouseDownY - tolerence && _mouseY <= _mouseDownY + tolerence )
				//_mouseY === _mouseDownY )
		{
			// Didn't drag so assume a click.
			zoomInMouse();
		}
	}

	function touchMove(event) {
		event.preventDefault();
		event.stopPropagation();
		_mouseX = touchPosX(event);
		_mouseY = touchPosY(event);

		if( _mouseIsDown )
		{
			var newOffsetX = _offsetX + (_mouseX - _mouseMoveX),
				newOffsetY = _offsetY + (_mouseY - _mouseMoveY);

			calculateNeededTiles( _zoomLevel, newOffsetX, newOffsetY );

			_mouseMoveX = _mouseX;
			_mouseMoveY = _mouseY;

			_offsetX = newOffsetX;
			_offsetY = newOffsetY;

			requestPaint();
		}
	}

	function gestureEnd(event) {
		_lastscale = 1.0;
	}

	function gestureChange(event) {
		var scale = event.scale;
		event.preventDefault();
		
		if (scale < 0.75*_lastscale) {
			zoomOutMouse();
			_lastscale = scale;
		}
		
		if (scale > 1.25*_lastscale) {
			zoomInMouse();
			_lastscale = scale;
		}
	}
	
	function mousePosX( event ) {
		// Get the mouse position relative to the canvas element.
		var x = 0;
		
		if (event.layerX || event.layerX === 0) { // Firefox
			x = event.layerX - _canvas.offsetLeft;
		} else if (event.offsetX || event.offsetX === 0) { // Opera
			x = event.offsetX;
		}
		
		return x;
	}
	
	function mousePosY( event ) {
		var y = 0;
		
		if (event.layerY || event.layerY === 0) { // Firefox
			y = event.layerY - _canvas.offsetTop;
		} else if (event.offsetY || event.offsetY === 0) { // Opera
			y = event.offsetY;
		}
		
		return y;
	}

	// touchend populates changedTouches instead of targetTouches
	function touchPosX( event ) {
		// Get the mouse position relative to the canvas element.
		var x = 0;
		if (event.targetTouches[0]) {
			x = event.targetTouches[0].pageX - _canvas.offsetLeft;
		} else {
			x = event.changedTouches[0].pageX - _canvas.offsetLeft;
		}
		return x;
	}

	function touchPosY( event ) {
		var y = 0;
		if (event.targetTouches[0]) {
			y = event.targetTouches[0].pageY - _canvas.offsetTop;
		} else {
			y = event.changedTouches[0].pageY - _canvas.offsetTop;
		}
		return y;
	}
    
	function mouseOut( event ) {
		if( _mouseIsDown ) {
			_mouseLeftWhileDown = TRUE;
		}
	}
	
	function mouseOver( event ) {
		// (Should be called mouseEnter IMO...)
		_mouseLeftWhileDown = FALSE;
	}
	
	function mouseWheel( event ) {
		var delta = 0;
				 
		if (event.wheelDelta) { /* IE/Opera. */
			delta = -(event.wheelDelta/120);
		} else if (event.detail) { /* Mozilla */
			delta = event.detail/3;
		}

		if (delta)  {
			if (delta < 0) {
				zoomInMouse();
			}
			else {
				zoomOutMouse();
			}
		}
				 
		if (event.preventDefault) {
			event.preventDefault(); 
		}

		event.returnValue = FALSE;
	}
	
	// If mouseUp occurs outside of canvas while moving, cancel movement.
	function mouseUpWindow( event ) {
		if( _mouseIsDown && _mouseLeftWhileDown ) {
			mouseUp( event );
		}
	}
	
	// keep track of mouse outside of canvas so movement continues.
	function mouseMoveWindow(event) {
		if( _mouseIsDown && _mouseLeftWhileDown ) {
			mouseMove(event);
		}
	}
    
	// Zoom in a single level
	function zoomIn( x, y ) {
		zoom( _zoomLevel + 1, x, y );
		requestPaint();
	}
	
	// Zoom out a single level
	function zoomOut( x, y ) {
		zoom( _zoomLevel - 1, x, y );
		requestPaint();
	}
	
    // Zoom in at mouse co-ordinates
	function zoomInMouse() {
		zoomIn( _mouseX, _mouseY );
	}
	
	// Zoom out at mouse co-ordinates
	function zoomOutMouse() {
		zoomOut( _mouseX, _mouseY );
	}
	
	function setRotate( radians ) {
		_rotate = radians % TWOPI;
		
		calculateNeededTiles( _zoomLevel, _offsetX, _offsetY );
		requestPaint();
	}
	
	// Change the zoom level and update.
	function zoom( zoomLevel, zoomX, zoomY ) {

		if( zoomLevel >= _zoomLevelMin && zoomLevel <= _zoomLevelMax ) {
			// TODO: restrict zoom position to within (close?) area of image.
            
			var newZoom = zoomLevel,
					currentZoom = _zoomLevel,										
					currentImageX = zoomX - _offsetX,
					currentImageY = zoomY - _offsetY,
			
				scale = _tileZoomArray[newZoom][_aGetWidth] / _tileZoomArray[currentZoom][_aGetWidth],
			
				newImageX = currentImageX * scale,
					newImageY = currentImageY * scale,
			
				newOffsetX = _offsetX - (newImageX - currentImageX),
					newOffsetY = _offsetY - (newImageY - currentImageY);
					
			calculateNeededTiles( newZoom, newOffsetX, newOffsetY );
			
			_zoomLevel = newZoom;
			_offsetX = newOffsetX;
			_offsetY = newOffsetY;
		}
	}
	
	// Work out which of the tiles we need to download 
	function calculateNeededTiles( zoom, offsetX, offsetY ) {

		//
		// Calculate needed tiles
		//
		
		// TODO: This needs to be threaded, particularly when we are rotated.
		
		var tileZoomLevelArray = _tileZoomArray[zoom],
		
			canvasLeft = _canvasLeft, 
			canvasTop = _canvasTop,
			canvasRight = _canvasRight,
			canvasBottom = _canvasBottom,
	
			tile = NULL,
			
			tileSize = _tileSize,
				tileOverlap = _tileOverlap,
				rotate = _rotate,
	
			zoomWidth = tileZoomLevelArray[_aGetWidth],
			zoomHeight = tileZoomLevelArray[_aGetHeight],
			
			imageMidX = offsetX + zoomWidth / 2,
			imageMidY = offsetY + zoomHeight / 2,
		
			columns = tileZoomLevelArray.length,
			rows = tileZoomLevelArray[0].length,
		
			iColumn, iRow,
			tileList = [],
			
			tileOverlapX = 0,
			tileOverlapY = 0,
			tileSizeX = tileSize - tileOverlapX,
			tileSizeY = tileSize - tileOverlapY,
			tileWidth, tileHeight,
			
			topleft, topright, bottomright, bottomleft,
			
			x1,y1,x2,y2,corners;
			
      
		for( iColumn = 0; iColumn < columns; iColumn++ ) {

			for( iRow = 0; iRow < rows; iRow++ ) {

				tile = tileZoomLevelArray[iColumn][iRow];
				
				if( tile[_aGetTile] === NULL && tile[_aGetWaiting] === FALSE ) { // If not loaded or not loading
				
					x1 = (iColumn * tileSizeX) + offsetX;
					y1 = (iRow * tileSizeY) + offsetY;
					
					if( rotate ) {
					
						tileWidth = mathMin( tileSizeX, zoomWidth - (x1 - offsetX) );
						tileHeight = mathMin( tileSizeY, zoomHeight - (y1 - offsetY) );
						
						corners = rotateRect( x1 + tileWidth/2, y1 + tileHeight/2, tileWidth, tileHeight, imageMidX, imageMidY, rotate );
						
						x1 = mathMin( corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x );
						x2 = mathMax( corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x );
						y1 = mathMin( corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y );
						y2 = mathMax( corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y );
					}
					else {
						x2 = x1 + mathMin( tileSizeX, zoomWidth - (x1 - offsetX) );
						y2 = y1 + mathMin( tileSizeY, zoomHeight - (y1 - offsetY) );
					}
					
					if( !( x1 > canvasRight || y1 > canvasBottom || x2 < canvasLeft || y2 < canvasTop) ) {
						// request tile!
						tile[_aGetWaiting] = TRUE;
						tileList.push( { "name" : zoom + "_" + iColumn + "_" + iRow, "file" : getTileFile( zoom, iColumn, iRow ) } );
					}
				}
			}
		}
		
		getTiles( tileList );
	}

	// Load the tiles we need with ImageLoader
	function getTiles( tileList ) {
		if( tileList.length > 0 ) {

			/*_imageLoader = */new ImageLoader( {
				"images": tileList,
				"onImageLoaded":function( name, tile ) { tileLoaded( name, tile ); }
			} );
		}
	}
	
	// Tile loaded, save it.
	function tileLoaded( name, tile ) {

		var tileDetails = name.split("_");
		
		if( tileDetails.length === 3 ) {

			var tileInfo = _tileZoomArray[tileDetails[0]][tileDetails[1]][tileDetails[2]];
			tileInfo[_aGetTile] = tile;
			tileInfo[_aGetWaiting] = FALSE;
			
			requestPaint();
		}
	}
	
	function rotateRect( rectCentreX, rectCentreY, rectWidth, rectHeight, rotateX, rotateY, rotate ) {
		// Rotate centre point
		var rectCentreRotated = rotatePoint( rectCentreX, rectCentreY, rotateX, rotateY, rotate );
		
		// Now find where new corners are relative to centre
		var hyper = mathSqrt( rectWidth*rectWidth + rectHeight*rectHeight ) / 2;
		var angles = [];
		
		if( rectWidth === rectHeight ) {
			// if square use these angles.
			angles.push( rotate + (TWOPI/8) );
			angles.push( angles[0] + (TWOPI/4) );
		}
		else {
			// end of row / column images which can be less than square.
			var angle = mathATan( rectHeight / rectWidth );
			angles.push( rotate + angle );
			angles.push( rotate + PI - angle );
		}
		
		var leftCornerXDistance = mathCos( angles[0] ) * hyper,
			leftCornerYDistance = mathSin( angles[0] ) * hyper,
			rightCornerXDistance = mathCos( angles[1] ) * hyper,
			rightCornerYDistance = mathSin( angles[1] ) * hyper;
			 
		return {
			tr: {
				x: rectCentreRotated.x + leftCornerXDistance,
				y: rectCentreRotated.y + leftCornerYDistance
			},
			tl: {
				x: rectCentreRotated.x + rightCornerXDistance,
				y: rectCentreRotated.y + rightCornerYDistance
			},
			bl: {
				x: rectCentreRotated.x - leftCornerXDistance,
				y: rectCentreRotated.y - leftCornerYDistance
			},
			br: {
				x: rectCentreRotated.x - rightCornerXDistance,
				y: rectCentreRotated.y - rightCornerYDistance
			}
		};
	}
	
	function rotatePoint( xPos, yPos, midX, midY, rotate ) {
		var nx = xPos - midX,
			ny = yPos - midY,

			na = mathATan2( ny, nx ) + rotate,
			nh = mathSqrt( nx*nx + ny*ny );

		return {
			x: ( mathCos(na) * nh ) + midX,
			y: ( mathSin(na) * nh ) + midY
		};
	}

	function requestPaint() {
		
		var animRequest = window.requestAnimationFrame;
		if( animRequest ) {
			animRequest( paint );
		} else {
			window.setTimeout( paint, 1000 / 60 );	
		}
	}

	function paintBorder( ctx ) {
		//ctx.strokeStyle = "#000";
		//ctx.strokeRect( 0, 0, _canvasWidth, _canvasHeight );
	}
	
	function paint() {

		var tileZoomLevelArray = _tileZoomArray[_zoomLevel],
				
			offsetX = _offsetX,
				offsetY = _offsetY,
			tileSize = _tileSize,
				tileOverlap = _tileOverlap,

			zoomWidth = tileZoomLevelArray[_aGetWidth],
				zoomHeight = tileZoomLevelArray[_aGetHeight],
        
			imageMidX = offsetX + zoomWidth / 2,
			imageMidY = offsetY + zoomHeight / 2,

			rotate = _rotate,

			columns = tileZoomLevelArray.length,
				rows = tileZoomLevelArray[0].length,

			canvasLeft = _canvasLeft,
				canvasTop = _canvasTop,
				canvasRight = _canvasRight,
				canvasBottom = _canvasBottom,

			x1, x2, y1, y2,
				corners,
			
			tileOverlapX = 0, tileOverlapY = 0,
				tileCount = 0, 
				tile = NULL,
				
			tileSizeX = tileSize - tileOverlapX,
			tileSizeY = tileSize - tileOverlapY,
			tileWidth, tileHeight,
			
			overlap = false;

		// Clear area
		//
		_ctx.clearRect( 0, 0, _canvasWidth, _canvasHeight );

		
		/*if( 1 || _debug ) {
			canvasTop += 100;
			canvasLeft += 100;
			canvasRight -= 300;
			canvasBottom -= 200;
			
			_ctx.strokeStyle = "#f00";
			_ctx.strokeRect( canvasLeft, canvasTop, canvasRight-canvasLeft, canvasBottom-canvasTop ); 
		}*/
		


		if( rotate ) {
			// rotate
			//
			_ctx.save();
			_ctx.translate( imageMidX, imageMidY ); // TODO: needs to rotate at mid point of image part visible in canvas.
			_ctx.rotate( rotate );
			_ctx.translate( -imageMidX, -imageMidY );
		}
		
		//
		// Show images
		//
        
		// TODO: This pastes a low resolution copy on the background (It's a bit of a hack, a better solution might be to find a nearer zoom (if one is downloaded))
		var fullTile = _tileZoomArray[_zoomLevelFull][0][0][_aGetTile],
			iColumn = 0, iRow = 0;
		
		var rotated = [];
		
		// Paint background first
		_ctx.drawImage( fullTile, offsetX, offsetY, zoomWidth, zoomHeight );
		
		// TODO: Improve this by working out the start / end column and row using the image position instead of looping through them all (still pretty fast though!)
		for( iColumn = 0; iColumn < columns; iColumn++ ) {

			for( iRow = 0; iRow < rows; iRow++ ) {

				x1 = (iColumn * tileSizeX) + offsetX;
				y1 = (iRow * tileSizeY) + offsetY;

				tileWidth = mathMin( tileSizeX, zoomWidth - (x1 - offsetX) );
				tileHeight = mathMin( tileSizeY, zoomHeight - (y1 - offsetY) );
				
				x2 = x1 + tileWidth;
				y2 = y1 + tileHeight;
					
				if( rotate ) {

					corners = rotateRect( x1 + tileWidth/2, y1 + tileHeight/2, tileWidth, tileHeight, imageMidX, imageMidY, rotate );
						
					overlap = !( 
						mathMin( corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x ) > canvasRight || 
						mathMin( corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y ) > canvasBottom || 
						mathMax( corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x ) < canvasLeft || 
						mathMax( corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y ) < canvasTop     
					);

					if( _debug ) {
						rotated.push( [ corners.tr, corners.tl, corners.bl, corners.br, iColumn, iRow ] );
					}
				}
				else {

					overlap = !( x1 > canvasRight || x2 < canvasLeft || y1 > canvasBottom || y2 < canvasTop );
				}
				
				if( overlap ) {

					tile = tileZoomLevelArray[iColumn][iRow][_aGetTile];
										
					if( tile !== NULL ) {
						// Draw tile
						_ctx.drawImage( tile, x1, y1 );
					}
					/*else {
						
						// Tile still loading - draw something else.
						_ctx.beginPath();
					
						_ctx.moveTo( x1, y1 );
						_ctx.lineTo( x2, y1 );
						_ctx.lineTo( x2, y2 );
						_ctx.lineTo( x1, y2 );
						_ctx.closePath();

						_ctx.save();
						_ctx.clip();
					
						// TODO: Fill with a lower zoom image. (or possible use combination of higher zooms??)
						// but scaling images in canvas still VERY SLOW.
						// THIS NOTABLY SLOWS DOWN PANNING WHEN IMAGES ARE NOT YET LOADED ON SOME BROWSERS.
						_ctx.drawImage( fullTile, offsetX, offsetY, zoomWidth, zoomHeight );
						
						
						_ctx.restore();
					}*/
					
					if( _debug ) {
						
						if( _debugShowRectangle && tile === NULL ) {
							
							_ctx.fillStyle = "#999";
							_ctx.fillRect( x1, y1, x2 - x1, y2 - y1 );
						}
						
						// Draw tile border.
						_ctx.strokeRect( x1, y1, tileSize, tileSize );
						tileCount++;
					}
				}
			}
		}
		
		debugPaint( _ctx, offsetX, offsetY, zoomWidth, zoomHeight, tileCount );

		if( rotate ) {
			_ctx.restore();
		}
		
		debugPaintTilePoints( rotated );

		if( _drawBorder ) {
			paintBorder( _ctx );
		}

	}
	
	function debugPaintTilePoints( rotated ) {
	
		if( _debug ) {
			
			for( var r = 0; r < rotated.length; r++ ) {
				
				var topleft = rotated[r][0],
					topright = rotated[r][1],
					bottomright = rotated[r][2],
					bottomleft = rotated[r][3];
				
				_ctx.strokeStyle = "#ff0";
				_ctx.beginPath();
				_ctx.moveTo( topleft.x, topleft.y );
				_ctx.lineTo( bottomright.x, bottomright.y );
				_ctx.stroke();

				_ctx.strokeStyle = "#0ff";
				_ctx.beginPath();
				_ctx.moveTo( topright.x, topright.y );
				_ctx.lineTo( bottomleft.x, bottomleft.y );
				_ctx.stroke();

				_ctx.font = "normal 12px Arial";
				_ctx.fillText( rotated[r][4] + " : " + rotated[r][5], topleft.x, topleft.y );
			}
		}
	}
	
	function debugPaint( ctx, imageLeft, imageTop, zoomWidth, zoomHeight, tileCount ) {
		
		if( _debug ) {

			// 
			// DEBUG!
			//
			ctx.strokeStyle = "#ff0";
			ctx.strokeRect( _canvasLeft, _canvasTop, _canvasWidth, _canvasHeight );
			ctx.strokeStyle = "#f0f";
			ctx.strokeRect( imageLeft, imageTop, zoomWidth, zoomHeight );
		
			ctx.fillStyle = "#0f0";
			ctx.font = "normal 12px Arial";

			// Text
			ctx.fillText( _mouseX + "," + _mouseY + " | " + _offsetX + "," + _offsetY + " | " + tileCount, 0, 20 );

			// Grid
			ctx.strokeStyle = "#f00";
			var x,y;
			for( y = 0; y < _canvasHeight; y += _tileSize ) {
				for( x = 0; x < _canvasWidth; x += _tileSize ) {	
					ctx.strokeRect( x, y, _tileSize, _tileSize ); 
				}
			}
		}
	}
	
	//Zoom in at the centre of the canvas
	this.zoomInCentre = function () {
		zoomIn( _canvasWidth / 2, _canvasHeight / 2 );
	};
	
	//Zoom out at the centre of the canvas
	this.zoomOutCentre = function () {
		zoomOut( _canvasWidth / 2, _canvasHeight / 2);
	};
	
	this.rotateClockwise = function () {
		setRotate( _rotate + TWOPI/32 );
	};
	
	this.rotateAnticlockwise = function () {
		setRotate( _rotate - TWOPI/32 );
	};

	(function() { // setup
		if( _tilesSystem === "deepzoom" ) {
			_zoomLevelMax = mathCeil( mathLog( mathMax( _imageWidth, _imageHeight ))/LN2 );
		}
		else if( _tilesSystem === "zoomify" ) {
			_zoomLevelMax = mathCeil( mathLog( mathMax( _imageWidth, _imageHeight ))/LN2 ) - mathLog( _tileSize )/LN2;
		}
		_tileZoomArray = [];

		var reducingWidth = _imageWidth,
			reducingHeight = _imageHeight,
			zoomLevelStart = -1,
			iZoom = 0, iColumn = 0, iRow = 0,
				columns = -1, rows = -1;
        
		for( iZoom = _zoomLevelMax;  iZoom >= _zoomLevelMin; iZoom-- ) {
		
			columns = mathCeil( reducingWidth / _tileSize );
			rows = mathCeil( reducingHeight / _tileSize );

			if( _zoomLevelFull === -1 && 
					reducingWidth <= _tileSize && reducingHeight <= _tileSize ) {
				// Largest full image inside single tile.
				_zoomLevelFull = iZoom;
			}
			
			if( zoomLevelStart === -1 && 
					reducingWidth <= _canvasWidth && reducingHeight <= _canvasHeight ) {
				// Largest image that fits inside canvas.
				zoomLevelStart = iZoom;
			}

			// Create array for tiles
			_tileZoomArray[iZoom] = [];
			for( iColumn = 0; iColumn < columns; iColumn++ ) {
				_tileZoomArray[iZoom][iColumn] = []; 
			}
			
			// Set defaults
			// TODO: Test width - possibly to short, maybe not including last tile width...
			_tileZoomArray[iZoom][_aGetWidth] = reducingWidth;
			_tileZoomArray[iZoom][_aGetHeight] = reducingHeight;
			
			for( iColumn = 0; iColumn < columns; iColumn++ ) {			
				for( iRow = 0; iRow < rows; iRow++ ) {
					_tileZoomArray[iZoom][iColumn][iRow] = [];
					_tileZoomArray[iZoom][iColumn][iRow][_aGetTile] = NULL;
					_tileZoomArray[iZoom][iColumn][iRow][_aGetWaiting] = FALSE;
				}
			}
			
			reducingWidth /= 2;
			reducingHeight /= 2;
		}
		
		if( _defaultZoom === UNDEFINED ) {
			_defaultZoom = zoomLevelStart;
		}
		_zoomLevel = _defaultZoom;

		if( _minZoom > _zoomLevelMin ) {
			_zoomLevelMin = _minZoom;
		}
		if( _maxZoom < _zoomLevelMax ) {
			_zoomLevelMax = _maxZoom;
		}

		if( _zoomLevelMin > _zoomLevelMax ) {
			var zoomMinTemp = _zoomLevelMin;
			_zoomLevelMin = _zoomLevelMax;
			_zoomLevelMax = zoomMinTemp;
		}
		
		//
		// Initial tile load
		//
		var imageList = [],imageId = 0;
		
		columns = _tileZoomArray[_zoomLevel].length;
		rows = _tileZoomArray[_zoomLevel][0].length;
		
		for( iColumn = 0; iColumn < columns; iColumn++ ) {
			for( iRow = 0; iRow < rows; iRow++ ) {
				imageList.push( { "id" : imageId, "file": getTileFile( _zoomLevel, iColumn, iRow  ) } );
				imageId++;
			}
		}
		
		imageList.push( { "id" : imageId, "file": getTileFile( _zoomLevelFull, 0, 0  ) } );

		_imageLoader = new ImageLoader( {
			"images": imageList,
			"onAllLoaded":function() { initialTilesLoaded(); },
		} );
        
	}());
}
