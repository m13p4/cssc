/**
 * CSSController - Dynamic CSS Controller. 
 * |-> CSSC        A way to manage style sheets.
 * 
 * @version 1.0b
 *
 * @author m13p4
 * @copyright Meliantchenkov Pavel
 */

var _debug = true, 
    csscDebug = {};

var CSSC = (function()
{ 'use strict';
    
    var ownStyleElem;
    
    var cntrl = function(styleSheetsDOM, parent, initOnRun, myType)
    {
        var index   = {},
            isInit  = false,
            _this   = this,
            cssc    = null;
    
        
        if(_debug) csscDebug.index = index;
    
        var init = function()
        {
            if(isInit) return;
            
            initElements(styleSheetsDOM);
            
            isInit = true;
        },
        initElements = function(toInit)
        {
            if(_debug) console.log(toInit);
            
            if("cssRules" in toInit)
            {
                indexCssRules(toInit.cssRules, toInit, false);
            }
            else if("length" in toInit)
            {
                for(var i = 0; i < toInit.length; i++)
                {
                    if(toInit[i].ownerNode.getAttribute('data-cssc-ignore') === "true")
                    {
                        continue;
                    }
                    indexCssRules(toInit[i].cssRules, toInit[i], false);
                }
            }
        },
        indexCssRules = function(cssRules, parent, imported)
        {
            for(var i = 0; i < cssRules.length; i++)
            {
                if(!helper.isElemInOwnNode(cssRules[i]))
                {
                    addToIndex(cssRules[i], parent, imported);
                }
            }
        },
        addToIndex = function(cssRule, parent, importedElem)
        {
            
            var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
                indexType = cssRule.type, 
                toIndex   = cssRule,
                indexObjWrapper;
            
            //@todo: support all types
            if(indexType !== cssc.ruleType.rule)
            {
                console.log("unsuported type: [" + indexType + "] - " + cssc.ruleType.names[indexType]);
                return;
            }
            
            toIndex._update = false;
            toIndex.style._update = {};
            
            indexObjWrapper = {
                indexElem: toIndex,
                events: {},
                imported: importedElem,
                indexImportedElems: (indexType === cssc.ruleType.import ? true : null)
            };
            
            if(indexType === cssc.ruleType.import)
            {
                try
                {
                    indexCssRules(toIndex.styleSheet.cssRules, parent, indexObjWrapper);
                }
                catch(e)
                {
                    indexObjWrapper.indexImportedElems = false;
                }   
            }
            
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
                index[indexKey] = {
                    type: indexType,
                    content: [indexObjWrapper],
                    events: {}
                };
            }
            
            return index[indexKey];
        },
        createRule = function(selector, property, value)
        {
            var appendToElem;
            
            if(!ownStyleElem)
            {
                helper.createNewStyleElem();
            }
            appendToElem = ownStyleElem.sheet;
            
            
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
            else if("appendRule" in appendToElem)
            {
                appendToElem.appendRule(selector+"{"+ruleString+"}", rulePos);
            }
            else if("addRule" in appendToElem)
            {
                appendToElem.addRule(selector, ruleString, rulePos);
            }
            
            return addToIndex(appendToElem.cssRules[rulePos], parent);
        },
        getFromIndex = function(sel)
        {
            if(!isInit) init();

            return !!index[sel] ? index[sel] : null;
        },
        delFromIndex = function(sel)
        {
            if(!!index[sel])
            {
                delete index[sel];
            }
        },
        helper = {
            createNewStyleElem: function()
            {
                if(!!document.getElementById(cssc.conf.styleId))
                {
                    for(var i = 0; i < 10; i++)
                    {
                        if(!document.getElementById(cssc.conf.styleId+'-'+i))
                        {
                            cssc.conf.styleId = cssc.conf.styleId+'-'+i;
                            break;
                        }
                    }

                    if(!!document.getElementById(cssc.conf.styleId))
                    {
                        throw new Error("cann not create new element..");
                    }
                }

                var styleElem = document.createElement("style");
                styleElem.setAttribute("type", "text/css");
                styleElem.setAttribute("id", cssc.conf.styleId);
                styleElem.appendChild(document.createTextNode(""));

                document.head.appendChild(styleElem);

                ownStyleElem = styleElem;
            },
            isElemInOwnNode: function(elem)
            {
                return (elem && !!elem.parentStyleSheet 
                        && !!elem.parentStyleSheet.ownerNode 
                        && elem.parentStyleSheet.ownerNode.id === cssc.conf.styleId);
            },
            parseValue: function(value)
            {
                if(isFinite(value))
                {
                    if(value%1 === 0)
                    {
                        return value + "px";
                    }
                    
                    return (Math.floor(value * 100) / 100) + "px";
                }
                return value;
            },
            findPropInCssText: function(cssText, prop)
            {
                var regExp = new RegExp(prop+"\s*:\s*(.+?);"),
                    find = cssText.match(regExp);
                
                return !!find ? find[1].trim() : "";
            },
            exportParser: function(cssText, type)
            {
                if(type === cssc.export.type.ruleRow)
                {
                    return cssText+"\n";
                }
                else if(type === cssc.export.type.min)
                {
                    return cssText.replace(/(;|:|\s*?{|}|,)\s+/gi,function(p)
                    {
                        return p.trim();
                    });
                }
                else //Normal
                {
                    return cssText.replace(/({|}|;)\s*/gi, function(p)
                    { 
                        p = p.trim();

                        if(p === "{")
                            return p + "\n    ";
                        else if(p === "}")
                            return p + "\n";
                        else if(p === ";")
                            return p + "\n    ";
                    }).replace(/\s+}/, "\n}");
                }
            }
        },
        ruleHandler = function(indexElemArr, sel)
        {
            var elems = [], cPos; //indexElem.content;
            
            for(cPos = 0; cPos < indexElemArr.length; cPos++)
            {
                elems.push(indexElemArr[cPos]);
            }
            
            return {
                'e': elems,
                'set': function(prop, val, pos)
                {
                    if(typeof pos === "number") // single Set
                    {
                        if(Object.prototype.toString.call(val) === "[object Function]")
                        {
                            var oldVal = helper.findPropInCssText(elems[pos].indexElem.cssText, prop),
                                valToSet = val(oldVal);
                        
                            this.e[pos].indexElem.style[prop] = helper.parseValue(valToSet);
                            
                            //add to updatable
                            this.e[pos].indexElem.style._update[prop] = val;
                        }
                        else
                        {
                            this.e[pos].indexElem.style[prop] = helper.parseValue(val);
                        }
                    }
                    else // multi Set
                    {
                        var i;
                        
                        if(Object.prototype.toString.call(prop) === "[object Object]" 
                               && Object.keys(prop).length > 0) 
                        {
                            var key;
                            for(i = 0; i < this.e.length; i++)
                            {
                                for(key in prop)
                                {
                                    this.set(key,prop[key],i);
                                }
                            }
                        }
                        else if(Object.prototype.toString.call(prop) === "[object Function]")
                        {
                            var props = prop();
                                
                            for(var i = 0; i < this.e.length; i++)
                            {
                                for(var key in props)
                                {
                                    this.set(key, props[key], i);
                                }
                                
                                //add to updatable
                                this.e[i].indexElem._update = prop;
                            }
                        }
                        else
                        {
                            for(i = 0; i < this.e.length; i++)
                            {
                                this.set(prop, val, i);
                            }
                        }
                    }
                },
                'get': function(prop, returnAllProps)
                {
                    var arrToRet = [], propToRet = "", tmp, i;
                    
                    returnAllProps = !!returnAllProps;
                    
                    for(i = 0; i < this.e.length; i++)
                    {
                        tmp = helper.findPropInCssText(this.e[i].indexElem.cssText, prop);
                        
                        if(!!tmp)
                        {
                            propToRet = tmp;
                            
                            if(returnAllProps) arrToRet.push(propToRet);
                        }
                    }
                    return returnAllProps ? arrToRet : propToRet;
                }, 
                'has': function(prop)
                {
                    var matches = [], propVal, i, tmp;

                    if(Object.prototype.toString.call(prop) === "[object String]")
                    {
                        propVal = prop.split(":");
                        
                        for(i = 0; i < this.e.length; i++)
                        {
                            tmp = helper.findPropInCssText(this.e[i].indexElem.cssText, propVal[0]);

                            if(tmp !== "" && ((!propVal[1]) || (!!propVal[1] && propVal[1].replace(/ |;/g,"") === tmp)))
                            {
                                matches.push(this.e[i]);
                            }
                        }
                    }
                    else if(Object.prototype.toString.call(prop) === "[object Array]")
                    {
                        for(var j = 0; j < prop.length; j++)
                        {
                            propVal = prop[j].split(":");
                        
                            for(i = 0; i < this.e.length; i++)
                            {
                                tmp = helper.findPropInCssText(this.e[i].indexElem.cssText, propVal[0]);

                                if(tmp !== "" && ((!propVal[1]) || (!!propVal[1] && propVal[1].replace(/ |;/g,"") === tmp)))
                                {
                                    matches.push(this.e[i]);
                                }
                            }
                        }
                    }
                    else if(Object.prototype.toString.call(prop) === "[object RegExp]")
                    {
                        for(i = 0; i < this.e.length; i++)
                        {
                            tmp = this.e[i].indexElem.cssText.match(prop);

                            if(!!tmp)
                            {
                                matches.push(this.e[i]);
                            }
                        }
                    }

                    return ruleHandler(matches, sel);
                },
                'update': function()
                {
                    var i, tmp, key;
                    
                    for(i = 0; i < this.e.length; i++)
                    {
                        if(this.e[i].indexElem._update !== false)
                        {
                            tmp = this.e[i].indexElem._update();
                            
                            for(key in tmp)
                            {
                                this.set(key, tmp[key], i);
                            }
                        }
                        
                        for(key in this.e[i].indexElem.style._update)
                        {
                            tmp = this.e[i].indexElem.style._update[key]();
                            this.set(key, tmp, i);
                        }
                    }
                },
                'delete': function(prop)
                {
                    var i;
                    if(typeof prop === "undefined")
                    {
                        for(i = 0; i < this.e.length; i++)
                        {
                            this.e[i].indexElem.parentStyleSheet.deleteRule(this.e[i]);
                            delFromIndex(sel);
                        }
                    }
                    else
                    {
                        for(i = 0; i < elems.length; i++)
                        {
                            elems[i].indexElem.style[prop] = "";
                        }
                    }
                },
                'export': function(type)
                {
                    var exportString = "", i;
                    
                    for(i = 0; i < this.e.length; i++)
                    {
                        exportString += helper.exportParser(this.e[i].indexElem.cssText, type);
                    }
                    
                    return exportString.trim();
                }
            };
        },
        cssc = function(sel, hasProp)
        {
            var ret;
            
            if(Object.prototype.toString.call(sel) === "[object String]")
            {
                var indexElem = getFromIndex(sel);
                
                if(indexElem === null)
                {
                    indexElem = createRule(sel, null, null);
                }

                ret = ruleHandler(indexElem.content, sel);
            }
            else if(Object.prototype.toString.call(sel) === "[object RegExp]")
            {
                var matches = [], key;
                
                for(key in index)
                {
                    if(!!key.match(sel))
                    {
                        for(i = 0; i < index[key].content.length; i++)
                        {
                            matches.push(index[key].content[i]);
                        }
                    }
                }
                
                ret = ruleHandler(matches, sel);
            }
            else if(Object.prototype.toString.call(sel) === "[object Array]")
            {
                var matches = [], i, j, tmp;
                
                for(i = 0; i < sel.length; i++)
                {
                    tmp = getFromIndex(sel[i]);
                    
                    if(tmp !== null)
                    {
                        for(j = 0; j < tmp.content.length; j++)
                        {
                            matches.push(tmp.content[j]);
                        }
                    }
                }
                
                ret = ruleHandler(matches, sel);
            }
            else
            {
                cssc.import(sel);
                
                return;
            }
            
            //return Elements with hasProp
            if(!!hasProp)
            {
                return ret.has(hasProp);
            }
            
            return ret;
        }; 
        cssc.import = function(importObj)
        {
            var importElem, rule, handlerObj;
            for(var key in importObj)
            {
                importElem = importObj[key];
                
                rule = createRule(key, null, null);
                handlerObj = ruleHandler(rule.content, key);
                
                handlerObj.set(importElem);
            }
        },
        cssc.export = function(type)
        {
            var exportString = '', indexElem, i;
            
            for(indexElem in index)
            {
                for(i = 0; i < index[indexElem].content.length; i++)
                {
                    exportString += helper.exportParser(index[indexElem].content[i].indexElem.cssText, type);
                }
            }
            
            return exportString.trim();
        },
        cssc.update = function(sel)
        {
            var handler;
            
            if(!!sel)
            {
                handler = cssc(sel);
                handler.update();
            }
            else
            {
                for(var i in index)
                {
                    handler = ruleHandler(index[i].content);
                    handler.update();
                }
            }
        },
        cssc.ruleType = {
            rule:       1,
            charset:    2,
            import:     3,
            media:      4,
            fontFace:   5,
            page:       6,
            keyframes:  7,
            keyframe:   8,
            
            namespace:      10,
            counterStyle:   11,
            supports:       12,
            
            fontFeatureValues: 14,
            
            names: {
                1:  "rule",
                2:  "charset",
                3:  "import",
                4:  "media",
                5:  "fontFace",
                6:  "page",
                7:  "keyframes",
                8:  "keyframe",
                
                10: "namespace",
                11: "counterStyle",
                12: "supports",
                
                14: "fontFeatureValues"
            }
        };
        cssc.events = {
            beforeChange:   "beforechange",
            change:         "change",
            beforeSet:      "beforeset",
            set:            "set",
            beforeCreate:   "beforecreate",
            create:         "create",
            beforeDelete:   "beforedelete",
            delete:         "delete",
            beforeDestroy:  "beforedestroy",
            destroy:        "destroy"
        };
        cssc.export.type = {
            normal:  'normal',
            ruleRow: 'ruleRow',
            min:      'min'
        };
        cssc.conf = {
            'styleId': "cssc-style"
        };
        
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
    
    if(_debug) csscDebug.cntrl = cntrl;
    
    return cntrl(document.styleSheets, null, true, null);
})();
