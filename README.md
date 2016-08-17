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
    };
});
```

Othermore the style sheets can be defined with CSSC in that case
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
###get
return value as string
```bash
CSSC(".myCSSClass").get("width");
```
return value as string or function if this is defined as function
```bash
CSSC(".myCSSClass").get("width", true);
```
return all values as object, key and value as as string or function if this is defined as function.
```bash
CSSC(".myCSSClass").get();
```
return all values as object, key as string and value as string.
if the css class as function defined is the return value a function.
```bash
CSSC(".myCSSClass").get(true);
```
###set
set with key/value
```bash
CSSC(".myCSSClass").set("width", "50px");
CSSC(".myCSSClass").set("height", (window.innerHeight / 2)+"px");
```
make the value updatable
```bash
CSSC(".myCSSClass").set("width", function()
{
    return (window.innerWidth / 2)+"px";
});
```
set as object with key and value or a function which returns a key / value object.
```bash
CSSC(".myCSSClass").set({
    width: "50px",
    height: function() //updatable
    {
        return (window.innerHeight / 3)+"px";
    },
});

CSSC(".myCSSClass").set(function()
{
    return {
        width: (window.innerWidth / 2)+"px",
        height: (window.innerHeight / 3)+"px",
    };
});
```

###delete
delete a css property
```bash
CSSC(".myCSSClass").delete("width");
```
delete several css propertys
```bash
//as array
CSSC(".myCSSClass").delete(["width","height"]);

//or as object value will be ignored
CSSC(".myCSSClass").delete({width:"foo",height:"bar"});
```

###destroy
the complete definition of ".myCSSClass" will be deleted
```bash
CSSC(".myCSSClass").destroy();
```


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

##conf
coming soon..

##Import / Export
coming soon..
