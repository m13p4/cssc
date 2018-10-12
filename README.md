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
    h = CSSC([".className", ".otherClass"]); //get handler object with .className and .otherClass
```
