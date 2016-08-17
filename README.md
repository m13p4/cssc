# CSSC / CSSController
CSSC is a simple way to make you CSS dynamic with JavaScript

##General
CSSC indexed already loaded style sheets.

After the index, you can access the features
* Set with key/value
```bash
CSSC(".myCSSClass").set("width", "50px");
```
* Set with object
```bash
CSSC(".myCSSClass").set({
    "width":  "50px",
    "height": "25px",
});
```
* Set updatable property
```bash
CSSC(".myCSSClass").set("width", function()
{
    return window.innerWidth+"px";
});
```
* Set updatable class
```bash
CSSC(".myCSSClass").set(function()
{
    return {
        width:  window.innerWidth+"px",
        height: window.innerHeight+"px",
    }
});
```

Additionally can also complete with CSSC to define your style sheets.
```bash
CSSC({
    ".myCSSClass": 
    {
        'width':  "50px",                   //static 
        'height': window.innerHeight+"px",  //dynamic 
        'margin': function()                //updatable 
        {
            //return the value to set
            return parseInt(Math.random() * (25 - 15) + 15)+"px";
        }
    },
    ".myUpdatableClass": function() //complete css class is updatable
    {
        return {
            'width':  "50px", //static
            'height': CSSC(".myCSSClass").get("height"), //you can use values of other css classes
            'margin': function() //this setter is not updatable because the entire class is updatable
            {
                return (parseInt(CSSC(".myCSSClass").get("margin")) / 2) + "px";
            }
        };
    },
    "@media screen and (max-width: 680px)": 
    {
        ".test":{
            'font-size': parseInt(Math.random()*15)+"px"
        }
    },
});
```
##Methods: get / set / delete / destroy
coming soon..

##Events
coming soon..

##Animate (keyframes)
coming soon..

##Updatable
The update method must be called in order to use the advantages of updatable setter.
```bash
CSSC.update();
```
You can pass a selector to the method.
```bash
CSSC.update(".myCSSClass");
```
It might be useful to call the method within an event.
```bash
window.addEventListener("resize", function()
{
    CSSC.update();
});
```

##Import / Export
coming soon..
