/**
 * CSSController - Dynamic CSS Controller. 
 * |-> CSSC        A way to manage style sheets.
 * 
 * @version 0.11a
 *
 * @author Pavel
 * @copyright Pavel Meliantchenkov
 */

var CSSC = CSSController = (function() 
{
    var ownStyleElem, ownStyleElemId = "cssc-container";
    
    var controller = function(styleSheetsDOM, parent, initOnRun, myType)
    {
        var index = {},
            isInit = false,
            _this = this;

        var init = function()
        {
            if(isInit) return;
            
            initElements(styleSheetsDOM);
            
            isInit = true;
            
            cssc_index = index;
            
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
                if(!isElemInOwnNode(cssRules[i]))
                {
                    addToIndex(cssRules[i], parent);
                }
            }
        },
        addToIndex = function(cssRule, parent)
        {
//            if(!cssRule)
//            {
//                console.log("NULL Rule\n");
//                console.log((new Error()).stack+"\n\n");
//            }
            
            var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
                indexType = CSSC.typeRule, 
                toIndex   = cssRule,
                indexObjWrapper;
            
            if(indexKey.indexOf("@media ") === 0)
            {
                indexType = CSSC.typeCondition;
            }
            else if(indexKey.indexOf("@keyframes ") === 0)
            {
                indexType = CSSC.typeKeyFrames;
            }
            else if(indexKey.indexOf("@import ") === 0)
            {
                indexType = CSSC.typeImport;
            }
            
            
            if(indexType === CSSC.typeImport)
            {
                toIndex = null;
            }
            if(indexType !== CSSC.typeRule)
            {
                toIndex = new controller(cssRule, parent, true, indexType);
            }
            else
            {
                //lasttoindex = toIndex; //toIndex.prototype.updatable = [false,{}];
            }
            
            indexObjWrapper = {
                indexElem: toIndex,
                updatableClass: false, 
                updatablePropertys: {},
                events: {},
            };
            
            if(!!index[indexKey])
            {
                if(index[indexKey].content[0].indexElem === toIndex)
                {
                    console.log("Dublicate \""+indexKey+"\": ");
                    var a = new Error();
                    console.log(a.stack+"\n\n");
                    
                }
                
                index[indexKey].content.push(indexObjWrapper);
            }
            else
            {
                index[indexKey] = {'type':indexType,"content":[indexObjWrapper],"events":{}};
            }
            
            return index[indexKey];
        },
        getFromIndex = function(selector)
        {
            if(!isInit) init();

            return !!index[selector] ? index[selector] : null;
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
            if(!!document.getElementById(ownStyleElemId))
            {
                for(var i = 0; i < 10; i++)
                {
                    if(!document.getElementById(ownStyleElemId+'-'+i))
                    {
                        ownStyleElemId = ownStyleElemId+'-'+i;
                        break;
                    }
                }
                
                if(!!document.getElementById(ownStyleElemId))
                {
                    throw new Error("cann not create new element..");
                    return;
                }
            }
            
            var styleElem = document.createElement("style");
            styleElem.setAttribute("type", "text/css");
            styleElem.setAttribute("id", ownStyleElemId);
            styleElem.appendChild(document.createTextNode(""));

            document.head.appendChild(styleElem);

            ownStyleElem = styleElem;
        },
        isElemInOwnNode = function(elem)
        {
            return elem.parentStyleSheet.ownerNode.id === ownStyleElemId;
        },
        addNewRule = function(selector, property, value)
        {
            var appendToElem;
            
//            console.log(selector+ " => "+myType);
            
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
            
//            console.log(appendToElem);
            
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
                //console.log(selector+"{"+ruleString+"}");
                var a = appendToElem.insertRule(selector+"{"+ruleString+"}", rulePos);
            }
            else if("appendRule" in appendToElem)
            {
                var a = appendToElem.appendRule(selector+"{"+ruleString+"}", rulePos);
            }
            else if("addRule" in appendToElem)
            {
                var a = appendToElem.addRule(selector, ruleString, rulePos);
            }
            
            return addToIndex(appendToElem.cssRules[rulePos], parent);
        },
        helper = {
            parseValue: function(value)
            {
                if(isFinite(value))
                {
                    if(value%1 === 0)
                    {
                        return value+"px";
                    }
                    
                    return (Math.round(value * 100) / 100)+"px";
                }
                return value;
            },
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
            rulesWrapper = function(elems)
            {
                return {
                    'singleSet': function(property, value, elemPos, notAddFunctionToUpdatableIndex)
                    {
                        if(!elemPos) elemPos = 0;
                        if(elemPos === 0 && elems.length > 0) elemPos = elems.length-1;
                        
                        //console.log(elems[elemPos].parentStyleSheet.ownerNode.id);
                        
                        if(Object.prototype.toString.call(value) === "[object Function]")
                        {
                            elems[elemPos].indexElem.style[property] = helper.parseValue(value(elems[elemPos].indexElem.style[property]));
                            
                            if(!notAddFunctionToUpdatableIndex)
                            {
                                elems[elemPos].updatablePropertys[property] = value;
                            }
                        }
                        else
                        {
                            elems[elemPos].indexElem.style[property] = helper.parseValue(value);

                            if(!notAddFunctionToUpdatableIndex && !!elems[elemPos].updatablePropertys[property])
                            {
                                delete elems[elemPos].updatablePropertys[property];
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
                            if(Object.prototype.toString.call(property) === "[object Object]" 
                               && Object.keys(property).length > 0) 
                            {
                                for(var i = 0; i < elems.length; i++)
                                {
                                    for(var key in property)
                                    {
                                        this.singleSet(key,property[key],i);
                                    }
                                    
                                    if(!!elems[i].updatableClass)
                                    {
                                        elems[i].updatableClass = false;
                                    }
                                }
                            }
                            else if(Object.prototype.toString.call(property) === "[object Function]")
                            {
                                var myPropertys;
                                
                                for(var i = 0; i < elems.length; i++)
                                {
                                    myPropertys = property();
                                    
                                    for(var key in myPropertys)
                                    {
                                        this.singleSet(key, myPropertys[key], i, true);
                                    }
                                    
                                    elems[i].updatableClass = property;
                                }
                            }
                            else if(Object.prototype.toString.call(property) === "[object String]" 
                                    && Object.prototype.toString.call(value) === "[object String]") //Single set
                            {
                                for(var i = 0; i < elems.length; i++)
                                {
                                    this.singleSet(property, value, i);
                                    
                                    if(!!elems[i].updatableClass)
                                    {
                                        elems[i].updatableClass = false;
                                    }
                                }
                            }
                        }
                        else //create new rule
                        {
                            eventHandler(CSSC.eventBeforeCreate, property, value);
                            
                            addNewRule(selector, property, value);
                            elems = getFromIndex(selector);
                            
                            eventHandler(CSSC.eventCreate, property, value);
                        }

                        eventHandler(CSSC.eventChange, property, value);
                        eventHandler(CSSC.eventSet, property, value);

                        return this;
                    },
                    'get': function(property, ifUpdatableGetTheMethode)
                    {
                        var toReturn = "";
                        for(var i = 0; i < elems.length; i++)
                        {
                            for(var j = 0; j < elems[i].indexElem.style.length; j++)
                            {
                                if(elems[i].indexElem.style[j] === property)
                                {
                                    toReturn = elems[i].indexElem.style[property];
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
                            elems[i].indexElem.style[property] = "";
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
                            elems[i].indexElem.parentStyleSheet.deleteRule(elems[i]);
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
                    },
                    "elems": elems,
                    "pos": function(position)
                    {
                        if(position >= 0 && position < elems.length)
                        {
                            return rulesWrapper([elems[position]]);
                        }
                        
                        return null;
                    },
                    "first": function()
                    {
                        return this.pos(0);
                    },
                    "last": function()
                    {
                        return this.pos(elems.length-1);
                    },
                    "type": elemsObj.type,
                    "merge": function(mergeType)
                    {
                        if(!elems || elems.length <= 0)
                        {
                            return this;
                        }
                        
                        var mergeTo;
                        
                        if(mergeType === null)
                        {
                            mergeType = CSSC.conf.defaultMergeType;
                        }
                        
                        if(mergeType === CSSC.mergeToFirst)
                        {
                            mergeTo = elems[0];
                        }
                        else if(mergeType === CSSC.mergeToLast)
                        {
                            mergeTo = elems[elems.length-1];
                        }
                        else if(mergeType === CSSC.mergeToOwnFirst
                               || mergeType === CSSC.mergeToOwnLast)
                        {
                            for(var i = 0; i < elems.length; i++)
                            { //@todo: optimieren => rÃ¼ckwertsdurchlauf bei bedarf
                                if(isElemInOwnNode(elem[i].indexElem))
                                {
                                    mergeTo = elem[i];
                                    if(mergeType === CSSC.mergeToOwnFirst)
                                    {
                                        break;
                                    }
                                }
                            }
                            
                            if(!mergeTo)
                            {
                                var newRuleSet = addNewRule(selector);
                                
                                if(isElemInOwnNode(newRuleSet.content[newRuleSet.content.length-1]))
                                {
                                    mergeTo = newRuleSet.content[newRuleSet.content.length-1];
                                }
                            }
                        }
                        
                        if(mergeTo)
                        {
                            var mergeFrom;
                            for(var i = 0; i < elems.length; i++)
                            {
                                if(elems[i] === mergeTo) continue;
                                
                                mergeFrom = elems[i];
                                
                                //@todo: merge variables mergeTo & mergeFrom
                            }
                            
                            elems = [mergeTo];
                        }
                        
                        return this;
                    },
                    update: function()
                    {
                        var tmp;
                        for(var i = 0; i < elems.length; i++)
                        {
                            if(!!elems[i].updatableClass)
                            {
                                tmp = elems[i].updatableClass();
                                for(var key in tmp)
                                {
                                    this.singleSet(key, tmp[key], i, true);
                                }
                            }
                            
                            for(var key in elems[i].updatablePropertys)
                            {
                                this.singleSet(key, elems[i].updatablePropertys[key], i, false);
                            }
                        }
                    }
                };
            },
            conditionsWrapper = function(selector, generateNewRule)
            {
                return elems[elems.length-1](selector, generateNewRule);
            };
            conditionsWrapper.elems = elems;
            conditionsWrapper.type = elemsObj.type;
            conditionsWrapper.pos = function(position, selector, generateNewRule)
            {
                //if(position >= 0 && position < elems.length)
                //{
                    if(!selector)
                    {
                        return elems[position].indexElem;
                    }
                    return elems[position].indexElem(selector, generateNewRule);
                //}
            };
            conditionsWrapper.first = function(selector, generateNewRule)
            {
                return this.pos(0, selector, generateNewRule);
            };
            conditionsWrapper.last = function(selector, generateNewRule)
            {
                return this.pos(elems.length-1, selector, generateNewRule);
            };
            conditionsWrapper.update = function()
            {
                for(var i = 0; i < elems.length; i++)
                {
                    elems[i].indexElem.update();
                }
            };
            
            if(elemsObj.type !== CSSC.typeRule)
            {
                return conditionsWrapper;
            }
            
            return rulesWrapper(elems);
        },
        cssc = function(selector, generateNewRule)
        {
            if(typeof selector === "string")
            {
                var elems = null;
                if(!generateNewRule)
                {
                    elems = getFromIndex(selector);
                }
                
                if(elems === null)
                {
                    var newRule = addNewRule(selector, null, null);
                    
                    return controllerWrapper(newRule, selector);
                }
                else
                {
                     return controllerWrapper(elems, selector);
                }
            }
            else
            {
                cssc.imp(selector);
            }
        };
        cssc.append = function(appendElems)
        {
            initElements(appendElems);
        };
        cssc.imp = function(toImport)
        {
            //@todo: implement all ways to import
            //import as json-string
            //import from json-file (ajax call)
            //import as css-string
            //import from css-file (ajax call)
            
            //import as Object
            var importElem, rule, cntrlWrapper;
            for(var importKey in toImport)
            {
                importElem = toImport[importKey];
                
                rule = addNewRule(importKey, null, null);
                
                cntrlWrapper = controllerWrapper(rule, importKey);
                
                if(cntrlWrapper.type !== CSSC.typeRule)
                {
                    //console.log(importKey+ " last:");
                    //console.log(cntrlWrapper.last());
                    cntrlWrapper.last().imp(importElem);
                }
                else
                {
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
            var wrapper;
            
            if(!!selector)
            {
                wrapper = controllerWrapper(getFromIndex(selector), selector);
                wrapper.update();
            }
            else
            {
                for(var i in index)
                {
                    wrapper = controllerWrapper(index[i], selector);
                    wrapper.update();
                }
            }
        };
        
        cssc.typeRule           = 0;
        cssc.typeCondition      = 1;
        cssc.typeKeyFrames      = 2;
        cssc.typeImport         = 3;
        
        cssc.eventBeforeChange 	= "beforechange";
        cssc.eventChange        = "change";
        cssc.eventBeforeSet     = "beforeset";
        cssc.eventSet 	        = "set";
        cssc.eventBeforeCreate  = "beforecreate";
        cssc.eventCreate        = "create";
        cssc.eventBeforeDelete  = "beforedelete";
        cssc.eventDelete        = "delete";
        cssc.eventBeforeDestroy	= "beforedestroy";
        cssc.eventDestroy       = "destroy";
        
        cssc.mergeToLast        = 0;
        cssc.mergeToFirst       = 1;
        cssc.mergeToOwnLast     = 2;
        cssc.mergeToOwnFirst    = 3;
        
        cssc.conf = {
            "get": function(key)
            {
                
            },
            "set": function(key, value)
            {
                
            },
            "reset": function(key)
            {
                
            },
            
            "defaultMergeType": cssc.mergeToLast,
            "dontTouchAllreadyLoadedCss": false,
            //...
        };
        cssc.conf._default = Object.assign({}, cssc.conf);
        
        
        if(!!initOnRun)
        {
            init();
        }
        else
        {
            window.addEventListener("load", function()
            {
                //init();
            });
        }
        
        return cssc;
    };
    
    return new controller(document.styleSheets, null, false, null);
})();
