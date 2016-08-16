var randomColor = function()
{
    return "rgb("+parseInt(Math.random()*255)+","+parseInt(Math.random()*255)+", "+parseInt(Math.random()*255)+")";
};

CSSC({
    "body": 
    {
        'background-color': randomColor(),
        'width': function()
        {
            return (window.innerWidth)+"px";
        },
        'height': function()
        {
            return (window.innerHeight)+"px";
        },
        "overflow": "hidden",
        'margin': 0
    },
    ".test": 
    {
        'color': randomColor, //updatable
        'background': randomColor(), //not updatable
        'font-size': function(){return parseInt(Math.random() * (25 - 15) + 15)+"px"},
        'position': "relative",
        'float': "left",
        'margin': function()
        {
            return parseInt(window.innerHeight * 0.05 / 2)+ "px "+parseInt(window.innerWidth * 0.05 / 2) + "px";
        },
        'width': function()
        {
            return parseInt(window.innerWidth * 0.2)+"px";
        },
        'height': function()
        {
            return parseInt(window.innerHeight * 0.45)+"px";
        }
    },
    "@media screen and (max-width: 680px)": 
    {
        ".test":{
            'font-size': parseInt(Math.random()*15)+"px"
        }
    },
});
window.addEventListener("resize", function()
{
    CSSC.update();
});
