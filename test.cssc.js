CSSC({
    "body": {
        background-color: "gray",
        width: "10px",
        height: function()
        {
            return window.innerHeight+"px";
        }
    },
    ".test": {
        color: function()
        {
            return "rgb("+parseInt(Math.random()*255)+","+parseInt(Math.random()*255)+", "+parseInt(Math.random()*255)+")";
        }
        font-size: parseInt(Math.random()*25)+"px",
        position: "absolute"
    },
    "@media screen and (max-width: 680px)": 
    {
        ".test":{
            font-size: parseInt(Math.random()*15)+"px"
        }
    },
});
