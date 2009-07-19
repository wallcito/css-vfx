/*

    Copyright (C) 2009 Charles Ying. All Rights Reserved.
    This source code is available under Apache License 2.0.
    
    Performance Notes (courtesy of Apple):
    	on leopard, animating transforms with a transform list > 1 function, animation falls back to software
    	shadows (and animated shadows) plus border animations can cause additional redraws
    	offsetWidth / offsetHeight should be avoided.

*/

var CWIDTH;
var CHEIGHT;
var CGAP = 10;
var CXSPACING;
var CYSPACING;
var CROWS = 3;

var snowstack_options = {
	captions: false
};

function translate3d(x, y, z)
{
	return "translate3d(" + x + "px, " + y + "px, " + z + "px)";
}

var vfx = {
	elem: function (name, attrs, child)
	{
		var e = document.createElement(name);
		if (attrs)
		{
			for (var key in attrs)
			{
				e.setAttribute(key, attrs[key]);
			}
		}
		
		if (child)
		{
			e.appendChild(child);
		}
		return e;
	},
	query: function (selectors)
	{
		return document.querySelector(selectors);
	},
	attach: function (elem, callback)
	{
		elem.addEventListener("load", callback, false);
	}
};

var currentCellIndex = -1;

var cells = [];

var currentTimer = null;

var dolly = vfx.query("#dolly");
var camera = vfx.query("#camera");
var caption = vfx.query("#caption");

var magnifyMode = false;
var newbieUser = true;

var zoomTimer = null;

function cameraTransformForCell(n)
{
	var x = Math.floor(n / CROWS);
	var y = n - x * CROWS;
	var cx = (x + 0.5) * CXSPACING;
	var cy = (y + 0.5) * CYSPACING;

	if (magnifyMode)
	{
		return translate3d(-cx, -cy, 180);
	}
	else
	{
		return translate3d(-cx, -cy, 0);
	}	
}

function layoutImageInCell(image, cell)
{
    var iwidth = image.width;
    var iheight = image.height;
    var ratio = Math.min(CHEIGHT / iheight, CWIDTH / iwidth);
    
    iwidth *= ratio;
    iheight *= ratio;

	image.style.width = Math.round(iwidth) + "px";
	image.style.height = Math.round(iheight) + "px";

	image.style.left = Math.round((CWIDTH - iwidth) / 2) + "px";
	image.style.top = Math.round((CHEIGHT - iheight) / 2) + "px";
}

function refreshImage(elem, cell)
{
	if (cell.iszoomed)
	{
		return;
	}

	if (zoomTimer)
	{
		clearTimeout(zoomTimer);
	}
	
	zoomTimer = setTimeout(function ()
	{
    	var zoomImage = vfx.elem('img');

		vfx.attach(zoomImage, function ()
		{
			layoutImageInCell(zoomImage, cell.div);
			if (elem && elem.parentNode)
			{
				elem.parentNode.replaceChild(zoomImage, elem);
			}
			cell.iszoomed = true;
		});

		zoomImage.src = cell.info.zoom;

		zoomTimer = null;
	}, 2000);
}

function snowstack_update(newIndex, newmagnifymode)
{
	if (currentCellIndex == newIndex && magnifyMode == newmagnifymode)
	{
		return;
	}

	var oldIndex = currentCellIndex;

	if (oldIndex != -1)
	{
		var oldCell = cells[oldIndex];
		
		oldCell.div.className = "cell view";

		if (oldCell.reflection)
		{
			oldCell.reflection.className = "cell view reflection";
		}
	}
	
	newIndex = Math.min(Math.max(newIndex, 0), cells.length - 1);
	currentCellIndex = newIndex;

	var cell = cells[newIndex];
	
	magnifyMode = newmagnifymode;
	
	if (magnifyMode)
	{
		// User figured out magnify mode, not a newbie.
		newbieUser = false;

		// Show the photo caption
		
		if (snowstack_options.captions)
		{
			jQuery(caption).text(cell.info.title)[0].style.opacity = 1;
		}

		cell.div.className = "cell view magnify";
		refreshImage(cell.divimage, cell);
	}
	else
	{
		cell.div.className = "cell view selected";
		
		if (cell.reflection)
		{
			cell.reflection.className = "cell view reflection selected";
		}
		
		if (snowstack_options.captions)
		{
			caption.style.opacity = 0;
		}
	}

	if (newbieUser)
	{
		newbieUser = false;
		
		if (snowstack_options.captions)
		{
			caption.style.opacity = 0;
		}
	}

	dolly.style.webkitTransform = cameraTransformForCell(newIndex);
	
	var currentMatrix = new WebKitCSSMatrix(document.defaultView.getComputedStyle(dolly, null).webkitTransform);
	var targetMatrix = new WebKitCSSMatrix(dolly.style.webkitTransform);
	
	var dx = currentMatrix.e - targetMatrix.e;
	var angle = Math.min(Math.max(dx / (CXSPACING * 3.0), -1), 1) * 45;
	
	camera.style.webkitTransform = "rotateY(" + angle + "deg)";
	camera.style.webkitTransitionDuration = "330ms";

	if (currentTimer)
	{
		clearTimeout(currentTimer);
	}
	
	currentTimer = setTimeout(function ()
	{
		camera.style.webkitTransform = "rotateY(0)";
		camera.style.webkitTransitionDuration = "5s";
	}, 330);
}

function snowstack_addimage(reln, info)
{
	var cell = {};
	var realn = cells.length;
	cells.push(cell);

	var x = Math.floor(realn / CROWS);
	var y = realn - x * CROWS;

	cell.info = info;

	cell.div = vfx.elem("div", { "class": "cell view", "style": 'width: ' + CWIDTH + 'px; height: ' + CHEIGHT + 'px' });
	cell.div.style.webkitTransform = translate3d(x * CXSPACING, y * CYSPACING, 0);

	cell.divimage = vfx.elem("img");

	vfx.attach(cell.divimage, function ()
	{
		layoutImageInCell(cell.divimage, cell.div);
		cell.divimage.style.opacity = 0;
		cell.div.appendChild(vfx.elem("a", { "class": "mover viewflat", "href": cell.info.link, "target": "_blank" }, cell.divimage));
		cell.divimage.style.opacity = 1;
	});
	
	cell.divimage.src = info.thumb;

	vfx.query("#stack").appendChild(cell.div);

	if (y == (CROWS - 1))
	{
		cell.reflection = vfx.elem("div", { "class": "cell view reflection", "style": 'width: ' + CWIDTH + 'px; height: ' + CHEIGHT + 'px' });
		cell.reflection.style.webkitTransform = translate3d(x * CXSPACING, y * CYSPACING, 0);

		cell.reflectionimage = vfx.elem("img");
	
		vfx.attach(cell.reflectionimage, function ()
		{
			layoutImageInCell(cell.reflectionimage, cell.reflection);
			cell.reflectionimage.style.opacity = 0;
			cell.reflection.appendChild(vfx.elem("div", { "class": "mover viewflat" }, cell.reflectionimage));
			cell.reflectionimage.style.opacity = 1;
		});
	
		cell.reflectionimage.src = info.thumb;

		vfx.query("#rstack").appendChild(cell.reflection);
	}
}

function snowstack_init(imagefun)
{
	var page = 1;
	var loading = true;

	CHEIGHT = Math.round(window.innerHeight / (CROWS + 2));
	CWIDTH = Math.round(CHEIGHT * 300 / 180);
	CXSPACING = CWIDTH + CGAP;
	CYSPACING = CHEIGHT + CGAP;

	vfx.query("#mirror").style.webkitTransform = "scaleY(-1.0) " + translate3d(0, - CYSPACING * (CROWS * 2) - 1, 0);

    imagefun(function (images)
    {
		jQuery.each(images, snowstack_addimage);
		snowstack_update(Math.floor(CROWS / 2));
    	loading = false;
    }, page);
    
    var keys = { left: false, right: false, up: false, down: false };

    var keymap = { 37: "left", 38: "up", 39: "right", 40: "down" };
    
    var keytimer = null;
    
    function updatekeys()
    {
    	var newCellIndex = currentCellIndex;
		if (keys.left)
		{
			/* Left Arrow */
			if (newCellIndex >= CROWS)
			{
				newCellIndex -= CROWS;
			}
		}
		if (keys.right)
		{
			/* Right Arrow */
			if ((newCellIndex + CROWS) < cells.length)
			{
				newCellIndex += CROWS;
			}
			else if (!loading)
			{
				/* We hit the right wall, add some more */
				page = page + 1;
				loading = true;
			    imagefun(function (images)
				{
					jQuery.each(images, snowstack_addimage);
					loading = false;
				}, page);
			}
		}
		if (keys.up)
		{
			/* Up Arrow */
			newCellIndex -= 1;
		}
		if (keys.down)
		{
			/* Down Arrow */
			newCellIndex += 1;
		}

		snowstack_update(newCellIndex, magnifyMode);
    }
    
	var delay = 330;

    function keycheck()
    {
    	if (keys.left || keys.right || keys.up || keys.down)
    	{
	    	if (keytimer === null)
	    	{
	    		delay = 330;
	    		var doTimer = function ()
	    		{
	    			updatekeys();
	    			keytimer = setTimeout(doTimer, delay);
	    			delay = 60;
	    		};
	    		doTimer();
	    	}
    	}
    	else
    	{
    		clearTimeout(keytimer);
    		keytimer = null;
    	}
    }
    
	/* Limited keyboard support for now */
	window.addEventListener('keydown', function (e)
	{
		if (e.keyCode == 32)
		{
			/* Magnify toggle with spacebar */
			snowstack_update(currentCellIndex, !magnifyMode);
		}
		else
		{
			keys[keymap[e.keyCode]] = true;
		}
		
		keycheck();
	});
	
	window.addEventListener('keyup', function (e)
	{
		keys[keymap[e.keyCode]] = false;
		keycheck();
	});
}

