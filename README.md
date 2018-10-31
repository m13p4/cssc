
---


**Caution:** This version is a BETA.

*Stable version checklist:*
- [x] ~~*Support all modern Browser and IE 9+*~~
- [x] ~~*Support CSS parse on server side*~~
- [ ] *no malfunction of the code*

---

# CSSC
CSSC is a CSS Controller to manage your Cascading Style Sheets.

## General
CSSC can be used to define Cascading Style Sheets (CSS) in your browser, to change/show/delete allready defined CSS.



## Controller object (CSSC)
The controller object (CSSC) is a function to get handler object or to import new style sheets.

* get handler object
    ```javascript
    var h = CSSC(".className"); //get handler object with all CSS objects are defined as .className
        h = CSSC([".className1", ".className2"]); //get handler object with .className1 and .className2
        h = CSSC(/\.className[0-9]{,1}/); //get handler obejct with objects matched to regular expression
        h = CSSC(); //get handler object with all defined CSS objects
    ```
* define CSS (import)
    ```javascript
    //define new style sheets in browser
    CSSC({
        ".className": {
            border: "1px solid #000"
        },
        ".className1": {
            border: "1px dotted #000"
        },
        ".className2": function(){ //updatable object
            return {
                border: "none"
            };
        }
    });
    ```

## Controller methods

---

### .init()
**init** is a method to initialize allready defined CSS. After **init** you can change, show or delete CSS.
```
.init(initObj)
```
* `initObj` - DOM "<style\>", "<link\>" element, an other CSSC object, StyleSheet object or Array containing it.

**`Return value`** - Controller object (CSSC)

#### Example
```javascript
// init all defined CSS rules in 
// '<style id="style-sheet">...</style>' element
CSSC.init(document.getElementById("style-sheet")); 

// init all CSS rules in all 
// '<style>...</style>' elements
CSSC.init(document.querySelectorAll("style")); 
``` 

---

### .import()
**import** is a method to import JS objects to the CSS Controller.
```
.import(importObj)
```
* `importObj` - an object with style sheets

**`Return value`** - Controller object (CSSC)

#### Example
```javascript
var importObj = {
    body: {
        margin: 1
    },
    p: {
        width: 500,
        margin: "auto",
        "span.first": { // generate CSS rule "p span.first"
            "font-size": 25
        },
        "@media screen and (max-width: 500px)": { // generate media rule with "p" rule
            width: "100%"
        }
    },
    ".updatable": function(){ // generate updatable class
        return {
            'font-size': 10 + (Math.random() * 10),
        };
    }
};

CSSC.import(importObj); //alternativly can be used simply CSSC(importObj);
``` 

---

### .update()
**update** is a method for updating CSS properties which have been defined via functions
```
.update([selector])
```
* *`selector` \[optional\]* - a selector as String or RegEx or Array of Strings

**`Return value`** - Controller object (CSSC)

#### Example
```javascript
CSSC.update(); // update all CSS rules which were defined through functions
// or
CSSC.update(".updatable"); // update CSS rule .updatable when it was defined through function
``` 

---

### .export()
**export** is a method to export defined CSS as String, Object or Array
```
.export([exportType])
```
* *`exportType` \[optional\]* - String with export type (default: "object")
    * *`"css"` - export as CSS String*
    * *`"min"` - export as minified CSS String* 
    * *`"obj"` - export as JS-Object*
    * *`"arr"` - export as array*
    * *`"object"` - the same as "obj"*
    * *`"objNMD"` - export as not multidimensional object*
    * *`"array"` - the same as "arr"*

**`Return value`** - Mixed

#### Example
```javascript
CSSC({
    body: {
        margin: 1
    },
    p: {
        width: 500,
        margin: "auto",
        "span.first": { // generate CSS rule "p span.first"
            "font-size": 25
        },
        "@media screen and (max-width: 500px)": { // generate media rule with "p" rule
            width: "100%"
        }
    },
    ".updatable": function(){ // generate updatable class
        return {
            'font-size': 10 + (Math.random() * 10),
        };
    }
});

var exportObject = CSSC.export(); // or CSSC.export("obj") or CSSC.export("object")
console.log(JSON.stringify(exportObject, true, 4));
/*
{
    "body": {
        "margin": "1px"
    },
    "p": {
        "width": "500px",
        "margin": "auto",
        "span.first": {
            "font-size": "25px"
        },
        "@media screen and (max-width: 500px)": {
            "width": "100%"
        }
    },
    ".updatable": {
        "font-size": "18.34px"
    }
}
*/

exportObject = CSSC.export("css");
console.log(exportObject);
/*
body {
  margin: 1px;
}
p {
  width: 500px;
  margin: auto;
}
p span.first {
  font-size: 25px;
}
@media screen and (max-width: 500px) {
  p {
    width: 100%;
  }
}
.updatable {
  font-size: 18.34px;
}
*/

exportObject = CSSC.export("min");
console.log(exportObject);
/*
body{margin:1px;}p{width:500px;margin:auto;}p span.first{font-size:25px;}@media screen and (max-width:500px){p{width:100%;}}.updatable{font-size:18.34px;}
*/

exportObject = CSSC.export("objNMD");
console.log(JSON.stringify(exportObject, true, 4));
/*
{
    "body": {
        "margin": "1px"
    },
    "p": {
        "width": "500px",
        "margin": "auto"
    },
    "p span.first": {
        "font-size": "25px"
    },
    "@media screen and (max-width: 500px)": {
        "p": {
            "width": "100%"
        }
    },
    ".updatable": {
        "font-size": "18.34px"
    }
}
*/

exportObject = CSSC.export("array");
console.log(JSON.stringify(exportObject, true, 4));
/*
[
    {
        "body": {
            "margin": "1px"
        }
    },
    {
        "p": {
            "width": "500px",
            "margin": "auto"
        }
    },
    {
        "p span.first": {
            "font-size": "25px"
        }
    },
    {
        "@media screen and (max-width: 500px)": [
            {
                "p": {
                    "width": "100%"
                }
            }
        ]
    },
    {
        ".updatable": {
            "font-size": "18.34px"
        }
    }
]
*/
``` 

---

### .parse()
**parse** is a method to parse defined CSS. This method is identical to .export(CSSC.type_export.css) or export(CSSC.type_export.min)

```
.parse([min])
```
* *`min` \[optional\]* - Boolean, if true return a minified CSS (default: false)

**`Return value`** - String with CSS

#### Example
```javascript
/*
this method returns the same result as .export("css") or .export("min");
*/

exportObject = CSSC.parse(); // or .parse(false)
console.log(exportObject);
/*
body {
  margin: 1px;
}
p {
  width: 500px;
  margin: auto;
}
p span.first {
  font-size: 25px;
}
@media screen and (max-width: 500px) {
  p {
    width: 100%;
  }
}
.updatable {
  font-size: 18.34px;
}
*/

exportObject = CSSC.parse(true);
console.log(exportObject);
/*
body{margin:1px;}p{width:500px;margin:auto;}p span.first{font-size:25px;}@media screen and (max-width:500px){p{width:100%;}}.updatable{font-size:18.34px;}
*/
```

---

### .new()
**new** is a method to get a new CSS Controller (CSSC)
```
.new()
```
**`Return value`** - New Controller object (CSSC)

#### Example
```javascript
var newCSSC = CSSC.new();
newCSSC({
    ".myClass": {
        "margin-top": 10
    }
});
```

---

### .conf()
**conf** is a method to set or get configurations.
```
.conf([conf[, value]])
```
* *`conf` \[optional\]* - An object with key-value pair to set, Array of Strings to get or key as String to set/get
* *`value` \[optional\]* - if conf a String becomes value to set

**`Return value`** - Mixed -> Controller object (CSSC) if set or object key-value pair or configuration value

#### Example
```javascript
CSSC.conf({ // set as object
    style_id: "my-style-sheets", // [String]  Document element ID 
    view_err: true,              // [Boolean] Show errors in console
    parse_tab_len: 4             // [Integer] Length of space characters by export
});

CSSC.conf("style_id", "cssc-sheet");      // set with key String
CSSC.conf("style_id");                    // get with key String 
CSSC.conf(["style_id", "parse_tab_len"]); // get with Array of strings, return an object as key-value pair
CSSC.conf();                              // get all defined configurations
```

---

### .vars()
**vars** is a method to set or get variables. If you need to use variable keys, you can use this method.
```
.vars([var[, value]])
```
* *`var` \[optional\]* - An object with key-value pair to set, Array of Strings to get or key as String to set/get
* *`value` \[optional\]* - if conf a String becomes value to set

**`Return value`** - Mixed -> Controller object (CSSC) if set or object key-value pair or variable value

#### Example
```javascript
//The principle of set and get vars is the same as with conf method.

CSSC.vars({
    T: "-top", // use String / Integer / Float
    R: "-right",
    B: "-bottom",
    L: "-left",
    box: { // use Objects or Arrays
        m: "margin",
        p: "padding"
    },
    media: function(a, b) // use Functions
    {
        return "@media "+a+" and (max-width: "+b+"px)";
    },
    MT: "$box.m$T", // use vars in vars
});


// begin the var with "$" character
CSSC({
    body: {
        "$box.m": 10,
        "$box.p$T": 15,
        "$media(screen, 500)": {
            "$box.m$B": 20,
            $MT: 25
        }
    }
});

console.log(CSSC.parse());
/*
body {
  margin: 10px;
  padding-top: 15px;
}
@media screen and (max-width: 500px) {
  body {
    margin-bottom: 20px;
    margin-top: 25px;
  }
}
*/
```

---

### .parseVars()
this method is a helper function, can be used to test your vars.
```
.parseVars(text[, vars])
```
* `text` - A String, the text to parse
* *`vars` \[optional\]* - An object with variables as key-value pair

**`Return value`** - Parsed string 

#### Example
```javascript
CSSC.vars({
    myVar: "my variable text",
});

var val = CSSC.parseVars("this is $myVar");
console.log(val);
/*
this is my variable text
*/

val = CSSC.parseVars("this is $myVar", {myVar: "my temporarily overwritten text"});
console.log(val);
/*
this is my temporarily overwritten text
*/

val = CSSC.parseVars("this var $notExists");
console.log(val);
/*
this var $notExists
*/
```

---

### .cssFromObj()
this method is a helper function, can be used to parse CSS from simple object
```
.cssFromObj(obj[, min[, tabLen]])
```
* `obj` - A simple object to parse
* *`min` \[optional\]* - a Boolean if the value true, return value is a minified CSS String (default: false)
* *`tabLen` \[optional\]* - an Integer to define the length of tab (default: 2)

**`Return value`** - Parsed string 

#### Example
```javascript
var cssString = CSSC.cssFromObj({body:{margin: "20px"}});
console.log(cssString);
/*
body {
  margin: 20px;
}
*/

cssString = CSSC.cssFromObj({body:{margin: "20px"}}, true);
console.log(cssString);
/*
body{margin:20px;}
*/

cssString = CSSC.cssFromObj({body:{margin: "20px"}}, false, 8);
console.log(cssString);
/*
body {
        margin: 20px;
}
*/
```

---

### .objFromCss()
this method is a helper function, can be used to generate an object from a css string.
```
.objFromCss(css)
```
* `css` - A CSS String

**`Return value`** - Generated object

#### Example
```javascript
var cssObj = CSSC.objFromCss("body{margin:20px;}");
console.log(JSON.stringify(cssObj, true, 4));
/*
{
    "margin": "20px"
}
*/
```

---

## Controller properties

---

### .version
**version** is a String with version number of CSS Controller

```javascript
console.log(CSSC.version);
/*
1.0b
*/
``` 

---

### .type
**type** is an object with CSS type definitions

```javascript
console.log(JSON.stringify(CSSC.type, true, 4));
/*
{
    "rule": 1,
    "charset": 2,
    "import": 3,
    "media": 4,
    "fontFace": 5,
    "page": 6,
    "keyframes": 7,
    "keyframe": 8,
    "namespace": 10,
    "counterStyle": 11,
    "supports": 12,
    "fontFeatureValues": 14,
    "viewport": 15
}
*/
``` 

---

### .type_export
**type_export** is an object with CSS Controller export-type definitions

```javascript
console.log(JSON.stringify(CSSC.type_export, true, 4));
/*
{
    "css": "css",
    "min": "min",
    "obj": "obj",
    "arr": "arr",
    "object": "object",
    "notMDObject": "objNMD",
    "array": "array"
}
*/
``` 

---

### ._conf
**_conf** is an object with default CSSC configurations

```javascript
console.log(JSON.stringify(CSSC._conf, true, 4));
/*
{
    "style_id": "cssc-style",   // [String]  ID of the "<style>" element
    "view_err": true,           // [Boolean] if true, the errors are displayed in console
    "parse_tab_len": 2,         // [Integer] Length of space characters by export
    "parse_unit_default": "px", // [String]  default unit to set on values if integer or float given
    "parse_vars_limit": 100     // [Integer] limit to max parse variables
}
*/
``` 

---

## Handler object
The Handler object is an object to get, set, delete, update and export defined CSS properties. You get this object from the controller object

```javascript
var h = CSSC(".className"); //get a handler object with all CSS objects are defined as .className
    h = CSSC([".className1", ".className2"]); //get a handler object with .className1 and .className2
    h = CSSC(/\.className[0-9]{,1}/); //get a handler obejct with objects matched to regular expression
    h = CSSC(); //get a handler object with all defined CSS objects
```

## Handler methods

---

### .get()
**get** is a method to get CSS properties
```
.get([propertie[, returnAll]])
```
* *`propertie` \[optional\]* - A String with property name. If this value is not given, return this method an object with all properies of the Handler object
* *`returnAll` \[optional\]* - A Boolean. If true, the return value is an Array with all found properties; if false, the return value is the last definition of property in the Handler object (default: false)

**`Return value`** - Mixed -> Object, String or Array of Strings, depending on how the parameters were set

#### Example
```javascript
CSSC({
    body: [{
        margin: 10,
        padding: 5,
    },{
        border: "1 solid #ccc",
        padding: 7
    }]
});

var val = CSSC("body").get("padding");
console.log(val);
/*
7px
*/

val = CSSC("body").get("padding", true);
console.log(JSON.stringify(val, true, 4));
/*
[
    "5px",
    "7px"
]
*/

val = CSSC("body").get();
console.log(JSON.stringify(val, true, 4));
/*
{
    "body": [
        {
            "margin": "10px",
            "padding": "5px"
        },
        {
            "border": "1px solid #ccc",
            "padding": "7px"
        }
    ]
}
*/
```


---

### .set()
**set** is a method to set CSS properties
```
.set(toSet[, value])
```
* `toSet` - A property to set as String, an object to set with key-value pair, a function that returns the values to set, or Array containing an object or function with key-value. 
* *`value` \[optional\]* - use this when `toSet` a String. A value to set as String/Integer/Float, a function that returns the values to set, an object to create a new CSS rule or an Array with objects to create new rules.

**`Return value`** - Handler object.

#### Example
```javascript
CSSC({
    body: {
        margin: 10,
        padding: 5,
    }
});

CSSC("body").set("border", "1 solid red");
console.log(CSSC.parse());
/*
body {
  margin: 10px;
  padding: 5px;
  border: 1px solid red;
}
*/

CSSC("body").set({margin: 20, padding: 0});
console.log(CSSC.parse());
/*
body {
  margin: 20px;
  padding: 0px;
  border: 1px solid red;
}
*/

CSSC("body").set(".newClass",{margin: "5 0 0 10", float: "left"});
console.log(CSSC.parse());
/*
body {
  margin: 20px;
  padding: 0px;
  border: 1px solid red;
}
body .newClass {
  margin: 5px 0px 0px 10px;
  float: left;
}
*/

CSSC("body .newClass").set({border: "1 solid #ccc", "/.class1":{float: "none"}});
console.log(CSSC.parse());
/*
body {
  margin: 20px;
  padding: 0px;
  border: 1px solid red;
}
body .newClass {
  margin: 5px 0px 0px 10px;
  float: left;
  border: 1px solid #ccc;
}
body .newClass.class1 {
  float: none;
}
*/
```

---

### .delete()
**delete** is a method to delete a CSS property or a CSS rule
```
.delete([property])
```
* *`property` \[optional\]* - A property name to delete. If this value not given, the method deletes the complete rule(s)

**`Return value`** - Handler object.

#### Example
```javascript
CSSC({
    body: [{
        margin: 10,
        padding: 5,
    },{
        border: "1 solid #ccc",
        padding: 7
    }]
});

var parsed = CSSC.parse();
console.log(parsed);
/*
body {
  margin: 10px;
  padding: 5px;
}
body {
  border: 1px solid #ccc;
  padding: 7px;
}
*/

// delete property
CSSC("body").delete("padding");
parsed = CSSC.parse();
console.log(parsed);
/*
body {
  margin: 10px;
}
body {
  border: 1px solid #ccc;
}
*/

//delete rule
CSSC("body").first().delete();
parsed = CSSC.parse();
console.log(parsed);
/*
body {
  border: 1px solid #ccc;
}
*/
```


---

### .update()
**update** is a method to update updatable properties or rules

```
.update()
```

**`Return value`** - Handler object. 

#### Example
```javascript
CSSC({
    '.updatable1': function(){
        return {
            width: Math.random()*100+100,
            height: Math.random()*100+100,
        };
    },
    '.updatable2': {
        width: 20,
        height: function(){ return Math.random()*10+10; }
    }
});

var parsed = CSSC.parse();
console.log(parsed);
/*
.updatable1 {
  width: 166.16px;
  height: 147.66px;
}
.updatable2 {
  width: 20px;
  height: 16.13px;
}
*/

CSSC(".updatable1").update();
parsed = CSSC.parse();
console.log(parsed);
/*
.updatable1 {
  width: 101.4px;
  height: 143.95px;
}
.updatable2 {
  width: 20px;
  height: 16.13px;
}
*/

CSSC(/\.updatable[12]/).update();
parsed = CSSC.parse();
console.log(parsed);
/*
.updatable1 {
  width: 117.66px;
  height: 198.24px;
}
.updatable2 {
  width: 20px;
  height: 10.94px;
}
*/
```

---

### .export()
**export** is a method to export defined CSS as String, Object or Array
```
.export([exportType])
```
* *`exportType` \[optional\]* - String with export type (default: "object")
    * *`"css"` - export as CSS String*
    * *`"min"` - export as minified CSS String* 
    * *`"obj"` - export as JS-Object*
    * *`"arr"` - export as array*
    * *`"object"` - the same as "obj"*
    * *`"objNMD"` - export as not multidimensional object*
    * *`"array"` - the same as "arr"*

**`Return value`** - Mixed

#### Example
```javascript
CSSC({
    body: {
        margin: 1
    },
    p: {
        width: 500,
        margin: "auto",
        "span.first": {
            "font-size": 25
        },
        "@media screen and (max-width: 500px)": { 
            width: "100%"
        }
    }
});

var exportObject = CSSC("p").export(); // or CSSC.export("obj") or CSSC.export("object")
console.log(JSON.stringify(exportObject, true, 4));
/*
{
    "p": {
        "width": "500px",
        "margin": "auto",
        "span.first": {
            "font-size": "25px"
        },
        "@media screen and (max-width: 500px)": {
            "width": "100%"
        }
    }
}
*/

exportObject = CSSC("p").export("css");
console.log(exportObject);
/*
p {
  width: 500px;
  margin: auto;
}
*/

```

---

### .parse() 
**parse** is a method to parse defined CSS. This method is identical to .export(CSSC.type_export.css) or .export(CSSC.type_export.min)
```
.parse([min])
```
* *`min` \[optional]\* - Boolean, if true return a minified CSS (default: false)

**`Return value`** - String with CSS

#### Example
```javascript
/*
this method returns the same result as .export("css") or .export("min");
*/

exportObject = CSSC("p").parse(true);
console.log(exportObject);
/*
p{width:500px;margin:auto;}
*/
```

---

### .pos()
**pos** is a method to get a Handler object with style element of the given position
```
.pos(position)
```
* `position` - Integer, the position of found style elements. If the position is negative, count the position from last.

**`Return value`** - Handler object with style element of the given position

#### Example
```javascript
CSSC({
    p: [{
        height: 100
    },{
        width: 500
    },{
        color: "green"
    }]
});

var handler = CSSC("p");
console.log(handler.e.length);
/*
3
*/
console.log(handler.parse());
/*
p {
  height: 100px;
}
p {
  width: 500px;
}
p {
  color: green;
}
*/

console.log(handler.pos(0).parse());
/*
p {
  height: 100px;
}
*/

console.log(handler.pos(1).parse());
/*
p {
  width: 500px;
}
*/

console.log(handler.pos(-1).parse());
/*
p {
  color: green;
}
*/
```

---

### .first()
**first** is a method to get a Handler object with first style element. This method is equivalent to `.pos(0)`
```
.first()
```

**`Return value`** - Handler object with first style element

#### Example
```javascript
CSSC({
    p: [{ height: 100 },{ width: 500 },{ color: 0xff00 }]
});

console.log(CSSC("p").first().parse());
/*
p {
  height: 100px;
}
*/
```

---

### .last()
**last** is a method to get a Handler object with last style element. This method is equivalent to `.pos(-1)`
```
.last()
```

**`Return value`** - Handler object with last style element

#### Example
```javascript
CSSC({
    p: [{ height: 100 },{ width: 500 },{ color: 0xff00 }]
});

console.log(CSSC("p").last().parse());
/*
p {
  color: rgb(0, 255, 0);
}
*/
```

---

## Handler properties

---

### .e
**e** is an Array with CSS Objects

```javascript
CSSC({
    ".className": {
        border: "1px solid #000"
    },
    ".className1": {
        border: "1px dotted 0x0"
    },
    ".className2": {
        border: "none"
    }
});

CSSC(".className").e
```
![console screenshot](data:image/png;base64,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)
```javascript
CSSC(/\.className/).e
```
![console screenshot](data:image/png;base64,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)

---

### .selector

---
