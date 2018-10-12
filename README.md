**Caution:** This version is a BETA.

# CSSC
CSSC is a CSS Controller to manage your Cascading Style Sheets.

## General
CSSC can use to define Cascading Style Sheets (CSS) in your browser, to change/show/delete allready defined CSS.



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

### Controller functions

#### .init()
```
.init(initObj)
```
`initObj` - DOM "<style>" element, StyleSheet object or Array containing it.

```javascript
// init all defined CSS rules in 
// '<style id="style-sheet">...</style>' element
CSSC.init(document.getElementById("style-sheet")); 

// init all CSS rules in all 
// '<style>...</style>' elements
CSSC.init(document.querySelectorAll("style")); 
``` 


#### .import()
```
.import(importObj)
```
`importObj` - a object with style sheets

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


#### .update()
```
.update([selector])
```
`selector` *(optional)* - a selector as String or RegEx or Array of Strings

```javascript
CSSC.update(); // update all CSS rules which were defined through functions
// or
CSSC.update(".updatable"); // update CSS rule .updatable when it was defined through function
``` 


#### .export()
```
.export([exportType])
```
`exportType` *(optional)* - String with export type (default: "object")
* *`"css"`    - export as CSS String*
* *"min"    - export as minified CSS String* 
* *"obj"    - export as JS-Object*
* *"object" - the same as "obj"*
* *"objNMD" - export as not multidimensional object*
* *"array" &nbsp;- export as array*

#### .parse()
#### .new()

#### .defineConf()
#### .setConf()
#### .getConf()
#### .defineVars()
#### .addVars()
#### .getVars()
