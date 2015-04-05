# What is zflow? #

<a href='http://www.youtube.com/watch?feature=player_embedded&v=4FvsMhznf2I' target='_blank'><img src='http://img.youtube.com/vi/4FvsMhznf2I/0.jpg' width='425' height=344 /></a>

For more details, please see the [blog post](http://www.satine.org/archives/2008/11/06/coverflow-for-safari-on-iphone/)

# Documentation #

Include zflow.css, zflow.js, and jQuery in your web page.

Call the JavaScript function `zflow(images, selector)`, where:

  * `images` is an Array of image URLs to load
  * `selector` is a jQuery selector string or element to load the images into.

Add a HTML markup block to where you'd like the coverflow origin to be placed and add the `zflow`, `tray` and `centering` CSS classes, for example:

```
<body class="zflow">
    <div class="centering portrait">
        <div id="tray" class="tray"></div>
    </div>
</body>
```

# How zflow Works #

  1. **Setup** - zflow starts by loading each image from the images array. When each image is loaded, we scale the image to fit in a square region, and apply 3D CSS transforms to scale it in place.
  1. **Reflections** - zflow then takes the scaled image and creates a Canvas element that contains a gradient alpha mask of the image's reflection (using a "reflect" function to do this) and positions the canvas element in place.
  1. **Touch Controller** - zflow creates a TouchController object, who's job is to field touch events from Mobile Safari and calculate an appropriate offset. (TBD - Use Safari's absolute page offsets instead of calculating this by hand)
  1. **Clicking** - zflow detects when no move events have been made, and zooms + rotates the focused image forward by setting a "CSS Transition"ed 3D transform on the focused image. Clicking again transitions the image back.
  1. **Inertia** - zflow achieves inertia by setting the "transition timing function" of the "tray" to an "ease-out" function, which slows things down. On the touch end event, we calculate the projected velocity and set the **tray**'s target position to that location. CSS Transitions handles the decay in velocity as the transition timing function executes -- slowing the tray down gradually.

# Performance Considerations #

zflow tries to do very little calculation, and touch as few transforms as possible to avoid redraw. Several techniques are used here, but lacking a proper profiler, most of these speed gains have been through trial and error.

  1. We use the CSS transition timing function to decay the velocity of the tray instead of calculating this by hand. Per frame approaches ended up being unacceptably slow on the iPhone.
  1. We modify the tray's transform instead of each image's 3D transform
  1. We cache the last transform set on each image, and only set the CSS Transform when the transform has changed.