/**
 * CSSController - Dynamic CSS Controller. 
 * |-> CSSC        A way to manage style sheets.
 * 
 * @version 0.8a
 *
 * @author Pavel
 * @copyright Pavel Meliantchenkov
 */

var CSSC = CSSController = (function()
{
    var ownStyleElem;
    
    var controller = function(styleSheetsDOM, parent, initOnRun, myType)
    {
        var index = {}, 
            keyframes = {},
            isInit = false,
            updatable = {},
            _this = this;

        var init = function()
        {
            initElements(styleSheetsDOM);
            
            //console.log(index);
            
            isInit = true;
        },
        initElements = function(toInit)
        {
            if("cssRules" in toInit)
            {
                indexCssRules(toInit.cssRules, toInit);
            }
            else if("length" in toInit)
            {
                for(var i = 0; i < toInit.length; i++)
                {
                    indexCssRules(toInit[i].cssRules, toInit[i]);
                }
            }
        },
        indexCssRules = function(cssRules, parent)
        {
            for(var i = 0; i < cssRules.length; i++)
            {
                addToIndex(cssRules[i], parent);
            }
        },
        addToIndex = function(cssRule, parent)
        {
            if("conditionText" in cssRule)
            {
                if(!!index[cssRule.conditionText])
                {
                    //console.log(index[cssRule.conditionText].content[0]);
                    index[cssRule.conditionText].content.push(new controller(cssRule, parent, true, CSSC.typeCondition));
                }
                else
                {
                    index[cssRule.conditionText] = {'type':CSSC.typeCondition,"content":[new controller(cssRule, parent, true, CSSC.typeCondition)],"events":{}};
                }
                
                //console.log(index[cssRule.conditionText]);
                return index[cssRule.conditionText];
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
                
                return index[cssRule.selectorText];
            }
            else if("name" in cssRule)
            {
                return addToKeyFrames(cssRule, parent);
            }
            
            return false;
        },
        addToKeyFrames = function(keyFrame, parent)
        {
            if(!!keyframes[keyFrame.name])
            {
                keyframes[keyFrame.name].content.append(keyFrame);
            }
            else
            {
                keyframes[keyFrame.name] = {'type':CSSC.typeKeyFrames,"content":new controller(keyFrame, parent, true, CSSC.typeKeyFrames),"events":{}}; 
            }
            
            return keyframes[keyFrame.name];
        }, 
        getFromIndex = function(selector)
        {
            if(!isInit) init();

            return !!index[selector] ? index[selector] : null;
        },
        getFromKeyFrames = function(name)
        {
            if(!isInit) init();

            return !!keyframes[name] ? keyframes[name] : null;
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
            var appendToElem;
            
            if(myType === CSSC.typeCondition || myType === CSSC.typeKeyFrames)
            {
                appendToElem = styleSheetsDOM;
            }
            else if(!ownStyleElem)
            {
                createNewStyleElem();
                
                appendToElem = ownStyleElem.sheet;
            }
            else
            {
                appendToElem = ownStyleElem.sheet;
            }
            
            var rulePos = appendToElem.cssRules.length,
                ruleString = "";
        
            if(!!property)
            {
                if(Object.prototype.toString.call(property) === "[object Object]")
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
            }

            if("insertRule" in appendToElem)
            {
                appendToElem.insertRule(selector+"{"+ruleString+"}", rulePos);
            }
            else if("addRule" in appendToElem)
            {
                appendToElem.addRule(selector, ruleString, rulePos);
            }
            
            return addToIndex(appendToElem.cssRules[rulePos], parent);
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
            },
            rulesWrapper = {
                'singleSet': function(property, value, elemPos, notAddFunctionToUpdatableIndex)
                {
                    if(!elemPos) elemPos = 0;
                    
                    if(Object.prototype.toString.call(value) === "[object Function]")
                    {
                        elems[elemPos].style[property] = value(elems[elemPos].style[property]);
                        
                        if(!notAddFunctionToUpdatableIndex)
                        {
                            if(!updatable[selector]) updatable[selector] = {};
                            
                            updatable[selector][property] = value;
                        }
                    }
                    else
                    {
                        elems[elemPos].style[property] = value;
                        
                        if(!notAddFunctionToUpdatableIndex && !!updatable[selector] && !!updatable[selector][property])
                        {
                            delete updatable[selector][property];
                        }
                    }
                    
                    return this;
                },
                'set': function(property, value)
                { 
                    if(elems.length > 0)
                    {
                        //Before events
                        eventHandler(CSSC.eventBeforeChange, property, value);
                        eventHandler(CSSC.eventBeforeSet, property, value);
                        
                        //Multi set if property a object with key & value
                        if(Object.prototype.toString.call(property) === "[object Object]")
                        {
                            for(var i = 0; i < elems.length; i++)
                            {
                                for(var key in property)
                                {
                                    this.singleSet(key,property[key],i);
                                }
                            }
                            
                            if(!!updatable[selector] && !!updatable[selector]["__full__"])
                            {
                                delete updatable[selector]["__full__"];
                            }
                        }
                        else if(Object.prototype.toString.call(property) === "[object Function]")
                        {
                            var myPropertys = property();
                            
                            for(var i = 0; i < elems.length; i++)
                            {
                                for(var key in myPropertys)
                                {
                                    this.singleSet(key, myPropertys[key], i, true);
                                ]
                            }
                            
                            if(!updatable[selector]) updatable[selector] = {};
                            
                            updatable[selector]["__full__"] = property;
                        }
                        else //Single set
                        {
                            for(var i = 0; i < elems.length; i++)
                            {
                                this.singleSet(property, value, i);
                            }
                            
                            if(!!updatable[selector] && !!updatable[selector]["__full__"])
                            {
                                delete updatable[selector]["__full__"];
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
                            if(elems[i].style[j] === property)
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
                    //Before events
                    eventHandler(CSSC.eventBeforeChange, property, null);
                    eventHandler(CSSC.eventBeforeDelete, property, null);
                    
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
                    //Before events
                    eventHandler(CSSC.eventBeforeDestroy, null, null);
                    
                    for(var i = 0; i < elems.length; i++)
                    {
                        elems[i].parentStyleSheet.deleteRule(elems[i]);
                        deleteFromIndex(selector);
                    }
                    
                    eventHandler(CSSC.eventDestroy, null, null);
                },
                'event': function(eventType, eventFunction)
                {
                    var event = {
                        'type': function () { return eventType; },
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
                    
                    event.index = function() { return elemsObj.events[eventType].length-1; };
                    
                    return event;
                }
            },
            conditionsWrapper = function(selector, generateNewRule)
            {
                return elems[elems.length-1](selector, generateNewRule);
            };
            conditionsWrapper.first = function()
            {
                
            }
            
            return rulesWrapper;
        },
        cssc = function(selector, generateNewRule)
        {
            if(typeof selector === "string")
            {
                var indexKey = selector,
                    selectorType = CSSC.typeRule;
                
                if(selector.indexOf("@media ") === 0)
                {
                    indexKey = selector.substr(7);
                    
                    selectorType = CSSC.typeCondition;
                }
                else if(selector.indexOf("@keyframes ") === 0)
                {
                    indexKey = selector.substr(11);
                    
                    selectorType = CSSC.typeKeyFrames;
                }
                
                var elems = null;
                if(!generateNewRule)
                {
                    elems = getFromIndex(indexKey);
                }
                
                if(elems === null)
                {
                    var newRule = addNewRule(selector, null, null);
                    
                    return controllerWrapper(newRule, indexKey);
                }
                else
                {
                     return controllerWrapper(elems, indexKey);
                }
            }
            else
            {
                //import
                cssc.imp(selector);
            }
        };
        cssc.append = function(appendElems)
        {
            initElements(appendElems);
        };
        cssc.imp = function(toImport)
        {
            //@todo: implement import
            var importElem, rule, indexKey, importType, cntrlWrapper;
            for(var importKey in toImport)
            {
                importElem = toImport[importKey];
                
                importType = CSSC.typeRule;
                indexKey = importKey;
                
                if(importKey.indexOf("@media ") === 0)
                {
                    indexKey = importKey.substr(7);
                    
                    importType = CSSC.typeCondition;
                }
                else if(importKey.indexOf("@keyframes ") === 0)
                {
                    indexKey = importKey.substr(11);
                    
                    importType = CSSC.typeKeyFrames;
                }
                
                rule = addNewRule(importKey, null, null);
                
                if(importType === CSSC.typeCondition || importType === CSSC.typeKeyFrames)
                {
                    rule.content.imp(importElem);
                }
                else if(importType === CSSC.typeRule)
                {
                    cntrlWrapper = controllerWrapper(rule, indexKey);
                    cntrlWrapper.set(importElem);
                }
            }
        };
        cssc.exp = function(exportType)
        {
            //@todo: implement export
        };
        cssc.animate = function(animationName, propertys)
        {
            
        };
        cssc.keyframes = cssc.animate;
        cssc.update = function(selector)
        {
            var elems, wrapper, toUpdate;
            
            if(!!selector)
            {
                if(!!updatable[selector])
                {
                    elems = getFromIndex(selector);
                    
                    if(elems.type === CSSC.typeCondition)
                    {
                        elems.content.update();
                    }
                    else
                    {
                        wrapper = controllerWrapper(elems, selector);
                        
                        toUpdate = updatable[selector];
                        if(toUpdate["__full__"])
                        {
                            wrapper.set(toUpdate["__full__"]);
                            delete toUpdate["__full__"];
                        }
                        wrapper.set(toUpdate);
                    }
                }
            }
            else
            {
                for(var i in updatable)
                {
                    elems = getFromIndex(i);

                    if(elems.type === CSSC.typeCondition)
                    {
                        elems.content.update();
                    }
                    else
                    {
                        wrapper = controllerWrapper(elems, i);
                        wrapper.set(updatable[i]);
                    }
                }
            }
        };
        cssc.conf = {
            "get": function(key)
            {
                
            },
            "set": function(key, value)
            {
                
            },
            
            "dontTouchAllreadyLoadedCss": false,
            //...
        };
        cssc.conf._default = cssc.conf;
        
        cssc.typeRule           = 0;
        cssc.typeCondition      = 1;
        cssc.typeKeyFrames      = 2;
        
        cssc.eventBeforeChange 	= "beforechange";
        cssc.eventChange        = "change";
        cssc.eventBeforeSet	    = "beforeset";
        cssc.eventSet 	        = "set";
        cssc.eventBeforeCreate  = "beforecreate";
        cssc.eventCreate        = "create";
        cssc.eventBeforeDelete  = "beforedelete";
        cssc.eventDelete        = "delete";
        cssc.eventBeforeDestroy	= "beforedestroy";
        cssc.eventDestroy       = "destroy";
        
        
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
