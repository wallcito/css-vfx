# What is Snow Stack? #

A new photo viewing 3D CSS Visual Effects library using pure HTML, WebKit’s 3D CSS Effects extensions and JavaScript.

<a href='http://www.youtube.com/watch?feature=player_embedded&v=3R6sb4NO25E' target='_blank'><img src='http://img.youtube.com/vi/3R6sb4NO25E/0.jpg' width='425' height=344 /></a>

[A live demo is available here](http://css-vfx.googlecode.com/svn/trunk/snowstack/snowstack.html) which requires a recent WebKit nightly or a seed of OS X Snow Leopard.

For more details please see the [blog post about the effect](http://www.satine.org/archives/2009/07/11/snow-stack-is-here/)

# Setting up Snow Stack #

You'll need to add 3 things:

Add snowstack.css to the head:
```
<link rel="stylesheet" type="text/css" href="snowstack.css">
```

Add this code to your page:

```
<div class="page view">
    <div class="origin view">
        <div id="camera" class="camera view"></div>
    </div>
</div>
```

Add snowstack.js to the page body:
```
<script type="text/javascript" src="snowstack.js"></script>
```

# Starting Snow Stack #

Example 1: Start Snow Stack with a static array of images:
```
var images = [ "image1.jpg", "image2.jpg", "image3.jpg" ];
snowstack_init(images);
```

Example 2: Start Snow Stack with a static array of images with thumbnails, zoom image, title, and link.
```
var images = [
   { "title": "My Image 1", "thumb": "thumb1.jpg", "zoom": "zoom1.jpg", "link": "http://www.satine.org/" },
   { "title": "My Image 2", "thumb": "thumb2.jpg", "zoom": "zoom2.jpg", "link": "http://www.satine.org/" },
   { "title": "My Image 3", "thumb": "thumb3.jpg", "zoom": "zoom3.jpg", "link": "http://www.satine.org/" }
];
snowstack_init(images);
```

Example 3: Start Snow Stack with a "stream" of images, passed async from a callback function
```
var flickr_page = 1;
function flickr_stream (callback)
{
   var flickr_metadata = // get flickr images from flickr_page;
   var images = jQuery.map(flickr_metadata, function (n, info)
   {
      return info.thumb_url; // This can also be an object just like in Example 2.
   });
   callback(images);
   flickr_page += 1; // increment page number for next call to this function.
}

snowstack_init(flickr_stream);
```

A current full example is available [here](http://code.google.com/p/css-vfx/source/browse/trunk/snowstack/snowstack.html) as part of the source code.