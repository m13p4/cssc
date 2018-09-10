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
    
    var cntrl = function(styleSheetsDOM, initOnRun)
    {
        var index   = {},
            isInit  = false,
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
            if("cssRules" in toInit)
            {
                indexCssRules(toInit.cssRules);
            }
            else if("length" in toInit)
            {
                for(var i = 0; i < toInit.length; i++)
                {
                    if(toInit[i].ownerNode.getAttribute('data-cssc-ignore') === "true")
                    {
                        continue;
                    }
                    indexCssRules(toInit[i].cssRules);
                }
            }
        },
        indexCssRules = function(cssRules, indexElem)
        {
            for(var i = 0; i < cssRules.length; i++)
            {
                if(!helper.isElemInOwnNode(cssRules[i]))
                {
                    addToIndex(cssRules[i], indexElem);
                }
            }
        },
        addToIndex = function(cssRule, indexElem)
        {
            var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
                indexType = cssRule.type, 
                toIndex   = cssRule,
                _index    = (!!indexElem ? indexElem : index),
                indexObjWrapper, indexC;
            
            //@todo: support all types
            if(indexType !== cssc.ruleType.rule 
            && indexType !== cssc.ruleType.fontFace 
            && indexType !== cssc.ruleType.media
            && indexType !== cssc.ruleType.keyframes
            && indexType !== cssc.ruleType.keyframe)
            {
                console.log("unsuported type: [" + indexType + "] - " + cssc.ruleType.names[indexType]);
                return;
            }
            
            
            toIndex._update = false;
            if(indexType === cssc.ruleType.rule)
            {
                toIndex.style._update = {};
            }
            
            indexObjWrapper = {
                indexElem: toIndex,
                children: false,
                parent: (!!indexElem ? indexElem : false),
                events: {},
                type: indexType
            };
            
            if(!!_index[indexKey])
            {
                if(_index[indexKey].content[0].indexElem === toIndex)
                {
                    console.log("Dublicate \""+indexKey+"\": ");
                    var a = new Error();
                    console.log(a.stack+"\n\n");
                }
                
                indexC = (_index[indexKey].content.push(indexObjWrapper) - 1);
            }
            else
            {
                _index[indexKey] = {
                    type: indexType,
                    content: [indexObjWrapper],
                    events: {}
                };
                
                indexC = 0;
            }
            
            //handle Media & KeyFrames Rules
            if(indexType === cssc.ruleType.media || indexType === cssc.ruleType.keyframes)
            {
                _index[indexKey].content[indexC].children = {};
                indexCssRules(cssRule.cssRules, _index[indexKey].content[indexC].children, false);
            }
            
            return _index[indexKey];
        },
        createRule = function(selector, property, value, appendTo, indexElem)
        {
            var appendToElem;
            
            if(!appendTo && !ownStyleElem)
            {
                helper.createNewStyleElem();
            }
            appendToElem = !!appendTo ? appendTo : ownStyleElem.sheet;
            
            
            var rulePos = appendToElem.cssRules.length,
                ruleString = "";
        
            if(!!property)
            {
                var propType = helper.elemType(property);
                
                if(propType === "Object")
                {
                    var prop;
                    
                    for(var key in property)
                    {
                        if(helper.elemType(property[key]) === "Function")
                        {
                            prop = property[key]();
                            
                            ruleString += key+":"+prop+"; ";
                        }
                        else
                        {
                            ruleString += key+":"+property[key]+"; ";
                        }
                    }
                }
                else if(propType === "Function")
                {
                    var prop = property();
                    
                    for(var key in prop)
                    {
                        ruleString += key+":"+prop[key]+"; ";
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
            
            return addToIndex(appendToElem.cssRules[rulePos], indexElem);
        },
        getFromIndex = function(sel, indexElem)
        {
            if(!isInit) init();
            
            var _index = !!indexElem ? indexElem : index;

            return !!_index[sel] ? _index[sel] : null;
        },
        delFromIndex = function(sel, indexElem)
        {
            var _index = !!indexElem ? indexElem : index;
            
            if(!!_index[sel])
            {
                delete _index[sel];
            }
        },
        getHandler = function(sel, indexElem, getElements)
        {
            var _index = !!indexElem ? indexElem : index,
                selType = helper.elemType(sel); 

            if(selType === "String")
            {
                var iElem = getFromIndex(sel, _index);

                if(!!getElements)
                {
                    return (!!iElem ? iElem.content : []);
                }
                return ruleHandler((!!iElem ? iElem.content : []), sel);
            }
            else if(selType === "RegExp")
            {
                var matches = [], key;

                for(key in _index)
                {
                    if(!!key.match(sel))
                    {
                        for(i = 0; i < _index[key].content.length; i++)
                        {
                            matches.push(_index[key].content[i]);
                        }
                    }
                }

                if(!!getElements)
                {
                    return matches;
                }

                return ruleHandler(matches, sel);
            }
            else if(selType === "Array")
            {
                var matches = [], i, j, tmp;

                for(i = 0; i < sel.length; i++)
                {
                    tmp = getFromIndex(sel[i], _index);

                    if(tmp !== null)
                    {
                        for(j = 0; j < tmp.content.length; j++)
                        {
                            matches.push(tmp.content[j]);
                        }
                    }
                }

                if(!!getElements)
                {
                    return matches;
                }

                return ruleHandler(matches, sel);
            }
            else if(selType === "Null" || selType === "Undefined")
            {
                var matches = [], key;

                for(key in _index)
                {
                    for(i = 0; i < _index[key].content.length; i++)
                    {
                        matches.push(_index[key].content[i]);
                    }
                }

                if(!!getElements)
                {
                    return matches;
                }

                return ruleHandler(matches, sel);
            }

            return null;
        },
        handleSelection = function(sel, hasProp, indexElem, getElements)
        {
            var ret, selType = helper.elemType(sel);

            if(selType === "String" 
            || selType === "RegExp"
            || selType === "Array"
            || selType === "Null"
            || selType === "Undefined")
            {
                ret = getHandler(sel, indexElem, getElements);
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
        },
        ruleHandler = function(indexElemArr, sel, fromHas, parents)
        {
            var handler = function(sel, hasProp)
            {
                var i, j, elArr = [], tmp;
                for(i = 0; i < handler.e.length; i++)
                {
                    if(!!handler.e[i].children)
                    {
                        tmp = handleSelection(sel, hasProp, handler.e[i].children, true);
                        
                        for(j = 0; j < tmp.length; j++)
                        {
                            elArr.push(tmp[j]);
                        }
                    }
                }
                
                return ruleHandler(elArr, sel, null, handler.e);
            };
            
            handler.e = indexElemArr;
            handler.eLength = indexElemArr.length;
            
            handler.set = function(prop, val, pos)
            {
                if(typeof pos === "number") // single Set
                {
                    //can not change font-face values on Firefox..
                    if(this.e[pos].indexElem.type === cssc.ruleType.fontFace)
                    {
                        console.log("Element of Type \""+cssc.ruleType.names[this.e[pos].indexElem.type]+"\" is readonly.");

                        return this;
                    }

                    if(!!this.e[pos].children)
                    {
                        var childHandler = getHandler(null, this.e[pos].children);
                        childHandler.set(prop, val);
                    }
                    else if(helper.elemType(val) === "Function")
                    {
                        var oldVal = helper.findPropInCssText(this.e[pos].indexElem.cssText, prop),
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
                    var i, propLen, key, props,
                        propType = helper.elemType(prop);

                    if(propType === "Object")
                    {
                        propLen = Object.keys(prop).length;
                    }
                    else if(propType === "Function")
                    {
                        props = prop();
                    }
                    
                    //create new Element
                    if(this.e.length <= 0 && !fromHas 
                       && helper.elemType(sel) === "String"
                    )
                    {
                        var rule, contentElems = [];
                        
                        if(!parents)
                        {
                            rule = createRule(sel, null, null);
                            contentElems = rule.content;
                        }
                        else
                        {
                            var contentElems = [];
                            
                            for(i = 0; i < parents.length; i++)
                            {
                                rule = createRule(sel, null, null, parents[i].indexElem, parents[i].children);
                                
                                for(key = 0; key < rule.content.length; key++)
                                {
                                    contentElems.push(rule.content[key]);
                                }
                            }
                        }
                        
                        this.e = contentElems;
                        this.eLength = contentElems.length;
                    }
                    
                    for(i = 0; i < this.e.length; i++)
                    {
                        if(propType === "Object" && propLen > 0) 
                        {
                            for(key in prop)
                            {
                                this.set(key, prop[key], i);
                            }
                        }
                        else if(propType === "Function")
                        {
                            for(key in props)
                            {
                                this.set(key, props[key], i);
                            }

                            //add to updatable
                            this.e[i].indexElem._update = prop;
                        }
                        else
                        {
                            this.set(prop, val, i);
                        }
                    }
                }

                return this;
            };
            handler.get = function(prop, returnAllProps)
            {
                var arrToRet = [], propToRet = "", tmp, i;

                returnAllProps = !!returnAllProps;

                for(i = 0; i < this.e.length; i++)
                {
                    tmp = this.e[i].indexElem.style[prop];
                    
                    //use helper, if property value not found in style object (margin, padding, border, etc..)
                    if(!tmp || tmp === "")
                    { 
                        tmp = helper.findPropInCssText(this.e[i].indexElem.cssText, prop);
                    }

                    if(!!tmp)
                    {
                        propToRet = tmp;

                        if(returnAllProps) arrToRet.push(propToRet);
                    }
                }
                return returnAllProps ? arrToRet : propToRet;
            };
            handler.has = function(prop)
            {
                var matches = [], propVal, i, tmp,
                    propType = helper.elemType(prop);

                if(propType === "String")
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
                else if(propType === "Array")
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
                else if(propType === "RegExp")
                {
                    var m, j;

                    for(i = 0; i < this.e.length; i++)
                    {
                        m = this.e[i].indexElem.cssText.match(/[\S]+:.+?;/g);

                        if(!!m)
                        {
                            for(j = 0; j < m.length; j++)
                            {
                                tmp = m[j].match(prop);

                                if(!!tmp)
                                {
                                    matches.push(this.e[i]);
                                }
                            }
                        }
                    }
                }

                return ruleHandler(matches, sel, true);
            };
            handler.update = function()
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

                    if(!!this.e[i].children)
                    {
                        var childHandler = getHandler(null, this.e[i].children);
                        childHandler.update();
                    }
                    else
                    {
                        for(key in this.e[i].indexElem.style._update)
                        {
                            tmp = this.e[i].indexElem.style._update[key]();
                            this.set(key, tmp, i);
                        }
                    }
                }
                return this;
            };
            handler.delete = function(prop)
            {
                var i;
                if(typeof prop === "undefined")
                {
                    for(i = 0; i < this.e.length; i++)
                    {
                        if(!!this.e[i].indexElem.parentRule)
                        {
                            this.e[i].indexElem.parentRule.deleteRule(this.e[i]);
                        }
                        else
                        {
                            this.e[i].indexElem.parentStyleSheet.deleteRule(this.e[i]);
                        }
                        
                        delFromIndex(sel, (!!this.e[i].parent ? this.e[i].parent : null));

                        if(!!this.e[i].children)
                        {
                            var childHandler = getHandler(null, this.e[i].children);
                            childHandler.delete(prop);
                        }
                    }
                }
                else
                {
                    for(i = 0; i < this.e.length; i++)
                    {
                        this.e[i].indexElem.style[prop] = "";

                        if(!!this.e[i].children)
                        {
                            var childHandler = getHandler(null, this.e[i].children);
                            childHandler.delete(prop);
                        }
                    }
                }
                return this;
            };
            handler.export = function(type)
            {
                var exportString = "", i;

                for(i = 0; i < this.e.length; i++)
                {
                    exportString += helper.exportParser(this.e[i].indexElem.cssText, type);
                }

                return exportString.trim();
            };
            
            return handler;
        },
        helper = {
            elemType: function(elem, returnFullValue)
            {
                if(returnFullValue) return Object.prototype.toString.call(elem);
                return Object.prototype.toString.call(elem).replace(/(^\[.+\s|\]$)/g,"");
            },
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
                else
                {
                    var v = value.split(" ");
                    
                    if(v.length > 0)
                    {
                        var tmp;
                        
                        for(var i = 0; i < v.length; i++)
                        {
                            if(isFinite(v[i]))
                            {
                                tmp = v[i];

                                if(tmp%1 === 0) 
                                    v[i] = tmp + "px";
                                else            
                                    v[i] = (Math.floor(tmp * 100) / 100) + "px";
                            }
                        }
                        
                        return v.join(" ");
                    }
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
                    return cssText.replace(/\n/g, "")+"\n";
                }
                else if(type === cssc.export.type.min)
                {
                    return cssText.replace(/(;|:|\s*?{|}|,)\s+/g,function(p)
                    {
                        return p.trim();
                    });
                }
                else //Normal
                {
                    var tab = "    ";
                    
                    if(cssText.match(/^@(media|keyframes)/))
                    {
                        return cssText.replace(/^(.*){([\s\S]*)}$/, function(m, s, r)
                        {
                            return s + "\n{\n" + tab + r.trim().replace(/({|}|;)\s*/g, function(p)
                            {
                                p = p.trim();
                                
                                if(p === "{")
                                    return "\n" + tab + "{\n" + tab + tab;
                                else if(p === "}")
                                    return "}\n" + tab;
                                else if(p === ";")
                                    return ";\n" + tab + tab;
                            }).replace(/\s+}/g, "\n" + tab + "}").trim() + "\n}\n";
                        });
                    }
                    else return cssText.replace(/({|}|;)\s*/g, function(p)
                    { 
                        p = p.trim();

                        if(p === "{")
                            return "\n" + p + "\n" + tab;
                        else if(p === "}")
                            return p + "\n";
                        else if(p === ";")
                            return p + "\n" + tab;
                    }).replace(/\s+}/, "\n}");
                }
            }
        },
        cssc = function(sel, hasProp)
        {
            return handleSelection(sel, hasProp);
        }; 
        cssc.import = function(importObj)
        {
            var importElem, rule, handlerObj, key, i, j,
                cImportElem, cRule, cHandlerObj, cKey, cPos;
            
            for(key in importObj)
            {
                if(helper.elemType(importObj[key]) === "Array")
                    importElem = importObj[key];
                else
                    importElem = [importObj[key]];
                
                for(i = 0; i < importElem.length; i++)
                {
                    if(key === "@font-face")
                    {
                        createRule(key, importElem[i], null);
                    }
                    else if(key.match(/^@(media|keyframes)/))
                    {
                        rule = createRule(key, null, null);
                        handlerObj = ruleHandler(rule.content, key);

                        cPos = rule.content.length - 1;
                        
                        for(cKey in importElem[i])
                        {
                            if(helper.elemType(importElem[i][cKey]) === "Array")
                                cImportElem = importElem[i][cKey];
                            else
                                cImportElem = [importElem[i][cKey]];
                            
                            for(j = 0; j < cImportElem.length; j++)
                            {
                                cRule = createRule(cKey, null, null, rule.content[cPos].indexElem, rule.content[cPos].children);
                                cHandlerObj = ruleHandler(cRule.content, cKey);
                                
                                cHandlerObj.set(cImportElem[j]);
                            }
                        }
                    }
                    else
                    {
                        rule = createRule(key, null, null);
                        handlerObj = ruleHandler(rule.content, key);

                        handlerObj.set(importElem[i]);
                    }
                }
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
            'rule':       1, //check
            'charset':    2,
            'import':     3,
            'media':      4, //check
            'fontFace':   5, //check
            'page':       6,
            'keyframes':  7, //check
            'keyframe':   8, //check
            
            'namespace':      10,
            'counterStyle':   11,
            'supports':       12,
            
            'fontFeatureValues': 14,
            
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
            'beforeChange':   "beforechange",
            'change':         "change",
            'beforeSet':      "beforeset",
            'set':            "set",
            'beforeCreate':   "beforecreate",
            'create':         "create",
            'beforeDelete':   "beforedelete",
            'delete':         "delete",
            'beforeDestroy':  "beforedestroy",
            'destroy':        "destroy"
        };
        cssc.export.type = {
            'normal':  'normal',
            'ruleRow': 'ruleRow',
            'min':     'min'
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
    
    return cntrl(document.styleSheets, true);
})();
