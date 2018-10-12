**Caution:** This version is a BETA version !

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
CSSC({
    ".className": {
        border: "1px solid #000"
    },
    ".className1": {
        border: "1px dotted #000"
    },
    ".className2": {
        border: "none"
    }
});
```
