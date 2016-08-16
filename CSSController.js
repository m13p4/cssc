/**
 * CSSController - Manipulation von CSS Eigenschaften über "document.styleSheets"
 * |-> CSSC        keine Iteration über die zu veränderten Elemente nötig.
 *                 Eigenschaften werden an der Klassen-Definition von CSS verändert.
 * 
 * @version 0.6a
 *
 * @author Pavel
 * @copyright Pavel Meliantchenkov
 */

var CSSC = CSSController = (function()
{
    var controller = function(styleSheetsDOM, parent, initOnRun, myType)
    {
        var index = {}, 
            keyframes = {},
            isInit = false, 
            ownStyleElem,
            updatable = {},
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
                    index[cssRule.conditionText] = {'type':CSSC.typeCondition,"content":new controller(cssRule, _this, true, CSSC.typeCondition),"events":{}};
                }
            }
            else if("selectorText" in cssRule)
            {
                if(!!index[cssRule.selectorText])
                {
                    index[cssRule.selectorText].content.push(cssRule);
                }
                else
                {
                    index[cssRule.selectorText] = {'type':CSSC.typeRule,"content":[cssRule],"events":{}};
                }
            }
            else if("name" in cssRule)
            {
                addToKeyFrames(cssRule);
            }
        },
        addToKeyFrames = function(keyFrame)
        {
            if(!!keyframes[keyFrame.name])
            {
                keyframes[keyFrame.name].content.append(keyFrame);
            }
            else
            {
                keyframes[keyFrame.name] = {'type':CSSC.typeKeyFrames,"content":new controller(keyFrame, _this, true, CSSC.typeKeyFrames),"events":{}}:
            }
        },
        getFromIndex = function(selector)
        {
            if(!isInit) init();

            return !!index[selector] ? index[selector] : {};
        },
        getFromKeyFrames = function(name)
        {
            if(!isInit) init();

            return !!keyframes[name] ? keyframes[name] : {};
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
        controllerWrapper = function(elemsObj, selector)
        {
            var elems = elemsObj.content;
                
            var eventHandler = function(eventType, property, value)
            {
                if(!!elemsObj.events[eventType])
                {
                    for(var i = 0; i < elemsObj.events[eventType].length; i++)
                    {
                        elemsObj.events[eventType][i].call(property, value);
                    }
                }
            }; 
            
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
                                    if(Object.prototype.toString.call(property[key]) == "[object Function]")
                                    {
                                        elems[i].style[key] = property[key](elems[i].style[key]);
                                        
                                        updatable[selector][key] = property[key];
                                    }
                                    else elems[i].style[key] = property[key];
                                }
                            }
                        }
                        else //Single set
                        {
                            for(var i = 0; i < elems.length; i++)
                            {
                                if(Object.prototype.toString.call(value) == "[object Function]")
                                {
                                    elems[i].style[property] = value(elems[i].style[property]);
                                        
                                    updatable[selector][property] = value[property];
                                }
                                else elems[i].style[property] = value;
                            }
                        }
                    }
                    else //create new rule
                    {
                        addNewRule(selector, property, value);
                        elems = getFromIndex(selector);
                        
                        eventHandler(CSSC.eventCreate, property, value);
                    }
                    
                    eventHandler(CSSC.eventChange, property, value);
                    eventHandler(CSSC.eventSet, property, value);
                    
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
                    
                    eventHandler(CSSC.eventChange, property, null);
                    eventHandler(CSSC.eventDelete, property, null);

                    return this;
                },
                'destroy': function()
                {
                    for(var i = 0; i < elems.length; i++)
                    {
                        elems[i].parentStyleSheet.deleteRule(elems[i]);
                        deleteFromIndex(selector);
                    }
                    
                    eventHandler(CSSC.eventDestroy, property, null);
                },
                'event': function(eventType, eventFunction)
                {
                    var event = {
                        'type': function () { return eventType },
                        'call': eventFunction,
                        'index': null,
                        'destroy': function()
                        {
                            //@todo: implement event destroy 
                        }
                    };
                    
                    if(!!elemsObj.events[eventType])
                    {
                        elemsObj.events[eventType].push(event);
                    }
                    else
                    {
                        elemsObj.events[eventType] = [event];
                    }
                    
                    event.index = function() { return elemsObj.events[eventType].length-1 };
                    
                    return event;
                }
            };
        },
        cssc = function(selector)
        {
            var elems = getFromIndex(selector);
        
            if(elems.type == CSSC.typeCondition)
            {
                return elems.content;
            }
            else
            {    
                return controllerWrapper(elems, selector);
            }
        };
        cssc.append = function(appendElems)
        {
            initElements(appendElems);
        };
        cssc.import = function(toImport)
        {
            //@todo: implement import
        };
        cssc.export = function(exportType)
        {
            //@todo: implement export
        };
        cssc.animate = function(animationName, propertys)
        {
            
        };
        cssc.keyframes = cssc.animate;
        cssc.update = function(selector)
        {
            //@todo: use selector
            
            var elems, wrapper;
            for(var i in updatable)
            {
                elems = getFromIndex(i);
        
                if(elems.type == CSSC.typeCondition)
                {
                    elems.content.update();
                }
                else
                {    
                    wrapper = controllerWrapper(elems, selector);
                    wrapper.set(updatable[i]);
                }
            }
        }
        
        cssc.typeRule 		= 0;
        cssc.typeCondition 	= 1;
        cssc.typeKeyFrames  = 2;
        
        cssc.eventChange 	= "change";
        cssc.eventSet 		= "set";
        cssc.eventCreate    = "create";
        cssc.eventDelete 	= "delete";
        cssc.eventDestroy	= "destroy";
        
        
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
    
    return new controller(document.styleSheets, null, false, null);
})();
