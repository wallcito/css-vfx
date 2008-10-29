/*
    Copyright (C) 2008 Charles H. Ying. All Rights Reserved.
    
    http://www.satine.org/
    
    This source code is released under the BSD license.

    See the README for documentation
*/

(function () {  // Module pattern

/*
    TrayController is a horizontal touch event controller that tracks cumulative offsets and passes events to a delegate. 
*/

var global = this;

TrayController = function ()
{
    return this;
}

TrayController.prototype.init = function (elem)
{
    this.currentX = 0;
    this.elem = elem;
}

TrayController.prototype.touchstart = function (event)
{
    this.startX = event.touches[0].pageX - this.currentX;
    this.touchMoved = false;

    window.addEventListener("touchmove", this, true);
    window.addEventListener("touchend", this, true);

    this.elem.style.webkitTransitionDuration = "0s";
}

TrayController.prototype.touchmove = function (e)
{
    this.touchMoved = true;
    this.lastX = this.currentX;
    this.lastMoveTime = new Date();
    this.currentX = event.touches[0].pageX - this.startX;
    this.delegate.update(this.currentX);
}

TrayController.prototype.touchend = function (e)
{
    window.removeEventListener("touchmove", this, true);
    window.removeEventListener("touchend", this, true);

    this.elem.style.webkitTransitionDuration = "0.4s";

    if (this.touchMoved)
    {
        /* Approximate some inertia -- the transition function takes care of the decay over 0.4s for us, but we need to amplify the last movement */
        var delta = this.currentX - this.lastX;
        var dt = (new Date()) - this.lastMoveTime + 1;
        /* dx * 400 / dt */

        this.currentX = this.currentX + delta * 200 / dt;
        this.delegate.updateTouchEnd(this);
    }
    else
    {
        this.delegate.clicked(this.currentX);
    }
}

TrayController.prototype.handleEvent = function (event)
{
    this[event.type](event);
    event.preventDefault();
}

/*
    These variables define how the zflow presentation is made.
*/

const CSIZE = 150;
const CGAP = CSIZE / 2;

const FLOW_ANGLE = 70;
const FLOW_THRESHOLD = CGAP / 2;
const FLOW_ZFOCUS = CSIZE;
const FLOW_XGAP = CSIZE / 3;

const T_NEG_ANGLE = "rotateY(" + (- FLOW_ANGLE) + "deg)";
const T_ANGLE = "rotateY(" + FLOW_ANGLE + "deg)";
const T_ZFOCUS = "translateZ(" + FLOW_ZFOCUS + "px)";

FlowDelegate = function ()
{
    this.cells = new Array();
    this.transforms = new Array();
}

FlowDelegate.prototype.init = function (elem)
{
    this.elem = elem;
}

FlowDelegate.prototype.updateTouchEnd = function (controller)
{
    this.lastFocus = undefined;

    // Snap to nearest position
    var i = this.getFocusedCell(controller.currentX);

    controller.currentX = - i * CGAP;
    this.update(controller.currentX);
}

FlowDelegate.prototype.clicked = function (currentX)
{
    var i = - Math.round(currentX / CGAP);
    var cell = this.cells[i];

    var transform = this.transformForCell(cell, i, currentX);

    if ((this.lastFocus == undefined) || this.lastFocus != i)
    {
        transform += " translateZ(150px) rotateY(180deg)";
        this.lastFocus = i;
    }
    else
    {
        this.lastFocus = undefined;
    }

    this.setTransformForCell(cell, i, transform);
}

FlowDelegate.prototype.getFocusedCell = function (currentX)
{
    // Snap to nearest position
    var i = - Math.round(currentX / CGAP);

    // Clamp to cells array boundary
    return Math.min(Math.max(i, 0), this.cells.length - 1);
}

FlowDelegate.prototype.transformForCell = function (cell, i, offset)
{
    /* 
        This function needs to be fast, so we avoid function calls, divides, Math.round,
        and precalculate any invariants we can.
    */
    var x = (i * CGAP);
    var ix = x + offset;

    if ((ix < FLOW_THRESHOLD) && (ix >= -FLOW_THRESHOLD))
    {
        // yangle = 0, zpos = FLOW_ZFOCUS
        return T_ZFOCUS + " translateX(" + x + "px)";
    }
    else if (ix > 0)
    {
        // yangle = -FLOW_ANGLE, x + FLOW_XGAP
        return "translateX(" + (x + FLOW_XGAP) + "px) " + T_NEG_ANGLE;
    }
    else
    {
        // yangle = FLOW_ANGLE, x - FLOW_XGAP
        return "translateX(" + (x - FLOW_XGAP) + "px) " + T_ANGLE;
    }
}

FlowDelegate.prototype.setTransformForCell = function (cell, i, transform)
{
    if (this.transforms[i] != transform)
    {
        cell.style.webkitTransform = transform;
        this.transforms[i] = transform;
    }
}

FlowDelegate.prototype.update = function (currentX)
{
    this.elem.style.webkitTransform = "translateX(" + (currentX) + "px)";

    /*
        It would be nice if we only updated dirty cells... for now, we use a cache
    */
    for (var i in this.cells)
    {
        var cell = this.cells[i];
        this.setTransformForCell(cell, i, this.transformForCell(cell, i, currentX));
        i += 1;
    }
}

global.zflow = function (images, selector)
{
    var controller = new TrayController();
    var delegate = new FlowDelegate();
    var tray = jQuery(selector);

    controller.init(tray[0]);
    delegate.init(tray[0]);

    controller.delegate = delegate;

    var imagesLeft = images.length;
    
    var cellCSS = {
        top: Math.round(-CSIZE * 0.65) + "px",
        left: Math.round(-CSIZE / 2) + "px",
        width: CSIZE + "px",
        height: Math.round(CSIZE * 1.5) + "px",
        opacity: 0,
    }

    jQuery.each(images, function (i, url)
    {
        var cell = jQuery('<div class="cell"><img /><canvas /></div>');
        var image = cell.find("img");
        var canvas = cell.find("canvas");
        
        image.attr("src", url);

        jQuery(image).load(function ()
        {
            imagesLeft -= 1;

            var iwidth = image[0].width;
            var iheight = image[0].height;
            
            var ratio = Math.min(CSIZE / iheight, CSIZE / iwidth);
            
            iwidth *= ratio;
            iheight *= ratio;

            image.width(iwidth);
            image.height(iheight);

            cell.css(cellCSS);
            
            image.css({
                top: Math.round(CSIZE - iheight) + "px",
                left: Math.round((CSIZE - iwidth) / 2) + "px",
            });
            
            canvas.css({
                top: CSIZE + "px",
                left: Math.round((CSIZE - iwidth) / 2) + "px",
            });
            
            reflect(image[0], iwidth, iheight, canvas[0]);

            delegate.setTransformForCell(cell[0], delegate.cells.length, delegate.transformForCell(cell[0], delegate.cells.length, controller.currentX));
            delegate.cells.push(cell[0]);

            tray.append(cell);

            cell.css({ opacity: 1.0 });

            if (imagesLeft == 0)
            {
                window.setTimeout( function() { window.scrollTo(0, 0); }, 100 );
            }
        });
    });

    tray[0].addEventListener('touchstart', controller, false);
}

function reflect(image, iwidth, iheight, canvas)
{
    canvas.width = iwidth;
    canvas.height = iheight / 2;

    var ctx = canvas.getContext("2d");
    
    ctx.save();

    ctx.translate(0, iheight - 1);
    ctx.scale(1, -1);
    ctx.drawImage(image, 0, 0, iwidth, iheight);

    ctx.restore();

    ctx.globalCompositeOperation = "destination-out";

    var gradient = ctx.createLinearGradient(0, 0, 0, iheight / 2);
    gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    
    ctx.fillStyle = gradient;
    ctx.fill();
}

})();
