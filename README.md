
---


**Caution:** This version is a BETA.


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

## Controller functions

---

### .init()
```
.init(initObj)
```
* `initObj` - DOM "<style>" element, StyleSheet object or Array containing it.

**`Return value`** - Controller object (CSSC)


**Example**
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
```
.import(importObj)
```
* `importObj` - an object with style sheets

**`Return value`** - Controller object (CSSC)


**Example**
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

CSSC.import(importObj); //alternativ can use simply CSSC(importObj);
``` 

---

### .update()
```
.update([selector])
```
* *`selector` \[optional\]* - a selector as String or RegEx or Array of Strings

**`Return value`** - Controller object (CSSC)


**Example**
```javascript
CSSC.update(); // update all CSS rules which were defined through functions
// or
CSSC.update(".updatable"); // update CSS rule .updatable when it was defined through function
``` 

---

### .export()
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


**Example**
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
```
.parse([min])
```
* *`min` \[optional\]* - Boolean, if true return minified CSS (default: false)

**`Return value`** - String with CSS


**Example**
```javascript
/*
this method return the same result as .export("css") or .export("min");
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
```
.new()
```
**`Return value`** - New Controller object (CSSC)


**Example**
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
* *`conf` \[optional\]* - A object with key-value pair to set, Array of Strings to get or key as String to set/get
* *`value` \[optional\]* - if conf a String becomes value to set

**`Return value`** - Mixed -> Controller object (CSSC) or object key-value pair or a configuration value


**Example**
```javascript
CSSC.conf({ // set as object
    style_id: "my-style-sheets", // [String]  Document element ID 
    view_err: true,              // [Boolean] Show errors in console
    parse_tab_len: 4             // [Integer] Length of space characters by export
});

CSSC.conf("style_id", "cssc-sheet");      // set with key String
CSSC.conf("style_id");                    // get with String key
CSSC.conf(["style_id", "parse_tab_len"]); // get with Array of strings, return a object as key-value pair
CSSC.conf();                              // get all defined configurations
```

---

### .vars()
**vars** is a method to set or get variables. If you need to use variable keys, you can use this method.
```
.vars([var[, value]])
```
* *`var` \[optional\]* - A object with key-value pair to set, Array of Strings to get or key as String to set/get
* *`value` \[optional\]* - if conf a String becomes value to set

**`Return value`** - Mixed -> Controller object (CSSC) or object key-value pair or a variable value


**Example**
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
this method is a helper function, can use to test your vars.
```
.parseVars(text[, vars])
```
* `text` - A String, the text to parse
* *`vars` \[optional\]* - A object with key-value pair

**`Return value`** - Parsed string 


**Example**
```javascript
CSSC.vars({
    myVar: "my variable text",
});

var val = CSSC.parseVars("this is $myVar");
console.log(val);
/*
this is my variable text
*/

var val = CSSC.parseVars("this is $myVar", {myVar: "my temporarily overwritten text"});
console.log(val);
/*
this is my temporarily overwritten text
*/
```

---

### .cssFromObj()
this method is a helper function, can use to parse CSS from simply object
```
.cssFromObj(obj[, min[, tabLen]])
```
* `obj` - A simply object to parse
* *`min` \[optional\]* - a Boolean if the value true is return value a minified CSS String
* *`tabLen` \[optional\]* - a Integer to define the lenth of tab (default: 2)

**`Return value`** - Parsed string 


**Example**
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
