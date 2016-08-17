# CSSC / CSSController

CSSC is a simple way to make you CSS dynamicle with JavaScript
```bash
CSSC({
    ".myCSSClass": 
    {
        'width':  "50px",                   //static set
        'height': window.innerHeight+"px",  //dynamic set
        'margin': function()                //updatable set
        {
            //return the value to set
            return parseInt(Math.random() * (25 - 15) + 15)+"px";
        }
    },
    ".myUpdatableClass": function() //complete css class is updatable
    {
        return {
            'width':  "50px", //static
            'height': CSSC(".myCSSClass").get("height"), //you cann use values of another css classes
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
