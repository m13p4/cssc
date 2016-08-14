/**
 * cssController - Manipulation von CSS Eigenschaften über "document.styleSheets"
 * |-> CSSC        keine Iteration über die zu veränderten Elemente nötig.
 *                 Eigenschaften werden an der Klassen-Definition von CSS verändert.
 * 
 * @version 0.4a
 *
 * @author Pavel
 * @copyright Pavel Meliantchenkov
 */

var CSSC = cssController = (function()
{
    var controller = function(styleSheetsDOM, parent, initOnRun)
    {
        //console.log("styleSheetsDOM:");
        //console.log(styleSheetsDOM);
        
            
        var index = {}, 
            isInit = false, 
            ownStyleElem,
            _this = this;

        var init = function()
        {
            initElements(styleSheetsDOM);
            
            console.log(index);
            
            isInit = true;
        },
        initElements = function(toInit)
        {
            if("cssRules" in toInit)
            {
                indexCssRules(toInit.cssRules);
            }
            else if("length" in toInit)
            {
                for(var i = 0; i < toInit.length; i++)
                {
                    indexCssRules(toInit[i].cssRules);
                }
            }
        },
        indexCssRules = function(cssRules)
        {
            for(var i = 0; i < cssRules.length; i++)
            {
                addToIndex(cssRules[i]);
            }
        },
        addToIndex = function(cssRule)
        {
            if("conditionText" in cssRule)
            {
                if(!!index[cssRule.conditionText])
                {
                    //console.log(index[cssRule.conditionText].content[0]);
                    index[cssRule.conditionText].content.append(cssRule);
                }
                else
                {
                    index[cssRule.conditionText] = {'type':CSSC.cssCondition,"content":new controller(cssRule, _this, true)};
                }
            }
            else if("selectorText" in cssRule)
            {
                if(!!index[cssRule.selectorText])
                    index[cssRule.selectorText].content.push(cssRule);
                else
                    index[cssRule.selectorText] = {'type':CSSC.cssRule,"content":[cssRule]};
            }
        },
        getFromIndex = function(selector)
        {
            if(!isInit) init();

            return !!index[selector] ? index[selector] : [];
        },
        deleteFromIndex = function(selector)
        {
            if(!!index[selector])
            {
                delete index[selector];
            }
        },
        createNewStyleElem = function()
        {
            var styleElem = document.createElement("style");
            styleElem.setAttribute("type", "text/css");
            styleElem.setAttribute("id", "cssc-container");
            styleElem.appendChild(document.createTextNode(""));

            document.head.appendChild(styleElem);

            ownStyleElem = styleElem;
        },
        addNewRule = function(selector, property, value)
        {
            if(!ownStyleElem)
            {
                createNewStyleElem();
            }

            var rulePos = ownStyleElem.sheet.cssRules.length,
                ruleString = "";
            if(Object.prototype.toString.call(property) == "[object Object]")
            {
                for(var key in property)
                {
                    ruleString += key+":"+property[key]+"; ";
                }
            }
            else
            { 
                ruleString = property+":"+value+";";
            }

            if("insertRule" in ownStyleElem.sheet)
            {
                ownStyleElem.sheet.insertRule(selector+"{"+ruleString+"}", rulePos);
            }
            else if("addRule" in ownStyleElem.sheet)
            {
                ownStyleElem.sheet.addRule(selector, ruleString, rulePos);
            }

            addToIndex(ownStyleElem.sheet.cssRules[rulePos]);
        },
        controllerWrapper = function(elems, selector)
        {
            return {
                'set': function(property, value)
                { 
                    if(elems.length > 0)
                    {
                        //Multi set if property a object with key & value
                        if(Object.prototype.toString.call(property) == "[object Object]")
                        {
                            for(var i = 0; i < elems.length; i++)
                            {
                                for(var key in property)
                                {
                                    elems[i].style[key] = property[key];
                                }
                            }
                        }
                        else //Single set
                        {
                            for(var i = 0; i < elems.length; i++)
                            {
                                elems[i].style[property] = value;
                            }
                        }
                    }
                    else //create new rule
                    {
                        addNewRule(selector, property, value);
                        elems = getFromIndex(selector);
                    }

                    return this;
                },
                'get': function(property)
                {
                    var toReturn = "";
                    for(var i = 0; i < elems.length; i++)
                    {
                        for(var j = 0; j < elems[i].style.length; j++)
                        {
                            if(elems[i].style[j] == property)
                            {
                                toReturn = elems[i].style[property];
                                break;
                            }
                        }
                        
                    }
                    return toReturn;
                },
                'delete': function(property)
                {
                    for(var i = 0; i < elems.length; i++)
                    {
                        elems[i].style[property] = null;
                    }

                    return this;
                },
                'destroy': function()
                {
                    for(var i = 0; i < elems.length; i++)
                    {
                        elems[i].parentStyleSheet.deleteRule(elems[i]);
                        deleteFromIndex(selector);
                    }
                }
            };
        },
        cssc = function(selector)
        {
            var elems = getFromIndex(selector);
        
            if(elems.type == CSSC.cssCondition)
            {
                return elems.content;
            }
            else
            {    
                return controllerWrapper(elems.content, selector);
            }
        };
        cssc.append = function(appendElems)
        {
            initElements(appendElems);
        };
        
        cssc.cssRule = 0;
        cssc.cssCondition = 1;
        
        if(!!initOnRun)
        {
            init();
        }
        else
        {
            window.addEventListener("load", function()
            {
                init();
            });
        }
        
        return cssc;
    };
    
    return new controller(document.styleSheets, null, false);
})();
