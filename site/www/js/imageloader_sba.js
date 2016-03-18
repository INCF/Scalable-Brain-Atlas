/*
The MIT License

Copyright (c) 2011 Matthew Wilcoxson (www.akademy.co.uk)

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
ImageLoader
By Matthew Wilcoxson

Description:    Download image files when you need them.
Example:        http://www.akademy.co.uk/software/canvaszoom/canvaszoom.php
Version:        1.1.0
*/
function ImageLoader( settings )
{
	"use strict";
	
	var NULL = null,UNDEFINED,TRUE=true,FALSE=false;
	
	var thatImageLoader = this,
		timerImageNumber = 0,
		timerWait = ( settings.wait !== UNDEFINED ) ? settings.wait : 0,
		imageList = settings.images,
		imageCount = imageList.length;
	
	this.images = [];
	this.begun = FALSE;
	this.onAllLoaded = ( settings.onAllLoaded !== UNDEFINED ) ? settings.onAllLoaded : NULL;
	this.onImageLoaded = (settings.onImageLoaded !== UNDEFINED) ? settings.onImageLoaded : NULL;
	
	var imageTimer = function () {
		thatImageLoader.images[timerImageNumber].triggerLoad();
		timerImageNumber += 1;
		
		if( timerImageNumber < imageList.length ) {
			setTimeout( function() { imageTimer.call(thatImageLoader); }, timerWait );
		}
	},
	
	setLoaded = function( position ) {
		for( var i = 0; i < imageCount; i++ ) {
			if ( thatImageLoader.images[i] ) {
				if( position === thatImageLoader.images[i].position ) {
					thatImageLoader.images[i].setDone(); 
					if( thatImageLoader.onImageLoaded !== NULL ) {
						thatImageLoader.onImageLoaded( thatImageLoader.images[i].name, thatImageLoader.images[i].image, thatImageLoader.images[i].file );
					}
				}
			}
		}
	
		checkComplete();
	},
	
	checkComplete = function() {
		
		for( var i = 0; i < imageCount; i++ ) {
			if ( thatImageLoader.images[i] ) {
				if( !thatImageLoader.images[i].loaded ) {
					return;
				}
			}
		}
		
		complete();
	},
	
	complete = function() {
		if( thatImageLoader.onAllLoaded !== NULL ) {
			thatImageLoader.onAllLoaded();
		}
	};
	
	(function begin() {
	
		if( imageCount ) {
			for( var number = 0; number < imageCount; number++ ) {
				var image = imageList[number];
				if( image ) {
					var name = (image.name !== UNDEFINED) ? image.name : '',
							id = (image.id != UNDEFINED) ? image.id : 0;
							
					thatImageLoader.images[number] = new LoadImage( name, id, number, image.file );
					
					if( timerWait == 0 ) {
						thatImageLoader.images[number].triggerLoad();
					}
					
				}
			}
			
			if( timerWait > 0 ) {
				setTimeout( function() { imageTimer.call(thatImageLoader); }, timerWait );
			} 
			
			thatImageLoader.begun = TRUE;
		}
	})();
	
	this.getImageByPosition = function( position ) {
		for( var i = 0; i < imageCount; i++ ) {
			if ( this.images[i] ) {
				if( position === this.images[i].position ) {
					if( this.images[i].loaded ) {
						return this.images[i].image;
					}
					else {
						return NULL; // Not loaded
					}
				}
			}
		}
	
        return UNDEFINED; // Not found
	};	
	
	this.getImageById = function( id ) {
		for( var i = 0; i < imageCount; i++ ) {
			if ( this.images[i] ) {
				if( id === this.images[i].id ) {
					if( this.images[i].loaded ) {
						return this.images[i].image;
					}
					else {
						return NULL; // Not loaded
					}
				}
			}
		}
	
        return UNDEFINED; // Not found
	};
	
	this.getImageByName = function( name ) {
		for( var i = 0; i < imageCount; i++ ) {
			if ( this.images[i] ) {
				if( name === this.images[i].name ) {
					if( this.images[i].loaded ) {
						return this.images[i].image;
					}
					else {
						return NULL; // Not loaded
					}
				}
			}
		}
	
		return UNDEFINED; // Not found
	};
	
	this.loadedIds = function ( idArray ) {
		if( this.begun ) {
			for( var j = 0; j < idArray.length; j++ ) {
				for( var i = 0; i < imageCount; i++ ) {
					if ( this.images[i] ) {
						if( idArray[j] === this.images[i].id ) {
							if( this.images[i].loaded === FALSE ) {
								return FALSE;
							}
						}
					}
				}
			}
								
			return TRUE;
		}
		
		return FALSE;
	};
	
	this.loadedNames = function ( nameArray ) {
		if( this.begun ) {
			for( var j = 0; j < nameArray.length; j++ ) {
				for( var i = 0; i < imageCount; i++ ) {
					if(this.images[i] ) {
						if( nameArray[j] === this.images[i].name ) {
							if( this.images[i].loaded === FALSE ) {
								return FALSE;
							}
						}
					}
				}
			}
								
            return TRUE;
		}
		
        return FALSE;
	};
	
	this.loadedAll = function() {
		if( this.begun ) {
			for( var i = 0; i < imageCount; i++ ) {
				if ( this.images[i] ) {
					if( this.images[i].loaded === FALSE ) {
						return FALSE;
					}
				}
			}
			
            return TRUE;
		}
		
        return FALSE;
	};
	
	function LoadImage( name, id, position, file ) {
		var thatLoadImage = this;
		
		this.name = name;
		this.id = id;
		this.position = position;
		this.file = file;
		this.loaded = FALSE;
		
		this.image = new Image();
		this.image.onload = function() { setLoaded( thatLoadImage.position ); };

		this.triggerLoad = function () {
			this.image.src = this.file; // Set last.
		};
		
		this.setDone = function () {
			thatLoadImage.loaded = TRUE;
			thatLoadImage.image.onload = thatLoadImage.image.onabort = thatLoadImage.image.onerror = NULL;
		};
	}
}
